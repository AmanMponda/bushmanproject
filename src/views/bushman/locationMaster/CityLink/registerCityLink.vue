<template>
    <div class="p-1 bg-white rounded" >
        <div class="d-flex justify-content-center p-2 " >
          <h5 >
            {{ currentCityLink.id ? 'Edit City Link' : 'City Links Registration Form' }}
          </h5>        
        </div>
        <div class=" rounded border p-2" >
          <!-- Single City Link Form (for editing) -->
          <div v-if="!isMultipleMode">
            <div class="row">            
              <div class="col-md-4 mb-3">
                <label>Original City</label>
                <Multiselect v-model="currentCityLink.original_city_id" :options="filteredOriginalCities" label="name"
                  track-by="id" placeholder="Select Original City" @select="onOriginalCityChange" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Destination City</label>
                <Multiselect v-model="currentCityLink.destination_city_id" :options="filteredDestinationCities"
                  label="name" track-by="id" placeholder="Select Destination City" @select="onDestinationCityChange" />
              </div>
                <div class="col-md-4 mb-3">
                <label>Code</label>
                <input v-model="currentCityLink.code" type="text" class="form-control" @input="formatCodeToUppercase" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Distance (km)</label>
                <input v-model="currentCityLink.distance_km" type="number" class="form-control" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Approximated Hours</label>
                <input v-model="currentCityLink.approx_hours" type="number" class="form-control" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Path Geometric</label>
                <input v-model="currentCityLink.path_geometric" type="number" class="form-control" />
              </div>
            </div>
          </div>

          <!-- Multiple City Links Form (for adding new) -->
          <div v-else>
            <table class="table table-bordered align-middle">
                <thead class="table-light">
                  <tr>                    
                    <th style="width: 20%">Original City</th>
                    <th style="width: 20%">Destination City</th>
                    <th style="width: 10%">Code</th>
                    <th style="width: 10%">Distance (km)</th>
                    <th style="width: 10%">Approx Hours</th>
                    <th style="width: 30%">Path Geometric</th>
                    <th v-if="multipleCityLinks.length > 1" style="width: 10%">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(link, index) in multipleCityLinks" :key="index">
                    <!-- ENTRY NUMBER -->
                    <!-- CODE -->                   

                    <!-- ORIGINAL CITY -->
                    <td>
                      <multiselect v-model="link.original_city_id" :options="getFilteredOriginalCities(index)"
                        label="name" track-by="id" placeholder="Select "
                        @select="onMultipleOriginalCityChange(index)" />
                    </td>

                    <!-- DESTINATION CITY -->
                    <td>
                      <multiselect v-model="link.destination_city_id" :options="getFilteredDestinationCities(index)"
                        label="name" track-by="id" placeholder="Select"
                        @select="onMultipleDestinationCityChange(index)" />
                    </td>
                     <td>
                      <input v-model="link.code" type="text" class="form-control"
                        @input="formatMultipleCodeToUppercase(index)" />
                    </td>
                    <!-- DISTANCE -->
                    <td>
                      <input v-model="link.distance_km" type="number" class="form-control" />
                    </td>

                    <!-- APPROX HOURS -->
                    <td>
                      <input v-model="link.approx_hours" type="number" class="form-control" />
                    </td>
                    <td>
                      <input v-model="link.path_geometric" type="text" class="form-control" />
                    </td>

                    <!-- REMOVE BUTTON -->
                    <td v-if="multipleCityLinks.length > 1" class="text-center">
                      <button type="button" class="btn btn-sm btn-danger" @click="removeCityLinkRow(index)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

          </div>

        </div>
        <div class="d-flex justify-content-end gap-2 mt-1" >
          <button class="btn btn-outline-danger" data-bs-dismiss="modal">Cancel</button>
          <button v-if="isMultipleMode" type="button" class="btn btn btn-outline-secondary" @click="addCityLinkRow">
            <i class="fa fa-plus me-1"></i> Add Row
          </button>
          <button class="btn btn-outline-primary" @click="saveCityLink">
            <span v-if="isLoading">
              <div class="spinner-border spinner-border-sm"></div>
            </span>
            <span v-else>
              {{ currentCityLink.id ? 'Update' : 'Save' }}
            </span>

          </button>
        </div>
    </div>  
 </template>

<script setup>
import { ref, onMounted, computed, nextTick, watch , reactive } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';
import { useCityRouteGeometry } from '@/composables/geometricCordinates.js'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";
const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');
const isLoading = ref(false);
const { showAlert } = useNotification();
const authStore = useAuthStore();

const {
  getRouteBetweenCities,
  routeGeometry,
  loading,
  error
} = useCityRouteGeometry()

