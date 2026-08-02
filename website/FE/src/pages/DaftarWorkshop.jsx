import { useEffect, useMemo, useRef, useState } from 'react';
import workshopPresentationMain from '../assets/images/workshop-list-presentation-main.jpg';
import workshopPresentationMarket from '../assets/images/workshop-list-presentation-market.jpg';
import workshopPresentationSpeaker from '../assets/images/workshop-list-presentation-speaker.jpg';

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

const workshops = [
  {
    title: 'Workshop Pemula Arduflow dan IoT',
    date: '30 Juli 2026',
    time: '08.00 - 12.00',
    location: 'Universitas Negeri Malang',
    image: workshopPresentationSpeaker,
    period: 'Hari ini',
  },
  {
    title: 'Workshop Arduflow IDE untuk Siswa',
    date: '12 Agustus 2026',
    time: '7.30 - 10.00',
    location: 'SMKN 1 Glagah',
    image: workshopPresentationMarket,
    period: 'Bulan ini',
  },
  {
    title: 'Program IoT untuk Sekolah',
    date: '19 Agustus 2026',
    time: '13.00 - 16.00',
    location: 'Universitas Muhammadiah Malang',
    image: workshopPresentationMain,
    period: 'Bulan ini',
  },
  {
    title: 'Workshop Pemula Arduflow dan IoT',
    date: '30 Juli 2026',
    time: '08.00 - 11.30',
    location: 'Universitas Negeri Malang',
    image: workshopPresentationSpeaker,
    period: 'Hari ini',
  },
  {
    title: 'Workshop Arduflow IDE untuk Siswa',
    date: '12 Agustus 2026',
    time: '7.30 - 10.00',
    location: 'SMKN 1 Glagah',
    image: workshopPresentationMarket,
    period: 'Bulan ini',
  },
  {
    title: 'Program IoT untuk Sekolah',
    date: '19 Agustus 2026',
    time: '13.00 - 16.00',
    location: 'Universitas Muhammadiah Malang',
    image: workshopPresentationMain,
    period: 'Bulan ini',
  },
];

export function DaftarWorkshop() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(6);
  const [calendarYear, setCalendarYear] = useState(2026);
  const calendarRef = useRef(null);

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
      const matchesFilter = activeFilter === 'Semua' || item.period === activeFilter;
      const searchable = `${item.title} ${item.date} ${item.time} ${item.location}`.toLowerCase();
      const matchesQuery = !keyword || searchable.includes(keyword);
      const matchesDate = !dateKeyword || item.date.toLowerCase().includes(dateKeyword);

      return matchesFilter && matchesQuery && matchesDate;
    });
  }, [activeFilter, query, dateQuery]);

  return (
    <div className="workshop-list-page">
      <section className="workshop-list-shell" aria-labelledby="daftar-workshop-title">
        <div className="workshop-list-heading">
          <h1 id="daftar-workshop-title">Temukan Workshop yang Tepat Untukmu</h1>
          <p>Cari dan pilih program workshop IoT berdasarkan materi dan jadwal yang tersedia</p>
        </div>

        <div className="workshop-list-controls" aria-label="Cari dan filter workshop">
          <label className="workshop-search-field">
            <span className="sr-only">Cari workshop</span>
            <input
              type="search"
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
                          setDateQuery(`${date.day} ${monthNames[calendarMonth]} ${calendarYear}`);
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
              key={`${item.title}-${item.date}-${index}`}
            >
              <img src={item.image} alt="" />
              <div className="workshop-list-card-body">
                <h2>{item.title}</h2>
                <div className="workshop-list-meta" aria-label={`Detail ${item.title}`}>
                  <div>
                    <strong>Tanggal</strong>
                    <span>{item.date}</span>
                  </div>
                  <div>
                    <strong>Waktu</strong>
                    <span>{item.time}</span>
                  </div>
                  <div>
                    <strong>Lokasi</strong>
                    <span>{item.location}</span>
                  </div>
                </div>
                <a className="workshop-detail-button" href="/detail-workshop">Lihat Detail</a>
              </div>
            </article>
          ))}
        </div>

        {visibleWorkshops.length === 0 && (
          <p className="workshop-empty-state">Workshop tidak ditemukan. Coba kata kunci atau filter lain.</p>
        )}

        <nav className="workshop-pagination" aria-label="Navigasi halaman workshop">
          <button className="disabled" type="button" aria-label="Halaman sebelumnya">
            <span aria-hidden="true" />
          </button>
          <span className="active" aria-label="Halaman 1" />
          <span aria-label="Halaman 2" />
          <span aria-label="Halaman 3" />
          <button type="button" aria-label="Halaman berikutnya">
            <span aria-hidden="true" />
          </button>
        </nav>
      </section>
    </div>
  );
}
