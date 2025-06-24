<template>
  <div
    class="w-full max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen flex flex-col"
    v-show="isComponentVisible"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        {{ $t('services.whatServiceDoYouNeed') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        {{ $t('services.browseCategoriesDescription') }}
      </p>
    </div>

    <!-- Search and Filter Controls -->
    <div
      class="mb-6 flex gap-2 items-center sticky top-0 bg-white dark:bg-gray-900 py-2 z-20"
    >
      <Input
        v-model="searchQuery"
        :placeholder="$t('services.searchAllServicesPlaceholder')"
        class="flex-grow !bg-white !text-gray-900 !border-gray-300 placeholder:!text-gray-500 dark:!bg-gray-800 dark:!text-gray-100 dark:!border-gray-600 dark:placeholder:!text-gray-400"
        type="text"
      />
      <div class="relative">
        <Button
          @click="isFilterSheetOpen = true"
          variant="outline"
          class="relative !bg-white !text-gray-900 !border-gray-300 hover:!bg-gray-50 dark:!bg-gray-800 dark:!text-gray-100 dark:!border-gray-600 dark:hover:!bg-gray-700"
        >
          <!-- Filter Icon Placeholder -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon
              points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
            ></polygon>
          </svg>
          <span
            v-if="activeFilters.categoryId"
            class="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
          >
            {{
              allCategories.find((c) => c.id === activeFilters.categoryId)
                ?.name_es
            }}
          </span>
        </Button>
      </div>
    </div>

    <!-- Bottom Sheet Filter -->
    <ServiceBottomSheetFilter
      v-model="isFilterSheetOpen"
      :filters="activeFilters"
      :categories="allCategories"
      :loading="isLoading"
      :result-count="displayedItems.length"
      @apply="handleApplyFilters"
      @clear="handleClearFilters"
    />

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md"
    >
      <p class="text-destructive text-sm">{{ errorMessage }}</p>
      <Button variant="outline" size="sm" @click="retryDataFetch" class="mt-2">
        Retry
      </Button>
    </div>

    <!-- Main Content Area: Categories or Services Grid -->
    <div
      class="flex-grow overflow-y-auto"
      ref="scrollContainer"
      @scroll="handleScroll"
    >
      <!-- Loading Skeleton -->
      <div
        v-if="isLoading"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <div v-for="i in 8" :key="`skeleton-${i}`">
          <BaseSkeleton layout="category" />
        </div>
      </div>

      <!-- Display Area -->
      <div v-else>
        <!-- Iterating over displayedItems structure -->
        <template
          v-for="(item, index) in displayedItems"
          :key="item.type + '-' + (item.id || index)"
        >
          <!-- Category Header -->
          <div v-if="item.type === 'category_header'" class="mb-6 p-1">
            <div
              class="relative rounded-xl overflow-hidden shadow-xl h-48 md:h-64 group"
            >
              <img
                :src="item.background_image_url"
                :alt="item.name_en"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
              ></div>
              <div class="relative z-10 flex flex-col justify-end h-full p-6">
                <h3
                  class="text-3xl md:text-4xl font-normal text-white text-shadow"
                >
                  {{ item.name_es }}
                </h3>
              </div>
            </div>
            <p
              v-if="searchQuery && activeFilters.categoryId"
              class="mt-3 text-sm text-muted-foreground"
            >
              Showing search results for "{{ searchQuery }}" in
              {{ item.name_es }}:
            </p>
          </div>

          <!-- Service List Grid -->
          <div
            v-if="item.type === 'service_list' && item.services.length > 0"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-1"
            :class="{
              'pt-2': displayedItems.find(
                (i) => i.type === 'category_header' && index > 0
              ),
            }"
          >
            <ServiceCard
              v-for="service in item.services"
              :key="service.id"
              :service="service"
              @select="selectServiceForPostJob(service)"
            />
          </div>

          <!-- No Results Messages -->
          <div
            v-if="item.type === 'no_results_message'"
            class="text-center py-10 col-span-full"
          >
            <!-- Ensure message spans full width if in grid context -->
            <p class="text-xl font-semibold text-muted-foreground mb-2">
              <span v-if="item.message_key === 'no_results_in_category_search'">
                No services found for "{{ searchQuery }}" in this category.
              </span>
              <span v-else-if="item.message_key === 'no_services_in_category'">
                No services currently listed in this category.
              </span>
              <span
                v-else-if="item.message_key === 'no_results_overall_search'"
              >
                No services found matching "{{ searchQuery }}".
              </span>
              <span
                v-else-if="
                  item.message_key === 'no_top_services_available_check_filters'
                "
              >
                No popular services found. Try clearing filters or searching.
              </span>
              <span v-else-if="item.message_key === 'no_services_defined'">
                No services have been defined in the system yet.
              </span>
              <span v-else>No services found.</span>
            </p>
            <Button
              v-if="
                searchQuery &&
                (item.message_key === 'no_results_in_category_search' ||
                  item.message_key === 'no_results_overall_search')
              "
              variant="link"
              @click="searchQuery = ''"
            >
              Clear search
            </Button>
          </div>
        </template>

        <!-- Infinite Scroll Loading Indicator -->
        <div v-if="isLoadingMore" class="flex justify-center items-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          ></div>
          <span class="ml-2 text-sm text-muted-foreground"
            >Loading more services...</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  onActivated,
  defineAsyncComponent,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClientManager';
import ServiceBottomSheetFilter from '@/components/filters/ServiceFilterBottomSheet.vue';

// Lazy-load components
const CategoryCard = defineAsyncComponent(
  () => import('@/components/services/CategoryCard.vue')
);
import BaseSkeleton from '@/components/shared/BaseSkeleton.vue';
const ServiceCard = defineAsyncComponent(
  () => import('@/components/services/ServiceCard.vue')
);

const router = useRouter();
const isComponentVisible = ref(true);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const searchQuery = ref('');
const isFilterSheetOpen = ref(false);
const errorMessage = ref('');
const scrollContainer = ref(null);

const activeFilters = ref({
  categoryId: null,
  sortBy: 'popularity',
});

// Pagination state
const currentPage = ref(0);
const pageSize = ref(20);
const hasMoreServices = ref(true);

// Reactive data from Supabase
const allCategories = ref([]);
const allServices = ref([]);
const categoryServices = ref([]); // Services for selected category

// --- Data Fetching Functions ---

/**
 * Fetch all active service categories from Supabase
 */
async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    allCategories.value = data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    errorMessage.value = 'Failed to load service categories. Please try again.';
    throw error;
  }
}

