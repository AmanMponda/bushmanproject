import { defineStore } from 'pinia'
import axios from 'axios'

export const useHuntingAreaStore = defineStore('hunting-area-store', {
  state: () => {
    return {}
  },

  actions: {
    async createHuntingArea(payload: any) {
      const data = JSON.stringify({
        name: payload.name,
        description: payload.description,
        coordinates_type: 'Point',
        coordinates: payload.coordinates,
        is_disabled: false,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUTING_AREAS_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async updateHuntingArea(id: string, payload: any) {
      const data = JSON.stringify({
        name: payload.name,
        description: payload.description,
        coordinates_type: 'Point',
        coordinates: payload.coordinates,
        is_disabled: false,
      })

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUTING_AREAS_URL + id + '/',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async deleteHuntingArea(id: string, force: boolean = false) {
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url:
          import.meta.env.VITE_APP_BASE_URL +
          import.meta.env.VITE_APP_HUTING_AREAS_URL +
          id +
          '/' +
          (force ? '?force=true' : ''),
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

    async getHuntingAreaById(id: string) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_HUTING_AREAS_URL + id + '/',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      return response
    },

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
      const config = {
        method: 'delete',
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
  },
})
