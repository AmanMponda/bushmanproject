<template>
  <div v-if="loading || !priceListItem" class="text-center p-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div
    v-else-if="
      !priceListItem.sales_package &&
      !priceListItem.package_name &&
      !priceListItem.area_name &&
      !(priceListItem.items && priceListItem.items.length)
    "
    class="text-center p-5"
  >
    <div class="alert alert-warning">
      <i class="fa fa-exclamation-triangle me-2"></i>
      Price list data is incomplete or invalid.
      <div class="mt-2 small">
        <strong>Debug info:</strong> Missing both sales_package and package_name properties
      </div>
    </div>
    <button class="btn btn-primary" @click="handleGoBack">
      <i class="fa fa-arrow-left me-1"></i> Go Back
    </button>
  </div>

  <div v-else class="price-list-details">
    <div class="row gx-4">
      <div class="col-lg-12">
        <div class="card">
          <!-- HEADER -->
          <div class="card-header d-flex align-items-center bg-white fw-400">
            <div class="d-flex align-items-center">
              <div class="vehicle-icon me-3">
                <i class="fa fa-tags fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">{{ packageName }}</h4>
                <small class="text-muted">
                  {{ areaName }} •
                  {{ formatDate(startDate) }} -
                  {{ formatDate(endDate) }}
                  <span
                    :class="isActive ? 'badge bg-success ms-2' : 'badge bg-danger ms-2'"
                  >
                    {{ isActive ? 'Active' : 'Inactive' }}
                  </span>
                </small>
              </div>
            </div>

            <div class="ms-auto d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="handleGoBack">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>
              <button class="btn btn-outline-warning text-nowrap btn-sm px-3 rounded-pill" @click="handleEdit">
                <i class="fa fa-pen me-1"></i> Edit
              </button>
              <button class="btn btn-outline-danger text-nowrap btn-sm px-3 rounded-pill" @click="handleDelete">
                <i class="fa fa-trash me-1"></i> Delete
              </button>
              <button v-if="pdfData" class="btn btn-outline-primary" @click="downloadPriceListPdf">
                <i class="fa fa-download me-1"></i>
                Download PDF
              </button>
            </div>
          </div>

          <!-- TABS -->
          <div class="card-header p-0 border-bottom bg-white">
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
            <!-- Overview Tab -->
            <div id="overview" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }">
              <!-- Package Overview Cards -->
              <div class="row g-3 mb-4">
                <div class="col-md-3">
                  <div class="card border-primary">
                    <div class="card-body text-center">
                      <i class="fa fa-dollar-sign fa-2x text-primary mb-2"></i>
                      <div class="h4 mb-0">
                        {{ currencySymbol }}{{ formatAmount(baseAmount) }}
                      </div>
                      <small class="text-muted">Base Amount</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card border-success">
                    <div class="card-body text-center">
                      <i class="fa fa-calendar fa-2x text-success mb-2"></i>
                      <div class="h4 mb-0">{{ duration }}</div>
                      <small class="text-muted">Days Duration</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card border-warning">
                    <div class="card-body text-center">
                      <i class="fa fa-certificate fa-2x text-warning mb-2"></i>
                      <div class="h6 mb-0">{{ licenseType }}</div>
                      <small class="text-muted">License Type</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card border-info">
                    <div class="card-body text-center">
                      <i class="fa fa-crosshairs fa-2x text-info mb-2"></i>
                      <div class="h6 mb-0">{{ huntingType }}</div>
                      <small class="text-muted">Hunting Type</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Important Info -->
              <div class="card mb-4">
                <div class="card-body">
                  <h6 class="card-title">Important Information</h6>
                  <p class="text-muted small mb-0">
                    All hunts confirmation is subject to quota availability. Other safari packages are available on
                    request and can be customized depending on client requirements.
                  </p>
                  <div v-if="hasUpgradeFees" class="alert alert-info mt-3 mb-0">
                    <strong>Upgrade Fees:</strong> If additional trophies beyond the standard package are taken, upgrade
                    fees may apply (plus trophy fees).
                  </div>
                </div>
              </div>
              <!-- Companion & Observer Section -->
              <div class="row g-3">
                <!-- Companion Hunter Costs -->
                <div class="col-md-6">
                  <div class="card border-success">
                    <div class="card-header bg-white">
                      <h6 class="mb-0">
                        <i class="fa fa-users me-2 text-success"></i>
                        Companion Hunter Costs
                      </h6>
                    </div>
                    <div class="card-body">
                      <div v-if="companionHunterCosts && companionHunterCosts.length > 0">
                        <div v-for="companion in companionHunterCosts" :key="companion.id" class="card bg-light mb-3">
                          <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                              <span>Days</span>
                              <span class="fw-bold h5 mb-0">
                                {{ getHuntLengthText(companion) }}
                              </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <span>Rate</span>
                              <span class="fw-bold h5 mb-0">
                                {{ companion.currency_symbol || currencySymbol }}{{ formatAmount(companion.amount) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-center py-4">
                        <i class="fa fa-info-circle fa-2x text-muted mb-2"></i>
                        <p class="text-muted mb-0">No companion hunter costs available</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Observer Hunter Costs -->
                <div class="col-md-6">
                  <div class="card border-warning">
                    <div class="card-header bg-white">
                      <h6 class="mb-0">
                        <i class="fa fa-eye me-2 text-warning"></i>
                        Observer Hunter Costs
                      </h6>
                    </div>
                    <div class="card-body">
                      <div v-if="observerHunterCosts && observerHunterCosts.length > 0">
                        <div v-for="observer in observerHunterCosts" :key="observer.id" class="card bg-light mb-3">
                          <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                              <span>Days</span>
                              <span class="fw-bold h5 mb-0">
                                {{ getHuntLengthText(observer) }}
                              </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <span>Rate</span>
                              <span class="fw-bold h5 mb-0">
                                {{ observer.currency_symbol || currencySymbol }}{{ formatAmount(observer.amount) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-center py-4">
                        <i class="fa fa-info-circle fa-2x text-muted mb-2"></i>
                        <p class="text-muted mb-0">No observer hunter costs available</p>
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
                  <div v-if="speciesList && speciesList.length > 0">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Species</th>
                            <th>Scientific Name</th>
                            <th class="text-center">Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="species in speciesList" :key="species.id || species.species_id">
                            <td class="fw-semibold">{{ getSpeciesName(species) }}</td>
                            <td class="text-muted fst-italic">{{ getSpeciesScientificName(species) || 'N/A' }}</td>
                            <td class="text-center">
                              <span :class="(species.quantity ?? 0) > 0 ? 'badge bg-success' : 'badge bg-danger'">
                                {{ species.quantity ?? 0 }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="text-center py-5">
                    <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No species available for this package</p>
                  </div>
                </div>
              </div>

              <!-- Upgrade Fees Section -->
              <div v-if="hasUpgradeFees" class="card mb-4">
                <div class="card-header bg-white">
                  <h6 class="mb-0">
                    <i class="fa fa-arrow-up text-primary me-2"></i>
                    Upgrade Fees
                  </h6>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Species</th>
                          <th class="text-end">Amount</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="fee in priceListItem.upgrade_fees" :key="fee.id">
                          <td class="fw-semibold">{{ fee.species_name || fee.species?.name || 'N/A' }}</td>
                          <td class="text-end fw-bold">
                            {{ fee.currency_symbol || currencySymbol }}{{ formatAmount(fee.amount) }}
                          </td>
                          <td class="text-muted">{{ fee.description || 'N/A' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trophy Fees Tab -->
            <div id="trophy_fees" class="tab-pane fade" :class="{ 'show active': activeTab === 'trophy_fees' }">
              <div class="card">
                <div class="card-body">
                  <div v-if="priceListItem.trophy_fees && priceListItem.trophy_fees.length > 0">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Species</th>
                            <th>Scientific Name</th>
                            <th class="text-center">Sequence</th>
                            <th class="text-end">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="fee in priceListItem.trophy_fees" :key="fee.id">
                            <td class="fw-semibold">{{ fee.species.name }}</td>
                            <td class="text-muted fst-italic">{{ fee.species.scientific_name }}</td>
                            <td class="text-center">
                              <span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span>
                            </td>
                            <td class="text-end fw-bold">
                              {{ currencySymbol }}{{ formatAmount(fee.amount) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="text-center py-5">
                    <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No trophy fees available for this package</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Safari Extras Tab -->
            <div id="safari_extras" class="tab-pane fade" :class="{ 'show active': activeTab === 'safari_extras' }">
              <div class="card">
                <div class="card-body">
                  <div v-if="priceListItem.safari_extras && priceListItem.safari_extras.length > 0">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th class="text-center">Charges Per</th>
                            <th class="text-end">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="extra in priceListItem.safari_extras" :key="extra.id">
                            <td class="fw-semibold text-capitalize">{{ extra.name }}</td>
                            <td class="text-muted">{{ extra.description || 'N/A' }}</td>
                            <td class="text-center">
                              <span class="badge bg-info">{{ formatChargesPer(extra.charges_per) || 'N/A' }}</span>
                            </td>
                            <td class="text-end fw-bold">
                              {{ extra.currency?.symbol || currencySymbol }}{{ formatAmount(extra.amount) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="text-center py-5">
                    <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No safari extras available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import downloadPdf from '../../../stores/bushman/pdfDownloader.ts'

interface Props {
  priceListItem: any
  pdfData?: string
}

const props = withDefaults(defineProps<Props>(), {
  pdfData: '',
})

const emit = defineEmits<{
  'go-back': []
  edit: []
  delete: []
}>()

// Reactive state
const activeTab = ref('overview')

// Watch for prop changes and log them
watch(() => props.priceListItem, (newVal) => {
  console.log('PriceListDetails received priceListItem:', newVal)
  console.log('Has sales_package?', !!newVal?.sales_package)
  console.log('Has price_list_type?', !!newVal?.price_list_type)
  console.log('Has package_name?', !!newVal?.package_name)
  console.log('Has area_name?', !!newVal?.area_name)
}, { immediate: true })

// Computed properties
const loading = computed(() => false)

const firstItem = computed(() => {
  return Array.isArray(props.priceListItem.items) && props.priceListItem.items.length
    ? props.priceListItem.items[0]
    : null
})

// Computed properties to handle both nested and flattened structures
const packageName = computed(() => {
  return props.priceListItem.sales_package?.name ||
    firstItem.value?.package_name ||
    firstItem.value?.name ||
    props.priceListItem.package_name ||
    props.priceListItem.area_name ||
    'Price List'
})

const areaName = computed(() => {
  return props.priceListItem.sales_package?.area?.name ||
    props.priceListItem.area_name ||
    props.priceListItem.area ||
    'Unknown Area'
})

const startDate = computed(() => {
  return props.priceListItem.price_list_type?.price_list?.start_date ||
    props.priceListItem.start_date ||
    null
})

const endDate = computed(() => {
  return props.priceListItem.price_list_type?.price_list?.end_date ||
    props.priceListItem.end_date ||
    null
})

const isActive = computed(() => {
  return props.priceListItem.price_list_type?.is_active ||
    props.priceListItem.is_active ||
    false
})

const baseAmount = computed(() => {
  return props.priceListItem.price_list_type?.amount ||
    firstItem.value?.amount ||
    props.priceListItem.amount ||
    0
})

const currencySymbol = computed(() => {
  return props.priceListItem.price_list_type?.currency?.symbol ||
    firstItem.value?.currency_symbol ||
    firstItem.value?.currency?.symbol ||
    props.priceListItem.currency_symbol ||
    props.priceListItem.currency ||
    '$'
})

const duration = computed(() => {
  return props.priceListItem.price_list_type?.duration ||
    firstItem.value?.hunt_length_days ||
    props.priceListItem.duration ||
    0
})

const licenseType = computed(() => {
  return props.priceListItem.sales_package?.regulatory_package?.name ||
    firstItem.value?.regulatory_package?.name ||
    firstItem.value?.sales_packages?.[0]?.regulatory_package?.name ||
    props.priceListItem.regulatory_package_name ||
    'N/A'
})

const huntingType = computed(() => {
  return props.priceListItem.price_list_type?.hunting_type?.name ||
    firstItem.value?.hunting_type_name ||
    props.priceListItem.hunting_type_name ||
    props.priceListItem.hunting_type ||
    'N/A'
})

const hasUpgradeFees = computed(() => {
  return props.priceListItem.upgrade_fees && props.priceListItem.upgrade_fees.length > 0
})

const speciesList = computed(() => {
  if (Array.isArray(props.priceListItem.species)) {
    return props.priceListItem.species.map((s: any) => ({
      id: s.id || s.species_id || `${s.species_id || ''}-${s.species_name || ''}`,
      name: s.name || s.species_name,
      scientific_name: s.scientific_name || '',
      quantity: s.quantity ?? s.total_quantity ?? s.total_count ?? 0,
    }))
  }
  if (props.priceListItem.sales_package?.species) {
    return props.priceListItem.sales_package.species.map((s: any) => ({
      id: s.id || s.species?.id,
      name: s.name || s.species?.name,
      scientific_name: s.scientific_name || s.species?.scientific_name || '',
      quantity: s.quantity ?? s.total_quantity ?? s.total_count ?? 0,
    }))
  }
  return []
})

const companionHunterCosts = computed(() => {
  // New structure: companion_hunter_prices array
  if (props.priceListItem.companion_hunter_prices && Array.isArray(props.priceListItem.companion_hunter_prices)) {
    return props.priceListItem.companion_hunter_prices
  }
  // Legacy structures
  if (props.priceListItem.companion_hunter_costs && Array.isArray(props.priceListItem.companion_hunter_costs)) {
    return props.priceListItem.companion_hunter_costs
  }
  return props.priceListItem.componions_hunter || []
})

const observerHunterCosts = computed(() => {
  // New structure: observer_hunter_prices array
  if (props.priceListItem.observer_hunter_prices && Array.isArray(props.priceListItem.observer_hunter_prices)) {
    return props.priceListItem.observer_hunter_prices
  }
  if (props.priceListItem.observer_hunter_costs && Array.isArray(props.priceListItem.observer_hunter_costs)) {
    return props.priceListItem.observer_hunter_costs
  }
  return props.priceListItem.observer || []
})

const tabs = computed(() => {
  const tabList = [
    {
      key: 'overview',
      label: 'Overview',
      icon: 'fa fa-info-circle',
    },
    {
      key: 'species',
      label: `Species (${speciesList.value.length})`,
      icon: 'fa fa-paw',
    },
  ]

  // Add Trophy Fees tab if data exists
  if (props.priceListItem.trophy_fees && props.priceListItem.trophy_fees.length > 0) {
    tabList.push({
      key: 'trophy_fees',
      label: `Trophy Fees (${props.priceListItem.trophy_fees.length})`,
      icon: 'fa fa-trophy',
    })
  }

  // Add Safari Extras tab if data exists
  if (props.priceListItem.safari_extras && props.priceListItem.safari_extras.length > 0) {
    tabList.push({
      key: 'safari_extras',
      label: `Safari Extras (${props.priceListItem.safari_extras.length})`,
      icon: 'fa fa-plus-circle',
    })
  }

  // Note: Upgrade Fees and Companion & Observer are now in Overview tab, not separate tabs
  return tabList
})

// Methods
const handleGoBack = () => {
  emit('go-back')
}

const handleEdit = () => {
  emit('edit')
}

import Swal from '../../../utils/sweetalert2'

const handleDelete = async () => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this price list? This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
  })
  if (result.isConfirmed) {
    emit('delete')
  }
}

const onTabClick = (tab: any) => {
  activeTab.value = tab.key
  if (tab.action) {
    tab.action()
  }
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A'
  try {
    return format(dateStr, 'MMM yyyy')
  } catch {
    return dateStr
  }
}

const getSpeciesName = (species: any) => {
  if (species.name) return species.name
  if (species.species_name) return species.species_name
  return species.species?.name || 'Unknown'
}

const getSpeciesScientificName = (species: any) => {
  if (species.scientific_name) return species.scientific_name
  return species.species?.scientific_name || ''
}

const formatChargesPer = (chargesPer: string) => {
  if (!chargesPer) return ''
  // Convert "PER_DAY" to "per day", "PER_ROUND" to "per round", etc.
  return chargesPer.toLowerCase().replace('_', ' ')
}

const formatAmount = (amount: string | number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return 'N/A'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getSequenceLabel = (sequence: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const value = sequence % 100
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]
  return `${sequence}${suffix}`
}

// Helper: show label if available (no duplicate "days"), otherwise show days with unit
const getHuntLengthText = (obj: any) => {
  const label = obj?.hunt_length_label || obj?.hunt_length?.label || ''
  if (label) return label
  const days = obj?.hunt_length_days || obj?.days || obj?.hunt_length?.days || null
  return days ? `${days} days` : 'N/A'
}

const downloadPriceListPdf = async () => {
  if (!props.pdfData) {
    console.warn('No PDF data available')
    return
  }
  try {
    const packageName = props.priceListItem?.sales_package?.name || 'price-list'
    const fileName = `${packageName.replace(/\s+/g, '-')}-${Date.now()}.pdf`
    await downloadPdf(props.pdfData, fileName)
  } catch (err) {
    console.error('Failed to download PDF:', err)
  }
}

// Lifecycle
onMounted(() => {
  // Component mounted
})
</script>

<style scoped>
.price-list-details {
  max-width: 1400px;
  margin: 0 auto;
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
  overflow: hidden;
  border-radius: 0.375rem;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Prevent color leakage from borders */
.card.border-primary,
.card.border-success,
.card.border-warning,
.card.border-info,
.card.border-danger {
  border-width: 1px !important;
  border-style: solid !important;
  overflow: hidden;
  border-radius: 0.375rem;
}

.card.border-primary {
  border-color: #0d6efd !important;
}

.card.border-success {
  border-color: #198754 !important;
}

.card.border-warning {
  border-color: #ffc107 !important;
}

.card.border-info {
  border-color: #0dcaf0 !important;
}

.card.border-danger {
  border-color: #dc3545 !important;
}

/* Ensure card body and header don't leak colors */
.card-body,
.card-header {
  border: none !important;
  overflow: hidden;
}

/* Ensure nested cards don't leak */
.card .card {
  border: 1px solid #dee2e6 !important;
  overflow: hidden;
}
</style>
