import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import { deleteTestimonial, fetchTestimonials, updateTestimonial } from '../../services/testimonialApi.js';

const PAGE_SIZE = 6;

function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function TestimonialBadge({ children }) {
  return <span className={`admin-testimonials-badge admin-testimonials-badge--${createSlug(children)}`}>{children}</span>;
}

function SourceBadge({ sourceType, sourceId }) {
  const typeLabel = sourceType === 'workshop' ? 'Workshop' : sourceType === 'partner' ? 'Partner' : 'Umum';
  return (
    <span className={`admin-testimonials-source admin-testimonials-source--${createSlug(typeLabel)}`}>
      <b>{typeLabel}</b>
      {sourceId ? <small>#{sourceId}</small> : null}
    </span>
  );
}

export function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, approved: 0, rejected: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);

  async function loadTestimonials(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTestimonials(nextFilters.status ? { status: nextFilters.status } : {});
      setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
      setStats(data.stats || { total: 0, waiting: 0, approved: 0, rejected: 0 });
    } catch (loadError) {
      setTestimonials([]);
      setError(loadError.message || 'Gagal memuat testimoni.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestimonials();
  }, []);

  const visibleTestimonials = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return testimonials;

    return testimonials.filter((item) => [
      item.name,
      item.email,
      item.role,
      item.quote,
      item.status,
      item.sourceType,
      item.sourceId,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [filters.search, testimonials]);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  const totalPages = Math.max(1, Math.ceil(visibleTestimonials.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedTestimonials = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visibleTestimonials.slice(start, start + PAGE_SIZE);
  }, [page, visibleTestimonials]);

  async function changeStatus(testimonial, status) {
    setBusyId(String(testimonial.id));
    setError('');
    setMessage('');
    try {
      await updateTestimonial(testimonial.id, { ...testimonial, status });
      setMessage(status === 'Disetujui' ? 'Testimoni disetujui dan bisa tampil publik.' : 'Status testimoni diperbarui.');
      await loadTestimonials(filters);
    } catch (updateError) {
      setError(updateError.message || 'Gagal memperbarui testimoni.');
    } finally {
      setBusyId('');
    }
  }

  async function removeTestimonial(testimonial) {
    if (!window.confirm(`Hapus testimoni dari ${testimonial.name}?`)) return;

    setBusyId(String(testimonial.id));
    setError('');
    setMessage('');
    try {
      await deleteTestimonial(testimonial.id);
      setMessage('Testimoni berhasil dihapus.');
      await loadTestimonials(filters);
    } catch (deleteError) {
      setError(deleteError.message || 'Gagal menghapus testimoni.');
    } finally {
      setBusyId('');
    }
  }

  function updateFilter(key, value) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    if (key === 'status') {
      loadTestimonials(nextFilters);
    }
  }

  const statCards = [
    { label: 'Total Testimoni', value: stats.total || 0, note: 'Semua data masuk', tone: 'blue' },
    { label: 'Menunggu Review', value: stats.waiting || 0, note: 'Perlu tindakan admin', tone: 'orange' },
    { label: 'Disetujui', value: stats.approved || 0, note: 'Bisa tampil publik', tone: 'green' },
    { label: 'Ditolak', value: stats.rejected || 0, note: 'Tidak ditampilkan', tone: 'red' },
  ];
  const firstShown = visibleTestimonials.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, visibleTestimonials.length);

  return (
    <AdminPage pageClassName="admin-testimonials-page" ariaLabel="Review testimoni admin">
      <AdminTopbar
        searchPlaceholder="Cari testimoni"
        searchLabel="Cari testimoni"
        searchValue={filters.search}
        onSearchChange={(value) => updateFilter('search', value)}
      />

      <div className="admin-testimonials-layout">
        <section className="admin-testimonials-heading">
          <div>
            <h1>Testimoni</h1>
            <p>Dashboard <span>/</span> Review Testimoni</p>
          </div>
          <button type="button" onClick={() => loadTestimonials(filters)} disabled={loading}>
            {loading ? 'Memuat...' : 'Refresh Data'}
          </button>
        </section>

        {error ? <p className="admin-testimonials-alert is-error">{error}</p> : null}
        {message ? <p className="admin-testimonials-alert is-success">{message}</p> : null}

        <section className="admin-testimonials-stats" aria-label="Ringkasan testimoni">
          {statCards.map((item) => (
            <article className={`admin-testimonials-stat is-${item.tone}`} key={item.label}>
              <span className="admin-testimonials-stat-icon" aria-hidden="true" />
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-testimonials-filter" aria-label="Filter testimoni">
          <label>
            <span>Pencarian</span>
            <input
              type="search"
              placeholder="Cari nama, email, atau isi testimoni"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </label>
        </section>

        <section className="admin-users-table-card admin-testimonials-table-card">
          <div className="admin-users-table-header admin-testimonials-table-header">
            <div>
              <h2>Data Testimoni</h2>
              <p>Setujui testimoni agar dapat tampil di halaman publik.</p>
            </div>
            <span>{paginatedTestimonials.length} ditampilkan</span>
          </div>

          <table className="admin-users-table admin-testimonials-table" aria-label="Data testimoni">
            <thead>
              <tr>
                <th>Pengirim</th>
                <th>Sumber</th>
                <th>Testimoni</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-testimonials-empty">
                    Memuat testimoni...
                  </td>
                </tr>
              ) : paginatedTestimonials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-testimonials-empty">
                    Belum ada testimoni sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedTestimonials.map((testimonial) => (
                  <tr key={testimonial.id}>
                    <td>
                      <span className="admin-testimonials-sender">
                        <b>{testimonial.name || '-'}</b>
                        <small>{testimonial.email || testimonial.role || '-'}</small>
                      </span>
                    </td>
                    <td><SourceBadge sourceType={testimonial.sourceType} sourceId={testimonial.sourceId} /></td>
                    <td>
                      <p className="admin-testimonials-quote" title={testimonial.quote || ''}>
                        {testimonial.quote || '-'}
                      </p>
                    </td>
                    <td>{testimonial.rating || 5}/5</td>
                    <td><TestimonialBadge>{testimonial.status}</TestimonialBadge></td>
                    <td>{formatDate(testimonial.createdAt)}</td>
                    <td>
                      <span className="admin-testimonials-actions">
                        <button type="button" disabled={busyId === String(testimonial.id)} onClick={() => changeStatus(testimonial, 'Disetujui')}>Setujui</button>
                        <button type="button" disabled={busyId === String(testimonial.id)} onClick={() => changeStatus(testimonial, 'Ditolak')}>Tolak</button>
                        <button type="button" className="is-danger" disabled={busyId === String(testimonial.id)} onClick={() => removeTestimonial(testimonial)}>Hapus</button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="admin-users-pagination admin-testimonials-pagination">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</button>
            <div>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(
                  Math.max(0, page - 3),
                  Math.max(0, page - 3) + 5,
                )
                .map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={pageNumber === page ? 'is-active' : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
            </div>
            <span>
              Page {page} of {totalPages}
              <small>Menampilkan {firstShown} - {lastShown} dari {visibleTestimonials.length} testimoni</small>
            </span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </section>
      </div>
    </AdminPage>
  );
}

export default AdminTestimonials;
