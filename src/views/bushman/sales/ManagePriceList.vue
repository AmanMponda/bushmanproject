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
    <div v-if="!ShowCreateNewPriceListForm">
      <!-- Price List View -->
      <div v-if="showPriceList">
        <div class="row layout-top-spacing bg-white rounded">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
            <div class="panel br-6 p-0">
              <div class="custom-table p-3">
                <StandardDataTable :columns="columns" :data="dataFetched" :loading="loading" :filters="tableFilters"
                  :default-page-size="tableFilters.pageSize" :disable-pagination="false" :show-date-filters="false"
                  :action-buttons="pageActions" :custom-filters="customFilters" :selectable="true"
                  @update:filters="handleFiltersUpdate" @selectionChange="handleSelectionChange">
                  <template #start_date="{ row }">{{ formatDateShort((row as any).start_date) }}</template>
                  <template #end_date="{ row }">{{ formatDateShort((row as any).end_date) }}</template>
                  <template #area="{ row }">{{ (row as any).area }}</template>
                  <template #is_active="{ row }">
                    <span :class="(row as any).is_active ? 'badge bg-success' : 'badge bg-secondary'">{{ (row as any).is_active ? 'Active' : 'Inactive' }}</span>
                  </template>
                  <template #items_count="{ row }">{{ (row as any).items_count }}</template>
                  <template #companion="{ row }">{{ (row as any).companion }}</template>
                  <template #observer="{ row }">{{ (row as any).observer }}</template>
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
      </div>

      <!-- Detail View -->
      <div v-else-if="showStructureDetails">
        <PriceStructureDetails :id="selectedStructureId" :initial-view="initialView" @go-back="goBackToStructures" />
      </div>

      <!-- Edit Form -->
      <div v-else-if="showEditForm">
        <CreatePricesListForm :edit-mode="true" :edit-item="editItem" @saved="onEditSaved" @goBack="goBack">
        </CreatePricesListForm>
      </div>
    </div>

    <!-- Create Form -->
    <template v-if="ShowCreateNewPriceListForm">
      <CreatePricesListForm :structure-only="createStructureMode" @goBack="goBack" @saved="onCreateSaved"></CreatePricesListForm>
    </template>
  </div>

  <!-- Delete Confirmation Modal -->

</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../../../composables/useToast.ts'
import PricesListDetails from './PriceListDetails.vue'
import { usePriceListStore } from '../../../stores/bushman/price-list-store.ts'
import CreatePricesListForm from './CreatePricesListForm.vue'
// New: Price Structures
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import PriceStructureDetails from './price-structures/PriceStructureDetails.vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import downloadPdf from '../../../stores/bushman/pdfDownloader.ts'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

// Constants
const columns = [
  { key: 'start_date', label: 'Start Date', sortable: true, visible: true },
  { key: 'end_date', label: 'End Date', sortable: true, visible: true },
  { key: 'area', label: 'Area', sortable: true, visible: true },
  { key: 'is_active', label: 'Active', sortable: true, visible: true },
  { key: 'items_count', label: 'price Items', sortable: false, visible: true },
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
// initial view for PriceStructureDetails (items|prices)
const initialView = ref<'items'|'prices'>('items')
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

const formatDateShort = (isoDate?: string | null) => {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (e) { return isoDate || '' }
}

// Stores
const priceListStore = usePriceListStore()
const priceStructuresStore = usePriceStructuresStore()
const quotaStore = useQuotaStore()
const settingsStore = useSettingsStore()

// route
const route = useRoute()

// Price Structures state
const showPriceStructuresOnly = ref(true)
const showStructureDetails = ref(false)
const selectedStructureId = ref<number | null>(null)
const createStructureMode = ref(false)

const pageActions = computed(() => {
  const actions = []
  if (showPriceList.value && !ShowCreateNewPriceListForm.value && !showEditForm.value) {
    actions.push({
      label: 'Add Price Structure',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => showCreateNewPriceListFormMethod(true),
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
  const id = rowData?.id
  if (!id) return

  // Open price structure details view
  selectedStructureId.value = id
  showPriceList.value = false
  showStructureDetails.value = true
}

// Handle route query param to open a specific structure and optionally select a view
const handleRouteQuery = (query: any) => {
  const structureId = query?.structureId || query?.structureID || query?.id
  const view = query?.view
  if (structureId) {
    selectedStructureId.value = Number(structureId)
    showPriceList.value = false
    showStructureDetails.value = true
    // Set local initialView instead of touching window inside template
    initialView.value = view === 'prices' ? 'prices' : 'items'
  }
}

// Watch route query for incoming instructions
onMounted(() => {
  handleRouteQuery(route.query)
})

watch(() => route.query, (q) => {
  handleRouteQuery(q)
})

const goBackToStructures = () => {
  showStructureDetails.value = false
  showPriceList.value = true
  selectedStructureId.value = null
  getPriceLists()
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
  createStructureMode.value = false
  getPriceLists()
}

const showCreateNewPriceListFormMethod = (structureOnly = false) => {
  ShowCreateNewPriceListForm.value = true
  showPriceList.value = false
  showEditForm.value = false
  createStructureMode.value = structureOnly
}

const onCreateSaved = () => {
  // Reset the create state and refresh the list
  ShowCreateNewPriceListForm.value = false
  createStructureMode.value = false
  showPriceList.value = true
  // Show success SweetAlert to reward the user
  Swal.fire({
    title: 'Price Structure Created',
    text: 'The price structure was created successfully.',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  })
  getPriceLists()
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
    // Use price structures delete when listing price structures
    const response = await priceStructuresStore.remove(itemData.id)
    if (response.status === 200 || response.status === 204) {
      toast?.init({ message: 'Price structure deleted successfully', color: 'success' })
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
    // Fetch price structures from the new store
    const response = await priceStructuresStore.list()

    if (response.status === 200) {
      const raw = response?.data
      const dataArray = Array.isArray(raw) ? raw : (raw?.data ?? [])

      printableDataList.value = raw

      if (Array.isArray(dataArray)) {
        items.value = dataArray.map((it: any) => {
          return {
            id: it.id,
            start_date: it.start_date,
            end_date: it.end_date,
            area: it.area || it.area_name || (it.area_object?.name || ''),
            is_active: !!it.is_active,
            items_count: Array.isArray(it.items) ? it.items.length : 0,
            companion: (it.companion_hunter_prices && it.companion_hunter_prices.length) || (it.companion_hunter_costs && it.companion_hunter_costs.length) ? 'Yes' : '',
            observer: (it.observer_hunter_prices && it.observer_hunter_prices.length) ? 'Yes' : '',
            raw: it, // keep original payload for details
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
