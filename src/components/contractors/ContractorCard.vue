<template>
  <article
    class="contractor-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-700"
    @click="$emit('click', contractor)"
    role="button"
    :aria-label="`View ${contractor.name}'s contractor profile`"
    tabindex="0"
    @keydown.enter="$emit('click', contractor)"
    @keydown.space.prevent="$emit('click', contractor)"
  >
    <!-- New Header Section -->
    <div class="flex items-start space-x-4 p-4">
      <!-- Profile Image -->
      <img
        v-if="contractor.profileImageUrl"
        :src="contractor.profileImageUrl"
        :alt="`${contractor.name}'s profile picture`"
        class="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
        loading="lazy"
        @error="handleImageError"
      />
      <!-- Fallback Avatar -->
      <div
        v-else
        class="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shrink-0"
      >
        {{ contractor.name ? contractor.name.charAt(0).toUpperCase() : '?' }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3
          class="text-lg font-semibold text-gray-900 dark:text-white mb-0.5 leading-tight truncate"
        >
          {{ contractor.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
          {{ contractor.primarySkill }}
        </p>
      </div>

      <!-- Favorite Button -->
      <button
        @click.stop="toggleFavorite"
        class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
        :aria-label="
          $t(
            isFavorited
              ? 'contractors.ariaLabelRemoveFavorite'
              : 'contractors.ariaLabelAddFavorite',
            { name: contractor.name }
          )
        "
      >
        <svg
          class="w-5 h-5 transition-colors"
          :class="
            isFavorited
              ? 'text-red-500 fill-current'
              : 'text-gray-600 dark:text-gray-300'
          "
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 8.5c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 4 3 6.015 3 8.5c0 7.613 9 12 9 12s9-4.387 9-12z"
          />
        </svg>
      </button>
    </div>

    <!-- Card Content -->
    <div class="p-4">
      <!-- Rating and Location -->
      <div class="flex items-center justify-between mb-2">
        <div
          class="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400"
        >
          <div class="flex items-center space-x-1">
            <span class="text-yellow-400">★</span>
            <span>{{
              contractor.rating || contractor.average_rating || 'N/A'
            }}</span>
          </div>
          <div class="flex items-center space-x-1">
            <span>📍</span>
            <span>{{
              contractor.location ||
              formatServiceAreas(contractor.service_areas)
            }}</span>
          </div>
        </div>

        <!-- Distance Badge (if available) -->
        <div v-if="contractor.distance !== undefined">
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
          >
            <span class="mr-1">📍</span>
            {{ formatDistance(contractor.distance) }} away
          </span>
        </div>
      </div>

      <!-- Availability Status -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2">
          <!-- Availability Indicator -->
          <div class="flex items-center space-x-1">
            <div
              class="w-2 h-2 rounded-full"
              :class="availabilityIndicatorClass"
            ></div>
            <span class="text-xs font-medium" :class="availabilityTextClass">
              {{ availabilityText }}
            </span>
          </div>

          <!-- Availability Message (if any) -->
          <span
            v-if="contractor.availabilityMessage"
            class="text-xs text-gray-500 dark:text-gray-400 italic"
          >
            {{ contractor.availabilityMessage }}
          </span>
        </div>
      </div>

      <!-- Bio -->
      <p
        v-if="contractor.bio"
        class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed"
      >
        {{ contractor.bio }}
      </p>

      <!-- Skills -->
      <div class="flex flex-wrap gap-1.5 mb-2">
        <span
          v-for="skill in displayedSkills"
          :key="skill"
          class="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium"
        >
          {{ skill }}
        </span>
        <span
          v-if="contractor.skills.length > maxSkills"
          class="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-lg font-medium"
        >
          +{{ contractor.skills.length - maxSkills }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex justify-end">
        <!-- Contact button removed as per instructions -->
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { useGeolocation } from '@/composables/useGeolocation';
import { useFavoriteContractors } from '@/composables/useFavoriteContractors';
import { useGlobalNotifications } from '@/composables/useUnifiedNotifications';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  contractor: {
    type: Object,
    required: true,
  },
});

defineEmits(['click', 'contact']);

const { formatDistance: formatDistanceUtil } = useGeolocation();
const {
  isFavorited: isContractorFavorited,
  toggleFavorite: toggleContractorFavorite,
  operationError: favoriteOperationError, // Get the error state
} = useFavoriteContractors();

const { sendNotification } = useGlobalNotifications();
const { t } = useI18n();

// State
const maxSkills = 3;

// Computed properties
/**
 * Computes the list of skills to display on the card, limited by `maxSkills`.
 * @returns {string[]} An array of skill strings.
 */
const displayedSkills = computed(() => {
  return props.contractor.skills?.slice(0, maxSkills) || [];
});

/**
 * Computes whether the current contractor is favorited by the user.
 * @returns {boolean} True if the contractor is favorited, false otherwise.
 */
const isFavorited = computed(() => {
  return isContractorFavorited(props.contractor.id);
});

/**
 * Computes the availability indicator class based on contractor's availability status.
 * @returns {string} CSS classes for the availability indicator dot.
 */
const availabilityIndicatorClass = computed(() => {
  const status = props.contractor.availabilityStatus || 'available';
  const isCurrentlyAvailable = props.contractor.isCurrentlyAvailable;

  if (status === 'available' && isCurrentlyAvailable) {
    return 'bg-green-500 animate-pulse';
  } else if (status === 'busy') {
    return 'bg-yellow-500';
  } else if (status === 'offline') {
    return 'bg-gray-400';
  } else if (status === 'away') {
    return 'bg-orange-500';
  } else {
    return 'bg-gray-400';
  }
});

/**
 * Computes the availability text class based on contractor's availability status.
 * @returns {string} CSS classes for the availability text.
 */
const availabilityTextClass = computed(() => {
  const status = props.contractor.availabilityStatus || 'available';
  const isCurrentlyAvailable = props.contractor.isCurrentlyAvailable;

  if (status === 'available' && isCurrentlyAvailable) {
    return 'text-green-600 dark:text-green-400';
  } else if (status === 'busy') {
    return 'text-yellow-600 dark:text-yellow-400';
  } else if (status === 'offline') {
    return 'text-gray-500 dark:text-gray-400';
  } else if (status === 'away') {
    return 'text-orange-600 dark:text-orange-400';
  } else {
    return 'text-gray-500 dark:text-gray-400';
  }
});

/**
 * Computes the availability text to display.
 * @returns {string} Human-readable availability status.
 */
const availabilityText = computed(() => {
  const status = props.contractor.availabilityStatus || 'available';
  const isCurrentlyAvailable = props.contractor.isCurrentlyAvailable;
  const busyUntil = props.contractor.busyUntil;

  if (status === 'available' && isCurrentlyAvailable) {
    return 'Available now';
  } else if (status === 'available' && !isCurrentlyAvailable) {
    return 'Outside working hours';
  } else if (status === 'busy') {
    if (busyUntil) {
      const busyDate = new Date(busyUntil);
      const now = new Date();
      if (busyDate > now) {
        const diffHours = Math.ceil((busyDate - now) / (1000 * 60 * 60));
        return `Busy for ${diffHours}h`;
      }
    }
    return 'Currently busy';
  } else if (status === 'offline') {
    return 'Offline';
  } else if (status === 'away') {
    return 'Away';
  } else {
    return 'Status unknown';
  }
});

// Methods
/**
 * Toggles the favorite status of the contractor.
 * It calls the `toggleContractorFavorite` method from the composable
 * and then sends a success or error notification.
 * @async
 */
const toggleFavorite = async () => {
  const contractorId = props.contractor.id;
  const currentlyFavorited = isContractorFavorited(contractorId);
  const result = await toggleContractorFavorite(contractorId);

  if (result.success) {
    sendNotification({
      title: t('common.success'),
      body: currentlyFavorited
        ? t('notifications.removedFromFavorites', {
            name: props.contractor.name,
          })
        : t('notifications.addedToFavorites', {
            name: props.contractor.name,
          }),
      type: 'success', // Assuming your notification system supports types
    });
  } else {
    sendNotification({
      title: t('common.error'),
      body:
        result.error ||
        (currentlyFavorited
          ? t('contractors.errorRemovingFavorite')
          : t('contractors.errorAddingFavorite')),
      type: 'error',
    });
  }
};

/**
 * Handles errors when loading the contractor's profile image.
 * Hides the image element if an error occurs, allowing the fallback avatar to show.
 * @param {Event} event - The error event from the image tag.
 */
const handleImageError = (event) => {
  event.target.style.display = 'none';
};

/**
 * Formats the distance to the contractor for display.
 * Uses the `formatDistanceUtil` from the geolocation composable.
 * @param {number} distance - The distance in kilometers.
 * @returns {string} The formatted distance string (e.g., "5.2 km").
 */
const formatDistance = (distance) => {
  return formatDistanceUtil(distance);
};

/**
 * Formats the contractor's service areas for display.
 * Shows a limited number of areas and indicates if there are more.
 * @param {string[]} areas - An array of service area strings.
 * @returns {string} The formatted service areas string.
 */
const formatServiceAreas = (areas) => {
  if (!areas || areas.length === 0) return 'Not specified';
  if (areas.length <= 2) return areas.join(', ');
  return `${areas.slice(0, 2).join(', ')} +${areas.length - 2} more`;
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ensure smooth transitions for hover effects */
.contractor-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced hover effect for the entire card */
.contractor-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Ensure backdrop blur works properly */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
</style>
