<template>
  <div class="ps-page inquiry-page">
    <main class="content">
      <!-- Page Header -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-clipboard-list"></i></span>
            SALES / <span>SALES INQUIRY</span>
          </div>
          <h1>{{ isEditMode ? 'Edit Sales Inquiry' : 'Create Sales Inquiry' }}</h1>
          <p class="subtitle">Configure your sales inquiry with customer details, packages, species, and extras.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="cancelWizard">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn ghost" type="button" @click="resetEditMode">
            <span class="btn-icon"><i class="fa fa-rotate-right"></i></span> Reset
          </button>
          <button class="btn primary" type="button" @click="submit" :disabled="saving || !canSubmit">
            <span class="btn-icon"><i class="fa fa-check"></i></span> {{ saving ? 'Saving...' : 'Submit Enquiry' }}
          </button>
        </div>
      </div>

      <!-- Two Column Layout -->
      <section class="grid two-col">
        <!-- LEFT: Customer Details -->
        <aside class="panel left-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-user"></i></div>
            <div class="panel-title-text">
              <h3>Sales Enquiry for {{ form.full_name || 'Customer' }}</h3>
              <p>Hunt details and configuration</p>
            </div>
          </div>

          <div class="form">
            <!-- Hunt Details Form -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-calendar-alt"></i></span>
                Hunt Details
              </div>
              
              <label class="field">
                <span class="lbl">Season <span class="req">*</span></span>
                <div class="input-wrapper">
                  <select v-model="form.season" @change="onSeasonChange(form.season)">
                    <option :value="null">Select Season...</option>
                    <option v-for="s in seasonItems" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Start Date <span class="req">*</span></span>
                <div class="input-wrapper vueform-date-wrapper">
                  <Vueform size="sm" :display-errors="false" :endpoint="false">
                    <DateElement
                      name="start_date"
                      :default="form.start_date"
                      @change="onStartDateChange"
                      :disabled="!form.season"
                      :display-format="'MMM D, YYYY'"
                      :value-format="'YYYY-MM-DD'"
                      placeholder="Select start date..."
                      :add-class="{ DateElement: { input: 'form-control' } }"
                    />
                  </Vueform>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Price Structure</span>
                <div class="input-wrapper">
                  <select v-model="form.priceStructureId" :disabled="!form.season" @change="onPriceStructureChange(form.priceStructureId)">
                    <option :value="null">Select Price Structure...</option>
                    <option v-for="p in priceStructureItems" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Hunting Package</span>
                <div class="input-wrapper">
                  <select v-model="form.priceListId" :disabled="!form.season || !form.priceStructureId || loadingPackageItems" @change="onPackageChange(form.priceListId)">
                    <option :value="null">Select Package...</option>
                    <option v-for="p in filteredPackageItems" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Number of Days <span class="req">*</span></span>
                <div class="input-wrapper">
                  <input type="number" v-model.number="form.no_of_days" min="1" placeholder="e.g., 10" @change="onDaysChange(form.no_of_days)" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Hunting Area</span>
                <div class="input-wrapper">
                  <select v-model="form.area">
                    <option :value="null">Select Hunting Area...</option>
                    <option v-for="a in gameAreaItems" :key="a.value" :value="a.value">{{ a.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Number of Hunters <span class="req">*</span></span>
                <div class="input-wrapper">
                  <input type="number" v-model.number="form.no_of_hunters" min="1" placeholder="e.g., 2" />
                </div>
              </label>
            </div>
          </div>
        </aside>

        <!-- RIGHT: Inquiry Configuration -->
        <section class="panel center-panel">
          <div class="panel-header center-header">
            <div class="panel-icon"><i class="fa fa-cog"></i></div>
            <div class="panel-title-text">
              <h3>Inquiry Configuration</h3>
              <p>Set up season, packages, species, and extras</p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="inner-card tabs-card">
            <div class="tabs">
              <button
                v-for="t in tabs"
                :key="t.key"
                class="tab"
                :class="{ active: activeTab === t.key }"
                @click="activeTab = t.key"
              >
                <span class="tab-icon"><i :class="t.icon"></i></span>
                <span class="tab-text">{{ t.label }}</span>
                <span class="tab-count" v-if="getTabCount(t.key) > 0">{{ getTabCount(t.key) }}</span>
              </button>
            </div>
          </div>

          <!-- Tab Content: Species -->
          <div v-show="activeTab === 'species'" class="inner-card content-card">
            <div class="content-body">
              <!-- Previous Experience -->
              <div class="section-divider first">
                <span><i class="fa fa-file-alt me-2"></i>Previous Experience</span>
              </div>
              <div class="form-row experience-requests-row">
                <label class="field">
                  <span class="lbl">Previous Experience</span>
                  <div class="input-wrapper">
                    <textarea v-model="form.prev_experience" rows="3" placeholder="Describe hunting experience..."></textarea>
                  </div>
                </label>

                <label class="field">
                  <span class="lbl">Special Requests</span>
                  <div class="input-wrapper">
                    <textarea
                      v-model="form.special_requests"
                      rows="3"
                      placeholder="Any special requests or requirements..."
                    ></textarea>
                  </div>
                </label>
              </div>

              <!-- Species Selection -->
              <div class="section-divider">
                <span><i class="fa fa-paw me-2"></i>Species Selection</span>
              </div>

              <!-- Add Species Form -->
              <div class="add-item-row">
                <select v-model="selectedSpeciesId" class="form-select" :disabled="!form.area || loadingAreaSpecies">
                  <option :value="null">Select Species...</option>
                  <option v-for="s in speciesItems" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
                <input type="number" v-model.number="speciesQuantity" min="1" placeholder="Qty" class="qty-input" />
                <button
                  type="button"
                  class="btn btn-primary"
                  style="background-color: #3b82f6; border-color: #3b82f6;"
                  :disabled="!form.area || loadingAreaSpecies"
                  @click="addSpeciesToList"
                >
                  <i class="fa fa-plus me-1"></i> Add
                </button>
              </div>

              <!-- Species List -->
              <div class="items-list">
                <div class="list-header">
                  <strong>Selected Species ({{ speciesObjects.length }})</strong>
                  <small class="text-muted">Click priority badge to toggle</small>
                </div>
                
                <div v-if="speciesObjects.length > 0" class="list-items">
                  <div v-for="(s, index) in speciesObjects" :key="index" class="list-item">
                    <div class="item-info">
                      <strong>{{ s.name }}</strong>
                      <span v-if="s.fromPackage" class="badge bg-info ms-2">from Package</span>
                      <span 
                        class="badge ms-2 cursor-pointer" 
                        :class="s.priority === 'MUST_HAVE' ? 'bg-danger' : 'bg-secondary'"
                        @click="togglePriority(index)"
                        style="cursor: pointer;">
                        {{ s.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE' }}
                      </span>
                    </div>
                    <div class="item-actions">
                      <button type="button" class="btn btn-sm btn-outline-primary" :disabled="s.quantity <= 1" @click="decrementQuantity(index)">
                        <i class="fa fa-minus"></i>
                      </button>
                      <span class="qty-badge">{{ s.quantity }}</span>
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="incrementQuantity(index)">
                        <i class="fa fa-plus"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="deleteFromStorage(index)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-list">
                  <i class="fa fa-paw fa-2x text-muted mb-2"></i>
                  <p>No species selected yet. Add species using the form above or select a package.</p>
                </div>
              </div>

              <!-- Upgrade Fees -->
              <div v-if="selectedUpgradeFees.length > 0" class="upgrade-fees-section">
                <div class="section-divider">
                  <span><i class="fa fa-arrow-up me-2"></i>Upgrade Fees</span>
                </div>
                <div class="fees-table">
                  <div class="fee-row header">
                    <span>Species</span>
                    <span>Upgrade Fee</span>
                  </div>
                  <div v-for="fee in selectedUpgradeFees" :key="fee.id" class="fee-row">
                    <span>{{ fee.species_name || fee.species?.name || 'Unknown' }}</span>
                    <span class="text-warning fw-bold">{{ fee.currency_symbol || '$' }}{{ fee.amount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content: Extras -->
          <div v-show="activeTab === 'extras'" class="inner-card content-card">
            <div class="content-body">
              <!-- Budget Section -->
              <div class="section-divider first">
                <span><i class="fa fa-dollar-sign me-2"></i>Budget Information</span>
              </div>
              <div class="form-row">
                <label class="field">
                  <span class="lbl">Budget Minimum (USD)</span>
                  <div class="input-wrapper">
                    <CurrencyInput v-model="form.budget_min" currency="USD" placeholder="e.g., 5,000" />
                  </div>
                </label>
                <label class="field">
                  <span class="lbl">Budget Maximum (USD)</span>
                  <div class="input-wrapper">
                    <CurrencyInput v-model="form.budget_max" currency="USD" placeholder="e.g., 15,000" />
                  </div>
                </label>
              </div>
              <div v-if="form.budget_min && form.budget_max" class="info-alert">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Budget Range:</strong> ${{ form.budget_min.toLocaleString() }} - ${{ form.budget_max.toLocaleString() }}
              </div>

              <!-- Safari Extras -->
              <div class="section-divider">
                <span><i class="fa fa-compass me-2"></i>Safari Extras ({{ selectedSafariExtras.length }})</span>
              </div>

              <!-- Add Safari Extra Form -->
              <div class="add-item-row">
                <select v-model="selectedSafariExtraId" class="form-select">
                  <option :value="null">Select Safari Extra...</option>
                  <option v-for="item in safariExtrasItems" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
                <button type="button" class="btn btn-primary" style="background-color: #3b82f6; border-color: #3b82f6;" @click="addSafariExtra">
                  <i class="fa fa-plus me-1"></i> Add
                </button>
              </div>

              <!-- Safari Extras List -->
              <div class="items-list">
                <div class="list-header">
                  <strong>Selected Safari Extras ({{ selectedSafariExtras.length }})</strong>
                  <small class="text-muted">Click priority badge to toggle</small>
                </div>
                
                <div v-if="selectedSafariExtras.length > 0" class="list-items">
                  <div v-for="(extra, index) in selectedSafariExtras" :key="index" class="list-item">
                    <div class="item-info">
                      <strong>{{ extra.name }}</strong>
                      <span v-if="extra.fromPackage" class="badge bg-info ms-2">from Package</span>
                      <span 
                        class="badge ms-2 cursor-pointer" 
                        :class="extra.priority === 'MUST_HAVE' ? 'bg-danger' : 'bg-secondary'"
                        @click="toggleSafariExtraPriority(index)"
                        style="cursor: pointer;">
                        {{ extra.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE' }}
                      </span>
                      <small class="text-muted ms-2" v-if="extra.description">{{ extra.description }}</small>
                    </div>
                    <div class="item-actions">
                      <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="removeSafariExtra(index)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-list">
                  <i class="fa fa-compass fa-2x text-muted mb-2"></i>
                  <p>No safari extras selected yet. Add safari extras using the form above.</p>
                </div>
              </div>

              <!-- Trophy Fees -->
              <div v-if="trophyFees.length > 0">
                <div class="section-divider">
                  <span><i class="fa fa-trophy me-2"></i>Trophy Fees ({{ trophyFees.length }})</span>
                </div>
                <div class="fees-table">
                  <div class="fee-row header">
                    <span>Species</span>
                    <span>Sequence</span>
                    <span>Fee</span>
                  </div>
                  <div v-for="(fee, index) in trophyFees" :key="`trophy-${fee.id}-${index}`" class="fee-row">
                    <span>{{ fee.species_name || 'Unknown' }}</span>
                    <span><span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span></span>
                    <span class="fw-semibold">{{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content: More Details -->
          <!-- Tab Content: Review -->
          <div v-show="activeTab === 'review'" class="inner-card content-card">
            <div class="content-body">
              <!-- Remarks -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-comment text-primary me-2"></i>
                  <h6>Enquiry Remarks</h6>
                </div>
                <textarea v-model="form.remarks" class="form-control mb-3" rows="3" placeholder="Add any additional remarks or notes for this enquiry (optional)..."></textarea>
              </div>

              <!-- Customer Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-user text-primary me-2"></i>
                  <h6>Customer Information</h6>
                </div>
                <div class="review-grid">
                  <div class="review-item"><span class="label">Full Name:</span><span class="value">{{ form.full_name || 'N/A' }}</span></div>
                  <div class="review-item"><span class="label">Country:</span><span class="value">{{ getItemLabel(countryItems, form.country) }}</span></div>
                  <div class="review-item"><span class="label">Nationality:</span><span class="value">{{ getItemLabel(nationalityItems, form.nationality) }}</span></div>
                  <div class="review-item"><span class="label">Email:</span><span class="value">{{ form.email || 'N/A' }}</span></div>
                  <div class="review-item"><span class="label">Phone:</span><span class="value">{{ form.phone || 'N/A' }}</span></div>
                  <div class="review-item"><span class="label">Address:</span><span class="value">{{ form.address || 'N/A' }}</span></div>
                </div>
              </div>

              <!-- Season & Package Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-box text-primary me-2"></i>
                  <h6>Season & Package</h6>
                </div>
                <div class="review-grid">
                  <div class="review-item"><span class="label">Season:</span><span class="value">{{ getItemLabel(seasonItems, form.season) }}</span></div>
                  <div class="review-item"><span class="label">Package:</span><span class="value">{{ getItemLabel(packageItems, form.priceListId) || 'No package selected' }}</span></div>
                </div>
              </div>

              <!-- Schedule Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-calendar text-primary me-2"></i>
                  <h6>Schedule & Hunt Party</h6>
                </div>
                <div class="review-grid">
                  <div class="review-item"><span class="label">Start Date:</span><span class="value">{{ formatReviewDate(form.start_date) }}</span></div>
                  <div class="review-item"><span class="label">Days:</span><span class="value">{{ form.no_of_days || 'N/A' }}</span></div>
                  <div class="review-item"><span class="label">End Date:</span><span class="value text-info">{{ formatReviewDate(calculatedEndDate) }}</span></div>
                  <div class="review-item"><span class="label">Hunting Area:</span><span class="value">{{ form.area || 'N/A' }}</span></div>
                  <div class="review-item"><span class="label">Participants:</span><span class="value">{{ form.no_of_participants || 1 }}</span></div>
                  <div class="review-item"><span class="label">Experience:</span><span class="value">{{ form.prev_experience || 'N/A' }}</span></div>
                </div>
              </div>

              <!-- Species Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-paw text-primary me-2"></i>
                  <h6>Selected Species ({{ speciesObjects.length }})</h6>
                </div>
                <div v-if="speciesObjects.length > 0" class="species-badges">
                  <span v-for="(s, index) in speciesObjects" :key="index" class="badge" :class="s.fromPackage ? 'bg-info' : 'bg-primary'">
                    {{ s.name }} (x{{ s.quantity }})
                  </span>
                </div>
                <span v-else class="text-muted">No species selected</span>
              </div>

              <!-- Safari Extras Summary -->
              <div v-if="selectedSafariExtras.length > 0" class="review-section">
                <div class="review-header">
                  <i class="fa fa-hiking text-primary me-2"></i>
                  <h6>Safari Extras ({{ selectedSafariExtras.length }})</h6>
                </div>
                <div class="extras-badges">
                  <div v-for="extra in selectedSafariExtras" :key="extra.id" class="extra-badge">
                    <span class="extra-badge-name">{{ extra.name || 'Safari Extra' }}</span>
                    <span class="extra-badge-price">{{ extra.currency_code || 'USD' }} {{ parseFloat(extra.amount || 0).toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Trophy Fees Summary -->
              <div v-if="trophyFees.length > 0" class="review-section">
                <div class="review-header">
                  <i class="fa fa-trophy text-warning me-2"></i>
                  <h6>Trophy Fees ({{ trophyFees.length }})</h6>
                </div>
                <div class="fees-table compact">
                  <div class="fee-row header">
                    <span>Species</span>
                    <span>Sequence</span>
                    <span>Fee</span>
                  </div>
                  <div v-for="(fee, index) in trophyFees" :key="`trophy-review-${fee.id}-${index}`" class="fee-row">
                    <span>{{ fee.species_name || 'Unknown' }}</span>
                    <span><span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span></span>
                    <span class="fw-semibold">{{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>



<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useAuthStore } from '@/stores/auth'
import { useAppOptionStore } from '@/stores/app-option'
import CurrencyInput from '@/components/CurrencyInput.vue'

const props = defineProps<{ 
  editRow?: any | null
  customerData?: any | null
}>()
const emit = defineEmits<{ (e: 'cancel'): void; (e: 'saved'): void }>()

const vueformRef = ref<any>(null)
const { init } = useToast()
const appOptionStore = useAppOptionStore()
const originalSidebarState = ref<boolean>(false)

// Form state - reactive object that syncs with Vueform
const form = reactive({
  id: null as any,
  full_name: '',
  nick_name: '',
  country: null as any,
  nationality: null as any,
  email: '',
  phone: '',
  phone_additional: '',
  address: '',
  no_of_hunters: 1,
  no_of_observers: 0,
  no_of_participants: 1,
  priceListId: null as any,
  priceStructureId: null as any,
  no_of_days: 0,
  no_of_companions: 0,
  species: null as any,
  quantity: 0,
  area: null as any,
  season: null as any,
  start_date: null as any,
  remarks: '',
  prev_experience: '',
  budget_min: null as number | null,
  budget_max: null as number | null,
  payment_method_id: null as number | null,
  special_requests: '',
})

// Data sources
const countries = ref<any[]>([])
const nationality = ref<any[]>([])
const speciesOptions = ref<any[]>([])
const selectedAreaSpecies = ref<any[]>([])
const areaSpeciesLoaded = ref(false)
const speciesObjects = ref<any[]>([])
const areasOptions = ref<any[]>([])
const seasonsOptions = ref<any[]>([])
const packagesOptions = ref<any[]>([])
const priceStructuresOptions = ref<any[]>([])
const existingCustomersOptions = ref<any[]>([])

const saving = ref(false)
const loadingPackageItems = ref(false)
const loadingCustomers = ref(false)
const loadingAreaSpecies = ref(false)

const seasonMinDate = ref<Date | null>(null)
const seasonMaxDate = ref<Date | null>(null)
const bookedDates = ref<Array<{ start_date: string; end_date: string; client_name: string; area_id: number }>>([])
const loadingBookedDates = ref(false)
const dateConflictWarning = ref('')

// Tab navigation state
const activeTab = ref('species')
const selectedSpeciesId = ref<number | null>(null)
const speciesQuantity = ref(1)

const tabs = [
  { key: 'species', label: 'Species', icon: 'fa fa-paw' },
  { key: 'extras', label: 'Extras', icon: 'fa fa-hiking' },
  { key: 'review', label: 'Review', icon: 'fa fa-clipboard-check' }
]

// Get count for tab badge
const getTabCount = (tabKey: string): number => {
  switch (tabKey) {
    case 'extras':
      return selectedSafariExtras.value.length
    default:
      return 0
  }
}

const isEditMode = ref(false)
const editingInquiryId = ref<number | null>(null)

const selectedSafariExtras = ref<any[]>([])
const safariExtrasOptions = ref<any[]>([])
const selectedSafariExtraId = ref<number | null>(null)
const trophyFees = ref<any[]>([])
const companionCosts = ref<any[]>([])
const selectedPackageDetail = ref<any>(null)

const createQuotation = ref(false)
const quotationForm = reactive({
  confirmation_date: null as Date | null,
  hunting_license: '',
  remarks: '',
  installments: [] as { narration: string; amount_due: number; due_days_type: string; due_days: number }[],
})

const dueDaysTypeOptions = [
  { value: 'upon_booking', text: 'Upon Booking' },
  { value: 'before_arrival', text: 'Before Arrival' },
  { value: 'on_arrival', text: 'On Arrival' },
  { value: 'after_hunt', text: 'After Hunt' },
]

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const salesPackagesSpecies = computed(() => settingsStore.salesPackagesSpecies)
const huntLengths = ref<any[]>([])

// Computed items for Vueform select elements
const countryItems = computed(() => 
  countries.value.map((c: any) => ({ value: c.value, label: c.text }))
)

const nationalityItems = computed(() => 
  nationality.value.map((n: any) => ({ value: n.value, label: n.text }))
)

const seasonItems = computed(() => 
  seasonsOptions.value.map((s: any) => ({ 
    value: s.value, 
    label: s.selfItem ? `${s.text} - ${formatDateRange(s.selfItem.start_at, s.selfItem.end_at)}` : s.text,
    selfItem: s.selfItem
  }))
)

const priceStructureItems = computed(() =>
  priceStructuresOptions.value.map((p: any) => ({
    value: p.value,
    label: p.text,
    selfItem: p.selfItem
  }))
)

const packageItems = computed(() => 
  packagesOptions.value.map((pkg: any) => ({
    value: pkg.value,
    label: pkg.selfItem 
      ? `${pkg.text}, ${pkg.selfItem?.price_structure?.location_name || 'N/A'}, ${pkg.selfItem?.hunting_type_name || 'N/A'}, ${pkg.selfItem?.hunt_length_days || 0} days, ${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || '0'}`
      : pkg.text,
    selfItem: pkg.selfItem
  }))
)

const areaItems = computed(() => 
  areasOptions.value.map((a: any) => ({ value: a.value, label: a.text }))
)

const gameAreaItems = computed(() => 
  areasOptions.value
    // Accept both "game" and "GAME" and also check selfItem.type when available
    .filter((a: any) => (a.type && String(a.type).toLowerCase() === 'game') || (a.selfItem && String(a.selfItem.type).toLowerCase() === 'game'))
    .map((a: any) => ({
      value: a.value,
      // For GAME locations prefer the hunting area name and append the location code when available
      label: (a.selfItem && String(a.selfItem.type).toLowerCase() === 'game' && a.selfItem.hunting_areas && a.selfItem.hunting_areas.length > 0)
        ? `${a.selfItem.hunting_areas[0].name}${a.selfItem.code ? ` (${a.selfItem.code})` : ''}`
        : a.text,
      selfItem: a.selfItem
    }))
)

const speciesItems = computed(() => {
  const useAreaSpecies = !!form.area && areaSpeciesLoaded.value
  const source = useAreaSpecies ? selectedAreaSpecies.value : speciesOptions.value
  return source.map((s: any) => ({ value: s.value, label: s.text }))
})

const safariExtrasItems = computed(() => 
  safariExtrasOptions.value.map((item: any) => ({ 
    value: item.id, 
    label: `${item.name} - ${item.description || ''}`,
    item: item
  }))
)

const existingCustomerItems = computed(() => 
  existingCustomersOptions.value.map((c: any) => ({ 
    value: c.value, 
    label: `${c.text} - ${c.selfItem?.email || 'N/A'} ◆ ${c.selfItem?.country || 'N/A'}`,
    selfItem: c.selfItem
  }))
)

const selectedPackageInfo = computed(() => {
  if (!form.priceListId) return null
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  if (!pkg?.selfItem) return null
  return {
    area: pkg.selfItem?.price_structure?.location_name || 'N/A',
    huntingType: pkg.selfItem?.hunting_type_name || 'N/A',
    duration: pkg.selfItem?.hunt_length_days || 0,
    amount: `${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || 'N/A'}`
  }
})

const selectedUpgradeFees = computed(() => {
  if (!form.priceListId) return []
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  return pkg?.selfItem?.upgrade_fees || []
})

const bookedDatesForSelectedSeason = computed(() => bookedDates.value)

const currentUserId = computed(() => {
  const rawId = authStore.user?.id
  const parsed = rawId ? Number(rawId) : null
  return Number.isFinite(parsed) ? parsed : null
})

const huntDuration = computed(() => form.no_of_days || 0)

const calculatedEndDate = computed(() => {
  if (!form.start_date || !form.no_of_days) return null
  const start = new Date(form.start_date)
  const end = new Date(start)
  end.setDate(start.getDate() + Number(form.no_of_days) - 1)
  return end.toISOString().split('T')[0]
})

const quotationTotalAmount = computed(() =>
  quotationForm.installments.reduce((sum, inst) => sum + (Number(inst.amount_due) || 0), 0),
)

const totalCompanionCost = computed(() => {
  if (companionCosts.value.length === 0) return 0
  const rate = parseFloat(companionCosts.value[0]?.amount || 0)
  const days = Number(form.no_of_days) || 0
  const participants = Number(form.no_of_participants) || 0
  return rate * days * participants
})

// Helper function to get label from items array
const getItemLabel = (items: any[], value: any) => {
  if (!value) return 'N/A'
  const item = items.find((i: any) => i.value === value)
  return item?.label || 'N/A'
}

const getPackagePriceStructureId = (pkg: any) =>
  pkg?.selfItem?.price_structure_id ||
  pkg?.selfItem?.price_structure?.id ||
  pkg?.selfItem?.price_structure_detail?.price_structure_id ||
  pkg?.selfItem?.price_structure_detail?.price_structure?.id ||
  null

const getAreaOptionFromSelection = (selection: any) => {
  if (!selection) return null
  if (typeof selection === 'number') {
    return areasOptions.value.find((a: any) => a.value === selection) || null
  }
  const byText = areasOptions.value.find((a: any) => a.text === selection)
  if (byText) return byText
  return areasOptions.value.find((a: any) =>
    Array.isArray(a.selfItem?.hunting_areas) &&
    a.selfItem.hunting_areas.some((h: any) => h?.name === selection)
  ) || null
}

const getHuntingAreaIdFromOption = (areaOption: any, selection: any) => {
  if (!areaOption?.selfItem?.hunting_areas) return null
  const list = areaOption.selfItem.hunting_areas
  if (typeof selection === 'string') {
    const match = list.find((h: any) => h?.name === selection)
    if (match?.id) return match.id
  }
  return list[0]?.id || null
}

const normalizeAreaSpecies = (list: any[]) =>
  (list || []).map((s: any) => ({
    value: s.id,
    text: s.name,
    scientific_name: s.scientific_name || ''
  }))

const loadAreaSpeciesForWizard = async (selection: any) => {
  const areaOption = getAreaOptionFromSelection(selection)
  const huntingAreaId = getHuntingAreaIdFromOption(areaOption, selection)

  if (!areaOption || !huntingAreaId) {
    selectedAreaSpecies.value = []
    areaSpeciesLoaded.value = false
    return
  }

  loadingAreaSpecies.value = true
  areaSpeciesLoaded.value = false
  try {
    const response = await axios.get(`${apiBaseUrl}/locations/hunting-areas/${huntingAreaId}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const list = response.data?.data?.species || []
    selectedAreaSpecies.value = normalizeAreaSpecies(list)
    areaSpeciesLoaded.value = true
  } catch (error) {
    console.error('Error loading area species:', error)
    selectedAreaSpecies.value = []
    areaSpeciesLoaded.value = false
  } finally {
    loadingAreaSpecies.value = false
  }
}

// Customer data is now received from CustomerSelectionModal via props
// No need for customer type change handlers here

const onSeasonChange = async (value: any) => {
  form.season = value
  dateConflictWarning.value = ''
  form.start_date = null
  form.no_of_days = 0

  if (!value) {
    seasonMinDate.value = null
    seasonMaxDate.value = null
    bookedDates.value = []
    return
  }

  const season = seasonsOptions.value.find((s: any) => s.value === value)
  if (season?.selfItem) {
    if (season.selfItem.start_at) seasonMinDate.value = new Date(season.selfItem.start_at)
    if (season.selfItem.end_at) seasonMaxDate.value = new Date(season.selfItem.end_at)
  }

  await fetchBookedDates(value)
}

const onPackageChange = async (value: any) => {
  form.priceListId = value
  
  if (!value) {
    speciesObjects.value = []
    return
  }
  
  await populateFormFromPackage()
}

const onPriceStructureChange = (value: any) => {
  form.priceStructureId = value
  if (form.priceListId) {
    form.priceListId = null
    speciesObjects.value = []
    trophyFees.value = []
    companionCosts.value = []
    selectedPackageDetail.value = null
  }
  if (vueformRef.value) {
    vueformRef.value.update({
      priceStructureId: form.priceStructureId,
      priceListId: form.priceListId
    })
  }
}

const onStartDateChange = (newValue: any) => {
  // Vueform @change event passes the value directly
  const dateValue = newValue?.target?.value ?? newValue
  form.start_date = dateValue || null
  checkBookedDateConflict()
}

const onDaysChange = (newValue: any) => {
  form.no_of_days = Number(newValue) || 0
  checkBookedDateConflict()
}

const onParticipantsChange = (newValue: any) => {
  form.no_of_participants = Number(newValue) || 1
}

// Sync Vueform data with local form state
const syncFormData = () => {
  if (!vueformRef.value) return
  const data = vueformRef.value.data
  
  form.full_name = data.full_name || ''
  form.nick_name = data.nick_name || ''
  form.country = data.country || null
  form.nationality = data.nationality || null
  form.email = data.email || ''
  form.phone = data.phone || ''
  form.phone_additional = data.phone_additional || ''
  form.address = data.address || ''
  form.season = data.season || null
  form.priceListId = data.priceListId || null
  form.priceStructureId = data.priceStructureId || null
  form.start_date = data.start_date || null
  form.no_of_days = Number(data.no_of_days) || 0
  form.area = data.area || null
  form.no_of_participants = Number(form.no_of_hunters) || Number(data.no_of_participants) || 1
  form.prev_experience = data.prev_experience || ''
  form.special_requests = data.special_requests || ''
  createQuotation.value = data.createQuotation || false
}

// Handle form submission from Vueform
const handleSubmit = async (formData: any, form$: any) => {
  syncFormData()
  await submit()
}

// Add species to list
const addSpeciesToList = () => {
  if (!form.area) {
    init({ message: 'Please select a hunting area to load species.', color: 'warning' })
    return
  }
  if (loadingAreaSpecies.value) {
    init({ message: 'Species are still loading for this area. Please wait.', color: 'warning' })
    return
  }
  if (!selectedSpeciesId.value) {
    init({ message: 'Please select a species.', color: 'warning' })
    return
  }

  const quantity = Number(speciesQuantity.value) || 1

  if (quantity <= 0) {
    init({ message: 'Quantity must be greater than zero.', color: 'warning' })
    return
  }

  const exists = speciesObjects.value.some((species: { species_id: any }) => species.species_id === selectedSpeciesId.value)
  if (!exists) {
    const source = !!form.area && areaSpeciesLoaded.value ? selectedAreaSpecies.value : speciesOptions.value
    const speciesOption = source.find((s: any) => s.value === selectedSpeciesId.value)
    speciesObjects.value.push({
      species_id: selectedSpeciesId.value,
      name: speciesOption?.text || 'Unknown',
      quantity: quantity,
      priority: 'NICE_TO_HAVE',
      notes: '',
      fromPackage: false,
    })
    // Reset selection
    selectedSpeciesId.value = null
    speciesQuantity.value = 1
    init({ message: `Added "${speciesOption?.text || 'Unknown'}" to species list`, color: 'success' })
  } else {
    init({ message: 'This species is already added. Update the quantity instead.', color: 'warning' })
  }
}

const contactForm = reactive({
  id: null as any,
  client_id: null as any,
  contact: '',
  contact_type: null as any,
  contactable: false,
})

const contactsTypes = ref<any[]>([])

const currentStep = ref(0)
const wizardSteps = [
  { label: 'Personal Info' },
  { label: 'Season, Package, Dates & Species' },
  { label: 'Safari Extras & Trophy Fees' },
  { label: 'Review' },
]

const isStep1Complete = computed(
  () => !!(form.full_name && form.country && form.nationality && form.email && form.phone && form.address),
)

const isStep2Complete = computed(
  () => !!(form.season && form.start_date && form.no_of_days > 0 && speciesObjects.value.length > 0),
)

const isStep3Complete = computed(() => currentStep.value >= 3)

const hasInput = (value: any) => {
  if (typeof value === 'string') return value.trim().length > 0
  return !!value
}

const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 0:
      // Customer data is pre-validated by CustomerSelectionModal, just check entity_id exists
      return !!(props.customerData?.entity_id)
    case 1:
      return (
        hasInput(form.season) &&
        hasInput(form.start_date) &&
        !!(form.no_of_days && form.no_of_days > 0) &&
        hasInput(form.area) &&
        !!(huntDuration.value && huntDuration.value > 0) &&
        speciesObjects.value.length > 0
      )
    case 2:
      return true
    default:
      return false
  }
})

// Validation for submit button
const canSubmit = computed(() => {
  // Customer info may come either from selected customer (props.customerData.entity_id)
  // or from filled form fields (full_name, country, nationality, email)
  const hasCustomerInfo = !!props.customerData?.entity_id || (
    hasInput(form.full_name) &&
    hasInput(form.country) &&
    hasInput(form.nationality) &&
    hasInput(form.email)
  )

  return (
    hasCustomerInfo &&
    hasInput(form.season) &&
    hasInput(form.start_date) &&
    // Area may be optional in some cases, but require when available
    // (keep existing behavior for now)
    hasInput(form.area) &&
    form.no_of_days > 0 &&
    speciesObjects.value.length > 0
  )
})

const filteredPackagesOptions = computed(() => {
  if (!form.season) return []
  if (!form.priceStructureId) return []
  return packagesOptions.value.filter((pkg: any) => {
    const structureId = getPackagePriceStructureId(pkg)
    return String(structureId || '') === String(form.priceStructureId || '')
  })
})

const filteredPackageItems = computed(() =>
  filteredPackagesOptions.value.map((pkg: any) => ({
    value: pkg.value,
    label: pkg.selfItem 
      ? `${pkg.text}, ${pkg.selfItem?.price_structure?.location_name || 'N/A'}, ${pkg.selfItem?.hunting_type_name || 'N/A'}, ${pkg.selfItem?.hunt_length_days || 0} days, ${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || '0'}`
      : pkg.text,
    selfItem: pkg.selfItem
  }))
)

const speciesList = computed(() => salesPackagesSpecies.value)

const resetQuotationForm = () => {
  createQuotation.value = false
  quotationForm.confirmation_date = null
  quotationForm.hunting_license = ''
  quotationForm.remarks = ''
  quotationForm.installments = []
}

const clearCustomerInformation = () => {
  form.full_name = ''
  form.nick_name = ''
  form.email = ''
  form.phone = ''
  form.phone_additional = ''
  form.address = ''
  form.country = null
  form.nationality = null
  // Also update Vueform if available
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: '',
      email: '',
      phone: '',
      phone_additional: '',
      address: '',
      country: null,
      nationality: null
    })
  }
}

const resetEditMode = () => {
  isEditMode.value = false
  editingInquiryId.value = null
  speciesObjects.value = []
  selectedSafariExtras.value = []
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null
  resetQuotationForm()
  currentStep.value = 0
  form.remarks = ''
  form.prev_experience = ''
  form.budget_min = null
  form.budget_max = null
  form.payment_method_id = null
  form.special_requests = ''
  form.priceStructureId = null
  // Reset Vueform
  if (vueformRef.value) {
    vueformRef.value.reset()
  }
}

const cancelWizard = () => {
  resetEditMode()
  emit('cancel')
}

const nextStep = () => {
  if (currentStep.value < wizardSteps.length - 1 && canProceedToNextStep.value) {
    currentStep.value++
  } else if (!canProceedToNextStep.value) {
    showStepValidationError()
  }
}

const previousStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const goToStep = (stepIndex: number) => {
  if (stepIndex <= currentStep.value) currentStep.value = stepIndex
}

const showStepValidationError = () => {
  const stepMessages: { [key: number]: string } = {
    0: 'Please fill in all customer information fields (Name, Country, Nationality, Email, Phone, Address).',
    1: 'Please select season, dates, hunting area, enter the number of days, and add at least one species.',
  }
  init({ message: stepMessages[currentStep.value] || 'Please complete all required fields.', color: 'warning' })
}

const formatDate = (dateString: string | any): string => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const formatReviewDate = (date: any): string => {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const formatBookingDateRange = (booking: any) => {
  return `${formatReviewDate(booking.start_date)} - ${formatReviewDate(booking.end_date)}`
}

const formatDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 'N/A'
  const start = new Date(startDate)
  const end = new Date(endDate)
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${startFormatted} - ${endFormatted}`
}

const getSequenceLabel = (sequence: number) => {
  const labels: { [key: number]: string } = { 1: '1st', 2: '2nd', 3: '3rd' }
  return labels[sequence] || `${sequence}th`
}

const getCountries = async () => {
  const response = await axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_COUNTRIES_URL,
    headers: { 'Content-Type': 'application/json' },
  })
  if (response.status === 200) {
    countries.value = response.data.map((country: any) => ({ value: country.id, text: country.name }))
  }
}


const getNationalities = async () => {
  const response = await axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_NATIONALITIES_URL,
    headers: { 'Content-Type': 'application/json' },
  })
  if (response.status === 200) {
    nationality.value = response.data.map((nat: any) => ({ value: nat.id, text: nat.name }))
  }
}



const apiBaseUrl = (() => {
  const base = import.meta.env.VITE_APP_BASE_URL || ''
  return base.replace(/\/+$/, '')
})()

const getSpecies = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/species/`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const raw = response.data?.data ?? response.data ?? []
    const dataArray = Array.isArray(raw) ? raw : []
    // Map species directly from the species endpoint
    speciesOptions.value = dataArray
      .filter((species: any) => species.is_active !== false) // Only include active species
      .map((species: any) => ({ 
        value: species.id, 
        text: species.name,
        scientific_name: species.scientific_name || ''
      }))
  } catch (error) {
    console.error('Error loading species:', error)
  }
}

const getSafariExtras = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/items?subtype=SAFARI_EXTRA`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const raw = response.data?.data ?? response.data ?? []
    safariExtrasOptions.value = Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('Error loading safari extras:', error)
  }
}

const getAreas = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/locations`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const raw = response.data?.data ?? response.data ?? []
    const dataArray = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
    areasOptions.value = dataArray.map((item: any) => ({ value: item.id, text: item.name, type: item.type, selfItem: item }))
  } catch (error) {
    // Error handled silently
  }
}

const getSeasonList = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/seasons`, {
      headers: { 'Content-Type': 'application/json' },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Handle different response structures
    const seasonsData = response.data?.data || response.data || []

    if (!Array.isArray(seasonsData)) {
      console.error('Seasons data is not an array:', seasonsData)
      return
    }

    seasonsOptions.value = seasonsData
      .filter((item: any) => {
        if (!item.end_at) return true
        const endDate = new Date(item.end_at)
        endDate.setHours(23, 59, 59, 999)
        return endDate >= today
      })
      .map((item: any) => ({ value: item.id, text: item.name, selfItem: item }))
  } catch (error) {
    console.error('Error fetching seasons:', error)
  }
}


const getPriceStructures = async () => {
  try {
    const response = await priceListStore.getPriceStructures()
    if (response.status === 200) {
      const data = response.data?.data || response.data || []
      priceStructuresOptions.value = data.map((item: any) => ({
        value: item.id,
        text: `PS-${item.id} - ${item.area?.name || item.area_name || 'N/A'} (${item.start_date || 'N/A'})`,
        selfItem: item
      }))
    }
  } catch (error) {
    console.error('Error loading price structures:', error)
  }
}

const getPL = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/price-items`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const dataArray = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data) ? response.data : []
    
    packagesOptions.value = dataArray.map((item: any) => ({
      value: item.id,
      text: item.package_name || item.name || item.code || `Package #${item.id}`,
      selfItem: item,
    }))
  } catch (error) {
    console.error('Error loading packages:', error)
  }
}

const getExistingCustomers = async () => {
  loadingCustomers.value = true
  try {
    const response = await salesEnquiryService.list()
    if (response.success) {
      const dataArray = Array.isArray(response.data) ? response.data : []
      const customersMap = new Map()

      dataArray.forEach((item: any) => {
        const entity = item.entity
        if (entity && entity.id && !customersMap.has(entity.id)) {
          let email = ''
          let phone = ''
          let address = ''

          if (entity.contacts && Array.isArray(entity.contacts)) {
            entity.contacts.forEach((contact: any) => {
              const contactType = String(contact.type || '').toLowerCase()
              if (contactType === 'email' || contact.contact_type_id === 1) {
                email = contact.contact || ''
              } else if (contactType === 'phone_number' || contactType === 'phone' || contact.contact_type_id === 2) {
                phone = contact.contact || ''
              } else if (contactType === 'address' || contact.contact_type_id === 3) {
                address = contact.contact || ''
              }
            })
          }

          customersMap.set(entity.id, {
            value: entity.id,
            text: entity.full_name || 'Unknown',
            selfItem: {
              ...entity,
              email,
              phone,
              address,
              country: entity.country || entity.country_name,
              nationality: entity.nationality || entity.nationality_name,
            },
          })
        }
      })

      existingCustomersOptions.value = Array.from(customersMap.values())
    }
  } catch (error) {
    console.error('Error loading existing customers:', error)
  } finally {
    loadingCustomers.value = false
  }
}

const populateFormFromCustomer = (customer: any) => {
  if (!customer || !customer.selfItem) return
  const entity = customer.selfItem

  form.full_name = entity.full_name || ''
  form.email = entity.email || ''
  form.phone = entity.phone || ''
  form.address = entity.address || ''

  let countryValue = null
  const countryId = entity.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) {
      form.country = countryOption.value
      countryValue = countryOption.value
    }
  } else if (entity.country) {
    const countryOption = countries.value.find((c: any) => c.text === entity.country)
    if (countryOption) {
      form.country = countryOption.value
      countryValue = countryOption.value
    }
  }

  let nationalityValue = null
  const nationalityId = entity.nationality_id
  if (nationalityId) {
    const nationalityOption = nationality.value.find((n: any) => n.value === nationalityId)
    if (nationalityOption) {
      form.nationality = nationalityOption.value
      nationalityValue = nationalityOption.value
    }
  } else if (entity.nationality) {
    const nationalityOption = nationality.value.find((n: any) => n.text === entity.nationality)
    if (nationalityOption) {
      form.nationality = nationalityOption.value
      nationalityValue = nationalityOption.value
    }
  }

  // Update Vueform with new values
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      country: countryValue,
      nationality: nationalityValue
    })
  }
}

