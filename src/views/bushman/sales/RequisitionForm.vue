<script setup lang="ts">
import { toRefs, computed, ref, nextTick, onMounted, watch } from 'vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import Datepicker from '@/components/plugins/Datepicker.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { useAuthStore } from '@/stores/auth'


type Props = {
  isEditMode: boolean
  savingForm: boolean
  errorMessage: string
  requisitionTypes: any[]
  branches: any[]
  currencies: any[]
  itemsOptions: any[]
  unitsOptions: any[]
  accounts: any[]
  sourceAccounts: any[]
  replenishAccounts: any[]
  users: any[] 
  locations: any[] 
  entities: any[] 
  dimensionTypes: any[] 
  dimensionValues: any[]
  vatOptions: any[]
  grandTotal: number
  getCurrencySymbol: () => string
  formatAmount: (value: number) => string
}

const props = defineProps<Props>()
const {
  isEditMode,
  savingForm,
  errorMessage,
  requisitionTypes,
  branches,
  currencies,
  itemsOptions,
  unitsOptions,
  accounts,
  sourceAccounts,
  replenishAccounts,
  users,
  locations,
  entities,
  dimensionTypes,
  dimensionValues,
  vatOptions,
  grandTotal,
} = toRefs(props)

const getCurrencySymbol = props.getCurrencySymbol
const formatAmount = props.formatAmount

const form = defineModel<any>('form', { required: true })
const activeFormTab = defineModel<string>('activeFormTab', { required: true, default: 'sources' })

// Refs for multiselect dropdowns to manually close them - defined early for use in computed
const sourceAccountSelect = ref<any>(null)

// Vue-multiselect needs the full option object, not just the value string
const sourceSelection = computed<any>({
  get() {
    const source = form.value?.source
    if (!source?.sourceType) return null
    
    let valueString: string | null = null
    if (source.sourceType === 'CASH' && source.accountId) {
      valueString = `CASH:${source.accountId}`
    } else if ((source.sourceType === 'STORE' || source.sourceType === 'PARTIES') && source.sourceId) {
      valueString = `${source.sourceType}:${source.sourceId}`
    }
    
    if (!valueString) return null
    
    // Find and return the full option object from sourceOptions
    return sourceOptions.value.find((opt: any) => opt.value === valueString) || null
  },
  set(selected: any) {
    const source = form.value?.source
    if (!source) return
    
    // selected is now the full option object from vue-multiselect
    const value = selected?.value || null
    
    if (!value) {
      source.sourceType = null
      source.sourceId = null
      source.accountId = null
      source.payee = ''
      return
    }
    const [type, idValue] = value.split(':')
    const parsedId = Number(idValue || 0) || null
    source.sourceType = type as any

    // Auto-populate payee based on source selection
    if (type === 'CASH') {
      source.accountId = parsedId
      source.sourceId = null
      const account = (flatSourceAccounts.value || []).find((a: any) => a.id === parsedId)
      if (account && !source.payee) {
        source.payee = account.name
      }
    } else if (type === 'STORE') {
      source.accountId = null
      source.sourceId = parsedId
      const location = (locations.value || []).find((l: any) => l.id === parsedId)
      if (location && !source.payee) {
        source.payee = location.name
      }
    } else if (type === 'PARTIES') {
      source.accountId = null
      source.sourceId = parsedId
      const entity = (entities.value || []).find((e: any) => e.id === parsedId)
      if (entity && !source.payee) {
        source.payee = entity.name
      }
    }
  },
})

const authStore = useAuthStore()
const username = computed(() => authStore.user?.username || '')
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'reset'): void
  (e: 'save', asDraft: boolean): void
  (e: 'clear-error'): void
  (e: 'add-item'): void
  (e: 'remove-item', itemKey: string): void
  (e: 'add-material', itemKey: string): void
  (e: 'remove-material', itemKey: string, materialKey: string): void
  (e: 'add-account', itemKey: string): void
  (e: 'remove-account', itemKey: string, accountKey: string): void
  (e: 'add-dimension', itemKey: string): void
  (e: 'remove-dimension', itemKey: string, dimensionKey: string): void
}>()

onMounted(() => {
  if (!form.value?.requiredDate) {
    form.value.requiredDate = new Date().toISOString().slice(0, 10)
  }
})

// Clear direct payment fields when switching to Withdraw to avoid showing stale amounts
watch(() => form.value?.fundDirection, (val) => {
  if (val === 'WITHDRAW') {
    if (!form.value) return
    if (!form.value.source) form.value.source = {}
    form.value.source.amount = 0
    form.value.source.paymentMethod = null
    form.value.source.modeOfPayment = null
    // Keep payee/source fields as they are
  }
})

const saveDraft = () => emit('save', true)

const countValidItems = (items: any[]) => {
  return items.filter((item: any) => item?.itemId || item?.accountId).length
}

const getSourceType = () => {
  const source = form.value?.source
  if (!source) return null
  return source.sourceType || (source.payee ? 'VENDOR' : null)
}

const isSourceValid = computed(() => {
  const source = form.value?.source
  const sourceType = getSourceType()
  if (!source || !sourceType) return false
  if (sourceType === 'CASH') return !!source.accountId
  if (sourceType === 'STORE' || sourceType === 'PARTIES') return !!source.sourceId
  if (sourceType === 'VENDOR' || sourceType === 'SERVICE_PROVIDER') return !!source.payee
  return true
})

const itemHasValidLines = (item: any) => {
  const materials = item?.materials || []
  const accounts = item?.accounts || []
  const hasValidMaterials = materials.some((m: any) => m.itemId && m.unitId && Number(m.quantity || 0) > 0 && Number(m.rate || 0) > 0)
  const hasValidAccounts = accounts.some((a: any) => a.accountId && Number(a.amount || 0) > 0)
  return hasValidMaterials || hasValidAccounts
}

const costCenterHasValidItems = (cc: any) => {
  return (cc.items || []).some((it: any) => it.itemId || it.accountId)
}

const totalItemsCount = computed(() => {
  const costCenters = form.value?.costCenters || []
  const costCenterItems = costCenters.reduce((sum: number, cc: any) => {
    return sum + (Array.isArray(cc.items) ? countValidItems(cc.items) : 0)
  }, 0)
  const directItems = Array.isArray(form.value?.items) ? countValidItems(form.value.items) : 0
  return costCenterItems + directItems
})

const hasValidLines = computed(() => {
  const costCenters = form.value?.costCenters || []
  const costCenterValid = costCenters.some(costCenterHasValidItems)
  const directValid = Array.isArray(form.value?.items) ? form.value.items.some(itemHasValidLines) : false
  return costCenterValid || directValid
})

const requiredFieldsComplete = computed(() => {
  const f = form.value || {}
  return !!f.requisitionTypeId && !!f.fundDirection && !!f.requiredDate && !!f.currencyId
})

const canSubmitByStatus = computed(() => {
  const status = form.value?.status
  if (!status) return true
  return status === 'DRAFT' || status === 'REJECTED'
})

const canSubmitForApproval = computed(() => {
  return requiredFieldsComplete.value && hasValidLines.value && isSourceValid.value && canSubmitByStatus.value && !savingForm.value
})

const submitDisabledReason = computed(() => {
  if (!canSubmitByStatus.value) return 'Only draft or rejected requisitions can be submitted.'
  if (!requiredFieldsComplete.value) return 'Complete required fields before submitting.'
  if (!isSourceValid.value) return 'Select a valid funding source before submitting.'
  if (!hasValidLines.value) return 'Add at least one valid item line before submitting.'
  if (savingForm.value) return 'Save in progress.'
  return ''
})

const submitForApproval = () => {
  if (!canSubmitForApproval.value) return
  emit('save', false)
}

const onAddItem = () => {
  emit('add-item')
}

// Computed total for a specific item
const getItemTotal = (item: any) => {
  let total = 0

  // Add main item amount (qty * rate) if no child materials
  if (item.quantity && item.rate && (!item.materials || item.materials.length === 0)) {
    total += Number(item.quantity || 0) * Number(item.rate || 0)
  }

  // Sum up child materials
  if (item.materials && item.materials.length > 0) {
    total += item.materials.reduce((sum: number, m: any) => {
      const lineTotal = Number(m.quantity || 0) * Number(m.rate || 0)
      return sum + lineTotal
    }, 0)
  }

  // Sum up accounts
  if (item.accounts) {
    total += item.accounts.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0)
  }
  return total
}

// Helper function to flatten account hierarchy with parent grouping
// Returns options with parent headers (non-selectable) and child accounts (selectable)
const flattenAccountsWithGroups = (accountList: any[]): any[] => {
  const options: any[] = []
  
  accountList.forEach((acc: any) => {
    if (acc.children && acc.children.length > 0) {
      // This is a parent account - add as header, then add children
      options.push({
        label: `${acc.code} - ${acc.name}`,
        value: null,
        $isDisabled: true,
        isHeader: true,
        isParentHeader: true
      })
      // Add children under this parent
      acc.children.forEach((child: any) => {
        const displayLabel = child.code ? `${child.code} - ${child.name}` : child.name
        options.push({
          label: displayLabel,
          value: child.id,
          code: child.code || null,
          name: child.name,
          parentName: acc.name,
          isChild: true,
          searchText: `${child.name} ${child.code || ''} ${acc.name}`
        })
      })
    } else {
      // This is a standalone leaf account (no children) - add directly
      const displayLabel = acc.code ? `${acc.code} - ${acc.name}` : acc.name
      options.push({
        label: displayLabel,
        value: acc.id,
        code: acc.code || null,
        name: acc.name,
        isChild: false,
        searchText: `${acc.name} ${acc.code || ''}`
      })
    }
  })
  
  return options
}

// Grouped account options for dropdowns
const groupedAccountOptions = computed(() => flattenAccountsWithGroups(accounts.value || []))
const groupedSourceAccountOptions = computed(() => flattenAccountsWithGroups(sourceAccounts.value || []))
const groupedReplenishAccountOptions = computed(() => flattenAccountsWithGroups(replenishAccounts.value || []))

// Keep flat versions for lookups (finding account by ID)
const flatAccounts = computed(() => {
  const flattened: any[] = []
  const flatten = (acc: any) => {
    flattened.push(acc)
    if (acc.children && acc.children.length > 0) {
      acc.children.forEach((child: any) => flatten(child))
    }
  }
  ;(accounts.value || []).forEach(flatten)
  return flattened
})

