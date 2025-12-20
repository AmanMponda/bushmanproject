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
                  <label class="form-label">Licence <span class="text-danger">*</span></label>
                  <select v-model="form.licence" class="form-select" required @change="onLicenceChange">
                    <option :value="null">Select Licence</option>
                    <option v-for="option in regulatoryPackagesOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Area <span class="text-danger">*</span></label>
                  <select
                    v-model="form.area"
                    class="form-select"
                    required
                    :disabled="laodinglicenceAreaSpecies || form.licence === null"
                    @change="getLicenceAreaSpeciesList"
                  >
                    <option :value="null">Select Area</option>
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
                  <label class="form-label">Description <span class="text-danger">*</span></label>
                  <textarea
                    v-model="form.description"
                    class="form-control"
                    rows="3"
                    placeholder="Enter Description"
                    maxlength="120"
                    required
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
                <button
                  v-if="licenceAreaSpecies && licenceAreaSpecies.length > 0"
                  type="button"
                  class="btn btn-sm btn-success"
                  @click="triggerCsvInput"
                >
                  <i class="fa fa-file-csv me-1"></i>Import CSV
                </button>
                <input ref="csvInputRef" type="file" accept=".csv,text/csv" style="display:none" @change="onCsvSelected" />
              </div>
              <div class="card-body">
                <!-- CSV Preview Panel -->
                <div v-if="showCsvPreview" class="mb-3">
                  <div class="card border-primary">
                    <div class="card-header bg-light d-flex align-items-center justify-content-between py-2">
                      <div class="d-flex align-items-center gap-2">
                        <i class="fa fa-table text-primary"></i>
                        <span class="fw-semibold">CSV Preview</span>
                        <span class="badge bg-primary">{{ csvPreviewData.length }} rows</span>
                        <span v-if="csvNewCount > 0" class="badge bg-success">{{ csvNewCount }} matched</span>
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
                              <option value="">(Keep existing)</option>
                              <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0">
                          <thead class="table-light sticky-top">
                            <tr>
                              <th>Species Name</th>
                              <th>New Quantity</th>
                              <th style="width: 100px;">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(row, idx) in csvPreviewData" :key="idx" :class="{ 'table-secondary': row._notFound }">
                              <td>{{ row.name }}</td>
                              <td>{{ row.quantity }}</td>
                              <td>
                                <span v-if="row._notFound" class="badge bg-warning text-dark"><i class="fa fa-exclamation-circle me-1"></i>Not in list</span>
                                <span v-else class="badge bg-success"><i class="fa fa-check me-1"></i>Matched</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div class="card-footer bg-light d-flex align-items-center justify-content-between py-2">
                      <div class="text-muted small">
                        <i class="fa fa-info-circle text-primary me-1"></i>
                        {{ csvNewCount }} species will be updated with quantities from CSV
                      </div>
                      <div class="d-flex gap-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">Cancel</button>
                        <button type="button" class="btn btn-sm btn-success" :disabled="csvNewCount === 0" @click="applyCsvQuantities">
                          <i class="fa fa-check me-1"></i>Apply Quantities
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="laodinglicenceAreaSpecies" class="text-center py-2">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                <div v-else-if="licenceAreaSpecies && licenceAreaSpecies.length > 0">
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Name</th>
                          <th class="text-center">Quantity</th>
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
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="text-center py-2 text-muted">
                  <i class="fa fa-info-circle fa-2x mb-2"></i>
                  <p class="mb-0">Please select a licence and area to view available species.</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Save Button -->
      <div class="d-flex justify-content-end align-items-center mt-2 mb-2">
        <button type="button" class="btn btn-primary" :disabled="saving || !canSubmit" @click="submit()">
          <i class="fa fa-save me-1"></i>
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ editMode ? 'Update Package' : 'Save Package' }}
        </button>
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

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import { useToast } from '@/composables/useToast'
import { mapActions, mapState, mapWritableState } from 'pinia'
import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import { usePriceListStore } from '../../../stores/bushman/price-list-store.ts'
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store.ts' // bushman