const props = defineProps({
  isMultipleMode: {
    type: Boolean,
    default: false
  },
  // optional: you can also pass initial data
  initialCityLink: {
    type: Object,
    default: () => ({})
  },
  initialMultipleLinks: {
    type: Array,
    default: () => []
  }
})

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
const isCreationMode = ref(false);

// UI state for unified header actions
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

const onAddClick = async () => {
  switch (activeTab.value) {
    case 'routes':
      if (routeSubTab.value === 'routes') await openRouteModal();
      else await openSubRouteModal();
      break;
    case 'citylink':
      await openCityLinkModal();
      break;
    case 'stops':
      await openStopModal();
      break;
  }
};

// Quick Add City state
const quickCity = ref({ name: '', status: 'Active' });
const quickCityModal = ref(null);

const formatQuickCityNameToUppercase = (event) => {
  const value = event.target.value;
  quickCity.value.name = value.toUpperCase();
};





const fetchFormData = async () => {
  if (formDataLoaded.value && cities.value.length > 0) return; // Skip if already loaded

  try {
    const response = await axiosInstance.get('/locations/cities?');
    //// Debug log

    const formData = response.data?.data ?? response.data ?? {};
    const normalizedCities = Array.isArray(formData)
      ? formData
      : (formData.cities || formData.locations || []);

    serviceClasses.value = formData.service_classes || [];
    originalTerminals.value = formData.original_terminals || [];
    destinationTerminals.value = formData.destination_terminals || [];
    cities.value = normalizedCities;

    //// Debug log
    formDataLoaded.value = true;

  } catch (error) {
    console.error('Form Data Error:', error); // Debug log
    showAlert('error', 'Failed to fetch form data');
  }
};


const isLoadingCityLink = ref(false);
const cityLinks = ref([]);
const cityLinkModal = ref(null);
const currentCityLink = ref({
  id: null,
  code: "",
  original_city_id: "",
  destination_city_id: "",
  distance_km: "",
  approx_hours: ""
});
// Multiple city links functionality
const multipleCityLinks = ref([]);
const isMultipleMode = ref(false);
const citylinkColumns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'original_city', label: 'Origina City', visible: true, sortable: false },
  { key: 'destination_city', label: 'Destination City', visible: true, sortable: false },
  { key: 'distance_km', label: 'Distance', visible: true, sortable: false },
  { key: 'approx_hours', label: 'Approximated Hours', visible: true, sortable: false },
  { key: 'code', label: 'Code', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const cityLinkTableOption = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: ''
});

const citylinkpageActions = computed(() => {
  const actions = [];
  if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary ",
      method: () => (fetchCityLinks())
    });
  }
  if (true) {
    actions.push({
      label: "Register City Link(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (openCityLinkModal())
    });
  }
  return actions;
});



const fetchCityLinks = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('/city-links');
    const payload = response.data?.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    cityLinks.value = rows.map((d, index) => ({
      sno: index + 1,
      id: d.id,
      code: d.code,
      original_city: d.original_city?.name || d.original_city,
      destination_city: d.destination_city?.name || d.destination_city,
      original_city_id: d.original_city_id,
      destination_city_id: d.destination_city_id,
      distance_km: d.distance_km,
      approx_hours: d.approx_hours,
      path_geometric: d.path_geometric,
      name: d.name
    }));
    cityLinksLoaded.value = true;
  } catch (error) {
    showAlert('error', 'Failed to fetch city links');
  } finally {
    isLoading.value = false;
  }
};

const openCityLinkModal = async (link = null) => {
  // Ensure cities are loaded before opening modal
  if (!formDataLoaded.value) {
    await fetchFormData();
  }

  if (link) {
    currentCityLink.value = { ...link };
    isMultipleMode.value = false;
    multipleCityLinks.value = [];

    if (typeof currentCityLink.value.original_city_id === 'number') {
      const selected = cities.value.find(c => c.id === currentCityLink.value.original_city_id);
      if (selected) {
        currentCityLink.value.original_city_id = selected;
      }
    }

    if (typeof currentCityLink.value.destination_city_id === 'number') {
      const selected = cities.value.find(c => c.id === currentCityLink.value.destination_city_id);
      if (selected) {
        currentCityLink.value.destination_city_id = selected;
      }
    }


  } else {
    currentCityLink.value = {
      id: null,
      code: "",
      original_city_id: "",
      destination_city_id: "",
      distance_km: "",
      approx_hours: "",
      path_geometric: ''
    };
    isMultipleMode.value = true; // Alwaystart in multiple mode for new entries
    multipleCityLinks.value = [{
      id: null,
      code: "",
      original_city_id: "",
      destination_city_id: "",
      distance_km: "",
      approx_hours: "",
      path_geometric: ''
    }];
  }
  await openModalSafely('cityLinkModal', cityLinkModal);
};

