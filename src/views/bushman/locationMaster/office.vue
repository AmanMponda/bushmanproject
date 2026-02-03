<template>
  <div>

    <!-- Office Table -->
    <div class="row layout-top-spacing rounded bg-white mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">

          <div class="custom-table p-3">
            <StandardDataTable :columns="columns" :data="offices" :loading="isLoading" :filters="tableFilters"
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
    <button class="btn btn-outline-secondary btn-sm" @click="openModal(row)">
      <i class="fa fa-edit"></i>
    </button>

    <Router-Link :to="`/abs/office-profile/${row.id}`">
      <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-outline-primary btn-sm">
        <i class="fa fa-eye"></i>
      </button>
    </Router-Link>
    <!-- <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-danger btn-sm" @click="deleteOffice(row.id)">
      <i class="fa fa-trash"></i>
    </button> -->
  </div>
</template>
</StandardDataTable>




<!-- <v-client-table :data="offices" :columns="columns" :options="table_option">
              <template #branch="props">
                <span>{{ props.row.branch || 'N/A' }}</span>
              </template>

              <template #office="props">
                <span>{{ props.row.office || 'N/A' }}</span>
              </template>

              <template #status="props">
                <span :class="props.row.status ? 'text-success' : 'text-danger'">
                  {{ props.row.status ? 'Active' : 'Inactive' }}
                </span>
              </template>

              <template #actions="props">
                <a class="btn btn-sm  me-1" @click="openModal(props.row)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="feather feather-edit-2 ">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </a>
                <a class="btn btn-sm " @click="deleteOffice(props.row.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="feather feather-trash-2 text-danger">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </a>
                <Router-Link class="btn btn-sm " :to="`/abs/office-profile/${props.row.id}`">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="feather feather-eye text-primary">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>

                </Router-Link>
              </template>
            </v-client-table> -->
</div>
</div>
</div>
</div>

<!-- Office Modal -->
<div class="modal modal-xl fade" id="officeModal" tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content vh-100">
      <div class="modal-header">
        <h5 class="modal-title">
          {{ isMultiple ? 'Office(s) Registration Form' : (currentOffice.id ? 'Edit Office' : 'Add Office') }}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">
        <template v-if="!isMultiple">
          <!-- Single Office Form -->
          <div class="row">
            <div class="col-md-4 mb-3">
              <label>Branch</label>
              <Multiselect v-model="currentOffice.branch_id" :options="branches" label="name" track-by="id"
                placeholder="Select Branch" />
            </div>
            <div class="col-md-4 mb-3">
              <label>Office Name</label>
              <input v-model="currentOffice.name" type="text" class="form-control" />
            </div>
            <div class="col-md-4 mb-3">
              <label>Address</label>
              <input v-model="currentOffice.address" type="text" class="form-control" />
            </div>
            <div class="col-md-3 mb-3">
              <label>Location</label>
              <input v-model="currentOffice.location" type="text" class="form-control" />
            </div>
            <div class="col-md-3 mb-3">
              <label>Contact</label>
              <input v-model="currentOffice.contact" type="text" class="form-control" />
            </div>
            <div class="col-md-3 mb-3">
              <label>Code</label>
              <input v-model="currentOffice.code" @input="currentOffice.code = $event.target.value.toUpperCase()"
                type="text" class="form-control" />
            </div>
            <div class="col-md-3 mb-3">
              <label>Status</label>
              <select v-model="currentOffice.status" class="form-control">
                <option :value="1">Active</option>
                <option :value="0">Inactive</option>
              </select>
            </div>
          </div>
        </template>

        <!-- MULTIPLE ENTRY MODE -->
        <template v-else>
          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 20%">Branch</th>
                <th style="width: 15%">Office Name</th>
                <th style="width: 15%">Address</th>
                <th style="width: 15%">Location</th>
                <th style="width: 15%">Contact</th>
                <th style="width: 10%">Code</th>
                <th v-if="multipleOffices.length > 1" style="width: 5%">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(office, index) in multipleOffices" :key="index">

                <!-- Branch -->
                <td>
                  <Multiselect v-model="office.branch_id" :options="branches" label="name" track-by="id"
                    placeholder="Select Branch" />
                </td>

                <!-- Office Name -->
                <td>
                  <input v-model="office.name" type="text" class="form-control" />
                </td>

                <!-- Address -->
                <td>
                  <input v-model="office.address" type="text" class="form-control" />
                </td>

                <!-- Location -->
                <td>
                  <input v-model="office.location" type="text" class="form-control" />
                </td>

                <!-- Contact -->
                <td>
                  <input v-model="office.contact" type="text" class="form-control" />
                </td>

                <!-- Code -->
                <td>
                  <input v-model="office.code" @input="office.code = $event.target.value.toUpperCase()" type="text"
                    class="form-control" />
                </td>

                <!-- Remove Button -->
                <td v-if="multipleOffices.length > 1">
                  <button class="btn btn-outline-danger w-100" @click="removeOffice(index)">
                    Remove
                  </button>
                </td>

              </tr>
            </tbody>
          </table>


        </template>
      </div>

      <div class="modal-footer">
        <button class="btn btn-danger" data-bs-dismiss="modal">Cancel</button>
        <button v-if="isMultiple" class="btn btn-outline-secondary" @click="addOffice">
          + Add Another Office
        </button>
        <button class="btn btn-primary" @click="saveOffice">
          {{ isMultiple ? 'Save All Offices' : (currentOffice.id ? 'Update' : 'Save') }}
        </button>
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
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";

