<template>
  <div class="ps-page">
    <!-- Page Content -->
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon">📊</span>
            SALES / <span>PRICE STRUCTURES</span>
          </div>
          <h1>{{ editMode ? 'Edit Price Structure' : 'Create Price Structure' }}</h1>
          <p class="subtitle">Configure your rate card for a specific area, season, and currency combination.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="$emit('goBack')">
            <span class="btn-icon">←</span> Back
          </button>
          <button class="btn ghost" type="button" @click="resetForm">
            <span class="btn-icon">⟲</span> Reset
          </button>
          <button class="btn secondary" type="button" @click="saveDraft" :disabled="saving">
            <span class="btn-icon">💾</span> Save Draft
          </button>
          <button class="btn primary" type="button" @click="submit" :disabled="saving || !canSubmit" :title="canSubmit ? 'Save & Activate' : 'Complete required fields to enable activation'">
            <span class="btn-icon">✓</span> Save &amp; Activate
          </button>
          <div v-if="!canSubmit && !saving" class="mt-2">
            <small class="text-muted">Complete required fields to activate: <strong>{{ missingFields.join(', ') }}</strong></small>
          </div>
        </div>
      </div>

      <!-- 3-column layout -->
      <section class="grid">
        <!-- LEFT: Create Price Structure Form -->
        <aside class="panel left-panel">
          <div class="panel-header">
            <div class="panel-icon">📝</div>
            <div class="panel-title-text">
              <h3>{{ editMode ? 'Edit Details' : 'Price Structure Details' }}</h3>
              <p>Fill in the basic information</p>
            </div>
          </div>

          <div class="form">
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon">🏷️</span>
                Identification
              </div>
              
              <label class="field">
                <span class="lbl">Structure Name <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon">📋</span>
                  <input v-model.trim="form.name" placeholder="e.g., Price structures 2026" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Hunting Area <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon">🗺️</span>
                  <select v-model="form.areaId" :disabled="loadingAreas">
                    <option :value="null">Select hunting area...</option>
                    <option v-for="a in lookups.areas" :key="a.id" :value="a.id">{{ a.name }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Season</span>
                <div class="input-wrapper">
                  <span class="input-icon">🌿</span>
                  <select v-model="form.seasonId" :disabled="loadingSeasons">
                    <option :value="null">No specific season</option>
                    <option v-for="s in lookups.seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
              </label>
            </div>

            <div class="form-section">
              <div class="section-title">
                <span class="section-icon">📅</span>
                Validity Period
              </div>
              
              <div class="date-row">
                <label class="field">
                  <span class="lbl">Start Date <span class="req">*</span></span>
                  <div class="input-wrapper vueform-date-wrapper">
                    <Vueform size="sm" :display-errors="false" :endpoint="false">
                      <DateElement
                        name="start_date"
                        v-model="form.startDate"
                        @change="form.startDate = $event"
                        :display-format="'MMM D, YYYY'"
                        :value-format="'YYYY-MM-DD'"
                        placeholder="Select start date..."
                        :add-class="{ DateElement: { input: 'form-control' } }"
                      />
                    </Vueform>
                  </div>
                </label>

                <label class="field">
                  <span class="lbl">End Date <span class="req">*</span></span>
                  <div class="input-wrapper vueform-date-wrapper">
                    <Vueform size="sm" :display-errors="false" :endpoint="false">
                      <DateElement
                        name="end_date"
                        v-model="form.endDate"
                        @change="form.endDate = $event"
                        :display-format="'MMM D, YYYY'"
                        :value-format="'YYYY-MM-DD'"
                        placeholder="Select end date..."
                        :add-class="{ DateElement: { input: 'form-control' } }"
                      />
                    </Vueform>
                  </div>
                </label>
              </div>
              <small v-if="form.startDate && form.endDate && !hasValidDates" class="text-danger">
                ⚠️ Start date must be before or equal to End date.
              </small>
            </div>

            <div class="form-section">
              <div class="section-title">
                <span class="section-icon">💰</span>
                Currency & Status
              </div>
              
              <label class="field">
                <span class="lbl">Currency <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon">💵</span>
                  <select v-model="form.currencyId" :disabled="loadingCurrencies">
                    <option :value="null">Select currency...</option>
                    <option v-for="c in lookups.currencies" :key="c.id" :value="c.id">{{ c.code }}</option>
                  </select>
                </div>
              </label>

              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="lbl">Active Status</span>
                  <span class="toggle-hint">{{ form.isActive ? 'This price structure is active' : 'This price structure is inactive' }}</span>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="form.isActive" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- CENTER: Price Map + Rate Lines -->
        <section class="panel center-panel">
          <div class="panel-header center-header">
            <div class="panel-icon">💼</div>
            <div class="panel-title-text">
              <h3>Price Configuration</h3>
              <p>Set up packages, extras, and companion rates</p>
            </div>
          </div>

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
                <span class="tab-text">{{ t }}</span>
                <span class="tab-count" v-if="getTabCount(t) > 0">{{ getTabCount(t) }}</span>
              </button>
            </div>
          </div>

          <!-- Sales Package Selection (for Packages tab) -->
          <div class="inner-card package-selection-card" v-if="activeTab === 'Packages'">
            <div class="package-selection-header">
              <span class="selection-icon">📦</span>
              <div>
                <h3>Select Sales Packages</h3>
                <p class="selection-hint">Click on packages to add them to your rate configuration</p>
              </div>
            </div>
            <div class="package-buttons">
              <button
                v-for="pkg in lookups.items.packages"
                :key="pkg.id"
                type="button"
                class="package-btn"
                @click="addPackageAsLine(pkg)"
                :title="'Add ' + pkg.name"
              >
                <span class="pkg-icon">📦</span>
                <span class="pkg-info">
                  <span class="pkg-code">{{ pkg.code }}</span>
                  <span class="pkg-name">{{ pkg.name }}</span>
                </span>
                <span class="add-icon">+</span>
              </button>
            </div>
          </div>

          <!-- Rate Lines Table -->
          <div class="inner-card table-card">
            <div class="table-header">
              <div class="lines-info">
                <h3>Rate Lines</h3>
                <span class="line-count">
                  <span class="count-number">{{ filteredLines.length }}</span> items
                </span>
              </div>
              <button 
                v-if="activeTab !== 'Packages'" 
                class="btn btn-sm btn-primary" 
                type="button" 
                @click="addLine"
              >
                <i class="fa fa-plus me-1"></i> Add {{ activeTab === 'Companion Hunter' ? 'Rate' : 'Line' }}
              </button>
            </div>

            <div class="table-responsive" v-if="filteredLines.length > 0">
              <table class="rates-table">
                <thead>
                  <tr>
                    <th v-if="activeTab !== 'Companion Hunter'" style="width: 30%">{{ activeTab === 'Packages' ? 'Package Name' : 'Item Name' }}</th>
                    <th v-if="activeTab === 'Packages'" style="width: 20%">Hunting Type</th>
                    <th v-if="activeTab === 'Packages' || activeTab === 'Companion Hunter'" style="width: 15%">Hunt Length</th>
                    <th v-if="activeTab === 'Extras'" style="width: 15%">Pricing Unit</th>
                    <th style="width: 20%">Amount</th>
                    <th v-if="activeTab === 'Packages'" style="width: 10%" class="text-center">Custom Name</th>
                    <th style="width: 5%" class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, idx) in filteredLines" :key="line._key" class="rate-row">
                    <!-- Item/Package Name Column (not for Companion Hunter) -->
                    <td v-if="activeTab !== 'Companion Hunter'">
                      <div class="name-cell">
                        <!-- Packages: custom name or package name -->
                        <input
                          v-if="activeTab === 'Packages' && line.customNameEnabled"
                          v-model="line.name"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Enter custom name"
                        />
                        <div v-else-if="activeTab === 'Packages'" class="name-display">
                          <span class="name-text">{{ line.name || getPackageName(line.salesPackageIds?.[0]) || '—' }}</span>
                        </div>
                        <!-- Extras: select from existing items -->
                        <select
                          v-else
                          v-model="line.itemId"
                          class="form-select form-select-sm"
                          @change="onItemSelected(line)"
                        >
                          <option :value="null">Select item...</option>
                          <option v-for="item in itemsForType(line.itemType)" :key="item.id" :value="item.id">
                            {{ item.code ? `${item.code} - ` : '' }}{{ item.name }}
                          </option>
                        </select>
                      </div>
                    </td>
                    <td v-if="activeTab === 'Packages'">
                      <select
                        v-model="line.huntingTypeId"
                        class="form-select form-select-sm"
                        :disabled="loadingHuntingTypes"
                      >
                        <option :value="null">Select type...</option>
                        <option v-for="h in lookups.huntingTypes" :key="h.id" :value="h.id">{{ h.name }}</option>
                      </select>
                    </td>
                    <td v-if="activeTab === 'Packages' || activeTab === 'Companion Hunter'">
                      <select
                        v-model.number="line.minDays"
                        class="form-select form-select-sm"
                        :disabled="loadingHuntLengths"
                      >
                        <option :value="null">Select length...</option>
                        <option v-for="hl in lookups.huntLengths" :key="hl.id" :value="hl.id">{{ getHuntLengthLabel(hl) }}</option>
                      </select>
                    </td>
                    <td v-if="activeTab === 'Extras'">
                      <select
                        v-model="line.pricingUnit"
                        class="form-select form-select-sm"
                      >
                        <option :value="null">Select...</option>
                        <option value="FLAT">Flat</option>
                        <option value="PER_DAY">Per Day</option>
                        <option value="PER_NIGHT">Per Night</option>
                        <option value="PER_PERSON_PER_DAY">Per Person Per Day</option>
                        <option value="PER_ITEM">Per Item</option>
                      </select>
                    </td>
                    <td>
                      <div class="amount-input-group">
                        <span class="input-group-text">{{ getCurrencyCode() }}</span>
                        <CurrencyInput v-model="line.amount" :currency="getCurrencyCode()" />
                      </div>
                    </td>
                    <td v-if="activeTab === 'Packages'" class="text-center">
                      <label class="custom-name-toggle">
                        <input type="checkbox" v-model="line.customNameEnabled" />
                        <span class="toggle-indicator" :title="line.customNameEnabled ? 'Using custom name' : 'Using package name'">✏️</span>
                      </label>
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="removeLine(line._key)"
                        title="Remove"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="filteredLines.length === 0" class="empty-state">
              <div class="empty-illustration">
                <div class="empty-icon">{{ getEmptyIcon() }}</div>
                <div class="empty-circles"></div>
              </div>
              <div class="empty-content">
                <div class="empty-text">No {{ activeTab.toLowerCase() }} added yet</div>
                <div class="empty-hint" v-if="activeTab === 'Packages'">Select sales packages above to start configuring rates</div>
                <div class="empty-hint" v-else>Click "Add {{ activeTab === 'Companion Hunter' ? 'Rate' : 'Line' }}" to create your first rate line</div>
                <button v-if="activeTab !== 'Packages'" class="btn btn-add" type="button" @click="addLine">
                  <span class="btn-icon">+</span> Add {{ activeTab === 'Companion Hunter' ? 'Rate' : 'Line' }}
                </button>
              </div>
            </div>
          </div>

        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useHuntingAreaStore } from '@/stores/bushman/hunting-story'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { useAppOptionStore } from '@/stores/app-option'
