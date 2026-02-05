import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createPinia } from 'pinia'

// Provide a controllable router mock
const push = vi.fn().mockResolvedValue(undefined)
const replace = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
  useRoute: () => ({ params: {}, query: {} })
}))

// Mock vehicle service to avoid real HTTP
vi.mock('@/services/vehicleAssetService', () => ({
  default: {
    getVehicleAsset: vi.fn().mockResolvedValue({ data: { data: { id: 1, registration_number: 'REG123', name: 'Test Vehicle' } } }),
    findByRegistration: vi.fn().mockResolvedValue({ data: { data: { id: 1, registration_number: 'REG123', name: 'Test Vehicle' } } }),
    listVehicleAssetsDisplay: vi.fn().mockResolvedValue({ data: [] }),
    getFleetSummary: vi.fn(),
    getMetadata: vi.fn()
  }
}))

import FleetMaster from '../FleetMaster.vue'

describe('FleetMaster.vue', () => {
  it('navigates to named details route when opening vehicle details', async () => {
    const wrapper = shallowMount(FleetMaster as any, {
      global: {
        plugins: [createPinia()],
        stubs: ['StandardDataTable', 'VehicleProfile', 'VehicleFormModal', 'VehicleDetailsModal', 'VehicleDocumentsModal', 'router-link']
      }
    })

    // Access the setup function exposed state
    const openVehicleDetails = (wrapper.vm as any).$?.setupState.openVehicleDetails
    expect(typeof openVehicleDetails).toBe('function')

    // Call with a vehicle that has a registration_number (string id preferred)
    await openVehicleDetails({ id: 1, registration_number: 'REG123' })
    await Promise.resolve()

    // Expect router.push called to named route with id param
    expect(push).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ name: 'bushman-fleet-master-details', params: { id: 'REG123' } })
  })

  it('reverts to list view when registration lookup returns a success:false payload', async () => {
    // Mock the service to return success:false when finding by registration
    const vehicleAssetService = await import('@/services/vehicleAssetService')
    ;(vehicleAssetService.default.findByRegistration as any).mockResolvedValue({ data: { success: false, message: 'Vehicle asset not found with the given registration number' } })

    const wrapper = shallowMount(FleetMaster as any, {
      global: {
        plugins: [createPinia()],
        stubs: ['StandardDataTable', 'VehicleProfile', 'VehicleFormModal', 'VehicleDetailsModal', 'VehicleDocumentsModal', 'router-link']
      }
    })

    const openVehicleDetails = (wrapper.vm as any).$?.setupState.openVehicleDetails
    await openVehicleDetails({ registration_number: 'NOTEXIST' })
    await Promise.resolve()

    // Component should revert back to list view and not remain on details page
    expect((wrapper.vm as any).$?.setupState.showVehicleList.value).toBe(true)
    expect((wrapper.vm as any).$?.setupState.showVehicleDetailsPage.value).toBe(false)
  })
})
