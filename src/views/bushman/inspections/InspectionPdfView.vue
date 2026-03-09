<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { inspectionService } from '@/services/inspectionService'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'

const route = useRoute()

const loading = ref(false)
const inspection = ref<any>(null)
const generatingPdf = ref(false)
const hasGeneratedPdf = ref(false)
const pdfUrl = ref<string | null>(null)

const companyName = 'BUSHMAN SAFARI TRACKERS LTD.'
const companyAddressLines = [
  'Address: Plot 61-64, Block E, Kihonda Industrial Complex',
  'P.O Box 678, Morogoro, Tanzania',
  'Mob: +255 677 775 888',
  'Email: info@bushman.co.tz',
]

const inspectionId = computed(() => Number(route.params.id))

const formatDisplayDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const userLabel = (value: any): string => {
  if (!value) return 'N/A'
  const firstName = value.first_name || ''
  const lastName = value.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || value.username || 'N/A'
}

/** Group parameters by category */
const groupedParameters = computed(() => {
  const params = inspection.value?.parameters || []
  const groups: Record<string, any[]> = {}
  params.forEach((param: any) => {
    const catName = param.maintenance_parameter?.category?.name || 'General'
    if (!groups[catName]) groups[catName] = []
    groups[catName].push(param)
  })
  return groups
})

/** Get latest result for a parameter */
const getLatestResult = (param: any) => {
  const results = param.results || []
  if (!results.length) return null
  return results.reduce((latest: any, r: any) => {
    if (!latest) return r
    return new Date(r.created_at) > new Date(latest.created_at) ? r : latest
  }, null)
}

/** Get YES/NO/value from a result */
const getResultDisplay = (param: any) => {
  const result = getLatestResult(param)
  if (!result) return { yes: false, no: false, remarks: '' }
  const qType = (param.question_type_snapshot || param.maintenance_parameter?.question_type || '').toLowerCase()
  if (qType === 'yes_no' || qType === 'boolean') {
    const val = result.value_bool
    return { yes: val === true, no: val === false, remarks: result.remarks || '' }
  }
  return { yes: false, no: false, remarks: result.value_text || (result.value_numeric != null ? String(result.value_numeric) : '') || result.remarks || '' }
}

const fetchInspection = async () => {
  loading.value = true
  try {
    const response = await inspectionService.getInspection(inspectionId.value)
    const data = response?.data?.data || response?.data || response
    inspection.value = data
    await buildPdf()
  } catch (error: any) {
    console.error('Error fetching inspection:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to load inspection.',
      confirmButtonColor: '#2563eb',
    })
    inspection.value = null
  } finally {
    loading.value = false
  }
}

