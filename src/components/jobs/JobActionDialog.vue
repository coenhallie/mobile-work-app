<template>
  <Dialog :open="isOpen" @update:open="updateOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" haptic-feedback="selection" @click="cancel">
          {{ cancelText }}
        </Button>
        <Button
          :variant="confirmVariant"
          haptic-feedback="heavy"
          @click="confirm"
        >
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/composables/useHaptics';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    default: 'cancel',
    validator: (value) => ['cancel', 'remove'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '',
  },
  cancelText: {
    type: String,
    default: '',
  },
  confirmVariant: {
    type: String,
    default: 'destructive',
  },
});

const emit = defineEmits(['update:isOpen', 'confirm', 'cancel']);

// Initialize haptics for dialog actions
const { triggerWarning, triggerSelection } = useHaptics();

// Computed defaults based on type
const defaultTitles = {
  cancel: t('dialogs.confirmCancel.title'),
  remove: t('dialogs.confirmRemove.title'),
};

const defaultDescriptions = {
  cancel: t('dialogs.confirmCancel.description'),
  remove: t('dialogs.confirmRemove.description'),
};

const defaultConfirmTexts = {
  cancel: t('buttons.continue'),
  remove: t('buttons.remove'),
};

// Methods
const updateOpen = (value) => {
  emit('update:isOpen', value);
};

const confirm = async () => {
  // Trigger warning haptic for destructive actions
  await triggerWarning();
  emit('confirm', props.type);
  updateOpen(false);
};

const cancel = async () => {
  // Trigger selection haptic for cancel action
  await triggerSelection();
  emit('cancel');
  updateOpen(false);
};

// Use provided values or defaults based on type
const title = props.title || defaultTitles[props.type];
const description = props.description || defaultDescriptions[props.type];
const confirmText = props.confirmText || defaultConfirmTexts[props.type];
const cancelText = props.cancelText || t('buttons.cancel');
</script>
