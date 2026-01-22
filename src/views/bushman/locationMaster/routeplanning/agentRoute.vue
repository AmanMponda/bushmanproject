<template>
    <div class="row layout-top-spacing rounded bg-white mt-2">
                            <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                                <div class="panel br-6 p-0">
                                    <div v-if="!isAssing" class="custom-table ">
                                        <StandardDataTable :columns="Columns" :data="agentRoute"
                                            :loading="isLoading" :filters="tableOption"
                                            :defaultPageSize="tableOption.pageSize" :disablePagination="false"
                                            :showDateFilters="false" :actionButtons="pageActions">
                                            <template #city_link_id="{ row }">
                                                <span class="badge bg-info">{{ row.city_link_id }}</span>
                                            </template>
                                            <!-- <template #route_id="props">
                                                         <span class="badge bg-secondary">{{ props.row.route_id }}</span>
                                                        </template> -->
                                            <template #sequency="{ row }">
                                                <span class="fw-bold">{{ row.sequency }}</span>
                                            </template>
                                            <template #is_active="{ row }">
                                                <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                                                    {{ row.is_active ? 'Active' : 'Inactive' }}
                                                </span>
                                            </template>
                                            <template #actions="{ row }">
                                                <div class="d-flex gap-1" role="group">                                                        
                                                    <button  class="btn btn-sm btn-outline-danger"
                                                        @click="deleteAgentRoute(row.id)" title="Delete">
                                                        <i class="fa fa-trash"></i>
                                                    </button>                                                                                                 
                                                </div>
                                            </template>
                                        </StandardDataTable>
                                    </div>
 <div v-else  class="custom-table m-3 p-3 overflow-auto ">

      <div class="row d-flex justify-content-center">
        <div class="col-md-10 card shadow" >
 <h5>Form to Assing Agents To Route</h5>
        <div class="col-md-12 mb-3">
          <label>Agent</label>
          <Multiselect 
            v-model="currectAgentRoute.name" 
            :options="agentlist" 
            label="name"
            track-by="id" 
            placeholder="Select Agent" 
            :multiple="true"
          />
                           <div class="py-2">
  <small class="text-warning d-flex align-items-center">
    <i class="fa fa-info me-1 border rounded p-2"></i>
    <span>
      You can select multiple agent at once      
    </span>
  </small>
