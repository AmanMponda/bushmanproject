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
            include: 'documentType,currency,accounts,accounts.account'
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
            include: 'requisitionType,company,branch,items,items.materials,items.accounts',
            status: 'APPROVAL_PENDING,APPROVED,CLOSED',
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
              include: 'requisitionType,company,branch,items,items.materials,items.accounts',
              status: 'APPROVAL_PENDING,APPROVED,CLOSED',
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
    }
  }
})
