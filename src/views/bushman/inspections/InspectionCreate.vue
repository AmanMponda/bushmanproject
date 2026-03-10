<template>
  <FormPageLayout
    title="Create Inspection"
    icon="fa fa-clipboard-check"
    :breadcrumbs="[
      { label: 'Inspections', to: '/inspections' },
      { label: 'New Inspection' }
    ]"
    layout="single"
  >
    <form @submit.prevent="handleSubmit">
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="row g-3">
            <!-- Asset -->
            <div class="col-md-4">
              <label class="form-label">Asset <span class="text-danger">*</span></label>
              <Multiselect
                v-model="form.accountingDimension"
                :options="combinedDimensions"
                :custom-label="dimensionLabel"
                track-by="_uid"
                :group-values="'items'"
                :group-label="'group'"
                :group-select="false"
                placeholder="Search and select asset..."
                :loading="loadingDimensions"
                :disabled="submitting"
                @search-change="searchDimensions"
              />
              <div v-if="errors.accounting_dimensions" class="text-danger small mt-1">{{ errors.accounting_dimensions }}</div>
            </div>

            <!-- Trailer ( is optional) -->
             <!-- include those with trailer only -->
            <div class="col-md-4">
              <label class="form-label">Trailer <span class="text-muted small">(optional)</span></label>
              <Multiselect
                v-model="form.trailer"
                :options="trailers"
                :custom-label="vehicleLabel"
                track-by="id"
                placeholder="Select trailer..."
                :loading="loadingTrailers"
                :disabled="submitting"
                @search-change="searchTrailers"
              />
            </div>

            <!-- Inspector -->
            <div class="col-md-4">
              <label class="form-label">Inspector <span class="text-danger">*</span></label>
              <Multiselect
                v-model="form.inspector"
                :options="employees"
                :custom-label="employeeLabel"
                track-by="id"
                placeholder="Select inspector..."
                :loading="loadingEmployees"
                :disabled="submitting"
                @search-change="searchEmployees"
              />
              <div v-if="errors.inspector_id" class="text-danger small mt-1">{{ errors.inspector_id }}</div>
            </div>

            <!-- Inspection Date -->
            <div class="col-md-4">
              <label class="form-label">Inspection Date <span class="text-danger">*</span></label>
              <input
                v-model="form.inspected_at"
                type="datetime-local"
                class="form-control"
                :disabled="submitting"
              />
              <div v-if="errors.inspected_at" class="text-danger small mt-1">{{ errors.inspected_at }}</div>
            </div>

            <!-- Odometer Reading -->
            <div class="col-md-4">
              <label class="form-label">Odometer Reading <span class="text-danger">*</span></label>
              <input
                v-model.number="form.odometerReading"
                type="number"
                class="form-control"
                placeholder="Enter odometer reading"
                :disabled="submitting"
                min="0"
                required
              />
              <div v-if="errors.odometer_reading" class="text-danger small mt-1">{{ errors.odometer_reading }}</div>
            </div>

            <!-- Handler -->
             <!-- for the handlers -->
            <div v-if="form.accountingDimension" class="col-md-4">
              <label class="form-label">Handler <span class="text-danger">*</span></label>
              <Multiselect
                v-model="dimensionHandler"
                :options="employees"
                :custom-label="employeeLabel"
                track-by="id"
                placeholder="Select handler..."
                :disabled="submitting"
                @search-change="searchEmployees"
              />
              <div v-if="errors.handler_id" class="text-danger small mt-1">{{ errors.handler_id }}</div>
            </div>

            <!-- Template (optional) -->
            <div class="col-md-4">
              <label class="form-label">Template <span class="text-muted small">(optional)</span></label>
              <Multiselect
                v-model="form.template"
                :options="templates"
                label="name"
                track-by="id"
                placeholder="Select template..."
                :loading="loadingTemplates"
                :disabled="submitting"
                @search-change="searchTemplates"
              />
              <div v-if="errors.inspection_template_id" class="text-danger small mt-1">{{ errors.inspection_template_id }}</div>
            </div>

            <!-- Checklist Section (when template selected) -->
            <div v-if="form.template && loadingParams" class="col-12">
              <div class="d-flex align-items-center border rounded px-3 py-2 bg-light">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                <span class="text-muted small">Loading checklist...</span>
              </div>
            </div>
            <div v-else-if="form.template && templateParameters.length > 0" class="col-12">
              <!-- Progress -->
              <div class="d-flex align-items-center justify-content-between mb-2">
                <label class="form-label fw-semibold mb-0">
                  <i class="fa fa-clipboard-check text-primary me-1"></i> Inspection Checklist
                </label>
                <span class="badge bg-primary">{{ checklistCompletedCount }} / {{ templateParameters.length }} completed</span>
              </div>
              <div class="progress mb-3" style="height: 5px;">
                <div class="progress-bar bg-success" :style="{ width: checklistProgressPercent + '%' }"></div>
              </div>

              <!-- Grouped checklist fields -->
              <div
                v-for="(params, section) in groupedTemplateParameters"
                :key="section"
                class="border rounded mb-3"
              >
                <div
                  class="d-flex align-items-center gap-2 px-3 py-2 bg-light border-bottom"
                  style="cursor: pointer;"
                  @click="toggleChecklistSection(section as string)"
                >
                  <i class="fa" :class="expandedChecklistSections[section as string] ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                  <i class="fa fa-folder-open text-primary"></i>
                  <span class="fw-bold text-uppercase small flex-grow-1">{{ section }}</span>
                  <span class="badge bg-secondary">{{ params.length }}</span>
                </div>
                <div v-show="expandedChecklistSections[section as string]" class="p-3">
                  <div
                    v-for="(param, pIdx) in params"
                    :key="param.id || pIdx"
                    class="row align-items-start mb-3 pb-3"
                    :class="{ 'border-bottom': pIdx < params.length - 1 }"
                  >
                    <!-- Label -->
                    <div class="col-md-3">
                      <label class="form-label fw-semibold mb-1 small">
                        {{ param.label_snapshot || param.maintenance_parameter?.name || param.parameter_name || `Parameter #${param.id}` }}
                        <i v-if="param.required" class="fa fa-asterisk text-danger ms-1" style="font-size: 8px;"></i>
                      </label>
                      <p v-if="param.unit_snapshot" class="text-muted small mb-0">
                        <i class="fa fa-ruler me-1"></i> {{ param.unit_snapshot }}
                      </p>
                    </div>
                    <!-- Input -->
                    <div class="col-md-5">
                      <!-- Boolean -->
                      <div v-if="getChecklistParamType(param) === 'boolean'" class="form-check form-switch mt-1">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :checked="checklistValues[param.id]?.value_bool === true"
                          :disabled="submitting"
                          @change="setChecklistValue(param, 'value_bool', ($event.target as HTMLInputElement).checked)"
                        />
                        <label class="form-check-label small">
                          {{ checklistValues[param.id]?.value_bool ? 'Yes / Pass' : 'No / Fail' }}
                        </label>
                      </div>
                      <!-- Number -->
                      <input
                        v-else-if="getChecklistParamType(param) === 'number' || getChecklistParamType(param) === 'numeric'"
                        type="number"
                        step="any"
                        class="form-control form-control-sm"
                        :value="checklistValues[param.id]?.value_numeric"
                        :placeholder="param.unit_snapshot ? `Enter value (${param.unit_snapshot})` : 'Enter value'"
                        :disabled="submitting"
                        @input="setChecklistValue(param, 'value_numeric', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
                      />
                      <!-- Text -->
                      <textarea
                        v-else-if="getChecklistParamType(param) === 'text'"
                        class="form-control form-control-sm"
                        rows="2"
                        :value="checklistValues[param.id]?.value_text"
                        placeholder="Enter details..."
                        :disabled="submitting"
                        @input="setChecklistValue(param, 'value_text', ($event.target as HTMLTextAreaElement).value)"
                      ></textarea>
                      <!-- Select One -->
                      <select
                        v-else-if="getChecklistParamType(param) === 'select_one'"
                        class="form-select form-select-sm"
                        :value="checklistValues[param.id]?.maintenance_parameter_option_id"
                        :disabled="submitting"
                        @change="setChecklistValue(param, 'maintenance_parameter_option_id', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                      >
                        <option value="">-- Select --</option>
                        <option
                          v-for="opt in getChecklistParamOptions(param)"
                          :key="opt.id"
                          :value="opt.id"
                        >
                          {{ opt.label || opt.name || opt.value }}
                        </option>
                      </select>
                      <!-- Select Many -->
                      <div v-else-if="getChecklistParamType(param) === 'select_many'">
                        <div v-for="opt in getChecklistParamOptions(param)" :key="opt.id" class="form-check">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            :value="opt.id"
                            :checked="isChecklistOptionSelected(param, opt)"
                            :disabled="submitting"
                            @change="toggleChecklistMultiOption(param, opt)"
                          />
                          <label class="form-check-label small">{{ opt.label || opt.name || opt.value }}</label>
                        </div>
                      </div>
                      <!-- Fallback: text -->
                      <input
                        v-else
                        type="text"
                        class="form-control form-control-sm"
                        :value="checklistValues[param.id]?.value_text"
                        placeholder="Enter value..."
                        :disabled="submitting"
                        @input="setChecklistValue(param, 'value_text', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                    <!-- Remarks -->
                    <div class="col-md-4">
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="checklistValues[param.id]?.remarks"
                        placeholder="Remarks..."
                        :disabled="submitting"
                        @input="setChecklistValue(param, 'remarks', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                  </div>
                </div>

                <!-- Symptoms & Complaint for this template category -->
                <div v-show="expandedChecklistSections[section as string]" class="px-3 pb-3">
                  <div class="border-top pt-2">
                    <!-- Symptoms -->
                    <label class="form-label small mb-1 text-muted">
                      <i class="fa fa-heartbeat text-danger me-1"></i> Symptoms
                      <span class="text-muted">(optional)</span>
                    </label>
                    <div class="row g-2 align-items-center">
                      <div class="col-md-4">
                        <Multiselect
                          v-model="getTemplateSymptomSelection(section as string).selected"
                          :options="getCategorySymptomsOptions(getTemplateSectionCategoryId(section as string, params) as number)"
                          label="name"
                          track-by="id"
                          :placeholder="getCategorySymptomsOptions(getTemplateSectionCategoryId(section as string, params) as number).length === 0 ? 'No symptoms available' : 'Search symptom...'"
                          :disabled="submitting || loadingSymptoms"
                          :allow-empty="true"
                          :show-no-results="true"
                        />
                      </div>
                      <div class="col-md-6">
                        <input
                          v-model="getTemplateSymptomSelection(section as string).description"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Description (optional)..."
                          :disabled="submitting"
                        />
                      </div>
                      <div class="col-md-2">
                        <button
                          type="button"
                          class="btn btn-outline-primary btn-sm"
                          :disabled="submitting || !getTemplateSymptomSelection(section as string).selected"
                          @click="addTemplateCategorySymptom(section as string, params)"
                        >
                          <i class="fa fa-plus"></i> Add
                        </button>
                      </div>
                    </div>
                    <!-- Symptoms table -->
                    <div v-if="getTemplateCategoryData(section as string, params).symptoms.length > 0" class="mt-2">
                      <table class="table table-sm table-bordered mb-0 bg-white">
                        <thead class="table-light">
                          <tr>
                            <th class="small" style="width: 40px;">#</th>
                            <th class="small">Symptom</th>
                            <th class="small">Description</th>
                            <th class="small text-end" style="width: 50px;">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(sym, sIdx) in getTemplateCategoryData(section as string, params).symptoms" :key="sIdx">
                            <td class="small">{{ sIdx + 1 }}</td>
                            <td class="small fw-semibold">{{ sym.symptom_name }}</td>
                            <td class="small text-muted">{{ sym.description || '—' }}</td>
                            <td class="text-end">
                              <button
                                type="button"
                                class="btn btn-outline-danger btn-sm py-0 px-1"
                                @click="removeTemplateCategorySymptom(section as string, sIdx)"
                                :disabled="submitting"
                              >
                                <i class="fa fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Complaint -->
                    <div class="mt-2 pt-2 border-top">
                      <label class="form-label small mb-1 text-muted">
                        <i class="fa fa-exclamation-triangle text-warning me-1"></i> Driver Complaint / Defect
                        <span class="text-muted">(optional)</span>
                      </label>
                      <textarea
                        v-model="getTemplateCategoryData(section as string, params).complaint"
                        class="form-control form-control-sm"
                        rows="2"
                        placeholder="Describe any defect or complaint for this category..."
                        :disabled="submitting"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Inspection Categories / Parameters (when no template) -->
            <div v-if="!form.template" class="col-12">
              <label class="form-label fw-semibold">Inspection Categories</label>
              <div class="border rounded p-3 bg-light">
                <div
                  v-for="(cat, catIdx) in form.manualCategories"
                  :key="catIdx"
                  class="mb-3 border rounded bg-white p-3"
                >
                  <!-- Category + Parameters row -->
                  <div class="row g-2 align-items-center">
                    <div class="col-md-4">
                      <label v-if="catIdx === 0" class="form-label small mb-1">Category</label>
                      <Multiselect
                        v-model="cat.category"
                        :options="categories"
                        label="name"
                        track-by="id"
                        placeholder="Select category..."
                        :loading="loadingCategories"
                        :disabled="submitting"
                        @select="onCategorySelected(catIdx, $event)"
                      />
                    </div>
                    <div class="col-md-6">
                      <label v-if="catIdx === 0" class="form-label small mb-1">Parameters</label>
                      <div
                        class="d-flex align-items-center gap-2 border rounded bg-light px-3 py-2"
                        style="min-height: 38px; cursor: pointer;"
                        @click="cat.category ? openParamModal(catIdx) : null"
                      >
                        <span v-if="cat.parameters.length === 0" class="text-muted small">
                          {{ cat.category ? 'Click to select parameters...' : 'Select a category first' }}
                        </span>
                        <span v-else class="fw-semibold small text-primary">
                          <i class="fa fa-check-circle me-1"></i> {{ cat.parameters.length }} parameter{{ cat.parameters.length !== 1 ? 's' : '' }} selected
                        </span>
                        <i v-if="cat.category" class="fa fa-pencil-alt text-muted ms-auto small"></i>
                      </div>
                    </div>
                    <div class="col-md-2 d-flex gap-1" :class="{ 'mt-4': catIdx === 0 }">
                      <button type="button" class="btn btn-outline-danger btn-sm" @click="removeManualCategory(catIdx)" :disabled="submitting">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Symptoms & Complaint (only when category selected) -->
                  <div v-if="cat.category" class="mt-2 pt-2 border-top">
                    <!-- Symptoms inline -->
                    <label class="form-label small mb-1 text-muted">
                      <i class="fa fa-heartbeat text-danger me-1"></i> Symptoms
                      <span class="text-muted">(optional)</span>
                    </label>
                    <div class="row g-2 align-items-center">
                      <div class="col-md-4">
                        <Multiselect
                          v-model="getSymptomSelection(catIdx).selected"
                          :options="getCategorySymptomsOptions(cat.category?.id)"
                          label="name"
                          track-by="id"
                          :placeholder="getCategorySymptomsOptions(cat.category?.id).length === 0 ? 'No symptoms available' : 'Search symptom...'"
                          :disabled="submitting || loadingSymptoms || getCategorySymptomsOptions(cat.category?.id).length === 0"
                          :allow-empty="true"
                          :show-no-results="true"
                        />
                      </div>
                      <div class="col-md-6">
                        <input
                          v-model="getSymptomSelection(catIdx).description"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Description (optional)..."
                          :disabled="submitting"
                        />
                      </div>
                      <div class="col-md-2">
                        <button
                          type="button"
                          class="btn btn-outline-primary btn-sm"
                          :disabled="submitting"
                          @click="addCategorySymptomFromInput(catIdx)"
                        >
                          <i class="fa fa-plus"></i> Add
                        </button>
                      </div>
                    </div>
                    <!-- Symptoms table -->
                    <div v-if="cat.symptoms.length > 0" class="mt-2">
                      <table class="table table-sm table-bordered mb-0 bg-white">
                        <thead class="table-light">
                          <tr>
                            <th class="small" style="width: 40px;">#</th>
                            <th class="small">Symptom</th>
                            <th class="small">Description</th>
                            <th class="small text-end" style="width: 50px;">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(sym, sIdx) in cat.symptoms" :key="sIdx">
                            <td class="small">{{ sIdx + 1 }}</td>
                            <td class="small fw-semibold">{{ sym.symptom_name }}</td>
                            <td class="small text-muted">{{ sym.description || '—' }}</td>
                            <td class="text-end">
                              <button
                                type="button"
                                class="btn btn-outline-danger btn-sm py-0 px-1"
                                @click="removeCategorySymptom(catIdx, sIdx)"
                                :disabled="submitting"
                              >
                                <i class="fa fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Driver Complaint -->
                    <div class="mt-2 pt-2 border-top">
                      <label class="form-label small mb-1 text-muted">
                        <i class="fa fa-exclamation-triangle text-warning me-1"></i> Driver Complaint / Defect
                        <span class="text-muted">(optional)</span>
                      </label>
                      <textarea
                        v-model="cat.complaint"
                        class="form-control form-control-sm"
                        rows="2"
                        placeholder="Describe any defect or complaint for this category..."
                        :disabled="submitting"
                      ></textarea>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary mt-2" @click="addManualCategory" :disabled="submitting">
                  <i class="fa fa-plus me-1"></i> Add Category
                </button>
              </div>
            </div>

            <!-- Parameter Selection Modal -->
            <teleport to="body">
              <div
                v-if="paramModalOpen"
                class="modal fade show d-block"
                tabindex="-1"
                style="background: rgba(0,0,0,0.5);"
                @click.self="closeParamModal"
              >
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">
                        <i class="fa fa-list-check text-primary me-2"></i>
                        Select Parameters
                        <span v-if="paramModalCategoryName" class="text-muted ms-2 small">— {{ paramModalCategoryName }}</span>
                      </h5>
                      <button type="button" class="btn-close" @click="closeParamModal"></button>
                    </div>
                    <div class="modal-body">
                      <!-- Search -->
                      <div class="mb-3">
                        <input
                          v-model="paramModalSearch"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Search parameters..."
                        />
                      </div>

                      <!-- Select All / Deselect All -->
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="small text-muted">{{ paramModalSelectedIds.size }} selected of {{ filteredModalParams.length }}</span>
                        <div class="d-flex gap-2">
                          <button type="button" class="btn btn-outline-primary btn-sm" @click="selectAllModalParams">Select All</button>
                          <button type="button" class="btn btn-outline-secondary btn-sm" @click="deselectAllModalParams">Deselect All</button>
                        </div>
                      </div>

                      <!-- Parameters list -->
                      <div v-if="filteredModalParams.length === 0" class="text-center text-muted py-4">
                        <i class="fa fa-search fa-2x mb-2 d-block"></i>
                        <p class="small">No parameters found.</p>
                      </div>
                      <div v-else class="list-group" style="max-height: 400px; overflow-y: auto;">
                        <label
                          v-for="param in filteredModalParams"
                          :key="param.id"
                          class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2"
                          style="cursor: pointer;"
                        >
                          <input
                            type="checkbox"
                            class="form-check-input mt-0"
                            :checked="paramModalSelectedIds.has(param.id)"
                            @change="toggleModalParam(param)"
                          />
                          <div class="flex-grow-1">
                            <span class="fw-semibold small">{{ param.name }}</span>
                            <span v-if="param.field_type" class="badge bg-light text-muted ms-2" style="font-size:10px;">{{ param.field_type }}</span>
                            <span v-if="param.unit" class="text-muted small ms-2">({{ param.unit }})</span>
                          </div>
                          <span v-if="param.category?.name || param.maintenance_category?.name" class="badge bg-secondary">
                            {{ param.category?.name || param.maintenance_category?.name }}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-outline-secondary" @click="closeParamModal">Cancel</button>
                      <button type="button" class="btn btn-primary" @click="confirmParamModal">
                        <i class="fa fa-check me-1"></i> Confirm Selection ({{ paramModalSelectedIds.size }})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </teleport>

            <!-- Narrations -->
            <div class="col-12">
              <label class="form-label">Narrations <span class="text-muted small">(optional)</span></label>
              <textarea
                v-model="form.narrations"
                class="form-control"
                rows="3"
                placeholder="Add any relevant notes or narrations..."
                :disabled="submitting"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="col-12 d-flex justify-content-end gap-2 pt-2">
              <button type="button" class="btn btn-outline-secondary" @click="goBack" :disabled="submitting">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="fa fa-plus-circle me-1"></i>
                Create Inspection
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </FormPageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { FormPageLayout } from '@/components/forms'
import { inspectionService } from '@/services/inspectionService'
import { assetService } from '@/services/assetService'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/notification'
import handleErrors from '@/stores/bushman/errorHandler'

