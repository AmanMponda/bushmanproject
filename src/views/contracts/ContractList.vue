<template>
  <div class="contract-list-page">
    <!-- Search Bar with Actions -->
    <section class="search-bar-section">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Search..." 
          @input="handleSearch"
        />
      </div>

      <div class="action-buttons">
        <button class="btn primary" type="button" @click="goToCreate">
          <span>+</span> Create Contract
        </button>
        <button class="btn success" type="button" @click="downloadContracts">
          <span>⬇️</span> Download Contract
        </button>
        <button class="btn ghost toggle-filters" @click="showFilters = !showFilters">
          <span>⚙️</span> Filters
        </button>
        <button class="btn ghost">
          <span>📋</span>
        </button>
      </div>
    </section>

    <!-- Filters Section (Hidden by Default) -->
    <section v-if="showFilters" class="filter-section">
      <div class="filter-grid">
        <div class="filter-item">
          <label class="lbl">Contract Type</label>
          <div class="input-wrapper">
            <select v-model="filters.type" @change="applyFilters">
              <option value="">-- All Types --</option>
              <option v-for="type in contractStore.contractTypes" :key="type.id" :value="String(type.id)">
                {{ type.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="filter-item">
          <label class="lbl">Status</label>
          <div class="input-wrapper">
            <select v-model="filters.status" @change="applyFilters">
              <option value="">-- All Status --</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="SIGNED">Signed</option>
              <option value="COMPLETED">Completed</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>

        <div class="filter-item">
          <label class="lbl">&nbsp;</label>
          <button class="btn ghost" type="button" @click="resetFilters">
            <span>⟲</span> Reset
          </button>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="contractStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>🔄 Loading contracts...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="paginatedContracts.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>No Contracts Found</h3>
      <p>Start by creating your first contract</p>
      <button class="btn primary" type="button" @click="goToCreate">
        <span>+</span> Create Contract
      </button>
    </div>

    <!-- Contracts Table -->
    <div v-else class="table-wrapper-outer">
      <table class="data-table">
        <thead>
          <tr>
            <th>CONTRACT #</th>
            <th>STATUS</th>
            <th>START DATE</th>
            <th>TITLE</th>
            <th>TYPE</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in paginatedContracts" :key="contract.id" class="contract-row">
            <td>
              <strong>{{ contract.contract_number }}</strong>
            </td>
            <td>
              <span :class="['badge', getStatusClass(contract.status)]">
                {{ contract.status }}
              </span>
            </td>
            <td>{{ formatDate(contract.start_date) }}</td>
            <td>{{ contract.title }}</td>
            <td>
              <span class="type-badge">{{ getContractTypeName(contract.contract_type_id) }}</span>
            </td>
            <td>
              <div class="action-icons">
                <button 
                  class="icon-btn view" 
                  @click="viewContract(contract.id)" 
                  type="button"
                  title="View"
                >
                  👁️
                </button>
                <button 
                  class="icon-btn download" 
                  @click="downloadContract(contract.id)" 
                  type="button"
                  title="Download"
                >
                  ⬇️
                </button>
                <button 
                  class="icon-btn delete" 
                  @click="deleteContract(contract.id)" 
                  type="button"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Info -->
      <div class="pagination-info">
        <p>Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, contracts.length) }} of {{ contracts.length }} entries</p>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="previousPage"
          type="button"
          class="btn ghost"
        >
          ‹
        </button>
        <button 
          v-for="page in totalPages" 
          :key="page"
          @click="currentPage = page"
          type="button"
          :class="['page-btn', { active: currentPage === page }]"
        >
          {{ page }}
        </button>
        <button 
          :disabled="currentPage === totalPages" 
          @click="nextPage"
          type="button"
          class="btn ghost"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '@/stores/bushman/contract-store'
import Swal from 'sweetalert2'

const router = useRouter()
const contractStore = useContractStore()

// State
const showFilters = ref(false)
const filters = ref({
  search: '',
  type: '',
  status: ''
})

const currentPage = ref(1)
const itemsPerPage = 15

// Computed
const contracts = computed(() => {
  let result = contractStore.contracts || []

  // Apply search filter
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    result = result.filter((c: any) => 
      c.contract_number?.toLowerCase().includes(searchTerm) ||
      c.title?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply type filter
  if (filters.value.type) {
    result = result.filter((c: any) => c.contract_type_id === Number(filters.value.type))
  }

  // Apply status filter
  if (filters.value.status) {
    result = result.filter((c: any) => c.status === filters.value.status)
  }

  return result
})

const totalPages = computed(() => Math.ceil(contracts.value.length / itemsPerPage))

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return contracts.value.slice(start, end)
})

