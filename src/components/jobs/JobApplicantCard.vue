<template>
  <div class="job-applicant-card" :class="{ unread: !applicant.read }">
    <div class="flex items-start gap-4">
      <!-- Applicant Avatar -->
      <div class="flex-shrink-0">
        <img
          v-if="applicant.contractor_profiles?.avatar_url"
          :src="applicant.contractor_profiles.avatar_url"
          alt="Contractor profile"
          class="w-16 h-16 rounded-full object-cover border-2 border-border"
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <div
          v-else
          class="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-8 h-8"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>

      <!-- Applicant Info -->
      <div class="flex-grow">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-medium text-foreground">
              {{
                formatDisplayName(applicant.contractor_profiles?.full_name) ||
                'Unnamed Contractor'
              }}
            </h3>
            <div class="flex items-center mt-1">
              <!-- Rating -->
              <div
                v-if="applicant.contractor_profiles?.rating"
                class="flex items-center text-yellow-500 dark:text-yellow-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="ml-1 text-sm">{{
                  applicant.contractor_profiles.rating.toFixed(1)
                }}</span>
              </div>

              <!-- Specialties -->
              <div
                v-if="
                  applicant.contractor_profiles?.skills &&
                  applicant.contractor_profiles.skills.length > 0
                "
                class="ml-3"
              >
                <span
                  v-for="(
                    skill, index
                  ) in applicant.contractor_profiles.skills.slice(0, 2)"
                  :key="index"
                  class="inline-block bg-muted text-foreground text-xs px-2 py-1 rounded mr-1 mb-1"
                >
                  {{ skill }}
                </span>
                <span
                  v-if="applicant.contractor_profiles.skills.length > 2"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  +{{ applicant.contractor_profiles.skills.length - 2 }}
                  more
                </span>
              </div>
            </div>
          </div>

          <!-- Application Date -->
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(applicant.created_at) }}
          </div>
        </div>

        <!-- Application Message -->
        <div
          v-if="applicant.message"
          class="mt-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
        >
          <p class="whitespace-pre-wrap">{{ applicant.message }}</p>
        </div>

        <!-- Application Status -->
        <div v-if="applicant.status" class="mt-3 flex items-center gap-2">
          <span
            :class="getStatusBadgeClass(applicant.status)"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          >
            {{ getStatusText(applicant.status) }}
          </span>

          <!-- Chat Indicator for Selected Contractors -->
          <div
            v-if="applicant.status === 'selected'"
            class="relative inline-flex items-center"
            title="Chat conversation started"
          >
            <svg
              class="w-4 h-4 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <!-- Red dot indicator -->
            <div
              class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"
            ></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          v-if="isJobOwner && applicant.status !== 'selected'"
          class="mt-4 flex justify-end gap-2"
        >
          <!-- Message Button -->
          <button
            @click="handleMessageContractor"
            :disabled="isCreatingChat"
            class="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <div
              v-if="isCreatingChat"
              class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            ></div>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4 mr-2"
            >
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {{ isCreatingChat ? 'Creating...' : 'Message' }}
          </button>

          <!-- Select Contractor Button -->
          <button
            @click="handleSelectContractor"
            :disabled="isSelecting"
            class="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <div
              v-if="isSelecting"
              class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            ></div>
            {{ isSelecting ? 'Selecting...' : 'Select Contractor' }}
          </button>
        </div>

        <!-- Selected Status with Message Button -->
        <div
          v-else-if="isJobOwner && applicant.status === 'selected'"
          class="mt-4 flex justify-end gap-2"
        >
          <!-- Message Button for Selected Contractors -->
          <button
            @click="handleMessageContractor"
            :disabled="isCreatingChat"
            class="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <div
              v-if="isCreatingChat"
              class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            ></div>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4 mr-2"
            >
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {{ isCreatingChat ? 'Creating...' : 'Message' }}
          </button>

          <div
            class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-md text-sm font-medium"
          >
            ✓ Selected
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../../stores/chat.js';
import { formatDisplayName } from '@/lib/nameFormatter';

