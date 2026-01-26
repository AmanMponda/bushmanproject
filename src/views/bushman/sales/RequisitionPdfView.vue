<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { requisitionService } from '@/stores/bushman/requisitionService'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const loading = ref(false)
const requisition = ref<Requisition | null>(null)
const generatingPdf = ref(false)
const hasGeneratedPdf = ref(false)

const logoSrc = '/assets/img/Bushman Logo.png'
const companyName = 'Bushman Safari Trackers'
const companyAddressLines = [
  'P.O Box 127, Morogoro Tanzania,',
  'Tanzania',
  'Mob: +255 748 771 551',
  'Email: info@bushman-safaris.co.tz'
]

const requisitionId = computed(() => Number(route.params.id))

const formatAmount = (value: number) => {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
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
      unit: material?.unit_of_measurement?.name || material?.unit_of_measurement?.code || '--',
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
      unit: 'N/A',
      quantity: 1,
      rate: amount,
      amount,
      currencySymbol: symbol
    })
  }

  return lines
}

const normalizeMasterPayload = (payload: any) => {
  if (!payload?.requisition) return payload

  const requisition = payload.requisition || {}
  const sources = payload.sources || []
  const dimensions = payload.latest_approved_dimensions || payload.dimensions || []
  const defaultCurrency = sources?.[0]?.currency || null

  let tempId = -1
  const items: any[] = []

  dimensions.forEach((dim: any) => {
    const accounts = dim?.accounts || []
    const accountLookup = new Map(accounts.map((acc: any) => [acc.account_id, acc]))

    ;(dim?.account_items || []).forEach((accItem: any) => {
      const accountDetail = accountLookup.get(accItem.account_id)
      const reqItemId = accItem.requisition_item_id || accountDetail?.requisition_item_id || null
      const currency = accountDetail?.currency || defaultCurrency || null
      const currencyId = accItem.currency_id || accountDetail?.currency_id || currency?.id || null

      items.push({
        id: reqItemId || tempId--,
        currency_id: currencyId,
        currency,
        materials: [],
        accounts: [
          {
            id: accountDetail?.id,
            requisition_item_id: reqItemId || undefined,
            account_id: accItem.account_id,
            currency_id: currencyId,
            amount: String(accItem.total_amount ?? accItem.amount ?? 0),
            description: null,
            account: accountDetail?.account || accountDetail?.account_id ? accountDetail?.account : accountDetail?.account,
            currency
          }
        ],
        dimensions: [
          {
            dimension_type_id: dim?.dimension_type_id,
            dimension_value_id: dim?.dimension_value_id,
            dimension_type: typeof dim?.dimension_type === 'string' ? { name: dim?.dimension_type } : dim?.dimension_type,
            dimension_value: typeof dim?.dimension_value === 'string' ? { name: dim?.dimension_value } : dim?.dimension_value
          }
        ]
      })
    })

    ;(dim?.material_items || []).forEach((matItem: any) => {
      const reqItemId = matItem.requisition_item_id || null
      const quantity = Number(matItem.total_quantity ?? matItem.quantity ?? 0)
      const totalLine = Number(matItem.total_line_total ?? 0)
      const rate = quantity ? totalLine / quantity : 0
      const currency = defaultCurrency || null
      const currencyId = currency?.id || null

      items.push({
        id: reqItemId || tempId--,
        currency_id: currencyId,
        currency,
        materials: [
          {
            id: matItem.id,
            requisition_item_id: reqItemId || undefined,
            item_id: matItem.item_id,
            unit_of_measurement_id: matItem.unit_of_measurement?.id,
            quantity: String(quantity),
            rate: String(rate),
            currency_id: currencyId,
            description: null,
            item: matItem.item_id ? { id: matItem.item_id, name: matItem.item_name } : null,
            unit_of_measurement: matItem.unit_of_measurement || null,
            currency
          }
        ],
        accounts: [],
        dimensions: [
          {
            dimension_type_id: dim?.dimension_type_id,
            dimension_value_id: dim?.dimension_value_id,
            dimension_type: typeof dim?.dimension_type === 'string' ? { name: dim?.dimension_type } : dim?.dimension_type,
            dimension_value: typeof dim?.dimension_value === 'string' ? { name: dim?.dimension_value } : dim?.dimension_value
          }
        ]
      })
    })
  })

  return {
    ...requisition,
    sources,
    items
  }
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

const getCurrencySymbol = () => {
  const sourceCurrency = requisition.value?.sources?.[0]?.currency?.symbol
  if (sourceCurrency) return sourceCurrency
  const itemCurrency = requisition.value?.items?.[0]?.currency?.symbol
  return itemCurrency || ''
}

const primarySource = computed(() => {
  return requisition.value?.sources?.[0] || null
})

const detailRows = computed(() => {
  if (!requisition.value?.items?.length) return []
  const rows: Array<{
    code: string
    name: string
    unit?: string
    quantity?: number
    rate?: number
    amount: number
    currencySymbol?: string
    costCenter?: string
  }> = []
  requisition.value.items.forEach((item: any) => {
    buildItemLines(item).forEach((line) => {
      const dim = item?.dimensions?.[0]
      const costCenter =
        dim?.dimension_value?.name ||
        dim?.dimension_value?.code ||
        ''
      rows.push({
        code: line.code || '--',
        name: line.name,
        unit: line.unit,
        quantity: line.quantity,
        rate: line.rate,
        amount: line.amount,
        currencySymbol: line.currencySymbol,
        costCenter
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
    const response = await requisitionService.getMaster(requisitionId.value)
    const data = response?.data?.data || response?.data || response
    const normalized = normalizeMasterPayload(data)
    requisition.value = mapRequisition(normalized)
    try {
      await buildPdf()
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to generate PDF.',
        confirmButtonColor: '#2563eb',
      })
    }
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

const loadImageAsDataUrl = async (src: string) => {
  const response = await fetch(src)
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const buildPdf = async () => {
  if (!requisition.value || generatingPdf.value || hasGeneratedPdf.value) return

  generatingPdf.value = true
  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 36
    let cursorY = margin

    let logoDataUrl = ''
    try {
      logoDataUrl = await loadImageAsDataUrl(logoSrc)
    } catch {
      logoDataUrl = ''
    }

    const logoWidth = 80
    const logoHeight = 50
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', margin, cursorY + 2, logoWidth, logoHeight)
    }

    pdf.setFont('helvetica', 'bolditalic')
    pdf.setFontSize(12)
    pdf.setTextColor(185, 28, 28)
    pdf.text(companyName.toUpperCase(), pageWidth / 2, cursorY + 12, { align: 'center' })
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    companyAddressLines.forEach((line, idx) => {
      pdf.text(line, pageWidth / 2, cursorY + 26 + idx * 11, { align: 'center' })
    })

    const headerTextHeight = 26 + (companyAddressLines.length - 1) * 11
    const headerHeight = Math.max(logoHeight, headerTextHeight) + 8
    cursorY += headerHeight

    pdf.setDrawColor(17, 24, 39)
    pdf.setLineWidth(0.6)
    pdf.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 16

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('PURCHASE REQUISITION', pageWidth / 2, cursorY, { align: 'center' })
    cursorY += 12
    pdf.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 10

    const fundingSource =
      primarySource.value?.payee ||
      primarySource.value?.entity?.full_name ||
      primarySource.value?.entity?.name ||
      primarySource.value?.account?.name ||
      primarySource.value?.account?.code ||
      '--'

    autoTable(pdf, {
      startY: cursorY,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      body: [
        ['REQ# :', requisition.value.code || `REQ-${requisition.value.id}`],
        ['Created By :', userLabel(requisition.value.requested_by_user || requisition.value.user)],
        ['Date :', formatDisplayDate(requisition.value.date)],
        ['Type :', requisition.value.requisition_type?.name || requisition.value.requisition_type?.code || '--'],
        ['Funding Source :', fundingSource]
      ],
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: pageWidth - margin * 2 - 90 }
      },
      didParseCell: (data) => {
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [249, 250, 251]
        }
      }
    })

    cursorY = (pdf as any).lastAutoTable.finalY + 14

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('REQUESTED ITEMS', margin, cursorY)
    cursorY += 6

    const detailRows = detailRowsWithBlanks.value.map((row, idx) => [
      String(idx + 1),
      row.name || '',
      '',
      row.costCenter || '',
      row.quantity ?? '',
      row.unit || '',
      row.rate ? formatMoney(row.rate, row.currencySymbol) : '',
      row.amount ? formatMoney(row.amount, row.currencySymbol) : ''
    ])

    const contentWidth = pageWidth - margin * 2
    const baseWidths = [24, 140, 120, 95, 40, 35, 60, 70]
    const baseTotal = baseWidths.reduce((sum, width) => sum + width, 0)
    const scale = (contentWidth - 2) / baseTotal
    const scaledWidths = baseWidths.map((width) => width * scale)

    autoTable(pdf, {
      startY: cursorY,
      theme: 'grid',
      tableWidth: contentWidth - 2,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      head: [['S/N', 'Item', 'Description', 'Cost Center', 'Qty', 'UOM', 'Rate', 'Amount']],
      body: detailRows,
      foot: [[
        { content: 'Grand Total', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatMoney(grandTotal.value, totalCurrencySymbol.value), styles: { halign: 'right', fontStyle: 'bold' } }
      ]],
      headStyles: { fillColor: [229, 231, 235], textColor: 17, halign: 'center', valign: 'middle' },
      footStyles: { fillColor: [243, 244, 246], textColor: 17, overflow: 'visible' },
      columnStyles: {
        0: { cellWidth: scaledWidths[0], halign: 'center' },
        1: { cellWidth: scaledWidths[1] },
        2: { cellWidth: scaledWidths[2] },
        3: { cellWidth: scaledWidths[3] },
        4: { cellWidth: scaledWidths[4], halign: 'right' },
        5: { cellWidth: scaledWidths[5] },
        6: { cellWidth: scaledWidths[6], halign: 'right' },
        7: { cellWidth: scaledWidths[7], halign: 'right' }
      }
    })

    cursorY = (pdf as any).lastAutoTable.finalY + 16

    if (cursorY + 120 > pageHeight - margin) {
      pdf.addPage()
      cursorY = margin
    }

    autoTable(pdf, {
      startY: cursorY,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      body: [
        ['Requested By: (Signature)', 'Approved by: (Signature)'],
        ['', ''],
        ['Date:', 'Date:'],
        [formatDisplayDate(requisition.value.date), formatDisplayDate(approvalRecord.value?.date)]
      ],
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) / 2 },
        1: { cellWidth: (pageWidth - margin * 2) / 2 }
      },
      didParseCell: (data) => {
        if (data.row.index === 1) {
          data.cell.styles.minCellHeight = 48
        }
        if (data.row.index === 0 || data.row.index === 2) {
          data.cell.styles.fillColor = [243, 244, 246]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    const blob = pdf.output('blob')
    const url = URL.createObjectURL(blob)
    hasGeneratedPdf.value = true
    window.location.replace(url)
  } finally {
    generatingPdf.value = false
  }
}

onMounted(() => {
  fetchRequisition()
})
</script>

<template>
  <div class="pdf-view">
    <div class="pdf-actions d-print-none">
      <button class="btn btn-primary text-white" type="button" @click="buildPdf" :disabled="generatingPdf">
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
  vertical-align: middle;
}

.header-logo {
  width: 200px;
  text-align: center;
}

.header-logo img {
  display: block;
  width: 120px;
  max-width: 140px;
  max-height: 80px;
  object-fit: contain;
  margin: 0 auto;
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
