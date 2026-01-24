<template>
  <div>


    <!-- City Table -->
    <div class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">

          <div class="custom-table p-3">
            <StandardDataTable :columns="columns" :data="cities" :loading="isLoading" :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
              :actionButtons="pageActions">
              <template #region="{ row }">
                <span>{{ row.region?.name || row.region || 'N/A' }}</span>
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
    <button class="btn btn-outline-secondary btn-sm" @click="openModal(row)">
      <i class="fa fa-edit"></i>
    </button>
    <!-- <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-danger btn-sm" @click="deleteCity(row.id)">
      <i class="fa fa-trash"></i>
    </button> -->
  </div>
</template>
</StandardDataTable>
</div>
</div>
</div>
</div>

<!-- City Modal -->
<div class="modal fade" id="cityModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-scrollable modal-xl">
    <div class="modal-content vh-100">
      <div class="modal-header">
        <h5 class="modal-title">{{ currentCity.id ? 'Edit City' : 'City(s) Registering Form' }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div v-if="editCity">
          <div class="mb-3">
            <label>Region</label>
            <Multiselect v-model="currentCity.region_id" :options="regions" label="name" track-by="id"
              placeholder="Select a region" />
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
          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th>Region</th>
                <th>City Name</th>
                <th>City Code</th>
                <th v-if="cityForm.length > 1" style="width: 120px;">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(city, idx) in cityForm" :key="idx">

                <!-- REGION -->
                <td>
                  <Multiselect v-model="city.region_id" :options="regions" label="name" track-by="id"
                    placeholder="Select Region" />
                </td>

                <!-- CITY NAME -->
                <td>
                  <input v-model="city.name" @input="city.name = $event.target.value.toUpperCase()" type="text"
                    class="form-control" />
                </td>

                <!-- CITY CODE -->
                <td>
                  <input v-model="city.code" @input="city.code = $event.target.value.toUpperCase()" type="text"
                    class="form-control" />
                </td>

                <!-- REMOVE BUTTON -->
                <td v-if="cityForm.length > 1">
                  <button class="btn btn-outline-danger w-100" @click="removeCity(idx)">
                    Remove
                  </button>
                </td>

              </tr>
            </tbody>
          </table>


        </div>       
      </div>
       <div class="modal-footer">
          <button class="btn btn-danger" data-bs-dismiss="modal">Cancel</button>
          <button v-if="!editCity" class="btn btn-outline-secondary" @click="addCity">+ Add Another City</button>
          <button class="btn btn-primary" @click="saveCity">{{ currentCity.id ? 'Update' : 'Save' }}</button>
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
import { ref, onMounted, computed, defineComponent, h } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');

const { showAlert } = useNotification();
const authStore = useAuthStore();
const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const VClientTable = defineComponent({
  name: 'VClientTable',
  props: {
    data: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    options: { type: Object, default: () => ({}) },
  },
  setup(props, { slots }) {
    const normalizeLabel = (value) => {
      const text = String(value || '').replace(/_/g, ' ')
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
    }

    return () => h('table', { class: 'table table-bordered align-middle' }, [
      h('thead', { class: 'table-light' }, [
        h('tr', {}, (props.columns || []).map((col) => h('th', {}, normalizeLabel(col))))
      ]),
      h('tbody', {}, (props.data || []).map((row) => (
        h('tr', {}, (props.columns || []).map((col) => {
          const slot = slots[col]
          if (slot) {
            return h('td', {}, slot({ row }))
          }
          return h('td', {}, row?.[col] ?? '')
        }))
      )))
    ])
  }
})

const pageActions = computed(() => {
  const actions = [];
   if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchCities())
    });
  }
  if (true) {
    actions.push({
      label: "Register City(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
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
const resolveId = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value.id ?? null
  return value
}

const resolveStatusId = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value.id ?? null
  return value
}

const add_stops = ref(false);
const status = ref(1);
const isLoading = ref(false);
const cities = ref([]);
const stopsList = ref([]);
const stopsColumns = ref(['stop', 'is_terminal', 'status', 'actions']);
const stopsTableOptions = ref({
  perPage: 5,
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['stop', 'company', 'route'],
  pagination: { nav: 'scroll', chunk: 5 },
});
const regions = ref([]);
const currentCity = ref({ id: null, status: 1, name: '', code: "", region_id: null });
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
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'code', label: 'Code', visible: true, sortable: false },
  { key: 'region', label: 'Region', visible: true, sortable: false },
  { key: 'total_branches', label: 'Total Branches', visible: true, sortable: false },
  { key: 'total_offices', label: 'Total Offices', visible: true, sortable: false },
  { key: 'status', label: 'Status', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const cityForm = ref([]);


const addCity = () => {
  // console.log("Before push:", cityForm.value, typeof cityForm.value);
  cityForm.value.unshift({
    region_id: '',
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
// const addStop = () => {
//   stopsForm.value.push(
//     {
//       stop: '',
//       company: 2,
//       region: selectedCity.value.id,
//       route: '',
//       is_terminal: 1,
//       coordinates: '',
//       time: '',
//       status: 1,
//     });
// };
// const removeStop = (idx) => {
//   stopsForm.value.splice(idx, 1);
// };

// Submit stops
// const submitStops = async () => {
//   try {
//     const stop = stopsForm.value[0];
//     if (!stop.stop) {
//       showAlert('error', 'Please fill all required fields');
//       return;
//     }

//     if (isEditingStop.value && editingStopId.value) {
//       // Update existing stop
//       await axiosInstance.put(`/locations/stops/${editingStopId.value}`, stop);
//       showAlert('success', 'Stop updated successfully');
//     } else {
//       // Create new stops (bulk)
//       const param = {
//         city_id: selectedCity.value.id,
//         stops: stopsForm.value
//       };
//       await axiosInstance.post('/locations/stops', param);
//       showAlert('success', 'Stops added successfully');
//     }

//     await fetchStops(selectedCity.value.id);
//     // Reset form and editing state
//     stopsForm.value = [{
//       city_id: selectedCity.value.id,
//       stop: '',
//       company: 2,
//       region: selectedCity.value.id,
//       route: '',
//       is_terminal: 1,
//       coordinates: '',
//       time: '',
//       status: 1,
//     }];
//     isEditingStop.value = false;
//     editingStopId.value = null;
//     add_stops.value = false;
//   } catch (error) {
//     showAlert('error', 'Failed to save stop');
//   }
// };

// const stopsList = ref([]);
// const stopsColumns = ref([
//   'stop', 'is_terminal', 'status', 'actions'
// ]);
// const stopsTableOptions = ref({
//   perPage: 5,
//   skin: 'table',
//   columnsClasses: { actions: 'actions text-center' },
//   sortable: ['stop', 'company', 'route'],
//   pagination: { nav: 'scroll', chunk: 5 },
// });

// Fetch stops for selected city
// const fetchStops = async (cityId) => {
//   try {
//     const response = await axiosInstance.get(`/locations/stops?city_id=${cityId}`);
//     stopsList.value = response.data.data || response.data;
//   } catch (error) {
//     showAlert('error', 'Failed to fetch stops');
//   }
// };

// Open Stops Modal
// const openStopsModal = async (city) => {
//   selectedCity.value = city;
//   stopsForm.value = [
//     {
//       city_id: city.id,
//       stop: '',
//       company: 2,
//       region: city.id,
//       route: '',
//       is_terminal: 1,
//       coordinates: '',
//       time: '',
//       status: 1,
//     }
//   ];
//   await fetchStops(city.id);
//   stopsModal.value = new Modal(document.getElementById('stopsModal'));
//   stopsModal.value.show();
// };

// // Edit stop
// const editStop = (stop) => {
//   stopsForm.value = [{
//     ...stop,
//     status: stop.status === 'active' ? 1 : 0,
//   }];
//   isEditingStop.value = true;
//   editingStopId.value = stop.id;
//   add_stops.value = true; // Show the form for editing
// };

// // Update stop
// const updateStop = async () => {
//   const stop = stopsForm.value[0];
//   try {
//     await axiosInstance.put(`/locations/stops/${stop.id}`, stop);
//     showAlert('success', 'Stop updated successfully');
//     await fetchStops(selectedCity.value.id);
//     stopsForm.value = [{
//       city_id: selectedCity.value.id,
//       stop: '',
//       company: 2,
//       region: selectedCity.value.id,
//       route: '',
//       is_terminal: 1,
//       coordinates: '',
//       time: '',
//       status: 1,
//     }];
//   } catch (error) {
//     showAlert('error', 'Failed to update stop');
//   }
// };

// Delete stop
// const deleteStop = async (id) => {
//   if (!confirm('Are you sure you want to delete this stop?')) return;
//   try {
//     await axiosInstance.delete(`/locations/stops/${id}`);
//     showAlert('success', 'Stop deleted successfully');
//     await fetchStops(selectedCity.value.id);
//   } catch (error) {
//     showAlert('error', 'Failed to delete stop');
//   }
// };
onMounted(async () => {
  await fetchCities();
  await fetchRegions();
});

// Fetch cities
const fetchCities = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('locations?type=CITY');
    const data = response.data.data || response.data;
    cities.value = (Array.isArray(data) ? data : []).map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        name: d.name,
        code: d.code,
        region: d.region || d.parent_name,
        priority: d.priority,
        total_branches: d.total_branches || 0,
        total_offices: d.total_offices || 0,
        status: d.status || (d.is_disabled ? 0 : 1),
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch cities');
  } finally {
    isLoading.value = false;
  }
};

// Fetch regions
const fetchRegions = async () => {
  try {
    const response = await axiosInstance.get('/locations?type=REGION');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    regions.value = rows;
  } catch (error) {
    showAlert('error', 'Failed to fetch regions');
  }
};

// Open modal for create/update
const openModal = async (city = null) => {
  if (!regions.value.length) {
    await fetchRegions();
  }

  // console.log("test", city);

  if (city) {
    editCity.value = true;
    const statusId = typeof city.status === 'number' ? city.status : (city.is_disabled ? 0 : 1);
    currentCity.value = {
      ...city,
      region_id: city.region || city.parent || null,
      status: statuses.value.find((s) => s.id === statusId) || statuses.value[0],
    };
  } else {
    editCity.value = false;
    currentCity.value = {
      id: null,
      status: statuses.value[0] || { id: 1, name: 'Active' },
      name: '',
      code: '',
      region_id: null,
    };
    cityForm.value = [];
    addCity();
  }

  formModal.value = new Modal(document.getElementById('cityModal'));
  formModal.value.show();
};


function checkDuplication(uniqueFields, dataArray) {

  for (const field of uniqueFields) {
    const values = dataArray.value.map(d =>
      (d[field] || "").trim().toUpperCase()
    );

    const duplicates = values.filter((v, i) => values.indexOf(v) !== i);

    if (duplicates.length > 0) {
      showAlert("info", `Duplicate ${field.toUpperCase()} found: ${duplicates[0]}`);
      return false;
    }
  }
  return true;
}



// Save city (create/update)
const saveCity = async () => {
  try {
    let response;
    if (currentCity.value.id) {
      const statusId = resolveStatusId(currentCity.value.status)
      const payload = {
        "location_id": resolveId(currentCity.value.region_id || currentCity.value.region || currentCity.value.parent),
        "name": currentCity.value.name,
        "code": (currentCity.value.code || '').toUpperCase(),
        "type": "CITY",
        "operation_type": "PHYSICAL_LOCATION",
        "is_disabled": statusId === 0,
      }

      response = await axiosInstance.put(`/locations/${currentCity.value.id}`, payload);
    } else {
      if (!checkDuplication(['name'], cityForm)) {
        return;
      }

      // Create cities one by one using the documented API format
      for (const d of cityForm.value) {
        const statusId = resolveStatusId(d.status)
        const payload = {
          location_id: resolveId(d.region_id),
          name: d.name,
          code: (d.code || '').toUpperCase(),
          type: "CITY",
          operation_type: "PHYSICAL_LOCATION",
          is_disabled: statusId === 0,
        };
        response = await axiosInstance.post('/locations', payload);
      }
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
};


// Delete city
const deleteCity = async (id) => {
  if (!confirm('Are you sure you want to delete this city?')) return;

  try {
    await axiosInstance.delete(`/locations/${id}`);
    showAlert('success', 'City deleted successfully');
    await fetchCities();
  } catch (error) {
    showAlert('error', 'Failed to delete city');
  }
};
































</script>
