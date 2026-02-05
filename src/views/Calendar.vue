<template>
  <div class="calendar-page" ref="calendarRef" :class="{ 'is-exporting': downloadingPdf }">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 d-print-none">
      <div>
        <h4 class="mb-1">
          <i class="bi bi-calendar-month" style="font-size: 24px; vertical-align: middle; margin-right: 8px"></i>
          Hunting Schedule
        </h4>
        <p class="text-muted small mb-0">View and manage your hunting bookings</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4 d-print-none">
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm h-100 stat-card stat-total">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon">
                <i class="bi bi-calendar-event"></i>
              </div>
              <div class="ms-3 flex-grow-1">
                <div class="text-muted small">Total Events</div>
                <div class="h4 mb-0 fw-bold">{{ totalEvents }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm h-100 stat-card stat-confirmed">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon">
                <i class="bi bi-check-circle-fill"></i>
              </div>
              <div class="ms-3 flex-grow-1">
                <div class="text-muted small">Confirmed</div>
                <div class="h4 mb-0 fw-bold">{{ confirmedEvents }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm h-100 stat-card stat-provision">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="ms-3 flex-grow-1">
                <div class="text-muted small">Provision</div>
                <div class="h4 mb-0 fw-bold">{{ provisionEvents }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm h-100 stat-card stat-completed">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon">
                <i class="bi bi-check-all"></i>
              </div>
              <div class="ms-3 flex-grow-1">
                <div class="text-muted small">Completed</div>
                <div class="h4 mb-0 fw-bold">{{ completedEvents }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Scheduler Grid -->
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
             <h4 class="text-primary fw-bold m-0 fs-3">{{ currentYear }} Safari Bookings</h4>
             <div class="d-flex align-items-center gap-2 d-print-none">
                <div class="d-flex align-items-center">
                    <label class="me-2 fw-bold">Year:</label>
                    <select v-model="currentYear" class="form-select w-auto fw-bold border-primary text-primary">
                        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                </div>
                <button class="btn btn-outline-primary" @click="openPdfDialog">
                    <i class="bi bi-file-earmark-pdf me-1"></i> Export PDF
                </button>
                <button class="btn btn-outline-secondary" @click="printCalendar">
                    <i class="bi bi-printer me-1"></i> Print
                </button>
             </div>
        </div>
        <div class="card-body p-0">
            <div class="scheduler-container">
                 <div class="grid-table-wrapper">
                    <table class="scheduler-table w-100">
                        <tbody>
                            <template v-for="month in calendarData" :key="month.id">
                                <!-- Month Header Row (Acts as separator and header) -->
                                <tr class="month-header-row">
                                    <td class="resource-col text-start px-2 fw-bold text-dark month-name">{{ month.name }}</td>
                                    <td v-for="d in month.daysCount" :key="'h'+d" class="day-col-header"></td>
                                </tr>
                                <!-- Days Numbers Row -->
                                <tr class="days-row">
                                    <td class="resource-col"></td>
                                    <td v-for="day in month.daysCount" :key="'d'+day" class="day-col text-center">{{ day }}</td>
                                </tr>

                                <!-- Loop Areas -->
                                <template v-for="area in month.areas" :key="area.id">
                                     <!-- Area Header Row -->
                                     <tr class="area-header-row">
                                         <td class="resource-col area-name px-2">{{ area.name }}</td>
                                         <td v-for="i in month.daysCount" :key="'at'+i" class="area-track"></td>
                                     </tr>
                                     <!-- Booking Rows -->
                                     <tr v-for="booking in area.rows" :key="booking.id" class="booking-row">
                                         <td class="resource-col client-name px-2 text-dark">{{ booking.clientName }}</td>
                                         
                                         <!-- Render processed cells -->
                                         <template v-if="booking.processedCells">
                                            <td v-for="(cell, cIndex) in booking.processedCells" 
                                                :key="cIndex" 
                                                class="day-cell" 
                                                :colspan="cell.span"
                                                :class="getCellClass(cell)">
                                                
                                                <div v-if="cell.type === 'booked'" class="booking-content text-truncate" :title="cell.label">
                                                    {{ cell.label }}
                                                </div>
                                            </td>
                                         </template>
                                         <template v-else>
                                             <td :colspan="month.daysCount"></td>
                                         </template>
                                     </tr>
                                </template>
                                
                                <!-- Empty Placeholders for empty months -->
                                <template v-if="isMonthEmpty(month)">
                                   <tr v-for="k in 3" :key="month.id+'_e'+k" class="empty-placeholder-row">
                                        <td class="resource-col"></td>
                                        <td v-for="i in month.daysCount" :key="i" class="day-cell empty-cell"></td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- PDF Export Options Modal -->
    <div v-if="showPdfDialog" class="pdf-modal-overlay" @click.self="closePdfDialog">
      <div class="pdf-modal-card">
        <div class="pdf-modal-header">
          <div>
            <div class="pdf-modal-kicker">Bushman</div>
            <h5 class="pdf-modal-title">Export Calendar PDF</h5>
          </div>
          <button type="button" class="btn-close" @click="closePdfDialog"></button>
        </div>
        <div class="pdf-modal-body p-4">
          <div class="mb-4">
            <h6 class="mb-3">Select Time Frame</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Start Month</label>
                <select v-model="pdfStartMonth" class="form-select">
                  <option v-for="(month, index) in monthNames" :key="index" :value="index">
                    {{ month }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">End Month</label>
                <select v-model="pdfEndMonth" class="form-select">
                  <option v-for="(month, index) in monthNames" :key="index" :value="index">
                    {{ month }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Year</label>
                <select v-model="pdfYear" class="form-select">
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>
            </div>
            
            <div class="alert alert-info mt-3 d-flex align-items-center">
              <i class="bi bi-info-circle me-2"></i>
              <span>Selected: {{ monthNames[pdfStartMonth] }} - {{ monthNames[pdfEndMonth] }}, {{ pdfYear }}</span>
            </div>
          </div>
          
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="closePdfDialog">Cancel</button>
            <button 
              class="btn btn-primary" 
              @click="generateAndOpenPdf"
              :disabled="downloadingPdf || pdfEndMonth < pdfStartMonth"
            >
              <i class="bi bi-file-pdf me-1" v-if="!downloadingPdf"></i>
              <span class="spinner-border spinner-border-sm me-1" v-else></span>
              {{ downloadingPdf ? 'Generating...' : 'Generate PDF' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <div
      v-if="showModal"
      class="modal fade show"
      style="display: block"
      tabindex="-1"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5 class="modal-title">
              {{ selectedEvent?.title || 'Event Details' }}
            </h5>
            <span class="badge ms-2" :class="getStatusBadgeClass(selectedEvent?.extendedProps?.status || '')">
              {{ selectedEventStatus }}
            </span>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div v-if="selectedEvent" class="modal-body">
            <!-- Client & Date Info -->
            <div class="card border-primary mb-3">
              <div class="card-header bg-primary text-white">
                <h6 class="mb-0">
                  <i class="bi bi-info-circle me-2"></i>
                  Booking Information
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="mb-2">
                      <small class="text-muted d-block">Client</small>
                      <strong>{{ selectedEvent.title || 'N/A' }}</strong>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-2">
                      <small class="text-muted d-block">Duration</small>
                      <strong>{{ selectedEventDuration }} days</strong>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-2">
                      <small class="text-muted d-block">Start Date</small>
                      <strong>{{ formatEventDate(selectedEvent.start) }}</strong>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-2">
                      <small class="text-muted d-block">End Date</small>
                      <strong>{{ formatEventDate(selectedEvent.end) }}</strong>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-2">
                      <small class="text-muted d-block">Package</small>
                      <strong>{{ selectedEvent.extendedProps?.proposed_package?.sales_package?.name || 'N/A' }}</strong>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-2">
                      <small class="text-muted d-block">Hunting Type</small>
                      <strong>{{
                        selectedEvent.extendedProps?.proposed_package?.price_list_type?.hunting_type?.name || 'N/A'
                      }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preferences -->
            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">
                  <i class="bi bi-gear me-2"></i>
                  Preferences
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-4">
                    <div class="d-flex align-items-center gap-2 p-3 bg-light rounded">
                      <i class="bi bi-people text-primary fs-4"></i>
                      <div>
                        <small class="text-muted d-block">Observers</small>
                        <strong class="h5 mb-0">{{
                          selectedEvent.extendedProps?.preference?.no_of_observers || 0
                        }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="d-flex align-items-center gap-2 p-3 bg-light rounded">
                      <i class="bi bi-person text-primary fs-4"></i>
                      <div>
                        <small class="text-muted d-block">Companions</small>
                        <strong class="h5 mb-0">{{
                          selectedEvent.extendedProps?.preference?.no_of_companions || 0
                        }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="d-flex align-items-center gap-2 p-3 bg-light rounded">
                      <i class="bi bi-calendar-day text-primary fs-4"></i>
                      <div>
                        <small class="text-muted d-block">Days</small>
                        <strong class="h5 mb-0">{{ selectedEvent.extendedProps?.preference?.no_of_days || 0 }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Species -->
            <div v-if="selectedEvent.extendedProps?.species?.length" class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">
                  <i class="bi bi-bug me-2"></i>
                  Target Species
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div v-for="specie in selectedEvent.extendedProps.species" :key="specie.id" class="col-md-6">
                    <div class="card border-start border-success border-3">
                      <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="mb-0">{{ specie.species?.name || 'Unknown' }}</h6>
                          <span class="badge bg-primary">Qty: {{ specie.quantity || 0 }}</span>
                        </div>
                        <p class="text-muted small mb-1 fst-italic">
                          {{ specie.species?.scientific_name || '' }}
                        </p>
                        <p class="small mb-0">{{ specie.species?.description || '' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Area -->
            <div v-if="selectedEvent.extendedProps?.areas?.length" class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">
                  <i class="bi bi-geo-alt me-2"></i>
                  Hunting Area
                </h6>
              </div>
              <div class="card-body">
                <div
                  v-for="area in selectedEvent.extendedProps.areas"
                  :key="area.id"
                  class="card border-start border-info border-3 mb-2"
                >
                  <div class="card-body">
                    <h6 class="mb-2">{{ area.area?.name || 'Unknown Area' }}</h6>
                    <p class="small mb-2">{{ area.area?.description || '' }}</p>
                    <div class="d-flex align-items-center gap-1 text-muted small">
                      <i class="bi bi-pin-map"></i>
                      <span>{{ area.area?.location?.name || 'Tanzania' }}</span>
                      <span class="ms-2">
                        ({{ area.area?.location?.geo_coordinates?.coordinates?.[0]?.lat || '0' }},
                        {{ area.area?.location?.geo_coordinates?.coordinates?.[0]?.lng || '0' }})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contacts -->
            <div v-if="selectedEvent.extendedProps?.contacts?.length" class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">
                  <i class="bi bi-envelope me-2"></i>
                  Contacts
                </h6>
              </div>
              <div class="card-body">
                <div class="list-group list-group-flush">
                  <div
                    v-for="contact in selectedEvent.extendedProps.contacts"
                    :key="contact.id"
                    class="list-group-item d-flex align-items-center gap-2"
                  >
                    <i class="bi bi-envelope-fill text-muted"></i>
                    <span>{{ contact.contact || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import jsPDF from 'jspdf'
import CalendarPdfExport from './bushman/details/CalendarPdfExport.vue'

const totalEvents = ref(15)
const confirmedEvents = ref(12)
const provisionEvents = ref(3)
const completedEvents = ref(5)
const currentYear = ref(new Date().getFullYear())
const calendarRef = ref<HTMLElement | null>(null)
const downloadingPdf = ref(false)
const showPdfDialog = ref(false)

// PDF Export Options
const pdfStartMonth = ref(0) // January
const pdfEndMonth = ref(11) // December
const pdfYear = ref(new Date().getFullYear())
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Generate available years dynamically (current year - 1 to current year + 5)
const currentYearValue = new Date().getFullYear()
const availableYears = Array.from({ length: 7 }, (_, i) => currentYearValue - 1 + i)

// Booking data store (will be loaded dynamically)
const bookingsDataStore = ref<Record<number, any>>({})

const loadBookingData = async (year: number) => {
    if (bookingsDataStore.value[year]) {
        return bookingsDataStore.value[year]
    }
    
    try {
        // Try to dynamically import the year's data
        const data = await import(`@/assets/data/bookings_${year}.json`)
        bookingsDataStore.value[year] = data.default || data
        return bookingsDataStore.value[year]
    } catch (error) {
        console.warn(`No booking data found for year ${year}, using empty data`)
        // Return empty bookings structure
        bookingsDataStore.value[year] = { bookings: [] }
        return bookingsDataStore.value[year]
    }
}

// Event Details Modal
const showModal = ref(false)
const selectedEvent = ref<any>(null)

const closeModal = () => {
    showModal.value = false
    selectedEvent.value = null
}

const selectedEventStatus = computed(() => {
    return selectedEvent.value?.extendedProps?.status || 'Unknown'
})

const selectedEventDuration = computed(() => {
    if (!selectedEvent.value?.start || !selectedEvent.value?.end) return 0
    const start = new Date(selectedEvent.value.start)
    const end = new Date(selectedEvent.value.end)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
})

const formatEventDate = (date: any) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
        'confirmed': 'bg-success',
        'provisional': 'bg-warning text-dark',
        'pending': 'bg-info',
        'cancelled': 'bg-danger'
    }
    return statusMap[status.toLowerCase()] || 'bg-secondary'
}

// --- Custom Scheduler Data Types ---
interface BookingSegment {
  start: number
  end: number
  type: 'travel' | 'hunt'
  label?: string
}

interface CalendarRow {
  id: string
  clientName: string
  segments: BookingSegment[]
  processedCells?: any[]
}

interface AreaGroup {
  id: string
  name: string
  rows: CalendarRow[]
}

interface MonthData {
  id: string
  name: string
  daysCount?: number
  areas: AreaGroup[]
}

// Fixed Month Definitions
const monthsDef = [
  { id: 'jan', name: 'JANUARY' },
  { id: 'feb', name: 'FEBRUARY' },
  { id: 'mar', name: 'MARCH' },
  { id: 'apr', name: 'APRIL' },
  { id: 'may', name: 'MAY' },
  { id: 'jun', name: 'JUNE' },
  { id: 'jul', name: 'JULY' },
  { id: 'aug', name: 'AUGUST' },
  { id: 'sep', name: 'SEPTEMBER' },
  { id: 'oct', name: 'OCTOBER' },
  { id: 'nov', name: 'NOVEMBER' },
  { id: 'dec', name: 'DECEMBER' }
]

// Data Handling
const calendarData = ref<MonthData[]>([])

const getDaysInMonth = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex + 1, 0).getDate()
}

const loadDataForYear = async (year: number) => {
    const rawData = await loadBookingData(year)
    
    // 1. Identify all unique Area Names from the source data to ensure consistency
    const allAreaNames = new Set<string>()
    rawData.forEach((m: any) => {
        if (m.areas) {
            m.areas.forEach((a: any) => allAreaNames.add(a.name))
        }
    })
    // functional default if no data
    if (allAreaNames.size === 0) allAreaNames.add('MASWA')

    // 2. Generate 12 months structure
    const generatedData = monthsDef.map((mDef, index) => {
        const daysCount = getDaysInMonth(year, index)
        
        // Find if this month exists in raw data (match by id 'jan' or name 'January')
        const rawMonth = rawData.find((d: any) => 
            (d.id && d.id.toLowerCase() === mDef.id) || 
            (d.name && d.name.toLowerCase().substring(0,3) === mDef.id)
        )

        // Build areas for this month
        const areas: AreaGroup[] = Array.from(allAreaNames).map(areaName => {
            // Find rows for this area in the raw matching month, if any
            const rawArea = rawMonth?.areas?.find((a: any) => a.name === areaName)
            // Deep copy rows if found, else empty
            const rows = rawArea ? JSON.parse(JSON.stringify(rawArea.rows)) : []
            
            return {
                id: `${mDef.id}_${areaName.replace(/\s+/g, '_').toLowerCase()}`,
                name: areaName,
                rows: rows
            }
        })

        return {
            id: mDef.id,
            name: mDef.name,
            daysCount: daysCount,
            areas: areas
        }
    })

    calendarData.value = generatedData
    processRows()
}

const isMonthEmpty = (month: MonthData) => {
    return month.areas.every(area => area.rows.length === 0)
}

const processRows = () => {
    calendarData.value.forEach(month => {
        const daysTotal = month.daysCount || 31
        month.areas.forEach(area => {
            area.rows.forEach(row => {
               const cells = []
               let currentDay = 1
               const sortedSegments = [...row.segments].sort((a,b) => a.start - b.start)

               sortedSegments.forEach(seg => {
                   // Fill empty space before segment
                   if (seg.start > currentDay) {
                       cells.push({ type: 'empty', span: seg.start - currentDay })
                   }
                   
                   // Clip segment to month end
                   const end = Math.min(daysTotal, seg.end)
                   const span = end - seg.start + 1
                   
                   if (span > 0) {
                        cells.push({ 
                            type: 'booked', 
                            bookingType: seg.type, 
                            span: span, 
                            label: seg.label || '' 
                        })
                   }
                   currentDay = end + 1
               })
               // Fill remaining days in month
               if (currentDay <= daysTotal) {
                   cells.push({ type: 'empty', span: daysTotal - currentDay + 1 })
               }
               row.processedCells = cells
            })
        })
    })
}

const getCellClass = (cell: any) => {
    if (cell.type === 'empty') return ''
    if (cell.bookingType === 'travel') return 'cell-travel'
    if (cell.bookingType === 'hunt') return 'cell-hunt'
    return ''
}

// Watch for year changes
watch(currentYear, (newYear) => {
    loadDataForYear(newYear)
})

const printCalendar = () => {
    window.print()
}

const generateYearCalendarPdf = (selectedYear: number, startMonth: number = 0, endMonth: number = 11, customData?: any) => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 30
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    // Colors (as tuples for TypeScript)
    const primaryBlue: [number, number, number] = [59, 130, 246]
    const huntGreen: [number, number, number] = [16, 185, 129]
    const travelBlue: [number, number, number] = [14, 165, 233]
    const headerBg: [number, number, number] = [248, 250, 252]
    const borderColor: [number, number, number] = [226, 232, 240]
    const textDark: [number, number, number] = [30, 41, 59]
    const textMuted: [number, number, number] = [100, 116, 139]

    // Use custom data if provided, otherwise use loaded booking data
    const dataSource = customData || bookingsDataStore.value[selectedYear] || { bookings: [] }
    
    // Build events map from the data source
    const eventsMap = new Map<string, Array<{ type: string; label: string; client: string }>>()
    
    // If using current calendarData structure AND it's for the same year being exported
    if (!customData && calendarData.value.length > 0 && currentYear.value === selectedYear) {
        calendarData.value.forEach((month, monthIndex) => {
            if (monthIndex < startMonth || monthIndex > endMonth) return // Skip months outside range
            
            month.areas.forEach(area => {
                area.rows.forEach(row => {
                    row.segments.forEach(seg => {
                        for (let day = seg.start; day <= seg.end; day++) {
                            const dateKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            if (!eventsMap.has(dateKey)) {
                                eventsMap.set(dateKey, [])
                            }
                            eventsMap.get(dateKey)?.push({
                                type: seg.type,
                                label: seg.label || '',
                                client: row.clientName
                            })
                        }
                    })
                })
            })
        })
    } else {
        // Parse from raw bookings data
        if (dataSource && dataSource.bookings) {
            dataSource.bookings.forEach((booking: any) => {
                const bookingStart = new Date(booking.booking_from)
                const bookingEnd = new Date(booking.booking_to)
                
                // Add travel day
                if (booking.travel_date) {
                    const travelDate = new Date(booking.travel_date)
                    const month = travelDate.getMonth()
                    if (month >= startMonth && month <= endMonth) {
                        const travelKey = `${travelDate.getFullYear()}-${String(travelDate.getMonth() + 1).padStart(2, '0')}-${String(travelDate.getDate()).padStart(2, '0')}`
                        if (!eventsMap.has(travelKey)) {
                            eventsMap.set(travelKey, [])
                        }
                        eventsMap.get(travelKey)?.push({
                            type: 'travel',
                            label: booking.client_name || '',
                            client: booking.client_name || ''
                        })
                    }
                }
                
                // Add hunt days
                for (let d = new Date(bookingStart); d <= bookingEnd; d.setDate(d.getDate() + 1)) {
                    const month = d.getMonth()
                    if (month >= startMonth && month <= endMonth) {
                        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        if (!eventsMap.has(dateKey)) {
                            eventsMap.set(dateKey, [])
                        }
                        eventsMap.get(dateKey)?.push({
                            type: 'hunt',
                            label: booking.client_name || '',
                            client: booking.client_name || ''
                        })
                    }
                }
            })
        }
    }

    // Calculate months to display and split into pages (max 6 months per page)
    const monthsToDisplay = []
    for (let m = startMonth; m <= endMonth; m++) {
        monthsToDisplay.push(m)
    }
    
    const monthsPerPage = 6
    const totalPages = Math.ceil(monthsToDisplay.length / monthsPerPage)
    
    // Generate each page
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) {
            pdf.addPage()
        }
        
        const pageMonthStart = pageIndex * monthsPerPage
        const pageMonthEnd = Math.min(pageMonthStart + monthsPerPage, monthsToDisplay.length)
        const pageMonths = monthsToDisplay.slice(pageMonthStart, pageMonthEnd)
        
        // --- Header ---
        const headerTop = margin

        // Title section
        pdf.setFillColor(...headerBg)
        pdf.roundedRect(margin, headerTop, pageWidth - margin * 2, 50, 6, 6, 'F')
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(20)
        pdf.setTextColor(...primaryBlue)
        const headerTitle = pageMonths.length === 1 
            ? `${monthNames[pageMonths[0]]} ${selectedYear}`
            : `${monthNames[pageMonths[0]]} - ${monthNames[pageMonths[pageMonths.length - 1]]} ${selectedYear}`
        pdf.text(headerTitle, margin + 15, headerTop + 32)
        
        // Navigation hint
        pdf.setFontSize(10)
        pdf.setTextColor(...textMuted)
        pdf.text('Safari Bookings Calendar', pageWidth / 2, headerTop + 32, { align: 'center' })
        
        // Page number if multiple pages
        if (totalPages > 1) {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(...textMuted)
            pdf.text(`Page ${pageIndex + 1} of ${totalPages}`, pageWidth - margin - 60, headerTop + 32)
        }

        // --- Calendar Grid ---
        const gridTop = headerTop + 70
        const gapX = 16
        const gapY = 16
        const columns = 3
        const rows = 2 // Max 2 rows for 6 months
        const gridWidth = pageWidth - margin * 2
        const gridHeight = pageHeight - gridTop - margin - 20
        const monthBoxWidth = (gridWidth - gapX * (columns - 1)) / columns
        const monthBoxHeight = (gridHeight - gapY * (rows - 1)) / rows
        const cellWidth = monthBoxWidth / 7
        const cellHeight = (monthBoxHeight - 30) / 7

        pageMonths.forEach((monthIndex, idx) => {
            const col = idx % columns
            const row = Math.floor(idx / columns)
            const startX = margin + col * (monthBoxWidth + gapX)
            const startY = gridTop + row * (monthBoxHeight + gapY)

            // Month box background
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(...borderColor)
            pdf.setLineWidth(1)
            pdf.roundedRect(startX, startY, monthBoxWidth, monthBoxHeight, 4, 4, 'FD')

            // Month header
            pdf.setFillColor(...headerBg)
            pdf.roundedRect(startX, startY, monthBoxWidth, 22, 4, 4, 'F')
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(10)
            pdf.setTextColor(...textDark)
            pdf.text(monthNames[monthIndex] + ' ' + selectedYear, startX + monthBoxWidth / 2, startY + 15, { align: 'center' })

            // Weekday headers
            const weekHeaderY = startY + 28
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(7)
            pdf.setTextColor(...textMuted)
            for (let d = 0; d < 7; d++) {
                const dayX = startX + d * cellWidth + cellWidth / 2
                pdf.text(weekDays[d], dayX, weekHeaderY, { align: 'center' })
            }

            // Calendar days
            const firstDay = new Date(selectedYear, monthIndex, 1).getDay()
            const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate()
            const cellStartY = weekHeaderY + 6

            let currentRow = 0
            for (let day = 1; day <= daysInMonth; day++) {
                const weekDay = (firstDay + day - 1) % 7
                const cellX = startX + weekDay * cellWidth
                const cellY = cellStartY + currentRow * cellHeight
                const dateKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                
                // Day number
                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(8)
                pdf.setTextColor(...textDark)
                pdf.text(String(day), cellX + 3, cellY + 9)

                // Event bars for this day
                const dayEvents = eventsMap.get(dateKey) || []
                let barY = cellY + 12
                const barHeight = 5
                const maxBars = 2

                dayEvents.slice(0, maxBars).forEach((evt: any) => {
                    if (evt.type === 'hunt') {
                        pdf.setFillColor(...huntGreen)
                    } else {
                        pdf.setFillColor(...travelBlue)
                    }
                    pdf.roundedRect(cellX + 2, barY, cellWidth - 4, barHeight, 1, 1, 'F')
                    
                    // Event label (truncated)
                    pdf.setFontSize(4)
                    pdf.setTextColor(255, 255, 255)
                    const label = (evt.client || evt.label || '').substring(0, 10)
                    if (label) {
                        pdf.text(label, cellX + 3, barY + 4)
                    }
                    barY += barHeight + 1
                })

                if (weekDay === 6) {
                    currentRow++
                }
            }
        })

        // --- Legend (on each page) ---
        const legendY = pageHeight - margin
        pdf.setFontSize(8)
        
        // Hunt legend
        pdf.setFillColor(...huntGreen)
        pdf.roundedRect(margin, legendY - 8, 12, 8, 2, 2, 'F')
        pdf.setTextColor(...textDark)
        pdf.text('Hunt', margin + 16, legendY - 1)
        
        // Travel legend
        pdf.setFillColor(...travelBlue)
        pdf.roundedRect(margin + 60, legendY - 8, 12, 8, 2, 2, 'F')
        pdf.text('Travel', margin + 76, legendY - 1)

        // Generated date
        pdf.setTextColor(...textMuted)
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, legendY - 1, { align: 'right' })
    }

    return pdf
}

const downloadPdf = async () => {
    if (!calendarRef.value || downloadingPdf.value) return
    downloadingPdf.value = true
    await nextTick()

    try {
        // Use full year by default for the old button (if it still exists)
        const pdf = generateYearCalendarPdf(currentYear.value, 0, 11)
        
        // Open PDF in new tab for viewing
        const pdfBlob = pdf.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        window.open(blobUrl, '_blank')
        
        // Clean up blob URL after some time
        setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
        
    } catch (err) {
        console.error('Failed to export calendar PDF:', err)
    } finally {
        downloadingPdf.value = false
    }
}

const openPdfDialog = () => {
    // Set defaults to current year and full year range
    pdfYear.value = currentYear.value
    pdfStartMonth.value = 0
    pdfEndMonth.value = 11
    showPdfDialog.value = true
}

const closePdfDialog = () => {
    showPdfDialog.value = false
}

const generateAndOpenPdf = async () => {
    try {
        downloadingPdf.value = true
        
        // Get selected months range
        const startMonth = pdfStartMonth.value
        const endMonth = pdfEndMonth.value
        const year = pdfYear.value
        
        if (endMonth < startMonth) {
            alert('End month must be after or equal to start month')
            return
        }
        
        // Always load data for the selected year to ensure correct data
        const yearData = await loadBookingData(year)
        const pdf = generateYearCalendarPdf(year, startMonth, endMonth, yearData)
        
        // Open PDF in new tab for viewing
        const pdfBlob = pdf.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        window.open(blobUrl, '_blank')
        
        // Clean up blob URL after some time
        setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
        
        closePdfDialog()
    } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Failed to generate PDF. Please try again.')
    } finally {
        downloadingPdf.value = false
    }
}

onMounted(async () => {
    await loadDataForYear(currentYear.value)
})

// Watch for year changes and reload data
watch(currentYear, async (newYear) => {
    await loadDataForYear(newYear)
})
</script>

<style scoped>
.calendar-page {
  padding: 24px;
}

.calendar-page.is-exporting .d-print-none {
  display: none !important;
}

.pdf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  z-index: 1060;
  overflow: auto;
}

.pdf-modal-card {
  background: #ffffff;
  width: min(1200px, 96vw);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}

.pdf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.pdf-modal-kicker {
  font-size: 0.7rem;
  letter-spacing: 0.12rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 700;
}

.pdf-modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.pdf-modal-body {
  overflow: auto;
  background: #f9fafb;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-total .stat-icon {
  background-color: #e9ecef;
  color: #495057;
}

.stat-confirmed .stat-icon {
  background-color: #d1e7dd;
  color: #0f5132;
}

.stat-provision .stat-icon {
  background-color: #fff3cd;
  color: #856404;
}

.stat-completed .stat-icon {
  background-color: #cfe2ff;
  color: #084298;
}

/* Scheduler Table Styles */
.scheduler-table {
    border-collapse: collapse;
    font-size: 11px; /* Small font as per screenshot */
    table-layout: fixed; /* Important for equal columns */
}

/* Headers */
.month-header-row .month-name {
    font-size: 13px;
    font-weight: bold;
    background-color: #fff;
    border-bottom: 1px solid #333;
}
.month-header-row .day-col-header {
    background-color: #fff;
}

.scheduler-table th, .scheduler-table td {
    border: 1px solid #000; /* Darker grid lines to match screenshot */
    padding: 0;
}

.day-col {
    width: 2.7%; /* Roughly 100% / 37 cols (31 days + resource col) */
    text-align: center;
    font-weight: bold;
    background: #fff;
    height: 20px;
}

.resource-col {
    width: 15%; /* Wider column for names */
    min-width: 150px;
    background: #f8f9fa;
    border-right: 2px solid #000; /* Thicker separator */
}

/* Area Header */
.area-header-row .resource-col.area-name {
    background-color: #8b4513; /* Brown color like 'MASWA' */
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 5px;
}

.area-header-row .area-track {
    background-color: #fff; /* White usage track area */
    border-top: 1px solid #333;
    height: 18px;
}

/* Booking Row */
.booking-row {
    height: 24px;
}

.client-name {
    padding: 2px 5px;
    background: #fff;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.day-cell {
    background: #fff;
    position: relative;
    padding: 0;
}

/* Cell Colors/Bars */
.cell-travel {
    background-color: #00bfff; /* Bright Blue */
    border: 1px solid #000;
}

.cell-hunt {
    background-color: #ffc107; /* Amber/Orange/Yellow */
    border: 1px solid #000;
    color: #000;
    font-weight: 500;
    text-align: center;
    vertical-align: middle;
}

.booking-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow: hidden;
    padding: 0 4px;
    font-size: 10px;
}

.empty-cell {
    background: #fff;
}

.empty-placeholder-row td {
    height: 20px;
}

@media (max-width: 768px) {
  .calendar-page {
    padding: 12px;
  }
  .resource-col {
      width: 30%;
      min-width: 100px;
  }
}

@media print {
    @page {
        size: landscape;
        margin: 0.5cm;
    }

    body {
        background-color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    /* Hide Bootstrap/Layout elements explicitly just in case */
    .d-print-none, 
    .app-header, 
    .app-sidebar, 
    .app-footer,
    .btn-close,
    .modal {
        display: none !important;
    }
    
    .calendar-page {
        padding: 0 !important;
        background: white !important;
        width: 100% !important;
        max-width: none !important;
    }

    .card {
        border: none !important;
        box-shadow: none !important;
    }

    .card-header {
        border: none !important;
        padding-top: 0 !important;
    }

    .scheduler-container {
        padding: 0 !important;
    }

    .grid-table-wrapper,
    .scheduler-container,
    .card-body {
        overflow: visible !important;
    }

    .scheduler-table {
        width: 100% !important;
        font-size: 9px !important; /* Smaller text for print to fit */
        table-layout: fixed !important;
    }

    .resource-col {
        min-width: 160px !important;
        width: 160px !important;
    }

    .day-col,
    .day-col-header {
        width: auto !important;
    }

    tr,
    td,
    th,
    .month-header-row,
    .days-row,
    .area-header-row,
    .booking-row,
    .empty-placeholder-row {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
    }

    /* Ensure colors print */
    .area-header-row .resource-col.area-name,
    .cell-travel, 
    .cell-hunt {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    
    /* Make table lines crisp */
    .scheduler-table th, .scheduler-table td {
        border: 1px solid #000 !important;
    }
}
</style>