// Add new city link row
const addCityLinkRow = () => {
  const newRow = {
    id: null,
    code: "",
    original_city_id: "",
    destination_city_id: "",
    distance_km: "",
    approx_hours: "",
    path_geometric: ''
  };

  // Add to the beginning of the array (latest first)
  multipleCityLinks.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.city-links-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove city link row
const removeCityLinkRow = (index) => {
  if (multipleCityLinks.value.length > 1) {
    multipleCityLinks.value.splice(index, 1);
  }
};

const saveCityLink = async () => {
  isLoading.value = true;
  try {
    // Prepare data - single or multiple
    let dataToSubmit;
    let isEdit = false;

    if (isMultipleMode.value) {
      // Multiple city links mode
      dataToSubmit = multipleCityLinks.value.map(link => ({
        code: link.code,
        distance_km: link.distance_km,
        approx_hours: link.approx_hours,
        path_geometric: link.path_geometric,
        original_city_id: typeof link.original_city_id === 'object' ? link.original_city_id.id : link.original_city_id,
        destination_city_id: typeof link.destination_city_id === 'object' ? link.destination_city_id.id : link.destination_city_id
      }));

      // Validate multiple entries
      try {
        await validateCityLinks(dataToSubmit);
      } catch (validationError) {
        showAlert('error', validationError.message);
        return;
      }

      // Submit as batch
      const response = await axiosInstance.post('/city-links', { city_links: dataToSubmit });if (response.data.status === "success") {
        showAlert('success', `${dataToSubmit.length} City Links saved successfully`);
        // cityLinkModal.value.hide();
        isLoading.value = false;
        // cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      } else if (response.data.status === "partial") {
        // Handle partial success with errors
        const responseData = response.data;
        // Show the main message
        if (responseData.message) {
          showAlert('warning', responseData.message);
        }

        // Show individual errors
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((errorItem, index) => {
            if (errorItem.messages && Array.isArray(errorItem.messages)) {
              errorItem.messages.forEach(msg => {
                const errorMessage = errorItem.code
                  ? `Code ${errorItem.code}: ${msg}`
                  : msg;
                showAlert('error', errorMessage);
              });
            }
          });
        }
        isLoading.value = false;
        // Refresh the city links list to show updated data
        // cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      }
    } else {
      // Single city link mode
      const linkData = {
        code: currentCityLink.value.code,
        distance_km: currentCityLink.value.distance_km,
        approx_hours: currentCityLink.value.approx_hours,
        original_city_id: typeof currentCityLink.value.original_city_id === 'object'
          ? currentCityLink.value.original_city_id.id
          : currentCityLink.value.original_city_id,
        destination_city_id: typeof currentCityLink.value.destination_city_id === 'object'
          ? currentCityLink.value.destination_city_id.id
          : currentCityLink.value.destination_city_id
      };

      // Validate single entry
      try {
        isLoading.value = false;
        await validateCityLinks([linkData]);
      } catch (validationError) {
        showAlert('error', validationError.message);
        return;
      }

      // Submit single entry
      let response;
      if (currentCityLink.value.id) {
        // Edit existing
        response = await axiosInstance.put(`/city-links/${currentCityLink.value.id}`, linkData);
      } else {
        // Create new - submit as single item in array
        response = await axiosInstance.post('/city-links', { city_links: [linkData] });
      }

      if (response.data.status === "success") {
        showAlert('success', 'City Link saved successfully');
        cityLinkModal.value.hide();
        cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      } else if (response.data.status === "partial") {
        // Handle partial success with errors
        const responseData = response.data;

        // Show the main message
        if (responseData.message) {
          showAlert('warning', responseData.message);
        }

        // Show individual errors
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((errorItem, index) => {
            if (errorItem.messages && Array.isArray(errorItem.messages)) {
              errorItem.messages.forEach(msg => {
                const errorMessage = errorItem.code
                  ? `Code ${errorItem.code}: ${msg}`
                  : msg;
                showAlert('error', errorMessage);
              });
            }
          });
        }

        // Refresh the city links list to show updated data
        cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      }
    }
  } catch (error) {
    console.error('City Link Save Error:', error.response?.data); // Debug log
    isLoading.value = false;
    if (error.response?.status === 422) {
      const responseData = error.response.data;

      // Handle backend validation errors format
      if (responseData.errors && Array.isArray(responseData.errors)) {
        // Backend returns array of errors with code and messages
        responseData.errors.forEach((errorItem, index) => {
          if (errorItem.messages) {
            // Handle Laravel validation errors object
            if (typeof errorItem.messages === 'object' && !Array.isArray(errorItem.messages)) {
              Object.values(errorItem.messages).forEach(messages => {
                if (Array.isArray(messages)) {
                  messages.forEach(msg => {
                    const errorMessage = errorItem.code
                      ? `Row ${index + 1} (Code: ${errorItem.code}): ${msg}`
                      : `Row ${index + 1}: ${msg}`;
                    showAlert('error', errorMessage);
                  });
                } else {
                  const errorMessage = errorItem.code
                    ? `Row ${index + 1} (Code: ${errorItem.code}): ${messages}`
                    : `Row ${index + 1}: ${messages}`;
                  showAlert('error', errorMessage);
                }
              });
            } else if (Array.isArray(errorItem.messages)) {
              // Handle direct array of messages
              errorItem.messages.forEach(msg => {
                const errorMessage = errorItem.code
                  ? `Row ${index + 1} (Code: ${errorItem.code}): ${msg}`
                  : `Row ${index + 1}: ${msg}`;
                showAlert('error', errorMessage);
              });
            }
          }
        });
      } else if (responseData.errors) {
        // Standard Laravel validation errors
        Object.values(responseData.errors).forEach(msgs => {
          if (Array.isArray(msgs)) {
            msgs.forEach(msg => showAlert('error', msg));
          } else {
            showAlert('error', msgs);
          }
        });
      } else {
        showAlert('error', 'Validation failed');
      }
    } else if (error.response?.data?.message) {
      showAlert('error', error.response.data.message);
    } else {
      showAlert('error', 'Failed to save city link');
    }
  }
  finally {
    isLoading.value = false;
  }
};

