<template>
  <div class="calendar-page" ref="calendarRef">
    <!-- Simple Header -->
    <div class="cal-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="cal-heading">Safari Calendar</h1>
          <span class="cal-year-badge">{{ currentYear }}</span>
        </div>
        <div class="header-actions">
          <button class="cal-btn cal-btn-secondary" @click="downloadPdf" :disabled="downloadingPdf">
            <i class="bi bi-file-pdf"></i>
            <span>{{ downloadingPdf ? 'Generating...' : 'Export PDF' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-number">{{ totalEvents }}</div>
        <div class="stat-text">Total Bookings</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ huntEvents }}</div>
        <div class="stat-text">Hunts</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ travelEvents }}</div>
        <div class="stat-text">Travel Days</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ activeAreas.value }}</div>
        <div class="stat-text">Active Areas</div>
      </div>
    </div>

    <!-- Calendar Controls -->
    <div class="cal-controls">
      <div class="nav-buttons">
        <button class="cal-btn-nav" @click="prev"><i class="bi bi-chevron-left"></i></button>
        <button class="cal-btn-nav today-btn" @click="today">Today</button>
        <button class="cal-btn-nav" @click="next"><i class="bi bi-chevron-right"></i></button>
      </div>
      <h2 class="current-view-title">{{ calendarTitle }}</h2>
      <div class="view-switcher">
        <button class="view-btn" :class="{ active: activeView === 'multiMonthYear' }" @click="setView('multiMonthYear')">Year</button>
        <button class="view-btn" :class="{ active: activeView === 'dayGridMonth' }" @click="setView('dayGridMonth')">Month</button>
        <button class="view-btn" :class="{ active: activeView === 'listMonth' }" @click="setView('listMonth')">List</button>
      </div>
    </div>

    <!-- Legend -->
    <div class="cal-legend">
      <div class="legend-item"><span class="legend-dot hunt"></span> Hunt</div>
      <div class="legend-item"><span class="legend-dot travel"></span> Travel</div>
    </div>

    <!-- Calendar -->
    <div class="calendar-wrapper">
      <FullCalendar :options="calendarOptions" ref="fullCalendarRef" />
    </div>

    <!-- Event Modal -->
    <div v-if="selectedEvent" class="event-modal-overlay" @click.self="closeModal">
      <div class="event-modal">
        <div class="event-modal-header" :style="{ background: selectedEvent.extendedProps.type === 'hunt' ? '#10b981' : '#0ea5e9' }">
          <h3>{{ selectedEvent.title }}</h3>
          <button class="modal-close" @click="closeModal"><i class="bi bi-x"></i></button>
        </div>
        <div class="event-modal-body">
          <div class="event-detail">
            <strong>Type:</strong>
            <span class="event-badge" :class="selectedEvent.extendedProps.type">{{ selectedEvent.extendedProps.type }}</span>
          </div>
          <div class="event-detail">
            <strong>Area:</strong> {{ selectedEvent.extendedProps.area }}
          </div>
          <div class="event-detail">
            <strong>Dates:</strong> {{ formatDate(selectedEvent.start) }} - {{ formatDate(selectedEvent.end) }}
          </div>
          <div class="event-detail" v-if="selectedEvent.extendedProps.description">
            <strong>Notes:</strong> {{ selectedEvent.extendedProps.description }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Import Data
import bookingsData2026 from '@/assets/data/bookings_2026.json'
import bookingsData2025 from '@/assets/data/bookings_2025.json'

// --- State ---
const currentYear = ref(2026)
const calendarTitle = ref('')
const availableYears = [2025, 2026]
const activeView = ref('multiMonthYear')
const selectedEvent = ref<any>(null)
const fullCalendarRef = ref<any>(null)
const calendarRef = ref<HTMLElement | null>(null)
const downloadingPdf = ref(false)

// --- Stats Logic ---
const totalEvents = ref(0)
const huntEvents = ref(0)
const travelEvents = ref(0)
const activeAreas = ref(0)

const stats = computed(() => [
    { label: 'Total Events', value: totalEvents.value, icon: 'bi-calendar-check', iconBgClass: 'bg-blue' },
    { label: 'Confirmed Hunts', value: huntEvents.value, icon: 'bi-crosshair', iconBgClass: 'bg-green' },
    { label: 'Travels', value: travelEvents.value, icon: 'bi-airplane', iconBgClass: 'bg-cyan' },
    { label: 'Active Areas', value: activeAreas.value, icon: 'bi-map', iconBgClass: 'bg-orange' },
])

// --- Helper Functions ---
const monthsMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
}

