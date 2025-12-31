<template>
  <div class="ps-page">
    <!-- Page Content -->
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div>
          <div class="crumbs">SALES / <span>PRICE STRUCTURES</span></div>
          <h1>{{ editMode ? 'Edit Price Structure' : 'Create Price Structure' }}</h1>
          <p class="subtitle">Rate card for a specific area + season + currency.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="$emit('goBack')">← Back</button>
          <button class="btn ghost" type="button" @click="resetForm">⟲ Reset</button>
          <button class="btn ghost" type="button" @click="saveDraft" :disabled="saving">💾 Save Draft</button>
          <button class="btn primary" type="button" @click="submit" :disabled="saving || !canSubmit">
            💾 Save &amp; Activate
          </button>
        </div>
      </div>

      <!-- 3-column layout -->
      <section class="grid">
        <!-- LEFT: Create Price Structure Form -->
        <aside class="panel">
          <div class="panel-title">{{ editMode ? 'Edit Price Structure' : 'Create Price Structure' }}</div>

          <div class="form">
            <label class="field">
              <span class="lbl">Name <span class="req">*</span></span>
              <input v-model.trim="form.name" />
            </label>

            <label class="field">
              <span class="lbl">Area <span class="req">*</span></span>
              <select v-model="form.areaId" :disabled="loadingAreas">
                <option :value="null" disabled>Select area</option>
                <option v-for="a in lookups.areas" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </label>

            <label class="field">
              <span class="lbl">Season</span>
              <select v-model="form.seasonId" :disabled="loadingSeasons">
                <option :value="null">None</option>
                <option v-for="s in lookups.seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </label>

            <label class="field">
              <span class="lbl">Start Date <span class="req">*</span></span>
              <input v-model="form.startDate" type="date" />
            </label>

            <label class="field">
              <span class="lbl">End Date <span class="req">*</span></span>
              <input v-model="form.endDate" type="date" />
              <small v-if="form.startDate && form.endDate && !hasValidDates" class="text-danger">
                Start date must be before or equal to End date.
              </small>
            </label>

            <label class="field">
              <span class="lbl">Currency <span class="req">*</span></span>
              <select v-model="form.currencyId" :disabled="loadingCurrencies">
                <option :value="null" disabled>Select currency</option>
                <option v-for="c in lookups.currencies" :key="c.id" :value="c.id">{{ c.code }}</option>
              </select>
            </label>

            <div class="toggle-row">
              <span class="lbl">Active</span>
              <label class="switch">
                <input type="checkbox" v-model="form.isActive" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </aside>

        <!-- CENTER: Price Map + Rate Lines -->
        <section class="panel center">
          <div class="panel-title">Price Map</div>

          <!-- Tabs Card -->
          <div class="inner-card tabs-card">
            <div class="tabs">
              <button
                v-for="t in tabs"
                :key="t"
                class="tab"
                :class="{ active: activeTab === t }"
                @click="activeTab = t"
              >
                <span class="tab-icon">{{ tabIcon(t) }}</span>
                {{ t }}
              </button>
            </div>
          </div>

          <!-- Search & Actions Card -->
          <div class="inner-card toolbar-card">
            <div class="search-row">
              <span class="icon">🔎</span>
              <input v-model="search" placeholder="Search item name/code..." />
            </div>
            <div class="rate-lines-head">
              <div class="lines-info">
                <h3>Rate Lines</h3>
                <span class="line-count">{{ filteredLines.length }} items</span>
              </div>
              <button class="btn btn-blue small" type="button" @click="addLine">+ Add line</button>
            </div>
          </div>

          <!-- Table Card -->
          <div class="inner-card table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-item">Item</th>
                  <th class="col-type">Type</th>
                  <th class="col-hunting">Hunting</th>
                  <th class="col-days" v-if="activeTab === 'Packages' || activeTab === 'Companion Hunter'">Hunt Length</th>
                  <th class="col-action"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(line, idx) in filteredLines"
                  :key="line._key"
                  class="data-row"
                  :class="{ selected: selectedLineKey === line._key }"
                  @click="selectLine(line._key)"
                >
                  <td class="item-col">
                    <div class="item-info">
                      <span class="code">{{ getLineCode(line) }}</span>
                      <span class="name">{{ getLineName(line) }}</span>
                    </div>
                  </td>

                  <td>
                    <div class="type-display">{{ line.itemType || '�' }}</div>
                  </td>

                  <td>
                    <div class="detail-display">{{ getHuntingTypeName(line.huntingTypeId) }}</div>
                  </td>

                  <td v-if="activeTab === 'Packages' || activeTab === 'Companion Hunter'">
                    <div class="detail-display">{{ getHuntLengthLabelById(line.minDays) }}</div>
                  </td>

                  <td class="action-col">
                    <button class="remove-btn" type="button" @click.stop="removeLine(line._key)" title="Remove line">
                      <span>✕</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="filteredLines.length === 0" class="empty-state">
              <div class="empty-icon">📋</div>
              <div class="empty-text">No lines found</div>
              <div class="empty-hint">Click "Add line" to create a new rate line</div>
              <button class="btn primary small" type="button" @click="addLine">+ Add line</button>
            </div>
          </div>

          <div class="inner-card details-card">
            <div class="details-head">Line Details</div>
            <div v-if="selectedLine" class="details-form">
              <div class="edit-section">
                <label class="field" v-if="selectedLine.itemType && selectedLine.itemType !== 'PACKAGE' && selectedLine.itemType !== 'COMPANION'">
                  <span class="lbl">Source</span>
                  <select v-model="selectedLine.source" :class="{'source-new': selectedLine.source === 'new'}">
                    <option value="existing">Existing Item</option>
                    <option value="new">New Item (Create New)</option>
                  </select>
                </label>

                <!-- For existing source: show Item selector -->
                <label class="field" v-if="selectedLine.source === 'existing' && selectedLine.itemType !== 'PACKAGE' && selectedLine.itemType !== 'COMPANION'">
                  <span class="lbl">Item <span class="req">*</span></span>
                  <select v-model="selectedLine.itemId" :disabled="!selectedLine.itemType">
                    <option :value="null" disabled>Select item</option>
                    <option v-for="i in itemsForType(selectedLine.itemType)" :key="i.id" :value="i.id">
                      {{ i.code ? `${i.code} - ` : '' }}{{ i.name }}
                    </option>
                  </select>
                </label>

                <!-- For new source: show Item Name input -->
                <label class="field" v-else-if="selectedLine.source === 'new' && selectedLine.itemType !== 'COMPANION'">
                  <span class="lbl">{{ selectedLine.itemType === 'PACKAGE' ? 'Package Name' : 'Item Name' }} <span class="req">*</span></span>
                  <input v-model.trim="selectedLine.name" :placeholder="selectedLine.itemType === 'PACKAGE' ? 'e.g., 7 Day Buffalo Hunt' : 'New item name'" :disabled="!selectedLine.itemType" />
                </label>

                <label class="field" v-if="selectedLine.itemType === 'PACKAGE'">
                  <span class="lbl">Hunting Type <span class="req">*</span></span>
                  <select v-model="selectedLine.huntingTypeId" :disabled="loadingHuntingTypes">
                    <option :value="null" disabled>Select hunting type</option>
                    <option v-for="h in lookups.huntingTypes" :key="h.id" :value="h.id">{{ h.name }}</option>
                  </select>
                </label>

                <label class="field" v-if="selectedLine.itemType === 'PACKAGE' || selectedLine.itemType === 'COMPANION'">
                  <span class="lbl">Hunt Length <span class="req">*</span></span>
                  <select v-model.number="selectedLine.minDays" :disabled="loadingHuntLengths">
                    <option :value="null" disabled>Select hunt length</option>
                    <option v-for="hl in lookups.huntLengths" :key="hl.id" :value="hl.id">{{ getHuntLengthLabel(hl) }}</option>
                  </select>
                </label>

                <!-- Sales Packages for PACKAGE items -->
                <div class="package-builder-section" v-if="selectedLine.itemType === 'PACKAGE'">
                  <div class="sales-packages-row">
                    <div class="sales-packages-label">
                      <span class="lbl">Sales Packages <span class="req">*</span></span>
                      <small class="field-hint">Select one or more sales packages.</small>
                    </div>
                    <div class="sales-packages-input">
                      <select v-model="selectedPackageToAdd" class="package-select">
                        <option :value="null" disabled>Select a package</option>
                        <option v-for="pkg in availableSalesPackages" :key="pkg.id" :value="pkg.id">
                          {{ pkg.name }}
                        </option>
                      </select>
                      <button 
                        type="button" 
                        class="add-package-btn" 
                        @click="addPackageToLine(selectedLine)" 
                        :disabled="!selectedPackageToAdd"
                        title="Add package"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div class="selected-packages" v-if="selectedLine.salesPackageIds && selectedLine.salesPackageIds.length > 0">
                    <div v-for="pkgId in selectedLine.salesPackageIds" :key="pkgId" class="package-tag">
                      <span>{{ getPackageName(pkgId) }}</span>
                      <button type="button" class="remove-pkg-btn" @click="removePackageFromLine(selectedLine, pkgId)">&times;</button>
                    </div>
                  </div>
                </div>

                <!-- Description for new items -->
                <label class="field" v-if="selectedLine.source === 'new' && selectedLine.itemType !== 'COMPANION'">
                  <span class="lbl">Description</span>
                  <input v-model.trim="selectedLine.description" placeholder="Optional description" />
                </label>

                <label class="field" v-if="selectedLine.itemType !== 'PACKAGE' && selectedLine.itemType !== 'COMPANION'">
                  <span class="lbl">Pricing Unit</span>
                  <select v-model="selectedLine.pricingUnit">
                    <option value="FLAT">FLAT</option>
                    <option value="PER_DAY">PER_DAY</option>
                    <option value="PER_NIGHT">PER_NIGHT</option>
                    <option value="PER_PERSON_PER_DAY">PER_PERSON_PER_DAY</option>
                    <option value="PER_ITEM">PER_ITEM</option>
                  </select>
                </label>

                <label class="field">
                  <span class="lbl">Amount</span>
                  <input v-model.number="selectedLine.amount" type="number" min="0" step="0.01" />
                </label>
              </div>
            </div>
            <div v-else class="empty-details">
              Select a line from "Rate Lines" to view details.
            </div>
          </div>
        </section>

        <!-- RIGHT: Line Details -->
        <aside class="panel">
          <div class="panel-title">Line Details</div>

          <div v-if="selectedLine" class="details">
            <div class="detail-title">
              <div class="big">{{ getLineName(selectedLine) }}</div>
              <div class="small muted">{{ getLineCode(selectedLine) }}</div>
            </div>

            <div class="kv">
              <div class="row">
                <span class="k">Area:</span>
                <span class="v">{{ getAreaName() }}</span>
                <span class="badge" :class="form.isActive ? 'ok' : 'off'">
                  {{ form.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <div class="row">
                <span class="k">Season:</span>
                <span class="v">{{ getSeasonName() }}</span>
              </div>

              <div class="row">
                <span class="k">Hunting Type:</span>
                <span class="v">{{ getHuntingTypeName(selectedLine.huntingTypeId) }}</span>
              </div>

              <hr />

              <div class="row">
                <span class="k">Pricing Unit:</span>
                <span class="v">{{ selectedLine.pricingUnit }}</span>
              </div>

              <div class="row">
                <span class="k">Amount:</span>
                <span class="v"><b>{{ money(selectedLine.amount) }}</b> {{ getCurrencyCode() }}</span>
              </div>
            </div>

          </div>

          <div v-else class="empty-details">
            Select a line from "Rate Lines" to view details.
          </div>

          <div class="bottom-actions">
            <button class="btn ghost full" type="button" @click="saveDraft" :disabled="saving">Save Draft</button>
            <button class="btn success full" type="button" @click="submit" :disabled="saving || !canSubmit">💾 Save &amp; Activate</button>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { reactive, ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useHuntingAreaStore } from '@/stores/bushman/hunting-story'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import handleErrors from '@/stores/bushman/errorHandler'
import Swal from 'sweetalert2'

const props = withDefaults(defineProps<{ 
  editMode?: boolean
  editItem?: any
  structureOnly?: boolean 
}>(), {
  editMode: false,
  editItem: null,
  structureOnly: false,
})

const emit = defineEmits<{ 
  saved: []
  'go-back': []
  goBack: []
  saveDraft: [form: any]
  submit: [form: any]
}>()

const huntingAreaStore = useHuntingAreaStore()
const settingsStore = useSettingsStore()
const priceStructuresStore = usePriceStructuresStore()
const toast = useToast()

const baseUrl = import.meta.env.VITE_APP_BASE_URL

const loading = ref(false)
const saving = ref(false)
const loadingAreas = ref(false)
const loadingSeasons = ref(false)
const loadingCurrencies = ref(false)
const loadingHuntingTypes = ref(false)
const loadingHuntLengths = ref(false)
const loadingItems = ref(false)

// New refs for 3-column layout
const tabs = ["Packages", "Extras", "Companion Hunter"]
const activeTab = ref("Packages")
const search = ref("")
const selectedLineKey = ref<string | null>(null)
const selectedPackageToAdd = ref<number | null>(null)

const lookups = reactive({
  areas: [] as Array<{ id: number; name: string }>,
  seasons: [] as Array<{ id: number; name: string }>,
  currencies: [] as Array<{ id: number; code: string; name?: string }>,
  huntingTypes: [] as Array<{ id: number; name: string }>,
  huntLengths: [] as Array<{ id: number; label?: string; days?: number }>,
  items: {
    packages: [] as Array<{ id: number; code: string; name: string }>,
    trophyFees: [] as Array<{ id: number; code: string; name: string }>,
    extras: [] as Array<{ id: number; code: string; name: string }>,
    upgradeFees: [] as Array<{ id: number; code: string; name: string }>,
  },
  salesPackages: [] as Array<{ id: number; name: string }>,
})

const form = reactive({
  name: '',
  areaId: null as number | null,
  seasonId: null as number | null,
  startDate: '',
  endDate: '',
  currencyId: null as number | null,
  isActive: true,
  lines: [] as Array<{
    _key: string
    source: 'existing' | 'new'
    itemId: number | null
    name: string
    description: string
    itemType: string | null
    huntingTypeId: number | null
    minDays: number | null
    maxDays: number | null
    pricingUnit: string
    amount: number
    salesPackageIds: number[]
  }>,
})

// Tab to item type mapping
const tabToType: Record<string, string> = {
  "Packages": "PACKAGE",
  "Trophy Fees": "TROPHY",
  "Extras": "EXTRA",
  "Companion Hunter": "COMPANION",
  "Upgrade Fees": "ADJUSTMENT",
}

// Filtered lines based on tab and search
const filteredLines = computed(() => {
  const wantedType = tabToType[activeTab.value]
  const q = search.value.trim().toLowerCase()
  
  return form.lines.filter((line) => {
    const matchTab = line.itemType === wantedType
    const lineName = getLineName(line).toLowerCase()
    const lineCode = getLineCode(line).toLowerCase()
    const matchSearch = !q || lineName.includes(q) || lineCode.includes(q)
    return matchTab && matchSearch
  })
})

// Selected line
const selectedLine = computed(() => {
  if (!selectedLineKey.value) return null
  const line = form.lines.find((l) => l._key === selectedLineKey.value)
  if (!line) return null
  
  // Check if the selected line belongs to the current active tab
  const wantedType = tabToType[activeTab.value]
  if (line.itemType !== wantedType) return null
  
  return line
})

function normalizeApiList(raw: any) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.data?.data)) return raw.data.data
  return []
}

