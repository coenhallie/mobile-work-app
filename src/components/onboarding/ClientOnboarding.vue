<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-background rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl"
    >
      <!-- Progress Indicator -->
      <div class="p-4 border-b border-border">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold text-foreground">
            {{ $t('onboarding.client.title') }}
          </h2>
          <span class="text-sm text-muted-foreground"
            >{{ currentStep }}/{{ totalSteps }}</span
          >
        </div>
        <div class="w-full bg-muted rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <!-- Step 1: Welcome & Value Proposition -->
        <div v-if="currentStep === 1" class="text-center space-y-6">
          <!-- App Icon -->
          <div
            class="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10"
              />
            </svg>
          </div>

          <!-- Welcome Message -->
          <div>
            <h3 class="text-xl font-bold text-foreground mb-2">
              {{ $t('onboarding.client.welcome', { name: userName }) }}
            </h3>
            <p class="text-muted-foreground text-base leading-relaxed">
              {{ $t('onboarding.client.valueProposition') }}
            </p>
          </div>

          <!-- Benefits List -->
          <div class="space-y-3 text-left">
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
              >
                <svg
                  class="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span class="text-foreground">{{
                $t('onboarding.client.benefit1')
              }}</span>
            </div>
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center"
              >
                <svg
                  class="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span class="text-foreground">{{
                $t('onboarding.client.benefit2')
              }}</span>
            </div>
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center"
              >
                <svg
                  class="w-4 h-4 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span class="text-foreground">{{
                $t('onboarding.client.benefit3')
              }}</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Guide to First Job Post -->
        <div v-if="currentStep === 2" class="text-center space-y-6">
          <!-- Job Post Icon -->
          <div
            class="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>

          <!-- Main Content -->
          <div>
            <h3 class="text-xl font-bold text-foreground mb-2">
              {{ $t('onboarding.client.jobPostTitle') }}
            </h3>
            <p class="text-muted-foreground text-base leading-relaxed mb-4">
              {{ $t('onboarding.client.jobPostDescription') }}
            </p>
          </div>

          <!-- Quick Tips -->
          <div class="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <h4 class="font-medium text-foreground text-sm">
              {{ $t('onboarding.client.quickTips') }}:
            </h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• {{ $t('onboarding.client.tip1') }}</li>
              <li>• {{ $t('onboarding.client.tip2') }}</li>
              <li>• {{ $t('onboarding.client.tip3') }}</li>
            </ul>
          </div>
        </div>

        <!-- Step 3: Introduction to Contractor Discovery -->
        <div v-if="currentStep === 3" class="text-center space-y-6">
          <!-- Browse Icon -->
          <div
            class="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <!-- Content -->
          <div>
            <h3 class="text-xl font-bold text-foreground mb-2">
              {{ $t('onboarding.client.browseTitle') }}
            </h3>
            <p class="text-muted-foreground text-base leading-relaxed">
              {{ $t('onboarding.client.browseDescription') }}
            </p>
          </div>

          <!-- Features -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-muted/50 rounded-lg p-3">
              <div class="text-foreground font-medium">
                {{ $t('onboarding.client.feature1Title') }}
              </div>
              <div class="text-muted-foreground text-xs">
                {{ $t('onboarding.client.feature1Desc') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <div class="text-foreground font-medium">
                {{ $t('onboarding.client.feature2Title') }}
              </div>
              <div class="text-muted-foreground text-xs">
                {{ $t('onboarding.client.feature2Desc') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-4 border-t border-border">
        <div v-if="currentStep === 1" class="space-y-3">
          <Button @click="nextStep" class="w-full" size="lg">
            {{ $t('onboarding.client.getStarted') }}
          </Button>
        </div>

        <div v-if="currentStep === 2" class="space-y-3">
          <Button @click="goToJobPost" class="w-full" size="lg">
            {{ $t('onboarding.client.postJob') }}
          </Button>
          <Button @click="skipToHome" variant="outline" class="w-full">
            {{ $t('onboarding.client.doLater') }}
          </Button>
        </div>

        <div v-if="currentStep === 3" class="space-y-3">
          <Button @click="browseContractors" class="w-full" size="lg">
            {{ $t('onboarding.client.browseContractors') }}
          </Button>
          <Button @click="completeOnboarding" variant="outline" class="w-full">
            {{ $t('onboarding.client.finishOnboarding') }}
          </Button>
        </div>

        <!-- Skip/Close Options -->
        <div class="mt-3 text-center">
          <button
            @click="skipOnboarding"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {{ $t('onboarding.client.skipOnboarding') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/composables/useI18n';
import { useClientOnboarding } from '@/composables/useClientOnboarding';
import Button from '@/components/ui/button/Button.vue';

// Debug logging for translation issues
console.log('🔍 ClientOnboarding Debug: Component loaded');

// Props
const props = defineProps({
  userName: {
    type: String,
    default: 'User',
  },
});

// Emits
const emit = defineEmits(['complete', 'skip']);

// Composables
const router = useRouter();
const { t, te, locale } = useI18n();
const { completeOnboarding: completeOnboardingComposable } =
  useClientOnboarding();

// Debug: Check translation availability
console.log('🔍 Current locale:', locale.value);
console.log('🔍 Translation checks:');

// Check all required translation keys
const requiredKeys = [
  'onboarding.client.title',
  'onboarding.client.welcome',
  'onboarding.client.valueProposition',
  'onboarding.client.benefit1',
  'onboarding.client.benefit2',
  'onboarding.client.benefit3',
  'onboarding.client.getStarted',
  'onboarding.client.jobPostTitle',
  'onboarding.client.jobPostDescription',
  'onboarding.client.quickTips',
  'onboarding.client.tip1',
  'onboarding.client.tip2',
  'onboarding.client.tip3',
  'onboarding.client.postJob',
  'onboarding.client.doLater',
  'onboarding.client.browseTitle',
  'onboarding.client.browseDescription',
  'onboarding.client.feature1Title',
  'onboarding.client.feature1Desc',
  'onboarding.client.feature2Title',
  'onboarding.client.feature2Desc',
  'onboarding.client.browseContractors',
  'onboarding.client.finishOnboarding',
  'onboarding.client.skipOnboarding',
  'common.user',
];

requiredKeys.forEach((key) => {
  const exists = te(key);
  const value = exists ? t(key) : 'MISSING';
  console.log(`  ${key}: ${exists ? '✅' : '❌'} "${value}"`);
});

// State
const currentStep = ref(1);
const totalSteps = ref(3);
const isCompleting = ref(false);

// Computed
const userName = computed(() => {
  return props.userName || user.value?.email?.split('@')[0] || t('common.user');
});

// Methods
const nextStep = () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++;
  }
};

const goToJobPost = async () => {
  await markOnboardingComplete();
  emit('complete', 'job-post');
  router.push('/services');
};

const skipToHome = async () => {
  currentStep.value = 3; // Show contractor discovery step
};

const browseContractors = async () => {
  await markOnboardingComplete();
  emit('complete', 'browse-contractors');
  router.push('/contractors');
};

const completeOnboarding = async () => {
  await markOnboardingComplete();
  emit('complete', 'home');
};

const skipOnboarding = async () => {
  await markOnboardingComplete();
  emit('skip');
};

const markOnboardingComplete = async () => {
  if (isCompleting.value) return;

  isCompleting.value = true;

  try {
    // Use the composable to complete onboarding
    await completeOnboardingComposable();
  } catch (error) {
    console.error('Error marking onboarding as complete:', error);
  } finally {
    isCompleting.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Track onboarding start
  console.log('Client onboarding started');
});
</script>

<style scoped>
/* Custom animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
</style>
