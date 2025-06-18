<template>
  <div class="w-full h-full flex flex-col bg-white dark:bg-gray-900">
    <div
      class="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    >
      <Button variant="ghost" class="mr-2" @click="goBack">
        <span class="text-lg">←</span>
      </Button>
      <h1 class="text-2xl font-normal text-foreground">
        {{ otherUserName }}
      </h1>
    </div>

    <div class="flex-1 h-[calc(100vh-80px)] overflow-hidden">
      <ChatInterface :key="roomId" :room-id="roomId" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/chat/ChatInterface.vue';
import { useChatStore } from '@/stores/chat';
import { formatDisplayName } from '@/lib/nameFormatter';

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();

// Get roomId from route params
const roomId = computed(() => route.params.roomId);

// Get other user's name
const otherUserName = ref('Chat User'); // Slightly more generic default

// Watch for changes in the room ID
watch(roomId, fetchRoomDetails, { immediate: true });

// Fetch room details when component mounts
onMounted(() => {
  fetchRoomDetails();
});

// Fetch room details
async function fetchRoomDetails() {
  if (!roomId.value) {
    router.push({ name: 'Messages' });
    return;
  }

  // First, fetch messages to ensure the room exists and we have access
  await chatStore.fetchMessages(roomId.value);

  // Mark messages as read when opening the conversation
  try {
    await chatStore.markMessagesAsRead(roomId.value);
  } catch (error) {
    console.error('ConversationView: Failed to mark messages as read:', error);
  }

  // Find the room in the chat rooms list
  const room = chatStore.chatRooms.find((r) => r.id === roomId.value);

  if (room) {
    // Determine the other user ID based on current user
    const currentUserId = chatStore.currentUserId;
    const otherUserId =
      currentUserId === room.client_id ? room.contractor_id : room.client_id;

    // Get the other user's profile
    const profile = chatStore.otherUserProfiles[otherUserId];

    if (profile && profile.full_name && profile.full_name !== 'Unknown User') {
      otherUserName.value = formatDisplayName(profile.full_name, profile.email);
    } else if (otherUserId) {
      // Improved fallback: show partial user ID when full name is unavailable
      const partialId = otherUserId.substring(0, 8);
      otherUserName.value = `User ${partialId}`;

      // Try to fetch the profile

      // Verify that fetchOtherUserProfiles method exists before calling it
      if (typeof chatStore.fetchOtherUserProfiles === 'function') {
        await chatStore.fetchOtherUserProfiles([otherUserId]);
      } else {
        console.error(
          'ConversationView: fetchOtherUserProfiles method not found on chatStore'
        );
      }

      // Check if we got the profile after fetching
      const updatedProfile = chatStore.otherUserProfiles[otherUserId];
      console.log(
        'ConversationView: Updated profile after fetch:',
        updatedProfile
      );

      if (updatedProfile && updatedProfile.full_name) {
        otherUserName.value = formatDisplayName(
          updatedProfile.full_name,
          updatedProfile.email
        );
      }

      if (
        updatedProfile &&
        updatedProfile.full_name &&
        updatedProfile.full_name !== 'Unknown User'
      ) {
        otherUserName.value = formatDisplayName(
          updatedProfile.full_name,
          updatedProfile.email
        );
        console.log(
          'ConversationView: Using fetched full name:',
          otherUserName.value
        );
      } else if (updatedProfile && updatedProfile.user_id) {
        const partialId = updatedProfile.user_id.substring(0, 8);
        otherUserName.value = `User ${partialId}`;
        console.log(
          'ConversationView: Using fetched partial user ID:',
          partialId
        );
      } else if (otherUserId) {
        // Final fallback: use partial otherUserId when profile fetch fails
        const partialId = otherUserId.substring(0, 8);
        otherUserName.value = `User ${partialId}`;
        console.log('ConversationView: Using otherUserId fallback:', partialId);
      }
    }
  } else {
    // If we don't have the room in our list, fetch all rooms
    await chatStore.fetchChatRooms();

    // Try to find the room again
    const updatedRoom = chatStore.chatRooms.find((r) => r.id === roomId.value);
    if (updatedRoom) {
      const profile = chatStore.otherUserProfiles[updatedRoom.otherUserId];
      console.log('ConversationView: Updated room profile:', profile);

      if (
        profile &&
        profile.full_name &&
        profile.full_name !== 'Unknown User'
      ) {
        otherUserName.value = formatDisplayName(
          profile.full_name,
          profile.email
        );
        console.log(
          'ConversationView: Using updated room full name:',
          otherUserName.value
        );
      } else if (profile && profile.user_id) {
        const partialId = profile.user_id.substring(0, 8);
        otherUserName.value = `User ${partialId}`;
        console.log(
          'ConversationView: Using updated room partial user ID:',
          partialId
        );
      } else if (updatedRoom.otherUserId) {
        // Improved fallback: display partial user ID when full name is unavailable
        const partialId = updatedRoom.otherUserId.substring(0, 8);
        otherUserName.value = `User ${partialId}`;
        console.log(
          'ConversationView: Using updated room otherUserId fallback:',
          partialId
        );
      }
    }
  }
}

// Go back to messages list
function goBack() {
  router.push({ name: 'Messages' });
}
</script>
