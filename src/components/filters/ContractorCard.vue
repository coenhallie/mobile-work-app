<template>
  <div
    class="contractor-card"
    :class="{ 'contractor-loading': loading }"
    @click="handleClick"
  >
    <!-- Loading Skeleton -->
    <div v-if="loading" class="skeleton-loader">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-info">
          <div class="skeleton-line skeleton-name"></div>
          <div class="skeleton-line skeleton-service"></div>
        </div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-bio"></div>
        <div class="skeleton-line skeleton-bio-short"></div>
      </div>
      <div class="skeleton-footer">
        <div class="skeleton-chip"></div>
        <div class="skeleton-chip"></div>
        <div class="skeleton-chip"></div>
      </div>
    </div>

    <!-- Actual Content -->
    <div v-else class="card-content">
      <!-- Header Section -->
      <div class="card-header">
        <!-- Profile Photo -->
        <div class="profile-photo">
          <img
            v-if="contractor.profileImageUrl"
            :src="contractor.profileImageUrl"
            :alt="`${contractor.name}'s profile photo`"
            class="profile-image"
            loading="lazy"
            @error="handleImageError"
          />
          <div v-else class="profile-placeholder">
            <span class="placeholder-icon">🧑‍🔧</span>
          </div>
        </div>

        <!-- Basic Info -->
        <div class="basic-info">
          <h3 class="contractor-name">{{ contractor.name }}</h3>

          <!-- Primary Skill -->
          <div v-if="contractor.primarySkill" class="primary-skill">
            <Badge variant="secondary" class="skill-badge">
              {{ contractor.primarySkill }}
            </Badge>
          </div>

          <!-- Rating and Experience -->
          <div class="meta-info">
            <div class="rating-info">
              <Star class="w-3 h-3 text-yellow-500 fill-current" />
              <span class="rating-value">{{ contractor.rating }}</span>
            </div>
            <div v-if="contractor.yearsExperience" class="experience-info">
              <Calendar class="w-3 h-3 text-blue-500" />
              <span class="experience-value"
                >{{ contractor.yearsExperience }} years</span
              >
            </div>
          </div>

          <!-- Location -->
          <div class="location-info">
            <MapPin class="w-3 h-3 text-red-500" />
            <span class="location-value">{{ contractor.location }}</span>
          </div>
        </div>

        <!-- Action Button -->
        <div class="card-actions">
          <Button
            variant="ghost"
            size="sm"
            @click.stop="toggleFavorite"
            class="favorite-btn"
            :class="{ favorited: isFavorited }"
          >
            <Heart
              class="w-4 h-4"
              :class="{ 'fill-current text-red-500': isFavorited }"
            />
          </Button>
        </div>
      </div>

      <!-- Bio Section -->
      <div v-if="contractor.bio" class="bio-section">
        <p class="bio-text">{{ truncatedBio }}</p>
        <Button
          v-if="contractor.bio.length > bioLimit"
          variant="ghost"
          size="sm"
          @click.stop="toggleBioExpanded"
          class="expand-bio-btn"
        >
          {{ bioExpanded ? 'Show less' : 'Show more' }}
        </Button>
      </div>

      <!-- Skills Section -->
      <div v-if="contractor.skills?.length" class="skills-section">
        <div class="skills-grid">
          <Badge
            v-for="skill in displayedSkills"
            :key="skill"
            variant="outline"
            class="skill-chip"
          >
            {{ skill }}
          </Badge>
          <Badge
            v-if="contractor.skills.length > maxSkills"
            variant="outline"
            class="skill-chip more-skills"
            @click.stop="toggleSkillsExpanded"
          >
            +{{ contractor.skills.length - maxSkills }} more
          </Badge>
        </div>
      </div>

      <!-- Footer with Quick Actions -->
      <div class="card-footer">
        <div class="quick-actions">
          <Button
            variant="outline"
            size="sm"
            @click.stop="handleContact"
            class="contact-btn"
          >
            <MessageCircle class="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click.stop="handleViewProfile"
            class="profile-btn"
          >
            <User class="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>

        <!-- Availability Indicator -->
        <div v-if="contractor.availability" class="availability-indicator">
          <div class="availability-dot" :class="availabilityClass"></div>
          <span class="availability-text">{{ availabilityText }}</span>
        </div>
      </div>

      <!-- Hover Overlay -->
      <div class="hover-overlay"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from 'vue';
