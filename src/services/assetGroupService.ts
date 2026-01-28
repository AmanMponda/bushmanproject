import axios from 'axios'

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

const assetUrl = () => `${apiBase}`

export interface AssetGroupAccount {
  id?: number
  asset_group_id?: number
  fixed_asset_account_id?: number | null
  accumulated_depreciation_account_id?: number | null
  depreciation_expense_account_id?: number | null
  cwip_account_id?: number | null
  disposal_gain_loss_account_id?: number | null
}

export interface AssetGroup {
  id?: number
  company_id?: number
  parent_id?: number | null
  code: string
  name: string
  asset_class: 'VEHICLE' | 'EQUIPMENT' | 'BUILDING' | 'IT' | 'FURNITURE' | 'TIRE' | 'OTHER'
  default_useful_life_months?: number | null
  default_depr_rate_percent?: number | null
  description?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  parent?: AssetGroup | null
  children?: AssetGroup[]
  accounts?: AssetGroupAccount
  assets?: any[]
}

export interface AssetGroupMetadata {
  asset_classes: string[]
  accounts?: Array<{ id: number; company_id?: number; code?: string; name: string }>
  parent_groups?: AssetGroup[]
}

export const assetGroupService = {
  // ==================== ASSET GROUPS ====================

  /**
   * Get metadata (available asset classes)
   */
  getMetadata() {
    return axios.get<{ success: boolean; data: AssetGroupMetadata }>(`${assetUrl()}/asset-groups/metadata`)
  },

  /**
   * List all asset groups with optional filters
   * @param params - Query parameters (asset_class, is_active, parent_id, search, as_tree)
   */
  listAssetGroups(params: {
    asset_class?: string
    is_active?: boolean
    parent_id?: number | null | 'null'
    search?: string
    as_tree?: boolean
  } = {}) {
    return axios.get<{ success: boolean; data: AssetGroup[] }>(`${assetUrl()}/asset-groups`, { params })
  },

  /**
   * Get a single asset group by ID
   */
  getAssetGroup(id: number) {
    return axios.get<{ success: boolean; data: AssetGroup }>(`${assetUrl()}/asset-groups/${id}`)
  },

  /**
   * Create a new asset group
   */
  createAssetGroup(payload: Partial<AssetGroup>) {
    return axios.post<{ success: boolean; message: string; data: AssetGroup }>(
      `${assetUrl()}/asset-groups`,
      payload
    )
  },

  /**
   * Update an asset group
   */
  updateAssetGroup(id: number, payload: Partial<AssetGroup>) {
    return axios.put<{ success: boolean; message: string; data: AssetGroup }>(
      `${assetUrl()}/asset-groups/${id}`,
      payload
    )
  },

  /**
   * Delete an asset group
   */
  deleteAssetGroup(id: number) {
    return axios.delete<{ success: boolean; message: string }>(`${assetUrl()}/asset-groups/${id}`)
  },

  /**
   * Get asset groups by asset class
   */
  getAssetGroupsByClass(assetClass: string, asTree: boolean = false) {
    return this.listAssetGroups({ asset_class: assetClass, as_tree: asTree })
  },

  /**
   * Get root asset groups (no parent)
   */
  getRootAssetGroups() {
    return this.listAssetGroups({ parent_id: 'null' as any })
  },

  /**
   * Get asset groups as hierarchical tree
   */
  getAssetGroupTree(assetClass?: string) {
    const params: any = { as_tree: true }
    if (assetClass) {
      params.asset_class = assetClass
    }
    return this.listAssetGroups(params)
  },

  /**
   * Get active asset groups only
   */
  getActiveAssetGroups(assetClass?: string) {
    const params: any = { is_active: true }
    if (assetClass) {
      params.asset_class = assetClass
    }
    return this.listAssetGroups(params)
  },

  /**
   * Search asset groups by name or code
   */
  searchAssetGroups(searchTerm: string) {
    return this.listAssetGroups({ search: searchTerm })
  },

  /**
   * Get child groups of a parent
   */
  getChildGroups(parentId: number) {
    return this.listAssetGroups({ parent_id: parentId })
  },
}

export default assetGroupService
