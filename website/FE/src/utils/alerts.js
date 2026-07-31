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
  timer,
} = {}) {
  return Swal.fire({
    icon,
    iconColor: iconColors[icon] || '#00A2FF',
    title,
    text,
    html,
    confirmButtonText,
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

export function showAuthRequiredAlert(message = 'Silakan login terlebih dahulu untuk membuka halaman ini.') {
  return showArduflowAlert({
    icon: 'warning',
    title: 'Akses membutuhkan login',
    text: message,
    confirmButtonText: 'Login',
    timer: 2200,
  });
}
