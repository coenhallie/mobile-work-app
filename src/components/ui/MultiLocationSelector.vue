<template>
  <div class="space-y-4">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-foreground">
      {{ label }}
    </label>

    <!-- Selected Locations Display -->
    <div v-if="selectedLocations.length > 0" class="space-y-2">
      <div class="text-sm text-muted-foreground">
        Selected locations ({{ selectedLocations.length }}):
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="location in selectedLocations"
          :key="location.id"
          class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
        >
          <span>{{ location.displayText }}</span>
          <button
            @click="removeLocation(location.id)"
            type="button"
            class="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            :aria-label="`Remove ${location.displayText}`"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Location Button -->
    <Button
      @click="openLocationModal"
      variant="outline"
      class="w-full"
      type="button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mr-2"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      {{
        selectedLocations.length === 0
          ? 'Select work locations'
          : 'Add another location'
      }}
    </Button>

    <!-- Location Selection Modal -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent
        class="sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Select Work Locations</DialogTitle>
          <DialogDescription>
            Choose the departments and districts where you want to work
          </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-hidden flex flex-col space-y-4">
          <!-- Step 1: Department Selection -->
          <div v-if="currentStep === 'department'" class="flex-1 flex flex-col">
            <div class="mb-4">
              <Input
                v-model="departmentSearch"
                placeholder="Search departments..."
                class="w-full"
              />
            </div>

            <div class="flex-1 overflow-y-auto space-y-2">
              <div
                v-for="department in filteredDepartments"
                :key="department"
                @click="selectDepartment(department)"
                class="p-3 border border-border rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <div class="font-medium">{{ department }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ getDepartmentDistrictCount(department) }} districts
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: District Selection -->
          <div v-if="currentStep === 'district'" class="flex-1 flex flex-col">
            <div class="mb-4 space-y-3">
              <div class="flex items-center gap-2">
                <Button
                  @click="goBackToDepartments"
                  variant="ghost"
                  size="sm"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-1"
                  >
                    <polyline points="15,18 9,12 15,6"></polyline>
                  </svg>
                  Back
                </Button>
                <div class="font-medium">{{ selectedDepartment }}</div>
              </div>

              <Input
                v-model="districtSearch"
                placeholder="Search districts and provinces..."
                class="w-full"
              />
            </div>

            <!-- Province Groups -->
            <div class="flex-1 overflow-y-auto space-y-4">
              <div
                v-for="province in filteredProvinces"
                :key="province.name"
                class="border border-border rounded-lg p-3"
              >
                <div class="font-medium text-sm text-muted-foreground mb-2">
                  {{ province.name }} Province
                </div>
                <div class="space-y-1">
                  <label
                    v-for="district in province.districts"
                    :key="district.id"
                    class="flex items-center gap-2 p-2 rounded hover:bg-primary/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :checked="isLocationSelected(district.id)"
                      @change="toggleLocation(district)"
                      class="rounded border-border"
                    />
                    <span class="text-sm">{{ district.district }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t border-border pt-3 mt-3 space-y-2">
              <div class="flex gap-2">
                <Button
                  @click="selectAllInDepartment"
                  variant="outline"
                  size="sm"
                  type="button"
                  class="flex-1"
                >
                  Select All in {{ selectedDepartment }}
                </Button>
                <Button
                  @click="clearDepartmentSelections"
                  variant="outline"
                  size="sm"
                  type="button"
                  class="flex-1"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="border-t border-border pt-4">
          <Button @click="closeModal" variant="outline" type="button">
            Cancel
          </Button>
          <Button @click="saveSelections" type="button">
            Save Selections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Error Display -->
    <div v-if="error" class="text-sm text-destructive">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'Work Locations',
  },
  error: {
    type: String,
    default: '',
  },
  maxSelections: {
    type: Number,
    default: 10,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

// State
const isModalOpen = ref(false);
const currentStep = ref('department'); // 'department' | 'district'
const selectedDepartment = ref('');
const departmentSearch = ref('');
const districtSearch = ref('');
const allLocations = ref([]);
const selectedLocations = ref([]);
const tempSelections = ref(new Set());
const isLoading = ref(true);
const fetchError = ref(null);

// Load Peru districts data
const loadLocations = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const { peruDistricts } = await import('@/data/peruDistricts.js');
    const locations = [];
    let uniqueIdCounter = 0;

    for (const department in peruDistricts) {
      for (const province in peruDistricts[department]) {
        peruDistricts[department][province].forEach((district) => {
          locations.push({
            id: `${district}-${province}-${department}-${uniqueIdCounter++}`,
            displayText: `${district}, ${province}, ${department}`,
            department,
            province,
            district,
          });
        });
      }
    }
    allLocations.value = locations;
  } catch (err) {
    console.error('Failed to load Peru districts data:', err);
    fetchError.value = err.message || 'Could not load location data.';
  } finally {
    isLoading.value = false;
  }
};

