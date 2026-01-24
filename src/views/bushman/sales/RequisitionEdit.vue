<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import axios from 'axios'
import { requisitionService } from '@/stores/bushman/requisitionService'
import RequisitionForm from '@/views/bushman/sales/RequisitionForm.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppOptionStore } from '@/stores/app-option'
import { useAuthStore } from '@/stores/auth'
import Swal from 'sweetalert2'

// Copied Types
type FundDirection = 'WITHDRAW' | 'EXPENSE'
type TaxMethod = 'EXCLUSIVE' | 'INCLUSIVE' | 'EXEMPT'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appOptionStore = useAppOptionStore()
const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

// Loading States
const loading = ref(false)
const savingForm = ref(false)
const errorMessage = ref('')

// Default Sidebar State
const originalSidebarState = ref(false)

// Form State
const activeFormTab = ref('sources')
let form = reactive({
  id: 0,
  requisitionTypeId: null as number | null,
  fundDirection: null as FundDirection | null,
  currencyId: null as number | null,
  branchId: null as number | null,
  date: new Date().toISOString().slice(0, 10),
  requiredDate: '',
  remarks: '',
  taxMethod: null as TaxMethod | null,
  source: {
    _key: 'src_init',
    sourceType: null as string | null,
    sourceId: null as number | null,
    accountId: null as number | null,
    payee: '',
    modeOfPayment: null as string | null,
    paymentMethod: null as string | null,
    amount: null as number | null,
    receivingAccountId: null as number | null,
    custodianId: null as number | null,
    currencyId: null as number | null,
    exchangeRate: 1,
    description: '',
  },
  items: [] as any[],
  costCenters: [] as any[],
  attachments: [] as any[],
})

// Metadata Refs
const requisitionTypes = ref<any[]>([])
const branches = ref<any[]>([])
const currencies = ref<any[]>([])
const itemsOptions = ref<any[]>([])
const unitsOptions = ref<any[]>([])
const accounts = ref<any[]>([])
const users = ref<any[]>([])
const locations = ref<any[]>([])
const entities = ref<any[]>([])
const dimensionTypes = ref<any[]>([])
const dimensionValues = ref<any[]>([])
const vatOptions = ref<any[]>([]) // Add if needed

const getAuthHeaders = () => ({
  Authorization: `Bearer ${authStore.token}`,
})

const generateKey = () => `key_${Math.random().toString(36).substr(2, 9)}`

// Helper Functions
const formatAmount = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const grandTotal = computed(() => {
  if (form.items && form.items.length) {
      const matTotal = form.items.reduce((sum: number, item: any) => {
        const itemMat = (item.materials || []).reduce((s: number, m: any) => s + (Number(m.quantity || 0) * Number(m.rate || 0)), 0)
        return sum + itemMat
      }, 0)
      const accTotal = form.items.reduce((sum: number, item: any) => {
        const itemAcc = (item.accounts || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0)
        return sum + itemAcc
      }, 0)
      return matTotal + accTotal
  }
  return 0
})

const getCurrencySymbol = () => {
  const c = currencies.value.find((c) => c.id === form.currencyId)
  return c ? c.symbol : ''
}

const requisitionItemAllowedSubtypes = new Set([
  'SPARE_PART', 'LUBRICANT', 'TOOL', 'JOB_SERVICE', 
  'ACCOMMODATION', 'TRANSPORT', 'FEE', 'OTHER'
])

// Cost Centers for the form
const costCentersOptions = ref<any[]>([])

