<template>
  <StandardOffcanvas 
    v-model="addDocumentationOffcanvasRef" 
    position="right" 
    width="650px"
    height="100%"
    :prevent-scroll="true" 
    :close-on-esc="true" 
    :close-on-backdrop-click="true" 
    :show-header="true">    
    <template #header>
      <div class="d-flex align-items-center justify-content-between w-100 pe-3">
        <div class="d-flex align-items-center">
          <i class="fa fa-route fs-20px me-3 text-primary"></i>
          <div>
            <h5 class="mb-0 fw-bold">Route Stops Manager</h5>
            <small class="text-muted">{{ selectedRoute?.city_link || selectedRoute?.name }}</small>
          </div>
        </div>
        <div v-if="isDirty" class="badge bg-warning text-dark animate-pulse">
          <i class="fa fa-exclamation-circle me-1"></i> Unsaved Changes
        </div>
      </div>
    </template>

    <!-- Form Content -->
    <div class="h-100 d-flex flex-column">
      <!-- Header Controls -->
      <div class="p-4 border-bottom bg-white">
        <div class="row align-items-center g-3">
          <div class="col-md-8">
            <div class="input-group">
              <span class="input-group-text bg-light border-0">
                <i class="fa fa-search text-muted"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control border-0 bg-light"
                placeholder="Search stops by name..."
                @input="filterStops"
              >
            </div>
          </div>
          <div class="col-md-4 text-end">
            <div class="d-flex align-items-center justify-content-end">
              <span class="me-2 text-muted small">{{ sortedStops.length }} stops</span>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <i class="fa fa-filter me-1"></i> Filter
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#" @click="filterByStatus('all')">All Stops</a></li>
                  <li><a class="dropdown-item" href="#" @click="filterByStatus('active')">Active Only</a></li>
                  <li><a class="dropdown-item" href="#" @click="filterByStatus('inactive')">Inactive Only</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" href="#" @click="showAllStops = !showAllStops">
                    {{ showAllStops ? 'Hide Details' : 'Show Details' }}
                  </a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-3">
          <div class="d-flex align-items-center text-muted small">
            <i class="fa fa-info-circle me-2 text-info"></i>
            <span>Drag stops using the handle (<i class="fa fa-grip-vertical"></i>) to reorder.</span>
          </div>
        </div>
      </div>

      <!-- Stops List Container -->
      <div 
        class="flex-grow-1 overflow-hidden position-relative"
        ref="stopsContainer"
        @dragover.prevent="onDragOverContainer"
        @drop.prevent="onDrop"
        @dragleave="onDragLeave">
        
        <!-- Drag overlay -->
        <div 
          v-if="isDraggingOverContainer" 
          class="drag-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 z-1"
          :class="{ 'border-dashed': isDraggingOverContainer }">
          <div class="text-center p-4">
            <i class="fa fa-arrows-alt fa-3x text-primary mb-3"></i>
            <h5 class="text-primary">Drop to reorder</h5>
            <p class="text-muted">Release to place stop here</p>
          </div>
        </div>

        <!-- Stops List -->
        <div class="h-100 overflow-auto p-3">
          <div 
            v-for="(stop, index) in filteredStops" 
            :key="stop.id"
            :draggable="true"
            :data-index="index"
            @dragstart="onDragStart(index, $event)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(index, $event)"
            @dragenter="onDragEnter(index)"
            @dragleave="onDragLeaveItem"
            class="stop-card mb-3 rounded shadow-sm border"
            :class="{ 
              'dragging': dragIndex === index,
              'drag-over': dropIndex === index,
              'border-primary': dragIndex === index,
              'border-warning': !stop.active,
              'opacity-75': !stop.active
            }"
            >            
            <div class="card-body p-0">
              <div class="d-flex align-items-center p-3">
                <!-- Drag Handle -->
                <div 
                  class="drag-handle me-3 text-muted cursor-grab user-select-none"
                  @mousedown="startDrag(index)"
                  :title="stop.active ? 'Drag to reorder' : 'Inactive stop - cannot reorder'"
                  :class="{ 'cursor-not-allowed': !stop.active }">
                  <i class="fa fa-grip-vertical fa-lg" :class="{ 'text-muted': !stop.active }"></i>
                </div>                
                <!-- Sequence Badge -->
                <div class="sequence-badge me-3 position-relative">
                  <div class="position-absolute top-0 start-100 translate-middle" v-if="stop.sequance !== originalSequence(stop.id)">
                    <i class="fa fa-arrow-up text-success small"></i>
                  </div>
                  <span class="badge rounded-pill d-flex align-items-center justify-content-center" 
                    :class="stop.active ? 'bg-primary' : 'bg-secondary'"
                    style="width: 38px; height: 38px; font-size: 14px; font-weight: 600;">
                    {{ stop.sequance }}
                  </span>
                </div>                
                <!-- Stop Details -->
                <div class="flex-grow-1 me-3">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <h6 class="mb-0 fw-semibold" :class="{ 'text-muted': !stop.active }">
                        {{ stop.name }}
                        <span v-if="!stop.active" class="badge bg-secondary ms-2">Inactive</span>
                      </h6>
                      <div class="mt-1">
                        <small class="text-muted me-3">
                          <i class="fa fa-hashtag me-1"></i>ID: {{ stop.id }}
                        </small>
                        <small class="text-muted">
                          <i class="fa fa-clock me-1"></i>Seq: {{ stop.sequance }}
                        </small>
                      </div>
                    </div>                    
                    <!-- Status Toggle -->
                    <div class="form-check form-switch mb-0">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        role="switch"
                        :id="`stop-active-${stop.id}`"
                        v-model="stop.active"
                        @change="markAsDirty">
                      <label 
                        class="form-check-label small" 
                        :for="`stop-active-${stop.id}`"
                        :class="stop.active ? 'text-success' : 'text-danger'">
                        {{ stop.active ? 'Active' : 'Inactive' }}
                      </label>
                    </div>
                  </div>                  
                  <!-- Additional Info (Optional) -->
                  <div v-if="showAllStops" class="mt-2">
                    <div class="d-flex flex-wrap gap-2">
                      <span class="badge bg-light text-dark border">
                        <i class="fa fa-map-marker-alt me-1"></i>
                        {{ getStopType(stop.name) }}
                      </span>
                    </div>
                  </div>
                </div>                
                <!-- Action Buttons -->
                <div class="d-flex flex-column gap-2">
                  <!-- <button 
                    type="button" 
                    class="btn btn-sm btn-outline-primary"
                    @click="editStop(stop)"
                    title="Edit Stop">
                    <i class="fa fa-edit"></i>
                  </button> -->
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmRemoveStop(stop)"
                    title="Remove Stop">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </div>              
              <!-- Preview of next stop -->
              <div v-if="showAllStops && sortedStops[index + 1]" class="border-top px-3 py-2 bg-light">
                <small class="text-muted">
                  <i class="fa fa-arrow-down me-1"></i>
                  Next: {{ sortedStops[index + 1].name }}
                </small>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="!filteredStops.length" class="text-center py-5 my-5">
            <div class="empty-state-icon mb-4">
              <i class="fa fa-map-marker-alt fa-4x text-muted opacity-25"></i>
            </div>
            <h5 class="text-muted mb-2">No stops found</h5>
            <p class="text-muted mb-4">Try changing your search or filter criteria</p>
            <button class="btn btn-outline-primary" @click="clearFilters">
              <i class="fa fa-times me-1"></i> Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Footer with Actions -->
      <div class="border-top bg-white p-4">
        <div class="row align-items-center">
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <div class="form-check me-3">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="autoSaveToggle"
                  v-model="autoSave">
                <label class="form-check-label small" for="autoSaveToggle">
                  Auto-save changes
                </label>
              </div>
              <div class="vr me-3"></div>
              <div class="small text-muted">
                <i class="fa fa-database me-1"></i>
                Last saved: {{ lastSavedTime || 'Never' }}
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                class="btn btn-lg btn-outline-secondary px-4"
                @click="resetOrder"
                :disabled="!isDirty || isSaving"
                title="Discard all changes">
                <i class="fa fa-times me-2"></i> Discard
              </button>
              
              <button 
                type="button" 
                class="btn btn-lg btn-primary px-4 shadow-sm"
                @click="saveOrder"
                :disabled="(!isDirty && !forceSave) || isSaving"
                :class="{ 'btn-success': !isDirty && forceSave }">
                <template v-if="isSaving">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </template>
                <template v-else>
                  <i class="fa" :class="isDirty ? 'fa-save' : 'fa-check'"></i>
                  {{ isDirty ? 'Save Changes' : 'Saved' }}
                </template>
              </button>
            </div>
            <div v-if="isSaving" class="mt-2">
              <div class="progress" style="height: 3px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" style="width: 100%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StandardOffcanvas>
