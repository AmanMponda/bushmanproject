<template>
  <div>
    <div class="row justify-content-center">
      <div class="col-xl-12 p-1">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/module-settings">SETTINGS</router-link></li>
          <li class="breadcrumb-item active">SEAT MAPS</li>
        </ol>

        <div class="p-3 bg-white">
          <div class="d-flex justify-content-end mb-3">
            <router-link to="/module-settings/seat-maps/builder">
              <button class="btn btn-outline-primary me-2 text-end">
                <i class="fa fa-chair me-1"></i> Build New Seat Map
              </button>
            </router-link>
          </div>

          <div class="server-table">
            <StandardDataTable 
              :columns="columns" 
              :data="seatMapList" 
              :loading="loading"
              :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" 
              :disablePagination="loading" 
              :showDateFilters="false"
              @update:filters="onTableFiltersUpdate"
            >
              <template #passenger_seat="{ row }">
                <button class="btn btn-light rounded-pill fs-6">
                  <i class="fa-solid fa-chair" style="color: #74C0FC;"></i> {{ row.passenger_seat }}
                </button>
              </template>
              <template #staff_seat="{ row }">
                <button class="btn btn-light rounded-pill fs-6">
                  <i class="fa-solid fa-chair" style="color: #74C0FC;"></i> {{ row.staff_seat }}
                </button>
              </template>
              <template #door="{ row }">
                <span class="badge text-bg-success fs-6" v-if="row.door === 'YES'">
                  <i class="bi bi-check-circle"></i>
                </span>
                <span class="badge text-bg-danger fs-6" v-else>
                  <i class="bi bi-x-square"></i>
                </span>
              </template>
              <template #toilet="{ row }">
                <span class="badge text-bg-success fs-6" v-if="row.toilet === 'YES'">
                  <i class="bi bi-check-circle"></i>
                </span>
                <span class="badge text-bg-danger fs-6" v-else>
                  <i class="bi bi-x-square"></i>
                </span>
              </template>
              <template #cabinet="{ row }">
                <span class="badge text-bg-success fs-6" v-if="row.cabinet !== 0">
                  <i class="bi bi-check-circle"></i>
                </span>
                <span v-else class="badge text-bg-danger fs-6">
                  <i class="bi bi-x-square"></i>
                </span>
              </template>
              <template #fridge="{ row }">
                <span class="badge text-bg-success fs-6" v-if="row.fridge !== 0">
                  <i class="bi bi-check-circle"></i>
                </span>
                <span v-else class="badge text-bg-danger fs-6">
                  <i class="bi bi-x-square"></i>
                </span>
              </template>

              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-secondary btn-sm" @click="openVehicleModal(row)" title="View Assigned Vehicles">
                    <i class="fa fa-car"></i>
                  </button>
                  <router-link :to="`/module-settings/seat-maps/${row.id}`">
                    <button class="btn btn-primary btn-sm" title="View Details">
                      <i class="fa fa-eye"></i>
                    </button>
                  </router-link>
                  <button 
                    v-if="hasPermission('CAN_DELETE_SEAT_MAP')" 
                    class="btn btn-danger btn-sm" 
                    @click="deleteSeatMap(row)"
                    title="Delete"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Seat Preview Modal -->
  <StandardModal 
    id="seatPreviewModal" 
    ref="previewModalRef" 
    title="Seat Preview" 
    size="lg" 
    :centered="true"
  >
    <div v-if="loadingPreview" class="d-flex justify-content-center align-items-center" style="height: 150px;">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else-if="seatMapData" class="card">
      <div class="card-body">
        <div class="bus-direction text-center mb-1">
          <span class="badge bg-primary py-1 px-2 small">
            <i class="fas fa-bus me-1 small"></i> Front ↑
          </span>
        </div>
        <div class="seat-map p-1">
          <div 
            v-for="(row, rowIndex) in seatMapData.seat_layout" 
            :key="rowIndex"
            class="seat-row d-flex justify-content-center mb-1"
          >
            <div 
              v-for="(item, colIndex) in row" 
              :key="colIndex"
              class="seat mx-1 d-flex align-items-center justify-content-center" 
              :class="{
                'seat-available': item.type === 'SEAT',
                'seat-staff': item.type === 'STAFF',
                'seat-toilet': item.type === 'TOILET',
                'seat-door': item.type === 'DOOR',
                'seat-fridge': item.type === 'FRIDGE',
                'seat-cabinet': item.type === 'CABINET',
                'seat-aisle': item.type === 'SPACE'
              }"
            >
              <span v-if="item.type === 'SEAT' || item.type === 'STAFF'" class="seat-label small">{{ item.label }}</span>
              <i v-else-if="item.type === 'TOILET'" class="fas fa-toilet text-info small"></i>
              <i v-else-if="item.type === 'DOOR'" class="fas fa-door-open text-warning small"></i>
              <i v-else-if="item.type === 'FRIDGE'" class="fas fa-snowflake text-info small"></i>
              <i v-else-if="item.type === 'CABINET'" class="fas fa-archive text-secondary small"></i>
            </div>
          </div>
        </div>

        <!-- Compact Legend -->
        <div class="mt-2">
          <h6 class="text-muted mb-1 small">Legend:</h6>
          <div class="d-flex flex-wrap gap-1 small">
            <span class="badge bg-success py-1 px-2">Seat</span>
            <span class="badge bg-info py-1 px-2"><i class="fas fa-toilet me-1"></i>Staff</span>
            <span class="badge bg-secondary py-1 px-2"><i class="fas fa-toilet me-1"></i>Toilet</span>
            <span class="badge bg-warning py-1 px-2"><i class="fas fa-door-open me-1"></i>Door</span>
          </div>
        </div>
      </div>
    </div>
  </StandardModal>

  <!-- Assigned Vehicles Modal -->
  <StandardModal 
    id="vehiclesModal" 
    ref="vehiclesModalRef" 
    title="Assigned Vehicles" 
    size="md" 
    :centered="true"
  >
    <div v-if="selectedVehicles.length === 0" class="text-center py-4 text-muted">
      <i class="fa fa-car fa-3x mb-3"></i>
      <p>No vehicles assigned to this seat map</p>
    </div>
    <ul v-else class="list-group">
      <li v-for="vehicle in selectedVehicles" :key="vehicle.name" class="list-group-item">
        <i class="fa fa-car me-2"></i>{{ vehicle.name }}
      </li>
    </ul>
  </StandardModal>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'
