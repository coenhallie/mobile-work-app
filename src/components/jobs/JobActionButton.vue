<template>
  <div class="job-action-container">
    <!--
      Enhanced JobActionButton Component
      
      This component implements a three-tier action hierarchy system:
      1. Primary Actions: Large, prominent buttons for critical workflow actions
      2. Secondary Actions: Medium buttons for important but non-critical actions
      3. Tertiary Actions: Smaller buttons or overflow menu items for optional actions
      
      Features:
      - Context-aware action prioritization based on job status and user role
      - Enhanced visual hierarchy with proper sizing and colors
      - Mobile-first responsive design with touch-friendly targets
      - Loading states and micro-interactions
      - Accessibility improvements
    -->

    <!-- Primary Action Zone -->
    <div v-if="primaryAction" class="primary-action-zone">
      <Button
        :size="getActionSize('primary')"
        :variant="getActionVariant(primaryAction)"
        :disabled="isActionDisabled(primaryAction)"
        :loading="isProcessing && currentAction === primaryAction.action"
        :class="getPrimaryActionClasses(primaryAction)"
        :haptic-feedback="getHapticFeedback(primaryAction)"
        @click="handleAction(primaryAction.action)"
        :aria-label="getActionAriaLabel(primaryAction)"
      >
        <component
          v-if="primaryAction.icon"
          :is="primaryAction.icon"
          :class="getIconClasses('primary')"
        />
        {{ getActionText(primaryAction) }}
      </Button>
    </div>

    <!-- Secondary Actions Zone -->
    <div v-if="secondaryActions.length > 0" class="secondary-actions-zone">
      <div class="secondary-actions-row">
        <Button
          v-for="action in visibleSecondaryActions"
          :key="action.action"
          :size="getActionSize('secondary')"
          :variant="getActionVariant(action)"
          :disabled="isActionDisabled(action)"
          :loading="isProcessing && currentAction === action.action"
          :class="getSecondaryActionClasses(action)"
          :haptic-feedback="getHapticFeedback(action)"
          @click="handleAction(action.action)"
          :aria-label="getActionAriaLabel(action)"
        >
          <component
            v-if="action.icon"
            :is="action.icon"
            :class="getIconClasses('secondary')"
          />
          <span v-if="!action.iconOnly">{{ getActionText(action) }}</span>
        </Button>

        <!-- Overflow Menu for Additional Secondary Actions -->
        <div v-if="overflowSecondaryActions.length > 0" class="overflow-menu">
          <Button
            size="sm"
            variant="outline"
            :class="getOverflowButtonClasses()"
            @click="toggleOverflowMenu"
            :aria-label="$t('jobs.moreActions')"
            :aria-expanded="showOverflowMenu"
          >
            <MoreHorizontalIcon :class="getIconClasses('secondary')" />
          </Button>

          <!-- Overflow Menu Dropdown -->
          <div v-if="showOverflowMenu" class="overflow-dropdown" @click.stop>
            <Button
              v-for="action in overflowSecondaryActions"
              :key="action.action"
              size="sm"
              variant="ghost"
              :disabled="isActionDisabled(action)"
              :loading="isProcessing && currentAction === action.action"
              class="overflow-action-item"
              @click="handleAction(action.action)"
              :aria-label="getActionAriaLabel(action)"
            >
              <component
                v-if="action.icon"
                :is="action.icon"
                :class="getIconClasses('tertiary')"
              />
              {{ getActionText(action) }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tertiary Actions (Overflow Menu) -->
    <div
      v-if="tertiaryActions.length > 0 && showTertiaryActions"
      class="tertiary-actions-zone"
    >
      <div class="tertiary-actions-menu">
        <Button
          v-for="action in tertiaryActions"
          :key="action.action"
          size="sm"
          variant="ghost"
          :disabled="isActionDisabled(action)"
          :loading="isProcessing && currentAction === action.action"
          class="tertiary-action-item"
          @click="handleAction(action.action)"
          :aria-label="getActionAriaLabel(action)"
        >
          <component
            v-if="action.icon"
            :is="action.icon"
            :class="getIconClasses('tertiary')"
          />
          {{ getActionText(action) }}
        </Button>
      </div>
    </div>

    <!-- Status Indicator for Waiting States -->
    <div v-if="showStatusIndicator" class="status-indicator">
      <div class="status-badge" :class="getStatusBadgeClasses()">
        <component
          v-if="statusIndicator.icon"
          :is="statusIndicator.icon"
          class="status-icon"
        />
        <span class="status-text">{{ statusIndicator.text }}</span>
        <span v-if="statusIndicator.subtitle" class="status-subtitle">
          {{ statusIndicator.subtitle }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useJobStore, JOB_STATUS } from '../../stores/job';
import { useAuth } from '../../composables/useAuth';
import Button from '../ui/button/Button.vue';

// Import icons for enhanced visual hierarchy
import {
  PlayIcon,
  CheckIcon,
  EyeIcon,
  MessageCircleIcon,
  EditIcon,
  UsersIcon,
  ClockIcon,
  XIcon,
  TrashIcon,
  MoreHorizontalIcon,
  StarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  HourglassIcon,
} from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
    validator: (value) => ['contractor', 'client', 'admin'].includes(value),
  },
  // Optional prop to indicate if the contractor has already applied
  hasAppliedProp: {
    type: Boolean,
    default: null,
  },
  // Prop to indicate if the component is rendered in the job details view
  isJobDetailsView: {
    type: Boolean,
    default: false,
  },
  // New props for enhanced functionality
  actionPriority: {
    type: String,
    default: 'auto', // 'auto', 'primary', 'secondary', 'tertiary'
    validator: (value) =>
      ['auto', 'primary', 'secondary', 'tertiary'].includes(value),
  },
  showSecondaryActions: {
    type: Boolean,
    default: true,
  },
  showTertiaryActions: {
    type: Boolean,
    default: false, // Only show in job details view by default
  },
  maxSecondaryActions: {
    type: Number,
    default: 2, // Maximum secondary actions before overflow
  },
  compactMode: {
    type: Boolean,
    default: false, // For mobile or constrained layouts
  },
  urgencyLevel: {
    type: String,
    default: 'normal', // 'low', 'normal', 'high', 'urgent'
    validator: (value) => ['low', 'normal', 'high', 'urgent'].includes(value),
  },
});

