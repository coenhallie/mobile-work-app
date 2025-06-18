<template>
  <router-link
    :to="{ name: 'Conversation', params: { roomId: room.id } }"
    class="block"
  >
    <Card class="hover:bg-muted/50 transition-colors">
      <CardHeader class="flex flex-row items-center space-x-3 px-4 py-2">
        <!-- Avatar with image or fallback to initials -->
        <div
          class="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden relative"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="userName"
            class="h-full w-full object-cover"
            @error="handleAvatarError"
          />
          <div
            v-else
            class="h-full w-full bg-muted flex items-center justify-center"
          >
            <span class="text-sm font-medium">{{ userInitials }}</span>
          </div>
        </div>

        <div class="flex-grow min-w-0">
          <CardTitle
            class="text-sm truncate leading-tight"
            :class="{ 'font-bold': hasUnreadMessages }"
          >
            {{ userName }}
          </CardTitle>
          <CardDescription
            v-if="room.latestMessage"
            class="text-xs truncate leading-tight mt-0.5"
            :class="{ 'font-semibold text-foreground': hasUnreadMessages }"
          >
            {{ truncatedMessage }}
          </CardDescription>
        </div>

        <div class="flex flex-col items-end space-y-1 flex-shrink-0">
          <div
            v-if="room.latestMessage"
            class="text-xs text-muted-foreground whitespace-nowrap"
          >
            {{ formattedDate }}
          </div>

          <!-- Additional unread indicator in the corner -->
          <div
            v-if="hasUnreadMessages"
            class="min-w-[14px] h-[14px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </div>
        </div>
      </CardHeader>
    </Card>
  </router-link>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useChatStore } from '@/stores/chat';
import {
  formatDisplayName,
  getInitialsFromDisplayName,
} from '@/lib/nameFormatter';

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  profiles: {
    type: Object,
    default: () => ({}),
  },
});

const chatStore = useChatStore();

const emit = defineEmits(['avatar-error']);

// Local avatar cache to prevent unnecessary re-renders
const avatarCache = ref({});

// Computed properties for efficient rendering
const userName = computed(() => {
  // First try to use the name directly from the room
  if (props.room.otherUserName) {
    return props.room.otherUserName;
  }

  // Try room.other_user_name (alternative naming)
  if (props.room.other_user_name) {
    return props.room.other_user_name;
  }

  // Determine the other user ID from the room structure
  let otherUserId = props.room.otherUserId;
  if (!otherUserId && chatStore.currentUserId) {
    // If otherUserId is not set, determine it from client_id/contractor_id
    if (props.room.client_id === chatStore.currentUserId) {
      otherUserId = props.room.contractor_id;
    } else if (props.room.contractor_id === chatStore.currentUserId) {
      otherUserId = props.room.client_id;
    }
  }

  // Try to get from chat store profiles first (most reliable source)
  if (otherUserId) {
    const storeProfile = chatStore.otherUserProfiles?.[otherUserId];
    if (storeProfile?.full_name) {
      return formatDisplayName(storeProfile.full_name, storeProfile.email);
    }
  }

  // Try room.participants for user names
  if (props.room.participants && Array.isArray(props.room.participants)) {
    const otherParticipant = props.room.participants.find(
      (p) => p.user_id !== chatStore.currentUserId
    );
    if (otherParticipant?.full_name) {
      return formatDisplayName(
        otherParticipant.full_name,
        otherParticipant.email
      );
    }
    if (otherParticipant?.name) {
      return formatDisplayName(otherParticipant.name);
    }
  }

  // Fall back to props profiles if needed
  if (otherUserId) {
    const profile = props.profiles[otherUserId];
    if (profile?.full_name) {
      return formatDisplayName(profile.full_name, profile.email);
    }
    if (profile?.name) {
      return formatDisplayName(profile.name);
    }
  }

  // Try the original otherUserId if different
  if (props.room.otherUserId && props.room.otherUserId !== otherUserId) {
    const profile = props.profiles[props.room.otherUserId];
    if (profile?.full_name) {
      return formatDisplayName(profile.full_name, profile.email);
    }
    if (profile?.name) {
      return formatDisplayName(profile.name);
    }
  }

  // Last resort: check if room has any user info
  if (props.room.user_name) {
    return props.room.user_name;
  }

  return 'Unknown User';
});

const userInitials = computed(() => {
  return getInitialsFromDisplayName(userName.value);
});

const avatarUrl = computed(() => {
  // Determine the other user ID from the room structure
  let otherUserId = props.room.otherUserId;
  if (!otherUserId && chatStore.currentUserId) {
    // If otherUserId is not set, determine it from client_id/contractor_id
    if (props.room.client_id === chatStore.currentUserId) {
      otherUserId = props.room.contractor_id;
    } else if (props.room.contractor_id === chatStore.currentUserId) {
      otherUserId = props.room.client_id;
    }
  }

  if (!otherUserId) return null;

  // Check local cache first
  if (avatarCache.value[otherUserId]) {
    return avatarCache.value[otherUserId];
  }

  // Check chat store profiles first (most reliable source)
  const storeProfile = chatStore.otherUserProfiles?.[otherUserId];
  if (storeProfile?.profile_picture_url) {
    avatarCache.value[otherUserId] = storeProfile.profile_picture_url;
    return storeProfile.profile_picture_url;
  }

  // Check props profiles as fallback
  const profile = props.profiles[otherUserId];
  if (!profile) return null;

  // Use profile_picture_url from profile (correct field name from database)
  let url = null;

  if (profile.profile_picture_url) {
    url = profile.profile_picture_url;
  } else if (profile.avatar_url) {
    // Fallback for legacy field name
    url = profile.avatar_url;
  } else {
    // Use default avatars based on user role
    // Check if this user is a contractor by looking in contractor_profiles
    if (props.room.contractor_id === otherUserId) {
      url = '/images/contractor-default.svg';
    } else if (props.room.client_id === otherUserId) {
      url = '/images/client-default.svg';
    }
  }

  // Cache the result
  if (url) {
    avatarCache.value[otherUserId] = url;
  }

  return url;
});

const truncatedMessage = computed(() => {
  const content = props.room.latestMessage?.content;
  if (!content) return '';
  return content.length > 30 ? content.substring(0, 30) + '...' : content;
});

const formattedDate = computed(() => {
  const timestamp = props.room.latestMessage?.created_at;
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Yesterday
  else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  // This week
  else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  // Older
  else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
});

// Unread message tracking
const unreadCount = computed(() => {
  if (!props.room?.id) return 0;
  return chatStore.unreadCounts[props.room.id] || 0;
});

const hasUnreadMessages = computed(() => {
  return unreadCount.value > 0;
});

// Handle avatar loading errors
function handleAvatarError() {
  // Determine the other user ID from the room structure
  let otherUserId = props.room.otherUserId;
  if (!otherUserId && chatStore.currentUserId) {
    // If otherUserId is not set, determine it from client_id/contractor_id
    if (props.room.client_id === chatStore.currentUserId) {
      otherUserId = props.room.contractor_id;
    } else if (props.room.contractor_id === chatStore.currentUserId) {
      otherUserId = props.room.client_id;
    }
  }

  // Remove from cache
  if (otherUserId && avatarCache.value[otherUserId]) {
    delete avatarCache.value[otherUserId];
  }

  // Emit event to parent
  emit('avatar-error', otherUserId);
}
</script>

<style scoped>
/* Add any specific styles for conversation items */
</style>
