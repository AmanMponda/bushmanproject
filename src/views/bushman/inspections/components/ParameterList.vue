<template>
  <div>
    <!-- Parameter Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th style="width: 50px">#</th>
            <th>Parameter Name</th>
            <th>Section</th>
            <th style="width: 80px" class="text-center">Required</th>
            <th style="width: 100px" class="text-center" v-if="!readonly">Order</th>
            <th style="width: 120px" class="text-center" v-if="!readonly">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="parameters.length === 0">
            <td :colspan="readonly ? 4 : 6" class="text-center text-muted py-4">
              <i class="fa fa-clipboard-list fa-2x mb-2 d-block"></i>
              No parameters added yet. Click "Add Parameter" to get started.
            </td>
          </tr>
          <tr v-for="(param, index) in sortedParameters" :key="param.id || index">
            <td class="text-center text-muted">{{ param.position || index + 1 }}</td>
            <td>
              <strong>{{ getParameterName(param) }}</strong>
            </td>
            <td>
              <span v-if="param.section" class="badge bg-info text-dark">{{ param.section }}</span>
              <span v-else class="text-muted fst-italic">General</span>
            </td>
            <td class="text-center">
              <i :class="param.required ? 'fa fa-check text-success' : 'fa fa-minus text-muted'"></i>
            </td>
            <td class="text-center" v-if="!readonly">
              <div class="btn-group btn-group-sm">
                <button
                  class="btn btn-outline-secondary"
                  @click="moveUp(index)"
                  :disabled="index === 0"
                  title="Move Up"
                >
                  <i class="fa fa-arrow-up"></i>
                </button>
                <button
                  class="btn btn-outline-secondary"
                  @click="moveDown(index)"
                  :disabled="index === sortedParameters.length - 1"
                  title="Move Down"
                >
                  <i class="fa fa-arrow-down"></i>
                </button>
              </div>
            </td>
            <td class="text-center" v-if="!readonly">
              <div class="d-flex gap-1 justify-content-center">
                <button class="btn btn-outline-primary btn-sm" @click="$emit('edit', param)" title="Edit">
                  <i class="fa fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="$emit('remove', param)" title="Remove">
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  parameters: any[]
  readonly?: boolean
}>()

const emit = defineEmits(['edit', 'remove', 'reorder'])

const sortedParameters = computed(() => {
  return [...props.parameters].sort((a, b) => (a.position || 0) - (b.position || 0))
})

function getParameterName(param: any) {
  return param.maintenance_parameter?.name || param.parameter_name || `Parameter #${param.maintenance_parameter_id}`
}

function moveUp(index: number) {
  if (index <= 0) return
  const items = [...sortedParameters.value]
  const temp = items[index].position
  items[index].position = items[index - 1].position
  items[index - 1].position = temp
  emit('reorder', items)
}

function moveDown(index: number) {
  if (index >= sortedParameters.value.length - 1) return
  const items = [...sortedParameters.value]
  const temp = items[index].position
  items[index].position = items[index + 1].position
  items[index + 1].position = temp
  emit('reorder', items)
}
</script>
