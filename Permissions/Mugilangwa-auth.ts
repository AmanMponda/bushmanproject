import { defineStore } from "pinia";
import axios from "axios";
import router from "@/router";
import { AUTH_API_URL } from "../config/config";

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

export const useAuthStore = defineStore("auth", {
  state: () => ({
    permissions: [] = localStorage.getItem('permission') ? JSON.parse(localStorage.getItem('permission')!) : [], 
    user: null as User | null,
    token: null as string | null,
    tokenExpiration: null as number | null,
    logoutTimer: null as ReturnType<typeof setTimeout> | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    remainingTime: (state) => {
      if (!state.tokenExpiration) return 0;
      return state.tokenExpiration - Date.now();
    }
  },

  actions: {
    setToken(token: string, expiresIn: number) {
      this.token = token;
      this.tokenExpiration = Date.now() + expiresIn * 1000;
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', this.tokenExpiration.toString());
      this.setLogoutTimer(expiresIn * 1000);
    },

    setUser(user: User) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
    },

    setLogoutTimer(duration: number) {
      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
      }
      
      this.logoutTimer = setTimeout(() => {
        this.logout();
      }, duration);
    },
    async logout() {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axiosInstance.post('logout', {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        this.clearAuthData();
        router.push("/");
      }
    },

    loadUser() {
      const userData = localStorage.getItem("user");
      if (userData) {
        this.user = JSON.parse(userData);
      }
      
      const token = localStorage.getItem('token');
      const expiration = localStorage.getItem('tokenExpiration');
      
      if (token && expiration) {
        const expiresIn = Number(expiration) - Date.now();
        
        if (expiresIn > 0) {
          this.token = token;
          this.tokenExpiration = Number(expiration);
          this.setLogoutTimer(expiresIn);
        } else {
          this.clearAuthData();
        }
      }
    },

    setServices(data: any[]) {
      localStorage.setItem('services', JSON.stringify(data));
    },
  
    getServices(): any[] {
      const data = localStorage.getItem('services');
      return data ? JSON.parse(data) : [];
    },
  
    clearServices() {  // Fixed typo in method name (was clearSerivices)
      localStorage.removeItem('services');
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

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.tokenExpiration = null;
      this.permissions = [];
      
      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
        this.logoutTimer = null;
      }
      
      localStorage.removeItem('services');
      localStorage.removeItem('permission');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
    }
  }
});