<template>
  <div class="sales-package-form-page">
    <!-- Form Container -->
    <div class="form-sales-package-container">
      <div v-if="!saving" class="card">
        <div class="card-header bg-white border-bottom">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-secondary btn-sm" @click="handleGoBack">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>
              <i class="fa fa-edit text-primary fs-5"></i>
              <h2 class="h5 mb-0">{{ editMode ? 'Edit Package' : 'Create New Package' }}</h2>
            </div>
          </div>
        </div>

        <div class="card-body">
          <form ref="formRef" @submit.prevent="submit">
            <div class="row mb-3" style="--bs-gutter-x: 3rem">
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Package Name <span class="text-danger">*</span></label>
                  <input
                    v-model="form.package_name"
                    type="text"
                    class="form-control"
                    placeholder="Enter Package Name"
                    required
                  />
                </div>
              </div>

              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Licence</label>
                  <select v-model="form.licence" class="form-select" @change="onLicenceChange">
                    <option :value="null">Select Licence (Optional)</option>
                    <option v-for="option in regulatoryPackagesOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Area</label>
                  <select
                    v-model="form.area"
                    class="form-select"
                    :disabled="laodinglicenceAreaSpecies"
                    @change="getLicenceAreaSpeciesList"
                  >
                    <option :value="null">Select Area (Optional)</option>
                    <option v-for="option in areasOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-12">
                <div class="form-group">
                  <label class="form-label">Description <span class="text-muted">(Optional)</span></label>
                  <textarea
                    v-model="form.description"
                    class="form-control"
                    rows="3"
                    placeholder="Enter Description"
                    maxlength="120"
                  ></textarea>
                  <small class="text-muted">{{ form.description?.length || 0 }}/120 characters</small>
                </div>
              </div>
            </div>

            <!-- Species Section -->
            <div class="card mb-3">
              <div class="card-header bg-light py-1 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">
                  <i class="fa fa-paw text-primary me-2"></i>
                  Species
                  <span
                    v-if="laodinglicenceAreaSpecies"
                    class="spinner-border spinner-border-sm ms-2"
                    role="status"
                  ></span>
                </h6>
              </div>

              <div class="card-body">
                <div v-if="laodinglicenceAreaSpecies" class="text-center py-2">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>

                <!-- Tabs: CSV Import | Manual Entry -->
                <div v-else class="mb-3">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <ul class="nav nav-tabs border-bottom flex-grow-1">
                      <li class="nav-item">
                        <button
                          type="button"
                          class="nav-link"
                          :class="{ active: entryMode === 'csv' }"
                          @click="entryMode = 'csv'"
                        >
                          <i class="fa fa-file-csv me-2"></i> Import CSV
                        </button>
                      </li>
                      <li class="nav-item">
                        <button
                          type="button"
                          class="nav-link"
                          :class="{ active: entryMode === 'manual' }"
                          @click="entryMode = 'manual'"
                        >
                          <i class="fa fa-edit me-2"></i> Manual Entry
                        </button>
                      </li>
                    </ul>

                    <button
                      v-if="entryMode === 'csv'"
                      type="button"
                      class="btn btn-sm btn-outline-success ms-3"
                      @click="downloadSpeciesTemplate"
                    >
                      <i class="fa fa-download me-1"></i>Download Template
                    </button>
                  </div>
                </div>

                <!-- CSV Mode -->
                <div v-if="entryMode === 'csv'">
                  <div
                    v-if="form.licence && form.area && (!licenceAreaSpecies || licenceAreaSpecies.length === 0)"
                    class="alert alert-info mb-3"
                  >
                    <i class="fa fa-info-circle me-2"></i>
                    Loading species from selected licence and area...
                  </div>

                  <div
                    v-else-if="form.licence && form.area && licenceAreaSpecies && licenceAreaSpecies.length > 0"
                    class="alert alert-info mb-3"
                  >
                    <i class="fa fa-info-circle me-2"></i>
                    CSV will be validated against {{ licenceAreaSpecies.length }} species from the selected licence and
                    area.
                  </div>

                  <div v-else class="alert alert-warning mb-3">
                    <i class="fa fa-exclamation-triangle me-2"></i>
                    No licence/area selected. CSV import will accept any species names.
                  </div>

                  <SalesPackageCSVInput :allowed-species-ids="licenceSpeciesIds" :species-options="speciesOptionsForCsv" @import="handleCsvImport" />
                </div>

                <!-- Manual Entry Mode -->
                <div v-else-if="entryMode === 'manual'">
                  <div v-if="!licenceAreaSpecies || licenceAreaSpecies.length === 0" class="alert alert-info">
                    <i class="fa fa-info-circle me-2"></i>
                    No species available.
                  </div>

                  <div v-else>
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead class="table-light">
                          <tr>
                            <th>Name</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-center">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr v-for="item in licenceAreaSpecies" :key="item.id">
                            <td class="fw-semibold">{{ item.name }}</td>
                            <td class="text-center">
                              <div class="input-group justify-content-center" style="max-width: 150px; margin: 0 auto">
                                <button
                                  type="button"
                                  class="btn btn-outline-secondary btn-sm"
                                  :disabled="item.quantity <= 0"
                                  @click="decreaseQuantity(item.id)"
                                >
                                  <i class="fa fa-minus"></i>
                                </button>

                                <input
                                  v-model.number="item.quantity"
                                  type="number"
                                  class="form-control form-control-sm text-center"
                                  min="0"
                                  max="100"
                                  style="max-width: 80px"
                                  @change="(e) => onChange(item.id, parseInt((e.target as HTMLInputElement).value) || 0)"
                                />

                                <button
                                  type="button"
                                  class="btn btn-outline-secondary btn-sm"
                                  :disabled="item.quantity >= 100"
                                  @click="increaseQuantity(item.id)"
                                >
                                  <i class="fa fa-plus"></i>
                                </button>
                              </div>
                            </td>
                            <td class="text-center">
                              <button
                                type="button"
                                class="btn btn-outline-danger btn-sm"
                                title="Remove species"
                                @click="removeSpecies(item.id)"
                              >
                                <i class="fa fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <!-- end manual/csv -->
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Save Button (hidden in CSV mode) -->
      <div v-if="entryMode !== 'csv'" class="d-flex justify-content-end align-items-center mt-2 mb-2">
        <button type="button" class="btn btn-primary" :disabled="saving || !canSubmit" @click="submit()">
          <i class="fa fa-save me-1"></i>
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ editMode ? 'Update Package' : 'Save Package' }}
        </button>
      </div>

      <!-- CSV Import Progress -->
      <div v-if="importInProgress" class="mt-3">
        <div class="card border-primary">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-2">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
              <span class="fw-semibold">Saving package...</span>
              <span class="text-muted">{{ importProcessed }} / {{ importTotal }}</span>
            </div>

            <div class="progress" style="height: 8px">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                :style="{ width: importProgressPercent + '%' }"
              ></div>
            </div>

            <div v-if="importResults.length > 0" class="mt-2">
              <small class="text-success"><i class="fa fa-check me-1"></i>{{ importSuccessCount }} succeeded</small>
              <small v-if="importFailCount > 0" class="text-danger ms-3"
                ><i class="fa fa-times me-1"></i>{{ importFailCount }} failed</small
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div
    v-if="saving"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style="background: rgba(0, 0, 0, 0.5); z-index: 9999"
  >
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import Swal from 'sweetalert2'

