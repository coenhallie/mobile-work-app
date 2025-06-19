<template>
  <div
    class="compact-applicant-card bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
    @click="$emit('view-details', applicant)"
  >
    <!-- Header with Avatar and Name -->
    <div class="flex items-center gap-3 mb-2">
      <div class="relative">
        <img
          v-if="applicant.contractor_profiles?.avatar_url"
          :src="applicant.contractor_profiles.avatar_url"
          :alt="contractorName"
          class="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"
        >
          <User class="w-5 h-5" />
        </div>

        <!-- Status indicator -->
        <div
          v-if="applicant.status === 'selected'"
          class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white dark:border-gray-800 rounded-full"
          :title="$t('dashboard.selected')"
        ></div>
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
          {{ contractorName }}
        </h4>
        <div
          class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <div
            v-if="applicant.contractor_profiles?.rating"
            class="flex items-center text-yellow-500"
          >
            <Star class="w-3 h-3 fill-current" />
            <span class="ml-0.5">
              {{ applicant.contractor_profiles.rating.toFixed(1) }}
            </span>
          </div>
          <span v-if="applicant.contractor_profiles?.rating">•</span>
          <span>{{ formatDate(applicant.created_at) }}</span>
        </div>
      </div>

      <!-- Status Badge -->
      <ApplicationStatusBadge
        :status="applicant.status"
        size="sm"
        class="text-xs"
      />
    </div>

    <!-- Skills (max 2) -->
    <div v-if="contractorSkills.length > 0" class="flex flex-wrap gap-1 mb-2">
      <span
        v-for="skill in contractorSkills.slice(0, 2)"
        :key="skill"
        class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
      >
        {{ skill }}
      </span>
      <span
        v-if="contractorSkills.length > 2"
        class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
      >
        +{{ contractorSkills.length - 2 }}
      </span>
    </div>

    <!-- Message Preview -->
    <div
      v-if="applicant.message"
      class="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2"
    >
      "{{ applicant.message }}"
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2">
      <Button
        v-if="applicant.status === 'pending'"
        size="sm"
        @click.stop="$emit('select-contractor', applicant)"
        class="flex-1 h-7 text-xs"
      >
        <Check class="w-3 h-3 mr-1" />
        {{ $t('dashboard.select') }}
      </Button>
      <Button
        v-else-if="applicant.status === 'selected'"
        variant="secondary"
        size="sm"
        disabled
        class="flex-1 h-7 text-xs"
      >
        <CheckCircle class="w-3 h-3 mr-1" />
        {{ $t('dashboard.selected') }}
      </Button>
      <div
        v-else
        class="flex-1 text-center text-xs text-gray-500 dark:text-gray-400"
      >
        {{ $t('common.clickToView') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { User, Star, Eye, Check, CheckCircle } from 'lucide-vue-next';
import ApplicationStatusBadge from './ApplicationStatusBadge.vue';
import { formatStandardDate } from '@/lib/timeUtils';

const { t } = useI18n();

const props = defineProps({
  applicant: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['view-details', 'select-contractor']);

// Computed properties
const contractorName = computed(() => {
  return (
    props.applicant.contractor_profiles?.full_name ||
    props.applicant.contractor_profiles?.business_name ||
    'Unknown Contractor'
  );
});

const contractorSkills = computed(() => {
  const skills = props.applicant.contractor_profiles?.skills || [];
  return Array.isArray(skills) ? skills : [];
});

// Methods
const handleImageError = (event) => {
  event.target.style.display = 'none';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return t('common.justNow');
  } else if (diffInHours < 24) {
    return t('common.hoursAgo', { hours: diffInHours });
  } else {
    return formatStandardDate(dateString);
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
