import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

const accountingUrl = () => `${apiBase}/api/v1.0`

export const accountingService = {
  // ==================== JOURNAL VOUCHERS ====================

  /**
   * List all journal vouchers with optional filters
   */
  listJournalVouchers(params = {}) {
    return axios.get(`${accountingUrl()}/journal-vouchers`, { params })
  },

  /**
   * Get a single journal voucher by ID
   */
  getJournalVoucher(id: number) {
    return axios.get(`${accountingUrl()}/journal-vouchers/${id}`)
  },

  /**
   * Create a new journal voucher
   */
  createJournalVoucher(payload: any) {
    return axios.post(`${accountingUrl()}/journal-vouchers`, payload)
  },

  /**
   * Update a journal voucher
   */
  updateJournalVoucher(id: number, payload: any) {
    return axios.put(`${accountingUrl()}/journal-vouchers/${id}`, payload)
  },

  /**
   * Delete a journal voucher
   */
  deleteJournalVoucher(id: number) {
    return axios.delete(`${accountingUrl()}/journal-vouchers/${id}`)
  },

  /**
   * Add an account line to a journal voucher
   */
  addAccountLine(voucherId: number, payload: any) {
    return axios.post(`${accountingUrl()}/journal-vouchers/${voucherId}/accounts`, payload)
  },

  /**
   * Remove an account line from a journal voucher
   */
  removeAccountLine(voucherId: number, lineId: number) {
    return axios.delete(`${accountingUrl()}/journal-vouchers/${voucherId}/accounts/${lineId}`)
  },

  /**
   * Post a journal voucher
   */
  postJournalVoucher(id: number, payload: any = {}) {
    return axios.post(`${accountingUrl()}/journal-vouchers/${id}/post`, payload)
  },

  /**
   * Reverse a journal voucher
   */
  reverseJournalVoucher(id: number, payload: any = {}) {
    return axios.post(`${accountingUrl()}/journal-vouchers/${id}/reverse`, payload)
  },

  /**
   * Get journal voucher summary
   */
  getJournalVoucherSummary(id: number) {
    return axios.get(`${accountingUrl()}/journal-vouchers/${id}/summary`)
  },

  // ==================== INVOICES ====================

  /**
   * List all invoices with optional filters
   */
  listInvoices(params = {}) {
    return axios.get(`${accountingUrl()}/invoices`, { params })
  },

  /**
   * Get a single invoice by ID
   */
  getInvoice(id: number) {
    return axios.get(`${accountingUrl()}/invoices/${id}`)
  },

  /**
   * Create a new invoice
   */
  createInvoice(payload: any) {
    return axios.post(`${accountingUrl()}/invoices`, payload)
  },

  /**
   * Update an invoice
   */
  updateInvoice(id: number, payload: any) {
    return axios.put(`${accountingUrl()}/invoices/${id}`, payload)
  },

  /**
   * Delete an invoice
   */
  deleteInvoice(id: number) {
    return axios.delete(`${accountingUrl()}/invoices/${id}`)
  },

  /**
   * Add a line item to an invoice
   */
  addInvoiceLineItem(invoiceId: number, payload: any) {
    return axios.post(`${accountingUrl()}/invoices/${invoiceId}/line-items`, payload)
  },

  /**
   * Remove a line item from an invoice
   */
  removeInvoiceLineItem(invoiceId: number, lineId: number) {
    return axios.delete(`${accountingUrl()}/invoices/${invoiceId}/line-items/${lineId}`)
  },

  /**
   * Approve an invoice
   */
  approveInvoice(id: number, payload: any = {}) {
    return axios.post(`${accountingUrl()}/invoices/${id}/approve`, payload)
  },

  /**
   * Post an invoice (creates journal voucher)
   */
  postInvoice(id: number, payload: any = {}) {
    return axios.post(`${accountingUrl()}/invoices/${id}/post`, payload)
  },

  /**
   * Record a settlement/payment for an invoice
   */
  recordSettlement(invoiceId: number, payload: any) {
    return axios.post(`${accountingUrl()}/invoices/${invoiceId}/settlements`, payload)
  },

  /**
   * Get invoice summary
   */
  getInvoiceSummary(id: number) {
    return axios.get(`${accountingUrl()}/invoices/${id}/summary`)
  },

  // ==================== REFERENCE DATA ====================

  /**
   * Get document types
   */
  getDocumentTypes(params = {}) {
    return axios.get(`${accountingUrl()}/document-types`, { params })
  },

  /**
   * Get accounts (chart of accounts)
   */
  getAccounts(params = {}) {
    return axios.get(`${accountingUrl()}/accounts`, { params })
  },

  /**
   * Get currencies
   */
  getCurrencies(params = {}) {
    return axios.get(`${accountingUrl()}/currencies`, { params })
  },

  /**
   * Get payment instruments (for settlements)
   */
  getPaymentInstruments(params = {}) {
    return axios.get(`${accountingUrl()}/payment-instruments`, { params })
  },

  /**
   * Get companies
   */
  getCompanies(params = {}) {
    return axios.get(`${accountingUrl()}/companies`, { params })
  },

  /**
   * Get branches
   */
  getBranches(companyId: number, params = {}) {
    return axios.get(`${accountingUrl()}/companies/${companyId}/branches`, { params })
  },

  /**
   * Get entities (customers/suppliers)
   */
  getEntities(params = {}) {
    return axios.get(`${accountingUrl()}/entities`, { params })
  },

  /**
   * Get invoice statuses
   */
  getInvoiceStatuses() {
    return axios.get(`${accountingUrl()}/invoice-statuses`)
  },

  /**
   * Get journal voucher statuses
   */
  getJournalVoucherStatuses() {
    return axios.get(`${accountingUrl()}/journal-voucher-statuses`)
  },

  // ==================== LINKED DOCUMENTS ====================

  /**
   * Link a journal voucher account to a requisition or other document
   * Supported types: ENTITY, ITEM, CONTRACT, ATTACHMENT, ORDER, STOCK_ENTRY, REQUISITION, INVOICE, PAYMENT
   */
  linkJournalVoucherAccount(
    journalVoucherId: number,
    accountLineId: number,
    linkableType: string,
    linkableId: number,
    role?: string
  ) {
    return axios.post(`${accountingUrl()}/journal-vouchers/${journalVoucherId}/accounts/${accountLineId}/links`, {
      linkable_type: linkableType,
      linkable_id: linkableId,
      role: role || null
    })
  },

  /**
   * Get linked documents for a journal voucher account line
   */
  getLinkedDocuments(journalVoucherId: number, accountLineId: number) {
    return axios.get(`${accountingUrl()}/journal-vouchers/${journalVoucherId}/accounts/${accountLineId}/links`)
  },

  /**
   * Remove a linked document from a journal voucher account line
   */
  unlinkDocument(journalVoucherId: number, accountLineId: number, linkId: number) {
    return axios.delete(`${accountingUrl()}/journal-vouchers/${journalVoucherId}/accounts/${accountLineId}/links/${linkId}`)
  },

  /**
   * Link an invoice to a requisition or other document
   */
  linkInvoiceDocument(
    invoiceId: number,
    linkableType: string,
    linkableId: number,
    role?: string
  ) {
    return axios.post(`${accountingUrl()}/invoices/${invoiceId}/links`, {
      linkable_type: linkableType,
      linkable_id: linkableId,
      role: role || null
    })
  },

  /**
   * Get linked documents for an invoice
   */
  getInvoiceLinkedDocuments(invoiceId: number) {
    return axios.get(`${accountingUrl()}/invoices/${invoiceId}/links`)
  },

  /**
   * Remove a linked document from an invoice
   */
  unlinkInvoiceDocument(invoiceId: number, linkId: number) {
    return axios.delete(`${accountingUrl()}/invoices/${invoiceId}/links/${linkId}`)
  },

  // ==================== REQUISITION INTEGRATION ====================

  /**
   * Get requisitions that can be linked (APPROVED or CLOSED status)
   */
  getRequisitionsForLinking(params = {}) {
    return axios.get(`${accountingUrl()}/requisitions/available-for-linking`, { params })
  },

  /**
   * Get requisition details by ID
   */
  getRequisitionDetails(requisitionId: number) {
    return axios.get(`${accountingUrl()}/requisitions/${requisitionId}`)
  },

  /**
   * Get requisition items for linking to invoice lines
   */
  getRequisitionItems(requisitionId: number) {
    return axios.get(`${accountingUrl()}/requisitions/${requisitionId}/items`)
  }
}

export default accountingService
