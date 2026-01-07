<template>
  <div class="manage-items-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Items Management</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <!-- Header with Add Button -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Items Management</h2>
                <p class="text-muted mb-0 small">Manage Safari Extras, Trophy Fees, Species, and other catalog items</p>
              </div>
              <button class="btn btn-primary" @click="openAddModal">
                <i class="fa fa-plus me-2"></i>Add New Item
              </button>
            </div>

            <!-- Filters -->
            <div class="row g-3 mb-4">
              <div class="col-md-2">
                <select v-model="filters.item_group_id" class="form-select" @change="fetchItems">
                  <option :value="null">All Item Groups</option>
                  <option v-for="group in itemGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-2">
                <select v-model="filters.subtype" class="form-select" @change="fetchItems">
                  <option :value="null">All Subtypes</option>
                  <option value="SAFARI_EXTRA">Safari Extra</option>
                  <option value="TROPHY_FEE">Trophy Fee</option>
                  <option value="SPECIES">Species</option>
                  <option value="PACKAGE">Package</option>
                </select>
              </div>
              <div class="col-md-2">
                <select v-model="filters.is_active" class="form-select" @change="fetchItems">
                  <option :value="null">All Status</option>
                  <option :value="true">Active Only</option>
                  <option :value="false">Inactive Only</option>
                </select>
              </div>
              <div class="col-md-2">
                <select v-model.number="filters.per_page" class="form-select" @change="fetchItems">
                  <option :value="20">20 per page</option>
                  <option :value="50">50 per page</option>
                  <option :value="100">100 per page</option>
                  <option :value="200">200 per page</option>
                  <option :value="500">500 per page</option>
                </select>
              </div>
              <div class="col-md-4">
                <input
                  v-model="filters.search"
                  type="text"
                  class="form-control"
                  placeholder="Search items..."
                  @input="debounceSearch"
                />
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Items Table -->
            <template v-else>
              <div v-if="items.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Group</th>
                      <th>Subtype</th>
                      <th>Unit</th>
                      <th>Status</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in items" :key="item.id">
                      <td>
                        <code class="text-primary">{{ item.item_code || 'N/A' }}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{{ item.name }}</strong>
                          <p v-if="item.description" class="text-muted mb-0 small">{{ truncate(item.description, 60) }}</p>
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-secondary">{{ item.group?.name || 'N/A' }}</span>
                      </td>
                      <td>
                        <span v-if="item.subtype" class="badge" :class="getSubtypeBadgeClass(item.subtype)">
                          {{ formatSubtype(item.subtype) }}
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>{{ item.unitOfMeasurement?.name || '-' }}</td>
                      <td>
                        <span class="badge" :class="item.is_active ? 'bg-success' : 'bg-danger'">
                          {{ item.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary" @click="viewItem(item)" title="View Details">
                            <i class="fa fa-eye"></i>
                          </button>
                          <button class="btn btn-outline-secondary" @click="editItem(item)" title="Edit">
                            <i class="fa fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="confirmDelete(item)" title="Delete">
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="pagination.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} items
                  </div>
                  <nav>
                    <ul class="pagination mb-0">
                      <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                        <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page - 1)">Previous</a>
                      </li>
                      <li
                        v-for="page in visiblePages"
                        :key="page"
                        class="page-item"
                        :class="{ active: pagination.current_page === page }"
                      >
                        <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                      </li>
                      <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                        <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page + 1)">Next</a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-5 text-muted">
                <i class="fa fa-box-open fa-3x mb-3"></i>
                <p>No items found.</p>
                <button class="btn btn-primary" @click="openAddModal">
                  <i class="fa fa-plus me-2"></i>Add Your First Item
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-box me-2"></i>
              {{ editingItem ? 'Edit Item' : 'Add New Item' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveItem">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Item Group <span class="text-danger">*</span></label>
                  <select v-model="form.item_group_id" class="form-select" required>
                    <option :value="null">Select Group</option>
                    <option v-for="group in itemGroups" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Item Code</label>
                  <input v-model="form.item_code" type="text" class="form-control" placeholder="e.g., SE-001" />
                </div>
                <div class="col-12">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="form.name" type="text" class="form-control" required placeholder="Item name" />
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea v-model="form.description" class="form-control" rows="3" placeholder="Item description"></textarea>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Subtype</label>
                  <select v-model="form.subtype" class="form-select">
                    <option :value="null">None</option>
                    <option value="SAFARI_EXTRA">Safari Extra</option>
                    <option value="TROPHY_FEE">Trophy Fee</option>
                    <option value="SPECIES">Species</option>
                    <option value="PACKAGE">Package</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Unit of Measurement</label>
                  <select v-model="form.unit_of_measurement_id" class="form-select">
                    <option :value="null">None</option>
                    <option v-for="unit in units" :key="unit.id" :value="unit.id">
                      {{ unit.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <div class="form-check mt-4">
                    <input v-model="form.is_sellable" type="checkbox" class="form-check-input" id="isSellable" />
                    <label class="form-check-label" for="isSellable">Is Sellable</label>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-check mt-4">
                    <input v-model="form.is_purchasable" type="checkbox" class="form-check-input" id="isPurchasable" />
                    <label class="form-check-label" for="isPurchasable">Is Purchasable</label>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-check mt-4">
                    <input v-model="form.is_active" type="checkbox" class="form-check-input" id="isActive" />
                    <label class="form-check-label" for="isActive">Is Active</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveItem" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingItem ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show"></div>

    <!-- View Details Modal -->
    <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-info-circle me-2"></i>
              Item Details
            </h5>
            <button type="button" class="btn-close" @click="showViewModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="viewingItem" class="row g-3">
              <div class="col-md-6">
                <label class="text-muted small">Item Code</label>
                <p class="fw-bold">{{ viewingItem.item_code || 'N/A' }}</p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Status</label>
                <p>
                  <span class="badge" :class="viewingItem.is_active ? 'bg-success' : 'bg-danger'">
                    {{ viewingItem.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </p>
              </div>
              <div class="col-12">
                <label class="text-muted small">Name</label>
                <p class="fw-bold">{{ viewingItem.name }}</p>
              </div>
              <div class="col-12" v-if="viewingItem.description">
                <label class="text-muted small">Description</label>
                <p>{{ viewingItem.description }}</p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Item Group</label>
                <p>{{ viewingItem.group?.name || 'N/A' }}</p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Subtype</label>
                <p>
                  <span v-if="viewingItem.subtype" class="badge" :class="getSubtypeBadgeClass(viewingItem.subtype)">
                    {{ formatSubtype(viewingItem.subtype) }}
                  </span>
                  <span v-else>-</span>
                </p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Unit of Measurement</label>
                <p>{{ viewingItem.unitOfMeasurement?.name || '-' }}</p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Company ID</label>
                <p>{{ viewingItem.company_id }}</p>
              </div>
              <div class="col-md-4">
                <label class="text-muted small">Is Sellable</label>
                <p>
                  <span class="badge" :class="viewingItem.is_sellable ? 'bg-success' : 'bg-secondary'">
                    {{ viewingItem.is_sellable ? 'Yes' : 'No' }}
                  </span>
                </p>
              </div>
              <div class="col-md-4">
                <label class="text-muted small">Is Purchasable</label>
                <p>
                  <span class="badge" :class="viewingItem.is_purchasable ? 'bg-success' : 'bg-secondary'">
                    {{ viewingItem.is_purchasable ? 'Yes' : 'No' }}
                  </span>
                </p>
              </div>
              <div class="col-md-4">
                <label class="text-muted small">Track Inventory</label>
                <p>
                  <span class="badge" :class="viewingItem.track_inventory ? 'bg-success' : 'bg-secondary'">
                    {{ viewingItem.track_inventory ? 'Yes' : 'No' }}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Created At</label>
                <p>{{ formatDate(viewingItem.created_at) }}</p>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Updated At</label>
                <p>{{ formatDate(viewingItem.updated_at) }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
            <button type="button" class="btn btn-primary" @click="editItem(viewingItem); showViewModal = false">
              <i class="fa fa-edit me-1"></i>Edit
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showViewModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

// State
const items = ref<any[]>([])
const itemGroups = ref<any[]>([])
const units = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showViewModal = ref(false)
const editingItem = ref<any>(null)
const viewingItem = ref<any>(null)

// Filters
const filters = ref({
  item_group_id: null as number | null,
  subtype: null as string | null,
  is_active: null as boolean | null,
  search: '',
  page: 1,
  per_page: 20,
})

// Pagination
const pagination = ref({
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
  total: 0,
})

// Form
const form = ref({
  item_group_id: null as number | null,
  name: '',
  description: '',
  item_code: '',
  unit_of_measurement_id: null as number | null,
  subtype: null as string | null,
  is_sellable: true,
  is_purchasable: false,
  is_active: true,
})

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL || ''

// Computed
const visiblePages = computed(() => {
  const pages = []
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  
  // Show max 5 pages
  let start = Math.max(1, current - 2)
  let end = Math.min(last, start + 4)
  
  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const fetchItems = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    
    if (filters.value.item_group_id) params.append('item_group_id', filters.value.item_group_id.toString())
    if (filters.value.subtype) params.append('subtype', filters.value.subtype)
    if (filters.value.is_active !== null) params.append('is_active', filters.value.is_active.toString())
    if (filters.value.search) params.append('search', filters.value.search)
    params.append('page', filters.value.page.toString())
    params.append('per_page', filters.value.per_page.toString())
    
    const response = await axios.get(`${apiBaseUrl}settings/items?${params.toString()}`)
    
    if (response.data.data && Array.isArray(response.data.data)) {
      items.value = response.data.data
      if (response.data.meta) {
        pagination.value = response.data.meta
      }
    } else if (Array.isArray(response.data)) {
      items.value = response.data
    }
  } catch (error) {
    console.error('Error fetching items:', error)
    Swal.fire({
      title: 'Error',
      text: 'Failed to load items',
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
}

const fetchItemGroups = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}settings/item-groups`)
    itemGroups.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching item groups:', error)
  }
}

const fetchUnits = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}settings/units`)
    units.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching units:', error)
  }
}

let searchTimeout: any = null
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.page = 1
    fetchItems()
  }, 500)
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.last_page) {
    filters.value.page = page
    fetchItems()
  }
}

const openAddModal = () => {
  editingItem.value = null
  form.value = {
    item_group_id: null,
    name: '',
    description: '',
    item_code: '',
    unit_of_measurement_id: null,
    subtype: null,
    is_sellable: true,
    is_purchasable: false,
    is_active: true,
  }
  showModal.value = true
}

const editItem = (item: any) => {
  editingItem.value = item
  form.value = {
    item_group_id: item.item_group_id,
    name: item.name,
    description: item.description || '',
    item_code: item.item_code || '',
    unit_of_measurement_id: item.unit_of_measurement_id,
    subtype: item.subtype,
    is_sellable: item.is_sellable,
    is_purchasable: item.is_purchasable,
    is_active: item.is_active,
  }
  showModal.value = true
}

const viewItem = (item: any) => {
  viewingItem.value = item
  showViewModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const saveItem = async () => {
  if (!form.value.item_group_id || !form.value.name) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please fill in all required fields',
      icon: 'warning',
    })
    return
  }
  
  saving.value = true
  try {
    let response
    if (editingItem.value) {
      response = await axios.put(`${apiBaseUrl}settings/items/${editingItem.value.id}`, form.value)
    } else {
      response = await axios.post(`${apiBaseUrl}settings/items`, form.value)
    }
    
    Swal.fire({
      title: 'Success!',
      text: `Item ${editingItem.value ? 'updated' : 'created'} successfully`,
      icon: 'success',
      timer: 1500,
    })
    
    closeModal()
    fetchItems()
  } catch (error: any) {
    console.error('Error saving item:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || 'Failed to save item',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: any) => {
  Swal.fire({
    title: 'Delete Item?',
    text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiBaseUrl}settings/items/${item.id}`)
        Swal.fire('Deleted!', 'Item has been deleted.', 'success')
        fetchItems()
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete item', 'error')
      }
    }
  })
}

const getSubtypeBadgeClass = (subtype: string) => {
  const classes: Record<string, string> = {
    SAFARI_EXTRA: 'bg-info',
    TROPHY_FEE: 'bg-warning text-dark',
    SPECIES: 'bg-success',
    PACKAGE: 'bg-primary',
  }
  return classes[subtype] || 'bg-secondary'
}

const formatSubtype = (subtype: string) => {
  const labels: Record<string, string> = {
    SAFARI_EXTRA: 'Safari Extra',
    TROPHY_FEE: 'Trophy Fee',
    SPECIES: 'Species',
    PACKAGE: 'Package',
  }
  return labels[subtype] || subtype
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

const truncate = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Lifecycle
onMounted(() => {
  fetchItemGroups()
  fetchUnits()
  fetchItems()
})
</script>

<style scoped>
.manage-items-page {
  padding: 1rem;
}

.breadcrumb {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.breadcrumb-item {
  margin-right: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '/';
  margin-right: 0.5rem;
  color: #6c757d;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.breadcrumb-item a {
  color: #0d6efd;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.modal.show {
  display: block !important;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style>
