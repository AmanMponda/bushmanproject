<template>
  <div class="sales-package-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item"><a href="#">Price Stuctures</a></li>
          <li class="breadcrumb-item active">Sales Packages</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="!showCreateNewPackageForm">
      <!-- Package List View -->
      <template v-if="showPackageList">
        <div class="row layout-top-spacing bg-white rounded">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
            <div class="panel br-6 p-0">
              <div class="custom-table p-3">
                <StandardDataTable
                  :columns="columns"
                  :data="packages"
                  :loading="loading"
                  :disable-search="false"
                  :disable-pagination="false"
                  :action-buttons="pageActions"
                  :show-date-filters="false"
                >
                  <template #id="{ row }">
                    {{ (row as any).id }}
                  </template>
                  <template #name="{ row }">
                    {{ (row as any).name }}
                  </template>
                  <template #area_name="{ row }">
                    {{ (row as any).area_name }}
                  </template>
                  <template #regulatory_package_name="{ row }">
                    {{ (row as any).regulatory_package_name }}
                  </template>
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      <button class="btn btn-info btn-sm" title="View" @click="showDetails(row)">
                        <i class="fa fa-eye"></i>
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

      <!-- Detail View -->
      <template v-else-if="showDetailsPage && selectItem">
        <SalesPackageDetails
          :item="selectItem"
          @goBack="goBack"
          @edit="handleEditFromDetails"
          @delete="handleDeleteFromDetails"
        ></SalesPackageDetails>
      </template>

      <!-- Edit Form -->
      <template v-else-if="showEditPackageForm">
        <SalesPackageForm
          :edit-mode="true"
          :edit-item="selectItem"
          @saved="onEditSaved"
          @go-back="goBack"
        ></SalesPackageForm>
      </template>
    </template>

    <!-- Create Form -->
    <template v-if="showCreateNewPackageForm">
      <SalesPackageForm @saved="onPackageSaved" @go-back="goBack"> </SalesPackageForm>
    </template>
  </div>


</template>

<script lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import handleErrors from '../../../stores/bushman/errorHandler'
import { validators } from '../../../stores/bushman/utils.ts'
import { useForm } from '@/composables/useForm'
import { useToast } from '@/composables/useToast'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import { usePriceListStore } from '../../../stores/bushman/price-list-store'
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store'
import SalesPackageDetails from './moduleforms/SalesPackageDetails.vue'
import SalesPackageForm from './SalesPackageForm.vue'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

interface SelectOption {
  value: any
  text: string
}

interface SpeciesObject {
  id: any
  name: string
  quantity: number
  species_id?: any
}

