<template>
  <div class="checklist-tab">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
      <p class="mt-2 text-muted small">Loading checklist parameters...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="Object.keys(groupedParameters).length === 0" class="text-center py-5 bg-white rounded">
      <i class="fa fa-clipboard-list fa-3x text-muted mb-3 d-block"></i>
      <h6 class="text-muted">No checklist parameters</h6>
      <p class="text-muted small">This inspection template has no parameters configured.</p>
    </div>

    <!-- Sections -->
    <template v-else>
      <!-- Progress indicator -->
      <div class="bg-white rounded p-3 mb-3 shadow-sm">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="fw-semibold small">Completion Progress</span>
          <span class="badge bg-primary">{{ completedCount }} / {{ totalCount }}</span>
        </div>
        <div class="progress" style="height: 6px;">
          <div
            class="progress-bar bg-success"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Collapsible Sections -->
      <div
        v-for="(params, section) in groupedParameters"
        :key="section"
        class="bg-white rounded mb-3 shadow-sm"
      >
        <!-- Section Header (collapsible) -->
        <div
          class="d-flex align-items-center gap-2 p-3 border-bottom cursor-pointer"
          @click="toggleSection(section as string)"
        >
          <i
            class="fa"
            :class="expandedSections[section as string] ? 'fa-chevron-down' : 'fa-chevron-right'"
          ></i>
          <i class="fa fa-folder-open text-primary"></i>
          <h6 class="mb-0 fw-bold text-uppercase flex-grow-1">{{ section }}</h6>
          <span class="badge bg-secondary">{{ params.length }} item{{ params.length !== 1 ? 's' : '' }}</span>
          <button
            v-if="!readonly"
            class="btn btn-outline-primary btn-sm ms-2"
            @click.stop="saveSection(section as string, params)"
            :disabled="savingSections[section as string]"
          >
            <i class="fa fa-save me-1"></i>
            <span v-if="savingSections[section as string]">Saving...</span>
            <span v-else>Save Section</span>
          </button>
        </div>

        <!-- Section Fields -->
        <div v-show="expandedSections[section as string]" class="p-3">
          <div
            v-for="(param, index) in params"
            :key="param.id || index"
            class="row align-items-start mb-3 pb-3"
            :class="{ 'border-bottom': index < params.length - 1 }"
          >
            <!-- Label -->
            <div class="col-md-3">
              <label class="form-label fw-semibold mb-1">
                {{ param.label_snapshot || param.maintenance_parameter?.name || `Parameter #${param.id}` }}
              </label>
              <p v-if="param.unit_snapshot && getParamType(param) !== 'boolean'" class="text-muted small mb-0">
                <i class="fa fa-ruler me-1"></i> {{ param.unit_snapshot }}
              </p>
            </div>

            <!-- Input -->
            <div class="col-md-5">
              <!-- Boolean: Pass / Fail buttons -->
              <div v-if="getParamType(param) === 'boolean'" class="d-flex gap-2 mt-1">
                <button
                  type="button"
                  class="btn btn-sm px-4"
                  :class="fieldValues[param.id]?.value_bool === true
                    ? 'btn-success text-white'
                    : 'btn-outline-secondary'"
                  :disabled="readonly"
                  @click="setTypedValue(param, 'value_bool', true); autosaveField(param)"
                >
                  <i v-if="fieldValues[param.id]?.value_bool === true" class="fa fa-check-circle me-1"></i>
                  Pass
                </button>
                <button
                  type="button"
                  class="btn btn-sm px-4"
                  :class="fieldValues[param.id]?.value_bool === false
                    ? 'btn-danger text-white'
                    : 'btn-outline-secondary'"
                  :disabled="readonly"
                  @click="setTypedValue(param, 'value_bool', false); autosaveField(param)"
                >
                  <i v-if="fieldValues[param.id]?.value_bool === false" class="fa fa-times-circle me-1"></i>
                  Fail
                </button>
              </div>

              <!-- Number -->
              <input
                v-else-if="getParamType(param) === 'number' || getParamType(param) === 'numeric'"
                type="number"
                step="any"
                class="form-control form-control-sm"
                :value="fieldValues[param.id]?.value_numeric"
                :placeholder="param.unit_snapshot ? `Enter value (${param.unit_snapshot})` : 'Enter value'"
                :disabled="readonly"
                @input="setTypedValue(param, 'value_numeric', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
                @blur="autosaveField(param)"
              />

              <!-- Text -->
              <textarea
                v-else-if="getParamType(param) === 'text'"
                class="form-control form-control-sm"
                rows="2"
                :value="fieldValues[param.id]?.value_text"
                placeholder="Enter details..."
                :disabled="readonly"
                @input="setTypedValue(param, 'value_text', ($event.target as HTMLTextAreaElement).value)"
                @blur="autosaveField(param)"
              ></textarea>

              <!-- Select One (maintenance_parameter_option_id) -->
              <select
                v-else-if="getParamType(param) === 'select_one'"
                class="form-select form-select-sm"
                :value="fieldValues[param.id]?.maintenance_parameter_option_id"
                :disabled="readonly"
                @change="setTypedValue(param, 'maintenance_parameter_option_id', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null); autosaveField(param)"
              >
                <option value="">-- Select --</option>
                <option
                  v-for="opt in getParamOptions(param)"
                  :key="opt.id"
                  :value="opt.id"
                >
                  {{ opt.label || opt.name || opt.value }}
                </option>
              </select>

              <!-- Select Many (value_json with array of option IDs) -->
              <div v-else-if="getParamType(param) === 'select_many'">
                <div
                  v-for="opt in getParamOptions(param)"
                  :key="opt.id"
                  class="form-check"
                >
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :value="opt.id"
                    :checked="isOptionSelected(param, opt)"
                    :disabled="readonly"
                    @change="toggleMultiOption(param, opt)"
                  />
                  <label class="form-check-label small">{{ opt.label || opt.name || opt.value }}</label>
                </div>
              </div>

              <!-- Fallback: text -->
              <input
                v-else
                type="text"
                class="form-control form-control-sm"
                :value="fieldValues[param.id]?.value_text"
                placeholder="Enter value..."
                :disabled="readonly"
                @input="setTypedValue(param, 'value_text', ($event.target as HTMLInputElement).value)"
                @blur="autosaveField(param)"
              />
            </div>

            <!-- Remarks -->
            <div class="col-md-3">
              <input
                type="text"
                class="form-control form-control-sm"
                :value="fieldValues[param.id]?.remarks"
                placeholder="Remarks..."
                :disabled="readonly"
                @input="setTypedValue(param, 'remarks', ($event.target as HTMLInputElement).value)"
                @blur="autosaveField(param)"
              />
            </div>

            <!-- Autosave indicator -->
            <div class="col-md-1 d-flex align-items-center">
              <span v-if="savingFields[param.id]" class="text-muted small">
                <i class="fa fa-spinner fa-spin"></i>
              </span>
              <span v-else-if="savedFields[param.id]" class="text-success small">
                <i class="fa fa-check"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { inspectionService } from '@/services/inspectionService'
