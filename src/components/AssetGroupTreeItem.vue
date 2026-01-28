<template>
  <div class="tree-item">
    <div
      class="tree-node d-flex align-items-center py-2 px-2 rounded"
      :style="{ paddingLeft: `${level * 24 + 8}px` }"
    >
      <!-- Expand/Collapse Toggle -->
      <button
        v-if="hasChildren"
        class="btn btn-sm btn-link p-0 me-2 text-muted"
        style="width: 20px;"
        @click="toggleExpand"
      >
        <i :class="expanded ? 'fa fa-chevron-down' : 'fa fa-chevron-right'"></i>
      </button>
      <span v-else class="me-2" style="width: 20px;"></span>

      <!-- Icon -->
      <i :class="getIcon(item.asset_class)" class="me-2" :style="{ color: getColor(item.asset_class) }"></i>

      <!-- Name & Code -->
      <div class="flex-grow-1">
        <span class="fw-semibold">{{ item.name }}</span>
        <code class="ms-2 small">{{ item.code }}</code>
        <span class="badge ms-2" :class="getBadge(item.asset_class)">
          {{ getLabel(item.asset_class) }}
        </span>
        <span v-if="!item.is_active" class="badge bg-secondary ms-1">Inactive</span>
      </div>

      <!-- Actions -->
      <div class="tree-actions">
        <button class="btn btn-sm btn-outline-primary me-1" @click.stop="$emit('edit', item)">
          <i class="fa fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" @click.stop="$emit('delete', item)">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- Children -->
    <div v-if="expanded && hasChildren" class="tree-children">
      <AssetGroupTreeItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :level="level + 1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AssetGroup } from '@/services/assetGroupService'

interface Props {
  item: AssetGroup
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

defineEmits(['edit', 'delete'])

const expanded = ref(true)

const hasChildren = computed(() => {
  return props.item.children && props.item.children.length > 0
})

function toggleExpand() {
  expanded.value = !expanded.value
}

const classMap: Record<string, { icon: string; color: string; badge: string; label: string }> = {
  VEHICLE: { icon: 'fa fa-car', color: '#0d6efd', badge: 'bg-primary', label: 'Vehicle' },
  EQUIPMENT: { icon: 'fa fa-cogs', color: '#198754', badge: 'bg-success', label: 'Equipment' },
  BUILDING: { icon: 'fa fa-building', color: '#0dcaf0', badge: 'bg-info', label: 'Building' },
  IT: { icon: 'fa fa-laptop', color: '#ffc107', badge: 'bg-warning text-dark', label: 'IT' },
  FURNITURE: { icon: 'fa fa-chair', color: '#6c757d', badge: 'bg-secondary', label: 'Furniture' },
  TIRE: { icon: 'fa fa-circle', color: '#212529', badge: 'bg-dark', label: 'Tire' },
  OTHER: { icon: 'fa fa-box', color: '#adb5bd', badge: 'bg-light text-dark', label: 'Other' }
}

function getIcon(cls: string) {
  return classMap[cls]?.icon || 'fa fa-folder'
}

function getColor(cls: string) {
  return classMap[cls]?.color || '#6c757d'
}

function getBadge(cls: string) {
  return classMap[cls]?.badge || 'bg-secondary'
}

function getLabel(cls: string) {
  return classMap[cls]?.label || cls
}
</script>

<script lang="ts">
export default {
  name: 'AssetGroupTreeItem'
}
</script>

<style scoped>
.tree-node {
  transition: background-color 0.15s;
}

.tree-node:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.tree-actions {
  opacity: 0;
  transition: opacity 0.15s;
}

.tree-node:hover .tree-actions {
  opacity: 1;
}

code {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.8em;
}
</style>
