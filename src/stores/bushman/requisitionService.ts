import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const currentUserId = authStore.user?.id || 0


const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}requisitions`
const TYPES_BASE = `${import.meta.env.VITE_APP_BASE_URL}requisition-types`
const DIMENSIONS_BASE = `${import.meta.env.VITE_APP_BASE_URL}accounting-dimensions`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const requisitionService = {
  async list(params: Record<string, any> = {}) {
    const response = await axios.get(API_BASE, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async summary(params: Record<string, any> = {}) {
    const response = await axios.get(`${API_BASE}/summary`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async pendingApprovals(params: Record<string, any> = {}) {
    const response = await axios.get(`${API_BASE}/pending-approvals`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async get(id: number) {
    const response = await axios.get(`${API_BASE}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async create(payload: Record<string, any>) {
    const response = await axios.post(API_BASE, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async update(id: number, payload: Record<string, any>) {
    const response = await axios.put(`${API_BASE}/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async patch(id: number, payload: Record<string, any>) {
    const response = await axios.patch(`${API_BASE}/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async delete(id: number) {
    const response = await axios.delete(`${API_BASE}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async submit(id: number) {
    const response = await axios.post(`${API_BASE}/${id}/submit`, {}, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async approve(id: number, payload: Record<string, any> = {}) {
    const safePayload = payload && typeof payload === 'object' ? payload : {}
    const body = {
      user_id: currentUserId,
      ...safePayload,
    }

    const response = await axios.post(`${API_BASE}/${id}/approve`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async reject(id: number, payload: Record<string, any>) {
    const response = await axios.post(`${API_BASE}/${id}/reject`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async cancel(id: number, payload: Record<string, any>) {
    const response = await axios.post(`${API_BASE}/${id}/cancel`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async close(id: number) {
    const response = await axios.post(`${API_BASE}/${id}/close`, {}, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async addSource(requisitionId: number, payload: Record<string, any>) {
    const response = await axios.post(`${API_BASE}/${requisitionId}/sources`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async updateSource(requisitionId: number, sourceId: number, payload: Record<string, any>) {
    const response = await axios.put(`${API_BASE}/${requisitionId}/sources/${sourceId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async deleteSource(requisitionId: number, sourceId: number) {
    const response = await axios.delete(`${API_BASE}/${requisitionId}/sources/${sourceId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async addItem(requisitionId: number, payload: Record<string, any>) {
    const response = await axios.post(`${API_BASE}/${requisitionId}/items`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async updateItem(requisitionId: number, itemId: number, payload: Record<string, any>) {
    const response = await axios.put(`${API_BASE}/${requisitionId}/items/${itemId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async deleteItem(requisitionId: number, itemId: number) {
    const response = await axios.delete(`${API_BASE}/${requisitionId}/items/${itemId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async listTypes() {
    const response = await axios.get(TYPES_BASE, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async getType(id: number) {
    const response = await axios.get(`${TYPES_BASE}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async createType(payload: Record<string, any>) {
    const response = await axios.post(TYPES_BASE, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async updateType(id: number, payload: Record<string, any>) {
    const response = await axios.put(`${TYPES_BASE}/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async patchType(id: number, payload: Record<string, any>) {
    const response = await axios.patch(`${TYPES_BASE}/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async deleteType(id: number) {
    const response = await axios.delete(`${TYPES_BASE}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async listDimensionTypes(params: Record<string, any> = {}) {
    const response = await axios.get(`${DIMENSIONS_BASE}/types`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async getDimensionType(id: number) {
    const response = await axios.get(`${DIMENSIONS_BASE}/types/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async createDimensionType(payload: Record<string, any>) {
    const response = await axios.post(`${DIMENSIONS_BASE}/types`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async updateDimensionType(id: number, payload: Record<string, any>) {
    const response = await axios.put(`${DIMENSIONS_BASE}/types/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async patchDimensionType(id: number, payload: Record<string, any>) {
    const response = await axios.patch(`${DIMENSIONS_BASE}/types/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async deleteDimensionType(id: number) {
    const response = await axios.delete(`${DIMENSIONS_BASE}/types/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async listDimensionValues(params: Record<string, any> = {}) {
    const response = await axios.get(`${DIMENSIONS_BASE}/values`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async getDimensionValue(id: number) {
    const response = await axios.get(`${DIMENSIONS_BASE}/values/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async createDimensionValue(payload: Record<string, any>) {
    const response = await axios.post(`${DIMENSIONS_BASE}/values`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async updateDimensionValue(id: number, payload: Record<string, any>) {
    const response = await axios.put(`${DIMENSIONS_BASE}/values/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async patchDimensionValue(id: number, payload: Record<string, any>) {
    const response = await axios.patch(`${DIMENSIONS_BASE}/values/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },

  async deleteDimensionValue(id: number) {
    const response = await axios.delete(`${DIMENSIONS_BASE}/values/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },
}

export default requisitionService
