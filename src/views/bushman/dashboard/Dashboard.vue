<script lang="ts" setup>
import SalesAnalytics from './SalesAnalytics.vue'
import WebTraffic from './WebTraffic.vue'
import SalesSummary from './SalesSummary.vue'
</script>

<template>
  <section class="dashboard-container">
    <!-- Sales Summary Section -->
    <div class="summary-section">
      <SalesSummary />
    </div>

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

.summary-section {
  margin-bottom: 24px;
}

.summary-section :deep(.sales-summary) {
  gap: 20px;
}

.summary-section :deep(.summary-section),
.summary-section :deep(.species-section) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  padding: 12px !important;
  min-height: 200px;
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