</template>

<script setup>
import { ref, computed, watch, nextTick, defineExpose } from 'vue'
import StandardOffcanvas from '@/components/plugins/StandardOffcanvas.vue';
import axios from "axios";
import { useNotification } from "@/composables/notification";
import { useAuthStore } from "@/stores/auth";

// Initialize auth and notification
const authStore = useAuthStore();
const { showAlert } = useNotification();

const props = defineProps({
  selectedRoute: Object,
  routeStops: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:stops', 'save-complete'])

// Refs
const addDocumentationOffcanvasRef = ref(false)
const stopsContainer = ref(null)
const dragIndex = ref(null)
const dropIndex = ref(null)
const isDragging = ref(false)
const isDraggingOverContainer = ref(false)
const isSaving = ref(false)
const autoSave = ref(false) // Set to false for manual save
const forceSave = ref(false)
const lastSavedTime = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const showAllStops = ref(false)

// Data
const originalStops = ref([])
const editedStops = ref([])

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL_2,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

// Computed
const sortedStops = computed(() => {
  return [...editedStops.value].sort((a, b) => a.sequance - b.sequance)
})

const filteredStops = computed(() => {
  let stops = sortedStops.value
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    stops = stops.filter(stop => 
      stop.name.toLowerCase().includes(query)
    )
  }
  
  // Apply status filter
  if (statusFilter.value === 'active') {
    stops = stops.filter(stop => stop.active)
  } else if (statusFilter.value === 'inactive') {
    stops = stops.filter(stop => !stop.active)
  }
  
  return stops
})

const isDirty = computed(() => {
  if (!originalStops.value.length || !editedStops.value.length) return false
  return JSON.stringify(originalStops.value) !== JSON.stringify(editedStops.value)
})

// Expose function to parent component
const openEditor = () => {
  addDocumentationOffcanvasRef.value = true
}

// Make function available to parent
defineExpose({
  openEditor,
  addDocumentationOffcanvasRef
})

// Watch for routeStops prop changes (data from parent)
watch(() => props.routeStops, (newStops) => {
  if (newStops && newStops.length > 0) {
    // Transform data to match expected format
    const transformedStops = newStops.map((stop, index) => ({
      id: stop.id || stop.stop_id || index + 1,
      name: stop.name || stop.stop || stop.stop_name || `Stop ${index + 1}`,
      sequance: stop.sequance || stop.sequence || stop.order || (index + 1),
      active: stop.active !== undefined ? stop.active : 
              (stop.is_active !== undefined ? stop.is_active : 
              (stop.status === 'active' ? true : true))
    }))
    
    originalStops.value = JSON.parse(JSON.stringify(transformedStops))
    editedStops.value = JSON.parse(JSON.stringify(transformedStops))
  } else {
    // Reset if no stops
    originalStops.value = []
    editedStops.value = []
  }
}, { immediate: true })

// Watch for when offcanvas opens
watch(addDocumentationOffcanvasRef, (isOpen) => {
  if (isOpen) {
    // Reset filters when opening
    searchQuery.value = ''
    statusFilter.value = 'all'
    showAllStops.value = false
    
    // Focus search input
    nextTick(() => {
      const searchInput = document.querySelector('input[placeholder="Search stops by name..."]')
      if (searchInput) {
        searchInput.focus()
      }
    })
  }
})

// Watch for changes if auto-save is enabled
watch(editedStops, () => {
  if (autoSave.value && isDirty.value) {
    // Debounce auto-save
    clearTimeout(window.autoSaveTimeout)
    window.autoSaveTimeout = setTimeout(() => {
      saveOrder()
    }, 2000)
  }
}, { deep: true })

// Drag and Drop Functions
function startDrag(index) {
  const stop = sortedStops.value[index]
  if (!stop.active) return // Don't allow dragging inactive stops
  
  dragIndex.value = index
  isDragging.value = true
  
  // Add dragging class to body
  document.body.classList.add('dragging-active')
}

function onDragStart(index, event) {
  const stop = sortedStops.value[index]
  if (!stop.active) {
    event.preventDefault()
    return
  }
  
  dragIndex.value = index
  isDragging.value = true
  
  // Set drag data
  event.dataTransfer.setData('text/plain', index.toString())
  event.dataTransfer.effectAllowed = 'move'
  
  // Add visual feedback
  setTimeout(() => {
    if (dragIndex.value !== null) {
      const elements = document.querySelectorAll('.stop-card')
      elements.forEach(el => {
        if (parseInt(el.dataset.index) === index) {
          el.classList.add('dragging')
        }
      })
    }
  }, 0)
}

function onDragEnter(index) {
  const stop = sortedStops.value[index]
  if (!stop.active) return
  
  if (dragIndex.value !== null && dragIndex.value !== index) {
    dropIndex.value = index
  }
}

function onDragOver(index, event) {
  const stop = sortedStops.value[index]
  if (!stop.active) {
    event.dataTransfer.dropEffect = 'none'
    return
  }
  
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  
  if (dragIndex.value !== null && dragIndex.value !== index) {
    dropIndex.value = index
    
    // Visual feedback for drag position
    const element = event.currentTarget
    if (element) {
      const rect = element.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      
      // Remove previous classes
      element.classList.remove('drag-over-top', 'drag-over-bottom')
      
      if (event.clientY < midpoint) {
        element.classList.add('drag-over-top')
      } else {
        element.classList.add('drag-over-bottom')
      }
    }
  }
}

function onDragOverContainer(event) {
  event.preventDefault()
  isDraggingOverContainer.value = true
}

function onDragLeaveItem(event) {
  // Only remove classes if leaving the element
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom')
    dropIndex.value = null
  }
}

