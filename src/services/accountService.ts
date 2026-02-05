/**
 * Account Management Service
 * Handles API calls for account operations (CRUD, export, etc)
 */

const getApiBase = () => (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8000/api/v1.0/').replace(/\/$/, '')

interface CreateAccountPayload {
  name: string
  code: string
  parent_account_id: number | null
  account_group_id: number
  company_id?: number
}

interface Account {
  id: number | string
  code: string
  name: string
  parent_account_id: number | string | null
  children?: Account[]
}

export const accountService = {
  /**
   * Fetch account tree (nested hierarchy)
   */
  async fetchTree() {
    const url = new URL(`${getApiBase()}/chart-of-accounts/tree`)
    url.searchParams.set('company_id', '1')

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  },

  /**
   * Create a new account
   */
  async createAccount(payload: CreateAccountPayload) {
    const url = new URL(`${getApiBase()}/chart-of-accounts`)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to create account: HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.data || data
  },

  /**
   * Update an account
   */
  async updateAccount(id: number, payload: Partial<CreateAccountPayload>) {
    const url = new URL(`${getApiBase()}/chart-of-accounts/${id}`)

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to update account: HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.data || data
  },

  /**
   * Delete an account
   */
  async deleteAccount(id: number) {
    const url = new URL(`${getApiBase()}/chart-of-accounts/${id}`)

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to delete account: HTTP ${response.status}`)
    }

    return true
  },

  /**
   * Export chart of accounts as PDF
   */
  async exportPDF(companyId: number = 1) {
    const url = new URL(`${getApiBase()}/chart-of-accounts/print`)
    url.searchParams.set('format', 'pdf')
    url.searchParams.set('company_id', String(companyId))

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Failed to export PDF: HTTP ${response.status}`)
    }

    // Get filename from response header or use default
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `chart-of-accounts-${new Date().toISOString().split('T')[0]}.pdf`
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename[^;=\n]*=(["\']?)([^"\'\n]*)\1/i)
      if (matches && matches[2]) {
        filename = matches[2]
      }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  /**
   * Export chart of accounts as Excel
   */
  async exportExcel(companyId: number = 1) {
    const url = new URL(`${getApiBase()}/chart-of-accounts/print`)
    url.searchParams.set('format', 'excel')
    url.searchParams.set('company_id', String(companyId))

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Failed to export Excel: HTTP ${response.status}`)
    }

    // Get filename from response header or use default
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `chart-of-accounts-${new Date().toISOString().split('T')[0]}.xlsx`
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename[^;=\n]*=(["\']?)([^"\'\n]*)\1/i)
      if (matches && matches[2]) {
        filename = matches[2]
      }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  /**
   * Fetch chart of accounts as JSON (for preview/display)
   */
  async fetchPrintData(companyId: number = 1) {
    const url = new URL(`${getApiBase()}/chart-of-accounts/print`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('company_id', String(companyId))

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Failed to fetch print data: HTTP ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  },

  /**
   * Fetch account groups for dropdown selection
   */
  async fetchAccountGroups() {
    const url = new URL(`${getApiBase()}/account-groups`)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch account groups: HTTP ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  }
}
