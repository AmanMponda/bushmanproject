<template>
  <div class="file-node" :class="{ 'has-sub': hasChildren, 'expand': isExpanded }">
    <a href="javascript:;" class="file-link" @click="toggleNode">
      <span class="file-arrow" v-if="hasChildren"></span>
      <span class="file-info" @click="selectNode">
        <span class="file-icon">
          <i :class="nodeIcon" :style="{ color: iconColor }"></i>
        </span>
        <span class="file-text">{{ node.name }}</span>
        <small class="text-muted ms-2">({{ node.type }})</small>
      </span>
      <span class="file-actions ms-auto" @click.stop>
        <button class="btn btn-xs btn-link text-success" @click="$emit('add-child', node)">
          <i class="fa fa-plus"></i>
        </button>
        <button class="btn btn-xs btn-link text-primary" @click="$emit('edit-node', node)">
          <i class="fa fa-edit"></i>
        </button>
        <button class="btn btn-xs btn-link text-danger" @click="$emit('delete-node', node)">
          <i class="fa fa-trash"></i>
        </button>
      </span>
    </a>
    
    <div v-if="hasChildren && isExpanded" class="file-tree">
      <location-tree-node
        v-for="child in node.children_recursive"
        :key="child.id"
        :node="child"
        :level="level + 1"
        @add-child="$emit('add-child', $event)"
        @edit-node="$emit('edit-node', $event)"
        @delete-node="$emit('delete-node', $event)"
        @toggle-expand="$emit('toggle-expand', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const props = defineProps({
  node: Object,
  level: Number
})

const emit = defineEmits(['add-child', 'edit-node', 'delete-node', 'toggle-expand', 'select'])

const expandedNodes = inject('expandedNodes')

const hasChildren = computed(() => {
  return props.node.children_recursive?.length > 0
})

const isExpanded = computed(() => {
  return expandedNodes?.value.has(props.node.id)
})

const nodeIcon = computed(() => {
  const icons = {
    COUNTRY: 'fa fa-globe',
    REGION: 'fa fa-map',
    DISTRICT: 'fa fa-map-marker',
    CITY: 'fa fa-city',
    TOWN: 'fa fa-town',
    WARD: 'fa fa-ward',
    BRANCH: 'fa fa-code-branch',
    OFFICE: 'fa fa-building',
    STATION: 'fa fa-train',
    WAREHOUSE: 'fa fa-warehouse',
    ZONE: 'fa fa-th'
  }
  return icons[props.node.type] || 'fa fa-folder'
})

const iconColor = computed(() => {
  const colors = {
    COUNTRY: '#28a745',
    REGION: '#17a2b8',
    CITY: '#007bff',
    BRANCH: '#6f42c1',
    OFFICE: '#fd7e14'
  }
  return colors[props.node.type] || '#ffc107'
})

const toggleNode = () => {
  if (hasChildren.value) {
    emit('toggle-expand', props.node.id)
  } else {
    selectNode()
  }
}

const selectNode = () => {
  emit('select', props.node)
}
</script>

<style scoped>
.file-node {
  padding: 4px 0;
}

.file-link {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
}

.file-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.file-arrow {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  position: relative;
}

.file-arrow::before {
  content: '▸';
  font-size: 12px;
  transition: transform 0.2s;
}

.file-node.expand .file-arrow::before {
  transform: rotate(90deg);
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.file-icon {
  width: 20px;
  margin-right: 8px;
  text-align: center;
}

.file-text {
  font-weight: 500;
}

.file-actions {
  display: none;
}

.file-link:hover .file-actions {
  display: block;
}

.file-tree {
  padding-left: 24px;
  margin-left: 8px;
  border-left: 1px dashed #dee2e6;
}
</style>