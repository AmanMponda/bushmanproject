<template>
  <div class="inspection-templates-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="javascript:;">Inspections</a></li>
        <li class="breadcrumb-item active">Inspection Templates</li>
      </ul>
    </div>

    <!-- ==================== LIST VIEW ==================== -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded mt-2">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="templates"
                :loading="isLoading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :selected-ids="selectedIds"
                @toggle-select-all="toggleSelectAll"
              >
                <!-- @vue-ignore -->
                <template #select="{ row }">
                  <input type="checkbox" class="form-check-input" style="width: 15px; height: 15px;" :checked="selectedIds.includes(row.id)" @change="toggleRowSelect(row.id)" />
                </template>

                <!-- @vue-ignore -->
                <template #status="{ row }">
                  <span :class="getStatusBadgeClass(row.status)">
                    {{ row.status }}
                  </span>
                </template>

                <!-- @vue-ignore -->
                <template #is_active="{ row }">
                  <span :class="row.is_active ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ row.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </template>

                <!-- @vue-ignore -->
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button
                      v-if="row.status === 'draft'"
                      class="btn btn-info btn-sm"
                      @click="editTemplate(row)"
                      title="Edit"
                    >
                      <i class="fa fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-primary btn-sm"
                      @click="viewTemplate(row)"
                      title="View"
                    >
                      <i class="fa fa-eye"></i>
                    </button>
                    <button
                      class="btn btn-secondary btn-sm"
                      @click="handleDownloadPdf(row)"
                      title="Download PDF"
                    >
                      <i class="fa fa-file-pdf"></i>
                    </button>
                    <button
                      v-if="row.status === 'draft'"
                      class="btn btn-success btn-sm"
                      @click="confirmPublish(row)"
                      title="Publish"
                    >
                      <i class="fa fa-check-circle"></i>
                    </button>
                    <button
                      v-if="row.status === 'published'"
                      class="btn btn-warning btn-sm"
                      @click="confirmRetire(row)"
                      title="Retire"
                    >
                      <i class="fa fa-archive"></i>
                    </button>
                    <button
                      v-if="row.status === 'draft'"
                      class="btn btn-danger btn-sm"
                      @click="confirmDelete(row)"
                      title="Delete"
                    >
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== READ-ONLY VIEW ==================== -->
    <template v-else-if="viewMode">
      <div class="card border-0 shadow-sm">
        <!-- Card Header: Title + Status + Buttons -->
        <div class="card-header d-flex align-items-center bg-white border-bottom" style="padding: 16px 20px;">
          <div class="d-flex align-items-center">
            <div class="me-3">
              <i class="fa fa-clipboard-check fa-2x text-primary"></i>
            </div>
            <div>
              <h4 class="mb-0 fw-bold">{{ form.name }}</h4>
              <small class="text-muted">
                Version {{ form.version_number }} &bull;
                <span :class="getStatusBadgeClass(form.status)">{{ form.status }}</span>
                &bull;
                <span :class="form.is_active ? 'badge bg-success' : 'badge bg-secondary'">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
              </small>
            </div>
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
            <button class="btn btn-secondary btn-sm" @click="handleDownloadPdf(form)">
              <i class="fa fa-file-pdf me-1"></i> Download PDF
            </button>
            <button v-if="form.status === 'draft'" class="btn btn-primary btn-sm" @click="viewMode = false">
              <i class="fa fa-edit me-1"></i> Edit
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="goBack">
              <i class="fa fa-arrow-left me-1"></i> Back
            </button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="view-tab-bar">
          <button
            class="view-tab"
            :class="{ active: activeViewTab === 'overview' }"
            @click="activeViewTab = 'overview'"
          >
            <i class="fa fa-info-circle me-1"></i>
            Overview
          </button>
          <button
            class="view-tab"
            :class="{ active: activeViewTab === 'checklist' }"
            @click="activeViewTab = 'checklist'"
          >
            <i class="fa fa-list-check me-1"></i>
            Checklist Parameters
            <span class="badge bg-primary ms-1" style="font-size: 10px;">{{ parameters.length }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="card-body p-4">
          <!-- ===== OVERVIEW TAB ===== -->
          <div v-show="activeViewTab === 'overview'">
            <div class="row g-4">
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase" style="letter-spacing: 0.5px;">Template Name</label>
                <div class="fw-semibold" style="font-size: 15px;">{{ form.name || '-' }}</div>
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase" style="letter-spacing: 0.5px;">Version</label>
                <div class="fw-semibold" style="font-size: 15px;">{{ form.version_number }}</div>
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase" style="letter-spacing: 0.5px;">Site</label>
                <div class="fw-semibold" style="font-size: 15px;">{{ form.site?.name || 'All Sites' }}</div>
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase" style="letter-spacing: 0.5px;">Status</label>
                <div>
                  <span :class="getStatusBadgeClass(form.status)">{{ form.status }}</span>
                  <span :class="form.is_active ? 'badge bg-success ms-1' : 'badge bg-secondary ms-1'">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
                </div>
              </div>
            </div>

            <div class="row mt-4" v-if="form.description">
              <div class="col-md-12">
                <label class="form-label text-muted small text-uppercase" style="letter-spacing: 0.5px;">Description</label>
                <div class="fw-semibold" style="font-size: 15px;">{{ form.description }}</div>
              </div>
            </div>

            <!-- Summary Stats -->
            <hr class="my-4" />
            <div class="row g-3">
              <div class="col-md-3">
                <div class="p-3 rounded" style="background: #eff6ff; border: 1px solid #dbeafe;">
                  <div class="text-muted small text-uppercase mb-1" style="letter-spacing: 0.5px;">Total Parameters</div>
                  <div class="fw-bold" style="font-size: 24px; color: #2563eb;">{{ parameters.length }}</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="p-3 rounded" style="background: #fef2f2; border: 1px solid #fecaca;">
                  <div class="text-muted small text-uppercase mb-1" style="letter-spacing: 0.5px;">Required</div>
                  <div class="fw-bold" style="font-size: 24px; color: #dc2626;">{{ parameters.filter(p => p.required).length }}</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="p-3 rounded" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
                  <div class="text-muted small text-uppercase mb-1" style="letter-spacing: 0.5px;">Optional</div>
                  <div class="fw-bold" style="font-size: 24px; color: #16a34a;">{{ parameters.filter(p => !p.required).length }}</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="p-3 rounded" style="background: #fefce8; border: 1px solid #fef08a;">
                  <div class="text-muted small text-uppercase mb-1" style="letter-spacing: 0.5px;">Sections</div>
                  <div class="fw-bold" style="font-size: 24px; color: #ca8a04;">{{ Object.keys(groupedParameters).length }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== CHECKLIST PARAMETERS TAB ===== -->
          <div v-show="activeViewTab === 'checklist'">
            <div v-if="parameters.length === 0" class="text-center py-5 text-muted">
              <i class="fa fa-clipboard-list fa-3x mb-3 d-block" style="color: #cbd5e1;"></i>
              <p class="mb-0" style="font-size: 15px;">No parameters assigned to this template</p>
            </div>

            <template v-else>
              <!-- Grouped by Section -->
              <div v-for="(params, section) in groupedParameters" :key="section" class="mb-4">
                <div class="d-flex align-items-center gap-2 mb-2 pb-2" style="border-bottom: 2px solid #e2e8f0;">
                  <i class="fa fa-folder-open" style="color: #2563eb;"></i>
                  <h6 class="mb-0 fw-bold text-uppercase" style="letter-spacing: 0.5px; color: #0f172a;">{{ section }}</h6>
                  <span class="badge bg-secondary ms-1" style="font-size: 10px;">{{ params.length }}</span>
                </div>
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0">
                    <thead>
                      <tr style="background: #f8fafc;">
                        <th style="width: 50px;" class="text-muted small">#</th>
                        <th class="text-muted small">Parameter</th>
                        <th class="text-muted small text-center" style="width: 120px;">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(param, idx) in params" :key="param.id || idx">
                        <td class="text-muted">{{ param.position || idx + 1 }}</td>
                        <td class="fw-semibold">{{ getParameterName(param) }}</td>
                        <td class="text-center">
                          <span v-if="param.required" class="badge" style="background: #fef2f2; color: #ef4444; font-weight: 600;">Required</span>
                          <span v-else class="badge" style="background: #f1f5f9; color: #94a3b8; font-weight: 500;">Optional</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== CREATE / EDIT FORM (Two-Panel Grid Layout) ==================== -->
    <template v-else>
      <!-- PAGE HEADER BAR (like Order page) -->
      <div class="t-page-head">
        <div>
          <h3 class="mb-0 fw-bold" style="font-size: 18px; color: #0f172a;">
            {{ editMode ? 'Edit Template' : 'Create Template' }}
          </h3>
          <p class="mb-0" style="font-size: 12px; color: #64748b;">Configure your inspection template with parameters and checklist</p>
        </div>
        <div class="d-flex gap-2 ms-auto align-items-center">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="goBack">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
          <button v-if="isDraft" type="button" class="btn btn-primary btn-sm" @click="onSubmit" :disabled="saving || !isFormValid">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="fa fa-save me-1"></i> Save
          </button>
        </div>
      </div>

      <section class="template-grid">
        <!-- ========== LEFT PANEL: Template Details ========== -->
        <aside class="t-panel left-panel">
          <div class="t-panel-header">
            <div class="t-panel-icon">📋</div>
            <div class="t-panel-title-text">
              <h3>Template Details</h3>
              <p>Fill in the inspection template information</p>
            </div>
          </div>

          <div class="t-panel-body">
            <!-- TEMPLATE INFO SECTION -->
            <div class="t-form-section">
              <div class="t-section-title">
                <span class="t-section-icon">📝</span>
                Template Info
              </div>

              <div class="mb-3">
                <label class="form-label">Template Name <span class="text-danger">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="e.g., Safari Vehicle Pre-Trip Inspection"
                  :disabled="!isDraft"
                  required
                />
              </div>

              <div class="row g-2">
                <div class="col-6 mb-3">
                  <label class="form-label">Version</label>
                  <input
                    v-model.number="form.version_number"
                    type="number"
                    class="form-control"
                    min="1"
                    :disabled="!isDraft"
                  />
                </div>
                <div class="col-6 mb-3">
                  <label class="form-label">Site</label>
                  <Multiselect
                    v-model="form.site"
                    :options="sites"
                    label="name"
                    track-by="id"
                    placeholder="All Sites"
                    :searchable="true"
                    :allowEmpty="true"
                    :disabled="!isDraft"
                  />
                </div>
              </div>

              <div class="mb-2">
                <label class="form-label">Description</label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="2"
                  placeholder="Describe the purpose of this inspection template..."
                  :disabled="!isDraft"
                ></textarea>
              </div>
            </div>

            <!-- STATUS SECTION -->
            <div class="t-form-section">
              <div class="t-section-title">
                <span class="t-section-icon">⚙️</span>
                Status & Settings
              </div>

              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="form-check form-switch">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="form-check-input template-switch"
                    id="templateActive"
                    role="switch"
                    :disabled="!isDraft"
                  />
                  <label class="form-check-label" for="templateActive">
                    <span :class="form.is_active ? 'text-success fw-bold' : 'text-secondary'">
                      {{ form.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </label>
                </div>
                <div v-if="editMode">
                  <span :class="getStatusBadgeClass(form.status)" style="font-size: 0.85rem;">{{ form.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- ========== RIGHT PANEL: Configuration with Tabs ========== -->
        <aside class="t-panel right-panel">
          <div class="t-panel-header">
            <div class="t-panel-icon">📑</div>
            <div class="t-panel-title-text">
              <h3>Template Configuration</h3>
              <p>Set up parameters and preview the checklist</p>
            </div>

          </div>

          <!-- TAB BUTTONS (like Order page: Items & Parties, Logistics, etc.) -->
          <div class="t-tab-bar">
            <button
              class="t-tab-btn"
              :class="{ active: activeConfigTab === 'parameters' }"
              @click="activeConfigTab = 'parameters'"
            >
              <span class="t-tab-icon">📋</span>
              Parameters
              <span class="badge bg-primary ms-1" style="font-size: 10px;">{{ parameters.length }}</span>
            </button>
            <button
              class="t-tab-btn"
              :class="{ active: activeConfigTab === 'preview' }"
              @click="activeConfigTab = 'preview'"
            >
              <span class="t-tab-icon">👁️</span>
              Checklist Preview
            </button>
          </div>

          <div class="t-panel-body">
            <!-- ===== PARAMETERS TAB ===== -->
            <div v-show="activeConfigTab === 'parameters'">
              <!-- Inline error -->
              <div v-if="paramError" class="alert alert-danger py-1 px-2 mb-2" style="font-size: 0.85rem;">{{ paramError }}</div>

              <!-- Search bar -->
              <div class="mb-2">
                <div class="input-group input-group-sm">
                  <span class="input-group-text" style="background: #f8fafc; border-color: #e2e8f0;">
                    <i class="fa fa-search" style="color: #94a3b8;"></i>
                  </span>
                  <input
                    v-model="paramSearchQuery"
                    type="text"
                    class="form-control"
                    placeholder="Search categories or parameters..."
                    style="border-color: #e2e8f0;"
                  />
                  <span v-if="paramSearchQuery" class="input-group-text" style="cursor: pointer; background: #f8fafc; border-color: #e2e8f0;" @click="paramSearchQuery = ''">
                    <i class="fa fa-times" style="color: #94a3b8;"></i>
                  </span>
                </div>
              </div>

              <!-- Toolbar: Expand/Collapse, Select/Deselect, Filter -->
              <div class="param-toolbar d-flex align-items-center flex-wrap gap-1 mb-2">
                <button class="btn btn-outline-secondary btn-xs" @click="expandAllCategories" title="Expand All">
                  <i class="fa fa-expand-arrows-alt"></i>
                </button>
                <button class="btn btn-outline-secondary btn-xs" @click="collapseAllCategories" title="Collapse All">
                  <i class="fa fa-compress-arrows-alt"></i>
                </button>
                <span class="vr mx-1" style="height: 20px;"></span>
                <button v-if="isDraft" class="btn btn-outline-primary btn-xs" @click="selectAllFiltered" title="Select All Visible">
                  <i class="fa fa-check-double me-1"></i>All
                </button>
                <button v-if="isDraft && getTotalSelectedCount() > 0" class="btn btn-outline-danger btn-xs" @click="deselectAllFiltered" title="Deselect All Visible">
                  <i class="fa fa-times me-1"></i>None
                </button>
                <span class="ms-auto"></span>
                <button
                  class="btn btn-xs"
                  :class="showSelectedOnly ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="showSelectedOnly = !showSelectedOnly"
                  title="Show selected only"
                >
                  <i class="fa fa-filter me-1"></i>Selected
                </button>
              </div>

              <!-- Progress bar -->
              <div v-if="getTotalAvailableInLoadedCategories() > 0" class="mb-2">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <small style="font-size: 11px; color: #64748b;">
                    <strong>{{ getTotalSelectedCount() }}</strong> / {{ getTotalAvailableInLoadedCategories() }} selected
                  </small>
                  <small style="font-size: 11px; color: #64748b;">{{ filteredCategories.length }} categories</small>
                </div>
                <div class="progress" style="height: 4px; border-radius: 4px;">
                  <div class="progress-bar bg-primary" :style="{ width: paramProgressPercent + '%' }"></div>
                </div>
              </div>

              <!-- Loading categories -->
              <div v-if="loadingCategories" class="text-center py-4">
                <span class="spinner-border spinner-border-sm text-primary me-2"></span>
                <span class="text-muted">Loading categories...</span>
              </div>

              <!-- Categories accordion (scrollable) -->
              <div v-else-if="visibleCategories.length > 0" class="param-categories-scroll">

                <div
                  v-for="cat in visibleCategories"
                  :key="cat.id"
                  class="param-category-group mb-2"
                >
                  <!-- Category Header (click to expand/collapse & lazy-load) -->
                  <div
                    class="param-category-header d-flex align-items-center gap-2 px-3 py-2"
                    @click="toggleCategoryExpand(cat.id)"
                    style="cursor: pointer;"
                  >
                    <i
                      class="fa"
                      :class="isCategoryExpanded(cat.id) ? 'fa-chevron-down' : 'fa-chevron-right'"
                      style="font-size: 10px; color: #64748b; width: 12px;"
                    ></i>
                    <input
                      v-if="isDraft && categoryParameters[cat.id]"
                      type="checkbox"
                      class="form-check-input"
                      :checked="isCategoryFullySelected(categoryParameters[cat.id])"
                      :indeterminate="isCategoryPartiallySelected(categoryParameters[cat.id])"
                      @click.stop
                      @change="toggleCategory(categoryParameters[cat.id], $event)"
                      style="cursor: pointer; width: 16px; height: 16px;"
                    />
                    <i class="fa fa-folder" style="color: #2563eb; font-size: 13px;"></i>
                    <span style="font-weight: 600; font-size: 13px; color: #0f172a;">{{ cat.name }}</span>
                    <span v-if="categoryParameters[cat.id]" class="badge ms-1" style="font-size: 10px;"
                      :class="getSelectedCountInCategory(categoryParameters[cat.id]) === categoryParameters[cat.id].length && categoryParameters[cat.id].length > 0
                        ? 'bg-success' : getSelectedCountInCategory(categoryParameters[cat.id]) > 0 ? 'bg-primary' : 'bg-secondary'">
                      {{ getSelectedCountInCategory(categoryParameters[cat.id]) }}/{{ categoryParameters[cat.id].length }}
                    </span>
                    <!-- Loading spinner for this category -->
                    <span v-if="loadingCategoryId === cat.id" class="ms-auto">
                      <span class="spinner-border spinner-border-sm text-primary" style="width: 14px; height: 14px;"></span>
                    </span>
                  </div>

                  <!-- Parameter checkboxes (shown when expanded) -->
                  <div v-if="isCategoryExpanded(cat.id)" class="param-items-list">
                    <!-- Loading state for this category's parameters -->
                    <div v-if="loadingCategoryId === cat.id && !categoryParameters[cat.id]" class="text-center py-3">
                      <span class="spinner-border spinner-border-sm text-primary me-1"></span>
                      <small class="text-muted">Loading parameters...</small>
                    </div>
                    <!-- Parameters loaded -->
                    <template v-else-if="categoryParameters[cat.id]">
                      <div
                        v-for="mp in getCategoryFilteredParams(cat.id)"
                        :key="mp.id"
                        class="param-item px-3 py-2"
                        :class="{ 'param-item-selected': isParameterSelected(mp.id) }"
                      >
                        <!-- Row 1: Checkbox + Name -->
                        <div class="d-flex align-items-center gap-2">
                          <input
                            v-if="isDraft"
                            type="checkbox"
                            class="form-check-input"
                            :checked="isParameterSelected(mp.id)"
                            @change="toggleParameter(mp)"
                            style="cursor: pointer; width: 15px; height: 15px;"
                          />
                          <i v-else :class="isParameterSelected(mp.id) ? 'fa fa-check-circle text-success' : 'fa fa-circle'" style="font-size: 12px; color: #cbd5e1;"></i>
                          <span style="font-size: 13px; color: #334155; flex: 1;">{{ mp.name }}</span>
                          <span v-if="mp.unit_of_measurement" class="badge" style="background: #f1f5f9; color: #64748b; font-size: 10px;">{{ mp.unit_of_measurement?.abbreviation || mp.unit_of_measurement }}</span>
                        </div>
                        <!-- Row 2: Inline config (only when selected & draft) -->
                        <div
                          v-if="isParameterSelected(mp.id) && isDraft"
                          class="param-inline-config d-flex align-items-center gap-3 mt-1 ps-4"
                        >
                          <div class="d-flex align-items-center gap-1" style="flex: 1; min-width: 0;">
                            <label style="font-size: 10px; color: #64748b; white-space: nowrap;">Section</label>
                            <Multiselect
                              :modelValue="getSelectedParamEntry(mp.id)?.section || ''"
                              :options="existingSections"
                              placeholder="Section..."
                              :searchable="true"
                              :taggable="true"
                              tag-placeholder="Create"
                              @select="(val: string) => updateParamField(getSelectedParamEntry(mp.id), 'section', val)"
                              @tag="(val: string) => updateParamField(getSelectedParamEntry(mp.id), 'section', val)"
                              class="inline-param-select"
                              style="min-width: 100px; font-size: 12px;"
                            />
                          </div>
                          <div class="d-flex align-items-center gap-1">
                            <label style="font-size: 10px; color: #64748b; white-space: nowrap;">Req</label>
                            <input
                              type="checkbox"
                              class="form-check-input"
                              :checked="getSelectedParamEntry(mp.id)?.required"
                              @change="updateParamField(getSelectedParamEntry(mp.id), 'required', !getSelectedParamEntry(mp.id)?.required)"
                              style="cursor: pointer; width: 14px; height: 14px;"
                            />
                          </div>
                          <div class="d-flex align-items-center gap-1">
                            <label style="font-size: 10px; color: #64748b; white-space: nowrap;">Pos</label>
                            <input
                              :value="getSelectedParamEntry(mp.id)?.position"
                              type="number"
                              class="form-control form-control-sm text-center"
                              min="1"
                              style="width: 45px; font-size: 11px;"
                              @change="updateParamField(getSelectedParamEntry(mp.id), 'position', parseInt(($event.target as HTMLInputElement).value))"
                            />
                          </div>
                        </div>
                      </div>
                      <!-- No results within this category after search filter -->
                      <div v-if="getCategoryFilteredParams(cat.id).length === 0" class="text-center py-2">
                        <small class="text-muted">No parameters match the search</small>
                      </div>
                      <!-- Select/Deselect all in this category -->
                      <div v-if="isDraft && getCategoryFilteredParams(cat.id).length > 0" class="d-flex justify-content-end gap-2 px-3 py-2" style="background: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <button class="btn btn-outline-primary btn-sm" style="font-size: 10px; padding: 1px 6px;"
                          @click.stop="toggleCategory(getCategoryFilteredParams(cat.id), { target: { checked: true } } as any)">
                          <i class="fa fa-check-double me-1"></i> Select All
                        </button>
                        <button v-if="getSelectedCountInCategory(getCategoryFilteredParams(cat.id)) > 0"
                          class="btn btn-outline-danger btn-sm" style="font-size: 10px; padding: 1px 6px;"
                          @click.stop="toggleCategory(getCategoryFilteredParams(cat.id), { target: { checked: false } } as any)">
                          <i class="fa fa-times me-1"></i> Deselect All
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- No categories available -->
              <div v-else class="text-center py-4" style="color: #94a3b8;">
                <i class="fa fa-clipboard-list fa-2x mb-2 d-block"></i>
                <p v-if="paramSearchQuery">No categories match "<strong>{{ paramSearchQuery }}</strong>"</p>
                <p v-else-if="showSelectedOnly">No categories with selected parameters. <a href="#" @click.prevent="showSelectedOnly = false">Show all</a></p>
                <p v-else>No maintenance categories available. Create them in Settings first.</p>
              </div>

            </div>

            <!-- ===== CHECKLIST PREVIEW TAB ===== -->
            <div v-show="activeConfigTab === 'preview'">
              <div class="t-section-title">
                <span class="t-section-icon">👁️</span>
                Checklist Preview
              </div>

              <!-- Empty preview state -->
              <div v-if="parameters.length === 0" class="text-center py-3" style="color: #94a3b8;">
                <i class="fa fa-eye-slash fa-2x mb-2 d-block"></i>
                <p class="mb-0" style="font-size: 0.85rem;">Add parameters above to see the checklist preview</p>
              </div>

              <!-- Preview content -->
              <template v-else>
              <div v-for="(params, section) in groupedParameters" :key="section" class="t-subsection-group">
                <h5>
                  <i class="fa fa-folder-open" style="color: #2563eb;"></i>
                  {{ section }}
                  <span class="badge bg-secondary ms-auto" style="font-size: 10px;">{{ params.length }}</span>
                </h5>
                <div class="list-group list-group-flush">
                  <div
                    v-for="(param, idx) in params"
                    :key="param.id || param._localId || idx"
                    class="list-group-item d-flex align-items-center gap-2 px-0 py-2"
                    style="border-color: #f1f5f9; font-size: 0.9rem;"
                  >
                    <span style="color: #94a3b8; font-weight: 600; min-width: 24px;">{{ idx + 1 }}.</span>
                    <span class="flex-grow-1">{{ getParameterName(param) }}</span>
                    <span v-if="param.required" class="badge" style="background: #fef2f2; color: #ef4444; font-weight: 600; font-size: 10px;">Required</span>
                    <span v-else class="badge" style="background: #f1f5f9; color: #94a3b8; font-weight: 500; font-size: 10px;">Optional</span>
                  </div>
                </div>
              </div>
              </template>
            </div>
          </div>
        </aside>
      </section>
    </template>

    <!-- Bulk Parameter Modal -->
    <BulkParameterModal
      ref="bulkParameterModalRef"
      :existingSections="existingSections"
      :existingParameterCount="parameters.length"
      modalId="bulkParameterModal"
      @submit="handleBulkParameterSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAppOptionStore } from '@/stores/app-option'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { Modal } from 'bootstrap'
import StandardDataTable from '@/components/plugins/StandardDataTable.vue'
import BulkParameterModal from './components/BulkParameterModal.vue'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'

const { showAlert } = useNotification()
const appOption = useAppOptionStore()

// ==================== State ====================
const templates = ref<any[]>([])
const selectedIds = ref<number[]>([])
const isLoading = ref(false)
const saving = ref(false)
const showList = ref(true)
const editMode = ref(false)
const viewMode = ref(false)
const activeConfigTab = ref<'parameters' | 'preview'>('parameters')
const activeViewTab = ref<'overview' | 'checklist'>('overview')

// Template form
const form = reactive({
  id: null as number | null,
  name: '',
  description: '',
  version_number: 1,
  status: 'draft',
  is_active: true,
  site: null as any,
  site_id: null as number | null
})

const sites = ref<any[]>([])

// Parameters
const parameters = ref<any[]>([])
const availableParameters = ref<any[]>([])
const loadingParams = ref(false)
const savingParam = ref(false)
const editingParameterId = ref<number | null>(null)
const editingLocalId = ref<number | null>(null)
const paramError = ref('')
const showNewSection = ref(false)
const newSectionName = ref('')
const showParamRow = ref(false)
const bulkParameterModalRef = ref<InstanceType<typeof BulkParameterModal> | null>(null)
const allSections = ref<string[]>([])
const allMaintenanceParameters = ref<any[]>([])
const paramSearchQuery = ref('')
const showSelectedOnly = ref(false)

// Category-first lazy loading
const categories = ref<any[]>([])
const loadingCategories = ref(false)
const categoryParameters = ref<Record<number, any[]>>({})
const loadingCategoryId = ref<number | null>(null)
const expandedCategoryIds = ref<Set<number>>(new Set())
let localIdCounter = 0

const paramForm = reactive({
  maintenance_parameter: null as any,
  section: '' as string,
  position: 1,
  required: false
})

// ==================== Table Config ====================
const columns = ref([
  { key: 'select', label: '', sortable: false, visible: true },
  { key: 'name', label: 'Template Name', sortable: true, visible: true },
  { key: 'version_number', label: 'Version', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'is_active', label: 'Active', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

const pageActions = computed(() => [
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn btn-secondary',
    method: () => fetchTemplates()
  },
  {
    label: 'Add Template',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showCreateForm()
  }
])

// ==================== Computed ====================
const isFormValid = computed(() => (form.name || '').trim().length >= 2)

const isDraft = computed(() => form.status === 'draft')

const sortedParameters = computed(() => {
  return [...parameters.value].sort((a, b) => {
    const sectionA = (a.section || 'General').toLowerCase()
    const sectionB = (b.section || 'General').toLowerCase()
    if (sectionA !== sectionB) return sectionA.localeCompare(sectionB)
    return (a.position || 0) - (b.position || 0)
  })
})

const existingSections = computed(() => {
  const sections = new Set<string>()
  // Sections from current template parameters
  parameters.value.forEach(p => {
    if (p.section) sections.add(p.section)
  })
  // Sections loaded from all templates
  allSections.value.forEach(s => sections.add(s))
  return Array.from(sections).sort()
})

const groupedParameters = computed(() => {
  return sortedParameters.value.reduce((acc: Record<string, any[]>, param: any) => {
    const section = param.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(param)
    return acc
  }, {} as Record<string, any[]>)
})

// Categories filtered by search query (searches category names + loaded parameter names)
const filteredCategories = computed(() => {
  const query = paramSearchQuery.value.toLowerCase().trim()
  let cats = categories.value
  if (query) {
    cats = cats.filter(cat => {
      if (cat.name.toLowerCase().includes(query)) return true
      const params = categoryParameters.value[cat.id] || []
      return params.some((p: any) => p.name.toLowerCase().includes(query))
    })
  }
  if (showSelectedOnly.value) {
    cats = cats.filter(cat => {
      const params = categoryParameters.value[cat.id] || []
      return params.some((p: any) => isParameterSelected(p.id))
    })
  }
  return cats
})

// Visible categories (same as filtered — used for v-for)
const visibleCategories = computed(() => filteredCategories.value)

// Progress percentage
const paramProgressPercent = computed(() => {
  const total = getTotalAvailableInLoadedCategories()
  if (total === 0) return 0
  return Math.round((getTotalSelectedCount() / total) * 100)
})

// Parameters for a given category, filtered by search
function getCategoryFilteredParams(categoryId: number): any[] {
  const params = categoryParameters.value[categoryId] || []
  const query = paramSearchQuery.value.toLowerCase().trim()
  let filtered = params
  if (query) {
    filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(query))
  }
  if (showSelectedOnly.value) {
    filtered = filtered.filter((p: any) => isParameterSelected(p.id))
  }
  return filtered
}

// Set of selected maintenance parameter IDs for quick lookup
const selectedParamIds = computed(() => {
  return new Set(parameters.value.map(p => p.maintenance_parameter_id))
})

// ==================== Row Selection ====================
function toggleRowSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll(checked: boolean) {
  if (checked) {
    selectedIds.value = templates.value.map((t: any) => t.id)
  } else {
    selectedIds.value = []
  }
}

// ==================== Data Loading ====================
async function fetchTemplates() {
  isLoading.value = true
  try {
    const response = await inspectionService.listTemplates()
    templates.value = response.data.data || response.data || []
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load templates')
  } finally {
    isLoading.value = false
  }
}

async function loadAllSections() {
  try {
    const response = await inspectionService.listSections()
    allSections.value = response.data.data || response.data || []
  } catch (e) {
    console.error('Failed to load sections:', e)
  }
}

async function loadParameters() {
  if (!form.id) return
  try {
    const response = await inspectionService.listParameters(form.id)
    parameters.value = response.data.data || response.data || []
  } catch (error: any) {
    console.error('Failed to load parameters:', error)
  }
}

/**
 * Load a single template with its parameters in ONE call.
 * The backend show endpoint returns parameters already, so no separate call needed.
 */
async function loadTemplateDetail(id: number) {
  isLoading.value = true
  try {
    const response = await inspectionService.getTemplate(id)
    const data = response.data.data || response.data
    form.id = data.id
    form.name = data.name
    form.description = data.description || ''
    form.version_number = data.version_number || 1
    form.status = data.status || 'draft'
    form.is_active = data.is_active !== false
    form.site = data.site || null
    form.site_id = data.site_id || null
    parameters.value = data.parameters || []
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load template')
  } finally {
    isLoading.value = false
  }
}

async function loadAvailableParameters() {
  // Now loads categories only — parameters are fetched per-category on expand
  loadingCategories.value = true
  loadingParams.value = true
  try {
    const response = await inspectionService.listCategories()
    const all = response.data.data || response.data || []
    categories.value = all
    // Reset per-category caches
    categoryParameters.value = {}
    expandedCategoryIds.value = new Set()
  } catch {
    categories.value = []
  } finally {
    loadingCategories.value = false
    loadingParams.value = false
  }
}

async function loadCategoryParameters(categoryId: number) {
  if (categoryParameters.value[categoryId]) return // already loaded
  loadingCategoryId.value = categoryId
  try {
    const response = await inspectionService.listParametersByCategory(categoryId)
    const all = response.data.data || response.data || []
    const active = all.filter((p: any) => p.active === 1 || p.active === true)
    // Filter client-side in case backend doesn't support category_id filter
    const filtered = active.filter((p: any) => {
      const catId = p.category_id || p.category?.id || p.maintenance_category_id
      return catId === categoryId
    })
    categoryParameters.value[categoryId] = filtered.length > 0 ? filtered : active
  } catch {
    categoryParameters.value[categoryId] = []
  } finally {
    loadingCategoryId.value = null
  }
}

async function toggleCategoryExpand(categoryId: number) {
  if (expandedCategoryIds.value.has(categoryId)) {
    expandedCategoryIds.value.delete(categoryId)
    // Trigger reactivity
    expandedCategoryIds.value = new Set(expandedCategoryIds.value)
  } else {
    expandedCategoryIds.value.add(categoryId)
    expandedCategoryIds.value = new Set(expandedCategoryIds.value)
    // Lazy-load parameters for this category
    await loadCategoryParameters(categoryId)
  }
}

function isCategoryExpanded(categoryId: number): boolean {
  return expandedCategoryIds.value.has(categoryId)
}

async function expandAllCategories() {
  for (const cat of filteredCategories.value) {
    if (!expandedCategoryIds.value.has(cat.id)) {
      expandedCategoryIds.value.add(cat.id)
      await loadCategoryParameters(cat.id)
    }
  }
  expandedCategoryIds.value = new Set(expandedCategoryIds.value)
}

function collapseAllCategories() {
  expandedCategoryIds.value = new Set()
}

async function searchParameters(query: string) {
  if (!query || query.length < 1) return
  loadingParams.value = true
  try {
    const response = await inspectionService.listMaintenanceParameters({ search: query })
    const all = response.data.data || response.data || []
    availableParameters.value = all.filter((p: any) => p.active === 1 || p.active === true)
  } catch {
    availableParameters.value = []
  } finally {
    loadingParams.value = false
  }
}

// ==================== Form Actions ====================
function showCreateForm() {
  editMode.value = false
  resetForm()
  showList.value = false
  appOption.appSidebarMinified = true
  loadAvailableParameters()
  loadAllSections()
}

function editTemplate(row: any) {
  editMode.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.version_number = row.version_number || 1
  form.status = row.status || 'draft'
  form.is_active = row.is_active !== false
  form.site = row.site || null
  form.site_id = row.site_id || null
  showList.value = false
  appOption.appSidebarMinified = true
  loadParameters()
  loadAvailableParameters()
  loadAllSections()
}

function viewTemplate(row: any) {
  viewMode.value = true
  editMode.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.version_number = row.version_number || 1
  form.status = row.status || 'draft'
  form.is_active = row.is_active !== false
  form.site = row.site || null
  form.site_id = row.site_id || null
  showList.value = false
  appOption.appSidebarMinified = true
  loadParameters()
}

function goBack() {
  resetForm()
  viewMode.value = false
  activeViewTab.value = 'overview'
  showList.value = true
  appOption.appSidebarMinified = false
  fetchTemplates()
}

function resetForm() {
  form.id = null
  form.name = ''
  form.description = ''
  form.version_number = 1
  form.status = 'draft'
  form.is_active = true
  form.site = null
  form.site_id = null
  editMode.value = false
  activeConfigTab.value = 'parameters'
  parameters.value = []
  resetParamForm()
}

// ==================== Template CRUD ====================
async function onSubmit() {
  if (!isFormValid.value) {
    showAlert('warning', 'Please enter a valid template name (min 2 characters).')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      version_number: form.version_number,
      is_active: form.is_active,
      site_id: form.site?.id || null
    }

    if (editMode.value && form.id) {
      await inspectionService.updateTemplate(form.id, payload)
      showAlert('success', 'Template saved successfully')
      goBack()
    } else {
      const response = await inspectionService.createTemplate(payload)
      const newId = response.data.data?.id || response.data?.id
      if (newId) {
        // Save any locally-added parameters to the newly created template
        const localParams = parameters.value.filter(p => p._localId)
        if (localParams.length > 0) {
          for (const lp of localParams) {
            try {
              await inspectionService.addParameter(newId, {
                maintenance_parameter_id: lp.maintenance_parameter_id,
                section: lp.section || null,
                position: lp.position,
                required: lp.required
              })
            } catch (e: any) {
              console.error('Failed to save parameter:', e)
            }
          }
          showAlert('success', `Template saved with ${localParams.length} parameter(s)!`)
        } else {
          showAlert('success', 'Template saved successfully')
        }
      } else {
        showAlert('success', 'Template saved successfully')
      }
      goBack()
    }
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to save template')
  } finally {
    saving.value = false
  }
}

async function confirmPublish(row: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Publish Template?',
    text: 'Publishing will make this template read-only. It cannot be edited after publishing.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Publish',
    confirmButtonColor: '#28a745'
  })

  if (result.isConfirmed) {
    const id = row.id || form.id
    if (!id) return
    saving.value = true
    try {
      await inspectionService.publishTemplate(id)
      showAlert('success', 'Template published successfully')
      goBack()
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to publish template')
    } finally {
      saving.value = false
    }
  }
}

async function confirmRetire(row: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Retire Template?',
    text: `Are you sure you want to retire "${row.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Retire',
    confirmButtonColor: '#ffc107'
  })

  if (result.isConfirmed) {
    try {
      await inspectionService.retireTemplate(row.id)
      showAlert('success', 'Template retired successfully')
      fetchTemplates()
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to retire template')
    }
  }
}

async function confirmDelete(row: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const result = await Swal.fire({
    title: 'Delete Template?',
    text: `Delete "${row.name}"? This cannot be undone.`,
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    confirmButtonColor: '#dc3545'
  })

  if (result.isConfirmed) {
    try {
      await inspectionService.deleteTemplate(row.id)
      showAlert('success', 'Template deleted successfully')
      fetchTemplates()
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to delete template')
    }
  }
}

async function handleDownloadPdf(row: any) {
  const id = row.id || form.id
  if (!id) return
  try {
    showAlert('info', 'Generating PDF...')
    const response = await inspectionService.downloadPdf(id)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to download PDF')
  }
}

// ==================== Parameter Checklist Management ====================
function isParameterSelected(maintenanceParamId: number): boolean {
  return selectedParamIds.value.has(maintenanceParamId)
}

function isCategoryFullySelected(catParams: any[]): boolean {
  return catParams.every(mp => isParameterSelected(mp.id))
}

function isCategoryPartiallySelected(catParams: any[]): boolean {
  const count = catParams.filter(mp => isParameterSelected(mp.id)).length
  return count > 0 && count < catParams.length
}

function getSelectedCountInCategory(catParams: any[]): number {
  return catParams.filter(mp => isParameterSelected(mp.id)).length
}

function getTotalSelectedCount(): number {
  return parameters.value.length
}

function getTotalAvailableInLoadedCategories(): number {
  let count = 0
  for (const catId of Object.keys(categoryParameters.value)) {
    count += categoryParameters.value[Number(catId)]?.length || 0
  }
  return count
}

async function toggleParameter(mp: any) {
  if (isParameterSelected(mp.id)) {
    // Remove: find the parameter entry
    const existing = parameters.value.find(p => p.maintenance_parameter_id === mp.id)
    if (existing) {
      if (existing.id && form.id) {
        // Saved parameter — remove via API
        try {
          await inspectionService.removeParameter(form.id, existing.id)
          await loadParameters()
        } catch (error: any) {
          showAlert('error', error?.response?.data?.message || 'Failed to remove parameter')
          return
        }
      } else {
        // Local parameter — just remove from array
        parameters.value = parameters.value.filter(p => p.maintenance_parameter_id !== mp.id)
      }
    }
  } else {
    // Add parameter
    const position = parameters.value.length + 1
    if (form.id) {
      // Template saved — add via API
      savingParam.value = true
      try {
        await inspectionService.addParameter(form.id, {
          maintenance_parameter_id: mp.id,
          section: null,
          position,
          required: false
        })
        await loadParameters()
      } catch (error: any) {
        showAlert('error', error?.response?.data?.message || 'Failed to add parameter')
      } finally {
        savingParam.value = false
      }
    } else {
      // Template not yet saved — add locally
      localIdCounter++
      parameters.value.push({
        _localId: localIdCounter,
        maintenance_parameter_id: mp.id,
        maintenance_parameter: mp,
        section: null,
        position,
        required: false
      })
    }
  }
}

async function toggleCategory(catParams: any[], event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  for (const mp of catParams) {
    const isSelected = isParameterSelected(mp.id)
    if (checked && !isSelected) {
      await toggleParameter(mp)
    } else if (!checked && isSelected) {
      await toggleParameter(mp)
    }
  }
}

async function selectAllFiltered() {
  // Only select parameters in currently expanded + loaded categories
  for (const cat of filteredCategories.value) {
    const params = getCategoryFilteredParams(cat.id)
    for (const mp of params) {
      if (!isParameterSelected(mp.id)) {
        await toggleParameter(mp)
      }
    }
  }
}

async function deselectAllFiltered() {
  // Only deselect parameters in currently expanded + loaded categories
  for (const cat of filteredCategories.value) {
    const params = getCategoryFilteredParams(cat.id)
    for (const mp of params) {
      if (isParameterSelected(mp.id)) {
        await toggleParameter(mp)
      }
    }
  }
}

async function updateParamField(param: any, field: string, value: any) {
  // Update local state
  const idx = parameters.value.findIndex(p =>
    (p.id && p.id === param.id) || (p._localId && p._localId === param._localId)
  )
  if (idx !== -1) {
    (parameters.value[idx] as any)[field] = value
  }

  // If template is saved and param has API id, update via API
  if (form.id && param.id) {
    try {
      await inspectionService.updateParameter(form.id, param.id, {
        section: parameters.value[idx]?.section || null,
        position: parameters.value[idx]?.position,
        required: parameters.value[idx]?.required
      })
    } catch (error: any) {
      showAlert('error', error?.response?.data?.message || 'Failed to update parameter')
    }
  }
}

// ==================== Parameter Management (Legacy) ====================
function resetParamForm() {
  editingParameterId.value = null
  editingLocalId.value = null
  paramForm.maintenance_parameter = null
  paramForm.section = ''
  paramForm.position = 1
  paramForm.required = false
  paramError.value = ''
  showNewSection.value = false
  newSectionName.value = ''
}

function showInlineAddRow() {
  resetParamForm()
  paramForm.position = parameters.value.length + 1
  showParamRow.value = true
}

function editParamInline(param: any) {
  editingParameterId.value = param.id || null
  editingLocalId.value = param._localId || null
  paramForm.maintenance_parameter = param.maintenance_parameter || null
  paramForm.section = param.section || ''
  paramForm.position = param.position || 1
  paramForm.required = param.required || false
  paramError.value = ''
  showParamRow.value = true
}

function cancelParamRow() {
  resetParamForm()
  showParamRow.value = false
}

async function submitParameter() {
  paramError.value = ''

  if (!editingParameterId.value && !editingLocalId.value && !paramForm.maintenance_parameter) {
    paramError.value = 'Please select a maintenance parameter.'
    return
  }

  const section = showNewSection.value ? newSectionName.value : paramForm.section

  // If template is NOT yet saved — store locally
  if (!form.id) {
    if (editingLocalId.value) {
      // Update local param
      const idx = parameters.value.findIndex(p => p._localId === editingLocalId.value)
      if (idx !== -1) {
        parameters.value[idx].section = section || null
        parameters.value[idx].position = paramForm.position
        parameters.value[idx].required = paramForm.required
      }
    } else {
      // Add local param
      localIdCounter++
      parameters.value.push({
        _localId: localIdCounter,
        maintenance_parameter_id: paramForm.maintenance_parameter?.id,
        maintenance_parameter: paramForm.maintenance_parameter,
        section: section || null,
        position: paramForm.position || parameters.value.length + 1,
        required: paramForm.required
      })
    }
    showAlert('success', editingLocalId.value ? 'Parameter updated' : 'Parameter added')
    showParamRow.value = false
    resetParamForm()
    return
  }

  // Template IS saved — use API
  savingParam.value = true
  try {
    if (editingParameterId.value) {
      await inspectionService.updateParameter(form.id!, editingParameterId.value, {
        section: section || null,
        position: paramForm.position,
        required: paramForm.required
      })
      showAlert('success', 'Parameter updated')
    } else {
      await inspectionService.addParameter(form.id!, {
        maintenance_parameter_id: paramForm.maintenance_parameter?.id,
        section: section || null,
        position: paramForm.position || parameters.value.length + 1,
        required: paramForm.required
      })
      showAlert('success', 'Parameter added')
    }

    showParamRow.value = false
    resetParamForm()
    await loadParameters()
  } catch (error: any) {
    paramError.value = error?.response?.data?.message || 'Failed to save parameter'
  } finally {
    savingParam.value = false
  }
}

async function confirmRemoveParameter(param: any) {
  const Swal = (window as any).Swal
  if (!Swal) return

  const paramName = param.maintenance_parameter?.name || 'this parameter'
  const result = await Swal.fire({
    title: 'Remove Parameter?',
    text: `Remove "${paramName}" from this template?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Remove',
    confirmButtonColor: '#dc3545'
  })

  if (result.isConfirmed) {
    // Local (unsaved) parameter
    if (param._localId && !param.id) {
      parameters.value = parameters.value.filter(p => p._localId !== param._localId)
      showAlert('success', 'Parameter removed')
      return
    }
    // Saved parameter
    if (form.id) {
      try {
        await inspectionService.removeParameter(form.id, param.id)
        showAlert('success', 'Parameter removed')
        await loadParameters()
      } catch (error: any) {
        showAlert('error', error?.response?.data?.message || 'Failed to remove parameter')
      }
    }
  }
}

function moveUp(index: number) {
  if (index <= 0) return
  const items = [...sortedParameters.value]
  const current = items[index]
  const above = items[index - 1]
  // Only swap within the same section
  const currentSection = (current.section || 'General').toLowerCase()
  const aboveSection = (above.section || 'General').toLowerCase()
  if (currentSection !== aboveSection) return
  const temp = current.position
  current.position = above.position
  above.position = temp
  parameters.value = items
  handleReorder(items)
}

function moveDown(index: number) {
  if (index >= sortedParameters.value.length - 1) return
  const items = [...sortedParameters.value]
  const current = items[index]
  const below = items[index + 1]
  // Only swap within the same section
  const currentSection = (current.section || 'General').toLowerCase()
  const belowSection = (below.section || 'General').toLowerCase()
  if (currentSection !== belowSection) return
  const temp = current.position
  current.position = below.position
  below.position = temp
  parameters.value = items
  handleReorder(items)
}

async function handleReorder(reorderedItems: any[]) {
  if (!form.id) return
  try {
    await inspectionService.reorderParameters(form.id, {
      parameters: reorderedItems.map(item => ({
        id: item.id,
        position: item.position
      }))
    })
  } catch (error: any) {
    showAlert('error', 'Failed to reorder parameters')
    await loadParameters()
  }
}

// ==================== Bulk Parameter Management ====================
function openBulkParameterModal(tab?: string) {
  bulkParameterModalRef.value?.resetForm()
  nextTick(() => {
    const modalEl = document.getElementById('bulkParameterModal')
    if (modalEl) {
      const modal = Modal.getOrCreateInstance(modalEl)
      modal.show()
      if (tab === 'csv') {
        nextTick(() => {
          const component = bulkParameterModalRef.value as any
          if (component) {
            component.activeTab = 'csv'
          }
        })
      }
    }
  })
}

async function handleBulkParameterSubmit(data: { type: string; parameters: any[] }) {
  if (!data.parameters || data.parameters.length === 0) {
    showAlert('warning', 'No parameters to add.')
    return
  }

  // If template is NOT yet saved — store parameters locally
  if (!form.id) {
    for (const param of data.parameters) {
      localIdCounter++
      parameters.value.push({
        _localId: localIdCounter,
        maintenance_parameter_id: param.maintenance_parameter_id,
        maintenance_parameter: param.maintenance_parameter,
        section: param.section || null,
        position: param.position || parameters.value.length + 1,
        required: param.required
      })
    }
    // Close modal
    const modalEl = document.getElementById('bulkParameterModal')
    if (modalEl) {
      const modal = Modal.getInstance(modalEl)
      modal?.hide()
    }
    showAlert('success', `Added ${data.parameters.length} parameter(s) locally. Save the template to persist.`)
    return
  }

  // Template IS saved — use API
  savingParam.value = true
  let successCount = 0
  let failCount = 0

  try {
    // Try bulk endpoint first
    try {
      await inspectionService.addBulkParameters(form.id, {
        parameters: data.parameters.map(p => ({
          maintenance_parameter_id: p.maintenance_parameter_id,
          section: p.section,
          position: p.position,
          required: p.required
        }))
      })
      successCount = data.parameters.length
    } catch (bulkError: any) {
      // If bulk endpoint not available (404/405), fall back to adding one-by-one
      const status = bulkError?.response?.status
      if (status === 404 || status === 405) {
        for (const param of data.parameters) {
          try {
            await inspectionService.addParameter(form.id!, {
              maintenance_parameter_id: param.maintenance_parameter_id,
              section: param.section,
              position: param.position,
              required: param.required
            })
            successCount++
          } catch {
            failCount++
          }
        }
      } else {
        throw bulkError
      }
    }

    // Close modal
    const modalEl = document.getElementById('bulkParameterModal')
    if (modalEl) {
      const modal = Modal.getInstance(modalEl)
      modal?.hide()
    }

    // Show result
    if (failCount > 0) {
      showAlert('warning', `Added ${successCount} parameter(s). ${failCount} failed.`)
    } else {
      showAlert('success', `Successfully added ${successCount} parameter(s)!`)
    }

    // Reload parameters
    await loadParameters()
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to add parameters')
  } finally {
    savingParam.value = false
  }
}

function toggleNewSection() {
  showNewSection.value = !showNewSection.value
  if (!showNewSection.value) newSectionName.value = ''
}

function addNewSection(tag: string) {
  paramForm.section = tag
}

// ==================== Helpers ====================
function getSelectedParamEntry(maintenanceParamId: number): any {
  return parameters.value.find(p => p.maintenance_parameter_id === maintenanceParamId) || null
}

function getParameterName(param: any) {
  return param.maintenance_parameter?.name || param.parameter_name || `Parameter #${param.maintenance_parameter_id}`
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'draft': return 'badge bg-secondary'
    case 'published': return 'badge bg-success'
    case 'retired': return 'badge bg-warning text-dark'
    default: return 'badge bg-light text-dark'
  }
}

// ==================== Lifecycle ====================

onMounted(async () => {
  await fetchTemplates()
})

onBeforeUnmount(() => {
  appOption.appSidebarMinified = false
})
</script>

<style lang="scss" scoped>
.inspection-templates-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;

  .breadcrumb-item {
    text-transform: uppercase !important;

    &::before {
      content: ' / ' !important;
      color: #9ca3af !important;
      padding: 0 0.5rem;
    }

    &:first-child::before {
      display: none !important;
    }

    a {
      text-transform: uppercase !important;
      color: #374151 !important;
      font-weight: 600;
      text-decoration: none !important;

      &:hover {
        color: #1f2937 !important;
        text-decoration: none !important;
      }
    }

    &.active {
      color: #9ca3af !important;
      font-weight: 400;
      text-transform: uppercase !important;
    }
  }
}

