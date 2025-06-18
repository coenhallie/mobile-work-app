<template>
  <div>
    <!-- Header with title and applicant counter - Airbnb style -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-3xl font-bold text-black">
        {{ job.category_name }} {{ $t('jobs.serviceRequest') }}
      </h2>

      <!-- Applicant counter for job owners -->
      <ApplicantCounter
        v-if="
          isJobOwner && job.status === JOB_STATUS.OPEN && job.applicant_count
        "
        :count="job.applicant_count"
        :has-unread="job.has_unread_applications"
      />
    </div>

    <!-- Tab navigation -->
    <div class="border-b border-gray-200 mb-4">
      <nav class="flex -mb-px">
        <button
          @click="$emit('update:activeTab', 'details')"
          class="py-2 px-4 border-b-2 font-medium text-sm"
          :class="
            activeTab === 'details'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          "
        >
          {{ $t('jobs.jobDetails') }}
        </button>
        <button
          v-if="
            isJobOwner &&
            job.status === JOB_STATUS.OPEN &&
            job.applicant_count > 0
          "
          @click="$emit('update:activeTab', 'applicants')"
          class="ml-8 py-2 px-4 border-b-2 font-medium text-sm"
          :class="
            activeTab === 'applicants'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          "
        >
          {{ $t('jobs.applicants') }}
          <span
            v-if="job.has_unread_applications"
            class="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block"
            aria-label="Unread applications"
          ></span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import ApplicantCounter from './ApplicantCounter.vue';
import { JOB_STATUS } from '@/stores/job';

const { t } = useI18n();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  isJobOwner: {
    type: Boolean,
    default: false,
  },
  activeTab: {
    type: String,
    default: 'details',
  },
});

defineEmits(['update:activeTab']);
</script>
