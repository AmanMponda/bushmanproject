<template>
  <div class="bg-white rounded p-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item"><router-link to="/abs/location">SETTINGS</router-link></li>
        <li class="breadcrumb-item"><router-link to="/abs/location">LOCATION MASTER</router-link></li>
        <li class="breadcrumb-item"><router-link to="/abs/location">ROUTE PLANNING</router-link></li>
        <li class="breadcrumb-item active">CREATE</li>
      </ol>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary text-dark" @click="goBack">
          <i class="fa fa-arrow-left"></i> Back
        </button>
        <button class="btn btn-info text-dark" :disabled="isLoading" @click="addRouteRow">
          <i class="fa fa-plus me-1"></i> Add Route Row
        </button>
        <button class="btn btn-success text-dark" :disabled="isLoading" @click="saveRoutes">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
          <i class="fa fa-save me-1"></i> Save Route(s)
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 55%">City Link</th>
            <th style="width: 20%">Route Code</th>
            <th style="width: 10%">Status</th>
            <th style="width: 10%">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(route, index) in multipleRoutes" :key="`route-${index}`">
            <td class="text-center">{{ index + 1 }}</td>
            <td>
              <Multiselect
                v-model="route.city_link_id"
                :options="cityLinks"
                label="display_name"
                track-by="id"
                placeholder="Select City Link"
                :loading="isLoadingCityLinks"
                :append-to-body="true"
              >
                <template #option="{ option }">
                  <span>{{ option.original_city }} - {{ option.destination_city }}</span>
                </template>
              </Multiselect>
            </td>
            <td>
              <input v-model="route.route_code" type="text" class="form-control" />
            </td>
            <td>
              <select v-model="route.is_active" class="form-control">
                <option :value="1">Active</option>
                <option :value="0">Inactive</option>
              </select>
            </td>
            <td class="text-center">
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeRouteRow(index)"
                :disabled="multipleRoutes.length <= 1"
              >
                <i class="fa fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { useNotification } from '@/composables/notification'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

const { showAlert } = useNotification()
const authStore = useAuthStore()
const router = useRouter()

const isLoading = ref(false)
const isLoadingCityLinks = ref(false)
const cityLinks = ref([])
const multipleRoutes = ref([
  { city_link_id: null, route_code: '', is_active: 1 }
])

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Authorization: authStore.token ? `Bearer ${authStore.token}` : ''
  }
})

const goBack = () => {
  router.back()
}

const addRouteRow = () => {
  multipleRoutes.value.push({ city_link_id: null, route_code: '', is_active: 1 })
}

const removeRouteRow = (index) => {
  if (multipleRoutes.value.length > 1) {
    multipleRoutes.value.splice(index, 1)
  }
}

const fetchCityLinks = async () => {
  isLoadingCityLinks.value = true
  try {
    const response = await axiosInstance.get('/city-links')
    const payload = response.data?.data
    const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
    cityLinks.value = rows.map((d) => ({
      id: d.id,
      original_city: d.original_city?.name || d.original_city,
      destination_city: d.destination_city?.name || d.destination_city,
      display_name: `${d.original_city?.name || d.original_city || 'N/A'} - ${d.destination_city?.name || d.destination_city || 'N/A'}`
    }))
  } catch (error) {
    showAlert('error', 'Failed to fetch city links')
  } finally {
    isLoadingCityLinks.value = false
  }
}

const saveRoutes = async () => {
  isLoading.value = true
  try {
    for (let i = 0; i < multipleRoutes.value.length; i++) {
      const route = multipleRoutes.value[i]
      if (!route.city_link_id || !route.route_code) {
        showAlert('error', `Please fill all required fields in row ${i + 1}`)
        isLoading.value = false
        return
      }
    }

    const batchData = multipleRoutes.value.map((route) => ({
      city_link_id: typeof route.city_link_id === 'object' ? route.city_link_id.id : route.city_link_id,
      route_code: route.route_code,
      is_active: route.is_active
    }))

    const response = await axiosInstance.post('/routes', { routes: batchData })
    if (response.data.status === 'success') {
      showAlert('success', `${batchData.length} Route(s) saved successfully`)
      multipleRoutes.value = [{ city_link_id: null, route_code: '', is_active: 1 }]
      router.back()
    } else {
      showAlert('error', response.data?.message || 'Failed to save routes')
    }
  } catch (error) {
    showAlert('error', 'Failed to save routes')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCityLinks()
})
</script>

<style scoped>
:deep(.multiselect) {
  width: 100%;
}

:deep(.multiselect__content-wrapper) {
  position: absolute;
  z-index: 1055;
  max-height: 260px;
}

:deep(.multiselect__content) {
  width: 100%;
}
</style>
