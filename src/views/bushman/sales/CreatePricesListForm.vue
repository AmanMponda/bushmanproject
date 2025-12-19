<template>
  <div class="price-list-form-page">
    <!-- Form Container -->
    <div class="form-price-list-container">
      <div v-if="!savingPriceList" class="card bg-transparent border-0 shadow-none">
        <div class="card-header bg-transparent border-bottom">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-secondary btn-sm" @click="handleGoBack">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>

              <i class="fa fa-edit text-primary fs-5"></i>
              <h2 class="h5 mb-0">
                {{ editMode ? 'Edit Price List' : 'Create New Price List' }}
              </h2>
            </div>
          </div>
        </div>
        <div class="card-body">
          <form ref="formRef" @submit.prevent="submit">
            <div class="row mb-5">
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Package <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <select v-model="form.package" class="form-select" required @change="onChangePackage">
                      <option :value="null">Select Package</option>
                      <option v-for="option in packageOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                    <button type="button" class="btn btn-outline-secondary" title="Add New Package" @click="_showModal()">
                      <i class="fa fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Hunting Type <span class="text-danger">*</span></label>
                  <select v-model="form.hunting_type_id" class="form-select" required>
                    <option :value="null">Select Hunting Type</option>
                    <option v-for="option in huntingTypesOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Season <span class="text-danger">*</span></label>
                  <select v-model="selectedSeasonId" class="form-select" required @change="onSeasonChange">
                    <option :value="null">Select season</option>
                    <option v-for="option in seasonsOptions" :key="option.value?.id || option.value"
                      :value="option.value?.id || option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="row mb-5">
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Amount <span class="text-danger">*</span></label>
                  <input v-model="form.amount" type="text" class="form-control" placeholder="Enter Amount" required />
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Currency <span class="text-danger">*</span></label>
                  <select v-model="form.currency" class="form-select" required>
                    <option :value="null">Select Currency</option>
                    <option v-for="option in currencyOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Duration (days) <span class="text-danger">*</span></label>
                  <select v-model="form.duration" class="form-select" required>
                    <option :value="null">Enter Duration eg: 21 days</option>
                    <option v-for="option in durationsOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="row mb-5">
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Companion Cost</label>
                  <input v-model="form.companion_amount" type="number" class="form-control" placeholder="Enter Amount" />
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Companion Days</label>
                  <select v-model="form.companion_days" class="form-select">
                    <option :value="null">Select Days</option>
                    <option v-for="option in durationsOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Observer Cost</label>
                  <input v-model="form.observer_amount" type="number" class="form-control" placeholder="Enter Amount" />
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Observer Days</label>
                  <select v-model="form.observer_days" class="form-select">
                    <option :value="null">Select Days</option>
                    <option v-for="option in durationsOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Upgrade Fees Section (Optional) -->
            <div class="card mb-2">
              <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="fa fa-arrow-up text-primary me-2"></i>Upgrade Fees (Optional)</h6>
                <button type="button" class="btn btn-primary btn-sm" @click="addUpgradeFee">
                  <i class="fa fa-plus me-1"></i> Add Fee
                </button>
              </div>
              <div class="card-body py-2">
                <p class="text-muted small mb-2">
                  Add upgrade fees for additional species that can be hunted beyond the standard package.
                </p>

                <div v-if="upgradeFees.length > 0">
                  <div v-for="(fee, index) in upgradeFees" :key="index" class="card mb-2 border-warning"
                    style="border-left: 3px solid #ffc107">
                    <div class="card-body py-2">
                      <div class="row g-2 mb-2">
                        <div class="col-md-3">
                          <label class="form-label small mb-1">Species <span class="text-danger">*</span></label>
                          <select v-model="fee.species_id" class="form-select" required>
                            <option :value="null">Select Species</option>
                            <option v-for="option in speciesOptions" :key="option.value" :value="option.value">
                              {{ option.text }}
                            </option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <label class="form-label small mb-1">Amount <span class="text-danger">*</span></label>
                          <input v-model="fee.amount" type="number" class="form-control" placeholder="Amount" required />
                        </div>
                        <div class="col-md-2">
                          <label class="form-label small mb-1">Currency <span class="text-danger">*</span></label>
                          <select v-model="fee.currency_id" class="form-select" required>
                            <option :value="null">Currency</option>
                            <option v-for="option in currencyOptions" :key="option.value" :value="option.value">
                              {{ option.text }}
                            </option>
                          </select>
                        </div>
                        <div class="col-md-4">
                          <label class="form-label small mb-1">Description (Optional)</label>
                          <input v-model="fee.description" type="text" class="form-control"
                            placeholder="Enter description" />
                        </div>
                        <div class="col-md-1 d-flex align-items-end">
                          <button type="button" class="btn btn-danger btn-sm w-100"
                            style="background-color: #b30000; border-color: #b30000; color: white" title="Remove"
                            @click="removeUpgradeFee(index)">
                            <i class="fa fa-trash" style="color: white"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-3 text-muted border border-dashed rounded small">
                  <i class="fa fa-info-circle me-2"></i>
                  No upgrade fees added. Click "Add Fee" to add optional upgrade fees.
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Save Button -->
      <div class="d-flex justify-content-end align-items-center mt-4 mb-3">
        <button type="button" class="btn btn-primary" :disabled="savingPriceList || !canSubmit" @click="submit()">
          <i class="fa fa-save me-1"></i>
          <span v-if="savingPriceList" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ editMode ? 'Update Price List' : 'Save Price List' }}
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="savingPriceList"
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style="background: rgba(0, 0, 0, 0.5); z-index: 9999">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Create New Package Modal -->
    <div v-if="_shM" class="modal fade show d-block" style="z-index: 1050; display: block !important;" tabindex="-1"
      role="dialog" @click.self="_shM = false">
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Package</h5>
            <button type="button" class="btn-close" @click="_shM = false"></button>
          </div>
          <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
            <SalesPackageForm @go-back="_shM = false" @saved="handlePackageSaved"> </SalesPackageForm>
          </div>
        </div>
      </div>
    </div>
    <div v-if="_shM" class="modal-backdrop fade show" style="z-index: 1040;" @click="_shM = false"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