const flatSourceAccounts = computed(() => {
  const flattened: any[] = []
  const flatten = (acc: any) => {
    flattened.push(acc)
    if (acc.children && acc.children.length > 0) {
      acc.children.forEach((child: any) => flatten(child))
    }
  }
  ;(sourceAccounts.value || []).forEach(flatten)
  return flattened
})

const itemAccountOptions = computed(() => {
  const options: any[] = []

  // Items group
  if (itemsOptions.value && itemsOptions.value.length > 0) {
    options.push({ label: 'ITEMS', value: null, $isDisabled: true, isHeader: true })
    itemsOptions.value.forEach((itm: any) => {
      options.push({
        label: itm.name,
        value: `ITEM:${itm.id}`,
        code: itm.code || null,
        name: itm.name,
        searchText: `${itm.name} ${itm.code || ''} item`
      })
    })
  }

  // Accounts group - with parent grouping (parents as headers, children selectable)
  if (groupedAccountOptions.value && groupedAccountOptions.value.length > 0) {
    options.push({ label: 'ACCOUNTS', value: null, $isDisabled: true, isHeader: true })
    groupedAccountOptions.value.forEach((opt: any) => {
      if (opt.isHeader) {
        // Parent account header
        options.push({
          label: opt.label,
          value: null,
          $isDisabled: true,
          isHeader: true,
          isParentHeader: true
        })
      } else {
        // Selectable child or standalone account
        options.push({
          label: opt.isChild ? `    ${opt.label}` : opt.label, // Indent children
          value: `ACCOUNT:${opt.value}`,
          code: opt.code || null,
          name: opt.name,
          isChild: opt.isChild,
          searchText: `${opt.name} ${opt.code || ''} ${opt.parentName || ''} account`
        })
      }
    })
  }

  return options
})

const costCenterOptions = computed(() => {
  const options: any[] = []
  for (const type of dimensionTypes.value || []) {
    const values = (dimensionValues.value || []).filter((v: any) => v.dimension_type_id === type.id)
    if (values.length > 0) {
      options.push({
        label: type.name,
        value: `GROUP:${type.id}`,
        isHeader: true,
        groupKey: `TYPE:${type.id}`,
        icon: 'fa fa-sitemap',
      })
    }
    for (const val of values) {
      options.push({
        label: val.name,
        value: val.id, 
        groupKey: `TYPE:${type.id}`,
        icon: 'fa fa-dot-circle-o',
        searchText: `${type.name} ${val.name}`,
      })
    }
  }
  return options
})

const sourceOptions = computed(() => {
  const options = []

  // Cash accounts with group label - with parent grouping
  if (groupedSourceAccountOptions.value && groupedSourceAccountOptions.value.length > 0) {
    options.push({ label: "ACCOUNTS", value: null, $isDisabled: true, isHeader: true })
    groupedSourceAccountOptions.value.forEach((opt: any) => {
      if (opt.isHeader) {
        // Parent account header
        options.push({
          label: opt.label,
          value: null,
          $isDisabled: true,
          isHeader: true,
          isParentHeader: true
        })
      } else {
        // Selectable child or standalone account
        const displayLabel = opt.isChild ? `    ${opt.label}` : opt.label
        options.push({
          label: displayLabel,
          value: `CASH:${opt.value}`,
          accountName: opt.name,
          code: opt.code || null,
          isChild: opt.isChild,
          searchText: opt.code ? `${opt.name} ${opt.code} ${opt.parentName || ''} cash` : `${opt.name} cash`
        })
      }
    })
  }

  // Store locations with group label
  if (locations.value && locations.value.length > 0) {
    options.push({ label: 'STORES', value: null, $isDisabled: true, isHeader: true })
    locations.value.forEach((location: any) => {
      options.push({
        label: location.name,
        value: `STORE:${location.id}`,
        accountName: location.name,
        code: null,
        searchText: `${location.name} store location`
      })
    })
  }

  // Party entities with group label
  if (entities.value && entities.value.length > 0) {
    options.push({ label: 'PARTIES', value: null, $isDisabled: true, isHeader: true })
    entities.value.forEach((entity: any) => {
      options.push({
        label: entity.name,
        value: `PARTIES:${entity.id}`,
        accountName: entity.name,
        code: null,
        searchText: `${entity.name} party`
      })
    })
  }

  return options
})

// Refs for multiselect dropdowns to manually close them
const modeOfPaymentRef = ref<any>(null)
const paymentMethodRef = ref<any>(null)
const receivingAccountRef = ref<any>(null)
const custodianRef = ref<any>(null)

// --- Payment mode options ---
const paymentModeOptions = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Telegraph Transfer', value: 'TT' },
  { label: 'Credit', value: 'CREDIT' }
]

// Computed wrapper for modeOfPayment (EXPENSE direct payment)
const modeOfPaymentSelection = computed({
  get() {
    const val = form.value?.source?.modeOfPayment
    return paymentModeOptions.find(o => o.value === val) || null
  },
  set(opt: any) {
    if (!form.value?.source) return
    form.value.source.modeOfPayment = opt?.value || null
  }
})

// Computed wrapper for paymentMethod (WITHDRAW section)
const paymentMethodSelection = computed({
  get() {
    const val = form.value?.source?.paymentMethod
    return paymentModeOptions.find(o => o.value === val) || null
  },
  set(opt: any) {
    if (!form.value?.source) return
    form.value.source.paymentMethod = opt?.value || null
  }
})

// Computed wrapper for receivingAccountId
const receivingAccountSelection = computed({
  get() {
    const id = form.value?.source?.receivingAccountId
    if (!id) return null
    return groupedReplenishAccountOptions.value.find((o: any) => o.value === id) || null
  },
  set(opt: any) {
    if (!form.value?.source) return
    form.value.source.receivingAccountId = opt?.value || null
  }
})

// Computed wrapper to debug/ensure users options are valid
const usersOptions = computed(() => {
  const opts = users.value || []
  // console.log('RequisitionForm: Users available for Custodian select:', opts.length, opts)
  return opts
})

// Computed wrapper for custodianId
const custodianSelection = computed({
  get() {
    const id = form.value?.source?.custodianId
    if (!id) return null
    return (usersOptions.value).find((u: any) => u.id === id) || null
  },
  set(opt: any) {
    if (!form.value?.source) return
    form.value.source.custodianId = opt?.id || null
  }
})

// Helper to display user's full name (first + last) with fallbacks
const getUserDisplayName = (u: any) => {
  if (!u) return ''
  const first = (u.first_name || u.firstName || '').toString().trim()
  const last = (u.last_name || u.lastName || '').toString().trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (u.name) return u.name
  if (u.username) return u.username
  return u.email || ''
}

// Helper to get cost center selection object from ID
const getCostCenterSelection = (cc: any) => {
  if (!cc?.costCenterId) return null
  return costCenterOptions.value.find((o: any) => o.value === cc.costCenterId) || null
}

// Handler for cost center selection change - using v-model binding
const setCostCenterSelection = (cc: any, selected: any, multiselectRef?: any) => {
  if (selected && !selected.isHeader) {
    cc.costCenterId = selected.value
  } else {
    cc.costCenterId = null
  }
}

// --- Attachments Logic ---
const attachmentType = ref('Funding')
const attachmentReference = ref<any>(null)
const currentAttachmentTab = ref('All')
const selectedAttachmentFile = ref<File | null>(null)
const attachmentInputRef = ref<HTMLInputElement | null>(null)

const ensureAttachments = () => {
  if (!form.value) return []
  if (!Array.isArray(form.value.attachments)) {
    form.value.attachments = []
  }
  return form.value.attachments
}


const filteredAttachments = computed(() => {
  const list = ensureAttachments()
  if (currentAttachmentTab.value === 'All') {
    return list
  }
  return list.filter((a: any) => a.linkedTo === currentAttachmentTab.value)
})

const attachmentTypeOptions = ['Funding', 'Cost Center', 'Line Item', 'General']

const resolveCostCenterLabel = (costCenterId: number | string | null) => {
  if (!costCenterId) return ''
  const numericId = Number(costCenterId)
  const value = (dimensionValues.value || []).find((v: any) => v.id === numericId)
  if (!value) return `Cost Center #${String(costCenterId)}`
  const type = (dimensionTypes.value || []).find((t: any) => t.id === value.dimension_type_id)
  return type ? `${type.name} - ${value.name}` : value.name
}

const resolveLineItemLabel = (item: any) => {
  if (item?.itemId) {
    const itemDef = (itemsOptions.value || []).find((opt: any) => opt.id === item.itemId)
    return itemDef?.name || `Item #${item.itemId}`
  }
  if (item?.accountId) {
    const accountDef = (flatAccounts.value || []).find((acc: any) => acc.id === item.accountId)
    return accountDef?.name || `Account #${item.accountId}`
  }
  return 'Line Item'
}

const attachmentReferenceOptions = computed(() => {
  if (attachmentType.value === 'Funding') {
    const source = form.value?.source
    if (!source?.sourceType) return []
    if (source.sourceType === 'CASH' && source.accountId) {
      const account = (flatSourceAccounts.value || []).find((a: any) => a.id === source.accountId)
      return [{ label: account?.name || `Account #${source.accountId}`, value: `CASH:${source.accountId}` }]
    }
    if (source.sourceType === 'STORE' && source.sourceId) {
      const location = (locations.value || []).find((l: any) => l.id === source.sourceId)
      return [{ label: location?.name || `Store #${source.sourceId}`, value: `STORE:${source.sourceId}` }]
    }
    if (source.sourceType === 'PARTIES' && source.sourceId) {
      const entity = (entities.value || []).find((e: any) => e.id === source.sourceId)
      return [{ label: entity?.name || entity?.full_name || `Party #${source.sourceId}`, value: `PARTIES:${source.sourceId}` }]
    }
    return []
  }
  if (attachmentType.value === 'Cost Center') {
    const centers = form.value?.costCenters || []
    return centers
      .filter((cc: any) => cc?.costCenterId)
      .map((cc: any) => ({
        label: resolveCostCenterLabel(cc.costCenterId) || `Cost Center`,
        value: cc._key,
      }))
  }
  if (attachmentType.value === 'Line Item') {
     const centers = form.value?.costCenters || []
     const rows: any[] = []
     centers.forEach((cc: any, ccIndex: number) => {
       ;(cc.items || []).forEach((item: any, itemIndex: number) => {
         rows.push({
           label: `${resolveLineItemLabel(item)} (CC ${ccIndex + 1}, Item ${itemIndex + 1})`,
           value: item._key || `${cc._key}:${itemIndex}`,
         })
       })
     })
     return rows
  }
  return []
})

