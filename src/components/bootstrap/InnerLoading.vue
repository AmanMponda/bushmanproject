<script setup lang="ts">
import { defineProps } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="inner-loading-wrapper" :class="{ 'is-loading': loading }">
    <div v-if="loading" class="inner-loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div class="inner-loading-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.inner-loading-wrapper {
  position: relative;
  min-height: 100px;
}

.inner-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
  border-radius: 4px;
}

.inner-loading-content {
  position: relative;
}

.is-loading .inner-loading-content {
  opacity: 0.5;
  pointer-events: none;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.text-primary {
  color: #0d6efd;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>

