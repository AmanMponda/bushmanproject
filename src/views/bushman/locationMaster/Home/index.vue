<template>
  <div class="d-block d-md-flex align-items-stretch h-100">
    <!-- BEGIN gallery-menu-container -->
    <div class="gallery-menu-container">
      <perfect-scrollbar class="h-100">
        <div class="gallery-menu">
          <div class="gallery-menu-header">Menu</div>
          <div v-for="t in reportTypes" :key="t.name" 
               @click="toggleType(t.name)"
               class="gallery-menu-item d-flex align-items-center justify-content-between"
               :class="activeTab == t.name ? 'bg-info border-bottom' : ''">
            <a class="gallery-menu-link">
              <i :class="[t.class]" style="color: #3c4e71;"></i>
              {{ t.name }}
            </a>
            <span class="badge text-bg-light me-4">{{ t.count }}</span>
          </div>
        </div>
      </perfect-scrollbar>
    </div>
    <!-- END gallery-menu-container -->
    
    <!-- BEGIN gallery-content-container -->
    <div class="gallery-content-container">
      <perfect-scrollbar class="h-100">
        <div class="gallery-content">
          <div class="gallery">
            <div>
              <ul class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">SETTINGS</a></li>
                <li class="breadcrumb-item">
                  <router-link to="#">LOCATION MASTER</router-link>
                </li>
                <li class="breadcrumb-item active">{{ activeTab.toUpperCase() }}</li>
              </ul>
            </div>
            
            <div class="gallery-image">
              <div class="row g-3" style="margin-top: -19px;">
                <!-- Nodes Tree View (Main View) -->
                <div v-if="activeTab === 'Nodes'">
                  <Nodes class="page-container"></Nodes>
                </div>
                
                <!-- Legacy Views (Optional - can be removed eventually) -->
                <div v-if="activeTab === 'Countries'">
                  <Country class="page-container"></Country>
                </div>
                <div v-if="activeTab === 'Cities'">
                  <City class="page-container"></City>
                </div>
                <div v-if="activeTab === 'Branches'">
                  <Branch class="page-container"></Branch>
                </div>
                <div v-if="activeTab === 'Offices'">
                  <Office class="page-container"></Office>
                </div>
                <div v-if="activeTab === 'Service Points'">
                  <ServicePoint class="page-container"></ServicePoint>
                </div>
                <div v-if="activeTab === 'Stops'">
                  <Stop class="page-container"></Stop>
                </div>
                
                <!-- Transport-related (should remain separate) -->
                <div v-if="activeTab === 'City Links'">
                  <CityLink class="page-container"></CityLink>
                </div>
                <div v-if="activeTab === 'Trips'">
                  <Trips class="page-container"></Trips>
                </div>
                <div v-if="activeTab === 'Routes'">
                  <Routes class="page-container"></Routes>
                </div>
              </div>
            </div>
          </div>
        </div>
      </perfect-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useNotification } from '@/composables/notification'
import { useAppOptionStore } from '@/stores/app-option';
import axios from 'axios';
import { useAuthStore } from "@/stores/auth";
import { API_URL_2 } from "@/config/config";

// Legacy components (optional)
import Country from './country.vue';
import City from './city.vue';
import Office from './office.vue';
import Branch from './Branch.vue';
import ServicePoint from './servicePoint.vue';
import Stop from './stops.vue';
import CityLink from './CityLink/index.vue'
import Trips from './trips/index.vue';
import Routes from './routes/index.vue';

// New Nodes component
import Nodes from './home.vue';

// Setup
const authStore = useAuthStore();
const appOption = useAppOptionStore();
const { showAlert } = useNotification()

const axiosInstance1 = axios.create({
  baseURL: API_URL_2,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

// State
const activeTab = ref('Nodes')
const isLoading = ref(false)
const countries = ref(0)
const cities = ref(0)
const branches = ref(0)
const offices = ref(0)
const stopsList = ref(0)
const cityLinks = ref(0)
const servicePoints = ref(0)
const routesList = ref(0)
const completeRoute = ref(0)
const totalNodes = ref(0)

// Update reportTypes to include Nodes
const reportTypes = computed(() => [
  { name: 'Nodes', count: totalNodes.value, class: "bi bi-diagram-3 me-1 fs-5" },
  { name: 'Countries', count: countries.value, class: "bi bi-globe-europe-africa me-1 fs-5" },
  { name: 'Cities', count: cities.value, class: "bi bi-textarea me-1 fs-5" },
  { name: 'Branches', count: branches.value, class: "bi bi-buildings me-1 fs-5" },
  { name: 'Offices', count: offices.value, class: "bi bi-building-fill me-1 fs-5" },   
  { name: 'Stops', count: stopsList.value, class: "bi bi-geo-alt me-1 fs-5" },
  { name: 'Service Points', count: servicePoints.value, class: "bi bi-geo me-1 fs-5" },
  { name: 'City Links', count: cityLinks.value, class: "bi bi-link me-1 fs-5" },
  { name: 'Trips', count: routesList.value, class: "bi bi-map me-1 fs-5" },
  { name: 'Routes', count: completeRoute.value, class: "bi bi-signpost me-1 fs-5" },    
])

// Methods
function toggleType(name) {
  activeTab.value = name
  sessionStorage.setItem('ACTIVE_TAB', name)
}

async function fetchTotalData() {
  isLoading.value = true
  try {
    // Fetch legacy counts
    const res = await axiosInstance1.get('/locations/total')
    countries.value = res.data.countries
    cities.value = res.data.cities
    cityLinks.value = res.data.city_link
    stopsList.value = res.data.stops
    offices.value = res.data.offices
    branches.value = res.data.branches     
    routesList.value = res.data.routes
    completeRoute.value = res.data.completeRoutes
    servicePoints.value = res.data.service_points || 0
    
    // Fetch total nodes count
    const nodesRes = await axiosInstance1.get('locations-master/index')
    const countNodes = (nodes) => {
      let count = 0
      nodes.forEach(node => {
        count++
        if (node.children_recursive?.length) {
          count += countNodes(node.children_recursive)
        }
      })
      return count
    }
    totalNodes.value = countNodes(nodesRes.data.data || [])
    
  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('error', 'Failed to load location data')
  } finally {
    isLoading.value = false
  }
}

function getActiveTab() {
  const savedTab = sessionStorage.getItem('ACTIVE_TAB')
  if (savedTab) {
    activeTab.value = savedTab
  }
}

// Lifecycle
onMounted(() => {
  appOption.appSidebarMinified = true
  appOption.appContentFullHeight = true
  appOption.appContentClass = 'p-0'
  
  fetchTotalData()
  getActiveTab()
})

onBeforeUnmount(() => {
  appOption.appContentFullHeight = false
  appOption.appSidebarMinified = false
  appOption.appContentClass = ''
  sessionStorage.removeItem('ACTIVE_TAB')
})
</script>