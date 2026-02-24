// @ts-nocheck
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

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
  versions: any[]
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
    versions: [] as any[],
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
        const response: any = await axios.get(url, { params: queryParams })

        // Handle different API response structures
        let responseData: any[] = []
        const dataObj = response.data?.data

        if (dataObj) {
          // Try to find array in various possible locations
          if (Array.isArray(dataObj)) {
            responseData = dataObj
          } else if (Array.isArray(dataObj.data)) {
            responseData = dataObj.data
          } else if (Array.isArray(dataObj.items)) {
            responseData = dataObj.items
          } else if (Array.isArray(dataObj.contracts)) {
            responseData = dataObj.contracts
          } else if (Array.isArray(dataObj.results)) {
            responseData = dataObj.results
          } else {
            // If it's an object, try to find first array property
            for (const [key, value] of Object.entries(dataObj)) {
              if (Array.isArray(value)) {
                responseData = value
                break
              }
            }
          }
        } else if (Array.isArray(response.data)) {
          responseData = response.data
        }

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
        const authStore = useAuthStore()
        const enrichedPayload = { ...payload, updated_by: payload.updated_by || authStore.user?.id || null }
        const response: any = await axios.put(`${CONTRACTS_BASE()}/${id}`, enrichedPayload, { headers: { 'Content-Type': 'application/json' } })
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
        this.versions = response.data?.data || response.data || []
        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error loading contract versions'
        throw err
      } finally {
        this.loading = false
      }
    },

    async signVersion(contractId: number, versionId: number): Promise<any> {
      this.loading = true
      this.error = null
      try {
        // Dedicated POST /sign endpoint — backend sets status=SIGNED + signed_at=now
        const response: any = await axios.post(
          `${CONTRACTS_BASE()}/${contractId}/versions/${versionId}/sign`
        )

        // Also update the parent contract status to ACTIVE after signing
        await this.updateContract(contractId, {
          status: 'ACTIVE',
          signed_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })

        return response
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Error signing contract version'
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
        const url = `${CONTRACTS_BASE()}/${contractId}/versions/${versionId}`

        // Backend accepts PUT with multipart/form-data for file uploads
        if (payload instanceof FormData) {
          const response: any = await axios.put(url, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          return response
        }

        // JSON payload (e.g. status update without file)
        const response: any = await axios.put(url, payload)
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
      // Backend returns either a file blob OR a JSON with base64 PDF
      // First try as JSON to handle the base64 fallback case
      try {
        const response: any = await axios.get(
          `${CONTRACTS_BASE()}/${contractId}/versions/${versionId}/download`
        )
        // If response has .pdf field, it's the base64 fallback
        if (response.data?.pdf) {
          return { type: 'base64', data: response.data }
        }
        // Otherwise it's a blob/file — shouldn't reach here with default responseType
        return { type: 'blob', data: response.data }
      } catch {
        // Fallback: try as blob (for actual file downloads)
        const response: any = await axios.get(
          `${CONTRACTS_BASE()}/${contractId}/versions/${versionId}/download`,
          { responseType: 'blob' }
        )
        return { type: 'blob', data: response.data }
      }
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
