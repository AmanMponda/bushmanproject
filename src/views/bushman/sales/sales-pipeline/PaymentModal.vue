<template>
  <div
    class="modal fade"
    :class="{ show: modelValue, 'd-block': modelValue }"
    tabindex="-1"
    @click.self="handleCancel"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Record Payment</h5>
          <button type="button" class="btn-close" @click="handleCancel"></button>
        </div>
        <div class="modal-body">
          <div class="payment-modal-content">
            <!-- Installment Info -->
            <div class="installment-info mb-4">
              <div class="info-header">
                <i class="bi bi-receipt text-primary"></i>
                <span>{{ installment?.narration || 'Payment' }}</span>
              </div>
              <div class="info-amount">
                <span class="label">Amount Due:</span>
                <span class="amount">{{ formatCurrency(installment?.amount_due || 0) }}</span>
              </div>
              <!-- Show partial payment info if applicable -->
              <div v-if="hasPartialPayment" class="partial-payment-info mt-3">
                <div class="d-flex justify-content-between small">
                  <span class="text-muted">Already Paid:</span>
                  <span class="text-success fw-medium">{{ formatCurrency(installment?.amount_paid || 0) }}</span>
                </div>
                <div class="d-flex justify-content-between small mt-1">
                  <span class="text-muted">Remaining Balance:</span>
                  <span class="text-warning fw-semibold">{{ formatCurrency(remainingBalance) }}</span>
                </div>
              </div>
            </div>

            <!-- Stage Change Warning -->
            <div v-if="triggersStage && willCompleteInstallment" class="alert alert-warning d-flex align-items-center mb-3" role="alert">
              <i class="bi bi-lightning-fill me-2"></i>
              <span>
                This payment will move the sale to
                <strong>{{ formatStageName(triggersStage) }}</strong> stage
              </span>
            </div>

            <!-- Partial Payment Notice -->
            <div v-if="!willCompleteInstallment && form.amount_paid" class="alert alert-info d-flex align-items-center mb-3" role="alert">
              <i class="bi bi-info-circle-fill me-2"></i>
              <span>This is a partial payment.</span>
            </div>

            <!-- Payment Form -->
            <div class="payment-form">
              <div class="mb-3">
                <label class="form-label">Amount Paid</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    v-model.number="form.amount_paid"
                    type="number"
                    class="form-control"
                    placeholder="Enter amount"
                    step="0.01"
                  />
                </div>
                <div v-if="form.amount_paid !== null && form.amount_paid <= 0" class="invalid-feedback d-block">
                  Amount must be positive
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Payment Reference</label>
                <input
                  v-model="form.payment_reference"
                  type="text"
                  class="form-control"
                  placeholder="e.g., TRX-2025-001"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Payment Date</label>
                <input v-model="formattedDate" type="date" class="form-control" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleCancel">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!isFormValid || loading"
            @click="handleSubmit"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Record Payment
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="modelValue" class="modal-backdrop fade show"></div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, watch } from 'vue'
import type { PropType } from 'vue'

interface Installment {
  id: number
  narration: string
  amount_due: number
  amount_paid?: number
  remaining_balance?: number
  payment_status?: string
  installment_type?: string
  triggers_stage?: string | null
}

export default defineComponent({
  name: 'PaymentModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    installment: {
      type: Object as PropType<Installment | null>,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const form = reactive({
      amount_paid: null as number | null,
      payment_reference: '',
      paid_at: new Date(),
    })

    const isFormValid = computed(() => {
      return !!form.amount_paid && form.amount_paid > 0
    })

    const hasPartialPayment = computed(() => {
      if (!props.installment) return false
      return props.installment.payment_status === 'partial' || (props.installment.amount_paid || 0) > 0
    })

    const remainingBalance = computed(() => {
      if (!props.installment) return 0
      if (props.installment.remaining_balance !== undefined && props.installment.remaining_balance !== null) {
        return props.installment.remaining_balance
      }
      return (props.installment.amount_due || 0) - (props.installment.amount_paid || 0)
    })

    const willCompleteInstallment = computed(() => {
      if (!props.installment || !form.amount_paid) return false
      return form.amount_paid >= remainingBalance.value
    })

    const triggersStage = computed(() => {
      if (!props.installment) return null

      // Check explicit triggers_stage from API
      if (props.installment.triggers_stage) {
        return props.installment.triggers_stage
      }

      // Determine from narration/type
      const narration = props.installment.narration?.toLowerCase() || ''
      const type = props.installment.installment_type?.toLowerCase() || ''

      if (type.includes('deposit_booking') || (narration.includes('deposit') && narration.includes('booking'))) {
        return 'provision_sales'
      }
      if (type.includes('final_payment') || (narration.includes('final') && narration.includes('90'))) {
        return 'confirmed'
      }
      if (type.includes('trophy_deposit') || (narration.includes('trophy') && narration.includes('45'))) {
        return 'completed'
      }

      return null
    })

    const formattedDate = computed({
      get: () => {
        const date = form.paid_at
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      },
      set: (value: string) => {
        form.paid_at = new Date(value)
      },
    })

    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal && props.installment) {
          // Reset form without pre-filling amount
          form.amount_paid = null
          form.payment_reference = ''
          form.paid_at = new Date()
        }
      },
    )

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    const formatStageName = (stage: string): string => {
      const names: Record<string, string> = {
        pending: 'PENDING',
        provision_sales: 'PROVISION SALES',
        confirmed: 'CONFIRMED',
        completed: 'COMPLETED',
      }
      return names[stage] || stage.replace(/_/g, ' ').toUpperCase()
    }

    const handleCancel = () => {
      emit('update:modelValue', false)
    }

    const handleSubmit = () => {
      if (!props.installment || !isFormValid.value) return

      const payload = {
        installment_id: props.installment.id,
        amount_paid: form.amount_paid!,
        payment_reference: form.payment_reference || undefined,
        paid_at: form.paid_at ? formatDateForApi(form.paid_at) : undefined,
      }

      emit('submit', payload)
    }

    const formatDateForApi = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      form,
      isFormValid,
      hasPartialPayment,
      remainingBalance,
      willCompleteInstallment,
      triggersStage,
      formattedDate,
      formatCurrency,
      formatStageName,
      handleCancel,
      handleSubmit,
    }
  },
})
</script>

<style scoped>
.modal.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  max-width: 600px;
}

.installment-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 12px;
}

.info-header i {
  font-size: 1.25rem;
}

.info-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-amount .label {
  color: #6c757d;
}

.info-amount .amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #212529;
}

.partial-payment-info {
  border-top: 1px solid #dee2e6;
  padding-top: 12px;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
}

.modal-backdrop.fade {
  opacity: 0;
}

.modal-backdrop.show {
  opacity: 0.5;
}

.modal {
  z-index: 1055;
}
</style>
