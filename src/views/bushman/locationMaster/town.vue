<template>
  <div>
    <!-- Town Table -->
    <div class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <StandardDataTable :columns="columns" :data="towns" :loading="isLoading" :filters="tableFilters"
              :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
              :actionButtons="pageActions">
              <template #region="{ row }">
                <span>{{ row.region?.name || row.region || 'N/A' }}</span>
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
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Town Modal -->
    <div class="modal fade" id="townModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable modal-xl">
        <div class="modal-content vh-100">
          <div class="modal-header">
            <h5 class="modal-title">{{ currentTown.id ? 'Edit Town' : 'Town(s) Registering Form' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="editTown">
              <div class="mb-3">
                <label>Region</label>
                <Multiselect v-model="currentTown.region_id" :options="regions" label="name" track-by="id"
                  placeholder="Select a region" />
              </div>
              <div class="mb-3">
                <label>Town Name</label>
                <input :value="currentTown.name" @input="currentTown.name = $event.target.value.toUpperCase()"
                  type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label>Town Code</label>
                <input :value="currentTown.code" @input="currentTown.code = $event.target.value.toUpperCase()"
                  type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label>Status</label>
                <Multiselect v-model="currentTown.status" :options="statuses" label="name" track-by="id"
                  placeholder="Select Status" />
              </div>
            </div>
            <div v-else>
              <table class="table table-bordered align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Region</th>
                    <th>Town Name</th>
                    <th>Town Code</th>
                    <th v-if="townForm.length > 1" style="width: 120px;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(town, idx) in townForm" :key="idx">
                    <td>
                      <Multiselect v-model="town.region_id" :options="regions" label="name" track-by="id"
                        placeholder="Select Region" />
                    </td>
                    <td>
                      <input v-model="town.name" @input="town.name = $event.target.value.toUpperCase()" type="text"
                        class="form-control" />
                    </td>
                    <td>
                      <input v-model="town.code" @input="town.code = $event.target.value.toUpperCase()" type="text"
                        class="form-control" />
                    </td>
                    <td v-if="townForm.length > 1">
                      <button class="btn btn-outline-danger w-100" @click="removeTown(idx)">
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
            <button v-if="!editTown" class="btn btn-outline-secondary" @click="addTown">+ Add Another Town</button>
            <button class="btn btn-primary" @click="saveTown">{{ currentTown.id ? 'Update' : 'Save' }}</button>
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

const pageActions = computed(() => {
  const actions = [];
  if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchTowns())
    });
  }
  if (true) {
    actions.push({
      label: "Register Town(s)",
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
const editTown = ref(false);
const isLoading = ref(false);
const towns = ref([]);
const regions = ref([]);
const statuses = ref([
  { id: 1, name: "Active" },
  { id: 0, name: "Inactive" }
]);
const currentTown = ref({ id: null, status: 1, name: '', code: "", region_id: null });
const formModal = ref(null);
const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'code', label: 'Code', visible: true, sortable: false },
  { key: 'region', label: 'Region', visible: true, sortable: false },
  { key: 'status', label: 'Status', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);

const townForm = ref([]);

const resolveId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value.id ?? null;
  return value;
};

const resolveStatusId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value.id ?? null;
  return value;
};

const addTown = () => {
  townForm.value.unshift({
    region_id: '',
    name: '',
    code: '',
    status: 1,
  });
};

const removeTown = (idx) => {
  townForm.value.splice(idx, 1);
};

const fetchTowns = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('locations?type=TOWN');
    const data = response.data.data || response.data;
    towns.value = (Array.isArray(data) ? data : []).map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        name: d.name,
        code: d.code,
        region: d.region || d.parent_name,
        status: d.status || (d.is_disabled ? 0 : 1),
      };
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch towns');
  } finally {
    isLoading.value = false;
  }
};

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

const openModal = (town = null) => {
  if (town) {
    editTown.value = true;
    const statusId = typeof town.status === 'number' ? town.status : (town.is_disabled ? 0 : 1);
    currentTown.value = {
      ...town,
      region_id: town.region || town.parent || null,
      status: statuses.value.find((s) => s.id === statusId) || statuses.value[0],
    };
  } else {
    editTown.value = false;
    currentTown.value = {
      id: null,
      status: statuses.value[0] || { id: 1, name: 'Active' },
      name: '',
      code: '',
      region_id: null,
    };
    townForm.value = [];
    addTown();
  }

  formModal.value = new Modal(document.getElementById('townModal'));
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

const saveTown = async () => {
  try {
    let response;
    if (currentTown.value.id) {
      const statusId = resolveStatusId(currentTown.value.status);
      const payload = {
        location_id: resolveId(currentTown.value.region_id || currentTown.value.region || currentTown.value.parent),
        name: currentTown.value.name,
        code: (currentTown.value.code || '').toUpperCase(),
        type: "TOWN",
        operation_type: "PHYSICAL_LOCATION",
        is_disabled: statusId === 0,
      };

      response = await axiosInstance.put(`/locations/${currentTown.value.id}`, payload);
    } else {
      if (!checkDuplication(['name'], townForm)) {
        return;
      }
      for (const d of townForm.value) {
        const statusId = resolveStatusId(d.status);
        const payload = {
          location_id: resolveId(d.region_id),
          name: d.name,
          code: (d.code || '').toUpperCase(),
          type: "TOWN",
          operation_type: "PHYSICAL_LOCATION",
          is_disabled: statusId === 0,
        };
        response = await axiosInstance.post('/locations', payload);
      }
    }

    showAlert('success', 'Town saved successfully');
    formModal.value.hide();
    await fetchTowns();
    editTown.value = false;
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
};

onMounted(async () => {
  await fetchTowns();
  await fetchRegions();
});
</script>
