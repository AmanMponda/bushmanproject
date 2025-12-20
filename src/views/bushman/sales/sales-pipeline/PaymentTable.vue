<template>
  <VaCard outlined class="payment-table-card">
    <VaCardTitle class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <VaIcon name="payments" color="primary" />
        <span>Payment Schedule</span>
      </div>
      <div class="total-badge">Total: {{ formatCurrency(summary?.total_due || totalAmount) }}</div>
    </VaCardTitle>
    <VaCardContent>
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <VaProgressBar indeterminate />
        <p class="text-center mt-2 text-gray-600">Loading payment status...</p>
      </div>

      <!-- Payment Rows -->
      <div v-else class="payment-rows">
        <div
          v-for="installment in installments"
          :key="installment.id"
          class="payment-row"
          :class="{
            'is-paid': installment.is_paid || installment.payment_status === 'paid',
            'is-partial': installment.payment_status === 'partial',
          }"
        >
          <!-- Status Icon -->
          <div class="status-icon">
            <VaIcon :name="getStatusIcon(installment)" :color="getStatusIconColor(installment)" />
          </div>

          <!-- Installment Details -->
          <div class="installment-details">
            <div class="narration">{{ installment.narration }}</div>
            <div v-if="installment.triggers_stage" class="triggers-badge">
              <VaChip size="small" color="info" flat> → {{ formatStageName(installment.triggers_stage) }} </VaChip>
            </div>
            <!-- Show partial payment info -->
            <div v-if="installment.payment_status === 'partial'" class="partial-info">
              <span class="text-xs text-orange-600">
                Paid: {{ formatCurrency(installment.amount_paid || 0) }} / Remaining:
                {{ formatCurrency(installment.remaining_balance || 0) }}
              </span>
            </div>
            <!-- Show payment count if multiple payments -->
            <div v-if="installment.payments && installment.payments.length > 1" class="payments-count">
              <VaChip size="small" color="secondary" flat> {{ installment.payments.length }} payments </VaChip>
            </div>
          </div>

          <!-- Amount -->
          <div class="amount-section">
            <span class="amount">{{ formatCurrency(installment.amount_due) }}</span>
          </div>

          <!-- Payment Info / Action -->
          <div class="action-section">
            <template v-if="installment.is_paid || installment.payment_status === 'paid'">
              <div class="paid-info">
                <span class="paid-badge">PAID</span>
                <span v-if="installment.paid_at" class="paid-date">
                  {{ formatDate(installment.paid_at) }}
                </span>
                <VaButton
                  v-if="allowUnpay"
                  preset="plain"
                  size="small"
                  color="secondary"
                  icon="undo"
                  title="Reverse All Payments"
                  @click="$emit('unpay', installment)"
                />
              </div>
            </template>
            <template v-else-if="installment.payment_status === 'partial'">
              <div class="partial-actions">
                <span class="partial-badge">PARTIAL</span>
                <VaButton size="small" color="warning" @click="$emit('record-payment', installment)">
                  Add Payment
                </VaButton>
                <VaButton
                  v-if="allowUnpay"
                  preset="plain"
                  size="small"
                  color="secondary"
                  icon="undo"
                  title="Reverse All Payments"
                  @click="$emit('unpay', installment)"
                />
              </div>
            </template>
            <template v-else>
              <VaButton size="small" color="primary" @click="$emit('record-payment', installment)">
                Record Payment
              </VaButton>
            </template>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div v-if="summary" class="payment-summary">
        <div class="summary-item paid">
          <VaIcon name="check_circle" color="success" size="small" />
          <span>Paid: {{ formatCurrency(summary.total_paid) }}</span>
        </div>
        <div class="summary-divider">|</div>
        <div class="summary-item remaining">
          <VaIcon name="pending" color="warning" size="small" />
          <span>Remaining: {{ formatCurrency(summary.total_unpaid) }}</span>
        </div>
        <div class="summary-divider">|</div>
        <div class="summary-item count">
          <span>
            {{ summary.fully_paid_count || summary.paid_count }}/{{ totalInstallmentCount }} Fully Paid
            <template v-if="summary.partial_paid_count"> ({{ summary.partial_paid_count }} partial) </template>
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="summary" class="payment-progress">
        <VaProgressBar
          :model-value="paymentPercentage"
          :color="paymentPercentage === 100 ? 'success' : 'primary'"
          show-percent
        />
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface Payment {
  id: number
  amount: number
  payment_reference?: string
  payment_method?: string
  paid_at: string
}

