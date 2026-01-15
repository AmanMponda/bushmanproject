<template>
  <div class="contracts-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Contracts Management</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <!-- @ts-expect-error: StandardDataTable uses non-typed props -->
            <StandardDataTable
              :columns="columns"
              :data="(contracts as any)"
              :loading="contractStore.loading"
              :filters="tableFilters"
              :default-page-size="tableFilters.pageSize"
              :disable-pagination="false"
              :show-date-filters="false"
              :action-buttons="pageActions"
              :custom-filters="customFilters"
              @update:filters="handleFiltersUpdate"
            >
              <template #contract_number="{ row }">
                <strong>{{ (row as any).contract_number || (row as any).id }}</strong>
              </template>
              <template #status="{ row }">
                <span :class="getStatusClass((row as any).status)">{{ (row as any).status }}</span>
              </template>
              <template #start_date="{ row }">
                {{ formatDate((row as any).start_date) }}
              </template>
              <template #title="{ row }">
                {{ (row as any).title }}
              </template>
              <template #contract_type="{ row }">
                <span class="badge-info">{{ getContractTypeName((row as any).contract_type_id) }}</span>
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-info btn-sm" title="View" @click="viewContract(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-success btn-sm" title="Download" @click="downloadContract(row)">
                    <i class="fa fa-download"></i>
                  </button>
                  <button class="btn btn-danger btn-sm" title="Delete" @click="deleteContract(row)">
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
</template>

<script setup lang="ts">
import { onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '@/stores/bushman/contract-store'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

interface Contract {
  id: number
  contract_number: string
  status: string
  start_date: string | null
  title: string
  contract_type_id: number
  [key: string]: any
}

const router = useRouter()
const contractStore = useContractStore()

// Computed state from store
const contracts = computed((): Contract[] => contractStore.contracts || [])
const contractTypes = computed(() => contractStore.contractTypes || [])

// Table filters state
const tableFilters = reactive({
  pageSize: 15,
  currentPage: 1,
  type: '',
  status: ''
})

// Columns Definition
const columns = computed(() => [
  { key: 'contract_number', label: 'Contract #', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'start_date', label: 'Start Date', sortable: true, visible: true },
  { key: 'title', label: 'Title', sortable: true, visible: true },
  { key: 'contract_type', label: 'Type', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

// Custom Filters
const customFilters = computed(() => [
  {
    key: 'type',
    label: 'Contract Type',
    type: 'select',
    options: [
      { label: 'All Types', value: '' },
      ...contractTypes.value.map((t: any) => ({ label: t.name, value: t.id }))
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All Status', value: '' },
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Signed', value: 'SIGNED' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Terminated', value: 'TERMINATED' }
    ]
  }
])

// Page Actions
const pageActions = computed(() => [
  { label: 'Create Contract', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => createContract() },
  { label: 'Download Contract', icon: 'fa fa-download', class: 'btn btn-success', method: () => downloadContracts() }
])

// Methods
const formatDate = (date: string) => {
  if (!date) return 'N/A'
  try {
    const parsed = new Date(date)
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const getContractTypeName = (typeId: number) => {
  const type = contractTypes.value.find((t: any) => t.id === typeId)
  return type?.name || 'Unknown'
}

const getStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'badge badge-secondary',
    'ACTIVE': 'badge badge-success',
    'SIGNED': 'badge badge-info',
    'COMPLETED': 'badge badge-primary',
    'TERMINATED': 'badge badge-danger'
  }
  return statusMap[status] || 'badge badge-secondary'
}

const handleFiltersUpdate = (filters: any) => {
  Object.assign(tableFilters, filters)
}

const createContract = () => {
  router.push({ name: 'contracts-create' })
}

const downloadContracts = () => {
  Swal.fire({
    icon: 'info',
    title: 'Download',
    text: 'Bulk download feature coming soon',
    confirmButtonColor: '#2563eb'
  })
}

const viewContract = (contract: any) => {
  router.push({ name: 'contracts-view', params: { id: contract.id } })
}

const downloadContract = (contract: any) => {
  Swal.fire({
    icon: 'info',
    title: 'Download',
    text: 'Download feature for contract coming soon',
    confirmButtonColor: '#2563eb'
  })
}

const deleteContract = async (contract: any) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Delete Contract?',
    text: `Are you sure you want to delete "${contract.contract_number}"?`,
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Cancel'
  })

  if (result.isConfirmed) {
    try {
      await contractStore.deleteContract(contract.id)
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Contract has been deleted.',
        confirmButtonColor: '#2563eb'
      })
      await contractStore.listContracts()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete contract',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

// Lifecycle
onMounted(() => {
  contractStore.listContracts()
  contractStore.fetchContractTypes()
})
</script>

<style scoped>
.badge-info {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #f0f0f0;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
