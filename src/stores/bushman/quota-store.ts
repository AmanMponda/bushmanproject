import { defineStore } from 'pinia'
import axios from 'axios'
// import { format } from 'date-fns'

// Define types
interface QuotaParams {
  quota_id?: string | number | null
  area_id?: string | number | null
  species_id?: string | number | null
}

export const useQuotaStore = defineStore('quota', {
  state: () => {
    return {
      quotas: [] as any,
    }
  },

  actions: {
    generateQuotaYear(startDate: any, endDate: any) {
      const startYear = new Date(startDate).getFullYear()
      const nextYear = new Date(endDate).getFullYear()
      const quotaYear = `${startYear}/${nextYear}`

      return quotaYear
    },

    async getQuotas(id: any = null) {
      let url = import.meta.env.VITE_APP_BASE_URL + 'sales/sales-quotas'

      // If ID is provided, use path parameter for single item
      if (id !== null && id !== undefined) {
        url += `/${id}`
      }

      console.log('GET URL:', url)

      const config = {
        method: 'get',
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        if (response.status === 200) {
          // Handle response format
          if (id) {
            // Single item response
            this.quotas = [response.data.data]
          } else {
            // List response
            this.quotas = response.data.data
          }
        }
        return response
      } catch (error) {
        console.error('Error getting quotas:', error)
        throw error
      }
    },

    async createQuota(quota: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_QUOTAS_URL

      // Helper function to safely format dates
      const formatDateForApi = (date: any): string => {
        if (!date) return ''

        // If it's already a string in YYYY-MM-DD format
        if (typeof date === 'string') {
          // Check if already in correct format
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date
          }

          // Try to parse and format
          try {
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0]
            }
          } catch (e) {
            console.error('Date parsing error:', e)
          }

          return date // Return as-is if can't parse
        }

        // If it's a Date object
        if (date instanceof Date) {
          return date.toISOString().split('T')[0]
        }

        // For any other type, try to convert to string
        try {
          const str = String(date)
          // Try to parse it
          const parsedDate = new Date(str)
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0]
          }
          return str
        } catch (e) {
          return ''
        }
      }

      const q_data = JSON.stringify({
        name: quota.name,
        description: quota.description || '',
        start_date: formatDateForApi(quota.start_date),
        end_date: formatDateForApi(quota.end_date),
      })

      console.log('Creating quota with data:', q_data)
      console.log('Raw quota data received:', quota)

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: q_data,
      }

      try {
        const response = await axios.request(config)
        console.log('Create quota response:', response)

        // Handle the response structure
        if (response.status === 201) {
          return {
            status: response.status,
            data: response.data,
            message: response.data?.message || 'Quota created successfully',
            success: true,
          }
        } else {
          return {
            status: response.status,
            data: response.data,
            message: response.data?.message || 'Request failed',
            success: false,
          }
        }
      } catch (error: any) {
        console.error('Error in createQuota:', error)

        // Return error in consistent format
        return {
          status: error.response?.status || 500,
          data: error.response?.data || error,
          message: error.response?.data?.message || error.message || 'Failed to create quota',
          success: false,
        }
      }
    },

    async createQuotaAreaSpecies(request_data: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_QUOTAS_AREA_SPECIES_URL
      const data = JSON.stringify({
        quota_id: request_data.quota_id,
        species_objects: request_data.speciesObjects,
        quantity: request_data.quantity,
        area_id: request_data.area_id,
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
      if (response.status === 201) {
        return response
      } else {
        return response
      }
    },

    async updateQuota(quota: any) {
      // Use path parameter with PATCH method
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales/sales-quotas/${quota.id}`

      console.log('Update URL (PATCH with path param):', url)

      // Date formatting
      const formatDateForApi = (date: any): string => {
        if (!date) return ''

        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date
        }

        try {
          const dateObj = new Date(date)
          if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear()
            const month = String(dateObj.getMonth() + 1).padStart(2, '0')
            const day = String(dateObj.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
        } catch (e) {
          console.error('Date formatting error:', e)
        }

        return String(date || '')
      }

      const data = {
        name: quota.name,
        start_date: formatDateForApi(quota.start_date),
        end_date: formatDateForApi(quota.end_date),
        description: quota.description || '',
      }

      console.log('Update data:', data)

      const config = {
        method: 'patch', // Now using PATCH with path parameter
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      try {
        const response = await axios.request(config)
        console.log('Update response:', response)
        return response
      } catch (error: any) {
        console.error('Error in updateQuota:', error)
        throw error
      }
    },

    async deleteQuota(quota_id: any) {
      // Use path parameter with DELETE method
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales/sales-quotas/${quota_id}`

      console.log('Delete URL (DELETE with path param):', url)

      const config = {
        method: 'delete', // Now using DELETE with path parameter
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        console.log('Delete response:', response)
        return response
      } catch (error) {
        console.error('Delete quota error:', error)
        throw error
      }
    },

    // Fixed method with proper TypeScript types
    async getAllSpeciesPerQuotaPerArea(quota_id: any, area_id: any, species_id: any) {
      console.log('Params received:', { quota_id, area_id, species_id })

      // Build URL without null/undefined values
      let url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_QUOTAS_AREA_SPECIES_URL

      // Create query parameters object with proper typing
      const params: QuotaParams = {}

      // Only add parameters if they have valid values
      if (quota_id && quota_id !== 'null' && quota_id !== 'undefined') {
        params.quota_id = quota_id
      }

      if (area_id && area_id !== 'null' && area_id !== 'undefined') {
        params.area_id = area_id
      }

      if (species_id && species_id !== 'null' && species_id !== 'undefined') {
        params.species_id = species_id
      }

      // If there are parameters, append them to URL
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params as Record<string, string>).toString()
        url += '?' + queryString
      }

      console.log('Final URL:', url)

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        console.log('API Response:', response.data)
        return response
      } catch (error) {
        console.error('API Error:', error)
        throw error
      }
    },

    async getSpeciesList() {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL,
      }
      const response = await axios.request(config)
      if (response.status === 200) {
        return response
      } else {
        return response
      }
    },

    async getAreaList() {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUTING_AREAS_URL,
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        return response
      } else {
        return response
      }
    },
  },
})