const getAttachmentFileType = (file: File) => {
  const name = (file.name || '').toLowerCase()
  if (file.type.includes('pdf') || name.endsWith('.pdf')) return 'PDF'
  if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(name)) return 'Image'
  if (/\.(doc|docx)$/i.test(name)) return 'DOCX'
  return 'File'
}

const onAttachmentFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0] || null
  selectedAttachmentFile.value = file
}

const saveAttachment = () => {
  const file = selectedAttachmentFile.value
  if (!file) return
  if (attachmentType.value !== 'General' && !attachmentReference.value) return

  const refLabel = attachmentReference.value
    ? (typeof attachmentReference.value === 'object' ? attachmentReference.value.label : attachmentReference.value)
    : ''
  const refValue = attachmentReference.value
    ? (typeof attachmentReference.value === 'object' ? attachmentReference.value.value : attachmentReference.value)
    : null
  const fileType = getAttachmentFileType(file)
  const now = new Date()

  const newFile = {
    file,
    name: file.name || `attachment-${now.getTime()}`,
    type: fileType,
    linkedTo: attachmentType.value,
    reference: refLabel || (attachmentType.value === 'General' ? 'General' : ''),
    reference_value: refValue,
    uploadedBy: username.value || 'Unknown',
    date: now.toLocaleDateString(),
    url: URL.createObjectURL(file),
  }

  ensureAttachments().unshift(newFile)
  attachmentReference.value = null
  selectedAttachmentFile.value = null
  if (attachmentInputRef.value) {
    attachmentInputRef.value.value = ''
  }
}

const cancelAttachment = () => {
  attachmentReference.value = null
  attachmentType.value = 'Funding'
  selectedAttachmentFile.value = null
  if (attachmentInputRef.value) {
    attachmentInputRef.value.value = ''
  }
}

const deleteAttachment = (index: number) => {
  const list = ensureAttachments()
  const fileToRemove = filteredAttachments.value[index]
  const mainIndex = list.indexOf(fileToRemove)
  if (mainIndex > -1) {
    if (list[mainIndex]?.url) {
      URL.revokeObjectURL(list[mainIndex].url)
    }
    list.splice(mainIndex, 1)
  }
}

const openAttachment = (file: any) => {
  if (!file) return
  const url = file.url || (file.file ? URL.createObjectURL(file.file) : '')
  if (!url) return
  window.open(url, '_blank')
  if (!file.url && file.file) {
    file.url = url
  }
}

// When user selects a dimension value, auto-fill the type
const onDimensionValueChange = (line: any, valueId: number | null) => {
  if (!valueId) {
    line.dimensionTypeId = null
    line.dimensionValueId = null
    return
  }
  const selectedValue = (dimensionValues.value || []).find((v: any) => v.id === valueId)
  if (selectedValue) {
    line.dimensionTypeId = selectedValue.dimension_type_id
    line.dimensionValueId = valueId
  }
}

// Get display name for a dimension value (includes type prefix)
const getDimensionDisplayName = (line: any) => {
  if (!line.dimensionValueId) return ''
  const value = (dimensionValues.value || []).find((v: any) => v.id === line.dimensionValueId)
  const type = (dimensionTypes.value || []).find((t: any) => t.id === line.dimensionTypeId)
  if (value && type) return `${type.name} › ${value.name}`
  return value?.name || ''
}

// When user selects an item, auto-fill unit if item has default unit
const onMaterialItemChange = (line: any, itemId: number | null) => {
  line.itemId = itemId
  if (!itemId) return
  const selectedItem = (itemsOptions.value || []).find((i: any) => i.id === itemId)
  if (selectedItem?.unit_of_measurement_id && !line.unitId) {
    line.unitId = selectedItem.unit_of_measurement_id
  } else if (selectedItem?.default_unit_id && !line.unitId) {
    line.unitId = selectedItem.default_unit_id
  }
}

// When user selects main item, auto-fill unit and inherit requisition currency
const onMainItemChange = (item: any) => {
  if (!item.itemId) return
  const selectedItem = (itemsOptions.value || []).find((i: any) => i.id === item.itemId)
  if (selectedItem?.unit_of_measurement_id && !item.unitId) {
    item.unitId = selectedItem.unit_of_measurement_id
  } else if (selectedItem?.default_unit_id && !item.unitId) {
    item.unitId = selectedItem.default_unit_id
  }

}

// Check if an item has child materials 
const getItemHasMaterials = (itemId: number | null) => {
  if (!itemId) return false
  const selectedItem = (itemsOptions.value || []).find((i: any) => i.id === itemId)
  // Check if item has children/materials property indicating BOM
  return selectedItem?.has_materials || selectedItem?.has_children || selectedItem?.is_parent || false
}

// Toggle item expansion - only one item expanded at a time
const toggleItemExpansion = (item: any, itemIndex: number) => {
  if (!form.value.items || form.value.items.length <= 1) return

  // If clicking the currently expanded item, just toggle it
  if (item._expanded) {
    item._expanded = false
  } else {
    // Collapse all other items and expand this one
    form.value.items.forEach((itm: any, idx: number) => {
      itm._expanded = idx === itemIndex
    })
  }
}

// When user enters an amount at item level, update dimensions
const onItemAmountChange = (item: any) => {
  if (!item.amount || item.amount <= 0) return

  // If no dimensions exist, create one with 100%
  if (!item.dimensions || item.dimensions.length === 0) {
    item.dimensions = []
  }

  // Update all dimensions with the amount and set first one to 100%
  item.dimensions.forEach((dim: any, index: number) => {
    dim.amount = item.amount
    if (index === 0) {
      dim.percentage = 100
    }
  })

  // If there are no dimensions at all, we need at least one
  // Parent component should handle adding the dimension entry
}