const { showAlert } = useNotification();
const authStore = useAuthStore();

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
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
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchOffices())
    });
  }
  if (true) {
    actions.push({
      label: "Register Offices(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (openModal(null, true))
    });
  }

  return actions;
});
const permissions = authStore.permissions;
const isMultiple = ref(false);
const isLoading = ref(false);
const offices = ref([]);
const branches = ref([]);
const currentOffice = ref({
  id: null,
  name: '',
  branch_id: '',
  office: '',
  status: 1,
  company: '',
  address: '',
  location: '',
  contact: '',
  code: '',
  password: ''
});
const formModal = ref(null);
const multipleOffices = ref([]);

const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'office', label: 'Name', visible: true, sortable: false },
  { key: 'branch', label: 'Branch', visible: true, sortable: false },
  { key: 'location', label: 'Location', visible: true, sortable: false },
  { key: 'address', label: 'Address', visible: true, sortable: false },
  { key: 'code', label: 'Code', visible: true, sortable: false },
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

// const columns = ref(['sno', 'office', 'branch', 'status', 'actions']);
// const table_option = ref({
//   perPage: 10,
//   perPageValues: [5, 10, 20, 50],
//   skin: 'table',
//   columnsClasses: { actions: 'actions text-center' },
//   sortable: ['office', 'status'],
//   pagination: { nav: 'scroll', chunk: 5 },
// });

onMounted(async () => {
   await fetchOffices();
  await fetchBranches();
 
});

// Fetch offices
const fetchOffices = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('/locations?type=OFFICE');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    offices.value = rows.map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        branch_id: d.branch_id || d.location_id,
        office: d.name,
        branch: d.branch || d.parent?.name,
        location: d.location,
        contacts: d.contact,
        address: d.address,
        status: d.status,
        code: d.code
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch offices');
  } finally {
    isLoading.value = false;
  }
};

// Fetch branches for selection
const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get('/locations?type=BRANCH');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    branches.value = rows;
  } catch (error) {
    showAlert('error', 'Failed to fetch branches');
  }
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

// Open modal
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
        name: office.office,
        office: office.name,
        branch_id: branches.value.find((d) => d.id === office.branch_id),
        status: office.status,
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
  //formModal.value = new Modal(document.getElementById('officeModal'));
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
// Save office
const saveOffice = async () => {
  try {

    if (isMultiple.value) {

      if (!checkDuplication(['name'], multipleOffices)) {
        return;
      }

      const payload = multipleOffices.value.map(o => ({
        name: o.name,
        type: 'OFFICE',
        operation_type: 'PHYSICAL_LOCATION',
        location_id: o.branch_id?.id,
        status: o.status,
        address: o.address,
        location: o.location,
        contact: o.contact,
        code: o.code
      }));
    
      await axiosInstance.post('/locations', { locations: payload });
   
      showAlert('success', 'All offices saved successfully');
  
    } else {
      // Single Create / Update
      if (currentOffice.value.id) {
        const payload = {
          name: currentOffice.value.name,
          type: 'OFFICE',
          operation_type: 'PHYSICAL_LOCATION',
          location_id: currentOffice.value.branch_id?.id,
          status: currentOffice.value.status,
          address: currentOffice.value.address,
          location: currentOffice.value.location,
          contact: currentOffice.value.contact,
          code: currentOffice.value.code
        };

        await axiosInstance.put(`/locations/${currentOffice.value.id}`, payload);
      } else {
        await axiosInstance.post('/locations', {
          name: currentOffice.value.name,
          type: 'OFFICE',
          operation_type: 'PHYSICAL_LOCATION',
          location_id: currentOffice.value.branch_id?.id,
          status: currentOffice.value.status,
          address: currentOffice.value.address,
          location: currentOffice.value.location,
          contact: currentOffice.value.contact,
          code: currentOffice.value.code
        });
      }
      showAlert('success', 'Office saved successfully');
    }

    formModal.value.hide();
    await fetchOffices();
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach((msgs) => msgs.forEach((msg) => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};

// Delete office
const deleteOffice = async (id) => {
  if (!confirm('Are you sure you want to delete this office?')) return;

  try {
    await axiosInstance.delete(`/locations/${id}`);
    showAlert('success', 'Office deleted successfully');
    await fetchOffices();
  } catch (error) {
    showAlert('error', 'Failed to delete office');
  }
};
</script>
