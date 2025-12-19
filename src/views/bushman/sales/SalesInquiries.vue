<template>
  <div class="sales-inquiries-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Sales Inquiries</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="!showAddSalesInquiriesForm">
      <!-- Sales Inquiries List View -->
      <template v-if="showDetailsPage === false">
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
                  @update:filters="handleFiltersUpdate"
                >
                  <template #client_name="{ row }">
                    {{ (row as any).name }}
                  </template>
                  <template #area="{ row }">
                    {{ (row as any).area }}
                  </template>
                  <template #hunting_type="{ row }">
                    {{ (row as any).hunting_type }}
                  </template>
                  <template #start_date="{ row }">
                    {{ formatDate((row as any).start_date) }}
                  </template>
                  <template #end_date="{ row }">
                    {{ formatDate((row as any).end_date) }}
                  </template>
                  <template #season="{ row }">
                    {{ (row as any).season || 'N/A' }}
                  </template>
                  <template #species_count="{ row }">
                    {{ (row as any).species_count || 0 }}
                  </template>
                  <template #status="{ row }">
                    {{ (row as any).status }}
                  </template>
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      <button class="btn btn-info btn-sm" title="View" @click="viewInquiries(row as any)">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Edit" @click="editInquiry(row as any)">
                        <i class="fa fa-pen"></i>
                      </button>
                      <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeleteInquiry(row as any)">
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
      <template v-else>
        <div class="price-list-details">
          <div class="row gx-4">
            <div class="col-lg-12">
              <div class="card">
                <!-- HEADER -->
                <div class="card-header d-flex align-items-center bg-white fw-400">
                  <div class="d-flex align-items-center">
                    <div class="vehicle-icon me-3">
                      <i class="fa fa-search fa-3x text-primary"></i>
                    </div>
                    <div>
                      <h4 class="mb-0">{{ selectedInquiryItem?.entity?.full_name || 'Sales Inquiry Details' }}</h4>
                      <small class="text-muted">
                        {{ selectedInquiryItem?.code || 'Sales Inquiry' }} •
                        {{ selectedInquiryItem?.season?.name || 'N/A' }}
                        <span
                          v-if="selectedInquiryItem?.inquiry_type"
                          :class="
                            selectedInquiryItem?.inquiry_type === 'standard'
                              ? 'badge bg-success ms-2'
                              : 'badge bg-info ms-2'
                          "
                        >
                          {{ selectedInquiryItem?.inquiry_type === 'standard' ? 'Standard' : 'Custom' }}
                        </span>
                      </small>
                    </div>
                  </div>

                  <div class="ms-auto d-flex align-items-center gap-2">
                    <button
                      class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill"
                      @click="handleGoBack"
                    >
                      <i class="fa fa-arrow-left me-1"></i> Back
                    </button>
                  </div>
                </div>

                <!-- Content -->
                <SalesInquiryDetails :item="selectedInquiryItem" @goBack="handleGoBack" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Create/Edit Form Wizard (extracted component) -->
    <SalesInquiryWizard
      v-if="showAddSalesInquiriesForm"
      :edit-row="editingRow"
      @cancel="handleWizardCancel"
      @saved="handleWizardSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'
import { useSalesInquiriesStore } from '@/stores/bushman/sales-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import SalesInquiryDetails from './salesinquiries/SalesInquiryDetails.vue'
import SalesInquiryWizard from './salesinquiries/SalesInquiryWizard.vue'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'


const { init } = useToast()
const salesStore = useSalesInquiriesStore()
const settingsStore = useSettingsStore()

// UI State
const showAddSalesInquiriesForm = ref(false)
const showDetailsPage = ref(false)
const selectedInquiryItem = ref<any>(null)
const editingRow = ref<any>(null)

// Table State
const dataFetched = ref<any[]>([])
const loading = ref(false)
const seasonsOptions = ref<any[]>([])

