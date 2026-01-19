<template>
  <div class="proposal-form">
    <h2 class="h4 fw-bold mb-4">
      {{ isEdit ? 'Edit Quotation' : 'Create New Quotation' }}
    </h2>

    <form ref="formRef" @submit.prevent="submitForm">
      <!-- Sales Inquiry Selection (only for new proposals) -->
      <div v-if="!isEdit" class="card mb-4">
        <div class="card-header d-flex align-items-center gap-2">
          <i class="bi bi-search text-primary"></i>
          Select Sales Inquiry
        </div>
        <div class="card-body">
          <div class="alert alert-info border-start border-4 border-info mb-3">
            <strong>Link to Sales Inquiry</strong>
            <p class="mb-0 small">Select a sales inquiry to create a quotation. Client and hunting details will be automatically populated.</p>
          </div>

          <div class="mb-3">
            <label class="form-label">Sales Inquiry <span class="text-danger">*</span></label>
            <select
              v-model="form.sales_inquiry_id"
              class="form-select"
              :class="{ 'is-loading': loadingInquiries }"
              required
              @change="onInquirySelectedFromSelect"
            >
              <option value="" disabled>Search and select a sales inquiry...</option>
              <option v-for="option in salesInquiryOptions" :key="option.value" :value="option.value">
                {{ option.text }} - {{ option.subtitle }}
              </option>
            </select>
            <div v-if="loadingInquiries" class="form-text">
              <span class="spinner-border spinner-border-sm me-1"></span> Loading inquiries...
            </div>
          </div>

          <!-- Selected Inquiry Preview -->
          <div v-if="selectedInquiry" class="mt-3 p-3 bg-light rounded">
            <h6 class="fw-semibold mb-2">Selected Inquiry Details</h6>
            <div class="row g-3 small">
              <div class="col-6 col-md-3">
                <span class="text-muted">Client:</span>
                <span class="ms-1 fw-medium">{{ selectedInquiry.client_name }}</span>
              </div>
              <div class="col-6 col-md-3">
                <span class="text-muted">Area:</span>
                <span class="ms-1 fw-medium">{{ selectedInquiry.area }}</span>
              </div>
              <div class="col-6 col-md-3">
                <span class="text-muted">Days:</span>
                <span class="ms-1 fw-medium">{{ selectedInquiry.no_of_days }}</span>
              </div>
              <div class="col-6 col-md-3">
                <span class="text-muted">Season:</span>
                <span class="ms-1 fw-medium">{{ selectedInquiry.season }}</span>
              </div>
            </div>
            <div v-if="selectedInquiry.species" class="mt-2">
              <span class="text-muted">Species:</span>
              <span class="ms-1 fw-medium">{{ selectedInquiry.species }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quotation Details -->
      <div class="card mb-4">
        <div class="card-header d-flex align-items-center gap-2">
          <i class="bi bi-file-text text-primary"></i>
          Quotation Details
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Confirmation Date</label>
              <input
                v-model="confirmationDateString"
                type="date"
                class="form-control"
                placeholder="Select date"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Hunting License</label>
              <input
                v-model="form.hunting_license"
                type="text"
                class="form-control"
                placeholder="Enter license number (optional)"
              />
            </div>
          </div>
          <div class="mt-3">
            <label class="form-label">Remarks</label>
            <textarea
              v-model="form.remarks"
              class="form-control"
              rows="3"
              placeholder="Add any additional notes or remarks..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Payment Installments -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-credit-card text-primary"></i>
            Payment Installments
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="addInstallment">
            <i class="bi bi-plus-lg me-1"></i> Add Installment
          </button>
        </div>
        <div class="card-body">
          <div v-if="form.installments.length === 0" class="alert alert-warning border-start border-4 border-warning mb-3">
            <strong>Required</strong>
            <p class="mb-0 small">At least one payment installment is required to create a quotation.</p>
          </div>

          <div v-if="form.installments.length === 0" class="text-center text-muted py-3">
            No installments added. Click "Add Installment" to create payment schedule.
          </div>

          <div
            v-for="(installment, index) in form.installments"
            :key="index"
            class="installment-row mb-3 p-3 border rounded"
          >
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="fw-semibold text-secondary">Installment {{ index + 1 }}</span>
              <button type="button" class="btn btn-link text-danger p-0" @click="removeInstallment(index)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Description <span class="text-danger">*</span></label>
                <input
                  v-model="installment.narration"
                  type="text"
                  class="form-control"
                  placeholder="e.g., Deposit Due upon booking"
                  required
                />
              </div>
              <div class="col-md-3">
                <label class="form-label">Amount (USD) <span class="text-danger">*</span></label>
                <input
                  v-model="installment.amount_due"
                  type="number"
                  class="form-control"
                  placeholder="5000"
                  min="1"
                  required
                />
              </div>
              <div class="col-md-3">
                <label class="form-label">Due Type</label>
                <select v-model="installment.due_days_type" class="form-select">
                  <option value="">Select when due</option>
                  <option v-for="opt in dueDaysTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.text }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">
                  {{ installment.due_days_type === 'before_arrival' ? 'Days Before Arrival' : 'Due Days' }}
                </label>
                <input
                  v-model="installment.due_days"
                  type="number"
                  class="form-control"
                  placeholder="e.g., 90"
                  :disabled="installment.due_days_type === 'upon_booking'"
                />
              </div>
            </div>
          </div>

          <!-- Total -->
          <div v-if="form.installments.length > 0" class="mt-3 p-3 bg-primary rounded text-white">
            <div class="d-flex justify-content-between align-items-center">
              <span class="fs-5 fw-semibold">TOTAL</span>
              <span class="fs-4 fw-bold">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Status (only for edit mode) -->
      <div v-if="isEdit" class="card mb-4">
        <div class="card-header d-flex align-items-center gap-2">
          <i class="bi bi-flag text-primary"></i>
          Status
        </div>
        <div class="card-body">
          <label class="form-label">Quotation Status</label>
          <select v-model="form.status" class="form-select">
            <option value="">Select status</option>
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.text }}
            </option>
          </select>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="d-flex justify-content-end gap-2 mt-4">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!canSubmit || saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
          {{ isEdit ? 'Update Quotation' : 'Create Quotation' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useForm } from '@/composables/useForm'
import { useProposalStore } from '@/stores/bushman/proposal-store'
import { format } from 'date-fns'
import axios from 'axios'

interface Installment {
  narration: string
  amount_due: number
  due_days: number | null
  amount_due_type: string
  due_days_type: string
}

interface PipelineInquiry {
  id: number
  code: string
  client?: {
    full_name: string
    country: string
  }
  hunting_details?: {
    areas: string
    species: string
    no_of_days: number
    season: string
    no_of_hunters: number
  }
}

// Props
interface Props {
  proposal?: any
  isEdit?: boolean
  preselectedInquiry?: PipelineInquiry | null
}

const props = withDefaults(defineProps<Props>(), {
  proposal: null,
  isEdit: false,
  preselectedInquiry: null,
})

// Emits
const emit = defineEmits<{
  save: [payload: any]
  cancel: []
}>()

// Store
const proposalStore = useProposalStore()
const saving = computed(() => proposalStore.saving)

// Composables
const { validate, reset } = useForm()

// Refs
const formRef = ref()
const salesInquiryOptions = ref<any[]>([])
const loadingInquiries = ref(false)
const selectedInquiry = ref<any>(null)

// Form data
const form = reactive({
  sales_inquiry_id: null as any,
  confirmation_date: new Date(),
  hunting_license: '',
  remarks: '',
  status: 'pending',
  installments: [] as Installment[],
})

// Computed for date input binding (native HTML date input needs string format)
const confirmationDateString = computed({
  get: () => {
    if (!form.confirmation_date) return ''
    const d = new Date(form.confirmation_date)
    return format(d, 'yyyy-MM-dd')
  },
  set: (val: string) => {
    form.confirmation_date = val ? new Date(val) : new Date()
  },
})

// Options
const dueDaysTypeOptions = [
  { value: 'upon_booking', text: 'Upon Booking' },
  { value: 'before_arrival', text: 'Days Before Arrival' },
  { value: 'upon_completion', text: 'Upon Completion' },
]

const statusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'provision_sales', text: 'Provisional Sale' },
  { value: 'confirmed', text: 'Confirmed' },
  { value: 'declined', text: 'Declined' },
  { value: 'cancelled', text: 'Cancelled' },
  { value: 'completed', text: 'Completed' },
]

