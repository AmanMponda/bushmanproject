<template>
  <div class="calendar-page">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1">
          <i class="bi bi-calendar-month" style="font-size: 24px; vertical-align: middle; margin-right: 8px"></i>
          Hunting Schedule
        </h4>
        <p class="text-muted small mb-0">View and manage your hunting bookings</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
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

    <!-- Calendar Section -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-bottom">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <!-- Jump to Date -->
          <div class="d-flex align-items-center gap-2">
            <label class="form-label mb-0 small text-muted">Jump to date:</label>
            <input
              v-model="jumpDateString"
              type="date"
              class="form-control form-control-sm"
              style="width: 180px"
              @change="handleJumpToDate"
            />
          </div>
          <!-- Legend -->
          <div class="d-flex align-items-center gap-3">
            <div class="d-flex align-items-center gap-1">
              <span class="legend-dot legend-confirmed"></span>
              <span class="small text-muted">Confirmed</span>
            </div>
            <div class="d-flex align-items-center gap-1">
              <span class="legend-dot legend-provision"></span>
              <span class="small text-muted">Provision</span>
            </div>
            <div class="d-flex align-items-center gap-1">
              <span class="legend-dot legend-completed"></span>
              <span class="small text-muted">Completed</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body p-3">
        <div v-if="loadingData" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-2 mb-0">Loading calendar events...</p>
        </div>
        <div v-else class="calendar-wrapper">
          <FullCalendar ref="calendarRef" :key="calendarKey" :options="calendarOptions" />
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
import { ref, computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import type { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core'
import { useCalendarStore } from '@/stores/bushman/calenda-store'

// Types
interface CalendarEvent extends EventInput {
  id: string
  title: string
  start: string | Date | undefined
  end?: string | Date | undefined
  allDay?: boolean
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  extendedProps?: {
    species?: any[]
    preference?: any
    contacts?: any[]
    proposed_package?: any
    areas?: any[]
    status?: string
    package_name?: string
    hunting_type?: string
  }
}

// Store
const calendarStore = useCalendarStore()

// Refs
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const showModal = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const loadingData = ref(false)
const calendarKey = ref(0)
const calendarEvents = ref<CalendarEvent[]>([])
const jumpDateString = ref(new Date().toISOString().split('T')[0])

// Calendar Options
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin, multiMonthPlugin],
  initialView: 'dayGridMonth',
  eventClick: handleEventClick,
  events: [],
  selectable: false,
  editable: false,
  weekends: true,
  eventDisplay: 'block',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,multiMonthYear downloadCalendar',
  },
  customButtons: {
    downloadCalendar: {
      text: 'Download Calendar',
      click: downloadCalendar,
    },
  },
  initialDate: new Date().toISOString().split('T')[0],
  views: {
    multiMonthYear: {
      type: 'multiMonth',
      duration: { months: 12 },
      multiMonthMaxColumns: 3,
      multiMonthMinWidth: 280,
      fixedWeekCount: false,
      buttonText: 'Multi-Month Year',
    },
    dayGridMonth: {
      fixedWeekCount: false,
      buttonText: 'Month',
    },
  },
  height: 'auto',
  contentHeight: 'auto',
  aspectRatio: 1.35,
  dayMaxEventRows: 3,
  moreLinkClick: 'popover',
})

// Computed Properties
const totalEvents = computed(() => calendarEvents.value.length)

const confirmedEvents = computed(() => 
  calendarEvents.value.filter((event) => event.extendedProps?.status === 'confirmed').length
)

const provisionEvents = computed(() => 
  calendarEvents.value.filter((event) => event.extendedProps?.status === 'provision_sales').length
)

const completedEvents = computed(() => 
  calendarEvents.value.filter((event) => event.extendedProps?.status === 'completed').length
)

const selectedEventStatus = computed(() => {
  const status = selectedEvent.value?.extendedProps?.status
  if (!status) return 'Unknown'

  const statusMap: Record<string, string> = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    provision_sales: 'Provision Sales',
    declined: 'Declined',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }

  return statusMap[status] || status
})

const selectedEventDuration = computed(() => {
  if (!selectedEvent.value?.start || !selectedEvent.value?.end) return 0
  return calculateDuration(selectedEvent.value.start, selectedEvent.value.end)
})