export default defineComponent({
  props: {
    editMode: {
      type: Boolean,
      default: false,
    },
    editItem: {
      type: Object,
      default: null,
    },
  },
  emits: ['saved', 'go-back'],
  setup() {
    const formRef = ref()
    const { init } = useToast()

    const form = reactive({
      package_name: '',
      description: '',
      species: null as any,
      quantity: 1,
      area: null as any,
      licence: null as any,
    })

    return {
      formRef,
      form,
      init,
    }
  },
  data() {
    return {
      defaultColDef: {
        editable: true,
      },
      settingsStore: useSettingsStore(),
      speciesOptions: [] as any,
      areasOptions: [] as any,
      saving: false,
      regulatoryPackagesOptions: [] as any,
      loadingLicenceOptions: false,
      loading: false,
      originalQuantities: reactive({} as any),
      quntityChangedsaved: false,
      // CSV Import state
      showCsvPreview: false,
      csvHeaders: [] as string[],
      csvRawRows: [] as any[],
      csvPreviewData: [] as any[],
      csvColumnMap: {
        name: '',
        quantity: '',
      },
    }
  },

  computed: {
    ...mapWritableState(useSettingsStore, ['licenceAreaSpecies']),
    ...mapState(useSettingsStore, ['laodinglicenceAreaSpecies']),
    csvNewCount() {
      return this.csvPreviewData.filter((r: any) => !r._notFound).length
    },
    canSubmit() {
      return (
        this.form.package_name &&
        this.form.description &&
        this.form.licence &&
        this.form.area &&
        this.licenceAreaSpecies &&
        this.licenceAreaSpecies.length > 0 &&
        this.licenceAreaSpecies.some((s: any) => s.quantity > 0)
      )
    },
  },

  mounted() {
    this.getLicencePackages()
    this.getAreas()
    this.settingsStore.licenceAreaSpecies = []

    // If in edit mode, populate the form with existing data
    if (this.editMode && this.editItem) {
      this.form.package_name = this.editItem.name || ''
      this.form.description = this.editItem.description || ''

      // Set licence and area after options are loaded
      this.$nextTick(() => {
        if (this.editItem.regulatory_package) {
          this.form.licence = this.editItem.regulatory_package.id
        }
        if (this.editItem.area) {
          this.form.area = this.editItem.area.id
          // Load species for the area
          if (this.form.licence) {
            this.getLicenceAreaSpeciesList()
          }
        }

        // Pre-populate species if available
        if (this.editItem.species && this.editItem.species.length > 0) {
          setTimeout(() => {
            this.settingsStore.licenceAreaSpecies = this.editItem.species.map((s: any) => ({
              id: s.species?.id || s.id,
              name: s.species?.name || s.name,
              quantity: s.quantity || 1,
            }))
          }, 500)
        }
      })
    }
  },

  methods: {
    ...mapActions(useQuotaStore, ['getSpeciesList']),
    ...mapActions(useQuotaStore, ['getAllSpeciesPerQuotaPerArea']),
    ...mapActions(useQuotaStore, ['getAreaList']),
    ...mapActions(useSettingsStore, ['getHuntingsTypes']),
    ...mapActions(useSettingsStore, ['getCurrencies']),
    ...mapActions(useQuotaStore, ['getQuotas']),
    ...mapActions(usePriceListStore, [
      'createPriceList',
      'createSalesPackage',
      'getSalesPackageList',
      'updateSalesPackage',
    ]),
    ...mapActions(useRegulatoryPackageStore, ['getRegulatoryPackages']),
    ...mapActions(useSettingsStore, ['getHuntingLicenseAreaSpecies']),

    handleGoBack() {
      this.$emit('go-back')
    },

    onLicenceChange() {
      // Reset area and species when licence changes
      this.form.area = null
      this.settingsStore.licenceAreaSpecies = []
    },

    increaseQuantity(id: any) {
      const item = this.licenceAreaSpecies.find((item: any) => item.id === id)
      if (item && item.quantity < 100) {
        item.quantity++
        this.onChange(id, item.quantity)
      }
    },

    decreaseQuantity(id: any) {
      const item = this.licenceAreaSpecies.find((item: any) => item.id === id)
      if (item && item.quantity > 0) {
        item.quantity--
        this.onChange(id, item.quantity)
      }
    },

    async submit() {
      if (!this.formRef?.checkValidity()) {
        this.formRef?.reportValidity()
        return
      }

      this.saving = true

      // Filter out species with quantity 0 or less
      const speciesWithQuantity = this.licenceAreaSpecies.filter((species: any) => species.quantity > 0)

      if (speciesWithQuantity.length === 0) {
        this.init({
          message: 'Please add at least one species with quantity greater than 0.',
          color: 'warning',
        })
        this.saving = false
        return
      }

      const requestdata = {
        name: this.form.package_name,
        description: this.form.description,
        areaId: this.form.area,
        licenceId: this.form.licence,
        speciesObjectList: speciesWithQuantity,
      }

      try {
        let response
        if (this.editMode && this.editItem) {
          response = await this.updateSalesPackage(this.editItem.id, requestdata)
          if (response.status === 200) {
            this.saving = false
            this.init({ message: 'Package updated successfully.', color: 'success' })
            this.$emit('saved')
          }
        } else {
          response = await this.createSalesPackage(requestdata)
          if (response.status === 201) {
            this.saving = false
            this.init({ message: response.data.message || 'Package created successfully.', color: 'success' })
            this.$emit('saved')
          }
        }
      } catch (error: any) {
        this.saving = false
        const errors = handleErrors(error.response)
        console.log(errors)
        this.init({
          message: errors.join(', ') || (error instanceof Error ? error.message : 'An error occurred'),
          color: 'danger',
        })
      }
    },

    async getLicencePackages() {
      this.loadingLicenceOptions = true
      try {
        const response = await this.getRegulatoryPackages()
        if (response.status === 200) {
          this.loadingLicenceOptions = false
          const data = response.data
          this.regulatoryPackagesOptions = data.map((item: any) => ({
            value: item.id,
            text: item.name + ' -> ' + item.duration + ' days',
          }))
        }
      } catch (error) {
        console.log(error)
        this.loadingLicenceOptions = false
      }
    },

    async getAreas() {
      try {
        const response = await this.getAreaList()
        this.areasOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item.id,
            text: item.name,
          }
        })
      } catch (error) {
        console.log(error)
      }
    },

    async getLicenceAreaSpeciesList() {
      if (!this.form.area || !this.form.licence) {
        this.settingsStore.licenceAreaSpecies = []
        return
      }

      const payload = {
        areaId: this.form.area,
        licenceId: this.form.licence,
      }

      try {
        const response = await this.getHuntingLicenseAreaSpecies(payload)
        if (response.status === 200) {
          const data = response.data
          this.speciesOptions = data.map((item: any) => ({
            value: item.id,
            text: item.name,
          }))
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.init({
          message: errors.join(', ') || (error instanceof Error ? error.message : 'An error occurred'),
          color: 'danger',
        })
      }
    },

    async getSalesPackages() {
      this.loading = true
      try {
        const response = await this.getSalesPackageList(true)
        if (response.status === 200) {
          this.loading = false
        }
      } catch (error) {
        console.log(error)
        this.loading = false
      }
    },

    onChange(id: any, newValue: any) {
      // Set the original value if it hasn't been set yet
      if (!(id in this.originalQuantities)) {
        const item = this.licenceAreaSpecies.find((item: any) => item.id === id)
        this.originalQuantities[id] = item.quantity
      }

      const updatedItem = this.licenceAreaSpecies.find((item: any) => item.id === id)
      if (updatedItem) {
        updatedItem.quantity = newValue
        // then update list
        this.licenceAreaSpecies = [...this.licenceAreaSpecies]
      }
    },

    // CSV Import Methods
    triggerCsvInput() {
      const el: any = this.$refs.csvInputRef
      if (el) el.click()
    },

    async parseCsvText(text: string) {
      const trimmed = String(text || '').trim()
      if (!trimmed) return { headerFields: [], rows: [] }
      try {
        const PapaModule = await import('papaparse')
        const Papa = PapaModule && (PapaModule.default || PapaModule)
        const parsed = Papa.parse(trimmed, { header: true, skipEmptyLines: true })
        const headerFields = parsed?.meta?.fields || (parsed.data && parsed.data.length ? Object.keys(parsed.data[0]) : [])
        return { headerFields, rows: parsed.data || [] }
      } catch (e) {
        const lines = trimmed.split(/\r?\n/).filter((l: string) => l.trim() !== '')
        if (lines.length === 0) return { headerFields: [], rows: [] }

        const splitLine = (line: string) => {
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
        const rows = lines.slice(1).map((ln: string) => {
          const fields = splitLine(ln)
          const obj: any = {}
          for (let i = 0; i < headerFields.length; i++) {
            obj[headerFields[i]] = fields[i] ?? ''
          }
          return obj
        })
        return { headerFields, rows }
      }
    },

    async onCsvSelected(e: Event) {
      const input = e.target as HTMLInputElement
      const file = input.files && input.files[0]
      if (!file) return
      await this.processCsvFile(file)
      input.value = ''
    },

    async processCsvFile(file: File) {
      const text = await file.text()
      const parsed = await this.parseCsvText(text)
      if (!parsed || !parsed.rows || parsed.rows.length === 0) {
        this.init({ message: 'CSV contains no rows', color: 'info' })
        return
      }

      this.csvHeaders = parsed.headerFields
      this.csvRawRows = parsed.rows

      const headersLower = parsed.headerFields.map((h: string) => h.toLowerCase())
      
      const tryNames = ['name', 'species', 'species_name', 'speciesname']
      for (const t of tryNames) {
        const idx = headersLower.findIndex((h: string) => h.includes(t))
        if (idx >= 0) {
          this.csvColumnMap.name = parsed.headerFields[idx]
          break
        }
      }
      if (!this.csvColumnMap.name && parsed.headerFields.length > 0) {
        this.csvColumnMap.name = parsed.headerFields[0]
      }

      const tryQty = ['quantity', 'qty', 'count', 'amount']
      for (const t of tryQty) {
        const idx = headersLower.findIndex((h: string) => h.includes(t))
        if (idx >= 0) {
          this.csvColumnMap.quantity = parsed.headerFields[idx]
          break
        }
      }

      this.recalculateCsvPreview()
      this.showCsvPreview = true
    },

    recalculateCsvPreview() {
      const availableSpeciesMap = new Map(
        this.licenceAreaSpecies.map((sp: any) => [(sp.name || '').toLowerCase().trim(), sp])
      )
      
      this.csvPreviewData = this.csvRawRows.map((row: any) => {
        const name = String(row[this.csvColumnMap.name] || '').trim()
        const quantity = this.csvColumnMap.quantity ? parseInt(row[this.csvColumnMap.quantity]) || 1 : 1
        
        const key = name.toLowerCase()
        const matchedSpecies = availableSpeciesMap.get(key)
        const isNotFound = !matchedSpecies
        
        return {
          name,
          quantity: Math.max(0, quantity),
          _notFound: isNotFound,
          _speciesId: matchedSpecies?.id,
        }
      }).filter((r: any) => r.name)
    },

    closeCsvPreview() {
      this.showCsvPreview = false
      this.csvHeaders = []
      this.csvRawRows = []
      this.csvPreviewData = []
      this.csvColumnMap.name = ''
      this.csvColumnMap.quantity = ''
    },

    applyCsvQuantities() {
      const toApply = this.csvPreviewData.filter((r: any) => !r._notFound)
      if (toApply.length === 0) {
        this.init({ message: 'No matching species found', color: 'info' })
        return
      }

      let updatedCount = 0
      for (const sp of toApply) {
        const item = this.licenceAreaSpecies.find((s: any) => s.id === sp._speciesId)
        if (item) {
          item.quantity = sp.quantity
          updatedCount++
        }
      }

      // Trigger reactivity update
      this.licenceAreaSpecies = [...this.licenceAreaSpecies]

      this.init({ message: `Updated quantities for ${updatedCount} species from CSV`, color: 'success' })
      this.closeCsvPreview()
    },
  },
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
</style>
