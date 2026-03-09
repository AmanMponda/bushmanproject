<template>
  <div class="jobcards-tab">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
      <p class="mt-2 text-muted small">Loading job cards...</p>
    </div>

    <template v-else>
      <!-- Link Existing Job Card -->
      <div v-if="!readonly" class="bg-white rounded p-3 mb-3 shadow-sm">
        <h6 class="fw-semibold mb-3">
          <i class="fa fa-link text-primary me-2"></i> Link Job Card
        </h6>
        <form @submit.prevent="linkJobCard" class="row g-3 align-items-end">
          <div class="col-md-8">
            <label class="form-label small">Select Job Card <span class="text-danger">*</span></label>
            <select
              v-model="selectedJobCardId"
              class="form-select form-select-sm"
              :disabled="linking"
            >
              <option :value="null">-- Select a Job Card --</option>
              <option
                v-for="jc in availableJobCards"
                :key="jc.id"
                :value="jc.id"
              >
                {{ jc.reference ? `[${jc.reference}] ` : '' }}{{ jc.title || jc.name || `Job Card #${jc.id}` }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Remarks</label>
            <input
              v-model="linkRemarks"
              type="text"
              class="form-control form-control-sm"
              placeholder="Optional..."
              :disabled="linking"
            />
          </div>
          <div class="col-md-2">
            <button
              type="submit"
              class="btn btn-primary btn-sm w-100"
              :disabled="linking || !selectedJobCardId"
            >
              <i v-if="linking" class="fa fa-spinner fa-spin me-1"></i>
              <i v-else class="fa fa-link me-1"></i>
              Link
            </button>
          </div>
        </form>
      </div>

      <!-- Linked Job Cards List -->
      <div class="bg-white rounded shadow-sm">
        <div class="p-3 border-bottom">
          <h6 class="mb-0 fw-semibold"><i class="fa fa-wrench text-primary me-2"></i>Linked Job Cards</h6>
        </div>

        <div v-if="jobCards.length === 0" class="text-center py-5">
          <i class="fa fa-wrench fa-3x text-muted mb-3 d-block"></i>
          <h6 class="text-muted">No linked job cards</h6>
          <p class="text-muted small">No job cards have been linked to this inspection yet.</p>
        </div>

        <div v-else>
          <div
            v-for="(link, index) in jobCards"
            :key="link.id"
            class="border-bottom p-3"
            :class="{ 'bg-light': index % 2 === 0 }"
          >
            <div class="d-flex align-items-start justify-content-between">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <h6 class="mb-0 fw-semibold">
                    {{ link.job_card?.title || link.job_card?.name || `Job Card #${link.job_card_id}` }}
                  </h6>
                  <span
                    v-if="link.job_card?.status"
                    :class="getJobStatusBadge(link.job_card.status)"
                  >
                    {{ link.job_card.status }}
                  </span>
                  <span
                    v-if="link.job_card?.reference"
                    class="badge bg-light text-dark"
                  >
                    {{ link.job_card.reference }}
                  </span>
                </div>
                <p v-if="link.job_card?.description" class="text-muted small mb-1">
                  {{ link.job_card.description }}
                </p>
                <div class="d-flex gap-3 small text-muted">
                  <span v-if="link.job_card?.assigned_user">
                    <i class="fa fa-user me-1"></i> {{ link.job_card.assigned_user?.name }}
                  </span>
                  <span v-if="link.created_at">
                    <i class="fa fa-link me-1"></i> Linked {{ formatDate(link.created_at) }}
                  </span>
                </div>
              </div>

              <!-- Unlink action -->
              <div v-if="!readonly" class="d-flex gap-1">
                <button
                  class="btn btn-outline-danger btn-sm"
                  @click="unlinkJobCard(link)"
                  :disabled="unlinkingId === link.id"
                  title="Unlink job card"
                >
                  <i v-if="unlinkingId === link.id" class="fa fa-spinner fa-spin"></i>
                  <i v-else class="fa fa-unlink"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'

const props = defineProps<{
  inspectionId: number
  status: string
  readonly: boolean
}>()

const { showAlert, showConfirm } = useNotification()

const isLoading = ref(true)
const jobCards = ref<any[]>([])
const availableJobCards = ref<any[]>([])
const selectedJobCardId = ref<number | null>(null)
const linkRemarks = ref('')
const linking = ref(false)
const unlinkingId = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([
    loadLinkedJobCards(),
    loadAvailableJobCards()
  ])
})

async function loadLinkedJobCards() {
  isLoading.value = true
  try {
    const res = await inspectionService.getInspectionJobCards(props.inspectionId)
    jobCards.value = res.data.data || res.data || []
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load job cards')
    jobCards.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadAvailableJobCards() {
  try {
    const res = await inspectionService.listJobCards()
    availableJobCards.value = res.data.data || res.data || []
  } catch {
    availableJobCards.value = []
  }
}

async function linkJobCard() {
  if (!selectedJobCardId.value) return

  linking.value = true
  try {
    await inspectionService.linkInspectionJobCard(props.inspectionId, {
      job_card_id: selectedJobCardId.value,
      remarks: linkRemarks.value.trim() || undefined
    })
    showAlert('success', 'Job card linked successfully')

    selectedJobCardId.value = null
    linkRemarks.value = ''

    await loadLinkedJobCards()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to link job card')
  } finally {
    linking.value = false
  }
}

async function unlinkJobCard(link: any) {
  const name = link.job_card?.title || link.job_card?.name || `Job Card #${link.job_card_id}`
  const confirmed = await showConfirm(
    'warning',
    'Unlink Job Card?',
    `Are you sure you want to unlink "${name}" from this inspection?`,
    'Yes, Unlink'
  )
  if (!confirmed) return

  unlinkingId.value = link.id
  try {
    await inspectionService.unlinkInspectionJobCard(props.inspectionId, link.id)
    showAlert('success', 'Job card unlinked')
    await loadLinkedJobCards()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to unlink job card')
  } finally {
    unlinkingId.value = null
  }
}

function getJobStatusBadge(status: string): string {
  const map: Record<string, string> = {
    pending: 'badge bg-warning text-dark',
    in_progress: 'badge bg-info text-white',
    completed: 'badge bg-success',
    cancelled: 'badge bg-secondary'
  }
  return map[status] || 'badge bg-secondary'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}
</script>
