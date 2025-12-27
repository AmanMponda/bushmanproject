<template>
  <div class="sales-analytics">
    <div class="analytics-header">
      <div>
        <h6 class="analytics-title">Quota Performance</h6>
        <p class="analytics-subtitle">{{ chartSubtitle }}</p>
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
      <p>Loading performance data...</p>
    </div>

    <div v-else class="chart-container">
      <canvas ref="chartCanvas"></canvas>
      <div v-if="!chartData" class="no-data-message">
        <p>No quota performance data available</p>
      </div>
      
      <!-- Performance Summary -->
      <div v-if="chartData && quotaStats" class="performance-summary">
        <div class="summary-item">
          <span class="summary-label">Utilization Rate:</span>
          <span class="summary-value">{{ utilizationRate }}%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Confirmed vs Total:</span>
          <span class="summary-value">{{ confirmedRatio }}%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Completion Rate:</span>
          <span class="summary-value">{{ completionRate }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { useStatsStore } from '@/stores/bushman/stats-store'

const statsStore = useStatsStore()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)
const chartData = ref<any>(null)
const isUpdating = ref(false)

const loadingStats = computed(() => statsStore.loadingStats)
const quotaStats = computed(() => statsStore.quotaStats)

const chartSubtitle = computed(() => {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const totalQuota = Number(quotaStats.value?.totalQuota) || 0
  const confirmed = Number(quotaStats.value?.confirmed) || 0
  
  if (totalQuota > 0) {
    const utilization = ((confirmed / totalQuota) * 100).toFixed(1)
    return `Projected trend based on current data | Utilization: ${utilization}% | Total: ${totalQuota} | Confirmed: ${confirmed}`
  }
  return `Projected quota utilization trend ${currentYear}-${nextYear} (hover for details)`
})

// Performance metrics
const utilizationRate = computed(() => {
  const total = Number(quotaStats.value?.totalQuota) || 0
  const confirmed = Number(quotaStats.value?.confirmed) || 0
  if (total === 0) return 0
  return ((confirmed / total) * 100).toFixed(1)
})

const confirmedRatio = computed(() => {
  const total = Number(quotaStats.value?.totalQuota) || 0
  const confirmed = Number(quotaStats.value?.confirmed) || 0
  if (total === 0) return 0
  return ((confirmed / total) * 100).toFixed(1)
})

const completionRate = computed(() => {
  const confirmed = Number(quotaStats.value?.confirmed) || 0
  const taken = Number(quotaStats.value?.taken) || 0
  if (confirmed === 0) return 0
  return ((taken / confirmed) * 100).toFixed(1)
})

