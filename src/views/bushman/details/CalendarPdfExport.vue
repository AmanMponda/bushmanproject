<template>
  <div class="calendar-pdf-view">
    <!-- Header with Actions -->
    <div class="pdf-header-section">
      <div class="header-content">
        <div class="company-info">
          <h1>Bushman Hunting Safaris Ltd</h1>
          <p class="subtitle">Safari Booking Calendar - {{ year }}</p>
        </div>
        <div class="header-actions">
          <button 
            @click="generatePdf" 
            :disabled="isGenerating"
            class="btn-export"
          >
            <i class="bi bi-file-pdf" v-if="!isGenerating"></i>
            <i class="bi bi-arrow-repeat spin" v-else></i>
            <span>{{ isGenerating ? 'Generating...' : 'Export PDF' }}</span>
          </button>
        </div>
      </div>
      
      <div class="meta-bar">
        <div class="meta-item">
          <i class="bi bi-calendar-event"></i>
          <span>Generated: {{ formatToday() }}</span>
        </div>
        <div class="meta-item">
          <i class="bi bi-bookmark-check"></i>
          <span>Total Bookings: {{ totalBookings }}</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend-bar">
      <div class="legend-items">
        <div class="legend-item">
          <span class="indicator hunt"></span>
          <span>Hunt Booking</span>
        </div>
        <div class="legend-item">
          <span class="indicator travel"></span>
          <span>Travel/Transit</span>
        </div>
      </div>
      <div class="stats-summary">
        <span class="stat-badge hunt">{{ huntCount }} Hunts</span>
        <span class="stat-badge travel">{{ travelCount }} Travels</span>
        <span class="stat-badge areas">{{ activeAreasCount }} Areas</span>
      </div>
    </div>

    <!-- Calendar Grid - Visible on Page -->
    <div class="calendar-grid">
      <div 
        v-for="monthIndex in 12" 
        :key="monthIndex" 
        class="month-card"
      >
        <div class="month-header">
          <h3>{{ getMonthName(monthIndex - 1) }}</h3>
        </div>
        
        <table class="month-table">
          <thead>
            <tr>
              <th v-for="day in weekDays" :key="day">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(week, weekIdx) in getWeeksForMonth(monthIndex - 1)" :key="weekIdx">
              <td 
                v-for="(day, dayIdx) in week" 
                :key="dayIdx"
                :class="getCellClass(monthIndex - 1, day)"
              >
                <div class="day-content">
                  <span class="day-number">{{ day || '' }}</span>
                  <div v-if="day" class="day-events">
                    <span 
                      v-for="event in getEventsForDay(monthIndex - 1, day)" 
                      :key="event.id"
                      class="event-badge"
                      :class="event.type"
                      :title="event.title"
                    >
                      {{ event.shortLabel }}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Import Data
import bookingsData2026 from '@/assets/data/bookings_2026.json'
import bookingsData2025 from '@/assets/data/bookings_2025.json'

// Props
const props = defineProps<{
  year?: number
}>()

// State
const isGenerating = ref(false)
const year = ref(props.year || 2026)
const events = ref<any[]>([])

// Constants
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const monthsMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
}

// Computed
const totalBookings = computed(() => events.value.length)
const huntCount = computed(() => events.value.filter(e => e.type === 'hunt').length)
const travelCount = computed(() => events.value.filter(e => e.type === 'travel').length)
const activeAreasCount = computed(() => {
  const areas = new Set(events.value.map(e => e.area))
  return areas.size
})

// Methods
const getMonthName = (monthIndex: number) => monthNames[monthIndex]

const formatToday = () => {
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const getWeeksForMonth = (monthIndex: number) => {
  const firstDay = new Date(year.value, monthIndex, 1).getDay()
  const daysInMonth = new Date(year.value, monthIndex + 1, 0).getDate()
  
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []
  
  // Fill empty days before month starts
  for (let i = 0; i < firstDay; i++) {
    week.push(null)
  }
  
  // Fill days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day)
    
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  
  // Fill remaining days to complete the last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null)
    }
    weeks.push(week)
  }
  
  // Ensure we always have 6 weeks for consistent layout
  while (weeks.length < 6) {
    weeks.push(Array(7).fill(null))
  }
  
  return weeks
}

const getEventsForDay = (monthIndex: number, day: number) => {
  return events.value.filter(event => {
    return event.month === monthIndex && 
           event.startDay <= day && 
           event.endDay >= day
  })
}

const getCellClass = (monthIndex: number, day: number | null) => {
  if (!day) return 'empty-cell'
  
  const eventsForDay = getEventsForDay(monthIndex, day)
  if (eventsForDay.length === 0) return ''
  
  const hasHunt = eventsForDay.some(e => e.type === 'hunt')
  const hasTravel = eventsForDay.some(e => e.type === 'travel')
  
  if (hasHunt && hasTravel) return 'has-both'
  if (hasHunt) return 'has-hunt'
  if (hasTravel) return 'has-travel'
  
  return ''
}