const emit = defineEmits([
  'action',
  'applied',
  'application-error',
  'secondary-action',
]);

// Get the job store and user info
const jobStore = useJobStore();
const { user } = useAuth();
const userId = computed(() => user.value?.id);

// Local state
const isApplying = ref(false);
const isProcessing = ref(false);
const hasApplied = ref(props.hasAppliedProp);
const currentAction = ref(null);
const showOverflowMenu = ref(false);

// Enhanced action definitions based on design plan
const actionDefinitions = {
  // Contractor actions
  contractor: {
    open: {
      primary: {
        action: 'apply',
        text: 'buttons.apply',
        icon: StarIcon,
        variant: 'default',
        urgency: 'high',
      },
      secondary: [
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: false,
        },
        {
          action: 'save',
          text: 'jobs.saveJob',
          icon: StarIcon,
          iconOnly: true,
        },
      ],
    },
    assigned: {
      primary: {
        action: 'start',
        text: 'jobs.startJob',
        icon: PlayIcon,
        variant: 'default',
        urgency: 'urgent',
      },
      secondary: [
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: false,
        },
        {
          action: 'message',
          text: 'jobs.messageClient',
          icon: MessageCircleIcon,
          iconOnly: true,
        },
      ],
    },
    in_progress: {
      primary: {
        action: 'complete',
        text: 'jobs.markComplete',
        icon: CheckIcon,
        variant: 'default',
        urgency: 'high',
      },
      secondary: [
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: false,
        },
        {
          action: 'message',
          text: 'jobs.messageClient',
          icon: MessageCircleIcon,
          iconOnly: true,
        },
      ],
      tertiary: [
        { action: 'upload', text: 'jobs.uploadProgress', icon: EditIcon },
      ],
    },
    completed: {
      status: {
        text: 'jobs.awaitingReview',
        icon: HourglassIcon,
        variant: 'outline',
      },
      secondary: [
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: false,
        },
        {
          action: 'message',
          text: 'jobs.messageClient',
          icon: MessageCircleIcon,
          iconOnly: true,
        },
      ],
    },
  },
  // Client actions
  client: {
    open: {
      primary: {
        action: 'viewApplications',
        text: 'jobs.viewApplications',
        icon: UsersIcon,
        variant: 'default',
        urgency: 'high',
        condition: 'hasApplications',
      },
      primaryFallback: {
        action: 'edit',
        text: 'jobs.editJob',
        icon: EditIcon,
        variant: 'outline',
        urgency: 'normal',
      },
      secondary: [
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: false,
        },
        {
          action: 'promote',
          text: 'jobs.promoteJob',
          icon: StarIcon,
          iconOnly: true,
        },
      ],
      tertiary: [
        {
          action: 'cancel',
          text: 'jobs.cancelJob',
          icon: XIcon,
          variant: 'destructive',
        },
      ],
    },
    assigned: {
      primary: {
        action: 'viewProgress',
        text: 'jobs.viewProgress',
        icon: EyeIcon,
        variant: 'default',
        urgency: 'normal',
      },
      secondary: [
        {
          action: 'message',
          text: 'jobs.messageContractor',
          icon: MessageCircleIcon,
          iconOnly: false,
        },
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: true,
        },
      ],
    },
    in_progress: {
      status: {
        text: 'jobs.inProgress',
        icon: ClockIcon,
        variant: 'outline',
      },
      secondary: [
        {
          action: 'message',
          text: 'jobs.messageContractor',
          icon: MessageCircleIcon,
          iconOnly: false,
        },
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: true,
        },
      ],
    },
    completed: {
      primary: {
        action: 'review',
        text: 'jobs.reviewWork',
        icon: CheckCircleIcon,
        variant: 'default',
        urgency: 'urgent',
      },
      secondary: [
        {
          action: 'message',
          text: 'jobs.messageContractor',
          icon: MessageCircleIcon,
          iconOnly: false,
        },
        {
          action: 'view',
          text: 'jobs.viewDetails',
          icon: EyeIcon,
          iconOnly: true,
        },
      ],
    },
    cancelled: {
      tertiary: [
        {
          action: 'remove',
          text: 'jobs.removeJob',
          icon: TrashIcon,
          variant: 'destructive',
        },
      ],
    },
  },
};