/**
 * Fetch top services by popularity (for default view)
 */
async function fetchTopServices(page = 0, append = false) {
  try {
    const from = page * pageSize.value;
    const to = from + pageSize.value - 1;

    const { data, error } = await supabase
      .from('services')
      .select(
        `
        *,
        service_categories!inner(
          id,
          name_en,
          name_es,
          icon,
          background_image_url
        )
      `
      )
      .eq('is_active', true)
      .eq('service_categories.is_active', true)
      .order('popularity_score', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    // Transform the data to match the expected structure
    const transformedServices = (data || []).map((service) => ({
      ...service,
      categoryId: service.category_id,
      name_en: service.name_en,
      name_es: service.name_es,
      summary_en: service.description_en,
      summary_es: service.description_es,
      keywords_en: service.keywords_en || [],
      keywords_es: service.keywords_es || [],
      backgroundImageUrl: service.background_image_url,
      popularity: service.popularity_score,
    }));

    // Check if we have more services to load
    hasMoreServices.value = transformedServices.length === pageSize.value;

    if (append) {
      allServices.value = [...allServices.value, ...transformedServices];
    } else {
      allServices.value = transformedServices;
    }
  } catch (error) {
    console.error('Error fetching top services:', error);
    errorMessage.value = 'Failed to load services. Please try again.';
    throw error;
  }
}

/**
 * Fetch services for a specific category
 */
async function fetchServicesForCategory(categoryId) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(
        `
        *,
        service_categories!inner(
          id,
          name_en,
          name_es,
          icon,
          background_image_url
        )
      `
      )
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .eq('service_categories.is_active', true)
      .order('popularity_score', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected structure
    const transformedServices = (data || []).map((service) => ({
      ...service,
      categoryId: service.category_id,
      name_en: service.name_en,
      name_es: service.name_es,
      summary_en: service.description_en,
      summary_es: service.description_es,
      keywords_en: service.keywords_en || [],
      keywords_es: service.keywords_es || [],
      backgroundImageUrl: service.background_image_url,
      popularity: service.popularity_score,
    }));

    categoryServices.value = transformedServices;
  } catch (error) {
    console.error('Error fetching services for category:', error);
    errorMessage.value =
      'Failed to load services for this category. Please try again.';
    throw error;
  }
}

