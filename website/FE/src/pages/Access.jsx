import { useEffect, useMemo, useState } from 'react';
import { fetchIdeConfig } from '../services/ideApi.js';
import { createTransaction, fetchPaymentMethods } from '../services/transactionApi.js';

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function formatCurrency(value, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dueDateIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function Access() {
  const [config, setConfig] = useState({
    title: 'Akses ArduFlow IDE',
    price: 150000,
    currency: 'IDR',
    durationDays: 365,
    isActive: true,
    description: 'Akses visual programming ArduFlow IDE untuk membuat dan mengelola project Arduino dan IoT.',
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');

  const user = getStoredUser();
  const activePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => method.isActive),
    [paymentMethods]
  );
  const selectedMethod = activePaymentMethods.find((method) => String(method.id) === String(selectedPaymentMethod));

  useEffect(() => {
    let active = true;

    async function loadAccessData() {
      setIsLoading(true);

      try {
        const [ideConfig, methods] = await Promise.all([
          fetchIdeConfig(),
          fetchPaymentMethods({ active: 1 }),
        ]);

        if (!active) {
          return;
        }

        setConfig(ideConfig);
        setPaymentMethods(methods);
        setSelectedPaymentMethod(methods.find((method) => method.isActive)?.id || '');
        setMessage('');
      } catch (error) {
        if (active) {
          setMessage(error.message || 'Data akses IDE gagal dimuat.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAccessData();

    return () => {
      active = false;
    };
  }, []);

  async function handleBuyAccess() {
    const token = window.localStorage.getItem('arduflow_user_token');

    if (!token || !user.email) {
      window.location.assign('/signin');
      return;
    }

    if (!config.isActive) {
      setMessage('Pembelian akses IDE sedang dinonaktifkan admin.');
      return;
    }

    setIsCreating(true);
    setMessage('Membuat transaksi akses IDE...');

    try {
      await createTransaction({
        userId: user.id || user.userId || null,
        userName: user.name || user.fullName || user.full_name || user.username || '',
        email: user.email,
        itemType: 'ide',
        itemTitle: config.title || 'Akses ArduFlow IDE',
        amount: Number(config.price || 0),
        currency: config.currency || 'IDR',
        paymentMethod: selectedMethod?.name || '',
        paymentChannel: selectedMethod?.channel || selectedMethod?.methodType || '',
        paymentCode: selectedMethod?.paymentCode || '',
        recipientName: selectedMethod?.recipientName || '',
        dueAt: dueDateIso(),
        notes: `Pembelian akses ArduFlow IDE ${config.durationDays || 365} hari.`,
        payload: {
          product: 'arduflow_ide',
          durationDays: config.durationDays || 365,
          configuredPrice: Number(config.price || 0),
        },
      });

      window.location.assign('/transaksi');
    } catch (error) {
      setMessage(error.message || 'Transaksi akses IDE gagal dibuat.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="access-page">
      <section className="access-purchase">
        <div className="access-purchase__header">
          <p className="access-tag">AKSES ARDUFLOW IDE</p>
          <h1>{config.title || 'Beli akses ArduFlow IDE'}</h1>
          <p className="access-purchase__description">{config.description}</p>
        </div>

        <div className="access-purchase__content">
          <div className="access-purchase__summary">
            <span className="access-purchase__label">Harga akses</span>
            <strong>{formatCurrency(config.price, config.currency)}</strong>
            <span className="access-purchase__duration">Berlaku {config.durationDays || 365} hari setelah akses disetujui.</span>
            <a href="https://ide.arduflow.com" target="_blank" rel="noreferrer" className="access-ide-link">
              Buka ide.arduflow.com <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="access-purchase__form">
            <label htmlFor="access-payment-method">Metode pembayaran</label>
            <select
              id="access-payment-method"
              value={selectedPaymentMethod}
              onChange={(event) => setSelectedPaymentMethod(event.target.value)}
              disabled={activePaymentMethods.length === 0}
            >
              {activePaymentMethods.length === 0 ? (
                <option value="">Belum ada metode aktif</option>
              ) : (
                activePaymentMethods.map((method) => (
                  <option value={method.id} key={method.id}>
                    {[method.name, method.channel].filter(Boolean).join(' - ')}
                  </option>
                ))
              )}
            </select>
            <button type="button" onClick={handleBuyAccess} disabled={isLoading || isCreating || !config.isActive}>
              {isCreating ? 'Membuat transaksi...' : 'Beli akses IDE'}
            </button>
          </div>
        </div>

        {message ? <p className="access-message">{message}</p> : null}
      </section>
    </main>
  );
}
