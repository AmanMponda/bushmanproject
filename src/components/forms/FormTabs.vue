<template>
  <div class="form-tabs" :class="[variantClass]">
    <div class="tabs-wrapper">
      <button
        v-for="tab in tabs"
        :key="getTabKey(tab)"
        type="button"
        class="tab-btn"
        :class="{ active: isActive(tab) }"
        @click="selectTab(tab)"
      >
        <span v-if="getTabIcon(tab)" class="tab-icon">{{ getTabIcon(tab) }}</span>
        <span class="tab-text">{{ getTabLabel(tab) }}</span>
        <span v-if="getTabCount(tab) !== undefined" class="tab-count">{{ getTabCount(tab) }}</span>
      </button>
    </div>
    <div v-if="$slots.actions" class="tabs-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TabItem = string | { key: string; label: string; icon?: string; count?: number }

interface Props {
  tabs: TabItem[]
  modelValue: string
  variant?: 'default' | 'pills' | 'underline'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const variantClass = computed(() => `form-tabs--${props.variant}`)

const getTabKey = (tab: TabItem): string => {
  return typeof tab === 'string' ? tab : tab.key
}

const getTabLabel = (tab: TabItem): string => {
  return typeof tab === 'string' ? tab : tab.label
}

const getTabIcon = (tab: TabItem): string | undefined => {
  return typeof tab === 'string' ? undefined : tab.icon
}

const getTabCount = (tab: TabItem): number | undefined => {
  return typeof tab === 'string' ? undefined : tab.count
}

const isActive = (tab: TabItem): boolean => {
  return getTabKey(tab) === props.modelValue
}

const selectTab = (tab: TabItem): void => {
  emit('update:modelValue', getTabKey(tab))
}
</script>

<style scoped>
.form-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tabs-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tabs-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bs-secondary, #6c757d);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-icon {
  font-size: 1rem;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 10px;
  background: var(--bs-gray-200, #e9ecef);
  color: var(--bs-secondary, #6c757d);
}

.tab-btn.active .tab-count {
  background: var(--bs-primary, #0d6efd);
  color: #fff;
}

/* Default variant */
.form-tabs--default .tab-btn {
  border-radius: 8px;
}

.form-tabs--default .tab-btn:hover {
  background: var(--bs-gray-100, #f8f9fa);
  color: var(--bs-dark, #212529);
}

.form-tabs--default .tab-btn.active {
  background: var(--bs-primary, #0d6efd);
  color: #fff;
}

/* Pills variant */
.form-tabs--pills .tabs-wrapper {
  background: var(--bs-gray-100, #f8f9fa);
  padding: 4px;
  border-radius: 10px;
}

.form-tabs--pills .tab-btn {
  border-radius: 6px;
}

.form-tabs--pills .tab-btn:hover {
  background: var(--bs-gray-200, #e9ecef);
  color: var(--bs-dark, #212529);
}

.form-tabs--pills .tab-btn.active {
  background: #fff;
  color: var(--bs-dark, #212529);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Underline variant */
.form-tabs--underline .tabs-wrapper {
  border-bottom: 2px solid var(--bs-gray-200, #e9ecef);
}

.form-tabs--underline .tab-btn {
  position: relative;
  padding-bottom: 0.875rem;
  border-radius: 0;
}

.form-tabs--underline .tab-btn::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--bs-primary, #0d6efd);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.form-tabs--underline .tab-btn:hover {
  color: var(--bs-dark, #212529);
}

.form-tabs--underline .tab-btn.active {
  color: var(--bs-primary, #0d6efd);
}

.form-tabs--underline .tab-btn.active::after {
  transform: scaleX(1);
}

.tabs-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 576px) {
  .form-tabs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tabs-actions {
    justify-content: center;
    margin-top: 0.5rem;
  }
}
</style>
