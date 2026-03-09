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
            <h5 class="mb-0">{{ template.name || 'Inspection Template' }}</h5>
            <small class="text-muted">
              Version {{ template.version_number }}
              <span :class="getStatusBadgeClass(template.status)" class="ms-2">{{ template.status }}</span>
            </small>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button
            v-if="template.status === 'draft'"
            class="btn btn-outline-primary btn-sm"
            @click="editTemplate"
          >
            <i class="fa fa-edit me-1"></i> Edit
          </button>
          <button
            v-if="template.status === 'published'"
            class="btn btn-outline-warning btn-sm"
            @click="confirmRetire"
          >
            <i class="fa fa-archive me-1"></i> Retire
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Template Info Card -->
        <div class="bg-white rounded p-4 mb-4">
          <div class="row">
            <div class="col-md-6">
              <table class="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td class="fw-bold text-muted" style="width: 150px">Name</td>
                    <td>{{ template.name }}</td>
                  </tr>
                  <tr>
                    <td class="fw-bold text-muted">Version</td>
                    <td>{{ template.version_number }}</td>
                  </tr>
                  <tr>
                    <td class="fw-bold text-muted">Status</td>
                    <td>
                      <span :class="getStatusBadgeClass(template.status)">{{ template.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="col-md-6">
              <table class="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td class="fw-bold text-muted" style="width: 150px">Site</td>
                    <td>{{ template.site?.name || 'All Sites' }}</td>
                  </tr>
                  <tr>
                    <td class="fw-bold text-muted">Active</td>
                    <td>
                      <span :class="template.is_active ? 'badge bg-success' : 'badge bg-secondary'">
                        {{ template.is_active ? 'Yes' : 'No' }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="fw-bold text-muted">Created</td>
                    <td>{{ formatDate(template.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="template.description" class="mt-3 pt-3 border-top">
            <p class="fw-bold text-muted mb-1">Description</p>
            <p class="mb-0">{{ template.description }}</p>
          </div>
        </div>

        <!-- Parameters Grouped by Section -->
        <div class="bg-white rounded p-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="mb-0">
              <i class="fa fa-clipboard-list me-1"></i>
              Inspection Parameters
              <span class="badge bg-primary ms-1">{{ parameters.length }}</span>
            </h6>
          </div>

          <SectionGroup :parameters="parameters" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'
import SectionGroup from './components/SectionGroup.vue'

const props = defineProps<{
  id: number
}>()

const router = useRouter()
const { showAlert } = useNotification()

const isLoading = ref(false)
const template = reactive({
  id: null as number | null,
  name: '',
  description: '',
  version_number: 1,
  status: 'draft',
  is_active: true,
  site: null as any,
  created_at: ''
})
const parameters = ref<any[]>([])

// ==================== Data Loading ====================

async function loadTemplate() {
  isLoading.value = true
  try {
    const response = await inspectionService.getTemplate(props.id)
    const data = response.data.data || response.data
    Object.assign(template, data)

    // Parameters are included in the show response — no separate call needed
    parameters.value = data.parameters || []
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load template')
  } finally {
    isLoading.value = false
  }
}

// ==================== Actions ====================

function editTemplate() {
  router.push({ name: 'inspection-template-edit', params: { id: props.id } })
}

async function confirmRetire() {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Retire Template?',
    text: `Are you sure you want to retire "${template.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Retire',
    confirmButtonColor: '#ffc107'
  })

  if (result.isConfirmed) {
    try {
      await inspectionService.retireTemplate(props.id)
      template.status = 'retired'
      showAlert('success', 'Template retired successfully')
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to retire template')
    }
  }
}

// ==================== Helpers ====================

function goBack() {
  router.push({ name: 'inspection-templates' })
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'draft': return 'badge bg-secondary'
    case 'published': return 'badge bg-success'
    case 'retired': return 'badge bg-warning text-dark'
    default: return 'badge bg-light text-dark'
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// ==================== Lifecycle ====================

onMounted(() => {
  loadTemplate()
})
</script>

<style scoped>
.ps-page {
  padding: 1rem;
}
</style>
