<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-4xl max-h-[90vh] p-0">
      <div class="relative">
        <img
          :src="imageUrl"
          :alt="alt || 'Image'"
          class="w-full h-auto max-h-[80vh] object-contain"
          @load="handleImageLoad"
          @error="handleImageError"
        />

        <!-- Close Button -->
        <Button
          variant="ghost"
          size="sm"
          class="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
          @click="$emit('close')"
        >
          <X class="w-4 h-4" />
        </Button>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center bg-black/50"
        >
          <div
            class="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"
          ></div>
        </div>

        <!-- Error State -->
        <div
          v-if="hasError"
          class="absolute inset-0 flex items-center justify-center bg-black/50 text-white"
        >
          <div class="text-center">
            <AlertCircle class="w-12 h-12 mx-auto mb-2" />
            <p>Failed to load image</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const isLoading = ref(true);
const hasError = ref(false);

const handleImageLoad = () => {
  isLoading.value = false;
  hasError.value = false;
};

const handleImageError = () => {
  isLoading.value = false;
  hasError.value = true;
};
</script>
