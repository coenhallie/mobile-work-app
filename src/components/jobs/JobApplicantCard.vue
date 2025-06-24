<template>
  <article
    class="border border-border/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-sm hover:border-border"
    @click="viewContractorProfile(applicant.contractor_id)"
    role="button"
    :aria-label="`View ${applicant.contractor_profiles?.full_name}'s application`"
    tabindex="0"
  >
    <!-- Header Section -->
    <div class="flex items-start space-x-4 p-4">
      <!-- Profile Image -->
      <div class="relative flex-shrink-0">
        <img
          v-if="applicant.contractor_profiles?.avatar_url"
          :src="applicant.contractor_profiles.avatar_url"
          :alt="`${applicant.contractor_profiles?.full_name}'s profile picture`"
          class="w-14 h-14 rounded-full object-cover border border-border/50"
          loading="lazy"
          @error="handleImageError"
        />
        <!-- Fallback Avatar -->
        <div
          v-else
          class="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground border border-border/50"
        >
          {{ getContractorInitial(applicant.contractor_profiles?.full_name) }}
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3
          class="text-lg font-semibold text-foreground mb-0.5 leading-tight truncate"
        >
          {{ formatDisplayName(applicant.contractor_profiles?.full_name) }}
        </h3>
        <p class="text-sm text-muted-foreground truncate">
          {{ $t('applications.appliedOn') }}
          {{ formatDate(applicant.created_at) }}
        </p>
      </div>

      <!-- Status Badge -->
      <div class="shrink-0">
        <span
          :class="getStatusBadgeClass(applicant.status)"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        >
          {{ $t(`applicationStatus.${applicant.status}`) }}
        </span>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-4 pt-0">
      <!-- Rating and Location -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-4 text-sm text-muted-foreground">
          <div
            v-if="applicant.contractor_profiles?.rating"
            class="flex items-center space-x-1"
          >
            <Star class="w-4 h-4 text-yellow-400" />
            <span>{{ applicant.contractor_profiles.rating.toFixed(1) }}</span>
          </div>
          <div class="flex items-center space-x-1">
            <MapPin class="w-4 h-4" />
            <span
              >{{ $t('applications.location') }}:
              {{ applicant.profile?.location || $t('common.unknown') }}</span
            >
          </div>
        </div>
      </div>

      <!-- Application Message -->
      <p
        v-if="applicant.message"
        class="text-sm text-muted-foreground/80 mb-3 line-clamp-2 leading-relaxed italic bg-background/30 p-3 rounded-md"
      >
        "{{ applicant.message }}"
      </p>

      <!-- Skills -->
      <div
        v-if="
          applicant.contractor_profiles?.skills &&
          applicant.contractor_profiles.skills.length > 0
        "
        class="flex flex-wrap gap-1.5 mb-4"
      >
        <span
          v-for="skill in applicant.contractor_profiles.skills.slice(0, 3)"
          :key="skill"
          class="px-2.5 py-1 bg-muted/50 text-foreground text-xs rounded-lg font-medium"
        >
          {{ skill }}
        </span>
        <span
          v-if="applicant.contractor_profiles.skills.length > 3"
          class="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-lg font-medium"
        >
          +{{ applicant.contractor_profiles.skills.length - 3 }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div v-if="isJobOwner" class="flex flex-wrap gap-2">
        <template v-if="applicant.status === 'pending'">
          <Button
            @click.stop="handleSelectContractor"
            :disabled="isSelecting"
            size="sm"
            class="flex-1 min-w-0"
          >
            <Check class="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span class="truncate">
              {{
                isSelecting
                  ? $t('dashboard.selecting')
                  : $t('dashboard.selectContractor')
              }}
            </span>
          </Button>

          <Button
            @click.stop="handleMessageContractor"
            :disabled="isCreatingChat"
            size="sm"
            variant="outline"
            class="flex-1 min-w-0"
          >
            <MessageCircle class="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span class="truncate">
              {{
                isCreatingChat
                  ? $t('dashboard.sending')
                  : $t('dashboard.message')
              }}
            </span>
          </Button>
        </template>

        <template v-else-if="applicant.status === 'selected'">
          <Button
            @click.stop="handleMessageContractor"
            :disabled="isCreatingChat"
            size="sm"
            class="flex-1 min-w-0"
          >
            <MessageCircle class="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span class="truncate">
              {{
                isCreatingChat
                  ? $t('dashboard.sending')
                  : $t('dashboard.message')
              }}
            </span>
          </Button>
        </template>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useChatStore } from '../../stores/chat.js';
import { formatDisplayName } from '@/lib/nameFormatter';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Check, MessageCircle } from 'lucide-vue-next';

const { t } = useI18n();

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

const router = useRouter();
const chatStore = useChatStore();

const isSelecting = ref(false);
const isCreatingChat = ref(false);

async function handleSelectContractor() {
  isSelecting.value = true;
  try {
    emit('select', props.applicant.id);
  } catch (error) {
    console.error('[JobApplicantCard] Error during selection:', error);
  } finally {
    setTimeout(() => {
      isSelecting.value = false;
    }, 1000);
  }
}

async function handleMessageContractor() {
  if (!props.applicant.contractor_id) {
    console.error('[JobApplicantCard] No contractor ID available');
    return;
  }
  isCreatingChat.value = true;
  try {
    const roomId = await chatStore.createDirectChatRoom(
      props.applicant.contractor_id
    );
    await router.push(`/messages/${roomId}`);
  } catch (error) {
    console.error('[JobApplicantCard] Error creating chat room:', error);
  } finally {
    isCreatingChat.value = false;
  }
}

function viewContractorProfile(userId) {
  if (userId) {
    router.push(`/contractors/${userId}`);
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'selected':
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    case 'pending':
    default:
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
  }
}

function getContractorInitial(name) {
  return (name || '').charAt(0).toUpperCase() || '?';
}

function handleImageError(event) {
  console.error(
    '[JobApplicantCard] Image failed to load:',
    props.applicant.contractor_profiles?.avatar_url
  );
  event.target.src = '/images/contractor-default.svg';
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const userLocale = navigator.language || 'en-US';
  return date.toLocaleDateString(userLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>
