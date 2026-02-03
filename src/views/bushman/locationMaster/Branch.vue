<template>
  <div>
    <!-- Branch Table -->
    <div class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <StandardDataTable :columns="columns" :data="branches" :loading="isLoading" :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
              :actionButtons="pageActions">


              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" @click="openModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <!-- <button v-if="permissions.includes('CAN_VIEW_FLEET')" class="btn btn-danger btn-sm"
                    @click="deleteBranch(row.id)">
                    <i class="fa fa-trash"></i>
                  </button> -->
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Branch Modal -->
    <div class="modal fade" id="branchModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable modal-xl">
        <div class="modal-content vh-100">
          <div class="modal-header">
            <h5 class="modal-title">{{ currentBranch.id ? 'Edit Branch' : 'Branch(s) Registration Form' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if=!isMultiple>
              <div class="mb-3">
                <label>City</label>
                <Multiselect v-model="currentBranch.city_id" :options="cities" label="name" track-by="id"
                  placeholder="Select City" />
              </div>
              <div class="mb-3">
                <label>Branch Name</label>
                <input v-model="currentBranch.name" type="text" class="form-control" />
              </div>
              <!-- <div class="mb-3">
              <label>Entity ID</label>
              <input v-model="currentBranch.entity_id" type="number" class="form-control" />
            </div> -->
            </div>
            <div v-else>
              <table class="table table-bordered align-middle">
  <thead class="table-light">
    <tr>
      <th style="width: 35%">City</th>
      <th style="width: 35%">Branch Name</th>
      <th style="width: 20%" v-if="branchForm.length > 1">Action</th>
    </tr>
  </thead>

  <tbody>
    <tr v-for="(branch, index) in branchForm" :key="index">
      
      <!-- City -->
      <td>
        <Multiselect
          v-model="branch.city_id"
          :options="cities"
          label="name"
          track-by="id"
          placeholder="Select City"
        />
      </td>

      <!-- Branch Name -->
      <td>
        <input v-model="branch.name" type="text" class="form-control" />
      </td>

      <!-- Remove Button -->
      <td v-if="branchForm.length > 1">
        <button class="btn btn-outline-danger w-100" @click="removeBranch(index)">
          Remove
        </button>
      </td>

    </tr>
  </tbody>
</table>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" data-bs-dismiss="modal">
              Cancel
            </button>
            <button v-if="isMultiple" class="btn btn-outline-secondary" @click="addBranch">
              + Add Another Branch
            </button>

            <button class="btn btn-primary" @click="saveBranch">{{ currentBranch.id ? 'Update' : 'Save' }}</button>
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

const pageActions = computed(() => {
  const actions = [];
   if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchBranches())
    });
  }
  if (true) {
    actions.push({
      label: "Register Branch(s)",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (openModal(null, true))
    });
  }

  return actions;
});
const isMultiple = ref(false);
const isLoading = ref(false);
const branches = ref([]);
const cities = ref([]);
const currentBranch = ref({ id: null, name: '', city_id: '', entity_id: 1 });
const formModal = ref(null);
const permissions = authStore.permissions;
const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: true },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'city', label: 'City', visible: true, sortable: false },
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

onMounted(async () => {
  await fetchBranches();
  await fetchCities();
  
});

// Fetch branches - branches are locations of type that can have children
const fetchBranches = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('/locations?type=BRANCH');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    branches.value = rows.map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        name: d.name,
        city: d.city || d.parent?.name,
        city_id: d.city_id || d.location_id
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch branches');
  } finally {
    isLoading.value = false;
  }
};

// Fetch cities for selection
const fetchCities = async () => {
  try {
    const response = await axiosInstance.get('/locations?type=CITY');
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    cities.value = rows;
  } catch (error) {
    showAlert('error', 'Failed to fetch cities');
  }
};

const branchForm = ref([]);
const addBranch = () => {
  branchForm.value.unshift({
    name: '',
    city_id: '',
  });
};
const removeBranch = (index) => {
  branchForm.value.splice(index, 1);
};
// Open modal
const openModal = (branch = null, multiple = false) => {
  isMultiple.value = multiple;
  if (multiple) {
    branchForm.value = [
      {
        city_id: '',
        name: ''
      }
    ]
  }
  if (branch) {
    currentBranch.value = {
      id: branch.id,
      city_id: cities.value.find((d) => d.id == branch.city_id),
      name: branch.name
    };

    //} else {
    currentBranch.value = { id: null, name: '', city_id: '' };
  }
  formModal.value = new Modal(document.getElementById('branchModal'));
  formModal.value.show();
};


function checkDuplication(uniqueFields, dataArray) {

  for (const field of uniqueFields) {
    const values = dataArray.value.map(d =>
      (d[field] || "").trim().toUpperCase()
    );

    const duplicates = values.filter((v, i) => values.indexOf(v) !== i);

    if (duplicates.length > 0) {
      showAlert("info",`Duplicate ${field.toUpperCase()} found: ${duplicates[0]}`);
      return false;   
    }
  }
  return true; 
}

// Save branch
const saveBranch = async () => {
  try {
    let response;
    if (!isMultiple.value) {
      const params = {
        'location_id': currentBranch.value.city_id.id,
        'type': 'BRANCH',
        'operation_type': 'PHYSICAL_LOCATION',
        name: currentBranch.value.name
      };
      response = await axiosInstance.put(`/locations/${currentBranch.value.id}`, params);
    } else {
      if (!checkDuplication(['name'], branchForm)) {
        return;
      }

      const params = branchForm.value.map((d) => ({
        location_id: d.city_id.id,
        type: 'BRANCH',
        operation_type: 'PHYSICAL_LOCATION',
        name: d.name,
      }));

      response = await axiosInstance.post('/locations', { locations: params });
    }

    showAlert('success', 'Branch saved successfully');
    formModal.value.hide();
    await fetchBranches();
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach((msgs) => msgs.forEach((msg) => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};

// Delete branch
const deleteBranch = async (id) => {
  if (!confirm('Are you sure you want to delete this branch?')) return;

  try {
    await axiosInstance.delete(`/locations/${id}`);
    showAlert('success', 'Branch deleted successfully');
    await fetchBranches();
  } catch (error) {
    showAlert('error', 'Failed to delete branch');
  }
};
</script>