import { useNotification } from '@/composables/notification'

interface FieldResult {
  value_text?: string | null
  value_numeric?: number | null
  value_bool?: boolean | null
  value_json?: any
  maintenance_parameter_option_id?: number | null
  inspection_parameter_possible_result_id?: number | null
  remarks?: string
}

const props = defineProps<{
  inspectionId: number
  templateId?: number | null
  status: string
  readonly: boolean
  initialParameters?: any[]
}>()

const { showAlert } = useNotification()

const isLoading = ref(true)
const parameters = ref<any[]>([])
const fieldValues = reactive<Record<number, FieldResult>>({})
const savingFields = reactive<Record<number, boolean>>({})
const savedFields = reactive<Record<number, boolean>>({})
const savingSections = reactive<Record<string, boolean>>({})
const expandedSections = reactive<Record<string, boolean>>({})

// Group parameters by section (maintenance category)
const groupedParameters = computed(() => {
  return parameters.value.reduce((acc: Record<string, any[]>, param: any) => {
    const section = param.maintenance_parameter?.category?.name || param.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(param)
    return acc
  }, {} as Record<string, any[]>)
})

const totalCount = computed(() => parameters.value.length)

const completedCount = computed(() => {
  return parameters.value.filter(p => {
    const fv = fieldValues[p.id]
    if (!fv) return false
    return (
      fv.value_text != null && fv.value_text !== '' ||
      fv.value_numeric != null ||
      fv.value_bool != null ||
      fv.maintenance_parameter_option_id != null ||
      (fv.value_json != null && (Array.isArray(fv.value_json) ? fv.value_json.length > 0 : true))
    )
  }).length
})

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

onMounted(async () => {
  // Use data passed from parent if available, otherwise fetch
  if (props.initialParameters && props.initialParameters.length > 0) {
    initializeParameters(props.initialParameters)
  } else {
    await loadParameters()
  }
})

function initializeParameters(data: any[]) {
  parameters.value = data
  // Pre-populate existing result values
  for (const param of parameters.value) {
    const result = param.result || param.latest_result || (param.results && param.results.length > 0 ? param.results[param.results.length - 1] : null)
    if (result) {
      fieldValues[param.id] = {
        value_text: result.value_text ?? null,
        value_numeric: result.value_numeric != null ? Number(result.value_numeric) : null,
        value_bool: result.value_bool ?? null,
        value_json: result.value_json ?? null,
        maintenance_parameter_option_id: result.maintenance_parameter_option_id ?? null,
        inspection_parameter_possible_result_id: result.inspection_parameter_possible_result_id ?? null,
        remarks: result.remarks ?? ''
      }
    } else {
      fieldValues[param.id] = {
        value_text: null,
        value_numeric: null,
        value_bool: null,
        value_json: null,
        maintenance_parameter_option_id: null,
        inspection_parameter_possible_result_id: null,
        remarks: ''
      }
    }
  }
  // Expand all sections by default
  for (const section of Object.keys(groupedParameters.value)) {
    expandedSections[section] = true
  }
  isLoading.value = false
}

