<template>
  <div class="upgrade-fees-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item"><a href="#">Price Structures</a></li>
          <li class="breadcrumb-item active">Upgrade Fees</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showUpgradeFeesList">
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
                <template #trigger_condition="{ row }">
                  {{ (row as any).trigger_condition }}
                </template>
                <template #fee_amount="{ row }">
                  <span class="text-nowrap">{{ (row as any).fee_amount_display }}</span>
                </template>
                <template #currency_code="{ row }">
                  {{ (row as any).currency_code }}
                </template>
                <template #price_structure="{ row }">
                  {{ (row as any).price_structure }}
                </template>
                <template #notes="{ row }">
                  {{ (row as any).notes }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editUpgradeFee(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="deleteUpgradeFee(row)">
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
      <div class="upgrade-fees-form-page">
        <div class="form-upgrade-fees-container">
          <div v-if="!saving" class="card">
            <div class="card-header bg-white border-bottom">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-secondary btn-sm" @click="toggleFormAndList">
                    <i class="fa fa-arrow-left me-1"></i> Back
                  </button>
                  <i class="fa fa-edit text-primary fs-5"></i>
                  <h2 class="h5 mb-0">{{ editMode ? 'Edit Upgrade Fee' : 'Create New Upgrade Fee' }}</h2>
                </div>
              </div>
            </div>

            <div class="card-body">
              <form @submit.prevent="saveUpgradeFee">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Species <span class="text-danger">*</span></label>
                    <select v-model="upgradeFeeForm.species_id" class="form-select" required>
                      <option :value="null">Select Species</option>
                      <option v-for="s in speciesOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Trigger Condition <span class="text-danger">*</span></label>
                    <input
                      v-model.trim="upgradeFeeForm.trigger_condition"
                      class="form-control"
                      list="trigger-condition-options"
                      maxlength="255"
                      placeholder="e.g., add_species:first"
                      required
                    />
                    <datalist id="trigger-condition-options">
                      <option value="add_species:first"></option>
                      <option value="add_species:second"></option>
                      <option value="add_species"></option>
                      <option value="variant_upgrade:first->second"></option>
                      <option value="variant_upgrade:second->third"></option>
                      <option value="count > 1"></option>
                      <option value="count > 3"></option>
                      <option value="quantity_exceeds:1"></option>
                    </datalist>
                    <div class="form-text">
                      Examples: <code>add_species:first</code>, <code>variant_upgrade:first-&gt;second</code>, <code>count &gt; 1</code>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Area</label>
                    <select v-model="upgradeFeeForm.area_id" class="form-select">
                      <option :value="null">All Areas</option>
                      <option v-for="a in areaOptions" :key="a.value" :value="a.value">{{ a.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Price Structure</label>
                    <select v-model="upgradeFeeForm.price_structure_id" class="form-select">
                      <option :value="null">All Price Structures</option>
                      <option v-for="p in priceStructureOptions" :key="p.value" :value="p.value">{{ p.text }}</option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Currency <span class="text-danger">*</span></label>
                    <select v-model="upgradeFeeForm.currency_id" class="form-select" required>
                      <option :value="null">Select Currency</option>
                      <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Fee Amount <span class="text-danger">*</span></label>
                    <input v-model.number="upgradeFeeForm.fee_amount" type="number" step="0.01" min="0" class="form-control" placeholder="0.00" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Notes</label>
                    <input v-model="upgradeFeeForm.notes" class="form-control" placeholder="Optional notes" />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Save Button -->
          <div class="d-flex justify-content-end align-items-center mt-2 mb-2">
            <button v-if="editMode" type="button" class="btn btn-secondary me-2" @click="cancelEdit">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="saving || !canSubmit" @click="saveUpgradeFee()">
              <i class="fa fa-save me-1"></i>
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ editMode ? 'Update Upgrade Fee' : 'Save Upgrade Fee' }}
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
import { useUpgradeFeesStore } from '../../../stores/bushman/upgrade-fees-store'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import { usePriceListStore } from '../../../stores/bushman/price-list-store'

export default defineComponent({
  name: 'ManageUpgradeFeesPage',
  components: {
    StandardDataTable,
  },

  setup() {
    const columns = [
      { key: 'id', label: 'ID', sortable: true, visible: true },
      { key: 'species_name', label: 'Species', sortable: true, visible: true },
      { key: 'area_name', label: 'Area', sortable: true, visible: true },
      { key: 'trigger_condition', label: 'Trigger Condition', sortable: true, visible: true },
      { key: 'fee_amount', label: 'Fee', sortable: true, visible: true },
      { key: 'currency_code', label: 'Currency', sortable: true, visible: true },
      { key: 'price_structure', label: 'Price Structure', sortable: true, visible: true },
      { key: 'notes', label: 'Notes', sortable: true, visible: true },
      { key: 'actions', label: 'Actions', sortable: false, visible: true },
    ]

    return {
      columns,
    }
  },

  data() {
    const items: any[] = []

    const upgradeFeeForm = reactive({
      id: null as any,
      species_id: null as any,
      area_id: null as any,
      price_structure_id: null as any,
      trigger_condition: '',
      fee_amount: null as any,
      currency_id: null as any,
      notes: '',
    })

    return {
      items,
      upgradeFeeForm,
      showUpgradeFeesList: true,
      loading: false,
      saving: false,
      editMode: false,
      toast: useToast(),
      speciesOptions: [] as any[],
      areaOptions: [] as any[],
      currencyOptions: [] as any[],
      priceStructureOptions: [] as any[],
      selectedSpecies: null as any,
      selectedArea: null as any,
      selectedPriceStructure: null as any,
      triggerConditionQuery: '',
    }
  },

  computed: {
    pageActions() {
      const actions = []
      if (this.showUpgradeFeesList) {
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
        {
          key: 'trigger_condition',
          label: 'Trigger Condition',
          type: 'text',
          placeholder: 'Search trigger conditions...',
          defaultValue: this.triggerConditionQuery,
        },
      ]
    },
    canSubmit() {
      const f = this.upgradeFeeForm
      return (
        !!f.species_id &&
        !!f.trigger_condition &&
        f.fee_amount !== null &&
        f.fee_amount !== undefined &&
        !isNaN(Number(f.fee_amount)) &&
        Number(f.fee_amount) >= 0 &&
        !!f.currency_id
      )
    },
  },

  mounted() {
    this.getUpgradeFees()
    this.loadSpecies()
    this.loadAreas()
    this.loadCurrencies()
    this.loadPriceStructures()
  },

  methods: {
    ...mapActions(useUpgradeFeesStore, ['fetchUpgradeFees', 'createUpgradeFee', 'updateUpgradeFee', 'deleteUpgradeFeeById']),
    ...mapActions(useQuotaStore, ['getSpeciesList', 'getAreaList']),
    ...mapActions(useSettingsStore, ['getCurrencies']),

    async getUpgradeFees() {
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
        if (this.triggerConditionQuery) {
          params.trigger_condition = this.triggerConditionQuery
        }

        const response = await this.fetchUpgradeFees(params)
        if (response.status === 200) {
          const data = response.data.data || response.data
          this.items = data.map((item: any) => ({
            id: item.id,
            species_name: item.species?.swahili_name
              ? `${item.species.name} (${item.species.swahili_name})`
              : item.species?.name || item.species_name || 'N/A',
            area_name: item.area?.name || (item.area_id ? `Area-${item.area_id}` : 'All Areas'),
            trigger_condition: item.trigger_condition || '-',
            fee_amount: Number(item.fee_amount ?? item.amount ?? 0),
            fee_amount_display: `${item.currency?.symbol || item.currency?.code || ''}${item.currency?.symbol ? '' : ' '}${parseFloat(
              item.fee_amount ?? item.amount ?? 0,
            ).toFixed(2)}`.trim(),
            currency_code: item.currency?.code || item.currency?.name || (item.currency_id ? `CUR-${item.currency_id}` : 'N/A'),
            price_structure: item.price_structure?.id
              ? `PS-${item.price_structure.id}`
              : item.price_structure_id
                ? `PS-${item.price_structure_id}`
                : 'All Price Structures',
            notes: item.notes || '',
            _raw: item,
          }))
        }
      } catch (error) {
        handleErrors(error)
        this.toast.init({
          message: 'Failed to load upgrade fees',
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
      this.triggerConditionQuery = (filters.trigger_condition || '').toString().trim()
      this.getUpgradeFees()
    },

    toggleFormAndList() {
      this.showUpgradeFeesList = !this.showUpgradeFeesList
      if (this.showUpgradeFeesList) {
        this.resetForm()
      }
    },

    resetForm() {
      this.editMode = false
      this.upgradeFeeForm.id = null
      this.upgradeFeeForm.species_id = null
      this.upgradeFeeForm.area_id = null
      this.upgradeFeeForm.price_structure_id = null
      this.upgradeFeeForm.trigger_condition = ''
      this.upgradeFeeForm.fee_amount = null
      this.upgradeFeeForm.currency_id = null
      this.upgradeFeeForm.notes = ''
    },

    editUpgradeFee(row: any) {
      const raw = row._raw || {}
      this.editMode = true
      this.showUpgradeFeesList = false
      this.upgradeFeeForm.id = raw.id
      this.upgradeFeeForm.species_id = raw.species_id || raw.species?.id || null
      this.upgradeFeeForm.area_id = raw.area_id || raw.area?.id || null
      this.upgradeFeeForm.price_structure_id = raw.price_structure_id || raw.price_structure?.id || null
      this.upgradeFeeForm.trigger_condition = raw.trigger_condition || ''
      this.upgradeFeeForm.fee_amount = raw.fee_amount ?? raw.amount ?? null
      this.upgradeFeeForm.currency_id = raw.currency_id || raw.currency?.id || null
      this.upgradeFeeForm.notes = raw.notes || ''
    },

    cancelEdit() {
      this.toggleFormAndList()
    },

    async saveUpgradeFee() {
      if (!this.canSubmit) {
        this.toast.init({ message: 'Please fill required fields', color: 'warning' })
        return
      }

      this.saving = true
      const payload: any = {
        species_id: this.upgradeFeeForm.species_id,
        trigger_condition: this.upgradeFeeForm.trigger_condition,
        fee_amount: Number(this.upgradeFeeForm.fee_amount),
        currency_id: this.upgradeFeeForm.currency_id,
        area_id: this.upgradeFeeForm.area_id || null,
        price_structure_id: this.upgradeFeeForm.price_structure_id || null,
        notes: this.upgradeFeeForm.notes || '',
      }

      try {
        if (this.editMode && this.upgradeFeeForm.id) {
          await this.updateUpgradeFee(this.upgradeFeeForm.id, payload)
          this.toast.init({ message: 'Upgrade fee updated', color: 'success' })
        } else {
          await this.createUpgradeFee(payload)
          this.toast.init({ message: 'Upgrade fee created', color: 'success' })
        }
        this.showUpgradeFeesList = true
        this.getUpgradeFees()
        this.resetForm()
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to save upgrade fee', color: 'danger' })
      } finally {
        this.saving = false
      }
    },

    async deleteUpgradeFee(row: any) {
      const raw = row._raw || {}
      if (!raw.id) return
      try {
        await this.deleteUpgradeFeeById(raw.id)
        this.toast.init({ message: 'Upgrade fee deleted', color: 'success' })
        this.getUpgradeFees()
      } catch (error) {
        handleErrors(error)
        this.toast.init({ message: 'Failed to delete upgrade fee', color: 'danger' })
      }
    },
  },
})
</script>

<style scoped>
.upgrade-fees-page {
  min-height: 100vh;
}

.upgrade-fees-form-page {
  padding: 0 0.25rem;
}

.form-upgrade-fees-container {
  max-width: 1100px;
}
</style>
