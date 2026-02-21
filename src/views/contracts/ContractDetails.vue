<template>
  <div class="contract-details">
    <!-- Header Card with Tabs and Content All in One Card -->
    <div class="header-card mb-4" v-if="contract">
      <div class="p-4">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 class="mb-2" style="font-size: 24px; font-weight: 700; color: #0f172a;">
              {{ contract.contract_number || 'Contract' }}
            </h2>
            <p style="font-size: 14px; color: #64748b; margin: 0;">{{ contract.title || '' }}</p>
          </div>
          <!-- Quick Actions on the Right -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
            <button @click="downloadContractPdf" :disabled="downloadingPdf" class="btn btn-outline-primary btn-sm">
              <span v-if="downloadingPdf" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-file-pdf me-1"></i>
              {{ downloadingPdf ? 'Downloading...' : 'Download PDF' }}
            </button>
            <button v-if="contract.status === 'DRAFT'" @click="editContract" class="btn btn-outline-success btn-sm">
              <i class="fa fa-edit me-1"></i> Edit
            </button>
            <button v-if="contract.status === 'DRAFT'" @click="activateContract" class="btn btn-success btn-sm">
              <i class="fa fa-check-circle me-1"></i> Activate
            </button>
            <button v-if="contract.status === 'ACTIVE'" @click="suspendContract" class="btn btn-warning btn-sm">
              <i class="fa fa-pause-circle me-1"></i> Suspend
            </button>
            <button v-if="contract.status === 'SUSPENDED'" @click="reactivateContract" class="btn btn-info btn-sm">
              <i class="fa fa-play-circle me-1"></i> Reactivate
            </button>
            <button @click="goBack" class="btn btn-outline-secondary btn-sm">
              <i class="fa fa-arrow-left me-1"></i> Back to List
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation (same style as Order Details) -->
      <div class="tab-navigation">
        <button
          :class="['tab-btn', 'tab-first', { active: activeTab === 'summary' }]"
          @click="activeTab = 'summary'"
        >
          <i class="fa fa-info-circle me-1"></i>
          <span>Summary</span>
        </button>
        <button
          :class="['tab-btn', 'tab-middle', { active: activeTab === 'parties' }]"
          @click="activeTab = 'parties'"
        >
          <i class="fa fa-users me-1"></i>
          <span>Parties</span>
          <span v-if="partiesList.length" class="tab-badge">{{ partiesList.length }}</span>
        </button>
        <button
          :class="['tab-btn', 'tab-last', { active: activeTab === 'versions' }]"
          @click="activeTab = 'versions'"
        >
          <i class="fa fa-file-alt me-1"></i>
          <span>Versions</span>
          <span v-if="versionsList.length" class="tab-badge">{{ versionsList.length }}</span>
        </button>
      </div>

      <!-- TAB CONTENT INSIDE CARD -->
      <div class="tab-content p-4" v-if="contract && !loading && !error">

        <!-- ════════════════════════════════════════ -->
        <!-- SUMMARY TAB                              -->
        <!-- ════════════════════════════════════════ -->
        <div id="summary" class="tab-pane fade" :class="{ 'show active': activeTab === 'summary' }">

          <!-- Contract Duration Progress -->
          <div v-if="contractDuration.totalDays > 0" class="mb-5">
            <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #2563eb;">
              <i class="fa fa-clock text-primary" style="font-size: 18px;"></i>
              <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
                <span><strong>{{ contractDuration.totalDays }}</strong> total days</span>
                <span :class="contractDuration.isExpired ? 'text-danger' : 'text-success'">
                  <strong>{{ contractDuration.remainingDays }}</strong> {{ contractDuration.isExpired ? 'days expired' : 'days remaining' }}
                </span>
                <span class="text-info"><strong>{{ contractDuration.elapsedPercentage }}%</strong> elapsed</span>
              </div>
            </div>
            <div class="progress mt-2" style="height: 20px; border-radius: 10px; background: #e5e7eb;">
              <div
                class="progress-bar"
                :class="{
                  'bg-success': contractDuration.elapsedPercentage < 50,
                  'bg-info': contractDuration.elapsedPercentage >= 50 && contractDuration.elapsedPercentage < 75,
                  'bg-warning': contractDuration.elapsedPercentage >= 75 && contractDuration.elapsedPercentage < 100,
                  'bg-danger': contractDuration.elapsedPercentage >= 100
                }"
                :style="{ width: Math.min(contractDuration.elapsedPercentage, 100) + '%' }"
                role="progressbar"
              >
                {{ contractDuration.elapsedPercentage }}%
              </div>
            </div>
          </div>

          <!-- Contract Information (All-in-One, 3 rows) -->
          <div class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-info-circle me-2 text-primary"></i>Contract Information
            </h5>

            <!-- Row 1: Contract Number | Status | Contract Type | Signed Date -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">Contract Number</small>
                <strong>{{ contract.contract_number || 'N/A' }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Status</small>
                <span :class="getStatusBadge(contract.status)" class="badge" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">{{ contract.status }}</span>
              </div>
              <div>
                <small class="text-muted d-block">Contract Type</small>
                <strong>{{ getContractTypeName() }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Signed Date</small>
                <strong>{{ formatDate(contract.signed_date) }}</strong>
              </div>
            </div>

            <!-- Row 2: Start Date | End Date | Created | Last Updated -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">Start Date</small>
                <strong>{{ formatDate(contract.start_date) }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">End Date</small>
                <strong>{{ formatDate(contract.end_date) }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Created</small>
                <strong style="font-size: 13px;">{{ contract.created_at ? formatDateTime(contract.created_at) : 'N/A' }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Last Updated</small>
                <strong style="font-size: 13px;">{{ contract.updated_at ? formatDateTime(contract.updated_at) : 'N/A' }}</strong>
              </div>
            </div>

            <!-- Row 3: Financial Summary | Linked Order | Party | Governing Law -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">Financial Summary</small>
                <strong style="font-size: 14px; color: #059669;">{{ realFinancialSummary }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Linked Order</small>
                <div v-if="linkedObjects.length > 0">
                  <div v-for="link in linkedObjects" :key="link.id">
                    <a href="javascript:void(0)" @click="navigateToObject(link)" style="font-size: 13px; font-weight: 600; color: #2563eb; text-decoration: none;">
                      <i :class="getLinkIcon(link.object_type)" class="me-1"></i>
                      <span v-if="linkedOrderNumber">{{ linkedOrderNumber }}</span>
                      <span v-else>{{ link.object_type }} #{{ link.object_id }}</span>
                    </a>
                  </div>
                </div>
                <strong v-else>N/A</strong>
              </div>
              <div>
                <small class="text-muted d-block">{{ partiesList.length > 0 ? (partiesList[0].role || 'Party') : 'Party' }}</small>
                <div v-if="partiesList.length > 0">
                  <strong style="font-size: 13px;">{{ getPartyName(partiesList[0]) || 'N/A' }}</strong>
                  <div v-if="partiesList[0].contact_name" style="font-size: 12px; color: #64748b;">{{ partiesList[0].contact_name }}</div>
                </div>
                <strong v-else>N/A</strong>
              </div>
              <div>
                <small class="text-muted d-block">Governing Law</small>
                <strong>{{ contract.governing_law || 'N/A' }}</strong>
              </div>
            </div>
          </div>

          <!-- Version Snapshot -->
          <div v-if="versionsList.length > 0" class="mb-5">
            <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
              <i class="fa fa-file-alt text-success" style="font-size: 18px;"></i>
              <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
                <span><strong>{{ versionsList.length }}</strong> version(s)</span>
                <span class="text-success"><strong>{{ versionStats.signed }}</strong> signed</span>
                <span class="text-warning"><strong>{{ versionStats.draft }}</strong> draft</span>
                <span v-if="versionStats.latest" class="text-info">Latest: <strong>v{{ versionStats.latest.version_no || versionStats.latest.versionNo }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════ -->
        <!-- PARTIES TAB                              -->
        <!-- ════════════════════════════════════════ -->
        <div id="parties" class="tab-pane fade" :class="{ 'show active': activeTab === 'parties' }">

          <!-- Parties Summary Bar -->
          <div class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-users me-2 text-primary"></i>Contract Parties ({{ partiesList.length }})
            </h5>

            <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <i class="fa fa-users text-primary" style="font-size: 18px;"></i>
              <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
                <span><strong>{{ partiesList.length }}</strong> total</span>
                <span class="text-success"><strong>{{ partyStats.primary }}</strong> primary</span>
                <span class="text-info"><strong>{{ partyStats.uniqueRoles }}</strong> unique roles</span>
                <span><strong>{{ partyStats.withContact }}</strong> with contact info</span>
              </div>
            </div>
          </div>

          <!-- Parties Table -->
          <div v-if="partiesList.length > 0" class="mb-5">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="table-layout: fixed; width: 100%;">
                <thead class="table-light">
                  <tr>
                    <th style="width: 5%; text-align: center;">#</th>
                    <th style="width: 12%;">Role</th>
                    <th style="width: 22%;">Entity Name</th>
                    <th style="width: 18%;">Contact Person</th>
                    <th style="width: 20%;">Email</th>
                    <th style="width: 13%;">Phone</th>
                    <th style="width: 10%; text-align: center;">Primary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(party, idx) in partiesList" :key="party.id || idx">
                    <td style="text-align: center; color: #94a3b8;">{{ Number(idx) + 1 }}</td>
                    <td>
                      <span class="badge" :class="getRoleBadgeClass(party.role)">{{ party.role || 'N/A' }}</span>
                    </td>
                    <td>
                      <strong style="font-size: 13px;">{{ getPartyName(party) }}</strong>
                    </td>
                    <td>{{ party.contact_name || '-' }}</td>
                    <td style="font-size: 12px;">
                      <a v-if="party.contact_email" :href="'mailto:' + party.contact_email" style="color: #2563eb; text-decoration: none;">
                        {{ party.contact_email }}
                      </a>
                      <span v-else>-</span>
                    </td>
                    <td style="font-size: 12px;">
                      <a v-if="party.contact_phone" :href="'tel:' + party.contact_phone" style="color: #2563eb; text-decoration: none;">
                        {{ party.contact_phone }}
                      </a>
                      <span v-else>-</span>
                    </td>
                    <td style="text-align: center;">
                      <span v-if="party.is_primary === 1 || party.is_primary === true" style="color: #10b981; font-size: 14px;">
                        <i class="fa fa-check-circle"></i>
                      </span>
                      <span v-else style="color: #d1d5db;">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="mb-5">
            <div class="alert alert-info" style="margin-bottom: 0;">
              <i class="fa fa-info-circle me-2"></i>No parties assigned to this contract
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════ -->
        <!-- VERSIONS TAB                             -->
        <!-- ════════════════════════════════════════ -->
        <div id="versions" class="tab-pane fade" :class="{ 'show active': activeTab === 'versions' }">

          <!-- Versions Summary Bar -->
          <div class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-file-alt me-2 text-primary"></i>Contract Versions ({{ versionsList.length }})
            </h5>

            <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
              <i class="fa fa-file-alt text-success" style="font-size: 18px;"></i>
              <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
                <span><strong>{{ versionsList.length }}</strong> total</span>
                <span class="text-warning"><strong>{{ versionStats.draft }}</strong> draft</span>
                <span class="text-success"><strong>{{ versionStats.signed }}</strong> signed</span>
                <span v-if="versionStats.latest" class="text-primary">Latest: <strong>v{{ versionStats.latest?.version_no || versionStats.latest?.versionNo || 0 }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Add Version Button -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
            <button class="btn btn-primary btn-sm" @click="addNewVersion">
              <i class="fa fa-plus me-1"></i> Add Version
            </button>
          </div>

          <!-- Versions Table -->
          <div v-if="versionsList.length > 0" class="mb-5">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="table-layout: fixed; width: 100%;">
                <thead class="table-light">
                  <tr>
                    <th style="width: 6%; text-align: center;">#</th>
                    <th style="width: 14%;">Version</th>
                    <th style="width: 14%; text-align: center;">Status</th>
                    <th style="width: 18%;">Template</th>
                    <th style="width: 16%;">Generated At</th>
                    <th style="width: 16%;">Signed At</th>
                    <th style="width: 16%; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(version, idx) in versionsList" :key="version.id || idx">
                    <td style="text-align: center; color: #94a3b8;">{{ Number(idx) + 1 }}</td>
                    <td>
                      <strong style="font-size: 13px;">v{{ version.version_no || version.versionNo || Number(idx) + 1 }}</strong>
                    </td>
                    <td style="text-align: center;">
                      <span :class="getVersionStatusBadge(version.status)" class="badge">{{ version.status }}</span>
                    </td>
                    <td style="font-size: 12px;">{{ version.template_name || version.templateName || '-' }}</td>
                    <td>{{ formatDateTime(version.generated_at || version.generatedAt || version.created_at) }}</td>
                    <td>{{ formatDateTime(version.signed_at || version.signedAt) }}</td>
                    <td style="text-align: center;">
                      <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                        <!-- Upload File -->
                        <input
                          :id="`version-file-${idx}`"
                          type="file"
                          style="display: none"
                          accept=".pdf,.doc,.docx"
                          @change="(e) => onVersionFileSelected(e, version)"
                        />
                        <button
                          class="btn btn-outline-primary btn-sm"
                          @click="triggerVersionFileSelect(Number(idx))"
                          style="font-size: 11px; padding: 3px 8px;"
                          title="Upload File"
                        >
                          <i class="fa fa-upload"></i>
                        </button>
                        <!-- Download -->
                        <button
                          class="btn btn-outline-info btn-sm"
                          @click="downloadVersionFile(version)"
                          style="font-size: 11px; padding: 3px 8px;"
                          title="Download"
                        >
                          <i class="fa fa-download"></i>
                        </button>
                        <!-- Sign -->
                        <button
                          v-if="version.status !== 'SIGNED'"
                          class="btn btn-outline-success btn-sm"
                          @click="signVersion(version)"
                          style="font-size: 11px; padding: 3px 8px;"
                          title="Sign Version"
                        >
                          <i class="fa fa-pen-nib"></i>
                        </button>
                        <span v-else style="color: #10b981; font-size: 12px; display: flex; align-items: center;">
                          <i class="fa fa-check-circle me-1"></i>Signed
                        </span>
                        <!-- Delete -->
                        <button
                          class="btn btn-outline-danger btn-sm"
                          @click="deleteVersion(version)"
                          style="font-size: 11px; padding: 3px 8px;"
                          title="Delete Version"
                        >
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="mb-5">
            <div class="alert alert-info" style="margin-bottom: 0;">
              <i class="fa fa-info-circle me-2"></i>No versions created yet. Click "Add Version" to create the first one.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="alert alert-info p-4">
      <i class="fa fa-spinner fa-spin"></i> Loading contract details...
    </div>

    <!-- Error State -->
    <div v-if="error" class="alert alert-danger p-4">
      <i class="fa fa-exclamation-circle"></i> {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContractStore } from '@/stores/bushman/contract-store'
import { useOrderStore } from '@/stores/bushman/order-store'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'
import { previewContractPdf } from '@/services/pdfService'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const { init } = useToast()
const contractStore = useContractStore()
const orderStore = useOrderStore()
const appOptionStore = useAppOptionStore()

// State
const activeTab = ref('summary')
const downloadingPdf = ref(false)
const originalSidebarState = ref(false)
const linkedOrder = ref<any>(null)

// Computed
const contract = computed(() => contractStore.currentContract)
const contractTypes = computed(() => contractStore.contractTypes)
const loading = computed(() => contractStore.loading)
const error = computed(() => contractStore.error)

// ── Parties ──
const partiesList = computed(() => contract.value?.parties || [])

const partyStats = computed(() => {
  const parties = partiesList.value
  const primary = parties.filter((p: any) => p.is_primary === 1 || p.is_primary === true).length
  const uniqueRoles = new Set(parties.map((p: any) => p.role).filter(Boolean)).size
  const withContact = parties.filter((p: any) => p.contact_email || p.contact_phone).length
  return { primary, uniqueRoles, withContact }
})

// ── Versions ──
const versionsList = computed(() => contract.value?.versions || [])

const versionStats = computed(() => {
  const versions = versionsList.value
  const signed = versions.filter((v: any) => v.status === 'SIGNED').length
  const draft = versions.filter((v: any) => v.status === 'DRAFT').length
  const sorted = [...versions].sort((a: any, b: any) => {
    const aNo = a.version_no || a.versionNo || 0
    const bNo = b.version_no || b.versionNo || 0
    return bNo - aNo
  })
  return { signed, draft, latest: sorted[0] || null }
})

// ── Linked Objects ──
const linkedObjects = computed(() => contract.value?.links || [])

// ── Real Financial Summary from linked order ──
const realFinancialSummary = computed(() => {
  const order = linkedOrder.value
  if (!order) return contract.value?.financial_summary || 'N/A'
  const items = order.items || order.order_items || []
  const logistics = order.logistics || []
  const itemsTotal = items.reduce((s: number, it: any) => {
    const qty = Number(it.quantity || it.qty || 0)
    const rate = Number(it.rate || it.unit_price || it.price || 0)
    const disc = Number(it.discount || 0)
    return s + (Number(it.amount || it.total || it.line_total || 0) || (qty * rate - disc))
  }, 0)
  const logTotal = logistics.reduce((s: number, l: any) => s + Number(l.estimated_amount || l.amount || 0), 0)
  const vat = Number(order.vat_amount || 0) || (order.vat ? (itemsTotal * Number(order.vat) / 100) : 0)
  const expense = Number(order.expense_included || 0)
  const grand = Number(order.total || order.grand_total || 0) || (itemsTotal + logTotal + vat + expense)
  const currency = order.currency?.code || order.currency_code || 'USD'
  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency} ${fmt(grand)}`
})

const linkedOrderNumber = computed(() => {
  const order = linkedOrder.value
  return order?.order_number || null
})

// ── Contract Duration ──
const contractDuration = computed(() => {
  if (!contract.value?.start_date) return { totalDays: 0, remainingDays: 0, elapsedPercentage: 0, isExpired: false }

  const start = new Date(contract.value.start_date)
  const end = contract.value.end_date ? new Date(contract.value.end_date) : null
  const now = new Date()

  if (!end) return { totalDays: 0, remainingDays: 0, elapsedPercentage: 0, isExpired: false }

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const elapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const remaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const elapsedPercentage = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0
  const isExpired = remaining < 0

  return {
    totalDays: Math.max(totalDays, 0),
    remainingDays: Math.abs(remaining),
    elapsedPercentage,
    isExpired
  }
})

// ── Helper Methods ──
const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return 'N/A' }
}

const formatDateTime = (dateTime: string | null | undefined) => {
  if (!dateTime) return 'N/A'
  try {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return 'N/A' }
}

const getStatusBadge = (status: string) => {
  const map: any = {
    'DRAFT': 'bg-secondary', 'NEGOTIATION': 'bg-warning', 'PENDING_SIGNATURE': 'bg-info',
    'ACTIVE': 'bg-success', 'SUSPENDED': 'bg-danger', 'TERMINATED': 'bg-dark', 'EXPIRED': 'bg-secondary'
  }
  return map[status] || 'bg-secondary'
}

const getVersionStatusBadge = (status: string) => {
  const map: any = { 'DRAFT': 'bg-secondary', 'SENT': 'bg-info', 'SIGNED': 'bg-success', 'SUPERSEDED': 'bg-warning' }
  return map[status] || 'bg-secondary'
}

const getRoleBadgeClass = (role: string) => {
  const map: any = {
    'BUYER': 'bg-primary', 'SELLER': 'bg-success', 'AGENT': 'bg-info',
    'PARTNER': 'bg-warning', 'CUSTOMER': 'bg-primary', 'SUPPLIER': 'bg-success'
  }
  return map[role?.toUpperCase()] || 'bg-secondary'
}

const getPartyName = (party: any) => {
  return party.entity?.full_name || party.entity?.name || party.entity_name || party.contact_name || 'Unknown'
}

const getContractTypeName = () => {
  const type = contractTypes.value?.find((t: any) => t.id === contract.value?.contract_type_id)
  return type?.name || contract.value?.contract_type?.name || 'N/A'
}

const getLinkIcon = (objectType: string) => {
  const map: any = {
    'ORDER': 'fa fa-shopping-cart text-primary', 'QUOTATION': 'fa fa-file-invoice text-info',
    'INVOICE': 'fa fa-receipt text-success', 'ENQUIRY': 'fa fa-search text-warning'
  }
  return map[objectType?.toUpperCase()] || 'fa fa-link text-secondary'
}

// ── Actions ──
const editContract = () => {
  router.push({ name: 'contracts-edit', params: { id: contract.value.id } })
}

const goBack = () => {
  router.push({ name: 'contracts-list' })
}

const navigateToObject = (link: any) => {
  if (link.object_type === 'ORDER') {
    router.push({ name: 'orders-view', params: { id: link.object_id } })
  }
}

// ── Status Management ──
const updateContractStatus = async (newStatus: string, confirmTitle: string, confirmText: string) => {
  const confirmed = await Swal.fire({
    title: confirmTitle,
    text: confirmText,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
    confirmButtonColor: '#2563eb'
  })

  if (confirmed.isConfirmed) {
    try {
      await contractStore.updateContract(contract.value.id, { status: newStatus })
      await contractStore.getContract(contract.value.id)
      init({ message: `Contract status updated to ${newStatus}`, color: 'success' })
    } catch (err: any) {
      init({ message: err?.message || 'Error updating status', color: 'danger' })
    }
  }
}

const activateContract = () => {
  updateContractStatus('ACTIVE', 'Activate Contract?', `Move contract ${contract.value.contract_number} from DRAFT to ACTIVE?`)
}

const suspendContract = () => {
  updateContractStatus('SUSPENDED', 'Suspend Contract?', `Suspend active contract ${contract.value.contract_number}?`)
}

const reactivateContract = () => {
  updateContractStatus('ACTIVE', 'Reactivate Contract?', `Reactivate suspended contract ${contract.value.contract_number}?`)
}

// ── PDF ──
const downloadContractPdf = async () => {
  const contractId = route.params.id
  if (!contractId) return
  downloadingPdf.value = true
  try {
    await previewContractPdf(Number(contractId))
  } catch (err) {
    Swal.fire('Error', 'Failed to load contract PDF preview', 'error')
  } finally {
    downloadingPdf.value = false
  }
}

// ── Version Management ──
const addNewVersion = async () => {
  const contractId = contract.value?.id
  if (!contractId) return

  const { value: templateName } = await Swal.fire({
    title: 'Add New Version',
    input: 'text',
    inputLabel: 'Template Name (optional)',
    inputPlaceholder: 'e.g., Standard Template v2',
    showCancelButton: true,
    confirmButtonText: 'Create Version',
    confirmButtonColor: '#2563eb'
  })

  if (templateName !== undefined) {
    try {
      const fd = new FormData()
      if (templateName) fd.append('template_name', templateName)
      fd.append('generated_at', new Date().toISOString().slice(0, 19).replace('T', ' '))
      await contractStore.addContractVersion(contractId, fd)
      await contractStore.getContract(contractId)
      init({ message: 'New version created', color: 'success' })
    } catch (err: any) {
      init({ message: err?.message || 'Error creating version', color: 'danger' })
    }
  }
}

const triggerVersionFileSelect = (idx: number) => {
  const el = document.getElementById(`version-file-${idx}`) as HTMLInputElement | null
  el?.click()
}

const onVersionFileSelected = async (evt: Event, version: any) => {
  const input = evt.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  if (!ALLOWED_TYPES.includes(file.type)) {
    init({ message: 'Invalid file type. Only PDF / DOC / DOCX allowed.', color: 'danger' })
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    init({ message: 'File too large. Maximum is 10MB.', color: 'danger' })
    return
  }

  try {
    const fd = new FormData()
    fd.append('file', file)
    if (version.template_name) fd.append('template_name', version.template_name)

    if (version.id) {
      await contractStore.updateVersion(contract.value.id, version.id, fd)
    } else {
      await contractStore.addContractVersion(contract.value.id, fd)
    }
    await contractStore.getContract(contract.value.id)
    init({ message: `File uploaded for version v${version.version_no || version.versionNo}`, color: 'success' })
  } catch (err: any) {
    init({ message: err?.message || 'Upload failed', color: 'danger' })
  }
}

const downloadVersionFile = async (version: any) => {
  if (!version.id) {
    init({ message: 'Version must be saved first', color: 'warning' })
    return
  }
  try {
    const result = await contractStore.downloadVersionFile(contract.value.id, version.id)
    const filename = version.file_path
      ? version.file_path.split('/').pop()
      : `contract_v${version.version_no || version.versionNo || 1}.pdf`

    if (result.type === 'base64' && result.data?.pdf) {
      // Backend returned base64 PDF (no stored file, generated dynamically)
      const byteChars = atob(result.data.pdf)
      const byteNums = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
      const blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      // Backend returned raw file blob
      const blob = result.data instanceof Blob ? result.data : new Blob([result.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    }
  } catch (err: any) {
    init({ message: err?.message || 'Download failed', color: 'danger' })
  }
}

const signVersion = async (version: any) => {
  if (!version.id) {
    init({ message: 'Version must be saved first', color: 'warning' })
    return
  }

  const confirmed = await Swal.fire({
    title: 'Sign Version?',
    text: `Mark version v${version.version_no || version.versionNo} as SIGNED? This action indicates the version has been officially signed.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Sign It',
    confirmButtonColor: '#10b981'
  })

  if (confirmed.isConfirmed) {
    try {
      await contractStore.signVersion(contract.value.id, version.id)
      await contractStore.getContract(contract.value.id)
      init({ message: `Version v${version.version_no || version.versionNo} signed`, color: 'success' })
    } catch (err: any) {
      init({ message: err?.message || 'Signing failed', color: 'danger' })
    }
  }
}

const deleteVersion = async (version: any) => {
  if (!version.id) {
    init({ message: 'Version must be saved first', color: 'warning' })
    return
  }

  const confirmed = await Swal.fire({
    title: 'Delete Version?',
    text: `Delete version v${version.version_no || version.versionNo}? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626'
  })

  if (confirmed.isConfirmed) {
    try {
      await contractStore.deleteVersion(contract.value.id, version.id)
      await contractStore.getContract(contract.value.id)
      init({ message: 'Version deleted', color: 'success' })
    } catch (err: any) {
      init({ message: err?.message || 'Delete failed', color: 'danger' })
    }
  }
}

// ── Lifecycle ──
onMounted(async () => {
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true

  try {
    await contractStore.fetchContractTypes()
  } catch (err) {
    console.error('Error fetching contract types:', err)
  }

  if (route.params.id) {
    try {
      await contractStore.getContract(Number(route.params.id))
      // Fetch linked order for real financial data
      const links = contractStore.currentContract?.links || []
      const orderLink = links.find((l: any) => l.object_type === 'ORDER')
      if (orderLink?.object_id) {
        try {
          const res = await orderStore.getOrder(Number(orderLink.object_id))
          linkedOrder.value = res.data?.data || res.data
        } catch { /* order may not exist */ }
      }
    } catch (e: any) {
      init({ message: e?.response?.data?.message || 'Error loading contract', color: 'danger' })
    }
  }
})

onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

<style scoped>
.contract-details {
  padding: 1rem;
}

/* Header Card */
.header-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 16px;
  background: #f8fafc;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.04);
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: white;
  font-weight: 600;
}

.tab-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 600;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Summary Cards - removed, using flat layout */

/* Progress */
.progress {
  border-radius: 12px;
  background: #e5e7eb;
  height: 20px;
  overflow: hidden;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: white;
  transition: width 0.6s ease;
  border-radius: 12px;
}

/* Table */
.table { margin-bottom: 0; }

.table thead th {
  border-color: #d1d5db;
  background: #f3f4f6;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #333;
  padding: 0.875rem;
}

.table tbody td {
  border-color: #e5e7eb;
  padding: 0.75rem;
  vertical-align: middle;
}

.table tbody tr:hover { background: #f9fafb; }

/* Badge */
.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.bg-primary { background: #3b82f6 !important; }
.bg-success { background: #10b981 !important; }
.bg-warning { background: #f59e0b !important; color: #1a1a1a !important; }
.bg-danger { background: #ef4444 !important; }
.bg-info { background: #0ea5e9 !important; }
.bg-secondary { background: #6b7280 !important; }
.bg-dark { background: #1f2937 !important; }

/* Text */
.text-muted { color: #6b7280; }
.text-success { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }
.text-info { color: #0ea5e9; }
.text-primary { color: #3b82f6; }

/* Layout */
.row { display: flex; flex-wrap: wrap; margin-right: -0.5rem; margin-left: -0.5rem; }
.col-md-3 { flex: 0 0 calc(25% - 1rem); margin: 0.5rem; }
.col-md-4 { flex: 0 0 calc(33.333% - 1rem); margin: 0.5rem; }
.col-md-6 { flex: 0 0 calc(50% - 1rem); margin: 0.5rem; }
.g-3 { gap: 1rem; }
.g-4 { gap: 1.5rem; }

/* Spacing */
.d-block { display: block; }
.d-flex { display: flex; }
.justify-content-between { justify-content: space-between; }
.align-items-start { align-items: flex-start; }
.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-5 { margin-bottom: 2rem; }
.mt-2 { margin-top: 0.5rem; }
.me-1 { margin-right: 0.25rem; }
.me-2 { margin-right: 0.5rem; }
.p-4 { padding: 1.5rem; }
.small { font-size: 0.875rem; }
.h5 { font-size: 1.25rem; font-weight: 600; }

/* Buttons */
.btn {
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-sm { padding: 0.375rem 0.625rem; font-size: 0.85rem; }

.btn-primary { background: #3b82f6; color: white; }
.btn-success { background: #10b981; color: white; }
.btn-warning { background: #f59e0b; color: white; }
.btn-info { background: #0ea5e9; color: white; }
.btn-secondary { background: #6b7280; color: white; }

.btn-outline-primary { background: transparent; border: 1px solid #3b82f6; color: #3b82f6; }
.btn-outline-primary:hover { background: #3b82f6; color: white; }
.btn-outline-success { background: transparent; border: 1px solid #10b981; color: #10b981; }
.btn-outline-success:hover { background: #10b981; color: white; }
.btn-outline-info { background: transparent; border: 1px solid #0ea5e9; color: #0ea5e9; }
.btn-outline-info:hover { background: #0ea5e9; color: white; }
.btn-outline-danger { background: transparent; border: 1px solid #ef4444; color: #ef4444; }
.btn-outline-danger:hover { background: #ef4444; color: white; }
.btn-outline-secondary { background: transparent; border: 1px solid #6b7280; color: #6b7280; }
.btn-outline-secondary:hover { background: #6b7280; color: white; }

/* Alert */
.alert { padding: 1rem; border-radius: 4px; border: none; margin-bottom: 1rem; }
.alert-info { background: #d1ecf1; color: #0c5460; }
.alert-danger { background: #f8d7da; color: #721c24; }

.table-responsive { border-radius: 6px; overflow-x: auto; }
</style>
