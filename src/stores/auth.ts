import { defineStore } from "pinia";
import axios from "axios";
import { AUTH_API_URL } from "@/config/config.js";
// import { useNotification } from '@/composables/notification';

// const { showAlert } = useNotification();

const axiosInstance = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

interface User {
  id: string;
  employee_id: string;
  username: string;
  email: string;
  api_token: string;
  updated_at: string;
}

interface CompaniesIds {
  ghrm_id: number | null;
  abs_id: number | null;
  maCargo_id: number | null;
  crm_id: number | null;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    permissions: [] = localStorage.getItem('permission') ? JSON.parse(localStorage.getItem('permission')!) : [],
    user: null as User | null,
    token: null as string | null,
    tokenExpiration: null as number | null,
    logoutTimer: null as ReturnType<typeof setTimeout> | null,
    companiesIds: null as CompaniesIds | null,
    services: [] as any[],
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    remainingTime: (state) => {
      if (!state.tokenExpiration) return 0;
      return state.tokenExpiration - Date.now();
    },
    hasCompanyAccess: (state) => (companyKey: keyof CompaniesIds) => {
      return state.companiesIds?.[companyKey] !== null;
    }
  },

  actions: {
    setToken(token: string, expiresIn: number) {
      this.token = token;
      this.tokenExpiration = Date.now() + expiresIn * 1000;
      localStorage.setItem("token", token);
      localStorage.setItem("tokenExpiration", this.tokenExpiration.toString());
      this.setLogoutTimer(expiresIn * 1000);
    },

    setUser(user: User) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
    },

    setCompanies(companies: CompaniesIds) {
      this.companiesIds = companies;
      localStorage.setItem("companiesIds", JSON.stringify(companies));
    },

    setActiveService(service: any) {
      localStorage.setItem('selectedService', JSON.stringify(service));
    },

    getActiveService(): any {
      const service = localStorage.getItem('selectedService');
      return service ? JSON.parse(service) : null;
    },

    clearActiveService() {
      localStorage.removeItem('selectedService');
      localStorage.removeItem('permission');
    },

    setLogoutTimer(duration: number) {
      if (this.logoutTimer) clearTimeout(this.logoutTimer);
      this.logoutTimer = setTimeout(() => {
        this.logout();
      }, duration);
    },

    loadUser() {
      try {
        // Load user
        const userData = localStorage.getItem("user");
        if (userData) {
          this.user = JSON.parse(userData);
        }

        const companiesData = localStorage.getItem("companiesIds");
        if (companiesData) this.companiesIds = JSON.parse(companiesData);

        // Load services
        const servicesData = localStorage.getItem("services");
        if (servicesData) this.services = JSON.parse(servicesData);

        // Load token and expiration
        const token = localStorage.getItem('token');
        const expiration = localStorage.getItem('tokenExpiration');

        if (token && expiration) {
          const expiresIn = Number(expiration) - Date.now();

          // If token is still valid
          if (expiresIn > 0) {
            this.token = token;
            this.tokenExpiration = Number(expiration);
            this.setLogoutTimer(expiresIn);
          } else {
            // Token expired, clear storage
            this.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        this.clearAuthData();
      }

    },

    setServices(services: any[]) {
      this.services = services;
      localStorage.setItem("services", JSON.stringify(services));
    },

    getServices(): any[] {
      const data = localStorage.getItem('services');
      return data ? JSON.parse(data) : [];
    },

    clearServices() {  // Fixed typo in method name
      localStorage.removeItem('services');
      this.services = [];
    },

    setPermissions(permissions: string[]) {
      this.permissions = permissions;
    },

    getPermissions(): any[] {
      const data = localStorage.getItem('permission');
      return data ? JSON.parse(data) : [];
    },

    hasPermission(permissionName: string): boolean {
      return this.permissions.includes(permissionName);
    },

    async logout() {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          return await axiosInstance.post('logout', {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Logout failed:', error);
        const errorMessage = error instanceof Error ? (error as any).response?.data?.message || error.message : 'Please try again.';
        // showAlert('error', `Logout failed. ` + (errorMessage || 'Please try again.'));
        throw error;
      } finally {
        this.user = null;
        this.token = null;
        this.tokenExpiration = null;
        this.companiesIds = null;
        this.permissions = [];
        this.services = [];
        this.clearActiveService();
        if (this.logoutTimer) {
          clearTimeout(this.logoutTimer);
        }
        this.clearAuthData();
      }
    },

    clearAuthData() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      localStorage.removeItem("companiesIds");
      localStorage.removeItem("services");
      localStorage.removeItem("permission");
    }
  },
});
