<template>
  <div class="asset-groups-page">
    <!-- Page Header -->
    <div class="d-sm-flex align-items-center mb-3">
      <div>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/bushman/dashboard">Home</router-link></li>
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Asset Groups</li>
        </ol>
        <h1 class="page-header mb-0">Asset Groups</h1>
      </div>
      <div class="ms-auto">
        <button class="btn btn-primary" @click="openCreateForm">
          <i class="fa fa-plus me-2"></i>Add Asset Group
        </button>
      </div>
    </div>

    <!-- Filters Card -->
    <div class="card mb-3">
      <div class="card-body py-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label small text-muted mb-1">Search</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fa fa-search"></i></span>
              <input
                v-model="filters.search"
                type="text"
                class="form-control"
                placeholder="Search by code or name..."
                @input="debouncedSearch"
              />
              <button
                v-if="filters.search"
                class="btn btn-outline-secondary"
                type="button"
                @click="clearSearch"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted mb-1">Asset Class</label>
            <select v-model="filters.asset_class" class="form-select" @change="loadData">
              <option value="">All Classes</option>
              <option v-for="ac in assetClassOptions" :key="ac.value" :value="ac.value">
                {{ ac.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small text-muted mb-1">Status</label>
            <select v-model="filters.is_active" class="form-select" @change="loadData">
              <option value="">All</option>
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
          <div class="col-md-2">
            <div class="form-check form-switch pt-3">
              <input
                id="treeView"
                v-model="filters.as_tree"
                type="checkbox"
                class="form-check-input"
                @change="loadData"
              />
              <label for="treeView" class="form-check-label">
                <i class="fa fa-sitemap me-1"></i>Tree View
              </label>
            </div>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" @click="loadData" title="Refresh">
              <i class="fa fa-sync" :class="{ 'fa-spin': loading }"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Card -->
    <div class="card">
      <!-- Loading State -->
      <div v-if="loading" class="card-body text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="text-muted mb-0">Loading asset groups...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card-body">
        <div class="alert alert-danger mb-0">
          <div class="d-flex align-items-center">
            <i class="fa fa-exclamation-circle fa-2x me-3"></i>
            <div class="flex-grow-1">
              <h6 class="mb-1">Error Loading Data</h6>
              <p class="mb-0">{{ error }}</p>
            </div>
            <button class="btn btn-outline-danger" @click="loadData">
              <i class="fa fa-redo me-2"></i>Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!assetGroups.length" class="card-body text-center py-5">
        <i class="fa fa-folder-open fa-4x text-muted mb-3"></i>
        <h5 class="text-muted">No Asset Groups Found</h5>
        <p class="text-muted">Create your first asset group to start organizing your assets.</p>
        <button class="btn btn-primary" @click="openCreateForm">
          <i class="fa fa-plus me-2"></i>Create Asset Group
        </button>
      </div>

      <!-- Tree View -->
      <div v-else-if="filters.as_tree" class="card-body">
        <div class="tree-view">
          <template v-for="group in assetGroups" :key="group.id">
            <AssetGroupTreeItem
              :item="group"
              :level="0"
              @edit="openEditForm"
              @delete="confirmDelete"
            />
          </template>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="table-responsive">
        <table class="table table-hover table-striped align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 120px;">Code</th>
              <th>Name</th>
              <th style="width: 130px;">Asset Class</th>
              <th style="width: 150px;">Parent</th>
              <th style="width: 100px;">Useful Life</th>
              <th style="width: 100px;">Depr. Rate</th>
              <th style="width: 80px;">Status</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in flatList" :key="group.id">
              <td>
                <code class="text-primary fw-semibold">{{ group.code }}</code>
              </td>
              <td>
                <span v-if="group._level" class="text-muted me-1">
                  {{ '—'.repeat(group._level) }}
                </span>
                {{ group.name }}
              </td>
              <td>
                <span class="badge" :class="getClassBadge(group.asset_class)">
                  <i :class="getClassIcon(group.asset_class)" class="me-1"></i>
                  {{ getClassLabel(group.asset_class) }}
                </span>
              </td>
              <td>
                <span v-if="group.parent" class="text-muted small">
                  {{ group.parent.name }}
                </span>
                <span v-else class="badge bg-secondary">Root</span>
              </td>
              <td>
                <span v-if="group.default_useful_life_months">
                  {{ group.default_useful_life_months }} mo
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span v-if="group.default_depr_rate_percent">
                  {{ group.default_depr_rate_percent }}%
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span :class="group.is_active ? 'badge bg-success' : 'badge bg-secondary'">
                  {{ group.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-primary"
                    title="Edit"
                    @click="openEditForm(group)"
                  >
                    <i class="fa fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    title="Delete"
                    @click="confirmDelete(group)"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer with count -->
      <div v-if="assetGroups.length" class="card-footer bg-light py-2">
        <small class="text-muted">
          Showing {{ flatList.length }} asset group(s)
        </small>
      </div>
    </div>

    <!-- Offcanvas Form -->
    <AssetGroupOffcanvas
      ref="offcanvasRef"
      :is-open="showOffcanvas"
      :asset-group-to-edit="selectedGroup"
      :parent-groups="allGroups"
      :accounts="accounts"
      @close="closeOffcanvas"
      @save="handleSave"
    />


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import assetGroupService, { type AssetGroup } from '@/services/assetGroupService'
import AssetGroupOffcanvas from '@/components/AssetGroupOffcanvas.vue'
import AssetGroupTreeItem from '@/components/AssetGroupTreeItem.vue'

const toast = useToast()
const swal = useSwal()

// Refs
const offcanvasRef = ref<InstanceType<typeof AssetGroupOffcanvas> | null>(null)

// State
const loading = ref(false)
const error = ref('')
const assetGroups = ref<AssetGroup[]>([])
const allGroups = ref<AssetGroup[]>([])
const accounts = ref<any[]>([])

const filters = ref({
  search: '',
  asset_class: '',
  is_active: '' as '' | boolean,
  as_tree: false
})

// Form state
const showOffcanvas = ref(false)
const selectedGroup = ref<AssetGroup | null>(null)

// Delete state
const deleting = ref(false)

// Asset class options
const assetClassOptions = [
  { value: 'VEHICLE', label: 'Vehicle', icon: 'fa fa-car', badge: 'bg-primary' },
  { value: 'EQUIPMENT', label: 'Equipment', icon: 'fa fa-cogs', badge: 'bg-success' },
  { value: 'BUILDING', label: 'Building', icon: 'fa fa-building', badge: 'bg-info' },
  { value: 'IT', label: 'IT Asset', icon: 'fa fa-laptop', badge: 'bg-warning text-dark' },
  { value: 'FURNITURE', label: 'Furniture', icon: 'fa fa-chair', badge: 'bg-secondary' },
  { value: 'TIRE', label: 'Tire', icon: 'fa fa-circle', badge: 'bg-dark' },
  { value: 'OTHER', label: 'Other', icon: 'fa fa-box', badge: 'bg-light text-dark' }
]

// Computed
const flatList = computed(() => {
  const flatten = (items: AssetGroup[], level = 0): any[] => {
    const result: any[] = []
    for (const item of items) {
      result.push({ ...item, _level: level })
      if (item.children?.length) {
        result.push(...flatten(item.children, level + 1))
      }
    }
    return result
  }
  return flatten(assetGroups.value)
})

// Methods
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadData()
  }, 300)
}

function clearSearch() {
  filters.value.search = ''
  loadData()
}

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    const params: any = {}
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.asset_class) params.asset_class = filters.value.asset_class
    if (filters.value.is_active !== '') params.is_active = filters.value.is_active
    if (filters.value.as_tree) params.as_tree = true

    console.log('[AssetGroups] Loading with params:', params)
    const response = await assetGroupService.listAssetGroups(params)
    console.log('[AssetGroups] Response:', response)
    
    assetGroups.value = response.data?.data || response.data || []
    
    // Load all groups for parent dropdown (if not already loaded)
    if (!allGroups.value.length) {
      try {
        const allResp = await assetGroupService.listAssetGroups({ is_active: true })
        allGroups.value = allResp.data?.data || allResp.data || []
      } catch (e) {
        console.warn('[AssetGroups] Could not load all groups for dropdown')
      }
    }
  } catch (err: any) {
    console.error('[AssetGroups] Error:', err)
    
    if (err.response?.status === 404) {
      error.value = 'Asset Groups API not found (404). Backend endpoint may not be implemented.'
    } else if (err.message === 'Network Error') {
      error.value = 'Network error. Check if backend server is running.'
    } else {
      error.value = err.response?.data?.message || err.message || 'Failed to load data'
    }
  } finally {
    loading.value = false
  }
}

