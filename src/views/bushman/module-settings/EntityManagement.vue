<template>
  <div class="entity-management-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">System Configuration</a></li>
          <li class="breadcrumb-item active">Entity Management</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <!-- Tabs Navigation -->
          <div class="px-3 pt-3">
            <ul class="nav nav-tabs overflow-auto flex-nowrap compact-tabs compact-tabs-left">
              <li class="nav-item">
                <a href="#" class="nav-link" :class="{ active: activeListTab === 'entities' }" @click.prevent="activeListTab = 'entities'">
                  <i class="fa fa-users me-1"></i>Entities
                </a>
              </li>
              <li class="nav-item">
                <a href="#" class="nav-link" :class="{ active: activeListTab === 'categories' }" @click.prevent="activeListTab = 'categories'">
                  <i class="fa fa-tags me-1"></i>Entity Categories
                </a>
              </li>
            </ul>
          </div>

          <!-- Entities Tab Content -->
          <div v-if="activeListTab === 'entities'" class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Entities</h2>
                <p class="text-muted mb-0 small">
                  Manage all entities: Companies, Individuals, Estates, Government entities, and NGOs.
                </p>
              </div>
              <!-- Status summary badges -->
              <div class="d-flex gap-2">
                <span class="badge bg-success bg-opacity-20 text-success px-3 py-2">
                  <i class="fa fa-check-circle me-1"></i>
                  {{ statusCounts.ACTIVE || 0 }} Active
                </span>
                <span class="badge bg-warning bg-opacity-20 text-warning px-3 py-2">
                  <i class="fa fa-clock me-1"></i>
                  {{ statusCounts.PENDING_KYC || 0 }} Pending
                </span>
                <span class="badge bg-secondary bg-opacity-20 text-secondary px-3 py-2">
                  <i class="fa fa-file me-1"></i>
                  {{ statusCounts.DRAFT || 0 }} Draft
                </span>
              </div>
            </div>

            <StandardDataTable
              ref="tableRef"
              :columns="columns"
              :data="entities"
              :loading="loading"
              :filters="tableFilters"
              :custom-filters="customFilters"
              :action-buttons="pageActions"
              :show-date-filters="false"
              :server-side="true"
              :pagination="pagination"
              :page-size-options="[10, 15, 25, 50]"
              :default-page-size="tableFilters.limit"
              @update:filters="handleFiltersUpdate"
              @page-change="handlePageChange"
            >
              <template #code="{ row }">
                <span class="badge bg-primary bg-opacity-20 fs-14px fw-bold text-primary cursor-pointer">
                  <i class="fa fa-hashtag me-1"></i>
                  {{ row.code || '-' }}
                </span>
              </template>
              <template #full_name="{ row }">
                <div class="d-flex align-items-center">
                  <span class="me-2 text-muted">
                    <i :class="['fa', getTypeIcon(row.type)]"></i>
                  </span>
                  <div>
                    <span class="fw-semibold">{{ row.full_name || '-' }}</span>
                    <div v-if="row.trading_name" class="small text-muted">
                      {{ row.trading_name }}
                    </div>
                  </div>
                </div>
              </template>
              <template #type="{ row }">
                <span class="badge bg-info bg-opacity-20 text-info">
                  <i :class="['fa me-1', getTypeIcon(row.type)]"></i>
                  {{ row.type || '-' }}
                </span>
              </template>
              <template #status="{ row }">
                <span 
                  class="badge cursor-pointer" 
                  :class="`bg-${getStatusColor(row.status)} bg-opacity-20 text-${getStatusColor(row.status)}`"
                  @click="openStatusModal(row)"
                  title="Click to change status"
                >
                  {{ row.status || 'DRAFT' }}
                </span>
              </template>
              <template #country="{ row }">
                <span class="text-muted">
                  {{ row.country?.name || row.country_name || '-' }}
                </span>
              </template>
              <template #categories="{ row }">
                <div class="d-flex flex-wrap gap-1">
                  <span 
                    v-for="cat in (row.categories || []).slice(0, 2)" 
                    :key="cat.id" 
                    class="badge bg-secondary bg-opacity-20 text-dark"
                  >
                    {{ cat.name }}
                  </span>
                  <span 
                    v-if="(row.categories || []).length > 2" 
                    class="badge bg-secondary bg-opacity-20 text-muted"
                  >
                    +{{ row.categories.length - 2 }}
                  </span>
                  <span v-if="!(row.categories || []).length" class="text-muted">--</span>
                </div>
              </template>
              <template #actions="{ row }">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary btn-sm" @click="openViewModal(row)" title="View Details">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" @click="openEntityModal(row)" title="Edit">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" @click="confirmDelete(row)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>

          <!-- Categories Tab Content -->
          <div v-else class="custom-table p-3">
            <div class="mb-3">
              <h2 class="mb-0">Entity Categories</h2>
              <p class="text-muted mb-0 small">
                Create, update, and manage categories used to classify entities.
              </p>
            </div>

            <StandardDataTable
              ref="categoryTableRef"
              :columns="categoryColumns"
              :data="flattenedCategories"
              :loading="loadingCategories"
              :filters="categoryTableFilters"
              :action-buttons="categoryPageActions"
              :custom-filters="categoryCustomFilters"
              :show-date-filters="false"
              @update:filters="handleCategoryFiltersUpdate"
            >
              <template #name="{ row }">
                <div :style="{ paddingLeft: (row.level || 0) * 24 + 'px' }" class="d-flex align-items-center">
                  <button 
                    v-if="row.children_count > 0" 
                    @click="toggleExpandCategory(row.id)"
                    class="btn btn-link btn-sm p-0 me-2 text-decoration-none"
                    style="width: 20px; height: 20px;"
                    :title="expandedCategories.has(row.id) ? 'Collapse' : 'Expand'"
                  >
                    <i class="fa" :class="expandedCategories.has(row.id) ? 'fa-minus-square text-primary' : 'fa-plus-square text-secondary'"></i>
                  </button>
                  <span v-else style="width: 20px; display: inline-block;" class="me-2"></span>
                  
                  <span v-if="row.level === 0" class="badge bg-warning bg-opacity-20 text-warning me-2">
                    <i class="fa fa-layer-group"></i>
                  </span>
                  <span v-else-if="row.level === 1" class="me-2 text-primary">
                    <i class="fa fa-arrow-turn-down-right"></i>
                  </span>
                  <span v-else class="me-2 text-muted" style="opacity: 0.6;">
                    <i class="fa fa-arrow-turn-down-right"></i>
                  </span>
                  <span class="fw-semibold">{{ row.name }}</span>
                </div>
              </template>
              <template #parent_name="{ row }">
                <div>
                  <span class="fw-medium">{{ row.display_name }}</span>
                  <div v-if="row.level > 0" class="small text-muted mt-1">
                    <i class="fa fa-sitemap me-1"></i>Path: {{ getCategoryPath(row) }}
                  </div>
                </div>
              </template>
              <template #children_count="{ row }">
                <span v-if="row.children_count > 0" class="badge bg-primary bg-opacity-20 text-primary">
                  {{ row.children_count }} subcategories
                </span>
                <span v-else class="text-muted">--</span>
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" title="View" @click="openCategoryViewModal(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" title="Edit" @click="openCategoryEditModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" title="Add Subcategory" @click="openSubcategoryModal(row)">
                    <i class="fa fa-plus"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" title="Delete" @click="confirmDeleteCategory(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Modals -->
    <!-- Add/Edit Category Modal -->
    <StandardModal
      id="categoryModal"
      ref="categoryModalRef"
      :title="editingCategory ? 'Edit Category' : 'Add Category'"
      size="lg"
      :backdrop="'static'"
      :keyboard="false"
      modalClass="entity-modal category-modal"
      headerClass="modal-header--accent"
      bodyClass="modal-body--form"
      footerClass="modal-footer--form"
      @hidden="resetCategoryEditState"
    >
      <template #header>
        <i class="fa fa-tags me-2"></i>
        {{ editingCategory ? 'Edit Category' : 'Add Category' }}
      </template>

      <form id="categoryForm" class="modal-form" @submit.prevent="saveCategory">
        <div class="modal-form-section">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Name <span class="text-danger">*</span></label>
              <input v-model="categoryForm.name" type="text" class="form-control" placeholder="SUPPLIER" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Display Name <span class="text-danger">*</span></label>
              <input v-model="categoryForm.display_name" type="text" class="form-control" placeholder="Supplier" required />
            </div>
            <div class="col-md-12">
              <label class="form-label">Parent Category</label>
              <Multiselect
                v-model="selectedParentCategory"
                :options="hierarchicalParentOptions"
                :custom-label="getCategoryLabel"
                group-values="children"
                group-label="label"
                track-by="id"
                placeholder="-- No Parent (Root Category) --"
                :allow-empty="true"
                :show-labels="false"
                @select="onParentSelect"
                @remove="onParentRemove"
              >
                <template #option="{ option }">
                  <span v-if="option.$isLabel" class="fw-bold text-primary">
                    <i class="fa fa-folder-open me-2"></i>{{ option.$groupLabel }}
                  </span>
                  <span v-else>
                    <i class="fa fa-tag me-2"></i>{{ option.display_name || option.name }}
                  </span>
                </template>
              </Multiselect>
              <small class="form-hint">Select a parent to create a subcategory</small>
            </div>
            <div class="col-md-6">
              <label class="form-label">Category Code</label>
              <input v-model="categoryForm.category_code" type="text" class="form-control" placeholder="SUPP" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Keyword</label>
              <input v-model="categoryForm.keyword" type="text" class="form-control" placeholder="supplier" />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closeCategoryEditModal">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="savingCategory" form="categoryForm">
          <span v-if="savingCategory" class="spinner-border spinner-border-sm me-2"></span>
          {{ editingCategory ? 'Update Category' : 'Create Category' }}
        </button>
      </template>
    </StandardModal>

    <!-- View Category Modal -->
    <StandardModal
      id="categoryViewModal"
      ref="categoryViewModalRef"
      title="Category Details"
      size="xl"
      modalClass="entity-modal category-modal"
      headerClass="modal-header--accent"
      bodyClass="modal-body--form"
      footerClass="modal-footer--form"
      @hidden="resetCategoryViewState"
    >
      <template #header>
        <i class="fa fa-tags me-2"></i>
        Category Details
      </template>

      <div class="modal-subtitle text-muted small">
        {{ viewCategory?.display_name || viewCategory?.name || '' }}
      </div>
      <div class="modal-info-card">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label text-muted">Name</label>
            <div class="fw-semibold">{{ viewCategory?.name || '--' }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-muted">Display Name</label>
            <div class="fw-semibold">{{ viewCategory?.display_name || '--' }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-muted">Code</label>
            <div class="fw-semibold">{{ viewCategory?.category_code || '--' }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-muted">Keyword</label>
            <div class="fw-semibold">{{ viewCategory?.keyword || '--' }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-muted">Parent Category</label>
            <div class="fw-semibold">
              <span v-if="viewCategory?.parent_id" class="badge bg-info bg-opacity-20 text-info">
                <i class="fa fa-level-up-alt me-1"></i>
                {{ categoryList.find((c: any) => c.id === viewCategory?.parent_id)?.display_name || 'ID: ' + viewCategory?.parent_id }}
              </span>
              <span v-else class="text-muted">-- Root Category --</span>
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-muted">Child Categories</label>
            <div class="fw-semibold">
              <span class="badge bg-primary bg-opacity-20 text-primary">
                {{ categoryList.filter((c: any) => c.parent_id === viewCategory?.id).length }} subcategories
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="categoryList.filter((c: any) => c.parent_id === viewCategory?.id).length > 0" class="modal-info-card mt-3">
        <h6 class="mb-2"><i class="fa fa-sitemap me-2"></i>Subcategories</h6>
        <div class="d-flex flex-wrap gap-2">
          <span v-for="child in categoryList.filter((c: any) => c.parent_id === viewCategory?.id)" :key="child.id" class="badge bg-secondary bg-opacity-20 text-dark py-2 px-3">
            <i class="fa fa-tag me-1"></i>{{ child.display_name || child.name }}
          </span>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closeCategoryViewModal">Close</button>
      </template>
    </StandardModal>

    <!-- Entity-related Modals -->
    <!-- Add/Edit Entity Modal -->
    <StandardModal
      id="entityModal"
      ref="entityModalRef"
      :title="editingEntity ? 'Edit Entity' : 'Create New Entity'"
      size="xl"
      :scrollable="true"
      :backdrop="'static'"
      :keyboard="false"
      modalClass="entity-modal entity-edit-modal"
      headerClass="modal-header--accent"
      bodyClass="modal-body--form"
      footerClass="modal-footer--form"
      @hidden="resetEntityModalState"
    >
      <template #header>
        <i :class="['fa me-2', editingEntity ? 'fa-edit' : 'fa-plus-circle']"></i>
        {{ editingEntity ? 'Edit Entity' : 'Create New Entity' }}
      </template>

      <form id="entityForm" class="modal-form" @submit.prevent="saveEntity">
          <!-- Basic Information -->
          <div class="modal-form-section mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Basic Information</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Entity Code</label>
                <input v-model="entityForm.code" type="text" class="form-control" placeholder="enter code" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Full Name <span class="text-danger">*</span></label>
                <input v-model="entityForm.full_name" type="text" class="form-control" placeholder="Enter full name" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Trading Name</label>
                <input v-model="entityForm.trading_name" type="text" class="form-control" placeholder="DBA / Trading name" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Nick Name</label>
                <input v-model="entityForm.nick_name" type="text" class="form-control" placeholder="Short name" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Entity Type <span class="text-danger">*</span></label>
                <select v-model="entityForm.type" class="form-select" required>
                  <option v-for="opt in entityTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Status</label>
                <select v-model="entityForm.status" class="form-select">
                  <option v-for="opt in entityStatusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Location & Currency -->
          <div class="modal-form-section mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-globe me-2"></i>Location & Currency</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Country</label>
                <Multiselect 
                  v-model="entityForm.country_id" 
                  :options="countries" 
                  label="name" 
                  track-by="id" 
                  placeholder="Select country"
                  :searchable="true"
                />
              </div>
              <div class="col-md-4">
                <label class="form-label">Nationality</label>
                <Multiselect 
                  v-model="entityForm.nationality_id" 
                  :options="nationalities" 
                  label="name" 
                  track-by="id" 
                  placeholder="Select nationality"
                  :searchable="true"
                />
              </div>
              <div class="col-md-4">
                <label class="form-label">Base Currency</label>
                <Multiselect 
                  v-model="entityForm.base_currency_id" 
                  :options="currencies" 
                  label="name" 
                  track-by="id" 
                  :custom-label="currencyLabel"
                  placeholder="Select currency"
                  :searchable="true"
                />
              </div>
            </div>
          </div>

          <!-- Hierarchy -->
          <div class="modal-form-section mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-sitemap me-2"></i>Hierarchy</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <div class="form-check">
                  <input v-model="entityForm.is_group" type="checkbox" class="form-check-input" id="isGroupCheck" />
                  <label class="form-check-label" for="isGroupCheck">Is Parent/Group Entity</label>
                </div>
                <small class="text-muted">Check if this entity will have child entities</small>
              </div>
              <div class="col-md-6" v-if="!entityForm.is_group">
                <label class="form-label">Parent Entity</label>
                <Multiselect 
                  v-model="entityForm.parent_entity_id" 
                  :options="parentEntityOptions" 
                  label="full_name" 
                  track-by="id" 
                  placeholder="Select parent entity"
                  :searchable="true"
                  :allow-empty="true"
                />
              </div>
            </div>
          </div>

          <!-- Company Profile (conditional) -->
          <div v-if="entityForm.type === 'COMPANY'" class="modal-form-section mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-building me-2"></i>Company Profile</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Legal Name</label>
                <input v-model="entityForm.company_profile.legal_name" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Registration Number</label>
                <input v-model="entityForm.company_profile.registration_no" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Registration Country</label>
                <Multiselect 
                  v-model="entityForm.company_profile.registration_country_id" 
                  :options="countries" 
                  label="name" 
                  track-by="id" 
                  placeholder="Select country"
                />
              </div>
              <div class="col-md-4">
                <label class="form-label">Incorporation Date</label>
                <input v-model="entityForm.company_profile.incorporation_date" type="date" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Business Type</label>
                <input v-model="entityForm.company_profile.business_type" type="text" class="form-control" placeholder="LLC, Corp, etc." />
              </div>
              <div class="col-md-6">
                <label class="form-label">Industry Code</label>
                <input v-model="entityForm.company_profile.industry_code" type="text" class="form-control" placeholder="ISIC/NAICS code" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tax Residency Country</label>
                <Multiselect 
                  v-model="entityForm.company_profile.tax_residency_country_id" 
                  :options="countries" 
                  label="name" 
                  track-by="id" 
                  placeholder="Select country"
                />
              </div>
            </div>
          </div>

          <!-- Individual Profile (conditional) -->
          <div v-if="entityForm.type === 'INDIVIDUAL'" class="modal-form-section mb-4">
            <h6 class="text-primary mb-3"><i class="fa fa-user me-2"></i>Individual Profile</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Date of Birth</label>
                <input v-model="entityForm.individual_profile.date_of_birth" type="date" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Gender</label>
                <select v-model="entityForm.individual_profile.gender" class="form-select">
                  <option value="">-- Select --</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Marital Status</label>
                <select v-model="entityForm.individual_profile.marital_status" class="form-select">
                  <option value="">-- Select --</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Nationality Country</label>
                <Multiselect 
                  v-model="entityForm.individual_profile.nationality_country_id" 
                  :options="countries" 
                  label="name" 
                  track-by="id" 
                  placeholder="Select country"
                />
              </div>
            </div>
          </div>

          <!-- Contacts -->
          <div class="modal-form-section mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="text-primary mb-0"><i class="fa fa-address-book me-2"></i>Contacts</h6>
              <button type="button" class="btn btn-outline-primary btn-sm" @click="addContactRow">
                <i class="fa fa-plus me-1"></i>Add Contact
              </button>
            </div>
            <div v-for="(contact, index) in entityForm.contacts" :key="index" class="row g-2 align-items-end mb-2">
              <div class="col-md-3">
                <label class="form-label small">Type</label>
                <select v-model="contact.contact_type_id" class="form-select form-select-sm">
                  <option v-for="ct in contactTypes" :key="ct.id" :value="ct.id">
                    {{ ct.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-5">
                <label class="form-label small">Contact Value</label>
                <input v-model="contact.contact" type="text" class="form-control form-control-sm" placeholder="Email, phone, etc." />
              </div>
              <div class="col-md-2">
                <div class="form-check mt-4">
                  <input v-model="contact.contactable" type="checkbox" class="form-check-input" :id="'contactable-' + index" />
                  <label class="form-check-label small" :for="'contactable-' + index">Can contact</label>
                </div>
              </div>
              <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger btn-sm" @click="removeContactRow(index)">
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </div>
            <div v-if="!entityForm.contacts.length" class="text-muted small">No contacts added yet.</div>
          </div>

          <!-- Notes -->
          <div class="modal-form-section mb-4">
            <h6 class="text-primary mb-2"><i class="fa fa-sticky-note me-2"></i>Notes</h6>
            <textarea v-model="entityForm.notes" rows="3" class="form-control" placeholder="Additional notes..."></textarea>
          </div>

      </form>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closeEntityModal">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="saving" form="entityForm">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          {{ editingEntity ? 'Update Entity' : 'Create Entity' }}
        </button>
      </template>
    </StandardModal>

    <!-- Entity Details Modal -->
    <StandardModal
      id="entityViewModal"
      ref="viewModalRef"
      title="Entity Details"
      size="xl"
      :scrollable="true"
      modalClass="entity-modal entity-view-modal"
      headerClass="modal-header--accent"
      bodyClass="modal-body--form"
      footerClass="modal-footer--form"
      @hidden="resetViewModalState"
    >
      <template #header>
        <i :class="['fa me-2', getTypeIcon(viewEntity?.type)]"></i>
        Entity Details
      </template>

      <div class="modal-subtitle text-muted small">{{ viewEntity?.full_name || '-' }}</div>
      <ul class="nav nav-tabs modal-tabs mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
            <i class="fa fa-info-circle me-1"></i>Basic Info
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" :class="{ active: activeTab === 'contacts' }" @click="activeTab = 'contacts'">
            <i class="fa fa-address-book me-1"></i>Contacts
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" :class="{ active: activeTab === 'identities' }" @click="activeTab = 'identities'">
            <i class="fa fa-id-card me-1"></i>Identities
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">
            <i class="fa fa-tags me-1"></i>Categories
          </button>
        </li>
      </ul>

      <!-- Basic Info Tab -->
      <div v-if="activeTab === 'basic'">
        <div class="modal-info-card">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label text-muted small">Code</label>
              <div class="fw-semibold">{{ viewEntity?.code || '-' }}</div>
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small">Status</label>
              <div>
                <span class="badge" :class="`bg-${getStatusColor(viewEntity?.status)} bg-opacity-20 text-${getStatusColor(viewEntity?.status)}`">
                  {{ viewEntity?.status || 'DRAFT' }}
                </span>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small">Type</label>
              <div class="fw-semibold">
                <i :class="['fa me-1', getTypeIcon(viewEntity?.type)]"></i>
                {{ viewEntity?.type || '-' }}
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small">Is Group</label>
              <div class="fw-semibold">{{ viewEntity?.is_group ? 'Yes' : 'No' }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label text-muted small">Full Name</label>
              <div class="fw-semibold">{{ viewEntity?.full_name || '-' }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label text-muted small">Trading Name</label>
              <div class="fw-semibold">{{ viewEntity?.trading_name || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Nick Name</label>
              <div class="fw-semibold">{{ viewEntity?.nick_name || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Country</label>
              <div class="fw-semibold">{{ viewEntity?.country?.name || viewEntity?.country_name || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Nationality</label>
              <div class="fw-semibold">{{ viewEntity?.nationality?.name || viewEntity?.nationality_name || '-' }}</div>
            </div>
            <div class="col-md-12" v-if="viewEntity?.notes">
              <label class="form-label text-muted small">Notes</label>
              <div class="fw-semibold">{{ viewEntity?.notes }}</div>
            </div>
          </div>
        </div>

        <!-- Company Profile -->
        <div v-if="viewEntity?.type === 'COMPANY' && viewEntity?.company_profile" class="modal-info-card mt-3">
          <h6 class="mb-2"><i class="fa fa-building me-2"></i>Company Profile</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label text-muted small">Legal Name</label>
              <div class="fw-semibold">{{ viewEntity?.company_profile?.legal_name || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Registration No</label>
              <div class="fw-semibold">{{ viewEntity?.company_profile?.registration_no || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Business Type</label>
              <div class="fw-semibold">{{ viewEntity?.company_profile?.business_type || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Incorporation Date</label>
              <div class="fw-semibold">{{ viewEntity?.company_profile?.incorporation_date || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- Individual Profile -->
        <div v-if="viewEntity?.type === 'INDIVIDUAL' && viewEntity?.individual_profile" class="modal-info-card mt-3">
          <h6 class="mb-2"><i class="fa fa-user me-2"></i>Individual Profile</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label text-muted small">Date of Birth</label>
              <div class="fw-semibold">{{ viewEntity?.individual_profile?.date_of_birth || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Gender</label>
              <div class="fw-semibold">{{ viewEntity?.individual_profile?.gender || '-' }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">Marital Status</label>
              <div class="fw-semibold">{{ viewEntity?.individual_profile?.marital_status || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contacts Tab -->
      <div v-else-if="activeTab === 'contacts'" class="modal-info-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Contacts</h6>
          <button class="btn btn-outline-primary btn-sm" @click="addContactToView">
            <i class="fa fa-plus me-1"></i>Add Contact
          </button>
        </div>
        <div v-if="viewContacts.length" class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Type</th>
                <th>Contact</th>
                <th>Contactable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contact in viewContacts" :key="contact.id">
                <td>{{ contact.contact_type?.name || getContactTypeName(contact.contact_type_id) }}</td>
                <td>{{ contact.contact }}</td>
                <td>
                  <span :class="contact.contactable ? 'text-success' : 'text-muted'">
                    <i :class="['fa', contact.contactable ? 'fa-check-circle' : 'fa-times-circle']"></i>
                  </span>
                </td>
                <td>
                  <button class="btn btn-outline-danger btn-sm" @click="removeContactFromView(contact)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted">No contacts found.</div>

        <!-- Add Contact Inline Form -->
        <div v-if="showAddContact" class="border rounded p-3 mt-3">
          <h6 class="mb-2">Add New Contact</h6>
          <div class="row g-2 align-items-end">
            <div class="col-md-3">
              <label class="form-label small">Type</label>
              <select v-model="newContact.contact_type_id" class="form-select form-select-sm">
                <option v-for="ct in contactTypes" :key="ct.id" :value="ct.id">{{ ct.name }}</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="form-label small">Contact</label>
              <input v-model="newContact.contact" type="text" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <div class="form-check">
                <input v-model="newContact.contactable" type="checkbox" class="form-check-input" id="newContactable" />
                <label class="form-check-label small" for="newContactable">Contactable</label>
              </div>
            </div>
            <div class="col-md-2">
              <button type="button" class="btn btn-primary btn-sm me-1" @click="saveNewContact" :disabled="savingContact">
                <i class="fa fa-save"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="showAddContact = false">
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Identities Tab -->
      <div v-else-if="activeTab === 'identities'" class="modal-info-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Identity Documents</h6>
          <button class="btn btn-outline-primary btn-sm" @click="addIdentityToView">
            <i class="fa fa-plus me-1"></i>Add Identity
          </button>
        </div>
        <div v-if="viewIdentities.length" class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Type</th>
                <th>Number</th>
                <th>Issued Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="identity in viewIdentities" :key="identity.id">
                <td>{{ identity.identity_type?.name || getIdentityTypeName(identity.identity_type_id) }}</td>
                <td>{{ identity.identity_number }}</td>
                <td>{{ identity.issued_date || '-' }}</td>
                <td>{{ identity.identity_dates?.[0]?.expire_date || identity.dates?.expire_date || '-' }}</td>
                <td>
                  <span :class="identity.is_active ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ identity.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-outline-danger btn-sm" @click="removeIdentityFromView(identity)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted">No identities found.</div>

        <!-- Add Identity Inline Form -->
        <div v-if="showAddIdentity" class="border rounded p-3 mt-3">
          <h6 class="mb-2">Add New Identity</h6>
          <div class="row g-2 align-items-end">
            <div class="col-md-3">
              <label class="form-label small">Type</label>
              <select v-model="newIdentity.identity_type_id" class="form-select form-select-sm">
                <option v-for="it in identityTypes" :key="it.id" :value="it.id">{{ it.name }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small">Number</label>
              <input v-model="newIdentity.identity_number" type="text" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label small">Issued Date</label>
              <input v-model="newIdentity.issued_date" type="date" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label small">Expiry Date</label>
              <input v-model="newIdentity.dates.expire_date" type="date" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <button type="button" class="btn btn-primary btn-sm me-1" @click="saveNewIdentity" :disabled="savingIdentity">
                <i class="fa fa-save"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="showAddIdentity = false">
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Tab -->
      <div v-else-if="activeTab === 'categories'" class="modal-info-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Categories</h6>
          <button class="btn btn-outline-primary btn-sm" @click="openAssignCategoryModal">
            <i class="fa fa-plus me-1"></i>Assign Category
          </button>
        </div>
        <div v-if="viewCategories.length" class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Category</th>
                <th>Code</th>
                <th>Effective From</th>
                <th>Effective To</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in viewCategories" :key="cat.id">
                <td>{{ cat.display_name || cat.name }}</td>
                <td>{{ cat.pivot?.code || cat.category_code || '-' }}</td>
                <td>{{ cat.pivot?.effective_from || '-' }}</td>
                <td>{{ cat.pivot?.effective_to || '-' }}</td>
                <td>
                  <span :class="cat.pivot?.is_active !== false ? 'text-success' : 'text-muted'">
                    <i :class="['fa', cat.pivot?.is_active !== false ? 'fa-check-circle' : 'fa-times-circle']"></i>
                  </span>
                </td>
                <td>
                  <button class="btn btn-outline-danger btn-sm" @click="removeCategoryFromView(cat)">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted">No categories assigned.</div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closeViewModal">Close</button>
        <button type="button" class="btn btn-primary" @click="openEntityModal(viewEntity)">
          <i class="fa fa-edit me-1"></i>Edit Entity
        </button>
      </template>
    </StandardModal>

    <!-- Assign Category Modal -->
    <StandardModal
      id="assignCategoryModal"
      ref="assignCategoryModalRef"
      title="Assign Category to Entity"
      size="lg"
      :backdrop="'static'"
      :keyboard="false"
      modalClass="entity-modal assign-category-modal"
      headerClass="modal-header--accent"
      bodyClass="modal-body--form"
      footerClass="modal-footer--form"
    >
      <template #header>
        <i class="fa fa-tags me-2"></i>
        Assign Category to Entity
      </template>

      <form id="assignCategoryForm" class="modal-form" @submit.prevent="assignCategory">
        <div class="modal-form-section">
          <div class="row g-3">
            <div class="col-md-12">
              <label class="form-label">Category <span class="text-danger">*</span></label>
              <Multiselect 
                v-model="assignCategoryForm.category_id" 
                :options="categories" 
                label="display_name" 
                track-by="id" 
                placeholder="Select category"
                :searchable="true"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Effective From</label>
              <input v-model="assignCategoryForm.effective_from" type="date" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Effective To</label>
              <input v-model="assignCategoryForm.effective_to" type="date" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Category Code</label>
              <input v-model="assignCategoryForm.code" type="text" class="form-control" placeholder="Optional code" />
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <div class="form-check mt-4">
                <input v-model="assignCategoryForm.is_active" type="checkbox" class="form-check-input" id="catActive" />
                <label class="form-check-label" for="catActive">Is Active</label>
              </div>
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closeAssignCategoryModal">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="assigningCategory" form="assignCategoryForm">
          <span v-if="assigningCategory" class="spinner-border spinner-border-sm me-2"></span>
          Assign Category
        </button>
      </template>
    </StandardModal>

    <!-- Status Change Modal -->
    <StandardModal
      id="statusModal"
      ref="statusModalRef"
      title="Change Status"
      size="sm"
      :centered="true"
      :backdrop="'static'"
      :keyboard="false"
      modalClass="entity-modal status-modal"
      headerClass="modal-header--accent"
      bodyClass="modal-body--form"
      footerClass="modal-footer--form"
      @hidden="resetStatusModalState"
    >
      <template #header>
        <i class="fa fa-refresh me-2"></i>
        Change Status
      </template>

      <div class="modal-form-section">
        <p class="mb-2">Select new status for <strong>{{ statusEntity?.full_name }}</strong>:</p>
        <select v-model="newStatus" class="form-select">
          <option v-for="opt in entityStatusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <template #footer>
        <button type="button" class="btn btn-outline-secondary" @click="closeStatusModal">Cancel</button>
        <button type="button" class="btn btn-primary" @click="updateEntityStatus" :disabled="changingStatus">
          <span v-if="changingStatus" class="spinner-border spinner-border-sm me-2"></span>
          Update Status
        </button>
      </template>
    </StandardModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import StandardModal from '@/components/plugins/StandardModal.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import entityService from '@/services/entityService'
import {
  type Entity,
  type Contact,
  type Identity,
  type Category,
  type Country,
  type Currency,
  type ContactType,
  type IdentityType,
  EntityType,
  EntityStatus,
  entityTypeOptions as defaultEntityTypeOptions,
  entityStatusOptions as defaultEntityStatusOptions,
  getStatusColor,
  getTypeIcon
} from '@/types/entity'

// State
const loading = ref(false)
const saving = ref(false)
const savingContact = ref(false)
const savingIdentity = ref(false)
const assigningCategory = ref(false)
const changingStatus = ref(false)
const loadingCategories = ref(false)
const savingCategory = ref(false)

const activeListTab = ref('entities')

const entities = ref<Entity[]>([])
const categories = ref<Category[]>([])
const categoryList = ref<any[]>([])
const countries = ref<Country[]>([])
const currencies = ref<Currency[]>([])
const nationalities = ref<any[]>([])
const contactTypes = ref<ContactType[]>([])
const identityTypes = ref<IdentityType[]>([])
const entityTypes = ref<any[]>([])
const entityStatuses = ref<any[]>([])
const parentEntityOptions = ref<Entity[]>([])

const tableRef = ref<{ toggleFilters: () => void } | null>(null)
const categoryTableRef = ref<{ toggleFilters: () => void } | null>(null)

const pagination = ref({
  total: 0,
  current_page: 1,
  last_page: 1,
  per_page: 15
})

const tableFilters = ref({
  search: '',
  type: '',
  status: '',
  category_id: '',
  limit: 15
})

const categoryTableFilters = ref({
  search: '',
  keyword: '',
  parent_id: ''
})

const expandedCategories = ref<Set<number>>(new Set())
const editingCategory = ref<any>(null)
const viewCategory = ref<any>(null)
const selectedParentCategory = ref<any>(null)

const categoryForm = reactive({
  name: '',
  display_name: '',
  category_code: '',
  keyword: '',
  parent_id: null as number | null
})

// Status counts
const statusCounts = computed(() => {
  const counts: Record<string, number> = {}
  entities.value.forEach((e) => {
    counts[e.status] = (counts[e.status] || 0) + 1
  })
  return counts
})

// Columns
const columns = [
  { key: 'code', label: 'CODE', sortable: true, visible: true },
  { key: 'full_name', label: 'NAME', sortable: true, visible: true },
  { key: 'type', label: 'TYPE', sortable: true, visible: true },
  { key: 'status', label: 'STATUS', sortable: true, visible: true },
  { key: 'country', label: 'COUNTRY', sortable: true, visible: true },
  { key: 'categories', label: 'CATEGORIES', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const categoryColumns = [
  { key: 'name', label: 'NAME', sortable: true, visible: true },
  { key: 'display_name', label: 'DISPLAY NAME', sortable: true, visible: true },
  { key: 'parent_name', label: 'PARENT CATEGORY', sortable: true, visible: true },
  { key: 'category_code', label: 'CODE', sortable: true, visible: true },
  { key: 'keyword', label: 'KEYWORD', sortable: true, visible: true },
  { key: 'children_count', label: 'CHILDREN', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const entityTypeOptions = computed(() => {
  if (entityTypes.value.length) return entityTypes.value
  return defaultEntityTypeOptions
})

const entityStatusOptions = computed(() => {
  if (entityStatuses.value.length) return entityStatuses.value
  return defaultEntityStatusOptions
})

const customFilters = computed(() => [
  {
    key: 'type',
    label: 'Entity Type',
    type: 'select',
    options: entityTypeOptions.value.map((t) => ({ label: t.label, value: t.value })),
    placeholder: 'All Types',
    defaultValue: ''
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: entityStatusOptions.value.map((s) => ({ label: s.label, value: s.value })),
    placeholder: 'All Statuses',
    defaultValue: ''
  },
  {
    key: 'category_id',
    label: 'Category',
    type: 'select',
    options: categories.value.map((c) => ({ label: c.display_name || c.name, value: c.id })),
    placeholder: 'All Categories',
    defaultValue: ''
  }
])

const categoryCustomFilters = computed(() => {
  const parentOptions = categoryList.value
    .filter((c: any) => !c.parent_id)
    .map((cat: any) => ({
      label: cat.display_name || cat.name,
      value: cat.id
    }))
  
  return [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'text',
      placeholder: 'Filter by keyword',
      defaultValue: ''
    },
    {
      key: 'parent_id',
      label: 'Filter by Parent',
      type: 'select',
      options: parentOptions,
      placeholder: 'All Categories',
      defaultValue: ''
    }
  ]
})

// Category hierarchy computed properties
const hierarchicalCategories = computed(() => {
  const buildTree = (parentId: number | null = null, level: number = 0): any[] => {
    return categoryList.value
      .filter((cat: any) => cat.parent_id === parentId)
      .map((cat: any) => ({
        ...cat,
        level,
        parent_name: categoryList.value.find((p: any) => p.id === cat.parent_id)?.display_name || null,
        children_count: categoryList.value.filter((c: any) => c.parent_id === cat.id).length,
        children: buildTree(cat.id, level + 1)
      }))
  }
  return buildTree(null)
})

const flattenedCategories = computed(() => {
  let result: any[] = []
  const flatten = (items: any[], parentExpanded = true) => {
    items.forEach((item) => {
      if (parentExpanded) {
        result.push(item)
      }
      if (item.children?.length) {
        const isExpanded = expandedCategories.value.has(item.id)
        flatten(item.children, parentExpanded && isExpanded)
      }
    })
  }
  flatten(hierarchicalCategories.value)
  
  if (categoryTableFilters.value.parent_id) {
    const parentId = Number(categoryTableFilters.value.parent_id)
    result = result.filter((cat: any) => 
      cat.id === parentId || cat.parent_id === parentId || isDescendantOf(cat.id, parentId)
    )
  }
  
  return result
})

const parentCategoryOptions = computed(() => {
  if (!editingCategory.value?.id) {
    return categoryList.value
  }
  const excludeIds = new Set<number>([editingCategory.value.id])
  const collectDescendants = (parentId: number) => {
    categoryList.value.forEach((cat: any) => {
      if (cat.parent_id === parentId && !excludeIds.has(cat.id)) {
        excludeIds.add(cat.id)
        collectDescendants(cat.id)
      }
    })
  }
  collectDescendants(editingCategory.value.id)
  return categoryList.value.filter((cat: any) => !excludeIds.has(cat.id))
})

const hierarchicalParentOptions = computed(() => {
  const buildGroups = () => {
    return parentCategoryOptions.value
      .filter((c: any) => !c.parent_id)
      .map((root: any) => ({
        label: root.display_name || root.name,
        children: [
          root,
          ...parentCategoryOptions.value.filter((c: any) => c.parent_id === root.id)
        ]
      }))
  }
  return buildGroups()
})

const pageActions = computed(() => [
  {
    label: 'Add Entity',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => openEntityModal()
  },
  {
    label: 'Filters',
    icon: 'fa fa-filter',
    class: 'btn btn-outline-info',
    method: () => tableRef.value?.toggleFilters()
  }
])

const categoryPageActions = computed(() => [
  {
    label: 'Add Category',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => openCategoryEditModal()
  },
  {
    label: 'Filters',
    icon: 'fa fa-filter',
    class: 'btn btn-outline-info',
    method: () => categoryTableRef.value?.toggleFilters()
  }
])

type ModalHandle = { show: () => void; hide: () => void }

// Modals state
const categoryModalRef = ref<ModalHandle | null>(null)
const categoryViewModalRef = ref<ModalHandle | null>(null)
const entityModalRef = ref<ModalHandle | null>(null)
const viewModalRef = ref<ModalHandle | null>(null)
const assignCategoryModalRef = ref<ModalHandle | null>(null)
const statusModalRef = ref<ModalHandle | null>(null)
const showAddContact = ref(false)
const showAddIdentity = ref(false)

const editingEntity = ref<Entity | null>(null)
const viewEntity = ref<Entity | null>(null)
const statusEntity = ref<Entity | null>(null)
const newStatus = ref('')
const activeTab = ref('basic')

// Form state
const defaultEntityForm = () => ({
  code: '',
  full_name: '',
  trading_name: '',
  nick_name: '',
  type: EntityType.COMPANY,
  status: EntityStatus.DRAFT,
  country_id: null as any,
  nationality_id: null as any,
  base_currency_id: null as any,
  is_group: false,
  parent_entity_id: null as any,
  notes: '',
  company_profile: {
    legal_name: '',
    trading_name: '',
    registration_no: '',
    registration_country_id: null as any,
    incorporation_date: '',
    business_type: '',
    industry_code: '',
    tax_residency_country_id: null as any
  },
  individual_profile: {
    date_of_birth: '',
    gender: '' as any,
    nationality_country_id: null as any,
    marital_status: '' as any
  },
  contacts: [] as Array<{ contact_type_id: number; contact: string; contactable: boolean }>
})

const entityForm = reactive(defaultEntityForm())

const viewContacts = ref<Contact[]>([])
const viewIdentities = ref<Identity[]>([])
const viewCategories = ref<Category[]>([])

const newContact = reactive({
  contact_type_id: 1,
  contact: '',
  contactable: true
})

const newIdentity = reactive({
  identity_type_id: 1,
  identity_number: '',
  issued_date: '',
  is_active: true,
  dates: {
    expire_date: ''
  }
})

const assignCategoryForm = reactive({
  category_id: null as any,
  effective_from: '',
  effective_to: '',
  code: '',
  is_active: true
})

// Helper functions
const currencyLabel = (currency: Currency) => {
  return currency ? `${currency.name} (${currency.code || ''})` : ''
}

const getContactTypeName = (id: number) => {
  return contactTypes.value.find((ct) => ct.id === id)?.name || '-'
}

const getIdentityTypeName = (id: number) => {
  return identityTypes.value.find((it) => it.id === id)?.name || '-'
}

// API calls
const fetchEntities = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.current_page,
      per_page: tableFilters.value.limit
    }
    if (tableFilters.value.search) params.search = tableFilters.value.search
    if (tableFilters.value.type) params.type = tableFilters.value.type
    if (tableFilters.value.status) params.status = tableFilters.value.status
    if (tableFilters.value.category_id) params.category_id = tableFilters.value.category_id

    const response = await entityService.list(params)
    entities.value = response.data || []
    if (response.meta) {
      pagination.value = {
        total: response.meta.total,
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page
      }
    }
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load entities' })
  } finally {
    loading.value = false
  }
}

const fetchMetadata = async () => {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: token ? `Bearer ${token}` : ''
    }
    const response = await axios.get('http://localhost:8000/api/v1.0/entities/creation-metadata', { headers })
    const data = response.data?.data || response.data || {}

    categories.value = Array.isArray(data.categories) ? data.categories : []
    countries.value = Array.isArray(data.countries) ? data.countries : []
    currencies.value = Array.isArray(data.currencies) ? data.currencies : []
    nationalities.value = Array.isArray(data.nationalities) ? data.nationalities : []
    contactTypes.value = Array.isArray(data.contact_types) ? data.contact_types : []
    identityTypes.value = Array.isArray(data.identity_types) ? data.identity_types : []
    entityTypes.value = Array.isArray(data.entity_types) ? data.entity_types : []
    entityStatuses.value = Array.isArray(data.entity_statuses) ? data.entity_statuses : []
  } catch (error: any) {
    console.error('Failed to load metadata', error)
  }
}

const fetchEntityDetails = async (id: number) => {
  try {
    const response = await entityService.get(id)
    const entity = response.data
    viewEntity.value = entity
    viewContacts.value = entity.contacts || []
    viewIdentities.value = entity.identities || []
    viewCategories.value = entity.categories || []
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load entity details' })
  }
}

const fetchParentEntities = async () => {
  try {
    const response = await entityService.list({ is_group: true, per_page: 100 })
    parentEntityOptions.value = response.data || []
  } catch (error: any) {
    console.error('Failed to load parent entities', error)
  }
}

// Event handlers
const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
  pagination.value.current_page = 1
  fetchEntities()
}

const handlePageChange = (page: number) => {
  pagination.value.current_page = page
  fetchEntities()
}

const resetCategoryEditState = () => {
  editingCategory.value = null
  selectedParentCategory.value = null
}

const resetEntityModalState = () => {
  editingEntity.value = null
}

const resetCategoryViewState = () => {
  viewCategory.value = null
}

const resetStatusModalState = () => {
  statusEntity.value = null
  newStatus.value = ''
}

const resetViewModalState = () => {
  viewEntity.value = null
  viewContacts.value = []
  viewIdentities.value = []
  viewCategories.value = []
  showAddContact.value = false
  showAddIdentity.value = false
}

// Entity CRUD
const openEntityModal = (entity?: Entity | null) => {
  if (entity) {
    editingEntity.value = entity
    Object.assign(entityForm, {
      code: entity.code || '',
      full_name: entity.full_name || '',
      trading_name: entity.trading_name || '',
      nick_name: entity.nick_name || '',
      type: entity.type || EntityType.COMPANY,
      status: entity.status || EntityStatus.DRAFT,
      country_id: countries.value.find((c) => c.id === entity.country_id) || null,
      nationality_id: nationalities.value.find((n) => n.id === entity.nationality_id) || null,
      base_currency_id: currencies.value.find((c) => c.id === entity.base_currency_id) || null,
      is_group: entity.is_group || false,
      parent_entity_id: parentEntityOptions.value.find((p) => p.id === entity.parent_entity_id) || null,
      notes: entity.notes || '',
      company_profile: entity.company_profile
        ? {
            legal_name: entity.company_profile.legal_name || '',
            trading_name: entity.company_profile.trading_name || '',
            registration_no: entity.company_profile.registration_no || '',
            registration_country_id:
              countries.value.find((c) => c.id === entity.company_profile?.registration_country_id) || null,
            incorporation_date: entity.company_profile.incorporation_date || '',
            business_type: entity.company_profile.business_type || '',
            industry_code: entity.company_profile.industry_code || '',
            tax_residency_country_id:
              countries.value.find((c) => c.id === entity.company_profile?.tax_residency_country_id) || null
          }
        : defaultEntityForm().company_profile,
      individual_profile: entity.individual_profile
        ? {
            date_of_birth: entity.individual_profile.date_of_birth || '',
            gender: entity.individual_profile.gender || '',
            nationality_country_id:
              countries.value.find((c) => c.id === entity.individual_profile?.nationality_country_id) || null,
            marital_status: entity.individual_profile.marital_status || ''
          }
        : defaultEntityForm().individual_profile,
      contacts: (entity.contacts || []).map((c) => ({
        contact_type_id: c.contact_type_id,
        contact: c.contact,
        contactable: c.contactable !== false
      }))
    })
  } else {
    editingEntity.value = null
    Object.assign(entityForm, defaultEntityForm())
  }
  viewModalRef.value?.hide()
  entityModalRef.value?.show()
}

const closeEntityModal = () => {
  entityModalRef.value?.hide()
  resetEntityModalState()
}

const saveEntity = async () => {
  if (!entityForm.full_name) {
    Swal.fire({ icon: 'warning', title: 'Validation', text: 'Full name is required' })
    return
  }

  saving.value = true
  try {
    const payload: any = {
      code: entityForm.code || undefined,
      full_name: entityForm.full_name,
      trading_name: entityForm.trading_name || undefined,
      nick_name: entityForm.nick_name || undefined,
      type: entityForm.type,
      status: entityForm.status,
      country_id: entityForm.country_id?.id || undefined,
      nationality_id: entityForm.nationality_id?.id || undefined,
      base_currency_id: entityForm.base_currency_id?.id || undefined,
      is_group: entityForm.is_group,
      parent_entity_id: entityForm.parent_entity_id?.id || undefined,
      notes: entityForm.notes || undefined
    }

    // Add type-specific profile
    if (entityForm.type === EntityType.COMPANY) {
      payload.company_profile = {
        legal_name: entityForm.company_profile.legal_name || undefined,
        trading_name: entityForm.company_profile.trading_name || undefined,
        registration_no: entityForm.company_profile.registration_no || undefined,
        registration_country_id: entityForm.company_profile.registration_country_id?.id || undefined,
        incorporation_date: entityForm.company_profile.incorporation_date || undefined,
        business_type: entityForm.company_profile.business_type || undefined,
        industry_code: entityForm.company_profile.industry_code || undefined,
        tax_residency_country_id: entityForm.company_profile.tax_residency_country_id?.id || undefined
      }
    } else if (entityForm.type === EntityType.INDIVIDUAL) {
      payload.individual_profile = {
        date_of_birth: entityForm.individual_profile.date_of_birth || undefined,
        gender: entityForm.individual_profile.gender || undefined,
        nationality_country_id: entityForm.individual_profile.nationality_country_id?.id || undefined,
        marital_status: entityForm.individual_profile.marital_status || undefined
      }
    }

    // Add contacts if creating
    if (!editingEntity.value && entityForm.contacts.length) {
      payload.contacts = entityForm.contacts.filter((c) => c.contact)
    }

    if (editingEntity.value?.id) {
      await entityService.update(editingEntity.value.id, payload)
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Entity updated successfully', timer: 1500 })
    } else {
      await entityService.create(payload)
      Swal.fire({ icon: 'success', title: 'Created', text: 'Entity created successfully', timer: 1500 })
    }

    closeEntityModal()
    fetchEntities()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save entity' })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (entity: Entity) => {
  const result = await Swal.fire({
    title: 'Delete Entity?',
    text: `This will delete "${entity.full_name}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc3545'
  })

  if (!result.isConfirmed) return

  try {
    await entityService.delete(entity.id)
    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Entity deleted successfully', timer: 1500 })
    fetchEntities()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to delete entity' })
  }
}

// View modal
const openViewModal = async (entity: Entity) => {
  activeTab.value = 'basic'
  showAddContact.value = false
  showAddIdentity.value = false
  await fetchEntityDetails(entity.id)
  viewModalRef.value?.show()
}

const closeViewModal = () => {
  viewModalRef.value?.hide()
  resetViewModalState()
}

// Contact management
const addContactRow = () => {
  entityForm.contacts.push({
    contact_type_id: contactTypes.value[0]?.id || 1,
    contact: '',
    contactable: true
  })
}

const removeContactRow = (index: number) => {
  entityForm.contacts.splice(index, 1)
}

const addContactToView = () => {
  newContact.contact_type_id = contactTypes.value[0]?.id || 1
  newContact.contact = ''
  newContact.contactable = true
  showAddContact.value = true
}

const saveNewContact = async () => {
  if (!viewEntity.value?.id || !newContact.contact) return

  savingContact.value = true
  try {
    await entityService.addContact(viewEntity.value.id, {
      contact_type_id: newContact.contact_type_id,
      contact: newContact.contact,
      contactable: newContact.contactable
    })
    await fetchEntityDetails(viewEntity.value.id)
    showAddContact.value = false
    Swal.fire({ icon: 'success', title: 'Added', text: 'Contact added successfully', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to add contact' })
  } finally {
    savingContact.value = false
  }
}

const removeContactFromView = async (contact: Contact) => {
  if (!viewEntity.value?.id || !contact.id) return

  const result = await Swal.fire({
    title: 'Remove Contact?',
    text: `Remove "${contact.contact}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    confirmButtonColor: '#dc3545'
  })

  if (!result.isConfirmed) return

  try {
    await entityService.removeContact(viewEntity.value.id, contact.id)
    await fetchEntityDetails(viewEntity.value.id)
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Contact removed', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove contact' })
  }
}

// Identity management
const addIdentityToView = () => {
  newIdentity.identity_type_id = identityTypes.value[0]?.id || 1
  newIdentity.identity_number = ''
  newIdentity.issued_date = ''
  newIdentity.is_active = true
  newIdentity.dates.expire_date = ''
  showAddIdentity.value = true
}

const saveNewIdentity = async () => {
  if (!viewEntity.value?.id || !newIdentity.identity_number) return

  savingIdentity.value = true
  try {
    await entityService.addIdentity(viewEntity.value.id, {
      identity_type_id: newIdentity.identity_type_id,
      identity_number: newIdentity.identity_number,
      issued_date: newIdentity.issued_date || undefined,
      is_active: newIdentity.is_active,
      dates: newIdentity.dates.expire_date ? { expire_date: newIdentity.dates.expire_date } : undefined
    })
    await fetchEntityDetails(viewEntity.value.id)
    showAddIdentity.value = false
    Swal.fire({ icon: 'success', title: 'Added', text: 'Identity added successfully', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to add identity' })
  } finally {
    savingIdentity.value = false
  }
}

const removeIdentityFromView = async (identity: Identity) => {
  if (!viewEntity.value?.id || !identity.id) return

  const result = await Swal.fire({
    title: 'Remove Identity?',
    text: `Remove "${identity.identity_number}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    confirmButtonColor: '#dc3545'
  })

  if (!result.isConfirmed) return

  try {
    await entityService.removeIdentity(viewEntity.value.id, identity.id)
    await fetchEntityDetails(viewEntity.value.id)
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Identity removed', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove identity' })
  }
}

// Category management
const openAssignCategoryModal = () => {
  assignCategoryForm.category_id = null
  assignCategoryForm.effective_from = ''
  assignCategoryForm.effective_to = ''
  assignCategoryForm.code = ''
  assignCategoryForm.is_active = true
  assignCategoryModalRef.value?.show()
}

const closeAssignCategoryModal = () => {
  assignCategoryModalRef.value?.hide()
}

const assignCategory = async () => {
  if (!viewEntity.value?.id || !assignCategoryForm.category_id) {
    Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please select a category' })
    return
  }

  assigningCategory.value = true
  try {
    await entityService.addCategory(viewEntity.value.id, {
      category_id: assignCategoryForm.category_id.id,
      effective_from: assignCategoryForm.effective_from || undefined,
      effective_to: assignCategoryForm.effective_to || undefined,
      code: assignCategoryForm.code || undefined,
      is_active: assignCategoryForm.is_active
    })
    await fetchEntityDetails(viewEntity.value.id)
    closeAssignCategoryModal()
    Swal.fire({ icon: 'success', title: 'Assigned', text: 'Category assigned successfully', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to assign category' })
  } finally {
    assigningCategory.value = false
  }
}

const removeCategoryFromView = async (category: Category) => {
  if (!viewEntity.value?.id) return

  const result = await Swal.fire({
    title: 'Remove Category?',
    text: `Remove "${category.display_name || category.name}" from this entity?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    confirmButtonColor: '#dc3545'
  })

  if (!result.isConfirmed) return

  try {
    await entityService.removeCategory(viewEntity.value.id, category.id)
    await fetchEntityDetails(viewEntity.value.id)
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Category removed', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove category' })
  }
}

// Status management
const openStatusModal = (entity: Entity) => {
  statusEntity.value = entity
  newStatus.value = entity.status
  statusModalRef.value?.show()
}

const closeStatusModal = () => {
  statusModalRef.value?.hide()
  resetStatusModalState()
}

const updateEntityStatus = async () => {
  if (!statusEntity.value?.id) return

  changingStatus.value = true
  try {
    await entityService.updateStatus(statusEntity.value.id, newStatus.value)
    await fetchEntities()
    closeStatusModal()
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Status updated successfully', timer: 1500 })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to update status' })
  } finally {
    changingStatus.value = false
  }
}

// Category management functions
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const params: any = {}
    if (categoryTableFilters.value.search) params.search = categoryTableFilters.value.search
    if (categoryTableFilters.value.keyword) params.keyword = categoryTableFilters.value.keyword

    const response = await entityService.getCategories()
    const data = response.data || []
    categoryList.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load categories' })
  } finally {
    loadingCategories.value = false
  }
}

const handleCategoryFiltersUpdate = (filters: any) => {
  categoryTableFilters.value = { ...categoryTableFilters.value, ...filters }
  fetchCategories()
}

const toggleExpandCategory = (categoryId: number) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
  expandedCategories.value = new Set(expandedCategories.value)
}

const getCategoryPath = (category: any): string => {
  const path: string[] = []
  let current = category
  while (current?.parent_id) {
    const parent = categoryList.value.find((c: any) => c.id === current.parent_id)
    if (parent) {
      path.unshift(parent.display_name || parent.name)
      current = parent
    } else {
      break
    }
  }
  return path.join(' > ')
}

const getCategoryLabel = (cat: any) => {
  if (!cat) return ''
  return cat.display_name || cat.name || ''
}

const isDescendantOf = (categoryId: number, ancestorId: number): boolean => {
  const category = categoryList.value.find((c: any) => c.id === categoryId)
  if (!category || !category.parent_id) return false
  if (category.parent_id === ancestorId) return true
  return isDescendantOf(category.parent_id, ancestorId)
}

const openCategoryEditModal = (category?: any) => {
  editingCategory.value = category || null
  categoryForm.name = category?.name || ''
  categoryForm.display_name = category?.display_name || ''
  categoryForm.category_code = category?.category_code || ''
  categoryForm.keyword = category?.keyword || ''
  categoryForm.parent_id = category?.parent_id || null
  
  if (category?.parent_id) {
    selectedParentCategory.value = categoryList.value.find((c: any) => c.id === category.parent_id) || null
  } else {
    selectedParentCategory.value = null
  }
  
  categoryModalRef.value?.show()
}

const openSubcategoryModal = (parentCategory: any) => {
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.display_name = ''
  categoryForm.category_code = ''
  categoryForm.keyword = parentCategory.keyword || ''
  categoryForm.parent_id = parentCategory.id
  selectedParentCategory.value = parentCategory
  categoryModalRef.value?.show()
}

const closeCategoryEditModal = () => {
  categoryModalRef.value?.hide()
  resetCategoryEditState()
}

const onParentSelect = (selected: any) => {
  categoryForm.parent_id = selected?.id || null
}

const onParentRemove = () => {
  categoryForm.parent_id = null
  selectedParentCategory.value = null
}

const saveCategory = async () => {
  savingCategory.value = true
  try {
    const payload = {
      name: categoryForm.name,
      display_name: categoryForm.display_name,
      category_code: categoryForm.category_code,
      keyword: categoryForm.keyword,
      parent_id: categoryForm.parent_id || null
    }

    const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }

    if (editingCategory.value?.id) {
      await axios.put(`${apiBaseUrl}categories/${editingCategory.value.id}`, payload, { headers })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Category updated successfully', timer: 1500 })
    } else {
      await axios.post(`${apiBaseUrl}categories`, payload, { headers })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Category created successfully', timer: 1500 })
    }

    closeCategoryEditModal()
    await fetchCategories()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save category' })
  } finally {
    savingCategory.value = false
  }
}

const confirmDeleteCategory = async (category: any) => {
  const result = await Swal.fire({
    title: 'Delete Category?',
    text: `This will delete ${category.display_name || category.name}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc3545'
  })

  if (!result.isConfirmed) return

  try {
    const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
    
    await axios.delete(`${apiBaseUrl}categories/${category.id}`, { headers })
    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Category deleted successfully', timer: 1500 })
    await fetchCategories()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to delete category' })
  }
}

const openCategoryViewModal = (category: any) => {
  viewCategory.value = category
  categoryViewModalRef.value?.show()
}

const closeCategoryViewModal = () => {
  categoryViewModalRef.value?.hide()
  resetCategoryViewState()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchMetadata(), fetchParentEntities(), fetchCategories()])
  await fetchEntities()
})
</script>

<style scoped>
.entity-management-page .panel {
  border-radius: 12px;
}

.entity-management-page .custom-table {
  border-radius: 12px;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.offcanvas {
  z-index: 1055;
}

.cursor-pointer {
  cursor: pointer;
}

:deep(.entity-modal .modal-content) {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

:deep(.modal-header--accent) {
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
  border-bottom: 1px solid #e2e8f0;
}

:deep(.modal-header--accent .modal-title) {
  font-weight: 700;
  letter-spacing: 0.2px;
}

:deep(.modal-body--form) {
  background: #f8fafc;
}

:deep(.modal-footer--form) {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-form-section,
.modal-info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.modal-subtitle {
  margin-top: -6px;
  margin-bottom: 16px;
}

.modal-tabs .nav-link {
  border: 0;
  border-bottom: 2px solid transparent;
  color: #64748b;
}

.modal-tabs .nav-link.active {
  color: #0f172a;
  border-bottom-color: #3b82f6;
  background: transparent;
}

.form-hint {
  display: block;
  color: #64748b;
  margin-top: 0.25rem;
}

.modal-form .form-label {
  color: #475569;
  font-weight: 600;
}

.modal-form .form-control,
.modal-form .form-select {
  border-color: #d6dde7;
  border-radius: 10px;
}

.modal-form .form-control:focus,
.modal-form .form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.15);
}

:deep(.modal-form .multiselect__tags) {
  border-color: #d6dde7;
  border-radius: 10px;
  min-height: 38px;
  padding-top: 6px;
}

:deep(.modal-form .multiselect__single) {
  color: #0f172a;
}
</style>
