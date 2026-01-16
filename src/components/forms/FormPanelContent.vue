<template>
  <div class="form-panel-content" :class="{ 'with-padding': padding }">
    <!-- Tabs Navigation (optional) -->
    <div v-if="tabs.length > 0" class="tabs-float">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="getTabKey(tab)"
          type="button"
          class="tab"
          :class="{ active: isActiveTab(tab) }"
          @click="selectTab(tab)"
        >
          <span v-if="getTabIcon(tab)" class="tab-icon">{{ getTabIcon(tab) }}</span>
          <span class="tab-text">{{ getTabLabel(tab) }}</span>
          <span v-if="getTabCount(tab) > 0" class="tab-count">{{ getTabCount(tab) }}</span>
        </button>
      </div>
      <div v-if="$slots['tab-actions']" class="tab-actions">
        <slot name="tab-actions"></slot>
      </div>
    </div>

    <!-- Content Area -->
    <div class="panel-content-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
type TabItem = string | { key: string; label: string; icon?: string; count?: number }

interface Props {
  tabs?: TabItem[]
  activeTab?: string
  padding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  activeTab: '',
  padding: false
})

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
}>()

const getTabKey = (tab: TabItem): string => {
  return typeof tab === 'string' ? tab : tab.key
}

const getTabLabel = (tab: TabItem): string => {
  return typeof tab === 'string' ? tab : tab.label
}

const getTabIcon = (tab: TabItem): string | undefined => {
  return typeof tab === 'string' ? undefined : tab.icon
}

const getTabCount = (tab: TabItem): number => {
  return typeof tab === 'string' ? 0 : (tab.count || 0)
}

const isActiveTab = (tab: TabItem): boolean => {
  return getTabKey(tab) === props.activeTab
}

const selectTab = (tab: TabItem) => {
  emit('update:activeTab', getTabKey(tab))
}
</script>

<style scoped>
.form-panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form-panel-content.with-padding {
  padding: 14px;
}

.tabs-float {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 14px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s ease;
}

.tab:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
  line-height: 1;
}

.tab-text {
  font-weight: 600;
}

.tab-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-content-body {
  flex: 1;
  overflow: auto;
}
</style>