const onSeasonSelected = async (selectedSeason: any) => {
  dateConflictWarning.value = ''
  form.start_date = null
  form.no_of_days = 0

  if (!selectedSeason || !selectedSeason.selfItem) {
    seasonMinDate.value = null
    seasonMaxDate.value = null
    bookedDates.value = []
    return
  }

  const seasonData = selectedSeason.selfItem
  if (seasonData.start_at) seasonMinDate.value = new Date(seasonData.start_at)
  if (seasonData.end_at) seasonMaxDate.value = new Date(seasonData.end_at)

  await fetchBookedDates(selectedSeason.value)
}

const fetchBookedDates = async (seasonId: number, areaId?: number) => {
  loadingBookedDates.value = true
  bookedDates.value = []

  try {
    const params = new URLSearchParams()
    if (seasonId) params.append('season_id', seasonId.toString())
    if (areaId) params.append('area_id', areaId.toString())
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await axios.get(`/sales/booked-dates${queryString}`)

    if (response.status === 200) {
      const dataArray = Array.isArray(response.data) ? response.data : response.data.data || []
      bookedDates.value = dataArray.map((item: any) => ({
        start_date: item.start_date,
        end_date: item.end_date,
        client_name: item.client_name || item.entity?.full_name || 'Unknown Client',
        area_id: item.area_id,
      }))
    }
  } catch (error) {
    console.error('Error fetching booked dates:', error)
  } finally {
    loadingBookedDates.value = false
  }
}

