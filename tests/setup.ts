import { beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  // Ensure Pinia is activated for each test
  setActivePinia(createPinia())

  // Stub matchMedia for jsdom environment
  if (typeof window.matchMedia !== 'function') {
    // @ts-ignore
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })
  }

  // Stub SweetAlert2 to avoid global side-effects
  // Provide a simple fire function that resolves to a default object
  // @ts-ignore
  if (!window.Swal) {
    // @ts-ignore
    window.Swal = {
      fire: vi.fn(() => Promise.resolve({ isConfirmed: true }))
    }
  }

  // Also mock the sweetalert2 module import used in components to prevent
  // the real library from running during tests (avoids internal promise plumbing errors)
  // Mock default export used by components (import Swal from 'sweetalert2')
  vi.mock('sweetalert2', () => ({
    default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: true })) }
  }))
})