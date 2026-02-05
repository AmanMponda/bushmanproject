<template>
  <div class="card flex-1 m-0 d-flex flex-column overflow-hidden">
    <div class="card-header d-flex bg-none">
      <div class="fw-bold flex-1">Location Master</div>
      <card-expand-toggler></card-expand-toggler>
    </div>
    <div class="card-body p-0 flex-1 overflow-hidden">
      <div class="file-manager h-100" id="fileManager">
        <div class="file-manager-toolbar">
          <button type="button" class="btn shadow-none text-body border-0" @click="openAdd(null)">
            <i class="fa fa-lg me-1 fa-plus"></i> Add Country
          </button>
          <button type="button" class="btn shadow-none text-body border-0" @click="refreshTree">
            <i class="fa fa-lg me-1 fa-arrows-rotate"></i> Refresh
          </button>
        </div>
        <div class="file-manager-container">
          <!-- BEGIN Sidebar ya Tree -->
          <div class="file-manager-sidebar">
            <div class="file-manager-sidebar-content">
              <perfect-scrollbar class="h-100 p-3">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control form-control-sm mb-3" 
                  placeholder="Search location..." 
                />
                
                <!-- Location Tree -->
                <div class="file-tree mb-3">
                  <location-tree-node 
                    v-for="node in filteredLocations" 
                    :key="node.id"
                    :node="node"
                    :level="0"
                    @add-child="openAdd"
                    @edit-node="openEdit"
                    @delete-node="confirmDelete"
                    @toggle-expand="toggleExpand"
                  />
                </div>
                
                <!-- Statistics -->
                <div class="mt-4 p-3 bg-light rounded">
                  <h6 class="mb-2">Summary</h6>
                  <div class="small">
                    <div>Countries: {{ stats.countries }}</div>
                    <div>Regions: {{ stats.regions }}</div>
                    <div>Cities: {{ stats.cities }}</div>
                    <div>Total: {{ stats.total }}</div>
                  </div>
                </div>
              </perfect-scrollbar>
            </div>
          </div>
          <!-- END Sidebar ya Tree -->
          
          <!-- BEGIN Content Area -->
          <div class="file-manager-content d-flex flex-column">
            <div class="mb-0 d-flex text-nowrap p-3 border-bottom">
              <div class="breadcrumb flex-grow-1 m-0">
                <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
                  <span 
                    class="breadcrumb-item" 
                    :class="{ 'active': index === breadcrumbs.length - 1 }"
                    @click="navigateTo(crumb.id)"
                    style="cursor: pointer;"
                  >
                    {{ crumb.name }}
                  </span>
                </template>
              </div>
              
              <div class="btn-group ms-2">
                <button 
                  type="button" 
                  class="btn btn-sm btn-default" 
                  :disabled="!selectedNode"
                  @click="openAdd(selectedNode)"
                >
                  <i class="fa fa-plus me-1"></i> Add Child
                </button>
                <button 
                  type="button" 
                  class="btn btn-sm btn-default" 
                  :disabled="!selectedNode"
                  @click="openEdit(selectedNode)"
                >
                  <i class="fa fa-edit me-1"></i> Edit
                </button>
                <button 
                  type="button" 
                  class="btn btn-sm btn-default text-danger" 
                  :disabled="!selectedNode"
                  @click="confirmDelete(selectedNode)"
                >
                  <i class="fa fa-trash me-1"></i> Delete
                </button>
              </div>
            </div>
            
            <div class="flex-1 overflow-hidden">
              <perfect-scrollbar class="h-100 p-3">
                <!-- Node Details -->
                <div v-if="selectedNode" class="node-details">
                  <h4>{{ selectedNode.name }}</h4>
                  <div class="row mt-3">
                    <div class="col-md-6">
                      <table class="table table-sm">
                        <tr>
                          <th width="40%">Type:</th>
                          <td>{{ selectedNode.type }}</td>
                        </tr>
                        <tr>
                          <th>Code:</th>
                          <td>{{ selectedNode.code || 'N/A' }}</td>
                        </tr>
                        <tr>
                          <th>Operation Type:</th>
                          <td>{{ selectedNode.operation_type }}</td>
                        </tr>
                        <tr>
                          <th>Created:</th>
                          <td>{{ formatDate(selectedNode.created_at) }}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">
                          <h6 class="mb-0">Children ({{ selectedNode.children_recursive?.length || 0 }})</h6>
                        </div>
                        <div class="card-body p-2">
                          <div v-if="selectedNode.children_recursive?.length">
                            <div 
                              v-for="child in selectedNode.children_recursive" 
                              :key="child.id"
                              class="d-flex align-items-center p-2 border-bottom hover-bg"
                              @click="selectNode(child)"
                              style="cursor: pointer;"
                            >
                              <i class="fa fa-folder text-warning me-2"></i>
                              <span>{{ child.name }}</span>
                              <small class="ms-2 text-muted">({{ child.type }})</small>
                              <span class="ms-auto badge bg-light text-dark">
                                {{ child.children_recursive?.length || 0 }}
                              </span>
                            </div>
                          </div>
                          <div v-else class="text-center text-muted py-3">
                            No children
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Custom Content based on Type -->
                  <div v-if="selectedNode.type === 'BRANCH'" class="mt-4">
                    <branch-details :node-id="selectedNode.id" />
                  </div>
                  <div v-if="selectedNode.type === 'OFFICE'" class="mt-4">
                    <office-details :node-id="selectedNode.id" />
                  </div>
                </div>
                
                <!-- No Selection Message -->
                <div v-else class="text-center text-muted py-5">
                  <i class="fa fa-folder-open fa-3x mb-3"></i>
                  <h5>Select a location to view details</h5>
                  <p>Click on any location in the tree to see its information</p>
                </div>
              </perfect-scrollbar>
            </div>
          </div>
          <!-- END Content Area -->
        </div>
      </div>
    </div>
  </div>
  
  <!-- Modal ya Add/Edit -->
  <location-modal 
    :node="currentLocation"
    :show-modal="showModal"
    @save="saveLocation"
    @close="closeModal"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/notification'
