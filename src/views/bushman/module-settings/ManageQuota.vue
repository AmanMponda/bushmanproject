
<template>
  <div class="quota-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
        <li class="breadcrumb-item active">Quotas</li>
      </ul>
      </div>
    </div>

    <!-- Create / Edit Quota Modal -->
    <div v-if="showModal">
      <div class="modal-backdrop fade show" @click="resetModal"></div>
      <div class="modal d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit Quota' : 'Add Quota' }}</h5>
              <button type="button" class="btn-close" aria-label="Close" @click="resetModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="onQuotaSubmit">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Name</label>
                    <input v-model="form.name" type="text" class="form-control" placeholder="Quota name" required />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Start Date</label>
                    <input v-model="form.start_date" type="date" class="form-control" required />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">End Date</label>
                    <input v-model="form.end_date" type="date" class="form-control" required />
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-12">
                    <label class="form-label">Description</label>
                    <textarea v-model="form.description" class="form-control" rows="3" placeholder="Optional description"></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="resetModal">Cancel</button>
              <button type="button" class="btn btn-primary" :disabled="savingQuota" @click="onQuotaSubmit">
                <span v-if="savingQuota" class="spinner-border spinner-border-sm me-1"></span>
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="showQuotaList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loadingQuotas"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :show-date-filters="false"
              >
                <template #id="{ row }">
                  {{ row.id }}
                </template>
                <template #name="{ row }">
                  {{ row.name }}
                </template>
                <template #start_date="{ row }">
                  {{ row.start_date }}
                </template>
                <template #end_date="{ row }">
                  {{ row.end_date }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View" @click="viewQuotaDetails(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" title="Edit" @click="editQuota(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeleteQuota(row)">
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

    <template v-else>
      <div class="card p-4">
        <form @submit.prevent="onSpeciesSubmit">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Sales Quota</label>
              <select v-model="sform.salesQuota" class="form-select" disabled>
                <option v-for="q in quotasOptions" :key="q.value" :value="q">{{ q.text }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Hunting Area</label>
              <select v-model="sform.area" class="form-select" required>
                <option v-for="a in areasOptions" :key="a.value" :value="a">{{ a.text }}</option>
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Species</label>
              <select v-model="sform.id" class="form-select" @change="updateQuantitySelectedSpecies(sform.id)" required>
                <option v-for="s in speciesOptions" :key="s.value" :value="s">{{ s.text }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Quantity</label>
              <input v-model.number="sform.quantity" type="number" min="1" max="100" class="form-control" required />
            </div>
            <div class="col-md-3 d-flex align-items-end gap-2">
              <button type="button" class="btn btn-success" @click="addNewSpeciesItemToStorage()">
                <i class="fa fa-plus"></i> Add
              </button>
              <button type="button" class="btn btn-primary" @click="triggerCsvInput" title="Import species from CSV">
                <i class="fa fa-file-csv"></i>
              </button>
              <input ref="csvInput" type="file" accept=".csv,text/csv" style="display:none" @change="onCsvSelected" />
            </div>
          </div>

          <!-- CSV Import Preview -->
          <div v-if="showCsvPreview" class="mb-3">
            <div class="card border-primary">
              <div class="card-header bg-light d-flex align-items-center justify-content-between py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-table text-primary"></i>
                  <span class="fw-semibold">CSV Preview</span>
                  <span class="badge bg-primary">{{ csvPreviewData.length }} rows</span>
                  <span v-if="csvDuplicates > 0" class="badge bg-warning text-dark">{{ csvDuplicates }} duplicates</span>
                  <span v-if="csvNewCount > 0" class="badge bg-success">{{ csvNewCount }} new</span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <div class="card-body p-0">
                <div class="p-3 border-bottom bg-light">
                  <div class="row g-2 align-items-end">
                    <div class="col-md-6">
                      <label class="form-label small fw-semibold">Species Name Column</label>
                      <select v-model="csvColumnMap.name" class="form-select form-select-sm" @change="recalculateCsvPreview">
                        <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-semibold">Quantity Column</label>
                      <select v-model="csvColumnMap.quantity" class="form-select form-select-sm" @change="recalculateCsvPreview">
                        <option value="">(Default: 1)</option>
                        <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                  <table class="table table-sm table-hover mb-0">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th style="width: 40px;">
                          <input type="checkbox" class="form-check-input" :checked="allCsvRowsSelected" @change="toggleAllCsvRows" />
                        </th>
                        <th>Species Name</th>
                        <th>Quantity</th>
                        <th style="width: 100px;">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, idx) in csvPreviewData" :key="idx" :class="{ 'table-secondary': row._duplicate || row._notFound }">
                        <td>
                          <input type="checkbox" class="form-check-input" v-model="row._selected" :disabled="row._duplicate || row._notFound" />
                        </td>
                        <td>{{ row.name }}</td>
                        <td>{{ row.quantity }}</td>
                        <td>
                          <span v-if="row._duplicate" class="badge bg-warning text-dark"><i class="fa fa-copy me-1"></i>Added</span>
                          <span v-else-if="row._notFound" class="badge bg-danger"><i class="fa fa-exclamation-circle me-1"></i>Not Found</span>
                          <span v-else class="badge bg-success"><i class="fa fa-plus me-1"></i>Ready</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="card-footer bg-light d-flex align-items-center justify-content-between py-2">
                <div class="text-muted small">
                  <i class="fa fa-check-circle text-success me-1"></i>
                  {{ csvSelectedCount }} of {{ csvNewCount }} species selected
                </div>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">Cancel</button>
                  <button type="button" class="btn btn-sm btn-success" :disabled="csvSelectedCount === 0" @click="importCsvSpecies">
                    <i class="fa fa-upload me-1"></i>Add {{ csvSelectedCount }} Species
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <div v-if="speciesObjects.length > 0" class="mb-2 fw-bold">Selected Species</div>
            <ul class="list-group">
              <li v-for="(s, index) in speciesObjects" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                <span>Name: {{ s.name }} | Quantity: {{ s.quantity }}</span>
                <button type="button" class="btn btn-sm btn-danger" @click="deleteFromStorage(index)"><i class="fa fa-trash"></i></button>
              </li>
            </ul>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" :disabled="savingQuotaSpecies">
              <i class="fa fa-save me-1"></i> Save
            </button>
            <button type="button" class="btn btn-secondary" @click="toggleQuotaView()">Cancel</button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import handleErrors from '../../../stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

interface SelectOption {
  value: any
  text: string
}

interface SpeciesObject {
  id: any
  name: string
  quantity: number
}

interface FormData {
  id: any
  name: string
  start_date: Date | null
  end_date: Date | null
  description: string
}

interface SpeciesFormData {
  id: SelectOption | null
  quantity: number
  salesQuota: SelectOption | null
  area: SelectOption | null
}

const quotaStore = useQuotaStore()
const toast = useToast()

const showQuotaList = ref(true)
const loadingQuotas = ref(false)
const savingQuota = ref(false)
const savingQuotaSpecies = ref(false)
const deletingQuota = ref(false)
const isEditing = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const items = ref<any[]>([])
const quotasOptions = ref<SelectOption[]>([])
const speciesOptions = ref<SelectOption[]>([])
const areasOptions = ref<SelectOption[]>([])
const speciesObjects = ref<SpeciesObject[]>([])
const quotaToDelete = ref<any>(null)
const currentViewQuota = ref<any>(null)

// CSV Import state
const csvInput = ref(null)
const showCsvPreview = ref(false)
const csvHeaders = ref<string[]>([])
const csvRawRows = ref<any[]>([])
const csvPreviewData = ref<any[]>([])
const csvColumnMap = reactive({
  name: '',
  quantity: '',
})

const csvDuplicates = computed(() => csvPreviewData.value.filter((r: any) => r._duplicate).length)
const csvNotFound = computed(() => csvPreviewData.value.filter((r: any) => r._notFound).length)
const csvNewCount = computed(() => csvPreviewData.value.filter((r: any) => !r._duplicate && !r._notFound).length)
const csvSelectedCount = computed(() => csvPreviewData.value.filter((r: any) => r._selected && !r._duplicate && !r._notFound).length)
const allCsvRowsSelected = computed(() => {
  const selectable = csvPreviewData.value.filter((r: any) => !r._duplicate && !r._notFound)
  return selectable.length > 0 && selectable.every((r: any) => r._selected)
})

function toggleAllCsvRows() {
  const allSelected = allCsvRowsSelected.value
  csvPreviewData.value.forEach((r: any) => {
    if (!r._duplicate && !r._notFound) r._selected = !allSelected
  })
}

function triggerCsvInput() {
  const el: any = csvInput.value
  if (el) el.click()
}

async function parseCsvText(text: string) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return { headerFields: [], rows: [] }
  try {
    const PapaModule = await import('papaparse')
    const Papa = PapaModule && (PapaModule.default || PapaModule)
    const parsed = Papa.parse(trimmed, { header: true, skipEmptyLines: true })
    const headerFields = parsed?.meta?.fields || (parsed.data && parsed.data.length ? Object.keys(parsed.data[0]) : [])
    return { headerFields, rows: parsed.data || [] }
  } catch (e) {
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length === 0) return { headerFields: [], rows: [] }

    function splitLine(line: string) {
      const result: string[] = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (ch === ',' && !inQuotes) {
          result.push(cur)
          cur = ''
        } else {
          cur += ch
        }
      }
      result.push(cur)
      return result.map((s) => s.trim())
    }

    const headerFields = splitLine(lines[0])
    const rows = lines.slice(1).map((ln) => {
      const fields = splitLine(ln)
      const obj: any = {}
      for (let i = 0; i < headerFields.length; i++) {
        obj[headerFields[i]] = fields[i] ?? ''
      }
      return obj
    })
    return { headerFields, rows }
  }
}

async function onCsvSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  await processCsvFile(file)
  input.value = ''
}

