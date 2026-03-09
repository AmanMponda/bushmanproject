<template>
  <div class="sales-summary">
    <!-- Sales Summary Section -->
    <div class="summary-section">
      <div class="section-header">
        <div>
          <h6 class="section-title">Sales Summary</h6>
          <p class="section-subtitle">Overview of sales pipeline</p>
        </div>
        <button 
          class="refresh-btn" 
          title="Refresh" 
          @click="refreshData"
          :disabled="loading"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spinning': loading }"></i>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading sales data...</p>
      </div>

      <div v-else class="sales-cards-grid">
        <!-- Enquiries Card -->
        <div class="sales-card enquiries">
          <div class="card-content">
            <div class="card-icon">
              <i class="fa fa-envelope-open"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ salesSummary.enquiries }}</div>
              <div class="card-label">Enquiries</div>
            </div>
          </div>
        </div>

        <!-- Quotations Card -->
        <div class="sales-card quotations">
          <div class="card-content">
            <div class="card-icon">
              <i class="fa fa-file-text"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ salesSummary.quotations }}</div>
              <div class="card-label">Quotations</div>
            </div>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="sales-card orders">
          <div class="card-content">
            <div class="card-icon">
              <i class="fa fa-shopping-cart"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ salesSummary.orders }}</div>
              <div class="card-label">Orders</div>
            </div>
          </div>
        </div>

        <!-- Confirmations Card -->
        <div class="sales-card confirmations">
          <div class="card-content">
            <div class="card-icon">
              <i class="fa fa-check-circle"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ salesSummary.confirmations }}</div>
              <div class="card-label">Confirmations</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Species Utilization Section -->
    <div class="species-section">
      <div class="section-header">
        <div>
          <h6 class="section-title">Big Four Species Utilization</h6>
          <p class="section-subtitle">Status breakdown by species</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else class="species-grid">
        <!-- Elephant -->
        <div class="species-card">
          <div class="species-header">
            <div class="species-icon elephant">
              <i class="fa fa-paw"></i>
            </div>
            <div class="species-name">Elephant</div>
          </div>
          <div class="species-stats">
            <div class="stat-row">
              <span class="stat-label">Total Quota</span>
              <span class="stat-value">{{ speciesUtilization.elephant.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Confirmed</span>
              <span class="stat-value text-success">{{ speciesUtilization.elephant.confirmed }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Provisioned</span>
              <span class="stat-value text-warning">{{ speciesUtilization.elephant.provisioned }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Available</span>
              <span class="stat-value text-info">{{ speciesUtilization.elephant.available }}</span>
            </div>
          </div>
          <div class="utilization-bar">
            <div 
              class="utilization-fill" 
              :style="{ width: speciesUtilization.elephant.utilizationPercent + '%' }"
            ></div>
          </div>
          <div class="utilization-percent">{{ speciesUtilization.elephant.utilizationPercent }}% utilized</div>
        </div>

        <!-- Lion -->
        <div class="species-card">
          <div class="species-header">
            <div class="species-icon lion">
              <i class="fa fa-paw"></i>
            </div>
            <div class="species-name">Lion</div>
          </div>
          <div class="species-stats">
            <div class="stat-row">
              <span class="stat-label">Total Quota</span>
              <span class="stat-value">{{ speciesUtilization.lion.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Confirmed</span>
              <span class="stat-value text-success">{{ speciesUtilization.lion.confirmed }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Provisioned</span>
              <span class="stat-value text-warning">{{ speciesUtilization.lion.provisioned }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Available</span>
              <span class="stat-value text-info">{{ speciesUtilization.lion.available }}</span>
            </div>
          </div>
          <div class="utilization-bar">
            <div 
              class="utilization-fill lion-fill" 
              :style="{ width: speciesUtilization.lion.utilizationPercent + '%' }"
            ></div>
          </div>
          <div class="utilization-percent">{{ speciesUtilization.lion.utilizationPercent }}% utilized</div>
        </div>

        <!-- Leopard -->
        <div class="species-card">
          <div class="species-header">
            <div class="species-icon leopard">
              <i class="fa fa-paw"></i>
            </div>
            <div class="species-name">Leopard</div>
          </div>
          <div class="species-stats">
            <div class="stat-row">
              <span class="stat-label">Total Quota</span>
              <span class="stat-value">{{ speciesUtilization.leopard.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Confirmed</span>
              <span class="stat-value text-success">{{ speciesUtilization.leopard.confirmed }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Provisioned</span>
              <span class="stat-value text-warning">{{ speciesUtilization.leopard.provisioned }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Available</span>
              <span class="stat-value text-info">{{ speciesUtilization.leopard.available }}</span>
            </div>
          </div>
          <div class="utilization-bar">
            <div 
              class="utilization-fill leopard-fill" 
              :style="{ width: speciesUtilization.leopard.utilizationPercent + '%' }"
            ></div>
          </div>
          <div class="utilization-percent">{{ speciesUtilization.leopard.utilizationPercent }}% utilized</div>
        </div>

        <!-- Buffalo -->
        <div class="species-card">
          <div class="species-header">
            <div class="species-icon buffalo">
              <i class="fa fa-paw"></i>
            </div>
            <div class="species-name">Buffalo</div>
          </div>
          <div class="species-stats">
            <div class="stat-row">
              <span class="stat-label">Total Quota</span>
              <span class="stat-value">{{ speciesUtilization.buffalo.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Confirmed</span>
              <span class="stat-value text-success">{{ speciesUtilization.buffalo.confirmed }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Provisioned</span>
              <span class="stat-value text-warning">{{ speciesUtilization.buffalo.provisioned }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Available</span>
              <span class="stat-value text-info">{{ speciesUtilization.buffalo.available }}</span>
            </div>
          </div>
          <div class="utilization-bar">
            <div 
              class="utilization-fill buffalo-fill" 
              :style="{ width: speciesUtilization.buffalo.utilizationPercent + '%' }"
            ></div>
          </div>
          <div class="utilization-percent">{{ speciesUtilization.buffalo.utilizationPercent }}% utilized</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useOrderStore } from '@/stores/bushman/order-store'
import { useQuotaStore } from '@/stores/bushman/quota-store'

const orderStore = useOrderStore()
const quotaStore = useQuotaStore()

const loading = ref(false)

interface SalesSummary {
  enquiries: number
  quotations: number
  orders: number
  confirmations: number
}

interface SpeciesStats {
  total: number
  confirmed: number
  provisioned: number
  available: number
  utilizationPercent: number
}

interface SpeciesUtilization {
  elephant: SpeciesStats
  lion: SpeciesStats
  leopard: SpeciesStats
  buffalo: SpeciesStats
}

const salesSummary = reactive<SalesSummary>({
  enquiries: 0,
  quotations: 0,
  orders: 0,
  confirmations: 0,
})

const speciesUtilization = reactive<SpeciesUtilization>({
  elephant: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
  lion: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
  leopard: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
  buffalo: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
})

const fetchData = async () => {
  loading.value = true
  try {
    // Fetch all data in parallel
    const [enquiriesRes, quotationsRes, ordersRes, speciesRes] = await Promise.allSettled([
      orderStore.fetchEnquiries(),
      orderStore.fetchQuotations(),
      orderStore.listOrders(),
      quotaStore.getAllSpeciesPerQuotaPerArea(null, null, null)
    ])

    // Update sales summary from real data
    if (enquiriesRes.status === 'fulfilled') {
      const data = enquiriesRes.value?.data?.data || enquiriesRes.value?.data || orderStore.enquiries || []
      salesSummary.enquiries = Array.isArray(data) ? data.length : 0
    }

    if (quotationsRes.status === 'fulfilled') {
      const data = quotationsRes.value?.data?.data || quotationsRes.value?.data || orderStore.quotations || []
      salesSummary.quotations = Array.isArray(data) ? data.length : 0
    }

    if (ordersRes.status === 'fulfilled') {
      const ordersData = ordersRes.value?.data?.data || ordersRes.value?.data || orderStore.orders || []
      if (Array.isArray(ordersData)) {
        // Total orders count
        salesSummary.orders = ordersData.length
        // Confirmations are orders with approved status
        salesSummary.confirmations = ordersData.filter((order: any) => {
          const status = (order.status || order.status_name || '').toLowerCase()
          return status === 'approved' || status === 'confirmed'
        }).length
      }
    }

    // Process species utilization data from quota API
    if (speciesRes.status === 'fulfilled') {
      const responseData = speciesRes.value?.data
      // The API returns { data: {...aggregates}, detailed_data: [...species] }
      const detailedData = responseData?.detailed_data || []
      
      if (Array.isArray(detailedData) && detailedData.length > 0) {
        // Initialize species totals
        const speciesData: Record<string, SpeciesStats> = {
          elephant: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
          lion: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
          leopard: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
          buffalo: { total: 0, confirmed: 0, provisioned: 0, available: 0, utilizationPercent: 0 },
        }

        // Aggregate data for each target species across all areas
        detailedData.forEach((item: any) => {
          const name = (item.name || item.species_name || item.species?.name || '').toLowerCase()
          
          // Match species by name - Big Four species
          let targetSpecies: string | null = null
          if (name.includes('elephant')) targetSpecies = 'elephant'
          else if (name.includes('lion')) targetSpecies = 'lion'
          else if (name.includes('leopard')) targetSpecies = 'leopard'
          else if (name.includes('buffalo') || name.includes('bufalo') || name.includes('cape buffalo')) targetSpecies = 'buffalo'

          if (targetSpecies) {
            // Aggregate quota counts from species data
            speciesData[targetSpecies].total += item.no_of_species || item.quantity || 0
            speciesData[targetSpecies].confirmed += item.confirmed || item.confirmed_quantity || 0
            speciesData[targetSpecies].provisioned += item.provision_sales || item.provision_quantity || 0
          }
        })

        // Calculate available and utilization percent for each species
        Object.keys(speciesData).forEach((key) => {
          const s = speciesData[key]
          s.available = Math.max(0, s.total - s.confirmed - s.provisioned)
          s.utilizationPercent = s.total > 0 ? Math.round(((s.confirmed + s.provisioned) / s.total) * 100) : 0
        })

        // Update reactive state with real data
        speciesUtilization.elephant = speciesData.elephant
        speciesUtilization.lion = speciesData.lion
        speciesUtilization.leopard = speciesData.leopard
        speciesUtilization.buffalo = speciesData.buffalo
      }
    }
  } catch (error) {
    console.error('Error fetching sales summary stats:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.sales-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-section,
.species-section {
  background: white;
  border-radius: 8px;
  padding: 12px 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.section-subtitle {
  font-size: 11px;
  color: #666;
  margin: 2px 0 0 0;
}

.refresh-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #666;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Sales Cards Grid */
.sales-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.sales-card {
  padding: 14px;
  border-radius: 8px;
  color: white;
}

.sales-card.enquiries {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.sales-card.quotations {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.sales-card.orders {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.sales-card.confirmations {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.card-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

/* Species Grid */
.species-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.species-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #e9ecef;
}

.species-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.species-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.species-icon.elephant {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.species-icon.lion {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.species-icon.leopard {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.species-icon.buffalo {
  background: linear-gradient(135deg, #5a4a42 0%, #3d3530 100%);
}

.species-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.species-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #1a1a1a;
}

.stat-value.text-success {
  color: #10b981;
}

.stat-value.text-warning {
  color: #f59e0b;
}

.stat-value.text-info {
  color: #3b82f6;
}

.utilization-bar {
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.utilization-fill {
  height: 100%;
  background: linear-gradient(90deg, #6b7280 0%, #4b5563 100%);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.utilization-fill.lion-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.utilization-fill.leopard-fill {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
}

.utilization-fill.buffalo-fill {
  background: linear-gradient(90deg, #5a4a42 0%, #3d3530 100%);
}

.utilization-percent {
  font-size: 10px;
  color: #666;
  text-align: center;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  gap: 8px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state p {
  color: #666;
  font-size: 12px;
  margin: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .sales-cards-grid,
  .species-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sales-cards-grid,
  .species-grid {
    grid-template-columns: 1fr;
  }
}
</style>