// Available sales packages (excluding already selected ones)
const availableSalesPackages = computed(() => {
  if (!selectedLine.value) return lookups.salesPackages
  const selectedIds = selectedLine.value.salesPackageIds || []
  return lookups.salesPackages.filter(pkg => !selectedIds.includes(pkg.id))
})

function selectLine(key: string) {
  selectedLineKey.value = key
  selectedPackageToAdd.value = null
}

function tabIcon(t: string): string {
  if (t === "Packages") return "👤"
  if (t === "Trophy Fees") return "🏆"
  if (t === "Extras") return "🧾"
  if (t === "Companion Hunter") return "👥"
  if (t === "Upgrade Fees") return "⬆️"
  return "🚐"
}

function money(v: number): string {
  try {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0)
  } catch {
    return String(v || 0)
  }
}

function getLineName(line: any): string {
  if (line.itemType === 'COMPANION') {
    const meta = getItemMetaById(line.itemId)
    return meta.name || 'Companion Hunter'
  }
  if (line.source === 'new') {
    return line.name || 'New Item'
  }
  const meta = getItemMetaById(line.itemId)
  return meta.name || 'Select Item'
}

function getLineCode(line: any): string {
  if (line.itemType === 'COMPANION') {
    const meta = getItemMetaById(line.itemId)
    return meta.code || 'COMP'
  }
  if (line.source === 'new') {
    return 'NEW'
  }
  const meta = getItemMetaById(line.itemId)
  return meta.code || '�'
}

