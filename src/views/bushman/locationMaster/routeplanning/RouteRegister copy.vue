<template>
  <div>    
      <div class="d-flex justify-content-between align-items-center ">
      <ol class="breadcrumb">
        
        <li class="breadcrumb-item ">LOCATION MASTER</li>
        <li class="breadcrumb-item  active"><router-link to="/abs/location"></router-link>
        </li>
        <li class="breadcrumb-item  active">CREATER
        </li>
      </ol>
      <div v-if="showForm" class="d-flex gap-2">
        <!-- <button class="btn btn-secondary " @click="resetForm"> Reset </button> -->
        <button class="btn btn-secondary " @click="goBack">
          <i class="fa fa-arrow-left"></i> Back
        </button>

        <button class="btn btn-primary" @click="addTimetable">
          <i class="fa fa-plus me-1"></i> Add Another Timetable
        </button>
        <!-- <button class="btn btn-primary " @click="openConfirmModal" :disabled="!canSubmitAll">
        Preview
      </button> -->
      </div>
    </div>
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
                      placeholder="Select City Link" :loading="isLoadingCityLink">
                      <template #option="{ option }">
                        <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                      </template>
                    </multiselect>
                  </td>
                  <!-- ROUTE CODE -->
                  <td>
                    <label class="form-label d-block d-md-none">Route Code</label>
                    <input v-model="route.route_code" type="text" class="form-control" />
                  </td>

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
                  {{ 
                    'Save'
                  }}
                </span>
              </button>
            </div>
    </div>  
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";
const isLoading = ref(false);
const { showAlert } = useNotification();
const authStore = useAuthStore();
const axiosInstance = axios.create({
  baseURL: API_URL_2,
  // baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});
const isLoadingCityLink = ref(false);
const routes = ref([]);
const  multipleRoutes = ref([]);
const cityLinks = ref([]);

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

// Fetch routes for selection
const fetchroutes = async () => {
  try {
    const response = await axiosInstance.get('active-routes');
    routes.value = response.data.data || response.data;
  } catch (error) {
    showAlert('error', 'Failed to fetch routes');
  }
};



const fetchCityLinks = async () => {
  isLoadingCityLink.value = true;
  try {
    const response = await axiosInstance.get('locations/city-links');
    cityLinks.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      id: d.id,
      code: d.code,
      name:d.name,
      original_city: d.original_city,
      destination_city: d.destination_city,
      original_city_id: d.original_city_id,
      destination_city_id: d.destination_city_id,     
    }));
    cityLinksLoaded.value = true;
  } catch (error) {
    console.error(error);
   
  } finally {
    isLoadingCityLink.value = false;
  }
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

const init = () => {
    multipleRoutes.value = [{
      id: null,
      city_link_id: "",
      route_code: "",
      is_active: 1
    }];
}

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
    // console.log("ASDASDASDASDASDAS");
    
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




const filteredLinks = computed(() => {
  // ✅ IDs that are already selected
  const selectedIds = multipleRoutes.value
    .map(r => (r.city_link_id?.id ?? r.city_link_id)) // handle object or number
    .filter(id => id != null);

  // console.log("Selected IDs:", selectedIds);

  // ✅ Return cityLinks that are NOT selected
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


function goBack() {
  showForm.value = false;
  //resetForm();
  // minimizePage()
}

watch(activeTab, (tab) => {
  if (tab === 'routes') routeAction();
  else if (tab === 'citylink') cityLinkAction();
  else if (tab === 'stops') stopsActions();
});

onMounted(async () => {
init();
fetchCityLinks(); // Routes need city links for selection
  
});

</script>
