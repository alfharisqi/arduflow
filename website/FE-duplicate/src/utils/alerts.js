import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const iconColors = {
  success: '#00A2FF',
  error: '#FF6A00',
  warning: '#FF6A00',
  info: '#00A2FF',
  question: '#00A2FF',
};

export function showArduflowAlert({
  icon = 'info',
  title,
  text,
  html,
  confirmButtonText = 'OK',
  showCancelButton = false,
  cancelButtonText = 'Batal',
  input,
  inputValue,
  inputPlaceholder,
  inputValidator,
  timer,
} = {}) {
  return Swal.fire({
    icon,
    iconColor: iconColors[icon] || '#00A2FF',
    title,
    text,
    html,
    confirmButtonText,
    showCancelButton,
    cancelButtonText,
    input,
    inputValue,
    inputPlaceholder,
    inputValidator,
    timer,
    timerProgressBar: Boolean(timer),
    background: '#030B1E',
    color: '#FFFFFF',
    buttonsStyling: false,
    customClass: {
      popup: 'arduflow-swal-popup',
      title: 'arduflow-swal-title',
      htmlContainer: 'arduflow-swal-text',
      confirmButton: 'arduflow-swal-confirm',
      cancelButton: 'arduflow-swal-cancel',
      timerProgressBar: 'arduflow-swal-timer',
    },
  });
}

export function showSuccessAlert(title, text) {
  return showArduflowAlert({ icon: 'success', title, text, confirmButtonText: 'Lanjut' });
}

export function showErrorAlert(title, text) {
  return showArduflowAlert({ icon: 'error', title, text, confirmButtonText: 'Coba Lagi' });
}

export async function showConfirmAlert({
  title = 'Konfirmasi',
  text,
  html,
  confirmButtonText = 'Ya',
  cancelButtonText = 'Batal',
  icon = 'warning',
} = {}) {
  const result = await showArduflowAlert({
    icon,
    title,
    text,
    html,
    confirmButtonText,
    showCancelButton: true,
    cancelButtonText,
  });

  return result.isConfirmed;
}

export async function showPromptAlert({
  title = 'Masukkan Data',
  text,
  inputValue = '',
  inputPlaceholder = '',
  confirmButtonText = 'Simpan',
  cancelButtonText = 'Batal',
  requiredMessage = '',
} = {}) {
  const result = await showArduflowAlert({
    icon: 'question',
    title,
    text,
    input: 'text',
    inputValue,
    inputPlaceholder,
    confirmButtonText,
    showCancelButton: true,
    cancelButtonText,
    inputValidator: requiredMessage
      ? (value) => (!String(value || '').trim() ? requiredMessage : undefined)
      : undefined,
  });

  return result.isConfirmed ? result.value : null;
}

export function showAuthRequiredAlert(message = 'Silakan login terlebih dahulu untuk membuka halaman ini.') {
  return showArduflowAlert({
    icon: 'warning',
    title: 'Akses membutuhkan login',
    text: message,
    confirmButtonText: 'Login',
    timer: 2200,
  });
}
