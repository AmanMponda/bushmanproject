<template>
  <div class="sales-confirmation-proposals-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Sales Confirmation Proposals</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <!-- Table View -->
    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div v-if="!loading && dataFetched.length === 0" class="empty-state-message text-center py-5">
              <i class="fa fa-inbox fa-3x text-muted mb-3"></i>
              <p class="text-muted">No confirmed or completed deals found</p>
              <button class="btn btn-primary btn-sm" @click="loadConfirmations">
                <i class="fa fa-refresh me-1"></i> Refresh
              </button>
            </div>
            <StandardDataTable
              v-else
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
                {{ (row as any).code }}
              </template>
              <template #client="{ row }">
                {{ (row as any).client }}
              </template>
              <template #season="{ row }">
                {{ (row as any).season }}
              </template>
              <template #area="{ row }">
                {{ (row as any).area }}
              </template>
              <template #dates="{ row }">
                {{ (row as any).dates }}
              </template>
              <template #amount="{ row }">
                {{ (row as any).amount }}
              </template>
              <template #status="{ row }">
                <span class="badge" :class="'bg-' + getStatusColor((row as any).status)">
                  {{ formatStatus((row as any).status) }}
                </span>
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-info btn-sm" title="View Details" @click="viewDetails((row as any).selfitem)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button
                    v-if="(row as any).status === 'confirmed'"
                    class="btn btn-success btn-sm"
                    title="Complete"
                    @click="markAsCompleted((row as any).selfitem)"
                  >
                    <i class="fa fa-check"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProposalStore } from '@/stores/bushman/proposal-store'
import { useToast } from '@/composables/useToast'
import axios from 'axios'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const router = useRouter()
const { init: toastInit } = useToast()
const proposalStore = useProposalStore()
const { pipeline, pipelineCounts, currentProposal, loading } = storeToRefs(proposalStore)
const { fetchPipeline, fetchProposalById, updateProposalStatus, clearCurrentProposal } = proposalStore

// State
const searchText = ref('')
const seasonFilter = ref<number | null>(null)
const statusFilter = ref<string | null>(null)
const seasonOptions = ref<{ value: number; text: string }[]>([])
const confirmations = ref<any[]>([])
const dataFetched = ref<any[]>([])

const statusFilterOptions = [
  { value: 'confirmed', text: 'Confirmed' },
  { value: 'completed', text: 'Completed' },
]

const columns = [
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'client', label: 'Client', sortable: true, visible: true },
  { key: 'season', label: 'Season', sortable: true, visible: true },
  { key: 'area', label: 'Area', sortable: true, visible: true },
  { key: 'dates', label: 'Dates', sortable: true, visible: true },
  { key: 'amount', label: 'Amount', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const tableFilters = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  season_id: '',
  status: '',
})

// Computed
const counts = computed(() => 
  pipelineCounts.value || {
    new_inquiries: 0,
    pending: 0,
    provision_sales: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  }
)

const allConfirmations = computed(() => {
  const confirmed = pipeline.value?.confirmed || []
  const completed = pipeline.value?.completed || []
  return [...confirmed, ...completed]
})

const filteredConfirmations = computed(() => {
  let items = allConfirmations.value

  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    items = items.filter((item: any) => {
      return (
        item.code?.toLowerCase().includes(search) ||
        item.client?.full_name?.toLowerCase().includes(search) ||
        item.hunting_details?.areas?.toLowerCase().includes(search) ||
        item.hunting_details?.season?.toLowerCase().includes(search)
      )
    })
  }

  if (statusFilter.value) {
    items = items.filter((item: any) => item.stage === statusFilter.value)
  }

  return items
})

const totalConfirmations = computed(() => 
  (pipelineCounts.value?.confirmed || 0) + (pipelineCounts.value?.completed || 0)
)

const pageActions = computed(() => [
  {
    label: 'Refresh',
    icon: 'fa fa-refresh',
    class: 'btn btn-secondary',
    method: () => loadConfirmations(),
  },
])

