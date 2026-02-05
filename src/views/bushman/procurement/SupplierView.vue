<template>
  <div>
    <!-- Breadcrumb -->
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#" @click.prevent="$router.push('/procurement')">Procurement</a></li>
          <li class="breadcrumb-item"><a href="#" @click.prevent="$router.push('/procurement/suppliers')">Suppliers</a></li>
          <li class="breadcrumb-item active">{{ supplier?.full_name || 'View Supplier' }}</li>
        </ul>
      </div>

      <button @click="$router.back()" class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill">
        <i class="fa fa-arrow-left me-1"></i> Back
      </button>
    </div>

    <div class="row gx-4">
      <div class="col-lg-12">
        <div class="card">
          <!-- HEADER -->
          <div class="card-header d-flex align-items-center bg-white fw-400">
            <div class="d-flex align-items-center">
              <div class="vehicle-icon me-2">
                <i class="fa fa-building fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">
                  {{ supplier?.full_name || supplier?.trading_name || 'Supplier Details' }}
                </h4>
                <small class="text-muted">
                  {{ supplier?.code }} • 
                  <span :class="getStatusClass(supplier?.status)">{{ supplier?.status || 'DRAFT' }}</span>
                </small>
              </div>
            </div>

            <div class="ms-auto d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary" @click="loadSupplier" :disabled="loading">
                <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>
                Refresh
              </button>

              <button class="btn btn-primary" @click="editSupplier">
                <i class="fa fa-edit me-1"></i>
                Edit Supplier
              </button>
            </div>
          </div>

          <!-- TABS -->
          <div class="card-header p-0 border-bottom bg-white">
            <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
              <li v-for="tab in tabs" :key="tab.key" class="nav-item flex-fill text-center">
                <a :href="'#' + tab.key" class="nav-link" :class="{ active: activeTab === tab.key }"
                  @click="onTabClick(tab)" data-bs-toggle="tab">
                  <i :class="tab.icon"></i> {{ tab.label }}
                </a>
              </li>
            </ul>
          </div>

          <!-- TAB CONTENT -->
          <div class="tab-content p-4">
            <!-- Basic Info Tab -->
            <div class="tab-pane fade show active" id="basic_info">
              <div class="row g-4">
                <div class="col-md-3">
                  <label class="form-label text-muted small">Supplier Code</label>
                  <div class="fw-semibold">{{ supplier?.code || '-' }}</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label text-muted small">Type</label>
                  <div class="fw-semibold">
                    <span class="badge bg-info bg-opacity-20 text-info">{{ supplier?.type || '-' }}</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label text-muted small">Status</label>
                  <div class="fw-semibold">
                    <span class="badge" :class="getStatusBadgeClass(supplier?.status)">
                      {{ supplier?.status || 'DRAFT' }}
                    </span>
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label text-muted small">Base Currency</label>
                  <div class="fw-semibold">{{ supplier?.base_currency?.code || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small">Full Name</label>
                  <div class="fw-semibold">{{ supplier?.full_name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small">Trading Name</label>
                  <div class="fw-semibold">{{ supplier?.trading_name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Country</label>
                  <div class="fw-semibold">{{ supplier?.country?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Nationality</label>
                  <div class="fw-semibold">{{ supplier?.nationality?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Created Date</label>
                  <div class="fw-semibold">{{ formatDate(supplier?.created_at) }}</div>
                </div>
                <div class="col-md-12">
                  <label class="form-label text-muted small">Notes</label>
                  <div class="fw-semibold">{{ supplier?.notes || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- Company Profile Tab -->
            <div class="tab-pane fade" id="company_profile">
              <div v-if="supplier?.company_profile" class="row g-4">
                <div class="col-md-4">
                  <label class="form-label text-muted small">Registration Number</label>
                  <div class="fw-semibold">{{ supplier.company_profile.registration_number || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">TIN</label>
                  <div class="fw-semibold">{{ supplier.company_profile.tin || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Business Type</label>
                  <div class="fw-semibold">{{ supplier.company_profile.business_type || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Registration Country</label>
                  <div class="fw-semibold">{{ supplier.company_profile.registration_country?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Tax Residency Country</label>
                  <div class="fw-semibold">{{ supplier.company_profile.tax_residency_country?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Number of Employees</label>
                  <div class="fw-semibold">{{ supplier.company_profile.number_of_employees || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted small">Annual Revenue</label>
                  <div class="fw-semibold">{{ formatCurrency(supplier.company_profile.annual_revenue) }}</div>
                </div>
              </div>
              <div v-else class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="No Data"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">
                <h5 class="fw-bold">No Company Profile</h5>
                <p class="text-muted">This supplier is not a company type or profile data is not available.</p>
              </div>
            </div>

            <!-- Contacts Tab -->
            <div class="tab-pane fade" id="contacts">
              <div v-if="supplier?.contacts && supplier.contacts.length > 0">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Contact</th>
                        <th>Primary</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="contact in supplier.contacts" :key="contact.id">
                        <td>
                          <span class="badge bg-primary bg-opacity-20 text-primary">
                            {{ contact.contact_type?.name || 'N/A' }}
                          </span>
                        </td>
                        <td class="fw-semibold">{{ contact.contact }}</td>
                        <td>
                          <i v-if="contact.is_primary" class="fa fa-check-circle text-success"></i>
                          <span v-else class="text-muted">-</span>
                        </td>
                        <td class="text-muted">{{ contact.notes || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="No Contacts"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">
                <h5 class="fw-bold">No Contacts</h5>
                <p class="text-muted">No contact information available for this supplier.</p>
              </div>
            </div>

            <!-- Identities Tab -->
            <div class="tab-pane fade" id="identities">
              <div v-if="supplier?.identities && supplier.identities.length > 0">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Issue Date</th>
                        <th>Expiry Date</th>
                        <th>Issuing Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="identity in supplier.identities" :key="identity.id">
                        <td>
                          <span class="badge bg-secondary bg-opacity-20 text-dark">
                            {{ identity.identity_type?.name || 'N/A' }}
                          </span>
                        </td>
                        <td class="fw-semibold">{{ identity.value }}</td>
                        <td>{{ formatDate(getIdentityDate(identity, 'ISSUE_DATE')) }}</td>
                        <td>{{ formatDate(getIdentityDate(identity, 'EXPIRY_DATE')) }}</td>
                        <td>{{ getIdentityIssuingCountry(identity) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="No Identities"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">
                <h5 class="fw-bold">No Identity Documents</h5>
                <p class="text-muted">No identity documents recorded for this supplier.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL;
const loading = ref(false);
const supplier = ref(null);
const activeTab = ref("basic_info");

const tabs = ref([
  {
    key: "basic_info",
    label: "Basic Info",
    icon: "fa fa-info-circle",
  },
  {
    key: "company_profile",
    label: "Company Profile",
    icon: "fa fa-building",
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: "fa fa-address-book",
  },
  {
    key: "identities",
    label: "Identity Documents",
    icon: "fa fa-id-card",
  },
]);

const onTabClick = (tab) => {
  activeTab.value = tab.key;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const loadSupplier = async () => {
  const supplierId = route.params.id;
  if (!supplierId) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Supplier ID not provided'
    });
    router.push('/procurement/suppliers');
    return;
  }

  loading.value = true;
  try {
    const response = await axios.get(`${apiBaseUrl}suppliers/${supplierId}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    supplier.value = response.data?.data || response.data;
  } catch (error) {
    console.error('Failed to load supplier:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load supplier details'
    });
    router.push('/procurement/suppliers');
  } finally {
    loading.value = false;
  }
};

const editSupplier = () => {
  router.push(`/procurement/suppliers/edit/${supplier.value.id}`);
};

const getStatusClass = (status) => {
  const statusMap = {
    'ACTIVE': 'text-success',
    'SUSPENDED': 'text-warning',
    'BLACKLISTED': 'text-danger',
    'CLOSED': 'text-secondary',
    'PENDING_KYC': 'text-info',
    'DRAFT': 'text-muted'
  };
  return statusMap[status] || 'text-muted';
};

const getStatusBadgeClass = (status) => {
  const statusMap = {
    'ACTIVE': 'bg-success bg-opacity-20 text-success',
    'SUSPENDED': 'bg-warning bg-opacity-20 text-warning',
    'BLACKLISTED': 'bg-danger bg-opacity-20 text-danger',
    'CLOSED': 'bg-secondary bg-opacity-20 text-secondary',
    'PENDING_KYC': 'bg-info bg-opacity-20 text-info',
    'DRAFT': 'bg-secondary bg-opacity-20 text-muted'
  };
  return statusMap[status] || 'bg-secondary bg-opacity-20 text-muted';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (amount) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const getIdentityDate = (identity, dateType) => {
  if (!identity.identity_dates || !Array.isArray(identity.identity_dates)) return null;
  const dateEntry = identity.identity_dates.find(d => d.date_type === dateType);
  return dateEntry?.date_value || null;
};

const getIdentityIssuingCountry = (identity) => {
  if (!identity.identity_dates || !Array.isArray(identity.identity_dates)) return '-';
  const issueDate = identity.identity_dates.find(d => d.date_type === 'ISSUE_DATE');
  return issueDate?.issuing_country?.name || '-';
};

const getParentCategoryName = (parentId) => {
  // This would need categories loaded from metadata endpoint
  // For now, just return the parent_id
  return `Parent #${parentId}`;
};

onMounted(() => {
  loadSupplier();
});
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  border-bottom: 1px solid #e9ecef;
  padding: 1.25rem;
}

.nav-tabs {
  border-bottom: none;
}

.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dee2e6;
  color: #495057;
}

.nav-tabs .nav-link.active {
  border-bottom-color: #0d6efd;
  color: #0d6efd;
  background-color: transparent;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #6c757d;
  border-bottom: 2px solid #dee2e6;
}

.form-label.small {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
</style>
