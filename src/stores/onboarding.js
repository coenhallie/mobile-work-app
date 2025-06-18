import { defineStore } from 'pinia';
import { useAuth } from '@/composables/useAuth';

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    currentStep: 'welcome',
    onboardingData: {
      location: null,
      locationMethod: null, // 'gps' or 'manual'
      selectedSkill: null,
      viewedJobs: [],
      startTime: null,
      sessionId: null,
    },
    selectedJob: null,
    profileData: {
      fullName: '',
      phone: '',
      yearsExperience: '',
    },
    variant: 'value_first', // A/B test variant
    isLoading: false,
    error: null,
  }),

  getters: {
    completionPercentage: (state) => {
      const steps = [
        'welcome',
        'location',
        'jobs_preview',
        'skill_selection',
        'job_list',
        'profile_form',
        'success',
      ];
      const currentIndex = steps.indexOf(state.currentStep);
      return Math.round(((currentIndex + 1) / steps.length) * 100);
    },

    canProceed: (state) => {
      switch (state.currentStep) {
        case 'welcome':
          return true;
        case 'location':
          return !!state.onboardingData.location;
        case 'skill_selection':
          return !!state.onboardingData.selectedSkill;
        case 'profile_form':
          return !!(
            state.profileData.fullName &&
            state.profileData.phone &&
            state.profileData.yearsExperience
          );
        default:
          return true;
      }
    },

    hasViewedJobs: (state) => {
      return state.onboardingData.viewedJobs.length > 0;
    },
  },

  actions: {
    startOnboarding() {
      this.onboardingData.startTime = Date.now();
      this.onboardingData.sessionId = this.generateSessionId();
      this.currentStep = 'welcome';
      this.trackEvent('onboarding_started');
    },

    setLocation(location, method = 'manual') {
      this.onboardingData.location = location;
      this.onboardingData.locationMethod = method;
      this.trackEvent('location_selected', { location, method });
    },

    setSkill(skill) {
      this.onboardingData.selectedSkill = skill;
      this.trackEvent('skill_selected', { skill });
    },

    trackJobView(jobId) {
      if (!this.onboardingData.viewedJobs.includes(jobId)) {
        this.onboardingData.viewedJobs.push(jobId);
        this.trackEvent('job_viewed', {
          jobId,
          totalViewed: this.onboardingData.viewedJobs.length,
        });
      }
    },

    setSelectedJob(job) {
      this.selectedJob = job;
      this.trackEvent('job_selected', { jobId: job.id, title: job.title });
    },

    updateProfileData(data) {
      this.profileData = { ...this.profileData, ...data };
    },

    nextStep() {
      const steps = [
        'welcome',
        'location',
        'jobs_preview',
        'skill_selection',
        'job_list',
        'profile_form',
        'success',
      ];
      const currentIndex = steps.indexOf(this.currentStep);
      if (currentIndex < steps.length - 1) {
        this.currentStep = steps[currentIndex + 1];
        this.trackEvent('step_completed', {
          step: steps[currentIndex],
          nextStep: this.currentStep,
          timeSpent: this.getTimeSpent(),
        });
      }
    },

    goToStep(step) {
      this.currentStep = step;
      this.trackEvent('step_navigation', { step, method: 'direct' });
    },

    async submitApplication(jobId) {
      try {
        this.isLoading = true;
        this.error = null;

        const { user, getSupabaseClient } = useAuth();
        const supabase = getSupabaseClient();

        // Save quick profile first
        const profileResult = await this.saveQuickProfile();
        if (!profileResult.success) {
          throw new Error(profileResult.error);
        }

        // Submit job application
        const { data, error } = await supabase
          .from('job_applications')
          .insert({
            job_id: jobId,
            contractor_id: profileResult.profileId,
            status: 'pending',
            applied_at: new Date().toISOString(),
            source: 'onboarding',
          })
          .select()
          .single();

        if (error) throw error;

        this.trackEvent('application_submitted', {
          jobId,
          profileCompletionTime: this.getTimeSpent(),
          applicationId: data.id,
        });

        return { success: true, applicationId: data.id };
      } catch (error) {
        console.error('Application submission error:', error);
        this.error = error.message;
        this.trackEvent('application_error', { jobId, error: error.message });
        return { success: false, error: error.message };
      } finally {
        this.isLoading = false;
      }
    },

    async saveQuickProfile() {
      try {
        const { user, getSupabaseClient } = useAuth();
        const supabase = getSupabaseClient();

        if (!user.value) {
          throw new Error('User not authenticated');
        }

        const profileData = {
          user_id: user.value.id,
          full_name: this.profileData.fullName,
          phone: this.profileData.phone,
          years_experience: this.profileData.yearsExperience,
          skills: this.onboardingData.selectedSkill
            ? [this.onboardingData.selectedSkill]
            : [],
          service_areas: this.onboardingData.location
            ? [this.onboardingData.location]
            : [],
          onboarding_step: 'profile_completed',
          onboarding_variant: this.variant,
          onboarding_completed_at: new Date().toISOString(),
          profile_completion_percentage: 40, // Basic profile completion
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('contractor_profiles')
          .upsert(profileData, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) throw error;

        this.trackEvent('profile_completed', {
          completionPercentage: 40,
          timeToComplete: this.getTimeSpent(),
        });

        return { success: true, profileId: data.id };
      } catch (error) {
        console.error('Profile save error:', error);
        return { success: false, error: error.message };
      }
    },

    async trackEvent(eventName, properties = {}) {
      try {
        const { user, getSupabaseClient } = useAuth();
        const supabase = getSupabaseClient();

        const eventData = {
          user_id: user.value?.id || null,
          session_id: this.onboardingData.sessionId,
          event_name: eventName,
          event_data: {
            ...properties,
            currentStep: this.currentStep,
            variant: this.variant,
            timeFromStart: this.getTimeSpent(),
            ...this.onboardingData,
          },
          variant: this.variant,
          created_at: new Date().toISOString(),
        };

        // Don't await this to avoid blocking the UI
        supabase
          .from('onboarding_analytics')
          .insert(eventData)
          .then(({ error }) => {
            if (error) {
              console.warn('Analytics tracking error:', error);
            }
          });

        // Also track with any external analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', eventName, {
            event_category: 'onboarding',
            event_label: this.variant,
            custom_parameter_1: this.currentStep,
            ...properties,
          });
        }
      } catch (error) {
        console.warn('Event tracking error:', error);
      }
    },

    getTimeSpent() {
      if (!this.onboardingData.startTime) return 0;
      return Math.round((Date.now() - this.onboardingData.startTime) / 1000);
    },

    generateSessionId() {
      return (
        'onb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      );
    },

    reset() {
      this.$reset();
    },

    // A/B Testing methods
    setVariant(variant) {
      this.variant = variant;
      this.trackEvent('variant_assigned', { variant });
    },

    getVariant(userId) {
      // Simple hash-based assignment for consistent user experience
      if (!userId) return 'value_first';

      const hash = this.simpleHash(userId + 'onboarding_flow');
      return hash % 100 < 70 ? 'value_first' : 'current';
    },

    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    },
  },

  persist: {
    key: 'onboarding-store',
    storage: sessionStorage, // Use session storage to reset on new sessions
    paths: ['onboardingData', 'currentStep', 'variant', 'selectedJob'],
  },
});