const checkBookedDateConflict = () => {
  dateConflictWarning.value = ''
  if (!form.start_date || !form.no_of_days || form.no_of_days <= 0) return

  const start = new Date(form.start_date)
  const endDate = calculatedEndDate.value
  if (!endDate) return
  const end = new Date(endDate)

  const conflict = bookedDates.value.find((booking: any) => {
    const bStart = new Date(booking.start_date)
    const bEnd = new Date(booking.end_date)
    return start <= bEnd && end >= bStart
  })

  if (conflict) {
    dateConflictWarning.value = `Selected dates overlap with booking for ${conflict.client_name}`
  }
}

const populateFormFromPackage = async () => {
  if (!form.priceListId) return
  
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  if (!pkg?.selfItem) return
  
  const pkgData = pkg.selfItem
  const priceStructureDetailId = form.priceListId

  // Reset all package-related data
  speciesObjects.value = []
  // Safari extras are never loaded from package, so no need to filter
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null

  // Get area from price_structure.location_name and set it directly as the display value
  const areaName = pkgData?.price_structure?.location_name
  if (areaName) {
    // Set the area directly as the location name (read-only)
    form.area = areaName
    // Also update Vueform
    if (vueformRef.value) {
      vueformRef.value.update({ area: areaName })
    }
  }

  // Get duration from hunt_length_days (optional, doesn't force it)
  const duration = pkgData?.hunt_length_days || pkgData?.regulatory_package?.duration
  if (duration && !form.no_of_days) {
    form.no_of_days = Number(duration)
    // Also update Vueform
    if (vueformRef.value) {
      vueformRef.value.update({ no_of_days: duration })
    }
  }

  // Fetch items from preview endpoint
  if (priceStructureDetailId) {
    loadingPackageItems.value = true
    try {
      const response = await salesEnquiryService.previewPriceItems(priceStructureDetailId)
      
      // Handle both response structures: { success, data } or direct data
      const responseData = response?.data || response
      const isSuccess = response?.success !== false // Consider success if not explicitly false
      
      if (isSuccess && responseData) {
        const data = responseData.data || responseData

        // Store full package detail info for preview
        selectedPackageDetail.value = data

        // Populate species (item_preferences)
        if (Array.isArray(data.species) && data.species.length > 0) {
          data.species.forEach((s: any) => {
            speciesObjects.value.push({
              species_id: s.item_id || s.species_id || s.id,
              name: s.item_name || s.species_name || s.name || 'Unknown',
              quantity: s.quantity || 1,
              notes: s.notes || '',
              priority: 'NICE_TO_HAVE',
              fromPackage: true,
            })
          })
        } else {
          // Try fallback to get species from the package's selfItem
          populateFormFromPackageFallback(pkg)
        }

        // Safari extras are NOT loaded from package - only manually added from items table

        // Populate trophy fees
        if (Array.isArray(data.trophy_fees)) {
          trophyFees.value = data.trophy_fees.map((fee: any) => ({
            id: fee.id,
            species_id: fee.species_id,
            species_name: fee.species_name,
            sequence_order: fee.sequence_order,
            amount: parseFloat(fee.amount) || 0,
            currency_code: fee.currency_code,
          }))
        }

        // Populate companion costs (per participant daily rates)
        // Calculate estimated daily rate from available hunt length costs
        if (Array.isArray(data.companion_costs) && data.companion_costs.length > 0) {
          // Group costs by hunt_length_id to get the rate structure
          const costsByHuntLength = data.companion_costs.reduce((acc: any, cost: any) => {
            if (!acc[cost.hunt_length_id]) {
              acc[cost.hunt_length_id] = []
            }
            acc[cost.hunt_length_id].push(cost)
            return acc
          }, {})

          // Calculate average daily rate from all available hunt length costs
          let totalDailyRate = 0
          let countRates = 0
          
          for (const huntLengthId in costsByHuntLength) {
            const costs = costsByHuntLength[huntLengthId]
            const huntLength = huntLengths.value.find((hl: any) => hl.id === Number(huntLengthId))
            if (huntLength && huntLength.days > 0) {
              costs.forEach((cost: any) => {
                const dailyRate = parseFloat(cost.amount) / huntLength.days
                totalDailyRate += dailyRate
                countRates++
              })
            }
          }

          // Use average daily rate
          const estimatedDailyRate = countRates > 0 ? totalDailyRate / countRates : 0
          
          if (estimatedDailyRate > 0) {
            companionCosts.value = [{
              id: 'estimated',
              amount: estimatedDailyRate,
              currency_code: data.companion_costs[0]?.currency_code || 'USD',
              description: 'Estimated per participant daily rate',
              is_estimated: true
            }]
          }
        }

        init({ message: 'Package items loaded successfully', color: 'success' })
      }
    } catch (error) {
      console.error('Error fetching package items:', error)
      // Fallback to old method if preview endpoint fails
      populateFormFromPackageFallback(pkg)
    } finally {
      loadingPackageItems.value = false
    }
  }
}

