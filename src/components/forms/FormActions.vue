<template>
  <div class="form-actions" :class="[positionClass, { 'form-actions--sticky': sticky }]">
    <div class="actions-left">
      <slot name="left"></slot>
    </div>
    <div class="actions-right">
      <!-- Cancel Button -->
      <button 
        v-if="showCancel"
        type="button" 
        class="btn btn-action btn-cancel"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        <span v-if="cancelIcon" class="btn-icon">{{ cancelIcon }}</span>
        {{ cancelText }}
      </button>

      <!-- Reset Button -->
      <button 
        v-if="showReset"
        type="button" 
        class="btn btn-action btn-reset"
        @click="$emit('reset')"
        :disabled="loading"
      >
        <span v-if="resetIcon" class="btn-icon">{{ resetIcon }}</span>
        {{ resetText }}
      </button>

      <!-- Draft Button -->
      <button 
        v-if="showDraft"
        type="button" 
        class="btn btn-action btn-draft"
        @click="$emit('save-draft')"
        :disabled="loading || draftDisabled"
      >
        <span v-if="loading && !submitLoading" class="spinner-border spinner-border-sm me-1"></span>
        <span v-else-if="draftIcon" class="btn-icon">{{ draftIcon }}</span>
        {{ draftText }}
      </button>

      <!-- Submit Button -->
      <button 
        v-if="showSubmit"
        type="button" 
        class="btn btn-action btn-submit"
        @click="$emit('submit')"
        :disabled="loading || submitDisabled"
      >
        <span v-if="submitLoading" class="spinner-border spinner-border-sm me-1"></span>
        <span v-else-if="submitIcon" class="btn-icon">{{ submitIcon }}</span>
        {{ submitText }}
      </button>

      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  showCancel?: boolean
  showReset?: boolean
  showDraft?: boolean
  showSubmit?: boolean
  cancelText?: string
  resetText?: string
  draftText?: string
  submitText?: string
  cancelIcon?: string
  resetIcon?: string
  draftIcon?: string
  submitIcon?: string
  loading?: boolean
  submitLoading?: boolean
  submitDisabled?: boolean
  draftDisabled?: boolean
  sticky?: boolean
  position?: 'left' | 'center' | 'right' | 'space-between'
}

const props = withDefaults(defineProps<Props>(), {
  showCancel: true,
  showReset: false,
  showDraft: false,
  showSubmit: true,
  cancelText: 'Cancel',
  resetText: 'Reset',
  draftText: 'Save Draft',
  submitText: 'Submit',
  cancelIcon: '',
  resetIcon: '⟲',
  draftIcon: '💾',
  submitIcon: '✓',
  loading: false,
  submitLoading: false,
  submitDisabled: false,
  draftDisabled: false,
  sticky: false,
  position: 'right'
})

defineEmits<{
  (e: 'cancel'): void
  (e: 'reset'): void
  (e: 'save-draft'): void
  (e: 'submit'): void
}>()

const positionClass = computed(() => `form-actions--${props.position}`)
</script>

<style scoped>
.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  margin-top: 1rem;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

.form-actions--sticky {
  position: sticky;
  bottom: 0;
  padding: 1rem 1.25rem;
  margin: 0 -1.25rem -1.25rem;
  background: #fff;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.form-actions--left {
  justify-content: flex-start;
}

.form-actions--center {
  justify-content: center;
}

.form-actions--right {
  justify-content: flex-end;
}

.form-actions--space-between {
  justify-content: space-between;
}

.actions-left,
.actions-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 0.875rem;
}

.btn-cancel {
  background: transparent;
  color: var(--bs-secondary, #6c757d);
  border-color: var(--bs-border-color, #dee2e6);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bs-gray-100, #f8f9fa);
  border-color: var(--bs-secondary, #6c757d);
}

.btn-reset {
  background: transparent;
  color: var(--bs-secondary, #6c757d);
  border-color: var(--bs-border-color, #dee2e6);
}

.btn-reset:hover:not(:disabled) {
  background: var(--bs-gray-100, #f8f9fa);
}

.btn-draft {
  background: var(--bs-gray-100, #f8f9fa);
  color: var(--bs-dark, #212529);
  border-color: var(--bs-border-color, #dee2e6);
}

.btn-draft:hover:not(:disabled) {
  background: var(--bs-gray-200, #e9ecef);
}

.btn-submit {
  background: linear-gradient(135deg, var(--bs-primary, #0d6efd) 0%, #4d8bfd 100%);
  color: #fff;
  border-color: var(--bs-primary, #0d6efd);
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #0b5ed7 0%, #3d7de8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

@media (max-width: 576px) {
  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .actions-left,
  .actions-right {
    width: 100%;
    justify-content: center;
  }
  
  .btn-action {
    flex: 1;
    min-width: 100px;
  }
  
  .form-actions--sticky {
    margin: 0 -1rem -1rem;
    padding: 0.75rem 1rem;
  }
}
</style>
