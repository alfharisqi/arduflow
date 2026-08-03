import { useMemo, useState } from "react";
import featuredLedImage from "../assets/images/featured-led.png";
import featuredDht22Image from "../assets/images/featured-dht22.png";
import featuredEsp32Image from "../assets/images/featured-esp32.png";
import libraryLedImage from "../assets/images/library-led.png";
import libraryDht22Image from "../assets/images/library-dht22.png";
import libraryEsp32Image from "../assets/images/library-esp32.png";
import libraryRelayImage from "../assets/images/library-relay.png";
import libraryDoorLockImage from "../assets/images/library-door-lock.png";
import librarySmartHomeImage from "../assets/images/library-smart-home.png";

const categories = ["Semua", "Proyek Pemula", "Iot", "Arduino", "Esp 32"];
const popupProjectTypes = ["Semua", "Arduino", "Esp 32", "Relay", "IoT", "Sensor", "Otomasi", "Monitoring IoT"];
const difficultyLevels = ["Semua", "Pemula", "Menengah", "Lanjutan"];

const allProjects = [
  {
    title: "LED Sederhana",
    category: "Proyek Pemula",
    difficulty: "Pemula",
    tags: ["Relay", "Arduino"],
    searchType: "Relay",
    image: featuredLedImage,
    description: "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Sensor Suhu DHT22",
    category: "Sensor",
    difficulty: "Menengah",
    tags: ["IoT", "Arduino"],
    searchType: "Sensor",
    image: featuredDht22Image,
    description: "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Monitoring IoT ESP32",
    category: "Esp 32",
    difficulty: "Menengah",
    tags: ["IoT", "Monitoring IoT"],
    searchType: "IoT",
    image: featuredEsp32Image,
    description: "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Lampu Otomatis dengan LDR",
    category: "Proyek Pemula",
    difficulty: "Pemula",
    tags: ["Sensor", "Otomasi", "Arduino"],
    searchType: "Sensor",
    image: libraryLedImage,
    description: "Buat lampu yang dapat menyala secara otomatis ketika kondisi lingkungan mulai gelap.",
  },
  {
    title: "Alarm Pendeteksi Gerakan",
    category: "Sensor",
    difficulty: "Menengah",
    tags: ["Sensor", "IoT"],
    searchType: "Sensor",
    image: libraryDht22Image,
    description: "Gunakan sensor PIR buat mendeteksi gerakan dan mengaktifkan buzzer sebagai sistem alarm sederhana.",
  },
  {
    title: "Monitoring Kelembapan Tanah",
    category: "Iot",
    difficulty: "Menengah",
    tags: ["Monitoring IoT", "Sensor", "Esp 32"],
    searchType: "IoT",
    image: libraryEsp32Image,
    description: "Pantau kondisi kelembapan tanah secara langsung untuk membantu menentukan waktu penyiraman tanaman.",
  },
  {
    title: "Penyiram Tanaman Otomatis",
    category: "Otomasi",
    difficulty: "Menengah",
    tags: ["Sensor", "Arduino"],
    searchType: "Otomasi",
    image: libraryRelayImage,
    description: "Buat sistem penyiraman tanaman yang aktif secara otomatis berdasarkan kondisi kelembapan tanah.",
  },
  {
    title: "Tempat Sampah Otomatis",
    category: "Arduino",
    difficulty: "Pemula",
    tags: ["Otomasi", "Sensor"],
    searchType: "Arduino",
    image: libraryDoorLockImage,
    description: "Gunakan sensor ultrasonik dan servo untuk membuat tempat sampah yang terbuka secara otomatis.",
  },
  {
    title: "Sistem Parkir Sederhana",
    category: "Iot",
    difficulty: "Lanjutan",
    tags: ["Sensor", "Arduino"],
    searchType: "IoT",
    image: librarySmartHomeImage,
    description: "Buat prototipe sistem parkir untuk mendeteksi ketersediaan tempat menggunakan sensor jarak.",
  },
];

const defaultSearchTitles = [
  "LED Sederhana",
  "Monitoring Kelembapan Tanah",
  "Penyiram Tanaman Otomatis",
  "Lampu Otomatis dengan LDR",
  "Sistem Parkir Sederhana",
];

function normalizeCategory(category) {
  return category.toLowerCase().replace(/\s+/g, "");
}

