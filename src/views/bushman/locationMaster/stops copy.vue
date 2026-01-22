<template>
  <div>
    <!-- Loading Spinner -->
   

    <!-- Stops Table & Form -->
    <div class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">

            <StandardDataTable :columns="columns" :data="stopsList" :loading="isLoading" :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
              :actionButtons="pageActions">
              <template #status="{ row }">
                <span v-if="row.status == 'active'" class="badge bg-success">Active</span>
                <span v-else class="badge bg-danger">Inactive</span>
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" @click="openStopsModal(row, false)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-outline-danger btn-sm"
                    @click="deleteStop(row.id)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Stops Modal -->
    <div class="modal fade" id="stopsModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ selectedStop?.id === '' ? 'Edit Stop' : 'Add Stop(s)' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" @click="selectedStop= ''; "></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedStop.id">
              <div class="row">
                <div class="col-md-4 mb-2">
                  <label>City</label>
                  <Multiselect v-model="selectedStop.city_id" :options="cities" label="name" track-by="id"
                    placeholder="Select City" />
                </div>
                <div class="col-md-4 mb-2">
                  <label>Stop Name</label>
                  <input v-model="selectedStop.stop" type="text" class="form-control" required />
                </div>
                <!-- <div class="col-md-4 mb-2">
                  <label>Route</label>
                  <input v-model="selectedStop.route" type="number" class="form-control" required />
                </div> -->
                <div class="col-md-4 mb-2">
                  <label>Is Terminal</label>
                  <select v-model="selectedStop.is_terminal" class="form-control">
                    <option :value="1">Yes</option>
                    <option :value="0">No</option>
                  </select>
                </div>
                <div class="col-md-4 mb-2">
                  <label>Coordinates</label>
                  <input v-model="selectedStop.coordinates" type="text" class="form-control" placeholder="lat,lng" />
                </div>
                <!-- <div class="col-md-4 mb-2">
                  <label>Time</label>
                  <input v-model="selectedStop.time" type="time" class="form-control" required />
                </div> -->
                <div class="col-md-4 mb-2">
                  <label>Status</label>
                  <select v-model="selectedStop.status" class="form-control">
                    <option :value="1">Active</option>
                    <option :value="0">Inactive</option>
                  </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                  <button class="btn btn-danger" @click="removeStop(idx)" v-if="stopsForm.length > 1">Remove</button>
                </div>
              </div>

            </div>
            <div v-else>
              <table class="table table-bordered align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width: 18%">City</th>
                    <th style="width: 18%">Stop Name</th>
                    <!-- <th style="width: 12%">Route</th> -->
                    <th style="width: 12%">Terminal?</th>
                    <th style="width: 18%">Coordinates</th>
                    <!-- <th style="width: 12%">Time</th> -->
                    <th v-if="stopsForm.length > 1" style="width: 10%">Action</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(stop, idx) in stopsForm" :key="idx">

                    <!-- City -->
                    <td>
                      <Multiselect v-model="stop.city_id" :options="cities" label="name" track-by="id"
                        placeholder="Select City" />
                    </td>

                    <!-- Stop Name -->
                    <td>
                      <input v-model="stop.stop" type="text" class="form-control" required />
                    </td>

                    <!-- Route -->
                    <!-- <td>
                      <input v-model="stop.route" type="number" class="form-control" required />
                    </td> -->

                    <!-- Is Terminal -->
                    <td>
                      <select v-model="stop.is_terminal" class="form-select">
                        <option :value="1">Yes</option>
                        <option :value="0">No</option>
                      </select>
                    </td>

                    <!-- Coordinates -->
                    <td>
                      <input v-model="stop.coordinates" type="text" class="form-control" placeholder="lat,lng" />
                    </td>

                    <!-- Time -->
                    <!-- <td>
                      <input v-model="stop.time" type="time" class="form-control" required />
                    </td> -->

                    <!-- Remove -->
                    <td v-if="stopsForm.length > 1">
                      <button class="btn btn-outline-danger w-100" @click="removeStop(idx)" >
                        Remove
                      </button>
                    </td>

                  </tr>
                </tbody>
              </table>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" data-bs-dismiss="modal" @click="selectedStop= ''">Cancel</button>
            <button v-if="!selectedStop.id" class="btn btn-outline-secondary" @click="addStop">+ Add Another Stop</button>

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
import { Modal } from 'bootstrap';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";