const router = useRouter()
const authStore = useAuthStore()
const { showAlert } = useNotification()

// Form state
const form = reactive({
  template: null as any,
  trailer: null as any,
  inspector: null as any,
  inspected_at: new Date().toISOString().slice(0, 16),
  odometerReading: null as number | null,
  narrations: '',
  accountingDimension: null as any,
  manualCategories: [] as { category: any; parameters: any[]; complaint: string; symptoms: { maintenance_symptom_id: number; symptom_name: string; description: string }[] }[]
})

// Per-dimension optional fields (single)
const dimensionHandler = ref<any>(null)

// Checklist values (keyed by parameter ID)
interface ChecklistFieldResult {
  value_text?: string | null
  value_numeric?: number | null
  value_bool?: boolean | null
  value_json?: any
  maintenance_parameter_option_id?: number | null
  remarks?: string
}
const checklistValues = reactive<Record<number, ChecklistFieldResult>>({})
const expandedChecklistSections = reactive<Record<string, boolean>>({})

// Available symptoms for dropdown
const availableSymptoms = ref<any[]>([])
const loadingSymptoms = ref(false)
const symptomSelections = reactive<Record<number, { selected: any; description: string }>>({})

// Template category complaints & symptoms (keyed by section name)
interface TemplateCategorySectionData {
  categoryId: number | null
  complaint: string
  symptoms: { maintenance_symptom_id: number; symptom_name: string; description: string }[]
}
const templateCategoryData = reactive<Record<string, TemplateCategorySectionData>>({})
const templateSymptomSelections = reactive<Record<string, { selected: any; description: string }>>({})

