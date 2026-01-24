<template>
  <div> <!-- Service Points Table -->
    <div  class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <StandardDataTable :columns="columns" :data="servicePoints" :loading="isLoading" :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
              :actionButtons="pageActions">
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" @click="openModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <!-- <Router-Link :to="`/abs/office-profile/${row.id}`">
                    <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-info btn-sm">
                      <i class="fa fa-eye"></i>
                    </button>
                  </Router-Link> -->
                  <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-outline-danger btn-sm"
                    @click="deleteServicePoint(row.id)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>

          </div>
        </div>
      </div>
    </div>

    <!-- Service Point Modal -->
    <div class="modal fade" id="servicePointModal" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content vh-100">
          <div class="modal-header">
            <h5 class="modal-title">{{ currentServicePoint.id ? 'Edit Service Point' : 'Service Point Registration form' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="!isMultiple">
              <div class="mb-3">
                <label>Office</label>
                <Multiselect v-model="currentServicePoint.office_id" :options="offices" label="name" track-by="id"
                  placeholder="Select Office" />
              </div>
              <div class="mb-3">
                <label>Name</label>
                <input v-model="currentServicePoint.name" type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label>Supervisor</label>
                <Multiselect v-model="currentServicePoint.supervisorable_id" :options="supervisors"
                  label="supervisor_name" track-by="supervisor_id" placeholder="Select Supervisor" />
              </div>
            </div>
            <div v-else>
              <table class="table table-bordered align-middle">
  <thead class="table-light">
    <tr>
      <th style="width: 25%">Office</th>
      <th style="width: 25%">Name</th>
      <th style="width: 25%">Supervisor</th>
      <th v-if="servicePointForm.length > 1" style="width: 15%">Action</th>
    </tr>
  </thead>

  <tbody>
    <tr v-for="(service, index) in servicePointForm" :key="index">

      <!-- Office -->
      <td>
        <Multiselect
          v-model="service.office_id"
          :options="offices"
          label="name"
          track-by="id"
          placeholder="Select Office"
        />
      </td>

      <!-- Service Point Name -->
      <td>
        <input
          v-model="service.name"
          type="text"
          class="form-control"
        />
      </td>

      <!-- Supervisor -->
      <td>
        <Multiselect
          v-model="service.supervisorable_id"
          :options="supervisors"
          label="supervisor_name"
          track-by="supervisor_id"
          placeholder="Select Supervisor"
        />
      </td>

      <!-- Remove Button -->
      <td v-if="servicePointForm.length > 1">
        <button
          class="btn btn-outline-danger w-100"         
          @click="removeServicePoint(index)"
        >
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
            <button v-if="isMultiple" class="btn btn-outline-secondary" @click="addServicePoint">+ Add Another
              Service</button>
            <button class="btn btn-primary" @click="saveServicePoint">{{ currentServicePoint.id ? 'Update' : 'Save'
            }}</button>
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
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');

const { showAlert } = useNotification();
const authStore = useAuthStore();
const permissions = authStore.permissions;

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'office', label: 'office', visible: true, sortable: false },
  { key: 'supervisor', label: 'Supervisor', visible: true, sortable: false },
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

const isMultiple = ref(false);
const supervisors = ref([]);
const isLoading = ref(false);
const servicePoints = ref([]);
const offices = ref([]);
const currentServicePoint = ref({
  id: null,
  office_id: null,
  name: '',
  supervisorable_type: '',
  supervisorable_id: null,
});

const servicePointForm = ref([]);
const formModal = ref(null);

// const columns = ref(['sno', 'office', 'service_point_name', 'supervisor', 'actions']);
// const table_option = ref({
//   perPage: 10,
//   perPageValues: [5, 10, 20, 50],
//   skin: 'table',
//   columnsClasses: { actions: 'actions text-center' },
//   sortable: ['office', 'name'],
//   pagination: { nav: 'scroll', chunk: 5 },
// });


const pageActions = computed(() => {
  const actions = [];
   if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchServicePoints())
    });
  }
  if (true) {
    actions.push({
      label: "Register Service Point(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (openModal(null, true))
    });
  }

  return actions;
});
onMounted(async () => {
  await fetchServicePoints();
  await fetchOffices();
  await fetchSupervisor();

});

