<template>
  <div class="earnings-chart-container">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-foreground mb-2">
        {{ $t('dashboard.earningsOverview') }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ $t('dashboard.monthlyEarningsDescription') }}
      </p>
    </div>

    <div class="chart-wrapper bg-card p-6 rounded-lg border border-border">
      <canvas ref="chartCanvas" class="w-full h-64"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useI18n } from '../../composables/useI18n';

// Register Chart.js components
Chart.register(...registerables);

const { t } = useI18n();

const props = defineProps({
  earningsData: {
    type: Array,
    default: () => [],
  },
});

const chartCanvas = ref(null);
let chartInstance = null;

// Generate dummy earnings data for the past 6 months
const generateDummyData = () => {
  const months = [];
  const earnings = [];
  const currentDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    months.push(
      date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    );

    // Generate realistic earnings data (between S/1800-S/9000 per month)
    const baseEarning = 2800 + Math.random() * 4200;
    const monthlyEarning = Math.round(baseEarning / 100) * 100; // Round to nearest 100
    earnings.push(monthlyEarning);
  }

  return { months, earnings };
};

const createChart = () => {
  if (!chartCanvas.value) return;

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  const { months, earnings } = generateDummyData();

  const ctx = chartCanvas.value.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: t('dashboard.monthlyEarnings'),
          data: earnings,
          borderColor: 'rgb(139, 69, 19)', // Primary color
          backgroundColor: 'rgba(139, 69, 19, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(139, 69, 19)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(139, 69, 19)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `${t('dashboard.earnings')}: ${t('common.currency')}${context.parsed.y.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'rgb(107, 114, 128)', // muted-foreground color
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
            callback: function (value) {
              return t('common.currency') + value.toLocaleString();
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      elements: {
        point: {
          hoverBackgroundColor: 'rgb(139, 69, 19)',
        },
      },
    },
  });
};

// Watch for theme changes and update chart colors
const updateChartColors = () => {
  if (!chartInstance) return;

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)';
  const gridColor = isDark
    ? 'rgba(156, 163, 175, 0.1)'
    : 'rgba(107, 114, 128, 0.1)';

  chartInstance.options.scales.x.ticks.color = textColor;
  chartInstance.options.scales.y.ticks.color = textColor;
  chartInstance.options.scales.y.grid.color = gridColor;

  chartInstance.update('none');
};

onMounted(() => {
  // Small delay to ensure canvas is properly rendered
  setTimeout(() => {
    createChart();
  }, 100);

  // Watch for theme changes
  const observer = new MutationObserver(() => {
    updateChartColors();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});

// Watch for data changes
watch(
  () => props.earningsData,
  () => {
    createChart();
  },
  { deep: true }
);
</script>

<style scoped>
.earnings-chart-container {
  width: 100%;
}

.chart-wrapper {
  position: relative;
  height: 300px;
}

canvas {
  max-height: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chart-wrapper {
    height: 250px;
  }
}
</style>
