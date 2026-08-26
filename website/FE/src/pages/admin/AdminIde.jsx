import { useEffect, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';
import { fetchIdeConfig, updateIdeConfig } from '../../services/ideApi.js';

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

export function AdminIde() {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    loadConfig();
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

  return (
    <AdminPage pageClassName="admin-ide-page" ariaLabel="Admin ArduFlow IDE">
      <AdminTopbar
        searchPlaceholder="Cari konfigurasi IDE..."
        searchLabel="Cari konfigurasi IDE"
        searchValue={search}
        onSearchChange={setSearch}
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
    </AdminPage>
  );
}
