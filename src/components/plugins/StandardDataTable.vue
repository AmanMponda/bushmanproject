<script setup>
import { ref, computed, watch } from 'vue';
import vueSelect from '@/components/plugins/vueSelect.vue';
import EmptyState from "@/components/bootstrap/emptyState.vue";

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
  showPageSizeFilters: { type: Boolean, default: true },
  pagination: { type: Object, default: null }, // For server-side
  serverSide: { type: Boolean, default: false }, // Enable server-side mode
  totalItems: { type: Number, default: 0 }, // For server-side count
  showAdvancedFiltersButton: { type: Boolean, default: true }, // Enable Advanced Filters Button
  showColumnSelectorButton: { type: Boolean, default: true }, // Enable Advanced Filters Button
});

const emit = defineEmits(['update:filters', 'row-action', 'page-change']);

const showColumnSelector = ref(false);
const showAdvancedFilters = ref(false);
const sortField = ref('');
const sortDirection = ref('asc');
const pageSize = ref(props.defaultPageSize);
const currentPage = ref(1);
const search = ref('');

// Initialize action buttons and custom filters
const actionButtons = ref(props.actionButtons || []);
const customFilters = ref(props.customFilters || []);

// Maintain local copy of filters for v-model bindings
const localFilters = ref({ ...(props.filters || {}) });

// Initialize custom filter values
watch(() => props.customFilters, (newFilters) => {
  customFilters.value = newFilters || [];
  // Initialize filter values if not already set
  newFilters?.forEach(filter => {
    if (filter.key && localFilters.value[filter.key] === undefined) {
      localFilters.value[filter.key] = filter.defaultValue || '';
    }
  });
}, { immediate: true });

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...(newFilters || {}) };
  // Sync limit from parent filters to pageSize
  if (newFilters?.limit) {
    pageSize.value = newFilters.limit;
  }
  // Sync search from parent filters to local search input
  if (newFilters?.search !== undefined) {
    search.value = newFilters.search;
  }
}, { deep: true });

watch(() => props.actionButtons, (val) => {
  actionButtons.value = val || [];
}, { deep: true, immediate: true });

// Keep `localFilters.limit` in sync when `pageSize` changes
watch(pageSize, (newSize) => {
  const sizeNum = Number(newSize) || props.defaultPageSize;
  if (!localFilters.value) localFilters.value = {};
  localFilters.value.limit = sizeNum;
  // applyFilters();
});

const columns = ref(props.columns.map(col => ({ ...col })));

watch(() => props.columns, (newCols) => {
  columns.value = newCols.map(col => ({ ...col }));
});

const visibleColumns = computed(() => columns.value.filter(col => col.visible !== false));

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj) || '';
}

// Filter data based on search input (client-side only)
const filteredData = computed(() => {
  if (props.serverSide) {
    return props.data; // Server handles filtering
  }

  let result = props.data;
  if (search.value) {
    result = result.filter(row =>
      visibleColumns.value.some(col => {
        const val = getNestedValue(row, col.key);
        return val && val.toString().toLowerCase().includes(search.value.toLowerCase());
      })
    );
  }
  return result;
});

