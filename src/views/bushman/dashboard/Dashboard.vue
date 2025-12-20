<script lang="ts" setup>
import DataSection from './DataSection.vue'
import SalesAnalytics from './SalesAnalytics.vue'
import WebTraffic from './WebTraffic.vue'
</script>

<template>
  <section class="dashboard-container">
    <!-- Top Stats Section -->
    <div class="stats-section mb-4">
      <h5 class="section-title">Overview</h5>
      <DataSection />
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

.stats-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
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
  /* Use !important to ensure padding is preserved during CSS minification and layer processing */
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

  .section-title {
    font-size: 16px;
  }
}
</style>
