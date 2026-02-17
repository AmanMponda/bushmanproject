<template>
  <div class="vehicle-profile-page">
    <!-- Breadcrumb removed: parent view (`FleetMaster`) provides breadcrumbs to avoid duplication -->

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <!-- HEADER -->
          <div class="card-header d-flex align-items-center bg-light fw-400">
            <div class="d-flex align-items-center">
              <div class="vehicle-icon me-2">
                <i :class="[vehicleIconClass, 'fa-3x text-primary']"></i>
              </div>
              <div>
                <h4 class="mb-0">
                  {{ vehicleUuid ? (vehicle.registration_number || (vehicle.name ? vehicle.name.toUpperCase() : "Loading...")) : "Select a Vehicle" }}
                </h4>
                <small class="text-muted">
                </small>
              </div>
            </div>

            <div class="ms-auto d-flex align-items-center gap-2">

              
              <button @click="refreshData" class="btn btn-outline-secondary" :disabled="loading || !vehicleUuid">
                <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>
                Refresh
              </button>

              <button @click="openDocumentsModal" class="btn btn-outline-primary" :disabled="!vehicleUuid">
                <i class="fa fa-folder-plus me-1"></i>
                Documents
              </button>

              <!-- v-if="permissions.includes('CAN_EDIT_FLEET_VEHICLE')" commented out to show Edit button for testing -->
              <button @click="editVehicleDetails" class="btn btn-outline-primary btn-sm" :disabled="!vehicleUuid">
                <i class="fa fa-edit me-1"></i> Edit
              </button>


              <button v-if="permissions.includes('CAN_ADD_FLEET_VEHICLE')" class="btn btn-success btn-sm"
                :disabled="!vehicleUuid">
                + Add
              </button>

            </div>
          </div>

          <!-- TABS -->
          <div class="card-header p-0 border-bottom">
            <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
              <li v-for="tab in tabs.filter(t => permissions.includes(t.permission))" :key="tab.key"
                class="nav-item flex-fill text-center">
                <a :href="'#' + tab.key" class="nav-link" :class="{ active: activeTab === tab.key }"
                  @click="onTabClick(tab)" data-bs-toggle="tab">
                  <i :class="tab.icon"></i> {{ tab.label }}
                </a>
              </li>

            </ul>

          </div>

          <!-- TAB CONTENT -->
          <div class="tab-content p-4">
            <div class="tab-pane fade show active" id="overview">
              <div class="row">
                <!-- Left Column (Details) -->
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header">Vehicle Details</div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6" v-for="spec in vehicleSpecs" :key="spec.key">
                          <div class="d-flex mb-3 border-bottom pb-2">
                            <i :class="spec.icon + ' text-primary me-2 mt-1'"></i>
                            <div>
                              <div class="text-muted small">{{ spec.label }}</div>
                              <div class="fw-semibold">
                                <div v-if="vehicle[spec.key]">
                                  {{ vehicle[spec.key] }}
                                </div>
                                <div v-else>
                                  <div class="spinner-border spinner-border-sm text-info">
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Special Row: Seat Map -->
                      <div class="row mt-3">
                        <div class="col-md-12">
                          <div class="d-flex mb-3 border-bottom pb-2">
                            <i class="fa fa-th-large text-primary me-2 mt-1"></i>
                            <div>
                              <div class="text-muted small">Seat Map Assigned</div>

                              <div v-if="vehicle.seatMapId">
                                <router-link :to="permissions.includes('CAN_EDIT_SEAT_MAP')
                                  ? `/abs/seat-management/details/${vehicle.seatMapId}`
                                  : '#'" class="fw-semibold text-decoration-none">
                                  {{ vehicle.seatMap || "View Seat Map" }}
                                </router-link>
                              </div>

                              <div v-else class="fw-semibold">Not Assigned</div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header d-flex justify-content-between">
                      <span> <i :class="[vehicleIconClass, 'me-2']"></i>Seat Layout </span>
                      <!-- <button v-if="!editMode" class="btn btn-outline-dark" @click="editMode = true">
                                     <i class="fas fa-setting"></i>Edit Mode</button> -->

                      <div v-if="editMode" class="d-flex gap-2">
                        <div v-if="active_inactive" class="d-flex gap-2">
                          <button class="btn" :class="seat_mode === 'active' && seat_mode !== null
                            ? 'btn-light'
                            : 'btn-outline-light'
                            " @click="seatActivation(1)">
                            <span class="text-success">Activate</span>
                          </button>
                          <button class="btn" :class="seat_mode === 'active' && seat_mode !== null
                            ? 'btn-light'
                            : 'btn-outline-light'
                            " @click="seatActivation(0)">
                            <span class="text-danger">Diactivate</span>
                          </button>
                        </div>
                        <button class="btn" :class="seat_mode === 'active' && seat_mode !== null
                          ? 'btn-light'
                          : 'btn-outline-light'
                          " @click="
                                                      seat_mode !== 'active' &&
                                                        seat_mode !== 'inactive' &&
                                                        seat_mode == null
                                                        ? (seat_mode = 'active')
                                                        : (seat_mode = null);
                                                    active_inactive = !active_inactive;
                                                    ">
                          <span v-if="!active_inactive">
                            <span class="text-success"> Activate</span>/<span class="text-danger">Diactivate</span>
                          </span>
                          <span v-if="active_inactive"> Back </span>
                        </button>
                        <div></div>
                        <button v-if="seat_mode == null" class="btn btn-outline-info" @click="submit">
                          Submit Changes
                        </button>
                      </div>
                    </div>
                    <div class="card-body">
                      <div v-if="loading_spinner" class="d-flex justify-content-center align-items-center text-info"
                        style="height: 150px">
                        <div class="spinner-border text-primary" role="status"></div>
                      </div>
                      <div v-else class="seat-map-container">
                        <!-- Passenger Seats -->
                        <div class="row">
                          <div v-if="currentseatMapData.length !== 0" :class="hasConflict ? 'col-6' : 'col-12'">
                            <div class="card item-align-center">
                              <div class="seat-map p-1">
                                <div :class="hasConflict
                                  ? 'd-flex justify-content-between'
                                  : 'd-flex justify-content-end'
                                  ">
                                  <p v-if="hasConflict">Normal Seat Map</p>

                                  <span v-if="active_inactive" class="me-4">
                                    <input type="checkbox" id="selectAll" v-model="selectAll" @change="toggleSelectAll"
                                      style="
                                    width: 20px;
                                    height: 20px;
                                    accent-color: blue;
                                  " />
                                    <label for="selectAll" class="ms-1">Select
                                      All</label>
                                  </span>
                                </div>
                                <div v-for="(row, rowIndex) in currentseatMapData" :key="rowIndex"
                                  class="seat-row d-flex justify-content-center mb-1"
                                  @mouseenter="hoveredRow = rowIndex" @mouseleave="hoveredRow = null">
                                  <!-- Edit Mode -->
                                  <div v-if="seat_mode !== null" v-for="(item, colIndex) in row" :key="colIndex"
                                    v-show="item.status == 1"
                                    class="seat mx-1 d-flex align-items-center justify-content-center">
                                    <div v-if="
                                      ![
                                        'SPACE',
                                        'TOILET',
                                        'TOI',
                                        'OR',
                                        'DO',
                                        'LET',
                                        ' ',
                                      ].includes(item.label)
                                    " class="row">
                                      <span v-if="
                                        ![
                                          'SPACE',
                                          'TOILET',
                                          'TOI',
                                          'OR',
                                          'DO',
                                          'LET',
                                          'STAFF',
                                          ' ',
                                        ].includes(item.label)
                                      " class="seat-label small" :class="item.status == 1
                                                                              ? 'text-success'
                                                                              : 'text-danger'
                                                                              ">{{ item.label }}</span>
                                      <i v-else-if="
                                        ['TOILET', 'TOI'].includes(item.label)
                                      "
                                        class="fas fa-toilet text-info small"></i>
                                      <i v-else-if="
                                        ['DO', 'DOOR'].includes(item.label)
                                      "
                                        class="fas fa-door-open text-warning small"></i>
                                      <input type="checkbox" style="width: 24px; height: 24px" :style="{
                                        accentColor:
                                          item.status == 1 ? 'green' : 'red',
                                      }" v-model="editedSeats"
                                        :value="item.id" />
                                    </div>
                                  </div>

                                  <!-- View Mode -->

                                  <!-- Row Buttons -->
                                  <div v-if="editMode" class="me-2 d-flex flex-column">
                                    <button v-show="hoveredRow === rowIndex" class="btn btn-sm btn-success mb-1"
                                      @click="addRow(rowIndex)">
                                      +
                                    </button>
                                    <button v-show="hoveredRow === rowIndex" class="btn btn-sm btn-danger"
                                      @click="deleteRow(rowIndex)">
                                      -
                                    </button>
                                  </div>

                                  <div v-if="!editMode || seat_mode == null" v-for="(item, colIndex) in row"
                                    :key="colIndex" @click="editMode ? showSeatData(item) : null"
                                    class="seat mx-1 d-flex align-items-center justify-content-center" :class="{
                                      'seat-available': ![
                                        'SPACE',
                                        'TOILET',
                                        'TOI',
                                        'OR',
                                        'DO',
                                        'LET',
                                        'STAFF',
                                        ' ',
                                      ].includes(item.label),
                                      'seat-toilet': ['TOILET', 'TOI'].includes(
                                        item.label
                                      ),
                                      'seat-door': ['DO', 'DOOR'].includes(
                                        item.label
                                      ),
                                      'seat-cabinet': ['CABINET'].includes(
                                        item.label
                                      ),
                                      'seat-fridge': ['FRIDGE'].includes(
                                        item.label
                                      ),
                                      'seat-aisle':
                                        ([3].includes(item.X) &&
                                          item.label === ' ') ||
                                        ['OR', 'LET', ''].includes(item.label),
                                    }">
                                    <span v-if="
                                      ![
                                        'SPACE',
                                        'CABINET',
                                        'FRIDGE',
                                        'DOOR',
                                        'TOILET',
                                        'TOI',
                                        'OR',
                                        'DO',
                                        'LET',
                                        'STAFF',
                                        ' ',
                                      ].includes(item.label)
                                    " class="seat-label small">{{ item.label
                                                                        }}</span>
                                    <i v-else-if="
                                      ['TOILET', 'TOI'].includes(item.label)
                                    " class="fas fa-toilet text-info small"></i>
                                    <i v-else-if="
                                      ['DO', 'DOOR'].includes(item.label)
                                    "
                                      class="fas fa-door-open text-warning small"></i>
                                    <i v-else-if="['FRIDGE'].includes(item.label)"
                                      class="fas fa-snowflake text-info small"></i>
                                    <i v-else-if="['CABINET'].includes(item.label)"
                                      class="fas fa-archive text-info small"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div v-if="conflictGrid.length !== 0" :class="hasConflict ? 'col-6' : 'col- d-none'">
                            <div class="card h-100">
                              <div class="seat-map p-1">
                                <!-- Conflict Seat Map -->
                                <div class="d-flex justify-content-between">
                                  <p>Conflict / Duplicate Seats</p>
                                  <span class="me-4">
                                    <input v-if="active_inactive" type="checkbox" id="selectAllConficts"
                                      v-model="selectAllConficts" @change="toggleSelectAllConfict" style="
                                    width: 20px;
                                    height: 20px;
                                    accent-color: blue;
                                  " />
                                  </span>
                                </div>

                                <!-- <div v-for="(row, rowIndex) in conflictGrid" :key="'conflict-' + rowIndex"
                              class="seat-row d-flex justify-content-center mb-1">
                              <div v-for="(item, colIndex) in row" :key="'conflict-' + colIndex"
                                @click="showSeatData(item)"
                                class="seat mx-1 d-flex align-items-center justify-content-center " :class="{
                                  'seat-conflict': item.isConflict,
                                  'seat-available': !item.isConflict && !['SPACE', 'TOILET', 'TOI', 'OR', 'DO', 'LET', 'STAFF', ' '].includes(item.label),
                                  'seat-toilet': isBus && ['TOILET', 'TOI'].includes(item.label),
                                  'seat-door': isBus && ['DO', 'DOOR'].includes(item.label),
                                  'seat-aisle': ([3].includes(item.X) && item.label === ' ') || ['OR', 'LET', ''].includes(item.label)
                                }">

                                <span v-if="!['SPACE', 'TOILET', 'TOI', 'OR', 'DO', 'LET', 'STAFF', ' '].includes(item.label)"
                                  class="seat-label small">{{ item.label }}</span>
                                <i v-else-if="isBus && ['TOILET', 'TOI'].includes(item.label)"
                                  class="fas fa-toilet text-info small"></i>
                                <i v-else-if="isBus && ['DO', 'DOOR'].includes(item.label)"
                                  class="fas fa-door-open text-warning small"></i>
                                  
                              </div>
                            </div> -->

                                <div v-for="(row, rowIndex) in conflictGrid" :key="'conflict-' + rowIndex"
                                  class="seat-row d-flex justify-content-center mb-1">
                                  <!-- Edit Mode -->
                                  <div v-if="seat_mode !== null" v-for="(item, colIndex) in row"
                                    :key="'conflict-' + colIndex" v-show="item.status == 1"
                                    class="seat mx-1 d-flex align-items-center justify-content-center">
                                    <div v-if="
                                      ![
                                        'SPACE',
                                        'TOILET',
                                        'TOI',
                                        'OR',
                                        'DO',
                                        'LET',
                                        ' ',
                                      ].includes(item.label)
                                    " class="row">
                                      <span v-if="
                                        ![
                                          'SPACE',
                                          'TOILET',
                                          'TOI',
                                          'OR',
                                          'DO',
                                          'LET',
                                          ' ',
                                        ].includes(item.label)
                                      " class="seat-label small" :class="item.status == 1
                                                                              ? 'text-success'
                                                                              : 'text-danger'
                                                                              ">{{ item.label }}</span>
                                      <i v-else-if="
                                        ['TOILET', 'TOI'].includes(item.label)
                                      "
                                        class="fas fa-toilet text-info small"></i>
                                      <i v-else-if="
                                        ['DO', 'DOOR'].includes(item.label)
                                      "
                                        class="fas fa-door-open text-warning small"></i>
                                      <input type="checkbox" style="width: 24px; height: 24px" :style="{
                                        accentColor:
                                          item.status == 1 ? 'green' : 'red',
                                      }" v-model="editedConfictSeats"
                                        :value="item.id" />
                                    </div>
                                  </div>

                                  <!-- View Mode -->
                                  <div v-if="!editMode || seat_mode == null" v-for="(item, colIndex) in row"
                                    :key="'conflict-' + colIndex" @click="editMode ? showSeatData(item) : null"
                                    class="seat mx-1 d-flex align-items-center justify-content-center" :class="{
                                      'seat-conflict': item.isConflict,
                                      'seat-available':
                                        !item.isConflict &&
                                        ![
                                          'SPACE',
                                          'TOILET',
                                          'TOI',
                                          'OR',
                                          'DO',
                                          'LET',
                                          ' ',
                                        ].includes(item.label),
                                      'seat-toilet': ['TOILET', 'TOI'].includes(
                                        item.label
                                      ),
                                      'seat-door': ['DO', 'DOOR'].includes(
                                        item.label
                                      ),
                                      'seat-aisle':
                                        ([3].includes(item.X) &&
                                          item.label === ' ') ||
                                        ['OR', 'LET', ''].includes(item.label),
                                    }">
                                    <span v-if="
                                      ![
                                        'SPACE',
                                        'TOILET',
                                        'TOI',
                                        'OR',
                                        'DO',
                                        'LET',
                                        'STAFF',
                                        ' ',
                                      ].includes(item.label)
                                    " class="seat-label small">{{ item.label
                                                                        }}</span>
                                    <i v-else-if="
                                      ['TOILET', 'TOI'].includes(item.label)
                                    " class="fas fa-toilet text-info small"></i>
                                    <i v-else-if="
                                      ['DO', 'DOOR'].includes(item.label)
                                    "
                                      class="fas fa-door-open text-warning small"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Legend -->
                        <div class="seat-legend mt-3">
                          <div v-if="!active_inactive" class="legend-item">
                            <span class="legend-color available"></span>
                            <small>Available</small>
                          </div>
                          <div v-if="!active_inactive" class="d-flex flex-wrap gap-1 small">
                            <span v-if="isBus" class="badge bg-info py-1 px-2"><i class="fas fa-toilet me-1"></i>Toilet</span>
                            <span v-if="isBus" class="badge bg-warning py-1 px-2"><i class="fas fa-door-open me-1"></i>Door</span>
                          </div>
                          <div v-if="active_inactive" class="d-flex flex-wrap gap-1 small">
                            <span class="badge bg-success py-1 px-2">Currect Active
                              Seats</span>
                            <span class="badge bg-danger py-1 px-2">Currect Inactive
                              Seats</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right Column (Issues & Reminders) -->
                <!-- <div class="col-md-6">
                          
                            <div class="card mb-4">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <span>Open Issues</span>
                                    <button class="btn btn-sm btn-outline-primary">
                                        + Add Issue
                                    </button>
                                </div>
                                <div class="card-body">
                                    <p>Overdue: 0 | Open: {{ openIssues.length }}</p>
                                    <ul class="list-group">
                                        <li class="list-group-item" v-for="issue in openIssues" :key="issue.id">
                                            #{{ issue.id }} - {{ issue.title }}
                                            <p class="mb-1 small text-muted">
                                                {{ issue.description }}
                                            </p>
                                            <button class="btn btn-sm btn-outline-success">
                                                Resolve
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Service Reminders 
                            <div class="card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <span>Service Reminders</span>
                                    <button class="btn btn-sm btn-outline-primary">
                                        + Add Service Reminder
                                    </button>
                                </div>
                                <div class="card-body">
                                    <p>Overdue: 0 | Due Soon: {{ serviceReminders.length }}</p>
                                    <ul class="list-group">
                                        <li class="list-group-item" v-for="reminder in serviceReminders"
                                            :key="reminder.id">
                                            {{ reminder.title }} <br />
                                            <small class="text-muted">Due: {{ reminder.due }}</small>
                                            <button class="btn btn-sm btn-outline-success float-end">
                                                Resolve
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div> -->
              </div>

              <!-- Second Row: Documents Section (same structure as Seat Layout) -->
              <div class="row mt-4">
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header d-flex justify-content-between">
                      <span><i class="fa fa-folder-open text-primary me-2"></i>Vehicle Documents</span>
                      <button class="btn btn-sm btn-outline-primary" @click="openDocumentsModal" :disabled="!vehicleUuid">
                        <i class="fa fa-plus me-1"></i> Upload
                      </button>
                    </div>
                    <div class="card-body">
                      <div v-if="!props.vehicleDocuments || props.vehicleDocuments.length === 0" 
                        class="d-flex justify-content-center align-items-center text-muted" style="height: 150px">
                        <div class="text-center">
                          <i class="fa fa-file-alt fa-3x mb-2 text-secondary"></i>
                          <p class="mb-0 small">No documents uploaded</p>
                        </div>
                      </div>
                      <div v-else class="document-list-container" style="max-height: 300px; overflow-y: auto;">
                        <div class="row g-2">
                          <div v-for="doc in props.vehicleDocuments" :key="doc.id" class="col-6">
                            <div class="card document-card border p-2">
                              <div class="d-flex align-items-center">
                                <!-- Document Icon -->
                                <div class="document-icon me-2">
                                  <img v-if="props.previewMap && props.previewMap[doc.id] && isImageFile(doc)"
                                    :src="props.previewMap[doc.id]"
                                    class="rounded"
                                    style="width: 40px; height: 40px; object-fit: cover;"
                                    alt="Preview" />
                                  <i v-else-if="isPdfFile(doc)" class="fa fa-file-pdf fa-2x text-danger"></i>
                                  <i v-else class="fa fa-file fa-2x text-secondary"></i>
                                </div>
                                <!-- Document Info -->
                                <div class="flex-grow-1 overflow-hidden">
                                  <div class="document-name small fw-semibold text-truncate" :title="doc.name">
                                    {{ doc.name || 'Untitled' }}
                                  </div>
                                  <span v-if="doc.expiring_mode === 'DATE_RANGE'" class="badge small" :class="getExpiryBadgeClass(doc)">
                                    {{ getExpiryLabel(doc) }}
                                  </span>
                                  <span v-else class="badge bg-secondary bg-opacity-25 text-secondary small">No Expiry</span>
                                </div>
                                <!-- Actions -->
                                <div class="d-flex gap-1 ms-2">
                                  <button class="btn btn-sm btn-outline-primary py-0 px-1" @click.stop="viewDocument(doc)" title="View">
                                    <i class="fa fa-eye"></i>
                                  </button>
                                  <button class="btn btn-sm btn-outline-success py-0 px-1" @click.stop="downloadDocument(doc)" title="Download">
                                    <i class="fa fa-download"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <slot></slot>
            </div>

            <div class="tab-pane fade" id="specs">
              <div class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <!-- Image / Icon -->
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                <!-- Main Text -->
                <h2 class="fw-bold">Coming Soon</h2>

                <!-- Subtext -->
                <p class="text-muted">This section is still under progress.</p>
              </div>

            </div>
            <div class="tab-pane fade" id="route">
              <div class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <!-- Image / Icon -->
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                <!-- Main Text -->
                <h2 class="fw-bold">Coming Soon</h2>

                <!-- Subtext -->
                <p class="text-muted">This section is still under progress.</p>
              </div>

            </div>
            <div class="tab-pane fade" id="fuel">
              <div class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <!-- Image / Icon -->
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                <!-- Main Text -->
                <h2 class="fw-bold">Coming Soon</h2>

                <!-- Subtext -->
                <p class="text-muted">This section is still under progress.</p>
              </div>

            </div>
            <div class="tab-pane fade" id="service">
              <div class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <!-- Image / Icon -->
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                <!-- Main Text -->
                <h2 class="fw-bold">Coming Soon</h2>

                <!-- Subtext -->
                <p class="text-muted">This section is still under progress.</p>
              </div>

            </div>
            <div class="tab-pane fade" id="workorders">
              <div class="d-flex flex-column justify-content-center align-items-center text-center"
                style="height: 300px;">
                <!-- Image / Icon -->
                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                  style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                <!-- Main Text -->
                <h2 class="fw-bold">Coming Soon</h2>

                <!-- Subtext -->
                <p class="text-muted">This section is still under progress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="editModal" class="modal-backdrop show"></div>
  <div v-if="editModal" class="modal show d-block" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Cell</h5>
          <button type="button" class="btn-close" @click="editModal = false"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Type</label>
            <select class="form-select" v-model="cellData.type">
              <option v-for="type in seatType" :key="type.id" :value="type.name">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Label</label>
            <input type="text" class="form-control" v-model="cellData.label" :maxlength="currentMaxLength"
              @input="cellData.label = ($event.target as HTMLInputElement)?.value.toUpperCase()"
              :placeholder="`Max ${currentMaxLength} characters`" />
            <small class="text-muted">
              Maximum {{ currentMaxLength }} characters for {{ cellData.type }}
            </small>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="editModal = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="appplyChanges">
            Apply Changes
          </button>

          <button type="button" class="btn btn-danger" @click="seatActivation(cellData)">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- edit vehicle details  -->

  <div v-if="showModal" class="modal-backdrop show"></div>
  <div v-if="showModal" class="modal show d-block" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            Editing Form for vehicle {{ form.name ? form.name.toUpperCase().slice(0, 7) : "" }}
          </h5>
          <button type="button" class="btn-close" @click="closeModel()"></button>
        </div>
        <form @submit.prevent="updateVehicleDetails">
          <div class="modal-body">
            <div class="row">
              <div class="col-md-8">
                <div class="form-section">
                  <h6 class="section-title mb-3">Basic Information</h6>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Registration Number *</label>
                      <input v-model="form.name" type="text" class="form-control" required maxlength="7"
                        style="text-transform: uppercase" placeholder="e.g. T456DXJ"
                        @input="form.name = form.name.toUpperCase().slice(0, 7)" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Group</label>
                      <select v-model="form.group" class="form-select" :disabled="formDataLoading">
                        <option value="">Select Vehicle Group</option>
                        <option v-for="g in vehicleGroups" :key="g.id" :value="g.id">
                          {{ g.name }}
                        </option>
                      </select>
                      <small v-if="formDataLoading" class="form-text text-muted">
                        Loading vehicle groups...
                      </small>
                      <small v-else-if="currentGroupName" class="form-text text-success">
                      </small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">First Registration</label>
                      <input v-model="form.firstRegistration" type="date" class="form-control" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Manufacture Year</label>
                      <select v-model="form.manufactureYear" class="form-select">
                        <option v-for="y in years" :key="y" :value="y">
                          {{ y }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Color</label>
                      <input v-model="form.color" type="text" class="form-control" placeholder="Enter Color" readonly />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Size</label>
                      <select v-model="form.size" class="form-select" :disabled="formDataLoading">
                        <option value="">Select Size</option>
                        <option v-for="sz in sizeGroups" :key="sz.id" :value="sz.id">
                          {{ sz.size }}
                        </option>
                      </select>
                      <small v-if="formDataLoading" class="form-text text-muted">
                        Loading sizes...
                      </small>
                      <small v-else-if="currentSizeName" class="form-text text-success">
                      </small>
                    </div>
                  </div>
                </div>
                <hr class="my-4" />

                <div class="form-section">
                  <h6 class="section-title mb-3">Vehicle Details</h6>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Model</label>
                      <select v-model="form.model" class="form-select" :disabled="formDataLoading">
                        <option value="">Select Vehicle Model</option>
                        <option v-for="m in models" :key="m.id" :value="m.id">
                          {{ m.name }} - {{ m.make }}
                        </option>
                      </select>
                      <small v-if="formDataLoading" class="form-text text-muted">
                        Loading models...
                      </small>
                      <small v-else-if="currentModelName" class="form-text text-success">
                      </small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Make</label>
                      <input v-model="form.make" type="text" class="form-control" disabled />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Body Type</label>
                      <input v-model="form.bodyType" type="text" class="form-control" disabled />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Chassis Number</label>
                      <input v-model="form.chassisNumber" type="text" class="form-control" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-bold">Seat Map</label>
                      <select v-model="bus_seat_map" class="form-select" :disabled="formDataLoading"
                        @change="fetchSeatMap">
                        <option value="">Select Seat Map</option>
                        <option v-for="m in seatMapType" :key="m.id" :value="m.id">
                          {{ m.name }}
                          <span v-if="m.id === vehicle.seatMapId">(Current)</span>
                        </option>
                      </select>
                      <small v-if="currentSeatMapName" class="form-text text-success">
                      </small>
                      <small v-else-if="
                        !vehicle.seatMapId || vehicle.seatMapId === 'N/A'
                      " class="form-text text-warning">
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-4">
                <div v-if="loading_spinner" class="d-flex justify-content-center align-items-center card h-100"
                  style="height: 150px">
                  <div class="spinner-border text-primary" role="status"></div>
                  <span class="ms-2">Loading seat map...</span>
                </div>

                <div v-else-if="
                  !bus_seat_map &&
                  (!vehicle.seatMapId || vehicle.seatMapId === 'N/A')
                " class="card h-100">
                  <div class="card-header bg-light py-2">
                    <h6 class="card-title mb-0 small">
                      <i class="fas fa-map me-1"></i>Seat Map Preview
                    </h6>
                  </div>
                  <div class="card-body p-3 text-center">
                    <i :class="[vehicleIconClass, 'fa-2x text-muted mb-2']"></i>
                    <p class="text-muted small mb-0">
                      No seat map assigned to this vehicle
                    </p>
                    <small class="text-muted">Choose a seat map from the dropdown to see the
                      layout</small>
                  </div>
                </div>

                <div v-else-if="bus_seat_map && seatMapData.length === 0" class="card h-100">
                  <div class="card-header bg-light py-2">
                    <h6 class="card-title mb-0 small">
                      <i class="fas fa-map me-1"></i>Seat Map Preview -
                      {{ currentSeatMapName }}
                    </h6>
                  </div>
                  <div class="card-body p-3 text-center">
                    <i class="fas fa-exclamation-triangle text-warning fa-2x mb-2"></i>
                    <p class="text-muted small mb-0">
                      No seat layout data available
                    </p>
                    <small class="text-muted">This seat map template exists but has no layout
                      defined</small>
                  </div>
                </div>

                <div v-else-if="bus_seat_map && seatMapData.length > 0" class="card h-100">
                  <div class="card-header bg-light py-2">
                    <h6 class="card-title mb-0 small">
                      <i class="fas fa-map me-1"></i>Seat Map Preview -
                      {{ currentSeatMapName }}
                    </h6>
                  </div>
                  <div class="card-body p-2">
                    <div class="bus-layout-container">
                      <div class="seat-map p-1">
                        <div v-for="(row, rowIndex) in seatMapData" :key="rowIndex"
                          class="seat-row d-flex justify-content-center mb-1">
                          <div v-for="(item, colIndex) in row" :key="colIndex"
                            class="seat mx-1 d-flex align-items-center justify-content-center" :class="{
                              'seat-available': item.type === 'SEAT',
                              'seat-selected': selectedSeat?.id === item.id,
                              'seat-toilet': isBus && item.type === 'TOILET',
                              'seat-door': isBus && item.type === 'DOOR',
                              'seat-fridge': item.type === 'FRIDGE',
                              'seat-cabinet': item.type === 'CABINET',
                              'seat-aisle':
                                [2, 3].includes(item.position_x) &&
                                item.type === 'EMPTY',
                            }">
                            <span v-if="
                              item.type === 'SEAT' || item.type === 'STAFF'
                            " class="seat-label small">{{ item.label }}</span>
                            <i v-else-if="isBus && item.type === 'TOILET'" class="fas fa-toilet text-info small"></i>
                            <i v-else-if="isBus && item.type === 'DOOR'" class="fas fa-door-open text-warning small"></i>
                            <i v-else-if="item.type === 'FRIDGE'" class="fas fa-snowflake text-info small"></i>
                            <i v-else-if="item.type === 'CABINET'" class="fas fa-archive text-info small"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Compact Legend -->
                    <div class="mt-2">
                      <h6 class="text-muted mb-1 small">Legend:</h6>
                      <div class="d-flex flex-wrap gap-1 small">
                        <span class="badge bg-success py-1 px-2">Seat</span>
                        <span class="badge bg-info py-1 px-2">
                          <i class="fas fa-toilet me-1"></i>Toilet
                        </span>
                        <span class="badge bg-warning py-1 px-2">
                          <i class="fas fa-door-open me-1"></i>Door
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Show when vehicle has seat map but none selected in dropdown -->
                <div v-else-if="
                  vehicle.seatMapId &&
                  vehicle.seatMapId !== 'N/A' &&
                  !bus_seat_map
                " class="card h-100">
                  <div class="card-header bg-light py-2">
                    <h6 class="card-title mb-0 small">
                      <i class="fas fa-map me-1"></i>Seat Map Preview
                    </h6>
                  </div>
                  <div class="card-body p-3 text-center">
                    <i :class="[vehicleIconClass, 'fa-2x text-muted mb-2']"></i>
                    <p class="text-muted small mb-0">
                      Current seat map: {{ currentSeatMapName }}
                    </p>
                    <small class="text-muted">Select a different seat map from dropdown to
                      preview</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModel()" :disabled="submittingForm">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submittingForm">
              <span v-if="submittingForm">
                <i class="fa fa-spinner fa-spin"></i> Updating...
              </span>
              <span v-else>Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Documents Upload Modal (Bootstrap pattern) -->
  <div v-if="showDocsModal" class="modal-backdrop show"></div>
  <div v-if="showDocsModal" class="modal show d-block" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Upload Document</h5>
          <button type="button" class="btn-close" @click="closeDocumentsModal"></button>
        </div>
        <form @submit.prevent="submitDocument">
          <div class="modal-body">
            <div v-if="docError" class="alert alert-danger">{{ docError }}</div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Document Name</label>
                <input v-model="docName" type="text" class="form-control" placeholder="Enter document name" required />
              </div>

              <div class="col-md-6">
                <label class="form-label">Expiring Mode</label>
                <select v-model="expiringMode" class="form-select">
                  <option value="NEVER">NEVER</option>
                  <option value="DATE_RANGE">DATE RANGE</option>
                </select>
              </div>

              <div v-if="expiringMode === 'DATE_RANGE'" class="col-md-6">
                <label class="form-label">Start Date</label>
                <input v-model="expStart" type="date" class="form-control" />
              </div>

              <div v-if="expiringMode === 'DATE_RANGE'" class="col-md-6">
                <label class="form-label">End Date</label>
                <input v-model="expEnd" type="date" class="form-control" />
              </div>

              <div class="col-12">
                <label class="form-label">File (PDF or Image)</label>
                <input type="file" @change="onDocFileChange" accept=".pdf,image/*" class="form-control" required />
                <small class="text-muted">Max size 2 MB</small>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDocumentsModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="uploadingDoc">
              <i class="fa fa-upload me-1" v-if="!uploadingDoc"></i>
              <i class="fa fa-spinner fa-spin me-1" v-else></i>
              {{ uploadingDoc ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type { VehicleAsset } from '@/services/vehicleAssetService'
import { useDocumentsStore } from '@/stores/bushman/documents-store'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore();
const permissions = authStore.permissions;
const route = useRoute();
const router = useRouter();

// Props - receive data from parent
const props = defineProps < {
  vehicleDetails: VehicleAsset | null
  vehicleDocuments: any[]
  uploading: boolean
  loading: boolean
  previewMap: Record < number | string, string>
  seatMapData ?: any[]
seatMapTypes ?: any[]
vehicleGroups ?: any[]
sizeGroups ?: any[]
models ?: any[]
formDataLoading ?: boolean
}> ()

// Emits - send events to parent
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'refresh'): void
  (e: 'edit'): void
  (e: 'add'): void
  (e: 'refresh-documents', id: number): void
  (e: 'file-change', event: Event): void
  (e: 'upload-document'): void
  (e: 'view-document', doc: any): void
  (e: 'open-image-preview', doc: any): void
  (e: 'open-documents'): void
  (e: 'openSeatMap'): void
  (e: 'downloadDocument', id: number): void
  (e: 'fetch-seat-map', seatMapId?: string | number): void
  (e: 'update-vehicle', data: any): void
  (e: 'fetch-form-data'): void
  (e: 'update-seat-map', params: any): void
}>()

