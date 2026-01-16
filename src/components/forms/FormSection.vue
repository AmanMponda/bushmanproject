<template>
  <div class="form-section" :class="{ 'form-section--bordered': bordered }">
    <div v-if="title" class="section-title">
      <span v-if="icon" class="section-icon">{{ icon }}</span>
      <span class="section-text">{{ title }}</span>
      <slot name="title-actions"></slot>
    </div>
    <div v-if="description" class="section-description">{{ description }}</div>
    <div class="section-content" :class="[gridClass]">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  description?: string
  icon?: string
  bordered?: boolean
  columns?: 1 | 2 | 3 | 4
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  icon: '',
  bordered: false,
  columns: 1
})

const gridClass = computed(() => {
  if (props.columns === 1) return ''
  return `section-grid section-grid--${props.columns}`
})
</script>

<style scoped>
.form-section {
  margin-bottom: 1.5rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section--bordered {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.form-section--bordered:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bs-dark, #212529);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--bs-primary, #0d6efd);
  border-bottom-width: 2px;
  border-image: linear-gradient(90deg, var(--bs-primary, #0d6efd), transparent) 1;
}

.section-icon {
  font-size: 1rem;
}

.section-text {
  flex: 1;
}

.section-description {
  font-size: 0.8125rem;
  color: var(--bs-secondary, #6c757d);
  margin-bottom: 1rem;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-grid {
  display: grid;
  gap: 1rem;
}

.section-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

.section-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.section-grid--4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 992px) {
  .section-grid--4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .section-grid--3,
  .section-grid--4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .section-grid--2,
  .section-grid--3,
  .section-grid--4 {
    grid-template-columns: 1fr;
  }
}
</style>
