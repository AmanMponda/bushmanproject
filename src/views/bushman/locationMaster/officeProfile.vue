<template>

  <div class="vehicle-profile-page"> <!-- Breadcrumb -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <!-- Breadcrumb -->
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">SETTINGS</a></li>
        <li class="breadcrumb-item"><router-link to="/abs/location">LOCATION MASTER</router-link>
        </li>
        <li class="breadcrumb-item active"><router-link to="#">{{ office_name }}</router-link>
        </li>
      </ul>
      <button v-if="!showGeoForm" @click="$router.back()" class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill">
        <i class="fa fa-arrow-left me-1"></i> Back
      </button>
      <button v-if="showGeoForm" class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="showGeoForm = false">
        <i class="fa fa-arrow-left me-1"></i> Back
      </button>
    </div>
 <Transition name="slide-left" mode="out-in" >

  <div v-if="!showGeoForm"  key="list_page">
      <div class="row gx-4 mt-3 ">
      <div class="col-lg-12 ">
        <div class="card bg-white">
          <!-- HEADER -->
          <div class="card-header d-flex align-items-center  bg-white fw-400">
            <div class="d-flex align-items-center">
              <div class="vehicle-icon me-2">
                <div class="rounded">
                  <img src="/assets/img/gallery/office-building.png" style="height: 4em;" class="rounded-circle" />
                </div>
              </div>
              <div>
                <h4 class="mb-0">
                  {{ office_name || " " }}
                </h4>
                <small class="text-muted">
                  here is the short description about office
                </small>
              </div>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
              <button class="btn btn-primary" @click="showGeoForm= true" >
                <i class="fa fa-plus me-1"></i>
                 Add Geophance
              </button>
            </div>
          </div>

          <!-- TABS -->
          <div class="card-header p-0 border-bottom bg-white">
            <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
              <li v-for="tab in tabs" class="nav-item flex-fill text-center">
                <a :href="'#' + tab.key" class="nav-link" :class="{ active: activeTab === tab.key }"
                  @click="activeTab = tab.key" data-bs-toggle="tab">
                  <i :class="tab.icon"></i> {{ tab.label }}
                </a>
              </li>
            </ul>

          </div>
          <!-- TAB CONTENT -->
          <div class="tab-content p-4">
            <div class="tab-pane fade show active" id="overview">
              <div class="row mt-3">

                <!-- Branch -->
                <div class="col-md-4 mb-3">
                  <div class="card shadow-sm rounded-3 border-0 p-3">
                    <div class="d-flex align-items-center">

                      <!-- ICON -->
                      <div class="me-3 text-info" style="font-size: 2.5rem;">
                        <i class="bi bi-building"></i>
                      </div>

                      <!-- TEXT -->
                      <div>
                        <small class="text-muted d-block">Branch</small>
                        <h5 class="mb-0">{{ branch || '' }}</h5>
                      </div>

                    </div>
                  </div>

                </div>

                <!-- Contacts -->
                <div class="col-md-4 mb-3">
                  <div class="card shadow-sm rounded-3 border-0 p-3">
                    <div class="d-flex align-items-center">

                      <!-- ICON -->
                      <div class="me-3 text-info" style="font-size: 2.5rem;">
                        <i class="bi bi-telephone-fill"></i>
                      </div>

                      <!-- TEXT -->
                      <div>
                        <small class="text-muted d-block">Contacts</small>
                        <h5 class="mb-0">{{ contacts || '' }}</h5>
                      </div>

                    </div>
                  </div>
                </div>

                <!-- Agents -->
                <div class="col-md-4 mb-3">

                  <div class="card shadow-sm rounded-3 border-0 p-3">
                    <div class="d-flex align-items-center">

                      <!-- ICON -->
                      <div class="me-3 text-info" style="font-size: 2.5rem;">
                        <i class="bi bi-people-fill"></i>
                      </div>

                      <!-- TEXT -->
                      <div>
                        <small class="text-muted d-block">Total Agents</small>
                        <h5 class="mb-0">{{ agents.length }}</h5>
                      </div>

                    </div>
                  </div>
                </div>

                <!-- Service Points -->
                <div class="col-md-4 mb-3">
                  <div class="card shadow-sm rounded-3 border-0 p-3">
                    <div class="d-flex align-items-center">

                      <!-- ICON -->
                      <div class="me-3 text-info" style="font-size: 2.5rem;">
                        <i class="bi bi-shop"></i>
                      </div>

                      <!-- TEXT -->
                      <div>
                        <small class="text-muted d-block">Service Points</small>
                        <h5 class="mb-0">{{ total_service_point || 0 }}</h5>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div class="tab-pane fade" id="agents">
              <div class="panel br-6 p-0">
                <div class="custom-table p-3">
                  <StandardDataTable :columns="columns" :data="agents" :loading="isLoading" :filters="tableFilters"
                    :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
                    :actionButtons="pageAgentActions">
                    <template #name="{ row }">
                      <span><i class="fa fa-user text-info"></i> {{ row.name || 'N/A' }}</span>
                    </template>

                    <template #email="{ row }">
                      <span> <i class="fa fa-person me-3"></i> {{ row.email || 'N/A' }}</span>
                    </template>
                    <template #phone_number="{ row }">
                      <span> <i class="fa fa-phone text-info me-1"></i> {{ row.phone_number || 'N/A' }}</span>
                    </template>

                    <template #actions="{ row }">
                      <a v-if="permissions.includes('CAN_DELETE_AGENT')" class="btn btn-sm "
                        @click="deleteAgentOffice(props.row.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                          class="feather feather-trash-2 text-danger">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                          </path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </a>
                    </template>
                  </StandardDataTable>
                </div>
              </div>
            </div>
            <div class="tab-pane fade show " id="geophance">               
              <div id="map" style="height: 300px; border-radius: 10px; overflow: hidden;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else key="form_page">
     <div>
      <officeGeophancePage></officeGeophancePage>
     </div>
  </div>
   
    </Transition>



     <div v-if="showAddModal" class="modal fade show" style="display: block; background: rgba(0,0,0,0.5)">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content vh-100">
       <div class="modal-header">
            <h5 class="modal-title"> </h5>
            <button type="button" class="btn-close" @click="showAddModal=false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label>Agent(s)</label>
              <Multiselect v-model="agent" :options="active_agents" :multiple="true" track-by="id" label="name"
                placeholder="Select Agent(s)" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showAddModal=false">Cancel</button>
            <button class="btn btn-primary" @click="saveAgent"> Save</button>
          </div>
    </div>
  </div>
  </div>


  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import L from 'leaflet';
