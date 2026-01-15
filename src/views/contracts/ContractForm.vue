<template>
  <div class="contract-form-page">
    <!-- Page Title Row -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="crumbs">
          <span class="crumb-icon">📋</span>
          CONTRACTS / <span>{{ isEdit ? 'EDIT' : 'CREATE' }}</span>
        </div>
        <h1>{{ isEdit ? 'Edit Contract' : 'Create Contract' }}</h1>
        <p class="subtitle">{{ isEdit ? 'Update contract details and terms' : 'Configure your contract with parties, terms, and billing schedules' }}</p>
      </div>

      <div class="head-actions">
        <button class="btn ghost" type="button" @click="goBack">
          <span class="btn-icon">←</span> Back
        </button>
        <button class="btn ghost" type="button" @click="resetForm">
          <span class="btn-icon">⟲</span> Reset
        </button>
        <button class="btn primary" type="button" @click="submit" :disabled="saving">
          <span class="btn-icon">✓</span> {{ saving ? 'Saving...' : isEdit ? 'Update Contract' : 'Create Contract' }}
        </button>
      </div>
    </div>

    <!-- 2-Column Grid Layout -->
    <section class="grid">
      <!-- LEFT PANEL: Contract Details -->
      <aside class="panel left-panel">
        <div class="panel-header">
          <div class="panel-icon">📝</div>
          <div class="panel-title-text">
            <h3>{{ isEdit ? 'Edit Details' : 'Contract Details' }}</h3>
            <p>Fill in the contract information</p>
          </div>
        </div>

        <div class="form">
          <!-- QUICK START: LINK WITH ORDER -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">⭐</span>
              Quick Start: Select Order
            </div>

            <label class="field">
              <span class="lbl">select Order</span>
              <div class="input-wrapper">
                <span class="input-icon">🔗</span>
                <select v-model="selectedOrderId" @change="onOrderSelect">
                  <option value="">-- Select Order to Auto-Populate --</option>
                  <option v-for="order in availableOrders" :key="order.id" :value="String(order.id)">
                    {{ order.order_number }} - {{ order.entity?.full_name || order.party_name || 'N/A' }}
                  </option>
                </select>
              </div>
            </label>

            <!-- SUCCESS MESSAGE WHEN ORDER SELECTED -->
            <div v-if="selectedOrderId && orderDataLoaded" style="margin-top: 12px; padding: 12px; background: #e3f2fd; border-left: 4px solid #2563eb; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #1565c0; font-weight: 500;">
                ✓ Order loaded! Contract parties auto-populated. Ready to create contract.
              </p>
            </div>
          </div>

          <!-- SECTION 1: CONTRACT DETAILS (Auto-populated from Order - Hidden) -->
          <!-- Contract Number, Title, Type, Start Date are auto-populated from order selection -->
          <!-- No user input needed for these fields -->

          <!-- SECTION 2: DATES & VALIDITY -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">📅</span>
              Dates & Validity
            </div>

            <div class="financial-grid">
              <label class="field">
                <span class="lbl">End Date</span>
                <div class="input-wrapper">
                  <span class="input-icon">📅</span>
                  <input v-model="form.endDate" type="date" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Signed Date</span>
                <div class="input-wrapper">
                  <span class="input-icon">✍️</span>
                  <input v-model="form.signedDate" type="date" />
                </div>
              </label>


            </div>
          </div>
        </div>
      </aside>

      <!-- RIGHT PANEL: Contract Configuration -->
      <aside class="panel right-panel">
        <div class="panel-header">
          <div class="panel-icon">⚙️</div>
          <div class="panel-title-text">
            <h3>Contract Configuration</h3>
            <p>Set up parties, versions, and billing terms</p>
          </div>
        </div>

        <!-- Horizontal Tabs -->
        <div class="tabs-card">
          <div class="tabs">
            <button
              @click="toggleSection('parties')"
              :class="['tab', { active: showSections.parties }]"
              type="button"
            >
              <span class="tab-icon">👥</span>
              <span class="tab-text">Parties</span>
            </button>
            <button
              @click="toggleSection('versions')"
              :class="['tab', { active: showSections.versions }]"
              type="button"
            >
              <span class="tab-icon">📄</span>
              <span class="tab-text">Versions</span>
            </button>
            <button
              @click="toggleSection('additionalDetails')"
              :class="['tab', { active: showSections.additionalDetails }]"
              type="button"
            >
              <span class="tab-icon">📋</span>
              <span class="tab-text">Additional Details</span>
            </button>
          </div>
        </div>

        <!-- Section Content -->
        <div class="section-content">
          <!-- PARTIES SECTION -->
          <div v-if="showSections.parties" class="expandable-section">
            <div class="subsection">
              <div class="subsection-header">
                <h4>Contract Parties</h4>
              </div>

              <!-- Parties Table -->
              <div v-if="form.parties.length > 0" class="table-wrapper mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="min-width: 100px">Role</th>
                      <th style="min-width: 180px">Entity / Contact</th>
                      <th style="min-width: 140px">Email</th>
                      <th style="min-width: 110px">Phone</th>
                      <th style="min-width: 80px">Primary</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(party, idx) in form.parties" :key="idx">
                      <td>{{ party.role || '-' }}</td>
                      <td>{{ party.entityName || party.contactName || '-' }}</td>
                      <td>{{ party.contactEmail || '-' }}</td>
                      <td>{{ party.contactPhone || '-' }}</td>
                      <td class="text-center">
                        <input type="checkbox" v-model="party.isPrimary" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state mt-3">No parties added yet</div>
            </div>
          </div>

          <!-- VERSIONS SECTION -->
          <div v-if="showSections.versions" class="expandable-section">
            <div class="subsection">
              <div class="subsection-header">
                <h4>Contract Versions</h4>
                <button class="btn btn-sm btn-primary" @click="addVersion" type="button">+ Add Version</button>
              </div>

              <!-- Versions Table -->
              <div v-if="form.versions.length > 0" class="table-wrapper mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="min-width: 80px">Version</th>
                      <th style="min-width: 100px">Status</th>
                      <th style="min-width: 150px">Template</th>
                      <th style="min-width: 100px">Generated</th>
                      <th style="min-width: 60px">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(version, idx) in form.versions" :key="idx">
                      <td>#{{ version.versionNo }}</td>
                      <td><span class="badge bg-info">{{ version.status }}</span></td>
                      <td>{{ version.templateName || '-' }}</td>
                      <td>{{ formatDate(version.generatedAt) }}</td>
                      <td style="display:flex; gap:6px; align-items:center;">
                          <input :id="`file-${idx}`" type="file" style="display:none" @change="(e) => onFileSelected(e, idx)" />
                          <button class="btn btn-xs" @click.prevent="triggerFileSelect(idx)" type="button" style="background:#f3f4f6">Choose</button>
                          <button class="btn btn-xs btn-outline" @click.prevent="handleDownloadVersion(version)" type="button">Download</button>
                          <button v-if="version.status !== 'SIGNED' && version.status !== 'SUPERSEDED'" class="btn btn-xs btn-success" @click.prevent="handleSignVersion(version)" type="button">Sign</button>
                          <button class="btn btn-xs btn-secondary" @click.prevent="handleSupersedeVersion(version)" type="button">Supersede</button>
                          <button class="btn btn-xs btn-danger" @click.prevent="handleDeleteVersion(idx, version)" type="button">Delete</button>
                        </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state mt-3">No versions added yet</div>
            </div>
          </div>

          <!-- ADDITIONAL DETAILS SECTION -->
          <div v-if="showSections.additionalDetails" class="expandable-section">
            <div class="section-inner-header">
              <h4>Additional Details</h4>
            </div>

            <div class="subsection">
              <!-- Row 1: Governing Law & Jurisdiction -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-section">
                  <label class="form-label">Governing Law</label>
                  <input v-model="form.governingLaw" type="text" placeholder="e.g., Laws of Tanzania" class="form-input" style="padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; width: 100%;" />
                </div>
                <div class="form-section">
                  <label class="form-label">Jurisdiction</label>
                  <input v-model="form.jurisdiction" type="text" placeholder="e.g., Dar es Salaam, Tanzania" class="form-input" style="padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; width: 100%;" />
                </div>
              </div>

              <!-- Row 2: Financial Summary & Special Terms -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-section">
                  <label class="form-label">Financial Summary</label>
                  <textarea v-model="form.financialSummary" placeholder="Summary of financial terms..." class="form-textarea" style="min-height: 80px; resize: vertical; padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; width: 100%;"></textarea>
                </div>
                <div class="form-section">
                  <label class="form-label">Special Terms</label>
                  <textarea v-model="form.specialTerms" placeholder="Any special terms and conditions..." class="form-textarea" style="min-height: 80px; resize: vertical; padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; width: 100%;"></textarea>
                </div>
              </div>

              <!-- Row 3: Additional Note -->
              <div class="form-section">
                <label class="form-label">Additional Note</label>
                <textarea v-model="form.additionalNote" placeholder="Add any supplementary notes or remarks..." class="form-textarea" style="min-height: 80px; resize: vertical; padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; width: 100%;"></textarea>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, reactive, ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContractStore } from '@/stores/bushman/contract-store'
