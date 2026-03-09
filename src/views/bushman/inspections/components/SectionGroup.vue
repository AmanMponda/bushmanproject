<template>
  <div>
    <div v-if="Object.keys(groupedParameters).length === 0" class="text-center text-muted py-4">
      <i class="fa fa-clipboard-list fa-2x mb-2 d-block"></i>
      No parameters available.
    </div>

    <div v-for="(params, section) in groupedParameters" :key="section" class="mb-4">
      <!-- Section Header -->
      <div class="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
        <i class="fa fa-folder-open text-primary"></i>
        <h6 class="mb-0 fw-bold text-uppercase">{{ section }}</h6>
        <span class="badge bg-secondary ms-auto">{{ params.length }} item{{ params.length > 1 ? 's' : '' }}</span>
      </div>

      <!-- Parameters in Section -->
      <div class="list-group">
        <div
          v-for="(param, index) in params"
          :key="param.id || index"
          class="list-group-item d-flex align-items-center gap-3 py-2"
        >
          <span class="text-muted fw-bold" style="min-width: 30px">{{ index + 1 }}.</span>
          <span class="flex-grow-1">
            {{ getParameterName(param) }}
          </span>
          <span v-if="param.required" class="badge bg-danger">Required</span>
          <span v-else class="badge bg-light text-muted">Optional</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  parameters: any[]
}>()

const groupedParameters = computed(() => {
  return props.parameters.reduce((acc: Record<string, any[]>, param: any) => {
    const section = param.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(param)
    return acc
  }, {} as Record<string, any[]>)
})

function getParameterName(param: any) {
  return param.maintenance_parameter?.name || param.parameter_name || `Parameter #${param.maintenance_parameter_id}`
}
</script>
