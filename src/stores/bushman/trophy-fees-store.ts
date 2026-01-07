import { defineStore } from 'pinia'
import axios from 'axios'

const itemsBaseUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees`
const pricingBaseUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees/pricing`

export const useTrophyFeesStore = defineStore('trophyFees', {
  state: () => {
    return {
      trophyFees: [] as any[],
      trophyFeePricing: [] as any[],
      loading: false,
    }
  },

  actions: {
    async fetchTrophyFeeItems(params: any = {}) {
      this.loading = true
      try {
        const response = await axios.get(itemsBaseUrl, { params })
        this.trophyFees = response.data.data || response.data
        return response
      } finally {
        this.loading = false
      }
    },

    async getTrophyFeeItemById(id: number) {
      return axios.get(`${itemsBaseUrl}/${id}`)
    },

    async createTrophyFeeItem(payload: any) {
      return axios.post(itemsBaseUrl, payload)
    },

    async createCombinedTrophyFee(payload: any) {
      return axios.post(`${itemsBaseUrl}/combined`, payload)
    },

    async updateTrophyFeeItem(id: number, payload: any) {
      return axios.put(`${itemsBaseUrl}/${id}`, payload)
    },

    async deleteTrophyFeeItemById(id: number) {
      return axios.delete(`${itemsBaseUrl}/${id}`)
    },

    async bulkCreateTrophyFees(payload: any) {
      return axios.post(`${itemsBaseUrl}/bulk`, payload)
    },

    async fetchTrophyFeeAttributes() {
      return axios.get(`${itemsBaseUrl}/attributes`)
    },

    async fetchTrophyFeeSpecies() {
      return axios.get(`${itemsBaseUrl}/species`)
    },

    async fetchTrophyFeePricing(params: any = {}) {
      this.loading = true
      try {
        const response = await axios.get(pricingBaseUrl, { params })
        this.trophyFeePricing = response.data.data || response.data
        return response
      } finally {
        this.loading = false
      }
    },

    async getTrophyFeePricingById(id: number) {
      return axios.get(`${pricingBaseUrl}/${id}`)
    },

    async createTrophyFeePricing(payload: any) {
      return axios.post(pricingBaseUrl, payload)
    },

    async updateTrophyFeePricing(id: number, payload: any) {
      return axios.put(`${pricingBaseUrl}/${id}`, payload)
    },

    async deleteTrophyFeePricingById(id: number) {
      return axios.delete(`${pricingBaseUrl}/${id}`)
    },
  },
})
