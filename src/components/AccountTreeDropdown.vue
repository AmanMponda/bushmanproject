<template>
  <div class="account-tree-dropdown">
    <!-- Input Field -->
    <div class="dropdown-trigger">
      <input
        v-model="selectedAccountDisplay"
        type="text"
        placeholder="Select account..."
        readonly
        class="dropdown-input"
        @click="toggleDropdown"
      />
      <button
        class="dropdown-toggle-btn"
        :class="{ open: isOpen }"
        @click="toggleDropdown"
        aria-label="Toggle dropdown"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>

    <!-- Dropdown Menu -->
    <div v-if="isOpen" class="dropdown-menu">
      <div class="dropdown-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <span>Loading accounts...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <span>{{ error }}</span>
        </div>

        <!-- Tree View -->
        <div v-else-if="accountTree.length > 0" class="tree-container">
          <AccountTreeItem
            v-for="account in accountTree"
            :key="account.id"
            :account="account"
            @select="handleSelectAccount"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span>No accounts available</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, withDefaults } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AccountTreeItem from './AccountTreeItem.vue'

interface Account {
  id: number | string
  code: string
  name: string
  parent_account_id: number | string | null
  children?: Account[]
}

// Props
interface Props {
  modelValue?: Account | null
  apiUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: '/api/v1.0/accounts/tree'
})

const authStore = useAuthStore()

// Computed property for company_id
const companyId = computed(() => {
  const activeService = authStore.getActiveService()
  if (activeService?.company_id) return activeService.company_id
  return authStore.companiesIds?.abs_id || 1
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [account: Account]
  select: [account: Account]
}>()

// State
const isOpen = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const accountTree = ref<Account[]>([])
const selectedAccount = ref<Account | null>(props.modelValue || null)

// Computed
const selectedAccountDisplay = computed(() => {
  if (!selectedAccount.value) return ''
  return `${selectedAccount.value.code} - ${selectedAccount.value.name}`
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && accountTree.value.length === 0) {
    fetchAccounts()
  }
}

const fetchAccounts = async () => {
  loading.value = true
  error.value = null

  try {
    // Build URL with company_id parameter
    const baseUrl = (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8000/api/v1.0/').replace(/\/$/, '')
    const apiPath = props.apiUrl.startsWith('/') ? props.apiUrl.substring(1) : props.apiUrl
    const url = new URL(`${baseUrl}/${apiPath}`)
    url.searchParams.set('company_id', String(companyId.value))
    
    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Handle both direct array and nested response structure
    accountTree.value = Array.isArray(data) ? data : data.data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load accounts'
    console.error('Error fetching accounts:', err)
  } finally {
    loading.value = false
  }
}

const handleSelectAccount = (account: Account) => {
  selectedAccount.value = account
  emit('update:modelValue', account)
  emit('select', account)
  closeDropdown()
}

const closeDropdown = () => {
  isOpen.value = false
}

// Lifecycle
onMounted(() => {
  // Watch for external modelValue changes
  if (props.modelValue) {
    selectedAccount.value = props.modelValue
  }
})

// Watch for prop changes
import { watch } from 'vue'
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedAccount.value = newVal
  }
})

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const element = event.target as HTMLElement
  const dropdown = document.querySelector('.account-tree-dropdown') as HTMLElement

  if (dropdown && !dropdown.contains(element)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.account-tree-dropdown {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: white;
  padding: 0 8px;
  transition: all 0.2s ease;
}

.dropdown-trigger:focus-within {
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.dropdown-input {
  flex: 1;
  border: none;
  padding: 8px 4px;
  font-size: 14px;
  font-family: inherit;
  background: transparent;
  cursor: pointer;
  outline: none;
  color: #333;
}

.dropdown-input::placeholder {
  color: #999;
}

.dropdown-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.dropdown-toggle-btn:hover {
  color: #0066cc;
}

.dropdown-toggle-btn.open {
  transform: rotate(180deg);
  color: #0066cc;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-content {
  padding: 8px 0;
}

.tree-container {
  max-height: 380px;
  overflow-y: auto;
  padding: 4px 8px;
}

.loading-state,
.error-state,
.empty-state {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.error-state {
  color: #d32f2f;
}

/* Scrollbar styling */
.dropdown-menu::-webkit-scrollbar {
  width: 8px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
