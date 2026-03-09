<template>
  <div class="inspection-categories-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Settings</a></li>
          <li class="breadcrumb-item"><a href="#">Inspection Settings</a></li>
          <li class="breadcrumb-item active">Maintenance Categories</li>
        </ul>
      </div>
    </div>

    <!-- List View -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
              >
                  <!-- @vue-ignore -->
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editItem(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>

                <!-- @vue-ignore -->
                <template #asset_group="{ row }">
                  {{ getAssetGroupName(row.asset_group_id) }}
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create/Edit Form -->
    <template v-else>
      <div class="p-2">
        <form class="mb-3" @submit.prevent="onSubmit" novalidate>
          <h3 class="fw-bold mb-3">{{ editMode ? 'Edit Category' : 'New Maintenance Category' }}</h3>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Category Name <span class="text-danger">*</span></label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="e.g., Engine, Tyres, Brakes, Firearms, Camp Equipment"
                required
              />
              <div class="form-text">Used to group maintenance parameters in inspection templates</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Asset Group</label>
              <select v-model="form.asset_group_id" class="form-select">
                <option :value="null">— None —</option>
                <option v-for="group in assetGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
              <div class="form-text">Optionally link to an asset group</div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-12 mb-3">
              <label class="form-label">Description</label>
              <textarea
                v-model="form.description"
                class="form-control"
                rows="3"
                placeholder="Describe what this category covers..."
              ></textarea>
            </div>
          </div>

          <div class="d-flex gap-2 mt-2">
            <button type="submit" class="btn btn-primary" :disabled="saving || !isFormValid">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ editMode ? 'Update' : 'Save' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'
import { inspectionService } from '@/services/inspectionService'
import { assetGroupService } from '@/services/assetGroupService'
import { useNotification } from '@/composables/notification'

const { showAlert } = useNotification()

// ==================== State ====================
const items = ref<any[]>([])
const assetGroups = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showList = ref(true)
const editMode = ref(false)

const form = reactive({
  id: null as number | null,
  name: '',
  description: '',
  asset_group_id: null as number | null
})

const columns = ref([
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Category Name', sortable: true, visible: true },
  { key: 'asset_group', label: 'Asset Group', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

// ==================== Computed ====================

const pageActions = computed(() => {
  if (!showList.value) return []
  return [
    {
      label: 'Refresh',
      icon: 'fa fa-sync-alt',
      class: 'btn btn-secondary',
      method: () => loadItems()
    },
    {
      label: 'Add Category',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => showCreateForm()
    }
  ]
})

const isFormValid = computed(() => {
  return (form.name || '').trim().length >= 2
})

function getAssetGroupName(id: number | null): string {
  if (!id) return '—'
  const group = assetGroups.value.find((g: any) => g.id === id)
  return group?.name || '—'
}

// ==================== Data Loading ====================

async function loadItems() {
  loading.value = true
  try {
    const response = await inspectionService.listCategories()
    items.value = response.data.data || response.data || []
  } catch (error: any) {
    showAlert('error', 'Failed to load categories')
  } finally {
    loading.value = false
  }
}

async function loadAssetGroups() {
  try {
    const response = await assetGroupService.listAssetGroups()
    assetGroups.value = response.data.data || response.data || []
  } catch {
    assetGroups.value = []
  }
}

// ==================== Form Actions ====================

function showCreateForm() {
  editMode.value = false
  resetForm()
  showList.value = false
}

function editItem(row: any) {
  editMode.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.asset_group_id = row.asset_group_id || null
  showList.value = false
}

function goBack() {
  resetForm()
  showList.value = true
  loadItems()
}

function resetForm() {
  form.id = null
  form.name = ''
  form.description = ''
  form.asset_group_id = null
  editMode.value = false
}

async function onSubmit() {
  if (!isFormValid.value) {
    showAlert('warning', 'Please enter a valid name (min 2 characters).')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      asset_group_id: form.asset_group_id || null
    }

    if (editMode.value && form.id) {
      await inspectionService.updateCategory(form.id, payload)
      showAlert('success', 'Category updated successfully')
    } else {
      await inspectionService.createCategory(payload)
      showAlert('success', 'Category created successfully')
    }
    goBack()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to save category')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Delete "${row.name}"? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  })

  if (result.isConfirmed) {
    try {
      await inspectionService.deleteCategory(row.id)
      showAlert('success', 'Category deleted successfully')
      loadItems()
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to delete category')
    }
  }
}

// ==================== Lifecycle ====================

onMounted(() => {
  loadItems()
  loadAssetGroups()
})
</script>

<style lang="scss" scoped>
.inspection-categories-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;

  .breadcrumb-item {
    text-transform: uppercase !important;

    &::before {
      content: ' / ' !important;
      color: #9ca3af !important;
      padding: 0 0.5rem;
    }

    &:first-child::before {
      display: none !important;
    }

    a {
      text-transform: uppercase !important;
      color: #374151 !important;
      font-weight: 600;
      text-decoration: none !important;

      &:hover {
        color: #1f2937 !important;
        text-decoration: none !important;
      }
    }

    &.active {
      color: #9ca3af !important;
      font-weight: 400;
      text-transform: uppercase !important;
    }
  }
}
</style>