// Local state
const activeTab = ref("overview");
const vehicleUuid = route.params.id;
const showModal = ref(false);
const editModal = ref(false);
const selectedSeat = ref<any>(null);
const currentCell = ref(null);
const bus_seat_map = ref(null);

// Computed properties from props
const vehicle = computed(() => {
  if (!props.vehicleDetails) return {
    name: "",
    year: "",
    costCenter: "",
    make: "",
    model: "",
    bodyType: "",
    chassisNumber: "",
    engineNumber: "",
    engineCapacity: "",
    fuelType: "",
    axleCount: "",
    axleDistance: "",
    tearWeight: "",
    grossWeight: "",
    tankCapacity: "",
    seatCapacity: "",
    length: "",
    width: "",
    height: "",
    type: "",
    vin: "",
    seatMap: "",
    seatMapId: "",
    firstRegistrationDate: "",
    color: "",
  } as Record<string, any>

  const v = props.vehicleDetails
  const mv = v.motor_vehicle
  return {
    name: mv?.registration_number || v.name || "N/A",
    year: mv?.manufacture_year || "N/A",
    costCenter: "N/A", // Map from your data if available
    make: mv?.vehicle_model?.make || v.make || "N/A",
    model: mv?.vehicle_model?.model || v.model || "N/A",
    bodyType: mv?.vehicle_model?.body_type || "N/A",
    chassisNumber: mv?.chassis_number || v.chassis_number || "N/A",
    engineNumber: mv?.engine_number || "N/A",
    engineCapacity: mv?.engine_capacity_cc ? `${mv.engine_capacity_cc} cc` : "N/A",
    fuelType: mv?.fuel_used?.name || "N/A",
    axleCount: mv?.axle_count ? `${mv.axle_count} Axles` : "N/A",
    axleDistance: "N/A", // Map from your data if available
    tearWeight: mv?.tare_weight ? `${mv.tare_weight} kg` : "N/A",
    grossWeight: mv?.gross_weight ? `${mv.gross_weight} kg` : "N/A",
    tankCapacity: mv?.tank_capacity_liters ? `${mv.tank_capacity_liters} L` : "N/A",
    seatCapacity: "N/A", // Map from your data if available
    length: "N/A",
    width: "N/A",
    height: "N/A",
    type: mv?.vehicle_model?.body_type || "N/A",
    vin: mv?.chassis_number || v.chassis_number || "N/A",
    seatMap: "N/A",
    seatMapId: null,
    firstRegistrationDate: v.registration_date || "N/A",
    color: mv?.color || "N/A",
  } as Record<string, any>
})