import handleErrors from '@/stores/bushman/errorHandler'
import Swal from 'sweetalert2'
import CurrencyInput from '@/components/CurrencyInput.vue'

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
const appOptionStore = useAppOptionStore()
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
  if (t === "Packages") return "📦"
  if (t === "Trophy Fees") return "🏆"
  if (t === "Extras") return "🎯"
  if (t === "Companion Hunter") return "👥"
  if (t === "Upgrade Fees") return "⬆️"
  return "🚐"
}

function getTabCount(tab: string): number {
  const wantedType = tabToType[tab]
  return form.lines.filter(line => line.itemType === wantedType).length
}

function getTypeBadgeClass(itemType: string | null): string {
  if (!itemType) return ''
  const classes: Record<string, string> = {
    'PACKAGE': 'type-package',
    'TROPHY': 'type-trophy',
    'EXTRA': 'type-extra',
    'COMPANION': 'type-companion',
    'ADJUSTMENT': 'type-adjustment'
  }
  return classes[itemType] || ''
}

function getTypeIcon(itemType: string | null): string {
  if (!itemType) return '📋'
  const icons: Record<string, string> = {
    'PACKAGE': '📦',
    'TROPHY': '🏆',
    'EXTRA': '🎯',
    'COMPANION': '👥',
    'ADJUSTMENT': '⬆️'
  }
  return icons[itemType] || '📋'
}