// Computed properties
const departments = computed(() => {
  const depts = new Set();
  allLocations.value.forEach((loc) => depts.add(loc.department));
  return Array.from(depts).sort();
});

const filteredDepartments = computed(() => {
  if (!departmentSearch.value) return departments.value;
  return departments.value.filter((dept) =>
    dept.toLowerCase().includes(departmentSearch.value.toLowerCase())
  );
});

const currentDepartmentLocations = computed(() => {
  return allLocations.value.filter(
    (loc) => loc.department === selectedDepartment.value
  );
});

const provincesInDepartment = computed(() => {
  const provinces = new Map();
  currentDepartmentLocations.value.forEach((loc) => {
    if (!provinces.has(loc.province)) {
      provinces.set(loc.province, []);
    }
    provinces.get(loc.province).push(loc);
  });

  return Array.from(provinces.entries())
    .map(([name, districts]) => ({
      name,
      districts: districts.sort((a, b) => a.district.localeCompare(b.district)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const filteredProvinces = computed(() => {
  if (!districtSearch.value) return provincesInDepartment.value;

  const searchTerm = districtSearch.value.toLowerCase();
  return provincesInDepartment.value
    .map((province) => ({
      ...province,
      districts: province.districts.filter(
        (district) =>
          district.district.toLowerCase().includes(searchTerm) ||
          district.province.toLowerCase().includes(searchTerm)
      ),
    }))
    .filter((province) => province.districts.length > 0);
});

// Methods
const getDepartmentDistrictCount = (department) => {
  return allLocations.value.filter((loc) => loc.department === department)
    .length;
};

const openLocationModal = () => {
  isModalOpen.value = true;
  currentStep.value = 'department';
  departmentSearch.value = '';
  districtSearch.value = '';
  // Initialize temp selections with current selections
  tempSelections.value = new Set(selectedLocations.value.map((loc) => loc.id));

  // Prevent body scroll
  nextTick(() => {
    document.body.style.overflow = 'hidden';
  });
};

const closeModal = () => {
  isModalOpen.value = false;
  currentStep.value = 'department';
  selectedDepartment.value = '';
  departmentSearch.value = '';
  districtSearch.value = '';
  // Reset temp selections
  tempSelections.value = new Set(selectedLocations.value.map((loc) => loc.id));

  // Restore body scroll
  document.body.style.overflow = '';
};

const selectDepartment = (department) => {
  selectedDepartment.value = department;
  currentStep.value = 'district';
  districtSearch.value = '';
};

const goBackToDepartments = () => {
  currentStep.value = 'department';
  selectedDepartment.value = '';
  districtSearch.value = '';
};

const isLocationSelected = (locationId) => {
  return tempSelections.value.has(locationId);
};

const toggleLocation = (location) => {
  if (tempSelections.value.has(location.id)) {
    tempSelections.value.delete(location.id);
  } else {
    if (tempSelections.value.size >= props.maxSelections) {
      // Could show a toast or alert here
      return;
    }
    tempSelections.value.add(location.id);
  }
};

const selectAllInDepartment = () => {
  // Select ALL districts in the department, regardless of maxSelections limit
  // This is a "Select All" operation which should override the normal limit
  currentDepartmentLocations.value.forEach((location) => {
    tempSelections.value.add(location.id);
  });
};

const clearDepartmentSelections = () => {
  currentDepartmentLocations.value.forEach((location) => {
    tempSelections.value.delete(location.id);
  });
};

const saveSelections = () => {
  // Convert temp selections to location objects
  const newSelections = allLocations.value.filter((loc) =>
    tempSelections.value.has(loc.id)
  );

  selectedLocations.value = newSelections;
  emit('update:modelValue', newSelections);
  emit('change', newSelections);
  closeModal();
};

const removeLocation = (locationId) => {
  selectedLocations.value = selectedLocations.value.filter(
    (loc) => loc.id !== locationId
  );
  emit('update:modelValue', selectedLocations.value);
  emit('change', selectedLocations.value);
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (Array.isArray(newValue)) {
      selectedLocations.value = [...newValue];
    }
  },
  { immediate: true, deep: true }
);

// Watch modal state for body scroll management
watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      document.body.style.overflow = 'hidden';
    });
  } else {
    document.body.style.overflow = '';
  }
});

// Initialize
onMounted(() => {
  loadLocations();
});

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style scoped>
/* Custom scrollbar for better mobile experience */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--border) / 0.8);
}
</style>
