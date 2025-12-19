import { defineStore } from 'pinia'
import axios from 'axios'

// Pipeline item interface (for both inquiries and proposals in pipeline)
interface PipelineClient {
  id: number
  full_name: string
  country: string
  email: string
  phone: string
}

interface PipelineHuntingDetails {
  season: string
  areas: string
  species: string
  start_date: string
  end_date: string
  no_of_days: number
  no_of_hunters: number
}

interface PipelineSalesAgent {
  id: number
  name: string
}

interface PipelineItem {
  id: number
  type: 'inquiry' | 'proposal'
  stage: string
  code: string
  created_date: string
  created_date_formatted: string
  client: PipelineClient
  hunting_details: PipelineHuntingDetails
  proposal_id: number | null
  confirmation_id: number | null
  sales_agent: PipelineSalesAgent | null
  total_amount: number | null
  confirmation_date: string | null
}

interface PipelineData {
  new_inquiries: PipelineItem[]
  pending: PipelineItem[]
  provision_sales: PipelineItem[]
  confirmed: PipelineItem[]
  cancelled: PipelineItem[]
  completed: PipelineItem[]
}

interface PipelineCounts {
  new_inquiries: number
  pending: number
  provision_sales: number
  confirmed: number
  cancelled: number
  completed: number
}

// Payment installment interface
interface PaymentTransaction {
  id: number
  amount: number
  payment_reference: string | null
  paid_at: string
  paid_by?: string | null
}

interface Installment {
  id: number
  narration: string
  amount_due: number
  amount_paid: number
  remaining_balance: number
  payment_status: 'paid' | 'partial' | 'unpaid'
  installment_type?: string
  triggers_stage?: string | null
  is_paid: boolean
  paid_at: string | null
  payment_reference: string | null
  paid_by?: string | null
  due_days?: number | null
  amount_due_type?: string | null
  due_days_type?: string | null
  payments: PaymentTransaction[]
}

// Payment status response interface
interface PaymentStatus {
  proposal_id: number
  current_stage: string
  installments: Installment[]
  summary: {
    total_due: number
    total_paid: number
    total_unpaid: number
    fully_paid_count: number
    partial_paid_count: number
    unpaid_count: number
    paid_count?: number // deprecated, use fully_paid_count
  }
}

// Payment response interface
interface PaymentResponse {
  success: boolean
  message: string
  data: {
    installment_id: number
    narration: string
    amount_due: number
    amount_paid: number
    remaining_balance: number
    payment_status: 'paid' | 'partial' | 'unpaid'
    paid_at: string
    payment_reference: string
    proposal_id: number
    payments: PaymentTransaction[]
  }
  stage_changed: boolean
  old_stage?: string
  new_stage?: string
}

interface Proposal {
  id: number
  confirmation_date: string
  confirmation_date_formatted: string
  hunting_license: string | null
  remarks: string | null
  status: string
  sales_agent: {
    id: number
    name: string
    email: string
  }
  client: {
    id: number
    full_name: string
    nick_name: string | null
    country: string
    nationality: string
    address: string
    home_tel: string
    work_tel: string | null
    cell: string | null
    email: string
  }
  hunting_trip: {
    type: string
    hunting_area: string
    hunting_areas: Array<{
      id: number
      name: string
      description: string
      location: string
    }>
    outfitter: string
    dates: string
    start_date: string
    end_date: string
    no_of_days: number
  }
  trip_details: {
    no_of_hunters: number
    no_of_observers: number
    no_of_companions: number
    special_requests: string | null
    prev_experience: string | null
  }
  hunt_combination: Array<{
    id: number
    species_id: number
    species_name: string
    scientific_name: string
    quantity: number
  }>
  pricing: {
    currency: string
    total_amount: number
    installments: Array<{
      id: number
      narration: string
      amount_due: number
      due_days: number | null
      amount_due_type: string | null
      due_days_type: string | null
      is_paid?: boolean
      paid_at?: string | null
      amount_paid?: number | null
      payment_reference?: string | null
    }>
  }
  sales_inquiry: {
    id: number
    code: string
    created_date: string
    season: string
  }
  regulatory_package: any
  created_date: string
  updated_date: string
}

interface ProposalState {
  proposals: Proposal[]
  currentProposal: Proposal | null
  pipeline: PipelineData
  pipelineCounts: PipelineCounts
  pipelineTotal: number
  paymentStatus: PaymentStatus | null
  loading: boolean
  saving: boolean
  error: string | null
}

