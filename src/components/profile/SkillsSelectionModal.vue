<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click="closeModal"
  >
    <div
      class="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="p-6 border-b border-border">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-foreground">
            Select Your Skills
          </h2>
          <button
            @click="closeModal"
            class="text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-sm text-muted-foreground mt-2">
          Choose the services you can provide. You can select multiple skills
          from different categories.
        </p>
      </div>

      <!-- Modal Content -->
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- Category Dropdown -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-2">
            Category
          </label>
          <select
            v-model="selectedCategory"
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name_en }}
            </option>
          </select>
        </div>

        <!-- Skills Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="service in filteredServices"
            :key="service.id"
            @click="toggleSkill(service.name_en)"
            class="p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-sm"
            :class="
              selectedSkills.includes(service.name_en)
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card hover:bg-muted'
            "
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-sm">{{ service.name_en }}</h3>
              </div>
              <div
                v-if="selectedSkills.includes(service.name_en)"
                class="text-primary ml-2 flex-shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredServices.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          <p>No services found in this category.</p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-6 border-t border-border bg-muted/30">
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            {{ selectedSkills.length }} skill{{
              selectedSkills.length !== 1 ? 's' : ''
            }}
            selected
          </div>
          <div class="flex gap-3">
            <Button variant="outline" @click="closeModal">Cancel</Button>
            <Button @click="saveSkills">Save Skills</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Button } from '@/components/ui/button';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  initialSkills: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'save']);

const selectedCategory = ref('home_repair');
const selectedSkills = ref([...props.initialSkills]);

// Categories data (from ServiceCategoriesView)
const categories = ref([
  {
    id: 'home_repair',
    name_en: 'Home Repairs',
    name_es: 'Reparaciones del Hogar',
  },
  {
    id: 'cleaning',
    name_en: 'Cleaning Services',
    name_es: 'Servicios de Limpieza',
  },
  {
    id: 'gardening',
    name_en: 'Gardening',
    name_es: 'Jardinería',
  },
  {
    id: 'personal_care',
    name_en: 'Personal Care',
    name_es: 'Cuidado Personal',
  },
  {
    id: 'lessons',
    name_en: 'Lessons & Tutoring',
    name_es: 'Clases y Tutorías',
  },
]);

// Services data (from ServiceCategoriesView)
const services = ref([
  // Home Repairs
  {
    id: 's1',
    categoryId: 'home_repair',
    name_en: 'Plumbing Fixes',
    summary_en: 'Leaky faucets, clogged drains.',
  },
  {
    id: 's2',
    categoryId: 'home_repair',
    name_en: 'Electrical Repairs',
    summary_en: 'Outlet issues, light fixture installation.',
  },
  {
    id: 's3',
    categoryId: 'home_repair',
    name_en: 'Painting (Interior)',
    summary_en: 'Room painting, touch-ups.',
  },
  {
    id: 's10',
    categoryId: 'home_repair',
    name_en: 'AC Repair',
    summary_en: 'Fixing AC units.',
  },
  {
    id: 's15',
    categoryId: 'home_repair',
    name_en: 'Locksmith',
    summary_en: 'Lockouts, key duplication.',
  },
  // Cleaning
  {
    id: 's4',
    categoryId: 'cleaning',
    name_en: 'Standard Home Cleaning',
    summary_en: 'Regular cleaning services.',
  },
  {
    id: 's5',
    categoryId: 'cleaning',
    name_en: 'Deep Cleaning',
    summary_en: 'Thorough cleaning service.',
  },
  {
    id: 's11',
    categoryId: 'cleaning',
    name_en: 'Window Cleaning',
    summary_en: 'Crystal clear windows.',
  },
  // Gardening
  {
    id: 's6',
    categoryId: 'gardening',
    name_en: 'Lawn Mowing',
    summary_en: 'Grass cutting and maintenance.',
  },
  {
    id: 's7',
    categoryId: 'gardening',
    name_en: 'Tree Trimming',
    summary_en: 'Pruning and tree care.',
  },
  {
    id: 's12',
    categoryId: 'gardening',
    name_en: 'Weed Removal',
    summary_en: 'Garden weed control.',
  },
  // Personal Care
  {
    id: 's8',
    categoryId: 'personal_care',
    name_en: 'Hair Styling',
    summary_en: 'Haircuts at your home.',
  },
  {
    id: 's13',
    categoryId: 'personal_care',
    name_en: 'Manicure',
    summary_en: 'Nail care services.',
  },
  // Lessons
  {
    id: 's9',
    categoryId: 'lessons',
    name_en: 'Math Tutoring',
    summary_en: 'Help with school math subjects.',
  },
  {
    id: 's14',
    categoryId: 'lessons',
    name_en: 'English Lessons',
    summary_en: 'Learn English.',
  },
]);

const filteredServices = computed(() => {
  return services.value.filter(
    (service) => service.categoryId === selectedCategory.value
  );
});

const toggleSkill = (skillName) => {
  const index = selectedSkills.value.indexOf(skillName);
  if (index > -1) {
    selectedSkills.value.splice(index, 1);
  } else {
    selectedSkills.value.push(skillName);
  }
};

const closeModal = () => {
  emit('close');
};

const saveSkills = () => {
  emit('save', selectedSkills.value);
  closeModal();
};

// Watch for prop changes to update selected skills
watch(
  () => props.initialSkills,
  (newSkills) => {
    selectedSkills.value = [...newSkills];
  },
  { deep: true }
);

// Reset selected skills when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      selectedSkills.value = [...props.initialSkills];
      selectedCategory.value = 'home_repair';
    }
  }
);
</script>
