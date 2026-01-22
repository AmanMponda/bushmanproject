<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/notification';
import axios from 'axios';
import { Modal } from 'bootstrap';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { API_URL4 } from '@/config/config.js';
import { useAuthStore } from "@/stores/auth";


const router = useRouter();
const { showAlert } = useNotification();
const authStore = useAuthStore();
// State
const countries = ref([]);
const loading = ref(false);
const cities = ref([]);
const searchQuery = ref('');
const currentCity = ref({ id: null, status: '1', name: '', country_id: '' });
const formModal = ref(null);
const axiosInstance = axios.create({
  baseURL: API_URL4,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});
// Load from API
const fetchCities = async () => {
  try {
    loading.value = true;
    const url = `${API_URL4}cities`;
    const response = await axios.get(url);
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    cities.value = list.map(c => ({
      id: c.id,
      name: c.name || c.city || 'Unnamed City',
      country: c.country || 'Tanzania',
      branchCount: Number(c.total_branches || 0),
      officeCount: Number(c.total_offices || 0),
      status: 'Active'
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    showAlert('error', 'Failed to fetch cities data');
    cities.value = [];
  } finally {
    loading.value = false;
  }
};

// Computed properties
const filteredCities = computed(() => {
  if (!searchQuery.value) return cities.value;

  return cities.value.filter(city =>
    (city.name || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (city.country || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Methods
const viewCityProfile = (city) => {
  router.push(`/abs/location/city/${city.id}`);
};

const refreshData = () => {
  fetchCities();
};



const fetchCountries = async () => {
  try {
    const response = await axiosInstance.get('countries');
    countries.value = response.data.data || response.data;
  } catch (error) {
    showAlert('error', 'Failed to fetch countries');
  }
};
const openModal = (city = null) => {
  fetchCountries();
  if (city) {
    currentCity.value = { ...city };
  } else {
    currentCity.value = { id: null, name: '', country_id: '', status: "" };
  }
  // console.log("IT WORKES");

  formModal.value = new Modal(document.getElementById('cityModal'));
  formModal.value.show();
};


const saveCity = async () => {
  try {
    let response;
    if (currentCity.value.id) {
      const payload = {
        "country_id": currentCity.value.country_id.id,
        "name": currentCity.value.name.toUpperCase(),
        "city": currentCity.value.name.toUpperCase(),
        "status": currentCity.value.status.id,
      }
      response = await axiosInstance.put(`cities/${currentCity.value.id}`, payload);
    } else {
      // console.log(currentCity.value);
      const payload = {
        "country_id": currentCity.value.country_id.id,
        "name": currentCity.value.name.toUpperCase(),
        "city": currentCity.value.name.toUpperCase(),
        "status": 1,
      }
      response = await axiosInstance.post('cities', payload);
    }

    showAlert('success', 'City saved successfully');
    formModal.value.hide();
    await fetchCities();
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};
// Lifecycle
onMounted(() => {
  fetchCities();
});
</script>

<template>
  <div class="location-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="javascript:;">LOCATION MASTER</a></li>
        <li class="breadcrumb-item active">CITIES</li>
      </ol>
    </div>

    <!-- Header Card -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
            <div class="d-flex align-items-center">
              <div class="location-icon me-2">
                <i class="fa fa-city fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">City Management</h4>
                <small class="text-muted">Manage cities, branches, and offices across all locations</small>
              </div>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
              <button @click="refreshData" class="text-decoration-none text-body text-opacity-50" :disabled="loading">
                <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i> Refresh
              </button>
              <button class="btn btn-success btn-sm" @click="openModal()">
                <i class="fa fa-plus me-1"></i> Add City
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <!-- Search and Filters -->
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div class="flex-grow-1" style="max-width: 350px">
                <div class="input-group">
                  <span class="input-group-text bg-transparent">
                    <i class="fa fa-search"></i>
                  </span>
                  <input type="text" class="form-control" placeholder="Search cities..." v-model="searchQuery" />
                  <button class="btn btn-outline-secondary" @click="searchQuery = ''">
                    <i class="fa fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-outline-info" @click="refreshData" title="Refresh">
                  <i class="fa fa-sync-alt"></i>
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading cities...</p>
            </div>

            <!-- No Data State -->
            <div v-else-if="!filteredCities.length" class="text-center py-5">
              <div class="text-muted">
                <i class="fa fa-map-marker fa-3x mb-3"></i>
                <h4>No cities found</h4>
                <p>{{ searchQuery ? 'Try adjusting your search' : 'No cities available' }}</p>
                <button class="btn btn-outline-primary mt-2" @click="refreshData">
                  <i class="fa fa-sync-alt me-1"></i> Refresh
                </button>
              </div>
            </div>

            <!-- Data Table -->
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>City Name</th>
                    <th>Country</th>
                    <th># Branches</th>
                    <th># Offices</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(city, index) in filteredCities" :key="city.id">
                    <td class="fw-semibold text-info">{{ index + 1 }}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <i class="fa fa-city text-primary me-2"></i>
                        <span class="fw-medium">{{ city.name }}</span>
                      </div>
                    </td>
                    <td>{{ city.country }}</td>
                    <td>
                      <span class="badge bg-info">{{ city.branchCount }}</span>
                    </td>
                    <td>
                      <span class="badge bg-success">{{ city.officeCount }}</span>
                    </td>
                    <td>
                      <span class="badge" :class="city.status === 'Active' ? 'bg-success' : 'bg-danger'">
                        {{ city.status }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-outline-primary btn-sm" @click="viewCityProfile(city)"
                        title="View City Profile">
                        <i class="fa fa-eye"></i>
                      </button>
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
  <div class="modal fade" id="cityModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ currentCity.id ? 'City Editing Form' : 'City Registration Form' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label>Country</label>
            <Multiselect v-model="currentCity.country_id" :options="countries" label="name" track-by="id"
              placeholder="Select Country" />
          </div>
          <div class="mb-3">
            <label>City Name</label>
            <input v-model="currentCity.name" type="text" class="form-control" />
          </div>
          <!-- <div class="mb-3">
            <label>Status</label>
            <Multiselect v-model="currentCity.status" :options="statuses" label="name" track-by="id"
              placeholder="Select Status" />
          </div> -->
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" @click="saveCity">{{ currentCity.id ? 'Update' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>




</template>

<style scoped>
.location-page {
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

.location-icon {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.location-icon i {
  color: #007bff;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

.table th {
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
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
}
</style>