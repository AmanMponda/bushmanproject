import axios from 'axios'
import type {
  Entity,
  EntityListParams,
  CreateEntityRequest,
  UpdateEntityRequest,
  PaginatedResponse,
  Category,
  IdentityType,
  Country,
  Currency,
  ContactType
} from '@/types/entity'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

export const entityService = {
  // ============================================
  // Entity CRUD Operations
  // ============================================

  /**
   * List all entities with optional filters and pagination
   */
  async list(params?: EntityListParams): Promise<PaginatedResponse<Entity>> {
    const response = await axios.get(`${apiBaseUrl}entities`, {
      params: {
        ...params,
        per_page: params?.per_page || params?.limit || 15
      },
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Get a single entity by ID with all relationships
   */
  async get(id: number): Promise<{ data: Entity }> {
    const response = await axios.get(`${apiBaseUrl}entities/${id}`, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Create a new entity
   */
  async create(data: CreateEntityRequest): Promise<{ data: Entity }> {
    const response = await axios.post(`${apiBaseUrl}entities`, data, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Update an existing entity
   */
  async update(id: number, data: UpdateEntityRequest): Promise<{ data: Entity }> {
    const response = await axios.put(`${apiBaseUrl}entities/${id}`, data, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Delete an entity (soft delete)
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`${apiBaseUrl}entities/${id}`, {
      headers: getAuthHeaders()
    })
  },

  /**
   * Update entity status only
   */
  async updateStatus(id: number, status: string): Promise<{ data: Entity }> {
    const response = await axios.patch(
      `${apiBaseUrl}entities/${id}/status`,
      { status },
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  // ============================================
  // Contact Management
  // ============================================

  /**
   * Add a contact to an entity
   */
  async addContact(
    entityId: number,
    contact: { contact_type_id: number; contact: string; contactable?: boolean }
  ): Promise<{ data: any }> {
    const response = await axios.post(
      `${apiBaseUrl}entities/${entityId}/contacts`,
      contact,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Update a contact
   */
  async updateContact(
    entityId: number,
    contactId: number,
    contact: { contact_type_id?: number; contact?: string; contactable?: boolean }
  ): Promise<{ data: any }> {
    const response = await axios.put(
      `${apiBaseUrl}entities/${entityId}/contacts/${contactId}`,
      contact,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Remove a contact from an entity
   */
  async removeContact(entityId: number, contactId: number): Promise<void> {
    await axios.delete(`${apiBaseUrl}entities/${entityId}/contacts/${contactId}`, {
      headers: getAuthHeaders()
    })
  },

  // ============================================
  // Category Management
  // ============================================

  /**
   * Add a category to an entity
   */
  async addCategory(
    entityId: number,
    categoryData: {
      category_id: number
      default_payable_account_id?: number
      default_receivable_account_id?: number
      effective_from?: string
      effective_to?: string
      is_active?: boolean
      code?: string
    }
  ): Promise<{ data: any }> {
    const response = await axios.post(
      `${apiBaseUrl}entities/${entityId}/categories`,
      categoryData,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Remove a category from an entity
   */
  async removeCategory(entityId: number, categoryId: number): Promise<void> {
    await axios.delete(`${apiBaseUrl}entities/${entityId}/categories/${categoryId}`, {
      headers: getAuthHeaders()
    })
  },

  /**
   * List all contacts for an entity
   */
  async listContacts(entityId: number): Promise<{ data: any[] }> {
    const response = await axios.get(
      `${apiBaseUrl}entities/${entityId}/contacts`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  // ============================================
  // Identity Management
  // ============================================

  /**
   * List all identities for an entity
   */
  async listIdentities(entityId: number): Promise<{ data: any[] }> {
    const response = await axios.get(
      `${apiBaseUrl}entities/${entityId}/identities`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Add an identity to an entity
   */
  async addIdentity(
    entityId: number,
    identity: {
      identity_type_id: number
      identity_number: string
      issued_date?: string
      is_active?: boolean
      dates?: {
        issuing_country_id?: number
        issuing_authority?: string
        expire_date?: string
      }
    }
  ): Promise<{ data: any }> {
    const userData = localStorage.getItem('user')
    const currentUserId = userData ? JSON.parse(userData)?.id : null
    const response = await axios.post(
      `${apiBaseUrl}entities/${entityId}/identities`,
      { ...identity, user_id: currentUserId },
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Update an identity
   */
  async updateIdentity(
    entityId: number,
    identityId: number,
    identity: {
      identity_type_id?: number
      identity_number?: string
      issued_date?: string
      is_active?: boolean
      dates?: {
        issuing_country_id?: number
        issuing_authority?: string
        expire_date?: string
      }
    }
  ): Promise<{ data: any }> {
    const response = await axios.put(
      `${apiBaseUrl}entities/${entityId}/identities/${identityId}`,
      identity,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Remove an identity from an entity
   */
  async removeIdentity(entityId: number, identityId: number): Promise<void> {
    await axios.delete(`${apiBaseUrl}entities/${entityId}/identities/${identityId}`, {
      headers: getAuthHeaders()
    })
  },

  // ============================================
  // Metadata Endpoints
  // ============================================

  /**
   * Get all categories
   */
  async getCategories(): Promise<{ data: Category[] }> {
    const response = await axios.get(`${apiBaseUrl}categories`, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Get all identity types
   */
  async getIdentityTypes(): Promise<{ data: IdentityType[] }> {
    const response = await axios.get(`${apiBaseUrl}identity-types`, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Get all contact types
   */
  async getContactTypes(): Promise<{ data: ContactType[] }> {
    const response = await axios.get(`${apiBaseUrl}contact-types`, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Get all countries
   */
  async getCountries(): Promise<{ data: Country[] }> {
    const response = await axios.get(`${apiBaseUrl}settings/countries`, {
      headers: getAuthHeaders()
    })
    return response.data
  },

  /**
   * Get all currencies
   */
  async getCurrencies(): Promise<any> {
    const response = await axios.get(`${apiBaseUrl}settings/currencies`, {
      headers: getAuthHeaders()
    })
    // Return the raw response payload; callers can read `data` or use the array directly
    return response.data
  },

  /**
   * Get all nationalities
   */
  async getNationalities(): Promise<{ data: any[] }> {
    const response = await axios.get(`${apiBaseUrl}settings/nationalities`, {
      headers: getAuthHeaders()
    })
    return response.data
  }
}

export default entityService
