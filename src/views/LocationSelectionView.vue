<template>
  <div class="flex flex-col h-full bg-background">
    <!-- Header with back button -->
    <div
      class="flex items-center justify-between p-4 border-b border-border bg-card"
    >
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="p-2 hover:bg-primary/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <div>
          <h1 class="text-lg font-semibold text-foreground">
            Select Work Areas
          </h1>
          <p class="text-sm text-muted-foreground">
            Choose where you want to work
          </p>
        </div>
      </div>
      <button
        @click="goBack"
        class="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
      >
        Cancel
      </button>
    </div>

    <!-- Selected locations summary -->
    <div
      v-if="selectedLocations.length > 0"
      class="p-4 bg-muted/30 border-b border-border"
    >
      <div class="text-sm text-muted-foreground mb-2">
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

    <!-- Main content area -->
    <div class="flex-1 overflow-hidden flex flex-col pb-32 md:pb-20">
      <!-- Step 1: Department Selection -->
      <div v-if="currentStep === 'department'" class="flex-1 flex flex-col p-4">
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
            class="p-4 border border-border rounded-lg cursor-pointer hover:bg-primary/5 transition-colors active:bg-primary/10"
          >
            <div class="font-medium">{{ department }}</div>
            <div class="text-sm text-muted-foreground">
              {{ getDepartmentDistrictCount(department) }} districts
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: District Selection -->
      <div v-if="currentStep === 'district'" class="flex-1 flex flex-col p-4">
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
        <div class="flex-1 overflow-y-auto space-y-3">
          <div
            v-for="province in filteredProvinces"
            :key="province.name"
            class="border border-border rounded-lg overflow-hidden"
          >
            <!-- Province Header with Select All -->
            <div class="bg-muted/30 p-3 border-b border-border">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="isProvinceFullySelected(province)"
                  :indeterminate="isProvincePartiallySelected(province)"
                  @change="toggleProvinceSelection(province)"
                  class="rounded border-border"
                  ref="provinceCheckboxes"
                />
                <div class="flex-1">
                  <div class="font-medium text-sm">
                    {{ province.name }} Province
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ getProvinceSelectionText(province) }}
                  </div>
                </div>
                <button
                  @click.stop="toggleProvinceExpansion(province.name)"
                  class="p-1 hover:bg-primary/10 rounded transition-colors"
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
                    :class="[
                      'transition-transform duration-200',
                      expandedProvinces.has(province.name) ? 'rotate-180' : '',
                    ]"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
              </label>
            </div>

            <!-- Districts List (Collapsible) -->
            <div
              v-show="expandedProvinces.has(province.name)"
              class="p-3 space-y-1 max-h-60 overflow-y-auto"
            >
              <label
                v-for="district in province.districts"
                :key="district.id"
                class="flex items-center gap-2 p-2 rounded hover:bg-primary/5 cursor-pointer active:bg-primary/10"
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
      </div>
    </div>

    <!-- Sticky bottom action bar -->
    <div
      class="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-[90]"
    >
      <div class="max-w-6xl mx-auto flex items-center gap-3">
        <!-- Select All / Unselect All button - only show when in district selection -->
        <Button
          v-if="currentStep === 'district'"
          @click="toggleSelectAllInDepartment"
          variant="outline"
          class="flex-1 font-semibold py-4 rounded-xl transition-all duration-200"
        >
          {{ isAllDepartmentSelected ? 'Unselect All' : 'Select All' }}
        </Button>
        <Button
          @click="saveAndReturn"
          :disabled="!hasSelections"
          class="flex-1 font-semibold py-4 rounded-xl transition-all duration-200"
        >
          Done
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"
        ></div>
        <p class="text-sm text-muted-foreground">Loading locations...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="fetchError" class="p-4 text-center">
      <p class="text-destructive text-sm mb-2">{{ fetchError }}</p>
      <Button @click="loadLocations" variant="outline" size="sm">
        Retry
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const router = useRouter();