import { useOrderStore } from '@/stores/bushman/order-store'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'
import Swal from 'sweetalert2'
import contractService from '@/services/contractService'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const contractStore = useContractStore()
const orderStore = useOrderStore()
const appOptionStore = useAppOptionStore()

// Sidebar state
const originalSidebarState = ref(false)

// Computed states
const contractTypes = computed(() => contractStore.contractTypes)
const contractStatuses = computed(() => contractStore.contractStatuses)

// Form state
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const form = reactive({
  contractNumber: '',
  contractTypeId: '',
  title: '',
  status: 'DRAFT',
  startDate: '',
  endDate: '',
  signedDate: '',
  referenceExternal: '',
  governingLaw: '',
  jurisdiction: '',
  legalJurisdiction: '',
  additionalInformation: '',
  financialSummary: '',
  specialTerms: '',
  additionalNote: '',
  parties: [] as any[],
  versions: [] as any[],
  links: [] as any[]
})

const showSections = reactive({
  parties: true,
  versions: false,
  additionalDetails: false
})

// Quick Start: Order Selection
const selectedOrderId = ref('')
const availableOrders = computed(() => {
  const orders = orderStore.orders || []
  return orders.filter((order: any) => order.status === 'APPROVED')
})
const selectedOrder = ref<any>(null)
const orderDataLoaded = ref(false)

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

