<template>
    <div v-if="isLoading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  
    <div v-else-if="error" class="price-list-details">
      <div class="row gx-4">
        <div class="col-lg-12">
          <div class="card">
            <div class="card-body">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <div v-else class="price-list-details">
      <div class="row gx-4">
        <div class="col-lg-12">
          <div class="card">
            <!-- Proposal View -->
            <template v-if="proposal">
              <!-- HEADER -->
              <div class="card-header d-flex align-items-center bg-white fw-400">
                <div class="d-flex align-items-center">
                  <div class="vehicle-icon me-3">
                    <i class="fa fa-file-invoice fa-3x text-primary"></i>
                  </div>
                  <div>
                    <h4 class="mb-0">{{ proposal.client?.full_name || 'Pipeline Item Details' }}</h4>
                    <small class="text-muted">
                      {{ proposal.code || proposal.confirmation_code || `Proposal #${proposal.id || 'N/A'}` }} •
                      {{
                        proposal.confirmation_date_formatted ||
                        formatDate(proposal.confirmation_date) ||
                        formatDate(proposal.created_date)
                      }}
                      •
                      {{
                        proposal.hunting_trip?.hunting_area ||
                        proposal.hunting_details?.season ||
                        proposal.sales_inquiry?.season ||
                        'N/A'
                      }}
                      <span
                        v-if="proposal.stage || proposal.status"
                        :class="getStatusBadgeClass(proposal.stage || proposal.status)"
                        class="badge ms-2"
                      >
                        {{ formatStatus(proposal.stage || proposal.status) }}
                      </span>
                    </small>
                  </div>
                </div>
  
                <div class="ms-auto d-flex align-items-center gap-2">
                  <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="goBack">
                    <i class="fa fa-arrow-left me-1"></i> Back
                  </button>
                  <button class="btn btn-outline-warning text-nowrap btn-sm px-3 rounded-pill" @click="handleEdit">
                    <i class="fa fa-pen me-1"></i> Edit
                  </button>
                  <button
                    v-if="proposal && proposal.id"
                    class="btn btn-outline-primary text-nowrap btn-sm px-3 rounded-pill"
                    @click="handleDownloadPdf"
                  >
                    <i class="fa fa-download me-1"></i> Download PDF
                  </button>
                </div>
              </div>
  
              <!-- Content -->
              <ProposalView :proposal="proposal" @edit="handleEdit" @statusChange="handleStatusChange" />
            </template>
  
            <!-- Inquiry View (if it's an inquiry, not a proposal) -->
            <template v-else-if="inquiry">
              <!-- HEADER -->
              <div class="card-header d-flex align-items-center bg-white fw-400">
                <div class="d-flex align-items-center">
                  <div class="vehicle-icon me-3">
                    <i class="fa fa-search fa-3x text-primary"></i>
                  </div>
                  <div>
                    <h4 class="mb-0">
                      {{ inquiry.entity?.full_name || inquiry.client?.full_name || 'Inquiry Details' }}
                    </h4>
                    <small class="text-muted">
                      {{ inquiry.code || 'Sales Inquiry' }} •
                      {{ inquiry.season?.name || inquiry.hunting_details?.season || 'N/A' }}
                      <span
                        v-if="inquiry.inquiry_type"
                        :class="inquiry.inquiry_type === 'standard' ? 'badge bg-success ms-2' : 'badge bg-info ms-2'"
                      >
                        {{ inquiry.inquiry_type === 'standard' ? 'Standard' : 'Custom' }}
                      </span>
                    </small>
                  </div>
                </div>
  
                <div class="ms-auto d-flex align-items-center gap-2">
                  <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="goBack">
                    <i class="fa fa-arrow-left me-1"></i> Back
                  </button>
                  <button class="btn btn-primary text-nowrap btn-sm px-3 rounded-pill" @click="handleCreateProposal">
                    <i class="fa fa-plus me-1"></i> Create Quotation
                  </button>
                </div>
              </div>
  
              <!-- Content -->
              <SalesInquiryDetails :item="inquiry" @goBack="goBack" />
            </template>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Proposal Form Modal -->
    <VaModal
      v-model="showFormModal"
      size="large"
      :hide-default-actions="true"
      :title="isEditMode ? 'Edit Quotation' : 'Create Quotation'"
    >
      <ProposalForm
        :proposal="editingProposal"
        :is-edit="isEditMode"
        :preselected-inquiry="preselectedInquiry"
        @save="handleSaveProposal"
        @cancel="showFormModal = false"
      />
    </VaModal>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useProposalStore } from '@/stores/bushman/proposal-store'
  import { useToast } from '@/composables/useToast'
  import axios from 'axios'
  import ProposalView from './components/ProposalView.vue'
  import ProposalForm from './components/ProposalForm.vue'
  import SalesInquiryDetails from './components/SalesInquiryDetails.vue'
  
  export default defineComponent({
    name: 'PipelineItemView',
    components: {
      ProposalView,
      ProposalForm,
      SalesInquiryDetails,
    },
    setup() {
      const router = useRouter()
      const route = useRoute()
      const toast = useToast()
      const proposalStore = useProposalStore()
      
      // Use storeToRefs for reactive state
      const { currentProposal, loading } = storeToRefs(proposalStore)
      
      return { 
        router, 
        route, 
        toast,
        proposalStore,
        currentProposal,
        loading
      }
    },
    data() {
      return {
        isLoading: true,
        error: null as string | null,
        proposal: null as any,
        inquiry: null as any,
        showFormModal: false,
        editingProposal: null as any,
        isEditMode: false,
        preselectedInquiry: null as any,
      }
    },
    mounted() {
      this.loadItem()
    },
    methods: {
  
      async loadItem() {
        this.isLoading = true
        this.error = null
  
        try {
          const id = this.route.params.id as string
          const type = (this.route.query.type as string) || 'proposal'
  
          if (type === 'inquiry') {
            // Fetch inquiry details
            try {
              const url = `${import.meta.env.VITE_APP_BASE_URL}sales/sales-inquiries/${id}/`
              const response = await axios.get(url)
              if (response.data) {
                this.inquiry = response.data.data || response.data
              } else {
                this.error = 'Inquiry not found'
              }
            } catch (inquiryError: any) {
              console.error('Error loading inquiry:', inquiryError)
              // If inquiry fetch fails, try as proposal
              await this.proposalStore.fetchProposalById(parseInt(id))
              if (this.currentProposal) {
                this.proposal = this.currentProposal
              } else {
                this.error = inquiryError.response?.data?.message || 'Failed to load inquiry details'
              }
            }
          } else {
            // Fetch proposal
            await this.proposalStore.fetchProposalById(parseInt(id))
            if (this.currentProposal) {
              this.proposal = this.currentProposal
            } else {
              this.error = 'Item not found'
            }
          }
        } catch (error: any) {
          console.error('Error loading item:', error)
          this.error = error.response?.data?.message || 'Failed to load item details'
        } finally {
          this.isLoading = false
        }
      },
  
      goBack() {
        this.router.push({ name: 'sales-pipeline' })
      },
  
      formatDate(dateStr: string | undefined): string {
        if (!dateStr) return 'N/A'
        try {
          return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        } catch {
          return dateStr
        }
      },
  
      formatStatus(status: string): string {
        if (!status) return 'N/A'
        return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      },
  
      getStatusBadgeClass(status: string): string {
        const statusLower = (status || '').toLowerCase()
        if (statusLower === 'confirmed' || statusLower === 'completed') {
          return 'bg-success'
        }
        if (statusLower === 'pending' || statusLower === 'provision_sales') {
          return 'bg-warning'
        }
        if (statusLower === 'cancelled' || statusLower === 'declined') {
          return 'bg-danger'
        }
        return 'bg-secondary'
      },
  
      async handleDownloadPdf() {
        if (!this.proposal?.id) {
          this.toast?.init({
            message: 'No proposal selected',
            color: 'warning',
          })
          return
        }
  
        try {
          this.toast?.init({
            message: 'Generating PDF...',
            color: 'info',
          })
  
          const response = await fetch(
            `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/proposals/${this.proposal.id}/pdf`,
          )
  
          // Check content type to handle both direct PDF and JSON responses
          const contentType = response.headers.get('content-type') || ''
  
          let blob: Blob
  
          if (contentType.includes('application/pdf')) {
            // Direct PDF response
            blob = await response.blob()
          } else if (contentType.includes('application/json')) {
            // JSON response with base64 PDF
            const data = await response.json()
            if (data.success && data.pdf) {
              const byteCharacters = atob(data.pdf)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              blob = new Blob([byteArray], { type: 'application/pdf' })
            } else {
              throw new Error(data.message || 'Failed to generate PDF')
            }
          } else {
            // Try as blob first (in case content-type header is missing)
            try {
              blob = await response.blob()
              // Verify it's a PDF by checking the first bytes
              const firstBytes = await blob.slice(0, 4).arrayBuffer()
              const uint8Array = new Uint8Array(firstBytes)
              if (uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
                // It's a PDF (starts with %PDF)
              } else {
                // Try parsing as JSON
                const text = await blob.text()
                const data = JSON.parse(text)
                if (data.success && data.pdf) {
                  const byteCharacters = atob(data.pdf)
                  const byteNumbers = new Array(byteCharacters.length)
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                  }
                  const byteArray = new Uint8Array(byteNumbers)
                  blob = new Blob([byteArray], { type: 'application/pdf' })
                } else {
                  throw new Error(data.message || 'Failed to generate PDF')
                }
              }
            } catch (blobError) {
              // If blob parsing fails, try as JSON
              const text = await response.text()
              const data = JSON.parse(text)
              if (data.success && data.pdf) {
                const byteCharacters = atob(data.pdf)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                blob = new Blob([byteArray], { type: 'application/pdf' })
              } else {
                throw new Error(data.message || 'Failed to generate PDF')
              }
            }
          }
  
          // Download the blob
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Sales_Confirmation_${this.proposal.client?.full_name || 'Proposal'}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
  
          this.toast?.init({
            message: 'PDF downloaded successfully',
            color: 'success',
          })
        } catch (error: any) {
          console.error('Error downloading PDF:', error)
          this.toast?.init({
            message: error.message || 'Failed to download PDF',
            color: 'danger',
          })
        }
      },
  
      handleEdit() {
        this.editingProposal = this.proposal
        this.isEditMode = true
        this.preselectedInquiry = null
        this.showFormModal = true
      },
  
      handleCreateProposal() {
        this.editingProposal = null
        this.isEditMode = false
        this.preselectedInquiry = this.inquiry
        this.showFormModal = true
      },
  
      async handleStatusChange(data: { id: number; status: string }) {
        try {
          await this.proposalStore.updateProposalStatus(data.id, data.status)
          this.toast?.init({
            message: `Status changed to ${data.status}`,
            color: 'success',
          })
          await this.proposalStore.fetchProposalById(data.id)
          this.proposal = this.currentProposal
          // Refresh pipeline
          await this.proposalStore.fetchPipeline()
        } catch (error) {
          this.toast?.init({
            message: 'Failed to update status',
            color: 'danger',
          })
        }
      },
  
      async handleSaveProposal(data: any) {
        try {
          if (this.isEditMode && this.editingProposal?.id) {
            await this.proposalStore.updateProposal(this.editingProposal.id, data)
            this.toast?.init({
              message: 'Quotation updated successfully',
              color: 'success',
            })
          } else {
            await this.proposalStore.createProposal(data)
            this.toast?.init({
              message: 'Quotation created successfully',
              color: 'success',
            })
          }
          this.showFormModal = false
          // Reload the item
          await this.loadItem()
          // Go back to pipeline
          this.goBack()
        } catch (error: any) {
          this.toast?.init({
            message: error.response?.data?.message || 'Failed to save quotation',
            color: 'danger',
          })
        }
      },
    },
  })
  </script>
  
  <style scoped>
  .price-list-details {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .card {
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    background: #fff !important;
    border-bottom: 1px solid #dee2e6;
    padding: 1rem 1.5rem;
    font-weight: 400;
  
    .vehicle-icon {
      i {
        font-size: 2.5rem;
      }
    }
  
    h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }
  
    small {
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  .row {
    margin-bottom: 12px;
  }
  
  strong {
    color: #212529;
    font-weight: 600;
  }
  
  .spinner-border {
    width: 3rem;
    height: 3rem;
    border: 0.25em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border 0.75s linear infinite;
  }
  
  @keyframes spinner-border {
    to {
      transform: rotate(360deg);
    }
  }
  
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .nav-tabs .nav-link {
    color: #6c757d;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
  }
  
  .nav-tabs .nav-link:hover {
    color: #495057;
    border-bottom-color: #dee2e6;
  }
  
  .nav-tabs .nav-link.active {
    color: #0d6efd;
    border-bottom-color: #0d6efd;
    font-weight: 600;
  }
  
  .table th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
  }
  
  .table tbody tr {
    transition: background-color 0.2s ease;
  }
  
  .table tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
  </style>
  