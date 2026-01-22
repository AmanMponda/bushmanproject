<template>
  <div>    
    <Transition name="slide-left" class="" mode="out-in">  
      <div v-if="!showForm" key="list-page">
        <div class="row layout-top-spacing rounded bg-white" style="margin-top:-9px !important">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
            <div class="panel br-6 p-0">
              <div class="custom-table p-3">                
                <StandardDataTable :columns="routeColumns" :data="routesList" :loading="isLoadingRoutes"
                  :filters="routeTableOption" :defaultPageSize="routeTableOption.pageSize" :disablePagination="false"
                  :showDateFilters="false" :actionButtons="routepageActions">
                  <template #city_link="{ row }">
                     <i class="fa fa-route me-2 text-indigo"></i><span>{{ row.city_link || 'N/A' }}</span>
                  </template>
                  <template #route_code="{ row }">
                    <span>{{ row.route_code || 'N/A' }}</span>
                  </template>
                  <template #route_distance="{ row }">
                     <span class="badge bg-info text-dark p-2">{{ row.route_distance || 'N/A' }} km</span>
                  </template>
                  <template #approximate_hrs="{ row }">
                    <span class="badge bg-warning text-dark p-2">{{ row.approximate_hrs || 'N/A' }}
                      hrs</span>
                  </template>
                  <template #is_active="{ row }">
                    <span :class="row.is_active ? 'text-success' : 'text-danger'">
                      {{ row.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </template>
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      
                      <router-link :to="`/schedule/route/${row.id}`" title="View Details">
                        <button class="btn btn-sm btn-outline-info" title="Details"
                          @click="showDetails(row, 'subroute')">
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

        <div class="modal modal-lg fade" id="routeModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ 'Edit Route'  }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" style="max-height: 65vh; overflow-y: auto;">               
                <div>
                  <div class="row">
                    <div class="col-md-12 mb-3">
                      <label>City Link</label>
                      <multiselect v-model="currentRoute.city_link_id" :options="cityLinks" label="name" track-by="id" >
                        <template #option="{ option }">
                          <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                        </template>
                      </multiselect>
                    </div>
                    <div class="col-md-12 mb-3">
                      <label>Route Code</label>
                      <input v-model="currentRoute.route_code" type="text" class="form-control" />
                    </div>

                    <div class="col-md-12 mb-3">
                      <label>Status</label>
                      <select v-model="currentRoute.is_active" class="form-control">
                        <option value="1">Active</option>
                        <option value="0">InActive</option>
                      </select>
                    </div>
                  </div>
                </div>              
              </div>
              <div class="modal-footer sticky-bottom bg-white">
                <button class="btn btn-outline-danger" data-bs-dismiss="modal">Cancel</button>              
                <button class="btn btn-outline-primary" @click="saveRoute">
                  <span v-if="isLoading">
                    <div class="spinner-border spinner-border-sm"></div>
                  </span>
                  <span v-else>
                    Update
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>        
      
        <div>
          <div class="routes-container bg-white p-3">
            <table class="table table-bordered align-middle">
              <thead class="table-white">
                <tr>
                  <th style="width: 5%">#</th>
                  <th style="width: 40%">City Link</th>
                  <th style="width: 40%">Route Code</th>
                  <th v-if="multipleRoutes.length > 1" style="width: 10%">Action</th>
                </tr>
              </thead>              
              <tbody>
                <tr v-for="(route, index) in multipleRoutes" :key="index">
                  <!-- ENTRY NUMBER -->
                  <td class="text-center">
                    {{ multipleRoutes.length - index }}
                  </td>

                  <!-- CITY LINK -->
                  <td class="position-relative">
                    <multiselect v-model="route.city_link_id" :options="filteredLinks" label="name" track-by="id"
                      placeholder="Select City Link" @update:modelValue="selected => updateAgents(selected, index)">
                      <template #option="{ option }">
                        <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                      </template>
                    </multiselect>
                  </td>
                  <!-- ROUTE CODE -->
                  <td>
                    <label class="form-label d-block d-md-none">Agents</label>
                    <input v-model="route.route_code" type="text" class="form-control" />
                  </td>

                   <!-- <td class="position-relative">
                    <multiselect v-model="route.agents" :options="route.allagents || []" label="name" track-by="id"
                      placeholder="Select Agents" multiple="true">                      
                    </multiselect>
                  </td> -->

                  <!-- ACTION BUTTON (REMOVE) -->
                  <td v-if="multipleRoutes.length > 1" class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="removeRouteRow(index)">
                      remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="d-flex justify-content-end gap-2">
                   
        <button class="btn btn-outline-danger " @click="goBack">
          <i class="fa fa-arrow-left"></i> Back
        </button>
        <button class="btn btn-secondary " @click="addRouteRow">
          Add Route
        </button>      
     
              <button class="btn btn-outline-primary" @click="saveRoute">
                <span v-if="isLoading">
                  <div class="spinner-border spinner-border-sm"></div>
                </span>
                <span v-else>
                  {{ currentRoute.id ? 'Update' :
                    'Save'
                  }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>    
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick,  } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import RouteRegister from './RouteRegister.vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";
import { useRouter ,useRoute } from 'vue-router';

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');

const isLoading = ref(false);
const { showAlert } = useNotification();
const authStore = useAuthStore();
const router = useRouter()




// Debug function to check modal state
const debugModal = (modalId) => {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    
  } else {
    
  }
};

// Helper function to safely open modals
const openModalSafely = async (modalId, modalRef) => {
  try {
    await nextTick(); // Wait for DOM to be ready
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      console.error(`Modal element with id '${modalId}' not found`);
      showAlert('error', `Modal not found: ${modalId}`);
      return;
    }
 
    debugModal(modalId);

    // Dispose existing modal instance if it exists
    if (modalRef.value) {
      try {
        modalRef.value.dispose();
      } catch (e) {
        console.warn('Error disposing modal:', e);
      }
    }

    // First try Bootstrap modal
    try {
      modalRef.value = new Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });

      // Add event listeners for debugging
      modalElement.addEventListener('shown.bs.modal', () => {
        
      });

      modalElement.addEventListener('hidden.bs.modal', () => {
       
      });

      modalRef.value.show();

      // Check if modal actually opened
      setTimeout(() => {
        debugModal(modalId);
        if (!modalElement.classList.contains('show')) {
          console.warn(`Modal ${modalId} did not open properly, trying fallback`);
          throw new Error('Modal did not open');
        }
      }, 200);

    } catch (bootstrapError) {
      console.warn('Bootstrap modal failed, using manual approach:', bootstrapError);

      // Fallback: Manual modal show
      modalElement.style.display = 'block';
      modalElement.classList.add('show');
      modalElement.setAttribute('aria-hidden', 'false');
      modalElement.setAttribute('aria-modal', 'true');

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = `${modalId}-backdrop`;
      document.body.appendChild(backdrop);

      // Add modal-open class to body
      document.body.classList.add('modal-open');

      // Store backdrop reference for cleanup
      modalRef.value = {
        dispose: () => {
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          modalElement.setAttribute('aria-hidden', 'true');
          modalElement.removeAttribute('aria-modal');
          document.body.classList.remove('modal-open');
          const existingBackdrop = document.getElementById(`${modalId}-backdrop`);
          if (existingBackdrop) {
            existingBackdrop.remove();
          }
        },
        hide: () => {
          modalRef.value.dispose();
        }
      };

    }
  } catch (error) {
    console.error(`Error opening modal ${modalId}:`, error);
    showAlert('error', `Failed to open modal: ${modalId}`);
  }
};

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const originalTerminals = ref([]);
const destinationTerminals = ref([]);
const serviceClasses = ref([]);
const offices = ref([]);
const routes = ref([]);


