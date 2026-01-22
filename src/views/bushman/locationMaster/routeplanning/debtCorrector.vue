<template>
  <div v-if="mode === 'show'" class="row layout-top-spacing rounded bg-white mt-2">
    <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
      <div class="panel br-6 p-0">
        <div class="custom-table">
          <StandardDataTable
            :columns="Columns"
            :data="agentRoute"
            :loading="isLoading"
            :filters="tableOption"
            :defaultPageSize="tableOption.pageSize"
            :disablePagination="false"
            :showDateFilters="false"
            :actionButtons="pageActions"
          >
            <template #sequency="{ row }">
              <span class="fw-bold">{{ row.sequency }}</span>
            </template>
            <template #is_active="{ row }">
              <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </span>
            </template>
            <template #actions="{ row }">
              <div class="d-flex gap-1" role="group">
                  <button class="btn btn-sm btn-outline-info" @click=" openModal(row.id)" title="Delete">
                  <i class="fa fa-eye"></i>
                </button>            
               
              </div>
            </template>
          </StandardDataTable>
        </div>
      </div>
    </div>
  </div>
    <div v-if="mode === 'assign'" class="row layout-top-spacing rounded bg-white mt-2">
    <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
      <div class="panel br-6 p-2">
        <div class="custom-table">
            <div class="d-flex justify-content-between me-4 ms-4">
           <h5>Form for Assigning Agents to Sales Collectors</h5>
           <button  class="btn btn-outline-dark" @click="close">close</button>
            </div>
           <div class="border rounded m-2 p-3">        
            <div v-for="(row, index) in bulkAssignments" :key="index" class="mb-3 row align-items-end border-bottom pb-2">
            <div class="col-md-5">
              <label>Debt Collector</label>
              <Multiselect
                v-model="row.collector"
                :options="agentRoute"
                label="name"
                track-by="id"
                placeholder="Select Collector"
              />
            </div>
            <div class="col-md-5">
              <label>Agents</label>
              <Multiselect
                v-model="row.agents"
                :options="agentlist"
                label="name"
                track-by="id"
                placeholder="Select Agents"
                :multiple="true"
              />
            </div>
            <div v-if="bulkAssignments.length > 1" class="col-md-2 text-center">
              <button class="btn btn-outline-danger" @click="removeAssignmentRow(index)">Remove</button>
            </div>
            </div>         
        </div>        
        <div class="d-flex justify-content-end gap-2">
          <button  class="btn btn-outline-danger" @click="close('assing')">Cancel</button>
            <button  class="btn btn-outline-secondary mt-2" @click="addAssignmentRow">
            <i class="fa fa-plus"></i> Add Collector + Agents
          </button>
          <button  class="btn btn-outline-primary" @click="saveBulkAssignments">
            <span v-if="isLoading">
              <div class="spinner-border spinner-border-sm"></div>
            </span>
            <span v-else>Save</span>
          </button>
        </div>
        
        </div>
      </div>
    </div>
     </div>

     <div v-if="mode === 'creation'" class="row justify-content-center layout-top-spacing rounded bg-white mt-2">
    <div class="col-xl-10 col-lg-10 col-sm-10 layout-spacing">
      <div class="panel br-6 p-2">
        <div class="custom-table">
           <div class="d-flex justify-content-between me-4 ms-4">
           <h5>Form for Adding Sales Collectors</h5>
           <button  class="btn btn-outline-dark" @click="close">close</button>
           </div>
           <div class="border rounded m-2 p-3">
           <div class="col-md-12">
              <label>Agents</label>
              <Multiselect
                v-model="newSalesCollector"
                :options="agentlist"
                label="name"
                track-by="id"
                placeholder="Select Agents"
                :multiple="true"
              />
            </div>      
        </div>
        
        <div class="d-flex justify-content-end gap-2">
          <button  class="btn btn-outline-danger" @click="close('assing')">Cancel</button>          
          <button v-if="mode==='creation'" class="btn btn-outline-primary" @click="saveNewCollector">
            <span v-if ="isCreation">
              <div class="spinner-border spinner-border-sm"></div>
            </span>
            <span v-else>Save</span>
          </button>
        </div>
        
        </div>
      </div>
    </div>
    </div>
  <!-- Bulk Collector + Agents Modal -->
  <div v-if="showModal" class="modal d-block" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content vh-100">
        <div class="modal-header">
          <h5 class="modal-title">{{ mode==='creation' ? 'Assign Collector + Agents' : 'View Collector + Agents' }}</h5>
          <button type="button" class="btn-close" @click="showModal=false"></button>
        </div>

        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">        
        <div class="p-2">
          <StandardDataTable
            :columns="CollectorColumns"
            :data="agentCollector"
            :loading="isFetching"
            :filters="tableOption"
            :defaultPageSize="tableOption.pageSize"
            :disablePagination="false"
            :showDateFilters="false"            
          >
            <template #sequency="{ row }">
              <span class="fw-bold">{{ row.sequency }}</span>
            </template>
            <template #is_active="{ row }">
              <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </span>
            </template>
            <template #actions="{ row }">
              <div class="d-flex gap-1" role="group">                 
                <button class="btn btn-sm btn-outline-danger" @click="deleteAgent(row.id)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>               
              </div>
            </template>
          </StandardDataTable>
        </div> 
        </div>

        <div class="modal-footer">
          <button  class="btn btn-outline-danger" @click="showModal=false">Cancel</button>            
        </div>
      </div>
    </div>
  </div> 
  <div v-if="showModal" class="modal-backdrop fade show"></div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';