// Unified validation function for city links
const validateCityLinks = async (cityLinksData) => {
  // Validate required fields
  for (let i = 0; i < cityLinksData.length; i++) {
    const link = cityLinksData[i];
    if (!link.code || !link.original_city_id || !link.destination_city_id) {
      throw new Error(`Please fill all required fields in row ${i + 1}`);
    }

    // Check if original and destination cities are the same
    if (link.original_city_id === link.destination_city_id) {
      throw new Error(`Original and Destination cities cannot be the same in row ${i + 1}`);
    }
  }

  // Check for duplicate city link combinations across all entries
  const cityLinkCombinations = new Set();
  for (let i = 0; i < cityLinksData.length; i++) {
    const link = cityLinksData[i];

    // Create a unique key for the city combination (both directions)
    const combinationKey1 = `${link.original_city_id}-${link.destination_city_id}`;
    const combinationKey2 = `${link.destination_city_id}-${link.original_city_id}`;

    if (cityLinkCombinations.has(combinationKey1) || cityLinkCombinations.has(combinationKey2)) {
      throw new Error(`Duplicate city link combination found in row ${i + 1}. The same city pair already exists in another row.`);
    }

    cityLinkCombinations.add(combinationKey1);
    cityLinkCombinations.add(combinationKey2);
  }
};



const cityLinkAction = () => {
  fetchCityLinks();
  fetchFormData(); // Only load cities for city link form
};
// --- City Link Logic END ---

//route stary 
// ...existing code...
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
      class: "btn btn-info",
      method: () => (openRouteModal())
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
    showAlert('error', 'Failed to fetch routes');
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
  } else {
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
  }
  await openModalSafely('routeModal', routeModal);
};

