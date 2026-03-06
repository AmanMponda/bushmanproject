export function useNotification(): {
  showAlert: (type: string, message: string, timer?: number, position?: string, showConfirmButton?: boolean) => void;
  showConfirm: (icon: string, title: string, message: string, confirmButtonText?: string) => Promise<boolean>;
};
