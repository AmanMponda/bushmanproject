<template>
  <div class="calendar-page" ref="calendarRef" :class="{ 'is-exporting': downloadingPdf }">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 d-print-none">
      <div>
        <h4 class="mb-1 text-primary fw-bold">
          <i class="bi bi-calendar-range me-2"></i>Hunting Schedule
        </h4>
        <p class="text-muted small mb-0">View and manage booking schedules.</p>
      </div>
      <div class="d-flex gap-2">
         <button class="btn btn-outline-primary" @click="downloadPdf" :disabled="downloadingPdf">
             <i class="bi bi-file-earmark-pdf me-1"></i> {{ downloadingPdf ? 'Preparing...' : 'Download PDF' }}
         </button>
         <button class="btn btn-outline-secondary" @click="printCalendar">
             <i class="bi bi-printer me-1"></i> Print
         </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4 d-print-none">
      <div class="col-md-3 col-sm-6" v-for="(stat, index) in stats" :key="index">
        <div class="card border-0 shadow-sm h-100 stat-card">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon-wrapper rounded-circle p-3 text-white" :class="stat.iconBgClass">
                <i :class="stat.icon" class="fs-4"></i>
              </div>
              <div class="ms-3">
                <div class="text-uppercase fw-bold small text-muted mb-1">{{ stat.label }}</div>
                <div class="h3 mb-0 fw-bold">{{ stat.value }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Controls -->
    <div class="card border-0 shadow-sm mb-4 d-print-none">
      <div class="card-body py-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="vr mx-2"></div>
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                    <i class="bi bi-circle-fill me-1 small"></i> Hunt
                </span>
                <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill">
                    <i class="bi bi-circle-fill me-1 small"></i> Travel
                </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FullCalendar Wrapper -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
         <FullCalendar class="app-calendar" :options="calendarOptions" ref="fullCalendarRef" />
      </div>
    </div>

    <!-- Event Detail Modal -->
    <div v-if="selectedEvent" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title fw-bold">
                        <i class="bi bi-info-circle me-2"></i>Booking Details
                    </h5>
                    <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
                </div>
                <div class="modal-body p-4">
                    <h5 class="fw-bold mb-3 text-dark">{{ selectedEvent.title }}</h5>
                    
                    <div class="d-flex flex-wrap gap-2 mb-4">
                         <span class="badge rounded-pill px-3 py-2" :class="getEventBadgeClass(selectedEvent.extendedProps.type)">
                            {{ selectedEvent.extendedProps.type.toUpperCase() }}
                         </span>
                         <span class="badge bg-secondary rounded-pill px-3 py-2">
                             <i class="bi bi-geo-alt me-1"></i> {{ selectedEvent.extendedProps.area }}
                         </span>
                    </div>

                    <div class="card bg-light border-0 rounded-3 mb-3">
                        <div class="card-body">
                             <div class="d-flex justify-content-between mb-2">
                                <span class="small text-muted fw-bold text-uppercase">Duration</span>
                                <span class="fw-bold text-dark">{{ formatDate(selectedEvent.start) }} - {{ formatDate(selectedEvent.end) }}</span>
                             </div>
                             <div  v-if="selectedEvent.extendedProps.description">
                                <span class="small text-muted fw-bold text-uppercase d-block mb-1">Details</span>
                                <p class="mb-0 text-dark">{{ selectedEvent.extendedProps.description }}</p>
                             </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 pt-0">
                    <button type="button" class="btn btn-light px-4" @click="closeModal">Close</button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
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
    { label: 'Total Events', value: totalEvents.value, icon: 'bi-calendar-check', iconBgClass: 'bg-primary' },
    { label: 'Confirmed Hunts', value: huntEvents.value, icon: 'bi-crosshair', iconBgClass: 'bg-success' },
    { label: 'Travels', value: travelEvents.value, icon: 'bi-airplane', iconBgClass: 'bg-info' },
    { label: 'Active Areas', value: activeAreas.value, icon: 'bi-map', iconBgClass: 'bg-warning' },
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

const getEventBadgeClass = (type: string) => {
    return type === 'hunt' ? 'bg-success' : 'bg-info'
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

        pdf.save(`calendar-${currentYear.value}.pdf`)
    } catch (err) {
        console.error('Failed to export calendar PDF:', err)
    } finally {
        downloadingPdf.value = false
    }
}

