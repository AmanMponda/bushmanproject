<template>
  <div class="pdf-generator">
    <!-- PDF Settings Modal -->
    <div v-if="showSettings" class="pdf-modal-overlay" @click.self="closeSettings">
      <div class="pdf-modal">
        <div class="pdf-modal-header">
          <h3><i class="bi bi-file-earmark-pdf me-2"></i>Export Calendar PDF</h3>
          <button class="modal-close" @click="closeSettings"><i class="bi bi-x-lg"></i></button>
        </div>
        
        <div class="pdf-modal-body">
          <!-- Year Selection -->
          <div class="setting-group">
            <label class="setting-label">Year</label>
            <select v-model="settings.year" class="form-select">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>

          <!-- Month Range -->
          <div class="setting-row">
            <div class="setting-group">
              <label class="setting-label">Start Month</label>
              <select v-model="settings.startMonth" class="form-select">
                <option v-for="(month, idx) in monthLabels" :key="idx" :value="idx">{{ month }}</option>
              </select>
            </div>
            <div class="setting-group">
              <label class="setting-label">End Month</label>
              <select v-model="settings.endMonth" class="form-select">
                <option v-for="(month, idx) in monthLabels" :key="idx" :value="idx">{{ month }}</option>
              </select>
            </div>
          </div>

          <!-- Months Per Page -->
          <div class="setting-group">
            <label class="setting-label">Months Per Page</label>
            <div class="btn-group-setting">
              <button 
                v-for="n in [3, 4, 6]" 
                :key="n"
                class="btn-option" 
                :class="{ active: settings.monthsPerPage === n }"
                @click="settings.monthsPerPage = n"
              >
                {{ n }} Months
              </button>
            </div>
          </div>

          <!-- Page Orientation -->
          <div class="setting-group">
            <label class="setting-label">Orientation</label>
            <div class="btn-group-setting">
              <button 
                class="btn-option" 
                :class="{ active: settings.orientation === 'landscape' }"
                @click="settings.orientation = 'landscape'"
              >
                <i class="bi bi-phone-landscape me-1"></i> Landscape
              </button>
              <button 
                class="btn-option" 
                :class="{ active: settings.orientation === 'portrait' }"
                @click="settings.orientation = 'portrait'"
              >
                <i class="bi bi-phone me-1"></i> Portrait
              </button>
            </div>
          </div>

          <!-- Color Theme -->
          <div class="setting-group">
            <label class="setting-label">Theme Color</label>
            <div class="color-options">
              <button 
                v-for="color in themeColors" 
                :key="color.name"
                class="color-btn"
                :class="{ active: settings.themeColor === color.name }"
                :style="{ background: color.value }"
                @click="settings.themeColor = color.name"
                :title="color.label"
              ></button>
            </div>
          </div>

          <!-- Include Options -->
          <div class="setting-group">
            <label class="setting-label">Include</label>
            <div class="checkbox-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="settings.showLegend" />
                <span>Legend</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="settings.highlightToday" />
                <span>Highlight Today</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="settings.showEventLabels" />
                <span>Event Labels</span>
              </label>
            </div>
          </div>

          <!-- Preview Summary -->
          <div class="preview-summary">
            <i class="bi bi-info-circle me-2"></i>
            <span>
              {{ previewText }}
            </span>
          </div>
        </div>

        <div class="pdf-modal-footer">
          <button class="btn btn-secondary" @click="closeSettings">Cancel</button>
          <button class="btn btn-primary" @click="generatePdf" :disabled="generating">
            <span v-if="generating" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-download me-2"></i>
            {{ generating ? 'Generating...' : 'Generate PDF' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import jsPDF from 'jspdf'

// Props
const props = defineProps<{
  modelValue: boolean
  bookingData?: any[]
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'generated'): void
}>()

// State
const generating = ref(false)
const showSettings = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Settings
const currentYearValue = new Date().getFullYear()
const availableYears = Array.from({ length: 8 }, (_, i) => currentYearValue - 2 + i)

const settings = reactive({
  year: currentYearValue,
  startMonth: 0,
  endMonth: 11,
  monthsPerPage: 6,
  orientation: 'landscape' as 'landscape' | 'portrait',
  themeColor: 'green',
  showLegend: true,
  highlightToday: true,
  showEventLabels: true
})

const monthLabels = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const themeColors = [
  { name: 'green', value: '#10b981', label: 'Safari Green' },
  { name: 'blue', value: '#3b82f6', label: 'Ocean Blue' },
  { name: 'orange', value: '#f97316', label: 'Sunset Orange' },
  { name: 'purple', value: '#8b5cf6', label: 'Royal Purple' },
  { name: 'red', value: '#ef4444', label: 'Ruby Red' },
  { name: 'teal', value: '#14b8a6', label: 'Teal' }
]

const colorMap: Record<string, [number, number, number]> = {
  green: [16, 185, 129],
  blue: [59, 130, 246],
  orange: [249, 115, 22],
  purple: [139, 92, 246],
  red: [239, 68, 68],
  teal: [20, 184, 166]
}

// Booking data store
const bookingsDataStore: Record<number, any[]> = {}

const loadBookingData = async (year: number): Promise<any[]> => {
  if (props.bookingData) {
    return props.bookingData
  }
  
  if (bookingsDataStore[year]) {
    return bookingsDataStore[year]
  }
  
  try {
    const data = await import(`@/assets/data/bookings_${year}.json`)
    bookingsDataStore[year] = data.default || data
    return bookingsDataStore[year]
  } catch (error) {
    console.warn(`No booking data found for year ${year}`)
    bookingsDataStore[year] = []
    return bookingsDataStore[year]
  }
}

const monthsMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
}

