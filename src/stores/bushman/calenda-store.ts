// calenda-store.ts
import { defineStore } from 'pinia'
import axios from 'axios'

export const useCalendarStore = defineStore('calendar_store', {
  state: () => {
    return {
      events: [],
    }
  },

  actions: {
    async getCalendarStats() {
      try {
        // Use the calendar-stats-vset endpoint which returns direct array
        const url =
          import.meta.env.VITE_APP_BASE_URL +
          'sales-confirmation/calendar-stats-vset' +
          '?status_list=confirmed,provision_sales,completed'

        // Fetch URL prepared (debug log removed)

        const config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: url,
          headers: {
            'Content-Type': 'application/json',
          },
        }

        const response = await axios.request(config)

        // API response received (debug logs removed),
          dataLength: Array.isArray(response.data) ? response.data.length : 'Not an array',
        })

        return response
      } catch (error) {
        console.error('Error fetching calendar stats:', error)

        // Return empty response on error
        return {
          status: 200,
          data: [],
        }
      }
    },
  },
})
