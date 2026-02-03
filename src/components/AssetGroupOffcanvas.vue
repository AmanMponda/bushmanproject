<template>
  <!-- Offcanvas -->
  <div
    class="offcanvas offcanvas-end"
    :class="{ show: isOpen }"
    tabindex="-1"
    :style="{ visibility: isOpen ? 'visible' : 'hidden' }"
  >
    <div class="offcanvas-header border-bottom">
      <h5 class="offcanvas-title">
        <i class="fa fa-folder-tree me-2 text-primary"></i>
        {{ isEditMode ? 'Edit Asset Group' : 'Create Asset Group' }}
      </h5>
      <button type="button" class="btn-close" @click="closeOffcanvas"></button>
    </div>

    <div class="offcanvas-body">
      <form @submit.prevent="handleSubmit" id="assetGroupForm">
        <!-- Basic Information Section -->
        <div class="card mb-3">
          <div class="card-header bg-light py-2">
            <h6 class="mb-0"><i class="fa fa-info-circle me-2"></i>Basic Information</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">
                  Code <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-control"
                  placeholder="e.g., VEH-001"
                  maxlength="50"
                  required
                />
                <small class="text-muted">Unique identifier (max 50 characters)</small>
              </div>

              <div class="col-12">
                <label class="form-label">
                  Name <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="e.g., Light Vehicles"
                  maxlength="255"
                  required
                />
              </div>

              <div class="col-12">
                <label class="form-label">
                  Asset Class <span class="text-danger">*</span>
                </label>
                <select v-model="form.asset_class" class="form-select" required>
                  <option value="">-- Select Asset Class --</option>
                  <option v-for="ac in assetClassOptions" :key="ac.value" :value="ac.value">
                    {{ ac.label }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Parent Group</label>
                <select v-model="form.parent_id" class="form-select">
                  <option :value="null">-- Root Level (No Parent) --</option>
                  <option
                    v-for="group in selectableParentGroups"
                    :key="group.id"
                    :value="group.id"
                  >
                    {{ group.name }} ({{ group.code }})
                  </option>
                </select>
                <small class="text-muted">Optional: Create hierarchy</small>
              </div>

              <div class="col-12">
                <label class="form-label">Description</label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="2"
                  placeholder="Optional description..."
                ></textarea>
              </div>

              <div class="col-12">
                <div class="form-check form-switch">
                  <input
                    id="is_active"
                    v-model="form.is_active"
                    type="checkbox"
                    class="form-check-input"
                  />
                  <label for="is_active" class="form-check-label">Active</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Depreciation Settings Section -->
        <div class="card mb-3">
          <div class="card-header bg-light py-2">
            <h6 class="mb-0"><i class="fa fa-calculator me-2"></i>Depreciation Settings</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Useful Life (Months)</label>
                <input
                  v-model.number="form.default_useful_life_months"
                  type="number"
                  class="form-control"
                  placeholder="e.g., 60"
                  min="1"
                />
              </div>

              <div class="col-6">
                <label class="form-label">Depreciation Rate (%)</label>
                <input
                  v-model.number="form.default_depr_rate_percent"
                  type="number"
                  class="form-control"
                  placeholder="e.g., 20.00"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Account Mappings Section -->
        <div class="card mb-3">
          <div class="card-header bg-light py-2">
            <h6 class="mb-0"><i class="fa fa-link me-2"></i>Account Mappings</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Fixed Asset Account</label>
                <select v-model="form.fixed_asset_account_id" class="form-select">
                  <option :value="null">-- Select Account --</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} - {{ acc.name }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Accumulated Depreciation Account</label>
                <select v-model="form.accumulated_depreciation_account_id" class="form-select">
                  <option :value="null">-- Select Account --</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} - {{ acc.name }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Depreciation Expense Account</label>
                <select v-model="form.depreciation_expense_account_id" class="form-select">
                  <option :value="null">-- Select Account --</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} - {{ acc.name }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">CWIP Account</label>
                <select v-model="form.cwip_account_id" class="form-select">
                  <option :value="null">-- Select Account --</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} - {{ acc.name }}
                  </option>
                </select>
                <small class="text-muted">Capital Work in Progress</small>
              </div>

              <div class="col-12">
                <label class="form-label">Disposal Gain/Loss Account</label>
                <select v-model="form.disposal_gain_loss_account_id" class="form-select">
                  <option :value="null">-- Select Account --</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} - {{ acc.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="alert alert-danger" role="alert">
          <i class="fa fa-exclamation-triangle me-2"></i>
          {{ error }}
        </div>
      </form>
    </div>

    <!-- Footer -->
    <div class="offcanvas-footer border-top p-3 bg-light">
      <div class="d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-outline-secondary" @click="closeOffcanvas">
          Cancel
        </button>
        <button
          type="submit"
          form="assetGroupForm"
          class="btn btn-primary"
          :disabled="saving"
        >
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fa fa-save me-2"></i>
          {{ saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div v-if="isOpen" class="offcanvas-backdrop fade show" @click="closeOffcanvas"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import assetGroupService, { type AssetGroup } from '@/services/assetGroupService'
import { useToast } from '@/composables/useToast'

const toast = useToast()

interface Account {
  id: number
  code: string
  name: string
}

interface Props {
  isOpen: boolean
  assetGroupToEdit?: AssetGroup | null
  parentGroups?: AssetGroup[]
  accounts?: Account[]
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: Partial<AssetGroup>): void
}

const props = withDefaults(defineProps<Props>(), {
  assetGroupToEdit: null,
  parentGroups: () => [],
  accounts: () => []
})

const emit = defineEmits<Emits>()

const saving = ref(false)
const error = ref('')

const assetClassOptions = [
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'BUILDING', label: 'Building' },
  { value: 'IT', label: 'IT Asset' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'TIRE', label: 'Tire' },
  { value: 'OTHER', label: 'Other' }
]

const form = ref({
  code: '',
  name: '',
  asset_class: '',
  parent_id: null as number | null,
  default_useful_life_months: null as number | null,
  default_depr_rate_percent: null as number | null,
  description: '',
  is_active: true,
  fixed_asset_account_id: null as number | null,
  accumulated_depreciation_account_id: null as number | null,
  depreciation_expense_account_id: null as number | null,
  cwip_account_id: null as number | null,
  disposal_gain_loss_account_id: null as number | null
})

const isEditMode = computed(() => !!props.assetGroupToEdit?.id)

const selectableParentGroups = computed(() => {
  if (isEditMode.value && props.assetGroupToEdit) {
    return props.parentGroups.filter(g => g.id !== props.assetGroupToEdit!.id)
  }
  return props.parentGroups
})

// Watch for modal open/close
watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue) {
      saving.value = false
      error.value = ''
    }
  }
)

