<template>
  <div class="manage-accounts-page">
    <!-- Header Section -->
    <div class="d-flex justify-content-between align-items-center mb-4 px-4 pt-3">
      <div class="d-flex gap-3 align-items-center flex-grow-1">
        <input
          v-model="search"
          type="text"
          class="form-control"
          placeholder="Search..."
          style="max-width: 400px;"
          @keyup.enter="fetchItems"
        />
        <button class="btn btn-outline-secondary" style="padding: 0.5rem 1rem;" @click="fetchItems">
          <i class="bi bi-search"></i>
        </button>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openAddModal">
          <i class="bi bi-plus-lg"></i> Add New Account
        </button>
        <button class="btn btn-outline-secondary" title="Filters">
          <i class="bi bi-funnel"></i> Filters
        </button>
      </div>
    </div>

    <!-- Table Section -->
    <div class="card mx-4 mb-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else>
        <div v-if="items.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-collection" style="font-size: 48px;"></i>
          <p class="mt-3">No accounts found.</p>
          <button class="btn btn-outline-secondary mt-2" @click="openAddModal">Create your first account</button>
        </div>

        <div v-else>
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr class="border-top border-bottom">
                <th class="ps-4" style="font-weight: 600;">
                  NAME
                  <i class="bi bi-arrow-down-up ms-1" style="font-size: 0.875rem;"></i>
                </th>
                <th style="font-weight: 600;">CODE</th>
                <th style="font-weight: 600;">PAYMENT TYPE</th>
                <th style="font-weight: 600;">SUB ACCOUNT</th>
                <th style="font-weight: 600;">DEFAULT</th>
                <th style="font-weight: 600; width: 140px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td class="ps-4 fw-semibold">{{ item.name }}</td>
                <td>{{ item.code || '—' }}</td>
                <td><span class="badge bg-info">{{ item.payment_type }}</span></td>
                <td>
                  <span class="text-muted">{{ item.sub_account?.name || '—' }}</span>
                </td>
                <td>
                  <span :class="item.is_default ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ item.is_default ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-info me-2" title="View" @click="openViewModal(item)">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" title="Delete" @click="confirmDelete(item)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center px-4 py-3 border-top text-muted small">
          <span>Showing 1 to {{ items.length }} of {{ items.length }} entries</span>
          <div class="d-flex gap-2 align-items-center">
            <button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-chevron-left"></i></button>
            <button class="btn btn-sm btn-primary">1</button>
            <button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-chevron-right"></i></button>
            <select class="form-select form-select-sm" style="width: 80px;">
              <option :value="null">Select...</option>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" tabindex="-1" :class="{ show: showFormModal }" style="display: block;" v-if="showFormModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? 'Edit Account' : 'Add Account' }}</h5>
            <button type="button" class="btn-close" @click="closeFormModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveForm" ref="formRef">
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input v-model="form.name" type="text" class="form-control" maxlength="200" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Code</label>
                <input v-model="form.code" type="text" class="form-control" maxlength="11" placeholder="Optional" />
              </div>
              <div class="mb-3">
                <label class="form-label">Payment Type</label>
                <input v-model="form.payment_type" type="text" class="form-control" maxlength="20" placeholder="e.g., ONE-TIME" required />
                <small class="text-muted">Max 20 characters.</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Sub Account</label>
                <select v-model.number="form.sub_account_id" class="form-select" required>
                  <option disabled value="">Select sub account</option>
                  <option v-for="sa in subAccounts" :key="sa.value" :value="sa.value">{{ sa.text }}</option>
                </select>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="form.is_default" id="isDefaultCheck">
                <label class="form-check-label" for="isDefaultCheck">Set as default</label>
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

    <!-- View Account Modal -->
    <div class="modal fade" tabindex="-1" :class="{ show: showViewModal }" style="display: block;" v-if="showViewModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">View Account</h5>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body" v-if="viewItem">
            <div class="mb-3">
              <label class="form-label text-muted">Account ID</label>
              <p class="fw-semibold">{{ viewItem.id }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Name</label>
              <p class="fw-semibold">{{ viewItem.name }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Code</label>
              <p class="fw-semibold">{{ viewItem.code || '—' }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Payment Type</label>
              <p class="fw-semibold"><span class="badge bg-info">{{ viewItem.payment_type }}</span></p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Sub Account</label>
              <p class="fw-semibold">{{ viewItem.sub_account?.name || '—' }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Default Account</label>
              <p class="fw-semibold">
                <span :class="viewItem.is_default ? 'badge bg-success' : 'badge bg-secondary'">
                  {{ viewItem.is_default ? 'Yes' : 'No' }}
                </span>
              </p>
            </div>
            <div class="mb-3" v-if="viewItem.created_date || viewItem.updated_date">
              <label class="form-label text-muted">Created Date</label>
              <p class="fw-semibold text-muted">{{ formatDate(viewItem.created_date) }}</p>
            </div>
            <div class="mb-3" v-if="viewItem.updated_date">
              <label class="form-label text-muted">Updated Date</label>
              <p class="fw-semibold text-muted">{{ formatDate(viewItem.updated_date) }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeViewModal">Close</button>
            <button class="btn btn-primary" @click="editViewItem">Edit</button>
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
            <p>Are you sure you want to delete this account?</p>
            <p v-if="itemToDelete" class="small text-muted mt-2">
              <strong>Name:</strong> {{ itemToDelete.name }}
              <span v-if="itemToDelete.code"> | <strong>Code:</strong> {{ itemToDelete.code }}</span>
            </p>
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
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '@/stores/bushman/errorHandler'

const settingsStore = useSettingsStore()
const toast = useToast()
const { validate } = useForm()

const formRef = ref<HTMLFormElement | null>(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showFormModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const editItemId = ref<number | null>(null)
const viewItem = ref<any>(null)
const itemToDelete = ref<any>(null)
const items = ref<any[]>([])
const search = ref('')

const subAccounts = ref<any[]>([])

const form = reactive({
  name: '',
  code: '' as string | null,
  is_default: false,
  payment_type: '' as string,
  sub_account_id: null as number | null,
})

async function fetchItems() {
  loading.value = true
  try {
    const response = await settingsStore.getAccounts(search.value || '')
    const data = response?.data?.data || response?.data || []
    items.value = data
  } catch (error) {
    console.error('Error loading accounts:', error)
    toast.init({ message: 'Failed to load accounts', color: 'danger' })
  } finally {
    loading.value = false
  }
}

async function loadSubAccounts() {
  try {
    const res = await settingsStore.getSubAccounts()
    subAccounts.value = settingsStore.subAccounts
  } catch (error) {
    console.error('Error loading sub accounts:', error)
  }
}

function openAddModal() {
  isEditMode.value = false
  editItemId.value = null
  form.name = ''
  form.code = ''
  form.is_default = false
  form.payment_type = ''
  form.sub_account_id = null
  showFormModal.value = true
}

function openEditModal(item: any) {
  isEditMode.value = true
  editItemId.value = item.id
  form.name = item.name || ''
  form.code = item.code || ''
  form.is_default = !!item.is_default
  form.payment_type = item.payment_type || ''
  form.sub_account_id = item.sub_account_id || null
  showFormModal.value = true
  showViewModal.value = false
}

function closeFormModal() {
  showFormModal.value = false
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openViewModal(item: any) {
  viewItem.value = item
  showViewModal.value = true
}

function closeViewModal() {
  showViewModal.value = false
  viewItem.value = null
}

function editViewItem() {
  if (viewItem.value) {
    closeViewModal()
    openEditModal(viewItem.value)
  }
}

async function saveForm() {
  const isValid = await validate()
  if (!isValid) return

  saving.value = true
  const payload = {
    name: form.name,
    code: form.code || null,
    is_default: !!form.is_default,
    payment_type: form.payment_type,
    sub_account_id: form.sub_account_id as number,
  }

  try {
    if (isEditMode.value && editItemId.value) {
      const response = await settingsStore.updateAccount(editItemId.value, payload)
      if (response.status === 200) {
        toast.init({ message: 'Account updated successfully', color: 'success' })
        showFormModal.value = false
        await fetchItems()
      }
    } else {
      const response = await settingsStore.createAccount(payload)
      if (response.status === 201) {
        toast.init({ message: 'Account created successfully', color: 'success' })
        showFormModal.value = false
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
    const response = await settingsStore.deleteAccount(itemToDelete.value.id)
    if (response.status === 200) {
      toast.init({ message: 'Account deleted successfully', color: 'success' })
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

onMounted(async () => {
  await loadSubAccounts()
  await fetchItems()
})
</script>

<style lang="scss" scoped>
.manage-accounts-page {
  min-height: 400px;
  background-color: #f5f6f8;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);

  .table {
    margin-bottom: 0;

    thead th {
      background-color: #f0f2f5;
      border-bottom: 1px solid #e0e0e0;
      font-size: 0.875rem;
      letter-spacing: 0.5px;
      color: #5a6c7d;
      padding: 1rem;
    }

    tbody tr {
      border-bottom: 1px solid #f0f2f5;

      &:hover {
        background-color: #fafbfc;
      }

      td {
        padding: 0.875rem 1rem;
      }
    }
  }
}

.modal.show {
  display: block;
  background: rgba(0,0,0,0.4);
}
</style>