const onOrderSelect = async () => {
  if (!selectedOrderId.value) {
    orderDataLoaded.value = false
    selectedOrder.value = null
    return
  }

  try {
    console.log('🔍 Selected Order ID:', selectedOrderId.value)
    
    // Fetch COMPLETE order from DATABASE with all relations
    const response = await orderStore.getOrder(Number(selectedOrderId.value))
    console.log('📦 Order API Response:', response)
    
    const order = response.data.data || response.data
    console.log('✅ Order Data Extracted:', order)
    console.log('🔍 Order contract_type_id field:', {
      value: order.contract_type_id,
      type: typeof order.contract_type_id,
      exists: 'contract_type_id' in order,
      keys: Object.keys(order).filter(k => k.includes('type') || k.includes('contract'))
    })
    
    if (!order) {
      throw new Error('Order not found in database')
    }
    
    selectedOrder.value = order
    
    // Auto-populate contract from ORDER database
    form.contractNumber = `CTR-${new Date().getFullYear()}-${String(order.id).padStart(4, '0')}`
    form.title = `Contract for Order #${order.order_number}`
    
    // Orders don't have contract_type_id - auto-select first available type from store
    if (contractStore.contractTypes && contractStore.contractTypes.length > 0) {
      form.contractTypeId = String(contractStore.contractTypes[0].id)
      console.log('📌 Auto-selected first Contract Type:', {
        typeId: form.contractTypeId,
        typeName: contractStore.contractTypes[0].name
      })
    } else {
      console.warn('⚠️ No contract types available in store')
      form.contractTypeId = ''
    }
    
    form.status = 'DRAFT'
    form.startDate = order.order_date ? order.order_date.split('T')[0] : new Date().toISOString().split('T')[0]
    form.endDate = order.expected_date ? order.expected_date.split('T')[0] : ''
    form.financialSummary = `Order #${order.order_number}: ${order.total || 0}`
    
    console.log('📝 Form Auto-Populated:', {
      contractNumber: form.contractNumber,
      title: form.title,
      contractTypeId: form.contractTypeId,
      startDate: form.startDate
    })
    
    // Get parties from DATABASE - map exactly as returned by API
    form.parties = []
    if (order.parties && Array.isArray(order.parties)) {
      form.parties = order.parties.map((party: any) => ({
        id: party.id,
        entityId: party.entity_id,
        entityName: party.entity?.full_name || party.entity?.name || 'Unknown Entity',
        role: party.role,
        isPrimary: party.is_primary === 1 || party.is_primary === true,
        contactName: party.contact_name || '',
        contactEmail: party.contact_email || '',
        contactPhone: party.contact_phone || '',
        entity: party.entity || null
      }))
    }
    
    // Add order link
    form.links = [{
      objectType: 'ORDER',
      objectId: String(order.id),
      relationType: 'CREATED_FROM'
    }]
    
    orderDataLoaded.value = true
    const partyCount = form.parties.length
    console.log('✨ Order loaded successfully with', partyCount, 'parties')
    init({ 
      message: `✓ Order #${order.order_number} loaded from database (${partyCount} parties loaded)`, 
      color: 'success' 
    })
  } catch (error: any) {
    console.error('❌ Error loading order from database:', error)
    console.error('Error details:', error.response?.data)
    init({ message: 'Error loading order: ' + error.message, color: 'danger' })
    orderDataLoaded.value = false
  }
}