// Watch for edit data
watch(
  () => props.assetGroupToEdit,
  (newValue) => {
    if (newValue) {
      form.value = {
        code: newValue.code || '',
        name: newValue.name || '',
        asset_class: newValue.asset_class || '',
        parent_id: newValue.parent_id || null,
        default_useful_life_months: newValue.default_useful_life_months || null,
        default_depr_rate_percent: newValue.default_depr_rate_percent || null,
        description: newValue.description || '',
        is_active: newValue.is_active !== false,
        fixed_asset_account_id: newValue.accounts?.fixed_asset_account_id || null,
        accumulated_depreciation_account_id: newValue.accounts?.accumulated_depreciation_account_id || null,
        depreciation_expense_account_id: newValue.accounts?.depreciation_expense_account_id || null,
        cwip_account_id: newValue.accounts?.cwip_account_id || null,
        disposal_gain_loss_account_id: newValue.accounts?.disposal_gain_loss_account_id || null
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  form.value = {
    code: '',
    name: '',
    asset_class: '',
    parent_id: null,
    default_useful_life_months: null,
    default_depr_rate_percent: null,
    description: '',
    is_active: true,
    fixed_asset_account_id: null,
    accumulated_depreciation_account_id: null,
    depreciation_expense_account_id: null,
    cwip_account_id: null,
    disposal_gain_loss_account_id: null
  }
  error.value = ''
}

function closeOffcanvas() {
  resetForm()
  emit('close')
}

async function handleSubmit() {
  error.value = ''

  // Validate
  if (!form.value.code?.trim()) {
    error.value = 'Code is required'
    return
  }
  if (!form.value.name?.trim()) {
    error.value = 'Name is required'
    return
  }
  if (!form.value.asset_class) {
    error.value = 'Asset Class is required'
    return
  }

  saving.value = true

  const payload: Partial<AssetGroup> = {
    company_id: 1,
    code: form.value.code.trim(),
    name: form.value.name.trim(),
    asset_class: form.value.asset_class as any,
    parent_id: form.value.parent_id || null,
    default_useful_life_months: form.value.default_useful_life_months || null,
    default_depr_rate_percent: form.value.default_depr_rate_percent || null,
    description: form.value.description?.trim() || null,
    is_active: form.value.is_active,
    accounts: {
      fixed_asset_account_id: form.value.fixed_asset_account_id,
      accumulated_depreciation_account_id: form.value.accumulated_depreciation_account_id,
      depreciation_expense_account_id: form.value.depreciation_expense_account_id,
      cwip_account_id: form.value.cwip_account_id,
      disposal_gain_loss_account_id: form.value.disposal_gain_loss_account_id
    }
  }

  try {
    let response
    if (isEditMode.value && props.assetGroupToEdit?.id) {
      // Update
      // response = await assetGroupService.updateAssetGroup(props.assetGroupToEdit.id, payload)
      toast.success('Asset group updated successfully')
    } else {
      // Create
      // response = await assetGroupService.createAssetGroup(payload)
      toast.success('Asset group created successfully')
    }
    
    // Success - notify parent to refresh and close
    emit('save', payload)
    resetForm()
    saving.value = false
  } catch (err: any) {
    console.error('[Offcanvas] Error saving:', err)
    console.error('[Offcanvas] Error response:', err.response)
    console.error('[Offcanvas] Error data:', err.response?.data)
    console.error('[Offcanvas] Full SQL error:', err.response?.data?.error)
    
    let errorMsg = 'Failed to save asset group'
    
    if (err.response) {
      if (err.response.status === 404) {
        errorMsg = 'API endpoint not found (404). The backend does not have /api/v1.0/asset-groups endpoint.'
      } else if (err.response.status === 422) {
        const errors = err.response.data?.errors
        if (errors) {
          errorMsg = Object.values(errors).flat().join(', ')
        } else {
          errorMsg = err.response.data?.message || 'Validation error'
        }
      } else if (err.response.status === 500) {
        errorMsg = 'Server error: ' + (err.response.data?.message || 'Internal server error')
      } else if (err.response.data?.message) {
        errorMsg = err.response.data.message
      }
    } else if (err.message === 'Network Error') {
      errorMsg = 'Network error. Check if backend is running and CORS is configured.'
    } else if (err.message) {
      errorMsg = err.message
    }
    
    error.value = errorMsg
    toast.error(errorMsg)
    saving.value = false
  }
}

// Expose methods for parent to control loading state
defineExpose({
  setLoading: (value: boolean) => { saving.value = value },
  setError: (msg: string) => { error.value = msg },
  resetForm
})
</script>

<style scoped>
.offcanvas {
  width: 480px !important;
}

.offcanvas.show {
  transform: none;
}

.offcanvas-footer {
  position: sticky;
  bottom: 0;
}

.form-label {
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.card-header h6 {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