// Methods
function downloadCalendar() {
  const calendarData = generateICalendarData()
  const blob = new Blob([calendarData], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `hunting-calendar-${new Date().toISOString().split('T')[0]}.ics`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function generateICalendarData(): string {
  const events = calendarOptions.value.events as EventInput[]
  let icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bushman//Hunting Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Hunting Calendar
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Hunting Schedule and Bookings
`

  for (const event of events) {
    const eventData = event as any
    const startDate = new Date(eventData.start)
    const endDate = new Date(eventData.end || startDate)

    icalData += `BEGIN:VEVENT
UID:${eventData.id}@bushman.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${eventData.title || 'Hunting Event'}
DESCRIPTION:Status: ${eventData.extendedProps?.status || 'N/A'}
END:VEVENT
`
  }

  icalData += 'END:VCALENDAR'
  return icalData
}

function formatEventDate(date: string | Date | undefined): string {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

function calculateDuration(start: string | Date | null | undefined, end: string | Date | null | undefined): number {
  if (!start || !end) return 0
  try {
    const startDate = new Date(start as string)
    const endDate = new Date(end as string)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  } catch {
    return 0
  }
}

function getEarliestEventDate(events: CalendarEvent[]): string | null {
  if (!events || events.length === 0) return null

  let earliestDate: Date | null = null

  for (const event of events) {
    if (event.start) {
      const eventDate = new Date(event.start as string)
      if (!isNaN(eventDate.getTime())) {
        if (!earliestDate || eventDate < earliestDate) {
          earliestDate = eventDate
        }
      }
    }
  }

  if (earliestDate) {
    return earliestDate.toISOString().split('T')[0]
  }

  return null
}

function handleEventClick(clickInfo: EventClickArg) {
  selectedEvent.value = {
    id: clickInfo.event.id,
    title: clickInfo.event.title,
    start: clickInfo.event.start || undefined,
    end: clickInfo.event.end || clickInfo.event.start || undefined,
    extendedProps: clickInfo.event.extendedProps,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: '#FFC107',
    provision_sales: '#FF9800',
    confirmed: '#4CAF50',
    declined: '#F44336',
    cancelled: '#9E9E9E',
    completed: '#2196F3',
  }
  return colorMap[status?.toLowerCase()] || '#757575'
}

function getStatusBadgeClass(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-warning',
    provision_sales: 'bg-warning',
    confirmed: 'bg-success',
    declined: 'bg-danger',
    cancelled: 'bg-danger',
    completed: 'bg-primary',
  }
  return colorMap[status?.toLowerCase()] || 'bg-secondary'
}

function handleJumpToDate() {
  if (!jumpDateString.value) return

  const date = new Date(jumpDateString.value)
  if (isNaN(date.getTime())) return

  if (calendarRef.value) {
    const calendarApi = calendarRef.value.getApi()
    if (calendarApi) {
      calendarApi.gotoDate(date)
    }
  }
}

async function loadCalendarEvents() {
  loadingData.value = true

  try {
    const response = await calendarStore.getCalendarStats()

    if (response && response.status === 200 && Array.isArray(response.data)) {
      if (response.data.length > 0) {
        const apiEvents = transformApiEvents(response.data)

        calendarOptions.value.events = apiEvents
        calendarEvents.value = apiEvents

        // Set calendar to start at the earliest booked date
        if (apiEvents.length > 0) {
          const earliestDate = getEarliestEventDate(apiEvents)
          if (earliestDate) {
            calendarOptions.value.initialDate = earliestDate
          }
        }

        calendarKey.value++
      } else {
        console.warn('No events found in API response')
      }
    } else {
      console.error('Invalid API response:', response)
    }
  } catch (error) {
    console.error('Error loading calendar events:', error)
  } finally {
    loadingData.value = false
  }
}

function transformApiEvents(apiData: any[]): CalendarEvent[] {
  const events: CalendarEvent[] = []

  apiData.forEach((item: any, index: number) => {
    try {
      const salesInquiry = item.sales_inquiry || {}
      const entity = salesInquiry.entity || {}
      const preference = salesInquiry.preference || {}

      // Parse dates
      const startDate = parseApiDate(preference.start_date)
      const endDate = parseApiDate(preference.end_date)

      if (!startDate) {
        console.warn(`Skipping event ${item.id} - invalid start date:`, preference.start_date)
        return
      }

      // Format dates for FullCalendar
      const eventStart = startDate.toISOString().split('T')[0]
      const eventEnd = endDate ? endDate.toISOString().split('T')[0] : eventStart

      // Calculate duration
      const duration = calculateDuration(eventStart, eventEnd)

      // Extract package and hunting type information
      const proposedPackage = item.proposed_package || {}
      const packageName = proposedPackage?.sales_package?.name || 'N/A'
      const huntingType = proposedPackage?.price_list_type?.hunting_type?.name || 'N/A'

      // Create event title with client name, package, hunting type, and duration
      const clientName = entity.full_name || 'Unknown Client'
      const eventTitle = `${clientName} - ${packageName} (${huntingType}) - ${duration}d`

      // Create event
      const event: CalendarEvent = {
        id: item.id?.toString() || `event-${Date.now()}-${index}`,
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
        allDay: true,
        backgroundColor: getStatusColor(item.status?.status || ''),
        textColor: '#FFFFFF',
        borderColor: getStatusColor(item.status?.status || ''),
        extendedProps: {
          species: salesInquiry.preferred_species || [],
          preference: preference,
          contacts: entity.contacts || [],
          proposed_package: proposedPackage,
          areas: salesInquiry.area || [],
          status: item.status?.status || 'unknown',
          package_name: packageName,
          hunting_type: huntingType,
        },
      }

      events.push(event)
    } catch (error) {
      console.error('Error transforming event:', item.id, error)
    }
  })

  // Sort by start date
  return events.sort((a, b) => {
    return new Date(a.start as string).getTime() - new Date(b.start as string).getTime()
  })
}

function parseApiDate(dateString: string | undefined): Date | null {
  if (!dateString) return null

  try {
    // Clean the date string
    let cleanDate = dateString.trim()

    // Handle MySQL datetime format
    if (cleanDate.includes(' ')) {
      cleanDate = cleanDate.split(' ')[0]
    }

    // Parse date
    const date = new Date(cleanDate + 'T00:00:00')

    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString)
      return null
    }

    return date
  } catch (error) {
    console.error('Error parsing date:', dateString, error)
    return null
  }
}

// Lifecycle
onMounted(() => {
  loadCalendarEvents()
})
</script>

<style scoped>
.calendar-page {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
  width: 100%;
  overflow-x: auto;
}

/* Stats Cards */
.stat-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-confirmed .stat-icon {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.stat-provision .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stat-completed .stat-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

/* Legend */
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
    display: inline-block;
  }
  
  .legend-confirmed {
    background-color: #22c55e;
  }
  
  .legend-provision {
    background-color: #f59e0b;
  }
  
  .legend-completed {
    background-color: #3b82f6;
  }
  
  /* FullCalendar Custom Styles - Bootstrap Admin Look */
  :deep(.fc) {
    font-family: inherit;
    font-size: 0.9rem;
  }
  
  :deep(.fc-toolbar) {
    padding: 12px 0;
    margin-bottom: 12px !important;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    display: flex !important;
  }
  
  :deep(.fc-toolbar-chunk) {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
  }
  
  :deep(.fc-toolbar-title) {
    font-size: 1.25rem !important;
    font-weight: 600;
    color: #212529;
  }
  
  :deep(.fc-button) {
    padding: 8px 16px !important;
    font-size: 0.875rem !important;
    border-radius: 6px !important;
    border: 1px solid #dee2e6 !important;
    background-color: #fff !important;
    color: #212529 !important;
    transition: all 0.2s ease !important;
    height: 36px !important;
    min-height: 36px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
    vertical-align: middle !important;
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    min-width: 100px !important;
  }
  
  :deep(.fc-button.fc-downloadCalendar-button) {
    background-color: #6b5344 !important;
    color: #fff !important;
    border-color: #6b5344 !important;
    padding: 8px 16px !important;
    height: 36px !important;
    min-height: 36px !important;
    line-height: 1 !important;
    vertical-align: middle !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 100px !important;
  }
  
  :deep(.fc-button.fc-downloadCalendar-button:hover) {
    background-color: #5a4538 !important;
    border-color: #5a4538 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
  }
  
  :deep(.fc-button-group) {
    display: inline-flex !important;
    gap: 6px !important;
    align-items: center !important;
    vertical-align: middle !important;
  }
  
  :deep(.fc-button-group > button) {
    height: 36px !important;
    min-height: 36px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
    vertical-align: middle !important;
    padding: 8px 16px !important;
    min-width: 100px !important;
  }
  
  :deep(.fc-button:hover:not(.fc-downloadCalendar-button)) {
    background-color: #f8f9fa !important;
    border-color: #adb5bd !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  }
  
  :deep(.fc-button-primary:not(:disabled):active),
  :deep(.fc-button-primary:not(:disabled).fc-button-active) {
    background-color: #0d6efd !important;
    border-color: #0d6efd !important;
    color: #fff !important;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
  }
  
  :deep(.fc-event) {
    cursor: pointer;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none !important;
    margin: 2px 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.fc-event:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
    z-index: 10;
  }
  
  :deep(.fc-day-today) {
    background-color: rgba(13, 110, 253, 0.1) !important;
  }
  
  :deep(.fc-day-today .fc-daygrid-day-number) {
    font-weight: 700;
    color: #0d6efd;
  }
  
  :deep(.fc-daygrid-day-frame) {
    min-height: 80px;
    padding: 4px;
  }
  
  :deep(.fc-daygrid-day-number) {
    font-size: 0.875rem;
    padding: 6px 8px;
    color: #495057;
    font-weight: 500;
  }
  
  :deep(.fc-col-header-cell) {
    background-color: #f8f9fa;
    padding: 10px 0;
    font-weight: 600;
    font-size: 0.75rem;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #dee2e6;
  }
  
  :deep(.fc-view) {
    background: white;
    border-radius: 0;
    border: 1px solid #dee2e6;
  }
  
  :deep(.fc-scrollgrid) {
    border: none !important;
  }
  
  :deep(.fc-scrollgrid td, .fc-scrollgrid th) {
    border-color: #dee2e6 !important;
  }
  
  /* Multi-month compact layout */
  :deep(.fc-multimonth) {
    border: none !important;
    background: transparent !important;
  }
  
  :deep(.fc-multimonth-singlecol) {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 32px !important;
    padding: 20px !important;
    row-gap: 32px !important;
  }
  
  :deep(.fc-multimonth-month) {
    border: 1px solid #e9ecef;
    border-radius: 12px;
    margin: 0 !important;
    background: white;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.fc-multimonth-month:hover) {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
    border-color: #dee2e6;
  }
  
  :deep(.fc-multimonth-header) {
    background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
    padding: 0;
    flex-shrink: 0;
  }
  
  :deep(.fc-multimonth-title) {
    background: transparent;
    color: white;
    font-weight: 700;
    padding: 14px 12px;
    font-size: 0.95rem;
    text-align: center;
    letter-spacing: 0.3px;
  }
  
  :deep(.fc-multimonth-daygrid) {
    padding: 8px;
    flex-grow: 1;
  }
  
  :deep(.fc-multimonth-daygrid-table) {
    font-size: 0.8rem;
  }
  
  :deep(.fc-multimonth .fc-daygrid-day-frame) {
    min-height: 42px;
    padding: 4px;
  }
  
  :deep(.fc-multimonth .fc-daygrid-day-number) {
    font-size: 0.8rem;
    padding: 4px 6px;
    font-weight: 500;
  }
  
  :deep(.fc-multimonth .fc-daygrid-day-events) {
    margin-top: 3px;
  }
  
  :deep(.fc-multimonth .fc-event) {
    font-size: 0.7rem;
    padding: 2px 5px;
    margin: 2px 3px;
    border-radius: 4px;
    font-weight: 500;
    word-break: break-word;
  }
  
  :deep(.fc-multimonth .fc-col-header-cell) {
    font-size: 0.75rem;
    padding: 8px 0;
    font-weight: 600;
    background-color: #f1f3f5;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  :deep(.fc-more-link) {
    font-size: 0.7rem;
    color: #0d6efd;
    font-weight: 600;
    text-decoration: none;
    background: transparent;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
  }
  
  :deep(.fc-more-link:hover) {
    color: #fff;
    background-color: #0d6efd;
    text-decoration: none;
  }
  
  :deep(.fc-multimonth .fc-day-other) {
    background-color: #fafbfc;
  }
  
  :deep(.fc-multimonth .fc-day-today) {
    background-color: rgba(13, 110, 253, 0.15) !important;
  }
  
  /* Modal Styles */
  .modal-backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  @media (max-width: 1200px) {
    :deep(.fc-multimonth-singlecol) {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 28px !important;
      row-gap: 28px !important;
    }
  }
  
  @media (max-width: 768px) {
    .calendar-page {
      padding: 12px;
    }
  
    :deep(.fc-multimonth-singlecol) {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
      row-gap: 24px !important;
      padding: 12px !important;
    }
  
    :deep(.fc-toolbar) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  
  /* Calendar Wrapper */
  .calendar-wrapper {
    width: 100%;
    min-height: 600px;
  }
  
  .calendar-wrapper :deep(.fc) {
    width: 100%;
  }
  
  /* Modal Styles - Bootstrap compatible */
  .modal-body {
    max-height: 70vh;
    overflow-y: auto;
  }
  </style>
  