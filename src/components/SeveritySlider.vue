<template>
  <div class="severity-slider">
    <label class="form-label fw-semibold x-small mb-1">
      Severity &nbsp;
      <span class="badge fw-bold" :class="badgeClass">
        {{ modelValue }} / 5
      </span>
    </label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
      type="range"
      class="form-range"
      min="0"
      max="5"
      step="1"
    />
    <div class="d-flex justify-content-between" style="font-size:.58rem;color:#adb5bd">
      <span>None</span>
      <span>Low</span>
      <span>Med</span>
      <span>High</span>
      <span>Critical</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
});

defineEmits(['update:modelValue']);

const badgeClass = computed(() => {
  const s = props.modelValue;
  if (s == null || s === '') return 'bg-light text-muted';
  if (s === 0)  return 'bg-success bg-opacity-10 text-success';
  if (s <= 2)   return 'bg-info bg-opacity-10 text-info';
  if (s <= 4)   return 'bg-warning bg-opacity-10 text-warning';
  return 'bg-danger bg-opacity-10 text-danger';
});
</script>

<style scoped>
.severity-slider {
  width: 100%;
}
.x-small {
  font-size: .72rem;
}
</style>