function getEmptyIcon(): string {
  if (activeTab.value === 'Packages') return '📦'
  if (activeTab.value === 'Extras') return '🎯'
  if (activeTab.value === 'Companion Hunter') return '👥'
  return '📋'
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
  
  // Debug logging
  if (!hasName || !hasArea || !hasDates || !hasCurrency) {}
  
  return hasName && hasArea && hasDates && hasCurrency
})

// Provide a human-readable list of missing required fields for UX hints
const missingFields = computed(() => {
  const fields: string[] = []
  if (!form.name || !form.name.trim()) fields.push('Name')
  if (!form.areaId) fields.push('Area')
  if (!form.startDate) fields.push('Start Date')
  if (!form.endDate) fields.push('End Date')
  if (form.startDate && form.endDate && !hasValidDates.value) fields.push('Valid date range')
  if (!form.currencyId) fields.push('Currency')
  return fields
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

function onItemSelected(line: any) {
  if (line.itemId) {
    const item = itemsForType(line.itemType).find((i: any) => i.id === line.itemId)
    if (item) {
      line.name = item.name
    }
  } else {
    line.name = ''
  }
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
    customNameEnabled: false,
  })
  
  // Auto-select the new line
  selectedLineKey.value = newKey
}

function addPackageAsLine(pkg: any) {
  const newKey = crypto.randomUUID()
  form.lines.unshift({
    _key: newKey,
    source: 'new',
    itemId: null,
    name: pkg.name, // Auto-fill with package name
    description: '',
    itemType: 'PACKAGE',
    huntingTypeId: lookups.huntingTypes[0]?.id || null,
    minDays: null,
    maxDays: null,
    pricingUnit: 'FLAT',
    amount: 0,
    salesPackageIds: [pkg.id], // Auto-add the selected package
    customNameEnabled: false, // By default use the package name
  })
  
  toast.init({ message: `Added ${pkg.name}`, color: 'success' })
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
  // Convert reactive object to plain object before cloning
  const plainForm = JSON.parse(JSON.stringify(form))
  emit('saveDraft', plainForm)
  toast.init({ message: 'Draft saved locally', color: 'info' })
}

