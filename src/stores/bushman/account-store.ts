import { defineStore } from 'pinia'
import axios from 'axios'

export const useAccountsStore = defineStore('accounts-store', {
  state: () => {
    return {
      companyAccounts: [],
    }
  },

  actions: {
    async createCRDRTransaction(payload: any) {
      const data = JSON.stringify({
        currency_id: payload.currency_id,
        date: payload.date,
        account_type: payload.account_type,
        reference_number: payload.reference_number,
        transaction_type: payload.transaction_type,
        transaction_id: payload.transaction_id,
        amount: payload.amount,
        narration: payload.narration,
        accountable_id: payload.accountable_id,
        accountable_type_id: payload.accountable_type_id,
        sales_confirmation_id: payload.sales_confirmation_id,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_ACCOUNTS_BASE_URL + import.meta.env.VITE_APP_ACCOUNTS_CR_DR_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },
    async createDRCRTransaction(payload: any) {
      const data = JSON.stringify({
        currency_id: payload.currency_id,
        date: payload.date,
        account_type: payload.account_type,
        reference_number: payload.reference_number,
        transaction_type: payload.transaction_type,
        transaction_id: payload.transaction_id,
        amount: payload.amount,
        narration: payload.narration,
        accountable_id: payload.accountable_id,
        accountable_type_id: payload.accountable_type_id,
        sales_confirmation_id: payload.sales_confirmation_id,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: import.meta.env.VITE_APP_ACCOUNTS_BASE_URL + import.meta.env.VITE_APP_ACCOUNT_DR_CR_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async getCompanyAccounts() {
      const config = {
        method: 'get',
        url: import.meta.env.VITE_APP_ACCOUNTS_BASE_URL + import.meta.env.VITE_APP_ACCOUNTS_COMPANY_VSET_URL,
        Headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      if (response.status === 200) {
        this.companyAccounts = response.data.map((account: any) => {
          return {
            value: account.id,
            text: account.account_type,
          }
        })
      }
      return response
    },
  },
})
