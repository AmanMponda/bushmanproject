<template>
  <div class="billing-schedule-timeline">
    <!-- Timeline Header -->
    <div class="timeline-header">
      <h5>Payment Schedule</h5>
      <div class="header-stats">
        <span class="stat pending">
          <i class="fas fa-clock"></i>
          {{ pendingCount }} Pending
        </span>
        <span class="stat due">
          <i class="fas fa-exclamation-circle"></i>
          {{ dueCount }} Due
        </span>
        <span class="stat paid">
          <i class="fas fa-check-circle"></i>
          {{ paidCount }} Paid
        </span>
        <span class="stat total" v-if="totalAmount">
          <i class="fas fa-dollar-sign"></i>
          {{ formatCurrency(totalAmount) }}
        </span>
      </div>
    </div>

    <!-- Timeline Items -->
    <div class="timeline-items">
      <div
        v-for="(schedule, index) in sortedSchedules"
        :key="schedule.id || index"
        :class="['timeline-item', `status-${schedule.status.toLowerCase()}`]"
      >
        <!-- Marker -->
        <div class="timeline-marker">
          <i :class="getStatusIcon(schedule.status)"></i>
        </div>

        <!-- Content -->
        <div class="timeline-content">
          <div class="timeline-header-row">
            <div class="sequence-and-date">
              <span class="sequence">{{ schedule.sequence }}</span>
              <span class="due-date">{{ formatDate(schedule.due_date) }}</span>
            </div>
            <div class="amount-and-status">
              <span class="amount">
                <strong>{{ formatCurrency(schedule.amount) }}</strong>
                <span v-if="schedule.amount_type === 'PERCENTAGE'" class="percentage">
                  ({{ schedule.percentage }}%)
                </span>
              </span>
              <span :class="['status-badge', `badge-${schedule.status.toLowerCase()}`]">
                {{ schedule.status }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <p v-if="schedule.description" class="timeline-description">
            {{ schedule.description }}
          </p>

          <!-- Payment Details -->
          <div v-if="schedule.paid_date" class="payment-details">
            <span class="paid-date">
              <i class="fas fa-calendar-check"></i>
              Paid on {{ formatDate(schedule.paid_date) }}
            </span>
            <span v-if="schedule.paid_amount" class="paid-amount">
              <i class="fas fa-cash"></i>
              {{ formatCurrency(schedule.paid_amount) }}
            </span>
          </div>

          <!-- Days Overdue -->
          <div v-if="isOverdue(schedule)" class="overdue-badge">
            <i class="fas fa-exclamation-triangle"></i>
            {{ daysOverdue(schedule) }} days overdue
          </div>

          <!-- Notes -->
          <p v-if="schedule.notes" class="timeline-notes">
            <i class="fas fa-sticky-note"></i>
            {{ schedule.notes }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!schedules || schedules.length === 0" class="empty-state">
      <i class="fas fa-calendar-times"></i>
      <p>No billing schedules configured</p>
    </div>

    <!-- Summary -->
    <div v-if="schedules && schedules.length > 0" class="timeline-summary">
      <div class="summary-row">
        <span>Total Amount:</span>
        <strong>{{ formatCurrency(totalAmount) }}</strong>
      </div>
      <div v-if="paidAmount > 0" class="summary-row">
        <span>Paid Amount:</span>
        <strong>{{ formatCurrency(paidAmount) }}</strong>
      </div>
      <div v-if="remainingAmount > 0" class="summary-row remaining">
        <span>Remaining:</span>
        <strong>{{ formatCurrency(remainingAmount) }}</strong>
      </div>
      <div v-if="progress > 0" class="summary-row progress-row">
        <span>Progress:</span>
        <div class="progress-bar-small">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface BillingSchedule {
  id?: string | number
  sequence: number
  due_date: string
  amount: number
  amount_type: string
  percentage?: number
  description?: string
  status: string
  paid_date?: string | null
  paid_amount?: number
  notes?: string
}

interface Props {
  schedules?: BillingSchedule[]
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'USD'
})

// Sorted schedules by sequence
const sortedSchedules = computed(() => {
  return props.schedules ? [...props.schedules].sort((a, b) => a.sequence - b.sequence) : []
})

// Statistics
const pendingCount = computed(() => sortedSchedules.value.filter(s => s.status === 'PENDING').length)
const dueCount = computed(() => sortedSchedules.value.filter(s => s.status === 'DUE').length)
const paidCount = computed(() => sortedSchedules.value.filter(s => s.status === 'PAID').length)

// Amount calculations
const totalAmount = computed(() => {
  return sortedSchedules.value.reduce((sum, s) => sum + s.amount, 0)
})

const paidAmount = computed(() => {
  return sortedSchedules.value
    .filter(s => s.paid_amount)
    .reduce((sum, s) => sum + (s.paid_amount || 0), 0)
})

const remainingAmount = computed(() => totalAmount.value - paidAmount.value)

const progress = computed(() => {
  if (totalAmount.value === 0) return 0
  return Math.round((paidAmount.value / totalAmount.value) * 100)
})

// Methods
const formatDate = (date: string | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency
  }).format(amount)
}

const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    PENDING: 'fas fa-hourglass-half',
    DUE: 'fas fa-exclamation-circle',
    PAID: 'fas fa-check-circle',
    OVERDUE: 'fas fa-exclamation-triangle',
    WAIVED: 'fas fa-minus-circle'
  }
  return iconMap[status] || 'fas fa-circle'
}

