import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/,'')

const ordersUrl = () => `${apiBase}/orders`

export const orderService = {
  list(params = {}) {
    return axios.get(ordersUrl(), { params })
  },
  get(id: number) {
    return axios.get(`${ordersUrl()}/${id}`)
  },
  create(payload: any) {
    return axios.post(ordersUrl(), payload)
  },
  update(id: number, payload: any) {
    return axios.put(`${ordersUrl()}/${id}`, payload)
  },
  remove(id: number) {
    return axios.delete(`${ordersUrl()}/${id}`)
  },
  listItems(orderId: number) {
    return axios.get(`${ordersUrl()}/${orderId}/items`)
  },
  
  // Fetch order types from backend
  getOrderTypes() {
    return axios.get(`${apiBase}/orders/order-types`)
  },
  
  // Fetch order statuses from backend
  getOrderStatuses() {
    return axios.get(`${apiBase}/orders/order-statuses`)
  }
}

export default orderService
