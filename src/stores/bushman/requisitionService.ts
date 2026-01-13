import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}requisitions`
const TYPES_BASE = `${import.meta.env.VITE_APP_BASE_URL}requisition-types`

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
      // Temporary: hardcode approver identity until session-based auth is wired end-to-end.
      approver_id: 1,
      approved_by: 1,
      handled_by: 1,
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

  async listTypes() {
    const response = await axios.get(TYPES_BASE, {
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

  async deleteType(id: number) {
    const response = await axios.delete(`${TYPES_BASE}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return response.data
  },
}

export default requisitionService
