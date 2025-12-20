<template>
  <div class="area-settings-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Hunting Areas</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showHuntingAreaList">
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
                <template #name="{ row }">
                  {{ (row as any).name }}
                </template>
                <template #description="{ row }">
                  {{ (row as any).description }}
                </template>
                <template #lat="{ row }">
                  {{ (row as any).lat }}
                </template>
                <template #lng="{ row }">
                  {{ (row as any).lng }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editHuntingArea(row)">
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
        <form class="mb-3" @submit.prevent="onAreaSubmit" novalidate>
          <h3 class="fw-bold mb-3">{{ editMode ? 'Edit Hunting Area' : 'New Hunting Area' }}</h3>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Name</label>
              <input
                v-model="areaForm.name"
                type="text"
                class="form-control"
                placeholder="Enter Hunting Area Name"
                required
                minlength="2"
              />
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Description</label>
              <textarea
                v-model="areaForm.description"
                class="form-control"
                rows="3"
                placeholder="Enter Hunting Area Description"
                required
              ></textarea>
            </div>
          </div>

          <h5 class="fw-bold mb-2">Area Location</h5>
          <div class="row">
            <div class="col-md-3 mb-3">
              <label class="form-label">Latitude</label>
              <input
                v-model="areaForm.lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                class="form-control"
                placeholder="e.g. -6.123456"
                required
              />
              <div class="form-text">Range: -90 to 90</div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Longitude</label>
              <input
                v-model="areaForm.lng"
                type="number"
                step="any"
                min="-180"
                max="180"
                class="form-control"
                placeholder="e.g. 34.123456"
                required
              />
              <div class="form-text">Range: -180 to 180</div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-2">
            <button type="submit" class="btn btn-primary" :disabled="saving || !isAreaFormValid">{{ editMode ? 'Update' : 'Save' }}</button>
            <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
          </div>
        </form>
      </div>
    </template>

  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { mapActions } from 'pinia'
import { reactive } from 'vue'
import { useToast } from '@/composables/useToast'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import { useHuntingAreaStore } from '../../../stores/bushman/hunting-story.ts'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

const defaultItem = {
  name: '',
  start_date: null,
  end_date: null,
  // description: '',
}

export default defineComponent({
  name: 'ManageArea',
  components: {
    StandardDataTable,
  },

  setup() {
    return {}
  },
  data() {
    const items: [] = []

    const areaForm = reactive({
      id: null as any,
      name: null as any,
      description: '',
      lat: null,
      lng: null,
      location: null as any,
    })

    const columns = [
      { key: 'name', label: 'Name', sortable: true, visible: true },
      { key: 'description', label: 'Description', sortable: true, visible: true },
      { key: 'lat', label: 'Latitude', sortable: false, visible: true },
      { key: 'lng', label: 'Longitude', sortable: false, visible: true },
      { key: 'actions', label: 'Actions', sortable: false, visible: true },
    ]

    const quotasOptions = [] as any

    return {
      items,
      columns,
      editedItemId: null,
      editedItem: null,
      createdItem: { ...defaultItem },
      toast: useToast(),
      areaForm,
      speciesOptions: [] as any,
      areasOptions: [] as any,
      speciesObjects: [] as any,
      showCreatenewForm: false,
      quotasOptions,
      showHuntingAreaList: true,
      quotaItems: [] as any,
      saving: false,
      loading: false,
      editMode: false,
      deleting: false,
    }
  },

  computed: {
    pageActions() {
      const actions = []
      if (this.showHuntingAreaList) {
        actions.push({
          label: 'Add New',
          icon: 'fa fa-plus',
          class: 'btn btn-primary',
          method: () => this.showCreateForm(),
        })
      }
      return actions
    },
    isAreaFormValid(): boolean {
      const nameOk = (this.areaForm.name || '').trim().length >= 2
      const latNum = parseFloat(this.areaForm.lat as any)
      const lngNum = parseFloat(this.areaForm.lng as any)
      const latOk = !isNaN(latNum) && latNum >= -90 && latNum <= 90
      const lngOk = !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180
      return nameOk && latOk && lngOk
    },
  },

  mounted() {
    // this.getQs()
    // this.getSpeciesItems()
    this.getAreas()
  },

  methods: {
    ...mapActions(useQuotaStore, ['getAreaList']),
    ...mapActions(useHuntingAreaStore, ['createHuntingArea', 'updateHuntingArea', 'deleteHuntingArea']),

    toggleFormAndList() {
      this.showHuntingAreaList = !this.showHuntingAreaList
      if (this.showHuntingAreaList) {
        this.resetForm()
        this.getAreas()
      }
    },

    showCreateForm() {
      this.editMode = false
      this.resetForm()
      this.showHuntingAreaList = false
    },

    showHuntingArea() {
      this.showHuntingAreaList = !this.showHuntingAreaList
    },

    editHuntingArea(rowData: any) {
      this.editMode = true
      this.areaForm.id = rowData.id
      this.areaForm.name = rowData.name
      this.areaForm.description = rowData.description
      this.areaForm.lat = rowData.lat
      this.areaForm.lng = rowData.lng
      this.showHuntingAreaList = false
    },

    cancelEdit() {
      this.resetForm()
      this.toggleFormAndList()
    },

    resetForm() {
      this.editMode = false
      this.areaForm.id = null
      this.areaForm.name = null
      this.areaForm.description = ''
      this.areaForm.lat = null
      this.areaForm.lng = null
    },
    onAreaSubmit() {
      if (!this.isAreaFormValid) {
        this.toast.init({ message: 'Please fill out a valid name and coordinates.', color: 'warning' })
        return
      }
      if (this.editMode) {
        this.updateExistingHuntingArea()
      } else {
        this.createNewHuntingArea()
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
        // Force delete - will delete even if referenced by other tables
        const response = await this.deleteHuntingArea(rowData.id, true)
        if (response.status === 204 || response.status === 200) {
          this.toast.init({
            message: 'Hunting Area deleted successfully',
            color: 'success',
          })
          this.getAreas()
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || error?.response?.data?.message
        this.toast.init({
          message: errorMessage || 'Failed to delete hunting area',
          color: 'danger',
        })
      } finally {
        this.deleting = false
      }
    },

    async updateExistingHuntingArea() {
      this.saving = true
      const coordinates = [
        {
          lat: parseFloat(this.areaForm.lat),
          lng: parseFloat(this.areaForm.lng),
        },
      ]
      const requestData = {
        name: (this.areaForm.name || '').trim(),
        description: (this.areaForm.description || '').trim(),
        coordinates: coordinates,
      }
      try {
        const response = await this.updateHuntingArea(this.areaForm.id, requestData)
        if (response.status === 200) {
          this.saving = false
          this.toast.init({
            message: 'Hunting Area updated successfully',
            color: 'success',
          })
          this.resetForm()
          this.toggleFormAndList()
        }
      } catch (error) {
        this.saving = false
        const errors = handleErrors(error)
        this.toast.init({
          message: '\n' + errors.map((error: string, index: number) => `${index + 1}. ${error}`).join('\n'),
          color: 'danger',
        })
      }
    },

    async createNewHuntingArea() {
      this.saving = true
      const coordinates = [
        {
          lat: parseFloat(this.areaForm.lat),
          lng: parseFloat(this.areaForm.lng),
        },
      ]
      const requestData = {
        name: (this.areaForm.name || '').trim(),
        description: (this.areaForm.description || '').trim(),
        coordinates: coordinates,
      }
      try {
        const response = await this.createHuntingArea(requestData)
        if (response.status === 201) {
          this.saving = false
          this.toast.init({
            message: 'Hunting Area created successfully',
            color: 'success',
          })
          this.resetForm()
          this.toggleFormAndList()
          this.getAreas()
        } else {
          // console.log(requestData);
          console.log(response)
        }
      } catch (error) {
        this.saving = false
        const errors = handleErrors(error)
        this.toast.init({
          message: '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'),
          color: 'danger',
        })
      }
    },

    formatDate(date: Date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-indexed
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    async getAreas() {
      try {
        this.loading = true
        const response = await this.getAreaList()
        this.areasOptions = response.data.map((item: { id: any; name: any }) => {
          return {
            value: item.id,
            text: item.name,
          }
        })

        interface Item {
          id: string
          name: string
          description: string
          location?: {
            geo_coordinates?: {
              coordinates?: string
            }
          }
        }

        if (response.status === 200) {
          this.items = response.data.map((item: Item) => {
            const coords = JSON.parse(item?.location?.geo_coordinates?.coordinates || '[]')
            return {
              id: item?.id,
              name: item?.name,
              description: item?.description,
              lat: coords[0]?.lat,
              lng: coords[0]?.lng,
            }
          })

          this.loading = false
        } else {
          this.loading = false
          this.toast.init({
            message: 'No hunting areas found',
            color: 'info',
          })
        }
      } catch (error: any) {
        this.loading = false
        this.toast.init({
          message: 'Failed to load hunting areas',
          color: 'danger',
        })
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.area-settings-page {
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

.modal-content {
  padding: 16px;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  margin-bottom: 8px;
  font-weight: bold;
}

.input-container {
  display: flex;
  align-items: center;
}

.input-container > VaDateInput {
  margin-right: 8px;
}

.input-container > VaInput {
  flex: 1;
}
</style>
