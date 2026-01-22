import { defineStore } from 'pinia'
import axios from 'axios'

// Types
export interface CharterCompany {
  id: number
  code: string
  name: string
  registration_number?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  default_commission_percentage?: number
  default_revenue_account_id?: number
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  aircraft?: Aircraft[]
  route_prices?: CharterRoutePrice[]
}

export interface Aircraft {
  id: number
  charter_company_id: number
  registration_number: string
  make: string
  model: string
  year_manufactured?: number
  seating_capacity: number
  cargo_capacity_kg?: number
  max_range_km?: number
  cruise_speed_kmh?: number
  aircraft_type?: 'SINGLE_ENGINE' | 'TWIN_ENGINE' | 'TURBOPROP' | 'JET' | 'HELICOPTER'
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  charter_company?: CharterCompany
  display_name?: string
}

export interface CharterRoutePrice {
  id: number
  route_id: number
  charter_company_id: number
  default_aircraft_id?: number
  net_price: number
  landing_tax_per_flight: number
  departure_tax_per_person: number
  commission_on_top_percentage?: number
  min_passengers?: number
  max_passengers?: number
  flight_duration_minutes?: number
  trip_type: 'ONE_WAY' | 'ROUND_TRIP'
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  route?: any
  charter_company?: CharterCompany
  default_aircraft?: Aircraft
  gross_price?: number
}

export interface PriceCalculation {
  price_id: number
  route_id: number
  charter_company: string
  aircraft: string
  trip_type: string
  passengers: number
  breakdown: {
    net_price: number
    landing_tax_per_flight: number
    gross_price: number
    departure_tax_per_person: number
    departure_tax_total: number
    commission_percentage: number
    commission_amount: number
  }
  total_price: number
  flight_duration_minutes: number
}

