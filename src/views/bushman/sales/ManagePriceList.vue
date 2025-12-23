<template>
  <div class="">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Price Lists</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="!ShowCreateNewPriceListForm">
      <!-- Price List View -->
      <template v-if="showPriceList">
        <div class="row layout-top-spacing bg-white rounded">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
            <div class="panel br-6 p-0">
              <div class="custom-table p-3">
                <StandardDataTable :columns="columns" :data="dataFetched" :loading="loading" :filters="tableFilters"
                  :default-page-size="tableFilters.pageSize" :disable-pagination="false" :show-date-filters="false"
                  :action-buttons="pageActions" :custom-filters="customFilters" :selectable="true"
                  @update:filters="handleFiltersUpdate" @selectionChange="handleSelectionChange">
                  <template #package_name="{ row }">
                    {{ (row as any).package_name }}
                  </template>
                  <template #area="{ row }">
                    {{ (row as any).area }}
                  </template>
                  <template #hunting_type="{ row }">
                    {{ (row as any).hunting_type }}
                  </template>
                  <template #amount="{ row }">
                    {{ (row as any).currency_symbol || '$' }}{{ formatAmount((row as any).amount) }}
                  </template>
                  <template #duration="{ row }"> {{ (row as any).duration }} Days </template>
                  <template #start date="{ row }">{{ (row as any).start_date }}</template>
                  <!-- Species column removed temporarily -->
                  <template #status="{ row }">
                    {{ (row as any).status }}
                  </template>
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      <button class="btn btn-info btn-sm" title="View" :disabled="loadingDetail"
                        @click="toggleShowPriceListMethod(row as any)">
                        <i v-if="!loadingDetail" class="fa fa-eye"></i>
                        <span v-else class="spinner-border spinner-border-sm"></span>
                      </button>
                      <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row as any)">
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

      <!-- Detail View -->
      <template v-else-if="!showEditForm">
        <PricesListDetails :price-list-item="item" :pdf-data="individualPriceListPdf" @goBack="goBack"
          @edit="handleEditFromDetails" @delete="handleDeleteFromDetails"></PricesListDetails>
      </template>

      <!-- Edit Form -->
      <template v-else-if="showEditForm">
        <CreatePricesListForm :edit-mode="true" :edit-item="editItem" @saved="onEditSaved" @goBack="goBack">
        </CreatePricesListForm>
      </template>
    </template>

    <!-- Create Form -->
    <template v-if="ShowCreateNewPriceListForm">
      <CreatePricesListForm @goBack="goBack" @saved="getPriceLists"></CreatePricesListForm>
    </template>
  </div>

  <!-- Delete Confirmation Modal -->

</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, onMounted, computed } from 'vue'
import { useToast } from '../../../composables/useToast.ts'
import PricesListDetails from './PriceListDetails.vue'
import { usePriceListStore } from '../../../stores/bushman/price-list-store.ts'
import CreatePricesListForm from './CreatePricesListForm.vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import downloadPdf from '../../../stores/bushman/pdfDownloader.ts'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

// Constants
const columns = [
  { key: 'package_name', label: 'Package Name', sortable: true, visible: true },
  { key: 'area', label: 'Area', sortable: true, visible: true },
  { key: 'hunting_type', label: 'Hunting Type', sortable: true, visible: true },
  { key: 'amount', label: 'Price', sortable: true, visible: true },
  { key: 'duration', label: 'Duration', sortable: true, visible: true },
  { key: 'start_date', label: 'start date', sortable: true, visible: true },
  { key: 'end_date', label: 'end date', sortable: true, visible: true },

  // Species column removed temporarily
  
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

// Reactive state
const items = ref<any[]>([])
const dataFetched = ref<any[]>([])
const printableDataList = ref<any[]>([])
const item = ref<any>(null)
const toast = useToast()
const areasOptions = ref<any[]>([])
const huntingTypeOptions = ref<any[]>([])
const seasonOptions = ref<any[]>([])
const showPriceList = ref(true)
const ShowCreateNewPriceListForm = ref(false)
const loading = ref(false)
const loadingDetail = ref(false)
const loadingSeasons = ref(false)
const huntingTypeValue = ref<any>(null)
const areaValue = ref<any>(null)
const seasonValue = ref<any>(null)
const minAmount = ref<any>(null)
const maxAmount = ref<any>(null)
const poriceListPdf = ref<any>('')
const individualPriceListPdf = ref<any>('')
const downloadingPdf = ref(false)
const deleting = ref(false)
const showEditForm = ref(false)
const editItem = ref<any>(null)
const tableFilters = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: '',
  season_id: '',
  hunting_type_id: '',
  area_id: '',
  min_amount: '',
  max_amount: '',
})

