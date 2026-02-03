<template>
  <div class="vehicle-profile-page">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/bushman/dashboard">Home</router-link></li>
          <li class="breadcrumb-item"><a href="#">Assets</a></li>
          <li class="breadcrumb-item">Fleet Master</li>
          <li class="breadcrumb-item active">{{ vehicleDetails?.motor_vehicle?.registration_number || vehicleDetails?.name || 'Vehicle' }}</li>
        </ul>
      </div>
      <button type="button" class="btn btn-outline-secondary text-nowrap btn-sm rounded-pill" @click="emit('back')">
        <i class="fa fa-arrow-left me-1"></i> Back
      </button>
    </div>

    <div class="card">
      <div class="card-header d-flex align-items-center bg-light fw-400">
        <div class="d-flex align-items-center">
          <div class="vehicle-icon me-2">
            <i class="fa fa-car fa-3x text-primary"></i>
          </div>
          <div>
            <h4 class="mb-0">
              {{ vehicleDetails?.motor_vehicle?.registration_number || vehicleDetails?.name || 'Loading...' }}
            </h4>
            <small class="text-muted">
              {{ vehicleDetails?.motor_vehicle?.vehicle_model?.make || '' }}
              {{ vehicleDetails?.motor_vehicle?.vehicle_model?.model || '' }}
              <span v-if="vehicleDetails?.motor_vehicle?.manufacture_year">&bull; {{ vehicleDetails.motor_vehicle.manufacture_year }}</span>
            </small>
          </div>
        </div>

        <div class="ms-auto d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary" :disabled="loading || !vehicleDetails?.id" @click="emit('refresh')">
            <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>
            Refresh
          </button>
          <button class="btn btn-outline-primary" :disabled="!vehicleDetails?.id" @click="emit('edit')">
            Edit
          </button>
          <button class="btn btn-success btn-sm" @click="emit('add')">
            + Add
          </button>
        </div>
      </div>

      <div class="card-header p-0 border-bottom">
        <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2 compact-tabs">
          <li v-for="tab in detailTabs" :key="tab.key" class="nav-item flex-fill text-center">
            <a href="#" class="nav-link" :class="{ active: activeVehicleTab === tab.key }" @click.prevent="activeVehicleTab = tab.key">
              <i :class="tab.icon"></i> {{ tab.label }}
            </a>
          </li>
        </ul>
      </div>

      <div class="tab-content p-4">
        <div v-if="!vehicleDetails" class="alert alert-info">
          <i class="fa fa-spinner fa-spin me-2"></i>Loading vehicle details...
        </div>

        <div v-else class="tab-pane fade show active">
          <div v-if="activeVehicleTab === 'overview'" class="row">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">Vehicle Details</div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6" v-for="spec in vehicleDetailSpecs" :key="spec.key">
                      <div class="d-flex mb-3 border-bottom pb-2">
                        <i :class="spec.icon + ' text-primary me-2 mt-1'"></i>
                        <div>
                          <div class="text-muted small">{{ spec.label }}</div>
                          <div class="fw-semibold">
                            <span>{{ spec.value || '-' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="vehicleDetails.description" class="mt-3">
                    <div class="text-muted small mb-1">Notes / Description</div>
                    <div class="fw-semibold">{{ vehicleDetails.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span><i class="fa fa-folder-open me-2"></i>Recent Documents</span>
                  <button
                    class="btn btn-link btn-sm p-0 text-decoration-none"
                    :disabled="!vehicleDetails?.id"
                    @click="vehicleDetails?.id && emit('refresh-documents', vehicleDetails.id)"
                  >
                    <i class="fa fa-sync"></i>
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="vehicleDocuments.length" class="list-group list-group-flush">
                    <div class="list-group-item px-0 py-2 d-flex align-items-center" v-for="doc in vehicleDocuments.slice(0, 5)" :key="doc.id">
                      <div class="me-3" style="width: 40px; height: 40px; flex-shrink: 0;">
                        <div
                          v-if="(doc.mime_type || '').toString().toLowerCase().startsWith('image')"
                          class="w-100 h-100 border rounded overflow-hidden d-flex align-items-center justify-content-center bg-light cursor-pointer"
                          @click="emit('open-image-preview', doc)"
                        >
                          <img v-if="previewMap[doc.id]" :src="previewMap[doc.id]" class="w-100 h-100 object-fit-cover" />
                          <i v-else class="fa fa-image text-muted"></i>
                        </div>
                        <div v-else class="w-100 h-100 border rounded d-flex align-items-center justify-content-center bg-light text-secondary">
                          <i class="fa fa-file-alt"></i>
                        </div>
                      </div>
                      <div class="flex-grow-1 min-width-0">
                        <div class="text-truncate fw-semibold small text-dark" :title="doc.name || doc.title">{{ doc.name || doc.title || doc.code || 'Document' }}</div>
                        <div class="d-flex align-items-center">
                          <span class="badge bg-light text-secondary border border-light rounded-pill" style="font-size: 0.65rem">{{ doc.mime_type?.split('/').pop() || 'FILE' }}</span>
                        </div>
                      </div>
                      <button class="btn btn-light btn-sm text-primary ms-2" @click="emit('view-document', doc)" title="Open in browser">
                        <i class="fa fa-eye"></i>
                      </button>
                    </div>
                  </div>
                  <div v-else class="text-center py-4 text-muted small bg-light rounded border border-dashed">
                    <i class="fa fa-folder-open mb-2 fs-4 text-secondary"></i>
                    <p class="mb-0">No documents available</p>
                  </div>
                  <div v-if="vehicleDocuments.length > 5" class="text-center mt-2">
                    <button class="btn btn-link btn-sm" @click="activeVehicleTab = 'documents'">
                      View all {{ vehicleDocuments.length }} documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeVehicleTab === 'documents'" class="row">
            <div class="col-12">
              <div class="card mb-3">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col-md-8">
                      <h5 class="mb-2"><i class="fa fa-upload text-primary me-2"></i>Upload New Document</h5>
                      <p class="text-muted small mb-0">Add documents related to this vehicle (registration, insurance, maintenance records, etc.)</p>
                    </div>
                    <div class="col-md-4">
                      <div class="input-group">
                        <input type="file" class="form-control" @change="emit('file-change', $event)" />
                        <button class="btn btn-primary" @click="emit('upload-document')" :disabled="uploading">
                          <i class="fa fa-upload me-1"></i>
                          <span v-if="uploading">Uploading...</span>
                          <span v-else>Upload</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span><i class="fa fa-folder-open me-2"></i>All Documents <span class="badge bg-primary ms-2">{{ vehicleDocuments.length }}</span></span>
                  <button
                    class="btn btn-link btn-sm p-0 text-decoration-none"
                    :disabled="!vehicleDetails?.id"
                    @click="vehicleDetails?.id && emit('refresh-documents', vehicleDetails.id)"
                  >
                    <i class="fa fa-sync"></i> Refresh
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="vehicleDocuments.length" class="row g-3">
                    <div class="col-md-6 col-lg-4" v-for="doc in vehicleDocuments" :key="doc.id">
                      <div class="card h-100 shadow-sm">
                        <div class="card-body p-3">
                          <div class="d-flex align-items-start">
                            <div class="me-3" style="width: 50px; height: 50px; flex-shrink: 0;">
                              <div
                                v-if="(doc.mime_type || '').toString().toLowerCase().startsWith('image')"
                                class="w-100 h-100 border rounded overflow-hidden d-flex align-items-center justify-content-center bg-light cursor-pointer"
                                @click="emit('open-image-preview', doc)"
                              >
                                <img v-if="previewMap[doc.id]" :src="previewMap[doc.id]" class="w-100 h-100 object-fit-cover" />
                                <i v-else class="fa fa-image text-muted fa-2x"></i>
                              </div>
                              <div v-else class="w-100 h-100 border rounded d-flex align-items-center justify-content-center bg-light text-secondary">
                                <i class="fa fa-file-alt fa-2x"></i>
                              </div>
                            </div>
                            <div class="flex-grow-1 min-width-0">
                              <div class="text-truncate fw-semibold mb-1" :title="doc.name || doc.title">{{ doc.name || doc.title || doc.code || 'Document' }}</div>
                              <div class="mb-2">
                                <span class="badge bg-light text-secondary border rounded-pill" style="font-size: 0.7rem">{{ doc.mime_type?.split('/').pop()?.toUpperCase() || 'FILE' }}</span>
                              </div>
                              <button class="btn btn-sm btn-outline-primary w-100" @click="emit('view-document', doc)">
                                <i class="fa fa-eye me-1"></i> Open
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-5">
                    <i class="fa fa-folder-open mb-3 fs-1 text-secondary" style="opacity: 0.3;"></i>
                    <h6 class="text-muted">No documents uploaded yet</h6>
                    <p class="text-muted small mb-0">Upload your first document using the form above</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="d-flex flex-column justify-content-center align-items-center text-center" style="height: 300px;">
            <i class="fa fa-hourglass-half text-muted fa-2x mb-2"></i>
            <h6 class="fw-bold">Coming Soon</h6>
            <p class="text-muted">This section is still under progress.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { VehicleAsset } from '@/services/vehicleAssetService'

const props = defineProps<{
  vehicleDetails: VehicleAsset | null
  vehicleDocuments: any[]
  uploading: boolean
  loading: boolean
  previewMap: Record<number | string, string>
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'refresh'): void
  (e: 'edit'): void
  (e: 'add'): void
  (e: 'refresh-documents', id: number): void
  (e: 'file-change', event: Event): void
  (e: 'upload-document'): void
  (e: 'view-document', doc: any): void
  (e: 'open-image-preview', doc: any): void
}>()

const activeVehicleTab = ref<'overview' | 'documents' | 'more'>('overview')

const detailTabs = [
  { key: 'overview', label: 'Overview', icon: 'fa fa-home' },
  { key: 'documents', label: 'Documents', icon: 'fa fa-folder-open' },
  { key: 'more', label: 'More', icon: 'fa fa-ellipsis-h' }
]

function formatLongDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

const vehicleDetailSpecs = computed(() => {
  const v = props.vehicleDetails
  const mv = v?.motor_vehicle
  return [
    { key: 'registration', label: 'Registration', icon: 'fa fa-id-card', value: mv?.registration_number || v?.name || '-' },
    { key: 'make', label: 'Make', icon: 'fa fa-industry', value: mv?.vehicle_model?.make || '-' },
    { key: 'model', label: 'Model', icon: 'fa fa-car', value: mv?.vehicle_model?.model || '-' },
    { key: 'year', label: 'Year', icon: 'fa fa-calendar', value: mv?.manufacture_year || '-' },
    { key: 'color', label: 'Color', icon: 'fa fa-palette', value: mv?.color || '-' },
    { key: 'fuel', label: 'Fuel Type', icon: 'fa fa-gas-pump', value: mv?.fuel_used?.name || '-' },
    { key: 'chassis', label: 'Chassis Number', icon: 'fa fa-hashtag', value: mv?.chassis_number || '-' },
    { key: 'engine', label: 'Engine Number', icon: 'fa fa-cog', value: mv?.engine_number || '-' },
    { key: 'acq', label: 'Acquisition Date', icon: 'fa fa-calendar-check', value: formatLongDate(v?.acquisition_date) || '-' },
    { key: 'axle', label: 'Axle Count', icon: 'fa fa-truck', value: mv?.axle_count ? `${mv.axle_count} Axles` : '-' }
  ]
})
</script>

<style scoped>
.vehicle-profile-page {
  width: 100%;
}

.vehicle-profile-page .card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.vehicle-profile-page .card-header {
  background: #f8f9fa !important;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2c3e50;
}

.vehicle-icon {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.compact-tabs .nav-link {
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}
</style>