const buildEventsMap = (rawData: any[], year: number) => {
  const events: Array<{ startDate: Date; endDate: Date; type: string; label: string; id: string }> = []
  let eventIdCounter = 0

  rawData.forEach((monthData: any) => {
    const monthLabel = (monthData.id || monthData.name || '').toLowerCase()
    const monthKey = monthLabel.substring(0, 3)
    const monthIndex = monthsMap[monthKey]
    if (monthIndex === undefined) return

    if (monthData.areas) {
      monthData.areas.forEach((area: any) => {
        if (area.rows && area.rows.length > 0) {
          area.rows.forEach((row: any) => {
            if (row.segments) {
              row.segments.forEach((seg: any) => {
                const startDate = new Date(year, monthIndex, seg.start)
                const endDate = new Date(year, monthIndex, seg.end)
                events.push({
                  startDate,
                  endDate,
                  type: seg.type,
                  label: row.clientName || seg.label || '',
                  id: `evt-${eventIdCounter++}`
                })
              })
            }
          })
        }
      })
    }
  })

  return events
}

// Computed
const previewText = computed(() => {
  const monthCount = settings.endMonth - settings.startMonth + 1
  const pageCount = Math.ceil(monthCount / settings.monthsPerPage)
  return `${monthLabels[settings.startMonth]} - ${monthLabels[settings.endMonth]} ${settings.year} • ${monthCount} months • ${pageCount} page${pageCount > 1 ? 's' : ''}`
})

// Methods
const closeSettings = () => {
  showSettings.value = false
}

