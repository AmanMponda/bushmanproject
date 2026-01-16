<template>
  <div class="form-page-header">
    <div class="page-head">
      <div class="page-head-left">
        <div v-if="breadcrumbs.length > 0" class="crumbs">
          <span v-if="icon" class="crumb-icon">{{ icon }}</span>
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <span :class="{ 'current': index === breadcrumbs.length - 1 }">{{ crumb }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="separator"> / </span>
          </template>
        </div>
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="head-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  breadcrumbs?: string[]
  icon?: string
}

withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
  subtitle: '',
  icon: ''
})
</script>

<style scoped>
.form-page-header {
  margin-bottom: 1.5rem;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-head-left {
  flex: 1;
  min-width: 200px;
}

.crumbs {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--bs-secondary, #6c757d);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.crumbs .crumb-icon {
  margin-right: 0.5rem;
}

.crumbs .current {
  color: var(--bs-primary, #0d6efd);
}

.crumbs .separator {
  color: var(--bs-secondary, #6c757d);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--bs-dark, #212529);
  margin: 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 0.925rem;
  color: var(--bs-secondary, #6c757d);
  margin: 0.5rem 0 0;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }
  
  .head-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
