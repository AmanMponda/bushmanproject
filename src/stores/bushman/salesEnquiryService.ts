// services/salesEnquiryService.ts

import axios from 'axios';
import type {
  SalesEnquiry,
  ApiResponse,
  CreateEnquiryInput,
  UpdateEnquiryInput,
  CreatePricingInput,
  UpdatePricingInput,
  PricingItemInput,
  Pricing,
  PricingItem,
  EnquiryFilters,
  EnquiryStatus,
} from '@/stores/bushman/salesEnquiry';

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries`;

export const salesEnquiryService = {
  /**
   * List all sales enquiries with optional filters
   */
  async list(filters?: EnquiryFilters): Promise<ApiResponse<SalesEnquiry[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await axios.get(`${API_BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single sales enquiry by ID
   */
  async get(id: number): Promise<ApiResponse<SalesEnquiry>> {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new sales enquiry
   */
  async create(data: CreateEnquiryInput): Promise<ApiResponse<SalesEnquiry>> {
    const response = await axios.post(API_BASE, data);
    return response.data;
  },

  /**
   * Update an existing sales enquiry
   */
  async update(id: number, data: UpdateEnquiryInput): Promise<ApiResponse<SalesEnquiry>> {
    const response = await axios.put(`${API_BASE}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a sales enquiry
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  /**
   * Update enquiry status only
   */
  async updateStatus(id: number, status: EnquiryStatus): Promise<ApiResponse<{ id: number; status: EnquiryStatus }>> {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  // ============ Pricing Methods ============

  /**
   * Add pricing to an enquiry
   */
  async addPricing(enquiryId: number, data: CreatePricingInput): Promise<ApiResponse<Pricing>> {
    const response = await axios.post(`${API_BASE}/${enquiryId}/pricing`, data);
    return response.data;
  },

  /**
   * Update pricing
   */
  async updatePricing(pricingId: number, data: UpdatePricingInput): Promise<ApiResponse<Pricing>> {
    const response = await axios.put(`${API_BASE}/pricing/${pricingId}`, data);
    return response.data;
  },

  /**
   * Delete pricing
   */
  async deletePricing(pricingId: number): Promise<ApiResponse<null>> {
    const response = await axios.delete(`${API_BASE}/pricing/${pricingId}`);
    return response.data;
  },

  /**
   * Lock pricing (change status to LOCKED)
   */
  async lockPricing(pricingId: number): Promise<ApiResponse<Pricing>> {
    const response = await axios.patch(`${API_BASE}/pricing/${pricingId}`, { status: 'LOCKED' });
    return response.data;
  },

  // ============ Pricing Item Methods ============

  /**
   * Add pricing item
   */
  async addPricingItem(pricingId: number, data: PricingItemInput): Promise<ApiResponse<PricingItem>> {
    const response = await axios.post(`${API_BASE}/pricing/${pricingId}/items`, data);
    return response.data;
  },

  /**
   * Update pricing item
   */
  async updatePricingItem(itemId: number, data: Partial<PricingItemInput>): Promise<ApiResponse<PricingItem>> {
    const response = await axios.put(`${API_BASE}/pricing-items/${itemId}`, data);
    return response.data;
  },

  /**
   * Delete pricing item
   */
  async deletePricingItem(itemId: number): Promise<ApiResponse<null>> {
    const response = await axios.delete(`${API_BASE}/pricing-items/${itemId}`);
    return response.data;
  },
};

export default salesEnquiryService;
