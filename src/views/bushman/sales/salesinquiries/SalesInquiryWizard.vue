<template>
  <div class="form-wizard-container">
    <!-- Form Wizard -->
    <div class="card sales-inquiry-wizard">
      <div class="card-header bg-transparent ">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <i class="fa fa-edit text-primary fs-4"></i>
            <h2 class="h4 mb-0">{{ isEditMode ? 'Edit Enquiry' : 'Create New Enquiry' }}</h2>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary">{{ `Step ${currentStep + 1} of ${wizardSteps.length}` }}</span>
            <span class="text-muted d-none d-md-inline">{{ wizardSteps[currentStep].label }}</span>
          </div>
        </div>
      </div>

      <div class="card-body">
        <!-- Progress Bar -->
        <div class="progress mb-4" style="height: 8px">
          <div
            class="progress-bar bg-primary"
            role="progressbar"
            :style="{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }"
          ></div>
        </div>

        <!-- Circle Wizard Stepper -->
        <div class="nav-wizards-container">
          <nav class="nav nav-wizards-3 mb-4">
            <div v-for="(step, index) in wizardSteps" :key="index" class="nav-item col">
              <a
                class="nav-link"
                :class="{
                  completed: currentStep > index || (index === 0 && isStep1Complete) || (index === 1 && isStep2Complete) || (index === 2 && isStep3Complete),
                  active: currentStep === index,
                  disabled: currentStep < index
                }"
                href="#"
                @click.prevent="goToStep(index)"
              >
                <div class="nav-dot">
                  <i
                    class="fa"
                    :class="{
                      'fa-user': index === 0,
                      'fa-calendar': index === 1,
                      'fa-hiking': index === 2,
                      'fa-check-circle': index === 3,
                    }"
                  ></i>
                </div>
                <div class="nav-title">{{ step.label }}</div>
                <i v-if="(index === 0 && isStep1Complete) || (index === 1 && isStep2Complete) || (index === 2 && isStep3Complete)" class="fa fa-check-circle text-success position-absolute" style="top: 5px; right: 10px;"></i>
              </a>
            </div>
          </nav>
        </div>

        <form ref="formRef">
          <!-- Step 1: Customer Information -->
          <div v-show="currentStep === 0">
            <!-- Customer Selection Section -->
            <div class="card mb-1">
              <div class="card-header bg-light">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-user text-primary"></i>
                  <h5 class="mb-0">Customer Selection</h5>
                  <i v-if="customerType" class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body bg-transparent">
                <div class="alert alert-info">
                  <strong>New or Existing Customer?</strong><br />
                  Select an existing customer to auto-fill their information, or choose "New Customer" to enter details
                  manually.
                </div>

                <div class="row mb-3">
                  <div class="col-md-6">
                    <div class="form-check">
                      <input
                        id="customerTypeNew"
                        v-model="customerType"
                        class="form-check-input"
                        type="radio"
                        name="customerType"
                        value="new"
                      />
                      <label class="form-check-label" for="customerTypeNew"> New Customer </label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check">
                      <input
                        id="customerTypeExisting"
                        v-model="customerType"
                        class="form-check-input"
                        type="radio"
                        name="customerType"
                        value="existing"
                      />
                      <label class="form-check-label" for="customerTypeExisting"> Existing Customer </label>
                    </div>
                  </div>
                </div>

                <div v-if="customerType === 'existing'" class="mb-3">
                  <label class="form-label">Select Customer</label>
                  <select
                    v-model="selectedExistingCustomer"
                    class="form-select"
                    @change="populateFormFromCustomer(selectedExistingCustomer)"
                  >
                    <option value="">Search and select an existing customer</option>
                    <option v-for="customer in existingCustomersOptions" :key="customer.value" :value="customer">
                      {{ customer.text }} - {{ customer.selfItem?.email || 'N/A' }} •
                      {{ customer.selfItem?.country || 'N/A' }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Basic Information Section -->
            <div class="card mb-4">
              <div class="card-header bg-light">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-user text-primary"></i>
                  <h5 class="mb-0">Basic Information</h5>
                  <i
                    v-if="form.full_name && form.country && form.nationality"
                    class="fa fa-check-circle text-success ms-auto"
                  ></i>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Full name <span class="text-danger">*</span></label>
                    <input v-model="form.full_name" type="text" class="form-control" placeholder="Enter your Full name" required />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Country <span class="text-danger">*</span></label>
                    <select v-model="form.country" class="form-select" required>
                      <option value="">Select Country</option>
                      <option v-for="country in countries" :key="country.value" :value="country">{{ country.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Client Nationality <span class="text-danger">*</span></label>
                    <select v-model="form.nationality" class="form-select" required>
                      <option value="">Select Client nationality</option>
                      <option v-for="nat in nationality" :key="nat.value" :value="nat">{{ nat.text }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Information Section -->
            <div class="card mb-4">
              <div class="card-header bg-light">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-envelope text-primary"></i>
                  <h5 class="mb-0">Contact Information</h5>
                  <i v-if="form.email && form.phone && form.address" class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input v-model="form.email" type="email" class="form-control" placeholder="Enter your email" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Primary Phone <span class="text-danger">*</span></label>
                    <input v-model="form.phone" type="text" class="form-control" placeholder="eg: +971501234567" required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Additional Phone</label>
                    <input v-model="form.phone_additional" type="text" class="form-control" placeholder="eg: +971501234567 (Optional)" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Address <span class="text-danger">*</span></label>
                    <input v-model="form.address" type="text" class="form-control" maxlength="30" placeholder="Enter your address" required />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Season, Package, Dates & Hunt Party -->
          <div v-show="currentStep === 1">
            <!-- Season & Package Section - Optimized Layout -->
            <div class="card mb-3">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-calendar text-primary"></i>
                  <h5 class="mb-0">Season & Package</h5>
                  <i v-if="form.season && form.priceListId" class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body py-3">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Season</label>
                    <select v-model="form.season" class="form-select" required @change="onSeasonSelected(form.season)">
                      <option value="">Select Season</option>
                      <option v-for="season in seasonsOptions" :key="season.value" :value="season">
                        {{ season.text }}
                        <template v-if="season.selfItem"> - {{ formatDateRange(season.selfItem.start_at, season.selfItem.end_at) }} </template>
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting Package</label>
                    <select
                      v-model="form.priceListId"
                      class="form-select"
                      :disabled="!form.season || filteredPackagesOptions.length === 0"
                      required
                      @change="populateFormFromPackage()"
                    >
                      <option value="">Select a Hunting Package</option>
                      <option v-for="pkg in filteredPackagesOptions" :key="pkg.value" :value="pkg">
                        {{ pkg.text }}
                        <template v-if="pkg.selfItem">
                          - {{ pkg.selfItem?.area || pkg.selfItem?.area_package || 'N/A' }} •
                          {{ pkg.selfItem?.hunting_type || 'N/A' }} • {{ pkg.selfItem?.duration || 0 }} days
                        </template>
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Package Details - Compact Display -->
                <div v-if="form.priceListId && form.priceListId.selfItem" class="alert alert-info mb-0 mt-3 py-2">
                  <div class="row g-2 small">
                    <div class="col-6 col-md-3">
                      <strong>Area:</strong>
                      {{
                        form.priceListId.selfItem?.sales_package?.area?.name ||
                        form.priceListId.selfItem?.area ||
                        'N/A'
                      }}
                    </div>
                    <div class="col-6 col-md-3">
                      <strong>Hunting Type:</strong>
                      {{
                        form.priceListId.selfItem?.price_list_type?.hunting_type?.name ||
                        form.priceListId.selfItem?.hunting_type ||
                        'N/A'
                      }}
                    </div>
                    <div class="col-6 col-md-3">
                      <strong>Duration:</strong>
                      {{
                        form.priceListId.selfItem?.price_list_type?.duration ||
                        form.priceListId.selfItem?.duration ||
                        0
                      }}
                      days
                    </div>
                    <div class="col-6 col-md-3">
                      <strong>Base Amount:</strong>
                      {{ form.priceListId.selfItem?.price_list_type?.currency?.symbol || '$' }}{{
                        form.priceListId.selfItem?.price_list_type?.amount ||
                        form.priceListId.selfItem?.amount ||
                        'N/A'
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hunt Dates Section - Optimized Layout -->
            <div class="card mb-3">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-calendar-alt text-primary"></i>
                  <h5 class="mb-0">Hunt Dates</h5>
                  <i v-if="form.preferred_date && form.start_date && form.end_date" class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body py-3">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Preferred Date</label>
                    <input
                      v-model="form.preferred_date"
                      type="date"
                      class="form-control"
                      :disabled="!form.season"
                      required
                      @change="checkBookedDateConflict"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Start Date</label>
                    <input
                      v-model="form.start_date"
                      type="date"
                      class="form-control"
                      :disabled="!form.season"
                      required
                      @change="onStartDateChange"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">End Date</label>
                    <input
                      v-model="form.end_date"
                      type="date"
                      class="form-control"
                      :disabled="!form.season || !form.start_date"
                      :min="form.start_date"
                      required
                      @change="onEndDateChange"
                    />
                  </div>
                </div>

                <!-- Date Info & Warnings - Compact -->
                <div v-if="form.start_date && form.end_date && huntDuration > 0" class="alert alert-info mt-3 mb-0 py-2">
                  <i class="fa fa-calendar-check me-2"></i>
                  <strong>Hunt Duration:</strong> {{ huntDuration }} days
                  <span class="ms-2">From {{ formatDate(form.start_date) }} to {{ formatDate(form.end_date) }}</span>
                </div>
                <div v-if="dateConflictWarning" class="alert alert-warning mt-2 mb-0 py-2">
                  <i class="fa fa-exclamation-triangle me-2"></i>
                  <strong>Date Conflict Detected:</strong> {{ dateConflictWarning }}
                </div>
                <div v-if="bookedDatesForSelectedSeason.length > 0" class="mt-2">
                  <small class="text-muted d-block mb-1">
                    <i class="fa fa-calendar-times me-1"></i>Already Booked Dates:
                  </small>
                  <div class="d-flex flex-wrap gap-1">
                    <span v-for="(booking, index) in bookedDatesForSelectedSeason" :key="index" class="badge bg-danger">
                      {{ formatBookingDateRange(booking) }} - {{ booking.client_name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hunt Party Details - Optimized Compact Layout -->
            <div class="card mb-3">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-users text-primary"></i>
                  <h5 class="mb-0">Hunt Party Details</h5>
                  <i v-if="huntDuration > 0 && form.no_of_hunters" class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body py-3">
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting Days</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fa fa-calendar text-primary"></i></span>
                      <input
                        type="text"
                        class="form-control"
                        :value="huntDuration > 0 ? `${huntDuration} days` : 'Select dates above'"
                        readonly
                        disabled
                      />
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting Area</label>
                    <select v-model="form.area" class="form-select" disabled required>
                      <option value="">Select Area</option>
                      <option v-for="area in areasOptions" :key="area.value" :value="area">{{ area.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunters</label>
                    <input v-model="form.no_of_hunters" type="number" class="form-control" min="1" required />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Observers</label>
                    <input v-model="form.no_of_observers" type="number" class="form-control" min="0" />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Companions</label>
                    <input v-model="form.no_of_companions" type="number" class="form-control" min="0" />
                  </div>
                </div>

                <!-- Observer and Companion Rates - Compact Display -->
                <div v-if="form.priceListId?.selfItem" class="row g-2 mt-2">
                  <div v-if="form.priceListId.selfItem.observer?.length > 0" class="col-md-6">
                    <div class="alert alert-success mb-0 py-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <i class="fa fa-eye me-2"></i>
                          <strong>Observer Rate:</strong>
                          {{ form.priceListId.selfItem.price_list_type?.currency?.symbol || '$' }}{{
                            form.priceListId.selfItem.observer[0].amount
                          }}
                          <small class="text-muted">per observer</small>
                        </div>
                        <div v-if="form.no_of_observers > 0" class="text-end">
                          <div class="small text-muted">Subtotal:</div>
                          <div class="fw-bold">
                            {{ form.priceListId.selfItem.price_list_type?.currency?.symbol || '$' }}{{
                              (form.no_of_observers * form.priceListId.selfItem.observer[0].amount).toLocaleString()
                            }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="form.priceListId.selfItem.companion_hunter_costs?.length > 0" class="col-md-6">
                    <div class="alert alert-primary mb-0 py-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <i class="fa fa-users me-2"></i>
                          <strong>Companion Rate:</strong>
                          {{ form.priceListId.selfItem.price_list_type?.currency?.symbol || '$' }}{{
                            form.priceListId.selfItem.companion_hunter_costs[0].amount
                          }}
                          <small class="text-muted">per companion</small>
                        </div>
                        <div v-if="form.no_of_companions > 0" class="text-end">
                          <div class="small text-muted">Subtotal:</div>
                          <div class="fw-bold">
                            {{ form.priceListId.selfItem.price_list_type?.currency?.symbol || '$' }}{{
                              (form.no_of_companions * form.priceListId.selfItem.companion_hunter_costs[0].amount).toLocaleString()
                            }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upgrade Fees Section -->
            <div v-if="form.priceListId?.selfItem?.upgrade_fees && form.priceListId.selfItem.upgrade_fees.length > 0" class="card mb-3">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-arrow-up text-warning"></i>
                  <h5 class="mb-0">Upgrade Fees</h5>
                </div>
              </div>
              <div class="card-body bg-warning bg-opacity-10">
                <div class="table-responsive">
                  <table class="table table-hover table-sm mb-0">
                    <thead>
                      <tr>
                        <th class="text-start">Species</th>
                        <th class="text-end">Upgrade Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="fee in form.priceListId.selfItem.upgrade_fees" :key="fee.id">
                        <td class="fw-medium">{{ fee.species_name || fee.species?.name || 'Unknown' }}</td>
                        <td class="text-end fw-semibold text-warning">
                          {{
                            fee.currency_symbol ||
                            form.priceListId.selfItem.price_list_type?.currency?.symbol ||
                            '$'
                          }}{{ fee.amount }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Species Selection Section - Optimized -->
            <div class="card mb-3">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-paw text-primary"></i>
                  <h5 class="mb-0">Species Selection</h5>
                </div>
              </div>
              <div class="card-body py-3">
                <div class="row g-2 mb-3">
                  <div class="col-md-5">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Species</label>
                    <select v-model="form.species" class="form-select">
                      <option value="">Select Species</option>
                      <option v-for="species in speciesOptions" :key="species.value" :value="species">
                        {{ species.text }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Quantity</label>
                    <input v-model="form.quantity" type="number" class="form-control" min="1" max="100" placeholder="Qty" />
                  </div>
                  <div class="col-md-4 d-flex align-items-end">
                    <button type="button" class="btn btn-primary w-100" @click="addNewSpeciesItemToStorage()">
                      <i class="fa fa-plus me-1"></i> Add Species
                    </button>
                  </div>
                </div>

                <hr />

                <div class="mt-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="small">Selected Species ({{ speciesObjects.length }})</strong>
                  </div>
                  <div v-if="speciesObjects.length > 0" class="list-group">
                    <div v-for="(s, index) in speciesObjects" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center gap-2">
                        <strong>{{ s.name }}</strong>
                        <span v-if="s.fromPackage" class="badge bg-info">from Package</span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" :disabled="s.quantity <= 1" @click="decrementQuantity(index)">
                          <i class="fa fa-minus"></i>
                        </button>
                        <span class="badge bg-primary" style="min-width: 30px">{{ s.quantity }}</span>
                        <button type="button" class="btn btn-sm btn-outline-primary" @click="incrementQuantity(index)">
                          <i class="fa fa-plus"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="deleteFromStorage(index)">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="alert alert-secondary mb-0">No species selected yet. Add species using the form above or select a package.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Safari Extras & Trophy Fees -->
          <div v-show="currentStep === 2" class="animate-fade-in">
            <!-- Safari Extras Section -->
            <div class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="fa fa-hiking text-primary fs-4"></i>
                <h3 class="h5 mb-0 fw-bold">Safari Extras</h3>
              </div>

              <div v-if="selectedSafariExtras.length === 0" class="alert alert-secondary border-start border-4" role="alert">
                <h6 class="alert-heading">No Safari Extras Selected</h6>
                <p class="mb-0">Safari extras will be populated when you select a package. You can also add them manually later.</p>
              </div>

              <template v-else>
                <div class="alert alert-info border-start border-4" role="alert">
                  <h6 class="alert-heading">Customize Safari Extras ({{ selectedSafariExtras.length }} selected)</h6>
                  <p class="mb-0">Remove any safari extras that your client does not require by clicking the remove button.</p>
                </div>

                <div class="card mb-3 bg-light">
                  <div class="card-body">
                    <div class="d-flex flex-column gap-3">
                      <div
                        v-for="(extra, index) in selectedSafariExtras"
                        :key="extra.id"
                        class="p-3 border rounded bg-white d-flex justify-content-between align-items-center"
                      >
                        <div class="d-flex align-items-center gap-3">
                          <div class="fw-semibold text-capitalize">{{ extra.name }}</div>
                          <span v-if="extra.fromPackage" class="badge bg-info">FROM PACKAGE</span>
                          <small class="text-muted">{{ extra.description }}</small>
                        </div>

                        <div class="d-flex align-items-center gap-2">
                          <small class="text-muted me-3">{{ extra.currency?.symbol || '$' }}{{ extra.amount }}</small>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            title="Remove this safari extra"
                            @click="removeSafariExtra(index)"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Trophy Fees Section -->
            <div v-if="form.priceListId?.selfItem?.trophy_fees?.length > 0" class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="fa fa-trophy text-primary fs-4"></i>
                <h3 class="h5 mb-0 fw-bold">Trophy Fees</h3>
              </div>

              <div class="alert alert-info border-start border-4" role="alert">
                <h6 class="alert-heading">
                  Trophy Fees Included ({{ form.priceListId.selfItem.trophy_fees.length }} species)
                </h6>
                <p class="mb-0">These trophy fees are included in the selected package and will be shown in the final review.</p>
              </div>

              <div class="card mb-3 bg-light">
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th class="text-start">Species</th>
                          <th class="text-center">Sequence</th>
                          <th class="text-end">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(fee, index) in form.priceListId.selfItem.trophy_fees" :key="`trophy-${fee.id}-${index}`">
                          <td class="fw-medium">{{ fee.species?.name || 'Unknown' }}</td>
                          <td class="text-center">
                            <span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span>
                          </td>
                          <td class="text-end fw-semibold">
                            {{ form.priceListId.selfItem?.price_list_type?.currency?.symbol || '$' }}{{ fee.amount }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quotation Creation Section -->
            <div class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="fa fa-file-invoice text-primary fs-4"></i>
                <h3 class="h5 mb-0 fw-bold">Quotation</h3>
              </div>

              <div class="card">
                <div class="card-body">
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 class="fw-semibold mb-1">Create Quotation for this Inquiry?</h6>
                      <p class="text-muted small mb-0">Enable this option to generate a quotation with payment installments for the client.</p>
                    </div>
                    <div class="form-check form-switch">
                      <input v-model="createQuotation" class="form-check-input" type="checkbox" role="switch" id="createQuotationSwitch" style="width: 3rem; height: 1.5rem;">
                      <label class="form-check-label" for="createQuotationSwitch"></label>
                    </div>
                  </div>

                  <template v-if="createQuotation">
                    <hr class="my-3" />

                    <div class="row g-3 mb-3">
                      <div class="col-md-6">
                        <label class="form-label small text-uppercase fw-bold text-muted mb-1">Confirmation Date</label>
                        <input v-model="quotationForm.confirmation_date" type="date" class="form-control" placeholder="Select confirmation date" />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting License (Optional)</label>
                        <input v-model="quotationForm.hunting_license" type="text" class="form-control" placeholder="Enter license number" />
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label small text-uppercase fw-bold text-muted mb-1">Remarks (Optional)</label>
                      <textarea v-model="quotationForm.remarks" class="form-control" rows="2" placeholder="Add any additional notes or remarks..."></textarea>
                    </div>

                    <div class="mb-3">
                      <div class="d-flex align-items-center justify-content-between mb-3">
                        <label class="form-label small text-uppercase fw-bold text-muted mb-0">Payment Installments</label>
                        <button type="button" class="btn btn-sm btn-secondary" @click="addQuotationInstallment">
                          <i class="fa fa-plus me-1"></i> Add Installment
                        </button>
                      </div>

                      <div v-if="quotationForm.installments.length === 0" class="alert alert-warning border-start border-4" role="alert">
                        <h6 class="alert-heading">Required</h6>
                        <p class="mb-0">At least one payment installment is required to create a quotation.</p>
                      </div>

                      <div v-for="(installment, index) in quotationForm.installments" :key="index" class="card mb-3 bg-light">
                        <div class="card-body">
                          <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="fw-semibold">Installment {{ index + 1 }}</span>
                            <button type="button" class="btn btn-sm btn-outline-danger" @click="removeQuotationInstallment(index)">
                              <i class="fa fa-trash"></i>
                            </button>
                          </div>
                          <div class="row g-3">
                            <div class="col-md-3">
                              <label class="form-label small">Description</label>
                              <input v-model="installment.narration" type="text" class="form-control" placeholder="e.g., Deposit Due upon booking" />
                            </div>
                            <div class="col-md-3">
                              <label class="form-label small">Amount (USD)</label>
                              <input v-model="installment.amount_due" type="number" class="form-control" placeholder="5000" />
                            </div>
                            <div class="col-md-3">
                              <label class="form-label small">Due Type</label>
                              <select v-model="installment.due_days_type" class="form-select">
                                <option value="">Select when due</option>
                                <option v-for="opt in dueDaysTypeOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                              </select>
                            </div>
                            <div class="col-md-3">
                              <label class="form-label small">{{ installment.due_days_type === 'before_arrival' ? 'Days Before Arrival' : 'Due Days' }}</label>
                              <input
                                v-model="installment.due_days"
                                type="number"
                                class="form-control"
                                placeholder="e.g., 90"
                                :disabled="installment.due_days_type === 'upon_booking'"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="quotationForm.installments.length > 0" class="card bg-primary text-white">
                        <div class="card-body py-3">
                          <div class="d-flex justify-content-between align-items-center">
                            <span class="fs-5 fw-semibold">TOTAL</span>
                            <span class="fs-3 fw-bold">${{ quotationTotalAmount.toLocaleString() }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Review & Submit -->
          <div v-show="currentStep === 3" class="animate-fade-in">
            <div class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="fa fa-clipboard-check text-primary fs-4"></i>
                <h3 class="h5 mb-0 fw-bold">Review Your Enquiry</h3>
              </div>

              <div class="alert alert-info border-start border-4" role="alert">
                <h6 class="alert-heading">Please Review</h6>
                <p class="mb-0">Review all the information below before submitting your enquiry.</p>
              </div>

              <!-- Customer Summary -->
              <div class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-user text-primary"></i>
                    <h6 class="mb-0">Customer Information</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row g-3 small">
                    <div class="col-md-4"><span class="text-muted">Full Name:</span><span class="ms-2 fw-medium">{{ form.full_name || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Country:</span><span class="ms-2 fw-medium">{{ form.country?.text || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Nationality:</span><span class="ms-2 fw-medium">{{ form.nationality?.text || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Email:</span><span class="ms-2 fw-medium">{{ form.email || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Primary Phone:</span><span class="ms-2 fw-medium">{{ form.phone || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Additional Phone:</span><span class="ms-2 fw-medium">{{ form.phone_additional || 'N/A' }}</span></div>
                    <div class="col-12"><span class="text-muted">Address:</span><span class="ms-2 fw-medium">{{ form.address || 'N/A' }}</span></div>
                  </div>
                </div>
              </div>

              <!-- Season & Package Summary -->
              <div class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-box text-primary"></i>
                    <h6 class="mb-0">Season & Package</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row g-3 small">
                    <div class="col-md-6"><span class="text-muted">Season:</span><span class="ms-2 fw-medium">{{ form.season?.text || 'N/A' }}</span></div>
                    <div class="col-md-6"><span class="text-muted">Package:</span><span class="ms-2 fw-medium">{{ form.priceListId?.text || 'No package selected' }}</span></div>
                  </div>
                </div>
              </div>

              <!-- Schedule Summary -->
              <div class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-calendar text-primary"></i>
                    <h6 class="mb-0">Schedule & Hunt Party</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row g-3 small mb-3">
                    <div class="col-md-4"><span class="text-muted">Preferred Date:</span><span class="ms-2 fw-medium">{{ formatReviewDate(form.preferred_date) }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Start Date:</span><span class="ms-2 fw-medium">{{ formatReviewDate(form.start_date) }}</span></div>
                    <div class="col-md-4"><span class="text-muted">End Date:</span><span class="ms-2 fw-medium">{{ formatReviewDate(form.end_date) }}</span></div>
                  </div>
                  <hr class="my-2" />
                  <div class="row g-3 small">
                    <div class="col-6 col-md-2"><span class="text-muted">Hunting Area:</span><span class="ms-2 fw-medium">{{ form.area?.text || 'N/A' }}</span></div>
                    <div class="col-6 col-md-2"><span class="text-muted">Days:</span><span class="ms-2 fw-medium">{{ form.no_of_days || 'N/A' }}</span></div>
                    <div class="col-4 col-md-2"><span class="text-muted">Hunters:</span><span class="ms-2 fw-medium">{{ form.no_of_hunters || 1 }}</span></div>
                    <div class="col-4 col-md-3"><span class="text-muted">Observers:</span><span class="ms-2 fw-medium">{{ form.no_of_observers || 0 }}</span></div>
                    <div class="col-4 col-md-3"><span class="text-muted">Companions:</span><span class="ms-2 fw-medium">{{ form.no_of_companions || 0 }}</span></div>
                  </div>
                </div>
              </div>

              <!-- Species Summary -->
              <div class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-paw text-primary"></i>
                    <h6 class="mb-0">Selected Species ({{ speciesObjects.length }})</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div v-if="speciesObjects.length > 0" class="d-flex flex-wrap gap-2">
                    <span v-for="(s, index) in speciesObjects" :key="index" class="badge" :class="s.fromPackage ? 'bg-info' : 'bg-primary'">
                      {{ s.name }} (x{{ s.quantity }})
                    </span>
                  </div>
                  <span v-else class="text-muted">No species selected</span>
                </div>
              </div>

              <!-- Safari Extras Summary -->
              <div v-if="selectedSafariExtras.length > 0" class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-hiking text-primary"></i>
                    <h6 class="mb-0">Safari Extras ({{ selectedSafariExtras.length }})</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="d-flex flex-wrap gap-2">
                    <span v-for="extra in selectedSafariExtras" :key="extra.id" class="badge bg-success">
                      {{ extra.name }} - {{ extra.currency?.symbol || '$' }}{{ extra.amount }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Trophy Fees Summary -->
              <div v-if="form.priceListId?.selfItem?.trophy_fees?.length > 0" class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-trophy text-primary"></i>
                    <h6 class="mb-0">Trophy Fees ({{ form.priceListId.selfItem.trophy_fees.length }})</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover table-sm mb-0">
                      <thead>
                        <tr>
                          <th class="text-start">Species</th>
                          <th class="text-center">Sequence</th>
                          <th class="text-end">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(fee, index) in form.priceListId.selfItem.trophy_fees" :key="`trophy-review-${fee.id}-${index}`">
                          <td class="fw-medium">{{ fee.species?.name || 'Unknown' }}</td>
                          <td class="text-center"><span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span></td>
                          <td class="text-end fw-semibold">{{ form.priceListId.selfItem?.price_list_type?.currency?.symbol || '$' }}{{ fee.amount }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Floating Sticky Footer Navigation -->
    <div class="floating-footer-wrapper">
      <div class="floating-footer bg-white border-top shadow-lg">
        <div class="d-flex justify-content-between align-items-center py-3 px-4">
          <div>
            <button v-if="currentStep > 0" type="button" class="btn btn-primary" @click="previousStep">
              Back
            </button>
          </div>
          <div class="text-muted d-none d-sm-inline">Step {{ currentStep + 1 }} of {{ wizardSteps.length }}</div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="cancelWizard">Cancel</button>
            <button
              v-if="currentStep < wizardSteps.length - 1"
              type="button"
              class="btn btn-primary"
              :disabled="!canProceedToNextStep"
              @click="nextStep"
            >
              Next
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary"
              :disabled="!isValidForm || saving"
              @click="submit()"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
              Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import handleErrors from '@/stores/bushman/errorHandler'
import { validators } from '@/stores/bushman/utils'
import { useForm } from '@/composables/useForm'
import { useToast } from '@/composables/useToast'
import { useQuotaStore } from '@/stores/bushman/quota-store'
import { useSalesInquiriesStore } from '@/stores/bushman/sales-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'

const props = defineProps<{ editRow?: any | null }>()
const emit = defineEmits<{ (e: 'cancel'): void; (e: 'saved'): void }>()

const formRef = ref<HTMLFormElement | null>(null)
const contactFormRef = ref<HTMLFormElement | null>(null)

const { isValid: isValidForm, validate: validateForm, resetValidation: resetValidationForm, reset: resetForm } =
  useForm()
const {
  isValid: isValidContactForm,
  validate: validateContactForm,
  resetValidation: resetValidationContactForm,
  reset: resetContactForm,
} = useForm()

const { init } = useToast()

const form = reactive({
  id: null as any,
  full_name: '',
  nick_name: '',
  country: null as any,
  nationality: null as any,
  category: null as any,
  email: '',
  phone: '',
  phone_additional: '',
  address: '',
  no_of_hunters: 1,
  no_of_observers: 0,
  priceListId: null as any,
  no_of_days: 0,
  no_of_companions: 0,
  species: null as any,
  quantity: 0,
  area: null as any,
  season: null as any,
  preferred_date: null as any,
  start_date: null as any,
  end_date: null as any,
})

const contactForm = reactive({
  id: null as any,
  client_id: null as any,
  contact: '',
  contact_type: null as any,
  contactable: false,
})

const countries = ref<any[]>([])
const nationality = ref<any[]>([])
const categoryOptions = ref<any[]>([])
const contactsTypes = ref<any[]>([])

const speciesOptions = ref<any[]>([])
const speciesObjects = ref<any[]>([])
const areasOptions = ref<any[]>([])
const seasonsOptions = ref<any[]>([])
const packagesOptions = ref<any[]>([])

const saving = ref(false)

const seasonMinDate = ref<Date | null>(null)
const seasonMaxDate = ref<Date | null>(null)

const bookedDates = ref<Array<{ start_date: string; end_date: string; client_name: string; area_id: number }>>([])
const loadingBookedDates = ref(false)
const dateConflictWarning = ref('')

const isEditMode = ref(false)
const editingInquiryId = ref<number | null>(null)

const customerType = ref<'new' | 'existing'>('new')
const selectedExistingCustomer = ref<any>(null)
const existingCustomersOptions = ref<any[]>([])
const loadingCustomers = ref(false)

const currentStep = ref(0)
const wizardSteps = [
  { label: 'Personal Info' },
  { label: 'Season, Package, Dates & Species' },
  { label: 'Safari Extras & Trophy Fees' },
  { label: 'Review' },
]

const selectedSafariExtras = ref<any[]>([])

const createQuotation = ref(false)
const quotationForm = reactive({
  confirmation_date: null as Date | null,
  hunting_license: '',
  remarks: '',
  installments: [] as { narration: string; amount_due: number; due_days_type: string; due_days: number }[],
})

const dueDaysTypeOptions = [
  { value: 'upon_booking', text: 'Upon Booking' },
  { value: 'before_arrival', text: 'Before Arrival' },
  { value: 'on_arrival', text: 'On Arrival' },
  { value: 'after_hunt', text: 'After Hunt' },
]

const quotaStore = useQuotaStore()
const salesStore = useSalesInquiriesStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const salesPackagesSpecies = computed(() => settingsStore.salesPackagesSpecies)

const bookedDatesForSelectedSeason = computed(() => bookedDates.value)

const isStep1Complete = computed(
  () => !!(form.full_name && form.country && form.nationality && form.email && form.phone && form.address),
)

const isStep2Complete = computed(
  () => !!(form.season && form.preferred_date && form.start_date && form.end_date && form.no_of_days && speciesObjects.value.length > 0),
)

const isStep3Complete = computed(() => currentStep.value >= 3)

const hasInput = (value: any) => {
  if (typeof value === 'string') return value.trim().length > 0
  return !!value
}

const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 0:
      return (
        hasInput(form.full_name) &&
        hasInput(form.country) &&
        hasInput(form.nationality) &&
        hasInput(form.email) &&
        hasInput(form.phone) &&
        hasInput(form.address) &&
        (customerType.value === 'existing' ? hasInput(selectedExistingCustomer.value) : true)
      )
    case 1:
      return (
        hasInput(form.season) &&
        hasInput(form.preferred_date) &&
        hasInput(form.start_date) &&
        hasInput(form.end_date) &&
        hasInput(form.area) &&
        !!(form.no_of_days && form.no_of_days > 0) &&
        speciesObjects.value.length > 0
      )
    case 2:
      return true
    default:
      return false
  }
})

const filteredPackagesOptions = computed(() => {
  if (!form.season?.value) return []
  const selectedSeasonId = form.season.value
  return packagesOptions.value.filter((pkg: any) => {
    const pkgSeasonId =
      pkg.selfItem?.season_id ||
      pkg.selfItem?.season?.id ||
      pkg.selfItem?.price_list?.season_id ||
      pkg.selfItem?.price_list_type?.price_list?.season_id
    return pkgSeasonId != null && pkgSeasonId == selectedSeasonId
  })
})

const speciesList = computed(() => salesPackagesSpecies.value)

const huntDuration = computed(() => {
  if (!form.start_date || !form.end_date) return 0
  const start = new Date(form.start_date)
  const end = new Date(form.end_date)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays > 0 ? diffDays : 0
})

const quotationTotalAmount = computed(() =>
  quotationForm.installments.reduce((sum, inst) => sum + (Number(inst.amount_due) || 0), 0),
)

const resetQuotationForm = () => {
  createQuotation.value = false
  quotationForm.confirmation_date = null
  quotationForm.hunting_license = ''
  quotationForm.remarks = ''
  quotationForm.installments = []
}

const clearCustomerInformation = () => {
  form.full_name = ''
  form.email = ''
  form.phone = ''
  form.phone_additional = ''
  form.address = ''
  form.country = null
  form.nationality = null
}

const resetEditMode = () => {
  isEditMode.value = false
  editingInquiryId.value = null
  speciesObjects.value = []
  selectedSafariExtras.value = []
  resetQuotationForm()
  customerType.value = 'new'
  selectedExistingCustomer.value = null
  currentStep.value = 0
}

const cancelWizard = () => {
  resetEditMode()
  emit('cancel')
}

const nextStep = () => {
  if (currentStep.value < wizardSteps.length - 1 && canProceedToNextStep.value) {
    currentStep.value++
  } else if (!canProceedToNextStep.value) {
    showStepValidationError()
  }
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
    1: 'Please select season, dates, hunting area, enter the number of days, and add at least one species.',
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

const formatBookingDateRange = (booking: any) => {
  return `${formatReviewDate(booking.start_date)} - ${formatReviewDate(booking.end_date)}`
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

const getCountries = async () => {
  const response = await axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_COUNTRIES_URL,
    headers: { 'Content-Type': 'application/json' },
  })
  if (response.status === 200) {
    countries.value = response.data.map((country: any) => ({ value: country.id, text: country.name }))
  }
}

const getCategories = async () => {
  try {
    const response = await axios.request({
      method: 'get',
      maxBodyLength: Infinity,
      url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_ENTITY_CATEGORIES_VSET_URL,
    })
    if (response.status === 200) {
      categoryOptions.value = response.data.map((category: any) => ({ value: category.id, text: category.name }))
    }
  } catch {
    console.warn('Categories endpoint not available')
  }
}

const getNationalities = async () => {
  const response = await axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_NATIONALITIES_URL,
    headers: { 'Content-Type': 'application/json' },
  })
  if (response.status === 200) {
    nationality.value = response.data.map((nat: any) => ({ value: nat.id, text: nat.name }))
  }
}

const getContactTypes = async () => {
  try {
    const response = await axios.request({
      method: 'get',
      maxBodyLength: Infinity,
      url: import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_CONTACT_TYPES_URL,
      headers: { 'Content-Type': 'application/json' },
    })
    if (response.status === 200) {
      contactsTypes.value = response.data.map((contactType: any) => ({ value: contactType.id, text: contactType.name }))
    }
  } catch {
    console.warn('Contact types endpoint not available')
  }
}

const getSpecies = async () => {
  try {
    const response = await quotaStore.getSpeciesList()
    if (response.status === 200) {
      speciesOptions.value = response.data.map((item: any) => ({ value: item.id, text: item.name }))
    }
  } catch (error) {
    console.error('Error loading species:', error)
  }
}

const getAreas = async () => {
  try {
    const response = await quotaStore.getAreaList()
    areasOptions.value = response.data.map((item: any) => ({ value: item.id, text: item.name }))
  } catch (error) {
    console.log(error)
  }
}

const getSeasonList = async () => {
  try {
    const response = await settingsStore.getSeasons()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    seasonsOptions.value = response.data
      .filter((item: any) => {
        if (!item.end_at) return true
        const endDate = new Date(item.end_at)
        endDate.setHours(23, 59, 59, 999)
        return endDate >= today
      })
      .map((item: any) => ({ value: item.id, text: item.name, selfItem: item }))
  } catch (error) {
    console.log(error)
  }
}

const getPL = async () => {
  try {
    const response = await priceListStore.getPriceLists()
    const dataArray = Array.isArray(response.data)
      ? response.data
      : response.data.data || response.data.results || []
    packagesOptions.value = dataArray.map((item: any) => ({
      value: item.id,
      text: item.name || item.code || `Package #${item.id}`,
      selfItem: item,
    }))
  } catch (error) {
    console.error('Error loading packages:', error)
  }
}

const getExistingCustomers = async () => {
  loadingCustomers.value = true
  try {
    const response: any = await salesStore.getSalesInquiries('', '')
    if (response.status === 200) {
      const dataArray = Array.isArray(response.data) ? response.data : response.data.data || []
      const customersMap = new Map()

      dataArray.forEach((item: any) => {
        const entity = item.entity
        if (entity && entity.id && !customersMap.has(entity.id)) {
          let email = ''
          let phone = ''
          let address = ''

          if (entity.contacts && Array.isArray(entity.contacts)) {
            entity.contacts.forEach((contact: any) => {
              if (contact.contact_type?.name === 'email' || contact.contact_type_id === 1) {
                email = contact.contact || ''
              } else if (contact.contact_type?.name === 'phone_number' || contact.contact_type_id === 2) {
                phone = contact.contact || ''
              } else if (contact.contact_type?.name === 'address' || contact.contact_type_id === 3) {
                address = contact.contact || ''
              }
            })
          }

          customersMap.set(entity.id, {
            value: entity.id,
            text: entity.full_name || 'Unknown',
            selfItem: {
              ...entity,
              email,
              phone,
              address,
              country: entity.country?.name || entity.country_name,
              nationality: entity.nationality?.name || entity.nationality_name,
            },
          })
        }
      })

      existingCustomersOptions.value = Array.from(customersMap.values())
    }
  } catch (error) {
    console.error('Error loading existing customers:', error)
  } finally {
    loadingCustomers.value = false
  }
}

const populateFormFromCustomer = (customer: any) => {
  if (!customer || !customer.selfItem) return
  const entity = customer.selfItem

  form.full_name = entity.full_name || ''
  form.email = entity.email || ''
  form.phone = entity.phone || ''
  form.address = entity.address || ''

  const countryName = entity.country
  if (countryName) {
    const countryOption = countries.value.find((c: any) => c.text === countryName)
    if (countryOption) form.country = countryOption
  }

  const nationalityName = entity.nationality
  if (nationalityName) {
    const nationalityOption = nationality.value.find((n: any) => n.text === nationalityName)
    if (nationalityOption) form.nationality = nationalityOption
  }
}

watch(customerType, () => {
  selectedExistingCustomer.value = null
  clearCustomerInformation()
})

watch(selectedExistingCustomer, (newValue) => {
  if (!newValue && customerType.value === 'existing') {
    clearCustomerInformation()
  }
})

const onSeasonSelected = async (selectedSeason: any) => {
  dateConflictWarning.value = ''
  form.preferred_date = null
  form.start_date = null
  form.end_date = null

  if (!selectedSeason || !selectedSeason.selfItem) {
    seasonMinDate.value = null
    seasonMaxDate.value = null
    bookedDates.value = []
    return
  }

  const seasonData = selectedSeason.selfItem
  if (seasonData.start_at) seasonMinDate.value = new Date(seasonData.start_at)
  if (seasonData.end_at) seasonMaxDate.value = new Date(seasonData.end_at)

  await fetchBookedDates(selectedSeason.value)
}

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
  if (!form.start_date || !form.end_date) return

  const start = new Date(form.start_date)
  const end = new Date(form.end_date)

  const conflict = bookedDates.value.find((booking: any) => {
    const bStart = new Date(booking.start_date)
    const bEnd = new Date(booking.end_date)
    return start <= bEnd && end >= bStart
  })

  if (conflict) {
    dateConflictWarning.value = `Selected dates overlap with booking for ${conflict.client_name}`
  }
}

const onStartDateChange = () => {
  checkBookedDateConflict()
}

const onEndDateChange = () => {
  checkBookedDateConflict()
}

const populateFormFromPackage = () => {
  if (!form.priceListId?.selfItem) return
  const pkg = form.priceListId.selfItem

  const areaName = pkg?.sales_package?.area?.name || pkg?.area || pkg?.area_package
  if (areaName) {
    const areaOption = areasOptions.value.find((a: any) => a.text === areaName)
    if (areaOption) form.area = areaOption
  }

  const duration = pkg?.price_list_type?.duration || pkg?.duration
  if (duration) {
    form.no_of_days = Number(duration)
  }

  speciesObjects.value = []
  selectedSafariExtras.value = []

  const pkgSpecies = pkg?.species || pkg?.sales_package_species || speciesList.value || []
  if (Array.isArray(pkgSpecies)) {
    pkgSpecies.forEach((s: any) => {
      const speciesId = s.species_id || s.species?.id || s.id
      const speciesName = s.species?.name || s.name || 'Unknown'
      const quantity = s.quantity || 1
      if (speciesId) {
        speciesObjects.value.push({ species_id: speciesId, name: speciesName, quantity, fromPackage: true })
      }
    })
  }

  const extras = pkg?.safari_extras || pkg?.sales_package_safari_extras || []
  if (Array.isArray(extras)) {
    extras.forEach((e: any) => {
      const extra = e.safari_extra || e
      selectedSafariExtras.value.push({
        id: extra.id,
        safari_extras_id: extra.id,
        name: extra.name,
        description: extra.description,
        amount: extra.amount,
        charges_per: extra.charges_per,
        currency: extra.currency,
        fromPackage: true,
      })
    })
  }
}

const addNewSpeciesItemToStorage = () => {
  if (!form.species || !form.quantity) {
    init({ message: 'Please fill all required fields.', color: 'warning' })
    return
  }

  if (Number(form.quantity) <= 0) {
    init({ message: 'Quantity must be greater than zero.', color: 'warning' })
    return
  }

  const exists = speciesObjects.value.some((species: { species_id: any }) => species.species_id === form.species.value)
  if (!exists) {
    speciesObjects.value.push({
      species_id: form.species.value,
      name: form.species.text,
      quantity: form.quantity,
      fromPackage: false,
    })
  }
}

const deleteFromStorage = (index: number) => {
  speciesObjects.value.splice(index, 1)
}

const incrementQuantity = (index: number) => {
  if (speciesObjects.value[index]) speciesObjects.value[index].quantity++
}

const decrementQuantity = (index: number) => {
  if (speciesObjects.value[index] && speciesObjects.value[index].quantity > 1) speciesObjects.value[index].quantity--
}

const removeSafariExtra = (index: number) => {
  const removed = selectedSafariExtras.value.splice(index, 1)
  if (removed.length > 0) init({ message: `Removed "${removed[0].name}" from safari extras`, color: 'info' })
}

const addQuotationInstallment = () => {
  quotationForm.installments.push({ narration: '', amount_due: 0, due_days_type: 'upon_booking', due_days: 0 })
}

const removeQuotationInstallment = (index: number) => {
  quotationForm.installments.splice(index, 1)
}

const submit = async () => {
  saving.value = true

  const ok = validateForm() && validateContactForm()
  if (!ok) {
    init({ message: 'Please fix validation errors.', color: 'warning' })
    saving.value = false
    return
  }

  if (!form.full_name || !form.country || !form.nationality || !form.email) {
    init({ message: 'Please fill in all required fields (Name, Country, Nationality, Email).', color: 'warning' })
    saving.value = false
    return
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
    init({ message: 'Please enter the number of days.', color: 'warning' })
    saving.value = false
    return
  }

  const entityData = {
    full_name: form.full_name,
    country_id: form.country?.value,
    nationality_id: form.nationality?.value,
  }

  const contacts = [
    { contact_type_id: 1, contact: form.email, contactable: true },
    { contact_type_id: 2, contact: form.phone, contactable: true },
    { contact_type_id: 3, contact: form.address, contactable: false },
  ]

  const preferences = {
    preferred_date: form.preferred_date,
    start_date: form.start_date,
    end_date: form.end_date,
    no_of_observers: form.no_of_observers || 0,
    no_of_companions: form.no_of_companions || 0,
    no_of_hunters: form.no_of_hunters || 1,
    no_of_days: form.no_of_days,
  }

  const requestdata: any = {
    entity: entityData,
    contacts,
    preferences,
    species: speciesObjects.value,
    area_id: form.area?.value,
    season_id: form.season?.value,
    safari_extras: selectedSafariExtras.value.map((extra: any) => extra.safari_extras_id || extra.id),
  }

  if (form.priceListId?.value) {
    requestdata.reference_price_list_id = form.priceListId.value
  }

  if (createQuotation.value && quotationForm.installments.length > 0) {
    requestdata.create_quotation = true
    requestdata.quotation = {
      confirmation_date: quotationForm.confirmation_date,
      hunting_license: quotationForm.hunting_license,
      remarks: quotationForm.remarks,
      installments: quotationForm.installments.map((inst) => ({
        narration: inst.narration,
        amount_due: Number(inst.amount_due),
        due_days_type: inst.due_days_type,
        due_days: Number(inst.due_days) || 0,
      })),
    }
  }

  try {
    let response: any
    if (isEditMode.value && editingInquiryId.value) {
      response = await salesStore.updateSalesInquiry(editingInquiryId.value, requestdata)
      if (response.status === 200) {
        init({ message: 'Sales inquiry updated successfully', color: 'success' })
        resetEditMode()
        resetValidationForm()
        resetValidationContactForm()
        emit('saved')
      }
    } else {
      response = await salesStore.createSalesInquiry(requestdata)
      if (response.status === 201) {
        init({ message: response.data.message || 'Sales inquiry created successfully', color: 'success' })
        resetEditMode()
        resetValidationForm()
        resetValidationContactForm()
        emit('saved')
      }
    }
  } catch (error: any) {
    console.error('Error saving sales inquiry:', error)
    if (error.response) {
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

const getSpeciesNameById = (speciesId: number): string | null => {
  if (!speciesId) return null
  const species = speciesOptions.value.find((s: any) => s.value === speciesId)
  return species ? species.text : null
}

const loadInquiryForEdit = (rowData: any) => {
  isEditMode.value = true
  editingInquiryId.value = rowData.id

  const item = rowData.selfitem || rowData
  form.full_name = item.entity?.full_name || rowData.name || ''

  const countryName = item.entity?.country?.name || item.entity?.country_name
  if (countryName) {
    const countryOption = countries.value.find((c: any) => c.text === countryName)
    if (countryOption) form.country = countryOption
  }

  const nationalityName = item.entity?.nationality?.name || item.entity?.nationality_name
  if (nationalityName) {
    const nationalityOption = nationality.value.find((n: any) => n.text === nationalityName)
    if (nationalityOption) form.nationality = nationalityOption
  }

  if (item.entity?.contacts && Array.isArray(item.entity.contacts)) {
    item.entity.contacts.forEach((contact: any) => {
      if (contact.contact_type?.name === 'email' || contact.contact_type_id === 1) {
        form.email = contact.contact || ''
      } else if (contact.contact_type?.name === 'phone_number' || contact.contact_type_id === 2) {
        form.phone = contact.contact || ''
      } else if (contact.contact_type?.name === 'address' || contact.contact_type_id === 3) {
        form.address = contact.contact || ''
      }
    })
  }

  const prefs = item.formatted_preferences || rowData.preference || {}
  form.no_of_hunters = prefs.no_of_hunters || 1
  form.no_of_observers = prefs.no_of_observers || 0
  form.no_of_days = prefs.no_of_days || 0
  form.no_of_companions = prefs.no_of_companions || 0

  if (prefs.preferred_date) form.preferred_date = prefs.preferred_date
  if (prefs.start_date) form.start_date = prefs.start_date
  if (prefs.end_date) form.end_date = prefs.end_date

  const areaName = item.inquiry_areas?.[0]?.area?.name || rowData.area
  if (areaName) {
    const areaOption = areasOptions.value.find((a: any) => a.text === areaName)
    if (areaOption) form.area = areaOption
  }

  if (item.season) {
    const seasonOption = seasonsOptions.value.find((s: any) => s.value === item.season.id || s.text === item.season.name)
    if (seasonOption) form.season = seasonOption
  }

  if (item.reference_price_list) {
    const priceListOption = packagesOptions.value.find((p: any) => p.value === item.reference_price_list.id)
    if (priceListOption) form.priceListId = priceListOption
  }

  speciesObjects.value = []
  const speciesArray = item.inquiry_species || rowData.inquiry_species || []
  speciesArray.forEach((speciesItem: any) => {
    const speciesName =
      speciesItem.species_name ||
      speciesItem.species?.name ||
      speciesItem.name ||
      getSpeciesNameById(speciesItem.species_id) ||
      'Unknown'
    speciesObjects.value.push({
      species_id: speciesItem.species_id || speciesItem.species?.id || speciesItem.id,
      name: speciesName,
      quantity: speciesItem.quantity || 1,
      fromPackage: false,
    })
  })

  selectedSafariExtras.value = []
  const safariExtrasArray = item.safari_extras || item.sales_confirmation_safari_extras || []
  safariExtrasArray.forEach((extraItem: any) => {
    const extra = extraItem.safari_extra || extraItem.safary_extra || extraItem
    selectedSafariExtras.value.push({
      id: extra.id || extraItem.safari_extras_id || extraItem.safary_extras_id,
      safari_extras_id: extra.id || extraItem.safari_extras_id || extraItem.safary_extras_id,
      name: extra.name || 'Unknown',
      description: extra.description || '',
      amount: extra.amount || 0,
      charges_per: extra.charges_per || '',
      currency: extra.currency,
    })
  })

  init({ message: 'Loaded inquiry data for editing', color: 'info' })
}

watch(
  () => props.editRow,
  (row) => {
    resetEditMode()
    resetValidationForm()
    resetValidationContactForm()
    if (row) loadInquiryForEdit(row)
  },
  { immediate: true },
)

onMounted(() => {
  getCountries()
  getCategories()
  getNationalities()
  getContactTypes()

  getSpecies()
  getAreas()
  getSeasonList()
  getPL()
  getExistingCustomers()
})
</script>

<style scoped>
/* Smooth animations for step transitions */
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

/* Sticky navigation shadow and styling */
.sales-inquiry-wizard {
  position: relative;
  padding-bottom: 80px; /* Space for sticky nav */
}

/* Floating Footer Wrapper - matches card width and adds margins */
.floating-footer-wrapper {
  position: sticky;
  background-color: transparent;
  bottom: 1rem;
  z-index: 1050;
  padding: 0 1rem;
  margin-top: 1rem;
}

/* Floating Footer - matches card width, rounded corners, shadow, doesn't touch sides */
.floating-footer {
  width: 100%;
  max-width: 100%;
  border-radius: 0.375rem;
  position: relative;
  margin: 0 auto;
}

/* Add padding to card body to prevent content from being hidden behind sticky footer */
.sales-inquiry-wizard .card-body {
  background-color: transparent;
  padding-bottom: 10px;
}
</style>
