<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="d-flex justify-content-center mx-5 mt-3 mb-5">
      <div class="spinner-border spinner-border-sm text-info"></div>
    </div>

    <!-- City Table -->
    <div v-else class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">

          <div class="custom-table p-3">
            <StandardDataTable :columns="columns" :data="cities" :loading="isLoading" :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
              :actionButtons="pageActions">
              <<template #country="{ row }">
                <span>{{ row.country?.name || 'N/A' }}</span>
</template>
<template #total_branches="{ row }">
  <button class=" btn btn-light rounded-pill fs-6">
    <i class="bi bi-buildings me-2" style="color: #74C0FC;"></i>{{ row.total_branches || 0 }}
  </button>

</template>
<template #total_offices="{ row }">
  <button class=" btn btn-light rounded-pill fs-6">
    <i class="bi bi-building-fill me-2" style="color: #74C0FC;"></i> {{ row.total_offices || 0 }}
  </button>

</template>
<template #status="{ row }">
  <span v-if="row.status == 1" class="badge bg-success">
    Active
  </span>
  <span v-else class="badge bg-danger">
    Inactive
  </span>
</template>
<template #actions="{ row }">
  <div class="d-flex gap-1">
    <button class="btn btn-secondary btn-sm" @click="openModal(row)">
      <i class="fa fa-edit"></i>
    </button>
    <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-danger btn-sm" @click="deleteCity(row.id)">
      <i class="fa fa-trash"></i>
    </button>
  </div>
</template>
</StandardDataTable>
<!-- <v-client-table :data="cities" :columns="columns" :options="table_option">
  <template #country="props">
    <span>{{ props.row.country?.name || 'N/A' }}</span>
  </template>
  <template #total_branches="props">
    <span class="badge bg-info">{{ props.row.total_branches || 0 }}</span>
  </template>
  <template #total_offices="props">
    <span class="badge bg-success">{{ props.row.total_offices || 0 }}</span>
  </template>
  <template #status="props">
    <span v-if="props.row.status == 1" class="badge bg-success">
      Active
    </span>
    <span v-else class="badge bg-danger">
      Inactive
    </span>
  </template>

  <template #actions="props">
    <button class="btn btn-sm me-1" @click="openStopsModal(props.row)">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="feather feather-map-pin text-primary">
        <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </button>

    <button class="btn btn-sm me-1" @click="openModal(props.row)">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="feather feather-edit-2 ">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
      </svg>
    </button>
    <button class="btn btn-sm " @click="deleteCity(props.row.id)">

      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="feather feather-trash-2 text-danger">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </button>
  </template>
</v-client-table> -->
</div>
</div>
</div>
</div>

