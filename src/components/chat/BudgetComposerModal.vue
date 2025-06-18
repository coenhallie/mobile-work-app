<template>
  <Dialog :open="isOpen" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{
            counterProposal
              ? 'Counter Budget Proposal'
              : 'Create Budget Proposal'
          }}
        </DialogTitle>
        <DialogDescription>
          {{
            counterProposal
              ? 'Send a counter proposal with your preferred terms'
              : 'Send a budget proposal for the selected job'
          }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Job Information (Enhanced Display) -->
        <div
          class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
        >
          <Label
            class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 block"
            >Selected Job</Label
          >
          <div class="flex items-start gap-3">
            <!-- Job thumbnail -->
            <div
              class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-white dark:border-gray-700"
            >
              <img
                v-if="jobData?.image_url || jobImage"
                :src="jobData?.image_url || jobImage"
                :alt="jobData?.title || jobTitle"
                class="w-full h-full object-cover"
                @error="handleJobImageError"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-600 dark:text-blue-300"
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

            <!-- Job details -->
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-foreground text-sm leading-tight mb-1"
              >
                {{ jobData?.title || jobTitle }}
              </h3>
              <p
                class="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2"
              >
                {{ jobData?.description || 'No description available' }}
              </p>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {{ jobData?.category_name || 'General' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Proposal Type & Amount (Improved Layout) -->
        <div class="space-y-4">
          <div>
            <Label for="proposalType" class="text-sm font-medium"
              >Proposal Type</Label
            >
            <Select v-model="formData.type">
              <SelectTrigger class="h-10">
                <SelectValue placeholder="Select proposal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="range">Price Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Enhanced Amount Fields -->
          <div class="space-y-3">
            <Label class="text-sm font-medium"> Amount (Peruvian Soles) </Label>
            <div
              class="grid grid-cols-1 gap-3"
              :class="{ 'grid-cols-2': formData.type === 'range' }"
            >
              <div>
                <Label for="amountMin" class="text-xs text-muted-foreground">
                  {{ formData.type === 'range' ? 'Minimum Amount' : 'Amount' }}
                </Label>
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground"
                  >
                    S/
                  </span>
                  <Input
                    id="amountMin"
                    v-model.number="formData.amountMin"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                    class="pl-8 h-10 text-sm"
                  />
                </div>
              </div>
              <div v-if="formData.type === 'range'">
                <Label for="amountMax" class="text-xs text-muted-foreground"
                  >Maximum Amount</Label
                >
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground"
                  >
                    S/
                  </span>
                  <Input
                    id="amountMax"
                    v-model.number="formData.amountMax"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                    class="pl-8 h-10 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <Label for="notes" class="text-sm font-medium"
            >Notes (Optional)</Label
          >
          <Textarea
            id="notes"
            v-model="formData.notes"
            placeholder="Add any additional details about your proposal..."
            rows="3"
            class="mt-2 text-sm"
          />
        </div>

        <!-- Valid Until (Using DateTimePicker) -->
        <div>
          <Label for="validUntil" class="text-sm font-medium"
            >Valid Until (Optional)</Label
          >
          <div class="mt-2">
            <DateTimePicker v-model="formData.validUntil" />
          </div>
        </div>

        <DialogFooter class="gap-3">
          <Button
            type="button"
            variant="outline"
            @click="$emit('update:open', false)"
            class="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="flex-1"
          >
            <div
              v-if="isSubmitting"
              class="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"
            ></div>
            {{ isSubmitting ? 'Sending...' : 'Send Proposal' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DateTimePicker from '@/components/ui/DateTimePicker.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  jobId: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  jobData: {
    type: Object,
    default: null,
  },
  counterProposal: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:open', 'submit']);

const isSubmitting = ref(false);
const jobData = ref(null);

// Fetch job data when component mounts or jobId changes
const fetchJobData = async () => {
  if (!props.jobId) {
    console.log('[BudgetComposerModal] No jobId provided');
    return;
  }

  console.log('[BudgetComposerModal] Fetching job data for ID:', props.jobId);
  console.log('[BudgetComposerModal] Props received:', {
    jobId: props.jobId,
    jobTitle: props.jobTitle,
    jobData: props.jobData,
  });

  // DIAGNOSTIC: Log the exact state of job data props
  console.log('[BudgetComposerModal] DIAGNOSTIC - Job data analysis:', {
    hasJobData: !!props.jobData,
    jobDataKeys: props.jobData ? Object.keys(props.jobData) : null,
    jobDataContent: props.jobData,
    jobTitle: props.jobTitle,
    jobId: props.jobId,
  });

  // First, try to use the job data passed as prop (from job selection)
  if (props.jobData && props.jobData.id) {
    console.log(
      '[BudgetComposerModal] Using job data from props:',
      props.jobData
    );
    jobData.value = {
      id: props.jobData.id,
      title:
        props.jobData.title || props.jobData.category_name || props.jobTitle,
      description:
        props.jobData.description ||
        `Professional ${props.jobTitle.toLowerCase()} service with quality guarantee`,
      category_name:
        props.jobData.category_name || extractCategoryFromTitle(props.jobTitle),
      image_url: props.jobData.image_url || props.jobData.photos?.[0] || null,
    };
    console.log(
      '[BudgetComposerModal] Successfully set job data from props:',
      jobData.value
    );
    return;
  }

  // Fallback: fetch job data from database if not provided in props
  try {
    console.log(
      '[BudgetComposerModal] No job data in props, fetching from database...'
    );
    // Import job store dynamically to avoid circular dependencies
    const { useJobStore } = await import('@/stores/job.js');
    const jobStore = useJobStore();

    // Fetch real job data from Supabase
    console.log('[BudgetComposerModal] Calling jobStore.fetchJobById...');
    const fetchedJob = await jobStore.fetchJobById(props.jobId);

    console.log('[BudgetComposerModal] fetchJobById result:', fetchedJob);

    if (fetchedJob) {
      jobData.value = {
        id: fetchedJob.id,
        title: fetchedJob.category_name || props.jobTitle,
        description:
          fetchedJob.description ||
          `Professional ${props.jobTitle.toLowerCase()} service with quality guarantee`,
        category_name:
          fetchedJob.category_name || extractCategoryFromTitle(props.jobTitle),
        image_url: fetchedJob.photos?.[0] || null, // Use first photo if available
      };
      console.log(
        '[BudgetComposerModal] Successfully set job data from fetch:',
        jobData.value
      );
    } else {
      console.warn(
        '[BudgetComposerModal] No job data returned, using fallback'
      );
      // Fallback to mock data if fetch fails
      jobData.value = {
        id: props.jobId,
        title: props.jobTitle,
        description: `Professional ${props.jobTitle.toLowerCase()} service with quality guarantee`,
        category_name: extractCategoryFromTitle(props.jobTitle),
        image_url: null,
      };
      console.log(
        '[BudgetComposerModal] Fallback job data set:',
        jobData.value
      );
    }
  } catch (error) {
    console.error('[BudgetComposerModal] Failed to fetch job data:', error);
    // Fallback to mock data
    jobData.value = {
      id: props.jobId,
      title: props.jobTitle,
      description: `Professional ${props.jobTitle.toLowerCase()} service with quality guarantee`,
      category_name: extractCategoryFromTitle(props.jobTitle),
      image_url: null,
    };
    console.log(
      '[BudgetComposerModal] Error fallback job data set:',
      jobData.value
    );
  }
};

// Extract category from job title for better categorization
const extractCategoryFromTitle = (title) => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('plumb')) return 'Plumbing';
  if (titleLower.includes('electric')) return 'Electrical';
  if (titleLower.includes('clean')) return 'Cleaning';
  if (titleLower.includes('paint')) return 'Painting';
  if (titleLower.includes('carpen')) return 'Carpentry';
  if (titleLower.includes('lawn') || titleLower.includes('garden'))
    return 'Landscaping';
  if (titleLower.includes('repair')) return 'Repair';
  if (titleLower.includes('lock')) return 'Locksmith';
  if (titleLower.includes('furniture')) return 'Assembly';
  return 'General Services';
};

// Get job image with fallback
const jobImage = computed(() => {
  if (jobData.value?.image_url) return jobData.value.image_url;

  const title = (jobData.value?.title || props.jobTitle).toLowerCase();

  // Map common job categories to image names
  const categoryMap = {
    plumbing: 'plumbing',
    electrical: 'electrical',
    cleaning: 'home-cleaning',
    painting: 'painting',
    carpentry: 'carpentry',
    lawn: 'lawn-mowing',
    garden: 'lawn-mowing',
    repair: 'ac-repair',
    ac: 'ac-repair',
    'air conditioning': 'ac-repair',
    locksmith: 'locksmith',
    furniture: 'furniture-assembly',
    assembly: 'furniture-assembly',
  };

  // Find matching category
  for (const [keyword, imageName] of Object.entries(categoryMap)) {
    if (title.includes(keyword)) {
      return `/images/services/${imageName}.jpg`;
    }
  }

  return null;
});

// Handle job image loading errors
function handleJobImageError() {
  // Image failed to load, fallback will be used
}

const formData = ref({
  type: 'fixed',
  amountMin: null,
  amountMax: null,
  currency: 'PEN',
  notes: '',
  validUntil: null,
});

// Reset form when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchJobData();

      if (props.counterProposal) {
        // Pre-fill form with counter proposal data
        formData.value = {
          type: props.counterProposal.proposal_type || 'fixed',
          amountMin: props.counterProposal.amount_min || null,
          amountMax: props.counterProposal.amount_max || null,
          currency: props.counterProposal.currency || 'PEN',
          notes: '',
          validUntil: null,
        };
      } else {
        // Reset form for new proposal
        formData.value = {
          type: 'fixed',
          amountMin: null,
          amountMax: null,
          currency: 'PEN',
          notes: '',
          validUntil: null,
        };
      }
    }
  }
);

const isFormValid = computed(() => {
  if (!formData.value.amountMin || formData.value.amountMin <= 0) {
    return false;
  }

  if (formData.value.type === 'range') {
    if (!formData.value.amountMax || formData.value.amountMax <= 0) {
      return false;
    }
    if (formData.value.amountMax <= formData.value.amountMin) {
      return false;
    }
  }

  return true;
});

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const proposalData = {
      jobId: props.jobId,
      type: formData.value.type,
      amountMin: formData.value.amountMin,
      amountMax:
        formData.value.type === 'range' ? formData.value.amountMax : null,
      currency: formData.value.currency,
      notes: formData.value.notes.trim() || null,
      validUntil: formData.value.validUntil || null,
    };

    if (props.counterProposal) {
      // This is a counter proposal
      emit('submit', proposalData, props.counterProposal.id);
    } else {
      // This is a new proposal
      emit('submit', proposalData);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