export function ProjectAll() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeDifficulty, setActiveDifficulty] = useState("Semua");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const category = normalizeCategory(activeCategory);

    return allProjects.filter((project) => {
      const projectCategory = normalizeCategory(project.category);
      const projectTags = project.tags.map(normalizeCategory);
      const matchesCategory =
        activeCategory === "Semua" ||
        projectCategory === category ||
        projectTags.includes(category) ||
        (activeCategory === "Iot" && (projectCategory === "iot" || projectTags.includes("iot")));
      const matchesDifficulty =
        activeDifficulty === "Semua" || project.difficulty === activeDifficulty;
      const matchesSearch =
        !search ||
        `${project.title} ${project.category} ${project.difficulty} ${project.tags.join(" ")} ${project.description}`
          .toLowerCase()
          .includes(search);

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [activeCategory, activeDifficulty, searchTerm]);

  const searchProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return defaultSearchTitles
        .map((title) => allProjects.find((project) => project.title === title))
        .filter(Boolean);
    }

    return allProjects
      .filter((project) =>
        `${project.title} ${project.category} ${project.difficulty} ${project.tags.join(" ")} ${project.description}`
          .toLowerCase()
          .includes(search),
      )
      .slice(0, 5);
  }, [searchTerm]);

  return (
    <main className="project-all-page">
      <div className="project-all-page__canvas">
        <div className="project-all-heading">
          <p>CURATED WORK</p>
          <h1>Semua Proyek Pilihan</h1>
        </div>

        <label className="project-all-search">
          <span className="sr-only">Cari proyek</span>
          <input
            type="search"
            placeholder="Cari proyek, tutorial atau panduan..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onClick={() => setIsSearchOpen(true)}
          />
          <span className="project-all-search__icon" aria-hidden="true" />
        </label>

        <button
          className="project-all-filter-button"
          type="button"
          aria-label="Buka filter proyek"
          onClick={() => setIsFilterOpen(true)}
        >
          <span />
          <strong>Filter</strong>
        </button>

        <div className="project-all-categories" aria-label="Kategori proyek">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "active" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <section className="project-all-content" aria-label="Semua proyek pilihan">
          <div className="project-all-grid">
            {filteredProjects.map((project) => (
              <article className="project-all-card" key={project.title}>
                <img src={project.image} alt="" />
                <div className="project-all-card__body">
                  <h2>{project.title}</h2>
                  <span>{project.category}</span>
                  <p>{project.description}</p>
                  <a href="/project/detail">
                    Lihat Detail Proyek <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <p className="project-all-empty">Proyek belum ditemukan untuk filter ini.</p>
          )}
        </section>

        {isFilterOpen && (
          <div
            className="project-filter-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsFilterOpen(false);
              }
            }}
          >
            <aside className="project-filter-popup" role="dialog" aria-modal="true" aria-label="Filter proyek">
              <div className="project-filter-popup__inner">
                <div className="project-filter-popup__header">
                  <h2>Filter Proyek</h2>
                  <button type="button" aria-label="Tutup filter" onClick={() => setIsFilterOpen(false)}>
                    ×
                  </button>
                </div>

                <div className="project-filter-popup__divider" />

                <div className="project-filter-popup__group project-filter-popup__group--type">
                  <h3>Jenis Proyek</h3>
                  <div className="project-filter-popup__chips">
                    {popupProjectTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={normalizeCategory(activeCategory) === normalizeCategory(type) ? "active" : ""}
                        onClick={() => setActiveCategory(type === "IoT" ? "Iot" : type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="project-filter-popup__divider project-filter-popup__divider--second" />

                <div className="project-filter-popup__group project-filter-popup__group--difficulty">
                  <h3>Tingkat Kesulitan</h3>
                  <div className="project-filter-popup__chips project-filter-popup__chips--difficulty">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={activeDifficulty === level ? "active" : ""}
                        onClick={() => setActiveDifficulty(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="project-filter-popup__divider project-filter-popup__divider--bottom" />
              </div>
            </aside>
          </div>
        )}

        {isSearchOpen && (
          <div
            className="project-search-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsSearchOpen(false);
              }
            }}
          >
            <section className="project-search-modal" role="dialog" aria-modal="true" aria-label="Cari proyek">
              <div className="project-search-modal__header">
                <label className="project-search-modal__field">
                  <span className="project-search-modal__icon" aria-hidden="true" />
                  <span className="sr-only">Cari proyek di sini</span>
                  <input
                    type="search"
                    placeholder="Cari Proyek disini..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    autoFocus
                  />
                </label>
              </div>

              <div className="project-search-results">
                {searchProjects.map((project) => (
                  <a className="project-search-result" href="/project/detail" key={project.title}>
                    <img src={project.image} alt="" />
                    <div className="project-search-result__copy">
                      <h3>{project.title}</h3>
                      <p>
                        <span>{project.searchType}</span>
                        <i aria-hidden="true" />
                        <strong>{project.difficulty}</strong>
                      </p>
                    </div>
                  </a>
                ))}

                {searchProjects.length === 0 && (
                  <p className="project-search-empty">Proyek belum ditemukan.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProjectAll;
