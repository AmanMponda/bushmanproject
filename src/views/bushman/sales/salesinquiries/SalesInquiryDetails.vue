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
      <!-- Overview Tab -->
      <div id="overview" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }">
        <!-- Key Information Cards -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card border-primary">
              <div class="card-body text-center">
                <i class="fa fa-calendar fa-2x text-primary mb-2"></i>
                <div class="h4 mb-0">{{ item?.formatted_preferences?.no_of_days || 'N/A' }}</div>
                <small class="text-muted">Days Duration</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-success">
              <div class="card-body text-center">
                <i class="fa fa-user fa-2x text-success mb-2"></i>
                <div class="h4 mb-0">{{ item?.formatted_preferences?.no_of_hunters || 0 }}</div>
                <small class="text-muted">Hunters</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-warning">
              <div class="card-body text-center">
                <i class="fa fa-users fa-2x text-warning mb-2"></i>
                <div class="h4 mb-0">{{ item?.formatted_preferences?.no_of_companions || 0 }}</div>
                <small class="text-muted">Companions</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-info">
              <div class="card-body text-center">
                <i class="fa fa-eye fa-2x text-info mb-2"></i>
                <div class="h4 mb-0">{{ item?.formatted_preferences?.no_of_observers || 0 }}</div>
                <small class="text-muted">Observers</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Information -->
        <div class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-user me-2 text-primary"></i>
              Client Information
            </h6>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <strong>Full Name:</strong>
                <div>{{ safeString(item?.entity?.full_name) }}</div>
              </div>
              <div class="col-md-4">
                <strong>Nationality:</strong>
                <div>{{ safeString(item?.entity?.nationality?.name) }}</div>
              </div>
              <div class="col-md-4">
                <strong>Country:</strong>
                <div>{{ safeString(item?.entity?.country?.name) }}</div>
              </div>
            </div>
            <div v-if="safeArray(item?.entity?.contacts).length > 0" class="mt-3">
              <strong>Contacts:</strong>
              <div class="row g-2 mt-2">
                <div v-for="(contact, index) in safeArray(item?.entity?.contacts)" :key="index" class="col-md-4">
                  <div class="card bg-light">
                    <div class="card-body p-2">
                      <i :class="'fa fa-' + getContactIcon(contact.contact_type?.name)" class="me-2"></i>
                      <span>{{ contact.contact }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hunting Preferences -->
        <div class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-calendar-alt me-2 text-primary"></i>
              Hunting Preferences
            </h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <strong>Preferred Date:</strong>
                <div>{{ formatDate(item?.formatted_preferences?.preferred_date) }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Start Date:</strong>
                <div>{{ formatDate(item?.formatted_preferences?.start_date) }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>End Date:</strong>
                <div>{{ formatDate(item?.formatted_preferences?.end_date) }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Duration:</strong>
                <div>{{ item?.formatted_preferences?.no_of_days || 'N/A' }} days</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Information -->
        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title">Important Information</h6>
            <p class="text-muted small mb-0">
              Inquiry Type:
              <span class="badge" :class="item?.inquiry_type === 'standard' ? 'bg-success' : 'bg-info'">
                {{ item?.inquiry_type === 'standard' ? 'Standard Package' : 'Custom Package' }}
              </span>
              <span class="badge bg-primary ms-2">Season: {{ item?.season?.name || 'N/A' }}</span>
            </p>
            <p class="text-muted small mt-2 mb-0">Created: {{ formatDate(item?.create_date) }}</p>
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
            <div v-if="safeArray(item?.species).length > 0">
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
                    <tr v-for="(s, index) in item?.species" :key="index">
                      <td class="fw-semibold">{{ s.species?.name || 'N/A' }}</td>
                      <td class="text-muted fst-italic">{{ s.species?.scientific_name || 'N/A' }}</td>
                      <td class="text-center">
                        <span :class="s.quantity > 0 ? 'badge bg-success' : 'badge bg-danger'">
                          {{ s.quantity || 0 }}
                        </span>
                      </td>
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useSalesInquiriesStore } from '../../../../stores/bushman/sales-store'
import { mapState, mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'

export default defineComponent({
  name: 'SalesInquiryDetails',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  emits: ['go-back'],
  setup() {
    const { init: notify } = useToast()
    const activeTab = ref('overview')
    return { notify, activeTab }
  },
  computed: {
    ...mapState(useSalesInquiriesStore, [
      'observers',
      'companions',
      'clientSafariExtras',
      'accommodations',
      'chartersPrices',
    ]),
    tabs() {
      const tabList = [
        {
          key: 'overview',
          label: 'Overview',
          icon: 'fa fa-info-circle',
        },
      ]

      if (this.item?.package_details || this.item?.custom_details) {
        tabList.push({
          key: 'package',
          label: 'Package',
          icon: 'fa fa-box',
        })
      }

      if (this.item?.species && this.item.species.length > 0) {
        tabList.push({
          key: 'species',
          label: `Species (${this.item.species.length})`,
          icon: 'fa fa-paw',
        })
      }

      const hasPeople = (this.observers && this.observers.length > 0) || (this.companions && this.companions.length > 0)
      if (hasPeople) {
        const totalPeople = (this.observers?.length || 0) + (this.companions?.length || 0)
        tabList.push({
          key: 'people',
          label: `People (${totalPeople})`,
          icon: 'fa fa-users',
        })
      }

      const hasExtras =
        (this.clientSafariExtras && this.clientSafariExtras.length > 0) ||
        (this.accommodations && this.accommodations.length > 0) ||
        (this.chartersPrices && this.chartersPrices.length > 0)
      if (hasExtras) {
        const totalExtras =
          (this.clientSafariExtras?.length || 0) +
          (this.accommodations?.length || 0) +
          (this.chartersPrices?.length || 0)
        tabList.push({
          key: 'extras',
          label: `Extras (${totalExtras})`,
          icon: 'fa fa-plus-circle',
        })
      }

      return tabList
    },
  },
  mounted() {
    this.getObservers(this.item.id)
    this.getCompanions(this.item.id)
    this.getClienSafariExtras(this.item.id)
    this.getAccommodation(this.item.id)
    this.getChartersPrice(this.item.id)
  },
  methods: {
    ...mapActions(useSalesInquiriesStore, [
      'getObservers',
      'getCompanions',
      'getClienSafariExtras',
      'getAccommodation',
      'getChartersPrice',
    ]),

    onTabClick(tab: any) {
      this.activeTab = tab.key
      if (tab.action) {
        tab.action()
      }
    },

    async downloadInquiryPdf() {
      const inquiryId = this.item?.id
      if (!inquiryId) return

      try {
        const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}sales/sales-inquiries/${inquiryId}/pdf`, {
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
          link.download = `inquiry-${this.item?.code || inquiryId}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          this.notify({
            message: 'PDF downloaded successfully',
            color: 'success',
          })
        } else {
          this.notify({
            message: 'Failed to generate PDF',
            color: 'danger',
          })
        }
      } catch (error) {
        console.error('Error downloading PDF:', error)
        this.notify({
          message: 'Error downloading PDF',
          color: 'danger',
        })
      }
    },

    formatDate(dateString: string | number | Date) {
      return dateString ? new Date(dateString).toLocaleDateString() : 'Not provided'
    },

    formatCurrency(amount: any) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parseFloat(amount) || 0)
    },

    getContactIcon(contactType: string) {
      const icons: any = {
        email: 'envelope',
        phone_number: 'phone',
        phone: 'phone',
        address: 'home',
      }
      return icons[contactType] || 'info'
    },

    safeArray(arr: any) {
      return arr || []
    },

    safeString(str: any, fallback = 'Not provided') {
      return str || fallback
    },
  },
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
</style>
