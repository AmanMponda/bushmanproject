import Swal from 'sweetalert2';

export function useNotification() {
  const showAlert = (type, message, timer, position) => {
    Swal.fire({
      icon: type,
      title: message,
      toast: true,
      position: position || 'top-end',
      showConfirmButton: false,
      timer: timer ?? 3000,
      padding: '1.5em',
      customClass: {
        title: 'notification-title-small'
      }
    });
  };

  return { showAlert };
}