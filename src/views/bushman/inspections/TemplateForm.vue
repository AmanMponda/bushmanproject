<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Header -->
      <div class="page-head d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-outline-secondary btn-sm" @click="goBack">
            <i class="fa fa-arrow-left"></i>
          </button>
          <div>
            <h5 class="mb-0">{{ isEdit ? 'Edit Inspection Template' : 'Create Inspection Template' }}</h5>
            <small class="text-muted" v-if="isEdit">
              {{ template.name }} — v{{ template.version_number }}
              <span :class="getStatusBadgeClass(template.status)" class="ms-2">{{ template.status }}</span>
            </small>
          </div>
        </div>
        <div class="d-flex gap-2" v-if="isDraft">
          <button class="btn btn-primary" @click="saveTemplate" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="fa fa-save me-1"></i>
            {{ isEdit ? 'Update' : 'Save' }}
          </button>
          <button v-if="isEdit" class="btn btn-success" @click="confirmPublish" :disabled="saving">
            <i class="fa fa-check-circle me-1"></i> Publish
          </button>
        </div>
      </div>

      <!-- Alert Messages -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Tab Navigation -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'">
            <i class="fa fa-info-circle me-1"></i> Template Details
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'parameters' }" @click="activeTab = 'parameters'">
            <i class="fa fa-list me-1"></i> Parameters
            <span class="badge bg-primary ms-1">{{ parameters.length }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">
            <i class="fa fa-eye me-1"></i> Preview
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Details Tab -->
        <div v-show="activeTab === 'details'" class="bg-white rounded p-4">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label fw-bold">Template Name <span class="text-danger">*</span></label>
              <input
                v-model="template.name"
                type="text"
                class="form-control"
                placeholder="e.g., Safari Vehicle Pre-Trip Inspection"
                :disabled="!isDraft"
              />
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label fw-bold">Version</label>
              <input
                v-model.number="template.version_number"
                type="number"
                class="form-control"
                min="1"
                :disabled="!isDraft"
              />
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label fw-bold">Site</label>
              <Multiselect
                v-model="template.site"
                :options="sites"
                label="name"
                track-by="id"
                placeholder="All Sites"
                :searchable="true"
                :allowEmpty="true"
                :disabled="!isDraft"
              />
            </div>
          </div>
          <div class="row">
            <div class="col-md-12 mb-3">
              <label class="form-label fw-bold">Description</label>
              <textarea
                v-model="template.description"
                class="form-control"
                rows="3"
                placeholder="Describe the purpose of this inspection template..."
                :disabled="!isDraft"
              ></textarea>
            </div>
          </div>
          <div class="row">
            <div class="col-md-3 mb-3">
              <div class="form-check form-switch">
                <input
                  v-model="template.is_active"
                  type="checkbox"
                  class="form-check-input"
                  id="isActive"
                  :disabled="!isDraft"
                />
                <label class="form-check-label" for="isActive">Active</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Parameters Tab -->
        <div v-show="activeTab === 'parameters'" class="bg-white rounded p-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="mb-0">Template Parameters</h6>
            <div v-if="isDraft" class="d-flex gap-2">
              <button
                class="btn btn-primary btn-sm"
                @click="openAddParameterModal"
              >
                <i class="fa fa-plus me-1"></i> Add Parameter
              </button>
              <button
                class="btn btn-outline-primary btn-sm"
                @click="openBulkParameterModal()"
              >
                <i class="fa fa-layer-group me-1"></i> Bulk Add
              </button>
            </div>
          </div>

          <ParameterList
            :parameters="parameters"
            :readonly="!isDraft"
            @edit="openEditParameterModal"
            @remove="confirmRemoveParameter"
            @reorder="handleReorder"
          />
        </div>

        <!-- Preview Tab -->
        <div v-show="activeTab === 'preview'" class="bg-white rounded p-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="mb-0">Grouped Preview</h6>
          </div>
          <SectionGroup :parameters="parameters" />
        </div>
      </div>

      <!-- Parameter Form Modal -->
      <ParameterForm
        ref="parameterFormRef"
        :modelValue="editingParameter"
        :existingSections="existingSections"
        modalId="parameterFormModal"
        @submit="handleParameterSubmit"
      />

      <!-- Bulk Parameter Modal -->
      <BulkParameterModal
        ref="bulkParameterModalRef"
        :existingSections="existingSections"
        :existingParameterCount="parameters.length"
        modalId="bulkParameterModal"
        @submit="handleBulkParameterSubmit"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAppOptionStore } from '@/stores/app-option'
import { useRouter } from 'vue-router'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { Modal } from 'bootstrap'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'
import ParameterList from './components/ParameterList.vue'
import ParameterForm from './components/ParameterForm.vue'
import BulkParameterModal from './components/BulkParameterModal.vue'
import SectionGroup from './components/SectionGroup.vue'