// Computed properties for action hierarchy
const currentActions = computed(() => {
  const role = props.userRole;
  const status =
    props.job.status === 'pending_assignment' ? 'assigned' : props.job.status;

  if (!actionDefinitions[role] || !actionDefinitions[role][status]) {
    return { primary: null, secondary: [], tertiary: [], status: null };
  }

  const actions = actionDefinitions[role][status];
  let primary = actions.primary;

  // Handle conditional primary actions (e.g., view applications vs edit job)
  if (primary?.condition === 'hasApplications') {
    const hasApplications = props.job.applicant_count > 0;
    if (!hasApplications && actions.primaryFallback) {
      primary = actions.primaryFallback;
    }
  }

  // Handle applied state for contractors
  if (role === 'contractor' && status === 'open' && hasApplied.value) {
    primary = {
      action: 'applied',
      text: 'jobs.youveApplied',
      icon: CheckIcon,
      variant: 'outline',
      disabled: true,
    };
  }

  return {
    primary,
    secondary: actions.secondary || [],
    tertiary: actions.tertiary || [],
    status: actions.status || null,
  };
});

const primaryAction = computed(() => currentActions.value.primary);
const secondaryActions = computed(() => currentActions.value.secondary);
const tertiaryActions = computed(() => currentActions.value.tertiary);
const statusIndicator = computed(() => currentActions.value.status);

// Visible secondary actions (before overflow)
const visibleSecondaryActions = computed(() => {
  if (props.compactMode) {
    return secondaryActions.value.slice(0, 1);
  }
  return secondaryActions.value.slice(0, props.maxSecondaryActions);
});

const overflowSecondaryActions = computed(() => {
  if (props.compactMode) {
    return secondaryActions.value.slice(1);
  }
  return secondaryActions.value.slice(props.maxSecondaryActions);
});

const showStatusIndicator = computed(() => {
  return statusIndicator.value && !primaryAction.value;
});

// Action size based on hierarchy and urgency
const getActionSize = (hierarchy) => {
  if (hierarchy === 'primary') {
    if (props.urgencyLevel === 'urgent' || props.urgencyLevel === 'high') {
      return 'lg'; // 48px height
    }
    return 'default'; // 40px height
  }
  if (hierarchy === 'secondary') {
    return props.compactMode ? 'sm' : 'default'; // 32px or 40px height
  }
  return 'sm'; // 32px height for tertiary
};