const errors = reactive({
  inspection_template_id: '',
  inspector_id: '',
  inspected_at: '',
  odometer_reading: '',
  accounting_dimensions: '',
  handler_id: ''
})

const submitting = ref(false)

// User label helper (users have first_name + last_name, not name)
function userLabel(user: any) {
  const first = user.first_name || ''
  const last = user.last_name || ''
  return `${first} ${last}`.trim() || user.email || `User #${user.id}`
}

// Employee label helper
function employeeLabel(emp: any) {
  const first = emp.first_name || ''
  const last = emp.last_name || ''
  const name = emp.name || ''
  const full = `${first} ${last}`.trim()
  return full || name || emp.email || `Employee #${emp.id}`
}

// Vehicle label helper
function vehicleLabel(v: any) {
  const reg = v.registration_number
    || v.registration
    || v.motor_vehicle?.registration_number
    || v.vehicle_asset?.registration_number
    || v.plate_number
    || ''
  if (reg) return reg
  // Registration might be embedded in name as "T345EAA - TRAILER MODEL"
  const name = v.name || v.asset_name || ''
  if (name.includes(' - ')) return name.split(' - ')[0].trim()
  return name || `Asset #${v.id}`
}

// Dropdown data
const templates = ref<any[]>([])
const inspectors = ref<any[]>([])
const employees = ref<any[]>([])
const loadingEmployees = ref(false)
const dimensions = ref<any[]>([])
const trailers = ref<any[]>([])
const categories = ref<any[]>([])
const allParameters = ref<any[]>([])
const loadingTemplates = ref(false)
const loadingInspectors = ref(false)
const loadingDimensions = ref(false)
const loadingTrailers = ref(false)
const loadingCategories = ref(false)

