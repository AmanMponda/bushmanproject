<template>
  <div class="hunting-types-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Hunting Types</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
              >
                <template #id="{ row }">
                  {{ (row as any).id }}
                </template>
                <template #name="{ row }">
                  {{ (row as any).name }}
                </template>
                <template #description="{ row }">
                  {{ (row as any).description }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editItem(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create/Edit Form (Bootstrap) -->
    <template v-else>
      <div class="p-2">
        <form class="mb-3" @submit.prevent="onSubmit" novalidate>
          <h3 class="fw-bold mb-3">{{ editMode ? 'Edit Hunting Type' : 'New Hunting Type' }}</h3>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Name</label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="Enter Hunting Type Name (e.g., 1x1, 2x1)"
                required
                minlength="2"
              />
              <div class="form-text">Examples: 1x1, 2x1</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Description</label>
              <textarea
                v-model="form.description"
                class="form-control"
                rows="3"
                placeholder="Enter Description"
              ></textarea>
            </div>
          </div>

          <div class="d-flex gap-2 mt-2">
            <button type="submit" class="btn btn-primary" :disabled="saving || !isFormValid">{{ editMode ? 'Update' : 'Save' }}</button>
            <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
          </div>
        </form>
      </div>
    </template>

  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import { mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

export default defineComponent({
  name: 'ManageHuntingTypes',
  components: {
    StandardDataTable,
  },

  setup() {
    return {}
  },

  data() {
    const columns = [
      { key: 'id', label: 'ID', sortable: true, visible: true },
      { key: 'name', label: 'Name', sortable: true, visible: true },
      { key: 'description', label: 'Description', sortable: true, visible: true },
      { key: 'actions', label: 'Actions', sortable: false, visible: true },
    ]

    return {
      items: [] as any[],
      columns,
      loading: false,
      saving: false,
      deleting: false,
      showList: true,
      editMode: false,
      toast: useToast(),
      form: reactive({
        id: null as number | null,
        name: '',
        description: '',
      }),
    }
  },

  computed: {
    pageActions() {
      const actions = []
      if (this.showList) {
        actions.push({
          label: 'Add New',
          icon: 'fa fa-plus',
          class: 'btn btn-primary',
          method: () => this.showCreateForm(),
        })
      }
      return actions
    },
    isFormValid(): boolean {
      return (this.form.name || '').trim().length >= 2
    },
  },

  mounted() {
    this.loadItems()
  },

  methods: {
    ...mapActions(useSettingsStore, [
      'getHuntingsTypes',
      'createHuntingType',
      'updateHuntingType',
      'deleteHuntingType',
    ]),

    async loadItems() {
      this.loading = true
      try {
        const response = await this.getHuntingsTypes()
        if (response.status === 200) {
          this.items = response.data
        }
      } catch (error) {
        console.error('Failed to load hunting types', error)
        this.toast.init({
          message: 'Failed to load hunting types',
          color: 'danger',
        })
      } finally {
        this.loading = false
      }
    },

    showCreateForm() {
      this.editMode = false
      this.resetForm()
      this.showList = false
    },

    editItem(rowData: any) {
      this.editMode = true
      this.form.id = rowData.id
      this.form.name = rowData.name
      this.form.description = rowData.description || ''
      this.showList = false
    },

    goBack() {
      this.resetForm()
      this.showList = true
      this.loadItems()
    },

    resetForm() {
      this.form.id = null
      this.form.name = ''
      this.form.description = ''
      this.editMode = false
    },
    onSubmit() {
      if (!this.isFormValid) {
        this.toast.init({ message: 'Please enter a valid name (min 2 characters).', color: 'warning' })
        return
      }
      if (this.editMode) {
        this.updateItem()
      } else {
        this.createItem()
      }
    },

    async createItem() {
      this.saving = true
      try {
        const response = await this.createHuntingType({
          name: (this.form.name || '').trim(),
          description: (this.form.description || '').trim(),
        })
        if (response.status === 201 || response.status === 200) {
          this.toast.init({
            message: 'Hunting Type created successfully',
            color: 'success',
          })
          this.goBack()
        }
      } catch (error) {
        const errors = handleErrors(error)
        this.toast.init({
          message: errors.length > 0 ? errors.join(', ') : 'Failed to create hunting type',
          color: 'danger',
        })
      } finally {
        this.saving = false
      }
    },

    async updateItem() {
      if (!this.form.id) return
      this.saving = true
      try {
        const response = await this.updateHuntingType(this.form.id, {
          name: (this.form.name || '').trim(),
          description: (this.form.description || '').trim(),
        })
        if (response.status === 200) {
          this.toast.init({
            message: 'Hunting Type updated successfully',
            color: 'success',
          })
          this.goBack()
        }
      } catch (error) {
        const errors = handleErrors(error)
        this.toast.init({
          message: errors.length > 0 ? errors.join(', ') : 'Failed to update hunting type',
          color: 'danger',
        })
      } finally {
        this.saving = false
      }
    },

    async confirmDelete(rowData: any) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete "${rowData.name}"? This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-danger',
          cancelButton: 'btn btn-secondary',
        },
        buttonsStyling: false,
      })

      if (!result.isConfirmed) return

      this.deleting = true
      try {
        const response = await this.deleteHuntingType(rowData.id, true)
        if (response.status === 204 || response.status === 200) {
          this.toast.init({
            message: 'Hunting Type deleted successfully',
            color: 'success',
          })
          this.loadItems()
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || error?.response?.data?.message
        this.toast.init({
          message: errorMessage || 'Failed to delete hunting type',
          color: 'danger',
        })
      } finally {
        this.deleting = false
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.hunting-types-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;

  .breadcrumb-item {
    text-transform: uppercase !important;

    &::before {
      content: ' / ' !important;
      color: #9ca3af !important;
      padding: 0 0.5rem;
    }

    &:first-child::before {
      display: none !important;
    }

    a {
      text-transform: uppercase !important;
      color: #374151 !important;
      font-weight: 600;
      text-decoration: none !important;

      &:hover {
        color: #1f2937 !important;
        text-decoration: none !important;
      }
    }

    &.active {
      color: #9ca3af !important;
      font-weight: 400;
      text-transform: uppercase !important;
    }
  }
}
</style>