const toggleSection = (section: string) => {
  Object.keys(showSections).forEach((key) => {
    showSections[key as keyof typeof showSections] = key === section
  })
}

const addVersion = () => {
  form.versions.push({
    versionNo: (form.versions.length || 0) + 1,
    status: 'DRAFT',
    templateName: '',
    filePath: '',
    generatedAt: new Date().toISOString(),
    _file: null
  })
}

const removeVersion = (idx: number) => {
  form.versions.splice(idx, 1)
}

const editVersion = (idx: number) => {
  const version = form.versions[idx]
  const newTemplateName = prompt('Enter version template name:', version.templateName || '')
  if (newTemplateName !== null) {
    form.versions[idx].templateName = newTemplateName
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

const onFileSelected = (evt: Event, idx: number) => {
  const input = evt.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  if (!ALLOWED_TYPES.includes(file.type)) {
    init({ message: 'Invalid file type. Only PDF / DOC / DOCX allowed', color: 'danger' })
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    init({ message: 'File too large. Maximum is 10MB', color: 'danger' })
    return
  }
  form.versions[idx]._file = file
  form.versions[idx].filePath = file.name
}

const triggerFileSelect = (idx: number) => {
  const el = document.getElementById('file-' + idx) as HTMLInputElement | null
  el?.click()
}

const handleDownloadVersion = async (version: any) => {
  await downloadVersionFile(route.params.id, version)
}

const handleSignVersion = async (version: any) => {
  if (!isEdit.value) return init({ message: 'Save contract first before signing', color: 'warning' })
  await signVersion(Number(route.params.id), version)
}

const handleSupersedeVersion = async (version: any) => {
  if (!isEdit.value) return init({ message: 'Save contract first', color: 'warning' })
  await supersedePrevious(Number(route.params.id), version)
}

const handleDeleteVersion = async (idx: number, version: any) => {
  if (isEdit.value) {
    await deleteVersion(Number(route.params.id), idx)
  } else {
    removeVersion(idx)
  }
}

const uploadVersionToServer = async (contractId: number, version: any) => {
  try {
    const fd = new FormData()
    if (version.templateName) fd.append('template_name', version.templateName)
    if (version.generatedAt) fd.append('generated_at', new Date(version.generatedAt).toISOString().slice(0, 19).replace('T', ' '))
    if (version._file) fd.append('file', version._file)

    // If version already exists on server (has id) update, otherwise create
    if (version.id) {
      await contractService.updateVersion(contractId, version.id, fd)
    } else {
      await contractService.createVersion(contractId, fd)
    }
    init({ message: `Version ${version.versionNo} uploaded`, color: 'success' })
  } catch (error: any) {
    console.error('Error uploading version file', error)
    init({ message: `Upload failed: ${error.message || 'server error'}`, color: 'danger' })
  }
}

const fetchVersions = async (contractId: number) => {
  try {
    const res = await contractService.listVersions(contractId)
    const data = res.data || res.data?.data || res
    // normalize
    form.versions = (data.data || data || []).map((v: any, idx: number) => ({
      id: v.id,
      versionNo: v.version_no || v.versionNo || idx + 1,
      status: v.status,
      templateName: v.template_name || v.templateName,
      filePath: v.file_path || v.filePath || '',
      generatedAt: v.generated_at || v.generatedAt,
      signedAt: v.signed_at || v.signedAt,
      createdBy: v.createdBy || v.created_by || null,
      _file: null
    }))
  } catch (error) {
    console.error('Failed to load versions', error)
  }
}

const downloadVersionFile = async (contractId: number, version: any) => {
  try {
    if (!version.id) {
      // local staged file
      if (version._file) {
        const url = URL.createObjectURL(version._file)
        const a = document.createElement('a')
        a.href = url
        a.download = version._file.name
        a.click()
        URL.revokeObjectURL(url)
      } else {
        init({ message: 'No file available for download', color: 'warning' })
      }
      return
    }

    const resp = await contractService.generatePdf(Number(contractId), Number(version.id))
    const blob = resp.data || resp
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = version.filePath ? version.filePath.split('/').pop() : `contract_v${version.versionNo}.pdf`
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error('Download failed', error)
    init({ message: 'Download failed', color: 'danger' })
  }
}

const signVersion = async (contractId: number, version: any) => {
  try {
    if (!version.id) return init({ message: 'Version must be saved to sign', color: 'warning' })
    await contractService.updateVersion(contractId, version.id, { status: 'SIGNED', signed_at: new Date().toISOString() })
    version.status = 'SIGNED'
    init({ message: `Version ${version.versionNo} signed`, color: 'success' })
    // Auto-supersede previous versions
    try {
      await axios.post(`${(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')}/contracts/${contractId}/versions/${version.id}/supersede`)
    } catch (e) {
      // not critical
      console.warn('Supersede call failed', e)
    }
  } catch (error: any) {
    console.error('Sign failed', error)
    init({ message: 'Signing failed', color: 'danger' })
  }
}

const supersedePrevious = async (contractId: number, version: any) => {
  try {
    if (!version.id) return init({ message: 'Version must be saved to supersede', color: 'warning' })
    await axios.post(`${(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')}/contracts/${contractId}/versions/${version.id}/supersede`)
    // mark local copies
    form.versions.forEach((v: any) => {
      if (v.id && v.id !== version.id && v.status !== 'SUPERSEDED') v.status = 'SUPERSEDED'
    })
    init({ message: 'Previous versions marked as superseded', color: 'success' })
  } catch (error: any) {
    console.error('Supersede failed', error)
    init({ message: 'Supersede failed', color: 'danger' })
  }
}

const deleteVersion = async (contractId: number, versionIdx: number) => {
  const v = form.versions[versionIdx]
  const confirmed = await Swal.fire({
    icon: 'warning',
    title: 'Delete Version',
    text: `Are you sure you want to delete version ${v.versionNo}? This cannot be undone.`,
    showCancelButton: true,
    confirmButtonColor: '#dc2626'
  })
  if (!confirmed.isConfirmed) return
  try {
    if (v.id) {
      await axios.delete(`${(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')}/contracts/${contractId}/versions/${v.id}`)
    }
    form.versions.splice(versionIdx, 1)
    init({ message: `Version ${v.versionNo} deleted`, color: 'success' })
  } catch (error: any) {
    console.error('Delete failed', error)
    init({ message: 'Delete failed', color: 'danger' })
  }
}

const resetForm = () => {
  Object.assign(form, {
    contractNumber: '',
    contractTypeId: '',
    title: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    signedDate: '',
    referenceExternal: '',
    governingLaw: '',
    jurisdiction: '',
    legalJurisdiction: '',
    additionalInformation: '',
    financialSummary: '',
    specialTerms: '',
    additionalNote: '',
    parties: [],
    versions: [],
    links: []
  })
}

const submit = async () => {
  try {
    saving.value = true

    // Debug: log all required fields before validation
    console.log('🔍 VALIDATION CHECK:', {
      contractNumber: form.contractNumber,
      title: form.title,
      contractTypeId: form.contractTypeId,
      startDate: form.startDate,
      allPresent: !!(form.contractNumber && form.title && form.contractTypeId && form.startDate)
    })

    // Validate required fields
    if (!form.contractNumber || !form.title || !form.contractTypeId || !form.startDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields (Contract Number, Title, Type, Start Date)',
        confirmButtonColor: '#2563eb'
      })
      saving.value = false
      return
    }

    const payload = {
      // contract_number is auto-generated by backend - not sent from frontend
      contract_type_id: Number(form.contractTypeId),
      title: form.title,
      status: form.status,
      start_date: form.startDate,
      end_date: form.endDate || null,
      signed_date: form.signedDate || null,
      reference_external: form.referenceExternal || null,
      governing_law: form.governingLaw || null,
      jurisdiction: form.jurisdiction || null,
      legal_jurisdiction: form.legalJurisdiction || null,
      additional_information: form.additionalInformation || null,
      financial_summary: form.financialSummary || null,
      special_terms: form.specialTerms || null,
      additional_note: form.additionalNote || null,
      parties: form.parties,
      versions: form.versions,
      links: form.links
    }

    console.log('📤 SENDING PAYLOAD TO BACKEND:', JSON.stringify(payload, null, 2))

    if (isEdit.value) {
      await Swal.fire({
        icon: 'info',
        title: 'Updating Contract',
        text: 'Please wait while we update your contract...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: async () => {
          Swal.showLoading()
            try {
              await contractStore.updateContract(Number(route.params.id), payload)
              // Upload any staged version files or create new versions
              const contractId = Number(route.params.id)
              for (const v of form.versions) {
                if (v._file || !v.id) {
                  // upload or create
                  await uploadVersionToServer(contractId, v)
                }
              }
              Swal.fire({
                icon: 'success',
                title: 'Contract Updated!',
                text: 'Your contract has been updated successfully.',
                confirmButtonColor: '#2563eb'
              })
            } catch (error: any) {
              Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message || 'Failed to update contract',
                confirmButtonColor: '#dc2626'
              })
            }
        }
      })
    } else {
      await Swal.fire({
        icon: 'info',
        title: 'Creating Contract',
        text: 'Please wait while we create your contract...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: async () => {
          Swal.showLoading()
          try {
            const result = await contractStore.createContract(payload)
            // extract created id
            const createdId = result?.data?.data?.id || result?.data?.id || result?.id
            // upload staged versions (if any)
            if (createdId) {
              for (const v of form.versions) {
                if (v._file || !v.id) {
                  await uploadVersionToServer(createdId, v)
                }
              }
            }
            Swal.fire({
              icon: 'success',
              title: 'Contract Created!',
              text: `${form.title} has been created successfully.`,
              confirmButtonColor: '#2563eb'
            }).then(() => {
              router.push({ name: 'contracts-list' })
            })
          } catch (error: any) {
            console.error('❌ Contract Creation Error:', error)
            console.error('Error Response:', error.response?.data)
            console.error('🔴 VALIDATION ERRORS:', JSON.stringify(error.response?.data?.errors, null, 2))
            
            // Build detailed error message
            let errorText = error.response?.data?.message || 'Failed to create contract'
            if (error.response?.data?.errors) {
              const errorFields = Object.entries(error.response.data.errors)
                .map(([field, messages]: any) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('\n')
              errorText = errorText + '\n\n' + errorFields
            }
            
            Swal.fire({
              icon: 'error',
              title: 'Creation Failed',
              text: errorText,
              confirmButtonColor: '#dc2626'
            })
          }
        }
      })
    }
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || error.message || 'An unexpected error occurred',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.back()
}

