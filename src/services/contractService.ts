import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

const contractsUrl = () => `${apiBase}/contracts`

export const contractService = {
  // ==================== CONTRACTS CRUD ====================
  
  list(params = {}) {
    return axios.get(contractsUrl(), { params })
  },
  
  get(id: number) {
    return axios.get(`${contractsUrl()}/${id}`)
  },
  
  create(payload: any) {
    return axios.post(contractsUrl(), payload)
  },
  
  update(id: number, payload: any) {
    return axios.put(`${contractsUrl()}/${id}`, payload)
  },
  
  remove(id: number) {
    return axios.delete(`${contractsUrl()}/${id}`)
  },

  // ==================== CONTRACT TYPES ====================
  
  getContractTypes() {
    return axios.get(`${apiBase}/contracts/contract-types`)
  },

  // ==================== CONTRACT STATUSES ====================
  
  getContractStatuses() {
    return axios.get(`${apiBase}/contracts/contract-statuses`)
  },

  // ==================== CONTRACT VERSIONS ====================
  
  listVersions(contractId: number, params = {}) {
    return axios.get(`${contractsUrl()}/${contractId}/versions`, { params })
  },

  getVersion(contractId: number, versionId: number) {
    return axios.get(`${contractsUrl()}/${contractId}/versions/${versionId}`)
  },

  createVersion(contractId: number, payload: any) {
    return axios.post(`${contractsUrl()}/${contractId}/versions`, payload)
  },

  updateVersion(contractId: number, versionId: number, payload: any) {
    return axios.put(`${contractsUrl()}/${contractId}/versions/${versionId}`, payload)
  },

  // ==================== CONTRACT PARTIES ====================
  
  listParties(contractId: number, params = {}) {
    return axios.get(`${contractsUrl()}/${contractId}/parties`, { params })
  },

  addParty(contractId: number, payload: any) {
    return axios.post(`${contractsUrl()}/${contractId}/parties`, payload)
  },

  updateParty(contractId: number, partyId: number, payload: any) {
    return axios.put(`${contractsUrl()}/${contractId}/parties/${partyId}`, payload)
  },

  removeParty(contractId: number, partyId: number) {
    return axios.delete(`${contractsUrl()}/${contractId}/parties/${partyId}`)
  },

  // ==================== CONTRACT BILLING SCHEDULES ====================
  
  listBillingSchedules(contractId: number, params = {}) {
    return axios.get(`${contractsUrl()}/${contractId}/billing-schedules`, { params })
  },

  addBillingSchedule(contractId: number, payload: any) {
    return axios.post(`${contractsUrl()}/${contractId}/billing-schedules`, payload)
  },

  updateBillingSchedule(contractId: number, scheduleId: number, payload: any) {
    return axios.put(`${contractsUrl()}/${contractId}/billing-schedules/${scheduleId}`, payload)
  },

  removeBillingSchedule(contractId: number, scheduleId: number) {
    return axios.delete(`${contractsUrl()}/${contractId}/billing-schedules/${scheduleId}`)
  },

  // ==================== CONTRACT LINKS ====================
  
  listLinks(contractId: number, params = {}) {
    return axios.get(`${contractsUrl()}/${contractId}/links`, { params })
  },

  addLink(contractId: number, payload: any) {
    return axios.post(`${contractsUrl()}/${contractId}/links`, payload)
  },

  removeLink(contractId: number, linkId: number) {
    return axios.delete(`${contractsUrl()}/${contractId}/links/${linkId}`)
  },

  // ==================== DOCUMENT GENERATION ====================
  
  generatePdf(contractId: number, versionId?: number) {
    const url = versionId 
      ? `${contractsUrl()}/${contractId}/versions/${versionId}/pdf`
      : `${contractsUrl()}/${contractId}/pdf`
    return axios.get(url, { responseType: 'blob' })
  },

  // ==================== CONTRACT SEARCH & FILTERS ====================
  
  searchByNumber(contractNumber: string) {
    return axios.get(`${contractsUrl()}/search`, { params: { contract_number: contractNumber } })
  },

  filterByStatus(status: string, params = {}) {
    return axios.get(contractsUrl(), { params: { status, ...params } })
  },

  filterByType(typeId: number, params = {}) {
    return axios.get(contractsUrl(), { params: { contract_type_id: typeId, ...params } })
  }
}

export default contractService
