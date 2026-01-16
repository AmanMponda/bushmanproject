<template>
  <div class="species-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Species</li>
        </ul>
      </div>
    </div>

    <template v-if="showSpeciesList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable :columns="columns" :data="filteredItems" :loading="loading" :disable-search="false"
                :disable-pagination="false" :action-buttons="pageActions" :show-date-filters="false"
                :custom-filters="tableCustomFilters" @update:filters="handleFiltersUpdate">
                <template #select="{ row }">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" :id="`select-species-${row.id}`"
                      :checked="hasSelected(row.id)" @change="() => toggleSelect(row.id)" aria-label="Select species" />
                  </div>
                </template>

                <template #sn="{ row }">
                  {{ getSerial(row) }}
                </template>

                <template #name="{ row }">
                  {{ row.name }}
                </template>

                <template #animal_type="{ row }">
                  <span v-if="row.group?.name" class="badge bg-primary">
                    {{ row.group.name }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </template>

                <template #description="{ row }">
                  <span class="text-muted">{{ row.description || '-' }}</span>
                </template>

                <template #key_species="{ row }">
                  <div class="form-check form-switch m-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`key-species-${row.id}`"
                      :checked="isKeySpecies(row)"
                      :disabled="updatingKeyId === row.id"
                      @change="toggleKeySpecies(row)"
                    />
                  </div>
                </template>

                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View Details" @click="viewSpeciesDetails(row)"
                      aria-label="View species details">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="() => confirmDeleteSpecies(row)"
                      :disabled="deletingId === row.id || bulkDeleting" aria-label="Delete species">
                      <i v-if="deletingId !== row.id" class="fa fa-trash"></i>
                      <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Species Details View with Trophy Units -->
    <template v-else-if="showSpeciesDetails && currentSpecies">
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-outline-secondary btn-sm" @click="backToList">
              <i class="fa fa-arrow-left me-1"></i> Back
            </button>
            <div>
              <h5 class="mb-0">{{ currentSpecies.name }}</h5>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge" :class="currentSpecies.is_active ? 'bg-success' : 'bg-secondary'">
              {{ currentSpecies.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="card-body">
          <!-- Species Info -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="border rounded p-3 h-100">
                <h6 class="fw-bold text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Species Information</h6>
                <div class="mb-2">
                  <strong>Name:</strong> {{ currentSpecies.name }}
                </div>
                <div class="mb-2" v-if="currentSpecies.description">
                  <strong>Scientific Name:</strong> {{ currentSpecies.description }}
                </div>
                <div class="mb-2" v-if="currentSpecies.group">
                  <strong>Animal Type:</strong>
                  <span class="badge bg-primary">{{ currentSpecies.group.name }}</span>
                </div>
                <div class="mb-2" v-if="currentSpecies.group?.parent">
                  <strong>Taxonomy:</strong>
                  <span class="text-muted">{{ currentSpecies.group.parent.name }}</span> › 
                  <span class="fw-semibold">{{ currentSpecies.group.name }}</span>
                </div>
                <div class="mb-2">
                  <strong>Status:</strong>
                  <span class="badge" :class="currentSpecies.is_active ? 'bg-success' : 'bg-secondary'">
                    {{ currentSpecies.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="border rounded p-3 h-100 bg-light">
                <h6 class="fw-bold text-success mb-3"><i class="fa fa-trophy me-2"></i>Trophy Units Summary</h6>
                <div class="d-flex align-items-center justify-content-center" style="min-height: 80px;">
                  <div class="text-center">
                    <h2 class="mb-0 text-success">{{ specieUnits.length }}</h2>
                    <small class="text-muted">Trophy Unit(s) Registered</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trophy Units Section -->
          <div class="border rounded p-3">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h6 class="fw-bold mb-0"><i class="fa fa-trophy text-warning me-2"></i>Trophy Units (Skull, Horns, etc.)
              </h6>
              <button class="btn btn-primary btn-sm" @click="openAddUnitForm" v-if="!showUnitForm">
                <i class="fa fa-plus me-1"></i> Add Trophy Unit
              </button>
            </div>

            <!-- Add/Edit Unit Form -->
            <div v-if="showUnitForm" class="card border-primary mb-3">
              <div class="card-header bg-primary bg-opacity-10 py-2">
                <span class="fw-semibold">{{ editingUnit ? 'Edit Trophy Unit' : 'Add New Trophy Unit' }}</span>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Unit Name <span class="text-danger">*</span></label>
                    <input v-model="unitForm.name" type="text" class="form-control"
                      placeholder="e.g., Skull, Horns, Tusks, Hide" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Description</label>
                    <input v-model="unitForm.descriptions" type="text" class="form-control"
                      placeholder="Optional description" />
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-primary btn-sm" @click="saveUnit" :disabled="savingUnit">
                    <span v-if="savingUnit" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="fa fa-save me-1"></i>
                    {{ editingUnit ? 'Update' : 'Save' }}
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelUnitForm">Cancel</button>
                </div>
              </div>
            </div>

            <!-- Units List -->
            <div v-if="loadingUnits" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted mt-2 mb-0">Loading trophy units...</p>
            </div>

            <div v-else-if="specieUnits.length === 0" class="text-center py-4 text-muted">
              <i class="fa fa-box-open fa-3x mb-3 opacity-50"></i>
              <p class="mb-0">No trophy units registered for this species.</p>
              <p class="small">Click "Add Trophy Unit" to register skull, horns, or other collectible parts.</p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 60px">#</th>
                    <th>Unit Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th style="width: 120px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(unit, index) in specieUnits" :key="unit.id">
                    <td class="text-muted">{{ index + 1 }}</td>
                    <td class="fw-semibold">
                      <i class="fa fa-trophy text-warning me-2"></i>
                      {{ unit.name }}
                    </td>
                    <td class="text-muted">{{ unit.descriptions || '-' }}</td>
                    <td class="text-muted small">
                      {{ unit.created_at ? new Date(unit.created_at).toLocaleDateString() : '-' }}
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-outline-primary btn-sm" title="Edit" @click="openEditUnitForm(unit)">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" title="Delete" @click="deleteUnit(unit)">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="mb-0">
            <i :class="sform.id ? 'fa fa-edit text-warning' : 'fa fa-plus-circle text-primary'" class="me-2"></i>
            {{ sform.id ? 'Edit Species' : 'Add New Species' }}
          </h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="onSubmit">
            <!-- Edit form (for existing species) -->
            <div v-if="sform.id">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Species Name <span class="text-danger">*</span></label>
                  <input v-model="sform.name" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Animal Type (Group) <span class="text-danger">*</span></label>
                  <select v-model="sform.item_group_id" class="form-select" required>
                    <option :value="null">Select animal type...</option>
                    <option v-for="group in availableGroups" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </option>
                  </select>
                  <small class="text-muted">Select species group (e.g., Mammals, Birds) — taxonomy is managed at the group level.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Scientific Name</label>
                  <input v-model="sform.description" type="text" class="form-control" />
                </div>
                <div class="col-md-6 d-flex align-items-end">
                  <div class="form-check form-switch">
                    <input id="species-active" v-model="sform.is_active" class="form-check-input" type="checkbox" />
                    <label class="form-check-label" for="species-active">Active</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Create form with horizontal table input (rows = species entries) -->
            <div v-else>
              <MultiRowTableInput v-model="tableColumns" :fields="speciesTableFields" add-button-label="Add Species" />
            </div>

            <div class="d-flex gap-2 mb-4">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i class="fa fa-save me-1"></i> Save
              </button>
              <button type="button" class="btn btn-secondary" @click="showSpecies()">Cancel</button>
            </div>
          </form>

          <!-- CSV Import Section -->
          <!-- CSV Import Section -->
          <div class="border-top pt-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0">
                <i class="fa fa-file-csv me-2 text-success"></i>
                Bulk Import from CSV
              </h6>

              <a href="/assets/uploadsguide/species-upload1.csv" download class="btn btn-sm btn-outline-success">
                <i class="fa fa-download me-1"></i>
                Download Template
              </a>
            </div>

            <!-- Animal Type Selection -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                <i class="fa fa-layer-group me-1"></i>
                Select Animal Type <span class="text-danger">*</span>
              </label>
              <div class="btn-group w-100" role="group">
                <button
                  type="button"
                  class="btn"
                  :class="selectedAnimalType === 'Mammals' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="selectedAnimalType = 'Mammals'"
                >
                  <i class="fa fa-paw me-1"></i>
                  Mammals
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="selectedAnimalType === 'Birds' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="selectedAnimalType = 'Birds'"
                >
                  <i class="fa fa-dove me-1"></i>
                  Birds
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="selectedAnimalType === 'Reptiles' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="selectedAnimalType = 'Reptiles'"
                >
                  <i class="fa fa-dragon me-1"></i>
                  Reptiles
                </button>
              </div>
              <small class="text-muted d-block mt-1">
                <i class="fa fa-info-circle me-1"></i>
                This determines the item_group_id for imported species
              </small>
            </div>

            <CSVInput
              :column-fields="[
                { key: 'name', label: 'Name' },
                { key: 'description', label: 'Scientific Name' },
              ]"
              :model-value="items"
              duplicate-key-field="name"
              :allow-duplicates="true"
              @import="handleCsvImport"
            />

            <!-- Import Progress -->
            <div v-if="importInProgress" class="mt-3">
              <div class="card border-primary">
                <div class="card-body">
                  <div class="d-flex align-items-center gap-3 mb-2">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span class="fw-semibold">Importing species...</span>
                    <span class="text-muted">{{ importProcessed }} / {{ importTotal }}</span>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                      :style="{ width: importProgressPercent + '%' }"></div>
                  </div>
                  <div v-if="importResults.length > 0" class="mt-2">
                    <small class="text-success"><i class="fa fa-check me-1"></i>{{ importSuccessCount }}
                      succeeded</small>
                    <small v-if="importFailCount > 0" class="text-danger ms-3"><i class="fa fa-times me-1"></i>{{
                      importFailCount }} failed</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Import Results -->
            <div v-if="showImportResults && !importInProgress" class="mt-3">
              <div class="card" :class="importFailCount > 0 ? 'border-warning' : 'border-success'">
                <div class="card-header d-flex align-items-center justify-content-between py-2"
                  :class="importFailCount > 0 ? 'bg-warning bg-opacity-10' : 'bg-success bg-opacity-10'">
                  <span class="fw-semibold">
                    <i class="fa fa-check-circle text-success me-2" v-if="importFailCount === 0"></i>
                    <i class="fa fa-exclamation-triangle text-warning me-2" v-else></i>
                    Import Complete
                  </span>
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeImportResults">
                    <i class="fa fa-times"></i>
                  </button>
                </div>
                <div class="card-body">
                  <div class="row text-center">
                    <div class="col">
                      <h4 class="text-success mb-0">{{ importSuccessCount }}</h4>
                      <small class="text-muted">Imported</small>
                    </div>
                    <div class="col" v-if="importFailCount > 0">
                      <h4 class="text-danger mb-0">{{ importFailCount }}</h4>
                      <small class="text-muted">Failed</small>
                    </div>
                  </div>
                  <div v-if="importFailCount > 0" class="mt-3">
                    <p class="small text-muted mb-2">Failed items:</p>
                    <ul class="list-group list-group-flush small">
                      <li v-for="(r, i) in importResults.filter(x => !x.ok).slice(0, 10)" :key="i"
                        class="list-group-item py-1 px-2">
                        <i class="fa fa-times text-danger me-1"></i> {{ r.name }}
                        <span v-if="r.error" class="text-muted">- {{ Array.isArray(r.error) ? r.error.join(', ') :
                          r.error }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSpeciesStore } from '../../../stores/bushman/species-store'
import { useSpecieUnitsStore } from '../../../stores/bushman/specie-units-store'
import handleErrors from '../../../stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'
import CSVInput from '../reusables/CSVInput.vue'

const toast = useToast()
const quotaStore = useQuotaStore()
const speciesStore = useSpeciesStore()
const specieUnitsStore = useSpecieUnitsStore()

// State
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const showSpeciesList = ref(true)
const showSpeciesDetails = ref(false)
const currentSpecies = ref<any>(null)
const deletingId = ref<number | string | null>(null)
const bulkDeleting = ref(false)
const selectedIds = ref<Set<number | string>>(new Set())
const isDragOver = ref(false)
const updatingKeyId = ref<number | string | null>(null)

// Taxonomy filter state
const selectedAnimalType = ref<string>('')
const keySpeciesFilter = ref<string>('') // '', 'yes', 'no'
const availableGroups = ref<any[]>([])

// Species form
const sform = reactive({
  id: null as number | null,
  name: '',
  description: '',
  is_active: true,
  item_group_id: null as number | null,
})

// Table-like multi-column input state
const tableColumns = ref([
  { _id: 1, name: '', is_active: true },
])

// CSV Import State
const importInProgress = ref(false)
const importTotal = ref(0)
const importProcessed = ref(0)
const importResults = ref<any[]>([])
const showImportResults = ref(false)

// Trophy Units State
const specieUnits = ref<any[]>([])
const showUnitForm = ref(false)
const editingUnit = ref<any>(null)
const savingUnit = ref(false)
const loadingUnits = ref(false)
const unitForm = reactive({
  name: '',
  descriptions: '',
})

// Computed
const selectedCount = computed(() => selectedIds.value.size)

// Filtered items based on selected animal type and key species filter
const filteredItems = computed(() => {
  let list = items.value || []

  if (selectedAnimalType.value) {
    list = list.filter((item: any) => {
      const groupName = item.group?.name || ''
      return groupName === selectedAnimalType.value
    })
  }

  if (keySpeciesFilter.value === 'yes') {
    list = list.filter((item: any) => isKeySpecies(item))
  } else if (keySpeciesFilter.value === 'no') {
    list = list.filter((item: any) => !isKeySpecies(item))
  }

  return list
})

// Extract unique animal types from loaded species
const animalTypes = computed(() => {
  const types = new Set<string>()
  items.value.forEach((item: any) => {
    const groupName = item.group?.name
    if (groupName) {
      types.add(groupName)
    }
  })
  return Array.from(types).sort()
})

// Custom filters for the data table
const tableCustomFilters = computed(() => [
  {
    key: 'animal_type',
    label: 'Animal Type',
    type: 'select',
    placeholder: 'All',
    options: [
      { value: 'Mammals', label: 'Mammals' },
      { value: 'Bird', label: 'Bird' },
      { value: 'Reptiles', label: 'Reptiles' },
    ],
    defaultValue: '',
  },
  {
    key: 'key_species',
    label: 'Key Species',
    type: 'select',
    placeholder: 'All',
    options: [
      { value: 'yes', label: 'Key Species' },
    ],
    defaultValue: '',
  }
])

const hasSelected = (id: number | string) => selectedIds.value.has(id)

function handleFiltersUpdate(filters: any) {
  // Update the selected animal type and key species filter from the filters
  selectedAnimalType.value = filters.animal_type || ''
  keySpeciesFilter.value = filters.key_species || ''
}

function normalizeIsActive(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (value == null || value === '') return true
  const normalized = String(value).trim().toLowerCase()
  if (['false', '0', 'no', 'n', 'inactive'].includes(normalized)) return false
  return true
}

const importProgressPercent = computed(() => {
  return importTotal.value > 0 ? Math.round((importProcessed.value / importTotal.value) * 100) : 0
})

const importSuccessCount = computed(() => importResults.value.filter((r: any) => r.ok).length)
const importFailCount = computed(() => importResults.value.filter((r: any) => !r.ok).length)

// Functions
async function getSpeciesItems() {
  loading.value = true
  try {
    const response = await speciesStore.getSpecies()
    if (response.status === 200) {
      items.value = response.data || []
      
      // Extract unique groups from species data
      const groupsMap = new Map()
      items.value.forEach((item: any) => {
        if (item.group && item.group.id) {
          groupsMap.set(item.group.id, item.group)
        }
      })
      availableGroups.value = Array.from(groupsMap.values()).sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      )
    }
  } catch (error) {
    console.error('Error fetching species:', error)
  } finally {
    loading.value = false
  }
}

async function loadSpecieUnits(specieId: number) {
  try {
    const response = await specieUnitsStore.getSpecieUnits(specieId)
    if (response.status === 200) {
      specieUnits.value = response.data.data || []
    }
  } catch (error) {
    console.error('Error loading specie units:', error)
    specieUnits.value = []
  }
}

// Show species details (view) and load related units
async function viewSpeciesDetails(row: any) {
  if (!row || !row.id) return
  currentSpecies.value = row
  showSpeciesList.value = false
  showSpeciesDetails.value = true
  // load units for this species
  await loadSpecieUnits(row.id)
}

function backToList() {
  showSpeciesDetails.value = false
  showSpeciesList.value = true
  currentSpecies.value = null
  specieUnits.value = []
}

// Trophy unit helpers
function openEditUnitForm(unit: any) {
  editingUnit.value = unit || null
  unitForm.name = unit?.name || ''
  unitForm.descriptions = unit?.descriptions || ''
  showUnitForm.value = true
}

async function saveUnit() {
  if (!currentSpecies.value) return
  savingUnit.value = true
  try {
    if (editingUnit.value && editingUnit.value.id) {
      const resp = await specieUnitsStore.updateSpecieUnit(editingUnit.value.id, {
        name: unitForm.name,
        descriptions: unitForm.descriptions,
      })
      if (resp.status === 200) {
        toast.init({ message: 'Trophy unit updated', color: 'success' })
      }
    } else {
      const resp = await specieUnitsStore.createSpecieUnit({
        specie_id: currentSpecies.value.id,
        name: unitForm.name,
        descriptions: unitForm.descriptions,
      })
      if (resp.status === 201 || resp.status === 200) {
        toast.init({ message: 'Trophy unit created', color: 'success' })
      }
    }
    await loadSpecieUnits(currentSpecies.value.id)
    showUnitForm.value = false
    editingUnit.value = null
    unitForm.name = ''
    unitForm.descriptions = ''
  } catch (err: any) {
    toast.init({ message: handleErrors(err.response || err).join('\n') || 'Failed to save unit', color: 'danger' })
  } finally {
    savingUnit.value = false
  }
}

async function cancelUnitForm() {
  editingUnit.value = null
  unitForm.name = ''
  unitForm.descriptions = ''
  showUnitForm.value = false
}

async function deleteUnit(unit: any) {
  if (!unit || !unit.id) return
  const res = await Swal.fire({
    title: 'Delete trophy unit',
    text: `Delete "${unit.name || unit.id}"? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })
  if (!res.isConfirmed) return
  try {
    const r = await specieUnitsStore.deleteSpecieUnit(unit.id)
    if (r.status === 204 || r.status === 200) {
      toast.init({ message: 'Trophy unit deleted', color: 'success' })
      if (currentSpecies.value) await loadSpecieUnits(currentSpecies.value.id)
    }
  } catch (err: any) {
    toast.init({ message: handleErrors(err.response || err).join('\n') || 'Failed to delete unit', color: 'danger' })
  }

}

function openAddUnitForm() {
  editingUnit.value = null
  unitForm.name = ''
  unitForm.descriptions = ''
  showUnitForm.value = true
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function toggleAllCsvRows() {
  const newState = !allCsvRowsSelected.value
  csvPreviewData.value.forEach((r: any) => {
    if (!r._duplicate) r._selected = newState
  })
}

function clearCsvFile() {
  csvFile.value = null
  showCsvPreview.value = false
  csvHeaders.value = []
  csvRawRows.value = []
  csvPreviewData.value = []
  csvColumnMap.name = ''
  csvColumnMap.is_active = ''
}

function closeCsvPreview() {
  showCsvPreview.value = false
  clearCsvFile()
}

function closeImportResults() {
  showImportResults.value = false
  importResults.value = []
}

const speciesTableFields = computed(() => [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Species name', required: true, headerStyle: 'width:150px', cellStyle: 'width:150px' },
  { key: 'is_active', label: 'Active', type: 'select', required: true, options: [{ value: true, text: 'Active' }, { value: false, text: 'Inactive' }], headerStyle: 'width:120px', cellStyle: 'width:120px' },
])

const columns = [
  { key: 'select', label: '', sortable: false, visible: true },
  { key: 'sn', label: 'SN', sortable: false, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'animal_type', label: 'Animal Type', sortable: true, visible: true },
  { key: 'description', label: 'Scientific Name', sortable: true, visible: true },
  { key: 'key_species', label: 'Key Species', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => {
  const actions: any[] = []
  actions.push({ label: 'Add Species', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => showSpecies() })
  actions.push({ label: 'Export', icon: 'fa fa-file-excel', class: 'btn btn-success', method: () => exportSpeciesCSV() })
  actions.push({ label: 'Print Key Species', icon: 'fa fa-print', class: 'btn btn-outline-secondary', method: () => printKeySpecies() })
  // Add Delete Selected only when there is at least one selected item
  if (selectedCount.value > 0) {
    actions.push({
      label: `Delete selected (${selectedCount.value})`,
      icon: 'fa fa-trash',
      class: 'btn btn-danger',
      method: () => confirmBulkDelete(),
    })
  }
  return actions
})

function toggleSelect(id: number | string) {
  const set = selectedIds.value
  if (set.has(id)) set.delete(id)
  else set.add(id)
  // force update
  selectedIds.value = new Set(Array.from(set))
}

// Compute a serial number (1-based) across the current filtered list
function getSerial(row: any) {
  const idx = filteredItems.value.findIndex((it: any) => it.id === row.id)
  return idx >= 0 ? idx + 1 : ''
}

function isKeySpecies(row: any) {
  return row?.subtype === 'MAIN_SPECIE'
}

async function toggleKeySpecies(row: any) {
  if (!row || !row.id) return
  const nextSubtype = isKeySpecies(row) ? 'NORMAL_SPECIE' : 'MAIN_SPECIE'
  updatingKeyId.value = row.id
  try {
    const response = await speciesStore.updateSpecies(row.id, {
      name: row.name,
      scientific_name: row.description,
      is_active: row.is_active,
      subtype: nextSubtype,
    })
    if (response.status === 200) {
      row.subtype = nextSubtype
      toast.init({ message: `Species marked as ${nextSubtype === 'MAIN_SPECIE' ? 'key' : 'normal'}`, color: 'success' })
    }
  } catch (error: any) {
    const errors = handleErrors(error.response || error)
    toast.init({ message: errors.join('\n') || 'Failed to update key species', color: 'danger' })
  } finally {
    updatingKeyId.value = null
  }
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function confirmDeleteSpecies(row: any) {
  const id = row.id
  const name = row.name || id
  const confirmation = await Swal.fire({
    title: 'Delete species',
    html: `Are you sure you want to delete <strong>${name}</strong>?<br/><small>This may affect related records.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })

  if (!confirmation.isConfirmed) return

  deletingId.value = id
  try {
    const resp = await speciesStore.deleteSpecies(id, false)
    if (resp.status === 204 || resp.status === 200) {
      toast.init({ message: 'Species deleted', color: 'success' })
      // optimistic UI: remove locally
      items.value = items.value.filter((it: any) => it.id !== id)
      selectedIds.value.delete(id)
    }
  } catch (err: any) {
    const status = err?.response?.status
    const data = err?.response?.data
    if ((status === 409 || status === 500) && data) {
      // Show referenced objects and offer force delete. For 500 responses include details.
      const refs = data?.references || data?.referenced_objects || data?.details || []
      const listHtml = refs.length > 0 ? `<ul style="text-align:left">${refs
        .map((r: any) => `<li>${r?.label || r?.name || r?.id} (${r?.type || 'ref'})</li>`)
        .slice(0, 50)
        .join('')}</ul>` : '<em>No details provided</em>'

      const forceResult = await Swal.fire({
        title: 'Conflict: referenced by other records',
        html: `<p>The species is referenced by other records. Deleting it may affect them.</p>${listHtml}<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="force-delete-single"><label class="form-check-label" for="force-delete-single">Also remove references (force delete)</label></div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete (force)',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        preConfirm: () => {
          const cb: any = document.getElementById('force-delete-single') as HTMLInputElement
          return cb?.checked === true
        },
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
        buttonsStyling: false,
      })

      if (forceResult.isConfirmed && forceResult.value) {
        try {
          const r2 = await speciesStore.deleteSpecies(id, true)
          if (r2.status === 204 || r2.status === 200) {
            toast.init({ message: 'Species force-deleted', color: 'success' })
            items.value = items.value.filter((it: any) => it.id !== id)
            selectedIds.value.delete(id)
          }
        } catch (e: any) {
          toast.init({ message: handleErrors(e.response || e).join('\n') || 'Failed to force delete', color: 'danger' })
        }
      }
    } else {
      toast.init({ message: handleErrors(err.response || err).join('\n') || 'Failed to delete species', color: 'danger' })
    }
  } finally {
    deletingId.value = null
  }
}

async function confirmBulkDelete() {
  const ids = Array.from(selectedIds.value)
  if (!ids || ids.length === 0) {
    toast.init({ message: 'No species selected', color: 'info' })
    return
  }

  const preview = items.value.filter((it: any) => hasSelected(it.id)).slice(0, 10).map((i: any) => i.name || i.id)
  const html = `<p>Delete <strong>${ids.length}</strong> selected species?</p><p>Preview: ${preview.join(', ')}${items.value.length > 10 ? ', ...' : ''}</p><div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="force-delete-bulk"><label class="form-check-label" for="force-delete-bulk">Force delete (remove references)</label></div>`

  const result = await Swal.fire({
    title: 'Delete selected species',
    html,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    preConfirm: () => {
      const cb: any = document.getElementById('force-delete-bulk') as HTMLInputElement
      return cb?.checked === true
    },
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })

  if (!result.isConfirmed) return
  const force = !!result.value

  bulkDeleting.value = true
  try {
    const resp = await speciesStore.bulkDelete(ids, force)
    // Handle per-item results if provided
    if (resp.status === 200) {
      const resData = resp.data
      if (resData && resData.results && Array.isArray(resData.results)) {
        const succeeded = resData.results.filter((r: any) => r.status === 'ok' || r.status === 'deleted').map((r: any) => r.id)
        const failed = resData.results.filter((r: any) => r.status !== 'ok' && r.status !== 'deleted')
        if (succeeded.length > 0) {
          items.value = items.value.filter((it: any) => !succeeded.includes(it.id))
        }
        if (failed.length > 0) {
          const reasons = failed.map((f: any) => `${f.id}: ${f.message || f.reason || 'blocked'}`).join('\n')
          toast.init({ message: `Some items failed:\n${reasons}`, color: 'warning' })
        } else {
          toast.init({ message: `Deleted ${succeeded.length} species`, color: 'success' })
        }
      } else {
        // Generic success
        toast.init({ message: 'Selected species deleted', color: 'success' })
        // Remove locally
        items.value = items.value.filter((it: any) => !(selectedIds.value && typeof selectedIds.value.has === 'function' && selectedIds.value.has(it.id)))
      }
      clearSelection()
    }
  } catch (err: any) {
    const status = err?.response?.status
    const data = err?.response?.data
    // Backends may return 409 (conflict) or 500 with integrity details. Handle both.
    if ((status === 409 || status === 500) && data) {
      const blocked = data?.blocked || data?.details || data?.referenced_objects || []
      // If server returned SQL integrity details, include them in modal and don't offer silent deletion
      const listHtml = Array.isArray(blocked) && blocked.length > 0 ? `<ul style="text-align:left">${blocked.map((b: any) => `<li>${b.id || b?.name || ''}: ${b.reason || b.message || b || 'referenced'}</li>`).join('')}</ul>` : `<pre style="text-align:left;white-space:pre-wrap">${String(data?.details || data?.error || JSON.stringify(data))}</pre>`
      const forceResult = await Swal.fire({
        title: 'Some items are referenced or blocked',
        html: `<p>Some selected species are referenced by other records or cannot be deleted due to constraints.</p>${listHtml}<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="force-delete-bulk-2"><label class="form-check-label" for="force-delete-bulk-2">Attempt force delete (may fail)</label></div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Attempt force delete',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          const cb: any = document.getElementById('force-delete-bulk-2') as HTMLInputElement
          return cb?.checked === true
        },
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
        buttonsStyling: false,
      })
      if (forceResult.isConfirmed && forceResult.value) {
        try {
          const r2 = await speciesStore.bulkDelete(ids, true)
          if (r2.status === 200) {
            toast.init({ message: 'Force delete completed', color: 'success' })
            items.value = items.value.filter((it: any) => !(selectedIds.value && typeof selectedIds.value.has === 'function' && selectedIds.value.has(it.id)))
            clearSelection()
          }
        } catch (e: any) {
          toast.init({ message: handleErrors(e.response || e).join('\n') || 'Bulk force delete failed', color: 'danger' })
        }
      }
    } else {
      toast.init({ message: handleErrors(err.response || err).join('\n') || 'Bulk delete failed', color: 'danger' })
    }
  } finally {
    bulkDeleting.value = false
  }
}

function exportSpeciesCSV() {
  if (!items.value || items.value.length === 0) {
    toast.init({ message: 'No species to export', color: 'info' })
    return
  }

  const headers = ['ID', 'Name', 'Active']
  const rows = items.value.map((it: any) => [it.id, it.name, it.is_active ? 'true' : 'false'])

  const csvContent = [headers, ...rows].map((e) => e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const filename = `species-${new Date().toISOString().slice(0, 10)}.csv`
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename)
  } else {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

function printKeySpecies() {
  const keySpecies = (items.value || []).filter((it: any) => isKeySpecies(it))
  if (keySpecies.length === 0) {
    toast.init({ message: 'No key species to print', color: 'info' })
    return
  }

  const rows = keySpecies.map((it: any, index: number) => {
    const animalType = it.group?.name || '-'
    const scientific = it.description || '-'
    return `<tr>
      <td>${index + 1}</td>
      <td>${String(it.name || '')}</td>
      <td>${String(animalType)}</td>
      <td>${String(scientific)}</td>
    </tr>`
  }).join('')

  const logoSrc = '/assets/img/Bushman%20Logo.png'
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Key Species</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
      .logo { height: 40px; }
      h1 { font-size: 18px; margin: 0; }
      .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
      th { background: #f2f2f2; text-align: left; }
      @media print { body { margin: 12mm; } }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${logoSrc}" alt="Bushman Logo" class="logo" />
      <h1>Key Species</h1>
    </div>
    <div class="meta">Generated: ${new Date().toLocaleString()}</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Animal Type</th>
          <th>Scientific Name</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    toast.init({ message: 'Popup blocked. Allow popups to print.', color: 'warning' })
    return
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

async function handleCsvImport(data: any[]) {
  if (data.length === 0) {
    toast.init({ message: 'No species selected for import', color: 'info' })
    return
  }

  // Validate that an animal type is selected
  if (!selectedAnimalType.value) {
    toast.init({ message: 'Please select an animal type (Mammals, Birds, or Reptiles) before importing', color: 'warning' })
    return
  }

  // Find the item_group_id based on selected animal type
  const selectedGroup = availableGroups.value.find((g: any) => g.name === selectedAnimalType.value)
  const itemGroupId = selectedGroup?.id || null

  importInProgress.value = true
  importTotal.value = data.length
  importProcessed.value = 0
  importResults.value = []

  for (const sp of data) {
    try {
      const name = String(sp.name || '').trim()
      if (!name) {
        importResults.value.push({ name: sp.name, ok: false, error: 'Missing name' })
        continue
      }

      const existing = items.value.find((item: any) => String(item.name || '').toLowerCase() === name.toLowerCase())
      const description = String(sp.description || '').trim()

      const isActive = true
      if (existing) {
        const r = await speciesStore.updateSpecies(existing.id, {
          name,
          scientific_name: description,
          is_active: existing.is_active ?? isActive,
          item_group_id: itemGroupId,
        })
        importResults.value.push({ name, ok: r.status === 200, action: 'updated' })
        if (r.status === 200) {
          existing.name = name
        }
      } else {
        const r = await speciesStore.createSpecies({
          name,
          scientific_name: description,
          is_active: isActive,
          item_group_id: itemGroupId,
        })
        importResults.value.push({ name, ok: r.status === 201 || r.status === 200, action: 'created' })
        if (r.status === 201 || r.status === 200) {
          items.value.unshift({
            id: r.data?.id ?? Math.random().toString(36).slice(2),
            name,
            is_active: isActive,
          })
        }
      }
    } catch (err: any) {
      importResults.value.push({ name: sp.name, ok: false, error: handleErrors(err.response || err) })
    } finally {
      importProcessed.value += 1
    }
  }

  importInProgress.value = false
  showImportResults.value = true

  // Refresh list from server
  await getSpeciesItems()
}

function showSpecies(row?: any) {
  showSpeciesDetails.value = false
  showSpeciesList.value = !showSpeciesList.value
  currentSpecies.value = null
  specieUnits.value = []
  if (row) {
    // Optionally populate sform for editing if needed
  } else {
    Object.assign(sform, { id: null, name: '', description: '', is_active: true, item_group_id: null })
  }
}

function editSpeciesForm(row: any) {
  showSpeciesDetails.value = false
  showSpeciesList.value = false
  currentSpecies.value = null
  specieUnits.value = []
  Object.assign(sform, {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    is_active: row.is_active ?? true,
    item_group_id: row.item_group_id || row.group?.id || null,
  })
}

async function onSubmit() {
  saving.value = true
  try {
    if (sform.id) {
      // Update existing species (single form mode)
      const requestData = {
        name: sform.name,
        scientific_name: sform.description,
        is_active: sform.is_active,
        item_group_id: sform.item_group_id,
      }
      const response = await speciesStore.updateSpecies(sform.id, requestData)
      if (response.status === 200) {
        toast.init({ message: response.data.message || 'Species updated successfully', color: 'success' })
        await getSpeciesItems()
        showSpecies()
      }
    } else {
      // Create mode - check if we're using table columns (multi-create) or single form
      const columnsWithData = tableColumns.value.filter((col) => col.name.trim())

      if (columnsWithData.length > 0) {
        // Table mode: Create multiple species from table columns
        const results: any[] = []
        let successCount = 0
        let failCount = 0

        for (const col of columnsWithData) {
          try {
            const response = await speciesStore.createSpecies({
              name: col.name,
              is_active: normalizeIsActive(col.is_active),
            })
            if (response.status === 201 || response.status === 200) {
              results.push({ name: col.name, ok: true })
              successCount++
            } else {
              results.push({ name: col.name, ok: false })
              failCount++
            }
          } catch (err: any) {
            results.push({ name: col.name, ok: false, error: handleErrors(err.response || err) })
            failCount++
          }
        }

        // Show summary message
        if (successCount > 0 && failCount === 0) {
          toast.init({ message: `Successfully created ${successCount} species`, color: 'success' })
        } else if (successCount > 0 && failCount > 0) {
          toast.init({ message: `Created ${successCount} species, ${failCount} failed`, color: 'warning' })
        } else {
          toast.init({ message: `Failed to create species`, color: 'danger' })
        }

        // Refresh and reset
        await getSpeciesItems()
        showSpecies()

        // Reset table columns to initial state
        tableColumns.value = [
          { _id: 1, name: '', is_active: true },
        ]
      } else {
        // Single form mode (fallback - shouldn't normally happen since UI shows table when sform.id is null)
        const response = await speciesStore.createSpecies({
          name: sform.name,
          is_active: sform.is_active,
        })
        if (response.status === 201 || response.status === 200) {
          toast.init({ message: response.data.message || 'Species created successfully', color: 'success' })
          await getSpeciesItems()
          showSpecies()
        }
      }
    }
  } catch (error: any) {
    const errors = handleErrors(error.response || error)
    const message =
      errors.length > 0
        ? '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n')
        : 'An unexpected error occurred. Please try again later.'
    toast.init({ message, color: 'danger' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  getSpeciesItems()
})
</script>


<style scoped>
.species-page {
  padding: 0;
}

.custom-table {
  background: #fff;
  border-radius: 8px;
}

/* Match ManageArea spacing */
.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

/* CSV Upload Area Styles */
.csv-upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.csv-upload-area:hover {
  border-color: #0d6efd;
  background: #f0f7ff;
}

.csv-upload-area.drag-over {
  border-color: #198754;
  background: #d1e7dd;
  transform: scale(1.02);
}

.csv-upload-area.has-file {
  border-style: solid;
  border-color: #198754;
  background: #fff;
  cursor: default;
}

.csv-upload-area .upload-icon {
  margin-bottom: 0.75rem;
}

.csv-upload-area .upload-text p {
  margin: 0;
}

.csv-upload-area .selected-file {
  padding: 0.5rem;
  text-align: left;
}

/* CSV Preview Panel */
.csv-preview-panel .table th {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.csv-preview-panel .table td {
  font-size: 0.875rem;
  vertical-align: middle;
}

.csv-preview-panel .sticky-top {
  top: 0;
  z-index: 1;
}

/* Progress bar animation */
.progress-bar-animated {
  animation: progress-bar-stripes 1s linear infinite;
}

@keyframes progress-bar-stripes {
  from {
    background-position: 1rem 0;
  }

  to {
    background-position: 0 0;
  }
}
</style>
