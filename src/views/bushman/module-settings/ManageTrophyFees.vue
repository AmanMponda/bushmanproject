<template>
  <div class="trophy-fees-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item"><a href="#">Price Stuctures</a></li>
          <li class="breadcrumb-item active">Trophy Fees</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showTrophyFeesList">
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
                :custom-filters="customFilters"
                @update:filters="handleFiltersUpdate"
              >
                <template #id="{ row }">
                  {{ (row as any).id }}
                </template>
                <template #species_name="{ row }">
                  {{ (row as any).species_name }}
                </template>
                <template #area_name="{ row }">
                  {{ (row as any).area_name }}
                </template>
                <template #season_name="{ row }">
                  {{ (row as any).season_name }}
                </template>
                <template #sequence_order="{ row }">
                  {{ (row as any).sequence_order }}
                </template>
                <template #amount="{ row }">
                  {{ (row as any).amount }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editTrophyFee(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="deleteTrophyFee(row)">
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

    <!-- Form View -->
    <template v-else>
      <div class="trophy-fees-form-page">
        <!-- Form Container -->
        <div class="form-trophy-fees-container">
          <div v-if="!saving" class="card">
            <div class="card-header bg-white border-bottom">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-secondary btn-sm" @click="toggleFormAndList">
                    <i class="fa fa-arrow-left me-1"></i> Back
                  </button>
                  <i class="fa fa-edit text-primary fs-5"></i>
                  <h2 class="h5 mb-0">{{ editMode ? 'Edit Trophy Fee' : 'Create New Trophy Fee' }}</h2>
                </div>
              </div>
            </div>

            <div class="card-body">
              <form ref="trophyFeeFormRef" @submit.prevent="saveTrophyFee">
                <!-- Use multi-row input table to allow creating multiple trophy fees at once -->
                <MultiRowTableInput v-model="trophyRows" :fields="multiFields" add-button-label="Add Trophy Fee Row" />

                <!-- Keep durations selection outside bulk creation (applies when editing a single fee)
                     Durations are applied only when editing an existing trophy fee. -->
                <div v-if="editMode && huntLengthOptions.length > 0" class="row mb-3">
                  <div class="col-12">
                    <label class="form-label fw-bold">Available Hunt Durations <small class="text-muted">(Optional)</small></label>
                    <small class="d-block text-muted mb-2">Select which hunt lengths this trophy fee applies to. Leave all unchecked to apply to all durations.</small>
                    <div class="border rounded p-3">
                      <div class="row">
                        <div v-for="huntLength in huntLengthOptions" :key="huntLength.value" class="col-md-4 mb-2">
                          <div class="form-check">
                            <input
                              :id="`hunt-length-${huntLength.value}`"
                              v-model="trophyFeeForm.durations"
                              type="checkbox"
                              class="form-check-input"
                              :value="huntLength.value"
                            />
                            <label class="form-check-label" :for="`hunt-length-${huntLength.value}`">
                              {{ huntLength.text }}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Save Button -->
          <div class="d-flex justify-content-end align-items-center mt-2 mb-2">
            <button v-if="editMode" type="button" class="btn btn-secondary me-2" @click="cancelEdit">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="saving || !canSubmit" @click="saveTrophyFee()">
              <i class="fa fa-save me-1"></i>
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ editMode ? 'Update Trophy Fee' : 'Save Trophy Fee' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'
import { mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '../../../stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'
import { useTrophyFeesStore } from '../../../stores/bushman/trophy-fees-store'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import { usePriceListStore } from '../../../stores/bushman/price-list-store'

export default defineComponent({
  name: 'ManageTrophyFeesPage',
  components: {
    StandardDataTable,
    MultiRowTableInput,
  },

  setup() {
    const trophyFeeFormRef = ref(null) as any

    const {
      isValid: isValidTrophyFeeForm,
      validate: validateTrophyFeeForm,
      resetValidation: resetValidationTrophyFeeForm,
      reset: resetTrophyFeeForm,
    } = useForm()

    const columns = [
      { key: 'id', label: 'ID', sortable: true, visible: true },
      { key: 'species_name', label: 'Species Name', sortable: true, visible: true },
      { key: 'area_name', label: 'Hunting Area', sortable: true, visible: true },
      { key: 'amount', label: 'Amount', sortable: true, visible: true },
      { key: 'price_structure', label: 'Price Structure', sortable: true, visible: true },
      { key: 'actions', label: 'Actions', sortable: false, visible: true },
    ]

    return {
      isValidTrophyFeeForm,
      validateTrophyFeeForm,
      resetValidationTrophyFeeForm,
      resetTrophyFeeForm,
      trophyFeeFormRef,
      columns,
    }
  },

  data() {
    const items: any[] = []

    const trophyFeeForm = reactive({
      id: null as any,
      species: null as any,
      area: null as any,
      currency: null as any,
      price_structure_id: null as any,
      amount: null as any,
      durations: [] as any[],
    })

    return {
      items,
      trophyFeeForm,
      trophyRows: [
        {
          _id: 1,
          species: '',
          area: '',
          currency: '',
          amount: '',
          price_structure_id: '',
        },
      ],
      showTrophyFeesList: true,
      loading: false,
      saving: false,
      editMode: false,
      toast: useToast(),
      speciesOptions: [] as any[],
      areaOptions: [] as any[],
      currencyOptions: [] as any[],
      priceStructureOptions: [] as any[],
      huntLengthOptions: [] as any[],
      selectedSpecies: null as any,
      selectedArea: null as any,
      selectedPriceStructure: null as any,
    }
  },

  /* multiFields moved into the main computed block below */

  computed: {
    multiFields() {
      return [
        {
          key: 'species',
          label: 'Species',
          type: 'select',
          required: true,
          options: this.speciesOptions.map((o: any) => ({ value: o.value, text: o.text })),
          headerStyle: 'width:220px',
        },
        {
          key: 'area',
          label: 'Hunting Area',
          type: 'select',
          required: true,
          options: this.areaOptions.map((o: any) => ({ value: o.value, text: o.text })),
          headerStyle: 'width:220px',
        },
        {
          key: 'currency',
          label: 'Currency',
          type: 'select',
          required: true,
          options: this.currencyOptions.map((o: any) => ({ value: o.value, text: o.text })),
          headerStyle: 'width:140px',
        },
        {
          key: 'amount',
          label: 'Amount',
          type: 'number',
          required: true,
          placeholder: '0.00',
          headerStyle: 'width:140px',
        },
        {
          key: 'price_structure_id',
          label: 'Price Structure',
          type: 'select',
          required: false,
          options: this.priceStructureOptions.map((o: any) => ({ value: o.value, text: o.text })),
          headerStyle: 'width:220px',
        },
      ]
    },
    uniqueSpeciesCount() {
      const speciesIds = new Set(this.items.map((item: any) => item._raw?.species_id))
      return speciesIds.size
    },
    uniqueAreasCount() {
      const areaIds = new Set(this.items.map((item: any) => item._raw?.area_id))
      return areaIds.size
    },
    pageActions() {
      const actions = []
      if (this.showTrophyFeesList) {
        actions.push({
          label: 'Add New',
          icon: 'fa fa-plus',
          class: 'btn btn-primary',
          method: () => this.toggleFormAndList(),
        })
      }
      return actions
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
          key: 'area_id',
          label: 'Area',
          type: 'select',
          placeholder: 'Select Area',
          options: this.areaOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.text,
          })),
          defaultValue: this.selectedArea?.value || '',
        },
        {
          key: 'price_structure_id',
          label: 'Price Structure',
          type: 'select',
          placeholder: 'Select Price Structure',
          options: this.priceStructureOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.text,
          })),
          defaultValue: this.selectedPriceStructure?.value || '',
        },
      ]
    },
    canSubmit() {
      if (this.editMode) {
        return (
          this.trophyFeeForm.species &&
          this.trophyFeeForm.area &&
          this.trophyFeeForm.currency &&
          this.trophyFeeForm.amount > 0
        )
      }

      // Bulk create: ensure at least one valid row exists
      if (this.trophyRows && this.trophyRows.length > 0) {
        return this.trophyRows.some((r: any) => r.species && r.area && r.currency && parseFloat(r.amount) > 0)
      }

      return false
    },
  },

  mounted() {
    this.getTrophyFees()
    this.loadSpecies()
    this.loadAreas()
    this.loadCurrencies()
    this.loadPriceStructures()
    this.loadHuntLengths()
  },

  methods: {
    ...mapActions(useTrophyFeesStore, ['fetchTrophyFees', 'createTrophyFee', 'updateTrophyFee', 'deleteTrophyFeeById']),
    ...mapActions(useQuotaStore, ['getSpeciesList', 'getAreaList']),
    ...mapActions(useSettingsStore, ['getCurrencies']),

    async getTrophyFees() {
      this.loading = true
      try {
        const params: any = {}
        if (this.selectedSpecies) {
          params.species_id = this.selectedSpecies.value
        }
        if (this.selectedArea) {
          params.area_id = this.selectedArea.value
        }
        if (this.selectedPriceStructure) {
          params.price_structure_id = this.selectedPriceStructure.value
        }

        const response = await this.fetchTrophyFees(params)

        if (response.status === 200) {
          const data = response.data.data || response.data

          this.items = data.map((item: any) => ({
            id: item.id,
            species_name: item.species?.swahili_name 
              ? `${item.species.name} (${item.species.swahili_name})`
              : item.species?.name || 'N/A',
            area_name: item.area?.name || 'N/A',
            amount: `${item.currency?.symbol || '$'}${parseFloat(item.amount).toFixed(2)}`,
            price_structure: item.price_structure?.id ? `PS-${item.price_structure.id}` : 'General',
            _raw: item,
          }))
        }
      } catch (error) {
        handleErrors(error)
        this.toast.init({
          message: 'Failed to load trophy fees',
          color: 'danger',
        })
      } finally {
        this.loading = false
      }
    },

    async loadSpecies() {
      try {
        const response = await this.getSpeciesList()
        this.speciesOptions = response.data.map((item: any) => ({
          value: item.id,
          text: item.swahili_name ? `${item.name} (${item.swahili_name})` : item.name,
        }))
      } catch (error) {
        console.error('Failed to load species', error)
      }
    },

    async loadAreas() {
      try {
        const response = await this.getAreaList()
        this.areaOptions = response.data.map((item: any) => ({
          value: item.id,
          text: item.name,
        }))
      } catch (error) {
        console.error('Failed to load areas', error)
      }
    },

    clearFilters() {
      this.selectedSpecies = null
      this.selectedArea = null
      this.selectedPriceStructure = null
      this.getTrophyFees()
    },

    handleFiltersUpdate(filters: any) {
      if (filters.species_id) {
        this.selectedSpecies = this.speciesOptions.find((s: any) => s.value === filters.species_id)
      } else {
        this.selectedSpecies = null
      }
      if (filters.area_id) {
        this.selectedArea = this.areaOptions.find((a: any) => a.value === filters.area_id)
      } else {
        this.selectedArea = null
      }
      if (filters.price_structure_id) {
        this.selectedPriceStructure = this.priceStructureOptions.find((p: any) => p.value === filters.price_structure_id)
      } else {
        this.selectedPriceStructure = null
      }
      this.getTrophyFees()
    },

    async loadPriceStructures() {
      try {
        const priceListStore = usePriceListStore()
        const response = await priceListStore.getPriceStructures()
        if (response.status === 200) {
          const data = response.data?.data || response.data || []
          this.priceStructureOptions = data.map((item: any) => ({
            value: item.id,
            text: `PS-${item.id} - ${item.area?.name || 'N/A'} (${item.start_date || 'N/A'})`,
          }))
        }
      } catch (error) {
        console.error('Failed to load price structures', error)
      }
    },

    async loadHuntLengths() {
      try {
        const priceListStore = usePriceListStore()
        const response = await priceListStore.getHuntLengths()
        if (response.status === 200) {
          this.huntLengthOptions = response.data.map((item: any) => ({
            value: item.id,
            text: item.label || `${item.days} days`,
          }))
        }
      } catch (error) {
        console.error('Failed to load hunt lengths', error)
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

    toggleFormAndList() {
      this.showTrophyFeesList = !this.showTrophyFeesList
      if (this.showTrophyFeesList) {
        this.resetForm()
      }
    },

    editTrophyFee(rowData: any) {
      this.editMode = true
      this.showTrophyFeesList = false

      const raw = rowData._raw || rowData
      this.trophyFeeForm.id = raw.id
      const speciesId = raw.species_id || raw.species?.id
      const areaId = raw.area_id || raw.area?.id
      const currencyId = raw.currency_id || raw.currency?.id

      this.trophyFeeForm.species = speciesId
      this.trophyFeeForm.area = areaId
      this.trophyFeeForm.currency = currencyId
      this.trophyFeeForm.price_structure_id = raw.price_structure_id || null
      this.trophyFeeForm.amount = raw.amount
      
      // Load durations if exists
      if (raw.durations && Array.isArray(raw.durations)) {
        this.trophyFeeForm.durations = raw.durations
          .filter((d: any) => d.is_allowed)
          .map((d: any) => d.hunt_length_id)
      } else {
        this.trophyFeeForm.durations = []
      }
    },

    async saveTrophyFee() {
      // If editing a single fee, keep previous flow
      if (this.editMode) {
        if (!this.trophyFeeFormRef?.checkValidity()) {
          this.trophyFeeFormRef?.reportValidity()
          return
        }

        this.saving = true
        try {
          const payload: any = {
            species_id:
              typeof this.trophyFeeForm.species === 'object'
                ? this.trophyFeeForm.species.value
                : this.trophyFeeForm.species,
            area_id:
              typeof this.trophyFeeForm.area === 'object' ? this.trophyFeeForm.area.value : this.trophyFeeForm.area,
            currency_id:
              typeof this.trophyFeeForm.currency === 'object'
                ? this.trophyFeeForm.currency.value
                : this.trophyFeeForm.currency,
            amount: this.trophyFeeForm.amount,
            price_structure_id: this.trophyFeeForm.price_structure_id || null,
          }

          // Add durations if selected
          if (this.trophyFeeForm.durations && this.trophyFeeForm.durations.length > 0) {
            payload.durations = this.trophyFeeForm.durations.map((huntLengthId: any) => ({
              hunt_length_id: huntLengthId,
              is_allowed: true,
            }))
          }

          const response = await this.updateTrophyFee(this.trophyFeeForm.id, payload)

          if (response.status === 200) {
            this.toast.init({ message: 'Trophy fee updated successfully', color: 'success' })
            this.toggleFormAndList()
            this.getTrophyFees()
          }
        } catch (error) {
          handleErrors(error)
          this.toast.init({ message: 'Failed to update trophy fee', color: 'danger' })
        } finally {
          this.saving = false
        }

        return
      }

      // Bulk creation flow using trophyRows
      if (!this.trophyRows || this.trophyRows.length === 0) {
        this.toast.init({ message: 'No trophy fee rows to save', color: 'warning' })
        return
      }

      // Basic validation for required fields in rows
      for (const row of this.trophyRows) {
        if (!row.species || !row.area || !row.currency || !row.amount) {
          this.toast.init({ message: 'Please fill required fields for all rows', color: 'warning' })
          return
        }
      }

      this.saving = true
      try {
        const results: any[] = []
        for (const row of this.trophyRows) {
          const payload: any = {
            species_id: typeof row.species === 'object' ? row.species.value : row.species,
            area_id: typeof row.area === 'object' ? row.area.value : row.area,
            currency_id: typeof row.currency === 'object' ? row.currency.value : row.currency,
            amount: parseFloat(row.amount) || 0,
            price_structure_id: row.price_structure_id || null,
          }

          try {
            const resp = await this.createTrophyFee(payload)
            results.push(resp)
          } catch (err) {
            // Collect error but continue creating other rows
            results.push({ error: err })
          }
        }

        const failed = results.filter((r) => r && r.error)
        if (failed.length === 0) {
          this.toast.init({ message: 'All trophy fees created successfully', color: 'success' })
          this.toggleFormAndList()
          this.getTrophyFees()
        } else if (failed.length < results.length) {
          this.toast.init({ message: 'Some trophy fees were created; some failed', color: 'warning' })
          this.getTrophyFees()
        } else {
          this.toast.init({ message: 'Failed to create trophy fees', color: 'danger' })
        }
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to save trophy fees', color: 'danger' })
      } finally {
        this.saving = false
      }
    },

    async deleteTrophyFee(rowData: any) {
      if (!confirm('Are you sure you want to delete this trophy fee?')) {
        return
      }

      try {
        const response = await this.deleteTrophyFeeById(rowData.id)
        if (response.status === 200 || response.status === 204) {
          this.toast.init({
            message: 'Trophy fee deleted successfully',
            color: 'success',
          })
          this.getTrophyFees()
        }
      } catch (error) {
        handleErrors(error)
        this.toast.init({
          message: 'Failed to delete trophy fee',
          color: 'danger',
        })
      }
    },

    cancelEdit() {
      this.resetForm()
      this.toggleFormAndList()
    },

    resetForm() {
      this.editMode = false
      this.trophyFeeForm.id = null
      this.trophyFeeForm.species = null
      this.trophyFeeForm.area = null
      this.trophyFeeForm.currency = null
      this.trophyFeeForm.price_structure_id = null
      this.trophyFeeForm.amount = null
      this.trophyFeeForm.durations = []
      // Reset bulk rows to a single empty row
      this.trophyRows = [
        {
          _id: 1,
          species: '',
          area: '',
          currency: '',
          amount: '',
          price_structure_id: '',
        },
      ]
      this.resetValidationTrophyFeeForm()
    },
  },
})
</script>

<style lang="scss" scoped>
.trophy-fees-page {
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

.trophy-fees-form-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.form-trophy-fees-container {
  max-width: 1400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 0.8rem;
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

.trophy-fees-form-row {
  --bs-gutter-x: 6rem !important;
  margin-left: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
  margin-right: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
}

.trophy-fees-form-row > [class*='col-'] {
  padding-left: calc(var(--bs-gutter-x) * 0.5) !important;
  padding-right: calc(var(--bs-gutter-x) * 0.5) !important;
}
</style>