function onDragLeave() {
  isDraggingOverContainer.value = false
}

function onDragEnd() {
  resetDragState()
}

function onDrop(event) {
  event.preventDefault()
  isDraggingOverContainer.value = false
  
  if (dragIndex.value !== null && dropIndex.value !== null) {
    const fromIndex = dragIndex.value
    const toIndex = dropIndex.value
    
    // Get actual indices from filtered array
    const fromStop = filteredStops.value[fromIndex]
    const toStop = filteredStops.value[toIndex]
    
    const actualFromIndex = editedStops.value.findIndex(
      s => s.id === fromStop.id
    )
    const actualToIndex = editedStops.value.findIndex(
      s => s.id === toStop.id
    )
    
    if (actualFromIndex !== -1 && actualToIndex !== -1) {
      reorderStops(actualFromIndex, actualToIndex)
    }
  }
  
  resetDragState()
}

function resetDragState() {
  dragIndex.value = null
  dropIndex.value = null
  isDragging.value = false
  isDraggingOverContainer.value = false
  
  // Remove all drag classes
  document.querySelectorAll('.stop-card').forEach(el => {
    el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom')
  })
  
  document.body.classList.remove('dragging-active')
}

function reorderStops(fromIndex, toIndex) {
  const newStops = [...editedStops.value]
  const [movedStop] = newStops.splice(fromIndex, 1)
  newStops.splice(toIndex, 0, movedStop)
  
  // Update sequence numbers
  newStops.forEach((stop, index) => {
    stop.sequance = index + 1
  })
  
  editedStops.value = newStops
}