// UI state for unified header actions
const showForm = ref(false);
const activeTab = ref('routes');
const routeSubTab = ref('routes');
const addLabel = computed(() => {
  switch (activeTab.value) {
    case 'routes':
      return routeSubTab.value === 'routes' ? 'Add Route' : 'Add SubRoute';
    case 'citylink': return 'Add City Link';
    case 'stops': return 'Add Stop';
    default: return 'Add';
  }
});








const agents = ref([]);
const cityLinks = ref([]);
const isLoadingRoutes = ref(false);
const routesList = ref([]);
const routeModal = ref(null);
const currentRoute = ref({
  id: null,
  city_link_id: "",
  route_code: "",
  is_active: 1
});

// Multiple routes functionality
const multipleRoutes = ref([]);
const isMultipleRouteMode = ref(false);
const routeColumns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'city_link', label: 'Name', visible: true, sortable: false },
  { key: 'route_code', label: 'Code', visible: true, sortable: false },
  { key: 'route_distance', label: 'Distance', visible: true, sortable: false },
  { key: 'approximate_hrs', label: 'Approximated Hours', visible: true, sortable: false },
  { key: 'is_active', label: 'Status', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const routepageActions = computed(() => {
  const actions = [];
  if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchRoutesList())
    });
  }

  if (true) {
    actions.push({
      label: "Register Route(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (router.push('/abs/route-master/create') )
    });
  }
  return actions;
});

const routeTableOption = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: ''
});

const fetchRoutesList = async () => {

  // Skip if already loaded
  isLoadingRoutes.value = true;
  try {
    const response = await axiosInstance.get('/routes');
    routesList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
    routesLoaded.value = true;
  } catch (error) {
    console.error(error);
    
  } finally {
    isLoadingRoutes.value = false;
  }
};






const openRouteModal = async (route = null) => {
  if (route) {
    currentRoute.value = { ...route };
    isMultipleRouteMode.value = false;
    multipleRoutes.value = [];
    if (typeof currentRoute.value.city_link_id === 'number') {
      const selected = cityLinks.value.find(c => c.id === currentRoute.value.city_link_id);
      if (selected) {
        currentRoute.value.city_link_id = selected;
      }
    }
    await openModalSafely('routeModal', routeModal);
  } else {

    fetchCityLinks(); 
    fetchAgents();
    currentRoute.value = {
      id: null,
      city_link_id: "",
      route_code: "",
      is_active: 1
    };
    isMultipleRouteMode.value = true; // Always start in multiple mode for new entries
    multipleRoutes.value = [{
      id: null,
      city_link_id: "",
      route_code: "",
      is_active: 1
    }];
    showForm.value = true;
  }

};


