<template>
  <div class="manage-entity-categories-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">System Configuration</a></li>
          <li class="breadcrumb-item active">Entity Categories</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <!-- <div class="mb-3">
              <h2 class="mb-0">Company Entity Categories</h2>
              <p class="text-muted mb-0 small">
                Create, update, and manage categories used to classify company entities.
              </p>
            </div> -->

            <StandardDataTable
              ref="tableRef"
              :columns="columns"
              :data="flattenedCategories"
              :loading="loading"
              :filters="tableFilters"
              :action-buttons="pageActions"
              :custom-filters="customFilters"
              :show-date-filters="false"
              @update:filters="handleFiltersUpdate"
            >
              <template #name="{ row }">
                <div :style="{ paddingLeft: (row.level || 0) * 24 + 'px' }" class="d-flex align-items-center">
                  <!-- Expand/Collapse button for categories with children -->
                  <button 
                    v-if="row.children_count > 0" 
                    @click="toggleExpand(row.id)"
                    class="btn btn-link btn-sm p-0 me-2 text-decoration-none"
                    style="width: 20px; height: 20px;"
                    :title="expandedCategories.has(row.id) ? 'Collapse' : 'Expand'"
                  >
                    <i class="fa" :class="expandedCategories.has(row.id) ? 'fa-minus-square text-primary' : 'fa-plus-square text-secondary'"></i>
                  </button>
                  <span v-else style="width: 20px; display: inline-block;" class="me-2"></span>
                  
                  <span v-if="row.level === 0" class="badge bg-warning bg-opacity-20 text-warning me-2">
                    <i class="fa fa-layer-group"></i>
                  </span>
                  <span v-else-if="row.level === 1" class="me-2 text-primary">
                    <i class="fa fa-arrow-turn-down-right"></i>
                  </span>
                  <span v-else class="me-2 text-muted" style="opacity: 0.6;">
                    <i class="fa fa-arrow-turn-down-right"></i>
                  </span>
                  <span class="fw-semibold">{{ row.name }}</span>
                </div>
              </template>
              <template #parent_name="{ row }">
                <div>
                  <span class="fw-medium">{{ row.display_name }}</span>
                  <div v-if="row.level > 0" class="small text-muted mt-1">
                    <i class="fa fa-sitemap me-1"></i>Path: {{ getCategoryPath(row) }}
                  </div>
                </div>
              </template>
              <template #children_count="{ row }">
                <span v-if="row.children_count > 0" class="badge bg-primary bg-opacity-20 text-primary">
                  {{ row.children_count }} subcategories
                </span>
                <span v-else class="text-muted">--</span>
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" title="View" @click="openViewModal(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" title="Edit" @click="openCategoryModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" title="Add Subcategory" @click="openSubcategoryModal(row)">
                    <i class="fa fa-plus"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <div class="modal fade" :class="{ show: showCategoryModal }" :style="{ display: showCategoryModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-tags me-2"></i>
              {{ editingCategory ? 'Edit Category' : 'Add Category' }}
            </h5>
            <button type="button" class="btn-close" @click="closeCategoryModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCategory">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="categoryForm.name" type="text" class="form-control" placeholder="SUPPLIER" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Display Name <span class="text-danger">*</span></label>
                  <input v-model="categoryForm.display_name" type="text" class="form-control" placeholder="Supplier" required />
                </div>
                <div class="col-md-12">
                  <label class="form-label">Parent Category</label>
                  <Multiselect
                    v-model="selectedParentCategory"
                    :options="hierarchicalParentOptions"
                    :custom-label="getCategoryLabel"
                    group-values="children"
                    group-label="label"
                    track-by="id"
                    placeholder="-- No Parent (Root Category) --"
                    :allow-empty="true"
                    :show-labels="false"
                    @select="onParentSelect"
                    @remove="onParentRemove"
                  >
                    <template #option="{ option }">
                      <span v-if="option.$isLabel" class="fw-bold text-primary">
                        <i class="fa fa-folder-open me-2"></i>{{ option.$groupLabel }}
                      </span>
                      <span v-else>
                        <i class="fa fa-tag me-2"></i>{{ option.display_name || option.name }}
                      </span>
                    </template>
                  </Multiselect>
                  <small class="text-muted">Select a parent to create a subcategory (e.g., Food Suppliers under Supplier)</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category Code</label>
                  <input v-model="categoryForm.category_code" type="text" class="form-control" placeholder="SUPP" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Keyword</label>
                  <input v-model="categoryForm.keyword" type="text" class="form-control" placeholder="supplier" />
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2" @click="closeCategoryModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ editingCategory ? 'Update Category' : 'Create Category' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- View Category Modal -->
    <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title">Category Details</h5>
              <div class="text-muted small">
                {{ viewCategory?.display_name || viewCategory?.name || '' }}
              </div>
            </div>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label text-muted">Name</label>
                <div class="fw-semibold">{{ viewCategory?.name || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Display Name</label>
                <div class="fw-semibold">{{ viewCategory?.display_name || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Code</label>
                <div class="fw-semibold">{{ viewCategory?.category_code || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Keyword</label>
                <div class="fw-semibold">{{ viewCategory?.keyword || '--' }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Parent Category</label>
                <div class="fw-semibold">
                  <span v-if="viewCategory?.parent_id" class="badge bg-info bg-opacity-20 text-info">
                    <i class="fa fa-level-up-alt me-1"></i>
                    {{ categories.find((c: any) => c.id === viewCategory?.parent_id)?.display_name || 'ID: ' + viewCategory?.parent_id }}
                  </span>
                  <span v-else class="text-muted">-- Root Category --</span>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted">Child Categories</label>
                <div class="fw-semibold">
                  <span class="badge bg-primary bg-opacity-20 text-primary">
                    {{ categories.filter((c: any) => c.parent_id === viewCategory?.id).length }} subcategories
                  </span>
                </div>
              </div>
            </div>

            <!-- Child Categories Section -->
            <div v-if="categories.filter((c: any) => c.parent_id === viewCategory?.id).length > 0" class="mt-4">
              <h6 class="mb-2"><i class="fa fa-sitemap me-2"></i>Subcategories</h6>
              <div class="d-flex flex-wrap gap-2">
                <span v-for="child in categories.filter((c: any) => c.parent_id === viewCategory?.id)" :key="child.id" class="badge bg-secondary bg-opacity-20 text-dark py-2 px-3">
                  <i class="fa fa-tag me-1"></i>{{ child.display_name || child.name }}
                </span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4 mb-2">
              <h6 class="mb-0">Entities in this category</h6>
              <button class="btn btn-outline-primary btn-sm" @click="openAssignModal">
                <i class="fa fa-plus me-1"></i>Assign Entity
              </button>
            </div>

            <StandardDataTable
              :columns="entityColumns"
              :data="categoryEntities"
              :loading="entitiesLoading"
              :show-date-filters="false"
              :disable-search="true"
            >
              <template #status="{ row }">
                <span class="badge" :class="row.pivot?.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ row.pivot?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-outline-danger btn-sm" title="Remove" @click="confirmRemoveEntity(row)">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Entity Modal -->
    <div class="modal fade" :class="{ show: showAssignModal }" :style="{ display: showAssignModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assign Entity to Category</h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="assignEntity">
              <div class="row g-3">
                <div class="col-md-12">
                  <label class="form-label">Search Entity</label>
                  <div class="input-group">
                    <input v-model="entitySearch" type="text" class="form-control" placeholder="Search by name..." />
                    <button class="btn btn-outline-secondary" type="button" @click="fetchEntities">
                      <i class="fa fa-search"></i>
                    </button>
                  </div>
                  <small class="text-muted">Use search to load entities, or enter entity ID directly.</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Entity</label>
                  <select v-model="assignForm.entity_id" class="form-select">
                    <option value="">Select entity</option>
                    <option v-for="entity in entityOptions" :key="entity.id" :value="entity.id">
                      {{ entity.label }}
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Entity ID</label>
                  <input v-model="assignForm.entity_id" type="number" class="form-control" placeholder="10" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Default Payable Account</label>
                  <select v-model="assignForm.default_payable_account_id" class="form-select">
                    <option value="">Select account</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ account.code || account.account_number || '-' }})
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Default Receivable Account</label>
                  <select v-model="assignForm.default_receivable_account_id" class="form-select">
                    <option value="">Select account</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ account.code || account.account_number || '-' }})
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Effective From</label>
                  <input v-model="assignForm.effective_from" type="date" class="form-control" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Effective To</label>
                  <input v-model="assignForm.effective_to" type="date" class="form-control" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Entity Code</label>
                  <input v-model="assignForm.code" type="text" class="form-control" placeholder="SUPP-001" />
                </div>

                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-check mt-4">
                    <input v-model="assignForm.is_active" type="checkbox" class="form-check-input" id="assignActive" />
                    <label class="form-check-label" for="assignActive">Is Active</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2" @click="closeAssignModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="assigning">
                  <span v-if="assigning" class="spinner-border spinner-border-sm me-2"></span>
                  Assign Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCategoryModal || showViewModal || showAssignModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
const accountsBaseUrl = import.meta.env.VITE_APP_ACCOUNTS_BASE_URL || apiBaseUrl

const loading = ref(false)
const saving = ref(false)
const assigning = ref(false)
const entitiesLoading = ref(false)

const categories = ref<any[]>([])
const categoryEntities = ref<any[]>([])
const accounts = ref<any[]>([])
const entityOptions = ref<any[]>([])
const tableRef = ref<{ toggleFilters: () => void } | null>(null)

const pageActions = computed(() => [
  {
    label: 'Add Category',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => openCategoryModal()
  },
  {
    label: 'Filters',
    icon: 'fa fa-filter',
    class: 'btn btn-outline-info',
    method: () => tableRef.value?.toggleFilters()
  }
])

const tableFilters = ref({
  search: '',
  keyword: '',
  parent_id: ''
})

const columns = [
  { key: 'name', label: 'NAME', sortable: true, visible: true },
  { key: 'display_name', label: 'DISPLAY NAME', sortable: true, visible: true },
  { key: 'parent_name', label: 'PARENT CATEGORY', sortable: true, visible: true },
  { key: 'category_code', label: 'CODE', sortable: true, visible: true },
  { key: 'keyword', label: 'KEYWORD', sortable: true, visible: true },
  { key: 'children_count', label: 'CHILDREN', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const entityColumns = [
  { key: 'full_name', label: 'ENTITY', sortable: true, visible: true },
  { key: 'type', label: 'TYPE', sortable: true, visible: true },
  { key: 'status', label: 'STATUS', sortable: false, visible: true },
  { key: 'pivot.effective_from', label: 'EFFECTIVE FROM', sortable: false, visible: true },
  { key: 'pivot.effective_to', label: 'EFFECTIVE TO', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const customFilters = computed(() => {
  const parentOptions = categories.value
    .filter((c: any) => !c.parent_id)
    .map((cat: any) => ({
      label: cat.display_name || cat.name,
      value: cat.id
    }))
  
  return [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'text',
      placeholder: 'Filter by keyword',
      defaultValue: ''
    },
    {
      key: 'parent_id',
      label: 'Filter by Parent',
      type: 'select',
      options: parentOptions,
      placeholder: 'All Categories',
      defaultValue: ''
    }
  ]
})

const showCategoryModal = ref(false)
const showViewModal = ref(false)
const showAssignModal = ref(false)

const editingCategory = ref<any>(null)
const viewCategory = ref<any>(null)

const categoryForm = reactive({
  name: '',
  display_name: '',
  category_code: '',
  keyword: '',
  parent_id: null as number | null
})

const selectedParentCategory = ref<any>(null)
const expandedCategories = ref<Set<number>>(new Set())

// Computed property for parent category options (excluding self and descendants)
const parentCategoryOptions = computed(() => {
  if (!editingCategory.value?.id) {
    // When creating new category, all categories can be parents
    return categories.value
  }
  // When editing, exclude self and descendants to prevent circular references
  const excludeIds = new Set<number>([editingCategory.value.id])
  const collectDescendants = (parentId: number) => {
    categories.value.forEach((cat: any) => {
      if (cat.parent_id === parentId && !excludeIds.has(cat.id)) {
        excludeIds.add(cat.id)
        collectDescendants(cat.id)
      }
    })
  }
  collectDescendants(editingCategory.value.id)
  return categories.value.filter((cat: any) => !excludeIds.has(cat.id))
})

// Build hierarchical tree structure for display
const hierarchicalCategories = computed(() => {
  const buildTree = (parentId: number | null = null, level: number = 0): any[] => {
    return categories.value
      .filter((cat: any) => cat.parent_id === parentId)
      .map((cat: any) => ({
        ...cat,
        level,
        parent_name: categories.value.find((p: any) => p.id === cat.parent_id)?.display_name || null,
        children_count: categories.value.filter((c: any) => c.parent_id === cat.id).length,
        children: buildTree(cat.id, level + 1)
      }))
  }
  return buildTree(null)
})

// Flatten tree for table display with indentation info
const flattenedCategories = computed(() => {
  let result: any[] = []
  const flatten = (items: any[], parentExpanded = true) => {
    items.forEach((item) => {
      if (parentExpanded) {
        result.push(item)
      }
      if (item.children?.length) {
        const isExpanded = expandedCategories.value.has(item.id)
        flatten(item.children, parentExpanded && isExpanded)
      }
    })
  }
  flatten(hierarchicalCategories.value)
  
  // Apply parent filter if selected
  if (tableFilters.value.parent_id) {
    const parentId = Number(tableFilters.value.parent_id)
    result = result.filter((cat: any) => 
      cat.id === parentId || cat.parent_id === parentId || isDescendantOf(cat.id, parentId)
    )
  }
  
  return result
})

// Get root categories for filter
const rootCategories = computed(() => {
  return categories.value.filter((c: any) => !c.parent_id)
})

// Build hierarchical options for parent selector in multiselect
const hierarchicalParentOptions = computed(() => {
  const buildGroups = () => {
    return parentCategoryOptions.value
      .filter((c: any) => !c.parent_id)
      .map((root: any) => ({
        label: root.display_name || root.name,
        children: [
          root,
          ...parentCategoryOptions.value.filter((c: any) => c.parent_id === root.id)
        ]
      }))
  }
  return buildGroups()
})

// Helper to check if category is descendant of another
const isDescendantOf = (categoryId: number, ancestorId: number): boolean => {
  const category = categories.value.find((c: any) => c.id === categoryId)
  if (!category || !category.parent_id) return false
  if (category.parent_id === ancestorId) return true
  return isDescendantOf(category.parent_id, ancestorId)
}

// Get full path of category
const getCategoryPath = (category: any): string => {
  const path: string[] = []
  let current = category
  while (current?.parent_id) {
    const parent = categories.value.find((c: any) => c.id === current.parent_id)
    if (parent) {
      path.unshift(parent.display_name || parent.name)
      current = parent
    } else {
      break
    }
  }
  return path.join(' > ')
}

// Custom label for multiselect
const getCategoryLabel = (cat: any) => {
  if (!cat) return ''
  return cat.display_name || cat.name || ''
}

const assignForm = reactive({
  entity_id: '' as any,
  default_payable_account_id: '' as any,
  default_receivable_account_id: '' as any,
  effective_from: '',
  effective_to: '',
  code: '',
  is_active: true
})

const entitySearch = ref('')

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (tableFilters.value.search) params.search = tableFilters.value.search
    if (tableFilters.value.keyword) params.keyword = tableFilters.value.keyword

    const response = await axios.get(`${apiBaseUrl}categories`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })

    const data = response.data?.data || response.data || []
    categories.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load categories' })
  } finally {
    loading.value = false
  }
}

const fetchCategoryDetails = async (categoryId: number) => {
  entitiesLoading.value = true
  try {
    const response = await axios.get(`${apiBaseUrl}categories/${categoryId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    const data = response.data?.data || response.data || {}
    viewCategory.value = data
    categoryEntities.value = data.entities || []
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load category details' })
  } finally {
    entitiesLoading.value = false
  }
}

const fetchAccounts = async () => {
  try {
    const response = await axios.get(`${accountsBaseUrl}${import.meta.env.VITE_APP_ACCOUNTS_COMPANY_VSET_URL}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    const data = response.data?.data || response.data || []
    accounts.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    // accounts are optional; keep silent but log
    console.error('Failed to load accounts', error)
  }
}

const fetchEntities = async () => {
  try {
    const params: any = {}
    if (entitySearch.value) params.search = entitySearch.value
    const response = await axios.get(`${apiBaseUrl}company-entities`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    const data = response.data?.data || response.data || []
    entityOptions.value = Array.isArray(data)
      ? data.map((entity: any) => ({
          id: entity.id,
          label: entity.full_name || entity.name || entity.username || `Entity ${entity.id}`
        }))
      : []
  } catch (error: any) {
    console.error('Failed to load entities', error)
  }
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
  if (!Object.prototype.hasOwnProperty.call(filters, 'search')) {
    tableFilters.value.search = ''
  }
  if (!Object.prototype.hasOwnProperty.call(filters, 'keyword')) {
    tableFilters.value.keyword = ''
  }
  if (!Object.prototype.hasOwnProperty.call(filters, 'parent_id')) {
    tableFilters.value.parent_id = ''
  }
  fetchCategories()
}

// Watch for filter changes to ensure reactivity
watch(
  () => tableFilters.value.parent_id,
  () => {
    // Trigger reactivity when parent_id filter changes
  },
  { deep: true }
)

const openCategoryModal = (category?: any) => {
  editingCategory.value = category || null
  categoryForm.name = category?.name || ''
  categoryForm.display_name = category?.display_name || ''
  categoryForm.category_code = category?.category_code || ''
  categoryForm.keyword = category?.keyword || ''
  categoryForm.parent_id = category?.parent_id || null
  
  // Set selected parent for multiselect
  if (category?.parent_id) {
    selectedParentCategory.value = categories.value.find((c: any) => c.id === category.parent_id) || null
  } else {
    selectedParentCategory.value = null
  }
  
  showCategoryModal.value = true
}

// Open modal pre-filled with parent category for quick subcategory creation
const openSubcategoryModal = (parentCategory: any) => {
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.display_name = ''
  categoryForm.category_code = ''
  categoryForm.keyword = parentCategory.keyword || ''
  categoryForm.parent_id = parentCategory.id
  selectedParentCategory.value = parentCategory
  showCategoryModal.value = true
}

const closeCategoryModal = () => {
  showCategoryModal.value = false
  editingCategory.value = null
  selectedParentCategory.value = null
}

// Multiselect handlers
const onParentSelect = (selected: any) => {
  categoryForm.parent_id = selected?.id || null
}

const onParentRemove = () => {
  categoryForm.parent_id = null
  selectedParentCategory.value = null
}

// const clearFilters = () => {
//   tableFilters.value = {
//     search: '',
//     keyword: '',
//     parent_id: ''
//   }
//   fetchCategories()
// }

// Column visibility placeholder (existing app uses a column toggler elsewhere)
const toggleColumnVisibility = () => {
  // Placeholder for column visibility / layout toggle
  // Could emit event or toggle a local state to show a column panel
  // For now, flash a small UI hint
  Swal.fire({ icon: 'info', title: 'Columns', text: 'Column visibility toggle is not implemented yet.' })
}

// Toggle category expansion
const toggleExpand = (categoryId: number) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
  // Trigger reactivity
  expandedCategories.value = new Set(expandedCategories.value)
}

// Expand all categories
const expandAll = () => {
  const allIds = categories.value
    .filter((c: any) => categories.value.some((child: any) => child.parent_id === c.id))
    .map((c: any) => c.id)
  expandedCategories.value = new Set(allIds)
}

// Collapse all categories
const collapseAll = () => {
  expandedCategories.value = new Set()
}

const saveCategory = async () => {
  saving.value = true
  try {
    const payload = {
      name: categoryForm.name,
      display_name: categoryForm.display_name,
      category_code: categoryForm.category_code,
      keyword: categoryForm.keyword,
      parent_id: categoryForm.parent_id || null
    }

    if (editingCategory.value?.id) {
      await axios.put(`${apiBaseUrl}categories/${editingCategory.value.id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Category updated successfully' })
    } else {
      await axios.post(`${apiBaseUrl}categories`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Category created successfully' })
    }

    closeCategoryModal()
    fetchCategories()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save category' })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (category: any) => {
  const result = await Swal.fire({
    title: 'Delete Category?',
    text: `This will delete ${category.display_name || category.name}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    await axios.delete(`${apiBaseUrl}categories/${category.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Category deleted successfully' })
    fetchCategories()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to delete category' })
  }
}

const openViewModal = async (category: any) => {
  viewCategory.value = category
  showViewModal.value = true
  await fetchCategoryDetails(category.id)
}

const closeViewModal = () => {
  showViewModal.value = false
  viewCategory.value = null
  categoryEntities.value = []
}

const openAssignModal = () => {
  assignForm.entity_id = ''
  assignForm.default_payable_account_id = ''
  assignForm.default_receivable_account_id = ''
  assignForm.effective_from = ''
  assignForm.effective_to = ''
  assignForm.code = ''
  assignForm.is_active = true
  showAssignModal.value = true
}

const closeAssignModal = () => {
  showAssignModal.value = false
}

const assignEntity = async () => {
  if (!viewCategory.value?.id || !assignForm.entity_id) {
    Swal.fire({ icon: 'warning', title: 'Missing data', text: 'Select an entity first.' })
    return
  }

  assigning.value = true
  try {
    const payload = {
      category_id: viewCategory.value.id,
      default_payable_account_id: assignForm.default_payable_account_id || undefined,
      default_receivable_account_id: assignForm.default_receivable_account_id || undefined,
      effective_from: assignForm.effective_from || undefined,
      effective_to: assignForm.effective_to || undefined,
      code: assignForm.code || undefined,
      is_active: assignForm.is_active
    }

    await axios.post(`${apiBaseUrl}company-entities/${assignForm.entity_id}/categories`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })

    Swal.fire({ icon: 'success', title: 'Assigned', text: 'Category assigned to entity' })
    closeAssignModal()
    fetchCategoryDetails(viewCategory.value.id)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to assign category' })
  } finally {
    assigning.value = false
  }
}

const confirmRemoveEntity = async (entity: any) => {
  if (!viewCategory.value?.id) return

  const result = await Swal.fire({
    title: 'Remove Category?',
    text: `Remove ${viewCategory.value.display_name || viewCategory.value.name} from ${entity.full_name || entity.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    await axios.delete(`${apiBaseUrl}company-entities/${entity.id}/categories/${viewCategory.value.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Category removed from entity' })
    fetchCategoryDetails(viewCategory.value.id)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove category' })
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchAccounts()
})
</script>

<style scoped>
.manage-entity-categories-page .panel {
  border-radius: 12px;
}

.manage-entity-categories-page .custom-table {
  border-radius: 12px;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>
