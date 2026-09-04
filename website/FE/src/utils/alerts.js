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
<<<<<<< HEAD

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    input,
    inputValue,
    inputPlaceholder,
    inputValidator,
<<<<<<< HEAD

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    timer,
    timerProgressBar: Boolean(timer),

    background: '#030B1E',
    color: '#FFFFFF',

    buttonsStyling: false,

    customClass: {
      popup: 'arduflow-swal-popup',
      title: 'arduflow-swal-title',
      htmlContainer: 'arduflow-swal-text',

      actions: 'arduflow-swal-actions',

      confirmButton: 'arduflow-swal-confirm',
      cancelButton: 'arduflow-swal-cancel',
<<<<<<< HEAD

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
      timerProgressBar: 'arduflow-swal-timer',
    },

    didOpen: (popup) => {
      const actions = popup.querySelector('.swal2-actions');
      const confirmButton = popup.querySelector('.swal2-confirm');
      const cancelButton = popup.querySelector('.swal2-cancel');

      /*
       * Container tombol
       */
      if (actions) {
        Object.assign(actions.style, {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',

          gap: '12px',

          width: '100%',
          margin: '28px 0 8px',
          padding: '0',
        });
      }

      /*
       * Tombol utama
       * Contoh:
       * Ya, Hapus
       * Simpan
       * Lanjut
       */
      if (confirmButton) {
        Object.assign(confirmButton.style, {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',

          minWidth: '150px',
          height: '48px',

          margin: '0',
          padding: '0 24px',

          border: '1px solid #00A2FF',
          borderRadius: '10px',

          background: '#FF6A00',
          color: '#FFFFFF',

          fontFamily: 'inherit',
          fontSize: '15px',
          fontWeight: '700',
          lineHeight: '1',

          outline: 'none',
          cursor: 'pointer',

          boxShadow: 'none',
        });
      }

      /*
       * Tombol Batal
       */
      if (cancelButton) {
        Object.assign(cancelButton.style, {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',

          minWidth: '110px',
          height: '48px',

          margin: '0',
          padding: '0 24px',

          border: '1px solid #475569',
          borderRadius: '10px',

          background: '#0B162B',
          color: '#FFFFFF',

          fontFamily: 'inherit',
          fontSize: '15px',
          fontWeight: '700',
          lineHeight: '1',

          outline: 'none',
          cursor: 'pointer',

          boxShadow: 'none',
        });
      }

      /*
       * Hover tombol confirm
       */
      if (confirmButton) {
        confirmButton.onmouseenter = () => {
          confirmButton.style.background = '#E95F00';
        };

        confirmButton.onmouseleave = () => {
          confirmButton.style.background = '#FF6A00';
        };
      }

      /*
       * Hover tombol batal
       */
      if (cancelButton) {
        cancelButton.onmouseenter = () => {
          cancelButton.style.background = '#162238';
          cancelButton.style.borderColor = '#64748B';
        };

        cancelButton.onmouseleave = () => {
          cancelButton.style.background = '#0B162B';
          cancelButton.style.borderColor = '#475569';
        };
      }
    },
  });
}

/*
|--------------------------------------------------------------------------
| SUCCESS
|--------------------------------------------------------------------------
*/

export function showSuccessAlert(title, text) {
<<<<<<< HEAD
=======
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
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  return showArduflowAlert({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Lanjut',
  });
}

/*
|--------------------------------------------------------------------------
| ERROR
|--------------------------------------------------------------------------
*/

export function showErrorAlert(title, text) {
  return showArduflowAlert({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Coba Lagi',
  });
}

/*
|--------------------------------------------------------------------------
| CONFIRM
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| PROMPT
|--------------------------------------------------------------------------
*/

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
      ? (value) => {
          if (!String(value || '').trim()) {
            return requiredMessage;
          }

          return undefined;
        }
      : undefined,
  });

  return result.isConfirmed ? result.value : null;
}

/*
|--------------------------------------------------------------------------
| AUTH REQUIRED
|--------------------------------------------------------------------------
*/

export function showAuthRequiredAlert(
  message = 'Silakan login terlebih dahulu untuk membuka halaman ini.',
) {
  return showArduflowAlert({
    icon: 'warning',

    title: 'Akses membutuhkan login',
    text: message,

    confirmButtonText: 'Login',

    timer: 2200,
  });
}