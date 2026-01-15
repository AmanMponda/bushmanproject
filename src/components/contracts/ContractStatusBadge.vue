<template>
  <span :class="['contract-status-badge', `status-${statusLower}`]" :title="statusLabel">
    <i :class="['icon', statusIcon]"></i>
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
}

const props = defineProps<Props>()

const statusLower = computed(() => props.status.toLowerCase())

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: 'fas fa-file-alt',
    color: 'secondary'
  },
  negotiation: {
    label: 'Negotiation',
    icon: 'fas fa-handshake',
    color: 'warning'
  },
  pending_signature: {
    label: 'Pending Signature',
    icon: 'fas fa-pen-fancy',
    color: 'info'
  },
  active: {
    label: 'Active',
    icon: 'fas fa-check-circle',
    color: 'success'
  },
  suspended: {
    label: 'Suspended',
    icon: 'fas fa-pause-circle',
    color: 'danger'
  },
  terminated: {
    label: 'Terminated',
    icon: 'fas fa-times-circle',
    color: 'dark'
  },
  expired: {
    label: 'Expired',
    icon: 'fas fa-calendar-times',
    color: 'muted'
  }
}

const statusLabel = computed(() => {
  return statusConfig[statusLower.value]?.label || props.status
})

const statusIcon = computed(() => {
  return statusConfig[statusLower.value]?.icon || 'fas fa-file'
})
</script>

<style scoped lang="scss">
.contract-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  .icon {
    font-size: 11px;
  }

  // Status colors
  &.status-draft {
    background-color: #e7e7e7;
    color: #495057;
    border: 1px solid #d1d1d1;
  }

  &.status-negotiation {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
  }

  &.status-pending_signature {
    background-color: #cfe2ff;
    color: #084298;
    border: 1px solid #b6d4fe;
  }

  &.status-active {
    background-color: #d1e7dd;
    color: #0f5132;
    border: 1px solid #badbcc;
  }

  &.status-suspended {
    background-color: #f8d7da;
    color: #842029;
    border: 1px solid #f5c2c7;
  }

  &.status-terminated {
    background-color: #e2e3e5;
    color: #383d41;
    border: 1px solid #d3d6d8;
  }

  &.status-expired {
    background-color: #d3d3d3;
    color: #666;
    border: 1px solid #bbb;
  }
}
</style>
