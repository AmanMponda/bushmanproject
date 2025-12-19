<template>
  <div class="trophy-fees-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Settings</a></li>
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
                <div class="row mb-3 trophy-fees-form-row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Species <span class="text-danger">*</span></label>
                      <select v-model="trophyFeeForm.species" class="form-select" required>
                        <option :value="null">Select Species</option>
                        <option v-for="option in speciesOptions" :key="option.value" :value="option.value">
                          {{ option.text }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Hunting Area <span class="text-danger">*</span></label>
                      <select v-model="trophyFeeForm.area" class="form-select" required>
                        <option :value="null">Select Hunting Area</option>
                        <option v-for="option in areaOptions" :key="option.value" :value="option.value">
                          {{ option.text }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="row mb-3 trophy-fees-form-row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Season <span class="text-danger">*</span></label>
                      <select v-model="trophyFeeForm.season" class="form-select" required>
                        <option :value="null">Select Season</option>
                        <option v-for="option in seasonOptions" :key="option.value" :value="option.value">
                          {{ option.text }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Currency <span class="text-danger">*</span></label>
                      <select v-model="trophyFeeForm.currency" class="form-select" required>
                        <option :value="null">Select Currency</option>
                        <option v-for="option in currencyOptions" :key="option.value" :value="option.value">
                          {{ option.text }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="row mb-3 trophy-fees-form-row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Sequence Order <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <input
                          v-model.number="trophyFeeForm.sequence_order"
                          type="number"
                          class="form-control"
                          min="1"
                          placeholder="Enter sequence number"
                          required
                        />
                        <button
                          type="button"
                          class="btn btn-outline-secondary"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Sequence order represents the trophy number (1st, 2nd, 3rd, etc.). Different sequences can have different prices for the same species."
                        >
                          <i class="fa fa-info-circle"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Amount <span class="text-danger">*</span></label>
                      <input
                        v-model.number="trophyFeeForm.amount"
                        type="number"
                        step="0.01"
                        min="0"
                        class="form-control"
                        placeholder="0.00"
                        required
                      />
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
import { useTrophyFeesStore } from '../../../stores/bushman/trophy-fees-store'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSettingsStore } from '../../../stores/bushman/settings-store'

export default defineComponent({
  name: 'ManageTrophyFeesPage',
  components: {
    StandardDataTable,
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
      { key: 'season_name', label: 'Season', sortable: true, visible: true },
      { key: 'sequence_order', label: 'Sequence', sortable: true, visible: true },
      { key: 'amount', label: 'Amount', sortable: true, visible: true },
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
      season: null as any,
      currency: null as any,
      sequence_order: 1,
      amount: null as any,
    })

    return {
      items,
      trophyFeeForm,
      showTrophyFeesList: true,
      loading: false,
      saving: false,
      editMode: false,
      toast: useToast(),
      speciesOptions: [] as any[],
      areaOptions: [] as any[],
      seasonOptions: [] as any[],
      currencyOptions: [] as any[],
      selectedSpecies: null as any,
      selectedArea: null as any,
      selectedSeason: null as any,
    }
  },

  computed: {
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
          key: 'season_id',
          label: 'Season',
          type: 'select',
          placeholder: 'Select Season',
          options: this.seasonOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.text,
          })),
          defaultValue: this.selectedSeason?.value || '',
        },
      ]
    },
    canSubmit() {
      return (
        this.trophyFeeForm.species &&
        this.trophyFeeForm.area &&
        this.trophyFeeForm.season &&
        this.trophyFeeForm.currency &&
        this.trophyFeeForm.sequence_order > 0 &&
        this.trophyFeeForm.amount > 0
      )
    },
  },

  mounted() {
    this.getTrophyFees()
    this.loadSpecies()
    this.loadAreas()
    this.loadSeasons()
    this.loadCurrencies()
  },

  methods: {
    ...mapActions(useTrophyFeesStore, ['fetchTrophyFees', 'createTrophyFee', 'updateTrophyFee', 'deleteTrophyFeeById']),
    ...mapActions(useQuotaStore, ['getSpeciesList', 'getAreaList']),
    ...mapActions(useSettingsStore, ['getSeasons', 'getCurrencies']),

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
        if (this.selectedSeason) {
          params.season_id = this.selectedSeason.value
        }

        const response = await this.fetchTrophyFees(params)

        if (response.status === 200) {
          const data = response.data.data || response.data

          this.items = data.map((item: any) => ({
            id: item.id,
            species_name: item.species?.name || 'N/A',
            area_name: item.area?.name || 'N/A',
            season_name: item.season?.name || 'N/A',
            sequence_order: this.getSequenceLabel(item.sequence_order),
            amount: `${item.currency?.symbol || '$'}${parseFloat(item.amount).toFixed(2)}`,
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
          text: item.name,
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
      this.selectedSeason = null
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
      if (filters.season_id) {
        this.selectedSeason = this.seasonOptions.find((s: any) => s.value === filters.season_id)
      } else {
        this.selectedSeason = null
      }
      this.getTrophyFees()
    },

    getSequenceLabel(sequence: number) {
      const suffixes = ['th', 'st', 'nd', 'rd']
      const value = sequence % 100
      return sequence + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0])
    },

    async loadSeasons() {
      try {
        const response = await this.getSeasons()
        this.seasonOptions = response.data.map((item: any) => ({
          value: item.id,
          text: item.name,
        }))
      } catch (error) {
        console.error('Failed to load seasons', error)
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
      const seasonId = raw.season_id || raw.season?.id
      const currencyId = raw.currency_id || raw.currency?.id

      this.trophyFeeForm.species = speciesId
      this.trophyFeeForm.area = areaId
      this.trophyFeeForm.season = seasonId
      this.trophyFeeForm.currency = currencyId
      this.trophyFeeForm.sequence_order = raw.sequence_order
      this.trophyFeeForm.amount = raw.amount
    },

    async saveTrophyFee() {
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
          season_id:
            typeof this.trophyFeeForm.season === 'object' ? this.trophyFeeForm.season.value : this.trophyFeeForm.season,
          currency_id:
            typeof this.trophyFeeForm.currency === 'object'
              ? this.trophyFeeForm.currency.value
              : this.trophyFeeForm.currency,
          sequence_order: this.trophyFeeForm.sequence_order,
          amount: this.trophyFeeForm.amount,
        }

        let response
        if (this.editMode) {
          response = await this.updateTrophyFee(this.trophyFeeForm.id, payload)
        } else {
          response = await this.createTrophyFee(payload)
        }

        if (response.status === 200 || response.status === 201) {
          this.toast.init({
            message: this.editMode ? 'Trophy fee updated successfully' : 'Trophy fee created successfully',
            color: 'success',
          })
          this.toggleFormAndList()
          this.getTrophyFees()
        }
      } catch (error) {
        handleErrors(error)
        this.toast.init({
          message: 'Failed to save trophy fee',
          color: 'danger',
        })
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
      this.trophyFeeForm.season = null
      this.trophyFeeForm.currency = null
      this.trophyFeeForm.sequence_order = 1
      this.trophyFeeForm.amount = null
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
