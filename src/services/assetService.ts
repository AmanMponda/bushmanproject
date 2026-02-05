import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
const assetUrl = () => `${apiBase}`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ==================== TYPE DEFINITIONS ====================

export type AssetClass = 'VEHICLE' | 'EQUIPMENT' | 'BUILDING' | 'IT' | 'FURNITURE' | 'TIRE' | 'OTHER'
export type AssetStatus = 'DRAFT' | 'ACTIVE' | 'IN_REPAIR' | 'DISPOSED' | 'SOLD' | 'LOST'
export type OwnershipType = 'OWNED' | 'LEASED' | 'HIRED' | 'CUSTOMER'
export type VehicleType = 'CAR' | 'TRUCK' | 'BUS' | 'MOTORBIKE' | 'TRACTOR' | 'OTHER'
export type SubjectType = 'ASSET' | 'COST_CENTER' | 'LOCATION' | 'STORE_POSITION' | 'ENTITY'
export type ReadingType = 'ODOMETER' | 'HOURS' | 'FUEL_DIP' | 'METER' | 'OTHER'
export type ReadingDirection = 'INCREASING' | 'ANY'
export type ReadingSource = 'MANUAL' | 'JOB_CARD' | 'FUEL_ISSUE' | 'GPS' | 'IMPORT'

export interface VehicleModel {
  id: number
  make: string
  model: string
  variant: string | null
  type: VehicleType
  description: string | null
  created_at: string
  updated_at: string
}

export interface AssetMotorVehicle {
  id?: number
  asset_id?: number
  vehicle_model_id: number
  fuel_used_id?: number | null
  chassis_number?: string | null
  engine_number?: string | null
  registration_number?: string | null
  manufacture_year?: number | null
  color?: string | null
  engine_capacity_cc?: number | null
  tank_capacity_liters?: number | null
  axle_count?: number | null
  gross_weight?: number | null
  tare_weight?: number | null
  vehicle_model?: VehicleModel
}

export interface AssetGroup {
  id: number
  company_id: number
  parent_id: number | null
  code: string
  name: string
  asset_class: AssetClass
  default_useful_life_months: number | null
  default_depr_rate_percent: number | null
  description: string | null
  is_active: boolean
  parent?: AssetGroup
  children?: AssetGroup[]
}

export interface Asset {
  id: number
  company_id: number
  asset_group_id: number
  item_id: number | null
  code: string
  name: string
  quantity: number
  uom_id: number | null
  acquisition_date: string
  available_for_use_date: string | null
  acquisition_cost: number
  salvage_value: number
  book_value: number
  status: AssetStatus
  ownership: OwnershipType
  description: string | null
  uuid: string
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string
  asset_group?: AssetGroup
  motor_vehicle?: AssetMotorVehicle
}

export interface ReadingSubject {
  id: number
  company_id: number
  subject_type: SubjectType
  subject_id: number
  reading_type: ReadingType
  unit_of_measurement_id: number
  direction: ReadingDirection
  min_step: number | null
  max_step: number | null
  name: string
  is_active: boolean
  latest_reading?: Reading
}

export interface Reading {
  id: number
  company_id: number
  reading_subject_id: number
  reading_value: number
  reading_time: string
  handler: string | null
  remarks: string | null
  reading_source: ReadingSource
  location_id: number | null
  created_by: number | null
  created_at: string
  updated_at: string
  reading_subject?: ReadingSubject
}