const fetchCityLinks = async () => {    
  try {
    const response = await axiosInstance.get('/city-links');
    cityLinks.value = response.data.data;
   
  } catch (error) {
    console.error(error);    
  } finally {
  
  }
};

const fetchAgents = async () => {

  try {
    const response = await axiosInstance.get('/locations/form-data');


    agents.value = response.data.agents || [];
  

    formDataLoaded.value = true;

  } catch (error) {
    console.error(error);
    
   
  }
};

// Add new route row
const addRouteRow = () => {
  const newRow = {
    id: null,
    city_link_id: "",
    route_code: "",
    agents:[],
    is_active: 1,
    allagents:[]
  };

  // Add to the beginning of the array (latest first)
  multipleRoutes.value.unshift(newRow);


  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.routes-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

const availableCityLinks = computed(() => {
  const selectedIds = selectedCityLinks.value.map(link => link.id);
  return multipleRoutes.value
    .map(r => r.city_link_id)
    .filter(link => !selectedIds.includes(link.id));
});

// Remove route row
const removeRouteRow = (index) => {
  if (multipleRoutes.value.length > 1) {
    multipleRoutes.value.splice(index, 1);
  }
};

const saveRoute = async () => {
  if (isMultipleRouteMode.value) {
    await saveMultipleRoutes();
    return;
  }

  isLoading.value = true;
  try {
    let response;
    let params = {
      city_link_id: typeof currentRoute.value.city_link_id === 'object' ? currentRoute.value.city_link_id.id : currentRoute.value.city_link_id,
      route_code: currentRoute.value.route_code,
      is_active: currentRoute.value.is_active
    };
    if (currentRoute.value.id) {
      response = await axiosInstance.put(`/routes/${currentRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('/routes', params);
    }

    
    if (response.data.status === "success") {
      showAlert('success', 'Route saved successfully');
      routeModal.value.hide();
      routesLoaded.value = false;
      isLoading.value = false;
      await fetchRoutesList();
    }
  } catch (error) {
    isLoading.value = false;
    showAlert('error', 'Failed to save route');
  }
  finally {
    isLoading.value = false;
  }
};

// Save multiple routes
const saveMultipleRoutes = async () => {
  isLoading.value = true;
  try {
    // Validate all entries
    for (let i = 0; i < multipleRoutes.value.length; i++) {
      const route = multipleRoutes.value[i];
      if (!route.city_link_id || !route.route_code) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleRoutes.value.map(route => ({
      city_link_id: typeof route.city_link_id === 'object' ? route.city_link_id.id : route.city_link_id,
      route_code: route.route_code,
      is_active: route.is_active
    }));
    
    // Send batch request
    const response = await axiosInstance.post('/routes', { routes: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleRoutes.value.length} Routes saved successfully`);
      routeModal.value.hide();
      multipleRoutes.value= [];
      await fetchRoutesList();
      showForm.value = false;
      isLoading.value = false;

    }
  } catch (error) {
    if (error.response?.status === 422) {
      isLoading.value = false;
      console.error(error);
      
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Failed to save routes');
    }
  }
  finally {
    isLoading.value = false;
  }
};

const filteredAgents = computed(() => {
  const selectedIds = multipleRoutes.value
    .map(r => (r.agent?.id ?? r.agent?.id)) // handle object or number
    .filter(id => id != null);

  return agents.value.filter(link => !selectedIds.includes(link.id));
});


const updateAgents = (selectedRoute, index) => {
  if (selectedRoute?.id) {
    // Find the matching route (or use the selectedRoute itself)
    const route = multipleRoutes.value[index];

    if (route) {
      // Example: filter all agents for this city link
      route.allagents = selectedRoute.agents;

      // Clear previously selected agents to force re-selection
      route.agents = [];
    }
  } else {
    multipleRoutes.value[index].allagents = [];
    multipleRoutes.value[index].agents = [];
  }
};


const filteredLinks = computed(() => {
  const selectedIds = multipleRoutes.value
    .map(r => (r.city_link_id?.id ?? r.city_link_id)) // handle object or number
    .filter(id => id != null);
  return cityLinks.value.filter(link => !selectedIds.includes(link.id));
});


const deleteRoute = async (id) => {
  if (!confirm('Are you sure you want to delete this route?')) return;
  try {
    await axiosInstance.delete(`/routes/${id}`);
    showAlert('success', 'Route deleted successfully');
    await fetchRoutesList();
  } catch (error) {
    showAlert('error', 'Failed to delete route');
  }
};

function goBack() {
  showForm.value = false;
  //resetForm();
  // minimizePage()
}


onMounted(async () => {
    fetchRoutesList();
});

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