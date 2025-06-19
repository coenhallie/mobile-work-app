<template>
  <div class="space-y-6 py-4">
    <!-- Header -->
    <div class="text-center space-y-2">
      <h2 class="text-2xl font-bold text-gray-900">
        What type of work interests you most?
      </h2>
      <p class="text-gray-600">
        Choose your main area of expertise to see relevant jobs
      </p>
    </div>

    <!-- Skills Grid -->
    <div class="grid grid-cols-2 gap-3">
      <SkillCard
        v-for="skill in availableSkills"
        :key="skill.id"
        :skill="skill"
        :selected="selectedSkill === skill.id"
        @click="selectSkill(skill.id)"
      />
    </div>

    <!-- Reassurance Message -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center space-x-2">
        <svg
          class="w-5 h-5 text-blue-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-sm text-blue-700">
          ✨ You can add more skills later and expand your opportunities
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3 pt-4">
      <button
        @click="handleContinue"
        :disabled="!selectedSkill"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-none"
      >
        Continue
      </button>

      <button
        @click="handleNotSure"
        class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
      >
        I'm not sure yet
      </button>
    </div>

    <!-- Not Sure Modal -->
    <div
      v-if="showNotSureModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showNotSureModal = false"
    >
      <div class="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
        <div class="text-center space-y-4">
          <div
            class="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              No worries!
            </h3>
            <p class="text-gray-600 text-sm">
              We'll show you jobs from all categories so you can explore
              different opportunities.
            </p>
          </div>

          <div class="space-y-3">
            <button
              @click="selectGeneralSkill"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {{ $t('components.showMeAllJobs') }}
            </button>

            <button
              @click="showNotSureModal = false"
              class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
            >
              Let me choose a skill
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import SkillCard from './SkillCard.vue';

// Props
const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['skill-selected', 'continue']);

// Reactive state
const selectedSkill = ref('');
const showNotSureModal = ref(false);
const skillJobCounts = ref({});

// Available skills with job counts
const availableSkills = computed(() => [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: '🔧',
    description: 'Pipes, fixtures, repairs',
    jobCount: skillJobCounts.value.plumbing || 12,
    color: 'blue',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '⚡',
    description: 'Wiring, installations, repairs',
    jobCount: skillJobCounts.value.electrical || 8,
    color: 'yellow',
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: '🎨',
    description: 'Interior, exterior, touch-ups',
    jobCount: skillJobCounts.value.painting || 15,
    color: 'purple',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    icon: '🪚',
    description: 'Furniture, repairs, installations',
    jobCount: skillJobCounts.value.carpentry || 6,
    color: 'amber',
  },
  {
    id: 'gardening',
    name: 'Gardening',
    icon: '🌱',
    description: 'Landscaping, maintenance, planting',
    jobCount: skillJobCounts.value.gardening || 4,
    color: 'green',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: '🧽',
    description: 'Home, office, deep cleaning',
    jobCount: skillJobCounts.value.cleaning || 10,
    color: 'cyan',
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    icon: '🔨',
    description: 'Washing machines, fridges, ovens',
    jobCount: skillJobCounts.value.appliance || 7,
    color: 'red',
  },
  {
    id: 'general',
    name: 'General Services',
    icon: '🛠️',
    description: 'Handyman, various tasks',
    jobCount: skillJobCounts.value.general || 18,
    color: 'gray',
  },
]);

// Methods
const selectSkill = (skillId) => {
  selectedSkill.value = skillId;
};

const handleContinue = () => {
  if (selectedSkill.value) {
    emit('skill-selected', selectedSkill.value);
  }
};

const handleNotSure = () => {
  showNotSureModal.value = true;
};

const selectGeneralSkill = () => {
  selectedSkill.value = 'general';
  showNotSureModal.value = false;
  emit('skill-selected', 'general');
};

const fetchSkillJobCounts = async () => {
  if (!props.location) return;

  try {
    const { getSupabaseClient } = useAuth();
    const supabase = getSupabaseClient();

    // Fetch job counts by skill for the location
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select('category_name as service_type')
      .eq('status', 'open')
      .ilike('location_text', `%${props.location.name}%`);

    if (error) throw error;

    // Count jobs by service type
    const counts = {};
    (jobs || []).forEach((job) => {
      const serviceType = job.service_type || 'general';
      counts[serviceType] = (counts[serviceType] || 0) + 1;
    });

    skillJobCounts.value = counts;
  } catch (error) {
    console.error('Error fetching skill job counts:', error);
    // Use mock data for demo
    skillJobCounts.value = {
      plumbing: 12,
      electrical: 8,
      painting: 15,
      carpentry: 6,
      gardening: 4,
      cleaning: 10,
      appliance: 7,
      general: 18,
    };
  }
};

// Lifecycle
onMounted(() => {
  fetchSkillJobCounts();
});
</script>

<style scoped>
/* Ensure consistent spacing and transitions */
.transform {
  transition: transform 0.2s ease-in-out;
}

.disabled\:transform-none:disabled {
  transform: none !important;
}
</style>