/* ========== Page Header Bar (matches Order page) ========== */
.t-page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ========== Two-Panel Grid Layout (matches Order page) ========== */
.template-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 1024px) {
  .template-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.t-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: visible;
}

.t-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.t-panel-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  border-radius: 10px;
}

.t-panel-title-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.t-panel-title-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.t-panel-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Tab bar (matches Order page tab buttons) */
.t-tab-bar {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
}

.t-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #2563eb;
    border-color: #93c5fd;
    background: #eff6ff;
  }

  &.active {
    color: #2563eb;
    background: #eff6ff;
    border-color: #2563eb;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.15);
  }
}

.t-tab-icon {
  font-size: 16px;
}

.t-form-section {
  background: white;
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  overflow: visible;
  box-sizing: border-box;
}

.t-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #dbeafe;
  overflow: hidden;
  word-break: break-word;
  width: 100%;
}

.t-section-icon {
  font-size: 14px;
}

/* View mode label-value rows */
.t-view-row {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
}

.t-view-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.t-view-value {
  font-size: 14px;
  color: #0f172a;
}

.t-subsection-group {
  background: #f9fafb;
  border-left: 4px solid #dbeafe;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 10px;

  h5 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

/* Inline parameter dropdowns - ensure they display above table rows */
.inline-param-select {
  :deep(.multiselect) {
    min-height: 34px;
  }

  :deep(.multiselect__content-wrapper) {
    position: absolute;
    z-index: 100;
    min-width: 100%;
    max-height: 200px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    overflow-y: auto;
  }

  :deep(.multiselect__tags) {
    min-height: 34px;
    padding: 4px 40px 4px 8px;
    font-size: 13px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: #fff;
  }

  :deep(.multiselect--active .multiselect__tags) {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }

  :deep(.multiselect__input) {
    font-size: 13px;
    padding: 0;
    margin-bottom: 0;
  }

  :deep(.multiselect__single) {
    font-size: 13px;
    margin-bottom: 0;
    padding: 0;
    color: #333;
    line-height: 26px;
  }

  :deep(.multiselect__placeholder) {
    font-size: 13px;
    color: #a0aec0;
    margin-bottom: 0;
    padding: 0;
    line-height: 26px;
  }

  :deep(.multiselect__option) {
    padding: 8px 12px;
    font-size: 13px;
    min-height: 34px;
    line-height: 18px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.multiselect__option--highlight) {
    background: #eef4ff;
    color: #2563eb;
  }

  :deep(.multiselect__option--highlight::after) {
    background: #eef4ff;
    color: #64748b;
    font-size: 11px;
    content: '';
  }

  :deep(.multiselect__option--selected) {
    background: #f0fdf4;
    color: #166534;
    font-weight: 600;
  }

  :deep(.multiselect__option--selected.multiselect__option--highlight) {
    background: #fef2f2;
    color: #dc2626;
  }

  :deep(.multiselect__option--selected.multiselect__option--highlight::after) {
    content: '';
    background: transparent;
  }

  :deep(.multiselect__option--selected::after) {
    content: '\f00c';
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    font-size: 11px;
    color: #16a34a;
  }

  :deep(.multiselect__tag) {
    background: #eef4ff;
    color: #2563eb;
    border-radius: 4px;
    font-size: 12px;
    padding: 3px 24px 3px 8px;
  }

  :deep(.multiselect__tag-icon) {
    &::after {
      color: #2563eb;
    }
    &:hover::after {
      color: #dc2626;
    }
  }

  :deep(.multiselect__select) {
    height: 34px;
    padding: 4px 8px;
  }

  :deep(.multiselect__spinner) {
    height: 32px;
  }
}

/* Force the status toggle switch to be visible */
.template-switch {
  width: 3em !important;
  height: 1.5em !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  background-color: #dee2e6 !important;
  border: 1px solid #adb5bd !important;
  border-radius: 2em !important;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.25%29'/%3e%3c/svg%3e") !important;
  background-position: left center !important;
  background-repeat: no-repeat !important;
  background-size: contain !important;
  transition: background-position 0.15s ease-in-out, background-color 0.15s ease-in-out;

  &:checked {
    background-color: #198754 !important;
    border-color: #198754 !important;
    background-position: right center !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e") !important;
  }
}

/* Table row selection checkboxes */
.custom-table :deep(input[type="checkbox"]) {
  width: 14px !important;
  height: 14px !important;
  cursor: pointer;
}

/* ========== Parameter Checklist Styles ========== */
.param-category-group {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.param-category-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s ease;

  &:hover {
    background: #eef4ff;
  }
}

.param-items-list {
  max-height: 250px;
  overflow-y: auto;
}

/* Scrollable categories container */
.param-categories-scroll {
  max-height: 55vh;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
}

/* Toolbar buttons */
.btn-xs {
  font-size: 11px;
  padding: 2px 8px;
  line-height: 1.5;
  border-radius: 4px;
}

.param-toolbar .btn-xs {
  min-width: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.param-item {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fafc;
  }

  &.param-item-selected {
    background: #eff6ff;
  }
}

.param-inline-config {
  background: #f0f7ff;
  border-radius: 6px;
  padding: 6px 10px;
  margin-left: 20px;

  .inline-param-select {
    font-size: 11px !important;
  }
}

/* ========== View-mode underline tabs (like Enquiry page) ========== */
.view-tab-bar {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  background: white;
  padding: 0;
}

.view-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;

  &:hover {
    color: #2563eb;
    background: #f8fafc;
  }

  &.active {
    color: #2563eb;
    font-weight: 600;
    border-bottom-color: #2563eb;
  }
}
</style>
