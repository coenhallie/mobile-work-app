<template>
  <div class="custom-switch" @click="toggle" :class="{ 'is-checked': checked }">
    <span class="switch-handle"></span>
  </div>
</template>

<script setup>
const props = defineProps({
  checked: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:checked']);

const toggle = () => {
  emit('update:checked', !props.checked);
};
</script>

<style scoped>
.custom-switch {
  width: 40px;
  height: 20px;
  background-color: #ccc;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;
}

.custom-switch.is-checked {
  background-color: #4a90e2; /* Example checked color */
}

.switch-handle {
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform 0.3s;
}

.custom-switch.is-checked .switch-handle {
  transform: translateX(20px);
}
</style>