function validateLines() {
  
  // Filter out completely empty lines (lines that haven't been started)
  const nonEmptyLines = form.lines.filter(line => {
    if (line.itemType === 'COMPANION') {
      return !!line.minDays || !!line.amount
    }
    return line.name.trim() || line.itemId || (line.salesPackageIds && line.salesPackageIds.length > 0)
  })
  
  for (const line of nonEmptyLines) {
    if (!line.itemType) {
      return 'Please select a type for each line.'
    }
    if (line.itemType === 'COMPANION') {
      if (!line.minDays || line.minDays <= 0) {
        return 'Please select a hunt length for each companion hunter line.'
      }
      continue
    }
    if (line.itemType === 'PACKAGE') {
      if (!line.name.trim()) {
        return 'Please enter a name for each PACKAGE line.'
      }
      if (!line.minDays || line.minDays <= 0) {
        return 'Please enter a hunt length for each PACKAGE line.'
      }
      if (!line.huntingTypeId) {
        return 'Please select a hunting type for each PACKAGE line.'
      }
      if (!line.salesPackageIds || line.salesPackageIds.length === 0) {
        return 'Please select at least one sales package for each PACKAGE line.'
      }
      continue
    }
    if (line.source === 'existing' && !line.itemId) {
      return 'Please select an item for each existing line.'
    }
    if (line.source === 'new' && !line.name.trim()) {
      return 'Please enter a name for each new item line.'
    }
  }
  return null
}

