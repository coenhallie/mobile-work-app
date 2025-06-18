<template>
  <div
    class="flex w-full mb-6"
    :class="{
      'justify-end': isCurrentUser,
      'justify-start': !isCurrentUser,
    }"
  >
    <!-- Avatar for other user -->
    <div
      v-if="!isCurrentUser"
      class="flex-shrink-0 h-10 w-10 rounded-full mr-3 overflow-hidden shadow-sm"
    >
      <img
        v-if="otherUserAvatar"
        :src="otherUserAvatar"
        :alt="otherUserName"
        class="h-full w-full object-cover"
        @error="handleAvatarError"
      />
      <div
        v-else
        class="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white"
      >
        {{ userInitials }}
      </div>
    </div>

    <div
      class="max-w-[85%] rounded-2xl overflow-hidden shadow-lg border"
      :class="{
        'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 rounded-tr-none ml-auto':
          isCurrentUser,
        'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 rounded-tl-none mr-auto':
          !isCurrentUser,
      }"
    >
      <!-- Loading/Error state when proposal is null -->
      <div v-if="!proposal" class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 animate-spin"
            :class="{
              'text-blue-600 dark:text-blue-400': isCurrentUser,
              'text-emerald-600 dark:text-emerald-400': !isCurrentUser,
            }"
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
          <h4 class="font-semibold text-sm">Loading Budget Proposal...</h4>
        </div>
        <p class="text-sm opacity-75">
          Please wait while we load the proposal details.
        </p>
      </div>

      <!-- Header with job info and thumbnail -->
      <div
        v-else
        class="p-4 border-b"
        :class="{
          'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20':
            isCurrentUser,
          'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20':
            !isCurrentUser,
        }"
      >
        <div class="flex items-start gap-3">
          <!-- Job thumbnail -->
          <div
            class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm border"
            :class="{
              'border-blue-200 dark:border-blue-700': isCurrentUser,
              'border-emerald-200 dark:border-emerald-700': !isCurrentUser,
            }"
          >
            <img
              v-if="jobImage"
              :src="jobImage"
              :alt="jobTitle"
              class="w-full h-full object-cover"
              @error="handleJobImageError"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
              :class="{
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400':
                  isCurrentUser,
                'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400':
                  !isCurrentUser,
              }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v10a2 2 0 002 2h4a2 2 0 002-2V6"
                />
              </svg>
            </div>
          </div>

          <!-- Job info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                :class="{
                  'text-blue-600 dark:text-blue-400': isCurrentUser,
                  'text-emerald-600 dark:text-emerald-400': !isCurrentUser,
                }"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"
                />
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clip-rule="evenodd"
                />
              </svg>
              <h4 class="font-semibold text-sm">Budget Proposal</h4>
            </div>
            <p class="text-sm font-medium truncate" :title="jobTitle">
              {{ jobTitle }}
            </p>
            <p class="text-xs opacity-75 mt-1">
              Proposed by {{ proposerName }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div v-else class="p-4">
        <!-- Amount - prominently displayed -->
        <div class="mb-4">
          <div class="text-center">
            <p
              class="text-2xl font-bold mb-1"
              :class="{
                'text-blue-700 dark:text-blue-300': isCurrentUser,
                'text-emerald-700 dark:text-emerald-300': !isCurrentUser,
              }"
            >
              {{ formatAmount() }}
            </p>
            <p class="text-xs opacity-75">
              {{
                proposal?.proposal_type === 'range'
                  ? 'Price Range'
                  : 'Fixed Price'
              }}
            </p>
          </div>
        </div>

        <!-- Status -->
        <div class="mb-4 flex justify-center">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            :class="statusClasses"
          >
            <div
              class="w-2 h-2 rounded-full mr-2"
              :class="statusDotClasses"
            ></div>
            {{ statusText }}
          </span>
        </div>

        <!-- Notes -->
        <div v-if="proposal?.notes" class="mb-4">
          <div
            class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border"
            :class="{
              'border-blue-200 dark:border-blue-700': isCurrentUser,
              'border-emerald-200 dark:border-emerald-700': !isCurrentUser,
            }"
          >
            <p class="text-xs font-medium opacity-75 mb-1">Notes:</p>
            <p class="text-sm">{{ proposal.notes }}</p>
          </div>
        </div>

        <!-- Valid Until -->
        <div v-if="proposal?.valid_until" class="mb-4">
          <div class="flex items-center gap-2 text-xs opacity-75">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Valid until {{ formatValidUntil() }}</span>
          </div>
        </div>

        <!-- Actions for receiver of pending proposal -->
        <div
          v-if="showActions"
          class="flex gap-2 mt-4 pt-4 border-t"
          :class="{
            'border-blue-200 dark:border-blue-700': isCurrentUser,
            'border-emerald-200 dark:border-emerald-700': !isCurrentUser,
          }"
        >
          <Button
            size="sm"
            @click="handleAccept"
            :disabled="isProcessing"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            @click="handleDecline"
            :disabled="isProcessing"
            class="flex-1 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Decline
          </Button>
          <Button
            size="sm"
            variant="outline"
            @click="handleCounter"
            :disabled="isProcessing"
            class="flex-1"
            :class="{
              'border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20':
                isCurrentUser,
              'border-emerald-300 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20':
                !isCurrentUser,
            }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Counter
          </Button>
        </div>

        <!-- Timestamp -->
        <div
          class="flex items-center justify-between mt-4 pt-2 border-t border-opacity-30"
          :class="{
            'border-blue-200 dark:border-blue-700': isCurrentUser,
            'border-emerald-200 dark:border-emerald-700': !isCurrentUser,
          }"
        >
          <p class="text-xs opacity-60">
            {{ formattedTime }}
          </p>
        </div>
      </div>
    </div>

    <!-- Avatar for current user -->
    <div
      v-if="isCurrentUser"
      class="flex-shrink-0 h-10 w-10 rounded-full ml-3 overflow-hidden shadow-sm"
    >
      <img
        v-if="currentUserAvatar"
        :src="currentUserAvatar"
        alt="Me"
        class="h-full w-full object-cover"
        @error="$emit('avatar-error', 'current')"
      />
      <div
        v-else
        class="h-full w-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-semibold text-white"
      >
        {{ getInitials('Me') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { formatDisplayName } from '@/lib/nameFormatter';

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  proposal: {
    type: Object,
    required: false,
    default: null,
  },
  isCurrentUser: {
    type: Boolean,
    default: false,
  },
  currentUserAvatar: {
    type: String,
    default: null,
  },
  otherUserProfiles: {
    type: Object,
    default: () => ({}),
  },
  avatarCache: {
    type: Object,
    default: () => ({}),
  },
  currentUserId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['avatar-error', 'accept', 'decline', 'counter']);

const isProcessing = ref(false);

// Get the other user's name
const otherUserName = computed(() => {
  if (props.isCurrentUser) return 'Me';

  if (props.message.sender_name) {
    return formatDisplayName(props.message.sender_name);
  }

  const userId = props.message.sender_user_id;
  const profile = props.otherUserProfiles[userId];
  return formatDisplayName(profile?.full_name, profile?.email) || 'User';
});

// Get the other user's avatar
const otherUserAvatar = computed(() => {
  if (props.isCurrentUser) return null;

  const userId = props.message.sender_user_id;

  if (props.avatarCache[userId]) {
    return props.avatarCache[userId];
  }

  const profile = props.otherUserProfiles[userId];
  if (!profile) return null;

  if (profile.avatar_url) {
    return profile.avatar_url;
  }

  if (profile.user_type === 'contractor') {
    return '/images/contractor-default.svg';
  } else if (profile.user_type === 'client') {
    return '/images/client-default.svg';
  }

  return null;
});

// Get initials for avatar fallback
const userInitials = computed(() => {
  return getInitials(otherUserName.value);
});

// Get job title with better fallback logic
const jobTitle = computed(() => {
  if (!props.proposal) return 'Unknown Job';

  // Try to get job title from the job_postings relationship
  if (props.proposal.job_postings) {
    if (props.proposal.job_postings.description) {
      return props.proposal.job_postings.description;
    }
    if (props.proposal.job_postings.category_name) {
      return props.proposal.job_postings.category_name;
    }
  }

  // Fallback to job ID if available
  if (props.proposal.job_id) {
    return `Job #${props.proposal.job_id}`;
  }

  return 'Unknown Job';
});

// Get job image with fallback
const jobImage = computed(() => {
  if (!props.proposal?.job_postings) return null;

  // Try to get category-based image
  const category = props.proposal.job_postings.category_name;
  if (category) {
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    return `/images/services/${categorySlug}.jpg`;
  }

  return null;
});

// Get proposer name with better logic
const proposerName = computed(() => {
  if (!props.proposal) return 'Unknown';

  // Check if current user is the proposer
  if (props.proposal.proposer_id === props.currentUserId) {
    return 'You';
  }

  // Try to get name from message sender
  if (props.message.sender_name) {
    return props.message.sender_name;
  }

  // Try to get name from user profiles
  const proposerId = props.proposal.proposer_id;
  const profile = props.otherUserProfiles[proposerId];
  if (profile?.full_name) {
    return formatDisplayName(profile.full_name, profile.email);
  }

  return 'User';
});

// Get declined by name with proper logic
const getDeclinedByName = () => {
  if (!props.proposal?.declined_by) return 'Unknown';

  // Try to get name from user profiles
  const declinedById = props.proposal.declined_by;
  const profile = props.otherUserProfiles[declinedById];
  if (profile?.full_name) {
    return formatDisplayName(profile.full_name, profile.email);
  }

  // If declined by is the message sender, use sender name
  if (props.message.sender_id === declinedById && props.message.sender_name) {
    return props.message.sender_name;
  }

  return 'User';
};

// Format amount display with better error handling
const formatAmount = () => {
  const { proposal } = props;
  if (!proposal || (!proposal.amount_min && !proposal.amount_max)) {
    return 'Amount not specified';
  }

  const currency = proposal.currency || 'USD';
  const symbol = getCurrencySymbol(currency);

  if (proposal.proposal_type === 'range' && proposal.amount_max) {
    return `${symbol}${formatNumber(proposal.amount_min)} - ${symbol}${formatNumber(proposal.amount_max)}`;
  } else {
    return `${symbol}${formatNumber(proposal.amount_min || proposal.amount_max)}`;
  }
};

// Format numbers with proper comma separation
const formatNumber = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString();
};