import handleErrors from '../../../stores/bushman/errorHandler.ts'
import { useToast } from '@/composables/useToast'

import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import { usePriceListStore } from '../../../stores/bushman/price-list-store.ts'
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store.ts'

import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'
import SalesPackageCSVInput from './SalesPackageCSVInput.vue'

type EntryMode = 'manual' | 'csv' | null

const props = defineProps({
  editMode: { type: Boolean, default: false },
  editItem: { type: Object as any, default: null },
})

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'go-back'): void
}>()

// stores
const quotaStore = useQuotaStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const regulatoryPackageStore = useRegulatoryPackageStore()

// toast
const { init } = useToast()

// refs/state
const formRef = ref<HTMLFormElement | null>(null)

const form = reactive({
  package_name: '',
  description: '',
  species: null as any,
  quantity: 1,
  area: null as any,
  licence: null as any,
})

const defaultColDef = reactive({ editable: true })
const speciesOptions = ref<any[]>([])
const areasOptions = ref<any[]>([])
const saving = ref(false)
const regulatoryPackagesOptions = ref<any[]>([])
const loadingLicenceOptions = ref(false)
const loading = ref(false)

const originalQuantities = reactive<Record<string | number, number>>({})
const quntityChangedsaved = ref(false)

const entryMode = ref<EntryMode>('csv')