// Combined dimensions: API returns pre-grouped by accounting_dimension_type
// For inspections, only ASSET types are relevant (vehicles/equipment being inspected)
const ALLOWED_INSPECTION_TYPES = ['ASSET']

const combinedDimensions = computed(() => {
  const codeMap: Record<string, any[]> = {}

  for (const group of dimensions.value) {
    const code = (group.code || 'OTHER').toUpperCase()
    if (!ALLOWED_INSPECTION_TYPES.includes(code)) continue
    if (!codeMap[code]) codeMap[code] = []
    for (const d of group.values || []) {
      codeMap[code].push({
        ...d,
        _uid: `dim-${d.id}`,
        _type: code,
        _dimension_type_code: code,
        _dimension_type_name: group.name || code
      })
    }
  }

  return Object.entries(codeMap).map(([code, items]) => ({
    group: code,
    items
  }))
})

// Label for combined dimension items
function dimensionLabel(item: any) {
  // Registration number may be embedded in name as "T216BBM - YTO DFH-..." 
  const name = item?.name || ''
  if (name.includes(' - ')) return name.split(' - ')[0].trim()
  const reg = item?.registration_number
    || item?.registration
    || item?.vehicle_asset?.registration_number
    || item?.motor_vehicle?.registration_number
    || item?.asset?.registration_number
    || item?.accountable?.registration_number
  if (reg) return reg
  return name || item?.code || `Item #${item?.id}`
}
const templateParameters = ref<any[]>([])
const loadingParams = ref(false)