// --- Data Transformation ---
const processData = (year: number) => {
    const rawData = year === 2026 ? bookingsData2026 : bookingsData2025
    const events: any[] = []
    
    let tEvents = 0
    let hEvents = 0
    let trEvents = 0
    const areaSet = new Set()

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
                                 
                                 // Check event type
                                 if (seg.type === 'hunt') {
                                     hEvents++
                                 } else {
                                     trEvents++
                                 }
                                 tEvents++
                                 areaSet.add(area.name)

                                 events.push({
                                     title: `${row.clientName} (${area.name})`,
                                     start: startDate,
                                     end: endDate,
                                     backgroundColor: seg.type === 'hunt' ? '#198754' : '#0dcaf0',
                                     borderColor: seg.type === 'hunt' ? '#198754' : '#0dcaf0',
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

    // Update Stats
    totalEvents.value = tEvents
    huntEvents.value = hEvents
    travelEvents.value = trEvents
    activeAreas.value = areaSet.size

    return events
}

// --- FullCalendar Options ---
const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin, bootstrapPlugin],
  initialView: 'multiMonthYear',
  themeSystem: 'bootstrap',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'multiMonthYear,dayGridMonth,listMonth'
  },
  multiMonthMaxColumns: 3, // 3 months/row in year view
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: 2, // limit events per day
  weekends: true,
  initialDate: `${currentYear.value}-01-01`, 
  events: processData(currentYear.value),
  eventClick: (info: any) => {
      selectedEvent.value = info.event
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
const changeYear = (year: number) => {
    currentYear.value = year
    const api = fullCalendarRef.value.getApi()
    api.gotoDate(`${year}-01-01`)
    
    // Refresh events logic
    api.removeAllEvents()
    processData(year).forEach((evt: any) => api.addEvent(evt))
}

const closeModal = () => {
    selectedEvent.value = null
}

// Initial Load
onMounted(() => {
    processData(currentYear.value)
})

</script>

<style scoped>
.calendar-page {
    /* Main page background */
    contain: layout;
}

.calendar-page.is-exporting .d-print-none,
.calendar-page.is-exporting .modal {
    display: none !important;
}

.stat-card {
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}

.stat-icon-wrapper {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.fc-theme-bootstrap5 a:not([href])) {
    color: inherit;
    text-decoration: none;
}

:deep(.fc-event) {
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.85em;
    padding: 1px 2px;
    border: none;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

:deep(.fc-event:hover) {
    filter: brightness(0.95);
}

:deep(.fc-toolbar-title) {
    font-weight: 800;
    font-size: 1.5rem;
    color: #495057;
}

:deep(.fc-col-header-cell) {
    background-color: #f8f9fa;
    padding: 8px 0;
    text-transform: uppercase;
    font-size: 0.8rem;
    color: #6c757d;
}

:deep(.fc-cell-today) {
    background-color: rgba(255, 255, 0, 0.05) !important;
}

:deep(.fc-daygrid-day-number) {
    font-weight: 600;
    color: #495057;
    margin: 4px;
}

/* Modal animation */
.modal.show {
    transition: opacity .15s linear;
}

.modal-content {
    border-radius: 12px;
}

.event-hunt {
    background-color: #198754 !important;
}

.event-travel {
    background-color: #0dcaf0 !important;
}

@media print {
    :deep(.fc-header-toolbar) {
        display: none;
    }
    
    .calendar-page {
        padding: 0;
    }
}
</style>
