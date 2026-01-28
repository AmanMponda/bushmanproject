<template>
  <div>
    <div class="d-flex align-items-center mb-3">
      <div>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="javascript:;">ASSETS</a></li>
          <li class="breadcrumb-item active">LOCATION HISTORY</li>
        </ol>
      </div>
    </div>

    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <card>
          <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
            Vehicle Location Details
            <div class="ms-auto d-flex align-items-center gap-2">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="autoRefresh" v-model="autoRefresh" />
                <label class="form-check-label small" for="autoRefresh">Auto Refresh</label>
              </div>
              <button class="text-decoration-none text-body text-opacity-50" :disabled="loading">
                <i class="fa fa-sync-alt me-1"></i> Refresh
              </button>
            </div>
          </card-header>
          <card-body>
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ stats.totalVehicles }}</h4>
                    <small>Total Vehicles</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ stats.activeVehicles }}</h4>
                    <small>Active</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-warning text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ stats.stoppedVehicles }}</h4>
                    <small>Stopped</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ stats.offlineVehicles }}</h4>
                    <small>Offline</small>
                  </div>
                </div>
              </div>
            </div>

            <StandardDataTable
              :columns="tableColumns"
              :data="vehicleRows"
              :loading="loading"
              :filters="tableFilters"
              :pageSizeOptions="[10, 25, 50]"
              :defaultPageSize="10"
              @update:filters="onFiltersUpdate"
            >
              <template #vehicle_no="{ row }">
                <span class="fw-semibold">{{ row.vehicle_no }}</span>
              </template>
              <template #location="{ row }">
                <div class="text-nowrap">
                  <i class="fa fa-map-marker-alt text-danger me-1"></i>
                  {{ row.location || 'No location data' }}
                </div>
              </template>
              <template #coordinates="{ row }">
                <small class="text-muted">{{ row.coordinates }}</small>
              </template>
              <template #last_updated="{ row }">
                <div class="text-nowrap">
                  <i class="fa fa-clock text-muted me-1"></i>
                  {{ row.last_updated }}
                </div>
              </template>
              <template #status="{ row }">
                <span class="badge" :class="getStatusBadgeClass(row.status)">{{ row.status }}</span>
              </template>
              <template #actions>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary btn-sm" title="View Details">
                    <i class="fa fa-eye"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </card-body>
        </card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'

const loading = ref(false)
const autoRefresh = ref(false)

const vehicleRows = ref([
  {
    vehicle_no: 'T123ABC',
    location: 'Arusha',
    coordinates: '-3.3869, 36.6830',
    last_updated: '21 Jan 2026, 09:15',
    status: 'Running'
  },
  {
    vehicle_no: 'T456DEF',
    location: 'Dar es Salaam',
    coordinates: '-6.7924, 39.2083',
    last_updated: '21 Jan 2026, 08:40',
    status: 'Stopped'
  },
  {
    vehicle_no: 'T789GHI',
    location: '',
    coordinates: '--',
    last_updated: '20 Jan 2026, 16:05',
    status: 'Offline'
  }
])

const tableColumns = ref([
  { key: 'vehicle_no', label: 'Vehicle No', sortable: true, visible: true },
  { key: 'location', label: 'Location', sortable: true, visible: true },
  { key: 'coordinates', label: 'Coordinates', sortable: false, visible: true },
  { key: 'last_updated', label: 'Last Updated', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

const tableFilters = ref({
  status: ''
})

const stats = computed(() => {
  const total = vehicleRows.value.length
  const active = vehicleRows.value.filter((v) => v.status === 'Running').length
  const stopped = vehicleRows.value.filter((v) => v.status === 'Stopped').length
  const offline = vehicleRows.value.filter((v) => v.status === 'Offline').length
  return { totalVehicles: total, activeVehicles: active, stoppedVehicles: stopped, offlineVehicles: offline }
})

const getStatusBadgeClass = (status) => {
  if (status === 'Running') return 'bg-success'
  if (status === 'Stopped') return 'bg-warning'
  if (status === 'Offline') return 'bg-secondary'
  return 'bg-light text-dark'
}

const onFiltersUpdate = (filters) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
}
</script>