export const assetService = {
  // ==================== ASSET GROUPS ====================

  getAssetGroupMetadata() {
    return axios.get(`${assetUrl()}/asset-groups/metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  listAssetGroups(params = {}) {
    return axios.get(`${assetUrl()}/asset-groups`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getAssetGroupTree() {
    return axios.get(`${assetUrl()}/asset-groups`, {
      params: { as_tree: true },
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  createAssetGroup(payload: any) {
    return axios.post(`${assetUrl()}/asset-groups`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getAssetGroup(id: number) {
    return axios.get(`${assetUrl()}/asset-groups/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateAssetGroup(id: number, payload: any) {
    return axios.put(`${assetUrl()}/asset-groups/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  deleteAssetGroup(id: number) {
    return axios.delete(`${assetUrl()}/asset-groups/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== ASSETS ====================

  getAssetMetadata() {
    return axios.get(`${assetUrl()}/assets/metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  listAssets(params = {}) {
    return axios.get(`${assetUrl()}/assets`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  createAsset(payload: any) {
    return axios.post(`${assetUrl()}/assets`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getAsset(id: number) {
    return axios.get(`${assetUrl()}/assets/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateAsset(id: number, payload: any) {
    return axios.put(`${assetUrl()}/assets/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  deleteAsset(id: number) {
    return axios.delete(`${assetUrl()}/assets/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateAssetStatus(id: number, status: string) {
    return axios.patch(`${assetUrl()}/assets/${id}/status`, { status }, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== VEHICLE ASSETS ====================

  getVehicleAssetMetadata() {
    return axios.get(`${assetUrl()}/vehicle-assets/metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  listVehicleAssets(params = {}) {
    return axios.get(`${assetUrl()}/vehicle-assets`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  createVehicleAsset(payload: any) {
    return axios.post(`${assetUrl()}/vehicle-assets`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getVehicleAsset(id: number) {
    return axios.get(`${assetUrl()}/vehicle-assets/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateVehicleAsset(id: number, payload: any) {
    return axios.put(`${assetUrl()}/vehicle-assets/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  deleteVehicleAsset(id: number) {
    return axios.delete(`${assetUrl()}/vehicle-assets/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateVehicleAssetStatus(id: number, status: string) {
    return axios.patch(`${assetUrl()}/vehicle-assets/${id}/status`, { status }, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== VEHICLE MODELS ====================

  getVehicleModelMetadata() {
    return axios.get(`${assetUrl()}/vehicle-models/metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getVehicleMakes() {
    return axios.get(`${assetUrl()}/vehicle-models/makes`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  listVehicleModels(params = {}) {
    return axios.get(`${assetUrl()}/vehicle-models`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  createVehicleModel(payload: any) {
    return axios.post(`${assetUrl()}/vehicle-models`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getVehicleModel(id: number) {
    return axios.get(`${assetUrl()}/vehicle-models/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateVehicleModel(id: number, payload: any) {
    return axios.put(`${assetUrl()}/vehicle-models/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  deleteVehicleModel(id: number) {
    return axios.delete(`${assetUrl()}/vehicle-models/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== READING SUBJECTS ====================

  getReadingSubjectMetadata() {
    return axios.get(`${assetUrl()}/reading-subjects/metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  listReadingSubjects(params = {}) {
    return axios.get(`${assetUrl()}/reading-subjects`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  createReadingSubject(payload: any) {
    return axios.post(`${assetUrl()}/reading-subjects`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getReadingSubject(id: number) {
    return axios.get(`${assetUrl()}/reading-subjects/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateReadingSubject(id: number, payload: any) {
    return axios.put(`${assetUrl()}/reading-subjects/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  deleteReadingSubject(id: number) {
    return axios.delete(`${assetUrl()}/reading-subjects/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== READINGS ====================

  getReadingMetadata() {
    return axios.get(`${assetUrl()}/readings/metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  listReadings(params = {}) {
    return axios.get(`${assetUrl()}/readings`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  createReading(payload: any) {
    return axios.post(`${assetUrl()}/readings`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getReadingHistory(subjectId: number, params = {}) {
    return axios.get(`${assetUrl()}/readings/history/${subjectId}`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  getReading(id: number) {
    return axios.get(`${assetUrl()}/readings/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  updateReading(id: number, payload: any) {
    return axios.put(`${assetUrl()}/readings/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  deleteReading(id: number) {
    return axios.delete(`${assetUrl()}/readings/${id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  adjustReading(id: number, payload: { corrected_value: number; reason: string }) {
    return axios.post(`${assetUrl()}/readings/${id}/adjust`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== FUEL TYPES ====================

  listFuelTypes(params = {}) {
    return axios.get(`${assetUrl()}/fuel-types`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },

  // ==================== UNITS OF MEASUREMENT ====================

  listUnitsOfMeasurement(params = {}) {
    return axios.get(`${assetUrl()}/units-of-measurement`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
  },
}

export default assetService
