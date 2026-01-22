<template>
  <div>
    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item"><router-link to="/abs/location">SETTINGS</router-link></li>
        <li class="breadcrumb-item"><router-link to="/abs/location">LOCATION MASTER</router-link></li>
        <li class="breadcrumb-item"><router-link to="/abs/location">ROUTE PLANNING</router-link></li>
        <li class="breadcrumb-item active">CREATE</li>
      </ol>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary text-dark" @click="goBack">
          <i class="fa fa-arrow-left"></i> Back 
        </button>  
        <button class="btn btn-info text-dark" :disabled="isLoading" @click="addRouteRow">
          <i class="fa fa-plus me-1"></i> Add Route Row
        </button>      
        <button class="btn btn-success text-dark" :disabled="isLoading" @click="saveRoute()">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
          <i class="fa fa-save me-1"></i> Save Route(s)
        </button>
      </div>
    </div>

    <!-- ROUTES ACCORDION -->
    <div v-if="inCompleteCityLinks == null " class="accordion" id="routesAccordion">
      <div
        v-for="(route, routeIndex) in multipleRoutes"
        :key="routeIndex"
        class="accordion-item mb-3 border"
      >
        <!-- ACCORDION HEADER -->
        <h2 class="accordion-header">
          <button
            class="accordion-button fw-semibold"
            :class="{ collapsed: routeIndex !== activeRouteIndex }"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="'#routeCollapse' + routeIndex"
            @click="activeRouteIndex = routeIndex"
          >
            <div class="d-flex align-items-center w-100">
              <span class="route-badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                {{ routeIndex + 1 }}
              </span>
              
              <div class="flex-grow-1">
                <div class="d-flex align-items-center">
                  <i class="fa fa-route text-primary me-2"></i>
                  <span v-if="route.code" class="fw-bold">{{ route.code }}</span>
                  <span v-else class="text-muted">New Route {{ routeIndex + 1 }}</span>
                  
                  <span v-if="route.city_link_id" class="ms-2 text-muted small">
                    ({{ route.city_link_id.original_city }} → {{ route.city_link_id.destination_city }})
                  </span>
                </div>
                
                <div class="small text-muted mt-1">
                  <span v-if="route.cities?.length" class="badge bg-info me-2">
                    {{ route.cities.length }} cities
                  </span>
                  <span v-if="route.subroutes?.length" class="badge bg-success">
                    {{ route.subroutes.length }} subroutes
                  </span>
                </div>
              </div>
              
              <button
                v-if="multipleRoutes.length > 1"
                class="btn btn-sm btn-outline-danger ms-2"
                type="button"
                @click.stop="removeRoute(routeIndex)"
                title="Remove route"
              >
                <i class="fa fa-trash"></i>
              </button>
            </div>
          </button>
        </h2>

        <!-- ACCORDION BODY -->
        <div
          :id="'routeCollapse' + routeIndex"
          class="accordion-collapse collapse"
          :class="{ show: routeIndex === activeRouteIndex }"
          data-bs-parent="#routesAccordion"
        >
          <div class="accordion-body p-4">
            <div class="row g-4">
              
              <!-- LEFT COLUMN - ROUTE SETUP -->
              <div class="col-lg-5">
                <div class="sticky-top" style="top: 20px;">
                  
                  <!-- CITY LINK SELECTION -->
                  <div class="card shadow-sm mb-4">
                    <div class="card-header bg-light">
                      <h6 class="mb-0 d-flex align-items-center">
                        <i class="fa fa-link text-primary me-2"></i>
                        City Link Selection
                      </h6>
                    </div>
                    <div class="card-body">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">City Link</label>
                        <multiselect
                          v-model="route.city_link_id"
                          :options="filteredLinks"
                          label="display_name"
                          track-by="id"
                          placeholder="Select City Link (Origin → Destination)"
                          :loading="isLoadingCityLink"
                          @update:modelValue="(value) => onCityLinkChange(value, route)"
                          :class="{ 'is-invalid': !route.city_link_id && routeSubmitted }"
                        >
                          <template #option="{ option }">
                            <div class="d-flex align-items-center">
                              <i class="fa fa-exchange-alt  me-2"></i>
                              <div>
                                <strong>{{ option.original_city }} → {{ option.destination_city }}</strong>
                                <div class="small">Code: {{ option.code }}</div>
                              </div>
                            </div>
                          </template>
                          <template #noResult>
                            <div class="text-center py-3 text-muted">
                              <i class="fa fa-search fa-lg mb-2"></i>
                              <p class="mb-0">No city links found</p>
                            </div>
                          </template>
                        </multiselect>
                        <div v-if="!route.city_link_id && routeSubmitted" class="invalid-feedback d-block">
                          Please select a city link
                        </div>
                      </div>
                      
                      <!-- AUTO-GENERATED ROUTE CODE -->
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Route Code</label>
                        <input
                          v-model="route.code"
                          class="form-control"                          
                          placeholder="Auto-generated from city link"
                        />
                        <small class="text-muted mt-1 d-block">
                          <i class="fa fa-info-circle me-1"></i>
                          Auto-generated from first 3 letters of origin & destination
                        </small>
                      </div>
                    </div>
                  </div>                 
                 
                  
                  <!-- AVAILABLE CITIES GRID -->
                  <div class="card shadow-sm">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                      <h6 class="mb-0">
                        <i class="fa fa-city text-primary me-2"></i>
                        Available Cities
                      </h6>
                      <span class="badge bg-primary">{{ allCities.length }} total</span>
                    </div>
                    <div class="card-body">
                      <!-- SEARCH BAR -->
                      <div class="mb-3">
                        <div class="input-group">
                          <span class="input-group-text">
                            <i class="fa fa-search"></i>
                          </span>
                          <input 
                            type="text" 
                            class="form-control" 
                            placeholder="Search cities..." 
                            v-model="citySearch[routeIndex]"
                            @input="filterCities(routeIndex)"
                          >
                          <button 
                            class="btn btn-outline-secondary" 
                            type="button"
                            @click="citySearch[routeIndex] = ''; filterCities(routeIndex)"
                          >
                            <i class="fa fa-times"></i>
                          </button>
                        </div>
                      </div>
                      
                      <!-- CITIES GRID -->
                      <div class="cities-grid">
                        <div 
                          v-for="city in filteredCities[routeIndex]" 
                          :key="city.id"
                          class="city-chip"
                          :class="{ 'selected': isCitySelected(city.id, route.cities) }"
                          @click="toggleCitySelection(city, route)"
                        >
                          <div class="city-chip-content">
                            <i class="fa fa-city me-2"></i>
                            <span class="city-name">{{ city.name }}</span>
                            <span class="city-badge" v-if="isCitySelected(city.id, route.cities)">
                              {{ getCityPosition(city.id, route.cities) }}
                            </span>
                           </div>                        
                        </div>
                      </div>
                      
                     
                      
                      <!-- INFO BOX -->
                      <div class="alert alert-info mt-3 mb-0">
                        <div class="d-flex">
                          <i class="fa fa-info-circle me-2 mt-1"></i>
                          <div>
                            <small>
                              <strong>Instructions:</strong>
                              <ul class="mb-0 ps-3">
                                <li>Click on cities to select/deselect</li>
                                <li>Selected cities will show position numbers</li>
                                <li>Drag cities in the right panel to rearrange order</li>
                                <li>Minimum 2 cities required</li>
                              </ul>
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- RIGHT COLUMN - DRAGGABLE & PREVIEW -->
              <div class="col-lg-7">
                 <!-- VIA POINTS SELECTION -->
                  <div class="card shadow-sm mb-4">
                    <div class="card-header bg-light">
                      <h6 class="mb-0 d-flex align-items-center">
                        <i class="fa fa-map-marker-alt text-warning me-2"></i>
                        Via Points 
                      </h6>
                    </div>
                    <div class="card-body">
                      <multiselect
                        v-model="route.via"
                        :options="allStops"
                        :multiple="true"
                        label="name"
                        track-by="id"
                        placeholder="Select intermediate stops"
                      >
                        <template #option="{ option }">
                          <div class="d-flex align-items-center">
                            <i class="fa fa-dot-circle text-warning me-2"></i>
                            {{ option.name }}
                          </div>
                        </template>
                      </multiselect>
                      <div class="mt-2">
                        <small class="text-muted">
                          <i class="fa fa-info-circle me-1"></i>
                          Select intermediate via point between origin and destination
                        </small>
                      </div>
                    </div>
                  </div>
                
                <!-- DRAGGABLE SECTION - With Zoom Animation -->
                <transition name="zoom-section" @after-enter="onDraggableEnter" @after-leave="onDraggableLeave">
                  <div 
                    v-if="showDraggableSection[routeIndex]"
                    class="card shadow-sm mb-4 draggable-section"
                    :class="{ 'has-cities': route.cities?.length > 0 }"
                  >
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                      <h6 class="mb-0 d-flex align-items-center">
                        <i class="fa fa-arrows-alt text-success me-2"></i>
                        Arrange City Order
                        <span class="badge bg-success ms-2">{{ route.cities?.length || 0 }}</span>
                      </h6>
                      <div>
                        <small class="text-muted me-2">
                          <i class="fa fa-hand-pointer me-1"></i>
                          Drag to reorder
                        </small>
                        <button 
                          class="btn btn-sm btn-outline-secondary"
                          @click="toggleDraggableSection(routeIndex)"
                          title="Collapse"
                        >
                          <i class="fa fa-minus"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div class="card-body">
                      <!-- EMPTY STATE -->
                      <div 
                        v-if="!route.cities || route.cities.length === 0"
                        class="text-center py-5"
                      >
                        <div class="empty-drag-state">
                          <i class="fa fa-arrows-alt fa-3x text-muted mb-3 opacity-25"></i>
                          <h5 class="text-muted">No Cities Selected</h5>
                          <p class="text-muted mb-3">Select cities from the left panel to arrange their order</p>
                          <button 
                            class="btn btn-outline-primary"
                            @click="selectOriginDestinationCities(route)"
                            :disabled="!route.city_link_id"
                          >
                            <i class="fa fa-magic me-1"></i>
                            Auto-select origin & destination
                          </button>
                        </div>
                      </div>
                      
                      <!-- DRAGGABLE LIST -->
                      <draggable 
                        v-else
                        v-model="route.cities"
                        item-key="id"
                        class="drag-list"
                        handle=".drag-handle"
                        @change="() => onCitiesChange(route.cities, route)"
                        ghost-class="drag-ghost"
                        chosen-class="drag-chosen"
                      >
                        <template #item="{ element: city, index }">
                          <div class="drag-city-item">
                            <!-- DRAG HANDLE -->
                            <div class="drag-handle">
                              <i class="fa fa-bars"></i>
                            </div>
                            
                            <!-- POSITION INDICATOR -->
                            <div class="city-position">
                              <div class="position-number">
                                {{ index + 1 }}
                              </div>
                              <div class="position-line" v-if="index < route.cities.length - 1"></div>
                            </div>
                            
                            <!-- CITY DETAILS -->
                            <div class="city-details">
                              <div class="city-main-info">
                                <div class="city-icon" :class="getCityTypeClass(index, route.cities.length)">
                                  <i class="fa" :class="getCityTypeIcon(index, route.cities.length)"></i>
                                </div>
                                <div>
                                  <h6 class="mb-0">{{ city.name }}</h6>
                                  <small class="text-muted">                                    
                                    <span v-if="city.code"> • Code: {{ city.code }}</span>
                                  </small>
                                </div>
                              </div>
                              
                              <!-- ACTIONS -->
                              <div class="city-actions">
                                <button 
                                  class="btn btn-sm btn-outline-danger"
                                  @click="removeCityFromRoute(routeIndex, city.id)"
                                  title="Remove from route"
                                >
                                  <i class="fa fa-times"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </template>
                      </draggable>                     
                    
                    </div>
                  </div>
                </transition>
                
                <!-- PREVIEW SECTION - With Zoom Animation -->
                <transition name="zoom-section" @after-enter="onPreviewEnter" @after-leave="onPreviewLeave">
                  <div 
                    v-if="showPreview[routeIndex]"
                    class="card shadow-sm preview-section"
                  >
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                      <h6 class="mb-0 d-flex align-items-center">
                        <i class="fa fa-random text-info me-2"></i>
                        Generated Subroutes Preview
                        <span class="badge bg-info ms-2">{{ route.subroutes?.length || 0 }}</span>
                      </h6>
                      <button 
                        class="btn btn-sm btn-outline-secondary"
                        @click="togglePreview(routeIndex)"
                      >
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                    
                    <div class="card-body">
                      <!-- PREVIEW CONTENT -->
                      <div class="preview-content">                       
                                              
                        <!-- SUBROUTES LIST -->
                        <div class="subroutes-container">
                          <h6 class="mb-3 d-flex align-items-center">
                            <i class="fa fa-list text-success me-2"></i>
                            All Generated Subroutes
                            <span class="badge bg-success ms-2">{{ route.subroutes?.length || 0 }}</span>
                          </h6>
                          
                          <div class="subroutes-list">
                            <div 
                              v-for="(subroute, idx) in route.subroutes"
                              :key="idx"
                              class="subroute-item"
                              :class="{ 'active': isActiveSubroute(routeIndex, idx) }"
                            >
                              <div class="subroute-header">
                                <div class="subroute-number">
                                  <span class="badge bg-primary">#{{ idx + 1 }}</span>
                                </div>
                                <div class="subroute-path">
                                  <span class="from-city">{{ subroute.from.name }}</span>
                                  <i class="fa fa-arrow-right mx-2 text-success"></i>
                                  <span class="to-city">{{ subroute.to.name }}</span>
                                </div>
                                <div class="subroute-info">
                                  <span class="badge bg-light text-dark">
                                    <i class="fa fa-route me-1"></i>
                                    Subroute {{ idx + 1 }}
                                  </span>
                                </div>
                              </div>
                              
                              <div class="subroute-details">
                                <div class="row g-2">
                                  <div class="col-md-6">
                                    <small class="text-muted">
                                      <i class="fa fa-map-pin me-1"></i>
                                      From: <strong>{{ subroute.from.name }}</strong>
                                    </small>
                                  </div>
                                  <div class="col-md-6">
                                    <small class="text-muted">
                                      <i class="fa fa-map-pin me-1"></i>
                                      To: <strong>{{ subroute.to.name }}</strong>
                                    </small>
                                  </div>                                 
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <!-- PREVIEW SUMMARY -->
                        <div class="preview-summary mt-4">
                          <div class="alert alert-success">
                            <div class="d-flex align-items-center">
                              <i class="fa fa-check-circle fa-lg me-3"></i>
                              <div>
                                <h6 class="mb-1">Route Configuration Complete!</h6>
                                <small>
                                  You have successfully configured a route with 
                                  <strong>{{ route.cities.length }} cities</strong> and 
                                  <strong>{{ route.subroutes?.length || 0 }} subroutes</strong>.
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- SHOW DRAGGABLE SECTION BUTTON (when collapsed) -->
                <div 
                  v-if="!showDraggableSection[routeIndex]" 
                  class="text-center mb-4"
                >
                  <button 
                    class="btn btn-outline-success btn-lg"
                    @click="toggleDraggableSection(routeIndex)"
                  >
                    <i class="fa fa-arrows-alt me-2"></i>
                    Show City Ordering Panel
                    <small class="d-block mt-1 text-muted">Click to arrange selected cities</small>
                  </button>
                </div>
                
                <!-- SHOW PREVIEW BUTTON (when preview is hidden) -->
                <div 
                  v-if="!showPreview[routeIndex] && route.cities?.length >= 2" 
                  class="text-center"
                >
                  <button 
                    class="btn btn-outline-info btn-lg"
                    @click="togglePreview(routeIndex)"
                  >
                    <i class="fa fa-eye me-2"></i>
                    Show Subroutes Preview
                    <small class="d-block mt-1 text-muted">Click to preview all generated subroutes</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
     <div v-else>
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
          <tr v-for="(route, index) in inCompleteCityLinks.city_links
