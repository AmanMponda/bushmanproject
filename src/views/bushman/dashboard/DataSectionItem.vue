<template>
  <div class="stat-card">
    <div class="stat-card-content">
      <div class="stat-value">{{ value }}</div>
      <div class="stat-title">{{ title }}</div>
      <div class="stat-change">
        <span :class="changeClass">
          <i :class="up ? 'bi bi-arrow-up' : 'bi bi-arrow-down'" class="me-1"></i>
          {{ changeText }}
        </span>
      </div>
    </div>
    <div
      class="stat-icon"
      :style="{
        backgroundColor: iconBackground,
        color: iconColor,
      }"
    >
      <slot name="icon"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string | number
  changeText: string
  up: boolean
  iconBackground: string
  iconColor: string
}>()

const changeClass = computed(() => ({
  'text-success': props.up,
  'text-danger': !props.up,
}))
</script>

<style scoped>
.stat-card {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 8px 12px;
  padding: 14px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-height: 110px;
  height: 100%;
  aspect-ratio: 1.85 / 1;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-card-content {
  grid-column: 1;
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  grid-column: 2;
  grid-row: 1;
  flex-shrink: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
  margin-bottom: 2px;
}

.stat-title {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 4px;
  max-width: 80px;
}

.stat-change {
  font-size: 10px;
  font-weight: 600;
  margin-top: auto;
}

.stat-change .text-success {
  color: #10b981;
}

.stat-change .text-danger {
  color: #ef4444;
}

.stat-icon i {
  font-size: 20px;
}

@media (max-width: 576px) {
  .stat-card {
    aspect-ratio: auto;
    grid-template-columns: 1fr auto;
  }
}
</style>
