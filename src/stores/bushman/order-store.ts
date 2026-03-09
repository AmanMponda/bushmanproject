// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}orders`

interface OrderState {
  orders: any[]
  currentOrder: any
  currentOrderTotals: any
  orderTypes: any[]
  orderStatuses: any[]
  enquiries: any[]
  quotations: any[]
  currencies: any[]
  entities: any[]
  unitOfMeasurements: any[]
  dietaryPreferences: any[]
  allergies: any[]
  partyRoles: any[]
  participantTypes: any[]
  itemCategories: any[]
  logisticsTypes: any[]
  logisticsStatuses: any[]
  installmentSetups: any[]
  installmentDaysTypes: any[]
  installmentAmountTypes: any[]
  paymentPlanTemplates: any[]
  loading: boolean
  error: string | null
  filters: {
    search: string
    page: number
    per_page: number
    type: string
    status: string
  }
}

export const useOrderStore = defineStore('order', {
  state: (): OrderState => ({
    orders: [] as any[],
    currentOrder: null as any,
    currentOrderTotals: null as any,
    orderTypes: [
      { id: 'SALES', name: 'SALES', label: 'Sales Order' },
      { id: 'PURCHASE', name: 'PURCHASE', label: 'Purchase Order' },
      { id: 'TRANSFER', name: 'TRANSFER', label: 'Transfer Order' },
    ],
    orderStatuses: [
      { id: 'DRAFT', name: 'DRAFT', label: 'Draft' },
      { id: 'SUBMITTED', name: 'SUBMITTED', label: 'Submitted' },
      { id: 'APPROVED', name: 'APPROVED', label: 'Approved' },
      { id: 'AWAITING_DEPOSIT', name: 'AWAITING_DEPOSIT', label: 'Awaiting Deposit' },
      { id: 'CONFIRMED', name: 'CONFIRMED', label: 'Confirmed' },
      { id: 'PARTIALLY_FULFILLED', name: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled' },
      { id: 'FULFILLED', name: 'FULFILLED', label: 'Fulfilled' },
      { id: 'CANCELLED', name: 'CANCELLED', label: 'Cancelled' },
      { id: 'CLOSED', name: 'CLOSED', label: 'Closed' },
    ],
    enquiries: [] as any[],
    quotations: [] as any[],
    currencies: [] as any[],
    entities: [] as any[],
    unitOfMeasurements: [] as any[],
    dietaryPreferences: [] as any[],
    allergies: [] as any[],
    partyRoles: [] as any[],
    participantTypes: [] as any[],
    itemCategories: [] as any[],
    logisticsTypes: [] as any[],
    logisticsStatuses: [] as any[],
    installmentSetups: [] as any[],
    installmentDaysTypes: [] as any[],
    installmentAmountTypes: [] as any[],
    paymentPlanTemplates: [] as any[],
    loading: false,
    error: null as string | null,
    filters: {
      search: '',
      page: 1,
      per_page: 15,
      type: '',
      status: ''
    }
  }),

  getters: {
    getOrders: (state: OrderState) => state.orders,
    getCurrentOrder: (state: OrderState) => state.currentOrder,
    getOrderTypes: (state: OrderState) => state.orderTypes,
    getOrderStatuses: (state: OrderState) => state.orderStatuses,
    getEnquiries: (state: OrderState) => state.enquiries,
    getQuotations: (state: OrderState) => state.quotations,
    getCurrencies: (state: OrderState) => state.currencies,
    getEntities: (state: OrderState) => state.entities,
    getUnitOfMeasurements: (state: OrderState) => state.unitOfMeasurements,
    getDietaryPreferences: (state: OrderState) => state.dietaryPreferences,
    getAllergies: (state: OrderState) => state.allergies,
    getPartyRoles: (state: OrderState) => state.partyRoles,
    getParticipantTypes: (state: OrderState) => state.participantTypes,
    getItemCategories: (state: OrderState) => state.itemCategories,
    getLogisticsTypes: (state: OrderState) => state.logisticsTypes,
    getLogisticsStatuses: (state: OrderState) => state.logisticsStatuses,
    getInstallmentSetups: (state: OrderState) => state.installmentSetups,
    getInstallmentDaysTypes: (state: OrderState) => state.installmentDaysTypes,
    getInstallmentAmountTypes: (state: OrderState) => state.installmentAmountTypes,
    getPaymentPlanTemplatesFromState: (state: OrderState) => state.paymentPlanTemplates,
    isLoading: (state: OrderState) => state.loading,
    getError: (state: OrderState) => state.error
  },

  actions: {
    // ==================== ORDERS CRUD ====================
    
    async listOrders(params: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const queryParams: any = {
          search: this.filters.search,
          type: this.filters.type || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
          include: 'parties,parties.entity,items,items.item,items.unitOfMeasurement,logistics',
          ...params
        }

        const config = {
          method: 'get',
          url: API_BASE,
          params: queryParams,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const responseData = response.data.data || response.data || []
        this.orders = Array.isArray(responseData) ? responseData : []
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading orders'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getOrder(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${id}`,
          params: {
            include: 'parties,parties.entity,items,items.item,items.item_category,items.item.item_category,logistics,sales_details,sales_details.salesEnquiry,sales_details.salesEnquiry.pricings,sales_details.salesEnquiry.pricings.priceStructureDetail,sales_details.salesEnquiry.areas,sales_details.salesEnquiry.areas.location,order_payments,payment_schedule,documents,preferences'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.currentOrder = response.data.data || response.data
        this.currentOrderTotals = response.data.totals || null
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createOrder(payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: API_BASE,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const newOrder = response.data.data || response.data
        this.orders.push(newOrder)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateOrder(id: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${id}`,
          data: payload,
          params: {
            include: 'parties,parties.entity,items,items.item,logistics,sales_details,order_payments,payment_schedule,documents,preferences'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const updatedOrder = response.data.data || response.data
        
        // Update in list
        const index = this.orders.findIndex((o: any) => o.id === id)
        if (index !== -1) {
          this.orders[index] = updatedOrder
        }
        
        // Update current
        if (this.currentOrder?.id === id) {
          this.currentOrder = updatedOrder
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteOrder(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/${id}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        
        // Remove from list
        this.orders = this.orders.filter((o: any) => o.id !== id)
        
        // Clear current if it was deleted
        if (this.currentOrder?.id === id) {
          this.currentOrder = null
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async submitOrder(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${id}/submit`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const submittedOrder = response.data.data || response.data
        
        // Update in list
        const index = this.orders.findIndex((o: any) => o.id === id)
        if (index !== -1) {
          this.orders[index] = submittedOrder
        }
        
        // Update current
        if (this.currentOrder?.id === id) {
          this.currentOrder = submittedOrder
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error submitting order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateOrderStatus(id: number, status: string): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${id}`,
          data: { status },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const updatedOrder = response.data.data || response.data
        
        // Update in list
        const index = this.orders.findIndex((o: any) => o.id === id)
        if (index !== -1) {
          this.orders[index] = updatedOrder
        }
        
        // Update current
        if (this.currentOrder?.id === id) {
          this.currentOrder = updatedOrder
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating order status'
        throw err
      } finally {
        this.loading = false
      }
    },

    async approveOrder(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${id}/approve`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const approvedOrder = response.data.data || response.data
        
        // Update in list
        const index = this.orders.findIndex((o: any) => o.id === id)
        if (index !== -1) {
          this.orders[index] = approvedOrder
        }
        
        // Update current
        if (this.currentOrder?.id === id) {
          this.currentOrder = approvedOrder
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error approving order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createContractFromOrder(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${id}/create-contract`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating contract from order'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getOrderItems(orderId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${orderId}/items`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading order items'
        throw err
      } finally {
        this.loading = false
      }
    },

    // Order types and statuses are defined as constants in state initializer
    // No API calls needed — these are fixed enum values


    // ==================== LOGISTICS TYPES ====================

    async fetchLogisticsTypes(): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/logistics-types`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.logisticsTypes = response.data.data || response.data || []
        return response
      } catch (err: any) {
        // Fail silently and return empty array
        this.logisticsTypes = []
      } finally {
        this.loading = false
      }
    },

    // ==================== LOGISTICS STATUSES ====================

    async fetchLogisticsStatuses(): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/logistics-statuses`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.logisticsStatuses = response.data.data || response.data || []
        return response
      } catch (err: any) {
        // Fail silently and return empty array
        this.logisticsStatuses = []
      } finally {
        this.loading = false
      }
    },

    // ==================== ORDER LOGISTICS CRUD ====================

    async createOrderLogistics(orderId: number, payload: any): Promise<any> {
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${orderId}/logistics`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }
        const response: any = await axios.request(config)
        return response.data.data || response.data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating logistics'
        throw err
      }
    },

    async updateOrderLogistics(orderId: number, logisticsId: number, payload: any): Promise<any> {
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${orderId}/logistics/${logisticsId}`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }
        const response: any = await axios.request(config)
        return response.data.data || response.data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating logistics'
        throw err
      }
    },

    async deleteOrderLogistics(orderId: number, logisticsId: number): Promise<any> {
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/${orderId}/logistics/${logisticsId}`,
          headers: { 'Content-Type': 'application/json' }
        }
        const response: any = await axios.request(config)
        return response.data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting logistics'
        throw err
      }
    },

    // ==================== ENQUIRIES ====================

    async fetchEnquiries(): Promise<any> {
      this.loading = true
      try {
        const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
        const config = {
          method: 'get',
          url: `${apiBase}/sales/sales-inquiries/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.enquiries = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.enquiries = []
      } finally {
        this.loading = false
      }
    },

    // ==================== QUOTATIONS ====================

    /**
     * Fetch all quotations/pricings for a specific sales enquiry
     * Uses the eager-loaded endpoint: GET /api/v1.0/sales-enquiries/{id}
     * which returns enquiry with all related pricings (quotations) and items
     * 
     * @param enquiryId - The sales enquiry ID
     * @returns Array of quotations with their details
     */
    async fetchQuotationsByEnquiry(enquiryId: number): Promise<any> {
      this.loading = true
      try {
        const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
        const config = {
          method: 'get',
          url: `${apiBase}/sales-enquiries/${enquiryId}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        // Extract pricings (quotations) from enquiry response
        const enquiryData = response.data.data || response.data
        this.quotations = enquiryData.pricings || []
        return response
      } catch (err: any) {
        this.quotations = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Legacy method - fetches all quotations (kept for backward compatibility)
     * Note: Consider using fetchQuotationsByEnquiry instead
     */
    async fetchQuotations(): Promise<any> {
      this.loading = true
      try {
        const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
        const config = {
          method: 'get',
          url: `${apiBase}/sales-enquiries/pricing`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.quotations = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.quotations = []
      } finally {
        this.loading = false
      }
    },

    // ==================== CURRENCIES ====================

    async fetchCurrencies(): Promise<any> {
      this.loading = true
      try {
        const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
        const config = {
          method: 'get',
          url: `${apiBase}/settings/currencies/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.currencies = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.currencies = []
      } finally {
        this.loading = false
      }
    },

    // ==================== FILTERS ====================

    setFilters(newFilters: any): void {
      this.filters = { ...this.filters, ...newFilters }
    },

    resetFilters(): void {
      this.filters = {
        search: '',
        page: 1,
        per_page: 15,
        type: '',
        status: ''
      }
    },

    setError(error: string | null): void {
      this.error = error
    },

    // ==================== DIETARY PREFERENCES ====================

    async fetchDietaryPreferences(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/dietary-preferences/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.dietaryPreferences = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.dietaryPreferences = []
      } finally {
        this.loading = false
      }
    },

    // ==================== ALLERGIES ====================

    async fetchAllergies(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/allergies/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.allergies = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.allergies = []
      } finally {
        this.loading = false
      }
    },

    // ==================== PARTY ROLES ====================

    async fetchPartyRoles(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/party-roles/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.partyRoles = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.partyRoles = []
      } finally {
        this.loading = false
      }
    },

    // ==================== PARTICIPANT TYPES ====================

    async fetchParticipantTypes(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/participant-types/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.participantTypes = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.participantTypes = []
      } finally {
        this.loading = false
      }
    },

    // ==================== ITEM CATEGORIES ====================

    async fetchItemCategories(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/item-categories/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.itemCategories = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.itemCategories = []
      } finally {
        this.loading = false
      }
    },

    // ==================== ENTITIES ====================

    async fetchEntities(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/entities/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.entities = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.entities = []
      } finally {
        this.loading = false
      }
    },

    // ==================== UNIT OF MEASUREMENTS ====================

    async fetchUnitOfMeasurements(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/unit-of-measurements/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.unitOfMeasurements = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.unitOfMeasurements = []
      } finally {
        this.loading = false
      }
    },

    // ==================== INSTALLMENT SETUPS ====================

    async getOrderInstallments(orderId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${orderId}/installments`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.installmentSetups = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.installmentSetups = []
      } finally {
        this.loading = false
      }
    },

    async createInstallment(orderId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${orderId}/installments`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const newInstallment = response.data.data || response.data
        this.installmentSetups.push(newInstallment)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating installment'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateInstallment(orderId: number, installmentId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${orderId}/installments/${installmentId}`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const updatedInstallment = response.data.data || response.data
        
        const index = this.installmentSetups.findIndex((i: any) => i.id === installmentId)
        if (index !== -1) {
          this.installmentSetups[index] = updatedInstallment
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating installment'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteInstallment(orderId: number, installmentId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/${orderId}/installments/${installmentId}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.installmentSetups = this.installmentSetups.filter((i: any) => i.id !== installmentId)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting installment'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== INSTALLMENT SETUP OPTIONS ====================

    async fetchInstallmentDaysTypes(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/installment-days-types/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.installmentDaysTypes = response.data.data || response.data || [
          { value: 'AFTER_INVOICE', label: 'After Invoice' },
          { value: 'AFTER_DELIVERY', label: 'After Delivery' },
          { value: 'AFTER_CONFIRMATION', label: 'After Confirmation' }
        ]
        return response
      } catch (err: any) {
        // Fallback to enum values
        this.installmentDaysTypes = [
          { value: 'AFTER_INVOICE', label: 'After Invoice' },
          { value: 'AFTER_DELIVERY', label: 'After Delivery' },
          { value: 'AFTER_CONFIRMATION', label: 'After Confirmation' }
        ]
      } finally {
        this.loading = false
      }
    },

    async fetchInstallmentAmountTypes(): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/installment-amount-types/`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.installmentAmountTypes = response.data.data || response.data || [
          { value: 'FIXED', label: 'Fixed Amount' },
          { value: 'PERCENTAGE', label: 'Percentage' }
        ]
        return response
      } catch (err: any) {
        // Fallback to enum values
        this.installmentAmountTypes = [
          { value: 'FIXED', label: 'Fixed Amount' },
          { value: 'PERCENTAGE', label: 'Percentage' }
        ]
      } finally {
        this.loading = false
      }
    },

    // ==================== SALES ENQUIRY → QUOTATION → ORDER WORKFLOW ====================

    /**
     * Load sales enquiry with all quotations and line items (eager loading)
     * Used in the enquiry detail view for quotation comparison
     * 
     * @param enquiryId - The sales enquiry ID
     * @returns Enquiry object with nested pricings (quotations) and items
     */
    async fetchEnquiryWithQuotations(enquiryId: number): Promise<any> {
      this.loading = true
      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
        const url = `${baseUrl}sales/sales-inquiries/${enquiryId}?include=pricings,pricings.items`

        const config = {
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response.data.data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading enquiry with quotations'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Create order from selected quotation/pricing
     * Auto-fills items, pricing, and customer from quotation
     * 
     * @param payload - Order creation payload including sales_enquiry_pricing_id
     * @returns Created order object with order_number
     */
    async createOrderFromQuotation(payload: {
      sales_enquiry_pricing_id: number
      entity_id: number
      order_type_id?: number
      status_id?: number
      currency_id?: number
      items?: any[]
      parties?: any[]
      [key: string]: any
    }): Promise<any> {
      this.loading = true
      try {
        // Ensure required fields have defaults
        const orderPayload = {
          type: 'SALES',
          order_type_id: payload.order_type_id || 1,
          status_id: payload.status_id || 1,
          entity_id: payload.entity_id,
          order_date: new Date().toISOString().split('T')[0],
          currency_id: payload.currency_id || 1,
          // FIXED 1D: Ensure both IDs are sent for full traceability
          sales_enquiry_id: payload.sales_enquiry_id,
          sales_enquiry_pricing_id: payload.sales_enquiry_pricing_id,
          ...payload
        }

        const config = {
          method: 'post',
          url: `${API_BASE}/`,
          data: orderPayload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const createdOrder = response.data.data

        // Update current order
        this.currentOrder = createdOrder

        // Add to orders list
        if (!this.orders.find((o: any) => o.id === createdOrder.id)) {
          this.orders.unshift(createdOrder)
        }

        return createdOrder
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating order from quotation'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Link quotation to existing order
     * Updates order with sales_enquiry_pricing_id
     * 
     * @param orderId - The order ID
     * @param quotationId - The quotation/pricing ID
     */
    async linkQuotationToOrder(orderId: number, quotationId: number): Promise<any> {
      this.loading = true
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${orderId}/`,
          data: {
            sales_enquiry_pricing_id: quotationId
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        const updatedOrder = response.data.data

        // Update current order
        this.currentOrder = updatedOrder

        // Update in orders list
        const index = this.orders.findIndex((o: any) => o.id === updatedOrder.id)
        if (index > -1) {
          this.orders[index] = updatedOrder
        }

        return updatedOrder
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error linking quotation to order'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch pricing items from a quotation/pricing
     * Returns all sales_enquiry_pricing_items for auto-population in order
     * 
     * @param pricingId - The sales_enquiry_pricing ID
     * @returns Array of pricing items with details
     */
    async fetchPricingItems(pricingId: number): Promise<any[]> {
      this.loading = true
      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
        // Changed to fetch the full pricing record which includes items_by_type
        const url = `${baseUrl}sales-enquiries/pricing/${pricingId}`

        const config = {
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        
        // Extract items from the pricing object
        const pricingData = response.data.data || response.data
        let allItems: any[] = []
        
        // Check if items are in items_by_type (grouped by type)
        if (pricingData.items_by_type && typeof pricingData.items_by_type === 'object') {
          Object.values(pricingData.items_by_type).forEach((typeItems: any) => {
            if (Array.isArray(typeItems)) {
              allItems.push(...typeItems)
            }
          })
        }
        // Check if items are in a direct items array
        else if (Array.isArray(pricingData.items)) {
          allItems = pricingData.items
        }
        // Check for pricing_items array
        else if (Array.isArray(pricingData.pricing_items)) {
          allItems = pricingData.pricing_items
        }
        
        return allItems
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching pricing items'
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch pricing parties from a quotation/pricing
     * Returns the client entity and contact details for auto-population in order
     * 
     * @param pricingId - The sales_enquiry_pricing ID
     * @returns Array of party objects with role, entity name, contact details
     */
    async fetchPricingParties(pricingId: number): Promise<any[]> {
      this.loading = true
      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
        const url = `${baseUrl}sales-enquiries/pricing/${pricingId}/parties`

        const config = {
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        
        const partiesData = response.data.data || response.data
        let allParties: any[] = []
        
        // Check if parties are in a direct parties array
        if (Array.isArray(partiesData.parties)) {
          allParties = partiesData.parties
        }
        // Check if it's a single party object
        else if (partiesData.entity_id) {
          allParties = [partiesData]
        }
        // Check if parties are in array format
        else if (Array.isArray(partiesData)) {
          allParties = partiesData
        }
        
        return allParties
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching pricing parties'
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch pricing logistics and participants from a quotation/pricing
     * Returns participant counts and logistics items for auto-population
     * 
     * @param pricingId - The sales_enquiry_pricing ID
     * @returns Object with participants counts and logistics items
     */
    async fetchPricingLogistics(pricingId: number): Promise<any> {
      this.loading = true
      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
        const url = `${baseUrl}sales-enquiries/pricing/${pricingId}/logistics`

        const config = {
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        
        const logisticsData = response.data.data || response.data
        
        return logisticsData
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching pricing logistics'
        return { participants: {}, logistics: [] }
      } finally {
        this.loading = false
      }
    },

    // ==================== PAYMENT PLAN TEMPLATES ====================

    /**
     * Fetch payment plan templates from the backend installment-setups API.
     * Optionally pass price_structure_id and days to auto-fill trophy deposit amounts.
     *
     * @param params.price_structure_id - Quotation / pricing ID for trophy deposit lookup
     * @param params.days              - Safari duration in days for trophy deposit lookup
     */
    async fetchPaymentPlanTemplates(params?: { price_structure_id?: number | string; days?: number | string; order_id?: number | string; sales_inquiry_id?: number | string }): Promise<any> {
      try {
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
        const queryParams: Record<string, string> = {}
        if (params?.price_structure_id) queryParams.price_structure_id = String(params.price_structure_id)
        if (params?.days) queryParams.days = String(params.days)
        if (params?.order_id) queryParams.order_id = String(params.order_id)
        if (params?.sales_inquiry_id) queryParams.sales_inquiry_id = String(params.sales_inquiry_id)
        const qs = new URLSearchParams(queryParams).toString()
        const url = `${baseUrl}installment-setups/templates${qs ? '?' + qs : ''}`
        const response: any = await axios.get(url)
        const data = response.data?.data || response.data || []

        // Normalise backend shape → frontend shape expected by the template selector.
        // The backend may return a flat list of stages grouped by a parent template,
        // or an array of template objects with nested stages – handle both.
        if (Array.isArray(data) && data.length > 0) {
          // If the first element already has a `stages` array it's properly grouped.
          if (data[0].stages) {
            this.paymentPlanTemplates = data.map((t: any) => ({
              id: t.id ?? t.code ?? t.name,
              name: t.name || t.title || `Template ${t.id}`,
              description: t.description || '',
              stages: (t.stages || []).map((s: any, idx: number) => ({
                sequenceNo: s.sequence_no ?? s.sequenceNo ?? idx + 1,
                name: s.name || s.narration || `Stage ${idx + 1}`,
                narration: s.narration || s.name || '',
                amountDue: Number(s.amount_due ?? s.amountDue ?? 0),
                amountDueType: (s.amount_due_type || s.amountDueType || 'PERCENTAGE').toUpperCase(),
                dueDays: Number(s.due_days ?? s.dueDays ?? 0),
                dueDaysType: (s.due_days_type || s.dueDaysType || 'AFTER_CONFIRMATION').toUpperCase(),
                isDeposit: !!(s.is_deposit || s.isDeposit),
                isTrophyDeposit: !!(s.is_trophy_deposit || s.isTrophyDeposit),
                description: s.description || ''
              }))
            }))
          } else {
            // Flat list of stage records – group by template_id / template_name
            const grouped: Record<string, any> = {}
            data.forEach((s: any) => {
              const key = s.template_id || s.template_name || s.group || 'default'
              if (!grouped[key]) {
                grouped[key] = {
                  id: key,
                  name: s.template_name || s.group || `Template ${key}`,
                  description: s.template_description || '',
                  stages: []
                }
              }
              grouped[key].stages.push({
                sequenceNo: s.sequence_no ?? s.sequenceNo ?? grouped[key].stages.length + 1,
                name: s.name || s.narration || `Stage ${grouped[key].stages.length + 1}`,
                narration: s.narration || s.name || '',
                amountDue: Number(s.amount_due ?? s.amountDue ?? 0),
                amountDueType: (s.amount_due_type || s.amountDueType || 'PERCENTAGE').toUpperCase(),
                dueDays: Number(s.due_days ?? s.dueDays ?? 0),
                dueDaysType: (s.due_days_type || s.dueDaysType || 'AFTER_CONFIRMATION').toUpperCase(),
                isDeposit: !!(s.is_deposit || s.isDeposit),
                isTrophyDeposit: !!(s.is_trophy_deposit || s.isTrophyDeposit),
                description: s.description || ''
              })
            })
            this.paymentPlanTemplates = Object.values(grouped)
          }
        } else {
          this.paymentPlanTemplates = []
        }
        return response
      } catch (err: any) {
        console.warn('[order-store] Could not fetch payment plan templates from backend – no templates available.', err?.message)
        this.paymentPlanTemplates = []
      }
    },

    /**
     * Get all available payment plan templates.
     * Returns templates fetched from the backend (state).
     * Call fetchPaymentPlanTemplates() first to populate.
     */
    getPaymentPlanTemplates(): any[] {
      return this.paymentPlanTemplates
    },

    /**
     * Get a specific payment plan template by ID
     */
    getPaymentPlanTemplate(templateId: string): any | null {
      return this.paymentPlanTemplates.find((t: any) => (t.id ?? t.code) === templateId) || null
    },

    /**
     * Apply a payment plan template to generate installments
     * Calculates fixed amounts from percentages if needed
     */
    applyPaymentPlanTemplate(template: any, totalAmount: number = 0): any[] {
      return (template.stages || []).map((stage: any) => {
        let finalAmount = stage.amountDue

        // Calculate fixed amount if using percentage
        if (stage.amountDueType === 'PERCENTAGE' && totalAmount > 0) {
          finalAmount = (stage.amountDue / 100) * totalAmount
        }

        return {
          ...stage,
          amountDue: finalAmount
        }
      })
    },

    /**
     * Validate installment setup
     * Ensures installments total to 100% (if using percentages) or validates amounts
     */
    validateInstallmentSetup(installments: any[]): { valid: boolean; errors: string[] } {
      const errors: string[] = []

      if (installments.length === 0) {
        errors.push('At least one installment must be defined')
        return { valid: false, errors }
      }

      // Check if using percentages
      const hasPercentages = installments.some((i: any) => i.amountDueType === 'PERCENTAGE')
      const hasFixedAmounts = installments.some((i: any) => i.amountDueType === 'FIXED')

      if (hasPercentages && hasFixedAmounts) {
        errors.push('Cannot mix FIXED and PERCENTAGE amount types in the same payment plan')
      }

      if (hasPercentages) {
        const totalPercentage = installments.reduce((sum: number, i: any) => {
          return sum + (i.amountDueType === 'PERCENTAGE' ? i.amountDue : 0)
        }, 0)

        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push(`Percentages must total 100% (current total: ${totalPercentage.toFixed(2)}%)`)
        }
      }

      if (hasFixedAmounts) {
        const totalAmount = installments.reduce((sum: number, i: any) => {
          return sum + (i.amountDueType === 'FIXED' ? i.amountDue : 0)
        }, 0)

        if (totalAmount <= 0) {
          errors.push('Total fixed amounts must be greater than 0')
        }
      }

      // Check sequence numbers are correct
      const sequences = installments.map((i: any) => i.sequenceNo).sort((a: number, b: number) => a - b)
      for (let i = 0; i < sequences.length; i++) {
        if (sequences[i] !== i + 1) {
          errors.push('Installment sequence numbers must be consecutive starting from 1')
          break
        }
      }

      return {
        valid: errors.length === 0,
        errors
      }
    },

    /**
     * Calculate total order amount from items (items subtotal only, without VAT/expenses)
     */
    calculateOrderTotal(items: any[]): number {
      return items.reduce((sum: number, item: any) => {
        const itemTotal = (item.quantity || 1) * (item.rate || 0)
        return sum + itemTotal
      }, 0)
    },

    /**
     * Get total installment percentage
     */
    getTotalInstallmentPercentage(installments: any[]): number {
      return installments.reduce((sum: number, inst: any) => {
        return inst.amountDueType === 'PERCENTAGE' ? sum + inst.amountDue : sum
      }, 0)
    },

    /**
     * Get total fixed installment amount
     */
    getTotalFixedInstallmentAmount(installments: any[]): number {
      return installments.reduce((sum: number, inst: any) => {
        return inst.amountDueType === 'FIXED' ? sum + inst.amountDue : sum
      }, 0)
    },

    /**
     * Sort installments by due days
     */
    sortInstallmentsByDueDays(installments: any[]): any[] {
      return [...installments].sort((a: any, b: any) => a.dueDays - b.dueDays)
    },

    clearError(): void {
      this.error = null
    }
  }
})