// Grouped template parameters by category section
const groupedTemplateParameters = computed(() => {
  return templateParameters.value.reduce((acc: Record<string, any[]>, param: any) => {
    const section = param.maintenance_parameter?.category?.name || param.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(param)
    return acc
  }, {} as Record<string, any[]>)
})

// Checklist completion tracking
const checklistCompletedCount = computed(() => {
  return templateParameters.value.filter(p => {
    const fv = checklistValues[p.id]
    if (!fv) return false
    return (
      (fv.value_text != null && fv.value_text !== '') ||
      fv.value_numeric != null ||
      fv.value_bool != null ||
      fv.maintenance_parameter_option_id != null ||
      (fv.value_json != null && (Array.isArray(fv.value_json) ? fv.value_json.length > 0 : true))
    )
  }).length
})

const checklistProgressPercent = computed(() => {
  if (templateParameters.value.length === 0) return 0
  return Math.round((checklistCompletedCount.value / templateParameters.value.length) * 100)
})

// Get parameters filtered by category
function getParametersForCategory(categoryId: number | null | undefined) {
  if (!categoryId) return allParameters.value
  return allParameters.value.filter((p: any) => p.maintenance_category_id === categoryId || p.category_id === categoryId)
}

// Manual category management (when no template selected)
function addManualCategory() {
  form.manualCategories.push({ category: null, parameters: [], complaint: '', symptoms: [] })
}
function removeManualCategory(idx: number) {
  form.manualCategories.splice(idx, 1)
}

function onCategorySelected(catIdx: number, category: any) {
  // Auto-open the parameter modal when a category is selected
  form.manualCategories[catIdx].category = category
  form.manualCategories[catIdx].parameters = []
  form.manualCategories[catIdx].complaint = ''
  form.manualCategories[catIdx].symptoms = []
  // Use nextTick to ensure category is set before opening modal
  setTimeout(() => openParamModal(catIdx), 100)
}



// Add/remove symptoms within a category row
function addCategorySymptom(catIdx: number, symptomId: number, description: string) {
  const sym = availableSymptoms.value.find((s: any) => s.id === symptomId)
  if (!sym) return
  form.manualCategories[catIdx].symptoms.push({
    maintenance_symptom_id: symptomId,
    symptom_name: sym.name || `Symptom #${symptomId}`,
    description: description.trim()
  })
}

function removeCategorySymptom(catIdx: number, symptomIdx: number) {
  form.manualCategories[catIdx].symptoms.splice(symptomIdx, 1)
}

// Get symptoms filtered by a specific category id
function getCategorySymptomsOptions(categoryId: number) {
  return availableSymptoms.value.filter((s: any) => s.maintenance_category_id === categoryId)
}

// ==================== PARAMETER MODAL ====================

const paramModalOpen = ref(false)
const paramModalCatIdx = ref<number>(-1)
const paramModalCategoryName = ref('')
const paramModalSearch = ref('')
const paramModalSelectedIds = ref<Set<number>>(new Set())
const paramModalParams = ref<any[]>([])