// CSV import state
const csvImportUsed = ref(false)
const csvImportedSpeciesList = ref<any[]>([])
const csvImportedSpeciesNames = ref<string[]>([])

// CSV import progress
const importInProgress = ref(false)
const importTotal = ref(0)
const importProcessed = ref(0)
const importResults = ref<any[]>([])

// All species for lookup (kept)
const allSpeciesList = ref<any[]>([])

// Pinia (replacement for mapWritableState / mapState)
const licenceAreaSpecies = computed<any[]>({
  get: () => settingsStore.licenceAreaSpecies as any[],
  set: (val) => {
    settingsStore.licenceAreaSpecies = val as any
  },
})
const laodinglicenceAreaSpecies = computed(() => settingsStore.laodinglicenceAreaSpecies)

// computed
const licenceSpeciesIds = computed<(string | number)[]>(() =>
  (licenceAreaSpecies.value || []).map((s: any) => s.id).filter((id: any) => id != null),
)

const speciesOptionsForCsv = computed(() =>
  (licenceAreaSpecies.value || []).map((s: any) => ({ value: s.id, text: s.name }))
)

const canSubmit = computed<boolean>(() => {
  if (entryMode.value === 'csv') {
    return !!form.package_name && csvImportUsed.value && csvImportedSpeciesList.value.length > 0
  }
  if (entryMode.value === 'manual') {
    const hasBasicInfo = !!form.package_name
    return hasBasicInfo && (licenceAreaSpecies.value || []).some((s: any) => (s.quantity || 0) > 0)
  }
  return false
})

const importProgressPercent = computed<number>(() =>
  importTotal.value > 0 ? Math.round((importProcessed.value / importTotal.value) * 100) : 0,
)

const importSuccessCount = computed<number>(() => importResults.value.filter((r: any) => r.ok).length)
const importFailCount = computed<number>(() => importResults.value.filter((r: any) => !r.ok).length)

// methods
function handleGoBack() {
  emit('go-back')
}

function resetEntryMode() {
  entryMode.value = null
  csvImportUsed.value = false
  csvImportedSpeciesNames.value = []
  csvImportedSpeciesList.value = []
}

function onLicenceChange() {
  // Reset area and species when licence changes
  if (form.licence === null) {
    settingsStore.licenceAreaSpecies = []
    resetEntryMode()
  } else {
    form.area = null
    settingsStore.licenceAreaSpecies = []
    resetEntryMode()
  }
}

function increaseQuantity(id: any) {
  const item = (licenceAreaSpecies.value || []).find((x: any) => x.id === id)
  if (item && item.quantity < 100) {
    item.quantity++
    onChange(id, item.quantity)
  }
}

function decreaseQuantity(id: any) {
  const item = (licenceAreaSpecies.value || []).find((x: any) => x.id === id)
  if (item && item.quantity > 0) {
    item.quantity--
    onChange(id, item.quantity)
  }
}

function removeSpecies(id: any) {
  const item = (licenceAreaSpecies.value || []).find((x: any) => x.id === id)
  if (!item) return

  Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete "${item.name}"? This action cannot be undone!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
  }).then((result) => {
    if (result.isConfirmed) {
      const index = (licenceAreaSpecies.value || []).findIndex((x: any) => x.id === id)
      if (index !== -1) {
        licenceAreaSpecies.value?.splice(index, 1)
        delete originalQuantities[id]
      }
    }
  })
}

function onChange(id: any, newValue: any) {
  if (!(id in originalQuantities)) {
    const item = (licenceAreaSpecies.value || []).find((x: any) => x.id === id)
    if (item) originalQuantities[id] = item.quantity
  }

  const updatedItem = (licenceAreaSpecies.value || []).find((x: any) => x.id === id)
  if (updatedItem) {
    updatedItem.quantity = newValue
    licenceAreaSpecies.value = [...(licenceAreaSpecies.value || [])]
  }
}

