import { defineStore } from 'pinia'
import axios from 'axios'

export interface SpecieUnit {
  id?: number
  specie_id: number
  name: string
  images?: string[]
  descriptions?: string
  created_at?: string
  updated_at?: string
}

export const useSpecieUnitsStore = defineStore('specie-units-store', {
  state: () => ({
    specieUnits: [] as SpecieUnit[],
    loading: false,
  }),

  actions: {
    async getSpecieUnits(specieId?: number) {
      const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
      const suffix = (import.meta.env.VITE_APP_SPECIE_UNITS_URL || 'settings/specie-units/').replace(/^\/+/, '')
      let url = `${baseUrl}/${suffix}`
      if (specieId) {
        url += `?specie_id=${specieId}`
      }

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

    async getSpecieUnitById(id: number) {
      const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
      const suffix = (import.meta.env.VITE_APP_SPECIE_UNITS_URL || 'settings/specie-units/').replace(/^\/+/, '')
      const url = `${baseUrl}/${suffix}${id}`

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

    async createSpecieUnit(payload: { specie_id: number; name: string; images?: string[]; descriptions?: string }) {
      const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
      const suffix = (import.meta.env.VITE_APP_SPECIE_UNITS_URL || 'settings/specie-units/').replace(/^\/+/, '')
      const url = `${baseUrl}/${suffix}`

      const data = JSON.stringify({
        specie_id: payload.specie_id,
        name: payload.name,
        images: payload.images || [],
        descriptions: payload.descriptions || '',
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
      return response
    },

    async updateSpecieUnit(id: number, payload: { name?: string; images?: string[]; descriptions?: string }) {
      const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
      const suffix = (import.meta.env.VITE_APP_SPECIE_UNITS_URL || 'settings/specie-units/').replace(/^\/+/, '')
      const url = `${baseUrl}/${suffix}${id}`

      const data = JSON.stringify(payload)

      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async deleteSpecieUnit(id: number) {
      const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
      const suffix = (import.meta.env.VITE_APP_SPECIE_UNITS_URL || 'settings/specie-units/').replace(/^\/+/, '')
      const url = `${baseUrl}/${suffix}${id}`

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
  },
})
