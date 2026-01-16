<template>
  <div class="contract-details-page">
    <!-- Header -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="crumbs">
          <span class="crumb-icon">📋</span>
          SALES / <span>CONTRACTS</span>
        </div>
        <h1>Contract Details</h1>
        <p class="subtitle">View complete contract information</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline-primary" @click="downloadContractPdf" :disabled="downloadingPdf" type="button">
          <span v-if="downloadingPdf" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fa fa-file-pdf me-2"></i>
          {{ downloadingPdf ? 'Downloading...' : 'Download PDF' }}
        </button>
        <button class="btn btn-secondary" @click="goBack" type="button">
          <i class="fa fa-arrow-left me-2"></i> Back
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="alert alert-info">
      <i class="fa fa-spinner fa-spin"></i> Loading contract details...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="fa fa-exclamation-circle"></i> {{ error }}
    </div>

    <!-- Content -->
    <div v-else-if="contract" class="tabs-container">
      <!-- Tab Navigation -->
      <div class="tabs-nav bg-white rounded-top p-3 border-bottom">
        <ul class="nav nav-tabs mb-0" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'summary' }"
              @click="activeTab = 'summary'"
              role="tab"
            >
              <i class="fa fa-info-circle me-2"></i>Contract Summary
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'parties' }"
              @click="activeTab = 'parties'"
              role="tab"
            >
              <i class="fa fa-users me-2"></i>Parties
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'versions' }"
              @click="activeTab = 'versions'"
              role="tab"
            >
              <i class="fa fa-file-alt me-2"></i>Versions
            </button>
          </li>
        </ul>
      </div>

      <!-- Tab Content -->
      <div class="tabs-content bg-white rounded-bottom p-4">
        <!-- TAB 1: CONTRACT SUMMARY -->
        <div v-if="activeTab === 'summary'" class="tab-pane">
          <!-- Header Card -->
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-1">{{ contract.title }}</h5>
                  <small>{{ contract.contract_number }}</small>
                </div>
                <div class="text-end">
                  <span :class="getStatusBadge(contract.status)" class="badge me-2">{{ contract.status }}</span>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="row mb-4">
                <div class="col-md-6">
                  <h6 class="text-muted mb-3"><i class="fa fa-calendar me-2"></i>Dates</h6>
                  <div class="info-item">
                    <span class="label">Start Date:</span>
                    <strong>{{ formatDate(contract.start_date) }}</strong>
                  </div>
                  <div class="info-item">
                    <span class="label">End Date:</span>
                    <strong>{{ formatDate(contract.end_date) }}</strong>
                  </div>
                  <div class="info-item">
                    <span class="label">Signed Date:</span>
                    <strong>{{ formatDate(contract.signed_date) }}</strong>
                  </div>
                  <div class="info-item">
                    <span class="label">Created:</span>
                    <strong>{{ formatDateTime(contract.created_at) }}</strong>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted mb-3"><i class="fa fa-file-contract me-2"></i>Contract Details</h6>
                  <div class="info-item">
                    <span class="label">Type:</span>
                    <strong>{{ getContractTypeName() }}</strong>
                  </div>
                  <div class="info-item">
                    <span class="label">Governing Law:</span>
                    <strong>{{ contract.governing_law || 'N/A' }}</strong>
                  </div>
                  <div class="info-item">
                    <span class="label">Jurisdiction:</span>
                    <strong>{{ contract.jurisdiction || 'N/A' }}</strong>
                  </div>
                </div>
              </div>

              <!-- Additional Information -->
              <hr />
              <div class="row mt-4">
                <div class="col-md-6" v-if="contract.financial_summary">
                  <h6 class="text-muted mb-3"><i class="fa fa-dollar-sign me-2"></i>Financial Summary</h6>
                  <p class="small">{{ contract.financial_summary }}</p>
                </div>
                <div class="col-md-6" v-if="contract.special_terms">
                  <h6 class="text-muted mb-3"><i class="fa fa-clipboard me-2"></i>Special Terms</h6>
                  <p class="small">{{ contract.special_terms }}</p>
                </div>
              </div>

              <div v-if="contract.additional_note" class="alert alert-light mt-3">
                <h6 class="text-muted mb-2"><i class="fa fa-sticky-note me-2"></i>Notes</h6>
                <p class="small mb-0">{{ contract.additional_note }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: PARTIES -->
        <div v-if="activeTab === 'parties'" class="tab-pane">
          <div v-if="contract.parties && contract.parties.length > 0" class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Role</th>
                  <th>Entity / Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Primary</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="party in contract.parties" :key="party.id">
                  <td>
                    <span class="badge bg-primary">{{ party.role }}</span>
                  </td>
                  <td>{{ party.entity?.full_name || party.contact_name || 'N/A' }}</td>
                  <td>{{ party.contact_email || 'N/A' }}</td>
                  <td>{{ party.contact_phone || 'N/A' }}</td>
                  <td>
                    <i v-if="party.is_primary" class="fa fa-check text-success"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="alert alert-info">
            No parties added to this contract.
          </div>
        </div>

        <!-- TAB 3: VERSIONS -->
        <div v-if="activeTab === 'versions'" class="tab-pane">
          <div v-if="contract.versions && contract.versions.length > 0" class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Template</th>
                  <th>Generated At</th>
                  <th>Signed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="version in contract.versions" :key="version.id">
                  <td><strong>#{{ version.version_no }}</strong></td>
                  <td>
                    <span :class="getVersionStatusBadge(version.status)" class="badge">{{ version.status }}</span>
                  </td>
                  <td>{{ version.template_name || 'N/A' }}</td>
                  <td>{{ formatDateTime(version.generated_at) }}</td>
                  <td>{{ formatDateTime(version.signed_at) || 'N/A' }}</td>
                  <td>
                    <button class="btn btn-sm btn-info" @click="downloadVersionPdf(version)">
                      <i class="fa fa-download"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="alert alert-info">
            No versions found for this contract.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContractStore } from '@/stores/bushman/contract-store'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const contractStore = useContractStore()
