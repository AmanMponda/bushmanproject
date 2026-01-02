<template>
  <input
    ref="inputRef"
    type="text"
    class="form-control form-control-sm"
    :placeholder="placeholder"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCurrencyInput } from 'vue-currency-input'

const props = withDefaults(defineProps<{
  modelValue: number
  currency?: string
  locale?: string
  placeholder?: string
}>(), {
  currency: 'USD',
  locale: 'en-US',
  placeholder: '0.00'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { inputRef, numberValue, setOptions, setValue } = useCurrencyInput({
  currency: props.currency,
  currencyDisplay: 'hidden',
  locale: props.locale,
  precision: 2,
  useGrouping: true,
  hideCurrencySymbolOnFocus: false,
  hideGroupingSeparatorOnFocus: false,
  autoDecimalDigits: false,
  valueRange: { min: 0 },
  valueAsInteger: false
}, false)

// Initialize with empty if value is 0
onMounted(() => {
  if (props.modelValue && props.modelValue > 0) {
    setValue(props.modelValue)
  } else {
    setValue(null)
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== numberValue.value) {
    if (newValue && newValue > 0) {
      setValue(newValue)
    } else {
      setValue(null)
    }
  }
})

watch(() => [props.currency, props.locale], () => {
  setOptions({
    currency: props.currency,
    currencyDisplay: 'hidden',
    locale: props.locale,
    precision: 2,
    useGrouping: true,
    hideCurrencySymbolOnFocus: false,
    hideGroupingSeparatorOnFocus: false,
    autoDecimalDigits: false,
    valueRange: { min: 0 },
    valueAsInteger: false
  })
})

// Watch for input changes and emit
watch(numberValue, (newValue) => {
  emit('update:modelValue', newValue || 0)
})
</script>
