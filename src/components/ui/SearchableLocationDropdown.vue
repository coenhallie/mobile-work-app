<template>
  <div class="relative w-full" ref="dropdownRef">
    <Input
      :id="inputId"
      v-model="searchTerm"
      :placeholder="placeholder"
      @focus="handleFocus"
      @input="handleInput"
      @keydown.down.prevent="navigateDown"
      @keydown.up.prevent="navigateUp"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.esc="closeDropdown"
      :label="label"
      :error="error"
      autocomplete="off"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
    />

    <transition name="fade">
      <div
        v-if="isOpen && !isLoading && !fetchError"
        :id="listboxId"
        role="listbox"
        class="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
      >
        <!-- Using simple v-for for now, virtual scroller commented out -->
        <div
          v-if="filteredLocations.length > 0"
          class="scroller"
          style="max-height: 240px; overflow-y: auto"
        >
          <div
            v-for="(item, index) in filteredLocations"
            :key="item.id"
            @click="selectLocation(item)"
            @mouseenter="highlightedIndex = index"
            role="option"
            :aria-selected="highlightedIndex === index"
            :class="[
              'px-3 py-2 cursor-pointer hover:bg-primary/10',
              highlightedIndex === index ? 'bg-primary/10' : '',
              item.id === modelValue
                ? 'font-semibold text-primary'
                : 'text-foreground',
            ]"
            style="height: 40px; display: flex; align-items: center"
          >
            {{ item.displayText }}
          </div>
        </div>
        <div
          v-else-if="searchTerm && !filteredLocations.length"
          class="px-3 py-2 text-muted-foreground"
        >
          No locations found for "{{ searchTerm }}".
        </div>
        <div
          v-else-if="
            !searchTerm &&
            fallbackOptions.length > 0 &&
            !allLocations.length &&
            fetchError
          "
          class="px-3 py-2 text-muted-foreground"
        >
          <!-- Show fallback only if fetchError occurred and allLocations is empty -->
          Loading full list failed. Using fallback options.
          <div
            v-for="(fallback, fbIndex) in fallbackOptions"
            :key="`fallback-${fbIndex}`"
            @click="selectLocation(fallback)"
            @mouseenter="
              highlightedIndex =
                fbIndex +
                (filteredLocations.length > 0 ? filteredLocations.length : 0)
            "
            role="option"
            :aria-selected="
              highlightedIndex ===
              fbIndex +
                (filteredLocations.length > 0 ? filteredLocations.length : 0)
            "
            :class="[
              'px-3 py-2 cursor-pointer hover:bg-primary/10',
              highlightedIndex ===
              fbIndex +
                (filteredLocations.length > 0 ? filteredLocations.length : 0)
                ? 'bg-primary/10'
                : '',
              fallback.id === modelValue
                ? 'font-semibold text-primary'
                : 'text-foreground',
            ]"
          >
            {{ fallback.displayText }}
          </div>
        </div>
      </div>
    </transition>

    <div
      v-if="isLoading"
      class="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-3 text-center text-muted-foreground"
    >
      Loading locations...
    </div>
    <div
      v-if="fetchError && !allLocations.length"
      class="absolute z-10 w-full mt-1 bg-card border border-destructive rounded-md shadow-lg p-3 text-center text-destructive"
    >
      Error loading locations: {{ fetchError }}.
      <button @click="loadLocations" class="text-primary underline mt-1">
        Retry
      </button>
    </div>

    <button
      v-if="modelValue && clearable"
      @click.stop="clearSelection"
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
      aria-label="Clear selection"
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
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { onClickOutside } from '@vueuse/core';
import Fuse from 'fuse.js'; // Re-enabled Fuse.js
// import { RecycleScroller } from 'vue-virtual-scroller'; // Still commented out
// import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'; // Still commented out
import Input from './input/Input.vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Location' },
  placeholder: {
    type: String,
    default: 'Search district, province, or department...',
  },
  error: { type: String, default: '' },
  id: { type: String, required: false },
  clearable: { type: Boolean, default: true },
  fallbackOptions: {
    type: Array,
    default: () => [
      { id: 'Lima-Lima-Lima-0', displayText: 'Lima, Lima, Lima' },
      {
        id: 'Arequipa-Arequipa-Arequipa-1',
        displayText: 'Arequipa, Arequipa, Arequipa',
      },
      { id: 'Cusco-Cusco-Cusco-2', displayText: 'Cusco, Cusco, Cusco' },
    ],
  },
});

const emit = defineEmits(['update:modelValue', 'selectionChanged']);

const searchTerm = ref('');
const isOpen = ref(false);
const isLoading = ref(true);
const fetchError = ref(null);
const allLocations = ref([]);
const fuse = ref(null); // Re-enabled Fuse.js ref
const highlightedIndex = ref(-1);
const dropdownRef = ref(null);

const inputId = computed(
  () =>
    props.id ||
    `searchable-location-${Math.random().toString(36).substring(2, 9)}`
);
const listboxId = computed(() => `listbox-${inputId.value}`);

