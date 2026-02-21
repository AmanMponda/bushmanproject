<template>
  <div class="pipeline-card" @click="$emit('click', item)">
    <div class="card-header-section">
      <div class="card-type-badge" :class="getTypeBadgeClass">
        {{ typeBadgeLabel }}
      </div>
      <div class="card-status-badge" :class="getStatusBadgeClass">
        {{ formatStatus(item.stage || item.status) }}
      </div>
    </div>

    <div class="card-body-section">
      <h6 class="client-name">
        {{ item.client?.full_name || item.entity?.full_name || 'Unknown Client' }}
      </h6>
      <p class="card-code text-muted mb-1">
        {{ item.code || item.confirmation_code || `#${item.id}` }}
      </p>
      <p class="card-date text-muted mb-0">
        <i class="fa fa-calendar me-1"></i>
        {{ formatDate(item.confirmation_date || item.created_date || item.created_at) }}
      </p>
      <p v-if="item.season?.name || item.hunting_details?.season" class="card-season text-muted mb-0">
        <i class="fa fa-leaf me-1"></i>
        {{ item.season?.name || item.hunting_details?.season }}
      </p>
    </div>

    <div class="card-footer-section">
      <div v-if="item.total_amount || item.pricing?.total_amount" class="card-amount">
        <strong>{{ formatCurrency(item.total_amount || item.pricing?.total_amount) }}</strong>
      </div>
      <div class="card-actions">
        <!-- New inquiry without pricing → Create Quotation (+) -->
        <button
          v-if="isNewInquiry"
          class="btn btn-sm btn-outline-primary"
          @click.stop="$emit('createProposal', item)"
          title="Create Quotation"
        >
          <i class="fa fa-plus"></i>
        </button>
        <!-- Provision sales without order → Create Order -->
        <button
          v-if="isProvisionSales && !item.order_id && !item.proposal_id && !item.confirmation_id"
          class="btn btn-sm btn-outline-success"
          @click.stop="$emit('createProposal', item)"
          title="Create Order"
        >
          <i class="fa fa-check-circle"></i>
        </button>
        <!-- View details  -->
        <button
          class="btn btn-sm btn-outline-secondary"
          @click.stop="$emit('view', item)"
          title="View Details"
        >
          <i class="fa fa-eye"></i>
        </button>
        <!-- Edit (only for items with an order/proposal, NOT for confirmed/completed) -->
        <button
          v-if="(item.order_id || item.proposal_id || item.confirmation_id) && !isConfirmedOrCompleted"
          class="btn btn-sm btn-outline-warning"
          @click.stop="$emit('edit', item)"
          title="Edit"
        >
          <i class="fa fa-pen"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface PipelineItem {
  id?: number
  type?: string
  code?: string
  confirmation_code?: string
  stage?: string
  status?: string
  client?: { full_name?: string }
  entity?: { full_name?: string }
  confirmation_date?: string
  created_date?: string
  created_at?: string
  season?: { name?: string }
  hunting_details?: { season?: string }
  pricing?: { total_amount?: number }
  total_amount?: number
  pricings?: Array<{ status?: string; total_amount?: number }>
  pricing_count?: number
  has_pricing?: boolean
  proposal_id?: number
  confirmation_id?: number
  order_id?: number
  order_number?: string
  order_status?: string
}

const props = defineProps<{
  item: PipelineItem
}>()

defineEmits<{
  (e: 'click', item: PipelineItem): void
  (e: 'createProposal', item: PipelineItem): void
  (e: 'view', item: PipelineItem): void
  (e: 'edit', item: PipelineItem): void
}>()

const getTypeBadgeClass = computed(() => {
  const stage = (props.item.stage || '').toLowerCase()
  if (stage === 'provision_sales' || stage === 'confirmed') return 'badge-confirmed'
  if (stage === 'completed') return 'badge-completed'
  if (stage === 'pending') return 'badge-quotation'
  if (stage === 'cancelled') return 'badge-cancelled'
  return props.item.type === 'inquiry' ? 'badge-inquiry' : 'badge-quotation'
})

const typeBadgeLabel = computed(() => {
  const stage = (props.item.stage || '').toLowerCase()
  if (stage === 'provision_sales') return 'Ready for Order'
  if (stage === 'confirmed' || stage === 'approved') return 'Sales Confirmation'
  if (stage === 'completed' || stage === 'fulfilled') return 'Completed'
  if (stage === 'cancelled') return 'Cancelled'
  if (stage === 'pending' || stage === 'submitted') return 'Quotation'
  if (props.item.type === 'inquiry') return 'Inquiry'
  return 'Order'
})

const isNewInquiry = computed(() => {
  const stage = (props.item.stage || '').toLowerCase()
  return (props.item.type === 'inquiry' && (stage === 'new' || stage === '')) && !hasExistingPricing.value
})

const isProvisionSales = computed(() => {
  const stage = (props.item.stage || '').toLowerCase()
  return stage === 'provision_sales'
})

const isConfirmedOrCompleted = computed(() => {
  const stage = (props.item.stage || '').toLowerCase()
  return ['confirmed', 'completed', 'fulfilled', 'approved'].includes(stage)
})

// Check if this inquiry already has a pricing/quotation (locked or otherwise)
const hasExistingPricing = computed(() => {
  const item = props.item as any
  // Check various indicators that a quotation already exists
  if (item.has_pricing || item.has_quotation || item.has_proposal) return true
  if (item.pricings && Array.isArray(item.pricings) && item.pricings.length > 0) return true
  if (item.pricing_count > 0) return true
  // If the stage indicates it's past the inquiry phase, quotation already exists
  const stage = (item.stage || item.status || '').toLowerCase()
  if (['pending', 'provision_sales', 'confirmed', 'completed', 'locked'].includes(stage)) return true
  return false
})

const getStatusBadgeClass = computed(() => {
  const status = (props.item.stage || props.item.status || '').toLowerCase()
  if (status === 'confirmed' || status === 'completed') return 'badge-success'
  if (status === 'pending' || status === 'provision_sales') return 'badge-warning'
  if (status === 'cancelled' || status === 'declined') return 'badge-danger'
  return 'badge-secondary'
})

const formatStatus = (status: string | undefined): string => {
  if (!status) return 'N/A'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const formatDate = (dateStr: string | undefined): string => {
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
}

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
</script>

<style scoped>
.pipeline-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pipeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.card-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-type-badge,
.card-status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-inquiry {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-quotation {
  background: #f3e8ff;
  color: #7c3aed;
}

.badge-success {
  background: #dcfce7;
  color: #15803d;
}

.badge-confirmed {
  background: #d1fae5;
  color: #065f46;
}

.badge-completed {
  background: #dcfce7;
  color: #14532d;
}

.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.badge-warning {
  background: #fef3c7;
  color: #b45309;
}

.badge-danger {
  background: #fee2e2;
  color: #dc2626;
}

.badge-secondary {
  background: #f1f5f9;
  color: #64748b;
}

.card-body-section {
  flex: 1;
}

.client-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
  line-height: 1.3;
}

.card-code,
.card-date,
.card-season {
  font-size: 12px;
  color: #64748b;
}

.card-footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.card-amount {
  font-size: 14px;
  color: #059669;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-actions .btn {
  padding: 4px 8px;
  font-size: 12px;
}
</style>