import { API_URL_2 } from '@/config/config'
import LocationTreeNode from './LocationTreeNode.vue'
import LocationModal from './LocationModal.vue'
import BranchDetails from './branch.vue'
import OfficeDetails from './office.vue'

/* ===============================
  SETUP
================================ */
const authStore = useAuthStore()
const { showAlert } = useNotification()

const axiosInstance = axios.create({
  baseURL: API_URL_2,
  headers: {
    'Content-Type': 'application/json',
    Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
    'X-User-Id': authStore.user?.id || '',
    'X-Username': authStore.user?.username || '',
  },
})

/* ===============================
  STATE
================================ */
const locations = ref([])
const expandedNodes = ref(new Set())
const selectedNode = ref(null)
const currentLocation = ref(null)
const showModal = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const breadcrumbs = ref([])

/* ===============================
  COMPUTED
================================ */
const filteredLocations = computed(() => {
  if (!searchQuery.value.trim()) return locations.value
  
  const query = searchQuery.value.toLowerCase()
  const filterNodes = (nodes) => {
    return nodes.filter(node => {
      const matches = node.name.toLowerCase().includes(query) || 
                     node.type.toLowerCase().includes(query)
      if (matches) return true
      
      if (node.children_recursive?.length) {
        const filteredChildren = filterNodes(node.children_recursive)
        if (filteredChildren.length > 0) return true
      }
      return false
    })
  }
  
  return filterNodes(locations.value)
})

const stats = computed(() => {
  const counts = { countries: 0, regions: 0, cities: 0, total: 0 }
  
  const countNodes = (nodes) => {
    nodes.forEach(node => {
      counts.total++
      if (node.type === 'COUNTRY') counts.countries++
      if (node.type === 'REGION') counts.regions++
      if (node.type === 'CITY') counts.cities++
      
      if (node.children_recursive?.length) {
        countNodes(node.children_recursive)
      }
    })
  }
  
  countNodes(locations.value)
  return counts
})

