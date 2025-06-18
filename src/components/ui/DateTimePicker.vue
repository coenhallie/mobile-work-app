<template>
  <div class="relative">
    <!-- Date/Time Display Button -->
    <button
      type="button"
      @click="openCalendar"
      class="w-full flex items-center justify-between px-4 py-3 bg-card border-2 border-muted-foreground/25 rounded-xl hover:bg-muted/30 focus:bg-background focus:border-primary/50 transition-all duration-200 text-left"
      :class="{
        'text-muted-foreground': !selectedDateTime,
        'text-foreground': selectedDateTime,
      }"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-orange-600 dark:text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <div
            class="font-medium text-sm text-muted-foreground uppercase tracking-wide"
          >
            DATE
          </div>
          <div class="text-base">
            {{
              selectedDateTime
                ? formatDisplayDate(selectedDateTime)
                : 'Choose Date'
            }}
          </div>
        </div>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Calendar Modal -->
    <div
      v-if="showCalendar"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="closeCalendar"
    >
      <div
        class="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full"
        @click.stop
      >
        <!-- Calendar Header -->
        <div
          class="flex items-center justify-between p-4 border-b border-border"
        >
          <button
            type="button"
            @click="previousMonth"
            class="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3 class="text-lg font-semibold">
            {{ formatMonthYear(currentMonth) }}
          </h3>
          <button
            type="button"
            @click="nextMonth"
            class="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <!-- Calendar Grid -->
        <div class="p-4">
          <!-- Day Headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div
              v-for="day in dayHeaders"
              :key="day"
              class="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {{ day }}
            </div>
          </div>

          <!-- Calendar Days -->
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="date in calendarDays"
              :key="date.key"
              type="button"
              @click="selectDate(date)"
              :disabled="date.disabled"
              class="aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-200"
              :class="{
                'text-muted-foreground': date.isOtherMonth,
                'text-foreground hover:bg-muted':
                  !date.isOtherMonth && !date.isSelected && !date.disabled,
                'bg-primary text-primary-foreground': date.isSelected,
                'opacity-50 cursor-not-allowed': date.disabled,
                'bg-primary/10 text-primary': date.isToday && !date.isSelected,
              }"
            >
              {{ date.day }}
            </button>
          </div>
        </div>

        <!-- Time Selection (shown after date is selected) -->
        <div
          v-if="selectedDate && showTimeSelection"
          class="border-t border-border p-4"
        >
          <h4 class="text-sm font-medium mb-3">Select Time</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground">Hour</label>
              <select
                v-model="selectedHour"
                class="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
              >
                <option v-for="hour in hours" :key="hour" :value="hour">
                  {{ hour.toString().padStart(2, '0') }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground">Minute</label>
              <select
                v-model="selectedMinute"
                class="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
              >
                <option v-for="minute in minutes" :key="minute" :value="minute">
                  {{ minute.toString().padStart(2, '0') }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 p-4 border-t border-border">
          <button
            type="button"
            @click="closeCalendar"
            class="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="applyDateTime"
            :disabled="!selectedDate"
            class="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

// State
const showCalendar = ref(false);
const showTimeSelection = ref(false);
const currentMonth = ref(new Date());
const selectedDate = ref(null);
const selectedHour = ref(9);
const selectedMinute = ref(0);

// Computed
const selectedDateTime = computed(() => props.modelValue);

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hours = computed(() => Array.from({ length: 24 }, (_, i) => i));
const minutes = computed(() => Array.from({ length: 12 }, (_, i) => i * 5));

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const isOtherMonth = date.getMonth() !== month;
    const isToday = date.toDateString() === today.toDateString();
    const isSelected =
      selectedDate.value &&
      date.toDateString() === selectedDate.value.toDateString();
    const isPast = date < today && !isToday;

    days.push({
      key: date.toISOString(),
      day: date.getDate(),
      date: new Date(date),
      isOtherMonth,
      isToday,
      isSelected,
      disabled: isPast,
    });
  }

  return days;
});

// Methods
const openCalendar = () => {
  showCalendar.value = true;
  showTimeSelection.value = false;

  // Initialize current month based on existing value or today
  if (selectedDateTime.value) {
    const existing = new Date(selectedDateTime.value);
    currentMonth.value = new Date(
      existing.getFullYear(),
      existing.getMonth(),
      1
    );
    selectedDate.value = existing;
    selectedHour.value = existing.getHours();
    selectedMinute.value = existing.getMinutes();
  } else {
    currentMonth.value = new Date();
    selectedDate.value = null;
  }
};

const closeCalendar = () => {
  showCalendar.value = false;
  showTimeSelection.value = false;
};

const previousMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  );
};

const selectDate = (dateObj) => {
  if (dateObj.disabled) return;

  selectedDate.value = dateObj.date;
  showTimeSelection.value = true;
};

const applyDateTime = () => {
  if (!selectedDate.value) return;

  const dateTime = new Date(selectedDate.value);
  dateTime.setHours(selectedHour.value, selectedMinute.value, 0, 0);

  // Format as datetime-local string
  const formatted = dateTime.toISOString().slice(0, 16);
  emit('update:modelValue', formatted);

  closeCalendar();
};

const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatDisplayDate = (dateTimeString) => {
  if (!dateTimeString) return 'Choose Date';

  const date = new Date(dateTimeString);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
};

// Initialize from existing value
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !selectedDate.value) {
      const date = new Date(newValue);
      selectedDate.value = date;
      selectedHour.value = date.getHours();
      selectedMinute.value = date.getMinutes();
    }
  },
  { immediate: true }
);
</script>
