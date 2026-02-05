<template>
  <div v-if="visible" class="vehicle-profile-content">
    <div class="content-wrapper">
      <div class="content-header d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Vehicle Profile</h4>
        <button type="button" class="btn-close" @click="closeModal"></button>
      </div>
      <div class="content-body">
              
              <!-- Vehicle Header -->
              <div class="mb-4">
                <div class="d-flex align-items-center">
                  <div class="vehicle-icon-large me-3">
                    <i :class="vehicleIcon + ' fa-3x text-primary'"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h2 class="mb-1">{{ displayName }}</h2>
                    <p class="text-muted mb-0">
                      {{ displayMake }} {{ displayModel }}
                      <span v-if="displayYear"> • {{ displayYear }}</span>
                    </p>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary" @click="refreshData" :disabled="loading">
                      <i class="fa fa-sync" :class="{ 'fa-spin': loading }"></i> Refresh
                    </button>
                    <button class="btn btn-primary" @click="editVehicleDetails" :disabled="!vehicleDetails">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <!-- Navigation Tabs -->
              <ul class="nav nav-tabs mb-4">
                <li class="nav-item" v-for="tab in tabs" :key="tab.key">
                  <a
                    class="nav-link"
                    :class="{ active: activeTab === tab.key }"
                    href="#"
                    @click.prevent="switchTab(tab)"
                  >
                    <i :class="tab.icon" class="me-2"></i>{{ tab.label }}
                  </a>
                </li>
              </ul>

              <!-- Tab Content -->
              <div class="tab-content">
                
                <!-- Overview Tab -->
                <div v-if="activeTab === 'overview'" class="tab-pane fade show active">
                  <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-3">Loading vehicle details...</p>
                  </div>
                  
                  <div v-else class="row g-4">
                    <!-- Vehicle Details Card -->
                    <div class="col-md-6">
                      <div class="card h-100">
                        <div class="card-header bg-white">
                          <h5 class="mb-0">Vehicle Details</h5>
                        </div>
                        <div class="card-body">
                          <div class="row g-3">
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-id-card text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Name</small>
                                  <strong>{{ displayName }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-industry text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Make</small>
                                  <strong>{{ displayMake || 'N/A' }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-car text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Model</small>
                                  <strong>{{ displayModel || 'N/A' }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-calendar text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Year</small>
                                  <strong>{{ displayYear || 'N/A' }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-shapes text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Body Type</small>
                                  <strong>{{ displayBodyType }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-users text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Seat Capacity</small>
                                  <strong>{{ displaySeatCapacity }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-gas-pump text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Fuel Type</small>
                                  <strong>{{ displayFuelType }}</strong>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="detail-item">
                                <i class="fa fa-cog text-primary me-2"></i>
                                <div>
                                  <small class="text-muted d-block">Engine Capacity</small>
                                  <strong>{{ displayEngineCapacity }}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Recent Documents Card -->
                    <div class="col-md-6">
                      <div class="card h-100">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                          <h6 class="mb-0 text-secondary fw-normal">
                            <i class="fa fa-folder-open me-2"></i>Recent Documents
                          </h6>
                          <button class="btn btn-sm btn-link text-primary p-0" @click="fetchDocuments">
                            <i class="fa fa-sync-alt"></i>
                          </button>
                        </div>
                        <div class="card-body">
                          <div v-if="vehicleDocuments.length === 0" class="text-center py-5 text-muted">
                            <i class="fa fa-folder-open fa-3x mb-3 opacity-25"></i>
                            <p>No documents available</p>
                          </div>
                          <div v-else class="document-list">
                            <div 
                              v-for="doc in vehicleDocuments.slice(0, 5)" 
                              :key="doc.id"
                              class="document-item d-flex align-items-center p-3 mb-2 rounded"
                            >
                              <div class="document-icon-wrapper bg-light rounded p-3 me-3">
                                <i class="fa fa-file-alt fa-lg text-muted"></i>
                              </div>
                              <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-1">
                                  <span class="badge bg-light text-dark me-2 text-lowercase">{{ getFileExtension(doc.name) }}</span>
                                </div>
                                <div class="fw-normal text-dark">{{ doc.name || 'Document' }}</div>
                              </div>
                              <button class="btn btn-sm btn-light rounded-circle" @click="viewDocument(doc)" style="width: 36px; height: 36px;">
                                <i class="fa fa-eye text-primary"></i>
                              </button>
                            </div>
                          </div>
                          <div v-if="vehicleDocuments.length > 5" class="text-center mt-3">
                            <button class="btn btn-link text-primary" @click="activeTab = 'documents'">
                              View all {{ vehicleDocuments.length }} documents
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Specifications Tab -->
                <div v-if="activeTab === 'specifications'" class="tab-pane fade show active">
                  <div class="row g-4">
                    <div class="col-lg-6">
                      <div class="card">
                        <div class="card-header bg-white">
                          <h5 class="mb-0">
                            <i class="fa fa-cogs me-2"></i>Essential Specifications
                          </h5>
                        </div>
                        <div class="card-body">
                          <div class="row g-3">
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Name:</span>
                                <strong>{{ displayName }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Make:</span>
                                <strong>{{ displayMake || 'N/A' }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Model:</span>
                                <strong>{{ displayModel || 'N/A' }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Year:</span>
                                <strong>{{ displayYear || 'N/A' }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Body Type:</span>
                                <strong>{{ displayBodyType }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Engine Capacity:</span>
                                <strong>{{ displayEngineCapacity }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Seat Capacity:</span>
                                <strong>{{ displaySeatCapacity }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Fuel Type:</span>
                                <strong>{{ displayFuelType }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2">
                                <span class="text-muted">Chassis Number:</span>
                                <strong>{{ displayChassisNumber }}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-lg-6" v-if="isBusVehicle">
                      <div class="card">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                          <h5 class="mb-0">
                            <i :class="vehicleIcon + ' me-2'"></i>{{ seatLayoutTitle }}
                          </h5>
                          <button class="btn btn-sm btn-outline-secondary" @click="fetchBusSeatMap">
                            <i class="fa fa-cog"></i>
                          </button>
                        </div>
                        <div class="card-body">
                          <div v-if="loadingSeatMap" class="text-center py-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-3">Loading seat layout...</p>
                          </div>
                          <div v-else-if="seatMapData.length > 0" class="seat-map-container">
                            <div class="seat-map p-3">
                              <div 
                                v-for="(row, rowIndex) in seatMapData" 
                                :key="rowIndex" 
                                class="seat-row d-flex justify-content-center mb-2"
                              >
                                <div
                                  v-for="(seat, colIndex) in row"
                                  :key="colIndex"
                                  class="seat mx-1"
                                  :class="{
                                    'seat-available': !['SPACE', 'TOILET', 'TOI', 'DOOR', 'DO'].includes(seat.label),
                                    'seat-toilet': ['TOILET', 'TOI'].includes(seat.label),
                                    'seat-door': ['DOOR', 'DO'].includes(seat.label),
                                    'seat-aisle': seat.label === 'SPACE'
                                  }"
                                >
                                  <span v-if="!['SPACE', 'TOILET', 'TOI', 'DOOR', 'DO'].includes(seat.label)" class="seat-label">
                                    {{ seat.label }}
                                  </span>
                                  <i v-else-if="['TOILET', 'TOI'].includes(seat.label)" class="fas fa-toilet"></i>
                                  <i v-else-if="['DOOR', 'DO'].includes(seat.label)" class="fas fa-door-open"></i>
                                </div>
                              </div>
                            </div>
                            <!-- Legend -->
                            <div class="mt-3 d-flex justify-content-center gap-3">
                              <div class="d-flex align-items-center">
                                <div class="seat-legend-color seat-available me-2"></div>
                                <small>Seat</small>
                              </div>
                              <div class="d-flex align-items-center">
                                <div class="seat-legend-color seat-toilet me-2"></div>
                                <small>Toilet</small>
                              </div>
                              <div class="d-flex align-items-center">
                                <div class="seat-legend-color seat-door me-2"></div>
                                <small>Door</small>
                              </div>
                            </div>
                          </div>
                          <div v-else class="text-center py-5 text-muted">
                            <i :class="vehicleIcon + ' fa-3x mb-3'"></i>
                            <p>No seat layout available</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Additional Info Card (for non-buses) -->
                    <div class="col-lg-6" v-if="!isBusVehicle">
                      <div class="card">
                        <div class="card-header bg-white">
                          <h5 class="mb-0">
                            <i class="fa fa-info-circle me-2"></i>Additional Information
                          </h5>
                        </div>
                        <div class="card-body">
                          <div class="row g-3">
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Color:</span>
                                <strong>{{ displayColor }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2 border-bottom">
                                <span class="text-muted">Registration Number:</span>
                                <strong>{{ displayName }}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="d-flex justify-content-between py-2">
                                <span class="text-muted">Vehicle Type:</span>
                                <strong>{{ vehicleTypeLabel }}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Route Tab -->
                <div v-if="activeTab === 'route'" class="tab-pane fade show active">
                  <div class="card">
                    <div class="card-body text-center py-5">
                      <i class="fa fa-route fa-3x text-muted mb-3"></i>
                      <h5>Route Information</h5>
                      <p class="text-muted">Route tracking and details coming soon...</p>
                    </div>
                  </div>
                </div>

                <!-- Fuel Tab -->
                <div v-if="activeTab === 'fuel'" class="tab-pane fade show active">
                  <div class="card">
                    <div class="card-body text-center py-5">
                      <i class="fa fa-gas-pump fa-3x text-muted mb-3"></i>
                      <h5>Fuel Information</h5>
                      <p class="text-muted">Fuel consumption and efficiency data coming soon...</p>
                    </div>
                  </div>
                </div>

                <!-- Service History Tab -->
                <div v-if="activeTab === 'service-history'" class="tab-pane fade show active">
                  <div class="card">
                    <div class="card-body text-center py-5">
                      <i class="fa fa-wrench fa-3x text-muted mb-3"></i>
                      <h5>Service History</h5>
                      <p class="text-muted">Service records and maintenance history coming soon...</p>
                    </div>
                  </div>
                </div>

                <!-- Work Orders Tab -->
                <div v-if="activeTab === 'work-orders'" class="tab-pane fade show active">
                  <div class="card">
                    <div class="card-body text-center py-5">
                      <i class="fa fa-tasks fa-3x text-muted mb-3"></i>
                      <h5>Work Orders</h5>
                      <p class="text-muted">Work orders and repair tasks coming soon...</p>
                    </div>
                  </div>
                </div>

                <!-- Documents Tab -->
                <div v-if="activeTab === 'documents'" class="tab-pane fade show active">
                  <div class="card mb-3">
                    <div class="card-body">
                      <div class="row align-items-center">
                        <div class="col-md-8">
                          <h5 class="mb-2"><i class="fa fa-upload text-primary me-2"></i>Upload New Document</h5>
                          <p class="text-muted small mb-0">Add documents related to this vehicle</p>
                        </div>
                        <div class="col-md-4">
                          <div class="input-group">
                            <input type="file" class="form-control" @change="onFileChange" />
                            <button class="btn btn-primary" @click="uploadDocument" :disabled="uploading">
                              <i class="fa fa-upload me-1"></i>
                              {{ uploading ? 'Uploading...' : 'Upload' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                      <h5 class="mb-0">
                        <i class="fa fa-folder-open me-2"></i>All Documents
                        <span class="badge bg-primary ms-2">{{ vehicleDocuments.length }}</span>
                      </h5>
                      <button class="btn btn-sm btn-link" @click="fetchDocuments">
                        <i class="fa fa-sync"></i> Refresh
                      </button>
                    </div>
                    <div class="card-body">
                      <div v-if="vehicleDocuments.length === 0" class="text-center py-5 text-muted">
                        <i class="fa fa-folder-open fa-3x mb-3"></i>
                        <h6>No documents uploaded yet</h6>
                        <p>Upload your first document using the form above</p>
                      </div>
                      <div v-else class="row g-3">
                        <div class="col-md-6 col-lg-4" v-for="doc in vehicleDocuments" :key="doc.id">
                          <div class="card shadow-sm">
                            <div class="card-body">
                              <div class="d-flex align-items-start">
                                <div class="me-3">
                                  <i class="fa fa-file-pdf fa-3x text-danger" v-if="doc.mime_type?.includes('pdf')"></i>
                                  <i class="fa fa-file-image fa-3x text-primary" v-else-if="doc.mime_type?.includes('image')"></i>
                                  <i class="fa fa-file fa-3x text-secondary" v-else></i>
                                </div>
                                <div class="flex-grow-1">
                                  <h6 class="mb-1">{{ doc.name || 'Document' }}</h6>
                                  <small class="text-muted">{{ doc.mime_type?.split('/').pop()?.toUpperCase() }}</small>
                                  <div class="mt-2">
                                    <button class="btn btn-sm btn-outline-primary w-100" @click="viewDocument(doc)">
                                      <i class="fa fa-eye me-1"></i> View
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
      </div>
    </div>

    <!-- Document Viewer Modal -->
    <div v-if="showDocumentViewer" class="document-viewer-overlay" @click.self="closeDocumentViewer">
      <div class="document-viewer-container">
        <div class="document-viewer-header">
          <h5 class="mb-0">{{ documentViewerName }}</h5>
          <button class="btn btn-light btn-sm" @click="closeDocumentViewer">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <div class="document-viewer-body">
          <iframe v-if="documentViewerMimeType?.includes('pdf')" :src="documentViewerUrl" class="document-iframe"></iframe>
          <img v-else-if="documentViewerMimeType?.startsWith('image')" :src="documentViewerUrl" class="document-image" alt="Document" />
          <div v-else class="text-center p-5">
            <i class="fa fa-file-alt fa-4x text-muted mb-3"></i>
            <h6>Preview not available</h6>
            <a :href="documentViewerUrl" download class="btn btn-primary mt-3">
              <i class="fa fa-download me-1"></i> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  vehicleUuid: { type: [String, Number], required: true },
  vehicleDetails: { type: Object, default: null },
  vehicleDocuments: { type: Array, default: () => [] },
  uploading: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  previewMap: { type: Object, default: () => ({}) },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'refresh', 'refresh-documents', 'file-change', 'upload-document', 'view-document'])

// State
const loadingSeatMap = ref(false)
const selectedVehicleFile = ref(null)
const seatMapData = ref([])

// Modal states
const showDocumentViewer = ref(false)
const documentViewerUrl = ref(null)
const documentViewerName = ref('')
const documentViewerMimeType = ref('')

// Tab state
const activeTab = ref('overview')
const tabs = ref([
  { key: 'overview', label: 'Overview', icon: 'fa fa-home' },
  { key: 'documents', label: 'Documents', icon: 'fa fa-folder-open' },
  { key: 'specifications', label: 'Specifications', icon: 'fa fa-cogs' },
  { key: 'route', label: 'Route', icon: 'fa fa-route' },
  { key: 'fuel', label: 'Fuel', icon: 'fa fa-gas-pump' },
  { key: 'service-history', label: 'Service History', icon: 'fa fa-wrench' },
  { key: 'work-orders', label: 'Work Orders', icon: 'fa fa-tasks' },
])

// Computed for vehicle display data
const displayName = computed(() => {
  const details = props.vehicleDetails
  if (!details) return props.vehicleUuid || 'Loading...'
  return details.registration_number || details.name || props.vehicleUuid || 'Vehicle'
})

const displayMake = computed(() => {
  const details = props.vehicleDetails
  if (!details) return ''
  return details.make || details.motor_vehicle?.vehicle_model?.make || ''
})

const displayModel = computed(() => {
  const details = props.vehicleDetails
  if (!details) return ''
  return details.model || details.motor_vehicle?.vehicle_model?.model || ''
})

const displayYear = computed(() => {
  const details = props.vehicleDetails
  if (!details) return ''
  return details.manufacture_year || details.motor_vehicle?.manufacture_year || details.year || ''
})

const displayBodyType = computed(() => {
  const details = props.vehicleDetails
  return details?.body_type || details?.motor_vehicle?.body_type || '-'
})

const displaySeatCapacity = computed(() => {
  const details = props.vehicleDetails
  return details?.seat_capacity || details?.motor_vehicle?.seat_capacity || '-'
})

const displayFuelType = computed(() => {
  const details = props.vehicleDetails
  return details?.fuel_used?.name || details?.motor_vehicle?.fuel_used?.name || details?.fuel_type || '-'
})

const displayEngineCapacity = computed(() => {
  const details = props.vehicleDetails
  const capacity = details?.engine_capacity_cc || details?.motor_vehicle?.engine_capacity_cc
  return capacity ? `${capacity} cc` : '-'
})

const displayChassisNumber = computed(() => {
  const details = props.vehicleDetails
  return details?.chassis_number || details?.motor_vehicle?.chassis_number || '-'
})

const displayColor = computed(() => props.vehicleDetails?.color || '-')

const vehicleIcon = computed(() => {
  const details = props.vehicleDetails
  const make = (details?.make || details?.motor_vehicle?.vehicle_model?.make || '').toUpperCase()
  const model = (details?.model || details?.motor_vehicle?.vehicle_model?.model || '').toUpperCase()
  
  // Motorcycles
  if (make.includes('HERO') || make.includes('SINORAY') || make.includes('T BETTER') || 
      model.includes('RACER') || model.includes('DAWN') || model.includes('SMASH')) {
    return 'fa fa-motorcycle'
  }
  
  // Trailers
  if (make.includes('TRAILER') || model.includes('TRAILER')) {
    return 'fa fa-trailer'
  }
  
  // Heavy Machinery / Bulldozers / Graders
  if (make.includes('CATERPILLAR') || make.includes('YTO') || make.includes('VALMET') ||
      model.includes('D6GC') || model.includes('140') || model.includes('DFH')) {
    return 'fa fa-tractor'
  }
  
  // Trucks
  if (make.includes('UNIMOG') || make.includes('BEDFORD') || make.includes('SCANIA') || 
      make.includes('MERCEDEZ') || make.includes('BENZ') || make.includes('SINO') ||
      model.includes('HOWO') || model.includes('93H') || model.includes('1017')) {
    return 'fa fa-truck'
  }
  
  // Pickup Trucks
  if (model.includes('RANGER') || model.includes('PICK UP')) {
    return 'fa fa-truck-pickup'
  }
  
  // SUVs / 4x4
  if (make.includes('LAND ROVER') || model.includes('LANDCRUISER') || 
      model.includes('LAND CRUISER') || model.includes('RANGE ROVER') ||
      model.includes('MJ 4X4')) {
    return 'fa fa-car-side'
  }
  
  // Buses
  if (model.includes('BUS') || model.includes('COASTER') || details?.seat_capacity > 15) {
    return 'fa fa-bus'
  }
  
  // Default to car
  return 'fa fa-car'
})

const isBusVehicle = computed(() => {
  const details = props.vehicleDetails
  const model = (details?.model || details?.motor_vehicle?.vehicle_model?.model || '').toUpperCase()
  return model.includes('BUS') || model.includes('COASTER') || (details?.seat_capacity || 0) > 15
})

const seatLayoutTitle = computed(() => {
  return isBusVehicle.value ? 'Bus Seat Layout' : 'Seating Layout'
})

const vehicleTypeLabel = computed(() => {
  const details = props.vehicleDetails
  const make = (details?.make || details?.motor_vehicle?.vehicle_model?.make || '').toUpperCase()
  const model = (details?.model || details?.motor_vehicle?.vehicle_model?.model || '').toUpperCase()
  
  if (make.includes('HERO') || make.includes('SINORAY') || make.includes('T BETTER')) return 'Motorcycle'
  if (make.includes('TRAILER') || model.includes('TRAILER')) return 'Trailer'
  if (make.includes('CATERPILLAR') || make.includes('YTO') || make.includes('VALMET')) return 'Heavy Machinery'
  if (make.includes('UNIMOG') || make.includes('BEDFORD') || make.includes('SCANIA') || 
      make.includes('MERCEDEZ') || make.includes('SINO')) return 'Truck'
  if (model.includes('RANGER') || model.includes('PICK UP')) return 'Pickup Truck'
  if (make.includes('LAND ROVER') || model.includes('LANDCRUISER') || model.includes('RANGE ROVER')) return 'SUV / 4x4'
  if (model.includes('BUS') || model.includes('COASTER')) return 'Bus'
  return 'Car'
})

// Methods
function refreshData() {
  emit('refresh')
}

function fetchDocuments() {
  emit('refresh-documents')
}

function getFileExtension(filename) {
  if (!filename) return ''
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ext
}

async function fetchBusSeatMap() {
  // Only fetch seat map for bus vehicles
  if (!isBusVehicle.value) return
  
  // Try to get the real UUID from vehicle details
  let realUuid = props.vehicleDetails?.real_uuid || 
                 props.vehicleDetails?.uuid || 
                 props.vehicleDetails?.motor_vehicle?.uuid
  
  // If no real_uuid found, try to fetch it from the API
  if (!realUuid && props.vehicleUuid) {
    try {
      const response = await fetch(`https://abserp.iosuite.org/api/v1/vehicle-master/vehicles/${props.vehicleUuid}`)
      const result = await response.json()
      if (result.success && result.data && result.data.length > 0) {
        realUuid = result.data[0].real_uuid
      }
    } catch (err) {
      console.warn('Could not fetch real UUID:', err)
    }
  }
  
  if (!realUuid) {
    console.warn('No real UUID found for seat map fetch')
    return
  }
  
  loadingSeatMap.value = true
  try {
    const response = await axios.get(`https://abserp.iosuite.org/api/v1/bus/seat-map?uuid=${realUuid}`)
    const seats = response.data.data.seats

    seats.forEach(seat => {
      seat.X = parseInt(seat.X)
      seat.Y = parseInt(seat.Y)
    })

    const positionMap = {}
    seats.forEach(seat => {
      const key = `${seat.X}_${seat.Y}`
      if (!positionMap[key]) positionMap[key] = []
      positionMap[key].push(seat)
    })

    const maxX = Math.max(...seats.map(s => s.X))
    const maxY = Math.max(...seats.map(s => s.Y))
    const grid = []

    for (let y = 1; y <= maxY; y++) {
      const rowSeats = []
      for (let x = 1; x <= maxX; x++) {
        const key = `${x}_${y}`
        if (positionMap[key] && positionMap[key].length > 0) {
          rowSeats.push(positionMap[key][0])
        } else {
          rowSeats.push({ X: x, Y: y, label: 'SPACE' })
        }
      }
      grid.push(rowSeats)
    }

    seatMapData.value = grid
  } catch (error) {
    console.error('Error fetching seat map:', error)
    // Silently fail for non-bus vehicles or unavailable seat maps
  } finally {
    loadingSeatMap.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab.key
  // Only fetch seat map for bus vehicles when switching to specifications
  if (tab.key === 'specifications' && seatMapData.value.length === 0 && isBusVehicle.value) {
    fetchBusSeatMap()
  }
}

function onFileChange(e) {
  emit('file-change', e)
}

function uploadDocument() {
  emit('upload-document')
}

function viewDocument(doc) {
  emit('view-document', doc)
}

function editVehicleDetails() {
  // Emit event or open edit modal
  console.log('Edit vehicle', props.vehicleDetails)
}

function closeModal() {
  emit('close')
}
</script>

<style scoped>
.vehicle-profile-content {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #f8f9fa;
}

.content-wrapper {
  padding: 2rem;
  max-width: 100%;
}

.content-header {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.content-body {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-top: 1rem;
}

.vehicle-icon-large {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.nav-tabs {
  border-bottom: 2px solid #dee2e6;
  display: flex;
  width: 100%;
  gap: 0;
}

.nav-tabs .nav-item {
  flex: 1;
  text-align: center;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  padding: 0.75rem 2rem;
  font-weight: 500;
  width: 100%;
  text-align: center;
}

.nav-tabs .nav-link:hover {
  color: #495057;
  background: #f8f9fa;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  background: transparent;
  border-bottom: 3px solid #0d6efd;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

/* Seat Map Styles */
.seat-map {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.seat {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s;
}

.seat-available {
  background: #28a745;
  color: white;
  border: 1px solid #1e7e34;
}

.seat-toilet {
  background: #17a2b8;
  color: white;
}

.seat-door {
  background: #ffc107;
  color: #000;
}

.seat-aisle {
  background: transparent;
}

.seat-legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

/* Document Viewer */
.document-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.document-viewer-container {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.document-viewer-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-viewer-body {
  flex: 1;
  overflow: hidden;
  background: #f1f1f1;
}

.document-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.document-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  margin: auto;
}

/* Recent Documents */
.document-list {
  max-height: 400px;
  overflow-y: auto;
}

.document-item {
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.document-item:hover {
  background-color: #f8f9fa !important;
  border-color: #e9ecef;
}

.document-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
}
</style>
