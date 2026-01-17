<template>
  <div class="manage-approval-chain-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Approval Chain</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Approval Chain Settings</h2>
                <p class="text-muted mb-0 small">
                  Configure modules, roles, levels, and approvers in order. Build the chain from top to bottom.
                </p>
              </div>
            </div>

            <div class="alert alert-info small mb-4">
              <strong>Typical flow:</strong> create modules, add roles, define ordered levels per module, then assign users.
            </div>

            <ul class="nav nav-tabs mb-3">
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'modules' }" @click="activeTab = 'modules'">
                  Modules
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'">
                  Roles
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'levels' }" @click="activeTab = 'levels'">
                  Levels
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'assignments' }" @click="activeTab = 'assignments'">
                  Assignments
                </button>
              </li>
            </ul>

            <div v-if="activeTab === 'modules'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Modules</h5>
                <button class="btn btn-primary" @click="openModuleModal()">
                  <i class="fa fa-plus me-2"></i>Add Module
                </button>
              </div>

              <div v-if="loadingModules" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="module in modules" :key="module.id">
                      <td><strong>{{ module.name }}</strong></td>
                      <td>{{ module.description || '-' }}</td>
                      <td>
                        <span class="badge" :class="module.active ? 'bg-success' : 'bg-secondary'">
                          {{ module.active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click="openModuleModal(module)">
                            <i class="fa fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="confirmDeleteModule(module)">
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="modules.length === 0" class="text-center text-muted py-4">
                  No modules configured.
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'roles'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Roles</h5>
                <button class="btn btn-primary" @click="openRoleModal()">
                  <i class="fa fa-plus me-2"></i>Add Role
                </button>
              </div>

              <div v-if="loadingRoles" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Past Tense Label</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="role in roles" :key="role.id">
                      <td><strong>{{ role.name }}</strong></td>
                      <td>{{ role.past }}</td>
                      <td class="text-center">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click="openRoleModal(role)">
                            <i class="fa fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="confirmDeleteRole(role)">
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="roles.length === 0" class="text-center text-muted py-4">
                  No roles configured.
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'levels'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Levels</h5>
                <button class="btn btn-primary" @click="openLevelModal()">
                  <i class="fa fa-plus me-2"></i>Add Level
                </button>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-3">
                  <select v-model="levelFilters.module_id" class="form-select">
                    <option :value="null">All Modules</option>
                    <option v-for="module in modules" :key="module.id" :value="module.id">{{ module.name }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <select v-model="levelFilters.role_id" class="form-select">
                    <option :value="null">All Roles</option>
                    <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <select v-model="levelFilters.position_id" class="form-select">
                    <option :value="null">All Positions</option>
                    <option v-for="position in positions" :key="position.role_id" :value="position.role_id">
                      {{ position.role_name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-3">
                  <select v-model="levelFilters.is_active" class="form-select">
                    <option value="">All Status</option>
                    <option :value="true">Active</option>
                    <option :value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div v-if="loadingLevels" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Module</th>
                      <th>Role</th>
                      <th>Level ID</th>
                      <th>Position</th>
                      <th>Can Change Source</th>
                      <th>Status</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="level in filteredLevels" :key="level.id">
                      <td>{{ level.approval_chain_module?.name || moduleName(level.approval_chain_module_id) }}</td>
                      <td>{{ level.approval_chain_role?.name || roleName(level.approval_chain_role_id) }}</td>
                      <td>{{ level.level_id }}</td>
                      <td>{{ level.position?.role_name || level.position_id || '-' }}</td>
                      <td>
                        <span class="badge" :class="level.can_change_source ? 'bg-success' : 'bg-secondary'">
                          {{ level.can_change_source ? 'Yes' : 'No' }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" :class="level.is_active ? 'bg-success' : 'bg-secondary'">
                          {{ level.is_active ? 'active' : 'inactive' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click="openLevelModal(level)">
                            <i class="fa fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="confirmDeleteLevel(level)">
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="levels.length === 0" class="text-center text-muted py-4">
                  No levels configured.
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'assignments'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Assignments</h5>
                <button class="btn btn-primary" @click="openAssignmentModal()">
                  <i class="fa fa-plus me-2"></i>Assign Approver
                </button>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <select v-model="assignmentFilters.module_id" class="form-select" @change="onAssignmentModuleChange">
                    <option :value="null">All Modules</option>
                    <option v-for="module in modules" :key="module.id" :value="module.id">{{ module.name }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <select v-model="assignmentFilters.level_id" class="form-select" @change="fetchAssignments">
                    <option :value="null">All Levels</option>
                    <option v-for="level in levelsForAssignment" :key="level.id" :value="level.id">
                      Level {{ level.level_id }} - {{ level.approval_chain_role?.name || roleName(level.approval_chain_role_id) }}
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <select v-model="assignmentFilters.user_id" class="form-select" @change="fetchAssignments">
                    <option :value="null">All Users</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                      {{ formatUserName(user) }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="loadingAssignments" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Module</th>
                      <th>Level</th>
                      <th>Role</th>
                      <th>User</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="assignment in assignments" :key="assignment.id">
                      <td>{{ assignment.approval_chain_module?.name || moduleName(assignment.approval_chain_module_id) }}</td>
                      <td>{{ assignment.approval_chain_level?.level_id || levelId(assignment.approval_chain_level_id) }}</td>
                      <td>
                        {{ assignment.approval_chain_level?.approval_chain_role?.name || levelRoleName(assignment.approval_chain_level_id) }}
                      </td>
                      <td>{{ formatUserName(assignment.user || userById(assignment.user_id)) }}</td>
                      <td class="text-center">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click="openAssignmentModal(assignment)">
                            <i class="fa fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="confirmDeleteAssignment(assignment)">
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="assignments.length === 0" class="text-center text-muted py-4">
                  No assignments configured.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" :class="{ show: showModuleModal }" :style="{ display: showModuleModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-layer-group me-2"></i>
              {{ editingModule ? 'Edit Module' : 'Add Module' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModuleModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveModule">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="moduleForm.name" type="text" class="form-control" required />
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea v-model="moduleForm.description" class="form-control" rows="3"></textarea>
                </div>
                <div class="col-12">
                  <div class="form-check mt-2">
                    <input v-model="moduleForm.active" type="checkbox" class="form-check-input" id="moduleActive" />
                    <label class="form-check-label" for="moduleActive">Active</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModuleModal">Cancel</button>
            <button class="btn btn-primary" @click="saveModule" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingModule ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModuleModal" class="modal-backdrop fade show"></div>

    <div class="modal fade" :class="{ show: showRoleModal }" :style="{ display: showRoleModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-user-tag me-2"></i>
              {{ editingRole ? 'Edit Role' : 'Add Role' }}
            </h5>
            <button type="button" class="btn-close" @click="closeRoleModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveRole">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="roleForm.name" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Past Tense <span class="text-danger">*</span></label>
                  <input v-model="roleForm.past" type="text" class="form-control" required maxlength="10" placeholder="APPROVED" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeRoleModal">Cancel</button>
            <button class="btn btn-primary" @click="saveRole" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingRole ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showRoleModal" class="modal-backdrop fade show"></div>

    <div class="modal fade" :class="{ show: showLevelModal }" :style="{ display: showLevelModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-stream me-2"></i>
              {{ editingLevel ? 'Edit Level' : 'Add Level' }}
            </h5>
            <button type="button" class="btn-close" @click="closeLevelModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveLevel">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Module <span class="text-danger">*</span></label>
                  <select v-model="levelForm.approval_chain_module_id" class="form-select" required>
                    <option :value="null">Select Module</option>
                    <option v-for="module in modules" :key="module.id" :value="module.id">{{ module.name }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Role <span class="text-danger">*</span></label>
                  <select v-model="levelForm.approval_chain_role_id" class="form-select" required>
                    <option :value="null">Select Role</option>
                    <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Level ID <span class="text-danger">*</span></label>
                  <input v-model.number="levelForm.level_id" type="number" min="1" class="form-control" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Position <span class="text-danger">*</span></label>
                  <select v-model="levelForm.position_id" class="form-select" required>
                    <option :value="null">Select Position</option>
                    <option v-for="position in positions" :key="position.role_id" :value="position.role_id">
                      {{ position.role_name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <div class="form-check form-switch mt-2">
                    <input v-model="levelForm.is_active" type="checkbox" class="form-check-input" id="levelIsActive" />
                    <label class="form-check-label" for="levelIsActive">Active</label>
                  </div>
                </div>
                <div class="col-12">
                  <div class="form-check mt-2">
                    <input v-model="levelForm.can_change_source" type="checkbox" class="form-check-input" id="levelChangeSource" />
                    <label class="form-check-label" for="levelChangeSource">Can Change Source</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeLevelModal">Cancel</button>
            <button class="btn btn-primary" @click="saveLevel" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingLevel ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showLevelModal" class="modal-backdrop fade show"></div>

    <div class="modal fade" :class="{ show: showAssignmentModal }" :style="{ display: showAssignmentModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-user-check me-2"></i>
              {{ editingAssignment ? 'Edit Assignment' : 'Assign Approver' }}
            </h5>
            <button type="button" class="btn-close" @click="closeAssignmentModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveAssignment">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Module <span class="text-danger">*</span></label>
                  <select v-model="assignmentForm.approval_chain_module_id" class="form-select" required @change="onAssignmentFormModuleChange">
                    <option :value="null">Select Module</option>
                    <option v-for="module in modules" :key="module.id" :value="module.id">{{ module.name }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Level <span class="text-danger">*</span></label>
                  <select v-model="assignmentForm.approval_chain_level_id" class="form-select" required>
                    <option :value="null">Select Level</option>
                    <option v-for="level in levelsForAssignmentForm" :key="level.id" :value="level.id">
                      Level {{ level.level_id }} - {{ level.approval_chain_role?.name || roleName(level.approval_chain_role_id) }}
                    </option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">User <span class="text-danger">*</span></label>
                  <select v-model="assignmentForm.user_id" class="form-select" required>
                    <option :value="null">Select User</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                      {{ formatUserName(user) }}
                    </option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeAssignmentModal">Cancel</button>
            <button class="btn btn-primary" @click="saveAssignment" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingAssignment ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAssignmentModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL || ''
const approvalChainBase = `${apiBaseUrl}approval-chain`
const usersUrl = `${apiBaseUrl}users`

const activeTab = ref('modules')

const modules = ref<any[]>([])
const roles = ref<any[]>([])
const positions = ref<any[]>([])
const levels = ref<any[]>([])
const assignments = ref<any[]>([])
const users = ref<any[]>([])

const loadingModules = ref(false)
const loadingRoles = ref(false)
const loadingLevels = ref(false)
const loadingAssignments = ref(false)
const saving = ref(false)

const showModuleModal = ref(false)
const showRoleModal = ref(false)
const showLevelModal = ref(false)
const showAssignmentModal = ref(false)

const editingModule = ref<any>(null)
const editingRole = ref<any>(null)
const editingLevel = ref<any>(null)
const editingAssignment = ref<any>(null)

const moduleForm = ref({
  name: '',
  description: '',
  active: true,
})

const roleForm = ref({
  name: '',
  past: '',
})

const levelForm = ref({
  approval_chain_module_id: null as number | null,
  approval_chain_role_id: null as number | null,
  level_id: 1,
  can_change_source: false,
  position_id: null as number | null,
  is_active: true,
})

const assignmentForm = ref({
  user_id: null as number | null,
  approval_chain_module_id: null as number | null,
  approval_chain_level_id: null as number | null,
})

const levelFilters = ref({
  module_id: null as number | null,
  role_id: null as number | null,
  position_id: null as number | null,
  is_active: '' as '' | boolean,
})

const assignmentFilters = ref({
  module_id: null as number | null,
  level_id: null as number | null,
  user_id: null as number | null,
})

const levelsForAssignment = computed(() => {
  if (!assignmentFilters.value.module_id) return levels.value
  return levels.value.filter((level) => level.approval_chain_module_id === assignmentFilters.value.module_id)
})

const levelsForAssignmentForm = computed(() => {
  if (!assignmentForm.value.approval_chain_module_id) return levels.value
  return levels.value.filter((level) => level.approval_chain_module_id === assignmentForm.value.approval_chain_module_id)
})

const filteredLevels = computed(() => {
  return levels.value.filter((level) => {
    if (levelFilters.value.module_id && level.approval_chain_module_id !== levelFilters.value.module_id) return false
    if (levelFilters.value.role_id && level.approval_chain_role_id !== levelFilters.value.role_id) return false
    if (levelFilters.value.position_id && level.position_id !== levelFilters.value.position_id) return false
    if (levelFilters.value.is_active !== '' && level.is_active !== levelFilters.value.is_active) return false
    return true
  })
})

const parseList = (response: any) => response?.data?.data || response?.data || []

const buildErrorMessage = (error: any, fallback = 'Request failed') => {
  const data = error?.response?.data
  let message = data?.message || fallback
  const errors = data?.errors
  if (errors) {
    const details = Object.values(errors).flat().join('\n')
    message = `${message}\n${details}`
  }
  return message
}

const fetchModules = async () => {
  loadingModules.value = true
  try {
    const response = await axios.get(`${approvalChainBase}/modules`)
    modules.value = parseList(response)
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to load modules'), 'error')
  } finally {
    loadingModules.value = false
  }
}

const fetchRoles = async () => {
  loadingRoles.value = true
  try {
    const response = await axios.get(`${approvalChainBase}/roles`)
    roles.value = parseList(response)
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to load roles'), 'error')
  } finally {
    loadingRoles.value = false
  }
}

const fetchPositions = async () => {
  try {
    const response = await axios.get(`${approvalChainBase}/positions`)
    positions.value = parseList(response)
  } catch (error: any) {
    console.error('Failed to load positions', error)
  }
}

const fetchLevels = async () => {
  loadingLevels.value = true
  try {
    const response = await axios.get(`${approvalChainBase}/levels`)
    levels.value = parseList(response)
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to load levels'), 'error')
  } finally {
    loadingLevels.value = false
  }
}

const fetchAssignments = async () => {
  loadingAssignments.value = true
  try {
    const params = new URLSearchParams()
    if (assignmentFilters.value.module_id) params.append('module_id', assignmentFilters.value.module_id.toString())
    if (assignmentFilters.value.level_id) params.append('level_id', assignmentFilters.value.level_id.toString())
    if (assignmentFilters.value.user_id) params.append('user_id', assignmentFilters.value.user_id.toString())
    const response = await axios.get(`${approvalChainBase}/assignments?${params.toString()}`)
    assignments.value = parseList(response)
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to load assignments'), 'error')
  } finally {
    loadingAssignments.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await axios.get(usersUrl)
    users.value = parseList(response)
  } catch (error: any) {
    console.error('Failed to load users', error)
  }
}

const openModuleModal = (module?: any) => {
  editingModule.value = module || null
  moduleForm.value = {
    name: module?.name || '',
    description: module?.description || '',
    active: module?.active ?? true,
  }
  showModuleModal.value = true
}

const closeModuleModal = () => {
  showModuleModal.value = false
  editingModule.value = null
}

const saveModule = async () => {
  if (!moduleForm.value.name) {
    Swal.fire('Validation Error', 'Module name is required', 'warning')
    return
  }
  saving.value = true
  try {
    if (editingModule.value) {
      await axios.put(`${approvalChainBase}/modules/${editingModule.value.id}`, moduleForm.value)
    } else {
      await axios.post(`${approvalChainBase}/modules`, moduleForm.value)
    }
    await fetchModules()
    Swal.fire('Success', 'Module saved successfully', 'success')
    closeModuleModal()
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to save module'), 'error')
  } finally {
    saving.value = false
  }
}

const confirmDeleteModule = (module: any) => {
  Swal.fire({
    title: 'Delete Module?',
    text: `Delete "${module.name}"? This may fail if levels or assignments exist.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (!result.isConfirmed) return
    try {
      await axios.delete(`${approvalChainBase}/modules/${module.id}`)
      await fetchModules()
      Swal.fire('Deleted!', 'Module has been deleted.', 'success')
    } catch (error: any) {
      Swal.fire('Error', buildErrorMessage(error, 'Failed to delete module'), 'error')
    }
  })
}

const openRoleModal = (role?: any) => {
  editingRole.value = role || null
  roleForm.value = {
    name: role?.name || '',
    past: role?.past || '',
  }
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  editingRole.value = null
}

const saveRole = async () => {
  if (!roleForm.value.name || !roleForm.value.past) {
    Swal.fire('Validation Error', 'Role name and past tense are required', 'warning')
    return
  }
  saving.value = true
  try {
    if (editingRole.value) {
      await axios.put(`${approvalChainBase}/roles/${editingRole.value.id}`, roleForm.value)
    } else {
      await axios.post(`${approvalChainBase}/roles`, roleForm.value)
    }
    await fetchRoles()
    Swal.fire('Success', 'Role saved successfully', 'success')
    closeRoleModal()
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to save role'), 'error')
  } finally {
    saving.value = false
  }
}

const confirmDeleteRole = (role: any) => {
  Swal.fire({
    title: 'Delete Role?',
    text: `Delete "${role.name}"? This may fail if used by a level.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (!result.isConfirmed) return
    try {
      await axios.delete(`${approvalChainBase}/roles/${role.id}`)
      await fetchRoles()
      Swal.fire('Deleted!', 'Role has been deleted.', 'success')
    } catch (error: any) {
      Swal.fire('Error', buildErrorMessage(error, 'Failed to delete role'), 'error')
    }
  })
}

const openLevelModal = (level?: any) => {
  editingLevel.value = level || null
  levelForm.value = {
    approval_chain_module_id: level?.approval_chain_module_id || null,
    approval_chain_role_id: level?.approval_chain_role_id || null,
    level_id: level?.level_id || 1,
    can_change_source: level?.can_change_source ?? false,
    position_id: level?.position_id || null,
    is_active: level?.is_active ?? true,
  }
  showLevelModal.value = true
}

const closeLevelModal = () => {
  showLevelModal.value = false
  editingLevel.value = null
}

const saveLevel = async () => {
  if (!levelForm.value.approval_chain_module_id || !levelForm.value.approval_chain_role_id || !levelForm.value.level_id || !levelForm.value.position_id) {
    Swal.fire('Validation Error', 'Module, role, level id, and position id are required', 'warning')
    return
  }
  saving.value = true
  try {
    if (editingLevel.value) {
      await axios.put(`${approvalChainBase}/levels/${editingLevel.value.id}`, levelForm.value)
    } else {
      await axios.post(`${approvalChainBase}/levels`, levelForm.value)
    }
    await fetchLevels()
    Swal.fire('Success', 'Level saved successfully', 'success')
    closeLevelModal()
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to save level'), 'error')
  } finally {
    saving.value = false
  }
}

const confirmDeleteLevel = (level: any) => {
  Swal.fire({
    title: 'Delete Level?',
    text: `Delete level ${level.level_id}? This may fail if assignments exist.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (!result.isConfirmed) return
    try {
      await axios.delete(`${approvalChainBase}/levels/${level.id}`)
      await fetchLevels()
      Swal.fire('Deleted!', 'Level has been deleted.', 'success')
    } catch (error: any) {
      Swal.fire('Error', buildErrorMessage(error, 'Failed to delete level'), 'error')
    }
  })
}

const openAssignmentModal = (assignment?: any) => {
  editingAssignment.value = assignment || null
  assignmentForm.value = {
    user_id: assignment?.user_id || assignment?.user?.id || null,
    approval_chain_module_id: assignment?.approval_chain_module_id || null,
    approval_chain_level_id: assignment?.approval_chain_level_id || null,
  }
  showAssignmentModal.value = true
}

const closeAssignmentModal = () => {
  showAssignmentModal.value = false
  editingAssignment.value = null
}

const onAssignmentFormModuleChange = () => {
  if (!levelsForAssignmentForm.value.find((level) => level.id === assignmentForm.value.approval_chain_level_id)) {
    assignmentForm.value.approval_chain_level_id = null
  }
}

const saveAssignment = async () => {
  if (!assignmentForm.value.user_id || !assignmentForm.value.approval_chain_module_id || !assignmentForm.value.approval_chain_level_id) {
    Swal.fire('Validation Error', 'Module, level, and user are required', 'warning')
    return
  }
  saving.value = true
  try {
    if (editingAssignment.value) {
      await axios.put(`${approvalChainBase}/assignments/${editingAssignment.value.id}`, assignmentForm.value)
    } else {
      await axios.post(`${approvalChainBase}/assignments`, assignmentForm.value)
    }
    await fetchAssignments()
    Swal.fire('Success', 'Assignment saved successfully', 'success')
    closeAssignmentModal()
  } catch (error: any) {
    Swal.fire('Error', buildErrorMessage(error, 'Failed to save assignment'), 'error')
  } finally {
    saving.value = false
  }
}

const confirmDeleteAssignment = (assignment: any) => {
  Swal.fire({
    title: 'Delete Assignment?',
    text: 'Delete this approver assignment?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (!result.isConfirmed) return
    try {
      await axios.delete(`${approvalChainBase}/assignments/${assignment.id}`)
      await fetchAssignments()
      Swal.fire('Deleted!', 'Assignment has been deleted.', 'success')
    } catch (error: any) {
      Swal.fire('Error', buildErrorMessage(error, 'Failed to delete assignment'), 'error')
    }
  })
}

const onAssignmentModuleChange = () => {
  if (!levelsForAssignment.value.find((level) => level.id === assignmentFilters.value.level_id)) {
    assignmentFilters.value.level_id = null
  }
  fetchAssignments()
}

const moduleName = (moduleId: number) => modules.value.find((module) => module.id === moduleId)?.name || '-'
const roleName = (roleId: number) => roles.value.find((role) => role.id === roleId)?.name || '-'
const levelId = (levelId: number) => levels.value.find((level) => level.id === levelId)?.level_id || '-'
const levelRoleName = (levelId: number) => {
  const level = levels.value.find((item) => item.id === levelId)
  return level?.approval_chain_role?.name || roleName(level?.approval_chain_role_id) || '-'
}

const userById = (userId: number) => users.value.find((user) => user.id === userId)

const formatUserName = (user: any) => {
  if (!user) return '-'
  const first = user.first_name || user.firstName || ''
  const last = user.last_name || user.lastName || ''
  const full = `${first} ${last}`.trim()
  return full || user.username || user.email || `User #${user.id}`
}

onMounted(async () => {
  await Promise.all([fetchModules(), fetchRoles(), fetchPositions(), fetchLevels(), fetchAssignments(), fetchUsers()])
})
</script>

<style scoped>
.manage-approval-chain-page {
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

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style>