function getAreaName(): string {
  const area = lookups.areas.find(a => a.id === form.areaId)
  return area?.name || '�'
}

function getHuntLengthLabel(huntLength: any): string {
  if (!huntLength) return '�'
  const label = huntLength.label || ''
  const days = huntLength.days
  if (label && days) return `${label} (${days} days)`
  if (label) return label
  if (days) return `${days} days`
  return '�'
}

function getSeasonName(): string {
  const season = lookups.seasons.find(s => s.id === form.seasonId)
  return season?.name || '�'
}

function getCurrencyCode(): string {
  const currency = lookups.currencies.find(c => c.id === form.currencyId)
  return currency?.code || 'USD'
}

function getHuntingTypeName(id: number | null): string {
  if (!id) return '�'
  const ht = lookups.huntingTypes.find(h => h.id === id)
  return ht?.name || '�'
}

function getHuntLengthLabelById(id: number | null): string {
  if (!id) return '�'
  const hl = lookups.huntLengths.find(h => h.id === id)
  return getHuntLengthLabel(hl) || '�'
}

const hasValidDates = computed(() => {
  if (!form.startDate || !form.endDate) return true
  try {
    const sd = new Date(form.startDate)
    const ed = new Date(form.endDate)
    return sd.getTime() <= ed.getTime()
  } catch {
    return false
  }
})

