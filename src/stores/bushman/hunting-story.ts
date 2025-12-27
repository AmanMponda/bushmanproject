import { defineStore } from 'pinia'
import axios from 'axios'

export const useHuntingAreaStore = defineStore('hunting-area-store', {
  state: () => {
    return {}
  },

  actions: {
    /**
     * Get all locations (for selecting location when creating hunting areas)
     */
    async getLocations() {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + 'locations',
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Get all hunting areas across all locations
     * Uses the settings/hunting-areas endpoint which returns hunting areas with nested location data
     */
    async getAllHuntingAreas() {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + 'settings/hunting-areas',
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Get hunting areas for a specific location
     */
    async getHuntingAreasByLocation(locationId: number | string) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `locations/${locationId}/hunting-areas`,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * One-shot creation: Create location with hunting area and geo-locations in one request
     */
    async createLocationWithHuntingArea(payload: {
      name: string
      code: string
      descriptions?: string
      is_disabled?: boolean
      hunting_areas: Array<{ description?: string }>
      geo_locations: Array<{
        coordinates_type: 'POINT' | 'POLYGON' | 'LINESTRING'
        coordinates: string
      }>
    }) {
      const data = JSON.stringify(payload)

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + 'locations',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Create a hunting area for a specific location
     */
    async createHuntingArea(locationId: number | string, payload: { description?: string }) {
      const data = JSON.stringify({
        description: payload.description || '',
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `locations/${locationId}/hunting-areas`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Update a hunting area for a specific location
     */
    async updateHuntingArea(locationId: number | string, huntingAreaId: number | string, payload: { description?: string }) {
      const data = JSON.stringify({
        description: payload.description || '',
      })

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `locations/${locationId}/hunting-areas/${huntingAreaId}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Delete a hunting area for a specific location
     */
    async deleteHuntingArea(locationId: number | string, huntingAreaId: number | string) {
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `locations/${locationId}/hunting-areas/${huntingAreaId}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Get a single hunting area by ID (requires locationId)
     */
    async getHuntingAreaById(locationId: number | string, huntingAreaId: number | string) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `locations/${locationId}/hunting-areas/${huntingAreaId}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Get a single hunting area by ID using the direct endpoint
     */
    async getHuntingAreaByIdDirect(huntingAreaId: number | string) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `locations/hunting-areas/${huntingAreaId}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    /**
     * Get species for a hunting area
     * Note: This endpoint might need to be updated based on the new API structure
     */
    async listHuntingAreaSpecies(huntingAreaId?: number | string) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + 'settings/hunting-area-species',
        headers: {
          'Content-Type': 'application/json',
        },
        params: huntingAreaId ? { hunting_area_id: huntingAreaId } : undefined,
      }

      return axios.request(config)
    },

    async addHuntingAreaSpecies(payload: { hunting_area_id: any; specie_id: any }) {
      const data = JSON.stringify({
        hunting_area_id: payload.hunting_area_id,
        specie_id: payload.specie_id,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + 'settings/hunting-area-species',
        headers: {
          'Content-Type': 'application/json',
        },
        data,
      }

      return axios.request(config)
    },

    async getHuntingAreaSpeciesById(id: any, huntingAreaId?: any, specieId?: any) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `settings/hunting-area-species/${id}`,
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          ...(huntingAreaId ? { hunting_area_id: huntingAreaId } : {}),
          ...(specieId ? { specie_id: specieId } : {}),
        },
      }

      return axios.request(config)
    },

    async updateHuntingAreaSpecies(id: any, payload: { hunting_area_id: any; specie_id: any; new_hunting_area_id?: any; new_specie_id?: any }) {
      const data = JSON.stringify({
        hunting_area_id: payload.hunting_area_id,
        specie_id: payload.specie_id,
        new_hunting_area_id: payload.new_hunting_area_id,
        new_specie_id: payload.new_specie_id,
      })

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + `settings/hunting-area-species/${id}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data,
      }

      return axios.request(config)
    },

    async deleteHuntingAreaSpecies(id: any, huntingAreaId?: any, specieId?: any) {
      const resolvedHuntingAreaId = huntingAreaId ?? id
      if (!resolvedHuntingAreaId || !specieId) {
        throw new Error('hunting_area_id and specie_id are required')
      }
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + 'hunting-area-species/0',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          hunting_area_id: resolvedHuntingAreaId,
          specie_id: specieId,
        },
      }

      return axios.request(config)
    },
  },
})
