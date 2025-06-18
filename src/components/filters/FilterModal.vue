<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Filters</DialogTitle>
        <DialogDescription>
          Select your criteria to find the right contractor.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-1.5">
          <Label for="modal-filter-service">Service Needed</Label>
          <Select v-model="localSelectedService">
            <SelectTrigger id="modal-filter-service">
              <SelectValue placeholder="Any Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Service</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="painting">Painting</SelectItem>
              <!-- Add other categories -->
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1.5">
          <Label for="modal-filter-location">District (Lima)</Label>
          <Select v-model="localSelectedLocation">
            <SelectTrigger id="modal-filter-location">
              <SelectValue placeholder="Any District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any District</SelectItem>
              <SelectItem value="miraflores">Miraflores</SelectItem>
              <SelectItem value="san_isidro">San Isidro</SelectItem>
              <SelectItem value="surco">Surco</SelectItem>
              <!-- Add other districts -->
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1.5">
          <Label for="modal-filter-rating">Minimum Rating</Label>
          <Select v-model="localSelectedRating">
            <SelectTrigger id="modal-filter-rating">
              <SelectValue placeholder="Any Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Rating</SelectItem>
              <SelectItem value="4">4 Stars & Up</SelectItem>
              <SelectItem value="3">3 Stars & Up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          haptic-feedback="selection"
          @click="clearFilters"
          >Clear</Button
        >
        <DialogClose as-child>
          <Button haptic-feedback="success" @click="applyLocalFilters"
            >Apply Filters</Button
          >
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'; // Assuming these are installed/available
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  initialFilters: {
    type: Object,
    default: () => ({ service: 'any', location: 'any', rating: 'any' }),
  },
});

const emit = defineEmits(['update:isOpen', 'apply-filters', 'clear-filters']);

// Local state for filters within the modal
const localSelectedService = ref(props.initialFilters.service);
const localSelectedLocation = ref(props.initialFilters.location);
const localSelectedRating = ref(props.initialFilters.rating);

// Watch for prop changes to update local state if the modal is reopened
// with different initial values (e.g., after clearing)
watch(
  () => props.initialFilters,
  (newFilters) => {
    localSelectedService.value = newFilters.service;
    localSelectedLocation.value = newFilters.location;
    localSelectedRating.value = newFilters.rating;
  },
  { deep: true }
);

const handleOpenChange = (openState) => {
  emit('update:isOpen', openState);
  // Reset local state to initial props when closing without applying
  if (!openState) {
    localSelectedService.value = props.initialFilters.service;
    localSelectedLocation.value = props.initialFilters.location;
    localSelectedRating.value = props.initialFilters.rating;
  }
};

const applyLocalFilters = () => {
  emit('apply-filters', {
    service: localSelectedService.value,
    location: localSelectedLocation.value,
    rating: localSelectedRating.value,
  });
  // No need to manually close, DialogClose handles it
};

const clearFilters = () => {
  localSelectedService.value = 'any';
  localSelectedLocation.value = 'any';
  localSelectedRating.value = 'any';
  // Optionally emit clear immediately, or wait for apply
  // emit('clear-filters');
  // Or apply the cleared state
  applyLocalFilters();
  emit('update:isOpen', false); // Close after clearing and applying
};
</script>