const canSubmit = computed(() => {
  const hasName = !!form.name.trim()
  const hasArea = !!form.areaId
  const hasDates = !!form.startDate && !!form.endDate && hasValidDates.value
  const hasCurrency = !!form.currencyId
  return hasName && hasArea && hasDates && hasCurrency
})

function getItemMetaById(itemId: number | null) {
  if (!itemId) {
    return { code: '', name: '' }
  }

  const lists = [
    lookups.items.packages,
    lookups.items.trophyFees,
    lookups.items.extras,
    lookups.items.upgradeFees,
  ]

  for (const list of lists) {
    const item = list.find(i => i.id === itemId)
    if (item) {
      return { code: item.code || '', name: item.name || '' }
    }
  }

  return { code: '', name: '' }
}

function itemsForType(itemType: string | null) {
  if (!itemType) return []
  const mapping: Record<string, Array<{ id: number; code: string; name: string }>> = {
    PACKAGE: lookups.items.packages,
    TROPHY: lookups.items.trophyFees,
    EXTRA: lookups.items.extras,
    ADJUSTMENT: lookups.items.upgradeFees,
  }
  return mapping[itemType] || []
}

function onTypeChange(line: any) {
  line.itemId = null
  line.salesPackageIds = []
  line.source = line.itemType === 'PACKAGE' ? 'new' : 'existing'
  line.pricingUnit = line.itemType === 'PACKAGE' ? 'FLAT' : 'PER_ITEM'
  line.maxDays = line.itemType === 'PACKAGE' ? null : line.maxDays
  if (!line.itemType) {
    line.source = 'existing'
  }
}

function removePackageFromLine(line: any, pkgId: number) {
  const index = line.salesPackageIds.indexOf(pkgId)
  if (index > -1) {
    line.salesPackageIds.splice(index, 1)
  }
}

function addPackageToLine(line: any) {
  if (!selectedPackageToAdd.value) return
  
  if (!line.salesPackageIds) {
    line.salesPackageIds = []
  }
  
  // Check if package is already added
  if (!line.salesPackageIds.includes(selectedPackageToAdd.value)) {
    line.salesPackageIds.push(selectedPackageToAdd.value)
  }
  
  // Reset selection
  selectedPackageToAdd.value = null
}

function getPackageName(pkgId: number): string {
  const pkg = lookups.salesPackages.find(p => p.id === pkgId)
  return pkg?.name || `Package #${pkgId}`
}