// Sort data (client-side only)
const sortedData = computed(() => {
  if (props.serverSide) {
    return props.data; // Server handles sorting
  }

  if (!sortField.value) return filteredData.value;
  return [...filteredData.value].sort((a, b) => {
    let valueA = getNestedValue(a, sortField.value);
    let valueB = getNestedValue(b, sortField.value);
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();
    if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
});

// Paginate data (client-side only)
const paginatedData = computed(() => {
  if (props.serverSide) {
    return props.data; // Server-side: use props.data as-is
  }

  // Client-side: slice data
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedData.value.slice(start, start + pageSize.value);
});

const visibleData = computed(() => {
  if (props.disablePagination || props.serverSide) {
    return props.data;
  }
  return paginatedData.value;
});

const totalPages = computed(() => {
  if (props.disablePagination) {
    return 1;
  }
  if (props.serverSide && props.pagination) {
    return props.pagination.last_page;
  }
  return Math.ceil(sortedData.value.length / pageSize.value);
});

const visiblePages = computed(() => {
  if (props.disablePagination) {
    return [1];
  }

  const total = totalPages.value;
  const current = currentPage.value;
  const maxPages = 7;
  const pages = [];

  if (total <= maxPages) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
});

function sortTable(key) {
  if (props.disablePagination || props.serverSide) {
    return; // Sorting handled by server in server-side mode
  }

  if (sortField.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = key;
    sortDirection.value = 'asc';
  }

  if (props.serverSide) {
    // Emit sort change for server-side
    applyFilters();
  }
}

function changePage(page) {
  if (props.disablePagination) {
    return;
  }

  if (props.serverSide) {
    // Emit event for parent to handle API call
    emit('page-change', page);
    currentPage.value = page;
  } else if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function clearSearch() {
  search.value = '';
  // remove search from local filters as well
  if (localFilters.value && localFilters.value.search !== undefined) {
    delete localFilters.value.search;
  }
  applyFilters();
}

function applyFilters() {
  // Reset to first page when applying new filters/search (except for server-side page changes)
  if (!props.serverSide) {
    currentPage.value = 1;
  }

  // If a custom filter controls page size (e.g. localFilters.limit or localFilters.per_page),
  // sync it into the internal pageSize so client-side paging and emitted filters stay consistent.
  if (localFilters.value.limit !== undefined) {
    pageSize.value = Number(localFilters.value.limit) || pageSize.value;
  } else if (localFilters.value.per_page !== undefined) {
    pageSize.value = Number(localFilters.value.per_page) || pageSize.value;
  }

  // Ensure the search value is included in localFilters so it's emitted
  if (search.value && search.value.toString().trim() !== '') {
    localFilters.value.search = search.value;
  } else if (localFilters.value && localFilters.value.search !== undefined) {
    // remove empty search
    delete localFilters.value.search;
  }

  // Build filter object
  const filterObject = {
    // include search via localFilters to keep everything consistent
    limit: parseInt(pageSize.value),
    page: currentPage.value,
    sortField: sortField.value,
    sortDirection: sortDirection.value,
    ...localFilters.value
  };

  // Remove undefined values
  Object.keys(filterObject).forEach(key => {
    if (filterObject[key] === undefined || filterObject[key] === '' || filterObject[key] === '0') {
      delete filterObject[key];
    }
  });

  emit('update:filters', filterObject);
}

const clearFilters = async () => {
  // Reset UI controls
  search.value = '';
  showAdvancedFilters.value = false;

  // Rebuild localFilters from customFilters defaults (ensures keys are present)
  const resetFilters = {};
  customFilters.value.forEach(filter => {
    if (filter.key) {
      resetFilters[filter.key] = filter.defaultValue !== undefined ? filter.defaultValue : '';
    }
  });

  // Ensure built-in date keys exist and are cleared
  resetFilters.date_from = '';
  resetFilters.date_to = '';

  // Apply reset to reactive localFilters
  localFilters.value = resetFilters;

  // Reset pagination and page size to defaults
  pageSize.value = props.defaultPageSize;
  currentPage.value = 1;

  // Emit cleared filters
  await applyFilters();
}
</script>

<template>
  <div>
    <!-- Search and Action Buttons Header -->
    <div v-if="!props.disableSearch" class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="flex-grow-1" style="max-width: 350px">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Search..." v-model="search" @keyup.enter="applyFilters"
            :disabled="props.disableSearch" :readonly="props.disableSearch" />
          <button class="btn btn-outline-secondary" @click="applyFilters" :disabled="props.disableSearch"
            :readonly="props.disableSearch">
            <i class="fa fa-search"></i>
          </button>
        </div>
      </div>
      <div class="d-flex gap-2">
        <!-- Action Buttons -->
        <button v-for="action in actionButtons" :key="action.label" class="btn"
          :class="action.class || 'btn-outline-info'" @click="action.method" :disabled="props.disableSearch"
          :readonly="props.disableSearch" :title="action.tooltip">
          <i :class="`${action.icon} me-1`"></i>
          {{ action.label }}
        </button>

        <!-- Filters Toggle -->
        <button v-if="showAdvancedFiltersButton" class="btn btn-outline-info" @click="showAdvancedFilters = !showAdvancedFilters"
          :disabled="props.disableSearch" :readonly="props.disableSearch">
          <i class="fa fa-filter me-1"></i>
          {{ showAdvancedFilters ? "Hide Filters" : "Filters" }}
          <!-- <span v-if="Object.keys(localFilters).some(key => localFilters[key])" class="badge bg-danger ms-1">
            {{Object.keys(localFilters).filter(key => localFilters[key]).length}}
          </span> -->
        </button>

        <!-- Column Selector -->
        <button v-if="showColumnSelectorButton" class="btn btn-outline-info" @click="showColumnSelector = !showColumnSelector"
          :disabled="props.disableSearch" :readonly="props.disableSearch">
          <i class="fa fa-columns"></i>
        </button>
      </div>
    </div>

    <!-- Soft gradient divider -->
    <div class="soft-divider" v-if="!props.disableSearch"></div>

    <!-- Advanced Filters Section -->
    <div v-if="showAdvancedFilters && !props.disableSearch" class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <!-- Date Filters (Built-in) -->
          <div v-if="props.showDateFilters" class="col-md-3">
            <label class="form-label">Date From</label>
            <input type="date" class="form-control" v-model="localFilters.date_from" @change="applyFilters"
              :disabled="props.disableSearch" :readonly="props.disableSearch" :max="localFilters.date_to" />
          </div>
          <div v-if="props.showDateFilters" class="col-md-3">
            <label class="form-label">Date To</label>
            <input type="date" class="form-control" v-model="localFilters.date_to" @change="applyFilters"
              :disabled="props.disableSearch" :readonly="props.disableSearch" :min="localFilters.date_from" />
          </div>

          <!-- Custom Filters -->
          <div v-for="filter in customFilters" :key="filter.key" class="col-md-3">
            <label class="form-label">{{ filter.label }}</label>
            <template v-if="filter.type === 'vselect'">
              <vue-select v-model="localFilters[filter.key]" :options="filter.options" @update:modelValue="applyFilters"
                :placeholder="filter.placeholder || `Select ${filter.label}`"
                :clearable="(filter.clearable !== undefined) ? filter.clearable : true"
                :multiple="filter.multiple ?? false" :label="filter.labelKey || 'label'" />
            </template>
            <template v-else-if="filter.type === 'select'">
              <select class="form-select" v-model="localFilters[filter.key]" @change="applyFilters"
                :disabled="props.disableSearch" :readonly="props.disableSearch">
                <option value="">{{ filter.placeholder || `Select ${filter.label}` }}</option>
                <option v-for="option in filter.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </template>
            <template v-else-if="filter.type === 'date'">
              <input type="date" class="form-control" v-model="localFilters[filter.key]" @change="applyFilters"
                :disabled="props.disableSearch" :readonly="props.disableSearch" />
            </template>
            <template v-else-if="filter.type === 'number'">
              <input type="number" class="form-control" v-model="localFilters[filter.key]" @keyup.enter="applyFilters"
                :placeholder="filter.placeholder || filter.label" :disabled="props.disableSearch"
                :readonly="props.disableSearch" />
            </template>
            <template v-else>
              <input type="text" class="form-control" v-model="localFilters[filter.key]" @keyup.enter="applyFilters"
                :placeholder="filter.placeholder || filter.label" :disabled="props.disableSearch"
                :readonly="props.disableSearch" />
            </template>
          </div>

          <!-- Page Size Selector -->
          <div v-if="props.showPageSizeFilters" class="col-md-3">
            <label class="form-label">Items per page</label>
            <select class="form-select" v-model="pageSize" @change="applyFilters" :disabled="props.disableSearch"
              :readonly="props.disableSearch">
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
              <button class="btn btn-primary" @click="applyFilters">
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
          <div class="col-md-3 mb-2" v-for="(col, index) in columns" :key="index">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="col.visible" :id="'col-' + index"
                :disabled="props.disableSearch" :readonly="props.disableSearch" />
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

    <div v-else-if="visibleData.length === 0" class="text-center py-4">
      <EmptyState :title="'No data found!'" :subtitle="'There are no data to display. Try to adjust your filters.'"
        :icon="'fa-solid fa-exclamation-triangle'" :colorClass="'text-warning'" :showButton="false" />
    </div>

    <!-- Data Table -->
    <div v-else>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th v-for="col in visibleColumns" :key="col.key"
                @click="(col.sortable && !props.disablePagination && !props.serverSide) ? sortTable(col.key) : null"
                :class="{ sortable: col.sortable && !props.disablePagination && !props.serverSide }">
                <div class="d-flex align-items-center">
                  <span>{{ col.label }}</span>
                  <i v-if="col.sortable && !props.disablePagination && !props.serverSide" class="fa ms-2" :class="{
                    'fa-sort': sortField !== col.key,
                    'fa-sort-up': sortField === col.key && sortDirection === 'asc',
                    'fa-sort-down': sortField === col.key && sortDirection === 'desc',
                  }"></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in visibleData" :key="row.id || index">
              <td v-for="col in visibleColumns" :key="col.key">
                <slot :name="col.key" :row="row" :index="index">
                  {{ getNestedValue(row, col.key) }}
                </slot>
              </td>
            </tr>
            <tr v-if="visibleData.length === 0">
              <td :colspan="visibleColumns.length" class="text-center py-4 text-muted">
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
            Showing {{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} to
            {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} of
            {{ pagination.total }} entries
          </template>
          <template v-else>
            Showing {{ (currentPage - 1) * pageSize + 1 }} to
            {{ Math.min(currentPage * pageSize, sortedData.length) }} of
            {{ sortedData.length }} entries
          </template>
        </div>

        <ul class="pagination mb-0 justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
              <i class="fa fa-chevron-left"></i>
            </a>
          </li>
          <li v-for="page in visiblePages" :key="page" class="page-item"
            :class="{ active: page === currentPage, disabled: page === '...' }">
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
          <select class="form-select" v-model="pageSize" @change="applyFilters" :disabled="props.disablePagination"
            :readonly="props.disablePagination">
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
.sortable {
  cursor: pointer;
}

.sortable:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.soft-divider {
  height: 10px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0));
  border: 0;
  margin-top: -8px;
  margin-bottom: 8px;
}

.table-responsive {
  border-radius: 0 !important;
}

table.table {
  border-collapse: separate;
  border-spacing: 0;
}

table.table thead th:first-child {
  border-top-left-radius: 0 !important;
}

table.table thead th:last-child {
  border-top-right-radius: 0 !important;
}

table.table thead th {
  border-top: none;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.04);
  background-color: #f8f9fa !important;
  font-weight: 700 !important;
  font-size: 0.65rem !important;
  color: #495057 !important;
  border-color: #dee2e6;
  padding: 0.75rem 0.5rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

table.table tbody tr:first-child td {
  border-top: none;
}

table.table tbody td {
  background-color: #fff;
  border-top: 1px solid #f1f3f4;
  vertical-align: middle;
}

table.table thead th {
  background-color: #f8f9fa !important;
  border-color: #dee2e6;
}

/* Custom filter badge */
.badge {
  font-size: 0.6rem;
  padding: 0.2rem 0.4rem;
}
</style>