import StandardModal from '@/components/plugins/StandardModal.vue'
import seatMapService from '@/services/seatMapService'
import { useNotification } from '@/composables/notification'
import { useAuthStore } from '@/stores/auth'
import { useSwal } from '@/composables/useSwal'

const authStore = useAuthStore()
const { showAlert } = useNotification()
const swal = useSwal()

// Refs for modals
const previewModalRef = ref<{ show: () => void; hide: () => void } | null>(null)
const vehiclesModalRef = ref<{ show: () => void; hide: () => void } | null>(null)

// Table state
const tableFilters = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc' as const,
  showAdvancedFilters: false,
  date_from: '',
  date_to: ''
})

const columns = ref([
  { key: 'index', label: 'Sno', visible: true, sortable: false, width: '50px' },
  { key: 'name', label: 'Name', visible: true, sortable: true },
  { key: 'seat_identifications', label: 'Seat Identification', visible: true, sortable: true },
  { key: 'passenger_seat', label: 'Passenger Seat', visible: true, sortable: true },
  { key: 'staff_seat', label: 'Staff Seat', visible: true, sortable: true },
  { key: 'door', label: 'Door', visible: true, sortable: true },
  { key: 'toilet', label: 'Toilet', visible: true, sortable: true },
  { key: 'fridge', label: 'Fridge', visible: true, sortable: true },
  { key: 'cabinet', label: 'Cabinet', visible: true, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
])

const loading = ref(false)
const loadingPreview = ref(false)
const seatMapList = ref<any[]>([])
const seatMapData = ref<any>(null)
const selectedVehicles = ref<any[]>([])

// Permission check
const hasPermission = (permission: string) => {
  return authStore.permissions?.includes(permission) ?? false
}

// Table filter update
const onTableFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
}

