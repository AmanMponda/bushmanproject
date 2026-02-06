<script setup>
import { computed } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const modelValue = defineModel({ default: null })

const props = defineProps({
  modelType: {
    type: String,
    default: 'yyyy-MM-dd',
  },
  placeholder: {
    type: String,
    default: 'Select date...',
  },
  /**
   * Mode accepts 'date' (default) or 'month-year' to allow selecting month+year only
   */
  mode: {
    type: String,
    default: 'date',
  },
})

const isMonthYear = computed(() => props.mode === 'month-year')
const effectiveFormat = computed(() => isMonthYear.value ? 'yyyy-MM' : props.modelType)
const effectiveView = computed(() => isMonthYear.value ? 'month' : 'day')

</script>

<template>
  <Datepicker
    v-model="modelValue"
    :model-type="effectiveFormat"
    :format="effectiveFormat"
    :view="effectiveView"
    :placeholder="props.placeholder"
    :enable-time-picker="false"
    :auto-apply="true"
    :close-on-auto-apply="true"
  />
</template>
