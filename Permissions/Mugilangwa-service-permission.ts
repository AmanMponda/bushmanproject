// stores/serviceStore.ts
import { defineStore } from 'pinia';
export const useServiceStore = defineStore('serviceStore', {
  state: () => ({
        services: [] as any[], // Replace 'any' with your actual service type if needed
  }),

  actions: {
    setServices(data: any[]) {
      this.services = data;
    },
  },
  // This makes the store auto-persist to localStorage
  persist: true
});
