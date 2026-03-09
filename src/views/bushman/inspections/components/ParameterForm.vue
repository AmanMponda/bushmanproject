<template>
  <div class="modal fade" :id="modalId" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEdit ? 'Edit Parameter' : 'Add Parameter' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <!-- Maintenance Parameter Selection -->
          <div class="mb-3" v-if="!isEdit">
            <label class="form-label fw-bold">Maintenance Parameter <span class="text-danger">*</span></label>
            <Multiselect
              v-model="form.maintenance_parameter"
              :options="availableParameters"
              label="name"
              track-by="id"
              placeholder="Search and select parameter..."
              :searchable="true"
              :loading="loadingParameters"
              @search-change="searchParameters"
            />
          </div>

          <!-- Section -->
          <div class="mb-3">
            <label class="form-label fw-bold">Section</label>
            <div class="d-flex gap-2">
              <Multiselect
                v-if="!showNewSection"
                v-model="form.section"
                :options="existingSections"
                placeholder="Select existing section or add new..."
                :searchable="true"
                :taggable="true"
                @tag="addNewSection"
              />
              <input
                v-else
                v-model="newSectionName"
                type="text"
                class="form-control"
                placeholder="Enter new section name..."
              />
              <button
                class="btn btn-outline-secondary btn-sm"
                @click="toggleNewSection"
                :title="showNewSection ? 'Select existing' : 'Add new'"
              >
                <i :class="showNewSection ? 'fa fa-list' : 'fa fa-plus'"></i>
              </button>
            </div>
          </div>

          <!-- Position -->
          <div class="mb-3">
            <label class="form-label fw-bold">Position</label>
            <input v-model.number="form.position" type="number" class="form-control" min="1" placeholder="Display order" />
          </div>

          <!-- Required -->
          <div class="mb-3">
            <div class="form-check">
              <input v-model="form.required" type="checkbox" class="form-check-input" id="paramRequired" />
              <label class="form-check-label" for="paramRequired">Required</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="submitForm" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            {{ isEdit ? 'Update' : 'Add Parameter' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { inspectionService } from '@/services/inspectionService'

const props = defineProps<{
  modelValue?: any
  existingSections: string[]
  modalId?: string
}>()

const emit = defineEmits(['submit', 'update:modelValue'])

const isEdit = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const loadingParameters = ref(false)
const availableParameters = ref<any[]>([])
const showNewSection = ref(false)
const newSectionName = ref('')

const form = reactive({
  id: null as number | null,
  maintenance_parameter: null as any,
  maintenance_parameter_id: null as number | null,
  section: '' as string,
  position: 1,
  required: false
})

// Watch for external model value changes (edit mode)
watch(() => props.modelValue, (val) => {
  if (val) {
    isEdit.value = !!val.id
    form.id = val.id || null
    form.maintenance_parameter = val.maintenance_parameter || null
    form.maintenance_parameter_id = val.maintenance_parameter_id || null
    form.section = val.section || ''
    form.position = val.position || 1
    form.required = val.required || false
  }
}, { immediate: true, deep: true })

function toggleNewSection() {
  showNewSection.value = !showNewSection.value
  if (!showNewSection.value) {
    newSectionName.value = ''
  }
}

function addNewSection(tag: string) {
  form.section = tag
}

async function searchParameters(query: string) {
  if (!query || query.length < 1) return
  loadingParameters.value = true
  try {
    const response = await inspectionService.listMaintenanceParameters({ search: query })
    const all = response.data.data || response.data || []
    // Only show active parameters for template assignment
    availableParameters.value = all.filter((p: any) => p.active === 1 || p.active === true)
  } catch {
    availableParameters.value = []
  } finally {
    loadingParameters.value = false
  }
}

function resetForm() {
  isEdit.value = false
  form.id = null
  form.maintenance_parameter = null
  form.maintenance_parameter_id = null
  form.section = ''
  form.position = 1
  form.required = false
  errorMessage.value = ''
  showNewSection.value = false
  newSectionName.value = ''
}

function submitForm() {
  errorMessage.value = ''

  if (!isEdit.value && !form.maintenance_parameter) {
    errorMessage.value = 'Please select a maintenance parameter.'
    return
  }

  const section = showNewSection.value ? newSectionName.value : form.section

  const payload = {
    id: form.id,
    maintenance_parameter_id: isEdit.value ? form.maintenance_parameter_id : form.maintenance_parameter?.id,
    maintenance_parameter: form.maintenance_parameter,
    section: section || null,
    position: form.position,
    required: form.required
  }

  emit('submit', payload)
}

async function loadParameters() {
  loadingParameters.value = true
  try {
    const response = await inspectionService.listMaintenanceParameters()
    const all = response.data.data || response.data || []
    // Only show active parameters for template assignment
    availableParameters.value = all.filter((p: any) => p.active === 1 || p.active === true)
  } catch {
    availableParameters.value = []
  } finally {
    loadingParameters.value = false
  }
}

defineExpose({ resetForm, loadParameters })

onMounted(() => {
  loadParameters()
})
</script>
