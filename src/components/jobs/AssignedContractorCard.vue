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
  <Card
    v-else
    class="assigned-contractor-card p-0 overflow-hidden bg-transparent"
    hover
  >
    <!-- Header Section -->
    <div class="flex items-start space-x-4 p-6 pb-4">
      <!-- Profile Image -->
      <div class="relative flex-shrink-0">
        <img
          v-if="contractorImageUrl"
          :src="contractorImageUrl"
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
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white truncate"
          >
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

    <!-- Not yet discussed section -->
    <div v-else-if="!isLoadingProposal" class="px-6 pb-4">
      <Label class="text-sm font-medium mb-2 block text-muted-foreground">
        {{ $t('dashboard.agreedTerms') }}
      </Label>
      <div
        class="bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-3"
      >
        <div class="flex items-center gap-2 mb-1">
          <MessageCircle class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">
            {{ $t('dashboard.notYetDiscussed') }}
          </span>
        </div>
        <p class="text-xs text-muted-foreground">
          {{ $t('dashboard.notYetDiscussedDescription') }}
        </p>
      </div>
    </div>

    <!-- Loading state for budget proposal -->
    <div v-else-if="isLoadingProposal" class="px-6 pb-4">
      <div class="animate-pulse">
        <div class="h-4 bg-muted rounded w-1/3 mb-2"></div>
        <div class="h-16 bg-muted rounded"></div>
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
import { useAuth } from '@/composables/useAuth';

const { t } = useI18n();
const router = useRouter();
const chatStore = useChatStore();
const budgetProposals = useBudgetProposals();
const auth = useAuth();

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

const contractorImageUrl = computed(() => {
  if (!assignedUser.value) return null;

  // Check for multiple possible image field names, prioritizing the most common ones
  const imageFields = [
    'profile_picture_url', // Primary field used in database
    'avatar_url',
    'profile_image_url',
    'image_url',
    'photo_url',
    'picture_url',
    'profile_image',
    'photo',
    'picture',
    'avatar',
    'profile_photo',
  ];

  // First check direct fields on the user object
  for (const field of imageFields) {
    const imageUrl = assignedUser.value[field];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      console.log(
        `[AssignedContractorCard] Found contractor image in field '${field}':`,
        imageUrl
      );
      return imageUrl.trim();
    }
  }

  // Check nested contractor_profiles object (common pattern in the app)
  if (assignedUser.value.contractor_profiles) {
    for (const field of imageFields) {
      const imageUrl = assignedUser.value.contractor_profiles[field];
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
        console.log(
          `[AssignedContractorCard] Found contractor image in contractor_profiles.${field}:`,
          imageUrl
        );
        return imageUrl.trim();
      }
    }
  }

  // Check nested profile object
  if (assignedUser.value.profile) {
    for (const field of imageFields) {
      const imageUrl = assignedUser.value.profile[field];
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
        console.log(
          `[AssignedContractorCard] Found contractor image in profile.${field}:`,
          imageUrl
        );
        return imageUrl.trim();
      }
    }
  }

  console.log(
    '[AssignedContractorCard] No contractor image found in any field. Available fields:',
    Object.keys(assignedUser.value)
  );
  if (assignedUser.value.contractor_profiles) {
    console.log(
      '[AssignedContractorCard] contractor_profiles fields:',
      Object.keys(assignedUser.value.contractor_profiles)
    );
  }
  return null;
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
  // For clients (job owners): only show action buttons for in_progress and completed jobs
  if (props.isJobOwner) {
    return ['in_progress', 'completed'].includes(props.jobStatus);
  }

  // For contractors: show start job button when assigned, and other actions when appropriate
  if (props.userRole === 'contractor') {
    return ['assigned', 'in_progress', 'completed'].includes(props.jobStatus);
  }

  return false;
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
    console.log('[AssignedContractorCard] User data received:', props.user);

    // Log available image-related fields for debugging
    const imageFields = [
      'profile_picture_url', // Primary field used in database
      'avatar_url',
      'profile_image_url',
      'image_url',
      'photo_url',
      'picture_url',
      'profile_image',
      'photo',
      'picture',
      'avatar',
      'profile_photo',
    ];

    const availableImageFields = imageFields.filter(
      (field) => props.user[field]
    );
    if (availableImageFields.length > 0) {
      console.log(
        '[AssignedContractorCard] Available image fields:',
        availableImageFields.map((field) => ({
          field,
          value: props.user[field],
        }))
      );
    } else {
      console.log(
        '[AssignedContractorCard] No image fields found. All user fields:',
        Object.keys(props.user)
      );
    }

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
  console.log('[AssignedContractorCard] fetchBudgetProposalData called with:', {
    jobId: props.jobId,
    chatRoomId: props.chatRoomId,
  });

  if (!props.jobId) {
    console.log(
      '[AssignedContractorCard] No jobId provided, skipping budget proposal fetch'
    );
    return;
  }

  isLoadingProposal.value = true;
  try {
    // First, let's try to fetch all budget proposals for debugging
    const supabase = auth.getSupabaseClient();
    const { data: allProposals, error: allError } = await supabase
      .from('budget_proposals')
      .select('*')
      .limit(10);

    console.log(
      '[AssignedContractorCard] All budget proposals (first 10):',
      allProposals
    );
    console.log(
      '[AssignedContractorCard] Error fetching all proposals:',
      allError
    );

    // Let's also check proposals for this specific job
    const { data: jobProposals, error: jobError } = await supabase
      .from('budget_proposals')
      .select('*')
      .eq('job_id', props.jobId);

    console.log(
      '[AssignedContractorCard] Proposals for this job:',
      jobProposals
    );
    console.log('[AssignedContractorCard] Job proposals error:', jobError);

    // Now try our specific query
    const proposal = await budgetProposals.fetchAcceptedBudgetProposal(
      props.jobId,
      props.chatRoomId
    );
    console.log('[AssignedContractorCard] Budget proposal result:', proposal);
    acceptedProposal.value = proposal;
  } catch (error) {
    console.error(
      '[AssignedContractorCard] Error fetching budget proposal:',
      error
    );
    // Don't set error state as this is optional data
  } finally {
    isLoadingProposal.value = false;
  }
};