// Helper functions
function originalSequence(stopId) {
  const originalStop = originalStops.value.find(s => s.id === stopId)
  return originalStop ? originalStop.sequance : 0
}

function getStopType(name) {
  if (!name) return 'Stop'
  if (name.includes('TERMINAL')) return 'Terminal'
  if (name.includes('OFFICE')) return 'Office'
  if (name.includes('FERRY')) return 'Ferry'
  if (name.includes('BOOKING')) return 'Booking Office'
  return 'Stop'
}

function markAsDirty() {
  // Force re-render
  editedStops.value = [...editedStops.value]
}

// Filter functions
function filterStops() {
  // Filtering is handled by computed property
}

function filterByStatus(status) {
  statusFilter.value = status
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
}

// Stop management functions
function editStop(stop) {
  // Implement edit functionality
  console.log('Edit stop:', stop)
  showAlert('info', `Editing "${stop.name}"`)
}

function confirmRemoveStop(stop) {
  if (confirm(`Are you sure you want to remove "${stop.name}" from this route?`)) {
    editedStops.value = editedStops.value.filter(s => s.id !== stop.id)
    // Renumber remaining stops
    editedStops.value.forEach((stop, index) => {
      stop.sequance = index + 1
    })
    
    showAlert('success', `Removed "${stop.name}" from route`)
  }
}

