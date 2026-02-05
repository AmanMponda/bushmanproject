// SweetAlert2-backed toast notifications
import { ref } from 'vue'
import Swal from 'sweetalert2'

export interface ToastOptions {
  message: string
  duration?: number
  position?: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'
  icon?: 'success' | 'error' | 'warning' | 'info'
  color?: 'success' | 'danger' | 'warning' | 'info'
}

// Keep a lightweight internal store for legacy parts of the app if needed
const toasts = ref<any[]>([])
let toastIdCounter = 0

export interface UseToastReturn {
  init: (options: ToastOptions) => { close: () => void }
  success: (message: string, options?: Omit<ToastOptions, 'message'>) => { close: () => void }
  error: (message: string, options?: Omit<ToastOptions, 'message'>) => { close: () => void }
  warning: (message: string, options?: Omit<ToastOptions, 'message'>) => { close: () => void }
  info: (message: string, options?: Omit<ToastOptions, 'message'>) => { close: () => void }
  close: (id: number) => void
  closeAll: () => void
  toasts: typeof toasts
}

const defaultToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
})

export function useToast(): UseToastReturn {
  const init = (options: ToastOptions) => {
    const id = toastIdCounter++
    toasts.value.push({ id, ...options })

    const iconFromColor =
      options.color === 'success'
        ? 'success'
        : options.color === 'danger'
          ? 'error'
          : options.color === 'warning'
            ? 'warning'
            : options.color === 'info'
              ? 'info'
              : undefined

    defaultToast.fire({
      icon: options.icon || iconFromColor || 'info',
      title: options.message,
      position: options.position || 'top-end',
      timer: options.duration || 3000,
    })

    return {
      close: () => close(id),
    }
  }

  const close = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }

  const closeAll = () => {
    toasts.value = []
  }

  const success = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    return init({ message, icon: 'success', ...options })
  }

  const error = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    return init({ message, icon: 'error', ...options })
  }

  const warning = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    return init({ message, icon: 'warning', ...options })
  }

  const info = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    return init({ message, icon: 'info', ...options })
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
