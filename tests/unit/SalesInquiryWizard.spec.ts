import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia } from 'pinia'
import SalesInquiryWizard from '@/views/bushman/sales/salesinquiries/SalesInquiryWizard.vue'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'

vi.mock('@/stores/bushman/salesEnquiryService', () => ({
  salesEnquiryService: {
    create: vi.fn(),
    update: vi.fn(),
  }
}))

describe('SalesInquiryWizard', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = shallowMount(SalesInquiryWizard, {
      props: {
        customerData: { entity_id: 123 }
      },
      global: {
        plugins: [createPinia()],
        stubs: ['card']
      }
    })
  })

  it('shows duration input for safari extras and includes item_durations in payload when set', async () => {
    // Prepare minimal valid form state
    wrapper.vm.form.full_name = 'Test'
    wrapper.vm.form.country = 1
    wrapper.vm.form.nationality = 1
    wrapper.vm.form.email = 'a@b.com'
    wrapper.vm.form.no_of_days = 3

    // At least one species required by validation
    wrapper.vm.speciesObjects = [{ species_id: 1, name: 'Spec', quantity: 1 }]

    // Add a safari extra with duration
    wrapper.vm.selectedSafariExtras = [
      { id: 99, name: 'Observer', quantity: 2, item_durations: 5, priority: 'NICE_TO_HAVE', notes: null }
    ]

    // Ensure input renders
    await wrapper.vm.$nextTick()
    const durationInput = wrapper.find('input[placeholder="Duration (days)"]')
    expect(durationInput.exists()).toBe(true)

    // Mock create response
    ;(salesEnquiryService.create as any).mockResolvedValue({ success: true, data: {}, message: 'ok' })

    await wrapper.vm.submit()

    expect(salesEnquiryService.create).toHaveBeenCalled()
    const payload = (salesEnquiryService.create as any).mock.calls[0][0]
    const extraPref = payload.safari_extras.find((p: any) => p.item_id === 99)
    expect(extraPref).toBeTruthy()
    expect(extraPref.item_durations).toBe(5)
  })

  it('does not send item_durations for per-piece extras (Ammo/Gun Permit)', async () => {
    wrapper.vm.form.full_name = 'Test'
    wrapper.vm.form.country = 1
    wrapper.vm.form.nationality = 1
    wrapper.vm.form.email = 'a@b.com'
    wrapper.vm.form.no_of_days = 10

    wrapper.vm.speciesObjects = [{ species_id: 1, name: 'Spec', quantity: 1 }]

    // Add a per-piece extra but with an item_durations value set (should be ignored)
    wrapper.vm.selectedSafariExtras = [
      { id: 200, name: 'Ammo Purchase', quantity: 2, item_durations: 5, priority: 'NICE_TO_HAVE', notes: null },
      { id: 201, name: 'Additional Gun Permit', quantity: 1, item_durations: 15, priority: 'NICE_TO_HAVE', notes: null }
    ]

    ;(salesEnquiryService.create as any).mockResolvedValue({ success: true, data: {}, message: 'ok' })

    await wrapper.vm.submit()

    expect(salesEnquiryService.create).toHaveBeenCalled()
    const payload = (salesEnquiryService.create as any).mock.calls[0][0]

    const ammo = payload.safari_extras.find((p: any) => p.item_id === 200)
    const permit = payload.safari_extras.find((p: any) => p.item_id === 201)

    expect(ammo).toBeTruthy()
    expect(permit).toBeTruthy()

    // They should NOT include item_durations because they are per-piece
    expect(ammo.item_durations).toBeUndefined()
    expect(permit.item_durations).toBeUndefined()
  })
})