const columns = [
  { key: 'client_name', label: 'Client Name', sortable: true, visible: true },
  { key: 'area', label: 'Area', sortable: true, visible: true },
  { key: 'hunting_type', label: 'Hunting Type', sortable: true, visible: true },
  { key: 'start_date', label: 'Start Date', sortable: true, visible: true },
  { key: 'end_date', label: 'End Date', sortable: true, visible: true },
  { key: 'season', label: 'Season', sortable: true, visible: true },
  { key: 'species_count', label: 'Species', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
] as any[]

const tableFilters = reactive({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: '',
  season_id: '',
})

// Delete Modal State
const deleting = ref(false)

// Computed
const pageActions = computed(() => {
  const actions: any[] = []
  if (!showAddSalesInquiriesForm.value && !showDetailsPage.value) {
    actions.push({
      label: 'Create Enquiry',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => toggleAddSalesInquiriesForm(),
    })
    actions.push({
      label: 'Download PDF',
      icon: 'fa fa-download',
      class: 'btn btn-info',
      method: () => downloadAllInquiriesPdf(),
    })
  }
  return actions
})

const customFilters = computed(() => [
  {
    key: 'season_id',
    label: 'Season',
    type: 'select',
    placeholder: 'Select Season',
    options: seasonsOptions.value.map((opt: any) => ({ value: opt.value, label: opt.text })),
    defaultValue: '',
  },
])

// Methods
const toggleAddSalesInquiriesForm = () => {
  editingRow.value = null
  showAddSalesInquiriesForm.value = true
}

const handleGoBack = () => {
  showAddSalesInquiriesForm.value = false
  showDetailsPage.value = false
  editingRow.value = null
}

const handleWizardCancel = () => {
  showAddSalesInquiriesForm.value = false
  editingRow.value = null
}

const handleWizardSaved = () => {
  showAddSalesInquiriesForm.value = false
  editingRow.value = null
  getSalesInquiryList()
}

const formatDate = (dateString: string | any): string => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const viewInquiries = (row: any) => {
  showDetailsPage.value = true
  selectedInquiryItem.value = row.selfitem || row
}

const editInquiry = (row: any) => {
  editingRow.value = row
  showAddSalesInquiriesForm.value = true
}

const confirmDeleteInquiry = (row: any) => {
  Swal.fire({
    title: 'Confirm Delete',
    text: 'Are you sure you want to delete this sales inquiry?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d'
  }).then((result) => {
    if (result.isConfirmed) {
      deleteInquiry(row)  // only called if user confirms
    }
  })
}

const deleteInquiry = async (row: any) => {
  deleting.value = true
  try {
    const response: any = await salesStore.deleteSalesInquiry(row.id)

    if (response.status === 200 || response.status === 204) {
      // Show success alert
      Swal.fire({
        title: 'Deleted!',
        text: 'Inquiry deleted successfully',
        icon: 'success'
      })

      // Refresh the list
      getSalesInquiryList()
    }
  } catch (error: any) {
    console.error('Error deleting inquiry:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || 'Failed to delete inquiry',
      icon: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const handleFiltersUpdate = (filters: any) => {
  Object.assign(tableFilters, filters)
  getSalesInquiryList()
}

const getSalesInquiryList = async () => {
  loading.value = true
  try {
    const response: any = await salesStore.getSalesInquiries('', '')
    if (response.status === 200) {
      const dataArray = Array.isArray(response.data) ? response.data : response.data.data || []
      dataFetched.value = dataArray.map((item: any) => {
        const speciesCount = item?.inquiry_species?.length || item?.species?.length || 0
        const refPriceList = item?.reference_price_list
        const priceListData = item?.price_lists?.[0]?.price_list?.price_list_type
        const amount = refPriceList?.amount || priceListData?.amount || '0.00'
        const currencySymbol = priceListData?.currency?.symbol || '$'
        const areaName =
          refPriceList?.area_name || item?.inquiry_areas?.[0]?.area_name || item?.areas?.[0]?.area?.name || 'N/A'
        const huntingType = refPriceList?.hunting_type_name || priceListData?.hunting_type?.name || 'N/A'

        return {
          id: item.id,
          selfitem: item,
          name: item?.entity?.full_name || 'N/A',
          area: areaName,
          hunting_type: huntingType,
          price: `${currencySymbol}${parseFloat(amount).toFixed(2)}`,
          start_date: item?.formatted_preferences?.start_date || 'N/A',
          end_date: item?.formatted_preferences?.end_date || 'N/A',
          season: item?.season?.name || 'N/A',
          species_count: speciesCount,
          status: item?.status || 'PENDING',
        }
      })
    }
  } catch (error) {
    console.error('Error fetching sales inquiries:', error)
  } finally {
    loading.value = false
  }
}

const getSeasonList = async () => {
  try {
    const response = await settingsStore.getSeasons()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    seasonsOptions.value = response.data
      .filter((item: any) => {
        if (!item.end_at) return true
        const endDate = new Date(item.end_at)
        endDate.setHours(23, 59, 59, 999)
        return endDate >= today
      })
      .map((item: any) => ({ value: item.id, text: item.name, selfItem: item }))
  } catch (error) {
    console.log(error)
  }
}

const downloadAllInquiriesPdf = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}sales/sales-inquiries-pdf`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.data.success && response.data.pdf) {
      const pdfData = response.data.pdf
      const byteCharacters = atob(pdfData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sales-inquiries-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      init({ message: `PDF downloaded successfully. Total records: ${response.data.total_records}`, color: 'success' })
    } else {
      init({ message: 'Failed to generate PDF', color: 'danger' })
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
    init({ message: 'Error downloading PDF', color: 'danger' })
  }
}

onMounted(() => {
  getSeasonList()
  getSalesInquiryList()
})
</script>

<style scoped>
.price-list-details {
  max-width: 1400px;
  margin: 0 auto;
}

.price-list-details .card {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.price-list-details .card-header {
  background: #fff !important;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
  font-weight: 400;
}

.price-list-details .card-header .vehicle-icon i {
  font-size: 2.5rem;
}

.price-list-details .card-header h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.price-list-details .card-header small {
  font-size: 0.875rem;
  color: #6b7280;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;
}

.breadcrumb .breadcrumb-item {
  text-transform: uppercase !important;
}

.breadcrumb .breadcrumb-item::before {
  content: ' / ' !important;
  color: #9ca3af !important;
  padding: 0 0.5rem;
}

.breadcrumb .breadcrumb-item:first-child::before {
  display: none !important;
}

.breadcrumb .breadcrumb-item a {
  text-transform: uppercase !important;
  color: #374151 !important;
  font-weight: 600;
  text-decoration: none !important;
}

.breadcrumb .breadcrumb-item a:hover {
  color: #1f2937 !important;
  text-decoration: none !important;
}

.breadcrumb .breadcrumb-item.active {
  color: #9ca3af !important;
  font-weight: 400;
  text-transform: uppercase !important;
}
</style>