" :key="route.id">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import axios from 'axios'
import { useNotification } from '@/composables/notification'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { showAlert } = useNotification()

// State
const multipleRoutes = ref([])
const activeRouteIndex = ref(0)
const citySearch = ref([])
const filteredCities = ref([])
const showDraggableSection = ref([])
const showPreview = ref([])
const isAnimating = ref([])
const animationSpeed = ref([])
const animationDuration = ref([])
const animationProgress = ref([])
const animationInterval = ref([])
const isLoading = ref(false)
const cityLinks = ref([])
const allCities = ref([])
const allStops = ref([])
const isSaveCityLinks = ref(false);
const inCompleteCityLinks = ref(null);
const isLoadingCityLink = ref(false)
const routeSubmitted = ref(false)

const axiosInstance = axios.create({
  baseURL: API_URL_2,
  headers: {
    'Content-Type': 'application/json',
    Authorization: authStore.token ? `Bearer ${authStore.token}` : ''
  }
})

// Initialize
const init = () => {
  multipleRoutes.value = [{
    id: null,
    city_link_id: "",
    code: "",
    via: [],
    is_active: 1,
    cities: [],
    subroutes: []
  }]
  
  citySearch.value = ['']
  filteredCities.value = [[]]
  showDraggableSection.value = [true] // Show by default
  showPreview.value = [false] // Hide by default
  isAnimating.value = [false]
  animationSpeed.value = [5] // Default speed 5/10
  animationDuration.value = [2000] // Default 2 seconds
  animationProgress.value = [0]
  animationInterval.value = [null]
}

