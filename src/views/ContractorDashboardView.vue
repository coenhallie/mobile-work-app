<template>
  <div class="contractor-dashboard-view">
    <ContractorDashboard :user-id="userId" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';
import ContractorDashboard from '@/components/contractors/ContractorDashboard.vue';

const { user } = useSupabaseAuth();

const userId = computed(() => user.value?.id);
</script>

<style scoped>
.contractor-dashboard-view {
  min-height: 100vh;
}
</style>
