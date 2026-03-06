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

const companyName = 'BUSHMAN SAFARI TRACKERS LTD.'
const companyAddressLines = [
  'Plot 61-64, Block E,',
  'Kihonda Industrial Complex,',
  'P.O Box 678, Morogoro, Tanzania',
  'Tel       : +255 677 775 888',
  'Email   : info@bushman.co.tz',
  'Website : www.bushman.co.tz',
]

const requisitionId = computed(() => Number(route.params.id))

const formatAmount = (value: number) => {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    .map((s: any) => {
      const name = s?.position?.role_name || s?.position?.short || ''
      return name.toLowerCase().includes('store') ? 'Head of Department' : name
    })
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

/** Convert number to words (supports up to trillions, with decimals) */
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion']

  const convertChunk = (n: number): string => {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertChunk(n % 100) : '')
  }

  const parts = num.toFixed(2).split('.')
  let intPart = parseInt(parts[0], 10)
  const decPart = parseInt(parts[1], 10)
  const chunks: string[] = []
  let scaleIdx = 0

  while (intPart > 0) {
    const chunk = intPart % 1000
    if (chunk > 0) {
      const word = convertChunk(chunk)
      chunks.unshift(scales[scaleIdx] ? word + ' ' + scales[scaleIdx] : word)
    }
    intPart = Math.floor(intPart / 1000)
    scaleIdx++
  }

  let result = chunks.join(', ') || 'Zero'
  if (decPart > 0) {
    result += ' Point ' + convertChunk(decPart)
  }
  return result
}

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

    // ── Company Header (centered like reference document) ──
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    pdf.text(companyName, pageWidth / 2, y, { align: 'center' })
    y += 13
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    companyAddressLines.forEach((line) => {
      pdf.text(line, pageWidth / 2, y, { align: 'center' })
      y += 10
    })
    y += 4

    // Horizontal line
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 20

    // ── Title (dynamic from requisition type) ──
    const reqTypeName = (requisition.value.requisition_type?.name || 'REQUISITION').toUpperCase()
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text(reqTypeName, pageWidth / 2, y, { align: 'center' })
    y += 8
    // Full-width underline (margin to margin)
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 18

    // ── Data preparation ──
    const reqCode = requisition.value.code || `REQ-${String(requisition.value.id).padStart(4, '0')}`
    const requestedBy = userLabel(requisition.value.requested_by_user || requisition.value.user)
    const createdBy = userLabel(requisition.value.user)
    const reqDate = formatDisplayDate(requisition.value.date)
    const source = primarySource.value
    const sourcePayee = source?.payee || source?.source_name || ''
    const modeOfPayment = source?.mode_of_payment || ''
    const currencyCode = source?.currency?.code || source?.currency?.name || totalCurrencySymbol.value || ''
    const sourceDescription = source?.description || ''
    const remarks = requisition.value.remarks || sourceDescription || ''

    // ── BILL PAYABLE (left) + Info box (right) ──
    const billBoxX = margin
    const billBoxW = (pageWidth - margin * 2) * 0.52
    const dividerX = billBoxX + billBoxW + 5  // vertical dashed line position
    const infoContentW = 180
    const infoStartX = dividerX + 5  // right box starts just after the dashed line

    // Reset all draw state before this section
    pdf.setDrawColor(255, 255, 255)
    pdf.setLineWidth(0)

    // Bill Payable header (bold text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)
    pdf.text('BILL PAYABLE', billBoxX + 6, y + 11)

    // Bill payable fields
    const billFieldsY = y + 18
    const billFields: [string, string][] = [
      ['Name', sourcePayee],
      ['Address', source?.entity?.address || ''],
      ['City', source?.entity?.city || ''],
      ['Phone', source?.entity?.phone || ''],
      ['TIN', source?.entity?.tin || ''],
      ['VRN', source?.entity?.vrn || ''],
    ]
    const bfRowH = 14
    const bfLabelW = 55
    billFields.forEach(([label, value], i) => {
      const fy = billFieldsY + i * bfRowH
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(0, 0, 0)
      pdf.text(label, billBoxX + 6, fy + 10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(String(value || ''), billBoxX + bfLabelW + 6, fy + 10)
      // thin underline under value area
      pdf.setDrawColor(160, 160, 160)
      pdf.setLineWidth(0.3)
      pdf.line(billBoxX + bfLabelW + 2, fy + bfRowH - 1, billBoxX + billBoxW - 4, fy + bfRowH - 1)
    })

    const sectionTopY = y
    const headerBottomY = y + 16
    const sectionBottomY = billFieldsY + billFields.length * bfRowH + 4

    // Bill Payable HEADER box only — open on left (top, right, bottom of header)
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    // Top line
    pdf.line(billBoxX, sectionTopY, billBoxX + billBoxW, sectionTopY)
    // Right line (header height only)
    pdf.line(billBoxX + billBoxW, sectionTopY, billBoxX + billBoxW, headerBottomY)
    // Bottom line
    pdf.line(billBoxX, headerBottomY, billBoxX + billBoxW, headerBottomY)

    // Vertical dashed line separating left and right
    pdf.setDrawColor(160, 160, 160)
    pdf.setLineWidth(0.3)
    const dashLen = 4
    const gapLen = 3
    let dashY = sectionTopY
    while (dashY < sectionBottomY) {
      const endY = Math.min(dashY + dashLen, sectionBottomY)
      pdf.line(dividerX, dashY, dividerX, endY)
      dashY += dashLen + gapLen
    }

    // Right side info — small outer box, no internal lines
    const infoFields: [string, string][] = [
      ['REQ :', reqCode],
      ['REQ DATE:', reqDate],
      ['CREATED BY:', createdBy],
      ['REQUESTED BY:', requestedBy],
      ['PAYMENT MODE:', modeOfPayment],
      ['CURRENCY:', currencyCode],
    ]
    const ifRowH = 12
    const ifLabelW = 80
    const infoPadding = 4
    const infoStartY = y + 16
    const infoTotalH = infoFields.length * ifRowH + infoPadding * 2

    // Dashed outer border — small compact box
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.3)
    const boxX = infoStartX
    const boxY = infoStartY
    const boxW = infoContentW
    const boxH = infoTotalH
    const bDash = 4
    const bGap = 3
    // Top edge
    let dx = boxX
    while (dx < boxX + boxW) { const end = Math.min(dx + bDash, boxX + boxW); pdf.line(dx, boxY, end, boxY); dx += bDash + bGap }
    // Bottom edge
    dx = boxX
    while (dx < boxX + boxW) { const end = Math.min(dx + bDash, boxX + boxW); pdf.line(dx, boxY + boxH, end, boxY + boxH); dx += bDash + bGap }
    // Left edge
    let dy = boxY
    while (dy < boxY + boxH) { const end = Math.min(dy + bDash, boxY + boxH); pdf.line(boxX, dy, boxX, end); dy += bDash + bGap }
    // Right edge
    dy = boxY
    while (dy < boxY + boxH) { const end = Math.min(dy + bDash, boxY + boxH); pdf.line(boxX + boxW, dy, boxX + boxW, end); dy += bDash + bGap }

    // Plain text rows inside — no row or column lines
    infoFields.forEach(([label, value], i) => {
      const fy = infoStartY + infoPadding + i * ifRowH
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.setTextColor(0, 0, 0)
      pdf.text(label, infoStartX + 4, fy + 9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(String(value || ''), infoStartX + ifLabelW + 4, fy + 9)
    })

    // Reset draw state after section
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)

    y = Math.max(billFieldsY + billFields.length * bfRowH, infoStartY + infoTotalH) + 10

    // ── COST CENTER bar ──
    const costCenter = requisition.value.branch?.name || ''
    pdf.setDrawColor(0)
    pdf.rect(margin, y, pageWidth - margin * 2, 16, 'S')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(`  COST CENTER: ${costCenter.toUpperCase()}`, margin + 4, y + 11)
    y += 16

    // ── Items Table ──
    const tableW = pageWidth - margin * 2
    const colWidths = [35, 250, 60, 85, tableW - 35 - 250 - 60 - 85] // No. | DESC | QTY | PRICE | AMOUNT
    const headerLabels = ['No.', 'DESCRIPTION', 'QUANTITY', 'PRICE', 'AMOUNT']
    const rowH = 20

    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)

    // ── Table Header ──
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    let hx = margin
    headerLabels.forEach((label, i) => {
      pdf.rect(hx, y, colWidths[i], rowH, 'S')
      pdf.text(label, hx + colWidths[i] / 2, y + 13, { align: 'center' })
      hx += colWidths[i]
    })
    y += rowH

    // ── Remarks/Description row (spans first 4 cols, vertical line before AMOUNT only) ──
    if (remarks) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      const remarkSpanW = colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
      const remarkLines = pdf.splitTextToSize(remarks.toUpperCase(), remarkSpanW - 10)
      const remarkH = Math.max(28, remarkLines.length * 11 + 10)
      // Top and bottom horizontal lines (full width)
      pdf.line(margin, y, margin + tableW, y)
      pdf.line(margin, y + remarkH, margin + tableW, y + remarkH)
      // Left border
      pdf.line(margin, y, margin, y + remarkH)
      // Right border
      pdf.line(margin + tableW, y, margin + tableW, y + remarkH)
      // Vertical line before AMOUNT column only
      const amountLineX = margin + remarkSpanW
      pdf.line(amountLineX, y, amountLineX, y + remarkH)
      pdf.text(remarkLines, margin + 5, y + 12)
      y += remarkH
    }

    // ── Item rows ──
    const itemRowH = 40  // taller rows for multi-line descriptions
    const itemStartY = y

    // Draw items
    detailRows.value.forEach((row, idx) => {
      const ry = y
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)

      // No.
      pdf.text(String(idx + 1), margin + colWidths[0] / 2, ry + 14, { align: 'center' })

      // Description (bold name, then details on lines below)
      const descText = row.name || ''
      const unitText = row.unit && row.unit !== '--' ? `(${row.unit})` : ''
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      // Wrap description text within column width
      const descColW = colWidths[1] - 8
      const descLines = pdf.splitTextToSize(descText, descColW)
      pdf.text(descLines, margin + colWidths[0] + 4, ry + 12)
      if (unitText) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.text(unitText, margin + colWidths[0] + 4, ry + 12 + descLines.length * 10)
      }

      // Quantity
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text(String(row.quantity), margin + colWidths[0] + colWidths[1] + colWidths[2] / 2, ry + 14, { align: 'center' })

      // Price
      pdf.text(formatAmount(row.rate), margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 4, ry + 14, { align: 'right' })

      // Amount
      pdf.text(formatAmount(row.amount), margin + tableW - 4, ry + 14, { align: 'right' })

      y += itemRowH
    })

    // Empty rows to fill minimum
    const minRows = 6
    const emptyRowsNeeded = Math.max(0, minRows - detailRows.value.length)
    for (let i = 0; i < emptyRowsNeeded; i++) {
      y += itemRowH
    }

    const subtotal = grandTotal.value
    const vatAmount = detailRows.value.reduce((sum, row: any) => {
      return sum + Number(row.vatAmount || 0)
    }, 0)
    const grandTotalWithVat = subtotal + vatAmount

    // ── TOTAL / VAT / GRAND TOTAL rows (inside the same table) ──
    const totRowH = 18
    const priceColX = margin + colWidths[0] + colWidths[1] + colWidths[2]
    const amountColX = priceColX + colWidths[3]
    const tableEndX = margin + tableW

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)

    // TOTAL row
    pdf.line(margin, y, tableEndX, y)  // horizontal line across full width
    pdf.text('TOTAL', amountColX - 4, y + 12, { align: 'right' })
    pdf.text(formatAmount(subtotal), tableEndX - 4, y + 12, { align: 'right' })
    y += totRowH

    // VAT row
    pdf.line(priceColX, y, tableEndX, y)  // horizontal line (price+amount only)
    pdf.text('VAT', amountColX - 4, y + 12, { align: 'right' })
    pdf.text(formatAmount(vatAmount), tableEndX - 4, y + 12, { align: 'right' })
    y += totRowH

    // GRAND TOTAL row
    pdf.line(priceColX, y, tableEndX, y)  // horizontal line (price+amount only)
    pdf.text('GRAND TOTAL', amountColX - 4, y + 12, { align: 'right' })
    pdf.text(formatAmount(grandTotalWithVat), tableEndX - 4, y + 12, { align: 'right' })
    y += totRowH

    // Draw outer border around entire table (items + totals, from itemStartY to y)
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.rect(margin, itemStartY, tableW, y - itemStartY, 'S')

    // Draw vertical column lines through item rows area only (up to first total line)
    const itemsEndY = itemStartY + (detailRows.value.length + emptyRowsNeeded) * itemRowH
    let cx = margin
    colWidths.forEach((cw, i) => {
      if (i > 0) {
        pdf.line(cx, itemStartY, cx, itemsEndY)
      }
      cx += cw
    })

    // Vertical divider between PRICE and AMOUNT in totals area (continuous, no gap)
    const totalsStartY = itemsEndY
    pdf.line(amountColX, totalsStartY, amountColX, y)
    // Left border of totals area (close the left side at priceColX)
    pdf.line(priceColX, totalsStartY, priceColX, y)

    y += 10

    // ── Amount in words ──
    const currencyWord = (source?.currency?.name || currencyCode || '').toUpperCase()
    const amountWords = `(${numberToWords(grandTotalWithVat).toUpperCase()} ${currencyWord} only.)`
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    const wordLines = pdf.splitTextToSize(amountWords, pageWidth - margin * 2)
    pdf.text(wordLines, margin, y)
    y += wordLines.length * 10 + 16

    // ── Signatures ──
    const positions = approverPositions.value
    // "Prepared By" + all approval positions + "Managing Director"
    const sigLabels = ['Prepared By', ...positions]
    const sigCount = sigLabels.length
    const sigGap = 8
    const sigCellW = Math.floor((pageWidth - margin * 2 - sigGap * (sigCount - 1)) / sigCount)
    const sigBlockH = 50
    let sigY = pageHeight - margin - sigBlockH - 10

    // If not enough room, add a page
    if (y + 20 > sigY) {
      pdf.addPage()
      sigY = pageHeight - margin - sigBlockH - 10
    }

    pdf.setFontSize(8)
    const stages = approvalStages.value || []
    sigLabels.forEach((label, idx) => {
      const sx = margin + idx * (sigCellW + sigGap)
      // Signature line
      pdf.setDrawColor(0)
      pdf.line(sx, sigY, sx + sigCellW, sigY)

      // Try to find approver name for this slot
      let sigName = ''
      let sigDate = ''
      if (idx === 0) {
        // Prepared By = requester
        sigName = userLabel(requisition.value.requested_by_user || requisition.value.user)
        sigDate = reqDate
      } else if (idx <= stages.length) {
        const stage = stages[idx - 1]
        const stageApproval = stage?.approvals?.find((a: any) => a.status === 'APPROVED')
        if (stageApproval) {
          sigName = stageApproval.approved_by?.full_name
            || stageApproval.handled_by?.full_name
            || userLabel(stageApproval.approved_by || stageApproval.handled_by)
          sigDate = formatDisplayDate(stageApproval.date)
        }
      }

      // Name above line
      if (sigName && sigName !== '--') {
        pdf.setFont('helvetica', 'normal')
        pdf.text(sigName, sx, sigY - 5)
      }

      // Label below line
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, sx, sigY + 12)

      // Date below label
      pdf.setFont('helvetica', 'normal')
      pdf.text(sigDate ? `Date: ${sigDate}` : 'Date: ............', sx, sigY + 24)
    })

    // ── APPROVED watermark (diagonal across entire page, well centered) ──
    const reqStatus = (requisition.value.status || '').toUpperCase()
    if (reqStatus === 'APPROVED' || reqStatus === 'COMPLETED' || reqStatus === 'FULLY_APPROVED' || reqStatus.includes('APPROV')) {
      const totalPages = pdf.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p)
        pdf.saveGraphicsState()
        pdf.setTextColor(190, 190, 190)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(82)
        // @ts-ignore – setGState for opacity
        const gState = new (pdf as any).GState({ opacity: 0.22 })
        pdf.setGState(gState)
        // Center of page, shifted down so full word is visible
        const pcx = pageWidth / 2
        const pcy = (pageHeight / 2) + 80
        pdf.text('APPROVED', pcx, pcy, {
          align: 'center',
          angle: 45,
        })
        pdf.restoreGraphicsState()
      }
      pdf.setPage(totalPages)
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