async function loadParameters() {
  isLoading.value = true
  try {
    // Try loading inspection-specific parameters first
    let data: any[] = []
    try {
      const res = await inspectionService.getInspectionParameters(props.inspectionId)
      data = res.data.data || res.data || []
      if (!Array.isArray(data)) data = []
    } catch {
      data = []
    }

    // Fallback: if no inspection parameters, load from template
    if (data.length === 0 && props.templateId) {
      try {
        const tplRes = await inspectionService.listParameters(props.templateId)
        const tplData = tplRes.data.data || tplRes.data || []
        data = Array.isArray(tplData) ? tplData : []
      } catch {
        data = []
      }
    }

    parameters.value = data

    // Pre-populate existing result values
    for (const param of parameters.value) {
      const result = param.result || param.latest_result
      if (result) {
        fieldValues[param.id] = {
          value_text: result.value_text ?? null,
          value_numeric: result.value_numeric != null ? Number(result.value_numeric) : null,
          value_bool: result.value_bool ?? null,
          value_json: result.value_json ?? null,
          maintenance_parameter_option_id: result.maintenance_parameter_option_id ?? null,
          inspection_parameter_possible_result_id: result.inspection_parameter_possible_result_id ?? null,
          remarks: result.remarks ?? ''
        }
      } else {
        fieldValues[param.id] = {
          value_text: null,
          value_numeric: null,
          value_bool: null,
          value_json: null,
          maintenance_parameter_option_id: null,
          inspection_parameter_possible_result_id: null,
          remarks: ''
        }
      }
    }

    // Expand all sections by default
    for (const section of Object.keys(groupedParameters.value)) {
      expandedSections[section] = true
    }
  } catch (error: any) {
    showAlert('error', error?.response?.data?.message || 'Failed to load checklist parameters')
    parameters.value = []
  } finally {
    isLoading.value = false
  }
}

function toggleSection(section: string) {
  expandedSections[section] = !expandedSections[section]
}

function getParamType(param: any): string {
  return (
    param.question_type_snapshot ||
    param.maintenance_parameter?.question_type ||
    param.maintenance_parameter?.field_type ||
    param.question_type ||
    param.field_type ||
    'text'
  ).toLowerCase()
}

function getParamOptions(param: any): any[] {
  return param.maintenance_parameter?.options || param.options || []
}

function setTypedValue(param: any, field: keyof FieldResult, value: any) {
  if (!fieldValues[param.id]) {
    fieldValues[param.id] = {}
  }
  ;(fieldValues[param.id] as any)[field] = value
}

function isOptionSelected(param: any, opt: any) {
  const fv = fieldValues[param.id]
  if (!fv?.value_json) return false
  const arr = Array.isArray(fv.value_json) ? fv.value_json : []
  return arr.includes(opt.id)
}

function toggleMultiOption(param: any, opt: any) {
  if (!fieldValues[param.id]) fieldValues[param.id] = {}
  let current = fieldValues[param.id].value_json
  if (!Array.isArray(current)) current = []
  const idx = current.indexOf(opt.id)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(opt.id)
  }
  fieldValues[param.id].value_json = [...current]
  autosaveField(param)
}

// Build result payload for a single parameter
function buildResultPayload(param: any) {
  const fv = fieldValues[param.id] || {}
  return {
    inspection_sheet_parameter_id: param.id as number,
    value_text: fv.value_text ?? null,
    value_numeric: fv.value_numeric ?? null,
    value_bool: fv.value_bool ?? null,
    value_json: fv.value_json ?? null,
    maintenance_parameter_option_id: fv.maintenance_parameter_option_id ?? null,
    inspection_parameter_possible_result_id: fv.inspection_parameter_possible_result_id ?? null,
    remarks: fv.remarks || undefined
  }
}

// Autosave individual field
let autosaveTimers: Record<number, ReturnType<typeof setTimeout>> = {}

function autosaveField(param: any) {
  if (props.readonly) return

  if (autosaveTimers[param.id]) clearTimeout(autosaveTimers[param.id])
  autosaveTimers[param.id] = setTimeout(async () => {
    savingFields[param.id] = true
    savedFields[param.id] = false
    try {
      await inspectionService.saveInspectionResult(props.inspectionId, buildResultPayload(param))
      savedFields[param.id] = true
      setTimeout(() => { savedFields[param.id] = false }, 2000)
    } catch {
      showAlert('error', `Failed to save: ${param.label_snapshot || param.maintenance_parameter?.name || 'field'}`)
    } finally {
      savingFields[param.id] = false
    }
  }, 500)
}

// Save entire section at once
async function saveSection(section: string, params: any[]) {
  if (props.readonly) return

  savingSections[section] = true
  try {
    const results = params.map(p => buildResultPayload(p))
    await inspectionService.saveInspectionResultsBatch(props.inspectionId, { results })
    showAlert('success', `Section "${section}" saved successfully`)

    for (const p of params) {
      savedFields[p.id] = true
      setTimeout(() => { savedFields[p.id] = false }, 2000)
    }
  } catch {
    showAlert('error', `Failed to save section "${section}"`)
  } finally {
    savingSections[section] = false
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: #f8f9fa;
}
</style>
