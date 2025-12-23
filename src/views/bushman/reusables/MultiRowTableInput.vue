<template>
  <div class="multi-row-table-input">
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead>
          <tr>
            <th v-for="field in fields" :key="field.key" :style="field.headerStyle">
              {{ field.label }}
              <span v-if="field.required" class="text-danger">*</span>
            </th>
            <th style="width:100px" class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in modelValue" :key="row._id" class="table-row">
            <td v-for="field in fields" :key="field.key" :style="field.cellStyle">
              <input
                v-if="field.type === 'text'"
                :value="row[field.key]"
                @input="updateField(idx, field.key, ($event.target as HTMLInputElement).value)"
                type="text"
                class="form-control form-control-sm"
                :placeholder="field.placeholder"
                :required="field.required"
              />
              <input
                v-else-if="field.type === 'number'"
                :value="row[field.key]"
                @input="updateField(idx, field.key, ($event.target as HTMLInputElement).value)"
                type="number"
                class="form-control form-control-sm"
                :placeholder="field.placeholder"
                :required="field.required"
              />
              <textarea
                v-else-if="field.type === 'textarea'"
                :value="row[field.key]"
                @input="updateField(idx, field.key, ($event.target as HTMLTextAreaElement).value)"
                class="form-control form-control-sm"
                :placeholder="field.placeholder"
                rows="2"
                :required="field.required"
              ></textarea>
              <select
                v-else-if="field.type === 'select'"
                :value="row[field.key]"
                @change="updateField(idx, field.key, ($event.target as HTMLSelectElement).value)"
                class="form-select form-select-sm"
                :required="field.required"
              >
                <option v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ option.text }}
                </option>
              </select>
            </td>
            <td class="text-center">
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click.prevent="removeRow(idx)"
                v-if="modelValue.length > 1"
                title="Remove row"
              >
                <i class="fa fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="d-flex justify-content-end mt-2">
        <button type="button" class="btn btn-sm btn-success" @click.prevent="addRow" :title="addButtonLabel">
          <i class="fa fa-plus me-1"></i> {{ addButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Field {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string | number; text: string }>
  headerStyle?: string
  cellStyle?: string
}

interface Row {
  _id: number
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    modelValue: Row[]
    fields: Field[]
    addButtonLabel?: string
  }>(),
  {
    addButtonLabel: 'Add Row',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: Row[]]
}>()

function updateField(rowIndex: number, fieldKey: string, value: any) {
  const updated = [...props.modelValue]
  updated[rowIndex] = {
    ...updated[rowIndex],
    [fieldKey]: value,
  }
  emit('update:modelValue', updated)
}

function addRow() {
  const newId = Math.max(...props.modelValue.map((r) => r._id), 0) + 1
  const newRow: Row = { _id: newId }
  for (const field of props.fields) {
    if (field.type === 'select') {
      newRow[field.key] = field.options?.[0]?.value || ''
    } else {
      newRow[field.key] = ''
    }
  }
  // Prepend the new row so it appears at the top of the table
  emit('update:modelValue', [newRow, ...props.modelValue])
}

function removeRow(index: number) {
  if (props.modelValue.length > 1) {
    const updated = props.modelValue.filter((_, i) => i !== index)
    emit('update:modelValue', updated)
  }
}
</script>

<style scoped>
.multi-row-table-input {
  width: 100%;
}

.multi-row-table-input .table {
  margin-bottom: 0;
}

.table-row {
  height: 60px;
}

.table-row td {
  padding: 0.5rem;
  vertical-align: middle;
}

.form-control-sm,
.form-select-sm {
  height: 36px;
  font-size: 0.875rem;
}
</style>