const filteredModalParams = computed(() => {
  const search = paramModalSearch.value.toLowerCase().trim()
  if (!search) return paramModalParams.value
  return paramModalParams.value.filter((p: any) =>
    (p.name || '').toLowerCase().includes(search) ||
    (p.field_type || '').toLowerCase().includes(search) ||
    (p.unit || '').toLowerCase().includes(search)
  )
})

function openParamModal(catIdx: number) {
  const cat = form.manualCategories[catIdx]
  if (!cat?.category) return

  paramModalCatIdx.value = catIdx
  paramModalCategoryName.value = cat.category.name || ''
  paramModalSearch.value = ''
  paramModalParams.value = getParametersForCategory(cat.category.id)

  // Pre-select already chosen parameters
  paramModalSelectedIds.value = new Set(cat.parameters.map((p: any) => p.id))
  paramModalOpen.value = true
}

function closeParamModal() {
  paramModalOpen.value = false
}

function toggleModalParam(param: any) {
  const ids = paramModalSelectedIds.value
  if (ids.has(param.id)) {
    ids.delete(param.id)
  } else {
    ids.add(param.id)
  }
  paramModalSelectedIds.value = new Set(ids)
}

function selectAllModalParams() {
  paramModalSelectedIds.value = new Set(filteredModalParams.value.map((p: any) => p.id))
}

function deselectAllModalParams() {
  paramModalSelectedIds.value = new Set()
}

function confirmParamModal() {
  const catIdx = paramModalCatIdx.value
  if (catIdx < 0 || catIdx >= form.manualCategories.length) return

  const selectedIds = paramModalSelectedIds.value
  const selectedParams = paramModalParams.value.filter((p: any) => selectedIds.has(p.id))
  form.manualCategories[catIdx].parameters = selectedParams
  paramModalOpen.value = false
}

// ==================== CHECKLIST HELPERS ====================

function toggleChecklistSection(section: string) {
  expandedChecklistSections[section] = !expandedChecklistSections[section]
}

function getChecklistParamType(param: any): string {
  return (
    param.question_type_snapshot ||
    param.maintenance_parameter?.field_type ||
    param.field_type ||
    'text'
  ).toLowerCase()
}

function getChecklistParamOptions(param: any): any[] {
  return param.maintenance_parameter?.options || param.options || []
}

function setChecklistValue(param: any, field: keyof ChecklistFieldResult, value: any) {
  if (!checklistValues[param.id]) {
    checklistValues[param.id] = {}
  }
  ;(checklistValues[param.id] as any)[field] = value
}

function isChecklistOptionSelected(param: any, opt: any) {
  const fv = checklistValues[param.id]
  if (!fv?.value_json) return false
  const arr = Array.isArray(fv.value_json) ? fv.value_json : []
  return arr.includes(opt.id)
}

function toggleChecklistMultiOption(param: any, opt: any) {
  if (!checklistValues[param.id]) checklistValues[param.id] = {}
  let current = checklistValues[param.id].value_json
  if (!Array.isArray(current)) current = []
  const idx = current.indexOf(opt.id)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(opt.id)
  }
  checklistValues[param.id].value_json = [...current]
}

function initChecklistValues() {
  // Initialize empty values for all template parameters
  for (const param of templateParameters.value) {
    if (!checklistValues[param.id]) {
      checklistValues[param.id] = {
        value_text: null,
        value_numeric: null,
        value_bool: null,
        value_json: null,
        maintenance_parameter_option_id: null,
        remarks: ''
      }
    }
  }
  // Expand all sections
  for (const section of Object.keys(groupedTemplateParameters.value)) {
    expandedChecklistSections[section] = true
  }
}

// ==================== SYMPTOM HELPERS ====================

function addCategorySymptomFromInput(catIdx: number) {
  const sel = getSymptomSelection(catIdx)
  if (!sel.selected) return
  addCategorySymptom(catIdx, sel.selected.id, sel.description || '')
  sel.selected = null
  sel.description = ''
}

function getSymptomSelection(catIdx: number) {
  if (!symptomSelections[catIdx]) {
    symptomSelections[catIdx] = { selected: null, description: '' }
  }
  return symptomSelections[catIdx]
}

// ==================== TEMPLATE CATEGORY SYMPTOM/COMPLAINT HELPERS ====================

function getTemplateCategoryData(section: string, params: any[]): TemplateCategorySectionData {
  if (!templateCategoryData[section]) {
    const catId = params[0]?.maintenance_parameter?.category?.id || params[0]?.maintenance_category_id || null
    templateCategoryData[section] = { categoryId: catId, complaint: '', symptoms: [] }
  }
  return templateCategoryData[section]
}

function getTemplateSectionCategoryId(section: string, params: any[]): number | null {
  return getTemplateCategoryData(section, params).categoryId
}

function getTemplateSymptomSelection(section: string) {
  if (!templateSymptomSelections[section]) {
    templateSymptomSelections[section] = { selected: null, description: '' }
  }
  return templateSymptomSelections[section]
}

function addTemplateCategorySymptom(section: string, params: any[]) {
  const sel = getTemplateSymptomSelection(section)
  if (!sel.selected) return
  const sym = sel.selected
  const data = getTemplateCategoryData(section, params)
  data.symptoms.push({
    maintenance_symptom_id: sym.id,
    symptom_name: sym.name || `Symptom #${sym.id}`,
    description: (sel.description || '').trim()
  })
  sel.selected = null
  sel.description = ''
}

function removeTemplateCategorySymptom(section: string, idx: number) {
  const data = templateCategoryData[section]
  if (data) data.symptoms.splice(idx, 1)
}