export const useProposalStore = defineStore('proposals', {
  state: (): ProposalState => ({
    proposals: [],
    currentProposal: null,
    pipeline: {
      new_inquiries: [],
      pending: [],
      provision_sales: [],
      confirmed: [],
      cancelled: [],
      completed: [],
    },
    pipelineCounts: {
      new_inquiries: 0,
      pending: 0,
      provision_sales: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    },
    pipelineTotal: 0,
    paymentStatus: null,
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    getProposalById: (state) => (id: number) => {
      return state.proposals.find((p) => p.id === id)
    },

    pendingProposals: (state) => {
      return state.proposals.filter((p) => p.status === 'pending')
    },

    confirmedProposals: (state) => {
      return state.proposals.filter((p) => p.status === 'confirmed')
    },

    // Pipeline getters
    newInquiries: (state) => state.pipeline.new_inquiries,
    pendingItems: (state) => state.pipeline.pending,
    provisionSalesItems: (state) => state.pipeline.provision_sales,
    confirmedItems: (state) => state.pipeline.confirmed,
    cancelledItems: (state) => state.pipeline.cancelled,
    completedItems: (state) => state.pipeline.completed,
  },

  actions: {
    // Pipeline Actions
    async fetchPipeline(stage?: string, seasonId?: number) {
      this.loading = true
      this.error = null

      try {
        let url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/pipeline`
        const params = new URLSearchParams()
        if (stage) params.append('stage', stage)
        if (seasonId) params.append('season_id', String(seasonId))
        if (params.toString()) url += `?${params.toString()}`

        const response = await axios.get(url)

        if (response.data.success) {
          this.pipeline = response.data.data
          this.pipelineCounts = response.data.counts
          this.pipelineTotal = response.data.total
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch pipeline'
        console.error('Error fetching pipeline:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePipelineStage(inquiryId: number, newStage: string) {
      this.saving = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/pipeline/${inquiryId}/stage`
        const response = await axios.put(url, { stage: newStage })

        if (response.data.success) {
          // Refresh pipeline after stage update
          await this.fetchPipeline()
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to update stage'
        console.error('Error updating pipeline stage:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async fetchProposals() {
      this.loading = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/proposals`
        const response = await axios.get(url)

        if (response.data.success) {
          this.proposals = response.data.data
        } else {
          this.proposals = Array.isArray(response.data) ? response.data : []
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch proposals'
        console.error('Error fetching proposals:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProposalById(id: number) {
      this.loading = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/proposals/${id}`
        const response = await axios.get(url)

        if (response.data.success) {
          this.currentProposal = response.data.data
        } else {
          this.currentProposal = response.data
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch proposal'
        console.error('Error fetching proposal:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createProposal(payload: {
      sales_inquiry_id: number
      regulatory_package_id?: number | null
      confirmation_date?: string
      remarks?: string
      hunting_license?: string
      installments?: Array<{
        narration: string
        amount_due: number
        due_days?: number
        amount_due_type?: string
        due_days_type?: string
      }>
    }) {
      this.saving = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/proposals`
        const response = await axios.post(url, payload)

        if (response.data.success && response.data.data) {
          this.proposals.push(response.data.data)
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to create proposal'
        console.error('Error creating proposal:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateProposal(
      id: number,
      payload: {
        regulatory_package_id?: number | null
        confirmation_date?: string
        remarks?: string
        hunting_license?: string
        status?: string
        installments?: Array<{
          narration: string
          amount_due: number
          due_days?: number
          amount_due_type?: string
          due_days_type?: string
        }>
      },
    ) {
      this.saving = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/proposals/${id}`
        const response = await axios.put(url, payload)

        if (response.data.success && response.data.data) {
          // Update the proposal in the list
          const index = this.proposals.findIndex((p) => p.id === id)
          if (index !== -1) {
            this.proposals[index] = response.data.data
          }
          // Also update currentProposal if it matches
          if (this.currentProposal?.id === id) {
            this.currentProposal = response.data.data
          }
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to update proposal'
        console.error('Error updating proposal:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateProposalStatus(id: number, status: string) {
      return this.updateProposal(id, { status })
    },

    // Payment Actions
    async fetchPayments(proposalId: number) {
      this.loading = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/proposals/${proposalId}/payments`
        const response = await axios.get(url)

        if (response.data.success) {
          this.paymentStatus = response.data.data
        }

        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch payments'
        console.error('Error fetching payments:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async recordPayment(
      installmentId: number,
      payload: {
        amount_paid: number
        payment_reference?: string
        paid_at?: string
      },
    ): Promise<PaymentResponse> {
      this.saving = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/installments/${installmentId}/pay`
        const response = await axios.post(url, payload)

        // If payment recorded successfully and we have paymentStatus, refresh it
        if (response.data.success && this.paymentStatus) {
          await this.fetchPayments(this.paymentStatus.proposal_id)
        }

        // Also refresh current proposal if present
        if (response.data.success && this.currentProposal) {
          await this.fetchProposalById(this.currentProposal.id)
        }

        return response.data as PaymentResponse
      } catch (error: any) {
        this.error = error.message || 'Failed to record payment'
        console.error('Error recording payment:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async unpayInstallment(installmentId: number): Promise<PaymentResponse> {
      this.saving = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/installments/${installmentId}/unpay`
        const response = await axios.post(url)

        // If unpaid successfully and we have paymentStatus, refresh it
        if (response.data.success && this.paymentStatus) {
          await this.fetchPayments(this.paymentStatus.proposal_id)
        }

        // Also refresh current proposal if present
        if (response.data.success && this.currentProposal) {
          await this.fetchProposalById(this.currentProposal.id)
        }

        return response.data as PaymentResponse
      } catch (error: any) {
        this.error = error.message || 'Failed to reverse payment'
        console.error('Error reversing payment:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async deletePayment(paymentId: number): Promise<{ success: boolean; message: string }> {
      this.saving = true
      this.error = null

      try {
        const url = `${import.meta.env.VITE_APP_BASE_URL}sales-confirmation/payments/${paymentId}`
        const response = await axios.delete(url)

        // If deleted successfully and we have paymentStatus, refresh it
        if (response.data.success && this.paymentStatus) {
          await this.fetchPayments(this.paymentStatus.proposal_id)
        }

        // Also refresh current proposal if present
        if (response.data.success && this.currentProposal) {
          await this.fetchProposalById(this.currentProposal.id)
        }

        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to delete payment'
        console.error('Error deleting payment:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    clearPaymentStatus() {
      this.paymentStatus = null
    },

    clearCurrentProposal() {
      this.currentProposal = null
      this.paymentStatus = null
    },

    clearError() {
      this.error = null
    },
  },
})
