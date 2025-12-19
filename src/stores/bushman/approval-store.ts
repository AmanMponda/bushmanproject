// VITE_APP_APPROVAL_CHAIN_VSET_URL

import { defineStore } from 'pinia'
import axios from 'axios'

export const useApprovalChainStore = defineStore('approval-chain-store', {
  state: () => {
    return {
      approvalChainModules: [] as any,
      loadingApprovalChain: false,
      approvalChainLevels: [] as any,
      loadingApprovalChainLevels: false,
      approvalChainRoles: [] as any,
    }
  },

  actions: {
    async getRequisitionsApprovalChain(usedAsOptions: boolean = false) {
      this.loadingApprovalChain = true

      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_APPROVAL_CHAIN_VSET_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        if (response.status === 200) {
          this.loadingApprovalChain = false
          if (!usedAsOptions) {
            this.approvalChainModules = response.data.map((approval_chain: any) => {
              return {
                name: approval_chain.name,
                is_active: approval_chain.active,
                selfitem: approval_chain,
              }
            })
          } else {
            this.approvalChainModules = response.data.map((approval_chain: any) => {
              return {
                value: approval_chain.id,
                text: approval_chain.name,
              }
            })
          }
        }

        return response
      } catch (error) {
        console.log(error)
        this.loadingApprovalChain = false
        return error
      }
    },

    async createApprovalChain(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_APPROVAL_CHAIN_VSET_URL
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: payload,
      }
      const response = await axios.request(config)
      if (response.status === 200) {
        this.approvalChainModules = response.data.map((approval_chain: any) => {
          return {
            name: approval_chain.name,
            is_active: approval_chain.active,
            selfitem: approval_chain,
          }
        })
      }
      return response
    },

    async getApprovalChainLevels(approval_chain_module_id: any) {
      this.loadingApprovalChainLevels = true
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_APPROVAL_CHAIN_LEVELS_VSET_URL +
        `?approval_chain_module_id=${approval_chain_module_id}`
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      if (response.status === 200) {
        this.loadingApprovalChainLevels = false
        this.approvalChainLevels = response.data.map((level: any) => {
          return {
            text: level.approval_chain_role.name,
            value: level.id,
          }
        })
      }

      return response
    },

    // GET ROLES
    // VITE_APP_APPROVAL_CHAIN_ROLE_VSET_URL
    async getApprovalChainRoles() {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_APPROVAL_CHAIN_ROLE_VSET_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await axios.request(config)
      if (response.status === 200) {
        this.approvalChainRoles = response.data.map((role: any) => {
          return {
            text: role.name,
            value: role.id,
          }
        })
      }
      return response
    },
  },
})