/**
 * Search services across all categories
 */
async function searchAllServices(query) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(
        `
        *,
        service_categories!inner(
          id,
          name_en,
          name_es,
          icon,
          background_image_url
        )
      `
      )
      .eq('is_active', true)
      .eq('service_categories.is_active', true)
      .or(
        `name_en.ilike.%${query}%,name_es.ilike.%${query}%,description_en.ilike.%${query}%,description_es.ilike.%${query}%`
      )
      .order('popularity_score', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected structure
    const transformedServices = (data || []).map((service) => ({
      ...service,
      categoryId: service.category_id,
      name_en: service.name_en,
      name_es: service.name_es,
      summary_en: service.description_en,
      summary_es: service.description_es,
      keywords_en: service.keywords_en || [],
      keywords_es: service.keywords_es || [],
      backgroundImageUrl: service.background_image_url,
      popularity: service.popularity_score,
    }));

    return transformedServices;
  } catch (error) {
    console.error('Error searching services:', error);
    errorMessage.value = 'Failed to search services. Please try again.';
    throw error;
  }
}

/**
 * Initialize data fetching
 */
async function initializeData() {
  isLoading.value = true;
  errorMessage.value = '';
  currentPage.value = 0;
  hasMoreServices.value = true;

  try {
    // Fetch categories first
    await fetchCategories();

    // Fetch top services for default view
    await fetchTopServices(0, false);
  } catch (error) {
    console.error('Error initializing data:', error);
  } finally {
    isLoading.value = false;
  }
}

/**
 * Load more services for infinite scroll
 */
async function loadMoreServices() {
  if (
    isLoadingMore.value ||
    !hasMoreServices.value ||
    activeFilters.value.categoryId ||
    searchQuery.value.trim()
  ) {
    return;
  }

  isLoadingMore.value = true;
  try {
    currentPage.value += 1;
    await fetchTopServices(currentPage.value, true);
  } catch (error) {
    console.error('Error loading more services:', error);
    currentPage.value -= 1; // Revert page increment on error
  } finally {
    isLoadingMore.value = false;
  }
}

/**
 * Handle scroll event for infinite loading
 */
function handleScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  const threshold = 200; // Load more when 200px from bottom

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    loadMoreServices();
  }
}

/**
 * Retry data fetching after error
 */
async function retryDataFetch() {
  await initializeData();
}

// --- Computed Properties ---

// Get all loaded services by popularity (no limit since we use pagination)
const topServices = computed(() => {
  return [...allServices.value].sort((a, b) => b.popularity - a.popularity);
});

