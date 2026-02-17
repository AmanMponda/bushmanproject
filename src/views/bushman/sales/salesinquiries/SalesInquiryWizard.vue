<template>
  <div class="ps-page inquiry-page">
    <main class="content">
      <!-- Page Header -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-clipboard-list"></i></span>
            SALES / <span>SALES INQUIRY</span>
          </div>
          <h1>{{ isEditMode ? 'Edit Sales Inquiry' : 'Create Sales Inquiry' }}</h1>
          <p class="subtitle">Configure your sales inquiry with customer details, packages, species, and extras.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="cancelWizard">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn ghost" type="button" @click="resetEditMode">
            <span class="btn-icon"><i class="fa fa-rotate-right"></i></span> Reset
          </button>
          <button class="btn primary" type="button" @click="submit" :disabled="saving || !canSubmit">
            <span class="btn-icon"><i class="fa fa-check"></i></span> {{ saving ? 'Saving...' : 'Submit Enquiry' }}
          </button>
        </div>
      </div>

      <!-- Two Column Layout -->
      <section class="grid two-col">
        <!-- LEFT: Customer Details -->
        <aside class="panel left-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-user"></i></div>
            <div class="panel-title-text">
              <h3>Enquiry Preview for {{ form.full_name || 'Customer' }}</h3>
              <p>Hunt details and configuration</p>
            </div>
          </div>

          <div class="form">
            <!-- Hunt Details Form -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-calendar-alt"></i></span>
                Hunt Details
              </div>

              <label class="field">
                <span class="lbl">Season <span class="req">*</span></span>
                <div class="input-wrapper">
                  <select v-model="form.season" @change="onSeasonChange(form.season)">
                    <option :value="null">Select Season...</option>
                    <option v-for="s in seasonItems" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Preferred Date</span>
                <div class="input-wrapper">
                  <Datepicker v-model="form.start_date" mode="date" :placeholder="'Select start date...'"
                    @update:modelValue="onStartDateChange" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Price Structure</span>
                <div class="input-wrapper">
                  <select v-model="form.priceStructureId" :disabled="!form.season"
                    @change="onPriceStructureChange(form.priceStructureId)">
                    <option :value="null">Select Price Structure...</option>
                    <option v-for="p in priceStructureItems" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Hunting Package</span>
                <div class="input-wrapper">
                  <select v-model="form.priceListId"
                    :disabled="!form.season || !form.priceStructureId || loadingPackageItems"
                    @change="onPackageChange(form.priceListId)">
                    <option :value="null">Select Package...</option>
                    <option v-for="p in filteredPackageItems" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Number of Days <span class="req">*</span></span>
                <div class="input-wrapper">
                  <input type="number" v-model.number="form.no_of_days" min="1" placeholder="e.g., 10"
                    @change="onDaysChange(form.no_of_days)" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Hunting Area</span>
                <div class="input-wrapper">
                  <select v-model="form.area">
                    <option :value="null">Select Hunting Area...</option>
                    <option v-for="a in gameAreaItems" :key="a.value" :value="a.value">{{ a.label }}</option>
                  </select>
                </div>
              </label>

              <div class="field">
                <span class="lbl">Number of Hunters</span>
                <div class="input-wrapper">
                  <div class="readonly-value">{{ participants.length || 1 }}</div>
                </div>
                <small class="text-muted">Auto-calculated from participants list</small>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT: Inquiry Configuration -->
        <section class="panel center-panel">
          <div class="panel-header center-header">
            <div class="panel-icon"><i class="fa fa-cog"></i></div>
            <div class="panel-title-text">
              <h3>Inquiry Configuration</h3>
              <p>Set up season, packages, species, and extras</p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="inner-card tabs-card">
            <div class="tabs">
              <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: activeTab === t.key }"
                @click="activeTab = t.key">
                <span class="tab-icon"><i :class="t.icon"></i></span>
                <span class="tab-text">{{ t.label }}</span>
                <span class="tab-count" v-if="getTabCount(t.key) > 0">{{ getTabCount(t.key) }}</span>
              </button>
            </div>
          </div>

          <!-- Tab Content: Species -->
          <div v-show="activeTab === 'species'" class="inner-card content-card">
            <div class="content-body">
              <!-- Previous Experience -->
              <div class="section-divider first">
                <span><i class="fa fa-file-alt me-2"></i>Previous Experience</span>
              </div>
              <div class="form-row experience-requests-row">
                <label class="field">
                  <span class="lbl">Previous Experience</span>
                  <div class="input-wrapper">
                    <textarea v-model="form.prev_experience" rows="3"
                      placeholder="Describe hunting experience..."></textarea>
                  </div>
                </label>

                <label class="field">
                  <span class="lbl">Special Requests</span>
                  <div class="input-wrapper">
                    <textarea v-model="form.special_requests" rows="3"
                      placeholder="Any special requests or requirements..."></textarea>
                  </div>
                </label>
              </div>

              <!-- Species Selection -->
              <div class="section-divider d-flex align-items-center justify-content-between">
                <span><i class="fa fa-paw me-2"></i>Main Species Selection</span>
                <button type="button" class="btn btn-sm btn-outline-success rounded-pill" @click="showNormalSpeciesModal = true">
                  <i class="fa fa-leaf me-1"></i> Normal Species
                  <span v-if="normalSpeciesObjects.length > 0" class="badge bg-success ms-1">{{ normalSpeciesObjects.length }}</span>
                </button>
              </div>



              <!-- Add Species Form -->
              <div class="add-item-row">
                <Multiselect :ref="(el: any) => { if (el) speciesMultiselectRef = el }"
                  :model-value="getSpeciesSelection()" @update:model-value="setSpeciesSelection"
                  class="v-select-field v-select-grouped species-select" :options="groupedSpeciesOptions" label="label"
                  track-by="value" :allow-empty="true" :append-to-body="true" :multiple="false" :close-on-select="true"
                  :group-select="false" :option-height="28" :max-height="300"
                  :selectable="(option: any) => !option.isHeader && !option.isCategoryHeader && !option.$isDisabled"
                  :searchable="true" :options-limit="500" :disabled="!currentSalesPackage?.regulatory_package"
                  placeholder="Search species by name...">
                  <template #option="{ option }">
                    <div :class="{
                      'species-category-header': option.isHeader || option.isCategoryHeader,
                      'species-option': !option.isHeader && !option.isCategoryHeader,
                      'ps-3': option.isChild
                    }">
                      <span class="species-name">{{ option.name || option.label }}</span>
                      <span v-if="option.scientificName" class="species-scientific text-muted ms-2">
                        <em>{{ option.scientificName }}</em>
                      </span>
                      <span v-if="option.regulatoryQty > 0 && !option.isHeader" class="badge bg-secondary ms-2">
                        Qty: {{ option.regulatoryQty }}
                      </span>
                    </div>
                  </template>
                </Multiselect>
                <input type="number" v-model.number="speciesQuantity" min="1" placeholder="Qty" class="qty-input" />
                <button type="button" class="btn btn-primary" style="background-color: #3b82f6; border-color: #3b82f6;"
                  :disabled="!currentSalesPackage?.regulatory_package" @click="addSpeciesToList">
                  <i class="fa fa-plus me-1"></i> Add
                </button>
              </div>

              <!-- Species List -->
              <div class="items-list">
                <div class="list-header">
                  <div class="d-flex align-items-center gap-2">
                    <strong>Main Species ({{ speciesObjects.length }})</strong>
                    <span v-if="normalSpeciesObjects.length > 0" class="badge bg-success" style="font-size: 10px;">+ {{ normalSpeciesObjects.length }} Normal</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button
                      v-if="selectedSpeciesIndices.size > 0"
                      type="button"
                      class="btn btn-sm btn-danger"
                      @click="deleteSelectedSpecies"
                    >
                      <i class="fa fa-trash me-1"></i> Remove ({{ selectedSpeciesIndices.size }})
                    </button>
                    <small class="text-muted">Click priority badge to toggle</small>
                  </div>
                </div>

                <div v-if="speciesObjects.length > 0" class="list-items">
                  <!-- Main Species -->
                  <div v-for="(s, index) in speciesObjects" :key="'main-' + (s.species_id || s.id || index)" class="list-item" :class="{ 'list-item-selected': selectedSpeciesIndices.has(s.species_id ?? s.id ?? index) }">
                    <div class="item-info">
                      <input
                        type="checkbox"
                        class="form-check-input me-1"
                        :checked="selectedSpeciesIndices.has(s.species_id ?? s.id ?? index)"
                        @change="toggleSpeciesSelection(index)"
                      />
                      <strong>{{ s.name }}</strong>
                      <span v-if="s.fromPackage" class="badge bg-info ms-2">from Package</span>
                      <span class="badge ms-2 cursor-pointer"
                        :class="s.priority === 'MUST_HAVE' ? 'bg-danger' : 'bg-secondary'"
                        @click="togglePriority(index)" style="cursor: pointer;">
                        {{ s.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE' }}
                      </span>
                      <span v-if="s.regulatoryQty && s.regulatoryQty > 0" class="badge bg-light text-dark ms-2">
                        <i class="fa fa-balance-scale me-1"></i> Regulatory: {{ s.regulatoryQty }}
                      </span>
                      <span v-if="s.regulatoryQty && s.quantity > s.regulatoryQty"
                        class="badge bg-warning text-dark ms-2"
                        title="Requested quantity exceeds regulatory quantity (allowed but will be flagged)">
                        <i class="fa fa-exclamation-triangle me-1"></i> Exceeds Limit
                      </span>
                    </div>
                    <div class="item-actions">
                      <button type="button" class="btn btn-sm btn-outline-primary" :disabled="s.quantity <= 1"
                        @click="decrementQuantity(index)">
                        <i class="fa fa-minus"></i>
                      </button>
                      <span class="qty-badge">{{ s.quantity }}</span>
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="incrementQuantity(index)">
                        <i class="fa fa-plus"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-danger ms-2"
                        @click="deleteFromStorage(index)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-list">
                  <i class="fa fa-paw fa-2x text-muted mb-2"></i>
                  <p>No species selected yet. Add species using the form above or select a package.</p>
                </div>
              </div>

              <!-- Upgrade Fees -->
              <div v-if="selectedUpgradeFees.length > 0" class="upgrade-fees-section">
                <div class="section-divider">
                  <span><i class="fa fa-arrow-up me-2"></i>Upgrade Fees</span>
                </div>
                <div class="fees-table">
                  <div class="fee-row header">
                    <span>Species</span>
                    <span>Upgrade Fee</span>
                  </div>
                  <div v-for="fee in selectedUpgradeFees" :key="fee.id" class="fee-row">
                    <span>{{ fee.species_name || fee.species?.name || 'Unknown' }}</span>
                    <span class="text-warning fw-bold">{{ fee.currency_symbol || '$' }}{{ fee.amount }}</span>
                  </div>
                </div>
              </div>

              <!-- Normal Species Modal -->
              <Teleport to="body">
                <div v-if="showNormalSpeciesModal" class="normal-species-modal-overlay" @click.self="showNormalSpeciesModal = false">
                  <div class="normal-species-modal">
                    <div class="normal-species-modal-header">
                      <h5 class="mb-0"><i class="fa fa-leaf me-2 text-success"></i>Normal Species (Optional)</h5>
                      <button type="button" class="btn-close" @click="showNormalSpeciesModal = false"></button>
                    </div>
                    <div class="normal-species-modal-body">
                      <!-- Add Normal Species Form -->
                      <div class="add-item-row">
                        <Multiselect
                          :model-value="getNormalSpeciesSelection()" @update:model-value="setNormalSpeciesSelection"
                          class="v-select-field v-select-grouped species-select" :options="groupedNormalSpeciesOptions" label="label"
                          track-by="value" :allow-empty="true" :multiple="false" :close-on-select="true"
                          :group-select="false" :option-height="28" :max-height="300"
                          :selectable="(option: any) => !option.isHeader && !option.isCategoryHeader && !option.$isDisabled"
                          :searchable="true" :options-limit="500"
                          :disabled="!currentSalesPackage"
                          placeholder="Search species by name...">
                          <template #option="{ option }">
                            <div :class="{
                              'species-category-header': option.isHeader || option.isCategoryHeader,
                              'species-option': !option.isHeader && !option.isCategoryHeader,
                              'ps-3': option.isChild
                            }">
                              <span class="species-name">{{ option.name || option.label }}</span>
                              <span v-if="option.scientificName" class="species-scientific text-muted ms-2">
                                <em>{{ option.scientificName }}</em>
                              </span>
                              <span v-if="option.regulatoryQty > 0 && !option.isHeader" class="badge bg-secondary ms-2">
                                Qty: {{ option.regulatoryQty }}
                              </span>
                            </div>
                          </template>
                        </Multiselect>
                        <input type="number" v-model.number="normalSpeciesQuantity" min="1" placeholder="Qty" class="qty-input" />
                        <button type="button" class="btn btn-success" @click="addNormalSpeciesToList">
                          <i class="fa fa-plus me-1"></i> Add
                        </button>
                      </div>

                      <!-- Normal Species List -->
                      <div class="items-list mt-3">
                        <div class="list-header">
                          <div class="d-flex align-items-center gap-2">
                            <input
                              v-if="normalSpeciesObjects.length > 0"
                              type="checkbox"
                              class="species-checkbox"
                              :checked="selectedNormalSpeciesIndices.size === normalSpeciesObjects.length && normalSpeciesObjects.length > 0"
                              :indeterminate="selectedNormalSpeciesIndices.size > 0 && selectedNormalSpeciesIndices.size < normalSpeciesObjects.length"
                              @change="toggleSelectAllNormalSpecies"
                              title="Select All"
                            />
                            <strong>Normal Species ({{ normalSpeciesObjects.length }})</strong>
                          </div>
                          <div class="d-flex align-items-center gap-2">
                            <button
                              v-if="selectedNormalSpeciesIndices.size > 0"
                              type="button"
                              class="btn btn-sm btn-outline-danger"
                              @click="showNormalDeleteConfirm = true"
                            >
                              <i class="fa fa-trash me-1"></i> Delete ({{ selectedNormalSpeciesIndices.size }})
                            </button>
                          </div>
                        </div>

                        <!-- Inline delete confirmation -->
                        <div v-if="showNormalDeleteConfirm" class="alert alert-warning d-flex align-items-center justify-content-between py-2 px-3 mb-2 mt-2 rounded">
                          <div>
                            <i class="fa fa-exclamation-triangle me-2 text-warning"></i>
                            Remove <strong>{{ selectedNormalSpeciesIndices.size }}</strong> selected normal species?
                          </div>
                          <div class="d-flex gap-2">
                            <button type="button" class="btn btn-sm btn-danger" @click="confirmDeleteNormalSpecies">
                              <i class="fa fa-trash me-1"></i> Yes, delete
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" @click="showNormalDeleteConfirm = false">
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div v-if="normalSpeciesObjects.length > 0" class="list-items" style="max-height: 350px; overflow-y: auto;">
                          <div v-for="(s, index) in normalSpeciesObjects" :key="s.species_id || s.id || index" class="list-item normal-species-item" :class="{ 'list-item-selected': selectedNormalSpeciesIndices.has(s.species_id ?? s.id ?? index) }">
                            <div class="item-info">
                              <input
                                type="checkbox"
                                class="species-checkbox"
                                :checked="selectedNormalSpeciesIndices.has(s.species_id ?? s.id ?? index)"
                                @change="toggleNormalSpeciesSelection(index)"
                              />
                              <strong>{{ s.name }}</strong>
                              <span v-if="s.fromPackage" class="badge bg-info ms-2">from Package</span>
                              <span class="badge bg-success ms-2">Normal</span>
                              <span v-if="s.regulatoryQty && s.regulatoryQty > 0" class="badge bg-light text-dark ms-2">
                                <i class="fa fa-balance-scale me-1"></i> Regulatory: {{ s.regulatoryQty }}
                              </span>
                              <span v-if="s.regulatoryQty && s.quantity > s.regulatoryQty"
                                class="badge bg-warning text-dark ms-2"
                                title="Requested quantity exceeds regulatory quantity">
                                <i class="fa fa-exclamation-triangle me-1"></i> Exceeds Limit
                              </span>
                              <span class="badge ms-2 cursor-pointer"
                                :class="s.priority === 'MUST_HAVE' ? 'bg-danger' : 'bg-secondary'"
                                @click="toggleNormalPriority(index)" style="cursor: pointer;">
                                {{ s.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE' }}
                              </span>
                            </div>
                            <div class="item-actions">
                              <button type="button" class="btn btn-sm btn-outline-primary" :disabled="s.quantity <= 1"
                                @click="decrementNormalQuantity(index)">
                                <i class="fa fa-minus"></i>
                              </button>
                              <span class="qty-badge">{{ s.quantity }}</span>
                              <button type="button" class="btn btn-sm btn-outline-primary" @click="incrementNormalQuantity(index)">
                                <i class="fa fa-plus"></i>
                              </button>
                              <button type="button" class="btn btn-sm btn-outline-danger ms-2"
                                @click="deleteNormalSpecies(index)">
                                <i class="fa fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div v-else class="empty-list">
                          <i class="fa fa-leaf fa-2x text-muted mb-2"></i>
                          <p>No normal species added yet. Use the search above to find and add species.</p>
                        </div>
                      </div>
                    </div>
                    <div class="normal-species-modal-footer">
                      <span class="text-muted">{{ normalSpeciesObjects.length }} species added</span>
                      <button type="button" class="btn btn-success px-4" style="background-color: #28a745; border-color: #28a745; color: #fff; font-weight: 600;" @click="showNormalSpeciesModal = false">
                        <i class="fa fa-check me-1"></i> Done
                      </button>
                    </div>
                  </div>
                </div>
              </Teleport>
            </div>
          </div>

          <!-- Tab Content: Participants -->
          <div v-show="activeTab === 'participants'" class="inner-card content-card">
            <div class="content-body">
              <!-- Hunting Type Info Banner -->
              <div v-if="expectedHunterCount != null" class="alert d-flex align-items-center gap-2 py-2 px-3 mb-3"
                :class="participantCountMismatch ? 'alert-warning' : 'alert-info'">
                <i class="fa" :class="participantCountMismatch ? 'fa-exclamation-triangle' : 'fa-info-circle'"></i>
                <div>
                  <strong>Hunting Type: {{ packageHuntingType }}</strong> —
                  Package expects <strong>{{ expectedHunterCount }}</strong> hunter{{ expectedHunterCount > 1 ? 's' : '' }}.
                  <span v-if="participantCountMismatch" class="text-danger ms-1">
                    Currently {{ participants.length }} participant{{ participants.length !== 1 ? 's' : '' }}.
                  </span>
                  <span v-else class="text-success ms-1">
                    <i class="fa fa-check-circle"></i> Match
                  </span>
                </div>
              </div>

              <!-- Add Hunter Button -->
              <div class="add-item-row">
                <small class="text-muted">Add hunters/participants for this enquiry. Primary hunter is required.</small>
                <div>
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="addParticipant">
                    <i class="fa fa-plus me-1"></i> Add Hunter
                  </button>
                </div>
              </div>

              <!-- Hunters Table -->
              <div class="items-list">
                <div class="list-header">
                  <strong>Hunters ({{ participants.length }})</strong>
                </div>

                <!-- Table Header -->
                <div v-if="participants.length > 0" class="participant-table-header">
                  <div class="ptbl-col-num">#</div>
                  <div class="ptbl-col-entity">Entity</div>
                  <div class="ptbl-col-share">Share %</div>
                  <div class="ptbl-col-indep">Independent</div>
                  <div class="ptbl-col-dep">Dependent On</div>
                  <div class="ptbl-col-notes">Notes</div>
                  <div class="ptbl-col-action"></div>
                </div>

                <div v-if="participants.length > 0" class="list-items">
                  <!-- Primary Hunter Row -->
                  <div v-if="primaryParticipant" class="participant-table-row primary-row">
                    <div class="ptbl-col-num">
                      <span class="participant-badge primary"><i class="fa fa-star"></i></span>
                    </div>
                    <div class="ptbl-col-entity">
                      <input type="text" class="form-control form-control-sm bg-light" :value="primaryParticipant.entity_name || form.full_name || 'Not set'" disabled readonly />
                    </div>
                    <div class="ptbl-col-share">
                      <input type="number" class="form-control form-control-sm text-center" v-model.number="primaryParticipant.share_percentage" min="0" max="100" step="0.01" :disabled="!primaryParticipant.is_independent" :class="{ 'bg-light': !primaryParticipant.is_independent }" />
                    </div>
                    <div class="ptbl-col-indep">
                      <div class="d-flex align-items-center gap-2">
                        <input type="checkbox" v-model="primaryParticipant.is_independent" class="form-check-input m-0" @change="redistributeShares()" />
                        <span class="toggle-label">{{ primaryParticipant.is_independent ? 'Yes' : 'No' }}</span>
                      </div>
                    </div>
                    <div class="ptbl-col-dep">
                      <span class="text-muted">—</span>
                    </div>
                    <div class="ptbl-col-notes">
                      <span class="text-muted">—</span>
                    </div>
                    <div class="ptbl-col-action">
                      <!-- Primary cannot be removed -->
                    </div>
                  </div>

                  <!-- Additional Hunter Rows -->
                  <div v-for="(p, idx) in additionalParticipants" :key="p._uid" class="participant-table-row">
                    <div class="ptbl-col-num">
                      <span class="participant-badge additional">{{ idx + 2 }}</span>
                    </div>
                    <div class="ptbl-col-entity">
                      <select v-model="p.entity_id" class="form-select form-select-sm" @change="onParticipantEntityChange(p)">
                        <option :value="null">Select Hunter...</option>
                        <option v-for="e in getAvailableEntityOptions(p)" :key="e.value" :value="e.value">{{ e.label }}</option>
                      </select>
                    </div>
                    <div class="ptbl-col-share">
                      <input type="number" class="form-control form-control-sm text-center" v-model.number="p.share_percentage" min="0" max="100" step="0.01" :disabled="!p.is_independent" :class="{ 'bg-light': !p.is_independent }" />
                    </div>
                    <div class="ptbl-col-indep">
                      <div class="d-flex align-items-center gap-2">
                        <input type="checkbox" v-model="p.is_independent" class="form-check-input m-0" @change="redistributeShares()" />
                        <span class="toggle-label">{{ p.is_independent ? 'Yes' : 'No' }}</span>
                      </div>
                    </div>
                    <div class="ptbl-col-dep">
                      <select v-if="!p.is_independent" v-model="p.dependent_on_participant_id" class="form-select form-select-sm">
                        <option :value="null">Select...</option>
                        <option v-for="dep in getDependencyOptions(p)" :key="dep.value" :value="dep.value">{{ dep.label }}</option>
                      </select>
                      <span v-else class="text-muted">—</span>
                    </div>
                    <div class="ptbl-col-notes">
                      <input type="text" class="form-control form-control-sm" v-model="p.notes" placeholder="Optional notes..." />
                    </div>
                    <div class="ptbl-col-action">
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="removeParticipant(idx)" title="Remove">
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-list">
                  <i class="fa fa-users fa-2x text-muted mb-2"></i>
                  <p>No hunters added yet. Click "Add Hunter" to get started.</p>
                </div>
              </div>

              <!-- Validation Summary -->
              <div v-if="participantValidationErrors.length > 0" class="participant-validation-errors mt-3">
                <div class="alert alert-danger">
                  <strong><i class="fa fa-exclamation-triangle me-1"></i> Validation Issues:</strong>
                  <ul class="mb-0 mt-1">
                    <li v-for="(err, i) in participantValidationErrors" :key="i">{{ err }}</li>
                  </ul>
                </div>
              </div>

              <!-- Share Summary -->
              <div class="share-summary mt-3">
                <div class="share-bar">
                  <div class="share-bar-label">
                    <strong>Total Share:</strong>
                    <span :class="totalSharePercentage === expectedTotalShare ? 'text-success' : 'text-danger'">
                      {{ totalSharePercentage.toFixed(2) }}%
                    </span>
                    <span v-if="totalSharePercentage !== expectedTotalShare" class="text-danger ms-2">
                      <i class="fa fa-exclamation-circle"></i> Must equal {{ expectedTotalShare }}%
                      <small class="text-muted">({{ expectedHunterCount || 1 }} hunter{{ (expectedHunterCount || 1) > 1 ? 's' : '' }} × 100%)</small>
                    </span>
                    <span v-else class="text-success ms-2">
                      <i class="fa fa-check-circle"></i> Valid
                    </span>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div
                      class="progress-bar"
                      :class="totalSharePercentage === expectedTotalShare ? 'bg-success' : totalSharePercentage > expectedTotalShare ? 'bg-danger' : 'bg-warning'"
                      :style="{ width: Math.min((totalSharePercentage / expectedTotalShare) * 100, 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content: Extras -->
          <div v-show="activeTab === 'extras'" class="inner-card content-card">
            <div class="content-body">
              <!-- Budget Section -->
              <div class="section-divider first">
                <span><i class="fa fa-dollar-sign me-2"></i>Budget Information</span>
              </div>
              <div class="form-row">
                <label class="field">
                  <span class="lbl">Budget Minimum (USD)</span>
                  <div class="input-wrapper">
                    <CurrencyInput :model-value="form.budget_min ?? 0"
                      @update:model-value="(val: number) => form.budget_min = val" currency="USD"
                      placeholder="e.g., 5,000" />
                  </div>
                </label>
                <label class="field">
                  <span class="lbl">Budget Maximum (USD)</span>
                  <div class="input-wrapper">
                    <CurrencyInput :model-value="form.budget_max ?? 0"
                      @update:model-value="(val: number) => form.budget_max = val" currency="USD"
                      placeholder="e.g., 15,000" />
                  </div>
                </label>
              </div>
              <div v-if="form.budget_min && form.budget_max" class="info-alert">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Budget Range:</strong> ${{ form.budget_min.toLocaleString() }} - ${{
                  form.budget_max.toLocaleString() }}
              </div>

              <!-- Safari Extras -->
              <div class="section-divider">
                <span><i class="fa fa-compass me-2"></i>Safari Extras ({{ selectedSafariExtras.length }})</span>
              </div>

              <!-- Add Safari Extra: dynamic rows (allows duplicates) -->
              <div class="add-item-row">
                <small class="text-muted">Add multiple rows; select the same extra multiple times and set duration per row.</small>
                <div>
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="addSafariExtra" title="Add a new safari extra row">
                    <i class="fa fa-plus me-1"></i> Add Extra
                  </button>
                </div>
              </div>

              <!-- Safari Extras List -->
              <div class="items-list">
                <div class="list-header">
                  <strong>Selected Safari Extras ({{ selectedSafariExtras.length }})</strong>
                </div>

                <div v-if="selectedSafariExtras.length > 0" class="list-items">
                  <div v-for="(extra, index) in selectedSafariExtras" :key="index" class="extras-row">
                    <!-- Col 1: Dropdown -->
                    <div class="extras-col-select">
                      <select v-model="extra.id" class="form-select form-select-sm" @change="onSafariExtraTypeChange(extra)">
                        <option :value="null">Select Extra...</option>
                        <option v-for="opt in safariExtrasItems" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                    </div>

                    <!-- Col 2: Quantity OR Duration (when no qty) -->
                    <div class="extras-col-qty">
                      <div v-if="isQuantityRelevant(extra)" style="display:flex; align-items:center; gap:4px;">
                        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="extra.quantity <= 1"
                          @click="updateSafariExtraQuantity(extra, -1)">-</button>
                        <span class="qty-badge">{{ extra.quantity || 1 }}</span>
                        <button type="button" class="btn btn-sm btn-outline-secondary"
                          @click="updateSafariExtraQuantity(extra, 1)">+</button>
                      </div>
                      <div v-else-if="isDurationRelevant(extra)" style="display:flex; align-items:center; gap:6px;">
                        <input type="number" step="1" min="1" class="form-control form-control-sm text-center" :value="extra.item_durations"
                          @input="handleDurationInput($event, extra)" :placeholder="getDurationPlaceholder(extra)" style="width:80px; height:34px;" title="Leave blank to inherit hunting length">
                        <i class="fa fa-info-circle text-muted" style="font-size:14px;" :title="'Leave blank to inherit hunting length'"></i>
                      </div>
                    </div>

                    <!-- Col 3: Duration (only when qty is also shown) -->
                    <div class="extras-col-days">
                      <div v-if="isQuantityRelevant(extra) && isDurationRelevant(extra)" style="display:flex; align-items:center; gap:6px;">
                        <input type="number" step="1" min="1" class="form-control form-control-sm text-center" :value="extra.item_durations"
                          @input="handleDurationInput($event, extra)" :placeholder="getDurationPlaceholder(extra)" style="width:80px; height:34px;" title="Leave blank to inherit hunting length">
                        <i class="fa fa-info-circle text-muted" style="font-size:14px;" :title="'Leave blank to inherit hunting length'"></i>
                      </div>
                    </div>

                    <!-- Col 4: Delete -->
                    <div class="extras-col-action">
                      <button type="button" class="btn btn-sm btn-outline-danger"
                        @click="removeSafariExtra(index)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-list">
                  <i class="fa fa-compass fa-2x text-muted mb-2"></i>
                  <p>No safari extras selected yet. Add safari extras using the form above.</p>
                </div>
              </div>

              <!-- Trophy Fees -->
              <div v-if="trophyFees.length > 0">
                <div class="section-divider">
                  <span><i class="fa fa-trophy me-2"></i>Trophy Fees ({{ trophyFees.length }})</span>
                </div>
                <div class="fees-table">
                  <div class="fee-row header">
                    <span>Species</span>
                    <span>Sequence</span>
                    <span>Fee</span>
                  </div>
                  <div v-for="(fee, index) in trophyFees" :key="`trophy-${fee.id}-${index}`" class="fee-row">
                    <span>{{ fee.species_name || 'Unknown' }}</span>
                    <span><span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span></span>
                    <span class="fw-semibold">{{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content: More Details -->
          <!-- Tab Content: Review -->
          <div v-show="activeTab === 'review'" class="inner-card content-card" ref="previewRef">
            <div class="content-body">
              <!-- Download PDF (preview) -->
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom:12px;">
                <button type="button" class="btn btn-outline-primary btn-sm" :disabled="generatingPdf"
                  @click="downloadPreviewPdf">
                  <span v-if="generatingPdf" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                  <i class="fa fa-download me-1"></i>
                  Download Preview PDF
                </button>
              </div>

              <!-- Remarks -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-comment text-primary me-2"></i>
                  <h6>Enquiry Remarks</h6>
                </div>
                <textarea v-model="form.remarks" class="form-control mb-3" rows="3"
                  placeholder="Add any additional remarks or notes for this enquiry (optional)..."></textarea>
              </div>

              <!-- Customer Summary (restored UI - inline review items only) -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-user text-primary me-2"></i>
                  <h6>Customer Information</h6>
                </div>
                <div class="review-grid">
                  <div class="review-item"><span class="label">Client Name:</span><span class="value">{{ displayOrNotProvided(form.full_name || props.customerData?.full_name) }}</span></div>
                  <div class="review-item"><span class="label">Phone:</span><span class="value">{{ displayOrNotProvided(form.phone || props.customerData?.phone) }}</span></div>
                  <div class="review-item"><span class="label">Country:</span><span class="value">{{ displayOrNotProvided(getItemLabel(countryItems, form.country)) }}</span></div>
                  <div class="review-item"><span class="label">Email:</span><span class="value">{{ displayOrNotProvided(form.email || props.customerData?.email) }}</span></div>
                  <div class="review-item"><span class="label">Nationality:</span><span class="value">{{ displayOrNotProvided(getItemLabel(nationalityItems, form.nationality)) }}</span></div>
                  <div class="review-item"><span class="label">Address:</span><span class="value">{{ displayOrNotProvided(form.address || props.customerData?.address) }}</span></div>
                </div>
              </div>

              <!-- Season & Package Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-box text-primary me-2"></i>
                  <h6>Season & Package</h6>
                </div>
                <div class="review-grid">
                  <div class="review-item"><span class="label">Season:</span><span class="value">{{ getItemLabel(seasonItems, form.season) }}</span></div>
                  <div class="review-item"><span class="label">Hunting Type:</span><span class="value">{{ displayOrNotProvided((currentSalesPackage && currentSalesPackage.hunting_type) || (packagesOptions.find(p => p.value === form.priceListId)?.selfItem?.hunting_type) || 'Not provided') }}</span></div>
                  <!-- Package spans full width to avoid cramped long package names -->
                  <div class="review-item full"><span class="label">Package:</span><span class="value">{{ getItemLabel(packageItems, form.priceListId) || 'No package selected' }}</span></div>
                </div>
              </div>

              <!-- Schedule Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-calendar text-primary me-2"></i>
                  <h6>Schedule & Hunt Party</h6>
                </div>
                <div class="review-grid">
                  <div class="review-item"><span class="label">Preferred Date:</span><span class="value">{{ displayOrNotProvided(formatReviewDate(form.start_date)) }}</span></div>
                  <div class="review-item"><span class="label">Days:</span><span class="value">{{ displayOrNotProvided(form.no_of_days) }}</span></div>
                  <div class="review-item"><span class="label">End Date:</span><span class="value text-info">{{ displayOrNotProvided(formatReviewDate(calculatedEndDate)) }}</span></div>
                  <div class="review-item"><span class="label">Hunting Area:</span><span class="value">{{ displayOrNotProvided(getAreaLabel(form.area)) }}</span></div>
                  <div class="review-item"><span class="label">Participants:</span><span class="value">{{ participants.length }}</span></div>
                  <div class="review-item"><span class="label">Experience:</span><span class="value">{{ displayOrNotProvided(form.prev_experience) }}</span></div>
                </div>
              </div>

              <!-- Participants Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-users text-primary me-2"></i>
                  <h6>Participants ({{ participants.length }})</h6>
                </div>
                <div v-if="participants.length > 0" class="participants-review-list">
                  <div v-for="(p, i) in participants" :key="p._uid" class="participant-review-item">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <span class="badge me-2" :class="p.participant_type === 'primary' ? 'bg-warning text-dark' : 'bg-secondary'">
                          {{ p.participant_type === 'primary' ? 'Primary' : `Hunter #${i + 1}` }}
                        </span>
                        <strong>{{ p.entity_name || 'Not selected' }}</strong>
                        <span v-if="!p.is_independent" class="text-muted ms-2">(Dependent)</span>
                      </div>
                      <span class="share-badge">{{ p.share_percentage }}%</span>
                    </div>
                  </div>
                  <div class="share-total-review mt-2" :class="totalSharePercentage === expectedTotalShare ? 'text-success' : 'text-danger'">
                    <strong>Total Share: {{ totalSharePercentage.toFixed(2) }}% / {{ expectedTotalShare }}%</strong>
                  </div>
                </div>
              </div>

              <!-- Species Summary -->
              <div class="review-section">
                <div class="review-header">
                  <i class="fa fa-paw text-primary me-2"></i>
                  <h6>Main Species ({{ speciesObjects.length }})</h6>
                </div>
                <div v-if="speciesObjects.length > 0" class="species-list-wrap">
                  <ul class="species-list">
                    <li v-for="(s, index) in speciesObjects" :key="s.species_id || s.id || index">
                      <strong>{{ s.name }}</strong> <span class="text-muted">(x{{ s.quantity }})</span>
                    </li>
                  </ul>
                </div>
                <span v-else class="text-muted">No main species selected</span>
              </div>

              <!-- Normal Species Summary -->
              <div v-if="normalSpeciesObjects.length > 0" class="review-section">
                <div class="review-header">
                  <i class="fa fa-leaf text-success me-2"></i>
                  <h6>Normal Species ({{ normalSpeciesObjects.length }})</h6>
                </div>
                <div class="species-list-wrap">
                  <ul class="species-list">
                    <li v-for="(s, index) in normalSpeciesObjects" :key="s.species_id || s.id || index">
                      <strong>{{ s.name }}</strong> <span class="text-muted">(x{{ s.quantity }})</span>
                      <span class="badge bg-success ms-1" style="font-size: 10px;">Normal</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Safari Extras Summary -->
              <div v-if="selectedSafariExtras.length > 0" class="review-section">
                <div class="review-header">
                  <i class="fa fa-hiking text-primary me-2"></i>
                  <h6>Safari Extras ({{ selectedSafariExtras.length }})</h6>
                </div>
                <div class="extras-list">
                  <ul>
                    <li v-for="extra in selectedSafariExtras" :key="extra.id">
                      {{ extra.name || 'Safari Extra' }}
                      <small v-if="extra.quantity && extra.quantity > 1" class="text-muted">(x{{ extra.quantity }})</small>
                      <small v-if="computeEffectiveDuration(extra) != null" class="text-muted"> — {{ computeEffectiveDuration(extra) }} day<span v-if="(computeEffectiveDuration(extra) ?? 0) > 1">s</span></small>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Trophy Fees Summary -->
              <div v-if="trophyFees.length > 0" class="review-section">
                <div class="review-header">
                  <i class="fa fa-trophy text-warning me-2"></i>
                  <h6>Trophy Fees ({{ trophyFees.length }})</h6>
                </div>
                <div class="fees-table compact">
                  <div class="fee-row header">
                    <span>Species</span>
                    <span>Sequence</span>
                    <span>Fee</span>
                  </div>
                  <div v-for="(fee, index) in trophyFees" :key="`trophy-review-${fee.id}-${index}`" class="fee-row">
                    <span>{{ fee.species_name || 'Unknown' }}</span>
                    <span><span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span></span>
                    <span class="fw-semibold">{{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>



<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useAuthStore } from '@/stores/auth'
import { useAppOptionStore } from '@/stores/app-option'
import CurrencyInput from '@/components/CurrencyInput.vue'
import Datepicker from '@/components/plugins/Datepicker.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

// PDF generation (preview before submitting)
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// NOTE: replaced html2canvas snapshot with server-style jsPDF layout (autotable) to match single-enquiry PDF


const props = defineProps<{
  editRow?: any | null
  customerData?: any | null
}>()
const emit = defineEmits<{ (e: 'cancel'): void; (e: 'saved'): void; (e: 'pricing-changed', payload?: any): void }>()

const vueformRef = ref<any>(null)
const { init } = useToast()
const appOptionStore = useAppOptionStore()
const originalSidebarState = ref<boolean>(false)

// Form state - reactive object that syncs with Vueform
const form = reactive({
  id: null as any,
  full_name: '',
  nick_name: '',
  country: null as any,
  nationality: null as any,
  email: '',
  phone: '',
  phone_additional: '',
  address: '',
  no_of_hunters: 1,
  no_of_observers: 0,
  no_of_participants: 1,
  priceListId: null as any,
  priceStructureId: null as any,
  no_of_days: 0,
  no_of_companions: 0,
  species: null as any,
  quantity: 0,
  area: null as any,
  season: null as any,
  start_date: null as any,
  preferred_start_month: null as any,
  remarks: '',
  prev_experience: '',
  budget_min: null as number | null,
  budget_max: null as number | null,
  payment_method_id: null as number | null,
  special_requests: '',
})

// Data sources
const countries = ref<any[]>([])
const nationality = ref<any[]>([])
const speciesOptions = ref<any[]>([])
const selectedAreaSpecies = ref<any[]>([])
const areaSpeciesLoaded = ref(false)
const speciesObjects = ref<any[]>([])
const normalSpeciesObjects = ref<any[]>([])          // Normal/optional species (separate from main)
// Track selected species by stable identifier (species_id or id) to avoid UI mismatch when array changes
const selectedSpeciesIndices = ref<Set<string|number>>(new Set())
const selectedNormalSpeciesIndices = ref<Set<string|number>>(new Set())
const selectedNormalSpeciesId = ref<number | null>(null)
const normalSpeciesQuantity = ref(1)
const showNormalSpeciesModal = ref(false)
const showNormalDeleteConfirm = ref(false)
const areasOptions = ref<any[]>([])
const seasonsOptions = ref<any[]>([])
const packagesOptions = ref<any[]>([])
const priceStructuresOptions = ref<any[]>([])
const existingCustomersOptions = ref<any[]>([])

// Species categorization (display-only)
const regulatoryPackageSpecies = ref<any[]>([])
const customizedPackageSpecies = ref<any[]>([])
const currentSalesPackage = ref<any>(null)
// Full package species fetched from sales-package-sets/{id} endpoint (includes subtype)
const fullPackageSpecies = ref<any[]>([])
const speciesMultiselectRef = ref<any>(null)
const showFullRegulatoryPackage = ref(false)

const saving = ref(false)
const loadingPackageItems = ref(false)
const loadingCustomers = ref(false)
const loadingAreaSpecies = ref(false)

const seasonMinDate = ref<Date | null>(null)
const seasonMaxDate = ref<Date | null>(null)
const bookedDates = ref<Array<{ start_date: string; end_date: string; client_name: string; area_id: number }>>([])
const loadingBookedDates = ref(false)
const dateConflictWarning = ref('')

// Tab navigation state
const activeTab = ref('species')
const selectedSpeciesId = ref<number | null>(null)
const speciesQuantity = ref(1)

// ─── Participants State ───
let participantUidCounter = 1
interface Participant {
  _uid: number
  entity_id: number | null
  entity_name: string
  participant_type: 'primary' | 'additional'
  is_independent: boolean
  dependent_on_participant_id: number | null
  share_percentage: number
  notes: string
}

const participants = ref<Participant[]>([
  {
    _uid: participantUidCounter++,
    entity_id: null,
    entity_name: '',
    participant_type: 'primary',
    is_independent: true,
    dependent_on_participant_id: null,
    share_percentage: 100,
    notes: '',
  }
])
const entityOptions = ref<{ value: number; label: string }[]>([])
const loadingEntities = ref(false)

const primaryParticipant = computed(() => participants.value.find(p => p.participant_type === 'primary') || null)
const additionalParticipants = computed(() => participants.value.filter(p => p.participant_type === 'additional'))

// ─── Hunting Type → Expected Hunter Count ───
// Parses hunting_type strings like "1x1", "2x1" etc. First number = expected hunters.
const packageHuntingType = computed((): string | null => {
  if (currentSalesPackage.value?.hunting_type) return currentSalesPackage.value.hunting_type
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  return pkg?.selfItem?.hunting_type || null
})

const expectedHunterCount = computed((): number | null => {
  const ht = packageHuntingType.value
  if (!ht) return null
  // Parse patterns like "1x1", "2x1", "3x1" — first number is the hunter count
  const match = String(ht).match(/^(\d+)\s*x\s*\d+$/i)
  return match ? Number(match[1]) : null
})

const participantCountMismatch = computed((): boolean => {
  const expected = expectedHunterCount.value
  if (expected == null) return false
  return participants.value.length !== expected
})

// Filter out already-selected entities so the same hunter can't be added twice
const getAvailableEntityOptions = (currentParticipant: any) => {
  const selectedIds = new Set(
    participants.value
      .filter(p => p.entity_id && p !== currentParticipant)
      .map(p => p.entity_id)
  )
  return entityOptions.value.filter(e => !selectedIds.has(e.value))
}

const totalSharePercentage = computed(() =>
  participants.value.reduce((sum, p) => sum + (Number(p.share_percentage) || 0), 0)
)

// Expected total share: each INDEPENDENT hunter pays 100% of the per-person package price.
// Dependent hunters pay 0% (they don't have their own share).
// e.g. 2x1 with both independent = 200%, 2x1 with 1 dependent = 100%
const expectedTotalShare = computed((): number => {
  const independentCount = participants.value.filter(p => p.is_independent).length
  return independentCount * 100 || 100
})

const participantValidationErrors = computed(() => {
  const errors: string[] = []
  const primary = primaryParticipant.value
  if (!primary || !primary.entity_id) {
    errors.push('Primary hunter must be selected.')
  }
  for (let i = 0; i < additionalParticipants.value.length; i++) {
    const p = additionalParticipants.value[i]
    // Additional hunters are optional — only validate dependency if entity is already selected
    if (p.entity_id && !p.is_independent && !p.dependent_on_participant_id) {
      errors.push(`Hunter #${i + 2} is not independent — "Dependent On" must be selected.`)
    }
  }
  if (Math.abs(totalSharePercentage.value - expectedTotalShare.value) > 0.01) {
    errors.push(`Total share percentage must equal ${expectedTotalShare.value}% (currently ${totalSharePercentage.value.toFixed(2)}%). Each independent hunter should have 100%.`)
  }
  // Hunting type mismatch validation
  const expected = expectedHunterCount.value
  if (expected != null && participants.value.length !== expected) {
    errors.push(`Hunting type ${packageHuntingType.value} expects ${expected} hunter(s), but ${participants.value.length} participant(s) are configured.`)
  }
  return errors
})

const addParticipant = () => {
  // Warn if adding beyond expected hunting type count
  const expected = expectedHunterCount.value
  if (expected != null && participants.value.length >= expected) {
    init({
      message: `Package hunting type is ${packageHuntingType.value} (${expected} hunter${expected > 1 ? 's' : ''}). Adding more hunters than expected.`,
      color: 'warning'
    })
  }

  // Each independent hunter gets 100% (package price is per-person)
  participants.value.push({
    _uid: participantUidCounter++,
    entity_id: null,
    entity_name: '',
    participant_type: 'additional',
    is_independent: true,
    dependent_on_participant_id: null,
    share_percentage: 100,
    notes: '',
  })

  // Redistribute shares
  redistributeShares()
}

const removeParticipant = (idx: number) => {
  const removedId = additionalParticipants.value[idx]?._uid
  const realIdx = participants.value.findIndex(p => p._uid === removedId)
  if (realIdx !== -1) {
    participants.value.splice(realIdx, 1)
    // Clear any dependent_on references to removed participant
    for (const p of participants.value) {
      if (p.dependent_on_participant_id === removedId) {
        p.dependent_on_participant_id = null
      }
    }
    redistributeShares()

    // Warn if below expected hunting type count
    const expected = expectedHunterCount.value
    if (expected != null && participants.value.length < expected) {
      init({
        message: `Package hunting type is ${packageHuntingType.value} (${expected} hunter${expected > 1 ? 's' : ''}). Currently ${participants.value.length} — consider adding more.`,
        color: 'warning'
      })
    }
  }
}

const redistributeShares = () => {
  const all = participants.value
  if (all.length === 0) return

  // Each independent hunter pays 100% of the per-person package price.
  // The package amount is already priced per hunting type (e.g. 2x1 = per-person rate).
  // Dependent hunters (companions/kids) pay 0%.
  const independentParticipants = all.filter(p => p.is_independent)
  const dependentParticipants = all.filter(p => !p.is_independent)

  for (const p of dependentParticipants) {
    p.share_percentage = 0
  }
  for (const p of independentParticipants) {
    p.share_percentage = 100
  }
}

const onParticipantEntityChange = (p: Participant) => {
  const entity = entityOptions.value.find(e => e.value === p.entity_id)
  p.entity_name = entity?.label || ''
}

const getDependencyOptions = (currentParticipant: Participant) => {
  // Only independent hunters can be depended on (no chain dependencies)
  return participants.value
    .filter(p => p._uid !== currentParticipant._uid && p.entity_id && p.is_independent)
    .map(p => ({
      value: p._uid,
      label: p.entity_name || `Hunter (ID: ${p.entity_id})`,
    }))
}

// Auto-set dependent_on when a hunter is not independent and there's only one option,
// and clear invalid dependency selections (e.g. if the depended-on hunter became non-independent)
watch(
  () => participants.value.map(p => ({ uid: p._uid, indep: p.is_independent, dep: p.dependent_on_participant_id, eid: p.entity_id })),
  () => {
    for (const p of participants.value) {
      if (!p.is_independent) {
        const options = getDependencyOptions(p)
        const validUids = new Set(options.map(o => o.value))
        // Clear dependency if currently selected option is no longer valid
        if (p.dependent_on_participant_id && !validUids.has(p.dependent_on_participant_id)) {
          p.dependent_on_participant_id = null
        }
        // Auto-select if only one option available
        if (!p.dependent_on_participant_id && options.length === 1) {
          p.dependent_on_participant_id = options[0].value
        }
      }
    }
  },
  { deep: true }
)

// ─── Species Type Mapping (dynamic from API) ───
// Uses the `subtype` field from the full package species (sales-package-sets/{id})
const isMainSpecies = (speciesId: number): boolean => {
  const sp = fullPackageSpecies.value.find((s: any) => s.species_id === speciesId)
  return sp?.subtype === 'MAIN_SPECIE'
}
const isNormalSpecies = (speciesId: number): boolean => {
  const sp = fullPackageSpecies.value.find((s: any) => s.species_id === speciesId)
  return sp?.subtype === 'NORMAL_SPECIE'
}

// Fetch all system species (for normal species selection)
const fetchAllSpecies = async () => {
  try {
    const response = await axios.get(
      `${apiBaseUrl}/settings/trophy-fees/species`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    const dataArray = Array.isArray(response.data?.data) ? response.data.data :
                      Array.isArray(response.data) ? response.data : []
    speciesOptions.value = dataArray.map((species: any) => ({
      value: species.id,
      text: species.name,
      scientific_name: species.scientific_name || ''
    }))
  } catch (error) {
    console.error('Error fetching species:', error)
  }
}

const fetchEntities = async () => {
  loadingEntities.value = true
  try {
    const response = await axios.get(
      import.meta.env.VITE_APP_BASE_URL + 'entities/creation-metadata',
      { headers: { 'Content-Type': 'application/json' } }
    )
    const payload = response.data?.data || response.data || {}
    const dataArray = Array.isArray(payload.entities) ? payload.entities :
                      Array.isArray(response.data) ? response.data : []
    entityOptions.value = dataArray.map((e: any) => ({
      value: e.id,
      label: e.full_name || e.name || `Entity #${e.id}`,
    }))
  } catch (error) {
    console.error('Error fetching entities for participants:', error)
  } finally {
    loadingEntities.value = false
  }
}

const tabs = [
  { key: 'species', label: 'Species', icon: 'fa fa-paw' },
  { key: 'participants', label: 'Participants', icon: 'fa fa-users' },
  { key: 'extras', label: 'Extras', icon: 'fa fa-hiking' },
  { key: 'review', label: 'Review', icon: 'fa fa-clipboard-check' }
]

// PDF generation state (preview download)
const previewRef = ref<HTMLElement | null>(null)
const generatingPdf = ref(false)

const downloadPreviewPdf = async () => {
  generatingPdf.value = true
  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 36
    let cursorY = 40

    // Header
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('ENQUIRY PREVIEW', pageWidth / 2, cursorY, { align: 'center' })
    cursorY += 18

    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 12

    // Top meta (preview-only): render as a single-row table with three columns (Date | Created By | Areas)
    const metaHeader = ['Date', 'Created By', 'Areas']
    const metaValues = [
      new Date().toISOString().split('T')[0],
      form.email || (props.customerData?.email) || 'Not provided',
      getAreaLabel(form.area) || 'Not provided'
    ]
    autoTable(pdf, {
      startY: cursorY,
      head: [metaHeader],
      body: [metaValues],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 160 }, 2: { cellWidth: pageWidth - margin * 2 - 260 } }
    })
    cursorY = (pdf as any).lastAutoTable.finalY + 12

    // Client Information (render as table in preview PDF)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Client Information', margin, cursorY)
    cursorY += 8
    const clientRows = [
      ['Client Name:', displayOrNotProvided(form.full_name || props.customerData?.full_name)],
      ['Phone:', displayOrNotProvided(form.phone || props.customerData?.phone)],
      ['Country:', displayOrNotProvided(getItemLabel(countryItems.value, form.country))],
      ['Email:', displayOrNotProvided(form.email || props.customerData?.email)],
      ['Nationality:', displayOrNotProvided(getItemLabel(nationalityItems.value, form.nationality))],
      ['Address:', displayOrNotProvided(form.address || props.customerData?.address)]
    ]
    autoTable(pdf, {
      startY: cursorY,
      head: [['Field', 'Value']],
      body: clientRows.map(r => ({ k: r[0], v: String(r[1]) })),
      theme: 'grid',
      tableWidth: pageWidth - margin * 2,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
      columns: [{ header: 'Field', dataKey: 'k' }, { header: 'Value', dataKey: 'v' }],
      columnStyles: { 0: { cellWidth: 160, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 160, overflow: 'linebreak' } }
    })
    cursorY = (pdf as any).lastAutoTable.finalY + 12

    // Season & Package (show package + hunting type in preview PDF)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Season & Package', margin, cursorY)
    cursorY += 8
    const packageLabel = getItemLabel(packageItems.value, form.priceListId) || 'No package selected'
    const huntingTypeLabel = (currentSalesPackage.value && currentSalesPackage.value.hunting_type) || (packagesOptions.value.find((p: any) => p.value === form.priceListId)?.selfItem?.hunting_type) || 'Not provided'
    const seasonPackageRows = [
      ['Season:', displayOrNotProvided(getItemLabel(seasonItems.value, form.season))],
      ['Package:', displayOrNotProvided(packageLabel)],
      ['Hunting Type:', displayOrNotProvided(huntingTypeLabel)]
    ]
    autoTable(pdf, {
      startY: cursorY,
      head: [['Field', 'Value']],
      body: seasonPackageRows.map(r => ({ k: r[0], v: String(r[1]) })),
      theme: 'grid',
      tableWidth: pageWidth - margin * 2,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
      columns: [{ header: 'Field', dataKey: 'k' }, { header: 'Value', dataKey: 'v' }],
      columnStyles: { 0: { cellWidth: 140, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 140, overflow: 'linebreak' } }
    })
    cursorY = (pdf as any).lastAutoTable.finalY + 12

    // Schedule & Hunt Party
    pdf.setFont('helvetica', 'bold')
    pdf.text('Schedule & Hunt Party', margin, cursorY)
    cursorY += 8
    const prefRows = [
      ['Preferred Date:', displayOrNotProvided(formatReviewDate(form.start_date))],
      ['Days:', displayOrNotProvided(form.no_of_days)],
      ['End Date:', displayOrNotProvided(formatReviewDate(calculatedEndDate.value))],
      ['Hunting Area:', displayOrNotProvided(getAreaLabel(form.area))],
      ['Participants:', displayOrNotProvided(participants.value.length)],
      ['Experience:', displayOrNotProvided(form.prev_experience)]
    ]
    autoTable(pdf, {
      startY: cursorY,
      head: [['Field', 'Value']],
      body: prefRows.map(r => ({ k: r[0], v: String(r[1]) })),
      theme: 'grid',
      tableWidth: pageWidth - margin * 2,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
      columns: [{ header: 'Field', dataKey: 'k' }, { header: 'Value', dataKey: 'v' }],
      columnStyles: { 0: { cellWidth: 160, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 160, overflow: 'linebreak' } }
    })
    cursorY = (pdf as any).lastAutoTable.finalY + 12

    // Participants section
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Participants (${participants.value.length})`, margin, cursorY)
    cursorY += 8
    if (participants.value.length > 0) {
      const participantRows = participants.value.map((p: any, i: number) => {
        const role = p.participant_type === 'primary' ? 'Primary' : `Hunter #${i + 1}`
        const name = p.entity_name || 'Not selected'
        const status = p.is_independent ? 'Independent' : 'Dependent'
        const dependentOn = !p.is_independent && p.dependent_on_participant_id
          ? (participants.value.find((dp: any) => dp._uid === p.dependent_on_participant_id)?.entity_name || '—')
          : '—'
        return [role, name, status, dependentOn, `${p.share_percentage}%`]
      })
      autoTable(pdf, {
        startY: cursorY,
        head: [['Role', 'Name', 'Status', 'Dependent On', 'Share %']],
        body: participantRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 140 },
          2: { cellWidth: 80 },
          3: { cellWidth: 120 },
          4: { cellWidth: 60, halign: 'right' }
        }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 4
      // Total share
      const totalShare = participants.value.reduce((sum: number, p: any) => sum + (Number(p.share_percentage) || 0), 0)
      const pdfExpectedTotal = (expectedHunterCount.value != null && expectedHunterCount.value > 1) ? expectedHunterCount.value * 100 : 100
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(totalShare === pdfExpectedTotal ? 40 : 200, totalShare === pdfExpectedTotal ? 160 : 0, totalShare === pdfExpectedTotal ? 40 : 0)
      pdf.text(`Total Share: ${totalShare.toFixed(2)}% / ${pdfExpectedTotal}%`, pageWidth - margin, cursorY, { align: 'right' })
      pdf.setTextColor(0, 0, 0)
      cursorY += 16
    } else {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('No participants added', margin, cursorY)
      cursorY += 16
    }

    // Main Species — render as a simple grid table (Item | Qty | Priority)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Main Species (${speciesObjects.value.length})`, margin, cursorY)
    cursorY += 8
    const speciesRows = speciesObjects.value.map((s: any) => [
      s.name || 'Unknown',
      String(s.quantity || 1),
      (s.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE')
    ])
    if (speciesRows.length > 0) {
      autoTable(pdf, {
        startY: cursorY,
        head: [['Item', 'Qty', 'Priority']],
        body: speciesRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 240 }, 1: { halign: 'center', cellWidth: 50 }, 2: { cellWidth: pageWidth - margin * 2 - 300 } }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 12
    } else {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('No species selected', margin, cursorY)
      cursorY += 16
    }

    // Normal Species
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(`Normal Species (${normalSpeciesObjects.value.length})`, margin, cursorY)
    cursorY += 8
    const normalSpeciesRows = normalSpeciesObjects.value.map((s: any) => [
      s.name || 'Unknown',
      String(s.quantity || 1),
      (s.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE')
    ])
    if (normalSpeciesRows.length > 0) {
      autoTable(pdf, {
        startY: cursorY,
        head: [['Item', 'Qty', 'Priority']],
        body: normalSpeciesRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 240 }, 1: { halign: 'center', cellWidth: 50 }, 2: { cellWidth: pageWidth - margin * 2 - 300 } }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 12
    } else {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('No normal species selected', margin, cursorY)
      cursorY += 16
    }

    // Safari Extras — simple grid table (Item | Qty | Duration)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Safari Extras (${selectedSafariExtras.value.length})`, margin, cursorY)
    cursorY += 8

    const resolveExtraMeta = (e: any) => {
      const lookup = safariExtrasOptions.value.find((s: any) => String(s.id) === String(e.id) || String(s.safari_extra_id) === String(e.id))
      return {
        unit: Number(e.amount ?? lookup?.amount ?? lookup?.price ?? 0),
        currency_symbol: e.currency_symbol || lookup?.currency_symbol || lookup?.currency?.symbol || '$',
        pricing_unit: e.pricing_unit || lookup?.pricing_unit || lookup?.unit || ''
      }
    }

    const extrasTableBody: any[] = []

    selectedSafariExtras.value.forEach((extra: any) => {
      const meta = resolveExtraMeta(extra)
      const baseCount = Number(extra.quantity || 1)
      const duration = computeEffectiveDuration(extra)
      const durationDisplay = duration != null ? `${duration} day${duration > 1 ? 's' : ''}` : '-'

      extrasTableBody.push([
        extra.name || 'Safari Extra',
        String(baseCount),
        durationDisplay
      ])
    })

    if (extrasTableBody.length > 0) {
      autoTable(pdf, {
        startY: cursorY,
        head: [['Item', 'Qty', 'Duration']],
        body: extrasTableBody,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 260 }, 1: { halign: 'center', cellWidth: 50 }, 2: { cellWidth: pageWidth - margin * 2 - 320 } }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 8
    } else {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('No safari extras selected', margin, cursorY)
      cursorY += 16
    }

    // Pricing is intentionally omitted from the enquiry preview PDF — pricing/ totals are handled at Quotation stage.
    // (do not render Pricing table or Totals in the preview PDF)
    cursorY += 4

    // Remarks
    pdf.setFont('helvetica', 'bold')
    pdf.text('Remarks', margin, cursorY)
    cursorY += 12
    pdf.setFont('helvetica', 'normal')
    const remarksText = form.remarks || ''
    pdf.setFontSize(9)
    pdf.text(remarksText || '—', margin, cursorY, { maxWidth: pageWidth - margin * 2 })

    // Save
    const filename = `sales-enquiry-${(form.full_name || 'enquiry').toString().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.pdf`
    pdf.save(filename)
    init({ message: `Preview PDF generated (${filename})`, color: 'success' })
  } catch (err) {
    console.error('Error generating server-style preview PDF:', err)
    init({ message: 'Failed to generate preview PDF', color: 'danger' })
  } finally {
    generatingPdf.value = false
  }
}

// Get count for tab badge
const getTabCount = (tabKey: string): number => {
  switch (tabKey) {
    case 'extras':
      return selectedSafariExtras.value.length
    case 'participants':
      return participants.value.length
    default:
      return 0
  }
}

const isEditMode = ref(false)
const editingInquiryId = ref<number | null>(null)

const selectedSafariExtras = ref<any[]>([])
const safariExtraErrors = ref<Record<string, {quantity?: string, item_durations?: string}>>({})
const safariExtrasOptions = ref<any[]>([])
const trophyFees = ref<any[]>([])
const companionCosts = ref<any[]>([])
const selectedPackageDetail = ref<any>(null)

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const salesPackagesSpecies = computed(() => settingsStore.salesPackagesSpecies)
const huntLengths = ref<any[]>([])

// Computed items for Vueform select elements
const countryItems = computed(() =>
  countries.value.map((c: any) => ({ value: c.value, label: c.text }))
)

const nationalityItems = computed(() =>
  nationality.value.map((n: any) => ({ value: n.value, label: n.text }))
)

const seasonItems = computed(() =>
  seasonsOptions.value.map((s: any) => ({
    value: s.value,
    label: s.selfItem ? `${s.text} - ${formatDateRange(s.selfItem.start_at, s.selfItem.end_at)}` : s.text,
    selfItem: s.selfItem
  }))
)

const priceStructureItems = computed(() =>
  priceStructuresOptions.value.map((p: any) => ({
    value: p.value,
    label: p.text,
    selfItem: p.selfItem
  }))
)

const packageItems = computed(() =>
  packagesOptions.value.map((pkg: any) => ({
    value: pkg.value,
    label: pkg.selfItem
      ? `${pkg.text}, ${pkg.selfItem?.price_structure?.location || 'N/A'}, ${pkg.selfItem?.hunting_type || 'N/A'}, ${pkg.selfItem?.hunt_length || 0} days, ${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || '0'}`
      : pkg.text,
    selfItem: pkg.selfItem
  }))
)


const gameAreaItems = computed(() =>
  areasOptions.value
    // Accept both "game" and "GAME" and also check selfItem.type when available
    .filter((a: any) => (a.type && String(a.type).toLowerCase() === 'game') || (a.selfItem && String(a.selfItem.type).toLowerCase() === 'game'))
    .map((a: any) => ({
      value: a.value,
      // For GAME locations prefer the hunting area name and append the location code when available
      label: (a.selfItem && String(a.selfItem.type).toLowerCase() === 'game' && a.selfItem.hunting_areas && a.selfItem.hunting_areas.length > 0)
        ? `${a.selfItem.hunting_areas[0].name}${a.selfItem.code ? ` (${a.selfItem.code})` : ''}`
        : a.text,
      selfItem: a.selfItem
    }))
)

const speciesItems = computed(() => {
  const useAreaSpecies = !!form.area && areaSpeciesLoaded.value
  const source = useAreaSpecies ? selectedAreaSpecies.value : speciesOptions.value
  return source.map((s: any) => ({ value: s.value, label: s.text }))
})

// Grouped species options for multiselect (with category headers for display only)
const groupedSpeciesOptions = computed(() => {
  // Show only MAIN_SPECIE species from the full package species
  if (!fullPackageSpecies.value || fullPackageSpecies.value.length === 0) return []

  const excludedIds = new Set([
    ...speciesObjects.value.map((s: any) => s.species_id || s.id),
  ])

  const mainSpecies = fullPackageSpecies.value.filter((s: any) => s.subtype === 'MAIN_SPECIE' && !excludedIds.has(s.species_id))
  return mainSpecies.map((s: any) => ({
    value: s.species_id,
    label: s.name,
    name: s.name,
    scientificName: s.scientific_name || '',
    isHeader: false,
    isCategoryHeader: false,
    regulatoryQty: s.quantity || 0,
    category: 'Species',
  }))
})

// Grouped NORMAL species options – shows NORMAL_SPECIE species from the full package
// Excludes species already in the normal list
const groupedNormalSpeciesOptions = computed(() => {
  if (!fullPackageSpecies.value || fullPackageSpecies.value.length === 0) return []

  const excludedIds = new Set([
    ...normalSpeciesObjects.value.map((s: any) => s.species_id || s.id),
  ])

  const normalSpecies = fullPackageSpecies.value.filter((s: any) => s.subtype === 'NORMAL_SPECIE' && !excludedIds.has(s.species_id))
  return normalSpecies.map((s: any) => ({
    value: s.species_id,
    label: s.name,
    name: s.name,
    scientificName: s.scientific_name || '',
    isHeader: false,
    isCategoryHeader: false,
    regulatoryQty: s.quantity || 0,
    category: 'Species',
  }))
})

const safariExtrasItems = computed(() =>
  safariExtrasOptions.value.map((item: any) => ({
    value: item.id,
    label: `${item.name} - ${item.description || ''}`,
    item: item
  }))
)




const selectedUpgradeFees = computed(() => {
  if (!form.priceListId) return []
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  return pkg?.selfItem?.upgrade_fees || []
})


const currentUserId = computed(() => {
  const rawId = authStore.user?.id
  const parsed = rawId ? Number(rawId) : null
  return Number.isFinite(parsed) ? parsed : null
})

const huntDuration = computed(() => form.no_of_days || 0)

const calculatedEndDate = computed(() => {
  if (!form.start_date || !form.no_of_days) return null
  const start = new Date(form.start_date)
  const end = new Date(start)
  end.setDate(start.getDate() + Number(form.no_of_days) - 1)
  return end.toISOString().split('T')[0]
})



// Helper function to get label from items array
const getItemLabel = (items: any[], value: any) => {
  if (!value) return 'N/A'
  const item = items.find((i: any) => i.value === value)
  return item?.label || 'N/A'
}

const getPackagePriceStructureId = (pkg: any) =>
  pkg?.selfItem?.price_structure_id ||
  pkg?.selfItem?.price_structure?.id ||
  pkg?.selfItem?.price_structure_detail?.price_structure_id ||
  pkg?.selfItem?.price_structure_detail?.price_structure?.id ||
  null



// Helper function to flatten species with category grouping (similar to account selection in RequisitionForm)
const flattenSpeciesWithCategories = (speciesByCategory: any[]): any[] => {
  const options: any[] = []

  speciesByCategory.forEach((categoryGroup: any) => {
    const category = categoryGroup.category || 'Uncategorized'
    const speciesList = categoryGroup.species || []

    if (speciesList.length > 0) {
      // Add category header (non-selectable)
      options.push({
        label: category.toUpperCase(),
        value: null,
        $isDisabled: true,
        isHeader: true,
        isCategoryHeader: true,
        category: category
      })

      // Add species under this category
      speciesList.forEach((species: any) => {
        options.push({
          label: species.name,
          value: species.id,
          name: species.name,
          category: category,
          regulatoryQty: species.quantity || 0,
          description: species.description || '',
          scientificName: species.scientific_name || '',
          isChild: true,
          searchText: `${species.name} ${species.scientific_name || ''} ${category}`
        })
      })
    }
  })

  return options
}

// Get species selection object for multiselect
const getSpeciesSelection = () => {
  if (!selectedSpeciesId.value) return null
  const allOptions = groupedSpeciesOptions.value
  return allOptions.find((opt: any) => opt.value === selectedSpeciesId.value) || null
}

// Set species selection from multiselect
const setSpeciesSelection = (selected: any) => {
  selectedSpeciesId.value = selected?.value || null
}

// Get regulatory quantity for a species
const getRegulatoryQuantity = (speciesId: number): number => {
  // First check regulatory_package species_by_category
  if (currentSalesPackage.value?.regulatory_package?.species_by_category) {
    for (const catGroup of currentSalesPackage.value.regulatory_package.species_by_category) {
      const species = (catGroup.species || []).find((s: any) => s.id === speciesId)
      if (species) return species.quantity || 0
    }
  }

  // Fallback: check fullPackageSpecies (from sales-package-sets/{id})
  const fullSpec = fullPackageSpecies.value.find((s: any) => s.species_id === speciesId)
  if (fullSpec) return fullSpec.quantity || 0

  return 0
}

// Return a readable hunting area label (map numeric IDs to names)
const getAreaLabel = (area: any): string | null => {
  if (!area && area !== 0) return null
  if (typeof area === 'number') {
    const opt = areasOptions.value.find((a: any) => a.value === area)
    return opt ? opt.text : String(area)
  }
  return String(area)
}

// Prefer 'Not provided' for optional empty fields (used in template)
const displayOrNotProvided = (val: any) => {
  if (val === null || val === undefined) return 'Not provided'
  if (typeof val === 'string') {
    const s = val.trim()
    if (s === '' || s.toUpperCase() === 'N/A') return 'Not provided'
    return s
  }
  return val
}


// Customer data is now received from CustomerSelectionModal via props
// No need for customer type change handlers here

const onSeasonChange = async (value: any) => {
  form.season = value
  dateConflictWarning.value = ''
  form.start_date = null
  form.no_of_days = 0

  if (!value) {
    seasonMinDate.value = null
    seasonMaxDate.value = null
    bookedDates.value = []
    return
  }

  const season = seasonsOptions.value.find((s: any) => s.value === value)
  if (season?.selfItem) {
    if (season.selfItem.start_at) seasonMinDate.value = new Date(season.selfItem.start_at)
    if (season.selfItem.end_at) seasonMaxDate.value = new Date(season.selfItem.end_at)
  }

  await fetchBookedDates(value)
}

const onPackageChange = async (value: any) => {
  form.priceListId = value

  console.log('onPackageChange - value:', value)

  if (!value) {
    speciesObjects.value = []
    normalSpeciesObjects.value = []
    currentSalesPackage.value = null
    regulatoryPackageSpecies.value = []
    customizedPackageSpecies.value = []
    fullPackageSpecies.value = []
    return
  }

  // Extract sales package data from packagesOptions for species selection
  const pkgOption = packagesOptions.value.find((p: any) => p.value === value)
  console.log('onPackageChange - pkgOption:', pkgOption)
  console.log('onPackageChange - pkgOption.selfItem:', pkgOption?.selfItem)
  console.log('onPackageChange - sales_package:', pkgOption?.selfItem?.sales_package)

  if (pkgOption?.selfItem?.sales_package) {
    currentSalesPackage.value = pkgOption.selfItem.sales_package
    regulatoryPackageSpecies.value = currentSalesPackage.value.regulatory_package.species_by_category
    customizedPackageSpecies.value = currentSalesPackage.value.customized_species_by_category
    console.log('onPackageChange - SET currentSalesPackage:', currentSalesPackage.value)
    console.log('onPackageChange - regulatory species:', regulatoryPackageSpecies.value)
    console.log('onPackageChange - customized species:', customizedPackageSpecies.value)

    // Fetch FULL package species (with subtypes) from sales-package-sets/{id}
    const salesPackageSetId = currentSalesPackage.value.id
    if (salesPackageSetId) {
      try {
        const fullPkgResponse = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}settings/sales-package-sets/${salesPackageSetId}`,
          { headers: { 'Content-Type': 'application/json' } }
        )
        const fullPkgData = fullPkgResponse.data?.data || fullPkgResponse.data
        if (fullPkgData?.species && Array.isArray(fullPkgData.species)) {
          fullPackageSpecies.value = fullPkgData.species.map((item: any) => ({
            id: item.id,
            species_id: item.species?.id || item.species_id,
            name: item.species?.name || item.name,
            scientific_name: item.species?.scientific_name || '',
            subtype: item.species?.subtype || item.subtype || 'MAIN_SPECIE',
            quantity: item.quantity || 1,
          }))
          console.log('onPackageChange - fullPackageSpecies:', fullPackageSpecies.value.length, 'species loaded')
        }
      } catch (error) {
        console.error('Error fetching full package species:', error)
        fullPackageSpecies.value = []
      }
    }
  } else {
    currentSalesPackage.value = null
    regulatoryPackageSpecies.value = []
    customizedPackageSpecies.value = []
    fullPackageSpecies.value = []
    console.log('onPackageChange - NO sales_package found!')
  }

  await populateFormFromPackage()
}

const onPriceStructureChange = (value: any) => {
  form.priceStructureId = value
  if (form.priceListId) {
    form.priceListId = null
    speciesObjects.value = []
    trophyFees.value = []
    companionCosts.value = []
    selectedPackageDetail.value = null
  }
  if (vueformRef.value) {
    vueformRef.value.update({
      priceStructureId: form.priceStructureId,
      priceListId: form.priceListId
    })
  }
}

const onStartDateChange = (newValue: any) => {
  // Vueform @change event passes the value directly
  const dateValue = newValue?.target?.value ?? newValue
  form.start_date = dateValue || null
  checkBookedDateConflict()
}

const onDaysChange = (newValue: any) => {
  form.no_of_days = Number(newValue) || 0
  checkBookedDateConflict()
}


const syncFormData = () => {
  if (!vueformRef.value) return
  const data = vueformRef.value.data

  form.full_name = data.full_name || ''
  form.nick_name = data.nick_name || ''
  form.country = data.country || null
  form.nationality = data.nationality || null
  form.email = data.email || ''
  form.phone = data.phone || ''
  form.phone_additional = data.phone_additional || ''
  form.address = data.address || ''
  form.season = data.season || null
  form.priceListId = data.priceListId || null
  form.priceStructureId = data.priceStructureId || null
  form.start_date = data.start_date || null
  form.no_of_days = Number(data.no_of_days) || 0
  form.area = data.area || null
  form.no_of_participants = participants.value.length || 1
  form.prev_experience = data.prev_experience || ''
  form.special_requests = data.special_requests || ''
}

// Handle form submission from Vueform
const handleSubmit = async (formData: any, form$: any) => {
  syncFormData()
  await submit()
}

// Add species to list
const addSpeciesToList = () => {
  if (!currentSalesPackage.value?.regulatory_package) {
    init({ message: 'Please select a hunting package first to load species.', color: 'warning' })
    return
  }
  if (!selectedSpeciesId.value) {
    init({ message: 'Please select a species.', color: 'warning' })
    return
  }

  const quantity = Number(speciesQuantity.value) || 1

  if (quantity <= 0) {
    init({ message: 'Quantity must be greater than zero.', color: 'warning' })
    return
  }

  const exists = speciesObjects.value.some((species: { species_id: any }) => species.species_id === selectedSpeciesId.value)
  if (!exists) {
    // Find species in grouped options (has category and regulatory data)
    const speciesOption = groupedSpeciesOptions.value.find((opt: any) => opt.value === selectedSpeciesId.value && !opt.isHeader)

    if (!speciesOption) {
      init({ message: 'Selected species not found in package.', color: 'danger' })
      return
    }

    // Get regulatory quantity for this species
    const regulatoryQty = getRegulatoryQuantity(selectedSpeciesId.value)

    const speciesName = speciesOption.name || speciesOption.label || 'Unknown'

    speciesObjects.value.push({
      species_id: selectedSpeciesId.value,
      name: speciesName,
      quantity: quantity,
      regulatoryQty: regulatoryQty,
      category: speciesOption.category || 'General',
      priority: 'NICE_TO_HAVE',
      notes: '',
      fromPackage: false,
    })

    // Reset selection
    selectedSpeciesId.value = null
    speciesQuantity.value = 1

    // Show warning if exceeding regulatory quantity
    if (regulatoryQty > 0 && quantity > regulatoryQty) {
      init({
        message: `Added "${speciesName}" to species list. Warning: Requested quantity (${quantity}) exceeds regulatory quantity (${regulatoryQty}).`,
        color: 'warning'
      })
    } else {
      init({ message: `Added "${speciesName}" to species list`, color: 'success' })
    }
  } else {
    init({ message: 'This species is already added. Update the quantity instead.', color: 'warning' })
  }
}

// ─── Normal Species Functions ───

const getNormalSpeciesSelection = () => {
  if (!selectedNormalSpeciesId.value) return null
  const allOptions = groupedNormalSpeciesOptions.value
  return allOptions.find((opt: any) => opt.value === selectedNormalSpeciesId.value) || null
}

const setNormalSpeciesSelection = (selected: any) => {
  selectedNormalSpeciesId.value = selected?.value || null
}

const addNormalSpeciesToList = () => {
  if (!currentSalesPackage.value?.regulatory_package) {
    init({ message: 'Please select a hunting package first to load species.', color: 'warning' })
    return
  }
  if (!selectedNormalSpeciesId.value) {
    init({ message: 'Please select a normal species.', color: 'warning' })
    return
  }

  const quantity = Number(normalSpeciesQuantity.value) || 1
  if (quantity <= 0) {
    init({ message: 'Quantity must be greater than zero.', color: 'warning' })
    return
  }

  // Check it's not already in normal species (same species CAN be in both main and normal)
  const existsInNormal = normalSpeciesObjects.value.some((s: any) => s.species_id === selectedNormalSpeciesId.value)

  if (existsInNormal) {
    init({ message: 'This species is already added to normal species. Update the quantity instead.', color: 'warning' })
    return
  }

  const speciesOption = groupedNormalSpeciesOptions.value.find((opt: any) => opt.value === selectedNormalSpeciesId.value && !opt.isHeader)
  if (!speciesOption) {
    init({ message: 'Selected species not found in available species list.', color: 'danger' })
    return
  }

  // Get regulatory quantity for this species (from package)
  const regulatoryQty = getRegulatoryQuantity(selectedNormalSpeciesId.value)
  const speciesName = speciesOption.name || speciesOption.label || 'Unknown'

  normalSpeciesObjects.value.push({
    species_id: selectedNormalSpeciesId.value,
    name: speciesName,
    quantity: quantity,
    regulatoryQty: regulatoryQty,
    category: speciesOption.category || 'General',
    priority: 'NICE_TO_HAVE',
    notes: '',
    fromPackage: false,
    isNormalSpecies: true,
  })

  selectedNormalSpeciesId.value = null
  normalSpeciesQuantity.value = 1

  // Show warning if exceeding regulatory quantity
  if (regulatoryQty > 0 && quantity > regulatoryQty) {
    init({
      message: `Added "${speciesName}" to normal species list. Warning: Requested quantity (${quantity}) exceeds regulatory quantity (${regulatoryQty}).`,
      color: 'warning'
    })
  } else {
    init({ message: `Added "${speciesName}" to normal species list`, color: 'success' })
  }
}

const deleteNormalSpecies = (index: number) => {
  const removed = normalSpeciesObjects.value.splice(index, 1)
  const removedId = removed?.[0]?.species_id ?? removed?.[0]?.id ?? null
  const newSet = new Set<string|number>()
  selectedNormalSpeciesIndices.value.forEach((id) => {
    if (id !== removedId) newSet.add(id)
  })
  selectedNormalSpeciesIndices.value = newSet
}

const toggleNormalSpeciesSelection = (index: number) => {
  const item = normalSpeciesObjects.value[index]
  const idKey = item?.species_id ?? item?.id ?? index
  const newSet = new Set(selectedNormalSpeciesIndices.value)
  if (newSet.has(idKey)) newSet.delete(idKey)
  else newSet.add(idKey)
  selectedNormalSpeciesIndices.value = newSet
}

const toggleSelectAllNormalSpecies = () => {
  if (selectedNormalSpeciesIndices.value.size === normalSpeciesObjects.value.length) {
    selectedNormalSpeciesIndices.value = new Set()
    return
  }
  const allIds = new Set<string|number>()
  normalSpeciesObjects.value.forEach((s: any, i: number) => {
    allIds.add(s.species_id ?? s.id ?? i)
  })
  selectedNormalSpeciesIndices.value = allIds
}

const deleteSelectedNormalSpecies = () => {
  if (selectedNormalSpeciesIndices.value.size === 0) return
  showNormalDeleteConfirm.value = true
}

const confirmDeleteNormalSpecies = () => {
  const idsToRemove = new Set(selectedNormalSpeciesIndices.value)
  const count = idsToRemove.size
  const indicesToRemove: number[] = []
  normalSpeciesObjects.value.forEach((s: any, idx: number) => {
    const idKey = s.species_id ?? s.id ?? idx
    if (idsToRemove.has(idKey)) indicesToRemove.push(idx)
  })

  indicesToRemove.sort((a, b) => b - a)
  indicesToRemove.forEach(i => normalSpeciesObjects.value.splice(i, 1))

  selectedNormalSpeciesIndices.value = new Set()
  showNormalDeleteConfirm.value = false
  init({ message: `${count} normal species removed`, color: 'success' })
}

const incrementNormalQuantity = (index: number) => {
  if (normalSpeciesObjects.value[index]) {
    normalSpeciesObjects.value[index].quantity++
  }
}

const decrementNormalQuantity = (index: number) => {
  if (normalSpeciesObjects.value[index] && normalSpeciesObjects.value[index].quantity > 1) {
    normalSpeciesObjects.value[index].quantity--
  }
}

const toggleNormalPriority = (index: number) => {
  const s = normalSpeciesObjects.value[index]
  if (s) {
    s.priority = s.priority === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE'
  }
}


const currentStep = ref(0)

const hasInput = (value: any) => {
  if (typeof value === 'string') return value.trim().length > 0
  return !!value
}

const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 0:
      // Customer data is pre-validated by CustomerSelectionModal, just check entity_id exists
      return !!(props.customerData?.entity_id)
    case 1:
      return (
        hasInput(form.season) &&
        !!(form.no_of_days && form.no_of_days > 0) &&
        hasInput(form.area) &&
        !!(huntDuration.value && huntDuration.value > 0) &&
        speciesObjects.value.length > 0
      )
    case 2:
      return true
    default:
      return false
  }
})

// Validation for submit button
const canSubmit = computed(() => {
  // Customer info may come either from selected customer (props.customerData.entity_id)
  // or from filled form fields (full_name, country, nationality, email)
  const hasCustomerInfo = !!props.customerData?.entity_id || (
    hasInput(form.full_name) &&
    hasInput(form.country) &&
    hasInput(form.nationality) &&
    hasInput(form.email)
  )

  const participantsValid = participantValidationErrors.value.length === 0
  const hunterCountValid = !participantCountMismatch.value

  return (
    hasCustomerInfo &&
    hasInput(form.season) &&
    // Area may be optional in some cases, but require when available
    // (keep existing behavior for now)
    hasInput(form.area) &&
    form.no_of_days > 0 &&
    speciesObjects.value.length > 0 &&
    participantsValid &&
    hunterCountValid
  )
})

const filteredPackagesOptions = computed(() => {
  if (!form.season) return []
  if (!form.priceStructureId) return []
  return packagesOptions.value.filter((pkg: any) => {
    const structureId = getPackagePriceStructureId(pkg)
    return String(structureId || '') === String(form.priceStructureId || '')
  })
})

const filteredPackageItems = computed(() =>
  filteredPackagesOptions.value.map((pkg: any) => ({
    value: pkg.value,
    label: pkg.selfItem
      ? `${pkg.text}, ${pkg.selfItem?.price_structure?.location || 'N/A'}, ${pkg.selfItem?.hunting_type || 'N/A'}, ${pkg.selfItem?.hunt_length || 0} days, ${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || '0'}`
      : pkg.text,
    selfItem: pkg.selfItem
  }))
)



const resetEditMode = () => {
  isEditMode.value = false
  editingInquiryId.value = null
  speciesObjects.value = []
  selectedSafariExtras.value = []
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null
  currentStep.value = 0
  form.remarks = ''
  form.prev_experience = ''
  form.budget_min = null
  form.budget_max = null
  form.payment_method_id = null
  form.special_requests = ''
  form.priceStructureId = null
  // Reset Vueform
  if (vueformRef.value) {
    vueformRef.value.reset()
  }
}

const cancelWizard = () => {
  resetEditMode()
  emit('cancel')
}


const previousStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const goToStep = (stepIndex: number) => {
  if (stepIndex <= currentStep.value) currentStep.value = stepIndex
}

const showStepValidationError = () => {
  const stepMessages: { [key: number]: string } = {
    0: 'Please fill in all customer information fields (Name, Country, Nationality, Email, Phone, Address).',
    1: 'Please select season, hunting area, enter the number of days, and add at least one species.',
  }
  init({ message: stepMessages[currentStep.value] || 'Please complete all required fields.', color: 'warning' })
}

const formatDate = (dateString: string | any): string => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const formatReviewDate = (date: any): string => {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}


const formatDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 'N/A'
  const start = new Date(startDate)
  const end = new Date(endDate)
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${startFormatted} - ${endFormatted}`
}

const getSequenceLabel = (sequence: number) => {
  const labels: { [key: number]: string } = { 1: '1st', 2: '2nd', 3: '3rd' }
  return labels[sequence] || `${sequence}th`
}

const apiBaseUrl = (() => {
  const base = import.meta.env.VITE_APP_BASE_URL || ''
  return base.replace(/\/+$/, '')
})()

// Fetch all creation metadata from single endpoint
const fetchCreationMetadata = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/sales-enquiries/creation-metadata`, {
      headers: { 'Content-Type': 'application/json' },
    })

    const data = response.data?.data || response.data || {}

    // Map entities (customers)
    if (Array.isArray(data.entities)) {
      existingCustomersOptions.value = data.entities.map((entity: any) => {
        let email = ''
        let phone = ''
        let address = ''

        if (Array.isArray(entity.contacts)) {
          entity.contacts.forEach((contact: any) => {
            const contactType = String(contact.type || '').toLowerCase()
            if (contactType === 'email') {
              email = contact.contact || ''
            } else if (contactType === 'phone_number' || contactType === 'phone') {
              phone = contact.contact || ''
            } else if (contactType === 'address') {
              address = contact.contact || ''
            }
          })
        }

        return {
          value: entity.id,
          text: entity.full_name || 'Unknown',
          selfItem: {
            ...entity,
            email,
            phone,
            address,
          },
        }
      })
    }

    // Map seasons
    if (Array.isArray(data.seasons)) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      seasonsOptions.value = data.seasons
        .filter((item: any) => {
          if (!item.end_at) return true
          const endDate = new Date(item.end_at)
          endDate.setHours(23, 59, 59, 999)
          return endDate >= today
        })
        .map((item: any) => ({ value: item.id, text: item.name, selfItem: item }))
    }

    // Map locations (countries and hunting areas)
    if (Array.isArray(data.locations)) {
      countries.value = data.locations
        .filter((loc: any) => loc.type === 'COUNTRY')
        .map((country: any) => ({ value: country.id, text: country.name }))

      areasOptions.value = data.locations.map((item: any) => ({
        value: item.id,
        text: item.name,
        type: item.type,
        selfItem: item
      }))
    }

    // Map hunting areas separately if needed
    if (Array.isArray(data.hunting_areas)) {
      const huntingAreas = data.hunting_areas.map((item: any) => ({
        value: item.id,
        text: item.name,
        type: item.type,
        selfItem: item
      }))
      // Merge with locations if not already there
      areasOptions.value = [...areasOptions.value, ...huntingAreas]
    }

    // Map species
    if (Array.isArray(data.species)) {
      speciesOptions.value = data.species.map((species: any) => ({
        value: species.id,
        text: species.name,
        scientific_name: species.scientific_name || ''
      }))
    }

    // Map safari extras
    if (Array.isArray(data.safari_extras)) {
      safariExtrasOptions.value = data.safari_extras
    }

    // Map price structures with their details and sales packages - EXACT API structure only
    if (Array.isArray(data.price_structures)) {
      console.log('fetchCreationMetadata - price_structures received:', data.price_structures)
      packagesOptions.value = []
      priceStructuresOptions.value = data.price_structures.map((ps: any) => ({
        value: ps.id,
        text: ps.name,
        selfItem: ps
      }))

      // Flatten price structure details from all price structures
      data.price_structures.forEach((priceStructure: any) => {
        console.log('Processing priceStructure:', priceStructure)
        if (Array.isArray(priceStructure.details)) {
          console.log('  Details:', priceStructure.details)
          priceStructure.details.forEach((detail: any) => {
            console.log('    Detail:', detail)
            console.log('    Detail sales_packages:', detail.sales_packages)
            packagesOptions.value.push({
              value: detail.id,
              text: detail.name || `${priceStructure.name} - ${detail.hunt_length || ''}`,
              selfItem: {
                ...detail,
                price_structure_id: priceStructure.id,
                price_structure: priceStructure,
                // Include the first sales package if available
                sales_package: detail.sales_packages && detail.sales_packages.length > 0
                  ? detail.sales_packages[0]
                  : null
              }
            })
          })
        }
      })
      console.log('fetchCreationMetadata - final packagesOptions:', packagesOptions.value)
    }

    // Map currencies
    if (Array.isArray(data.currencies)) {
      // Store currencies if you have a ref for them
      // currencies.value = data.currencies
    }

    // Map users
    if (Array.isArray(data.users)) {
      // Store users if you have a ref for them
      // users.value = data.users
    }

    // Nationalities can be derived from countries or use a separate endpoint if needed
    nationality.value = countries.value

  } catch (error) {
    console.error('Error loading creation metadata:', error)
    // Fallback to individual endpoints if metadata endpoint fails
  }
}

// Fallback to individual endpoints if metadata endpoint fails









const fetchBookedDates = async (seasonId: number, areaId?: number) => {
  loadingBookedDates.value = true
  bookedDates.value = []

  try {
    const params = new URLSearchParams()
    if (seasonId) params.append('season_id', seasonId.toString())
    if (areaId) params.append('area_id', areaId.toString())
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await axios.get(`/sales/booked-dates${queryString}`)

    if (response.status === 200) {
      const dataArray = Array.isArray(response.data) ? response.data : response.data.data || []
      bookedDates.value = dataArray.map((item: any) => ({
        start_date: item.start_date,
        end_date: item.end_date,
        client_name: item.client_name || item.entity?.full_name || 'Unknown Client',
        area_id: item.area_id,
      }))
    }
  } catch (error) {
    console.error('Error fetching booked dates:', error)
  } finally {
    loadingBookedDates.value = false
  }
}

const checkBookedDateConflict = () => {
  dateConflictWarning.value = ''
  if (!form.start_date || !form.no_of_days || form.no_of_days <= 0) return

  const start = new Date(form.start_date)
  const endDate = calculatedEndDate.value
  if (!endDate) return
  const end = new Date(endDate)

  const conflict = bookedDates.value.find((booking: any) => {
    const bStart = new Date(booking.start_date)
    const bEnd = new Date(booking.end_date)
    return start <= bEnd && end >= bStart
  })

  if (conflict) {
    dateConflictWarning.value = `Selected dates overlap with booking for ${conflict.client_name}`
  }
}

const populateFormFromPackage = async () => {
  if (!form.priceListId) return
  if (!currentSalesPackage.value) return

  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  if (!pkg?.selfItem) return

  const pkgData = pkg.selfItem

  // Reset all package-related data
  speciesObjects.value = []
  normalSpeciesObjects.value = []
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null

  console.log('populateFormFromPackage - pkgData:', pkgData)
  console.log('populateFormFromPackage - currentSalesPackage:', currentSalesPackage.value)

  // Get area from price_structure.location
  form.area = pkgData.price_structure?.location || pkgData.price_structure?.location_name || null
  if (vueformRef.value) {
    vueformRef.value.update({ area: form.area })
  }

  // Get duration from regulatory_package.duration
  const duration = currentSalesPackage.value.regulatory_package.duration
  if (!form.no_of_days) {
    form.no_of_days = Number(duration)
    if (vueformRef.value) {
      vueformRef.value.update({ no_of_days: duration })
    }
  }

  // Auto-populate MAIN and NORMAL species from the package
  fullPackageSpecies.value.forEach((s: any) => {
    const regulatoryQty = getRegulatoryQuantity(s.species_id)
    if (s.subtype === 'MAIN_SPECIE') {
      speciesObjects.value.push({
        species_id: s.species_id,
        name: s.name,
        quantity: s.quantity || 1,
        regulatoryQty: regulatoryQty,
        category: 'Species',
        notes: '',
        priority: 'NICE_TO_HAVE',
        fromPackage: true,
      })
    } else if (s.subtype === 'NORMAL_SPECIE') {
      normalSpeciesObjects.value.push({
        species_id: s.species_id,
        name: s.name,
        quantity: s.quantity || 1,
        regulatoryQty: regulatoryQty,
        category: 'Species',
        notes: '',
        priority: 'NICE_TO_HAVE',
        fromPackage: true,
        isNormalSpecies: true,
      })
    }
  })

  const mainCount = speciesObjects.value.length
  const normalCount = normalSpeciesObjects.value.length
  init({ message: `Package species loaded (${mainCount} main, ${normalCount} normal).`, color: 'success' })

  // ─── Auto-adjust participants based on hunting_type ───
  const huntingType = pkgData.hunting_type || currentSalesPackage.value?.hunting_type || null
  if (huntingType) {
    const htMatch = String(huntingType).match(/^(\d+)\s*x\s*\d+$/i)
    if (htMatch) {
      const expectedCount = Number(htMatch[1])
      const currentCount = participants.value.length

      if (expectedCount > currentCount) {
        // Add additional participants to reach expected count
        for (let i = currentCount; i < expectedCount; i++) {
          participants.value.push({
            _uid: participantUidCounter++,
            entity_id: null,
            entity_name: '',
            participant_type: 'additional',
            is_independent: true,
            dependent_on_participant_id: null,
            share_percentage: 0,
            notes: '',
          })
        }
        redistributeShares()
        init({
          message: `Hunting type ${huntingType}: auto-added ${expectedCount - currentCount} participant(s) to match ${expectedCount} hunter(s).`,
          color: 'info'
        })
      } else if (expectedCount < currentCount) {
        // Remove excess additional participants (keep primary + first N-1 additional)
        const excess = currentCount - expectedCount
        for (let i = 0; i < excess; i++) {
          const lastAdditionalIdx = participants.value.length - 1
          const lastP = participants.value[lastAdditionalIdx]
          if (lastP && lastP.participant_type === 'additional') {
            // Clear dependency references
            for (const p of participants.value) {
              if (p.dependent_on_participant_id === lastP._uid) {
                p.dependent_on_participant_id = null
              }
            }
            participants.value.splice(lastAdditionalIdx, 1)
          }
        }
        redistributeShares()
        init({
          message: `Hunting type ${huntingType}: adjusted to ${expectedCount} hunter(s). Removed ${excess} extra participant(s).`,
          color: 'info'
        })
      }
    }
  }
}

const deleteFromStorage = (index: number) => {
  const removed = speciesObjects.value.splice(index, 1)
  // Rebuild selectedSpeciesIndices using stable ids (remove any removed ids)
  const removedId = removed?.[0]?.species_id ?? removed?.[0]?.id ?? null
  const newSet = new Set<string|number>()
  selectedSpeciesIndices.value.forEach((id) => {
    if (id !== removedId) newSet.add(id)
  })
  selectedSpeciesIndices.value = newSet
} 

const toggleSpeciesSelection = (index: number) => {
  const item = speciesObjects.value[index]
  const idKey = item?.species_id ?? item?.id ?? index
  const newSet = new Set(selectedSpeciesIndices.value)
  if (newSet.has(idKey)) newSet.delete(idKey)
  else newSet.add(idKey)
  selectedSpeciesIndices.value = newSet
} 

const toggleSelectAllSpecies = () => {
  if (selectedSpeciesIndices.value.size === speciesObjects.value.length) {
    selectedSpeciesIndices.value = new Set()
    return
  }
  const allIds = new Set<string|number>()
  speciesObjects.value.forEach((s: any, i: number) => {
    allIds.add(s.species_id ?? s.id ?? i)
  })
  selectedSpeciesIndices.value = allIds
} 

const deleteSelectedSpecies = async () => {
  if (selectedSpeciesIndices.value.size === 0) return
  const count = selectedSpeciesIndices.value.size
  const result = await Swal.fire({
    title: 'Delete Selected Species?',
    html: `Are you sure you want to remove <strong>${count}</strong> selected species?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `Yes, delete ${count} species`,
    cancelButtonText: 'Cancel'
  })
  if (!result.isConfirmed) return

  // Map selected ids back to current indices, sort descending and remove
  const idsToRemove = new Set(selectedSpeciesIndices.value)
  const indicesToRemove: number[] = []
  speciesObjects.value.forEach((s: any, idx: number) => {
    const idKey = s.species_id ?? s.id ?? idx
    if (idsToRemove.has(idKey)) indicesToRemove.push(idx)
  })

  indicesToRemove.sort((a, b) => b - a)
  indicesToRemove.forEach(i => speciesObjects.value.splice(i, 1))

  // Clear selection
  selectedSpeciesIndices.value = new Set()
  init({ message: `${count} species removed`, color: 'success' })
} 

const clearAllSpecies = async () => {
  if (speciesObjects.value.length === 0) return
  const count = speciesObjects.value.length
  const result = await Swal.fire({
    title: 'Clear All Species?',
    html: `Are you sure you want to remove all <strong>${count}</strong> main species?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `Yes, clear all`,
    cancelButtonText: 'Cancel'
  })
  if (!result.isConfirmed) return
  speciesObjects.value = []
  selectedSpeciesIndices.value = new Set()
  init({ message: `All ${count} species removed`, color: 'success' })
}

const incrementQuantity = (index: number) => {
  if (speciesObjects.value[index]) {
    speciesObjects.value[index].quantity++

    // Warn if exceeding regulatory quantity
    const species = speciesObjects.value[index]
    if (species.regulatoryQty && species.quantity > species.regulatoryQty) {
      init({
        message: `Warning: "${species.name}" quantity (${species.quantity}) exceeds regulatory quantity (${species.regulatoryQty})`,
        color: 'warning'
      })
    }
  }
}

const decrementQuantity = (index: number) => {
  if (speciesObjects.value[index] && speciesObjects.value[index].quantity > 1) {
    speciesObjects.value[index].quantity--
  }
}

const togglePriority = (index: number) => {
  if (speciesObjects.value[index]) {
    speciesObjects.value[index].priority =
      speciesObjects.value[index].priority === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE'
  }
}

const toggleSafariExtraPriority = (index: number) => {
  if (selectedSafariExtras.value[index]) {
    selectedSafariExtras.value[index].priority =
      selectedSafariExtras.value[index].priority === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE'
  }
}

const addSafariExtra = () => {
  // Add an editable empty row at the TOP so the newest row shows above. Duplicates allowed only where allowed.
  selectedSafariExtras.value.unshift({
    id: null,
    name: null,
    description: null,
    priority: 'NICE_TO_HAVE',
    quantity: 1,
    item_durations: null,
    notes: null,
    fromPackage: false,
    // pricing metadata placeholders (filled when user selects type)
    amount: 0,
    currency_code: 'USD',
    currency_symbol: '',
    pricing_unit: null,
  })

  // Wait for DOM update then focus the new row's select control
  nextTick(() => {
    const sel = document.querySelector('.items-list .list-item select') as HTMLSelectElement | null
    if (sel) {
      sel.focus()
      // open native select (some browsers support focus+keydown, leave as-is)
    }
  })
}

const removeSafariExtra = (index: number) => {
  const removed = selectedSafariExtras.value.splice(index, 1)
  if (removed.length > 0) init({ message: `Removed "${removed[0].name}" from safari extras`, color: 'info' })
}


const submit = async () => {
  saving.value = true

  // Sync form data from Vueform
  syncFormData()

  // Validate per-item durations (when provided and applicable)
  for (const extra of selectedSafariExtras.value) {
    if (isDurationRelevant(extra)) {
      if (extra.item_durations != null && (!Number.isInteger(Number(extra.item_durations)) || Number(extra.item_durations) < 1)) {
        init({ message: `Duration for "${extra.name || 'unnamed extra'}" must be an integer ≥ 1`, color: 'warning' })
        saving.value = false
        return
      }
    } else {
      // Ensure non-duration items do not carry a duration value
      extra.item_durations = null
    }
  }

  // Ensure each added extra has an Extra Type selected and valid quantity
  // Validate extras and enforce duplicate rules (duplicates allowed only for Observer & Cameraman)
  for (let i = 0; i < selectedSafariExtras.value.length; i++) {
    const extra = selectedSafariExtras.value[i]
    if (!extra.id) {
      init({ message: `Please select an Extra type for row ${i + 1}`, color: 'warning' })
      saving.value = false
      return
    }

    // Duplicate prevention: only Observer and Cameraman can appear multiple times
    const nameLower = String(extra.name || extra.description || '').toLowerCase()
    const duplicate = selectedSafariExtras.value.some((s: any, idx: number) => idx !== i && s.id && extra.id && String(s.id) === String(extra.id))
    const duplicateAllowed = nameLower.includes('observer') || nameLower.includes('camera') || nameLower.includes('cameraman')
    if (duplicate && !duplicateAllowed) {
      init({ message: `"${extra.name || 'This extra'}" cannot be added more than once. Duplicates are allowed only for Observer and Cameraman.`, color: 'warning' })
      saving.value = false
      return
    }

    // Quantity validation only for extras that show quantity
    if (isQuantityRelevant(extra)) {
      if (!Number.isInteger(Number(extra.quantity)) || Number(extra.quantity) < 1) {
        init({ message: `Quantity for "${extra.name || 'unnamed extra'}" must be ≥ 1`, color: 'warning' })
        saving.value = false
        return
      }
    } else {
      // ensure non-quantity items always default to 1
      extra.quantity = 1
    }
  }

  if (speciesObjects.value.length === 0) {
    init({ message: 'Please add at least one species.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.area) {
    init({ message: 'Please select a hunting area.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.season) {
    init({ message: 'Please select a season.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.no_of_days || form.no_of_days <= 0) {
    init({ message: 'Please provide the number of days for the hunt.', color: 'warning' })
    saving.value = false
    return
  }



  if (!currentUserId.value) {
    init({ message: 'Unable to detect the logged-in user. Please re-login and try again.', color: 'warning' })
    saving.value = false
    return
  }

  // Build the request payload according to backend SalesEnquiryController expectations
  const requestdata: any = {
    // Core enquiry fields
    date: form.start_date || null,
    user_id: 1, // Hardcoded to user ID 1
    season_id: form.season || null,
    status: isEditMode.value ? undefined : 'NEW', // Only set status on create
    remarks: form.remarks || null,
    price_structure_detail_id: form.priceListId || null, // Include selected package/price structure

    // Areas - backend expects array of { location_id }
    // Look up the area ID from the area name if form.area is a string
    areas: form.area ? (() => {
      // If form.area is already a number (ID), use it directly
      if (typeof form.area === 'number') {
        return [{ location_id: form.area }]
      }
      // If form.area is a string (name), look up the ID
      const areaOption = areasOptions.value.find((a: any) => a.text === form.area)
      return areaOption ? [{ location_id: areaOption.value }] : []
    })() : [],

    // Item preferences (species only) - safari extras are sent in a dedicated `safari_extras` array below
    item_preferences: [
      ...speciesObjects.value.map((item: any) => ({
        item_id: item.species_id || item.item_id || item.id,
        desired_quantity: item.quantity || 1,
        priority: item.priority || 'NICE_TO_HAVE',
        notes: item.notes || null,
        item_subtype: 'MAIN_SPECIE',
      })),
      ...normalSpeciesObjects.value.map((item: any) => ({
        item_id: item.species_id || item.item_id || item.id,
        desired_quantity: item.quantity || 1,
        priority: item.priority || 'NICE_TO_HAVE',
        notes: item.notes || null,
        item_subtype: 'NORMAL_SPECIE',
      }))
    ],

    // Safari extras - persistent preferences (send item_durations only when explicitly set)
    safari_extras: selectedSafariExtras.value.map((extra: any) => {
      const duration = computeEffectiveDuration(extra)
      return {
        item_id: extra.id,
        desired_quantity: Number(extra.quantity || 1),
        priority: extra.priority || 'NICE_TO_HAVE',
        notes: extra.notes || null,
        ...(duration != null ? { item_durations: Number(duration) } : {})
      }
    }),

    // Note: Safari extras are intentionally sent as `safari_extras[]` to persist per-item duration preferences on the server.


    // Preference - backend uses no_of_participants
    preference: {
      prev_experience: form.prev_experience || null,
      no_of_participants: participants.value.length || 1,
      preferred_start_date: form.start_date || null,
      no_of_days: form.no_of_days || null,
      budget_min: form.budget_min || null,
      budget_max: form.budget_max || null,
      payment_method_id: form.payment_method_id || null,
      special_requests: form.special_requests || null,
    },

    // Participants
    participants: participants.value.map(p => ({
      entity_id: p.entity_id,
      participant_type: p.participant_type,
      is_independent: p.is_independent,
      dependent_on_participant_id: !p.is_independent ? (p.dependent_on_participant_id || null) : null,
      share_percentage: p.share_percentage,
      notes: p.notes || null,
    })),
  }

  // Get entity_id directly from customerData prop (passed from CustomerSelectionModal)
  const entityId = props.customerData?.entity_id

  if (!entityId) {
    console.error('No entity_id found in customerData!')
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Customer information is missing. Please select or create a customer first.',
    })
    return
  }

  requestdata.entity_id = entityId

  try {

    let response: any
    if (isEditMode.value && editingInquiryId.value) {
      response = await salesEnquiryService.update(editingInquiryId.value, requestdata)
      if (response.success) {
        saving.value = false
        Swal.fire({
          title: 'Updated!',
          text: 'Sales enquiry updated successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        }).then(() => {
          resetEditMode()
          emit('saved')
        })
        return
      }
    } else {
      response = await salesEnquiryService.create(requestdata)
      if (response.success) {
        saving.value = false
        Swal.fire({
          title: 'Success!',
          text: response.message || 'Sales enquiry created successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        }).then(() => {
          resetEditMode()
          emit('saved')
        })
        return
      }
    }
  } catch (error: any) {
    console.error('Error saving sales inquiry:', error)
    if (error.response) {
      // Map validation errors to inline fields where possible
      const data = error.response.data || {}
      if (error.response.status === 422 && data && typeof data === 'object') {
        for (const key in data) {
          // look for safari_extras.0.item_durations or safari_extras[0].item_durations
          const m = key.match(/safari_extras(?:\.|\[)(\d+)(?:\]|\.)?(.*)?/)
          if (m) {
            const idx = Number(m[1])
            const fieldRaw = m[2] ? m[2].replace(/^\./, '') : ''
            const extra = selectedSafariExtras.value[idx]
            if (extra) {
              const _k = Number(extra.id)
              safariExtraErrors.value[_k] = safariExtraErrors.value[_k] || {}
              // Only allow known keys to be used for indexing so TS can validate the access
              type SafariExtraErrorKey = 'quantity' | 'item_durations'
              const allowedField: SafariExtraErrorKey = (fieldRaw === 'quantity' || fieldRaw === 'item_durations') ? (fieldRaw as SafariExtraErrorKey) : 'item_durations'
              safariExtraErrors.value[_k][allowedField] = Array.isArray(data[key]) ? data[key].join(', ') : String(data[key])
            }
          }
        }
      }

      const errors = handleErrors(error.response)
      init({ message: '\n' + errors.map((e: any, i: number) => `${i + 1}. ${e}`).join('\n'), color: 'danger' })
    } else if (error.request) {
      init({ message: 'No response from server. Please check your network connection.', color: 'danger' })
    } else {
      init({ message: error.message || 'An unexpected error occurred', color: 'danger' })
    }
  } finally {
    saving.value = false
  }
} 

// Handle duration input safely (allow blank to mean inherit)
let pricingChangeTimeout: any = null
// Determine whether the `quantity` control should be shown for an extra
const isQuantityRelevant = (item: any) => {
  const name = item?.name || item?.item_name || item?.description || ''
  if (!name) return false
  const n = String(name).toLowerCase()
  // Quantity relevant for: observer, cameraman, ammo, gun permit, change of area
  if (n.includes('observer') || n.includes('camera') || n.includes('cameraman')) return true
  if (n.includes('ammo') || n.includes('additional gun permit') || n.includes('gun permit') || n.includes('change of area')) return true
  // Baiting vehicle & firearm hire - quantity not shown (per your table)
  if (n.includes('baiting vehicle') || n.includes('baiting') || n.includes('firearm') || n.includes('firearm hire')) return false
  // Default to true (safe) for other items
  return true
}

// Determine whether the `duration` input should be shown for an extra
const isDurationRelevant = (item: any) => {
  const name = item?.name || item?.item_name || item?.description || ''
  if (!name) return false
  const n = String(name).toLowerCase()
  // Items explicitly _not_ duration-based
  if (n.includes('additional gun permit') || n.includes('gun permit') || n.includes('ammo') || n.includes('change of area')) return false
  // Per-day items or known duration items
  if (n.includes('per day') || n.includes('perday')) return true
  if (n.includes('firearm') || n.includes('baiting') || n.includes('photographic') || n.includes('camera') || n.includes('cameraman') || n.includes('observer')) return true
  return false
}

const computeEffectiveDuration = (extra: any) => {
  // Prefer explicit duration if present and > 0
  const raw = extra.item_durations
  const n = (raw != null && Number(raw) > 0) ? Number(raw) : null
  if (n != null) return n

  // Use user-entered number of days if present
  const userDays = Number(form.no_of_days) > 0 ? Number(form.no_of_days) : null
  if (isDurationRelevant(extra)) {
    if (userDays != null) return userDays

    // Fall back to selected package's hunt length if available
    const pkgDays = (currentSalesPackage.value && (currentSalesPackage.value.hunt_length_days || currentSalesPackage.value.no_of_days)) || null
    if (pkgDays != null && Number(pkgDays) > 0) return Number(pkgDays)
  }

  return null
}

// Return a placeholder text for the duration input — shows inherited length when item_durations is blank
const getDurationPlaceholder = (extra: any) => {
  if (!extra) return 'Days'
  if (extra.item_durations != null && String(extra.item_durations) !== '') return 'Days'
  const effective = computeEffectiveDuration(extra)
  return effective != null ? `Inherits: ${effective} day${effective > 1 ? 's' : ''}` : 'Days'
}

const scheduleEmitPricingChanged = () => {
  if (pricingChangeTimeout) clearTimeout(pricingChangeTimeout)
  pricingChangeTimeout = setTimeout(() => {
    const items = selectedSafariExtras.value.map((extra: any) => {
      const duration = computeEffectiveDuration(extra)
      return {
        item_type: 'EXTRA',
        item_id: extra.id,
        quantity: Number(extra.quantity || 1),
        ...(duration != null ? { item_durations: Number(duration) } : {})
      }
    })
    emit('pricing-changed', { items })
  }, 350)
}

const updateSafariExtraQuantity = (extra: any, delta: number) => {
  extra.quantity = Math.max(1, Number(extra.quantity || 1) + delta)
  // clear quantity errors if present
  const _k = Number(extra.id)
  if (safariExtraErrors.value[_k]) safariExtraErrors.value[_k].quantity = undefined
  scheduleEmitPricingChanged()
}

const handleDurationInput = (e: any, extra: any) => {
  const v = e.target.value
  if (v === '' || v === null) {
    extra.item_durations = null
  } else {
    const n = Math.floor(Number(v) || 0)
    extra.item_durations = n >= 1 ? n : 1
  }
  // clear duration errors
  const _k = Number(extra.id)
  if (safariExtraErrors.value[_k]) safariExtraErrors.value[_k].item_durations = undefined
  scheduleEmitPricingChanged()
} 

// Called when a per-row Extra Type is selected/changed
const onSafariExtraTypeChange = (extra: any) => {
  if (!extra || !extra.id) {
    // user cleared selection
    extra.name = null
    extra.description = null
    return
  }

  const opt = safariExtrasItems.value.find((o: any) => o.value === extra.id)
  if (!opt || !opt.item) return
  const item = opt.item

  // Prevent duplicates for items other than Observer/Cameraman
  const index = selectedSafariExtras.value.indexOf(extra)
  const nameLower = String(item.name || item.description || '').toLowerCase()
  const duplicate = selectedSafariExtras.value.some((s: any, idx: number) => idx !== index && s.id && String(s.id) === String(extra.id))
  const duplicateAllowed = nameLower.includes('observer') || nameLower.includes('camera') || nameLower.includes('cameraman')
  if (duplicate && !duplicateAllowed) {
    init({ message: `"${item.name || 'This extra'}" may only be added once. Duplicates allowed only for Observer and Cameraman.`, color: 'warning' })
    // reset selection
    extra.id = null
    extra.name = null
    extra.description = null
    return
  }

  extra.name = item.name || opt.label || ''
  extra.description = item.description || ''
  // preserve existing quantity if present, otherwise default to 1
  extra.quantity = extra.quantity || 1

  // For extras that should not expose quantity, force quantity to 1
  if (!isQuantityRelevant(extra)) extra.quantity = 1

  // set pricing/duration defaults from catalog when available
  extra.amount = item.amount ?? item.price ?? extra.amount ?? 0
  extra.currency_code = item.currency_code || item.currency?.code || extra.currency_code || 'USD'
  extra.currency_symbol = item.currency_symbol || item.currency?.symbol || extra.currency_symbol || ''
  extra.pricing_unit = item.pricing_unit || item.unit || extra.pricing_unit || null

  // if the item defines a default duration, use it only if the row has no explicit duration
  if ((extra.item_durations == null || extra.item_durations === '') && (item.item_durations ?? item.effective_duration)) {
    extra.item_durations = item.item_durations ?? item.effective_duration ?? null
  }

  // ensure per-item error holder exists (keyed by item id)
  const _k = Number(extra.id)
  safariExtraErrors.value[_k] = safariExtraErrors.value[_k] || {}
  scheduleEmitPricingChanged()
}

const getSpeciesNameById = (speciesId: number): string | null => {
  if (!speciesId) return null
  const source = !!form.area && areaSpeciesLoaded.value ? selectedAreaSpecies.value : speciesOptions.value
  const species = source.find((s: any) => s.value === speciesId)
  return species ? species.text : null
}

const loadInquiryForEdit = (rowData: any) => {
  isEditMode.value = true
  editingInquiryId.value = rowData.id

  const item = rowData.selfitem || rowData

  // Load entity/client information
  form.full_name = item.entity?.full_name || rowData.name || ''
  form.nick_name = item.entity?.nick_name || ''

  const countryId = item.entity?.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) form.country = countryOption.value
  } else if (item.entity?.country) {
    const countryOption = countries.value.find((c: any) => c.text === item.entity.country)
    if (countryOption) form.country = countryOption.value
  }

  const nationalityId = item.entity?.nationality_id
  if (nationalityId) {
    const nationalityOption = nationality.value.find((n: any) => n.value === nationalityId)
    if (nationalityOption) form.nationality = nationalityOption.value
  } else if (item.entity?.nationality) {
    const nationalityOption = nationality.value.find((n: any) => n.text === item.entity.nationality)
    if (nationalityOption) form.nationality = nationalityOption.value
  }

  // Load contacts from entity (contact_type_id: 1=email, 2=phone, 3=address)
  if (item.entity?.contacts && Array.isArray(item.entity.contacts)) {
    let phoneFound = false
    item.entity.contacts.forEach((contact: any) => {
      const contactType = String(contact.type || '').toLowerCase()
      const contactTypeId = contact.contact_type_id

      if (contactTypeId === 1 || contactType === 'email') {
        form.email = contact.contact || ''
      } else if (contactTypeId === 2 || contactType === 'phone_number' || contactType === 'phone') {
        if (!phoneFound) {
          form.phone = contact.contact || ''
          phoneFound = true
        } else {
          form.phone_additional = contact.contact || ''
        }
      } else if (contactTypeId === 3 || contactType === 'address') {
        form.address = contact.contact || ''
      }
    })
  }

  // Load enquiry remarks
  form.remarks = item.remarks || ''

  // Load preference data - backend uses no_of_participants
  const prefs = item.preference || rowData.preference || {}
  form.no_of_observers = 0
  form.no_of_companions = 0
  form.no_of_days = prefs.no_of_days || 0
  form.prev_experience = prefs.prev_experience || ''
  form.budget_min = prefs.budget_min || null
  form.budget_max = prefs.budget_max || null
  form.payment_method_id = prefs.payment_method_id || null
  form.special_requests = prefs.special_requests || ''

  // Load participants from backend (if available)
  const backendParticipants = item.participants || []
  if (backendParticipants.length > 0) {
    participants.value = backendParticipants.map((bp: any) => ({
      _uid: participantUidCounter++,
      entity_id: bp.entity_id || null,
      entity_name: bp.entity?.full_name || entityOptions.value.find((e: any) => e.value === bp.entity_id)?.label || '',
      participant_type: bp.participant_type || 'additional',
      is_independent: bp.is_independent !== false,
      dependent_on_participant_id: bp.dependent_on_participant_id || null,
      share_percentage: bp.share_percentage ?? 0,
      notes: bp.notes || '',
    }))
  } else {
    // Fallback: create single primary from no_of_participants
    const count = prefs.no_of_participants || 1
    participants.value = [{
      _uid: participantUidCounter++,
      entity_id: null,
      entity_name: '',
      participant_type: 'primary' as const,
      is_independent: true,
      dependent_on_participant_id: null,
      share_percentage: count === 1 ? 100 : Math.round((100 / count) * 100) / 100,
      notes: '',
    }]
  }
  form.no_of_hunters = participants.value.length
  form.no_of_participants = participants.value.length

  // Load dates from preference
  if (prefs.preferred_start_date) {
    form.start_date = prefs.preferred_start_date.split('T')[0]
  }
  form.no_of_days = prefs.no_of_days || 0

  // Load areas - backend returns areas with location_id and location object
  // Set area as the location name for display (read-only field)
  const locationId = item.areas?.[0]?.location_id
  const locationName = item.areas?.[0]?.location?.name
  if (locationName) {
    // Use the location name directly
    form.area = locationName
  } else if (locationId) {
    // If only ID is available, look up the name
    const areaOption = areasOptions.value.find((a: any) => a.value === locationId)
    if (areaOption) form.area = areaOption.text
  }

  // Load season
  if (item.season) {
    const seasonOption = seasonsOptions.value.find((s: any) => s.value === item.season.id || s.text === item.season.name)
    if (seasonOption) form.season = seasonOption.value
  }

  form.priceListId = null
  form.priceStructureId =
    item.price_structure_id ||
    item.price_structure?.id ||
    item.price_structure_detail?.price_structure_id ||
    item.price_structure_detail?.price_structure?.id ||
    null

  // Load item_preferences (game preferences) - backend uses item_id
  // Separate MAIN_SPECIE vs NORMAL_SPECIE based on item_subtype field
  speciesObjects.value = []
  normalSpeciesObjects.value = []
  const itemPreferences = item.item_preferences || []
  itemPreferences.forEach((pref: any) => {
    const itemId = pref.item_id || pref.species_item_id
    const itemName = pref.item_name || getSpeciesNameById(itemId) || 'Unknown'
    const subtype = (pref.item_subtype || pref.subtype || '').toString().toUpperCase()

    const speciesEntry = {
      species_id: itemId,
      name: itemName,
      quantity: pref.desired_quantity || 1,
      priority: pref.priority || 'NICE_TO_HAVE',
      notes: pref.notes || '',
      fromPackage: false,
    }

    if (subtype === 'NORMAL_SPECIE') {
      normalSpeciesObjects.value.push({ ...speciesEntry, isNormalSpecies: true })
    } else {
      speciesObjects.value.push(speciesEntry)
    }
  })

  selectedSafariExtras.value = []



  // Populate saved safari extras preferences - prefer explicit `item.safari_extras` when available
  let safariPrefs: any[] = []
  if (Array.isArray(item.safari_extras) && item.safari_extras.length) {
    safariPrefs = item.safari_extras
  } else {
    safariPrefs = itemPreferences.filter((p: any) => {
      return safariExtrasOptions.value.some((se: any) => String(se.id) === String(p.item_id) || String(se.safari_extra_id) === String(p.item_id))
    }) || []
  }

  safariPrefs.forEach((pref: any) => {
    const safariOpt = safariExtrasOptions.value.find((se: any) => String(se.id) === String(pref.item_id) || String(se.safari_extra_id) === String(pref.item_id))
    selectedSafariExtras.value.push({
      id: pref.item_id,
      name: pref.item_name || safariOpt?.name || 'Extra',
      description: pref.notes || safariOpt?.description || '',
      priority: pref.priority || 'NICE_TO_HAVE',
      quantity: pref.desired_quantity || 1,
      item_durations: pref.item_durations ?? null,
      notes: pref.notes || null,
      fromPackage: false,
    })
    // ensure error holder exists for loaded extras
    const _key = Number(pref.item_id)
    safariExtraErrors.value[_key] = safariExtraErrors.value[_key] || {}
  })

  // Update Vueform with loaded values
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: form.full_name,
      country: form.country,
      nationality: form.nationality,
      email: form.email,
      phone: form.phone,
      phone_additional: form.phone_additional,
      address: form.address,
      season: form.season,
      priceListId: form.priceListId,
      priceStructureId: form.priceStructureId,
      start_date: form.start_date,
      no_of_days: form.no_of_days,
      area: form.area,
      no_of_participants: form.no_of_participants,
      prev_experience: form.prev_experience,
      special_requests: form.special_requests
    })
  }

  init({ message: 'Loaded inquiry data for editing', color: 'info' })
}

// Initialize form data from customerData prop
const initializeFromCustomerData = () => {
  if (!props.customerData) return

  const data = props.customerData

  // Populate form fields for display only
  form.full_name = data.full_name || ''
  form.nick_name = data.nick_name || ''
  form.country = data.country || null
  form.nationality = data.nationality || null
  form.email = data.email || ''
  form.phone = data.phone || ''
  form.phone_additional = data.phone_additional || ''
  form.address = data.address || ''

  // Auto-set the client as the primary hunter (the enquiry is for this person)
  if (data.entity_id) {
    const primary = participants.value.find(p => p.participant_type === 'primary')
    if (primary && !primary.entity_id) {
      primary.entity_id = data.entity_id
      primary.entity_name = data.full_name || ''
    }
  }

  // Update Vueform if available
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: form.full_name,
      country: form.country,
      nationality: form.nationality,
      email: form.email,
      phone: form.phone,
      phone_additional: form.phone_additional,
      address: form.address,
    })
  }
}

watch(
  () => props.customerData,
  (newData) => {
    if (newData) {
      initializeFromCustomerData()
    }
  },
  { immediate: true },
)

watch(
  () => props.editRow,
  (row, oldRow) => {
    // Only reset if there was a previous row (not on initial mount)
    if (oldRow !== undefined) {
      resetEditMode()
    }
    if (row) loadInquiryForEdit(row)
  },
  { immediate: true },
)

// Keep participants count in sync with participants list length
watch(
  () => participants.value.length,
  (len) => {
    const n = len || 1
    form.no_of_hunters = n
    form.no_of_participants = n
  }
)


onMounted(async () => {
  // Save original sidebar state and collapse it
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true
  await Promise.all([fetchCreationMetadata(), fetchEntities(), fetchAllSpecies()])
})

// Restore sidebar state when leaving the page
onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --text: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --card: #ffffff;
  --radius: 14px;
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.ps-page {
  min-height: 100%;
  background: #f5f7fb;
}

.content {
  padding: 22px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-head-left h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.crumbs {
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.crumb-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: #eff6ff;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.head-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: 2px solid transparent;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn .btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.btn.ghost {
  border-color: var(--border);
  background: #ffffff;
  color: var(--text);
}

.btn.ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn.primary {
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
}

.btn.primary:hover {
  background: #1e40af !important;
}

/* Ensure the header 'Submit Enquiry' button uses the primary blue and consistent states */
.page-head .head-actions .btn.primary {
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3) !important;
}

.page-head .head-actions .btn.primary:hover:not(:disabled) {
  background: #1e40af !important;
}

.page-head .head-actions .btn.primary:disabled,
.page-head .head-actions .btn.primary[disabled] {
  /* Keep visible when disabled */
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
  opacity: 1 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  filter: none !important;
  pointer-events: none !important;
}

.btn.btn-primary {
  background: var(--primary);
  border-color: var(--primary-dark);
  color: #ffffff;
}

.btn.btn-primary:hover {
  background: var(--primary-dark);
}

.btn.btn-secondary {
  background: #f8fafc;
  border-color: var(--border);
  color: #475569;
}

.btn.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn.btn-success {
  background: #16a34a;
  border-color: #15803d;
  color: #ffffff;
}

.btn.btn-outline-secondary {
  border-color: var(--border);
  background: #ffffff;
  color: #475569;
}

/* Two-column grid layout */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
  align-items: start;
}

.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #dbeafe;
  border: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.panel-title-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Left Panel Form */
.form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafbfc;
}

.form-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.section-icon {
  font-size: 14px;
}

/* Info rows for left panel */
.info-rows {
  padding: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* Tab navigation */
.tabs-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
  border-radius: var(--radius) var(--radius) 0 0;
}

.tabs-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab-btn.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
}

.tab-text {
  font-weight: 600;
}

.tab-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Tab content */
.tab-body {
  padding: 20px;
  background: #fafbfc;
}

.tab-content {
  padding: 20px;
  background: #fafbfc;
}

.content-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.content-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-block {
  margin-bottom: 20px;
}

.section-block:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 2px solid #dbeafe;
}

.section-label i {
  color: var(--primary);
  font-size: 14px;
}

/* Form controls */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.form-row.three-col {
  grid-template-columns: repeat(3, 1fr);
}

.form-row.experience-requests-row {
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-group .form-control,
.form-group .form-select,
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.form-group .form-control:focus,
.form-group .form-select:focus,
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

/* Add species row */
.add-species-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.add-species-row .form-group {
  flex: 1;
}

.add-species-row .form-group:last-of-type {
  flex: 0 0 100px;
}

.btn-add {
  background: var(--primary);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
}

.btn-add:hover {
  background: var(--primary-dark);
}

/* Species list */
.species-list {
  margin-top: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.species-list-header {
  display: grid;
  grid-template-columns: 1fr 100px 100px 60px;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.species-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px 60px;
  gap: 10px;
  padding: 12px 14px;
  align-items: center;
  border-top: 1px solid var(--border-light);
}

.species-row:nth-child(even) {
  background: #fafbfc;
}

.species-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.species-source {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.qty-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.qty-value {
  font-weight: 600;
  font-size: 13px;
  min-width: 24px;
  text-align: center;
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  cursor: pointer;
}

.priority-badge.must-have {
  background: #fef2f2;
  color: #dc2626;
}

.priority-badge.nice-to-have {
  background: #eff6ff;
  color: #2563eb;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #fef2f2;
  border-radius: 6px;
  color: #dc2626;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.remove-btn:hover {
  background: #fee2e2;
}

/* Extras grid */
.extras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.extra-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.extra-card:hover {
  border-color: var(--primary);
}

.extra-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.extra-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.extra-card.selected .extra-checkbox {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
}

.extra-info {
  flex: 1;
}

.extra-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.extra-price {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}

/* Review sections */
.review-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.review-section {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}

.review-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-section-title i {
  color: var(--primary);
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-light);
  font-size: 12px;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item .label {
  color: var(--text-secondary);
}

.review-item .value {
  font-weight: 600;
  color: var(--text);
}

/* Make certain review items span full width and wrap nicely (used for long package names) */
.review-item.full {
  grid-column: 1 / -1;
  align-items: flex-start;
  gap: 12px;
}
.review-item.full .label {
  width: 160px;
  flex-shrink: 0;
}
.review-item.full .value {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  display: block;
  flex: 1 1 auto;
}

.review-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.review-badges .badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
}



/* Species list spacing */
.species-list {
  list-style: disc inside;
  padding-left: 12px;
  margin: 6px 0 0 0;
}
.species-list li {
  margin: 4px 0;
}

/* Extras list */
.extras-list ul {
  list-style: disc inside;
  padding-left: 12px;
  margin: 6px 0 0 0;
}
.extras-list li {
  margin: 4px 0;
}

/* Inner card styles */
.inner-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 14px;
}

.inner-card:last-child {
  margin-bottom: 0;
}

.tabs-card {
  background: #f8fafc;
}

.content-card {
  background: var(--card);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  padding: 14px;
  background: #f8fafc;
  flex-wrap: wrap;
}

.tab {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  outline: none;
}

.tab:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-text {
  font-weight: 600;
}

.tab-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Content header */
.content-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.content-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #dbeafe;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.content-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.content-hint {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Content body */
.content-body {
  padding: 16px 20px;
  background: #fafbfc;
}

/* Field styles */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full-width {
  grid-column: 1 / -1;
}

.lbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.req {
  color: #dc2626;
  font-weight: 700;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input,
.input-wrapper select,
.input-wrapper textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
  font-family: inherit;
}

.input-wrapper input:focus,
.input-wrapper select:focus,
.input-wrapper textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.input-wrapper input:disabled,
.input-wrapper select:disabled,
.input-wrapper textarea:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-wrapper textarea {
  resize: vertical;
  min-height: 80px;
}

/* Vueform date picker */
.vueform-date-wrapper :deep(.vc-popover-content-wrapper) {
  min-width: 100%;
}

.vueform-date-wrapper :deep(.vc-container) {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  background: #ffffff;
}

.vueform-date-wrapper :deep(.vc-pane) {
  width: 100%;
}

.vueform-date-wrapper :deep(.vc-header) {
  padding: 10px 12px;
}

.vueform-date-wrapper :deep(.vc-weekday) {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.vueform-date-wrapper :deep(.vc-day) {
  font-size: 12px;
}

.vueform-date-wrapper :deep(.vc-day-content) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

/* Flatpickr date picker (Vueform) */
.vueform-date-wrapper :deep(.flatpickr-calendar) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.vueform-date-wrapper :deep(.flatpickr-innerContainer),
.vueform-date-wrapper :deep(.flatpickr-rContainer),
.vueform-date-wrapper :deep(.dayContainer) {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

.vueform-date-wrapper :deep(.flatpickr-weekdaycontainer) {
  width: 100% !important;
  max-width: 100% !important;
}

.vueform-date-wrapper :deep(.flatpickr-day) {
  width: calc(100% / 7);
  max-width: none;
}

/* Section divider */
.section-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 20px 0 16px;
  padding: 12px 16px;
  background: #dbeafe;
  border-radius: 8px;
  border-left: 4px solid var(--primary);
}

.section-divider.first {
  margin-top: 0;
}

.section-divider i {
  font-size: 14px;
}

/* Package preview */
.package-preview {
  background: #f8fafc;
  border: 2px solid #dbeafe;
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
}

.preview-header {
  padding: 12px 16px;
  background: #dbeafe;
  font-weight: 600;
  font-size: 13px;
  color: #1e40af;
  display: flex;
  align-items: center;
}

.preview-body {
  padding: 16px;
  background: #ffffff;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.preview-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* Info alert */
.info-alert {
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12px;
  color: #1e40af;
  margin: 12px 0;
  display: flex;
  align-items: center;
}

.warning-alert {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12px;
  color: #92400e;
  margin: 12px 0;
  display: flex;
  align-items: center;
}

/* Add item row */
.add-item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}

.add-item-row .form-select {
  flex: 1;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.add-item-row .form-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

.qty-input {
  width: 100px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.qty-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

/* Items list */
.items-list {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.list-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.list-header strong {
  font-weight: 700;
  color: var(--text);
}

.list-items {
  padding: 8px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #fafbfc;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.list-item:last-child {
  margin-bottom: 0;
}

.list-item:hover {
  background: #f8fafc;
  border-color: var(--primary);
}

.list-item-selected {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
}

.species-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.item-info strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Safari Extras grid rows — fixed columns so all rows align */
.extras-row {
  display: grid;
  grid-template-columns: 1fr 140px 120px 44px;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: #fafbfc;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.extras-row:last-child {
  margin-bottom: 0;
}

.extras-row:hover {
  background: #f8fafc;
  border-color: var(--primary);
}

.extras-col-select {
  min-width: 0;
}

.extras-col-select .form-select {
  width: 100%;
}

.extras-col-qty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
}

.extras-col-days {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
}

.extras-col-action {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 34px;
  padding: 0 10px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  box-sizing: border-box;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 8px;
}

.btn-outline-primary {
  border: 2px solid #2563eb;
  background: #ffffff;
  color: #2563eb;
}

/* Make duration input align vertically with quantity controls */
.duration-controls {
  display: flex;
  flex-direction: column;
  align-items: center; /* center horizontally and allow helper text under input */
  gap: 6px;
}

.duration-controls > .d-flex {
  display: flex;
  align-items: center; /* first row aligns items horizontally */
  gap: 8px;
  min-height: 34px; /* same as buttons */
}

.duration-controls .form-control-sm {
  width: 90px;
  height: 34px; /* match the qty-button/badge height */
  padding: 6px 10px;
  border-radius: 8px;
  text-align: center;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 1;
}

/* Helper text for duration should sit under the input with no excessive margin */
.duration-controls .text-muted {
  margin: 0;
  font-size: 12px;
}

/* When duration is not applicable, keep the same alignment */
.duration-controls:not(:has(.form-control-sm)) {
  min-height: 28px;
  align-items: center;
}

.btn-outline-primary:hover {
  background: #2563eb;
  color: #ffffff;
}

.btn-outline-danger {
  border: 2px solid #dc2626;
  background: #ffffff;
  color: #dc2626;
}

.btn-outline-danger:hover {
  background: #dc2626;
  color: #ffffff;
}

/* Badge styles */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge.bg-info {
  background: #dbeafe;
  color: #1e40af;
}

.badge.bg-danger {
  background: #dc2626 !important;
  color: #ffffff !important;
  font-weight: 600;
}

.badge.bg-secondary {
  background: #f1f5f9;
  color: #64748b;
}

.badge.bg-success {
  background: #dcfce7;
  color: #16a34a;
}

.badge.bg-warning {
  background: #fef3c7;
  color: #92400e;
}

.customer-badge-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Empty list */
.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-list i {
  display: block;
  margin-bottom: 12px;
}

.empty-list p {
  margin: 0;
  font-size: 13px;
}

/* Empty section */
.empty-section {
  padding: 30px 20px;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

/* Upgrade fees section */
.upgrade-fees-section {
  margin-top: 20px;
}

.normal-species-item {
  border-left: 3px solid #059669 !important;
}

/* ── Normal Species Modal ── */
.normal-species-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.normal-species-modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.normal-species-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.normal-species-modal-header h5 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.normal-species-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.normal-species-modal-body .add-item-row {
  margin-bottom: 0;
}

.normal-species-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.fees-table {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.fee-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 12px 16px;
  font-size: 13px;
  align-items: center;
}

.fee-row.header {
  background: #f8fafc;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.3px;
  border-bottom: 2px solid var(--border);
}

.fee-row:not(.header) {
  border-bottom: 1px solid var(--border-light);
}

.fee-row:last-child {
  border-bottom: none;
}

/* Extras list */
.extras-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.extra-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.extra-item:hover {
  border-color: var(--primary);
  background: #fafbfc;
}

.extra-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.extra-price {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
}

/* Utility classes */
.text-primary {
  color: var(--primary) !important;
}

.text-muted {
  color: var(--text-secondary) !important;
}

.text-warning {
  color: #f59e0b !important;
}

.fw-bold {
  font-weight: 700 !important;
}

.me-1 {
  margin-right: 4px !important;
}

.me-2 {
  margin-right: 8px !important;
}

.ms-2 {
  margin-left: 8px !important;
}

.mb-2 {
  margin-bottom: 8px !important;
}

.cursor-pointer {
  cursor: pointer !important;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 32px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

/* Companion Cost Card */
.companion-cost-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cost-header {
  background: #dbeafe;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #93c5fd;
}

.cost-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

.cost-rate {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.cost-calculation {
  padding: 16px;
  background: #ffffff;
}

.calc-formula {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}

.calc-item {
  font-weight: 500;
  color: var(--text);
}

.calc-separator {
  color: #64748b;
  font-weight: 400;
}

.calc-equals {
  color: #64748b;
  font-weight: 600;
  margin: 0 4px;
}

.calc-total {
  font-weight: 700;
  color: #16a34a;
  font-size: 15px;
}

/* Smooth animations */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Multiselect Species Styling */
.species-select {
  flex: 1;
  min-width: 250px;
}

.species-category-header {
  font-weight: 700;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.species-option {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.15s ease;
}

.species-option:hover {
  background: #f1f5f9;
}

.species-name {
  font-weight: 600;
  color: #0f172a;
}

.species-scientific {
  font-size: 11px;
  font-style: italic;
}

/* v-select and multiselect global adjustments */
:deep(.v-select-field .multiselect__tags) {
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  min-height: 42px;
  padding: 6px 40px 0 8px;
}

:deep(.v-select-field .multiselect__single) {
  font-size: 13px;
  margin-bottom: 6px;
  padding: 2px 0;
}

:deep(.v-select-field .multiselect__placeholder) {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 6px;
  padding-top: 2px;
}

:deep(.v-select-field .multiselect__select) {
  height: 42px;
  top: 0;
  right: 1px;
  width: 40px;
}

:deep(.v-select-grouped .multiselect__option--disabled) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: default;
  pointer-events: none;
}

:deep(.v-select-grouped .multiselect__option) {
  padding: 10px 12px;
  font-size: 13px;
}

:deep(.v-select-grouped .multiselect__option--highlight) {
  background: #eff6ff;
  color: #1e40af;
}

:deep(.v-select-grouped .multiselect__option--selected) {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .content {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-row.three-col {
    grid-template-columns: 1fr;
  }

  .review-grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Participants Section ─── */
.readonly-value {
  padding: 10px 14px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 600;
  color: #334155;
  font-size: 14px;
}

/* Participant table styles */
.participant-table-header {
  display: grid;
  grid-template-columns: 44px 1fr 90px 100px 160px 1fr 44px;
  gap: 10px;
  align-items: center;
  padding: 8px 14px;
  background: #f1f5f9;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px 10px 0 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.participant-table-row {
  display: grid;
  grid-template-columns: 44px 1fr 90px 100px 160px 1fr 44px;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  background: #fafbfc;
  border: 1px solid var(--border, #e2e8f0);
  border-top: none;
  transition: all 0.2s ease;
}

.participant-table-row:last-child {
  border-radius: 0 0 10px 10px;
}

.participant-table-row:hover {
  background: #f8fafc;
  border-color: var(--primary, #3b82f6);
}

.participant-table-row.primary-row {
  background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
  border-color: #f59e0b;
  border-top: 1px solid #f59e0b;
}

.participant-table-row.primary-row:hover {
  border-color: #d97706;
}

.ptbl-col-num {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ptbl-col-entity {
  min-width: 0;
}

.ptbl-col-entity .form-select {
  width: 100%;
}

.ptbl-col-share {
  min-width: 0;
}

.ptbl-col-share input {
  width: 100%;
}

.ptbl-col-indep {
  display: flex;
  align-items: center;
}

.ptbl-col-dep {
  min-width: 0;
}

.ptbl-col-dep .form-select {
  width: 100%;
}

.ptbl-col-notes {
  min-width: 0;
}

.ptbl-col-notes input {
  width: 100%;
}

.ptbl-col-action {
  display: flex;
  justify-content: center;
  align-items: center;
}

.participant-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.participant-badge.primary {
  background: #fef3c7;
  color: #92400e;
}

.participant-badge.additional {
  background: #f1f5f9;
  color: #475569;
}

.toggle-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.share-summary {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  background: #f8fafc;
}

.share-bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

/* Review participants */
.participants-review-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-review-item {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.share-badge {
  font-weight: 700;
  color: #2563eb;
  font-size: 14px;
  background: #eff6ff;
  padding: 2px 10px;
  border-radius: 6px;
}

.share-total-review {
  text-align: right;
  font-size: 14px;
}
</style>
