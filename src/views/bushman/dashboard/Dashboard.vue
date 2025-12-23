<script lang="ts" setup>
import SalesAnalytics from './SalesAnalytics.vue'
import WebTraffic from './WebTraffic.vue'
</script>

<template>
  <section class="dashboard-container">
    <!-- Analytics Sections -->
    <div class="analytics-grid">
      <!-- Quota Distribution -->
      <div class="analytics-item">
        <WebTraffic />
      </div>

      <!-- Quota Performance -->
      <div class="analytics-item">
        <SalesAnalytics />
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-container {
  padding: 0 0 20px 0;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.analytics-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 24px !important;
  height: 100%;
  box-sizing: border-box;
}

@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
