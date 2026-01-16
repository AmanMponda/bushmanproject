<template>
  <div class="form-field" :class="{ 'form-field--error': hasError, 'form-field--horizontal': horizontal }">
    <label v-if="label" class="field-label" :for="inputId">
      <span v-if="icon" class="field-icon">{{ icon }}</span>
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="required-mark">*</span>
      <span v-if="optional" class="optional-mark">(optional)</span>
    </label>
    <div class="field-input-wrapper" :class="{ 'with-icon': inputIcon }">
      <span v-if="inputIcon" class="input-icon">{{ inputIcon }}</span>
      <slot></slot>
    </div>
    <div v-if="hint && !hasError" class="field-hint">{{ hint }}</div>
    <div v-if="hasError" class="field-error">
      <i class="fa fa-exclamation-circle me-1"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  icon?: string
  inputIcon?: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  horizontal?: boolean
  inputId?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  icon: '',
  inputIcon: '',
  hint: '',
  error: '',
  required: false,
  optional: false,
  horizontal: false,
  inputId: ''
})

const hasError = computed(() => !!props.error)
const errorMessage = computed(() => props.error)
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field--horizontal {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.form-field--horizontal .field-label {
  flex: 0 0 auto;
  min-width: 120px;
  margin-bottom: 0;
}

.form-field--horizontal .field-input-wrapper {
  flex: 1;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bs-dark, #212529);
}

.field-icon {
  font-size: 1rem;
}

.label-text {
  flex: 1;
}

.required-mark {
  color: var(--bs-danger, #dc3545);
  font-weight: 600;
}

.optional-mark {
  font-size: 0.75rem;
  color: var(--bs-secondary, #6c757d);
  font-weight: 400;
}

.field-input-wrapper {
  position: relative;
}

.field-input-wrapper.with-icon {
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1rem;
  color: var(--bs-secondary, #6c757d);
  pointer-events: none;
  z-index: 1;
}

.field-input-wrapper.with-icon :deep(input),
.field-input-wrapper.with-icon :deep(select),
.field-input-wrapper.with-icon :deep(textarea) {
  padding-left: 2.5rem;
}

.form-field--error :deep(input),
.form-field--error :deep(select),
.form-field--error :deep(textarea) {
  border-color: var(--bs-danger, #dc3545);
}

.form-field--error :deep(input):focus,
.form-field--error :deep(select):focus,
.form-field--error :deep(textarea):focus {
  border-color: var(--bs-danger, #dc3545);
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--bs-secondary, #6c757d);
}

.field-error {
  font-size: 0.75rem;
  color: var(--bs-danger, #dc3545);
  display: flex;
  align-items: center;
}

/* Deep styling for common input elements */
:deep(input),
:deep(select),
:deep(textarea) {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 8px;
  background-color: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

:deep(input):focus,
:deep(select):focus,
:deep(textarea):focus {
  outline: none;
  border-color: var(--bs-primary, #0d6efd);
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
}

:deep(input):disabled,
:deep(select):disabled,
:deep(textarea):disabled {
  background-color: var(--bs-gray-100, #f8f9fa);
  cursor: not-allowed;
}

:deep(input)::placeholder,
:deep(textarea)::placeholder {
  color: var(--bs-gray-400, #ced4da);
}

:deep(select) {
  cursor: pointer;
}
</style>
