<template>
  <div class="branch-offices-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="javascript:;" @click="$router.push('/abs/location')">LOCATION MASTER</a>
        </li>
        <li class="breadcrumb-item"><a href="javascript:;" @click="$router.push('/abs/location')">CITIES</a></li>
        <li class="breadcrumb-item"><a href="javascript:;"
            @click="$router.push(`/abs/location/city/${branch.cityId}`)">{{ branch.cityName }}</a></li>
        <li class="breadcrumb-item active">{{ branch.name }}</li>
      </ol>
    </div>

    <!-- Branch Header Card -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
            <div class="d-flex align-items-center">
              <div class="branch-icon me-2">
                <i class="fa fa-shop fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">{{ branch.name || 'Loading...' }}</h4>
                <small class="text-muted">{{ branch.address || 'Branch details loading...' }}</small>
              </div>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
              <button @click="refreshData" class="text-decoration-none text-body text-opacity-50" :disabled="loading">
                <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i> Refresh
              </button>
              <button class="btn btn-success btn-sm" @click="openModal(null, true);">+ Add Office</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Offices Content -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Offices in {{ branch.name }}</span>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-3">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
            <div v-else-if="offices.length === 0" class="text-center py-3">
              <i class="fa fa-briefcase fa-4x text-muted mb-3"></i>
              <h5 class="text-muted">No Offices Found</h5>
              <p class="text-muted">This branch doesn't have any offices yet.</p>
              <button class="btn btn-primary">+ Add First Office</button>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Office Name</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="office in offices" :key="office.id">
                    <td>
                      <div class="d-flex align-items-center">
                        <i class="fa fa-briefcase text-primary me-2"></i>
                        {{ office.name }}
                      </div>
                    </td>
                    <td>{{ office.address }}</td>
                    <td>{{ office.location }}</td>  
                    <td>{{ office.code }}</td>   
                    <td>{{ office.contact }}</td>         
                   
                    <td>
                      <span class="badge" :class="office.status === 'Active' ? 'bg-success' : 'bg-danger'">
                        {{ office.status }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button @click="openModal(office)" class="btn btn-sm btn-outline-primary">
                          <i class="fa fa-editcil-alt me-1"></i> Edit
                        </button>
                        <button @click="viewOfficeLocation(office)" class="btn btn-sm btn-outline-primary">
                          <i class="fa fa-map-marker-alt me-1"></i> Location
                        </button>
                        <button @click="router.push(`/abs/office-profile/${office.id}`)"
                          class="btn btn-sm btn-outline-info">
                          <i class="fa fa-eye me-1"></i> View
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Office Location Modal -->
  <div class="modal fade" id="officeLocationModal" tabindex="-1" aria-labelledby="officeLocationModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="officeLocationModalLabel">
            <i class="fa fa-map-marker-alt text-danger me-2"></i>
            {{ selectedOffice?.name }} - Location
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-8">
              <!-- Map Container -->
              <div class="map-container"
                style="height: 400px; background: #f8f9fa; border-radius: 8px; position: relative; overflow: hidden;">
                <!-- Interactive Map Background -->
                <div class="map-background"
                  style="height: 100%; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%); position: relative;">
                  <!-- Grid Lines for Map Effect -->
                  <div class="map-grid" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.3;">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1976d2" stroke-width="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  <!-- Interactive Map Pin -->
                  <div class="interactive-map-pin"
                    style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); cursor: pointer;"
                    @click="showPinInfo" @mouseenter="pinHover = true" @mouseleave="pinHover = false">
                    <div class="pin-marker" :class="{ 'pin-hover': pinHover }">
                      <i class="fa fa-map-marker-alt fa-3x text-danger"></i>
                      <div class="pin-pulse"></div>
                    </div>

                    <!-- Pin Info Tooltip -->
                    <div v-if="pinHover" class="pin-tooltip">
                      <div class="tooltip-content">
                        <h6 class="mb-1">{{ selectedOffice?.name }}</h6>
                        <p class="mb-1 small">{{ selectedOffice?.address }}</p>
                        <small class="text-muted">Click for details</small>
                      </div>
                    </div>
                  </div>

                  <!-- Map Coordinates Display -->
                  <div class="map-coordinates"
                    style="position: absolute; bottom: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 4px; font-size: 12px;">
                    <i class="fa fa-crosshairs me-1"></i>
                    Lat: -6.8235, Lng: 39.2695
                  </div>

                  <!-- Map Scale -->
                  <div class="map-scale"
                    style="position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 4px; font-size: 12px;">
                    <i class="fa fa-ruler me-1"></i>
                    Scale: 1:1000
                  </div>
                </div>
                <!-- Map Controls -->
                <div class="map-controls position-absolute top-0 end-0 m-2">
                  <button class="btn btn-sm btn-light" @click="zoomIn">
                    <i class="fa fa-plus"></i>
                  </button>
                  <button class="btn btn-sm btn-light" @click="zoomOut">
                    <i class="fa fa-minus"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <!-- Office Details -->
              <div class="office-details">
                <h6 class="fw-bold mb-3">Office Information</h6>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <strong>Name:</strong><br>
                    <span class="text-muted">{{ selectedOffice?.name }}</span>
                  </li>
                  <li class="mb-2">
                    <strong>Address:</strong><br>
                    <span class="text-muted">{{ selectedOffice?.address }}</span>
                  </li>
                  <li class="mb-2">
                    <strong>Phone:</strong><br>
                    <span class="text-muted">{{ selectedOffice?.phone }}</span>
                  </li>
                  <li class="mb-2">
                    <strong>Email:</strong><br>
                    <span class="text-muted">{{ selectedOffice?.email }}</span>
                  </li>                 
                  <li class="mb-2">
                    <strong>Status:</strong><br>
                    <span class="badge" :class="selectedOffice?.status === 'Active' ? 'bg-success' : 'bg-danger'">
                      {{ selectedOffice?.status }}
                    </span>
                  </li>
                </ul>

                <!-- Quick Actions -->
                <div class="mt-4">
                  <h6 class="fw-bold mb-2">Quick Actions</h6>
                  <div class="d-grid gap-2">
                    <button class="btn btn-sm btn-outline-primary">
                      <i class="fa fa-directions me-1"></i>Get Directions
                    </button>
                    <button class="btn btn-sm btn-outline-secondary">
                      <i class="fa fa-phone me-1"></i>Call Office
                    </button>
                    <button class="btn btn-sm btn-outline-info">
                      <i class="fa fa-envelope me-1"></i>Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary">
            <i class="fa fa-share me-1"></i>Share Location
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal modal-xl fade" id="officeModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ isMultiple ? 'Office(s) Registration Form' : (currentOffice.id ? 'Office Edition Form' : 'Add Office') }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <template v-if="!isMultiple">
            <!-- Single Office Form -->
            <div class="row">
              <!-- <div class="col-md-4 mb-3">
                <label>Branch</label>
                <Multiselect v-model="currentOffice.branch_id" :options="branches" label="name" track-by="id"
                  placeholder="Select Branch" />
              </div> -->
              <div class="col-md-4 mb-3">
                <label>Office Name</label>
                <input v-model="currentOffice.name" type="text" class="form-control" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Office Label</label>
                <input v-model="currentOffice.office" type="text" class="form-control" />
              </div>
              <!-- <div class="col-md-4 mb-3">
                <label>Company</label>
                <select v-model="currentOffice.company" class="form-select">
                  <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}
                  </option>
                </select>
              </div> -->
              <div class="col-md-4   mb-3">
                <label>Address</label>
                <input v-model="currentOffice.address" type="text" class="form-control" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Location</label>
                <input v-model="currentOffice.location" type="text" class="form-control" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Contact</label>
                <input v-model="currentOffice.contact" type="text" class="form-control" />
              </div>
              <div class="col-md-4 mb-3">
                <label>Code</label>
                <input v-model="currentOffice.code" type="text" class="form-control" />
              </div>          
              
              <div class="col-md-4 mb-3">
                <label>Status</label>
                <select v-model="currentOffice.status" class="form-select">
                  <option :value="1">Active</option>
                  <option :value="0">Inactive</option>
                </select>
              </div>
            </div>
          </template>

          <!-- MULTIPLE ENTRY MODE -->
          <template v-else>
            <div v-for="(office, index) in multipleOffices" :key="index" class="border p-3 rounded mb-3">
              <div v-if="multipleOffices.length > 1" class="d-flex justify-content-between mb-2">
                <h6>Office {{ index + 1 }}</h6>
                <button class="btn btn-sm btn-danger" @click="removeOffice(index)">Remove</button>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label>Office Name</label>
                  <input v-model="office.name" type="text" class="form-control" />
                </div>
                <div class="col-md-4 mb-3">
                  <label>Office Label</label>
                  <input v-model="office.office" type="text" class="form-control" />
                </div>
                <!--<div class="col-md-4 mb-3">
                  <label>Company</label>
                  <select v-model="office.company" class="form-select">
                    <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}
                    </option>
                  </select>
                </div> -->
                <div class="col-md-4 mb-3">
                  <label>Address</label>
                  <input v-model="office.address" type="text" class="form-control" />
                </div>
                <div class="col-md-4 mb-3">
                  <label>Location</label>
                  <input v-model="office.location" type="text" class="form-control" />
                </div>
                <div class="col-md-4 mb-3">
                  <label>Contact</label>
                  <input v-model="office.contact" type="text" class="form-control" />
                </div>
                <div class="col-md-4 mb-3">
                  <label>Code</label>
                  <input v-model="office.code" type="text" class="form-control" />
                </div>
              </div>
            </div>


          </template>
        </div>

        <div class="modal-footer sticky-bottom">
          <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>

          <button v-if="isMultiple" class="btn btn-outline-primary" @click="addOffice">
            + Add Another Office
          </button>
          <button class="btn btn-outline-success" @click="saveOffice">
            {{ isMultiple ? 'Save All Offices' : (currentOffice.id ? 'Update' : 'Save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotification } from '@/composables/notification';
import axios from 'axios';
import { Modal } from 'bootstrap';
import { API_URL4 } from '@/config/config.js';
import { useAuthStore } from "@/stores/auth";


const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { showAlert } = useNotification();
const formModal = ref(null);
// State
const loading = ref(false);
const branchId = route.params.id;
const selectedOffice = ref(null);
const pinHover = ref(false);

const companies = ref([
  { id: 2, name: 'AboodBus Service' },
]); // Assume companies are loaded from API
// Branch data



const axiosInstance = axios.create({
   baseURL: API_URL4,
  //baseURL: "http://127.0.0.1:8000/api/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});


const branch = ref({
  id: '',
  name: '',
  address: '',
  phone: '',
  cityId: '',
  cityName: '',
  officeCount: 0
});

const currentOffice = ref({
  id: null,
  name: '',
  branch_id: '',
  office: '',
  status: true,
  company: '',
  address: '',
  location: '',
  contact: '',
  code: '',
  password: '',
  latitude: '',
  longitude: ''
});

// Offices data (loaded from API)
const offices = ref([]);

// Methods
// const fetchBranchData = async () => {

//
//   try {
//     loading.value = true;
//     // First get the branch details from city-branches endpoint
//     const branchResponse = await axios.get(`${API_URL4}city-branches`, {
//       params: { city_id: branch.value.cityId } // We'll need to get the city_id from the branch or route
//     });

//     const branchesList = Array.isArray(branchResponse.data) ? branchResponse.data : (branchResponse.data?.data || []);
//     const foundBranch = branchesList.find(b => Number(b.id) === Number(branchId));

//     if (foundBranch) {
//       branch.value = {
//         id: foundBranch.id,
//         name: foundBranch.name || 'Unknown Branch',
//         address: foundBranch.address || 'N/A',
//         phone: foundBranch.phone || foundBranch.contact || 'N/A',
//         cityId: foundBranch.city_id || 1, // Default to 1 if not available
//         cityName: 'Dar es Salaam', // We'll need to get this from cities endpoint
//         officeCount: 0
//       };

//       // Get city name from cities endpoint
//       try {
//         const citiesResponse = await axios.get(`${API_URL4}cities`);
//         const citiesList = Array.isArray(citiesResponse.data) ? citiesResponse.data : (citiesResponse.data?.data || []);
//         const city = citiesList.find(c => Number(c.id) === Number(foundBranch.city_id));
//         if (city) {
//           branch.value.cityName = city.name || 'Unknown City';
//         }
//       } catch (cityError) {
//         console.error('Error fetching city name:', cityError);
//       }
//     } else {
//       branch.value = {
//         id: branchId,
//         name: 'Unknown Branch',
//         address: 'N/A',
//         phone: 'N/A',
//         cityId: 1,
//         cityName: 'Unknown City',
//         officeCount: 0
//       };
//     }
//   } catch (error) {
//     console.error('Error fetching branch data:', error);
//     showAlert('error', 'Failed to fetch branch data');
//     branch.value = {
//       id: branchId,
//       name: 'Error Loading Branch',
//       address: 'N/A',
//       phone: 'N/A',
//       cityId: 1,
//       cityName: 'Unknown City',
//       officeCount: 0
//     };
//   } finally {
//     loading.value = false;
//   }
// };


const fetchBranchData = async () => {

//try {
    loading.value = true;
    // First get the branch details from city-branches endpoint
    const branchResponse = await axios.get(`${API_URL4}branches/${route.params.id}`, {
      params: { city_id: branch.value.cityId } // We'll need to get the city_id from the branch or route
    });   
      let foundBranch = branchResponse.data;
      branch.value = {
        id: foundBranch.branch_id,
        name: foundBranch.branch_name || 'Unknown Branch',
        address: foundBranch.address || 'N/A',       
        cityId: foundBranch.city_id ,
        cityName: foundBranch.city_name || 'N/A', // We'll need to get this from cities endpoint
        officeCount: foundBranch.total_office || 0,
      };

    
  } catch (error) {
    console.error('Error fetching branch data:', error);
    showAlert('error', 'Failed to fetch branch data');
    branch.value = {
      id: branchId,
      name: 'Error Loading Branch',
      address: 'N/A',
      phone: 'N/A',
      cityId: 1,
      cityName: 'Unknown City',
      officeCount: 0
    };
  } finally {
    loading.value = false;
  }
};

const isMultiple = ref(false);
const multipleOffices = ref([]);

const openModal = (office = null, multiple = false) => {
  isMultiple.value = multiple;

  if (multiple) {
    multipleOffices.value = [
      {
        name: '',
        office: '',
        branch_id: '',
        status: 1,
        company: "2",
        address: '',
        location: '',
        contact: '',
        code: ''
      }
    ];
  } else {



    currentOffice.value = office
      ? {

        id: office.id,
        name: office.name,
        office: office.office,
        branch_id: route.params.id,
        status: office.status === 'Active' ? 1 : 0,
        company: "",
        address: office.address,
        location: office.location,
        contact: office.contact,
        code: office.code
      }
      : {
        id: null,
        name: '',
        office: '',
        branch_id: '',
        status: true,
        company: 2,
        address: '',
        location: '',
        contact: '',
        code: ''
      };
  }

  formModal.value = new Modal(document.getElementById('officeModal'));
  formModal.value.show();
};

const addOffice = () => {
  multipleOffices.value.unshift({
    name: '',
    office: '',
    branch_id: '',
    status: 1,
    company: 2,
    address: '',
    location: '',
    contact: '',
    code: ''
  });
};

const removeOffice = (index) => {
  multipleOffices.value.splice(index, 1);
};

const saveOffice = async () => {
  try {
    if (isMultiple.value) {
      const payload = multipleOffices.value.map(o => ({
        name: o.name,
        office: o.office,
        branch_id: route.params.id,

        status: o.status,
        company: 2,
        address: o.address,
        location: o.location,
        contact: o.contact,
        code: o.code
      }));

      await axiosInstance.post('offices', { offices: payload });
      showAlert('success', 'All offices saved successfully');
    } else {
      // Single Create / Update
      if (currentOffice.value.id) {
        //await axiosInstance.put(`offices/${currentOffice.value.id}`, currentOffice.value);
      } else {
        await axiosInstance.post('offices', {
          name: currentOffice.value.name,
          office: currentOffice.value.office,
          branch_id: currentOffice.value.branch_id?.id,
          status: currentOffice.value.status,
          company: 2,
          branch_id: route.params.id,
          address: currentOffice.value.address,
          location: currentOffice.value.location,
          contact: currentOffice.value.contact,
          code: currentOffice.value.code
        });
      }
      showAlert('success', 'Office saved successfully');
    }

    formModal.value.hide();
    await fetchOffices(branchId);
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach((msgs) => msgs.forEach((msg) => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};




const fetchOffices = async (id) => {
  try {
    loading.value = true;
    const url = `${API_URL4}branch-offices`;
    const response = await axios.get(url, { params: { branch_id: id } });
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    offices.value = list.map(o => ({
      id: o.id,
      name: o.name || o.office || 'Unnamed Office',
      address: o.address || o.location || 'N/A',
      phone: o.contact || o.phone || 'N/A',
      email: o.email || 'N/A',
      status: o.status === 1 ? 'Active' : (o.status === 0 ? 'Inactive' : (o.status || 'Active')),
      latitude: o.latitude || o.lat || null,
      longitude: o.longitude || o.lng || null
    }));
    branch.value.officeCount = offices.value.length;
  } catch (error) {
    console.error('Error fetching offices:', error);
    showAlert('error', 'Failed to fetch offices for this branch');
    offices.value = [];
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await Promise.all([
    fetchBranchData(),
    branchId ? fetchOffices(branchId) : Promise.resolve()
  ]);
};

const viewOfficeLocation = (office) => {
  selectedOffice.value = office;
  const modal = new Modal(document.getElementById('officeLocationModal'));
  modal.show();
};

// const zoomIn = () => {};
// const zoomOut = () => {};
const showPinInfo = () => { showAlert('info', `Office Location: ${selectedOffice.value?.name} at ${selectedOffice.value?.address}`); };

// Watch for route changes
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    offices.value = [];
    fetchBranchData();
    fetchOffices(newId);
  }
});

// Lifecycle
onMounted(() => {
  if (branchId) {
    fetchBranchData();
    fetchOffices(branchId);
  } else {
    showAlert('info', 'Please select a branch to view its offices.');
  }
});
</script>

<style scoped>
.branch-offices-page {
  width: 100%;
}

.breadcrumb {
  background: none;
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item {
  color: #6c757d;
  font-size: 0.875rem;
}

.breadcrumb-item a {
  color: #ffc107;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}

.breadcrumb-item a:hover {
  color: #e0a800;
}

.breadcrumb-item.active {
  color: #495057;
  font-weight: 600;
}

.card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.card-header {
  background: #f8f9fa !important;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2c3e50;
}

.branch-icon {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.branch-icon i {
  color: #007bff;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

.btn-group .btn {
  margin-right: 0.25rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .ms-auto {
    margin-left: 0 !important;
    width: 100%;
  }

  .table-responsive {
    font-size: 0.875rem;
  }

  .btn-group {
    flex-direction: column;
  }

  .btn-group .btn {
    margin-right: 0;
    margin-bottom: 0.25rem;
  }
}

/* Map and Modal Styles */
.map-container {
  border: 1px solid #dee2e6;
  overflow: hidden;
  border-radius: 8px;
}

.map-background {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%);
}

/* Interactive Map Pin Styles */
.interactive-map-pin {
  transition: all 0.3s ease;
}

.pin-marker {
  position: relative;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.pin-marker:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
}

.pin-hover {
  animation: pulse 1.5s infinite;
}

.pin-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid #f44336;
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
  pointer-events: none;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* Pin Tooltip */
.pin-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  z-index: 1000;
}

.tooltip-content {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  text-align: center;
}

.tooltip-content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: white;
}

/* Map Coordinates and Scale */
.map-coordinates,
.map-scale {
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.map-controls .btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
}

.map-controls .btn:hover {
  background-color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.office-details {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  height: 100%;
}

.office-details ul li {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.office-details ul li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.modal-lg {
  max-width: 900px;
}

.modal-body {
  padding: 1.5rem;
}
</style>
