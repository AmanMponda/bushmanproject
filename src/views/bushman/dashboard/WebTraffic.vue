<template>
  <div class="web-traffic">
    <div class="analytics-header">
      <div>
        <h6 class="analytics-title">Quota Distribution</h6>
        <p class="analytics-subtitle">Quota allocation by category</p>
      </div>
      <button 
        class="refresh-btn" 
        title="Refresh" 
        @click="refreshData"
        :disabled="loadingStats"
      >
        <i class="bi bi-arrow-clockwise" :class="{ 'spinning': loadingStats }"></i>
      </button>
    </div>

    <div v-if="loadingStats" class="loading-state">
      <div class="spinner"></div>
      <p>Loading quota data...</p>
    </div>

    <div v-else class="distribution-content">
      <div class="distribution-stats">
        <div class="stat-box">
          <span class="stat-number">{{ totalQuota }}</span>
          <span class="stat-change text-success">
            <i class="bi bi-arrow-up"></i> 
            {{ quotaName || 'Total Quota' }}
          </span>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-bar">
          <div 
            v-if="provisionedPercentage > 0"
            class="progress-segment" 
            :style="`flex-basis: ${provisionedPercentage}%; background: #3b82f6 !important`"
          ></div>
          <div 
            v-if="confirmedPercentage > 0"
            class="progress-segment" 
            :style="`flex-basis: ${confirmedPercentage}%; background: #10b981 !important`"
          ></div>
          <div 
            v-if="cancelledPercentage > 0"
            class="progress-segment" 
            :style="`flex-basis: ${cancelledPercentage}%; background: #f59e0b !important`"
          ></div>
          <div 
            v-if="pendingPercentage > 0"
            class="progress-segment" 
            :style="`flex-basis: ${pendingPercentage}%; background: #ef4444 !important`"
          ></div>
          <div 
            v-if="takenPercentage > 0"
            class="progress-segment" 
            :style="`flex-basis: ${takenPercentage}%; background: #d1d5db !important`"
          ></div>
        </div>
      </div>

      <div class="legend-section">
        <div class="legend-item" v-if="provisioned > 0">
          <span class="legend-dot" style="background: #3b82f6"></span>
          <div class="legend-info">
            <span class="legend-label">Provisioned</span>
            <span class="legend-value">{{ provisioned }} ({{ provisionedPercentage.toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="legend-item" v-if="confirmed > 0">
          <span class="legend-dot" style="background: #10b981"></span>
          <div class="legend-info">
            <span class="legend-label">Confirmed</span>
            <span class="legend-value">{{ confirmed }} ({{ confirmedPercentage.toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="legend-item" v-if="cancelled > 0">
          <span class="legend-dot" style="background: #f59e0b"></span>
          <div class="legend-info">
            <span class="legend-label">Cancelled</span>
            <span class="legend-value">{{ cancelled }} ({{ cancelledPercentage.toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="legend-item" v-if="pending > 0">
          <span class="legend-dot" style="background: #ef4444"></span>
          <div class="legend-info">
            <span class="legend-label">Pending</span>
            <span class="legend-value">{{ pending }} ({{ pendingPercentage.toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="legend-item" v-if="taken > 0">
          <span class="legend-dot" style="background: #d1d5db"></span>
          <div class="legend-info">
            <span class="legend-label">Taken</span>
            <span class="legend-value">{{ taken }} ({{ takenPercentage.toFixed(1) }}%)</span>
          </div>
        </div>
        <div v-if="totalQuota === 0" class="no-data-message">
          <p>No quota data available</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStatsStore } from '@/stores/bushman/stats-store'

const statsStore = useStatsStore()

const loadingStats = computed(() => statsStore.loadingStats)
const quotaStats = computed(() => statsStore.quotaStats)

// Computed values for display
const totalQuota = computed(() => {
  const total = Number(quotaStats.value?.totalQuota) || 0
  return total
})

const provisioned = computed(() => Number(quotaStats.value?.provisioned) || 0)
const confirmed = computed(() => Number(quotaStats.value?.confirmed) || 0)
const cancelled = computed(() => Number(quotaStats.value?.cancelled) || 0)
const pending = computed(() => Number(quotaStats.value?.pending) || 0)
const taken = computed(() => Number(quotaStats.value?.taken) || 0)
const quotaName = computed(() => quotaStats.value?.quota || '')

// Calculate percentages
const provisionedPercentage = computed(() => {
  if (totalQuota.value === 0) return 0
  return (provisioned.value / totalQuota.value) * 100
})

const confirmedPercentage = computed(() => {
  if (totalQuota.value === 0) return 0
  return (confirmed.value / totalQuota.value) * 100
})

const cancelledPercentage = computed(() => {
  if (totalQuota.value === 0) return 0
  return (cancelled.value / totalQuota.value) * 100
})

const pendingPercentage = computed(() => {
  if (totalQuota.value === 0) return 0
  return (pending.value / totalQuota.value) * 100
})

const takenPercentage = computed(() => {
  if (totalQuota.value === 0) return 0
  return (taken.value / totalQuota.value) * 100
})

// Fetch data
const fetchData = async () => {
  try {
    await statsStore.getStats()
  } catch (error) {
    console.error('Error fetching quota stats:', error)
  }
}

// Refresh handler
const refreshData = async () => {
  await fetchData()
}

// Load data on mount
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.web-traffic {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.analytics-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.analytics-subtitle {
  font-size: 13px;
  color: #666;
  margin: 4px 0 0 0;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #666;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.distribution-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.distribution-stats {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-change {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
}

.progress-section {
  margin: 16px 0;
  min-height: 28px;
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-bar {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  gap: 0;
  background: transparent;
  border: none;
  outline: none;
  box-sizing: border-box;
}

.progress-segment {
  height: 100%;
  transition: all 0.3s ease;
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: auto;
  border: none;
  outline: none;
}

.progress-segment.provisioned {
  background: #3b82f6;
}

.progress-segment.confirmed {
  background: #10b981;
}

.progress-segment.cancelled {
  background: #f59e0b;
}

.progress-segment.pending {
  background: #ef4444;
}

.progress-segment.taken {
  background: #d1d5db;
}

.progress-segment:first-child {
  border-radius: 10px 0 0 10px;
}

.progress-segment:last-child {
  border-radius: 0 10px 10px 0;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.legend-label {
  color: #666;
  font-weight: 500;
}

.legend-value {
  color: #999;
  font-weight: 600;
}

.text-success {
  color: #10b981;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.no-data-message {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