const vehicleSpecs = computed(() => [
  { label: "Make", key: "make", icon: "fa fa-industry" },
  { label: "Model", key: "model", icon: "fa fa-car" },
  { label: "Year", key: "year", icon: "fa fa-calendar" },
  { label: "Body Type", key: "bodyType", icon: "fa fa-car" },
  { label: "Fuel Type", key: "fuelType", icon: "fa fa-gas-pump" },
  { label: "Chassis Number", key: "chassisNumber", icon: "fa fa-hashtag" },
  { label: "Cost Center", key: "costCenter", icon: "fa fa-building" },
])

// Dynamically choose an icon based on the vehicle body/type (supports bus, truck, motorcycle, van, car)
const vehicleIconClass = computed(() => {
  const t = (String(vehicle.value.type || vehicle.value.bodyType || '')).toLowerCase()
  if (!t) return 'fa fa-car'
  if (t.includes('bus')) return 'fa fa-bus'
  if (t.includes('truck') || t.includes('lorry')) return 'fa fa-truck'
  if (t.includes('motor') || t.includes('motorcycle') || t.includes('motorbike') || t.includes('bike')) return 'fa fa-motorcycle'
  if (t.includes('van')) return 'fa fa-truck' // fallback to truck icon for van
  return 'fa fa-car'
})