const isOverdue = (schedule: BillingSchedule): boolean => {
  if (schedule.status === 'PAID' || schedule.status === 'WAIVED') return false
  return new Date(schedule.due_date) < new Date()
}

const daysOverdue = (schedule: BillingSchedule): number => {
  const today = new Date()
  const dueDate = new Date(schedule.due_date)
  const diffTime = today.getTime() - dueDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
</script>

<style scoped lang="scss">
.billing-schedule-timeline {
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;

  .timeline-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;

    h5 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .header-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .stat {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;

        i {
          font-size: 11px;
        }

        &.pending {
          background-color: #fff3cd;
          color: #856404;
        }

        &.due {
          background-color: #f8d7da;
          color: #721c24;
        }

        &.paid {
          background-color: #d4edda;
          color: #155724;
        }

        &.total {
          background-color: #d1ecf1;
          color: #0c5460;
          font-weight: 700;
        }
      }
    }
  }

  .timeline-items {
    position: relative;
    padding: 0;

    &::before {
      content: '';
      position: absolute;
      left: 16px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(
        to bottom,
        #3b82f6 0%,
        #3b82f6 25%,
        #10b981 25%,
        #10b981 50%,
        #ffc107 50%,
        #ffc107 75%,
        #e9ecef 75%,
        #e9ecef 100%
      );
    }

    .timeline-item {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 6px;
      background: #f9f9f9;
      border-left: 3px solid #e9ecef;
      transition: all 0.3s ease;

      &:hover {
        background: #f5f5f5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      &.status-pending {
        border-left-color: #ffc107;
        background: #fffbf0;
      }

      &.status-due {
        border-left-color: #ff6b6b;
        background: #fff5f5;
      }

      &.status-paid {
        border-left-color: #10b981;
        background: #f0fdf4;
      }

      &.status-overdue {
        border-left-color: #ff3838;
        background: #ffe0e0;
      }

      &.status-waived {
        border-left-color: #6c757d;
        background: #f5f5f5;
      }

      .timeline-marker {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: white;
        border: 2px solid #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-top: 2px;

        i {
          color: #666;
        }
      }

      &.status-pending .timeline-marker {
        background: #fff9e6;
        border-color: #ffc107;
        i {
          color: #ffc107;
        }
      }

      &.status-due .timeline-marker {
        background: #ffe0e0;
        border-color: #ff6b6b;
        i {
          color: #ff6b6b;
        }
      }

      &.status-paid .timeline-marker {
        background: #e6f7ed;
        border-color: #10b981;
        i {
          color: #10b981;
        }
      }

      &.status-overdue .timeline-marker {
        background: #ffe0e0;
        border-color: #ff3838;
        i {
          color: #ff3838;
        }
      }

      &.status-waived .timeline-marker {
        background: #f5f5f5;
        border-color: #999;
        i {
          color: #999;
        }
      }

      .timeline-content {
        flex: 1;
        min-width: 0;

        .timeline-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 10px;

          .sequence-and-date {
            display: flex;
            gap: 10px;
            align-items: center;

            .sequence {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #e9ecef;
              color: #495057;
              font-weight: 600;
              font-size: 12px;
            }

            .due-date {
              font-size: 13px;
              font-weight: 600;
              color: #333;
            }
          }

          .amount-and-status {
            display: flex;
            gap: 12px;
            align-items: center;

            .amount {
              font-size: 14px;
              font-weight: 600;
              color: #333;

              .percentage {
                font-size: 11px;
                color: #666;
                margin-left: 4px;
              }
            }

            .status-badge {
              padding: 4px 8px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;

              &.badge-pending {
                background: #fff3cd;
                color: #856404;
              }

              &.badge-due {
                background: #f8d7da;
                color: #721c24;
              }

              &.badge-paid {
                background: #d4edda;
                color: #155724;
              }

              &.badge-overdue {
                background: #ff6b6b;
                color: white;
              }

              &.badge-waived {
                background: #e2e3e5;
                color: #383d41;
              }
            }
          }
        }

        .timeline-description {
          margin: 8px 0;
          font-size: 13px;
          color: #666;
        }

        .payment-details {
          display: flex;
          gap: 15px;
          font-size: 12px;
          margin: 8px 0;
          padding: 8px 0;
          border-top: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #495057;

            i {
              font-size: 11px;
            }
          }
        }

        .overdue-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: #ffe0e0;
          color: #cc0000;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;

          i {
            font-size: 11px;
          }
        }

        .timeline-notes {
          margin: 8px 0 0 0;
          padding: 8px 10px;
          background: #f5f5f5;
          border-left: 3px solid #ffc107;
          border-radius: 3px;
          font-size: 12px;
          color: #666;

          i {
            margin-right: 5px;
            color: #ffc107;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;

    i {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.5;
    }

    p {
      margin: 10px 0 0 0;
      font-size: 14px;
    }
  }

  .timeline-summary {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #f0f0f0;
    background: #f9f9f9;
    padding: 15px;
    border-radius: 6px;

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;

      span {
        color: #666;
      }

      strong {
        color: #333;
        font-weight: 600;
      }

      &.remaining {
        color: #d32f2f;
        font-weight: 600;

        strong {
          color: #d32f2f;
        }
      }

      &.progress-row {
        align-items: center;
        gap: 10px;

        span {
          flex-shrink: 0;
        }

        .progress-bar-small {
          flex: 1;
          height: 18px;
          background: #e9ecef;
          border-radius: 9px;
          overflow: hidden;
          position: relative;

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #10b981);
            transition: width 0.3s ease;
          }

          .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 11px;
            font-weight: 600;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
        }
      }
    }
  }
}
</style>