</div>

      </div>    
     
      <div class="d-flex justify-content-end gap-2 m-2">
        <button class="btn btn-outline-danger" @click="close">Cancel</button>
        <button class="btn btn-outline-primary" @click="saveAgentRoute">
          <span v-if="isLoading">
            <div class="spinner-border spinner-border-sm"></div>
          </span>
          <span>
            {{ currectAgentRoute.id ? 'Update' : 'Save' }}
          </span>
        </button>
      </div>
        </div>
       
      </div>
                                </div>
                                </div>
                            </div>
                        </div>
    <!-- SubRoute Modal -->
          <div class="modal fade" id="subRouteModal" tabindex="-1">
   <div class="modal-dialog modal-lg modal-fullscreen-md-down">
    <div class="modal-content d-flex flex-column " style="height: 75vh;">
      
      <!-- Header -->
      <div class="modal-header">
        <h5 class="modal-title">{{ currectAgentRoute.id ? 'Edit Agent' : 'Assing Agent(s)' }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      
      <!-- Body -->
      <div class="modal-body flex-grow-1 overflow-auto">
        <div class="col-md-12 mb-3">
          <label>Agent</label>
          <Multiselect 
            v-model="currectAgentRoute.name" 
            :options="agentlist" 
            label="name"
            track-by="id" 
            placeholder="Select Agent" 
            :multiple="true"
          />
        </div>
        
      </div>
      
      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-outline-danger" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-outline-primary" @click="saveAgentRoute">
          <span v-if="isLoading">
            <div class="spinner-border spinner-border-sm"></div>
          </span>
          <span>
            {{ currectAgentRoute.id ? 'Update' : 'Save' }}
          </span>
        </button>
      </div>
      
    </div>
    </div>
         </div>

        
        
</template>

<script setup>
import { onMounted, ref, nextTick, computed, watch } from "vue";
import { useRoute } from "vue-router";
// route tab state
import L from 'leaflet';
const activeTab = ref('overview');
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import axios from "axios";
import { Modal } from "bootstrap";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.min.css";
import { useNotification } from "@/composables/notification";
import { useAuthStore } from "@/stores/auth";

// Notifications/Auth
const { showAlert } = useNotification();
const authStore = useAuthStore();
const route = useRoute();
const subRouteModal = ref(null);
const routeId = ref(route.params.id ? Number(route.params.id) : null);
const agentRoute = ref([]);
const agentlist = ref([]);
const isAssing = ref(false);
const currectAgentRoute = ref({
    id: null,
    name: "",   
});

// Axios instance
const axiosInstance = axios.create({
    baseURL: API_URL_2,
    headers: {
        "Content-Type": "application/json",
        Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
        "X-User-Id": authStore.user?.id || "",
        "X-Username": authStore.user?.username || "",
    },
});

const pageActions = computed(() => {
    const actions = [];
    if (true) {
        actions.push({
            label: "Refresh",
            icon: "fa fa-sync-alt",
            class: "btn btn-secondary",
            method: () => (fetchAgentRoute())
        });
    }
    if (true) {
        actions.push({
            label: "Assign Agent(s)",
            icon: "fa fa-plus",
            class: "btn btn-primary",
            method: () => (openModal())
        });
    }
    return actions;
});

const openModal = async (subroute = null) => {
    fetchActiveAgents();
    if (subroute) {
        currectAgentRoute.value = { ...subroute };
        isMultipleSubRouteMode.value = false;
        multipleSubRoutes.value = [];
        await openModalSafely('subRouteModal', subRouteModal);
    } else {
        currectAgentRoute.value = {
            id: null,
            name: "",            
        };
        isMultipleSubRouteMode.value = true; // Always start in multiple mode for new entries
       
    
    isAssing.value = true;
};
}

const openModalSafely = async (modalId, modalRef) => {
    await nextTick();
    const el = document.getElementById(modalId);
    if (!el) return;
    try {
        if (modalRef.value) {
            try { modalRef.value.dispose?.(); } catch { }
        }
        modalRef.value = new Modal(el, { backdrop: true, keyboard: true, focus: true });
        modalRef.value.show();
    } catch {
        // fallback
        el.style.display = "block";
        el.classList.add("show");
        document.body.classList.add("modal-open");
        modalRef.value = {
            hide: () => {
                el.style.display = "none";
                el.classList.remove("show");
                document.body.classList.remove("modal-open");
            },
            dispose: () => {
                el.style.display = "none";
                el.classList.remove("show");
                document.body.classList.remove("modal-open");
            },
        };
    }
};

const fetchAgentRoute = async () => {
    isLoading.value = true;
    try {
        // Use route_id parameter if available
        const url = `locations/agent-route?route_id=${route.params.id}` ;
        const response = await axiosInstance.get(url);       
    
        agentRoute.value = response.data.data[0].vendors.map((d, index) => ({
            sno: index + 1,
            ...d
        }));
        
        
    } catch (error) {
        console.error('Error fetching subroutes:', error);
           } finally {
        isLoading.value = false;
    }
};

const fetchActiveAgents = async () => {
   
    try {
        // Use route_id parameter if available
        const url = `locations/active-agents?route_id=${route.params.id}` ;
        const response = await axiosInstance.get(url);       

        agentlist.value = response.data.data.map((d, index) => ({
            sno: index + 1,
            ...d
        }));
    } catch (error) {
        console.error('Error fetching:', error);
       
    } 
};



const saveAgentRoute = async () => {
  if (currectAgentRoute.value.name.length === 0) {
    showAlert("warning",'Please select at least one agent.');
    return;
  }

  isLoading.value = true;

  try {
    const payload = {
      route_id: route.params.id,
      agents: currectAgentRoute.value.name.map((data)=>
      {
        return {
            id:data.id
        }
      }      
        
      )  // array of selected agents objects
    };

    const response = await axiosInstance.post('locations/save-agent-route', payload);

    if (response.data.status === 'success') {
      showAlert("success",response.data.message);
      // Close modal

      close();
      fetchAgentRoute();    
      // Reset selection if needed
      currectAgentRoute.value.name = [];
      currectAgentRoute.value.id = null;
    }
  } catch (error) {
    console.error(error);    
  } finally {
    isLoading.value = false;
  }
};

const deleteAgentRoute=  async (id) => {
    if (!confirm(`Are you sure you want to delete?`)) {
        return ;
    }
    isLoading.value = true;

  try {   
 const response = await axiosInstance.delete(
  'locations/delete-agent-route',
  {
    data: {
      route_id: Number(route.params.id),
      vendor_id: id
    }
  }
);

    if (response.data.status === 'success') {
      showAlert("success",response.data.message);   
      close();
      fetchAgentRoute();    
    }
  } catch (error) {
    console.error(error);    
  } finally {
    isLoading.value = false;
  }

};

const close = () => {
    isAssing.value = false;    
    currectAgentRoute.value = [];
}

onMounted(async () => { 
     fetchAgentRoute(); 
});





//sub-routes concept
const isLoading = ref(false);



// Multiple subroutes functionality
const multipleSubRoutes = ref([]);
const isMultipleSubRouteMode = ref(false);

// Multiple points functionality
const multiplePoints = ref([]);
const isMultiplePointMode = ref(false);

// Current route details
const currentRoute = ref({
    id: null,
    name: '',
    city_link: '',
    city_from: '',
    city_to: '',
    route_code: '',
    route_distance: '',
    approximate_hrs: '',
    stop_count: 0,
    status: 'Active',
    description: ''
});
const Columns = ref([
    { key: 'sno', label: 'Sno', visible: true, sortable: false },
    { key: 'name', label: 'Name', visible: true, sortable: false },   
    { key: 'phone', label: 'Phone Number', visible: true, sortable: false },   
    { key: 'email', label: 'Email', visible: true, sortable: false },   
    { key: 'address', label: 'Address', visible: true, sortable: false },   
    { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const tableOption = ref({
    search: '',
    pageSize: 10,
    currentPage: 1,
    sortField: '',
    sortDirection: 'asc',
    showAdvancedFilters: false,
    date_from: '',
    date_to: ''
});






</script>

<style>


.card {
    border: none;
}

.side-panel {
    position: fixed;
    top: 0;
    right: -50%;
    /* Hidden by default */
    width: 40%;
    height: 100%;
    background: #fff;
    z-index: 1050;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
    overflow-y: auto;
    transition: right 0.3s ease;
    border-bottom-left-radius: 20px;
    border-top-left-radius: 20px;
}

.side-panel.open {
    right: 0;
    /* Slide in */
}

.side-panel-header {
    background: #f8f9fa;
}

.side-panel-body {
    padding: 1rem;
}
</style>

<style scoped>
/* Tabs styling to match system uniformity (active bottom border) */
.tabs-card {
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.tabs-card .nav-tabs {
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 0;
}

.tabs-card .nav-tabs .nav-link {
    border: none;
    color: #6c757d;
    padding: 0.6rem 0.6rem;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    border-radius: 0;
}

.tabs-card .nav-tabs .nav-link.active {
    background: #e7f5ef;
    color: #0f5132;
    border-bottom: 3px solid #0f5132;
    font-weight: 600;
    position: relative;
}

.tabs-card .nav-tabs .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 3px;
    background: #0f5132;
    border-radius: 2px 2px 0 0;
}

/* Page spacing and headings sizing */
.route-page .card-header h4 {
    font-size: 1.05rem;
    margin-bottom: 0;
}

.route-page .card-header small {
    font-size: 0.8rem;
}

.route-page .tabs-card+hr {
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
}

.route-page .card-body>.row {
    margin-top: 0.25rem;
}

/* ===== NEW ROUTE OVERVIEW LAYOUT STYLES ===== */

/* Main Container - Full Width Layout */
.route-overview-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-height: 500px;
    width: 100%;
}

/* Route Details - Full Width */
.route-details-full {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.route-details-card {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    height: fit-content;
}

.route-details-card .card-header {
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    padding: 1rem 1.5rem;
}

.route-details-card .card-body {
    padding: 1.5rem;
}

/* Route Header */
.route-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.2rem;
    border-bottom: 1px solid #f1f3f4;
}

.route-title-section {
    flex: 1;
}

.route-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
    line-height: 1.3;
}

.route-description {
    font-size: 0.95rem;
    color: #6c757d;
    margin-bottom: 0;
    line-height: 1.4;
}

.route-status {
    margin-left: 1rem;
}

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-badge.active {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

/* Route Summary Grid */
.route-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
}

.summary-card:hover {
    background: #e9ecef;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-icon {
    width: 32px;
    height: 32px;
    background: #007bff;
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
    font-size: 0.9rem;
}

.summary-content {
    flex: 1;
}

.summary-label {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.summary-value {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
}

/* Route Points Section */
.route-points-section {
    margin-bottom: 2rem;
}

.section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e9ecef;
}

.points-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.point-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.point-item:hover {
    background: #f8f9fa;
    border-color: #007bff;
    transform: translateX(4px);
}

.point-item.start-point {
    border-left: 4px solid #28a745;
}

.point-item.end-point {
    border-left: 4px solid #dc3545;
}

.point-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    font-size: 1.2rem;
}

.start-point .point-icon {
    background: #d4edda;
    color: #28a745;
}

.end-point .point-icon {
    background: #f8d7da;
    color: #dc3545;
}

.point-content {
    flex: 1;
}

.point-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
}

