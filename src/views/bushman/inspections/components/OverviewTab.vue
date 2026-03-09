<template>
  <div class="overview-tab">
    <!-- Inspection Summary -->
    <div class="bg-white rounded shadow-sm">
      <div class="p-3 border-bottom">
        <h6 class="mb-0 fw-semibold"><i class="fa fa-info-circle text-primary me-2"></i>Inspection Details</h6>
      </div>
      <div class="p-3">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="mb-3">
              <label class="text-muted small d-block">Reference</label>
              <span class="fw-semibold">{{ inspection?.reference || `#${inspection?.id}` }}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mb-3">
              <label class="text-muted small d-block">Status</label>
              <span :class="statusBadgeClass">{{ inspection?.status || '—' }}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mb-3">
              <label class="text-muted small d-block">Inspected At</label>
              <span class="fw-semibold">{{ formatDateTime(inspection?.inspected_at) }}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mb-3">
              <label class="text-muted small d-block">Template</label>
              <span class="fw-semibold">{{ inspection?.template?.name || '—' }}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mb-3">
              <label class="text-muted small d-block">Inspector</label>
              <span class="fw-semibold">
                <i class="fa fa-user-shield text-muted me-1"></i>
                {{ resolveUserName(inspection?.inspector_id, inspection?.inspector) }}
              </span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mb-3">
              <label class="text-muted small d-block">Created By</label>
              <span class="fw-semibold">
                <i class="fa fa-user text-muted me-1"></i>
                {{ resolveUserName(inspection?.user_id, inspection?.user) }}
              </span>
            </div>
          </div>
          <div class="col-md-6" v-if="inspection?.accounting_dimensions && inspection.accounting_dimensions.length">
            <div class="mb-3">
              <label class="text-muted small d-block">Assets</label>
              <span
                v-for="dim in inspection.accounting_dimensions"
                :key="dim.id"
                class="badge bg-light text-dark border me-1"
              >
                {{ dim.accounting_dimension?.name || dim.vehicle_asset?.registration_number || dim.accounting_dimension?.code || dim.name || `Asset #${dim.id}` }}
              </span>
            </div>
          </div>
          <div class="col-md-6" v-if="inspection?.narrations">
            <div class="mb-3">
              <label class="text-muted small d-block">Notes / Narrations</label>
              <span>{{ inspection.narrations }}</span>
            </div>
          </div>
          <div class="col-md-4" v-if="inspection?.created_at">
            <div class="mb-3">
              <label class="text-muted small d-block">Created At</label>
              <span class="text-muted small">{{ formatDateTime(inspection.created_at) }}</span>
            </div>
          </div>
          <div class="col-md-4" v-if="inspection?.updated_at">
            <div class="mb-3">
              <label class="text-muted small d-block">Last Updated</label>
              <span class="text-muted small">{{ formatDateTime(inspection.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'

const props = withDefaults(defineProps<{
  inspectionId: number
  inspection: any
  status: string
  readonly: boolean
  usersMap?: Record<number, any>
}>(), {
  usersMap: () => ({})
})

const statusBadgeClass = computed(() => {
  const map: Record<string, string> = {
    draft: 'badge bg-secondary',
    submitted: 'badge bg-info text-white',
    approved: 'badge bg-success',
    rejected: 'badge bg-danger',
    closed: 'badge bg-dark'
  }
  return map[props.inspection?.status] || 'badge bg-secondary'
})

function resolveUserName(userId: number | undefined, userObj: any): string {
  if (userObj) {
    const name = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim()
    return name || userObj.email || userObj.username || 'N/A'
  }
  if (userId && props.usersMap?.[userId]) {
    const u = props.usersMap[userId]
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim()
    return name || u.email || u.username || 'N/A'
  }
  return 'N/A'
}

function formatDateTime(dateStr: string | undefined): string {
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
</script>
