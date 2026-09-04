import { useEffect, useMemo, useState } from 'react';
import workshopHero from '../assets/images/workshop-list-presentation-speaker.jpg';
import { fetchWorkshopDetail } from '../services/workshopApi.js';

function getWorkshopIdentifier() {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get('id');
  const querySlug = params.get('slug');
  const segments = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = segments.at(-1) || '';

  if (queryId) return { id: queryId };
  if (querySlug) return { slug: querySlug };
  if (lastSegment && !['detail-workshop', 'detail'].includes(lastSegment)) {
    return /^\d+$/.test(lastSegment) ? { id: lastSegment } : { slug: lastSegment };
  }

  return {};
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatPrice(value) {
  const number = Number(String(value ?? '').replace(/\D/g, ''));
  if (!Number.isFinite(number) || number <= 0) return 'Gratis';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeWorkshopHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '');
}

function splitDetailItems(value, fallback) {
  const items = String(value || '')
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
}

function StatIcon({ type }) {
  if (type === 'duration') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" />
        <path d="M16 9v8l5-3" />
      </svg>
    );
  }

  if (type === 'platform') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="10" y="10" width="12" height="12" rx="2" />
        <path d="M16 3v5M16 24v5M3 16h5M24 16h5M7.5 7.5l3.5 3.5M21 21l3.5 3.5M24.5 7.5 21 11M11 21l-3.5 3.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5" y="6" width="22" height="16" rx="2.5" />
      <path d="M12 27h8M16 22v5" />
    </svg>
  );
}

