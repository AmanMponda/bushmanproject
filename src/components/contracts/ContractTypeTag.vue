<template>
  <span :class="['contract-type-tag', `type-${typeCodeForClass}`]" :title="typeLabel">
    <i :class="['icon', typeIcon]"></i>
    {{ typeLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: string
  label?: string
}

const props = defineProps<Props>()

const typeCodeForClass = computed(() => props.type.toLowerCase().replace(/_/g, '-'))

const typeConfig: Record<string, { label: string; icon: string }> = {
  service: { label: 'Service', icon: 'fas fa-tools' },
  supply: { label: 'Supply', icon: 'fas fa-boxes' },
  license: { label: 'License', icon: 'fas fa-certificate' },
  nda: { label: 'NDA', icon: 'fas fa-lock' },
  partnership: { label: 'Partnership', icon: 'fas fa-handshake' },
  employment: { label: 'Employment', icon: 'fas fa-user-tie' },
  lease: { label: 'Lease', icon: 'fas fa-building' },
  other: { label: 'Other', icon: 'fas fa-file' }
}

const typeLabel = computed(() => {
  if (props.label) return props.label
  const config = typeConfig[props.type.toLowerCase()]
  return config?.label || props.type
})

const typeIcon = computed(() => {
  const config = typeConfig[props.type.toLowerCase()]
  return config?.icon || 'fas fa-file'
})
</script>

<style scoped lang="scss">
.contract-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;

  .icon {
    font-size: 10px;
    opacity: 0.8;
  }

  // Type-specific colors
  &.type-service {
    background-color: #e3f2fd;
    color: #1565c0;
    border-color: #90caf9;
  }

  &.type-supply {
    background-color: #f3e5f5;
    color: #6a1b9a;
    border-color: #ce93d8;
  }

  &.type-license {
    background-color: #fff3e0;
    color: #e65100;
    border-color: #ffb74d;
  }

  &.type-nda {
    background-color: #fce4ec;
    color: #c2185b;
    border-color: #f48fb1;
  }

  &.type-partnership {
    background-color: #e0f2f1;
    color: #00695c;
    border-color: #80cbc4;
  }

  &.type-employment {
    background-color: #f1f8e9;
    color: #558b2f;
    border-color: #c5e1a5;
  }

  &.type-lease {
    background-color: #ede7f6;
    color: #3f51b5;
    border-color: #9fa8da;
  }

  &.type-other {
    background-color: #f5f5f5;
    color: #424242;
    border-color: #bdbdbd;
  }
}
</style>
