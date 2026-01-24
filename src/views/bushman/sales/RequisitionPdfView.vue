<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { requisitionService } from '@/stores/bushman/requisitionService'
import Swal from 'sweetalert2'

type Requisition = {
  id: number
  code?: string
  date?: string
  required_date?: string
  status?: string
  status_label?: string
  requisition_type?: { name?: string }
  fund_direction?: string
  branch?: { name?: string }
  requested_by_user?: { first_name?: string; last_name?: string; email?: string; username?: string }
  user?: { first_name?: string; last_name?: string; email?: string; username?: string }
  handler_user?: { first_name?: string; last_name?: string; email?: string; username?: string }
  remarks?: string
  sources?: Array<any>
  items?: Array<any>
  approvals?: Array<any>
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const requisition = ref<Requisition | null>(null)
const hasAutoPrinted = ref(false)

const logoSrc = '/assets/img/Bushman Logo.png'
const companyName = 'Bushman Safari Trackers'
const companyAddressLines = [
  'Morogoro, Tanzania',
]

const requisitionId = computed(() => Number(route.params.id))

const formatAmount = (value: number) => {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatMoney = (value: number, currencySymbol?: string) => {
  const symbol = currencySymbol ? String(currencySymbol).trim() : ''
  return symbol ? `${symbol}${formatAmount(value)}` : formatAmount(value)
}

const formatDisplayDate = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).format(date)
}

const userLabel = (value: any): string => {
  if (!value) return '--'
  const firstName = value.first_name || ''
  const lastName = value.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || value.email || value.username || '--'
}

const buildItemLines = (item: any) => {
  const lines: Array<{
    type: string
    code?: string
    name: string
    unit?: string
    quantity?: number
    rate?: number
    amount: number
    currencySymbol?: string
  }> = []

  const materials = item?.materials || []
  for (const material of materials) {
    const quantity = Number(material?.quantity || 0)
    const rate = Number(material?.rate || 0)
    const symbol = material?.currency?.symbol || item?.currency?.symbol || ''
    const code =
      material?.item?.item_code ||
      material?.item?.scientific_name ||
      material?.item_code ||
      material?.item_name ||
      ''
    lines.push({
      type: 'Item',
      code,
      name: material?.item?.name || material?.item_name || material?.description || 'Item',
      unit: material?.unit_of_measurement?.code || material?.unit_of_measurement?.name || '--',
      quantity,
      rate,
      amount: quantity * rate,
      currencySymbol: symbol
    })
  }

  const accounts = item?.accounts || []
  for (const account of accounts) {
    const amount = Number(account?.amount || 0)
    const symbol = account?.currency?.symbol || item?.currency?.symbol || ''
    const code = account?.account?.code || account?.account_code || ''
    lines.push({
      type: 'Account',
      code,
      name: account?.account?.name || account?.account_name || account?.description || 'Account',
      unit: '--',
      quantity: 1,
      rate: amount,
      amount,
      currencySymbol: symbol
    })
  }

  return lines
}

const mapRequisition = (req: any): Requisition => {
  return {
    id: req.id,
    code: req.code || req.reference || `REQ-${String(req.id).padStart(4, '0')}`,
    date: req.date || req.created_at?.slice(0, 10) || '',
    required_date: req.required_date || '',
    status: req.status || 'DRAFT',
    status_label: req.status_label || '',
    requisition_type: req.requisition_type || {},
    fund_direction: req.fund_direction || '',
    branch: req.branch || {},
    requested_by_user: req.requested_by_user || null,
    user: req.user || null,
    handler_user: req.handler_user || null,
    remarks: req.remarks || '',
    sources: req.sources || [],
    items: req.items || [],
    approvals: req.approvals || []
  }
}

const primarySource = computed(() => {
  return requisition.value?.sources?.[0] || null
})

const detailRows = computed(() => {
  if (!requisition.value?.items?.length) return []
  const rows: Array<{
    code: string
    name: string
    quantity?: number
    rate?: number
    amount: number
    currencySymbol?: string
  }> = []
  requisition.value.items.forEach((item: any) => {
    buildItemLines(item).forEach((line) => {
      rows.push({
        code: line.code || '--',
        name: line.name,
        quantity: line.quantity,
        rate: line.rate,
        amount: line.amount,
        currencySymbol: line.currencySymbol
      })
    })
  })
  return rows
})