// Open vehicle modal
const openVehicleModal = (row: any) => {
  selectedVehicles.value = row.vehicles_assigned || row.buses_assigned || []
  vehiclesModalRef.value?.show()
}

// Fetch seat map preview
const fetchSeatMapPreview = async (id: number | string) => {
  try {
    loadingPreview.value = true
    const response = await seatMapService.getSeatMap(id)
    seatMapData.value = response.data
    previewModalRef.value?.show()
  } catch (error) {
    console.error('Error fetching seat map:', error)
    showAlert('error', 'Failed to load seat map preview')
  } finally {
    loadingPreview.value = false
  }
}

// Fetch all seat maps
const fetchSeatMaps = async () => {
  try {
    loading.value = true
    const response = await seatMapService.listSeatMaps()
    seatMapList.value = response.data.data.map((data: any, index: number) => ({
      index: index + 1,
      id: data.seat_map.id,
      name: data.seat_map.name,
      seat_identifications: data.seat_map.seat_identifications,
      description: data.seat_map.description,
      toilet: data.summary.toilet,
      passenger_seat: data.summary.passenger_seat,
      staff_seat: data.summary.staff_seat,
      driver: data.summary.driver,
      fridge: data.summary.fridge,
      door: data.summary.door,
      cabinet: data.summary.cabinet,
      vehicles_assigned: data.summary.vehicles_assigned || data.summary.buses_assigned || []
    }))
  } catch (error) {
    console.error('Error fetching seat maps:', error)
    showAlert('error', 'Failed to load seat maps')
  } finally {
    loading.value = false
  }
}

// Delete seat map
const deleteSeatMap = async (row: any) => {
  const confirmed = await swal.confirm({
    title: 'Delete Seat Map',
    text: `Are you sure you want to delete "${row.name}"?`,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!confirmed) return

  try {
    loading.value = true
    await seatMapService.deleteSeatMap(row.id)
    showAlert('success', 'Seat map deleted successfully')
    await fetchSeatMaps()
  } catch (error) {
    console.error('Error deleting seat map:', error)
    showAlert('error', 'Failed to delete seat map')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSeatMaps()
})
</script>

<style scoped>
/* Unified Seat Map Styles */
.seat-map {
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.seat-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 8px;
  width: 100%;
}

/* Base Seat Styles */
.seat {
  width: 30px;
  height: 30px;
  min-width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  position: relative;
  transition: all 0.2s ease;
  margin: 4px 2px;
  padding: 5px;
}

/* Seat States */
.seat-available {
  background-color: #28a745;
  border: 1px solid #1e7e34;
  color: white;
  cursor: pointer;
}

.seat-staff {
  background-color: #17a2b8;
  color: white;
  border: 1px solid #138496;
}

.seat-toilet {
  background-color: #6c757d;
  color: white;
  border: 1px solid #5c636a;
}

.seat-door {
  background-color: #ffc107;
  color: #000;
  border: 1px solid #e0a800;
}

.seat-fridge {
  background-color: #0dcaf0;
  color: white;
  border: 1px solid #0bacce;
}

.seat-cabinet {
  background-color: #6c757d;
  color: white;
  border: 1px solid #5c636a;
}

.seat-aisle {
  background-color: transparent;
  border: none;
}

/* Seat Label */
.seat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  line-height: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .seat {
    width: 25px;
    height: 25px;
    font-size: 10px;
  }

  .seat-label {
    font-size: 0.65rem;
  }
}
</style>
