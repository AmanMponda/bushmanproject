<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
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
const pdfUrl = ref<string | null>(null)
const approvalStages = ref<any[]>([])

const companyName = 'Bushman Safari Trackers'
const companyAddress = 'P.O Box 127, Morogoro Tanzania | Mob: +255 748 771 551 | Email: info@bushman-safaris.co.tz'

const requisitionId = computed(() => Number(route.params.id))

const formatAmount = (value: number) => {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const formatMoney = (value: number, currencySymbol?: string) => {
  const symbol = currencySymbol ? String(currencySymbol).trim() : ''
  return symbol ? `${symbol} ${formatAmount(value)}` : formatAmount(value)
}

const formatDisplayDate = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date)
}

const userLabel = (value: any): string => {
  if (!value) return '--'
  const firstName = value.first_name || ''
  const lastName = value.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || value.username || '--'
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
  if (!requisition.value?.items?.length) {return []
  }const rows: Array<{
    name: string
    quantity: number
    unit: string
    rate: number
    amount: number
    currencySymbol: string
  }> = []

  requisition.value.items.forEach((item: any, itemIndex: number) => {
    const materials = item?.materials || []
    for (const material of materials) {
      const quantity = Number(material?.quantity || 0)
      const rate = Number(material?.rate || 0)
      const symbol = material?.currency?.symbol || item?.currency?.symbol || ''
      const itemName = material?.item?.name || material?.item_name || material?.description || 'Item'
      
      rows.push({
        name: itemName,
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
      const accountName = account?.account?.name || account?.account_name || account?.description || 'Account'
      
      rows.push({
        name: accountName,
        unit: '--',
        quantity: 1,
        rate: amount,
        amount,
        currencySymbol: symbol
      })
    }
  })
  
  return rows
})

const approvalRecord = computed(() => {
  const approvals = requisition.value?.approvals || []
  if (!approvals.length) return null
  return approvals[approvals.length - 1]
})

const latestStageApproval = () => {
  const stages = approvalStages.value || []
  let latest: any = null
  stages.forEach((stage: any) => {
    ;(stage?.approvals || []).forEach((app: any) => {
      if (!app?.date) return
      if (!latest || new Date(app.date).getTime() > new Date(latest.date).getTime()) {
        latest = { ...app, position: stage?.position }
      }
    })
  })
  return latest
}

const approverPositions = computed(() => {
  const stages = approvalStages.value || []
  const positions = stages
    .map((s: any) => s?.position?.role_name || s?.position?.short)
    .filter(Boolean)
  return positions
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
    const data = response?.data?.data || response?.data || response// Map the main requisition
    const baseReq = data?.requisition || data
    requisition.value = mapRequisition(baseReq)
    approvalStages.value = data?.approval_stages || []

    // Handle sources
    if (data?.sources) {
      requisition.value.sources = data.sources
    }

    // Handle items - check multiple possible locations
    let finalItems: any[] = []
    
    // 1. Check if items already exist in the requisition
    if (baseReq?.items && Array.isArray(baseReq.items) && baseReq.items.length > 0) {finalItems = baseReq.items
    }
    // 2. Check for dimension-based items
    else if (data?.latest_approved_dimensions || data?.dimensions) {const latestApproved = Array.isArray(data?.latest_approved_dimensions)
        ? data.latest_approved_dimensions
        : null
      const dimensions =
        (latestApproved && latestApproved.length ? latestApproved : null) ||
        data?.dimensions ||
        []
      const defaultCurrency = requisition.value.sources?.[0]?.currency || null

      dimensions.forEach((dim: any) => {
        const accounts = dim?.accounts || []
        ;(dim?.account_items || []).forEach((accItem: any) => {
          const accountDetail = accounts.find((a: any) => a.account_id === accItem.account_id)
          finalItems.push({
            currency: accountDetail?.currency || defaultCurrency,
            materials: [],
            accounts: [{
              amount: String(accItem.total_amount ?? accItem.amount ?? 0),
              account: accountDetail?.account,
              account_name: accountDetail?.account?.name,
              currency: accountDetail?.currency || defaultCurrency
            }]
          })
        })

        ;(dim?.material_items || []).forEach((matItem: any) => {
          const quantity = Number(matItem.total_quantity ?? matItem.quantity ?? 0)
          const totalLine = Number(matItem.total_line_total ?? 0)
          const rawRate = Number(matItem.rate)
          const rate = Number.isFinite(rawRate) ? rawRate : quantity ? totalLine / quantity : 0
          finalItems.push({
            currency: defaultCurrency,
            materials: [{
              quantity: String(quantity),
              rate: String(rate),
              item: matItem.item_id ? { name: matItem.item_name } : null,
              item_name: matItem.item_name,
              unit_of_measurement: matItem.unit_of_measurement,
              currency: defaultCurrency
            }],
            accounts: []
          })
        })
      })
    }
    
    if (finalItems.length > 0) {
      requisition.value.items = finalItems} else {
      console.warn('No items found in requisition data')
    }

    await buildPdf()
  } catch (error: any) {
    console.error('Error fetching requisition:', error)
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

const buildPdf = async () => {
  if (!requisition.value || generatingPdf.value || hasGeneratedPdf.value) return

  generatingPdf.value = true
  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40
    let y = margin

    // Company Header - centered
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text(companyName, pageWidth / 2, y, { align: 'center' })
    y += 14
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(companyAddress, pageWidth / 2, y, { align: 'center' })
    y += 16
    
    // Horizontal line
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 24

    // Title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    // pdf.text('PURCHASE REQUISITION', pageWidth / 2, y, { align: 'center' })
    // Image aligns "This purchase..." left. But form title usually centered.
    // Let's stick to Centered Title.
    pdf.text('PURCHASE REQUISITION', pageWidth / 2, y, { align: 'center' })
    y += 30

    // Basic Info in simple text or autoTable?
    // Image doesn't show top info, but previous PDF had it. I should keep it but simple.
    
    const reqCode = requisition.value.code || `REQ-${requisition.value.id}`
    const requestedBy = userLabel(requisition.value.requested_by_user || requisition.value.user)
    const reqDate = formatDisplayDate(requisition.value.date)
    const reqType = requisition.value.requisition_type?.name || '--'
    
    // Two columns info
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const infoRightX = pageWidth - margin - 220 // move right column inward

    pdf.text(`Requisition No: ${reqCode}`, margin, y)
    pdf.text(`Date: ${reqDate}`, infoRightX, y)
    y += 14
    pdf.text(`Requested By: ${requestedBy}`, margin, y)
    pdf.text(`Type: ${reqType}`, infoRightX, y)
    y += 20

    // Items Table
    const tableRows = detailRows.value.map((row, idx) => [
      String(idx + 1),
      row.name,
      String(row.quantity),
      row.unit,
      formatMoney(row.rate, row.currencySymbol),
      formatMoney(row.amount, row.currencySymbol)
    ])
    
    // Fill with empty rows
    const minRows = 12
    while (tableRows.length < minRows) {
      tableRows.push(['', '', '', '', '', ''])
    }

    const totalAmount = formatMoney(grandTotal.value, totalCurrencySymbol.value)

    autoTable(pdf, {
      startY: y,
      theme: 'grid',
      styles: { 
        fontSize: 10, 
        cellPadding: 5, 
        lineColor: [0, 0, 0], 
        lineWidth: 0.5,
        textColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle'
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      head: [['#', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Amount']],
      body: tableRows,
      foot: [[
        { content: 'Grand Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: totalAmount, styles: { halign: 'right', fontStyle: 'bold' } }
      ]],
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 200 },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 60 },
        4: { cellWidth: 80, halign: 'right' },
        5: { cellWidth: 80, halign: 'right' }
      }
    })

    // Emphasize Grand Total beneath the table
    const tableBottomY = (pdf as any).lastAutoTable.finalY
    const grandY = tableBottomY + 10
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)

    y = tableBottomY + 26
    


    // Signatures
    // Image style: Line, then text "Authorized by..." below it.
    
    // Left: Requested By
    // Right: Authorized By
    
    // Move signature block to the bottom of the page
    const positions = approverPositions.value
    const approvalsCount = positions.length || 1
    const columnGap = 24
    const signatureCellWidth = Math.max(120, Math.floor((pageWidth - (margin * 2) - (columnGap * approvalsCount)) / (approvalsCount + 1)))
    const totalSignaturesWidth = (signatureCellWidth * (approvalsCount + 1)) + (columnGap * approvalsCount)
    const sigStartX = Math.max(margin, margin + Math.max(0, (pageWidth - (margin * 2) - totalSignaturesWidth) / 2) - 16)
    const rowGap = 36
    const positionsBlockHeight = rowGap
    const sigBlockHeight = 60 + (positionsBlockHeight ? positionsBlockHeight + 6 : 0)
    let sigY = pageHeight - margin - sigBlockHeight

    // If there's not enough space on current page for signatures, add a new page
    if ((pdf as any).lastAutoTable && (pdf as any).lastAutoTable.finalY + 40 > sigY) {
      pdf.addPage()
      sigY = pageHeight - margin - sigBlockHeight
    }

    const lineLen = signatureCellWidth

    // Requested By (first slot)
    pdf.line(sigStartX, sigY, sigStartX + lineLen, sigY)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('Requested By', sigStartX, sigY + 12)
    pdf.text(`Date: ${reqDate}`, sigStartX, sigY + 26)

    // Approval chain slots (one per position), aligned on same row
    const listStartY = sigY
    if (positions.length) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      positions.forEach((pos, idx) => {
        const x = sigStartX + (idx + 1) * (lineLen + columnGap)
        pdf.line(x, listStartY, x + lineLen, listStartY)
        pdf.text(String(pos), x, listStartY + 12)
        pdf.text('Date: ............', x, listStartY + 26)
      })
    }

    const blob = pdf.output('blob')
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value)
    }
    const url = URL.createObjectURL(blob)
    pdfUrl.value = url
    hasGeneratedPdf.value = true
  } finally {
    generatingPdf.value = false
  }
}

onMounted(() => {
  fetchRequisition()
})

onBeforeUnmount(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
})
</script>

<template>
  <div class="pdf-view">
    <div v-if="loading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Generating PDF...</p>
    </div>

    <div v-else-if="!requisition" class="error-container">
      <p class="text-muted">No requisition data available.</p>
    </div>

    <div v-else class="pdf-container">
      <iframe v-if="pdfUrl" class="pdf-frame" :src="pdfUrl" title="Requisition PDF"></iframe>
    </div>
  </div>
</template>

<style scoped>
.pdf-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  flex-direction: column;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 2rem;
}

.pdf-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.pdf-frame {
  flex: 1;
  width: 100%;
  border: none;
  background: #fff;
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
  background: #f5f5f5 !important;
}
</style>