const formatAmount = (amount: string | number | null | undefined) => {
  if (amount === null || amount === undefined) return '0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Stores
const priceListStore = usePriceListStore()
const quotaStore = useQuotaStore()
const settingsStore = useSettingsStore()

const pageActions = computed(() => {
  const actions = []
  if (showPriceList.value && !ShowCreateNewPriceListForm.value && !showEditForm.value) {
    actions.push({
      label: 'Add New',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => showCreateNewPriceListFormMethod(),
    })
    actions.push({
      label: 'Download PDF',
      icon: 'fa fa-download',
      class: 'btn btn-info',
      method: () => onDownloadPdf(),
    })
  }
  return actions
})

const customFilters = computed(() => {
  return [
    {
      key: 'season_id',
      label: 'Season',
      type: 'select',
      placeholder: 'Select Season',
      options: seasonOptions.value.map((opt: any) => ({
        value: opt.value,
        label: opt.text,
      })),
      defaultValue: '',
    },
    {
      key: 'hunting_type_id',
      label: 'Hunting Type',
      type: 'select',
      placeholder: 'Select Type',
      options: huntingTypeOptions.value.map((opt: any) => ({
        value: opt.value,
        label: opt.text,
      })),
      defaultValue: '',
    },
    {
      key: 'area_id',
      label: 'Area',
      type: 'select',
      placeholder: 'Select Area',
      options: areasOptions.value.map((opt: any) => ({
        value: opt.value,
        label: opt.text,
      })),
      defaultValue: '',
    },
    {
      key: 'min_amount',
      label: 'Min Amount',
      type: 'number',
      placeholder: 'Min price',
      defaultValue: '',
    },
    {
      key: 'max_amount',
      label: 'Max Amount',
      type: 'number',
      placeholder: 'Max price',
      defaultValue: '',
    },
  ]
})

// Methods
const getSeasonOptions = async () => {
  loadingSeasons.value = true
  try {
    const response = await settingsStore.getSeasons(false)
    if (response.status === 200) {
      const all = { value: '', text: 'All Seasons' }
      seasonOptions.value = response.data.map((item: any) => ({
        value: item.id,
        text: item.name,
      }))
      seasonOptions.value.unshift(all)
      seasonValue.value = seasonOptions.value[0]
    }
  } catch (error) {
    console.error('Error fetching seasons:', error)
  } finally {
    loadingSeasons.value = false
  }
}

const toggleShowPriceListMethod = async (rowData: any) => {
  const priceListId = rowData?.id
  if (!priceListId) return

  loadingDetail.value = true
  try {
    const response = await priceListStore.getPriceListById(priceListId)
    console.log('getPriceListById full response:', response)
    console.log('response.data:', response.data)
    
    // Handle different response structures
    let priceListData = response.data
    if (priceListData && typeof priceListData === 'object') {
      // If data is nested in a 'data' property, extract it
      if ('data' in priceListData && priceListData.data) {
        item.value = priceListData.data
        individualPriceListPdf.value = priceListData.pdf || ''
        console.log('Using nested data structure, item:', item.value)
      } else {
        // Otherwise use the response data directly
        item.value = priceListData
        individualPriceListPdf.value = priceListData.pdf || ''
        console.log('Using direct data structure, item:', item.value)
      }
      
      console.log('Final item.value:', item.value)
      console.log('Item value keys:', Object.keys(item.value || {}))
      console.log('Has sales_package?', !!item.value?.sales_package)
      
      // Only switch view if we have valid data with required structure
      if (item.value) {
        showPriceList.value = false
      } else {
        toast?.init({ message: 'Invalid price list data received', color: 'warning' })
      }
    } else {
      toast?.init({ message: 'No price list data received', color: 'warning' })
    }
  } catch (error) {
    console.error('Error fetching price list detail:', error)
    toast?.init({ message: 'Failed to load price list details', color: 'danger' })
  } finally {
    loadingDetail.value = false
  }
}

const onDownloadPdf = async () => {
  downloadingPdf.value = true
  try {
    const unwrap = (v: any) => {
      if (v === null || v === undefined) return ''
      if (typeof v === 'object' && 'value' in v) return v.value
      return v
    }

    const huntingTypeId = unwrap(huntingTypeValue.value) || ''
    const areaId = unwrap(areaValue.value) || ''
    const seasonId = unwrap(seasonValue.value) || ''
    const minAmountValue = minAmount.value || ''
    const maxAmountValue = maxAmount.value || ''

    const response = await priceListStore.getCompletePriceListPdf(
      huntingTypeId,
      areaId,
      seasonId,
      minAmountValue,
      maxAmountValue,
    )

    if (response.status === 200) {
      const pdf = response.data?.pdf || response.data
      const isUrl = (s: any) => typeof s === 'string' && /^https?:\/\//i.test(s)
      const isLikelyBase64 = (s: any) => typeof s === 'string' && s.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(s)

      if (!pdf || (!isUrl(pdf) && !isLikelyBase64(pdf))) {
        toast?.init({ message: 'PDF not available', color: 'warning' })
        return
      }

      await downloadPdf(pdf, `price-list-${Date.now()}.pdf`)
    } else {
      toast?.init({ message: 'Failed to generate PDF', color: 'danger' })
    }
  } catch (err) {
    console.error('Error downloading PDF:', err)
    // Display the actual error message from the API if available
    const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF'
    toast?.init({ message: errorMessage, color: 'danger' })
  } finally {
    downloadingPdf.value = false
  }
}

const goBack = () => {
  console.log('ManagePriceList: goBack called')
  showPriceList.value = true
  ShowCreateNewPriceListForm.value = false
  showEditForm.value = false
  editItem.value = null
  getPriceLists()
}

const showCreateNewPriceListFormMethod = () => {
  ShowCreateNewPriceListForm.value = true
  showPriceList.value = false
  showEditForm.value = false
}

const handleEditFromDetails = async () => {
  try {
    // Use the current item from detail view
    if (item.value && item.value.id) {
      const response = await priceListStore.getPriceListById(item.value.id)
      editItem.value = response.data.data || response.data
      showEditForm.value = true
      showPriceList.value = false
      ShowCreateNewPriceListForm.value = false
    }
  } catch (error) {
    console.error('Error fetching price list for edit:', error)
    toast?.init({ message: 'Failed to load price list details', color: 'danger' })
  }
}

const onEditSaved = () => {
  showEditForm.value = false
  showPriceList.value = true
  editItem.value = null
  getPriceLists()
  toast?.init({ message: 'Price list updated successfully', color: 'success' })
}

const handleDeleteFromDetails = async () => {
  if (!item.value) return

  const packageName = item.value.sales_package?.name || item.value.package_name || 'this price list'

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete "${packageName}"? This action cannot be undone!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
  })

  if (!result.isConfirmed) return

  deleting.value = true
  try {
    const response = await priceListStore.deletePriceList(item.value.id, true)
    if (response.status === 200 || response.status === 204) {
      toast?.init({ message: 'Price list deleted successfully', color: 'success' })
      // Go back to list view after deletion
      showPriceList.value = true
      item.value = null
      getPriceLists()
    }
  } catch (error: any) {
    const errors = handleErrors(error.response)
    toast?.init({ message: errors.join(', ') || 'Failed to delete price list', color: 'danger' })
  } finally {
    deleting.value = false
  }
}