const processBookingData = (yearData: number) => {
  const rawData = yearData === 2026 ? bookingsData2026 : bookingsData2025
  const processedEvents: any[] = []
  
  rawData.forEach((monthData: any) => {
    const monthKey = monthData.id.toLowerCase().substring(0, 3)
    const monthIndex = monthsMap[monthKey]
    if (monthIndex === undefined) return
    
    if (monthData.areas) {
      monthData.areas.forEach((area: any) => {
        if (area.rows && area.rows.length > 0) {
          area.rows.forEach((row: any) => {
            if (row.segments) {
              row.segments.forEach((seg: any, segIdx: number) => {
                processedEvents.push({
                  id: `${monthIndex}-${area.name}-${row.clientName}-${segIdx}`,
                  month: monthIndex,
                  startDay: seg.start,
                  endDay: seg.end,
                  type: seg.type,
                  area: area.name,
                  client: row.clientName,
                  title: `${row.clientName} (${area.name})`,
                  shortLabel: seg.type === 'hunt' ? 'H' : 'T'
                })
              })
            }
          })
        }
      })
    }
  })
  
  events.value = processedEvents
}

const buildDailyCounts = () => {
  const map = new Map<string, { hunt: number; travel: number }>()
  
  events.value.forEach(event => {
    for (let day = event.startDay; day <= event.endDay; day++) {
      const dateKey = `${year.value}-${String(event.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      if (!map.has(dateKey)) {
        map.set(dateKey, { hunt: 0, travel: 0 })
      }
      const counts = map.get(dateKey)
      if (counts) {
        if (event.type === 'hunt') counts.hunt += 1
        if (event.type === 'travel') counts.travel += 1
      }
    }
  })
  
  return map
}

const generatePdf = async () => {
  if (isGenerating.value) return
  
  isGenerating.value = true
  
  try {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40
    const countsByDay = buildDailyCounts()
    
    // Header
    const headerTop = margin
    
    // Top border line
    pdf.setLineWidth(2)
    pdf.setDrawColor(26, 26, 26)
    pdf.line(margin, headerTop, pageWidth - margin, headerTop)
    
    // Company name
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.setTextColor(26, 26, 26)
    pdf.text('Bushman Hunting Safaris Ltd', pageWidth / 2, headerTop + 25, { align: 'center' })
    
    // Subtitle
    pdf.setFontSize(14)
    pdf.setTextColor(16, 185, 129)
    pdf.text(`Safari Booking Calendar - ${year.value}`, pageWidth / 2, headerTop + 45, { align: 'center' })
    
    // Meta info
    pdf.setFontSize(9)
    pdf.setTextColor(107, 114, 128)
    pdf.text(`Generated: ${formatToday()}`, margin, headerTop + 65)
    pdf.text(`Total Bookings: ${totalBookings.value}`, pageWidth - margin, headerTop + 65, { align: 'right' })
    
    // Bottom border line
    pdf.setLineWidth(1)
    pdf.setDrawColor(229, 231, 235)
    pdf.line(margin, headerTop + 75, pageWidth - margin, headerTop + 75)
    
    // Calendar Grid
    const gridTop = headerTop + 95
    const gapX = 12
    const gapY = 12
    const columns = 3
    const rows = 4
    const gridWidth = pageWidth - margin * 2
    const gridHeight = pageHeight - gridTop - margin - 40 // Reserve space for footer
    const monthBoxWidth = (gridWidth - gapX * (columns - 1)) / columns
    const monthBoxHeight = (gridHeight - gapY * (rows - 1)) / rows
    const cellWidth = monthBoxWidth / 7
    const rowHeight = Math.min(16, (monthBoxHeight - 28) / 7)
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const col = monthIndex % columns
      const row = Math.floor(monthIndex / columns)
      const startX = margin + col * (monthBoxWidth + gapX)
      const startY = gridTop + row * (monthBoxHeight + gapY)
      
      // Month name
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(26, 26, 26)
      pdf.text(monthNames[monthIndex], startX + monthBoxWidth / 2, startY + 12, { align: 'center' })
      
      // Build calendar data
      const firstDay = new Date(year.value, monthIndex, 1).getDay()
      const daysInMonth = new Date(year.value, monthIndex + 1, 0).getDate()
      const bodyRows: string[][] = []
      let week = new Array(7).fill('')
      
      for (let i = 0; i < firstDay; i++) {
        week[i] = ''
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const weekDay = (firstDay + day - 1) % 7
        const dateKey = `${year.value}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const counts = countsByDay.get(dateKey)
        let label = String(day)
        if (counts && (counts.hunt || counts.travel)) {
          const huntLabel = counts.hunt ? `H${counts.hunt}` : ''
          const travelLabel = counts.travel ? `T${counts.travel}` : ''
          label = `${label}\n${huntLabel}${huntLabel && travelLabel ? ' ' : ''}${travelLabel}`
        }
        week[weekDay] = label
        
        if (weekDay === 6 || day === daysInMonth) {
          bodyRows.push(week)
          week = new Array(7).fill('')
        }
      }
      
      while (bodyRows.length < 6) {
        bodyRows.push(new Array(7).fill(''))
      }
      
      // Draw table using autoTable
      autoTable(pdf, {
        startY: startY + 20,
        margin: { left: startX, right: pageWidth - startX - monthBoxWidth },
        head: [weekDays],
        body: bodyRows,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          minCellHeight: rowHeight,
          valign: 'top',
          lineColor: [229, 231, 235],
          textColor: [26, 26, 26],
          halign: 'center'
        },
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [107, 114, 128],
          fontStyle: 'bold',
          fontSize: 7
        },
        columnStyles: {
          0: { cellWidth },
          1: { cellWidth },
          2: { cellWidth },
          3: { cellWidth },
          4: { cellWidth },
          5: { cellWidth },
          6: { cellWidth }
        },
        tableWidth: monthBoxWidth
      })
    }
    
    // Footer with legend
    const footerY = pageHeight - margin - 20
    pdf.setLineWidth(1)
    pdf.setDrawColor(229, 231, 235)
    pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10)
    
    // Legend
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    
    // Hunt indicator
    pdf.setFillColor(16, 185, 129)
    pdf.rect(margin, footerY, 12, 12, 'F')
    pdf.setTextColor(26, 26, 26)
    pdf.text('Hunt Booking', margin + 18, footerY + 9)
    
    // Travel indicator
    pdf.setFillColor(14, 165, 233)
    pdf.rect(margin + 120, footerY, 12, 12, 'F')
    pdf.text('Travel/Transit', margin + 138, footerY + 9)
    
    // Stats
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(107, 114, 128)
    const statsText = `${huntCount.value} Hunts  •  ${travelCount.value} Travels  •  ${activeAreasCount.value} Active Areas`
    pdf.text(statsText, pageWidth - margin, footerY + 9, { align: 'right' })
    
    // Open PDF in browser (same approach as requisition)
    const blob = pdf.output('blob')
    const url = URL.createObjectURL(blob)
    window.location.replace(url)
    
  } catch (error) {
    console.error('PDF generation failed:', error)
    alert('Failed to generate PDF. Please try again.')
  } finally {
    isGenerating.value = false
  }
}

