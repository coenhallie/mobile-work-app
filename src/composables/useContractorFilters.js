import { ref, computed, watch } from 'vue';
import { useAuth } from './useAuth';
import { useGeolocation } from './useGeolocation';
import { favoriteContractorIds } from './useFavoriteContractors';

export function useContractorFilters() {
  const { getSupabaseClient, userId } = useAuth(); // Add userId
  const supabase = getSupabaseClient();
  // favoriteContractorIds is now directly imported
  const {
    currentPosition,
    getCurrentPosition,
    calculateDistance,
    getContractorsByDistance,
    requestPermissions,
    checkSupport,
  } = useGeolocation();

  // Filter state
  const filters = ref({
    search: '',
    services: [],
    locations: [],
    minRating: null,
    sortBy: 'rating',
    sortOrder: 'desc',
    showFavoritesOnly: false,
  });

  // UI state
  const isLoading = ref(false);
  const resultCount = ref(0);

  // Performance and caching
  const cache = ref(new Map());
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes
  const requestQueue = ref(new Map());

  // Debouncing for search
  let searchDebounceTimer = null;
  const searchDebounceDelay = 300;

  // Analytics and smart suggestions
  const filterUsageStats = ref({});
  const smartSuggestions = ref([]);
  const conflictingFilters = ref([]);

  // Computed properties
  const hasActiveFilters = computed(() => {
    return (
      filters.value.search ||
      filters.value.services.length > 0 ||
      filters.value.locations.length > 0 ||
      filters.value.minRating ||
      filters.value.showFavoritesOnly
    );
  });

  const activeFilterCount = computed(() => {
    let count = 0;
    if (filters.value.search) count++;
    if (filters.value.services.length) count++;
    if (filters.value.locations.length) count++;
    if (filters.value.minRating) count++;
    if (filters.value.showFavoritesOnly) count++;
    return count;
  });

  // Methods
  const updateFilter = (type, value) => {
    if (type === 'search') {
      filters.value.search = value;
    } else if (type === 'services') {
      filters.value.services = Array.isArray(value) ? value : [value];
    } else if (type === 'locations') {
      filters.value.locations = Array.isArray(value) ? value : [value];
    } else {
      filters.value[type] = value;
    }
  };

  const removeFilter = ({ type, value }) => {
    if (type === 'services') {
      filters.value.services = filters.value.services.filter(
        (s) => s !== value
      );
    } else if (type === 'locations') {
      filters.value.locations = filters.value.locations.filter(
        (l) => l !== value
      );
    } else {
      filters.value[type] = null;
    }
  };

  const clearAllFilters = () => {
    filters.value = {
      search: '',
      services: [],
      locations: [],
      minRating: null,
      sortBy: 'rating', // Reset to default sort
      sortOrder: 'desc',
      showFavoritesOnly: false,
    };
  };

  const applyFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const getSortField = (sortBy) => {
    switch (sortBy) {
      case 'rating':
        return 'average_rating';
      case 'experience':
        return 'years_experience'; // This field might be removed from filters object later
      case 'name':
        return 'full_name';
      case 'distance':
        return null; // Will be handled by client-side distance calculation
      default:
        return 'average_rating';
    }
  };

  // Build optimized Supabase query with filters and efficient search
  const buildOptimizedQuery = (baseQuery, includeCount = false) => {
    let query = baseQuery;

    // Optimized search filter using indexed fields
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase().trim();
      if (searchTerm) {
        // Use text search on indexed full_name field first, then bio
        query = query.or(
          `full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`
        );
      }
    }

    // Services filter using overlaps (already efficient)
    if (filters.value.services.length > 0) {
      query = query.overlaps('skills', filters.value.services);
    }

    // Location filter - handle both manual districts and GPS-based filtering
    if (
      filters.value.selectedDistricts &&
      filters.value.selectedDistricts.length > 0
    ) {
      query = query.overlaps('service_areas', filters.value.selectedDistricts);
    }

    // Legacy location filter support
    if (filters.value.locations && filters.value.locations.length > 0) {
      query = query.overlaps('service_areas', filters.value.locations);
    }

    // Rating filter using GTE (efficient for indexed rating field)
    if (filters.value.minRating) {
      query = query.gte('average_rating', filters.value.minRating);
    }

    // Note: Availability filter removed - column doesn't exist in database
    // if (filters.value.availability) {
    //   query = query.eq('availability', filters.value.availability);
    // }

    // Favorites filter
    if (filters.value.showFavoritesOnly && userId.value) {
      const favIds = Array.from(favoriteContractorIds.value);
      if (favIds.length > 0) {
        query = query.in('id', favIds);
      } else {
        // If show favorites is on but there are no favorites, return no results
        // by creating a condition that's always false.
        query = query.eq('id', 'non-existent-uuid'); // Ensures no rows are returned
      }
    }

    return query;
  };

  // Build complete query with filters and sorting
  const buildCompleteQuery = (baseQuery) => {
    let query = buildOptimizedQuery(baseQuery);

    // Apply sorting (skip distance sorting as it's handled client-side)
    const sortField = getSortField(filters.value.sortBy);
    if (sortField) {
      const ascending = filters.value.sortOrder === 'asc';
      query = query.order(sortField, { ascending });
    }

    return query;
  };

  // Optimized count query using efficient counting
  const getFilteredCount = async () => {
    try {
      let query = supabase
        .from('contractor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'contractor');

      query = buildOptimizedQuery(query);

      const { count, error } = await query;

      if (error) throw error;

      resultCount.value = count || 0;
      return count || 0;
    } catch (error) {
      console.error('Error getting filtered count:', error);
      resultCount.value = 0;
      return 0;
    }
  };

  // Optimized contractors fetch with single query
  const getFilteredContractors = async (page = 0, pageSize = 30) => {
    try {
      isLoading.value = true;

      // Single optimized query with pagination
      let query = supabase
        .from('contractor_profiles')
        .select(
          `
          id,
          full_name,
          bio,
          skills,
          average_rating,
          service_areas,
          profile_picture_url,
          years_experience,
          contact_phone,
          latitude,
          longitude
        `
        )
        .eq('role', 'contractor')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      query = buildCompleteQuery(query);

      const { data, error } = await query;

      if (error) throw error;

      let contractors = data || [];

      // Apply distance-based sorting and filtering if needed
      if (filters.value.sortBy === 'distance') {
        const userPosition = filters.value.gpsLocation || currentPosition.value;
        if (userPosition) {
          contractors = getContractorsByDistance(contractors, userPosition);

          // Apply GPS radius filtering if specified
          if (
            filters.value.gpsRadius &&
            filters.value.locationType !== 'manual'
          ) {
            contractors = contractors.filter((contractor) => {
              return (
                contractor.distance !== undefined &&
                contractor.distance <= filters.value.gpsRadius
              );
            });
          }
        }
      }

      // Only get count on first page to avoid dual queries
      if (page === 0) {
        await getFilteredCount();
      }

      return {
        contractors,
        hasMore: data && data.length === pageSize,
        totalCount: resultCount.value,
      };
    } catch (error) {
      console.error('Error getting filtered contractors:', error);
      return {
        contractors: [],
        hasMore: false,
        totalCount: 0,
      };
    } finally {
      isLoading.value = false;
    }
  };

  // Get dynamic filter options from database
  const getFilterOptions = async () => {
    try {
      // Get unique services/skills
      const { data: skillsData } = await supabase
        .from('contractor_profiles')
        .select('skills')
        .eq('role', 'contractor')
        .not('skills', 'is', null);

      const allSkills = new Set();
      skillsData?.forEach((contractor) => {
        contractor.skills?.forEach((skill) => allSkills.add(skill));
      });

      // Get unique service areas (districts)
      const { data: serviceAreasData } = await supabase
        .from('contractor_profiles')
        .select('service_areas')
        .eq('role', 'contractor')
        .not('service_areas', 'is', null);

      const allDistricts = new Set();
      serviceAreasData?.forEach((contractor) => {
        contractor.service_areas?.forEach((area) => allDistricts.add(area));
      });

      return {
        services: Array.from(allSkills).sort(),
        locations: Array.from(allDistricts).sort(),
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        services: [],
        locations: [],
      };
    }
  };

  // Debounced search function
  const debouncedSearch = (searchTerm) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      filters.value.search = searchTerm;
    }, searchDebounceDelay);
  };

  // Watch for filter changes and update count (debounced)
  let updateCountTimeout;
  watch(
    () => filters.value,
    () => {
      clearTimeout(updateCountTimeout);
      updateCountTimeout = setTimeout(() => {
        getFilteredCount();
      }, 300);
    },
    { deep: true }
  );

  // Advanced caching system
  const getCacheKey = (currentFilters, page = 0, pageSize = 30) => {
    // Ensure consistent key by sorting array filters if necessary
    const stableFilters = { ...currentFilters };
    if (stableFilters.services)
      stableFilters.services = [...stableFilters.services].sort();
    if (stableFilters.locations)
      stableFilters.locations = [...stableFilters.locations].sort();
    // Ensure showFavoritesOnly is part of the key
    return JSON.stringify({
      filters: stableFilters,
      page,
      pageSize,
      showFavorites: filters.value.showFavoritesOnly,
    });
  };

  const getCachedResult = (key) => {
    const cached = cache.value.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }
    cache.value.delete(key);
    return null;
  };

  const setCachedResult = (key, data) => {
    cache.value.set(key, {
      data,
      timestamp: Date.now(),
    });

    if (cache.value.size > 50) {
      // Prune cache
      const oldestKey = cache.value.keys().next().value;
      cache.value.delete(oldestKey);
    }
  };

  // Smart filter suggestions (can be simplified or removed later)
  const generateSmartSuggestions = () => {
    // ... (implementation can be simplified or removed based on filter reduction)
    smartSuggestions.value = []; // Placeholder
  };

  // Filter conflict detection (can be simplified or removed later)
  const detectFilterConflicts = () => {
    // ... (implementation can be simplified or removed)
    conflictingFilters.value = []; // Placeholder
  };

  const trackFilterUsage = () => {
    // Basic tracking, can be expanded
    try {
      const usage = JSON.parse(
        localStorage.getItem('filter-usage-stats') || '{}'
      );
      Object.keys(filters.value).forEach((key) => {
        if (
          filters.value[key] &&
          (!Array.isArray(filters.value[key]) || filters.value[key].length > 0)
        ) {
          const filterKey = `filter_${key}`;
          usage[filterKey] = (usage[filterKey] || 0) + 1;
        }
      });
      localStorage.setItem('filter-usage-stats', JSON.stringify(usage));
      filterUsageStats.value = usage;
    } catch (e) {
      console.error('Error tracking filter usage:', e);
    }
  };

  // Enhanced contractor fetching with optimized caching
  const getFilteredContractorsWithCache = async (page = 0, pageSize = 30) => {
    const cacheKey = getCacheKey(filters.value, page, pageSize);

    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      // Apply distance sorting and filtering to cached results if needed
      if (filters.value.sortBy === 'distance') {
        const userPosition = filters.value.gpsLocation || currentPosition.value;
        if (userPosition) {
          let contractors = getContractorsByDistance(
            cachedResult.contractors,
            userPosition
          );

          // Apply GPS radius filtering if specified
          if (
            filters.value.gpsRadius &&
            filters.value.locationType !== 'manual'
          ) {
            contractors = contractors.filter((contractor) => {
              return (
                contractor.distance !== undefined &&
                contractor.distance <= filters.value.gpsRadius
              );
            });
          }

          return {
            ...cachedResult,
            contractors,
          };
        }
      }
      return cachedResult;
    }

    if (requestQueue.value.has(cacheKey)) {
      return requestQueue.value.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        isLoading.value = true;

        // Single optimized query
        let query = supabase
          .from('contractor_profiles')
          .select(
            `
            id,
            full_name,
            bio,
            skills,
            average_rating,
            service_areas,
            profile_picture_url,
            years_experience,
            contact_phone,
            latitude,
            longitude
          `
          )
          .eq('role', 'contractor')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        query = buildCompleteQuery(query);

        const { data, error } = await query;

        if (error) throw error;

        let contractors = data || [];

        // Apply distance-based sorting and filtering if needed
        if (filters.value.sortBy === 'distance') {
          const userPosition =
            filters.value.gpsLocation || currentPosition.value;
          if (userPosition) {
            contractors = getContractorsByDistance(contractors, userPosition);

            // Apply GPS radius filtering if specified
            if (
              filters.value.gpsRadius &&
              filters.value.locationType !== 'manual'
            ) {
              contractors = contractors.filter((contractor) => {
                return (
                  contractor.distance !== undefined &&
                  contractor.distance <= filters.value.gpsRadius
                );
              });
            }
          }
        }

        // Only get count on first page
        if (page === 0) {
          await getFilteredCount();
        }

        const result = {
          contractors,
          hasMore: data && data.length === pageSize,
          totalCount: resultCount.value,
        };

        setCachedResult(cacheKey, result);
        trackFilterUsage();
        return result;
      } catch (err) {
        console.error('Error in getFilteredContractorsWithCache:', err);
        throw err;
      } finally {
        isLoading.value = false;
        requestQueue.value.delete(cacheKey);
      }
    })();

    requestQueue.value.set(cacheKey, requestPromise);
    return requestPromise;
  };

  // Initial call to generate suggestions if needed
  // generateSmartSuggestions();
  // detectFilterConflicts();

  // Request location for nearby filtering
  const requestLocationForNearby = async () => {
    try {
      await checkSupport();
      const hasPermission = await requestPermissions();

      if (hasPermission) {
        await getCurrentPosition();
        return true;
      } else {
        console.warn('Location permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      return false;
    }
  };

  return {
    filters,
    isLoading,
    resultCount,
    hasActiveFilters,
    activeFilterCount,
    updateFilter,
    removeFilter,
    clearAllFilters,
    applyFilters,
    debouncedSearch,
    getFilteredContractors: getFilteredContractorsWithCache,
    getFilterOptions,
    smartSuggestions,
    conflictingFilters,
    // Geolocation methods
    currentPosition,
    requestLocationForNearby,
    calculateDistance,
  };
}