import { Modal } from 'bootstrap';
import officeGeophancePage from './officeGeophancePage.vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";
import { useRoute } from 'vue-router';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';


const showAddModal = ref(false);
const route = useRoute();
const { showAlert } = useNotification();
const authStore = useAuthStore();
const permissions = authStore.permissions;



const axiosInstance = axios.create({
  baseURL: API_URL_2,
  //baseURL: "http://127.0.0.1:8000/api/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const tableFilters = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: ''
});

const pageAgentActions = computed(() => {
  const actions = [];
  if (true) {
    actions.push({
      label: "Register Agent",
      icon: "fa fa-plus",
      class: "btn btn-outline-info",
      method: () => (openModal())
    });
  }
  if (true) {
    actions.push({
      label: "Print",
      icon: "fa fa-print",
      class: "btn btn-outline-info",
      method: () => (printAgentsList(agents))
    });
  }
  return actions;
});
const showGeoForm = ref(false);
const activeTab = ref("overview");
const service_point = ref('');
const servicePoints = ref([]);
const active_agents = ref([]);
const city = ref('');
const contacts = ref('');
const agent = ref('');
const office_name = ref('');
const total_service_point = ref(0);
const branch = ref('');
const isLoading = ref(false);
const agents = ref([]);
const selectedDate = ref(null)
const dateInput = ref(null)
// const columns = ref(['sno', 'name', 'email', 'phone_number', 'actions']);
const servicePointsColumns = ref(['sno', 'name', 'actions']);
const table_option = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['office', 'status'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'Email', label: 'Email', visible: true, sortable: false },
  { key: 'phone_number', label: 'Phone Number', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const tabs = ref([
  {
    key: "overview",
    label: "Overview",
    icon: "fa fa-home",
  },
  {
    key: "agents",
    label: "Agents",
    icon: "fa fa-group",
  },
  {
    key: "geophance",
    label: "Geophance",
    icon: "fa fa-route",
    action: () => fetchOfficeGeofences(route.params.id),

  },


])


const openModal = () => {
  fetchActiveAgents();
  showAddModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;

};

const fetchOfficeAgents = async (id) => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('/locations/agent-offices',
      {
        params: {
          office_id: id || '',
        }
      }
    );
    if (response.data.status === 'success') {
      office_name.value = response.data.office.name;
      total_service_point.value = response.data.office.service_point_count;
      branch.value = response.data.office.branch_name;
      agents.value = response.data.office.agents.map((d, index) => {
        return {
          sno: index + 1,
          id: d.id,
          name: d.name,
          email: d.email,
          phone_number: d.phone,
        };
      });
      servicePoints.value = response.data.office.service_points.map((d, index) => {
        return {
          sno: index + 1,
          id: d.id,
          name: d.name,
          location: d.location,
          phone_number: d.msisdn,
        };
      });
    }


  } catch (error) {
    showAlert('error', 'Failed to fetch agents');
  }
  finally {
    isLoading.value = false;
  }

};


