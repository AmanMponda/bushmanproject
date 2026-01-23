<template>
  <div class="">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Charter Prices</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="!showForm">
      <!-- Tab Navigation -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'prices' }" href="#" @click.prevent="activeTab = 'prices'">
            <i class="fa fa-money-bill me-1"></i> Route Prices
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'companies' }" href="#" @click.prevent="activeTab = 'companies'">
            <i class="fa fa-building me-1"></i> Charter Companies
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'aircraft' }" href="#" @click.prevent="activeTab = 'aircraft'">
            <i class="fa fa-plane me-1"></i> Aircraft Fleet
          </a>
        </li>
      </ul>

      <!-- Route Prices Tab -->
      <div v-if="activeTab === 'prices'" class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="priceColumns"
                :data="routePrices"
                :loading="loadingPrices"
                :filters="priceTableFilters"
                :default-page-size="priceTableFilters.pageSize"
                :disable-pagination="false"
                :show-date-filters="false"
                :action-buttons="pricePageActions"
                :custom-filters="priceCustomFilters"
                @update:filters="handlePriceFiltersUpdate"
              >
                <template #route="{ row }">
                  <div class="d-flex align-items-center">
                    <i class="fa fa-route me-2 text-primary"></i>
                    <div>
                      <div class="fw-bold">{{ getRouteDisplay(row) }}</div>
                      <small class="text-muted">{{ row.route?.route_code || 'N/A' }}</small>
                    </div>
                  </div>
                </template>
                <template #charter_company="{ row }">
                  <span class="badge bg-info">{{ row.charter_company?.name || 'N/A' }}</span>
                </template>
                <template #trip_type="{ row }">
                  <span :class="row.trip_type === 'ROUND_TRIP' ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ row.trip_type === 'ROUND_TRIP' ? 'Round Trip' : 'One Way' }}
                  </span>
                </template>
                <template #net_price="{ row }">
                  <span class="fw-bold">${{ formatAmount(row.net_price) }}</span>
                </template>
                <template #gross_price="{ row }">
                  <span class="text-success fw-bold">${{ formatAmount(row.gross_price || (parseFloat(row.net_price) + parseFloat(row.landing_tax_per_flight || 0))) }}</span>
                </template>
                <template #passengers="{ row }">
                  <span class="badge bg-warning text-dark">{{ row.min_passengers || 1 }} - {{ row.max_passengers || '∞' }} pax</span>
                </template>
                <template #flight_duration="{ row }">
                  <span v-if="row.flight_duration_minutes" class="badge bg-light text-dark">
                    <i class="fa fa-clock me-1"></i>{{ row.flight_duration_minutes }} min
                  </span>
                  <span v-else class="text-muted">-</span>
                </template>
                <template #is_active="{ row }">
                  <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                    {{ row.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View Details" @click="viewPrice(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" title="Edit" @click="editPrice(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeletePrice(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>

      <!-- Charter Companies Tab -->
      <div v-if="activeTab === 'companies'" class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="companyColumns"
                :data="companies"
                :loading="loadingCompanies"
                :filters="companyTableFilters"
                :default-page-size="companyTableFilters.pageSize"
                :disable-pagination="false"
                :show-date-filters="false"
                :action-buttons="companyPageActions"
                @update:filters="handleCompanyFiltersUpdate"
              >
                <template #code="{ row }">
                  <span class="badge bg-primary">{{ row.code }}</span>
                </template>
                <template #name="{ row }">
                  <div class="fw-bold">{{ row.name }}</div>
                </template>
                <template #contact="{ row }">
                  <div v-if="row.contact_person">
                    <div><i class="fa fa-user me-1"></i>{{ row.contact_person }}</div>
                    <small v-if="row.phone" class="text-muted"><i class="fa fa-phone me-1"></i>{{ row.phone }}</small>
                  </div>
                  <span v-else class="text-muted">-</span>
                </template>
                <template #email="{ row }">
                  <a v-if="row.email" :href="'mailto:' + row.email" class="text-info">{{ row.email }}</a>
                  <span v-else class="text-muted">-</span>
                </template>
                <template #commission="{ row }">
                  <span class="badge bg-warning text-dark">{{ row.default_commission_percentage || 0 }}%</span>
                </template>
                <template #aircraft_count="{ row }">
                  <span class="badge bg-info">{{ row.aircraft?.length || 0 }} aircraft</span>
                </template>
                <template #is_active="{ row }">
                  <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                    {{ row.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View Details" @click="viewCompany(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" title="Edit" @click="editCompany(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeleteCompany(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>

      <!-- Aircraft Tab -->
      <div v-if="activeTab === 'aircraft'" class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="aircraftColumns"
                :data="aircraft"
                :loading="loadingAircraft"
                :filters="aircraftTableFilters"
                :default-page-size="aircraftTableFilters.pageSize"
                :disable-pagination="false"
                :show-date-filters="false"
                :action-buttons="aircraftPageActions"
                :custom-filters="aircraftCustomFilters"
                @update:filters="handleAircraftFiltersUpdate"
              >
                <template #registration_number="{ row }">
                  <span class="badge bg-dark">{{ row.registration_number }}</span>
                </template>
                <template #aircraft="{ row }">
                  <div>
                    <div class="fw-bold">{{ row.make }} {{ row.model }}</div>
                    <small v-if="row.year_manufactured" class="text-muted">Year: {{ row.year_manufactured }}</small>
                  </div>
                </template>
                <template #charter_company="{ row }">
                  <span class="badge bg-info">{{ row.charter_company?.name || 'N/A' }}</span>
                </template>
                <template #aircraft_type="{ row }">
                  <span class="badge" :class="getAircraftTypeBadgeClass(row.aircraft_type)">
                    {{ formatAircraftType(row.aircraft_type) }}
                  </span>
                </template>
                <template #seating_capacity="{ row }">
                  <span class="badge bg-warning text-dark"><i class="fa fa-users me-1"></i>{{ row.seating_capacity }} seats</span>
                </template>
                <template #range="{ row }">
                  <span v-if="row.max_range_km" class="text-muted">{{ formatAmount(row.max_range_km) }} km</span>
                  <span v-else class="text-muted">-</span>
                </template>
                <template #is_active="{ row }">
                  <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                    {{ row.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View Details" @click="viewAircraft(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" title="Edit" @click="editAircraft(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeleteAircraft(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Forms -->
    <div v-else>
      <!-- Price Form -->
      <div v-if="formType === 'price'" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ editItem ? 'Edit Route Price' : 'Add Route Price' }}</h5>
          <button class="btn btn-secondary btn-sm" @click="goBack">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
        </div>
        <div class="card-body">
          <form @submit.prevent="savePrice">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Route <span class="text-danger">*</span></label>
                <select v-model="priceForm.route_id" class="form-select" required>
                  <option value="">Select Route</option>
                  <option v-for="route in routes" :key="route.id" :value="route.id">
                    {{ route.city_link || route.route_code || 'N/A' }}
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Charter Company <span class="text-danger">*</span></label>
                <select v-model="priceForm.charter_company_id" class="form-select" required @change="onCompanyChange">
                  <option value="">Select Company</option>
                  <option v-for="company in companies" :key="company.id" :value="company.id">
                    {{ company.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Currency <span class="text-danger">*</span></label>
                <select v-model="priceForm.currency_id" class="form-select" required :disabled="loadingCurrencies">
                  <option value="">Select Currency</option>
                  <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                    {{ currency.code || currency.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Default Aircraft</label>
                <select v-model="priceForm.default_aircraft_id" class="form-select">
                  <option value="">Select Aircraft (Optional)</option>
                  <option v-for="ac in companyAircraft" :key="ac.id" :value="ac.id">
                    {{ ac.make }} {{ ac.model }} ({{ ac.registration_number }})
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Trip Type <span class="text-danger">*</span></label>
                <select v-model="priceForm.trip_type" class="form-select" required>
                  <option value="ONE_WAY">One Way</option>
                  <option value="ROUND_TRIP">Round Trip</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Net Price ($) <span class="text-danger">*</span></label>
                <CurrencyInput v-model="priceForm.net_price" :currency="getCurrencyCode()" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Landing Tax ($/flight)</label>
                <CurrencyInput v-model="priceForm.landing_tax_per_flight" :currency="getCurrencyCode()" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Departure Tax ($/person)</label>
                <CurrencyInput v-model="priceForm.departure_tax_per_person" :currency="getCurrencyCode()" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Commission (%)</label>
                <input v-model.number="priceForm.commission_on_top_percentage" type="number" step="0.01" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Min Passengers</label>
                <input v-model.number="priceForm.min_passengers" type="number" min="1" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Max Passengers</label>
                <input v-model.number="priceForm.max_passengers" type="number" min="1" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Flight Duration (minutes)</label>
                <input v-model.number="priceForm.flight_duration_minutes" type="number" min="1" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <div class="form-check mt-4">
                  <input v-model="priceForm.is_active" type="checkbox" class="form-check-input" id="priceActive">
                  <label class="form-check-label" for="priceActive">Active</label>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <label class="form-label">Notes</label>
                <textarea v-model="priceForm.notes" class="form-control" rows="2"></textarea>
              </div>

              <!-- Price Preview -->
              <div v-if="priceForm.net_price" class="col-12">
                <div class="alert alert-info">
                  <strong>Price Preview:</strong>
                  <div class="row mt-2">
                    <div class="col-md-3">
                      <small>Net Price:</small>
                      <div class="fw-bold">${{ formatAmount(priceForm.net_price || 0) }}</div>
                    </div>
                    <div class="col-md-3">
                      <small>+ Landing Tax:</small>
                      <div class="fw-bold">${{ formatAmount(priceForm.landing_tax_per_flight || 0) }}</div>
                    </div>
                    <div class="col-md-3">
                      <small>= Gross Price:</small>
                      <div class="fw-bold text-success">${{ formatAmount((priceForm.net_price || 0) + (priceForm.landing_tax_per_flight || 0)) }}</div>
                    </div>
                    <div class="col-md-3">
                      <small>Commission ({{ priceForm.commission_on_top_percentage || 0 }}%):</small>
                      <div class="fw-bold">${{ formatAmount(((priceForm.net_price || 0) + (priceForm.landing_tax_per_flight || 0)) * ((priceForm.commission_on_top_percentage || 0) / 100)) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary ms-auto" :disabled="savingPrice" >
                <span v-if="savingPrice" class="spinner-border spinner-border-sm me-1"></span>
                {{ editItem ? 'Update' : 'Create' }} Price
              </button>
              <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Company Form -->
      <div v-if="formType === 'company'" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ editItem ? 'Edit Charter Company' : 'Add Charter Company' }}</h5>
          <button class="btn btn-secondary btn-sm" @click="goBack">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
        </div>
        <div class="card-body">
          <form @submit.prevent="saveCompany">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Company Code <span class="text-danger">*</span></label>
                <input v-model="companyForm.code" type="text" class="form-control" required placeholder="e.g., AURIC">
              </div>
              <div class="col-md-8 mb-3">
                <label class="form-label">Company Name <span class="text-danger">*</span></label>
                <input v-model="companyForm.name" type="text" class="form-control" required placeholder="e.g., Auric Air">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Registration Number</label>
                <input v-model="companyForm.registration_number" type="text" class="form-control">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Default Commission (%)</label>
                <input v-model.number="companyForm.default_commission_percentage" type="number" step="0.01" class="form-control">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Contact Person</label>
                <input v-model="companyForm.contact_person" type="text" class="form-control">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Phone</label>
                <input v-model="companyForm.phone" type="text" class="form-control">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Email</label>
                <input v-model="companyForm.email" type="email" class="form-control">
              </div>
              <div class="col-md-6 mb-3">
                <div class="form-check mt-4">
                  <input v-model="companyForm.is_active" type="checkbox" class="form-check-input" id="companyActive">
                  <label class="form-check-label" for="companyActive">Active</label>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <label class="form-label">Address</label>
                <textarea v-model="companyForm.address" class="form-control" rows="2"></textarea>
              </div>
              <div class="col-md-12 mb-3">
                <label class="form-label">Notes</label>
                <textarea v-model="companyForm.notes" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary ms-auto" :disabled="savingCompany">
                <span v-if="savingCompany" class="spinner-border spinner-border-sm me-1"></span>
                {{ editItem ? 'Update' : 'Create' }} Company
              </button>
              <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Aircraft Form -->
      <div v-if="formType === 'aircraft'" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ editItem ? 'Edit Aircraft' : 'Add Aircraft' }}</h5>
          <button class="btn btn-secondary btn-sm" @click="goBack">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
        </div>
        <div class="card-body">
          <form @submit.prevent="saveAircraft">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Charter Company <span class="text-danger">*</span></label>
                <select v-model="aircraftForm.charter_company_id" class="form-select" required>
                  <option value="">Select Company</option>
                  <option v-for="company in companies" :key="company.id" :value="company.id">
                    {{ company.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Registration Number <span class="text-danger">*</span></label>
                <input v-model="aircraftForm.registration_number" type="text" class="form-control" required placeholder="e.g., 5H-MWE">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Make <span class="text-danger">*</span></label>
                <input v-model="aircraftForm.make" type="text" class="form-control" required placeholder="e.g., Cessna">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Model <span class="text-danger">*</span></label>
                <input v-model="aircraftForm.model" type="text" class="form-control" required placeholder="e.g., Caravan 208B">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Year Manufactured</label>
                <input v-model.number="aircraftForm.year_manufactured" type="number" class="form-control" min="1900" max="2100">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Aircraft Type</label>
                <select v-model="aircraftForm.aircraft_type" class="form-select">
                  <option value="">Select Type</option>
                  <option value="SINGLE_ENGINE">Single Engine</option>
                  <option value="TWIN_ENGINE">Twin Engine</option>
                  <option value="TURBOPROP">Turboprop</option>
                  <option value="JET">Jet</option>
                  <option value="HELICOPTER">Helicopter</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Seating Capacity <span class="text-danger">*</span></label>
                <input v-model.number="aircraftForm.seating_capacity" type="number" min="1" class="form-control" required>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Cargo Capacity (kg)</label>
                <input v-model.number="aircraftForm.cargo_capacity_kg" type="number" step="0.01" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Max Range (km)</label>
                <input v-model.number="aircraftForm.max_range_km" type="number" step="0.01" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Cruise Speed (km/h)</label>
                <input v-model.number="aircraftForm.cruise_speed_kmh" type="number" step="0.01" class="form-control">
              </div>
              <div class="col-md-4 mb-3">
                <div class="form-check mt-4">
                  <input v-model="aircraftForm.is_active" type="checkbox" class="form-check-input" id="aircraftActive">
                  <label class="form-check-label" for="aircraftActive">Active</label>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <label class="form-label">Notes</label>
                <textarea v-model="aircraftForm.notes" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary ms-auto" :disabled="savingAircraft">
                <span v-if="savingAircraft" class="spinner-border spinner-border-sm me-1"></span>
                {{ editItem ? 'Update' : 'Create' }} Aircraft
              </button>
              <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Price Details Modal -->
    <div class="modal fade" id="priceDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="selectedPrice">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-plane me-2"></i>Charter Price Details
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6 class="text-muted">Route</h6>
                <p class="fw-bold">{{ getRouteDisplay(selectedPrice) }}</p>
              </div>
              <div class="col-md-6">
                <h6 class="text-muted">Charter Company</h6>
                <p class="fw-bold">{{ selectedPrice.charter_company?.name }}</p>
              </div>
              <div class="col-md-6">
                <h6 class="text-muted">Trip Type</h6>
                <p><span :class="selectedPrice.trip_type === 'ROUND_TRIP' ? 'badge bg-success' : 'badge bg-secondary'">{{ selectedPrice.trip_type }}</span></p>
              </div>
              <div class="col-md-6">
                <h6 class="text-muted">Flight Duration</h6>
                <p>{{ selectedPrice.flight_duration_minutes ? selectedPrice.flight_duration_minutes + ' minutes' : 'N/A' }}</p>
              </div>
            </div>
            <hr>
            <h6><i class="fa fa-dollar-sign me-1"></i>Pricing Breakdown</h6>
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <td>Net Price</td>
                  <td class="text-end">${{ formatAmount(selectedPrice.net_price) }}</td>
                </tr>
                <tr>
                  <td>Landing Tax (per flight)</td>
                  <td class="text-end">${{ formatAmount(selectedPrice.landing_tax_per_flight) }}</td>
                </tr>
                <tr class="table-success">
                  <td><strong>Gross Price</strong></td>
                  <td class="text-end"><strong>${{ formatAmount(parseFloat(selectedPrice.net_price) + parseFloat(selectedPrice.landing_tax_per_flight || 0)) }}</strong></td>
                </tr>
                <tr>
                  <td>Departure Tax (per person)</td>
                  <td class="text-end">${{ formatAmount(selectedPrice.departure_tax_per_person) }}</td>
                </tr>
                <tr>
                  <td>Commission</td>
                  <td class="text-end">{{ selectedPrice.commission_on_top_percentage || 0 }}%</td>
                </tr>
              </tbody>
            </table>
            <div class="row">
              <div class="col-md-6">
                <h6 class="text-muted">Passengers</h6>
                <p>{{ selectedPrice.min_passengers || 1 }} - {{ selectedPrice.max_passengers || '∞' }} passengers</p>
              </div>
              <div class="col-md-6">
                <h6 class="text-muted">Default Aircraft</h6>
                <p>{{ selectedPrice.default_aircraft ? `${selectedPrice.default_aircraft.make} ${selectedPrice.default_aircraft.model}` : 'Not specified' }}</p>
              </div>
            </div>
            <div v-if="selectedPrice.notes">
              <h6 class="text-muted">Notes</h6>
              <p>{{ selectedPrice.notes }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" @click="editPrice(selectedPrice); closePriceModal()">
              <i class="fa fa-edit me-1"></i>Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Modal } from 'bootstrap'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useCharterStore, type CharterCompany, type Aircraft, type CharterRoutePrice } from '@/stores/bushman/charter-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import axios from 'axios'
import Swal from 'sweetalert2'
import CurrencyInput from '@/components/CurrencyInput.vue'

// Store
const charterStore = useCharterStore()
const settingsStore = useSettingsStore()

// State
const activeTab = ref<'prices' | 'companies' | 'aircraft'>('prices')
const showForm = ref(false)
const formType = ref<'price' | 'company' | 'aircraft'>('price')
const editItem = ref<any>(null)
const selectedPrice = ref<CharterRoutePrice | null>(null)
const priceDetailsModal = ref<Modal | null>(null)

// Loading states
const loadingPrices = computed(() => charterStore.loadingPrices)
const loadingCompanies = computed(() => charterStore.loadingCompanies)
const loadingAircraft = computed(() => charterStore.loadingAircraft)
const savingPrice = computed(() => charterStore.savingPrice)
const savingCompany = computed(() => charterStore.savingCompany)
const savingAircraft = computed(() => charterStore.savingAircraft)

// Data
const routePrices = computed(() => charterStore.routePrices)
const companies = computed(() => charterStore.companies)
const aircraft = computed(() => charterStore.aircraft)
const routes = ref<any[]>([])
const companyAircraft = ref<Aircraft[]>([])
const currencies = ref<any[]>([])
const loadingCurrencies = ref(false)

// Table filters
const priceTableFilters = ref({
  search: '',
  pageSize: 15,
  currentPage: 1,
})

const companyTableFilters = ref({
  search: '',
  pageSize: 15,
  currentPage: 1,
})

const aircraftTableFilters = ref({
  search: '',
  pageSize: 15,
  currentPage: 1,
})

// Columns
const priceColumns = ref([
  { key: 'sno', label: '#', visible: true, sortable: false },
  { key: 'route', label: 'Route', visible: true, sortable: true },
  { key: 'charter_company', label: 'Company', visible: true, sortable: true },
  { key: 'trip_type', label: 'Trip Type', visible: true, sortable: true },
  { key: 'net_price', label: 'Net Price', visible: true, sortable: true },
  { key: 'gross_price', label: 'Gross Price', visible: true, sortable: true },
  { key: 'passengers', label: 'Passengers', visible: true, sortable: false },
  { key: 'flight_duration', label: 'Duration', visible: true, sortable: true },
  { key: 'is_active', label: 'Status', visible: true, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
])

const companyColumns = ref([
  { key: 'sno', label: '#', visible: true, sortable: false },
  { key: 'code', label: 'Code', visible: true, sortable: true },
  { key: 'name', label: 'Name', visible: true, sortable: true },
  { key: 'contact', label: 'Contact', visible: true, sortable: false },
  { key: 'email', label: 'Email', visible: true, sortable: true },
  { key: 'commission', label: 'Commission', visible: true, sortable: true },
  { key: 'aircraft_count', label: 'Fleet', visible: true, sortable: false },
  { key: 'is_active', label: 'Status', visible: true, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
])

const aircraftColumns = ref([
  { key: 'sno', label: '#', visible: true, sortable: false },
  { key: 'registration_number', label: 'Registration', visible: true, sortable: true },
  { key: 'aircraft', label: 'Aircraft', visible: true, sortable: true },
  { key: 'charter_company', label: 'Company', visible: true, sortable: true },
  { key: 'aircraft_type', label: 'Type', visible: true, sortable: true },
  { key: 'seating_capacity', label: 'Seats', visible: true, sortable: true },
  { key: 'range', label: 'Range', visible: true, sortable: true },
  { key: 'is_active', label: 'Status', visible: true, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, sortable: false },
])

// Custom filters
const priceCustomFilters = computed(() => [
  {
    key: 'charter_company_id',
    label: 'Company',
    type: 'select',
    placeholder: 'All Companies',
    options: (Array.isArray(companies.value) ? companies.value : []).map((c) => ({ value: c.id, label: c.name })),
    defaultValue: '',
  },
  {
    key: 'trip_type',
    label: 'Trip Type',
    type: 'select',
    placeholder: 'All Types',
    options: [
      { value: 'ONE_WAY', label: 'One Way' },
      { value: 'ROUND_TRIP', label: 'Round Trip' },
    ],
    defaultValue: '',
  },
])

const aircraftCustomFilters = computed(() => [
  {
    key: 'charter_company_id',
    label: 'Company',
    type: 'select',
    placeholder: 'All Companies',
    options: (Array.isArray(companies.value) ? companies.value : []).map((c) => ({ value: c.id, label: c.name })),
    defaultValue: '',
  },
  {
    key: 'aircraft_type',
    label: 'Aircraft Type',
    type: 'select',
    placeholder: 'All Types',
    options: [
      { value: 'SINGLE_ENGINE', label: 'Single Engine' },
      { value: 'TWIN_ENGINE', label: 'Twin Engine' },
      { value: 'TURBOPROP', label: 'Turboprop' },
      { value: 'JET', label: 'Jet' },
      { value: 'HELICOPTER', label: 'Helicopter' },
    ],
    defaultValue: '',
  },
])

// Page actions
const pricePageActions = computed(() => [
  {
    label: 'Add Price',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showPriceForm(),
  },
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn btn-secondary',
    method: () => loadPrices(),
  },
])

const companyPageActions = computed(() => [
  {
    label: 'Add Company',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showCompanyForm(),
  },
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn btn-secondary',
    method: () => loadCompanies(),
  },
])

const aircraftPageActions = computed(() => [
  {
    label: 'Add Aircraft',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showAircraftForm(),
  },
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn btn-secondary',
    method: () => loadAircraft(),
  },
])

// Forms
const priceForm = ref({
  route_id: '',
  charter_company_id: '',
  currency_id: '',
  default_aircraft_id: '',
  net_price: 0,
  landing_tax_per_flight: 0,
  departure_tax_per_person: 0,
  commission_on_top_percentage: 0,
  min_passengers: 1,
  max_passengers: null as number | null,
  flight_duration_minutes: null as number | null,
  trip_type: 'ONE_WAY',
  is_active: true,
  notes: '',
})

const companyForm = ref({
  code: '',
  name: '',
  registration_number: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  default_commission_percentage: 0,
  is_active: true,
  notes: '',
})

const aircraftForm = ref({
  charter_company_id: '',
  registration_number: '',
  make: '',
  model: '',
  year_manufactured: null as number | null,
  seating_capacity: 1,
  cargo_capacity_kg: null as number | null,
  max_range_km: null as number | null,
  cruise_speed_kmh: null as number | null,
  aircraft_type: '',
  is_active: true,
  notes: '',
})

// Helpers
const formatAmount = (amount: string | number | null | undefined) => {
  if (amount === null || amount === undefined) return '0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getRouteDisplay = (row: any) => {
  if (row.route?.city_link) {
    const cityLink = row.route.city_link
    if (typeof cityLink === 'object') {
      return `${cityLink.original_city?.name || ''} → ${cityLink.destination_city?.name || ''}`
    }
    return cityLink
  }
  return row.route?.route_code || 'N/A'
}

const formatAircraftType = (type: string) => {
  if (!type) return 'N/A'
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
}

const getAircraftTypeBadgeClass = (type: string) => {
  const classes: Record<string, string> = {
    SINGLE_ENGINE: 'bg-secondary',
    TWIN_ENGINE: 'bg-info',
    TURBOPROP: 'bg-primary',
    JET: 'bg-success',
    HELICOPTER: 'bg-warning text-dark',
  }
  return classes[type] || 'bg-secondary'
}

const getCurrencyCode = () => {
  const currency = currencies.value.find((c) => String(c.id) === String(priceForm.value.currency_id))
  return currency?.code || 'USD'
}

// Data loaders
const loadPrices = async () => {
  try {
    await charterStore.getPrices()
  } catch (error) {
    Swal.fire('Error', 'Failed to load charter prices', 'error')
  }
}

const loadCompanies = async () => {
  try {
    await charterStore.getCompanies()
  } catch (error) {
    Swal.fire('Error', 'Failed to load charter companies', 'error')
  }
}

const loadAircraft = async () => {
  try {
    await charterStore.getAircraft()
  } catch (error) {
    Swal.fire('Error', 'Failed to load aircraft', 'error')
  }
}

const loadRoutes = async () => {
  try {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
    const response = await axios.get(`${baseUrl}routes`)
    const payload = response.data?.data
    const rows = Array.isArray(payload?.data)
      ? payload.data
      : (Array.isArray(payload) ? payload : [])
    routes.value = rows
      .filter(Boolean)
      .map((route: any) => ({
        id: route.id,
        route_code: route.route_code,
        city_link: route.city_link
          ? `${route.city_link.original_city?.name || 'N/A'} - ${route.city_link.destination_city?.name || 'N/A'}`
          : null
      }))
  } catch (error) {
    console.error('Failed to load routes:', error)
  }
}

const loadCurrencies = async () => {
  loadingCurrencies.value = true
  try {
    const response = await settingsStore.getCurrencies()
    const data = response.data || []
    currencies.value = data.map((item: any) => ({
      id: item.id,
      code: item.code || item.name,
      name: item.name,
    }))
  } catch (error) {
    console.error('Failed to load currencies:', error)
  } finally {
    loadingCurrencies.value = false
  }
}

// Filter handlers
const handlePriceFiltersUpdate = async (filters: any) => {
  priceTableFilters.value = { ...priceTableFilters.value, ...filters }
  await charterStore.getPrices({
    charter_company_id: filters.charter_company_id,
    trip_type: filters.trip_type,
  })
}

const handleCompanyFiltersUpdate = (filters: any) => {
  companyTableFilters.value = { ...companyTableFilters.value, ...filters }
}

const handleAircraftFiltersUpdate = async (filters: any) => {
  aircraftTableFilters.value = { ...aircraftTableFilters.value, ...filters }
  await charterStore.getAircraft({
    charter_company_id: filters.charter_company_id,
    aircraft_type: filters.aircraft_type,
  })
}

// Form display methods
const showPriceForm = () => {
  resetPriceForm()
  editItem.value = null
  formType.value = 'price'
  showForm.value = true
}

const showCompanyForm = () => {
  resetCompanyForm()
  editItem.value = null
  formType.value = 'company'
  showForm.value = true
}

const showAircraftForm = () => {
  resetAircraftForm()
  editItem.value = null
  formType.value = 'aircraft'
  showForm.value = true
}

const goBack = () => {
  showForm.value = false
  editItem.value = null
  loadData()
}

// Reset forms
const resetPriceForm = () => {
  priceForm.value = {
    route_id: '',
    charter_company_id: '',
    currency_id: '',
    default_aircraft_id: '',
    net_price: 0,
    landing_tax_per_flight: 0,
    departure_tax_per_person: 0,
    commission_on_top_percentage: 0,
    min_passengers: 1,
    max_passengers: null,
    flight_duration_minutes: null,
    trip_type: 'ONE_WAY',
    is_active: true,
    notes: '',
  }
  companyAircraft.value = []
}

const resetCompanyForm = () => {
  companyForm.value = {
    code: '',
    name: '',
    registration_number: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    default_commission_percentage: 0,
    is_active: true,
    notes: '',
  }
}

const resetAircraftForm = () => {
  aircraftForm.value = {
    charter_company_id: '',
    registration_number: '',
    make: '',
    model: '',
    year_manufactured: null,
    seating_capacity: 1,
    cargo_capacity_kg: null,
    max_range_km: null,
    cruise_speed_kmh: null,
    aircraft_type: '',
    is_active: true,
    notes: '',
  }
}

// Edit methods
const editPrice = (row: CharterRoutePrice) => {
  editItem.value = row
  priceForm.value = {
    route_id: row.route_id.toString(),
    charter_company_id: row.charter_company_id.toString(),
    currency_id: (row as any).currency_id?.toString() || '',
    default_aircraft_id: row.default_aircraft_id?.toString() || '',
    net_price: row.net_price,
    landing_tax_per_flight: row.landing_tax_per_flight,
    departure_tax_per_person: row.departure_tax_per_person,
    commission_on_top_percentage: row.commission_on_top_percentage || 0,
    min_passengers: row.min_passengers || 1,
    max_passengers: row.max_passengers || null,
    flight_duration_minutes: row.flight_duration_minutes || null,
    trip_type: row.trip_type,
    is_active: row.is_active,
    notes: row.notes || '',
  }
  onCompanyChange()
  formType.value = 'price'
  showForm.value = true
}

const editCompany = (row: CharterCompany) => {
  editItem.value = row
  companyForm.value = {
    code: row.code,
    name: row.name,
    registration_number: row.registration_number || '',
    contact_person: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    default_commission_percentage: row.default_commission_percentage || 0,
    is_active: row.is_active,
    notes: row.notes || '',
  }
  formType.value = 'company'
  showForm.value = true
}

const editAircraft = (row: Aircraft) => {
  editItem.value = row
  aircraftForm.value = {
    charter_company_id: row.charter_company_id.toString(),
    registration_number: row.registration_number,
    make: row.make,
    model: row.model,
    year_manufactured: row.year_manufactured || null,
    seating_capacity: row.seating_capacity,
    cargo_capacity_kg: row.cargo_capacity_kg || null,
    max_range_km: row.max_range_km || null,
    cruise_speed_kmh: row.cruise_speed_kmh || null,
    aircraft_type: row.aircraft_type || '',
    is_active: row.is_active,
    notes: row.notes || '',
  }
  formType.value = 'aircraft'
  showForm.value = true
}

// View methods
const viewPrice = (row: CharterRoutePrice) => {
  selectedPrice.value = row
  const modalEl = document.getElementById('priceDetailsModal')
  if (modalEl) {
    priceDetailsModal.value = new Modal(modalEl)
    priceDetailsModal.value.show()
  }
}

const closePriceModal = () => {
  if (priceDetailsModal.value) {
    priceDetailsModal.value.hide()
  }
}

const viewCompany = async (row: CharterCompany) => {
  try {
    const response = await charterStore.getCompany(row.id)
    const company = response.data.data || response.data
    Swal.fire({
      title: company.name,
      html: `
        <div class="text-start">
          <p><strong>Code:</strong> ${company.code}</p>
          <p><strong>Contact:</strong> ${company.contact_person || 'N/A'}</p>
          <p><strong>Phone:</strong> ${company.phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${company.email || 'N/A'}</p>
          <p><strong>Commission:</strong> ${company.default_commission_percentage || 0}%</p>
          <p><strong>Aircraft:</strong> ${company.aircraft?.length || 0} in fleet</p>
          ${company.notes ? `<p><strong>Notes:</strong> ${company.notes}</p>` : ''}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
    })
  } catch (error) {
    Swal.fire('Error', 'Failed to load company details', 'error')
  }
}

const viewAircraft = async (row: Aircraft) => {
  try {
    const response = await charterStore.getAircraftById(row.id)
    const ac = response.data.data || response.data
    Swal.fire({
      title: `${ac.make} ${ac.model}`,
      html: `
        <div class="text-start">
          <p><strong>Registration:</strong> ${ac.registration_number}</p>
          <p><strong>Company:</strong> ${ac.charter_company?.name || 'N/A'}</p>
          <p><strong>Type:</strong> ${formatAircraftType(ac.aircraft_type)}</p>
          <p><strong>Seats:</strong> ${ac.seating_capacity}</p>
          <p><strong>Year:</strong> ${ac.year_manufactured || 'N/A'}</p>
          <p><strong>Range:</strong> ${ac.max_range_km ? formatAmount(ac.max_range_km) + ' km' : 'N/A'}</p>
          <p><strong>Speed:</strong> ${ac.cruise_speed_kmh ? formatAmount(ac.cruise_speed_kmh) + ' km/h' : 'N/A'}</p>
          ${ac.notes ? `<p><strong>Notes:</strong> ${ac.notes}</p>` : ''}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
    })
  } catch (error) {
    Swal.fire('Error', 'Failed to load aircraft details', 'error')
  }
}

// Save methods
const savePrice = async () => {
  try {
    const payload = {
      ...priceForm.value,
      route_id: parseInt(priceForm.value.route_id),
      charter_company_id: parseInt(priceForm.value.charter_company_id),
      default_aircraft_id: priceForm.value.default_aircraft_id ? parseInt(priceForm.value.default_aircraft_id) : null,
      currency_id: priceForm.value.currency_id ? parseInt(priceForm.value.currency_id) : null,
    }

    if (editItem.value) {
      await charterStore.updatePrice(editItem.value.id, payload)
      Swal.fire({
        title: 'Updated!',
        text: 'Charter price has been updated.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      })
    } else {
      await charterStore.createPrice(payload)
      Swal.fire({
        title: 'Created!',
        text: 'Charter price has been created.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      })
    }
    goBack()
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.errors || 'Failed to save price'
    Swal.fire('Error', typeof message === 'object' ? JSON.stringify(message) : message, 'error')
  }
}

const saveCompany = async () => {
  try {
    if (editItem.value) {
      await charterStore.updateCompany(editItem.value.id, companyForm.value)
      Swal.fire({
        title: 'Updated!',
        text: 'Charter company has been updated.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      })
    } else {
      await charterStore.createCompany(companyForm.value)
      Swal.fire({
        title: 'Created!',
        text: 'Charter company has been created.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      })
    }
    goBack()
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.errors || 'Failed to save company'
    Swal.fire('Error', typeof message === 'object' ? JSON.stringify(message) : message, 'error')
  }
}

const saveAircraft = async () => {
  try {
    const payload = {
      ...aircraftForm.value,
      charter_company_id: parseInt(aircraftForm.value.charter_company_id),
    }

    if (editItem.value) {
      await charterStore.updateAircraft(editItem.value.id, payload)
      Swal.fire({
        title: 'Updated!',
        text: 'Aircraft has been updated.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      })
    } else {
      await charterStore.createAircraft(payload)
      Swal.fire({
        title: 'Created!',
        text: 'Aircraft has been created.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      })
    }
    goBack()
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.errors || 'Failed to save aircraft'
    Swal.fire('Error', typeof message === 'object' ? JSON.stringify(message) : message, 'error')
  }
}

// Delete methods
const confirmDeletePrice = (row: CharterRoutePrice) => {
  Swal.fire({
    title: 'Delete Price?',
    text: `Are you sure you want to delete this charter price?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await charterStore.deletePrice(row.id)
        Swal.fire({
          title: 'Deleted!',
          text: 'Charter price has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        })
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete price', 'error')
      }
    }
  })
}

const confirmDeleteCompany = (row: CharterCompany) => {
  Swal.fire({
    title: 'Delete Company?',
    text: `Are you sure you want to delete "${row.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await charterStore.deleteCompany(row.id)
        Swal.fire({
          title: 'Deleted!',
          text: 'Charter company has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        })
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete company', 'error')
      }
    }
  })
}

const confirmDeleteAircraft = (row: Aircraft) => {
  Swal.fire({
    title: 'Delete Aircraft?',
    text: `Are you sure you want to delete "${row.make} ${row.model}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await charterStore.deleteAircraft(row.id)
        Swal.fire({
          title: 'Deleted!',
          text: 'Aircraft has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        })
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete aircraft', 'error')
      }
    }
  })
}

// Company aircraft loader
const onCompanyChange = () => {
  const companyId = parseInt(priceForm.value.charter_company_id)
  if (companyId) {
    companyAircraft.value = aircraft.value.filter((a) => a.charter_company_id === companyId && a.is_active)
  } else {
    companyAircraft.value = []
  }
  priceForm.value.default_aircraft_id = ''
}

// Initial data load
const loadData = async () => {
  await Promise.all([loadPrices(), loadCompanies(), loadAircraft(), loadRoutes(), loadCurrencies()])
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  font-weight: 600;
}

.badge {
  font-size: 0.85em;
}
</style>