// Helpful predicate: true when the underlying vehicle is a bus (used to hide bus-only UI for cars)
const isBus = computed(() => {
  const t = (String(vehicle.value.type || vehicle.value.bodyType || '')).toLowerCase()
  return t.includes('bus')
})

const formDataLoading = computed(() => props.formDataLoading || false)
const seatMapType = computed(() => props.seatMapTypes || [])

const currentMaxLength = computed(() => {
  const type = cellData.value.type
  if (type === 'SEAT') return 3
  if (type === 'DOOR') return 4
  if (type === 'DRIVER') return 6
  if (type === 'SPACE') return 5
  return 10
})


// Tabs configuration - using CAN_VIEW_FLEET for all tabs to ensure visibility
const tabs = ref([
  {
    key: "overview",
    label: "Overview",
    icon: "fa fa-home",
    permission: "CAN_VIEW_FLEET",
  },
  {
    key: "specs",
    label: "Specifications",
    icon: "fa fa-cogs",
    permission: "CAN_VIEW_FLEET",
    action: () => emit('fetch-seat-map'),
  },
  {
    key: "route",
    label: "Route",
    icon: "fa fa-route",
    permission: "CAN_VIEW_FLEET",
  },
  {
    key: "fuel",
    label: "Fuel",
    icon: "fa fa-gas-pump",
    permission: "CAN_VIEW_FLEET",
  },
  {
    key: "service",
    label: "Service History",
    icon: "fa fa-wrench",
    permission: "CAN_VIEW_FLEET",
  },
  {
    key: "workorders",
    label: "Work Orders",
    icon: "fa fa-tasks",
    permission: "CAN_VIEW_FLEET",
  },
]);

