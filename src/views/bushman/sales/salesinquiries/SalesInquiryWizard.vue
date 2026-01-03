<template>
  <div class="sales-inquiry-wizard-container">
    <!-- Header -->
    <div class="card mb-3">
      <div class="card-header bg-transparent">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <i class="fa fa-edit text-primary fs-4"></i>
            <h2 class="h4 mb-0">{{ isEditMode ? 'Edit Enquiry' : 'Create New Enquiry' }}</h2>
          </div>
        </div>
      </div>
    </div>

    <!-- Vueform Wizard -->
    <Vueform
      ref="vueformRef"
      :endpoint="false"
      :display-errors="false"
      :columns="{ container: 12, label: 12, wrapper: 12 }"
      @submit="handleSubmit"
    >
      <!-- Wizard Steps -->
      <template #empty>
        <FormSteps>
          <FormStep 
            name="customer" 
            label="Customer Info"
            :elements="['customerSection', 'basicInfoSection', 'contactInfoSection']"
            :labels="{ next: 'Next Step' }"
          />
          <FormStep 
            name="package" 
            label="Package & Schedule"
            :elements="['seasonPackageSection', 'huntScheduleSection', 'huntPartySection', 'speciesSection']"
            :labels="{ previous: 'Back', next: 'Next Step' }"
          />
          <FormStep 
            name="extras" 
            label="Safari Extras"
            :elements="['safariExtrasSection', 'trophyFeesSection', 'companionCostsSection']"
            :labels="{ previous: 'Back', next: 'Review' }"
          />
          <FormStep 
            name="review" 
            label="Review & Submit"
            :elements="['reviewSection']"
            :labels="{ previous: 'Back', finish: saving ? 'Saving...' : 'Submit Enquiry' }"
            @activate="syncFormData"
          />
        </FormSteps>

        <!-- Step 1: Customer Information -->
        <GroupElement name="customerSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="fa fa-user text-primary"></i>
              <h5 class="mb-0">Customer Selection</h5>
            </div>
          </template>
          
          <StaticElement name="customerAlert">
            <div class="alert alert-info mb-3">
              <strong>New or Existing Customer?</strong><br />
              Select an existing customer to auto-fill their information, or choose "New Customer" to enter details manually.
            </div>
          </StaticElement>

          <RadiogroupElement
            name="customerType"
            :default="'new'"
            :items="[
              { value: 'new', label: 'New Customer' },
              { value: 'existing', label: 'Existing Customer' }
            ]"
            view="tabs"
            @change="onCustomerTypeChange"
          />

          <SelectElement
            v-show="customerType === 'existing'"
            name="existingCustomer"
            label="Select Customer"
            placeholder="Search and select an existing customer"
            :items="existingCustomerItems"
            :search="true"
            :native="false"
            :object="true"
            :columns="{ container: 12 }"
            :loading="loadingCustomers"
            @select="onExistingCustomerSelect"
          />
        </GroupElement>

        <GroupElement name="basicInfoSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-id-card text-primary"></i>
              <h5 class="mb-0">Basic Information</h5>
            </div>
          </template>

          <TextElement
            name="full_name"
            label="Full Name"
            placeholder="Enter full name"
            :columns="{ container: 6 }"
            rules="required"
          />

          <SelectElement
            name="country"
            label="Country"
            placeholder="Select Country"
            :items="countryItems"
            :search="true"
            :native="false"
            :columns="{ container: 6 }"
            rules="required"
          />

          <SelectElement
            name="nationality"
            label="Nationality"
            placeholder="Select Nationality"
            :items="nationalityItems"
            :search="true"
            :native="false"
            :columns="{ container: 6 }"
            rules="required"
          />
        </GroupElement>

        <GroupElement name="contactInfoSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-envelope text-primary"></i>
              <h5 class="mb-0">Contact Information</h5>
            </div>
          </template>

          <TextElement
            name="email"
            label="Email"
            input-type="email"
            placeholder="Enter email address"
            :columns="{ container: 6 }"
            rules="required|email"
          />

          <TextElement
            name="phone"
            label="Primary Phone"
            placeholder="e.g., +971501234567"
            :columns="{ container: 6 }"
            rules="required"
          />

          <TextElement
            name="phone_additional"
            label="Additional Phone"
            placeholder="e.g., +971501234567 (Optional)"
            :columns="{ container: 6 }"
          />

          <TextElement
            name="address"
            label="Address"
            placeholder="Enter address"
            :columns="{ container: 6 }"
            rules="required"
          />
        </GroupElement>

        <!-- Step 2: Season, Package, Dates & Species -->
        <GroupElement name="seasonPackageSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="fa fa-calendar text-primary"></i>
              <h5 class="mb-0">Season & Package</h5>
            </div>
          </template>

          <SelectElement
            name="season"
            label="Season"
            placeholder="Select Season"
            :items="seasonItems"
            :search="true"
            :native="false"
            :columns="{ container: 6 }"
            rules="required"
            @change="onSeasonChange"
          />

          <SelectElement
            name="priceListId"
            label="Hunting Package"
            placeholder="Select a Hunting Package"
            :items="packageItems"
            :search="true"
            :native="false"
            :columns="{ container: 6 }"
            :disabled="!form.season || loadingPackageItems"
            :loading="loadingPackageItems"
            @change="onPackageChange"
          />

          <StaticElement name="packageDetails" :conditions="[['priceListId', '!=', null]]">
            <div v-if="selectedPackageDetail" class="card bg-primary bg-opacity-10 border-primary mt-3">
              <div class="card-body">
                <div class="d-flex align-items-start gap-3">
                  <i class="fa fa-box-open text-primary fs-3"></i>
                  <div class="flex-grow-1">
                    <h6 class="fw-bold text-primary mb-3">Selected Package Details</h6>
                    <div class="row g-3 small">
                      <div class="col-md-6">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Package Name:</span>
                          <span class="fw-bold">{{ selectedPackageDetail.price_structure_detail?.name || 'N/A' }}</span>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Location:</span>
                          <span class="fw-medium">{{ selectedPackageDetail.price_structure?.location_name || 'N/A' }}</span>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Hunting Type:</span>
                          <span class="fw-medium">{{ selectedPackageDetail.price_structure_detail?.hunting_type || 'N/A' }}</span>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Duration:</span>
                          <span class="fw-medium">{{ selectedPackageDetail.price_structure_detail?.hunt_length || 'N/A' }}</span>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Package Cost:</span>
                          <span class="fw-bold text-primary">{{ selectedPackageDetail.price_structure_detail?.currency_code || '$' }} {{ parseFloat(selectedPackageDetail.price_structure_detail?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Species Included:</span>
                          <span class="fw-medium badge bg-info">{{ selectedPackageDetail.summary?.species_count || 0 }} species</span>
                        </div>
                      </div>
                      <div v-if="selectedPackageDetail.summary?.safari_extras_count > 0" class="col-md-4">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Safari Extras:</span>
                          <span class="fw-medium badge bg-secondary">{{ selectedPackageDetail.summary?.safari_extras_count || 0 }}</span>
                        </div>
                      </div>
                      <div v-if="selectedPackageDetail.summary?.companion_costs_count > 0" class="col-md-4">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Companion Costs:</span>
                          <span class="fw-medium badge bg-success">{{ selectedPackageDetail.summary?.companion_costs_count || 0 }}</span>
                        </div>
                      </div>
                      <div v-if="selectedPackageDetail.summary?.trophy_fees_count > 0" class="col-md-4">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Trophy Fees:</span>
                          <span class="fw-medium badge bg-warning">{{ selectedPackageDetail.summary?.trophy_fees_count || 0 }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Species Preview -->
                    <div v-if="selectedPackageDetail.species && selectedPackageDetail.species.length > 0" class="mt-3 pt-3 border-top">
                      <h6 class="text-primary mb-2 small"><i class="fa fa-paw me-1"></i>Included Species</h6>
                      <div class="d-flex flex-wrap gap-1">
                        <span v-for="species in selectedPackageDetail.species.slice(0, 10)" :key="species.id" class="badge bg-secondary">
                          {{ species.item_name }} ({{ species.quantity }})
                        </span>
                        <span v-if="selectedPackageDetail.species.length > 10" class="badge bg-info">
                          +{{ selectedPackageDetail.species.length - 10 }} more
                        </span>
                      </div>
                    </div>

                    <!-- Safari Extras Preview -->
                    <div v-if="selectedPackageDetail.safari_extras && selectedPackageDetail.safari_extras.length > 0" class="mt-2">
                      <h6 class="text-primary mb-2 small"><i class="fa fa-hiking me-1"></i>Safari Extras ({{ selectedPackageDetail.safari_extras.length }})</h6>
                      <div class="d-flex flex-wrap gap-2">
                        <div v-for="extra in selectedPackageDetail.safari_extras" :key="extra.id" class="badge bg-info text-start py-2 px-3">
                          <div class="fw-bold">{{ extra.item_name || extra.description || 'Safari Extra' }}</div>
                          <div class="small">{{ extra.currency_code || '$' }} {{ parseFloat(extra.amount || 0).toFixed(2) }} <span v-if="extra.pricing_unit" class="text-white-50">/ {{ extra.pricing_unit.replace(/_/g, ' ').toLowerCase() }}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="selectedPackageInfo" class="alert alert-info mb-0 mt-2 py-2">
              <div class="row g-2 small">
                <div class="col-6 col-md-3">
                  <strong>Area:</strong> {{ selectedPackageInfo.area || 'N/A' }}
                </div>
                <div class="col-6 col-md-3">
                  <strong>Hunting Type:</strong> {{ selectedPackageInfo.huntingType || 'N/A' }}
                </div>
                <div class="col-6 col-md-3">
                  <strong>Duration:</strong> {{ selectedPackageInfo.duration || 0 }} days
                </div>
                <div class="col-6 col-md-3">
                  <strong>Base Amount:</strong> {{ selectedPackageInfo.amount || 'N/A' }}
                </div>
              </div>
            </div>
          </StaticElement>
        </GroupElement>

        <GroupElement name="huntScheduleSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-calendar-alt text-primary"></i>
              <h5 class="mb-0">Hunt Schedule</h5>
            </div>
          </template>

          <DateElement
            name="start_date"
            label="Start Date"
            :columns="{ container: 6 }"
            rules="required"
            :disabled="!form.season"
            display-format="MMMM D, YYYY"
            @change="onStartDateChange"
          />

          <TextElement
            name="no_of_days"
            label="Number of Days"
            input-type="number"
            placeholder="e.g., 10"
            :columns="{ container: 6 }"
            rules="required|numeric|min:1"
            @change="onDaysChange"
          />

          <StaticElement name="huntPeriodInfo">
            <div v-if="form.start_date && form.no_of_days > 0" class="alert alert-info mt-2 mb-0 py-2">
              <i class="fa fa-info-circle me-2"></i>
              <strong>Hunt Period:</strong> {{ formatDate(form.start_date) }} to {{ formatDate(calculatedEndDate) }}
              <span class="ms-2">({{ form.no_of_days }} days)</span>
            </div>
          </StaticElement>

          <!-- Companion Cost Preview -->
          <StaticElement name="companionCostPreview">
            <div v-if="companionCosts.length > 0 && form.no_of_participants > 0 && form.no_of_days > 0" class="card bg-success bg-opacity-10 border-success mt-3">
              <div class="card-body py-2">
                <div class="row align-items-center">
                  <div class="col-md-8">
                    <small class="text-muted d-block"><i class="fa fa-users me-1"></i>Estimated Companion Costs</small>
                    <div class="d-flex align-items-center gap-2 mt-1">
                      <span class="small">{{ companionCosts[0]?.currency_code || '$' }} {{ parseFloat(companionCosts[0]?.amount || 0).toFixed(2) }}/day</span>
                      <span class="text-muted">×</span>
                      <span class="small">{{ form.no_of_days }} days</span>
                      <span class="text-muted">×</span>
                      <span class="small">{{ form.no_of_participants }} participants</span>
                    </div>
                  </div>
                  <div class="col-md-4 text-end">
                    <div class="fw-bold text-success fs-5">
                      {{ companionCosts[0]?.currency_code || '$' }} {{ totalCompanionCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StaticElement>

          <StaticElement name="dateConflictWarning">
            <div v-if="dateConflictWarning" class="alert alert-warning mt-2 mb-0 py-2">
              <i class="fa fa-exclamation-triangle me-2"></i>
              <strong>Date Conflict Detected:</strong> {{ dateConflictWarning }}
            </div>
          </StaticElement>

          <StaticElement name="bookedDatesDisplay">
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
          </StaticElement>
        </GroupElement>

        <GroupElement name="huntPartySection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-users text-primary"></i>
              <h5 class="mb-0">Hunt Party Details</h5>
            </div>
          </template>

          <SelectElement
            name="area"
            label="Hunting Area"
            placeholder="Select Area"
            :items="areaItems"
            :search="true"
            :native="false"
            :columns="{ container: 6 }"
            rules="required"
          />

          <TextElement
            name="no_of_participants"
            label="Number of Participants"
            input-type="number"
            placeholder="e.g., 2"
            :default="1"
            :columns="{ container: 6 }"
            rules="required|numeric|min:1"
            @change="onParticipantsChange"
          />

          <TextElement
            name="prev_experience"
            label="Previous Experience"
            placeholder="Describe your hunting experience..."
            :columns="{ container: 6 }"
          />

          <TextareaElement
            name="special_requests"
            label="Special Requests"
            placeholder="Any special requests or requirements..."
            :rows="2"
            :columns="{ container: 12 }"
          />
        </GroupElement>

        <GroupElement name="speciesSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-paw text-primary"></i>
              <h5 class="mb-0">Species Selection</h5>
            </div>
          </template>

          <SelectElement
            name="selectedSpecies"
            label="Species"
            placeholder="Select Species"
            :items="speciesItems"
            :search="true"
            :native="false"
            :columns="{ container: 5 }"
          />

          <TextElement
            name="speciesQuantity"
            label="Quantity"
            input-type="number"
            placeholder="Qty"
            :default="1"
            :columns="{ container: 3 }"
          />

          <StaticElement name="addSpeciesBtn" :columns="{ container: 4 }">
            <div style="margin-top: 1.75rem;">
              <button type="button" class="btn btn-primary w-100" @click="addSpeciesToList">
                <i class="fa fa-plus me-1"></i> Add Species
              </button>
            </div>
          </StaticElement>

          <StaticElement name="speciesList">
            <hr class="my-3" />
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
            <div v-else class="alert alert-secondary mb-0">
              No species selected yet. Add species using the form above or select a package.
            </div>
          </StaticElement>

          <!-- Upgrade Fees Display -->
          <StaticElement name="upgradeFees">
            <div v-if="selectedUpgradeFees.length > 0" class="card mt-3 bg-warning bg-opacity-10">
              <div class="card-header bg-light py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-arrow-up text-warning"></i>
                  <h6 class="mb-0">Upgrade Fees</h6>
                </div>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover table-sm mb-0">
                    <thead>
                      <tr>
                        <th class="text-start">Species</th>
                        <th class="text-end">Upgrade Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="fee in selectedUpgradeFees" :key="fee.id">
                        <td class="fw-medium">{{ fee.species_name || fee.species?.name || 'Unknown' }}</td>
                        <td class="text-end fw-semibold text-warning">{{ fee.currency_symbol || '$' }}{{ fee.amount }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </StaticElement>
        </GroupElement>

        <!-- Step 3: Safari Extras & Trophy Fees -->
        <GroupElement name="safariExtrasSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="fa fa-hiking text-primary fs-4"></i>
              <h5 class="mb-0 fw-bold">Safari Extras</h5>
            </div>
          </template>

          <StaticElement name="safariExtrasList">
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
          </StaticElement>

          <StaticElement name="budgetSection">
            <div class="card mt-3">
              <div class="card-header bg-light">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-dollar-sign text-primary"></i>
                  <h6 class="mb-0">Budget Information</h6>
                </div>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="budget-min" class="form-label">Budget Minimum (USD)</label>
                    <input id="budget-min" v-model="form.budget_min" type="number" class="form-control" min="0" placeholder="e.g., 5000" />
                    <small class="text-muted">Enter the minimum budget for this hunt</small>
                  </div>
                  <div class="col-md-6">
                    <label for="budget-max" class="form-label">Budget Maximum (USD)</label>
                    <input id="budget-max" v-model="form.budget_max" type="number" class="form-control" min="0" placeholder="e.g., 15000" />
                    <small class="text-muted">Enter the maximum budget for this hunt</small>
                  </div>
                </div>
                <div v-if="form.budget_min && form.budget_max" class="alert alert-info mt-3 mb-0">
                  <i class="fa fa-info-circle me-2"></i>
                  <strong>Budget Range:</strong> ${{ form.budget_min.toLocaleString() }} - ${{ form.budget_max.toLocaleString() }}
                </div>
              </div>
            </div>
          </StaticElement>
        </GroupElement>

        <GroupElement name="trophyFeesSection">
          <template #label>
            <div v-if="trophyFees.length > 0" class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-trophy text-warning fs-4"></i>
              <h5 class="mb-0 fw-bold">Trophy Fees</h5>
            </div>
          </template>

          <StaticElement name="trophyFeesList">
            <template v-if="trophyFees.length > 0">
              <div class="alert alert-warning border-start border-4" role="alert">
                <h6 class="alert-heading">Trophy Fees ({{ trophyFees.length }} items)</h6>
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
                          <td class="text-end fw-semibold">{{ fee.currency_code || 'USD' }} {{ fee.amount.toLocaleString() }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
          </StaticElement>
        </GroupElement>

        <GroupElement name="companionCostsSection">
          <template #label>
            <div v-if="companionCosts.length > 0" class="d-flex align-items-center gap-2 mb-2 mt-3">
              <i class="fa fa-users text-info fs-4"></i>
              <h5 class="mb-0 fw-bold">Companion Costs</h5>
            </div>
          </template>

          <StaticElement name="companionCostsList">
            <template v-if="companionCosts.length > 0">
              <div class="alert alert-info border-start border-4" role="alert">
                <h6 class="alert-heading">Companion Cost Calculation</h6>
                <p class="mb-0">Cost per participant per day. Total cost = Rate × Days × Number of Participants.</p>
              </div>

              <div class="card mb-3 bg-light">
                <div class="card-body">
                  <div v-for="(cost, index) in companionCosts" :key="`companion-${cost.id}-${index}`"
                    class="mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 border rounded bg-white mb-2">
                      <div>
                        <div class="fw-semibold">{{ cost.description }}</div>
                        <small class="text-muted">Per participant per day</small>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold fs-5">{{ cost.currency_code || 'USD' }} {{ parseFloat(cost.amount).toFixed(2) }}</div>
                        <small class="text-muted">per day</small>
                      </div>
                    </div>

                    <!-- Calculation Breakdown -->
                    <div v-if="form.no_of_participants > 0 && huntDuration > 0" class="card bg-success bg-opacity-10 border-success">
                      <div class="card-body">
                        <div class="row g-3 align-items-center">
                          <div class="col-md-8">
                            <div class="d-flex align-items-center gap-3">
                              <div class="text-center">
                                <div class="text-muted small">Rate/Day</div>
                                <div class="fw-bold">{{ cost.currency_code }} {{ parseFloat(cost.amount).toFixed(2) }}</div>
                              </div>
                              <span class="text-muted">×</span>
                              <div class="text-center">
                                <div class="text-muted small">Days</div>
                                <div class="fw-bold">{{ huntDuration }}</div>
                              </div>
                              <span class="text-muted">×</span>
                              <div class="text-center">
                                <div class="text-muted small">Participants</div>
                                <div class="fw-bold">{{ form.no_of_participants }}</div>
                              </div>
                              <span class="text-muted">=</span>
                            </div>
                          </div>
                          <div class="col-md-4">
                            <div class="text-end">
                              <div class="text-muted small">Total Companion Cost</div>
                              <div class="fw-bold fs-4 text-success">{{ cost.currency_code }} {{ (parseFloat(cost.amount) * form.no_of_participants * huntDuration).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Info message when no participants -->
                    <div v-else class="alert alert-warning mb-0">
                      <i class="fa fa-info-circle me-2"></i>
                      <small>Enter number of participants and hunt duration to see total cost calculation</small>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </StaticElement>
        </GroupElement>

        <!-- Step 4: Review & Submit -->
        <GroupElement name="reviewSection">
          <template #label>
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="fa fa-clipboard-check text-primary fs-4"></i>
              <h5 class="mb-0 fw-bold">Review Your Enquiry</h5>
            </div>
          </template>

          <StaticElement name="reviewContent">
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
                  <div class="col-md-4"><span class="text-muted">Country:</span><span class="ms-2 fw-medium">{{ getItemLabel(countryItems, form.country) }}</span></div>
                  <div class="col-md-4"><span class="text-muted">Nationality:</span><span class="ms-2 fw-medium">{{ getItemLabel(nationalityItems, form.nationality) }}</span></div>
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
                  <div class="col-md-6"><span class="text-muted">Season:</span><span class="ms-2 fw-medium">{{ getItemLabel(seasonItems, form.season) }}</span></div>
                  <div class="col-md-6"><span class="text-muted">Package:</span><span class="ms-2 fw-medium">{{ getItemLabel(packageItems, form.priceListId) || 'No package selected' }}</span></div>
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
                  <div class="col-md-4"><span class="text-muted">Start Date:</span><span class="ms-2 fw-medium">{{ formatReviewDate(form.start_date) }}</span></div>
                  <div class="col-md-4"><span class="text-muted">Days:</span><span class="ms-2 fw-medium">{{ form.no_of_days || 'N/A' }}</span></div>
                  <div class="col-md-4"><span class="text-muted">End Date:</span><span class="ms-2 fw-medium text-info">{{ formatReviewDate(calculatedEndDate) }}</span></div>
                </div>
                <hr class="my-2" />
                <div class="row g-3 small">
                  <div class="col-md-4"><span class="text-muted">Hunting Area:</span><span class="ms-2 fw-medium">{{ getItemLabel(areaItems, form.area) }}</span></div>
                  <div class="col-md-4"><span class="text-muted">Days:</span><span class="ms-2 fw-medium">{{ huntDuration || 'N/A' }}</span></div>
                  <div class="col-md-4"><span class="text-muted">Participants:</span><span class="ms-2 fw-medium">{{ form.no_of_participants || 1 }}</span></div>
                </div>
                <hr class="my-2" />
                <div class="row g-3 small">
                  <div class="col-md-3"><span class="text-muted">Experience:</span><span class="ms-2 fw-medium">{{ form.prev_experience || 'N/A' }}</span></div>
                </div>
                <div v-if="form.special_requests" class="row g-3 small mt-1">
                  <div class="col-12"><span class="text-muted">Special Requests:</span><span class="ms-2 fw-medium">{{ form.special_requests }}</span></div>
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
                  <div v-for="extra in selectedSafariExtras" :key="extra.id" class="badge bg-success text-start py-2 px-3">
                    <div class="fw-bold">{{ extra.name || 'Safari Extra' }}</div>
                    <div class="small">{{ extra.currency_code || 'USD' }} {{ parseFloat(extra.amount || 0).toFixed(2) }}</div>
                  </div>
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
          </StaticElement>
        </GroupElement>

        <!-- Wizard Navigation Controls -->
        <FormStepsControls>
          <template #previous="{ previous, isDisabled }">
            <button 
              type="button" 
              class="btn btn-outline-secondary me-2"
              :disabled="isDisabled"
              @click="previous"
            >
              <i class="fa fa-arrow-left me-1"></i> Back
            </button>
          </template>
          <template #next="{ next, isDisabled }">
            <button 
              type="button" 
              class="btn btn-primary"
              :disabled="isDisabled"
              @click="next"
            >
              Next Step <i class="fa fa-arrow-right ms-1"></i>
            </button>
          </template>
          <template #finish="{ finish, isDisabled }">
            <button 
              type="button" 
              class="btn btn-success"
              :disabled="isDisabled || saving"
              @click="finish"
            >
              <i class="fa fa-check me-1"></i> {{ saving ? 'Saving...' : 'Submit Enquiry' }}
            </button>
          </template>
        </FormStepsControls>
      </template>
    </Vueform>

    <!-- Cancel Button -->
    <div class="mt-3 text-end">
      <button type="button" class="btn btn-outline-secondary" @click="cancelWizard">
        <i class="fa fa-times me-1"></i> Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ editRow?: any | null }>()
const emit = defineEmits<{ (e: 'cancel'): void; (e: 'saved'): void }>()

const vueformRef = ref<any>(null)
const { init } = useToast()

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
  no_of_days: 0,
  no_of_companions: 0,
  species: null as any,
  quantity: 0,
  area: null as any,
  season: null as any,
  start_date: null as any,
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
const speciesObjects = ref<any[]>([])
const areasOptions = ref<any[]>([])
const seasonsOptions = ref<any[]>([])
const packagesOptions = ref<any[]>([])
const existingCustomersOptions = ref<any[]>([])

const saving = ref(false)
const loadingPackageItems = ref(false)
const loadingCustomers = ref(false)

const seasonMinDate = ref<Date | null>(null)
const seasonMaxDate = ref<Date | null>(null)
const bookedDates = ref<Array<{ start_date: string; end_date: string; client_name: string; area_id: number }>>([])
const loadingBookedDates = ref(false)
const dateConflictWarning = ref('')

const isEditMode = ref(false)
const editingInquiryId = ref<number | null>(null)

const customerType = ref<'new' | 'existing'>('new')
const selectedExistingCustomer = ref<any>(null)

const selectedSafariExtras = ref<any[]>([])
const trophyFees = ref<any[]>([])
const companionCosts = ref<any[]>([])
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

const packageItems = computed(() => 
  packagesOptions.value.map((pkg: any) => ({
    value: pkg.value,
    label: pkg.selfItem 
      ? `${pkg.text} - ${pkg.selfItem?.price_structure?.location_name || 'N/A'} • ${pkg.selfItem?.hunting_type_name || 'N/A'} • ${pkg.selfItem?.hunt_length_days || 0} days • ${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || '0'}`
      : pkg.text,
    selfItem: pkg.selfItem
  }))
)

const areaItems = computed(() => 
  areasOptions.value.map((a: any) => ({ value: a.value, label: a.text }))
)

const speciesItems = computed(() => 
  speciesOptions.value.map((s: any) => ({ value: s.value, label: s.text }))
)

const existingCustomerItems = computed(() => 
  existingCustomersOptions.value.map((c: any) => ({ 
    value: c.value, 
    label: `${c.text} - ${c.selfItem?.email || 'N/A'} • ${c.selfItem?.country || 'N/A'}`,
    selfItem: c.selfItem
  }))
)

const selectedPackageInfo = computed(() => {
  if (!form.priceListId) return null
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  if (!pkg?.selfItem) return null
  return {
    area: pkg.selfItem?.price_structure?.location_name || 'N/A',
    huntingType: pkg.selfItem?.hunting_type_name || 'N/A',
    duration: pkg.selfItem?.hunt_length_days || 0,
    amount: `${pkg.selfItem?.currency_symbol || '$'}${pkg.selfItem?.amount || 'N/A'}`
  }
})

const selectedUpgradeFees = computed(() => {
  if (!form.priceListId) return []
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  return pkg?.selfItem?.upgrade_fees || []
})

const bookedDatesForSelectedSeason = computed(() => bookedDates.value)

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

const quotationTotalAmount = computed(() =>
  quotationForm.installments.reduce((sum, inst) => sum + (Number(inst.amount_due) || 0), 0),
)

const totalCompanionCost = computed(() => {
  if (companionCosts.value.length === 0) return 0
  const rate = parseFloat(companionCosts.value[0]?.amount || 0)
  const days = Number(form.no_of_days) || 0
  const participants = Number(form.no_of_participants) || 0
  return rate * days * participants
})

// Helper function to get label from items array
const getItemLabel = (items: any[], value: any) => {
  if (!value) return 'N/A'
  const item = items.find((i: any) => i.value === value)
  return item?.label || 'N/A'
}

// Event handlers for Vueform
const onCustomerTypeChange = (newValue: string) => {
  customerType.value = newValue as 'new' | 'existing'
  selectedExistingCustomer.value = null
  clearCustomerInformation()
}

const onExistingCustomerSelect = (option: any) => {
  if (!option) {
    clearCustomerInformation()
    return
  }
  // With object=true and @select, we get the full option object
  // Find the original customer data using the value
  const customer = existingCustomersOptions.value.find((c: any) => c.value === option.value)
  if (customer) {
    selectedExistingCustomer.value = customer.value
    populateFormFromCustomer(customer)
  }
}

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
  await populateFormFromPackage()
}

const onStartDateChange = (newValue: any) => {
  form.start_date = newValue || ''
  checkBookedDateConflict()
}

const onDaysChange = (newValue: any) => {
  form.no_of_days = Number(newValue) || 0
  checkBookedDateConflict()
}

const onParticipantsChange = (newValue: any) => {
  form.no_of_participants = Number(newValue) || 1
}

// Sync Vueform data with local form state
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
  form.start_date = data.start_date || null
  form.no_of_days = Number(data.no_of_days) || 0
  form.area = data.area || null
  form.no_of_participants = Number(data.no_of_participants) || 1
  form.prev_experience = data.prev_experience || ''
  form.special_requests = data.special_requests || ''
  createQuotation.value = data.createQuotation || false
}

// Handle form submission from Vueform
const handleSubmit = async (formData: any, form$: any) => {
  syncFormData()
  await submit()
}

// Add species to list
const addSpeciesToList = () => {
  if (!vueformRef.value) return
  const data = vueformRef.value.data
  const selectedSpecies = data.selectedSpecies
  const quantity = Number(data.speciesQuantity) || 1

  if (!selectedSpecies) {
    init({ message: 'Please select a species.', color: 'warning' })
    return
  }

  if (quantity <= 0) {
    init({ message: 'Quantity must be greater than zero.', color: 'warning' })
    return
  }

  const exists = speciesObjects.value.some((species: { species_id: any }) => species.species_id === selectedSpecies)
  if (!exists) {
    const speciesOption = speciesOptions.value.find((s: any) => s.value === selectedSpecies)
    speciesObjects.value.push({
      species_id: selectedSpecies,
      name: speciesOption?.text || 'Unknown',
      quantity: quantity,
      priority: 'NICE_TO_HAVE',
      notes: '',
      fromPackage: false,
    })
    // Reset selection
    vueformRef.value.update({ selectedSpecies: null, speciesQuantity: 1 })
  } else {
    init({ message: 'This species is already added. Update the quantity instead.', color: 'warning' })
  }
}

const contactForm = reactive({
  id: null as any,
  client_id: null as any,
  contact: '',
  contact_type: null as any,
  contactable: false,
})

const contactsTypes = ref<any[]>([])

const currentStep = ref(0)
const wizardSteps = [
  { label: 'Personal Info' },
  { label: 'Season, Package, Dates & Species' },
  { label: 'Safari Extras & Trophy Fees' },
  { label: 'Review' },
]

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
  if (!form.season) return []
  return packagesOptions.value
})

const speciesList = computed(() => salesPackagesSpecies.value)

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
  // Also update Vueform if available
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: '',
      email: '',
      phone: '',
      phone_additional: '',
      address: '',
      country: null,
      nationality: null
    })
  }
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
  form.remarks = ''
  form.prev_experience = ''
  form.budget_min = null
  form.budget_max = null
  form.payment_method_id = null
  form.special_requests = ''
  // Reset Vueform
  if (vueformRef.value) {
    vueformRef.value.reset()
  }
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

  let countryValue = null
  const countryId = entity.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) {
      form.country = countryOption.value
      countryValue = countryOption.value
    }
  } else if (entity.country) {
    const countryOption = countries.value.find((c: any) => c.text === entity.country)
    if (countryOption) {
      form.country = countryOption.value
      countryValue = countryOption.value
    }
  }

  let nationalityValue = null
  const nationalityId = entity.nationality_id
  if (nationalityId) {
    const nationalityOption = nationality.value.find((n: any) => n.value === nationalityId)
    if (nationalityOption) {
      form.nationality = nationalityOption.value
      nationalityValue = nationalityOption.value
    }
  } else if (entity.nationality) {
    const nationalityOption = nationality.value.find((n: any) => n.text === entity.nationality)
    if (nationalityOption) {
      form.nationality = nationalityOption.value
      nationalityValue = nationalityOption.value
    }
  }

  // Update Vueform with new values
  if (vueformRef.value) {
    vueformRef.value.update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      country: countryValue,
      nationality: nationalityValue
    })
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

