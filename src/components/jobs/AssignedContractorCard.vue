<template>
  <!-- Loading State -->
  <BaseSkeleton
    v-if="loading"
    layout="card"
    :show-avatar="true"
    :show-title="true"
    :show-subtitle="true"
    :description-lines="3"
    :footer-elements="2"
    :show-action="true"
  />

  <!-- Assigned Contractor Card Content -->
  <Card v-else class="assigned-contractor-card p-0 overflow-hidden" hover>
    <!-- Header Section -->
    <div class="flex items-start space-x-4 p-6 pb-4">
      <!-- Profile Image -->
      <div class="relative flex-shrink-0">
        <img
          v-if="assignedUser?.avatar_url"
          :src="assignedUser.avatar_url"
          :alt="`${contractorName}'s profile picture`"
          class="w-16 h-16 rounded-full object-cover border-2 border-border"
          loading="lazy"
          @error="handleImageError"
        />
        <!-- Fallback Avatar -->
        <div
          v-else
          class="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground border-2 border-border"
        >
          <User class="w-8 h-8" />
        </div>

        <!-- Online Status Indicator -->
        <div
          v-if="assignedUser?.is_online"
          class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"
          :title="$t('dashboard.online')"
        ></div>
      </div>

      <!-- Contractor Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-xl font-semibold text-foreground truncate">
            {{ contractorName }}
          </h3>
          <Badge
            v-if="assignedUser?.verified"
            variant="secondary"
            class="text-xs"
          >
            <Shield class="w-3 h-3 mr-1" />
            {{ $t('dashboard.verified') }}
          </Badge>
        </div>

        <p class="text-sm text-muted-foreground mb-2 truncate">
          {{ assignedUser?.primary_skill || assignedUser?.primarySkill }}
        </p>

        <!-- Rating and Experience -->
        <div class="flex items-center gap-4 mb-2">
          <div
            v-if="assignedUser?.rating || assignedUser?.average_rating"
            class="flex items-center text-yellow-500"
          >
            <Star class="w-4 h-4 fill-current" />
            <span class="ml-1 text-sm font-medium">
              {{
                (assignedUser.rating || assignedUser.average_rating).toFixed(1)
              }}
            </span>
            <span class="ml-1 text-xs text-muted-foreground">
              ({{ assignedUser.review_count || 0 }}
              {{ $t('dashboard.reviews') }})
            </span>
          </div>

          <div
            v-if="assignedUser?.completion_rate"
            class="text-sm text-muted-foreground"
          >
            {{ assignedUser.completion_rate }}%
            {{ $t('dashboard.completionRate') }}
          </div>
        </div>

        <!-- Job Status Badge -->
        <div class="flex items-center gap-2">
          <Badge :variant="jobStatusVariant" class="text-xs">
            <component :is="jobStatusIcon" class="w-3 h-3 mr-1" />
            {{ jobStatusText }}
          </Badge>
          <span
            v-if="assignedUser?.avg_response_time"
            class="text-xs text-muted-foreground"
          >
            <Clock class="w-3 h-3 inline mr-1" />
            {{ $t('dashboard.respondsIn') }}
            {{ assignedUser.avg_response_time }}
          </span>
        </div>
      </div>

      <!-- Quick Actions Dropdown -->
      <DropdownMenu v-if="isJobOwner">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <MoreVertical class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="viewProfile">
            <User class="w-4 h-4 mr-2" />
            {{ $t('dashboard.viewProfile') }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="startConversation">
            <MessageCircle class="w-4 h-4 mr-2" />
            {{ $t('dashboard.sendMessage') }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="makePhoneCall" v-if="assignedUser?.phone">
            <Phone class="w-4 h-4 mr-2" />
            {{ $t('dashboard.callContractor') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="showJobActions" />
          <DropdownMenuItem
            v-if="jobStatus === 'assigned'"
            @click="markJobInProgress"
          >
            <Play class="w-4 h-4 mr-2" />
            {{ $t('dashboard.markInProgress') }}
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="jobStatus === 'in_progress'"
            @click="markJobCompleted"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            {{ $t('dashboard.markCompleted') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Skills Section -->
    <div v-if="contractorSkills.length > 0" class="px-6 pb-4">
      <div class="flex flex-wrap gap-1.5">
        <Badge
          v-for="skill in contractorSkills.slice(0, 4)"
          :key="skill"
          variant="outline"
          class="text-xs"
        >
          {{ skill }}
        </Badge>
        <Badge
          v-if="contractorSkills.length > 4"
          variant="outline"
          class="text-xs"
        >
          +{{ contractorSkills.length - 4 }}
        </Badge>
      </div>
    </div>

    <!-- Contact Information -->
    <div v-if="assignedUser?.phone || assignedUser?.email" class="px-6 pb-4">
      <Label class="text-sm font-medium mb-2 block">
        {{ $t('dashboard.contactInfo') }}
      </Label>
      <div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <div v-if="assignedUser.phone" class="flex items-center gap-1">
          <Phone class="w-3 h-3" />
          <span>{{ assignedUser.phone }}</span>
        </div>
        <div v-if="assignedUser.email" class="flex items-center gap-1">
          <Mail class="w-3 h-3" />
          <span>{{ assignedUser.email }}</span>
        </div>
      </div>
    </div>

    <!-- Bio/Description -->
    <div v-if="assignedUser?.bio" class="px-6 pb-4">
      <Label class="text-sm font-medium mb-2 block">
        {{ $t('dashboard.about') }}
      </Label>
      <p class="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {{ assignedUser.bio }}
      </p>
    </div>

    <!-- Agreed Terms Section -->
    <div v-if="showAgreedTerms" class="px-6 pb-4">
      <Label
        class="text-sm font-medium mb-2 block text-green-700 dark:text-green-400"
      >
        {{ $t('dashboard.agreedTerms') }}
      </Label>
      <div
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
      >
        <div class="flex items-center gap-2 mb-2">
          <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-green-800 dark:text-green-300">
            {{ $t('dashboard.negotiatedAmount') }}
          </span>
        </div>
        <div
          class="text-lg font-semibold text-green-900 dark:text-green-100 mb-1"
        >
          {{ displayAmount.formatted }}
        </div>
        <div
          v-if="acceptedProposal?.notes"
          class="text-xs text-green-700 dark:text-green-300 mt-2"
        >
          <span class="font-medium"
            >{{ $t('dashboard.additionalTerms') }}:</span
          >
          {{ acceptedProposal.notes }}
        </div>
        <div
          v-if="acceptedProposal?.created_at"
          class="text-xs text-green-600 dark:text-green-400 mt-1"
        >
          {{ $t('dashboard.agreedOn') }}
          {{ new Date(acceptedProposal.created_at).toLocaleDateString() }}
        </div>
      </div>
    </div>

    <!-- Loading state for budget proposal -->
    <div v-else-if="isLoadingProposal" class="px-6 pb-4">
      <div class="animate-pulse">
        <div class="h-4 bg-muted rounded w-1/3 mb-2"></div>
        <div class="h-16 bg-muted rounded"></div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div
      class="flex items-center justify-between p-6 pt-4 border-t border-border bg-muted/20"
    >
      <!-- Status-specific info -->
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <component :is="jobStatusIcon" class="w-3 h-3" />
        <span>{{ jobStatusDescription }}</span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Message Button -->
        <Button
          variant="outline"
          size="sm"
          @click="startConversation"
          :disabled="isCreatingChat"
          class="min-w-0"
        >
          <div
            v-if="isCreatingChat"
            class="animate-spin w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full"
          ></div>
          <MessageCircle v-else class="w-4 h-4 mr-1" />
          <span class="hidden sm:inline">{{ $t('dashboard.message') }}</span>
        </Button>

        <Button
          v-if="assignedUser?.phone"
          variant="outline"
          size="sm"
          @click="makePhoneCall"
          class="min-w-0"
        >
          <Phone class="w-4 h-4 mr-1" />
          <span class="hidden sm:inline">{{ $t('dashboard.call') }}</span>
        </Button>

        <!-- Primary Action Button (status-dependent) -->
        <Button
          v-if="showPrimaryAction"
          size="sm"
          @click="handlePrimaryAction"
          :disabled="isPerformingAction"
          :variant="primaryActionVariant"
          class="min-w-0"
        >
          <div
            v-if="isPerformingAction"
            class="animate-spin w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full"
          ></div>
          <component v-else :is="primaryActionIcon" class="w-4 h-4 mr-1" />
          <span class="truncate">{{ primaryActionText }}</span>
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Shield,
  Star,
  Clock,
  MoreVertical,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle,
  Play,
  Pause,
  AlertCircle,
  Calendar,
} from 'lucide-vue-next';
import BaseSkeleton from '@/components/shared/BaseSkeleton.vue';
import { useChatStore } from '@/stores/chat';
import { formatDisplayName } from '@/lib/nameFormatter';
import { useBudgetProposals } from '@/composables/useBudgetProposals';

const { t } = useI18n();
const router = useRouter();
const chatStore = useChatStore();
const budgetProposals = useBudgetProposals();

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  jobStatus: {
    type: String,
    required: true,
    validator: (value) =>
      ['assigned', 'in_progress', 'completed', 'cancelled'].includes(value),
  },
  isJobOwner: {
    type: Boolean,
    default: false,
  },
  userRole: {
    type: String,
    default: 'client',
  },
  jobId: {
    type: String,
    default: null,
  },
  chatRoomId: {
    type: String,
    default: null,
  },
  negotiatedAmount: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  'view-profile',
  'start-conversation',
  'phone-call',
  'mark-in-progress',
  'mark-completed',
  'rate-contractor',
]);

// Component state
const loading = ref(true);
const assignedUser = ref(props.user);
const isCreatingChat = ref(false);
const isPerformingAction = ref(false);
const error = ref(null);
const acceptedProposal = ref(null);
const isLoadingProposal = ref(false);

// Computed properties
const contractorName = computed(() => {
  if (!assignedUser.value) return t('dashboard.loadingContractor');
  return (
    formatDisplayName(
      assignedUser.value.full_name || assignedUser.value.name
    ) || t('dashboard.unnamedContractor')
  );
});

const contractorSkills = computed(() => {
  return assignedUser.value?.skills || [];
});

const jobStatusVariant = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return 'secondary';
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
});

const jobStatusIcon = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return Calendar;
    case 'in_progress':
      return Play;
    case 'completed':
      return CheckCircle;
    case 'cancelled':
      return AlertCircle;
    default:
      return Clock;
  }
});

