<template>
  <div class="sales-analytics">
    <div class="analytics-header">
      <div>
        <h6 class="analytics-title">Quota Performance</h6>
        <p class="analytics-subtitle">Quota utilization trend 2024-2025</p>
      </div>
      <button class="refresh-btn" title="Refresh">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>

    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

const chartCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (chartCanvas.value) {
    new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Total Quota',
            data: [320, 330, 335, 340, 350, 360, 365, 368, 369, 370, 370, 370],
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
            data: [45, 50, 55, 60, 65, 68, 70, 72, 73, 74, 74, 74],
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
            data: [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6],
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
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 8,
              font: {
                size: 12,
              },
              padding: 16,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 400,
          },
        },
      },
    })
  }
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

.refresh-btn:hover {
  background: #e5e7eb;
  color: #666;
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 250px;
}
</style>
