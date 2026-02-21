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
    //
    // The backend pipeline endpoint returns items already classified:
    //   new_inquiries, pending, provision_sales, confirmed, cancelled, completed
    //
    // Pipeline fields per item (unchanged):
    //   id, code, type, stage, created_date, created_date_formatted,
    //   client, hunting_details, proposal_id, confirmation_id,
    //   sales_agent, total_amount, confirmation_date
    //
    // Stage flow:
    //   new (no pricing) → pending (DRAFT pricing) → provision_sales (LOCKED pricing)
    //   → confirmed (order created) → completed
    //
    // Stage transitions:
    //   - provision_sales → confirmed: POST /sales-confirmation/proposals (create order)
    //   - confirmed → completed:       PUT  /sales-confirmation/pipeline/{id}/stage
    //   - Any → cancelled:             PUT  /sales-confirmation/pipeline/{id}/stage
    //
    // Notes:
    //   - regulatory_package_id, hunting_license are silently ignored on create
    //   - no_of_observers, no_of_companions always return 0
    //   - no_of_hunters maps from no_of_participants
    //   - end_date should be calculated from start_date + no_of_days
    //
    async fetchPipeline(stage?: string, seasonId?: number) {
      this.loading = true
      this.error = null

      try {
        // ---- 1. Fetch all orders to cross-reference with enquiries ----
        // Orders link to enquiries via sales_enquiry_id / sales_enquiry_pricing_id.
        // We need to know which enquiries already have orders so we can classify them
        // into the correct pipeline stage (confirmed = APPROVED, completed = FULFILLED).
        let allOrders: any[] = []
        try {
          const ordersUrl = `${import.meta.env.VITE_APP_BASE_URL}orders`
          const ordersRes = await axios.get(ordersUrl, {
            params: { per_page: 200, include: 'parties,parties.entity,sales_details' },
          })
          const ordersData = ordersRes.data?.data || ordersRes.data || []
          allOrders = Array.isArray(ordersData) ? ordersData : []
        } catch (e) {
          console.warn('Could not fetch orders for pipeline cross-reference:', e)
        }

        // Build maps for cross-referencing orders ↔ enquiries
        const enquiryOrderMap = new Map<number, any>()   // enquiry_id → best order
        const pricingOrderMap = new Map<number, any>()   // pricing_id → order
        const entityOrdersMap = new Map<number, any[]>() // entity_id → orders[]
        const statusPriority: Record<string, number> = {
          FULFILLED: 5, APPROVED: 4, SUBMITTED: 3, DRAFT: 2, CANCELLED: 1,
        }
        for (const order of allOrders) {
          const eId = order.sales_enquiry_id || order.enquiry_id
            || order.sales_details?.sales_enquiry_id
          const pId = order.sales_enquiry_pricing_id
            || order.sales_details?.sales_enquiry_pricing_id
          const orderPriority = statusPriority[(order.status || '').toUpperCase()] || 0

          if (eId) {
            const existing = enquiryOrderMap.get(eId)
            const existingPriority = existing
              ? (statusPriority[(existing.status || '').toUpperCase()] || 0) : -1
            if (orderPriority > existingPriority) {
              enquiryOrderMap.set(eId, order)
            }
          }
          if (pId) {
            const existing = pricingOrderMap.get(pId)
            const existingPriority = existing
              ? (statusPriority[(existing.status || '').toUpperCase()] || 0) : -1
            if (orderPriority > existingPriority) {
              pricingOrderMap.set(pId, order)
            }
          }
          // Also index by entity_id for last-resort matching
          const oParties = order.parties || []
          const oCust = oParties.find((p: any) =>
            ['CUSTOMER', 'CLIENT'].includes((p.role || '').toUpperCase()),
          ) || oParties[0]
          const oEntId = oCust?.entity_id || oCust?.entity?.id || order.entity_id
          if (oEntId) {
            if (!entityOrdersMap.has(oEntId)) entityOrdersMap.set(oEntId, [])
            entityOrdersMap.get(oEntId)!.push(order)
          }
        }

        // Helper: find the best matching order for an enquiry (multi-strategy)
        const findOrderForEnquiry = (enq: any): any | null => {
          // Strategy 1: Direct match by sales_enquiry_id
          let order = enquiryOrderMap.get(enq.id)
          if (order) return order
          // Strategy 2: Match by pricing ID
          const pricings: any[] = enq.pricings || []
          for (const pricing of pricings) {
            order = pricingOrderMap.get(pricing.id)
            if (order) return order
          }
          // Strategy 3: Match by entity_id (only if entity has exactly one order)
          const entId = enq.entity?.id || enq.entity_id
          if (entId) {
            const entityOrders = entityOrdersMap.get(entId) || []
            if (entityOrders.length === 1) return entityOrders[0]
          }
          return null
        }

        // Helper to get customer name from order
        const getOrderCustomerName = (order: any): string => {
          if (order.entity_name) return order.entity_name
          const parties = order.parties || []
          const customer = parties.find((p: any) =>
            ['CUSTOMER', 'CLIENT'].includes((p.role || '').toUpperCase()),
          ) || parties[0]
          return customer?.entity?.full_name || customer?.entity_name
            || customer?.contact_name || ''
        }

        // ---- 2. Classify ALL enquiries using orders cross-reference ----
        // The pipeline API may return stale stage data (e.g. an enquiry still in
        // "new_inquiries" even though it already has an APPROVED order).
        // We ALWAYS build from enquiries + orders to get the true picture.

        let classifiedNewInquiries: any[] = []
        let classifiedPending: any[] = []
        let classifiedProvisionSales: any[] = []
        let classifiedConfirmed: any[] = []
        let classifiedCompleted: any[] = []
        let classifiedCancelled: any[] = []

        // Track which order IDs get linked to an enquiry
        const linkedOrderIds = new Set<number>()

        // Always fetch enquiries so we can cross-reference with orders
        try {
          const enquiriesUrl = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries`
          const eParams = new URLSearchParams()
          if (seasonId) eParams.append('season_id', String(seasonId))
          eParams.append('include', 'pricings,entity')
          const eRes = await axios.get(`${enquiriesUrl}?${eParams}`)
          let enquiries: any[] = []
          if (eRes.data?.success && Array.isArray(eRes.data.data)) {
            enquiries = eRes.data.data
          } else if (Array.isArray(eRes.data)) {
            enquiries = eRes.data
          }

          // Helper to transform enquiry → PipelineItem shape
          const toItem = (enq: any, stageLabel: string, order?: any) => ({
            id: enq.id,
            type: 'inquiry',
            stage: stageLabel,
            code: enq.code || `ENQ-${enq.id}`,
            created_date: enq.date || enq.created_at || '',
            created_date_formatted: enq.date || enq.created_at || '',
            client: {
              id: enq.entity?.id || enq.entity_id || 0,
              full_name: enq.entity?.full_name || (order ? getOrderCustomerName(order) : '') || 'Unknown Client',
              country: enq.entity?.country || '',
              email: enq.entity?.contacts?.find((c: any) => c.type === 'email')?.contact || '',
              phone: enq.entity?.contacts?.find((c: any) => c.type === 'phone')?.contact || '',
            },
            hunting_details: {
              season: enq.season?.name || '',
              areas: enq.areas?.map((a: any) => a.location?.name).filter(Boolean).join(', ') || '',
              species: enq.item_preferences?.map((p: any) => p.item_name).filter(Boolean).join(', ') || '',
              start_date: enq.preference?.preferred_start_date || '',
              end_date: '',
              no_of_days: enq.preference?.no_of_days || 0,
              no_of_hunters: enq.preference?.no_of_participants || 0,
            },
            proposal_id: null,
            confirmation_id: null,
            sales_agent: enq.user
              ? { id: enq.user.id, name: enq.user.full_name || enq.user.username }
              : null,
            total_amount: order?.grand_total || order?.total_amount || enq.pricing_summary?.total_amount || null,
            confirmation_date: order?.order_date || null,
            pricings: enq.pricings || [],
            pricing_count: enq.pricings?.length || 0,
            has_pricing: (enq.pricings?.length || 0) > 0,
            entity: enq.entity || null,
            season: enq.season || null,
            // Attach order info so pipeline cards/views can link to the order
            order_id: order?.id || null,
            order_number: order?.order_number || null,
            order_status: order?.status || null,
          })

          for (const enq of enquiries) {
            const pricings: any[] = enq.pricings || []
            const hasLocked = pricings.some((p: any) => (p.status || '').toUpperCase() === 'LOCKED')
            const hasDraft = pricings.some((p: any) => (p.status || '').toUpperCase() === 'DRAFT')

            // Order takes priority: check if this enquiry has an associated order
            const order = findOrderForEnquiry(enq)
            if (order) {
              linkedOrderIds.add(order.id)
              const orderStatus = (order.status || '').toUpperCase()
              if (orderStatus === 'APPROVED' || orderStatus === 'CONFIRMED') {
                classifiedConfirmed.push(toItem(enq, 'confirmed', order))
              } else if (orderStatus === 'FULFILLED' || orderStatus === 'COMPLETED') {
                classifiedCompleted.push(toItem(enq, 'completed', order))
              } else if (orderStatus === 'CANCELLED') {
                classifiedCancelled.push(toItem(enq, 'cancelled', order))
              } else {
                // DRAFT or SUBMITTED order → still in provision_sales (order not yet approved)
                classifiedProvisionSales.push(toItem(enq, 'provision_sales', order))
              }
            } else {
              // No order → classify by pricing status
              if (hasLocked) {
                classifiedProvisionSales.push(toItem(enq, 'provision_sales'))
              } else if (hasDraft) {
                classifiedPending.push(toItem(enq, 'pending'))
              } else {
                classifiedNewInquiries.push(toItem(enq, 'new'))
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch enquiries for pipeline classification:', e)
        }

        // ---- 3. Also add orders that don't have a matching enquiry ----
        // (orders created directly, not through an enquiry)
        // If an unlinked order's entity matches an already-classified enquiry,
        // UPGRADE that enquiry to the order's stage instead of duplicating.
        const allClassified = [
          { arr: classifiedNewInquiries, name: 'new_inquiries' },
          { arr: classifiedPending, name: 'pending' },
          { arr: classifiedProvisionSales, name: 'provision_sales' },
          { arr: classifiedConfirmed, name: 'confirmed' },
          { arr: classifiedCancelled, name: 'cancelled' },
          { arr: classifiedCompleted, name: 'completed' },
        ]

        for (const order of allOrders) {
          // Skip orders already linked to an enquiry
          if (linkedOrderIds.has(order.id)) continue

          const orderStatus = (order.status || '').toUpperCase()
          const customerName = getOrderCustomerName(order)

          // Try to find an existing enquiry item for this order's entity
          const oParties = order.parties || []
          const oCust = oParties.find((p: any) =>
            ['CUSTOMER', 'CLIENT'].includes((p.role || '').toUpperCase()),
          ) || oParties[0]
          const orderEntityId = oCust?.entity_id || oCust?.entity?.id || order.entity_id

          let matchedEnquiryItem: any = null
          let matchedBucket: { arr: any[]; name: string } | null = null
          let matchedIndex = -1

          if (orderEntityId) {
            for (const bucket of allClassified) {
              const idx = bucket.arr.findIndex(
                (item: any) => item.type === 'inquiry' && (item.client?.id === orderEntityId || item.entity?.id === orderEntityId),
              )
              if (idx !== -1) {
                matchedEnquiryItem = bucket.arr[idx]
                matchedBucket = bucket
                matchedIndex = idx
                break
              }
            }
          }

          if (matchedEnquiryItem && matchedBucket !== null && matchedIndex !== -1) {
            // Remove the enquiry from its current bucket
            matchedBucket.arr.splice(matchedIndex, 1)
            // Upgrade it: attach order info and move to the correct stage
            matchedEnquiryItem.order_id = order.id
            matchedEnquiryItem.order_number = order.order_number || null
            matchedEnquiryItem.order_status = order.status || null
            matchedEnquiryItem.total_amount = order.grand_total || order.total_amount || matchedEnquiryItem.total_amount
            matchedEnquiryItem.confirmation_date = order.order_date || null
            matchedEnquiryItem.stage = orderStatus === 'APPROVED' ? 'confirmed'
              : orderStatus === 'FULFILLED' ? 'completed'
              : orderStatus === 'CANCELLED' ? 'cancelled'
              : 'provision_sales'

            if (orderStatus === 'APPROVED' || orderStatus === 'CONFIRMED') {
              classifiedConfirmed.push(matchedEnquiryItem)
            } else if (orderStatus === 'FULFILLED' || orderStatus === 'COMPLETED') {
              classifiedCompleted.push(matchedEnquiryItem)
            } else if (orderStatus === 'CANCELLED') {
              classifiedCancelled.push(matchedEnquiryItem)
            } else {
              classifiedProvisionSales.push(matchedEnquiryItem)
            }
          } else {
            // Truly standalone order — no matching enquiry at all
            const orderItem = {
              id: order.id,
              type: 'order',
              stage: orderStatus === 'APPROVED' ? 'confirmed'
                : orderStatus === 'FULFILLED' ? 'completed'
                : orderStatus === 'CANCELLED' ? 'cancelled'
                : 'provision_sales',
              code: order.order_number || `ORD-${order.id}`,
              created_date: order.order_date || order.created_at || '',
              created_date_formatted: order.order_date || order.created_at || '',
              client: {
                id: order.entity_id || 0,
                full_name: customerName || 'Unknown',
                country: '',
              },
              hunting_details: { season: '', areas: '', species: '' },
              proposal_id: null,
              confirmation_id: null,
              sales_agent: null,
              total_amount: order.grand_total || order.total_amount || null,
              confirmation_date: order.order_date || null,
              order_id: order.id,
              order_number: order.order_number || null,
              order_status: order.status || null,
            }

            if (orderStatus === 'APPROVED' || orderStatus === 'CONFIRMED') {
              classifiedConfirmed.push(orderItem)
            } else if (orderStatus === 'FULFILLED' || orderStatus === 'COMPLETED') {
              classifiedCompleted.push(orderItem)
            } else if (orderStatus === 'CANCELLED') {
              classifiedCancelled.push(orderItem)
            }
          }
        }

        // ---- 4. Deduplicate: if the same client reached a later stage, ----
        //    remove them from earlier stages (they already passed those).
        // Stage priority (higher = further along in the pipeline):
        const stagePriority: Record<string, number> = {
          new_inquiries: 1, pending: 2, provision_sales: 3,
          confirmed: 4, completed: 5, cancelled: 0,
        }
        // Build a map: entity name → highest stage priority they appear in
        const entityHighestStage = new Map<string, number>()
        const stageArrays: [string, any[]][] = [
          ['new_inquiries', classifiedNewInquiries],
          ['pending', classifiedPending],
          ['provision_sales', classifiedProvisionSales],
          ['confirmed', classifiedConfirmed],
          ['completed', classifiedCompleted],
          ['cancelled', classifiedCancelled],
        ]
        for (const [stageName, items] of stageArrays) {
          const pri = stagePriority[stageName] || 0
          for (const item of items) {
            const key = (item.client?.full_name || '').toLowerCase().trim()
            if (!key || key === 'unknown' || key === 'unknown client') continue
            const current = entityHighestStage.get(key) || 0
            if (pri > current) entityHighestStage.set(key, pri)
          }
        }
        // Filter early stages: remove items whose entity has a higher-stage entry
        const filterByHighestStage = (items: any[], stageName: string) => {
          const pri = stagePriority[stageName] || 0
          return items.filter((item: any) => {
            const key = (item.client?.full_name || '').toLowerCase().trim()
            if (!key || key === 'unknown' || key === 'unknown client') return true
            return (entityHighestStage.get(key) || 0) <= pri
          })
        }
        classifiedNewInquiries = filterByHighestStage(classifiedNewInquiries, 'new_inquiries')
        classifiedPending = filterByHighestStage(classifiedPending, 'pending')
        classifiedProvisionSales = filterByHighestStage(classifiedProvisionSales, 'provision_sales')

        // ---- 5. Assemble the full pipeline ----
        // Enquiry+order classification is the source of truth for all stages.
        this.pipeline = {
          new_inquiries: classifiedNewInquiries,
          pending: classifiedPending,
          provision_sales: classifiedProvisionSales,
          confirmed: classifiedConfirmed,
          cancelled: classifiedCancelled,
          completed: classifiedCompleted,
        }

        this.pipelineCounts = {
          new_inquiries: this.pipeline.new_inquiries.length,
          pending: this.pipeline.pending.length,
          provision_sales: this.pipeline.provision_sales.length,
          confirmed: this.pipeline.confirmed.length,
          cancelled: this.pipeline.cancelled.length,
          completed: this.pipeline.completed.length,
        }

        this.pipelineTotal = Object.values(this.pipelineCounts).reduce(
          (sum, n) => sum + n,
          0,
        )
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
      confirmation_date?: string
      remarks?: string
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
        confirmation_date?: string
        remarks?: string
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