const deleteAgentOffice = async (agent) => {
  if (!confirm('Are you sure you want to delete this agent from this office?')) return;

  try {
    const response = await axiosInstance.delete(`/locations/delete-agents`, {
      params: {
        office_id: route.params.id,
        agent_id: agent
      }
    });

    if (response.data.status === "success") {
      showAlert('success', response.data.message);
      await fetchOfficeAgents(route.params.id);
    }

  } catch (error) {
    showAlert('error', 'Failed to remove agent from office');
  }
};




const openDatePicker = () => {
  dateInput.value.click()
}

const fetchData = (event) => {
  selectedDate.value = event.target.value
  // if (selectedDate) {
  //// }
}

// active-agents

const fetchActiveAgents = async () => {

  try {
    const response = await axiosInstance.get('/locations/active-agents');
    if (response.data.status === 'success') {
      active_agents.value = response.data.data;
    }
  } catch (error) {
   console.error(error);
   
  }
};

const saveAgent = async () => {
  isLoading.value = true;
  if (agent.value.length === 0) {
    showAlert('error', 'Please select at least one agent');
    return;
  }
  try {
    //const response = await axiosInstance.post('/locations/assign-agents', {
      office_id: route.params.id,
      agent_ids: agent.value.map(a => a.id),
      service_point: service_point.value?.id
    });
    if (response.data.status === 'success') {

      showAlert('success', response.data.message);
      await fetchOfficeAgents(route.params.id);
      showAddModal.value = false;
    }
  } catch (error) {
    showAlert('error', 'Failed to add agents');
  } finally {
    isLoading.value = false;
  }
};

const printAgentsList = (agents) => {
  const printWindow = window.open('', '_blank');

  printWindow.document.write(`
    <html>
      <head>
        <title>Agents List</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333; }
          .company-name { font-size: 22px; font-weight: bold; color: red; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        
        <div class="header">
          <div class="company-name">ABOOD BUS SERVICE</div>
          <div>P.O Box 678, Morogoro Tanzania | Tel: +255 748 771 551</div>
          <h3>Agents List for ${office_name.value}</h3>
          <p>Date: ${new Date().toLocaleDateString()}</p>  
        </div>

        <!-- Agents Table -->
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Name</th>
              <th>Phone</th>             
            </tr>
          </thead>
          <tbody>
            ${agents.map((agent, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${agent.name}</td>
                <td>${agent.phone_number}</td>               
              </tr>
            `).join('')}
          </tbody>
        </table>
        
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = function () {
    setTimeout(function () {
      printWindow.print();
      printWindow.close();
    }, 200);
  };
};

//code for geofence modal
const showGeofenceModal = ref(false);
const openGeofenceModal = () => {

  showGeofenceModal.value = true;
};


const geoType = ref("");
const source = ref("manual");
const selectedOffice = ref(null);
const offices = ref([]); // Populate this using API call

const point = ref({ lat: "", lng: "" });
const coordinates = ref([{ lat: "", lng: "" }]);

const addCoordinate = () => coordinates.value.push({ lat: "", lng: "" });
const removeCoordinate = (i) => coordinates.value.splice(i, 1);

const closeGeofenceModal = () => {
  showGeofenceModal.value = false;
  geoType.value = "";
  coordinates.value = [{ lat: "", lng: "" }];
  selectedOffice.value = null;
};