// Add new route row
const addRouteRow = () => {
  const newRow = {
    id: null,
    city_link_id: "",
    route_code: "",
    is_active: 1
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
      response = await axiosInstance.put(`routes/${currentRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('routes', params);
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
    const response = await axiosInstance.post('routes', { routes: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleRoutes.value.length} Routes saved successfully`);
      routeModal.value.hide();
      await fetchRoutesList();
      isLoading.value = false;
    }
  } catch (error) {
    if (error.response?.status === 422) {
      isLoading.value = false;
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


const filteredLinks = computed(() => {
  // ✅ IDs that are already selected
  const selectedIds = multipleRoutes.value
    .map(r => (r.city_link_id?.id ?? r.city_link_id)) // handle object or number
    .filter(id => id != null);

  //// ✅ Return cityLinks that are NOT selected
  return cityLinks.value.filter(link => !selectedIds.includes(link.id));
});


const deleteRoute = async (id) => {
  if (!confirm('Are you sure you want to delete this route?')) return;
  try {
    await axiosInstance.delete(`routes/${id}`);
    showAlert('success', 'Route deleted successfully');
    await fetchRoutesList();
  } catch (error) {
    showAlert('error', 'Failed to delete route');
  }
};

const routeAction = () => {
  fetchRoutesList();
  fetchCityLinks(); // Routes need city links for selection
  fetchFormData(); // Load cities for route form
};


// sub route logics start
// ...existing code...
const isLoadingSubRoutes = ref(false);
const subRoutesList = ref([]);
const subRouteModal = ref(null);
const currentSubRoute = ref({
  id: null,
  city_link_id: "",
  route_id: "",
  is_active: 1
});

// Multiple subroutes functionality
const multipleSubRoutes = ref([]);
const isMultipleSubRouteMode = ref(false);
const subRouteColumns = ref(['sno', 'city_link', 'route', 'is_active', 'actions']);
const subRouteTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['is_active'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const fetchSubRoutesList = async () => {
  if (subRoutesLoaded.value) return; // Skip if already loaded

  isLoadingSubRoutes.value = true;
  try {
    const response = await axiosInstance.get('sub-routes');
    subRoutesList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
    subRoutesLoaded.value = true;

  } catch (error) {
    showAlert('error', 'Failed to fetch subroutes');
  } finally {
    isLoadingSubRoutes.value = false;
  }
};

const openSubRouteModal = async (subroute = null) => {
  if (subroute) {
    currentSubRoute.value = { ...subroute };
    isMultipleSubRouteMode.value = false;
    multipleSubRoutes.value = [];
  } else {
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
  await openModalSafely('subRouteModal', subRouteModal);
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

  try {
    let params = {
      city_link_id: typeof currentSubRoute.value.city_link_id === 'object' ? currentSubRoute.value.city_link_id.id : currentSubRoute.value.city_link_id,
      route_id: typeof currentSubRoute.value.route_id === 'object' ? currentSubRoute.value.route_id.id : currentSubRoute.value.route_id,
      is_active: currentSubRoute.value.is_active
    };
    let response;
    if (currentSubRoute.value.id) {
      response = await axiosInstance.put(`sub-routes/${currentSubRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('sub-routes', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'SubRoute saved successfully');
      subRouteModal.value.hide();
      await fetchSubRoutesList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save subroute');
  }
};

// Save multiple subroutes
const saveMultipleSubRoutes = async () => {
  try {
    // Validate all entries
    for (let i = 0; i < multipleSubRoutes.value.length; i++) {
      const subroute = multipleSubRoutes.value[i];
      if (!subroute.city_link_id || !subroute.route_id) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleSubRoutes.value.map(subroute => ({
      city_link_id: typeof subroute.city_link_id === 'object' ? subroute.city_link_id.id : subroute.city_link_id,
      route_id: typeof subroute.route_id === 'object' ? subroute.route_id.id : subroute.route_id,
      is_active: subroute.is_active
    }));

    // Send batch request
    const response = await axiosInstance.post('sub-routes', { sub_routes: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleSubRoutes.value.length} SubRoutes saved successfully`);
      subRouteModal.value.hide();
      await fetchSubRoutesList();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Failed to save subroutes');
    }
  }
};


const isLoadingSTP = ref(false);
const stpList = ref([]);
const stpModal = ref(null);
const currentSTP = ref({
  id: null,
  name: "",
  stop_id: "",
  schedule_timetable_id: "",
  sequency: 1,
  type: ''



                 });


// Multiple STP functionality
const multipleSTPs = ref([]);
const isMultipleSTPMode = ref(false);
const stpColumns = ref(['sno', 'stop', 'route', 'sequency', 'type', 'actions']);
const stpTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['name', 'sequency', 'type'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const stops = ref([]); // You should fetch stops from your API

const fetchStops = async () => {
  try {
    const response = await axiosInstance.get('stops');
    stops.value = response.data.data || [];
  } catch (error) {
    showAlert('error', 'Failed to fetch stops');
  }
};

const fetchSTPList = async () => {
  isLoadingSTP.value = true;
  try {
    const response = await axiosInstance.get(`schedule-timetable-points?route_id=${route.param.id}`);
    stpList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
  } catch (error) {
    showAlert('error', 'Failed to fetch points');
  } finally {
    isLoadingSTP.value = false;
  }
};

const openSTPModal = async (point = null) => {
  if (point) {
    currentSTP.value = { ...point };
    isMultipleSTPMode.value = false;
    multipleSTPs.value = [];
  } else {
    currentSTP.value = {
      id: null,
      name: "",
      stop_id: "",
      schedule_timetable_id: "",
      sequency: 1,
      type: "BOARDING OR DROPPING"
    };
    isMultipleSTPMode.value = true; // Always start in multiple mode for new entries
    multipleSTPs.value = [{
      id: null,
      name: "",
      stop_id: "",
      schedule_timetable_id: "",
      sequency: 1,
      type: "BOARDING OR DROPPING"
    }];
  }
  await openModalSafely('stpModal', stpModal);
};

// Add new STP row
const addSTPRow = () => {
  const newRow = {
    id: null,
    name: "",
    stop_id: "",
    schedule_timetable_id: "",
    sequency: 1,
    type: "BOARDING OR DROPPING"
  };

  // Add to the beginning of the array (latest first)
  multipleSTPs.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.stp-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove STP row
const removeSTPRow = (index) => {
  if (multipleSTPs.value.length > 1) {
    multipleSTPs.value.splice(index, 1);
  }
};




const saveSTP = async () => {
  if (isMultipleSTPMode.value) {
    await saveMultipleSTPs();
    return;
  }

  try {
    let params = {
      name: currentSTP.value.name,
      stop_id: typeof currentSTP.value.stop_id === 'object' ? currentSTP.value.stop_id.id : currentSTP.value.stop_id,
      schedule_timetable_id: typeof currentSTP.value.schedule_timetable_id === 'object' ? currentSTP.value.schedule_timetable_id.id : currentSTP.value.schedule_timetable_id,
      sequency: currentSTP.value.sequency,
      type: currentSTP.value.type
    };
    let response;
    if (currentSTP.value.id) {
      response = await axiosInstance.put(`schedule-timetable-points/${currentSTP.value.id}`, params);
    } else {
      response = await axiosInstance.post('schedule-timetable-points', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Point saved successfully');
      stpModal.value.hide();
      await fetchSTPList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save point');
  }
};

// Save multiple STPs
const saveMultipleSTPs = async () => {
  try {
    // Validate all entries
    for (let i = 0; i < multipleSTPs.value.length; i++) {
      const stp = multipleSTPs.value[i];
      if (!stp.stop_id || !stp.schedule_timetable_id) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleSTPs.value.map(stp => ({
      name: stp.name,
      stop_id: typeof stp.stop_id === 'object' ? stp.stop_id.id : stp.stop_id,
      schedule_timetable_id: typeof stp.schedule_timetable_id === 'object' ? stp.schedule_timetable_id.id : stp.schedule_timetable_id,
      sequency: stp.sequency,
      type: stp.type
    }));

    // Send batch request
    const response = await axiosInstance.post('schedule-timetable-points', { stps: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleSTPs.value.length} Points saved successfully`);
      stpModal.value.hide();
      await fetchSTPList();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Failed to save points');
    }
  }
};




// stops logics 

// ...existing code...
const isLoadingStops = ref(false);
const stopsList = ref([]);
const stopModal = ref(null);
const currentStop = ref({
  id: null,
  name: "",
  city_id: "",
  status: "Active"
});

// Multiple stops functionality
const multipleStops = ref([]);
const isMultipleStopMode = ref(false);




const stopColumns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'city', label: 'City', visible: true, sortable: false },
  { key: 'status', label: 'Status', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const stopTableOption = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  showAdvancedFilters: false,
  date_from: '',
  date_to: ''
});

const stopPageActions = computed(() => {
  const actions = [];
  if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-info",
      method: () => (fetchStopsList())
    });
  }
  if (true) {
    actions.push({
      label: "Register Stop(s)",
      icon: "fa fa-plus",
      class: "btn btn-outline-info",
      method: () => (openStopModal())
    });
  }
  return actions;
});


const cities = ref([]);

// Lazy loading flags to prevent unnecessary API calls
const routesLoaded = ref(false);
const subRoutesLoaded = ref(false);
const cityLinksLoaded = ref(false);
const stopsLoaded = ref(false);
const formDataLoaded = ref(false);

// Computed properties for filtered city options
const filteredDestinationCities = computed(() => {
  if (!currentCityLink.value.original_city_id) return cities.value;
  const originalId = typeof currentCityLink.value.original_city_id === 'object'
    ? currentCityLink.value.original_city_id.id
    : currentCityLink.value.original_city_id;
  return cities.value.filter(city => city.id !== originalId);
});

const filteredOriginalCities = computed(() => {
  if (!currentCityLink.value.destination_city_id) return cities.value;
  const destinationId = typeof currentCityLink.value.destination_city_id === 'object'
    ? currentCityLink.value.destination_city_id.id
    : currentCityLink.value.destination_city_id;
  return cities.value.filter(city => city.id !== destinationId);
});

// Function to get filtered cities for multiple city links
const getFilteredDestinationCities = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (!link || !link.original_city_id) return cities.value;
  const originalId = typeof link.original_city_id === 'object'
    ? link.original_city_id.id
    : link.original_city_id;
  return cities.value.filter(city => city.id !== originalId);
};

const getFilteredOriginalCities = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (!link || !link.destination_city_id) return cities.value;
  const destinationId = typeof link.destination_city_id === 'object'
    ? link.destination_city_id.id
    : link.destination_city_id;
  return cities.value.filter(city => city.id !== destinationId);
};

// Function to clear destination when original changes (single form)
const onOriginalCityChange = () => {
  if (currentCityLink.value.destination_city_id) {
    const originalId = typeof currentCityLink.value.original_city_id === 'object'
      ? currentCityLink.value.original_city_id.id
      : currentCityLink.value.original_city_id;
    const destinationId = typeof currentCityLink.value.destination_city_id === 'object'
      ? currentCityLink.value.destination_city_id.id
      : currentCityLink.value.destination_city_id;

    if (originalId === destinationId) {
      currentCityLink.value.destination_city_id = null;
    }
  }
};

// Function to clear original when destination changes (single form)
const onDestinationCityChange = () => {
  if (currentCityLink.value.original_city_id) {
    const originalId = typeof currentCityLink.value.original_city_id === 'object'
      ? currentCityLink.value.original_city_id.id
      : currentCityLink.value.original_city_id;
    const destinationId = typeof currentCityLink.value.destination_city_id === 'object'
      ? currentCityLink.value.destination_city_id.id
      : currentCityLink.value.destination_city_id;

    if (originalId === destinationId) {
      currentCityLink.value.original_city_id = null;
    }
  }
};

// Function to clear destination when original changes (multiple forms)
const onMultipleOriginalCityChange = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (link && link.destination_city_id) {
    const originalId = typeof link.original_city_id === 'object'
      ? link.original_city_id.id
      : link.original_city_id;
    const destinationId = typeof link.destination_city_id === 'object'
      ? link.destination_city_id.id
      : link.destination_city_id;

    if (originalId === destinationId) {
      link.destination_city_id = null;
    }
  }
};

// Function to clear original when destination changes (multiple forms)
const onMultipleDestinationCityChange = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (link && link.original_city_id) {
    const originalId = typeof link.original_city_id === 'object'
      ? link.original_city_id.id
      : link.original_city_id;
    const destinationId = typeof link.destination_city_id === 'object'
      ? link.destination_city_id.id
      : link.destination_city_id;

    if (originalId === destinationId) {
      link.original_city_id = null;
    }
  }
};

// Function to format code to uppercase (single form)
const formatCodeToUppercase = (event) => {
  const value = event.target.value;
  currentCityLink.value.code = value.toUpperCase();
};

// Function to format code to uppercase (multiple forms)
const formatMultipleCodeToUppercase = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (link) {
    link.code = link.code.toUpperCase();
  }
};

// Function to format stop name to uppercase (single form)
const formatStopNameToUppercase = (event) => {
  const value = event.target.value;
  currentStop.value.name = value.toUpperCase();
};

// Function to format stop name to uppercase (multiple forms)
const formatMultipleStopNameToUppercase = (stopIndex) => {
  const stop = multipleStops.value[stopIndex];
  if (stop) {
    stop.name = stop.name.toUpperCase();
  }
};



const fetchStopsList = async () => {
  isLoadingStops.value = true;
  try {
    const response = await axiosInstance.get('stops');
    stopsList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d,
      status: 'Active' // Set all stops as active for now
    }));
    stopsLoaded.value = true;
  } catch (error) {
    showAlert('error', 'Failed to fetch stops');
  } finally {
    isLoadingStops.value = false;
  }
};

const openStopModal = async (stop = null) => {
  if (stop) {
    currentStop.value = { ...stop };
    isMultipleStopMode.value = false;
    multipleStops.value = [];
  } else {
    currentStop.value = {
      id: null,
      name: "",
      city_id: "",
      status: "Active"
    };
    isMultipleStopMode.value = true; // Always start in multiple mode for new entries
    multipleStops.value = [{
      id: null,
      name: "",
      city_id: "",
      status: "Active"
    }];
  }
  await openModalSafely('stopModal', stopModal);
};

// Add new stop row
const addStopRow = () => {
  const newRow = {
    id: null,
    name: "",
    city_id: "",
    status: "Active"
  };

  // Add to the beginning of the array (latest first)
  multipleStops.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.stops-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove stop row
const removeStopRow = (index) => {
  if (multipleStops.value.length > 1) {
    multipleStops.value.splice(index, 1);
  }
};

const saveStop = async () => {
  if (isMultipleStopMode.value) {
    await saveMultipleStops();
    return;
  }

  try {
    let params = {
      name: currentStop.value.name,
      city_id: typeof currentStop.value.city_id === 'object' ? currentStop.value.city_id.id : currentStop.value.city_id,
      status: currentStop.value.status
    };
    let response;
    if (currentStop.value.id) {
      response = await axiosInstance.put(`stops/${currentStop.value.id}`, params);
    } else {
      response = await axiosInstance.post('stops', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Stop saved successfully');
      stopModal.value.hide();
      stopsLoaded.value = false; // Reset flag to reload data
      await fetchStopsList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save stop');
  }
};

// Save multiple stops
const saveMultipleStops = async () => {
  isLoading.value = false;
  try {
    // Validate all entries
    for (let i = 0; i < multipleStops.value.length; i++) {
      const stop = multipleStops.value[i];
      if (!stop.name || !stop.city_id || !stop.status) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleStops.value.map(stop => ({
      name: stop.name,
      city_id: typeof stop.city_id === 'object' ? stop.city_id.id : stop.city_id,
      status: 'active'
    }));

    // Send batch request
    const response = await axiosInstance.post('stops', { stops: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleStops.value.length} Stops saved successfully`);
      stopModal.value.hide();
      isLoading.value = false;
      stopsLoaded.value = false; // Reset flag to reload data
      await fetchStopsList();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      isLoading.value = false;
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      isLoading.value = false;
      showAlert('error', 'Failed to save stops');
    }
  }
};



//timetable subroute 

const isLoadingSTSubRoute = ref(false);
const stSubRouteList = ref([]);
const stSubRouteModal = ref(null);
const currentSTSubRoute = ref({
  id: null,
  schedule_timetable_id: "",
  sub_route_id: "",
  is_online_allowed: 1,
  fare: "",
  commission: "",
  seat_limit: ""
});
const stSubRouteColumns = ref([
  'sno', 'schedule_timetable', 'sub_route', 'is_online_allowed', 'fare', 'commission', 'seat_limit', 'actions'
]);
const stSubRouteTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['fare', 'commission', 'seat_limit'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const fetchSTSubRouteList = async () => {
  isLoadingSTSubRoute.value = true;
  try {
    const response = await axiosInstance.get('schedule-timetable-sub-routes');
    stSubRouteList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
  } catch (error) {
    showAlert('error', 'Failed to fetch timetable subroutes');
  } finally {
    isLoadingSTSubRoute.value = false;
  }
};

const openSTSubRouteModal = async (item = null) => {
  if (item) {
    currentSTSubRoute.value = { ...item };
  } else {
    currentSTSubRoute.value = {
      id: null,
      schedule_timetable_id: "",
      sub_route_id: "",
      is_online_allowed: 1,
      fare: "",
      commission: "",
      seat_limit: ""
    };
  }
  await openModalSafely('stSubRouteModal', stSubRouteModal);
};

const saveSTSubRoute = async () => {
  try {
    let params = {
      schedule_timetable_id: typeof currentSTSubRoute.value.schedule_timetable_id === 'object'
        ? currentSTSubRoute.value.schedule_timetable_id.id
        : currentSTSubRoute.value.schedule_timetable_id,
      sub_route_id: typeof currentSTSubRoute.value.sub_route_id === 'object'
        ? currentSTSubRoute.value.sub_route_id.id
        : currentSTSubRoute.value.sub_route_id,
      is_online_allowed: currentSTSubRoute.value.is_online_allowed,
      fare: currentSTSubRoute.value.fare,
      commission: currentSTSubRoute.value.commission,
      seat_limit: currentSTSubRoute.value.seat_limit
    };
    let response;
    if (currentSTSubRoute.value.id) {
      response = await axiosInstance.put(`schedule-timetable-sub-routes/${currentSTSubRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('schedule-timetable-sub-routes', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Timetable SubRoute saved successfully');
      stSubRouteModal.value.hide();
      await fetchSTSubRouteList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save timetable subroute');
  }
};

const deleteSTSubRoute = async (id) => {
  if (!confirm('Are you sure you want to delete this timetable subroute?')) return;
  try {
    await axiosInstance.delete(`schedule-timetable-sub-routes/${id}`);
    showAlert('success', 'Timetable SubRoute deleted successfully');
    await fetchSTSubRouteList();
  } catch (error) {
    showAlert('error', 'Failed to delete timetable subroute');
  }
};

const stSubRouteAction = () => {
  fetchSTSubRouteList();
  fetchScheduleTimetable();
  fetchSubRoutesList();
};

watch(activeTab, (tab) => {
  if (tab === 'routes') routeAction();
  else if (tab === 'citylink') cityLinkAction();
  else if (tab === 'stops') stopsActions();
});

onMounted(async () => {
  cityLinkAction();
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
:deep(.col-md-12) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

/* Optional: Limit width of search input */

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
.routes-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.routes-container::-webkit-scrollbar {
  width: 8px;
}

.routes-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.routes-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.routes-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

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
