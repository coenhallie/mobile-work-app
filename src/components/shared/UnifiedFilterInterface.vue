<template>
  <div :class="containerClasses">
    <!-- Mobile Filter Trigger -->
    <div v-if="isMobile" class="mobile-filter-trigger">
      <Button
        variant="outline"
        size="sm"
        @click="toggleMobileFilter"
        class="w-full flex items-center justify-center gap-2"
      >
        <Filter class="w-4 h-4" />
        {{ $t('filters.showFilters') }}
        <span
          v-if="activeFilterCount > 0"
          class="ml-1 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs"
        >
          {{ activeFilterCount }}
        </span>
      </Button>
    </div>

    <!-- Desktop Filters -->
    <div v-else class="desktop-filters space-y-6">
      <!-- Search -->
      <div v-if="showSearch" class="search-section">
        <Label class="text-sm font-medium mb-2 block">{{
          $t('filters.search')
        }}</Label>
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <Input
            v-model="localFilters.search"
            :placeholder="searchPlaceholder"
            class="pl-10"
            @input="handleFilterChange"
          />
        </div>
      </div>

      <!-- Dynamic Filter Sections -->
      <div
        v-for="section in filterSections"
        :key="section.key"
        class="filter-section"
      >
        <Label class="text-sm font-medium mb-3 block">{{
          section.label
        }}</Label>

        <!-- Chip-based filters -->
        <div v-if="section.type === 'chips'" class="flex flex-wrap gap-2">
          <FilterChip
            v-for="option in section.options"
            :key="option.value"
            :active="isOptionActive(section.key, option.value)"
            @click="toggleOption(section.key, option.value, section.multiple)"
          >
            <component
              v-if="option.icon"
              :is="option.icon"
              class="w-4 h-4 mr-1"
            />
            {{ option.label }}
          </FilterChip>
        </div>

        <!-- Range filters -->
        <div v-else-if="section.type === 'range'" class="space-y-3">
          <div class="flex items-center space-x-3">
            <Input
              v-model="localFilters[section.key + 'Min']"
              type="number"
              :placeholder="section.minPlaceholder"
              class="flex-1"
              @input="handleFilterChange"
            />
            <span class="text-gray-400">-</span>
            <Input
              v-model="localFilters[section.key + 'Max']"
              type="number"
              :placeholder="section.maxPlaceholder"
              class="flex-1"
              @input="handleFilterChange"
            />
          </div>
        </div>

        <!-- Select filters -->
        <div v-else-if="section.type === 'select'">
          <Select
            v-model="localFilters[section.key]"
            @update:model-value="handleFilterChange"
          >
            <SelectTrigger>
              <SelectValue :placeholder="section.placeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in section.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Clear Filters -->
      <div v-if="activeFilterCount > 0" class="clear-filters">
        <Button
          variant="ghost"
          size="sm"
          @click="clearAllFilters"
          class="text-gray-500 hover:text-gray-700"
        >
          <RotateCcw class="w-4 h-4 mr-1" />
          {{ $t('filters.clearAll') }}
        </Button>
      </div>
    </div>

    <!-- Mobile Filter Modal -->
    <BaseModal
      :is-open="showMobileFilter"
      :title="$t('filters.title')"
      size="full"
      position="bottom"
      @close="closeMobileFilter"
    >
      <template #content>
        <div class="space-y-6">
          <!-- Mobile filter content (same as desktop but in modal) -->
          <div
            v-for="section in filterSections"
            :key="section.key"
            class="filter-section"
          >
            <Label class="text-sm font-medium mb-3 block">{{
              section.label
            }}</Label>

            <!-- Same filter rendering logic as desktop -->
            <div v-if="section.type === 'chips'" class="flex flex-wrap gap-2">
              <FilterChip
                v-for="option in section.options"
                :key="option.value"
                :active="isOptionActive(section.key, option.value)"
                @click="
                  toggleOption(section.key, option.value, section.multiple)
                "
              >
                <component
                  v-if="option.icon"
                  :is="option.icon"
                  class="w-4 h-4 mr-1"
                />
                {{ option.label }}
              </FilterChip>
            </div>

            <div v-else-if="section.type === 'range'" class="space-y-3">
              <div class="flex items-center space-x-3">
                <Input
                  v-model="localFilters[section.key + 'Min']"
                  type="number"
                  :placeholder="section.minPlaceholder"
                  class="flex-1"
                  @input="handleFilterChange"
                />
                <span class="text-gray-400">-</span>
                <Input
                  v-model="localFilters[section.key + 'Max']"
                  type="number"
                  :placeholder="section.maxPlaceholder"
                  class="flex-1"
                  @input="handleFilterChange"
                />
              </div>
            </div>

            <div v-else-if="section.type === 'select'">
              <Select
                v-model="localFilters[section.key]"
                @update:model-value="handleFilterChange"
              >
                <SelectTrigger>
                  <SelectValue :placeholder="section.placeholder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in section.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <Button variant="outline" @click="clearAllFilters">
          {{ $t('filters.clearAll') }}
        </Button>
        <Button @click="applyMobileFilters">
          {{ $t('filters.apply') }}
        </Button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Filter, Search, RotateCcw } from 'lucide-vue-next';
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
import FilterChip from '@/components/filters/FilterChip.vue';
import BaseModal from './BaseModal.vue';

