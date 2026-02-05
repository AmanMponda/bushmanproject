<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <ol class="breadcrumb mb-0">
      <li class="breadcrumb-item">
        <router-link to="/module-settings/seat-maps">SEAT MAPS</router-link>
      </li>
      <li class="breadcrumb-item active">BUILD NEW SEAT MAP</li>
    </ol>
    <button @click="goBack" class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill">
      <i class="fa fa-arrow-left me-1"></i> Back
    </button>
  </div>

  <div class="row gx-4">
    <div class="col-lg-8">
      <card class="mb-4">
        <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
          Seat Map Details
        </card-header>
        <card-body>
          <div class="mb-3">
            <label class="form-label">Seat Map Name <span class="text-danger">*</span></label>
            <input type="text" class="form-control" v-model="seatmapName" placeholder="e.g. EMJ SERIES VIP (49)" />
          </div>
          <div class="mb-3">
            <label class="form-label">Seat Map Description</label>
            <input type="text" class="form-control" v-model="seatmapDescription" placeholder="Optional description" />
          </div>
        </card-body>
      </card>

      <card class="mb-4">
        <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
          Grid Configuration
        </card-header>
        <card-body>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Number of Rows</label>
              <input type="number" class="form-control" v-model.number="rows" min="1" max="50" />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Number of Columns</label>
              <input type="number" class="form-control" v-model.number="cols" min="1" max="10" />
            </div>
          </div>
        </card-body>
        <card-footer>
          <button class="btn btn-primary" @click="initializeGrid" :disabled="!rows || !cols">
            <i class="fa fa-th me-1"></i> Generate Grid
          </button>
        </card-footer>
      </card>
    </div>

    <div class="col-lg-4">
      <card class="mb-4">
        <card-header class="d-flex align-items-center fw-400 bg-inverse bg-opacity-15">
          <div class="flex-1">Seat Map Editor</div>
        </card-header>
        <card-body>
          <!-- Legend -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-seat me-1"></div>
              <span class="small">Seat</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-space me-1"></div>
              <span class="small">Space</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-door me-1"></div>
              <span class="small">Door</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-toilet me-1"></div>
              <span class="small">Toilet</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-staff me-1"></div>
              <span class="small">Staff</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-fridge me-1"></div>
              <span class="small">Fridge</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-color seat-type-cabinet me-1"></div>
              <span class="small">Cabinet</span>
            </div>
          </div>

          <!-- Grid Editor -->
          <div class="vehicle-container">
            <div class="vehicle-frame vehicle-top"></div>
            <div class="vehicle-body">
              <div class="vehicle-frame vehicle-left"></div>
              <div class="seat-grid">
                <template v-if="showGrid">
                  <div v-for="(row, yIndex) in grid" :key="yIndex" class="seat-row">
                    <div
                      v-for="(cell, xIndex) in row"
                      :key="xIndex"
                      class="seat-cell"
                      :class="`seat-type-${cell.type.toLowerCase()}`"
                      @click="openEditModal(cell)"
                    >
                      <div class="seat-label">{{ cell.label }}</div>
                      <div class="seat-coords">{{ cell.y }},{{ cell.x }}</div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div v-for="i in 8" :key="'row-' + i" class="seat-row">
                    <div v-for="j in 5" :key="'cell-' + i + '-' + j" class="seat-cell shimmer-effect">
                      <div class="seat-label shimmer-placeholder"></div>
                    </div>
                  </div>
                </template>
              </div>
              <div class="vehicle-frame vehicle-right"></div>
            </div>
            <div class="vehicle-frame vehicle-bottom"></div>
            <div class="vehicle-wheel front-wheel"></div>
            <div class="vehicle-wheel rear-wheel"></div>
          </div>
        </card-body>
        <card-footer>
          <div class="d-flex justify-content-end">
            <button class="btn btn-success" @click="submit" :disabled="!showGrid || saving">
              <i class="fa fa-save me-1"></i> {{ saving ? 'Saving...' : 'Save Seat Map' }}
            </button>
          </div>
        </card-footer>
      </card>
    </div>
  </div>

  <!-- Edit Cell Modal -->
  <StandardModal 
    id="editCellModal" 
    ref="editModalRef" 
    title="Edit Cell" 
    size="sm" 
    :centered="true"
    :showFooter="true"
    @save="applyChanges"
  >
    <div class="mb-3">
      <label class="form-label">Type</label>
      <select class="form-select" v-model="cellForm.type">
        <option v-for="type in seatTypes" :key="type.id" :value="type.name">
          {{ type.name }}
        </option>
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Label</label>
      <input
        type="text"
        class="form-control"
        v-model="cellForm.label"
        :maxlength="currentMaxLength"
        @input="cellForm.label = ($event.target as HTMLInputElement)?.value?.toUpperCase() || ''"
        :placeholder="`Max ${currentMaxLength} characters`"
      />
      <small class="text-muted">
        Maximum {{ currentMaxLength }} characters for {{ cellForm.type }}
      </small>
    </div>
  </StandardModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import StandardModal from '@/components/plugins/StandardModal.vue'