async function submit() {
  
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
      const mappedItems = itemLines.map(line => {
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

      // Remove duplicate packages based on sales_package_ids, hunting_type_id, and hunt_length_id
      const uniqueItems = mappedItems.filter((item, index, self) => {
        if (item.item_type !== 'PACKAGE') return true
        
        // For packages, check if there's a duplicate before this index
        return index === self.findIndex(i => 
          i.item_type === 'PACKAGE' &&
          JSON.stringify(i.sales_package_ids?.sort()) === JSON.stringify(item.sales_package_ids?.sort()) &&
          i.hunting_type_id === item.hunting_type_id &&
          i.hunt_length_id === item.hunt_length_id
        )
      })

      payload.items = uniqueItems
    }

    if (companionLines.length > 0) {
      payload.companion_hunter_prices = companionLines.map(line => ({
        hunt_length_id: line.minDays,
        currency_id: form.currencyId,
        item_id: line.itemId || null,
        amount: line.amount,
      }))
    }

    let response: any
    if (props.editMode && props.editItem?.id) {
      response = await priceStructuresStore.update(props.editItem.id, payload)
    } else {
      response = await priceStructuresStore.create(payload)
    }

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
    const raw = response.data || []

    // Normalize possible shapes from the settings store / API
    const items = Array.isArray(raw) ? raw : []

    lookups.currencies = items
      .map((item: any) => {
        // settingsStore.getCurrencies() may return { value, text, currency, raw }
        // or API may return { id, code, name }. Be resilient.
        const id = item.id ?? item.value ?? item.raw?.id ?? null
        const code = item.code ?? item.text ?? item.currency ?? item.raw?.currency ?? item.name ?? ''
        const name = item.name ?? item.text ?? item.currency ?? item.raw?.name ?? ''
        return { id, code, name }
      })
      .filter((c: any) => c.id != null)
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

function normalizeDateInput(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') {
    if (value.includes('T')) return value.split('T')[0]
    if (value.includes(' ')) return value.split(' ')[0]
    return value
  }
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function resolveItemType(item: any): string | null {
  if (item?.item_type) return item.item_type
  if (item?.hunting_type_id || item?.hunt_length_id) return 'PACKAGE'
  return item?.item_group === 'EXTRA' ? 'EXTRA' : null
}

function populateFormForEdit(editItem: any) {
  if (!editItem) return

  form.name = editItem.name || ''
  form.areaId = editItem.location_id || editItem.area_id || editItem.area?.id || null
  form.seasonId = editItem.season_id || editItem.season?.id || null
  form.startDate = normalizeDateInput(
    editItem.start_date ||
    editItem.start_at ||
    editItem.startDate ||
    editItem.valid_from ||
    editItem.valid_from_date ||
    editItem.start
  )
  form.endDate = normalizeDateInput(
    editItem.end_date ||
    editItem.end_at ||
    editItem.endDate ||
    editItem.valid_to ||
    editItem.valid_to_date ||
    editItem.end
  )
  form.currencyId = editItem.currency_id || editItem.currency?.id || null
  form.isActive = editItem.is_active === 1 || editItem.is_active === true

  const items = editItem.items || editItem.price_structure_items || []
  if (Array.isArray(items)) {
    form.lines = items.map((item: any) => ({
      _key: crypto.randomUUID(),
      source: resolveItemType(item) === 'PACKAGE' ? 'new' : (item.item_id ? 'existing' : 'new'),
      itemId: resolveItemType(item) === 'PACKAGE' ? null : (item.item_id || item.item?.id || null),
      name: item.name || '',
      description: item.description || '',
      itemType: resolveItemType(item),
      huntingTypeId: item.hunting_type_id,
      minDays: resolveItemType(item) === 'PACKAGE'
        ? (item.hunt_length_id || item.hunt_length?.id || item.min_days)
        : item.min_days,
      maxDays: item.max_days,
      pricingUnit: item.pricing_unit || 'FLAT',
      amount: item.amount || item.unit_amount || 0,
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

  const safariExtras = editItem.safari_extras || editItem.price_structure_safari_extras || []
  if (Array.isArray(safariExtras) && safariExtras.length > 0) {
    const existingExtraIds = new Set(
      form.lines
        .filter((line) => line.itemType === 'EXTRA')
        .map((line) => line.itemId)
        .filter((id) => id)
    )

    const extraLines = safariExtras
      .filter((extra: any) => {
        const id = extra.item_id || extra.item?.id || null
        return !id || !existingExtraIds.has(id)
      })
      .map((extra: any) => ({
        _key: crypto.randomUUID(),
        source: extra.item_id || extra.item?.id ? 'existing' : 'new',
        itemId: extra.item_id || extra.item?.id || null,
        name: extra.name || extra.item_name || extra.item?.name || '',
        description: extra.description || '',
        itemType: 'EXTRA',
        huntingTypeId: null,
        minDays: null,
        maxDays: null,
        pricingUnit: extra.pricing_unit || 'PER_ITEM',
        amount: extra.amount || extra.unit_amount || 0,
        salesPackageIds: [],
      }))

    form.lines = form.lines.concat(extraLines)
  }
}

// Store original sidebar state
const originalSidebarState = ref(false)

onMounted(async () => {
  // Save original sidebar state and collapse it
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true

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
    applyUsdDefaultCurrency()
  }

  loading.value = false
})

function applyUsdDefaultCurrency() {
  if (form.currencyId) return
  const usd = lookups.currencies.find((c) => {
    const code = (c.code || '').toString().toUpperCase()
    const name = (c.name || '').toString().toUpperCase()
    return code === 'USD' || name === 'USD' || name.includes('US DOLLAR')
  })
  if (usd?.id) {
    form.currencyId = usd.id
  }
}

// Restore sidebar state when leaving the page
onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

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
  padding: 20px 24px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
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
  margin: 10px 0 6px;
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
  margin-bottom: 24px;
  padding: 16px 24px;
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
  gap: 20px;
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
  padding: 18px 20px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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

.panel-title-text h3 {
  margin: 0;
  font-size: 16px;
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
  padding: 10px 18px;
  font-weight: 600;
}

.btn-add:hover:not(:disabled) {
  background: #1e40af;
}

/* Left Panel Form */
.form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafbfc;
}

.form-section {
  background: #ffffff;
  border-radius: var(--radius);
  padding: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.section-icon {
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field:last-child {
  margin-bottom: 0;
}

.lbl {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
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
  left: 12px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  padding-left: 38px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.input-wrapper input[type="date"] {
  padding-left: 12px;
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.date-row .field {
  min-width: 0;
  margin-bottom: 0;
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

.switch input:checked + .slider {
  background: #2563eb;
}

.switch input:checked + .slider:before {
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

.tabs-card {
  background: #ffffff;
  padding: 14px;
  border: 1px solid #e2e8f0;
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
  padding: 16px 20px;
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
  padding: 12px;
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
  padding: 12px;
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

.custom-name-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
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

.custom-name-toggle input:checked + .toggle-indicator {
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
  padding: 10px 14px;
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

.data-table th.col-item { width: 35%; }
.data-table th.col-type { width: 15%; }
.data-table th.col-hunting { width: 20%; }
.data-table th.col-days { width: 15%; text-align: center; }
.data-table th.col-action { width: 50px; }

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
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
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
  padding: 18px 20px;
  display: grid;
  gap: 12px;
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
</style>
