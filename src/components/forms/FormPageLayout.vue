<template>
  <div class="ps-page">
    <main class="content" :style="contentStyle">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div v-if="breadcrumbs.length > 0" class="crumbs">
            <span v-if="icon" class="crumb-icon">
              <i v-if="icon.startsWith('fa')" :class="icon"></i>
              <span v-else>{{ icon }}</span>
            </span>
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
              <RouterLink
                v-if="isBreadcrumbLink(crumb)"
                :to="crumb.to"
                class="crumb-link"
                :class="{ active: index === breadcrumbs.length - 1 }"
              >
                {{ crumb.label }}
              </RouterLink>
              <span v-else :class="{ active: index === breadcrumbs.length - 1 }">{{ getBreadcrumbLabel(crumb) }}</span>
              <template v-if="index < breadcrumbs.length - 1"> / </template>
            </template>
          </div>
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>

        <div class="head-actions">
          <slot name="header-actions"></slot>
        </div>
      </div>

      <!-- Alert Slot -->
      <slot name="alert"></slot>

      <!-- Progress Steps (optional) -->
      <div v-if="showProgress && steps.length > 0" class="progress-steps">
        <template v-for="(step, index) in steps" :key="index">
          <div class="step" :class="{ completed: step.completed, active: step.active }">
            <span class="step-number">
              <i v-if="step.completed" class="fa fa-check"></i>
              <span v-else>{{ index + 1 }}</span>
            </span>
            <span class="step-label">{{ step.label }}</span>
          </div>
          <div 
            v-if="index < steps.length - 1" 
            class="step-connector"
            :class="{ active: step.completed }"
          ></div>
        </template>
      </div>

      <!-- Main Grid Layout -->
      <section class="grid" :class="layoutClass" :style="gridStyle">
        <!-- Left Panel -->
        <aside v-if="$slots.left" class="panel left-panel" :style="leftPanelStyle">
          <div v-if="leftTitle" class="panel-header">
            <div v-if="leftIcon" class="panel-icon">
              <i v-if="leftIcon.startsWith('fa')" :class="leftIcon"></i>
              <span v-else>{{ leftIcon }}</span>
            </div>
            <div class="panel-title-text">
              <h3>{{ leftTitle }}</h3>
              <p v-if="leftDescription">{{ leftDescription }}</p>
            </div>
          </div>
          <slot name="left"></slot>
        </aside>

        <!-- Center/Main Panel -->
        <section class="panel center-panel" :class="{ 'full-width': !$slots.left && !$slots.right }">
          <div v-if="centerTitle" class="panel-header center-header">
            <div v-if="centerIcon" class="panel-icon">
              <i v-if="centerIcon.startsWith('fa')" :class="centerIcon"></i>
              <span v-else>{{ centerIcon }}</span>
            </div>
            <div class="panel-title-text">
              <h3>{{ centerTitle }}</h3>
              <p v-if="centerDescription">{{ centerDescription }}</p>
            </div>
            <div v-if="$slots['center-actions']" class="panel-actions">
              <slot name="center-actions"></slot>
            </div>
          </div>
          <slot name="center">
            <slot></slot>
          </slot>
        </section>

        <!-- Right Panel -->
        <aside v-if="$slots.right" class="panel right-panel" :style="rightPanelStyle">
          <div v-if="rightTitle" class="panel-header">
            <div v-if="rightIcon" class="panel-icon">
              <i v-if="rightIcon.startsWith('fa')" :class="rightIcon"></i>
              <span v-else>{{ rightIcon }}</span>
            </div>
            <div class="panel-title-text">
              <h3>{{ rightTitle }}</h3>
              <p v-if="rightDescription">{{ rightDescription }}</p>
            </div>
          </div>
          <slot name="right"></slot>
        </aside>
      </section>

      <!-- Sticky Footer (optional) -->
      <div v-if="$slots.footer" class="sticky-footer">
        <slot name="footer"></slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Step {
  label: string
  completed?: boolean
  active?: boolean
}

type BreadcrumbItem = string | { label: string; to?: string }

interface Props {
  // Page header
  title: string
  subtitle?: string
  icon?: string
  breadcrumbs?: BreadcrumbItem[]
  
  // Progress steps
  showProgress?: boolean
  steps?: Step[]
  
  // Layout configuration
  layout?: 'single' | 'two-column' | 'three-column'
  leftWidth?: string
  rightWidth?: string
  maxWidth?: string
  gap?: string
  
  // Left panel
  leftTitle?: string
  leftDescription?: string
  leftIcon?: string
  
  // Center panel
  centerTitle?: string
  centerDescription?: string
  centerIcon?: string
  
