<template>
  <div class="manage-requisition-types-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Requisition Types</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Requisition Type Settings</h2>
                <p class="text-muted mb-0 small">
                  Configure requisition types and link each type to an approval chain module.
                </p>
              </div>
              <button class="btn btn-primary" @click="openModal()">
                <i class="fa fa-plus me-2"></i>Add Requisition Type
              </button>
            </div>

            <div class="alert alert-info small mb-4">
              Use <strong>Approval Chain</strong> settings to create modules, roles, levels, and assignments. Then select the module here.
              <router-link to="/module-settings/approval-chain" class="ms-1">Open Approval Chain</router-link>
            </div>

            <StandardDataTable
              :columns="columns"
              :data="rows"
              :loading="loading"
              :filters="tableFilters"
              :default-page-size="tableFilters.pageSize"
              :disable-pagination="false"
              :show-date-filters="false"
              @update:filters="handleFiltersUpdate"
            >
              <template #is_active="{ row }">
                <span class="badge" :class="(row as any).is_active ? 'bg-success' : 'bg-secondary'">
                  {{ (row as any).is_active ? 'Active' : 'Inactive' }}
                </span>
              </template>

              <template #approval_chain_module_name="{ row }">
                {{ (row as any).approval_chain_module_name || moduleName((row as any).approval_chain_module_id) || '-' }}
              </template>

              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" title="Edit" @click="openModal(row as any)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" title="Delete" @click="confirmDelete(row as any)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-sitemap me-2"></i>
              {{ editingItem ? 'Edit Requisition Type' : 'Add Requisition Type' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveItem">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Code <span class="text-danger">*</span></label>
                  <input v-model="form.code" type="text" class="form-control" placeholder="e.g., PURCHASE" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Type <span class="text-danger">*</span></label>
                  <select v-model="form.type" class="form-select" required>
                    <option value="">Select...</option>
                    <option value="GENERAL_REQUISITION">GENERAL_REQUISITION</option>
                    <option value="ADMINISTRATION_REQUEST">ADMINISTRATION_REQUEST</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="form.name" type="text" class="form-control" placeholder="e.g., Purchase Requisition" required />
                </div>

                <div class="col-md-8">
                  <label class="form-label">Approval Chain Module</label>
                  <select v-model="form.approval_chain_module_id" class="form-select">
                    <option :value="null">-- None --</option>
                    <option v-for="m in approvalModules" :key="m.id" :value="m.id">
                      {{ m.name }}
                    </option>
                  </select>
                  <div class="form-text">
                    This controls which approval chain is applied when the requisition is submitted.
                  </div>
                </div>

                <div class="col-md-4 d-flex align-items-center">
                  <div class="form-check mt-4">
                    <input v-model="form.is_active" type="checkbox" class="form-check-input" id="isActive" />
                    <label class="form-check-label" for="isActive">Is Active</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveItem" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingItem ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { requisitionService } from '@/stores/bushman/requisitionService'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL || ''
const approvalChainBase = `${apiBaseUrl}approval-chain`

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingItem = ref<any>(null)

const rows = ref<any[]>([])
const approvalModules = ref<any[]>([])

const tableFilters = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
})

const columns = [
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'approval_chain_module_name', label: 'Approval Module', sortable: true, visible: true },
  { key: 'is_active', label: 'Active', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true, width: 140 },
] as any

const form = ref({
  code: '',
  type: '',
  name: '',
  approval_chain_module_id: null as number | null,
  is_active: true,
})

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
}

const moduleName = (id: number | null | undefined) => {
  if (!id) return ''
  return approvalModules.value.find((m) => m.id === id)?.name || ''
}

const fetchApprovalModules = async () => {
  try {
    const response = await axios.get(`${approvalChainBase}/modules`)
    const data = response.data?.data || response.data || []
    approvalModules.value = (Array.isArray(data) ? data : []).map((m: any) => ({
      id: m.id,
      name: m.name,
      active: !!m.active,
    }))
  } catch (error) {
    approvalModules.value = []
  }
}

const fetchTypes = async () => {
  loading.value = true
  try {
    const response = await requisitionService.listTypes()
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
    rows.value = data.map((t: any) => ({
      id: t.id,
      code: t.code || '',
      type: t.type || '',
      name: t.name || '',
      approval_chain_module_id: t.approval_chain_module_id || t.approval_chain_module?.id || null,
      approval_chain_module_name: t.approval_chain_module?.name || '',
      is_active: t.is_active === undefined ? !!t.active : !!t.is_active,
      raw: t,
    }))
  } catch (error) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

const openModal = (item?: any) => {
  editingItem.value = item || null
  form.value = {
    code: item?.code || '',
    type: item?.type || '',
    name: item?.name || '',
    approval_chain_module_id: item?.approval_chain_module_id || null,
    is_active: item?.is_active ?? true,
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const saveItem = async () => {
  if (!form.value.code || !form.value.type || !form.value.name) {
    Swal.fire('Validation Error', 'Code, type, and name are required.', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      code: form.value.code,
      type: form.value.type,
      name: form.value.name,
      approval_chain_module_id: form.value.approval_chain_module_id,
      is_active: form.value.is_active,
    }

    if (editingItem.value?.id) {
      await requisitionService.updateType(editingItem.value.id, payload)
    } else {
      await requisitionService.createType(payload)
    }

    await fetchTypes()
    closeModal()
    Swal.fire('Success', 'Requisition type saved successfully', 'success')
  } catch (error: any) {
    Swal.fire('Error', error?.response?.data?.message || 'Failed to save requisition type', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: any) => {
  const result = await Swal.fire({
    title: 'Delete Requisition Type?',
    text: `Delete \"${item.name || item.code}\"? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  })
  if (!result.isConfirmed) return

  try {
    await requisitionService.deleteType(item.id)
    await fetchTypes()
    Swal.fire('Deleted!', 'Requisition type has been deleted.', 'success')
  } catch (error: any) {
    Swal.fire('Error', error?.response?.data?.message || 'Failed to delete requisition type', 'error')
  }
}

onMounted(async () => {
  await Promise.all([fetchApprovalModules(), fetchTypes()])
})
</script>

<style scoped>
.manage-requisition-types-page {
  padding: 1rem;
}

.breadcrumb {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.breadcrumb-item {
  margin-right: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '/';
  margin-right: 0.5rem;
  color: #6c757d;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.breadcrumb-item a {
  color: #0d6efd;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.modal.show {
  display: block !important;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>