const { showAlert } = useNotification();
const authStore = useAuthStore();

const axiosInstance = axios.create({
  baseURL: API_URL_2,
  // baseURL: "http://127.0.0.1:8000/api/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});
const permissions = authStore.permissions;

const pageActions = computed(() => {
  const actions = [];
  if (true) {
    actions.push({
      label: "Register Stop(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (openStopsModal(null, true))
    });
  }
  return actions;
});

const isLoading = ref(false);
const stopsForm = ref([
  {
    city_id: '',
    stop: '',
    company: '',
    region: '',
    route: '',
    is_terminal: 1,
    coordinates: '',
    time: '',
    status: 1,
  }
]);
const stopsList = ref([]);
const selectedStop = ref({});
const selectedCity = ref(null);
const cities = ref([]);
const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'stop', label: 'Name', visible: true, sortable: false },
  // { key: 'route', label: 'Route', visible: true, sortable: false },
  { key: 'coordinates', label: 'Corordinates', visible: true, sortable: false },
  // { key: 'time', label: 'time', visible: true, sortable: false },
  { key: 'is_terminal', label: 'Is Terminal', visible: true, sortable: false },
  { key: 'status', label: 'Status', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

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
const stopsColumns = ref(['stop', 'route', 'is_terminal', 'coordinates', 'time', 'status', 'actions']);
const stopsTableOptions = ref({
  perPage: 5,
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['stop', 'company', 'route'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const fetchCities = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('locations/cities');
    cities.value = response.data.map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        name: d.stop,
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

// Open Stops Modal
const openStopsModal = async (city, multiple) => {
  fetchCities();
  if (!multiple) {
    selectedStop.value = {
      id: city.id,
      city_id: cities.value.find((d) => d.id === city.region),
      stop: city.stop,
      company: '2',
      region: city.region,
      route: city.route,
      is_terminal: city.is_terminal === 'YES' ? '1' : '0',
      coordinates: city.coordinates,
      time: city.time,
      status: city.status === "active" ? '1' : '0',
    };
  }
  else {
    stopsForm.value = [
      {
        id: '',
        city_id: '',
        stop: '',
        company: '2',
        region: '',
        route: '',
        is_terminal: 1,
        coordinates: '',
        time: '',
        status: 1,
      }
    ];
  }
  // console.log(selectedStop.value);

  // await fetchStops();
  new Modal(document.getElementById('locations/stopsModal')).show();
};

// Add/Remove stop
const addStop = () => {
  stopsForm.value.push({
    city_id: '',
    stop: '',
    company: '2',
    region: '',
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
  for (const stop of stopsForm.value) {
    if (!stop.stop || !stop.company || !stop.route) {
      showAlert('error', 'Please fill all required fields');
      return;
    }
  }
  try {
    const params = stopsForm.value.map((d) => {
      return {
        city_id: d.city_id.id,
        stop: d.stop,
        company: '2',
        region: d.city_id.id,
        route: d.route,
        is_terminal: 1,
        coordinates: d.coordinates,
        time: d.time,
        status: 1,
      }
    }

    )

    await axiosInstance.post('locations/stops', { stops: params });
    showAlert('success', 'Stops added successfully');
  } catch (error) {
    showAlert('error', 'Failed to add stops');
  }
};

// Fetch stops
const fetchStops = async (cityId) => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get(`locations/stops`);
    stopsList.value = response.data.data.map((d, i) => {
      return {
        sno: i + 1,
        id: d.id,
        stop: d.stop,
        route: d.route,
        coordinates: d.coordinates,
        is_terminal: d.is_terminal,
        status: d.status,
        time: d.time,
        region: d.region
      }
    });
  } catch {
    showAlert('error', 'Failed to fetch stops');
  }
  finally {
    isLoading.value = false;
  }
};

// Edit/Delete stop

const deleteStop = async (id) => {
  if (!confirm('Are you sure you want to delete this stop?')) return;
  try {
    await axiosInstance.delete(`locations/stops/${id}`);
    showAlert('success', 'Stop deleted successfully');
    await fetchStops(selectedCity.value.id);
  } catch {
    showAlert('error', 'Failed to delete stop');
  }
};

onMounted(() => {
  fetchStops();
})
</script>
