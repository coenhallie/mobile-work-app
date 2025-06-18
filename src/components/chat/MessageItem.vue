<template>
  <div
    class="flex w-full mb-4"
    :class="{
      'justify-end': isCurrentUser,
      'justify-start': !isCurrentUser,
    }"
  >
    <!-- Avatar for other user (only shown for messages not from current user) -->
    <div
      v-if="!isCurrentUser"
      class="flex-shrink-0 h-8 w-8 rounded-full mr-2 overflow-hidden"
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
        class="h-full w-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground"
      >
        {{ userInitials }}
      </div>
    </div>

    <div
      class="max-w-[75%] rounded-2xl px-4 py-2 break-words shadow-sm message-bubble"
      :class="{
        'bg-blue-500 text-white rounded-tr-none ml-auto': isCurrentUser,
        'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none mr-auto':
          !isCurrentUser,
      }"
    >
      <!-- Job context indicator -->
      <div
        v-if="message.job_context"
        class="mb-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3 w-3 inline mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        {{ message.job_context }}
      </div>

      <!-- Text message content -->
      <p v-if="message.message_type === 'text' || !message.message_type">
        {{ message.content }}
      </p>

      <!-- Image message content -->
      <div v-else-if="message.message_type === 'image'" class="image-message">
        <img
          :src="message.image_url"
          :alt="message.image_filename || 'Shared image'"
          class="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          @click="openImageModal"
          @error="handleImageError"
        />
      </div>

      <p class="text-xs mt-1 opacity-70">
        {{ formattedTime }}
      </p>
    </div>

    <!-- Image Modal -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="closeImageModal"
    >
      <div class="relative max-w-4xl max-h-4xl p-4">
        <img
          :src="message.image_url"
          :alt="message.image_filename || 'Shared image'"
          class="max-w-full max-h-full object-contain rounded-lg"
        />
        <button
          @click="closeImageModal"
          class="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Avatar for current user (only shown for messages from current user) -->
    <div
      v-if="isCurrentUser"
      class="flex-shrink-0 h-8 w-8 rounded-full ml-2 overflow-hidden"
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
        class="h-full w-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground"
      >
        {{ getInitials('Me') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatDisplayName } from '@/lib/nameFormatter';

const props = defineProps({
  message: {
    type: Object,
    required: true,
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
});

const emit = defineEmits(['avatar-error']);

// Image modal state
const showImageModal = ref(false);

// Get the other user's name
const otherUserName = computed(() => {
  if (props.isCurrentUser) return 'Me';

  // First try to get name directly from the message
  if (props.message.sender_name) {
    return formatDisplayName(props.message.sender_name);
  }

  // Fall back to profiles if needed
  const userId = props.message.sender_user_id;
  const profile = props.otherUserProfiles[userId];

  return formatDisplayName(profile?.full_name, profile?.email) || 'User';
});

// Get the other user's avatar
const otherUserAvatar = computed(() => {
  if (props.isCurrentUser) return null;

  const userId = props.message.sender_user_id;

  // Check cache first
  if (props.avatarCache[userId]) {
    return props.avatarCache[userId];
  }

  // Check profiles
  const profile = props.otherUserProfiles[userId];
  if (!profile) return null;

  if (profile.avatar_url) {
    return profile.avatar_url;
  }

  // Default avatars based on user type
  if (profile.user_type === 'contractor') {
    return '/images/contractor-default.png';
  } else if (profile.user_type === 'client') {
    return '/images/client-default.png';
  }

  return null;
});

// Get initials for avatar fallback
const userInitials = computed(() => {
  return getInitials(otherUserName.value);
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

// Image modal functions
function openImageModal() {
  if (props.message.message_type === 'image' && props.message.image_url) {
    showImageModal.value = true;
  }
}

function closeImageModal() {
  showImageModal.value = false;
}

// Handle image loading errors
function handleImageError(event) {
  console.error('Failed to load image:', props.message.image_url);
  // You could show a placeholder or error message here
  event.target.style.display = 'none';
}
</script>

<style scoped>
.message-bubble {
  animation: fadeIn 0.3s ease-out;
}

.image-message img {
  display: block;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-message img:hover {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

/* Image modal styles */
.fixed {
  backdrop-filter: blur(4px);
}

.fixed img {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
</style>
