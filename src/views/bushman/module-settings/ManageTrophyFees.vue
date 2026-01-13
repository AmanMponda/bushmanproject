<template>
  <div class="trophy-fees-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item"><a href="#">Price Structures</a></li>
          <li class="breadcrumb-item active">Trophy Fees</li>
        </ul>
      </div>
    </div>

    <!-- List -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="rows"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :custom-filters="customFilters"
                @update:filters="handleFiltersUpdate"
              >
                <template #name="{ row }">
                  {{ (row as any).name }}
                </template>
                <template #location_name="{ row }">
                  {{ (row as any).location_name }}
                </template>
                <template #amount="{ row }">
                  {{ (row as any).amount }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editRow(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="deleteRow(row)">
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

    <!-- Form -->
    <template v-else>
      <div class="trophy-fees-form-page">
        <div class="form-trophy-fees-container">
          <div v-if="!saving" class="card">
            <div class="card-header bg-white border-bottom">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-secondary btn-sm" @click="toggleForm">
                    <i class="fa fa-arrow-left me-1"></i> Back
                  </button>
                  <i class="fa fa-edit text-primary fs-5"></i>
                  <h2 class="h5 mb-0">{{ editMode ? 'Edit Trophy Fee' : bulkMode ? 'Bulk Add Trophy Fees' : 'Create Trophy Fee' }}</h2>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span v-if="!editMode" class="small text-muted">Bulk Mode</span>
                  <div v-if="!editMode" class="form-check form-switch mb-0">
                    <input
                      v-model="bulkMode"
                      class="form-check-input"
                      type="checkbox"
                      @change="onBulkModeToggle"
                    />
                  </div>
                  <span v-if="!editMode && !bulkMode" class="small text-muted ms-3">Enable Variant</span>
                  <div v-if="!editMode && !bulkMode" class="form-check form-switch mb-0">
                    <input
                      v-model="form.has_variants"
                      class="form-check-input"
                      type="checkbox"
                      :disabled="editMode"
                      @change="onVariantToggle"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="card-body">
              <!-- Bulk Mode Multi-Row Table -->
              <div v-if="bulkMode" class="bulk-input-section">
                <!-- Shared Filters -->
                <div class="row g-3 mb-4 p-3 bg-light rounded">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Location <span class="text-danger">*</span></label>
                    <select v-model="bulkData.location_id" class="form-select" required>
                      <option :value="null">Select Location</option>
                      <option v-for="l in locationOptions" :key="l.value" :value="l.value">{{ l.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Currency <span class="text-danger">*</span></label>
                    <select v-model="bulkData.currency_id" class="form-select" required>
                      <option :value="null">Select Currency</option>
                      <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
                    </select>
                  </div>
                </div>

                <!-- Multi-Row Input Table -->
                <div class="table-responsive">
                  <table class="table table-bordered table-hover">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 60%">Species <span class="text-danger">*</span></th>
                        <th style="width: 30%">Amount <span class="text-danger">*</span></th>
                        <th style="width: 10%" class="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, index) in bulkData.rows" :key="index">
                        <td>
                          <select v-model="row.species_id" class="form-select form-select-sm" required>
                            <option :value="null">Select Species</option>
                            <option v-for="s in speciesOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
                          </select>
                        </td>
                        <td>
                          <input v-model.number="row.amount" type="number" step="0.01" min="0" class="form-control form-control-sm" placeholder="0.00" required />
                        </td>
                        <td class="text-center">
                          <button type="button" class="btn btn-danger btn-sm" @click="removeBulkRow(index)" title="Remove Row">
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="bulkData.rows.length === 0">
                        <td colspan="3" class="text-center text-muted py-3">
                          <i class="fa fa-inbox fa-2x mb-2"></i>
                          <p class="mb-0">No rows added. Click "Add Row" to start.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-3">
                  <button type="button" class="btn btn-outline-primary" @click="addBulkRow">
                    <i class="fa fa-plus me-1"></i> Add Row
                  </button>
                  <div class="text-muted">
                    <small>{{ bulkData.rows.length }} row(s) added</small>
                  </div>
                </div>
              </div>

              <!-- Single Entry Form -->
              <form v-else @submit.prevent="save">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Species <span class="text-danger">*</span></label>
                    <select v-model="form.species_id" class="form-select" :disabled="editMode" required>
                      <option :value="null">Select Species</option>
                      <option v-for="s in speciesOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Location <span class="text-danger">*</span></label>
                    <select v-model="form.location_id" class="form-select" required>
                      <option :value="null">Select Location</option>
                      <option v-for="l in locationOptions" :key="l.value" :value="l.value">{{ l.text }}</option>
                    </select>
                  </div>

                  <div v-if="form.has_variants" class="col-md-4">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input v-model="form.name" class="form-control" :disabled="editMode" />
                  </div>
                  <div v-if="form.has_variants" class="col-md-4">
                    <label class="form-label">Trophy Count</label>
                    <select v-model="form.trophy_count_value_id" class="form-select" :disabled="editMode">
                      <option :value="null">Select Trophy Count</option>
                      <option v-for="t in trophyCountOptions" :key="t.value" :value="t.value">{{ t.text }}</option>
                    </select>
                  </div>
                  <div v-if="form.has_variants" class="col-md-4">
                    <label class="form-label">Weight Class</label>
                    <div class="d-flex gap-3 mt-2">
                      <div class="form-check">
                        <input
                          v-model="form.weight_class_applicable"
                          class="form-check-input"
                          type="radio"
                          name="weight_class_radio"
                          :value="true"
                          :disabled="editMode"
                          id="weight_applicable"
                        />
                        <label class="form-check-label" for="weight_applicable">
                          Applicable
                        </label>
                      </div>
                      <div class="form-check">
                        <input
                          v-model="form.weight_class_applicable"
                          class="form-check-input"
                          type="radio"
                          name="weight_class_radio"
                          :value="false"
                          :disabled="editMode"
                          id="weight_not_applicable"
                        />
                        <label class="form-check-label" for="weight_not_applicable">
                          Not Applicable
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Currency <span class="text-danger">*</span></label>
                    <select v-model="form.currency_id" class="form-select" required>
                      <option :value="null">Select Currency</option>
                      <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Amount <span class="text-danger">*</span></label>
                    <input v-model.number="form.amount" type="number" step="0.01" min="0" class="form-control" />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="d-flex justify-content-end align-items-center mt-2 mb-2">
            <button v-if="editMode" type="button" class="btn btn-secondary me-2" @click="cancelEdit">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="saving || (bulkMode ? !canSaveBulk : !canSave)" @click="bulkMode ? saveBulk() : save()">
              <i class="fa fa-save me-1"></i>
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ editMode ? 'Update Trophy Fee' : bulkMode ? 'Save All Trophy Fees' : 'Save Trophy Fee' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'
import handleErrors from '../../../stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useTrophyFeesStore } from '../../../stores/bushman/trophy-fees-store'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import { useHuntingAreaStore } from '../../../stores/bushman/hunting-story'

export default defineComponent({
  name: 'ManageTrophyFeesPage',
  components: {
    StandardDataTable,
  },

  data() {
    const form = reactive({
      id: null as any,
      species_id: null as any,
      name: '',
      has_variants: false,
      trophy_count_value_id: null as any,
      weight_class_applicable: null as any,
      location_id: null as any,
      currency_id: null as any,
      amount: null as any,
    })

    return {
      form,
      rows: [] as any[],
      speciesOptions: [] as any[],
      trophyCountOptions: [] as any[],
      weightClassOptions: [] as any[],
      locationOptions: [] as any[],
      currencyOptions: [] as any[],
      selectedSpecies: null as any,
      selectedLocation: null as any,
      showList: true,
      editMode: false,
      bulkMode: false,
      loading: false,
      saving: false,
      toast: useToast(),
      bulkData: reactive({
        location_id: null as any,
        currency_id: null as any,
        rows: [] as any[],
      }),
    }
  },

  computed: {
    columns() {
      return [
        { key: 'name', label: 'Trophy Fee', sortable: true, visible: true },
        { key: 'location_name', label: 'Location', sortable: true, visible: true },
        { key: 'amount', label: 'Amount', sortable: true, visible: true },
        { key: 'actions', label: 'Actions', sortable: false, visible: true },
      ]
    },
    pageActions() {
      return [
        {
          label: 'Add New',
          icon: 'fa fa-plus',
          class: 'btn btn-primary',
          method: () => this.toggleForm(),
        },
      ]
    },
    customFilters() {
      return [
        {
          key: 'species_id',
          label: 'Species',
          type: 'select',
          placeholder: 'Select Species',
          options: this.speciesOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.text,
          })),
          defaultValue: this.selectedSpecies?.value || '',
        },
        {
          key: 'location_id',
          label: 'Location',
          type: 'select',
          placeholder: 'Select Location',
          options: this.locationOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.text,
          })),
          defaultValue: this.selectedLocation?.value || '',
        },
      ]
    },
    showNameField() {
      return !!this.form.has_variants
    },
    canSave() {
      const hasName = !this.showNameField || !!this.form.name
      const hasVariantSelection = !!this.form.trophy_count_value_id || !!this.form.weight_class_value_id
      return (
        !!this.form.species_id &&
        !!this.form.location_id &&
        !!this.form.currency_id &&
        hasName &&
        (!this.form.has_variants || hasVariantSelection) &&
        this.form.amount !== null &&
        this.form.amount !== undefined &&
        !isNaN(Number(this.form.amount))
      )
    },
    canSaveBulk() {
      if (!this.bulkData.location_id || !this.bulkData.currency_id) return false
      if (this.bulkData.rows.length === 0) return false
      return this.bulkData.rows.every((row: any) => 
        !!row.species_id && 
        row.amount !== null && 
        row.amount !== undefined && 
        !isNaN(Number(row.amount)) &&
        Number(row.amount) >= 0
      )
    },
  },

  mounted() {
    this.loadAttributes()
    this.loadSpecies()
    this.loadLocations()
    this.loadCurrencies()
    this.getPricing()
  },

  methods: {
    onVariantToggle() {
      if (this.form.has_variants) return
      this.form.name = ''
      this.form.trophy_count_value_id = null
      this.form.weight_class_applicable = null
    },
    onBulkModeToggle() {
      if (this.bulkMode) {
        // Initialize with 5 empty rows
        this.bulkData.rows = Array(5).fill(null).map(() => ({
          species_id: null,
          amount: null,
        }))
      } else {
        // Clear bulk data
        this.bulkData.location_id = null
        this.bulkData.currency_id = null
        this.bulkData.rows = []
      }
    },
    addBulkRow() {
      this.bulkData.rows.push({
        species_id: null,
        amount: null,
      })
    },
    removeBulkRow(index: number) {
      this.bulkData.rows.splice(index, 1)
    },
    ...mapActions(useTrophyFeesStore, [
      'fetchTrophyFeePricing',
      'getTrophyFeePricingById',
      'createCombinedTrophyFee',
      'updateTrophyFeePricing',
      'deleteTrophyFeePricingById',
      'fetchTrophyFeeAttributes',
      'fetchTrophyFeeSpecies',
    ]),
    ...mapActions(useQuotaStore, ['getAreaList']),
    ...mapActions(useSettingsStore, ['getCurrencies']),
    ...mapActions(useHuntingAreaStore, ['getLocations']),

    async loadAttributes() {
      try {
        const response = await this.fetchTrophyFeeAttributes()
        const data = response.data?.data || response.data || {}
        const trophyCount = data.trophy_count?.values || []
        const weightClass = data.weight_class?.values || []
        this.trophyCountOptions = trophyCount.map((item: any) => ({ value: item.id, text: item.value }))
        this.weightClassOptions = weightClass.map((item: any) => ({ value: item.id, text: item.value }))
      } catch (error) {
        console.error('Failed to load trophy fee attributes', error)
      }
    },

    async loadSpecies() {
      try {
        const response = await this.fetchTrophyFeeSpecies()
        const data = response.data?.data || response.data || []
        this.speciesOptions = data.map((item: any) => ({
          value: item.id,
          text: item.swahili_name ? `${item.name} (${item.swahili_name})` : item.name,
        }))
      } catch (error) {
        console.error('Failed to load species', error)
      }
    },

    async loadLocations() {
      try {
        const response = await this.getLocations()
        // Extract array from paginated response structure
        // Response: { success: true, data: { data: [...], current_page, ... } }
        let locations = []
        if (Array.isArray(response.data?.data?.data)) {
          locations = response.data.data.data
        } else if (Array.isArray(response.data?.data)) {
          locations = response.data.data
        } else if (Array.isArray(response.data)) {
          locations = response.data
        }
        
        // Filter for GAME type locations only
        const gameLocations = locations.filter((item: any) => 
          item.type === 'GAME' || item.location_type === 'GAME'
        )
        this.locationOptions = gameLocations.map((item: any) => ({
          value: item.id,
          text: item.name,
        }))
      } catch (error) {
        console.error('Failed to load locations', error)
      }
    },

    async loadCurrencies() {
      try {
        const response = await this.getCurrencies()
        this.currencyOptions = response.data.map((item: any) => ({
          value: item.id,
          text: item.name,
          symbol: item.symbol,
        }))
      } catch (error) {
        console.error('Failed to load currencies', error)
      }
    },

    async getPricing(params: any = {}) {
      this.loading = true
      try {
        const response = await this.fetchTrophyFeePricing(params)
        const data = response.data?.data || response.data || []
        this.rows = data.map((item: any) => ({
          id: item.id,
          name: item.name || 'N/A',
          location_name: item.location_name || 'N/A',
          amount: item.formatted_amount || (item.currency ? `${item.currency} ${item.amount}` : item.amount),
          _raw: item,
        }))
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to load trophy fees', color: 'danger' })
      } finally {
        this.loading = false
      }
    },

    handleFiltersUpdate(filters: any) {
      const params: any = {}
      if (filters.species_id) {
        params.species_id = filters.species_id
        this.selectedSpecies = this.speciesOptions.find((s: any) => s.value === filters.species_id) || null
      } else {
        this.selectedSpecies = null
      }
      if (filters.location_id) {
        params.location_id = filters.location_id
        this.selectedLocation = this.locationOptions.find((l: any) => l.value === filters.location_id) || null
      } else {
        this.selectedLocation = null
      }
      this.getPricing(params)
    },

    toggleForm() {
      this.showList = !this.showList
      if (this.showList) {
        this.resetForm()
      }
    },

    resetForm() {
      this.editMode = false
      this.bulkMode = false
      this.form.id = null
      this.form.species_id = null
      this.form.name = ''
      this.form.has_variants = false
      this.form.trophy_count_value_id = null
      this.form.weight_class_applicable = null
      this.form.location_id = null
      this.form.currency_id = null
      this.form.amount = null
      this.bulkData.location_id = null
      this.bulkData.currency_id = null
      this.bulkData.rows = []
    },

    async editRow(row: any) {
      const raw = row._raw || {}
      if (!raw.id) return
      this.editMode = true
      this.showList = false
      this.form.id = raw.id

      try {
        const response = await this.getTrophyFeePricingById(raw.id)
        const data = response.data?.data || response.data || {}
        this.form.species_id = data.species_id || data.species?.id || null
        this.form.name = data.name || ''
        this.form.has_variants = !!(data.trophy_count || data.weight_class)
        this.form.trophy_count_value_id = data.trophy_count?.attribute_value_id || null
        this.form.weight_class_applicable = data.weight_class?.is_applicable || null
        this.form.location_id = data.location_id || data.location?.id || null
        this.form.currency_id = data.currency_id || data.currency?.id || null
        this.form.amount = data.amount ? Number(data.amount) : null
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to load trophy fee details', color: 'danger' })
      }
    },

    cancelEdit() {
      this.toggleForm()
    },

    async save() {
      if (!this.canSave) {
        this.toast.init({ message: 'Please fill required fields', color: 'warning' })
        return
      }

      this.saving = true
      try {
        if (this.editMode && this.form.id) {
          const payload: any = {
            location_id: this.form.location_id,
            currency_id: this.form.currency_id,
            amount: Number(this.form.amount),
          }
          await this.updateTrophyFeePricing(this.form.id, payload)
          this.toast.init({ message: 'Trophy fee updated', color: 'success' })
        } else {
          const payload: any = {
            species_id: this.form.species_id,
            location_id: this.form.location_id,
            currency_id: this.form.currency_id,
            amount: Number(this.form.amount),
          }
          if (this.showNameField) {
            payload.name = this.form.name
            if (this.form.trophy_count_value_id) {
              payload.trophy_count_value_id = this.form.trophy_count_value_id
            }
            if (this.form.weight_class_applicable !== null && this.form.weight_class_applicable !== undefined) {
              payload.weight_class_applicable = this.form.weight_class_applicable
            }
          }
          await this.createCombinedTrophyFee(payload)
          this.toast.init({ message: 'Trophy fee created', color: 'success' })
        }

        this.showList = true
        this.resetForm()
        this.getPricing()
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to save trophy fee', color: 'danger' })
      } finally {
        this.saving = false
      }
    },

    async saveBulk() {
      if (!this.canSaveBulk) {
        this.toast.init({ message: 'Please fill required fields', color: 'warning' })
        return
      }

      this.saving = true
      let successCount = 0
      let failCount = 0

      try {
        for (const row of this.bulkData.rows) {
          try {
            const payload: any = {
              species_id: row.species_id,
              location_id: this.bulkData.location_id,
              currency_id: this.bulkData.currency_id,
              amount: Number(row.amount),
            }
            await this.createCombinedTrophyFee(payload)
            successCount++
          } catch (error) {
            console.error('Failed to save row:', row, error)
            failCount++
          }
        }

        if (successCount > 0) {
          this.toast.init({ 
            message: `${successCount} trophy fee(s) created${failCount > 0 ? `, ${failCount} failed` : ''}`, 
            color: failCount > 0 ? 'warning' : 'success' 
          })
        } else {
          this.toast.init({ message: 'Failed to create trophy fees', color: 'danger' })
        }

        if (successCount > 0) {
          this.showList = true
          this.resetForm()
          this.getPricing()
        }
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to save trophy fees', color: 'danger' })
      } finally {
        this.saving = false
      }
    },

    async deleteRow(row: any) {
      const raw = row._raw || {}
      if (!raw.id) return
      try {
        await this.deleteTrophyFeePricingById(raw.id)
        this.toast.init({ message: 'Trophy fee deleted', color: 'success' })
        this.getPricing()
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to delete trophy fee', color: 'danger' })
      }
    },
  },
})
</script>

<style scoped>
.trophy-fees-page {
  min-height: 100vh;
}

.trophy-fees-form-page {
  padding: 0 0.25rem;
}

.form-trophy-fees-container {
  max-width: 1100px;
}

.bulk-input-section .table {
  margin-bottom: 0;
}

.bulk-input-section .table thead th {
  background-color: #f8f9fa;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.bulk-input-section .table tbody tr:hover {
  background-color: #f8f9fa;
}

.bulk-input-section .form-select-sm,
.bulk-input-section .form-control-sm {
  font-size: 0.875rem;
}
</style>