const defaultInstallments = [
  {
    narration: 'Deposit Due upon booking',
    amount_due: 5000,
    due_days: 0,
    amount_due_type: 'fixed',
    due_days_type: 'upon_booking',
  },
  {
    narration: '2nd Deposit Due one year prior',
    amount_due: 10000,
    due_days: 365,
    amount_due_type: 'fixed',
    due_days_type: 'before_arrival',
  },
  {
    narration: 'Final Payment Due 90 days prior',
    amount_due: 15000,
    due_days: 90,
    amount_due_type: 'fixed',
    due_days_type: 'before_arrival',
  },
  {
    narration: 'Trophy Deposit Due 45 days prior',
    amount_due: 2500,
    due_days: 45,
    amount_due_type: 'fixed',
    due_days_type: 'before_arrival',
  },
]

// Computed
const totalAmount = computed(() => {
  return form.installments.reduce((sum, inst) => sum + (Number(inst.amount_due) || 0), 0)
})

const canSubmit = computed(() => {
  if (props.isEdit) {
    return true
  }
  // Require sales inquiry and at least one installment
  return !!form.sales_inquiry_id && form.installments.length > 0
})

// Methods
const loadNewInquiries = async () => {
  loadingInquiries.value = true
  try {
    // Fetch only NEW inquiries from the pipeline API
    const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/pipeline?stage=new_inquiries`
    const response = await axios.get(url)

    if (response.data.success) {
      const newInquiries = response.data.data?.new_inquiries || []
      salesInquiryOptions.value = newInquiries.map((item: PipelineInquiry) => ({
        value: item.id,
        text: `${item.code} - ${item.client?.full_name || 'Unknown'}`,
        subtitle: `${item.hunting_details?.areas || 'N/A'} | ${item.hunting_details?.no_of_days || 0} days | ${
          item.hunting_details?.no_of_hunters || 0
        } hunter(s)`,
        selfItem: {
          id: item.id,
          code: item.code,
          client_name: item.client?.full_name,
          country: item.client?.country,
          area: item.hunting_details?.areas,
          species: item.hunting_details?.species,
          no_of_days: item.hunting_details?.no_of_days,
          no_of_hunters: item.hunting_details?.no_of_hunters,
          season: item.hunting_details?.season,
        },
      }))
    }
  } catch (error) {
    console.error('Error loading new inquiries:', error)
  } finally {
    loadingInquiries.value = false
  }
}

const handlePreselectedInquiry = () => {
  const inquiry = props.preselectedInquiry
  if (!inquiry) return

  // Set the selected inquiry details
  selectedInquiry.value = {
    id: inquiry.id,
    code: inquiry.code,
    client_name: inquiry.client?.full_name,
    country: inquiry.client?.country,
    area: inquiry.hunting_details?.areas,
    species: inquiry.hunting_details?.species,
    no_of_days: inquiry.hunting_details?.no_of_days,
    no_of_hunters: inquiry.hunting_details?.no_of_hunters,
    season: inquiry.hunting_details?.season,
  }

  // Create the option object for the select
  const option = {
    value: inquiry.id,
    text: `${inquiry.code} - ${inquiry.client?.full_name || 'Unknown'}`,
    subtitle: `${inquiry.hunting_details?.areas || 'N/A'} | ${inquiry.hunting_details?.no_of_days || 0} days`,
    selfItem: selectedInquiry.value,
  }

  // Add to options if not already there
  const exists = salesInquiryOptions.value.find((opt) => opt.value === inquiry.id)
  if (!exists) {
    salesInquiryOptions.value.unshift(option)
  }

  // Set the form value
  form.sales_inquiry_id = option.value
}

const onInquirySelected = (selected: any) => {
  if (selected?.selfItem) {
    selectedInquiry.value = selected.selfItem
  } else {
    selectedInquiry.value = null
  }
}

// Handler for native select element
const onInquirySelectedFromSelect = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedId = Number(target.value)
  const option = salesInquiryOptions.value.find((opt) => opt.value === selectedId)
  if (option?.selfItem) {
    selectedInquiry.value = option.selfItem
  } else {
    selectedInquiry.value = null
  }
}

const populateForm = () => {
  if (!props.proposal) return

  form.confirmation_date = props.proposal.confirmation_date
    ? new Date(props.proposal.confirmation_date)
    : new Date()
  form.hunting_license = props.proposal.hunting_license || ''
  form.remarks = props.proposal.remarks || ''
  form.status = props.proposal.status || 'pending'

  if (props.proposal.pricing?.installments) {
    form.installments = props.proposal.pricing.installments.map((inst: any) => ({
      narration: inst.narration,
      amount_due: inst.amount_due,
      due_days: inst.due_days,
      amount_due_type: inst.amount_due_type || 'fixed',
      due_days_type: inst.due_days_type || 'upon_booking',
    }))
  }

  if (props.proposal.sales_inquiry) {
    selectedInquiry.value = {
      id: props.proposal.sales_inquiry.id,
      code: props.proposal.sales_inquiry.code,
      client_name: props.proposal.client?.full_name,
      area: props.proposal.hunting_trip?.hunting_area,
      no_of_days: props.proposal.hunting_trip?.no_of_days,
      season: props.proposal.sales_inquiry.season,
    }
  }
}

const addInstallment = () => {
  form.installments.push({
    narration: '',
    amount_due: 0,
    due_days: null,
    amount_due_type: 'fixed',
    due_days_type: 'upon_booking',
  })
}

const removeInstallment = (index: number) => {
  form.installments.splice(index, 1)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const submitForm = async () => {
  const isValid = await validate()
  if (!isValid) return

  const payload: any = {
    confirmation_date: form.confirmation_date
      ? format(new Date(form.confirmation_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    hunting_license: form.hunting_license || null,
    remarks: form.remarks || null,
    installments: form.installments.map((inst) => {
      // Handle select returning object instead of string
      let dueType = inst.due_days_type
      if (typeof dueType === 'object' && dueType !== null) {
        dueType = (dueType as any).value || 'upon_booking'
      }
      let amountType = inst.amount_due_type
      if (typeof amountType === 'object' && amountType !== null) {
        amountType = (amountType as any).value || 'fixed'
      }

      return {
        narration: inst.narration,
        amount_due: Number(inst.amount_due),
        due_days: inst.due_days ? Number(inst.due_days) : null,
        amount_due_type: String(amountType || 'fixed'),
        due_days_type: String(dueType || 'upon_booking'),
      }
    }),
  }

  if (!props.isEdit) {
    payload.sales_inquiry_id = form.sales_inquiry_id?.value || form.sales_inquiry_id
  }

  if (props.isEdit) {
    payload.status = form.status
  }

  emit('save', payload)
}

// Lifecycle
onMounted(() => {
  loadNewInquiries()
  if (props.isEdit && props.proposal) {
    populateForm()
  } else {
    // Start with empty installments for new proposals
    form.installments = []

    // Handle preselected inquiry from pipeline
    if (props.preselectedInquiry) {
      handlePreselectedInquiry()
    }
  }
})
</script>

<style scoped>
.proposal-form {
  max-width: 900px;
  margin: 0 auto;
}

.installment-row {
  background-color: #fafafa;
  transition: background-color 0.2s;
}

.installment-row:hover {
  background-color: #f0f7ff;
}
</style>