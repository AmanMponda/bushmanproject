<script setup lang="ts">
type Props = {
  title?: string
  badge?: string
  subtitle?: string
  variant?: 'default' | 'primary' | 'muted'
  collapsible?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  badge: '',
  subtitle: '',
  variant: 'default',
  collapsible: false,
  collapsed: false,
})

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const onHeaderClick = () => {
  if (!props.collapsible) return
  emit('toggle')
}
</script>

<template>
  <section :class="['card-shell', `card-shell--${variant}`, { 'is-collapsed': collapsed }]">
    <header class="card-shell__header" :class="{ 'is-clickable': collapsible }" @click="onHeaderClick">
      <div class="card-shell__title-group">
        <slot name="header">
          <h4 class="card-shell__title">{{ title }}</h4>
          <p v-if="subtitle" class="card-shell__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div class="card-shell__meta">
        <slot name="badge">
          <span v-if="badge" class="card-shell__badge">{{ badge }}</span>
        </slot>
        <slot name="actions" />
      </div>
    </header>
    <div class="card-shell__body" v-show="!collapsed">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card-shell {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card-shell:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.card-shell__header {
  background: #f8fafc;
  color: #0f172a;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.card-shell__header.is-clickable {
  cursor: pointer;
  user-select: none;
}

.card-shell__title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-shell__title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.card-shell__subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.card-shell__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.card-shell__badge {
  font-size: 12px;
  font-weight: 700;
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 6px;
}

.card-shell__body {
  padding: 12px;
}

.card-shell--primary .card-shell__header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border-bottom-color: transparent;
}

.card-shell--primary .card-shell__badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.card-shell--primary .card-shell__subtitle {
  color: rgba(255, 255, 255, 0.85);
}

.card-shell--muted .card-shell__header {
  background: #f1f5f9;
}

.is-collapsed .card-shell__body {
  display: none;
}
</style>
