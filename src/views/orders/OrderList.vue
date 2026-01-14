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
                  <button class="btn btn-success btn-sm" title="Download PDF" @click="downloadOrderPdf(row)">
                    <i class="fa fa-download"></i>
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
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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
  { label: 'Create Order', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => createOrder() },
  { label: 'Download Order', icon: 'fa fa-download', class: 'btn btn-success', method: () => downloadSelectedOrder() }
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
  // First, use the total_amount if already calculated by backend
  if (order.total_amount && order.total_amount > 0) {
    return order.total_amount
  }

  // If items exist with quantity/rate data, calculate from them
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    const subtotal = order.items.reduce((sum: number, item: any) => {
      return sum + ((item.quantity || 0) * (item.rate || 0))
    }, 0)

    const totalDiscount = order.items.reduce((sum: number, item: any) => {
      return sum + (item.discount_amount || 0)
    }, 0)

    const afterDiscount = subtotal - totalDiscount
    const vat = afterDiscount * ((order.vat || 0) / 100)
    const grandTotal = afterDiscount + vat + (order.expense_included || 0)

    return grandTotal > 0 ? grandTotal : 0
  }

  // No items - order is empty
  return 0
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

const downloadOrderPdf = (row: any) => {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPos = margin
    
    // Header Background (Blue)
    doc.setFillColor(13, 110, 253) // Bootstrap primary blue
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('Arial', 'bold')
    doc.text('ORDER', margin, 18)
    
    // Subtitle
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(10)
    doc.text(`Order #${row.order_number || row.id}`, margin, 28)
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
    yPos = 50
    
    // Left column - Order Info
    doc.setFontSize(9)
    doc.setFont('Arial', 'bold')
    doc.setTextColor(13, 110, 253)
    doc.text('ORDER INFORMATION', margin, yPos)
    
    yPos += 8
    doc.setFont('Arial', 'normal')
    doc.setTextColor(0, 0, 0)
    
    const orderInfo = [
      { label: 'Order Date:', value: row.order_date || row.date || 'N/A' },
      { label: 'Order Type:', value: row.type || 'N/A' },
      { label: 'Status:', value: row.status || 'N/A' },
      { label: 'Customer:', value: getCustomerName(row) }
    ]
    
    orderInfo.forEach((info) => {
      doc.setFont('Arial', 'bold')
      doc.text(info.label, margin, yPos)
      doc.setFont('Arial', 'normal')
      doc.text(String(info.value), margin + 50, yPos)
      yPos += 6
    })
    
    yPos += 5
    
    // Items Section
    if (row.items && Array.isArray(row.items) && row.items.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }
      
      doc.setFontSize(9)
      doc.setFont('Arial', 'bold')
      doc.setTextColor(13, 110, 253)
      doc.text('ORDER ITEMS', margin, yPos)
      
      yPos += 8
      
      const itemTableData = row.items.map((item: any) => [
        item.name || 'N/A',
        item.category || 'N/A',
        String(item.quantity || 0),
        formatCurrency(item.rate || 0),
        formatCurrency(item.amount || 0)
      ])
      
      ;(doc as any).autoTable({
        startY: yPos,
        head: [['Item Name', 'Category', 'Qty', 'Unit Amount', 'Total']],
        body: itemTableData,
        theme: 'grid',
        margin: margin,
        styles: { fontSize: 8, cellPadding: 3, lineColor: 200, lineWidth: 0.5 },
        headStyles: { 
          fillColor: 13, 
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold', fillColor: 245 }
        }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 8
    }
    
    // Parties Section
    if (row.parties && Array.isArray(row.parties) && row.parties.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }
      
      doc.setFontSize(9)
      doc.setFont('Arial', 'bold')
      doc.setTextColor(13, 110, 253)
      doc.text('PARTIES', margin, yPos)
      
      yPos += 8
      
      const partiesTableData = row.parties.map((party: any) => [
        party.role || 'N/A',
        party.entity_name || party.entity || 'N/A',
        party.contact_person || 'N/A',
        party.contact_phone || 'N/A'
      ])
      
      ;(doc as any).autoTable({
        startY: yPos,
        head: [['Role', 'Entity Name', 'Contact Person', 'Phone']],
        body: partiesTableData,
        theme: 'grid',
        margin: margin,
        styles: { fontSize: 8, cellPadding: 3, lineColor: 200, lineWidth: 0.5 },
        headStyles: { 
          fillColor: 13, 
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'left'
        }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 8
    }
    
    // Participants Section
    if (row.participants && Array.isArray(row.participants) && row.participants.length > 0) {
      const filteredParticipants = row.participants.filter((p: any) => p.party_type !== 'STAFF')
      
      if (filteredParticipants.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = margin
        }
        
        doc.setFontSize(9)
        doc.setFont('Arial', 'bold')
        doc.setTextColor(13, 110, 253)
        doc.text('PARTICIPANTS', margin, yPos)
        
        yPos += 8
        
        const participantsTableData = filteredParticipants.map((participant: any) => [
          participant.party_type || 'N/A',
          String(participant.count || 0)
        ])
        
        ;(doc as any).autoTable({
          startY: yPos,
          head: [['Type', 'Count']],
          body: participantsTableData,
          theme: 'grid',
          margin: margin,
          styles: { fontSize: 8, cellPadding: 3, lineColor: 200, lineWidth: 0.5 },
          headStyles: { 
            fillColor: 13, 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'left'
          },
          columnStyles: { 1: { halign: 'center' } }
        })
        
        yPos = (doc as any).lastAutoTable.finalY + 8
      }
    }
    
    // Logistics Section
    if (row.logistics && Array.isArray(row.logistics) && row.logistics.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }
      
      doc.setFontSize(9)
      doc.setFont('Arial', 'bold')
      doc.setTextColor(13, 110, 253)
      doc.text('LOGISTICS & ACCOMMODATION', margin, yPos)
      
      yPos += 8
      
      const logisticsTableData = row.logistics.map((log: any) => [
        log.description || 'N/A',
        String(log.quantity || 0),
        formatCurrency(log.unit_amount || 0),
        formatCurrency(log.total_amount || 0)
      ])
      
      ;(doc as any).autoTable({
        startY: yPos,
        head: [['Description', 'Qty', 'Unit Amount', 'Total Amount']],
        body: logisticsTableData,
        theme: 'grid',
        margin: margin,
        styles: { fontSize: 8, cellPadding: 3, lineColor: 200, lineWidth: 0.5 },
        headStyles: { 
          fillColor: 13, 
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold', fillColor: 245 }
        }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 8
    }
    
    // Summary Section
    if (row.items && Array.isArray(row.items) && row.items.length > 0) {
      const totalAmount = calculateTotalAmount(row)
      if (totalAmount > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage()
          yPos = margin
        }
        
        yPos += 5
        doc.setDrawColor(13, 110, 253)
        doc.setLineWidth(1)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        
        yPos += 8
        doc.setFontSize(12)
        doc.setFont('Arial', 'bold')
        doc.setTextColor(13, 110, 253)
        doc.text('TOTAL AMOUNT', margin, yPos)
        doc.text(formatCurrency(totalAmount), pageWidth - margin, yPos, { align: 'right' })
      }
    }
    
    // Footer
    const pageCount = (doc as any).internal.pages.length - 1
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    }
    
    // Save the PDF
    doc.save(`order-${row.order_number || row.id}.pdf`)
    
    init({ message: 'Order PDF downloaded', color: 'success' })
  } catch (error: any) {
    alert('Error: ' + error.message)
  }
}

const downloadSelectedOrder = () => {
  init({ message: 'Please select an order by clicking the download icon in the actions column', color: 'info' })
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

