import { useEffect, useMemo, useRef, useState } from 'react';
import workshopPresentationMain from '../assets/images/workshop-list-presentation-main.jpg';
import workshopPresentationMarket from '../assets/images/workshop-list-presentation-market.jpg';
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
const years = Array.from({ length: 12 }, (_, index) => 2021 + index);
const fallbackImages = [workshopPresentationSpeaker, workshopPresentationMarket, workshopPresentationMain];

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getPeriod(startsAt) {
  const date = parseDate(startsAt);
  if (!date) return '';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  if (sameDay(date, today)) return 'Hari ini';
  if (date >= startOfWeek && date < endOfWeek) return 'Minggu ini';
  if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()) return 'Bulan ini';

  return '';
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
  const calendarRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    fetchWorkshops()
      .then((items) => {
        if (!isMounted) return;
        setWorkshops(items.filter(isPublicWorkshop));
        setError('');
      })
      .catch((requestError) => {
        if (!isMounted) return;
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

  const visibleWorkshops = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const dateKeyword = dateQuery.trim().toLowerCase();

    return workshops.filter((item) => {
      const period = getPeriod(item.startsAt);
      const itemDate = formatDate(item.startsAt).toLowerCase();
      const searchable = [
        item.title,
        item.description,
        item.category,
        item.method,
        item.location,
        itemDate,
        formatTime(item.startsAt, item.endsAt, item.timeText),
      ].join(' ').toLowerCase();
      const matchesFilter = activeFilter === 'Semua' || period === activeFilter;
      const matchesQuery = !keyword || searchable.includes(keyword);
      const matchesDate = !dateKeyword || itemDate.includes(dateKeyword);

      return matchesFilter && matchesQuery && matchesDate;
    });
  }, [activeFilter, query, dateQuery, workshops]);

  return (
    <div className="workshop-list-page">
      <section className="workshop-list-shell" aria-labelledby="daftar-workshop-title">
        <div className="workshop-list-heading">
          <h1 id="daftar-workshop-title">Temukan Workshop yang Tepat Untukmu</h1>
          <p>Cari dan pilih program workshop IoT berdasarkan materi dan jadwal yang tersedia</p>
          {error ? <p className="workshop-empty-state">{error}</p> : null}
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
            <label className="sr-only" htmlFor="workshop-date-filter">Filter tanggal workshop</label>
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
                    <strong>{monthNames[calendarMonth]} {calendarYear}</strong>
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
                    {weekdays.map((day) => <span key={day}>{day}</span>)}
                  </div>

                  <div className="workshop-calendar-days">
                    {calendarDays.map((date, index) => (
                      <button
                        className={date.muted ? 'muted' : ''}
                        type="button"
                        key={`${date.day}-${index}`}
                        disabled={date.muted}
                        onClick={() => {
                          setDateQuery(`${date.day} ${monthNames[calendarMonth]} ${calendarYear}`.toLowerCase());
                          setIsCalendarOpen(false);
                        }}
                      >
                        {date.day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workshop-calendar-years" aria-label="Pilih tahun">
                  {years.map((year) => (
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

        <div className="workshop-card-grid" aria-label="Daftar workshop tersedia">
          {visibleWorkshops.map((item, index) => (
            <article
              className={`workshop-list-card image-crop-${index % 3}`}
              key={item.id}
            >
              <img src={fallbackImages[index % fallbackImages.length]} alt="" />
              <div className="workshop-list-card-body">
                <h2>{item.title}</h2>
                <div className="workshop-list-meta" aria-label={`Detail ${item.title}`}>
                  <div>
                    <strong>Tanggal</strong>
                    <span>{formatDate(item.startsAt)}</span>
                  </div>
                  <div>
                    <strong>Waktu</strong>
                    <span>{formatTime(item.startsAt, item.endsAt, item.timeText)}</span>
                  </div>
                  <div>
                    <strong>Lokasi</strong>
                    <span>{item.location}</span>
                  </div>
                </div>
                <a className="workshop-detail-button" href={detailHref(item)}>Lihat Detail</a>
              </div>
            </article>
          ))}
        </div>

        {visibleWorkshops.length === 0 && (
          <p className="workshop-empty-state">
            {loading ? 'Memuat workshop dari database...' : 'Workshop tidak ditemukan. Coba kata kunci atau filter lain.'}
          </p>
        )}
      </section>
    </div>
  );
}
