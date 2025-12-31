import { defineStore } from 'pinia'
import axios from 'axios'

export const useSpeciesStore = defineStore('species-store', {
  state: () => {
    return {
      itemsByHuntingType: [] as any,
      logo: '',
    }
  },

  actions: {
    // Get all species
    async getSpecies() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + import.meta.env.VITE_APP_TOKEN,
        },
      }
      const response = await axios.request(config)
      return response
    },

    // VITE_APP_CURRENCIES_URL
    async createSpecies(species: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL
      const data = JSON.stringify({
        name: species.name,
        is_active: typeof species.is_active === 'boolean' ? species.is_active : true,

      })
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + import.meta.env.VITE_APP_TOKEN,
        },
        data: data,
      }
      const response = await axios.request(config)
      return response
    },

    async updateSpecies(id: number | string, species: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL + id + '/'
      const data = JSON.stringify({
        name: species.name,
        is_active: typeof species.is_active === 'boolean' ? species.is_active : true,
      })
      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + import.meta.env.VITE_APP_TOKEN,
        },
        data: data,
      }
      const response = await axios.request(config)
      return response
    },

    async deleteSpecies(id: number | string, force: boolean = false) {
      const url =
        import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL + id + '/' + (force ? '?force=true' : '')
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + import.meta.env.VITE_APP_TOKEN,
        },
      }
      const response = await axios.request(config)
      return response
    },

    async bulkDelete(ids: Array<number | string>, force: boolean = false) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL + 'bulk-delete/'
      const data = JSON.stringify({ ids, force })
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + import.meta.env.VITE_APP_TOKEN,
        },
        data,
      }
      const response = await axios.request(config)
      return response
    },
  },
})
