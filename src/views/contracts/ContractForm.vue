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
              <span class="tab-icon">�</span>
              <span class="tab-text">Parties</span>
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
import ContractVersions from './ContractVersions.vue'

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
const savedContractId = ref<number | null>(null)

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
  links: [] as any[],
  salesConfirmationProposalId: null as number | null,
  entityId: null as number | null
})

const showSections = reactive({
  parties: true,
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

  try { // Fetch COMPLETE order from DATABASE with all relations
    const response = await orderStore.getOrder(Number(selectedOrderId.value))
    const order = response.data.data || response.data

    if (!order) {
      throw new Error('Order not found in database')
    }
    
    selectedOrder.value = order
    
    // Auto-populate contract from ORDER database
    form.contractNumber = `CTR-${new Date().getFullYear()}-${String(order.id).padStart(4, '0')}`
    form.title = `Contract for Order #${order.order_number}`
    
    // Ensure contract types are loaded before trying to use them
    if (!contractStore.contractTypes || contractStore.contractTypes.length === 0) {try {
        await contractStore.fetchContractTypes()} catch (error) {
        console.error('❌ Error fetching contract types:', error)
      }
    }
    
    // Orders don't have contract_type_id - auto-select first available type from store
    // If no types available, use fallback default type ID
    if (contractStore.contractTypes && contractStore.contractTypes.length > 0) {
      form.contractTypeId = String(contractStore.contractTypes[0].id)} else {
      // Fallback: Use a default contract type ID when none are available in database
      // Backend will handle this gracefully
      form.contractTypeId = '1'}
    
    form.status = 'DRAFT'
    form.startDate = order.order_date ? order.order_date.split('T')[0] : new Date().toISOString().split('T')[0]
    form.endDate = order.expected_date ? order.expected_date.split('T')[0] : ''
    form.financialSummary = `Order #${order.order_number}: ${order.total || 0}`// DEPLOYMENT DEBUG: Verify fields are actually set in the form object)// Get parties from DATABASE - map exactly as returned by API
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
    
    // Debug: Check what fields are available in order)// Set required fields from order - use order.id as fallback
    form.salesConfirmationProposalId = order.sales_confirmation_proposal_id || order.quotation_id || order.proposal_id || order.id
    form.entityId = order.entity_id || order.buyer_entity_id || order.seller_entity_id || (order.entity?.id) || order.id
    orderDataLoaded.value = true
    const partyCount = form.parties.length
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

// Versions are managed by `ContractVersions.vue` component (isolated)

 

// Version-specific logic moved to `ContractVersions.vue` component
const submit = async () => {
  try {
    saving.value = true

    // Debug: log all required fields before validation})

    // Validate ONLY required fields that backend needs
    // contractTypeId will have fallback value if no types in database
    // status defaults to 'DRAFT'
    if (!form.contractTypeId || !form.status) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'System error: Contract Type or Status missing',
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
      links: form.links,
      sales_confirmation_proposal_id: form.salesConfirmationProposalId,
      entity_id: form.entityId
    }

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
              // Versions are managed separately by the ContractVersions component
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
            // Store the newly created contract ID so Version 1 file management appears
            savedContractId.value = createdId
            // Refresh the contracts list so the new contract appears in ContractList
            await contractStore.listContracts()
            Swal.fire({
              icon: 'success',
              title: 'Contract Created!',
              text: `${form.title} has been created successfully. You can now upload the contract file for Version 1.`,
              confirmButtonColor: '#2563eb'
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

  // Fetch all contract metadata from DATABASE - not hardcoded// Fetch each independently so one error doesn't block the others
  try {
    await contractStore.fetchContractTypes()} catch (error) {
    console.error('❌ Error fetching contract types:', error)
  }

  try {
    await contractStore.fetchContractStatuses()} catch (error) {
    console.error('❌ Error fetching contract statuses:', error)
  }

  try {
    await contractStore.fetchPartyRoles()} catch (error) {
    console.error('❌ Error fetching party roles:', error)
  }

  try {
    await contractStore.fetchCurrencies()} catch (error) {
    console.error('❌ Error fetching currencies:', error)
  }

  try {
    // Fetch available orders from DATABASE for Quick Start
    await orderStore.listOrders({
      limit: 100,
      include: 'parties,parties.entity,items'
    })
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
