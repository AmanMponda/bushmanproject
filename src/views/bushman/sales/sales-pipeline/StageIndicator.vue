<template>
  <div class="stage-indicator">
    <!-- Stage Progress Bar -->
    <div class="stage-progress">
      <div
        v-for="(stage, index) in stages"
        :key="stage.value"
        class="stage-step"
        :class="{
          'is-active': currentStage === stage.value,
          'is-completed': isStageCompleted(stage.value),
          'is-cancelled': currentStage === 'cancelled',
        }"
      >
        <div class="stage-dot" :style="{ backgroundColor: getStageColor(stage.value) }">
          <i v-if="isStageCompleted(stage.value)" class="bi bi-check text-white"></i>
          <i v-else-if="currentStage === 'cancelled'" class="bi bi-x text-white"></i>
          <span v-else class="stage-number">{{ index + 1 }}</span>
        </div>
        <div class="stage-label">{{ stage.label }}</div>
        <div
          v-if="index < stages.length - 1"
          class="stage-line"
          :class="{ 'is-filled': isStageCompleted(stage.value) }"
        ></div>
      </div>
    </div>

    <!-- Payment Indicators -->
    <div v-if="installments && installments.length > 0" class="payment-indicators">
      <div
        v-for="installment in mainInstallments"
        :key="installment.id"
        class="payment-indicator"
        :class="{ 'is-paid': installment.is_paid }"
        :title="installment.narration"
      >
        <i
          :class="[
            'bi',
            installment.is_paid ? 'bi-check-circle-fill text-success' : 'bi-circle text-secondary'
          ]"
        ></i>
        <span class="payment-label">{{ getShortLabel(installment) }}</span>
      </div>
    </div>

    <!-- Cancelled Overlay -->
    <div v-if="currentStage === 'cancelled'" class="cancelled-overlay">
      <span class="badge bg-danger">CANCELLED</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import type { PropType } from 'vue'

interface Installment {
  id: number
  narration: string
  installment_type?: string
  triggers_stage?: string | null
  is_paid: boolean
  paid_at?: string | null
  amount_paid?: number | null
}

export default defineComponent({
  name: 'StageIndicator',
  props: {
    currentStage: {
      type: String,
      required: true,
    },
    installments: {
      type: Array as PropType<Installment[]>,
      default: () => [],
    },
  },
  setup(props) {
    const stages = [
      { value: 'new_inquiries', label: 'NEW' },
      { value: 'pending', label: 'PEND' },
      { value: 'provision_sales', label: 'PROV' },
      { value: 'confirmed', label: 'CONF' },
      { value: 'completed', label: 'COMP' },
    ]

    const stageColors: Record<string, string> = {
      new_inquiries: '#E3F2FD',
      pending: '#FFF9C4',
      provision_sales: '#FFE0B2',
      confirmed: '#C8E6C9',
      cancelled: '#FFCDD2',
      completed: '#E1BEE7',
    }

    const stageActiveColors: Record<string, string> = {
      new_inquiries: '#2196F3',
      pending: '#FFC107',
      provision_sales: '#FF9800',
      confirmed: '#4CAF50',
      cancelled: '#F44336',
      completed: '#9C27B0',
    }

    const stageOrder = computed(() => stages.map((s) => s.value))

    const currentStageIndex = computed(() => stageOrder.value.indexOf(props.currentStage))

    const mainInstallments = computed(() => {
      // Filter to show only the main payment-triggering installments
      return props.installments.filter((i) => {
        const type = i.installment_type?.toLowerCase() || ''
        const narration = i.narration.toLowerCase()
        return (
          type.includes('deposit') ||
          type.includes('final') ||
          type.includes('trophy') ||
          narration.includes('deposit') ||
          narration.includes('final') ||
          narration.includes('trophy')
        )
      })
    })

    const isStageCompleted = (stageValue: string): boolean => {
      if (props.currentStage === 'cancelled') return false
      const stageIndex = stageOrder.value.indexOf(stageValue)
      return stageIndex < currentStageIndex.value
    }

    const getStageColor = (stageValue: string): string => {
      if (props.currentStage === 'cancelled') {
        return stageActiveColors.cancelled
      }
      if (isStageCompleted(stageValue) || props.currentStage === stageValue) {
        return stageActiveColors[stageValue] || stageActiveColors.pending
      }
      return '#e0e0e0'
    }

    const getShortLabel = (installment: Installment): string => {
      const narration = installment.narration.toLowerCase()
      if (narration.includes('deposit') && narration.includes('booking')) {
        return 'Deposit'
      }
      if (narration.includes('2nd') || narration.includes('year prior')) {
        return '2nd'
      }
      if (narration.includes('final')) {
        return 'Final'
      }
      if (narration.includes('trophy')) {
        return 'Trophy'
      }
      return installment.narration.substring(0, 6)
    }

    return {
      stages,
      mainInstallments,
      isStageCompleted,
      getStageColor,
      getShortLabel,
    }
  },
})
</script>

<style scoped>
.stage-indicator {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  position: relative;
}

.stage-progress {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stage-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.stage-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: white;
  z-index: 1;
  transition: all 0.3s ease;
}

.stage-number {
  color: white;
}

.stage-label {
  margin-top: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
}

.stage-step.is-active .stage-label {
  font-weight: 700;
  color: #1f2937;
}

.stage-step.is-completed .stage-label {
  color: #4caf50;
}

.stage-line {
  position: absolute;
  top: 16px;
  left: 50%;
  width: 100%;
  height: 3px;
  background: #e0e0e0;
  z-index: 0;
}

.stage-line.is-filled {
  background: #4caf50;
}

.stage-step:last-child .stage-line {
  display: none;
}

.payment-indicators {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.payment-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.payment-label {
  font-size: 0.65rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-indicator.is-paid .payment-label {
  color: #4caf50;
  font-weight: 600;
}

.cancelled-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 4px;
}

.stage-step.is-cancelled .stage-dot {
  background: #f44336 !important;
}

.stage-step.is-cancelled .stage-label {
  color: #f44336;
}
</style>
