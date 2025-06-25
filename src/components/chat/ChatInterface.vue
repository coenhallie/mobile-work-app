<template>
  <div class="chat-interface">
    <!-- Connection Status Indicator -->
    <div
      v-if="!connectionHealthy"
      class="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 text-sm"
      :class="{
        'bg-red-500': realtimeConnectionStatus === 'error',
        'bg-yellow-500':
          realtimeConnectionStatus === 'connecting' || isReconnecting,
        'bg-orange-500': !realtimeIsAuthenticated,
      }"
    >
      <div
        v-if="realtimeConnectionStatus === 'connecting' || isReconnecting"
        class="flex items-center justify-center gap-2"
      >
        <div
          class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <span>{{
          isReconnecting
            ? t('messages.reconnecting')
            : t('messages.connectingToRealTimeChat')
        }}</span>
      </div>
      <div
        v-else-if="realtimeConnectionStatus === 'error'"
        class="flex items-center justify-center gap-2"
      >
        <span
          >⚠️
          {{
            t('messages.connectionError', {
              error: realtimeLastError || t('messages.unknownError'),
            })
          }}</span
        >
        <Button
          variant="ghost"
          size="sm"
          class="text-white hover:text-red-100 ml-2"
          @click="handleReconnect"
        >
          {{ t('messages.retry') }}
        </Button>
      </div>
      <div v-else-if="!realtimeIsAuthenticated">
        🔐 {{ t('messages.authenticationRequired') }}
      </div>
      <div v-else>📡 {{ t('messages.realTimeConnectionUnavailable') }}</div>
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
      <Button variant="outline" class="mt-2" @click="loadMessages">{{
        t('messages.tryAgain')
      }}</Button>
    </div>

    <!-- Chat content -->
    <div v-else class="flex flex-col h-full relative">
      <!-- Messages area with proper flex layout -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        style="padding-bottom: 180px"
      >
        <!-- Load more button -->
        <div v-if="hasMoreMessages" class="text-center mb-4">
          <Button
            variant="outline"
            size="sm"
            @click="loadMoreMessages"
            :disabled="isLoadingMore"
          >
            {{
              isLoadingMore
                ? t('messages.loading')
                : t('messages.loadEarlierMessages')
            }}
          </Button>
        </div>

        <div
          v-if="messages.length === 0"
          class="text-center text-muted-foreground py-8"
        >
          <p>
            {{ t('messages.noMessages') }} {{ t('messages.startConversation') }}
          </p>
        </div>

        <!-- Message list with optimized rendering -->
        <template v-for="message in messages" :key="message.id">
          <!-- Budget Proposal Message -->
          <BudgetProposalMessageItem
            v-if="message.message_type === 'budget_proposal'"
            :message="message"
            :proposal="getBudgetProposal(message.budget_data?.proposal_id)"
            :is-current-user="message.sender_user_id === currentUserId"
            :current-user-avatar="currentUserAvatar"
            :other-user-profiles="otherUserProfiles"
            :avatar-cache="avatarCache"
            :current-user-id="currentUserId"
            @avatar-error="handleAvatarError"
            @accept="handleAcceptProposal"
            @decline="handleDeclineProposal"
            @counter="handleCounterProposal"
          />
          <!-- Regular Message -->
          <MessageItem
            v-else
            :message="message"
            :is-current-user="message.sender_user_id === currentUserId"
            :current-user-avatar="currentUserAvatar"
            :other-user-profiles="otherUserProfiles"
            :avatar-cache="avatarCache"
            @avatar-error="handleAvatarError"
          />
        </template>

        <!-- Extra spacing at bottom for better scroll behavior -->
        <div class="h-4"></div>
      </div>
    </div>

    <!-- Message input area - fixed at bottom of chat interface -->
    <div
      class="fixed bottom-14 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 z-50"
    >
      <!-- Job context selector (if multiple jobs available) -->
      <div
        v-if="selectedJobForMessage"
        class="mb-2 p-2 bg-muted rounded-lg text-sm"
      >
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground"
            >Discussing: {{ selectedJobForMessage.title }}</span
          >
          <Button
            variant="ghost"
            size="sm"
            @click="clearJobContext"
            class="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>

      <form
        @submit.prevent="sendMessage"
        class="flex gap-2 items-end max-w-full mx-auto container"
      >
        <Textarea
          v-model="newMessage"
          :placeholder="
            selectedJobForMessage
              ? t('messages.messageAboutJob', {
                  jobTitle: selectedJobForMessage.title,
                })
              : t('messages.typeMessage')
          "
          class="flex-1 resize-none rounded-2xl border-border bg-input text-foreground focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
          :rows="1"
          @keydown="handleKeyDown"
          @input="autoResizeTextarea"
          ref="messageInput"
        />

        <!-- Job context button -->
        <Button
          type="button"
          @click="handleJobContextSelection"
          class="rounded-full h-10 w-10 flex items-center justify-center p-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          :class="{
            'bg-primary text-primary-foreground': selectedJobForMessage,
          }"
          title="Add job context"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </Button>

        <!-- Budget discussion button -->
        <Button
          type="button"
          @click="handleBudgetDiscussion"
          class="rounded-full h-10 w-10 flex items-center justify-center p-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          title="Discuss Budget"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
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
        </Button>

        <!-- Image upload button -->
        <Button
          type="button"
          @click="triggerImageUpload"
          :disabled="isUploadingImage"
          class="rounded-full h-10 w-10 flex items-center justify-center p-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          title="Upload image"
        >
          <svg
            v-if="!isUploadingImage"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clip-rule="evenodd"
            />
          </svg>
          <div
            v-else
            class="h-5 w-5 border-t-2 border-b-2 border-current rounded-full animate-spin"
          ></div>
        </Button>

        <!-- Hidden file input -->
        <input
          ref="imageInput"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="hidden"
        />

        <Button
          type="submit"
          :disabled="!newMessage.trim() || isSending"
          class="rounded-full h-10 w-10 flex items-center justify-center p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <svg
            v-if="!isSending"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
            />
          </svg>
          <div
            v-else
            class="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"
          ></div>
        </Button>
      </form>
    </div>

    <!-- Job Selector Modal -->
    <JobSelectorModal
      v-model:open="showJobSelector"
      :other-user-id="otherUserId"
      :fetch-shared-jobs="chatStore.fetchSharedJobs"
      @job-selected="handleJobSelected"
    />

    <!-- Budget Composer Modal -->
    <BudgetComposerModal
      v-model:open="showBudgetComposer"
      :job-id="selectedJob?.id || ''"
      :job-title="selectedJob?.title || ''"
      :job-data="selectedJob"
      :counter-proposal="counterProposal"
      @submit="handleBudgetProposalSubmit"
    />

    <!-- Diagnostic Panel (disabled to prevent infinite reactive loops) -->
    <!-- <ChatDiagnosticPanel v-if="isDevelopment" /> -->
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  computed,
  shallowRef,
  defineAsyncComponent,
} from 'vue';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/stores/chat';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from 'vue-i18n';
import BudgetComposerModal from './BudgetComposerModal.vue';
import JobSelectorModal from './JobSelectorModal.vue';
import BudgetProposalMessageItem from './BudgetProposalMessageItem.vue';
// import ChatDiagnosticPanel from './ChatDiagnosticPanel.vue'; // Disabled to prevent infinite reactive loops
// import { chatDiagnostics } from '@/lib/chatDiagnosticCommands'; // Disabled to prevent infinite reactive loops
import realtimeConnectionManager, {
  connectionStatus as globalConnectionStatus,
  isAuthenticated as globalIsAuthenticated,
  lastError as globalLastError,
} from '@/lib/realtimeConnectionManager';
import { getReactivityDiagnostics } from '@/lib/chatReactivityFix';

