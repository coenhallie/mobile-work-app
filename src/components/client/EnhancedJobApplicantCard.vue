<template>
  <div
    class="enhanced-applicant-card bg-card rounded-lg border transition-all duration-200 hover:shadow-lg flex gap-x-4 p-4"
  >
    <!-- Contractor Avatar -->
    <div class="relative flex-shrink-0">
      <img
        v-if="applicant.contractor_profiles?.avatar_url"
        :src="applicant.contractor_profiles.avatar_url"
        :alt="contractorName"
        class="w-16 h-16 rounded-full object-cover border-2 border-border"
        @error="handleImageError"
      />
      <div
        v-else
        class="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
      >
        <User class="w-8 h-8" />
      </div>

      <!-- Online Status Indicator -->
      <div
        v-if="isContractorOnline"
        class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"
        :title="$t('dashboard.online')"
      ></div>
    </div>

    <!-- Main Content Column -->
    <div class="flex flex-col flex-1">
      <!-- Header Section -->
      <div class="flex items-start justify-between mb-4">
        <!-- Contractor Info -->
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-lg font-semibold text-foreground">
              {{ contractorName }}
            </h3>
            <Badge
              v-if="applicant.contractor_profiles?.verified"
              variant="secondary"
            >
              <Shield class="w-3 h-3 mr-1" />
              {{ $t('dashboard.verified') }}
            </Badge>
          </div>

          <!-- Rating and Reviews -->
          <div class="flex items-center gap-4 mb-2">
            <div
              v-if="applicant.contractor_profiles?.rating"
              class="flex items-center text-yellow-500"
            >
              <Star class="w-4 h-4 fill-current" />
              <span class="ml-1 text-sm font-medium">
                {{ applicant.contractor_profiles.rating.toFixed(1) }}
              </span>
              <span class="ml-1 text-xs text-muted-foreground">
                ({{ applicant.contractor_profiles.review_count || 0 }}
                {{ $t('dashboard.reviews') }})
              </span>
            </div>

            <div
              v-if="applicant.contractor_profiles?.completion_rate"
              class="text-sm text-muted-foreground"
            >
              {{ applicant.contractor_profiles.completion_rate }}%
              {{ $t('dashboard.completionRate') }}
            </div>
          </div>

          <!-- Skills -->
          <div
            v-if="contractorSkills.length > 0"
            class="flex flex-wrap gap-1 mb-3"
          >
            <Badge
              v-for="skill in contractorSkills.slice(0, 3)"
              :key="skill"
              variant="outline"
              class="text-xs"
            >
              {{ skill }}
            </Badge>
            <Badge
              v-if="contractorSkills.length > 3"
              variant="outline"
              class="text-xs"
            >
              +{{ contractorSkills.length - 3 }}
            </Badge>
          </div>

          <!-- Application Date and Status -->
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <Calendar class="w-3 h-3" />
              {{ $t('dashboard.appliedOn') }}
              {{ formatDate(applicant.created_at) }}
            </span>
            <ApplicationStatusBadge :status="applicant.status" />
          </div>
        </div>

        <!-- Quick Actions Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
              <MoreVertical class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="viewContractorProfile">
              <User class="w-4 h-4 mr-2" />
              {{ $t('dashboard.viewProfile') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="startConversation">
              <MessageCircle class="w-4 h-4 mr-2" />
              {{ $t('dashboard.sendMessage') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="applicant.status === 'pending'" />
            <DropdownMenuItem
              v-if="applicant.status === 'pending'"
              @click="selectApplicant"
            >
              <CheckCircle class="w-4 h-4 mr-2" />
              {{ $t('dashboard.selectContractor') }}
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="applicant.status === 'pending'"
              @click="rejectApplicant"
              class="text-destructive focus:text-destructive"
            >
              <X class="w-4 h-4 mr-2" />
              {{ $t('dashboard.rejectApplication') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Application Message -->
      <div v-if="applicant.message" class="mb-4">
        <Label class="text-sm font-medium mb-2 block">
          {{ $t('dashboard.applicationMessage') }}
        </Label>
        <div class="bg-muted/50 rounded-lg p-3 text-sm">
          <p class="whitespace-pre-wrap">{{ applicant.message }}</p>
        </div>
      </div>

      <!-- Proposed Budget -->
      <div v-if="applicant.proposed_budget" class="mb-4">
        <Label class="text-sm font-medium mb-2 block">
          {{ $t('dashboard.proposedBudget') }}
        </Label>
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold text-green-600">
            S/{{ applicant.proposed_budget }}
          </span>
          <span v-if="jobBudgetRange" class="text-sm text-muted-foreground">
            ({{ $t('dashboard.jobBudget') }}: S/{{ jobBudgetRange }})
          </span>
        </div>
      </div>

      <!-- Availability -->
      <div v-if="applicant.availability" class="mb-4">
        <Label class="text-sm font-medium mb-2 block">
          {{ $t('dashboard.availability') }}
        </Label>
        <div class="text-sm text-muted-foreground">
          {{ applicant.availability }}
        </div>
      </div>

      <!-- Previous Work Samples -->
      <div v-if="workSamples.length > 0" class="mb-4">
        <Label class="text-sm font-medium mb-2 block">
          {{ $t('dashboard.workSamples') }}
        </Label>
        <div class="flex gap-2 overflow-x-auto">
          <img
            v-for="(sample, index) in workSamples.slice(0, 4)"
            :key="index"
            :src="sample"
            :alt="`Work sample ${index + 1}`"
            class="w-20 h-20 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
            @click="openImageModal(sample)"
          />
          <div
            v-if="workSamples.length > 4"
            class="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/80"
            @click="viewAllSamples"
          >
            +{{ workSamples.length - 4 }}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex items-center justify-between pt-4 border-t border-border"
      >
        <div class="flex items-center gap-2">
          <!-- Response Time -->
          <div
            v-if="applicant.contractor_profiles?.avg_response_time"
            class="text-xs text-muted-foreground"
          >
            <Clock class="w-3 h-3 inline mr-1" />
            {{ $t('dashboard.respondsIn') }}
            {{ applicant.contractor_profiles.avg_response_time }}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Compare Button -->
          <Button
            variant="outline"
            size="sm"
            @click="$emit('compare', applicant)"
          >
            <BarChart3 class="w-4 h-4 mr-1" />
            {{ $t('dashboard.compare') }}
          </Button>

          <!-- Message Button -->
          <Button
            variant="outline"
            size="sm"
            @click="startConversation"
            :disabled="isCreatingChat"
          >
            <div
              v-if="isCreatingChat"
              class="animate-spin w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full"
            ></div>
            <MessageCircle v-else class="w-4 h-4 mr-1" />
            {{
              isCreatingChat ? $t('common.loading') : $t('dashboard.message')
            }}
          </Button>

          <!-- Primary Action Button -->
          <Button
            v-if="applicant.status === 'pending'"
            size="sm"
            @click="selectApplicant"
            :disabled="isSelecting"
            class="bg-primary hover:bg-primary/90"
          >
            <div
              v-if="isSelecting"
              class="animate-spin w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full"
            ></div>
            {{
              isSelecting
                ? $t('dashboard.selecting')
                : $t('dashboard.selectContractor')
            }}
          </Button>

          <Button
            v-else-if="applicant.status === 'selected'"
            size="sm"
            variant="outline"
            @click="startConversation"
            class="border-green-200 text-green-700 hover:bg-green-50"
          >
            <CheckCircle class="w-4 h-4 mr-1" />
            {{ $t('dashboard.selected') }}
          </Button>
        </div>
      </div>

      <!-- Image Modal -->
      <ImageModal
        v-if="showImageModal"
        :image-url="selectedImage"
        @close="showImageModal = false"
      />
    </div>
    <!-- Closing Main Content Column -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
  Calendar,
  MoreVertical,
  MessageCircle,
  CheckCircle,
  X,
  Clock,
  BarChart3,
} from 'lucide-vue-next';
import ApplicationStatusBadge from './ApplicationStatusBadge.vue';
import ImageModal from '@/components/ui/ImageModal.vue';
import { useChatStore } from '@/stores/chat';
import { formatDisplayName } from '@/lib/nameFormatter';

const { t } = useI18n();
const router = useRouter();
const chatStore = useChatStore();

const props = defineProps({
  applicant: {
    type: Object,
    required: true,
  },
  jobBudgetRange: {
    type: String,
    default: null,
  },
  isJobOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select', 'reject', 'compare']);

// Component state
const isSelecting = ref(false);
const isCreatingChat = ref(false);
const showImageModal = ref(false);
const selectedImage = ref('');

// Computed properties
const contractorName = computed(
  () =>
    formatDisplayName(props.applicant.contractor_profiles?.full_name) ||
    t('dashboard.unnamedContractor')
);

const contractorSkills = computed(
  () => props.applicant.contractor_profiles?.skills || []
);

const workSamples = computed(
  () => props.applicant.contractor_profiles?.work_samples || []
);

const isContractorOnline = computed(
  () => props.applicant.contractor_profiles?.is_online || false
);

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const handleImageError = (event) => {
  event.target.src = '/images/contractor-default.svg';
};

const viewContractorProfile = () => {
  router.push(`/contractors/${props.applicant.contractor_id}`);
};

const startConversation = async () => {
  if (!props.applicant.contractor_id) {
    console.error('No contractor ID available');
    return;
  }

  isCreatingChat.value = true;
  try {
    const roomId = await chatStore.createDirectChatRoom(
      props.applicant.contractor_id
    );
    await router.push(`/messages/${roomId}`);
  } catch (error) {
    console.error('Error creating chat room:', error);
  } finally {
    isCreatingChat.value = false;
  }
};

const selectApplicant = async () => {
  isSelecting.value = true;
  try {
    emit('select', props.applicant.id);
  } catch (error) {
    console.error('Error selecting applicant:', error);
  } finally {
    setTimeout(() => {
      isSelecting.value = false;
    }, 1000);
  }
};

const rejectApplicant = () => {
  if (confirm(t('dashboard.confirmRejectApplication'))) {
    emit('reject', props.applicant.id);
  }
};

const openImageModal = (imageUrl) => {
  selectedImage.value = imageUrl;
  showImageModal.value = true;
};

const viewAllSamples = () => {
  // Could open a gallery modal or navigate to contractor profile
  viewContractorProfile();
};
</script>

<style scoped>
.enhanced-applicant-card {
  transition: all 0.2s ease;
}

.enhanced-applicant-card:hover {
  transform: translateY(-2px);
}
</style>