// Watch template selection to load parameters and init checklist
watch(() => form.template, async (newTemplate) => {
  if (!newTemplate?.id) {
    templateParameters.value = []
    // Clear checklist values
    Object.keys(checklistValues).forEach(k => delete checklistValues[Number(k)])
    Object.keys(expandedChecklistSections).forEach(k => delete expandedChecklistSections[k])
    return
  }
  loadingParams.value = true
  try {
    const res = await inspectionService.listParameters(newTemplate.id)
    templateParameters.value = res.data.data || res.data || []
    initChecklistValues()
  } catch {
    templateParameters.value = []
  } finally {
    loadingParams.value = false
  }
})

// Clear manual categories when template is selected and vice versa
watch(() => form.template, (val) => {
  if (val) {
    form.manualCategories = []
  }
})

// Load dropdown data
onMounted(async () => {
  await Promise.all([
    loadTemplates(),
    loadInspectors(),
    loadDimensions(),
    loadTrailers(),
    loadCategories(),
    loadAllParameters(),
    loadAvailableSymptoms()
  ])
})

async function loadTemplates(search = '') {
  loadingTemplates.value = true
  try {
    const res = await inspectionService.listTemplates({ search, status: 'published' })
    const all = res.data.data || res.data || []
    templates.value = all.filter((t: any) => !t.status || t.status === 'published')
  } catch {
    templates.value = []
  } finally {
    loadingTemplates.value = false
  }
}

async function loadInspectors(search = '') {
  loadingInspectors.value = true
  try {
    const res = await inspectionService.listUsers({ search })
    inspectors.value = res.data.data || res.data || []
  } catch {
    inspectors.value = []
  } finally {
    loadingInspectors.value = false
  }
}

// TODO: Implement when employees table is created
async function loadEmployees(_search = '') {
  // employees endpoint not yet available
  employees.value = []
}

async function loadDimensions(search = '') {
  loadingDimensions.value = true
  try {
    const res = await inspectionService.listAccountingDimensions({ search, include: 'vehicleAsset,accountable' })
    dimensions.value = res.data.data || res.data || []
  } catch {
    dimensions.value = []
  } finally {
    loadingDimensions.value = false
  }
}

async function loadTrailers(search = '') {
  loadingTrailers.value = true
  try {
    const res = await assetService.listVehicleAssets({ search, type: 'TRAILER' })
    const data = res.data?.data || res.data || []
    const all = Array.isArray(data) ? data : []
    // Only keep assets that are trailers
    trailers.value = all.filter((a: any) => {
      const modelType = (a.motor_vehicle?.vehicle_model?.type || a.vehicle_model?.type || a.type || '').toUpperCase()
      if (modelType === 'TRAILER') return true
      const name = (a.name || '').toUpperCase()
      const make = (a.make || a.motor_vehicle?.vehicle_model?.make || '').toUpperCase()
      const model = (a.model || a.motor_vehicle?.vehicle_model?.model || '').toUpperCase()
      const category = (a.category || a.asset_category || '').toUpperCase()
      return name.includes('TRAILER') || make.includes('TRAILER') || model.includes('TRAILER') || category.includes('TRAILER')
    })
  } catch {
    trailers.value = []
  } finally {
    loadingTrailers.value = false
  }
}

async function loadCategories() {
  loadingCategories.value = true
  try {
    const res = await inspectionService.listCategories()
    categories.value = res.data.data || res.data || []
  } catch {
    categories.value = []
  } finally {
    loadingCategories.value = false
  }
}

async function loadAllParameters() {
  try {
    const res = await inspectionService.listMaintenanceParameters()
    allParameters.value = res.data.data || res.data || []
  } catch {
    allParameters.value = []
  }
}

async function loadAvailableSymptoms() {
  loadingSymptoms.value = true
  try {
    const res = await inspectionService.listMaintenanceSymptoms()
    availableSymptoms.value = res.data.data || res.data || []
  } catch {
    availableSymptoms.value = []
  } finally {
    loadingSymptoms.value = false
  }
}

function searchTemplates(query: string) {
  loadTemplates(query)
}

function searchInspectors(query: string) {
  loadInspectors(query)
}

function searchEmployees(query: string) {
  loadEmployees(query)
}

function searchDimensions(query: string) {
  loadDimensions(query)
}

function searchTrailers(query: string) {
  loadTrailers(query)
}

