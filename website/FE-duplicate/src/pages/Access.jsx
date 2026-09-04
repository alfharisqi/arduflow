import { useEffect, useMemo, useState } from 'react';
import connectComponentGif from '../assets/gif/gif-connect2component-idearduflow.gif';
import ideAccessFlowGif from '../assets/gif/ide-access-flow.gif';
import inputValueComponentGif from '../assets/gif/gif-inputvaluecomponent-idearduflow.gif';
import putComponentGif from '../assets/gif/gif-putcomponent-idearduflow.gif';
import trafficLightsGif from '../assets/gif/gif-trafficlights-idearduflow.gif';
import cpuIcon from '../assets/icons/icon-cpu-1.svg';
import monitorIcon from '../assets/icons/icon-monitor-1.svg';
import settingsIcon from '../assets/icons/icon-settings-1.svg';
import workflowIcon from '../assets/icons/icon-workflow-1.svg';
import { fetchIdeConfig } from '../services/ideApi.js';
import { createTransaction, fetchPaymentMethods } from '../services/transactionApi.js';
import { accessSteps } from '../features/content/arduflowContent.js';

const featureCards = [
  {
    icon: workflowIcon,
    title: 'Visual Flow Builder',
    text: 'Susun logika program dengan node yang saling terhubung, lebih mudah dibaca, dan cepat diuji.',
  },
  {
    icon: cpuIcon,
    title: 'Komponen IoT Siap Pakai',
    text: 'Mulai dari LED, sensor, servo, relay, hingga input analog tersedia sebagai blok visual.',
  },
  {
    icon: monitorIcon,
    title: 'Preview Alur Program',
    text: 'Periksa koneksi node, konfigurasi pin, dan urutan kerja sebelum program dikirim ke board.',
  },
  {
    icon: settingsIcon,
    title: 'Konfigurasi Terarah',
    text: 'Atur board, port, pin, dan parameter komponen melalui panel yang dibuat untuk pemula.',
  },
];

const workflowSteps = [
  {
    title: 'Pilih Komponen',
    text: 'Ambil node input, output, sensor, atau aktuator dari panel komponen.',
    image: putComponentGif,
  },
  {
    title: 'Hubungkan Logika',
    text: 'Sambungkan node agar alur kerja perangkat terlihat jelas dari awal sampai akhir.',
    image: connectComponentGif,
  },
  {
    title: 'Isi Parameter',
    text: 'Masukkan pin, nilai, delay, dan konfigurasi lain sesuai kebutuhan proyek.',
    image: inputValueComponentGif,
  },
  {
    title: 'Uji ke Board',
    text: 'Generate program dan upload ke board untuk melihat hasilnya pada hardware.',
    image: trafficLightsGif,
  },
];

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
      <section className="access-hero">
        <div className="access-hero__copy">
          <p className="access-tag">AKSES ARDUFLOW IDE</p>
          <h1>
            <span>Beli akses</span>
            <span>ArduFlow IDE</span>
          </h1>
          <p>{config.description}</p>
          <div className="access-hero__actions">
            <button type="button" onClick={handleBuyAccess} disabled={isLoading || isCreating || !config.isActive}>
              {isCreating ? 'Membuat Transaksi...' : 'Beli Akses IDE'}
            </button>
            <a href="#fitur-ide">Lihat IDE</a>
          </div>
          {message ? <p className="access-message">{message}</p> : null}
        </div>

        <div className="access-hero__visual">
          <img src={ideAccessFlowGif} alt="Preview alur akses ArduFlow IDE" />

          <aside className="access-price-card" aria-label="Harga akses ArduFlow IDE">
            <span>{config.title}</span>
            <strong>{formatCurrency(config.price, config.currency)}</strong>
            <small>Akses {config.durationDays || 365} hari</small>
          </aside>
        </div>
      </section>

      <section className="access-features" id="fitur-ide" aria-labelledby="access-features-title">
        <div className="access-section-heading">
          <p className="access-tag">FITUR IDE</p>
          <h2 id="access-features-title">Bangun logika Arduino dan IoT secara visual.</h2>
        </div>

        <div className="access-feature-grid">
          {featureCards.map((feature) => (
            <article className="access-feature-card" key={feature.title}>
              <span>
                <img src={feature.icon} alt="" />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="access-workflow" aria-labelledby="access-workflow-title">
        <div className="access-section-heading">
          <p className="access-tag">CARA KERJA</p>
          <h2 id="access-workflow-title">Dari komponen ke program siap upload.</h2>
        </div>

        <div className="access-workflow-grid">
          {workflowSteps.map((step, index) => (
            <article className="access-workflow-card" key={step.title}>
              <img src={step.image} alt={`Demo ${step.title.toLowerCase()} di ArduFlow IDE`} />
              <div>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="access-checkout section">
        <div>
          <h2>Metode pembayaran</h2>
          <p>Transaksi akan dibuat sebagai tagihan menunggu pembayaran. Upload bukti pembayaran dilakukan di dashboard user.</p>
        </div>
        <select
          value={selectedPaymentMethod}
          onChange={(event) => setSelectedPaymentMethod(event.target.value)}
          disabled={activePaymentMethods.length === 0}
          aria-label="Pilih metode pembayaran"
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
      </section>

      <section className="access-steps section">
        <h2>Alur setelah membeli akses</h2>
        <div className="access-steps-grid">
          {accessSteps.map((step, index) => (
            <article key={step.title || index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.description || step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
