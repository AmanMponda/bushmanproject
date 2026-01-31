<template>
  <div class="supplier-management-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Procurement</a></li>
          <li class="breadcrumb-item active">Suppliers</li>
        </ul>
      </div>
    </div>

    <!-- SUPPLIERS LIST VIEW -->
    <template v-if="showSupplierList">
      <card>
        <!-- <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
          <i class="fa fa-building me-2"></i>Suppliers
        </card-header> -->
        <card-body>
          <StandardDataTable :columns="columns" :data="suppliers" :loading="loading" :filters="tableFilters"
            :custom-filters="customFilters" :actionButtons="supplierActionButtons" :show-date-filters="false"
            :server-side="true" :pagination="pagination" :page-size-options="[10, 15, 25, 50, 100]"
            :default-page-size="tableFilters.limit" @update:filters="handleFiltersUpdate"
            @page-change="handlePageChange">
            <template #name="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info cursor-pointer">
                {{ row.name || '-' }}
              </span>
            </template>
            <template #notes="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-muted cursor-pointer">
                {{ row.notes || '-' }}
              </span>
            </template>

            <template #category="{ row }">
              <div class="fs-14px text-muted">{{ getPrimaryCategory(row) }}</div>
            </template>

            <template #status="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold" :class="getStatusTextColor(row.status)">
                {{ row.status || 'DRAFT' }}
              </span>
            </template>

            <template #actions="{ row }">
              <button class="btn btn-outline-primary btn-sm me-1" title="View" @click="openViewModal(row)">
                <i class="fa fa-eye"></i>
              </button>
              <button class="btn btn-outline-primary btn-sm me-1" title="Edit" @click="openEditSupplierForm(row)">
                <i class="fa fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm" title="Delete" @click="deleteSupplier(row)">
                <i class="fa fa-trash"></i>
              </button>
            </template>
          </StandardDataTable>
        </card-body>
      </card>
    </template>

    <!-- SUPPLIER DETAILS VIEW (READ-ONLY, ALL SECTIONS STACKED) -->
    <template v-else-if="showViewDetails">
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-0"><i class="fa fa-building me-2"></i>Supplier Details</h5>
            <small class="text-muted">{{ viewSupplier?.full_name || viewSupplier?.name || '-' }}</small>
          </div>
          <button type="button" class="btn btn-outline-secondary" @click="backToSupplierList">
            <i class="fa fa-arrow-left me-2"></i>Back to List
          </button>
        </div>
        <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
          <div v-if="!viewSupplier" class="alert alert-info">
            <i class="fa fa-spinner fa-spin me-2"></i>Loading supplier details...
          </div>
          <template v-else>
            <!-- BASIC INFORMATION -->
            <div class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Basic Information</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Code</label>
                  <div class="fw-semibold">{{ viewSupplier?.code || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Status</label>
                  <div>
                    <span class="badge" :class="statusBadge(viewSupplier?.status)">
                      {{ viewSupplier?.status || 'DRAFT' }}
                    </span>
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Entity Type</label>
                  <div class="fw-semibold">{{ viewSupplier?.type || viewSupplier?.entity_type || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Full Name</label>
                  <div class="fw-semibold">{{ viewSupplier?.full_name || viewSupplier?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Trading Name</label>
                  <div class="fw-semibold">{{ viewSupplier?.trading_name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Country</label>
                  <div class="fw-semibold">{{ viewSupplier?.country?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Base Currency</label>
                  <div class="fw-semibold">{{ viewSupplier?.base_currency?.name || viewSupplier?.base_currency?.code || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- COMPANY PROFILE -->
            <div v-if="(viewSupplier?.type === 'COMPANY' || viewSupplier?.entity_type === 'COMPANY') && viewSupplier?.company_profile" class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-building me-2"></i>Company Profile</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Registration Number</label>
                  <div class="fw-semibold">{{ viewSupplier.company_profile.registration_no || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Legal Name</label>
                  <div class="fw-semibold">{{ viewSupplier.company_profile.legal_name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Business Type</label>
                  <div class="fw-semibold">{{ viewSupplier.company_profile.business_type || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Incorporation Date</label>
                  <div class="fw-semibold">{{ viewSupplier.company_profile.incorporation_date || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Registration Country</label>
                  <div class="fw-semibold">{{ viewSupplier.company_profile.registration_country?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Tax Residency Country</label>
                  <div class="fw-semibold">{{ viewSupplier.company_profile.tax_residency_country?.name || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- INDIVIDUAL PROFILE -->
            <div v-if="(viewSupplier?.type === 'INDIVIDUAL' || viewSupplier?.entity_type === 'INDIVIDUAL') && viewSupplier?.individual_profile" class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-user me-2"></i>Individual Profile</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Date of Birth</label>
                  <div class="fw-semibold">{{ viewSupplier.individual_profile.date_of_birth || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Gender</label>
                  <div class="fw-semibold">{{ viewSupplier.individual_profile.gender || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Nationality</label>
                  <div class="fw-semibold">{{ viewSupplier.individual_profile.nationality_country?.name || '-' }}</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label text-muted">Marital Status</label>
                  <div class="fw-semibold">{{ viewSupplier.individual_profile.marital_status || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- REGISTERED ADDRESS -->
            <div v-if="getRegisteredAddress()" class="pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-map-marker me-2"></i>Registered Address</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Address Line 1</label>
                  <div class="fw-semibold">{{ getRegisteredAddress()?.address_line_1 || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">City</label>
                  <div class="fw-semibold">{{ getRegisteredAddress()?.city || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Country</label>
                  <div class="fw-semibold">{{ getRegisteredAddress()?.country?.name || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- NOTES -->
            <div v-if="viewSupplier?.notes" class="pb-3">
              <label class="form-label text-muted">Notes</label>
              <div class="border p-3 rounded bg-light">{{ viewSupplier.notes }}</div>
            </div>

            <!-- CONTACTS SECTION -->
            <div class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-contact-card me-2"></i>Contacts</h6>
              <div v-if="viewContacts.length > 0" class="row g-3">
                <div v-for="(contact, index) in viewContacts" :key="index" class="col-md-6">
                  <div class="card h-100">
                    <div class="card-body">
                      <h6 class="card-title mb-3">
                        <i class="fa fa-contact-card me-2"></i>
                        {{ contact.name || '-' }}
                        <span v-if="contact.is_primary" class="badge bg-primary ms-2">Primary</span>
                      </h6>
                      <div class="mb-2">
                        <label class="form-label text-muted small">Type</label>
                        <div class="fw-semibold text-capitalize">{{ contact.type || '-' }}</div>
                      </div>
                      <div>
                        <label class="form-label text-muted small">Contact</label>
                        <div class="fw-semibold">{{ contact.contact || contact.phone || contact.email || '-' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>No contacts recorded
              </div>
            </div>

            <!-- IDENTITIES SECTION -->
            <div class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-id-card me-2"></i>Identities</h6>
              <div v-if="viewIdentities.length > 0" class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Identity Type</th>
                      <th>Identity Number</th>
                      <th>Issued Date</th>
                      <th>Issuing Country</th>
                      <th>Issuing Authority</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(identity, index) in viewIdentities" :key="index">
                      <td class="fw-semibold">{{ getIdentityTypeName(identity.identity_type_id) || '-' }}</td>
                      <td>{{ identity.identity_number || '-' }}</td>
                      <td>{{ identity.issued_date || '-' }}</td>
                      <td>{{ identity.identity_dates?.issuing_country?.name || '-' }}</td>
                      <td>{{ identity.identity_dates?.issuing_authority || '-' }}</td>
                      <td>{{ identity.identity_dates?.expire_date || '-' }}</td>
                      <td>
                        <span v-if="identity.is_verified" class="badge bg-success">Verified</span>
                        <span v-else class="badge bg-warning">Unverified</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>No identities recorded
              </div>
            </div>

            <!-- CATEGORIES SECTION -->
            <div>
              <h6 class="text-primary mb-3"><i class="fa fa-tags me-2"></i>Categories</h6>
              <div v-if="viewCategories.length > 0" class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Category</th>
                      <th>Code</th>
                      <th>Type/Tag</th>
                      <th>Effective From</th>
                      <th>Effective To</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cat in viewCategories" :key="cat.id">
                      <td class="fw-semibold">{{ cat.display_name || cat.name || '-' }}</td>
                      <td>{{ cat.pivot?.code || '-' }}</td>
                      <td>
                        <div v-if="cat.pivot?.types" class="small">
                          <span v-for="t in cat.pivot.types" :key="t" class="badge bg-secondary me-1">{{ t }}</span>
                        </div>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td class="small">{{ cat.pivot?.effective_from || '-' }}</td>
                      <td class="small">{{ cat.pivot?.effective_to || '-' }}</td>
                      <td>
                        <span v-if="cat.pivot?.is_active" class="badge bg-success">Active</span>
                        <span v-else class="badge bg-secondary">Inactive</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>No categories assigned
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- ENTITY FORM VIEW -->
    <template v-else>
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-0"><i class="fa fa-building me-2"></i>{{ editingSupplier ? 'Edit Supplier' : 'New Supplier' }}
            </h5>
            <small class="text-muted">{{ editingSupplier ? 'Update supplier details' : 'Register a new supplier'
              }}</small>
          </div>
        </div>
        <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
          <!-- 1️⃣ ENTITY BASIC INFORMATION -->
          <div class="border-bottom pb-3 mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Basic Entity Information</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Entity Type <span class="text-danger">*</span></label>
                <select v-model="entityForm.entity_type" class="form-select" required>
                  <option value="COMPANY">Company</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Name <span class="text-danger">*</span></label>
                <input v-model="entityForm.name" type="text" class="form-control"
                  placeholder="Enter entity name" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Trading Name</label>
                <input v-model="entityForm.trading_name" type="text" class="form-control"
                  placeholder="Enter trading name (optional)" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Country</label>
                <Multiselect v-model="entityForm.country_id" :options="countries" label="name" track-by="id"
                  placeholder="Select country" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Base Currency</label>
                <Multiselect v-model="entityForm.base_currency_id" :options="currencies" label="name" track-by="id"
                  :custom-label="currencyLabel" placeholder="Select currency" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Category</label>
                <Multiselect v-model="entityForm.category_id" :options="additionalCategories" label="display_name"
                  track-by="id" placeholder="Select category" />
              </div>
              <div class="col-md-12">
                <label class="form-label">Notes</label>
                <textarea v-model="entityForm.notes" rows="2" class="form-control"
                  placeholder="Additional notes or comments (optional)"></textarea>
              </div>
            </div>
          </div>

          <!-- 3️⃣ CONDITIONAL PROFILE SECTION - COMPANY -->
          <div v-if="entityForm.entity_type === 'COMPANY'" class="border-bottom pb-3 mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-building me-2"></i>Company Profile</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Registration Number</label>
                <input v-model="entityForm.company_profile.registration_no" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Registration Country</label>
                <Multiselect v-model="entityForm.company_profile.registration_country_id" :options="countries"
                  label="name" track-by="id" placeholder="Select country" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Legal Name</label>
                <input v-model="entityForm.company_profile.legal_name" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Incorporation Date</label>
                <input v-model="entityForm.company_profile.incorporation_date" type="date" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Business Type</label>
                <input v-model="entityForm.company_profile.business_type" type="text" class="form-control"
                  placeholder="e.g., Limited, Partnership" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Tax Residency Country</label>
                <Multiselect v-model="entityForm.company_profile.tax_residency_country_id" :options="countries"
                  label="name" track-by="id" placeholder="Select country" />
              </div>
            </div>
          </div>

          <!-- 3️⃣ CONDITIONAL PROFILE SECTION - INDIVIDUAL -->
          <div v-else-if="entityForm.entity_type === 'INDIVIDUAL'" class="border-bottom pb-3 mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-user me-2"></i>Individual Profile</h6>
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Date of Birth</label>
                <input v-model="entityForm.individual_profile.date_of_birth" type="date" class="form-control" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Gender</label>
                <select v-model="entityForm.individual_profile.gender" class="form-select">
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Nationality</label>
                <Multiselect v-model="entityForm.individual_profile.nationality_country_id" :options="countries"
                  label="name" track-by="id" placeholder="Select country" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Marital Status</label>
                <select v-model="entityForm.individual_profile.marital_status" class="form-select">
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 4️⃣ PRIMARY CONTACT DETAILS -->
          <div class="border-bottom pb-3 mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-phone me-2"></i>Primary Contact Details</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Contact Person Name</label>
                <input v-model="entityForm.primary_contact.name" type="text" class="form-control"
                  placeholder="Name of contact person" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Phone Number</label>
                <input v-model="entityForm.primary_contact.phone" type="tel" class="form-control"
                  placeholder="Phone number" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Email Address</label>
                <input v-model="entityForm.primary_contact.email" type="email" class="form-control"
                  placeholder="Email address" />
              </div>
            </div>
          </div>

          <!-- 5️⃣ IDENTIFICATION (LIGHT KYC) -->
          <div class="border-bottom pb-3 mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-id-card me-2"></i>Identification</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Identity Type</label>
                <select v-model="entityForm.identification.identity_type_id" class="form-select">
                  <option value="">Select type</option>
                  <option v-for="type in identityTypeOptions" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Identity Number</label>
                <input v-model="entityForm.identification.identity_number" type="text" class="form-control"
                  placeholder="Passport, ID, etc." />
              </div>
              <div class="col-md-4">
                <label class="form-label">Issued Date</label>
                <input v-model="entityForm.identification.issued_date" type="date" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Issuing Country</label>
                <Multiselect v-model="entityForm.identification.issuing_country_id" :options="countries"
                  label="name" track-by="id" placeholder="Select country" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Issuing Authority</label>
                <input v-model="entityForm.identification.issuing_authority" type="text" class="form-control"
                  placeholder="Authority name" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Expiry Date</label>
                <input v-model="entityForm.identification.expiry_date" type="date" class="form-control" />
              </div>
            </div>
          </div>

          <!-- 6️⃣ REGISTERED ADDRESS -->
          <div class="border-bottom pb-3 mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-map-marker me-2"></i>Registered Address</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Address Line 1</label>
                <input v-model="entityForm.registered_address.address_line_1" type="text" class="form-control"
                  placeholder="Street address" />
              </div>
              <div class="col-md-4">
                <label class="form-label">City</label>
                <input v-model="entityForm.registered_address.city" type="text" class="form-control"
                  placeholder="City" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Country</label>
                <Multiselect v-model="entityForm.registered_address.country_id" :options="countries"
                  label="name" track-by="id" placeholder="Select country" />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary" @click="closeSupplierForm">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="saveSupplier">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingSupplier ? 'Update Supplier' : 'Create Supplier' }}
            </button>
          </div>
        </div>
      </div>
    </template>



    <!-- Assign Category Modal -->
    <div class="modal fade" :class="{ show: showAssignCategoryModal }"
      :style="{ display: showAssignCategoryModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assign Category</h5>
            <button type="button" class="btn-close" @click="closeCategoryAssignModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="!supplierCategoryId" class="alert alert-warning mb-3">
              <strong>Notice:</strong> Supplier category not found in metadata — child categories may be missing. Please
              verify backend data or seed local categories.
            </div>
            <form @submit.prevent="assignCategory">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Category</label>
                  <select v-model="assignCategoryForm.category_id" class="form-select" required>
                    <option value="">Select category</option>
                    <option v-for="category in additionalCategories" :key="category.id" :value="category.id">
                      {{ category.display_name || category.name }}
                    </option>
                  </select>
                  <div v-if="!additionalCategories.length" class="form-text text-muted mt-1">
                    No categories available. Please check backend data or contact administrator.
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category Code</label>
                  <input v-model="assignCategoryForm.code" type="text" class="form-control" placeholder="SUPP-001" />
                </div>

                <!-- Supplier-specific types (taggable) -->
                <template v-if="parseInt(assignCategoryForm.category_id) === supplierCategoryId">
                  <div class="col-md-12">
                    <label class="form-label">Types (e.g., Fuel, Food Items)</label>
                    <Multiselect v-model="assignCategoryForm.types" :options="supplierTypes" :multiple="true" taggable
                      placeholder="Add or select types" label="" track-by="" @tag="handleTag" />
                  </div>
                </template>
                <div class="col-md-6">
                  <label class="form-label">Default Payable Account</label>
                  <select v-model="assignCategoryForm.default_payable_account_id" class="form-select">
                    <option value="">Select account</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ account.code || account.account_number || '-' }})
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Default Receivable Account</label>
                  <select v-model="assignCategoryForm.default_receivable_account_id" class="form-select">
                    <option value="">Select account</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ account.code || account.account_number || '-' }})
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Effective From</label>
                  <input v-model="assignCategoryForm.effective_from" type="date" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Effective To</label>
                  <input v-model="assignCategoryForm.effective_to" type="date" class="form-control" />
                </div>
                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-check mt-4">
                    <input v-model="assignCategoryForm.is_active" type="checkbox" class="form-check-input"
                      id="assignCategoryActive" />
                    <label class="form-check-label" for="assignCategoryActive">Is Active</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2"
                  @click="closeCategoryAssignModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="assigning">
                  <span v-if="assigning" class="spinner-border spinner-border-sm me-2"></span>
                  Assign Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAssignCategoryModal && showSupplierList" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import StandardModal from '@/components/plugins/StandardModal.vue'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
const accountsBaseUrl = import.meta.env.VITE_APP_ACCOUNTS_BASE_URL || apiBaseUrl
const accountsEndpoint = import.meta.env.VITE_APP_ACCOUNTS_COMPANY_VSET_URL
const countriesEndpoint = import.meta.env.VITE_APP_COUNTRIES_URL
const currenciesEndpoint = import.meta.env.VITE_APP_CURRENCIES_URL
const supplierMetadataEndpoint = 'supplier-metadata'

const loading = ref(false)
const saving = ref(false)
const assigning = ref(false)
const metadataLoaded = ref(false)

const suppliers = ref<any[]>([])
const pagination = ref<any>({ current_page: 1, per_page: 15, total: 0, last_page: 1 })

const countries = ref<any[]>([])
const nationalities = ref<any[]>([])
const currencies = ref<any[]>([])
const categories = ref<any[]>([])
const accounts = ref<any[]>([])
const contactTypes = ref<any[]>([])
const identityTypes = ref<any[]>([])
const entityTypes = ref<any[]>([])
const entityStatuses = ref<any[]>([])

// Default supplier types suggestions
const supplierTypes = ref<string[]>(['Fuel', 'Food Items', 'Insurance', 'Misc'])
const supplierTypeOptions = computed(() => supplierTypes.value.map((t: string) => ({ value: t, label: t })))

const tableFilters = ref<any>({
  search: '',
  status: '',
  country_id: '',
  category_id: '',
  business_type: '',
  active_only: false,
  limit: 100,
  page: 1
})

const columns = [
  { key: 'name', label: 'SUPPLIER NAME', sortable: true, visible: true },
  { key: 'notes', label: 'NOTES', sortable: false, visible: true },
  { key: 'category', label: 'CATEGORY', sortable: false, visible: true },
  { key: 'status', label: 'STATUS', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const formatLabel = (value: string) => {
  if (!value) return ''
  return value
    .split('_')
    .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1).toLowerCase() : ''))
    .join(' ')
}

const resolveId = (value: any) => {
  if (!value) return undefined
  return typeof value === 'object' ? value.id : value
}

const findById = (list: any[], value: any) => {
  if (!value) return null
  if (typeof value === 'object') return value
  return list.find((item) => item?.id === value) || null
}

const currencyLabel = (option: any) => {
  if (!option) return ''
  const name = option.name || option.code || ''
  return option.symbol ? `${name} (${option.symbol})` : name
}

const contactTypeOptions = computed(() => {
  if (contactTypes.value.length) {
    return contactTypes.value.map((type: any) => ({
      value: type.name,
      label: type.display_name || formatLabel(type.name || '')
    }))
  }
  return [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'fax', label: 'Fax' },
    { value: 'website', label: 'Website' },
    { value: 'address', label: 'Address' }
  ]
})

const entityTypeOptions = computed(() => {
  if (entityTypes.value.length) return entityTypes.value
  return [
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'COMPANY', label: 'Company' },
    { value: 'ESTATE', label: 'Estate' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'NGO', label: 'NGO' }
  ]
})

const entityStatusOptions = computed(() => {
  if (entityStatuses.value.length) return entityStatuses.value
  return [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_KYC', label: 'Pending KYC' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'BLACKLISTED', label: 'Blacklisted' },
    { value: 'CLOSED', label: 'Closed' }
  ]
})

const identityTypeOptions = computed(() => {
  if (!identityTypes.value.length) return []
  return identityTypes.value.map((type: any) => ({
    value: type.id,
    label: type.description || formatLabel(type.name || '')
  }))
})

const statusFilterOptions = computed(() => {
  if (entityStatuses.value.length) {
    return [{ label: 'All Statuses', value: '' }, ...entityStatuses.value]
  }
  return [
    { label: 'All Statuses', value: '' },
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'PENDING_KYC', value: 'PENDING_KYC' },
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'SUSPENDED', value: 'SUSPENDED' },
    { label: 'BLACKLISTED', value: 'BLACKLISTED' },
    { label: 'CLOSED', value: 'CLOSED' }
  ]
})

const customFilters = computed(() => [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: statusFilterOptions.value
  },
  {
    key: 'country_id',
    label: 'Country',
    type: 'select',
    options: countries.value.map((c: any) => ({ label: c.name, value: c.id }))
  },
  {
    key: 'category_id',
    label: 'Category',
    type: 'select',
    options: categories.value.map((c: any) => ({ label: c.display_name || c.name, value: c.id }))
  },
  {
    key: 'business_type',
    label: 'Business Type',
    type: 'select',
    options: businessTypes.value.map((b: string) => ({ label: b, value: b }))
  },
  {
    key: 'active_only',
    label: 'Active Only',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: true }
    ]
  }
])

// Table action buttons (appear next to Filters in StandardDataTable)
const supplierActionButtons = [
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn-outline-secondary',
    method: () => fetchSuppliers()
  },
  {
    label: 'Print PDF',
    icon: 'fa fa-print',
    class: 'btn-outline-secondary',
    method: () => openSupplierPdf()
  },
  {
    label: 'Add Supplier',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openAddSupplierForm()
  }
]

const showSupplierList = ref(true)
const showViewDetails = ref(false)
const showAssignCategoryModal = ref(false)

const editingSupplier = ref<any>(null)
const viewSupplier = ref<any>(null)
const activeTab = ref('basic')

const entityForm = reactive<any>({
  // Entity Basic Information
  name: '',
  trading_name: '',
  entity_type: 'COMPANY', // COMPANY | INDIVIDUAL
  country_id: null,
  base_currency_id: null,
  category_id: null,
  code: '', // auto-generated, read-only
  status: 'ACTIVE',
  notes: '',
  is_group: 0,
  parent_entity_id: null,

  // Conditional Profile - Company
  company_profile: {
    registration_no: '',
    registration_country_id: null,
    legal_name: '',
    incorporation_date: '',
    business_type: '',
    tax_residency_country_id: null
  },

  // Conditional Profile - Individual
  individual_profile: {
    date_of_birth: '',
    gender: '', // M, F, Other
    nationality_country_id: null,
    marital_status: '' // Single, Married, Divorced, Widowed
  },

  // Primary Contact (single contact)
  primary_contact: {
    name: '',
    phone: '',
    email: '',
    is_primary: true
  },

  // Identification (single identity)
  identification: {
    identity_type_id: null,
    identity_number: '',
    issued_date: '',
    issuing_country_id: null,
    issuing_authority: '',
    expiry_date: '',
    is_verified: 0
  },

  // Registered Address (single address)
  registered_address: {
    address_line_1: '',
    city: '',
    country_id: null,
    address_purpose: 'REGISTERED'
  }
})

const supplierCategory = reactive<any>({
  default_payable_account_id: '',
  default_receivable_account_id: '',
  effective_from: '',
  effective_to: '',
  code: '',
  additional_category_ids: [] as number[]
})

const viewContacts = ref<any[]>([])
const viewIdentities = ref<any[]>([])
const viewCategories = ref<any[]>([])

const categoryColumns = [
  { key: 'display_name', label: 'CATEGORY', sortable: true, visible: true },
  { key: 'pivot.code', label: 'CODE', sortable: false, visible: true },
  { key: 'pivot.effective_from', label: 'EFFECTIVE FROM', sortable: false, visible: true },
  { key: 'pivot.effective_to', label: 'EFFECTIVE TO', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const assignCategoryForm = reactive<any>({
  category_id: '',
  default_payable_account_id: '',
  default_receivable_account_id: '',
  effective_from: '',
  effective_to: '',
  code: '',
  is_active: true,
  types: [] as string[] // custom supplier types (e.g., Fuel, Food Items, Spare Parts)
})

const businessTypes = computed(() => {
  const set = new Set<string>()
  suppliers.value.forEach((supplier: any) => {
    const type = supplier.company_profile?.business_type
    if (type) set.add(type)
  })
  return Array.from(set).sort()
})

const supplierCategoryId = computed(() => {
  const fromList = categories.value.find((c: any) => {
    const code = (c.category_code || c.code || '').toString().toLowerCase()
    const name = (c.name || '').toString().toLowerCase()
    const display = (c.display_name || '').toString().toLowerCase()
    return code === 'supplier' || name === 'supplier' || display === 'supplier'
  })

  if (!fromList && categories.value.length > 0) {
    console.warn('⚠️ Supplier category not found in categories list')
    return null
  }

  return fromList?.id || null
})

const additionalCategories = computed(() => {
  const filtered = categories.value.filter((c: any) => {
    // Always exclude the main "Supplier" category by id
    if (supplierCategoryId.value && c.id === supplierCategoryId.value) return false

    // Check if parent_id field exists AND matches supplierCategoryId
    if (Object.prototype.hasOwnProperty.call(c, 'parent_id') && c.parent_id !== null && c.parent_id !== undefined) {
      // If parent_id exists, use it for filtering (type-safe comparison)
      return Number(c.parent_id) === Number(supplierCategoryId.value)
    }

    // Fallback: exclude items that look like the Supplier entry by code/name (case-insensitive)
    // If an item doesn't have parent_id, assume it's a child of Supplier unless it matches the main supplier pattern
    const code = (c.category_code || c.code || '').toString().toLowerCase()
    const name = (c.name || '').toString().toLowerCase()
    const display = (c.display_name || '').toString().toLowerCase()
    
    // Only exclude if it matches the main supplier pattern
    if (code === 'supplier' || name === 'supplier' || display === 'supplier') return false

    // Include all other items as children
    return true
  })

  console.log('🎯 additionalCategories computed:', {
    total: categories.value.length,
    supplierCategoryId: supplierCategoryId.value,
    filtered: filtered.length,
    items: filtered.map((c: any) => ({ id: c.id, code: c.category_code || c.code, name: c.display_name || c.name, parent_id: c.parent_id }))
  })

  return filtered
})

function getStatusTextColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-success',
    SUSPENDED: 'text-warning',
    BLACKLISTED: 'text-danger',
    CLOSED: 'text-secondary'
  }
  return map[status] || 'text-info'
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success'
    case 'SUSPENDED':
      return 'bg-warning'
    case 'BLACKLISTED':
      return 'bg-danger'
    case 'CLOSED':
      return 'bg-secondary'
    default:
      return 'bg-info'
  }
}

const primaryContact = (supplier: any) => {
  const contacts = supplier.contacts || []
  const email = contacts.find((c: any) => c.type === 'email')
  const phone = contacts.find((c: any) => c.type === 'phone' || c.type === 'mobile')
  return email?.contact || phone?.contact || '-'
}

const getPrimaryCategory = (row: any) => {
  if (!row) return '-'

  const list = row?.categories || []
  // Prefer the first non-SUPPLIER category
  const preferred = list.find((c: any) => c.id !== supplierCategoryId.value)
  const fallback = list[0]
  return (preferred?.display_name || preferred?.name) || (fallback?.display_name || fallback?.name) || '-'
}

const handleTag = (newTag: string) => {
  if (!newTag) return
  if (!supplierTypes.value.includes(newTag)) supplierTypes.value.push(newTag)
  if (!assignCategoryForm.types.includes(newTag)) assignCategoryForm.types.push(newTag)
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
}

const normalizeSuppliersResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    suppliers.value = payload
    pagination.value = { current_page: 1, per_page: payload.length, total: payload.length, last_page: 1 }
    return
  }

  const paged = payload?.data || payload
  if (paged?.data && Array.isArray(paged.data)) {
    suppliers.value = paged.data
    pagination.value = {
      current_page: paged.current_page || 1,
      per_page: paged.per_page || tableFilters.value.limit,
      total: paged.total || paged.data.length,
      last_page: paged.last_page || 1
    }
  } else if (Array.isArray(paged)) {
    suppliers.value = paged
    pagination.value = { current_page: 1, per_page: paged.length, total: paged.length, last_page: 1 }
  } else {
    suppliers.value = []
    pagination.value = { current_page: 1, per_page: tableFilters.value.limit, total: 0, last_page: 1 }
  }
}

const fetchSuppliers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: tableFilters.value.page || 1,
      per_page: tableFilters.value.limit || 15,
      paginate: true
      // Removed include parameter - backend may not support it
    }

    if (tableFilters.value.search) params.search = tableFilters.value.search
    if (tableFilters.value.status) params.status = tableFilters.value.status
    if (tableFilters.value.category_id) params.category_id = tableFilters.value.category_id

    const response = await axios.get(`${apiBaseUrl}suppliers`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })

    const data = response.data?.data || response.data
    normalizeSuppliersResponse(data)

    // Now fetch full details for each supplier to get categories
    if (Array.isArray(suppliers.value) && suppliers.value.length > 0) {
      console.log('📥 Fetching full details for', suppliers.value.length, 'suppliers to populate categories...')
      for (const supplier of suppliers.value) {
        try {
          const detailResponse = await axios.get(`${apiBaseUrl}company-entities/${supplier.id}`, {
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
          })
          const details = detailResponse.data?.data || detailResponse.data
          if (details && details.categories) {
            // Update the supplier object in the list with categories from the detail response
            const idx = suppliers.value.findIndex((s: any) => s.id === supplier.id)
            if (idx >= 0) {
              suppliers.value[idx].categories = details.categories
              console.log('   ✅ Updated supplier', supplier.id, 'with categories:', details.categories)
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to fetch details for supplier', supplier.id)
        }
      }
    }
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load suppliers' })
  } finally {
    loading.value = false
  }
}

const fetchSupplierMetadata = async () => {
  if (metadataLoaded.value) return
  try {
    const response = await axios.get(`${apiBaseUrl}${supplierMetadataEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || {}

    countries.value = Array.isArray(data.countries) ? data.countries : []
    nationalities.value = Array.isArray(data.nationalities) ? data.nationalities : []
    currencies.value = Array.isArray(data.currencies) ? data.currencies : []
    categories.value = Array.isArray(data.categories) ? data.categories : []
    accounts.value = Array.isArray(data.accounts) ? data.accounts : []
    contactTypes.value = Array.isArray(data.contact_types) ? data.contact_types : []
    identityTypes.value = Array.isArray(data.identity_types) ? data.identity_types : []
    entityTypes.value = Array.isArray(data.entity_types) ? data.entity_types : []
    entityStatuses.value = Array.isArray(data.entity_statuses) ? data.entity_statuses : []
  } catch (error: any) {
    console.error('Failed to load supplier metadata', error)
  } finally {
    metadataLoaded.value = true
  }

  if (!countries.value.length && countriesEndpoint) {
    await fetchCountries()
  }
  if (!currencies.value.length && currenciesEndpoint) {
    await fetchCurrencies()
  }
  if (!categories.value.length) {
    await fetchCategories()
  }
  if (!accounts.value.length) {
    await fetchAccounts()
  }
}

const fetchCountries = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}${countriesEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    countries.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load countries', error)
  }
}

const fetchCurrencies = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}${currenciesEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    currencies.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load currencies', error)
  }
}

const fetchCategories = async () => {
  try {
    const categoriesUrl = `${apiBaseUrl}company-entities/categories`
    const categoriesParams = { parent_code: 'supplier' } // Fetch only Supplier child categories
    console.log('🔍 Fetching supplier categories from:', categoriesUrl, 'with parent_code=supplier')

    const response = await axios.get(categoriesUrl, {
      params: categoriesParams,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })

    const data = response.data?.data || response.data || []
    categories.value = Array.isArray(data) ? data : []

    console.log('✅ Categories loaded:', categories.value.length, 'items')
    console.log('   Items:', categories.value.map((c: any) => ({ id: c.id, code: c.category_code, name: c.display_name })))
  } catch (error: any) {
    console.error('❌ Failed to load categories:', error.message || error)
    categories.value = []
  }
}

const fetchAccounts = async () => {
  if (!accountsEndpoint) return
  try {
    const response = await axios.get(`${accountsBaseUrl}${accountsEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    accounts.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load accounts', error)
  }
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
  fetchSuppliers()
}

const handlePageChange = (page: number) => {
  tableFilters.value.page = page
  fetchSuppliers()
}

const todayDate = () => new Date().toISOString().slice(0, 10)
const generateCategoryCode = () => `SUPP-${Date.now().toString().slice(-6)}`

const resetSupplierForm = () => {
  // Reset Entity Basic Information
  entityForm.name = ''
  entityForm.trading_name = ''
  entityForm.entity_type = 'COMPANY'
  entityForm.country_id = null
  entityForm.base_currency_id = null
  entityForm.category_id = null
  entityForm.code = ''
  entityForm.status = 'ACTIVE'
  entityForm.notes = ''
  entityForm.is_group = 0
  entityForm.parent_entity_id = null

  // Reset Company Profile
  entityForm.company_profile = {
    registration_no: '',
    registration_country_id: null,
    legal_name: '',
    incorporation_date: '',
    business_type: '',
    tax_residency_country_id: null
  }

  // Reset Individual Profile
  entityForm.individual_profile = {
    date_of_birth: '',
    gender: '',
    nationality_country_id: null,
    marital_status: ''
  }

  // Reset Primary Contact
  entityForm.primary_contact = {
    name: '',
    phone: '',
    email: '',
    is_primary: true
  }

  // Reset Identification
  entityForm.identification = {
    identity_type_id: null,
    identity_number: '',
    issued_date: '',
    issuing_country_id: null,
    issuing_authority: '',
    expiry_date: '',
    is_verified: 0
  }

  // Reset Registered Address
  entityForm.registered_address = {
    address_line_1: '',
    city: '',
    country_id: null,
    address_purpose: 'REGISTERED'
  }

  supplierCategory.default_payable_account_id = ''
  supplierCategory.default_receivable_account_id = ''
  supplierCategory.effective_from = todayDate()
  supplierCategory.effective_to = ''
  supplierCategory.code = generateCategoryCode()
  supplierCategory.additional_category_ids = []
}

const openAddSupplierForm = () => {
  resetSupplierForm()
  editingSupplier.value = null
  showSupplierList.value = false
}

const openEditSupplierForm = (supplier: any) => {
  resetSupplierForm()
  editingSupplier.value = supplier || null

  if (supplier) {
    // Load Entity Basic Information
    entityForm.name = supplier.name || supplier.full_name || ''
    entityForm.trading_name = supplier.trading_name || ''
    entityForm.code = supplier.code || ''
    entityForm.entity_type = supplier.entity_type || supplier.type || 'COMPANY'
    entityForm.status = supplier.status || 'ACTIVE'
    entityForm.country_id = findById(countries.value, supplier.country_id ?? supplier.country?.id) || null
    entityForm.base_currency_id = findById(currencies.value, supplier.base_currency_id ?? supplier.base_currency?.id) || null
    entityForm.notes = supplier.notes || ''

    // Load primary category (first non-supplier category if available)
    const primaryCat = (supplier.categories || []).find((c: any) => c.id !== supplierCategoryId.value)
    entityForm.category_id = primaryCat?.id || null

    // Load Company Profile if applicable
    if (supplier.company_profile) {
      entityForm.company_profile = {
        registration_no: supplier.company_profile.registration_no || '',
        registration_country_id: findById(countries.value, supplier.company_profile.registration_country_id ?? supplier.company_profile.registration_country?.id) || null,
        legal_name: supplier.company_profile.legal_name || '',
        incorporation_date: supplier.company_profile.incorporation_date || '',
        business_type: supplier.company_profile.business_type || '',
        tax_residency_country_id: findById(countries.value, supplier.company_profile.tax_residency_country_id ?? supplier.company_profile.tax_residency_country?.id) || null
      }
    }

    // Load Individual Profile if applicable
    if (supplier.individual_profile) {
      entityForm.individual_profile = {
        date_of_birth: supplier.individual_profile.date_of_birth || '',
        gender: supplier.individual_profile.gender || '',
        nationality_country_id: findById(countries.value, supplier.individual_profile.nationality_country_id ?? supplier.individual_profile.nationality_country?.id) || null,
        marital_status: supplier.individual_profile.marital_status || ''
      }
    }

    // Load Primary Contact
    const primaryContact = (supplier.contacts || []).find((c: any) => c.is_primary)
    if (primaryContact) {
      entityForm.primary_contact = {
        name: primaryContact.name || '',
        phone: primaryContact.phone || '',
        email: primaryContact.email || '',
        is_primary: true
      }
    }

    // Load Identification
    const identity = (supplier.identities || []).find((i: any) => i.identifiable_type === 'ENTITY')
    if (identity) {
      entityForm.identification = {
        identity_type_id: identity.identity_type_id || null,
        identity_number: identity.identity_number || '',
        issued_date: identity.issued_date || '',
        issuing_country_id: identity.identity_dates?.issuing_country_id || null,
        issuing_authority: identity.identity_dates?.issuing_authority || '',
        expiry_date: identity.identity_dates?.expiry_date || '',
        is_verified: identity.is_verified || 0
      }
    }

    // Load Registered Address
    const registeredAddress = (supplier.addresses || []).find((a: any) => a.address_purpose === 'REGISTERED')
    if (registeredAddress) {
      entityForm.registered_address = {
        address_line_1: registeredAddress.address_line_1 || '',
        city: registeredAddress.city || '',
        country_id: findById(countries.value, registeredAddress.country_id ?? registeredAddress.country?.id) || null,
        address_purpose: 'REGISTERED'
      }
    }

    // Load Supplier Categories (if still used in hybrid mode)
    const supplierCat = (supplier.categories || []).find((c: any) => c.id === supplierCategoryId.value)
    supplierCategory.default_payable_account_id = supplierCat?.pivot?.default_payable_account_id || ''
    supplierCategory.default_receivable_account_id = supplierCat?.pivot?.default_receivable_account_id || ''
    supplierCategory.effective_from = supplierCat?.pivot?.effective_from || todayDate()
    supplierCategory.effective_to = supplierCat?.pivot?.effective_to || ''
    supplierCategory.code = supplierCat?.pivot?.code || generateCategoryCode()
    supplierCategory.additional_category_ids = (supplier.categories || [])
      .filter((c: any) => c.id !== supplierCategoryId.value)
      .map((c: any) => c.id)
  }
}

const openSupplierPdf = () => {
  window.open('/#/procurement/suppliers/print', '_blank')
}

const closeSupplierForm = () => {
  showSupplierList.value = true
  editingSupplier.value = null
  resetSupplierForm()
}

const buildCategoryPayload = () => {
  const effectiveFrom = supplierCategory.effective_from || todayDate()
  const effectiveTo = supplierCategory.effective_to || undefined
  const categoryCode = supplierCategory.code || generateCategoryCode()
  const basePayload: any[] = []

  if (supplierCategoryId.value) {
    basePayload.push({
      category_id: supplierCategoryId.value,
      default_payable_account_id: supplierCategory.default_payable_account_id || undefined,
      default_receivable_account_id: supplierCategory.default_receivable_account_id || undefined,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      is_active: true,
      code: categoryCode
    })
  } else {
    console.warn('⚠️ supplierCategoryId not found — skipping supplier base category in payload')
  }

  supplierCategory.additional_category_ids.forEach((id: number) => {
    basePayload.push({
      category_id: id,
      is_active: true,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      code: categoryCode
    })
  })

  // Include the primary category from form if selected and not duplicate
  const selectedCategory = resolveId(entityForm.category_id)
  if (selectedCategory && 
      selectedCategory !== supplierCategoryId.value && 
      !supplierCategory.additional_category_ids.includes(selectedCategory) &&
      !basePayload.some(p => p.category_id === selectedCategory)) {
    basePayload.push({
      category_id: selectedCategory,
      is_active: true,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      code: categoryCode
    })
  }

  return basePayload
}

const saveSupplier = async () => {
  saving.value = true
  try {
    // Build payload: Entity Basic Information + Conditional Profile + Contact + Identification + Address
    const payload: any = {
      // 1️⃣ Entity Basic Information
      full_name: entityForm.name,
      trading_name: entityForm.trading_name || undefined,
      code: entityForm.code || undefined,
      entity_type: entityForm.entity_type,
      status: entityForm.status,
      country_id: resolveId(entityForm.country_id),
      base_currency_id: resolveId(entityForm.base_currency_id),
      notes: entityForm.notes || undefined,
      is_group: entityForm.is_group,
      parent_entity_id: entityForm.parent_entity_id || null,

      // 3️⃣ Conditional Profile
      ...(entityForm.entity_type === 'COMPANY' && {
        company_profile: {
          registration_no: entityForm.company_profile.registration_no || undefined,
          registration_country_id: resolveId(entityForm.company_profile.registration_country_id),
          legal_name: entityForm.company_profile.legal_name || undefined,
          incorporation_date: entityForm.company_profile.incorporation_date || undefined,
          business_type: entityForm.company_profile.business_type || undefined,
          tax_residency_country_id: resolveId(entityForm.company_profile.tax_residency_country_id)
        }
      }),
      ...(entityForm.entity_type === 'INDIVIDUAL' && {
        individual_profile: {
          date_of_birth: entityForm.individual_profile.date_of_birth || undefined,
          gender: entityForm.individual_profile.gender || undefined,
          nationality_country_id: resolveId(entityForm.individual_profile.nationality_country_id),
          marital_status: entityForm.individual_profile.marital_status || undefined
        }
      }),

      // 4️⃣ Primary Contact Details (single contact)
      contacts: entityForm.primary_contact.email || entityForm.primary_contact.phone || entityForm.primary_contact.name
        ? [
            {
              name: entityForm.primary_contact.name || undefined,
              phone: entityForm.primary_contact.phone || undefined,
              email: entityForm.primary_contact.email || undefined,
              is_primary: true
            }
          ]
        : [],

      // 5️⃣ Identification (single identity with related identity_dates)
      ...(entityForm.identification.identity_type_id && {
        identities: [
          {
            identity_type_id: entityForm.identification.identity_type_id,
            identity_number: entityForm.identification.identity_number || undefined,
            issued_date: entityForm.identification.issued_date || undefined,
            identifiable_type: 'ENTITY',
            is_active: 1,
            identity_dates: {
              issuing_country_id: resolveId(entityForm.identification.issuing_country_id),
              issuing_authority: entityForm.identification.issuing_authority || undefined,
              expiry_date: entityForm.identification.expiry_date || undefined,
              is_verified: entityForm.identification.is_verified
            }
          }
        ]
      }),

      // 6️⃣ Registered Address (single address)
      ...(entityForm.registered_address.address_line_1 && {
        addresses: [
          {
            address_line_1: entityForm.registered_address.address_line_1,
            city: entityForm.registered_address.city || undefined,
            country_id: resolveId(entityForm.registered_address.country_id),
            address_purpose: 'REGISTERED'
          }
        ]
      })
    }

    // 7️⃣ Supplier Categories (if still needed in hybrid mode)
    payload.categories = buildCategoryPayload()

    if (editingSupplier.value?.id) {
      await axios.put(`${apiBaseUrl}company-entities/${editingSupplier.value.id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Entity updated successfully' })
    } else {
      await axios.post(`${apiBaseUrl}company-entities`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Entity created successfully' })
    }

    closeSupplierForm()
    fetchSuppliers()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save entity' })
  } finally {
    saving.value = false
  }
}

const deleteSupplier = async (supplier: any) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete "${supplier.name || supplier.full_name}"? This action cannot be undone!`,
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

  if (!result.isConfirmed) return

  try {
    await axios.delete(`${apiBaseUrl}company-entities/${supplier.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Entity deleted successfully' })
    fetchSuppliers()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to delete entity' })
  }
}

const openViewModal = async (supplier: any) => {
  showSupplierList.value = false;
  showViewDetails.value = true;
  activeTab.value = 'basic';
  console.log('📖 Opening supplier details for ID:', supplier.id, supplier)
  try {
    const response = await axios.get(`${apiBaseUrl}company-entities/${supplier.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    console.log('✅ Supplier details loaded:', response.data)
    viewSupplier.value = response.data?.data || response.data || supplier
    viewContacts.value = (viewSupplier.value.contacts || []).map((c: any) => ({ ...c }))
    viewIdentities.value = (viewSupplier.value.identities || []).map((i: any) => ({
      ...i,
      dates: i.dates || {}
    }))
    // Deduplicate and filter out the main Supplier category
    const rawCategories = viewSupplier.value.categories || [];
    const uniqueCategories = Array.isArray(rawCategories)
      ? rawCategories.filter((cat, idx, arr) =>
          arr.findIndex(c => c.id === cat.id) === idx
        )
      : [];
    // Remove the main Supplier category by id
    const filteredCategories = supplierCategoryId.value
      ? uniqueCategories.filter(cat => cat.id !== supplierCategoryId.value)
      : uniqueCategories;
    viewCategories.value = filteredCategories;
    console.log('📋 Supplier data set:', {
      name: viewSupplier.value.full_name,
      contacts: viewContacts.value.length,
      identities: viewIdentities.value.length,
      categories: viewCategories.value.length
    })
  } catch (error: any) {
    console.error('❌ Failed to load supplier details', error)
    console.log('📌 Falling back to row data')
    viewSupplier.value = supplier
    viewContacts.value = supplier.contacts || []
    viewIdentities.value = supplier.identities || []
    viewCategories.value = supplier.categories || []
  }
}

const backToSupplierList = () => {
  showSupplierList.value = true;
  showViewDetails.value = false;
  viewSupplier.value = null;
  viewContacts.value = [];
  viewIdentities.value = [];
  viewCategories.value = [];
  activeTab.value = 'basic';
}

// Contact functions - Deprecated in Entity V1 (using single primary contact)
// const addContact = () => {
//   const fallbackType = contactTypeOptions.value[0]?.value || 'email'
//   entityForm.contacts.push({ type: fallbackType, contact: '' })
// }

// const removeContact = (index: number) => {
//   entityForm.contacts.splice(index, 1)
// }

// View contacts are read-only - no editing functions needed

// View identities are read-only - no editing functions needed

// Category editing not allowed in view mode

const closeCategoryAssignModal = () => {
  showAssignCategoryModal.value = false
  // Reset form
  assignCategoryForm.category_id = ''
  assignCategoryForm.code = ''
  assignCategoryForm.default_payable_account_id = ''
  assignCategoryForm.default_receivable_account_id = ''
  assignCategoryForm.effective_from = ''
  assignCategoryForm.effective_to = ''
  assignCategoryForm.is_active = true
  assignCategoryForm.types = []
}

const assignCategory = async () => {
  if (!viewSupplier.value?.id || !assignCategoryForm.category_id) return
  assigning.value = true
  try {
    // Find the selected category to get its code
    const selectedCat = categories.value.find((c: any) => c.id === assignCategoryForm.category_id)

    // Build payload with only non-empty fields
    const payload: any = {
      category_id: assignCategoryForm.category_id,
      is_active: assignCategoryForm.is_active,
      effective_from: assignCategoryForm.effective_from, // Required by backend
      code: assignCategoryForm.code || selectedCat?.category_code || `CAT_${assignCategoryForm.category_id}` // Generate code if not provided
    }

    // Add optional fields only if they have values
    if (assignCategoryForm.effective_to) payload.effective_to = assignCategoryForm.effective_to
    if (assignCategoryForm.default_payable_account_id) payload.default_payable_account_id = assignCategoryForm.default_payable_account_id
    if (assignCategoryForm.default_receivable_account_id) payload.default_receivable_account_id = assignCategoryForm.default_receivable_account_id
    if (assignCategoryForm.types && assignCategoryForm.types.length) payload.types = assignCategoryForm.types

    console.log('📤 Assigning category with payload:', payload)

    await axios.post(`${apiBaseUrl}company-entities/${viewSupplier.value.id}/categories`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Assigned', text: 'Category assigned' })
    closeCategoryAssignModal()
    openViewModal(viewSupplier.value)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to assign category' })
  } finally {
    assigning.value = false
  }
}

const removeCategory = async (category: any) => {
  if (!viewSupplier.value?.id) return
  try {
    await axios.delete(`${apiBaseUrl}company-entities/${viewSupplier.value.id}/categories/${category.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Category removed' })
    openViewModal(viewSupplier.value)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove category' })
  }
}

const confirmRemoveCategory = async (category: any) => {
  if (!viewSupplier.value?.id) return
  const isSupplierCategory = category?.id === supplierCategoryId.value
  const text = isSupplierCategory
    ? "Removing the 'Supplier' category will remove the supplier-type association. It will NOT delete the supplier itself. Continue?"
    : `Remove category "${category?.display_name || category?.name || ''}"?`

  const result = await Swal.fire({
    title: 'Confirm Remove',
   
    confirmButtonText: 'Yes, remove',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return
  await removeCategory(category)
}

const toggleStatus = async (supplier: any) => {
  const nextStatus = supplier.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  const result = await Swal.fire({
    title: 'Update Status?',
    text: `Change status to ${nextStatus}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    await axios.patch(`${apiBaseUrl}company-entities/${supplier.id}/status`, { status: nextStatus }, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Status updated' })
    fetchSuppliers()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to update status' })
  }
}

watch(
  () => tableFilters.value.limit,
  () => {
    tableFilters.value.page = 1
  }
)

const getRegisteredAddress = () => {
  return (viewSupplier.value?.addresses || []).find((a: any) => a.address_purpose === 'REGISTERED')
}

const getIdentityTypeName = (typeId: any): string => {
  if (!typeId) return '-'
  const type = identityTypeOptions.value?.find((t: any) => t.value === typeId)
  return type?.label || typeId
}

onMounted(() => {
  fetchSupplierMetadata()
  fetchCategories()
  fetchSuppliers()
})
</script>

<style scoped>
.supplier-management-page .panel {
  border-radius: 12px;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.nav-tabs .nav-link {
  cursor: pointer;
}
</style>