// Fetch service points
const fetchServicePoints = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('/locations?type=SERVICE_CENTER');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    servicePoints.value = rows.map((d, index) => {
      // console.log(d);
      return {
        sno: index + 1,
        id: d.id,
        office: d.office || d.parent?.name,
        office_id: d.office_id || d.location_id,
        name: d.name,
        supervisor: d.supervisor,
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch service points');
  } finally {
    isLoading.value = false;
  }
};

// Fetch offices for selection
const fetchOffices = async () => {
  try {
    const response = await axiosInstance.get('/locations?type=OFFICE');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    offices.value = rows;
  } catch (error) {
    showAlert('error', 'Failed to fetch offices');
  }
};

const fetchSupervisor = async () => {
  try {
    const response = await axiosInstance.get('/users/supervisors');
    const data = response.data.data || response.data;
    supervisors.value = Array.isArray(data) ? data : [];
  } catch (error) {
    showAlert('error', 'Failed to fetch supervisors');
  }
};

// Open modal
const openModal = (servicePoint = null, multiple = false) => {

  isMultiple.value = multiple;


  if (isMultiple) {
    servicePointForm.value = [
      {
        office_id: '',
        name: '',
        supervisorable_type: '',
        supervisorable_id: '',
      }
    ];
  }

  if (servicePoint) {

    currentServicePoint.value = {
      office_id: offices.value.find((d) => d.id == servicePoint.office_id),
      name: servicePoint.name,
      supervisorable_type: '',
      supervisorable_id: supervisors.value.find((d) => d.supervisor_name.toLowerCase().trim() === servicePoint.supervisor.toLowerCase().trim()),
    };
  } else {
    currentServicePoint.value = {
      id: null,
      office_id: null,
      name: '',
      supervisorable_type: '',
      supervisorable_id: null,
    };
  }

  formModal.value = new Modal(document.getElementById('servicePointModal'));
  formModal.value.show();
};



const addServicePoint = () => {
  servicePointForm.value.unshift({
    office_id: '',
    name: '',
    supervisorable_type: '',
    supervisorable_id: '',
  });
};

const removeServicePoint = (index) => {
  servicePointForm.value.splice(index, 1);
};

// Save service point
const saveServicePoint = async () => {
  try {
    let response;
    if (currentServicePoint.value.id) {

      const params = {
        id: currentServicePoint.value.id,
        type: 'SERVICE_CENTER',
        operation_type: 'PHYSICAL_LOCATION',
        location_id: currentServicePoint.value.office_id.id,
        name: currentServicePoint.value.name,
        supervisorable_type: currentServicePoint.value.supervisorable_type,
        supervisorable_id: currentServicePoint.value.supervisorable_type?.supervisor_id,
      };
      response = await axiosInstance.put(`/locations/${currentServicePoint.value.id}`, params);
    }
    else {

      const params = servicePointForm.value.map((d) => {
        return {
          id: d.id,
          type: 'SERVICE_CENTER',
          operation_type: 'PHYSICAL_LOCATION',
          location_id: d.office_id.id,
          name: d.name,
          supervisorable_id: d.supervisorable_id?.supervisor_id,
          supervisorable_type: d.supervisorable_type,
      }
      });
      response = await axiosInstance.post('/locations', { locations: params });
    }

    showAlert('success', 'Service point saved successfully');
    formModal.value.hide();
    await fetchServicePoints();
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};

// Delete service point
const deleteServicePoint = async (id) => {
  if (!confirm('Are you sure you want to delete this service point?')) return;

  try {
    await axiosInstance.delete(`/locations/${id}`);
    showAlert('success', 'Service point deleted successfully');
    await fetchServicePoints();
  } catch (error) {
    showAlert('error', 'Failed to delete service point');
  }
};
</script>