.point-location {
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
}

.point-type {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.intermediate-stops {
    display: flex;
    justify-content: center;
    margin: 0.5rem 0;
}

.stops-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #e9ecef;
    border-radius: 20px;
    font-size: 0.85rem;
    color: #6c757d;
    font-weight: 500;
}

.stops-indicator i {
    font-size: 1rem;
}

/* Route Journey Visualization */
.route-journey-section {
    margin-bottom: 1rem;
}

.journey-visualization {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2rem 3rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    min-height: 120px;
}

.journey-visualization::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0,10 Q25,5 50,10 T100,10" stroke="%23dee2e6" stroke-width="2" fill="none" stroke-dasharray="5,5"/></svg>') repeat-x;
    background-size: 200px 20px;
    opacity: 0.3;
    pointer-events: none;
}

.journey-point {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
}

.point-marker {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    color: white;
    margin-bottom: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.point-marker:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.point-marker.start {
    background: linear-gradient(135deg, #28a745, #1e7e34);
}

.point-marker.end {
    background: linear-gradient(135deg, #dc3545, #c82333);
}

.point-info {
    text-align: center;
}

.point-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
}

.point-details {
    font-size: 0.8rem;
    color: #6c757d;
    font-style: italic;
}

.road-path {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    margin: 0 2rem;
}

.road-line {
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #6c757d, #495057, #6c757d);
    border-radius: 2px;
    position: relative;
    margin-bottom: 1rem;
}

.road-line::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #fff, transparent);
    border-radius: 1px;
}

.stops-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
}

