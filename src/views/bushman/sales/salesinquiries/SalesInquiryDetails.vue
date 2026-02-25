<template>
  <div class="sales-inquiry-details">
    <!-- TABS -->
    <div class="card-header p-0 border-bottom bg-white mb-0">
      <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
        <li v-for="tab in tabs" :key="tab.key" class="nav-item flex-fill text-center">
          <a
            :href="'#' + tab.key"
            class="nav-link"
            :class="{ active: activeTab === tab.key }"
            data-bs-toggle="tab"
            @click.prevent="onTabClick(tab)"
          >
            <i :class="tab.icon"></i> {{ tab.label }}
          </a>
        </li>
      </ul>
    </div>

    <!-- TAB CONTENT -->
    <div class="tab-content p-4">
      <!-- Overview Tab (Simplified) -->
      <div id="overview" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }">
        <div class="card mb-4 overview-summary-card">
          <div class="card-body">
            <!-- Compact stat row -->
            <div class="d-flex align-items-center justify-content-between mb-3 stats-row">
              <div class="stat text-center">
                <div class="stat-icon mb-1"><i class="fa fa-calendar text-primary"></i></div>
                <div class="stat-value h5 mb-0">{{ item?.preference?.no_of_days || '-' }}</div>
                <small class="text-muted">Days</small>
              </div>
              <div class="stat text-center">
                <div class="stat-icon mb-1"><i class="fa fa-user text-success"></i></div>
                <div class="stat-value h5 mb-0">{{ item?.preference?.no_of_participants || 0 }}</div>
                <small class="text-muted">Participants</small>
              </div>
              <div class="stat text-center">
                <div class="stat-icon mb-1"><i class="fa fa-dollar-sign text-warning"></i></div>
                <div class="stat-value h5 mb-0">{{ item?.preference?.budget_min ? formatCurrency(item.preference.budget_min) : '-' }}</div>
                <small class="text-muted">Budget Min</small>
              </div>
              <div class="stat text-center">
                <div class="stat-icon mb-1"><i class="fa fa-dollar-sign text-info"></i></div>
                <div class="stat-value h5 mb-0">{{ item?.preference?.budget_max ? formatCurrency(item.preference.budget_max) : '-' }}</div>
                <small class="text-muted">Budget Max</small>
              </div>
            </div>

            <hr />

            <!-- Condensed details grid: 3 rows x 4 columns -->
            <div class="details-grid">
              <!-- Row 1: Full Name | Nationality | Country | Contacts -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
                <div>
                  <small class="text-muted d-block">Full Name</small>
                  <strong>{{ safeString(item?.entity?.full_name) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Nationality</small>
                  <strong>{{ safeString(item?.entity?.nationality) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Country</small>
                  <strong>{{ safeString(item?.entity?.country) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Contacts</small>
                  <div v-for="(contact, index) in safeArray(item?.entity?.contacts)" :key="index" class="contact-line">
                    <i :class="'fa fa-' + getContactIcon(contact.type || contact.contact_type_id)" class="me-1"></i>
                    <span style="font-weight: 600; font-size: 13px;">{{ contact.contact }}</span>
                  </div>
                </div>
              </div>

              <!-- Row 2: Preferred Date | Duration | Budget Range | Previous Experience -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
                <div>
                  <small class="text-muted d-block">Preferred Date</small>
                  <strong>{{ formatDate(item?.preference?.preferred_start_date) }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Duration</small>
                  <strong>{{ item?.preference?.no_of_days ? item.preference.no_of_days + ' days' : '-' }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Budget Range</small>
                  <strong>{{ item?.preference?.budget_min ? formatCurrency(item.preference.budget_min) : '-' }} - {{ item?.preference?.budget_max ? formatCurrency(item.preference.budget_max) : '-' }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Previous Experience</small>
                  <strong>{{ item?.preference?.prev_experience || '-' }}</strong>
                </div>
              </div>

              <!-- Row 3: Package | Hunting Type | Hunting Area | Created -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
                <div>
                  <small class="text-muted d-block">Package</small>
                  <strong>{{ enquiryPackageName }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Hunting Type</small>
                  <strong>{{ enquiryHuntingType }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Hunting Area</small>
                  <strong>{{ enquiryHuntingArea }}</strong>
                </div>
                <div>
                  <small class="text-muted d-block">Created</small>
                  <strong>{{ formatDate(item?.created_at) }}</strong>
                </div>
              </div>

              <div class="mt-3 d-flex align-items-center">
                <div>
                  <span class="badge" :class="{
                    'bg-success': item?.status === 'NEW',
                    'bg-primary': item?.status === 'IN_PROGRESS',
                    'bg-info': item?.status === 'QUOTED',
                    'bg-secondary': item?.status === 'CLOSED'
                  }">
                    {{ item?.status || 'N/A' }}
                  </span>
                  <span class="badge bg-primary ms-2">Season: {{ item?.season?.name || 'N/A' }}</span>
                  <span v-if="item?.user" class="badge bg-secondary ms-2">Agent: {{ item.user.full_name }}</span>
                </div>
              </div>

              <div v-if="item?.preference?.special_requests" class="mt-3">
                <strong>Special Requests:</strong>
                <p class="text-muted mt-1 mb-0">{{ item.preference.special_requests }}</p>
              </div>

              <div v-if="item?.remarks" class="mt-2">
                <strong>Remarks:</strong>
                <p class="text-muted mt-1 mb-0">{{ item.remarks }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Package Tab -->
      <div id="package" class="tab-pane fade" :class="{ 'show active': activeTab === 'package' }">
        <!-- Standard Package Details -->
        <div v-if="item?.inquiry_type === 'standard' && item?.package_details" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-box me-2 text-success"></i>
              Standard Package Details
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <div class="card border-primary">
                  <div class="card-body text-center">
                    <i class="fa fa-dollar-sign fa-2x text-primary mb-2"></i>
                    <div class="h4 mb-0">
                      {{ item?.package_details?.currency_name }} {{ formatCurrency(item?.package_details?.amount) }}
                    </div>
                    <small class="text-muted">Package Amount</small>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-info">
                  <div class="card-body text-center">
                    <i class="fa fa-calendar fa-2x text-info mb-2"></i>
                    <div class="h4 mb-0">{{ item?.package_details?.duration }}</div>
                    <small class="text-muted">Days</small>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-warning">
                  <div class="card-body text-center">
                    <i class="fa fa-crosshairs fa-2x text-warning mb-2"></i>
                    <div class="h6 mb-0">{{ item?.package_details?.hunting_type_name }}</div>
                    <small class="text-muted">Hunting Type</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <strong>Hunting Area:</strong>
                <div>{{ item?.package_details?.area_name }}</div>
              </div>
              <div class="col-md-6 mb-3">
                <strong>Package Period:</strong>
                <div>
                  {{ formatDate(item?.package_details?.start_date) }} -
                  {{ formatDate(item?.package_details?.end_date) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Package Details -->
        <div v-if="item?.inquiry_type === 'custom' && item?.custom_details" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-cog me-2 text-info"></i>
              Custom Package Details
            </h6>
          </div>
          <div class="card-body">
            <!-- Custom Areas -->
            <div v-if="safeArray(item?.custom_details?.areas).length > 0" class="mb-4">
              <strong>Hunting Areas:</strong>
              <div class="d-flex flex-wrap gap-2 mt-2">
                <span v-for="(area, index) in item?.custom_details?.areas" :key="index" class="badge bg-info">
                  <i class="fa fa-map-marker-alt me-1"></i>
                  {{ area.area_name }}
                </span>
              </div>
            </div>

            <!-- Custom Species -->
            <div v-if="safeArray(item?.custom_details?.species).length > 0">
              <strong>Requested Species:</strong>
              <div class="row g-3 mt-2">
                <div v-for="(species, index) in item?.custom_details?.species" :key="index" class="col-md-4">
                  <div class="card bg-light">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="fw-semibold">{{ species.species_name }}</div>
                        <span class="badge bg-success">Qty: {{ species.quantity }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Species Tab -->
      <div id="species" class="tab-pane fade" :class="{ 'show active': activeTab === 'species' }">
        <div class="card">
          <div class="card-body">
            <div v-if="safeArray(item?.item_preferences).length > 0">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Species</th>
                      <th>Priority</th>
                      <th class="text-center">Desired Quantity</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(pref, index) in item?.item_preferences" :key="index">
                      <td class="fw-semibold">{{ pref.item_name || 'N/A' }}</td>
                      <td>
                        <span :class="pref.priority === 'MUST_HAVE' ? 'badge bg-danger' : 'badge bg-info'">
                          {{ pref.priority === 'MUST_HAVE' ? 'Must Have' : 'Nice to Have' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span :class="pref.desired_quantity > 0 ? 'badge bg-success' : 'badge bg-secondary'">
                          {{ pref.desired_quantity || 0 }}
                        </span>
                      </td>
                      <td class="text-muted">{{ pref.notes || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-center py-5">
              <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
              <p class="text-muted">No species available for this inquiry</p>
            </div>
          </div>
        </div>
      </div>

      <!-- People Tab -->
      <div id="people" class="tab-pane fade" :class="{ 'show active': activeTab === 'people' }">
        <!-- Observers Section -->
        <div v-if="observers && observers.length > 0" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-eye me-2 text-info"></i>
              Observers ({{ observers.length }})
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div v-for="(observer, index) in observers" :key="index" class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <div class="fw-semibold mb-2">{{ observer.full_name }}</div>
                    <div class="row text-sm">
                      <div class="col-6"><strong>Nationality:</strong> {{ observer.nationality?.name || 'N/A' }}</div>
                      <div class="col-6"><strong>Country:</strong> {{ observer.country?.name || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Companions Section -->
        <div v-if="companions && companions.length > 0" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-users me-2 text-success"></i>
              Companions ({{ companions.length }})
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div v-for="(companion, index) in companions" :key="index" class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <div class="fw-semibold mb-2">{{ companion.full_name }}</div>
                    <div class="row text-sm">
                      <div class="col-6"><strong>Nationality:</strong> {{ companion.nationality?.name || 'N/A' }}</div>
                      <div class="col-6"><strong>Country:</strong> {{ companion.country?.name || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="(!observers || observers.length === 0) && (!companions || companions.length === 0)"
          class="text-center py-5"
        >
          <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
          <p class="text-muted">No observers or companions for this inquiry</p>
        </div>
      </div>

      <!-- Extras Tab -->
      <div id="extras" class="tab-pane fade" :class="{ 'show active': activeTab === 'extras' }">
        <!-- Safari Extras -->
        <div v-if="clientSafariExtras && clientSafariExtras.length > 0" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-plus-circle me-2 text-primary"></i>
              Safari Extras ({{ clientSafariExtras.length }})
            </h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(extra, index) in clientSafariExtras" :key="index">
                    <td class="fw-semibold">{{ extra.safari_extra?.name || extra.name }}</td>
                    <td class="text-muted">{{ extra.safari_extra?.description || extra.description || 'N/A' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Accommodations -->
        <div v-if="accommodations && accommodations.length > 0" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-hotel me-2 text-warning"></i>
              Accommodations ({{ accommodations.length }})
            </h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Accommodation</th>
                    <th>Type</th>
                    <th class="text-center">Check-in</th>
                    <th class="text-center">Check-out</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(acc, index) in accommodations" :key="index">
                    <td class="fw-semibold">{{ acc.name || acc.accommodation_type?.name || 'N/A' }}</td>
                    <td class="text-muted">{{ acc.accommodation_type?.name || 'N/A' }}</td>
                    <td class="text-center">{{ formatDate(acc.check_in_date) }}</td>
                    <td class="text-center">{{ formatDate(acc.check_out_date) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Charters -->
        <div v-if="chartersPrices && chartersPrices.length > 0" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-plane me-2 text-info"></i>
              Charter Costs ({{ chartersPrices.length }})
            </h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Charter</th>
                    <th>Description</th>
                    <th class="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(charter, index) in chartersPrices" :key="index">
                    <td class="fw-semibold">{{ charter.name || charter.charter?.name || 'Charter ' + (index + 1) }}</td>
                    <td class="text-muted">{{ charter.description || 'N/A' }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(charter.amount || charter.price) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          v-if="
            (!clientSafariExtras || clientSafariExtras.length === 0) &&
            (!accommodations || accommodations.length === 0) &&
            (!chartersPrices || chartersPrices.length === 0)
          "
          class="text-center py-5"
        >
          <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
          <p class="text-muted">No extras, accommodations, or charters for this inquiry</p>
        </div>
      </div>

      <!-- Quotations Tab -->
      <div id="quotations" class="tab-pane fade" :class="{ 'show active': activeTab === 'quotations' }">
        <QuotationSection 
          v-if="item?.id"
          :enquiry-id="item?.id" 
          :initial-pricings="item?.pricings"
          :enquiry-data="item"
          @update="onPricingUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import type { SalesEnquiry } from '@/stores/bushman/salesEnquiry'
import { useToast } from '@/composables/useToast'
import QuotationSection from './QuotationSection.vue'

interface Props {
  item?: SalesEnquiry
  itemId?: number
}

const props = defineProps<Props>()
const item = computed<SalesEnquiry | null>(() => localItem.value || props.item || null)
const localItem = ref<SalesEnquiry | null>(props.item || null)
const emit = defineEmits<{
  goBack: []
  refresh: []
}>()

const { init: notify } = useToast()
const activeTab = ref('overview')

// Check for tab query param (e.g. coming back from Create Quotation)
const route = useRoute()
if (route.query.tab && typeof route.query.tab === 'string') {
  activeTab.value = route.query.tab
}
// Also check sessionStorage (set by SalesInquiries parent when opening from Back navigation)
try {
  const sessionTab = sessionStorage.getItem('openEnquiryDetailTab')
  if (sessionTab) {
    activeTab.value = sessionTab
    sessionStorage.removeItem('openEnquiryDetailTab')
  }
} catch (e) { /* ignore */ }

// Watch for route query changes (e.g. navigating back from edit quotation with ?tab=quotations)
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    activeTab.value = newTab
  }
})

// Data from API calls
const observers = ref<any[]>([])
const companions = ref<any[]>([])
const clientSafariExtras = ref<any[]>([])
const accommodations = ref<any[]>([])
const chartersPrices = ref<any[]>([])
const priceStructureDetail = ref<any>(null)

// Fetch price structure detail to get hunting type and area
const fetchPriceStructureDetail = async () => {
  const e = item.value as any
  if (!e) return
  const detailId = e.price_structure_detail_id || e.pricings?.[0]?.price_structure_detail_id
  if (!detailId) return
  try {
    const response = await salesEnquiryService.previewPriceItems(detailId)
    const data = response?.data || response
    if (data?.price_structure_detail) {
      priceStructureDetail.value = data.price_structure_detail
    }
  } catch (error) {
    console.error('Error fetching price structure detail:', error)
  }
}

// Package, Hunting Type, Hunting Area computed from enquiry data
const enquiryPackageName = computed(() => {
  const e = item.value as any
  if (!e) return '-'
  return e.price_structure_detail?.name
    || e.package_details?.package_name
    || e.package_details?.name
    || e.pricings?.[0]?.price_structure_detail?.name
    || e.package_name
    || priceStructureDetail.value?.name
    || '-'
})

const enquiryHuntingType = computed(() => {
  const e = item.value as any
  if (!e) return '-'
  return e.package_details?.hunting_type_name
    || e.price_structure_detail?.hunting_type?.name
    || e.price_structure_detail?.hunting_type_name
    || e.pricings?.[0]?.price_structure_detail?.hunting_type?.name
    || e.pricings?.[0]?.price_structure_detail?.hunting_type_name
    || e.pricings?.[0]?.hunting_type
    || e.hunting_type_name
    || e.hunting_type
    || priceStructureDetail.value?.hunting_type
    || '-'
})

const enquiryHuntingArea = computed(() => {
  const e = item.value as any
  if (!e) return '-'
  return e.areas?.[0]?.location?.name
    || e.package_details?.area_name
    || e.price_structure_detail?.hunting_area?.name
    || e.price_structure_detail?.area_name
    || e.pricings?.[0]?.price_structure_detail?.hunting_area?.name
    || e.pricings?.[0]?.price_structure_detail?.area_name
    || e.hunting_area_name
    || e.hunting_area
    || priceStructureDetail.value?.location
    || '-'
})

const tabs = computed(() => {
  const tabList = [
    {
      key: 'overview',
      label: 'Overview',
      icon: 'fa fa-info-circle',
    },
  ]

  if (item.value?.package_details || item.value?.custom_details) {
    tabList.push({
      key: 'package',
      label: 'Package',
      icon: 'fa fa-box',
    })
  }

  if (item.value?.item_preferences && item.value.item_preferences.length > 0) {
    tabList.push({
      key: 'species',
      label: `Species (${item.value.item_preferences.length})`,
      icon: 'fa fa-paw',
    })
  }

  const hasPeople = (observers.value && observers.value.length > 0) || (companions.value && companions.value.length > 0)
  if (hasPeople) {
    const totalPeople = (observers.value?.length || 0) + (companions.value?.length || 0)
    tabList.push({
      key: 'people',
      label: `People (${totalPeople})`,
      icon: 'fa fa-users',
    })
  }

  const hasExtras =
    (clientSafariExtras.value && clientSafariExtras.value.length > 0) ||
    (accommodations.value && accommodations.value.length > 0) ||
    (chartersPrices.value && chartersPrices.value.length > 0)
  if (hasExtras) {
    const totalExtras =
      (clientSafariExtras.value?.length || 0) +
      (accommodations.value?.length || 0) +
      (chartersPrices.value?.length || 0)
    tabList.push({
      key: 'extras',
      label: `Extras (${totalExtras})`,
      icon: 'fa fa-plus-circle',
    })
  }

  // Quotations tab - always visible
  const pricingsCount = item.value?.pricings?.length || 0
  tabList.push({
    key: 'quotations',
    label: pricingsCount > 0 ? `Quotations (${pricingsCount})` : 'Quotations',
    icon: 'fa fa-file-invoice-dollar',
  })

  return tabList
})

const onTabClick = (tab: any) => {
  activeTab.value = tab.key
  if (tab.action) {
    tab.action()
  }
}

const onPricingUpdate = () => {
  // Emit event to parent to refresh the enquiry data
  emit('refresh')
}

// TODO: These methods need to be implemented in the service or store
// For now, keeping as empty arrays until backend endpoints are ready
const getObservers = async (enquiryId: number) => {
  try {
    // When backend endpoint is ready: 
    // const response = await salesEnquiryService.getObservers(enquiryId)
    // observers.value = response.data
    observers.value = []
  } catch (error) {
    console.error('Error fetching observers:', error)
  }
}

const getCompanions = async (enquiryId: number) => {
  try {
    // When backend endpoint is ready:
    // const response = await salesEnquiryService.getCompanions(enquiryId)
    // companions.value = response.data
    companions.value = []
  } catch (error) {
    console.error('Error fetching companions:', error)
  }
}

const getClienSafariExtras = async (enquiryId: number) => {
  try {
    // When backend endpoint is ready:
    // const response = await salesEnquiryService.getSafariExtras(enquiryId)
    // clientSafariExtras.value = response.data
    clientSafariExtras.value = []
  } catch (error) {
    console.error('Error fetching safari extras:', error)
  }
}

const getAccommodation = async (enquiryId: number) => {
  try {
    // When backend endpoint is ready:
    // const response = await salesEnquiryService.getAccommodations(enquiryId)
    // accommodations.value = response.data
    accommodations.value = []
  } catch (error) {
    console.error('Error fetching accommodations:', error)
  }
}

const getChartersPrice = async (enquiryId: number) => {
  try {
    // When backend endpoint is ready:
    // const response = await salesEnquiryService.getCharters(enquiryId)
    // chartersPrices.value = response.data
    chartersPrices.value = []
  } catch (error) {
    console.error('Error fetching charter prices:', error)
  }
}

const loadItemIfNeeded = async () => {
  const id = props.itemId || localItem.value?.id || props.item?.id
  if (!id) return
  try {
    const response = await salesEnquiryService.get(id)
    const data = response?.data?.data || response?.data || response
    if (data) localItem.value = data as SalesEnquiry
  } catch (error) {
    // Keep existing prop data if fetch fails
    if (!localItem.value) {
      notify({ message: 'Failed to load enquiry details', color: 'danger' })
    }
  }
}

const downloadInquiryPdf = async () => {
  const inquiryId = item.value?.id
  if (!inquiryId) return

  try {
    const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/${inquiryId}/pdf`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()

    if (data.success && data.pdf) {
      const byteCharacters = atob(data.pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inquiry-${item.value?.code || inquiryId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      notify({
        message: 'PDF downloaded successfully',
        color: 'success',
      })
    } else {
      notify({
        message: 'Failed to generate PDF',
        color: 'danger',
      })
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
    notify({
      message: 'Error downloading PDF',
      color: 'danger',
    })
  }
}

const formatDate = (dateString: string | number | Date | undefined) => {
  return dateString ? new Date(dateString).toLocaleDateString() : '-'
}

const formatCurrency = (amount: any) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount) || 0)
}

const getContactIcon = (contactType?: string | number) => {
  const icons: Record<string, string> = {
    email: 'envelope',
    phone_number: 'phone',
    phone: 'phone',
    address: 'home',
  }
  if (typeof contactType === 'number') {
    if (contactType === 1) return 'envelope'
    if (contactType === 2) return 'phone'
    if (contactType === 3) return 'home'
  }
  if (!contactType) return 'info'
  const normalized = String(contactType).toLowerCase()
  return icons[normalized] || 'info'
}

const safeArray = (arr: any) => {
  return arr || []
}

const safeString = (str: any, fallback = '-') => {
  return str || fallback
}

onMounted(async () => {
  await loadItemIfNeeded()
  if (item.value?.id) {
    getObservers(item.value.id)
    getCompanions(item.value.id)
    getClienSafariExtras(item.value.id)
    getAccommodation(item.value.id)
    getChartersPrice(item.value.id)
    fetchPriceStructureDetail()
  }
})
</script>

<style scoped>
.sales-inquiry-details {
  max-width: 100%;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
  color: #495057;
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  font-weight: 600;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.table tbody tr {
  transition: background-color 0.2s ease;
}

.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.card {
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Simplified overview styling */
.overview-summary-card {
  border-radius: 0.85rem;
  padding: 0.5rem;
  border: 1px solid rgba(13,110,253,0.06);
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.overview-summary-card .stats-meta {
  align-items: center;
}

.overview-summary-card .stats-row {
  gap: 1.25rem;
  display: flex;
  align-items: center;
}

.overview-summary-card .stat {
  flex: 1 1 0;
  min-width: 90px;
}

.overview-summary-card .stat .circle {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.overview-summary-card .stat .circle.primary { background: #e8f0ff; color: #0d6efd; }
.overview-summary-card .stat .circle.success { background: #e7f7ed; color: #198754; }
.overview-summary-card .stat .circle.warning { background: #fff7e6; color: #ff9f1a; }
.overview-summary-card .stat .circle.info { background: #e6f6ff; color: #0dcaf0; }

.overview-summary-card .stat .stat-value {
  font-weight: 700;
}

.details-grid .label {
  min-width: 120px;
  color: #374151;
}

.details-grid .value {
  flex: 1 1 auto;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  font-size: 0.95rem;
}

.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
}
.status-new { background: #16a34a; }
.status-progress { background: #0d6efd; }
.status-quoted { background: #0dcaf0; color: #002b36; }
.status-closed { background: #6c757d; }

@media (max-width: 767px) {
  .overview-summary-card .stats-row {
    flex-direction: column;
    align-items: stretch;
  }
  .overview-summary-card .meta { text-align: left; margin-top: 8px; }
}
</style>