import axios from "axios";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.min.css";
import { useNotification } from "@/composables/notification";
import { useAuthStore } from "@/stores/auth";

const { showAlert } = useNotification();
const newSalesCollector = ref(null); 
const authStore = useAuthStore();
const route = useRoute();
const agentCollector = ref([]);
const isCreation = ref(false);
const isAssign = ref(false);
const showModal = ref(false);
const isLoading = ref(false);
const agentRoute = ref([]);
const selectedCollector = ref(null);
const selecteRoute =ref(route.params.id ? Number(route.params.id) : null);
const agentlist = ref([]);
const mode = ref('show');
const isFetching = ref(false);
const bulkAssignments = ref([{ collector: null, agents: [] }]);

const routeId = ref(route.params.id ? Number(route.params.id) : null);

// Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL_2,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const Columns = ref([
  { key: 'sno', label: 'Sno', visible: true },
  { key: 'name', label: 'Name', visible: true },
  { key: 'phone', label: 'Phone Number', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'address', label: 'Address', visible: true },
  { key: 'actions', label: 'Actions', visible: true }
]);
const CollectorColumns = ref([
  { key: 'sno', label: 'Sno', visible: true },
  { key: 'name', label: 'Name', visible: true },
  { key: 'phone', label: 'Phone Number', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'address', label: 'Address', visible: true },
  { key: 'actions', label: 'Actions', visible: true }
]);

const tableOption = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
});

const pageActions = computed(() => [
  {
    label: "Refresh",
    icon: "fa fa-sync-alt",
    class: "btn btn-secondary",
    method: () => fetchActiveSupervisors()
  },  
  {
    label: "Assign Agent(s) to Debt Collector",
    icon: "fa fa-plus",
    class: "btn btn-primary",
    method: () => open("assign")
  }
]);

const open = (mod , id) =>{
    mode.value = mod;
    if (mod === 'view') {    
      fetchCollectorAgents(id);
    }
     else if(mod === 'creation'){
      mode.value = mod;
      fetchActiveAgents();
    }
     else if(mod === 'assign') {
      agentCollector.value = [];
        fetchActiveAgents();
        fetchActiveSupervisors();
      bulkAssignments.value = [{ collector: null, agents: [] }];
    }
    else{
      mode.value = 'show'
    }  
}