export default {
  components: {
    SalesPackageDetails: SalesPackageDetails as any,
    SalesPackageForm: SalesPackageForm as any,
    StandardDataTable: StandardDataTable as any,
  },
  setup() {
    // State
    const formRef = ref()
    const showEditForm = ref(false)
    const showPackageList = ref(true)
    const showCreateNewPackageForm = ref(false)
    const showEditPackageForm = ref(false)
    const showDetailsPage = ref(false)
    const selectItem = ref(null)
    const showDeleteModal = ref(false)
    const itemToDelete = ref(null)
    const deleting = ref(false)
    const loading = ref(false)
    const saving = ref(false)
    const packages = ref<any[]>([])
    const regulatoryPackagesOptions = ref<SelectOption[]>([])
    const loadingLicenceOptions = ref(false)
    const loadingSpeciesOptions = ref(false)
    const speciesItemOptions = ref<SelectOption[]>([])
    const areasOptions = ref<SelectOption[]>([])
    const columns = [
      { key: 'id', label: 'ID', sortable: true, visible: true },
      { key: 'name', label: 'Name', sortable: true, visible: true },
      { key: 'area_name', label: 'Area', sortable: true, visible: true },
      { key: 'regulatory_package_name', label: 'Licence', sortable: true, visible: true },
      { key: 'actions', label: 'Actions', sortable: false, visible: true },
    ]
    const originalQuantities = reactive<Record<string, any>>({})
    const isChanged = ref(false)
    const quntityChangedsaved = ref(false)
    const preferred_species = ref<any[]>([])
    const speciesOptions = ref<SelectOption[]>([])
    const speciesObjects = ref<SpeciesObject[]>([])
    const huntingTypesOptions = ref<SelectOption[]>([])
    const salesQuotasOptions = ref<SelectOption[]>([])
    const currencyOptions = ref<SelectOption[]>([])

    // Pinia stores
    const quotaStore = useQuotaStore()
    const settingsStore = useSettingsStore()
    const priceListStore = usePriceListStore()
    const regulatoryPackageStore = useRegulatoryPackageStore()

    // Toast and form
    const { init } = useToast()
    const {
      isValid: isValidForm,
      validate: validateForm,
      resetValidation: resetValidationForm,
      reset: resetForm,
    } = useForm()

    // Form state
    const form = reactive<{
      package_name: string
      description: string
      species: SelectOption | null
      quantity: number
      area: SelectOption | null
      licence: SelectOption | null
    }>({
      package_name: '',
      description: '',
      species: null,
      quantity: 1,
      area: null,
      licence: null,
    })

    // Computed
    const licenceAreaSpecies = computed(() => settingsStore.licenceAreaSpecies)
    const laodinglicenceAreaSpecies = computed(() => settingsStore.laodinglicenceAreaSpecies)
    const itemChanged = (id: any) => {
      const originalValue = originalQuantities[id]
      const currentValue = licenceAreaSpecies.value.find((item: any) => item.id === id)?.quantity
      return (originalValue && originalValue !== currentValue) || isChanged.value
    }
    const pageActions = computed(() => {
      const actions = []
      if (
        showPackageList.value &&
        !showCreateNewPackageForm.value &&
        !showEditPackageForm.value &&
        !showDetailsPage.value
      ) {
        actions.push({
          label: 'Add Package',
          icon: 'fa fa-plus',
          class: 'btn btn-primary',
          method: () => showCreateNewPackaeListFormMethod(),
        })
      }
      return actions
    })

    // Methods
    function showCreateNewPackaeListFormMethod() {
      showCreateNewPackageForm.value = true
      showPackageList.value = false
    }
    function goBack() {
      showCreateNewPackageForm.value = false
      showPackageList.value = true
      showDetailsPage.value = false
      showEditPackageForm.value = false
      selectItem.value = null
      getSalesPackages()
    }
    function onPackageSaved() {
      showCreateNewPackageForm.value = false
      showPackageList.value = true
      getSalesPackages()
    }
    function editPackage(rowData: any) {
      selectItem.value = rowData.selfItem || rowData
      showEditPackageForm.value = true
      showPackageList.value = false
    }
    function handleEditFromDetails() {
      showEditPackageForm.value = true
      showDetailsPage.value = false
    }
    async function handleDeleteFromDetails() {
      if (!selectItem.value) return
      itemToDelete.value = selectItem.value
      const packageName = itemToDelete.value?.name || 'this item'
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete "${packageName}"? This action cannot be undone!`,
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
      
      if (result.isConfirmed) {
        showDetailsPage.value = false
        await deletePackage()
      } else {
        itemToDelete.value = null
      }
    }
    function onEditSaved() {
      showEditPackageForm.value = false
      showPackageList.value = true
      selectItem.value = null
      getSalesPackages()
    }
    async function confirmDelete(rowData: any) {
      itemToDelete.value = rowData.selfItem || rowData
      const packageName = itemToDelete.value?.name || 'this item'
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete "${packageName}"? This action cannot be undone!`,
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
      
      if (result.isConfirmed) {
        await deletePackage()
      } else {
        itemToDelete.value = null
      }
    }
    async function deletePackage() {
      if (!itemToDelete.value) return
      deleting.value = true
      try {
        const response = await priceListStore.deleteSalesPackage(itemToDelete.value.id, true)
        if (response.status === 200 || response.status === 204) {
          init({
            message: 'Package deleted successfully.',
            color: 'success',
          })
          showDeleteModal.value = false
          itemToDelete.value = null
          showDetailsPage.value = false
          showEditPackageForm.value = false
          selectItem.value = null
          showPackageList.value = true
          await getSalesPackages()
        } else {
          init({
            message: 'Failed to delete package.',
            color: 'danger',
          })
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        init({
          message: errors.join(', ') || 'Failed to delete package.',
          color: 'danger',
        })
      } finally {
        deleting.value = false
      }
    }
    async function submit() {
      saving.value = true
      const speciesWithQuantity = licenceAreaSpecies.value.filter((species: any) => species.quantity > 0)
      if (speciesWithQuantity.length === 0) {
        init({
          message: 'Please add at least one species with quantity greater than 0.',
          color: 'warning',
        })
        saving.value = false
        return
      }
      if (!form.area || !form.licence) {
        init({
          message: 'Please select both area and licence.',
          color: 'warning',
        })
        saving.value = false
        return
      }
      const requestdata = {
        name: form.package_name,
        description: form.description,
        areaId: form.area.value,
        licenceId: form.licence.value,
        speciesObjectList: speciesWithQuantity,
      }
      try {
        const response = await priceListStore.createSalesPackage(requestdata)
        if (response.status === 201) {
          saving.value = false
          init({ message: response.data.message, color: 'success' })
          settingsStore.licenceAreaSpecies = []
        }
      } catch (error: any) {
        saving.value = false
        const errors = handleErrors(error.response)
        init({
          message: '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'),
          color: 'danger',
        })
      }
    }
    async function getSpeciesItems() {
      loadingSpeciesOptions.value = true
      try {
        const response = await quotaStore.getSpeciesList()
        if (response.status === 200) {
          loadingSpeciesOptions.value = false
          speciesItemOptions.value = response.data.map((item: { id: any; name: any }) => ({
            value: item.id,
            text: item.name,
          }))
        }
      } catch (error) {
        console.log(error)
      }
    }
    function showDetails(data: any) {
      showDetailsPage.value = true
      selectItem.value = data.selfItem || data
      showPackageList.value = false
    }
    async function getSalesPackages() {
      loading.value = true
      try {
        const response = await priceListStore.getSalesPackageList(false)
        if (response && response.status === 200) {
          let dataArray = []
          if (Array.isArray(response.data)) {
            dataArray = response.data
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data
          } else if (response.data?.data && !Array.isArray(response.data.data)) {
            dataArray = [response.data.data]
          }
          packages.value = dataArray.map((item: any) => ({
            id: item.id,
            name: item.name || 'N/A',
            area_name: item?.area?.name ?? 'N/A',
            regulatory_package_name: item?.regulatory_package?.name ?? 'N/A',
            selfItem: item,
          }))
          loading.value = false
        } else {
          packages.value = []
          loading.value = false
        }
      } catch (error) {
        loading.value = false
        packages.value = []
      }
    }
    async function getLicencePackages() {
      loadingLicenceOptions.value = true
      try {
        const response = await regulatoryPackageStore.getRegulatoryPackages()
        if (response.status === 200) {
          loadingLicenceOptions.value = false
          const data = response.data
          regulatoryPackagesOptions.value = data.map((item: any) => ({
            value: item.id,
            text: item.name,
          }))
        }
      } catch (error) {
        loadingLicenceOptions.value = false
      }
    }
    async function getAreas() {
      try {
        const response = await quotaStore.getAreaList()
        areasOptions.value = response.data.map((item: { id: any; name: any }) => ({
          value: item.id,
          text: item.name,
        }))
      } catch (error) {
        //
      }
    }
    async function getLicenceAreaSpeciesList() {
      if (!form.area || !form.licence) {
        return
      }
      const payload = {
        areaId: form.area.value,
        licenceId: form.licence.value,
      }
      try {
        const response = await settingsStore.getHuntingLicenseAreaSpecies(payload)
        if (response.status === 200) {
          const data = response.data
          speciesOptions.value = data.map((item: any) => ({
            value: item.id,
            text: item.name,
          }))
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        init({
          message: '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'),
          color: 'danger',
        })
      }
    }
    function onChange(id: any, newValue: any) {
      if (!(id in originalQuantities)) {
        const item = licenceAreaSpecies.value.find((item: any) => item.id === id)
        originalQuantities[id] = item.quantity
      }
      const updatedItem = licenceAreaSpecies.value.find((item: any) => item.id === id)
      if (updatedItem) {
        updatedItem.quantity = newValue
        settingsStore.licenceAreaSpecies = [...licenceAreaSpecies.value]
      }
      init({
        message: `Quantity for ${updatedItem.name} has been updated to ${newValue} quantity(s).`,
        color: 'success',
        position: 'bottom-right',
      })
    }
    function addNewSpeciesItemToStorage() {
      if (!form.species || !form.quantity) {
        init({
          message: 'Please fill all required fields.',
          color: 'warning',
        })
        return
      }
      if (Number(form.quantity) <= 0) {
        init({
          message: 'Quantity must be greater than zero.',
          color: 'warning',
        })
        return
      }
      const speciesId = form.species.value
      const speciesName = form.species.text
      const exists = speciesObjects.value.some(
        (species: { species_id: any }) => species.species_id === speciesId,
      )
      if (!exists) {
        speciesObjects.value.push({
          id: speciesId,
          name: speciesName,
          quantity: form.quantity,
          species_id: speciesId,
        })
      }
    }
    function deleteFromStorage(index: number) {
      speciesObjects.value.splice(index, 1)
    }

    // Lifecycle
    onMounted(() => {
      loading.value = true
      getSpeciesItems()
      getSalesPackages()
      getLicencePackages()
      getAreas()
    })

    return {
      // State
      formRef,
      form,
      showEditForm,
      showPackageList,
      showCreateNewPackageForm,
      showEditPackageForm,
      showDetailsPage,
      selectItem,
      showDeleteModal,
      itemToDelete,
      deleting,
      loading,
      saving,
      packages,
      regulatoryPackagesOptions,
      loadingLicenceOptions,
      loadingSpeciesOptions,
      speciesItemOptions,
      areasOptions,
      columns,
      originalQuantities,
      isChanged,
      quntityChangedsaved,
      preferred_species,
      speciesOptions,
      speciesObjects,
      huntingTypesOptions,
      salesQuotasOptions,
      currencyOptions,
      // Computed
      licenceAreaSpecies,
      laodinglicenceAreaSpecies,
      itemChanged,
      pageActions,
      // Methods
      showCreateNewPackaeListFormMethod,
      goBack,
      onPackageSaved,
      editPackage,
      handleEditFromDetails,
      handleDeleteFromDetails,
      onEditSaved,
      confirmDelete,
      deletePackage,
      submit,
      getSpeciesItems,
      showDetails,
      getSalesPackages,
      getLicencePackages,
      getAreas,
      getLicenceAreaSpeciesList,
      onChange,
      addNewSpeciesItemToStorage,
      deleteFromStorage,
      validators,
      isValidForm,
      validateForm,
      resetValidationForm,
      resetForm,
      init,
    }
  },
}
</script>

<style lang="scss" scoped>
.sales-package-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

// Local layout spacing classes to ensure consistent spacing in production
.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  margin: 0;
  padding: 0;
  border: none !important;
  box-shadow: none !important;
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
