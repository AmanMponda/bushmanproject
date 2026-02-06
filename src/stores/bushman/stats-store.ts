// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'
import type { QuotaStats } from '@/interfaces/IQuota'
// import { format } from 'date-fns'
// import { formatDateTime } from '../services/utils'

export const useStatsStore = defineStore('stats', {
  state: () => {
    return {
      loadingStats: false,
      quotaStats: {} as QuotaStats,
    }
  },

  actions: {
    async getStats() {
      this.loadingStats = true
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
      // Base URL already includes /api/v1.0/, so just append the endpoint
      const url = `${baseUrl}reportings/quota-stats`

      const token = localStorage.getItem('token')
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      }
      try {
        const response = await axios.get(url, config)

        if (response.status === 200) {
          // Backend returns { success: true, data: [...species], totals: {...}, pdf: "..." }
          const totals = response.data.totals || response.data || {}
          const quotaName =
            response.data.data && response.data.data.length > 0 ? response.data.data[0].quota?.name : 'Unknown'

          this.quotaStats = {
            confirmed: totals.confirmed || 0,
            pending: totals.pending || 0,
            cancelled: totals.cancelled || 0,
            taken: totals.taken || 0,
            provisioned: totals.provisioned || 0,
            totalQuota: totals.total_quota_balance || totals.total_quota || totals.total || 0,
            quota: quotaName,
          }

          this.loadingStats = false
          return response
        }
        this.loadingStats = false
        return response
      } catch (error: any) {
        console.error('Error fetching quota stats:', error)
        this.loadingStats = false
        // Set default values on error
        this.quotaStats = {
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          taken: 0,
          provisioned: 0,
          totalQuota: 0,
          quota: '',
        }
        throw error
      }
    },

    async getSalesSummaryStats() {
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
      const url = `${baseUrl}reportings/sales-summary-stats`

      const token = localStorage.getItem('token')
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      }
      try {
        const response = await axios.get(url, config)
        return response
      } catch (error: any) {
        console.error('Error fetching sales summary stats:', error)
        throw error
      }
    },
  },
})