// Methods - emit events instead of direct API calls
const refreshData = () => {
  emit('refresh')
}

const editVehicleDetails = () => {
  emit('edit')
  emit('fetch-form-data')
}

const onTabClick = (tab: any) => {
  activeTab.value = tab.key
  if (tab.action) {
    tab.action()
  }
}

const fetchSeatMap = () => {
  if (bus_seat_map.value) {
    emit('fetch-seat-map', bus_seat_map.value)
  }
}

const closeModel = () => {
  showModal.value = false
}

const updateVehicleDetails = (formData: any) => {
  emit('update-vehicle', formData)
  showModal.value = false
}

// Seat map editing functions
const showSeatData = (data: any) => {
  currentCell.value = data
  cellData.value = {
    id: data.id,
    type: data.type,
    label: data.label,
    position_x: data.X,
    position_y: data.Y,
    status: data.status,
  }
  editModal.value = true
}

const seatActivation = (data: any) => {
  // Toggle seat active/inactive status
  if (typeof data === 'number') {
    // Called with status number (0 or 1)
    seat_mode.value = data === 1 ? 'active' : 'inactive'
  } else if (data.id) {
    // Called with cell data - toggle status
    const seat = currentseatMapData.value
      .flat()
      .find((s: any) => s.id === data.id)
    if (seat) {
      seat.status = seat.status === 1 ? 0 : 1
    }
  }
}

