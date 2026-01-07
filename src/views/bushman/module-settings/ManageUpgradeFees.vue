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
                <template #item_name="{ row }">
                  {{ (row as any).item_name }}
                </template>
                <template #amount="{ row }">
                  {{ (row as any).amount }}
                </template>
                <template #price_structure="{ row }">
                  {{ (row as any).price_structure }}
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
                    <input v-model="upgradeFeeForm.trigger_condition" class="form-control" placeholder="e.g., Over Trophy Size" required />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Area</label>
                    <select v-model="upgradeFeeForm.area_id" class="form-select">
                      <option :value="null">Select Area</option>
                      <option v-for="a in areaOptions" :key="a.value" :value="a.value">{{ a.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Price Structure</label>
                    <select v-model="upgradeFeeForm.price_structure_id" class="form-select">
                      <option :value="null">General</option>
                      <option v-for="p in priceStructureOptions" :key="p.value" :value="p.value">{{ p.text }}</option>
                    </select>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Upgrade Fee Item <span class="text-danger">*</span></label>
                    <div class="btn-group w-100 item-mode-toggle mb-2" role="group">
                      <input
                        id="upgrade-item-mode-existing"
                        v-model="itemMode"
                        class="btn-check"
                        type="radio"
                        value="existing"
                        autocomplete="off"
                      />
                      <label class="btn btn-outline-primary" for="upgrade-item-mode-existing">
                        <i class="fa fa-list me-2"></i>Use Existing Item
                      </label>

                      <input
                        id="upgrade-item-mode-new"
                        v-model="itemMode"
                        class="btn-check"
                        type="radio"
                        value="new"
                        autocomplete="off"
                      />
                      <label class="btn btn-outline-primary" for="upgrade-item-mode-new">
                        <i class="fa fa-plus me-2"></i>Create New Item
                      </label>
                    </div>
                  </div>

                  <div v-if="itemMode === 'existing'" class="col-12">
                    <label class="form-label">Select Upgrade Fee Item <span class="text-danger">*</span></label>
                    <select v-model="upgradeFeeForm.item_id" class="form-select">
                      <option :value="null">Choose from existing items...</option>
                      <option v-for="i in upgradeFeeItems" :key="i.value" :value="i.value">{{ i.text }}</option>
                    </select>
                  </div>

                  <template v-else>
                    <div class="col-md-6">
                      <label class="form-label">Item Name <span class="text-danger">*</span></label>
                      <input v-model="upgradeFeeForm.item_name" class="form-control" placeholder="Enter upgrade fee item name" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Item Description</label>
                      <input v-model="upgradeFeeForm.item_description" class="form-control" placeholder="Optional description" />
                    </div>
                  </template>

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
import axios from 'axios'
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
      { key: 'item_name', label: 'Item', sortable: true, visible: true },
      { key: 'amount', label: 'Amount', sortable: true, visible: true },
      { key: 'price_structure', label: 'Price Structure', sortable: true, visible: true },
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
      item_id: null as any,
      item_name: '',
      item_description: '',
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
      itemMode: 'existing' as 'existing' | 'new',
      toast: useToast(),
      speciesOptions: [] as any[],
      areaOptions: [] as any[],
      currencyOptions: [] as any[],
      priceStructureOptions: [] as any[],
      upgradeFeeItems: [] as any[],
      selectedSpecies: null as any,
      selectedArea: null as any,
      selectedPriceStructure: null as any,
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
      ]
    },
    canSubmit() {
      const f = this.upgradeFeeForm
      const hasItem = this.itemMode === 'existing' ? !!f.item_id : !!f.item_name
      return (
        !!f.species_id &&
        !!f.trigger_condition &&
        hasItem &&
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
    this.loadUpgradeFeeItems()
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

        const response = await this.fetchUpgradeFees(params)
        if (response.status === 200) {
          const data = response.data.data || response.data
          this.items = data.map((item: any) => ({
            id: item.id,
            species_name: item.species?.swahili_name
              ? `${item.species.name} (${item.species.swahili_name})`
              : item.species?.name || 'N/A',
            area_name: item.area?.name || 'N/A',
            trigger_condition: item.trigger_condition || '-',
            item_name: item.item?.name || item.item_name || item.name || 'Upgrade Fee',
            amount: `${item.currency?.symbol || '$'}${parseFloat(item.fee_amount ?? item.amount ?? 0).toFixed(2)}`,
            price_structure: item.price_structure?.id ? `PS-${item.price_structure.id}` : 'General',
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

    async loadUpgradeFeeItems() {
      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}settings/item-groups-items`
        const response = await axios.get(url, { params: { name: 'Upgrade Fees', is_active: true } })
        const list = response.data || []
        this.upgradeFeeItems = list.map((item: any) => ({
          value: item.id,
          text: item.name || item.item_name || '',
        }))
      } catch (error) {
        console.warn('Failed to load upgrade fee items', error)
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
      this.itemMode = 'existing'
      this.upgradeFeeForm.id = null
      this.upgradeFeeForm.species_id = null
      this.upgradeFeeForm.area_id = null
      this.upgradeFeeForm.price_structure_id = null
      this.upgradeFeeForm.item_id = null
      this.upgradeFeeForm.item_name = ''
      this.upgradeFeeForm.item_description = ''
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

      const itemId = raw.item_id || raw.item?.id || null
      if (itemId) {
        this.itemMode = 'existing'
        this.upgradeFeeForm.item_id = itemId
        this.upgradeFeeForm.item_name = ''
        this.upgradeFeeForm.item_description = ''
      } else {
        this.itemMode = 'new'
        this.upgradeFeeForm.item_id = null
        this.upgradeFeeForm.item_name = raw.item_name || raw.name || ''
        this.upgradeFeeForm.item_description = raw.item_description || ''
      }
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

      if (this.itemMode === 'existing') {
        payload.item_id = this.upgradeFeeForm.item_id
      } else {
        payload.item_name = this.upgradeFeeForm.item_name
        if (this.upgradeFeeForm.item_description) {
          payload.item_description = this.upgradeFeeForm.item_description
        }
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
