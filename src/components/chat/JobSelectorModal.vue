<template>
  <Dialog :open="isOpen" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ modalTitle }}</DialogTitle>
        <DialogDescription>
          {{ modalDescription }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"
        ></div>
      </div>

      <div v-else-if="error" class="text-center text-destructive py-4">
        <p>{{ error }}</p>
        <Button variant="outline" class="mt-2" @click="loadJobs">
          Try Again
        </Button>
      </div>

      <div
        v-else-if="jobs.length === 0"
        class="text-center text-muted-foreground py-8"
      >
        <p>No shared jobs found between you and this user.</p>
        <p class="text-xs mt-2">Debug: {{ debugInfo }}</p>
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
          :class="{
            'border-primary bg-primary/5': selectedJobId === job.id,
            'border-border': selectedJobId !== job.id,
          }"
          @click="selectedJobId = job.id"
        >
          <h4 class="font-medium">{{ job.title }}</h4>
          <p class="text-sm text-muted-foreground mt-1">Job ID: {{ job.id }}</p>
        </div>
      </div>

      <DialogFooter v-if="!isLoading && !error">
        <Button
          type="button"
          variant="outline"
          @click="$emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button type="button" :disabled="!selectedJobId" @click="handleSelect">
          Select Job
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

console.log('[JobSelectorModal] DIAGNOSTIC - Component script loaded');

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  otherUserId: {
    type: String,
    required: true,
  },
  fetchSharedJobs: {
    type: Function,
    required: true,
  },
  mode: {
    type: String,
    default: 'budget', // 'budget' or 'message'
  },
});

const emit = defineEmits(['update:open', 'job-selected']);

const jobs = ref([]);
const selectedJobId = ref(null);
const isLoading = ref(false);
const error = ref(null);
const debugInfo = ref('');

// Computed properties for modal content based on mode
const modalTitle = computed(() => {
  return props.mode === 'budget'
    ? 'Select Job for Budget Proposal'
    : 'Select Job Context';
});

const modalDescription = computed(() => {
  return props.mode === 'budget'
    ? "Choose which job you'd like to create a budget proposal for"
    : "Choose which job you'd like to discuss in your message";
});

// Load jobs when modal opens
watch(
  () => props.isOpen,
  async (isOpen) => {
    console.log('[JobSelectorModal] DIAGNOSTIC - Modal open state changed:', {
      isOpen,
      otherUserId: props.otherUserId,
      fetchSharedJobsExists: !!props.fetchSharedJobs,
    });

    if (isOpen) {
      selectedJobId.value = null;
      console.log(
        '[JobSelectorModal] DIAGNOSTIC - Modal opened, calling loadJobs'
      );
      await nextTick(); // Ensure DOM is ready
      await loadJobs();
    }
  }
);

async function loadJobs() {
  console.log('[JobSelectorModal] DIAGNOSTIC - loadJobs function called');

  if (!props.otherUserId) {
    console.error('[JobSelectorModal] DIAGNOSTIC - No otherUserId provided');
    error.value = 'No other user ID provided';
    debugInfo.value = 'Missing otherUserId';
    return;
  }

  if (!props.fetchSharedJobs) {
    console.error(
      '[JobSelectorModal] DIAGNOSTIC - No fetchSharedJobs function provided'
    );
    error.value = 'fetchSharedJobs function not provided';
    debugInfo.value = 'Missing fetchSharedJobs function';
    return;
  }

  console.log('[JobSelectorModal] DIAGNOSTIC - Starting loadJobs with:', {
    otherUserId: props.otherUserId,
    fetchSharedJobsType: typeof props.fetchSharedJobs,
    fetchSharedJobsExists: !!props.fetchSharedJobs,
  });

  isLoading.value = true;
  error.value = null;
  jobs.value = [];
  debugInfo.value = 'Loading...';

  try {
    console.log(
      '[JobSelectorModal] DIAGNOSTIC - About to call fetchSharedJobs'
    );

    const sharedJobs = await props.fetchSharedJobs(props.otherUserId);

    console.log('[JobSelectorModal] DIAGNOSTIC - fetchSharedJobs returned:', {
      sharedJobs,
      sharedJobsType: typeof sharedJobs,
      sharedJobsIsArray: Array.isArray(sharedJobs),
      sharedJobsLength: sharedJobs?.length,
    });

    // Ensure we have a valid array
    if (Array.isArray(sharedJobs)) {
      jobs.value = [...sharedJobs]; // Force reactivity
      debugInfo.value = `Found ${sharedJobs.length} jobs`;
      console.log('[JobSelectorModal] DIAGNOSTIC - Jobs successfully set:', {
        jobsCount: jobs.value.length,
        firstJob: jobs.value[0],
      });
    } else {
      jobs.value = [];
      debugInfo.value = 'Invalid data format received';
      console.warn(
        '[JobSelectorModal] DIAGNOSTIC - Invalid data format:',
        sharedJobs
      );
    }
  } catch (err) {
    console.error('[JobSelectorModal] DIAGNOSTIC - Error in loadJobs:', {
      error: err,
      errorMessage: err.message,
      errorStack: err.stack,
    });
    error.value = err.message || 'Failed to load shared jobs';
    jobs.value = [];
    debugInfo.value = `Error: ${err.message}`;
  } finally {
    isLoading.value = false;
    console.log('[JobSelectorModal] DIAGNOSTIC - loadJobs completed:', {
      isLoading: isLoading.value,
      error: error.value,
      jobsLength: jobs.value.length,
      debugInfo: debugInfo.value,
    });
  }
}

function handleSelect() {
  console.log('[JobSelectorModal] DIAGNOSTIC - handleSelect called:', {
    selectedJobId: selectedJobId.value,
    jobsCount: jobs.value.length,
  });

  if (!selectedJobId.value) return;

  const selectedJob = jobs.value.find((job) => job.id === selectedJobId.value);
  if (selectedJob) {
    console.log(
      '[JobSelectorModal] DIAGNOSTIC - Emitting job-selected:',
      selectedJob
    );
    emit('job-selected', selectedJob);
    emit('update:open', false);
  }
}

console.log('[JobSelectorModal] DIAGNOSTIC - Component setup completed');
</script>
