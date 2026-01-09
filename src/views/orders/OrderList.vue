<template>
  <div class="orders-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Orders Management</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <StandardDataTable
              :columns="columns"
              :data="orders"
              :loading="loading"
              :filters="tableFilters"
              :default-page-size="tableFilters.pageSize"
              :disable-pagination="false"
              :show-date-filters="false"
              :action-buttons="pageActions"
              :custom-filters="customFilters"
              @update:filters="handleFiltersUpdate"
            >
              <template #order_number="{ row }">
                <strong>{{ (row as any).order_number || (row as any).id }}</strong>
              </template>
              <template #type="{ row }">
                <span :class="getTypeClass((row as any).type)">{{ (row as any).type }}</span>
              </template>
              <template #status="{ row }">
                <span :class="getStatusClass((row as any).status)">{{ (row as any).status }}</span>
              </template>
              <template #order_date="{ row }">
                {{ formatDate((row as any).order_date || (row as any).date) }}
              </template>
              <template #customer_name="{ row }">
                {{ getCustomerName((row as any)) }}
              </template>
              <template #total_amount="{ row }">
                {{ formatCurrency((row as any).total_amount) }}
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-info btn-sm" title="View" @click="viewOrder(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-secondary btn-sm" title="Edit" @click="editOrder(row)">
                    <i class="fa fa-pen"></i>
                  </button>
                  <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)">
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
import { useOrderStore } from '@/stores/bushman/order-store'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const { init } = useToast()
const orderStore = useOrderStore()

// Computed state from store
const orders = computed(() => orderStore.orders)
const loading = computed(() => orderStore.loading)
const orderTypes = computed(() => orderStore.orderTypes)
const orderStatuses = computed(() => orderStore.orderStatuses)

// Table filters state
const tableFilters = reactive({
  pageSize: 15,
  currentPage: 1,
  type: '',
  status: ''
})

// Columns Definition
const columns = computed(() => [
  { key: 'order_number', label: 'Order #', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'order_date', label: 'Order Date', sortable: true, visible: true },
  { key: 'customer_name', label: 'Customer', sortable: true, visible: true },
  { key: 'total_amount', label: 'Total', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

// Custom Filters
const customFilters = computed(() => [
  {
    key: 'type',
    label: 'Order Type',
    type: 'select',
    options: [
      { label: 'All Types', value: '' },
      ...orderTypes.value.map((t: any) => ({ label: t.name, value: t.code || t.id }))
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All Status', value: '' },
      ...orderStatuses.value.map((s: any) => ({ label: s.name, value: s.code || s.id }))
    ]
  }
])

// Page Actions
const pageActions = computed(() => [
  { label: 'Create Order', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => createOrder() }
])

// Methods
const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A'
  try {
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'N/A'
    return parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const formatCurrency = (amount: number) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const getStatusClass = (status: string) => {
  const statusMap: any = {
    'DRAFT': 'badge bg-secondary',
    'PENDING': 'badge bg-warning',
    'CONFIRMED': 'badge bg-info',
    'FULFILLED': 'badge bg-success',
    'CANCELLED': 'badge bg-danger'
  }
  return statusMap[status] || 'badge bg-secondary'
}

const getTypeClass = (type: string) => {
  const typeMap: any = {
    'SALES': 'badge bg-primary',
    'PURCHASE': 'badge bg-success',
    'TRANSFER': 'badge bg-info'
  }
  return typeMap[type] || 'badge bg-secondary'
}

const getCustomerName = (order: any) => {
  // Get customer from order parties where role = 'CUSTOMER'
  if (order.parties && Array.isArray(order.parties)) {
    const customer = order.parties.find((p: any) => p.role === 'CUSTOMER' || p.party_role_id === 1)
    if (customer?.entity?.full_name) {
      return customer.entity.full_name
    }
  }
  // Fallback to entity name if available
  if (order.entity?.full_name) {
    return order.entity.full_name
  }
  return 'N/A'
}

const handleFiltersUpdate = (newFilters: any) => {
  orderStore.setFilters(newFilters)
  orderStore.listOrders()
}

const createOrder = () => {
  router.push({ name: 'orders-create' })
}

const editOrder = (row: any) => {
  router.push({ name: 'orders-edit', params: { id: row.id } })
}

const viewOrder = (row: any) => {
  router.push({ name: 'orders-view', params: { id: row.id } })
}

const confirmDelete = (row: any) => {
  Swal.fire({
    title: 'Delete Order?',
    text: `Are you sure you want to delete order #${row.order_number}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await orderStore.deleteOrder(row.id)
        init('Order deleted successfully', 'success')
      } catch (e: any) {
        init(e?.response?.data?.message || 'Error deleting order', 'error')
      }
    }
  })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    orderStore.fetchOrderTypes(),
    orderStore.fetchOrderStatuses()
  ])
  await orderStore.listOrders()
})
</script>

<style scoped>
.orders-page {
  width: 100%;
}

.breadcrumb {
  margin-bottom: 1rem;
  padding: 0;
}

.panel {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Badge Styling */
.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.d-flex.gap-1 {
  gap: 0.25rem;
}
</style>