const detailRowsWithBlanks = computed(() => {
  const rows = detailRows.value
  const minRows = 10
  if (rows.length >= minRows) return rows
  const blanks = Array.from({ length: minRows - rows.length }, () => ({
    code: '',
    name: '',
    quantity: undefined,
    rate: undefined,
    amount: 0,
    currencySymbol: ''
  }))
  return rows.concat(blanks)
})

const approvalRecord = computed(() => {
  const approvals = requisition.value?.approvals || []
  if (!approvals.length) return null
  return approvals[approvals.length - 1]
})

const grandTotal = computed(() => {
  return detailRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0)
})

const totalCurrencySymbol = computed(() => {
  const first = detailRows.value.find((row) => row.currencySymbol)
  return first?.currencySymbol || ''
})

const fetchRequisition = async () => {
  loading.value = true
  try {
    const response = await requisitionService.get(requisitionId.value)
    const data = response?.data?.data || response?.data || response
    requisition.value = mapRequisition(data)
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to load requisition.',
      confirmButtonColor: '#2563eb',
    })
    requisition.value = null
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  window.print()
}

const goBack = () => {
  router.push({ name: 'sales-requisition-details', params: { id: requisitionId.value } })
}

onMounted(() => {
  fetchRequisition()
})

watch(requisition, (value) => {
  if (!value || hasAutoPrinted.value) return
  hasAutoPrinted.value = true
  setTimeout(() => {
    window.print()
  }, 200)
})
</script>

<template>
  <div class="pdf-view">
    <div class="pdf-actions d-print-none">
      <button class="btn btn-primary text-white" type="button" @click="handlePrint">
        <i class="fa fa-save me-1"></i> Save PDF
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="requisition" class="pdf-page">
      <table class="header-table">
        <tr>
          <td class="header-logo">
            <img :src="logoSrc" alt="Bushman Safari Trackers" />
          </td>
          <td class="header-company">
            <div class="company-name">{{ companyName }}</div>
            <div v-for="(line, idx) in companyAddressLines" :key="`addr-${idx}`" class="company-sub">
              {{ line }}
            </div>
          </td>
          <td class="header-status">
            {{ requisition.status_label || requisition.status || '--' }}
          </td>
        </tr>
      </table>

      <div class="title-bar">Purchase Requisition Form</div>

      <div class="pdf-body">
      <table class="meta-table">
        <tr>
          <th>Organization:</th>
          <td>{{ companyName }}</td>
          <th>Document No:</th>
          <td>{{ requisition.code || `REQ-${requisition.id}` }}</td>
        </tr>
        <tr>
          <th>Department:</th>
          <td>{{ requisition.requisition_type?.name || '--' }}</td>
          <th>Revision:</th>
          <td>{{ requisition.status_label || requisition.status || '--' }}</td>
        </tr>
      </table>

      <table class="info-table">
        <tr>
          <th>Date of request</th>
          <td>{{ formatDisplayDate(requisition.date) }}</td>
          <th>Date required</th>
          <td>{{ formatDisplayDate(requisition.required_date) }}</td>
        </tr>
        <tr>
          <th>Requested By</th>
          <td>{{ userLabel(requisition.requested_by_user || requisition.user) }}</td>
          <th>Approval Manager</th>
          <td>{{ userLabel(requisition.handler_user || approvalRecord?.approved_by_user || approvalRecord?.handled_by_user) }}</td>
        </tr>
        <tr>
          <th>Cost Center</th>
          <td>{{ requisition.fund_direction || '--' }}</td>
          <th>GL Account</th>
          <td>{{ requisition.requisition_type?.code || '--' }}</td>
        </tr>
        <tr>
          <th>Vendor Name</th>
          <td>{{ primarySource?.payee || primarySource?.entity?.full_name || primarySource?.entity?.name || '--' }}</td>
          <th>Vendor Contact</th>
          <td>{{ primarySource?.entity?.nick_name || primarySource?.entity?.full_name || primarySource?.payee || '--' }}</td>
        </tr>
      </table>

      <div class="details-title">Details:</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>S No.</th>
            <th>Material Code</th>
            <th>Material Name</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!detailRows.length">
            <td colspan="6" class="text-muted">No line items available.</td>
          </tr>
          <tr v-for="(row, idx) in detailRowsWithBlanks" :key="`detail-${idx}`">
            <td>{{ idx + 1 }}</td>
            <td>{{ row.code || '' }}</td>
            <td>{{ row.name || '' }}</td>
            <td class="text-end">{{ row.quantity ?? '' }}</td>
            <td class="text-end">{{ row.rate ? formatMoney(row.rate, row.currencySymbol) : '' }}</td>
            <td class="text-end">{{ row.amount ? formatMoney(row.amount, row.currencySymbol) : '' }}</td>
          </tr>
          <tr class="grand-total-row">
            <td colspan="5" class="text-end">Grand Total</td>
            <td class="text-end">{{ formatMoney(grandTotal, totalCurrencySymbol) }}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <table class="signature-table">
        <tr>
          <th>Requested By: (Signature)</th>
          <th>Approved by: (Signature)</th>
        </tr>
        <tr>
          <td class="signature-cell"></td>
          <td class="signature-cell"></td>
        </tr>
        <tr>
          <th>Date:</th>
          <th>Date:</th>
        </tr>
        <tr>
          <td>{{ formatDisplayDate(requisition.date) }}</td>
          <td>{{ formatDisplayDate(approvalRecord?.date) }}</td>
        </tr>
      </table>
    </div>

    <div v-else class="text-center text-muted py-5">
      No requisition data available.
    </div>
  </div>