// Lifecycle
onMounted(async () => {
  // Save original sidebar state and collapse it
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true

  // Fetch all contract metadata from DATABASE - not hardcoded
  console.log('🔄 Starting to fetch contract metadata...')
  
  // Fetch each independently so one error doesn't block the others
  try {
    await contractStore.fetchContractTypes()
    console.log('✅ Contract Types:', contractStore.contractTypes)
  } catch (error) {
    console.error('❌ Error fetching contract types:', error)
  }

  try {
    await contractStore.fetchContractStatuses()
    console.log('✅ Contract Statuses:', contractStore.contractStatuses)
  } catch (error) {
    console.error('❌ Error fetching contract statuses:', error)
  }

  try {
    await contractStore.fetchPartyRoles()
    console.log('✅ Party Roles:', contractStore.partyRoles)
  } catch (error) {
    console.error('❌ Error fetching party roles:', error)
  }

  try {
    await contractStore.fetchCurrencies()
    console.log('✅ Currencies:', contractStore.currencies)
  } catch (error) {
    console.error('❌ Error fetching currencies:', error)
  }

  try {
    // Fetch available orders from DATABASE for Quick Start
    console.log('🔄 Fetching available orders...')
    await orderStore.listOrders({
      limit: 100,
      include: 'parties,parties.entity,items'
    })
    console.log('✅ Orders loaded:', orderStore.orders.length, 'orders available')
  } catch (error) {
    console.error('❌ Error fetching orders:', error)
  }

  if (isEdit.value) {
    try {
      // Fetch contract from DATABASE with all relations
      const response = await contractStore.getContract(Number(route.params.id))
      const contract = response.data.data || response.data
      
      Object.assign(form, {
        contractNumber: contract.contract_number,
        contractTypeId: String(contract.contract_type_id),
        title: contract.title,
        status: contract.status,
        startDate: contract.start_date,
        endDate: contract.end_date,
        signedDate: contract.signed_date,
        referenceExternal: contract.reference_external,
        governingLaw: contract.governing_law,
        jurisdiction: contract.jurisdiction,
        autoRenew: contract.auto_renew === 1 || contract.auto_renew === true,
        renewalTermMonths: contract.renewal_term_months,
        financialSummary: contract.financial_summary,
        specialTerms: contract.special_terms,
        additionalNote: contract.additional_note,
        parties: contract.parties || [],
        versions: contract.versions || [],
        billingSchedules: contract.billing_schedules || [],
        links: contract.links || []
      })
    } catch (error) {
      init({ message: 'Error loading contract from database', color: 'danger' })
      router.back()
    }
  }
})