async function loadMetadata() {
  try {
    const response = await assetGroupService.getMetadata()
    const data = response.data?.data || response.data || {}
    if (Array.isArray(data.accounts)) accounts.value = data.accounts
    if (Array.isArray(data.parent_groups)) allGroups.value = data.parent_groups
  } catch (err) {
    console.warn('[AssetGroups] Metadata endpoint not available')
  }
}

function openCreateForm() {
  selectedGroup.value = null
  showOffcanvas.value = true
}

function openEditForm(group: AssetGroup) {
  selectedGroup.value = group
  showOffcanvas.value = true
}

function closeOffcanvas() {
  showOffcanvas.value = false
  selectedGroup.value = null
  offcanvasRef.value?.resetForm()
}

async function handleSave(payload: Partial<AssetGroup>) {
  console.log('[AssetGroups] Save event received from offcanvas')
  
  // Offcanvas already handled the API call, just refresh the list
  closeOffcanvas()
  await loadData()
  
  // Refresh all groups for dropdown
  try {
    const allResp = await assetGroupService.listAssetGroups({ is_active: true })
    allGroups.value = allResp.data?.data || allResp.data || []
  } catch (e) {
    console.warn('[AssetGroups] Could not refresh parent groups dropdown')
  }
}

async function confirmDelete(group: AssetGroup) {
  const confirmed = await swal.confirm({
    title: 'Delete Asset Group',
    text: `Are you sure you want to delete "${group.name}" (Code: ${group.code})? This action cannot be undone.`,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!confirmed) return

  deleting.value = true
  try {
    await assetGroupService.deleteAssetGroup(group.id!)
    toast.success('Asset group deleted')
    await loadData()
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to delete'
    toast.error(msg)
  } finally {
    deleting.value = false
  }
}

function getClassLabel(cls: string): string {
  return assetClassOptions.find(o => o.value === cls)?.label || cls
}

function getClassIcon(cls: string): string {
  return assetClassOptions.find(o => o.value === cls)?.icon || 'fa fa-folder'
}

function getClassBadge(cls: string): string {
  return assetClassOptions.find(o => o.value === cls)?.badge || 'bg-secondary'
}

// Lifecycle
onMounted(() => {
  loadMetadata()
  loadData()
})
</script>

<style scoped>
.page-header {
  font-size: 1.5rem;
  font-weight: 600;
}

code {
  background: rgba(0, 123, 255, 0.1);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
}

.tree-view {
  font-size: 0.9375rem;
}

.modal.show {
  background: rgba(0, 0, 0, 0.5);
}
</style>
