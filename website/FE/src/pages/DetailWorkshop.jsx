import { useEffect, useMemo, useState } from 'react';
import workshopHero from '../assets/images/workshop-list-presentation-speaker.jpg';
import { fetchWorkshopDetail } from '../services/workshopApi.js';
import '../styles/workshop-detail.css';


function getWorkshopIdentifier() {
  const params = new URLSearchParams(window.location.search);

  const queryId = params.get('id');
  const querySlug = params.get('slug');

  const segments = window.location.pathname
    .split('/')
    .filter(Boolean);

  const lastSegment = segments.at(-1) || '';

  if (queryId) {
    return {
      id: queryId,
    };
  }

  if (querySlug) {
    return {
      slug: querySlug,
    };
  }

  if (
    lastSegment &&
    !['detail-workshop', 'detail'].includes(lastSegment)
  ) {
    return /^\d+$/.test(lastSegment)
      ? { id: lastSegment }
      : { slug: lastSegment };
  }

  return {};
}


function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}


function formatPrice(value) {
  const number = Number(
    String(value ?? '').replace(/\D/g, '')
  );

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return 'Gratis';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}


function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function sanitizeWorkshopHtml(value) {
  return String(value || '')
    .replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    )
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(
      /\s(href|src)=["']javascript:[^"']*["']/gi,
      ''
    );
}


function splitDetailItems(value, fallback) {
  const items = String(value || '')
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length
    ? items
    : fallback;
}


/* =========================================================
   HERO STAT ICON
========================================================= */

function StatIcon({ type }) {
  if (type === 'duration') {
    return (
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="12"
        />

        <path d="M16 9v8l5-3" />
      </svg>
    );
  }

  if (type === 'platform') {
    return (
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <rect
          x="10"
          y="10"
          width="12"
          height="12"
          rx="2"
        />

        <path
          d="
            M16 3v5
            M16 24v5
            M3 16h5
            M24 16h5
            M7.5 7.5l3.5 3.5
            M21 21l3.5 3.5
            M24.5 7.5 21 11
            M11 21l-3.5 3.5
          "
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="6"
        width="22"
        height="16"
        rx="2.5"
      />

      <path d="M12 27h8M16 22v5" />
    </svg>
  );
}


/* =========================================================
   INFORMATION ICON
========================================================= */

function InfoIcon({ type }) {
  if (type === 'time') {
    return (
      <svg
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <circle
          cx="28"
          cy="28"
          r="22"
        />

        <path d="M28 15v15l10-7" />
      </svg>
    );
  }

  if (type === 'location') {
    return (
      <svg
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <path
          d="
            M28 51
            s18-18.2 18-31
            A18 18 0 0 0 10 20
            c0 12.8 18 31 18 31Z
          "
        />

        <circle
          cx="28"
          cy="20"
          r="6"
        />
      </svg>
    );
  }

  if (type === 'price') {
    return (
      <svg
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <path
          d="
            M28 5v46
            M40 14
            c-3-3.4-8-5.1-13.2-4.2
            -5 .9-8.8 4.1-8.8 8.4
            0 5.4 5.2 7 10.2 8.1
            5.1 1.1 10.8 2.6 10.8 8.6
            0 4.9-4.7 8.7-10.8 8.7
            -5.1 0-9.3-1.8-12.2-5
          "
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 56 56"
      aria-hidden="true"
    >
      <path
        d="
          M14 7v8
          M42 7v8
          M9 20h38
          M10 12h36
          a3 3 0 0 1 3 3
          v31
          a3 3 0 0 1-3 3
          H10
          a3 3 0 0 1-3-3
          V15
          a3 3 0 0 1 3-3Z
        "
      />

      <path
        d="
          M18 29h4
          M27 29h4
          M36 29h4
          M18 38h4
          M27 38h4
          M36 38h4
        "
      />
    </svg>
  );
}


/* =========================================================
   NAVIGASI KEMBALI
========================================================= */

function handleDetailBack() {
  const fallbackHref = '/daftar-workshop';

  if (typeof window === 'undefined') {
    return;
  }

  const historyIndex = Number(window.history.state?.idx);
  const hasRouterHistory = Number.isFinite(historyIndex) && historyIndex > 0;

  let hasSameOriginReferrer = false;

  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      hasSameOriginReferrer = referrerUrl.origin === window.location.origin;
    } catch {
      hasSameOriginReferrer = false;
    }
  }

  if (
    window.history.length > 1 &&
    (hasRouterHistory || hasSameOriginReferrer)
  ) {
    window.history.back();
    return;
  }

  window.location.assign(fallbackHref);
}


