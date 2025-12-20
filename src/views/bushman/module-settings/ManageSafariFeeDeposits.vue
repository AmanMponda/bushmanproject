<template>
  <div class="manage-safari-fee-deposits-page container py-3">
    <div class="card">
      <div class="card-body">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-2">
          <h2 class="h5 mb-0 d-flex align-items-center gap-2 text-secondary">
            <i class="bi bi-currency-dollar"></i>
            Safari Fee Deposits
          </h2>
          <button class="btn btn-primary" @click="openAddModal">Add New Deposit</button>
        </div>

        <hr />

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else>
          <div v-if="items.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-collection" style="font-size: 48px;"></i>
            <p class="mt-3">No safari fee deposits found.</p>
            <button class="btn btn-outline-secondary mt-2" @click="openAddModal">Add your first deposit</button>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th style="width: 80px">ID</th>
                  <th>Safari Duration</th>
                  <th>Trophy Fee Deposit (USD)</th>
                  <th>Created</th>
                  <th style="width: 140px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.id">
                  <td>{{ item.id }}</td>
                  <td class="fw-semibold">
                    <i class="bi bi-calendar-event text-primary me-1"></i>
                    {{ item.safari_duration }}
                  </td>
                  <td>
                    <span class="badge bg-success">${{ formatNumber(item.trophy_fee_deposit) }}</span>
                  </td>
                  <td class="text-muted small">{{ formatDate(item.created_at) }}</td>
                  <td>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-warning" title="Edit" @click="openEditModal(item)">Edit</button>
                      <button class="btn btn-sm btn-outline-danger" title="Delete" @click="confirmDelete(item)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" tabindex="-1" :class="{ show: showFormModal }" style="display: block;" v-if="showFormModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? 'Edit Deposit' : 'Add New Deposit' }}</h5>
            <button type="button" class="btn-close" @click="closeFormModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveForm" ref="formRef">
              <div class="mb-3">
                <label class="form-label">Safari Duration</label>
                <input v-model="form.safari_duration" type="text" class="form-control" placeholder="e.g., 10 Days" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Trophy Fee Deposit (USD)</label>
                <input v-model.number="form.trophy_fee_deposit" type="number" step="0.01" min="0" class="form-control" placeholder="0.00" required />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeFormModal">Cancel</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveForm">{{ isEditMode ? 'Update' : 'Save' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" tabindex="-1" :class="{ show: showDeleteModal }" style="display: block;" v-if="showDeleteModal">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this safari fee deposit?</p>
            <p v-if="itemToDelete" class="small text-muted mt-2"><strong>Duration:</strong> {{ itemToDelete.safari_duration }} | <strong>Deposit:</strong> ${{ formatNumber(itemToDelete.trophy_fee_deposit) }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
            <button class="btn btn-danger" :disabled="deleting" @click="deleteItem">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '../../../stores/bushman/errorHandler'

const settingsStore = useSettingsStore()
const toast = useToast()
const { validate } = useForm()

const formRef = ref<HTMLFormElement | null>(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const editItemId = ref<number | null>(null)
const itemToDelete = ref<any>(null)
const items = ref<any[]>([])

const form = reactive({ safari_duration: '', trophy_fee_deposit: null as number | null })

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatNumber(value: number) {
  if (value === undefined || value === null) return '0.00'
  return parseFloat(String(value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function fetchItems() {
  loading.value = true
  try {
    const response = await settingsStore.getSafariFeeDeposits()
    if (response.status === 200) {
      items.value = response.data.data || response.data
    }
  } catch (error) {
    console.error('Error loading safari fee deposits:', error)
    toast.init({ message: 'Failed to load safari fee deposits', color: 'danger' })
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  isEditMode.value = false
  editItemId.value = null
  form.safari_duration = ''
  form.trophy_fee_deposit = null
  showFormModal.value = true
}

function openEditModal(item: any) {
  isEditMode.value = true
  editItemId.value = item.id
  form.safari_duration = item.safari_duration || ''
  form.trophy_fee_deposit = parseFloat(item.trophy_fee_deposit) || null
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  form.safari_duration = ''
  form.trophy_fee_deposit = null
}

async function saveForm() {
  const isValid = await validate()
  if (!isValid) return

  saving.value = true
  const payload = { safari_duration: form.safari_duration, trophy_fee_deposit: form.trophy_fee_deposit }

  try {
    if (isEditMode.value && editItemId.value) {
      const response = await settingsStore.updateSafariFeeDeposit(editItemId.value, payload)
      if (response.status === 200) {
        toast.init({ message: 'Deposit updated successfully', color: 'success' })
        closeFormModal()
        await fetchItems()
      }
    } else {
      const response = await settingsStore.createSafariFeeDeposit(payload)
      if (response.status === 201) {
        toast.init({ message: 'Deposit created successfully', color: 'success' })
        closeFormModal()
        await fetchItems()
      }
    }
  } catch (error: any) {
    const errors = handleErrors(error.response)
    toast.init({ message: errors.join(', ') || 'Failed to save', color: 'danger' })
  } finally {
    saving.value = false
  }
}

function confirmDelete(item: any) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function deleteItem() {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    const response = await settingsStore.deleteSafariFeeDeposit(itemToDelete.value.id)
    if (response.status === 200 || response.status === 204) {
      toast.init({ message: 'Deposit deleted successfully', color: 'success' })
      showDeleteModal.value = false
      itemToDelete.value = null
      await fetchItems()
    }
  } catch (error: any) {
    const errors = handleErrors(error.response)
    toast.init({ message: errors.join(', ') || 'Failed to delete', color: 'danger' })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchItems()
})
</script>

<style lang="scss" scoped>
.manage-safari-fee-deposits-page {
  min-height: 400px;
}
.modal.show { display: block; background: rgba(0,0,0,0.4); }
</style>