function addLine() {
  // Set item type based on current tab
  const itemType = tabToType[activeTab.value] || null
  
  const newKey = crypto.randomUUID()
  form.lines.unshift({
    _key: newKey,
    source: itemType === 'PACKAGE' ? 'new' : 'existing',
    itemId: null,
    name: '',
    description: '',
    itemType: itemType,
    huntingTypeId: itemType === 'PACKAGE' ? (lookups.huntingTypes[0]?.id || null) : null,
    minDays: null,
    maxDays: null,
    pricingUnit: itemType === 'PACKAGE' ? 'FLAT' : 'PER_ITEM',
    amount: 0,
    salesPackageIds: [],
  })
  
  // Auto-select the new line
  selectedLineKey.value = newKey
}

function removeLine(key: string) {
  const index = form.lines.findIndex(line => line._key === key)
  if (index >= 0) {
    form.lines.splice(index, 1)
    // Clear selection if removed line was selected
    if (selectedLineKey.value === key) {
      selectedLineKey.value = form.lines[0]?._key || null
    }
  }
}

function resetForm() {
  form.name = ''
  form.areaId = null
  form.seasonId = null
  form.startDate = ''
  form.endDate = ''
  form.currencyId = null
  form.isActive = true
  form.lines = []
}

function saveDraft() {
  emit('saveDraft', structuredClone(form))
  toast.init({ message: 'Draft saved locally', color: 'info' })
}

function validateLines() {
  console.log('Validating lines...', form.lines)
  
  // Filter out completely empty lines (lines that haven't been started)
  const nonEmptyLines = form.lines.filter(line => {
    if (line.itemType === 'COMPANION') {
      return !!line.minDays || !!line.amount
    }
    return line.name.trim() || line.itemId || (line.salesPackageIds && line.salesPackageIds.length > 0)
  })
  
  console.log('Non-empty lines to validate:', nonEmptyLines)
  
  for (const line of nonEmptyLines) {
    if (!line.itemType) {
      console.log('Validation failed: No item type for line', line)
      return 'Please select a type for each line.'
    }
    if (line.itemType === 'COMPANION') {
      if (!line.minDays || line.minDays <= 0) {
        console.log('Validation failed: No hunt length for COMPANION line', line)
        return 'Please select a hunt length for each companion hunter line.'
      }
      continue
    }
    if (line.itemType === 'PACKAGE') {
      if (!line.name.trim()) {
        console.log('Validation failed: No name for PACKAGE line', line)
        return 'Please enter a name for each PACKAGE line.'
      }
      if (!line.minDays || line.minDays <= 0) {
        console.log('Validation failed: No hunt length for PACKAGE line', line)
        return 'Please enter a hunt length for each PACKAGE line.'
      }
      if (!line.huntingTypeId) {
        console.log('Validation failed: No hunting type for PACKAGE line', line)
        return 'Please select a hunting type for each PACKAGE line.'
      }
      if (!line.salesPackageIds || line.salesPackageIds.length === 0) {
        console.log('Validation failed: No sales packages for PACKAGE line', line)
        return 'Please select at least one sales package for each PACKAGE line.'
      }
      continue
    }
    if (line.source === 'existing' && !line.itemId) {
      console.log('Validation failed: No item selected for existing line', line)
      return 'Please select an item for each existing line.'
    }
    if (line.source === 'new' && !line.name.trim()) {
      console.log('Validation failed: No name for new item line', line)
      return 'Please enter a name for each new item line.'
    }
  }
  console.log('Line validation passed')
  return null
}

async function submit() {
  console.log('Submit button clicked')
  console.log('canSubmit:', canSubmit.value)
  console.log('Form data:', form)
  
  if (!canSubmit.value) {
    toast.init({ message: 'Please fill in all required fields', color: 'warning' })
    return
  }

  const lineError = validateLines()
  if (lineError) {
    toast.init({ message: lineError, color: 'warning' })
    return
  }

  saving.value = true
  console.log('Saving started...')

  try {
    const payload: any = {
      name: form.name,
      area_id: form.areaId,
      season_id: form.seasonId,
      start_date: form.startDate,
      start_at: form.startDate,
      end_date: form.endDate,
      end_at: form.endDate,
      currency_id: form.currencyId,
      is_active: form.isActive ? 1 : 0,
    }

    // Filter out empty/incomplete lines before sending
    const itemLines = form.lines.filter(line => {
      return line.itemType !== 'COMPANION'
        && (line.name.trim() || line.itemId || (line.salesPackageIds && line.salesPackageIds.length > 0))
    })

    const companionLines = form.lines.filter(line => {
      return line.itemType === 'COMPANION' && (!!line.minDays || !!line.amount)
    })

    if (itemLines.length > 0) {
      payload.items = itemLines.map(line => {
        if (line.itemType === 'PACKAGE') {
          return {
            item_type: 'PACKAGE',
            name: line.name,
            description: line.description || null,
            hunting_type_id: line.huntingTypeId,
            hunt_length_id: line.minDays,
            currency_id: form.currencyId,
            amount: line.amount,
            sales_package_ids: line.salesPackageIds || [],
          }
        }

        const isExisting = line.source === 'existing'
        return {
          item_type: line.itemType,
          item_id: isExisting ? line.itemId : null,
          name: isExisting ? null : line.name,
          description: isExisting ? null : (line.description || null),
          hunting_type_id: line.huntingTypeId,
          pricing_unit: line.pricingUnit,
          currency_id: form.currencyId,
          amount: line.amount,
        }
      })
    }

    if (companionLines.length > 0) {
      payload.companion_hunter_prices = companionLines.map(line => ({
        hunt_length_id: line.minDays,
        currency_id: form.currencyId,
        item_id: line.itemId || null,
        amount: line.amount,
      }))
    }

    console.log('Payload to send:', payload)

    let response: any
    if (props.editMode && props.editItem?.id) {
      console.log('Updating price structure:', props.editItem.id)
      response = await priceStructuresStore.update(props.editItem.id, payload)
    } else {
      console.log('Creating new price structure')
      response = await priceStructuresStore.create(payload)
    }

    console.log('Response received:', response)

    if (response && (response.status === 200 || response.status === 201)) {
      await Swal.fire({
        title: props.editMode ? 'Price structure updated!' : 'Price structure created!',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'btn btn-primary' },
        buttonsStyling: false,
      })

      resetForm()
      emit('saved')
      emit('goBack')
      emit('go-back')
    } else {
      console.error('Unexpected response status:', response?.status)
      toast.init({ 
        message: 'Unexpected response from server', 
        color: 'warning' 
      })
    }
  } catch (error: any) {
    console.error('Submit error:', error)
    console.error('Error response:', error?.response)
    console.error('Error data:', error?.response?.data)
    const errors = handleErrors(error)
    toast.init({ 
      message: errors?.join(', ') || error?.response?.data?.message || 'Failed to save price structure', 
      color: 'danger' 
    })
  } finally {
    saving.value = false
    console.log('Saving completed')
  }
}