async function submit() {
  const el = formRef.value
  if (!el?.checkValidity()) {
    el?.reportValidity()
    return
  }

  saving.value = true

  const speciesWithQuantity = (licenceAreaSpecies.value || []).filter((s: any) => (s.quantity || 0) > 0)

  if (speciesWithQuantity.length === 0) {
    init({ message: 'Please add at least one species with quantity greater than 0.', color: 'warning' })
    saving.value = false
    return
  }

  const requestdata = {
    name: form.package_name,
    description: form.description?.trim() || null,
    areaId: form.area,
    licenceId: form.licence,
    speciesObjectList: speciesWithQuantity,
  }

  try {
    let response: any

    if (props.editMode && props.editItem) {
      response = await priceListStore.updateSalesPackage(props.editItem.id, requestdata)
      if (response.status === 200) {
        saving.value = false
        init({ message: 'Package updated successfully.', color: 'success' })
        emit('saved')
      }
    } else {
      response = await priceListStore.createSalesPackage(requestdata)
      if (response.status === 201) {
        saving.value = false
        init({ message: response.data.message || 'Package created successfully.', color: 'success' })
        emit('saved')
      }
    }
  } catch (error: any) {
    saving.value = false
    const errors = handleErrors(error.response)
    init({
      message: errors.join(', ') || (error instanceof Error ? error.message : 'An error occurred'),
      color: 'danger',
    })
  }
}

async function getLicencePackages() {
  loadingLicenceOptions.value = true
  try {
    const response = await regulatoryPackageStore.getRegulatoryPackages()
    if (response.status === 200) {
      const data = response.data
      regulatoryPackagesOptions.value = data.map((item: any) => ({
        value: item.id,
        text: item.name + ' -> ' + item.duration + ' days',
      }))
    }
  } catch (error) {
    console.log(error)
  } finally {
    loadingLicenceOptions.value = false
  }
}

async function getAreas() {
  try {
    const response = await quotaStore.getAreaList()
    const huntingAreas = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : []

    areasOptions.value = huntingAreas.map((area: any) => {
      const location = area.location || {}
      const locationName = location.name || 'N/A'
      const locationCode = location.code || 'N/A'
      return { value: area.id, text: `${locationName} (${locationCode})` }
    })
  } catch (error) {
    console.log(error)
  }
}

async function getLicenceAreaSpeciesList() {
  if (!form.area || !form.licence) {
    settingsStore.licenceAreaSpecies = []
    return
  }

  const payload = { areaId: form.area, licenceId: form.licence }

  try {
    const response = await settingsStore.getHuntingLicenseAreaSpecies(payload)
    if (response.status === 200) {
      const data = response.data
      speciesOptions.value = data.map((item: any) => ({ value: item.id, text: item.name }))
    }
  } catch (error: any) {
    const errors = handleErrors(error.response)
    init({
      message: errors.join(', ') || (error instanceof Error ? error.message : 'An error occurred'),
      color: 'danger',
    })
  }
}

