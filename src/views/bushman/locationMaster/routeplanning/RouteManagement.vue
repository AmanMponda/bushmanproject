<template>
    <div class="d-flex justify-content-between align-items-center">
        <ul class="breadcrumb">
            <li class="breadcrumb-item"><router-link to="#">OPERATIONS</router-link></li>
            <li class="breadcrumb-item "><router-link to="/abs/route-master">ROUTE MASTER</router-link></li>
            <li class="breadcrumb-item "><router-link to="/abs/route-master">{{ selectedRoute.city_link }}</router-link>
            </li>
        </ul>
        <button @click="$router.back()" class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill">
            <i class="fa fa-arrow-left me-1"></i> Back
        </button>
    </div>

    <div class="row gx-4 min-vh-100 ">
        <div class="card ">
            <!-- HEADER -->
            <div class="card-header d-flex align-items-center  bg-white fw-400">
                <div class="d-flex align-items-center">
                    <div class="vehicle-icon me-2">
                        <i class="fa fa-calendar-alt fa-3x text-primary"></i>
                    </div>
                    <div>
                        <h4 class="mb-0">{{ selectedRoute.city_link }}</h4>
                        <small class="text-muted">Map, subroutes and points for this route</small>
                    </div>
                </div>
            </div>
            <!-- TABS -->
            <div class="card-header p-0 border-bottom  bg-white ">
                <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
                    <li class="nav-item flex-fill text-center" role="presentation">
                        <a href="#" @click.prevent="activeTab = 'overview'" class="nav-link"
                            :class="{ active: activeTab === 'overview' }">
                            <i class="fa fa-map me-1"></i> Overview
                        </a>
                    </li>
                    <li class="nav-item flex-fill text-center" role="presentation">
                        <a href="#" @click.prevent="activeTab = 'subroutes'; subSubRouteAction() "
                            class="nav-link" :class="{ active: activeTab === 'subroutes' }">
                            <i class="fa fa-code-branch me-1"></i> SubRoutes
                        </a>
                    </li>
                    <li class="nav-item flex-fill text-center" role="presentation">
                        <a href="#" @click.prevent="activeTab = 'agents'" class="nav-link"
                            :class="{ active: activeTab === 'agents' }">
                            <i class="fa fa-group me-1"></i> Agents 
                        </a>
                    </li>
                     <li class="nav-item flex-fill text-center" role="presentation">
                        <a href="#" @click.prevent="activeTab = 'debtcollector';" class="nav-link"
                            :class="{ active: activeTab === 'debtcollector' } ">
                            <i class="fa fa-person me-1"></i> Debt Collector 
                        </a>
                    </li>
                </ul>
            </div>
            <!-- TAB CONTENT -->
            <div class="tab-content">
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }" id="icon-routes"
                    role="tabpanel" aria-labelledby="icon-routes-tab">
                    <div class="card-body">
     
                        <div class="row g-3">
                            <!-- LEFT: ROUTE DETAILS -->
                            <div class="col-md-6">                                
                                <div class="row g-3">
                                    <!-- Distance -->
                                    <div class="col-6">
                                        <div class="p-3 border rounded d-flex align-items-center">
                                            <i class="fa fa-road fs-2 text-primary me-3"></i>
                                            <div>
                                                <div class="fw-bold">
                                                    {{ selectedRoute.route_distance || 'N/A' }} km
                                                </div>
                                                <small class="text-muted">Distance</small>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Duration -->
                                    <div class="col-6">
                                        <div class="p-3 border rounded d-flex align-items-center">
                                            <i class="fa fa-clock fs-2 text-warning me-3"></i>
                                            <div>
                                                <div class="fw-bold">
                                                    {{ selectedRoute.approximate_hrs || 'N/A' }}h
                                                </div>
                                                <small class="text-muted">Duration</small>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Route Code -->
                                    <div class="col-6">
                                        <div class="p-3 border rounded d-flex align-items-center">
                                            <i class="fa fa-bus fs-2 text-success me-3"></i>
                                            <div>
                                                <div class="fw-bold">
                                                    {{ selectedRoute.route_code || 'N/A' }}
                                                </div>
                                                <small class="text-muted">Route Code</small>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Stops -->
                                    <div class="col-6">
                                        <div class="p-3 border rounded d-flex align-items-center">
                                            <i class="fa fa-map-marker-alt fs-2 text-danger me-3"></i>
                                            <div>
                                                <div class="fw-bold">
                                                    {{ selectedRoute.stop_count || 0 }}
                                                </div>
                                                <small class="text-muted">Total Stops</small>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div class="position-relative my-4">
                                <hr class="my-4">
                                <div class="position-absolute top-50 start-0 translate-middle-y bg-white px-3">
                                    <span class="text-muted small"><i class="fa fa-cog me-1"></i>Actions</span>
                                </div>
                                </div>
                              <!-- <div class=" d-flex justify-content-start m-2">
                                    <button 
                                        class="btn btn-outline-primary btn-lg"
                                        @click="openRouteStopsEditor">
                                        <i class="fa fa-map-marker-alt me-1"></i>Manage Stops
                                    </button>
                                </div> -->
                            </div>
                            <!-- RIGHT: MAP SECTION -->
                            <div class="col-md-6">
                                <div class="p-3 border rounded  text-center">
                                    <div class="tab-pane fade show " id="geophance">
                                        <div id="map" style="height: 300px; border-radius: 10px; overflow: hidden;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'subroutes' }" id="icon-routes"
                    role="tabpanel" aria-labelledby="icon-routes-tab">
                    <div v-if="!isSubrouteCreateMode && inCompleteCityLinks === null " class="subroutes-full-page">

                        <div v-if="isLoadingSubRoutes" class="d-flex justify-content-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                            <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                                <div class="panel br-6 p-0">
                                    <div class="custom-table ">
                                        <StandardDataTable :columns="subRouteColumns" :data="filteredSubRoutes"
                                            :loading="isLoading" :filters="subRouteTableOption"
                                            :defaultPageSize="subRouteTableOption.pageSize" :disablePagination="false"
                                            :showDateFilters="false" :actionButtons="subRoutepageActions">
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
                                                <span :class="row.is_active ? 'badge bg-success p-2' : 'badge bg-danger p-2'">
                                                    {{ row.is_active ? 'Active' : 'Inactive' }}
                                                </span>
                                            </template>
                                            <template #actions="{ row }">
                                                <div class=" gap-3" role="group">
                                                    <button  class="btn btn-sm btn-outline-primary"
                                                        @click="openSubRouteModal(row)" title="Edit">
                                                        <i class="fa fa-edit"></i>
                                                    </button>                                                   
                                                </div>
                                            </template>
                                        </StandardDataTable>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="!isSubrouteCreateMode &&  inCompleteCityLinks != null ">
                        <div class="m-4">
    <div class="alert alert-warning mb-4">
      <i class="bi bi-exclamation-triangle me-2"></i>
     <strong>{{ inCompleteCityLinks.message }}:</strong> 
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Route</th>
            <th>Code *</th>
            <th>Distance (KM) *</th>
            <th>Hours *</th>          
            
          </tr>
        </thead>
        <tbody>
          <tr v-for="(route, index) in inCompleteCityLinks.data" :key="route.id">
            <td>{{ index + 1 }}</td>
            <td>
              <strong>{{ route.from }} → {{ route.to }}</strong><br>              
            </td>
            <td>
              <input               
                type="text" 
                @input="onCityLinkChange(route)"
                class="form-control form-control-sm"
                v-model="route.code"
                placeholder="Enter code"
              >
            </td>
            <td>
              <input 
                type="number" 
                class="form-control form-control-sm"
                v-model="route.distance_km"
                placeholder="0.0"
                step="0.1"
              >
            </td>
            <td>
              <input 
                type="number" 
                class="form-control form-control-sm"
                v-model="route.approx_hours"
                placeholder="0.0"
                step="0.1"
              >
            </td>         
            
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-end align-items-end mt-3 gap-2">
         <button class="btn btn-outline-danger" @click="closeCreation">Cancel</button>
                        
      <button class="btn btn-primary" @click="submitUpdatedCityLinks" :dissable="isSaveCityLinks" >
       <span v-if='isSaveCityLinks'>
     <div class="spinner-border spinner-border-sm"></div>                       
       </span>
       <span v-else>
 Submit All Changes
       </span>       
      </button>
    </div>
  </div>
                    </div>
                    <div v-else>
               <div class="container p-2 m-2 bordered shadow mt-2">
                <div class="d-flex justify-content-center">
                    <h5>Sub Route Registration Form</h5>
                </div>
                 <div class="container my-3">
  <!-- Nav Tabs with equal width -->
  <ul class="nav nav-tabs nav-justified mb-3" role="tablist">
    <li class="nav-item" role="presentation">
      <button 
        class="nav-link active" 
        id="tab1-tab" 
        data-bs-toggle="tab" 
        data-bs-target="#tab1" 
        type="button" 
        role="tab"
      >
        Add Subroute By Cities
      </button>
    </li>
    <li class="nav-item" role="presentation">
      <button 
        class="nav-link" 
        id="tab2-tab" 
        data-bs-toggle="tab" 
        data-bs-target="#tab2" 
        type="button" 
        role="tab"
      >
       Add Subroute By City Links
      </button>
    </li>
  </ul>
  <!-- Tab Content -->
  <div class="tab-content card p-3 rounded-3 shadow-sm">    
    <!-- Tab 1: City Selector -->
    <div class="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab">
      <CitySelector
        :allCities="allCities"
        v-model:selectedCities="citiesForRoute"
      />

           <div class="d-flex justify-content-end gap-3 mt-1">
                    <button class="btn btn-outline-danger" @click="closeCreation">Cancel</button>
                   
                     <button 
        @click="submitRoute" 
        class="btn btn-primary "
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
        <span v-else>Save Route</span>
      </button>
         </div>
    
    </div>

    <!-- Tab 2: Subroutes Table -->
    <div class="tab-pane fade" id="tab2" role="tabpanel" aria-labelledby="tab2-tab">
      <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 45%">City Link</th>
              <th style="width: 25%">Sequence</th>
              <th v-if="multipleSubRoutes.length > 1" style="width: 15%">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subroute, index) in multipleSubRoutes" :key="index">
              <td>
                <Multiselect
                  v-model="subroute.city_link_id"
                  :options="cityLinks"
                  label="name"
                  track-by="id"
                  placeholder="Select City Link"
                  :append-to-body="true"
                  :searchable="true"
                />
              </td>
              <td>
                <input v-model="subroute.sequency" type="number" class="form-control form-control-sm" />
              </td>
              <td v-if="multipleSubRoutes.length > 1" class="text-center">
                <button type="button" class="btn btn-sm btn-outline-danger" @click="removeSubRouteRow(index)">
                  remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="d-flex justify-content-end gap-3 mt-1">
                    <button class="btn btn-outline-danger" @click="showSubRouteModal= false">Cancel</button>
                    <button v-if="isMultipleSubRouteMode" type="button" class="btn btn btn-outline-secondary"
                        @click="addSubRouteRow">
                        <i class="fa fa-plus me-1"></i> Add Row
                    </button>
                    <button class="btn btn-outline-primary" @click="saveSubRoute">
                        <span v-if="isLoading">
                            <div class="spinner-border spinner-border-sm"></div>
                        </span>
                        <span v-else>{{
                            currentSubRoute.id ? 'Update' : 'Save'
                            }}</span>
                    </button>
         </div>


    </div>

  </div>

              </div>
                </div>
                </div>
                </div>                
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'agents' }" id="icon-routes" role="tabpanel" aria-labelledby="icon-routes-tab">
                     <AgentRoute></AgentRoute>
                </div>
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'debtcollector' }" id="icon-routes"
                    role="tabpanel" aria-labelledby="icon-routes-tab">
                     <DebtCollector></DebtCollector>
                </div>
            </div>
        </div>
    </div>
    <!-- SubRoute Modal -->
    <div v-if="showSubRouteModal" class="modal d-block" tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-scrollable ">       
            <div class="modal-content vh-100">
                <div class="modal-header">
                    <h5 class="modal-title">{{ currentSubRoute.id ? 'Edit SubRoute' : 'Add SubRoute' }}</h5>
                    <button type="button" class="btn-close" @click="showSubRouteModal=false"></button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <!-- Single SubRoute Form (for editing) -->
                    <div v-if="!isMultipleSubRouteMode">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label>City Link</label>
                                <Multiselect v-model="currentSubRoute.city_link_id" :options="cityLinks" label="name"
                                    track-by="id" placeholder="Select City Link" />
                            </div>
                            <!-- <div class="col-md-4 mb-3">
                                <label>Route</label>
                                <Multiselect v-model="currentSubRoute.route_id"
                                    :options="routesList" label="city_link" track-by="id"
                                    placeholder="Select Route" />
                            </div> -->
                            <div class="col-md-4 mb-3">
                                <label>Sequency</label>
                                <input v-model="currentSubRoute.sequency" type="number" class="form-control" />
                            </div>
                            <div class="col-md-4 mb-3">
                                <label>Status</label>
                                <select v-model="currentSubRoute.is_active" class="form-control">
                                    <option :value="1">Active</option>
                                    <!-- <option :value="0">Inactive</option> -->
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Multiple SubRoutes Form (for adding new) -->
                    <div v-else>
           <table class="table table-bordered table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th style="width: 35%">City Link</th>
          <th style="width: 20%">Sequency</th>
          <th v-if="multipleSubRoutes.length > 1" style="width: 10%">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(subroute, index) in multipleSubRoutes" :key="index">
          <td>
            <Multiselect
              v-model="subroute.city_link_id"
              :options="cityLinks"
              label="name"
              track-by="id"
              placeholder="Select City Link"
              :append-to-body="true"
              :searchable="true"
            />
          </td>
          <td>
            <input v-model="subroute.sequency" type="number" class="form-control form-control-sm" />
          </td>
          <td v-if="multipleSubRoutes.length > 1" class="text-center">
            <button type="button" class="btn btn-sm btn-danger" @click="removeSubRouteRow(index)">
              <i class="fa fa-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-danger" @click="closeCreation()">Cancel</button>
                    <button v-if="isMultipleSubRouteMode" type="button" class="btn btn btn-outline-secondary"
                        @click="addSubRouteRow">
                        <i class="fa fa-plus me-1"></i> Add Row
                    </button>
                    <button class="btn btn-outline-primary" @click="saveSubRoute">
                        <span v-if="isLoading">
                            <div class="spinner-border spinner-border-sm"></div>
                        </span>
                        <span v-else>{{
                            currentSubRoute.id ? 'Update' : 'Save'
                            }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div v-if="showSubRouteModal" class="modal-backdrop fade show"></div>   
    <RouteStops 
  ref="routeStopsEditor"
  :selected-route="selectedRoute"
  :route-stops="routeStopsData" 
  @update:stops="handleStopsUpdate"
  @save-complete="handleSaveComplete"
/>


</template>

<script setup>
import { onMounted, ref, nextTick, computed, watch } from "vue";
import { useRoute } from "vue-router";
import RouteStops from "./routeStops.vue";
import CitySelector from "./citySelector.vue"
// route tab state
import L from 'leaflet';
const activeTab = ref('overview');
import AgentRoute   from  './AgentRoute.vue'
import DebtCollector   from  './debtCorrector.vue';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import axios from "axios";
import { Modal } from "bootstrap";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.min.css";
import { useNotification } from "@/composables/notification";
import { useAuthStore } from "@/stores/auth";
import draggable from "vuedraggable";

// Notifications/Auth
const { showAlert } = useNotification();
const authStore = useAuthStore();
const route = useRoute();
const routeId = ref(route.params.id ? Number(route.params.id) : null);
const  addDocumentationOffcanvasRef = ref(false);
const selectedRoute = ref({});
const routeStopsData = ref([]);
// Route points for display (no map functionality)
const routePoints = ref([
    {
        type: "POINT",
        coordinates: [
            // Dar es Salaam – Ubungo
            { lat: -6.7905, lng: 39.2083 },

            // Morogoro – Msamvu
            { lat: -6.8278, lng: 37.6612 }
        ]
    },

    {
        type: "POLYGON",
        coordinates: [
            // Dar → Chalinze → Morogoro road path (simple polyline shape)
            { lat: -6.7905, lng: 39.2083 }, // Dar
            { lat: -6.9200, lng: 38.9500 }, // Kigamboni bypass area
            { lat: -6.7000, lng: 38.5500 }, // Near Chalinze
            { lat: -6.9000, lng: 38.2000 }, // Towards Mikese
            { lat: -6.8278, lng: 37.6612 }  // Morogoro
        ]
    }
]);

function setActiveTab(tab) {  
  sessionStorage.setItem('ACTIVE_TAB', tab)
}



const routeStopsEditor = ref(null);
const axiosInstance = axios.create({
    baseURL: API_URL_2,
    headers: {
        "Content-Type": "application/json",
        Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
        "X-User-Id": authStore.user?.id || "",
        "X-Username": authStore.user?.username || "",
    },
});


const emit = defineEmits(['update:stops'])

// function openRouteStopsEditor() {
//   if (!selectedRoute.value) {
//     alert('Please select a route first')
//     return
//   }
  
//   // Open the stops editor
//   routeStopsEditor.value.addDocumentationOffcanvasRef = true
// }



const initializeMap = () => {
    map.value = L.map('map').setView([-6.814965, 39.122456], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map.value);

}
const drawGeofencesOnMap = () => {
    if (!map.value) return;
    // Clear existing layers
    map.value.eachLayer((layer) => {
        if (layer instanceof L.Polygon || layer instanceof L.Marker) map.value.removeLayer(layer);
    });


    routePoints.value.forEach((g) => {
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

let googleMap = null;
let googleBounds = null;

const initGoogleMap = () => {
  googleMap = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -6.8, lng: 39.0 },
    zoom: 7,
  });

  googleBounds = new google.maps.LatLngBounds();
};


const drawOnGoogleMap = () => {
  if (!googleMap) return;

  // Clear previous overlays
  if (googleMap.customOverlays) {
    googleMap.customOverlays.forEach(o => o.setMap(null));
  }
  googleMap.customOverlays = [];

  routePoints.forEach((g) => {
    // ----- POINTS -----
    if (g.type === "POINT") {
      g.coordinates.forEach((c) => {
        let marker = new google.maps.Marker({
          position: { lat: c.lat, lng: c.lng },
          map: googleMap
        });

        googleMap.customOverlays.push(marker);
        googleBounds.extend(marker.position);
      });
    }

    // ----- POLYGON / PATH -----
    if (g.type === "POLYGON") {
      let path = g.coordinates.map(c => ({ lat: c.lat, lng: c.lng }));

      let polyline = new google.maps.Polyline({
        path,
        map: googleMap,
        strokeColor: "#FF0000",
        strokeWeight: 3,
        strokeOpacity: 0.8,
      });

      googleMap.customOverlays.push(polyline);

      path.forEach(p => googleBounds.extend(p));
    }
  });

  googleMap.fitBounds(googleBounds);
};




onMounted(async () => {  
     initializeMap();
     drawGeofencesOnMap();
    // Preload selects for modal use
    await Promise.all([
        fetchRoutes()  ,
        setActiveTab('Route Planning')       
    ]);
});


const allCities = ref([  
]);
const inCompleteCityLinks = ref(null);
const citiesForRoute = ref([]);

const submitRoute = async () => {
  if (citiesForRoute.value.length < 2) {
    alert("Select at least 2 cities");
    return;
  }
  isLoading.value = true;

  try {
    const res = await axiosInstance.post("/locations/sub-routes", {
      route_id: route.params.id,
      cities: citiesForRoute.value,
      is_active: true
    });
    if (res.data.status === 'success') {
        showAlert('success',res.data?.message)
        isSubrouteCreateMode.value = false;
    }
      if (res.data.status === 'partial') {        
        showAlert('info',res.data?.message)
        inCompleteCityLinks.value = res.data;
        isSubrouteCreateMode.value = false;        
    }    
  } catch (err) {
    console.error(err.response?.data || err);   
  }
  finally{
 isLoading.value= false;
  }
};

//sub-routes concept
const isSubrouteCreateMode = ref(false);
const showSubRouteModal = ref(false);
const isLoading = ref(false);
const isLoadingSubRoutes = ref(false);
const subRoutesList = ref([]);
const filteredSubRoutes = ref([]);
const subRouteModal = ref(null);
const currentSubRoute = ref({
    id: null,
    city_link_id: "",
    route_id: "",
    sequency: 1,
    is_active: 1
});

const fetchFormData = async () => {
  
  try {    const response = await axiosInstance.get('locations/form-data');
  
  allCities.value = response.data.data.cities || [];


  } catch (error) {
    console.error('Form Data Error:', error); // Debug log
    
  }
};


// Multiple subroutes functionality
const isSaveCityLinks = ref(false);
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
const subRouteColumns = ref([
    { key: 'sno', label: 'Sno', visible: true, sortable: false },
    { key: 'city_link', label: 'Name', visible: true, sortable: false },
    { key: 'sequency', label: 'Sequency', visible: true, sortable: false },
    { key: 'is_active', label: 'Status', visible: true, sortable: false },
    { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const subRouteTableOption = ref({
    search: '',
    pageSize: 10,
    currentPage: 1,
    sortField: '',
    sortDirection: 'asc',
    showAdvancedFilters: false,
    date_from: '',
    date_to: ''
});


// Points table configuration
const pointsColumns = ref(['sno', 'point_name', 'region', 'point_type',]);
const pointsTableOption = ref({
    perPage: 10,
    perPageValues: [5, 10, 20, 50],
    skin: 'table',
    columnsClasses: { actions: 'actions text-center' },
    sortable: ['sno', 'point_name', 'region'],
    pagination: { nav: 'scroll', chunk: 5 },
});

const subRoutepageActions = computed(() => {
    const actions = [];
    if (true) {
        actions.push({
            label: "Refresh",
            icon: "fa fa-sync-alt",
            class: "btn btn-secondary",
            method: () => (fetchSubRoutesList())
        });
    }
    if (true) {
        actions.push({
            label: "Register SubRoute(s)",
            icon: "fa fa-plus",
            class: "btn btn-primary",
            method: () => (openSubRouteModal())
        });
    }
    return actions;
});
// Select options for subroute modal
const cityLinks = ref([]);
const routesList = ref([]);

const subSubRouteAction = () => {
    fetchSubRoutesList();
     fetchCityLinks();
     citiesForRoute.value = '';
     isSubrouteCreateMode.value = false;
}

const fetchCityLinks = async () => {
    try {
        const res = await axiosInstance.get("locations/city-links");
        cityLinks.value = (res.data.data || []).map((d) => ({ ...d, name: d.name || d.code }));
    } catch (e) {
        showAlert("error", "Failed to fetch city links");
    }
};


const fetchRoutesList = async () => {
    try {
        const res = await axiosInstance.get("locations/routes");
        routesList.value = (res.data.data || []).map((d) => d);

        // Also set current route data if routeId is available
        if (routeId.value && res.data.data) {
            const routeData = res.data.data.find(route => route.id === Number(routeId.value));
            if (routeData) {
                currentRoute.value = {
                    id: routeData.id,
                    name: `${routeData.city_from} - ${routeData.city_to}`,
                    city_link: routeData.city_link,
                    city_from: routeData.city_from,
                    city_to: routeData.city_to,
                    route_code: routeData.route_code,
                    route_distance: routeData.route_distance,
                    approximate_hrs: routeData.approximate_hrs,
                    stop_count: routeData.stop_count || 0,
                    status: routeData.is_active ? 'Active' : 'Inactive',
                    description: `Route from ${routeData.city_from} to ${routeData.city_to}`
                };
                // console.log('Updated current route from routes list:', currentRoute.value);
            }
        }
    } catch (e) {
        showAlert("error", "Failed to fetch routes");
    }
};

const fetchRoutes = async () => {
    isLoading.value = true;
    try {
        // Use route_id parameter if available

        const response = await axiosInstance.get(`locations/routes/${routeId.value}`);
        // console.log('SubRoutes API Response:', response.data);

        selectedRoute.value = response.data.data;
         if (selectedRoute.value.stops) {
      routeStopsData.value = selectedRoute.value.stops;
    }
    } catch (error) {
        console.error('Error fetching subroutes:', error);
        showAlert('error', 'Failed to fetch subroutes');
    } finally {
        isLoading.value = false;
    }
};


function openRouteStopsEditor() {
  if (!selectedRoute.value) {
    showAlert('warning', 'Please wait for route data to load');
    return;
  }
  
  // Option 1: If stops are already in selectedRoute
  if (selectedRoute.value.stops) {
    routeStopsData.value = selectedRoute.value.stops;
  } 
  
  // Open the stops editor
  if (routeStopsEditor.value) {
    // Give a small delay to ensure data is loaded
    setTimeout(() => {
      routeStopsEditor.value.openEditor();
    }, 100);
  }
}


function handleStopsUpdate(updatedStops) {
  // Update local data
  routeStopsData.value = updatedStops;
  
  // Also update in selectedRoute if needed
  if (selectedRoute.value) {
    selectedRoute.value = {
      ...selectedRoute.value,
      stops: updatedStops,
      stop_count: updatedStops.length
    };
  }
  
  showAlert('success', 'Stops order updated');
}

function handleSaveComplete(result) {
  console.log('Save completed:', result);
  showAlert('success', 'Stops saved to server successfully');
  
  // Refresh route data
  fetchRoutes();
}

const onCityLinkChange = (route) => { 

  const origin = route.from
    ?.slice(0, 3)
    .toUpperCase();

  const destination = route.to
    ?.slice(0, 3)
    .toUpperCase();

  return `${origin}-${destination}`;
}

const submitUpdatedCityLinks = async()  => {        
      isSaveCityLinks.value = true;
      try {      
        const payload = inCompleteCityLinks.value.data.map(route => ({
            id: route.id,
            uuid: route.uuid,
            original_city_id: route.original_city_id,
            destination_city_id: route.destination_city_id,
            code: route.code,
            distance_km: parseFloat(route.distance_km),
            approx_hours: parseFloat(route.approx_hours),
            path_geometric: route.path_geometric || null
          }))       
               
        const response = await axiosInstance.post('/locations/update/city-links',{cityLinks: payload} );        
        if (response.data.status === 'success') {
         showAlert('success','City links updated successfully!'); 
         inCompleteCityLinks.value = null;   
         fetchSubRoutesList();      
        }
      } 
      catch(error) 
      {
        console.error('Error:', error);
              } 
        finally {
        isSaveCityLinks.value = false;
        isSubrouteCreateMode.value = false;
      }
    }

const fetchSubRoutesList = async () => {
    isLoadingSubRoutes.value = true;
    try {
        // Use route_id parameter if available
        const url = routeId.value ? `locations/sub-routes?route_id=${routeId.value}` : 'sub-routes';
        const response = await axiosInstance.get(url);
        // console.log('SubRoutes API Response:', response.data);

        subRoutesList.value = response.data.data.map((d, index) => ({
            sno: index + 1,
            ...d
        }));

        // Since we're filtering by route_id in the API call, no need for client-side filtering
        filteredSubRoutes.value = subRoutesList.value;
        // console.log('Filtered SubRoutes:', filteredSubRoutes.value);

    } catch (error) {
        console.error('Error fetching subroutes:', error);        
    } finally {
        isLoadingSubRoutes.value = false;
    }
};
const routesPoints = ref([]);
// Fetch route points based on route_id


const openSubRouteModal = async (subroute = null) => {
    fetchFormData();
    if (subroute) {
        currentSubRoute.value = { ...subroute };
        isMultipleSubRouteMode.value = false;
        multipleSubRoutes.value = [];
    } else {
        isSubrouteCreateMode.value = true;
        currentSubRoute.value = {
            id: null,
            city_link_id: "",
            route_id: "",
            sequency: 1,
            is_active: 1
        };
        isMultipleSubRouteMode.value = true; // Always start in multiple mode for new entries
        multipleSubRoutes.value = [{
            id: null,
            city_link_id: "",
            route_id: "",
            sequency: 1,
            is_active: 1
        }];
    }
 
    
};

// Add new subroute row
const addSubRouteRow = () => {
    const newRow = {
        id: null,
        city_link_id: "",
        route_id: "",
        sequency: 1,
        is_active: 1
    };

    // Add to the beginning of the array (latest first)
    multipleSubRoutes.value.unshift(newRow);

    // Scroll to the top to show the newly added row
    nextTick(() => {
        const container = document.querySelector('.subroutes-container');
        if (container) {
            container.scrollTop = 0;
        }
    });
};

// Remove subroute row
const removeSubRouteRow = (index) => {
    if (multipleSubRoutes.value.length > 1) {
        multipleSubRoutes.value.splice(index, 1);
    }
};

const saveSubRoute = async () => {
    if (isMultipleSubRouteMode.value) {
        await saveMultipleSubRoutes();
        return;
    }

    isLoading.value = true;
    try {
        let params = {
            city_link_id: typeof currentSubRoute.value.city_link_id === 'object' ? currentSubRoute.value.city_link_id.id : currentSubRoute.value.city_link_id,
            //   route_id: typeof currentSubRoute.value.route_id === 'object' ? currentSubRoute.value.route_id.id : currentSubRoute.value.route_id,
            route_id: route.params.id,
            sequency: currentSubRoute.value.sequency,
            is_active: currentSubRoute.value.is_active
        };
        let response;
        if (currentSubRoute.value.id) {
            response = await axiosInstance.put(`locations/sub-routes/${currentSubRoute.value.id}`, params);
        } else {
            response = await axiosInstance.post('locations/sub-routes', params);
        }
        if (response.data.status === "success") {
            showAlert('success', 'SubRoute saved successfully');
            subRouteModal.value.hide();
            await fetchSubRoutesList();
        }
        
    } catch (error) {
        showAlert('error', 'Failed to save subroute');
    }
    finally {
        isLoading.value = false;
    }
};

// Save multiple subroutes
const saveMultipleSubRoutes = async () => {
    isLoading.value = true;
    try {
        // Validate all entries
        for (let i = 0; i < multipleSubRoutes.value.length; i++) {
            const subroute = multipleSubRoutes.value[i];
            if (!subroute.city_link_id) {
                showAlert('error', `Please fill all required fields in row ${i + 1}`);
                return;
            }
        }
        // Prepare batch data
        const batchData = multipleSubRoutes.value.map(subroute => ({
            city_link_id: typeof subroute.city_link_id === 'object' ? subroute.city_link_id.id : subroute.city_link_id,
            route_id: route.params.id,
            sequency: subroute.sequency,
            is_active: 1
        }));
        // Send batch request
        const response = await axiosInstance.post('locations/sub-routes', { sub_routes: batchData });
 console.log(response.data);
  if (response.data.status === 'partial') {
            showAlert('info', response.data.message);
            subRouteModal.value.hide();
            await fetchSubRoutesList();
        }
        if (response.data.status === "success") {
            showAlert('success', `${multipleSubRoutes.value.length} SubRoutes saved successfully`);
            closeCreation();
            await fetchSubRoutesList();            
        }
       
    } catch (error) {
        if (error.response?.status === 422) {
            const errors = error.response.data.errors;
            Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
        }
        console.error(error);
        }
    finally {
        isLoading.value = false;
    }
};


const closeCreation = () => {
  citiesForRoute.value = '';
  isSubrouteCreateMode.value = false;
  multipleSubRoutes.value = null;
  inCompleteCityLinks.value= null;


}
// Points table helper functions
const getPointIcon = (pointType) => {
    switch (pointType) {
        case 'Start':
            return 'fa fa-play-circle text-success';
        case 'End':
            return 'fa fa-stop-circle text-danger';
        case 'Stop':
            return 'fa fa-map-marker-alt text-info';
        case 'BOARDING':
            return 'fa fa-bus text-primary';
        case 'ALIGHTING':
            return 'fa fa-sign-out-alt text-warning';
        default:
            return 'fa fa-map-marker text-secondary';
    }
};


const getPointTypeClass = (pointType) => {
    switch (pointType) {
        case 'Start':
            return 'bg-success';
        case 'End':
            return 'bg-danger';
        case 'Stop':
            return 'bg-info';
        case 'BOARDING':
            return 'bg-primary';
        case 'ALIGHTING':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
};






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







.multiselect__content {
  z-index: 3000 !important; /* higher than modal (1050) */
}

/* Optional: remove weird spacing in table cells */
.table td {
  vertical-align: middle;
}



</style>
<style scoped>
.stop-item {
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.stop-item:hover {
  background-color: #f8f9fa;
  transform: translateX(2px);
}

.stop-item.dragging {
  opacity: 0.5;
  background-color: #e9ecef;
}

.stop-item.drag-over {
  border-top: 2px solid #007bff;
}

.drag-handle {
  transition: color 0.2s;
}

.drag-handle:hover {
  color: #007bff !important;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

/* Add smooth transitions */
.stop-item-enter-active,
.stop-item-leave-active {
  transition: all 0.3s ease;
}

.stop-item-enter-from,
.stop-item-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* For better dragging UX */
.dragging-active {
  user-select: none;
  cursor: grabbing;
}

.dragging-active * {
  cursor: grabbing !important;
}
</style>