<template>
  <div class="row layout-top-spacing rounded bg-white" style="margin-top:-9px !important">
    <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
      <div class="panel br-6 p-0">
        <div class="custom-table p-3">
          <StandardDataTable
            :columns="routeColumns"
            :data="routesList"
            :loading="isLoadingRoutes"
            :filters="routeTableOption"
            :defaultPageSize="routeTableOption.pageSize"
            :disablePagination="false"
            :showDateFilters="false"
            :actionButtons="routepageActions"
          >
            <template #city_link="{ row }">
              <i class="fa fa-route me-2 text-indigo"></i>
              <span>{{ row.city_link || 'N/A' }}</span>
            </template>
            <template #route_code="{ row }">
              <span>{{ row.route_code || 'N/A' }}</span>
            </template>
            <template #route_distance="{ row }">
              <span class="badge bg-info text-dark p-2">{{ row.route_distance || 'N/A' }} km</span>
            </template>
            <template #approximate_hrs="{ row }">
              <span class="badge bg-warning text-dark p-2">{{ row.approximate_hrs || 'N/A' }} hrs</span>
            </template>
            <template #is_active="{ row }">
              <span :class="row.is_active ? 'text-success' : 'text-danger'">
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </span>
            </template>
            <template #actions="{ row }">
              <div class="d-flex gap-1">
                <router-link :to="`/schedule/route/${row.id}`" title="View Details">
                  <button class="btn btn-sm btn-outline-info" title="Details">
                    <i class="fa fa-eye"></i>
                  </button>
                </router-link>
              </div>
            </template>
          </StandardDataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'
import { useNotification } from '@/composables/notification'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
const { showAlert } = useNotification()
const authStore = useAuthStore()
const router = useRouter()

const isLoadingRoutes = ref(false)
const routesList = ref([])

const routeColumns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'city_link', label: 'Name', visible: true, sortable: false },
  { key: 'route_code', label: 'Code', visible: true, sortable: false },
  { key: 'route_distance', label: 'Distance', visible: true, sortable: false },
  { key: 'approximate_hrs', label: 'Approximated Hours', visible: true, sortable: false },
  { key: 'is_active', label: 'Status', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false }
])

const routepageActions = computed(() => [
  {
    label: 'Reflesh',
    icon: 'fa fa-sync-alt',
    class: 'btn btn-secondary',
    method: () => fetchRoutesList()
  },
  {
    label: 'Register Route(s)',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => router.push('/abs/route-master/create')
  }
])

const routeTableOption = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: ''
})

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Authorization: authStore.token ? `Bearer ${authStore.token}` : ''
  }
})

const fetchRoutesList = async () => {
  isLoadingRoutes.value = true
  try {
    const response = await axiosInstance.get('/routes')
    const payload = response.data?.data
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
    routesList.value = rows.map((d, index) => ({
      sno: index + 1,
      id: d.id,
      route_code: d.route_code,
      is_active: d.is_active,
      city_link: d.city_link
        ? `${d.city_link.original_city?.name || 'N/A'} - ${d.city_link.destination_city?.name || 'N/A'}`
        : 'N/A',
      route_distance: d.city_link?.distance_km || 'N/A',
      approximate_hrs: d.city_link?.approx_hours || 'N/A'
    }))
  } catch (error) {
    showAlert('error', 'Failed to fetch routes')
  } finally {
    isLoadingRoutes.value = false
  }
}

onMounted(() => {
  fetchRoutesList()
})
</script>

