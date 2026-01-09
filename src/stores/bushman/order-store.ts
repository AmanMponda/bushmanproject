// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}orders`

interface OrderState {
  orders: any[]
  currentOrder: any
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
  itemCategories: any[]
  logisticsTypes: any[]
  installmentSetups: any[]
  installmentDaysTypes: any[]
  installmentAmountTypes: any[]
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
    orderTypes: [] as any[],
    orderStatuses: [] as any[],
    enquiries: [] as any[],
    quotations: [] as any[],
    currencies: [] as any[],
    entities: [] as any[],
    unitOfMeasurements: [] as any[],
    dietaryPreferences: [] as any[],
    allergies: [] as any[],
    partyRoles: [] as any[],
    itemCategories: [] as any[],
    logisticsTypes: [] as any[],
    installmentSetups: [] as any[],
    installmentDaysTypes: [
      { value: 'AFTER_INVOICE', label: 'After Invoice' },
      { value: 'AFTER_DELIVERY', label: 'After Delivery' },
      { value: 'AFTER_CONFIRMATION', label: 'After Confirmation' }
    ] as any[],
    installmentAmountTypes: [
      { value: 'FIXED', label: 'Fixed Amount' },
      { value: 'PERCENTAGE', label: 'Percentage' }
    ] as any[],
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
    getItemCategories: (state: OrderState) => state.itemCategories,
    getLogisticsTypes: (state: OrderState) => state.logisticsTypes,
    getInstallmentSetups: (state: OrderState) => state.installmentSetups,
    getInstallmentDaysTypes: (state: OrderState) => state.installmentDaysTypes,
    getInstallmentAmountTypes: (state: OrderState) => state.installmentAmountTypes,
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
          include: 'parties,parties.entity,items',
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
        console.log('Orders loaded:', this.orders)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading orders'
        console.error('Error loading orders:', this.error, err.response)
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
            include: 'parties,parties.entity,items,sales_details,order_payments,payment_schedule,documents,preferences'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.currentOrder = response.data.data || response.data
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading order'
        console.error('Error loading order:', this.error)
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
        console.error('Error creating order:', this.error)
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
        console.error('Error updating order:', this.error)
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
        console.error('Error deleting order:', this.error)
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
        console.error('Error loading order items:', this.error)
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== ORDER TYPES ====================

    async fetchOrderTypes(): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/order-types`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.orderTypes = response.data.data || response.data || []
        return response
      } catch (err: any) {
        console.error('Error loading order types:', err?.response?.data?.message || err.message)
        // Fail silently and return empty array
        this.orderTypes = []
      } finally {
        this.loading = false
      }
    },

    // ==================== ORDER STATUSES ====================

    async fetchOrderStatuses(): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/order-statuses`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.orderStatuses = response.data.data || response.data || []
        return response
      } catch (err: any) {
        console.error('Error loading order statuses:', err?.response?.data?.message || err.message)
        // Fail silently and return empty array
        this.orderStatuses = []
      } finally {
        this.loading = false
      }
    },

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
        console.error('Error loading logistics types:', err?.response?.data?.message || err.message)
        // Fail silently and return empty array
        this.logisticsTypes = []
      } finally {
        this.loading = false
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
        console.error('Error loading enquiries:', err?.response?.data?.message || err.message)
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
        console.error(`Error loading quotations for enquiry ${enquiryId}:`, err?.response?.data?.message || err.message)
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
        console.error('Error loading quotations:', err?.response?.data?.message || err.message)
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
        console.error('Error loading currencies:', err?.response?.data?.message || err.message)
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
        console.error('Error loading dietary preferences:', err?.response?.data?.message || err.message)
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
        console.error('Error loading allergies:', err?.response?.data?.message || err.message)
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
        console.error('Error loading party roles:', err?.response?.data?.message || err.message)
        this.partyRoles = []
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
        console.error('Error loading item categories:', err?.response?.data?.message || err.message)
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
        console.error('Error loading entities:', err?.response?.data?.message || err.message)
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
        console.error('Error loading unit of measurements:', err?.response?.data?.message || err.message)
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
        console.error('Error loading installments:', err?.response?.data?.message || err.message)
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
        console.error('Error creating installment:', this.error)
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
        console.error('Error updating installment:', this.error)
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
        console.error('Error deleting installment:', this.error)
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
        console.error('Error loading installment days types:', err?.response?.data?.message || err.message)
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
        console.error('Error loading installment amount types:', err?.response?.data?.message || err.message)
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
        console.error('Error fetching enquiry with quotations:', this.error)
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
        console.error('Error creating order from quotation:', this.error)
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
        console.error('Error linking quotation to order:', this.error)
        throw err
      } finally {
        this.loading = false
      }
    },

    clearError(): void {
      this.error = null
    }
  }
})
