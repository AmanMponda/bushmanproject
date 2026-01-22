import { ref } from 'vue'
import axios from 'axios'

export function useCityRouteGeometry() {
  const loading = ref(false)
  const error = ref(null)
  const routeGeometry = ref(null)

  // =========================
  // STEP 1: Get city lat/lng
  // =========================
  const geocodeCity = async (cityName) => {
    const res = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: cityName,
          format: 'json',
          limit: 1
        }
      }
    )

    if (!res.data.length) {
      throw new Error(`City not found: ${cityName}`)
    }

    return {
      lat: parseFloat(res.data[0].lat),
      lng: parseFloat(res.data[0].lon)
    }
  }

  // =========================
  // STEP 2: Get route geometry
  // =========================
  const getRouteBetweenCities = async (fromCity, toCity) => {
    loading.value = true
    error.value = null
    routeGeometry.value = null

    try {
      const from = await geocodeCity(fromCity)
      const to = await geocodeCity(toCity)

      const routeRes = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson'
          }
        }
      )

      if (!routeRes.data.routes.length) {
        throw new Error('Route not found')
      }

      routeGeometry.value = {
        from,
        to,
        distance_km: (routeRes.data.routes[0].distance / 1000).toFixed(2),
        duration_min: Math.round(routeRes.data.routes[0].duration / 60),
        geometry: routeRes.data.routes[0].geometry // GeoJSON LineString
      }

      return routeGeometry.value
    } catch (err) {
      error.value = err.message || 'Failed to get route'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    routeGeometry,
    getRouteBetweenCities
  }
  
}
