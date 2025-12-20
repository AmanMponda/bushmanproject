import { defineStore } from 'pinia'
import axios from 'axios'

export const useRegulatoryPackageStore = defineStore('regulatory-package-store', {
  state: () => {
    return {}
  },

  actions: {
    async getSalesInquiries() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_INQUIRIES_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    async createNewRegulatoryPackage(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_REGULATORY_HUNTING_PACKAGES_URL
      const data = JSON.stringify({
        name: payload.name,
        duration: payload.duration,
        species_object_list: payload.speciesObjectList,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async getRegulatoryPackages() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_REGULATORY_HUNTING_PACKAGES_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    async getRegulatoryPackageById(id: number | string) {
      const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
      const endpoint = (import.meta.env.VITE_APP_REGULATORY_HUNTING_PACKAGES_URL || '').replace(/\/+$/, '')
      const url = `${baseUrl}/${endpoint}/${id}`

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

  async deleteRegulatoryPackage(id: number | string) {
  // Use pattern: /v1.0/settings/regulatory-hunting-packages/{id}
  // Normalize URLs to avoid double slashes - remove trailing slashes from both
  const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
  const endpoint = (import.meta.env.VITE_APP_REGULATORY_HUNTING_PACKAGES_URL || '').replace(/\/+$/, '')
  // Construct URL: baseUrl/endpoint/id (no trailing slash after ID)
  const url = `${baseUrl}/${endpoint}/${id}`
  const config = {
    method: 'delete',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const response = await axios.request(config)
  return response
},
  },
})