// Restore sidebar state when leaving the page
onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

<style scoped lang="scss">
.contract-form-page {
  width: 100%;
  padding: 16px;
  background: #f8f9fa;
  min-height: 100vh;

  /* Page Head */
  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    padding: 14px 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    .page-head-left {
      flex: 1;

      .crumbs {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        margin-bottom: 8px;

        .crumb-icon {
          font-size: 16px;
          margin-right: 6px;
        }
      }

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: 14px;
        color: #64748b;
      }
    }

    .head-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;

      .btn {
        padding: 8px 16px;
        font-size: 13px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;

        &.primary {
          background: #2563eb;
          color: white;

          &:hover {
            background: #1d4ed8;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          }
        }

        &.ghost {
          background: white;
          border: 1px solid #e2e8f0;
          color: #475569;

          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
          }
        }
      }
    }
  }

  /* Grid Layout */
  .grid {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 14px;
    align-items: start;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }

  /* Panel */
  .panel {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;

      .panel-icon {
        font-size: 28px;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #dbeafe;
        border-radius: 10px;
      }

      .panel-title-text {
        flex: 1;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #64748b;
        }
      }
    }
  }

  /* Left Panel - Form */
  .left-panel {
    display: flex;
    flex-direction: column;
  }

  .form {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #fafbfc;
  }

  .form-section {
    background: white;
    border-radius: 8px;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    box-sizing: border-box;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #dbeafe;
      overflow: hidden;
      word-break: break-word;
      width: 100%;

      .section-icon {
        font-size: 14px;
      }
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      .lbl {
        font-size: 11px;
        color: #0f172a;
        font-weight: 600;

        .req {
          color: #dc2626;
        }
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        transition: all 0.2s;
        min-height: 28px;
        width: 100%;
        max-width: 100%;

        &:focus-within {
          border-color: #2563eb;
          box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
        }

        .input-icon {
          position: absolute;
          left: 8px;
          font-size: 12px;
          color: #94a3b8;
        }

        input,
        select {
          border: none;
          background: transparent;
          padding: 4px 22px 4px 22px;
          font-size: 10px;
          flex: 1;
          outline: none;
          min-width: 0;
          color: #0f172a;

          &::placeholder {
            color: #94a3b8;
            opacity: 1;
          }
        }

        select {
          appearance: none;
          padding-right: 16px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M1.5 4.5L6 9l4.5-4.5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 2px center;

          &:disabled {
            background-image: none;
            padding-right: 4px;
          }
        }
      }

      textarea {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px;
        font-size: 11px;
        font-family: inherit;
        resize: vertical;
        color: #0f172a;

        &::placeholder {
          color: #94a3b8;
          opacity: 1;
        }
      }
    }

    .financial-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;

      .field {
        margin-bottom: 0;
      }
    }
  }

  /* Right Panel */
  .right-panel {
    display: flex;
    flex-direction: column;
  }

  .tabs-card {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
    background: white;

    .tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .tab {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        transition: all 0.2s;

        &:hover:not(.active) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        &.active {
          background: #2563eb;
          border-color: #1e40af;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }

        .tab-icon {
          font-size: 16px;
        }

        .tab-text {
          font-size: 12px;
          font-weight: 600;
        }
      }
    }
  }

  .section-content {
    padding: 12px;

    .expandable-section {
      .subsection {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;

        &:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .subsection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          h4 {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }

          .btn {
            padding: 6px 12px;
            font-size: 11px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;

            &:hover {
              background: #1d4ed8;
              box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
            }
          }
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 8px;

          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;

            thead {
              background: #f9fafb;
              border-bottom: 1px solid #e2e8f0;

              th {
                padding: 8px;
                text-align: left;
                font-weight: 600;
                color: #0f172a;
                font-size: 11px;
              }
            }

            tbody {
              tr {
                border-bottom: 1px solid #e2e8f0;

                &:hover {
                  background: #f9fafb;
                }

                td {
                  padding: 8px;
                  font-size: 11px;
                  color: #475569;
                }

                .btn {
                  padding: 4px 8px;
                  font-size: 10px;
                  background: #dc2626;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: 600;
                  transition: all 0.2s;

                  &:hover {
                    background: #991b1b;
                  }
                }
              }
            }
          }
        }

        .empty-state {
          text-align: center;
          padding: 16px;
          color: #94a3b8;
          font-size: 11px;
          background: #f9fafb;
          border-radius: 6px;
          margin-top: 8px;
        }
      }
    }
  }
}
</style>
