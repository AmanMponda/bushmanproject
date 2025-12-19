// Bootstrap-compatible toast notification system
import { ref } from 'vue'

export interface ToastOptions {
  message: string
  color?: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'secondary'
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export interface Toast extends ToastOptions {
  id: number
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

export interface UseToastReturn {
  init: (options: ToastOptions) => { close: () => void }
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => { close: () => void }
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => { close: () => void }
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => { close: () => void }
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => { close: () => void }
  close: (id: number) => void
  closeAll: () => void
  toasts: typeof toasts
}

export function useToast(): UseToastReturn {
  const init = (options: ToastOptions) => {
    const toast: Toast = {
      id: toastIdCounter++,
      message: options.message,
      color: options.color || 'info',
      duration: options.duration || 3000,
      position: options.position || 'top-right',
    }

    toasts.value.push(toast)

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        close(toast.id)
      }, toast.duration)
    }

    return {
      close: () => close(toast.id),
    }
  }

  const close = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const closeAll = () => {
    toasts.value = []
  }

  // Convenience methods matching vuestic-ui API
  const success = (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => {
    return init({ ...options, message, color: 'success' })
  }

  const error = (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => {
    return init({ ...options, message, color: 'danger' })
  }

  const warning = (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => {
    return init({ ...options, message, color: 'warning' })
  }

  const info = (message: string, options?: Omit<ToastOptions, 'message' | 'color'>) => {
    return init({ ...options, message, color: 'info' })
  }

  return {
    init,
    success,
    error,
    warning,
    info,
    close,
    closeAll,
    toasts,
  }
}
