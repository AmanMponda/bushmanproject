<template>
  <div class="account-tree-item">
    <!-- Tree Node Row -->
    <div class="tree-row">
      <!-- Toggle Button for Parent Accounts -->
      <div class="tree-controls">
        <button
          v-if="hasChildren"
          class="toggle-btn"
          :class="{ expanded: isExpanded }"
          @click.stop="toggleExpand"
          :title="isExpanded ? 'Collapse' : 'Expand'"
        >
          <span class="toggle-icon">{{ isExpanded ? '−' : '+' }}</span>
        </button>
        <span v-else class="toggle-spacer"></span>
      </div>

      <!-- Account Content -->
      <div
        class="account-content"
        :class="{ 
          'is-leaf': isLeaf, 
          'is-parent': hasChildren,
          'is-selected': isSelected
        }"
        @click="handleClick"
      >
        <span class="account-code">{{ account.code }}</span>
        <span class="account-separator">—</span>
        <span class="account-name">{{ account.name }}</span>
        
        <!-- Children Badge for Parent Accounts -->
        <span v-if="hasChildren" class="children-badge">
          {{ account.children.length }}
        </span>
      </div>
    </div>

    <!-- Nested Children (Recursive) -->
    <div v-if="isExpanded && hasChildren" class="children-container">
      <AccountTreeItem
        v-for="child in account.children"
        :key="child.id"
        :account="child"
        :level="level + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, withDefaults } from 'vue'

interface Account {
  id: number | string
  code: string
  name: string
  parent_account_id: number | string | null
  children?: Account[]
}

interface Props {
  account: Account
  level?: number
}

const props = withDefaults(
  defineProps<Props>(),
  {
    account: () => ({
      id: 0,
      code: '',
      name: '',
      parent_account_id: null,
      children: []
    }),
    level: 0
  }
)

const emit = defineEmits<{
  select: [account: Account]
}>()

const isExpanded = ref(false)
const isSelected = ref(false)
const account = ref<Account>(props.account)

// Computed properties
const hasChildren = computed(() => {
  return account.value.children && account.value.children.length > 0
})

const isLeaf = computed(() => {
  return !hasChildren.value
})

// Watch for prop changes
watch(() => props.account, (newVal) => {
  account.value = newVal
}, { deep: true })

// Methods
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const handleClick = () => {
  // Only allow selection of leaf accounts
  if (isLeaf.value) {
    isSelected.value = true
    emit('select', {
      id: account.value.id,
      code: account.value.code,
      name: account.value.name,
      parent_account_id: account.value.parent_account_id
    })
  } else {
    // If parent, just toggle expand
    toggleExpand()
  }
}
</script>

<style scoped>
.account-tree-item {
  width: 100%;
  user-select: none;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0;
  border-bottom: 1px solid #f0f0f0;
  height: 32px;
}

.tree-row:hover {
  background: #f9f9f9;
}

/* Toggle Button Controls */
.tree-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  flex-shrink: 0;
  border-right: 1px solid #e8e8e8;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid #ccc;
  background: #f5f5f5;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  color: #333;
  transition: all 0.2s ease;
  user-select: none;
}

.toggle-btn:hover {
  background: #efefef;
  border-color: #999;
  color: #0066cc;
}

.toggle-btn.expanded {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
}

.toggle-icon {
  display: block;
  line-height: 1;
}

.toggle-spacer {
  display: block;
  width: 20px;
  height: 20px;
}

/* Account Content */
.account-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 32px;
  flex: 1;
  cursor: pointer;
  color: #333;
  font-size: 13px;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-content:hover {
  background: #f0f7ff;
  color: #0066cc;
}

.account-content.is-leaf {
  font-weight: 400;
  color: #333;
}

.account-content.is-leaf:hover {
  background: #e3f2fd;
  color: #0066cc;
}

.account-content.is-parent {
  font-weight: 500;
  color: #555;
}

.account-content.is-parent:hover {
  background: #f5f5f5;
}

.account-content.is-selected {
  background: #c8e6c9;
  color: #1b5e20;
  font-weight: 600;
}

.account-code {
  font-weight: 700;
  color: #0066cc;
  min-width: 50px;
  font-family: 'Courier New', monospace;
}

.account-content.is-parent .account-code {
  color: #666;
}

.account-separator {
  color: #ccc;
  font-size: 11px;
}

.account-name {
  flex: 1;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
}

.children-badge {
  background: #e0e0e0;
  color: #333;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* Nested Children Container */
.children-container {
  border-left: 1px solid #d0d0d0;
  margin-left: 12px;
}

/* phpMyAdmin style tree lines */
.children-container::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 0;
  width: 1px;
  height: 100%;
  background: #d0d0d0;
  pointer-events: none;
}

/* Responsive */
@media (max-width: 768px) {
  .account-content {
    font-size: 12px;
    padding: 0 8px;
  }

  .account-code {
    min-width: 40px;
  }

  .children-badge {
    font-size: 10px;
    padding: 1px 4px;
  }
}
</style>
