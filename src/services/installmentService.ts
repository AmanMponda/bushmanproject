/**
 * Installment Service
 *
 * DEPRECATED: Payment plan templates are now fetched from the backend
 * via the `installment-setups/templates` API endpoint.
 *
 * See: order-store.ts → fetchPaymentPlanTemplates()
 * Admin UI: ManageInstallmentSetups.vue (Module Settings → Installment Setups)
 *
 * This file only contains shared TypeScript interfaces and utility helpers.
 * All hardcoded template constants have been removed.
 */

// ─── Shared Interfaces ───

export interface InstallmentStage {
  sequenceNo: number
  name: string
  narration: string
  amountDue: number
  amountDueType: 'FIXED' | 'PERCENTAGE'
  dueDays: number
  dueDaysType: 'AFTER_INVOICE' | 'AFTER_DELIVERY' | 'AFTER_CONFIRMATION'
  isDeposit: boolean
  isTrophyDeposit?: boolean
  description: string
}

export interface PaymentPlanTemplate {
  id: string
  name: string
  description: string
  stages: InstallmentStage[]
}

/**
 * Calculate due date for an installment
 * @param baseDate - Base date (invoice, delivery, or confirmation date)
 * @param dueDays - Number of days for payment
 * @param dueType - Type of base date (AFTER_INVOICE, AFTER_DELIVERY, AFTER_CONFIRMATION)
 * @returns Calculated due date
 */
export function calculateDueDate(
  baseDate: Date,
  dueDays: number,
  dueType: 'AFTER_INVOICE' | 'AFTER_DELIVERY' | 'AFTER_CONFIRMATION'
): Date {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + dueDays)
  return date
}

/**
 * Validate installment setup
 * Ensures installments total to 100% (if using percentages) or validates amounts
 */
export function validateInstallmentSetup(installments: InstallmentStage[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (installments.length === 0) {
    errors.push('At least one installment must be defined')
    return { valid: false, errors }
  }

  // Check if using percentages
  const hasPercentages = installments.some((i) => i.amountDueType === 'PERCENTAGE')
  const hasFixedAmounts = installments.some((i) => i.amountDueType === 'FIXED')

  if (hasPercentages && hasFixedAmounts) {
    errors.push('Cannot mix FIXED and PERCENTAGE amount types in the same payment plan')
  }

  if (hasPercentages) {
    const totalPercentage = installments.reduce((sum, i) => {
      return sum + (i.amountDueType === 'PERCENTAGE' ? i.amountDue : 0)
    }, 0)

    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Percentages must total 100% (current total: ${totalPercentage.toFixed(2)}%)`)
    }
  }

  if (hasFixedAmounts) {
    const totalAmount = installments.reduce((sum, i) => {
      return sum + (i.amountDueType === 'FIXED' ? i.amountDue : 0)
    }, 0)

    if (totalAmount <= 0) {
      errors.push('Total fixed amounts must be greater than 0')
    }
  }

  // Check sequence numbers are correct
  const sequences = installments.map((i) => i.sequenceNo).sort((a, b) => a - b)
  for (let i = 0; i < sequences.length; i++) {
    if (sequences[i] !== i + 1) {
      errors.push('Installment sequence numbers must be consecutive starting from 1')
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format installment for display
 */
export function formatInstallmentDisplay(
  installment: InstallmentStage,
  totalAmount?: number,
  currencySymbol: string = '$'
): string {
  const amount =
    installment.amountDueType === 'PERCENTAGE'
      ? `${installment.amountDue}%`
      : `${currencySymbol}${installment.amountDue.toFixed(2)}`

  return `${installment.sequenceNo}. ${installment.name} - ${amount}`
}
