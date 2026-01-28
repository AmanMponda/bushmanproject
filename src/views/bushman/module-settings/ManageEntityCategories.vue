<template>
  <div class="manage-entity-categories-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">System Configuration</a></li>
          <li class="breadcrumb-item active">Entity Categories</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Company Entity Categories</h2>
                <p class="text-muted mb-0 small">
                  Create, update, and manage categories used to classify company entities.
                </p>
              </div>
              <button class="btn btn-primary" @click="openCategoryModal()">
                <i class="fa fa-plus me-2"></i>Add Category
              </button>
            </div>

            <StandardDataTable
              :columns="columns"
              :data="categories"
              :loading="loading"
              :filters="tableFilters"
              :custom-filters="customFilters"
              :show-date-filters="false"
              @update:filters="handleFiltersUpdate"
            >
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" title="View" @click="openViewModal(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" title="Edit" @click="openCategoryModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <div class="modal fade" :class="{ show: showCategoryModal }" :style="{ display: showCategoryModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-tags me-2"></i>
              {{ editingCategory ? 'Edit Category' : 'Add Category' }}
            </h5>
            <button type="button" class="btn-close" @click="closeCategoryModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCategory">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="categoryForm.name" type="text" class="form-control" placeholder="SUPPLIER" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Display Name <span class="text-danger">*</span></label>
                  <input v-model="categoryForm.display_name" type="text" class="form-control" placeholder="Supplier" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category Code</label>
                  <input v-model="categoryForm.category_code" type="text" class="form-control" placeholder="SUPP" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Keyword</label>
                  <input v-model="categoryForm.keyword" type="text" class="form-control" placeholder="supplier" />
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2" @click="closeCategoryModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ editingCategory ? 'Update Category' : 'Create Category' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- View Category Modal -->
    <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title">Category Details</h5>
              <div class="text-muted small">
                {{ viewCategory?.display_name || viewCategory?.name || '' }}
              </div>
            </div>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label text-muted">Name</label>
                <div class="fw-semibold">{{ viewCategory?.name || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Display Name</label>
                <div class="fw-semibold">{{ viewCategory?.display_name || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Code</label>
                <div class="fw-semibold">{{ viewCategory?.category_code || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Keyword</label>
                <div class="fw-semibold">{{ viewCategory?.keyword || '--' }}</div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4 mb-2">
              <h6 class="mb-0">Entities in this category</h6>
              <button class="btn btn-outline-primary btn-sm" @click="openAssignModal">
                <i class="fa fa-plus me-1"></i>Assign Entity
              </button>
            </div>

            <StandardDataTable
              :columns="entityColumns"
              :data="categoryEntities"
              :loading="entitiesLoading"
              :show-date-filters="false"
              :disable-search="true"
            >
              <template #status="{ row }">
                <span class="badge" :class="row.pivot?.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ row.pivot?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-outline-danger btn-sm" title="Remove" @click="confirmRemoveEntity(row)">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Entity Modal -->
    <div class="modal fade" :class="{ show: showAssignModal }" :style="{ display: showAssignModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assign Entity to Category</h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="assignEntity">
              <div class="row g-3">
                <div class="col-md-12">
                  <label class="form-label">Search Entity</label>
                  <div class="input-group">
                    <input v-model="entitySearch" type="text" class="form-control" placeholder="Search by name..." />
                    <button class="btn btn-outline-secondary" type="button" @click="fetchEntities">
                      <i class="fa fa-search"></i>
                    </button>
                  </div>
                  <small class="text-muted">Use search to load entities, or enter entity ID directly.</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Entity</label>
                  <select v-model="assignForm.entity_id" class="form-select">
                    <option value="">Select entity</option>
                    <option v-for="entity in entityOptions" :key="entity.id" :value="entity.id">
                      {{ entity.label }}
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Entity ID</label>
                  <input v-model="assignForm.entity_id" type="number" class="form-control" placeholder="10" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Default Payable Account</label>
                  <select v-model="assignForm.default_payable_account_id" class="form-select">
                    <option value="">Select account</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ account.code || account.account_number || '-' }})
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Default Receivable Account</label>
                  <select v-model="assignForm.default_receivable_account_id" class="form-select">
                    <option value="">Select account</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ account.code || account.account_number || '-' }})
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Effective From</label>
                  <input v-model="assignForm.effective_from" type="date" class="form-control" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Effective To</label>
                  <input v-model="assignForm.effective_to" type="date" class="form-control" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Entity Code</label>
                  <input v-model="assignForm.code" type="text" class="form-control" placeholder="SUPP-001" />
                </div>

                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-check mt-4">
                    <input v-model="assignForm.is_active" type="checkbox" class="form-check-input" id="assignActive" />
                    <label class="form-check-label" for="assignActive">Is Active</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2" @click="closeAssignModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="assigning">
                  <span v-if="assigning" class="spinner-border spinner-border-sm me-2"></span>
                  Assign Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCategoryModal || showViewModal || showAssignModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
const accountsBaseUrl = import.meta.env.VITE_APP_ACCOUNTS_BASE_URL || apiBaseUrl

const loading = ref(false)
const saving = ref(false)
const assigning = ref(false)
const entitiesLoading = ref(false)

const categories = ref<any[]>([])
const categoryEntities = ref<any[]>([])
const accounts = ref<any[]>([])
const entityOptions = ref<any[]>([])

const tableFilters = ref({
  search: '',
  keyword: ''
})

const columns = [
  { key: 'name', label: 'NAME', sortable: true, visible: true },
  { key: 'display_name', label: 'DISPLAY NAME', sortable: true, visible: true },
  { key: 'category_code', label: 'CODE', sortable: true, visible: true },
  { key: 'keyword', label: 'KEYWORD', sortable: true, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const entityColumns = [
  { key: 'full_name', label: 'ENTITY', sortable: true, visible: true },
  { key: 'type', label: 'TYPE', sortable: true, visible: true },
  { key: 'status', label: 'STATUS', sortable: false, visible: true },
  { key: 'pivot.effective_from', label: 'EFFECTIVE FROM', sortable: false, visible: true },
  { key: 'pivot.effective_to', label: 'EFFECTIVE TO', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const customFilters = computed(() => [
  {
    key: 'keyword',
    label: 'Keyword',
    type: 'text',
    placeholder: 'Filter by keyword'
  }
])

const showCategoryModal = ref(false)
const showViewModal = ref(false)
const showAssignModal = ref(false)

const editingCategory = ref<any>(null)
const viewCategory = ref<any>(null)

const categoryForm = reactive({
  name: '',
  display_name: '',
  category_code: '',
  keyword: ''
})

const assignForm = reactive({
  entity_id: '' as any,
  default_payable_account_id: '' as any,
  default_receivable_account_id: '' as any,
  effective_from: '',
  effective_to: '',
  code: '',
  is_active: true
})

const entitySearch = ref('')

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (tableFilters.value.search) params.search = tableFilters.value.search
    if (tableFilters.value.keyword) params.keyword = tableFilters.value.keyword

    const response = await axios.get(`${apiBaseUrl}categories`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })

    const data = response.data?.data || response.data || []
    categories.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load categories' })
  } finally {
    loading.value = false
  }
}

const fetchCategoryDetails = async (categoryId: number) => {
  entitiesLoading.value = true
  try {
    const response = await axios.get(`${apiBaseUrl}categories/${categoryId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    const data = response.data?.data || response.data || {}
    viewCategory.value = data
    categoryEntities.value = data.entities || []
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load category details' })
  } finally {
    entitiesLoading.value = false
  }
}

const fetchAccounts = async () => {
  try {
    const response = await axios.get(`${accountsBaseUrl}${import.meta.env.VITE_APP_ACCOUNTS_COMPANY_VSET_URL}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    const data = response.data?.data || response.data || []
    accounts.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    // accounts are optional; keep silent but log
    console.error('Failed to load accounts', error)
  }
}

const fetchEntities = async () => {
  try {
    const params: any = {}
    if (entitySearch.value) params.search = entitySearch.value
    const response = await axios.get(`${apiBaseUrl}company-entities`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    const data = response.data?.data || response.data || []
    entityOptions.value = Array.isArray(data)
      ? data.map((entity: any) => ({
          id: entity.id,
          label: entity.full_name || entity.name || entity.username || `Entity ${entity.id}`
        }))
      : []
  } catch (error: any) {
    console.error('Failed to load entities', error)
  }
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
  fetchCategories()
}

const openCategoryModal = (category?: any) => {
  editingCategory.value = category || null
  categoryForm.name = category?.name || ''
  categoryForm.display_name = category?.display_name || ''
  categoryForm.category_code = category?.category_code || ''
  categoryForm.keyword = category?.keyword || ''
  showCategoryModal.value = true
}

const closeCategoryModal = () => {
  showCategoryModal.value = false
  editingCategory.value = null
}

const saveCategory = async () => {
  saving.value = true
  try {
    const payload = {
      name: categoryForm.name,
      display_name: categoryForm.display_name,
      category_code: categoryForm.category_code,
      keyword: categoryForm.keyword
    }

    if (editingCategory.value?.id) {
      await axios.put(`${apiBaseUrl}categories/${editingCategory.value.id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Category updated successfully' })
    } else {
      await axios.post(`${apiBaseUrl}categories`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Category created successfully' })
    }

    closeCategoryModal()
    fetchCategories()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save category' })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (category: any) => {
  const result = await Swal.fire({
    title: 'Delete Category?',
    text: `This will delete ${category.display_name || category.name}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    await axios.delete(`${apiBaseUrl}categories/${category.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Category deleted successfully' })
    fetchCategories()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to delete category' })
  }
}

const openViewModal = async (category: any) => {
  viewCategory.value = category
  showViewModal.value = true
  await fetchCategoryDetails(category.id)
}

const closeViewModal = () => {
  showViewModal.value = false
  viewCategory.value = null
  categoryEntities.value = []
}

const openAssignModal = () => {
  assignForm.entity_id = ''
  assignForm.default_payable_account_id = ''
  assignForm.default_receivable_account_id = ''
  assignForm.effective_from = ''
  assignForm.effective_to = ''
  assignForm.code = ''
  assignForm.is_active = true
  showAssignModal.value = true
}

const closeAssignModal = () => {
  showAssignModal.value = false
}

const assignEntity = async () => {
  if (!viewCategory.value?.id || !assignForm.entity_id) {
    Swal.fire({ icon: 'warning', title: 'Missing data', text: 'Select an entity first.' })
    return
  }

  assigning.value = true
  try {
    const payload = {
      category_id: viewCategory.value.id,
      default_payable_account_id: assignForm.default_payable_account_id || undefined,
      default_receivable_account_id: assignForm.default_receivable_account_id || undefined,
      effective_from: assignForm.effective_from || undefined,
      effective_to: assignForm.effective_to || undefined,
      code: assignForm.code || undefined,
      is_active: assignForm.is_active
    }

    await axios.post(`${apiBaseUrl}company-entities/${assignForm.entity_id}/categories`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })

    Swal.fire({ icon: 'success', title: 'Assigned', text: 'Category assigned to entity' })
    closeAssignModal()
    fetchCategoryDetails(viewCategory.value.id)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to assign category' })
  } finally {
    assigning.value = false
  }
}

const confirmRemoveEntity = async (entity: any) => {
  if (!viewCategory.value?.id) return

  const result = await Swal.fire({
    title: 'Remove Category?',
    text: `Remove ${viewCategory.value.display_name || viewCategory.value.name} from ${entity.full_name || entity.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    await axios.delete(`${apiBaseUrl}company-entities/${entity.id}/categories/${viewCategory.value.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Category removed from entity' })
    fetchCategoryDetails(viewCategory.value.id)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove category' })
  }
}

onMounted(() => {
  fetchCategories()
  fetchAccounts()
})
</script>

<style scoped>
.manage-entity-categories-page .panel {
  border-radius: 12px;
}

.manage-entity-categories-page .custom-table {
  border-radius: 12px;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>
