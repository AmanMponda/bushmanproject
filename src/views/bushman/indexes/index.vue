<template>
  <div class="d-flex align-items-center">
    <div>
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">PATH 1</a></li>
        <li class="breadcrumb-item active">ACTIVE PATH</li>
      </ul>
    </div>
  </div>
  <div class="row layout-top-spacing bg-white rounded ">
    <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
      <div class="panel br-6 p-0">
        <div class="custom-table p-3">
          <StandardDataTable :columns="columns" :data="dataFetched" :loading="isLoading" :filters="tableFilters"
            :defaultPageSize="tableFilters.pageSize" :disablePagination="false" :showDateFilters="false"
            :actionButtons="pageActions">


            <template #actions="{ row }">
              <div class="d-flex gap-1">
                <button class="btn btn-secondary btn-sm" @click="editMethod(row)">
                  <i class="fa fa-pen"></i>
                </button>
                 <button class="btn btn-info btn-sm" @click="viewMethod(row)">
                  <i class="fa fa-eye"></i>
                </button>
                 <button class="btn btn-danger btn-sm" @click="deleteMethod(row)">
                  <i class="fa fa-trash"></i>
                </button>               
              </div>
            </template>
          </StandardDataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { API_URL_4 } from "@/config/config";
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import { useNotification } from '@/composables/notification';
const { showAlert } = useNotification();
import 'vue-select/dist/vue-select.css'
import { useAuthStore } from "@/stores/auth";
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';

const axiosInstance = axios.create({
  baseURL: API_URL_4,
  headers: {
    "Content-Type": "application/json"
  }
});

const formData = ref([]);
const isLoading = ref(false);
const dataFetched = ref([]);
const pageActions = computed(() => {
  const actions = [];
  // timaweka pwemission hapa 
  if (true) {
    actions.push({
      label: "Action 1",
      icon: "fa fa-plus",
      class: "btn btn-primary",
      method: () => (openModal(null, true))
    });
  }
  if (true) {
    actions.push({
      label: "Action 2",
      icon: "fa fa-plus",
      class: "btn btn-info",
      method: () => (openModal(null, true))
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

const columns = ref([
  { key: 'sno', label: 'Sno', visible: true, sortable: true },
  { key: 'col-1', label: 'Col-1', visible: true, sortable: false },
  { key: 'col-2', label: 'Col-2', visible: true, sortable: false },
  { key: 'col-3', label: 'col-3', visible: true, sortable: false },
  { key: 'col-actions', label: 'actions', visible: true, sortable: false },
]);







const editMethod = (data) =>{

}

const deleteMethod = (data) =>{
  
}
const viewMethod = (data) =>{
  
}

const fetchData = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('endpoint-path');  //method na end points

    dataFetched.value = response.data.map((d, index) => {
      return {
        col_1: d.col - 1

    }
    });


} catch (error) {
  console.error('Error fetching form data:', error);
  showAlert("error", "Failed to fetch form data");
}
finally {
  isLoading.value = false;
}
};


onMounted(async () => {
  await fetchData();
});
</script>


<style scoped>
.table-responsive {
  min-height: 300px;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.fullscreen-table .table-responsive {
  min-height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  overflow: auto;
}

.badge {
  font-size: 0.75rem;
  padding: 0.35em 0.65em;
  font-weight: 500;
}

.page-link {
  min-width: 40px;
  text-align: center;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.dropdown-menu {
  z-index: 1050;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-outline-lime {
  color: #82c91e;
  border-color: #82c91e;
}

.btn-outline-lime:hover {
  color: #fff;
  background-color: #82c91e;
  border-color: #82c91e;
}

.btn-outline-indigo {
  color: #4c6ef5;
  border-color: #4c6ef5;
}

.btn-outline-indigo:hover {
  color: #fff;
  background-color: #4c6ef5;
  border-color: #4c6ef5;
}

.btn-outline-yellow {
  color: #fab005;
  border-color: #fab005;
}

.btn-outline-yellow:hover {
  color: #fff;
  background-color: #fab005;
  border-color: #fab005;
}

.modal-dialog-scrollable .modal-content {
  overflow: visible !important;
}

.modal-body {
  overflow: visible !important;
}

/* Compact v-select dropdowns inside modals for Schedule 2 */
.modal-body .custom-vselect .vs__dropdown-menu {
  max-height: 0.5rem !important;
  overflow-y: auto !important;
  top: 100% !important;
  bottom: auto !important;
}

.modal-body .custom-vselect .vs__dropdown-option {
  font-size: 0.8rem;
}

/* Multiselect tag styling */
.multiselect-tag {
  display: inline-flex;
  align-items: center;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  margin: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.multiselect-tag:hover {
  background: #bbdefb;
}

.multiselect-tag i {
  cursor: pointer;
  margin-left: 4px;
  font-size: 0.7rem;
}

.multiselect-tag i:hover {
  color: #d32f2f;
}

/* Multiselect dropdown styling */
.multiselect {
  min-height: 38px;
}

.multiselect__tags {
  min-height: 38px;
  padding: 8px 40px 0 8px;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
}

.multiselect__tag {
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  padding: 2px 8px;
  margin: 2px;
}

.multiselect__tag-icon {
  border-radius: 50%;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  margin-left: 4px;
}

.multiselect__tag-icon:hover {
  background: #d32f2f;
  color: white;
}
</style>