async function fetchAreas() {
  loadingAreas.value = true
  try {
    const response = await huntingAreaStore.getLocations()
    const data = response.data?.data?.data || response.data?.data || response.data || []
    lookups.areas = data
      .filter((item: any) => item.type === 'GAME')
      .map((item: any) => ({
        id: item.id,
        name: item.name + (item.code ? ` (${item.code})` : ''),
      }))
  } catch (e) {
    console.error('Error fetching areas:', e)
  } finally {
    loadingAreas.value = false
  }
}

async function fetchSeasons() {
  loadingSeasons.value = true
  try {
    const response = await settingsStore.getSeasons(false)
    const data = response.data || []
    lookups.seasons = data.map((item: any) => ({
      id: item.id,
      name: item.name,
    }))
  } catch (e) {
    console.error('Error fetching seasons:', e)
  } finally {
    loadingSeasons.value = false
  }
}

async function fetchCurrencies() {
  loadingCurrencies.value = true
  try {
    const response = await settingsStore.getCurrencies()
    const data = response.data || []
    lookups.currencies = data.map((item: any) => ({
      id: item.id,
      code: item.code || item.name,
      name: item.name,
    }))
  } catch (e) {
    console.error('Error fetching currencies:', e)
  } finally {
    loadingCurrencies.value = false
  }
}

async function fetchHuntingTypes() {
  loadingHuntingTypes.value = true
  try {
    const response = await settingsStore.getHuntingsTypes()
    const data = response.data || []
    lookups.huntingTypes = data.map((item: any) => ({
      id: item.id,
      name: item.name,
    }))
  } catch (e) {
    console.error('Error fetching hunting types:', e)
  } finally {
    loadingHuntingTypes.value = false
  }
}

async function fetchHuntLengths() {
  loadingHuntLengths.value = true
  try {
    const huntLengthsUrl = `${baseUrl}settings/hunt-lengths/`
    const response = await axios.get(huntLengthsUrl)
    const data = response.data?.data || response.data || []
    lookups.huntLengths = data.map((item: any) => ({
      id: item.id,
      label: item.label,
      days: item.days,
    }))
  } catch (e) {
    console.error('Error fetching hunt lengths:', e)
  } finally {
    loadingHuntLengths.value = false
  }
}

async function fetchItemsByGroup(name: string) {
  const url = `${baseUrl}settings/item-groups-items`
  const response = await axios.get(url, { params: { name, is_active: true } })
  const data = normalizeApiList(response.data)
  return data.map((item: any) => ({
    id: item.id,
    code: '',
    name: item.name,
  }))
}

async function fetchSalesPackageSets() {
  const url = `${baseUrl}settings/sales-package-sets/`
  const response = await axios.get(url)
  const data = normalizeApiList(response.data)
  return data.map((item: any) => {
    const id = item.id ?? item.sales_package_id ?? item.value
    const name = item.name || item.label || item.description || (id ? `Package #${id}` : '')
    return {
      id,
      code: item.code || '',
      name,
    }
  })
}

async function fetchSafariExtras() {
  const itemsUrl = `${baseUrl}settings/items`
  try {
    const response = await axios.get(itemsUrl, { params: { subtype: 'SAFARI_EXTRA', is_active: true } })
    const data = normalizeApiList(response.data)
    return data.map((item: any) => {
      const id = item.id
      const name = item.name || item.description || (id ? `Extra #${id}` : '')
      return {
        id,
        code: item.code || '',
        name,
      }
    })
  } catch (error) {
    console.error('Failed to fetch safari extras by subtype, falling back to item group:', error)
  }

  const url = `${baseUrl}settings/item-groups-items`
  const response = await axios.get(url, { params: { name: 'Safari Extras', is_active: true } })
  const data = normalizeApiList(response.data)
    .filter((item: any) => !item.subtype || item.subtype === 'SAFARI_EXTRA')

  return data.map((item: any) => {
    const id = item.id
    const name = item.name || item.description || (id ? `Extra #${id}` : '')
    return {
      id,
      code: item.code || '',
      name,
    }
  })
}