// Process metadata from the edit endpoint response
const processMetadata = (metadata: any) => {
  // Map requisition types
  const types = metadata.requisition_types || []
  requisitionTypes.value = (Array.isArray(types) ? types : []).map((type: any) => ({
    id: type.id,
    name: type.name || type.type || `Type ${type.id}`,
    code: type.code,
    type: type.type,
  }))

  // Map items - the edit endpoint returns all items, apply filtering if needed
  const items = metadata.items || []
  const rawItems = Array.isArray(items) ? items : []
  const hasFilterFields = rawItems.some(
    (item: any) => item && (item.subtype !== undefined || item.is_active !== undefined || item.is_purchasable !== undefined),
  )
  const filteredItems = hasFilterFields
    ? rawItems.filter((item: any) => {
        if (!item) return false
        const subtype = String(item.subtype || '').trim()
        const isActive = item.is_active === undefined ? true : Boolean(Number(item.is_active))
        const isPurchasable = item.is_purchasable === undefined ? false : Boolean(Number(item.is_purchasable))
        return isActive && isPurchasable && requisitionItemAllowedSubtypes.has(subtype)
      })
    : rawItems

  itemsOptions.value = filteredItems.map((item: any) => ({
    id: item.id,
    name: item.name || `Item ${item.id}`,
    code: item.code,
  }))

    // Map units of measurement
    const units = metadata.unit_of_measurements || []
    unitsOptions.value = (Array.isArray(units) ? units : []).map((unit: any) => ({
      id: unit.id,
      name: unit.name || unit.code || `Unit ${unit.id}`,
      code: unit.code,
    }))

    // Map currencies
    const curs = metadata.currencies || []
    currencies.value = (Array.isArray(curs) ? curs : []).map((currency: any) => ({
      id: currency.id,
      name: currency.name || currency.code || `Currency ${currency.id}`,
      code: currency.code,
      symbol: currency.symbol,
    }))
    
    // Map accounts
    const accts = metadata.accounts || []
    accounts.value = (Array.isArray(accts) ? accts : []).map((account: any) => ({
      id: account.id,
      name: account.name || account.account_name || `Account ${account.id}`,
      code: account.code || account.account_number,
      account_number: account.account_number,
    }))
    
    // Map branches (may not be in edit endpoint, but keep for compatibility)
    const brnchs = metadata.branches || []
    branches.value = (Array.isArray(brnchs) ? brnchs : []).map((branch: any) => ({
      id: branch.id,
      name: branch.name || `Branch ${branch.id}`,
    }))
    
    // Map users
    const usrs = metadata.users || []
    users.value = (Array.isArray(usrs) ? usrs : []).map((user: any) => ({
      id: user.id,
      name: user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`.trim() 
        : (user.name || user.full_name || user.username || user.email || `User ${user.id}`),
      email: user.email,
      username: user.username,
    }))

    // Map locations
    const locs = metadata.locations || []
    locations.value = (Array.isArray(locs) ? locs : []).map((location: any) => ({
      id: location.id,
      name: location.name || location.code || `Location ${location.id}`,
      code: location.code,
      type: location.type,
    }))

    // Map entities (parties/vendors)
    const ents = metadata.entities || []
    entities.value = (Array.isArray(ents) ? ents : []).map((entity: any) => ({
      id: entity.id,
      name: entity.full_name || entity.name || entity.nick_name || `Entity ${entity.id}`,
      country_name: entity.country_name,
      nationality_name: entity.nationality_name,
    }))
    
    // Map dimension types
    const dimTypes = metadata.dimension_types || []
    dimensionTypes.value = (Array.isArray(dimTypes) ? dimTypes : []).map((dt: any) => ({
      id: dt.id,
      code: dt.code || '',
      name: dt.name || `Dimension ${dt.id}`,
      is_mandatory: dt.is_mandatory,
      applies_to: dt.applies_to,
    }))
    
    // Map dimension values - handle the object format { "1": [...], "2": [...] }
    const dimValuesRaw = metadata.dimension_values || {}
    const flatDimValues: any[] = []
    
    if (typeof dimValuesRaw === 'object' && !Array.isArray(dimValuesRaw)) {
      // It's an object keyed by dimension_type_id
      Object.entries(dimValuesRaw).forEach(([typeId, values]) => {
        if (Array.isArray(values)) {
          values.forEach((dv: any) => {
            flatDimValues.push({
              id: dv.id,
              dimension_type_id: dv.dimension_type_id || Number(typeId),
              code: dv.code || '',
              name: dv.name || `Value ${dv.id}`,
            })
          })
        }
      })
    } else if (Array.isArray(dimValuesRaw)) {
      // It's already an array
      dimValuesRaw.forEach((dv: any) => {
        flatDimValues.push({
          id: dv.id,
          dimension_type_id: dv.dimension_type_id,
          code: dv.code || '',
          name: dv.name || `Value ${dv.id}`,
        })
      })
    }
    dimensionValues.value = flatDimValues
    
    // Extract cost centers from dimension values (dimension_type with code 'COST_CENTER')
    const costCenterType = dimensionTypes.value.find((dt: any) => dt.code === 'COST_CENTER')
    if (costCenterType) {
      costCentersOptions.value = dimensionValues.value
        .filter((dv: any) => dv.dimension_type_id === costCenterType.id)
        .map((dv: any) => ({
          id: dv.id,
          name: dv.name,
          code: dv.code,
        }))
    } else {
      // Fallback: use cost_centers from metadata if available
      const ccs = metadata.cost_centers || []
      costCentersOptions.value = (Array.isArray(ccs) ? ccs : []).map((cc: any) => ({
        id: cc.id,
        name: cc.name || cc.code || `Cost Center ${cc.id}`,
        code: cc.code,
      }))
    }
    
    // Map VAT options (may not be in edit endpoint)
    const vats = metadata.value_added_taxes || metadata.vat || []
    vatOptions.value = (Array.isArray(vats) ? vats : []).map((vat: any) => ({
      id: vat.id,
      name: vat.name || `${vat.rate || 0}%`,
      code: vat.code,
      rate: vat.rate,
    }))
    
    // Store enums if available
    if (metadata.enums) {
      // Can be used for source_types, payment_modes, etc.
      console.log('Available enums:', metadata.enums)
    }
}

// Logic to populate form from raw requisition (Replaces mapRequisition/openEditForm logic)
const initializeForm = (rawReq: any) => {
  form.id = rawReq.id
  form.requisitionTypeId = Number(rawReq.requisition_type?.id || rawReq.requisition_type_id || rawReq.requisitionTypeId) || null
  form.branchId = Number(rawReq.branch_id || rawReq.branchId) || null
  form.fundDirection = rawReq.fund_direction || rawReq.fundDirection || 'WITHDRAW'
  
  // Extract currency - try multiple sources
  let currencyId = Number(rawReq.currency_id || rawReq.currencyId) || null
  if (!currencyId && rawReq.items && rawReq.items.length > 0) {
    // Try to get currency from first item's materials
    const firstItem = rawReq.items[0]
    currencyId = firstItem.currency_id || firstItem.currencyId || null
    if (!currencyId && firstItem.materials && firstItem.materials.length > 0) {
      const firstMat = firstItem.materials[0]
      currencyId = firstMat.currency_id || firstMat.currencyId || firstMat.item?.currency_id || null
    }
  }
  form.currencyId = currencyId || currencies.value[0]?.id || null
  
  form.date = (rawReq.date || new Date().toISOString()).slice(0, 10)
  form.requiredDate = (rawReq.required_date || rawReq.requiredDate || '').slice(0, 10)
  form.remarks = rawReq.remarks || ''
  form.taxMethod = rawReq.tax_method || rawReq.taxMethod || 'EXCLUSIVE'

  // Source - extract from sources array
  const existingSource = (rawReq.sources && rawReq.sources.length > 0) ? rawReq.sources[0] : (rawReq.source || null)
  if (existingSource) {
    // Get currency from source if available
    const sourceCurrencyId = existingSource.currency_id || existingSource.currencyId || existingSource.currency?.id || null
    if (sourceCurrencyId && !form.currencyId) {
      form.currencyId = sourceCurrencyId
    }
    
    form.source = {
      _key: generateKey(),
      sourceType: existingSource.source_type || existingSource.sourceType || null,
      sourceId: existingSource.source_id || existingSource.sourceId || null,
      accountId: existingSource.account_id || existingSource.accountId || null,
      payee: existingSource.payee || existingSource.entity?.full_name || '',
      modeOfPayment: existingSource.mode_of_payment || existingSource.modeOfPayment || null,
      paymentMethod: existingSource.payment_method || existingSource.paymentMethod || null,
      amount: Number(existingSource.amount || 0) || null,
      receivingAccountId: existingSource.receiving_account_id || existingSource.receivingAccountId || null,
      custodianId: existingSource.custodian_id || existingSource.custodianId || null,
      currencyId: sourceCurrencyId || form.currencyId,
      exchangeRate: Number(existingSource.exchange_rate || existingSource.exchangeRate || 1),
      description: existingSource.description || '',
    }
  }

  // Items / Cost Centers
  // The API returns items with accounts array and/or materials array
  // Each item can have accounts (with amount) or materials (with quantity/rate)
  // We need to map these to the form structure where cost center items can have
  // either itemId (material) or accountId (account line) - they're at the same level
  
  const rawItems = rawReq.items || []
  
  // Check if we should use cost center mode
  // The form uses cost centers if there are any cost center dimension values
  // For now, we'll create cost center items from accounts if accounts exist
  
  // Always use cost centers mode since the form prefers this structure
  // Map each item's accounts as separate cost center line items
  
  const defaultCostCenterId = costCentersOptions.value.length > 0 ? costCentersOptions.value[0].id : null
  
  // Find the "Each" unit (code "EA")
  const eachUnit = unitsOptions.value.find((u: any) => u.code === 'EA')
  const eachUnitId = eachUnit?.id || null
  
  if (rawItems.length > 0) {
    // Check if items have accounts or materials
    const hasAccounts = rawItems.some((item: any) => item.accounts && item.accounts.length > 0)
    const hasMaterials = rawItems.some((item: any) => item.materials && item.materials.length > 0)
    
    if (hasAccounts || hasMaterials) {
      // Create cost center entries from items
      // Group by a default cost center (or the first available one)
      const costCenterMap = new Map()
      
      for (const line of rawItems) {
        // Try to get cost center from dimensions if available
        let costCenterId = null
        if (line.dimensions && line.dimensions.length > 0) {
          const ccDim = line.dimensions.find((d: any) => {
            const dimType = dimensionTypes.value.find((dt: any) => dt.id === d.dimension_type_id)
            return dimType?.code === 'COST_CENTER'
          })
          if (ccDim) {
            costCenterId = ccDim.dimension_value_id
          }
        }
        
        // Fallback to first cost center option
        if (!costCenterId) {
          costCenterId = defaultCostCenterId || 'default'
        }
        
        if (!costCenterMap.has(costCenterId)) {
          costCenterMap.set(costCenterId, {
            _key: generateKey(),
            costCenterId: costCenterId === 'default' ? null : costCenterId,
            items: [],
            _expanded: true,
          })
        }
        
        // Add materials as items
        if (line.materials && line.materials.length > 0) {
          for (const mat of line.materials) {
            costCenterMap.get(costCenterId).items.push({
              _key: generateKey(),
              itemId: mat.item_id || mat.itemId || mat.item?.id || null,
              accountId: null,
              unitId: mat.unit_of_measurement_id || mat.unitId || mat.unit_of_measurement?.id || null,
              quantity: Number(mat.quantity || 1),
              rate: Number(mat.rate || 0),
              remarks: mat.description || mat.remarks || '',
            })
          }
        }
        
        // Add accounts as items (accountId with amount as rate, quantity=1, unit=Each)
        if (line.accounts && line.accounts.length > 0) {
          for (const acc of line.accounts) {
            costCenterMap.get(costCenterId).items.push({
              _key: generateKey(),
              itemId: null,
              accountId: acc.account_id || acc.accountId || acc.account?.id || null,
              unitId: eachUnitId,
              quantity: 1,
              rate: Number(acc.amount || 0), // amount becomes rate with qty=1
              remarks: acc.description || '',
            })
          }
        }
        
        // If no materials and no accounts, add an empty line
        if ((!line.materials || line.materials.length === 0) && (!line.accounts || line.accounts.length === 0)) {
          costCenterMap.get(costCenterId).items.push({
            _key: generateKey(),
            itemId: null,
            accountId: null,
            unitId: eachUnitId,
            quantity: 1,
            rate: 0,
            remarks: line.remarks || '',
          })
        }
      }
      
      form.costCenters = Array.from(costCenterMap.values())
      form.items = []
    } else {
      // No accounts or materials - create empty cost center
      form.costCenters = [{
        _key: generateKey(),
        costCenterId: defaultCostCenterId,
        items: [{
          _key: generateKey(),
          itemId: null,
          accountId: null,
          unitId: eachUnitId,
          quantity: 1,
          rate: 0,
          remarks: '',
        }],
        _expanded: true,
      }]
      form.items = []
    }
  } else {
    // No items - create empty structure
    form.costCenters = []
    form.items = []
  }
}

// Load data from the single edit endpoint
const loadEditData = async (id: number) => {
  const response = await axios.get(`${apiBase}/requisitions/${id}/edit`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  })
  
  const responseData = response.data?.data || response.data || {}
  const requisition = responseData.requisition || responseData
  const metadata = responseData.metadata || {}
  
  return { requisition, metadata }
}

// Lifecycle
onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    router.replace('/sales/requisitions')
    return
  }

  loading.value = true
  
  // Collapse sidebar for space
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true

  try {
     // Single API call to get both requisition data AND metadata
     const { requisition, metadata } = await loadEditData(id)
     
     // Process metadata first so currencies/types/etc. are available
     processMetadata(metadata)
     
     // Debug log to identify any missing data
     console.log('Edit page - Metadata loaded:', {
       requisitionTypes: requisitionTypes.value.length,
       currencies: currencies.value.length,
       accounts: accounts.value.length,
       dimensionTypes: dimensionTypes.value.length,
       dimensionValues: dimensionValues.value.length,
       costCentersOptions: costCentersOptions.value.length,
       items: itemsOptions.value.length,
       users: users.value.length,
       entities: entities.value.length,
       locations: locations.value.length,
     })
     console.log('Edit page - Requisition data:', requisition)
     
     // Initialize form with requisition data
     initializeForm(requisition)
     
     // Debug: verify form state after initialization
     console.log('Edit page - Form after init:', {
       id: form.id,
       requisitionTypeId: form.requisitionTypeId,
       currencyId: form.currencyId,
       fundDirection: form.fundDirection,
       costCenters: form.costCenters,
       costCentersCount: form.costCenters.length,
       items: form.items.length,
       source: form.source,
     })
     
     // Debug cost center items in detail
     if (form.costCenters.length > 0) {
       console.log('Edit page - Cost Center Details:', form.costCenters.map((cc: any) => ({
         costCenterId: cc.costCenterId,
         itemsCount: cc.items?.length || 0,
         items: cc.items?.map((item: any) => ({
           itemId: item.itemId,
           accountId: item.accountId,
           quantity: item.quantity,
           rate: item.rate,
         }))
       })))
     }
  } catch (err: any) {
    console.error('Edit page load error:', err)
    errorMessage.value = err.message || 'Failed to load requisition'
    Swal.fire('Error', errorMessage.value, 'error')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})

const cancelForm = () => {
    router.push(`/sales/requisitions/${form.id}`)
}

const saveForm = async () => {
  savingForm.value = true
  errorMessage.value = ''
  try {
     if (!form.currencyId) {
       await Swal.fire({
         icon: 'warning',
         title: 'Validation Error',
         text: 'Currency is required before submitting.',
         confirmButtonColor: '#2563eb'
       })
       return
     }
     // Re-use logic from Requisitions.vue or RequisitionForm usage
     // We need to payload construction here or assume RequisitionForm emits ready payload?
     // Actually RequisitionForm in Requisitions.vue emits 'save' and Requisitions.vue constructs the payload.
     // I need to duplicate the payload construction logic from Requisitions.vue
     // For brevity, I'll implement a simplified version or I should borrow the exact buildPayload logic.
     
     // IMPORTANT: The user wants "edit", so we call update
     const payload = buildPayload()
     await requisitionService.update(form.id, payload)
     
     Swal.fire('Success', 'Requisition updated successfully.', 'success')
     router.push(`/sales/requisitions/${form.id}`)
  } catch (err: any) {
    console.error(err)
    errorMessage.value = err.response?.data?.message || err.message || 'Failed to update.'
  } finally {
    savingForm.value = false
  }
}

const addItem = () => {
  form.items.push({
    _key: generateKey(),
    currencyId: form.currencyId,
    vatId: null,
    discountAmount: 0,
    discountMethod: null,
    taxMethod: form.taxMethod,
    remarks: '',
    materials: [{ _key: generateKey(), itemId: null, unitId: null, quantity: 1, rate: 0, currencyId: form.currencyId, description: '' }],
    accounts: [],
    dimensions: [],
    _materialsExpanded: true,
    _accountsExpanded: false,
  })
}

const removeItem = (itemKey: string) => {
  form.items = form.items.filter((i: any) => i._key !== itemKey)
}

const addMaterialLine = (itemKey: string) => {
  const item = form.items.find((i: any) => i._key === itemKey)
  if (!item) return
  if (!item.materials) item.materials = []
  item.materials.push({ _key: generateKey(), itemId: null, unitId: null, quantity: 1, rate: 0, currencyId: form.currencyId, description: '' })
}

const removeMaterialLine = (itemKey: string, materialKey: string) => {
  const item = form.items.find((i: any) => i._key === itemKey)
  if (!item || !item.materials) return
  item.materials = item.materials.filter((m: any) => m._key !== materialKey)
}

const addAccountLine = (itemKey: string) => {
  const item = form.items.find((i: any) => i._key === itemKey)
  if (!item) return
  if (!item.accounts) item.accounts = []
  item.accounts.push({ _key: generateKey(), accountId: null, amount: 0, currencyId: form.currencyId, description: '' })
}

const removeAccountLine = (itemKey: string, accountKey: string) => {
  const item = form.items.find((i: any) => i._key === itemKey)
  if (!item || !item.accounts) return
  item.accounts = item.accounts.filter((a: any) => a._key !== accountKey)
}

const addDimensionLine = (itemKey: string) => {
  const item = form.items.find((i: any) => i._key === itemKey)
  if (!item) return
  if (!item.dimensions) item.dimensions = []
  item.dimensions.push({ _key: generateKey(), dimensionTypeId: null, dimensionValueId: null, amount: null, percentage: null })
}

const removeDimensionLine = (itemKey: string, dimensionKey: string) => {
  const item = form.items.find((i: any) => i._key === itemKey)
  if (!item || !item.dimensions) return
  item.dimensions = item.dimensions.filter((d: any) => d._key !== dimensionKey)
}

// Minimal payload builder - crucial part
const buildPayload = () => {
    // Basic structure matching Requisitions.vue
    const payload: any = {
        requisition_type_id: form.requisitionTypeId,
        fund_direction: form.fundDirection,
        branch_id: form.branchId,
        currency_id: form.currencyId,
        date: form.date,
        required_date: form.requiredDate,
        remarks: form.remarks,
        tax_method: form.taxMethod,
        sources: [],
        items: []
    }
    
    if (form.source && (form.source.sourceType || form.source.payee)) {
        payload.sources.push({
            source_type: form.source.sourceType,
            source_id: form.source.sourceId,
            account_id: form.source.accountId,
            payee: form.source.payee,
            mode_of_payment: form.source.modeOfPayment,
            payment_method: form.source.paymentMethod,
            amount: form.source.amount,
            receiving_account_id: form.source.receivingAccountId,
            custodian_id: form.source.custodianId,
            currency_id: form.source.currencyId || form.currencyId,
            exchange_rate: form.source.exchangeRate,
            description: form.source.description
        })
    }
    
    // Direct Items
    if (form.items && form.items.length) {
        payload.items = form.items.map((item: any) => ({
             remarks: item.remarks,
             materials: item.materials.map((m: any) => ({
                 item_id: m.itemId,
                 unit_of_measurement_id: m.unitId,
                 quantity: m.quantity,
                 rate: m.rate,
                 currency_id: m.currencyId || form.currencyId,
                 description: m.description
             })),
             accounts: item.accounts.map((a: any) => ({
                 account_id: a.accountId,
                 amount: a.amount,
                 currency_id: a.currencyId || form.currencyId,
                 description: a.description
             })),
             dimensions: (item.dimensions || []).map((d: any) => ({
                 dimension_type_id: d.dimensionTypeId,
                 dimension_value_id: d.dimensionValueId,
                 amount: d.amount,
                 percentage: d.percentage,
             }))
        }))
    }
    
    // Cost Center Items
    if (form.costCenters && form.costCenters.length) {
        for (const cc of form.costCenters) {
             for (const item of cc.items) {
                 const lineTotal = Number(item.quantity || 0) * Number(item.rate || 0)
                 const payloadItem: any = {
                     cost_center_id: cc.costCenterId,
                     materials: [],
                     accounts: [],
                     dimensions: []
                 }

                 if (item.itemId) {
                     payloadItem.materials.push({
                         item_id: item.itemId,
                         unit_of_measurement_id: item.unitId,
                         quantity: item.quantity,
                         rate: item.rate,
                         currency_id: form.currencyId,
                         description: item.remarks
                     })
                 }

                 if (item.accountId) {
                     payloadItem.accounts.push({
                         account_id: item.accountId,
                         amount: lineTotal,
                         currency_id: form.currencyId,
                         description: item.remarks
                     })
                 }

                 payload.items.push(payloadItem)
             }
        }
    }
    
    return payload
}

// Helpers for event handlers that modify form
const resetForm = () => {} // Logic needed if passed to form? form.value reset?
</script>

<template>
  <div class="requisition-edit-page">
     <div v-if="loading" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
        <div class="spinner-border text-primary" role="status"></div>
     </div>
     
     <RequisitionForm
      v-else
      v-model:form="form"
      v-model:activeFormTab="activeFormTab"
      :is-edit-mode="true"
      :saving-form="savingForm"
      :error-message="errorMessage"
      :requisition-types="requisitionTypes"
      :branches="branches"
      :currencies="currencies"
      :items-options="itemsOptions"
      :units-options="unitsOptions"
      :cost-centers-options="costCentersOptions"
      :accounts="accounts"
      :users="users"
      :locations="locations"
      :entities="entities"
      :dimension-types="dimensionTypes"
      :dimension-values="dimensionValues"
      :vat-options="vatOptions"
      :grand-total="grandTotal"
      :get-currency-symbol="getCurrencySymbol"
      :format-amount="formatAmount"
      @cancel="cancelForm"
      @reset="resetForm"
      @save="saveForm"
      @clear-error="errorMessage = ''"
      @add-item="addItem"
      @remove-item="removeItem"
      @add-material="addMaterialLine"
      @remove-material="removeMaterialLine"
      @add-account="addAccountLine"
      @remove-account="removeAccountLine"
      @add-dimension="addDimensionLine"
      @remove-dimension="removeDimensionLine"
    />
  </div>
</template>

<style scoped>
.requisition-edit-page {
    background: var(--bg);
    min-height: 100vh;
}
</style>