async function processCsvFile(file: File) {
  const text = await file.text()
  const parsed = await parseCsvText(text)
  if (!parsed || !parsed.rows || parsed.rows.length === 0) {
    toast.init({ message: 'CSV contains no rows', color: 'info' })
    return
  }

  csvHeaders.value = parsed.headerFields
  csvRawRows.value = parsed.rows

  const headersLower = parsed.headerFields.map((h: string) => h.toLowerCase())
  
  const tryNames = ['name', 'species', 'species_name', 'speciesname']
  for (const t of tryNames) {
    const idx = headersLower.findIndex((h) => h.includes(t))
    if (idx >= 0) {
      csvColumnMap.name = parsed.headerFields[idx]
      break
    }
  }
  if (!csvColumnMap.name && parsed.headerFields.length > 0) {
    csvColumnMap.name = parsed.headerFields[0]
  }

  const tryQty = ['quantity', 'qty', 'count', 'amount']
  for (const t of tryQty) {
    const idx = headersLower.findIndex((h) => h.includes(t))
    if (idx >= 0) {
      csvColumnMap.quantity = parsed.headerFields[idx]
      break
    }
  }

  recalculateCsvPreview()
  showCsvPreview.value = true
}

function recalculateCsvPreview() {
  const existingIds = new Set(speciesObjects.value.map((it: any) => it.id))
  const availableSpeciesMap = new Map(speciesOptions.value.map((opt: any) => [(opt.text || '').toLowerCase().trim(), opt]))
  const seenIds = new Set<any>()
  
  csvPreviewData.value = csvRawRows.value.map((row: any) => {
    const name = String(row[csvColumnMap.name] || '').trim()
    const quantity = csvColumnMap.quantity ? parseInt(row[csvColumnMap.quantity]) || 1 : 1
    
    const key = name.toLowerCase()
    const matchedSpecies = availableSpeciesMap.get(key)
    const speciesId = matchedSpecies?.value
    const isDuplicate = (speciesId && existingIds.has(speciesId)) || (speciesId && seenIds.has(speciesId))
    const isNotFound = !matchedSpecies
    
    if (speciesId && !isDuplicate) seenIds.add(speciesId)
    
    return {
      name,
      quantity: Math.max(1, quantity),
      _duplicate: isDuplicate,
      _notFound: isNotFound,
      _selected: !isDuplicate && !isNotFound,
      _speciesId: speciesId,
    }
  }).filter((r: any) => r.name)
}