const { t } = useI18n();

// Lazy-load the MessageItem component for better initial load performance
const MessageItem = defineAsyncComponent(() => import('./MessageItem.vue'));

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
});

const chatStore = useChatStore();
const { userId, getSupabaseClient, user } = useAuth();

// State management
const currentUserId = computed(() => userId.value);
const newMessage = ref('');
const messagesContainer = ref(null);
const messageInput = ref(null);
const imageInput = ref(null);
const isMounted = ref(false);
const hasMoreMessages = ref(false);
const currentPage = ref(1);
const isLoadingMore = ref(false);
const isSending = ref(false);
const isUploadingImage = ref(false);
const showJobSelector = ref(false);
const showBudgetComposer = ref(false);
const selectedJob = ref(null);
const selectedJobForMessage = ref(null);
const jobSelectorMode = ref('message'); // 'message' or 'budget'
const counterProposal = ref(null);
let messageChannel = null;
let subscriptionCleanupPromise = null;

// Connection status monitoring
const connectionStatus = ref('disconnected');
const connectionError = ref(null);
const isReconnecting = ref(false);

// Component instance ID for tracking rerenders
const componentInstanceId = ref(
  `ChatInterface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
);

// Log component creation - disabled to prevent infinite reactive loops
// // chatDiagnostics logging disabled to prevent infinite reactive loops

// Use shallowRef for better performance with objects
const currentUserAvatar = shallowRef(null);
const avatarCache = shallowRef({});

// Computed properties from store with shallow reactivity
const messages = computed(() => {
  const msgs = chatStore.currentRoomMessages || [];
  // Diagnostic logging removed to prevent infinite reactive loops
  return msgs;
});
const isLoading = computed(() => chatStore.isLoading);
const error = computed(() => chatStore.error);
const otherUserProfiles = computed(() => chatStore.otherUserProfiles);
const budgetProposals = computed(() => chatStore.currentRoomBudgetProposals);

// Connection status monitoring
const realtimeConnectionStatus = computed(() => globalConnectionStatus.value);
const realtimeIsAuthenticated = computed(() => globalIsAuthenticated.value);
const realtimeLastError = computed(() => globalLastError.value);
const connectionHealthy = computed(
  () =>
    realtimeConnectionStatus.value === 'connected' &&
    realtimeIsAuthenticated.value
);

// Development flag for diagnostic panel
const isDevelopment = computed(
  () => import.meta.env.DEV || window.location.hostname === 'localhost'
);

// Get the other user ID from the current room
const otherUserId = computed(() => {
  const room = chatStore.currentRoom;
  if (!room || !currentUserId.value) return null;

  // Return the user ID that's not the current user
  if (room.client_id === currentUserId.value) {
    return room.contractor_id;
  } else {
    return room.client_id;
  }
});

// Fetch messages when component mounts or roomId changes
watch(
  () => props.roomId,
  async (newRoomId, oldRoomId) => {
    // chatDiagnostics logging disabled to prevent infinite reactive loops

    // Clean up subscription for old room if switching rooms
    if (oldRoomId && oldRoomId !== newRoomId && messageChannel) {
      console.log(
        '[ChatInterface] DIAGNOSTIC - Cleaning up subscription for old room:',
        oldRoomId
      );
      try {
        await chatStore.cleanupSubscription(oldRoomId);
        messageChannel = null;
      } catch (error) {
        console.warn(
          '[ChatInterface] DIAGNOSTIC - Failed to cleanup subscription for old room:',
          error
        );
      }
    }

    // Load messages for new room
    await loadMessages();

    // Set up subscription for new room
    if (newRoomId && isMounted.value) {
      try {
        messageChannel = await chatStore.subscribeToMessages(newRoomId);
        console.log(
          '[ChatInterface] DIAGNOSTIC - Subscription established for new room:',
          newRoomId
        );
      } catch (error) {
        console.error(
          '[ChatInterface] DIAGNOSTIC - Failed to establish subscription for new room:',
          error
        );
      }
    }
  },
  { immediate: true }
);

// Simple and reliable scroll handling using scroll anchor
let scrollTimeout = null;

// Enhanced scroll to bottom function
function scrollToBottom() {
  if (!isMounted.value || !messagesContainer.value) return;

  // Use scrollTop to ensure we scroll to the very bottom
  const container = messagesContainer.value;
  container.scrollTop = container.scrollHeight;
}

// Enhanced messages watcher with simple scroll handling
watch(
  messages,
  async (newMessages, oldMessages) => {
    if (newMessages && newMessages.length > 0) {
      // Clear any existing timeout to debounce
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Check if messages were added (not just reordered) or if it's initial load
      const messageCountChanged =
        !oldMessages || newMessages.length !== oldMessages.length;

      if (messageCountChanged) {
        await nextTick(); // Wait for DOM to update
        scrollTimeout = setTimeout(() => {
          if (isMounted.value) {
            scrollToBottom();
          }
        }, 100); // 100ms delay for subsequent updates
      }
    }
  },
  { deep: false, immediate: false }
);

// Watch connection status for automatic reconnection
watch(
  realtimeConnectionStatus,
  async (newStatus, oldStatus) => {
    if (!isMounted.value) return;

    console.log('[ChatInterface] Connection status changed:', {
      oldStatus,
      newStatus,
    });

    // Update local connection status
    connectionStatus.value = newStatus;

    // If connection was lost and we have a room, try to reconnect
    if (
      oldStatus === 'connected' &&
      newStatus === 'disconnected' &&
      props.roomId
    ) {
      console.log(
        '[ChatInterface] Connection lost, attempting automatic reconnection...'
      );

      // Wait a bit before attempting reconnection
      setTimeout(async () => {
        if (isMounted.value && realtimeConnectionStatus.value !== 'connected') {
          try {
            await handleReconnect();
          } catch (error) {
            console.error(
              '[ChatInterface] Automatic reconnection failed:',
              error
            );
          }
        }
      }, 2000); // 2 second delay
    }

    // If connection is restored, ensure subscription is active
    if (
      newStatus === 'connected' &&
      oldStatus !== 'connected' &&
      props.roomId
    ) {
      console.log(
        '[ChatInterface] Connection restored, verifying subscription...'
      );

      // Check if we have an active subscription, if not, create one
      const connectionStatus = realtimeConnectionManager.getConnectionStatus();
      const hasActiveSubscription = connectionStatus.connections.some(
        (conn) =>
          conn.id === `chat-room-${props.roomId}` &&
          conn.status === 'SUBSCRIBED'
      );

      if (!hasActiveSubscription) {
        try {
          messageChannel = await chatStore.subscribeToMessages(props.roomId);
          console.log(
            '[ChatInterface] Subscription re-established after connection restore'
          );
        } catch (error) {
          console.error(
            '[ChatInterface] Failed to re-establish subscription:',
            error
          );
        }
      }
    }
  },
  { immediate: true }
);

// Watch authentication status
watch(realtimeIsAuthenticated, async (isAuth, wasAuth) => {
  if (!isMounted.value) return;

  console.log('[ChatInterface] Authentication status changed:', {
    wasAuth,
    isAuth,
  });

  // If authentication was restored, reconnect
  if (isAuth && !wasAuth && props.roomId) {
    console.log('[ChatInterface] Authentication restored, reconnecting...');
    try {
      await handleReconnect();
    } catch (error) {
      console.error(
        '[ChatInterface] Reconnection after auth restore failed:',
        error
      );
    }
  }
});

// Load initial messages
async function loadMessages() {
  // chatDiagnostics logging disabled to prevent infinite reactive loops

  // Set the current room in the store
  chatStore.setCurrentRoom(props.roomId);

  // Fetch budget proposals FIRST before messages to avoid loading state issues
  try {
    await chatStore.fetchBudgetProposals(props.roomId);
  } catch (error) {
    console.error(
      '[ChatInterface] Failed to fetch budget proposals:',
      error.message
    );
    // Don't throw - budget proposals are optional, chat should still work
  }

  currentPage.value = 1;
  const result = await chatStore.fetchMessages(props.roomId, {
    limit: 20,
    page: 1,
    refresh: true,
  });

  if (result) {
    hasMoreMessages.value = result.hasMore;
    await nextTick(); // Wait for Vue to process initial DOM updates
    if (isMounted.value) {
      // Check if still mounted
      setTimeout(() => {
        if (isMounted.value) {
          // Re-check mount status inside timeout
          scrollToBottom();
        }
      }, 150); // Increased delay for initial load
    }
  }

  // chatDiagnostics logging disabled to prevent infinite reactive loops
}

// Load more messages (pagination)
async function loadMoreMessages() {
  if (isLoadingMore.value || !isMounted.value) return;

  isLoadingMore.value = true;
  currentPage.value++;

  const result = await chatStore.fetchMessages(props.roomId, {
    limit: 20,
    page: currentPage.value,
  });

  if (result && isMounted.value) {
    hasMoreMessages.value = result.hasMore;
  }

  if (isMounted.value) {
    isLoadingMore.value = false;
  }
}

// Send a new message with loading state
async function sendMessage() {
  if (!isMounted.value) return;

  const messageText = newMessage.value.trim();
  if (!messageText || isSending.value) return;

  isSending.value = true;
  newMessage.value = '';

  // Reset textarea height immediately
  if (messageInput.value && isMounted.value) {
    const textareaElement = messageInput.value.$el || messageInput.value;
    if (textareaElement && textareaElement.style) {
      textareaElement.style.height = 'auto';
    }
  }

  try {
    // Get current user's name
    const currentUserName =
      user.value?.firstName && user.value?.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : user.value?.username || 'Me';

    await chatStore.sendMessage(props.roomId, messageText, currentUserName);

    // Scroll after sending message
    await nextTick();
    scrollToBottom();
  } catch (err) {
    // If error and still mounted, restore the message
    if (isMounted.value) {
      newMessage.value = messageText;
    }
  } finally {
    if (isMounted.value) {
      isSending.value = false;
    }
  }
}

// Handle key down events
function handleKeyDown(event) {
  if (!isMounted.value) return;

  // Handle Enter key
  if (event.key === 'Enter') {
    // Check if Shift key is pressed - if so, allow new line
    if (event.shiftKey) {
      return; // Let the default behavior happen (new line)
    }

    // Prevent default form submission and send message
    event.preventDefault();
    sendMessage();
  }
}

// Handle avatar loading errors
function handleAvatarError(userId) {
  if (!isMounted.value) return;
  if (avatarCache.value[userId]) {
    delete avatarCache.value[userId];
  }
}

// Handle reconnection attempts
async function handleReconnect() {
  if (!isMounted.value) return;

  isReconnecting.value = true;
  connectionError.value = null;

  try {
    console.log('[ChatInterface] Manual reconnection triggered');

    // Force reconnect using the connection manager
    await realtimeConnectionManager.forceReconnect();

    // Re-establish subscription for current room
    if (props.roomId) {
      messageChannel = await chatStore.subscribeToMessages(props.roomId);
      console.log(
        '[ChatInterface] Subscription re-established after manual reconnect'
      );
    }
  } catch (error) {
    console.error('[ChatInterface] Manual reconnection failed:', error);
    connectionError.value = error.message;
  } finally {
    if (isMounted.value) {
      isReconnecting.value = false;
    }
  }
}

// Test connection health
async function testConnectionHealth() {
  if (!isMounted.value) return;

  try {
    console.log('[ChatInterface] Testing connection health');
    const healthResult = await realtimeConnectionManager.testConnection();
    console.log('[ChatInterface] Connection health test result:', healthResult);
    return healthResult;
  } catch (error) {
    console.error('[ChatInterface] Connection health test failed:', error);
    connectionError.value = error.message;
    return false;
  }
}

// Auto-resize the textarea based on content
function autoResizeTextarea() {
  if (!isMounted.value || !messageInput.value) {
    return;
  }

  // For Vue components, access the actual DOM element
  const textareaElement = messageInput.value.$el || messageInput.value;

  if (!textareaElement || !textareaElement.style) {
    return;
  }

  // Reset height to auto to get the correct scrollHeight
  textareaElement.style.height = 'auto';

  // Set the height to match the content (with a max height)
  const newHeight = Math.min(textareaElement.scrollHeight || 0, 150);
  textareaElement.style.height = `${newHeight}px`;
}

// Trigger image upload
function triggerImageUpload() {
  if (!isMounted.value || isUploadingImage.value) return;
  imageInput.value?.click();
}

// Handle image upload
async function handleImageUpload(event) {
  if (!isMounted.value) return;

  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  if (!allowedTypes.includes(file.type)) {
    alert('Only JPEG, PNG, GIF, and WebP images are allowed');
    return;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('Image size must be less than 10MB');
    return;
  }

  isUploadingImage.value = true;

  try {
    // Get current user's name
    const currentUserName =
      user.value?.firstName && user.value?.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : user.value?.username || 'Me';

    // Send image with job context if selected
    const jobId = selectedJobForMessage.value?.id || null;
    await chatStore.sendImageMessage(
      props.roomId,
      file,
      currentUserName,
      jobId
    );

    // Clear job context after sending
    selectedJobForMessage.value = null;

    // Scroll after sending image
    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error('Failed to upload image:', err);
    alert(err.message || 'Failed to upload image. Please try again.');
  } finally {
    if (isMounted.value) {
      isUploadingImage.value = false;
      // Clear the file input
      if (imageInput.value) {
        imageInput.value.value = '';
      }
    }
  }
}

// Handle job context selection
async function handleJobContextSelection() {
  if (!isMounted.value) return;

  try {
    // Check if we already have a job selected
    if (selectedJobForMessage.value) {
      // Clear the current selection
      selectedJobForMessage.value = null;
      return;
    }

    // Fetch shared jobs between current user and the other user
    if (!otherUserId.value) {
      console.error('Cannot determine other user ID');
      return;
    }

    const sharedJobs = await chatStore.fetchSharedJobs(otherUserId.value);

    if (!sharedJobs || sharedJobs.length === 0) {
      // No shared jobs found
      alert(
        'No jobs found between you and this user. Please create a job first or apply to an existing job.'
      );
      return;
    }

    if (sharedJobs.length === 1) {
      // Only one job - automatically select it
      const job = sharedJobs[0];
      selectedJobForMessage.value = {
        id: job.id,
        title: job.description || job.category_name || `Job ${job.id}`,
        description: job.description,
        category_name: job.category_name,
        photos: job.photos,
        image_url: job.photos?.[0] || null,
        created_at: job.created_at,
        posted_by_user_id: job.posted_by_user_id,
        status: job.status,
      };
    } else {
      // Multiple jobs - show job selector for user to choose
      jobSelectorMode.value = 'message';
      showJobSelector.value = true;
    }
  } catch (error) {
    console.error('Failed to handle job context selection:', error);
    alert('Failed to load job information. Please try again.');
  }
}

// Clear job context
function clearJobContext() {
  selectedJobForMessage.value = null;
}

// Handle budget discussion button click
async function handleBudgetDiscussion() {
  if (!isMounted.value) return;

  const room = chatStore.currentRoom;
  if (!room) {
    console.error('No current room found');
    return;
  }

  try {
    // Check if this is a job-specific chat room
    if (room.job_id) {
      // Job-specific chat - fetch complete job details before opening composer
      try {
        const { useJobStore } = await import('@/stores/job.js');
        const jobStore = useJobStore();
        const jobDetails = await jobStore.fetchJobById(room.job_id);

        if (jobDetails) {
          selectedJob.value = {
            id: jobDetails.id,
            title:
              jobDetails.description ||
              jobDetails.category_name ||
              `Job ${jobDetails.id}`,
            description: jobDetails.description,
            category_name: jobDetails.category_name,
            photos: jobDetails.photos,
            image_url: jobDetails.photos?.[0] || null,
            created_at: jobDetails.created_at,
            posted_by_user_id: jobDetails.posted_by_user_id,
            status: jobDetails.status,
          };
        } else {
          // Fallback if job fetch fails
          selectedJob.value = {
            id: room.job_id,
            title: `Job ${room.job_id}`,
            description: null,
            category_name: null,
            photos: null,
            image_url: null,
          };
        }

        counterProposal.value = null;
        showBudgetComposer.value = true;
        return;
      } catch (error) {
        console.error(
          'Failed to fetch job details for job-specific chat:',
          error
        );
        // Fallback to minimal job data
        selectedJob.value = {
          id: room.job_id,
          title: `Job ${room.job_id}`,
          description: null,
          category_name: null,
          photos: null,
          image_url: null,
        };
        counterProposal.value = null;
        showBudgetComposer.value = true;
        return;
      }
    }

    // General chat - check how many jobs exist between these users
    if (!otherUserId.value) {
      console.error('Cannot determine other user ID');
      return;
    }

    // Fetch shared jobs between current user and the other user
    const sharedJobs = await chatStore.fetchSharedJobs(otherUserId.value);

    if (!sharedJobs || sharedJobs.length === 0) {
      // No shared jobs found
      alert(
        'No jobs found between you and this user. Please create a job first or apply to an existing job.'
      );
      return;
    }

    if (sharedJobs.length === 1) {
      // Only one job - automatically select it and open budget composer
      const job = sharedJobs[0];
      selectedJob.value = {
        id: job.id,
        title: job.description || job.category_name || `Job ${job.id}`,
        description: job.description,
        category_name: job.category_name,
        photos: job.photos,
        image_url: job.photos?.[0] || null,
        created_at: job.created_at,
        posted_by_user_id: job.posted_by_user_id,
        status: job.status,
      };
      counterProposal.value = null;
      showBudgetComposer.value = true;
    } else {
      // Multiple jobs - show job selector for user to choose
      jobSelectorMode.value = 'budget';
      showJobSelector.value = true;
    }
  } catch (error) {
    console.error('Failed to handle budget discussion:', error);
    alert('Failed to load job information. Please try again.');
  }
}

// Handle job selection from job selector modal
function handleJobSelected(job) {
  console.log('[ChatInterface] DIAGNOSTIC - Job selected:', {
    jobId: job.id,
    jobTitle: job.title,
    jobData: job,
    hasDescription: !!job.description,
    hasPhotos: !!job.photos,
    hasImageUrl: !!job.image_url,
  });

  // Check the mode to determine what to do with the selected job
  if (jobSelectorMode.value === 'budget') {
    // For budget discussion
    selectedJob.value = job;
    counterProposal.value = null;
    showBudgetComposer.value = true;
  } else {
    // For message context
    selectedJobForMessage.value = job;
  }
}

// Handle budget proposal submission
async function handleBudgetProposalSubmit(
  proposalData,
  originalProposalId = null
) {
  if (!isMounted.value) return;

  console.log(
    '[ChatInterface] DIAGNOSTIC - Budget proposal submission started:',
    {
      proposalData,
      originalProposalId,
      selectedJob: selectedJob.value,
      otherUserId: otherUserId.value,
      roomId: props.roomId,
    }
  );

  try {
    // Get current user's name
    const currentUserName =
      user.value?.firstName && user.value?.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : user.value?.username || 'Me';

    if (originalProposalId) {
      // This is a counter proposal
      console.log('[ChatInterface] DIAGNOSTIC - Sending counter proposal');
      await chatStore.counterBudgetProposal(originalProposalId, proposalData);
    } else {
      // Add the recipient ID to the proposal data
      const proposalDataWithRecipient = {
        ...proposalData,
        recipientId: otherUserId.value,
      };

      console.log(
        '[ChatInterface] DIAGNOSTIC - Sending new budget proposal:',
        proposalDataWithRecipient
      );

      // This is a new proposal
      await chatStore.sendBudgetProposal(
        props.roomId,
        proposalDataWithRecipient,
        currentUserName
      );
    }

    console.log(
      '[ChatInterface] DIAGNOSTIC - Budget proposal sent successfully'
    );

    showBudgetComposer.value = false;
    selectedJob.value = null;
    counterProposal.value = null;

    // Scroll to bottom to show the new proposal message
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error(
      '[ChatInterface] DIAGNOSTIC - Budget proposal submission failed:',
      error
    );
    alert(error.message || 'Failed to send budget proposal. Please try again.');
  }
}

// Get budget proposal by ID
function getBudgetProposal(proposalId) {
  if (!proposalId || !budgetProposals.value) return null;
  return budgetProposals.value.find((p) => p.id === proposalId);
}

// Handle accepting a budget proposal
async function handleAcceptProposal(proposalId) {
  if (!isMounted.value) return;

  try {
    await chatStore.acceptBudgetProposal(proposalId);
  } catch (error) {
    console.error('Failed to accept budget proposal:', error);
    alert(
      error.message || 'Failed to accept budget proposal. Please try again.'
    );
  }
}

// Handle declining a budget proposal
async function handleDeclineProposal(proposalId) {
  if (!isMounted.value) return;

  try {
    await chatStore.declineBudgetProposal(proposalId);
  } catch (error) {
    console.error('Failed to decline budget proposal:', error);
    alert(
      error.message || 'Failed to decline budget proposal. Please try again.'
    );
  }
}

// Handle countering a budget proposal
async function handleCounterProposal(proposal) {
  if (!isMounted.value) return;

  try {
    // Set up the counter proposal data and open the budget composer
    selectedJob.value = {
      id: proposal.job_id,
      title:
        proposal.job_postings?.description ||
        proposal.job_postings?.category_name ||
        `Job ${proposal.job_id}`,
    };
    counterProposal.value = proposal;
    showBudgetComposer.value = true;
  } catch (error) {
    console.error('Failed to setup counter proposal:', error);
    alert(
      error.message || 'Failed to setup counter proposal. Please try again.'
    );
  }
}

// Clean up subscription when component unmounts
onUnmounted(async () => {
  // chatDiagnostics logging disabled to prevent infinite reactive loops

  isMounted.value = false;

  // Clear any pending scroll timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }

  if (messageChannel) {
    try {
      console.log(
        '[ChatInterface] DIAGNOSTIC - Cleaning up subscription for room:',
        props.roomId
      );

      // chatDiagnostics logging disabled to prevent infinite reactive loops

      // Import diagnostics
      const { subscriptionDiagnostics } = await import(
        '@/lib/subscriptionDiagnostics'
      );
      subscriptionDiagnostics.logSubscriptionEvent(
        props.roomId,
        'SUBSCRIPTION_CLEANUP_STARTED'
      );

      // Use subscription manager for cleanup
      subscriptionCleanupPromise = chatStore.cleanupSubscription(props.roomId);
      await subscriptionCleanupPromise;

      subscriptionDiagnostics.logSubscriptionEvent(
        props.roomId,
        'SUBSCRIPTION_CLEANUP_COMPLETED'
      );

      // chatDiagnostics logging disabled to prevent infinite reactive loops

      console.log(
        '[ChatInterface] DIAGNOSTIC - Subscription cleanup completed for room:',
        props.roomId
      );
    } catch (err) {
      console.error(
        '[ChatInterface] DIAGNOSTIC - Subscription cleanup failed:',
        err
      );
      // chatDiagnostics logging disabled to prevent infinite reactive loops
      // Silently handle cleanup errors during unmount
    } finally {
      messageChannel = null;
      subscriptionCleanupPromise = null;
    }
  }

  // chatDiagnostics logging disabled to prevent infinite reactive loops
});

// Component mounted
onMounted(() => {
  // chatDiagnostics logging disabled to prevent infinite reactive loops

  isMounted.value = true;

  // Set the current room immediately when mounted
  chatStore.setCurrentRoom(props.roomId);

  // Set up message subscription using subscription manager (async)
  const setupSubscription = async () => {
    try {
      console.log(
        '[ChatInterface] DIAGNOSTIC - Starting subscription setup for room:',
        props.roomId
      );

      // chatDiagnostics logging disabled to prevent infinite reactive loops

      // Clean up any existing subscription first using subscription manager
      if (messageChannel) {
        console.log(
          '[ChatInterface] DIAGNOSTIC - Cleaning up existing subscription before creating new one'
        );
        // chatDiagnostics logging disabled to prevent infinite reactive loops
        try {
          await chatStore.cleanupSubscription(props.roomId);
          messageChannel = null;
        } catch (cleanupError) {
          console.warn(
            '[ChatInterface] DIAGNOSTIC - Failed to cleanup existing subscription:',
            cleanupError
          );
          // chatDiagnostics logging disabled to prevent infinite reactive loops
        }
      }

      // Use subscription manager through chat store
      messageChannel = await chatStore.subscribeToMessages(props.roomId);
      console.log(
        '[ChatInterface] DIAGNOSTIC - Message subscription established:',
        {
          channelExists: !!messageChannel,
          roomId: props.roomId,
        }
      );

      // chatDiagnostics logging disabled to prevent infinite reactive loops
    } catch (error) {
      console.error(
        '[ChatInterface] DIAGNOSTIC - Failed to establish message subscription:',
        error
      );
      // chatDiagnostics logging disabled to prevent infinite reactive loops
    }
  };

  setupSubscription();

  // Initialize textarea height
  nextTick(() => {
    if (messageInput.value && isMounted.value) {
      const textareaElement = messageInput.value.$el || messageInput.value;
      if (textareaElement && textareaElement.style) {
        textareaElement.style.height = 'auto';
      }
    }
  });

  // Fetch current user's avatar (non-async)
  if (user.value?.imageUrl) {
    currentUserAvatar.value = user.value.imageUrl;
  }

  // chatDiagnostics logging disabled to prevent infinite reactive loops
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  background-color: white;
  overflow: hidden;
  width: 100%;
  position: relative;
}

/* Dark mode background */
.dark .chat-interface {
  background-color: rgb(17 24 39); /* gray-900 */
}

/* Ensure the fixed input area has proper styling */
.fixed {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* Dark mode shadow */
.dark .fixed {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

/* Ensure messages container has proper scrolling */
.overflow-y-auto {
  /* Force hardware acceleration for smoother scrolling */
  transform: translateZ(0);
  -webkit-overflow-scrolling: touch;
  /* Ensure proper scroll behavior */
  scroll-behavior: auto !important;
  /* Prevent scroll anchoring which can interfere with programmatic scrolling */
  overflow-anchor: none;
  /* Ensure scrolling works properly on mobile */
  overscroll-behavior: contain;
}

/* Custom scrollbar for messages container */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: var(--muted-foreground);
}

/* Ensure message items don't interfere with scrolling */
.overflow-y-auto > * {
  /* Prevent flex shrinking that could affect scroll calculations */
  flex-shrink: 0;
}
</style>