// Lifecycle
onMounted(() => {
  processBookingData(year.value)
})

// Expose methods for parent component
defineExpose({
  generatePdf
})
</script>

<style scoped>
.calendar-pdf-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #ffffff;
}

/* Header Section */
.pdf-header-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid #1a1a1a;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.company-info h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.company-info .subtitle {
  font-size: 1.125rem;
  color: #10b981;
  font-weight: 600;
  margin: 0;
}

.header-actions .btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.header-actions .btn-export:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.header-actions .btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.header-actions .btn-export i {
  font-size: 1.125rem;
}

.meta-bar {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item i {
  color: #10b981;
}

/* Legend Bar */
.legend-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
  border: 1px solid #e5e7eb;
}

.legend-items {
  display: flex;
  gap: 2rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.indicator.hunt {
  background: #10b981;
}

.indicator.travel {
  background: #0ea5e9;
}

.stats-summary {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.stat-badge.hunt {
  background: #d1fae5;
  color: #065f46;
}

.stat-badge.travel {
  background: #dbeafe;
  color: #075985;
}

.stat-badge.areas {
  background: #fef3c7;
  color: #92400e;
}

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.month-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.month-header {
  background: #f3f4f6;
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.month-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
}

/* Month Table */
.month-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.month-table thead th {
  background: #f9fafb;
  padding: 0.5rem 0.25rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.month-table tbody td {
  border: 1px solid #f3f4f6;
  padding: 0.375rem;
  height: 3.5rem;
  vertical-align: top;
  text-align: center;
  transition: background-color 0.15s;
}

.month-table tbody td:hover:not(.empty-cell) {
  background: #f9fafb;
}

.month-table tbody td.empty-cell {
  background: #fafafa;
}

.month-table tbody td.has-hunt {
  background: #d1fae5;
}

.month-table tbody td.has-travel {
  background: #dbeafe;
}

.month-table tbody td.has-both {
  background: linear-gradient(135deg, #d1fae5 50%, #dbeafe 50%);
}

.day-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.day-number {
  font-weight: 700;
  font-size: 0.875rem;
  color: #1a1a1a;
}

.day-events {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: transform 0.15s;
}

.event-badge:hover {
  transform: scale(1.1);
}

.event-badge.hunt {
  background: #10b981;
}

.event-badge.travel {
  background: #0ea5e9;
}

/* Animation */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 1200px) {
  .calendar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .calendar-pdf-view {
    padding: 1rem;
  }

  .calendar-grid {
    grid-template-columns: 1fr;
  }

  .company-info h1 {
    font-size: 1.5rem;
  }

  .legend-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-summary {
    width: 100%;
  }
}

/* Print Styles */
@media print {
  .calendar-pdf-view {
    padding: 0;
  }

  .header-actions {
    display: none;
  }

  .calendar-grid {
    page-break-inside: avoid;
  }

  .month-card {
    page-break-inside: avoid;
  }
}
</style>
