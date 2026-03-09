import { shallowMount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createPinia } from 'pinia'
import QuotationSection from '@/views/bushman/sales/salesinquiries/QuotationSection.vue'

describe('QuotationSection - safari extras quantity calculation', () => {
  it('prefers enquiry desired_quantity and item_durations when preview exists', async () => {
    const enquiryData: any = {
      preference: { no_of_days: 10 },
      safari_extras: [
        { item_id: 99, item_name: 'Observer', desired_quantity: 5, item_durations: 5 },
        { item_id: 100, item_name: 'CameraMan', desired_quantity: 1, item_durations: 3 },
      ],
    }

    const wrapper: any = shallowMount(QuotationSection, {
      props: { enquiryId: 1, enquiryData },
      global: { plugins: [createPinia()], stubs: ['card'] },
    })

    // Simulate preview package data present
    wrapper.vm.pricePreviewData = {
      safari_extras: [
        { item_id: 99, item_name: 'Observer', amount: '450', pricing_unit: 'per_day', effective_duration: 10 },
        { item_id: 100, item_name: 'CameraMan', amount: '200', pricing_unit: 'per_day', effective_duration: 10 },
      ]
    }

    await wrapper.vm.$nextTick()

    const categories = wrapper.vm.availablePriceableItems
    const safariCategory = categories.find((c: any) => c.category === 'Safari Extras')
    expect(safariCategory).toBeTruthy()

    const observer = safariCategory.items.find((i: any) => i.name.toLowerCase().includes('observer'))
    const cameraman = safariCategory.items.find((i: any) => i.name.toLowerCase().includes('cameraman'))

    expect(observer).toBeTruthy()
    expect(cameraman).toBeTruthy()

    // Observer: desired_quantity 5 * item_durations 5 => 25
    expect(observer.quantity).toBe(25)

    // CameraMan: desired_quantity 1 * item_durations 3 => 3
    expect(cameraman.quantity).toBe(3)
  })

  it('falls back to preview days when item_durations missing', async () => {
    const enquiryData: any = {
      preference: { no_of_days: 7 },
      safari_extras: [
        { item_id: 101, item_name: 'Tracker', desired_quantity: 2, item_durations: null },
      ],
    }

    const wrapper: any = shallowMount(QuotationSection, {
      props: { enquiryId: 1, enquiryData },
      global: { plugins: [createPinia()], stubs: ['card'] },
    })

    wrapper.vm.pricePreviewData = {
      safari_extras: [
        { item_id: 101, item_name: 'Tracker', amount: '150', pricing_unit: 'per_day', effective_duration: 10 },
      ]
    }

    await wrapper.vm.$nextTick()

    const safariCategory = wrapper.vm.availablePriceableItems.find((c: any) => c.category === 'Safari Extras')
    const tracker = safariCategory.items.find((i: any) => i.name.toLowerCase().includes('tracker'))

    // desired_quantity 2 * fallback effective_duration (previewEffective 10) => 20
    expect(tracker.quantity).toBe(20)
  })
})