const { t } = useI18n();

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
  filterSections: {
    type: Array,
    required: true,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: '',
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'full',
    validator: (value) => ['full', 'minimal', 'compact'].includes(value),
  },
});

const emit = defineEmits(['filter-change', 'clear-filters']);

// State
const localFilters = ref({ ...props.filters });
const showMobileFilter = ref(false);

// Computed
const containerClasses = computed(() => {
  const variants = {
    full: 'unified-filter-interface',
    minimal: 'unified-filter-interface minimal',
    compact: 'unified-filter-interface compact',
  };
  return variants[props.variant];
});

const activeFilterCount = computed(() => {
  return Object.values(localFilters.value).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  }).length;
});

// Methods
const isOptionActive = (sectionKey, optionValue) => {
  const filterValue = localFilters.value[sectionKey];
  if (Array.isArray(filterValue)) {
    return filterValue.includes(optionValue);
  }
  return filterValue === optionValue;
};

const toggleOption = (sectionKey, optionValue, isMultiple) => {
  if (isMultiple) {
    const currentValue = localFilters.value[sectionKey] || [];
    if (currentValue.includes(optionValue)) {
      localFilters.value[sectionKey] = currentValue.filter(
        (v) => v !== optionValue
      );
    } else {
      localFilters.value[sectionKey] = [...currentValue, optionValue];
    }
  } else {
    localFilters.value[sectionKey] =
      localFilters.value[sectionKey] === optionValue ? null : optionValue;
  }
  handleFilterChange();
};

const handleFilterChange = () => {
  emit('filter-change', { ...localFilters.value });
};

const clearAllFilters = () => {
  localFilters.value = {};
  emit('clear-filters');
  emit('filter-change', {});
};

const toggleMobileFilter = () => {
  showMobileFilter.value = true;
};

const closeMobileFilter = () => {
  showMobileFilter.value = false;
};

const applyMobileFilters = () => {
  handleFilterChange();
  closeMobileFilter();
};

// Watch for external filter changes
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);
</script>

<style scoped>
.unified-filter-interface {
  @apply w-full;
}

.unified-filter-interface.minimal {
  @apply space-y-3;
}

.unified-filter-interface.compact {
  @apply space-y-2;
}

.filter-section {
  @apply space-y-2;
}

.mobile-filter-trigger {
  @apply w-full;
}

.desktop-filters {
  @apply space-y-4;
}

.clear-filters {
  @apply pt-2 border-t border-gray-200 dark:border-gray-700;
}
</style>
