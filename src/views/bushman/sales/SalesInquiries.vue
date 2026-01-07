<template>
  <div class="sales-inquiries-page">
    <!-- Customer Selection Page (shown first when creating new inquiry) -->
    <CustomerSelectionModal
      v-if="showCustomerModal"
      :edit-data="editingRow"
      @cancel="handleCustomerModalCancel"
      @proceed="handleCustomerModalProceed"
    />

    <!-- Create/Edit Form Wizard -->
    <SalesInquiryWizard
      v-else-if="showAddSalesInquiriesForm"
      :edit-row="editingRow"
      :customer-data="customerData"
      @cancel="handleWizardCancel"
      @saved="handleWizardSaved"
    />

    <!-- Main List and Details Views -->
    <template v-else>
      <!-- Breadcrumb -->
      <div class="d-flex align-items-center mb-3">
        <div>
          <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="#">Sales</a></li>
            <li class="breadcrumb-item active">Sales Inquiries</li>
          </ul>
        </div>
      </div>

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
                  <template #code="{ row }">
                    <strong>{{ (row as any).code }}</strong>
                  </template>
                  <template #date="{ row }">
                    {{ formatDate((row as any).date) }}
                  </template>
                  <template #client_name="{ row }">
                    {{ (row as any).client_name }}
                  </template>
                  <template #participants="{ row }">
                    {{ (row as any).participants }}
                  </template>
                  <template #start_date="{ row }">
                    {{ formatDate((row as any).start_date) }}
                  </template>
                  <template #days="{ row }">
                    {{ (row as any).days }}
                  </template>
                  <template #season="{ row }">
                    {{ (row as any).season || 'N/A' }}
                  </template>
                  <template #status="{ row }">
                    <span :class="getStatusClass((row as any).status)">
                      {{ (row as any).status }}
                    </span>
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
                <SalesInquiryDetails :item="selectedInquiryItem" @goBack="handleGoBack" @refresh="refreshSelectedInquiry" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import type { SalesEnquiry, EnquiryFilters } from '@/stores/bushman/salesEnquiry'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import SalesInquiryDetails from './salesinquiries/SalesInquiryDetails.vue'
import SalesInquiryWizard from './salesinquiries/SalesInquiryWizard.vue'
import CustomerSelectionModal from './salesinquiries/CustomerSelectionModal.vue'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'


const { init } = useToast()
const settingsStore = useSettingsStore()

// UI State
const showAddSalesInquiriesForm = ref(false)
const showCustomerModal = ref(false)
const showDetailsPage = ref(false)
const selectedInquiryItem = ref<SalesEnquiry | null>(null)
const editingRow = ref<any>(null)
const customerData = ref<any>(null)

// Table State
const dataFetched = ref<any[]>([])
const loading = ref(false)
const seasonsOptions = ref<any[]>([])

const columns = [
  { key: 'code', label: 'Enquiry Code', sortable: true, visible: true },
  { key: 'date', label: 'Date', sortable: true, visible: true },
  { key: 'client_name', label: 'Client', sortable: true, visible: true },
  { key: 'participants', label: 'Participants', sortable: true, visible: true },
  { key: 'start_date', label: 'Start Date', sortable: true, visible: true },
  { key: 'days', label: 'Days', sortable: true, visible: true },
  { key: 'season', label: 'Season', sortable: true, visible: true },
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
  customerData.value = null
  showCustomerModal.value = true  // Show customer modal first
}

const handleGoBack = () => {
  showAddSalesInquiriesForm.value = false
  showDetailsPage.value = false
  showCustomerModal.value = false
  editingRow.value = null
  customerData.value = null
}

const handleWizardCancel = () => {
  showAddSalesInquiriesForm.value = false
  editingRow.value = null
  customerData.value = null
}

const handleWizardSaved = () => {
  showAddSalesInquiriesForm.value = false
  editingRow.value = null
  customerData.value = null
  getSalesInquiryList()
}

const handleCustomerModalCancel = () => {
  showCustomerModal.value = false
  editingRow.value = null
  customerData.value = null
}

const handleCustomerModalProceed = (data: any) => {
  customerData.value = data
  showCustomerModal.value = false
  showAddSalesInquiriesForm.value = true  // Now show the wizard
}

const formatDate = (dateString: string | any): string => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return 'TZS 0'
  return `TZS ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    'NEW': 'badge bg-primary',
    'IN_PROGRESS': 'badge bg-warning text-dark',
    'COMPLETED': 'badge bg-success',
    'CANCELLED': 'badge bg-danger',
    'DRAFT': 'badge bg-secondary'
  }
  return statusMap[status] || 'badge bg-secondary'
}

const viewInquiries = (row: any) => {
  showDetailsPage.value = true
  selectedInquiryItem.value = row.selfitem || row
}

const refreshSelectedInquiry = async () => {
  // Refresh the selected inquiry data when pricings are updated
  if (selectedInquiryItem.value?.id) {
    try {
      const response = await salesEnquiryService.get(selectedInquiryItem.value.id)
      if (response.success && response.data) {
        // Update the selected item with fresh data
        selectedInquiryItem.value = response.data
      }
    } catch (error) {
      console.error('Error refreshing inquiry:', error)
    }
  }
}

const editInquiry = (row: any) => {
  editingRow.value = row
  // For editing, go directly to wizard since customer data already exists
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
    const response = await salesEnquiryService.delete(row.id)

    if (response.success) {
      // Show success alert
      Swal.fire({
        title: 'Deleted!',
        text: response.message || 'Inquiry deleted successfully',
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
    // Build filters from table filters
    const filters: EnquiryFilters = {
      search: tableFilters.search || undefined,
      season_id: tableFilters.season_id ? Number(tableFilters.season_id) : undefined,
      date_from: tableFilters.date_from || undefined,
      date_to: tableFilters.date_to || undefined,
    }

    const response = await salesEnquiryService.list(filters)
    if (response.success) {
      const dataArray = Array.isArray(response.data) ? response.data : []
      dataFetched.value = dataArray.map((item: SalesEnquiry) => {
        return {
          id: item.id,
          selfitem: item,
          code: item?.code || 'N/A',
          date: item?.date || 'N/A',
          client_name: item?.entity?.full_name || 'N/A',
          status: item?.status || 'NEW',
          participants: item?.preference?.no_of_participants || 0,
          start_date: item?.preference?.preferred_start_date || 'N/A',
          days: item?.preference?.no_of_days || 0,
          total_amount: item?.pricing_summary?.total_amount || 0,
          season: item?.season?.name || 'N/A',
        }
      })
    }
  } catch (error) {
    console.error('Error fetching sales inquiries:', error)
    init({ message: 'Failed to fetch sales inquiries', color: 'danger' })
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
    console.error(error)
  }
}

const downloadAllInquiriesPdf = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pdf`, {
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

  // Open enquiry details if an id was passed via sessionStorage (used to avoid exposing id in URL)
  try {
    const openId = sessionStorage.getItem('openEnquiryId')
    if (openId) {
      const id = Number(openId)
      if (Number.isFinite(id) && id > 0) {
        ;(async () => {
          try {
            const res = await salesEnquiryService.get(id)
            if (res && res.data) {
              selectedInquiryItem.value = res.data
              showDetailsPage.value = true
            }
          } catch (err) {
            console.error('Failed to open enquiry from session:', err)
          }
        })()
      }
      sessionStorage.removeItem('openEnquiryId')
    }
  } catch (e) {
    // ignore session storage errors
  }
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
