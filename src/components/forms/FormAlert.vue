<template>
  <div 
    v-if="visible" 
    class="form-alert" 
    :class="[variantClass, { 'form-alert--dismissible': dismissible }]"
    role="alert"
  >
    <span v-if="icon" class="alert-icon">
      <i v-if="icon.startsWith('fa')" :class="icon"></i>
      <span v-else>{{ icon }}</span>
    </span>
    <div class="alert-content">
      <strong v-if="title" class="alert-title">{{ title }}</strong>
      <p v-if="message" class="alert-message">{{ message }}</p>
      <slot></slot>
    </div>
    <button 
      v-if="dismissible" 
      type="button" 
      class="alert-close"
      aria-label="Close"
      @click="dismiss"
    >
      <i class="fa fa-times"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  message?: string
  icon?: string
  dismissible?: boolean
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: '',
  message: '',
  icon: '',
  dismissible: false,
  modelValue: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'dismiss'): void
}>()

const internalVisible = ref(true)

const visible = computed(() => {
  return props.modelValue !== undefined ? props.modelValue : internalVisible.value
})

const variantClass = computed(() => `form-alert--${props.variant}`)

const dismiss = () => {
  internalVisible.value = false
  emit('update:modelValue', false)
  emit('dismiss')
}

watch(() => props.modelValue, (val) => {
  internalVisible.value = val
})
</script>

<style scoped>
.form-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.form-alert--info {
  background: rgba(13, 110, 253, 0.08);
  border: 1px solid rgba(13, 110, 253, 0.2);
  color: #0a58ca;
}

.form-alert--success {
  background: rgba(25, 135, 84, 0.08);
  border: 1px solid rgba(25, 135, 84, 0.2);
  color: #146c43;
}

.form-alert--warning {
  background: rgba(255, 193, 7, 0.12);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #997404;
}

.form-alert--danger {
  background: rgba(220, 53, 69, 0.08);
  border: 1px solid rgba(220, 53, 69, 0.2);
  color: #b02a37;
}

.alert-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  display: block;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.alert-message {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.alert-close {
  background: transparent;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.6;
  color: inherit;
  transition: opacity 0.2s ease;
}

.alert-close:hover {
  opacity: 1;
}

.form-alert--dismissible {
  padding-right: 2.5rem;
  position: relative;
}

.form-alert--dismissible .alert-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}
</style>
