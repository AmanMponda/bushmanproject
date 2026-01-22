<template>
  <div class="account-tree-search">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-box">
        <span class="search-icon"><i class="fa fa-search"></i></span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by code or name..."
          class="search-input"
          @input="performSearch"
        />
        <button
          v-if="searchQuery"
          class="clear-btn"
          @click="clearSearch"
          title="Clear search"
        >
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="search-info">
        <span v-if="searchQuery" class="match-count">
          {{ matchedAccountsCount }} matches
        </span>
      </div>
    </div>

    <!-- Tree View -->
    <div class="tree-wrapper">
      <div v-if="displayAccounts.length > 0" class="tree-list">
        <AccountTreeItem
          v-for="account in displayAccounts"
          :key="account.id"
          :account="account"
          @select="$emit('select', $event)"
        />
      </div>
      <div v-else class="empty-state">
        <i class="fa fa-inbox"></i>
        <p v-if="searchQuery">No accounts match your search</p>
        <p v-else>No accounts available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AccountTreeItem from './AccountTreeItem.vue'

interface Account {
  id: number | string
  code: string
  name: string
  parent_account_id: number | string | null
  children?: Account[]
}

interface Props {
  accounts: Account[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [account: Account]
}>()

const searchQuery = ref('')
const matchedIds = ref<Set<number | string>>(new Set())

// Filter accounts recursively
const filterAccountsRecursive = (accounts: Account[], query: string): Account[] => {
  const lowerQuery = query.toLowerCase()
  const matched = new Set<number | string>()

  const filter = (acc: Account[]): Account[] => {
    return acc
      .map(account => {
        // Check if account matches search
        const codeMatches = account.code.toLowerCase().includes(lowerQuery)
        const nameMatches = account.name.toLowerCase().includes(lowerQuery)
        const isMatch = codeMatches || nameMatches

        // Recursively filter children
        const filteredChildren = account.children ? filter(account.children) : []

        // Include account if it matches or has matching children
        if (isMatch || filteredChildren.length > 0) {
          if (isMatch) matched.add(account.id)
          return {
            ...account,
            children: filteredChildren
          }
        }

        return null
      })
      .filter((acc): acc is Account => acc !== null)
  }

  const result = filter(accounts)
  matchedIds.value = matched
  return result
}

// Computed properties
const displayAccounts = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.accounts
  }
  return filterAccountsRecursive(props.accounts, searchQuery.value)
})

const matchedAccountsCount = computed(() => {
  if (!searchQuery.value.trim()) return 0
  
  let count = 0
  const countMatches = (accounts: Account[]) => {
    accounts.forEach(acc => {
      if (matchedIds.value.has(acc.id)) {
        count++
      }
      if (acc.children) {
        countMatches(acc.children)
      }
    })
  }
  countMatches(displayAccounts.value)
  return count
})

// Methods
const performSearch = () => {
  // Search happens reactively through computed property
}

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<style scoped>
.account-tree-search {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Search Header */
.search-header {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: white;
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.search-icon {
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  padding: 8px 0;
  font-size: 13px;
  outline: none;
  background: transparent;
  color: #333;
  font-family: inherit;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.clear-btn:hover {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 4px;
}

.search-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.match-count {
  background: #e3f2fd;
  color: #0066cc;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 500;
}

/* Tree Wrapper */
.tree-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: white;
}

.tree-list {
  padding: 0;
  border-collapse: collapse;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  color: #ddd;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Scrollbar styling */
.tree-wrapper::-webkit-scrollbar {
  width: 8px;
}

.tree-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.tree-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.tree-wrapper::-webkit-scrollbar-thumb:hover {
  background: #999;
}

@media (max-width: 768px) {
  .search-header {
    padding: 10px;
  }

  .search-input {
    font-size: 12px;
    padding: 6px 0;
  }
}
</style>