async function getSalesPackages() {
  loading.value = true
  try {
    const response = await priceListStore.getSalesPackageList(true)
    if (response.status === 200) {
      // no-op
    }
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

async function downloadSpeciesTemplate() {
  try {
    const response = await quotaStore.getSpeciesList()
    if (response.status !== 200) {
      init({ message: 'Failed to load species', color: 'warning' })
      return
    }

    const data = response.data?.data || response.data || []
    if (!Array.isArray(data) || data.length === 0) {
      init({ message: 'No species available. Please wait for species to load.', color: 'warning' })
      return
    }

    const escapeCsv = (value: any) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      return '"' + str.replace(/"/g, '""') + '"'
    }

    const rows = data.map((species: any) => {
      const id = species.id || ''
      const name = species.name || ''
      const quantity = ''
      return `${escapeCsv(id)},${escapeCsv(name)},${escapeCsv(quantity)}`
    })

    const header = 'Species ID,Species Name,Quantity'
    const csvContent = [header].concat(rows).join('\n')

    const filename = 'sales_package_species_template.csv'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.setAttribute('download', filename)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    init({ message: 'Species template downloaded successfully', color: 'success' })
  } catch (error: any) {
    console.error('Error downloading template:', error)
    init({ message: 'Failed to download template', color: 'danger' })
  }
}

// CSV Import Handler - immediately updates species and saves the package
async function handleCsvImport(data: any[]) {
  if (data.length === 0) {
    await Swal.fire({
      icon: 'warning',
      title: 'No valid species found',
      text: 'No valid species found in CSV. Please check your CSV file.',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
    return
  }

  if (!form.package_name) {
    await Swal.fire({
      icon: 'warning',
      title: 'Package Name Required',
      text: 'Please fill in Package Name before importing.',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
    return
  }

  importInProgress.value = true
  importTotal.value = 1
  importProcessed.value = 0
  importResults.value = []

  try {
    const speciesObjectList = data
      .map((row: any) => {
        const speciesId = parseInt(String(row.id)) || 0
        const quantity = Math.max(1, parseInt(row.quantity) || 1)

        if (!speciesId || speciesId <= 0) {
          console.warn(`Invalid species ID: ${row.id}`)
          return null
        }

        return { id: speciesId, quantity }
      })
      .filter((x: any) => x !== null)

    if (speciesObjectList.length === 0) {
      await Swal.fire({
        icon: 'error',
        title: 'No Valid Species',
        text: 'No valid species IDs found in the imported data.',
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'btn btn-primary' },
        buttonsStyling: false,
      })
      importInProgress.value = false
      return
    }

    const requestdata = {
      name: form.package_name,
      description: form.description?.trim() || null,
      areaId: form.area || null,
      licenceId: form.licence || null,
      speciesObjectList,
    }

    let response: any
    if (props.editMode && props.editItem) {
      response = await priceListStore.updateSalesPackage(props.editItem.id, requestdata)
    } else {
      response = await priceListStore.createSalesPackage(requestdata)
    }

    importProcessed.value = 1

    if (response.status === 200 || response.status === 201) {
      importResults.value.push({ name: form.package_name, ok: true })

      await Swal.fire({
        icon: 'success',
        title: 'Package Saved Successfully',
        text: `Package "${form.package_name}" has been saved with ${data.length} species.`,
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'btn btn-primary' },
        buttonsStyling: false,
      })

      emit('saved')
    } else {
      importResults.value.push({ name: form.package_name, ok: false, error: 'Unexpected response status' })

      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save package. Please try again.',
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'btn btn-primary' },
        buttonsStyling: false,
      })
    }
  } catch (error: any) {
    const errors = handleErrors(error.response)
    const errorMessage = errors.join(', ') || (error instanceof Error ? error.message : 'Failed to save package')
    importResults.value.push({ name: form.package_name || 'Package', ok: false, error: errorMessage })

    await Swal.fire({
      icon: 'error',
      title: 'Save Failed',
      text: errorMessage,
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
  } finally {
    importInProgress.value = false
  }

  csvImportUsed.value = true
  csvImportedSpeciesList.value = data
  csvImportedSpeciesNames.value = data.map((r: any) => r.name || '')
}

// lifecycle
onMounted(async () => {
  await getLicencePackages()
  await getAreas()
  settingsStore.licenceAreaSpecies = []

  if (props.editMode && props.editItem) {
    form.package_name = props.editItem.name || ''
    form.description = props.editItem.description || ''

    await nextTick()

    if (props.editItem.regulatory_package) {
      form.licence = props.editItem.regulatory_package.id
    }
    if (props.editItem.area) {
      form.area = props.editItem.area.id
      if (form.licence) {
        await getLicenceAreaSpeciesList()
      }
    }

    if (props.editItem.species && props.editItem.species.length > 0) {
      setTimeout(() => {
        settingsStore.licenceAreaSpecies = props.editItem.species.map((s: any) => ({
          id: s.species?.id || s.id,
          name: s.species?.name || s.name,
          quantity: s.quantity || 1,
        }))
      }, 500)
    }
  }
})
</script>

<style lang="scss" scoped>
.sales-package-form-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.form-sales-package-container {
  max-width: 1400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.card {
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.input-group .btn {
  border-color: #dee2e6;
}

.input-group .form-control {
  border-left: 0;
  border-right: 0;
}

/* Entry Mode Selection Cards */
.entry-mode-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.entry-mode-card:hover {
  border-color: #0d6efd !important;
  box-shadow: 0 0.25rem 0.5rem rgba(13, 110, 253, 0.15);
  transform: translateY(-2px);
}

.entry-mode-card .card-body {
  background: linear-gradient(to bottom, #fff, #f8f9fa);
}

.cursor-pointer {
  cursor: pointer;
}

/* Custom CSV Upload Styles */
.csv-upload-area {
  margin: 1rem 0;
}

.upload-box {
  border: 2px dashed #dee2e6;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.upload-box.drag-over {
  border-color: #0d6efd;
  background: #e7f1ff;
}

.upload-placeholder {
  cursor: pointer;
  padding: 1rem;
}

.file-info {
  padding: 1rem;
}
</style>
