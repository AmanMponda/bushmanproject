<template>
  <div class="container-fluid">
    <!-- Header -->
    <!-- <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">New Place</h5>
      <div>
        <button class="btn btn-link me-2" @click="goBack">Cancel</button>
        <button class="btn btn-success" @click="savePlace">Save Place</button>
      </div>
    </div> -->

    <div class="row g-3">
      <!-- Left Form -->
      <div class="col-md-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Name *</label>
              <input v-model="form.name" type="text" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea v-model="form.description" class="form-control" rows="3" />
            </div>

            <h6 class="mt-4">Adding a Location</h6>
            <small class="text-muted">
              Use the address search below, or input latitude and longitude of the location.
            </small>

            <div class="mb-3 mt-2">
              <label class="form-label">Address *</label>
              <input v-model="form.address" type="text" class="form-control" />
            </div>

            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label">Latitude *</label>
                <input v-model="form.latitude" type="number" step="any" class="form-control" />
              </div>
              <div class="col-6 mb-3">
                <label class="form-label">Longitude *</label>
                <input v-model="form.longitude" type="number" step="any" class="form-control" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Geofence Radius (meters) *</label>
              <input v-model="form.radius" type="number" class="form-control" />
              <small class="text-muted">
                Used to determine location entries associated with this place.
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="col-md-8">
        <div class="card shadow-sm">
          <div class="card-header bg-success bg-opacity-10 text-success">
            You can draw a geofence directly on the map by clicking the circle or polygon icon.
          </div>
          <div class="card-body p-0">
            <div ref="mapRef" class="map"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="d-flex justify-content-end mt-3 gap-2">
      <button class="btn btn-outline-secondary" @click="goBack">Cancel</button>
      <button class="btn btn-outline-success" @click="saveAndAdd">Save & Add Another</button>
      <button class="btn btn-success" @click="savePlace">Save Place</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mapRef = ref(null)
let map
let marker
let circle

const form = ref({
  name: '',
  description: '',
  address: '',
  latitude: -6.7924,
  longitude: 39.2083,
  radius: 300
})

const initMap = () => {
  map = new google.maps.Map(mapRef.value, {
    center: { lat: form.value.latitude, lng: form.value.longitude },
    zoom: 13
  })

  marker = new google.maps.Marker({
    position: map.getCenter(),
    map,
    draggable: true
  })

  circle = new google.maps.Circle({
    map,
    center: map.getCenter(),
    radius: form.value.radius,
    fillColor: '#198754',
    fillOpacity: 0.2,
    strokeColor: '#198754'
  })

  marker.addListener('dragend', e => {
    form.value.latitude = e.latLng.lat()
    form.value.longitude = e.latLng.lng()
    circle.setCenter(e.latLng)
  })
}

onMounted(() => {
  if (window.google) initMap()
})

const savePlace = () => {
  // console.log('Saving place', form.value)
}

const saveAndAdd = () => {
  savePlace()
  Object.assign(form.value, {
    name: '', description: '', address: '', radius: 300
  })
}

const goBack = () => history.back()
</script>

<style scoped>
.map {
  height: 500px;
  width: 100%;
}
</style>
