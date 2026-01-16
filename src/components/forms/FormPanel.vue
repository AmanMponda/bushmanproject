<template>
  <div class="form-panel" :class="[variantClass, { 'form-panel--collapsible': collapsible }]">
    <div v-if="showHeader" class="panel-header" @click="collapsible && toggleCollapse()">
      <div v-if="icon" class="panel-icon">{{ icon }}</div>
      <div class="panel-title-text">
        <h3>{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <div class="panel-header-actions">
        <slot name="header-actions"></slot>
        <button 
          v-if="collapsible" 
          type="button" 
          class="collapse-btn"
          :aria-expanded="!isCollapsed"
        >
          <i class="fa" :class="isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
        </button>
      </div>
    </div>
    <transition name="collapse">
      <div v-show="!isCollapsed" class="panel-body">
        <slot></slot>
      </div>
    </transition>
    <div v-if="$slots.footer && !isCollapsed" class="panel-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title?: string
  description?: string
  icon?: string
  variant?: 'default' | 'card' | 'flat'
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  icon: '',
  variant: 'card',
  collapsible: false,
  defaultCollapsed: false
})

const isCollapsed = ref(props.defaultCollapsed)

const showHeader = computed(() => props.title || props.icon)

const variantClass = computed(() => `form-panel--${props.variant}`)

const toggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}
</script>

<style scoped>
.form-panel {
  margin-bottom: 1.5rem;
}

.form-panel--card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.form-panel--flat {
  background: transparent;
  border: none;
}

.form-panel--default {
  background: #fff;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 8px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.form-panel--collapsible .panel-header {
  cursor: pointer;
  user-select: none;
}

.form-panel--collapsible .panel-header:hover {
  background: linear-gradient(135deg, #f0f1f2 0%, #f8f9fa 100%);
}

.panel-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, var(--bs-primary, #0d6efd) 0%, #4d8bfd 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.panel-title-text {
  flex: 1;
}

.panel-title-text h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--bs-dark, #212529);
  margin: 0;
}

.panel-title-text p {
  font-size: 0.8125rem;
  color: var(--bs-secondary, #6c757d);
  margin: 0.25rem 0 0;
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.collapse-btn {
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--bs-secondary, #6c757d);
  transition: transform 0.2s ease;
}

.collapse-btn:hover {
  color: var(--bs-dark, #212529);
}

.panel-body {
  padding: 1.25rem;
}

.panel-footer {
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}

@media (max-width: 576px) {
  .panel-header {
    padding: 0.875rem 1rem;
  }
  
  .panel-body {
    padding: 1rem;
  }
}
</style>
