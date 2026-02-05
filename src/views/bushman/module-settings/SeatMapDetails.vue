<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <ol class="breadcrumb mb-0">
      <li class="breadcrumb-item"><router-link to="/module-settings/seat-maps">SEAT MAPS</router-link></li>
      <li class="breadcrumb-item active">{{ seatmapName || 'VIEW SEAT MAP' }}</li>
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
            <label class="form-label">Seat Map Name</label>
            <input type="text" class="form-control" v-model="seatmapName" />
          </div>
          <div class="mb-3">
            <label class="form-label">Seat Map Identification</label>
            <select class="form-select" v-model="seatmapIdentification">
              <option value="">Select Identification</option>
              <option v-for="type in seatIdentifications" :key="type.id" :value="type.name">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Seat Map Configuration</label>
            <select class="form-select" v-model="seatmapConfiguration">
              <option value="">Select Configuration</option>
              <option v-for="type in seatConfigurations" :key="type.id" :value="type.name">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Seat Map Description</label>
            <input type="text" class="form-control" v-model="seatmapDescription" />
          </div>
        </card-body>
      </card>
    </div>

    <div class="col-lg-4">
      <card>
        <card-body>
          <div class="card">
            <div class="card-header bg-light py-2">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="card-title mb-0 text-sm">
                  <i class="fas fa-map me-1"></i>Seat Preview
                </h6>
                <button class="btn btn-sm btn-secondary" @click="printSeatMap">
                  <i class="fa fa-print me-1"></i> Print
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="loading" class="d-flex justify-content-center align-items-center" style="height: 150px">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
              <div v-else-if="seatMapData" class="">
                <div class="seat-map p-1">
                  <!-- Column Hover Zone -->
                  <div class="d-flex mb-1">
                    <div class="me-2" style="width: 50px;"></div>
                    <div 
                      v-for="(item, colIndex) in (seatMapData.seat_layout[0] || [])" 
                      :key="colIndex"
                      class="d-flex justify-content-center position-relative" 
                      style="width: 40px; height: 20px"
                      @mouseenter="hoveredCol = colIndex" 
                      @mouseleave="hoveredCol = null"
                    >
                      <div v-if="hoveredCol === colIndex" class="d-flex flex-column position-absolute" style="top: -45px; z-index: 6">
                        <button class="btn btn-sm btn-success mb-1" @click.stop="addColumn(colIndex)">+</button>
                        <button class="btn btn-sm btn-danger" @click.stop="deleteColumn(colIndex)">-</button>
                      </div>
                    </div>
                  </div>

                  <!-- Rows -->
                  <div 
                    v-for="(row, rowIndex) in seatMapData.seat_layout" 
                    :key="rowIndex"
                    class="d-flex align-items-center mb-1" 
                    @mouseenter="hoveredRow = rowIndex"
                    @mouseleave="hoveredRow = null"
                  >
                    <!-- Row Buttons -->
                    <div class="me-2 d-flex flex-column" style="width: 50px;">
                      <button 
                        v-show="hoveredRow === rowIndex" 
                        class="btn btn-sm btn-success mb-1" 
                        @click="addRow(rowIndex)"
                      >+</button>
                      <button 
                        v-show="hoveredRow === rowIndex" 
                        class="btn btn-sm btn-danger" 
                        @click="deleteRow(rowIndex)"
                      >-</button>
                    </div>

                    <!-- Seat Row -->
                    <div 
                      v-for="(item, colIndex) in row" 
                      :key="item.id || colIndex" 
                      @click="onSeatClick(item)"
                      class="seat mx-1 d-flex align-items-center justify-content-center" 
                      :class="{
                        'seat-available': item.type === 'SEAT',
                        'seat-toilet': item.type === 'TOILET',
                        'seat-door': item.type === 'DOOR',
                        'seat-staff': item.type === 'STAFF',
                        'seat-fridge': item.type === 'FRIDGE',
                        'seat-cabinet': item.type === 'CABINET',
                        'seat-aisle': item.type === 'SPACE',
                      }"
                    >
                      <span v-if="item.type === 'SEAT' || item.type === 'STAFF'" class="seat-label small">
                        {{ item.label }}
                      </span>
                      <i v-else-if="item.type === 'TOILET'" class="fas fa-toilet text-info small"></i>
                      <i v-else-if="item.type === 'FRIDGE'" class="fas fa-snowflake text-info small"></i>
                      <i v-else-if="item.type === 'CABINET'" class="fas fa-archive text-info small"></i>
                      <i v-else-if="item.type === 'DOOR'" class="fas fa-door-open text-warning small"></i>
                    </div>
                  </div>
                </div>

                <!-- Legend -->
                <div class="mt-2">
                  <h6 class="text-muted mb-1 small">Legend:</h6>
                  <div class="d-flex flex-wrap gap-1 small">
                    <span class="badge bg-success py-1 px-2">Seat</span>
                    <span class="badge bg-info py-1 px-2">Staff</span>
                    <span class="badge bg-secondary py-1 px-2"><i class="fas fa-door-open me-1"></i>Door</span>
                    <span class="badge bg-secondary py-1 px-2"><i class="fas fa-toilet me-1"></i>Toilet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </card-body>
        <card-footer>
          <div class="d-flex justify-content-end">
            <button class="btn btn-success" @click="submit" :disabled="saving">
              <i class="fa fa-save me-1"></i> {{ saving ? 'Saving...' : 'Update Seat Map' }}
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StandardModal from '@/components/plugins/StandardModal.vue'
import seatMapService from '@/services/seatMapService'
import { useNotification } from '@/composables/notification'

