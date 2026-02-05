import Swal from 'sweetalert2'

export function useSwal() {
  const confirm = async (options: {
    title?: string
    text?: string
    confirmButtonText?: string
    cancelButtonText?: string
  } = {}) => {
    const res = await Swal.fire({
      title: options.title || 'Are you sure?'
      ,
      text: options.text || ''
      ,
      icon: 'warning'
      ,
      showCancelButton: true
      ,
      confirmButtonText: options.confirmButtonText || 'Yes'
      ,
      cancelButtonText: options.cancelButtonText || 'Cancel'
      ,
      reverseButtons: true
    })
    return res.isConfirmed
  }

  const alert = (options: { title?: string; text?: string; icon?: 'success' | 'error' | 'info' | 'warning' } = {}) => {
    return Swal.fire({
      title: options.title || '',
      text: options.text || '',
      icon: options.icon || 'info',
    })
  }

  return { confirm, alert }
}