const populateFormFromPackage = async () => {
  if (!form.priceListId) return
  
  const pkg = packagesOptions.value.find((p: any) => p.value === form.priceListId)
  if (!pkg?.selfItem) return
  
  const pkgData = pkg.selfItem
  const priceStructureDetailId = form.priceListId

  // Reset all package-related data
  speciesObjects.value = []
  selectedSafariExtras.value = []
  trophyFees.value = []
  companionCosts.value = []
  selectedPackageDetail.value = null

  // Get area from price_structure.location_name
  const areaName = pkgData?.price_structure?.location_name
  if (areaName) {
    const areaOption = areasOptions.value.find((a: any) => a.text === areaName)
    if (areaOption) {
      form.area = areaOption.value
      // Also update Vueform
      if (vueformRef.value) {
        vueformRef.value.update({ area: areaOption.value })
      }
    }
  }

  // Get duration from hunt_length_days (optional, doesn't force it)
  const duration = pkgData?.hunt_length_days || pkgData?.regulatory_package?.duration
  if (duration && !form.no_of_days) {
    form.no_of_days = Number(duration)
    // Also update Vueform
    if (vueformRef.value) {
      vueformRef.value.update({ no_of_days: duration })
    }
  }

  // Fetch items from preview endpoint
  if (priceStructureDetailId) {
    loadingPackageItems.value = true
    try {
      const response = await salesEnquiryService.previewPriceItems(priceStructureDetailId)
      if (response.success && response.data) {
        const data = response.data

        // Store full package detail info for preview
        selectedPackageDetail.value = data

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
              name: extra.item_name || extra.name || extra.description || 'Safari Extra',
              description: extra.description || '',
              amount: parseFloat(extra.amount) || 0,
              charges_per: extra.pricing_unit || extra.charges_per,
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
  
  // Sync form data from Vueform
  syncFormData()

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
    season_id: form.season || null,
    status: isEditMode.value ? undefined : 'NEW', // Only set status on create
    remarks: form.remarks || null,
    
    // Areas - backend expects array of { location_id }
    areas: form.area ? [{ location_id: form.area }] : [],
    
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
  if (customerType.value === 'existing' && selectedExistingCustomer.value) {
    requestdata.entity_id = selectedExistingCustomer.value
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
      country_id: form.country || null,
      nationality_id: form.nationality || null,
      contacts,
    }
  }

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
    if (areaOption) form.area = areaOption.value
  } else if (locationName) {
    const areaOption = areasOptions.value.find((a: any) => a.text === locationName)
    if (areaOption) form.area = areaOption.value
  }

  // Load season
  if (item.season) {
    const seasonOption = seasonsOptions.value.find((s: any) => s.value === item.season.id || s.text === item.season.name)
    if (seasonOption) form.season = seasonOption.value
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
    selectedExistingCustomer.value = item.entity_id
  }

  // Update Vueform with loaded values
  if (vueformRef.value) {
    vueformRef.value.update({
      customerType: 'existing',
      existingCustomer: item.entity_id,
      full_name: form.full_name,
      country: form.country,
      nationality: form.nationality,
      email: form.email,
      phone: form.phone,
      phone_additional: form.phone_additional,
      address: form.address,
      season: form.season,
      priceListId: form.priceListId,
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