// Add new route
const addRouteRow = () => {
  const newRoute = {
    id: null,
    city_link_id: "",
    code: "",
    via: [],
    is_active: 1,
    cities: [],
    subroutes: []
  }
  
  multipleRoutes.value.unshift(newRoute)
  citySearch.value.unshift('')
  filteredCities.value.unshift([...allCities.value])
  showDraggableSection.value.unshift(true)
  showPreview.value.unshift(false)
  isAnimating.value.unshift(false)
  animationSpeed.value.unshift(5)
  animationDuration.value.unshift(2000)
  animationProgress.value.unshift(0)
  animationInterval.value.unshift(null)
  activeRouteIndex.value = 0
  
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// Remove route
const removeRoute = (index) => {
  if (multipleRoutes.value.length > 1) {
    // Stop animation if running
    if (animationInterval.value[index]) {
      clearInterval(animationInterval.value[index])
    }
    
    multipleRoutes.value.splice(index, 1)
    citySearch.value.splice(index, 1)
    filteredCities.value.splice(index, 1)
    showDraggableSection.value.splice(index, 1)
    showPreview.value.splice(index, 1)
    isAnimating.value.splice(index, 1)
    animationSpeed.value.splice(index, 1)
    animationDuration.value.splice(index, 1)
    animationProgress.value.splice(index, 1)
    animationInterval.value.splice(index, 1)
    
    if (activeRouteIndex.value >= index) {
      activeRouteIndex.value = Math.max(0, activeRouteIndex.value - 1)
    }
  }
}

// Toggle draggable section
const toggleDraggableSection = (routeIndex) => {
  showDraggableSection.value[routeIndex] = !showDraggableSection.value[routeIndex]
}

const submitUpdatedCityLinks = async()  => {        
      isSaveCityLinks.value = true;
      try {      
        const payload = inCompleteCityLinks.value.city_links.map(route => ({
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
         goBack();              
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

// Toggle preview section
const togglePreview = (routeIndex) => {
  showPreview.value[routeIndex] = !showPreview.value[routeIndex]
  
  if (showPreview.value[routeIndex]) {
    // Reset animation when showing preview
    resetAnimation(routeIndex)
  } else {
    // Stop animation when hiding preview
    pauseAnimation(routeIndex)
  }
}

// Animation callbacks
const onDraggableEnter = (el) => {
  console.log('Draggable section zoomed in')
}

const onDraggableLeave = (el) => {
  console.log('Draggable section zoomed out')
}

const onPreviewEnter = (el) => {
  console.log('Preview section zoomed in')
}

const onPreviewLeave = (el) => {
  console.log('Preview section zoomed out')
}

// City selection helpers
const isCitySelected = (cityId, selectedCities) => {
  return selectedCities?.some(c => c.id === cityId) || false
}

const getCityPosition = (cityId, selectedCities) => {
  if (!selectedCities) return null
  const index = selectedCities.findIndex(city => city.id === cityId)
  return index !== -1 ? index + 1 : null
}

const toggleCitySelection = (city, route) => {
  if (!route) return
  
  const index = route.cities?.findIndex(c => c.id === city.id) ?? -1
  
  if (index !== -1) {
    // Remove city
    route.cities.splice(index, 1)
  } else {
    // Add city
    if (!route.cities) route.cities = []
    route.cities.push(city)
  }
  
  onCitiesChange(route.cities, route)
  
  // Auto-show draggable section when cities are selected
  const routeIndex = multipleRoutes.value.indexOf(route)
  if (routeIndex !== -1 && route.cities.length > 0 && !showDraggableSection.value[routeIndex]) {
    showDraggableSection.value[routeIndex] = true
  }
}

const filterCities = (routeIndex) => {
  if (!citySearch.value[routeIndex]) {
    filteredCities.value[routeIndex] = [...allCities.value]
    return
  }
  
  const searchTerm = citySearch.value[routeIndex].toLowerCase()
  filteredCities.value[routeIndex] = allCities.value.filter(city => 
    city.name.toLowerCase().includes(searchTerm) ||
    (city.code && city.code.toLowerCase().includes(searchTerm)) ||
    city.id.toString().includes(searchTerm)
  )
}

// Computed
const filteredLinks = computed(() => {
  const selectedIds = multipleRoutes.value
    .map(r => (r.city_link_id?.id ?? r.city_link_id))
    .filter(id => id != null)
  
  return cityLinks.value.filter(link => !selectedIds.includes(link.id))
})

// City link methods
const generateRouteCode = (cityLink) => {
  if (!cityLink) return ''
  
  let originalCity = ''
  let destinationCity = ''
  
  if (typeof cityLink === 'object' && cityLink !== null) {
    originalCity = cityLink.original_city || ''
    destinationCity = cityLink.destination_city || ''
  } else if (typeof cityLink === 'number') {
    const link = cityLinks.value.find(l => l.id === cityLink)
    if (link) {
      originalCity = link.original_city || ''
      destinationCity = link.destination_city || ''
    }
  }
  
  if (!originalCity || !destinationCity) return ''
  
  const originalCode = originalCity.substring(0, 3).toUpperCase()
  const destinationCode = destinationCity.substring(0, 3).toUpperCase()
  
  return `${originalCode}-${destinationCode}`
}

const onCityLinkChange = (cityLink, route) => {
  if (cityLink && route) {
    const generatedCode = generateRouteCode(cityLink)
    if (generatedCode) {
      route.code = generatedCode
    }
  } else if (!cityLink && route) {
    route.code = ''
  }
}

// City selection methods
const selectOriginDestinationCities = (route) => {
  if (!route.city_link_id) {
    showAlert('warning', 'Please select a city link first')
    return
  }
  
  const cityLink = route.city_link_id
  
  // Find origin and destination cities from allCities
  const originCity = allCities.value.find(c => 
    c.id === cityLink.original_city_id || 
    c.name.toLowerCase() === cityLink.original_city.toLowerCase()
  )
  
  const destinationCity = allCities.value.find(c => 
    c.id === cityLink.destination_city_id || 
    c.name.toLowerCase() === cityLink.destination_city.toLowerCase()
  )
  
  // Add to cities if found
  const newCities = [...route.cities]
  
  if (originCity && !newCities.some(c => c.id === originCity.id)) {
    newCities.unshift(originCity)
  }
  
  if (destinationCity && !newCities.some(c => c.id === destinationCity.id)) {
    newCities.push(destinationCity)
  }
  
  if (originCity || destinationCity) {
    route.cities = newCities
    onCitiesChange(route.cities, route)
    
    // Auto-show draggable section
    const routeIndex = multipleRoutes.value.indexOf(route)
    if (routeIndex !== -1 && !showDraggableSection.value[routeIndex]) {
      showDraggableSection.value[routeIndex] = true
    }
    
    showAlert('success', `Added ${originCity ? 'origin' : ''}${originCity && destinationCity ? ' and ' : ''}${destinationCity ? 'destination' : ''} city`)
  } else {
    showAlert('warning', 'Could not find origin/destination cities in available cities list')
  }
}

const clearCitiesSelection = (route) => {
  route.cities = []
  onCitiesChange(route.cities, route)
}

const removeCityFromRoute = (routeIndex, cityId) => {
  const route = multipleRoutes.value[routeIndex]
  if (route && route.cities) {
    const index = route.cities.findIndex(c => c.id === cityId)
    if (index !== -1) {
      route.cities.splice(index, 1)
      onCitiesChange(route.cities, route)
    }
  }
}

// Subroutes generation
const generateAllSubroutes = (citiesArray) => {
  if (!citiesArray || citiesArray.length < 2) return []
  
  const validCities = citiesArray.filter(c => c && c.id)
  if (validCities.length < 2) return []
  
  const subroutes = []
  
  // Generate all combinations: 1→2, 1→3, 1→4, 2→3, 2→4, 3→4, etc.
  for (let i = 0; i < validCities.length; i++) {
    for (let j = i + 1; j < validCities.length; j++) {
      subroutes.push({
        from: validCities[i],
        to: validCities[j],
        index: subroutes.length + 1
      })
    }
  }
  
  return subroutes
}

const onCitiesChange = (cities, route) => {
  if (!route) return
  
  // Limit to 40 cities for performance
  if (cities.length > 40) {
    showAlert('warning', 'Maximum 40 cities allowed. The first 40 will be used.')
    route.cities = cities.slice(0, 40)
  }
  
  // Generate subroutes
  route.subroutes = generateAllSubroutes(route.cities)
}

// Animation methods
const startAnimation = (routeIndex) => {
  if (multipleRoutes.value[routeIndex].cities.length < 2) return
  
  isAnimating.value[routeIndex] = true
  animationProgress.value[routeIndex] = 0
  
  // Calculate step based on speed
  const step = 0.5 // % per interval
  const interval = animationDuration.value[routeIndex] / (100 / step)
  
  if (animationInterval.value[routeIndex]) {
    clearInterval(animationInterval.value[routeIndex])
  }
  
  animationInterval.value[routeIndex] = setInterval(() => {
    if (!isAnimating.value[routeIndex]) return
    
    animationProgress.value[routeIndex] += step
    
    if (animationProgress.value[routeIndex] >= 100) {
      animationProgress.value[routeIndex] = 0
    }
  }, interval)
}

const pauseAnimation = (routeIndex) => {
  isAnimating.value[routeIndex] = false
  
  if (animationInterval.value[routeIndex]) {
    clearInterval(animationInterval.value[routeIndex])
    animationInterval.value[routeIndex] = null
  }
}

const resetAnimation = (routeIndex) => {
  pauseAnimation(routeIndex)
  animationProgress.value[routeIndex] = 0
}

const updateAnimationSpeed = (routeIndex) => {
  // Convert speed 1-10 to duration 4000-500ms (faster = lower duration)
  animationDuration.value[routeIndex] = 4500 - (animationSpeed.value[routeIndex] * 400)
  
  // Restart animation if it was running
  if (isAnimating.value[routeIndex]) {
    pauseAnimation(routeIndex)
    startAnimation(routeIndex)
  }
}

const isActiveSubroute = (routeIndex, subrouteIndex) => {
  if (!isAnimating.value[routeIndex]) return false
  
  const route = multipleRoutes.value[routeIndex]
  const totalSubroutes = route.subroutes?.length || 0
  if (totalSubroutes === 0) return false
  
  // Calculate which subroute should be active based on animation progress
  const progress = animationProgress.value[routeIndex]
  const subrouteWidth = 100 / totalSubroutes
  const activeSubroute = Math.floor(progress / subrouteWidth)
  
  return activeSubroute === subrouteIndex
}

// Helper methods
const getCityTypeClass = (index, total) => {
  if (index === 0) return 'city-type-origin'
  if (index === total - 1) return 'city-type-destination'
  return 'city-type-intermediate'
}

const getCityTypeIcon = (index, total) => {
  if (index === 0) return 'fa-flag-checkered text-success'
  if (index === total - 1) return 'fa-flag text-danger'
  return 'fa-circle text-primary'
}

const getNodeTypeClass = (index, total) => {
  if (index === 0) return 'node-origin'
  if (index === total - 1) return 'node-destination'
  return 'node-intermediate'
}

// Save routes
const saveRoute = async () => {
  routeSubmitted.value = true
  isLoading.value = true
  
  try {
    // Validate all routes
    for (const [index, route] of multipleRoutes.value.entries()) {
      if (!route.city_link_id) {
        showAlert('error', `Route ${index + 1}: Please select a city link`)
        isLoading.value = false
        return
      }
      
      if (!route.code) {
        showAlert('error', `Route ${index + 1}: Route code is required`)
        isLoading.value = false
        return
      }
      
      const validCities = route.cities?.filter(c => c && c.id) || []
      
      if (validCities.length < 2) {
        showAlert('error', `Route ${index + 1}: Select at least 2 cities`)
        isLoading.value = false
        return
      }
      
      if (!route.subroutes || route.subroutes.length === 0) {
        showAlert('error', `Route ${index + 1}: No subroutes generated`)
        isLoading.value = false
        return
      }
    }
    
    // Build payload
    const payload = {
      routes: multipleRoutes.value.map(route => {
        const validCities = route.cities.filter(c => c && c.id)
        
        return {
          id: route.id,
          city_link_id: route.city_link_id.id,
          name: route.city_link_id?.name || `${route.city_link_id?.original_city} - ${route.city_link_id?.destination_city}`,
          code: route.code,
          is_active: route.is_active,
          via: route.via?.map(v => v.id) || [],
          sub_routes: route.subroutes.map(s => ({
            from_city_id: s.from.id,
            to_city_id: s.to.id,
          }))
        }
      })
    }
    
    // API Call
    const res = await axiosInstance.post('locations/routes', payload)
     console.log(res.data);     
   
     if (res.data.status === 'success') {
      showAlert('success', `${multipleRoutes.value.length} route(s) saved successfully!`)
      goBack()
    }
      if (res.data.status === 'partial') {        
        showAlert('info',res.data?.message)
        inCompleteCityLinks.value = res.data;             
    }  
    
  } catch (error) {
    console.error('Save Error:', error)
    showAlert('error', error.response?.data?.message || 'Failed to save routes')
  } finally {
    isLoading.value = false
  }
}

// Fetch data - USING YOUR ENDPOINTS
const fetchCityLinks = async () => {
  isLoadingCityLink.value = true
  try {
    const response = await axiosInstance.get('locations/city-links')
    cityLinks.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      id: d.id,
      code: d.code,
      name: d.name,
      original_city: d.original_city,
      destination_city: d.destination_city,
      original_city_id: d.original_city_id,
      destination_city_id: d.destination_city_id,
      display_name: `${d.original_city} → ${d.destination_city}`
    }))
  } catch (error) {
    console.error('Failed to fetch city links:', error)
    showAlert('error', 'Failed to load city links')
  } finally {
    isLoadingCityLink.value = false
  }
}

const fetchFormData = async () => {
  try {
    // Fetch cities from your endpoint
    const response = await axiosInstance.get('locations/form-data')
    allCities.value = response.data.data.cities || []
    
    // Initialize filtered cities
    filteredCities.value = multipleRoutes.value.map(() => [...allCities.value])
    
    // Fetch stops from your endpoint
    try {
      const stopRes = await axiosInstance.get('locations/stops')
      allStops.value = stopRes.data.data || []
    } catch (stopError) {
      console.error('Failed to fetch stops:', stopError)
    }
  } catch (error) {
    console.error('Form Data Error:', error)
    showAlert('error', 'Failed to load form data')
  }
}

const goBack = () => router.push('/abs/location')

const setActiveTab = (tab) => {
  sessionStorage.setItem('ACTIVE_TAB', tab)
}

// Lifecycle
onMounted(() => {
  init()
  fetchCityLinks()
  fetchFormData()
  setActiveTab('Route Planning')
})
</script>

<style scoped>
/* Main Styles */
.route-badge {
  width: 30px;
  height: 30px;
  font-size: 0.9rem;
  font-weight: bold;
}

/* Cities Grid */
.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.city-chip {
  padding: 12px;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
}

.city-chip:hover {
  border-color: #0d6efd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.city-chip.selected {
  border-color: #20c997;
  background: rgba(32, 201, 151, 0.1);
}

.city-chip-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}

.city-name {
  flex-grow: 1;
  font-weight: 500;
  font-size: 0.95rem;
}

.city-badge {
  background: #0d6efd;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  margin-left: 8px;
}

.city-code {
  font-size: 0.75rem;
  color: #6c757d;
  text-align: center;
  padding-top: 5px;
  border-top: 1px dashed #dee2e6;
}

/* Zoom Animation for Sections */
.zoom-section-enter-active {
  animation: zoomInSection 0.4s ease-out;
}

.zoom-section-leave-active {
  animation: zoomOutSection 0.3s ease-in;
}

@keyframes zoomInSection {
  from {
    opacity: 0;
    transform: scale(0.95);
    max-height: 0;
    margin-bottom: 0;
  }
  to {
    opacity: 1;
    transform: scale(1);
    max-height: 1000px;
    margin-bottom: 1.5rem;
  }
}

@keyframes zoomOutSection {
  from {
    opacity: 1;
    transform: scale(1);
    max-height: 1000px;
    margin-bottom: 1.5rem;
  }
  to {
    opacity: 0;
    transform: scale(0.95);
    max-height: 0;
    margin-bottom: 0;
  }
}

/* Draggable Section */
.draggable-section {
  transition: all 0.3s ease;
}

.draggable-section.has-cities {
  border-left: 4px solid #20c997;
}

/* Draggable Items */
.drag-list {
  min-height: 100px;
}

.drag-city-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
}

.drag-city-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #20c997;
}