const handleImageError = (event) => {
  console.warn(
    '[AssignedContractorCard] Failed to load contractor image:',
    event.target.src
  );
  event.target.style.display = 'none';

  // Force reactivity update to show fallback avatar
  const currentUser = assignedUser.value;
  if (currentUser) {
    // Try to find an alternative image URL if available
    const imageFields = [
      'profile_picture_url', // Primary field used in database
      'avatar_url',
      'profile_image_url',
      'image_url',
      'photo_url',
      'picture_url',
      'profile_image',
      'photo',
      'picture',
      'avatar',
      'profile_photo',
    ];

    const failedUrl = event.target.src;

    // Check direct fields
    for (const field of imageFields) {
      const imageUrl = currentUser[field];
      if (
        imageUrl &&
        imageUrl !== failedUrl &&
        typeof imageUrl === 'string' &&
        imageUrl.trim()
      ) {
        console.log(
          `[AssignedContractorCard] Trying alternative image from field '${field}':`,
          imageUrl
        );
        event.target.src = imageUrl.trim();
        event.target.style.display = 'block';
        return;
      }
    }

    // Check nested contractor_profiles object
    if (currentUser.contractor_profiles) {
      for (const field of imageFields) {
        const imageUrl = currentUser.contractor_profiles[field];
        if (
          imageUrl &&
          imageUrl !== failedUrl &&
          typeof imageUrl === 'string' &&
          imageUrl.trim()
        ) {
          console.log(
            `[AssignedContractorCard] Trying alternative image from contractor_profiles.${field}:`,
            imageUrl
          );
          event.target.src = imageUrl.trim();
          event.target.style.display = 'block';
          return;
        }
      }
    }

    // Check nested profile object
    if (currentUser.profile) {
      for (const field of imageFields) {
        const imageUrl = currentUser.profile[field];
        if (
          imageUrl &&
          imageUrl !== failedUrl &&
          typeof imageUrl === 'string' &&
          imageUrl.trim()
        ) {
          console.log(
            `[AssignedContractorCard] Trying alternative image from profile.${field}:`,
            imageUrl
          );
          event.target.src = imageUrl.trim();
          event.target.style.display = 'block';
          return;
        }
      }
    }
  }
};

const viewProfile = () => {
  if (assignedUser.value) {
    emit('view-profile', assignedUser.value);
    router.push(`/contractors/${assignedUser.value.id}`);
  }
};

const startConversation = async () => {
  // Try different possible ID field names
  let contractorId =
    assignedUser.value?.id ||
    assignedUser.value?.user_id ||
    assignedUser.value?.contractor_id;

  // If no ID in user object, delegate to parent component
  if (!contractorId) {
    console.log(
      'No contractor ID in user object, delegating to parent component'
    );
    emit('start-conversation', assignedUser.value);
    return;
  }

  isCreatingChat.value = true;
  try {
    emit('start-conversation', assignedUser.value);
    const roomId = await chatStore.createOrGetChatRoom(contractorId);
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
        emit('mark-in-progress', assignedUser.value);
        break;
      case 'in_progress':
        emit('mark-completed', assignedUser.value);
        break;
      case 'completed':
        emit('rate-contractor', assignedUser.value);
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
  emit('mark-in-progress', assignedUser.value);
};

const markJobCompleted = () => {
  emit('mark-completed', assignedUser.value);
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
