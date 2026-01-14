import { defineStore } from 'pinia'
import axios from 'axios'

export const usePriceStructuresStore = defineStore('price-structures', {
  state: () => ({
    items: [] as any[],
    current: null as any | null,
    huntLengths: [] as any[],
    loading: false,
  }),
  actions: {
    async list(params: any = {}) {
      this.loading = true
      const url = import.meta.env.VITE_APP_BASE_URL + 'settings/price-structures'
      const response = await axios.get(url, { params })
      this.items = response.data?.data || response.data || []
      this.loading = false
      return response
    },
    async get(id: number) {
      this.loading = true
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/price-structures/${id}`
      const response = await axios.get(url, {
        params: {
          with: 'items,companion_hunter_prices,observer_hunter_prices,safari_extras'
        }
      })
      const structure = response.data?.data || response.data || null
      
      // Fetch trophy fees separately for this price structure's location
      if (structure && structure.location_id) {
        try {
          const trophyFeesUrl = import.meta.env.VITE_APP_BASE_URL + 'settings/trophy-fees/pricing'
          const trophyFeesResponse = await axios.get(trophyFeesUrl, {
            params: {
              location_id: structure.location_id
            }
          })
          structure.trophy_fees = trophyFeesResponse.data?.data || trophyFeesResponse.data || []
        } catch (error) {
          console.warn('Failed to load trophy fees for price structure:', error)
          structure.trophy_fees = []
        }
      }
      
      this.current = structure
      this.loading = false
      return response
    },
    async create(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + 'settings/price-structures'
      const response = await axios.post(url, payload)
      return response
    },
    async update(id: number, payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/price-structures/${id}`
      const response = await axios.put(url, payload)
      return response
    },
    async remove(id: number) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/price-structures/${id}`
      const response = await axios.delete(url)
      return response
    },
    // Items
    async createItem(priceStructureId: number, payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/price-structures/${priceStructureId}/items`
      const response = await axios.post(url, payload)
      return response
    },
    // Companion / Observer
    async createCompanionPrice(priceStructureId: number, payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/price-structures/${priceStructureId}/companion-hunter-prices`
      const response = await axios.post(url, payload)
      return response
    },
    async createObserverPrice(priceStructureId: number, payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/price-structures/${priceStructureId}/observer-hunter-prices`
      const response = await axios.post(url, payload)
      return response
    },
    // Upgrade Fees
    async createUpgradeFee(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees`
      const response = await axios.post(url, payload)
      return response
    },
    async updateUpgradeFee(id: number, payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees/${id}`
      const response = await axios.put(url, payload)
      return response
    },
    async deleteUpgradeFee(id: number) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees/${id}`
      const response = await axios.delete(url)
      return response
    },
    async getUpgradeFeeMetadata(priceStructureId: number) {
      const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees/creation-metadata`
      const response = await axios.get(url, {
        params: { price_structure_id: priceStructureId }
      })
      return response
    },
    async getHuntLengths() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUNT_LENGTHS_URL
      const response = await axios.get(url)
      this.huntLengths = response.data?.data || response.data || []
      return response
    },
  },
})