const jobStatusText = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return t('dashboard.assigned');
    case 'in_progress':
      return t('dashboard.inProgress');
    case 'completed':
      return t('dashboard.completed');
    case 'cancelled':
      return t('dashboard.cancelled');
    default:
      return t('dashboard.unknown');
  }
});

const jobStatusDescription = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return t('dashboard.waitingToStart');
    case 'in_progress':
      return t('dashboard.workInProgress');
    case 'completed':
      return t('dashboard.jobCompleted');
    case 'cancelled':
      return t('dashboard.jobCancelled');
    default:
      return '';
  }
});

const showJobActions = computed(() => {
  return (
    props.isJobOwner && ['assigned', 'in_progress'].includes(props.jobStatus)
  );
});

const showPrimaryAction = computed(() => {
  if (!props.isJobOwner) return false;
  return ['assigned', 'in_progress', 'completed'].includes(props.jobStatus);
});

const primaryActionVariant = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return 'default';
    case 'in_progress':
      return 'success';
    case 'completed':
      return 'outline';
    default:
      return 'outline';
  }
});

const primaryActionIcon = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return Play;
    case 'in_progress':
      return CheckCircle;
    case 'completed':
      return Star;
    default:
      return CheckCircle;
  }
});

const primaryActionText = computed(() => {
  switch (props.jobStatus) {
    case 'assigned':
      return t('dashboard.startJob');
    case 'in_progress':
      return t('dashboard.markCompleted');
    case 'completed':
      return t('dashboard.rateContractor');
    default:
      return '';
  }
});