function validate(): boolean {
  let valid = true
  errors.inspection_template_id = ''
  errors.inspector_id = ''
  errors.inspected_at = ''
  errors.odometer_reading = ''
  errors.accounting_dimensions = ''
  errors.handler_id = ''

  if (!form.accountingDimension) {
    errors.accounting_dimensions = 'Please select an accounting dimension'
    valid = false
  }
  if (!form.inspector) {
    errors.inspector_id = 'Please select an inspector'
    valid = false
  }
  if (!form.inspected_at) {
    errors.inspected_at = 'Please select an inspection date'
    valid = false
  }
  if (form.odometerReading == null || form.odometerReading === '' as any) {
    errors.odometer_reading = 'Please enter the odometer reading'
    valid = false
  }
  if (!dimensionHandler.value) {
    errors.handler_id = 'Please select a handler'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    const selectedDim = form.accountingDimension

    const accountingDims = [{
      accounting_dimension_id: selectedDim.id,
      handler_id: dimensionHandler.value?.id || undefined
    }]

    // Collect manual parameters when no template is used
    const manualParams = form.manualCategories.flatMap((cat) =>
      (cat.parameters || []).map((p: any) => ({
        maintenance_parameter_id: p.id,
        maintenance_category_id: cat.category?.id || null
      }))
    )

    const payload: any = {
      user_id: authStore.user?.id,
      inspection_template_id: form.template?.id || null,
      inspector_id: form.inspector.id,
      inspected_at: form.inspected_at,
      trailer_asset_id: form.trailer?.id || null,
      odometer_reading: form.odometerReading ?? undefined,
      narrations: form.narrations || undefined,
      accounting_dimensions: accountingDims,
      manual_parameters: manualParams.length > 0 ? manualParams : undefined
    }

    // Step 1: Create the inspection
    const createRes = await inspectionService.createInspection(payload)
    const createdInspection = createRes.data?.data || createRes.data
    const inspectionId = createdInspection?.id

    if (!inspectionId) {
      showAlert('success', 'Inspection created successfully')
      router.push('/inspections')
      return
    }

    // Step 2: Save checklist results (if template was selected and values were filled)
    if (form.template && templateParameters.value.length > 0) {
      try {
        // First load the inspection's parameter snapshot to get correct IDs
        const paramRes = await inspectionService.getInspectionParameters(inspectionId)
        const inspParams = paramRes.data?.data || paramRes.data || []

        if (inspParams.length > 0) {
          const results = inspParams
            .filter((ip: any) => {
              // Match by maintenance_parameter_id to find user-entered values
              const tplParam = templateParameters.value.find((tp: any) => tp.id === ip.id || tp.maintenance_parameter_id === ip.maintenance_parameter_id)
              if (!tplParam) return false
              const fv = checklistValues[tplParam.id]
              if (!fv) return false
              return (
                (fv.value_text != null && fv.value_text !== '') ||
                fv.value_numeric != null ||
                fv.value_bool != null ||
                fv.maintenance_parameter_option_id != null ||
                (fv.value_json != null && (Array.isArray(fv.value_json) ? fv.value_json.length > 0 : true))
              )
            })
            .map((ip: any) => {
              const tplParam = templateParameters.value.find((tp: any) => tp.id === ip.id || tp.maintenance_parameter_id === ip.maintenance_parameter_id)
              const fv = checklistValues[tplParam!.id] || {}
              return {
                inspection_sheet_parameter_id: ip.id,
                value_text: fv.value_text ?? null,
                value_numeric: fv.value_numeric ?? null,
                value_bool: fv.value_bool ?? null,
                value_json: fv.value_json ?? null,
                maintenance_parameter_option_id: fv.maintenance_parameter_option_id ?? null,
                remarks: fv.remarks || undefined
              }
            })

          if (results.length > 0) {
            await inspectionService.saveInspectionResultsBatch(inspectionId, { results })
          }
        }
      } catch (e) {
        console.warn('Failed to save checklist results:', e)
      }
    }

    // Step 3: Save complaints (from manual categories or template categories)
    // Manual categories
    for (const cat of form.manualCategories) {
      if (!cat.category || !cat.complaint.trim()) continue
      try {
        await inspectionService.addInspectionComplaint(inspectionId, {
          maintenance_category_id: cat.category.id,
          narration: cat.complaint.trim()
        })
      } catch (e) {
        console.warn('Failed to save complaint:', e)
      }
    }
    // Template categories
    for (const section of Object.keys(templateCategoryData)) {
      const data = templateCategoryData[section]
      if (!data.categoryId || !data.complaint.trim()) continue
      try {
        await inspectionService.addInspectionComplaint(inspectionId, {
          maintenance_category_id: data.categoryId,
          narration: data.complaint.trim()
        })
      } catch (e) {
        console.warn('Failed to save template complaint:', e)
      }
    }

    // Step 4: Save symptoms (from manual categories or template categories)
    // Manual categories
    for (const cat of form.manualCategories) {
      for (const symptom of cat.symptoms) {
        try {
          await inspectionService.addInspectionSymptom(inspectionId, {
            maintenance_symptom_id: symptom.maintenance_symptom_id,
            description: symptom.description || undefined
          })
        } catch (e) {
          console.warn('Failed to save symptom:', e)
        }
      }
    }
    // Template categories
    for (const section of Object.keys(templateCategoryData)) {
      const data = templateCategoryData[section]
      for (const symptom of data.symptoms) {
        try {
          await inspectionService.addInspectionSymptom(inspectionId, {
            maintenance_symptom_id: symptom.maintenance_symptom_id,
            description: symptom.description || undefined
          })
        } catch (e) {
          console.warn('Failed to save template symptom:', e)
        }
      }
    }

    showAlert('success', 'Inspection created successfully')
    router.push('/inspections')
  } catch (error: any) {
    const errList = handleErrors(error?.response?.data || error)
    showAlert('error', errList?.[0] || 'Failed to create inspection')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/inspections')
}
</script>

<style scoped>
/* Multiselect refinements on top of base CSS */
:deep(.multiselect) {
  min-height: 38px;
  font-size: 14px;
}

:deep(.multiselect__tags) {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  min-height: 38px;
  padding: 6px 40px 0 8px;
  background: #fff;
}

:deep(.multiselect__single) {
  font-size: 14px;
  margin-bottom: 4px;
  padding: 0 4px;
  color: #333;
}

:deep(.multiselect__placeholder) {
  color: #adb5bd;
  margin-bottom: 4px;
  padding: 0 4px;
  font-size: 14px;
}

:deep(.multiselect__input) {
  font-size: 14px;
  padding: 0 4px;
  margin-bottom: 4px;
}

:deep(.multiselect__select) {
  height: 36px;
  right: 1px;
  top: 1px;
}

:deep(.multiselect__tags:hover) {
  border-color: #adb5bd;
}

:deep(.multiselect--active .multiselect__tags) {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
}

:deep(.multiselect__content-wrapper) {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-top: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

:deep(.multiselect__option) {
  padding: 10px 12px;
  font-size: 14px;
  color: #333;
  min-height: auto;
}

:deep(.multiselect__option--highlight) {
  background: var(--bs-primary, #0d6efd);
  color: #fff;
}

:deep(.multiselect__option--selected) {
  background: #e9ecef;
  color: #333;
  font-weight: 600;
}

:deep(.multiselect__option--selected.multiselect__option--highlight) {
  background: var(--bs-primary, #0d6efd);
  color: #fff;
}
</style>
