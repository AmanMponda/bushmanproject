<template>
  <div class="category-view">

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2.5rem;height:2.5rem" role="status"></div>
      <p class="text-muted mt-2 small">Loading...</p>
    </div>

    <template v-else-if="category">

      <!-- Breadcrumb -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <ul class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#">Maintenance</a></li>
          <li class="breadcrumb-item">
            <a href="#" @click.prevent="router.push('/module-settings/inspection-settings')">Categories</a>
          </li>
          <li class="breadcrumb-item active fw-semibold">{{ category.name }}</li>
        </ul>
        <button class="btn btn-outline-secondary btn-sm px-3 rounded-pill"
          @click="router.push('/module-settings/inspection-settings')">
          <i class="fa fa-arrow-left me-1"></i> Back
        </button>
      </div>

      <!-- Header Card -->
      <div class="card border-0 shadow-sm mb-3 header-card">
        <div class="card-body py-3 px-4">
          <div class="row align-items-center g-2">
            <div class="col-md-8">
              <div class="d-flex align-items-center gap-3">
                <div class="cat-icon bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                  <i class="fa fa-tools fa-lg text-primary"></i>
                </div>
                <div>
                  <div v-if="editingHeader" class="d-flex align-items-center gap-2 flex-wrap">
                    <input v-model="headerForm.name" class="form-control form-control-sm fw-bold"
                      style="max-width:240px" placeholder="Category name" />
                    <select v-model="headerForm.asset_group_id" class="form-select form-select-sm" style="max-width:170px">
                      <option v-for="ag in assetGroups" :key="ag.id" :value="ag.id">{{ ag.name }}</option>
                    </select>
                    <select v-model="headerForm.site_id" class="form-select form-select-sm" style="max-width:150px">
                      <option value="">Global</option>
                      <option v-for="site in sites" :key="site.id" :value="site.id">{{ site.name }}</option>
                    </select>
                    <button class="btn btn-success btn-sm px-3" @click="saveHeader" :disabled="savingHeader">
                      <i v-if="savingHeader" class="fa fa-spinner fa-spin me-1"></i>
                      <i v-else class="fa fa-check me-1"></i> Save
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" @click="editingHeader = false">
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                  <div v-else class="d-flex align-items-center gap-2 flex-wrap">
                    <h5 class="mb-0 fw-bold text-dark">{{ category.name }}</h5>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" @click="openEditHeader">
                      <i class="fa fa-edit small"></i>
                    </button>
                    <span class="badge bg-info bg-opacity-10 text-info">
                      <i class="fa fa-layer-group me-1 small"></i>{{ category.asset_group?.name ?? '—' }}
                    </span>
                    <span v-if="category.site" class="badge bg-secondary bg-opacity-10 text-secondary">
                      <i class="fa fa-map-marker-alt me-1 small"></i>{{ category.site.name }}
                    </span>
                    <span v-else class="badge bg-success bg-opacity-10 text-success">
                      <i class="fa fa-globe me-1 small"></i>Global
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="row g-2 text-center">
                <div class="col-4">
                  <div class="stat-box border rounded-2 py-2">
                    <div class="fw-bold fs-5 text-primary lh-1">{{ category.parameters?.length ?? 0 }}</div>
                    <div class="x-small text-muted">Params</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-box border rounded-2 py-2">
                    <div class="fw-bold fs-5 text-warning lh-1">{{ category.symptoms?.length ?? 0 }}</div>
                    <div class="x-small text-muted">Symptoms</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-box border rounded-2 py-2">
                    <div class="fw-bold fs-5 text-success lh-1">{{ totalResults }}</div>
                    <div class="x-small text-muted">Results</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Card -->
      <div class="card border-0 shadow-sm">
        <div class="card-header p-0 border-bottom bg-white">
          <ul class="d-flex flex-nowrap overflow-auto mb-0 ps-3 pt-2 list-unstyled gap-0">
            <li v-for="tab in tabs" :key="tab.key">
              <a href="#" class="tab-link px-4 py-2 d-block text-nowrap"
                :class="{ active: activeTab === tab.key }"
                @click.prevent="activeTab = tab.key">
                <i :class="tab.icon + ' me-1'"></i>{{ tab.label }}
                <span class="badge rounded-pill ms-1"
                  :class="activeTab === tab.key ? 'bg-primary' : 'bg-light text-muted border'">
                  {{ tab.count }}
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div class="card-body p-0">

          <!-- ══════════════════════════════════
               TAB: SYMPTOMS
          ══════════════════════════════════ -->
          <div v-show="activeTab === 'symptoms'" class="p-3">

            <!-- Form (add / edit) -->
            <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="fw-semibold small text-primary">
                  <i class="fa fa-pencil-alt me-1"></i>
                  {{ editSymptomId ? 'Edit Symptom' : 'Add Symptom' }}
                </span>
                <button v-if="editSymptomId" class="btn btn-xs btn-outline-secondary ms-auto"
                  @click="cancelSymptomEdit">
                  <i class="fa fa-times small"></i> Cancel
                </button>
              </div>
              <div class="row g-2 align-items-end">
                <div class="col-md-4">
                  <label class="form-label fw-semibold x-small mb-1">
                    Name <span class="text-danger">*</span>
                  </label>
                  <input v-model="symptomForm.name" type="text" class="form-control form-control-sm"
                    :class="{ 'is-invalid': symptomFormErr }"
                    placeholder="e.g. Engine Oil Dripping"
                    @keyup.enter="submitSymptomForm" />
                  <div v-if="symptomFormErr" class="invalid-feedback">{{ symptomFormErr }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold x-small mb-1">Description</label>
                  <input v-model="symptomForm.description" type="text" class="form-control form-control-sm"
                    placeholder="Optional details" @keyup.enter="submitSymptomForm" />
                </div>
                <div class="col-md-2">
                  <button class="btn btn-primary btn-sm w-100" @click="submitSymptomForm"
                    :disabled="savingSymptom">
                    <i v-if="savingSymptom" class="fa fa-spinner fa-spin me-1"></i>
                    <i v-else class="fa fa-check me-1"></i>
                    {{ editSymptomId ? 'Update' : 'Add' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Symptoms DataTable -->
            <StandardDataTable
              :columns="symptomColumns"
              :data="symptomRows"
              :loading="false"
              :filters="symptomFilters"
              :defaultPageSize="10"
              :disablePagination="false"
              :showDateFilters="false"
              :actionButtons="[]"
            >
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary py-0 px-2"
                    @click="startEditSymptom(row._raw)" title="Edit">
                    <i class="fa fa-edit small"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-2"
                    @click="deleteSymptom(row._raw.id)"
                    :disabled="deletingId === row._raw.id" title="Delete">
                    <i v-if="deletingId === row._raw.id" class="fa fa-spinner fa-spin small"></i>
                    <i v-else class="fa fa-trash small"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>

          <!-- ══════════════════════════════════
               TAB: PARAMETERS
          ══════════════════════════════════ -->
          <div v-show="activeTab === 'parameters'" class="p-3">

            <!-- Add / Edit Parameter Form -->
            <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="fw-semibold small text-primary">
                  <i class="fa fa-pencil-alt me-1"></i>
                  {{ editParamId ? 'Edit Parameter' : 'Add Parameter' }}
                </span>
                <button v-if="editParamId" class="btn btn-xs btn-outline-secondary ms-auto"
                  @click="cancelParamEdit">
                  <i class="fa fa-times small"></i> Cancel
                </button>
              </div>
              <div class="row g-2 align-items-end">
                <div class="col-md-3">
                  <label class="form-label fw-semibold x-small mb-1">
                    Name <span class="text-danger">*</span>
                  </label>
                  <input v-model="paramForm.name" type="text" class="form-control form-control-sm"
                    :class="{ 'is-invalid': paramFormErr }"
                    placeholder="e.g. Oil Level" />
                  <div v-if="paramFormErr" class="invalid-feedback">{{ paramFormErr }}</div>
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-semibold x-small mb-1">Type</label>
                  <select v-model="paramForm.question_type" class="form-select form-select-sm">
                    <option value="select">Select</option>
                    <option value="number">Number</option>
                    <option value="boolean">Yes / No</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-semibold x-small mb-1">Unit</label>
                  <input v-model="paramForm.unit" type="text" class="form-control form-control-sm" placeholder="°C, L…" />
                </div>
                <div class="col-md-2 d-flex align-items-end pb-1">
                  <div class="form-check form-switch ms-1 mb-1">
                    <input v-model="paramForm.active" class="form-check-input" type="checkbox" id="pfActive" />
                    <label class="form-check-label x-small" for="pfActive">Active</label>
                  </div>
                </div>
                <div class="col-md-3 d-flex align-items-end">
                  <button class="btn btn-primary btn-sm w-100" @click="submitParamForm"
                    :disabled="savingParam">
                    <i v-if="savingParam" class="fa fa-spinner fa-spin me-1"></i>
                    <i v-else class="fa fa-check me-1"></i>
                    {{ editParamId ? 'Update' : 'Add' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Parameters DataTable -->
            <StandardDataTable
              :columns="paramColumns"
              :data="paramRows"
              :loading="false"
              :filters="paramFilters"
              :defaultPageSize="10"
              :disablePagination="false"
              :showDateFilters="false"
              :actionButtons="[]"
            >
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary py-0 px-2"
                    @click="startEditParam(row._raw)" title="Edit">
                    <i class="fa fa-edit small"></i>
                  </button>
                  <button class="btn btn-sm btn-info py-0 px-2"
                    @click="openParamDetail(row._raw)" title="Manage Options & Results">
                    <i class="fa fa-cog small"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-2"
                    @click="deleteParam(row._raw.id)"
                    :disabled="deletingId === row._raw.id" title="Delete">
                    <i v-if="deletingId === row._raw.id" class="fa fa-spinner fa-spin small"></i>
                    <i v-else class="fa fa-trash small"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>

          </div>

          <!-- ══════════════════════════════════
               TAB: OPTIONS + RESULTS (inline panel)
          ══════════════════════════════════ -->
          <div v-show="activeTab === 'param-detail'" class="p-3">

            <!-- Panel header -->
            <div class="d-flex align-items-center gap-2 mb-3">
              <button class="btn btn-sm btn-outline-secondary px-2 py-0"
                @click="activeTab = 'parameters'">
                <i class="fa fa-arrow-left small"></i>
              </button>
              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold text-dark">{{ activeParam?.name }}</span>
                <span class="badge" :class="qTypeBadge(activeParam?.question_type)">
                  {{ activeParam?.question_type }}
                </span>
                <span v-if="activeParam?.unit" class="badge bg-light border text-muted">
                  {{ activeParam.unit }}
                </span>
              </div>
            </div>

            <div class="row g-3">

              <!-- LEFT: Options -->
              <div class="col-md-5">
                <div class="card border rounded-3 h-100">
                  <div class="card-header bg-white py-2 px-3 border-bottom">
                    <span class="fw-semibold small">
                      <i class="fa fa-list-ul text-info me-1"></i>Options
                    </span>
                    <span class="badge bg-info bg-opacity-10 text-info ms-1">
                      {{ activeParam?.options?.length ?? 0 }}
                    </span>
                  </div>
                  <div class="card-body p-3">

                    <div v-if="activeParam?.question_type !== 'select'"
                      class="text-muted x-small fst-italic text-center py-3">
                      Options apply to select-type only.
                    </div>

                    <template v-else>
                      <!-- Option Form -->
                      <div class="add-row rounded-3 border border-dashed p-2 mb-3 bg-light">
                        <div class="d-flex align-items-center gap-2 mb-2">
                          <span class="fw-semibold x-small text-primary">
                            {{ editOptId ? 'Edit Option' : 'Add Option' }}
                          </span>
                          <button v-if="editOptId" class="btn btn-xs btn-outline-secondary ms-auto"
                            @click="cancelOptEdit">
                            <i class="fa fa-times" style="font-size:.6rem"></i>
                          </button>
                        </div>
                        <div class="mb-2">
                          <label class="form-label fw-semibold x-small mb-1">Label *</label>
                          <input v-model="optForm.label" type="text" class="form-control form-control-sm"
                            placeholder="e.g. Very Low"
                            @input="autoOptVal" @keyup.enter="submitOptForm" />
                        </div>
                        <div class="mb-2">
                          <label class="form-label fw-semibold x-small mb-1">Value *</label>
                          <input v-model="optForm.value" type="text" class="form-control form-control-sm"
                            placeholder="very_low" />
                        </div>
                        <div class="mb-2">
                          <SeveritySlider v-model="optForm.severity" />  
                        </div>
                        <button class="btn btn-primary btn-sm w-100" @click="submitOptForm"
                          :disabled="savingOpt">
                          <i v-if="savingOpt" class="fa fa-spinner fa-spin me-1"></i>
                          <i v-else class="fa fa-check me-1"></i>
                          {{ editOptId ? 'Update' : 'Add' }}
                        </button>
                      </div>

                      <!-- Options DataTable -->
                      <StandardDataTable
                        :columns="optColumns"
                        :data="optRows"
                        :loading="false"
                        :filters="optFilters"
                        :defaultPageSize="5"
                        :disablePagination="false"
                        :showDateFilters="false"
                        :actionButtons="[]"
                      >
                        <template #actions="{ row }">
                          <div class="d-flex gap-1">
                            <button class="btn btn-xs btn-outline-secondary py-0 px-1"
                              @click="startEditOpt(row._raw)">
                              <i class="fa fa-edit" style="font-size:.6rem"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-danger py-0 px-1"
                              @click="deleteOption(row._raw.id)"
                              :disabled="deletingId === row._raw.id">
                              <i v-if="deletingId === row._raw.id" class="fa fa-spinner fa-spin" style="font-size:.6rem"></i>
                              <i v-else class="fa fa-trash" style="font-size:.6rem"></i>
                            </button>
                          </div>
                        </template>
                      </StandardDataTable>
                    </template>
                  </div>
                </div>
              </div>

              <!-- RIGHT: Results -->
              <div class="col-md-7">
                <div class="card border rounded-3 h-100">
                  <div class="card-header bg-white py-2 px-3 border-bottom">
                    <span class="fw-semibold small">
                      <i class="fa fa-clipboard-check text-success me-1"></i>Possible Results
                    </span>
                    <span class="badge bg-success bg-opacity-10 text-success ms-1">
                      {{ activeParam?.possible_results?.length ?? 0 }}
                    </span>
                  </div>
                  <div class="card-body p-3">

                    <!-- Result Form -->
                    <div class="add-row rounded-3 border border-dashed p-2 mb-3 bg-light">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="fw-semibold x-small text-primary">
                          {{ editResId ? 'Edit Result' : 'Add Result' }}
                        </span>
                        <button v-if="editResId" class="btn btn-xs btn-outline-secondary ms-auto"
                          @click="cancelResEdit">
                          <i class="fa fa-times" style="font-size:.6rem"></i>
                        </button>
                      </div>
                      <div class="mb-2">
                        <label class="form-label fw-semibold x-small mb-1">Result Name *</label>
                        <input v-model="resForm.name" type="text" class="form-control form-control-sm"
                          placeholder="e.g. Top Up Oil" @keyup.enter="submitResForm" />
                      </div>
                      <div v-if="activeParam?.options?.length" class="mb-2">
                        <label class="form-label fw-semibold x-small mb-1">Triggered by Options</label>
                        <div class="d-flex flex-wrap gap-2">
                          <div v-for="opt in activeParam.options" :key="opt.id"
                            class="form-check form-check-inline mb-0">
                            <input class="form-check-input" type="checkbox"
                              :id="'rf_' + opt.id"
                              :value="opt.value"
                              v-model="resForm.mapped_option_values" />
                            <label class="form-check-label x-small" :for="'rf_' + opt.id">
                              <span class="badge bg-light text-dark border">{{ opt.label }}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <button class="btn btn-success btn-sm w-100" @click="submitResForm"
                        :disabled="savingRes">
                        <i v-if="savingRes" class="fa fa-spinner fa-spin me-1"></i>
                        <i v-else class="fa fa-check me-1"></i>
                        {{ editResId ? 'Update' : 'Add' }}
                      </button>
                    </div>

                    <!-- Results DataTable -->
                    <StandardDataTable
                      :columns="resColumns"
                      :data="resRows"
                      :loading="false"
                      :filters="resFilters"
                      :defaultPageSize="5"
                      :disablePagination="false"
                      :showDateFilters="false"
                      :actionButtons="[]"
                    >
                      <template #actions="{ row }">
                        <div class="d-flex gap-1">
                          <button class="btn btn-xs btn-outline-secondary py-0 px-1"
                            @click="startEditRes(row._raw)" title="Edit">
                            <i class="fa fa-edit" style="font-size:.6rem"></i>
                          </button>
                          <button class="btn btn-xs btn-info py-0 px-1"
                            @click="openResItems(row._raw)" title="Manage Items">
                            <i class="fa fa-box" style="font-size:.6rem"></i>
                          </button>
                          <button class="btn btn-xs btn-outline-danger py-0 px-1"
                            @click="deleteResult(row._raw.id)"
                            :disabled="deletingId === row._raw.id">
                            <i v-if="deletingId === row._raw.id" class="fa fa-spinner fa-spin" style="font-size:.6rem"></i>
                            <i v-else class="fa fa-trash" style="font-size:.6rem"></i>
                          </button>
                        </div>
                      </template>
                    </StandardDataTable>

                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════
               TAB: RESULT ITEMS
          ══════════════════════════════════ -->
          <div v-show="activeTab === 'result-items'" class="p-3">
            <!-- Panel header -->
            <div class="d-flex align-items-center gap-2 mb-3">
              <button class="btn btn-sm btn-outline-secondary px-2 py-0"
                @click="activeTab = 'param-detail'">
                <i class="fa fa-arrow-left small"></i>
              </button>
              <div>
                <span class="fw-bold text-dark">{{ activeParam?.name }}</span>
                <i class="fa fa-chevron-right text-muted mx-2 small"></i>
                <span class="fw-semibold">{{ activeResult?.name }}</span>
                <span class="badge bg-secondary bg-opacity-10 text-secondary ms-2">
                  {{ activeResult?.items?.length ?? 0 }} items
                </span>
              </div>
            </div>

            <!-- Item Form -->
            <div class="add-row rounded-3 border border-dashed p-3 mb-3 bg-light">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="fw-semibold small text-primary">
                  <i class="fa fa-pencil-alt me-1"></i>Add Item
                </span>
              </div>
              <div class="row g-2 align-items-end">
                <div class="col-md-5">
                  <label class="form-label fw-semibold x-small mb-1">
                    Item / Part <span class="text-danger">*</span>
                  </label>
                  <select v-model="itemForm.item_id" class="form-select form-select-sm">
                    <option value="">-- Select Item --</option>
                    <option v-for="it in availableItems" :key="it.id" :value="it.id">
                      {{ it.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-5">
                  <label class="form-label fw-semibold x-small mb-1">Notes</label>
                  <input v-model="itemForm.description" type="text" class="form-control form-control-sm"
                    placeholder="e.g. Use synthetic oil only"
                    @keyup.enter="submitItemForm" />
                </div>
                <div class="col-md-2">
                  <button class="btn btn-primary btn-sm w-100" @click="submitItemForm"
                    :disabled="savingItem">
                    <i v-if="savingItem" class="fa fa-spinner fa-spin me-1"></i>
                    <i v-else class="fa fa-plus me-1"></i> Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Items DataTable -->
            <StandardDataTable
              :columns="itemColumns"
              :data="itemRows"
              :loading="false"
              :filters="itemFilters"
              :defaultPageSize="10"
              :disablePagination="false"
              :showDateFilters="false"
              :actionButtons="[]"
            >
              <template #actions="{ row }">
                <button class="btn btn-xs btn-outline-danger py-0 px-1"
                  @click="deleteItem(row._raw.id)"
                  :disabled="deletingId === row._raw.id">
                  <i v-if="deletingId === row._raw.id" class="fa fa-spinner fa-spin" style="font-size:.6rem"></i>
                  <i v-else class="fa fa-times" style="font-size:.6rem"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>

        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else-if="!loading" class="text-center py-5">
      <i class="fa fa-inbox fa-3x text-muted opacity-25 mb-3 d-block"></i>
      <h5 class="text-muted">Category not found.</h5>
      <button class="btn btn-outline-primary btn-sm mt-2"
        @click="router.push('/module-settings/inspection-settings')">
        <i class="fa fa-arrow-left me-1"></i> Back to List
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SeveritySlider from '@/components/SeveritySlider.vue';
import axios from 'axios';
import { MACARGO_API_URL_2 } from '@/config/config';
import { useNotification } from '@/composables/notification';
import { useAuthStore } from '@/stores/auth';
import StandardDataTable from '@/components/plugins/StandardDataTable.vue';

const authStore  = useAuthStore();
const { showAlert } = useNotification();
const route  = useRoute();
const router = useRouter();

const userId   = authStore.user?.id   || '';
const username = authStore.user?.username || '';

const axiosInstance = axios.create({
  baseURL: MACARGO_API_URL_2,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id':  userId,
    'X-Username': username,
  },
});

// ── State ──────────────────────────────────────────────────────
const loading        = ref(false);
const category       = ref(null);
const activeTab      = ref('symptoms');
const assetGroups    = ref([]);
const sites          = ref([]);
const availableItems = ref([]);
const deletingId     = ref(null);

// Active param / result for drill-down tabs
const activeParam  = ref(null);
const activeResult = ref(null);

// ── Tabs ───────────────────────────────────────────────────────
const tabs = computed(() => [
  { key: 'symptoms',     label: 'Symptoms',   icon: 'fa fa-exclamation-triangle', count: category.value?.symptoms?.length ?? 0 },
  { key: 'parameters',   label: 'Parameters', icon: 'fa fa-sliders-h',            count: category.value?.parameters?.length ?? 0 },
  // param-detail and result-items are hidden tabs (no nav link), opened via drill-down
]);

const totalResults = computed(() =>
  category.value?.parameters?.reduce((s, p) => s + (p.possible_results?.length ?? 0), 0) ?? 0
);

// ── Helpers ────────────────────────────────────────────────────
const qTypeBadge = (t) => ({
  select:  'bg-info bg-opacity-10 text-info',
  number:  'bg-success bg-opacity-10 text-success',
  boolean: 'bg-warning bg-opacity-10 text-warning',
  text:    'bg-secondary bg-opacity-10 text-secondary',
}[t] ?? 'bg-light text-muted');

const sevBadge = (s) => {
  if (s == null) return 'bg-light text-muted';
  if (s === 0)   return 'bg-success bg-opacity-10 text-success';
  if (s <= 2)    return 'bg-info bg-opacity-10 text-info';
  if (s <= 4)    return 'bg-warning bg-opacity-10 text-warning';
  return 'bg-danger bg-opacity-10 text-danger';
};

const getOptLabelByValue = (param, value) =>
  param?.options?.find(o => o.value === value)?.label ?? value;

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════
const editingHeader = ref(false);
const savingHeader  = ref(false);
const headerForm    = ref({ name: '', asset_group_id: '', site_id: '' });

const openEditHeader = () => {
  headerForm.value = {
    name:           category.value.name,
    asset_group_id: category.value.asset_group_id,
    site_id:        category.value.site_id ?? '',
  };
  editingHeader.value = true;
};

const saveHeader = async () => {
  if (!headerForm.value.name?.trim()) return;
  savingHeader.value = true;
  try {
    const { data } = await axiosInstance.put(
      `/maintenance/categories/${category.value.id}`, headerForm.value
    );
    category.value.name           = data.name;
    category.value.asset_group    = data.asset_group;
    category.value.asset_group_id = data.asset_group_id;
    category.value.site           = data.site;
    category.value.site_id        = data.site_id;
    editingHeader.value = false;
    showAlert('success', 'Category updated.');
  } catch { showAlert('error', 'Failed to update category.'); }
  finally { savingHeader.value = false; }
};

// ══════════════════════════════════════════════════════════════
// SYMPTOMS — DataTable config
// ══════════════════════════════════════════════════════════════
const symptomFilters = ref({ search: '', pageSize: 10, currentPage: 1 });
const symptomColumns = [
  { key: 'sno',         label: '#',           visible: true, sortable: false },
  { key: 'name',        label: 'Symptom',     visible: true, sortable: true  },
  { key: 'description', label: 'Description', visible: true, sortable: false },
  { key: 'actions',     label: 'Actions',     visible: true, sortable: false },
];
const symptomRows = computed(() =>
  (category.value?.symptoms ?? []).map((s, i) => ({
    sno:         i + 1,
    name:        s.name,
    description: s.description || '—',
    _raw: s,
  }))
);

// Symptom form (shared add + edit)
const editSymptomId = ref(null);
const symptomFormErr = ref('');
const savingSymptom  = ref(false);
const symptomForm    = ref({ name: '', description: '' });

const startEditSymptom = (s) => {
  editSymptomId.value = s.id;
  symptomForm.value   = { name: s.name, description: s.description ?? '' };
  symptomFormErr.value = '';
};
const cancelSymptomEdit = () => {
  editSymptomId.value  = null;
  symptomForm.value    = { name: '', description: '' };
  symptomFormErr.value = '';
};

const submitSymptomForm = async () => {
  symptomFormErr.value = '';
  if (!symptomForm.value.name?.trim()) { symptomFormErr.value = 'Required'; return; }
  savingSymptom.value = true;
  try {
    if (editSymptomId.value) {
      // UPDATE
      const { data } = await axiosInstance.put(
        `/maintenance/symptoms/${editSymptomId.value}`, symptomForm.value
      );
      const idx = category.value.symptoms.findIndex(s => s.id === editSymptomId.value);
      if (idx !== -1) category.value.symptoms[idx] = data;
      showAlert('success', 'Symptom updated.');
    } else {
      // CREATE
      const { data } = await axiosInstance.post('/maintenance/symptoms', {
        maintenance_category_id: category.value.id,
        name:                    symptomForm.value.name,
        description:             symptomForm.value.description || null,
      });
      if (!category.value.symptoms) category.value.symptoms = [];
      category.value.symptoms.push(data?.data || data);
      showAlert('success', 'Symptom added.');
    }
    cancelSymptomEdit();
  } catch { showAlert('error', 'Failed to save symptom.'); }
  finally { savingSymptom.value = false; }
};

const deleteSymptom = async (id) => {
  if (!confirm('Delete this symptom?')) return;
  deletingId.value = id;
  try {
    await axiosInstance.delete(`/maintenance/symptoms/${id}`);
    category.value.symptoms = category.value.symptoms.filter(s => s.id !== id);
    showAlert('success', 'Symptom deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

// ══════════════════════════════════════════════════════════════
// PARAMETERS — DataTable config
// ══════════════════════════════════════════════════════════════
const paramFilters = ref({ search: '', pageSize: 10, currentPage: 1 });
const paramColumns = [
  { key: 'sno',           label: '#',      visible: true, sortable: false },
  { key: 'name',          label: 'Name',   visible: true, sortable: true  },
  { key: 'question_type', label: 'Type',   visible: true, sortable: false },
  { key: 'unit',          label: 'Unit',   visible: true, sortable: false },
  { key: 'active',        label: 'Active', visible: true, sortable: false },
  { key: 'options_count', label: 'Options',  visible: true, sortable: false },
  { key: 'results_count', label: 'Results',  visible: true, sortable: false },
  { key: 'actions',       label: 'Actions',  visible: true, sortable: false },
];
const paramRows = computed(() =>
  (category.value?.parameters ?? []).map((p, i) => ({
    sno:           i + 1,
    name:          p.name,
    question_type: p.question_type,
    unit:          p.unit || '—',
    active:        p.active ? 'Yes' : 'No',
    options_count: p.options?.length ?? 0,
    results_count: p.possible_results?.length ?? 0,
    _raw: p,
  }))
);

// Parameter form (shared add + edit)
const editParamId  = ref(null);
const paramFormErr = ref('');
const savingParam  = ref(false);
const paramForm    = ref({ name: '', question_type: 'select', unit: '', active: true });

const startEditParam = (p) => {
  editParamId.value  = p.id;
  paramForm.value    = { name: p.name, question_type: p.question_type, unit: p.unit ?? '', active: p.active };
  paramFormErr.value = '';
};
const cancelParamEdit = () => {
  editParamId.value  = null;
  paramForm.value    = { name: '', question_type: 'select', unit: '', active: true };
  paramFormErr.value = '';
};

const submitParamForm = async () => {
  paramFormErr.value = '';
  if (!paramForm.value.name?.trim()) { paramFormErr.value = 'Required'; return; }
  savingParam.value = true;
  try {
    if (editParamId.value) {
      // UPDATE
      const { data } = await axiosInstance.put(
        `/maintenance/parameters/${editParamId.value}`, paramForm.value
      );
      const idx = category.value.parameters.findIndex(p => p.id === editParamId.value);
      if (idx !== -1) {
        category.value.parameters[idx].name          = data.name;
        category.value.parameters[idx].question_type = data.question_type;
        category.value.parameters[idx].unit          = data.unit;
        category.value.parameters[idx].active        = data.active;
      }
      showAlert('success', 'Parameter updated.');
    } else {
      // CREATE
      const { data } = await axiosInstance.post('/maintenance/parameters', {
        maintenance_category_id: category.value.id,
        ...paramForm.value,
        unit: paramForm.value.unit || null,
      });
      data.options          = [];
      data.possible_results = [];
      category.value.parameters.push(data);
      showAlert('success', 'Parameter added.');
    }
    cancelParamEdit();
  } catch { showAlert('error', 'Failed to save parameter.'); }
  finally { savingParam.value = false; }
};

const deleteParam = async (id) => {
  if (!confirm('Delete parameter and all its options/results/items?')) return;
  deletingId.value = id;
  try {
    await axiosInstance.delete(`/maintenance/parameters/${id}`);
    category.value.parameters = category.value.parameters.filter(p => p.id !== id);
    if (activeParam.value?.id === id) { activeParam.value = null; activeTab.value = 'parameters'; }
    showAlert('success', 'Parameter deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

const openParamDetail = (param) => {
  activeParam.value = param;
  cancelOptEdit();
  cancelResEdit();
  activeTab.value = 'param-detail';
};

// ══════════════════════════════════════════════════════════════
// OPTIONS — DataTable config
// ══════════════════════════════════════════════════════════════
const optFilters = ref({ search: '', pageSize: 5, currentPage: 1 });
const optColumns = [
  { key: 'label',    label: 'Label',    visible: true, sortable: false },
  { key: 'value',    label: 'Value',    visible: true, sortable: false },
  { key: 'severity', label: 'Severity', visible: true, sortable: false },
  { key: 'actions',  label: '',         visible: true, sortable: false },
];
const optRows = computed(() =>
  (activeParam.value?.options ?? []).map(o => ({
    label:    o.label,
    value:    o.value,
    severity: o.severity ?? '—',
    _raw: o,
  }))
);

// Option form
const editOptId  = ref(null);
const savingOpt  = ref(false);
const optForm    = ref({ label: '', value: '', severity: 0 });

const autoOptVal = () => {
  if (!editOptId.value) {
    optForm.value.value = optForm.value.label
      .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
};

const startEditOpt = (opt) => {
  editOptId.value = opt.id;
  optForm.value   = { label: opt.label, value: opt.value, severity: opt.severity ?? 0 };
};
const cancelOptEdit = () => {
  editOptId.value = null;
  optForm.value   = { label: '', value: '', severity: 0 };
};

const submitOptForm = async () => {
  if (!optForm.value.label?.trim() || !optForm.value.value?.trim()) return;
  savingOpt.value = true;
  try {
    if (editOptId.value) {
      const { data } = await axiosInstance.put(
        `/maintenance/parameter-options/${editOptId.value}`, optForm.value
      );
      const idx = activeParam.value.options.findIndex(o => o.id === editOptId.value);
      if (idx !== -1) activeParam.value.options[idx] = data;
      showAlert('success', 'Option updated.');
    } else {
      const { data } = await axiosInstance.post('/maintenance/parameter-options', {
        maintenance_parameter_id: activeParam.value.id,
        ...optForm.value,
        severity: optForm.value.severity ?? null,
      });
      if (!activeParam.value.options) activeParam.value.options = [];
      activeParam.value.options.push(data);
      showAlert('success', 'Option added.');
    }
    cancelOptEdit();
  } catch { showAlert('error', 'Failed to save option.'); }
  finally { savingOpt.value = false; }
};

const deleteOption = async (optId) => {
  if (!confirm('Delete this option?')) return;
  deletingId.value = optId;
  try {
    await axiosInstance.delete(`/maintenance/parameter-options/${optId}`);
    activeParam.value.options = activeParam.value.options.filter(o => o.id !== optId);
    showAlert('success', 'Option deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

// ══════════════════════════════════════════════════════════════
// POSSIBLE RESULTS — DataTable config
// ══════════════════════════════════════════════════════════════
const resFilters = ref({ search: '', pageSize: 5, currentPage: 1 });
const resColumns = [
  { key: 'name',         label: 'Result',      visible: true, sortable: false },
  { key: 'triggered_by', label: 'Triggered by', visible: true, sortable: false },
  { key: 'items_count',  label: 'Items',        visible: true, sortable: false },
  { key: 'actions',      label: '',             visible: true, sortable: false },
];
const resRows = computed(() =>
  (activeParam.value?.possible_results ?? []).map(r => ({
    name:         r.name,
    triggered_by: (r.mapped_option_values ?? [])
      .map(v => getOptLabelByValue(activeParam.value, v))
      .join(', ') || '—',
    items_count:  r.items?.length ?? 0,
    _raw: r,
  }))
);

// Result form
const editResId  = ref(null);
const savingRes  = ref(false);
const resForm    = ref({ name: '', mapped_option_values: [] });

const startEditRes = (res) => {
  editResId.value = res.id;
  resForm.value   = { name: res.name, mapped_option_values: [...(res.mapped_option_values ?? [])] };
};
const cancelResEdit = () => {
  editResId.value = null;
  resForm.value   = { name: '', mapped_option_values: [] };
};

const submitResForm = async () => {
  if (!resForm.value.name?.trim()) return;
  savingRes.value = true;
  try {
    if (editResId.value) {
      const { data } = await axiosInstance.put(
        `/maintenance/possible-results/${editResId.value}`, resForm.value
      );
      const idx = activeParam.value.possible_results.findIndex(r => r.id === editResId.value);
      if (idx !== -1) {
        activeParam.value.possible_results[idx].name                = data.name;
        activeParam.value.possible_results[idx].mapped_option_values = data.mapped_option_values;
      }
      showAlert('success', 'Result updated.');
    } else {
      const { data } = await axiosInstance.post('/maintenance/possible-results', {
        maintenance_parameter_id: activeParam.value.id,
        ...resForm.value,
      });
      data.items = [];
      if (!activeParam.value.possible_results) activeParam.value.possible_results = [];
      activeParam.value.possible_results.push(data);
      showAlert('success', 'Result added.');
    }
    cancelResEdit();
  } catch { showAlert('error', 'Failed to save result.'); }
  finally { savingRes.value = false; }
};

const deleteResult = async (resId) => {
  if (!confirm('Delete this result and its items?')) return;
  deletingId.value = resId;
  try {
    await axiosInstance.delete(`/maintenance/possible-results/${resId}`);
    activeParam.value.possible_results =
      activeParam.value.possible_results.filter(r => r.id !== resId);
    if (activeResult.value?.id === resId) { activeResult.value = null; }
    showAlert('success', 'Result deleted.');
  } catch { showAlert('error', 'Failed to delete.'); }
  finally { deletingId.value = null; }
};

const openResItems = (result) => {
  activeResult.value = result;
  itemForm.value     = { item_id: '', description: '' };
  activeTab.value    = 'result-items';
};

// ══════════════════════════════════════════════════════════════
// RESULT ITEMS — DataTable config
// ══════════════════════════════════════════════════════════════
const itemFilters = ref({ search: '', pageSize: 10, currentPage: 1 });
const itemColumns = [
  { key: 'sno',         label: '#',     visible: true, sortable: false },
  { key: 'item_name',   label: 'Item',  visible: true, sortable: false },
  { key: 'description', label: 'Notes', visible: true, sortable: false },
  { key: 'actions',     label: '',      visible: true, sortable: false },
];
const itemRows = computed(() =>
  (activeResult.value?.items ?? []).map((itm, i) => ({
    sno:         i + 1,
    item_name:   itm.item?.name ?? '—',
    description: itm.description || '—',
    _raw: itm,
  }))
);

const savingItem = ref(false);
const itemForm   = ref({ item_id: '', description: '' });

const submitItemForm = async () => {
  if (!itemForm.value.item_id) return;
  savingItem.value = true;
  try {
    const { data } = await axiosInstance.post('/maintenance/result-items', {
      maintenance_parameter_possible_result_id: activeResult.value.id,
      item_id:     itemForm.value.item_id,
      description: itemForm.value.description || null,
    });
    if (!activeResult.value.items) activeResult.value.items = [];
    activeResult.value.items.push(data);
    itemForm.value = { item_id: '', description: '' };
    showAlert('success', 'Item added.');
  } catch { showAlert('error', 'Failed to add item.'); }
  finally { savingItem.value = false; }
};

const deleteItem = async (itemId) => {
  if (!confirm('Remove this item?')) return;
  deletingId.value = itemId;
  try {
    await axiosInstance.delete(`/maintenance/result-items/${itemId}`);
    activeResult.value.items = activeResult.value.items.filter(i => i.id !== itemId);
    showAlert('success', 'Item removed.');
  } catch { showAlert('error', 'Failed to remove.'); }
  finally { deletingId.value = null; }
};

// ── Fetch ──────────────────────────────────────────────────────
const fetchCategory = async () => {
  loading.value = true;
  try {
    const { data } = await axiosInstance.get(`/maintenance/categories/${route.params.id}`, {
      params: { include: 'symptoms,parameters.options' }
    });
    const cat = data?.data || data;
    if (!cat.symptoms) cat.symptoms = [];
    if (!cat.parameters) cat.parameters = [];
    // Map API's 'options' to 'possible_results' for local usage
    cat.parameters.forEach(p => {
      if (!p.possible_results && p.options) p.possible_results = p.options;
      if (!p.possible_results) p.possible_results = [];
    });
    category.value = cat;
  } catch (e) {
    console.error(e);
    showAlert('error', 'Failed to load category.');
  } finally {
    loading.value = false;
  }
};

const fetchLookups = async () => {
  try {
    const [ag, st, it] = await Promise.all([
      axiosInstance.get('/asset-groups'),
      axiosInstance.get('/sites'),
      axiosInstance.get('/items'),
    ]);
    assetGroups.value    = ag.data.data ?? ag.data;
    sites.value          = st.data.data ?? st.data;
    availableItems.value = it.data.data ?? it.data;
  } catch (e) { console.error('Lookup error', e); }
};

onMounted(() => Promise.all([fetchCategory(), fetchLookups()]));
</script>

<style scoped>
/* Tab nav */
.tab-link {
  border-bottom: 3px solid transparent;
  color: #6c757d;
  font-size: .875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all .2s;
}
.tab-link:hover  { color: #0d6efd; }
.tab-link.active { color: #0d6efd; border-bottom-color: #0d6efd; }

/* Header */
.header-card { border-left: 4px solid #0d6efd !important; }
.cat-icon { width: 52px; height: 52px; }

/* Stats */
.stat-box { transition: transform .2s; }
.stat-box:hover { transform: translateY(-2px); box-shadow: 0 3px 10px rgba(0,0,0,.06); }

/* Add row */
.add-row { border-style: dashed !important; }

/* Accordion */
.accordion-button::after { display: none; }
.accordion-button:not(.collapsed) { box-shadow: none; }

/* Micro sizes */
.x-small { font-size: .75rem; }
.btn-xs { font-size: .72rem; line-height: 1.2; padding: .1rem .35rem; }
</style>