// Va* components are globally registered Bootstrap components - no import needed
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import { validators } from '../../../stores/bushman/utils.ts'

import { useToast } from '@/composables/useToast'
import { mapActions, mapState, mapWritableState } from 'pinia'
import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import { usePriceListStore } from '../../../stores/bushman/price-list-store.ts'
import SalesPackageForm from '../../bushman/module-settings/SalesPackageForm.vue'

export default defineComponent({
  components: {
    // Salesinquirieslist,
    SalesPackageForm,
    // Va* components are globally registered
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
    const showEditForm = ref(false)
    const isValidForm = ref(true)
    // const _usePriceListStore: any = usePriceListStore()

    // const pkg: any = computed(() => {
    //   return _usePriceListStore.latestPackage
    // })

    const form = reactive({
      id: null as any,
      hunting_type_id: null as any,
      package: null as any,
      // description: '',s
      // sales_quota_id: null as any,
      amount: null as any,

      currency: null as any,
      duration: null as any,
      season: null as any,
      end_date: null as any,
      species: null as any,
      quantity: null as any,
      // area: null as any,
      companion_days: null as any,
      companion_amount: null as any,
      observer_days: null as any,
      observer_amount: null as any,
    })

    // make as copy of pkg to form package

    const contactForm = reactive({
      id: null as any,
      client_id: null as any,
      contact: '',
      contact_type: null as any,
      contactable: false,
    })

    const countries = ref([]) as any
    const nationality = ref([]) as any
    const categoryOptions = ref([]) as any
    const contactsTypes = ref([]) as any
    const clients = ref([]) as any
    const step = ref(0) as any

    return {
      formRef,
      form,
      contactForm,
      showEditForm,
      countries,
      nationality,
      categoryOptions,
      contactsTypes,
      clients,
      step,
      // steps,
      init,
      isValidForm,
      validators,
    }
  },
  data() {
    // 1-21
    const durationsOptions: any = [
      { value: 1, text: '1 day' },
      { value: 2, text: '2 days' },
      { value: 3, text: '3 days' },
      { value: 4, text: '4 days' },
      { value: 5, text: '5 days' },
      { value: 6, text: '6 days' },
      { value: 7, text: '7 days' },
      { value: 8, text: '8 days' },
      { value: 9, text: '9 days' },
      { value: 10, text: '10 days' },
      { value: 11, text: '11 days' },
      { value: 12, text: '12 days' },
      { value: 13, text: '13 days' },
      { value: 14, text: '14 days' },
      { value: 15, text: '15 days' },
      { value: 16, text: '16 days' },
      { value: 17, text: '17 days' },
      { value: 18, text: '18 days' },
      { value: 19, text: '19 days' },
      { value: 20, text: '20 days' },
      { value: 21, text: '21 days' },
    ]
    return {
      preferred_species: [] as any,
      speciesOptions: [] as any,
      speciesObjects: [] as any,
      areasOptions: [] as any,
      huntingTypesOptions: [] as any,
      salesQuotasOptions: [] as any,
      speciesItemOptions: [] as any,
      currencyOptions: [] as any,
      // packageOptions: [] as any,
      savingPriceList: false,
      durationsOptions,
      seasonsOptions: [] as any,
      selectedSeasonId: null as any,
      upgradeFees: [] as any[],
      originalFormData: null as any,
      originalUpgradeFees: [] as any[],
    }
  },
  computed: {
    ...mapState(usePriceListStore, ['salesPackages', 'packageOptions', 'latestPackage', 'loadingpackages']),
    ...mapWritableState(usePriceListStore, {
      _shM: 'showModal',
    }),
    // Check if form has changed from original values
    hasFormChanged() {
      if (!this.editMode || !this.originalFormData) {
        return true // In create mode, always allow submit (validation will handle it)
      }

      // Helper function to get value from option object or direct value
      const getValue = (val: any) => {
        if (val === null || val === undefined) return null
        if (typeof val === 'object' && val !== null && 'value' in val) return val.value
        return val
      }

      // Helper to compare two values (handles null/undefined)
      const compareValues = (a: any, b: any) => {
        const valA = getValue(a)
        const valB = getValue(b)
        if (valA === null && valB === null) return true
        if (valA === null || valB === null) return false
        return valA === valB
      }

      // Compare form fields
      if (!compareValues(this.form.hunting_type_id, this.originalFormData.hunting_type_id)) return true
      if (!compareValues(this.form.currency, this.originalFormData.currency)) return true
      if (!compareValues(this.form.duration, this.originalFormData.duration)) return true

      // Compare season by ID
      const currentSeasonId = getValue(this.form.season)?.id || getValue(this.form.season)
      const originalSeasonId = getValue(this.originalFormData.season)?.id || getValue(this.originalFormData.season)
      if (currentSeasonId !== originalSeasonId) return true

      // Compare amounts (normalize to string for comparison)
      const normalizeAmount = (amt: any) => String(amt || '').trim()
      if (normalizeAmount(this.form.amount) !== normalizeAmount(this.originalFormData.amount)) return true
      if (normalizeAmount(this.form.companion_amount) !== normalizeAmount(this.originalFormData.companion_amount))
        return true
      if (normalizeAmount(this.form.observer_amount) !== normalizeAmount(this.originalFormData.observer_amount))
        return true

      if (!compareValues(this.form.companion_days, this.originalFormData.companion_days)) return true
      if (!compareValues(this.form.observer_days, this.originalFormData.observer_days)) return true

      // Compare package - now single value
      if (!compareValues(this.form.package, this.originalFormData.package)) return true

      // Compare upgrade fees
      const normalizeFees = (fees: any[]) => {
        return fees
          .map((fee: any) => ({
            id: fee.id || null,
            species_id: getValue(fee.species_id),
            amount: normalizeAmount(fee.amount),
            currency_id: getValue(fee.currency_id),
            description: (fee.description || '').trim(),
          }))
          .sort((a: any, b: any) => {
            // Sort by id first, then by species_id
            if (a.id !== b.id) return (a.id || 0) - (b.id || 0)
            return (a.species_id || 0) - (b.species_id || 0)
          })
      }

      const currentFees = normalizeFees(this.upgradeFees || [])
      const originalFees = normalizeFees(this.originalUpgradeFees || [])
      if (currentFees.length !== originalFees.length) return true
      if (JSON.stringify(currentFees) !== JSON.stringify(originalFees)) return true

      return false
    },
    // In edit mode, check if form has changed
    // In create mode, check validation
    canSubmit() {
      if (this.editMode) {
        return this.hasFormChanged // Only allow submit if form has changed
      }
      // Basic validation check
      return (
        this.form.package &&
        this.form.hunting_type_id &&
        this.form.season &&
        this.form.amount &&
        this.form.currency &&
        this.form.duration
      )
    },
  },

  watch: {
    // Watch for editItem changes to populate form when editing
    editItem: {
      handler(newVal) {
        if (this.editMode && newVal) {
          // Wait for options to be loaded before populating
          this.$nextTick(() => {
            setTimeout(() => {
              this.populateFormForEdit()
            }, 100)
          })
        }
      },
      immediate: true,
      deep: true,
    },
    // use both close modal and show modal to close modal
    // i want if the  closeMadal is true then showModal should be false
  },
  async mounted() {
    // Ensure modal is closed when component mounts
    this._shM = false
    // this.getAllSpeciesPerQuotaPerArea()
    await Promise.all([
      this.getAreas(),
      this.getHuntingTypes(),
      this.getQuotaList(),
      this.getCurrencyList(),
      this.getSalesPackages(),
      this.getSeasonList(),
      this.getSpeciesItems(),
    ])

    // If in edit mode, populate form with existing data (after options are loaded)
    if (this.editMode && this.editItem) {
      this.populateFormForEdit()
    }
  },

  methods: {
    ...mapActions(useQuotaStore, ['getSpeciesList']),
    ...mapActions(useQuotaStore, ['getAllSpeciesPerQuotaPerArea']),
    ...mapActions(useQuotaStore, ['getAreaList']),
    ...mapActions(useSettingsStore, ['getHuntingsTypes']),
    ...mapActions(useSettingsStore, ['getCurrencies', 'getSeasons']),
    ...mapActions(useQuotaStore, ['getQuotas']),
    ...mapActions(usePriceListStore, ['createPriceList', 'updatePriceList']),
    ...mapActions(usePriceListStore, ['getSalesPackageList']),

    // addNewSpeciesItemToStorage() {},
    // CreateSalesInquiry

    // ...mapActions(useSalesInquiriesStore, ['createSalesInquiry']),

    handleGoBack() {
      this.$emit('go-back')
    },

    onAreaChange(value: any) {
      console.log(value as any)
      // this.getAllSpieces()
    },

    async submit() {
      // Validate form
      if (this.formRef && !this.formRef.checkValidity()) {
        this.formRef.reportValidity()
        return
      }

      this.savingPriceList = true

      // Prepare upgrade fees data (only include valid entries)
      const validUpgradeFees = this.upgradeFees
        .filter((fee: any) => fee.species_id && fee.amount && fee.currency_id)
        .map((fee: any) => {
          const feeData: any = {
            species_id: fee.species_id,
            amount: parseFloat(fee.amount),
            currency_id: fee.currency_id,
            description: fee.description || '',
          }
          // Include ID for existing fees (when editing)
          if (fee.id) {
            feeData.id = fee.id
          }
          return feeData
        })

      // Handle package - now single value like hunting type
      const salesPackageIds = this.form.package ? [this.form.package] : []

      const requestdata = {
        huntingTypeId: this.form.hunting_type_id,
        sales_package_ids: salesPackageIds,
        // Also include price_type_packages array expected by backend
        price_type_packages: salesPackageIds.map((id: any) => ({ sales_package_id: id })),
        amount: this.form.amount,
        currency: this.form.currency,
        duration: this.form.duration,
        season_id: this.form.season?.value?.id || this.form.season?.id,
        //chriss' codes
        start_at: this.form.season?.value?.start_at || this.form.season?.start_at,
        end_at: this.form.season?.value?.end_at || this.form.season?.end_at,
        is_active: 1,
        area_id: 3,
        user_id: 1,
        companionAmount:
          this.form.companion_amount !== null && this.form.companion_amount !== undefined
            ? Number(this.form.companion_amount)
            : null,
        companionDays: this.form.companion_days || null,
        observerAmount:
          this.form.observer_amount !== null && this.form.observer_amount !== undefined
            ? Number(this.form.observer_amount)
            : null,
        observerDays: this.form.observer_days || null,
        upgrade_fees: validUpgradeFees.length > 0 ? validUpgradeFees : null,
      }

      // Log the payload being sent
      console.log('=== PRICE LIST SUBMIT PAYLOAD ===')
      console.log('Edit Mode:', this.editMode)
      console.log('Full Request Data:', JSON.stringify(requestdata, null, 2))
      console.log('Observer Amount:', requestdata.observerAmount)
      console.log('Observer Days:', requestdata.observerDays)
      console.log('Companion Amount:', requestdata.companionAmount)
      console.log('Companion Days:', requestdata.companionDays)
      console.log('=================================')

      try {
        let response: any
        if (this.editMode && this.editItem) {
          console.log('Updating price list with ID:', this.editItem.id)
          response = await this.updatePriceList(this.editItem.id, requestdata)
          if (response.status === 200) {
            this.init({ message: 'Price list updated successfully', color: 'success' })
            this.savingPriceList = false
            this.$emit('saved')
          }
        } else {
          response = await this.createPriceList(requestdata)
          if (response.status === 201) {
            this.init({ message: response.data.message, color: 'success' })
            // Reset form
            this.form.package = null
            this.form.hunting_type_id = null
            this.form.season = null
            this.selectedSeasonId = null
            this.form.amount = null
            this.form.currency = null
            this.form.duration = null
            this.form.companion_amount = null
            this.form.companion_days = null
            this.form.observer_amount = null
            this.form.observer_days = null
            this.speciesObjects = []
            this.upgradeFees = []
            this.savingPriceList = false
            if (this.formRef) {
              this.formRef.reset()
            }
          }
        }
      } catch (error: any) {
        this.savingPriceList = false
        handleErrors(error.response)
        console.log(error)
        this.init({
          message: error.message,
          color: 'danger',
        })
      }
    },

    populateFormForEdit() {
      if (!this.editItem) return

      // Options should already be loaded since we await them in mounted()
      console.log('Edit Item:', JSON.stringify(this.editItem, null, 2))
      console.log('Hunting Types Options:', this.huntingTypesOptions)
      console.log('Seasons Options:', this.seasonsOptions)
      console.log('Currency Options:', this.currencyOptions)

      // Handle nested structure from API (price_list_type contains the main data)
      const priceListType = this.editItem.price_list_type || this.editItem

      // Set amount - handle different data structures
      const rawAmount = priceListType.amount || this.editItem.amount
      if (rawAmount) {
        this.form.amount = String(rawAmount).replace('$', '').replace(',', '')
      }

      // Set duration - handle nested structure
      const durationValue = priceListType.duration || this.editItem.duration
      if (durationValue !== undefined && durationValue !== null) {
        this.form.duration = this.durationsOptions.find((d: any) => d.value === durationValue) || {
          value: durationValue,
          text: `${durationValue} days`,
        }
      }

      // Set hunting type - match by name since API returns name only
      const huntingTypeName = priceListType.hunting_type?.name || this.editItem.hunting_type
      console.log('Hunting Type Name:', huntingTypeName)
      if (huntingTypeName) {
        const foundHuntingType = this.huntingTypesOptions.find((h: any) => h.text === huntingTypeName)
        this.form.hunting_type_id = foundHuntingType ? foundHuntingType.value : null
      }
      console.log('Selected Hunting Type:', this.form.hunting_type_id)

      // Set season - need to find season that matches the date range
      const startDate = priceListType.price_list?.start_date
      const endDate = priceListType.price_list?.end_date
      console.log('Season dates:', startDate, endDate)
      if (startDate && endDate) {
        // Find season by matching dates
        this.form.season = this.seasonsOptions.find(
          (s: any) => s.value?.start_at === startDate && s.value?.end_at === endDate,
        )
        // If not found by exact date, try to find by year
        if (!this.form.season) {
          const year = new Date(startDate).getFullYear()
          this.form.season = this.seasonsOptions.find((s: any) => s.text?.includes(String(year)))
        }
        // Also set selectedSeasonId for the select dropdown
        if (this.form.season) {
          this.selectedSeasonId = this.form.season.value?.id || this.form.season.value
        }
      }
      console.log('Selected Season:', this.form.season)
      console.log('Selected Season ID:', this.selectedSeasonId)

      // Set currency - match by name since API returns name only
      const currencyName = priceListType.currency?.name
      console.log('Currency Name:', currencyName)
      if (currencyName) {
        this.form.currency = this.currencyOptions.find((c: any) => c.text === currencyName)
      }
      if (!this.form.currency) {
        // Default to USD if not set
        this.form.currency = this.currencyOptions.find((c: any) => c.text === 'USD') || this.currencyOptions[0]
      }
      console.log('Selected Currency:', this.form.currency)

      // Set companion fields - check for companion_hunter_costs in nested structure
      const companionCosts = this.editItem.companion_hunter_costs || priceListType.companion_hunter_costs
      if (companionCosts && companionCosts.length > 0) {
        const firstCompanion = companionCosts[0]
        this.form.companion_amount = firstCompanion.amount || null
        if (firstCompanion.days) {
          this.form.companion_days = this.durationsOptions.find((d: any) => d.value === firstCompanion.days) || {
            value: firstCompanion.days,
            text: `${firstCompanion.days} days`,
          }
        }
      } else {
        // Fallback to direct properties
        this.form.companion_amount = this.editItem.companion_amount || null
        if (this.editItem.companion_days) {
          this.form.companion_days = this.durationsOptions.find(
            (d: any) => d.value === this.editItem.companion_days,
          ) || {
            value: this.editItem.companion_days,
            text: `${this.editItem.companion_days} days`,
          }
        }
      }

      // Set observer fields - check for observer_hunter_costs in nested structure
      const observerCosts = this.editItem.observer_hunter_costs || priceListType.observer_hunter_costs
      if (observerCosts && observerCosts.length > 0) {
        const firstObserver = observerCosts[0]
        this.form.observer_amount = firstObserver.amount || null
        if (firstObserver.days) {
          this.form.observer_days = this.durationsOptions.find((d: any) => d.value === firstObserver.days) || {
            value: firstObserver.days,
            text: `${firstObserver.days} days`,
          }
        }
      } else {
        // Fallback to direct properties
        this.form.observer_amount = this.editItem.observer_amount || null
        if (this.editItem.observer_days) {
          this.form.observer_days = this.durationsOptions.find((d: any) => d.value === this.editItem.observer_days) || {
            value: this.editItem.observer_days,
            text: `${this.editItem.observer_days} days`,
          }
        }
      }

      // Set package if available - now single value
      const salesPackage = this.editItem.sales_package
      if (salesPackage) {
        this.form.package = salesPackage.id
      } else if (this.editItem.packages && Array.isArray(this.editItem.packages) && this.editItem.packages.length > 0) {
        // If multiple packages, use the first one
        this.form.package = this.editItem.packages[0].id
      }

      // Populate upgrade fees if available
      const upgradeFees = this.editItem.upgrade_fees || priceListType.upgrade_fees
      if (upgradeFees && Array.isArray(upgradeFees) && upgradeFees.length > 0) {
        this.upgradeFees = upgradeFees.map((fee: any) => {
          // Find species option
          const speciesOption = this.speciesOptions.find((s: any) => s.value === fee.species_id)
          // Find currency option
          const currencyOption = this.currencyOptions.find((c: any) => c.value === fee.currency_id)

          return {
            id: fee.id, // Keep the ID for updating existing fees
            species_id: speciesOption || {
              value: fee.species_id,
              text: fee.species?.name || fee.species_name || `Species ${fee.species_id}`,
            },
            // Convert amount to string for input field
            amount: fee.amount ? String(fee.amount) : null,
            currency_id: currencyOption || {
              value: fee.currency_id,
              text: fee.currency?.name || fee.currency_symbol || 'USD',
            },
            description: fee.description || '',
          }
        })
      }

      // Store original form data for change detection (deep clone)
      this.originalFormData = JSON.parse(JSON.stringify(this.form))
      this.originalUpgradeFees = JSON.parse(JSON.stringify(this.upgradeFees))
    },

    async getSpeciesItems() {
      try {
        const response = await this.getSpeciesList()

        // Add the species items from the response
        this.speciesOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item.id,
            text: item.name,
          }
        })

        // Combine default option with species items
        // this.speciesOptions = this.speciesOptions.concat(speciesItems)
      } catch (error) {
        console.log(error)
      }
    },
    async getSeasonList() {
      try {
        const response = await this.getSeasons()
        this.seasonsOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item,
            text: item.name,
          }
        })
      } catch (error) {
        console.log(error)
      }
    },

    _showModal() {
      this._shM = true
    },

    async handlePackageSaved() {
      // Refresh the package list after a new package is created
      await this.getSalesPackages()
      // Close the modal
      this._shM = false
    },

    async getSalesPackages() {
      try {
        await this.getSalesPackageList(true)
      } catch (error) {
        console.log(error)
      }
    },

    deleteFromStorage(index: number) {
      this.speciesObjects.splice(index, 1)
      console.log('Species item deleted:', index)
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

    // get hunting types
    async getHuntingTypes() {
      try {
        const response = await this.getHuntingsTypes()
        this.huntingTypesOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item.id,
            text: item.name,
          }
        })
      } catch (error) {
        console.log(error)
      }
    },
    onChangePackage() {
      // Package is now a single value like hunting type
      console.log('Selected package:', this.form.package)
    },
    onSeasonChange() {
      // Update form.season from selectedSeasonId
      this.form.season = this.seasonsOptions.find((opt: any) => (opt.value?.id || opt.value) === this.selectedSeasonId)
    },

    // async getAllSpieces() {
    //   try {
    //     const response = await this.getAllSpeciesPerQuotaPerArea(null, this.form.area?.value ?? null, null)
    //     this.speciesItemOptions = response.data.map((item: any) => {
    //       return {
    //         value: item.species.id,
    //         text: item.species.name,
    //       }
    //     })
    //     // }
    //   } catch (error) {
    //     console.log(error)
    //   }
    // },

    // get quotas
    async getQuotaList() {
      try {
        const response = await this.getQuotas(null)
        this.salesQuotasOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item.id,
            text: item.name,
          }
        })
      } catch (error) {
        console.log(error)
      }
    },

    async getCurrencyList() {
      try {
        const response = await this.getCurrencies()
        this.currencyOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item.id,
            text: item.name,
          }
        })
      } catch (error) {
        console.log(error)
      }
    },

    // Upgrade fees methods
    addUpgradeFee() {
      this.upgradeFees.push({
        species_id: null,
        amount: null,
        currency_id: null,
        description: '',
      })
    },

    removeUpgradeFee(index: number) {
      this.upgradeFees.splice(index, 1)
    },

    // get clients
  },
})
</script>

<style scoped>
.price-list-form-page {
  background-color: transparent;
  position: relative;
}

/* Form Price List Container - wraps card and footer */
.form-price-list-container {
  position: relative;
}

/* Add padding to card body */
.form-price-list-container .card-body {
  padding-bottom: 1rem;
}

/* Compact spacing for better space utilization */
.card-header {
  padding: 0.5rem 1rem;
}

.card-body {
  padding: 1.5rem;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  display: block;
}

.form-group {
  margin-bottom: 0;
}

/* Ensure proper spacing between form rows */
form .row {
  margin-bottom: 2rem !important;
}

/* Increased horizontal spacing between columns */
form .row {
  --bs-gutter-x: 3rem !important;
  margin-left: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
  margin-right: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
}

form .row>[class*='col-'] {
  padding-left: calc(var(--bs-gutter-x) * 0.5) !important;
  padding-right: calc(var(--bs-gutter-x) * 0.5) !important;
}

/* Additional spacing for form groups */
form .form-group {
  margin-bottom: 0;
}

/* Reduce margins between cards */
.card.mb-2 {
  margin-bottom: 0.5rem !important;
}
</style>