// Props to receive initial selections
const props = defineProps({
  initialSelections: {
    type: Array,
    default: () => [],
  },
  maxSelections: {
    type: Number,
    default: 10,
  },
});

// State
const currentStep = ref('department'); // 'department' | 'district'
const selectedDepartment = ref('');
const departmentSearch = ref('');
const districtSearch = ref('');
const allLocations = ref([]);
const selectedLocations = ref([]);
const tempSelections = ref(new Set());
const isLoading = ref(true);
const fetchError = ref(null);
const expandedProvinces = ref(new Set());
const provinceCheckboxes = ref([]);

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

const hasSelections = computed(() => selectedLocations.value.length > 0);

const isAllDepartmentSelected = computed(() => {
  if (
    !selectedDepartment.value ||
    currentDepartmentLocations.value.length === 0
  ) {
    return false;
  }
  return currentDepartmentLocations.value.every((location) =>
    tempSelections.value.has(location.id)
  );
});

// Methods
const getDepartmentDistrictCount = (department) => {
  return allLocations.value.filter((loc) => loc.department === department)
    .length;
};

const selectDepartment = (department) => {
  selectedDepartment.value = department;
  currentStep.value = 'district';
  districtSearch.value = '';
  // Auto-expand all provinces initially
  expandedProvinces.value = new Set(
    provincesInDepartment.value.map((p) => p.name)
  );
};

const goBackToDepartments = () => {
  currentStep.value = 'department';
  selectedDepartment.value = '';
  districtSearch.value = '';
  expandedProvinces.value.clear();
};

const isLocationSelected = (locationId) => {
  return tempSelections.value.has(locationId);
};

const toggleLocation = (location) => {
  // Create a new Set to ensure reactivity
  const newSelections = new Set(tempSelections.value);

  if (newSelections.has(location.id)) {
    newSelections.delete(location.id);
  } else {
    if (newSelections.size >= props.maxSelections) {
      // Could show a toast or alert here
      return;
    }
    newSelections.add(location.id);
  }

  // Replace the entire Set to trigger reactivity
  tempSelections.value = newSelections;

  // Update selectedLocations immediately for UI feedback
  updateSelectedLocations();
  // Update province checkbox states
  updateProvinceCheckboxStates();
};

const selectAllInDepartment = () => {
  // Create a new Set to ensure reactivity
  const newSelections = new Set(tempSelections.value);

  // Select ALL districts in the department, regardless of maxSelections limit
  // This is a "Select All" operation which should override the normal limit
  currentDepartmentLocations.value.forEach((location) => {
    newSelections.add(location.id);
  });

  // Replace the entire Set to trigger reactivity
  tempSelections.value = newSelections;
  updateSelectedLocations();
  updateProvinceCheckboxStates();
};

const clearDepartmentSelections = () => {
  // Create a new Set to ensure reactivity
  const newSelections = new Set(tempSelections.value);

  currentDepartmentLocations.value.forEach((location) => {
    newSelections.delete(location.id);
  });

  // Replace the entire Set to trigger reactivity
  tempSelections.value = newSelections;
  updateSelectedLocations();
  updateProvinceCheckboxStates();
};

const toggleSelectAllInDepartment = () => {
  if (isAllDepartmentSelected.value) {
    clearDepartmentSelections();
  } else {
    selectAllInDepartment();
  }
};

const updateSelectedLocations = () => {
  selectedLocations.value = allLocations.value.filter((loc) =>
    tempSelections.value.has(loc.id)
  );
};

const removeLocation = (locationId) => {
  // Create a new Set to ensure reactivity
  const newSelections = new Set(tempSelections.value);
  newSelections.delete(locationId);

  // Replace the entire Set to trigger reactivity
  tempSelections.value = newSelections;
  updateSelectedLocations();
  updateProvinceCheckboxStates();
};

