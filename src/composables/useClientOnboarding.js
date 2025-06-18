import { ref, computed } from 'vue';
import { useSupabaseAuth } from './useSupabaseAuth';

const showOnboarding = ref(false);
const isCheckingOnboarding = ref(false);
const onboardingStep = ref('welcome');

export function useClientOnboarding() {
  const { user, getUserProfile, upsertUserProfile } = useSupabaseAuth();

  const checkOnboardingStatus = async () => {
    if (!user.value?.id) {
      return false;
    }

    isCheckingOnboarding.value = true;

    try {
      const { data: profile } = await getUserProfile(user.value.id);

      // Return true if onboarding is needed
      const needsOnboarding = !profile?.has_completed_client_onboarding;

      if (needsOnboarding) {
        onboardingStep.value = profile?.onboarding_step || 'welcome';
      }

      return needsOnboarding;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    } finally {
      isCheckingOnboarding.value = false;
    }
  };

  const startOnboarding = () => {
    showOnboarding.value = true;
    onboardingStep.value = 'welcome';
  };

  const completeOnboarding = async () => {
    if (!user.value?.id) return;

    try {
      await upsertUserProfile({
        has_completed_client_onboarding: true,
        client_onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 'completed',
      });

      showOnboarding.value = false;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  const updateOnboardingStep = async (step) => {
    if (!user.value?.id) return;

    onboardingStep.value = step;

    try {
      await upsertUserProfile({
        onboarding_step: step,
      });
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  };

  return {
    // State
    showOnboarding: computed(() => showOnboarding.value),
    isCheckingOnboarding: computed(() => isCheckingOnboarding.value),
    onboardingStep: computed(() => onboardingStep.value),

    // Methods
    checkOnboardingStatus,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    updateOnboardingStep,

    // Direct state setters (for advanced use)
    setShowOnboarding: (value) => {
      showOnboarding.value = value;
    },
    setOnboardingStep: (step) => {
      onboardingStep.value = step;
    },
  };
}
