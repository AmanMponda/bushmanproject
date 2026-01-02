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
          <div class="progress-bar bg-primary" role="progressbar"
            :style="{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }"></div>
        </div>

        <!-- Circle Wizard Stepper -->
        <div class="nav-wizards-container">
          <nav class="nav nav-wizards-3 mb-4">
            <div v-for="(step, index) in wizardSteps" :key="index" class="nav-item col">
              <a class="nav-link" :class="{
                completed: currentStep > index || (index === 0 && isStep1Complete) || (index === 1 && isStep2Complete) || (index === 2 && isStep3Complete),
                active: currentStep === index,
                disabled: currentStep < index
              }" href="#" @click.prevent="goToStep(index)">
                <div class="nav-dot">
                  <i class="fa" :class="{
                    'fa-user': index === 0,
                    'fa-calendar': index === 1,
                    'fa-hiking': index === 2,
                    'fa-check-circle': index === 3,
                  }"></i>
                </div>
                <div class="nav-title">{{ step.label }}</div>
                <i v-if="(index === 0 && isStep1Complete) || (index === 1 && isStep2Complete) || (index === 2 && isStep3Complete)"
                  class="fa fa-check-circle text-success position-absolute" style="top: 5px; right: 10px;"></i>
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
                      <input id="customerTypeNew" v-model="customerType" class="form-check-input" type="radio"
                        name="customerType" value="new" />
                      <label class="form-check-label" for="customerTypeNew"> New Customer </label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check">
                      <input id="customerTypeExisting" v-model="customerType" class="form-check-input" type="radio"
                        name="customerType" value="existing" />
                      <label class="form-check-label" for="customerTypeExisting"> Existing Customer </label>
                    </div>
                  </div>
                </div>

                <div v-if="customerType === 'existing'" class="mb-3">
                  <label class="form-label">Select Customer</label>
                  <select v-model="selectedExistingCustomer" class="form-select"
                    @change="populateFormFromCustomer(selectedExistingCustomer)">
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
                  <i v-if="form.full_name && form.country && form.nationality"
                    class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Full name <span class="text-danger">*</span></label>
                    <input v-model="form.full_name" type="text" class="form-control" placeholder="Enter your Full name"
                      required />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Country <span class="text-danger">*</span></label>
                    <select v-model="form.country" class="form-select" required>
                      <option value="">Select Country</option>
                      <option v-for="country in countries" :key="country.value" :value="country">{{ country.text }}
                      </option>
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
                  <i v-if="form.email && form.phone && form.address"
                    class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input v-model="form.email" type="email" class="form-control" placeholder="Enter your email"
                      required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Primary Phone <span class="text-danger">*</span></label>
                    <input v-model="form.phone" type="text" class="form-control" placeholder="eg: +971501234567"
                      required />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Additional Phone</label>
                    <input v-model="form.phone_additional" type="text" class="form-control"
                      placeholder="eg: +971501234567 (Optional)" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Address <span class="text-danger">*</span></label>
                    <input v-model="form.address" type="text" class="form-control" maxlength="30"
                      placeholder="Enter your address" required />
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
                        <template v-if="season.selfItem"> - {{ formatDateRange(season.selfItem.start_at,
                          season.selfItem.end_at) }} </template>
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting Package</label>
                    <select v-model="form.priceListId" class="form-select"
                      :disabled="!form.season || filteredPackagesOptions.length === 0 || loadingPackageItems" required
                      @change="populateFormFromPackage()">
                      <option value="">Select a Hunting Package</option>
                      <option v-for="pkg in filteredPackagesOptions" :key="pkg.value" :value="pkg">
                        {{ pkg.text }}
                        <template v-if="pkg.selfItem">
                          - {{ pkg.selfItem?.price_structure?.location_name || 'N/A' }} •
                          {{ pkg.selfItem?.hunting_type_name || 'N/A' }} • {{ pkg.selfItem?.hunt_length_days || 0 }} days •
                          {{ pkg.selfItem?.currency_symbol || '$' }}{{ pkg.selfItem?.amount || '0' }}
                        </template>
                      </option>
                    </select>
                    <div v-if="loadingPackageItems" class="text-primary small mt-1">
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                      Loading package items...
                    </div>
                  </div>
                </div>

                <!-- Package Details - Compact Display -->
                <div v-if="form.priceListId && form.priceListId.selfItem" class="alert alert-info mb-0 mt-3 py-2">
                  <div class="row g-2 small">
                    <div class="col-6 col-md-3">
                      <strong>Area:</strong>
                      {{ form.priceListId.selfItem?.price_structure?.location_name || 'N/A' }}
                    </div>
                    <div class="col-6 col-md-3">
                      <strong>Hunting Type:</strong>
                      {{ form.priceListId.selfItem?.hunting_type_name || 'N/A' }}
                    </div>
                    <div class="col-6 col-md-3">
                      <strong>Duration:</strong>
                      {{ form.priceListId.selfItem?.hunt_length_days || 0 }} days
                    </div>
                    <div class="col-6 col-md-3">
                      <strong>Base Amount:</strong>
                      {{ form.priceListId.selfItem?.currency_symbol || '$' }}{{ form.priceListId.selfItem?.amount || 'N/A' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hunt Dates Section - Simplified -->
            <div class="card mb-3">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-calendar-alt text-primary"></i>
                  <h5 class="mb-0">Hunt Schedule</h5>
                  <i v-if="form.start_date && form.no_of_days > 0"
                    class="fa fa-check-circle text-success ms-auto"></i>
                </div>
              </div>
              <div class="card-body py-3">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Start Date <span class="text-danger">*</span></label>
                    <input v-model="form.start_date" type="date" class="form-control" :disabled="!form.season" required
                      @change="onStartDateChange" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Number of Days <span class="text-danger">*</span></label>
                    <input v-model.number="form.no_of_days" type="number" class="form-control" min="1" required
                      placeholder="e.g., 10" @input="onDaysChange" />
                  </div>
                </div>

                <!-- Calculated Info -->
                <div v-if="form.start_date && form.no_of_days > 0"
                  class="alert alert-info mt-3 mb-0 py-2">
                  <i class="fa fa-info-circle me-2"></i>
                  <strong>Hunt Period:</strong> {{ formatDate(form.start_date) }} to {{ formatDate(calculatedEndDate) }}
                  <span class="ms-2">({{ form.no_of_days }} days)</span>
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
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting Area</label>
                    <select v-model="form.area" class="form-select" required>
                      <option value="">Select Area</option>
                      <option v-for="area in areasOptions" :key="area.value" :value="area">{{ area.text }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Number of Participants <span class="text-danger">*</span></label>
                    <input v-model="form.no_of_participants" type="number" class="form-control" min="1" required placeholder="e.g., 2" />
                  </div>
                </div>

                <!-- Additional Preference Fields -->
                <div class="row g-3 mt-2">
                  <div class="col-md-6">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Previous Experience</label>
                    <select v-model="form.prev_experience" class="form-select">
                      <option value="">Select Experience Level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div class="row g-3 mt-2">
                  <div class="col-12">
                    <label class="form-label small text-uppercase fw-bold text-muted mb-1">Special Requests</label>
                    <textarea v-model="form.special_requests" class="form-control" rows="2"
                      placeholder="Any special requests or requirements..." ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upgrade Fees Section -->
            <div v-if="form.priceListId?.selfItem?.upgrade_fees && form.priceListId.selfItem.upgrade_fees.length > 0"
              class="card mb-3">
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
                    <input v-model="form.quantity" type="number" class="form-control" min="1" max="100"
                      placeholder="Qty" />
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
                    <small class="text-muted">Click priority badge to toggle</small>
                  </div>
                  <div v-if="speciesObjects.length > 0" class="list-group">
                    <div v-for="(s, index) in speciesObjects" :key="index"
                      class="list-group-item d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center gap-2">
                        <strong>{{ s.name }}</strong>
                        <span v-if="s.fromPackage" class="badge bg-info">from Package</span>
                        <span 
                          class="badge cursor-pointer" 
                          :class="s.priority === 'MUST_HAVE' ? 'bg-danger' : 'bg-secondary'"
                          @click="togglePriority(index)"
                          :title="s.priority === 'MUST_HAVE' ? 'Click to change to Nice to Have' : 'Click to change to Must Have'"
                          style="cursor: pointer;">
                          {{ s.priority === 'MUST_HAVE' ? 'MUST HAVE' : 'NICE TO HAVE' }}
                        </span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" :disabled="s.quantity <= 1"
                          @click="decrementQuantity(index)">
                          <i class="fa fa-minus"></i>
                        </button>
                        <span class="badge bg-primary" style="min-width: 30px">{{ s.quantity }}</span>
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
                  <div v-else class="alert alert-secondary mb-0">No species selected yet. Add species using the form
                    above or select
                    a package.</div>
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

              <div v-if="selectedSafariExtras.length === 0" class="alert alert-secondary border-start border-4"
                role="alert">
                <h6 class="alert-heading">No Safari Extras Selected</h6>
                <p class="mb-0">Safari extras will be populated when you select a package. You can also add them
                  manually later.
                </p>
              </div>

              <template v-else>
                <div class="alert alert-info border-start border-4" role="alert">
                  <h6 class="alert-heading">Customize Safari Extras ({{ selectedSafariExtras.length }} selected)</h6>
                  <p class="mb-0">Remove any safari extras that your client does not require by clicking the remove
                    button.</p>
                </div>

                <div class="card mb-3 bg-light">
                  <div class="card-body">
                    <div class="d-flex flex-column gap-3">
                      <div v-for="(extra, index) in selectedSafariExtras" :key="extra.id"
                        class="p-3 border rounded bg-white d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-3">
                          <div class="fw-semibold text-capitalize">{{ extra.name }}</div>
                          <span v-if="extra.fromPackage" class="badge bg-info">FROM PACKAGE</span>
                          <small class="text-muted">{{ extra.description }}</small>
                          <span v-if="extra.charges_per" class="badge bg-secondary">{{ extra.charges_per }}</span>
                        </div>

                        <div class="d-flex align-items-center gap-2">
                          <small class="text-muted me-3">{{ extra.currency_code || 'USD' }} {{ extra.amount }}</small>
                          <button type="button" class="btn btn-sm btn-outline-danger" title="Remove this safari extra"
                            @click="removeSafariExtra(index)">
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
            <div v-if="trophyFees.length > 0" class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="fa fa-trophy text-warning fs-4"></i>
                <h3 class="h5 mb-0 fw-bold">Trophy Fees</h3>
              </div>

              <div class="alert alert-warning border-start border-4" role="alert">
                <h6 class="alert-heading">
                  Trophy Fees ({{ trophyFees.length }} items)
                </h6>
                <p class="mb-0">These are per-animal fees charged when the animal is harvested. Fees may vary by sequence (1st, 2nd animal, etc.).</p>
              </div>

              <div class="card mb-3 bg-light">
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th class="text-start">Species</th>
                          <th class="text-center">Sequence</th>
                          <th class="text-end">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(fee, index) in trophyFees" :key="`trophy-${fee.id}-${index}`">
                          <td class="fw-medium">{{ fee.species_name || 'Unknown' }}</td>
                          <td class="text-center">
                            <span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span>
                          </td>
                          <td class="text-end fw-semibold">
                            {{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Per Participant Costs Section -->
            <div v-if="companionCosts.length > 0" class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <i class="fa fa-users text-info fs-4"></i>
                <h3 class="h5 mb-0 fw-bold">Per Participant Daily Rates</h3>
              </div>

              <div class="alert alert-info border-start border-4" role="alert">
                <h6 class="alert-heading">Daily Rates for Participants</h6>
                <p class="mb-0">These are daily rates per participant. Total cost = Rate × Days × Number of Participants.</p>
              </div>

              <div class="card mb-3 bg-light">
                <div class="card-body">
                  <div v-for="(cost, index) in companionCosts" :key="`companion-${cost.id}-${index}`"
                    class="d-flex justify-content-between align-items-center p-3 border rounded bg-white mb-2">
                    <div>
                      <div class="fw-semibold">{{ cost.description }}</div>
                      <small class="text-muted">Per participant per day</small>
                    </div>
                    <div class="text-end">
                      <div class="fw-bold fs-5">{{ cost.currency_code || 'USD' }} {{ cost.amount.toLocaleString() }}</div>
                      <div v-if="form.no_of_participants > 0 && huntDuration > 0" class="small text-success">
                        Estimated: {{ cost.currency_code || 'USD' }} {{ (cost.amount * form.no_of_participants * huntDuration).toLocaleString() }}
                        <br><small class="text-muted">({{ form.no_of_participants }} participants × {{ huntDuration }} days)</small>
                      </div>
                    </div>
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
                      <p class="text-muted small mb-0">Enable this option to generate a quotation with payment
                        installments for
                        the client.</p>
                    </div>
                    <div class="form-check form-switch">
                      <input v-model="createQuotation" class="form-check-input" type="checkbox" role="switch"
                        id="createQuotationSwitch" style="width: 3rem; height: 1.5rem;">
                      <label class="form-check-label" for="createQuotationSwitch"></label>
                    </div>
                  </div>

                  <template v-if="createQuotation">
                    <hr class="my-3" />

                    <div class="row g-3 mb-3">
                      <div class="col-md-6">
                        <label class="form-label small text-uppercase fw-bold text-muted mb-1">Confirmation Date</label>
                        <input v-model="quotationForm.confirmation_date" type="date" class="form-control"
                          placeholder="Select confirmation date" />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label small text-uppercase fw-bold text-muted mb-1">Hunting License
                          (Optional)</label>
                        <input v-model="quotationForm.hunting_license" type="text" class="form-control"
                          placeholder="Enter license number" />
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label small text-uppercase fw-bold text-muted mb-1">Remarks (Optional)</label>
                      <textarea v-model="quotationForm.remarks" class="form-control" rows="2"
                        placeholder="Add any additional notes or remarks..."></textarea>
                    </div>

                    <div class="mb-3">
                      <div class="d-flex align-items-center justify-content-between mb-3">
                        <label class="form-label small text-uppercase fw-bold text-muted mb-0">Payment
                          Installments</label>
                        <button type="button" class="btn btn-sm btn-secondary" @click="addQuotationInstallment">
                          <i class="fa fa-plus me-1"></i> Add Installment
                        </button>
                      </div>

                      <div v-if="quotationForm.installments.length === 0"
                        class="alert alert-warning border-start border-4" role="alert">
                        <h6 class="alert-heading">Required</h6>
                        <p class="mb-0">At least one payment installment is required to create a quotation.</p>
                      </div>

                      <div v-for="(installment, index) in quotationForm.installments" :key="index"
                        class="card mb-3 bg-light">
                        <div class="card-body">
                          <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="fw-semibold">Installment {{ index + 1 }}</span>
                            <button type="button" class="btn btn-sm btn-outline-danger"
                              @click="removeQuotationInstallment(index)">
                              <i class="fa fa-trash"></i>
                            </button>
                          </div>
                          <div class="row g-3">
                            <div class="col-md-3">
                              <label class="form-label small">Description</label>
                              <input v-model="installment.narration" type="text" class="form-control"
                                placeholder="e.g., Deposit Due upon booking" />
                            </div>
                            <div class="col-md-3">
                              <label class="form-label small">Amount (USD)</label>
                              <input v-model="installment.amount_due" type="number" class="form-control"
                                placeholder="5000" />
                            </div>
                            <div class="col-md-3">
                              <label class="form-label small">Due Type</label>
                              <select v-model="installment.due_days_type" class="form-select">
                                <option value="">Select when due</option>
                                <option v-for="opt in dueDaysTypeOptions" :key="opt.value" :value="opt.value">{{
                                  opt.text }}</option>
                              </select>
                            </div>
                            <div class="col-md-3">
                              <label class="form-label small">{{ installment.due_days_type === 'before_arrival' ? 'Days Before Arrival' : 'Due Days' }}</label>
                              <input v-model="installment.due_days" type="number" class="form-control"
                                placeholder="e.g., 90" :disabled="installment.due_days_type === 'upon_booking'" />
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
                    <div class="col-md-4"><span class="text-muted">Full Name:</span><span class="ms-2 fw-medium">{{
                      form.full_name
                        || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Country:</span><span class="ms-2 fw-medium">{{
                      form.country?.text || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Nationality:</span><span class="ms-2 fw-medium">{{
                      form.nationality?.text || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Email:</span><span class="ms-2 fw-medium">{{
                        form.email ||
                        'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Primary Phone:</span><span class="ms-2 fw-medium">{{
                        form.phone
                        || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Additional Phone:</span><span
                        class="ms-2 fw-medium">{{
                          form.phone_additional || 'N/A' }}</span></div>
                    <div class="col-12"><span class="text-muted">Address:</span><span class="ms-2 fw-medium">{{
                      form.address ||
                        'N/A' }}</span></div>
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
                    <div class="col-md-6"><span class="text-muted">Season:</span><span class="ms-2 fw-medium">{{
                      form.season?.text
                        || 'N/A' }}</span></div>
                    <div class="col-md-6"><span class="text-muted">Package:</span><span class="ms-2 fw-medium">{{
                      form.priceListId?.text || 'No package selected' }}</span></div>
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
                    <div class="col-md-4"><span class="text-muted">Start Date:</span><span class="ms-2 fw-medium">{{
                      formatReviewDate(form.start_date) }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Days:</span><span class="ms-2 fw-medium">{{ form.no_of_days || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">End Date:</span><span class="ms-2 fw-medium text-info">{{
                        formatReviewDate(calculatedEndDate) }}</span></div>
                  </div>
                  <hr class="my-2" />
                  <div class="row g-3 small">
                    <div class="col-md-4"><span class="text-muted">Hunting Area:</span><span
                        class="ms-2 fw-medium">{{
                          form.area?.text || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Days:</span><span class="ms-2 fw-medium">{{ huntDuration || 'N/A' }}</span></div>
                    <div class="col-md-4"><span class="text-muted">Participants:</span><span class="ms-2 fw-medium">{{
                      form.no_of_participants || 1 }}</span></div>
                  </div>
                  <hr class="my-2" />
                  <div class="row g-3 small">
                    <div class="col-md-3"><span class="text-muted">Experience:</span><span class="ms-2 fw-medium">{{
                      form.prev_experience || 'N/A' }}</span></div>
                    <div class="col-md-9"></div>
                  </div>
                  <div v-if="form.special_requests" class="row g-3 small mt-1">
                    <div class="col-12"><span class="text-muted">Special Requests:</span><span class="ms-2 fw-medium">{{
                      form.special_requests }}</span></div>
                  </div>
                </div>
              </div>

              <!-- Enquiry Remarks -->
              <div class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-comment text-primary"></i>
                    <h6 class="mb-0">Enquiry Remarks</h6>
                  </div>
                </div>
                <div class="card-body">
                  <textarea v-model="form.remarks" class="form-control" rows="3"
                    placeholder="Add any additional remarks or notes for this enquiry (optional)..."></textarea>
                </div>
              </div>

              <!-- Budget Information -->
              <div class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-dollar-sign text-primary"></i>
                    <h6 class="mb-0">Budget Information</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Budget Minimum (USD)</label>
                      <input v-model="form.budget_min" type="number" class="form-control" min="0" 
                        placeholder="e.g., 5000" />
                      <small class="text-muted">Enter the minimum budget for this hunt</small>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Budget Maximum (USD)</label>
                      <input v-model="form.budget_max" type="number" class="form-control" min="0" 
                        placeholder="e.g., 15000" />
                      <small class="text-muted">Enter the maximum budget for this hunt</small>
                    </div>
                  </div>
                  <div v-if="form.budget_min && form.budget_max" class="alert alert-info mt-3 mb-0">
                    <i class="fa fa-info-circle me-2"></i>
                    <strong>Budget Range:</strong> ${{ form.budget_min.toLocaleString() }} - ${{ form.budget_max.toLocaleString() }}
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
                    <span v-for="(s, index) in speciesObjects" :key="index" class="badge"
                      :class="s.fromPackage ? 'bg-info' : 'bg-primary'">
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
                      {{ extra.name }} - {{ extra.currency_code || 'USD' }} {{ extra.amount }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Trophy Fees Summary -->
              <div v-if="trophyFees.length > 0" class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-trophy text-warning"></i>
                    <h6 class="mb-0">Trophy Fees ({{ trophyFees.length }})</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover table-sm mb-0">
                      <thead>
                        <tr>
                          <th class="text-start">Species</th>
                          <th class="text-center">Sequence</th>
                          <th class="text-end">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(fee, index) in trophyFees" :key="`trophy-review-${fee.id}-${index}`">
                          <td class="fw-medium">{{ fee.species_name || 'Unknown' }}</td>
                          <td class="text-center">
                            <span class="badge bg-primary">{{ getSequenceLabel(fee.sequence_order) }}</span>
                          </td>
                          <td class="text-end fw-semibold">{{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Per Participant Costs Summary -->
              <div v-if="companionCosts.length > 0 && form.no_of_participants > 0" class="card mb-3">
                <div class="card-header bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-users text-info"></i>
                    <h6 class="mb-0">Per Participant Daily Rate</h6>
                  </div>
                </div>
                <div class="card-body">
                  <div v-for="cost in companionCosts" :key="cost.id" class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="text-muted">{{ cost.description }}</span>
                      <span class="ms-2 fw-medium">{{ cost.currency_code || 'USD' }} {{ cost.amount.toLocaleString() }}/day/participant</span>
                    </div>
                    <div class="fw-bold text-info">
                      Est: {{ cost.currency_code || 'USD' }} {{ (cost.amount * form.no_of_participants * (huntDuration || 1)).toLocaleString() }}
                    </div>
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
            <button v-if="currentStep < wizardSteps.length - 1" type="button" class="btn btn-primary"
              :disabled="!canProceedToNextStep" @click="nextStep">
              Next
            </button>
            <button v-else type="button" class="btn btn-primary" :disabled="!isValidForm || saving" @click="submit()">
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
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useAuthStore } from '@/stores/auth'

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
  no_of_participants: 1,
  priceListId: null as any,
  no_of_days: 0,
  no_of_companions: 0,
  species: null as any,
  quantity: 0,
  area: null as any,
  season: null as any,
  start_date: null as any,
  // Additional fields for backend preference
  remarks: '',
  prev_experience: '',
  budget_min: null as number | null,
  budget_max: null as number | null,
  payment_method_id: null as number | null,
  special_requests: '',
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
const trophyFees = ref<any[]>([])
const companionCosts = ref<any[]>([])
const loadingPackageItems = ref(false)
const selectedPackageDetail = ref<any>(null)

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

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const salesPackagesSpecies = computed(() => settingsStore.salesPackagesSpecies)
const huntLengths = ref<any[]>([])

const bookedDatesForSelectedSeason = computed(() => bookedDates.value)
const currentUserId = computed(() => {
  const rawId = authStore.user?.id
  const parsed = rawId ? Number(rawId) : null
  return Number.isFinite(parsed) ? parsed : null
})

const isStep1Complete = computed(
  () => !!(form.full_name && form.country && form.nationality && form.email && form.phone && form.address),
)

const isStep2Complete = computed(
  () => !!(form.season && form.start_date && form.no_of_days > 0 && speciesObjects.value.length > 0),
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
        hasInput(form.start_date) &&
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

const filteredPackagesOptions = computed(() => {
  if (!form.season?.value) return []
  // Return all packages when a season is selected
  return packagesOptions.value
})

const speciesList = computed(() => salesPackagesSpecies.value)

const huntDuration = computed(() => {
  // Use the no_of_days directly from form
  return form.no_of_days || 0
})

const calculatedEndDate = computed(() => {
  if (!form.start_date || !form.no_of_days) return null
  const start = new Date(form.start_date)
  const end = new Date(start)
  end.setDate(start.getDate() + form.no_of_days - 1)
  return end.toISOString().split('T')[0]
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
  form.nick_name = ''
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
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null
  resetQuotationForm()
  customerType.value = 'new'
  selectedExistingCustomer.value = null
  currentStep.value = 0
  // Reset additional preference fields
  form.remarks = ''
  form.prev_experience = ''
  form.budget_min = null
  form.budget_max = null
  form.payment_method_id = null
  form.special_requests = ''
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



const apiBaseUrl = (() => {
  const base = import.meta.env.VITE_APP_BASE_URL || ''
  return base.replace(/\/+$/, '')
})()

const getSpecies = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/price-items`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const raw = response.data?.data ?? response.data ?? []
    const dataArray = Array.isArray(raw) ? raw : []
    speciesOptions.value = dataArray
      .flatMap((item: any) => item.sales_packages || [])
      .flatMap((pkg: any) => pkg.species || [])
      .map((sp: any) => ({ value: sp.species_id, text: sp.species_name }))
  } catch (error) {
    console.error('Error loading items:', error)
  }
}

const getAreas = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/locations`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const raw = response.data?.data ?? response.data ?? []
    const dataArray = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
    areasOptions.value = dataArray.map((item: any) => ({ value: item.id, text: item.name }))
  } catch (error) {
    console.log(error)
  }
}

const getSeasonList = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/seasons`, {
      headers: { 'Content-Type': 'application/json' },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Handle different response structures
    const seasonsData = response.data?.data || response.data || []
    console.log('Seasons data:', seasonsData)

    if (!Array.isArray(seasonsData)) {
      console.error('Seasons data is not an array:', seasonsData)
      return
    }

    seasonsOptions.value = seasonsData
      .filter((item: any) => {
        if (!item.end_at) return true
        const endDate = new Date(item.end_at)
        endDate.setHours(23, 59, 59, 999)
        return endDate >= today
      })
      .map((item: any) => ({ value: item.id, text: item.name, selfItem: item }))

    console.log('Filtered seasons options:', seasonsOptions.value)
  } catch (error) {
    console.error('Error fetching seasons:', error)
  }
}


const getPL = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/settings/price-items`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const dataArray = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data) ? response.data : []
    packagesOptions.value = dataArray.map((item: any) => ({
      value: item.id,
      text: item.package_name || item.name || item.code || `Package #${item.id}`,
      selfItem: item,
    }))
  } catch (error) {
    console.error('Error loading packages:', error)
  }
}

const getExistingCustomers = async () => {
  loadingCustomers.value = true
  try {
    const response = await salesEnquiryService.list()
    if (response.success) {
      const dataArray = Array.isArray(response.data) ? response.data : []
      const customersMap = new Map()

      dataArray.forEach((item: any) => {
        const entity = item.entity
        if (entity && entity.id && !customersMap.has(entity.id)) {
          let email = ''
          let phone = ''
          let address = ''

          if (entity.contacts && Array.isArray(entity.contacts)) {
            entity.contacts.forEach((contact: any) => {
              const contactType = String(contact.type || '').toLowerCase()
              if (contactType === 'email' || contact.contact_type_id === 1) {
                email = contact.contact || ''
              } else if (contactType === 'phone_number' || contactType === 'phone' || contact.contact_type_id === 2) {
                phone = contact.contact || ''
              } else if (contactType === 'address' || contact.contact_type_id === 3) {
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
              country: entity.country || entity.country_name,
              nationality: entity.nationality || entity.nationality_name,
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

  const countryId = entity.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) form.country = countryOption
  } else if (entity.country) {
    const countryOption = countries.value.find((c: any) => c.text === entity.country)
    if (countryOption) form.country = countryOption
  }

  const nationalityId = entity.nationality_id
  if (nationalityId) {
    const nationalityOption = nationality.value.find((n: any) => n.value === nationalityId)
    if (nationalityOption) form.nationality = nationalityOption
  } else if (entity.nationality) {
    const nationalityOption = nationality.value.find((n: any) => n.text === entity.nationality)
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
  form.start_date = null
  form.no_of_days = 0

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

const onStartDateChange = () => {
  checkBookedDateConflict()
}

const onDaysChange = () => {
  checkBookedDateConflict()
}

const populateFormFromPackage = async () => {
  if (!form.priceListId?.selfItem) return
  const pkg = form.priceListId.selfItem
  const priceStructureDetailId = form.priceListId.value

  // Reset all package-related data
  speciesObjects.value = []
  selectedSafariExtras.value = []
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null

  // Get area from price_structure.location_name
  const areaName = pkg?.price_structure?.location_name
  if (areaName) {
    const areaOption = areasOptions.value.find((a: any) => a.text === areaName)
    if (areaOption) form.area = areaOption
  }

  // Get duration from hunt_length_days (optional, doesn't force it)
  const duration = pkg?.hunt_length_days || pkg?.regulatory_package?.duration
  if (duration && !form.no_of_days) {
    form.no_of_days = Number(duration)
  }

  // Fetch items from preview endpoint
  if (priceStructureDetailId) {
    loadingPackageItems.value = true
    try {
      const response = await salesEnquiryService.previewPriceItems(priceStructureDetailId)
      if (response.success && response.data) {
        const data = response.data

        // Store package detail info
        selectedPackageDetail.value = data.price_structure_detail

        // Populate species (item_preferences)
        if (Array.isArray(data.species)) {
          data.species.forEach((s: any) => {
            speciesObjects.value.push({
              species_id: s.item_id,
              name: s.item_name,
              quantity: s.quantity || 1,
              notes: s.notes || '',
              priority: 'NICE_TO_HAVE',
              fromPackage: true,
            })
          })
        }

        // Populate safari extras (includes observer fees)
        if (Array.isArray(data.safari_extras)) {
          data.safari_extras.forEach((extra: any) => {
            selectedSafariExtras.value.push({
              id: extra.id,
              safari_extra_id: extra.safari_extra_id,
              name: extra.name,
              description: extra.description || '',
              amount: parseFloat(extra.amount) || 0,
              charges_per: extra.charges_per,
              currency_code: extra.currency_code,
              fromPackage: true,
            })
          })
        }

        // Populate trophy fees
        if (Array.isArray(data.trophy_fees)) {
          trophyFees.value = data.trophy_fees.map((fee: any) => ({
            id: fee.id,
            species_id: fee.species_id,
            species_name: fee.species_name,
            sequence_order: fee.sequence_order,
            amount: parseFloat(fee.amount) || 0,
            currency_code: fee.currency_code,
          }))
        }

        // Populate companion costs (per participant daily rates)
        // Calculate estimated daily rate from available hunt length costs
        if (Array.isArray(data.companion_costs) && data.companion_costs.length > 0) {
          // Group costs by hunt_length_id to get the rate structure
          const costsByHuntLength = data.companion_costs.reduce((acc: any, cost: any) => {
            if (!acc[cost.hunt_length_id]) {
              acc[cost.hunt_length_id] = []
            }
            acc[cost.hunt_length_id].push(cost)
            return acc
          }, {})

          // Calculate average daily rate from all available hunt length costs
          let totalDailyRate = 0
          let countRates = 0
          
          for (const huntLengthId in costsByHuntLength) {
            const costs = costsByHuntLength[huntLengthId]
            const huntLength = huntLengths.value.find((hl: any) => hl.id === Number(huntLengthId))
            if (huntLength && huntLength.days > 0) {
              costs.forEach((cost: any) => {
                const dailyRate = parseFloat(cost.amount) / huntLength.days
                totalDailyRate += dailyRate
                countRates++
              })
            }
          }

          // Use average daily rate
          const estimatedDailyRate = countRates > 0 ? totalDailyRate / countRates : 0
          
          if (estimatedDailyRate > 0) {
            companionCosts.value = [{
              id: 'estimated',
              amount: estimatedDailyRate,
              currency_code: data.companion_costs[0]?.currency_code || 'USD',
              description: 'Estimated per participant daily rate',
              is_estimated: true
            }]
          }
        }

        init({ message: 'Package items loaded successfully', color: 'success' })
      }
    } catch (error) {
      console.error('Error fetching package items:', error)
      // Fallback to old method if preview endpoint fails
      populateFormFromPackageFallback(pkg)
    } finally {
      loadingPackageItems.value = false
    }
  }
}

// Fallback method if preview endpoint is not available
const populateFormFromPackageFallback = (pkg: any) => {
  // Get species from sales_packages[0].species
  const salesPackages = pkg?.sales_packages || []
  if (Array.isArray(salesPackages) && salesPackages.length > 0) {
    const firstPackage = salesPackages[0]
    const pkgSpecies = firstPackage?.species || []
    
    if (Array.isArray(pkgSpecies)) {
      pkgSpecies.forEach((s: any) => {
        const speciesId = s.species_id
        const speciesName = s.species_name || s.species?.name || 'Unknown'
        const quantity = s.quantity || 1
        if (speciesId) {
          speciesObjects.value.push({ 
            species_id: speciesId, 
            name: speciesName, 
            quantity, 
            priority: 'NICE_TO_HAVE',
            fromPackage: true 
          })
        }
      })
    }
  }

  // Safari extras from old structure
  const extras = pkg?.safari_extras || []
  if (Array.isArray(extras)) {
    extras.forEach((e: any) => {
      const extra = e.safari_extra || e
      selectedSafariExtras.value.push({
        id: extra.id,
        safari_extra_id: extra.id,
        name: extra.name,
        description: extra.description,
        amount: extra.amount,
        charges_per: extra.charges_per,
        currency_code: extra.currency?.code || 'USD',
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
      priority: 'NICE_TO_HAVE',
      notes: '',
      fromPackage: false,
    })
    // Reset form fields after adding
    form.species = null
    form.quantity = 0
  } else {
    init({ message: 'This species is already added. Update the quantity instead.', color: 'warning' })
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

const togglePriority = (index: number) => {
  if (speciesObjects.value[index]) {
    speciesObjects.value[index].priority = 
      speciesObjects.value[index].priority === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE'
  }
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
    init({ message: 'Please select valid start and end dates.', color: 'warning' })
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
    date: form.start_date || new Date().toISOString().split('T')[0],
    user_id: 1, // Hardcoded to user ID 1
    season_id: form.season?.value || null,
    status: isEditMode.value ? undefined : 'NEW', // Only set status on create
    remarks: form.remarks || null,
    
    // Areas - backend expects array of { location_id }
    areas: form.area ? [{ location_id: form.area.value }] : [],
    
    // Item preferences (game preferences) - backend expects item_id, not species_item_id
    item_preferences: speciesObjects.value.map((item: any) => ({
      item_id: item.species_id || item.item_id || item.id,
      desired_quantity: item.quantity || 1,
      priority: item.priority || 'NICE_TO_HAVE',
      notes: item.notes || null,
    })),
    
    // Preference - backend uses no_of_participants
    preference: {
      prev_experience: form.prev_experience || null,
      no_of_participants: form.no_of_participants || 1,
      preferred_start_date: form.start_date || null,
      no_of_days: form.no_of_days || null,
      budget_min: form.budget_min || null,
      budget_max: form.budget_max || null,
      payment_method_id: form.payment_method_id || null,
      special_requests: form.special_requests || null,
    },
  }

  // Either use existing entity_id OR create new client
  if (customerType.value === 'existing' && selectedExistingCustomer.value?.value) {
    requestdata.entity_id = selectedExistingCustomer.value.value
  } else {
    // Create new client with contacts
    // Backend expects: contact_type_id 1=email, 2=phone, 3=address
    const contacts: Array<{ contact_type_id: number; contact: string; contactable: boolean }> = []
    
    if (form.email) {
      contacts.push({ contact_type_id: 1, contact: form.email, contactable: true })
    }
    if (form.phone) {
      contacts.push({ contact_type_id: 2, contact: form.phone, contactable: true })
    }
    if (form.phone_additional) {
      contacts.push({ contact_type_id: 2, contact: form.phone_additional, contactable: true })
    }
    if (form.address) {
      contacts.push({ contact_type_id: 3, contact: form.address, contactable: false })
    }
    
    requestdata.client = {
      full_name: form.full_name,
      nick_name: form.nick_name || null,
      country_id: form.country?.value || null,
      nationality_id: form.nationality?.value || null,
      contacts,
    }
  }

  try {
    let response: any
    if (isEditMode.value && editingInquiryId.value) {
      response = await salesEnquiryService.update(editingInquiryId.value, requestdata)
      if (response.success) {
        init({ message: 'Sales inquiry updated successfully', color: 'success' })
        resetEditMode()
        resetValidationForm()
        resetValidationContactForm()
        emit('saved')
      }
    } else {
      response = await salesEnquiryService.create(requestdata)
      if (response.success) {
        init({ message: response.message || 'Sales inquiry created successfully', color: 'success' })
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
  
  // Load entity/client information
  form.full_name = item.entity?.full_name || rowData.name || ''
  form.nick_name = item.entity?.nick_name || ''

  const countryId = item.entity?.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) form.country = countryOption
  } else if (item.entity?.country) {
    const countryOption = countries.value.find((c: any) => c.text === item.entity.country)
    if (countryOption) form.country = countryOption
  }

  const nationalityId = item.entity?.nationality_id
  if (nationalityId) {
    const nationalityOption = nationality.value.find((n: any) => n.value === nationalityId)
    if (nationalityOption) form.nationality = nationalityOption
  } else if (item.entity?.nationality) {
    const nationalityOption = nationality.value.find((n: any) => n.text === item.entity.nationality)
    if (nationalityOption) form.nationality = nationalityOption
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
  form.no_of_participants = prefs.no_of_participants || 1
  form.no_of_hunters = prefs.no_of_participants || 1
  form.no_of_observers = 0
  form.no_of_companions = 0
  form.no_of_days = prefs.no_of_days || 0
  form.prev_experience = prefs.prev_experience || ''
  form.budget_min = prefs.budget_min || null
  form.budget_max = prefs.budget_max || null
  form.payment_method_id = prefs.payment_method_id || null
  form.special_requests = prefs.special_requests || ''

  // Load dates from preference
  if (prefs.preferred_start_date) {
    form.start_date = prefs.preferred_start_date.split('T')[0]
  }
  form.no_of_days = prefs.no_of_days || 0

  // Load areas - backend returns areas with location_id and location object
  const locationId = item.areas?.[0]?.location_id
  const locationName = item.areas?.[0]?.location?.name
  if (locationId) {
    const areaOption = areasOptions.value.find((a: any) => a.value === locationId)
    if (areaOption) form.area = areaOption
  } else if (locationName) {
    const areaOption = areasOptions.value.find((a: any) => a.text === locationName)
    if (areaOption) form.area = areaOption
  }

  // Load season
  if (item.season) {
    const seasonOption = seasonsOptions.value.find((s: any) => s.value === item.season.id || s.text === item.season.name)
    if (seasonOption) form.season = seasonOption
  }

  form.priceListId = null

  // Load item_preferences (game preferences) - backend uses item_id
  speciesObjects.value = []
  const itemPreferences = item.item_preferences || []
  itemPreferences.forEach((pref: any) => {
    const itemId = pref.item_id || pref.species_item_id
    const itemName = pref.item_name || getSpeciesNameById(itemId) || 'Unknown'
    speciesObjects.value.push({
      species_id: itemId,
      name: itemName,
      quantity: pref.desired_quantity || 1,
      priority: pref.priority || 'NICE_TO_HAVE',
      notes: pref.notes || '',
      fromPackage: false,
    })
  })

  selectedSafariExtras.value = []

  // Set customer type to existing since we're editing
  customerType.value = 'existing'
  if (item.entity_id) {
    selectedExistingCustomer.value = {
      value: item.entity_id,
      text: item.entity?.full_name || 'Unknown',
      selfItem: item.entity,
    }
  }

  init({ message: 'Loaded inquiry data for editing', color: 'info' })
}

const loadHuntLengths = async () => {
  try {
    await priceListStore.getHuntLengths()
    huntLengths.value = priceListStore.huntLengths || []
  } catch (error) {
    console.error('Failed to load hunt lengths:', error)
  }
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

onMounted(async () => {
  await loadHuntLengths()
  getCountries()
  getNationalities()
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
  padding-bottom: 80px;
  /* Space for sticky nav */
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