const buildPdf = async () => {
  if (!inspection.value || generatingPdf.value || hasGeneratedPdf.value) return
  generatingPdf.value = true

  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40
    let y = margin + 10

    // Helper: draw dotted line
    const dottedLine = (x1: number, x2: number, yPos: number) => {
      const dots = Math.floor((x2 - x1) / 4)
      for (let i = 0; i < dots; i++) {
        const dx = x1 + i * 4
        pdf.line(dx, yPos, dx + 1.5, yPos)
      }
    }

    // Helper: check page break
    const checkPageBreak = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
    }

    // ── Extract data ──
    const vehicleInfo = inspection.value.vehicle_info || {}
    const driverInfo = inspection.value.driver_info || {}
    const inspectorUser = inspection.value.inspector || inspection.value.user
    const createdByUser = inspection.value.user
    const narrations = inspection.value.narrations || ''

    const sheetNo = String(inspection.value.id || '').padStart(6, '0')
    const vehicleReg = vehicleInfo.registration_number || vehicleInfo.asset_name || ''
    const vehicleMake = vehicleInfo.make || ''
    const vehicleModelName = vehicleInfo.model || ''
    const chassisNo = vehicleInfo.chassis_number || ''
    const odometer = vehicleInfo.odometer ? String(vehicleInfo.odometer) : ''
    const driverName = driverInfo.name || 'N/A'
    const inspectedAt = formatDisplayDate(inspection.value.inspected_at)
    const createdBy = userLabel(createdByUser)
    const inspectorName = userLabel(inspectorUser)

    // Complain logs → driver's complaint
    const complainLogs = inspection.value.complain_logs || inspection.value.complainLogs || []
    const driverComplaint = complainLogs.length
      ? complainLogs.map((c: any) => c.narration || '').filter(Boolean).join('; ')
      : ''

    // ═══════════════════════════════════
    // ── COMPANY HEADER (centered) ──
    // ═══════════════════════════════════
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(180, 0, 0)
    pdf.text(companyName, pageWidth / 2, y, { align: 'center' })
    y += 16

    pdf.setFont('courier', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)
    companyAddressLines.forEach((line) => {
      pdf.text(line, pageWidth / 2, y, { align: 'center' })
      y += 12
    })
    y += 6

    // ── TITLE: INSPECTION SHEET ──
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    const titleText = 'INSPECTION SHEET'
    pdf.text(titleText, pageWidth / 2, y, { align: 'center' })
    y += 4
    // Underline
    const titleW = pdf.getTextWidth(titleText)
    pdf.setLineWidth(0.8)
    pdf.line((pageWidth - titleW) / 2, y, (pageWidth + titleW) / 2, y)
    y += 20

    // ══════════════════════════
    // ── GENERAL DETAILS ──
    // ══════════════════════════
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(10)
    pdf.text('GENERAL DETAILS', margin, y)
    y += 3
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, margin + pdf.getTextWidth('GENERAL DETAILS') + 2, y)
    y += 16

    // Two-column detail rows (label : value on each side)
    const leftLabelX = margin + 20
    const midX = pageWidth / 2 - 20
    const rightLabelX = pageWidth / 2 + 20
    const rightEndX = pageWidth - margin - 10
    const rowH = 15

    const detailPairs: [string, string, string, string][] = [
      ['SHEET NO.', sheetNo, 'CREATED BY.', createdBy],
      ['VEHICLE', vehicleReg, 'CHASSIS NO.', chassisNo],
      ['MAKE', vehicleMake, 'MODEL', vehicleModelName],
      ['DRIVER', driverName, 'PHONE NO.', 'N/A'],
      ['ODOMETER', odometer, 'Date', inspectedAt],
    ]

    pdf.setFontSize(9)
    detailPairs.forEach(([lLabel, lVal, rLabel, rVal]) => {
      // Left pair
      pdf.setFont('courier', 'bold')
      const leftStr = `${lLabel} : `
      pdf.text(leftStr, leftLabelX, y)
      pdf.setFont('courier', 'normal')
      pdf.text(lVal, leftLabelX + pdf.getTextWidth(leftStr), y)

      // Right pair
      pdf.setFont('courier', 'bold')
      const rightStr = `${rLabel} : `
      pdf.text(rightStr, rightLabelX, y)
      pdf.setFont('courier', 'normal')
      pdf.text(rVal, rightLabelX + pdf.getTextWidth(rightStr), y)

      y += rowH
    })

    y += 10

    // ════════════════════════════════════════════
    // ── CHECKLIST PARAMETERS (by category) ──
    // ════════════════════════════════════════════
    const groups = groupedParameters.value
    const catNames = Object.keys(groups)
    let globalIdx = 0

    const yesNoX = pageWidth / 2 + 40
    const remarksStartX = yesNoX + 90

    catNames.forEach((catName, catIdx) => {
      const params = groups[catName]

      checkPageBreak(50)

      // ── Category header (bold, underlined) ──
      pdf.setFont('courier', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      const catTitle = catName.toUpperCase()
      pdf.text(catTitle, margin, y)
      y += 3
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, margin + pdf.getTextWidth(catTitle) + 2, y)
      y += 12

      // ── Driver's Complaining (show under first category only) ──
      if (catIdx === 0) {
        pdf.setFont('courier', 'bold')
        pdf.setFontSize(9)
        pdf.text("Driver's Complaining: ", margin + 10, y)
        const dcLabelW = pdf.getTextWidth("Driver's Complaining: ")
        pdf.setFont('courier', 'bolditalic')
        const dcText = driverComplaint || narrations || ''
        if (dcText) {
          const dcLines = pdf.splitTextToSize(dcText, pageWidth - margin - remarksStartX)
          pdf.text(dcLines, margin + 10 + dcLabelW, y)
          y += Math.max(dcLines.length * 11, 12)
        } else {
          y += 12
        }
        y += 6
      }

      // ── Parameter items ──
      params.forEach((param: any) => {
        globalIdx++
        checkPageBreak(18)

        const label = param.label_snapshot || param.maintenance_parameter?.name || ''
        const result = getResultDisplay(param)
        const qType = (param.question_type_snapshot || param.maintenance_parameter?.question_type || '').toLowerCase()
        const isYesNo = qType === 'yes_no' || qType === 'boolean'

        // Row number
        pdf.setFont('courier', 'normal')
        pdf.setFontSize(9)
        pdf.text(String(globalIdx), margin + 10, y)

        // Item label
        const labelMaxW = yesNoX - margin - 40
        const labelLines = pdf.splitTextToSize(label, labelMaxW)
        pdf.text(labelLines, margin + 28, y)

        if (isYesNo) {
          // YES: □  NO: □
          pdf.setFont('courier', 'bold')
          pdf.text('YES:', yesNoX, y)
          // YES checkbox
          const yesBoxX = yesNoX + pdf.getTextWidth('YES: ')
          pdf.setLineWidth(0.5)
          pdf.rect(yesBoxX, y - 7, 7, 7, 'S')
          if (result.yes) {
            pdf.setFont('courier', 'bold')
            pdf.setFontSize(8)
            pdf.text('X', yesBoxX + 1.2, y - 0.5)
            pdf.setFontSize(9)
          }

          const noLabelX = yesBoxX + 16
          pdf.setFont('courier', 'bold')
          pdf.text('NO:', noLabelX, y)
          const noBoxX = noLabelX + pdf.getTextWidth('NO: ')
          pdf.rect(noBoxX, y - 7, 7, 7, 'S')
          if (result.no) {
            pdf.setFont('courier', 'bold')
            pdf.setFontSize(8)
            pdf.text('X', noBoxX + 1.2, y - 0.5)
            pdf.setFontSize(9)
          }

          // Dotted remarks line
          pdf.setDrawColor(150, 150, 150)
          pdf.setLineWidth(0.3)
          dottedLine(remarksStartX, pageWidth - margin, y)
          pdf.setDrawColor(0)

          // Write remarks text on dotted line if present
          if (result.remarks) {
            pdf.setFont('courier', 'normal')
            pdf.text(result.remarks, remarksStartX + 2, y)
          }
        } else {
          // Non-yes/no: just show value/remarks after label
          if (result.remarks) {
            pdf.setFont('courier', 'normal')
            pdf.text(result.remarks, yesNoX, y)
          }
        }

        y += Math.max(labelLines.length * 11, 14)
      })

      // Dotted separator between categories
      y += 6
      pdf.setDrawColor(150, 150, 150)
      pdf.setLineWidth(0.3)
      dottedLine(margin, pageWidth - margin, y)
      y += 6
      dottedLine(margin, pageWidth - margin, y)
      y += 10
      pdf.setDrawColor(0)
    })

    // Empty state
    if (catNames.length === 0) {
      pdf.setFont('courier', 'italic')
      pdf.setFontSize(9)
      pdf.setTextColor(120, 120, 120)
      pdf.text('No inspection parameters recorded.', margin, y)
      y += 30
      pdf.setTextColor(0, 0, 0)
    }

    // ════════════════════════════════════
    // ── OKEY TO LOAD / REJECTED ──
    // ════════════════════════════════════
    checkPageBreak(100)
    y += 8

    const status = (inspection.value.status || '').toUpperCase()
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)

    pdf.text('OKEY TO LOAD :', margin, y)
    const okBoxX = margin + pdf.getTextWidth('OKEY TO LOAD : ')
    pdf.setLineWidth(0.5)
    pdf.rect(okBoxX, y - 8, 8, 8, 'S')
    if (status === 'APPROVED' || status === 'CLOSED') {
      pdf.text('X', okBoxX + 1.5, y - 1)
    }

    const rejLabelX = okBoxX + 22
    pdf.text('REJECTED :', rejLabelX, y)
    const rejBoxX = rejLabelX + pdf.getTextWidth('REJECTED : ')
    pdf.rect(rejBoxX, y - 8, 8, 8, 'S')
    if (status === 'REJECTED') {
      pdf.text('X', rejBoxX + 1.5, y - 1)
    }
    y += 14

    // Remarks
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(10)
    pdf.text('Remarks :', margin, y)
    pdf.setFont('courier', 'normal')
    if (narrations) {
      const remLines = pdf.splitTextToSize(narrations, pageWidth - margin * 2 - pdf.getTextWidth('Remarks : '))
      pdf.text(remLines, margin + pdf.getTextWidth('Remarks : '), y)
      y += remLines.length * 12 + 4
    } else {
      y += 14
    }

    // Dotted spacer lines
    pdf.setDrawColor(150, 150, 150)
    pdf.setLineWidth(0.3)
    for (let i = 0; i < 3; i++) {
      dottedLine(margin, pageWidth - margin, y)
      y += 14
    }
    pdf.setDrawColor(0)
    y += 10

    // ══════════════════════════
    // ── INSPECTED BY ──
    // ══════════════════════════
    checkPageBreak(70)

    pdf.setFont('courier', 'bold')
    pdf.setFontSize(10)
    pdf.text(`INSPECTED BY: ${inspectorName.toUpperCase()},`, margin, y)
    y += 22

    // Date
    pdf.text('Date : ', margin, y)
    pdf.setFont('courier', 'normal')
    if (inspectedAt) {
      pdf.text(inspectedAt, margin + pdf.getTextWidth('Date : '), y)
    } else {
      dottedLine(margin + pdf.getTextWidth('Date : '), margin + 200, y)
    }
    y += 22

    // Signature
    pdf.setFont('courier', 'bold')
    pdf.text('SIGNATURE ', margin, y)
    pdf.setFont('courier', 'normal')
    pdf.setDrawColor(150, 150, 150)
    pdf.setLineWidth(0.3)
    dottedLine(margin + pdf.getTextWidth('SIGNATURE '), margin + 250, y)
    pdf.setDrawColor(0)

    // Generate blob
    const blob = pdf.output('blob')
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = URL.createObjectURL(blob)
    hasGeneratedPdf.value = true
  } finally {
    generatingPdf.value = false
  }
}

onMounted(() => {
  fetchInspection()
})

onBeforeUnmount(() => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
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

    <div v-else-if="!inspection" class="error-container">
      <p class="text-muted">No inspection data available.</p>
    </div>

    <div v-else class="pdf-container">
      <iframe v-if="pdfUrl" class="pdf-frame" :src="pdfUrl" title="Inspection PDF"></iframe>
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
