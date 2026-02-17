import Swal from 'sweetalert2';

export function useNotification() {

  const showAlert = (type, message, timer, position, showConfirmButton = false) => {
    Swal.fire({
      icon: type,
      title: message,
      toast: true,
      position: position || 'top-end',
      showConfirmButton: showConfirmButton,
      timer: timer || 3000,
      padding: '2em',
    });
  };

  const showConfirm = (icon, title, message, confirmButtonText) => {
    return Swal.fire({
      title: title,
      text: message,
      icon: icon || 'warning',
      showCancelButton: true,
      confirmButtonColor: '#258b2a',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmButtonText || 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => result.isConfirmed);
  };

  return { showAlert, showConfirm };
}
