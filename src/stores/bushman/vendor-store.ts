// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'

export const useVendorStore = defineStore('vendor-store', {
  state: () => {
    return {
      vendors: [] as any[],
      loading: false,
      countries: [] as any[],
      currencies: [] as any[],
      identityTypes: [] as any[],
      entityCategories: [] as any[],
    }
  },

  actions: {
    /**
     * Get all vendors (entities with VENDOR category)
     */
    async getVendors() {
      const url = import.meta.env.VITE_APP_BASE_URL + 'entities?category=VENDOR'

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.vendors = response.data
      }
      return response
    },

    /**
     * Create a new vendor entity with all related data
     */
    async createVendor(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + 'entities'

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Update vendor entity
     */
    async updateVendor(id: number, payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `entities/${id}`

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Delete vendor entity
     */
    async deleteVendor(id: number, force: boolean = false) {
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        `entities/${id}` +
        (force ? '?force=true' : '')

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

    /**
     * Get single vendor by ID
     */
    async getVendorById(id: number) {
      const url = import.meta.env.VITE_APP_BASE_URL + `entities/${id}`

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

    /**
     * Get countries for dropdown
     */
    async getCountries() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_COUNTRIES_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.countries = response.data
      }
      return response
    },

    /**
     * Get currencies for dropdown
     */
    async getCurrencies() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_CURRENCIES_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.currencies = response.data
      }
      return response
    },

    /**
     * Get identity types for dropdown
     */
    async getIdentityTypes() {
      const url = import.meta.env.VITE_APP_BASE_URL + 'settings/identity-types'

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.identityTypes = response.data
      }
      return response
    },

    /**
     * Get entity categories for dropdown
     */
    async getEntityCategories() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_ENTITY_CATEGORIES_VSET_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.entityCategories = response.data
      }
      return response
    },

    /**
     * Get accounts for vendor category assignment
     */
    async getAccounts(search: string = '') {
      const url = import.meta.env.VITE_APP_BASE_URL + `accounting/accounts?search=${search}`

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
  },
})
