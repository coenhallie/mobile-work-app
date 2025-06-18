<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ $t('dashboard.messageApplicants') }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t('dashboard.messageApplicantsDescription', {
              jobTitle: job.service_name || job.category_name,
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Recipient Selection -->
        <div>
          <Label class="text-sm font-medium mb-3 block">
            {{ $t('dashboard.selectRecipients') }}
          </Label>
          <div class="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            <div class="flex items-center space-x-2 mb-2">
              <Checkbox
                id="select-all"
                :checked="allSelected"
                @update:checked="toggleSelectAll"
              />
              <Label for="select-all" class="text-sm font-medium">
                {{ $t('dashboard.selectAll') }} ({{ applications.length }})
              </Label>
            </div>
            <Separator />
            <div
              v-for="application in applications"
              :key="application.id"
              class="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
            >
              <Checkbox
                :id="`applicant-${application.id}`"
                :checked="selectedApplicants.includes(application.id)"
                @update:checked="
                  (checked) => toggleApplicant(application.id, checked)
                "
              />
              <img
                :src="
                  application.contractor_profiles?.avatar_url ||
                  '/images/contractor-default.svg'
                "
                :alt="
                  application.contractor_profiles?.full_name || 'Contractor'
                "
                class="w-8 h-8 rounded-full object-cover"
              />
              <div class="flex-1">
                <div class="text-sm font-medium">
                  {{
                    application.contractor_profiles?.full_name ||
                    'Unnamed Contractor'
                  }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ getApplicationStatusText(application.status) }}
                  <span
                    v-if="application.contractor_profiles?.rating"
                    class="ml-2"
                  >
                    ⭐ {{ application.contractor_profiles.rating.toFixed(1) }}
                  </span>
                </div>
              </div>
              <Badge :variant="getStatusVariant(application.status)">
                {{ getApplicationStatusText(application.status) }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Message Templates -->
        <div>
          <Label class="text-sm font-medium mb-3 block">
            {{ $t('dashboard.messageTemplate') }}
          </Label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <Button
              v-for="template in messageTemplates"
              :key="template.key"
              variant="outline"
              size="sm"
              @click="selectTemplate(template)"
              class="text-left justify-start h-auto p-3"
            >
              <div>
                <div class="font-medium text-sm">{{ template.title }}</div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ template.preview }}
                </div>
              </div>
            </Button>
          </div>
        </div>

        <!-- Message Content -->
        <div>
          <Label for="message-content" class="text-sm font-medium mb-2 block">
            {{ $t('dashboard.messageContent') }}
          </Label>
          <Textarea
            id="message-content"
            v-model="messageContent"
            :placeholder="$t('dashboard.messageContentPlaceholder')"
            class="min-h-[120px]"
            :disabled="isSending"
          />
          <div class="text-xs text-muted-foreground mt-1">
            {{ messageContent.length }}/500 {{ $t('common.characters') }}
          </div>
        </div>

        <!-- Message Options -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Checkbox
              id="include-job-details"
              v-model:checked="includeJobDetails"
            />
            <Label for="include-job-details" class="text-sm">
              {{ $t('dashboard.includeJobDetails') }}
            </Label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox id="request-response" v-model:checked="requestResponse" />
            <Label for="request-response" class="text-sm">
              {{ $t('dashboard.requestResponse') }}
            </Label>
          </div>
        </div>

        <!-- Preview -->
        <div v-if="messageContent" class="border rounded-lg p-4 bg-muted/30">
          <Label class="text-sm font-medium mb-2 block">
            {{ $t('dashboard.messagePreview') }}
          </Label>
          <div class="text-sm space-y-2">
            <p>{{ messageContent }}</p>
            <div
              v-if="includeJobDetails"
              class="border-t pt-2 mt-2 text-xs text-muted-foreground"
            >
              <strong>{{ $t('dashboard.jobDetails') }}:</strong><br />
              {{ job.service_name || job.category_name }}<br />
              {{ job.location_text }}<br />
              {{ $t('dashboard.postedOn') }}: {{ formatDate(job.created_at) }}
            </div>
            <div
              v-if="requestResponse"
              class="text-xs text-muted-foreground italic"
            >
              {{ $t('dashboard.pleaseRespond') }}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('close')" :disabled="isSending">
          {{ $t('common.cancel') }}
        </Button>
        <Button
          @click="sendMessages"
          :disabled="!canSend || isSending"
          class="bg-primary hover:bg-primary/90"
        >
          <div
            v-if="isSending"
            class="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full"
          ></div>
          {{
            isSending ? $t('dashboard.sending') : $t('dashboard.sendMessage')
          }}
          <span v-if="!isSending && selectedApplicants.length > 0" class="ml-1">
            ({{ selectedApplicants.length }})
          </span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useChatStore } from '@/stores/chat';

