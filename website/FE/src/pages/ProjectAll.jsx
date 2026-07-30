import { useState } from "react";
import allProjectLedImage from "../assets/images/all-project-led.png";
import allProjectDht22Image from "../assets/images/all-project-dht22.png";
import allProjectEsp32Image from "../assets/images/all-project-esp32.png";
import allProjectLdrImage from "../assets/images/all-project-ldr.png";
import allProjectMotionImage from "../assets/images/all-project-motion.png";
import allProjectSoilImage from "../assets/images/all-project-soil.png";
import allProjectWateringImage from "../assets/images/all-project-watering.png";
import allProjectTrashImage from "../assets/images/all-project-trash.png";
import allProjectParkingImage from "../assets/images/all-project-parking.png";

const filters = ["Semua", "Proyek Pemula", "Iot", "Arduino", "Esp 32"];
const projectTypeFilters = [
  "Semua",
  "Arduino",
  "Esp 32",
  "Relay",
  "IoT",
  "Sensor",
  "Otomasi",
  "Monitoring IoT",
];
const difficultyFilters = ["Semua", "Pemula", "Menengah", "Lanjutan"];

const allProjects = [
  {
    title: "LED Sederhana",
    image: allProjectLedImage,
    category: "Proyek Pemula",
    tags: ["Proyek Pemula", "Arduino", "Iot"],
    difficulty: "Pemula",
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Sensor Suhu DHT22",
    image: allProjectDht22Image,
    category: "Sensor",
    tags: ["Sensor", "Arduino", "Iot"],
    difficulty: "Pemula",
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Monitoring IoT ESP32",
    image: allProjectEsp32Image,
    category: "Esp32",
    tags: ["Esp 32", "Iot", "Monitoring IoT"],
    difficulty: "Menengah",
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Lampu Otomatis dengan LDR",
    image: allProjectLdrImage,
    category: "Proyek Pemula",
    tags: ["Proyek Pemula", "Arduino", "Otomasi", "Sensor"],
    difficulty: "Pemula",
    description:
      "Buat lampu yang dapat menyala secara otomatis ketika kondisi lingkungan mulai gelap.",
  },
  {
    title: "Alarm Pendeteksi Gerakan",
    image: allProjectMotionImage,
    category: "Sensor",
    tags: ["Sensor", "Otomasi", "Iot"],
    difficulty: "Menengah",
    description:
      "Gunakan sensor PIR buat mendeteksi gerakan dan mengaktifkan buzzer sebagai sistem alarm sederhana.",
  },
  {
    title: "Monitoring Kelembapan Tanah",
    image: allProjectSoilImage,
    category: "Monitoring IoT",
    tags: ["Monitoring IoT", "Iot", "Esp 32", "Otomasi"],
    difficulty: "Menengah",
    description:
      "Pantau kondisi kelembapan tanah secara langsung untuk membantu menentukan waktu penyiraman tanaman.",
  },
  {
    title: "Penyiram Tanaman Otomatis",
    image: allProjectWateringImage,
    category: "Otomasi",
    tags: ["Otomasi", "Arduino", "Iot"],
    difficulty: "Menengah",
    description:
      "Buat sistem penyiraman tanaman yang aktif secara otomatis berdasarkan kondisi kelembapan tanah.",
  },
  {
    title: "Tempat Sampah Otomatis",
    image: allProjectTrashImage,
    category: "Arduino",
    tags: ["Arduino", "Otomasi"],
    difficulty: "Menengah",
    description:
      "Gunakan sensor ultrasonik dan servo untuk membuat tempat sampah yang terbuka secara otomatis.",
  },
  {
    title: "Sistem Parkir Sederhana",
    image: allProjectParkingImage,
    category: "IoT",
    tags: ["Iot", "Esp 32", "Sensor"],
    difficulty: "Lanjutan",
    description:
      "Buat prototipe sistem parkir untuk mendeteksi ketersediaan tempat menggunakan sensor jarak.",
  },
];

const searchResults = [
  {
    title: "LED Sederhana",
    image: allProjectLedImage,
    type: "Relay",
    difficulty: "Pemula",
  },
  {
    title: "Monitoring Kelembapan Tanah",
    image: allProjectSoilImage,
    type: "IoT",
    difficulty: "Menengah",
  },
  {
    title: "Penyiram Tanaman Otomatis",
    image: allProjectWateringImage,
    type: "Otomasi",
    difficulty: "Menengah",
  },
  {
    title: "Lampu Otomatis dengan LDR",
    image: allProjectLdrImage,
    type: "Sensor",
    difficulty: "Pemula",
  },
  {
    title: "Sistem Parkir Sederhana",
    image: allProjectParkingImage,
    type: "IoT",
    difficulty: "Lanjutan",
  },
];

