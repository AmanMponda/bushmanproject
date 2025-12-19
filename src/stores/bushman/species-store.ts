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
    // VITE_APP_CURRENCIES_URL
    async createSpecies(species: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SPECIES_URL
      const data = JSON.stringify({
        name: species.name,
        type: species.type,
        scientific_name: species.scientific_name,
        description: species.description,
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
  },
})
