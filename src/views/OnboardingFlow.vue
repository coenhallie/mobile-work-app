<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Progress Bar -->
    <div
      class="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200"
    >
      <div class="max-w-md mx-auto px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <button
            v-if="canGoBack"
            @click="goBack"
            class="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              class="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div v-else></div>

          <span class="text-sm font-medium text-gray-500">
            {{ completionPercentage }}% Complete
          </span>
        </div>

        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${completionPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-md mx-auto px-4 py-6">
      <!-- Welcome Screen -->
      <ValueFirstWelcome
        v-if="currentStep === 'welcome'"
        @location-selected="handleLocationSelected"
        @skip="handleSkip"
      />

      <!-- Job Preview Screen -->
      <JobPreview
        v-else-if="currentStep === 'jobs_preview'"
        :location="onboardingData.location"
        @skill-selected="handleSkillSelected"
        @continue="nextStep"
      />

      <!-- Skill Interest Selector -->
      <SkillInterestSelector
        v-else-if="currentStep === 'skill_selection'"
        :location="onboardingData.location"
        @skill-selected="handleSkillSelected"
        @continue="nextStep"
      />

      <!-- Filtered Job List -->
      <FilteredJobList
        v-else-if="currentStep === 'job_list'"
        :skill="onboardingData.selectedSkill"
        :location="onboardingData.location"
        @job-selected="handleJobSelected"
        @apply-clicked="handleApplyClicked"
      />

      <!-- Quick Profile Form -->
      <QuickProfileForm
        v-else-if="currentStep === 'profile_form'"
        :selected-job="selectedJob"
        @profile-completed="handleProfileCompleted"
        @save-later="handleSaveLater"
      />

      <!-- Application Success -->
      <ApplicationSuccess
        v-else-if="currentStep === 'success'"
        :application-data="applicationResult"
        @continue-to-dashboard="goToDashboard"
        @enhance-profile="showEnhancementPrompts"
      />
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div class="flex items-center space-x-3">
          <div
            class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
          ></div>
          <span class="text-gray-700">{{ loadingMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="error"
      class="fixed bottom-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto"
    >
      <div class="flex items-center justify-between">
        <span>{{ error }}</span>
        <button @click="clearError" class="ml-2 text-white/80 hover:text-white">
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOnboardingStore } from '@/stores/onboarding';
import { useAuth } from '@/composables/useAuth';

// Components
import ValueFirstWelcome from '@/components/onboarding/ValueFirstWelcome.vue';
import JobPreview from '@/components/onboarding/JobPreview.vue';
import SkillInterestSelector from '@/components/onboarding/SkillInterestSelector.vue';
import FilteredJobList from '@/components/onboarding/FilteredJobList.vue';
import QuickProfileForm from '@/components/onboarding/QuickProfileForm.vue';
import ApplicationSuccess from '@/components/onboarding/ApplicationSuccess.vue';

const router = useRouter();
const onboardingStore = useOnboardingStore();
const { user } = useAuth();

// Reactive state
const applicationResult = ref(null);
const loadingMessage = ref('');

// Computed properties
const currentStep = computed(() => onboardingStore.currentStep);
const completionPercentage = computed(
  () => onboardingStore.completionPercentage
);
const onboardingData = computed(() => onboardingStore.onboardingData);
const selectedJob = computed(() => onboardingStore.selectedJob);
const isLoading = computed(() => onboardingStore.isLoading);
const error = computed(() => onboardingStore.error);

const canGoBack = computed(() => {
  const nonBackSteps = ['welcome', 'success'];
  return !nonBackSteps.includes(currentStep.value);
});

// Methods
const handleLocationSelected = (location, method) => {
  onboardingStore.setLocation(location, method);
  onboardingStore.goToStep('jobs_preview');
};

const handleSkillSelected = (skill) => {
  onboardingStore.setSkill(skill);
  onboardingStore.goToStep('job_list');
};

const handleJobSelected = (job) => {
  onboardingStore.setSelectedJob(job);
  onboardingStore.trackJobView(job.id);
};

const handleApplyClicked = (job) => {
  onboardingStore.setSelectedJob(job);
  onboardingStore.goToStep('profile_form');
};

const handleProfileCompleted = async (profileData) => {
  loadingMessage.value = 'Submitting your application...';

  // Update profile data
  onboardingStore.updateProfileData(profileData);

  // Submit application
  const result = await onboardingStore.submitApplication(selectedJob.value.id);

  if (result.success) {
    applicationResult.value = {
      job: selectedJob.value,
      applicationId: result.applicationId,
      submittedAt: new Date(),
    };
    onboardingStore.goToStep('success');
  }
  // Error handling is done in the store
};

const handleSaveLater = () => {
  // Save profile without submitting application
  onboardingStore.saveQuickProfile();
  router.push('/');
};

const handleSkip = () => {
  // Skip onboarding and go to dashboard
  onboardingStore.trackEvent('onboarding_skipped', { step: currentStep.value });
  router.push('/');
};

const goBack = () => {
  const steps = [
    'welcome',
    'jobs_preview',
    'skill_selection',
    'job_list',
    'profile_form',
    'success',
  ];
  const currentIndex = steps.indexOf(currentStep.value);
  if (currentIndex > 0) {
    onboardingStore.goToStep(steps[currentIndex - 1]);
  }
};

const nextStep = () => {
  onboardingStore.nextStep();
};

const goToDashboard = () => {
  onboardingStore.trackEvent('onboarding_completed', {
    totalTime: onboardingStore.getTimeSpent(),
    jobsViewed: onboardingStore.onboardingData.viewedJobs.length,
    applicationSubmitted: !!applicationResult.value,
  });

  router.push('/');
};

const showEnhancementPrompts = () => {
  // Navigate to profile enhancement
  router.push('/complete-profile?source=onboarding');
};

const clearError = () => {
  onboardingStore.error = null;
};

// Lifecycle
onMounted(async () => {
  // Check if user should see new onboarding flow
  if (user.value) {
    const variant = onboardingStore.getVariant(user.value.id);
    onboardingStore.setVariant(variant);

    // If user is assigned to current flow, redirect to existing onboarding
    if (variant === 'current') {
      router.push('/complete-profile');
      return;
    }
  }

  // Start the new onboarding flow
  onboardingStore.startOnboarding();
});

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  // Save current state but don't reset completely
  // This allows users to resume if they navigate away
});
</script>

<style scoped>
/* Custom animations for smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure mobile-first responsive design */
@media (max-width: 640px) {
  .max-w-md {
    max-width: 100%;
  }
}
</style>