  // Right panel
  rightTitle?: string
  rightDescription?: string
  rightIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: '',
  breadcrumbs: () => [],
  showProgress: false,
  steps: () => [],
  layout: 'two-column',
  leftWidth: '340px',
  rightWidth: '300px',
  maxWidth: '1800px',
  gap: '14px',
  leftTitle: '',
  leftDescription: '',
  leftIcon: '',
  centerTitle: '',
  centerDescription: '',
  centerIcon: '',
  rightTitle: '',
  rightDescription: '',
  rightIcon: ''
})

const contentStyle = computed(() => ({
  maxWidth: props.maxWidth
}))

const layoutClass = computed(() => {
  return `layout-${props.layout}`
})

const gridStyle = computed(() => {
  if (props.layout === 'single') {
    return { gridTemplateColumns: '1fr', gap: props.gap }
  }
  if (props.layout === 'three-column') {
    return { 
      gridTemplateColumns: `${props.leftWidth} 1fr ${props.rightWidth}`,
      gap: props.gap
    }
  }
  // two-column (default)
  return { 
    gridTemplateColumns: `${props.leftWidth} 1fr`,
    gap: props.gap
  }
})

const leftPanelStyle = computed(() => ({
  width: props.leftWidth
}))

const rightPanelStyle = computed(() => ({
  width: props.rightWidth
}))

const getBreadcrumbLabel = (crumb: BreadcrumbItem) => {
  return typeof crumb === 'string' ? crumb : crumb.label
}

const isBreadcrumbLink = (crumb: BreadcrumbItem) => {
  return typeof crumb !== 'string' && !!crumb.to
}
</script>

<style scoped>
/* Modern Design System Variables */
:root {
  --bg: #f5f7fa;
  --bg-secondary: #e8ecf0;
  --card: #ffffff;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --muted: #94a3b8;
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #059669;
  --success-light: #d1fae5;
  --warning: #d97706;
  --danger: #dc2626;
  --purple: #7c3aed;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius: 12px;
  --radius-lg: 16px;
}

.ps-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Content */
.content {
  padding: 8px 10px 12px;
  margin: 0 auto;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.page-head-left {
  flex: 1;
  min-width: 200px;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  font-weight: 600;
}

.crumbs span.active {
  font-weight: 700;
  color: var(--primary);
}

.crumb-link {
  color: inherit;
  text-decoration: none;
}

.crumb-link:hover {
  text-decoration: underline;
}

.crumb-icon {
  font-size: 14px;
}

h1 {
  margin: 4px 0 2px;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 6px;
  padding: 6px 10px;
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 30px;
  transition: all 0.3s ease;
}

.step.completed {
  background: var(--primary-light);
}

.step.active {
  background: var(--primary);
}

.step.active .step-label {
  color: white;
}

.step.completed .step-number {
  background: var(--primary);
  color: white;
}

.step.active .step-number {
  background: white;
  color: var(--primary);
}

.step-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.step.completed .step-label {
  color: var(--primary);
}

.step-connector {
  width: 40px;
  height: 2px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 6px;
  transition: all 0.3s ease;
}

.step-connector.active {
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
}

/* Grid Layout */
.grid {
  display: grid;
  align-items: start;
}

.layout-single {
  grid-template-columns: 1fr;
}

.layout-two-column {
  grid-template-columns: 340px 1fr;
}

.layout-three-column {
  grid-template-columns: 340px 1fr 300px;
}

/* Panel Base Styles */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel.full-width {
  grid-column: 1 / -1;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 10px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 26px;
  height: 26px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.left-panel .panel-icon {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.center-panel .panel-icon {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.right-panel .panel-icon {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.panel-title-text {
  flex: 1;
}

.panel-title-text h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748b;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.center-panel {
  min-height: 500px;
  overflow: visible;
}

.left-panel {
  overflow: visible !important;
}

/* Sticky Footer */
.sticky-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card);
  border-top: 1px solid var(--border);
  padding: 8px 10px;
  margin-top: 8px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

/* Responsive Adjustments */
@media (max-width: 1200px) {
  .layout-three-column {
    grid-template-columns: 1fr;
  }
  
  .layout-three-column .left-panel,
  .layout-three-column .right-panel {
    width: 100% !important;
  }
}

@media (max-width: 1000px) {
  .layout-two-column {
    grid-template-columns: 1fr;
  }
  
  .layout-two-column .left-panel {
    width: 100% !important;
  }
  
  h1 {
    font-size: 20px;
  }
  
  .progress-steps {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .step-connector {
    display: none;
  }
}

@media (max-width: 576px) {
  .content {
    padding: 8px;
  }
  
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .head-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  h1 {
    font-size: 18px;
  }
  
  .subtitle {
    font-size: 12px;
  }
}
</style>
