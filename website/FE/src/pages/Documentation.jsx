import { useMemo, useState } from "react";
import documentationImage from "../assets/images/workshop-experience-group.png";

const documentationItems = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  tag: "Tag",
  title: "Judul",
  description: "Deskripsi",
  author: "Nama Lengkap User",
  date: "Tanggal Bulan Tahun",
  image: documentationImage,
}));

const calendarYears = Array.from({ length: 12 }, (_, index) => 2021 + index);
const calendarMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const calendarWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const calendarDays = [
  28, 29, 30, 31, 1, 2, 3,
  4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31,
  1, 2, 3, 4, 5, 6, 7,
];

function Avatar() {
  return (
    <span className="documentation-card__avatar" aria-hidden="true">
      <span />
    </span>
  );
}

export function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateTerm, setDateTerm] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2027);
  const [selectedMonth, setSelectedMonth] = useState("April");

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const date = dateTerm.trim().toLowerCase();

    return documentationItems.filter((item) => {
      const haystack = `${item.tag} ${item.title} ${item.description} ${item.author} ${item.date}`.toLowerCase();
      const dateMatches =
        !date ||
        item.date.toLowerCase().includes(date) ||
        item.date === "Tanggal Bulan Tahun";

      return (!search || haystack.includes(search)) && dateMatches;
    });
  }, [searchTerm, dateTerm]);

  const handleSelectDate = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setDateTerm(`${month} ${year}`);
  };

  const handleSelectDay = (day) => {
    setDateTerm(`${day} ${selectedMonth} ${selectedYear}`);
    setIsCalendarOpen(false);
  };

  return (
    <main className="documentation-page">
      <div className="documentation-page__canvas">
        <div className="documentation-page__heading">
          <p>Gallery Documentation</p>
          <h1>Galleri Dokumentasi Kegiatan</h1>
        </div>

        <label className="documentation-input documentation-input--search">
          <span className="documentation-input__label">Cari dokumentasi kegiatan</span>
          <input
            type="search"
            placeholder="Cari dokumentasi kegiatan..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <span className="documentation-input__search-icon" aria-hidden="true" />
        </label>

        <label className="documentation-input documentation-input--date">
          <span className="documentation-input__label">Filter tanggal kegiatan</span>
          <input
            type="text"
            placeholder="Filter tanggal kegiatan"
            value={dateTerm}
            readOnly
            onClick={() => setIsCalendarOpen(true)}
            onFocus={() => setIsCalendarOpen(true)}
          />
          <span className="documentation-input__calendar-icon" aria-hidden="true">
            <span />
          </span>
        </label>

        {isCalendarOpen && (
          <div
            className="documentation-calendar-layer"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsCalendarOpen(false);
              }
            }}
          >
            <section
              className="documentation-calendar-popup"
              role="dialog"
              aria-modal="true"
              aria-label="Pilih tanggal kegiatan"
            >
              <div className="documentation-calendar-main">
                <div className="documentation-calendar-heading">
                  <h2>Month 2000</h2>
                  <button type="button" aria-label="Bulan berikutnya">
                    ›
                  </button>
                </div>
                <div className="documentation-calendar-nav" aria-hidden="true">
                  <span>‹</span>
                  <span>›</span>
                </div>
                <div className="documentation-calendar-weekdays">
                  {calendarWeekdays.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="documentation-calendar-days">
                  {calendarDays.map((day, index) => (
                    <button
                      className={index < 4 || index > 34 ? "is-muted" : ""}
                      type="button"
                      key={`${day}-${index}`}
                      onClick={() => handleSelectDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="documentation-calendar-years" aria-label="Pilih tahun">
                {calendarYears.map((year) => (
                  <button
                    className={selectedYear === year ? "is-active" : ""}
                    type="button"
                    key={year}
                    onClick={() => handleSelectDate(selectedMonth, year)}
                  >
                    {year}
                  </button>
                ))}
              </div>

              <div className="documentation-calendar-months" aria-label="Pilih bulan">
                {calendarMonths.map((month) => (
                  <button
                    className={[
                      selectedMonth === month ? "is-active" : "",
                      month === "October" ? "is-preview" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    type="button"
                    key={month}
                    onClick={() => handleSelectDate(month, selectedYear)}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        <section className="documentation-gallery" aria-label="Daftar dokumentasi kegiatan">
          <div className="documentation-gallery__grid">
            {filteredItems.map((item) => (
              <article className="documentation-card" key={item.id}>
                <img className="documentation-card__image" src={item.image} alt="" />

                <div className="documentation-card__content">
                  <div className="documentation-card__text">
                    <span className="documentation-card__tag">{item.tag}</span>
                    <div className="documentation-card__title-row">
                      <h2>{item.title}</h2>
                      <a href="/project" aria-label={`Buka ${item.title}`}>
                        ↗
                      </a>
                    </div>
                    <p>{item.description}</p>
                  </div>

                  <div className="documentation-card__author">
                    <Avatar />
                    <div>
                      <strong>{item.author}</strong>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p className="documentation-gallery__empty">
              Dokumentasi belum ditemukan untuk pencarian ini.
            </p>
          )}

          <button className="documentation-gallery__more" type="button">
            <span aria-hidden="true">↓</span>
            Lebih Banyak
          </button>
        </section>
      </div>
    </main>
  );
}

export default Documentation;