.stops-indicator:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #007bff;
}

.stops-icon {
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.stops-count {
    font-size: 0.9rem;
    font-weight: 600;
    color: #495057;
    text-align: center;
}

.route-info-cards-centered {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin: 1rem 0;
}

.info-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 0;
    transition: all 0.2s ease;
}

.info-item:hover {
    transform: translateY(-1px);
}

.info-icon {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.5rem;
    font-size: 0.7rem;
}

.info-content {
    flex: 1;
}

.info-value {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.1rem;
    line-height: 1.2;
}

.info-label {
    font-size: 0.7rem;
    color: #6c757d;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    line-height: 1.1;
}

/* Route Information Section - Legacy */
.route-info-section {
    margin-bottom: 1rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.info-item {
    padding: 1rem;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s ease;
}

.info-item:hover {
    background: #e9ecef;
    transform: translateY(-1px);
}

.info-label {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
}


/* Responsive Design */
@media (max-width: 992px) {
    .route-overview-container {
        gap: 1.5rem;
    }

    .route-info-cards-centered {
        gap: 0.4rem;
    }

    .info-item {
        padding: 0.4rem;
    }

    .journey-visualization {
        padding: 1.5rem 2rem;
    }

    .route-summary-grid {
        grid-template-columns: 1fr;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .route-overview-container {
        gap: 1rem;
    }

    .route-details-card .card-body {
        padding: 1rem;
    }

    .route-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .route-status {
        margin-left: 0;
    }

    .route-title {
        font-size: 1.25rem;
    }

    .journey-visualization {
        flex-direction: column;
        padding: 1rem 0.75rem;
    }

    .road-path {
        margin: 1rem 0;
        order: 2;
    }

    .journey-point {
        margin: 0.5rem 0;
    }

    .journey-point:first-child {
        order: 1;
    }

    .journey-point:last-child {
        order: 3;
    }

    .route-info-cards-centered {
        gap: 0.3rem;
        flex-direction: column;
        align-items: center;
    }

    .info-item {
        padding: 0.3rem;
        min-width: 200px;
    }

    .journey-visualization {
        padding: 1rem 1.5rem;
        flex-direction: column;
        gap: 1rem;
    }

    .road-path {
        margin: 0.5rem 0;
        order: 2;
    }

    .route-summary-grid {
        gap: 0.75rem;
    }

    .summary-card {
        padding: 0.75rem;
    }

    .point-item {
        padding: 0.75rem;
    }

}

@media (max-width: 576px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .stat-card {
        flex-direction: column;
        text-align: center;
    }

    .stat-icon {
        margin-right: 0;
        margin-bottom: 0.75rem;
    }

    .details-grid {
        grid-template-columns: 1fr;
    }

    .detail-item {
        flex-direction: column;
        text-align: center;
    }

    .detail-icon {
        margin-right: 0;
        margin-bottom: 0.75rem;
    }

    .route-info-cards-centered {
        gap: 0.2rem;
        flex-direction: column;
        align-items: center;
    }

    .info-item {
        padding: 0.2rem;
        min-width: 150px;
    }

    .info-icon {
        width: 18px;
        height: 18px;
        font-size: 0.6rem;
    }

    .info-value {
        font-size: 0.7rem;
    }

    .info-label {
        font-size: 0.6rem;
    }

    .journey-visualization {
        padding: 1rem;
    }

    .info-card {
        flex-direction: column;
        text-align: center;
    }

    .info-icon {
        margin-right: 0;
        margin-bottom: 0.5rem;
    }

    .route-summary-grid {
        grid-template-columns: 1fr;
    }

    .summary-card {
        flex-direction: column;
        text-align: center;
    }

    .summary-icon {
        margin-right: 0;
        margin-bottom: 0.5rem;
    }

    .point-item {
        flex-direction: column;
        text-align: center;
    }

    .point-icon {
        margin-right: 0;
        margin-bottom: 0.5rem;
    }
}

/* Fix outer layout (col-md-12 container) */
:deep(.col-md-12) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

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

/* ===== SUBROUTES FULL PAGE STYLES ===== */
.subroutes-full-page {
    width: 100%;
    padding: 0;
}

.subroutes-header h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
}

.subroutes-header p {
    font-size: 0.9rem;
    color: #6c757d;
}

.subroutes-table-container .card {
    border: 1px solid #e9ecef;
    border-radius: 0.5rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.subroutes-table-container .card-body {
    padding: 0;
}

/* ===== POINTS FULL PAGE STYLES ===== */
.points-full-page {
    width: 100%;
    padding: 0;
}

.points-header h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
}

.points-header p {
    font-size: 0.9rem;
    color: #6c757d;
}

.points-table-container .card {
    border: 1px solid #e9ecef;
    border-radius: 0.5rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.points-table-container .card-body {
    padding: 0;
}

/* Points table specific styles */
.points-table-container .text-monospace {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.85rem;
    color: #495057;
}

.points-table-container .badge {
    font-size: 0.75rem;
    padding: 0.4em 0.6em;
}

.points-table-container .btn-group .btn {
    margin: 0 1px;
}

.points-table-container .btn-group .btn:hover {
    transform: translateY(-1px);
}



.multiselect__content {
  z-index: 3000 !important; /* higher than modal (1050) */
}

/* Optional: remove weird spacing in table cells */
.table td {
  vertical-align: middle;
}



</style>
