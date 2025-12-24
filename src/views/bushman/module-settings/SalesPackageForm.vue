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
                <!-- Change entry mode button -->
                <button
                  v-if="entryMode !== null && licenceAreaSpecies && licenceAreaSpecies.length > 0"
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  @click="resetEntryMode"
                >
                  <i class="fa fa-exchange-alt me-1"></i> Change Entry Mode
                </button>
              </div>
              <div class="card-body">
                <div v-if="laodinglicenceAreaSpecies" class="text-center py-2">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>

                <!-- Entry Mode Selection -->
                <div v-else-if="licenceAreaSpecies && licenceAreaSpecies.length > 0 && entryMode === null" class="entry-mode-selection">
                  <div class="text-center mb-3">
                    <h6 class="text-muted mb-3">How would you like to enter species quantities?</h6>
                  </div>
                  <div class="row g-3 justify-content-center">
                    <div class="col-md-5">
                      <div 
                        class="card h-100 border-2 cursor-pointer entry-mode-card" 
                        @click="entryMode = 'manual'"
                      >
                        <div class="card-body text-center py-4">
                          <i class="fa fa-hand-pointer fa-3x text-primary mb-3"></i>
                          <h5 class="card-title">Manual Entry</h5>
                          <p class="card-text text-muted small">
                            Use +/- buttons to adjust quantities for each species from the licence
                          </p>
                          <span class="badge bg-light text-dark">
                            <i class="fa fa-list me-1"></i>{{ licenceAreaSpecies.length }} species available
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-5">
                      <div 
                        class="card h-100 border-2 cursor-pointer entry-mode-card" 
                        @click="entryMode = 'csv'"
                      >
                        <div class="card-body text-center py-4">
                          <i class="fa fa-file-csv fa-3x text-success mb-3"></i>
                          <h5 class="card-title">CSV Upload</h5>
                          <p class="card-text text-muted small">
                            Upload a CSV file with species names and quantities. Only species in the licence will be accepted.
                          </p>
                          <span class="badge bg-light text-dark">
                            <i class="fa fa-upload me-1"></i>Bulk import
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- CSV Mode -->
                <div v-else-if="entryMode === 'csv' && licenceAreaSpecies && licenceAreaSpecies.length > 0">
                  <!-- Custom CSV File Input -->
                  <div class="csv-upload-area">
                    <div class="upload-box" :class="{ 'drag-over': isDragging }">
                      <input
                        ref="fileInput"
                        type="file"
                        accept=".csv"
                        class="d-none"
                        @change="handleFileSelect"
                      />
                      <div v-if="!csvFile" class="upload-placeholder" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleFileDrop">
                        <i class="fa fa-cloud-upload fa-3x text-muted mb-3"></i>
                        <p class="mb-2">Drag & drop your CSV file here</p>
                        <p class="text-muted small">or</p>
                        <button type="button" class="btn btn-outline-primary" @click="$refs.fileInput.click()">
                          <i class="fa fa-folder-open me-1"></i> Browse Files
                        </button>
                      </div>
                      <div v-else class="file-info">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <div class="d-flex align-items-center gap-2">
                            <i class="fa fa-file-csv text-success fa-2x"></i>
                            <div>
                              <div class="fw-bold">{{ csvFile.name }}</div>
                              <div class="text-muted small">{{ formatFileSize(csvFile.size) }} • {{ csvRows.length }} rows</div>
                            </div>
                          </div>
                          <button type="button" class="btn btn-sm btn-outline-danger" @click="clearCsvFile">
                            <i class="fa fa-times"></i> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- CSV Parsing Progress -->
                  <div v-if="parsingCsv" class="mt-3">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                      <span>Parsing CSV file...</span>
                    </div>
                  </div>

                  <!-- CSV Preview Table -->
                  <div v-if="csvRows.length > 0 && !parsingCsv" class="mt-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="mb-0">Preview ({{ csvRows.length }} rows)</h6>
                      <div class="form-check">
                        <input
                          id="selectAllRows"
                          v-model="selectAllRows"
                          type="checkbox"
                          class="form-check-input"
                          @change="toggleSelectAll"
                        />
                        <label class="form-check-label" for="selectAllRows">
                          Select All
                        </label>
                      </div>
                    </div>
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered">
                        <thead class="table-light">
                          <tr>
                            <th style="width: 40px;"></th>
                            <th>Species Name</th>
                            <th>Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(row, idx) in csvRows" :key="idx">
                            <td class="text-center">
                              <input
                                v-model="row.selected"
                                type="checkbox"
                                class="form-check-input"
                              />
                            </td>
                            <td>{{ row.name }}</td>
                            <td>{{ row.quantity }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="d-flex justify-content-end mt-2">
                      <button type="button" class="btn btn-success" @click="importCsvRows">
                        <i class="fa fa-check me-1"></i> Import Selected
                      </button>
                    </div>
                  </div>

                  <!-- Import Progress -->
                  <div v-if="csvImportUsed" class="mt-3">
                    <div class="alert alert-success py-2 mb-3">
                      <i class="fa fa-check-circle me-2"></i>
                      <strong>CSV Imported:</strong> {{ csvImportedSpeciesNames.length }} species will be saved to this package.
                    </div>
                    <h6 class="text-muted mb-2">Species to be saved:</h6>
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered">
                        <thead class="table-light">
                          <tr>
                            <th>Species Name</th>
                            <th class="text-center" style="width: 100px;">Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in csvImportedSpeciesList" :key="item.name">
                            <td>{{ item.name }}</td>
                            <td class="text-center">{{ item.quantity }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Manual Entry Mode -->
                <div v-else-if="entryMode === 'manual' && licenceAreaSpecies && licenceAreaSpecies.length > 0">
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

                <div v-else-if="!licenceAreaSpecies || licenceAreaSpecies.length === 0" class="text-center py-2 text-muted">
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
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store.ts'
import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'

export default defineComponent({
  components: {
    MultiRowTableInput,
  },
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
      // Entry mode: null = not selected, 'manual' = +/- buttons, 'csv' = CSV upload
      entryMode: null as 'manual' | 'csv' | null,
      // CSV Import state
      csvImportUsed: false,
      csvImportedSpeciesNames: [] as string[],
      csvImportedSpeciesList: [] as { name: string; quantity: number }[],
      // Custom CSV variables
      csvFile: null as File | null,
      csvRows: [] as any[],
      parsingCsv: false,
      isDragging: false,
      selectAllRows: true,
    }
  },

  computed: {
    ...mapWritableState(useSettingsStore, ['licenceAreaSpecies']),
    ...mapState(useSettingsStore, ['laodinglicenceAreaSpecies']),
    // List of species names from licence for CSV validation
    licenceSpeciesNames(): string[] {
      return (this.licenceAreaSpecies || []).map((s: any) => s.name || '')
    },
    canSubmit(): boolean {
      const hasBasicInfo = this.form.package_name && this.form.description && this.form.licence && this.form.area
      
      if (this.entryMode === 'csv') {
        // CSV mode: must have imported species
        return hasBasicInfo && this.csvImportUsed && this.csvImportedSpeciesList.length > 0
      } else if (this.entryMode === 'manual') {
        // Manual mode: must have species with quantity > 0
        return hasBasicInfo && this.licenceAreaSpecies && this.licenceAreaSpecies.some((s: any) => s.quantity > 0)
      }
      return false
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
      // Reset entry mode when licence changes
      this.resetEntryMode()
    },

    // Reset entry mode selection
    resetEntryMode() {
      this.entryMode = null
      this.csvImportUsed = false
      this.csvImportedSpeciesNames = []
      this.csvImportedSpeciesList = []
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

      let speciesWithQuantity: any[] = []

      if (this.entryMode === 'csv') {
        // CSV mode: use the imported species list
        speciesWithQuantity = this.csvImportedSpeciesList.map((item: any) => {
          // Find the species in licenceAreaSpecies to get the ID
          const licenceSpecies = this.licenceAreaSpecies.find((s: any) => 
            (s.name || '').toLowerCase().trim() === item.name.toLowerCase().trim()
          )
          return {
            id: licenceSpecies?.id,
            name: item.name,
            quantity: item.quantity
          }
        }).filter((s: any) => s.id) // Only include if we found a matching licence species
      } else {
        // Manual mode: filter species with quantity > 0
        speciesWithQuantity = this.licenceAreaSpecies.filter((species: any) => species.quantity > 0)
      }

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
        description: this.form.description?.trim() || '-',
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

    // CSV Import Handler - only accepts species from the licence
    handleCsvImport(data: any[]) {
      // The CSVInput component already validates against allowedValues (licenceSpeciesNames)
      // So data here should only contain valid species from the licence
      
      if (data.length === 0) {
        this.init({ 
          message: 'No valid species found in CSV. Only species from the licence can be imported.', 
          color: 'warning' 
        })
        return
      }

      // Store imported species data
      this.csvImportUsed = true
      this.csvImportedSpeciesNames = data.map((row: any) => 
        (row.name || '').toLowerCase().trim()
      )
      
      // Build the species list with quantities
      this.csvImportedSpeciesList = data.map((row: any) => ({
        name: String(row.name || '').trim(),
        quantity: Math.max(1, parseInt(row.quantity) || 1)
      }))

      this.init({ 
        message: `CSV imported successfully! ${this.csvImportedSpeciesList.length} species will be saved to this package.`, 
        color: 'success' 
      })
    },

    // Custom CSV file handling methods
    handleFileSelect(event: Event) {
      const target = event.target as HTMLInputElement
      const files = target.files
      if (files && files.length > 0) {
        this.processFile(files[0])
      }
    },

    handleFileDrop(event: DragEvent) {
      this.isDragging = false
      const files = event.dataTransfer?.files
      if (files && files.length > 0) {
        this.processFile(files[0])
      }
    },

    processFile(file: File) {
      if (!file.name.endsWith('.csv')) {
        this.init({ message: 'Please upload a CSV file', color: 'warning' })
        return
      }

      this.csvFile = file
      this.parsingCsv = true

      const reader = new FileReader()
      reader.onload = (event) => {
        const csv = event.target?.result as string
        this.parseCSV(csv)
      }
      reader.onerror = () => {
        this.init({ message: 'Failed to read file', color: 'danger' })
        this.parsingCsv = false
      }
      reader.readAsText(file)
    },

    parseCSV(csv: string) {
      try {
        const lines = csv.split('\n').filter(line => line.trim())
        
        // Skip header if it exists (first line with common headers)
        let startIdx = 0
        if (lines.length > 0 && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('species'))) {
          startIdx = 1
        }

        const rows = []
        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim())
          if (parts.length >= 2) {
            const name = parts[0]
            const quantity = parseInt(parts[1]) || 1

            // Check if species exists in licence
            const exists = this.licenceAreaSpecies?.some((s: any) => 
              (s.name || '').toLowerCase().trim() === name.toLowerCase().trim()
            )

            if (exists && name) {
              rows.push({
                name,
                quantity: Math.max(1, quantity),
                selected: true
              })
            }
          }
        }

        this.csvRows = rows
        this.selectAllRows = true
        this.parsingCsv = false

        if (rows.length === 0) {
          this.init({ 
            message: 'No valid species found in CSV. Species must match those in the selected licence.', 
            color: 'warning' 
          })
        }
      } catch (err) {
        this.init({ message: 'Failed to parse CSV file', color: 'danger' })
        this.parsingCsv = false
      }
    },

    clearCsvFile() {
      this.csvFile = null
      this.csvRows = []
      this.csvImportUsed = false
      this.csvImportedSpeciesNames = []
      this.csvImportedSpeciesList = []
      this.selectAllRows = true
      if (this.$refs.fileInput) {
        (this.$refs.fileInput as HTMLInputElement).value = ''
      }
    },

    toggleSelectAll() {
      this.csvRows.forEach((row: any) => {
        row.selected = this.selectAllRows
      })
    },

    formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    },

    importCsvRows() {
      const selectedRows = this.csvRows.filter((row: any) => row.selected)
      if (selectedRows.length === 0) {
        this.init({ message: 'Please select at least one row to import', color: 'warning' })
        return
      }

      // Store imported species data
      this.csvImportUsed = true
      this.csvImportedSpeciesNames = selectedRows.map((row: any) => row.name.toLowerCase().trim())
      this.csvImportedSpeciesList = selectedRows.map((row: any) => ({
        name: String(row.name || '').trim(),
        quantity: Math.max(1, parseInt(row.quantity) || 1)
      }))

      this.init({ 
        message: `${selectedRows.length} species imported successfully!`, 
        color: 'success' 
      })

      // Clear file after import
      this.clearCsvFile()
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