const { t } = useI18n();
const chatStore = useChatStore();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  applications: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['close', 'sent']);

// Component state
const selectedApplicants = ref([]);
const messageContent = ref('');
const includeJobDetails = ref(true);
const requestResponse = ref(false);
const isSending = ref(false);

// Message templates
const messageTemplates = ref([
  {
    key: 'thank_you',
    title: t('dashboard.templates.thankYou'),
    preview: t('dashboard.templates.thankYouPreview'),
    content: t('dashboard.templates.thankYouContent'),
  },
  {
    key: 'request_info',
    title: t('dashboard.templates.requestInfo'),
    preview: t('dashboard.templates.requestInfoPreview'),
    content: t('dashboard.templates.requestInfoContent'),
  },
  {
    key: 'schedule_meeting',
    title: t('dashboard.templates.scheduleMeeting'),
    preview: t('dashboard.templates.scheduleMeetingPreview'),
    content: t('dashboard.templates.scheduleMeetingContent'),
  },
  {
    key: 'update_status',
    title: t('dashboard.templates.updateStatus'),
    preview: t('dashboard.templates.updateStatusPreview'),
    content: t('dashboard.templates.updateStatusContent'),
  },
]);

// Computed properties
const allSelected = computed(
  () =>
    selectedApplicants.value.length === props.applications.length &&
    props.applications.length > 0
);

const canSend = computed(
  () =>
    selectedApplicants.value.length > 0 &&
    messageContent.value.trim().length > 0
);

// Methods
const toggleSelectAll = (checked) => {
  if (checked) {
    selectedApplicants.value = props.applications.map((app) => app.id);
  } else {
    selectedApplicants.value = [];
  }
};

const toggleApplicant = (applicantId, checked) => {
  if (checked) {
    selectedApplicants.value.push(applicantId);
  } else {
    selectedApplicants.value = selectedApplicants.value.filter(
      (id) => id !== applicantId
    );
  }
};

const selectTemplate = (template) => {
  messageContent.value = template.content;
};

const getApplicationStatusText = (status) => {
  switch (status) {
    case 'pending':
      return t('applicationStatus.pending');
    case 'selected':
      return t('applicationStatus.selected');
    case 'rejected':
      return t('applicationStatus.rejected');
    default:
      return status || t('applicationStatus.unknown');
  }
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'selected':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const sendMessages = async () => {
  if (!canSend.value) return;

  isSending.value = true;
  try {
    const selectedApplications = props.applications.filter((app) =>
      selectedApplicants.value.includes(app.id)
    );

    // Build the complete message
    let fullMessage = messageContent.value;

    if (includeJobDetails.value) {
      fullMessage += `\n\n--- ${t('dashboard.jobDetails')} ---\n`;
      fullMessage += `${props.job.service_name || props.job.category_name}\n`;
      fullMessage += `${props.job.location_text}\n`;
      fullMessage += `${t('dashboard.postedOn')}: ${formatDate(props.job.created_at)}`;
    }

    if (requestResponse.value) {
      fullMessage += `\n\n${t('dashboard.pleaseRespond')}`;
    }

    // Send messages to each selected applicant
    const messagePromises = selectedApplications.map(async (application) => {
      try {
        // Create or get existing chat room
        const roomId = await chatStore.createDirectChatRoom(
          application.contractor_id
        );

        // Send the message
        await chatStore.sendMessage(roomId, fullMessage);

        return { success: true, applicantId: application.id };
      } catch (error) {
        console.error(
          `Error sending message to applicant ${application.id}:`,
          error
        );
        return { success: false, applicantId: application.id, error };
      }
    });

    const results = await Promise.all(messagePromises);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      // Show success message
      console.log(`Successfully sent messages to ${successCount} applicants`);
    }

    if (failureCount > 0) {
      // Show error message
      console.error(`Failed to send messages to ${failureCount} applicants`);
    }

    emit('sent', { successCount, failureCount });
  } catch (error) {
    console.error('Error sending bulk messages:', error);
  } finally {
    isSending.value = false;
  }
};

// Initialize with all applicants selected
onMounted(() => {
  selectedApplicants.value = props.applications.map((app) => app.id);
});
</script>
