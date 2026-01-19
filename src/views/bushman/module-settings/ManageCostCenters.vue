<template>
  <div class="manage-cost-centers-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Cost Centers</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Cost Centers</h2>
                <p class="text-muted mb-0 small">
                  Manage accounting dimension types and values used for requisition allocations.
                </p>
              </div>
            </div>

            <!-- Add Form -->
            <div v-if="showForm" class="card mb-3 border-primary">
              <div class="card-body">
                <div class="row g-2">
                  <div class="col-md-2">
                    <label class="form-label">Entry Type</label>
                    <select v-model="formType" class="form-select form-select-sm" @change="onFormTypeChange">
                      <option :value="null">Select...</option>
                      <option value="type">Type</option>
                      <option value="value">Value</option>
                    </select>
                  </div>
                  <div v-if="formType === 'value'" class="col-md-3">
                    <label class="form-label">Dimension Type</label>
                    <select v-model="unifiedForm.dimension_type_id" class="form-select form-select-sm">
                      <option :value="null">Select type...</option>
                      <option v-for="t in dimensionTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Code</label>
                    <input v-model="unifiedForm.code" type="text" class="form-control form-control-sm" :placeholder="formType === 'type' ? 'COSTCENTER' : 'CC001'" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Name</label>
                    <input v-model="unifiedForm.name" type="text" class="form-control form-control-sm" :placeholder="formType === 'type' ? 'Cost Center' : 'IT Department'" />
                  </div>
                  <div class="col-md-2 d-flex align-items-end">
                    <div class="form-check">
                      <input v-model="unifiedForm.is_active" type="checkbox" class="form-check-input" id="unifiedActive" />
                      <label class="form-check-label" for="unifiedActive">Active</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <button class="btn btn-sm btn-primary" @click="createEntry" :disabled="saving">
                      <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                      <i v-else class="fa fa-save me-1"></i>
                      Save {{ formType === 'type' ? 'Type' : 'Value' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Combined Data Table -->
            <StandardDataTable 
              :columns="combinedColumns" 
              :data="combinedData" 
              :loading="loading" 
              :disable-search="false"
              :disable-pagination="false" 
              :action-buttons="combinedActions" 
              :show-date-filters="false">

              <template #parent_type="{ row }">
                <span v-if="row.parent_type" class="text-muted">{{ row.parent_type }}</span>
                <span v-else class="text-muted">-</span>
              </template>

              <template #code="{ row }">
                {{ row.code }}
              </template>

              <template #name="{ row }">
                {{ row.name }}
              </template>

              <template #is_active="{ row }">
                <span class="badge" :class="row.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
              </template>
            </StandardDataTable>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL || ''
const dimensionBase = `${apiBaseUrl}accounting-dimensions`

const loading = ref(false)
const saving = ref(false)

const dimensionTypes = ref<any[]>([])
const dimensionValues = ref<any[]>([])

const showForm = ref(false)
const formType = ref('value')

const unifiedForm = ref({
  dimension_type_id: null as number | null,
  code: '',
  name: '',
  is_active: true,
})

// Combined data from dimension values only (hide types)
const combinedData = computed(() => {
  const values = dimensionValues.value.map(v => ({
    ...v,
    parent_type: v.typeName,
  }))
 
  return values.sort((a, b) => {
    return (a.name || '').localeCompare(b.name || '')
  })
})

// Columns for combined table
const combinedColumns = [
  { key: 'parent_type', label: 'Type', sortable: true, visible: true },
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'is_active', label: 'Status', sortable: true, visible: true },
]

// Combined action buttons
const combinedActions = computed(() => [
  { 
    label: showForm.value ? 'Cancel' : 'Add Entry', 
    icon: showForm.value ? 'fa fa-times' : 'fa fa-plus', 
    class: showForm.value ? 'btn btn-secondary' : 'btn btn-primary', 
    method: () => toggleForm() 
  },
  { 
    label: 'Refresh', 
    icon: 'fa fa-refresh', 
    class: 'btn btn-outline-primary', 
    method: () => refreshAll() 
  },
])

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) {
    resetForm()
  }
}

const resetForm = () => {
  unifiedForm.value = {
    dimension_type_id: null,
    code: '',
    name: '',
    is_active: true,
  }
}

const onFormTypeChange = () => {
  resetForm()
}

const refreshAll = async () => {
  await Promise.all([fetchDimensionTypes(), fetchDimensionValues()])
}

const fetchDimensionTypes = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${dimensionBase}/types`)
    const data = response.data?.data || response.data || []
    dimensionTypes.value = (Array.isArray(data) ? data : []).map((t: any) => ({
      id: t.id,
      code: t.code || '',
      name: t.name || '',
      is_active: t.is_active === undefined ? !!t.active : !!t.is_active,
    }))
  } catch (error) {
    dimensionTypes.value = []
  } finally {
    loading.value = false
  }
}

const fetchDimensionValues = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${dimensionBase}/values`)
    const data = response.data?.data || response.data || []
    dimensionValues.value = (Array.isArray(data) ? data : []).map((v: any) => ({
      id: v.id,
      code: v.code || '',
      name: v.name || '',
      dimension_type_id: v.dimension_type_id || v.dimension_type?.id || null,
      typeName: v.dimension_type?.name || '',
      is_active: v.is_active === undefined ? !!v.active : !!v.is_active,
    }))
  } catch (error) {
    dimensionValues.value = []
  } finally {
    loading.value = false
  }
}

const createEntry = async () => {
  if (formType.value === 'type') {
    if (!unifiedForm.value.code || !unifiedForm.value.name) {
      Swal.fire('Error', 'Code and name are required for dimension type.', 'error')
      return
    }
    saving.value = true
    try {
      await axios.post(`${dimensionBase}/types`, {
        code: unifiedForm.value.code,
        name: unifiedForm.value.name,
        is_active: unifiedForm.value.is_active,
      })
      resetForm()
      showForm.value = false
      await fetchDimensionTypes()
      Swal.fire('Success', 'Dimension type created.', 'success')
    } catch (error: any) {
      Swal.fire('Error', error?.response?.data?.message || 'Failed to create dimension type.', 'error')
    } finally {
      saving.value = false
    }
  } else {
    if (!unifiedForm.value.dimension_type_id || !unifiedForm.value.code || !unifiedForm.value.name) {
      Swal.fire('Error', 'Dimension type, code, and name are required for dimension value.', 'error')
      return
    }
    saving.value = true
    try {
      await axios.post(`${dimensionBase}/values`, {
        dimension_type_id: unifiedForm.value.dimension_type_id,
        code: unifiedForm.value.code,
        name: unifiedForm.value.name,
        is_active: unifiedForm.value.is_active,
      })
      resetForm()
      showForm.value = false
      await fetchDimensionValues()
      Swal.fire('Success', 'Dimension value created.', 'success')
    } catch (error: any) {
      Swal.fire('Error', error?.response?.data?.message || 'Failed to create dimension value.', 'error')
    } finally {
      saving.value = false
    }
  }
}

onMounted(async () => {
  await Promise.all([fetchDimensionTypes(), fetchDimensionValues()])
})
</script>

<style scoped>
.manage-cost-centers-page {
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
</style>
