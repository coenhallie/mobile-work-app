<template>
  <div class="job-action-examples">
    <h2 class="text-2xl font-bold mb-6">Enhanced Job Action Button Examples</h2>

    <!-- Primary Actions Examples -->
    <section class="mb-8">
      <h3 class="text-lg font-semibold mb-4">
        Primary Actions (Large, Prominent)
      </h3>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <!-- Contractor - Start Job (Urgent) -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">Contractor - Start Job (Urgent)</h4>
          <JobActionButton
            :job="assignedJob"
            user-role="contractor"
            urgency-level="urgent"
            :show-secondary-actions="true"
          />
        </div>

        <!-- Client - Review Work (Urgent) -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">Client - Review Work (Urgent)</h4>
          <JobActionButton
            :job="completedJob"
            user-role="client"
            urgency-level="urgent"
            :show-secondary-actions="true"
          />
        </div>

        <!-- Contractor - Apply (High Priority) -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">Contractor - Apply (High Priority)</h4>
          <JobActionButton
            :job="openJob"
            user-role="contractor"
            urgency-level="high"
            :show-secondary-actions="true"
          />
        </div>
      </div>
    </section>

    <!-- Secondary Actions Examples -->
    <section class="mb-8">
      <h3 class="text-lg font-semibold mb-4">
        Secondary Actions (Medium Buttons)
      </h3>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- With Icon-Only Actions -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">With Icon-Only Secondary Actions</h4>
          <JobActionButton
            :job="inProgressJob"
            user-role="contractor"
            :show-secondary-actions="true"
            :max-secondary-actions="2"
          />
        </div>

        <!-- With Overflow Menu -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">With Overflow Menu</h4>
          <JobActionButton
            :job="openJobWithApplications"
            user-role="client"
            :show-secondary-actions="true"
            :show-tertiary-actions="true"
            :max-secondary-actions="1"
          />
        </div>
      </div>
    </section>

    <!-- Status Indicators -->
    <section class="mb-8">
      <h3 class="text-lg font-semibold mb-4">
        Status Indicators (Waiting States)
      </h3>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- Awaiting Review -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">Contractor - Awaiting Review</h4>
          <JobActionButton
            :job="completedJob"
            user-role="contractor"
            :show-secondary-actions="true"
          />
        </div>

        <!-- In Progress (Client View) -->
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">Client - Job In Progress</h4>
          <JobActionButton
            :job="inProgressJob"
            user-role="client"
            :show-secondary-actions="true"
          />
        </div>
      </div>
    </section>

    <!-- Mobile/Compact Mode -->
    <section class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Mobile/Compact Mode</h3>

      <div class="max-w-sm">
        <div class="p-4 border rounded-lg">
          <h4 class="font-medium mb-2">Compact Mode Example</h4>
          <JobActionButton
            :job="assignedJob"
            user-role="contractor"
            :compact-mode="true"
            :show-secondary-actions="true"
            urgency-level="urgent"
          />
        </div>
      </div>
    </section>

    <!-- Job Details View -->
    <section class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Job Details View (All Actions)</h3>

      <div class="p-4 border rounded-lg max-w-md">
        <h4 class="font-medium mb-2">Full Action Set</h4>
        <JobActionButton
          :job="openJobWithApplications"
          user-role="client"
          :is-job-details-view="true"
          :show-secondary-actions="true"
          :show-tertiary-actions="true"
          :max-secondary-actions="2"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import JobActionButton from './JobActionButton.vue';
import { JOB_STATUS } from '../../stores/job';

// Sample job data for examples
const openJob = ref({
  id: '1',
  title: 'Plumbing Repair',
  status: JOB_STATUS.OPEN,
  applicant_count: 0,
});

const openJobWithApplications = ref({
  id: '2',
  title: 'Kitchen Renovation',
  status: JOB_STATUS.OPEN,
  applicant_count: 5,
});

const assignedJob = ref({
  id: '3',
  title: 'Electrical Installation',
  status: JOB_STATUS.ASSIGNED,
  applicant_count: 3,
});

const inProgressJob = ref({
  id: '4',
  title: 'Bathroom Remodel',
  status: JOB_STATUS.IN_PROGRESS,
  applicant_count: 2,
});

const completedJob = ref({
  id: '5',
  title: 'Garden Landscaping',
  status: JOB_STATUS.COMPLETED,
  applicant_count: 4,
});

const inReviewJob = ref({
  id: '6',
  title: 'Roof Repair',
  status: JOB_STATUS.IN_REVIEW,
  applicant_count: 2,
});
</script>

<style scoped>
.job-action-examples {
  @apply p-6 max-w-6xl mx-auto;
}

.job-action-examples h2 {
  @apply text-gray-900 border-b border-gray-200 pb-2;
}

.job-action-examples h3 {
  @apply text-gray-800;
}

.job-action-examples h4 {
  @apply text-gray-700 text-sm;
}

.job-action-examples .grid > div {
  @apply bg-gray-50;
}
</style>