// Province-level selection methods
const isProvinceFullySelected = (province) => {
  return province.districts.every((district) =>
    tempSelections.value.has(district.id)
  );
};

const isProvincePartiallySelected = (province) => {
  const selectedCount = province.districts.filter((district) =>
    tempSelections.value.has(district.id)
  ).length;
  return selectedCount > 0 && selectedCount < province.districts.length;
};

const getProvinceSelectionText = (province) => {
  const selectedCount = province.districts.filter((district) =>
    tempSelections.value.has(district.id)
  ).length;
  const totalCount = province.districts.length;

  if (selectedCount === 0) {
    return `${totalCount} districts`;
  } else if (selectedCount === totalCount) {
    return `All ${totalCount} districts selected`;
  } else {
    return `${selectedCount} of ${totalCount} districts selected`;
  }
};

const toggleProvinceSelection = (province) => {
  const isFullySelected = isProvinceFullySelected(province);
  // Create a new Set to ensure reactivity
  const newSelections = new Set(tempSelections.value);

  province.districts.forEach((district) => {
    if (isFullySelected) {
      newSelections.delete(district.id);
    } else {
      // When selecting a province, add all districts regardless of maxSelections limit
      // This is a bulk selection operation which should override the normal limit
      newSelections.add(district.id);
    }
  });

  // Replace the entire Set to trigger reactivity
  tempSelections.value = newSelections;
  updateSelectedLocations();
  updateProvinceCheckboxStates();
};

const toggleProvinceExpansion = (provinceName) => {
  if (expandedProvinces.value.has(provinceName)) {
    expandedProvinces.value.delete(provinceName);
  } else {
    expandedProvinces.value.add(provinceName);
  }
};

const updateProvinceCheckboxStates = () => {
  nextTick(() => {
    if (provinceCheckboxes.value) {
      provinceCheckboxes.value.forEach((checkbox, index) => {
        if (checkbox && filteredProvinces.value[index]) {
          const province = filteredProvinces.value[index];
          checkbox.indeterminate = isProvincePartiallySelected(province);
        }
      });
    }
  });
};

const goBack = () => {
  router.back();
};

const saveAndReturn = () => {
  // Pass the selections back to the profile page
  const selections = allLocations.value.filter((loc) =>
    tempSelections.value.has(loc.id)
  );

  // Store in sessionStorage to pass data back
  sessionStorage.setItem('selectedLocations', JSON.stringify(selections));

  router.back();
};

// Initialize with any passed selections
const initializeSelections = () => {
  // Create a new Set to ensure reactivity
  const newSelections = new Set(tempSelections.value);

  // Check for current locations from sessionStorage
  const currentLocations = sessionStorage.getItem('currentLocations');
  if (currentLocations) {
    try {
      const locations = JSON.parse(currentLocations);
      locations.forEach((location) => {
        newSelections.add(location.id);
      });
      sessionStorage.removeItem('currentLocations');
    } catch (error) {
      console.error('Error parsing current locations:', error);
    }
  }

  // Fallback to props if available
  if (props.initialSelections && props.initialSelections.length > 0) {
    props.initialSelections.forEach((location) => {
      newSelections.add(location.id);
    });
  }

  // Replace the entire Set to trigger reactivity
  tempSelections.value = newSelections;
  updateSelectedLocations();
};

// Watch for changes in allLocations to initialize selections
watch(allLocations, () => {
  if (allLocations.value.length > 0) {
    initializeSelections();
    updateProvinceCheckboxStates();
  }
});

// Watch for changes in tempSelections to update checkbox states
watch(
  tempSelections,
  () => {
    updateProvinceCheckboxStates();
  },
  { deep: true }
);

// Initialize
onMounted(() => {
  loadLocations();
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

/* Touch-friendly active states */
@media (hover: none) and (pointer: coarse) {
  .cursor-pointer:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

/* Indeterminate checkbox styling */
input[type='checkbox']:indeterminate {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>