function closeCsvPreview() {
  showCsvPreview.value = false
  csvHeaders.value = []
  csvRawRows.value = []
  csvPreviewData.value = []
  csvColumnMap.name = ''
  csvColumnMap.quantity = ''
}

function importCsvSpecies() {
  const toImport = csvPreviewData.value.filter((r: any) => r._selected && !r._duplicate && !r._notFound)
  if (toImport.length === 0) {
    toast.init({ message: 'No species selected for import', color: 'info' })
    return
  }

  for (const sp of toImport) {
    speciesObjects.value.push({
      id: sp._speciesId,
      name: sp.name,
      quantity: sp.quantity,
    })
  }

  toast.init({ message: `Added ${toImport.length} species from CSV`, color: 'success' })
  closeCsvPreview()
}

const form = reactive<FormData>({
  id: null,
  name: '',
  start_date: null,
  end_date: null,
  description: '',
})

const sform = reactive<SpeciesFormData>({
  id: null,
  quantity: 1,
  salesQuota: null,
  area: null,
})

const columns = [
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'start_date', label: 'Start Date', sortable: true, visible: true },
  { key: 'end_date', label: 'End Date', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => [
  {
    label: 'Add Quota',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showAddQuotaModal(),
  },
])

function toggleQuotaView() {
  showQuotaList.value = !showQuotaList.value
  if (showQuotaList.value) {
    currentViewQuota.value = null
    sform.salesQuota = null
  }
}