// Fallback method if preview endpoint is not available
const populateFormFromPackageFallback = (pkg: any) => {
  const pkgData = pkg?.selfItem || pkg
  
  // Try multiple possible locations for species data
  // Option 1: Direct species array on the package
  let speciesArray = pkgData?.species || []
  
  // Option 2: species in sales_packages[0].species
  if ((!speciesArray || speciesArray.length === 0) && pkgData?.sales_packages) {
    const salesPackages = pkgData.sales_packages
    if (Array.isArray(salesPackages) && salesPackages.length > 0) {
      speciesArray = salesPackages[0]?.species || []
    }
  }
  
  // Option 3: item_preferences array
  if ((!speciesArray || speciesArray.length === 0) && pkgData?.item_preferences) {
    speciesArray = pkgData.item_preferences
  }
  
  if (Array.isArray(speciesArray) && speciesArray.length > 0) {
    speciesArray.forEach((s: any) => {
      const speciesId = s.species_id || s.item_id || s.id
      const speciesName = s.species_name || s.item_name || s.name || s.species?.name || 'Unknown'
      const quantity = s.quantity || 1
      
      if (speciesId) {
        speciesObjects.value.push({ 
          species_id: speciesId, 
          name: speciesName, 
          quantity, 
          priority: 'NICE_TO_HAVE',
          fromPackage: true 
        })
      }
    })
  }

  // Safari extras are NOT loaded from package - only manually added from items table
}

