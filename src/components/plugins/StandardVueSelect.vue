<script setup>
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

const props = defineProps({
  modelValue: { type: [String, Number, Array, Object], default: null },
  options: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  label: { type: String, default: 'label' },
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <v-select :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" :options="options"
    :multiple="multiple" :placeholder="placeholder" :clearable="clearable" :label="label" />
</template>