// Cost centers: allow multiple allocations per item
const makeKey = () => {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const addCostCenter = (item: any) => {
  if (!item.costCenters) item.costCenters = []
  item.costCenters.push({ _key: makeKey(), costCenterId: null, amount: 0 })
}

const removeCostCenter = (item: any, key: string) => {
  if (!item.costCenters) return
  item.costCenters = (item.costCenters || []).filter((c: any) => c._key !== key)
}

// Shared cost centers at requisition level (each cost center contains items)
const addRequisitionCostCenter = () => {
  if (!form.value.costCenters) form.value.costCenters = []
  form.value.costCenters.unshift({ _key: makeKey(), costCenterId: null, items: [], _expanded: true })
}

const removeRequisitionCostCenter = (key: string) => {
  if (!form.value.costCenters) return
  form.value.costCenters = (form.value.costCenters || []).filter((c: any) => c._key !== key)
}

const toggleCostCenter = (cc: any) => {
  cc._expanded = !(cc._expanded ?? true)
}

const addItemToCostCenter = (cc: any) => {
  if (!cc.costCenterId) return
  if (!cc.items) cc.items = []
  cc.items.unshift({
    _key: makeKey(),
    itemId: null,
    unitId: null,
    quantity: 1,
    rate: 0,
    accountId: null,
    remarks: ''
  })
}

const removeItemFromCostCenter = (cc: any, itemKey: string) => {
  if (!cc.items) return
  cc.items = cc.items.filter((i: any) => i._key !== itemKey)
}

const getCostCenterTotal = (cc: any) => {
  const items = cc?.items || []
  return items.reduce((sum: number, item: any) => {
    const lineTotal = Number(item.quantity || 0) * Number(item.rate || 0)
    return sum + lineTotal
  }, 0)
}

const getCostCenterSubtotal = (cc: any) => getCostCenterTotal(cc)

const getCostCenterTax = (_cc: any) => 0

const getCostCenterGrandTotal = (cc: any) => {
  return getCostCenterSubtotal(cc) + getCostCenterTax(cc)
}

const allCostCentersSubtotal = computed(() => {
  const centers = form.value?.costCenters || []
  return centers.reduce((sum: number, cc: any) => sum + getCostCenterSubtotal(cc), 0)
})

const allCostCentersTax = computed(() => {
  const centers = form.value?.costCenters || []
  return centers.reduce((sum: number, cc: any) => sum + getCostCenterTax(cc), 0)
})

const allCostCentersGrandTotal = computed(() => {
  const centers = form.value?.costCenters || []
  return centers.reduce((sum: number, cc: any) => sum + getCostCenterGrandTotal(cc), 0)
})

const getItemAccountSelection = (line: any) => {
  let val: string | null = null
  if (line?.itemId) val = `ITEM:${line.itemId}`
  else if (line?.accountId) val = `ACCOUNT:${line.accountId}`
  
  if (!val) return null
  
  return itemAccountOptions.value.find((opt: any) => opt.value === val) || null
}

const onItemAccountSelect = (line: any, value: any, multiselectRef?: any) => {
  // Handle both object (from vue-multiselect) and string values
  const raw = value?.value ? String(value.value) : (value ? String(value) : '')
  const normalized = !raw || raw === 'null' ? null : raw

  if (!normalized) {
    line.itemId = null
    line.accountId = null
    line.unitId = null
    return
  }

  const [type, idValue] = normalized.split(':')
  const parsedId = Number(idValue || 0) || null

  if (type === 'ITEM') {
    line.itemId = parsedId
    line.accountId = null
    onMainItemChange(line)
    return
  }

  if (type === 'ACCOUNT') {
    line.accountId = parsedId
    line.itemId = null
    line.unitId = null
  }
  
  // Close the dropdown
  nextTick(() => {
    if (multiselectRef?.deactivate) {
      multiselectRef.deactivate()
    }
  })
}
</script>

<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-file-text"></i></span>
            REQUISITION / <span>REQUISITIONS FORM</span>
          </div>
          <h1>{{ isEditMode ? 'Edit Requisition' : 'Create Requisition' }}</h1>
          <p class="subtitle">Fill in the requisition details and add line items for materials or expenses.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="emit('cancel')">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn ghost" type="button" @click="emit('reset')">
            <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
          </button>
          <button class="btn secondary" type="button" @click="saveDraft" :disabled="savingForm">
            <span class="btn-icon"><i class="fa fa-save"></i></span> Save Draft
          </button>

        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="emit('clear-error')"></button>
      </div>

      <!-- 2-column layout -->
      <section class="grid">
        <!-- LEFT: Requisition Details Form -->
        <aside class="panel left-panel">


          <div class="form">
            <!-- Identification Section -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-tag"></i></span>
                Identification
              </div>

              <label class="field">
                <span class="lbl">Type <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-list"></i></span>
                  <select v-model="form.requisitionTypeId">
                    <option :value="null">Select type...</option>
                    <option v-for="type in requisitionTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                  </select>
                </div>
              </label>

              <div class="date-row">
                <label class="field">
                  <span class="lbl">Fund Direction <span class="req">*</span></span>
                  <div class="input-wrapper">
                    <span class="input-icon"><i class="fa fa-exchange"></i></span>
                    <select v-model="form.fundDirection">
                      <option :value="null">Select...</option>
                      <option value="DIRECT_PAYMENT">Direct payment</option>
                      <option value="WITHDRAW">Withdraw</option>
                    </select>
                  </div>
                  <small class="field-help">
                    This determines whether payment is made directly or via internal fund withdrawal.
                  </small>
                </label>

                <label class="field">
                  <span class="lbl">Required Date <span class="req">*</span></span>
                  <div class="input-wrapper">
                    <span class="input-icon"><i class="fa fa-calendar"></i></span>
                    <Datepicker class="date-picker-lg" v-model="form.requiredDate" model-type="yyyy-MM-dd" />
                  </div>
                </label>
              </div>

            </div> <!-- Currency & Tax Section -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-money"></i></span>
                Currency & Tax
              </div>

              <label class="field">
                <span class="lbl">Currency <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-dollar"></i></span>
                  <select v-model="form.currencyId">
                    <option :value="null">Select currency...</option>
                    <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                      {{ currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Tax Method</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-percent"></i></span>
                  <select v-model="form.taxMethod">
                    <option :value="null">Select tax method</option>
                    <option value="EXCLUSIVE">Exclusive</option>
                    <option value="INCLUSIVE">Inclusive</option>
                    <option value="EXEMPT">Exempt</option>
                  </select>
                </div>
              </label>

              <div class="discount-row" v-if="form.discountMethod">
                <label class="field">
                  <span class="lbl">Discount</span>
                  <div class="input-wrapper">
                    <span class="input-icon"><i class="fa fa-tag"></i></span>
                    <select v-model="form.discountMethod" class="discount-type">
                      <option :value="null">No discount</option>
                      <option value="PERCENT">Percentage</option>
                      <option value="LS">Lump Sum</option>
                    </select>
                  </div>
                </label>
                <label class="field" v-if="form.discountMethod">
                  <span class="lbl">Amount</span>
                  <div class="input-wrapper">
                    <span class="input-icon"><i class="fa fa-dollar"></i></span>
                    <input type="number" v-model.number="form.discountAmount" min="0" step="0.01" placeholder="0.00" />
                  </div>
                </label>
              </div>
            </div>
            <!-- Summary Section -->
            <!-- <div class="form-section summary-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-calculator"></i></span>
                Summary
              </div> -->
            <!-- 
              <div class="summary-row total"> -->
            <!-- <span class="summary-label">Grand Total</span>
                <span class="summary-value">{{ getCurrencySymbol() }}{{ formatAmount(grandTotal) }}</span>
              </div> -->
            <!-- </div> -->
          </div>
        </aside>

        <!-- CENTER: Requisition Line Items -->
        <section class="panel center-panel">
          <div class="panel-header center-header">
            <div class="panel-icon"><i class="fa fa-list-alt"></i></div>
            <div class="panel-title-text">
              <h3>Funding and Cost breakdown</h3>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="tabs-float">
            <div class="tabs">
              <button type="button" class="tab" :class="{ active: activeFormTab === 'sources' }"
                @click="activeFormTab = 'sources'">
                <span class="tab-icon">💳</span>
                <span class="tab-text">Funding</span>
              </button>
              <button type="button" class="tab" :class="{ active: activeFormTab === 'items' }"
                @click="activeFormTab = 'items'">
                <span class="tab-icon">📦</span>
                <span class="tab-text">Cost Breakdown</span>
                <span class="tab-count" v-if="totalItemsCount > 0">{{ totalItemsCount }}</span>
              </button>
              <button type="button" class="tab" :class="{ active: activeFormTab === 'attachments' }"
                @click="activeFormTab = 'attachments'">
                <span class="tab-icon">📎</span>
                <span class="tab-text">Attachments</span>
              </button>
            </div>
          </div>

          <!-- ITEMS TAB -->
          <div v-if="activeFormTab === 'items'" class="tab-content">
            <div class="items-header">
              <button class="btn btn-sm btn-primary" type="button" @click="addRequisitionCostCenter">
                <i class="fa fa-plus me-1"></i> Add Cost Center
              </button>
            </div>

            <!-- Cost Centers with nested items -->
            <div v-if="form.costCenters && form.costCenters.length > 0" class="cost-centers-list">
              <div v-for="(cc, ccIndex) in form.costCenters" :key="cc._key" class="cost-center-card"
                :class="{ collapsed: cc._expanded === false }">
                <!-- Cost Center Header -->
                <div class="cost-center-header" @click="toggleCostCenter(cc)">
                  <div class="cost-center-info">
                    <span class="cc-toggle" :class="{ collapsed: cc._expanded === false }">
                      <i class="fa fa-chevron-down"></i>
                    </span>
                    <span class="cc-number">#{{ ccIndex + 1 }}</span>
                    <Multiselect :ref="(el) => { if (el) cc._multiselectRef = el }"
                      :model-value="getCostCenterSelection(cc)" 
                      @update:model-value="(val) => setCostCenterSelection(cc, val, cc._multiselectRef)"
                      class="v-select-field v-select-grouped cost-center-select"
                      :options="costCenterOptions" label="label" track-by="value"
                      :allow-empty="true" :append-to-body="true" :multiple="false"
                      :close-on-select="true" :group-select="false"
                      :option-height="28" :max-height="300"
                      :selectable="(option) => !option.isHeader && !option.$isDisabled"
                      :searchable="true" :options-limit="300"
                      placeholder="Search cost center..." 
                      @click.stop>
                      <template #option="{ option }">
                        <div :class="{ 'cost-center-header': option.isHeader, 'cost-center-option': !option.isHeader }">
                          {{ option.label }}
                        </div>
                      </template>
                    </Multiselect>
                  </div>
                  <div class="cost-center-actions">
                    <span class="cc-total">Total Amount: {{ getCurrencySymbol() }}{{
                      formatAmount(getCostCenterTotal(cc)) }}</span>
                    <button type="button" class="btn btn-sm btn-success me-2" :disabled="!cc.costCenterId"
                      @click.stop="addItemToCostCenter(cc)">
                      <i class="fa fa-plus me-1"></i> Add Item
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger"
                      @click.stop="removeRequisitionCostCenter(cc._key)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </div>

                <!-- Items under this cost center -->
                <div class="cost-center-items" v-show="cc._expanded !== false">
                  <div v-if="cc.items && cc.items.length > 0">
                    <table class="items-table">
                      <thead>
                        <tr>
                          <th style="width: 5%">#</th>
                          <th style="width: 40%">Item/Account</th>
                          <th style="width: 12%">Unit</th>
                          <th style="width: 10%">Quantity</th>
                          <th style="width: 12%">Rate</th>
                          <th style="width: 10%">Total</th>
                          <th style="width: 6%"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, itemIndex) in cc.items" :key="item._key">
                          <td class="text-center">{{ itemIndex + 1 }}</td>

                          <td>
                            <Multiselect :ref="(el) => { if (el) item._multiselectRef = el }" 
                              class="v-select-sm v-select-grouped" :modelValue="getItemAccountSelection(item)"
                              :options="itemAccountOptions" label="label" track-by="value" :custom-label="(opt) => opt.label"
                              :allow-empty="true" :multiple="false" :close-on-select="true" :group-select="false"
                              :option-height="28" :max-height="300"
                              :selectable="(option) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                              placeholder="Search..."
                              @update:modelValue="(value) => onItemAccountSelect(item, value, item._multiselectRef)">
                              <template #option="{ option }">
                                <div :class="{ 
                                  'item-header': option.isHeader || option.isParentHeader, 
                                  'item-option': !option.isHeader && !option.isParentHeader,
                                  'ps-3': option.isChild 
                                }">
                                  <span class="item-name">{{ option && option.name ? option.name : option.label }}</span>
                                  <span v-if="option && option.code" class="item-code">{{ option.code }}</span>
                                </div>
                              </template>
                            </Multiselect>
                          </td>

                          <td>
                            <select v-model="item.unitId" class="form-control form-control-sm">
                              <option :value="null">Unit...</option>
                              <option v-for="unit in unitsOptions" :key="unit.id" :value="unit.id">{{ unit.name }}
                              </option>
                            </select>
                          </td>

                          <td>
                            <input v-model.number="item.quantity" type="number" min="0" step="1"
                              class="form-control form-control-sm text-end" placeholder="0" />
                          </td>

                          <td>
                            <CurrencyInput
                              v-model="item.rate"
                              class="form-control-sm text-end"
                              placeholder="0.00"
                            />
                          </td>

                          <td class="text-end">
                            <strong>{{ getCurrencySymbol() }}{{ formatAmount((item.quantity || 0) * (item.rate || 0))
                            }}</strong>
                          </td>
                          <td class="text-center">
                            <button type="button" class="btn btn-xs btn-outline-danger"
                              @click="removeItemFromCostCenter(cc, item._key)">
                              <i class="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                  </div>
                  <div v-else class="empty-items-state">
                    <span class="text-muted small">No items yet. Click "Add Item" to add items to this cost
                      center.</span>
                  </div>
                </div>
              </div>
              <div class="cost-center-summary-wrap" v-if="form.costCenters && form.costCenters.length > 0">
                <div class="cost-center-summary">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>{{ getCurrencySymbol() }}{{ formatAmount(allCostCentersSubtotal) }}</span>
                  </div>
                  <div class="summary-row">
                    <span>Tax</span>
                    <span>{{ getCurrencySymbol() }}{{ formatAmount(allCostCentersTax) }}</span>
                  </div>
                  <div class="summary-row grand">
                    <span>Grand Total</span>
                    <span>{{ getCurrencySymbol() }}{{ formatAmount(allCostCentersGrandTotal) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-large">
              <div class="empty-icon"><i class="fa fa-folder-open fa-4x"></i></div>
              <h3>No Cost Centers Yet</h3>
              <p>Add a cost center to start organizing requisition items</p>
              <button class="btn btn-primary" type="button" @click="addRequisitionCostCenter">
                <i class="fa fa-plus me-2"></i> Add First Cost Center
              </button>
            </div>

          </div> <!-- end ITEMS TAB -->

          <!-- SOURCES TAB -->
          <div v-if="activeFormTab === 'sources'" class="tab-content">
            <div class="inner-card form-card">
              <div class="table-header">
                <div class="lines-info">
                  <h3>Funding Source</h3>
                  <span class="line-count">Specify the funding source for this requisition</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form p-4" v-if="activeFormTab === 'sources'">
            <div class="form-section">
              <h4 class="section-title mb-3" >
                {{ form.fundDirection === 'DIRECT_PAYMENT' ? 'Direct Payment' : 'Withdraw Funds' }}
              </h4>

              <div v-if="form.fundDirection === 'DIRECT_PAYMENT'" class="direct-payment-card">
                <label class="field">
                  <span class="lbl">Payment Mode</span>
                  <div class="input-wrapper has-v-select">
                    <span class="input-icon"><i class="fa fa-credit-card"></i></span>
                    <v-select ref="modeOfPaymentRef" v-model="modeOfPaymentSelection" class="v-select-field" 
                      :options="paymentModeOptions"
                      label="label" 
                      :reduce="(option: any) => option"
                      :clearable="false"
                      :append-to-body="true"
                      placeholder="Select payment mode...">
                    </v-select>
                  </div>
                </label>

                <div class="row">
                  <label class="field col-md-6">
                    <span class="lbl">Source</span>
                    <div class="input-wrapper has-v-select">
                      <span class="input-icon"><i class="fa fa-bank"></i></span>
                      <v-select ref="sourceAccountSelect" v-model="sourceSelection"
                        class="v-select-field v-select-grouped" :options="sourceOptions"
                        label="label" :reduce="(option: any) => option" :clearable="true"
                        :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                        placeholder="Search or select source..."
                        :append-to-body="true"
                        :filterable="true">
                        <template #option="option">
                          <div :class="{ 
                            'source-header': option.isHeader || option.isParentHeader, 
                            'source-option': !option.isHeader && !option.isParentHeader,
                            'ps-3': option.isChild 
                          }">
                            {{ option.label }}
                          </div>
                        </template>
                      </v-select>
                    </div>
                  </label>

                  <label class="field col-md-6">
                    <span class="lbl">Payee</span>
                    <div class="input-wrapper">
                      <span class="input-icon"><i class="fa fa-user"></i></span>
                      <input v-model="form.source.payee" type="text" class="form-control" placeholder="Payee name" />
                    </div>
                  </label>
                </div>

                <label class="field">
                  <span class="lbl">Description</span>
                  <div class="input-wrapper textarea-wrapper">
                    <span class="input-icon"><i class="fa fa-align-left"></i></span>
                    <textarea v-model="form.source.description" rows="3"
                      placeholder="Notes about this funding source..."></textarea>
                  </div>
                </label>
              </div>



              <div v-else-if="form.fundDirection === 'WITHDRAW'">
                <!-- FROM Section -->
                <div class="rounded-3 border mb-0">
                  <div class="px-3 py-2 fw-bold d-flex justify-content-between align-items-center"
                    style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <span>FROM <span class="text-muted fw-normal">(Source Account)</span></span>
                    <i class="fa fa-arrow-down text-muted opacity-50"></i>
                  </div>

                  <div class="p-3 bg-white">
                    <div class="row mb-3">
                      <label class="field col-md-6">
                        <span class="lbl">Bank Transfer</span>
                        <div class="input-wrapper has-v-select">
                          <span class="input-icon"><i class="fa fa-bank"></i></span>
                          <v-select ref="paymentMethodRef" v-model="paymentMethodSelection" class="v-select-field" 
                            :options="paymentModeOptions"
                            label="label" 
                            :reduce="(option: any) => option"
                            :clearable="false"
                            :append-to-body="true"
                            placeholder="Select payment method...">
                          </v-select>
                        </div>
                      </label>

                      <label class="field col-md-6">
                        <span class="lbl">Source Account</span>
                        <div class="input-wrapper has-v-select">
                          <span class="input-icon"><i class="fa fa-credit-card"></i></span>
                          <v-select ref="sourceAccountSelect" v-model="sourceSelection"
                            class="v-select-field v-select-grouped" :options="sourceOptions"
                            label="label" :reduce="(option: any) => option" :clearable="true"
                            :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                            placeholder="Select source account..."
                            :append-to-body="true"
                            :filterable="true">
                            <template #option="option">
                              <div :class="{ 
                                'source-header': option.isHeader || option.isParentHeader, 
                                'source-option': !option.isHeader && !option.isParentHeader,
                                'ps-3': option.isChild 
                              }">
                                {{ option.label }}
                              </div>
                            </template>
                          </v-select>
                        </div>
                      </label>
                    </div>

                  </div>
                </div>
                <div class="text-center my-1 position-relative"
                  style="z-index: 2; margin-top: -12px !important; margin-bottom: -12px !important;">
                  <div
                    class="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm border"
                    style="width: 32px; height: 32px;">
                    <i class="fa fa-angle-double-down text-primary"></i>
                  </div>
                </div>

                <!-- TO Section -->
                <div class="rounded-3 border mt-0 mb-4">
                  <div class="px-3 py-2 fw-bold" style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    TO <span class="text-muted fw-normal">(Receiving Account)</span>
                  </div>

                  <div class="p-3 bg-white">
                    <div class="row mb-3">
                      <label class="field col-md-6">
                        <span class="lbl">Receiving Account <span class="req">*</span></span>
                        <div class="input-wrapper has-v-select">
                          <span class="input-icon"><i class="fa fa-bank"></i></span>
                          <v-select ref="receivingAccountRef" v-model="receivingAccountSelection" class="v-select-field" 
                            :options="groupedReplenishAccountOptions"
                            label="label" 
                            :reduce="(option: any) => option"
                            :clearable="true"
                            :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                            placeholder="Select receiving account..."
                            :append-to-body="true"
                            :filterable="true">
                            <template #option="option">
                              <div :class="{ 
                                'source-header': option.isParentHeader, 
                                'source-option': !option.isHeader,
                                'ps-3': option.isChild 
                              }">
                                {{ option.label }}
                              </div>
                            </template>
                          </v-select>
                        </div>
                      </label>


                      <label class="field col-md-6">
                        <span class="lbl">Custodian / Holder <span class="req">*</span></span>
                        <div class="input-wrapper has-v-select">
                          <span class="input-icon"><i class="fa fa-user"></i></span>
                          <v-select ref="custodianRef" v-model="custodianSelection" class="v-select-field" :options="usersOptions"
                            :reduce="(option: any) => option"
                            :get-option-label="getUserDisplayName"
                            :clearable="false"
                            :append-to-body="true"
                            :filterable="true"
                            placeholder="Select custodian...">
                          </v-select>
                        </div>
                      </label>
                    </div>

                    <label class="field">
                      <span class="lbl">Description</span>
                      <div class="input-wrapper textarea-wrapper">
                        <span class="input-icon"><i class="fa fa-align-left"></i></span>
                        <textarea v-model="form.source.description" rows="3"
                          placeholder="Notes about this fund transfer..."></textarea>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- ATTACHMENTS TAB -->
          <div v-if="activeFormTab === 'attachments'" class="tab-content">
            <div class="form p-4">
              <div class="form-section">
                <h4 class="section-title mb-3">Attachments</h4>

                <div class="attachments-card">
                  <div class="attachments-header">
                    <div class="attachments-title d-flex align-items-center gap-2">
                      <i class="fa fa-paperclip"></i>
                      <span>Link Attachment To:</span>
                      <Multiselect
                        v-model="attachmentType"
                        :options="attachmentTypeOptions"
                        :allow-empty="false" :multiple="false"
                        :searchable="false"
                        class="type-select"
                        style="min-width: 180px; display: inline-block;"
                      ></Multiselect>
                    </div>
                    <div class="attachments-actions">
                      <button type="button" class="btn btn-sm btn-primary" @click="saveAttachment" :disabled="!selectedAttachmentFile || (attachmentType !== 'General' && !attachmentReference)">Save Attachment</button>
                      <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelAttachment">Cancel</button>
                    </div>
                  </div>

                  <div class="attachments-controls" v-if="attachmentType !== 'General'">
                    <label class="field compact-field">
                      <span class="lbl">Select {{ attachmentType }}</span>
                      <div class="input-wrapper has-v-select">
                        <span class="input-icon"><i class="fa fa-bank"></i></span>
                        <Multiselect class="v-select-field" v-model="attachmentReference" :options="attachmentReferenceOptions"
                          label="label" track-by="value" :allow-empty="false" :multiple="false" :custom-label="(opt) => opt.label"
                          :placeholder="'Select ' + attachmentType">
                          <template #option="{ option }">
                            <div :class="{ 'source-header': option.isHeader, 'source-option': !option.isHeader }">
                              {{ option.label }}
                            </div>
                          </template>
                        </Multiselect>
                      </div>
                    </label>
                  </div>
                  <div class="attachments-controls">
                    <label class="field compact-field">
                      <span class="lbl">File</span>
                      <div class="input-wrapper">
                        <input
                          ref="attachmentInputRef"
                          type="file"
                          class="form-control"
                          @change="onAttachmentFileChange"
                        />
                      </div>
                      <small v-if="selectedAttachmentFile" class="text-muted">
                        Selected: {{ selectedAttachmentFile.name }}
                      </small>
                    </label>
                  </div>

                  <div class="attachments-tabs">
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'All' }" @click="currentAttachmentTab = 'All'"><i class="fa fa-list"></i> All</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'General' }" @click="currentAttachmentTab = 'General'"><i class="fa fa-folder-open"></i> General</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'Funding' }" @click="currentAttachmentTab = 'Funding'"><i class="fa fa-credit-card"></i> Funding</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'Cost Center' }" @click="currentAttachmentTab = 'Cost Center'"><i class="fa fa-sitemap"></i> Cost Center</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'Line Item' }" @click="currentAttachmentTab = 'Line Item'"><i class="fa fa-list-alt"></i> Line Item</button>
                  </div>

                  <div class="attachments-table">
                    <div class="attachments-row header">
                      <div>File Name</div>
                      <div>Type</div>
                      <div>Linked To</div>
                      <div>Reference</div>
                      <div>Uploaded By</div>
                      <div>Date</div>
                      <div>Actions</div>
                    </div>
                    <div v-for="(file, index) in filteredAttachments" :key="index" class="attachments-row">
                      <div class="file-name">
                        <i v-if="file.type === 'PDF'" class="fa fa-file-pdf-o"></i>
                        <i v-else-if="file.type === 'Image'" class="fa fa-file-image-o"></i>
                        <i v-else-if="file.type === 'DOCX'" class="fa fa-file-word-o"></i>
                        <i v-else class="fa fa-file-o"></i>
                        {{ file.name }}
                      </div>
                      <div>{{ file.type }}</div>
                      <div><span class="tag" :class="file.linkedTo.toLowerCase().replace(' ', '-')">{{ file.linkedTo }}</span></div>
                      <div>{{ file.reference }}</div>
                      <div>{{ file.uploadedBy }}</div>
                      <div>{{ file.date }}</div>
                        <div class="d-flex gap-1" style="justify-content: flex-end;">
                            <button
                              type="button"
                              class="btn btn-xs btn-outline-primary"
                              :disabled="!file.url"
                              @click="openAttachment(file)"
                            >
                              View
                            </button>
                          <button type="button" class="btn btn-xs btn-outline-danger" @click="deleteAttachment(index)"><i class="fa fa-trash"></i></button>
                      </div>
                    </div>
                    <div v-if="filteredAttachments.length === 0" class="attachments-row">
                        <div class="text-center w-100 text-muted small py-3">No attachments found</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Common Actions Footer -->
          <div class="d-flex justify-content-end gap-2 p-3 bg-white border-top mt-auto">
          <button class="btn btn-outline-secondary d-flex align-items-center gap-2 px-4" type="button"
              @click="saveDraft" :disabled="savingForm">
              <i class="fa fa-bars"></i> Save Draft
            </button>
            <button class="btn btn-primary d-flex align-items-center gap-2 px-4" type="button"
              @click="submitForApproval" :disabled="!canSubmitForApproval" :title="submitDisabledReason">
              <i class="fa fa-check"></i> Submit for Approval
            </button>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Modern Design System Variables */
