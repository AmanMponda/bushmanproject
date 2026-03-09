<template>
  <div class="complaints-tab">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
      <p class="mt-2 text-muted small">Loading complaints...</p>
    </div>

    <template v-else>
      <!-- Add Complaint Form -->
      <div v-if="!readonly" class="bg-white rounded p-3 mb-3 shadow-sm">
        <h6 class="fw-semibold mb-3">
          <i class="fa fa-plus-circle text-primary me-2"></i> Report Complaint / Defect
        </h6>
        <form @submit.prevent="addComplaint" class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label small">Category <span class="text-danger">*</span></label>
            <select
              v-model="newComplaint.maintenance_category_id"
              class="form-select form-select-sm"
              :disabled="adding"
            >
              <option :value="null">-- Select Category --</option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label small">Narration <span class="text-danger">*</span></label>
            <textarea
              v-model="newComplaint.narration"
              class="form-control form-control-sm"
              rows="2"
              placeholder="Describe the defect or complaint..."
              :disabled="adding"
            ></textarea>
          </div>
          <div class="col-md-1">
            <button
              type="submit"
              class="btn btn-primary btn-sm w-100"
              :disabled="adding || !newComplaint.narration.trim() || !newComplaint.maintenance_category_id"
            >
              <i v-if="adding" class="fa fa-spinner fa-spin"></i>
              <i v-else class="fa fa-plus"></i>
            </button>
          </div>
        </form>
      </div>

      <!-- Complaints List -->
      <div class="bg-white rounded shadow-sm mb-3">
        <div class="p-3 border-bottom">
          <h6 class="mb-0 fw-semibold"><i class="fa fa-exclamation-triangle text-warning me-2"></i>Complaint Logs</h6>
        </div>
        <div v-if="complaints.length === 0" class="text-center py-5">
          <i class="fa fa-check-circle fa-3x text-success mb-3 d-block"></i>
          <h6 class="text-muted">No complaints or defects</h6>
          <p class="text-muted small">All items appear to be in good condition.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th class="small">#</th>
                <th class="small">Category</th>
                <th class="small">Narration</th>
                <th class="small">Reported At</th>
                <th v-if="!readonly" class="small text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(complaint, index) in complaints" :key="complaint.id">
                <td class="small">{{ index + 1 }}</td>
                <td class="small">
                  <span class="badge bg-info">{{ complaint.maintenance_category?.name || '—' }}</span>
                </td>
                <td class="small">{{ complaint.narration || '—' }}</td>
                <td class="small text-muted">{{ formatDate(complaint.created_at) }}</td>
                <td v-if="!readonly" class="text-end">
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="removeComplaint(complaint)"
                    :disabled="deletingId === complaint.id"
                    title="Remove"
                  >
                    <i v-if="deletingId === complaint.id" class="fa fa-spinner fa-spin"></i>
                    <i v-else class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'

const props = defineProps<{
  inspectionId: number
  status: string
  readonly: boolean
  initialComplaints?: any[]
}>()

const { showAlert, showConfirm } = useNotification()

const isLoading = ref(true)
const complaints = ref<any[]>([])
const categories = ref<any[]>([])
const adding = ref(false)
const deletingId = ref<number | null>(null)

const newComplaint = reactive({
  maintenance_category_id: null as number | null,
  narration: ''
})

onMounted(async () => {
  // Use data passed from parent if available, otherwise fetch
  if (props.initialComplaints && props.initialComplaints.length > 0) {
    complaints.value = props.initialComplaints
    isLoading.value = false
  } else {
    await loadComplaints()
  }
  // Only load lookup data when the add form is visible
  if (!props.readonly) {
    await loadLookups()
  }
})

async function loadComplaints() {
  isLoading.value = true
  try {
    const res = await inspectionService.getInspectionComplaints(props.inspectionId)
    complaints.value = res.data.data || res.data || []
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load complaints')
    complaints.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadLookups() {
  try {
    const catRes = await inspectionService.listCategories()
    categories.value = catRes.data.data || catRes.data || []
  } catch {
    categories.value = []
  }
}

async function addComplaint() {
  if (!newComplaint.narration.trim() || !newComplaint.maintenance_category_id) return

  adding.value = true
  try {
    await inspectionService.addInspectionComplaint(props.inspectionId, {
      maintenance_category_id: newComplaint.maintenance_category_id,
      narration: newComplaint.narration.trim()
    })
    showAlert('success', 'Complaint added successfully')

    newComplaint.maintenance_category_id = null
    newComplaint.narration = ''

    await loadComplaints()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to add complaint')
  } finally {
    adding.value = false
  }
}

async function removeComplaint(complaint: any) {
  const confirmed = await showConfirm(
    'warning',
    'Delete Complaint?',
    'Are you sure you want to remove this complaint?',
    'Yes, Delete'
  )
  if (!confirmed) return

  deletingId.value = complaint.id
  try {
    await inspectionService.deleteInspectionComplaint(props.inspectionId, complaint.id)
    showAlert('success', 'Complaint removed')
    await loadComplaints()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to remove complaint')
  } finally {
    deletingId.value = null
  }
}

function formatDate(dateStr: string): string {
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