interface SeatCell {
  id?: number | string
  seat_map_id?: number
  label: string
  type: string
  position_x: number
  position_y: number
}

const route = useRoute()
const router = useRouter()
const { showAlert } = useNotification()

// Navigation
const goBack = () => router.back()

// State
const loading = ref(false)
const saving = ref(false)
const seatMapData = ref<{ seat_map: any; seat_layout: SeatCell[][] } | null>(null)
const seatmapName = ref('')
const seatmapDescription = ref('')
const seatmapIdentification = ref('')
const seatmapConfiguration = ref('')

// Seat types and configurations
const seatTypes = ref<{ id: number; name: string }[]>([])
const seatConfigurations = ref<{ id: number; name: string }[]>([])
const seatIdentifications = ref<{ id: number; name: string }[]>([])

// Hover states for row/column buttons
const hoveredRow = ref<number | null>(null)
const hoveredCol = ref<number | null>(null)

// Edit modal state
const editModalRef = ref<{ show: () => void; hide: () => void } | null>(null)
const currentCell = ref<SeatCell | null>(null)
const cellForm = ref({
  type: 'SEAT',
  label: '',
  position_x: 0,
  position_y: 0
})
const grid = ref<SeatCell[]>([])

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

// Fetch seat map
const fetchSeatMap = async () => {
  try {
    loading.value = true
    const response = await seatMapService.getSeatMap(route.params.id as string)
    seatMapData.value = response.data
    seatmapName.value = response.data.seat_map?.name || ''
    seatmapDescription.value = response.data.seat_map?.description || ''
    seatmapIdentification.value = response.data.seat_map?.identification || ''
    seatmapConfiguration.value = response.data.seat_map?.configuration || ''
  } catch (error) {
    console.error('Error fetching seat map:', error)
    showAlert('error', 'Failed to load seat map')
  } finally {
    loading.value = false
  }
}

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
    seatConfigurations.value = response.data.data?.configurations || []
    seatIdentifications.value = response.data.data?.idententifications || []
  } catch (error) {
    console.error('Error fetching seat types:', error)
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

// Open edit modal
const onSeatClick = (cell: SeatCell) => {
  currentCell.value = cell
  cellForm.value = {
    type: cell.type,
    label: cell.label,
    position_x: cell.position_x,
    position_y: cell.position_y
  }
  editModalRef.value?.show()
}

// Apply changes to cell
const applyChanges = () => {
  if (!currentCell.value) return

  const maxLength = getMaxLengthForType(cellForm.value.type)
  if (cellForm.value.label.length > maxLength) {
    showAlert('error', `Label cannot exceed ${maxLength} characters`)
    return
  }

  currentCell.value.type = cellForm.value.type
  currentCell.value.label = cellForm.value.label

  // Track changes
  const existing = grid.value.find(d => d.id === currentCell.value?.id)
  if (existing) {
    Object.assign(existing, {
      type: cellForm.value.type,
      label: cellForm.value.label
    })
  } else {
    grid.value.push({
      id: currentCell.value.id,
      type: cellForm.value.type,
      label: cellForm.value.label,
      position_x: cellForm.value.position_x,
      position_y: cellForm.value.position_y
    })
  }

  editModalRef.value?.hide()
}

// Add row
const addRow = (insertRowIndex: number) => {
  if (!seatMapData.value) return

  const numCols = seatMapData.value.seat_layout[0]?.length || 0
  const newRow: SeatCell[] = []

  for (let col = 0; col < numCols; col++) {
    newRow.push({
      id: '',
      seat_map_id: seatMapData.value.seat_map.id,
      label: '',
      type: 'SPACE',
      position_x: col + 1,
      position_y: insertRowIndex + 1
    })
  }

  seatMapData.value.seat_layout.splice(insertRowIndex, 0, newRow)

  // Update position_y for all rows
  seatMapData.value.seat_layout.forEach((row, rowIndex) => {
    row.forEach(seat => {
      seat.position_y = rowIndex + 1
    })
  })

  grid.value.forEach(cell => {
    if (cell.position_y >= insertRowIndex + 1) {
      cell.position_y = cell.position_y + 1
    }
  })
}

// Add column
const addColumn = (insertColIndex: number) => {
  if (!seatMapData.value) return

  seatMapData.value.seat_layout.forEach((row, rowIndex) => {
    row.splice(insertColIndex, 0, {
      id: '',
      seat_map_id: seatMapData.value!.seat_map.id,
      label: 'SPACE',
      type: 'SPACE',
      position_x: insertColIndex + 1,
      position_y: rowIndex + 1
    })
    row.forEach((seat, colIndex) => {
      seat.position_x = colIndex + 1
    })
  })

  grid.value.forEach(cell => {
    if (cell.position_x >= insertColIndex + 1) {
      cell.position_x = cell.position_x + 1
    }
  })
}

// Delete row
const deleteRow = (rowIndex: number) => {
  if (!seatMapData.value || seatMapData.value.seat_layout.length <= 1) return

  seatMapData.value.seat_layout.splice(rowIndex, 1)

  seatMapData.value.seat_layout.forEach((row, i) => {
    row.forEach(seat => (seat.position_y = i + 1))
  })

  grid.value.forEach(cell => {
    if (cell.position_y >= rowIndex + 1) {
      cell.position_y = cell.position_y - 1
    }
  })
}

// Delete column
const deleteColumn = (colIndex: number) => {
  if (!seatMapData.value || seatMapData.value.seat_layout[0]?.length <= 1) return

  seatMapData.value.seat_layout.forEach(row => row.splice(colIndex, 1))

  seatMapData.value.seat_layout.forEach(row => {
    row.forEach((seat, i) => (seat.position_x = i + 1))
  })

  grid.value.forEach(cell => {
    if (cell.position_x >= colIndex + 1) {
      cell.position_x = cell.position_x - 1
    }
  })
}

// Print seat map
const printSeatMap = () => {
  if (!seatMapData.value?.seat_layout) return

  const seatLayout = seatMapData.value.seat_layout

  const getSeatColor = (type: string) => {
    switch (type) {
      case 'STAFF': return '#ffc107'
      case 'SEAT': return '#28a745'
      case 'TOILET': return '#0dcaf0'
      case 'DOOR': return '#198754'
      case 'FRIDGE':
      case 'CABINET': return '#6c757d'
      default: return '#ffffff'
    }
  }

  let seatMapHTML = `<div style="page-break-after: always; text-align: center;"><h2>${seatmapName.value}</h2>`

  seatLayout.forEach(row => {
    seatMapHTML += `<div style="display:flex; justify-content:center; margin-bottom:6px;">`
    row.forEach(seat => {
      if (seat.type === 'SPACE') {
        seatMapHTML += `<div style="width:80px; height:40px; margin:3px;"></div>`
      } else {
        seatMapHTML += `
          <div style="
            width:80px;
            height:40px;
            margin:3px;
            display:flex;
            align-items:center;
            justify-content:center;
            border:1px solid #333;
            background-color:${getSeatColor(seat.type)};
            color: ${seat.type === 'SEAT' || seat.type === 'STAFF' ? 'white' : 'black'};
            font-weight:bold;
            border-radius:4px;
          ">${seat.label}</div>
        `
      }
    })
    seatMapHTML += `</div>`
  })

  seatMapHTML += `</div>`

  // Manifest page
  let manifestHTML = `<div style="page-break-before: always; padding:20px;"><h2>Seat Manifest</h2><div style="display:flex; flex-wrap: wrap;">`

  seatLayout.forEach(row => {
    row.forEach(seat => {
      if (seat.type === 'SEAT' || seat.type === 'STAFF') {
        manifestHTML += `
          <div style="width:45%; margin-bottom:20px; padding:10px; break-inside: avoid;">
            <strong>Seat: ${seat.label}</strong><br><br>
            Name: ........................................................<br><br>
            Phone: ........................................................<br>
            Gender: ☐ Female  ☐ Male<br>
            Age: ☐ Adult  ☐ Child  ☐ Infant
          </div>
        `
      }
    })
  })

  manifestHTML += `</div></div>`

  const html = `
    <html>
      <head><title>${seatmapName.value}</title></head>
      <body style="font-family: sans-serif;">
        ${seatMapHTML}
        ${manifestHTML}
      </body>
    </html>
  `

  const printWindow = window.open('', '', 'width=1000,height=900')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onafterprint = () => printWindow.close()
    printWindow.print()
  }
}

