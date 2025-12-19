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

    <!-- Create/Edit Form -->
    <template v-else>
      <div class="p-2">
        <VaForm ref="formRef" class="mb-6">
          <h3 class="font-bold text-lg mb-4">{{ editMode ? 'Edit Hunting Type' : 'New Hunting Type' }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <VaInput
              v-model="form.name"
              label="Name"
              placeholder="Enter Hunting Type Name (e.g., 1x1, 2x1)"
              :rules="[(v: any) => !!v || 'Name is required']"
              required
            />

            <VaInput v-model="form.description" type="textarea" label="Description" placeholder="Enter Description" />
          </div>
        </VaForm>

        <div class="mb-6 flex gap-2">
          <VaButton
            :disabled="!isValidForm"
            color="primary"
            :icon="editMode ? 'save' : 'add'"
            :loading="saving"
            @click="validateForm() && (editMode ? updateItem() : createItem())"
          >
            {{ editMode ? 'Update' : 'Save' }}
          </VaButton>
          <VaButton preset="secondary" @click="goBack()"> Cancel </VaButton>
        </div>
      </div>
    </template>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import { mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

export default defineComponent({
  name: 'ManageHuntingTypes',
  components: {
    StandardDataTable,
  },

  setup() {
    const formRef = ref(null) as any
    const { isValid: isValidForm, validate: validateForm, resetValidation: resetValidationForm } = useForm()

    return {
      isValidForm,
      validateForm,
      resetValidationForm,
      formRef,
    }
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
      this.resetValidationForm()
    },

    async createItem() {
      this.saving = true
      try {
        const response = await this.createHuntingType({
          name: this.form.name,
          description: this.form.description,
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
          name: this.form.name,
          description: this.form.description,
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