const addNewSpeciesItemToStorage = () => {
  if (!form.species || !form.quantity) {
    init({ message: 'Please fill all required fields.', color: 'warning' })
    return
  }

  if (Number(form.quantity) <= 0) {
    init({ message: 'Quantity must be greater than zero.', color: 'warning' })
    return
  }

  const exists = speciesObjects.value.some((species: { species_id: any }) => species.species_id === form.species.value)
  if (!exists) {
    speciesObjects.value.push({
      species_id: form.species.value,
      name: form.species.text,
      quantity: form.quantity,
      priority: 'NICE_TO_HAVE',
      notes: '',
      fromPackage: false,
    })
    // Reset form fields after adding
    form.species = null
    form.quantity = 0
  } else {
    init({ message: 'This species is already added. Update the quantity instead.', color: 'warning' })
  }
}

const deleteFromStorage = (index: number) => {
  speciesObjects.value.splice(index, 1)
}

const incrementQuantity = (index: number) => {
  if (speciesObjects.value[index]) speciesObjects.value[index].quantity++
}

const decrementQuantity = (index: number) => {
  if (speciesObjects.value[index] && speciesObjects.value[index].quantity > 1) speciesObjects.value[index].quantity--
}

const togglePriority = (index: number) => {
  if (speciesObjects.value[index]) {
    speciesObjects.value[index].priority = 
      speciesObjects.value[index].priority === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE'
  }
}