// Submit update
const submit = async () => {
  if (!seatMapData.value) return

  const layouts = seatMapData.value.seat_layout.flat().map(cell => ({
    id: cell.id,
    seat_map_id: cell.seat_map_id,
    label: cell.label || 'SPACE',
    type: cell.type as any,
    position_x: cell.position_x,
    position_y: cell.position_y
  }))

  try {
    saving.value = true
    const response = await seatMapService.updateSeatMap({
      seat_map_id: seatMapData.value.seat_map.id,
      seat_map_name: seatmapName.value,
      seat_map_description: seatmapDescription.value,
      seat_map_identification: seatmapIdentification.value,
      seat_map_configuration: seatmapConfiguration.value,
      layouts
    })

    if (response.data.status === 'success') {
      showAlert('success', 'Seat map updated successfully')
      await fetchSeatMap()
    } else {
      showAlert('error', 'Failed to update seat map')
    }
  } catch (error: any) {
    console.error('Error updating seat map:', error)
    showAlert('error', error.response?.data?.message || 'Failed to update seat map')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchSeatMap(), fetchSeatTypes()])
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
  cursor: pointer;
  transition: all 0.2s ease;
}

.seat:hover {
  transform: scale(1.1);
}

.seat-available {
  background-color: #28a745;
  border: 1px solid #1e7e34;
  color: white;
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
}

.seat-cabinet {
  background-color: #6c757d;
  color: white;
}

.seat-aisle {
  background-color: #f8f9fa;
  border: 1px dashed #dee2e6;
}

.seat-label {
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