// Get currency symbol
const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    PEN: 'S/',
    GBP: '£',
  };
  return symbols[currency] || currency;
};

// Format valid until date
const formatValidUntil = () => {
  if (!props.proposal?.valid_until) return '';
  const date = new Date(props.proposal.valid_until);
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

// Status display with better logic
const statusText = computed(() => {
  const status = props.proposal?.status;
  switch (status) {
    case 'pending':
      return 'Awaiting Response';
    case 'accepted':
      const acceptedBy =
        props.proposal.accepted_by === props.currentUserId
          ? 'You'
          : proposerName.value;
      return `Accepted by ${acceptedBy}`;
    case 'declined':
      const declinedBy =
        props.proposal.declined_by === props.currentUserId
          ? 'You'
          : getDeclinedByName();
      return `Declined by ${declinedBy}`;
    default:
      return 'Unknown Status';
  }
});

const statusClasses = computed(() => {
  const status = props.proposal?.status;
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'accepted':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'declined':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
});

const statusDotClasses = computed(() => {
  const status = props.proposal?.status;
  switch (status) {
    case 'pending':
      return 'bg-amber-500';
    case 'accepted':
      return 'bg-green-500';
    case 'declined':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
});

// Show actions if proposal is pending and current user is not the proposer
const showActions = computed(() => {
  return (
    props.proposal?.status === 'pending' &&
    props.proposal?.proposer_id !== props.currentUserId
  );
});

// Format the message timestamp
const formattedTime = computed(() => {
  if (!props.message.created_at) return '';
  const date = new Date(props.message.created_at);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Get initials from a name
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Handle avatar loading errors
function handleAvatarError() {
  emit('avatar-error', props.message.sender_user_id);
}

// Handle job image loading errors
function handleJobImageError() {
  // Image failed to load, fallback will be used
}

// Action handlers
async function handleAccept() {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    emit('accept', props.proposal.id);
  } finally {
    isProcessing.value = false;
  }
}

async function handleDecline() {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    emit('decline', props.proposal.id);
  } finally {
    isProcessing.value = false;
  }
}

async function handleCounter() {
  if (isProcessing.value) return;
  emit('counter', props.proposal);
}
</script>

<style scoped>
.message-bubble {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for notes if they get long */
.notes-content {
  max-height: 100px;
  overflow-y: auto;
}

.notes-content::-webkit-scrollbar {
  width: 4px;
}

.notes-content::-webkit-scrollbar-track {
  background: transparent;
}

.notes-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
</style>