// Action variant based on type and urgency
const getActionVariant = (action) => {
  if (action.variant) return action.variant;

  if (action.urgency === 'urgent') return 'default';
  if (action.urgency === 'high') return 'default';
  if (action.urgency === 'normal') return 'outline';

  return 'outline';
};

// Check if action is disabled
const isActionDisabled = (action) => {
  if (action.disabled) return true;
  if (isProcessing.value && currentAction.value !== action.action) return true;

  // Special cases
  if (action.action === 'apply' && (isApplying.value || hasApplied.value))
    return true;

  return false;
};

// Get action text with processing state
const getActionText = (action) => {
  if (isProcessing.value && currentAction.value === action.action) {
    return t('jobs.processing');
  }
  return t(action.text);
};

// CSS classes for different action types
const getPrimaryActionClasses = (action) => {
  const classes = ['primary-action-button'];

  if (action.urgency === 'urgent') {
    classes.push('urgent-action');
  } else if (action.urgency === 'high') {
    classes.push('high-priority-action');
  }

  if (props.compactMode) {
    classes.push('compact-mode');
  }

  return classes.join(' ');
};

const getSecondaryActionClasses = (action) => {
  const classes = ['secondary-action-button'];

  if (action.iconOnly) {
    classes.push('icon-only');
  }

  return classes.join(' ');
};

const getOverflowButtonClasses = () => {
  return 'overflow-menu-button';
};

const getStatusBadgeClasses = () => {
  const classes = ['status-badge-content'];

  if (statusIndicator.value?.urgency === 'urgent') {
    classes.push('urgent-status');
  }

  return classes.join(' ');
};

// Icon classes based on hierarchy
const getIconClasses = (hierarchy) => {
  const baseClasses = ['action-icon'];

  if (hierarchy === 'primary') {
    baseClasses.push('primary-icon');
  } else if (hierarchy === 'secondary') {
    baseClasses.push('secondary-icon');
  } else {
    baseClasses.push('tertiary-icon');
  }

  return baseClasses.join(' ');
};

// Haptic feedback based on action importance
const getHapticFeedback = (action) => {
  if (action.urgency === 'urgent') return 'heavy';
  if (action.urgency === 'high') return 'medium';
  return 'light';
};

// Accessibility labels
const getActionAriaLabel = (action) => {
  const baseLabel = t(action.text);
  const jobTitle = props.job.title;
  return `${baseLabel} for ${jobTitle}`;
};

// Toggle overflow menu
const toggleOverflowMenu = () => {
  showOverflowMenu.value = !showOverflowMenu.value;
};

// Close overflow menu when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.overflow-menu')) {
    showOverflowMenu.value = false;
  }
};

// Check if the contractor has already applied for this job
const checkIfUserHasApplied = async () => {
  if (props.hasAppliedProp !== null) {
    hasApplied.value = props.hasAppliedProp;
    return;
  }

  if (!props.job.id || !userId.value || props.userRole !== 'contractor') {
    return;
  }

  try {
    const { getSupabaseClient } = useAuth();
    const supabase = getSupabaseClient();

    const { data: applications } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', props.job.id)
      .eq('contractor_user_id', userId.value)
      .limit(1);

    hasApplied.value = applications && applications.length > 0;
  } catch (err) {
    console.error('Error checking if user has applied:', err);
  }
};

// Enhanced action handler with better state management
const handleAction = async (action) => {
  if (isProcessing.value) return;

  currentAction.value = action;
  isProcessing.value = true;
  showOverflowMenu.value = false; // Close overflow menu

  try {
    // Handle apply action specially
    if (action === 'apply') {
      await handleApply();
      return;
    }

    // Emit the action event for parent components to handle
    emit('action', action);

    // Emit secondary action event for analytics/tracking
    if (secondaryActions.value.some((a) => a.action === action)) {
      emit('secondary-action', action);
    }
  } catch (err) {
    console.error(`Error handling ${action} action:`, err);
    emit('application-error', err.message);
  } finally {
    // Reset processing state after feedback delay
    setTimeout(() => {
      isProcessing.value = false;
      currentAction.value = null;
    }, 500);
  }
};

