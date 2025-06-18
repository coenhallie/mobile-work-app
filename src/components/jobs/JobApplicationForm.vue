<template>
  <div class="job-application-form">
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4"
    >
      {{ error }}
    </div>

    <form @submit.prevent="submitApplication">
      <div class="mb-4">
        <label
          for="application-message"
          class="block text-sm font-medium text-foreground mb-1"
        >
          {{ $t('jobs.messageToJobOwner') }}
        </label>
        <textarea
          id="application-message"
          v-model="message"
          rows="4"
          class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          :placeholder="t('jobs.applicationPlaceholder')"
        ></textarea>
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          class="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="flex items-center">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ $t('jobs.applying') }}
          </span>
          <span v-else>{{ $t('jobs.applyNow') }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useJobApplicationsStore } from '../../stores/jobApplications';
import { useAuth } from '../../composables/useAuth';
import { useHaptics } from '../../composables/useHaptics';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  jobId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['applied', 'error']);

const { userId } = useAuth();
const jobApplicationsStore = useJobApplicationsStore();

// Initialize haptics for form feedback
const { triggerSuccess, triggerError } = useHaptics();

const message = ref('');
const isSubmitting = ref(false);
const error = ref('');

async function submitApplication() {
  if (!userId.value) {
    error.value = 'You must be logged in to apply for jobs.';
    emit('error', error.value);
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const result = await jobApplicationsStore.applyToJob(
      props.jobId,
      userId.value,
      message.value
    );

    if (result.success) {
      // Trigger success haptic feedback
      await triggerSuccess();
      message.value = ''; // Clear the form
      emit('applied');
    } else {
      // Trigger error haptic feedback
      await triggerError();
      error.value = result.error || 'Failed to apply for the job.';
      emit('error', error.value);
    }
  } catch (err) {
    console.error('Error applying for job:', err);
    // Trigger error haptic feedback for exceptions
    await triggerError();
    error.value = err.message || 'An unexpected error occurred.';
    emit('error', error.value);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.job-application-form {
  /* Remove hardcoded styles - let the parent modal handle styling */
}
</style>