function showAddQuotaModal() {
  resetModal()
  isEditing.value = false
  showModal.value = true
}

function viewQuotaDetails(row: any) {
  showQuotaList.value = false
  currentViewQuota.value = row
  sform.salesQuota = {
    value: row.id,
    text: generateQuotaYear(row.start_date, row.end_date) + ` - ${row.name}`,
  } as SelectOption
  getSpeciesItems()
}

function editQuota(row: any) {
  isEditing.value = true
  form.id = row.id
  form.name = row.name
  form.start_date = row.start_date ? new Date(row.start_date) : null
  form.end_date = row.end_date ? new Date(row.end_date) : null
  form.description = row.description || ''
  showModal.value = true
}

function confirmDeleteQuota(row: any) {
  quotaToDelete.value = row
  showDeleteModal.value = true
}

function cancelDelete() {
  quotaToDelete.value = null
  showDeleteModal.value = false
}

async function deleteQuotaItem() {
  if (!quotaToDelete.value) return
  deletingQuota.value = true
  try {
    const quotaId = quotaToDelete.value.id
    const response = await quotaStore.deleteQuota(quotaId)
    const success = response.status === 200 || response.status === 204 || response.data?.success
    if (success) {
      toast.init({ message: response.data?.message || 'Quota deleted successfully', color: 'success' })
      items.value = items.value.filter((item: any) => item.id !== quotaId)
      quotasOptions.value = quotasOptions.value.filter((option: any) => option.value !== quotaId)
      cancelDelete()
    } else {
      toast.init({ message: response.data?.message || 'Delete operation failed', color: 'warning' })
    }
  } catch (error: any) {
    toast.init({ message: error.response?.data?.message || 'Failed to delete quota', color: 'danger' })
  } finally {
    deletingQuota.value = false
  }
}

function resetModal() {
  isEditing.value = false
  showModal.value = false
  form.id = null
  form.name = ''
  form.start_date = null
  form.end_date = null
  form.description = ''
}

async function onQuotaSubmit() {
  savingQuota.value = true
  try {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.init({ message: 'Please provide name, start and end dates for the quota.', color: 'warning' })
      return
    }

    if (isEditing.value && form.id) {
      const resp = await quotaStore.updateQuota({ id: form.id, name: form.name, start_date: form.start_date, end_date: form.end_date, description: form.description })
      if (resp && (resp.status === 200 || resp.status === 204 || resp.success)) {
        toast.init({ message: resp.data?.message || 'Quota updated', color: 'success' })
        resetModal()
        await getQs()
      }
    } else {
      const resp = await quotaStore.createQuota({ name: form.name, start_date: form.start_date, end_date: form.end_date, description: form.description })
      if (resp && (resp.status === 201 || resp.success)) {
        toast.init({ message: resp.data?.message || resp.message || 'Quota created', color: 'success' })
        resetModal()
        await getQs()
      } else {
        toast.init({ message: resp.message || 'Failed to create quota', color: 'danger' })
      }
    }
  } catch (err: any) {
    const errors = handleErrors(err.response || err)
    toast.init({ message: errors.length > 0 ? errors.join('\n') : 'Failed to save quota', color: 'danger' })
  } finally {
    savingQuota.value = false
  }
}

