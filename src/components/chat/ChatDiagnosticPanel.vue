<template>
  <div class="chat-diagnostic-panel">
    <!-- Diagnostic Toggle Button -->
    <Button
      v-if="!showDiagnostics"
      @click="showDiagnostics = true"
      variant="outline"
      size="sm"
      class="fixed bottom-20 right-4 z-50 bg-blue-500 text-white hover:bg-blue-600"
    >
      🔍 Diagnostics
    </Button>

    <!-- Diagnostic Panel -->
    <div
      v-if="showDiagnostics"
      class="fixed bottom-20 right-4 w-96 max-h-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Real-time Diagnostics
        </h3>
        <Button
          @click="showDiagnostics = false"
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      <!-- Content -->
      <div class="p-3 overflow-y-auto max-h-80">
        <!-- Connection Status -->
        <div class="mb-4">
          <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connection Status
          </h4>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span>Status:</span>
              <span
                :class="{
                  'text-green-600': connectionStatus.status === 'connected',
                  'text-yellow-600': connectionStatus.status === 'connecting',
                  'text-red-600': connectionStatus.status === 'error',
                  'text-gray-600': connectionStatus.status === 'disconnected',
                }"
              >
                {{ connectionStatus.status }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Authenticated:</span>
              <span
                :class="
                  connectionStatus.isAuthenticated
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{ connectionStatus.isAuthenticated ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Active Connections:</span>
              <span>{{ connectionStatus.activeConnections }}</span>
            </div>
            <div
              v-if="connectionStatus.lastError"
              class="text-red-600 text-xs mt-1"
            >
              Error: {{ connectionStatus.lastError }}
            </div>
          </div>
        </div>

        <!-- Reactivity Diagnostics -->
        <div class="mb-4">
          <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reactivity Status
          </h4>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span>Total Issues:</span>
              <span
                :class="
                  reactivityDiagnostics.summary.totalIssues > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                "
              >
                {{ reactivityDiagnostics.summary.totalIssues }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Recent Issues:</span>
              <span
                :class="
                  reactivityDiagnostics.summary.recentIssues > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                "
              >
                {{ reactivityDiagnostics.summary.recentIssues }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Queue Length:</span>
              <span>{{ reactivityDiagnostics.queueLength }}</span>
            </div>
          </div>
        </div>

        <!-- Active Subscriptions -->
        <div class="mb-4">
          <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Subscriptions
          </h4>
          <div
            v-if="connectionStatus.connections.length === 0"
            class="text-xs text-gray-500"
          >
            No active subscriptions
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="conn in connectionStatus.connections"
              :key="conn.id"
              class="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <div class="flex justify-between">
                <span class="font-medium">{{ conn.id }}</span>
                <span
                  :class="{
                    'text-green-600': conn.status === 'SUBSCRIBED',
                    'text-yellow-600': conn.status === 'connecting',
                    'text-red-600': conn.status === 'error',
                  }"
                >
                  {{ conn.status }}
                </span>
              </div>
              <div v-if="conn.lastError" class="text-red-600 mt-1">
                {{ conn.lastError }}
              </div>
              <div class="text-gray-500 mt-1">
                Retries: {{ conn.retryAttempts }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2">
          <Button
            @click="runFullDiagnosis"
            :disabled="isRunningDiagnosis"
            variant="outline"
            size="sm"
            class="w-full"
          >
            {{ isRunningDiagnosis ? 'Running...' : 'Run Full Diagnosis' }}
          </Button>

          <Button
            @click="testReactivity"
            :disabled="isTestingReactivity"
            variant="outline"
            size="sm"
            class="w-full"
          >
            {{ isTestingReactivity ? 'Testing...' : 'Test Reactivity' }}
          </Button>

          <Button
            @click="forceReconnect"
            :disabled="isReconnecting"
            variant="outline"
            size="sm"
            class="w-full"
          >
            {{ isReconnecting ? 'Reconnecting...' : 'Force Reconnect' }}
          </Button>

          <Button
            @click="exportDiagnostics"
            variant="outline"
            size="sm"
            class="w-full"
          >
            Export Diagnostics
          </Button>
        </div>

        <!-- Recent Logs -->
        <div class="mt-4">
          <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Logs ({{ recentLogs.length }})
          </h4>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="(log, index) in recentLogs.slice(-10)"
              :key="index"
              class="text-xs p-1 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <div class="flex justify-between">
                <span class="font-mono text-gray-500">
                  {{ formatTime(log.timestamp) }}
                </span>
                <span
                  :class="{
                    'text-red-600': log.level === 'error',
                    'text-yellow-600': log.level === 'warn',
                    'text-blue-600': log.level === 'info',
                  }"
                >
                  {{ log.level }}
                </span>
              </div>
              <div class="mt-1">{{ log.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Button } from '@/components/ui/button';
import realtimeConnectionManager from '@/lib/realtimeConnectionManager';
import { getReactivityDiagnostics } from '@/lib/chatReactivityFix';

const showDiagnostics = ref(false);
const isRunningDiagnosis = ref(false);
const isTestingReactivity = ref(false);
const isReconnecting = ref(false);
const recentLogs = ref([]);

// Get connection status
const connectionStatus = computed(() =>
  realtimeConnectionManager.getConnectionStatus()
);

// Get reactivity diagnostics
const reactivityDiagnostics = computed(() => getReactivityDiagnostics());

// Log interceptor
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function interceptLogs() {
  console.log = (...args) => {
    addLog('info', args.join(' '));
    originalConsoleLog.apply(console, args);
  };

  console.error = (...args) => {
    addLog('error', args.join(' '));
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    addLog('warn', args.join(' '));
    originalConsoleWarn.apply(console, args);
  };
}

function restoreLogs() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}

function addLog(level, message) {
  // Only capture chat-related logs
  if (
    message.includes('[Chat') ||
    message.includes('real-time') ||
    message.includes('WebSocket')
  ) {
    recentLogs.value.push({
      timestamp: new Date(),
      level,
      message: message.substring(0, 100), // Truncate long messages
    });

    // Keep only last 50 logs
    if (recentLogs.value.length > 50) {
      recentLogs.value = recentLogs.value.slice(-50);
    }
  }
}

function formatTime(timestamp) {
  return timestamp.toLocaleTimeString();
}

async function runFullDiagnosis() {
  isRunningDiagnosis.value = true;

  try {
    console.log('🔍 Starting comprehensive real-time diagnosis...');

    // Test connection health
    const healthResult = await realtimeConnectionManager.testConnection();
    console.log('Connection health test result:', healthResult);

    // Get detailed status
    const status = realtimeConnectionManager.getConnectionStatus();
    console.log('Connection manager status:', status);

    // Test reactivity
    const reactivityStatus = getReactivityDiagnostics();
    console.log('Reactivity diagnostics:', reactivityStatus);

    console.log('✅ Diagnosis completed successfully');
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    isRunningDiagnosis.value = false;
  }
}

async function testReactivity() {
  isTestingReactivity.value = true;

  try {
    console.log('🧪 Testing reactivity system...');

    // This would need to be implemented in the reactivity manager
    // For now, just log the current state
    const diagnostics = getReactivityDiagnostics();
    console.log('Reactivity test result:', diagnostics);

    console.log('✅ Reactivity test completed');
  } catch (error) {
    console.error('❌ Reactivity test failed:', error);
  } finally {
    isTestingReactivity.value = false;
  }
}

async function forceReconnect() {
  isReconnecting.value = true;

  try {
    console.log('🔄 Force reconnecting...');
    await realtimeConnectionManager.forceReconnect();
    console.log('✅ Force reconnect completed');
  } catch (error) {
    console.error('❌ Force reconnect failed:', error);
  } finally {
    isReconnecting.value = false;
  }
}

function exportDiagnostics() {
  const diagnosticsData = {
    timestamp: new Date().toISOString(),
    connectionStatus: connectionStatus.value,
    reactivityDiagnostics: reactivityDiagnostics.value,
    recentLogs: recentLogs.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-diagnostics-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('📄 Diagnostics exported successfully');
}

onMounted(() => {
  interceptLogs();
});

onUnmounted(() => {
  restoreLogs();
});
</script>

<style scoped>
.chat-diagnostic-panel {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
