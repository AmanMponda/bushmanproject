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
    ; (accounts.value || []).forEach(flatten)
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
    ; (sourceAccounts.value || []).forEach(flatten)
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
      ; (cc.items || []).forEach((item: any, itemIndex: number) => {
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
  <div class="form-page">
    <main class="form-page-content">
      <!-- Page Title Row -->
      <div class="form-page-head">
        <div class="form-page-head-left">
          <div class="form-page-crumbs">
            <span class="crumb-icon"><i class="fa fa-file-text"></i></span>
            REQUISITION / <span>REQUISITIONS FORM</span>
          </div>
          <h1 class="form-page-title">{{ isEditMode ? 'Edit Requisition' : 'Create Requisition' }}</h1>
          <p class="form-page-subtitle">Fill in the requisition details and add line items for materials or expenses.
          </p>
        </div>

        <div class="form-page-actions">
          <button class="form-btn ghost" type="button" @click="emit('cancel')">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="form-btn ghost" type="button" @click="emit('reset')">
            <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
          </button>
          <button class="form-btn secondary" type="button" @click="saveDraft" :disabled="savingForm">
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
      <section class="form-grid">
        <!-- LEFT: Requisition Details Form -->
        <aside class="form-panel form-left-panel">


          <div class="form-body">
            <!-- Identification Section -->
            <div class="form-section">
              <div class="form-section-title">
                <span class="form-section-icon"><i class="fa fa-tag"></i></span>
                Identification
              </div>

              <label class="form-field">
                <span class="form-label">Type <span class="form-required">*</span></span>
                <div class="form-input-wrapper">
                  <span class="form-input-icon"><i class="fa fa-list"></i></span>
                  <select v-model="form.requisitionTypeId">
                    <option :value="null">Select type...</option>
                    <option v-for="type in requisitionTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                  </select>
                </div>
              </label>

              <div class="form-date-row">
                <label class="form-field">
                  <span class="form-label">Fund Direction <span class="form-required">*</span></span>
                  <div class="form-input-wrapper">
                    <span class="form-input-icon"><i class="fa fa-exchange"></i></span>
                    <select v-model="form.fundDirection">
                      <option :value="null">Select...</option>
                      <option value="DIRECT_PAYMENT">Direct payment</option>
                      <option value="WITHDRAW">Withdraw</option>
                    </select>
                  </div>
                  <small class="form-field-help">
                    This determines whether payment is made directly or via internal fund withdrawal.
                  </small>
                </label>

                <label class="form-field">
                  <span class="form-label">Required Date <span class="form-required">*</span></span>
                  <div class="form-input-wrapper">
                    <span class="form-input-icon"><i class="fa fa-calendar"></i></span>
                    <Datepicker class="form-date-picker-lg" v-model="form.requiredDate" model-type="yyyy-MM-dd" />
                  </div>
                </label>
              </div>

            </div> <!-- Currency & Tax Section -->
            <div class="form-section">
              <div class="form-section-title">
                <span class="form-section-icon"><i class="fa fa-money"></i></span>
                Currency & Tax
              </div>

              <label class="form-field">
                <span class="form-label">Currency <span class="form-required">*</span></span>
                <div class="form-input-wrapper">
                  <span class="form-input-icon"><i class="fa fa-dollar"></i></span>
                  <select v-model="form.currencyId">
                    <option :value="null">Select currency...</option>
                    <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                      {{ currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="form-field">
                <span class="form-label">Tax Method</span>
                <div class="form-input-wrapper">
                  <span class="form-input-icon"><i class="fa fa-percent"></i></span>
                  <select v-model="form.taxMethod">
                    <option :value="null">Select tax method</option>
                    <option value="EXCLUSIVE">Exclusive</option>
                    <option value="INCLUSIVE">Inclusive</option>
                    <option value="EXEMPT">Exempt</option>
                  </select>
                </div>
              </label>

              <div class="discount-row" v-if="form.discountMethod">
                <label class="form-field">
                  <span class="form-label">Discount</span>
                  <div class="form-input-wrapper">
                    <span class="form-input-icon"><i class="fa fa-tag"></i></span>
                    <select v-model="form.discountMethod" class="discount-type">
                      <option :value="null">No discount</option>
                      <option value="PERCENT">Percentage</option>
                      <option value="LS">Lump Sum</option>
                    </select>
                  </div>
                </label>
                <label class="form-field" v-if="form.discountMethod">
                  <span class="form-label">Amount</span>
                  <div class="form-input-wrapper">
                    <span class="form-input-icon"><i class="fa fa-dollar"></i></span>
                    <input type="number" v-model.number="form.discountAmount" min="0" step="0.01" placeholder="0.00" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- CENTER: Requisition Line Items -->
        <section class="form-panel form-center-panel">
          <div class="form-panel-header">
            <div class="form-panel-icon"><i class="fa fa-list-alt"></i></div>
            <div class="form-panel-title-text">
              <h3>Funding and Cost breakdown</h3>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="form-tabs-float">
            <div class="form-tabs">
              <button type="button" class="form-tab" :class="{ active: activeFormTab === 'sources' }"
                @click="activeFormTab = 'sources'">
                <span class="form-tab-icon">💳</span>
                <span class="form-tab-text">Funding</span>
              </button>
              <button type="button" class="form-tab" :class="{ active: activeFormTab === 'items' }"
                @click="activeFormTab = 'items'">
                <span class="form-tab-icon">📦</span>
                <span class="form-tab-text">Cost Breakdown</span>
                <span class="form-tab-count" v-if="totalItemsCount > 0">{{ totalItemsCount }}</span>
              </button>
              <button type="button" class="form-tab" :class="{ active: activeFormTab === 'attachments' }"
                @click="activeFormTab = 'attachments'">
                <span class="form-tab-icon">📎</span>
                <span class="form-tab-text">Attachments</span>
              </button>
            </div>
          </div>

          <!-- ITEMS TAB -->
          <div v-if="activeFormTab === 'items'" class="form-tab-content">
            <div class="form-toolbar">
              <button class="btn btn-sm btn-primary" type="button" @click="addRequisitionCostCenter">
                <i class="fa fa-plus me-1"></i> Add Cost Center
              </button>
            </div>

            <!-- Cost Centers with nested items -->
            <div v-if="form.costCenters && form.costCenters.length > 0" class="form-groups-list">
              <div v-for="(cc, ccIndex) in form.costCenters" :key="cc._key" class="form-group-card"
                :class="{ collapsed: cc._expanded === false }">
                <!-- Cost Center Header -->
                <div class="form-group-header" @click="toggleCostCenter(cc)">
                  <div class="form-group-info">
                    <span class="form-group-toggle" :class="{ collapsed: cc._expanded === false }">
                      <i class="fa fa-chevron-down"></i>
                    </span>
                    <span class="form-group-index">#{{ ccIndex + 1 }}</span>
                    <Multiselect :ref="(el) => { if (el) cc._multiselectRef = el }"
                      :model-value="getCostCenterSelection(cc)"
                      @update:model-value="(val) => setCostCenterSelection(cc, val, cc._multiselectRef)"
                      class="v-select-field v-select-grouped cost-center-select" :options="costCenterOptions"
                      label="label" track-by="value" :allow-empty="true" :append-to-body="true" :multiple="false"
                      :close-on-select="true" :group-select="false" :option-height="28" :max-height="300"
                      :selectable="(option) => !option.isHeader && !option.$isDisabled" :searchable="true"
                      :options-limit="300" placeholder="Search cost center..." @click.stop>
                      <template #option="{ option }">
                        <div
                          :class="{ 'cost-center-header-option': option.isHeader, 'cost-center-option': !option.isHeader }">
                          {{ option.label }}
                        </div>
                      </template>
                    </Multiselect>
                  </div>
                  <div class="form-group-actions">
                    <span class="form-group-total">Total Amount: {{ getCurrencySymbol() }}{{
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
                <div class="form-group-body" v-show="cc._expanded !== false">
                  <div v-if="cc.items && cc.items.length > 0">
                    <table class="form-data-table">
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
                              :options="itemAccountOptions" label="label" track-by="value"
                              :custom-label="(opt) => opt.label" :allow-empty="true" :multiple="false"
                              :close-on-select="true" :group-select="false" :option-height="28" :max-height="300"
                              :selectable="(option) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                              placeholder="Search..."
                              @update:modelValue="(value) => onItemAccountSelect(item, value, item._multiselectRef)">
                              <template #option="{ option }">
                                <div :class="{
                                  'item-header': option.isHeader || option.isParentHeader,
                                  'item-option': !option.isHeader && !option.isParentHeader,
                                  'ps-3': option.isChild
                                }">
                                  <span class="item-name">{{ option && option.name ? option.name : option.label
                                    }}</span>
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
                            <CurrencyInput v-model="item.rate" class="form-control-sm text-end" placeholder="0.00" />
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
                  <div v-else class="form-empty-inline">
                    <span class="text-muted small">No items yet. Click "Add Item" to add items to this cost
                      center.</span>
                  </div>
                </div>
              </div>
              <div class="form-summary-wrap" v-if="form.costCenters && form.costCenters.length > 0">
                <div class="form-summary">
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
            <div v-else class="form-empty-state-large">
              <div class="form-empty-icon"><i class="fa fa-folder-open fa-4x"></i></div>
              <h3>No Cost Centers Yet</h3>
              <p>Add a cost center to start organizing requisition items</p>
              <button class="btn btn-primary" type="button" @click="addRequisitionCostCenter">
                <i class="fa fa-plus me-2"></i> Add First Cost Center
              </button>
            </div>

          </div> <!-- end ITEMS TAB -->

          <!-- SOURCES TAB -->
          <div v-if="activeFormTab === 'sources'" class="form-tab-content">
            <div class="form-inner-card">
              <div class="form-table-header">
                <div class="form-header-info">
                  <h3>Funding Source</h3>
                  <span class="form-badge">Specify the funding source for this requisition</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-body p-4" v-if="activeFormTab === 'sources'">
            <div class="form-section">
              <h4 class="form-section-title mb-3">
                {{ form.fundDirection === 'DIRECT_PAYMENT' ? 'Direct Payment' : 'Withdraw Funds' }}
              </h4>

              <div v-if="form.fundDirection === 'DIRECT_PAYMENT'" class="form-detail-card">
                <label class="form-field">
                  <span class="form-label">Payment Mode</span>
                  <div class="form-input-wrapper has-v-select">
                    <span class="form-input-icon"><i class="fa fa-credit-card"></i></span>
                    <v-select ref="modeOfPaymentRef" v-model="modeOfPaymentSelection" class="v-select-field"
                      :options="paymentModeOptions" label="label" :reduce="(option: any) => option" :clearable="false"
                      :append-to-body="true" placeholder="Select payment mode...">
                    </v-select>
                  </div>
                </label>

                <div class="row">
                  <label class="form-field col-md-6">
                    <span class="form-label">Source</span>
                    <div class="form-input-wrapper has-v-select">
                      <span class="form-input-icon"><i class="fa fa-bank"></i></span>
                      <v-select ref="sourceAccountSelect" v-model="sourceSelection"
                        class="v-select-field v-select-grouped" :options="sourceOptions" label="label"
                        :reduce="(option: any) => option" :clearable="true"
                        :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                        placeholder="Search or select source..." :append-to-body="true" :filterable="true">
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

                  <label class="form-field col-md-6">
                    <span class="form-label">Payee</span>
                    <div class="form-input-wrapper">
                      <span class="form-input-icon"><i class="fa fa-user"></i></span>
                      <input v-model="form.source.payee" type="text" class="form-control" placeholder="Payee name" />
                    </div>
                  </label>
                </div>

                <label class="form-field">
                  <span class="form-label">Description</span>
                  <div class="form-input-wrapper textarea-wrapper">
                    <span class="form-input-icon"><i class="fa fa-align-left"></i></span>
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
                      <label class="form-field col-md-6">
                        <span class="form-label">Bank Transfer</span>
                        <div class="form-input-wrapper has-v-select">
                          <span class="form-input-icon"><i class="fa fa-bank"></i></span>
                          <v-select ref="paymentMethodRef" v-model="paymentMethodSelection" class="v-select-field"
                            :options="paymentModeOptions" label="label" :reduce="(option: any) => option"
                            :clearable="false" :append-to-body="true" placeholder="Select payment method...">
                          </v-select>
                        </div>
                      </label>

                      <label class="form-field col-md-6">
                        <span class="form-label">Source Account</span>
                        <div class="form-input-wrapper has-v-select">
                          <span class="form-input-icon"><i class="fa fa-credit-card"></i></span>
                          <v-select ref="sourceAccountSelect" v-model="sourceSelection"
                            class="v-select-field v-select-grouped" :options="sourceOptions" label="label"
                            :reduce="(option: any) => option" :clearable="true"
                            :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                            placeholder="Select source account..." :append-to-body="true" :filterable="true">
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
                      <label class="form-field col-md-6">
                        <span class="form-label">Receiving Account <span class="form-required">*</span></span>
                        <div class="form-input-wrapper has-v-select">
                          <span class="form-input-icon"><i class="fa fa-bank"></i></span>
                          <v-select ref="receivingAccountRef" v-model="receivingAccountSelection" class="v-select-field"
                            :options="groupedReplenishAccountOptions" label="label" :reduce="(option: any) => option"
                            :clearable="true"
                            :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                            placeholder="Select receiving account..." :append-to-body="true" :filterable="true">
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


                      <label class="form-field col-md-6">
                        <span class="form-label">Custodian / Holder <span class="form-required">*</span></span>
                        <div class="form-input-wrapper has-v-select">
                          <span class="form-input-icon"><i class="fa fa-user"></i></span>
                          <v-select ref="custodianRef" v-model="custodianSelection" class="v-select-field"
                            :options="usersOptions" :reduce="(option: any) => option"
                            :get-option-label="getUserDisplayName" :clearable="false" :append-to-body="true"
                            :filterable="true" placeholder="Select custodian...">
                          </v-select>
                        </div>
                      </label>
                    </div>

                    <label class="form-field">
                      <span class="form-label">Description</span>
                      <div class="form-input-wrapper textarea-wrapper">
                        <span class="form-input-icon"><i class="fa fa-align-left"></i></span>
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
          <div v-if="activeFormTab === 'attachments'" class="form-tab-content">
            <div class="form-body p-4">
              <div class="form-section">
                <h4 class="form-section-title mb-3">Attachments</h4>

                <div class="form-files-card">
                  <div class="form-files-header">
                    <div class="form-files-title d-flex align-items-center gap-2">
                      <i class="fa fa-paperclip"></i>
                      <span>Link Attachment To:</span>
                      <Multiselect v-model="attachmentType" :options="attachmentTypeOptions" :allow-empty="false"
                        :multiple="false" :searchable="false" class="type-select"
                        style="min-width: 180px; display: inline-block;"></Multiselect>
                    </div>
                    <div class="form-files-actions">
                      <button type="button" class="btn btn-sm btn-primary" @click="saveAttachment"
                        :disabled="!selectedAttachmentFile || (attachmentType !== 'General' && !attachmentReference)">Save
                        Attachment</button>
                      <button type="button" class="btn btn-sm btn-outline-secondary"
                        @click="cancelAttachment">Cancel</button>
                    </div>
                  </div>

                  <div class="form-files-controls" v-if="attachmentType !== 'General'">
                    <label class="form-field compact-field">
                      <span class="form-label">Select {{ attachmentType }}</span>
                      <div class="form-input-wrapper has-v-select">
                        <span class="form-input-icon"><i class="fa fa-bank"></i></span>
                        <Multiselect class="v-select-field" v-model="attachmentReference"
                          :options="attachmentReferenceOptions" label="label" track-by="value" :allow-empty="false"
                          :multiple="false" :custom-label="(opt) => opt.label"
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
                  <div class="form-files-controls">
                    <label class="form-field compact-field">
                      <span class="form-label">File</span>
                      <div class="form-input-wrapper">
                        <input ref="attachmentInputRef" type="file" class="form-control"
                          @change="onAttachmentFileChange" />
                      </div>
                      <small v-if="selectedAttachmentFile" class="text-muted">
                        Selected: {{ selectedAttachmentFile.name }}
                      </small>
                    </label>
                  </div>

                  <div class="form-files-tabs">
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'All' }"
                      @click="currentAttachmentTab = 'All'"><i class="fa fa-list"></i> All</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'General' }"
                      @click="currentAttachmentTab = 'General'"><i class="fa fa-folder-open"></i> General</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'Funding' }"
                      @click="currentAttachmentTab = 'Funding'"><i class="fa fa-credit-card"></i> Funding</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'Cost Center' }"
                      @click="currentAttachmentTab = 'Cost Center'"><i class="fa fa-sitemap"></i> Cost Center</button>
                    <button type="button" class="tab" :class="{ active: currentAttachmentTab === 'Line Item' }"
                      @click="currentAttachmentTab = 'Line Item'"><i class="fa fa-list-alt"></i> Line Item</button>
                  </div>

                  <div class="form-files-table">
                    <div class="form-files-row header">
                      <div>File Name</div>
                      <div>Type</div>
                      <div>Linked To</div>
                      <div>Reference</div>
                      <div>Uploaded By</div>
                      <div>Date</div>
                      <div>Actions</div>
                    </div>
                    <div v-for="(file, index) in filteredAttachments" :key="index" class="form-files-row">
                      <div class="file-name">
                        <i v-if="file.type === 'PDF'" class="fa fa-file-pdf-o"></i>
                        <i v-else-if="file.type === 'Image'" class="fa fa-file-image-o"></i>
                        <i v-else-if="file.type === 'DOCX'" class="fa fa-file-word-o"></i>
                        <i v-else class="fa fa-file-o"></i>
                        {{ file.name }}
                      </div>
                      <div>{{ file.type }}</div>
                      <div><span class="form-tag" :class="file.linkedTo.toLowerCase().replace(' ', '-')">{{
                          file.linkedTo
                          }}</span></div>
                      <div>{{ file.reference }}</div>
                      <div>{{ file.uploadedBy }}</div>
                      <div>{{ file.date }}</div>
                      <div class="d-flex gap-1" style="justify-content: flex-end;">
                        <button type="button" class="btn btn-xs btn-outline-primary" :disabled="!file.url"
                          @click="openAttachment(file)">
                          View
                        </button>
                        <button type="button" class="btn btn-xs btn-outline-danger" @click="deleteAttachment(index)"><i
                            class="fa fa-trash"></i></button>
                      </div>
                    </div>
                    <div v-if="filteredAttachments.length === 0" class="form-files-row">
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
/* 
 * RequisitionForm.vue - Scoped Styles
 * 
 * Most styling is now handled by the shared _form-pages.scss file.
 * This scoped section is only for component-specific overrides if needed.
 */

/* Component-specific adjustments (if any) */
</style>