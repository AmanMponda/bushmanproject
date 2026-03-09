<template>
  <div class="inspection-details-page">
    <!-- Page Header -->
    <div class="d-flex align-items-center mb-3">
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><router-link to="/inspections">Inspections</router-link></li>
        <li class="breadcrumb-item active">{{ inspection?.reference || `Inspection #${inspection?.id}` || 'Inspection Details' }}</li>
      </ul>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Loading inspection...</p>
    </div>

    <!-- Content -->
    <template v-else-if="inspection">
      <div class="card shadow-sm">
        <!-- Header -->
        <div class="card-header bg-white py-3">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <button class="btn btn-outline-secondary btn-sm" @click="goBack">
                <i class="fa fa-arrow-left"></i>
              </button>
              <div>
                <h5 class="mb-1">
                  {{ inspection.reference || `Inspection #${inspection.id}` }}
                  <span :class="statusBadgeClass" class="ms-2">{{ inspection.status }}</span>
                </h5>
                <p class="text-muted mb-0 small">
                  <i class="fa fa-calendar me-1"></i> {{ formatDateTime(inspection.inspected_at) }}
                  <span class="mx-2">|</span>
                  <i class="fa fa-user-shield me-1"></i> {{ resolveUserName(inspection.inspector_id, inspection.inspector) }}
                  <span class="mx-2">|</span>
                  <i class="fa fa-user me-1"></i> Created by: {{ resolveUserName(inspection.user_id, inspection.user) }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-secondary btn-sm"
                @click="goBack"
              >
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>
              <button
                v-if="inspection.status === 'draft'"
                class="btn btn-primary btn-sm"
                :disabled="actionLoading"
                @click="handleSubmitInspection"
              >
                <i class="fa fa-paper-plane me-1"></i> Submit
              </button>
              <button
                v-if="inspection.status === 'submitted'"
                class="btn btn-success btn-sm"
                :disabled="actionLoading"
                @click="handleApprove"
              >
                <i class="fa fa-check me-1"></i> Approve
              </button>
              <button
                v-if="inspection.status === 'submitted'"
                class="btn btn-warning btn-sm"
                :disabled="actionLoading"
                @click="handleReject"
              >
                <i class="fa fa-times me-1"></i> Reject
              </button>
            </div>
          </div>

          <!-- Template & Dimensions summary -->
          <div class="row mt-3 pt-3 border-top g-2">
            <div class="col-auto" v-if="inspection.template">
              <span class="text-muted small me-1">Template:</span>
              <span class="fw-semibold small">{{ inspection.template?.name }}</span>
            </div>
            <div class="col-auto" v-if="inspection.accounting_dimensions && inspection.accounting_dimensions.length">
              <span class="text-muted small me-1">Assets:</span>
              <span
                v-for="dim in inspection.accounting_dimensions"
                :key="dim.id"
                class="badge bg-light text-dark border me-1"
              >
                {{ dim.accounting_dimension?.name || dim.vehicle_asset?.registration_number || dim.accounting_dimension?.code || dim.name || `Asset #${dim.id}` }}
              </span>
            </div>
            <div class="col-auto" v-if="inspection.narrations">
              <span class="text-muted small me-1">Notes:</span>
              <span class="small">{{ inspection.narrations }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs inside the card -->
        <div class="card-body p-0">
          <ul class="nav nav-tabs px-3 pt-2" role="tablist">
            <li class="nav-item" v-for="tab in tabItems" :key="tab.key">
              <a
                class="nav-link"
                :class="{ active: activeTab === tab.key }"
                href="#"
                @click.prevent="activeTab = tab.key"
              >
                <span class="me-1">{{ tab.icon }}</span> {{ tab.label }}
              </a>
            </li>
          </ul>

          <!-- Tab Content -->
          <div class="p-3">
            <div v-if="activeTab === 'overview'">
              <OverviewTab
                :inspection-id="inspectionId"
                :inspection="inspection"
                :status="inspection.status"
                :readonly="isReadonly"
              />
            </div>
            <div v-if="activeTab === 'defects'">
              <ComplaintsTab
                :inspection-id="inspectionId"
                :status="inspection.status"
                :readonly="true"
                :initial-complaints="inspection.complain_logs || []"
              />
            </div>
            <div v-if="activeTab === 'results'">
              <ChecklistTab
                :inspection-id="inspectionId"
                :template-id="inspection.inspection_template_id || inspection.template?.id"
                :status="inspection.status"
                :readonly="isReadonly"
                :initial-parameters="inspection.parameters || []"
              />
            </div>
            <div v-if="activeTab === 'symptoms'">
              <SymptomsTab
                :inspection-id="inspectionId"
                :status="inspection.status"
                :readonly="true"
                :initial-symptoms="inspection.maintenance_symptoms || []"
              />
            </div>
            <div v-if="activeTab === 'jobcards'">
              <div class="text-center py-5 bg-white rounded">
                <i class="fa fa-wrench fa-3x text-muted mb-3 d-block"></i>
                <h6 class="text-muted">Job Cards</h6>
                <p class="text-muted small">Job cards feature coming soon.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-5">
      <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5>Inspection not found</h5>
      <router-link to="/inspections" class="btn btn-primary mt-2">Back to Inspections</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'
import handleErrors from '@/stores/bushman/errorHandler'
import OverviewTab from './components/OverviewTab.vue'
import ComplaintsTab from './components/ComplaintsTab.vue'
import ChecklistTab from './components/ChecklistTab.vue'
import SymptomsTab from './components/SymptomsTab.vue'

const route = useRoute()
const router = useRouter()
const { showAlert, showConfirm } = useNotification()

const inspectionId = computed(() => Number(route.params.id))
const inspection = ref<any>(null)
const isLoading = ref(true)
const actionLoading = ref(false)
const activeTab = ref('overview')

const tabItems = computed(() => [
  { key: 'overview', label: 'Details', icon: '📋' },
  { key: 'symptoms', label: 'Symptoms', icon: '💔' },
  { key: 'defects', label: 'Defects / Issues', icon: '⚠️' },
  { key: 'results', label: 'Results', icon: '📊' },
  { key: 'jobcards', label: 'Job Cards', icon: '🔧' }
])

const isReadonly = computed(() => {
  const s = inspection.value?.status
  return s === 'submitted' || s === 'approved' || s === 'closed'
})

const statusBadgeClass = computed(() => {
  const map: Record<string, string> = {
    draft: 'badge bg-secondary',
    submitted: 'badge bg-info text-white',
    approved: 'badge bg-success',
    rejected: 'badge bg-danger',
    closed: 'badge bg-dark'
  }
  return map[inspection.value?.status] || 'badge bg-secondary'
})

onMounted(() => {
  loadInspection()
})

async function loadInspection() {
  isLoading.value = true
  try {
    const res = await inspectionService.getInspection(inspectionId.value, {})
    inspection.value = res.data.data || res.data
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load inspection')
    inspection.value = null
  } finally {
    isLoading.value = false
  }
}

async function handleSubmitInspection() {
  const confirmed = await showConfirm(
    'warning',
    'Submit Inspection?',
    'Once submitted, the checklist will be locked for editing.',
    'Yes, Submit'
  )
  if (!confirmed) return

  actionLoading.value = true
  try {
    await inspectionService.submitInspection(inspectionId.value)
    showAlert('success', 'Inspection submitted successfully')
    await loadInspection()
  } catch (error: any) {
    const errList = handleErrors(error?.response?.data || error)
    showAlert('error', errList?.[0] || 'Failed to submit inspection')
  } finally {
    actionLoading.value = false
  }
}

async function handleApprove() {
  const confirmed = await showConfirm(
    'warning',
    'Approve Inspection?',
    'This will approve the inspection and may generate job cards for defects found.',
    'Yes, Approve'
  )
  if (!confirmed) return

  actionLoading.value = true
  try {
    await inspectionService.approveInspection(inspectionId.value)
    showAlert('success', 'Inspection approved successfully')
    await loadInspection()
  } catch (error: any) {
    const errList = handleErrors(error?.response?.data || error)
    showAlert('error', errList?.[0] || 'Failed to approve inspection')
  } finally {
    actionLoading.value = false
  }
}

async function handleReject() {
  const confirmed = await showConfirm(
    'danger',
    'Reject Inspection?',
    'The inspection will be sent back for corrections.',
    'Yes, Reject'
  )
  if (!confirmed) return

  actionLoading.value = true
  try {
    await inspectionService.rejectInspection(inspectionId.value)
    showAlert('success', 'Inspection rejected')
    await loadInspection()
  } catch (error: any) {
    const errList = handleErrors(error?.response?.data || error)
    showAlert('error', errList?.[0] || 'Failed to reject inspection')
  } finally {
    actionLoading.value = false
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function formatUserName(user: any): string {
  if (!user) return 'N/A'
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return name || user.email || user.username || 'N/A'
}

function resolveUserName(userId: number | undefined, userObj: any): string {
  if (userObj) return formatUserName(userObj)
  return 'N/A'
}

function goBack() {
  router.push('/inspections')
}
</script>

<style scoped>
.inspection-details-page {
  padding: 0 1rem;
  min-height: 60vh;
}
</style>