</template>

<style scoped>
.pdf-view {
  padding: 1.5rem 1.5rem 3rem;
}

.pdf-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.pdf-page {
  background: #ffffff;
  border: 1px solid #3f3f46;
  padding: 12mm;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  color: #111827;
  font-size: 0.85rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.header-table,
.meta-table,
.info-table,
.details-table,
.signature-table {
  width: 100%;
  border-collapse: collapse;
}

.header-table td {
  border: 1px solid #3f3f46;
  padding: 8px;
}

.header-logo {
  width: 120px;
  text-align: center;
}

.header-logo img {
  max-width: 90px;
  max-height: 60px;
  object-fit: contain;
}

.header-company {
  text-align: center;
}

.header-status {
  width: 140px;
  text-align: center;
  font-weight: 600;
}

.company-name {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.company-sub {
  font-size: 0.75rem;
  color: #4b5563;
}

.title-bar {
  margin: 8px 0 12px;
  background: #9ca3af;
  color: #111827;
  font-weight: 700;
  text-align: center;
  padding: 6px 8px;
  border: 1px solid #3f3f46;
}

.pdf-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-table th,
.meta-table td,
.info-table th,
.info-table td,
.details-table th,
.details-table td,
.signature-table th,
.signature-table td {
  border: 1px solid #3f3f46;
  padding: 6px 8px;
  vertical-align: top;
}

.meta-table th,
.info-table th {
  background: #f3f4f6;
  font-weight: 600;
  text-align: left;
  width: 20%;
}

.meta-table td {
  width: 30%;
}

.info-table th {
  width: 20%;
}

.details-title {
  margin-top: 12px;
  background: #e5e7eb;
  border: 1px solid #3f3f46;
  border-bottom: none;
  font-weight: 700;
  text-align: center;
  padding: 6px 8px;
}

.details-table th {
  background: #e5e7eb;
  text-align: center;
  font-weight: 700;
}

.details-table td {
  text-align: left;
}

.grand-total-row td {
  font-weight: 700;
  background: #f3f4f6;
}

.signature-table {
  margin-top: auto;
}

.signature-table th {
  background: #f3f4f6;
  text-align: left;
  width: 50%;
}

.signature-cell {
  height: 60px;
}

@media (max-width: 900px) {
  .pdf-page {
    font-size: 0.8rem;
    width: 100%;
    min-height: auto;
  }
}

@media print {
  .pdf-view {
    padding: 0;
  }

  .pdf-page {
    box-shadow: none;
    border: none;
    border-radius: 0;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  .pdf-card {
    break-inside: avoid;
  }
}

:global(.app-header),
:global(.app-sidebar),
:global(.app-sidebar-bg),
:global(.app-footer),
:global(.theme-panel),
:global(.theme-panel-btn),
:global(.app-theme-panel) {
  display: none !important;
}

:global(.app-content) {
  margin-left: 0 !important;
  padding: 0 !important;
}

:global(body) {
  background: #ffffff !important;
}

@page {
  size: A4;
  margin: 12mm;
}
</style>
