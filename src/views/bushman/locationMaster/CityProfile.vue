<template>
  <div class="city-profile-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="javascript:;" @click="$router.push('/abs/location')">LOCATION MASTER</a>
        </li>
        <li class="breadcrumb-item"><a href="javascript:;">CITIES</a></li>
        <li class="breadcrumb-item active">{{ cityId ? (city.name || 'Loading...') : 'City Details' }}</li>
      </ol>
    </div>

    <!-- City Header Card -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
            <div class="d-flex align-items-center">
              <div class="city-icon me-2">
                <i class="fa fa-city fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">{{ cityId ? (city.name || 'Loading...') : 'Select a City' }}</h4>
                <small class="text-muted">{{ cityId ? (city.country || 'City details loading...') : 'Choose a city from   the location list to view its profile' }}</small>
              </div>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
              <button @click="refreshData" class="text-decoration-none text-body text-opacity-50"
                :disabled="loading || !cityId">
                <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i> Refresh
              </button>
              <!-- <button class="btn btn-outline-secondary btn-sm" :disabled="!cityId">Unwatch</button> -->
              <!-- <button class="btn btn-outline-primary btn-sm" :disabled="!cityId">Edit</button> -->
              <!-- <button class="btn btn-success btn-sm" :disabled="!cityId">+ Add Branch</button> -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="row gx-4 mt-0">
      <div class="col-lg-12">
        <div class="card tabs-card">
          <div class="card-body p-0">
            <ul class="nav nav-tabs nav-fill">
              <li class="nav-item" v-for="tab in tabs" :key="tab.key">
                <a class="nav-link" :class="{ active: activeTab === tab.key }" href="#"
                  @click.prevent="activeTab = tab.key">
                  <i :class="tab.icon" class="me-2"></i>{{ tab.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <!-- No City Selected Message -->
          <div v-if="!cityId" class="text-center py-5">
            <i class="fa fa-city fa-4x text-muted mb-3"></i>
            <h4 class="text-muted">No City Selected</h4>
            <p class="text-muted">Please select a city from the location list to view its details.</p>
            <button @click="$router.push('/abs/location')" class="btn btn-primary">
              <i class="fa fa-arrow-left me-2"></i>Go to Location List
            </button>
          </div>

          <!-- City Details Content -->
          <div v-else-if="cityId" class="row">
            <!-- Left Column (Details) -->
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">City Details</div>
                <div class="card-body">
                  <ul class="list-unstyled">
                    <li class="mb-2">Name: {{ city.name || 'Loading...' }}</li>
                    <li class="mb-2">Country: {{ city.country || 'Loading...' }}</li>
                    <li class="mb-2">Status: <span class="badge bg-success">Active</span></li>
                    <li class="mb-2">Total Branches: {{ city.branchCount || 0 }}</li>
                    <li class="mb-2">Total Offices: {{ city.officeCount || 0 }}</li>
                    <!-- <li class="mb-2">Total Service Points: {{ city.servicePointCount || 0 }}</li>
                    <li class="mb-2">Population: {{ city.population || 'N/A' }}</li>
                    <li class="mb-2">Region: {{ city.region || 'N/A' }}</li> -->
                    <li class="mb-2">Timezone: {{ city.timezone || 'N/A' }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Right Column (Summary & Stats) -->
            <div class="col-md-6">
              <!-- City Summary -->
              <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span>City Summary</span>
                </div>
                <div class="card-body">
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="stat-item">
                        <h3 class="text-primary">{{ city.branchCount || 0 }}</h3>
                        <small class="text-muted">Total Branches</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-item">
                        <h3 class="text-success">{{ city.officeCount || 0 }}</h3>
                        <small class="text-muted">Total Offices</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span>Recent Activity</span>
                  <button class="btn btn-sm btn-outline-primary">View All</button>
                </div>
                <div class="card-body">
                  <ul class="list-group">
                    <li class="list-group-item" v-for="activity in recentActivities" :key="activity.id">
                      <div class="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{{ activity.title }}</strong>
                          <p class="mb-1 small text-muted">{{ activity.description }}</p>
                        </div>
                        <small class="text-muted">{{ activity.date }}</small>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Branches Tab -->
        <div v-else-if="activeTab === 'branches'" class="tab-panel">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>Branches in {{ city.name }}</span>
              <button class="btn btn-sm btn-success" @click="openModal()">+ Add Branch</button>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center py-3">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
              <div v-else-if="branches.length === 0" class="text-center py-3">
                <p class="text-muted">No branches found for this city.</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Branch Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th># Offices</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="branch in branches" :key="branch.id">
                      <td>{{ branch.name }}</td>
                      <td>{{ branch.address }}</td>
                      <td>{{ branch.phone }}</td>
                      <td>
                        <span class="badge bg-info">{{ branch.officeCount }}</span>
                      </td>
                      <td>
                        <span class="badge" :class="branch.status === 'Active' ? 'bg-success' : 'bg-danger'">
                          {{ branch.status }}
                        </span>
                      </td>
                      <td class=" d-flex gap-2 text-center">
                        <button @click="viewBranchOffices(branch)"
                          class="btn btn-sm btn-outline-primary d-flex justify-content-center align-items-center">
                          <i class="fa fa-eye"></i>
                        </button>
                        <button @click="openModal(branch)"
                          class="btn btn-sm btn-outline-dark d-flex justify-content-center align-items-center">
                          <i class="fa fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <!-- Default Tab -->
        <div v-else class="tab-panel">
          <h5>{{ getTabLabel(activeTab) }}</h5>
          <p>Content for {{ getTabLabel(activeTab) }} will be displayed here.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="branchModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ currentBranch.id ? 'Edit Branch' : 'Add Branch' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label>Branch Name</label>
            <input v-model="currentBranch.name" type="text" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button class="btn btn-primary" @click="saveBranch">{{ currentBranch.id ? 'Update' : 'Save' }}</button>
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
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';




const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { showAlert } = useNotification();

const axiosInstance = axios.create({
  baseURL: API_URL4,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

// State
const loading = ref(false);
const activeTab = ref('overview');
const cityId = route.params.id;
const currentBranch = ref({ id: null, name: '', city_id: '', entity_id: 1 });
const formModal = ref(null);


// Tabs configuration
const tabs = ref([
  { key: 'overview', label: 'Overview', icon: 'fa fa-home' },
  { key: 'branches', label: 'Branches', icon: 'fa fa-shop' }
]);

// City data
const city = ref({
  name: '',
  country: '',
  branchCount: 0,
  officeCount: 0,
  population: '',
  region: '',
  timezone: ''
});

// API-loaded data
const branches = ref([]);
const hasLoadedBranches = ref(false);

const recentActivities = ref([
  { id: 1, title: 'New Branch Added', description: 'A branch was added', date: '2 hours ago' },
  { id: 2, title: 'Office Updated', description: 'Office contact information updated', date: '1 day ago' },
  { id: 3, title: 'City Information Updated', description: 'City details were updated', date: '3 days ago' }
]);

// Methods
const fetchCityData = async () => {
  try {
    const url = `${API_URL4}cities`;
    const response = await axios.get(url);
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    const idNum = Number(cityId);
    const found = list.find(c => Number(c.id) === idNum);
    if (found) {
      const countryName = found.country || (found.country_id === 1 ? 'Tanzania' : (found.country_id === 2 ? 'Kenya' : 'N/A'));
      city.value = {
        name: found.name || found.city || 'Unknown City',
        country: countryName,
        branchCount: found.total_branches || 0,
        officeCount: found.total_offices || 0,
        population: city.value.population || '',
        region: found.region || '',
        timezone: 'EAT (UTC+3)'
      };

      // Update branches data if available in the response
      if (found.branches && Array.isArray(found.branches)) {
        branches.value = found.branches.map(b => ({
          id: b.id,
          name: b.name || 'Unnamed Branch',
          address: b.address || 'N/A',
          phone: b.phone || 'N/A',
          status: 'Active',
          officeCount: Number(b.offices_count || 0)
        }));
        hasLoadedBranches.value = true;
      }
    } else {
      city.value = {
        name: 'Unknown City',
        country: 'N/A',
        branchCount: 0,
        officeCount: 0,
        population: '',
        region: '',
        timezone: 'N/A'
      };
    }
  } catch (error) {
    console.error('Error fetching city data:', error);
    showAlert('error', 'Failed to fetch city data');
  }
};

const fetchBranches = async (id) => {
  try {
    loading.value = true;
    const url = `${API_URL4}city-branches`;
    const response = await axios.get(url, { params: { city_id: route.params.id } });
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    branches.value = list.map(b => ({
      id: b.id,
      name: b.name || b.branch_name || 'Unnamed Branch',
      address: b.address || b.location || 'N/A',
      phone: b.phone || b.phone_number || 'N/A',
      status: b.status || 'Active',
      officeCount: Number(b.offices_count || b.office_count || 0)
    }));
    city.value.branchCount = branches.value.length;
    hasLoadedBranches.value = true;
  } catch (error) {
    console.error('Error fetching branches:', error);
    showAlert('error', 'Failed to fetch branches for this city');
    branches.value = [];
  } finally {
    loading.value = false;
  }
};

const ensureBranchesLoaded = async () => {
  if (!hasLoadedBranches.value && cityId) {
    await fetchBranches(cityId);
  }
};

const refreshData = async () => {
  await fetchCityData();
  if (activeTab.value === 'branches') {
    await ensureBranchesLoaded();
  }
};

const getTabLabel = (tabKey) => {
  const tab = tabs.value.find(t => t.key === tabKey);
  return tab ? tab.label : 'Unknown Tab';
};

const viewBranchOffices = (branch) => {
  router.push(`/abs/location/branch/${branch.id}/offices`);
};




// Watch for tab changes to lazy-load
watch(activeTab, async (newTab) => {
  if (newTab === 'branches') {
    await ensureBranchesLoaded();
  }
});

// Watch for route changes
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    branches.value = [];
    hasLoadedBranches.value = false;
    fetchCityData();
    if (activeTab.value === 'branches') {
      ensureBranchesLoaded();
    }
  }
});




const openModal = (branch = null) => {
  if (branch) {
    currentBranch.value = { ...branch };
  } else {
    currentBranch.value = { id: null, name: '', city_id: '' };
  }
  formModal.value = new Modal(document.getElementById('branchModal'));
  formModal.value.show();
};

// Save branch
const saveBranch = async () => {
  // console.log(currentBranch.value);

  try {
    let response;
    if (currentBranch.value.id) {
      const params = {
        'city_id': currentBranch.value.city_id,
        //  "entity_id" : currentBranch.value.entity_id,
        "name": currentBranch.value.name
      }
      response = await axiosInstance.put(`branches/${currentBranch.value.id}`, params);
    } else {
      const params = {
        'city_id': route.params.id,
        "name": currentBranch.value.name.toUpperCase()
      }

      response = await axiosInstance.post('branches', params);
    }

    showAlert('success', 'Branch saved successfully');
    formModal.value.hide();
    await fetchBranches();
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};

// Delete branch
const deleteBranch = async (id) => {
  if (!confirm('Are you sure you want to delete this branch?')) return;

  try {
    await axiosInstance.delete(`branches/${id}`);
    showAlert('success', 'Branch deleted successfully');
    await fetchBranches();
  } catch (error) {
    showAlert('error', 'Failed to delete branch');
  }
};

// Lifecycle
onMounted(() => {
  if (cityId) {
    fetchCityData();
    // Do not load branches yet; wait for branches tab
  } else {
    showAlert('info', 'Please select a city from the location list to view its details.');
  }
});
</script>

<style scoped>
.city-profile-page {
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

.tabs-card {
  border-radius: 0 !important;
}

.card-header {
  background: #f8f9fa !important;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2c3e50;
}

.city-icon {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.city-icon i {
  color: #007bff;
}

.nav-tabs {
  border-bottom: 1px solid #dee2e6;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
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

.nav-tabs .nav-link.active {
  background: #e7f5ef;
  color: #0f5132;
  border-bottom: 3px solid #0f5132;
  font-weight: 600;
  position: relative;
}

.nav-tabs .nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: #0f5132;
  border-radius: 2px 2px 0 0;
}

.tab-panel {
  min-height: 400px;
}

.list-group-item {
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

.stat-item h3 {
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.stat-item small {
  font-size: 0.75rem;
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

  .nav-tabs {
    flex-wrap: wrap;
  }

  .nav-tabs .nav-link {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
