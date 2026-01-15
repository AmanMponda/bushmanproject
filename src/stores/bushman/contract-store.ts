// @ts-nocheck
import { defineStore } from 'pinia'
import axios from 'axios'

const getApiBase = () => (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
const CM_BASE = () => `${getApiBase()}/contract-management`
const CONTRACTS_BASE = () => `${getApiBase()}/contract-management`

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
    async listContracts(params: any = {}): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const queryParams: any = {
          search: this.filters.search || undefined,
          type: this.filters.type || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
          include: 'parties,parties.entity,versions,billingSchedules,links',
          ...params
        }
        const url = `${CONTRACTS_BASE()}/`
        console.log('📋 Fetching contracts from:', url, 'with params:', queryParams)
        const response: any = await axios.get(url, { params: queryParams })
        console.log('✅ Contracts API Response:', response)
        console.log('🔍 Full response.data.data:', response.data?.data)
        console.log('🔍 Keys in response.data.data:', Object.keys(response.data?.data || {}))
        
        // Handle different API response structures
        let responseData = []
        const dataObj = response.data?.data
        
        if (dataObj) {
          // Try to find array in various possible locations
          if (Array.isArray(dataObj)) {
            console.log('✅ response.data.data is already an array')
            responseData = dataObj
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            console.log('✅ Found array at response.data.data.data')
            responseData = dataObj.data
          } else if (dataObj.items && Array.isArray(dataObj.items)) {
            console.log('✅ Found array at response.data.data.items')
            responseData = dataObj.items
          } else if (dataObj.contracts && Array.isArray(dataObj.contracts)) {
            console.log('✅ Found array at response.data.data.contracts')
            responseData = dataObj.contracts
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            console.log('✅ Found array at response.data.data.results')
            responseData = dataObj.results
          } else {
            // If it's an object, try to find first array property
            for (const [key, value] of Object.entries(dataObj)) {
              if (Array.isArray(value)) {
                console.log(`✅ Found array at response.data.data.${key}`)
                responseData = value
                break
              }
            }
          }
        }
        
        console.log('📊 Final extracted data:', responseData)
        console.log('📊 First contract sample:', responseData[0])
        if (responseData[0]) {
          console.log('📊 First contract keys:', Object.keys(responseData[0]))
          console.log('📊 Status value in first contract:', responseData[0].status || 'MISSING')
        }
        console.log('📊 Contracts loaded:', Array.isArray(responseData) ? responseData.length : 0, 'items')
        this.contracts = Array.isArray(responseData) ? responseData : []
        return response
      } catch (err: any) {
        console.error('❌ Error loading contracts:', err)
        console.error('Response:', err.response?.data)
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
        const response: any = await axios.get(`${CONTRACTS_BASE()}/${id}`, { params: { include: 'parties,parties.entity,versions,billingSchedules,links' } })
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
        const response: any = await axios.post(`${CONTRACTS_BASE()}/`, payload, { headers: { 'Content-Type': 'application/json' } })
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
        const response: any = await axios.put(`${CONTRACTS_BASE()}/${id}`, payload, { headers: { 'Content-Type': 'application/json' } })
        const updatedContract = response.data.data || response.data
        const index = this.contracts.findIndex((c: any) => c.id === id)
        if (index !== -1) this.contracts[index] = updatedContract
        if (this.currentContract?.id === id) this.currentContract = updatedContract
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
        const response: any = await axios.delete(`${CONTRACTS_BASE()}/${id}`)
        this.contracts = this.contracts.filter((c: any) => c.id !== id)
        if (this.currentContract?.id === id) this.currentContract = null
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting contract'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getContractVersions(contractId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const response: any = await axios.get(`${CONTRACTS_BASE()}/${contractId}/versions`)
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
        const response: any = await axios.post(`${CONTRACTS_BASE()}/${contractId}/versions`, payload)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error creating contract version'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateVersion(contractId: number, versionId: number, payload: any): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const response: any = await axios.put(`${CONTRACTS_BASE()}/${contractId}/versions/${versionId}`, payload)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error updating contract version'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteVersion(contractId: number, versionId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        const response: any = await axios.delete(`${CONTRACTS_BASE()}/${contractId}/versions/${versionId}`)
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error deleting contract version'
        throw err
      } finally {
        this.loading = false
      }
    },

    async downloadVersionFile(contractId: number, versionId: number) {
      return axios.get(`${CONTRACTS_BASE()}/${contractId}/versions/${versionId}/file`, { responseType: 'blob' })
    },

    async fetchContractTypes(): Promise<any> {
      this.loading = true
      try {
        const response: any = await axios.get(`${CM_BASE()}/contract-types`)
        this.contractTypes = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.contractTypes = []
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchContractStatuses(): Promise<any> {
      this.loading = true
      try {
        const response: any = await axios.get(`${CM_BASE()}/contract-statuses`)
        this.contractStatuses = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.contractStatuses = []
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPartyRoles(): Promise<any> {
      this.loading = true
      try {
        const response: any = await axios.get(`${CM_BASE()}/party-roles`)
        this.partyRoles = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.partyRoles = []
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchCurrencies(): Promise<any> {
      this.loading = true
      try {
        const response: any = await axios.get(`${CM_BASE()}/currencies`)
        this.currencies = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.currencies = []
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchEntities(params: any = {}): Promise<any> {
      this.loading = true
      try {
        const apiBase = getApiBase()
        const response: any = await axios.get(`${apiBase}/entities/`, { params })
        this.entities = response.data.data || response.data || []
        return response
      } catch (err: any) {
        this.entities = []
        throw err
      } finally {
        this.loading = false
      }
    },

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
