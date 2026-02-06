<template>
  <div>
    <div class="d-flex align-items-center mb-2">
      <div>
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="javascript:;">ASSETS</a></li>
          <li class="breadcrumb-item active">ODOMETER READING HISTORY</li>
        </ol>
      </div>
    </div>

    <card>
      <div class="p-3">
        <StandardDataTable
          :columns="tableColumns"
          :data="mappedReadingHistory"
          :loading="loading"
          :filters="tableFilters"
          :showDateFilters="false"
          :serverSide="false"
          @update:filters="handleFiltersUpdate"
        >
          <template #vehicle_name="{ row }">
            <span class="badge bg-warning bg-opacity-20 fs-14px fw-bold text-danger cursor-pointer">
              <i class="fa fa-bus me-1"></i>
              {{ row.vehicle_name }}
            </span>
          </template>

          <template #model_name="{ row }">
            <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info cursor-pointer">
              {{ row.model_name }}
            </span>
          </template>

          <template #odometer_reading="{ row }">
            <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-success">
              {{ row.odometer_reading }}
            </span>
          </template>

          <template #gps_reading="{ row }">
            <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold"
              :class="row.odometer_reading === row.gps_reading ? 'text-success' : 'text-danger'">
              <i v-if="row.odometer_reading !== row.gps_reading" class="fa fa-triangle-exclamation ms-1 text-danger"></i>
              {{ row.gps_reading }}
            </span>
          </template>

          <template #read_by="{ row }">
            <span class="fw-bold text-dark">{{ row.read_by }}</span>
          </template>

          <template #reading_date="{ row }">
            <span class="fw-bold text-warning">{{ row.reading_date }}</span>
          </template>

          <template #actions>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-info btn-sm" title="View Details">
                <i class="fa fa-eye"></i>
              </button>
            </div>
          </template>
        </StandardDataTable>
      </div>
    </card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'

const loading = ref(false)

const readingHistory = ref([])

const summary = ref({
  total_fleet: 0,
  updated_vehicles: 0
})

const tableColumns = ref([
  { key: 'sn', label: 'S/N', sortable: true, visible: true },
  { key: 'vehicle_name', label: 'Vehicle', sortable: true, visible: true },
  { key: 'model_name', label: 'Model Name', sortable: true, visible: true },
  { key: 'reading_source', label: 'Reading Source', sortable: true, visible: true },
  { key: 'odometer_reading', label: 'Odometer Reading', sortable: true, visible: true },
  { key: 'gps_reading', label: 'GPS Reading', sortable: true, visible: true },
  { key: 'remarks', label: 'Remarks', sortable: true, visible: false },
  { key: 'read_by', label: 'Read By', sortable: true, visible: true },
  { key: 'reading_date', label: 'Reading Date', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

const tableFilters = ref({
  search: ''
})

const mappedReadingHistory = computed(() => {
  return readingHistory.value.map((reading, index) => ({
    sn: index + 1,
    vehicle_name: reading.vehicle_name || '-',
    model_name: reading.model_name || '-',
    reading_source: reading.reading_source || '-',
    odometer_reading: formatNumber(reading.odometer_reading),
    gps_reading: formatNumber(reading.gps_reading),
    remarks: reading.remarks || '-',
    read_by: reading.read_by || '-',
    reading_date: reading.reading_date || '-',
    raw: reading
  }))
})

const formatNumber = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-'
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const updatedVehiclesPercentage = () => {
  const total = Number(summary.value.total_fleet) || 0
  const updated = Number(summary.value.updated_vehicles) || 0
  if (total === 0) return 0
  return Math.round((updated / total) * 100)
}

const handleFiltersUpdate = (newFilters) => {
  tableFilters.value = { ...tableFilters.value, ...newFilters }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

:deep(.soft-divider) {
  display: none;
}
</style>
