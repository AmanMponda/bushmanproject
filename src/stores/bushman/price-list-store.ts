// @ts-nocheck - TypeScript cannot infer 'this' type in Pinia actions accessing state
import { defineStore } from 'pinia'
import axios from 'axios'
// import { format } from 'date-fns'

export const usePriceListStore = defineStore('price-list', {
  state: () => {
    return {
      itemsByHuntingType: [] as any,
      priceList: [] as any,
      salesPackages: [] as any,
      packageOptions: [] as any,
      latestPackage: null as any,
      showModal: false,
      loadingpackages: false,
      huntLengths: [] as any,
    }
  },

  actions: {
    // ==================== HUNT LENGTHS ====================
    async getHuntLengths() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUNT_LENGTHS_URL
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
        this.huntLengths = response.data?.data || response.data || []
      }
      return response
    },

    async createHuntLength(payload: { days: number; label: string; is_active?: boolean }) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUNT_LENGTHS_URL
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

    // ==================== PRICE STRUCTURES (NEW) ====================
    // For DISPLAY: Use this method without include_pdf parameter
    async getPriceStructures(areaId?: any, isActive?: boolean, currentOnly: boolean = true) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_PRICE_STRUCTURES_URL
      const params: any = {}
      // Note: DO NOT add include_pdf here - this is for display only
      if (areaId) params.area_id = areaId
      if (isActive !== undefined) params.is_active = isActive
      if (currentOnly !== undefined) params.current_only = currentOnly

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      const raw = response.data
      const items = Array.isArray(raw) ? raw : (raw?.data ?? [])
      this.priceList = items
      return response
    },

    async getPriceStructureById(id: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_PRICE_STRUCTURES_URL}${id}`
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

    async updatePriceStructure(id: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_PRICE_STRUCTURES_URL}${id}`
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

    async deletePriceStructure(id: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_PRICE_STRUCTURES_URL}${id}`
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

    // ==================== LEGACY PRICE LIST METHODS (kept for backwards compatibility) ====================
    // For DISPLAY: Uses price-structures endpoint without include_pdf
    async getPriceList(
      hunting_type_id: any = '',
      area_id: any = '',
      season_id: any = '',
      min_amount: any = '',
      max_amount: any = '',
    ) {
      // Use new Price Structures endpoint and flatten for existing UI
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_PRICE_STRUCTURES_URL

      const params: any = {}
      // Note: DO NOT add include_pdf here - this is for display only
      if (area_id !== '' && area_id !== null && area_id !== undefined) params.area_id = area_id
      // default current_only=true to limit to current/future
      params.current_only = true

      console.log('API URL (price-structures):', url, 'params:', params)

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      const raw = response.data
      const structures: any[] = Array.isArray(raw) ? raw : (raw?.data ?? [])

      // Flatten structures.items to legacy-like rows for the table
      const flattened: any[] = []
      for (const s of structures) {
        const areaName = s.area_name || s.area?.name || 'N/A'
        const startDate = s.start_date || null
        const endDate = s.end_date || null
        const status = s.is_active ? 'Active' : 'Inactive'
        const companion = s.companion_hunter_prices || []
        const observer = s.observer_hunter_prices || []

        const items = Array.isArray(s.items) ? s.items : []
        for (const i of items) {
          // try to normalize amount to number
          const amt = typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
          flattened.push({
            id: s.id, // keep structure id for actions like delete/view
            package_name: i.name,
            area: areaName,
            area_package: areaName,
            hunting_type: i.hunting_type_name || i.hunting_type_id || 'N/A',
            amount: amt,
            duration: i.hunt_length_days || i.hunt_length_label || '',
            status,
            start_date: startDate,
            end_date: endDate,
            season_id: null,
            season_name: null,
            species_count: 0,
            species: [],
            companion_hunter_costs: companion,
            observer_hunter_costs: observer,
          })
        }
      }

      // Client-side filtering to preserve existing filter UX
      let filtered = flattened
      if (hunting_type_id) {
        filtered = filtered.filter((row) =>
          String(row.hunting_type) === String(hunting_type_id) ||
          String((row as any).hunting_type_id) === String(hunting_type_id),
        )
      }
      if (min_amount !== '' && min_amount !== null && min_amount !== undefined) {
        const min = Number(min_amount)
        filtered = filtered.filter((row) => Number(row.amount) >= min)
      }
      if (max_amount !== '' && max_amount !== null && max_amount !== undefined) {
        const max = Number(max_amount)
        filtered = filtered.filter((row) => Number(row.amount) <= max)
      }

      this.priceList = filtered

      // Return a response-like object matching previous expectations
      return { status: 200, data: filtered } as any
    },
    async getPriceListByHuntingType(hunting_type_id: any = '', area_id: any = '', season_id: any = '') {
      const res = await this.getPriceList(hunting_type_id, area_id, season_id)
      this.itemsByHuntingType = Array.isArray(res?.data) ? res.data : []
      return res as any
    },

    async getPriceListById(id: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_PRICE_STRUCTURES_URL}${id}`
      console.log('Fetching price structure detail, URL:', url)
      const token = localStorage.getItem('token')
      
      // Use fetch with AbortController for reliable timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        
        console.log('getPriceListById fetch status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('getPriceListById fetch error:', response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const data = await response.json()
        console.log('getPriceListById response data:', data)
        
        // Return axios-like response object for compatibility
        return { status: response.status, data: data }
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          console.error('getPriceListById timeout after 10s')
          throw new Error('Request timeout after 10 seconds')
        }
        console.error('getPriceListById error:', error?.message || error)
        throw error
      }
    },

    async updatePriceList(id: number, payload: any) {
      // Build request body to match backend expected shape
      const requestBody: any = {
        start_date: payload.start_date || payload.start_at || null,
        end_date: payload.end_date || payload.end_at || null,
        is_active: payload.is_active === true || payload.is_active === 1,
        area_id: payload.area_id || payload.area || null,
        user_id: payload.user_id || null,

        amount: payload.amount,
        currency: payload.currency,
        hunting_type_id: payload.huntingTypeId || payload.hunting_type_id,
        duration: payload.duration,

        // top-level companion/observer numeric fields
        companion_amount: payload.companionAmount ?? payload.companion_amount ?? null,
        companion_days: payload.companionDays ?? payload.companion_days ?? null,
        observer_amount: payload.observerAmount ?? payload.observer_amount ?? null,
        observer_days: payload.observerDays ?? payload.observer_days ?? null,

        description: payload.description,
        sales_quota_id: payload.salesQuotaId,
        season_id: payload.season_id || null,
        species_object_list: payload.speciesObjectList,
      }

      // Map selected package IDs into price_type_packages array expected by backend
      try {
        if (payload.sales_package_ids && Array.isArray(payload.sales_package_ids)) {
          requestBody.price_type_packages = payload.sales_package_ids.map((pkgId: any) => ({
            sales_package_id: pkgId,
          }))
        }
      } catch (e) {
        // ignore mapping errors
      }

      // Add upgrade_fees only if provided
      if (payload.upgrade_fees && payload.upgrade_fees.length > 0) {
        requestBody.upgrade_fees = payload.upgrade_fees
      }

      // Log the final request body being sent to backend
      console.log('=== STORE UPDATE PRICE LIST ===')
      console.log('Price List ID:', id)
      console.log('Final Request Body:', JSON.stringify(requestBody, null, 2))
      console.log('Observer Amount in Body:', requestBody.observer_amount)
      console.log('Observer Days in Body:', requestBody.observer_days)
      console.log('Companion Amount in Body:', requestBody.companion_amount)
      console.log('Companion Days in Body:', requestBody.companion_days)
      console.log('===============================')

      const data = JSON.stringify(requestBody)

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_PRICE_STRUCTURES_URL}${id}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async deletePriceList(id: number, force: boolean = false) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_PRICE_STRUCTURES_URL}${id}`

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

    async getSalesPackageList(usedAsOptions: boolean = false) {
      this.loadingpackages = true
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_PACKAGE_VSET_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.loadingpackages = false
        if (!usedAsOptions) {
          this.salesPackages = response.data.map((item: any) => {
            return {
              id: item.id,
              name: item.name,
              area_name: item?.area?.name ?? 'N/A',
              regulatory_package_name: item?.regulatory_package?.name ?? 'N/A',
              selfItem: item,
            }
          })
        } else {
          this.latestPackage = {
            value: response.data[0].id,
            text: response.data[0].name,
          }

          this.packageOptions = response.data.map((item: { id: any; name: any }) => {
            return {
              value: item.id,
              text: item.name,
            }
          })
        }
      }
      return response
    },

    async createSalesPackage(payload: any) {
      const data = JSON.stringify({
        name: payload.name,
        area_id: payload.areaId,
        regulatory_package_id: payload.licenceId,
        description: payload.description,
        species_object_list: payload.speciesObjectList,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_PACKAGE_VSET_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      if (response.status === 201) {
        this.showModal = false
        this.getSalesPackageList()
      }
      return response
    },

    async updateSalesPackage(id: number, payload: any) {
      const data = JSON.stringify({
        name: payload.name,
        area_id: payload.areaId,
        regulatory_package_id: payload.licenceId,
        description: payload.description,
        species_object_list: payload.speciesObjectList,
      })

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_PACKAGE_VSET_URL + id + '/',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.getSalesPackageList()
      }
      return response
    },

    async deleteSalesPackage(id: number, force: boolean = false) {
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_SALES_PACKAGE_VSET_URL +
        id +
        '/' +
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
      if (response.status === 200 || response.status === 204) {
        this.getSalesPackageList()
      }
      return response
    },

    async createPriceList(payload: any) {
      // Build request body to match PRICE_STRUCTURE_API.md
      const requestBody: any = {
        // Required fields
        area_id: payload.area_id,
        start_date: payload.start_date || payload.start_at,
        end_date: payload.end_date || payload.end_at,
        is_active: payload.is_active === true || payload.is_active === 1 ? 1 : 0,
        // Required items array - ensure it's always an array
        items: Array.isArray(payload.items) ? payload.items : [],
      }

      // Optional: sales package linking
      if (payload.sales_package_ids && payload.sales_package_ids.length > 0) {
        requestBody.sales_package_ids = payload.sales_package_ids
      }
      // Optional: companion hunter prices
      if (payload.companion_hunter_prices && payload.companion_hunter_prices.length > 0) {
        requestBody.companion_hunter_prices = payload.companion_hunter_prices
      }
      // Optional: observer hunter prices
      if (payload.observer_hunter_prices && payload.observer_hunter_prices.length > 0) {
        requestBody.observer_hunter_prices = payload.observer_hunter_prices
      }
      // Optional: upgrade fees
      if (payload.upgrade_fees && payload.upgrade_fees.length > 0) {
        requestBody.upgrade_fees = payload.upgrade_fees
      }

      // Debug: log request body for inspection during development
      console.log('createPriceList requestBody:', requestBody)
      console.log('items array:', requestBody.items)
      console.log('JSON being sent:', JSON.stringify(requestBody))

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_PRICE_STRUCTURES_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: requestBody,
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Download PDF from price structures endpoint
     * 
     * For PDF DOWNLOAD: This method adds include_pdf=true to get actual PDF content
     * The API endpoint: /api/v1.0/settings/price-structures?include_pdf=true
     * 
     * Supports filters:
     * - ?include_pdf=true&area_id=1
     * - ?include_pdf=true&is_active=true
     * - Combined: ?include_pdf=true&area_id=1&is_active=true
     * 
     * For DISPLAY (without PDF): Use getPriceStructures() or getPriceList() instead
     */
    async getCompletePriceListPdf(
      hunting_type_id: any = '',
      area_id: any = '',
      season_id: any = '',
      min_amount: any = '',
      max_amount: any = '',
      includeTrophyFees: boolean = true,
      is_active: boolean | null = null,
    ) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_PRICE_STRUCTURES_URL

      // Only send include_pdf=true, no other parameters
      const params: any = {
        include_pdf: true
      }

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        params,
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob' as any, // CRITICAL: Tell axios to expect binary PDF data
      }

      const response = await axios.request(config)
      console.log('getCompletePriceListPdf response type:', response.headers['content-type'])
      console.log('getCompletePriceListPdf response size:', response.data?.size || 'unknown')
      
      // When include_pdf=true, API returns actual PDF binary content (not JSON)
      // The response.data is a Blob containing the PDF
      return { status: 200, data: response.data, pdf: response.data } as any
    },
  },
})
