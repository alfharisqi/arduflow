import { useEffect, useMemo, useRef, useState } from 'react';
import workshopPresentationSpeaker from '../assets/images/workshop-list-presentation-speaker.jpg';
import { fetchWorkshops, isPublicWorkshop } from '../services/workshopApi.js';

const filters = ['Semua', 'Hari ini', 'Minggu ini', 'Bulan ini'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const WORKSHOPS_PER_PAGE = 9;
const YEAR_BEFORE_COUNT = 4;
const YEAR_AFTER_COUNT = 8;

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function sameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function matchesTimeFilter(startsAt, activeFilter) {
  if (activeFilter === 'Semua') return true;

  const workshopDate = parseDate(startsAt);
  if (!workshopDate) return false;

  const today = new Date();
  const targetDay = startOfDay(workshopDate);
  const todayStart = startOfDay(today);

  if (activeFilter === 'Hari ini') {
    return sameDay(targetDay, todayStart);
  }

  if (activeFilter === 'Minggu ini') {
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return targetDay >= startOfWeek && targetDay < endOfWeek;
  }

  if (activeFilter === 'Bulan ini') {
    return (
      targetDay.getFullYear() === todayStart.getFullYear() &&
      targetDay.getMonth() === todayStart.getMonth()
    );
  }

  return true;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(startValue, endValue, timeText = '') {
  if (timeText) return timeText;

  const start = parseDate(startValue);
  const end = parseDate(endValue);
  const formatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!start) return '-';
  if (!end) return formatter.format(start);

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function detailHref(workshop) {
  return `/detail-workshop?id=${encodeURIComponent(workshop.id)}`;
}

function workshopImage(workshop) {
  const candidates = [
    workshop?.coverImageUrl,
    workshop?.cover_image_url,
    workshop?.coverUrl,
    workshop?.cover_url,
    workshop?.imageUrl,
    workshop?.image_url,
    workshop?.payload?.coverImageUrl,
    workshop?.payload?.cover_image_url,
    workshop?.payload?.coverUrl,
    workshop?.payload?.cover_url,
  ];

  const imageUrl = candidates.find(
    (value) => typeof value === 'string' && value.trim(),
  );

  return imageUrl?.trim() || workshopPresentationSpeaker;
}

function getTextDensityClass(value) {
  const length = String(value || '').trim().length;

  if (length > 72) return ' is-very-long';
  if (length > 46) return ' is-long';
  return '';
}

function getPaginationPages(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function hasExplicitTime(value) {
  const text = String(value || '').trim();
  return /T\d{1,2}:\d{2}/i.test(text) || /\s\d{1,2}:\d{2}/.test(text);
}

function isManualFinished(workshop) {
  const status = normalizeStatus(
    workshop?.status ||
      workshop?.publication?.status ||
      workshop?.payload?.publication?.status,
  );

  return status === 'selesai' || status === 'finished' || status === 'completed';
}

function isWorkshopVisibleInList(workshop) {
  if (isPublicWorkshop(workshop)) {
    return true;
  }

  // Workshop yang sudah ditandai Selesai oleh admin tetap ditampilkan
  // di "Semua Workshop" selama visibilitasnya bukan Privat.
  if (!isManualFinished(workshop)) {
    return false;
  }

  const visibility = normalizeStatus(
    workshop?.visibility ||
      workshop?.publication?.visibility ||
      workshop?.payload?.publication?.visibility ||
      'publik',
  );

  return visibility !== 'privat' && visibility !== 'private';
}

function isWorkshopFinished(workshop, now = new Date()) {
  // Status manual dari admin selalu menjadi override utama.
  if (isManualFinished(workshop)) {
    return true;
  }

  const endValue = workshop?.endsAt;
  const endDate = parseDate(endValue);

  if (endDate) {
    // Jika endsAt menyimpan jam, gunakan jam akhir secara presisi.
    if (hasExplicitTime(endValue)) {
      return endDate.getTime() < now.getTime();
    }

    // Jika endsAt hanya berupa tanggal, workshop baru dianggap selesai
    // mulai hari berikutnya agar tidak langsung "Selesai" pada pukul 00:00.
    return startOfDay(endDate).getTime() < startOfDay(now).getTime();
  }

  const startDate = parseDate(workshop?.startsAt);
  if (!startDate) return false;

  // Jika tidak ada endsAt, workshop dianggap selesai otomatis setelah
  // tanggalnya lewat. Workshop hari ini tetap aktif kecuali admin
  // menandainya Selesai secara manual.
  return startOfDay(startDate).getTime() < startOfDay(now).getTime();
}

function getWorkshopSortTime(workshop) {
  const start = parseDate(workshop?.startsAt);
  return start ? start.getTime() : Number.POSITIVE_INFINITY;
}

function WorkshopCard({ item, nearest = false, now }) {
  const finished = isWorkshopFinished(item, now);

  return (
    <article
      className={`workshop-list-card${nearest ? ' is-nearest' : ''}${finished ? ' is-finished' : ''}`}
    >
      <div className="workshop-list-image-wrap">
        <img
          src={workshopImage(item)}
          alt={`Gambar ${item.title}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = workshopPresentationSpeaker;
          }}
        />

        {nearest && !finished ? (
          <span className="workshop-list-nearest-badge">TERDEKAT</span>
        ) : null}

        {finished ? (
          <span className="workshop-list-finished-badge">SELESAI</span>
        ) : null}
      </div>

      <div className="workshop-list-card-body">
        <div className="workshop-list-title-wrap">
          <h2>{item.title}</h2>
        </div>

        <div className="workshop-list-meta" aria-label={`Detail ${item.title}`}>
          <div className="workshop-list-meta-item">
            <strong>Tanggal</strong>
            <span className="workshop-list-meta-value">
              <span className="workshop-list-meta-text">
                {formatDate(item.startsAt)}
              </span>
            </span>
          </div>

          <div className="workshop-list-meta-item">
            <strong>Waktu</strong>
            <span className="workshop-list-meta-value">
              <span className="workshop-list-meta-text">
                {formatTime(item.startsAt, item.endsAt, item.timeText)}
              </span>
            </span>
          </div>

          <div className="workshop-list-meta-item">
            <strong>Lokasi</strong>
            <span
              className="workshop-list-meta-value"
              aria-label={`Lokasi: ${item.location || '-'}`}
            >
              <span
                className={`workshop-list-meta-text workshop-list-meta-location${getTextDensityClass(item.location)}`}
              >
                {item.location || '-'}
              </span>
            </span>
          </div>
        </div>

        <a className="workshop-detail-button" href={detailHref(item)}>
          Lihat Detail
        </a>
      </div>
    </article>
  );
}

export function DaftarWorkshop() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusNow, setStatusNow] = useState(() => new Date());

  const calendarRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    fetchWorkshops()
      .then((items) => {
        if (!isMounted) return;

        setWorkshops(items.filter(isWorkshopVisibleInList));
        setError('');
      })
      .catch((requestError) => {
        if (!isMounted) return;

        setWorkshops([]);
        setError(requestError.message || 'Gagal memuat data workshop.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const statusTimer = window.setInterval(() => {
      setStatusNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(statusTimer);
    };
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) {
      return undefined;
    }

    const closeCalendar = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    const closeWithEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', closeCalendar);
    document.addEventListener('keydown', closeWithEscape);

    return () => {
      document.removeEventListener('mousedown', closeCalendar);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [isCalendarOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, query, dateQuery]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells = [];

    for (let index = startOffset - 1; index >= 0; index -= 1) {
      cells.push({ day: prevMonthDays - index, muted: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, muted: false });
    }

    while (cells.length < 42) {
      cells.push({ day: cells.length - startOffset - daysInMonth + 1, muted: true });
    }

    return cells;
  }, [calendarMonth, calendarYear]);

  /*
   * Daftar tahun tidak lagi berhenti pada 2032.
   * Rentang tahun mengikuti tahun yang sedang dipilih. Saat user memilih
   * tahun paling akhir, daftar otomatis bergeser dan menampilkan tahun
   * berikutnya lagi tanpa batas tahun maksimum yang ditulis secara statis.
   */
  const visibleYears = useMemo(() => {
    const startYear = calendarYear - YEAR_BEFORE_COUNT;
    const totalYears = YEAR_BEFORE_COUNT + YEAR_AFTER_COUNT + 1;

    return Array.from({ length: totalYears }, (_, index) => startYear + index);
  }, [calendarYear]);

  const upcomingWorkshops = useMemo(() => {
    return [...workshops]
      .filter((item) => parseDate(item?.startsAt) && !isWorkshopFinished(item, statusNow))
      .sort((left, right) => getWorkshopSortTime(left) - getWorkshopSortTime(right))
      .slice(0, 3);
  }, [statusNow, workshops]);

  const visibleWorkshops = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const dateKeyword = dateQuery.trim().toLowerCase();

    return workshops.filter((item) => {
      const itemDate = formatDate(item.startsAt).toLowerCase();
      const searchable = [
        item.title,
        item.description,
        item.summary,
        item.category,
        item.method,
        item.platform,
        item.location,
        itemDate,
        formatTime(item.startsAt, item.endsAt, item.timeText),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesFilter = matchesTimeFilter(item.startsAt, activeFilter);
      const matchesQuery = !keyword || searchable.includes(keyword);
      const matchesDate = !dateKeyword || itemDate.includes(dateKeyword);

      return matchesFilter && matchesQuery && matchesDate;
    });
  }, [activeFilter, query, dateQuery, workshops]);

  const totalPages = Math.max(1, Math.ceil(visibleWorkshops.length / WORKSHOPS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedWorkshops = useMemo(() => {
    const startIndex = (currentPage - 1) * WORKSHOPS_PER_PAGE;
    return visibleWorkshops.slice(startIndex, startIndex + WORKSHOPS_PER_PAGE);
  }, [currentPage, visibleWorkshops]);

  const paginationPages = useMemo(
    () => getPaginationPages(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) return;

    setCurrentPage(nextPage);

    window.requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = '/workshop';
  };

  return (
    <div className="workshop-list-page">
      <section className="workshop-list-shell" aria-label="Daftar workshop ArduFlow">
        <div className="workshop-list-topbar">
          <button className="workshop-back-button" type="button" onClick={handleBack}>
            <span className="workshop-back-icon" aria-hidden="true" />
            <span>Kembali</span>
          </button>
        </div>

        <section className="workshop-upcoming-section" aria-labelledby="workshop-upcoming-title">
          <div className="workshop-upcoming-heading">
            <p className="workshop-upcoming-eyebrow">WORKSHOP TERDEKAT</p>
            <h2 id="workshop-upcoming-title">Workshop Terbaru yang Akan Datang</h2>
          </div>

          {loading ? (
            <p className="workshop-empty-state">Memuat workshop terdekat...</p>
          ) : error ? (
            <p className="workshop-empty-state">{error}</p>
          ) : upcomingWorkshops.length > 0 ? (
            <div className="workshop-card-grid workshop-upcoming-grid" aria-label="Tiga workshop terdekat">
              {upcomingWorkshops.map((item, index) => (
                <WorkshopCard
                  item={item}
                  key={item.id ?? item.slug ?? `${item.title}-${item.startsAt}`}
                  nearest={index === 0}
                  now={statusNow}
                />
              ))}
            </div>
          ) : (
            <p className="workshop-empty-state">Belum ada workshop mendatang yang tersedia.</p>
          )}
        </section>

        <div className="workshop-list-divider" aria-hidden="true" />

        <div className="workshop-all-heading">
          <h2>Semua Workshop</h2>
          <p>Cari workshop lain berdasarkan kata kunci, tanggal, atau periode waktu.</p>
        </div>

        <div className="workshop-list-controls" aria-label="Cari dan filter workshop">
          <label className="workshop-search-field">
            <span className="sr-only">Cari workshop</span>
            <input
              type="search"
              id="workshop-search"
              name="workshop-search"
              placeholder="Cari workshop, materi, atau jadwal..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="workshop-search-icon" aria-hidden="true" />
          </label>

          <div className="workshop-date-field" ref={calendarRef}>
            <label className="sr-only" htmlFor="workshop-date-filter">
              Filter tanggal workshop
            </label>
            <input
              id="workshop-date-filter"
              name="workshop-date-filter"
              type="text"
              placeholder="Filter tanggal workshop"
              value={dateQuery}
              autoComplete="off"
              onFocus={() => setIsCalendarOpen(true)}
              onChange={(event) => setDateQuery(event.target.value)}
            />
            <button
              className="workshop-calendar-trigger"
              type="button"
              aria-label="Buka kalender workshop"
              aria-expanded={isCalendarOpen}
              onClick={() => setIsCalendarOpen((open) => !open)}
            >
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9 4v5M23 4v5M6.5 12.5h19" />
                <rect x="5" y="7" width="22" height="19" rx="2.5" />
                <path d="M21.5 22.5l4 4M23.5 19a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
              </svg>
            </button>

            {isCalendarOpen && (
              <div className="workshop-calendar-popover" role="dialog" aria-label="Pilih tanggal workshop">
                <div className="workshop-calendar-panel">
                  <div className="workshop-calendar-header">
                    <button
                      type="button"
                      aria-label="Bulan sebelumnya"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear((year) => year - 1);
                        } else {
                          setCalendarMonth((month) => month - 1);
                        }
                      }}
                    />
                    <strong>
                      {monthNames[calendarMonth]} {calendarYear}
                    </strong>
                    <button
                      type="button"
                      aria-label="Bulan berikutnya"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear((year) => year + 1);
                        } else {
                          setCalendarMonth((month) => month + 1);
                        }
                      }}
                    />
                  </div>

                  <div className="workshop-calendar-weekdays" aria-hidden="true">
                    {weekdays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="workshop-calendar-days">
                    {calendarDays.map((date, index) => (
                      <button
                        className={date.muted ? 'muted' : ''}
                        type="button"
                        key={`${date.day}-${index}`}
                        disabled={date.muted}
                        onClick={() => {
                          setDateQuery(
                            `${String(date.day).padStart(2, '0')} ${monthNames[calendarMonth]} ${calendarYear}`,
                          );
                          setIsCalendarOpen(false);
                        }}
                      >
                        {date.day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workshop-calendar-years" aria-label="Pilih tahun">
                  {visibleYears.map((year) => (
                    <button
                      className={calendarYear === year ? 'active' : ''}
                      type="button"
                      key={year}
                      onClick={() => setCalendarYear(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                <div className="workshop-calendar-months" aria-label="Pilih bulan">
                  {monthNames.map((month, index) => (
                    <button
                      className={calendarMonth === index ? 'active' : ''}
                      type="button"
                      key={month}
                      onClick={() => setCalendarMonth(index)}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="workshop-filter-tabs" aria-label="Filter waktu workshop">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter ? 'active' : ''}
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div ref={gridRef} className="workshop-card-grid" aria-label="Daftar workshop tersedia">
          {paginatedWorkshops.map((item) => (
            <WorkshopCard
              item={item}
              key={item.id ?? item.slug ?? `${item.title}-${item.startsAt}`}
              now={statusNow}
            />
          ))}
        </div>

        {visibleWorkshops.length === 0 && (
          <p className="workshop-empty-state">
            {loading
              ? 'Memuat workshop dari database...'
              : 'Workshop tidak ditemukan. Coba kata kunci atau filter lain.'}
          </p>
        )}

        {!loading && !error && visibleWorkshops.length > 0 && totalPages > 1 && (
          <nav className="workshop-pagination" aria-label="Navigasi halaman workshop">
            <button
              className="workshop-pagination-arrow previous"
              type="button"
              aria-label="Halaman sebelumnya"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <span aria-hidden="true" />
            </button>

            <div className="workshop-pagination-pages" aria-label="Nomor halaman">
              {paginationPages.map((page) => (
                <button
                  className={`workshop-pagination-page${page === currentPage ? ' active' : ''}`}
                  type="button"
                  key={page}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Buka halaman ${page}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="workshop-pagination-arrow next"
              type="button"
              aria-label="Halaman berikutnya"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              <span aria-hidden="true" />
            </button>

            <span className="workshop-pagination-status">
              Halaman {currentPage} dari {totalPages}
            </span>
          </nav>
        )}
      </section>
    </div>
  );
}