const confirmDelete = async (itemData: any) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete "${itemData.package_name || 'this price list'}"? This action cannot be undone!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
  })

  if (!result.isConfirmed) return

  deleting.value = true
  try {
    const response = await priceListStore.deletePriceList(itemData.id, true)
    if (response.status === 200 || response.status === 204) {
      toast?.init({ message: 'Price list deleted successfully', color: 'success' })
      // Go back to list view after deletion
      showPriceList.value = true
      item.value = null
      getPriceLists()
    }
  } catch (error: any) {
    const errors = handleErrors(error.response)
    toast?.init({ message: errors.join(', ') || 'Failed to delete price list', color: 'danger' })
  } finally {
    deleting.value = false
  }
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }

  // Update filter values from tableFilters
  if (filters.season_id !== undefined) {
    seasonValue.value = seasonOptions.value.find((opt: any) => opt.value === filters.season_id) || null
  }
  if (filters.hunting_type_id !== undefined) {
    huntingTypeValue.value = huntingTypeOptions.value.find((opt: any) => opt.value === filters.hunting_type_id) || null
  }
  if (filters.area_id !== undefined) {
    areaValue.value = areasOptions.value.find((opt: any) => opt.value === filters.area_id) || null
  }
  if (filters.min_amount !== undefined) {
    minAmount.value = filters.min_amount
  }
  if (filters.max_amount !== undefined) {
    maxAmount.value = filters.max_amount
  }

  getPriceLists()
}