.drag-handle {
  cursor: grab;
  color: #6c757d;
  padding-right: 15px;
  font-size: 1.2rem;
  transition: color 0.3s ease;
}

.drag-city-item:hover .drag-handle {
  color: #0d6efd;
}

.city-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
  position: relative;
}

.position-number {
  background: #0d6efd;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 2;
}

.position-line {
  position: absolute;
  top: 36px;
  width: 2px;
  height: calc(100% + 10px);
  background: linear-gradient(to bottom, #0d6efd, transparent);
  opacity: 0.5;
}

.city-details {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.city-main-info {
  display: flex;
  align-items: center;
}

.city-icon {
  width: 40px;
  height: 40px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 1.2rem;
}

.city-type-origin {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.city-type-destination {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.city-type-intermediate {
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.city-actions button {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.city-actions button:hover {
  opacity: 1;
}

/* Empty States */
.empty-drag-state {
  padding: 40px 20px;
}

.empty-drag-state i {
  font-size: 48px;
}

/* Summary Cards */
.summary-card {
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.summary-icon {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 1.5rem;
}

.summary-value {
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1;
}

.summary-label {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 5px;
}

/* Preview Section */
.preview-section {
  margin-top: 20px;
  border-left: 4px solid #0d6efd;
}

/* Route Visualization */
.visual-route-map {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.route-visualization {
  position: relative;
  height: 120px;
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.route-line {
  position: absolute;
  top: 50%;
  left: 5%;
  right: 5%;
  height: 3px;
  background: linear-gradient(to right, #dee2e6, #adb5bd);
  transform: translateY(-50%);
  border-radius: 3px;
}

.route-node {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.node-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  transition: all 0.3s ease;
}

.node-origin {
  background: #198754;
  border-color: #198754;
  color: white;
}

.node-intermediate {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.node-destination {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.node-number {
  font-weight: bold;
  font-size: 0.9rem;
}

.node-label {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  background: white;
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Animated Bus */
.animated-bus {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  background: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

@keyframes moveBus {
  0% {
    left: 5%;
  }
  100% {
    left: 95%;
  }
}

/* Animation Controls */
.animation-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.speed-control {
  display: flex;
  align-items: center;
}

/* Subroutes List */
.subroutes-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #dee2e6;
}

.subroutes-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.subroutes-list::-webkit-scrollbar {
  width: 6px;
}

.subroutes-list::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.subroutes-list::-webkit-scrollbar-thumb {
  background: #adb5bd;
  border-radius: 3px;
}

.subroute-item {
  padding: 15px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.subroute-item.active {
  border-color: #0d6efd;
  background: rgba(13, 110, 253, 0.05);
  transform: translateX(5px);
}

.subroute-item:hover {
  border-color: #20c997;
  background: white;
}

.subroute-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.subroute-number {
  margin-right: 15px;
}

.subroute-path {
  flex-grow: 1;
  font-size: 1.1rem;
}

.from-city, .to-city {
  font-weight: 500;
}

.subroute-details {
  padding-left: 60px;
}

/* Show Section Buttons */
.btn-lg {
  padding: 15px 30px;
  font-size: 1.1rem;
  border-width: 2px;
}

.btn-lg i {
  font-size: 1.3rem;
}

/* Drag Ghost Effect */
.drag-ghost {
  opacity: 0.5;
  background: #cfe2ff;
}

.drag-chosen {
  background: #d1e7dd;
  border-color: #198754;
}

/* Responsive */
@media (max-width: 768px) {
  .cities-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .drag-city-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .city-position {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .city-details {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .city-main-info {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .city-actions {
    align-self: flex-end;
  }
  
  .animation-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .speed-control {
    margin-top: 10px;
    justify-content: center;
  }
  
  .btn-lg {
    padding: 12px 20px;
    font-size: 1rem;
  }
}
</style>