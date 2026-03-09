<template>
  <div class="inspection-settings-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Settings</a></li>
          <li class="breadcrumb-item active">Inspection Settings</li>
        </ul>
      </div>
    </div>

    <!-- ==================== LIST VIEW ==================== -->
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
                <!-- @vue-ignore -->
                <template #category="{ row }">
                  <span v-if="row.category?.name || getCategoryName(row.maintenance_category_id)" class="badge bg-info text-dark">
                    {{ row.category?.name || getCategoryName(row.maintenance_category_id) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </template>
                <!-- @vue-ignore -->
                <template #question_type="{ row }">
                  <span class="badge bg-secondary">{{ getDataTypeLabel(row.question_type || row.data_type || 'text') }}</span>
                </template>
                <!-- @vue-ignore -->
                <template #unit="{ row }">
                  {{ row.unit || '-' }}
                </template>
                <!-- @vue-ignore -->
                <template #is_active="{ row }">
                  <span :class="(row.active ?? row.is_active) ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ (row.active ?? row.is_active) ? 'Active' : 'Inactive' }}
                  </span>
                </template>
                <!-- @vue-ignore -->
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

    <!-- ==================== CREATE / EDIT FORM ==================== -->
    <template v-else>
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center">
          <h5 class="mb-0">
            <i :class="editMode ? 'fa fa-edit text-warning' : 'fa fa-plus-circle text-primary'" class="me-2"></i>
            {{ editMode ? 'Edit Maintenance Parameter' : 'Add New Parameter' }}
          </h5>
          <button type="button" class="btn btn-secondary btn-sm ms-auto" @click="goBack">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
        </div>
        <div class="card-body">
          <form @submit.prevent="onSubmit" novalidate>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Parameter Name <span class="text-danger">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="e.g., Oil Level, Tyre Pressure, Brake Pads"
                  required
                />
                <div class="form-text">The parameter name that will appear on inspection checklists</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Category</label>
                <div class="d-flex gap-2">
                  <div class="flex-grow-1">
                    <Multiselect
                      v-if="!showNewCategory"
                      v-model="form.category"
                      :options="categories"
                      label="name"
                      track-by="id"
                      placeholder="Select category..."
                      :searchable="true"
                      :allowEmpty="true"
                    />
                    <div v-else>
                      <input
                        v-model="newCategoryName"
                        type="text"
                        class="form-control"
                        placeholder="New category name..."
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    @click="toggleNewCategory"
                    :title="showNewCategory ? 'Select existing' : 'Create new category'"
                    style="height: 38px; min-width: 38px;"
                  >
                    <i :class="showNewCategory ? 'fa fa-list' : 'fa fa-plus'"></i>
                  </button>
                  <button
                    v-if="showNewCategory && newCategoryName.trim().length >= 2"
                    type="button"
                    class="btn btn-success btn-sm"
                    @click="createCategoryInline"
                    :disabled="savingCategory"
                    title="Save new category"
                    style="height: 38px; min-width: 38px;"
                  >
                    <span v-if="savingCategory" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="fa fa-check"></i>
                  </button>
                </div>
                <div class="form-text">Group this parameter under a maintenance category</div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Data Type</label>
                <select v-model="form.data_type" class="form-select">
                  <option value="boolean">Pass / Fail</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown</option>
                  <option value="rating">Rating (1-5)</option>
                </select>
                <div class="form-text">How the inspector will record this parameter</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Unit of Measure</label>
                <Multiselect
                  v-model="form.uom"
                  :options="unitsOfMeasurement"
                  label="name"
                  track-by="id"
                  placeholder="Select unit..."
                  :searchable="true"
                  :allowEmpty="true"
                >
                  <template #option="{ option }">
                    {{ option.name }} <span v-if="option.code" class="text-muted">({{ option.code }})</span>
                  </template>
                  <template #singleLabel="{ value }">
                    {{ value.name }} <span v-if="value.code" class="text-muted">({{ value.code }})</span>
                  </template>
                </Multiselect>
                <div class="form-text">Select the unit of measurement for this parameter</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Asset Group</label>
                <select v-model="form.asset_group_id" class="form-select">
                  <option :value="null">-- None --</option>
                  <option v-for="group in assetGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
                </select>
                <div class="form-text">Optionally link to an asset group</div>
              </div>
            </div>

            <div class="row mb-3" v-if="form.data_type === 'select'">
              <div class="col-md-12">
                <label class="form-label">Options (comma-separated)</label>
                <input
                  v-model="form.options"
                  type="text"
                  class="form-control"
                  placeholder="e.g., Good, Fair, Poor, Critical"
                />
                <div class="form-text">Enter the dropdown options separated by commas</div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-12">
                <label class="form-label">Description</label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="2"
                  placeholder="Describe what the inspector should check..."
                ></textarea>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <div class="form-check form-switch mt-1">
                  <input v-model="form.is_active" type="checkbox" class="form-check-input settings-switch" id="paramActive" role="switch" />
                  <label class="form-check-label" for="paramActive">
                    <span :class="form.is_active ? 'text-success fw-bold' : 'text-secondary'">
                      {{ form.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </label>
                </div>
                <div class="form-text">Inactive parameters won't appear in inspection templates</div>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mb-4">
              <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving || !isFormValid">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ editMode ? 'Update' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'
import { inspectionService } from '@/services/inspectionService'
import { assetGroupService } from '@/services/assetGroupService'
import { useNotification } from '@/composables/notification'

const { showAlert } = useNotification()

// ==================== State ====================
const items = ref<any[]>([])
const categories = ref<any[]>([])
const assetGroups = ref<any[]>([])
const unitsOfMeasurement = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const savingCategory = ref(false)
const showList = ref(true)
const editMode = ref(false)
const showNewCategory = ref(false)
const newCategoryName = ref('')

const form = reactive({
  id: null as number | null,
  name: '',
  description: '',
  category: null as any,
  data_type: 'boolean',
  uom: null as any,
  unit: '',
  options: '',
  is_active: true,
  asset_group_id: null as number | null
})

// ==================== Table Config ====================
const columns = ref([
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Parameter Name', sortable: true, visible: true },
  { key: 'category', label: 'Category', sortable: false, visible: true },
  { key: 'question_type', label: 'Data Type', sortable: true, visible: true },
  { key: 'unit', label: 'Unit', sortable: false, visible: true },
  { key: 'is_active', label: 'Status', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

const pageActions = computed(() => [
  { label: 'Refresh', icon: 'fa fa-sync-alt', class: 'btn btn-secondary', method: () => loadItems() },
  { label: 'Add Parameter', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => showCreateForm() }
])

// ==================== Computed ====================
const isFormValid = computed(() => (form.name || '').trim().length >= 2)

// ==================== Helpers ====================
function getCategoryName(id: number | null): string {
  if (!id) return ''
  const cat = categories.value.find((c: any) => c.id === id)
  return cat?.name || ''
}

const dataTypeLabels: Record<string, string> = {
  boolean: 'Pass / Fail',
  text: 'Text',
  number: 'Number',
  select: 'Dropdown',
  rating: 'Rating (1-5)'
}

function getDataTypeLabel(value: string): string {
  return dataTypeLabels[value] || value
}

// ==================== Data Loading ====================
async function loadItems() {
  loading.value = true
  try {
    const response = await inspectionService.listMaintenanceParameters()
    items.value = response.data.data || response.data || []
  } catch {
    showAlert('error', 'Failed to load maintenance parameters')
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const response = await inspectionService.listCategories()
    categories.value = response.data.data || response.data || []
  } catch {
    categories.value = []
  }
}

async function loadAssetGroups() {
  try {
    const response = await assetGroupService.listAssetGroups()
    assetGroups.value = response.data.data || response.data || []
  } catch {
    assetGroups.value = []
  }
}

async function loadUnitsOfMeasurement() {
  try {
    const response = await inspectionService.listUnitsOfMeasurement()
    unitsOfMeasurement.value = response.data.data || response.data || []
  } catch {
    unitsOfMeasurement.value = []
  }
}

// ==================== Form Actions ====================
function showCreateForm() {
  editMode.value = false
  resetForm()
  showList.value = false
}

function editItem(row: any) {
  editMode.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.category = row.category || categories.value.find((c: any) => c.id === row.maintenance_category_id) || null
  form.data_type = row.question_type || row.data_type || 'boolean'
  form.uom = row.unit_of_measurement || unitsOfMeasurement.value.find((u: any) => u.id === row.unit_of_measurement_id) || null
  form.unit = row.unit || ''
  form.options = row.options || ''
  form.is_active = row.active !== undefined ? !!row.active : (row.is_active !== false)
  form.asset_group_id = row.asset_group_id || null
  showList.value = false
}

function goBack() {
  resetForm()
  showList.value = true
  loadItems()
}

function resetForm() {
  form.id = null
  form.name = ''
  form.description = ''
  form.category = null
  form.data_type = 'boolean'
  form.uom = null
  form.unit = ''
  form.options = ''
  form.is_active = true
  form.asset_group_id = null
  editMode.value = false
  showNewCategory.value = false
  newCategoryName.value = ''
}

function toggleNewCategory() {
  showNewCategory.value = !showNewCategory.value
  if (!showNewCategory.value) newCategoryName.value = ''
}

async function createCategoryInline() {
  if (newCategoryName.value.trim().length < 2) return

  savingCategory.value = true
  try {
    const payload = {
      name: newCategoryName.value.trim(),
      asset_group_id: form.asset_group_id || null
    }
    const response = await inspectionService.createCategory(payload)
    const newCat = response.data.data || response.data
    await loadCategories()

    // Auto-select the newly created category
    form.category = categories.value.find((c: any) => c.id === newCat.id) || newCat
    showNewCategory.value = false
    newCategoryName.value = ''
    showAlert('success', 'Category created successfully')
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to create category')
  } finally {
    savingCategory.value = false
  }
}

async function onSubmit() {
  if (!isFormValid.value) {
    showAlert('warning', 'Please enter a valid name (min 2 characters).')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      maintenance_category_id: form.category?.id || null,
      question_type: form.data_type,
      unit_of_measurement_id: form.uom?.id || null,
      unit: form.uom?.name || form.unit?.trim() || null,
      options: form.data_type === 'select' ? form.options : null,
      active: form.is_active ? 1 : 0
    }

    if (editMode.value && form.id) {
      await inspectionService.updateMaintenanceParameter(form.id, payload)
      showAlert('success', 'Parameter updated successfully')
    } else {
      await inspectionService.createMaintenanceParameter(payload)
      showAlert('success', 'Parameter created successfully')
    }
    goBack()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to save parameter')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Delete "${row.name}"? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  })

  if (result.isConfirmed) {
    try {
      await inspectionService.deleteMaintenanceParameter(row.id)
      showAlert('success', 'Parameter deleted successfully')
      loadItems()
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to delete parameter')
    }
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadItems()
  loadCategories()
  loadAssetGroups()
  loadUnitsOfMeasurement()
})
</script>

<style lang="scss" scoped>
.inspection-settings-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;

  .breadcrumb-item {
    text-transform: uppercase !important;

    &::before {
      content: ' / ' !important;
      color: #9ca3af !important;
      padding: 0 0.5rem;
    }

    &:first-child::before {
      display: none !important;
    }

    a {
      text-transform: uppercase !important;
      color: #374151 !important;
      font-weight: 600;
      text-decoration: none !important;

      &:hover {
        color: #1f2937 !important;
        text-decoration: none !important;
      }
    }

    &.active {
      color: #9ca3af !important;
      font-weight: 400;
      text-transform: uppercase !important;
    }
  }
}

/* Force the status toggle switch to be visible */
.settings-switch {
  width: 3em !important;
  height: 1.5em !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  background-color: #dee2e6 !important;
  border: 1px solid #adb5bd !important;
  border-radius: 2em !important;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.25%29'/%3e%3c/svg%3e") !important;
  background-position: left center !important;
  background-repeat: no-repeat !important;
  background-size: contain !important;
  transition: background-position 0.15s ease-in-out, background-color 0.15s ease-in-out;

  &:checked {
    background-color: #198754 !important;
    border-color: #198754 !important;
    background-position: right center !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e") !important;
  }
}
</style>