const customFilters = computed(() => [
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
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Select Status',
    options: statusFilterOptions.map((opt: any) => ({
      value: opt.value,
      label: opt.text,
    })),
    defaultValue: '',
  },
])

// Methods
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatStatus = (stage: string): string => {
  if (!stage) return 'Unknown'
  return stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')
}

const getStatusColor = (stage: string): string => {
  switch (stage) {
    case 'confirmed':
      return 'success'
    case 'completed':
      return 'primary'
    default:
      return 'secondary'
  }
}

const getStatusIcon = (stage: string): string => {
  switch (stage) {
    case 'confirmed':
      return 'check_circle'
    case 'completed':
      return 'task_alt'
    default:
      return 'help'
  }
}

const formatDataForTable = () => {
  const items = allConfirmations.value || []
  dataFetched.value = items.map((item: any) => {
    return {
      id: item.id || item.proposal_id || item.confirmation_id,
      selfitem: item,
      code: item.code || 'N/A',
      client: item.client?.full_name || 'N/A',
      season: item.hunting_details?.season || 'N/A',
      area: item.hunting_details?.areas || 'N/A',
      dates: `${formatDate(item.hunting_details?.start_date)} to ${formatDate(
        item.hunting_details?.end_date,
      )}`,
      amount: formatCurrency(item.total_amount),
      status: item.stage || 'N/A',
    }
  })
}

const loadConfirmations = async () => {
  try {
    await fetchPipeline(undefined, seasonFilter.value || undefined)
  } catch (error) {
    console.error('Error loading confirmations:', error)
    toastInit({
      message: 'Failed to load confirmations',
      color: 'danger',
    })
  }
}

const loadSeasons = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/seasons`
    const response = await axios.get(url)
    if (response.data) {
      const seasons = Array.isArray(response.data) ? response.data : response.data.data || []
      seasonOptions.value = seasons.map((s: any) => ({
        value: s.id,
        text: s.name,
      }))
    }
  } catch (error) {
    console.error('Error loading seasons:', error)
  }
}

const viewDetails = async (item: any) => {
  try {
    const proposalId = item.proposal_id || item.confirmation_id || item.id
    if (proposalId) {
      router.push({
        name: 'pipeline-item-view',
        params: { id: proposalId.toString() },
        query: { type: 'proposal' },
      })
    } else {
      toastInit({
        message: 'No details found for this item',
        color: 'warning',
      })
    }
  } catch (error) {
    toastInit({
      message: 'Failed to load details',
      color: 'danger',
    })
  }
}

const markAsCompleted = async (item: any) => {
  try {
    const proposalId = item.proposal_id || item.confirmation_id
    if (proposalId) {
      await updateProposalStatus(proposalId, 'completed')
      toastInit({
        message: 'Marked as completed successfully',
        color: 'success',
      })
      loadConfirmations()
    }
  } catch (error) {
    toastInit({
      message: 'Failed to update status',
      color: 'danger',
    })
  }
}

const handleStatusChange = async (data: { id: number; status: string }) => {
  try {
    await updateProposalStatus(data.id, data.status)
    toastInit({
      message: `Status changed to ${data.status}`,
      color: 'success',
    })
    await fetchProposalById(data.id)
    loadConfirmations()
  } catch (error) {
    toastInit({
      message: 'Failed to update status',
      color: 'danger',
    })
  }
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
  if (filters.season_id !== undefined) {
    seasonFilter.value = filters.season_id || null
    loadConfirmations()
  }
  if (filters.status !== undefined) {
    statusFilter.value = filters.status || null
    formatDataForTable()
  }
}

// Watchers
watch(
  allConfirmations,
  () => {
    nextTick(() => {
      formatDataForTable()
    })
  },
  { deep: true, immediate: true }
)

watch(statusFilter, () => {
  nextTick(() => {
    formatDataForTable()
  })
})

// Lifecycle
onMounted(() => {
  loadConfirmations()
  loadSeasons()
})
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state-message {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.client-cell {
  line-height: 1.3;
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
  .badge,
  .va-chip {
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