// This will be the main computed property to drive the display
const displayedItems = computed(() => {
  let itemsStructure = [];
  const query = searchQuery.value.toLowerCase().trim();
  const { categoryId, sortBy } = activeFilters.value;

  const sortServices = (services) => {
    return [...services].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name_es.localeCompare(b.name_es);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'popularity':
        default:
          return b.popularity - a.popularity;
      }
    });
  };

  if (categoryId) {
    // --- Filtered by Category ---
    const category = allCategories.value.find((c) => c.id === categoryId);
    if (!category) return [];

    itemsStructure.push({ type: 'category_header', ...category });

    let servicesInThisCategory = categoryServices.value;

    if (query) {
      servicesInThisCategory = servicesInThisCategory.filter(
        (service) =>
          service.name_en.toLowerCase().includes(query) ||
          service.name_es.toLowerCase().includes(query) ||
          (service.keywords_en &&
            service.keywords_en.some((k) => k.toLowerCase().includes(query))) ||
          (service.keywords_es &&
            service.keywords_es.some((k) => k.toLowerCase().includes(query)))
      );
    }

    const sortedServices = sortServices(servicesInThisCategory);

    if (sortedServices.length > 0) {
      itemsStructure.push({
        type: 'service_list',
        services: sortedServices,
      });
    } else {
      if (query) {
        itemsStructure.push({
          type: 'no_results_message',
          message_key: 'no_results_in_category_search',
        });
      } else {
        itemsStructure.push({
          type: 'no_results_message',
          message_key: 'no_services_in_category',
        });
      }
    }
  } else {
    // --- No Category Filter: Show all or Search Results ---
    let servicesToShow = [];
    if (query) {
      servicesToShow = allServices.value.filter(
        (service) =>
          service.name_en.toLowerCase().includes(query) ||
          service.name_es.toLowerCase().includes(query) ||
          (service.keywords_en &&
            service.keywords_en.some((k) => k.toLowerCase().includes(query))) ||
          (service.keywords_es &&
            service.keywords_es.some((k) => k.toLowerCase().includes(query)))
      );
      if (servicesToShow.length === 0) {
        itemsStructure.push({
          type: 'no_results_message',
          message_key: 'no_results_overall_search',
        });
      }
    } else {
      servicesToShow = allServices.value;
    }

    const sortedServices = sortServices(servicesToShow);

    if (sortedServices.length > 0) {
      itemsStructure.push({ type: 'service_list', services: sortedServices });
    } else if (!query) {
      itemsStructure.push({
        type: 'no_results_message',
        message_key: 'no_services_defined',
      });
    }
  }
  return itemsStructure;
});

// --- Methods ---

/**
 * Select a service for posting a job - now passes service.id instead of categoryId
 */
const selectServiceForPostJob = (service) => {
  // Updated to pass the service's ID instead of categoryId
  router.push({ name: 'PostJob', params: { serviceId: service.id } });
};

/**
 * Apply category filter and fetch services for that category
 */
const handleApplyFilters = (filters) => {
  activeFilters.value = filters;
  isFilterSheetOpen.value = false;

  if (filters.categoryId) {
    fetchServicesForCategory(filters.categoryId);
  } else {
    fetchTopServices(0, false);
  }
};

const handleClearFilters = () => {
  const cleared = { categoryId: null, sortBy: 'popularity' };
  activeFilters.value = cleared;
  isFilterSheetOpen.value = false;
  fetchTopServices(0, false);
};

// Watch for search query changes to trigger search
watch(
  searchQuery,
  async (newQuery) => {
    // Reset pagination when search changes
    currentPage.value = 0;
    hasMoreServices.value = true;

    if (newQuery.trim() && !activeFilters.value.categoryId) {
      // Only search across all services if no category is selected
      try {
        const searchResults = await searchAllServices(newQuery.trim());
        allServices.value = searchResults;
        hasMoreServices.value = false; // Disable infinite scroll for search results
      } catch (error) {
        console.error('Error searching services:', error);
      }
    } else if (!newQuery.trim() && !activeFilters.value.categoryId) {
      // Reset to top services when search is cleared
      await fetchTopServices(0, false);
    }
  },
  { debounce: 300 }
);

// --- Lifecycle Hooks ---
onMounted(async () => {
  await initializeData();
});

onBeforeUnmount(() => {
  // Clean up any subscriptions if needed
});

onActivated(() => {
  isComponentVisible.value = true;
});
</script>

<style scoped>
/* Add any specific styles for the service categories view */
.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
