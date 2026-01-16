<template>
  <div class="form-card" :class="[variantClass, { 'form-card--loading': loading }]">
    <div v-if="showHeader" class="card-header">
      <div class="header-left">
        <span v-if="icon" class="header-icon" :class="iconClass">
          <i v-if="icon.startsWith('fa')" :class="icon"></i>
          <span v-else>{{ icon }}</span>
        </span>
        <div class="header-text">
          <h4 class="card-title">{{ title }}</h4>
          <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <slot name="header-actions"></slot>
      </div>
    </div>
    
    <div v-if="loading" class="card-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p v-if="loadingText" class="loading-text">{{ loadingText }}</p>
    </div>
    
    <div v-else class="card-body" :class="{ 'card-body--flush': flush }">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer && !loading" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  icon?: string
  iconVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  variant?: 'default' | 'elevated' | 'bordered' | 'flat'
  loading?: boolean
  loadingText?: string
  flush?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  icon: '',
  iconVariant: 'primary',
  variant: 'default',
  loading: false,
  loadingText: '',
  flush: false
})

const showHeader = computed(() => props.title || props.icon)

const variantClass = computed(() => `form-card--${props.variant}`)

const iconClass = computed(() => `icon-${props.iconVariant}`)
</script>

<style scoped>
.form-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.form-card--default {
  border: 1px solid var(--bs-border-color, #dee2e6);
}

.form-card--elevated {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.form-card--bordered {
  border: 2px solid var(--bs-border-color, #dee2e6);
}

.form-card--flat {
  background: var(--bs-gray-50, #f8f9fa);
  border: none;
}

.form-card--loading {
  min-height: 200px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bs-gray-50, #f8f9fa);
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.header-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.125rem;
}

.icon-primary {
  background: rgba(13, 110, 253, 0.1);
  color: var(--bs-primary, #0d6efd);
}

.icon-success {
  background: rgba(25, 135, 84, 0.1);
  color: var(--bs-success, #198754);
}

.icon-warning {
  background: rgba(255, 193, 7, 0.15);
  color: var(--bs-warning, #ffc107);
}

.icon-danger {
  background: rgba(220, 53, 69, 0.1);
  color: var(--bs-danger, #dc3545);
}

.icon-info {
  background: rgba(13, 202, 240, 0.1);
  color: var(--bs-info, #0dcaf0);
}

.header-text {
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--bs-dark, #212529);
  margin: 0;
}

.card-subtitle {
  font-size: 0.8125rem;
  color: var(--bs-secondary, #6c757d);
  margin: 0.25rem 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-text {
  margin-top: 1rem;
  color: var(--bs-secondary, #6c757d);
}

.card-body {
  padding: 1.25rem;
}

.card-body--flush {
  padding: 0;
}

.card-footer {
  padding: 1rem 1.25rem;
  background: var(--bs-gray-50, #f8f9fa);
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

@media (max-width: 576px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-body {
    padding: 1rem;
  }
}
</style>
