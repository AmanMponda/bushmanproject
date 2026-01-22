<template>
  <div class="account-form-modal">
    <!-- Modal Overlay -->
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal"></div>

    <!-- Modal Content -->
    <div v-if="isOpen" class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Add New Account</h4>
        <button class="close-btn" @click="closeModal">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <!-- Account Name -->
          <div class="form-group">
            <label for="name">Account Name *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-control"
              placeholder="e.g., Bank Account"
              required
            />
          </div>

          <!-- Account Code -->
          <div class="form-group">
            <label for="code">Account Code *</label>
            <input
              id="code"
              v-model="form.code"
              type="text"
              class="form-control"
              placeholder="e.g., 10100"
              required
            />
          </div>

          <!-- Parent Account (Optional) -->
          <div class="form-group">
            <label for="parent_account_id">Parent Account (Optional)</label>
            <select
              id="parent_account_id"
              v-model="form.parent_account_id"
              class="form-control"
            >
              <option value="">-- No Parent (Top-level) --</option>
              <option v-for="account in selectableAccounts" :key="account.id" :value="account.id">
                {{ account.code }} - {{ account.name }}
              </option>
            </select>
          </div>

          <!-- Account Group -->
          <div class="form-group">
            <label for="account_group_id">Account Group *</label>
            <select
              id="account_group_id"
              v-model="form.account_group_id"
              class="form-control"
              required
            >
              <option value="">-- Select Account Group --</option>
              <option v-for="group in accountGroups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-danger">
            <i class="fa fa-exclamation-circle me-2"></i>
            {{ error }}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Account {
  id: number | string
  code: string
  name: string
  parent_account_id: number | string | null
  children?: Account[]
}

interface AccountGroup {
  id: number
  name: string
}

interface Props {
  isOpen: boolean
  accounts: Account[]
  accountGroups: AccountGroup[]
}

interface Emits {
  'update:isOpen': [value: boolean]
  'submit': [formData: FormData]
}

interface FormData {
  name: string
  code: string
  parent_account_id: number | string | null
  account_group_id: number | string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const form = ref<FormData>({
  name: '',
  code: '',
  parent_account_id: null,
  account_group_id: ''
})

const loading = ref(false)
const error = ref<string | null>(null)

// Flatten accounts for parent selection (exclude leaf accounts with children for better UX)
const selectableAccounts = computed(() => {
  const flatten = (accounts: Account[]): Account[] => {
    return accounts.flatMap(acc => [acc, ...(acc.children ? flatten(acc.children) : [])])
  }
  return flatten(props.accounts)
})

// Methods
const closeModal = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    parent_account_id: null,
    account_group_id: ''
  }
  error.value = null
}

const handleSubmit = async () => {
  error.value = null
  loading.value = true

  try {
    // Validation
    if (!form.value.name.trim()) {
      throw new Error('Account name is required')
    }
    if (!form.value.code.trim()) {
      throw new Error('Account code is required')
    }
    if (!form.value.account_group_id) {
      throw new Error('Account group is required')
    }

    // Emit the form data to parent component
    emit('submit', {
      name: form.value.name.trim(),
      code: form.value.code.trim(),
      parent_account_id: form.value.parent_account_id ? Number(form.value.parent_account_id) : null,
      account_group_id: Number(form.value.account_group_id)
    })

    // Reset and close after successful submission
    resetForm()
    emit('update:isOpen', false)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.account-form-modal {
  /* Modal overlay */
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1000;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 0;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  color: #333;
}

.form-control:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-control::placeholder {
  color: #999;
}

.alert {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.alert-danger {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid #d0d0d0;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-secondary {
  background: transparent;
  color: #333;
  border-color: #d0d0d0;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #999;
}

.spinner-border {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner 0.6s linear infinite;
}

.spinner-border-sm {
  width: 0.875em;
  height: 0.875em;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
