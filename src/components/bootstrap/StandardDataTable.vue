<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  actionButtons: { type: Array, required: false, default: () => [] },
  customFilters: { type: Array, required: false, default: () => [] }, // NEW: Custom filters array
  loading: { type: Boolean, default: false },
  pageSizeOptions: { type: Array, default: () => [10, 25, 50, 100] },
  defaultPageSize: { type: Number, default: 10 },
  filters: { type: Object, default: () => ({}) },
  disablePagination: { type: Boolean, default: false },
  disableSearch: { type: Boolean, default: false },
  showDateFilters: { type: Boolean, default: true },
  pagination: { type: Object, default: null }, // For server-side
  serverSide: { type: Boolean, default: false }, // Enable server-side mode
  totalItems: { type: Number, default: 0 }, // For server-side count
  selectable: { type: Boolean, default: false }, // Enable row selection with checkboxes
})

const emit = defineEmits(['update:filters', 'row-action', 'page-change', 'selection-change'])

const showColumnSelector = ref(false)
const showAdvancedFilters = ref(false)
const sortField = ref('')
const sortDirection = ref('asc')
const pageSize = ref(props.defaultPageSize)
const currentPage = ref(1)
const search = ref('')
const selectedRows = ref(new Set())
const selectAll = ref(false)

// Initialize action buttons and custom filters
const actionButtons = ref(props.actionButtons || [])
const customFilters = ref(props.customFilters || [])

// Maintain local copy of filters for v-model bindings
const localFilters = ref({ ...(props.filters || {}) })

// Initialize custom filter values
watch(
  () => props.customFilters,
  (newFilters) => {
    customFilters.value = newFilters || []
    // Initialize filter values if not already set
    newFilters?.forEach((filter) => {
      if (filter.key && localFilters.value[filter.key] === undefined) {
        localFilters.value[filter.key] = filter.defaultValue || ''
      }
    })
  },
  { immediate: true },
)

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...(newFilters || {}) }
  },
  { deep: true },
)

watch(
  () => props.actionButtons,
  (val) => {
    actionButtons.value = val || []
  },
  { deep: true, immediate: true },
)

const columns = ref(props.columns.map((col) => ({ ...col })))

watch(
  () => props.columns,
  (newCols) => {
    columns.value = newCols.map((col) => ({ ...col }))
  },
)

const visibleColumns = computed(() => columns.value.filter((col) => col.visible !== false))

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj) || ''
}

// Filter data based on search input (client-side only)
const filteredData = computed(() => {
  if (props.serverSide) {
    return props.data // Server handles filtering
  }

  // Ensure props.data is an array
  if (!Array.isArray(props.data)) {
    return []
  }

  let result = props.data
  if (search.value) {
    result = result.filter((row) =>
      visibleColumns.value.some((col) => {
        const val = getNestedValue(row, col.key)
        return val && val.toString().toLowerCase().includes(search.value.toLowerCase())
      }),
    )
  }
  return result
})