const appplyChanges = () => {
  const cell: any = currentCell.value
  if (!cell) return
  
  cell.type = cellData.value.type
  cell.label = cellData.value.label

  const isPresent = updatedSeats.value.filter((d: any) => d.id === cell.id)

  if (isPresent.length > 0) {
    updatedSeats.value = updatedSeats.value.map((d: any) =>
      d.id === cell.id
        ? {
            id: cell.id,
            type: cellData.value.type,
            label: cellData.value.label,
            position_x: cellData.value.position_x,
            position_y: cellData.value.position_y,
          }
        : d
    )
  } else {
    updatedSeats.value.push({
      id: cell.id,
      type: cellData.value.type,
      label: cellData.value.label,
      position_x: cellData.value.position_x,
      position_y: cellData.value.position_y,
    })
  }

  editModal.value = false
}

const submit = async () => {
  loading_spinner.value = true
  try {
    const layouts = currentseatMapData.value
      .flat()
      .filter((d: any) => !["SPACE"].includes(d.label))
      .map((cell: any) => ({
        id: cell.id,
        label: cell.label,
        type: cell.type,
        position_x: cell.X,
        position_y: cell.Y,
      }))

    const params = {
      bus: bus_details.value?.id,
      seats: layouts,
    }
    
    // Emit to parent to handle the actual update
    emit('update-seat-map', params)
  } catch (error) {
    console.error(error)
  } finally {
    loading_spinner.value = false
  }
}

