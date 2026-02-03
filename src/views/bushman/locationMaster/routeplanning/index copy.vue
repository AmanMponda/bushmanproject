<template>
  <div>
    <!-- Breadcrumb -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><router-link to="#">ROUTE PLANNING</router-link></li>
        <li class="breadcrumb-item active">HOME</li>
      </ol>

      <button @click="$router.back()" class="btn btn-secondary text-nowrap btn-sm px-3 rounded-pill back-btn">
        <i class="fa fa-arrow-left me-1"></i> Back
      </button>
    </div>

    <!-- Header Card -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header d-flex align-items-center bg-white fw-400">
            <div class="d-flex align-items-center">
              <div class="vehicle-icon me-2">
                <i class="fa fa-calendar-alt fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">ROUTE PLANNING </h4>
                <small class="text-muted">Manage timetables, city links, routes, subroutes and stops</small>
              </div>
            </div>

            <div class="ms-auto d-flex align-items-center gap-2">
              <button @click="scheduleTimetableAction" class="text-decoration-none text-body text-opacity-50">
                <i class="fa fa-sync-alt me-1"></i> Refresh
              </button>
              <template v-if="activeTab === 'citylink'">
                <button class="btn btn-primary btn-sm" @click="openCityLinkModal()">
                  <i class="fa fa-plus me-1"></i> Add City Link
                </button>
                <!-- <button class="btn btn-outline-success btn-sm" @click="openCityQuickModal()">
                  <i class="fa fa-plus me-1"></i> Add City
                </button> -->
              </template>
              <template v-else>
                <button class="btn btn-primary btn" @click="onAddClick">
                  <i class="fa fa-plus me-1"></i> {{ addLabel }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="row mt-0 my-tabs">
      <div class="col-lg-12">
        <div class="card tabs-card">
          <div class="card-body p-0">

            <ul class="nav nav-tabs nav-fill">
              <li class="nav-item">
                <a @click="activeTab = 'routes'; routeAction()" class="nav-link"
                  :class="{ active: activeTab === 'routes' }" href="#" @click.prevent>
                  <i class="fa fa-route me-2"></i>Route
                </a>
              </li>

              <li class="nav-item">
                <a @click="activeTab = 'citylink'; cityLinkAction()" class="nav-link"
                  :class="{ active: activeTab === 'citylink' }" href="#" @click.prevent>
                  <i class="fa fa-link me-2"></i>City Link
                </a>
              </li>

              <li class="nav-item">
                <a @click="activeTab = 'stops'; stopsActions()" class="nav-link"
                  :class="{ active: activeTab === 'stops' }" href="#" @click.prevent>
                  <i class="fa fa-flag me-2"></i>Stops
                </a>
              </li>

            </ul>
          </div>
        </div>
      </div>
    </div>
    <!-- Tab Content -->
    <div class="row gx-4 mt-3">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <div class="tab-content" id="iconTabContent-1">
              <div class="tab-pane fade" :class="{ 'show active': activeTab === 'citylink' }" id="icon-profile"
                role="tabpanel">
                <div v-if="isLoadingCityLink" class="d-flex justify-content-center mx-5 mt-3 mb-5">
                  <div class="spinner-border text-info"></div>
                </div>
                <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                  <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                    <div class="panel br-6 p-0">
                      <div class="custom-table p-3">
                        <v-client-table :data="cityLinks" :columns="cityLinkColumns" :options="cityLinkTableOption">
                          <template #code="props">
                            <span>{{ props.row.code || 'N/A' }}</span>
                          </template>
                          <template #original_city_id="props">
                            <span>{{ props.row.original_city_id || 'N/A' }}</span>
                          </template>
                          <template #destination_city_id="props">
                            <span>{{ props.row.destination_city_id || 'N/A' }}</span>
                          </template>
                          <template #distance_km="props">
                            <span>{{ props.row.distance_km || 'N/A' }}</span>
                          </template>
                          <template #approx_hours="props">
                            <span>{{ props.row.approx_hours || 'N/A' }}</span>
                          </template>
                          <template #actions="props">
                            <button class="btn btn-sm me-1" @click="openCityLinkModal(props.row)"
                              title="Edit City Link">
                              <i class="fa fa-edit text-primary"></i>
                            </button>
                       
                        <!-- <button class="btn btn-sm" @click="deleteCityLink(props.row.id)">asdfsdfa</button>
                           -->
                            <button class="btn btn-sm" title="Details" @click="showDetails(props.row, 'citylink')">
                              <i class="fa fa-eye text-info"></i>
                            </button>
                          </template>
                        </v-client-table>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- City Link Modal -->
                <div class="modal modal-xl fade" id="cityLinkModal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">
                          {{ currentCityLink.id ? 'Edit City Link' : 'Form To Register Two Cities' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        
                        <!-- Single City Link Form (for editing) -->
                        <div v-if="!isMultipleMode">
                          <div class="row">
                            <div class="col-md-4 mb-3">
                              <label>Code</label>
                              <input v-model="currentCityLink.code" type="text" class="form-control"
                                @input="formatCodeToUppercase" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Original City</label>
                              <Multiselect v-model="currentCityLink.original_city_id" :options="filteredOriginalCities"
                                label="name" track-by="id" placeholder="Select Original City"
                                @select="onOriginalCityChange" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Destination City</label>
                              <Multiselect v-model="currentCityLink.destination_city_id"
                                :options="filteredDestinationCities" label="name" track-by="id"
                                placeholder="Select Destination City" @select="onDestinationCityChange" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Distance (km)</label>
                              <input v-model="currentCityLink.distance_km" type="number" class="form-control" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Approx Hours</label>
                              <input v-model="currentCityLink.approx_hours" type="number" class="form-control" />
                            </div>
                          </div>
                        </div>

                        <!-- Multiple City Links Form (for adding new) -->
                        <div v-else>


                          <div class="city-links-container"
                            style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                            <div v-for="(link, index) in multipleCityLinks" :key="index"
                              class="border rounded p-3 mb-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">Entry {{ multipleCityLinks.length - index }}</h6>
                                <button v-if="multipleCityLinks.length > 1" type="button" class="btn btn-sm btn-danger"
                                  @click="removeCityLinkRow(index)">
                                  <i class="fa fa-trash"></i>
                                </button>
                              </div>

                              <div class="row">
                                <div class="col-md-4 mb-3">
                                  <label>Code</label>
                                  <input v-model="link.code" type="text" class="form-control"
                                    @input="formatMultipleCodeToUppercase(index)" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Original City</label>
                                  <Multiselect v-model="link.original_city_id"
                                    :options="getFilteredOriginalCities(index)" label="name" track-by="id"
                                    placeholder="Select Original City" @select="onMultipleOriginalCityChange(index)" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Destination City</label>
                                  <Multiselect v-model="link.destination_city_id"
                                    :options="getFilteredDestinationCities(index)" label="name" track-by="id"
                                    placeholder="Select Destination City"
                                    @select="onMultipleDestinationCityChange(index)" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Distance (km)</label>
                                  <input v-model="link.distance_km" type="number" class="form-control" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Approx Hours</label>
                                  <input v-model="link.approx_hours" type="number" class="form-control" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn btn-outline-success" @click="addCityLinkRow">
                          <i class="fa fa-plus me-1"></i> Add Row
                        </button>
                        <button class="btn btn-outline-primary" @click="saveCityLink">
                          <span v-if="isLoading">
                            <div class="spinner-border spinner-border-sm"></div>
                          </span>
                          <span v-else>
                            {{ currentCityLink.id ? 'Update' : 'Save' }}
                          </span>

                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick Add City Modal -->
                <div class="modal fade" id="quickCityModal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Add City</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        <div class="row">
                          <div class="col-md-8 mb-3">
                            <label>City Name</label>
                            <input v-model="quickCity.name" type="text" class="form-control"
                              @input="formatQuickCityNameToUppercase" />
                          </div>
                          <div class="col-md-4 mb-3">
                            <label>Status</label>
                            <select v-model="quickCity.status" class="form-control">
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-primary" @click="saveQuickCity">Save City</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tab-pane fade" :class="{ 'show active': activeTab === 'routes' }" id="icon-routes"
                role="tabpanel" aria-labelledby="icon-routes-tab">
                <!-- Route sub-tabs -->
                <div v-if="routeSubTab === 'routes'">
                  <div v-if="isLoadingRoutes" class="d-flex justify-content-center mx-5 mt-3 mb-5">
                    <div class="spinner-border text-info"></div>
                  </div>
                  <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                    <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                      <div class="panel br-6 p-0">
                        <div class="custom-table p-3">
                          <v-client-table :data="routesList" :columns="routeColumns" :options="routeTableOption">
                            <template #city_link_id="props">
                              <span>{{ props.row.city_link_id || 'N/A' }}</span>
                            </template>
                            <template #route_code="props">
                              <span>{{ props.row.route_code || 'N/A' }}</span>
                            </template>
                            <template #route_distance="props">
                              <span class="badge bg-info text-dark">{{ props.row.route_distance || 'N/A' }} km</span>
                            </template>
                            <template #approximate_hrs="props">
                              <span class="badge bg-warning text-dark">{{ props.row.approximate_hrs || 'N/A' }}
                                hrs</span>
                            </template>
                            <template #is_active="props">
                              <span :class="props.row.is_active ? 'text-success' : 'text-danger'">
                                {{ props.row.is_active ? 'Active' : 'Inactive' }}
                              </span>
                            </template>
                            <template #actions="props">
                              <button class="btn btn-sm me-1" @click="openRouteModal(props.row)" title="Edit Route">
                                <i class="fa fa-edit text-primary"></i>
                              </button>
                          
                            <!-- <button class="btn btn-sm" @click="deleteRoute(props.row.id)">...</button>  -->

                              <router-link :to="`/schedule/route/${props.row.id}`" class="btn btn-sm"
                                title="View Details">
                                <i class="fa fa-eye text-info"></i>
                              </router-link>
                            </template>
                          </v-client-table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Route Modal -->
                <div class="modal modal-xl fade" id="routeModal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">{{ currentRoute.id ? 'Edit Route' : 'Add Route' }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        <!-- Single Route Form (for editing) -->
                        <div v-if="!isMultipleRouteMode">
                          <div class="row">
                            <div class="col-md-4 mb-3">
                              <label>City Link</label>
                              <multiselect v-model="currentRoute.city_link_id" :options="cityLinks" label="name"
                                track-by="id">
                                <template #option="{ option }">
                                  <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                                </template>
                              </multiselect>
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Route Code</label>
                              <input v-model="currentRoute.route_code" type="text" class="form-control" />
                            </div>

                            <div class="col-md-4 mb-3">
                              <label>Status</label>
                              <select v-model="currentRoute.is_active" class="form-control">
                                <option value="1">Active</option>
                                <option value="0">InActive</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <!-- Multiple Routes Form (for adding new) -->
                        <div v-else>
                          <div class="routes-container"
                            style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                            <div v-for="(route, index) in multipleRoutes" :key="index" class="border rounded p-3 mb-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">Entry {{ multipleRoutes.length - index }}</h6>
                                <button v-if="multipleRoutes.length > 1" type="button" class="btn btn-sm btn-danger"
                                  @click="removeRouteRow(index)">
                                  <i class="fa fa-trash"></i>
                                </button>
                              </div>

                              <div class="row">
                                <div class="col-md-6 mb-3">
                                  <label>City Link</label>
                                  <!-- <multiselect v-model="route.city_link_id" :options="cityLinks" label="name"
                                    track-by="id">
                                    <template #option="{ option }">
                                      <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                                    </template>
                                  </multiselect> -->
                                  <multiselect v-model="route.city_link_id" :options="filteredLinks" label="name"
                                    track-by="id"> <template #option="{ option }">
                                      <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                                    </template>
                                  </multiselect>
                                </div>
                                <div class="col-md-6 mb-3">
                                  <label>Route Code</label>
                                  <input v-model="route.route_code" type="text" class="form-control" />
                                </div>
                                <!-- <div class="col-md-4 mb-3">
                                  <label>Status</label>
                                  <select v-model="route.is_active" class="form-control">
                                    <option :value="1">Active</option>
                                     <option :value="0">Inactive</option> 
                                  </select>
                                </div> -->
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer sticky-bottom bg-white">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button v-if="isMultipleRouteMode" type="button" class="btn btn btn-outline-success"
                          @click="addRouteRow">
                          <i class="fa fa-plus me-1"></i> Add Row
                        </button>
                        <button class="btn btn-outline-primary" @click="saveRoute">
                          <span v-if="isLoading">
                            <div class="spinner-border spinner-border-sm"></div>
                          </span>
                          <span v-else>
                            {{ currentRoute.id ? 'Update' :
                              'Save'
                            }}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- SubRoutes list -->
                <div v-if="routeSubTab === 'subroutes'">
                  <div v-if="isLoadingSubRoutes" class="d-flex justify-content-center mx-5 mt-3 mb-5">
                    <div class="spinner-border text-info"></div>
                  </div>
                  <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                    <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                      <div class="panel br-6 p-0">
                        <div class="custom-table p-3">
                          <v-client-table :data="subRoutesList" :columns="subRouteColumns"
                            :options="subRouteTableOption">
                            <template #city_link_id="props">
                              <span>{{ props.row.city_link_id }}</span>
                            </template>
                            <template #route_id="props">
                              <span>{{ props.row.route_id }}</span>
                            </template>
                            <template #sequency="props">
                              <span>{{ props.row.sequency }}</span>
                            </template>
                            <template #is_active="props">
                              <span :class="props.row.is_active ? 'text-success' : 'text-danger'">
                                {{ props.row.is_active ? 'Active' : 'Inactive' }}
                              </span>
                            </template>
                            <template #actions="props">
                              <button class="btn btn-sm me-1" @click="openSubRouteModal(props.row)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                  stroke-linejoin="round" class="feather feather-edit-2">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                              </button>
                              <button class="btn btn-sm" title="Details" @click="showDetails(props.row, 'subroute')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                  stroke-linejoin="round" class="feather feather-eye">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </button>
                            </template>
                          </v-client-table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- routes end-->

              <!-- sub-routes- start -->
              <div class="tab-pane fade" :class="{ 'show active': activeTab === 'subroutes' }" id="icon-subroutes"
                role="tabpanel" aria-labelledby="icon-subroutes-tab">

                <div v-if="isLoadingSubRoutes" class="d-flex justify-content-center mx-5 mt-3 mb-5">
                  <div class="spinner-border text-info"></div>
                </div>
                <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                  <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                    <div class="panel br-6 p-0">
                      <div class="custom-table p-3">
                        <v-client-table :data="subRoutesList" :columns="subRouteColumns" :options="subRouteTableOption">
                          <template #city_link_id="props">
                            <span>{{ props.row.city_link_id }}</span>
                          </template>
                          <template #route_id="props">
                            <span>{{ props.row.route_id }}</span>
                          </template>

                          <template #is_active="props">
                            <span :class="props.row.is_active ? 'text-success' : 'text-danger'">
                              {{ props.row.is_active ? 'Active' : 'Inactive' }}
                            </span>
                          </template>
                          <template #actions="props">
                            <button class="btn btn-sm me-1" @click="openSubRouteModal(props.row)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="feather feather-edit-2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <!-- Delete disabled
              <button class="btn btn-sm" @click="deleteSubRoute(props.row.id)">...</button>
              -->
                            <button class="btn btn-sm" title="Details" @click="showDetails(props.row, 'subroute')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="feather feather-eye">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                          </template>
                        </v-client-table>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- SubRoute Modal -->
                <div class="modal modal-xl fade" id="subRouteModal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">{{ currentSubRoute.id ? 'Edit SubRoute' : 'Add SubRoute' }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        <!-- Single SubRoute Form (for editing) -->
                        <div v-if="!isMultipleSubRouteMode">
                          <div class="row">
                            <div class="col-md-4 mb-3">
                              <label>City Link</label>
                              <Multiselect v-model="currentSubRoute.city_link_id" :options="cityLinks" label="name"
                                track-by="id" placeholder="Select City Link" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Route</label>
                              <Multiselect v-model="currentSubRoute.route_id" :options="routesList" label="city_link"
                                track-by="id" placeholder="Select Route" />
                            </div>

                            <div class="col-md-4 mb-3">
                              <label>Status</label>
                              <select v-model="currentSubRoute.is_active" class="form-control">
                                <option :value="1">Active</option>
                                <!-- <option :value="0">Inactive</option> -->
                              </select>
                            </div>
                          </div>
                        </div>

                        <!-- Multiple SubRoutes Form (for adding new) -->
                        <div v-else>
                          <div class="subroutes-container"
                            style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                            <div v-for="(subroute, index) in multipleSubRoutes" :key="index"
                              class="border rounded p-3 mb-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">Entry {{ multipleSubRoutes.length - index }}</h6>
                                <button v-if="multipleSubRoutes.length > 1" type="button" class="btn btn-sm btn-danger"
                                  @click="removeSubRouteRow(index)">
                                  <i class="fa fa-trash"></i>
                                </button>
                              </div>

                              <div class="row">
                                <div class="col-md-4 mb-3">
                                  <label>City Link</label>
                                  <Multiselect v-model="subroute.city_link_id" :options="cityLinks" label="name"
                                    track-by="id" placeholder="Select City Link" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Route</label>
                                  <Multiselect v-model="subroute.route_id" :options="routesList" label="city_link"
                                    track-by="id" placeholder="Select Route" />
                                </div>

                                <div class="col-md-4 mb-3">
                                  <label>Status</label>
                                  <select v-model="subroute.is_active" class="form-control">
                                    <option :value="1">Active</option>
                                    <!-- <option :value="0">Inactive</option> -->
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button v-if="isMultipleSubRouteMode" type="button" class="btn btn-sm btn-success"
                          @click="addSubRouteRow">
                          <i class="fa fa-plus me-1"></i> Add Row
                        </button>
                        <button class="btn btn-primary" @click="saveSubRoute">{{ currentSubRoute.id ? 'Update' : 'Save'
                        }}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- sub-route end -->
              <!-- time table point start -->
              <div class="tab-pane fade" :class="{ 'show active': activeTab === 'stp' }" id="icon-stp" role="tabpanel"
                aria-labelledby="icon-stp-tab">

                <div v-if="isLoadingSTP" class="d-flex justify-content-center mx-5 mt-3 mb-5">
                  <div class="spinner-border text-info"></div>
                </div>
                <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                  <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                    <div class="panel br-6 p-0">
                      <div class="custom-table p-3">
                        <v-client-table :data="stpList" :columns="stpColumns" :options="stpTableOption">
                          <template #name="props">
                            <span>{{ props.row.name }}</span>
                          </template>
                          <template #stop_id="props">
                            <span>{{ props.row.stop_id }}</span>
                          </template>
                          <template #schedule_timetable_id="props">
                            <span>{{ props.row.schedule_timetable_id }}</span>
                          </template>

                          <template #type="props">
                            <span>{{ props.row.type }}</span>
                          </template>
                          <template #actions="props">
                            <button class="btn btn-sm me-1" @click="openSTPModal(props.row)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="feather feather-edit-2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <!-- Delete disabled
              <button class="btn btn-sm" @click="deleteSTP(props.row.id)">...</button>
              -->
                            <button class="btn btn-sm" title="Details" @click="showDetails(props.row, 'stp')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="feather feather-eye">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                          </template>
                        </v-client-table>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Modal -->
                <div class="modal modal-xl fade" id="stpModal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">{{ currentSTP.id ? 'Edit Point' : 'Add Point' }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        <!-- Single STP Form (for editing) -->
                        <div v-if="!isMultipleSTPMode">
                          <div class="row">
                            <!--
            <div class="col-md-4 mb-3">
              <label>Name</label>
              <input v-model="currentSTP.name" type="text" class="form-control" />
            </div>
              -->
                            <div class="col-md-4 mb-3">
                              <label>Stop</label>
                              <Multiselect v-model="currentSTP.stop_id" :options="stops" label="name" track-by="id"
                                placeholder="Select Stop" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Timetable</label>
                              <Multiselect v-model="currentSTP.schedule_timetable_id" :options="offices" label="route"
                                track-by="id" placeholder="Select Timetable" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Sequency</label>
                              <input v-model="currentSTP.sequency" type="number" class="form-control" />
                            </div>
                            <div class="col-md-4 mb-3">
                              <label>Type</label>
                              <select v-model="currentSTP.type" class="form-control">
                                <option value="BOARDING">BOARDING</option>
                                <option value="DROPPING">DROPPING</option>
                                <option value="VIA">VIA</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <!-- Multiple STPs Form (for adding new) -->
                        <div v-else>
                          <div class="stp-container" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                            <div v-for="(stp, index) in multipleSTPs" :key="index" class="border rounded p-3 mb-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">Entry {{ multipleSTPs.length - index }}</h6>
                                <button v-if="multipleSTPs.length > 1" type="button" class="btn btn-sm btn-danger"
                                  @click="removeSTPRow(index)">
                                  <i class="fa fa-trash"></i>
                                </button>
                              </div>

                              <div class="row">
                                <!--
                  <div class="col-md-4 mb-3">
                    <label>Name</label>
                    <input v-model="stp.name" type="text" class="form-control" />
                  </div>
                  -->
                                <div class="col-md-4 mb-3">
                                  <label>Stop</label>
                                  <Multiselect v-model="stp.stop_id" :options="stops" label="name" track-by="id"
                                    placeholder="Select Stop" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Timetable</label>
                                  <Multiselect v-model="stp.schedule_timetable_id" :options="offices" label="route"
                                    track-by="id" placeholder="Select Timetable" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Sequency</label>
                                  <input v-model="stp.sequency" type="number" class="form-control" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Type</label>
                                  <select v-model="stp.type" class="form-control">
                                    <option value="BOARDING">BOARDING</option>
                                    <option value="DROPPING">DROPPING</option>
                                    <option value="VIA">VIA</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button v-if="isMultipleSTPMode" type="button" class="btn btn-sm btn-success"
                          @click="addSTPRow">
                          <i class="fa fa-plus me-1"></i> Add Row
                        </button>
                        <button class="btn btn-primary" @click="saveSTP">{{ currentSTP.id ? 'Update' : 'Save'
                        }}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- timetable end  -->

              <!-- stops start -->
              <div class="tab-pane fade" :class="{ 'show active': activeTab === 'stops' }" id="icon-stops"
                role="tabpanel" aria-labelledby="icon-stops-tab">

                <div v-if="isLoadingStops" class="d-flex justify-content-center mx-5 mt-3 mb-5">
                  <div class="spinner-border text-info"></div>
                </div>
                <div v-else class="row layout-top-spacing rounded bg-white mt-2">
                  <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
                    <div class="panel br-6 p-0">
                      <div class="custom-table p-3">
                        <v-client-table :data="stopsList" :columns="stopColumns" :options="stopTableOption">
                          <template #name="props">
                            <span>{{ props.row.name }}</span>
                          </template>
                          <template #city="props">
                            <span>{{ props.row.city }}</span>
                          </template>
                          <template #status="props">
                            <span class="badge bg-success">{{ props.row.status }}</span>
                          </template>
                          <template #actions="props">
                            <button class="btn btn-sm me-1" @click="openStopModal(props.row)" title="Edit Stop">
                              <i class="fa fa-edit text-primary"></i>
                            </button>
                            <!-- Delete disabled
              <button class="btn btn-sm" @click="deleteStop(props.row.id)">...</button>
              -->
                            <button class="btn btn-sm" title="Details" @click="showDetails(props.row, 'stop')">
                              <i class="fa fa-eye text-info"></i>
                            </button>
                          </template>
                        </v-client-table>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Stop Modal -->
                <div class="modal modal-xl fade" id="stopModal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">{{ currentStop.id ? 'Edit Stop' : 'Add Stop' }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        <!-- Single Stop Form (for editing) -->
                        <div v-if="!isMultipleStopMode">
                          <div class="row">
                            <div class="col-md-6 mb-3">
                              <label>Name</label>
                              <input v-model="currentStop.name" type="text" class="form-control"
                                @input="formatStopNameToUppercase" />
                            </div>
                            <div class="col-md-6 mb-3">
                              <label>City</label>
                              <Multiselect v-model="currentStop.city_id" :options="cities" label="name" track-by="id"
                                placeholder="Select City" />
                            </div>
                          </div>
                          <div class="row">
                            <div class="col-md-6 mb-3">
                              <label>Status</label>
                              <select v-model="currentStop.status" class="form-control">
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <!-- Multiple Stops Form (for adding new) -->
                        <div v-else>
                          <div class="stops-container"
                            style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                            <div v-for="(stop, index) in multipleStops" :key="index" class="border rounded p-3 mb-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">Entry {{ multipleStops.length - index }}</h6>
                                <button v-if="multipleStops.length > 1" type="button" class="btn btn-sm btn-danger"
                                  @click="removeStopRow(index)">
                                  <i class="fa fa-trash"></i>
                                </button>
                              </div>

                              <div class="row">
                                <div class="col-md-4 mb-3">
                                  <label>Name</label>
                                  <input v-model="stop.name" type="text" class="form-control"
                                    @input="formatMultipleStopNameToUppercase(index)" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>City</label>
                                  <Multiselect v-model="stop.city_id" :options="cities" label="name" track-by="id"
                                    placeholder="Select City" />
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label>Status</label>
                                  <select v-model="stop.status" class="form-control">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                  </select>
                                </div>
                              </div>                             
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button v-if="isMultipleStopMode" type="button" class="btn btn btn-outline-success"
                          @click="addStopRow">
                          <i class="fa fa-plus me-1"></i> Add Row
                        </button>
                        <button class="btn btn-outline-primary" @click="saveStop">{{ currentStop.id ? 'Update' : 'Save'
                        }}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- start end -->
            </div>
          </div>
        </div>
      </div>
      <div class="tab-pane fade" id="icon-stsubroute" role="tabpanel" aria-labelledby="icon-stsubroute-tab">

        <div v-if="isLoadingSTSubRoute" class="d-flex justify-content-center mx-5 mt-3 mb-5">
          <div class="spinner-border text-info"></div>
        </div>
        <div v-else class="row layout-top-spacing rounded bg-white mt-2">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
            <div class="panel br-6 p-0">
              <div class="custom-table p-3">
                <v-client-table :data="stSubRouteList" :columns="stSubRouteColumns" :options="stSubRouteTableOption">
                  <template #schedule_timetable_id="props">
                    <span>{{ props.row.schedule_timetable_id }}</span>
                  </template>
                  <template #sub_route_id="props">
                    <span>{{ props.row.sub_route_id }}</span>
                  </template>
                  <template #is_online_allowed="props">
                    <span :class="props.row.is_online_allowed ? 'text-success' : 'text-danger'">
                      {{ props.row.is_online_allowed ? 'Allowed' : 'Not Allowed' }}
                    </span>
                  </template>
                  <template #fare="props">
                    <span>{{ props.row.fare }}</span>
                  </template>
                  <template #commission="props">
                    <span>{{ props.row.commission }}</span>
                  </template>
                  <template #seat_limit="props">
                    <span>{{ props.row.seat_limit }}</span>
                  </template>
                  <template #actions="props">
                    <button class="btn btn-sm me-1" @click="openSTSubRouteModal(props.row)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="feather feather-edit-2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </button>
                    <!-- Delete disabled
              <button class="btn btn-sm" @click="deleteSTSubRoute(props.row.id)">...</button>
              -->
                    <button class="btn btn-sm" title="Details" @click="showDetails(props.row, 'stsubroute')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="feather feather-eye">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </template>
                </v-client-table>
              </div>
            </div>
          </div>
        </div>
        <!-- Modal -->
        <div class="modal modal-xl fade" id="stSubRouteModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ currentSTSubRoute.id ? 'Edit Timetable SubRoute' : 'Add Timetable SubRoute'
                }}
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label>Timetable</label>
                    <Multiselect v-model="currentSTSubRoute.schedule_timetable_id" :options="offices" label="route"
                      track-by="id" placeholder="Select Timetable" />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>SubRoute</label>
                    <Multiselect v-model="currentSTSubRoute.sub_route_id" :options="subRoutesList" label="city_link"
                      track-by="id" placeholder="Select SubRoute" />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>Online Allowed</label>
                    <select v-model="currentSTSubRoute.is_online_allowed" class="form-control">
                      <option :value="1">Allowed</option>
                      <option :value="0">Not Allowed</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>Fare</label>
                    <input v-model="currentSTSubRoute.fare" type="number" class="form-control" />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>Commission</label>
                    <input v-model="currentSTSubRoute.commission" type="number" class="form-control" />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>Seat Limit</label>
                    <input v-model="currentSTSubRoute.seat_limit" type="number" class="form-control" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-primary" @click="saveSTSubRoute">{{ currentSTSubRoute.id ? 'Update' : 'Save'
                }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from "@/stores/auth";
const isLoading = ref(false);
const { showAlert } = useNotification();
const authStore = useAuthStore();

// Simple details handler
const showDetails = (row, type) => {
  try {
    //} catch (e) {
    // no-op
  }
};

// Debug function to check modal state
const debugModal = (modalId) => {
  const modalElement = document.getElementById(modalId);
  // if (modalElement) {
  //,
  //     ariaModal: modalElement.getAttribute('aria-modal'),
  //     isVisible: modalElement.offsetParent !== null
  //   });
  // } else {
  //// }
};

// Helper function to safely open modals
const openModalSafely = async (modalId, modalRef) => {
  try {
    await nextTick(); // Wait for DOM to be ready
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      console.error(`Modal element with id '${modalId}' not found`);
      showAlert('error', `Modal not found: ${modalId}`);
      return;
    }

    //debugModal(modalId);

    // Dispose existing modal instance if it exists
    if (modalRef.value) {
      try {
        modalRef.value.dispose();
      } catch (e) {
        console.warn('Error disposing modal:', e);
      }
    }

    // First try Bootstrap modal
    try {
      modalRef.value = new Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });

      // Add event listeners for debugging
      // modalElement.addEventListener('shown.bs.modal', () => {
      //// });

      // modalElement.addEventListener('hidden.bs.modal', () => {
      //// });

      modalRef.value.show();

      // Check if modal actually opened
      setTimeout(() => {
        debugModal(modalId);
        if (!modalElement.classList.contains('show')) {
          console.warn(`Modal ${modalId} did not open properly, trying fallback`);
          throw new Error('Modal did not open');
        }
      }, 200);

    } catch (bootstrapError) {
      console.warn('Bootstrap modal failed, using manual approach:', bootstrapError);

      // Fallback: Manual modal show
      modalElement.style.display = 'block';
      modalElement.classList.add('show');
      modalElement.setAttribute('aria-hidden', 'false');
      modalElement.setAttribute('aria-modal', 'true');

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = `${modalId}-backdrop`;
      document.body.appendChild(backdrop);

      // Add modal-open class to body
      document.body.classList.add('modal-open');

      // Store backdrop reference for cleanup
      modalRef.value = {
        dispose: () => {
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          modalElement.setAttribute('aria-hidden', 'true');
          modalElement.removeAttribute('aria-modal');
          document.body.classList.remove('modal-open');
          const existingBackdrop = document.getElementById(`${modalId}-backdrop`);
          if (existingBackdrop) {
            existingBackdrop.remove();
          }
        },
        hide: () => {
          modalRef.value.dispose();
        }
      };

      //}

  } catch (error) {
    console.error(`Error opening modal ${modalId}:`, error);
    showAlert('error', `Failed to open modal: ${modalId}`);
  }
};

const axiosInstance = axios.create({
  baseURL: API_URL_2,
 // baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
     Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const originalTerminals = ref([]);
const destinationTerminals = ref([]);
const serviceClasses = ref([]);
const offices = ref([]);
const routes = ref([]);



// UI state for unified header actions
const activeTab = ref('routes');
const routeSubTab = ref('routes');
const addLabel = computed(() => {
  switch (activeTab.value) {
    case 'routes':
      return routeSubTab.value === 'routes' ? 'Add Route' : 'Add SubRoute';
    case 'citylink': return 'Add City Link';
    case 'stops': return 'Add Stop';
    default: return 'Add';
  }
});

const onAddClick = async () => {
  switch (activeTab.value) {
    case 'routes':
      if (routeSubTab.value === 'routes') await openRouteModal();
      else await openSubRouteModal();
      break;
    case 'citylink':
      await openCityLinkModal();
      break;
    case 'stops':
      await openStopModal();
      break;
  }
};

// Quick Add City state
const quickCity = ref({ name: '', status: 'Active' });
const quickCityModal = ref(null);

const formatQuickCityNameToUppercase = (event) => {
  const value = event.target.value;
  quickCity.value.name = value.toUpperCase();
};


const saveQuickCity = async () => {
  try {
    if (!quickCity.value.name) {
      showAlert('error', 'Please enter city name');
      return;
    }
    const payload = {
      name: quickCity.value.name,
      status: quickCity.value.status,
    };
    const response = await axiosInstance.post('cities', payload);
    if (response.data.status === 'success') {
      showAlert('success', 'City added successfully');
      formDataLoaded.value = false; // ensure refresh
      await fetchFormData(); // reload cities
      const modalEl = document.getElementById('quickCityModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
      }
    }
  } catch (error) {
    if (error.response?.status === 422 && error.response.data?.errors) {
      Object.values(error.response.data.errors).forEach(msgs => {
        (Array.isArray(msgs) ? msgs : [msgs]).forEach(msg => showAlert('error', msg));
      });
    } else {
      showAlert('error', 'Failed to add city');
    }
  }
};

// Fetch offices
const fetchScheduleTimetable = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('schedule-timetables');
    offices.value = response.data.data.map((d, index) => {
      return {
        sno: index + 1,
        id: d.id,
        route: d.route,
        code_number: d.code_number,
        original_terminal_id: d.original_terminal_id,
        destination_terminal_id: d.destination_terminal_id,
        status: true,
        departure_time: d.departure_time ?? "N/A",
        start_date: d.start_date ?? "N/A",
        original_terminal: d.original_terminal ?? "N/A",
        destination_terminal: d.destination_terminal ?? "N/A",
        service_class: d.service_class ?? "N/A"
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch offices');
  } finally {
    isLoading.value = false;
  }
};

// Fetch routes for selection
const fetchroutes = async () => {
  try {
    const response = await axiosInstance.get('active-routes');
    routes.value = response.data.data || response.data;
  } catch (error) {
    showAlert('error', 'Failed to fetch routes');
  }
};

const fetchFormData = async () => {
  if (formDataLoaded.value) return; // Skip if already loaded

  try {
    const response = await axiosInstance.get('form-data');
    //// Debug log

    serviceClasses.value = response.data.data.service_classes || [];
    originalTerminals.value = response.data.data.original_terminals || [];
    destinationTerminals.value = response.data.data.destination_terminals || [];
    cities.value = response.data.data.cities || [];

    //// Debug log
    formDataLoaded.value = true;

  } catch (error) {
    console.error('Form Data Error:', error); // Debug log
    showAlert('error', 'Failed to fetch form data');
  }
};

const scheduleTimetableAction = () => {
  fetchScheduleTimetable();
  fetchFormData();
  fetchroutes();

};

const isLoadingCityLink = ref(false);
const cityLinks = ref([]);
const cityLinkModal = ref(null);
const currentCityLink = ref({
  id: null,
  code: "",
  original_city_id: "",
  destination_city_id: "",
  distance_km: "",
  approx_hours: ""
});

// Multiple city links functionality
const multipleCityLinks = ref([]);
const isMultipleMode = ref(false);
const cityLinkColumns = ref(['sno', 'code', 'original_city', 'destination_city', 'distance_km', 'approx_hours', 'actions']);
const cityLinkTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['code', 'distance_km'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const fetchCityLinks = async () => {
  if (cityLinksLoaded.value) return; // Skip if already loaded

  isLoadingCityLink.value = true;
  try {
    const response = await axiosInstance.get('city-links');
    cityLinks.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      id: d.id,
      code: d.code,
      original_city: d.original_city,
      destination_city: d.destination_city,
      original_city_id: d.original_city_id,
      destination_city_id: d.destination_city_id,
      distance_km: d.distance_km,
      approx_hours: d.approx_hours,
      path_geometri: d.path_geometri,
      name: d.name
    }));
    cityLinksLoaded.value = true;
  } catch (error) {
    showAlert('error', 'Failed to fetch city links');
  } finally {
    isLoadingCityLink.value = false;
  }
};

const openCityLinkModal = async (link = null) => {
  // Ensure cities are loaded before opening modal
  if (!formDataLoaded.value) {
    await fetchFormData();
  }

  if (link) {
    currentCityLink.value = { ...link };
    isMultipleMode.value = false;
    multipleCityLinks.value = [];

    if (typeof currentCityLink.value.original_city_id === 'number') {
      const selected = cities.value.find(c => c.id === currentCityLink.value.original_city_id);
      if (selected) {
        currentCityLink.value.original_city_id = selected;
      }
    }

    if (typeof currentCityLink.value.destination_city_id === 'number') {
      const selected = cities.value.find(c => c.id === currentCityLink.value.destination_city_id);
      if (selected) {
        currentCityLink.value.destination_city_id = selected;
      }
    }


  } else {
    currentCityLink.value = {
      id: null,
      code: "",
      original_city_id: "",
      destination_city_id: "",
      distance_km: "",
      approx_hours: ""
    };
    isMultipleMode.value = true; // Alwaystart in multiple mode for new entries
    multipleCityLinks.value = [{
      id: null,
      code: "",
      original_city_id: "",
      destination_city_id: "",
      distance_km: "",
      approx_hours: ""
    }];
  }
  await openModalSafely('cityLinkModal', cityLinkModal);
};

// Add new city link row
const addCityLinkRow = () => {
  const newRow = {
    id: null,
    code: "",
    original_city_id: "",
    destination_city_id: "",
    distance_km: "",
    approx_hours: ""
  };

  // Add to the beginning of the array (latest first)
  multipleCityLinks.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.city-links-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove city link row
const removeCityLinkRow = (index) => {
  if (multipleCityLinks.value.length > 1) {
    multipleCityLinks.value.splice(index, 1);
  }
};

const saveCityLink = async () => {
  isLoading.value = true;
  try {
    // Prepare data - single or multiple
    let dataToSubmit;
    let isEdit = false;

    if (isMultipleMode.value) {
      // Multiple city links mode
      dataToSubmit = multipleCityLinks.value.map(link => ({
        code: link.code,
        distance_km: link.distance_km,
        approx_hours: link.approx_hours,
        original_city_id: typeof link.original_city_id === 'object' ? link.original_city_id.id : link.original_city_id,
        destination_city_id: typeof link.destination_city_id === 'object' ? link.destination_city_id.id : link.destination_city_id
      }));

      // Validate multiple entries
      try {
        await validateCityLinks(dataToSubmit);
      } catch (validationError) {
        showAlert('error', validationError.message);
        return;
      }

      // Submit as batch
      const response = await axiosInstance.post('city-links', { city_links: dataToSubmit });

      if (response.data.status === "success") {
        showAlert('success', `${dataToSubmit.length} City Links saved successfully`);
        cityLinkModal.value.hide();
        isLoading.value = false;
        cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      } else if (response.data.status === "partial") {
        // Handle partial success with errors
        const responseData = response.data;

        // Show the main message
        if (responseData.message) {
          showAlert('warning', responseData.message);
        }

        // Show individual errors
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((errorItem, index) => {
            if (errorItem.messages && Array.isArray(errorItem.messages)) {
              errorItem.messages.forEach(msg => {
                const errorMessage = errorItem.code
                  ? `Code ${errorItem.code}: ${msg}`
                  : msg;
                showAlert('error', errorMessage);
              });
            }
          });
        }
        isLoading.value = false;
        // Refresh the city links list to show updated data
        cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      }
    } else {
      // Single city link mode
      const linkData = {
        code: currentCityLink.value.code,
        distance_km: currentCityLink.value.distance_km,
        approx_hours: currentCityLink.value.approx_hours,
        original_city_id: typeof currentCityLink.value.original_city_id === 'object'
          ? currentCityLink.value.original_city_id.id
          : currentCityLink.value.original_city_id,
        destination_city_id: typeof currentCityLink.value.destination_city_id === 'object'
          ? currentCityLink.value.destination_city_id.id
          : currentCityLink.value.destination_city_id
      };

      // Validate single entry
      try {
        isLoading.value = false;
        await validateCityLinks([linkData]);
      } catch (validationError) {
        showAlert('error', validationError.message);
        return;
      }

      // Submit single entry
      let response;
      if (currentCityLink.value.id) {
        // Edit existing
        response = await axiosInstance.put(`city-links/${currentCityLink.value.id}`, linkData);
      } else {
        // Create new - submit as single item in array
        response = await axiosInstance.post('city-links', { city_links: [linkData] });
      }

      if (response.data.status === "success") {
        showAlert('success', 'City Link saved successfully');
        cityLinkModal.value.hide();
        cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      } else if (response.data.status === "partial") {
        // Handle partial success with errors
        const responseData = response.data;

        // Show the main message
        if (responseData.message) {
          showAlert('warning', responseData.message);
        }

        // Show individual errors
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((errorItem, index) => {
            if (errorItem.messages && Array.isArray(errorItem.messages)) {
              errorItem.messages.forEach(msg => {
                const errorMessage = errorItem.code
                  ? `Code ${errorItem.code}: ${msg}`
                  : msg;
                showAlert('error', errorMessage);
              });
            }
          });
        }

        // Refresh the city links list to show updated data
        cityLinksLoaded.value = false; // Reset flag to reload data
        await fetchCityLinks();
      }
    }
  } catch (error) {
    console.error('City Link Save Error:', error); // Debug log
    isLoading.value = false;
    if (error.response?.status === 422) {
      const responseData = error.response.data;

      // Handle backend validation errors format
      if (responseData.errors && Array.isArray(responseData.errors)) {
        // Backend returns array of errors with code and messages
        responseData.errors.forEach((errorItem, index) => {
          if (errorItem.messages) {
            // Handle Laravel validation errors object
            if (typeof errorItem.messages === 'object' && !Array.isArray(errorItem.messages)) {
              Object.values(errorItem.messages).forEach(messages => {
                if (Array.isArray(messages)) {
                  messages.forEach(msg => {
                    const errorMessage = errorItem.code
                      ? `Row ${index + 1} (Code: ${errorItem.code}): ${msg}`
                      : `Row ${index + 1}: ${msg}`;
                    showAlert('error', errorMessage);
                  });
                } else {
                  const errorMessage = errorItem.code
                    ? `Row ${index + 1} (Code: ${errorItem.code}): ${messages}`
                    : `Row ${index + 1}: ${messages}`;
                  showAlert('error', errorMessage);
                }
              });
            } else if (Array.isArray(errorItem.messages)) {
              // Handle direct array of messages
              errorItem.messages.forEach(msg => {
                const errorMessage = errorItem.code
                  ? `Row ${index + 1} (Code: ${errorItem.code}): ${msg}`
                  : `Row ${index + 1}: ${msg}`;
                showAlert('error', errorMessage);
              });
            }
          }
        });
      } else if (responseData.errors) {
        // Standard Laravel validation errors
        Object.values(responseData.errors).forEach(msgs => {
          if (Array.isArray(msgs)) {
            msgs.forEach(msg => showAlert('error', msg));
          } else {
            showAlert('error', msgs);
          }
        });
      } else {
        showAlert('error', 'Validation failed');
      }
    } else if (error.response?.data?.message) {
      showAlert('error', error.response.data.message);
    } else {
      showAlert('error', 'Failed to save city link');
    }
  }
  finally {
    isLoading.value = false;
  }
};

// Unified validation function for city links
const validateCityLinks = async (cityLinksData) => {
  // Validate required fields
  for (let i = 0; i < cityLinksData.length; i++) {
    const link = cityLinksData[i];
    if (!link.code || !link.original_city_id || !link.destination_city_id) {
      throw new Error(`Please fill all required fields in row ${i + 1}`);
    }

    // Check if original and destination cities are the same
    if (link.original_city_id === link.destination_city_id) {
      throw new Error(`Original and Destination cities cannot be the same in row ${i + 1}`);
    }
  }

  // Check for duplicate city link combinations across all entries
  const cityLinkCombinations = new Set();
  for (let i = 0; i < cityLinksData.length; i++) {
    const link = cityLinksData[i];

    // Create a unique key for the city combination (both directions)
    const combinationKey1 = `${link.original_city_id}-${link.destination_city_id}`;
    const combinationKey2 = `${link.destination_city_id}-${link.original_city_id}`;

    if (cityLinkCombinations.has(combinationKey1) || cityLinkCombinations.has(combinationKey2)) {
      throw new Error(`Duplicate city link combination found in row ${i + 1}. The same city pair already exists in another row.`);
    }

    cityLinkCombinations.add(combinationKey1);
    cityLinkCombinations.add(combinationKey2);
  }
};



const cityLinkAction = () => {
  fetchCityLinks();
  fetchFormData(); // Only load cities for city link form
};
// --- City Link Logic END ---

//route stary 
// ...existing code...
const isLoadingRoutes = ref(false);
const routesList = ref([]);
const routeModal = ref(null);
const currentRoute = ref({
  id: null,
  city_link_id: "",
  route_code: "",
  is_active: 1
});

// Multiple routes functionality
const multipleRoutes = ref([]);
const isMultipleRouteMode = ref(false);
const routeColumns = ref(['sno', 'city_link', 'route_code', 'route_distance', 'approximate_hrs', 'is_active', 'actions']);
const routeTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['route_code', 'route_distance', 'approximate_hrs', 'is_active'],
  pagination: { nav: 'scroll', chunk: 5 },
  headings: {
    sno: 'Sn',
    city_link: 'City Link',
    route_code: 'Code',
    route_distance: 'Distance',
    approximate_hrs: 'Hours',
    is_active: 'Is Active',
    actions: 'Action'
  }
});

