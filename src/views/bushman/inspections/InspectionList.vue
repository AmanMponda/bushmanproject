<template>
  <div class="inspections-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#" class="text-primary">WORKSHOP</a></li>
        <li class="breadcrumb-item active">INSPECTIONS</li>
      </ul>
    </div>

    <!-- List View -->
    <div class="row layout-top-spacing bg-white rounded mt-2">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <StandardDataTable
              :columns="columns"
              :data="inspections"
              :loading="isLoading"
              :disable-search="false"
              :disable-pagination="false"
              :action-buttons="pageActions"
            >
              <!-- Inspection Number -->
              <!-- @vue-ignore -->
              <template #inspection_number="{ row }">
                <a
                  href="#"
                  class="text-primary fw-semibold text-decoration-none"
                  @click.prevent="viewInspection(row)"
                >
                  {{ row.inspection_number || `INS-${String(row.id).padStart(6, '0')}` }}
                </a>
              </template>

              <!-- Date -->
              <!-- @vue-ignore -->
              <template #inspected_at="{ row }">
                <span class="text-muted">
                  <i class="fa fa-calendar-alt me-1"></i>
                  {{ formatDate(row.inspected_at) }}
                </span>
              </template>

              <!-- Asset -->
              <!-- @vue-ignore -->
              <template #vehicle_display="{ row }">
                <template v-if="row.accounting_dimensions && row.accounting_dimensions.length">
                  <span
                    v-for="dim in row.accounting_dimensions"
                    :key="dim.id"
                    class="badge bg-light text-dark border me-1"
                  >
                    {{ dim.accounting_dimension?.name || dim.vehicle_asset?.registration_number || dim.accounting_dimension?.code || dim.name || dim.code || `Asset #${dim.id}` }}
                  </span>
                </template>
                <span v-else class="text-muted">—</span>
              </template>

              <!-- Driver -->
              <!-- @vue-ignore -->
              <template #driver_display="{ row }">
                {{ row.driver ? formatUserName(row.driver) : '—' }}
              </template>

              <!-- Inspected By -->
              <!-- @vue-ignore -->
              <template #inspector_display="{ row }">
                {{ row.inspector_name || '—' }}
              </template>

              <!-- Odometer -->
              <!-- @vue-ignore -->
              <template #odometer_display="{ row }">
                <span v-if="row.odometer_reading != null && row.odometer_reading !== ''">
                  <i class="fa fa-tachometer-alt text-muted me-1"></i>
                  {{ Number(row.odometer_reading).toLocaleString() }} km
                </span>
                <span v-else class="text-muted">—</span>
              </template>

              <!-- Actions -->
              <!-- @vue-ignore -->
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="viewInspection(row)"
                    title="View Details"
                  >
                    <i class="fa fa-eye"></i>
                  </button>
                  <button
                    class="btn btn-outline-info btn-sm"
                    @click="downloadInspection(row)"
                    title="Download"
                  >
                    <i class="fa fa-download"></i>
                  </button>
                  <button
                    v-if="row.status === 'draft'"
                    class="btn btn-outline-danger btn-sm"
                    @click="confirmDelete(row)"
                    title="Delete"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'
import handleErrors from '@/stores/bushman/errorHandler'

const router = useRouter()
const { showAlert, showConfirm } = useNotification()

const inspections = ref<any[]>([])
const isLoading = ref(false)

const columns = [
  { key: 'inspection_number', label: 'INSP#', visible: true, sortable: true },
  { key: 'inspected_at', label: 'DATE', visible: true, sortable: true },
  { key: 'vehicle_display', label: 'ASSET', visible: true, sortable: true },
  { key: 'driver_display', label: 'DRIVER', visible: true, sortable: true },
  { key: 'inspector_display', label: 'INSPECTED BY', visible: true, sortable: true },
  { key: 'odometer_display', label: 'ODOMETER', visible: true, sortable: true },
  { key: 'actions', label: 'ACTIONS', visible: true }
]

const pageActions = computed(() => [
  {
    label: 'New Inspection',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => router.push('/inspections/create')
  }
])

onMounted(() => {
  loadInspections()
})

async function loadInspections() {
  isLoading.value = true
  try {
    const res = await inspectionService.listInspections({})
    inspections.value = res.data.data || res.data || []
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load inspections')
    inspections.value = []
  } finally {
    isLoading.value = false
  }
}

function viewInspection(row: any) {
  router.push(`/inspections/${row.id}`)
}

async function downloadInspection(row: any) {
  // Open the client-side PDF view in a new tab
  const routeData = router.resolve(`/inspections/${row.id}/print`)
  window.open(routeData.href, '_blank')
}

async function confirmDelete(row: any) {
  const confirmed = await showConfirm(
    'warning',
    'Delete Inspection?',
    'This will permanently delete this draft inspection.',
    'Yes, Delete'
  )
  if (!confirmed) return

  try {
    await inspectionService.deleteInspection(row.id)
    showAlert('success', 'Inspection deleted')
    await loadInspections()
  } catch (error: any) {
    const errList = handleErrors(error?.response?.data || error)
    showAlert('error', errList?.[0] || 'Failed to delete inspection')
  }
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'badge bg-secondary',
    submitted: 'badge bg-info text-white',
    approved: 'badge bg-success',
    rejected: 'badge bg-danger',
    closed: 'badge bg-dark'
  }
  return map[status] || 'badge bg-secondary'
}

function formatUserName(user: any): string {
  if (!user) return '—'
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return name || user.email || user.username || '—'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${mm}-${dd}-${yyyy}`
  } catch {
    return dateStr
  }
}
</script>