const toggleSafariExtraPriority = (index: number) => {
  if (selectedSafariExtras.value[index]) {
    selectedSafariExtras.value[index].priority = 
      selectedSafariExtras.value[index].priority === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE'
  }
}

const addSafariExtra = () => {
  if (!selectedSafariExtraId.value) {
    init({ message: 'Please select a safari extra', color: 'warning' })
    return
  }

  // Check if already added
  const exists = selectedSafariExtras.value.some((e: any) => e.id === selectedSafariExtraId.value)
  if (exists) {
    init({ message: 'This safari extra is already added', color: 'warning' })
    return
  }

  const safariExtraOption = safariExtrasItems.value.find((item: any) => item.value === selectedSafariExtraId.value)
  if (safariExtraOption && safariExtraOption.item) {
    const item = safariExtraOption.item
    selectedSafariExtras.value.push({
      id: item.id,
      name: item.name,
      description: item.description,
      priority: 'NICE_TO_HAVE',
      fromPackage: false
    })
    init({ message: `Added "${item.name}" to safari extras`, color: 'success' })
    selectedSafariExtraId.value = null
  }
}

const removeSafariExtra = (index: number) => {
  const removed = selectedSafariExtras.value.splice(index, 1)
  if (removed.length > 0) init({ message: `Removed "${removed[0].name}" from safari extras`, color: 'info' })
}

const addQuotationInstallment = () => {
  quotationForm.installments.push({ narration: '', amount_due: 0, due_days_type: 'upon_booking', due_days: 0 })
}

const removeQuotationInstallment = (index: number) => {
  quotationForm.installments.splice(index, 1)
}