const fetchRoutesList = async () => {
  if (routesLoaded.value) return;
   // Skip if already loaded
    isLoadingRoutes.value = true;
  try {
    const response = await axiosInstance.get('routes');
    routesList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
    routesLoaded.value = true;
  } catch (error) {
    showAlert('error', 'Failed to fetch routes');
  } finally {
    isLoadingRoutes.value = false;
  }
};

const openRouteModal = async (route = null) => {
  if (route) {
    currentRoute.value = { ...route };
    isMultipleRouteMode.value = false;
    multipleRoutes.value = [];
    if (typeof currentRoute.value.city_link_id === 'number') {
      const selected = cityLinks.value.find(c => c.id === currentRoute.value.city_link_id);
      if (selected) {
        currentRoute.value.city_link_id = selected;
      }
    }
  } else {
    currentRoute.value = {
      id: null,
      city_link_id: "",
      route_code: "",
      is_active: 1
    };
    isMultipleRouteMode.value = true; // Always start in multiple mode for new entries
    multipleRoutes.value = [{
      id: null,
      city_link_id: "",
      route_code: "",
      is_active: 1
    }];
  }
  await openModalSafely('routeModal', routeModal);
};

// Add new route row
const addRouteRow = () => {
  const newRow = {
    id: null,
    city_link_id: "",
    route_code: "",
    is_active: 1
  };

  // Add to the beginning of the array (latest first)
  multipleRoutes.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.routes-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove route row
const removeRouteRow = (index) => {
  if (multipleRoutes.value.length > 1) {
    multipleRoutes.value.splice(index, 1);
  }
};

const saveRoute = async () => {
  if (isMultipleRouteMode.value) {
    await saveMultipleRoutes();
    return;
  }

  isLoading.value = true;
  try {
    let response;
    let params = {
      city_link_id: typeof currentRoute.value.city_link_id === 'object' ? currentRoute.value.city_link_id.id : currentRoute.value.city_link_id,
      route_code: currentRoute.value.route_code,
      is_active: currentRoute.value.is_active
    };
    if (currentRoute.value.id) {
      response = await axiosInstance.put(`routes/${currentRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('routes', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Route saved successfully');
      routeModal.value.hide();
      routesLoaded.value = false;
      isLoading.value = false;
      await fetchRoutesList();
    }
  } catch (error) {
    isLoading.value = false;
    showAlert('error', 'Failed to save route');
  }
  finally {
    isLoading.value = false;
  }
};

// Save multiple routes
const saveMultipleRoutes = async () => {
  isLoading.value = true;
  try {
    // Validate all entries
    for (let i = 0; i < multipleRoutes.value.length; i++) {
      const route = multipleRoutes.value[i];
      if (!route.city_link_id || !route.route_code) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleRoutes.value.map(route => ({
      city_link_id: typeof route.city_link_id === 'object' ? route.city_link_id.id : route.city_link_id,
      route_code: route.route_code,
      is_active: route.is_active
    }));


    // Send batch request
    const response = await axiosInstance.post('routes', { routes: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleRoutes.value.length} Routes saved successfully`);
      routeModal.value.hide();
      await fetchRoutesList();
      isLoading.value = false;
    }
  } catch (error) {
    if (error.response?.status === 422) {
      isLoading.value = false;
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Failed to save routes');
    }
  }
  finally {
    isLoading.value = false;
  }
};


const filteredLinks = computed(() => {
  // ✅ IDs that are already selected
  const selectedIds = multipleRoutes.value
    .map(r => (r.city_link_id?.id ?? r.city_link_id)) // handle object or number
    .filter(id => id != null);

  //// ✅ Return cityLinks that are NOT selected
  return cityLinks.value.filter(link => !selectedIds.includes(link.id));
});


const deleteRoute = async (id) => {
  if (!confirm('Are you sure you want to delete this route?')) return;
  try {
    await axiosInstance.delete(`routes/${id}`);
    showAlert('success', 'Route deleted successfully');
    await fetchRoutesList();
  } catch (error) {
    showAlert('error', 'Failed to delete route');
  }
};

const routeAction = () => {
  fetchRoutesList();
  fetchCityLinks(); // Routes need city links for selection
  fetchFormData(); // Load cities for route form
};


// sub route logics start
// ...existing code...
const isLoadingSubRoutes = ref(false);
const subRoutesList = ref([]);
const subRouteModal = ref(null);
const currentSubRoute = ref({
  id: null,
  city_link_id: "",
  route_id: "",
  is_active: 1
});

// Multiple subroutes functionality
const multipleSubRoutes = ref([]);
const isMultipleSubRouteMode = ref(false);
const subRouteColumns = ref(['sno', 'city_link', 'route', 'is_active', 'actions']);
const subRouteTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['is_active'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const fetchSubRoutesList = async () => {
  if (subRoutesLoaded.value) return; // Skip if already loaded

  isLoadingSubRoutes.value = true;
  try {
    const response = await axiosInstance.get('sub-routes');
    //subRoutesList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
    //subRoutesLoaded.value = true;

  } catch (error) {
    showAlert('error', 'Failed to fetch subroutes');
  } finally {
    isLoadingSubRoutes.value = false;
  }
};

const openSubRouteModal = async (subroute = null) => {
  if (subroute) {
    currentSubRoute.value = { ...subroute };
    isMultipleSubRouteMode.value = false;
    multipleSubRoutes.value = [];
  } else {
    currentSubRoute.value = {
      id: null,
      city_link_id: "",
      route_id: "",
      sequency: 1,
      is_active: 1
    };
    isMultipleSubRouteMode.value = true; // Always start in multiple mode for new entries
    multipleSubRoutes.value = [{
      id: null,
      city_link_id: "",
      route_id: "",
      sequency: 1,
      is_active: 1
    }];
  }
  await openModalSafely('subRouteModal', subRouteModal);
};

// Add new subroute row
const addSubRouteRow = () => {
  const newRow = {
    id: null,
    city_link_id: "",
    route_id: "",
    sequency: 1,
    is_active: 1
  };

  // Add to the beginning of the array (latest first)
  multipleSubRoutes.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.subroutes-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove subroute row
const removeSubRouteRow = (index) => {
  if (multipleSubRoutes.value.length > 1) {
    multipleSubRoutes.value.splice(index, 1);
  }
};

const saveSubRoute = async () => {
  if (isMultipleSubRouteMode.value) {
    await saveMultipleSubRoutes();
    return;
  }

  try {
    let params = {
      city_link_id: typeof currentSubRoute.value.city_link_id === 'object' ? currentSubRoute.value.city_link_id.id : currentSubRoute.value.city_link_id,
      route_id: typeof currentSubRoute.value.route_id === 'object' ? currentSubRoute.value.route_id.id : currentSubRoute.value.route_id,
      is_active: currentSubRoute.value.is_active
    };
    let response;
    if (currentSubRoute.value.id) {
      response = await axiosInstance.put(`sub-routes/${currentSubRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('sub-routes', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'SubRoute saved successfully');
      subRouteModal.value.hide();
      await fetchSubRoutesList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save subroute');
  }
};

// Save multiple subroutes
const saveMultipleSubRoutes = async () => {
  try {
    // Validate all entries
    for (let i = 0; i < multipleSubRoutes.value.length; i++) {
      const subroute = multipleSubRoutes.value[i];
      if (!subroute.city_link_id || !subroute.route_id) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleSubRoutes.value.map(subroute => ({
      city_link_id: typeof subroute.city_link_id === 'object' ? subroute.city_link_id.id : subroute.city_link_id,
      route_id: typeof subroute.route_id === 'object' ? subroute.route_id.id : subroute.route_id,
      is_active: subroute.is_active
    }));

    // Send batch request
    const response = await axiosInstance.post('sub-routes', { sub_routes: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleSubRoutes.value.length} SubRoutes saved successfully`);
      subRouteModal.value.hide();
      await fetchSubRoutesList();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Failed to save subroutes');
    }
  }
};


const isLoadingSTP = ref(false);
const stpList = ref([]);
const stpModal = ref(null);
const currentSTP = ref({
  id: null,
  name: "",
  stop_id: "",
  schedule_timetable_id: "",
  sequency: 1,
  type: ''
});

// Multiple STP functionality
const multipleSTPs = ref([]);
const isMultipleSTPMode = ref(false);
const stpColumns = ref(['sno', 'stop', 'route', 'sequency', 'type', 'actions']);
const stpTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['name', 'sequency', 'type'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const stops = ref([]); // You should fetch stops from your API

const fetchStops = async () => {
  try {
    const response = await axiosInstance.get('stops');
    stops.value = response.data.data || [];
  } catch (error) {
    showAlert('error', 'Failed to fetch stops');
  }
};

const fetchSTPList = async () => {
  isLoadingSTP.value = true;
  try {
    const response = await axiosInstance.get(`schedule-timetable-points?route_id=${route.param.id}`);
    stpList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
  } catch (error) {
    showAlert('error', 'Failed to fetch points');
  } finally {
    isLoadingSTP.value = false;
  }
};

const openSTPModal = async (point = null) => {
  if (point) {
    currentSTP.value = { ...point };
    isMultipleSTPMode.value = false;
    multipleSTPs.value = [];
  } else {
    currentSTP.value = {
      id: null,
      name: "",
      stop_id: "",
      schedule_timetable_id: "",
      sequency: 1,
      type: "BOARDING OR DROPPING"
    };
    isMultipleSTPMode.value = true; // Always start in multiple mode for new entries
    multipleSTPs.value = [{
      id: null,
      name: "",
      stop_id: "",
      schedule_timetable_id: "",
      sequency: 1,
      type: "BOARDING OR DROPPING"
    }];
  }
  await openModalSafely('stpModal', stpModal);
};

// Add new STP row
const addSTPRow = () => {
  const newRow = {
    id: null,
    name: "",
    stop_id: "",
    schedule_timetable_id: "",
    sequency: 1,
    type: "BOARDING OR DROPPING"
  };

  // Add to the beginning of the array (latest first)
  multipleSTPs.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.stp-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove STP row
const removeSTPRow = (index) => {
  if (multipleSTPs.value.length > 1) {
    multipleSTPs.value.splice(index, 1);
  }
};

const saveSTP = async () => {
  if (isMultipleSTPMode.value) {
    await saveMultipleSTPs();
    return;
  }

  try {
    let params = {
      name: currentSTP.value.name,
      stop_id: typeof currentSTP.value.stop_id === 'object' ? currentSTP.value.stop_id.id : currentSTP.value.stop_id,
      schedule_timetable_id: typeof currentSTP.value.schedule_timetable_id === 'object' ? currentSTP.value.schedule_timetable_id.id : currentSTP.value.schedule_timetable_id,
      sequency: currentSTP.value.sequency,
      type: currentSTP.value.type
    };
    let response;
    if (currentSTP.value.id) {
      response = await axiosInstance.put(`schedule-timetable-points/${currentSTP.value.id}`, params);
    } else {
      response = await axiosInstance.post('schedule-timetable-points', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Point saved successfully');
      stpModal.value.hide();
      await fetchSTPList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save point');
  }
};

// Save multiple STPs
const saveMultipleSTPs = async () => {
  try {
    // Validate all entries
    for (let i = 0; i < multipleSTPs.value.length; i++) {
      const stp = multipleSTPs.value[i];
      if (!stp.stop_id || !stp.schedule_timetable_id) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleSTPs.value.map(stp => ({
      name: stp.name,
      stop_id: typeof stp.stop_id === 'object' ? stp.stop_id.id : stp.stop_id,
      schedule_timetable_id: typeof stp.schedule_timetable_id === 'object' ? stp.schedule_timetable_id.id : stp.schedule_timetable_id,
      sequency: stp.sequency,
      type: stp.type
    }));

    // Send batch request
    const response = await axiosInstance.post('schedule-timetable-points', { stps: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleSTPs.value.length} Points saved successfully`);
      stpModal.value.hide();
      await fetchSTPList();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
      showAlert('error', 'Failed to save points');
    }
  }
};




// stops logics 

// ...existing code...
const isLoadingStops = ref(false);
const stopsList = ref([]);
const stopModal = ref(null);
const currentStop = ref({
  id: null,
  name: "",
  city_id: "",
  status: "Active"
});

// Multiple stops functionality
const multipleStops = ref([]);
const isMultipleStopMode = ref(false);
const stopColumns = ref(['sno', 'name', 'city', 'status', 'actions']);
const stopTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['name', 'city', 'status'],
  pagination: { nav: 'scroll', chunk: 5 },
  headings: {
    sno: 'Sn',
    name: 'Stop Name',
    city: 'City',
    status: 'Status',
    actions: 'Actions'
  },
});

const cities = ref([]);

// Lazy loading flags to prevent unnecessary API calls
const routesLoaded = ref(false);
const subRoutesLoaded = ref(false);
const cityLinksLoaded = ref(false);
const stopsLoaded = ref(false);
const formDataLoaded = ref(false);

// Computed properties for filtered city options
const filteredDestinationCities = computed(() => {
  if (!currentCityLink.value.original_city_id) return cities.value;
  const originalId = typeof currentCityLink.value.original_city_id === 'object'
    ? currentCityLink.value.original_city_id.id
    : currentCityLink.value.original_city_id;
  return cities.value.filter(city => city.id !== originalId);
});

const filteredOriginalCities = computed(() => {
  if (!currentCityLink.value.destination_city_id) return cities.value;
  const destinationId = typeof currentCityLink.value.destination_city_id === 'object'
    ? currentCityLink.value.destination_city_id.id
    : currentCityLink.value.destination_city_id;
  return cities.value.filter(city => city.id !== destinationId);
});

// Function to get filtered cities for multiple city links
const getFilteredDestinationCities = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (!link || !link.original_city_id) return cities.value;
  const originalId = typeof link.original_city_id === 'object'
    ? link.original_city_id.id
    : link.original_city_id;
  return cities.value.filter(city => city.id !== originalId);
};

const getFilteredOriginalCities = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (!link || !link.destination_city_id) return cities.value;
  const destinationId = typeof link.destination_city_id === 'object'
    ? link.destination_city_id.id
    : link.destination_city_id;
  return cities.value.filter(city => city.id !== destinationId);
};

// Function to clear destination when original changes (single form)
const onOriginalCityChange = () => {
  if (currentCityLink.value.destination_city_id) {
    const originalId = typeof currentCityLink.value.original_city_id === 'object'
      ? currentCityLink.value.original_city_id.id
      : currentCityLink.value.original_city_id;
    const destinationId = typeof currentCityLink.value.destination_city_id === 'object'
      ? currentCityLink.value.destination_city_id.id
      : currentCityLink.value.destination_city_id;

    if (originalId === destinationId) {
      currentCityLink.value.destination_city_id = null;
    }
  }
};

// Function to clear original when destination changes (single form)
const onDestinationCityChange = () => {
  if (currentCityLink.value.original_city_id) {
    const originalId = typeof currentCityLink.value.original_city_id === 'object'
      ? currentCityLink.value.original_city_id.id
      : currentCityLink.value.original_city_id;
    const destinationId = typeof currentCityLink.value.destination_city_id === 'object'
      ? currentCityLink.value.destination_city_id.id
      : currentCityLink.value.destination_city_id;

    if (originalId === destinationId) {
      currentCityLink.value.original_city_id = null;
    }
  }
};

// Function to clear destination when original changes (multiple forms)
const onMultipleOriginalCityChange = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (link && link.destination_city_id) {
    const originalId = typeof link.original_city_id === 'object'
      ? link.original_city_id.id
      : link.original_city_id;
    const destinationId = typeof link.destination_city_id === 'object'
      ? link.destination_city_id.id
      : link.destination_city_id;

    if (originalId === destinationId) {
      link.destination_city_id = null;
    }
  }
};

// Function to clear original when destination changes (multiple forms)
const onMultipleDestinationCityChange = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (link && link.original_city_id) {
    const originalId = typeof link.original_city_id === 'object'
      ? link.original_city_id.id
      : link.original_city_id;
    const destinationId = typeof link.destination_city_id === 'object'
      ? link.destination_city_id.id
      : link.destination_city_id;

    if (originalId === destinationId) {
      link.original_city_id = null;
    }
  }
};

// Function to format code to uppercase (single form)
const formatCodeToUppercase = (event) => {
  const value = event.target.value;
  currentCityLink.value.code = value.toUpperCase();
};

// Function to format code to uppercase (multiple forms)
const formatMultipleCodeToUppercase = (linkIndex) => {
  const link = multipleCityLinks.value[linkIndex];
  if (link) {
    link.code = link.code.toUpperCase();
  }
};

// Function to format stop name to uppercase (single form)
const formatStopNameToUppercase = (event) => {
  const value = event.target.value;
  currentStop.value.name = value.toUpperCase();
};

// Function to format stop name to uppercase (multiple forms)
const formatMultipleStopNameToUppercase = (stopIndex) => {
  const stop = multipleStops.value[stopIndex];
  if (stop) {
    stop.name = stop.name.toUpperCase();
  }
};



const fetchStopsList = async () => {
  if (stopsLoaded.value) return; // Skip if already loaded

  isLoadingStops.value = true;
  try {
    const response = await axiosInstance.get('stops');
    stopsList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d,
      status: 'Active' // Set all stops as active for now
    }));
    stopsLoaded.value = true;
  } catch (error) {
    showAlert('error', 'Failed to fetch stops');
  } finally {
    isLoadingStops.value = false;
  }
};

const openStopModal = async (stop = null) => {
  if (stop) {
    currentStop.value = { ...stop };
    isMultipleStopMode.value = false;
    multipleStops.value = [];
  } else {
    currentStop.value = {
      id: null,
      name: "",
      city_id: "",
      status: "Active"
    };
    isMultipleStopMode.value = true; // Always start in multiple mode for new entries
    multipleStops.value = [{
      id: null,
      name: "",
      city_id: "",
      status: "Active"
    }];
  }
  await openModalSafely('stopModal', stopModal);
};

// Add new stop row
const addStopRow = () => {
  const newRow = {
    id: null,
    name: "",
    city_id: "",
    status: "Active"
  };

  // Add to the beginning of the array (latest first)
  multipleStops.value.unshift(newRow);

  // Scroll to the top to show the newly added row
  nextTick(() => {
    const container = document.querySelector('.stops-container');
    if (container) {
      container.scrollTop = 0;
    }
  });
};

// Remove stop row
const removeStopRow = (index) => {
  if (multipleStops.value.length > 1) {
    multipleStops.value.splice(index, 1);
  }
};

const saveStop = async () => {
  if (isMultipleStopMode.value) {
    await saveMultipleStops();
    return;
  }

  try {
    let params = {
      name: currentStop.value.name,
      city_id: typeof currentStop.value.city_id === 'object' ? currentStop.value.city_id.id : currentStop.value.city_id,
      status: currentStop.value.status
    };
    let response;
    if (currentStop.value.id) {
      response = await axiosInstance.put(`stops/${currentStop.value.id}`, params);
    } else {
      response = await axiosInstance.post('stops', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Stop saved successfully');
      stopModal.value.hide();
      stopsLoaded.value = false; // Reset flag to reload data
      await fetchStopsList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save stop');
  }
};

// Save multiple stops
const saveMultipleStops = async () => {
  isLoading.value = false;
  try {
    // Validate all entries
    for (let i = 0; i < multipleStops.value.length; i++) {
      const stop = multipleStops.value[i];
      if (!stop.name || !stop.city_id || !stop.status) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`);
        return;
      }
    }

    // Prepare batch data
    const batchData = multipleStops.value.map(stop => ({
      name: stop.name,
      city_id: typeof stop.city_id === 'object' ? stop.city_id.id : stop.city_id,
      status: stop.status
    }));

    // Send batch request
    const response = await axiosInstance.post('stops', { stops: batchData });

    if (response.data.status === "success") {
      showAlert('success', `${multipleStops.value.length} Stops saved successfully`);
      stopModal.value.hide();
      isLoading.value = false;
      stopsLoaded.value = false; // Reset flag to reload data
      await fetchStopsList();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      isLoading.value = false;
      const errors = error.response.data.errors;
      Object.values(errors).forEach(msgs => msgs.forEach(msg => showAlert('error', msg)));
    } else {
isLoading.value = false;
      showAlert('error', 'Failed to save stops');
    }
  }
};



//timetable subroute 

const isLoadingSTSubRoute = ref(false);
const stSubRouteList = ref([]);
const stSubRouteModal = ref(null);
const currentSTSubRoute = ref({
  id: null,
  schedule_timetable_id: "",
  sub_route_id: "",
  is_online_allowed: 1,
  fare: "",
  commission: "",
  seat_limit: ""
});
const stSubRouteColumns = ref([
  'sno', 'schedule_timetable', 'sub_route', 'is_online_allowed', 'fare', 'commission', 'seat_limit', 'actions'
]);
const stSubRouteTableOption = ref({
  perPage: 10,
  perPageValues: [5, 10, 20, 50],
  skin: 'table',
  columnsClasses: { actions: 'actions text-center' },
  sortable: ['fare', 'commission', 'seat_limit'],
  pagination: { nav: 'scroll', chunk: 5 },
});

const fetchSTSubRouteList = async () => {
  isLoadingSTSubRoute.value = true;
  try {
    const response = await axiosInstance.get('schedule-timetable-sub-routes');
    stSubRouteList.value = response.data.data.map((d, index) => ({
      sno: index + 1,
      ...d
    }));
  } catch (error) {
    showAlert('error', 'Failed to fetch timetable subroutes');
  } finally {
    isLoadingSTSubRoute.value = false;
  }
};

const openSTSubRouteModal = async (item = null) => {
  if (item) {
    currentSTSubRoute.value = { ...item };
  } else {
    currentSTSubRoute.value = {
      id: null,
      schedule_timetable_id: "",
      sub_route_id: "",
      is_online_allowed: 1,
      fare: "",
      commission: "",
      seat_limit: ""
    };
  }
  await openModalSafely('stSubRouteModal', stSubRouteModal);
};

const saveSTSubRoute = async () => {
  try {
    let params = {
      schedule_timetable_id: typeof currentSTSubRoute.value.schedule_timetable_id === 'object'
        ? currentSTSubRoute.value.schedule_timetable_id.id
        : currentSTSubRoute.value.schedule_timetable_id,
      sub_route_id: typeof currentSTSubRoute.value.sub_route_id === 'object'
        ? currentSTSubRoute.value.sub_route_id.id
        : currentSTSubRoute.value.sub_route_id,
      is_online_allowed: currentSTSubRoute.value.is_online_allowed,
      fare: currentSTSubRoute.value.fare,
      commission: currentSTSubRoute.value.commission,
      seat_limit: currentSTSubRoute.value.seat_limit
    };
    let response;
    if (currentSTSubRoute.value.id) {
      response = await axiosInstance.put(`schedule-timetable-sub-routes/${currentSTSubRoute.value.id}`, params);
    } else {
      response = await axiosInstance.post('schedule-timetable-sub-routes', params);
    }
    if (response.data.status === "success") {
      showAlert('success', 'Timetable SubRoute saved successfully');
      stSubRouteModal.value.hide();
      await fetchSTSubRouteList();
    }
  } catch (error) {
    showAlert('error', 'Failed to save timetable subroute');
  }
};

const deleteSTSubRoute = async (id) => {
  if (!confirm('Are you sure you want to delete this timetable subroute?')) return;
  try {
    await axiosInstance.delete(`schedule-timetable-sub-routes/${id}`);
    showAlert('success', 'Timetable SubRoute deleted successfully');
    await fetchSTSubRouteList();
  } catch (error) {
    showAlert('error', 'Failed to delete timetable subroute');
  }
};

const stSubRouteAction = () => {
  fetchSTSubRouteList();
  fetchScheduleTimetable();
  fetchSubRoutesList();
};

watch(activeTab, (tab) => {
  if (tab === 'routes') routeAction();
  else if (tab === 'citylink') cityLinkAction();
  else if (tab === 'stops') stopsActions();
});

onMounted(async () => {
  if (activeTab.value === 'routes') routeAction();
  else if (activeTab.value === 'citylink') cityLinkAction();
  else if (activeTab.value === 'stops') stopsActions();
});

</script>

<style scoped>
/* Back Button Styling */
.back-btn {
  background-color: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  font-weight: 500 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover {
  background-color: #dee2e6 !important;
  border-color: #adb5bd !important;
  color: #343a40 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
}

.back-btn:focus {
  background-color: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  box-shadow: 0 0 0 0.2rem rgba(233, 236, 239, 0.5) !important;
}

.back-btn i {
  font-weight: 600 !important;
}

/* Code input styling - uppercase formatting */
input[type="text"] {
  text-transform: uppercase;
}

/* Fix outer layout (col-md-12 container) */
:deep(.col-md-12) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

/* Optional: Limit width of search input */
:deep(.VueTables__search__input.form-control) {
  max-width: 200px;
  font-size: 14px;
  padding: 6px 10px;
  margin-bottom: 1em;
}

/* Optional: Limit width of select dropdown */
:deep(.VueTables__limit select) {
  max-width: 120px;
  font-size: 14px;
  padding: 5px 10px;
}

/* Navigation Tabs Styling - optimized for single row */
.tabs-card {
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  overflow: hidden;
}

.tabs-card .nav-tabs {
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 0;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
  white-space: nowrap;
}

.tabs-card .nav-tabs .nav-item {
  flex: 1;
  min-width: 0;
}

.tabs-card .nav-tabs .nav-link {
  border: none;
  color: #6c757d;
  padding: 0.75rem 0.5rem;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  border-radius: 0;
  position: relative;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: auto;
  line-height: 1.2;
}

.tabs-card .nav-tabs .nav-link i {
  font-size: 0.8rem;
  margin-right: 0.25rem;
}

.tabs-card .nav-tabs .nav-link:hover {
  color: #0f5132;
  background-color: #f8f9fa;
}

.tabs-card .nav-tabs .nav-link.active {
  background: #e7f5ef;
  color: #0f5132;
  border-bottom: 3px solid #0f5132;
  font-weight: 600;
  position: relative;
}

.tabs-card .nav-tabs .nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: #0f5132;
  border-radius: 2px 2px 0 0;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 1200px) {
  .tabs-card .nav-tabs .nav-link {
    padding: 0.6rem 0.4rem;
    font-size: 0.8rem;
  }

  .tabs-card .nav-tabs .nav-link i {
    font-size: 0.75rem;
    margin-right: 0.2rem;
  }
}

@media (max-width: 992px) {
  .tabs-card .nav-tabs .nav-link {
    padding: 0.5rem 0.3rem;
    font-size: 0.75rem;
  }

  .tabs-card .nav-tabs .nav-link i {
    font-size: 0.7rem;
    margin-right: 0.15rem;
  }
}

/* City Links Form Scrolling */
.city-links-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.city-links-container::-webkit-scrollbar {
  width: 8px;
}

.city-links-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.city-links-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.city-links-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Routes Form Scrolling */
.routes-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.routes-container::-webkit-scrollbar {
  width: 8px;
}

.routes-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.routes-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.routes-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* SubRoutes Form Scrolling */
.subroutes-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.subroutes-container::-webkit-scrollbar {
  width: 8px;
}

.subroutes-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.subroutes-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.subroutes-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* STP Form Scrolling */
.stp-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.stp-container::-webkit-scrollbar {
  width: 8px;
}

.stp-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.stp-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.stp-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Stops Form Scrolling */
.stops-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.stops-container::-webkit-scrollbar {
  width: 8px;
}

.stops-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.stops-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.stops-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Content panel styling - removed old panel styles */
.tab-content {
  padding: 0;
}

/* Ensure data tables match tabs width */
.card .card-body {
  padding: 1.5rem;
}

/* Ensure data table container matches tabs width */
.row.gx-4.mt-3 .col-lg-12 .card {
  width: 100%;
  margin: 0;
}

/* Ensure data table takes full width of its container */
.custom-table {
  width: 100%;
  overflow-x: auto;
}

/* Make sure the table itself takes full width */
.custom-table .VueTables {
  width: 100%;
}

/* Ensure table wrapper matches tabs width */
.custom-table .VueTables__wrapper {
  width: 100%;
}

/* Remove old panel styling */
.panel {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Ensure consistent spacing between tabs and content */
.tab-content .card {
  margin-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* Make sure the table container has the same border radius as tabs */
.tab-content .card .card-body {
  border-radius: 0 0 0.375rem 0.375rem;
}

/* Fix dropdown visibility */
.modal .multiselect__content-wrapper {
  position: absolute !important;
  z-index: 2050 !important;
}
.modal .modal-body {
  overflow: visible !important;
}

/* Fix footer stickiness */
.modal-body {
  max-height: 60vh;
  overflow-y: auto;
}
.modal-footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  z-index: 2000;
  border-top: 1px solid #dee2e6;
}

</style>