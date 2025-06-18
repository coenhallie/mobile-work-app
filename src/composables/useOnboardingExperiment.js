import { ref, computed } from 'vue';
import { useAuth } from './useAuth.js';

// A/B Testing configuration
const experiments = {
  onboarding_flow: {
    variants: ['current', 'value_first'],
    weights: [30, 70], // 30% current, 70% new value-first flow
    enabled: true,
    description:
      'Test new value-first onboarding vs current form-first approach',
  },
  profile_collection: {
    variants: ['upfront', 'just_in_time'],
    weights: [20, 80], // 20% upfront, 80% just-in-time
    enabled: true,
    description: 'Test when to collect profile information',
  },
};

// Global experiment state
const experimentAssignments = ref(new Map());
const experimentEvents = ref([]);

export function useOnboardingExperiment() {
  const { user } = useAuth();

  /**
   * Get variant for a specific experiment
   * Uses consistent hash-based assignment for same user
   */
  const getVariant = (experimentName, userId = null) => {
    const experiment = experiments[experimentName];
    if (!experiment || !experiment.enabled) {
      return experiment?.variants[0] || 'default';
    }

    const targetUserId = userId || user.value?.id;
    if (!targetUserId) {
      // For anonymous users, use session-based assignment
      return getSessionVariant(experimentName);
    }

    // Check if we already have an assignment for this user
    const assignmentKey = `${targetUserId}_${experimentName}`;
    if (experimentAssignments.value.has(assignmentKey)) {
      return experimentAssignments.value.get(assignmentKey);
    }

    // Generate consistent assignment based on user ID hash
    const hash = simpleHash(targetUserId + experimentName);
    const totalWeight = experiment.weights.reduce(
      (sum, weight) => sum + weight,
      0
    );
    const threshold = hash % totalWeight;

    let currentWeight = 0;
    let selectedVariant = experiment.variants[0];

    for (let i = 0; i < experiment.variants.length; i++) {
      currentWeight += experiment.weights[i];
      if (threshold < currentWeight) {
        selectedVariant = experiment.variants[i];
        break;
      }
    }

    // Store assignment
    experimentAssignments.value.set(assignmentKey, selectedVariant);

    // Track assignment event
    trackExperiment(experimentName, selectedVariant, 'assigned', {
      userId: targetUserId,
      hash,
      threshold,
      totalWeight,
    });

    return selectedVariant;
  };

  /**
   * Get variant for session-based (anonymous) users
   */
  const getSessionVariant = (experimentName) => {
    const sessionKey = `experiment_${experimentName}`;
    let variant = sessionStorage.getItem(sessionKey);

    if (!variant) {
      const experiment = experiments[experimentName];
      const random = Math.random() * 100;
      let currentWeight = 0;

      for (let i = 0; i < experiment.variants.length; i++) {
        currentWeight +=
          (experiment.weights[i] /
            experiment.weights.reduce((a, b) => a + b, 0)) *
          100;
        if (random < currentWeight) {
          variant = experiment.variants[i];
          break;
        }
      }

      variant = variant || experiment.variants[0];
      sessionStorage.setItem(sessionKey, variant);

      trackExperiment(experimentName, variant, 'assigned', {
        sessionBased: true,
        random,
      });
    }

    return variant;
  };

  /**
   * Track experiment events for analytics
   */
  const trackExperiment = async (experimentName, variant, event, data = {}) => {
    const eventData = {
      experiment: experimentName,
      variant,
      event,
      data,
      timestamp: new Date().toISOString(),
      userId: user.value?.id || null,
      sessionId: getSessionId(),
    };

    // Store locally
    experimentEvents.value.push(eventData);

    try {
      // Send to analytics backend
      const { getSupabaseClient } = useAuth();
      const supabase = getSupabaseClient();

      await supabase.from('onboarding_analytics').insert({
        user_id: eventData.userId,
        session_id: eventData.sessionId,
        event_name: `experiment_${event}`,
        event_data: {
          experiment: experimentName,
          variant,
          ...data,
        },
        variant,
        created_at: eventData.timestamp,
      });

      // Also send to external analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'experiment_event', {
          event_category: 'experiments',
          event_label: `${experimentName}_${variant}`,
          custom_parameter_1: event,
          custom_parameter_2: JSON.stringify(data),
        });
      }
    } catch (error) {
      console.warn('Failed to track experiment event:', error);
    }
  };

  /**
   * Check if user should see new onboarding flow
   */
  const shouldUseNewOnboarding = computed(() => {
    return getVariant('onboarding_flow') === 'value_first';
  });

  /**
   * Check if user should see just-in-time profile collection
   */
  const shouldUseJustInTimeProfile = computed(() => {
    return getVariant('profile_collection') === 'just_in_time';
  });

  /**
   * Get all active experiments for current user
   */
  const getActiveExperiments = () => {
    const activeExperiments = {};

    Object.keys(experiments).forEach((experimentName) => {
      if (experiments[experimentName].enabled) {
        activeExperiments[experimentName] = getVariant(experimentName);
      }
    });

    return activeExperiments;
  };

  /**
   * Force a specific variant (for testing purposes)
   */
  const forceVariant = (experimentName, variant) => {
    const userId = user.value?.id;
    if (userId) {
      const assignmentKey = `${userId}_${experimentName}`;
      experimentAssignments.value.set(assignmentKey, variant);
    } else {
      sessionStorage.setItem(`experiment_${experimentName}`, variant);
    }

    trackExperiment(experimentName, variant, 'forced', {
      forced: true,
    });
  };

  /**
   * Get experiment statistics (for admin/debugging)
   */
  const getExperimentStats = () => {
    const stats = {};

    Object.keys(experiments).forEach((experimentName) => {
      const experiment = experiments[experimentName];
      const assignments = Array.from(experimentAssignments.value.entries())
        .filter(([key]) => key.includes(experimentName))
        .map(([, variant]) => variant);

      const variantCounts = {};
      experiment.variants.forEach((variant) => {
        variantCounts[variant] = assignments.filter(
          (v) => v === variant
        ).length;
      });

      stats[experimentName] = {
        ...experiment,
        totalAssignments: assignments.length,
        variantCounts,
        events: experimentEvents.value.filter(
          (e) => e.experiment === experimentName
        ).length,
      };
    });

    return stats;
  };

  return {
    getVariant,
    trackExperiment,
    shouldUseNewOnboarding,
    shouldUseJustInTimeProfile,
    getActiveExperiments,
    forceVariant,
    getExperimentStats,
    experiments: computed(() => experiments),
  };
}

/**
 * Simple hash function for consistent user assignment
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get or create session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId =
      'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

/**
 * Utility function to check if user is in experiment
 */
export function isInExperiment(experimentName, variant) {
  const { getVariant } = useOnboardingExperiment();
  return getVariant(experimentName) === variant;
}

/**
 * Utility function to track conversion events
 */
export function trackConversion(experimentName, conversionType, data = {}) {
  const { getVariant, trackExperiment } = useOnboardingExperiment();
  const variant = getVariant(experimentName);

  trackExperiment(experimentName, variant, 'conversion', {
    conversionType,
    ...data,
  });
}
