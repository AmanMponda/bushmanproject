// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8000/api/v1.0/').replace(/\/$/, '')

interface AccountingState {
  // Journal Vouchers
  journalVouchers: any[]
  currentJournalVoucher: any
  journalVoucherStatuses: any[]

  // Invoices
  invoices: any[]
  currentInvoice: any
  invoiceStatuses: any[]

  // Reference Data
  accounts: any[]
  documentTypes: any[]
  currencies: any[]
  paymentInstruments: any[]
  companies: any[]
  branches: any[]
  entities: any[]

  // Linked Documents & Requisitions
  requisitionsForLinking: any[]
  linkedDocuments: any[]
  currentLinkedRequisition: any

  // UI State
  loading: boolean
  error: string | null
  
  // Filters
  filters: {
    search: string
    page: number
    per_page: number
    type: string
    status: string
    documentType: string
  }
}

export const useAccountingStore = defineStore('accounting', {
  state: (): AccountingState => ({
    // Journal Vouchers
    journalVouchers: [] as any[],
    currentJournalVoucher: null as any,
    journalVoucherStatuses: [] as any[],

    // Invoices
    invoices: [] as any[],
    currentInvoice: null as any,
    invoiceStatuses: [] as any[],

    // Reference Data
    accounts: [] as any[],
    documentTypes: [] as any[],
    currencies: [] as any[],
    paymentInstruments: [] as any[],
    companies: [] as any[],
    branches: [] as any[],
    entities: [] as any[],

    // Linked Documents & Requisitions
    requisitionsForLinking: [] as any[],
    linkedDocuments: [] as any[],
    currentLinkedRequisition: null as any,

    // UI State
    loading: false,
    error: null as string | null,

    // Filters
    filters: {
      search: '',
      page: 1,
      per_page: 15,
      type: '',
      status: '',
      documentType: ''
    }
  }),

  getters: {
    // Journal Vouchers
    getJournalVouchers: (state: AccountingState) => state.journalVouchers,
    getCurrentJournalVoucher: (state: AccountingState) => state.currentJournalVoucher,
    getJournalVoucherStatuses: (state: AccountingState) => state.journalVoucherStatuses,

    // Invoices
    getInvoices: (state: AccountingState) => state.invoices,
    getCurrentInvoice: (state: AccountingState) => state.currentInvoice,
    getInvoiceStatuses: (state: AccountingState) => state.invoiceStatuses,

    // Reference Data
    getAccounts: (state: AccountingState) => state.accounts,
    getDocumentTypes: (state: AccountingState) => state.documentTypes,
    getCurrencies: (state: AccountingState) => state.currencies,
    getPaymentInstruments: (state: AccountingState) => state.paymentInstruments,
    getCompanies: (state: AccountingState) => state.companies,
    getBranches: (state: AccountingState) => state.branches,
    getEntities: (state: AccountingState) => state.entities,

    // Linked Documents & Requisitions
    getRequisitionsForLinking: (state: AccountingState) => state.requisitionsForLinking,
    getLinkedDocuments: (state: AccountingState) => state.linkedDocuments,
    getCurrentLinkedRequisition: (state: AccountingState) => state.currentLinkedRequisition,

    // UI State
    isLoading: (state: AccountingState) => state.loading,
    getError: (state: AccountingState) => state.error,
    getFilters: (state: AccountingState) => state.filters
  },

  actions: {
    // ==================== JOURNAL VOUCHERS ====================

    async listJournalVouchers(params: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const queryParams: any = {
          search: this.filters.search,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
          include: 'documentType,currency,accounts,accounts.account',
          ...params
        }

        const config = {
          method: 'get',
          url: `${API_BASE}/journal-vouchers`,
          params: queryParams,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const responseData = response.data.data || response.data || []
        
        console.log('Full API Response:', response.data)
        if (responseData.length > 0) {
          console.log('First voucher keys:', Object.keys(responseData[0]))
          console.log('First voucher accounts:', responseData[0].accounts)
        }
        
        this.journalVouchers = Array.isArray(responseData) ? responseData : []
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading journal vouchers'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getJournalVoucher(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/journal-vouchers/${id}`,
          params: {
            include: 'documentType,currency,accounts,accounts.account,branch,from_account,payee,payee_account,requisitions,requisitions.cost_center,payment_requisitions'
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.currentJournalVoucher = response.data.data || response.data
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading journal voucher'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createJournalVoucher(payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/journal-vouchers`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const newVoucher = response.data.data || response.data
        this.journalVouchers.push(newVoucher)
        this.currentJournalVoucher = newVoucher
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating journal voucher'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateJournalVoucher(id: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/journal-vouchers/${id}`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const updatedVoucher = response.data.data || response.data

        // Update in list
        const index = this.journalVouchers.findIndex((j: any) => j.id === id)
        if (index !== -1) {
          this.journalVouchers[index] = updatedVoucher
        }

        // Update current
        if (this.currentJournalVoucher?.id === id) {
          this.currentJournalVoucher = updatedVoucher
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating journal voucher'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteJournalVoucher(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/journal-vouchers/${id}`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)

        // Remove from list
        this.journalVouchers = this.journalVouchers.filter((j: any) => j.id !== id)

        // Clear current if it was deleted
        if (this.currentJournalVoucher?.id === id) {
          this.currentJournalVoucher = null
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting journal voucher'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addAccountLine(voucherId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/journal-vouchers/${voucherId}/accounts`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error adding account line'
        throw err
      } finally {
        this.loading = false
      }
    },

    async postJournalVoucher(id: number, payload: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/journal-vouchers/${id}/post`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const postedVoucher = response.data.data || response.data

        // Update in list
        const index = this.journalVouchers.findIndex((j: any) => j.id === id)
        if (index !== -1) {
          this.journalVouchers[index] = postedVoucher
        }

        // Update current
        if (this.currentJournalVoucher?.id === id) {
          this.currentJournalVoucher = postedVoucher
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error posting journal voucher'
        throw err
      } finally {
        this.loading = false
      }
    },

    async reverseJournalVoucher(id: number, payload: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/journal-vouchers/${id}/reverse`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const reversedVoucher = response.data.data || response.data

        // Update in list
        const index = this.journalVouchers.findIndex((j: any) => j.id === id)
        if (index !== -1) {
          this.journalVouchers[index] = reversedVoucher
        }

        // Update current
        if (this.currentJournalVoucher?.id === id) {
          this.currentJournalVoucher = reversedVoucher
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error reversing journal voucher'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getJournalVoucherSummary(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/journal-vouchers/${id}/summary`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading journal voucher summary'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== INVOICES ====================

    async listInvoices(params: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const queryParams: any = {
          search: this.filters.search,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
          include: 'documentType,currency,entity,lineItems,settlements',
          ...params
        }

        const config = {
          method: 'get',
          url: `${API_BASE}/invoices`,
          params: queryParams,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const responseData = response.data.data || response.data || []
        this.invoices = Array.isArray(responseData) ? responseData : []
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading invoices'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getInvoice(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/invoices/${id}`,
          params: {
            include: 'documentType,currency,entity,lineItems,lineItems.item,settlements'
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.currentInvoice = response.data.data || response.data
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createInvoice(payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/invoices`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const newInvoice = response.data.data || response.data
        this.invoices.push(newInvoice)
        this.currentInvoice = newInvoice
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateInvoice(id: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/invoices/${id}`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const updatedInvoice = response.data.data || response.data

        // Update in list
        const index = this.invoices.findIndex((i: any) => i.id === id)
        if (index !== -1) {
          this.invoices[index] = updatedInvoice
        }

        // Update current
        if (this.currentInvoice?.id === id) {
          this.currentInvoice = updatedInvoice
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteInvoice(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/invoices/${id}`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)

        // Remove from list
        this.invoices = this.invoices.filter((i: any) => i.id !== id)

        // Clear current if it was deleted
        if (this.currentInvoice?.id === id) {
          this.currentInvoice = null
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addInvoiceLineItem(invoiceId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/invoices/${invoiceId}/line-items`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error adding line item'
        throw err
      } finally {
        this.loading = false
      }
    },

    async approveInvoice(id: number, payload: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/invoices/${id}/approve`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const approvedInvoice = response.data.data || response.data

        // Update in list
        const index = this.invoices.findIndex((i: any) => i.id === id)
        if (index !== -1) {
          this.invoices[index] = approvedInvoice
        }

        // Update current
        if (this.currentInvoice?.id === id) {
          this.currentInvoice = approvedInvoice
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error approving invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    async postInvoice(id: number, payload: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/invoices/${id}/post`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const postedInvoice = response.data.data || response.data

        // Update in list
        const index = this.invoices.findIndex((i: any) => i.id === id)
        if (index !== -1) {
          this.invoices[index] = postedInvoice
        }

        // Update current
        if (this.currentInvoice?.id === id) {
          this.currentInvoice = postedInvoice
        }

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error posting invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    async recordSettlement(invoiceId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/invoices/${invoiceId}/settlements`,
          data: payload,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error recording settlement'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getInvoiceSummary(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/invoices/${id}/summary`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading invoice summary'
        throw err
      } finally {
        this.loading = false
      }
    },

    async searchInvoices(query: string, status: string = 'APPROVED', params: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/invoices/search`,
          params: {
            q: query,
            status: status,
            include: 'documentType,currency,entity,lineItems,lineItems.item',
            limit: 10,
            ...params
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        // Fallback: search from existing invoices list if API endpoint doesn't exist
        const searchResults = this.invoices.filter((inv: any) => {
          const searchLower = query.toLowerCase()
          return (
            (inv.document_number && inv.document_number.toLowerCase().includes(searchLower)) ||
            (inv.reference_no && inv.reference_no.toLowerCase().includes(searchLower)) ||
            (inv.entity?.full_name && inv.entity.full_name.toLowerCase().includes(searchLower))
          ) && (!status || inv.status === status)
        })
        return { data: { data: searchResults.slice(0, 10) } }
      } finally {
        this.loading = false
      }
    },

    async createJournalVoucherFromInvoice(invoiceId: number, payload: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/journal-vouchers/from-invoice`,
          data: {
            invoice_id: invoiceId,
            ...payload
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        const createdJV = response.data.data || response.data
        
        // Add to journal vouchers list
        if (!this.journalVouchers.find((jv: any) => jv.id === createdJV.id)) {
          this.journalVouchers.push(createdJV)
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating journal voucher from invoice'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== REFERENCE DATA ====================

    async fetchAccounts(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/accounts`,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.accounts = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.accounts = []
      }
    },

    async fetchDocumentTypes(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/document-types`,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.documentTypes = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.documentTypes = []
      }
    },

    async fetchCurrencies(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/currencies`,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.currencies = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.currencies = []
      }
    },

    async fetchPaymentInstruments(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/payment-instruments`,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.paymentInstruments = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.paymentInstruments = []
      }
    },

    async fetchCompanies(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/companies`,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.companies = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.companies = []
      }
    },

    async fetchBranches(companyId?: number, params: any = {}): Promise<any> {
      this.error = null
      try {
        // If companyId is provided, use company-specific endpoint
        // Otherwise, fetch all branches
        const url = companyId 
          ? `${API_BASE}/companies/${companyId}/branches`
          : `${API_BASE}/branches`
        
        const config = {
          method: 'get',
          url,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.branches = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.branches = []
        return { data: { data: [] } }
      }
    },

    async fetchEntities(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/entities`,
          params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.entities = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.entities = []
      }
    },

    async fetchJournalVoucherStatuses(): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/journal-voucher-statuses`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.journalVoucherStatuses = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.journalVoucherStatuses = []
      }
    },

    async fetchInvoiceStatuses(): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/invoice-statuses`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.invoiceStatuses = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.invoiceStatuses = []
      }
    },

    // ==================== LINKED DOCUMENTS & REQUISITIONS ====================

    async fetchRequisitionsForLinking(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/requisitions/available-for-linking`,
          params: {
            include: 'requisitionType,company,branch,items,items.materials,items.accounts,requisitionNumber',
            status: 'APPROVED',
            ...params
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.requisitionsForLinking = response.data.data || response.data || []
        return response
      } catch (err: any) {
        // Fallback: Try regular requisitions endpoint if available-for-linking doesn't exist
        try {
          const config = {
            method: 'get',
            url: `${API_BASE}/requisitions`,
            params: {
              include: 'requisitionType,company,branch,items,items.materials,items.accounts,requisitionNumber',
              status: 'APPROVED',
              ...params
            },
            headers: { 'Content-Type': 'application/json' }
          }
          const fallbackResponse: any = await axios.request(config)
          this.requisitionsForLinking = fallbackResponse.data.data || fallbackResponse.data || []
          return fallbackResponse
        } catch (fallbackErr: any) {
          console.error('Failed to fetch requisitions:', fallbackErr?.message)
          this.requisitionsForLinking = []
          return { data: { data: [] } }
        }
      }
    },

    async getRequisitionDetails(requisitionId: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/requisitions/${requisitionId}`,
          params: {
            include: 'requisitionType,company,branch,items,items.materials,items.accounts,sources'
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.currentLinkedRequisition = response.data.data || response.data
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading requisition details'
        throw err
      }
    },

    async getRequisitionItems(requisitionId: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/requisitions/${requisitionId}/items`,
          params: {
            include: 'materials,accounts'
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading requisition items'
        throw err
      }
    },

    async linkJournalVoucherAccount(
      journalVoucherId: number,
      accountLineId: number,
      linkableType: string,
      linkableId: number,
      role?: string
    ): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/journal-vouchers/${journalVoucherId}/accounts/${accountLineId}/links`,
          data: {
            linkable_type: linkableType,
            linkable_id: linkableId,
            role: role || null
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error linking document'
        throw err
      }
    },

    async getLinkedDocumentsForVoucher(journalVoucherId: number, accountLineId: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/journal-vouchers/${journalVoucherId}/accounts/${accountLineId}/links`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.linkedDocuments = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.linkedDocuments = []
      }
    },

    async unlinkDocument(journalVoucherId: number, accountLineId: number, linkId: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/journal-vouchers/${journalVoucherId}/accounts/${accountLineId}/links/${linkId}`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        // Remove from linked documents array
        this.linkedDocuments = this.linkedDocuments.filter((link: any) => link.id !== linkId)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error unlinking document'
        throw err
      }
    },

    async linkInvoiceDocument(
      invoiceId: number,
      linkableType: string,
      linkableId: number,
      role?: string
    ): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/invoices/${invoiceId}/links`,
          data: {
            linkable_type: linkableType,
            linkable_id: linkableId,
            role: role || null
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error linking document to invoice'
        throw err
      }
    },

    async getInvoiceLinkedDocuments(invoiceId: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/invoices/${invoiceId}/links`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        this.linkedDocuments = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.linkedDocuments = []
      }
    },

    async unlinkInvoiceDocument(invoiceId: number, linkId: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/invoices/${invoiceId}/links/${linkId}`,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        // Remove from linked documents array
        this.linkedDocuments = this.linkedDocuments.filter((link: any) => link.id !== linkId)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error unlinking document from invoice'
        throw err
      }
    },

    // ==================== PAYMENT VOUCHERS ====================

    async getBankCashAccounts(companyId?: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/accounts/bank-cash-accounts`,
          params: {
            company_id: companyId || 1
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching bank/cash accounts'
        console.error('Bank/Cash Accounts Error:', err)
        throw err
      }
    },

    async getApprovedRequisitionsForPayee(payeeId: number, fromAccountId: number, companyId?: number): Promise<any> {
      this.error = null
      try {
        if (!payeeId || !fromAccountId) {
          throw new Error('Payee ID and From Account ID are required')
        }

        const config = {
          method: 'get',
          url: `${API_BASE}/requisitions/approved-for-payee`,
          params: {
            payee_id: payeeId,
            from_account_id: fromAccountId,
            company_id: companyId || 1,
            status: 'APPROVED',
            with_balance: true
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        
        // Validate response structure
        if (!response.data?.data && !Array.isArray(response.data)) {
          console.warn('Unexpected response structure for approved requisitions:', response)
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || err.message || 'Error fetching approved requisitions'
        console.error('Approved Requisitions Error:', err)
        throw err
      }
    },

    async savePaymentVoucherDraft(payload: any): Promise<any> {
      this.error = null
      try {
        // Validate required fields
        if (!payload.from_account_id || !payload.payee_id || !payload.currency_id) {
          throw new Error('Missing required fields: from_account_id, payee_id, currency_id')
        }

        if (!payload.requisitions || payload.requisitions.length === 0) {
          throw new Error('At least one requisition must be selected')
        }

        const config = {
          method: 'post',
          url: `${API_BASE}/payment-vouchers/draft`,
          data: {
            company_id: payload.company_id || 1,
            voucher_type: 'PAYMENT',
            posting_date: payload.posting_date,
            branch_id: payload.branch_id || null,
            currency_id: payload.currency_id,
            exchange_rate: payload.exchange_rate || 1.0,
            from_account_id: payload.from_account_id,
            payment_method: payload.payment_method,
            payee_id: payload.payee_id,
            payee_account: payload.payee_account || null,
            total_amount: payload.total_amount || 0,
            narration: payload.narration,
            status: 'DRAFT',
            requisitions: payload.requisitions
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || err.message || 'Error saving payment voucher draft'
        console.error('Save Draft Error:', err)
        throw err
      }
    },

    async postPaymentVoucher(payload: any): Promise<any> {
      this.error = null
      try {
        // Validate required fields
        if (!payload.from_account_id || !payload.payee_id || !payload.currency_id) {
          throw new Error('Missing required fields: from_account_id, payee_id, currency_id')
        }

        if (!payload.requisitions || payload.requisitions.length === 0) {
          throw new Error('At least one requisition must be selected')
        }

        const config = {
          method: 'post',
          url: `${API_BASE}/payment-vouchers/post`,
          data: {
            company_id: payload.company_id || 1,
            voucher_type: 'PAYMENT',
            posting_date: payload.posting_date,
            branch_id: payload.branch_id || null,
            currency_id: payload.currency_id,
            exchange_rate: payload.exchange_rate || 1.0,
            from_account_id: payload.from_account_id,
            payment_method: payload.payment_method,
            payee_id: payload.payee_id,
            payee_account: payload.payee_account || null,
            total_amount: payload.total_amount || 0,
            narration: payload.narration,
            status: 'POSTED',
            requisitions: payload.requisitions
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || err.message || 'Error posting payment voucher'
        console.error('Post Voucher Error:', err)
        throw err
      }
    },

    async getPaymentVouchers(filters?: any): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/payment-vouchers`,
          params: filters || {},
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching payment vouchers'
        throw err
      }
    },

    async getPaymentVoucher(id: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/payment-vouchers/${id}`,
          params: {
            include: 'from_account,payee,payee_account,currency,requisitions,requisitions.cost_center'
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching payment voucher'
        throw err
      }
    },

    // ==================== FILTER MANAGEMENT ====================

    setSearchFilter(search: string) {
      this.filters.search = search
      this.filters.page = 1
    },

    setStatusFilter(status: string) {
      this.filters.status = status
      this.filters.page = 1
    },

    setTypeFilter(type: string) {
      this.filters.type = type
      this.filters.page = 1
    },

    setPageNumber(page: number) {
      this.filters.page = page
    },

    setPageSize(size: number) {
      this.filters.per_page = size
      this.filters.page = 1
    },

    resetFilters() {
      this.filters = {
        search: '',
        page: 1,
        per_page: 15,
        type: '',
        status: '',
        documentType: ''
      }
    },

    async fetchPayees(companyId?: number, params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/payees`,
          params: {
            company_id: companyId || 1,
            status: 'ACTIVE',
            ...params
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching payees'
        console.error('Fetch Payees Error:', err)
        return { data: { data: [] } }
      }
    },

    async fetchPayeeAccount(payeeId: number, companyId?: number): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/payment-vouchers/payee-accounts`,
          params: {
            payee_id: payeeId,
            company_id: companyId || 1
          },
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response.data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching payee account'
        console.error('Fetch Payee Account Error:', err)
        return { success: false, data: null }
      }
    },

    async fetchPayableAccounts(params: any = {}): Promise<any> {
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/payment-vouchers/payable-accounts`,
          params: params,
          headers: { 'Content-Type': 'application/json' }
        }

        const response: any = await axios.request(config)
        return response.data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error fetching payable accounts'
        console.error('Fetch Payable Accounts Error:', err)
        return { data: { data: [] } }
      }
    }
  }
})
