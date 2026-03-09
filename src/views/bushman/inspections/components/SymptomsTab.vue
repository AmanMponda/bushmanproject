<template>
  <div class="symptoms-tab">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
      <p class="mt-2 text-muted small">Loading symptoms...</p>
    </div>

    <template v-else>
      <!-- Add Symptom Form -->
      <div v-if="!readonly" class="bg-white rounded p-3 mb-3 shadow-sm">
        <h6 class="fw-semibold mb-3">
          <i class="fa fa-plus-circle text-primary me-2"></i> Add Symptom
        </h6>
        <form @submit.prevent="addSymptom" class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label small">Symptom <span class="text-danger">*</span></label>
            <select
              v-model="newSymptom.maintenance_symptom_id"
              class="form-select form-select-sm"
              :disabled="addingSymptom"
            >
              <option :value="null">-- Select Symptom --</option>
              <option
                v-for="s in availableSymptoms"
                :key="s.id"
                :value="s.id"
              >
                {{ s.name }}
              </option>
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label small">Description</label>
            <input
              type="text"
              v-model="newSymptom.description"
              class="form-control form-control-sm"
              placeholder="Optional details..."
              :disabled="addingSymptom"
            />
          </div>
          <div class="col-md-2">
            <button
              type="submit"
              class="btn btn-sm btn-primary w-100"
              :disabled="addingSymptom || !newSymptom.maintenance_symptom_id"
            >
              <i v-if="addingSymptom" class="fa fa-spinner fa-spin"></i>
              <span v-else><i class="fa fa-plus me-1"></i>Add</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Symptoms List -->
      <div class="bg-white rounded shadow-sm">
        <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 class="mb-0 fw-semibold"><i class="fa fa-heartbeat text-danger me-2"></i>Recorded Symptoms</h6>
          <span class="badge bg-secondary">{{ symptoms.length }}</span>
        </div>

        <div v-if="symptoms.length === 0" class="text-center py-5">
          <i class="fa fa-heartbeat fa-3x text-muted mb-3 d-block"></i>
          <h6 class="text-muted">No symptoms recorded</h6>
          <p class="text-muted small">No symptoms have been reported for this inspection.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th class="small">#</th>
                <th class="small">Symptom</th>
                <th class="small">Description</th>
                <th class="small">Recorded At</th>
                <th v-if="!readonly" class="small text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sym, idx) in symptoms" :key="sym.id">
                <td class="small">{{ idx + 1 }}</td>
                <td class="small fw-semibold">{{ sym.maintenance_symptom?.name || '—' }}</td>
                <td class="small">{{ sym.description || '—' }}</td>
                <td class="small text-muted">{{ formatDate(sym.created_at) }}</td>
                <td v-if="!readonly" class="text-end">
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="removeSymptom(sym)"
                    :disabled="deletingSymptomId === sym.id"
                    title="Remove"
                  >
                    <i v-if="deletingSymptomId === sym.id" class="fa fa-spinner fa-spin"></i>
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
  initialSymptoms?: any[]
}>()

const { showAlert, showConfirm } = useNotification()

const isLoading = ref(true)
const symptoms = ref<any[]>([])
const availableSymptoms = ref<any[]>([])
const addingSymptom = ref(false)
const deletingSymptomId = ref<number | null>(null)

const newSymptom = reactive({
  maintenance_symptom_id: null as number | null,
  description: ''
})

onMounted(async () => {
  // Use data passed from parent if available, otherwise fetch
  if (props.initialSymptoms && props.initialSymptoms.length > 0) {
    symptoms.value = props.initialSymptoms
    isLoading.value = false
  } else {
    await loadSymptoms()
  }
  // Only load lookup data when the add form is visible
  if (!props.readonly) {
    await loadLookups()
  }
})

async function loadSymptoms() {
  isLoading.value = true
  try {
    const res = await inspectionService.getInspectionSymptoms(props.inspectionId)
    symptoms.value = res.data.data || res.data || []
  } catch {
    symptoms.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadLookups() {
  try {
    const res = await inspectionService.listMaintenanceSymptoms()
    availableSymptoms.value = res.data.data || res.data || []
  } catch {
    availableSymptoms.value = []
  }
}

async function addSymptom() {
  if (!newSymptom.maintenance_symptom_id) return

  addingSymptom.value = true
  try {
    await inspectionService.addInspectionSymptom(props.inspectionId, {
      maintenance_symptom_id: newSymptom.maintenance_symptom_id,
      description: newSymptom.description.trim() || undefined
    })
    showAlert('success', 'Symptom added')

    newSymptom.maintenance_symptom_id = null
    newSymptom.description = ''

    await loadSymptoms()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to add symptom')
  } finally {
    addingSymptom.value = false
  }
}

async function removeSymptom(sym: any) {
  const confirmed = await showConfirm(
    'warning',
    'Remove Symptom?',
    'Are you sure you want to remove this symptom?',
    'Yes, Remove'
  )
  if (!confirmed) return

  deletingSymptomId.value = sym.id
  try {
    await inspectionService.deleteInspectionSymptom(props.inspectionId, sym.id)
    showAlert('success', 'Symptom removed')
    await loadSymptoms()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to remove symptom')
  } finally {
    deletingSymptomId.value = null
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