export function ProjectAll() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeTypeFilter, setActiveTypeFilter] = useState("Semua");
  const [activeDifficulty, setActiveDifficulty] = useState("Semua");
  const normalizeFilter = (value) => value.toLowerCase().replace(/\s+/g, "");
  const projectMatchesType = (project, filter) =>
    filter === "Semua" ||
    project.tags.some((tag) => normalizeFilter(tag) === normalizeFilter(filter));
  const projectMatchesDifficulty = (project, filter) =>
    filter === "Semua" || project.difficulty === filter;
  const visibleProjects = allProjects.filter(
    (project) =>
      projectMatchesType(project, activeCategory) &&
      projectMatchesType(project, activeTypeFilter) &&
      projectMatchesDifficulty(project, activeDifficulty),
  );
  const visibleSearchResults = searchResults.filter((project) => {
    const value = `${project.title} ${project.type} ${project.difficulty}`.toLowerCase();

    return value.includes(searchTerm.toLowerCase());
  });

  return (
    <section className="all-projects-page" aria-labelledby="all-projects-title">
      <div className="all-projects-page__inner">
        <div className="all-projects-page__heading">
          <p className="section-eyebrow">CURATED WORK</p>
          <h1 id="all-projects-title">Semua Proyek Pilihan</h1>
        </div>

        <div className="all-projects-toolbar">
          <label className="all-projects-search">
            <span className="sr-only">Cari proyek</span>
            <input
              type="search"
              placeholder="Cari proyek, tutorial atau panduan..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
            <span className="all-projects-search__icon" aria-hidden="true" />
          </label>

          <button
            className="all-projects-filter"
            type="button"
            aria-expanded={isFilterOpen}
            aria-controls="all-projects-filter-popup"
            onClick={() => {
              setIsSearchOpen(false);
              setIsFilterOpen((isOpen) => !isOpen);
            }}
          >
            <span className="all-projects-filter__icon" aria-hidden="true" />
            <span>Filter</span>
          </button>
        </div>

        {isSearchOpen && (
          <div
            className="project-search-overlay"
            onMouseDown={() => setIsSearchOpen(false)}
            role="presentation"
          >
            <div
              className="project-search-popover"
              role="dialog"
              aria-label="Cari proyek"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="project-search-popover__bar">
                <span className="project-search-popover__icon" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Cari Proyek disini..."
                  value={searchTerm}
                  autoFocus
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                />
              </div>

              <div className="project-search-results">
                {visibleSearchResults.map((project) => (
                <a className="project-search-result" href="/project/detail" key={project.title}>
                    <img src={project.image} alt="" />
                    <span className="project-search-result__content">
                      <strong>{project.title}</strong>
                      <span className="project-search-result__meta">
                        <span>{project.type}</span>
                        <i aria-hidden="true" />
                        <span>{project.difficulty}</span>
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {isFilterOpen && (
          <div
            className="filter-popover"
            id="all-projects-filter-popup"
            role="dialog"
            aria-label="Filter Proyek"
          >
            <div className="filter-popover__inner">
              <div className="filter-popover__header">
                <h2>Filter Proyek</h2>
                <button
                  className="filter-popover__close"
                  type="button"
                  aria-label="Tutup filter"
                  onClick={() => setIsFilterOpen(false)}
                />
              </div>

              <div className="filter-popover__divider" />

              <div className="filter-popover__group">
                <h3>Jenis Proyek</h3>
                <div className="filter-chip-list">
                  {projectTypeFilters.map((filter) => (
                    <button
                      className={
                        activeTypeFilter === filter
                          ? "filter-chip filter-chip--active"
                          : "filter-chip"
                      }
                      type="button"
                      key={filter}
                      aria-pressed={activeTypeFilter === filter}
                      onClick={() => setActiveTypeFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-popover__divider" />

              <div className="filter-popover__group filter-popover__group--difficulty">
                <h3>Tingkat Kesulitan</h3>
                <div className="filter-chip-list filter-chip-list--single">
                  {difficultyFilters.map((filter) => (
                    <button
                      className={
                        activeDifficulty === filter
                          ? "filter-chip filter-chip--active"
                          : "filter-chip"
                      }
                      type="button"
                      key={filter}
                      aria-pressed={activeDifficulty === filter}
                      onClick={() => setActiveDifficulty(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-popover__divider" />
            </div>
          </div>
        )}

        <div className="all-projects-tabs" aria-label="Filter proyek">
          {filters.map((filter) => (
            <button
              className={
                activeCategory === filter
                  ? "all-projects-tab all-projects-tab--active"
                  : "all-projects-tab"
              }
              type="button"
              key={filter}
              aria-pressed={activeCategory === filter}
              onClick={() => setActiveCategory(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="all-projects-grid">
          {visibleProjects.map((project) => (
            <article className="all-project-card" key={project.title}>
              <img src={project.image} alt="" className="all-project-card__image" />
              <div className="all-project-card__body">
                <h2>{project.title}</h2>
                <span className="all-project-card__category">{project.category}</span>
                <p>{project.description}</p>
                <a href="/project/detail">
                  Lihat Detail Proyek <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectAll;