function InfoIcon({ type }) {
  if (type === 'time') {
    return (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="22" />
        <path d="M28 15v15l10-7" />
      </svg>
    );
  }

  if (type === 'location') {
    return (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 51s18-18.2 18-31A18 18 0 0 0 10 20c0 12.8 18 31 18 31Z" />
        <circle cx="28" cy="20" r="6" />
      </svg>
    );
  }

  if (type === 'price') {
    return (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 5v46M40 14c-3-3.4-8-5.1-13.2-4.2-5 .9-8.8 4.1-8.8 8.4 0 5.4 5.2 7 10.2 8.1 5.1 1.1 10.8 2.6 10.8 8.6 0 4.9-4.7 8.7-10.8 8.7-5.1 0-9.3-1.8-12.2-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <path d="M14 7v8M42 7v8M9 20h38M10 12h36a3 3 0 0 1 3 3v31a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3Z" />
      <path d="M18 29h4M27 29h4M36 29h4M18 38h4M27 38h4M36 38h4" />
    </svg>
  );
}

export function DetailWorkshop() {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const identifier = getWorkshopIdentifier();

    setLoading(true);
    fetchWorkshopDetail(identifier)
      .then((item) => {
        if (!isMounted) return;
        setWorkshop(item);
        setError('');
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setWorkshop(null);
        setError(requestError.message || 'Gagal memuat detail workshop.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const heroStats = useMemo(() => {
    if (!workshop) return [];

    return [
      { label: 'Tingkat', value: workshop.level || '-', type: 'level' },
      { label: 'Durasi', value: workshop.duration || '-', type: 'duration' },
      { label: 'Platform', value: workshop.platform || workshop.method || '-', type: 'platform' },
    ];
  }, [workshop]);

  const infoItems = useMemo(() => {
    if (!workshop) return [];

    const timeValue = [workshop.timeText, workshop.timezone].filter(Boolean).join(' ') || '-';

    return [
      {
        label: 'Tanggal',
        value: formatDate(workshop.startsAt),
        detail: workshop.status || '-',
        type: 'date',
      },
      {
        label: 'Waktu',
        value: timeValue,
        detail: workshop.duration ? `Durasi ${workshop.duration}` : '-',
        type: 'time',
      },
      {
        label: 'Lokasi',
        value: workshop.location || '-',
        detail: workshop.method || workshop.platform || '-',
        type: 'location',
      },
      {
        label: 'Biaya Pendaftaran',
        value: formatPrice(workshop.registrationFee),
        detail: workshop.facilities || 'Detail fasilitas tersedia di deskripsi.',
        type: 'price',
        accent: true,
      },
    ];
  }, [workshop]);

  if (loading) {
    return (
      <main className="workshop-detail-page">
        <section className="workshop-detail-shell">
          <p className="workshop-detail-state">Memuat detail workshop dari database...</p>
        </section>
      </main>
    );
  }

  if (error || !workshop) {
    return (
      <main className="workshop-detail-page">
        <section className="workshop-detail-shell">
          <div className="workshop-detail-state">
            <strong>{error || 'Workshop tidak ditemukan.'}</strong>
            <a href="/daftar-workshop">Kembali ke daftar workshop</a>
          </div>
        </section>
      </main>
    );
  }

  const aboutHtml = sanitizeWorkshopHtml(workshop.about);
  const aboutText = stripHtml(aboutHtml || workshop.description || workshop.summary);
  const heroImage = workshop.coverImageUrl || workshopHero;
  const registerHref = `/kontak?workshop_id=${encodeURIComponent(workshop.id || '')}&workshop=${encodeURIComponent(workshop.title)}#form-daftar-workshop`;
  const benefitItems = splitDetailItems(workshop.facilities, [
    'Materi praktik sesuai program workshop',
    'Pendampingan selama sesi berlangsung',
    'Sertifikat atau e-certificate jika tersedia',
  ]);
  const bringItems = splitDetailItems(workshop.bringItems, [
    'Laptop pribadi',
    'Koneksi internet yang stabil untuk sesi online',
    'Catatan atau alat tulis untuk merangkum materi',
  ]);

  return (
    <main className="workshop-detail-page">
      <section className="workshop-detail-shell" aria-labelledby="detail-workshop-title">
        <div className="workshop-detail-hero">
          <div className="workshop-detail-copy">
            <h1 id="detail-workshop-title">{workshop.title}</h1>
            <p>{workshop.summary || workshop.description || aboutText || 'Detail workshop tersedia pada halaman ini.'}</p>

            <div className="workshop-detail-chips" aria-label="Ringkasan workshop">
              {heroStats.map((item) => (
                <article className="workshop-detail-chip" key={item.label}>
                  <span className="workshop-detail-chip-icon"><StatIcon type={item.type} /></span>
                  <span>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="workshop-detail-image">
            <img src={heroImage} alt={workshop.title} />
          </div>
        </div>

        <div className="workshop-detail-info" aria-label="Informasi workshop">
          {infoItems.map((item) => (
            <article className="workshop-detail-info-item" key={item.label}>
              <span className="workshop-detail-info-icon"><InfoIcon type={item.type} /></span>
              <span>
                <small>{item.label}</small>
                <strong className={item.accent ? 'accent' : ''}>{item.value}</strong>
                <em>{item.detail}</em>
              </span>
            </article>
          ))}
        </div>

        <div className="workshop-detail-bottom">
          <article className="workshop-detail-about">
            <h2>Tentang Workshop</h2>
            <span className="workshop-detail-accent" aria-hidden="true" />
            {aboutHtml ? (
              <div className="workshop-detail-rich-text" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
            ) : (
              <p>{aboutText || workshop.description || '-'}</p>
            )}
          </article>

          <div className="workshop-detail-side-stack">
            <section className="workshop-detail-side-section" aria-labelledby="workshop-detail-benefit-title">
              <h2 id="workshop-detail-benefit-title">Benefit Workshop</h2>
              <ul>
                {benefitItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="workshop-detail-side-section" aria-labelledby="workshop-detail-bring-title">
              <h2 id="workshop-detail-bring-title">Yang Perlu Dibawa</h2>
              <ul>
                {bringItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <aside className="workshop-detail-cta" aria-label="Daftar workshop">
              <div className="workshop-detail-register">
                <p>{workshop.category || 'Workshop Arduflow'} · {formatPrice(workshop.registrationFee)}</p>
                <a href={registerHref}>Daftar Sekarang <span aria-hidden="true">&rarr;</span></a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
