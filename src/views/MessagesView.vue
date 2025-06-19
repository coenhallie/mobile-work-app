<template>
  <div
    class="w-full max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        {{ $t('messages.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        {{ $t('messages.conversationsDescription') }}
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center text-destructive p-4">
      <p>{{ error }}</p>
      <Button variant="outline" class="mt-2" @click="loadConversations"
        >Try Again</Button
      >
    </div>

    <!-- Empty state -->
    <div
      v-else-if="chatRooms.length === 0"
      class="text-center text-gray-600 dark:text-gray-400 p-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
    >
      <p class="mb-4">You don't have any conversations yet.</p>
      <!-- Show different buttons based on user role -->
      <router-link
        v-if="auth.userRole.value === 'client'"
        to="/find-contractor"
      >
        <Button>Find a Contractor</Button>
      </router-link>
      <router-link v-else-if="auth.userRole.value === 'contractor'" to="/">
        <Button>Browse Available Jobs</Button>
      </router-link>
    </div>

    <!-- Conversations list with virtualization -->
    <div v-else>
      <!-- Load more button (for pagination) -->
      <div v-if="hasMoreConversations" class="text-center mb-4">
        <Button
          variant="outline"
          size="sm"
          @click="loadMoreConversations"
          :disabled="isLoadingMore"
        >
          {{ isLoadingMore ? 'Loading...' : 'Load More Conversations' }}
        </Button>
      </div>

      <!-- Virtualized list for better performance -->
      <div class="space-y-4 conversation-list">
        <ConversationItem
          v-for="room in chatRooms"
          :key="room.id"
          :room="room"
          :profiles="otherUserProfiles"
          @avatar-error="handleAvatarError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  onMounted,
  computed,
  shallowRef,
  defineAsyncComponent,
  ref,
  watch,
} from 'vue';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chat';
import { useAuth } from '@/composables/useAuth';
import { useRoute } from 'vue-router';

// Lazy-load the ConversationItem component for better initial load performance
const ConversationItem = defineAsyncComponent(
  () => import('@/components/chat/ConversationItem.vue')
);

const chatStore = useChatStore();
const auth = useAuth();

// Use computed properties for reactive store data
const chatRooms = computed(() => chatStore.chatRooms);
const otherUserProfiles = computed(() => chatStore.otherUserProfiles);
const isLoading = computed(() => chatStore.isLoading);
const error = computed(() => chatStore.error);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);
const hasMoreConversations = ref(false);
const isLoadingMore = ref(false);

// Fetch chat rooms when component mounts
onMounted(async () => {
  await loadConversations();
});

const route = useRoute();

watch(
  () => route.path,
  async (newPath) => {
    if (newPath === '/messages') {
      await chatStore.fetchChatRooms(true); // Force refresh
    }
  }
);

// Load initial conversations
async function loadConversations() {
  try {
    console.log('[MessagesView] DIAGNOSTIC - loadConversations called');

    // Wait for auth to be ready before fetching data
    const authReady = await auth.waitForAuth(5000);
    console.log('[MessagesView] DIAGNOSTIC - Auth ready:', {
      authReady,
      isSignedIn: auth.isSignedIn.value,
      userId: auth.userId.value,
      userEmail: auth.userEmail.value,
      userRole: auth.userRole.value,
    });

    if (!authReady) {
      console.log(
        '[MessagesView] DIAGNOSTIC - Auth not ready, returning early'
      );
      return;
    }

    currentPage.value = 1;
    console.log(
      '[MessagesView] DIAGNOSTIC - About to call chatStore.fetchChatRooms()'
    );
    await chatStore.fetchChatRooms();

    console.log(
      '[MessagesView] DIAGNOSTIC - fetchChatRooms completed, rooms count:',
      chatRooms.value.length
    );

    // In a real implementation, we would check if there are more conversations
    // For now, we'll simulate this based on the number of rooms
    hasMoreConversations.value = chatRooms.value.length >= pageSize.value;
  } catch (error) {
    console.error(
      '[MessagesView] DIAGNOSTIC - Error loading conversations:',
      error
    );
  }
}

// Load more conversations (pagination)
async function loadMoreConversations() {
  if (isLoadingMore.value) return;

  isLoadingMore.value = true;
  currentPage.value++;

  try {
    // In a real implementation, we would fetch the next page of conversations
    // For now, we'll simulate this by setting hasMoreConversations to false
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
    hasMoreConversations.value = false;
  } finally {
    isLoadingMore.value = false;
  }
}

// Handle avatar loading errors
function handleAvatarError(userId) {
  // This is now handled in the ConversationItem component
  // We just need to provide the method for the event
}
</script>

<style scoped>
/* Add any specific styles for the conversations view */
.conversation-list {
  /* Add styles for better scrolling performance */
  will-change: transform;
  contain: content;
}
</style>