const saveGeofence = async () => {
  if (!route.params.id || !geoType.value) {
    showAlert("info", "Please select office and geofence type");
    return;
  }

  let payload = { type: geoType.value, source: source.value };

  if (geoType.value === "POINT") {
    payload.coordinates = [
      { lat: point.value.lat, lng: point.value.lng }
    ];
  } else {
    payload.coordinates = coordinates.value;

  }

  try {
    isLoading.value = true;
    const response = await axiosInstance.post(
      `/location/${route.params.id}/geofence`,
      //payload

      {
        "type": "POLYGON",
        "coordinates": [
          { "lat": -6.791123, "lng": 39.208512 },
          { "lat": -6.791321, "lng": 39.208945 },
          { "lat": -6.791876, "lng": 39.208701 },
          { "lat": -6.791612, "lng": 39.208301 },
          { "lat": -6.791123, "lng": 39.208512 }  //
        ],
        "source": "manual"
      }

    );

    if (response.data.status === "success") {
      showAlert("success", "Geofence registered successfully!");
      closeGeofenceModal();
    } else {
      showAlert("error", "Failed to register geofence");
    }
  } catch (error) {
    console.error(error);
    showAlert("error", "Error saving geofence");
  } finally {
    isLoading.value = false;
  }
};


const mapMarkers = ref([]);
const mapPolygons = ref([]);



const officeId = ref(1); // set dynamically via route or props
const geofences = ref([]);

const fetchOfficeGeofences = async (id) => {
  if (!id) return;

  isLoading.value = true;
  try {
    const response = await axiosInstance.get(`/location/${id}/geofence`);
    if (response.data.status === 'success') {
      geofences.value = response.data.data;
      drawGeofencesOnMap();
    } else {
      showAlert('error', 'Failed to fetch geofences');
    }
  } catch (error) {
    console.error(error);
    showAlert('error', 'Failed to fetch geofences');
  } finally {
    isLoading.value = false;
  }
};

const map = ref(null); // reactive ref

const initializeMap = () => {
  map.value = L.map('map').setView([-6.814965, 39.122456], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value);
};

// const drawGeofencesOnMap = () => {
//   if (!map.value) return;

//   // Clear existing layers
//   map.value.eachLayer((layer) => {
//     if (layer instanceof L.Polygon || layer instanceof L.Marker) map.value.removeLayer(layer);
//   });

//
//   geofences.value.forEach((g) => {
//     if (g.type === 'POINT') {
//       g.coordinates.forEach((c) => {
//         L.marker([c.lat, c.lng]).addTo(map.value);
//       });
//     } else if (g.type === 'POLYGON') {
//       const latlngs = g.coordinates.map(c => [c.lat, c.lng]);
//       L.polygon(latlngs, { color: 'red', fillOpacity: 0.3 }).addTo(map.value);
//       map.value.fitBounds(latlngs);
//     }
//   }
//   );
// };


const drawGeofencesOnMap = () => {
  if (!map.value) return;

  // Clear existing layers
  map.value.eachLayer((layer) => {
    if (layer instanceof L.Polygon || layer instanceof L.Marker) map.value.removeLayer(layer);
  });

  //geofences.value.forEach((g) => {
    if (g.type === 'POINT') {
      g.coordinates.forEach((c) => {
        L.marker([c.lat, c.lng]).addTo(map.value);
      });
    } else if (g.type === 'POLYGON') {
      let latlngs = g.coordinates.map(c => [c.lat, c.lng]);

      // Ensure first and last coordinate are the same
      const first = latlngs[0];
      const last = latlngs[latlngs.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        latlngs.push([...first]);
      }

      L.polygon(latlngs, { color: 'red', fillOpacity: 0.3 }).addTo(map.value);

      // Fit map to polygon bounds
      map.value.fitBounds(latlngs);
    }
  });
};







onMounted(async () => {
  const officeId = route.params.id; // Assuming the office ID is passed as a route parameter
  if (officeId) {
    await fetchOfficeAgents(officeId);
  }
  else {
    route.push('/abs/operation');
  }
  initializeMap();
});

</script>

<style scoped>
.modal.show {
  z-index: 1050;
}

.modal-backdrop {
  z-index: 1040;
}

.file-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.rounded-4 {
  border-radius: 1rem !important;
}

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


.nav-tabs .nav-link {
  border: none;
  color: #6c757d;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-tabs .nav-link:hover {
  background: #f8f9fa;
  color: #495057;
}


</style>