const props = defineProps<{
  id?: number
}>()

const router = useRouter()
const { showAlert } = useNotification()

// ==================== State ====================

const isLoading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const activeTab = ref('details')
const parameterFormRef = ref<InstanceType<typeof ParameterForm> | null>(null)
const bulkParameterModalRef = ref<InstanceType<typeof BulkParameterModal> | null>(null)
const editingParameter = ref<any>(null)
const sites = ref<any[]>([])

const template = reactive({
  id: null as number | null,
  name: '',
  description: '',
  version_number: 1,
  status: 'draft',
  is_active: true,
  site: null as any,
  site_id: null as number | null
})

const parameters = ref<any[]>([])

// ==================== Computed ====================

const isEdit = computed(() => !!props.id)

const isDraft = computed(() => template.status === 'draft')

const existingSections = computed(() => {
  const sections = new Set<string>()
  parameters.value.forEach(p => {
    if (p.section) sections.add(p.section)
  })
  return Array.from(sections)
})

// ==================== Data Loading ====================

async function loadTemplate() {
  if (!props.id) return
  isLoading.value = true
  try {
    const response = await inspectionService.getTemplate(props.id)
    const data = response.data.data || response.data
    template.id = data.id
    template.name = data.name
    template.description = data.description || ''
    template.version_number = data.version_number
    template.status = data.status
    template.is_active = data.is_active
    template.site = data.site || null
    template.site_id = data.site_id

    // Load parameters
    await loadParameters()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to load template'
  } finally {
    isLoading.value = false
  }
}

async function loadParameters() {
  if (!props.id) return
  try {
    const response = await inspectionService.listParameters(props.id)
    parameters.value = response.data.data || response.data || []
  } catch (error: any) {
    console.error('Failed to load parameters:', error)
  }
}

async function loadSites() {
  // TODO: Implement when /sites endpoint is available in backend
  // Site field is nullable, so this is optional for now
  sites.value = []
  
  // try {
  //   const response = await inspectionService.listSites()
  //   sites.value = response.data.data || response.data || []
  // } catch {
  //   sites.value = []
  // }
}

// ==================== Template CRUD ====================

async function saveTemplate() {
  errorMessage.value = ''

  if (!template.name?.trim()) {
    errorMessage.value = 'Template name is required.'
    activeTab.value = 'details'
    return
  }

  saving.value = true
  try {
    const payload = {
      name: template.name.trim(),
      description: template.description?.trim() || null,
      version_number: template.version_number,
      is_active: template.is_active,
      site_id: template.site?.id || null
    }

    if (isEdit.value && template.id) {
      await inspectionService.updateTemplate(template.id, payload)
      showAlert('success', 'Template updated successfully')
      // Navigate back to the list after successful update
      goBack()
    } else {
      const response = await inspectionService.createTemplate(payload)
      const newId = response.data.data?.id || response.data?.id
      if (newId) {
        template.id = newId
        // Navigate to edit mode with the new ID so user can add parameters
        router.replace({ name: 'inspection-template-edit', params: { id: newId } })
      }
      showAlert('success', 'Template created successfully')
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to save template'
  } finally {
    saving.value = false
  }
}

async function confirmPublish() {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Publish Template?',
    text: 'Publishing will make this template read-only. It cannot be edited after publishing.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Publish',
    confirmButtonColor: '#28a745'
  })

  if (result.isConfirmed && template.id) {
    saving.value = true
    try {
      await inspectionService.publishTemplate(template.id)
      showAlert('success', 'Template published successfully')
      // Navigate back to the list after successful publish
      goBack()
    } catch (error: any) {
      errorMessage.value = error?.response?.data?.message || 'Failed to publish template'
    } finally {
      saving.value = false
    }
  }
}

// ==================== Parameter Management ====================

function openAddParameterModal() {
  editingParameter.value = null
  parameterFormRef.value?.resetForm()
  nextTick(() => {
    const modalEl = document.getElementById('parameterFormModal')
    if (modalEl) {
      const modal = Modal.getOrCreateInstance(modalEl)
      modal.show()
    }
  })
}

function openBulkParameterModal(tab?: string) {
  bulkParameterModalRef.value?.resetForm()
  nextTick(() => {
    const modalEl = document.getElementById('bulkParameterModal')
    if (modalEl) {
      const modal = Modal.getOrCreateInstance(modalEl)
      modal.show()
      // If a specific tab was requested (e.g. 'csv'), switch to it
      if (tab === 'csv') {
        nextTick(() => {
          const component = bulkParameterModalRef.value as any
          if (component) {
            component.activeTab = 'csv'
          }
        })
      }
    }
  })
}