<style scoped>
/* Back Button Styling */
.back-btn {
  background-color: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  font-weight: 500 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover {
  background-color: #dee2e6 !important;
  border-color: #adb5bd !important;
  color: #343a40 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
}

.back-btn:focus {
  background-color: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  box-shadow: 0 0 0 0.2rem rgba(233, 236, 239, 0.5) !important;
}

.back-btn i {
  font-weight: 600 !important;
}

/* Code input styling - uppercase formatting */
input[type="text"] {
  text-transform: uppercase;
}

/* Fix outer layout (col-md-12 container) */


/* Optional: Limit width of search input */
:deep(.VueTables__search__input.form-control) {
  max-width: 200px;
  font-size: 14px;
  padding: 6px 10px;
  margin-bottom: 1em;
}

/* Optional: Limit width of select dropdown */
:deep(.VueTables__limit select) {
  max-width: 120px;
  font-size: 14px;
  padding: 5px 10px;
}

/* Navigation Tabs Styling - optimized for single row */
.tabs-card {
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  overflow: hidden;
}

.tabs-card .nav-tabs {
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 0;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
  white-space: nowrap;
}


.tabs-card .nav-tabs .nav-link {
  border: none;
  color: #6c757d;
  padding: 0.75rem 0.5rem;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  border-radius: 0;
  position: relative;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: auto;
  line-height: 1.2;
}

.tabs-card .nav-tabs .nav-link i {
  font-size: 0.8rem;
  margin-right: 0.25rem;
}

.tabs-card .nav-tabs .nav-link:hover {
  color: #0f5132;
  background-color: #f8f9fa;
}



/* Responsive adjustments for smaller screens */
@media (max-width: 1200px) {
  .tabs-card .nav-tabs .nav-link {
    padding: 0.6rem 0.4rem;
    font-size: 0.8rem;
  }

  .tabs-card .nav-tabs .nav-link i {
    font-size: 0.75rem;
    margin-right: 0.2rem;
  }
}

@media (max-width: 992px) {
  .tabs-card .nav-tabs .nav-link {
    padding: 0.5rem 0.3rem;
    font-size: 0.75rem;
  }

  .tabs-card .nav-tabs .nav-link i {
    font-size: 0.7rem;
    margin-right: 0.15rem;
  }
}

/* City Links Form Scrolling */
.city-links-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.city-links-container::-webkit-scrollbar {
  width: 8px;
}

.city-links-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.city-links-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.city-links-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Routes Form Scrolling */
/* .routes-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
} */


/* SubRoutes Form Scrolling */
.subroutes-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.subroutes-container::-webkit-scrollbar {
  width: 8px;
}

.subroutes-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.subroutes-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.subroutes-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* STP Form Scrolling */
.stp-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.stp-container::-webkit-scrollbar {
  width: 8px;
}

.stp-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.stp-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.stp-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Stops Form Scrolling */
.stops-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.stops-container::-webkit-scrollbar {
  width: 8px;
}

.stops-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.stops-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.stops-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Content panel styling - removed old panel styles */
.tab-content {
  padding: 0;
}

/* Ensure data tables match tabs width */
.card .card-body {
  padding: 1.5rem;
}

/* Ensure data table container matches tabs width */

/* Ensure data table takes full width of its container */
.custom-table {
  width: 100%;
  overflow-x: auto;
}

/* Make sure the table itself takes full width */
.custom-table .VueTables {
  width: 100%;
}

/* Ensure table wrapper matches tabs width */
.custom-table .VueTables__wrapper {
  width: 100%;
}

/* Remove old panel styling */
.panel {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Ensure consistent spacing between tabs and content */
.tab-content .card {
  margin-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* Make sure the table container has the same border radius as tabs */
.tab-content .card .card-body {
  border-radius: 0 0 0.375rem 0.375rem;
}

/* Fix dropdown visibility */
.modal .multiselect__content-wrapper {
  position: absolute !important;
  z-index: 2050 !important;
}


/* Fix footer stickiness */
.modal-body {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 60vh;

}

.modal-footer {
  position: sticky;
  bottom: 0;
  background: #fff;

  border-top: 1px solid #dee2e6;
}


.multiselect__content-wrapper {
  position: absolute !important;
  z-index: 9999 !important;
  max-height: 250px !important;
}
</style>