// Enhanced apply handler
const handleApply = async () => {
  if (isApplying.value || hasApplied.value) return;

  isApplying.value = true;

  try {
    emit('action', 'apply');

    if (!props.job.id || !userId.value) {
      throw new Error('Missing job ID or user ID');
    }

    const { success, applicationId, error } = await jobStore.applyToJob(
      props.job.id,
      userId.value
    );

    if (success) {
      hasApplied.value = true;
      emit('applied', { applicationId });
    } else {
      emit('application-error', error || 'Failed to apply for job');
    }
  } catch (err) {
    console.error('Error applying for job:', err);
    emit('application-error', err.message);
  } finally {
    isApplying.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  checkIfUserHasApplied();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Enhanced Job Action Button Styles */
/* Uses regular CSS instead of Tailwind @apply to avoid compatibility issues */

.job-action-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.75rem;
}

/* Primary Action Zone */
.primary-action-zone {
  width: 100%;
}

.primary-action-button {
  width: 100%;
  min-height: 48px;
}

.primary-action-button.urgent-action {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.primary-action-button.compact-mode {
  min-height: 44px;
}

/* Secondary Actions Zone */
.secondary-actions-zone {
  width: 100%;
}

.secondary-actions-row {
  display: flex;
  width: 100%;
  gap: 0.5rem;
}

.secondary-action-button {
  flex: 1;
  min-height: 40px;
}

.secondary-action-button.icon-only {
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  min-height: 40px;
}

/* Overflow Menu */
.overflow-menu {
  position: relative;
  flex: none;
}

.overflow-menu-button {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  min-height: 40px;
}

.overflow-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  z-index: 50;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  padding: 0.25rem 0;
  min-width: 180px;
  opacity: 0;
  transform: translateY(-8px);
  animation: slideInFromTop 150ms ease-out forwards;
}

@keyframes slideInFromTop {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.overflow-action-item {
  width: 100%;
  justify-content: flex-start;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: 0;
  box-shadow: none;
}

.overflow-action-item:hover {
  background-color: #f9fafb;
}

/* Tertiary Actions Zone */
.tertiary-actions-zone {
  width: 100%;
}

.tertiary-actions-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tertiary-action-item {
  min-height: 32px;
}

/* Status Indicator */
.status-indicator {
  width: 100%;
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  min-height: 40px;
}

.status-badge-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge.urgent-status {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.status-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.status-text {
  font-weight: 500;
  font-size: 0.875rem;
}

.status-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.25rem;
}

/* Icon Styles */
.action-icon {
  flex-shrink: 0;
}

.primary-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.secondary-icon {
  width: 1rem;
  height: 1rem;
}

.tertiary-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .job-action-container {
    gap: 0.5rem;
  }

  .primary-action-button {
    min-height: 48px;
  }

  .secondary-action-button {
    min-height: 44px;
  }

  .secondary-action-button.icon-only {
    width: 2.75rem;
    height: 2.75rem;
    min-height: 44px;
  }

  .overflow-menu-button {
    width: 2.75rem;
    height: 2.75rem;
    min-height: 44px;
  }

  .secondary-actions-row {
    gap: 0.375rem;
  }

  .overflow-dropdown {
    min-width: 160px;
  }

  @media (max-width: 480px) {
    .secondary-actions-row {
      flex-direction: column;
      gap: 0.5rem;
    }

    .secondary-action-button {
      flex: 1;
    }

    .secondary-action-button.icon-only {
      width: 100%;
      height: 2.75rem;
    }
  }
}

/* Tablet Responsive Design */
@media (min-width: 768px) and (max-width: 1024px) {
  .primary-action-button {
    min-height: 46px;
  }

  .secondary-action-button {
    min-height: 38px;
  }
}

/* Desktop Enhancements */
@media (min-width: 1024px) {
  .primary-action-button {
    min-height: 48px;
  }

  .secondary-action-button {
    min-height: 40px;
  }

  .primary-action-button:hover {
    transform: scale(1.02);
  }

  .secondary-action-button:hover {
    transform: scale(1.01);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .overflow-dropdown {
    background-color: #1f2937;
    border-color: #374151;
  }

  .overflow-action-item:hover {
    background-color: #374151;
  }

  .status-badge {
    background-color: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
  }

  .status-badge.urgent-status {
    background-color: rgb(127 29 29 / 0.2);
    border-color: #991b1b;
    color: #fca5a5;
  }
}

/* Print Styles */
@media print {
  .job-action-container {
    display: none;
  }
}
</style>
