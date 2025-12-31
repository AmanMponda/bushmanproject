<template>
  <div v-if="loading" class="text-center p-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div v-else-if="item" class="sales-package-details">
    <div class="row gx-4">
      <div class="col-lg-12">
        <div class="card">
          <!-- HEADER -->
          <div class="card-header d-flex align-items-center bg-white fw-400">
            <div class="d-flex align-items-center">
              <div class="vehicle-icon me-3">
                <i class="fa fa-box fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">{{ item?.name || 'N/A' }}</h4>
                <small class="text-muted">
                  {{ item?.area?.name || 'N/A' }} •
                  {{ item?.regulatory_package?.name || 'N/A' }}
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
            </div>
          </div>

          <!-- CONTENT -->
          <div class="card-body p-4">
            <!-- Package Information -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="card border-primary">
                  <div class="card-body">
                    <h6 class="card-title text-primary"><i class="fa fa-info-circle me-2"></i>Package Information</h6>
                    <p class="mb-1"><strong>Name:</strong> {{ item?.name || 'N/A' }}</p>
                    <p class="mb-0">
                      <strong>Description:</strong> {{ item?.description || 'No description available' }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card border-success">
                  <div class="card-body">
                    <h6 class="card-title text-success"><i class="fa fa-map-marker-alt me-2"></i>Area Information</h6>
                    <p class="mb-1"><strong>Area Name:</strong> {{ item.area?.name || 'N/A' }}</p>
                    <p class="mb-0">
                      <strong>Area Description:</strong> {{ item.area?.description || 'No description available' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Licence Information -->
            <div class="row g-3 mb-4">
              <div class="col-md-12">
                <div class="card border-warning">
                  <div class="card-body">
                    <h6 class="card-title text-warning"><i class="fa fa-certificate me-2"></i>Licence Information</h6>
                    <div class="row">
                      <div class="col-md-4">
                        <p class="mb-1"><strong>Package Name:</strong> {{ item.regulatory_package?.name || 'N/A' }}</p>
                      </div>
                      <div class="col-md-4">
                        <p class="mb-1">
                          <strong>Duration:</strong> {{ item.regulatory_package?.duration || 'N/A' }} days
                        </p>
                      </div>
                      <div class="col-md-4">
                        <p class="mb-0">
                          <strong>Created Date:</strong> {{ formatDate(item.regulatory_package?.created_at) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Species Table -->
            <div class="card">
              <div class="card-header bg-white">
                <h6 class="mb-0">
                  <i class="fa fa-paw me-2 text-primary"></i>
                  Species ({{ item.species?.length || 0 }})
                </h6>
              </div>
              <div class="card-body">
                <div v-if="item?.species && item.species.length > 0">
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Species Name</th>
                          <th class="text-center">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="species in item.species" :key="species.id">
                          <td>{{ species?.id || 'N/A' }}</td>
                          <td class="fw-semibold">{{ species?.species?.name || 'N/A' }}</td>
                          <td class="text-center">
                            <span :class="species?.quantity > 0 ? 'badge bg-success' : 'badge bg-danger'">
                              {{ species?.quantity !== null ? species.quantity : 'N/A' }}
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { format } from 'date-fns'
import Swal from 'sweetalert2'

interface Props {
  item: any
}

defineProps<Props>()

const emit = defineEmits<{
  'go-back': []
  edit: []
  delete: []
}>()

const loading = ref(false)

const handleGoBack = () => {
  emit('go-back')
}

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-secondary',
      cancelButton: 'btn btn-dark me-3',
    },
    buttonsStyling: false
  });
  swalWithBootstrapButtons
    .fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
      padding: '2em'
    })
    .then((result: any) => {
      if (result.value) {
        swalWithBootstrapButtons.fire('Deleted!', 'Your file has been deleted.', 'success');
        emit('delete')
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithBootstrapButtons.fire('Cancelled', 'Your file is safe :)', 'error');
      }
    });
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A'
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy')
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.sales-package-details {
  max-width: 1400px;
  margin: 0 auto;
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
