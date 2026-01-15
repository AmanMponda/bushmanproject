/**
 * Installment Service
 * Manages payment plan installment templates and calculations
 */

export interface InstallmentStage {
  sequenceNo: number
  name: string
  narration: string
  amountDue: number
  amountDueType: 'FIXED' | 'PERCENTAGE'
  dueDays: number
  dueDaysType: 'AFTER_INVOICE' | 'AFTER_DELIVERY' | 'AFTER_CONFIRMATION'
  isDeposit: boolean
  description: string
}

export interface PaymentPlanTemplate {
  id: string
  name: string
  description: string
  stages: InstallmentStage[]
}

/**
 * Standard 4-Stage Payment Plan Template
 * Used for trophy hunt bookings with structured payment phases
 */
export const FOUR_STAGE_PAYMENT_PLAN: PaymentPlanTemplate = {
  id: 'four_stage',
  name: '4-Stage Payment Plan',
  description: 'Standard 4-stage payment plan for trophy hunt bookings',
  stages: [
    {
      sequenceNo: 1,
      name: 'Total Deposit',
      narration: 'Initial deposit upon booking confirmation',
      amountDue: 0, // To be set as percentage or fixed amount
      amountDueType: 'PERCENTAGE',
      dueDays: 0,
      dueDaysType: 'AFTER_CONFIRMATION',
      isDeposit: true,
      description: 'Due immediately upon booking confirmation. This secures your booking slot.',
    },
    {
      sequenceNo: 2,
      name: '2nd Deposit',
      narration: 'Second deposit payment',
      amountDue: 0, // To be set as percentage or fixed amount
      amountDueType: 'PERCENTAGE',
      dueDays: 365, // One year prior to trip
      dueDaysType: 'AFTER_CONFIRMATION',
      isDeposit: true,
      description: 'Due one year prior to departure. This confirms your commitment and helps with planning.',
    },
    {
      sequenceNo: 3,
      name: 'Final Payment',
      narration: 'Final payment due before departure',
      amountDue: 0, // To be set as percentage or fixed amount
      amountDueType: 'PERCENTAGE',
      dueDays: 90,
      dueDaysType: 'AFTER_DELIVERY',
      isDeposit: false,
      description: 'Due 90 days prior to your trip departure. This is the main payment for the hunt.',
    },
    {
      sequenceNo: 4,
      name: 'Trophy Deposit',
      narration: 'Trophy mounting and shipping deposit',
      amountDue: 0, // To be set as percentage or fixed amount
      amountDueType: 'PERCENTAGE',
      dueDays: 45,
      dueDaysType: 'AFTER_CONFIRMATION',
      isDeposit: true,
      description: 'Due 45 days prior to departure. Covers trophy mounting, shipping, and insurance costs.',
    },
  ],
}

/**
 * Alternative 3-Stage Payment Plan
 * Simpler payment structure
 */
export const THREE_STAGE_PAYMENT_PLAN: PaymentPlanTemplate = {
  id: 'three_stage',
  name: '3-Stage Payment Plan',
  description: 'Simplified 3-stage payment plan',
  stages: [
    {
      sequenceNo: 1,
      name: 'Deposit',
      narration: 'Initial deposit',
      amountDue: 30,
      amountDueType: 'PERCENTAGE',
      dueDays: 0,
      dueDaysType: 'AFTER_CONFIRMATION',
      isDeposit: true,
      description: 'Due upon booking.',
    },
    {
      sequenceNo: 2,
      name: 'Second Payment',
      narration: 'Second payment',
      amountDue: 30,
      amountDueType: 'PERCENTAGE',
      dueDays: 180,
      dueDaysType: 'AFTER_CONFIRMATION',
      isDeposit: false,
      description: 'Due 6 months before departure.',
    },
    {
      sequenceNo: 3,
      name: 'Final Payment',
      narration: 'Final payment',
      amountDue: 40,
      amountDueType: 'PERCENTAGE',
      dueDays: 30,
      dueDaysType: 'AFTER_DELIVERY',
      isDeposit: false,
      description: 'Due 30 days before departure.',
    },
  ],
}

/**
 * 50-50 Payment Plan (Deposit + Final)
 * Simple two-stage payment
 */
export const TWO_STAGE_PAYMENT_PLAN: PaymentPlanTemplate = {
  id: 'two_stage',
  name: '50-50 Payment Plan',
  description: 'Simple split payment: 50% deposit and 50% final payment',
  stages: [
    {
      sequenceNo: 1,
      name: 'Deposit',
      narration: 'Initial 50% deposit',
      amountDue: 50,
      amountDueType: 'PERCENTAGE',
      dueDays: 0,
      dueDaysType: 'AFTER_CONFIRMATION',
      isDeposit: true,
      description: 'Due upon booking.',
    },
    {
      sequenceNo: 2,
      name: 'Final Payment',
      narration: 'Final 50% payment',
      amountDue: 50,
      amountDueType: 'PERCENTAGE',
      dueDays: 30,
      dueDaysType: 'AFTER_DELIVERY',
      isDeposit: false,
      description: 'Due 30 days before departure.',
    },
  ],
}

/**
 * Get all available payment plan templates
 */
export function getPaymentPlanTemplates(): PaymentPlanTemplate[] {
  return [FOUR_STAGE_PAYMENT_PLAN, THREE_STAGE_PAYMENT_PLAN, TWO_STAGE_PAYMENT_PLAN]
}

/**
 * Get a specific payment plan template by ID
 */
export function getPaymentPlanTemplate(templateId: string): PaymentPlanTemplate | null {
  const templates = getPaymentPlanTemplates()
  return templates.find((t) => t.id === templateId) || null
}

/**
 * Apply a payment plan template to generate installments
 * @param template - The payment plan template to apply
 * @param totalAmount - Total order amount (for percentage calculations)
 * @returns Array of installment stages configured for the order
 */
export function applyPaymentPlanTemplate(
  template: PaymentPlanTemplate,
  totalAmount: number = 0
): InstallmentStage[] {
  return template.stages.map((stage) => {
    let finalAmount = stage.amountDue

    // Calculate fixed amount if using percentage
    if (stage.amountDueType === 'PERCENTAGE' && totalAmount > 0) {
      finalAmount = (stage.amountDue / 100) * totalAmount
    }

    return {
      ...stage,
      amountDue: finalAmount,
    }
  })
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