import seatMapService from '@/services/seatMapService'
import { useNotification } from '@/composables/notification'

interface SeatCell {
  x: number
  y: number
  type: string
  label: string
}

const router = useRouter()
const { showAlert } = useNotification()

// Navigation
const goBack = () => router.back()

// Form state
const seatmapName = ref('')
const seatmapDescription = ref('')
const rows = ref(13)
const cols = ref(5)
const showGrid = ref(false)
const saving = ref(false)
const grid = ref<SeatCell[][]>([])
const seatTypes = ref<{ id: number; name: string }[]>([])

// Edit modal state
const editModalRef = ref<{ show: () => void; hide: () => void } | null>(null)
const currentCell = ref<SeatCell | null>(null)
const cellForm = ref({
  type: 'SEAT',
  label: ''
})

// Initialize grid
const initializeGrid = () => {
  if (grid.value.length > 0) {
    showAlert('warning', 'Grid already generated. Adjust rows/cols to modify.')
    showGrid.value = true
    return
  }

  if (!rows.value || !cols.value) {
    showAlert('error', 'Please specify rows and columns')
    return
  }

  grid.value = Array.from({ length: rows.value }, (_, y) =>
    Array.from({ length: cols.value }, (_, x) => ({
      x: x + 1,
      y: y + 1,
      type: 'SEAT',
      label: ''
    }))
  )
  showGrid.value = true
}

// Open edit modal for a cell
const openEditModal = (cell: SeatCell) => {
  currentCell.value = cell
  cellForm.value = {
    type: cell.type,
    label: cell.label
  }
  editModalRef.value?.show()
}

// Apply changes to the cell
const applyChanges = () => {
  if (!currentCell.value) return

  const maxLength = getMaxLengthForType(cellForm.value.type)
  if (cellForm.value.label.length > maxLength) {
    showAlert('error', `Label for ${cellForm.value.type} cannot exceed ${maxLength} characters`)
    return
  }

  currentCell.value.type = cellForm.value.type
  currentCell.value.label = cellForm.value.label

  // Auto-generate seat label if empty
  if (currentCell.value.type === 'SEAT' && !currentCell.value.label) {
    currentCell.value.label = `${String.fromCharCode(64 + currentCell.value.y)}${currentCell.value.x}`
  }

  editModalRef.value?.hide()
}

// Get max length for label based on type
const getMaxLengthForType = (type: string): number => {
  switch (type) {
    case 'SEAT': return 3
    case 'DOOR': return 4
    case 'TOILET': return 6
    case 'SPACE': return 5
    default: return 6
  }
}

const currentMaxLength = computed(() => getMaxLengthForType(cellForm.value.type))

// Watch for row/col changes to update grid dynamically
watch([rows, cols], ([newRows, newCols], [oldRows, oldCols]) => {
  if (!showGrid.value || grid.value.length === 0) return

  // Handle row changes
  if (newRows > oldRows) {
    for (let y = oldRows; y < newRows; y++) {
      grid.value.push(
        Array.from({ length: newCols }, (_, x) => ({
          x: x + 1,
          y: y + 1,
          type: 'SPACE',
          label: ''
        }))
      )
    }
  } else if (newRows < oldRows) {
    grid.value.splice(newRows)
  }

  // Handle column changes
  grid.value.forEach((row, y) => {
    if (newCols > oldCols) {
      for (let x = oldCols; x < newCols; x++) {
        row.push({
          x: x + 1,
          y: y + 1,
          type: 'SPACE',
          label: ''
        })
      }
    } else if (newCols < oldCols) {
      row.splice(newCols)
    }
  })
})