export const useCharterStore = defineStore('charter-store', {
  state: () => ({
    // Companies
    companies: [] as CharterCompany[],
    loadingCompanies: false,
    savingCompany: false,

    // Aircraft
    aircraft: [] as Aircraft[],
    loadingAircraft: false,
    savingAircraft: false,

    // Route Prices
    routePrices: [] as CharterRoutePrice[],
    loadingPrices: false,
    savingPrice: false,

    // Metadata
    aircraftTypes: [] as string[],
    tripTypes: [] as string[],
    loadingMetadata: false,

    // Pagination
    pagination: {
      currentPage: 1,
      perPage: 15,
      total: 0,
      lastPage: 1,
    },
  }),

  getters: {
    activeCompanies: (state) => state.companies.filter((c) => c.is_active),
    activeAircraft: (state) => state.aircraft.filter((a) => a.is_active),
    activePrices: (state) => state.routePrices.filter((p) => p.is_active),
  },

  actions: {
    getBaseUrl() {
      return import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8000/api/v1.0/'
    },

    // ===================== METADATA =====================
    async getAircraftTypes() {
      try {
        const response = await axios.get(`${this.getBaseUrl()}charter/aircraft-types`)
        if (response.data.success) {
          this.aircraftTypes = response.data.data
        }
        return response
      } catch (error) {
        console.error('Error fetching aircraft types:', error)
        throw error
      }
    },

    async getTripTypes() {
      try {
        const response = await axios.get(`${this.getBaseUrl()}charter/trip-types`)
        if (response.data.success) {
          this.tripTypes = response.data.data
        }
        return response
      } catch (error) {
        console.error('Error fetching trip types:', error)
        throw error
      }
    },

    async loadMetadata() {
      this.loadingMetadata = true
      try {
        await Promise.all([this.getAircraftTypes(), this.getTripTypes()])
      } finally {
        this.loadingMetadata = false
      }
    },

    // ===================== CHARTER COMPANIES =====================
    async getCompanies(params: { is_active?: boolean; search?: string; per_page?: number } = {}) {
      this.loadingCompanies = true
      try {
        const queryParams = new URLSearchParams()
        if (params.is_active !== undefined) queryParams.append('is_active', params.is_active ? '1' : '0')
        if (params.search) queryParams.append('search', params.search)
        if (params.per_page) queryParams.append('per_page', params.per_page.toString())

        const url = `${this.getBaseUrl()}charter/companies${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        const response = await axios.get(url)

        if (response.data.success !== false) {
          // The API may return { success: true, data: { current_page, data: [...] } }
          // or { success: true, data: [...] } or directly an array/object. Normalize these shapes.
          const payload = response.data && response.data.data !== undefined ? response.data.data : response.data

          // If payload itself is a paginated object (has .data array), unwrap it and set pagination
          if (payload && Array.isArray(payload.data)) {
            this.companies = payload.data
            this.pagination = {
              currentPage: payload.current_page || this.pagination.currentPage,
              perPage: payload.per_page || this.pagination.perPage,
              total: payload.total || this.pagination.total,
              lastPage: payload.last_page || this.pagination.lastPage,
            }
          } else if (Array.isArray(payload)) {
            this.companies = payload
          } else {
            // fallback: assign whatever structure the API returned (best-effort)
            this.companies = response.data
          }
        }
        return response
      } catch (error) {
        console.error('Error fetching charter companies:', error)
        throw error
      } finally {
        this.loadingCompanies = false
      }
    },

    async getCompany(id: number) {
      try {
        const response = await axios.get(`${this.getBaseUrl()}charter/companies/${id}`)
        return response
      } catch (error) {
        console.error('Error fetching charter company:', error)
        throw error
      }
    },

    async createCompany(payload: Partial<CharterCompany>) {
      this.savingCompany = true
      try {
        const response = await axios.post(`${this.getBaseUrl()}charter/companies`, payload)
        if (response.status === 201) {
          await this.getCompanies()
        }
        return response
      } catch (error) {
        console.error('Error creating charter company:', error)
        throw error
      } finally {
        this.savingCompany = false
      }
    },

    async updateCompany(id: number, payload: Partial<CharterCompany>) {
      this.savingCompany = true
      try {
        const response = await axios.put(`${this.getBaseUrl()}charter/companies/${id}`, payload)
        if (response.status === 200) {
          await this.getCompanies()
        }
        return response
      } catch (error) {
        console.error('Error updating charter company:', error)
        throw error
      } finally {
        this.savingCompany = false
      }
    },

    async deleteCompany(id: number) {
      try {
        const response = await axios.delete(`${this.getBaseUrl()}charter/companies/${id}`)
        if (response.status === 200 || response.status === 204) {
          await this.getCompanies()
        }
        return response
      } catch (error) {
        console.error('Error deleting charter company:', error)
        throw error
      }
    },

    // ===================== AIRCRAFT =====================
    async getAircraft(params: {
      charter_company_id?: number
      is_active?: boolean
      aircraft_type?: string
      min_seats?: number
      search?: string
      per_page?: number
    } = {}) {
      this.loadingAircraft = true
      try {
        const queryParams = new URLSearchParams()
        if (params.charter_company_id) queryParams.append('charter_company_id', params.charter_company_id.toString())
        if (params.is_active !== undefined) queryParams.append('is_active', params.is_active ? '1' : '0')
        if (params.aircraft_type) queryParams.append('aircraft_type', params.aircraft_type)
        if (params.min_seats) queryParams.append('min_seats', params.min_seats.toString())
        if (params.search) queryParams.append('search', params.search)
        if (params.per_page) queryParams.append('per_page', params.per_page.toString())

        const url = `${this.getBaseUrl()}charter/aircraft${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        const response = await axios.get(url)

        if (response.data.success !== false) {
          const payload = response.data && response.data.data !== undefined ? response.data.data : response.data

          if (payload && Array.isArray(payload.data)) {
            this.aircraft = payload.data
            this.pagination = {
              currentPage: payload.current_page || this.pagination.currentPage,
              perPage: payload.per_page || this.pagination.perPage,
              total: payload.total || this.pagination.total,
              lastPage: payload.last_page || this.pagination.lastPage,
            }
          } else if (Array.isArray(payload)) {
            this.aircraft = payload
          } else {
            this.aircraft = response.data
          }
        }
        return response
      } catch (error) {
        console.error('Error fetching aircraft:', error)
        throw error
      } finally {
        this.loadingAircraft = false
      }
    },

    async getAircraftById(id: number) {
      try {
        const response = await axios.get(`${this.getBaseUrl()}charter/aircraft/${id}`)
        return response
      } catch (error) {
        console.error('Error fetching aircraft:', error)
        throw error
      }
    },

    async createAircraft(payload: Partial<Aircraft>) {
      this.savingAircraft = true
      try {
        const response = await axios.post(`${this.getBaseUrl()}charter/aircraft`, payload)
        if (response.status === 201) {
          await this.getAircraft()
        }
        return response
      } catch (error) {
        console.error('Error creating aircraft:', error)
        throw error
      } finally {
        this.savingAircraft = false
      }
    },

    async updateAircraft(id: number, payload: Partial<Aircraft>) {
      this.savingAircraft = true
      try {
        const response = await axios.put(`${this.getBaseUrl()}charter/aircraft/${id}`, payload)
        if (response.status === 200) {
          await this.getAircraft()
        }
        return response
      } catch (error) {
        console.error('Error updating aircraft:', error)
        throw error
      } finally {
        this.savingAircraft = false
      }
    },

    async deleteAircraft(id: number) {
      try {
        const response = await axios.delete(`${this.getBaseUrl()}charter/aircraft/${id}`)
        if (response.status === 200 || response.status === 204) {
          await this.getAircraft()
        }
        return response
      } catch (error) {
        console.error('Error deleting aircraft:', error)
        throw error
      }
    },

    // ===================== CHARTER ROUTE PRICES =====================
    async getPrices(params: {
      route_id?: number
      charter_company_id?: number
      trip_type?: string
      passengers?: number
      is_active?: boolean
      per_page?: number
    } = {}) {
      this.loadingPrices = true
      try {
        const queryParams = new URLSearchParams()
        if (params.route_id) queryParams.append('route_id', params.route_id.toString())
        if (params.charter_company_id) queryParams.append('charter_company_id', params.charter_company_id.toString())
        if (params.trip_type) queryParams.append('trip_type', params.trip_type)
        if (params.passengers) queryParams.append('passengers', params.passengers.toString())
        if (params.is_active !== undefined) queryParams.append('is_active', params.is_active ? '1' : '0')
        if (params.per_page) queryParams.append('per_page', params.per_page.toString())

        const url = `${this.getBaseUrl()}charter/prices${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        const response = await axios.get(url)

        if (response.data.success !== false) {
          const payload = response.data && response.data.data !== undefined ? response.data.data : response.data

          if (payload && Array.isArray(payload.data)) {
            this.routePrices = payload.data
            this.pagination = {
              currentPage: payload.current_page || this.pagination.currentPage,
              perPage: payload.per_page || this.pagination.perPage,
              total: payload.total || this.pagination.total,
              lastPage: payload.last_page || this.pagination.lastPage,
            }
          } else if (Array.isArray(payload)) {
            this.routePrices = payload
          } else {
            this.routePrices = response.data
          }
        }
        return response
      } catch (error) {
        console.error('Error fetching charter prices:', error)
        throw error
      } finally {
        this.loadingPrices = false
      }
    },

    async getPrice(id: number) {
      try {
        const response = await axios.get(`${this.getBaseUrl()}charter/prices/${id}`)
        return response
      } catch (error) {
        console.error('Error fetching charter price:', error)
        throw error
      }
    },

    async createPrice(payload: Partial<CharterRoutePrice>) {
      this.savingPrice = true
      try {
        const response = await axios.post(`${this.getBaseUrl()}charter/prices`, payload)
        if (response.status === 201) {
          await this.getPrices()
        }
        return response
      } catch (error) {
        console.error('Error creating charter price:', error)
        throw error
      } finally {
        this.savingPrice = false
      }
    },

    async updatePrice(id: number, payload: Partial<CharterRoutePrice>) {
      this.savingPrice = true
      try {
        const response = await axios.put(`${this.getBaseUrl()}charter/prices/${id}`, payload)
        if (response.status === 200) {
          await this.getPrices()
        }
        return response
      } catch (error) {
        console.error('Error updating charter price:', error)
        throw error
      } finally {
        this.savingPrice = false
      }
    },

    async deletePrice(id: number) {
      try {
        const response = await axios.delete(`${this.getBaseUrl()}charter/prices/${id}`)
        if (response.status === 200 || response.status === 204) {
          await this.getPrices()
        }
        return response
      } catch (error) {
        console.error('Error deleting charter price:', error)
        throw error
      }
    },

    // ===================== PRICE CALCULATION =====================
    async calculatePrice(params: {
      route_id: number
      charter_company_id: number
      trip_type: string
      passengers: number
    }): Promise<PriceCalculation | null> {
      try {
        const response = await axios.post(`${this.getBaseUrl()}charter/calculate-price`, params)
        if (response.data.success) {
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error calculating price:', error)
        throw error
      }
    },

    async getPricesForRoute(routeId: number, params: { trip_type?: string; passengers?: number } = {}) {
      try {
        const queryParams = new URLSearchParams()
        if (params.trip_type) queryParams.append('trip_type', params.trip_type)
        if (params.passengers) queryParams.append('passengers', params.passengers.toString())

        const url = `${this.getBaseUrl()}charter/routes/${routeId}/prices${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        const response = await axios.get(url)
        return response
      } catch (error) {
        console.error('Error fetching prices for route:', error)
        throw error
      }
    },

    // ===================== OPTIONS FOR DROPDOWNS =====================
    async getCompaniesAsOptions() {
      await this.getCompanies({ is_active: true })
      return this.companies.map((c) => ({
        value: c.id,
        text: c.name,
        label: c.name,
      }))
    },

    async getAircraftAsOptions(companyId?: number) {
      await this.getAircraft({ charter_company_id: companyId, is_active: true })
      return this.aircraft.map((a) => ({
        value: a.id,
        text: `${a.make} ${a.model} (${a.registration_number})`,
        label: `${a.make} ${a.model} (${a.registration_number})`,
      }))
    },
  },
})
