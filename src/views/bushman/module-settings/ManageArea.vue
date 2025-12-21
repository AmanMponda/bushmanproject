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
                    <button class="btn btn-primary btn-sm" title="View" @click="viewAreaSpecies(row)">
                      <i class="fa fa-eye"></i>
                    </button>
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

    <!-- Area Species View -->
    <template v-else-if="showAreaSpecies && selectedArea">
      <div class="p-2">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="fw-bold mb-1">{{ selectedArea.name }}</h3>
            <div class="text-muted">Manage species for this hunting area</div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-secondary" @click="goBackToList">Back</button>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Add Species to Area</h6>
            <form class="row g-3" @submit.prevent="addSpeciesToArea">
              <div class="col-md-6">
                <label class="form-label">Species</label>
                <select v-model="speciesForm.specie" class="form-select" required>
                  <option :value="null" disabled>Select species</option>
                  <option v-for="s in speciesOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
                </select>
              </div>
              <div class="col-md-12">
                <button type="submit" class="btn btn-primary" :disabled="savingSpecies || !speciesForm.specie">
                  <span v-if="savingSpecies" class="spinner-border spinner-border-sm me-1"></span>
                  Add Species
                </button>
              </div>
            </form>

            <hr class="my-4" />

            <div class="mb-3">
              <div class="d-flex align-items-center mb-2">
                <h6 class="fw-bold mb-0">Bulk Import from CSV</h6>
                <a href="/assets/uploadsguide/other-uploads.csv" download class="btn btn-sm btn-outline-success ms-auto">
                  <i class="fa fa-download me-1"></i>
                  Download Template
                </a>
              </div>
              <CSVInput
                :column-fields="[{ key: 'name', label: 'Species Name' }]"
                duplicate-key-field="name"
                :model-value="existingCsvModel"
                :allowed-values="allowedSpeciesNames"
                @import="handleAreaCsvImport"
              />
              <div v-if="csvImporting" class="text-muted small mt-2">
                <span class="spinner-border spinner-border-sm me-1"></span>Importing species from CSV...
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0">Species in this area ({{ areaSpecies.length }})</h6>
            </div>
            <div v-if="loadingSpecies" class="text-center py-3">
              <span class="spinner-border spinner-border-sm me-2"></span>Loading species...
            </div>
            <div v-else-if="areaSpecies.length > 0" class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Species</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(specie, idx) in areaSpecies" :key="specie.id || idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ specie.specie_name || specie.name || 'Unknown' }}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" :disabled="deleting" @click="deleteAreaSpecies(specie)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted text-center py-3">
              <i class="fa fa-info-circle me-2"></i>No species added to this area yet.
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
import CSVInput from '../reusables/CSVInput.vue'
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
    CSVInput,
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
      speciesForm: reactive({ specie: null as any }),
      areaSpecies: [] as any,
      selectedArea: null as any,
      csvUploaded: false,
      csvImporting: false,
      showCreatenewForm: false,
      quotasOptions,
      showHuntingAreaList: true,
      showAreaSpecies: false,
      quotaItems: [] as any,
      saving: false,
      loading: false,
      loadingSpecies: false,
      savingSpecies: false,
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

    allowedSpeciesNames(): string[] {
      return this.speciesOptions.map((opt: any) => String(opt.text))
    },

    existingCsvModel(): Array<{ name: string }> {
      return this.areaSpecies.map((item: any) => ({ name: item.specie_name || item.name || '' }))
    },
  },

  mounted() {
    // this.getQs()
    // this.getSpeciesItems()
    this.getAreas()
    this.getSpeciesItems()
  },

  methods: {
    ...mapActions(useQuotaStore, ['getAreaList', 'getSpeciesList']),
    ...mapActions(useHuntingAreaStore, [
      'createHuntingArea',
      'updateHuntingArea',
      'deleteHuntingArea',
      'listHuntingAreaSpecies',
      'addHuntingAreaSpecies',
      'deleteHuntingAreaSpecies',
    ]),

    toggleFormAndList() {
      this.showHuntingAreaList = !this.showHuntingAreaList
      this.showAreaSpecies = false
      if (this.showHuntingAreaList) {
        this.resetForm()
        this.getAreas()
      }
    },

    goBackToList() {
      this.showAreaSpecies = false
      this.showHuntingAreaList = true
      this.selectedArea = null
      this.areaSpecies = []
      this.speciesForm.specie = null
      this.csvUploaded = false
      this.getAreas()
    },

    showCreateForm() {
      this.editMode = false
      this.resetForm()
      this.showHuntingAreaList = false
    },

    showHuntingArea() {
      this.showHuntingAreaList = !this.showHuntingAreaList
    },

    viewAreaSpecies(rowData: any) {
      this.selectedArea = rowData
      this.showHuntingAreaList = false
      this.showAreaSpecies = true
      this.speciesForm.specie = null
      this.csvUploaded = false
      this.loadAreaSpecies(rowData.id)
    },

    editHuntingArea(rowData: any) {
      this.editMode = true
      this.areaForm.id = rowData.id
      this.areaForm.name = rowData.name
      this.areaForm.description = rowData.description
      this.areaForm.lat = rowData.lat
      this.areaForm.lng = rowData.lng
      this.showHuntingAreaList = false
      this.showAreaSpecies = false
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
      this.showAreaSpecies = false
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

    async loadAreaSpecies(areaId: any) {
      this.loadingSpecies = true
      try {
        const resp = await this.listHuntingAreaSpecies(areaId)
        const list = Array.isArray(resp.data?.data) ? resp.data.data : Array.isArray(resp.data) ? resp.data : []
        this.areaSpecies = list.map((item: any) => ({
          id: item.id,
          specie_id: item.specie_id ?? item.specie?.id,
          specie_name: item.specie_name ?? item.specie?.name ?? item.name,
        }))
      } catch (error) {
        this.toast.init({ message: 'Failed to load species for this area', color: 'danger' })
      } finally {
        this.loadingSpecies = false
      }
    },

    async handleAreaCsvImport(rows: Array<{ name: string }>) {
      if (!this.selectedArea) {
        this.toast.init({ message: 'Select an area first', color: 'warning' })
        return
      }

      const nameToOpt = new Map(this.speciesOptions.map((opt: any) => [String(opt.text).toLowerCase(), opt]))
      const existingIds = new Set(this.areaSpecies.map((s: any) => String(s.specie_id)))
      const toAdd: string[] = []

      for (const row of rows) {
        const key = String(row.name || '').toLowerCase()
        if (!key) continue
        const opt = nameToOpt.get(key)
        if (!opt) continue
        const idStr = String(opt.value)
        if (existingIds.has(idStr)) continue
        if (toAdd.includes(idStr)) continue
        toAdd.push(idStr)
      }

      if (toAdd.length === 0) {
        this.toast.init({ message: 'No new species to import', color: 'info' })
        return
      }

      this.csvImporting = true
      try {
        for (const specieId of toAdd) {
          await this.addHuntingAreaSpecies({ hunting_area_id: this.selectedArea.id, specie_id: specieId })
        }
        this.csvUploaded = true
        this.toast.init({ message: `Imported ${toAdd.length} species`, color: 'success' })
        this.loadAreaSpecies(this.selectedArea.id)
      } catch (error: any) {
        const errors = handleErrors(error)
        this.toast.init({ message: errors.join('\n') || 'Failed to import species', color: 'danger' })
      } finally {
        this.csvImporting = false
      }
    },

    async addSpeciesToArea() {
      if (!this.selectedArea || !this.speciesForm.specie) return
      this.savingSpecies = true
      try {
        await this.addHuntingAreaSpecies({
          hunting_area_id: this.selectedArea.id,
          specie_id: this.speciesForm.specie,
        })
        this.toast.init({ message: 'Species added to hunting area', color: 'success' })
        this.speciesForm.specie = null
        this.loadAreaSpecies(this.selectedArea.id)
      } catch (error: any) {
        const errors = handleErrors(error)
        this.toast.init({ message: errors.join('\n') || 'Failed to add species', color: 'danger' })
      } finally {
        this.savingSpecies = false
      }
    },

    async deleteAreaSpecies(record: any) {
      if (!record?.id || !this.selectedArea) return
      this.deleting = true
      try {
        await this.deleteHuntingAreaSpecies(record.id, this.selectedArea.id, record.specie_id)
        this.toast.init({ message: 'Species removed from hunting area', color: 'success' })
        this.loadAreaSpecies(this.selectedArea.id)
      } catch (error: any) {
        const errors = handleErrors(error)
        this.toast.init({ message: errors.join('\n') || 'Failed to remove species', color: 'danger' })
      } finally {
        this.deleting = false
      }
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

    async getSpeciesItems() {
      try {
        const response = await this.getSpeciesList()
        const list = Array.isArray(response.data) ? response.data : response.data?.data || []
        this.speciesOptions = list.map((item: any) => ({ value: item.id, text: item.name }))
      } catch (error) {
        // ignore load failure here; toast not critical
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
