import { defineStore } from 'pinia'
import axios from 'axios'

function normalizeBasePath(path: string) {
  if (!path) return ''
  return path.endsWith('/') ? path : `${path}/`
}

export const useDocumentsStore = defineStore('documents-store', {
  actions: {
    buildUrl(id?: number | string, suffix?: string) {
      const base = import.meta.env.VITE_APP_BASE_URL || ''
      const resource = normalizeBasePath(import.meta.env.VITE_APP_DOCUMENTS_URL || 'documents/records/')
      const idPart = id !== undefined && id !== null ? `${id}/` : ''
      const suffixPart = suffix ? `${suffix}` : ''
      return `${base}${resource}${idPart}${suffixPart}`
    },

    authHeaders(extra?: Record<string, string>) {
      const token = localStorage.getItem('token') || import.meta.env.VITE_APP_TOKEN || ''
      return {
        Authorization: token ? `Bearer ${token}` : '',
        ...extra,
      }
    },

    async listDocuments(params?: Record<string, any>) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: this.buildUrl(),
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        params,
      }
      return axios.request(config)
    },

    async createDocument(payload: { name: string; code: string; file?: File; description?: string; expiring_mode?: string; expiring_start?: string; expiring_end?: string }) {
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('code', payload.code)
      if (payload.description) formData.append('description', payload.description)
      if (payload.expiring_mode) formData.append('expiring_mode', payload.expiring_mode)
      if (payload.expiring_start) formData.append('expiring_start', payload.expiring_start)
      if (payload.expiring_end) formData.append('expiring_end', payload.expiring_end)
      if (payload.file) formData.append('file', payload.file)

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: this.buildUrl(),
        headers: this.authHeaders(),
        data: formData,
      }
      return axios.request(config)
    },

    async updateDocument(id: number | string, payload: { name: string; code: string; description?: string; file?: File | null }) {
      if (payload.file) {
        const formData = new FormData()
        formData.append('name', payload.name)
        formData.append('code', payload.code)
        if (payload.description) formData.append('description', payload.description)
        formData.append('file', payload.file)

        const config = {
          method: 'patch',
          maxBodyLength: Infinity,
          url: this.buildUrl(id),
          headers: this.authHeaders(),
          data: formData,
        }
        return axios.request(config)
      }

      const data = JSON.stringify({
        name: payload.name,
        code: payload.code,
        description: payload.description || '',
      })

      const config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: this.buildUrl(id),
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        data,
      }
      return axios.request(config)
    },

    async deleteDocument(id: number | string) {
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: this.buildUrl(id),
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      }
      return axios.request(config)
    },

    async getDocument(id: number | string, includeFile: boolean = false) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: this.buildUrl(id),
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        params: includeFile ? { include_file: true } : undefined,
      }
      return axios.request(config)
    },

    async downloadDocument(id: number | string) {
      const config = {
        method: 'get',
        url: this.buildUrl(id, 'file'),
        headers: this.authHeaders(),
        responseType: 'blob',
      }
      return axios.request(config)
    },

    // Get a viewable URL for the document (returns blob URL for inline viewing)
    async getViewableUrl(id: number | string): Promise<string> {
      const response = await this.downloadDocument(id)
      const blob = response.data
      const mimeType = response.headers['content-type'] || 'application/octet-stream'
      const viewableBlob = new Blob([blob], { type: mimeType })
      return window.URL.createObjectURL(viewableBlob)
    },
  },
})