// Methods
const loadContracts = async () => {
  try {
    console.log('🔄 Loading contracts...')
    await contractStore.listContracts()
    console.log('✅ Contracts loaded:', contractStore.contracts)
    console.log('📊 Total contracts:', contractStore.contracts?.length || 0)
  } catch (error) {
    console.error('❌ Error loading contracts:', error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load contracts',
      confirmButtonColor: '#dc2626'
    })
  }
}

const formatDate = (date: string) => {
  if (!date) return 'N/A'
  try {
    const parsed = new Date(date)
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const getContractTypeName = (typeId: number) => {
  const type = contractStore.contractTypes.find((t: any) => t.id === typeId)
  return type?.name || 'Unknown'
}

const getStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'status-draft',
    'ACTIVE': 'status-active',
    'SIGNED': 'status-signed',
    'COMPLETED': 'status-completed',
    'TERMINATED': 'status-terminated'
  }
  return statusMap[status] || 'status-draft'
}

const handleSearch = () => {
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  filters.value = {
    search: '',
    type: '',
    status: ''
  }
  currentPage.value = 1
}

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const goToCreate = () => {
  router.push({ name: 'contracts-create' })
}

const viewContract = (id: number) => {
  router.push({ name: 'contracts-view', params: { id } })
}

const downloadContract = (id: number) => {
  Swal.fire({
    icon: 'info',
    title: 'Download',
    text: 'Contract download feature coming soon',
    confirmButtonColor: '#2563eb'
  })
}

const downloadContracts = () => {
  Swal.fire({
    icon: 'info',
    title: 'Download',
    text: 'Bulk download feature coming soon',
    confirmButtonColor: '#2563eb'
  })
}

const deleteContract = async (id: number) => {
  const contract = contractStore.contracts.find((c: any) => c.id === id)
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Delete Contract?',
    text: `Are you sure you want to delete "${contract?.contract_number}"?`,
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Cancel'
  })

  if (result.isConfirmed) {
    try {
      await contractStore.deleteContract(id)
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Contract has been deleted.',
        confirmButtonColor: '#2563eb'
      })
      await loadContracts()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete contract',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

// Lifecycle
onMounted(() => {
  loadContracts()
})
</script>

<style scoped>
.contract-list-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* Search Bar Section */
.search-bar-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.search-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 12px;
  background: white;
  height: 40px;
}

.search-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #999;
}

.search-wrapper input {
  border: none;
  outline: none;
  background: transparent;
  padding: 8px 0;
  flex: 1;
  font-size: 14px;
  color: #333;
}

.search-wrapper input::placeholder {
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9f9f9;
}

.btn.primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn.primary:hover {
  background: #1d4ed8;
}

.btn.success {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}

.btn.success:hover {
  background: #15803d;
}

.btn.ghost {
  border: 1px solid #ddd;
  background: white;
}

.btn.ghost:hover {
  background: #f9f9f9;
}

.toggle-filters {
  border: 1px solid #2563eb;
  color: #2563eb;
}

.toggle-filters:hover {
  background: #dbeafe;
}

/* Filter Section */
.filter-section {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  display: grid;
  gap: 12px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item .lbl {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  height: 36px;
}

.input-wrapper select {
  border: none;
  outline: none;
  background: transparent;
  padding: 6px 10px;
  flex: 1;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #333;
  font-size: 18px;
  margin: 0 0 8px;
}

.empty-state p {
  color: #999;
  font-size: 13px;
  margin: 0 0 24px;
}

/* Table */
.table-wrapper-outer {
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.data-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.data-table td {
  padding: 12px;
  color: #333;
}

.contract-row td:first-child {
  font-weight: 600;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-draft {
  background: #e0e7ff;
  color: #3730a3;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-signed {
  background: #dbeafe;
  color: #0c4a6e;
}

.status-completed {
  background: #d1fae5;
  color: #047857;
}

.status-terminated {
  background: #fee2e2;
  color: #991b1b;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #f0f0f0;
  color: #666;
}

/* Action Icons */
.action-icons {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f9f9f9;
}

.icon-btn.view {
  color: #2563eb;
  border-color: #2563eb;
}

.icon-btn.view:hover {
  background: #dbeafe;
}

.icon-btn.download {
  color: #16a34a;
  border-color: #16a34a;
}

.icon-btn.download:hover {
  background: #dcfce7;
}

.icon-btn.delete {
  color: #dc2626;
  border-color: #dc2626;
}

.icon-btn.delete:hover {
  background: #fee2e2;
}

/* Pagination */
.pagination-info {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #999;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  padding: 12px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #f9f9f9;
}

.page-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