const submit = async () => {
  saving.value = true
  
  // Sync form data from Vueform
  syncFormData()

  if (!form.full_name || !form.country || !form.nationality || !form.email) {
    init({ message: 'Please fill in all required fields (Name, Country, Nationality, Email).', color: 'warning' })
    saving.value = false
    return
  }

  if (speciesObjects.value.length === 0) {
    init({ message: 'Please add at least one species.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.area) {
    init({ message: 'Please select a hunting area.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.season) {
    init({ message: 'Please select a season.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.no_of_days || form.no_of_days <= 0) {
    init({ message: 'Please select valid start and end dates.', color: 'warning' })
    saving.value = false
    return
  }

  if (!currentUserId.value) {
    init({ message: 'Unable to detect the logged-in user. Please re-login and try again.', color: 'warning' })
    saving.value = false
    return
  }

  // Build the request payload according to backend SalesEnquiryController expectations
  const requestdata: any = {
    // Core enquiry fields
    date: form.start_date || new Date().toISOString().split('T')[0],
    user_id: 1, // Hardcoded to user ID 1
    season_id: form.season || null,
    status: isEditMode.value ? undefined : 'NEW', // Only set status on create
    remarks: form.remarks || null,
    price_structure_detail_id: form.priceListId || null, // Include selected package/price structure
    
    // Areas - backend expects array of { location_id }
    // Look up the area ID from the area name if form.area is a string
    areas: form.area ? (() => {
      // If form.area is already a number (ID), use it directly
      if (typeof form.area === 'number') {
        return [{ location_id: form.area }]
      }
      // If form.area is a string (name), look up the ID
      const areaOption = areasOptions.value.find((a: any) => a.text === form.area)
      return areaOption ? [{ location_id: areaOption.value }] : []
    })() : [],
    
    // Item preferences (game preferences) - backend expects item_id, not species_item_id
    item_preferences: speciesObjects.value.map((item: any) => ({
      item_id: item.species_id || item.item_id || item.id,
      desired_quantity: item.quantity || 1,
      priority: item.priority || 'NICE_TO_HAVE',
      notes: item.notes || null,
    })),
    
    // Safari extras - send item IDs with priority
    safari_extras: selectedSafariExtras.value.map((extra: any) => ({
      item_id: extra.id,
      priority: extra.priority || 'NICE_TO_HAVE',
    })),
    
    // Preference - backend uses no_of_participants
    preference: {
      prev_experience: form.prev_experience || null,
      no_of_participants: form.no_of_hunters || form.no_of_participants || 1,
      preferred_start_date: form.start_date || null,
      no_of_days: form.no_of_days || null,
      budget_min: form.budget_min || null,
      budget_max: form.budget_max || null,
      payment_method_id: form.payment_method_id || null,
      special_requests: form.special_requests || null,
    },
  }

  // Get entity_id directly from customerData prop (passed from CustomerSelectionModal)
  const entityId = props.customerData?.entity_id
  
  if (!entityId) {
    console.error('No entity_id found in customerData!')
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Customer information is missing. Please select or create a customer first.',
    })
    return
  }
  
  requestdata.entity_id = entityId

  try {
    
    let response: any
    if (isEditMode.value && editingInquiryId.value) {
      response = await salesEnquiryService.update(editingInquiryId.value, requestdata)
      if (response.success) {
        saving.value = false
        Swal.fire({
          title: 'Updated!',
          text: 'Sales enquiry updated successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        }).then(() => {
          resetEditMode()
          emit('saved')
        })
        return
      }
    } else {
      response = await salesEnquiryService.create(requestdata)
      if (response.success) {
        saving.value = false
        Swal.fire({
          title: 'Success!',
          text: response.message || 'Sales enquiry created successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        }).then(() => {
          resetEditMode()
          emit('saved')
        })
        return
      }
    }
  } catch (error: any) {
    console.error('Error saving sales inquiry:', error)
    if (error.response) {
      const errors = handleErrors(error.response)
      init({ message: '\n' + errors.map((e: any, i: number) => `${i + 1}. ${e}`).join('\n'), color: 'danger' })
    } else if (error.request) {
      init({ message: 'No response from server. Please check your network connection.', color: 'danger' })
    } else {
      init({ message: error.message || 'An unexpected error occurred', color: 'danger' })
    }
  } finally {
    saving.value = false
  }
}

const getSpeciesNameById = (speciesId: number): string | null => {
  if (!speciesId) return null
  const source = !!form.area && areaSpeciesLoaded.value ? selectedAreaSpecies.value : speciesOptions.value
  const species = source.find((s: any) => s.value === speciesId)
  return species ? species.text : null
}

const loadInquiryForEdit = (rowData: any) => {
  isEditMode.value = true
  editingInquiryId.value = rowData.id

  const item = rowData.selfitem || rowData
  
  // Load entity/client information
  form.full_name = item.entity?.full_name || rowData.name || ''
  form.nick_name = item.entity?.nick_name || ''

  const countryId = item.entity?.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) form.country = countryOption.value
  } else if (item.entity?.country) {
    const countryOption = countries.value.find((c: any) => c.text === item.entity.country)
    if (countryOption) form.country = countryOption.value
  }

  const nationalityId = item.entity?.nationality_id
  if (nationalityId) {
    const nationalityOption = nationality.value.find((n: any) => n.value === nationalityId)
    if (nationalityOption) form.nationality = nationalityOption.value
  } else if (item.entity?.nationality) {
    const nationalityOption = nationality.value.find((n: any) => n.text === item.entity.nationality)
    if (nationalityOption) form.nationality = nationalityOption.value
  }

  // Load contacts from entity (contact_type_id: 1=email, 2=phone, 3=address)
  if (item.entity?.contacts && Array.isArray(item.entity.contacts)) {
    let phoneFound = false
    item.entity.contacts.forEach((contact: any) => {
      const contactType = String(contact.type || '').toLowerCase()
      const contactTypeId = contact.contact_type_id
      
      if (contactTypeId === 1 || contactType === 'email') {
        form.email = contact.contact || ''
      } else if (contactTypeId === 2 || contactType === 'phone_number' || contactType === 'phone') {
        if (!phoneFound) {
          form.phone = contact.contact || ''
          phoneFound = true
        } else {
          form.phone_additional = contact.contact || ''
        }
      } else if (contactTypeId === 3 || contactType === 'address') {
        form.address = contact.contact || ''
      }
    })
  }

  // Load enquiry remarks
  form.remarks = item.remarks || ''

  // Load preference data - backend uses no_of_participants
  const prefs = item.preference || rowData.preference || {}
  form.no_of_participants = prefs.no_of_participants || 1
  form.no_of_hunters = prefs.no_of_participants || 1
  form.no_of_observers = 0
  form.no_of_companions = 0
  form.no_of_days = prefs.no_of_days || 0
  form.prev_experience = prefs.prev_experience || ''
  form.budget_min = prefs.budget_min || null
  form.budget_max = prefs.budget_max || null
  form.payment_method_id = prefs.payment_method_id || null
  form.special_requests = prefs.special_requests || ''

  // Load dates from preference
  if (prefs.preferred_start_date) {
    form.start_date = prefs.preferred_start_date.split('T')[0]
  }
  form.no_of_days = prefs.no_of_days || 0

  // Load areas - backend returns areas with location_id and location object
  // Set area as the location name for display (read-only field)
  const locationId = item.areas?.[0]?.location_id
  const locationName = item.areas?.[0]?.location?.name
  if (locationName) {
    // Use the location name directly
    form.area = locationName
  } else if (locationId) {
    // If only ID is available, look up the name
    const areaOption = areasOptions.value.find((a: any) => a.value === locationId)
    if (areaOption) form.area = areaOption.text
  }

  // Load season
  if (item.season) {
    const seasonOption = seasonsOptions.value.find((s: any) => s.value === item.season.id || s.text === item.season.name)
    if (seasonOption) form.season = seasonOption.value
  }

  form.priceListId = null
  form.priceStructureId =
    item.price_structure_id ||
    item.price_structure?.id ||
    item.price_structure_detail?.price_structure_id ||
    item.price_structure_detail?.price_structure?.id ||
    null

  // Load item_preferences (game preferences) - backend uses item_id
  speciesObjects.value = []
  const itemPreferences = item.item_preferences || []
  itemPreferences.forEach((pref: any) => {
    const itemId = pref.item_id || pref.species_item_id
    const itemName = pref.item_name || getSpeciesNameById(itemId) || 'Unknown'
    speciesObjects.value.push({
      species_id: itemId,
      name: itemName,
      quantity: pref.desired_quantity || 1,
      priority: pref.priority || 'NICE_TO_HAVE',
      notes: pref.notes || '',
      fromPackage: false,
    })
  })

  selectedSafariExtras.value = []



  // Update Vueform with loaded values
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: form.full_name,
      country: form.country,
      nationality: form.nationality,
      email: form.email,
      phone: form.phone,
      phone_additional: form.phone_additional,
      address: form.address,
      season: form.season,
      priceListId: form.priceListId,
      priceStructureId: form.priceStructureId,
      start_date: form.start_date,
      no_of_days: form.no_of_days,
      area: form.area,
      no_of_participants: form.no_of_participants,
      prev_experience: form.prev_experience,
      special_requests: form.special_requests
    })
  }

  init({ message: 'Loaded inquiry data for editing', color: 'info' })
}

const loadHuntLengths = async () => {
  try {
    await priceListStore.getHuntLengths()
    huntLengths.value = priceListStore.huntLengths || []
  } catch (error) {
    console.error('Failed to load hunt lengths:', error)
  }
}

// Initialize form data from customerData prop
const initializeFromCustomerData = () => {
  if (!props.customerData) return

  const data = props.customerData
  
  // Populate form fields for display only
  form.full_name = data.full_name || ''
  form.nick_name = data.nick_name || ''
  form.country = data.country || null
  form.nationality = data.nationality || null
  form.email = data.email || ''
  form.phone = data.phone || ''
  form.phone_additional = data.phone_additional || ''
  form.address = data.address || ''
  
  // Update Vueform if available
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: form.full_name,
      country: form.country,
      nationality: form.nationality,
      email: form.email,
      phone: form.phone,
      phone_additional: form.phone_additional,
      address: form.address,
    })
  }
}

watch(
  () => props.customerData,
  (newData) => {
    if (newData) {
      initializeFromCustomerData()
    }
  },
  { immediate: true },
)

watch(
  () => props.editRow,
  (row, oldRow) => {
    // Only reset if there was a previous row (not on initial mount)
    if (oldRow !== undefined) {
      resetEditMode()
    }
    if (row) loadInquiryForEdit(row)
  },
  { immediate: true },
)

watch(
  [() => form.area, () => areasOptions.value.length],
  ([areaValue]) => {
    selectedSpeciesId.value = null
    if (!areaValue) {
      selectedAreaSpecies.value = []
      areaSpeciesLoaded.value = false
      return
    }
    loadAreaSpeciesForWizard(areaValue)
  },
  { immediate: true },
)

onMounted(async () => {
  // Save original sidebar state and collapse it
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true
  
  await loadHuntLengths()
  getPriceStructures()
  getCountries()
  getNationalities()
  getSpecies()
  getSafariExtras()
  getAreas()
  getSeasonList()
  getPL()
  getExistingCustomers()
})

// Restore sidebar state when leaving the page
onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --text: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --card: #ffffff;
  --radius: 14px;
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.ps-page {
  min-height: 100%;
  background: #f5f7fb;
}

.content {
  padding: 22px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-head-left h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.crumbs {
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.crumb-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: #eff6ff;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.head-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: 2px solid transparent;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn .btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.btn.ghost {
  border-color: var(--border);
  background: #ffffff;
  color: var(--text);
}

.btn.ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn.primary {
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
}

.btn.primary:hover {
  background: #1e40af !important;
}

/* Ensure the header 'Submit Enquiry' button uses the primary blue and consistent states */
.page-head .head-actions .btn.primary {
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3) !important;
}

.page-head .head-actions .btn.primary:hover:not(:disabled) {
  background: #1e40af !important;
}

.page-head .head-actions .btn.primary:disabled,
.page-head .head-actions .btn.primary[disabled] {
  /* Keep visible when disabled */
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
  opacity: 1 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  filter: none !important;
  pointer-events: none !important;
}

.btn.btn-primary {
  background: var(--primary);
  border-color: var(--primary-dark);
  color: #ffffff;
}

.btn.btn-primary:hover {
  background: var(--primary-dark);
}

.btn.btn-secondary {
  background: #f8fafc;
  border-color: var(--border);
  color: #475569;
}

.btn.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn.btn-success {
  background: #16a34a;
  border-color: #15803d;
  color: #ffffff;
}