// Use emits instead of direct API calls - data comes from parent
// Seat map editing state
const editedSeats = ref<any[]>([])
const currentseatMapData = ref<any[]>([])
const conflictGrid = ref<any[]>([])
const selectAll = ref(false); // state of "select all"
const selectAllConficts = ref(false);
const editedConfictSeats = ref<any[]>([]);
const editMode = ref(false)
const active_inactive = ref(false)
const seat_mode = ref<string | null>(null)
const hoveredRow = ref<number | null>(null)
const cellData = ref({
  id: "",
  label: "",
  type: "",
  position_x: "",
  position_y: "",
  status: "",
})
const updatedSeats = ref<any[]>([])
const bus_details = ref<any>(null)
const loading_spinner = ref(false)
const hasConflict = computed(() => conflictGrid.value.length > 0)
const seatType = ref<any[]>([])
const form = ref({
  name: "",
  code: "",
  group: "",
  firstRegistration: "",
  manufactureYear: "",
  color: "",
  ownership: "",
  chassisNumber: "",
  model: "",
  engineNumber: "",
  engineCapacity: "",
  seatCapacity: "",
  tankCapacity: "",
  axleCount: "",
  axleDistance: "",
  tearWeight: "",
  grossWeight: "",
  make: "",
  bodyType: "",
  width: "",
  height: "",
  size: "",
  description: "",
})
const years = ref<number[]>([])
const submittingForm = ref(false)
const currentGroupName = ref("")
const currentSizeName = ref("")
const currentModelName = ref("")
const currentSeatMapName = ref("")
const seatMapData = computed(() => props.seatMapData || [])

// Initialize years array
const currentYear = new Date().getFullYear()
for (let y = currentYear; y >= 1980; y--) years.value.push(y)

watch(editedSeats, (newVal) => {
  const allSeatIds = currentseatMapData.value
    .flat()
    .filter((seat) => seat.status === 1 && seat.id)
    .map((seat) => seat.id);

  // If all selected → mark "selectAll"
  // If not → uncheck "selectAll"
  selectAll.value = newVal.length === allSeatIds.length;
});

function toggleSelectAll() {
  if (selectAll.value) {
    // Add all active seat IDs
    editedSeats.value = currentseatMapData.value
      .flat()
      .filter((seat) => seat.status === 1 && seat.id)
      .map((seat) => seat.id);
  } else {
    // Clear all
    editedSeats.value = [];
  }
}

// Watch for manual seat checkbox changes
watch(editedConfictSeats, (newVal) => {
  const allSeatIds = conflictGrid.value
    .flat()
    .filter((seat) => seat.status === 1 && seat.id)
    .map((seat) => seat.id);

  // If all selected → mark "selectAll"
  // If not → uncheck "selectAll"
  selectAllConficts.value = newVal.length === allSeatIds.length;
});

function toggleSelectAllConfict() {
  if (selectAllConficts.value) {
    // Add all active seat IDs
    editedConfictSeats.value = conflictGrid.value
      .flat()
      .filter((seat) => seat.status === 1 && seat.id)
      .map((seat) => seat.id);
  } else {
    // Clear all
    editedConfictSeats.value = [];
  }
}

function addRow(insertRowIndex: number) {
  const numCols = currentseatMapData.value[0].length; // assume all rows same length
  const newRow = [];

  for (let col = 0; col < numCols; col++) {
    newRow.push({
      id: "",
      label: "SPACE",
      type: "",
      X: col + 1,
      Y: insertRowIndex + 1,
    });
  }
  // console.log("this row index", insertRowIndex);

  // Insert the row at the chosen index
  currentseatMapData.value.splice(insertRowIndex, 0, newRow);

  // console.log("before", currentseatMapData.value);

  // Update position_y for all rows
  currentseatMapData.value.forEach((row: any, rowIndex: number) => {
    row.forEach((seat: any) => {
      seat.Y = rowIndex + 1;
    });
  });

  // console.log("after", currentseatMapData.value);
}

function deleteRow(rowIndex: number) {
  if (currentseatMapData.value.length <= 1) return; // Prevent deleting last row
  currentseatMapData.value.splice(rowIndex, 1);

  // Update position_y for remaining rows
  currentseatMapData.value.forEach((row: any, i: number) => {
    row.forEach((seat: any) => (seat.Y = i + 1));
  });
}

// Removed old API code - now using props/emits pattern from parent component

// Documents modal state and helpers (local upload UI)
const documentsStore = useDocumentsStore()
const toast = useToast()

const showDocsModal = ref(false)
const docName = ref('')
const expiringMode = ref<'NEVER' | 'DATE_RANGE'>('NEVER')
const expStart = ref('')
const expEnd = ref('')
const docFile = ref<File | null>(null)
const uploadingDoc = ref(false)
const docError = ref('')

function openDocumentsModal() {
  resetDocForm()
  showDocsModal.value = true
}
function closeDocumentsModal() {
  showDocsModal.value = false
  resetDocForm()
}
function resetDocForm() {
  docName.value = ''
  expiringMode.value = 'NEVER'
  expStart.value = ''
  expEnd.value = ''
  docFile.value = null
  uploadingDoc.value = false
}

function onDocFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  docFile.value = input?.files?.[0] ?? null
}

// Document helper functions
function isImageFile(doc: any): boolean {
  const mimeType = doc.mime_type || doc.type || ''
  const fileName = doc.file_name || doc.name || ''
  return mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
}

function isPdfFile(doc: any): boolean {
  const mimeType = doc.mime_type || doc.type || ''
  const fileName = doc.file_name || doc.name || ''
  return mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)
}

function getExpiryBadgeClass(doc: any): string {
  if (!doc.expiring_end) return 'bg-secondary bg-opacity-25 text-secondary'
  const endDate = new Date(doc.expiring_end)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return 'bg-danger text-white'
  if (daysUntilExpiry <= 30) return 'bg-warning text-dark'
  return 'bg-success bg-opacity-25 text-success'
}

function getExpiryLabel(doc: any): string {
  if (!doc.expiring_end) return 'No Expiry'
  const endDate = new Date(doc.expiring_end)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`
  if (daysUntilExpiry === 0) return 'Expires today'
  if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`
  return `Valid until ${endDate.toLocaleDateString()}`
}

function viewDocument(doc: any) {
  if (isImageFile(doc)) {
    emit('open-image-preview', doc)
  } else {
    emit('view-document', doc)
  }
}

function downloadDocument(doc: any) {
  emit('downloadDocument', doc.id)
}

