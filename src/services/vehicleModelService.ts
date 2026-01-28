import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

export interface VehicleModel {
  id?: number
  make: string
  model: string
  variant?: string | null
  type: 'CAR' | 'TRUCK' | 'BUS' | 'MOTORBIKE' | 'TRACTOR' | 'OTHER'
  description?: string | null
  full_name?: string
  motor_vehicles?: any[]
  created_at?: string
  updated_at?: string
}

export interface VehicleModelMetadata {
  vehicle_types: string[]
  accounts: Array<{ id: number; company_id?: number; code?: string; name: string }>
}

export const vehicleModelService = {
  /**
   * Get metadata for vehicle models
   */
  getMetadata() {
    return axios.get<{ vehicle_types: string[]; accounts: any[] }>(`${apiBase}/vehicle-models/metadata`)
  },

  /**
   * List all vehicle models
   */
  listVehicleModels(params: {
    type?: string
    make?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    per_page?: number
  } = {}) {
    return axios.get<{ success: boolean; data: VehicleModel[] }>(`${apiBase}/vehicle-models`, { params })
  },

  /**
   * Get distinct list of makes
   */
  getMakes() {
    return axios.get<{ success: boolean; data: string[] }>(`${apiBase}/vehicle-models/makes`)
  },

  /**
   * Get single vehicle model
   */
  getVehicleModel(id: number) {
    return axios.get<{ success: boolean; data: VehicleModel }>(`${apiBase}/vehicle-models/${id}`)
  },

  /**
   * Create vehicle model
   */
  createVehicleModel(payload: Partial<VehicleModel>) {
    return axios.post<{ success: boolean; message: string; data: VehicleModel }>(
      `${apiBase}/vehicle-models`,
      payload
    )
  },

  /**
   * Update vehicle model
   */
  updateVehicleModel(id: number, payload: Partial<VehicleModel>) {
    return axios.put<{ success: boolean; message: string; data: VehicleModel }>(
      `${apiBase}/vehicle-models/${id}`,
      payload
    )
  },

  /**
   * Delete vehicle model
   */
  deleteVehicleModel(id: number) {
    return axios.delete<{ success: boolean; message: string }>(`${apiBase}/vehicle-models/${id}`)
  }
}

export default vehicleModelService