async function fetchItems() {
  loadingItems.value = true
  try {
    const results = await Promise.allSettled([
      fetchSalesPackageSets(),
      fetchItemsByGroup('Trophy Fees'),
      fetchSafariExtras(),
      fetchItemsByGroup('Upgrade Fees'),
    ])

    const [packagesResult, trophyResult, extrasResult, upgradeResult] = results

    if (packagesResult.status === 'fulfilled') {
      lookups.items.packages = packagesResult.value
      lookups.salesPackages = packagesResult.value.map((item: any) => ({
        id: item.id,
        name: item.name,
      }))
    } else {
      console.error('Failed to fetch sales packages:', packagesResult.reason)
    }

    if (trophyResult.status === 'fulfilled') {
      lookups.items.trophyFees = trophyResult.value
    } else {
      console.error('Failed to fetch trophy fees:', trophyResult.reason)
    }

    if (extrasResult.status === 'fulfilled') {
      lookups.items.extras = extrasResult.value
    } else {
      console.error('Failed to fetch safari extras:', extrasResult.reason)
    }

    if (upgradeResult.status === 'fulfilled') {
      lookups.items.upgradeFees = upgradeResult.value
    } else {
      console.error('Failed to fetch upgrade fees:', upgradeResult.reason)
    }
  } catch (e) {
    console.error('Error fetching items:', e)
  } finally {
    loadingItems.value = false
  }
}

function populateFormForEdit(editItem: any) {
  if (!editItem) return

  form.name = editItem.name || ''
  form.areaId = editItem.location_id || null
  form.seasonId = editItem.season_id || null
  form.startDate = editItem.start_date || editItem.start_at || ''
  form.endDate = editItem.end_date || editItem.end_at || ''
  form.currencyId = editItem.currency_id || null
  form.isActive = editItem.is_active === 1 || editItem.is_active === true

  if (editItem.items && Array.isArray(editItem.items)) {
    form.lines = editItem.items.map((item: any) => ({
      _key: crypto.randomUUID(),
      source: item.item_type === 'PACKAGE' ? 'new' : (item.item_id ? 'existing' : 'new'),
      itemId: item.item_type === 'PACKAGE' ? null : (item.item_id || null),
      name: item.name || '',
      description: item.description || '',
      itemType: item.item_type || null,
      huntingTypeId: item.hunting_type_id,
      minDays: item.item_type === 'PACKAGE' ? (item.hunt_length_id ?? item.min_days) : item.min_days,
      maxDays: item.max_days,
      pricingUnit: item.pricing_unit || 'FLAT',
      amount: item.amount || 0,
      salesPackageIds: Array.isArray(item.sales_packages)
        ? item.sales_packages.map((sp: any) => sp.id)
        : (item.sales_package_ids || []),
    }))
  }

  if (editItem.companion_hunter_prices && Array.isArray(editItem.companion_hunter_prices)) {
    const companionLines = editItem.companion_hunter_prices.map((price: any) => ({
      _key: crypto.randomUUID(),
      source: 'existing',
      itemId: price.item_id || null,
      name: '',
      description: '',
      itemType: 'COMPANION',
      huntingTypeId: null,
      minDays: price.hunt_length_id || null,
      maxDays: null,
      pricingUnit: 'PER_PERSON_PER_DAY',
      amount: price.amount || 0,
      salesPackageIds: [],
    }))
    form.lines = form.lines.concat(companionLines)
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    fetchAreas(),
    fetchSeasons(),
    fetchCurrencies(),
    fetchHuntingTypes(),
    fetchHuntLengths(),
    fetchItems(),
  ])

  if (props.editMode && props.editItem) {
    populateFormForEdit(props.editItem)
  }

  loading.value = false
})
</script>

<style scoped>
/* Basic look similar to the screenshots: light gray page, soft cards */
:root {
  --bg: #f3f5f9;
  --card: #ffffff;
  --border: #e5e7ef;
  --text: #1b2430;
  --muted: #667085;
  --blue: #1f6feb;
  --blue-weak: #e9f1ff;
  --green: #2e7d32;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.ps-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

/* Content */
.content {
  padding: 18px 18px 26px;
}

/* Page head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.crumbs {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.3px;
}
.crumbs span {
  font-weight: 700;
}
h1 {
  margin: 8px 0 4px;
  font-size: 34px;
}
.subtitle {
  margin: 0;
  color: var(--muted);
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 16px;
  align-items: start;
}

/* Panels */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.panel-title {
  padding: 14px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 800;
  background: #cecef2;
}
.panel.center {
  min-height: 520px;
}

/* Buttons */
.btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}
.btn.small {
  padding: 8px 12px;
  border-radius: 10px;
}
.btn.primary {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
}
.btn.btn-blue {
  background: #1f6feb !important;
  border-color: #1f6feb !important;
  color: #fff !important;
}
.btn.btn-blue:hover:not(:disabled) {
  background: #1557c7 !important;
  border-color: #1557c7 !important;
}
.btn.success {
  background: #1b8f4b;
  border-color: #1b8f4b;
  color: #fff;
}
.btn.ghost {
  background: #fff;
}
.btn.full {
  width: 100%;
}