<!-- City Modal -->
<div class="modal fade" id="cityModal" tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{{ currentCity.id ? 'Edit City' : 'City(s) Registering Form' }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div v-if="editCity">
          <div class="mb-3">
            <label>Country</label>
            <Multiselect v-model="currentCity.country_id" :options="countries" label="name" track-by="id"
              placeholder="Select Country" />
          </div>
          <div class="mb-3">
            <label>City Name</label>
            <input :value="currentCity.name" @input="currentCity.name = $event.target.value.toUpperCase()" type="text"
              class="form-control" />
          </div>
          <div class="mb-3">
            <label>City Code</label>
            <input :value="currentCity.code" @input="currentCity.code = $event.target.value.toUpperCase()" type="text"
              class="form-control" />
          </div>

          <div class="mb-3">
            <label>Status</label>
            <Multiselect v-model="currentCity.status" :options="statuses" label="name" track-by="id"
              placeholder="Select Status" />
          </div>
        </div>
        <div v-else>
          <div v-for="(city, idx) in cityForm" :key="idx" class="border rounded p-2 mb-2">
            <div class="row g-2">

              <!-- COUNTRY -->
              <div :class="cityForm.length === 1 ? 'col-4' : 'col-md-3'">
                <label class="form-label small mb-1">Country</label>
                <Multiselect v-model="city.country_id" :options="countries" label="name" track-by="id"
                  placeholder="Select Country" />
              </div>

              <!-- CITY NAME -->
              <div :class="cityForm.length === 1 ? 'col-4' : 'col-md-3'">
                <label class="form-label small mb-1">City Name</label>
                <input v-model="city.name" @input="city.name = $event.target.value.toUpperCase()" type="text" class="form-control" />
              </div>

              <!-- CITY CODE -->
              <div :class="cityForm.length === 1 ? 'col-4' : 'col-md-3'">
                <label class="form-label small mb-1">City Code</label>
                <input v-model="city.code" @input="city.code = $event.target.value.toUpperCase()" type="text" class="form-control" />
              </div>

              <!-- REMOVE BUTTON -->
              <div class="col-md-2 d-flex align-items-end" v-if="cityForm.length > 1">
                <button class="btn btn-danger w-100" @click="removeCity(idx)">
                  Remove
                </button>
              </div>

            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button v-if="!editCity" class="btn btn-secondary mb-2" @click="addCity">Add Another City</button>
          <button class="btn btn-primary" @click="saveCity">{{ currentCity.id ? 'Update' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</div>



<div class="modal fade" id="stopsModal" tabindex="-1">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <!-- Fixed Modal Header -->
      <div class="modal-header" style="position: sticky; top: 0; z-index: 2; background: #fff;">
        <h5 class="modal-title">Add Stops</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <!-- Scrollable Modal Body -->
      <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
        <div class="mb-3">
          <button class="btn" :class="add_stops ? 'btn-danger' : 'btn-success'" @click="add_stops = !add_stops">
            {{ add_stops ? 'Close Add Stop' : 'Add Stop' }}
          </button>
        </div>
        <div v-if="add_stops">
          <button class="btn btn-secondary mb-2" @click="addStop">Add Another Stop</button>
          <div v-for="(stop, idx) in [...stopsForm].reverse()" :key="idx" class="border rounded p-3 mb-2">
            <div class="row">
              <div class="col-md-2 mb-2">
                <label>Stop Name</label>
                <input v-model="stop.stop" type="text" class="form-control" required />
              </div>

              <div class="col-md-2 mb-2">
                <label>Is Terminal</label>
                <select v-model="stop.is_terminal" class="form-control">
                  <option :value="1">Yes</option>
                  <option :value="0">No</option>
                </select>
              </div>
              <div class="col-md-2 mb-2">
                <label>Coordinates</label>
                <input v-model="stop.coordinates" type="text" class="form-control" placeholder="lat,lng" />
              </div>
              <div class="col-md-2 mb-2">
                <label>Time</label>
                <input v-model="stop.time" type="time" class="form-control" required />
              </div>
              <div class="col-md-2 mb-2">
                <label>Status</label>
                <select v-model="stop.status" class="form-control">
                  <option :value="1">Active</option>
                  <option :value="0">Inactive</option>
                </select>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button class="btn btn-danger" @click="removeStop(stopsForm.length - 1 - idx)"
                  v-if="stopsForm.length > 1">Remove</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card me-3 ms-3">
          <v-client-table :data="stopsList" :columns="stopsColumns" :options="stopsTableOptions">
            <template #status="props">
              <span v-if="props.row.status == 'active'" class="badge bg-success">Active</span>
              <span v-else class="badge bg-danger">Inactive</span>
            </template>
            <template #is="props">
              <span v-if="props.row.is_terminal == 1" class="badge bg-success">Yes</span>
              <span v-else class="badge bg-danger">No</span>
            </template>
            <template #actions="props">
              <button class="btn btn-sm me-1" @click="editStop(props.row)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <button class="btn btn-sm" @click="deleteStop(props.row.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="feather feather-trash-2 text-danger">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </template>
          </v-client-table>
        </div>
      </div>
      <!-- Fixed Modal Footer -->
      <div class="modal-footer" style="position: sticky; bottom: 0; z-index: 2; background: #fff;">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" @click="submitStops">Submit Stops</button>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { API_URL4 } from "@/config/config";
import { Modal } from 'bootstrap';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";

const { showAlert } = useNotification();
const authStore = useAuthStore();
const axiosInstance = axios.create({
  baseURL: API_URL4,
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
      label: "Register City(s)",
      icon: "fa fa-plus",
      class: "btn btn-outline-info",
      method: () => (openModal())
    });
  }

  return actions;
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
const editCity = ref(false);
const isEditingStop = ref(false);
const editingStopId = ref(null);
const permissions = authStore.permissions;
const statuses = ref([
  { id: 1, name: "Active" },
  { id: 0, name: "Inactive" }
])
const add_stops = ref(false);
const status = ref(1);
const isLoading = ref(false);
const cities = ref([]);
const countries = ref([]);
const currentCity = ref({ id: null, status: '1', name: '', code: "", country_id: '' });
const formModal = ref(null);
// const columns = ref(['sno', 'name', 'total_branches', 'total_offices', 'status', 'actions']);
// const table_option = ref({
//   perPage: 10,
//   perPageValues: [5, 10, 20, 50],
//   skin: 'table',
//   columnsClasses: { actions: 'actions text-center' },
//   sortable: ['name'],
//   pagination: { nav: 'scroll', chunk: 5 },
// });
const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: true },
  { key: 'name', label: 'Name', visible: true, sortable: true },
  { key: 'code', label: 'Code', visible: true, sortable: true },
  { key: 'region', label: 'Region', visible: true, sortable: true },
  { key: 'total_branches', label: 'Total Branches', visible: true, sortable: true },
  { key: 'total_offices', label: 'Total Offices', visible: true, sortable: true },
  { key: 'status', label: 'Status', visible: true, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const cityForm = ref([]);


const addCity = () => {
  //cityForm.value.unshift({
    country_id: '',
    name: '',
    code: '',
    region: '',
    status: 1,
  });

};

const removeCity = (idx) => {
  cityForm.value.splice(idx, 1);
};


const stopsForm = ref([
  {
    city_id: '', // will be set on open
    stop: '',
    company: 2,
    region: '', // will be set on open
    route: '',
    is_terminal: 0,
    coordinates: '',
    time: '',
    status: 1,
  }
]);
const stopsModal = ref(null);
const selectedCity = ref(null);

// Open Stops Modal
// const openStopsModal = (city) => {
//   selectedCity.value = city;
//   stopsForm.value = [
//     {
//       city_id: city.id,
//       stop: '',
//       company: '',
//       region: city.id, // region is city id
//       route: '',
//       is_terminal: 1,
//       coordinates: '',
//       time: '',
//       status: 1,
//     }
//   ];
//   stopsModal.value = new Modal(document.getElementById('stopsModal'));
//   stopsModal.value.show();
// };

// Add/Remove stop entry
const addStop = () => {
  stopsForm.value.push(
    {
      stop: '',
      company: 2,
      region: selectedCity.value.id,
      route: '',
      is_terminal: 1,
      coordinates: '',
      time: '',
      status: 1,
    });
};
const removeStop = (idx) => {
  stopsForm.value.splice(idx, 1);
};

// Submit stops
const submitStops = async () => {
  try {
    const stop = stopsForm.value[0];
    if (!stop.stop) {
      showAlert('error', 'Please fill all required fields');
      return;
    }

    if (isEditingStop.value && editingStopId.value) {
      // Update existing stop
      await axiosInstance.put(`stops/${editingStopId.value}`, stop);
      showAlert('success', 'Stop updated successfully');
    } else {
      // Create new stops (bulk)
      const param = {
        city_id: selectedCity.value.id,
        stops: stopsForm.value
      };
      await axiosInstance.post('stops', param);
      showAlert('success', 'Stops added successfully');
    }

    await fetchStops(selectedCity.value.id);
    // Reset form and editing state
    stopsForm.value = [{
      city_id: selectedCity.value.id,
      stop: '',
      company: 2,
      region: selectedCity.value.id,
      route: '',
      is_terminal: 1,
      coordinates: '',
      time: '',
      status: 1,
    }];
    isEditingStop.value = false;
    editingStopId.value = null;
    add_stops.value = false;
  } catch (error) {
    showAlert('error', 'Failed to save stop');
  }
};

const stopsList = ref([]);
const stopsColumns = ref([
  'stop', 'is_terminal', 'status', 'actions'
]);
const stopsTableOptions = ref({
  perPage: 5,
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['stop', 'company', 'route'],
  pagination: { nav: 'scroll', chunk: 5 },
});

// Fetch stops for selected city
const fetchStops = async (cityId) => {
  try {
    const response = await axiosInstance.get(`stops?city_id=${cityId}`);
    stopsList.value = response.data.data || response.data;
  } catch (error) {
    showAlert('error', 'Failed to fetch stops');
  }
};

// Open Stops Modal
const openStopsModal = async (city) => {
  selectedCity.value = city;
  stopsForm.value = [
    {
      city_id: city.id,
      stop: '',
      company: 2,
      region: city.id,
      route: '',
      is_terminal: 1,
      coordinates: '',
      time: '',
      status: 1,
    }
  ];
  await fetchStops(city.id);
  stopsModal.value = new Modal(document.getElementById('stopsModal'));
  stopsModal.value.show();
};

// Edit stop
const editStop = (stop) => {
  stopsForm.value = [{
    ...stop,
    status: stop.status === 'active' ? 1 : 0,
  }];
  isEditingStop.value = true;
  editingStopId.value = stop.id;
  add_stops.value = true; // Show the form for editing
};

// Update stop
const updateStop = async () => {
  const stop = stopsForm.value[0];
  try {
    await axiosInstance.put(`stops/${stop.id}`, stop);
    showAlert('success', 'Stop updated successfully');
    await fetchStops(selectedCity.value.id);
    stopsForm.value = [{
      city_id: selectedCity.value.id,
      stop: '',
      company: 2,
      region: selectedCity.value.id,
      route: '',
      is_terminal: 1,
      coordinates: '',
      time: '',
      status: 1,
    }];
  } catch (error) {
    showAlert('error', 'Failed to update stop');
  }
};

// Delete stop
const deleteStop = async (id) => {
  if (!confirm('Are you sure you want to delete this stop?')) return;
  try {
    await axiosInstance.delete(`stops/${id}`);
    showAlert('success', 'Stop deleted successfully');
    await fetchStops(selectedCity.value.id);
  } catch (error) {
    showAlert('error', 'Failed to delete stop');
  }
};
onMounted(async () => {
  await fetchCountries();
  await fetchCities();
});

// Fetch cities
const fetchCities = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('cities');
    cities.value = response.data.map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        name: d.name,
        code: d.code,
        region: d.region,
        priority: d.priority,
        country: d.country,
        total_branches: d.total_branches || 0,
        total_offices: d.total_offices || 0,
        status: d.status,
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch cities');
  } finally {
    isLoading.value = false;
  }
};

