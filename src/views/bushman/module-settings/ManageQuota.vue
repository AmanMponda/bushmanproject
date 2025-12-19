
<template>
  <div class="quota-page">
    <div class="d-flex align-items-center mb-3">
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">Settings</a></li>
        <li class="breadcrumb-item active">Quotas</li>
      </ul>
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
            <div class="col-md-3 d-flex align-items-end">
              <button type="button" class="btn btn-success w-100" @click="addNewSpeciesItemToStorage()">
                <i class="fa fa-plus"></i> Add Species
              </button>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import handleErrors from '../../../stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

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
const items = ref([])
const quotasOptions = ref([])
const speciesOptions = ref([])
const areasOptions = ref([])
const speciesObjects = ref([])
const quotaToDelete = ref(null)
const currentViewQuota = ref(null)

const form = reactive({
  id: null,
  name: '',
  start_date: null,
  end_date: null,
  description: '',
})

const sform = reactive({
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
  }
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
    const response = await quotaStore.deleteQuota(quotaToDelete.value.id)
    const success = response.status === 200 || response.status === 204 || response.data?.success
    if (success) {
      toast.init({ message: response.data?.message || 'Quota deleted successfully', color: 'success' })
      items.value = items.value.filter((item: any) => item.id !== quotaToDelete.value.id)
      quotasOptions.value = quotasOptions.value.filter((option: any) => option.value !== quotaToDelete.value.id)
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

function updateQuantitySelectedSpecies(species: any) {
  if (species && species.quantity) {
    sform.quantity = species.quantity
  }
}

function addNewSpeciesItemToStorage() {
  if (!sform.id || !sform.id.value || !sform.id.text || !sform.quantity) return
  if (Number(sform.quantity) <= 0) return
  const exists = speciesObjects.value.some((species: any) => species.id === sform.id.value)
  if (!exists) {
    speciesObjects.value.push({
      id: sform.id.value,
      name: sform.id.text,
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
    area_id: sform.area.value,
    quota_id: sform.salesQuota.value,
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