const loadLocations = async () => {
  // Re-enabled loadLocations
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
    if (allLocations.value.length > 0) {
      // Initialize Fuse with allLocations
      fuse.value = new Fuse(allLocations.value, {
        keys: ['district', 'province', 'department', 'displayText'],
        includeScore: true,
        threshold: 0.4,
      });
    } else {
      // Or with fallback if allLocations is empty (e.g. data file issue)
      fuse.value = new Fuse(props.fallbackOptions, {
        keys: ['displayText'],
        includeScore: true,
        threshold: 0.4,
      });
    }

    if (props.modelValue) {
      const selected = allLocations.value.find(
        (loc) => loc.id === props.modelValue
      );
      if (selected) {
        searchTerm.value = selected.displayText;
      }
    }
  } catch (err) {
    console.error('Failed to load Peru districts data:', err);
    fetchError.value = err.message || 'Could not load location data.';
    allLocations.value = [];
    // Initialize fuse with fallback options if main load fails
    fuse.value = new Fuse(props.fallbackOptions, {
      keys: ['displayText'],
      includeScore: true,
      threshold: 0.4,
    });
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadLocations(); // Re-enabled call
  onClickOutside(dropdownRef, () => closeDropdown());
});

const filteredLocations = computed(() => {
  // Restored Fuse.js logic
  if (!searchTerm.value && !props.modelValue && !isOpen.value) {
    // Show nothing if no search, no value, and not open
    return [];
  }
  if (!fuse.value) {
    // If fuse isn't initialized (e.g. error during load), use fallback with basic filter
    return props.fallbackOptions.filter((fb) =>
      searchTerm.value
        ? fb.displayText.toLowerCase().includes(searchTerm.value.toLowerCase())
        : true
    );
  }

  // If search term matches the currently selected display text and dropdown is open, show all options
  const currentSelectedLocation = allLocations.value.find(
    (loc) => loc.id === props.modelValue
  );
  if (
    currentSelectedLocation &&
    searchTerm.value === currentSelectedLocation.displayText &&
    isOpen.value
  ) {
    return allLocations.value.length > 0
      ? allLocations.value
      : props.fallbackOptions;
  }

  if (!searchTerm.value && isOpen.value) {
    // If search is empty but dropdown is open (e.g. on focus)
    return allLocations.value.length > 0
      ? allLocations.value
      : props.fallbackOptions;
  }

  if (!searchTerm.value) {
    // If no search term and not explicitly open for showing all, return empty
    return [];
  }

  const results = fuse.value.search(searchTerm.value);
  return results.map((result) => result.item);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const selectedLocation =
        allLocations.value.find((loc) => loc.id === newValue) ||
        props.fallbackOptions.find((loc) => loc.id === newValue);
      if (selectedLocation) {
        searchTerm.value = selectedLocation.displayText;
      } else if (!allLocations.value.length && !fetchError.value) {
        // If allLocations is empty (still loading or failed silently) and no error, don't clear search term yet
      } else {
        searchTerm.value = '';
      }
    } else {
      searchTerm.value = '';
    }
  },
  { immediate: true }
);

const handleFocus = () => {
  isOpen.value = true;
  highlightedIndex.value = -1;
  // Optional: if a value is selected and search term matches, clear search to show all
  // const currentSelectedLocation = allLocations.value.find(loc => loc.id === props.modelValue);
  // if (currentSelectedLocation && searchTerm.value === currentSelectedLocation.displayText) {
  //   searchTerm.value = '';
  // }
};

const handleInput = () => {
  isOpen.value = true;
  highlightedIndex.value = -1;
};

const closeDropdown = () => {
  isOpen.value = false;
  highlightedIndex.value = -1;
  const selected =
    allLocations.value.find((loc) => loc.id === props.modelValue) ||
    props.fallbackOptions.find((loc) => loc.id === props.modelValue);
  if (selected) {
    searchTerm.value = selected.displayText;
  } else if (searchTerm.value && !props.modelValue) {
    // If there was a search term but nothing selected
    // searchTerm.value = ''; // Option to clear search term if nothing was selected
  }
};

const selectLocation = (location) => {
  if (location) {
    searchTerm.value = location.displayText;
    emit('update:modelValue', location.id);
    emit('selectionChanged', location);
  }
  closeDropdown();
};

const clearSelection = () => {
  searchTerm.value = '';
  emit('update:modelValue', '');
  emit('selectionChanged', null);
  isOpen.value = false;
  nextTick(() => {
    document.getElementById(inputId.value)?.focus();
  });
};

const navigateDown = () => {
  if (!isOpen.value) isOpen.value = true;
  if (filteredLocations.value.length > 0) {
    highlightedIndex.value =
      (highlightedIndex.value + 1) % filteredLocations.value.length;
    scrollToHighlighted();
  }
};

const navigateUp = () => {
  if (!isOpen.value) isOpen.value = true;
  if (filteredLocations.value.length > 0) {
    highlightedIndex.value =
      (highlightedIndex.value - 1 + filteredLocations.value.length) %
      filteredLocations.value.length;
    scrollToHighlighted();
  }
};

const selectHighlighted = () => {
  if (
    isOpen.value &&
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < filteredLocations.value.length
  ) {
    selectLocation(filteredLocations.value[highlightedIndex.value]);
  } else if (isOpen.value && filteredLocations.value.length === 1) {
    selectLocation(filteredLocations.value[0]);
  }
};

const scrollToHighlighted = () => {
  const listElement = document.getElementById(listboxId.value);
  const itemsContainer = listElement?.children[0];
  const itemElement = itemsContainer?.children[highlightedIndex.value];
  itemElement?.scrollIntoView({ block: 'nearest' });
};
</script>

<style scoped>
.scroller {
  /* height: 240px; // Not needed if max-height is on parent */
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