:root {
  --bg: #f5f7fa;
  --bg-secondary: #e8ecf0;
  --card: #ffffff;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --muted: #94a3b8;
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #059669;
  --success-light: #d1fae5;
  --warning: #d97706;
  --danger: #dc2626;
  --purple: #7c3aed;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius: 12px;
  --radius-lg: 16px;
}

.ps-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

/* Content */
.content {
  padding: 14px 16px 20px;
  max-width: 1800px;
  margin: 0 auto;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.page-head-left {
  flex: 1;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-weight: 600;
}

.crumbs span {
  font-weight: 700;
  color: var(--primary);
}

.crumb-icon {
  font-size: 14px;
}

h1 {
  margin: 6px 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 12px;
  padding: 10px 16px;
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 30px;
  transition: all 0.3s ease;
}

.step.completed {
  background: var(--primary-light);
}

.step.completed .step-number {
  background: var(--primary);
  color: white;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.step.completed .step-label {
  color: var(--primary);
}

.step-connector {
  width: 60px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 8px;
  transition: all 0.3s ease;
}

.step-connector.active {
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  align-items: start;
}

/* Panel Base Styles */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.left-panel .panel-icon {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.center-panel .panel-icon {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.right-panel .panel-icon {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

/* Hide the standalone Dimensions panel on small screens to avoid duplicate/stacked view under the left panel */
@media (max-width: 1000px) {
  .dimensions-panel {
    display: none !important;
  }
}

.panel-title-text h3 {
  font-weight: 700;
  color: #0f172a;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

.center-panel {
  min-height: 600px;
}

/* Buttons - All Blue Theme */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--primary);
  background: var(--card);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  color: var(--primary);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
}

.btn.primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.btn-primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.primary:hover:not(:disabled) {
  background: #1e40af;
}

.btn.secondary {
  background: #dbeafe;
  border-color: #2563eb;
  color: #1e40af;
}

.btn.secondary:hover:not(:disabled) {
  background: #bfdbfe;
}

.btn.ghost {
  background: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.btn.ghost:hover:not(:disabled) {
  background: #eff6ff;
}

.btn.success {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
}

.btn.success:hover:not(:disabled) {
  background: #1e40af;
}

.btn.full {
  width: 100%;
}

.btn-add {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  padding: 8px 14px;
  font-weight: 600;
}

.btn-add:hover:not(:disabled) {
  background: #1e40af;
}

/* Left Panel Form */
.form {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbfc;
}

.form.p-4 {
  padding: 14px !important;
}

.form-section {
  background: #ffffff;
  border-radius: var(--radius);
  padding: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field:last-child {
  margin-bottom: 0;
}

.lbl {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
}

.field-help {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.3;
  padding-left: 24px;
  position: relative;
}

.field-help::before {
  content: "\f05a";
  font-family: "FontAwesome";
  position: absolute;
  left: 0;
  top: 1px;
  font-size: 12px;
  color: #9aa4b2;
}

.req {
  color: var(--danger);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 10px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  padding: 8px 12px;
  padding-left: 32px;
  font-size: 13px;
  background: #f8faff;
  color: #0b1220;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.input-wrapper input[type="date"] {
  padding-left: 32px;
}

.input-wrapper.textarea-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.input-wrapper.textarea-wrapper .input-icon {
  position: absolute;
  left: 12px;
  top: 12px;
}

.input-wrapper.textarea-wrapper textarea {
  width: 100%;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  padding: 10px 14px;
  padding-left: 38px;
  font-size: 13px;
  background: #f8faff;
  color: #0b1220;
  transition: all 0.2s ease;
  outline: none;
  resize: vertical;
  font-family: inherit;
}

.input-wrapper.textarea-wrapper textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.date-row {
  display: grid;
  /* Stack fields vertically so each control occupies its own row */
  grid-template-columns: 1fr;
  gap: 12px;
}

.date-row .field {
  min-width: 100%;
  /* restore normal field spacing inside the date-row */
  margin-bottom: 14px;
}

.date-picker-lg :deep(.dp__input) {
  /* Match the select sizing so the date input aligns with Fund Direction */
  height: 38px;
  font-size: 13px;
  padding: 8px 12px;
  padding-left: 32px;
}

.date-picker-lg :deep(.dp__input_icon) {
  display: none;
}

.date-picker-lg :deep(.dp__input_icon_pad) {
  padding-left: 32px;
}

/* Allow date picker popover to float above and outside the left panel */
.left-panel {
  overflow: visible !important;
}

/* Styles for the Vueform/flatpickr calendar to render as a floating card */
.vueform-date-wrapper :deep(.flatpickr-calendar) {
  position: absolute !important;
  z-index: 9999 !important;
  min-width: 260px !important;
  max-width: 360px !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12) !important;
  border-radius: 12px !important;
}

/* Keep inner containers sized appropriately */
.vueform-date-wrapper :deep(.flatpickr-innerContainer),
.vueform-date-wrapper :deep(.flatpickr-rContainer),
.vueform-date-wrapper :deep(.dayContainer) {
  width: auto !important;
  min-width: 260px !important;
  max-width: 360px !important;
}


.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Funding Source Styles */
.funds-subsection {
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.direct-payment-card {
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachments-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.attachments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #edf2f7;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  gap: 12px;
  flex-wrap: wrap;
}

.attachments-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #0b1220;
  font-size: 13px;
}

.attachments-title .pill {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}

.attachments-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.attachments-controls {
  padding: 8px 16px 0;
}

.attachments-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 16px 0;
  flex-wrap: wrap;
  border-bottom: 1px solid #eef2f7;
}

.attachments-tabs .tab {
  padding: 7px 12px;
  border-radius: 8px 8px 0 0;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  box-shadow: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.attachments-tabs .tab:hover {
  background: #f1f5f9;
  color: #1e40af;
}

.attachments-tabs .tab.active {
  background: transparent;
  border-bottom: 2px solid #2563eb;
  color: #1e40af;
  box-shadow: none;
}

.attachments-table {
  padding: 0 16px 12px;
  display: grid;
  gap: 6px;
}

.attachments-row {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 0.9fr 1.2fr 0.8fr 0.6fr 0.6fr;
  gap: 12px;
  align-items: center;
  padding: 9px 12px;
  border: 1px solid #f0f4f8;
  border-radius: 8px;
  background: #ffffff;
  font-size: 12px;
  color: #0b1220;
  transition: all 0.15s ease;
}

.attachments-row:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.attachments-row.header {
  background: transparent;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 11px;
  color: #64748b;
  border: none;
  padding: 8px 12px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 4px;
}

.attachments-row .file-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #0f172a;
}

.attachments-row .file-name i {
  color: #2563eb;
  font-size: 13px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.tag.funding {
  background: #dbeafe;
  color: #1e40af;
}

.tag.line-item {
  background: #f3e8ff;
  color: #7c3aed;
}

.tag.cost-center {
  background: #dcfce7;
  color: #166534;
}

.tag.general {
  background: #e2e8f0;
  color: #475569;
}

@media (max-width: 1200px) {
  .attachments-row {
    grid-template-columns: 1fr 0.5fr 0.8fr 1fr 0.6fr 0.6fr 0.6fr;
  }
}

@media (max-width: 992px) {
  .attachments-row {
    grid-template-columns: 1.4fr 0.7fr 0.9fr 1fr;
    grid-auto-rows: minmax(22px, auto);
  }

  .attachments-row> :nth-child(n+5) {
    display: none;
  }
}

.subsection-label {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  margin-bottom: 12px;
}

.subsection-label .text-muted {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--border);
  border-radius: 26px;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: var(--shadow-sm);
}

.switch input:checked+.slider {
  background: #2563eb;
}

.switch input:checked+.slider:before {
  transform: translateX(22px);
}

/* Inner Cards */
.inner-card {
  margin: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tabs-float {
  padding: 4px 0;
}

.toolbar-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #ffffff;
}

.table-card {
  padding: 0;
  min-height: 500px;
  max-height: 600px;
  overflow-y: auto;
  background: #ffffff;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s ease;
}

.tab:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
  line-height: 1;
}

.tab-text {
  font-weight: 600;
}

.tab-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Package Selection Card */
.package-selection-card {
  background: #ffffff;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.package-selection-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.selection-icon {
  font-size: 24px;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
  line-height: 1;
}

.package-selection-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.selection-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.package-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.package-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
}

.package-btn:hover {
  background: #f0f9ff;
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.package-btn .pkg-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
}

.package-btn .pkg-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.package-btn .pkg-code {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
}

.package-btn .pkg-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.package-btn .add-icon {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
}

/* Rate Table Styles */
.table-header {
  padding: 10px 14px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-responsive {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.rates-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.rates-table thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.rates-table thead th {
  padding: 8px 10px;
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-secondary);
  border-bottom: 2px solid #e2e8f0;
}

.rates-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}

.rates-table tbody tr:hover {
  background: #f8fafc;
}

.rates-table tbody td {
  padding: 8px 10px;
  vertical-align: middle;
}

.name-cell {
  min-height: 38px;
  display: flex;
  align-items: center;
}

.name-display {
  padding: 6px 0;
}

.name-text {
  font-weight: 600;
  color: var(--text);
}

.amount-input-group {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.amount-input-group .input-group-text {
  background: #f8fafc;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.amount-input-group input {
  border: none;
  flex: 1;
  padding: 6px 10px;
  font-size: 14px;
}

.amount-input-group input:focus {
  outline: none;
  box-shadow: none;
}

/* Hide any per-row formatted amount display (we keep only the editable Amount input per line). Footer totals remain visible */
.rates-table tbody td.text-end.fw-semibold {
  display: none;
}

.custom-name-toggle input[type="checkbox"] {
  display: none;
}

.custom-name-toggle .toggle-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 16px;
  transition: all 0.2s ease;
}

.custom-name-toggle input:checked+.toggle-indicator {
  background: #dbeafe;
  color: #2563eb;
}

.custom-name-toggle:hover .toggle-indicator {
  background: #e2e8f0;
}

/* Search Row */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.search-row:focus-within {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px #dbeafe;
}

.search-icon {
  font-size: 16px;
  color: var(--text-secondary);
}

.search-row input {
  border: 0;
  padding: 4px;
  background: transparent;
  flex: 1;
  font-size: 13px;
  outline: none;
}

.clear-search {
  background: var(--border);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: var(--danger);
  color: white;
}

/* Rate Lines Header */
.rate-lines-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.lines-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-lines-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.line-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #93c5fd;
}

.count-number {
  font-weight: 800;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
}

.data-table th.col-item {
  width: 35%;
}

.data-table th.col-type {
  width: 15%;
}

.data-table th.col-hunting {
  width: 20%;
}

.data-table th.col-days {
  width: 15%;
  text-align: center;
}

.data-table th.col-action {
  width: 50px;
}

.data-table tbody tr {
  transition: all 0.15s ease;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: var(--border-light);
}

.data-table tbody tr.selected {
  background: #dbeafe;
  border-left: 4px solid #2563eb;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-light);
  vertical-align: middle;
}

.data-table .item-col .item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.data-table .item-col .code {
  font-weight: 700;
  color: var(--text);
  font-size: 13px;
}

.data-table .item-col .name {
  color: var(--text-secondary);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* Type Badges */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-radius: 6px;
  text-align: center;
}

.type-badge.type-package {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.type-badge.type-trophy {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.type-badge.type-extra {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.type-badge.type-companion {
  background: #f3e8ff;
  color: #6b21a8;
  border: 1px solid #d8b4fe;
}

.type-badge.type-adjustment {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.detail-display {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.action-col {
  text-align: center;
}

.remove-btn {
  width: 30px;
  height: 30px;
  border: 2px solid #fecaca;
  background: #ffffff;
  border-radius: 8px;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #fef2f2;
  border-color: #dc2626;
  transform: scale(1.05);
}

/* Empty State */
.empty-state {
  padding: 48px 24px;
  text-align: center;
  background: #fafbfc;
}

.empty-illustration {
  position: relative;
  margin-bottom: 20px;
}

.empty-icon {
  font-size: 56px;
  opacity: 0.8;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* Details Card */
.details-card {
  padding: 0;
  border: 2px solid #2563eb;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.details-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 700;
  font-size: 14px;
  background: #eff6ff;
  color: #1e40af;
}

.details-icon {
  font-size: 14px;
}

.details-form {
  padding: 18px;
  background: #ffffff;
}

.edit-section {
  display: grid;
  gap: 16px;
}

/* Amount Field */
.amount-field .currency-hint {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 11px;
}

.amount-wrapper {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 12px;
  font-weight: 700;
  color: var(--primary);
  font-size: 12px;
}

.amount-input {
  padding-left: 50px !important;
  font-weight: 700;
  font-size: 16px !important;
  background: #f8fafc;
}

/* Package Builder Section */
.package-builder-section {
  background: #ffffff;
  border: 2px solid #2563eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.15);
}

.package-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.package-icon {
  font-size: 18px;
}

.package-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.sales-packages-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sales-packages-label .lbl {
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 600;
}

.field-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

.sales-packages-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.package-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
}

.package-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.lbl {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
}

.req {
  color: var(--danger);
}

.field-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  font-style: italic;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Amount Field Styling */
.amount-wrapper {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  color: #2563eb;
  font-size: 16px;
  z-index: 2;
}

.amount-input {
  padding-left: 50px !important;
  font-weight: 700;
  font-size: 18px !important;
  background: #f8fafc;
  border: 2px solid #2563eb !important;
}

.amount-input:focus {
  background: #ffffff;
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px #dbeafe !important;
}

.field-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: block;
}

.add-package-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  background: #2563eb;
  color: white;
  border: 2px solid #1e40af;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-package-btn:hover:not(:disabled) {
  background: #1e40af;
  transform: scale(1.05);
}

.add-package-btn:disabled {
  background: #cbd5e1;
  border-color: #94a3b8;
  cursor: not-allowed;
}

.selected-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.package-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dbeafe;
  border: 2px solid #3b82f6;
  color: #1e40af;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.package-tag-icon {
  font-size: 12px;
}

.remove-pkg-btn {
  background: none;
  border: none;
  color: #1e40af;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  transition: color 0.2s;
}

.remove-pkg-btn:hover {
  color: #dc2626;
}

.no-packages-hint {
  margin-top: 14px;
  padding: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed var(--border);
  text-align: center;
}

/* Right Panel - Preview */
.preview-content {
  padding: 20px;
  background: #fafbfc;
}

.preview-item-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.preview-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #dbeafe;
  border: 2px solid #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.preview-item-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
  word-break: break-word;
}

.preview-code {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.status-badge.inactive {
  background: #f1f5f9;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.preview-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #dbeafe;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.preview-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.preview-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.unit-badge {
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
  border: 1px solid var(--border);
}

.pricing-section {
  background: #eff6ff;
  border: 2px solid #2563eb;
}

.pricing-section .preview-section-title {
  color: #1e40af;
  border-bottom-color: #bfdbfe;
}

.preview-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px solid #bfdbfe;
}

.price-currency {
  font-size: 16px;
  font-weight: 700;
  color: #2563eb;
}

.price-amount {
  font-size: 32px;
  font-weight: 800;
  color: #1e40af;
  letter-spacing: -1px;
}

/* Empty Preview */
.empty-preview {
  padding: 60px 24px;
  text-align: center;
  background: #fafbfc;
}

.empty-preview-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-preview-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.empty-preview-hint {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 200px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Bottom Actions */
.bottom-actions {
  border-top: 2px solid #e2e8f0;
  padding: 12px 16px;
  display: grid;
  gap: 8px;
  background: #ffffff;
}

/* Text Utilities */
.text-danger {
  color: var(--danger);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

/* Source Select */
.source-new {
  background-color: #f0fdf4 !important;
  border-color: var(--success) !important;
  color: #15803d !important;
}

/* Responsive */
@media (max-width: 1400px) {
  .grid {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 280px 1fr;
    gap: 16px;
  }

  .progress-steps {
    display: none;
  }
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .center-panel {
    order: -1;
  }

  .content {
    padding: 16px;
  }

}

/* Requisition Item Cards */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.requisition-item-card {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.requisition-item-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.requisition-item-card.card-collapsed {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.requisition-item-card.card-collapsed:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.item-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-header-clickable {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.item-header-clickable:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.item-header-clickable.item-header-compact:hover {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
}

.item-header-compact {
  padding: 8px 16px;
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.item-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.item-number {
  font-size: 14px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 10px;
  border-radius: 6px;
}

.item-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.item-total-badge {
  font-size: 15px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 12px;
  border-radius: 6px;
}

.item-body {
  padding: 12px;
}

/* Compact Form Styles */
.form-section.compact {
  padding: 12px;
  margin-bottom: 8px;
}

.section-title.compact-title {
  font-size: 11px;
  margin-bottom: 10px;
  padding-bottom: 8px;
}

.field.compact-field {
  margin-bottom: 8px;
}

.field.compact-field .lbl {
  font-size: 11px;
  margin-bottom: 3px;
}

.field.compact-field .field-hint {
  font-size: 10px;
  margin-top: 2px;
}

.field.compact-field .input-wrapper input,
.field.compact-field .input-wrapper select {
  font-size: 13px;
  padding: 6px 10px;
  padding-left: 32px;
}

.field.compact-field .input-icon {
  font-size: 12px;
  left: 10px;
}

.items-header {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.items-header > :last-child {
  margin-left: auto;
}


.gross-cost-card {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e6ea;
  background: #f8f9fa;
}

.gross-cost-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6c757d;
  font-weight: 600;
}

.gross-cost-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2830;
}

.tab-content {
  background: #f3f5fb;
  padding: 14px;
  padding-top: 8px;
  border-radius: 0 0 12px 12px;
  border: 1px solid #e6edf5;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
}

.item-card {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.item-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.item-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.item-total {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}

.item-body {
  padding: 14px;
}

.item-meta-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.item-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-section {
  margin-bottom: 0;
}

.item-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

/* Collapsible Section Styles */
.collapsible-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.collapsible-section:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0;
  transition: all 0.2s ease;
}

.collapsible-header:hover {
  background: #f1f5f9;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 16px;
  color: #64748b;
}

.section-title-text {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 11px;
  font-size: 11px;
  font-weight: 700;
}

.btn-add-section {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-section:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.section-content {
  padding: 16px;
  background: #ffffff;
}

.section-table-wrapper {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.collapsible-section.expanded {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.15);
}

.collapsible-section.expanded .collapsible-header {
  background: #eff6ff;
  border-bottom-color: #bfdbfe;
}

.section-empty {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 6px;
}

.section-table {
  width: 100%;
  border-collapse: collapse;
}

.section-table th,
.compact-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
}

.section-empty {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 6px;
}

.section-table td,
.compact-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-table tbody tr:hover,
.compact-table tbody tr:hover {
  background: #f8fafc;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
}

.section-table tbody tr:hover,
.compact-table tbody tr:hover {
  background: #f8fafc;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
}

.action-cell {
  width: 60px;
  text-align: center;
}

.remove-btn {
  color: #ef4444;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.requisition-item-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.requisition-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.item-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
}

.item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.item-total-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.item-body {
  padding: 14px;
}

.item-meta {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.field-sm {
  margin-bottom: 0;
}

.field-sm .lbl {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
}

.item-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

.section-table {
  overflow-x: auto;
}

.compact-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.compact-table thead {
  background: #f1f5f9;
}

.compact-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  font-size: 11px;
  text-transform: uppercase;
}

.compact-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.compact-table tbody tr:hover {
  background: #f8fafc;
}

.compact-table .form-select,
.compact-table .form-control {
  font-size: 13px;
  padding: 4px 8px;
}

.section-empty {
  padding: 14px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.empty-state-large {
  padding: 48px 16px;
  text-align: center;
  background: white;
  border-radius: 12px;
}

.empty-state-large .empty-icon {
  color: #cbd5e1;
  margin-bottom: 12px;
}

.empty-state-large h3 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.empty-state-large p {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
}

/* Cost Center Cards */
.cost-centers-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cost-center-card {
  background: #f7fafc;
  border: 1px solid #e5edf5;
  border-radius: 14px;
  overflow: visible;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.cost-center-header {
  background: linear-gradient(180deg, #edf8f2 0%, #edf8f2 100%);
  color: #0b1220;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid #dfe7ef;
}

.cost-center-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.cc-toggle {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
  font-size: 10px;
  transition: transform 0.2s ease;
  border: 1px solid #dfe7ef;
}

.cc-toggle.collapsed {
  transform: rotate(-90deg);
}

.cc-number {
  font-size: 14px;
  font-weight: 800;
  background: #ffffff;
  padding: 3px 8px;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid #e3edf6;
}

.cost-center-select {
  flex: 1;
  max-width: 400px;
  font-weight: 600;
}

.v-select-field,
.v-select-sm {
  width: 100%;
}

.v-select-field {
  position: relative;
}

/* Fix icon overlap for v-select/multiselect in input-wrapper */
.input-wrapper.has-v-select {
  position: relative;
}

.input-wrapper.has-v-select .input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  pointer-events: none;
  z-index: 10;
  color: #64748b;
}

.input-wrapper.has-v-select .v-select-field {
  width: 100%;
}

/* Multiselect spacing for icon */
.input-wrapper.has-v-select .multiselect :deep(.multiselect__tags) {
  padding-left: 36px;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  min-height: 38px;
  background: #f8faff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  font-size: 12px;
}

.input-wrapper.has-v-select .multiselect :deep(.multiselect__input) {
  padding-left: 0;
  font-size: 11px;
}

.input-wrapper.has-v-select .multiselect :deep(.multiselect__placeholder) {
  padding-left: 0;
  margin-bottom: 0;
  font-size: 11px;
  color: #94a3b8;
}

.input-wrapper.has-v-select .multiselect :deep(.multiselect__single) {
  padding-left: 0;
  margin-bottom: 0;
  font-size: 11px;
}

/* Vue-select spacing for icon */
.input-wrapper.has-v-select :deep(.vs__dropdown-toggle) {
  padding-left: 36px;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  min-height: 38px;
  background: #f8faff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.input-wrapper.has-v-select :deep(.vs__search) {
  padding-left: 0;
  font-size: 11px;
  margin: 0;
}

.input-wrapper.has-v-select :deep(.vs__selected) {
  padding-left: 0;
  margin: 4px 2px 0 0;
  font-size: 11px;
  color: #0f172a !important;
}

.input-wrapper.has-v-select :deep(.vs__actions) {
  padding-right: 4px;
}

.input-wrapper.has-v-select :deep(.vs__clear) {
  margin-right: 0;
}

.input-wrapper.has-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #dbe5f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: #fff;
  max-height: 300px;
}

.input-wrapper.has-v-select :deep(.vs__dropdown-option) {
  padding: 6px 12px;
  font-size: 11px;
  white-space: normal;
  word-wrap: break-word;
}

.input-wrapper.has-v-select :deep(.vs__dropdown-option--highlight) {
  background: #2563eb;
  color: #fff;
}

.input-wrapper.has-v-select :deep(.vs__dropdown-option--selected) {
  background: #e0e7ff;
  color: #1e40af;
  font-weight: 600;
}

.input-wrapper.has-v-select :deep(.vs__dropdown-option--disabled) {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Ensure vue-select dropdown renders above everything */
.input-wrapper.has-v-select :deep(.vs__dropdown-menu) {
  z-index: 9999 !important;
  position: absolute;
}

/* Vue-select wrapper positioning */
.v-select-field {
  position: relative;
}

.v-select-field :deep(.vs__dropdown-toggle) {
  position: relative;
}

/* Ensure dropdown renders above surrounding cards and is scrollable */
.multiselect__content {
  z-index: 2200 !important;
  max-height: 320px;
  overflow: auto;
}

/* Global multiselect dropdown styles when appended to body */
.multiselect__content-wrapper {
  z-index: 9999 !important;
  max-height: 300px !important;
  border: 1px solid #dbe5f0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
  background: #fff !important;
}

.multiselect__option {
  font-size: 10px !important;
  padding: 4px 8px !important;
  min-height: 24px !important;
  line-height: 1.3 !important;
}

.multiselect__option--highlight {
  background: #2563eb !important;
  color: #fff !important;
}

.multiselect__option--selected {
  background: #e0e7ff !important;
  color: #1e40af !important;
  font-weight: 600 !important;
}

.multiselect__option--disabled {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 600 !important;
  font-size: 9px !important;
  pointer-events: none !important;
}

/* Source and option labels inside dropdown */
.source-header {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  padding: 4px 8px;
  text-transform: uppercase;
  background: #f1f5f9;
  cursor: not-allowed;
  border-top: 1px solid #e2e8f0;
  margin-top: 2px;
  pointer-events: none;
}

/* Vue-multiselect disabled option styling */
.v-select-field :deep(.multiselect__option--disabled),
.v-select-grouped :deep(.multiselect__option--disabled) {
  background: #f1f5f9 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
}

.source-header:first-child {
  margin-top: 0;
  border-top: none;
}

.source-option {
  font-size: 10px;
  color: #0f172a;
  padding: 4px 8px;
}

.source-option.ps-3 {
  padding-left: 16px !important;
}

/* Cost Center Dropdown Styles */
.cost-center-header {
  font-size: 9px;
  font-weight: 700;
  color: #059669;
  padding: 4px 8px;
  text-transform: uppercase;
  background: #f0fdf4;
  cursor: default;
}

.cost-center-option {
  font-size: 10px;
  color: #0f172a;
  padding: 4px 8px;
}

/* Item/Account Dropdown Styles */
.item-header {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  padding: 4px 8px;
  text-transform: uppercase;
  background: #f1f5f9;
  cursor: default;
  border-top: 1px solid #e2e8f0;
  margin-top: 2px;
}

.item-header:first-child {
  margin-top: 0;
  border-top: none;
}

.item-option {
  font-size: 10px;
  color: #0f172a;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.item-option.ps-3 {
  padding-left: 16px !important;
}

.item-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-code {
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Ensure parent containers don't clip dropdown */
.form-section {
  overflow: visible !important;
}

.form.p-4 {
  overflow: visible !important;
}

.tab-content {
  overflow: visible !important;
}

.input-wrapper.has-v-select {
  overflow: visible;
}

.cost-center-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}

.cc-total {
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
  padding: 4px 10px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e3edf6;
}

.cost-center-items {
  padding: 10px 12px 14px;
  background: #f7fafc;
  border-top: 0;
  overflow: visible;
}

/* Items Table */
.items-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  overflow: visible;
  border: 1px solid #e3edf6;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.items-table thead {
  background: #f3f6fa;
  border-bottom: 1px solid #e3edf6;
}

.items-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 700;
  font-size: 11px;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.items-table tbody tr {
  border-bottom: 1px solid #eef3f8;
  transition: background 0.15s ease;
}

.items-table tbody tr:hover {
  background: #f8fafc;
}

.items-table tbody tr:last-child {
  border-bottom: none;
}

.items-table td {
  padding: 8px 12px;
  vertical-align: middle;
}

.items-table td strong {
  color: #0b1220;
  font-size: 13px;
}

.cost-center-summary-wrap {
  display: block;
  margin-top: 0;
  padding: 0;
  background: transparent;
}

.cost-center-summary {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.cost-center-summary .summary-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  font-size: 13px;
  padding: 10px 16px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.cost-center-summary .summary-row span:first-child {
  color: #64748b;
  font-weight: 500;
  text-align: right;
  padding-right: 40px;
}

.cost-center-summary .summary-row span:last-child {
  color: #0f172a;
  font-weight: 600;
  font-size: 13px;
  text-align: right;
  min-width: 140px;
}

.cost-center-summary .summary-row.grand {
  border-top: 2px solid #e2e8f0;
  background: #fafbfc;
  padding: 12px 16px;
}

.cost-center-summary .summary-row.grand span:first-child {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.cost-center-summary .summary-row.grand span:last-child {
  color: #0f172a;
  font-weight: 800;
  font-size: 16px;
}

.items-table .form-control-sm {
  font-size: 13px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.items-table .form-control-sm:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.empty-items-state {
  padding: 16px;
  text-align: center;
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
}
</style>

<style>
/* Global styles for vue-select dropdowns when appended to body */
.v-select.v-select-field .vs__dropdown-menu {
  z-index: 9999 !important;
  border: 1px solid #dbe5f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: #fff;
  max-height: 300px;
}

.v-select.v-select-field .vs__dropdown-option {
  padding: 6px 12px;
  font-size: 11px;
  white-space: normal;
  word-wrap: break-word;
  color: #0f172a;
  background: #fff;
}

.v-select.v-select-field .vs__dropdown-option--highlight {
  background: #2563eb !important;
  color: #fff !important;
}

.v-select.v-select-field .vs__dropdown-option--selected {
  background: #e0e7ff;
  color: #1e40af;
  font-weight: 600;
}

.v-select.v-select-field .vs__dropdown-option--disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
