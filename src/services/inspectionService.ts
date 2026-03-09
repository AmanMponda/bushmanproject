import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

const inspectionUrl = () => apiBase

export const inspectionService = {
  // ==================== INSPECTION TEMPLATES ====================

  /**
   * List all inspection templates with optional filters
   */
  listTemplates(params = {}) {
    return axios.get(`${inspectionUrl()}/inspection-templates`, { params })
  },

  /**
   * Get a single inspection template by ID
   */
  getTemplate(id: number) {
    return axios.get(`${inspectionUrl()}/inspection-templates/${id}`)
  },

  /**
   * Create a new inspection template
   */
  createTemplate(payload: any) {
    return axios.post(`${inspectionUrl()}/inspection-templates`, payload)
  },

  /**
   * Update an inspection template
   */
  updateTemplate(id: number, payload: any) {
    return axios.put(`${inspectionUrl()}/inspection-templates/${id}`, payload)
  },

  /**
   * Delete an inspection template
   */
  deleteTemplate(id: number) {
    return axios.delete(`${inspectionUrl()}/inspection-templates/${id}`)
  },

  /**
   * Publish an inspection template
   */
  publishTemplate(id: number) {
    return axios.post(`${inspectionUrl()}/inspection-templates/${id}/publish`)
  },

  /**
   * Retire an inspection template
   */
  retireTemplate(id: number) {
    return axios.post(`${inspectionUrl()}/inspection-templates/${id}/retire`)
  },

  /**
   * Get all unique section names across all templates (for section dropdown)
   */
  listSections() {
    return axios.get(`${inspectionUrl()}/inspection-templates/sections`)
  },

  // ==================== TEMPLATE PARAMETERS ====================

  /**
   * List parameters for a template
   */
  listParameters(templateId: number) {
    return axios.get(`${inspectionUrl()}/inspection-templates/${templateId}/parameters`)
  },

  /**
   * Add a parameter to a template
   */
  addParameter(templateId: number, payload: any) {
    return axios.post(`${inspectionUrl()}/inspection-templates/${templateId}/parameters`, payload)
  },

  /**
   * Update a parameter on a template
   */
  updateParameter(templateId: number, parameterId: number, payload: any) {
    return axios.put(`${inspectionUrl()}/inspection-templates/${templateId}/parameters/${parameterId}`, payload)
  },

  /**
   * Remove a parameter from a template
   */
  removeParameter(templateId: number, parameterId: number) {
    return axios.delete(`${inspectionUrl()}/inspection-templates/${templateId}/parameters/${parameterId}`)
  },

  /**
   * Add multiple parameters to a template at once
   */
  addBulkParameters(templateId: number, payload: { parameters: any[] }) {
    return axios.post(`${inspectionUrl()}/inspection-templates/${templateId}/parameters/bulk`, payload)
  },

  /**
   * Import parameters from CSV file
   */
  importParametersCsv(templateId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${inspectionUrl()}/inspection-templates/${templateId}/parameters/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * Reorder parameters in a template
   */
  reorderParameters(templateId: number, payload: { parameters: { id: number; position: number }[] }) {
    return axios.post(`${inspectionUrl()}/inspection-templates/${templateId}/reorder`, payload)
  },

  /**
   * Download inspection template as PDF
   */
  downloadPdf(templateId: number) {
    return axios.get(`${inspectionUrl()}/inspection-templates/${templateId}/download-pdf`, {
      responseType: 'blob'
    })
  },

  // ==================== MAINTENANCE PARAMETERS (Lookup) ====================

  /**
   * List available maintenance parameters for selection
   */
  listMaintenanceParameters(params = {}) {
    return axios.get(`${inspectionUrl()}/maintenance-parameters`, { params })
  },

  /**
   * List maintenance parameters filtered by category ID
   */
  listParametersByCategory(categoryId: number, params = {}) {
    return axios.get(`${inspectionUrl()}/maintenance-parameters`, {
      params: { category_id: categoryId, ...params }
    })
  },

  /**
   * Get a single maintenance parameter
   */
  getMaintenanceParameter(id: number) {
    return axios.get(`${inspectionUrl()}/maintenance-parameters/${id}`)
  },

  /**
   * Create a maintenance parameter
   */
  createMaintenanceParameter(payload: any) {
    return axios.post(`${inspectionUrl()}/maintenance-parameters`, payload)
  },

  /**
   * Update a maintenance parameter
   */
  updateMaintenanceParameter(id: number, payload: any) {
    return axios.put(`${inspectionUrl()}/maintenance-parameters/${id}`, payload)
  },

  /**
   * Delete a maintenance parameter
   */
  deleteMaintenanceParameter(id: number) {
    return axios.delete(`${inspectionUrl()}/maintenance-parameters/${id}`)
  },

  // ==================== MAINTENANCE CATEGORIES ====================

  /**
   * List maintenance categories
   */
  listCategories(params = {}) {
    return axios.get(`${inspectionUrl()}/maintenance-categories`, { params })
  },

  /**
   * Create a maintenance category
   */
  createCategory(payload: any) {
    return axios.post(`${inspectionUrl()}/maintenance-categories`, payload)
  },

  /**
   * Update a maintenance category
   */
  updateCategory(id: number, payload: any) {
    return axios.put(`${inspectionUrl()}/maintenance-categories/${id}`, payload)
  },

  /**
   * Delete a maintenance category
   */
  deleteCategory(id: number) {
    return axios.delete(`${inspectionUrl()}/maintenance-categories/${id}`)
  },

  // ==================== UNITS OF MEASUREMENT ====================

  /**
   * List all units of measurement
   */
  listUnitsOfMeasurement(params = {}) {
    return axios.get(`${inspectionUrl()}/units-of-measurement`, { params })
  },

  // ==================== SITES (Lookup) ====================
  // Note: /sites endpoint not yet implemented in backend
  // Site field is nullable - no API call needed for now
  
  // listSites(params = {}) {
  //   return axios.get(`${inspectionUrl()}/sites`, { params })
  // },

  // ==================== INSPECTION SHEETS ====================

  /**
   * List all inspections with optional filters
   */
  listInspections(params = {}) {
    return axios.get(`${inspectionUrl()}/inspections`, { params })
  },

  /**
   * Create a new inspection sheet
   */
  createInspection(payload: {
    inspection_template_id: number | null
    inspector_id: number
    inspected_at: string
    narrations?: string
    accounting_dimensions?: {
      accounting_dimension_id: number
      handler_id?: number
      reading_id?: number
    }[]
  }) {
    return axios.post(`${inspectionUrl()}/inspections`, payload)
  },

  /**
   * Get inspection details by ID
   */
  getInspection(id: number, params = {}) {
    return axios.get(`${inspectionUrl()}/inspections/${id}`, { params })
  },

  /**
   * Update inspection sheet
   */
  updateInspection(id: number, payload: any) {
    return axios.put(`${inspectionUrl()}/inspections/${id}`, payload)
  },

  /**
   * Delete inspection sheet
   */
  deleteInspection(id: number) {
    return axios.delete(`${inspectionUrl()}/inspections/${id}`)
  },

  /**
   * Submit inspection (change status to submitted)
   */
  submitInspection(id: number) {
    return axios.post(`${inspectionUrl()}/inspections/${id}/submit`)
  },

  /**
   * Approve inspection
   */
  approveInspection(id: number) {
    return axios.post(`${inspectionUrl()}/inspections/${id}/approve`)
  },

  /**
   * Reject inspection
   */
  rejectInspection(id: number, payload?: { reason?: string }) {
    return axios.post(`${inspectionUrl()}/inspections/${id}/reject`, payload)
  },

  // ==================== INSPECTION PARAMETERS (Snapshot) ====================

  /**
   * Fetch parameter snapshot for an inspection (grouped by section)
   */
  getInspectionParameters(inspectionId: number) {
    return axios.get(`${inspectionUrl()}/inspections/${inspectionId}/parameters`)
  },

  // ==================== INSPECTION RESULTS ====================

  /**
   * Save a single field result for an inspection
   */
  saveInspectionResult(inspectionId: number, payload: {
    inspection_sheet_parameter_id: number
    value_text?: string | null
    value_numeric?: number | null
    value_bool?: boolean | null
    value_json?: any
    maintenance_parameter_option_id?: number | null
    inspection_parameter_possible_result_id?: number | null
    remarks?: string
    service_ids?: number[]
  }) {
    return axios.post(`${inspectionUrl()}/inspections/${inspectionId}/results`, payload)
  },

  /**
   * Save multiple results at once (batch / section save)
   */
  saveInspectionResultsBatch(inspectionId: number, payload: {
    results: {
      inspection_sheet_parameter_id: number
      value_text?: string | null
      value_numeric?: number | null
      value_bool?: boolean | null
      value_json?: any
      maintenance_parameter_option_id?: number | null
      remarks?: string
      service_ids?: number[]
    }[]
  }) {
    return axios.post(`${inspectionUrl()}/inspections/${inspectionId}/results/batch`, payload)
  },

  // ==================== INSPECTION COMPLAINTS ====================

  /**
   * List complaints for an inspection
   */
  getInspectionComplaints(inspectionId: number) {
    return axios.get(`${inspectionUrl()}/inspections/${inspectionId}/complaints`)
  },

  /**
   * Add a complaint log to an inspection
   */
  addInspectionComplaint(inspectionId: number, payload: {
    maintenance_category_id: number
    narration?: string
    incident_part_to_blame_id?: number | null
  }) {
    return axios.post(`${inspectionUrl()}/inspections/${inspectionId}/complaints`, payload)
  },

  // ==================== INSPECTION SYMPTOMS ====================

  /**
   * List symptoms for an inspection
   */
  getInspectionSymptoms(inspectionId: number) {
    return axios.get(`${inspectionUrl()}/inspections/${inspectionId}/symptoms`)
  },

  /**
   * Add a symptom to an inspection
   */
  addInspectionSymptom(inspectionId: number, payload: {
    maintenance_symptom_id: number
    description?: string
  }) {
    return axios.post(`${inspectionUrl()}/inspections/${inspectionId}/symptoms`, payload)
  },

  /**
   * Delete a symptom from an inspection
   */
  deleteInspectionSymptom(inspectionId: number, symptomId: number) {
    return axios.delete(`${inspectionUrl()}/inspections/${inspectionId}/symptoms/${symptomId}`)
  },

  /**
   * Delete a complaint from an inspection
   */
  deleteInspectionComplaint(inspectionId: number, complaintId: number) {
    return axios.delete(`${inspectionUrl()}/inspections/${inspectionId}/complaints/${complaintId}`)
  },

  // ==================== INSPECTION JOB CARDS ====================

  /**
   * List job cards for an inspection
   */
  getInspectionJobCards(inspectionId: number) {
    return axios.get(`${inspectionUrl()}/inspections/${inspectionId}/job-cards`)
  },

  /**
   * Link an existing job card to an inspection
   */
  linkInspectionJobCard(inspectionId: number, payload: {
    job_card_id: number
    remarks?: string
  }) {
    return axios.post(`${inspectionUrl()}/inspections/${inspectionId}/job-cards`, payload)
  },

  /**
   * Unlink a job card from an inspection
   */
  unlinkInspectionJobCard(inspectionId: number, linkId: number) {
    return axios.delete(`${inspectionUrl()}/inspections/${inspectionId}/job-cards/${linkId}`)
  },

  // ==================== INSPECTION PARTICIPANTS ====================

  /**
   * List participants for an inspection
   */
  getInspectionParticipants(inspectionId: number) {
    return axios.get(`${inspectionUrl()}/inspections/${inspectionId}/participants`)
  },

  /**
   * Add a participant to an inspection
   */
  addInspectionParticipant(inspectionId: number, payload: {
    entity_id: number
    task_description?: string
  }) {
    return axios.post(`${inspectionUrl()}/inspections/${inspectionId}/participants`, payload)
  },

  /**
   * Remove a participant from an inspection
   */
  removeInspectionParticipant(inspectionId: number, participantId: number) {
    return axios.delete(`${inspectionUrl()}/inspections/${inspectionId}/participants/${participantId}`)
  },

  // ==================== ACCOUNTING DIMENSIONS (Lookup) ====================

  /**
   * List accounting dimension values for the inspection form dropdown.
   * Returns data grouped by dimension type (ASSET, COST_CENTER, etc.)
   * from the accounting_dimension_values table.
   */
  listAccountingDimensions(params = {}) {
    return axios.get(`${inspectionUrl()}/inspections/accounting-dimensions`, { params })
  },

  // ==================== MAINTENANCE SYMPTOMS (Lookup) ====================

  /**
   * List available maintenance symptoms
   */
  listMaintenanceSymptoms(params = {}) {
    return axios.get(`${inspectionUrl()}/maintenance-symptoms`, { params })
  },

  // ==================== JOB CARDS (Lookup) ====================

  /**
   * List available job cards for linking
   */
  listJobCards(params = {}) {
    return axios.get(`${inspectionUrl()}/job-cards`, { params })
  },

  // ==================== ENTITIES (Lookup) ====================

  /**
   * List entities for participant selection
   */
  listEntities(params = {}) {
    return axios.get(`${inspectionUrl()}/entities`, { params })
  },

  // ==================== USERS (for inspector dropdown) ====================

  /**
   * List users with optional role filter
   */
  listUsers(params = {}) {
    return axios.get(`${inspectionUrl()}/users`, { params })
  },

  // ==================== EMPLOYEES (for inspector/handler dropdown) ====================

  /**
   * List employees for inspector and handler selection
   */
  listEmployees(params = {}) {
    return axios.get(`${inspectionUrl()}/employees`, { params })
  },

  // ==================== PARTS TO BLAME (Lookup) ====================

  /**
   * List incident parts to blame for complaint form
   */
  listPartsToBlame(params = {}) {
    return axios.get(`${inspectionUrl()}/incident-parts-to-blame`, { params })
  },
}
