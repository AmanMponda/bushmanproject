<template>
  <div>

    <!-- Breadcrumb -->
    <div class="d-flex justify-content-between align-items-center mb-2">
      <ul class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <router-link to="/module-settings/inspection-settings">MASTER DATA</router-link>
        </li>
        <li class="breadcrumb-item">
          <router-link to="/module-settings/inspection-settings">MAINTENANCE CATEGORIES</router-link>
        </li>
        <li class="breadcrumb-item active">{{ isEditing ? 'EDIT' : 'CREATE' }}</li>
      </ul>
      <button class="btn btn-outline-secondary btn-sm px-3" @click="backToList">
        <i class="fa fa-arrow-left me-1"></i> Back to List
      </button>
    </div>

    <!-- Stepper -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-3 px-4">
        <div class="stepper-track d-flex align-items-start justify-content-between position-relative">
          <div class="stepper-connector"></div>
          <div v-for="(step, idx) in steps" :key="idx"
            class="stepper-node text-center"
            :class="{
              'is-done':   idx < currentStep,
              'is-active': idx === currentStep,
              'is-saved':  savedSteps.has(idx),
            }"
            :style="savedSteps.has(idx) && idx !== currentStep ? 'cursor:pointer' : ''"
            @click="savedSteps.has(idx) ? currentStep = idx : null">
            <div class="step-bubble mx-auto">
              <i v-if="savedSteps.has(idx) && idx < currentStep" class="fa fa-check"></i>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="step-title mt-1">{{ step.label }}</div>
            <div class="step-sub">{{ step.sub }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Draft saved notice -->
    <div v-if="draft.id && currentStep > 0"
      class="alert alert-success alert-sm border-0 rounded-3 py-2 px-3 mb-3 d-flex align-items-center gap-2">
      <i class="fa fa-check-circle text-success"></i>
      <span class="small">
        Category <strong>{{ draft.name }}</strong> is saved (ID #{{ draft.id }}).
        You can leave and come back anytime — all changes are saved live.
      </span>
      <button class="btn btn-outline-secondary btn-xs ms-auto" @click="backToList">
        <i class="fa fa-sign-out-alt me-1"></i>Finish &amp; Exit
      </button>
    </div>

    <!-- ════════════════════════════════
         STEP 0 — Category Info
    ════════════════════════════════ -->
    <div v-show="currentStep === 0">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-2 d-flex align-items-center gap-3">
          <div class="step-icon bg-primary bg-opacity-10 rounded-3 p-2">
            <i class="fa fa-tag text-primary"></i>
          </div>
          <div>
            <h6 class="mb-0 fw-bold">Step 1 — Category Info</h6>
            <small class="text-muted">Basic information for this maintenance category</small>
          </div>
          <span v-if="savedSteps.has(0)" class="badge bg-success bg-opacity-10 text-success ms-auto">
            <i class="fa fa-check me-1"></i>Saved to DB
          </span>
        </div>
        <div class="card-body p-3">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label fw-semibold small">
                Category Name <span class="text-danger">*</span>
              </label>
              <input v-model="draft.name" type="text" class="form-control"
                :class="{ 'is-invalid': errors.name }"
                placeholder="e.g. Oil Leakage, Engine Inspection" />
              <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold small">
                Asset Group <span class="text-danger">*</span>
              </label>
              <VueSelect v-model="draft.asset_group_id" :options="assetGroups" label="name"
                :reduce="a => a.id" placeholder="Select asset group"
                :class="{ 'is-invalid': errors.asset_group_id }" />
              <div v-if="errors.asset_group_id"
                class="invalid-feedback d-block small">{{ errors.asset_group_id }}</div>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold small">Site</label>
              <VueSelect v-model="draft.site_id" :options="sites" label="name"
                :reduce="s => s.id" placeholder="Global (all sites)" />
              <small class="text-muted x-small">Leave blank to apply globally.</small>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold small">Scoped Site</label>
              <VueSelect v-model="draft.scoped_site_id" :options="sites" label="name"
                :reduce="s => s.id" placeholder="Select Scoped Site" />
            </div>
          </div>
        </div>
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2">
          <small v-if="savedSteps.has(0)" class="text-success x-small">
            <i class="fa fa-check-circle me-1"></i>Saved — ID #{{ draft.id }}
          </small>
          <span v-else></span>
          <div class="d-flex gap-2">
            <button v-if="savedSteps.has(0)" class="btn btn-outline-secondary btn-sm px-4"
              @click="currentStep = 1">
              Next <i class="fa fa-arrow-right ms-1"></i>
            </button>
            <button class="btn btn-primary btn-sm px-4" @click="saveStep0" :disabled="step0Saving">
              <i v-if="step0Saving" class="fa fa-spinner fa-spin me-1"></i>
              <i v-else class="fa fa-save me-1"></i>
              {{ savedSteps.has(0) ? 'Update & Next' : 'Save & Next' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════
         STEP 1 — Symptoms
    ════════════════════════════════ -->
    <div v-show="currentStep === 1">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-2 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="step-icon bg-warning bg-opacity-10 rounded-3 p-2">
              <i class="fa fa-exclamation-triangle text-warning"></i>
            </div>
            <div>
              <h6 class="mb-0 fw-bold">Step 2 — Symptoms</h6>
              <small class="text-muted">Observable signs for <strong>{{ draft.name }}</strong></small>
            </div>
          </div>
          <span class="badge bg-warning bg-opacity-10 text-warning px-2 py-1">
            {{ draft.symptoms.length }} symptom(s)
          </span>
        </div>
        <div class="card-body p-3">
          <!-- Add row -->
          <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
            <div class="row g-2 align-items-end">
              <div class="col-md-4">
                <label class="form-label fw-semibold small mb-1">
                  Name <span class="text-danger">*</span>
                </label>
                <input v-model="newSymptom.name" type="text" class="form-control form-control-sm"
                  :class="{ 'is-invalid': newSymptomErr }"
                  placeholder="e.g. Engine Oil Dripping"
                  @keyup.enter="addSymptom" />
                <div v-if="newSymptomErr" class="invalid-feedback">{{ newSymptomErr }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small mb-1">Description</label>
                <input v-model="newSymptom.description" type="text"
                  class="form-control form-control-sm"
                  placeholder="Optional details" @keyup.enter="addSymptom" />
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary btn-sm w-100" @click="addSymptom"
                  :disabled="addingSymptom">
                  <i v-if="addingSymptom" class="fa fa-spinner fa-spin me-1"></i>
                  <i v-else class="fa fa-plus me-1"></i> Add
                </button>
              </div>
            </div>
          </div>

          <!-- Symptoms table -->
          <div v-if="draft.symptoms.length" class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3 small text-muted" style="width:46px">#</th>
                  <th class="small text-muted">Name</th>
                  <th class="small text-muted">Description</th>
                  <th class="small text-muted text-end pe-3" style="width:100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(s, i) in draft.symptoms" :key="s.id">
                  <tr v-if="editSymptomId !== s.id">
                    <td class="ps-3 text-muted">{{ i + 1 }}</td>
                    <td class="fw-semibold">{{ s.name }}</td>
                    <td class="text-muted">{{ s.description || '—' }}</td>
                    <td class="text-end pe-3">
                      <button class="btn btn-xs btn-outline-secondary me-1"
                        @click="startEditSymptom(s)">
                        <i class="fa fa-edit" style="font-size:.65rem"></i>
                      </button>
                      <button class="btn btn-xs btn-outline-danger"
                        @click="deleteSymptom(s.id)" :disabled="deletingId === s.id">
                        <i v-if="deletingId === s.id" class="fa fa-spinner fa-spin" style="font-size:.65rem"></i>
                        <i v-else class="fa fa-trash" style="font-size:.65rem"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-else class="table-info">
                    <td class="ps-3 text-muted">{{ i + 1 }}</td>
                    <td><input v-model="editSymptomData.name" class="form-control form-control-sm" /></td>
                    <td><input v-model="editSymptomData.description" class="form-control form-control-sm" /></td>
                    <td class="text-end pe-3">
                      <button class="btn btn-xs btn-success me-1" @click="saveSymptom"
                        :disabled="savingSymptom">
                        <i v-if="savingSymptom" class="fa fa-spinner fa-spin" style="font-size:.65rem"></i>
                        <i v-else class="fa fa-check" style="font-size:.65rem"></i>
                      </button>
                      <button class="btn btn-xs btn-outline-secondary"
                        @click="editSymptomId = null">
                        <i class="fa fa-times" style="font-size:.65rem"></i>
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-4 text-muted">
            <i class="fa fa-inbox fa-2x mb-2 d-block opacity-25"></i>
            No symptoms yet.
          </div>
        </div>
        <div class="card-footer bg-white border-top d-flex justify-content-between py-2">
          <button class="btn btn-outline-secondary btn-sm px-4" @click="currentStep = 0">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm px-4" @click="backToList">
              <i class="fa fa-sign-out-alt me-1"></i> Save &amp; Exit
            </button>
            <button class="btn btn-primary btn-sm px-5" @click="currentStep = 2">
              Continue <i class="fa fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════
         STEP 2 — Parameters
    ════════════════════════════════ -->
    <div v-show="currentStep === 2">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-2 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="step-icon bg-primary bg-opacity-10 rounded-3 p-2">
              <i class="fa fa-sliders-h text-primary"></i>
            </div>
            <div>
              <h6 class="mb-0 fw-bold">Step 3 — Parameters</h6>
              <small class="text-muted">Questions for <strong>{{ draft.name }}</strong></small>
            </div>
          </div>
          <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1">
            {{ draft.parameters.length }} parameter(s)
          </span>
        </div>
        <div class="card-body p-3">
          <!-- Add row -->
          <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
            <div class="row g-2 align-items-end">
              <div class="col-md-3">
                <label class="form-label fw-semibold small mb-1">
                  Name <span class="text-danger">*</span>
                </label>
                <input v-model="newParam.name" type="text" class="form-control form-control-sm"
                  :class="{ 'is-invalid': newParamErr }"
                  placeholder="e.g. Oil Level" @keyup.enter="addParam" />
                <div v-if="newParamErr" class="invalid-feedback">{{ newParamErr }}</div>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold small mb-1">Type <span class="text-danger">*</span></label>
                <VueSelect v-model="newParam.question_type" :options="questionTypes"
                  label="label" :reduce="t => t.value" placeholder="Select type" />
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold small mb-1">Unit</label>
                <VueSelect v-model="newParam.unit" :options="unitsOfMeasurements"
                  label="name" :reduce="u => u.id" placeholder="Select unit" />
              </div>
              <div class="col-md-2 d-flex align-items-end pb-1">
                <div class="form-check form-switch ms-2">
                  <input v-model="newParam.active" class="form-check-input" type="checkbox" id="pActive" />
                  <label class="form-check-label small" for="pActive">Active</label>
                </div>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button class="btn btn-primary btn-sm w-100" @click="addParam"
                  :disabled="addingParam">
                  <i v-if="addingParam" class="fa fa-spinner fa-spin me-1"></i>
                  <i v-else class="fa fa-plus me-1"></i> Add
                </button>
              </div>
            </div>
          </div>

          <!-- Parameters table -->
          <div v-if="draft.parameters.length" class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3 small text-muted" style="width:46px">#</th>
                  <th class="small text-muted">Name</th>
                  <th class="small text-muted">Type</th>
                  <th class="small text-muted">Unit</th>
                  <th class="small text-muted text-center">Active</th>
                  <th class="small text-muted text-end pe-3" style="width:100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(p, i) in draft.parameters" :key="p.id">
                  <tr v-if="editParamId !== p.id">
                    <td class="ps-3 text-muted">{{ i + 1 }}</td>
                    <td class="fw-semibold">{{ p.name }}</td>
                    <td><span class="badge" :class="qTypeBadge(p.question_type)">{{ p.question_type }}</span></td>
                    <td class="text-muted">{{ getUnitName(p.unit) || '—' }}</td>
                    <td class="text-center">
                      <span class="badge"
                        :class="p.active ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'">
                        {{ p.active ? 'Yes' : 'No' }}
                      </span>
                    </td>
                    <td class="text-end pe-3">
                      <button class="btn btn-xs btn-outline-secondary me-1" @click="startEditParam(p)">
                        <i class="fa fa-edit" style="font-size:.65rem"></i>
                      </button>
                      <button class="btn btn-xs btn-outline-danger" @click="deleteParam(p.id)"
                        :disabled="deletingId === p.id">
                        <i v-if="deletingId === p.id" class="fa fa-spinner fa-spin" style="font-size:.65rem"></i>
                        <i v-else class="fa fa-trash" style="font-size:.65rem"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-else class="table-info">
                    <td class="ps-3 text-muted">{{ i + 1 }}</td>
                    <td><input v-model="editParamData.name" class="form-control form-control-sm" /></td>
                    <td>
                      <VueSelect v-model="editParamData.question_type" :options="questionTypes"
                        label="label" :reduce="t => t.value" placeholder="Type" />
                    </td>
                    <td>
                      <VueSelect v-model="editParamData.unit" :options="unitsOfMeasurements"
                        label="name" :reduce="u => u.id" placeholder="Unit" />
                    </td>
                    <td class="text-center">
                      <div class="form-check form-switch d-flex justify-content-center mb-0">
                        <input v-model="editParamData.active" class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="text-end pe-3">
                      <button class="btn btn-xs btn-success me-1" @click="saveParam(p.id)"
                        :disabled="savingParam">
                        <i v-if="savingParam" class="fa fa-spinner fa-spin" style="font-size:.65rem"></i>
                        <i v-else class="fa fa-check" style="font-size:.65rem"></i>
                      </button>
                      <button class="btn btn-xs btn-outline-secondary" @click="editParamId = null">
                        <i class="fa fa-times" style="font-size:.65rem"></i>
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-4 text-muted">
            <i class="fa fa-inbox fa-2x mb-2 d-block opacity-25"></i>
            No parameters yet.
          </div>
        </div>
        <div class="card-footer bg-white border-top d-flex justify-content-between py-2">
          <button class="btn btn-outline-secondary btn-sm px-4" @click="currentStep = 1">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm px-4" @click="backToList">
              <i class="fa fa-sign-out-alt me-1"></i> Save &amp; Exit
            </button>
            <button class="btn btn-primary btn-sm px-5" @click="currentStep = 3">
              Continue <i class="fa fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════
         STEP 3 — Options
    ════════════════════════════════ -->
    <div v-show="currentStep === 3">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-2 d-flex align-items-center gap-3">
          <div class="step-icon bg-info bg-opacity-10 rounded-3 p-2">
            <i class="fa fa-list-ul text-info"></i>
          </div>
          <div>
            <h6 class="mb-0 fw-bold">Step 4 — Options</h6>
            <small class="text-muted">Choices for <strong>select</strong>-type parameters</small>
          </div>
        </div>
        <div class="card-body p-3">
          <div v-if="!selectParams.length"
            class="alert alert-info border-0 rounded-3 small py-2 mb-0">
            <i class="fa fa-info-circle me-1"></i>
            No select-type parameters. Skip or go back to add some.
          </div>

          <div v-else class="accordion accordion-flush" id="optsAccordion">
            <div v-for="(param, pi) in selectParams" :key="param.id"
              class="accordion-item border rounded-3 mb-2 overflow-hidden">
              <h2 class="accordion-header">
                <button class="accordion-button bg-light py-2 fw-semibold"
                  :class="{ collapsed: pi !== 0 }"
                  type="button" data-bs-toggle="collapse"
                  :data-bs-target="'#acc_opts_' + param.id"
                  :aria-expanded="pi === 0">
                  <div class="d-flex align-items-center gap-2 w-100 me-2">
                    <i class="fa fa-sliders-h text-primary small"></i>
                    <span>{{ param.name }}</span>
                    <span class="badge bg-info bg-opacity-10 text-info">select</span>
                    <span class="badge bg-primary bg-opacity-10 text-primary">
                      {{ param.options.length }} option(s)
                    </span>
                  </div>
                </button>
              </h2>
              <div :id="'acc_opts_' + param.id" class="accordion-collapse collapse"
                :class="{ show: pi === 0 }">
                <div class="accordion-body p-3">
                  <!-- Add option -->
                  <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
                    <div class="row g-2 align-items-end">
                      <div class="col-md-4">
                        <label class="form-label fw-semibold small mb-1">
                          Label <span class="text-danger">*</span>
                        </label>
                        <input v-model="newOpts[param.id].label" type="text"
                          class="form-control form-control-sm" placeholder="e.g. Very Low"
                          @input="autoOptValue(param.id)"
                          @keyup.enter="addOption(param)" />
                      </div>
                      <div class="col-md-3">
                        <label class="form-label fw-semibold small mb-1">
                          Value <span class="text-danger">*</span>
                        </label>
                        <input v-model="newOpts[param.id].value" type="text"
                          class="form-control form-control-sm" placeholder="very_low" />
                        <small class="text-muted x-small">Auto-generated from label</small>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label fw-semibold small mb-1">
                          Severity &nbsp;
                          <span class="badge fw-bold"
                            :class="sevBadge(newOpts[param.id].severity)">
                            {{ newOpts[param.id].severity }} / 5
                          </span>
                        </label>
                        <input v-model.number="newOpts[param.id].severity" type="range"
                          class="form-range" min="0" max="5" step="1" />
                        <div class="d-flex justify-content-between"
                          style="font-size:.58rem;color:#adb5bd">
                          <span>None</span><span>Low</span><span>Med</span><span>High</span><span>Critical</span>
                        </div>
                      </div>
                      <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary btn-sm w-100" @click="addOption(param)"
                          :disabled="addingOptParamId === param.id">
                          <i v-if="addingOptParamId === param.id" class="fa fa-spinner fa-spin me-1"></i>
                          <i v-else class="fa fa-plus me-1"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Options table -->
                  <div v-if="param.options.length" class="table-responsive">
                    <table class="table table-bordered table-sm align-middle mb-0">
                      <thead class="table-light">
                        <tr>
                          <th class="ps-3 small text-muted" style="width:46px">#</th>
                          <th class="small text-muted">Label</th>
                          <th class="small text-muted">Value</th>
                          <th class="small text-muted text-center">Severity</th>
                          <th class="small text-muted text-end pe-3" style="width:100px">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="(opt, oi) in param.options" :key="opt.id">
                          <tr v-if="editOptKey !== param.id + '_' + opt.id">
                            <td class="ps-3 text-muted">{{ oi + 1 }}</td>
                            <td class="fw-semibold">{{ opt.label }}</td>
                            <td><code class="small">{{ opt.value }}</code></td>
                            <td class="text-center">
                              <span class="badge" :class="sevBadge(opt.severity)">
                                {{ opt.severity ?? '—' }}
                              </span>
                            </td>
                            <td class="text-end pe-3">
                              <button class="btn btn-xs btn-outline-secondary me-1"
                                @click="startEditOpt(param, opt)">
                                <i class="fa fa-edit" style="font-size:.65rem"></i>
                              </button>
                              <button class="btn btn-xs btn-outline-danger"
                                @click="deleteOption(param, opt.id)"
                                :disabled="deletingId === opt.id">
                                <i v-if="deletingId === opt.id" class="fa fa-spinner fa-spin" style="font-size:.65rem"></i>
                                <i v-else class="fa fa-trash" style="font-size:.65rem"></i>
                              </button>
                            </td>
                          </tr>
                          <tr v-else class="table-info">
                            <td class="ps-3 text-muted">{{ oi + 1 }}</td>
                            <td><input v-model="editOptData.label" class="form-control form-control-sm" /></td>
                            <td><input v-model="editOptData.value" class="form-control form-control-sm" /></td>
                            <td class="text-center">
                              <div class="d-flex align-items-center gap-1 justify-content-center">
                                <input v-model.number="editOptData.severity" type="range"
                                  class="form-range" min="0" max="5" style="width:80px" />
                                <span class="badge" :class="sevBadge(editOptData.severity)">
                                  {{ editOptData.severity }}
                                </span>
                              </div>
                            </td>
                            <td class="text-end pe-3">
                              <button class="btn btn-xs btn-success me-1"
                                @click="saveOption(param, opt.id)" :disabled="savingOpt">
                                <i v-if="savingOpt" class="fa fa-spinner fa-spin" style="font-size:.65rem"></i>
                                <i v-else class="fa fa-check" style="font-size:.65rem"></i>
                              </button>
                              <button class="btn btn-xs btn-outline-secondary"
                                @click="editOptKey = null">
                                <i class="fa fa-times" style="font-size:.65rem"></i>
                              </button>
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="text-muted small text-center py-2">
                    No options yet for <strong>{{ param.name }}</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-white border-top d-flex justify-content-between py-2">
          <button class="btn btn-outline-secondary btn-sm px-4" @click="currentStep = 2">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm px-4" @click="backToList">
              <i class="fa fa-sign-out-alt me-1"></i> Save &amp; Exit
            </button>
            <button class="btn btn-primary btn-sm px-5" @click="currentStep = 4">
              Continue <i class="fa fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════
         STEP 4 — Results & Items
    ════════════════════════════════ -->
    <div v-show="currentStep === 4">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-2 d-flex align-items-center gap-3">
          <div class="step-icon bg-success bg-opacity-10 rounded-3 p-2">
            <i class="fa fa-clipboard-check text-success"></i>
          </div>
          <div>
            <h6 class="mb-0 fw-bold">Step 5 — Results &amp; Items</h6>
            <small class="text-muted">Recommended actions and linked parts per parameter</small>
          </div>
        </div>
        <div class="card-body p-3">
          <div v-if="!draft.parameters.length"
            class="alert alert-warning border-0 rounded-3 small py-2 mb-0">
            <i class="fa fa-info-circle me-1"></i>
            No parameters. Go back to Step 3 first.
          </div>

          <div v-else class="accordion accordion-flush" id="resultsAccordion">
            <div v-for="(param, pi) in draft.parameters" :key="param.id"
              class="accordion-item border rounded-3 mb-2 overflow-hidden">
              <h2 class="accordion-header">
                <button class="accordion-button bg-light py-2 fw-semibold"
                  :class="{ collapsed: pi !== 0 }"
                  type="button" data-bs-toggle="collapse"
                  :data-bs-target="'#acc_res_' + param.id"
                  :aria-expanded="pi === 0">
                  <div class="d-flex align-items-center gap-2 w-100 me-2">
                    <i class="fa fa-sliders-h text-primary small"></i>
                    <span>{{ param.name }}</span>
                    <span class="badge" :class="qTypeBadge(param.question_type)">
                      {{ param.question_type }}
                    </span>
                    <span class="badge bg-success bg-opacity-10 text-success">
                      {{ param.results.length }} result(s)
                    </span>
                  </div>
                </button>
              </h2>
              <div :id="'acc_res_' + param.id" class="accordion-collapse collapse"
                :class="{ show: pi === 0 }">
                <div class="accordion-body p-3">
                  <!-- Add result -->
                  <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
                    <div class="row g-2 align-items-end">
                      <div class="col-md-4">
                        <label class="form-label fw-semibold small mb-1">
                          Result Name <span class="text-danger">*</span>
                        </label>
                        <input v-model="newRes[param.id].name" type="text"
                          class="form-control form-control-sm"
                          placeholder="e.g. Top Up Oil"
                          @keyup.enter="addResult(param)" />
                      </div>
                      <div v-if="param.options?.length" class="col-md-6">
                        <label class="form-label fw-semibold small mb-1">Triggered by</label>
                        <div class="d-flex flex-wrap gap-2">
                          <div v-for="opt in param.options" :key="opt.id"
                            class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox"
                              :id="'trg_' + param.id + '_' + opt.id"
                              :value="opt.value"
                              v-model="newRes[param.id].mapped_option_values" />
                            <label class="form-check-label small"
                              :for="'trg_' + param.id + '_' + opt.id">
                              <span class="badge" :class="sevBadge(opt.severity)">{{ opt.label }}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-success btn-sm w-100" @click="addResult(param)"
                          :disabled="addingResParamId === param.id">
                          <i v-if="addingResParamId === param.id" class="fa fa-spinner fa-spin me-1"></i>
                          <i v-else class="fa fa-plus me-1"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Results list -->
                  <div v-if="param.results.length" class="d-flex flex-column gap-2">
                    <div v-for="res in param.results" :key="res.id"
                      class="result-card border rounded-3 overflow-hidden">
                      <!-- Result header -->
                      <div class="result-header d-flex align-items-center justify-content-between px-3 py-2 bg-success bg-opacity-10">
                        <template v-if="editResKey === param.id + '_' + res.id">
                          <div class="d-flex align-items-center gap-2 flex-wrap flex-grow-1 me-2">
                            <input v-model="editResData.name"
                              class="form-control form-control-sm" style="max-width:180px" />
                            <div v-if="param.options?.length" class="d-flex flex-wrap gap-2">
                              <div v-for="opt in param.options" :key="opt.id"
                                class="form-check form-check-inline mb-0">
                                <input class="form-check-input" type="checkbox"
                                  :id="'er_' + res.id + '_' + opt.id"
                                  :value="opt.value"
                                  v-model="editResData.mapped_option_values" />
                                <label class="form-check-label small"
                                  :for="'er_' + res.id + '_' + opt.id">{{ opt.label }}</label>
                              </div>
                            </div>
                          </div>
                          <div class="d-flex gap-1">
                            <button class="btn btn-xs btn-success py-0 px-2"
                              @click="saveResult(param, res.id)" :disabled="savingRes">
                              <i v-if="savingRes" class="fa fa-spinner fa-spin" style="font-size:.6rem"></i>
                              <i v-else class="fa fa-check" style="font-size:.6rem"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-secondary py-0 px-2"
                              @click="editResKey = null">
                              <i class="fa fa-times" style="font-size:.6rem"></i>
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="d-flex align-items-center gap-2 flex-wrap">
                            <i class="fa fa-check-circle text-success small"></i>
                            <span class="fw-semibold small">{{ res.name }}</span>
                            <span v-for="ov in res.mapped_option_values ?? []" :key="ov"
                              class="badge bg-light text-dark border"
                              style="font-size:.62rem">
                              {{ getOptLabelByValue(param, ov) }}
                            </span>
                            <span class="badge bg-secondary bg-opacity-10 text-secondary">
                              {{ res.items.length }} item(s)
                            </span>
                          </div>
                          <div class="d-flex gap-1">
                            <button class="btn btn-xs btn-outline-secondary py-0 px-2"
                              @click="startEditRes(param, res)">
                              <i class="fa fa-edit" style="font-size:.6rem"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-danger py-0 px-2"
                              @click="deleteResult(param, res.id)"
                              :disabled="deletingId === res.id">
                              <i v-if="deletingId === res.id" class="fa fa-spinner fa-spin" style="font-size:.6rem"></i>
                              <i v-else class="fa fa-trash" style="font-size:.6rem"></i>
                            </button>
                          </div>
                        </template>
                      </div>

                      <!-- Items -->
                      <div class="px-3 py-2">
                        <div class="add-row rounded-3 border border-dashed p-2 mb-2 bg-light">
                          <div class="row g-2 align-items-end">
                            <div class="col-md-5">
                              <label class="form-label fw-semibold x-small mb-1">Item / Part</label>
                              <select v-model="newItemsMap[res.id].item_id"
                                class="form-select form-select-sm">
                                <option value="">-- Select --</option>
                                <option v-for="it in availableItems" :key="it.id" :value="it.id">
                                  {{ it.name }}
                                </option>
                              </select>
                            </div>
                            <div class="col-md-5">
                              <label class="form-label fw-semibold x-small mb-1">Notes</label>
                              <input v-model="newItemsMap[res.id].description" type="text"
                                class="form-control form-control-sm"
                                placeholder="e.g. Use synthetic only"
                                @keyup.enter="addItem(res)" />
                            </div>
                            <div class="col-md-2">
                              <button class="btn btn-outline-secondary btn-sm w-100"
                                @click="addItem(res)"
                                :disabled="addingItemResId === res.id">
                                <i v-if="addingItemResId === res.id" class="fa fa-spinner fa-spin"></i>
                                <i v-else class="fa fa-plus"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div v-if="res.items.length" class="table-responsive">
                          <table class="table table-sm table-bordered align-middle mb-0">
                            <thead class="table-light">
                              <tr>
                                <th class="ps-2 small text-muted">#</th>
                                <th class="small text-muted">Item</th>
                                <th class="small text-muted">Notes</th>
                                <th class="small text-muted text-end pe-2">Del</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(itm, ii) in res.items" :key="itm.id">
                                <td class="ps-2 text-muted">{{ ii + 1 }}</td>
                                <td class="fw-semibold small">{{ itm.item?.name ?? getItemName(itm.item_id) }}</td>
                                <td class="text-muted small">{{ itm.description || '—' }}</td>
                                <td class="text-end pe-2">
                                  <button class="btn btn-xs btn-outline-danger py-0 px-1"
                                    @click="deleteItem(res, itm.id)"
                                    :disabled="deletingId === itm.id">
                                    <i v-if="deletingId === itm.id" class="fa fa-spinner fa-spin" style="font-size:.6rem"></i>
                                    <i v-else class="fa fa-times" style="font-size:.6rem"></i>
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div v-else class="text-muted x-small text-center py-1">
                          No items linked.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-muted small text-center py-2">
                    No results yet.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-white border-top d-flex justify-content-between py-2">
          <button class="btn btn-outline-secondary btn-sm px-4" @click="currentStep = 3">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm px-4" @click="backToList">
              <i class="fa fa-sign-out-alt me-1"></i> Save &amp; Exit
            </button>
            <button class="btn btn-primary btn-sm px-5" @click="currentStep = 5">
              Continue <i class="fa fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════
         STEP 5 — Review & Finish
    ════════════════════════════════ -->
    <div v-show="currentStep === 5">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-2 d-flex align-items-center gap-3">
          <div class="step-icon bg-success bg-opacity-10 rounded-3 p-2">
            <i class="fa fa-check-double text-success"></i>
          </div>
          <div>
            <h6 class="mb-0 fw-bold">Step 6 — Review &amp; Finish</h6>
            <small class="text-muted">Everything is saved live. Review your entries below.</small>
          </div>
        </div>
        <div class="card-body p-3">
          <!-- Summary pills -->
          <div class="row g-2 mb-3">
            <div class="col-6 col-md-3">
              <div class="border rounded-3 p-2 text-center">
                <div class="fw-bold fs-4 text-primary lh-1">1</div>
                <div class="small text-muted">Category</div>
                <div class="fw-semibold x-small text-truncate mt-1">{{ draft.name }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="border rounded-3 p-2 text-center">
                <div class="fw-bold fs-4 text-warning lh-1">{{ draft.symptoms.length }}</div>
                <div class="small text-muted">Symptoms</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="border rounded-3 p-2 text-center">
                <div class="fw-bold fs-4 text-primary lh-1">{{ draft.parameters.length }}</div>
                <div class="small text-muted">Parameters</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="border rounded-3 p-2 text-center">
                <div class="fw-bold fs-4 text-success lh-1">{{ totalResults }}</div>
                <div class="small text-muted">Results</div>
              </div>
            </div>
          </div>

          <!-- Category detail -->
          <h6 class="fw-bold border-bottom pb-1 mb-2 small">Category</h6>
          <div class="row g-2 mb-3">
            <div class="col-md-4">
              <div class="border rounded-3 p-2">
                <div class="x-small text-muted">Name</div>
                <div class="fw-semibold small">{{ draft.name }}</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded-3 p-2">
                <div class="x-small text-muted">Asset Group</div>
                <div class="fw-semibold small">{{ getAssetGroupName(draft.asset_group_id) }}</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded-3 p-2">
                <div class="x-small text-muted">Site</div>
                <div class="fw-semibold small">{{ getSiteName(draft.site_id) }}</div>
              </div>
            </div>
          </div>

          <!-- Symptoms -->
          <h6 class="fw-bold border-bottom pb-1 mb-2 small">
            Symptoms
            <span class="badge bg-warning bg-opacity-10 text-warning ms-1">
              {{ draft.symptoms.length }}
            </span>
          </h6>
          <div v-if="draft.symptoms.length" class="d-flex flex-wrap gap-1 mb-3">
            <span v-for="s in draft.symptoms" :key="s.id"
              class="badge bg-warning bg-opacity-10 text-dark border px-2 py-1 small">
              <i class="fa fa-exclamation-triangle text-warning me-1 small"></i>{{ s.name }}
            </span>
          </div>
          <p v-else class="text-muted small mb-3">No symptoms.</p>

          <!-- Parameters table -->
          <h6 class="fw-bold border-bottom pb-1 mb-2 small">
            Parameters
            <span class="badge bg-primary bg-opacity-10 text-primary ms-1">
              {{ draft.parameters.length }}
            </span>
          </h6>
          <div class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3 small text-muted">#</th>
                  <th class="small text-muted">Parameter</th>
                  <th class="small text-muted">Type</th>
                  <th class="small text-muted">Options</th>
                  <th class="small text-muted">Results</th>
                  <th class="small text-muted">Items</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!draft.parameters.length">
                  <td colspan="6" class="text-center text-muted py-3">No parameters added.</td>
                </tr>
                <tr v-for="(p, i) in draft.parameters" :key="p.id">
                  <td class="ps-3 text-muted">{{ i + 1 }}</td>
                  <td class="fw-semibold small">
                    {{ p.name }}
                    <br><span class="text-muted x-small">{{ getUnitName(p.unit) }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="qTypeBadge(p.question_type)">
                      {{ p.question_type }}
                    </span>
                  </td>
                  <td>
                    <span v-for="o in p.options" :key="o.id"
                      class="badge bg-light text-dark border me-1 mb-1 small">
                      {{ o.label }}
                    </span>
                    <span v-if="!p.options?.length" class="text-muted small">—</span>
                  </td>
                  <td>
                    <span v-for="r in p.results" :key="r.id"
                      class="badge bg-success bg-opacity-10 text-success me-1 mb-1 small">
                      {{ r.name }}
                    </span>
                    <span v-if="!p.results.length" class="text-muted small">—</span>
                  </td>
                  <td class="text-muted small">
                    {{ p.results.reduce((s, r) => s + r.items.length, 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2">
          <button class="btn btn-outline-secondary btn-sm px-4" @click="currentStep = 4">
            <i class="fa fa-arrow-left me-1"></i> Back
          </button>
          <button class="btn btn-success btn-sm px-5" @click="backToList">
            <i class="fa fa-check me-1"></i> Finish
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { MACARGO_API_URL_2 } from '@/config/config';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from '@/stores/auth';
import VueSelect from '@/components/plugins/VueSelect.vue';

const route     = useRoute();
const router    = useRouter();
const authStore = useAuthStore();
const { showAlert } = useNotification();

const userId   = authStore.user?.id       || '';
const username = authStore.user?.username || '';

const axiosInstance = axios.create({
  baseURL: MACARGO_API_URL_2,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id':    String(userId),
    'X-Username':   username,
  },
});

// ── Determine if editing based on route params ─────────────────
const isEditing = computed(() => !!route.params.id);

// ── Step State ─────────────────────────────────────────────────
const currentStep = ref(0);
const savedSteps  = ref(new Set());
const step0Saving = ref(false);

const steps = [
  { label: 'Category',   sub: 'Basic info'    },
  { label: 'Symptoms',   sub: 'Observations'  },
  { label: 'Parameters', sub: 'Questions'      },
  { label: 'Options',    sub: 'Choices'        },
  { label: 'Results',    sub: 'Actions/Items'  },
  { label: 'Review',     sub: 'Finish'         },
];

// ── Draft ──────────────────────────────────────────────────────
const freshDraft = () => ({
  id: null, name: '', asset_group_id: '', site_id: '', scoped_site_id: '',
  symptoms:   [],
  parameters: [],
});
const draft  = ref(freshDraft());
const errors = ref({});

// ── Lookups ────────────────────────────────────────────────────
const assetGroups         = ref([]);
const sites               = ref([]);
const availableItems      = ref([]);
const unitsOfMeasurements = ref([]);
const questionTypes       = ref([]);

// ── Inline edit state ──────────────────────────────────────────
const deletingId = ref(null);

const editSymptomId   = ref(null);
const editSymptomData = ref({});
const savingSymptom   = ref(false);
const addingSymptom   = ref(false);
const newSymptom      = ref({ name: '', description: '' });
const newSymptomErr   = ref('');

const editParamId   = ref(null);
const editParamData = ref({});
const savingParam   = ref(false);
const addingParam   = ref(false);
const newParam      = ref({ name: '', question_type: 'select', unit: '', active: true });
const newParamErr   = ref('');

const editOptKey   = ref(null);
const editOptData  = ref({});
const savingOpt    = ref(false);
const addingOptParamId = ref(null);

const editResKey   = ref(null);
const editResData  = ref({});
const savingRes    = ref(false);
const addingResParamId = ref(null);

const addingItemResId = ref(null);

// ── Reactive input rows ────────────────────────────────────────
const newOpts     = ref({});
const newRes      = ref({});
const newItemsMap = ref({});

const initParamInputs = (id) => {
  if (!newOpts.value[id]) newOpts.value[id] = { label: '', value: '', severity: 0 };
  if (!newRes.value[id])  newRes.value[id]  = { name: '', mapped_option_values: [] };
};
const initResInputs = (id) => {
  if (!newItemsMap.value[id]) newItemsMap.value[id] = { item_id: '', description: '' };
};

watch(() => draft.value.parameters, (params) => {
  params.forEach(p => {
    initParamInputs(p.id);
    (p.results ?? []).forEach(r => initResInputs(r.id));
  });
}, { deep: true, immediate: true });

// ── Computed ───────────────────────────────────────────────────
const selectParams = computed(() =>
  draft.value.parameters.filter(p => p.question_type === 'select')
);
const totalResults = computed(() =>
  draft.value.parameters.reduce((s, p) => s + (p.results?.length ?? 0), 0)
);

// ── Helpers ────────────────────────────────────────────────────
const qTypeBadge = (t) => ({
  select:  'bg-info bg-opacity-10 text-info',
  number:  'bg-success bg-opacity-10 text-success',
  boolean: 'bg-warning bg-opacity-10 text-warning',
  text:    'bg-secondary bg-opacity-10 text-secondary',
}[t] ?? 'bg-light text-muted');

const sevBadge = (s) => {
  if (s == null || s === '') return 'bg-light text-muted';
  if (s === 0)  return 'bg-success bg-opacity-10 text-success';
  if (s <= 2)   return 'bg-info bg-opacity-10 text-info';
  if (s <= 4)   return 'bg-warning bg-opacity-10 text-warning';
  return 'bg-danger bg-opacity-10 text-danger';
};

const autoOptValue = (paramId) => {
  const r = newOpts.value[paramId];
  if (r) r.value = r.label.toLowerCase()
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const getUnitName       = (id) => unitsOfMeasurements.value.find(u => u.id == id)?.name ?? (id ?? '');
const getItemName       = (id) => availableItems.value.find(i => i.id == id)?.name ?? (id ?? '—');
const getAssetGroupName = (id) => assetGroups.value.find(a => a.id == id)?.name ?? '—';
const getSiteName       = (id) => id ? (sites.value.find(s => s.id == id)?.name ?? '—') : 'Global';
const getOptLabelByValue = (param, value) =>
  param.options?.find(o => o.value === value)?.label ?? value;

// ── Navigation ─────────────────────────────────────────────────
const backToList = () => {
  router.push('/module-settings/inspection-settings');
};

// ══════════════════════════════════════════════════════════════
// STEP 0 — Save/update category
// ══════════════════════════════════════════════════════════════
const saveStep0 = async () => {
  errors.value = {};
  if (!draft.value.name?.trim())   errors.value.name = 'Category name is required.';
  if (!draft.value.asset_group_id) errors.value.asset_group_id = 'Asset group is required.';
  if (Object.keys(errors.value).length) return;

  step0Saving.value = true;
  try {
    const payload = {
      name:           draft.value.name,
      asset_group_id: draft.value.asset_group_id,
      site_id:        draft.value.site_id       || null,
      scoped_site_id: draft.value.scoped_site_id || null,
    };

    if (draft.value.id) {
      const { data } = await axiosInstance.put(
        `/maintenance/categories/${draft.value.id}`, payload
      );
      draft.value.name           = data.name;
      draft.value.asset_group_id = data.asset_group_id;
      draft.value.site_id        = data.site_id       ?? '';
      draft.value.scoped_site_id = data.scope_site_id ?? '';
      showAlert('success', 'Category updated.');
    } else {
      const { data } = await axiosInstance.post('/maintenance/categories', payload);
      draft.value.id = data.id;
      showAlert('success', 'Category created. Continue adding details or exit anytime.');
    }

    savedSteps.value.add(0);
    currentStep.value = 1;
  } catch (e) {
    const msg = e.response?.data?.message ?? 'Failed to save category.';
    showAlert('error', msg);
  } finally {
    step0Saving.value = false;
  }
};

// ══════════════════════════════════════════════════════════════
// SYMPTOMS — live backend CRUD
// ══════════════════════════════════════════════════════════════
const addSymptom = async () => {
  newSymptomErr.value = '';
  if (!newSymptom.value.name?.trim()) { newSymptomErr.value = 'Required'; return; }
  addingSymptom.value = true;
  try {
    const { data } = await axiosInstance.post('/maintenance/symptoms', {
      maintenance_category_id: draft.value.id,
      name:        newSymptom.value.name,
      description: newSymptom.value.description || null,
    });
    draft.value.symptoms.push(data);
    newSymptom.value = { name: '', description: '' };
    showAlert('success', 'Symptom added.');
  } catch { showAlert('error', 'Failed to add symptom.'); }
  finally { addingSymptom.value = false; }
};

const startEditSymptom = (s) => {
  editSymptomId.value   = s.id;
  editSymptomData.value = { name: s.name, description: s.description ?? '' };
};

const saveSymptom = async () => {
  savingSymptom.value = true;
  try {
    const { data } = await axiosInstance.put(
      `/maintenance/symptoms/${editSymptomId.value}`, editSymptomData.value
    );
    const idx = draft.value.symptoms.findIndex(s => s.id === editSymptomId.value);
    if (idx !== -1) draft.value.symptoms[idx] = data;
    editSymptomId.value = null;
    showAlert('success', 'Symptom updated.');
  } catch { showAlert('error', 'Failed to update.'); }
  finally { savingSymptom.value = false; }
};

const deleteSymptom = async (id) => {
  if (!confirm('Delete this symptom?')) return;
  deletingId.value = id;
  try {
    await axiosInstance.delete(`/maintenance/symptoms/${id}`);
    draft.value.symptoms = draft.value.symptoms.filter(s => s.id !== id);
    showAlert('success', 'Symptom deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

// ══════════════════════════════════════════════════════════════
// PARAMETERS — live backend CRUD
// ══════════════════════════════════════════════════════════════
const addParam = async () => {
  newParamErr.value = '';
  if (!newParam.value.name?.trim()) { newParamErr.value = 'Required'; return; }
  addingParam.value = true;
  try {
    const { data } = await axiosInstance.post('/maintenance/parameters', {
      maintenance_category_id: draft.value.id,
      name:          newParam.value.name,
      question_type: newParam.value.question_type,
      unit:          newParam.value.unit || null,
      active:        newParam.value.active,
    });
    data.options = [];
    data.results = [];
    draft.value.parameters.push(data);
    initParamInputs(data.id);
    newParam.value = { name: '', question_type: 'select', unit: '', active: true };
    showAlert('success', 'Parameter added.');
  } catch { showAlert('error', 'Failed to add parameter.'); }
  finally { addingParam.value = false; }
};

const startEditParam = (p) => {
  editParamId.value   = p.id;
  editParamData.value = { name: p.name, question_type: p.question_type, unit: p.unit ?? '', active: p.active };
};

const saveParam = async (id) => {
  savingParam.value = true;
  try {
    const { data } = await axiosInstance.put(`/maintenance/parameters/${id}`, editParamData.value);
    const idx = draft.value.parameters.findIndex(p => p.id === id);
    if (idx !== -1) {
      draft.value.parameters[idx].name          = data.name;
      draft.value.parameters[idx].question_type = data.question_type;
      draft.value.parameters[idx].unit          = data.unit;
      draft.value.parameters[idx].active        = data.active;
    }
    editParamId.value = null;
    showAlert('success', 'Parameter updated.');
  } catch { showAlert('error', 'Failed to update.'); }
  finally { savingParam.value = false; }
};

const deleteParam = async (id) => {
  if (!confirm('Delete this parameter and all its options/results/items?')) return;
  deletingId.value = id;
  try {
    await axiosInstance.delete(`/maintenance/parameters/${id}`);
    draft.value.parameters = draft.value.parameters.filter(p => p.id !== id);
    showAlert('success', 'Parameter deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

// ══════════════════════════════════════════════════════════════
// OPTIONS — live backend CRUD
// ══════════════════════════════════════════════════════════════
const addOption = async (param) => {
  const row = newOpts.value[param.id];
  if (!row?.label?.trim() || !row?.value?.trim()) return;
  addingOptParamId.value = param.id;
  try {
    const { data } = await axiosInstance.post('/maintenance/parameter-options', {
      maintenance_parameter_id: param.id,
      label:    row.label,
      value:    row.value,
      severity: row.severity ?? null,
    });
    param.options.push(data);
    newOpts.value[param.id] = { label: '', value: '', severity: 0 };
    showAlert('success', 'Option added.');
  } catch { showAlert('error', 'Failed to add option.'); }
  finally { addingOptParamId.value = null; }
};

const startEditOpt = (param, opt) => {
  editOptKey.value  = param.id + '_' + opt.id;
  editOptData.value = { label: opt.label, value: opt.value, severity: opt.severity ?? 0 };
};

const saveOption = async (param, optId) => {
  savingOpt.value = true;
  try {
    const { data } = await axiosInstance.put(
      `/maintenance/parameter-options/${optId}`, editOptData.value
    );
    const idx = param.options.findIndex(o => o.id === optId);
    if (idx !== -1) param.options[idx] = data;
    editOptKey.value = null;
    showAlert('success', 'Option updated.');
  } catch { showAlert('error', 'Failed to update.'); }
  finally { savingOpt.value = false; }
};

const deleteOption = async (param, optId) => {
  if (!confirm('Delete this option?')) return;
  deletingId.value = optId;
  try {
    await axiosInstance.delete(`/maintenance/parameter-options/${optId}`);
    param.options = param.options.filter(o => o.id !== optId);
    showAlert('success', 'Option deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

// ══════════════════════════════════════════════════════════════
// RESULTS — live backend CRUD
// ══════════════════════════════════════════════════════════════
const addResult = async (param) => {
  const row = newRes.value[param.id];
  if (!row?.name?.trim()) return;
  addingResParamId.value = param.id;
  try {
    const { data } = await axiosInstance.post('/maintenance/possible-results', {
      maintenance_parameter_id: param.id,
      name:                     row.name,
      mapped_option_values:     row.mapped_option_values ?? [],
    });
    data.items = [];
    data.mapped_option_values = data.mapped_option_values ?? [];
    param.results.push(data);
    initResInputs(data.id);
    newRes.value[param.id] = { name: '', mapped_option_values: [] };
    showAlert('success', 'Result added.');
  } catch { showAlert('error', 'Failed to add result.'); }
  finally { addingResParamId.value = null; }
};

const startEditRes = (param, res) => {
  editResKey.value  = param.id + '_' + res.id;
  editResData.value = { name: res.name, mapped_option_values: [...(res.mapped_option_values ?? [])] };
};

const saveResult = async (param, resId) => {
  savingRes.value = true;
  try {
    const { data } = await axiosInstance.put(
      `/maintenance/possible-results/${resId}`, editResData.value
    );
    const idx = param.results.findIndex(r => r.id === resId);
    if (idx !== -1) {
      param.results[idx].name                = data.name;
      param.results[idx].mapped_option_values = data.mapped_option_values;
    }
    editResKey.value = null;
    showAlert('success', 'Result updated.');
  } catch { showAlert('error', 'Failed to update.'); }
  finally { savingRes.value = false; }
};

const deleteResult = async (param, resId) => {
  if (!confirm('Delete this result and its items?')) return;
  deletingId.value = resId;
  try {
    await axiosInstance.delete(`/maintenance/possible-results/${resId}`);
    param.results = param.results.filter(r => r.id !== resId);
    showAlert('success', 'Result deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

// ══════════════════════════════════════════════════════════════
// ITEMS — live backend CRUD
// ══════════════════════════════════════════════════════════════
const addItem = async (res) => {
  const row = newItemsMap.value[res.id];
  if (!row?.item_id) return;
  addingItemResId.value = res.id;
  try {
    const { data } = await axiosInstance.post('/maintenance/result-items', {
      maintenance_parameter_possible_result_id: res.id,
      item_id:     row.item_id,
      description: row.description || null,
    });
    res.items.push(data);
    newItemsMap.value[res.id] = { item_id: '', description: '' };
    showAlert('success', 'Item added.');
  } catch { showAlert('error', 'Failed to add item.'); }
  finally { addingItemResId.value = null; }
};

const deleteItem = async (res, itemId) => {
  if (!confirm('Remove this item?')) return;
  deletingId.value = itemId;
  try {
    await axiosInstance.delete(`/maintenance/result-items/${itemId}`);
    res.items = res.items.filter(i => i.id !== itemId);
    showAlert('success', 'Item removed.');
  } catch { showAlert('error', 'Failed to remove.'); }
  finally { deletingId.value = null; }
};

// ── Fetch lookups ──────────────────────────────────────────────
const fetchAssetsGroup = async () => {
  try {
    const res = await axiosInstance.get('/asset-groups?is_active=true');
    assetGroups.value = res.data.data ?? res.data;
  } catch (e) { console.error(e); }
};

const fetchSites = async () => {
  // TODO: enable when /location/form-data route exists on backend
  // try {
  //   const res = await axiosInstance.get('/location/form-data', {
  //     params: { type: ['WORKSHOP', 'STORE'] },
  //     paramsSerializer: p => new URLSearchParams(p).toString(),
  //   });
  //   sites.value = res.data.data ?? res.data;
  // } catch (e) { console.error(e); }
};

const fetchItems = async () => {
  try {
    const res = await axiosInstance.get('/maintenance/form-data');
    unitsOfMeasurements.value = res.data?.units_of_measurement ?? [];
    availableItems.value      = res.data?.items                ?? [];
    questionTypes.value       = res.data?.question_types       ?? [];
  } catch (e) { console.error(e); }
};

// ── Load category for editing ──────────────────────────────────
const loadCategory = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/maintenance/categories/${id}`, {
      params: { include: 'symptoms,parameters.options' }
    });
    draft.value = {
      id:             data.id,
      name:           data.name,
      asset_group_id: data.asset_group_id,
      site_id:        data.site_id      ?? '',
      scoped_site_id: data.scope_site_id ?? '',
      symptoms:   data.symptoms ?? [],
      parameters: (data.parameters ?? []).map(p => ({
        ...p,
        options: p.options ?? [],
        results: (p.options ?? p.possible_results ?? []).map(r => ({
          ...r,
          mapped_option_values: r.mapped_option_values ?? [],
          items: r.items ?? [],
        })),
      })),
    };
    savedSteps.value.add(0);
  } catch {
    showAlert('error', 'Failed to load category.');
  }
};

// ── Lifecycle ──────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchAssetsGroup(), fetchSites(), fetchItems()]);

  if (route.params.id) {
    await loadCategory(route.params.id);
  }
});
</script>

<style scoped>
/* Stepper */
.stepper-track { gap: 0; }
.stepper-connector {
  position: absolute; top: 22px; left: 5%; right: 5%;
  height: 2px; background: #dee2e6; z-index: 0;
}
.stepper-node { position: relative; z-index: 1; flex: 1; }
.step-bubble {
  width: 42px; height: 42px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .9rem;
  border: 2px solid #dee2e6; background: #fff; color: #adb5bd;
  transition: all .2s;
}
.stepper-node.is-active .step-bubble {
  background: #0d6efd; border-color: #0d6efd; color: #fff;
  box-shadow: 0 0 0 4px rgba(13,110,253,.15);
}
.stepper-node.is-done  .step-bubble,
.stepper-node.is-saved .step-bubble {
  background: #198754; border-color: #198754; color: #fff;
}
.step-title { font-size: .77rem; font-weight: 600; color: #495057; }
.stepper-node.is-active .step-title { color: #0d6efd; }
.stepper-node.is-done  .step-title,
.stepper-node.is-saved .step-title  { color: #198754; }
.step-sub   { font-size: .65rem; color: #adb5bd; }

/* Add row */
.add-row { border-style: dashed !important; }

/* Result card */
.result-card { transition: box-shadow .15s; }
.result-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.07); }
.result-header { border-bottom: 1px solid rgba(0,0,0,.06); min-height: 42px; }

/* Accordion */
.accordion-button::after { display: none; }
.accordion-button:not(.collapsed) { box-shadow: none; }

/* Sizes */
.x-small { font-size: .72rem; }
.btn-xs  { font-size: .7rem; line-height: 1.2; padding: .1rem .3rem; }
.step-icon { flex-shrink: 0; }
.alert-sm  { font-size: .82rem; }
</style>