// Fetch countries
const fetchCountries = async () => {
  try {
    const response = await axiosInstance.get('countries');
    countries.value = response.data.data || response.data;
  } catch (error) {
    showAlert('error', 'Failed to fetch countries');
  }
};

// Open modal for create/update
const openModal = (city = null) => {

  //if (city) {
    editCity.value = true;
    currentCity.value = { ...city };
  } else {
    cityForm.value = [
      {
        country: '',
        name: '', // will be set on open
        code: '',
        region: '',// will be set on open       
        status: 1,
      }
    ];
  }

  formModal.value = new Modal(document.getElementById('cityModal'));
  formModal.value.show();
};



// Save city (create/update)
const saveCity = async () => {
  try {
    let response;
    if (currentCity.value.id) {
      const payload = {
        "country_id": currentCity.value.country_id?.id,
        "name": currentCity.value.name,
        "region": currentCity.value.name,
        "city": currentCity.value.name,
        "status": currentCity.value.status?.id,
        "code":currentCity.value.code,        
        
      }

      response = await axiosInstance.put(`cities/${currentCity.value.id}`, payload);
    } else {
      //const payload = cityForm.value.map(d => {
        return {
          country_id: d.country_id.id, // assuming d.country_id is the selected object
          name: d.name,
          city: d.name,
          region: d.name,
          code: d.code.toUpperCase(),
          status: 1
        };
      });

      response = await axiosInstance.post('cities', { cities: payload });
    }

    showAlert('success', 'City saved successfully');
    formModal.value.hide();
    await fetchCities();
    editCity.value = false;
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
  finally {

  }
};


// Delete city
const deleteCity = async (id) => {
  if (!confirm('Are you sure you want to delete this city?')) return;

  try {
    await axiosInstance.delete(`cities/${id}`);
    showAlert('success', 'City deleted successfully');
    await fetchCities();
  } catch (error) {
    showAlert('error', 'Failed to delete city');
  }
};
































</script>
