import { useEffect, useRef, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';
import { deactivateIdeToken, fetchIdeConfig, fetchIdeTokens, updateIdeConfig } from '../../services/ideApi.js';
import { showPromptAlert } from '../../utils/alerts.js';

const initialForm = {
  title: 'Akses ArduFlow IDE',
  price: 150000,
  durationDays: 365,
  isActive: true,
  description: '',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AdminIde() {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [tokens, setTokens] = useState([]);
  const [tokenSummary, setTokenSummary] = useState({ total: 0, active: 0, disabled: 0 });
  const [isLoadingTokens, setLoadingTokens] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');
  const searchTimerRef = useRef(null);

  async function loadConfig() {
    setIsLoading(true);

    try {
      const config = await fetchIdeConfig();
      setForm({
        title: config.title,
        price: config.price,
        durationDays: config.durationDays,
        isActive: config.isActive,
        description: config.description,
      });
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Konfigurasi IDE gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTokens(nextSearch = search) {
    setLoadingTokens(true);
    setTokenMessage('');

    try {
      const data = await fetchIdeTokens({
        admin: 1,
        search: nextSearch,
      });
      setTokens(data.tokens);
      setTokenSummary(data.summary);
    } catch (error) {
      setTokens([]);
      setTokenSummary({ total: 0, active: 0, disabled: 0 });
      setTokenMessage(error.message || 'Token IDE gagal dimuat.');
    } finally {
      setLoadingTokens(false);
    }
  }

  useEffect(() => {
    loadConfig();
    loadTokens('');
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage('Menyimpan konfigurasi IDE...');

    try {
      const saved = await updateIdeConfig({
        ...form,
        price: Number(form.price || 0),
        durationDays: Number(form.durationDays || 365),
      });

      setForm({
        title: saved.title,
        price: saved.price,
        durationDays: saved.durationDays,
        isActive: saved.isActive,
        description: saved.description,
      });
      setMessage('Konfigurasi IDE berhasil disimpan.');
    } catch (error) {
      setMessage(error.message || 'Konfigurasi IDE gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivateToken(token) {
    const reason = await showPromptAlert({
      title: 'Nonaktifkan Token IDE',
      text: `Berikan alasan untuk menonaktifkan token ${token.token}. Alasan ini akan tampil di dashboard user.`,
      inputPlaceholder: 'Contoh: Token disalahgunakan / pembayaran dibatalkan',
      confirmButtonText: 'Nonaktifkan',
      requiredMessage: 'Alasan nonaktif wajib diisi.',
    });

    if (reason === null) {
      return;
    }

    setTokenMessage('Menonaktifkan token IDE...');

    try {
      await deactivateIdeToken(token.id, reason);
      setTokenMessage('Token IDE berhasil dinonaktifkan.');
      await loadTokens();
    } catch (error) {
      setTokenMessage(error.message || 'Token IDE gagal dinonaktifkan.');
    }
  }

  function handleTokenSearch(value) {
    setSearch(value);
    window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      loadTokens(value);
    }, 350);
  }

  return (
    <AdminPage pageClassName="admin-ide-page" ariaLabel="Admin ArduFlow IDE">
      <AdminTopbar
        searchPlaceholder="Cari konfigurasi IDE..."
        searchLabel="Cari konfigurasi IDE"
        searchValue={search}
        onSearchChange={handleTokenSearch}
      />

      <section className="admin-ide-heading">
        <div>
          <h1>ArduFlow IDE</h1>
          <p>Dashboard <span>/</span> Konfigurasi akses IDE</p>
        </div>
        <a href="/akses" target="_blank" rel="noreferrer">Lihat Page Akses</a>
      </section>

      <section className="admin-ide-summary" aria-label="Ringkasan produk IDE">
        <article>
          <span>Harga Aktif</span>
          <strong>{formatCurrency(form.price)}</strong>
          <small>Harga yang dibaca halaman /akses</small>
        </article>
        <article>
          <span>Durasi Akses</span>
          <strong>{form.durationDays}</strong>
          <small>Hari setelah pembayaran disetujui</small>
        </article>
        <article>
          <span>Status Pembelian</span>
          <strong>{form.isActive ? 'Aktif' : 'Nonaktif'}</strong>
          <small>Tombol checkout mengikuti status ini</small>
        </article>
        <article>
          <span>Token Aktif</span>
          <strong>{tokenSummary.active || 0}</strong>
          <small>{tokenSummary.disabled || 0} token dinonaktifkan</small>
        </article>
      </section>

      <section className="admin-ide-layout">
        <form className="admin-ide-form" onSubmit={handleSubmit}>
          <h2>Pengaturan Akses IDE</h2>

          <label>
            Nama Produk
            <input
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Akses ArduFlow IDE"
              required
            />
          </label>

          <label>
            Harga Akses
            <input
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              required
            />
          </label>

          <label>
            Durasi Akses
            <input
              type="number"
              min="1"
              value={form.durationDays}
              onChange={(event) => updateField('durationDays', event.target.value)}
              required
            />
          </label>

          <label className="admin-ide-switch">
            <span>Aktifkan Pembelian</span>
            <button
              className={form.isActive ? 'is-on' : ''}
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => updateField('isActive', !form.isActive)}
            >
              <i />
            </button>
            <strong>{form.isActive ? 'Aktif' : 'Nonaktif'}</strong>
          </label>

          <label className="admin-ide-form__full">
            Deskripsi Page Akses
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Tulis deskripsi singkat akses IDE."
              rows={5}
            />
          </label>

          <div className="admin-ide-actions">
            <button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
            <button type="button" onClick={loadConfig} disabled={isSaving || isLoading}>
              Refresh
            </button>
          </div>

          {message ? <p className="admin-ide-message">{message}</p> : null}
        </form>

        <aside className="admin-ide-preview">
          <span>Preview Checkout</span>
          <h2>{form.title || 'Akses ArduFlow IDE'}</h2>
          <strong>{formatCurrency(form.price)}</strong>
          <p>{form.description || 'Deskripsi akses IDE akan tampil di halaman /akses.'}</p>
          <small>{form.isActive ? 'Pembelian tersedia' : 'Pembelian dinonaktifkan'} | {form.durationDays || 365} hari</small>
        </aside>
      </section>

      <section className="admin-ide-token-section" aria-labelledby="admin-ide-token-title">
        <div className="admin-ide-token-head">
          <div>
            <h2 id="admin-ide-token-title">List Token IDE User</h2>
            <p>Token dibuat otomatis dari transaksi IDE yang sudah disetujui. Token nonaktif tidak bisa membuka proyek di IDE.</p>
          </div>
          <button type="button" onClick={() => loadTokens()} disabled={isLoadingTokens}>
            {isLoadingTokens ? 'Memuat...' : 'Refresh Token'}
          </button>
        </div>

        {tokenMessage ? <p className="admin-ide-message">{tokenMessage}</p> : null}

        <div className="admin-ide-token-table" role="table" aria-label="List token IDE user">
          <div className="admin-ide-token-table__head" role="row">
            <span>User</span>
            <span>Email</span>
            <span>Token</span>
            <span>Status</span>
            <span>Diberikan</span>
            <span>Alasan Nonaktif</span>
            <span>Aksi</span>
          </div>

          {isLoadingTokens ? (
            <div className="admin-ide-token-table__row admin-ide-token-table__row--state" role="row">
              <span>Memuat token IDE...</span>
            </div>
          ) : tokens.length === 0 ? (
            <div className="admin-ide-token-table__row admin-ide-token-table__row--state" role="row">
              <span>Belum ada token IDE.</span>
            </div>
          ) : (
            tokens.map((token) => (
              <div className="admin-ide-token-table__row" role="row" key={token.id}>
                <span>{token.userName || '-'}</span>
                <span>{token.email || '-'}</span>
                <span><code>{token.token}</code></span>
                <span>
                  <b className={token.isActive ? 'is-active' : 'is-disabled'}>
                    {token.isActive ? 'Aktif' : 'Nonaktif'}
                  </b>
                </span>
                <span>{formatDate(token.grantedAt)}</span>
                <span>{token.disabledReason || '-'}</span>
                <span>
                  <button type="button" disabled={!token.isActive} onClick={() => handleDeactivateToken(token)}>
                    Nonaktifkan
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminPage>
  );
}