const handleSelectionChange = (selectedRows: any[]) => {
  // Handle selected rows - can be used for bulk operations
  console.log('Selected rows:', selectedRows)
}

const getPriceLists = async () => {
  loading.value = true

  try {
    const unwrap = (v: any) => {
      if (v === null || v === undefined) return ''
      if (typeof v === 'object' && 'value' in v) return v.value
      return v
    }

    const huntingTypeId = unwrap(huntingTypeValue.value) || tableFilters.value.hunting_type_id || ''
    const areaId = unwrap(areaValue.value) || tableFilters.value.area_id || ''
    const seasonId = unwrap(seasonValue.value) || tableFilters.value.season_id || ''
    const minAmountValue = minAmount.value || tableFilters.value.min_amount || ''
    const maxAmountValue = maxAmount.value || tableFilters.value.max_amount || ''

    const response = await priceListStore.getPriceList(huntingTypeId, areaId, seasonId, minAmountValue, maxAmountValue)

    if (response.status === 200) {
      const raw = response?.data
      const dataArray = Array.isArray(raw) ? raw : (raw?.data ?? [])

      printableDataList.value = raw
      poriceListPdf.value = raw?.pdf || ''

      if (Array.isArray(dataArray)) {
          // Helper to extract currency symbol from various payload shapes
          const extractCurrency = (it: any) => {
            if (!it) return ''
            return it.currency_symbol || it.currency?.symbol || it.currency ||
              (it.items && (it.items[0]?.currency_symbol || it.items[0]?.currency?.symbol || it.items[0]?.currency)) ||
              it.price_list_type?.currency?.symbol || ''
          }

          // Helper to extract amount from various payload shapes
          const extractAmount = (it: any) => {
            if (it == null) return ''
            if (typeof it.amount !== 'undefined' && it.amount !== null) return it.amount
            if (it.items && it.items[0] && (typeof it.items[0].amount !== 'undefined')) return it.items[0].amount
            if (typeof it.total_amount !== 'undefined') return it.total_amount
            return ''
          }

          // Helper to compute species count (either explicit count, sum of total_quantity, or length)
          const computeSpeciesCount = (it: any) => {
            if (typeof it.species_count !== 'undefined' && it.species_count !== null) return it.species_count
            if (Array.isArray(it.species)) {
              // If species entries include total_quantity, sum them; otherwise return length
              const hasQty = it.species.some((s: any) => typeof s.total_quantity !== 'undefined')
              if (hasQty) return it.species.reduce((sum: number, s: any) => sum + (Number(s.total_quantity) || 0), 0)
              return it.species.length
            }
            // fallback to 0
            return 0
          }

          items.value = dataArray.map((item: any) => {
            const currency = extractCurrency(item)
            const rawAmount = extractAmount(item)
            const displayAmount = currency ? `${currency}${rawAmount}` : rawAmount
            const speciesCount = computeSpeciesCount(item)

            console.log('Mapped price list item:', { id: item.id, currency, rawAmount, displayAmount, speciesCount, items0: item.items?.[0] })

            return {
              id: item.id,
              package_name: item.package_name || item.items?.[0]?.package_name || item.items?.[0]?.name || '',
              area: item.area || item.area_name || item.area_package,
              area_package: item.area_package,
              hunting_type: item.hunting_type || item.items?.[0]?.hunting_type_name || item.hunting_type_name,
              amount: displayAmount,
              duration: item.duration || item.items?.[0]?.hunt_length_days || item.items?.[0]?.hunt_length_label,
              status: item.status,
              start_date: item.start_date,
              end_date: item.end_date,
              season_id: item.season_id,
              season_name: item.season_name,
              species_count: speciesCount,
              species: item.species || [],
              companion_hunter_costs: item.companion_hunter_costs || item.companion_hunter_prices || [],
            }
          })
          dataFetched.value = items.value
        } else {
          items.value = []
          dataFetched.value = []
        }
    }
  } catch (error) {
    console.error('Error in getPriceLists:', error)
  } finally {
    loading.value = false
  }
}