// Sort data (client-side only)
const sortedData = computed(() => {
  if (props.serverSide) {
    return props.data // Server handles sorting
  }

  if (!sortField.value) return filteredData.value
  return [...filteredData.value].sort((a, b) => {
    let valueA = getNestedValue(a, sortField.value)
    let valueB = getNestedValue(b, sortField.value)
    if (typeof valueA === 'string') valueA = valueA.toLowerCase()
    if (typeof valueB === 'string') valueB = valueB.toLowerCase()
    if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

// Paginate data (client-side only)
const paginatedData = computed(() => {
  if (props.serverSide) {
    return props.data // Server-side: use props.data as-is
  }

  // Client-side: slice data
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

const visibleData = computed(() => {
  // Ensure props.data is an array
  if (!Array.isArray(props.data)) {
    console.warn('StandardDataTable: props.data is not an array:', props.data)
    return []
  }

  if (props.serverSide) {
    return props.data // Server-side: use props.data as-is
  }
  if (props.disablePagination) {
    return sortedData.value // Client-side without pagination: use sorted (and filtered) data
  }
  return paginatedData.value // Client-side with pagination: use paginated data
})

// Debug: Watch props.data changes (moved after props and visibleData definition)
watch(
  () => props.data,
  (newData) => {
    console.log('StandardDataTable: props.data changed', {
      isArray: Array.isArray(newData),
      length: Array.isArray(newData) ? newData.length : 'N/A',
      sample: Array.isArray(newData) && newData.length > 0 ? newData[0] : null,
    })
  },
  { immediate: true, deep: true },
)

// Debug: Watch visibleData changes (moved after visibleData definition)
watch(
  visibleData,
  (newData) => {
    console.log('StandardDataTable: visibleData changed', {
      length: newData.length,
      disablePagination: props.disablePagination,
      serverSide: props.serverSide,
    })
  },
  { immediate: true },
)

const totalPages = computed(() => {
  if (props.disablePagination) {
    return 1
  }
  if (props.serverSide && props.pagination) {
    return props.pagination.last_page
  }
  return Math.ceil(sortedData.value.length / pageSize.value)
})

const visiblePages = computed(() => {
  if (props.disablePagination) {
    return [1]
  }

  const total = totalPages.value
  const current = currentPage.value
  const maxPages = 7
  const pages = []

  if (total <= maxPages) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return pages
})

function sortTable(key) {
  if (props.disablePagination || props.serverSide) {
    return // Sorting handled by server in server-side mode
  }

  if (sortField.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = key
    sortDirection.value = 'asc'
  }

  if (props.serverSide) {
    // Emit sort change for server-side
    applyFilters()
  }
}

function changePage(page) {
  if (props.disablePagination) {
    return
  }

  if (props.serverSide) {
    // Emit event for parent to handle API call
    emit('page-change', page)
    currentPage.value = page
  } else if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function applyFilters() {
  // Reset to first page when applying new filters/search (except for server-side page changes)
  if (!props.serverSide) {
    currentPage.value = 1
  }

  // Build filter object
  const filterObject = {
    search: search.value,
    limit: pageSize.value,
    page: currentPage.value,
    sortField: sortField.value,
    sortDirection: sortDirection.value,
    ...localFilters.value,
  }

  // Remove undefined values
  Object.keys(filterObject).forEach((key) => {
    if (filterObject[key] === undefined || filterObject[key] === '') {
      delete filterObject[key]
    }
  })

  emit('update:filters', filterObject)
}

function clearFilters() {
  search.value = ''
  showAdvancedFilters.value = false

  // Reset custom filters to their default values
  customFilters.value.forEach((filter) => {
    if (filter.key && localFilters.value[filter.key] !== undefined) {
      localFilters.value[filter.key] = filter.defaultValue || ''
    }
  })

  // Reset date filters if they exist
  if (localFilters.value.date_from) localFilters.value.date_from = ''
  if (localFilters.value.date_to) localFilters.value.date_to = ''

  applyFilters()
}

// Checkbox selection functions
function toggleRowSelection(row, index) {
  const rowId = row.id || index
  if (selectedRows.value.has(rowId)) {
    selectedRows.value.delete(rowId)
  } else {
    selectedRows.value.add(rowId)
  }
  selectAll.value = false
  emitSelectionChange()
}

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  if (selectAll.value) {
    visibleData.value.forEach((row, index) => {
      const rowId = row.id || index
      selectedRows.value.add(rowId)
    })
  } else {
    visibleData.value.forEach((row, index) => {
      const rowId = row.id || index
      selectedRows.value.delete(rowId)
    })
  }
  emitSelectionChange()
}

function isRowSelected(row, index) {
  const rowId = row.id || index
  return selectedRows.value.has(rowId)
}

function emitSelectionChange() {
  const selected = visibleData.value.filter((row, index) => {
    const rowId = row.id || index
    return selectedRows.value.has(rowId)
  })
  emit('selection-change', selected)
}
</script>

<template>
  <div>
    <!-- Search and Action Buttons Header -->
    <div v-if="!props.disableSearch" class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="flex-grow-1" style="max-width: 350px">
        <div class="input-group">
          <input
            v-model="search"
            type="text"
            class="form-control"
            placeholder="Search..."
            :disabled="props.disableSearch"
            :readonly="props.disableSearch"
            @keyup.enter="applyFilters"
          />
          <button
            class="btn btn-outline-secondary"
            :disabled="props.disableSearch"
            :readonly="props.disableSearch"
            @click="applyFilters"
          >
            <i class="fa fa-search"></i>
          </button>
        </div>
      </div>
      <div class="d-flex gap-2">
        <!-- Action Buttons -->
        <button
          v-for="action in actionButtons"
          :key="action.label"
          class="btn"
          :class="action.class || 'btn-outline-info'"
          :disabled="props.disableSearch"
          :readonly="props.disableSearch"
          :title="action.tooltip"
          @click="action.method"
        >
          <i :class="`${action.icon} me-1`"></i>
          {{ action.label }}
        </button>

        <!-- Filters Toggle -->
        <button
          class="btn btn-outline-info"
          :disabled="props.disableSearch"
          :readonly="props.disableSearch"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <i class="fa fa-filter me-1"></i>
          {{ showAdvancedFilters ? 'Hide Filters' : 'Filters' }}
          <!-- <span v-if="Object.keys(localFilters).some(key => localFilters[key])" class="badge bg-danger ms-1">
            {{Object.keys(localFilters).filter(key => localFilters[key]).length}}
          </span> -->
        </button>

        <!-- Column Selector -->
        <button
          class="btn btn-outline-info"
          :disabled="props.disableSearch"
          :readonly="props.disableSearch"
          @click="showColumnSelector = !showColumnSelector"
        >
          <i class="fa fa-columns"></i>
        </button>
      </div>
    </div>

    <!-- Advanced Filters Section -->
    <div v-if="showAdvancedFilters && !props.disableSearch" class="card mb-4">
      <div class="card-body">
        <div class="row filters-row">
          <!-- Date Filters (Built-in) -->
          <div v-if="props.showDateFilters" class="col-md-3 filter-col">
            <label class="form-label">Date From</label>
            <input
              v-model="localFilters.date_from"
              type="date"
              class="form-control"
              :disabled="props.disableSearch"
              :readonly="props.disableSearch"
              @change="applyFilters"
            />
          </div>
          <div v-if="props.showDateFilters" class="col-md-3 filter-col">
            <label class="form-label">Date To</label>
            <input
              v-model="localFilters.date_to"
              type="date"
              class="form-control"
              :disabled="props.disableSearch"
              :readonly="props.disableSearch"
              @change="applyFilters"
            />
          </div>

          <!-- Custom Filters -->
          <div v-for="filter in customFilters" :key="filter.key" class="col-md-3 filter-col">
            <label class="form-label">{{ filter.label }}</label>
            <template v-if="filter.type === 'select'">
              <select
                v-model="localFilters[filter.key]"
                class="form-select"
                :disabled="props.disableSearch"
                :readonly="props.disableSearch"
                @change="applyFilters"
              >
                <option value="">{{ filter.placeholder || `Select ${filter.label}` }}</option>
                <option v-for="option in filter.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </template>
            <template v-else-if="filter.type === 'date'">
              <input
                v-model="localFilters[filter.key]"
                type="date"
                class="form-control"
                :disabled="props.disableSearch"
                :readonly="props.disableSearch"
                @change="applyFilters"
              />
            </template>
            <template v-else-if="filter.type === 'number'">
              <input
                v-model="localFilters[filter.key]"
                type="number"
                class="form-control"
                :placeholder="filter.placeholder || filter.label"
                :disabled="props.disableSearch"
                :readonly="props.disableSearch"
                @keyup.enter="applyFilters"
              />
            </template>
            <template v-else>
              <input
                v-model="localFilters[filter.key]"
                type="text"
                class="form-control"
                :placeholder="filter.placeholder || filter.label"
                :disabled="props.disableSearch"
                :readonly="props.disableSearch"
                @keyup.enter="applyFilters"
              />
            </template>
          </div>

          <!-- Page Size Selector -->
          <div class="col-md-3 filter-col">
            <label class="form-label">Items per page</label>
            <select
              v-model="pageSize"
              class="form-select"
              :disabled="props.disableSearch"
              :readonly="props.disableSearch"
              @change="applyFilters"
            >
              <option v-for="size in props.pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </div>

          <!-- Filter Actions -->
          <div class="col-12 d-flex justify-content-between align-items-end mt-2">
            <div>
              <button class="btn btn-outline-danger btn-sm" @click="clearFilters">
                <i class="fa fa-times me-1"></i> Clear All Filters
              </button>
            </div>
            <div>
              <button class="btn btn-outline-info btn-sm" @click="applyFilters">
                <i class="fa fa-check me-1"></i> Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Column Selector -->
    <div v-if="showColumnSelector && !props.disableSearch" class="card mb-3">
      <div class="card-body">
        <h6 class="card-title mb-3">Visible Columns</h6>
        <div class="row">
          <div v-for="(col, index) in columns" :key="index" class="col-md-3 mb-2">
            <div class="form-check">
              <input
                :id="'col-' + index"
                v-model="col.visible"
                class="form-check-input"
                type="checkbox"
                :disabled="props.disableSearch"
                :readonly="props.disableSearch"
              />
              <label class="form-check-label" :for="'col-' + index">
                {{ col.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="props.loading" class="text-center py-5">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading data...</p>
    </div>

    <!-- Data Table -->
    <div v-else>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead class="table-light">
            <tr>
              <th v-if="props.selectable" class="checkbox-column">
                <input type="checkbox" class="form-check-input" :checked="selectAll" @change="toggleSelectAll" />
              </th>
              <th
                v-for="col in visibleColumns"
                :key="col.key"
                :class="{ sortable: col.sortable && !props.disablePagination && !props.serverSide }"
                @click="col.sortable && !props.disablePagination && !props.serverSide ? sortTable(col.key) : null"
              >
                <div class="d-flex align-items-center">
                  <span>{{ col.label }}</span>
                  <i
                    v-if="col.sortable && !props.disablePagination && !props.serverSide"
                    class="fa ms-2"
                    :class="{
                      'fa-sort': sortField !== col.key,
                      'fa-sort-up': sortField === col.key && sortDirection === 'asc',
                      'fa-sort-down': sortField === col.key && sortDirection === 'desc',
                    }"
                  ></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in visibleData" :key="row.id || index">
              <td v-if="props.selectable" class="checkbox-column">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :checked="isRowSelected(row, index)"
                  @change="toggleRowSelection(row, index)"
                />
              </td>
              <td v-for="col in visibleColumns" :key="col.key">
                <slot :name="col.key" :row="row" :index="index">
                  {{ getNestedValue(row, col.key) }}
                </slot>
              </td>
            </tr>
            <tr v-if="visibleData.length === 0">
              <td :colspan="visibleColumns.length + (props.selectable ? 1 : 0)" class="text-center py-4 text-muted">
                No data found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!props.disablePagination" class="d-md-flex align-items-center mt-3">
        <div class="me-md-auto text-md-left text-center mb-2 mb-md-0">
          <template v-if="props.serverSide && props.pagination">
            Showing {{ (props.pagination.current_page - 1) * props.pagination.per_page + 1 }} to
            {{ Math.min(props.pagination.current_page * props.pagination.per_page, props.pagination.total) }} of
            {{ props.pagination.total }} entries
          </template>
          <template v-else>
            Showing {{ (currentPage - 1) * pageSize + 1 }} to
            {{ Math.min(currentPage * pageSize, sortedData.length) }} of {{ sortedData.length }} entries
          </template>
        </div>

        <ul class="pagination mb-0 justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
              <i class="fa fa-chevron-left"></i>
            </a>
          </li>
          <li
            v-for="page in visiblePages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage, disabled: page === '...' }"
          >
            <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
            <span v-else class="page-link">…</span>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">
              <i class="fa fa-chevron-right"></i>
            </a>
          </li>
        </ul>

        <div class="ms-3">
          <select
            v-model="pageSize"
            class="form-select"
            :disabled="props.disablePagination"
            :readonly="props.disablePagination"
            @change="applyFilters"
          >
            <option v-for="size in props.pageSizeOptions" :key="size" :value="size">
              {{ size }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

table.table {
  width: 100%;
  margin-bottom: 0;
  border-collapse: collapse;
  background-color: #ffffff;
  font-size: 0.8125rem;
}

table.table thead th {
  border-bottom: 2px solid #dee2e6;
  padding: 0.5rem 0.75rem;
  font-weight: 700;
  font-size: 0.75rem;
  color: #495057;
  text-align: left;
  vertical-align: middle;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

table.table thead th.sortable {
  cursor: pointer;
  user-select: none;
}

table.table thead th.sortable:hover {
  background-color: #f0f0f0;
}

table.table tbody td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
  font-size: 0.8125rem;
  color: #212529;
  background-color: #ffffff;
}

table.table tbody tr:hover {
  background-color: #f8f9fa;
}

table.table tbody tr:last-child td {
  border-bottom: 1px solid #dee2e6;
}

.checkbox-column {
  width: 40px;
  min-width: 40px;
  text-align: center;
  padding: 0.5rem !important;
}

.checkbox-column .form-check-input {
  margin: 0;
  cursor: pointer;
}

.pagination {
  margin-bottom: 0;
}

.pagination .page-item .page-link {
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 0.375rem 0.75rem;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: #ffffff;
}

.pagination .page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  background-color: #ffffff;
  border-color: #dee2e6;
}

.pagination .page-item .page-link:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.pagination .page-item.active .page-link:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

/* Filter spacing */
.filters-row {
  --bs-gutter-x: 2rem !important;
  margin-left: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
  margin-right: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
}

.filters-row .filter-col {
  padding-left: calc(var(--bs-gutter-x) * 0.5) !important;
  padding-right: calc(var(--bs-gutter-x) * 0.5) !important;
}
</style>
