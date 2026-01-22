<template>
  <div>   
  
    <div  class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">

          <div class="custom-table p-3">            
              <StandardDataTable :columns="columns" :data="countries" :loading="isLoading" :filters="tableFilters"
                :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
                 :actionButtons="pageActions">
                <template #select="{ row }">
                  <input type="radio" :name="'vehicle-select'" :value="row.id" @change="selectVehicle(row)"
                    :checked="selectedVehicle?.id === row.id" class="form-check-input" />
                </template>
                <template #actions="{ row }">               
                  <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" @click="openModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>                  
                  <!-- <button v-if="permissions.includes('CAN_DELETE_COUNTRY')" class="btn btn-danger btn-sm" @click="deleteCountry(row.id)">
                    <i class="fa fa-trash"></i>
                  </button> -->
                  </div>
                 </template>
              </StandardDataTable>
                      
          </div>
        </div>
      </div>
    </div>

    <!-- Country Modal -->
    <div class="modal fade" id="countryModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ currentCountry.id ? 'Edit Country' : 'Add Country' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label>Country Name</label>
              <input v-model="currentCountry.name" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label>Country Code</label>
              <input v-model="currentCountry.code" type="text" class="form-control" placeholder="e.g. TZ" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" @click="saveCountry">{{ currentCountry.id ? 'Update' : 'Save' }}</button>
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

const pageActions = computed (() => {
  const actions = []; 
   if (true) {
    actions.push({
      label: "Reflesh",
      icon: "fa fa-sync-alt",
      class: "btn btn-secondary",
      method: () => (fetchCountries())
    });
  }
  if (true) {
    actions.push({
      label: "Add Country",
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

const isLoading = ref(false);
const countries = ref([]);
const currentCountry = ref({ id: null, name: '', code: '', status: 1 });

const formModal = ref(null);
const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: false },
  { key: 'name', label: 'Name', visible: true, sortable: false },
  { key: 'code', label: 'Code', visible: true, sortable: false },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
]);


onMounted(fetchCountries);

// Fetch countries
async function fetchCountries() {
  isLoading.value = true;
  try {
    const res = await axiosInstance.get('/locations?type=COUNTRY');
    const payload = res.data?.data || res.data;
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    countries.value = rows.map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        name: d.name,
        code: d.code || d.country_code || ''
      }
    });

  } catch (error) {
    showAlert('error', 'Failed to fetch countries');
  } finally {
    isLoading.value = false;
  }
}

// Open modal
function openModal(country = null) {
  if (country) {
    currentCountry.value = { ...country };
  } else {
    currentCountry.value = { id: null, name: '', code: '', status: 1 };
  }
  formModal.value = new Modal(document.getElementById('countryModal'));
  formModal.value.show();
}

// Save country
async function saveCountry() {


  try {
    let payload = { 
      name: currentCountry.value.name,
      code: currentCountry.value.code || undefined,
      type: 'COUNTRY',
      operation_type: 'PHYSICAL_LOCATION'
    };

    if (currentCountry.value.id) {
      await axiosInstance.put(`/locations/${currentCountry.value.id}`, payload);
    } else {
      await axiosInstance.post('/locations', payload);
    }
    showAlert('success', 'Country saved successfully');
    formModal.value.hide();
    await fetchCountries();
  } catch (error) {
    if (error.response?.status === 422) {
      Object.values(error.response.data.errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Something went wrong');
    }
  }
}

// Delete country
async function deleteCountry(id) {
  if (!confirm('Are you sure you want to delete this country?')) return;
  try {
    await axiosInstance.delete(`/locations/${id}`);
    showAlert('success', 'Country deleted successfully');
    await fetchCountries();
  } catch (error) {
    showAlert('error', 'Failed to delete country');
  }
}
</script>