const props = defineProps({
  applicant: {
    type: Object,
    required: true,
  },
  isJobOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select']);

// Router and stores
const router = useRouter();
const chatStore = useChatStore();

// Local state for selection and messaging loading
const isSelecting = ref(false);
const isCreatingChat = ref(false);

// Handle contractor selection with loading state
async function handleSelectContractor() {
  console.log(
    '[JobApplicantCard] Handling contractor selection for:',
    props.applicant.id
  );

  isSelecting.value = true;

  try {
    emit('select', props.applicant.id);
  } catch (error) {
    console.error('[JobApplicantCard] Error during selection:', error);
  } finally {
    // Reset loading state after a delay to show feedback
    setTimeout(() => {
      isSelecting.value = false;
    }, 1000);
  }
}

// Handle messaging contractor
async function handleMessageContractor() {
  console.log(
    '[JobApplicantCard] Creating chat room with contractor:',
    props.applicant.contractor_id
  );

  if (!props.applicant.contractor_id) {
    console.error('[JobApplicantCard] No contractor ID available');
    return;
  }

  isCreatingChat.value = true;

  try {
    // Create or get existing direct chat room
    const roomId = await chatStore.createDirectChatRoom(
      props.applicant.contractor_id
    );

    console.log('[JobApplicantCard] Chat room created/found:', roomId);

    // Navigate to the conversation
    await router.push(`/messages/${roomId}`);
  } catch (error) {
    console.error('[JobApplicantCard] Error creating chat room:', error);
    // You could add a toast notification here to show the error to the user
  } finally {
    isCreatingChat.value = false;
  }
}

// Get status badge styling
function getStatusBadgeClass(status) {
  switch (status) {
    case 'selected':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

// Get human-readable status text
function getStatusText(status) {
  switch (status) {
    case 'selected':
      return 'Selected';
    case 'rejected':
      return 'Not Selected';
    case 'pending':
      return 'Pending Review';
    default:
      return status || 'Unknown';
  }
}

// Debug logging for applicant data
onMounted(() => {
  console.log('[JobApplicantCard] Applicant data:', props.applicant);
  console.log(
    '[JobApplicantCard] Contractor profiles:',
    props.applicant.contractor_profiles
  );
  console.log(
    '[JobApplicantCard] Avatar URL:',
    props.applicant.contractor_profiles?.avatar_url
  );
});

// Handle image loading events
function handleImageLoad() {
  console.log(
    '[JobApplicantCard] Image loaded successfully:',
    props.applicant.contractor_profiles?.avatar_url
  );
}

function handleImageError() {
  console.error(
    '[JobApplicantCard] Image failed to load:',
    props.applicant.contractor_profiles?.avatar_url
  );
}

// Format date to a readable format
function formatDate(dateString) {
  if (!dateString) return 'Unknown date';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<style scoped>
.job-applicant-card {
  background-color: white;
  padding: 1rem; /* Equivalent to p-4 */
  border-radius: 0.5rem; /* Equivalent to rounded-lg */
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06); /* Equivalent to shadow */
  border: 1px solid #e5e7eb; /* Equivalent to border border-gray-200 */
  transition: all 0.2s ease;
}

/* Dark mode styles */
:root.dark .job-applicant-card,
.dark .job-applicant-card {
  background-color: #1f2937; /* gray-800 */
  border-color: #374151; /* gray-700 */
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.3),
    0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

.job-applicant-card.unread {
  border-left: 4px solid #3b82f6; /* Equivalent to border-l-4 border-l-blue-500 */
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.1),
    0 4px 6px -1px rgba(59, 130, 246, 0.1);
}

:root.dark .job-applicant-card.unread,
.dark .job-applicant-card.unread {
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.2),
    0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.job-applicant-card:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
}

:root.dark .job-applicant-card:hover,
.dark .job-applicant-card:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.4),
    0 2px 4px -1px rgba(0, 0, 0, 0.3);
}
</style>
