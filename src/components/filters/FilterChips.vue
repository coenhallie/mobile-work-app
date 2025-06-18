<template>
  <div v-if="hasActiveFilters" class="filter-chips-container">
    <div class="filter-chips">
      <!-- Service Chips -->
      <FilterChip
        v-for="service in activeFilters.services"
        :key="`service-${service}`"
        :label="service"
        :type="'service'"
        @remove="removeFilter('services', service)"
      />

      <!-- Location Chips -->
      <FilterChip
        v-for="location in activeFilters.locations"
        :key="`location-${location}`"
        :label="location"
        :type="'location'"
        @remove="removeFilter('locations', location)"
      />

      <!-- Rating Chip -->
      <FilterChip
        v-if="activeFilters.minRating"
        :key="'rating'"
        :label="`${activeFilters.minRating}+ stars`"
        :type="'rating'"
        @remove="removeFilter('minRating', null)"
      />

      <!-- Experience Chip -->
      <FilterChip
        v-if="activeFilters.experienceRange"
        :key="'experience'"
        :label="`${activeFilters.experienceRange[0]}-${activeFilters.experienceRange[1]} years`"
        :type="'experience'"
        @remove="removeFilter('experienceRange', null)"
      />

      <!-- Price Range Chip -->
      <FilterChip
        v-if="activeFilters.priceRange"
        :key="'price'"
        :label="`S/${activeFilters.priceRange[0]} - S/${activeFilters.priceRange[1]}`"
        :type="'price'"
        @remove="removeFilter('priceRange', null)"
      />

      <!-- Availability Chip -->
      <FilterChip
        v-if="activeFilters.availability"
        :key="'availability'"
        :label="formatAvailability(activeFilters.availability)"
        :type="'availability'"
        @remove="removeFilter('availability', null)"
      />

      <!-- Clear All Button -->
      <Button
        variant="ghost"
        size="sm"
        @click="clearAllFilters"
        class="clear-all-btn"
      >
        Clear all
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import FilterChip from './FilterChip.vue';

const props = defineProps({
  activeFilters: { type: Object, required: true },
});

const emit = defineEmits(['remove-filter', 'clear-all']);

const hasActiveFilters = computed(() => {
  return (
    props.activeFilters.services?.length > 0 ||
    props.activeFilters.locations?.length > 0 ||
    props.activeFilters.minRating ||
    props.activeFilters.experienceRange ||
    props.activeFilters.priceRange ||
    props.activeFilters.availability
  );
});

const removeFilter = (type, value) => {
  emit('remove-filter', { type, value });
};

const clearAllFilters = () => {
  emit('clear-all');
};

const formatAvailability = (availability) => {
  const availabilityMap = {
    immediate: 'Available Now',
    within_week: 'Within a Week',
    flexible: 'Flexible Schedule',
  };
  return availabilityMap[availability] || availability;
};
</script>

<style scoped>
@reference "@/style.css";

.filter-chips-container {
  @apply mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg;
}

.filter-chips {
  @apply flex flex-wrap gap-2 items-center;
}

.clear-all-btn {
  @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200;
  @apply min-h-[32px] px-3;
}
</style>
