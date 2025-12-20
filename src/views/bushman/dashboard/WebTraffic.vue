<template>
  <div class="web-traffic">
    <div class="analytics-header">
      <div>
        <h6 class="analytics-title">Quota Distribution</h6>
        <p class="analytics-subtitle">Quota allocation by category</p>
      </div>
      <button class="refresh-btn" title="Refresh">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>

    <div class="distribution-content">
      <div class="distribution-stats">
        <div class="stat-box">
          <span class="stat-number">457</span>
          <span class="stat-change text-success"> <i class="bi bi-arrow-up"></i> +12.5% </span>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-segment" style="flex-basis: 40.7%; background: #3b82f6 !important"></div>
          <div class="progress-segment" style="flex-basis: 32.2%; background: #10b981 !important"></div>
          <div class="progress-segment" style="flex-basis: 15.3%; background: #f59e0b !important"></div>
          <div class="progress-segment" style="flex-basis: 7.7%; background: #ef4444 !important"></div>
          <div class="progress-segment" style="flex-basis: 4.1%; background: #d1d5db !important"></div>
        </div>
      </div>

      <div class="legend-section">
        <div class="legend-item">
          <span class="legend-dot" style="background: #3b82f6"></span>
          <div class="legend-info">
            <span class="legend-label">Provisioned</span>
            <span class="legend-value">186 (40.7%)</span>
          </div>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #10b981"></span>
          <div class="legend-info">
            <span class="legend-label">Confirmed</span>
            <span class="legend-value">147 (32.2%)</span>
          </div>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f59e0b"></span>
          <div class="legend-info">
            <span class="legend-label">Cancelled</span>
            <span class="legend-value">70 (15.3%)</span>
          </div>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #ef4444"></span>
          <div class="legend-info">
            <span class="legend-label">Pending</span>
            <span class="legend-value">35 (7.7%)</span>
          </div>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #d1d5db"></span>
          <div class="legend-info">
            <span class="legend-label">Taken</span>
            <span class="legend-value">19 (4.1%)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

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

.refresh-btn:hover {
  background: #e5e7eb;
  color: #666;
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
</style>
