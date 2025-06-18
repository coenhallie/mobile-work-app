import { ref, reactive } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { formatDisplayName } from '@/lib/nameFormatter';
import { favoriteContractorIds } from '@/composables/useFavoriteContractors';

export function useContractorData() {
  const { getSupabaseClient, userId } = useAuth(); // Add userId
  const supabase = getSupabaseClient();

  // State
  const contractors = ref([]);
  const isLoading = ref(false);
  const hasMore = ref(true);
  const totalCount = ref(0);
  const currentPage = ref(0);
  const pageSize = 20;

  // Cache for performance
  const cache = new Map();
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Apply filters to Supabase query
  const applyFilters = (query, filters) => {
    // Search filter
    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`
      );
    }

    // Service type filter
    if (filters.serviceType) {
      query = query.overlaps('skills', [filters.serviceType]);
    }

    // Location filter using service_areas
    if (filters.location) {
      query = query.overlaps('service_areas', [filters.location]);
    }

    // Rating filter
    if (filters.minRating) {
      query = query.gte('average_rating', parseFloat(filters.minRating));
    }

    // Favorite contractors filter
    if (filters.showFavoritesOnly && userId.value) {
      // favoriteContractorIds is a computed that returns a ref, so we need .value.value
      const favIds =
        favoriteContractorIds.value?.value || favoriteContractorIds.value;
      const favIdsArray =
        favIds instanceof Set ? Array.from(favIds) : Array.from(favIds || []);

      if (favIdsArray.length > 0) {
        query = query.in('id', favIdsArray);
      } else {
        // If show favorites is on but there are no favorites, return no results
        // by creating a condition that's always false (e.g., matching a non-existent UUID).
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    // Availability filter
    if (filters.availableNow) {
      query = query.eq('availability_status', 'available');
      // Also filter out contractors who are busy until a future time
      query = query.or('busy_until.is.null,busy_until.lt.now()');
    }

    // Sorting
    const sortField = getSortField(filters.sortBy || 'rating');
    const ascending = filters.sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    return query;
  };

  // Get sort field mapping
  const getSortField = (sortBy) => {
    switch (sortBy) {
      case 'rating':
        return 'average_rating';
      case 'experience':
        return 'years_experience';
      case 'name':
        return 'full_name';
      case 'distance':
        return 'service_areas'; // Placeholder
      default:
        return 'average_rating';
    }
  };

  // Transform contractor data
  const transformContractorData = (contractors) => {
    return contractors.map((contractor) => ({
      id: contractor.id,
      name: formatDisplayName(contractor.full_name),
      bio: contractor.bio,
      skills: contractor.skills || [],
      primarySkill: contractor.skills?.[0] || 'General Services',
      rating: contractor.average_rating || 4.5,
      location: contractor.service_areas?.[0] || 'Lima',
      profileImageUrl: contractor.profile_picture_url,
      yearsExperience: contractor.years_experience,
      contactPhone: contractor.contact_phone,
      // Availability data
      availabilityStatus: contractor.availability_status || 'available',
      availabilityMessage: contractor.availability_message,
      availabilityUpdatedAt: contractor.availability_updated_at,
      workingHours: contractor.working_hours,
      busyUntil: contractor.busy_until,
      autoAvailability: contractor.auto_availability,
      // Computed availability
      isCurrentlyAvailable: isContractorCurrentlyAvailable(contractor),
    }));
  };

  // Helper function to determine if contractor is currently available
  const isContractorCurrentlyAvailable = (contractor) => {
    // Check basic availability status
    if (contractor.availability_status !== 'available') {
      return false;
    }

    // Check if busy until a future time
    if (contractor.busy_until && new Date(contractor.busy_until) > new Date()) {
      return false;
    }

    // Check working hours if they exist
    if (contractor.working_hours) {
      const now = new Date();
      const currentDay = now
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      const daySchedule = contractor.working_hours[currentDay];
      if (daySchedule && !daySchedule.enabled) {
        return false;
      }

      if (daySchedule && daySchedule.start && daySchedule.end) {
        if (currentTime < daySchedule.start || currentTime > daySchedule.end) {
          return false;
        }
      }
    }

    return true;
  };

  // Load contractors with filters
  const loadContractors = async (filters = {}) => {
    try {
      isLoading.value = true;
      currentPage.value = 0;

      // Check cache first
      const cacheKey = JSON.stringify({ filters, page: 0, pageSize });
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        contractors.value = cached.data.contractors;
        totalCount.value = cached.data.totalCount;
        hasMore.value = cached.data.hasMore;
        return cached.data;
      }

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
          availability_status,
          availability_message,
          availability_updated_at,
          working_hours,
          busy_until,
          auto_availability
        `
        )
        .eq('role', 'contractor')
        .range(0, pageSize - 1);

      query = applyFilters(query, filters);

      const { data, error } = await query;

      if (error) throw error;

      // Get total count
      let countQuery = supabase
        .from('contractor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'contractor');

      countQuery = applyFilters(countQuery, filters);
      const { count } = await countQuery;

      const transformedData = transformContractorData(data || []);

      const result = {
        contractors: transformedData,
        totalCount: count || 0,
        hasMore: data && data.length === pageSize,
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      contractors.value = result.contractors;
      totalCount.value = result.totalCount;
      hasMore.value = result.hasMore;
      currentPage.value = 1;

      return result;
    } catch (error) {
      console.error('Error loading contractors:', error);
      contractors.value = [];
      totalCount.value = 0;
      hasMore.value = false;
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Load more contractors for infinite scroll
  const loadMoreContractors = async (filters = {}) => {
    if (!hasMore.value || isLoading.value) return;

    try {
      isLoading.value = true;

      const cacheKey = JSON.stringify({
        filters,
        page: currentPage.value,
        pageSize,
      });
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        contractors.value.push(...cached.data.contractors);
        hasMore.value = cached.data.hasMore;
        currentPage.value++;
        return cached.data;
      }

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
          availability_status,
          availability_message,
          availability_updated_at,
          working_hours,
          busy_until,
          auto_availability
        `
        )
        .eq('role', 'contractor')
        .range(
          currentPage.value * pageSize,
          (currentPage.value + 1) * pageSize - 1
        );

      query = applyFilters(query, filters);

      const { data, error } = await query;

      if (error) throw error;

      const transformedData = transformContractorData(data || []);

      const result = {
        contractors: transformedData,
        hasMore: data && data.length === pageSize,
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      contractors.value.push(...result.contractors);
      hasMore.value = result.hasMore;
      currentPage.value++;

      return result;
    } catch (error) {
      console.error('Error loading more contractors:', error);
      hasMore.value = false;
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Reset contractors list
  const resetContractors = () => {
    contractors.value = [];
    currentPage.value = 0;
    hasMore.value = true;
    totalCount.value = 0;
  };

  // Clear cache
  const clearCache = () => {
    cache.clear();
  };

  return {
    contractors,
    isLoading,
    hasMore,
    totalCount,
    loadContractors,
    loadMoreContractors,
    resetContractors,
    clearCache,
  };
}
