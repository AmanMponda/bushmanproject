
<template>
  <div class="species-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
        <li class="breadcrumb-item active">Species</li>
      </ul>
      </div>
    </div>

    <template v-if="showSpeciesList">
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
                :show-date-filters="false"
              >
                <template #id="{ row }">
                  {{ row.id }}
                </template>
                <template #name="{ row }">
                  {{ row.name }}
                </template>
                <template #scientific_name="{ row }">
                  {{ row.scientific_name }}
                </template>
                <template #type="{ row }">
                  {{ row.type }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View" @click="showSpecies(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="card p-4">
        <form @submit.prevent="onSubmit">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Species Name</label>
              <input v-model="sform.name" type="text" class="form-control" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Scientific Name</label>
              <input v-model="sform.scientific_name" type="text" class="form-control" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Type</label>
              <select v-model="sform.type" class="form-select" required>
                <option v-for="type in TYPES" :key="type.value" :value="type.value">{{ type.text }}</option>
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-12">
              <label class="form-label">Description</label>
              <textarea v-model="sform.description" class="form-control" rows="2" required></textarea>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <i class="fa fa-save me-1"></i> Save
            </button>
            <button type="button" class="btn btn-secondary" @click="showSpecies()">Cancel</button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSpeciesStore } from '../../../stores/bushman/species-store'
import handleErrors from '../../../stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const quotaStore = useQuotaStore()
const speciesStore = useSpeciesStore()
const toast = useToast()

const showSpeciesList = ref(true)
const loading = ref(false)
const saving = ref(false)
const items = ref([])

const sform = reactive({
  id: null as any,
  name: '',
  type: '',
  scientific_name: '',
  description: '',
})

const TYPES = [
  { value: 'MAIN', text: 'Main Species' },
  { value: 'NORMAL', text: 'Normal Species' },
]

const columns = [
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'scientific_name', label: 'Scientific Name', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => [
  {
    label: 'Add Species',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showSpecies(),
  },
])

function showSpecies(row?: any) {
  showSpeciesList.value = !showSpeciesList.value
  if (row) {
    // Optionally populate sform for editing if needed
  } else {
    Object.assign(sform, { id: null, name: '', type: '', scientific_name: '', description: '' })
  }
}

async function onSubmit() {
  saving.value = true
  try {
    const requestData = {
      name: sform.name,
      type: sform.type,
      scientific_name: sform.scientific_name,
      description: sform.description,
    }
    const response = await speciesStore.createSpecies(requestData)
    if (response.status === 201) {
      toast.init({ message: response.data.message, color: 'success' })
      await getSpeciesItems()
      showSpecies()
    }
  } catch (error: any) {
    const errors = handleErrors(error.response || error)
    const message =
      errors.length > 0
        ? '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n')
        : 'An unexpected error occurred. Please try again later.'
    toast.init({ message, color: 'danger' })
  } finally {
    saving.value = false
  }
}

async function getSpeciesItems() {
  loading.value = true
  try {
    const response = await quotaStore.getSpeciesList()
    if (response.status === 200) {
      items.value = response?.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        scientific_name: item.scientific_name,
      }))
    }
  } catch (error) {
    toast.init({ message: 'Failed to fetch species items', color: 'danger' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getSpeciesItems()
})
</script>


<style scoped>
.species-page {
  padding: 16px;
}
.custom-table {
  background: #fff;
  border-radius: 8px;
}
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
</style>