function openEditParameterModal(param: any) {
  editingParameter.value = { ...param }
  nextTick(() => {
    const modalEl = document.getElementById('parameterFormModal')
    if (modalEl) {
      const modal = Modal.getOrCreateInstance(modalEl)
      modal.show()
    }
  })
}

async function handleParameterSubmit(paramData: any) {
  if (!template.id) {
    // Template not yet saved — save first, then add parameter
    errorMessage.value = 'Please save the template first before adding parameters.'
    return
  }

  saving.value = true
  try {
    if (paramData.id) {
      // Update existing parameter
      await inspectionService.updateParameter(template.id, paramData.id, {
        section: paramData.section,
        position: paramData.position,
        required: paramData.required
      })
      showAlert('success', 'Parameter updated')
    } else {
      // Add new parameter
      await inspectionService.addParameter(template.id, {
        maintenance_parameter_id: paramData.maintenance_parameter_id,
        section: paramData.section,
        position: paramData.position || parameters.value.length + 1,
        required: paramData.required
      })
      showAlert('success', 'Parameter added')
    }

    // Close modal
    const modalEl = document.getElementById('parameterFormModal')
    if (modalEl) {
      const modal = Modal.getInstance(modalEl)
      modal?.hide()
    }

    // Reload parameters
    await loadParameters()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to save parameter'
  } finally {
    saving.value = false
  }
}

async function handleBulkParameterSubmit(data: { type: string; parameters: any[] }) {
  if (!template.id) {
    errorMessage.value = 'Please save the template first before adding parameters.'
    return
  }

  if (!data.parameters || data.parameters.length === 0) {
    errorMessage.value = 'No parameters to add.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  let successCount = 0
  let failCount = 0

  try {
    // Try bulk endpoint first
    try {
      await inspectionService.addBulkParameters(template.id, {
        parameters: data.parameters.map(p => ({
          maintenance_parameter_id: p.maintenance_parameter_id,
          section: p.section,
          position: p.position,
          required: p.required
        }))
      })
      successCount = data.parameters.length
    } catch (bulkError: any) {
      // If bulk endpoint not available (404/405), fall back to adding one-by-one
      const status = bulkError?.response?.status
      if (status === 404 || status === 405) {
        for (const param of data.parameters) {
          try {
            await inspectionService.addParameter(template.id!, {
              maintenance_parameter_id: param.maintenance_parameter_id,
              section: param.section,
              position: param.position,
              required: param.required
            })
            successCount++
          } catch {
            failCount++
          }
        }
      } else {
        throw bulkError
      }
    }

    // Close modal
    const modalEl = document.getElementById('bulkParameterModal')
    if (modalEl) {
      const modal = Modal.getInstance(modalEl)
      modal?.hide()
    }

    // Show result
    if (failCount > 0) {
      showAlert('warning', `Added ${successCount} parameter(s). ${failCount} failed.`)
    } else {
      showAlert('success', `Successfully added ${successCount} parameter(s)!`)
    }

    // Reload parameters
    await loadParameters()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to add parameters'
  } finally {
    saving.value = false
  }
}

async function confirmRemoveParameter(param: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const paramName = param.maintenance_parameter?.name || 'this parameter'
  const result = await Swal.fire({
    title: 'Remove Parameter?',
    text: `Remove "${paramName}" from this template?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Remove',
    confirmButtonColor: '#dc3545'
  })

  if (result.isConfirmed && template.id) {
    try {
      await inspectionService.removeParameter(template.id, param.id)
      showAlert('success', 'Parameter removed')
      await loadParameters()
    } catch (error: any) {
      errorMessage.value = error?.response?.data?.message || 'Failed to remove parameter'
    }
  }
}

async function handleReorder(reorderedItems: any[]) {
  if (!template.id) return

  // Update local state immediately
  parameters.value = reorderedItems

  try {
    await inspectionService.reorderParameters(template.id, {
      parameters: reorderedItems.map(item => ({
        id: item.id,
        position: item.position
      }))
    })
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to reorder parameters'
    // Reload to get correct order
    await loadParameters()
  }
}

// ==================== Navigation ====================

function goBack() {
  router.push({ name: 'inspection-templates' })
}

// ==================== Helpers ====================

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'draft': return 'badge bg-secondary'
    case 'published': return 'badge bg-success'
    case 'retired': return 'badge bg-warning text-dark'
    default: return 'badge bg-light text-dark'
  }
}

// ==================== Lifecycle ====================
const appOption = useAppOptionStore()

onMounted(async () => {
  appOption.appSidebarMinified = true
  await loadSites()
  if (isEdit.value) {
    await loadTemplate()
  }
})

onBeforeUnmount(() => {
  appOption.appSidebarMinified = false
})
</script>

<style scoped>
.ps-page {
  padding: 1rem;
}

.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  font-weight: 600;
}
</style>