export interface Installment {
  id: number
  narration: string
  amount_due: number
  installment_type?: string
  triggers_stage?: string | null
  is_paid: boolean
  payment_status?: 'paid' | 'partial' | 'unpaid'
  paid_at?: string | null
  amount_paid?: number | null
  remaining_balance?: number | null
  payment_reference?: string | null
  paid_by?: string | null
  payments?: Payment[]
}

interface PaymentSummary {
  total_due: number
  total_paid: number
  total_unpaid: number
  paid_count?: number
  unpaid_count?: number
  fully_paid_count?: number
  partial_paid_count?: number
}

export default defineComponent({
  name: 'PaymentTable',
  props: {
    installments: {
      type: Array as PropType<Installment[]>,
      default: () => [],
    },
    summary: {
      type: Object as PropType<PaymentSummary | null>,
      default: null,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    allowUnpay: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['record-payment', 'unpay'],
  computed: {
    paymentPercentage(): number {
      if (!this.summary || this.summary.total_due === 0) return 0
      return Math.round((this.summary.total_paid / this.summary.total_due) * 100)
    },
    totalInstallmentCount(): number {
      if (!this.summary) return this.installments.length
      return (
        (this.summary.fully_paid_count || this.summary.paid_count || 0) +
        (this.summary.partial_paid_count || 0) +
        (this.summary.unpaid_count || 0)
      )
    },
  },
  methods: {
    getStatusIcon(installment: Installment): string {
      if (installment.is_paid || installment.payment_status === 'paid') {
        return 'check_circle'
      }
      if (installment.payment_status === 'partial') {
        return 'hourglass_top'
      }
      return 'radio_button_unchecked'
    },

    getStatusIconColor(installment: Installment): string {
      if (installment.is_paid || installment.payment_status === 'paid') {
        return 'success'
      }
      if (installment.payment_status === 'partial') {
        return 'warning'
      }
      return 'secondary'
    },

    formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    },

    formatDate(dateString: string): string {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      } catch {
        return dateString
      }
    },

    formatStageName(stage: string): string {
      const names: Record<string, string> = {
        provision_sales: 'Provision Sales',
        confirmed: 'Confirmed',
        completed: 'Completed',
      }
      return names[stage] || stage.replace(/_/g, ' ')
    },
  },
})
</script>

<style scoped>
.payment-table-card {
  margin-bottom: 1.5rem;
}

.total-badge {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 4px;
}

.loading-state {
  padding: 40px 20px;
}

.payment-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.payment-row:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.payment-row.is-paid {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.status-icon {
  flex-shrink: 0;
}

.installment-details {
  flex: 1;
  min-width: 0;
}

.narration {
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.triggers-badge {
  margin-top: 4px;
}

.amount-section {
  flex-shrink: 0;
  text-align: right;
}

.amount {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
}

.action-section {
  flex-shrink: 0;
  min-width: 150px;
  text-align: right;
}

.paid-info {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.paid-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 4px;
}

.paid-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.payment-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  margin-top: 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #4b5563;
}

.summary-item.paid {
  color: #16a34a;
  font-weight: 500;
}

.summary-item.remaining {
  color: #d97706;
  font-weight: 500;
}

.summary-divider {
  color: #d1d5db;
}

.payment-progress {
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .payment-row {
    flex-wrap: wrap;
  }

  .installment-details {
    flex-basis: calc(100% - 50px);
    order: 1;
  }

  .status-icon {
    order: 0;
  }

  .amount-section {
    order: 2;
    flex-basis: 50%;
  }

  .action-section {
    order: 3;
    flex-basis: 50%;
    min-width: auto;
  }

  .payment-summary {
    flex-wrap: wrap;
    gap: 8px;
  }

  .summary-divider {
    display: none;
  }
}
</style>