const formatDate = (date: Date) => {
    if (!date) return '-'
    // Subtract 1 day from end date for display because FullCalendar end date is exclusive
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatPdfDay = (day: number) => {
    return String(day)
}

const monthLabels = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const printCalendar = () => {
    window.print()
}

const buildDailyCounts = (year: number) => {
    const rawData = year === 2026 ? bookingsData2026 : bookingsData2025
    const map = new Map<string, { hunt: number; travel: number }>()

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
                                const startDay = seg.start
                                const endDay = seg.end
                                for (let day = startDay; day <= endDay; day += 1) {
                                    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                    if (!map.has(dateKey)) {
                                        map.set(dateKey, { hunt: 0, travel: 0 })
                                    }
                                    const counts = map.get(dateKey)
                                    if (counts) {
                                        if (seg.type === 'hunt') counts.hunt += 1
                                        if (seg.type === 'travel') counts.travel += 1
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
    })

    return map
}

const downloadPdf = async () => {
    if (!calendarRef.value || downloadingPdf.value) return
    downloadingPdf.value = true
    await nextTick()

    try {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margin = 36
        const countsByDay = buildDailyCounts(currentYear.value)
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        const headerTop = margin
        
        pdf.setLineWidth(1.5)
        pdf.setDrawColor(0, 0, 0)
        pdf.line(margin, headerTop - 10, pageWidth - margin, headerTop - 10)
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(18)
        pdf.setTextColor(0, 0, 0)
        pdf.text('Bushman Hunting Safaris Ltd', pageWidth / 2, headerTop + 10, { align: 'center' })
        
        pdf.setFontSize(14)
        pdf.setTextColor(0, 0, 255)
        pdf.text(`${currentYear.value} Safari Bookings`, pageWidth / 2, headerTop + 30, { align: 'center' })
        
        pdf.setLineWidth(1.5)
        pdf.setDrawColor(0, 0, 0)
        pdf.line(margin, headerTop + 40, pageWidth - margin, headerTop + 40)

        const gridTop = headerTop + 60
        const gapX = 12
        const gapY = 14
        const columns = 3
        const rows = 4
        const gridWidth = pageWidth - margin * 2
        const gridHeight = pageHeight - gridTop - margin
        const monthBoxWidth = (gridWidth - gapX * (columns - 1)) / columns
        const monthBoxHeight = (gridHeight - gapY * (rows - 1)) / rows
        const cellWidth = monthBoxWidth / 7
        const rowHeight = Math.min(14, (monthBoxHeight - 24) / 7)

        for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
            const col = monthIndex % columns
            const row = Math.floor(monthIndex / columns)
            const startX = margin + col * (monthBoxWidth + gapX)
            const startY = gridTop + row * (monthBoxHeight + gapY)

            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(0, 0, 0)
            pdf.text(monthLabels[monthIndex], startX + monthBoxWidth / 2, startY + 10, { align: 'center' })

            const firstDay = new Date(currentYear.value, monthIndex, 1).getDay()
            const daysInMonth = new Date(currentYear.value, monthIndex + 1, 0).getDate()
            const bodyRows: string[][] = []
            let week = new Array(7).fill('')

            for (let i = 0; i < firstDay; i += 1) {
                week[i] = ''
            }

            for (let day = 1; day <= daysInMonth; day += 1) {
                const weekDay = (firstDay + day - 1) % 7
                const dateKey = `${currentYear.value}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const counts = countsByDay.get(dateKey)
                let label = formatPdfDay(day)
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

            autoTable(pdf, {
                startY: startY + 16,
                margin: { left: startX, right: pageWidth - startX - monthBoxWidth },
                head: [weekDays],
                body: bodyRows,
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    minCellHeight: rowHeight,
                    valign: 'top',
                    lineColor: [200, 210, 230],
                    textColor: 20
                },
                headStyles: {
                    fillColor: [245, 245, 245],
                    textColor: 80,
                    fontStyle: 'bold'
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

        const blob = pdf.output('blob')
        const url = URL.createObjectURL(blob)
        const previewWindow = window.open('', '_blank', 'noopener')
        if (previewWindow) {
            previewWindow.location.href = url
        } else {
            window.location.href = url
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
        console.error('Failed to export calendar PDF:', err)
    } finally {
        downloadingPdf.value = false
    }
}

// --- Data Transformation ---
const processYearData = (year: number, rawData: any[]) => {
    const events: any[] = []
    
    // We calculate stats here, but since we now load multiple years, 
    // we should only count stats for the "currentYear" to avoid confusion, 
    // or we need a separate stats calculation function.
    // For simplicity, let's extract stats calculation to a watcher.
    
    rawData.forEach((monthData: any) => {
        const monthKey = monthData.id.toLowerCase().substring(0, 3)
        const monthIndex = monthsMap[monthKey]
        if (monthIndex === undefined) return

        if (monthData.areas) {
            monthData.areas.forEach((area: any) => {
                if (area.rows && area.rows.length > 0) {
                     area.rows.forEach((row: any) => {
                         if (row.segments) {
                             row.segments.forEach((seg: any) => {
                                 // FullCalendar Start is inclusive, End is exclusive
                                 const startDate = new Date(year, monthIndex, seg.start)
                                 const endDate = new Date(year, monthIndex, seg.end + 1) // +1 day for exclusive end
                                 
                                 events.push({
                                     title: `${row.clientName} (${area.name})`,
                                     start: startDate,
                                     end: endDate,
                                     backgroundColor: seg.type === 'hunt' ? '#10b981' : '#0ea5e9',
                                     borderColor: seg.type === 'hunt' ? '#10b981' : '#0ea5e9',
                                     textColor: '#ffffff',
                                     classNames: [seg.type === 'hunt' ? 'event-hunt' : 'event-travel'],
                                     extendedProps: {
                                         type: seg.type,
                                         area: area.name,
                                         client: row.clientName,
                                         description: seg.label || ''
                                     },
                                     allDay: true
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

const getAllEvents = () => {
    const events2025 = processYearData(2025, bookingsData2025)
    const events2026 = processYearData(2026, bookingsData2026)
    return [...events2025, ...events2026]
}

const calculateStats = (year: number) => {
    const rawData = year === 2026 ? bookingsData2026 : bookingsData2025
    let tEvents = 0
    let hEvents = 0
    let trEvents = 0
    const areaSet = new Set()

    rawData.forEach((monthData: any) => {
        if (monthData.areas) {
            monthData.areas.forEach((area: any) => {
                if (area.rows && area.rows.length > 0) {
                     area.rows.forEach((row: any) => {
                         if (row.segments) {
                             row.segments.forEach((seg: any) => {
                                 if (seg.type === 'hunt') {
                                     hEvents++
                                 } else {
                                     trEvents++
                                 }
                                 tEvents++
                                 areaSet.add(area.name)
                             })
                         }
                     })
                }
            })
        }
    })

    totalEvents.value = tEvents
    huntEvents.value = hEvents
    travelEvents.value = trEvents
    activeAreas.value = areaSet.size
}

// --- FullCalendar Options ---
const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin, bootstrapPlugin],
  initialView: 'multiMonthYear',
  themeSystem: 'bootstrap',
  headerToolbar: false, // Custom toolbar used
  multiMonthMaxColumns: 3, // 3 months/row in year view
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: 2, // limit events per day
  weekends: true,
  initialDate: `${currentYear.value}-01-01`, 
  events: getAllEvents(),
  eventClick: (info: any) => {
      selectedEvent.value = info.event
  },
  datesSet: (info: any) => {
      calendarTitle.value = info.view.title
      activeView.value = info.view?.type || activeView.value
      
      // Update current year based on view's center date to keep stats relevant
      const midDate = info.view.currentStart
      if (midDate) {
          const year = midDate.getFullYear()
          if (availableYears.includes(year) && year !== currentYear.value) {
              currentYear.value = year
          }
      }
  },
  height: 'auto',
  views: {
      multiMonthYear: {
          buttonText: 'Year Overview',
          duration: { months: 12 }
      }
  }
})

// --- Methods ---
const jumpToYear = (year: number) => {
    const api = fullCalendarRef.value.getApi()
    api.gotoDate(`${year}-01-01`)
}

const next = () => fullCalendarRef.value.getApi().next()
const prev = () => fullCalendarRef.value.getApi().prev()
const today = () => fullCalendarRef.value.getApi().today()

const setView = (view: 'multiMonthYear' | 'dayGridMonth' | 'listMonth') => {
    activeView.value = view
    const api = fullCalendarRef.value.getApi()
    api.changeView(view)
}

const closeModal = () => {
    selectedEvent.value = null
}

// Watchers
watch(currentYear, (newYear) => {
    calculateStats(newYear)
})

// Initial Load
onMounted(() => {
    calculateStats(currentYear.value)
})

</script>

<style scoped>
.calendar-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #fafbfc;
  min-height: 100vh;
}

/* Header */
.cal-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cal-heading {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.cal-year-badge {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.cal-btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.cal-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.cal-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Controls */
.cal-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  gap: 1rem;
  flex-wrap: wrap;
}

.nav-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cal-btn-nav {
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-btn-nav.today-btn {
  width: auto;
  padding: 0.5rem 1rem;
}

.cal-btn-nav:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.current-view-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
  text-align: center;
}

.view-switcher {
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 8px;
}

.view-btn {
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.view-btn.active {
  background: white;
  color: #1a1a1a;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.view-btn:hover:not(.active) {
  color: #374151;
}

/* Legend */
.cal-legend {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-dot.hunt {
  background: #10b981;
}

.legend-dot.travel {
  background: #0ea5e9;
}

/* Calendar Wrapper */
.calendar-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

/* Event Modal */
.event-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.event-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.event-modal-header {
  padding: 1.5rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.event-modal-body {
  padding: 1.5rem;
}

.event-detail {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.event-detail:last-child {
  margin-bottom: 0;
}

.event-detail strong {
  color: #6b7280;
  font-weight: 600;
  min-width: 80px;
  font-size: 0.875rem;
}

.event-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.event-badge.hunt {
  background: #d1fae5;
  color: #065f46;
}

.event-badge.travel {
  background: #dbeafe;
  color: #075985;
}

/* FullCalendar Customization */
:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: #e5e7eb;
}

:deep(.fc-col-header-cell) {
  background: #f9fafb;
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.fc-daygrid-day-number) {
  color: #1a1a1a;
  padding: 0.5rem;
  font-weight: 600;
}

:deep(.fc-daygrid-day.fc-day-today) {
  background: #f0fdf4 !important;
}

:deep(.fc-event) {
  border: none !important;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

:deep(.fc-event.event-hunt) {
  background: #10b981 !important;
}

:deep(.fc-event.event-travel) {
  background: #0ea5e9 !important;
}

:deep(.fc-multimonth-title) {
  font-weight: 700;
  font-size: 0.875rem;
  color: #1a1a1a;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-page {
    padding: 1rem;
  }

  .cal-heading {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cal-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .current-view-title {
    text-align: left;
    order: -1;
    margin-bottom: 0.75rem;
  }

  .nav-buttons {
    justify-content: center;
  }
}
</style>
