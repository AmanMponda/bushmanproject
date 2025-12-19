<template>
  <div class="price-list-page">
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
                <StandardDataTable
                  :columns="columns"
                  :data="dataFetched"
                  :loading="loading"
                  :filters="tableFilters"
                  :default-page-size="tableFilters.pageSize"
                  :disable-pagination="false"
                  :show-date-filters="false"
                  :action-buttons="pageActions"
                  :custom-filters="customFilters"
                  :selectable="true"
                  @update:filters="handleFiltersUpdate"
                  @selectionChange="handleSelectionChange"
                >
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
                    {{ (row as any).amount }}
                  </template>
                  <template #duration="{ row }"> {{ (row as any).duration }} Days </template>
                  <template #season_name="{ row }">
                    {{ (row as any).season_name || 'N/A' }}
                  </template>
                  <template #species_count="{ row }">
                    {{ (row as any).species_count || 0 }}
                  </template>
                  <template #status="{ row }">
                    {{ (row as any).status }}
                  </template>
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      <button class="btn btn-info btn-sm" title="View" @click="toggleShowPriceListMethod(row as any)">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button 
                        type="button"
                        class="btn btn-danger btn-sm" 
                        title="Delete" 
                        @click.stop="confirmDelete(row)"
                      >
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
        <PricesListDetails
          :price-list-item="item"
          :pdf-data="individualPriceListPdf"
          @goBack="goBack"
          @edit="handleEditFromDetails"
          @delete="handleDeleteFromDetails"
        ></PricesListDetails>
      </template>

      <!-- Edit Form -->
      <template v-else-if="showEditForm">
        <CreatePricesListForm
          :edit-mode="true"
          :edit-item="editItem"
          @saved="onEditSaved"
          @goBack="goBack"
        ></CreatePricesListForm>
      </template>
    </template>

    <!-- Create Form -->
    <template v-if="ShowCreateNewPriceListForm">
      <CreatePricesListForm @goBack="goBack"></CreatePricesListForm>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - Template slot type errors from StandardDataTable component
import { ref, onMounted, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import Swal from 'sweetalert2'
import PricesListDetails from '../sales/components/PricesList/PriceListDetails.vue'
import { usePriceListStore } from '../../../stores/bushman/price-list-store'
import CreatePricesListForm from '../sales/components/PricesList/CreatePricesListForm.vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import downloadPdf from '../../../stores/bushman/pdfDownloader'
import handleErrors from '../../../stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

// Constants
const columns = [
  { key: 'package_name', label: 'Package Name', sortable: true, visible: true },
  { key: 'area', label: 'Area', sortable: true, visible: true },
  { key: 'hunting_type', label: 'Hunting Type', sortable: true, visible: true },
  { key: 'amount', label: 'Price', sortable: true, visible: true },
  { key: 'duration', label: 'Duration', sortable: true, visible: true },
  { key: 'season_name', label: 'Season', sortable: true, visible: true },
  { key: 'species_count', label: 'Species', sortable: true, visible: true },
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
const loadingSeasons = ref(false)
const huntingTypeValue = ref<any>(null)
const areaValue = ref<any>(null)
const seasonValue = ref<any>(null)
const minAmount = ref<any>(null)
const maxAmount = ref<any>(null)
const poriceListPdf = ref<any>('')
const individualPriceListPdf = ref<any>('')
const downloadingPdf = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<any>(null)
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

  try {
    const response = await priceListStore.getPriceListById(priceListId)
    item.value = response.data.data || response.data
    individualPriceListPdf.value = response.data.pdf || ''
    showPriceList.value = false
  } catch (error) {
    console.error('Error fetching price list detail:', error)
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
    toast?.init({ message: 'Failed to download PDF', color: 'danger' })
  } finally {
    downloadingPdf.value = false
  }
}

const goBack = () => {
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

  const packageName = item.value.sales_package?.name || 'this price list'
  
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

  if (result.isConfirmed) {
    deleting.value = true
    try {
      await handleDeletePriceList({
        id: item.value.id,
        package_name: packageName,
      })
      // Go back to list view after deletion
      if (!showPriceList.value) {
        showPriceList.value = true
        item.value = null
      }
    } finally {
      deleting.value = false
    }
  }
}

const confirmDelete = async (itemData: any) => {
  if (!itemData) {
    console.error('No itemData provided')
    return
  }

  if (!itemData.id) {
    console.error('ItemData missing id:', itemData)
    toast?.init({ message: 'Invalid item data - missing ID', color: 'danger' })
    return
  }

  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${itemData.package_name || 'this item'}"? This action cannot be undone!`,
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
    
    if (result.isConfirmed) {
      deleting.value = true
      try {
        await handleDeletePriceList(itemData)
      } finally {
        deleting.value = false
      }
    }
  } catch (error: any) {
    console.error('Error in confirmDelete:', error)
    toast?.init({ message: 'An error occurred while trying to delete', color: 'danger' })
  }
}

async function handleDeletePriceList(itemData: any) {
  deleting.value = true
  try {
    const response = await priceListStore.deletePriceList(itemData.id, true)
    if (response.status === 200 || response.status === 204) {
      toast?.init({ message: 'Price list deleted successfully', color: 'success' })
      // Go back to list view after deletion if we were in detail view
      if (!showPriceList.value) {
        showPriceList.value = true
        item.value = null
      }
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
        items.value = dataArray.map((item: any) => ({
          id: item.id,
          package_name: item.package_name,
          area: item.area,
          area_package: item.area_package,
          hunting_type: item.hunting_type,
          amount: item.amount,
          duration: item.duration,
          status: item.status,
          start_date: item.start_date,
          end_date: item.end_date,
          season_id: item.season_id,
          season_name: item.season_name,
          species_count: item.species_count,
          species: item.species || [],
          companion_hunter_costs: item.companion_hunter_costs || [],
        }))
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
