<template>
  <span :class="['party-role-tag', `role-${roleCodeForClass}`]" :title="roleLabel">
    <i :class="['icon', roleIcon]"></i>
    {{ roleLabel }}
    <span v-if="isPrimary" class="primary-indicator" title="Primary Party">★</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  role: string
  isPrimary?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  isPrimary: false
})

const roleCodeForClass = computed(() => props.role.toLowerCase().replace(/_/g, '-'))

const roleConfig: Record<string, { label: string; icon: string }> = {
  primary: { label: 'Primary', icon: 'fas fa-star' },
  secondary: { label: 'Secondary', icon: 'fas fa-star-half-alt' },
  guarantor: { label: 'Guarantor', icon: 'fas fa-shield-alt' },
  signatory: { label: 'Signatory', icon: 'fas fa-pen-fancy' },
  customer: { label: 'Customer', icon: 'fas fa-user' },
  supplier: { label: 'Supplier', icon: 'fas fa-truck' },
  partner: { label: 'Partner', icon: 'fas fa-handshake' },
  vendor: { label: 'Vendor', icon: 'fas fa-store' },
  agent: { label: 'Agent', icon: 'fas fa-user-secret' },
  broker: { label: 'Broker', icon: 'fas fa-exchange-alt' },
  observer: { label: 'Observer', icon: 'fas fa-eye' },
  other: { label: 'Other', icon: 'fas fa-user-tag' }
}

const roleLabel = computed(() => {
  if (props.label) return props.label
  const config = roleConfig[props.role.toLowerCase()]
  return config?.label || props.role
})

const roleIcon = computed(() => {
  const config = roleConfig[props.role.toLowerCase()]
  return config?.icon || 'fas fa-user'
})
</script>

<style scoped lang="scss">
.party-role-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  position: relative;

  .icon {
    font-size: 11px;
    opacity: 0.8;
  }

  .primary-indicator {
    margin-left: 4px;
    font-size: 13px;
    color: #ffc107;
  }

  // Role-specific colors
  &.role-primary {
    background-color: #ffd700;
    color: #333;
    border-color: #ffb300;
    font-weight: 700;
  }

  &.role-secondary {
    background-color: #ffe0b2;
    color: #e65100;
    border-color: #ffb74d;
  }

  &.role-guarantor {
    background-color: #ffebee;
    color: #b71c1c;
    border-color: #ef5350;
  }

  &.role-signatory {
    background-color: #c8e6c9;
    color: #1b5e20;
    border-color: #81c784;
  }

  &.role-customer {
    background-color: #bbdefb;
    color: #0d47a1;
    border-color: #64b5f6;
  }

  &.role-supplier {
    background-color: #c5cae9;
    color: #1a237e;
    border-color: #5c6bc0;
  }

  &.role-partner {
    background-color: #d1c4e9;
    color: #51206c;
    border-color: #9575cd;
  }

  &.role-vendor {
    background-color: #d4a5a5;
    color: #3e2723;
    border-color: #a1887f;
  }

  &.role-agent {
    background-color: #b2dfdb;
    color: #004d40;
    border-color: #4db6ac;
  }

  &.role-broker {
    background-color: #e1bee7;
    color: #4a148c;
    border-color: #ce93d8;
  }

  &.role-observer {
    background-color: #f0f4c3;
    color: #33691e;
    border-color: #dcedc8;
  }

  &.role-other {
    background-color: #f5f5f5;
    color: #424242;
    border-color: #bdbdbd;
  }
}
</style>