/* Left Form */
.form {
  padding: 20px 18px 20px 5px;
  display: grid;
  gap: 16px;
}
.field {
  display: grid;
  gap: 6px;
}
.lbl {
  font-size: 13px;
  color: #334155;
  font-weight: 700;
}
.req {
  color: #e11d48;
}
input,
select {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #f3ecec;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
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
  background-color: #d0d5dd;
  border-radius: 999px;
  transition: 0.2s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}
.switch input:checked + .slider {
  background-color: var(--blue);
}
.switch input:checked + .slider:before {
  transform: translateX(24px);
}

/* Inner Cards */
.inner-card {
  margin: 12px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.tabs-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 12px;
}

.toolbar-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 2;
  overflow: visible;
}

.table-card {
  padding: 0;
  margin-bottom: 16px;
}

/* Center: tabs and search */
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tab {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s ease;
}
.tab:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}
.tab.active {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
  box-shadow: 0 2px 8px rgba(31, 111, 235, 0.3);
}
.tab-icon {
  font-size: 13px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 14px;
}
.search-row .icon {
  font-size: 16px;
  color: var(--muted);
}
.search-row input {
  border: 0;
  padding: 6px 4px;
  border-radius: 0;
  background: transparent;
  flex: 1;
  font-size: 14px;
}
.search-row input:focus {
  outline: none;
}

.rate-lines-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
  min-height: 40px;
}

.rate-lines-head .btn {
  flex-shrink: 0;
  white-space: nowrap;
}
.lines-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 auto;
}
.rate-lines-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}
.line-count {
  background: #e2e8f0;
  color: #475569;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  position: sticky;
  top: 0;
}

.data-table th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
}

.data-table th.col-item { width: 30%; }
.data-table th.col-type { width: 18%; }
.data-table th.col-hunting { width: 18%; }
.data-table th.col-days { width: 10%; text-align: center; }
.data-table th.col-action { width: 50px; }

.data-table tbody tr {
  transition: all 0.15s ease;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.data-table tbody tr.selected {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 3px solid var(--blue);
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table .item-col .item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.data-table .item-col .code {
  font-weight: 800;
  color: #1e293b;
  font-size: 13px;
}

.data-table .item-col .name {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.table-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.table-select:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.table-select:hover:not(:disabled) {
  border-color: var(--blue);
}

.table-select:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.1);
}

.type-display {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-display {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-align: left;
  background: #f8fafc;
  border-radius: 8px;
}

.table-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  background: #fff;
  transition: all 0.15s ease;
}

.table-input:hover {
  border-color: var(--blue);
}

.table-input:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.1);
}

.action-col {
  text-align: center;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #fecaca;
  background: #fff;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: #fef2f2;
  border-color: #dc2626;
  transform: scale(1.05);
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 13px;
  color: var(--muted);
}

.empty-state .btn {
  margin-top: 12px;
}

.details-card {
  padding: 0;
}

.details-head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 800;
  background: #fbfbfe;
}

.details-form {
  padding: 12px 14px 14px;
}

.details-card .edit-section {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

/* Right details */
.details {
  padding: 14px;
}
.detail-title .big {
  font-size: 18px;
  font-weight: 900;
}
.detail-title .small {
  margin-top: 4px;
}
.kv {
  margin-top: 12px;
}
.kv .row {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
}
.kv .k {
  color: var(--muted);
  font-weight: 700;
}
.kv hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 10px 0;
}
.badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
  border: 1px solid var(--border);
}
.badge.ok {
  background: #e9f7ef;
  border-color: #b7e2c5;
  color: var(--green);
}
.badge.off {
  background: #f2f4f7;
  color: #475467;
}
.muted {
  color: var(--muted);
}
.small {
  font-size: 12px;
}

.empty-details {
  padding: 18px 14px;
  color: var(--muted);
}

.bottom-actions {
  border-top: 1px solid var(--border);
  padding: 12px 14px 14px;
  display: grid;
  gap: 10px;
}

/* Edit Section in Right Panel */
.edit-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: grid;
  gap: 12px;
}

/* Source Select - New Item Highlight */
.source-new {
  background-color: #f0fdf4 !important;
  border-color: #22c55e !important;
  color: #15803d !important;
  font-weight: 600;
}

.text-danger {
  color: #dc2626;
  font-size: 12px;
}

/* Package Builder Section */
.package-builder-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #86efac;
  border-radius: 10px;
  padding: 14px;
  margin-top: 4px;
}

.sales-packages-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.sales-packages-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100%;
}

.sales-packages-label .lbl {
  font-size: 13px;
  color: #166534;
  font-weight: 600;
}

.field-hint {
  font-size: 11px;
  color: #15803d;
  margin: 0;
}

.sales-packages-input {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.package-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

.add-package-btn {
  width: 38px;
  height: 38px;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 8px !important;
  cursor: pointer;
  transition: all 0.2s ease !important;
}

.add-package-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%) !important;
  transform: scale(1.05);
}

.add-package-btn:disabled {
  background: #9ca3af !important;
  cursor: not-allowed;
}

.selected-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  width: 100%;
}

.package-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dcfce7;
  border: 1px solid #4ade80;
  color: #166534;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.remove-pkg-btn {
  background: none;
  border: none;
  color: #166534;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin-left: 2px;
  transition: color 0.2s;
}

.remove-pkg-btn:hover {
  color: #dc2626;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 280px 1fr 280px;
  }
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: 1fr;
  }
  
  .panel.center {
    order: -1;
  }
}
</style>