const close =() => {
  mode.value = 'show';
}

const fetchActiveSupervisors = async () => {
  isLoading.value = true;
  try {
    const url = `locations/active-agents?role=SALES_COLLECTOR&route_id=${route.params.id}`;
    const response = await axiosInstance.get(url);
    agentRoute.value = response.data.data.map((d, index) => ({ sno: index + 1, ...d }));
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};


const openModal = (id) => {
  showModal.value = true;
  fetchCollectorAgents(id);
}

const fetchActiveAgents  = async () => {  
    try {
        // Use route_id parameter if available
        const url = `locations/agent-route?route_id=${route.params.id}` ;
        const response = await axiosInstance.get(url);      
    
         agentlist.value = response.data.data[0].vendors.map((d, index) => ({
            sno: index + 1,
            ...d
        }));
        
        
    } catch (error) {
        console.error('Error fetching subroutes:', error);
           }
};


const fetchCollectorAgents  = async (id) => {  
    isFetching.value = true;
    selectedCollector.value = id;
    try {
                const params = {
             route_id: route.params.id,
             collector_id :id
        }
        const url = `locations/get/debt-agents`;
        const response = await axiosInstance.get(url, { params });     

         agentCollector.value = response.data.data.map((d, index) => ({
            sno: index + 1,
            ...d
        }));
        
        
    } catch (error) {
        console.error('Error fetching subroutes:', error);
           }
           finally {
            isFetching.value = false;
           }
};





const addAssignmentRow = () => bulkAssignments.value.push({ collector: null, agents: [] });
const removeAssignmentRow = (index) => bulkAssignments.value.splice(index, 1);

const saveBulkAssignments = async () => {
  if (bulkAssignments.value.length === 0) return showAlert("warning", 'No assignments to save.');

  for (const row of bulkAssignments.value) {
    if (!row.collector) return showAlert("warning", 'Please select collector in each row.');
    if (row.agents.length === 0) return showAlert("warning", 'Please select agents in each row.');
  }

  isLoading.value = true;
  try {
    const payload = bulkAssignments.value.map(row => ({    
      collector_id: row.collector.id,
      agent_ids: row.agents.map(a => a.id)
    }));

    const response = await axiosInstance.post('locations/assign/debt-agents', {route_id: route.params.id, assignments: payload });

    if (response.data.status === 'success') {
      showAlert("success", response.data.message);
      bulkAssignments.value = [{ collector: null, agents: [] }];
      showModal.value = false;
      fetchAgentRoute();
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const saveNewCollector = async () => {
 
    if (!newSalesCollector) return showAlert("warning", 'Please select Agent.'); 

  isCreation.value = true;
  try {
    const payload = bulkAssignments.value.map(row => ({    
      collector_id: row.collector.id,
      agent_ids: row.newSalesCollector.map(a => a.id)
    }));

    const response = await axiosInstance.post('locations/create/debt-agents',
     {route_id: route.params.id,
     assignments: payload });

    if (response.data.status === 'success') {
      showAlert("success", response.data.message);
      bulkAssignments.value = [{ collector: null, agents: [] }];
      mode.value === 'show';
      showModal.value = false;
      fetchAgentRoute();
    }
  } catch (error) {
    console.error(error);
  } finally {
    isCreation.value = false;
  }
};




const deleteAgent = async (id) => {
  if (!confirm('Are you sure you want to delete?')) return;
  isLoading.value = true;
  try {
    const response = await axiosInstance.delete('locations/remove/debt-agents', {
      data: {
             route_id: route.params.id,
             collector_id :selectedCollector.value,
             agent_id: id
         }
    });
    if (response.data.status === 'success') showAlert("success", response.data.message);
    showModal.value = false;
    fetchCollectorAgents(selectedCollector.value);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() =>
 fetchActiveSupervisors(),
close()
 );

</script>
