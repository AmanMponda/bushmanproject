import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia } from 'pinia'

// Ensure vue-router composables used by the component are mocked before importing the SFC
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

// Prevent SweetAlert2 from executing internal promise plumbing in tests
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: true })) } }))

import CreateQuotation from '@/views/bushman/sales/salesinquiries/CreateQuotation.vue'

// Mock the salesEnquiryService used by loadPackageItems
vi.mock('@/stores/bushman/salesEnquiryService', () => ({
  salesEnquiryService: {
    previewPriceItems: vi.fn(),
    addPricingItem: vi.fn(),
  }
}))

describe('CreateQuotation — customized package handlers & allocation', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = shallowMount(CreateQuotation, {
      global: {
        plugins: [createPinia()],
        stubs: ['card'],
        mocks: {
          $route: { params: {} },
          $router: { push: vi.fn() }
        }
      }
    })
  })

  it('addCustomRow and removeCustomRow manage customRows array', () => {
    expect(wrapper.vm.customRows.length).toBe(0)
    wrapper.vm.addCustomRow()
    expect(wrapper.vm.customRows.length).toBe(1)
    const row = wrapper.vm.customRows[0]
    expect(row).toHaveProperty('_uid')
    expect(row.packageId).toBeNull()

    wrapper.vm.removeCustomRow(0)
    expect(wrapper.vm.customRows.length).toBe(0)
  })

  it('onCustomRowPackageChange loads package items into the row (uses previewPriceItems)', async () => {
    const { salesEnquiryService } = await import('@/stores/bushman/salesEnquiryService')
    // Mock response shape expected by loadPackageItems
    ;(salesEnquiryService.previewPriceItems as any).mockResolvedValue({
      data: {
        trophy_fees: [ { item_id: 10, item_name: 'TestSpecies', amount: '120' } ],
        species: [],
      }
    })

    wrapper.vm.addCustomRow()
    const row = wrapper.vm.customRows[0]
    row.packageId = 999

    await wrapper.vm.onCustomRowPackageChange(row)
    // after load, availableItems should be populated
    expect(Array.isArray(row.availableItems)).toBeTruthy()
    expect(row.availableItems.length).toBeGreaterThan(0)
    expect(row.availableItems[0]).toMatchObject({ id: 10 })
  })

  it('onCustomRowItemChange sets regulatory qty, info note, unitPrice and total', () => {
    wrapper.vm.addCustomRow()
    const row = wrapper.vm.customRows[0]

    // Simulate available item returned from loadPackageItems
    row.availableItems = [ {
      id: 55,
      name: 'Buffalo',
      regulatory_qty: 4,
      unit_price: 250,
      _alreadyInQuotation: true
    } ]

    row.itemId = 55
    wrapper.vm.onCustomRowItemChange(row)

    expect(row.maxQty).toBe(4)
    expect(row.quantity).toBe(4) // auto-filled to regulatory limit
    expect(row.unitPrice).toBe(250)
    expect(row.total).toBe(1000)
    expect(row.infoNote).toContain('already in the base package')
  })

  it('recalcCustomRowTotal enforces maxQty and computes total', () => {
    const row: any = { maxQty: 2, quantity: 5, unitPrice: 50 }
    wrapper.vm.recalcCustomRowTotal(row)
    expect(row.quantity).toBe(2)
    expect(row.total).toBe(100)

    // ensures minimum quantity of 1
    row.quantity = 0
    wrapper.vm.recalcCustomRowTotal(row)
    expect(row.quantity).toBe(1)
  })

  it('assignExcessSpecies splits overflow across candidate packages and creates pending when needed', async () => {
    // Prepare items: requested 6, base limit will be 4
    const items = [ {
      item_type: 'TROPHY',
      item_id: 101,
      description: 'TestBuffalo',
      quantity: 6,
      unit_amount: 100
    } ]

    // Provide pricePreviewData so baseSpeciesQtyMap falls back to species (licence allows 4 for species 101)
    wrapper.vm.pricePreviewData = { species: [ { item_id: 101, quantity: 4 } ] }

    // Candidate package that can supply 2 units (enough to satisfy remainder)
    wrapper.vm.allPackagesList = [ {
      id: 777,
      name: 'Other Package',
      regulatory_package: { species_by_category: [ { species: [ { id: 101, quantity: 2 } ] } ] }
    } ]

    // Mock loadPackageItems to return unit_price for species 101
    wrapper.vm.loadPackageItems = vi.fn().mockResolvedValue([ { id: 101, unit_price: 150 } ])

    const res = await wrapper.vm.assignExcessSpecies(items)

    // original should be capped to 4 and customized line for 2 should be added
    const originals = res.items.filter((i: any) => i._isOriginal)
    const customs = res.items.filter((i: any) => i._isCustomized)
    expect(originals.length).toBeGreaterThan(0)
    expect(originals[0].quantity).toBe(4)
    expect(customs.length).toBe(1)
    expect(customs[0].quantity).toBe(2)
    expect(customs[0].source_package_id).toBe(777)
    expect(res.pending.length).toBe(0)

    // Now change candidate allowance to 1 -> expect pending 1
    wrapper.vm.allPackagesList = [ {
      id: 888,
      name: 'Small Package',
      regulatory_package: { species_by_category: [ { species: [ { id: 101, quantity: 1 } ] } ] }
    } ]
    wrapper.vm.loadPackageItems = vi.fn().mockResolvedValue([ { id: 101, unit_price: 150 } ])

    // Use a fresh item with quantity=6 (items[0] was mutated by the first call)
    const res2 = await wrapper.vm.assignExcessSpecies([ {
      item_type: 'TROPHY',
      item_id: 101,
      description: 'TestBuffalo',
      quantity: 6,
      unit_amount: 100
    } ])

    const originals2 = res2.items.filter((i: any) => i._isOriginal)
    const customs2 = res2.items.filter((i: any) => i._isCustomized)
    const pendings = res2.items.filter((i: any) => i.pending_licence || i._pending_regulatory)
    expect(originals2[0].quantity).toBe(4)
    // custom allocation 1 + pending 1
    expect(customs2.length).toBe(1)
    expect(customs2[0].quantity).toBe(1)
    expect(pendings.length).toBe(1)
    expect(pendings[0].quantity).toBe(1)
  })
})