import axios from 'axios'

const apiBase = 'https://abserp.iosuite.org/api/v1'

export interface SeatCell {
  id?: number | string
  seat_map_id?: number
  label: string
  type: 'SEAT' | 'STAFF' | 'DOOR' | 'TOILET' | 'FRIDGE' | 'CABINET' | 'SPACE'
  position_x: number
  position_y: number
}

export interface SeatMap {
  id?: number
  name: string
  description?: string
  seat_identifications?: string
  identification?: string
  configuration?: string
  seat_layout?: SeatCell[][]
}

export interface SeatMapSummary {
  seat_map: SeatMap
  summary: {
    passenger_seat: number
    staff_seat: number
    door: string
    toilet: string
    fridge: number
    cabinet: number
    buses_assigned?: any[]
  }
}

export interface LayoutComponent {
  id: number
  name: string
}

export interface LayoutComponentsResponse {
  data: {
    components: LayoutComponent[]
    configurations: LayoutComponent[]
    idententifications: LayoutComponent[]
  }
}

const axiosInstance = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const seatMapService = {
  /**
   * List all seat maps
   */
  listSeatMaps() {
    return axiosInstance.get<{ data: SeatMapSummary[] }>('seat-maps')
  },

  /**
   * Get single seat map with layout
   */
  getSeatMap(id: number | string) {
    return axiosInstance.post<{ seat_map: SeatMap; seat_layout: SeatCell[][] }>(`seat-maps/${id}`)
  },

  /**
   * Create new seat map with layouts
   */
  createSeatMap(payload: {
    seat_map_name: string
    seat_map_description?: string
    layouts: SeatCell[]
  }) {
    return axiosInstance.post<{ success: boolean; message: string }>('seat-map-layout', payload)
  },

  /**
   * Update existing seat map
   */
  updateSeatMap(payload: {
    seat_map_id: number
    seat_map_name: string
    seat_map_description?: string
    seat_map_identification?: string
    seat_map_configuration?: string
    layouts: SeatCell[]
  }) {
    return axiosInstance.put<{ status: string; message: string }>('update-seat-map-layouts', payload)
  },

  /**
   * Delete seat map
   */
  deleteSeatMap(id: number) {
    return axiosInstance.delete<{ statu: number; message: string }>(`seat-maps/${id}`)
  },

  /**
   * Get layout components (seat types, configurations, identifications)
   */
  getLayoutComponents() {
    return axiosInstance.get<LayoutComponentsResponse>('layout-components')
  },
}

export default seatMapService