// Save and reset functions
function resetOrder() {
  if (!isDirty.value) return
  
  if (confirm('Are you sure you want to discard all changes?')) {
    editedStops.value = JSON.parse(JSON.stringify(originalStops.value))
    forceSave.value = false
    showAlert('info', 'Changes discarded')
  }
}

async function saveOrder() {
  try {
    isSaving.value = true
    
    // Prepare data for backend - adjust based on your API
    const updateData = {
      route_id: props.selectedRoute?.id,
      stops: editedStops.value.map(stop => ({
        id: stop.id,
        sequance: stop.sequance,
        is_active: stop.active ? 1 : 0
      }))
    }
    
    console.log('Saving stops:', updateData)
    
    // Call your API endpoint - adjust endpoint as needed
    const response = await axiosInstance.post('locations/update-route-stops', updateData)
    
    if (response.data.status !== "success") {
      throw new Error(response.data.message || 'Failed to save')
    }
    
    const result = response.data
    
    // Update original stops
    originalStops.value = JSON.parse(JSON.stringify(editedStops.value))
    
    // Update last saved time
    lastSavedTime.value = new Date().toLocaleTimeString()
    forceSave.value = true
    
    // Emit events to parent
    emit('update:stops', editedStops.value)
    emit('save-complete', result)
    
    // Show success notification
    showAlert('success', 'Stops updated successfully!')
    
    // Reset force save after 3 seconds
    setTimeout(() => {
      forceSave.value = false
    }, 3000)
    
  } catch (error) {
    console.error('Error saving stops:', error)
    showAlert('error', error.response?.data?.message || 'Failed to save changes. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.stop-card {
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
}

.stop-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stop-card.dragging {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stop-card.drag-over-top {
  border-top: 3px solid #0d6efd;
  margin-top: -1px;
  padding-top: 3px;
}

.stop-card.drag-over-bottom {
  border-bottom: 3px solid #0d6efd;
  margin-bottom: -1px;
  padding-bottom: 3px;
}

.drag-handle {
  transition: all 0.2s;
  padding: 8px;
  border-radius: 4px;
}

.drag-handle:hover:not(.cursor-not-allowed) {
  background-color: #f8f9fa;
  color: #0d6efd !important;
  cursor: grab;
}

.drag-handle:active:not(.cursor-not-allowed) {
  cursor: grabbing;
}

.cursor-not-allowed {
  cursor: not-allowed;
  opacity: 0.5;
}

.drag-overlay {
  animation: pulse 1.5s infinite;
  z-index: 1000;
}

.border-dashed {
  border: 3px dashed #0d6efd !important;
}

@keyframes pulse {
  0% { opacity: 0.1; }
  50% { opacity: 0.2; }
  100% { opacity: 0.1; }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

.empty-state-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.form-switch .form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.form-switch .form-check-input {
  height: 1.5em;
  width: 3em;
}

.user-select-none {
  user-select: none;
}

.vr {
  width: 1px;
  height: 1.5em;
  background-color: #dee2e6;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Better drag & drop visual feedback */
.dragging-active {
  cursor: grabbing;
}

.dragging-active * {
  cursor: grabbing !important;
}
</style>