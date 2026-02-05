<template>
  <div class="seasons-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales & Packages</a></li>
          <li class="breadcrumb-item active">Seasons</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
              >
                <template #id="{ row }">
                  {{ (row as any).id }}
                </template>
                <template #name="{ row }">
                  <span class="fw-semibold">{{ (row as any).name }}</span>
                </template>
                <template #description="{ row }">
                  {{ (row as any).description || '-' }}
                </template>
                <template #start_at="{ row }">
                  {{ formatDate((row as any).start_at) }}
                </template>
                <template #end_at="{ row }">
                  {{ formatDate((row as any).end_at) }}
                </template>
                <template #duration="{ row }">
                  {{ calculateDuration((row as any).start_at, (row as any).end_at) }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editItem(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create/Edit Form -->
    <template v-else>
      <div class="p-2">
        <form class="mb-3" @submit.prevent="onSubmit" novalidate>
          <h3 class="fw-bold mb-3">{{ editMode ? 'Edit Season' : 'New Season' }}</h3>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Name <span class="text-danger">*</span></label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="Enter Season Name (e.g., High Season)"
                required
                maxlength="200"
              />
              <div class="form-text">Unique season name (max 200 characters)</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Description</label>
              <textarea
                v-model="form.description"
                class="form-control"
                rows="2"
                placeholder="Enter Description (optional)"
              ></textarea>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Start Date <span class="text-danger">*</span></label>
              <Datepicker
                v-model="form.start_at"
                placeholder="Select start date"
              />
              <div class="form-text">Season start date (YYYY-MM-DD)</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">End Date <span class="text-danger">*</span></label>
              <Datepicker
                v-model="form.end_at"
                placeholder="Select end date"
              />
              <div class="form-text">Season end date (must be after or equal to start date)</div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-2">
            <button type="submit" class="btn btn-primary" :disabled="saving || !isFormValid">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editMode ? 'Update' : 'Save' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
          </div>
        </form>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Datepicker from '@/components/plugins/Datepicker.vue'
import Swal from 'sweetalert2'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL

const items = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showList = ref(true)
const editMode = ref(false)
const toast = useToast()

const form = reactive({
  id: null as number | null,
  name: '',
  description: '',
  start_at: '',
  end_at: '',
})

const columns = [
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'description', label: 'Description', sortable: true, visible: true },
  { key: 'start_at', label: 'Start Date', sortable: true, visible: true },
  { key: 'end_at', label: 'End Date', sortable: true, visible: true },
  { key: 'duration', label: 'Duration', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => {
  const actions = []
  if (showList.value) {
    actions.push({
      label: 'Add New',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => showCreateForm(),
    })
  }
  return actions
})

const isFormValid = computed((): boolean => {
  return !!(
    form.name.trim() &&
    form.start_at &&
    form.end_at &&
    form.end_at >= form.start_at
  )
})

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const calculateDuration = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return '-'
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '1 day'
    if (diffDays < 30) return `${diffDays + 1} days`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `~${months} month${months > 1 ? 's' : ''}`
    }
    const years = Math.floor(diffDays / 365)
    return `~${years} year${years > 1 ? 's' : ''}`
  } catch {
    return '-'
  }
}

const fetchSeasons = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${apiBaseUrl}settings/seasons`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    })
    items.value = response.data || []
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errors?.[0] || 'Failed to load seasons',
    })
  } finally {
    loading.value = false
  }
}

const showCreateForm = () => {
  editMode.value = false
  form.id = null
  form.name = ''
  form.description = ''
  form.start_at = ''
  form.end_at = ''
  showList.value = false
}

const editItem = (item: any) => {
  editMode.value = true
  form.id = item.id
  form.name = item.name
  form.description = item.description || ''
  form.start_at = item.start_at
  form.end_at = item.end_at
  showList.value = false
}

const goBack = () => {
  showList.value = true
  editMode.value = false
}

const onSubmit = async () => {
  if (!isFormValid.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please fill all required fields correctly',
    })
    return
  }

  saving.value = true
  try {
    const payload: any = {
      name: form.name.trim(),
      start_at: form.start_at,
      end_at: form.end_at,
    }
    
    if (form.description?.trim()) {
      payload.description = form.description.trim()
    }

    if (editMode.value && form.id) {
      await axios.put(
        `${apiBaseUrl}settings/seasons/${form.id}`,
        payload,
        { headers: { 'Content-Type': 'application/json', ...getAuthHeaders() } }
      )
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Season updated successfully',
        timer: 1500,
      })
    } else {
      await axios.post(
        `${apiBaseUrl}settings/seasons`,
        payload,
        { headers: { 'Content-Type': 'application/json', ...getAuthHeaders() } }
      )
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Season created successfully',
        timer: 1500,
      })
    }

    goBack()
    fetchSeasons()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errors?.[0] || 'Failed to save season',
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: any) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: `Delete season "${item.name}"? This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc3545',
  })

  if (!result.isConfirmed) return

  deleting.value = true
  try {
    await axios.delete(`${apiBaseUrl}settings/seasons/${item.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    })
    Swal.fire({
      icon: 'success',
      title: 'Deleted',
      text: 'Season deleted successfully',
      timer: 1500,
    })
    fetchSeasons()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errors?.[0] || 'Failed to delete season',
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchSeasons()
})
</script>

<style scoped>
.seasons-page .panel {
  border: 1px solid #e0e6ed;
}

.seasons-page .custom-table {
  background: white;
}

.form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}
</style>