import {
  Star,
  Calendar,
  MapPin,
  Heart,
  MessageCircle,
  User,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const props = defineProps({
  contractor: { type: Object, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['contact', 'view-profile', 'favorite-toggled']);

// State
const bioExpanded = ref(false);
const skillsExpanded = ref(false);
const isFavorited = ref(false);
const bioLimit = 120;
const maxSkills = 4;

// Use shallowRef for performance-sensitive data
const cachedBio = shallowRef('');
const cachedSkills = shallowRef([]);

// Optimized computed properties with caching
const truncatedBio = computed(() => {
  const bio = props.contractor.bio;
  if (!bio) return '';

  if (bioExpanded.value || bio.length <= bioLimit) {
    return bio;
  }

  // Cache the truncated version
  if (cachedBio.value !== bio.substring(0, bioLimit) + '...') {
    cachedBio.value = bio.substring(0, bioLimit) + '...';
  }

  return cachedBio.value;
});

const displayedSkills = computed(() => {
  const skills = props.contractor.skills;
  if (!skills || skills.length === 0) return [];

  if (skillsExpanded.value) {
    return skills;
  }

  // Cache the sliced version
  const sliced = skills.slice(0, maxSkills);
  if (JSON.stringify(cachedSkills.value) !== JSON.stringify(sliced)) {
    cachedSkills.value = sliced;
  }

  return cachedSkills.value;
});

// Simplified availability computeds
const availabilityClass = computed(() => {
  const availability = props.contractor.availability;
  return availability === 'immediate'
    ? 'availability-immediate'
    : availability === 'within_week'
      ? 'availability-soon'
      : availability === 'flexible'
        ? 'availability-flexible'
        : 'availability-unknown';
});

const availabilityText = computed(() => {
  const availability = props.contractor.availability;
  return availability === 'immediate'
    ? 'Available now'
    : availability === 'within_week'
      ? 'Within a week'
      : availability === 'flexible'
        ? 'Flexible'
        : 'Contact for availability';
});

// Methods
const handleClick = () => {
  if (!props.loading) {
    handleViewProfile();
  }
};

const handleContact = () => {
  emit('contact', props.contractor);
};

const handleViewProfile = () => {
  emit('view-profile', props.contractor);
};

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;
  emit('favorite-toggled', {
    contractor: props.contractor,
    favorited: isFavorited.value,
  });
};

const toggleBioExpanded = () => {
  bioExpanded.value = !bioExpanded.value;
};

const toggleSkillsExpanded = () => {
  skillsExpanded.value = !skillsExpanded.value;
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

// Simplified lifecycle tracking
onMounted(() => {
  // Initialize cached values
  if (props.contractor.bio) {
    cachedBio.value =
      props.contractor.bio.length > bioLimit
        ? props.contractor.bio.substring(0, bioLimit) + '...'
        : props.contractor.bio;
  }

  if (props.contractor.skills) {
    cachedSkills.value = props.contractor.skills.slice(0, maxSkills);
  }
});
</script>

<style scoped>
@reference "@/style.css";

.contractor-card {
  @apply relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700;
  @apply p-6 cursor-pointer;
  @apply transition-transform duration-200 ease-out;
  @apply will-change-transform;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-color: rgb(229 231 235);
}

.contractor-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: rgb(147 197 253);
}

.contractor-card:active {
  transform: translateY(0);
}

.dark .contractor-card {
  border-color: rgb(55 65 81);
}

.dark .contractor-card:hover {
  border-color: rgb(37 99 235);
}

.contractor-loading {
  @apply pointer-events-none;
}

/* Skeleton Loader */
.skeleton-loader {
  @apply animate-pulse space-y-4;
}

.skeleton-header {
  @apply flex items-start space-x-4;
}

.skeleton-avatar {
  @apply w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg;
}

.skeleton-info {
  @apply flex-1 space-y-2;
}

.skeleton-line {
  @apply bg-gray-200 dark:bg-gray-700 rounded;
}

.skeleton-name {
  @apply h-4 w-32;
}

.skeleton-service {
  @apply h-3 w-24;
}

.skeleton-content {
  @apply space-y-2;
}

.skeleton-bio {
  @apply h-3 w-full;
}

.skeleton-bio-short {
  @apply h-3 w-3/4;
}

.skeleton-footer {
  @apply flex space-x-2;
}

.skeleton-chip {
  @apply h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded;
}

/* Card Content */
.card-content {
  @apply relative space-y-4;
}

.card-header {
  @apply flex items-start space-x-4;
}

.profile-photo {
  @apply flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden;
  @apply ring-2 ring-blue-100 dark:ring-blue-800;
  @apply transition-colors duration-200;
}

.contractor-card:hover .profile-photo {
  ring-color: rgb(191 219 254);
}

.dark .contractor-card:hover .profile-photo {
  ring-color: rgb(37 99 235);
}

.profile-image {
  @apply w-full h-full object-cover;
}

.profile-placeholder {
  @apply w-full h-full bg-gradient-to-br from-blue-50 to-blue-100;
  @apply dark:from-blue-900 dark:to-blue-800;
  @apply flex items-center justify-center;
}

.placeholder-icon {
  @apply text-xl text-blue-600 dark:text-blue-300;
}

.basic-info {
  @apply flex-1 min-w-0 space-y-2;
}

.contractor-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
  @apply transition-colors duration-200;
}

.contractor-card:hover .contractor-name {
  color: rgb(37 99 235);
}

.dark .contractor-card:hover .contractor-name {
  color: rgb(96 165 250);
}

.primary-skill {
  @apply mb-2;
}

.skill-badge {
  @apply bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200;
}

.meta-info {
  @apply flex items-center space-x-4 text-xs;
}

.rating-info,
.experience-info {
  @apply flex items-center space-x-1;
}

.rating-value,
.experience-value {
  @apply font-medium text-gray-700 dark:text-gray-300;
}

.location-info {
  @apply flex items-center space-x-1 text-xs;
}

.location-value {
  @apply text-gray-600 dark:text-gray-400 truncate;
}

.card-actions {
  @apply flex-shrink-0;
}

.favorite-btn {
  @apply h-8 w-8 p-0 text-gray-400;
  @apply transition-colors duration-200;
  transform: translateZ(0); /* Enable GPU acceleration */
}

.favorite-btn:hover {
  color: rgb(239 68 68);
  transform: scale(1.1);
}

.favorite-btn.favorited {
  @apply text-red-500;
}

.bio-section {
  @apply space-y-2;
}

.bio-text {
  @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed;
}

.expand-bio-btn {
  @apply h-6 px-2 text-xs text-blue-600 dark:text-blue-400;
}

.skills-section {
  @apply space-y-2;
}

.skills-grid {
  @apply flex flex-wrap gap-2;
}

.skill-chip {
  @apply text-xs bg-gray-50 text-gray-700 border-gray-200;
  @apply dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600;
  @apply transition-colors duration-150;
  transform: translateZ(0); /* Enable GPU acceleration */
}

.skill-chip:hover {
  background-color: rgb(243 244 246);
  transform: translateY(-1px);
}

.dark .skill-chip:hover {
  background-color: rgb(55 65 81);
}

.more-skills {
  @apply cursor-pointer bg-blue-50 text-blue-700 border-blue-200;
  @apply dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700;
}

.card-footer {
  @apply flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800;
}

.quick-actions {
  @apply flex space-x-2;
}

.contact-btn,
.profile-btn {
  @apply h-8 text-xs;
}

.availability-indicator {
  @apply flex items-center space-x-2 text-xs;
}

.availability-dot {
  @apply w-2 h-2 rounded;
}

.availability-immediate {
  @apply bg-green-500;
}

.availability-soon {
  @apply bg-yellow-500;
}

.availability-flexible {
  @apply bg-blue-500;
}

.availability-unknown {
  @apply bg-gray-400;
}

.availability-text {
  @apply text-gray-600 dark:text-gray-400;
}

.hover-overlay {
  @apply absolute inset-0 rounded-xl pointer-events-none;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.03) 0%,
    rgba(147, 51, 234, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 200ms ease-out;
  will-change: opacity;
}

.contractor-card:hover .hover-overlay {
  opacity: 1;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .contractor-card {
    @apply p-4;
  }

  .card-header {
    @apply space-x-3;
  }

  .profile-photo {
    @apply w-12 h-12;
  }

  .contractor-name {
    @apply text-base;
  }

  .quick-actions {
    @apply flex-col space-y-1 space-x-0;
  }

  .contact-btn,
  .profile-btn {
    @apply w-full justify-center;
  }
}
</style>
