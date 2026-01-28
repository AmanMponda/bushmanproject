import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

export interface VehicleAsset {
  id?: number
  company_id?: number
  asset_group_id?: number
  item_id?: number | null
  code: string
  name: string
  registration_number?: string | null
  make?: string | null
  model?: string | null
  manufacture_year?: number | null
  registration_date?: string | null
  chassis_number?: string | null
  quantity?: number
  uom_id?: number | null
  acquisition_date: string
  available_for_use_date?: string | null
  acquisition_cost: number
  salvage_value?: number
  book_value?: number
  status?: 'DRAFT' | 'ACTIVE' | 'IN_REPAIR' | 'DISPOSED' | 'SOLD' | 'LOST'
  ownership?: 'OWNED' | 'LEASED' | 'HIRED' | 'CUSTOMER'
  description?: string | null
  is_active?: boolean
  asset_group?: any
  motor_vehicle?: MotorVehicle
  created_at?: string
  updated_at?: string
}

export interface MotorVehicle {
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
  vehicle_model?: any
  fuel_used?: any
}

export interface VehicleAssetMetadata {
  statuses: string[]
  ownership_types: string[]
  vehicle_models: any[]
  vehicle_types: string[]
  fuel_items: any[]
  units_of_measurement: any[]
  accounts: any[]
  currencies: any[]
}

export interface FleetSummary {
  total_count: number
  active_count: number
  total_acquisition_cost: number
  total_book_value: number
  by_status: Record<string, number>
  by_ownership: Record<string, number>
  by_type: Record<string, number>
}

export const vehicleAssetService = {
  /**
   * Get metadata
   */
  getMetadata() {
    return axios.get<{ success: boolean; message: string; data: VehicleAssetMetadata }>(
      `${apiBase}/vehicle-assets/metadata`
    )
  },

  /**
   * List vehicle assets for display table
   */
  listVehicleAssetsDisplay(params: {
    search?: string
    status?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}) {
    return axios.get<{ success: boolean; data: VehicleAsset[] }>(`${apiBase}/vehicle-assets/display`, { params })
  },

  /**
   * Get single vehicle asset
   */
  getVehicleAsset(id: number) {
    return axios.get<{ success: boolean; data: VehicleAsset }>(`${apiBase}/vehicle-assets/${id}`)
  },

  /**
   * Create vehicle asset
   */
  createVehicleAsset(payload: Partial<VehicleAsset> & Partial<MotorVehicle>) {
    return axios.post<{ success: boolean; message: string; data: VehicleAsset }>(
      `${apiBase}/vehicle-assets`,
      payload
    )
  },

  /**
   * Update vehicle asset
   */
  updateVehicleAsset(id: number, payload: Partial<VehicleAsset> & Partial<MotorVehicle>) {
    return axios.put<{ success: boolean; message: string; data: VehicleAsset }>(
      `${apiBase}/vehicle-assets/${id}`,
      payload
    )
  },

  /**
   * Delete vehicle asset
   */
  deleteVehicleAsset(id: number) {
    return axios.delete<{ success: boolean; message: string }>(`${apiBase}/vehicle-assets/${id}`)
  },

  /**
   * Update status only
   */
  updateStatus(id: number, status: string) {
    return axios.patch<{ success: boolean; message: string; data: VehicleAsset }>(
      `${apiBase}/vehicle-assets/${id}/status`,
      { status }
    )
  },

  /**
   * Find by registration number
   */
  findByRegistration(registration_number: string) {
    return axios.get<{ success: boolean; data: VehicleAsset }>(
      `${apiBase}/vehicle-assets/find-by-registration`,
      { params: { registration_number } }
    )
  },

  /**
   * Find by chassis number
   */
  findByChassis(chassis_number: string) {
    return axios.get<{ success: boolean; data: VehicleAsset }>(
      `${apiBase}/vehicle-assets/find-by-chassis`,
      { params: { chassis_number } }
    )
  },

  /**
   * Get fleet summary
   */
  getFleetSummary() {
    return axios.get<{ success: boolean; data: FleetSummary }>(`${apiBase}/vehicle-assets/summary`)
  }
}

export default vehicleAssetService