// Budget proposal computed properties
const hasNegotiatedAmount = computed(() => {
  return props.negotiatedAmount || acceptedProposal.value;
});

const displayAmount = computed(() => {
  if (props.negotiatedAmount) {
    return props.negotiatedAmount;
  }

  if (acceptedProposal.value) {
    return budgetProposals.getNegotiatedAmount(acceptedProposal.value);
  }

  return null;
});

const showAgreedTerms = computed(() => {
  return hasNegotiatedAmount.value && displayAmount.value;
});

const fetchContractorData = async () => {
  if (props.user) {
    assignedUser.value = props.user;
    loading.value = false;
  } else {
    // Handle the case where user is not passed as a prop,
    // maybe fetch from a store if applicable
    loading.value = false;
    error.value = 'No user data provided.';
  }
};

const fetchBudgetProposalData = async () => {
  if (!props.jobId) {
    return;
  }

  isLoadingProposal.value = true;
  try {
    const proposal = await budgetProposals.fetchAcceptedBudgetProposal(
      props.jobId
    );
    acceptedProposal.value = proposal;
  } catch (error) {
    console.error('Error fetching budget proposal:', error);
    // Don't set error state as this is optional data
  } finally {
    isLoadingProposal.value = false;
  }
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

const viewProfile = () => {
  if (assignedUser.value) {
    emit('view-profile', assignedUser.value);
    router.push(`/contractors/${assignedUser.value.id}`);
  }
};

const startConversation = async () => {
  if (!assignedUser.value?.id) {
    console.error('No contractor ID available');
    return;
  }

  isCreatingChat.value = true;
  try {
    emit('start-conversation', assignedUser.value);
    const roomId = await chatStore.createDirectChatRoom(assignedUser.value.id);
    await router.push(`/messages/${roomId}`);
  } catch (error) {
    console.error('Error creating chat room:', error);
  } finally {
    isCreatingChat.value = false;
  }
};

const makePhoneCall = () => {
  if (assignedUser.value?.phone) {
    emit('phone-call', assignedUser.value);
    window.open(`tel:${assignedUser.value.phone}`);
  }
};

const handlePrimaryAction = async () => {
  isPerformingAction.value = true;
  try {
    switch (props.jobStatus) {
      case 'assigned':
        emit('mark-in-progress', contractor.value);
        break;
      case 'in_progress':
        emit('mark-completed', contractor.value);
        break;
      case 'completed':
        emit('rate-contractor', contractor.value);
        break;
    }
  } catch (error) {
    console.error('Error performing action:', error);
  } finally {
    setTimeout(() => {
      isPerformingAction.value = false;
    }, 1000);
  }
};

const markJobInProgress = () => {
  emit('mark-in-progress', contractor.value);
};

const markJobCompleted = () => {
  emit('mark-completed', contractor.value);
};

// Lifecycle
onMounted(async () => {
  await fetchContractorData();
  await fetchBudgetProposalData();
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.assigned-contractor-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .assigned-contractor-card .hidden {
    display: none;
  }
}
</style>

<style scoped>
.assigned-contractor-card {
  margin-top: 0;
}
</style>