// Generate monthly trend data based on current stats
const generateMonthlyTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const totalQuota = Number(quotaStats.value?.totalQuota) || 0
  const confirmed = Number(quotaStats.value?.confirmed) || 0
  const taken = Number(quotaStats.value?.taken) || 0

  // If no data, return empty structure
  if (totalQuota === 0 && confirmed === 0 && taken === 0) {
    return {
      labels: months,
      datasets: [
        {
          label: 'Total Quota',
          data: Array(12).fill(0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Confirmed',
          data: Array(12).fill(0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Taken',
          data: Array(12).fill(0),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    }
  }

  // Calculate monthly progression
  const totalQuotaData: number[] = []
  const confirmedData: number[] = []
  const takenData: number[] = []

  // Generate progressive trend for the year
  for (let i = 0; i < 12; i++) {
    // Total quota grows gradually to current value
    const progress = (i + 1) / 12
    totalQuotaData.push(Math.round(totalQuota * progress))
    
    // Confirmed grows proportionally
    confirmedData.push(Math.round(confirmed * progress))
    
    // Taken grows more slowly (accumulated over time)
    takenData.push(Math.round(taken * Math.min(progress * 1.2, 1)))
  }

  return {
    labels: months,
    datasets: [
      {
        label: 'Total Quota',
        data: totalQuotaData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Confirmed',
        data: confirmedData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Taken',
        data: takenData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }
}

// Destroy chart instance
const destroyChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
}

// Get tooltip configuration with access to current stats
// IMPORTANT: Extract plain values to avoid reactivity issues with Chart.js
const getTooltipConfig = () => {
  // Extract plain values from reactive computed property
  const currentTotal = Number(quotaStats.value?.totalQuota) || 0
  const currentConfirmed = Number(quotaStats.value?.confirmed) || 0
  const currentTaken = Number(quotaStats.value?.taken) || 0
  
  // Create plain object with plain values (not reactive)
  return {
    enabled: true,
    mode: 'index' as const,
    intersect: false,
    callbacks: {
      title: (context: any) => {
        return `Month: ${context[0].label}`
      },
      label: (context: any) => {
        const label = context.dataset.label || ''
        const value = context.parsed.y
        
        if (label === 'Total Quota') {
          return `${label}: ${value} (100%)`
        } else if (currentTotal > 0) {
          const percentage = ((value / currentTotal) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}% of total)`
        }
        return `${label}: ${value}`
      },
      afterLabel: (context: any) => {
        const datasetIndex = context.datasetIndex
        const dataIndex = context.dataIndex
        
        // Add insights for December (current state)
        if (dataIndex === 11) {
          if (datasetIndex === 0) {
            return `📊 Total quota allocated`
          } else if (datasetIndex === 1) {
            const rate = currentTotal > 0 ? ((currentConfirmed / currentTotal) * 100).toFixed(1) : 0
            return `✅ ${rate}% of quota confirmed`
          } else if (datasetIndex === 2) {
            const rate = currentConfirmed > 0 ? ((currentTaken / currentConfirmed) * 100).toFixed(1) : 0
            return `🎯 ${rate}% completion rate`
          }
        }
        return ''
      },
    },
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    titleColor: '#fff',
    bodyColor: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 12,
  }
}

// Create or update chart
const updateChart = async () => {
  if (isUpdating.value) return
  if (!chartCanvas.value) return

  isUpdating.value = true

  try {
    const data = generateMonthlyTrend()
    chartData.value = data

    // Calculate max value for y-axis
    const allValues = data.datasets.flatMap(d => d.data)
    const maxValue = Math.max(...allValues, Number(quotaStats.value?.totalQuota) || 0, 1)
    const yAxisMax = Math.ceil(maxValue * 1.1) || 100 // Add 10% padding, default to 100 if 0

    if (chartInstance.value) {
      // Destroy and recreate chart to avoid reactivity issues
      // This is safer than trying to update reactive properties
      destroyChart()
      // Wait a tick to ensure cleanup is complete
      await nextTick()
    }
    
    // Create new chart (either first time or after destroy)
    if (!chartInstance.value && chartCanvas.value) {
      // Create new chart
      const chartConfig = {
        type: 'line' as const,
        data: {
          labels: [...data.labels], // Create new array
          datasets: data.datasets.map(dataset => ({
            ...dataset,
            data: [...dataset.data], // Create new array
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: {
            duration: 0, // Disable animation to prevent issues
          },
          interaction: {
            mode: 'index' as const,
            intersect: false,
          },
          plugins: {
            legend: {
              display: true,
              position: 'top' as const,
              labels: {
                boxWidth: 8,
                font: {
                  size: 12,
                },
                padding: 16,
              },
            },
            tooltip: getTooltipConfig(),
          },
          scales: {
            y: {
              beginAtZero: true,
              max: yAxisMax,
              title: {
                display: true,
                text: 'Number of Quotas',
                font: {
                  size: 12,
                  weight: 'bold' as const,
                },
                color: '#666',
              },
              ticks: {
                callback: function(value: any) {
                  return value
                },
                font: {
                  size: 11,
                },
                color: '#666',
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Months (Projected Trend)',
                font: {
                  size: 12,
                  weight: 'bold' as const,
                },
                color: '#666',
              },
              ticks: {
                font: {
                  size: 11,
                },
                color: '#666',
              },
              grid: {
                display: false,
              },
            },
          },
        },
      }
      
      chartInstance.value = new Chart(chartCanvas.value, chartConfig)
    }
  } catch (error) {
    console.error('Error updating chart:', error)
  } finally {
    isUpdating.value = false
  }
}

// Fetch data
const fetchData = async () => {
  try {
    await statsStore.getStats()
    await nextTick()
    // Wait a bit more to ensure reactive updates are complete
    // Then update chart (which will recreate it to avoid reactivity issues)
    setTimeout(async () => {
      await updateChart()
    }, 100)
  } catch (error) {
    console.error('Error fetching quota stats:', error)
    isUpdating.value = false
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

// Cleanup on unmount
onBeforeUnmount(() => {
  destroyChart()
})
</script>

<style scoped>
.sales-analytics {
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

.chart-container {
  flex: 1;
  position: relative;
  min-height: 250px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  min-height: 250px;
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
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
  font-size: 14px;
}

.performance-summary {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 100px;
}

.summary-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  text-align: center;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}
</style>