/* ===============================
  METHODS
================================ */
const fetchLocations = async () => {
  loading.value = true
  try {
    const res = await axiosInstance.get('locations-master/index')
    locations.value = res.data.data || []
    
    // Auto-expand countries
    locations.value.forEach(node => {
      if (node.type === 'COUNTRY') {
        expandedNodes.value.add(node.id)
      }
    })
  } catch (error) {
    showAlert('error', 'Failed to load locations')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openAdd = (parent) => {
  currentLocation.value = {
    id: null,
    name: '',
    type: '',
    code: '',
    location_id: parent ? parent.id : null,
    operation_type: 'PHYSICAL_LOCATION',
    parent_name: parent ? parent.name : null
  }
  showModal.value = true
}

const openEdit = (node) => {
  currentLocation.value = { ...node }
  showModal.value = true
}

const saveLocation = async (locationData) => {
  try {
    if (locationData.id) {
      await axiosInstance.put(
        `locations-master/${locationData.id}`,
        locationData
      )
      showAlert('success', 'Location updated successfully')
    } else {
      await axiosInstance.post('locations-master/store', locationData)
      showAlert('success', 'Location created successfully')
    }
    
    showModal.value = false
    await fetchLocations()
    
    // Reselect node if editing
    if (locationData.id && selectedNode.value?.id === locationData.id) {
      const findNode = (nodes, id) => {
        for (const node of nodes) {
          if (node.id === id) return node
          if (node.children_recursive?.length) {
            const found = findNode(node.children_recursive, id)
            if (found) return found
          }
        }
        return null
      }
      selectedNode.value = findNode(locations.value, locationData.id)
    }
  } catch (error) {
    showAlert('error', error.response?.data?.message || 'Save failed')
  }
}

const confirmDelete = async (node) => {
  if (!confirm(`Are you sure you want to delete "${node.name}"?\nThis will also delete all its children.`)) {
    return
  }
  
  try {
    await axiosInstance.delete(`locations-master/${node.id}`)
    showAlert('success', 'Location deleted successfully')
    
    if (selectedNode.value?.id === node.id) {
      selectedNode.value = null
      breadcrumbs.value = []
    }
    
    await fetchLocations()
  } catch (error) {
    showAlert('error', error.response?.data?.message || 'Delete failed')
  }
}

const toggleExpand = (nodeId) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const selectNode = (node) => {
  selectedNode.value = node
  updateBreadcrumbs(node)
}

const updateBreadcrumbs = (node) => {
  const crumbs = []
  const findPath = (nodes, targetId, path = []) => {
    for (const n of nodes) {
      if (n.id === targetId) {
        return [...path, n]
      }
      if (n.children_recursive?.length) {
        const found = findPath(n.children_recursive, targetId, [...path, n])
        if (found) return found
      }
    }
    return null
  }
  
  const path = findPath(locations.value, node.id)
  if (path) {
    breadcrumbs.value = path
  }
}

const navigateTo = (nodeId) => {
  const findNode = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children_recursive?.length) {
        const found = findNode(node.children_recursive, id)
        if (found) return found
      }
    }
    return null
  }
  
  const node = findNode(locations.value, nodeId)
  if (node) {
    selectNode(node)
  }
}

const refreshTree = () => {
  fetchLocations()
  selectedNode.value = null
  breadcrumbs.value = []
  showAlert('info', 'Tree refreshed')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const closeModal = () => {
  showModal.value = false
  currentLocation.value = null
}

/* ===============================
  LIFECYCLE
================================ */
onMounted(() => {
  fetchLocations()
})
</script>

<style scoped>
.file-manager-container {
  display: flex;
  height: calc(100vh - 150px);
}

.file-manager-sidebar {
  width: 320px;
  border-right: 1px solid #dee2e6;
  background: #f8f9fa;
}

.file-manager-content {
  flex: 1;
  background: white;
}

.hover-bg:hover {
  background-color: #f8f9fa;
}

.breadcrumb-item:not(.active) {
  color: #0d6efd;
  text-decoration: none;
}

.breadcrumb-item:not(.active):hover {
  text-decoration: underline;
}

.node-details {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>