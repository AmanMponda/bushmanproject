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
            <!-- @ts-expect-error: StandardDataTable uses non-typed props -->
            <StandardDataTable
              :columns="columns"
              :data="(orders as any)"
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
                {{ formatCurrency(calculateTotalAmount((row as any))) }}
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-info btn-sm" title="View" @click="viewOrder(row)">
                    <i class="fa fa-eye"></i>
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

interface Order {
  id: string | number
  order_number: string
  status: string
  order_date: string | null
  date?: string
  customer_name?: string
  total_amount: number
  type?: string
  parties?: any[]
  items?: any[]
  participants?: any[]
  logistics?: any[]
  entity?: any
  [key: string]: any
}

const router = useRouter()
const { init } = useToast()
const orderStore = useOrderStore()

// Computed state from store
const orders = computed((): Order[] => orderStore.orders)
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
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'order_date', label: 'Order Date', sortable: true, visible: true },
  { key: 'customer_name', label: 'Entity Name', sortable: true, visible: true },
  { key: 'total_amount', label: 'Total Amount', sortable: true, visible: true },
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
    'SUBMITTED': 'badge bg-info',
    'APPROVED': 'badge bg-success',
    'CONFIRMED': 'badge bg-success',
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
  // First check if entity_name is directly on the order object (from API response)
  if (order.entity_name && order.entity_name !== 'N/A') {
    return order.entity_name
  }
  
  // Get customer from order parties
  if (order.parties && Array.isArray(order.parties)) {
    // Try to find party with 'CUSTOMER' role first (most common)
    let customer = order.parties.find((p: any) => p.role === 'CUSTOMER' || p.role === 'CLIENT')
    
    // If not found, try case-insensitive search
    if (!customer) {
      customer = order.parties.find((p: any) => 
        p.role?.toUpperCase?.() === 'CUSTOMER' || p.role?.toUpperCase?.() === 'CLIENT'
      )
    }
    
    // If still not found, just use the first party
    if (!customer && order.parties.length > 0) {
      customer = order.parties[0]
    }
    
    if (customer) {
      // Check entity.full_name first (if entity relationship is loaded)
      if (customer.entity?.full_name) {
        return customer.entity.full_name
      }
      // Fallback to entity_name if available
      if (customer.entity_name) {
        return customer.entity_name
      }
      // Fallback to contact_name if no entity info
      if (customer.contact_name) {
        return customer.contact_name
      }
    }
  }
  
  // Fallback to order entity name if available
  if (order.entity?.full_name) {
    return order.entity.full_name
  }
  
  return 'N/A'
}

const calculateTotalAmount = (order: any): number => {
  // First, use grand_total if set (includes items + logistics + charges - discount)
  if (order.grand_total && Number(order.grand_total) > 0) {
    return Number(order.grand_total)
  }

  // Second, use the total_amount if already calculated by backend
  if (order.total_amount && Number(order.total_amount) > 0) {
    return Number(order.total_amount)
  }

  // Calculate from items, logistics, charges, discount
  let itemsSubtotal = 0
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    itemsSubtotal = order.items.reduce((sum: number, item: any) => {
      const qty = Number(item.quantity) || 0
      const rate = Number(item.rate) || Number(item.unit_price) || Number(item.price) || 0
      const lineTotal = Number(item.line_total) || Number(item.total) || Number(item.amount) || (qty * rate)
      return sum + lineTotal
    }, 0)
  }

  // Add logistics
  let logisticsTotal = 0
  if (order.logistics && Array.isArray(order.logistics)) {
    logisticsTotal = order.logistics.reduce((sum: number, l: any) => {
      return sum + (Number(l.estimated_amount) || Number(l.amount) || 0)
    }, 0)
  }

  // VAT on items only
  const vatPct = Number(order.vat) || 0
  const vatAmount = Math.round((vatPct / 100) * itemsSubtotal * 100) / 100

  // Expense included
  const expenseIncluded = Number(order.expense_included) || 0

  const grandTotal = itemsSubtotal + logisticsTotal + vatAmount + expenseIncluded

  return grandTotal > 0 ? grandTotal : 0
}

const handleFiltersUpdate = (newFilters: any) => {
  orderStore.setFilters(newFilters)
  orderStore.listOrders()
}

const createOrder = () => {
  router.push({ name: 'orders-create' })
}

const editOrder = (row: any) => {
  // Try to get numeric ID first, then try order_number
  let orderId = row.id
  if (!orderId || typeof orderId !== 'number') {
    // Try to extract numeric ID from order_number if it's missing
    // As a last resort, we may need to fetch the order first
    if (row.order_number) {
      init({ message: 'Error: Order ID not available. Please refresh the page.', color: 'warning' })
      return
    }
  }
  router.push({ name: 'orders-edit', params: { id: orderId } })
}

const viewOrder = (row: any) => {
  // Try to get numeric ID first
  let orderId = row.id
  if (!orderId || typeof orderId !== 'number') {
    init({ message: 'Error: Order ID not available. Please refresh the page.', color: 'warning' })
    return
  }
  router.push({ name: 'orders-view', params: { id: orderId } })
}

const confirmDelete = (row: any) => {
  // Must have numeric ID to delete
  const orderId = row.id
  
  if (!orderId || typeof orderId !== 'number') {
    init({ message: 'Error: Order ID not available. Please refresh the page.', color: 'danger' })
    return
  }

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
        await orderStore.deleteOrder(orderId)
        init({ message: 'Order deleted successfully', color: 'success' })
        await orderStore.listOrders()
      } catch (e: any) {
        init({ message: e?.response?.data?.message || 'Error deleting order', color: 'danger' })
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