.btn.btn-outline-secondary {
  border-color: var(--border);
  background: #ffffff;
  color: #475569;
}

/* Two-column grid layout */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
  align-items: start;
}

.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
  background: #dbeafe;
  border: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.panel-title-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
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
  border-radius: 12px;
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

/* Info rows for left panel */
.info-rows {
  padding: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* Tab navigation */
.tabs-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
  border-radius: var(--radius) var(--radius) 0 0;
}

.tabs-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab-btn.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
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

.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Tab content */
.tab-body {
  padding: 20px;
  background: #fafbfc;
}

.tab-content {
  padding: 20px;
  background: #fafbfc;
}

.content-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.content-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-block {
  margin-bottom: 20px;
}

.section-block:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 2px solid #dbeafe;
}

.section-label i {
  color: var(--primary);
  font-size: 14px;
}

/* Form controls */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.form-row.three-col {
  grid-template-columns: repeat(3, 1fr);
}

.form-row.experience-requests-row {
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-group .form-control,
.form-group .form-select,
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.form-group .form-control:focus,
.form-group .form-select:focus,
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

/* Add species row */
.add-species-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.add-species-row .form-group {
  flex: 1;
}

.add-species-row .form-group:last-of-type {
  flex: 0 0 100px;
}

.btn-add {
  background: var(--primary);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
}

.btn-add:hover {
  background: var(--primary-dark);
}

/* Species list */
.species-list {
  margin-top: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.species-list-header {
  display: grid;
  grid-template-columns: 1fr 100px 100px 60px;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.species-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px 60px;
  gap: 10px;
  padding: 12px 14px;
  align-items: center;
  border-top: 1px solid var(--border-light);
}

.species-row:nth-child(even) {
  background: #fafbfc;
}

.species-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.species-source {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qty-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.qty-value {
  font-weight: 600;
  font-size: 13px;
  min-width: 24px;
  text-align: center;
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  cursor: pointer;
}

.priority-badge.must-have {
  background: #fef2f2;
  color: #dc2626;
}

.priority-badge.nice-to-have {
  background: #eff6ff;
  color: #2563eb;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #fef2f2;
  border-radius: 6px;
  color: #dc2626;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.remove-btn:hover {
  background: #fee2e2;
}

/* Extras grid */
.extras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.extra-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.extra-card:hover {
  border-color: var(--primary);
}

.extra-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.extra-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.extra-card.selected .extra-checkbox {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
}

.extra-info {
  flex: 1;
}

.extra-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.extra-price {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}

/* Review sections */
.review-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.review-section {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}

.review-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-section-title i {
  color: var(--primary);
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-light);
  font-size: 12px;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item .label {
  color: var(--text-secondary);
}

.review-item .value {
  font-weight: 600;
  color: var(--text);
}

.review-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.review-badges .badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
}

/* Inner card styles */
.inner-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 14px;
}

.inner-card:last-child {
  margin-bottom: 0;
}

.tabs-card {
  background: #f8fafc;
}

.content-card {
  background: var(--card);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  padding: 14px;
  background: #f8fafc;
  flex-wrap: wrap;
}

.tab {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  outline: none;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  min-width: 20px;
  text-align: center;
}

.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Content header */
.content-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.content-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #dbeafe;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.content-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.content-hint {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Content body */
.content-body {
  padding: 16px 20px;
  background: #fafbfc;
}

/* Field styles */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full-width {
  grid-column: 1 / -1;
}

.lbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.req {
  color: #dc2626;
  font-weight: 700;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input,
.input-wrapper select,
.input-wrapper textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
  font-family: inherit;
}

.input-wrapper input:focus,
.input-wrapper select:focus,
.input-wrapper textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.input-wrapper input:disabled,
.input-wrapper select:disabled,
.input-wrapper textarea:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-wrapper textarea {
  resize: vertical;
  min-height: 80px;
}

/* Vueform date picker */
.vueform-date-wrapper :deep(.vc-popover-content-wrapper) {
  min-width: 100%;
}

.vueform-date-wrapper :deep(.vc-container) {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  background: #ffffff;
}

.vueform-date-wrapper :deep(.vc-pane) {
  width: 100%;
}

.vueform-date-wrapper :deep(.vc-header) {
  padding: 10px 12px;
}

.vueform-date-wrapper :deep(.vc-weekday) {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.vueform-date-wrapper :deep(.vc-day) {
  font-size: 12px;
}

.vueform-date-wrapper :deep(.vc-day-content) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

/* Flatpickr date picker (Vueform) */
.vueform-date-wrapper :deep(.flatpickr-calendar) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.vueform-date-wrapper :deep(.flatpickr-innerContainer),
.vueform-date-wrapper :deep(.flatpickr-rContainer),
.vueform-date-wrapper :deep(.dayContainer) {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

.vueform-date-wrapper :deep(.flatpickr-weekdaycontainer) {
  width: 100% !important;
  max-width: 100% !important;
}

.vueform-date-wrapper :deep(.flatpickr-day) {
  width: calc(100% / 7);
  max-width: none;
}

/* Section divider */
.section-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 20px 0 16px;
  padding: 12px 16px;
  background: #dbeafe;
  border-radius: 8px;
  border-left: 4px solid var(--primary);
}

.section-divider.first {
  margin-top: 0;
}

.section-divider i {
  font-size: 14px;
}

/* Package preview */
.package-preview {
  background: #f8fafc;
  border: 2px solid #dbeafe;
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
}

.preview-header {
  padding: 12px 16px;
  background: #dbeafe;
  font-weight: 600;
  font-size: 13px;
  color: #1e40af;
  display: flex;
  align-items: center;
}

.preview-body {
  padding: 16px;
  background: #ffffff;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.preview-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* Info alert */
.info-alert {
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12px;
  color: #1e40af;
  margin: 12px 0;
  display: flex;
  align-items: center;
}

.warning-alert {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12px;
  color: #92400e;
  margin: 12px 0;
  display: flex;
  align-items: center;
}

/* Add item row */
.add-item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.add-item-row .form-select {
  flex: 1;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.add-item-row .form-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

.qty-input {
  width: 100px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.qty-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

/* Items list */
.items-list {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.list-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.list-header strong {
  font-weight: 700;
  color: var(--text);
}

.list-items {
  padding: 8px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #fafbfc;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.list-item:last-child {
  margin-bottom: 0;
}

.list-item:hover {
  background: #f8fafc;
  border-color: var(--primary);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.item-info strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 8px;
}

.btn-outline-primary {
  border: 2px solid #2563eb;
  background: #ffffff;
  color: #2563eb;
}

.btn-outline-primary:hover {
  background: #2563eb;
  color: #ffffff;
}

.btn-outline-danger {
  border: 2px solid #dc2626;
  background: #ffffff;
  color: #dc2626;
}

.btn-outline-danger:hover {
  background: #dc2626;
  color: #ffffff;
}

/* Badge styles */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge.bg-info {
  background: #dbeafe;
  color: #1e40af;
}

.badge.bg-danger {
  background: #dc2626 !important;
  color: #ffffff !important;
  font-weight: 600;
}

.badge.bg-secondary {
  background: #f1f5f9;
  color: #64748b;
}

.badge.bg-success {
  background: #dcfce7;
  color: #16a34a;
}

.badge.bg-warning {
  background: #fef3c7;
  color: #92400e;
}

.customer-badge-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Empty list */
.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-list i {
  display: block;
  margin-bottom: 12px;
}

.empty-list p {
  margin: 0;
  font-size: 13px;
}

/* Empty section */
.empty-section {
  padding: 30px 20px;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

/* Upgrade fees section */
.upgrade-fees-section {
  margin-top: 20px;
}

.fees-table {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.fee-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 12px 16px;
  font-size: 13px;
  align-items: center;
}

.fee-row.header {
  background: #f8fafc;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.3px;
  border-bottom: 2px solid var(--border);
}

.fee-row:not(.header) {
  border-bottom: 1px solid var(--border-light);
}

.fee-row:last-child {
  border-bottom: none;
}

/* Extras list */
.extras-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.extra-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.extra-item:hover {
  border-color: var(--primary);
  background: #fafbfc;
}

.extra-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.extra-price {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
}

/* Utility classes */
.text-primary {
  color: var(--primary) !important;
}

.text-muted {
  color: var(--text-secondary) !important;
}

.text-warning {
  color: #f59e0b !important;
}

.fw-bold {
  font-weight: 700 !important;
}

.me-1 {
  margin-right: 4px !important;
}

.me-2 {
  margin-right: 8px !important;
}

.ms-2 {
  margin-left: 8px !important;
}

.mb-2 {
  margin-bottom: 8px !important;
}

.cursor-pointer {
  cursor: pointer !important;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 32px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

/* Companion Cost Card */
.companion-cost-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cost-header {
  background: #dbeafe;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #93c5fd;
}

.cost-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

.cost-rate {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.cost-calculation {
  padding: 16px;
  background: #ffffff;
}

.calc-formula {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}

.calc-item {
  font-weight: 500;
  color: var(--text);
}

.calc-separator {
  color: #64748b;
  font-weight: 400;
}

.calc-equals {
  color: #64748b;
  font-weight: 600;
  margin: 0 4px;
}

.calc-total {
  font-weight: 700;
  color: #16a34a;
  font-size: 15px;
}

/* Smooth animations */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .content {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-row.three-col {
    grid-template-columns: 1fr;
  }

  .review-grid {
    grid-template-columns: 1fr;
  }
}
</style>
