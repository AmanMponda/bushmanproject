<script setup>
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
})
</script>

<template>
  <Datepicker
    v-model="modelValue"
    :model-type="props.modelType"
    :format="props.modelType"
    :placeholder="props.placeholder"
    :enable-time-picker="false"
    :auto-apply="true"
    :close-on-auto-apply="true"
  />
</template>
