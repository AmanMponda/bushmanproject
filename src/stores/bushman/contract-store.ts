// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = `${(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')}/contract-management`

interface ContractState {
  contracts: any[]
  currentContract: any
  contractTypes: any[]
  contractStatuses: any[]
  currencies: any[]
  entities: any[]
  partyRoles: any[]
  billingScheduleTypes: any[]
  renewalTerms: any[]
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

export const useContractStore = defineStore('contract', {
  state: (): ContractState => ({
    contracts: [] as any[],
    currentContract: null as any,
    contractTypes: [] as any[],
    contractStatuses: [] as any[],
    currencies: [] as any[],
    entities: [] as any[],
    partyRoles: [] as any[],
    billingScheduleTypes: [] as any[],
    renewalTerms: [] as any[],
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
    getContracts: (state: ContractState) => state.contracts,
    getCurrentContract: (state: ContractState) => state.currentContract,
    getContractTypes: (state: ContractState) => state.contractTypes,
    getContractStatuses: (state: ContractState) => state.contractStatuses,
    getCurrencies: (state: ContractState) => state.currencies,
    getEntities: (state: ContractState) => state.entities,
    getPartyRoles: (state: ContractState) => state.partyRoles,
    getBillingScheduleTypes: (state: ContractState) => state.billingScheduleTypes,
    getRenewalTerms: (state: ContractState) => state.renewalTerms,
    isLoading: (state: ContractState) => state.loading,
    getError: (state: ContractState) => state.error
  },

  actions: {
    // ==================== CONTRACTS CRUD ====================
    
    async listContracts(params: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const queryParams: any = {
          search: this.filters.search,
          type: this.filters.type || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
          include: 'parties,parties.entity,versions,billingSchedules,links',
          ...params
        }

        console.log('🔍 Fetching contracts with params:', queryParams)
        console.log('📍 API URL:', API_BASE)

        const config = {
          method: 'get',
          url: API_BASE,
          params: queryParams,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        console.log('📦 API Response:', response.data)
        
        const responseData = response.data.data || response.data || []
        this.contracts = Array.isArray(responseData) ? responseData : []
        
        console.log('✅ Contracts stored:', this.contracts.length, 'contracts')
        return response
      } catch (err: any) {
        console.error('❌ Error fetching contracts:', err.message)
        console.error('❌ Error response:', err.response?.data)
        this.error = err?.response?.data?.message || 'Error loading contracts'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getContract(id: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${id}`,
          params: {
            include: 'parties,parties.entity,versions,billingSchedules,links'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        this.currentContract = response.data.data || response.data
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading contract'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createContract(payload: any): Promise<any> {
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
        const newContract = response.data.data || response.data
        this.contracts.push(newContract)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating contract'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateContract(id: number, payload: any): Promise<any> {
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
        const updatedContract = response.data.data || response.data
        
        // Update in list
        const index = this.contracts.findIndex((c: any) => c.id === id)
        if (index !== -1) {
          this.contracts[index] = updatedContract
        }
        
        // Update current
        if (this.currentContract?.id === id) {
          this.currentContract = updatedContract
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating contract'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteContract(id: number): Promise<any> {
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
        this.contracts = this.contracts.filter((c: any) => c.id !== id)
        
        // Clear current if it was deleted
        if (this.currentContract?.id === id) {
          this.currentContract = null
        }
        
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting contract'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CONTRACT PARTIES ====================

    async getContractParties(contractId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${contractId}/parties`,
          params: {
            include: 'entity'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading contract parties'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addContractParty(contractId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${contractId}/parties`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error adding contract party'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateContractParty(contractId: number, partyId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${contractId}/parties/${partyId}`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating contract party'
        throw err
      } finally {
        this.loading = false
      }
    },

    async removeContractParty(contractId: number, partyId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/${contractId}/parties/${partyId}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error removing contract party'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CONTRACT VERSIONS ====================

    async getContractVersions(contractId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${contractId}/versions`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading contract versions'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addContractVersion(contractId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${contractId}/versions`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating contract version'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CONTRACT BILLING SCHEDULES ====================

    async getContractBillingSchedules(contractId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${contractId}/billing-schedules`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading billing schedules'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addBillingSchedule(contractId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${contractId}/billing-schedules`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error adding billing schedule'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateBillingSchedule(contractId: number, scheduleId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'put',
          url: `${API_BASE}/${contractId}/billing-schedules/${scheduleId}`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating billing schedule'
        throw err
      } finally {
        this.loading = false
      }
    },

    async removeBillingSchedule(contractId: number, scheduleId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/${contractId}/billing-schedules/${scheduleId}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error removing billing schedule'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CONTRACT LINKS ====================

    async getContractLinks(contractId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'get',
          url: `${API_BASE}/${contractId}/links`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading contract links'
        throw err
      } finally {
        this.loading = false
      }
    },

    async addContractLink(contractId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'post',
          url: `${API_BASE}/${contractId}/links`,
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error adding contract link'
        throw err
      } finally {
        this.loading = false
      }
    },

    async removeContractLink(contractId: number, linkId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const config = {
          method: 'delete',
          url: `${API_BASE}/${contractId}/links/${linkId}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const response: any = await axios.request(config)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error removing contract link'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CONTRACT TYPES ====================

    async fetchContractTypes(): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const response: any = await axios.get(`${API_BASE}/contract-types`)
        this.contractTypes = response.data.data || response.data || []
        console.log('✅ Contract Types:', this.contractTypes)
        return response
      } catch (err: any) {
        console.error('❌ Error fetching contract types:', err.message)
        this.contractTypes = []
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CONTRACT STATUSES ====================

    async fetchContractStatuses(): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const response: any = await axios.get(`${API_BASE}/contract-statuses`)
        this.contractStatuses = response.data.data || response.data || []
        console.log('✅ Contract Statuses:', this.contractStatuses)
        return response
      } catch (err: any) {
        console.error('❌ Error fetching contract statuses:', err.message)
        this.contractStatuses = []
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== PARTY ROLES ====================

    async fetchPartyRoles(): Promise<any> {
      this.loading = true
      try {
        const response: any = await axios.get(`${API_BASE}/party-roles`)
        this.partyRoles = response.data.data || response.data || []
        console.log('✅ Party Roles:', this.partyRoles)
        return response
      } catch (err: any) {
        console.error('❌ Error fetching party roles:', err.message)
        this.partyRoles = []
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== CURRENCIES ====================

    async fetchCurrencies(): Promise<any> {
      this.loading = true
      try {
        const response: any = await axios.get(`${API_BASE}/currencies`)
        this.currencies = response.data.data || response.data || []
        console.log('✅ Currencies:', this.currencies)
        return response
      } catch (err: any) {
        console.error('❌ Error fetching currencies:', err.message)
        this.currencies = []
        throw err
      } finally {
        this.loading = false
      }
    },

    // ==================== ENTITIES ====================

    async fetchEntities(params: any = {}): Promise<any> {
      this.loading = true
      try {
        const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
        const config = {
          method: 'get',
          url: `${apiBase}/entities/`,
          params,
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
    }
  }
})
