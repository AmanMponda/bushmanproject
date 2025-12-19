import { defineStore } from 'pinia'
import axios from 'axios'

export const useTrophyFeesStore = defineStore('trophyFees', {
  state: () => {
    return {
      trophyFees: [] as any[],
      loading: false,
    }
  },

  actions: {
    async fetchTrophyFees(params: any = {}) {
      this.loading = true
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_TROPHY_FEES_URL

      const config = {
        method: 'get',
        url: url,
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        this.trophyFees = response.data.data || response.data
        return response
      } finally {
        this.loading = false
      }
    },

    async getTrophyFeeById(id: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_TROPHY_FEES_URL}${id}/`

      const config = {
        method: 'get',
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    async createTrophyFee(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_TROPHY_FEES_URL

      const config = {
        method: 'post',
        url: url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    async updateTrophyFee(id: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_TROPHY_FEES_URL}${id}/`

      const config = {
        method: 'put',
        url: url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    async deleteTrophyFeeById(id: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_TROPHY_FEES_URL}${id}/`

      const config = {
        method: 'delete',
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
