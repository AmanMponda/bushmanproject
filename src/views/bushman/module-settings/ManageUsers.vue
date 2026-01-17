<template>
  <div class="manage-users-page">
    <div class="d-flex justify-content-between align-items-center mb-4 px-4 pt-3">
      <div>
        <h5 class="mb-0">Users</h5>
        <small class="text-muted">Manage system users</small>
      </div>
    </div>

    <div class="card mx-4 mb-4">
      <StandardDataTable :columns="columns" :data="users" :loading="loading" :disable-search="false"
        :disable-pagination="false" :show-date-filters="false" :action-buttons="pageActions"
        :custom-filters="customFilters" @update:filters="handleFiltersUpdate">
        <template #username="{ row }">
          <span class="fw-semibold">{{ (row as any).username }}</span>
        </template>
        <template #full_name="{ row }">
          {{ fullName(row) }}
        </template>
        <template #email="{ row }">
          {{ (row as any).email }}
        </template>
        <template #roles="{ row }">
          <span v-if="(row as any).is_superuser" class="badge bg-danger me-1">Superuser</span>
          <span v-if="(row as any).is_staff" class="badge bg-info me-1">Staff</span>
          <span v-if="!(row as any).is_superuser && !(row as any).is_staff" class="badge bg-secondary">User</span>
        </template>
        <template #is_active="{ row }">
          <span :class="(row as any).is_active ? 'badge bg-success' : 'badge bg-secondary'">
            {{ (row as any).is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="d-flex gap-1">
            <button class="btn btn-info btn-sm" title="View" @click="openViewModal(row)">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-warning btn-sm" title="Edit" @click="openEditModal(row)">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </template>
      </StandardDataTable>
    </div>

    <div class="modal fade" tabindex="-1" :class="{ show: showFormModal }" style="display: block;" v-if="showFormModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? 'Edit User' : 'Add User' }}</h5>
            <button type="button" class="btn-close" @click="closeFormModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="row g-3">
                <div class="col-md-6" v-if="!isEditMode">
                  <label class="form-label">User ID</label>
                  <input v-model.number="form.id" type="number" class="form-control"
                    :class="{ 'is-invalid': fieldErrors.id }" placeholder="Optional ID" />
                  <div v-if="fieldErrors.id" class="invalid-feedback">{{ fieldErrors.id }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Username <span class="text-danger">*</span></label>
                  <input v-model.trim="form.username" type="text" class="form-control" maxlength="150"
                    :class="{ 'is-invalid': fieldErrors.username }" required />
                  <div v-if="fieldErrors.username" class="invalid-feedback">{{ fieldErrors.username }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input v-model.trim="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': fieldErrors.email }" required />
                  <div v-if="fieldErrors.email" class="invalid-feedback">{{ fieldErrors.email }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">First Name</label>
                  <input v-model.trim="form.first_name" type="text" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Last Name</label>
                  <input v-model.trim="form.last_name" type="text" class="form-control" />
                </div>
                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-check me-3">
                    <input class="form-check-input" type="checkbox" v-model="form.is_superuser" id="isSuperuserCheck">
                    <label class="form-check-label" for="isSuperuserCheck">Superuser</label>
                  </div>
                  <div class="form-check me-3">
                    <input class="form-check-input" type="checkbox" v-model="form.is_staff" id="isStaffCheck">
                    <label class="form-check-label" for="isStaffCheck">Staff</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="form.is_active" id="isActiveCheck">
                    <label class="form-check-label" for="isActiveCheck">Active</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeFormModal">Cancel</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveUser">
              {{ isEditMode ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" tabindex="-1" :class="{ show: showViewModal }" style="display: block;" v-if="showViewModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">User Details</h5>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body" v-if="viewUser">
            <div class="mb-3">
              <label class="form-label text-muted">User ID</label>
              <p class="fw-semibold">{{ viewUser.id }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Username</label>
              <p class="fw-semibold">{{ viewUser.username }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Full Name</label>
              <p class="fw-semibold">{{ fullName(viewUser) }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Email</label>
              <p class="fw-semibold">{{ viewUser.email }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Roles</label>
              <p class="fw-semibold">
                <span v-if="viewUser.is_superuser" class="badge bg-danger me-1">Superuser</span>
                <span v-if="viewUser.is_staff" class="badge bg-info me-1">Staff</span>
                <span v-if="!viewUser.is_superuser && !viewUser.is_staff" class="badge bg-secondary">User</span>
              </p>
            </div>
            <div class="mb-3">
              <label class="form-label text-muted">Active</label>
              <p class="fw-semibold">
                <span :class="viewUser.is_active ? 'badge bg-success' : 'badge bg-secondary'">
                  {{ viewUser.is_active ? 'Active' : 'Inactive' }}
                </span>
              </p>
            </div>
            <div class="mb-3" v-if="viewUser.date_joined">
              <label class="form-label text-muted">Date Joined</label>
              <p class="fw-semibold text-muted">{{ formatDate(viewUser.date_joined) }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeViewModal">Close</button>
            <button class="btn btn-primary" @click="editViewUser">Edit</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, reactive, onMounted, computed } from 'vue'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL

const loading = ref(false)
const saving = ref(false)

const users = ref<any[]>([])
const search = ref('')
const activeFilter = ref<'all' | 'active' | 'inactive'>('all')

const showFormModal = ref(false)
const showViewModal = ref(false)
const isEditMode = ref(false)
const editUserId = ref<number | null>(null)
const viewUser = ref<any>(null)

const fieldErrors = reactive<Record<string, string>>({})

const columns = [
  { key: 'username', label: 'USERNAME', sortable: true, visible: true },
  { key: 'full_name', label: 'FULL NAME', sortable: false, visible: true },
  { key: 'email', label: 'EMAIL', sortable: true, visible: true },
  { key: 'roles', label: 'ROLES', sortable: false, visible: true },
  { key: 'is_active', label: 'ACTIVE', sortable: true, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true },
]

const pageActions = computed(() => ([
  {
    label: 'Add New',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => openAddModal(),
  },
]))

const customFilters = computed(() => ([
  {
    key: 'is_active',
    label: 'Status',
    type: 'select',
    placeholder: 'All statuses',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    defaultValue: activeFilter.value,
  },
]))

const form = reactive({
  id: null as number | null,
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  is_superuser: false,
  is_staff: false,
  is_active: true,
})

const fullName = (user: any) => {
  const first = user.first_name || ''
  const last = user.last_name || ''
  const name = `${first} ${last}`.trim()
  return name || 'N/A'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const clearFieldErrors = () => {
  Object.keys(fieldErrors).forEach((key) => {
    fieldErrors[key] = ''
  })
}

const setFieldError = (field: string, message: string) => {
  fieldErrors[field] = message
}

const validateForm = () => {
  clearFieldErrors()
  let valid = true

  if (!isEditMode.value && form.id !== null && Number.isNaN(Number(form.id))) {
    setFieldError('id', 'User ID must be a number')
    valid = false
  }
  if (!form.username) {
    setFieldError('username', 'Username is required')
    valid = false
  }
  if (!form.email) {
    setFieldError('email', 'Email is required')
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    setFieldError('email', 'Enter a valid email address')
    valid = false
  }
  return valid
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (search.value.trim()) {
      params.search = search.value.trim()
    }
    if (activeFilter.value !== 'all') {
      params.is_active = activeFilter.value === 'active'
    }
    const token = localStorage.getItem('token')
    const response = await axios.get(`${apiBaseUrl}users`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    const payload = response?.data?.data ?? response?.data ?? []
    users.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    console.error('Failed to load users', error)
    Swal.fire('Error', 'Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.id = null
  form.username = ''
  form.email = ''
  form.first_name = ''
  form.last_name = ''
  form.is_superuser = false
  form.is_staff = false
  form.is_active = true
  clearFieldErrors()
}

const openAddModal = () => {
  isEditMode.value = false
  editUserId.value = null
  resetForm()
  showFormModal.value = true
}

const openEditModal = (user: any) => {
  isEditMode.value = true
  editUserId.value = user.id
  form.id = user.id ?? null
  form.username = user.username || ''
  form.email = user.email || ''
  form.first_name = user.first_name || ''
  form.last_name = user.last_name || ''
  form.is_superuser = !!user.is_superuser
  form.is_staff = !!user.is_staff
  form.is_active = user.is_active !== false
  clearFieldErrors()
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
}

const openViewModal = (user: any) => {
  viewUser.value = user
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  viewUser.value = null
}

const editViewUser = () => {
  if (viewUser.value) {
    closeViewModal()
    openEditModal(viewUser.value)
  }
}

const saveUser = async () => {
  if (!validateForm()) return

  saving.value = true
  const payload: any = {
    id: form.id ?? undefined,
    username: form.username,
    email: form.email,
    first_name: form.first_name || '',
    last_name: form.last_name || '',
    is_superuser: !!form.is_superuser,
    is_staff: !!form.is_staff,
    is_active: !!form.is_active,
    date_joined: new Date()
  }
  if (payload.id === undefined) {
    delete payload.id
  }

  try {
    const token = localStorage.getItem('token')
    if (isEditMode.value && editUserId.value) {
      await axios.put(`${apiBaseUrl}users/${editUserId.value}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      Swal.fire('Success', 'User updated successfully', 'success')
    } else {
      await axios.post(`${apiBaseUrl}users`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      Swal.fire('Success', 'User created successfully', 'success')
    }
    showFormModal.value = false
    await fetchUsers()
  } catch (error: any) {
    const response = error?.response
    if (response?.status === 422 && response?.data?.errors) {
      const errors = response.data.errors
      Object.keys(errors).forEach((key) => {
        const msg = Array.isArray(errors[key]) ? errors[key][0] : String(errors[key])
        setFieldError(key, msg)
      })
    }
    const messages = handleErrors(response || error)
    Swal.fire('Error', messages.join(', ') || 'Failed to save user', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (user: any) => {
  const result = await Swal.fire({
    title: 'Confirm Delete',
    text: `Delete user ${user?.username || ''}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
  })

  if (!result.isConfirmed) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`${apiBaseUrl}users/${user.id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    Swal.fire('Deleted!', 'User deleted successfully', 'success')
    await fetchUsers()
  } catch (error: any) {
    const messages = handleErrors(error?.response || error)
    Swal.fire('Error', messages.join(', ') || 'Failed to delete user', 'error')
  }
}

const handleFiltersUpdate = (filters: any) => {
  search.value = (filters.search || '').toString().trim()
  activeFilter.value = filters.is_active || 'all'
  fetchUsers()
}

onMounted(fetchUsers)
</script>

<style scoped>
.manage-users-page {
  min-height: 400px;
  background-color: #f5f6f8;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.modal.show {
  display: block;
  background: rgba(0, 0, 0, 0.4);
}
</style>