function updateQuantitySelectedSpecies(species: any) {
  if (species && species.quantity) {
    sform.quantity = species.quantity
  }
}

function addNewSpeciesItemToStorage() {
  if (!sform.id || !sform.quantity) return
  if (Number(sform.quantity) <= 0) return
  const speciesId = sform.id.value
  const speciesName = sform.id.text
  if (!speciesId || !speciesName) return
  const exists = speciesObjects.value.some((species: any) => species.id === speciesId)
  if (!exists) {
    speciesObjects.value.push({
      id: speciesId,
      name: speciesName,
      quantity: sform.quantity,
    })
  }
}

function deleteFromStorage(index: number) {
  speciesObjects.value.splice(index, 1)
}

async function onSpeciesSubmit() {
  savingQuotaSpecies.value = true
  if (speciesObjects.value.length === 0) {
    toast.init({ message: 'Please add at least one species item.', color: 'warning' })
    savingQuotaSpecies.value = false
    return
  }
  if (!sform.area || !sform.salesQuota) {
    toast.init({ message: 'Please select both area and sales quota.', color: 'warning' })
    savingQuotaSpecies.value = false
    return
  }
  const rdata = {
    area_id: sform.area?.value,
    quota_id: sform.salesQuota?.value,
    speciesObjects: speciesObjects.value,
  }
  try {
    const response = await quotaStore.createQuotaAreaSpecies(rdata)
    if (response.status === 201) {
      toast.init({ message: response.data.message, color: 'success' })
      resetSForm()
      speciesObjects.value = []
    }
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: '\n' + errors.map((error: string, index: number) => `${index + 1}. ${error}`).join('\n'), color: 'danger' })
  } finally {
    savingQuotaSpecies.value = false
  }
}

function resetSForm() {
  sform.id = null
  sform.quantity = 1
  sform.area = null
}

function generateQuotaYear(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''
  const startYear = new Date(startDate).getFullYear()
  const endYear = new Date(endDate).getFullYear()
  return `${startYear}-${endYear}`
}

async function getQs(id: number | null = null) {
  loadingQuotas.value = true
  try {
    const response = await quotaStore.getQuotas(id)
    if (response && response.data) {
      const apiResponse = response.data
      if (apiResponse.success === true && Array.isArray(apiResponse.data)) {
        const quotaItems = apiResponse.data
        items.value = quotaItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          start_date: item.start_date,
          end_date: item.end_date,
        }))
        quotasOptions.value = quotaItems.map((item: any) => {
          const result = generateQuotaYear(item.start_date, item.end_date)
          return {
            value: item.id,
            text: `${result} - ${item.name}`,
          }
        })
      } else {
        items.value = []
        quotasOptions.value = []
      }
    } else {
      items.value = []
      quotasOptions.value = []
    }
  } catch (error: any) {
    toast.init({ message: 'Failed to load quotas. Please try again.', color: 'danger' })
  } finally {
    loadingQuotas.value = false
  }
}

async function getSpeciesItems() {
  try {
    const response = await quotaStore.getSpeciesList()
    speciesOptions.value = response.data.map((item: any) => ({ value: item.id, text: item.name }))
  } catch (error: any) {
    //
  }
}

async function getAreas() {
  try {
    const response = await quotaStore.getAreaList()
    areasOptions.value = response.data.map((item: any) => ({ value: item.id, text: item.name }))
  } catch (error: any) {
    //
  }
}

onMounted(() => {
  getQs()
  getSpeciesItems()
  getAreas()
})
</script>

<style scoped>
.quota-page {
  padding: 16px;
}
.custom-table {
  background: #fff;
  border-radius: 8px;
}
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
</style>