const generatePdf = async () => {
  generating.value = true
  
  try {
    const pdf = new jsPDF({ 
      orientation: settings.orientation, 
      unit: 'pt', 
      format: 'a4' 
    })
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 25
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Colors
    const primaryColor = colorMap[settings.themeColor] || colorMap.green
    const huntGreen: [number, number, number] = [16, 185, 129]
    const travelBlue: [number, number, number] = [14, 165, 233]
    const headerBg: [number, number, number] = [245, 247, 250]
    const borderColor: [number, number, number] = [229, 231, 235]
    const textDark: [number, number, number] = [17, 24, 39]
    const textMuted: [number, number, number] = [107, 114, 128]
    const white: [number, number, number] = [255, 255, 255]
    const accentOrange: [number, number, number] = [249, 115, 22]

    // Load events
    const rawData = await loadBookingData(settings.year)
    const allEvents = buildEventsMap(rawData, settings.year)

    // Calculate pages
    const monthsToRender = []
    for (let m = settings.startMonth; m <= settings.endMonth; m++) {
      monthsToRender.push(m)
    }
    
    const totalPages = Math.ceil(monthsToRender.length / settings.monthsPerPage)
    const columns = settings.monthsPerPage <= 4 ? 2 : 3
    const rows = Math.ceil(settings.monthsPerPage / columns)

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        pdf.addPage()
      }

      const pageMonthStart = pageNum * settings.monthsPerPage
      const pageMonths = monthsToRender.slice(pageMonthStart, pageMonthStart + settings.monthsPerPage)
      
      // Header
      const headerHeight = 50
      pdf.setFillColor(...primaryColor)
      pdf.roundedRect(margin, margin, pageWidth - margin * 2, headerHeight, 8, 8, 'F')
      
      // Logo placeholder
      pdf.setFillColor(...white)
      pdf.circle(margin + 28, margin + headerHeight / 2, 14, 'F')
      pdf.setFillColor(...primaryColor)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text('B', margin + 23, margin + headerHeight / 2 + 5)
      
      // Title
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.setTextColor(...white)
      pdf.text('Safari Booking Calendar', margin + 50, margin + 22)
      
      // Subtitle
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const startMonthLabel = monthLabels[pageMonths[0]]
      const endMonthLabel = monthLabels[pageMonths[pageMonths.length - 1]]
      pdf.text(`${startMonthLabel} - ${endMonthLabel} ${settings.year}`, margin + 50, margin + 38)
      
      // Page indicator
      if (totalPages > 1) {
        pdf.setFillColor(...white)
        pdf.roundedRect(pageWidth - margin - 70, margin + 12, 55, 22, 4, 4, 'F')
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.setTextColor(...primaryColor)
        pdf.text(`Page ${pageNum + 1}/${totalPages}`, pageWidth - margin - 42, margin + 27, { align: 'center' })
      }

      // Calendar Grid
      const gridTop = margin + headerHeight + 12
      const gapX = 10
      const gapY = 10
      const legendHeight = settings.showLegend ? 30 : 0
      const gridWidth = pageWidth - margin * 2
      const gridHeight = pageHeight - gridTop - margin - legendHeight - 10
      const monthBoxWidth = (gridWidth - gapX * (columns - 1)) / columns
      const monthBoxHeight = (gridHeight - gapY * (rows - 1)) / rows
      const cellWidth = monthBoxWidth / 7
      const cellHeight = (monthBoxHeight - 30) / 6.5

      pageMonths.forEach((monthIndex, i) => {
        const col = i % columns
        const row = Math.floor(i / columns)
        const startX = margin + col * (monthBoxWidth + gapX)
        const startY = gridTop + row * (monthBoxHeight + gapY)

        // Month box
        pdf.setFillColor(...white)
        pdf.setDrawColor(...borderColor)
        pdf.setLineWidth(0.75)
        pdf.roundedRect(startX, startY, monthBoxWidth, monthBoxHeight, 5, 5, 'FD')

        // Month header
        pdf.setFillColor(...primaryColor)
        pdf.roundedRect(startX, startY, monthBoxWidth, 24, 5, 5, 'F')
        pdf.rect(startX, startY + 18, monthBoxWidth, 6, 'F')
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(...white)
        pdf.text(monthLabels[monthIndex].toUpperCase(), startX + monthBoxWidth / 2, startY + 16, { align: 'center' })

        // Weekday headers
        const weekHeaderY = startY + 35
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7)
        pdf.setTextColor(...textMuted)
        for (let d = 0; d < 7; d++) {
          pdf.text(weekDays[d], startX + d * cellWidth + cellWidth / 2, weekHeaderY, { align: 'center' })
        }

        // Days
        const firstDay = new Date(settings.year, monthIndex, 1).getDay()
        const daysInMonth = new Date(settings.year, monthIndex + 1, 0).getDate()
        const cellStartY = weekHeaderY + 8

        // Draw day numbers and highlights first
        let currentRow = 0
        for (let day = 1; day <= daysInMonth; day++) {
          const weekDay = (firstDay + day - 1) % 7
          const cellX = startX + weekDay * cellWidth
          const cellY = cellStartY + currentRow * cellHeight
          
          // Today highlight
          const today = new Date()
          const isToday = settings.highlightToday && 
                          today.getFullYear() === settings.year && 
                          today.getMonth() === monthIndex && 
                          today.getDate() === day

          if (isToday) {
            pdf.setFillColor(...accentOrange)
            pdf.circle(cellX + cellWidth / 2, cellY + 5, 7, 'F')
            pdf.setTextColor(...white)
          } else {
            pdf.setTextColor(...textDark)
          }
          
          pdf.setFont('helvetica', isToday ? 'bold' : 'normal')
          pdf.setFontSize(8)
          pdf.text(String(day), cellX + cellWidth / 2, cellY + 8, { align: 'center' })

          if (weekDay === 6) currentRow++
        }

        // Draw continuous event bars
        const monthStart = new Date(settings.year, monthIndex, 1)
        const monthEnd = new Date(settings.year, monthIndex + 1, 0)
        const monthEvents = allEvents.filter(evt => 
          evt.startDate <= monthEnd && evt.endDate >= monthStart
        )

        // Group events by row to stack them
        const eventRows: Array<Array<any>> = []
        monthEvents.forEach(evt => {
          let placed = false
          for (const row of eventRows) {
            const hasOverlap = row.some(existingEvt => 
              !(evt.endDate < existingEvt.startDate || evt.startDate > existingEvt.endDate)
            )
            if (!hasOverlap) {
              row.push(evt)
              placed = true
              break
            }
          }
          if (!placed) {
            eventRows.push([evt])
          }
        })

        const barHeight = 5.5
        const barSpacing = 1
        const maxBars = 2

        eventRows.slice(0, maxBars).forEach((row, rowIndex) => {
          row.forEach(evt => {
            const evtStartDate = evt.startDate < monthStart ? monthStart : evt.startDate
            const evtEndDate = evt.endDate > monthEnd ? monthEnd : evt.endDate
            
            const startDay = evtStartDate.getDate()
            const endDay = evtEndDate.getDate()
            
            // Determine event color
            const evtColor: [number, number, number] = evt.type === 'hunt' ? huntGreen : travelBlue

            // Split event into week-row segments and draw one continuous bar per calendar row
            let day = startDay
            while (day <= endDay) {
              const dayOffset = firstDay + day - 1
              const col = dayOffset % 7
              const weekRow = Math.floor(dayOffset / 7)

              // How many days left until Saturday (end of this calendar row)
              const daysUntilSaturday = 6 - col
              const rowEndDay = Math.min(day + daysUntilSaturday, endDay)
              const endCol = (firstDay + rowEndDay - 1) % 7

              // Calculate single continuous bar coordinates
              const barStartX = startX + col * cellWidth + 1
              const barEndX = startX + (endCol + 1) * cellWidth - 1
              const barWidth = barEndX - barStartX
              const cellY = cellStartY + weekRow * cellHeight
              const barY = cellY + 12 + rowIndex * (barHeight + barSpacing)

              const isEventStart = day === startDay
              const isEventEnd = rowEndDay === endDay
              const radius = 2.5

              // IMPORTANT: Re-set fill color before every draw call
              // (jsPDF setTextColor can override the fill state)
              pdf.setFillColor(...evtColor)

              if (isEventStart && isEventEnd) {
                pdf.roundedRect(barStartX, barY, barWidth, barHeight, radius, radius, 'F')
              } else if (isEventStart) {
                // Round left, extend flush to right edge
                pdf.roundedRect(barStartX, barY, barWidth + 1, barHeight, radius, radius, 'F')
                pdf.setFillColor(...evtColor)
                pdf.rect(barStartX + barWidth - radius, barY, radius + 1, barHeight, 'F')
              } else if (isEventEnd) {
                // Extend flush from left edge, round right
                pdf.roundedRect(barStartX - 1, barY, barWidth + 1, barHeight, radius, radius, 'F')
                pdf.setFillColor(...evtColor)
                pdf.rect(barStartX - 1, barY, radius + 1, barHeight, 'F')
              } else {
                // Middle rows: full width, no rounding
                pdf.rect(barStartX - 1, barY, barWidth + 2, barHeight, 'F')
              }

              // Draw label text on each row segment
              if (settings.showEventLabels) {
                const maxChars = Math.max(6, Math.floor(barWidth / 3))
                const label = (evt.label || '').substring(0, maxChars)
                if (label) {
                  pdf.setFontSize(5)
                  pdf.setFont('helvetica', 'bold')
                  pdf.setTextColor(...white)
                  pdf.text(label, barStartX + 2, barY + 4)
                }
              }

              day = rowEndDay + 1
            }
          })
        })

        // Show overflow indicator if there are more events than can be displayed
        if (eventRows.length > maxBars) {
          const lastVisibleRow = maxBars - 1
          const indicatorY = cellStartY + 12 + lastVisibleRow * (barHeight + barSpacing) + barHeight + 2
          pdf.setFontSize(4)
          pdf.setTextColor(...textMuted)
          pdf.text(`+${eventRows.length - maxBars} more`, startX + 2, indicatorY)
        }
      })

      // Footer/Legend
      if (settings.showLegend) {
        const footerY = pageHeight - margin - 8
        pdf.setFillColor(...headerBg)
        pdf.roundedRect(margin, footerY - 12, pageWidth - margin * 2, 22, 4, 4, 'F')
        
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        
        pdf.setFillColor(...huntGreen)
        pdf.roundedRect(margin + 12, footerY - 5, 12, 7, 2, 2, 'F')
        pdf.setTextColor(...textDark)
        pdf.text('Hunt', margin + 28, footerY + 1)
        
        pdf.setFillColor(...travelBlue)
        pdf.roundedRect(margin + 65, footerY - 5, 12, 7, 2, 2, 'F')
        pdf.text('Travel', margin + 81, footerY + 1)

        if (settings.highlightToday) {
          pdf.setFillColor(...accentOrange)
          pdf.circle(margin + 130, footerY - 1, 4, 'F')
          pdf.text('Today', margin + 138, footerY + 1)
        }

        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...textMuted)
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, pageWidth - margin - 12, footerY + 1, { align: 'right' })
      }
    }

    // Open PDF
    const pdfBlob = pdf.output('blob')
    const blobUrl = URL.createObjectURL(pdfBlob)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
    
    emit('generated')
    closeSettings()
  } catch (err) {
    console.error('Failed to generate PDF:', err)
    alert('Failed to generate PDF. Please try again.')
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.pdf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.pdf-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pdf-modal-header {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pdf-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.modal-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.pdf-modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 1.25rem;
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.setting-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.btn-group-setting {
  display: flex;
  gap: 0.5rem;
}

.btn-option {
  flex: 1;
  padding: 0.625rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-option:hover {
  background: #e5e7eb;
}

.btn-option.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.color-options {
  display: flex;
  gap: 0.75rem;
}

.color-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #1f2937;
  box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
}

.color-btn.active::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.checkbox-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
  cursor: pointer;
}

.preview-summary {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #166534;
  display: flex;
  align-items: center;
}

.pdf-modal-footer {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