async function submitDocument() {
  // Start fresh and log what we're about to do
  docError.value = ''
  console.debug('[VehicleProfile] submitDocument called', { name: docName.value, fileName: docFile?.value?.name })

  if (!props.vehicleDetails || !props.vehicleDetails.id) {
    docError.value = 'Select a vehicle first'
    return
  }
  if (!docName.value) {
    docError.value = 'Document name is required'
    return
  }
  if (!docFile.value) {
    docError.value = 'Please select a file to upload'
    return
  }

  const allowed = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowed.includes(docFile.value.type)) {
    docError.value = 'Allowed file types: PDF, JPG, PNG'
    return
  }
  const maxBytes = 2 * 1024 * 1024
  if (docFile.value.size > maxBytes) {
    docError.value = 'File too large. Maximum 2 MB'
    return
  }

  uploadingDoc.value = true
  try {
    const payload: any = {
      name: docName.value,
      code: `vehicle-${props.vehicleDetails.id}`,
      file: docFile.value,
      expiring_mode: expiringMode.value
    }
    if (expiringMode.value === 'DATE_RANGE') {
      if (expStart.value) payload.expiring_start = expStart.value
      if (expEnd.value) payload.expiring_end = expEnd.value
    }

    console.debug('[VehicleProfile] uploading document payload:', { name: payload.name, code: payload.code, fileName: payload.file?.name, size: payload.file?.size, type: payload.file?.type })
    const res = await documentsStore.createDocument(payload)
    console.debug('[VehicleProfile] createDocument response:', res)

    // Accept success when server returns 200 or 201
    if (res && (res.status === 200 || res.status === 201 || (res.data && res.data.success !== false))) {
      toast.success('Document uploaded')
      // Refresh list so preview maps are updated
      emit('refresh-documents', props.vehicleDetails.id)

      // Try to open newly uploaded doc if server returned it
      const created = res?.data?.data || res?.data || null
      if (created && (created.id || (Array.isArray(created) && created[0] && created[0].id))) {
        const docObj = Array.isArray(created) ? created[0] : created
        emit('view-document', docObj)
      }

      // Close only after success
      closeDocumentsModal()
    } else {
      console.warn('[VehicleProfile] unexpected upload response', res)
      const fallbackMsg = res?.data?.message || 'Upload completed but server response was unexpected'
      docError.value = typeof fallbackMsg === 'string' ? fallbackMsg : JSON.stringify(fallbackMsg)
    }
  } catch (err: any) {
    console.error('Document upload failed', err)
    // Try to extract a helpful message
    const serverMsg = err?.response?.data?.message || err?.response?.data || err?.message || 'Upload failed'
    docError.value = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)
    toast.error(docError.value)
  } finally {
    uploadingDoc.value = false
  }
}

</script>

<style scoped>
.vehicle-profile-page {
  width: 100%;
}

.card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

/* Remove border radius from tabs card */
.tabs-card {
  border-radius: 0 !important;
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.card-header {
  background: #f8f9fa !important;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2c3e50;
}

.vehicle-icon {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.vehicle-icon i {
  color: #007bff;
}



.tab-panel {
  min-height: 400px;
}

.list-group-item {
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

/* Specification Cards Styling */
.spec-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.85rem;
  min-width: 120px;
  display: inline-block;
}

.spec-value {
  color: #495057;
  font-size: 0.85rem;
  margin-left: 10px;
}

/* Bus Seat Map Styling */
/* .seat-map-container {
  text-align: center; */
/* } */

.driver-area {
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 15px;
}

.driver-seat {
  display: inline-block;
  padding: 15px;
  background: #e7f5ef;
  border: 2px solid #0f5132;
  border-radius: 8px;
  color: #0f5132;
  font-weight: 600;
}

.driver-seat i {
  font-size: 1.2rem;
  display: block;
  margin-bottom: 5px;
}

.passenger-seats {
  margin-top: 20px;
}

/* .seat-row {
  display: flex;
  justify-content: center;
  gap: 8px;
} */

/* .seat {
  width: 40px;
  height: 40px;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
} */

/* .seat:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.seat i {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 2px;
} */

/* .seat small {
  font-size: 0.7rem;
  color: #495057;
  font-weight: 600;
} */

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #dee2e6;
}

.legend-color.available {
  background: #d4edda;
  border-color: #c3e6cb;
}

.legend-color.occupied {
  background: #f8d7da;
  border-color: #f5c6cb;
}

.legend-color.reserved {
  background: #fff3cd;
  border-color: #ffeaa7;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .ms-auto {
    margin-left: 0 !important;
    width: 100%;
  }

  .nav-tabs {
    flex-wrap: wrap;
  }

  .nav-tabs .nav-link {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    transition: background-color .15s, color .15s, border-bottom .15s;
  }

  /* Stronger specificity including .show.active to ensure Bootstrap doesn't override */
  .nav-tabs .nav-link.active,
  .nav-tabs .nav-link.show.active {
    background-color: #e6f5ea !important;
    color: #155724 !important;
    border-bottom: 3px solid #28a745 !important;
    box-shadow: none;
  }
}


.nav-tabs .nav-link.active,
.nav-tabs .nav-link.show.active {
  background-color: #eaf6ef !important; /* slightly lighter green background */
  color: #155724 !important;
  /* remove border-bottom in favor of an always-visible pseudo-line */
  border-bottom: none !important;
  box-shadow: none;
  position: relative;
  z-index: 1;
}

/* Subtle centered green underline for active tab */
.nav-tabs {
  padding-bottom: 4px; /* bring tabs closer to border so underline can touch */
  overflow: visible;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-link.show.active {
  position: relative;
  z-index: 2;
}

.nav-tabs .nav-link.active::after,
.nav-tabs .nav-link.show.active::after {
  content: '';
  position: absolute;
  /* span full tab width but keep the original thin height */
  left: 0;
  right: 0;
  height: 4px; /* restore thin underline */
  background: #084f36; /* darker forest green */
  /* move down slightly to overlap and touch the border without growing size */
  bottom: -4px; /* overlaps the card border beneath */
  border-radius: 2px; /* subtle rounding */
  box-shadow: none;
  transition: all .12s ease;
  z-index: 3; /* sit above the card border */
}

/* Remove border/background from non-active tabs so they don't appear focused/hovered */
.nav-tabs .nav-link:not(.active) {
  background: transparent !important;
  border: none !important;
  color: inherit !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Ensure focus does not show outline or shadow on tabs */
.nav-tabs .nav-link:focus,
.nav-tabs .nav-link:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

/* //seat map styles */
.seat-map {
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.seat {
  width: 30px;
  height: 30px;
  border-radius: 3px;
  font-size: 10px;
  transition: all 0.2s;
}

.seat-available {
  background-color: #28a745;
  color: white;
  cursor: pointer;
}

.seat-selected {
  background-color: #007bff;
  color: white;
  transform: scale(1.1);
}

.seat-toilet {
  background-color: #17a2b8;
  color: white;
}

.seat-door {
  background-color: #ffc107;
  color: #212529;
}

.seat-cabinet {
  background-color: #6c757d;
  color: #212529;
}

.seat-fridge {
  background-color: #e2ecf5;
  color: #212529;
}

.seat-aisle {
  background-color: transparent;
  width: 40px;
}

.modal-dialog-scrollable .modal-body {
  overflow-y: auto !important;
  max-height: calc(100vh - 200px) !important;
}

/* Document card styles */
.document-card {
  transition: all 0.2s ease;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #007bff !important;
}

.document-preview {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