function DetailBackButton() {
  return (
    <div className="workshop-detail-topbar">
      <button
        className="workshop-detail-back-button"
        type="button"
        onClick={handleDetailBack}
        aria-label="Kembali ke halaman sebelumnya"
      >
        <span
          className="workshop-detail-back-icon"
          aria-hidden="true"
        />
        <span>Kembali</span>
      </button>
    </div>
  );
}


/* =========================================================
   DETAIL WORKSHOP
========================================================= */

export function DetailWorkshop() {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  /* =======================================================
     FETCH WORKSHOP
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const identifier =
      getWorkshopIdentifier();

    setLoading(true);

    fetchWorkshopDetail(identifier)
      .then((item) => {
        if (!isMounted) {
          return;
        }

        setWorkshop(item);
        setError('');
      })

      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setWorkshop(null);

        setError(
          requestError.message ||
            'Gagal memuat detail workshop.'
        );
      })

      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);


  /* =======================================================
     HERO STAT
  ======================================================= */

  const heroStats = useMemo(() => {
    if (!workshop) {
      return [];
    }

    return [
      {
        label: 'Tingkat',
        value:
          workshop.level ||
          '-',
        type: 'level',
      },

      {
        label: 'Durasi',
        value:
          workshop.duration ||
          '-',
        type: 'duration',
      },

      {
        label: 'Platform',
        value:
          workshop.platform ||
          workshop.method ||
          '-',
        type: 'platform',
      },
    ];
  }, [workshop]);


  /* =======================================================
     INFO WORKSHOP
  ======================================================= */

  const infoItems = useMemo(() => {
    if (!workshop) {
      return [];
    }

    const timeValue =
      [
        workshop.timeText,
        workshop.timezone,
      ]
        .filter(Boolean)
        .join(' ') ||
      '-';

    return [
      {
        label: 'Tanggal',

        value:
          formatDate(
            workshop.startsAt
          ),

        detail:
          workshop.status ||
          '-',

        type: 'date',
      },

      {
        label: 'Waktu',

        value:
          timeValue,

        detail:
          workshop.duration
            ? `Durasi ${workshop.duration}`
            : '-',

        type: 'time',
      },

      {
        label: 'Lokasi',

        value:
          workshop.location ||
          '-',

        detail:
          workshop.method ||
          workshop.platform ||
          '-',

        type: 'location',
      },

      {
        label:
          'Biaya Pendaftaran',

        value:
          formatPrice(
            workshop.registrationFee
          ),

        detail:
          'Per peserta',

        type: 'price',

        accent: true,
      },
    ];
  }, [workshop]);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="workshop-detail-page">

        <section className="workshop-detail-shell">

          <DetailBackButton />

          <p className="workshop-detail-state">
            Memuat detail workshop dari database...
          </p>

        </section>

      </main>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !workshop
  ) {
    return (
      <main className="workshop-detail-page">

        <section className="workshop-detail-shell">

          <DetailBackButton />

          <div className="workshop-detail-state">

            <strong>
              {error ||
                'Workshop tidak ditemukan.'}
            </strong>

            <a href="/daftar-workshop">
              Kembali ke daftar workshop
            </a>

          </div>

        </section>

      </main>
    );
  }


  /* =======================================================
     DATA
  ======================================================= */

  const aboutHtml =
    sanitizeWorkshopHtml(
      workshop.about
    );

  const aboutText =
    stripHtml(
      aboutHtml ||
        workshop.description ||
        workshop.summary
    );

  const heroImage =
    workshop.coverImageUrl ||
    workshopHero;


  const registerHref =
    `/kontak?workshop_id=${
      encodeURIComponent(
        workshop.id || ''
      )
    }&workshop=${
      encodeURIComponent(
        workshop.title
      )
    }#form-daftar-workshop`;


  const benefitItems =
    splitDetailItems(
      workshop.facilities,
      [
        'Materi praktik sesuai program workshop',
        'Pendampingan selama sesi berlangsung',
        'Sertifikat atau e-certificate jika tersedia',
      ]
    );


  const bringItems =
    splitDetailItems(
      workshop.bringItems,
      [
        'Laptop pribadi',
        'Koneksi internet yang stabil untuk sesi online',
        'Catatan atau alat tulis untuk merangkum materi',
      ]
    );


  /* =======================================================
     VIEW
  ======================================================= */

  return (
    <main className="workshop-detail-page">

      <section
        className="workshop-detail-shell"
        aria-labelledby="detail-workshop-title"
      >

        <DetailBackButton />

        {/* =================================================
            HERO
        ================================================= */}

        <div className="workshop-detail-hero">

          <div className="workshop-detail-copy">

            <h1 id="detail-workshop-title">
              {workshop.title}
            </h1>

            <p>
              {workshop.summary ||
                workshop.description ||
                aboutText ||
                'Detail workshop tersedia pada halaman ini.'}
            </p>


            {/* =============================================
                HERO STAT CARD
            ============================================= */}

            <div
              className="workshop-detail-chips"
              aria-label="Ringkasan workshop"
            >

              {heroStats.map((item) => (
                <article
                  className={
                    `workshop-detail-chip ` +
                    `workshop-detail-chip--${item.type}`
                  }
                  key={item.label}
                >

                  <span className="workshop-detail-chip-icon">

                    <StatIcon
                      type={item.type}
                    />

                  </span>


                  <div className="workshop-detail-chip-content">

                    <small>
                      {item.label}
                    </small>

                    <strong
                      title={String(item.value)}
                    >
                      {item.value}
                    </strong>

                  </div>

                </article>
              ))}

            </div>

          </div>


          {/* =================================================
              HERO IMAGE
          ================================================= */}

          <div className="workshop-detail-image">

            <img
              src={heroImage}
              alt={workshop.title}
            />

          </div>

        </div>


        {/* =================================================
            INFORMASI WORKSHOP
        ================================================= */}

        <div
          className="workshop-detail-info"
          aria-label="Informasi workshop"
        >

          {infoItems.map((item) => (
            <article
              className="workshop-detail-info-item"
              key={item.label}
            >

              <span className="workshop-detail-info-icon">

                <InfoIcon
                  type={item.type}
                />

              </span>


              <span className="workshop-detail-info-content">

                <small>
                  {item.label}
                </small>

                <strong
                  className={
                    item.accent
                      ? 'accent'
                      : ''
                  }
                >
                  {item.value}
                </strong>

                <em>
                  {item.detail}
                </em>

              </span>

            </article>
          ))}

        </div>


        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="workshop-detail-bottom">


          {/* ===============================================
              TENTANG WORKSHOP
          =============================================== */}

          <article className="workshop-detail-about">

            <h2>
              Tentang Workshop
            </h2>

            <span
              className="workshop-detail-accent"
              aria-hidden="true"
            />


            {aboutHtml ? (

              <div
                className="workshop-detail-rich-text"
                dangerouslySetInnerHTML={{
                  __html:
                    aboutHtml,
                }}
              />

            ) : (

              <p>
                {aboutText ||
                  workshop.description ||
                  '-'}
              </p>

            )}

          </article>


          {/* ===============================================
              SIDE
          =============================================== */}

          <div className="workshop-detail-side-stack">


            {/* BENEFIT */}

            <section
              className="workshop-detail-side-section"
              aria-labelledby="workshop-detail-benefit-title"
            >

              <h2 id="workshop-detail-benefit-title">
                Benefit Workshop
              </h2>

              <ul>

                {benefitItems.map((item) => (
                  <li key={item}>
                    {item}
                  </li>
                ))}

              </ul>

            </section>


            {/* YANG PERLU DIBAWA */}

            <section
              className="workshop-detail-side-section"
              aria-labelledby="workshop-detail-bring-title"
            >

              <h2 id="workshop-detail-bring-title">
                Yang Perlu Dibawa
              </h2>

              <ul>

                {bringItems.map((item) => (
                  <li key={item}>
                    {item}
                  </li>
                ))}

              </ul>

            </section>


            {/* DAFTAR */}

            <aside
              className="workshop-detail-cta"
              aria-label="Daftar workshop"
            >

              <div className="workshop-detail-register">

                <p className="workshop-detail-register-summary">
                  <span className="workshop-detail-register-category">
                    {workshop.category ||
                      'Workshop Arduflow'}
                  </span>

                  <span
                    className="workshop-detail-register-separator"
                    aria-hidden="true"
                  >
                    ·
                  </span>

                  <strong className="workshop-detail-register-price">
                    {formatPrice(
                      workshop.registrationFee
                    )}
                  </strong>
                </p>

                <a href={registerHref}>

                  Daftar Sekarang

                  <span aria-hidden="true">
                    &rarr;
                  </span>

                </a>

              </div>

            </aside>

          </div>

        </div>

      </section>

    </main>
  );
}