// Fetch seat types
const fetchSeatTypes = async () => {
  try {
    const response = await seatMapService.getLayoutComponents()
    seatTypes.value = response.data.data?.components || [
      { id: 1, name: 'SEAT' },
      { id: 2, name: 'SPACE' },
      { id: 3, name: 'DOOR' },
      { id: 4, name: 'TOILET' },
      { id: 5, name: 'STAFF' },
      { id: 6, name: 'FRIDGE' },
      { id: 7, name: 'CABINET' }
    ]
  } catch (error) {
    console.error('Error fetching seat types:', error)
    // Fallback to default types
    seatTypes.value = [
      { id: 1, name: 'SEAT' },
      { id: 2, name: 'SPACE' },
      { id: 3, name: 'DOOR' },
      { id: 4, name: 'TOILET' },
      { id: 5, name: 'STAFF' },
      { id: 6, name: 'FRIDGE' },
      { id: 7, name: 'CABINET' }
    ]
  }
}

// Submit seat map
const submit = async () => {
  if (!seatmapName.value.trim()) {
    showAlert('error', 'Please enter a seat map name')
    return
  }

  if (grid.value.length === 0) {
    showAlert('error', 'Please generate a grid first')
    return
  }

  const layouts = grid.value.flat().map(cell => ({
    seat_map_id: 1,
    label: cell.label || '',
    type: cell.type as any,
    position_x: cell.x,
    position_y: cell.y
  }))

  try {
    saving.value = true
    const response = await seatMapService.createSeatMap({
      seat_map_name: seatmapName.value.trim(),
      seat_map_description: seatmapDescription.value.trim(),
      layouts
    })

    if (response.data.success) {
      showAlert('success', 'Seat map created successfully')
      router.push('/module-settings/seat-maps')
    } else {
      showAlert('error', 'Failed to create seat map')
    }
  } catch (error: any) {
    console.error('Error saving seat map:', error)
    showAlert('error', error.response?.data?.message || 'Failed to save seat map')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSeatTypes()
})
</script>

<style scoped>
.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: auto;
  padding: 5px;
  background: #f5f5f5;
  border-radius: 4px;
}

.seat-row {
  display: flex;
  gap: 2px;
}

.seat-cell {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all 0.1s;
  user-select: none;
  background-color: white;
}

.seat-cell:hover {
  transform: scale(1.03);
  z-index: 1;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.seat-label {
  font-weight: bold;
  font-size: 0.8rem;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
  padding: 0 2px;
}

.seat-coords {
  position: absolute;
  bottom: 2px;
  font-size: 0.6rem;
  color: #666;
}

/* Cell type colors */
.seat-type-seat {
  background-color: #01ca01;
  color: white;
}

.seat-type-space {
  background-color: #f8f9fa;
}

.seat-type-door {
  background-color: #0ab0fd;
  color: white;
}

.seat-type-toilet {
  background-color: #de3535;
  color: white;
}

.seat-type-staff {
  background-color: #f9c015;
}

.seat-type-fridge {
  background-color: #ccba61;
}

.seat-type-cabinet {
  background-color: #264191;
  color: white;
}

/* Legend colors */
.legend-color {
  width: 16px;
  height: 16px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

/* Vehicle Frame styles */
.vehicle-container {
  position: relative;
  padding: 20px;
}

.vehicle-frame {
  background: #dee2e6;
  position: absolute;
}

.vehicle-top {
  top: 0;
  left: 10px;
  right: 10px;
  height: 10px;
  border-radius: 10px 10px 0 0;
}

.vehicle-bottom {
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 10px;
  border-radius: 0 0 10px 10px;
}

.vehicle-left {
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 10px;
}

.vehicle-right {
  right: 0;
  top: 10px;
  bottom: 10px;
  width: 10px;
}

.vehicle-body {
  display: flex;
}

.vehicle-wheel {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #333;
  border-radius: 50%;
  left: -5px;
}

.front-wheel {
  top: 30%;
}

.rear-wheel {
  bottom: 30%;
}

/* Shimmer Effect */
.shimmer-effect {
  position: relative;
  overflow: hidden;
  background: #f0f0f0 !important;
  border-color: #e0e0e0 !important;
}

.shimmer-effect::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.5s infinite;
}

.shimmer-placeholder {
  width: 60%;
  height: 16px;
  margin: 0 auto;
  background: #e0e0e0;
  border-radius: 3px;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