const appOptionStore = useAppOptionStore()

// Sidebar state
const originalSidebarState = ref(false)
const downloadingPdf = ref(false)

// State
const contract = computed(() => contractStore.currentContract)
const contractTypes = computed(() => contractStore.contractTypes)
const loading = computed(() => contractStore.loading)
const error = computed(() => contractStore.error)
const activeTab = ref('summary')

// Methods
const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A'
  try {
    const parsedDate = new Date(date)
    return parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const formatDateTime = (dateTime: string | null | undefined) => {
  if (!dateTime) return 'N/A'
  try {
    const parsedDate = new Date(dateTime)
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

const formatCurrency = (amount: number) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const getStatusBadge = (status: string) => {
  const statusMap: any = {
    'DRAFT': 'bg-secondary',
    'NEGOTIATION': 'bg-warning',
    'PENDING_SIGNATURE': 'bg-info',
    'ACTIVE': 'bg-success',
    'SUSPENDED': 'bg-danger',
    'TERMINATED': 'bg-dark',
    'EXPIRED': 'bg-secondary'
  }
  return statusMap[status] || 'bg-secondary'
}

const getVersionStatusBadge = (status: string) => {
  const statusMap: any = {
    'DRAFT': 'bg-secondary',
    'SENT': 'bg-info',
    'SIGNED': 'bg-success',
    'SUPERSEDED': 'bg-warning'
  }
  return statusMap[status] || 'bg-secondary'
}

const getContractTypeName = () => {
  const type = contractTypes.value.find((t: any) => t.id === contract.value?.contract_type_id)
  return type?.name || 'N/A'
}

const editContract = () => {
  router.push({ name: 'contracts-edit', params: { id: contract.value.id } })
}

const downloadVersionPdf = (version: any) => {
  init({ message: 'Downloading version ' + version.version_no + ' PDF...', color: 'info' })
  // Implementation for downloading specific version
}

const viewHistory = () => {
  init({ message: 'Contract history feature coming soon', color: 'info' })
}

const deleteContract = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: `Delete contract ${contract.value.contract_number}? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await contractStore.deleteContract(contract.value.id)
        init({ message: 'Contract deleted successfully', color: 'success' })
        router.push({ name: 'contracts-list' })
      } catch (error: any) {
        init({ message: 'Error deleting contract: ' + error.message, color: 'danger' })
      }
    }
  })
}

const navigateToObject = (link: any) => {
  // Navigate to related object based on type
  if (link.object_type === 'ORDER') {
    router.push({ name: 'orders-view', params: { id: link.object_id } })
  }
}

const goBack = () => {
  router.back()
}
// PDF Download
const downloadContractPdf = async () => {
  const contractId = route.params.id
  if (!contractId) return

  downloadingPdf.value = true
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}contract-management/${contractId}/contract-pdf`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const data = await response.json()
    if (data?.success && data?.pdf) {
      const byteCharacters = atob(data.pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contract-${contractId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      Swal.fire('Error', data?.message || 'Failed to generate contract PDF', 'error')
    }
  } catch (error) {
    console.error('Error downloading contract PDF:', error)
    Swal.fire('Error', 'Failed to download contract PDF', 'error')
  } finally {
    downloadingPdf.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Save original sidebar state and collapse it
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true

  await contractStore.fetchContractTypes()
  try {
    await contractStore.getContract(Number(route.params.id))
  } catch (error) {
    init({ message: 'Error loading contract details', color: 'danger' })
  }
})

// Restore sidebar state when leaving the page
onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

<style scoped lang="scss">
.contract-details-page {
  width: 100%;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .page-head-left {
      flex: 1;

      .crumbs {
        font-size: 0.85rem;
        color: #999;
        margin-bottom: 0.5rem;

        .crumb-icon {
          margin-right: 0.5rem;
        }
      }

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0.5rem 0;
        color: #222;
      }

      .subtitle {
        font-size: 0.9rem;
        color: #666;
        margin: 0;
      }
    }

    .head-actions {
      display: flex;
      gap: 0.5rem;

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        transition: all 0.2s;

        &.btn-secondary {
          background: #6b7280;
          color: white;

          &:hover {
            opacity: 0.9;
          }
        }
      }
    }
  }

  .alert {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;

    &.alert-info {
      background: #d1ecf1;
      color: #0c5460;
    }

    &.alert-danger {
      background: #f8d7da;
      color: #721c24;
    }
  }

  .tabs-container {
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .tabs-nav {
      border-bottom: 2px solid #e5e7eb;
      background: white;
      padding: 0;

      .nav-tabs {
        border: none;
        display: flex;
        gap: 0;
        margin: 0;

        .nav-item {
          .nav-link {
            color: #666;
            border: none;
            padding: 1rem 1.5rem;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
            background: transparent;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            &:hover {
              color: #3b82f6;
              border-bottom: 2px solid #3b82f6;
            }

            &.active {
              color: #3b82f6;
              border-bottom: 2px solid #3b82f6;
              background: transparent;
            }
          }
        }
      }
    }

    .tabs-content {
      min-height: 500px;
      padding: 2rem;

      .tab-pane {
        animation: fadeIn 0.3s;
      }
    }
  }

  .card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: none;
    margin-bottom: 1.5rem;

    .card-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;

      &.bg-primary {
        background: #3b82f6 !important;
        color: white;

        h5 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        small {
          font-size: 0.85rem;
          opacity: 0.9;
        }
      }

      h5 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #222;
      }
    }

    .card-body {
      padding: 1.5rem;

      .row {
        .col-md-6 {
          margin-bottom: 1rem;

          &:last-child {
            margin-bottom: 0;
          }

          h6 {
            color: #6c757d;
            font-size: 0.95rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        }
      }
    }
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #666;
      font-size: 0.9rem;
    }

    strong {
      color: #222;
      text-align: right;
    }

    &.border-top {
      border-top: 1px solid #e5e7eb;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
    }
  }

  .table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;

      th {
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        color: #222;
        font-size: 0.9rem;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #e5e7eb;

        &:hover {
          background: #f9fafb;
        }

        td {
          padding: 0.75rem;
          font-size: 0.9rem;
          color: #666;
          vertical-align: middle;
        }
      }
    }
  }

  .badge {
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    background: #3b82f6;
    color: white;
  }

  .btn-sm {
    padding: 0.35rem 0.7rem;
    font-size: 0.85rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;

    &.btn-primary {
      background: #3b82f6;
      color: white;

      &:hover {
        background: #2563eb;
      }
    }

    &.btn-secondary {
      background: #6b7280;
      color: white;

      &:hover {
        background: #4b5563;
      }
    }
  }

  .d-flex {
    display: flex;
  }

  .justify-content-between {
    justify-content: space-between;
  }

  .align-items-center {
    align-items: center;
  }

  .text-end {
    text-align: right;
  }

  .text-muted {
    color: #6c757d;
  }

  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 1rem; }
  .mb-4 { margin-bottom: 1.5rem; }
  .me-2 { margin-right: 0.5rem; }
  .me-4 { margin-right: 1.5rem; }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .col-lg-8 {
    grid-column: 1 / 2;
  }

  .col-lg-4 {
    grid-column: 2 / 3;

    @media (max-width: 768px) {
      grid-column: 1 / 2;
    }
  }

  .col-md-6 {
    width: 100%;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
