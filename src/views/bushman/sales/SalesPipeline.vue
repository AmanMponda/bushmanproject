<template>
  <div class="sales-pipeline-page">
    <!-- Header Section -->
    <div class="pipeline-header">
      <div class="header-content">
        <div class="header-title-section">
          <div class="title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <h1 class="page-title">Sales Pipeline</h1>
            <p class="page-subtitle">Manage your sales inquiries and quotations</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="d-flex gap-2 align-items-center">
            <button
              class="btn btn-sm"
              :class="pipelineView === 'partial' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="pipelineView = 'partial'"
            >
              <i class="fa fa-columns me-1"></i> Partial
            </button>
            <button
              class="btn btn-sm"
              :class="pipelineView === 'full' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="pipelineView = 'full'"
            >
              <i class="fa fa-th me-1"></i> Full
            </button>
          </div>
          <select
            v-model="seasonFilter"
            class="form-select form-select-sm season-select"
            @change="loadPipeline"
          >
            <option :value="null">All Seasons</option>
            <option v-for="season in seasonOptions" :key="season.value" :value="season.value">
              {{ season.text }}
            </option>
          </select>
          <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadPipeline">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <i v-else class="fa fa-refresh me-1"></i>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Pipeline Content -->
    <div class="pipeline-content">
      <!-- Loading State -->
      <div v-if="loading && !hasData" class="loading-container py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-center mt-4 text-muted">Loading pipeline...</p>
      </div>

      <!-- Partial Pipeline View (4 columns) -->
      <div v-else-if="pipelineView === 'partial'" class="pipeline-columns pipeline-columns-partial">
        <!-- Column 1: Canceled & New Inquiries -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-inbox" style="font-size: 16px"></i>
              <span>Inquiries</span>
            </div>
            <span class="badge bg-secondary">
              {{ counts.cancelled + counts.new_inquiries }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.cancelled.length === 0 && pipeline.new_inquiries.length === 0" class="empty-column">
              <i class="fa fa-inbox fa-3x text-muted"></i>
              <span>No items</span>
            </div>
            <PipelineCard
              v-for="item in [...pipeline.cancelled, ...pipeline.new_inquiries]"
              :key="`col1-${item.id}`"
              :item="item"
              @createProposal="handleCreateProposal(item)"
              @view="handleViewProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 2: Quotations/Pending -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-file-alt" style="font-size: 16px"></i>
              <span>Quotations</span>
            </div>
            <span class="badge bg-warning">
              {{ counts.pending }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.pending.length === 0" class="empty-column">
              <i class="fa fa-hourglass-half fa-3x text-muted"></i>
              <span>No pending items</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.pending"
              :key="`col2-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 3: Provisional Sales & Confirmed -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-check-circle" style="font-size: 16px"></i>
              <span>Provisional Sales</span>
            </div>
            <span class="badge bg-info">
              {{ counts.provision_sales + counts.confirmed }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.provision_sales.length === 0 && pipeline.confirmed.length === 0" class="empty-column">
              <i class="fa fa-check-circle fa-3x text-muted"></i>
              <span>No items</span>
            </div>
            <PipelineCard
              v-for="item in [...pipeline.provision_sales, ...pipeline.confirmed]"
              :key="`col3-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 4: Completed -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-check-double" style="font-size: 16px"></i>
              <span>Completed</span>
            </div>
            <span class="badge bg-success">
              {{ counts.completed }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.completed.length === 0" class="empty-column">
              <i class="fa fa-check-double fa-3x text-muted"></i>
              <span>No completed items</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.completed"
              :key="`col4-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>
      </div>

      <!-- Full Pipeline View (6 columns) -->
      <div v-else class="pipeline-columns pipeline-columns-full">
        <!-- Column 1: Canceled -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-ban" style="font-size: 16px"></i>
              <span>Canceled</span>
            </div>
            <span class="badge bg-secondary">
              {{ counts.cancelled }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.cancelled.length === 0" class="empty-column">
              <i class="fa fa-ban fa-3x text-muted"></i>
              <span>No canceled items</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.cancelled"
              :key="`canceled-${item.id}`"
              :item="item"
              @createProposal="handleCreateProposal(item)"
              @view="handleViewProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 2: New Inquiries -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-plus-circle" style="font-size: 16px"></i>
              <span>New Inquiries</span>
            </div>
            <span class="badge bg-warning">
              {{ counts.new_inquiries }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.new_inquiries.length === 0" class="empty-column">
              <i class="fa fa-inbox fa-3x text-muted"></i>
              <span>No new inquiries</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.new_inquiries"
              :key="`new-${item.id}`"
              :item="item"
              @createProposal="handleCreateProposal(item)"
              @view="handleViewProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 3: Quotations/Pending -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-file-alt" style="font-size: 16px"></i>
              <span>Quotations</span>
            </div>
            <span class="badge bg-warning">
              {{ counts.pending }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.pending.length === 0" class="empty-column">
              <i class="fa fa-hourglass-half fa-3x text-muted"></i>
              <span>No quotations</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.pending"
              :key="`pending-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 4: Provision Sales -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-shopping-cart" style="font-size: 16px"></i>
              <span>Provision Sales</span>
            </div>
            <span class="badge bg-info">
              {{ counts.provision_sales }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.provision_sales.length === 0" class="empty-column">
              <i class="fa fa-shopping-cart fa-3x text-muted"></i>
              <span>No provision sales</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.provision_sales"
              :key="`provision-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 5: Confirmed -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-check-circle" style="font-size: 16px"></i>
              <span>Confirmed</span>
            </div>
            <span class="badge bg-success">
              {{ counts.confirmed }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.confirmed.length === 0" class="empty-column">
              <i class="fa fa-check-circle fa-3x text-muted"></i>
              <span>No confirmed items</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.confirmed"
              :key="`confirmed-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>

        <!-- Column 6: Completed -->
        <div class="pipeline-column">
          <div class="column-header">
            <div class="column-title">
              <i class="fa fa-check-double" style="font-size: 16px"></i>
              <span>Completed</span>
            </div>
            <span class="badge bg-success">
              {{ counts.completed }}
            </span>
          </div>
          <div class="column-content">
            <div v-if="pipeline.completed.length === 0" class="empty-column">
              <i class="fa fa-check-double fa-3x text-muted"></i>
              <span>No completed items</span>
            </div>
            <PipelineCard
              v-for="item in pipeline.completed"
              :key="`completed-${item.id}`"
              :item="item"
              @view="handleViewProposal(item)"
              @edit="handleEditProposal(item)"
              @click="handleCardClick(item)"
            />
          </div>
        </div>
      </div>

      <!-- Proposal Form Modal (Bootstrap) -->
      <div
        class="modal fade"
        :class="{ show: showFormModal }"
        :style="{ display: showFormModal ? 'block' : 'none' }"
        tabindex="-1"
        role="dialog"
        aria-labelledby="proposalFormModalLabel"
        :aria-hidden="!showFormModal"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="proposalFormModalLabel">
                {{ isEditMode ? 'Edit Quotation' : 'Create Quotation' }}
              </h5>
              <button type="button" class="btn-close" @click="showFormModal = false" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <ProposalForm
                :proposal="editingProposal"
                :is-edit="isEditMode"
                :preselected-inquiry="preselectedInquiry"
                @save="handleSaveProposal"
                @cancel="showFormModal = false"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-if="showFormModal" class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProposalStore } from '@/stores/bushman/proposal-store'
import { useToast } from '@/composables/useToast'
import axios from 'axios'
import PipelineCard from './sales-pipeline/PipelineCard.vue'
import ProposalForm from './sales-pipeline/ProposalForm.vue'
import { useGlobalStore } from '@/stores/bushman/global-store'

// Types
interface SeasonOption {
  value: number
  text: string
}

// Router & utilities
const router = useRouter()
const toast = useToast()
const globalStore = useGlobalStore()

// Store
const proposalStore = useProposalStore()
const pipeline = computed(() => proposalStore.pipeline)
const pipelineCounts = computed(() => proposalStore.pipelineCounts)
const currentProposal = computed(() => proposalStore.currentProposal)
const loading = computed(() => proposalStore.loading)
const { fetchPipeline, fetchProposalById, createProposal, updateProposal, updateProposalStatus  } = proposalStore

// Local state
const seasonFilter = ref<number | null>(null)
const seasonOptions = ref<SeasonOption[]>([])
const showFormModal = ref(false)
const editingProposal = ref<any>(null)
const isEditMode = ref(false)
const preselectedInquiry = ref<any>(null)
const pipelineView = ref<'partial' | 'full'>('partial')

// Computed
const counts = computed(() => {
  return pipelineCounts.value || {
    new_inquiries: 0,
    pending: 0,
    provision_sales: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  }
})

const hasData = computed(() => {
  return Object.values(counts.value).reduce((sum: number, count: any) => sum + count, 0) > 0
})

// Methods
const loadPipeline = async () => {
  try {
    await fetchPipeline(undefined, seasonFilter.value || undefined)
  } catch (error) {
    toast?.init({
      message: 'Failed to load pipeline',
      color: 'danger',
    })
  }
}

const loadSeasons = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/seasons`
    const response = await axios.get(url)
    if (response.data) {
      const seasons = Array.isArray(response.data) ? response.data : response.data.data || []
      seasonOptions.value = seasons.map((s: any) => ({
        value: s.id,
        text: s.name,
      }))
    }
  } catch (error) {
    console.error('Error loading seasons:', error)
  }
}

const handleCardClick = (item: any) => {
  if (item.type === 'proposal') {
    handleViewProposal(item)
  }
}

const handleViewProposal = async (item: any) => {
  try {
    const proposalId = item.proposal_id || item.confirmation_id || item.id
    if (proposalId) {
      const type = item.type === 'inquiry' ? 'inquiry' : 'proposal'
      router.push({
        name: 'pipeline-item-view',
        params: { id: proposalId.toString() },
        query: { type },
      })
    } else {
      toast?.init({
        message: 'No quotation found for this item',
        color: 'warning',
      })
    }
  } catch (error) {
    toast?.init({
      message: 'Failed to load quotation details',
      color: 'danger',
    })
  }
}

const handleEditProposal = async (item: any) => {
  const proposalId = item.proposal_id || item.confirmation_id
  if (proposalId) {
    await fetchProposalById(proposalId)
    editingProposal.value = currentProposal.value
    isEditMode.value = true
    preselectedInquiry.value = null
    showFormModal.value = true
  }
}

const handleCreateProposal = (inquiry: any) => {
  editingProposal.value = null
  isEditMode.value = false
  preselectedInquiry.value = inquiry
  showFormModal.value = true
}

const handleSaveProposal = async (data: any) => {
  try {
    if (isEditMode.value && editingProposal.value?.id) {
      await updateProposal(editingProposal.value.id, data)
      toast?.init({
        message: 'Quotation updated successfully',
        color: 'success',
      })
    } else {
      await createProposal(data)
      toast?.init({
        message: 'Quotation created successfully',
        color: 'success',
      })
    }
    showFormModal.value = false
    loadPipeline()
  } catch (error: any) {
    toast?.init({
      message: error.response?.data?.message || 'Failed to save quotation',
      color: 'danger',
    })
  }
}

// Lifecycle
onMounted(() => {
  // Collapse sidebar to show full pipeline without horizontal scroll
  globalStore.isSidebarMinimized = true
  loadPipeline()
  loadSeasons()
})
</script>

<style lang="scss" scoped>
.sales-pipeline-page {
  min-height: 100vh;
  background: #ffffff;
  padding: 20px;
}

.pipeline-header {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #dee2e6;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 40px;
  height: 40px;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #212529;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 13px;
  color: #6c757d;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.season-select {
  min-width: 200px;
}

.pipeline-content {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}

/* Pipeline Columns - Partial (4 columns) and Full (6 columns) */
.pipeline-columns {
  display: grid;
  gap: 16px;
  align-items: start;
  padding-bottom: 24px;
}

/* Partial Pipeline - 4 columns in a single horizontal row */
.pipeline-columns-partial {
  grid-template-columns: repeat(4, minmax(280px, 1fr));
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: fit-content;
}

/* Full Pipeline - horizontally scrollable */
.pipeline-columns-full {
  grid-template-columns: repeat(6, minmax(280px, auto));
  width: max-content;
  min-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Scrollbar styling for pipeline views */
.pipeline-columns-partial::-webkit-scrollbar,
.pipeline-columns-full::-webkit-scrollbar {
  height: 8px;
}

.pipeline-columns-partial::-webkit-scrollbar-track,
.pipeline-columns-full::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.pipeline-columns-partial::-webkit-scrollbar-thumb,
.pipeline-columns-full::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.pipeline-columns-partial::-webkit-scrollbar-thumb:hover,
.pipeline-columns-full::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.pipeline-column {
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid #dee2e6;
  min-height: 400px;
  transition: all 0.3s ease;
}

/* Ensure full pipeline columns maintain minimum width for scrolling */
.pipeline-columns-full .pipeline-column {
  min-width: 280px;
  width: 280px;
}

.column-header {
  padding: 12px 16px;
  border-bottom: 1px solid #dee2e6;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #212529;
}

.column-header .badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.column-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: visible;
  overflow-x: hidden;
  min-height: 100px;
}

.table-content {
  padding: 0;
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: #f8fafc;
      position: sticky;
      top: 0;
      z-index: 5;

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        color: #475569;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.2s ease;

        &:hover {
          background: #f8fafc;
        }

        td {
          padding: 12px;
          font-size: 13px;
          color: #64748b;
        }
      }
    }
  }
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6c757d;
  text-align: center;
  gap: 12px;
  min-height: 200px;

  span {
    font-size: 14px;
    font-weight: normal;
    color: #6c757d;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

/* Remove column-specific styling for simple look */

/* Responsive Design */
@media (max-width: 1400px) {
  .pipeline-columns-partial {
    grid-template-columns: repeat(4, minmax(260px, 1fr));
    overflow-x: auto;
  }
  .pipeline-columns-full {
    grid-template-columns: repeat(6, minmax(280px, auto));
    width: max-content;
    min-width: 100%;
  }
  .pipeline-columns-full .pipeline-column {
    min-width: 280px;
    width: 280px;
  }
}

@media (max-width: 1024px) {
  .sales-pipeline-page {
    padding: 16px;
  }

  .pipeline-columns-partial {
    grid-template-columns: repeat(4, minmax(240px, 1fr));
    overflow-x: auto;
  }
  .pipeline-columns-full {
    grid-template-columns: repeat(6, minmax(280px, auto));
    width: max-content;
    min-width: 100%;
  }
  .pipeline-columns-full .pipeline-column {
    min-width: 280px;
    width: 280px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .pipeline-columns-partial {
    grid-template-columns: repeat(4, minmax(220px, 1fr));
    overflow-x: auto;
  }
  .pipeline-columns-full {
    grid-template-columns: repeat(6, minmax(280px, auto));
    width: max-content;
    min-width: 100%;
  }
  .pipeline-columns-full .pipeline-column {
    min-width: 280px;
    width: 280px;
  }

  .table-content {
    overflow-x: auto;

    table {
      min-width: 800px;
    }
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;

    .season-select {
      width: 100%;
    }
  }
}

/* Scrollbar styling for table */
.table-content::-webkit-scrollbar {
  height: 8px;
}

.table-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.table-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.table-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
