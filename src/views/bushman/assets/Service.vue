<template>
  <div class="service-page">
    <StandardDataTable
      title="Vehicle Service Records"
      :columns="serviceColumns"
      :data="services"
      :loading="loading"
      :page-actions="pageActions"
      @filter-update="handleFiltersUpdate"
      @refresh="fetchServices"
    >
      <template #cell-vehicle="{ row }">
        <span class="badge bg-primary">{{ row.registration_number || row.vehicle?.registration_number || '-' }}</span>
      </template>
      <template #cell-service_type="{ row }">
        {{ row.service_type || '-' }}
      </template>
      <template #cell-service_date="{ row }">
        {{ formatDate(row.service_date) }}
      </template>
      <template #cell-next_service_date="{ row }">
        <span :class="{ 'text-danger': isOverdue(row.next_service_date) }">
          {{ formatDate(row.next_service_date) }}
        </span>
      </template>
      <template #cell-mileage="{ row }">
        {{ row.mileage ? row.mileage.toLocaleString() + ' km' : '-' }}
      </template>
      <template #cell-cost="{ row }">
        {{ row.cost ? formatCurrency(row.cost) : '-' }}
      </template>
      <template #cell-status="{ row }">
        <span :class="getStatusBadgeClass(row.status)">{{ row.status || 'Pending' }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary" @click="viewService(row)" title="View">
            <i class="fa fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="editService(row)" title="Edit">
            <i class="fa fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteService(row)" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </template>
    </StandardDataTable>

    <!-- Add/Edit Service Modal -->
    <StandardModal
      ref="serviceModalRef"
      :title="editingServiceId ? 'Edit Service Record' : 'Add Service Record'"
      size="lg"
      @hidden="resetServiceForm"
    >
      <form @submit.prevent="saveService">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Vehicle <span class="text-danger">*</span></label>
            <Multiselect
              v-model="serviceForm.vehicle_id"
              :options="vehicles"
              :searchable="true"
              placeholder="Select vehicle"
              label="registration_number"
              track-by="id"
              :allow-empty="false"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Service Type <span class="text-danger">*</span></label>
            <select v-model="serviceForm.service_type" class="form-select" required>
              <option value="">Select type</option>
              <option value="Routine Maintenance">Routine Maintenance</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Tire Replacement">Tire Replacement</option>
              <option value="Brake Service">Brake Service</option>
              <option value="Engine Repair">Engine Repair</option>
              <option value="Transmission">Transmission</option>
              <option value="Electrical">Electrical</option>
              <option value="Body Work">Body Work</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Service Date <span class="text-danger">*</span></label>
            <input v-model="serviceForm.service_date" type="date" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Next Service Date</label>
            <input v-model="serviceForm.next_service_date" type="date" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Mileage at Service (km)</label>
            <input v-model.number="serviceForm.mileage" type="number" class="form-control" min="0" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Cost</label>
            <input v-model.number="serviceForm.cost" type="number" class="form-control" min="0" step="0.01" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Service Provider</label>
            <input v-model="serviceForm.service_provider" type="text" class="form-control" placeholder="Garage/Workshop name" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Status</label>
            <select v-model="serviceForm.status" class="form-select">
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label">Description / Notes</label>
            <textarea v-model="serviceForm.description" class="form-control" rows="3" placeholder="Service details, parts replaced, etc."></textarea>
          </div>
        </div>
        <div v-if="formError" class="alert alert-danger mt-3">{{ formError }}</div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-secondary" @click="closeServiceModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            {{ editingServiceId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </StandardModal>

    <!-- View Service Modal -->
    <StandardModal ref="viewModalRef" title="Service Record Details" size="lg">
      <div v-if="selectedService" class="row g-3">
        <div class="col-md-6">
          <strong>Vehicle:</strong>
          <p>{{ selectedService.registration_number || selectedService.vehicle?.registration_number || '-' }}</p>
        </div>
        <div class="col-md-6">
          <strong>Service Type:</strong>
          <p>{{ selectedService.service_type || '-' }}</p>
        </div>
        <div class="col-md-6">
          <strong>Service Date:</strong>
          <p>{{ formatDate(selectedService.service_date) }}</p>
        </div>
        <div class="col-md-6">
          <strong>Next Service Date:</strong>
          <p>{{ formatDate(selectedService.next_service_date) }}</p>
        </div>
        <div class="col-md-6">
          <strong>Mileage:</strong>
          <p>{{ selectedService.mileage ? selectedService.mileage.toLocaleString() + ' km' : '-' }}</p>
        </div>
        <div class="col-md-6">
          <strong>Cost:</strong>
          <p>{{ selectedService.cost ? formatCurrency(selectedService.cost) : '-' }}</p>
        </div>
        <div class="col-md-6">
          <strong>Service Provider:</strong>
          <p>{{ selectedService.service_provider || '-' }}</p>
        </div>
        <div class="col-md-6">
          <strong>Status:</strong>
          <p><span :class="getStatusBadgeClass(selectedService.status)">{{ selectedService.status || 'Pending' }}</span></p>
        </div>
        <div class="col-12">
          <strong>Description:</strong>
          <p>{{ selectedService.description || '-' }}</p>
        </div>
        <div class="col-12 d-flex justify-content-end mt-3">
          <button type="button" class="btn btn-secondary" @click="closeViewModal">Close</button>
        </div>
      </div>
    </StandardModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import axios from 'axios'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import StandardModal from '@/components/bootstrap/StandardModal.vue'
import Multiselect from '@vueform/multiselect'

const toast = useToast()
const swal = useSwal()
const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

// State
const loading = ref(false)
const saving = ref(false)
const services = ref<any[]>([])
const vehicles = ref<any[]>([])
const selectedService = ref<any>(null)
const editingServiceId = ref<number | null>(null)
const formError = ref('')

// Modal refs
const serviceModalRef = ref<{ show: () => void; hide: () => void } | null>(null)
const viewModalRef = ref<{ show: () => void; hide: () => void } | null>(null)

// Form
const serviceForm = ref({
  vehicle_id: null as any,
  service_type: '',
  service_date: '',
  next_service_date: '',
  mileage: null as number | null,
  cost: null as number | null,
  service_provider: '',
  status: 'Completed',
  description: ''
})

// Columns
const serviceColumns = [
  { key: 'vehicle', label: 'Vehicle', sortable: true, visible: true },
  { key: 'service_type', label: 'Service Type', sortable: true, visible: true },
  { key: 'service_date', label: 'Service Date', sortable: true, visible: true },
  { key: 'next_service_date', label: 'Next Service', sortable: true, visible: true },
  { key: 'mileage', label: 'Mileage', sortable: true, visible: true },
  { key: 'cost', label: 'Cost', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
]

// Page actions
const pageActions = computed(() => [
  {
    label: 'Add Service',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openAddServiceModal()
  },
  {
    label: 'Refresh',
    icon: 'fa fa-refresh',
    class: 'btn-outline-secondary',
    method: () => fetchServices()
  }
])

// Methods
async function fetchServices() {
  loading.value = true
  try {
    const res = await axios.get(`${apiBaseUrl}/vehicle-services`)
    services.value = res.data?.data || res.data || []
  } catch (err) {
    toast.error('Failed to load service records')
    services.value = []
  } finally {
    loading.value = false
  }
}

async function fetchVehicles() {
  try {
    const res = await axios.get(`${apiBaseUrl}/vehicle-assets/display`)
    vehicles.value = res.data?.data || res.data || []
  } catch (err) {
    vehicles.value = []
  }
}

function handleFiltersUpdate(filters: any) {
  // Handle filter changes if needed
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    'Completed': 'badge bg-success',
    'In Progress': 'badge bg-warning text-dark',
    'Scheduled': 'badge bg-info',
    'Pending': 'badge bg-secondary'
  }
  return statusMap[status] || 'badge bg-secondary'
}

function openAddServiceModal() {
  editingServiceId.value = null
  resetServiceForm()
  serviceModalRef.value?.show()
}

function editService(service: any) {
  editingServiceId.value = service.id
  serviceForm.value = {
    vehicle_id: service.vehicle_id || service.vehicle?.id || null,
    service_type: service.service_type || '',
    service_date: service.service_date?.split('T')[0] || '',
    next_service_date: service.next_service_date?.split('T')[0] || '',
    mileage: service.mileage || null,
    cost: service.cost || null,
    service_provider: service.service_provider || '',
    status: service.status || 'Completed',
    description: service.description || ''
  }
  serviceModalRef.value?.show()
}

function viewService(service: any) {
  selectedService.value = service
  viewModalRef.value?.show()
}

function closeServiceModal() {
  serviceModalRef.value?.hide()
}

function closeViewModal() {
  viewModalRef.value?.hide()
}

function resetServiceForm() {
  serviceForm.value = {
    vehicle_id: null,
    service_type: '',
    service_date: '',
    next_service_date: '',
    mileage: null,
    cost: null,
    service_provider: '',
    status: 'Completed',
    description: ''
  }
  formError.value = ''
  editingServiceId.value = null
}

async function saveService() {
  formError.value = ''
  
  if (!serviceForm.value.vehicle_id) {
    formError.value = 'Please select a vehicle'
    return
  }
  if (!serviceForm.value.service_type) {
    formError.value = 'Please select a service type'
    return
  }
  if (!serviceForm.value.service_date) {
    formError.value = 'Please enter a service date'
    return
  }

  saving.value = true
  try {
    const payload = {
      ...serviceForm.value,
      vehicle_id: typeof serviceForm.value.vehicle_id === 'object' 
        ? serviceForm.value.vehicle_id.id 
        : serviceForm.value.vehicle_id
    }

    if (editingServiceId.value) {
      await axios.put(`${apiBaseUrl}/vehicle-services/${editingServiceId.value}`, payload)
      toast.success('Service record updated')
    } else {
      await axios.post(`${apiBaseUrl}/vehicle-services`, payload)
      toast.success('Service record created')
    }
    
    closeServiceModal()
    await fetchServices()
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Failed to save service record'
    formError.value = msg
    toast.error(msg)
  } finally {
    saving.value = false
  }
}

async function confirmDeleteService(service: any) {
  const confirmed = await swal.confirm({
    title: 'Delete Service Record',
    text: `Are you sure you want to delete this service record? This action cannot be undone.`,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!confirmed) return

  try {
    await axios.delete(`${apiBaseUrl}/vehicle-services/${service.id}`)
    toast.success('Service record deleted')
    await fetchServices()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to delete service record')
  }
}

onMounted(async () => {
  await Promise.all([fetchServices(), fetchVehicles()])
})
</script>

<style scoped>
.service-page {
  padding: 1rem;
}
</style>