const getAreas = async () => {
  try {
    const response = await quotaStore.getAreaList()
    const all = { value: '', text: 'All Areas' }
    areasOptions.value =
      response?.data?.map((item: any) => ({
        value: item.id,
        text: item.name,
      })) || []
    areasOptions.value.unshift(all)
    areaValue.value = areasOptions.value[0]
  } catch (error) {
    console.error('Error fetching areas:', error)
  }
}

const getHuntingTypesOptions = async () => {
  try {
    const response = await settingsStore.getHuntingsTypes()
    if (response.status === 200) {
      const all = { value: '', text: 'All Types' }
      huntingTypeOptions.value =
        response?.data?.map((item: any) => ({
          value: item.id,
          text: item.name,
        })) || []
      huntingTypeOptions.value.unshift(all)
      huntingTypeValue.value = huntingTypeOptions.value[0]
    }
  } catch (error) {
    console.error('Error fetching hunting types:', error)
  }
}

// Lifecycle
onMounted(() => {
  getSeasonOptions()
  getPriceLists()
  getAreas()
  getHuntingTypesOptions()
  settingsStore.loadLogo()
})
</script>

<style lang="scss" scoped>
.price-list-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

// Local layout spacing classes to ensure consistent spacing in production
.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  margin: 0;
  padding: 0;
  border: none !important;
  box-shadow: none !important;
}

:deep(.table-simple) {
  width: 100%;
  margin: 0;

  .va-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }

  th,
  td {
    padding: 0.5rem;
    border-bottom: 1px solid #dee2e6;
    text-align: left;
    background: transparent;
  }

  th {
    font-weight: 600;
    border-bottom: 2px solid #dee2e6;
    background: transparent;
  }

  tbody tr {
    background: transparent;

    &:hover {
      background-color: #f8f9fa;
    }
  }

  // Remove all colors, badges, and icons
  .va-badge,
  .badge {
    background: transparent !important;
    color: inherit !important;
    padding: 0;
    border: none;
    font-weight: normal;
  }

  // Remove icon colors
  .va-icon,
  i.material-icons {
    color: inherit;
  }

  // Remove text colors
  .text-success,
  .text-green-600,
  .text-primary,
  .text-warning,
  .text-danger,
  .text-gray-900,
  .text-gray-700 {
    color: inherit !important;
  }

  // Remove font weights
  .font-semibold,
  .font-bold {
    font-weight: normal;
  }
}

.price-card {
  .card-header {
    background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
  }

  .detail-item {
    display: flex;
    align-items: center;
  }
}

.species-preview {
  .va-badge {
    font-size: 0.7rem !important;
  }
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
</style>
