import { defineStore } from 'pinia'
import axios from 'axios'

const baseUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees`

export const useUpgradeFeesStore = defineStore('upgradeFees', {
  state: () => {
    return {
      upgradeFees: [] as any[],
      loading: false,
    }
  },

  actions: {
    async fetchUpgradeFees(params: any = {}) {
      this.loading = true
      const config = {
        method: 'get',
        url: baseUrl,
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        this.upgradeFees = response.data.data || response.data
        return response
      } finally {
        this.loading = false
      }
    },

    async getUpgradeFeeById(id: number) {
      const config = {
        method: 'get',
        url: `${baseUrl}/${id}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      return axios.request(config)
    },

    async createUpgradeFee(payload: any) {
      const config = {
        method: 'post',
        url: baseUrl,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      return axios.request(config)
    },

    async updateUpgradeFee(id: number, payload: any) {
      const config = {
        method: 'put',
        url: `${baseUrl}/${id}`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      return axios.request(config)
    },

    async deleteUpgradeFeeById(id: number) {
      const config = {
        method: 'delete',
        url: `${baseUrl}/${id}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      return axios.request(config)
    },
  },
})
