import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/project-all.css";

import projectHeroImage from "../assets/images/project-hero-reference.png";

import {
  fetchProjectSubmissions,
  isPublicProject,
} from "../services/projectApi.js";


/* =========================================================
   FILTER
========================================================= */

const difficultyFilters = [
  "Semua",
  "Pemula",
  "Menengah",
  "Lanjutan",
];


/* =========================================================
   HELPERS
========================================================= */

function normalizeFilter(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");
}


function projectDetailHref(project) {
  return `/project/detail?id=${encodeURIComponent(
    project.id
  )}`;
}


function stripHtml(value) {
  if (!value) return "";

  const wrapper =
    document.createElement("div");

  wrapper.innerHTML =
    String(value || "");

  return (
    wrapper.textContent ||
    wrapper.innerText ||
    ""
  );
}


function projectSummary(value) {
  return stripHtml(value)
    .replace(/\s+/g, " ")
    .trim();
}


function projectImage(project) {
  return (
    project.coverImageUrl ||
    projectHeroImage
  );
}


function toolLabel(tool) {
  return String(
    tool?.name ||
    tool?.title ||
    tool ||
    ""
  ).trim();
}


function projectMatchesType(
  project,
  filter
) {
  if (filter === "Semua") {
    return true;
  }

  const normalized =
    normalizeFilter(filter);

  return [
    project.category,
    ...(project.tags || []),
  ].some(
    (value) =>
      normalizeFilter(value) ===
      normalized
  );
}


function projectMatchesDifficulty(
  project,
  filter
) {
  return (
    filter === "Semua" ||
    normalizeFilter(
      project.difficulty
    ) === normalizeFilter(filter)
  );
}


function projectMatchesSearch(
  project,
  searchTerm
) {
  const keyword =
    searchTerm
      .trim()
      .toLowerCase();

  if (!keyword) {
    return true;
  }

  const searchableText = [
    project.title,
    project.category,
    projectSummary(
      project.description
    ),
    project.difficulty,
    ...(project.tags || []),
    ...(project.tools || []).map(
      toolLabel
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(
    keyword
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyProjects({
  loading,
}) {
  return (
    <p
      className="
        admin-empty-state
        admin-empty-state--wide
      "
    >
      {loading
        ? "Memuat proyek dari database..."
        : "Belum ada proyek publish sesuai filter."}
    </p>
  );
}


/* =========================================================
   PROJECT ALL
========================================================= */

export function ProjectAll() {

  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("Semua");

  const [
    activeTypeFilter,
    setActiveTypeFilter,
  ] = useState("Semua");

  const [
    activeDifficulty,
    setActiveDifficulty,
  ] = useState("Semua");

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =========================================================
     LOAD PROJECT
  ========================================================= */

  useEffect(() => {

    let isMounted = true;

    fetchProjectSubmissions()
      .then((items) => {

        if (!isMounted) {
          return;
        }

        const publicProjects =
          Array.isArray(items)
            ? items.filter(
                isPublicProject
              )
            : [];

        setProjects(
          publicProjects
        );

      })
      .catch((error) => {

        console.error(
          "Gagal memuat project submissions:",
          error
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


  /* =========================================================
     CATEGORY FILTER
  ========================================================= */

  const categoryFilters =
    useMemo(() => {

      const values =
        projects
          .flatMap(
            (project) => [
              project.category,
              ...(project.tags || []),
            ]
          )
          .filter(Boolean);

      return [
        "Semua",
        ...Array.from(
          new Set(values)
        ).slice(0, 6),
      ];

    }, [projects]);


  /* =========================================================
     PROJECT TYPE FILTER
  ========================================================= */

  const projectTypeFilters =
    useMemo(() => {

      const values =
        projects
          .flatMap(
            (project) => [
              project.category,
              ...(project.tags || []),
            ]
          )
          .filter(Boolean);

      return [
        "Semua",
        ...Array.from(
          new Set(values)
        ).slice(0, 10),
      ];

    }, [projects]);


  /* =========================================================
     VISIBLE PROJECTS
  ========================================================= */

  const visibleProjects =
    useMemo(() => {

      return projects.filter(
        (project) =>
          projectMatchesType(
            project,
            activeCategory
          ) &&
          projectMatchesType(
            project,
            activeTypeFilter
          ) &&
          projectMatchesDifficulty(
            project,
            activeDifficulty
          ) &&
          projectMatchesSearch(
            project,
            searchTerm
          )
      );

    }, [
      projects,
      activeCategory,
      activeTypeFilter,
      activeDifficulty,
      searchTerm,
    ]);


  /* =========================================================
     SEARCH RESULT
  ========================================================= */

  const visibleSearchResults =
    useMemo(() => {

      return projects
        .filter(
          (project) =>
            projectMatchesSearch(
              project,
              searchTerm
            )
        )
        .slice(0, 6);

    }, [
      projects,
      searchTerm,
    ]);


  /* =========================================================
     RESET FILTER
  ========================================================= */

  function resetFilters() {

    setActiveCategory("Semua");
    setActiveTypeFilter("Semua");
    setActiveDifficulty("Semua");

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      className="all-projects-page"
      aria-labelledby="all-projects-title"
    >

      <div className="all-projects-page__inner">


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="all-projects-page__heading">

          <p className="section-eyebrow">
            DATABASE PROJECTS
          </p>

          <h1 id="all-projects-title">
            Semua Proyek Pilihan
          </h1>

          <p className="all-projects-page__description">
            Jelajahi berbagai proyek Arduino,
            IoT, sensor, otomasi, dan karya
            pengguna ArduFlow.
          </p>

        </div>


        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div className="all-projects-toolbar">


          {/* SEARCH */}

          <label className="all-projects-search">

            <span className="sr-only">
              Cari proyek
            </span>

            <input
              type="search"
              id="all-projects-search"
              name="all-projects-search"
              placeholder="Cari proyek, tutorial atau panduan..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              onFocus={() => {

                setIsFilterOpen(
                  false
                );

                setIsSearchOpen(
                  true
                );

              }}
            />

            <span
              className="all-projects-search__icon"
              aria-hidden="true"
            />

          </label>


          {/* FILTER BUTTON */}

          <button
            className={
              isFilterOpen
                ? "all-projects-filter is-open"
                : "all-projects-filter"
            }
            type="button"
            aria-expanded={
              isFilterOpen
            }
            aria-controls="all-projects-filter-popup"
            onClick={() => {

              setIsSearchOpen(false);

              setIsFilterOpen(
                (isOpen) =>
                  !isOpen
              );

            }}
          >

            <span
              className="all-projects-filter__icon"
              aria-hidden="true"
            />

            <span>
              Filter
            </span>

          </button>

        </div>


        {/* =====================================================
            SEARCH MODAL
        ===================================================== */}

        {isSearchOpen && (

          <div
            className="project-search-overlay"
            onMouseDown={() =>
              setIsSearchOpen(false)
            }
            role="presentation"
          >

            <div
              className="project-search-popover"
              role="dialog"
              aria-modal="true"
              aria-label="Cari proyek"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >


              {/* SEARCH BAR */}

              <div className="project-search-popover__bar">

                <span
                  className="project-search-popover__icon"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  id="project-search-popover-input"
                  name="project-search-popover-input"
                  placeholder="Cari proyek di sini..."
                  value={searchTerm}
                  autoFocus
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key ===
                      "Escape"
                    ) {
                      setIsSearchOpen(
                        false
                      );
                    }

                  }}
                />

                <button
                  className="project-search-popover__close"
                  type="button"
                  aria-label="Tutup pencarian"
                  onClick={() =>
                    setIsSearchOpen(
                      false
                    )
                  }
                />

              </div>


              {/* SEARCH RESULTS */}

              <div className="project-search-results">

                {visibleSearchResults.length
                  ? visibleSearchResults.map(
                      (project) => (

                        <a
                          className="project-search-result"
                          href={projectDetailHref(
                            project
                          )}
                          key={project.id}
                        >

                          <img
                            src={projectImage(
                              project
                            )}
                            alt=""
                          />

                          <span className="project-search-result__content">

                            <strong>
                              {project.title}
                            </strong>

                            <span className="project-search-result__meta">

                              <span>
                                {project.category ||
                                  "Proyek"}
                              </span>

                              <i
                                aria-hidden="true"
                              />

                              <span>
                                {project.difficulty ||
                                  "Umum"}
                              </span>

                            </span>

                          </span>

                        </a>

                      )
                    )
                  : (

                    <p className="project-search-empty">

                      Tidak ada proyek yang cocok.

                    </p>

                  )}

              </div>

            </div>

          </div>

        )}


        {/* =====================================================
            FILTER POPOVER
        ===================================================== */}

        {isFilterOpen && (

          <div
            className="filter-popover"
            id="all-projects-filter-popup"
            role="dialog"
            aria-label="Filter Proyek"
          >

            <div className="filter-popover__inner">


              {/* HEADER */}

              <div className="filter-popover__header">

                <div>

                  <span className="filter-popover__eyebrow">
                    FILTER
                  </span>

                  <h2>
                    Filter Proyek
                  </h2>

                </div>

                <button
                  className="filter-popover__close"
                  type="button"
                  aria-label="Tutup filter"
                  onClick={() =>
                    setIsFilterOpen(
                      false
                    )
                  }
                />

              </div>


              <div className="filter-popover__divider" />


              {/* PROJECT TYPE */}

              <div className="filter-popover__group">

                <h3>
                  Jenis Proyek
                </h3>

                <div className="filter-chip-list">

                  {projectTypeFilters.map(
                    (filter) => (

                      <button
                        className={
                          activeTypeFilter ===
                          filter
                            ? "filter-chip filter-chip--active"
                            : "filter-chip"
                        }
                        type="button"
                        key={filter}
                        aria-pressed={
                          activeTypeFilter ===
                          filter
                        }
                        onClick={() =>
                          setActiveTypeFilter(
                            filter
                          )
                        }
                      >

                        {filter}

                      </button>

                    )
                  )}

                </div>

              </div>


              <div className="filter-popover__divider" />


              {/* DIFFICULTY */}

              <div
                className="
                  filter-popover__group
                  filter-popover__group--difficulty
                "
              >

                <h3>
                  Tingkat Kesulitan
                </h3>

                <div
                  className="
                    filter-chip-list
                    filter-chip-list--single
                  "
                >

                  {difficultyFilters.map(
                    (filter) => (

                      <button
                        className={
                          activeDifficulty ===
                          filter
                            ? "filter-chip filter-chip--active"
                            : "filter-chip"
                        }
                        type="button"
                        key={filter}
                        aria-pressed={
                          activeDifficulty ===
                          filter
                        }
                        onClick={() =>
                          setActiveDifficulty(
                            filter
                          )
                        }
                      >

                        {filter}

                      </button>

                    )
                  )}

                </div>

              </div>


              <div className="filter-popover__divider" />


              {/* FILTER ACTION */}

              <div className="filter-popover__actions">

                <button
                  type="button"
                  className="filter-popover__reset"
                  onClick={resetFilters}
                >
                  Reset Filter
                </button>

                <button
                  type="button"
                  className="filter-popover__apply"
                  onClick={() =>
                    setIsFilterOpen(
                      false
                    )
                  }
                >
                  Terapkan
                </button>

              </div>

            </div>

          </div>

        )}


        {/* =====================================================
            CATEGORY
        ===================================================== */}

        <div
          className="all-projects-tabs"
          aria-label="Filter proyek"
        >

          {categoryFilters.map(
            (filter) => (

              <button
                className={
                  activeCategory ===
                  filter
                    ? "all-projects-tab all-projects-tab--active"
                    : "all-projects-tab"
                }
                type="button"
                key={filter}
                aria-pressed={
                  activeCategory ===
                  filter
                }
                onClick={() =>
                  setActiveCategory(
                    filter
                  )
                }
              >

                {filter}

              </button>

            )
          )}

        </div>


        {/* =====================================================
            RESULT INFO
        ===================================================== */}

        <div className="all-projects-result-info">

          <span>
            Menampilkan{" "}
            <strong>
              {visibleProjects.length}
            </strong>{" "}
            proyek
          </span>

          {(activeCategory !== "Semua" ||
            activeTypeFilter !== "Semua" ||
            activeDifficulty !== "Semua" ||
            searchTerm) && (

            <button
              type="button"
              onClick={() => {

                resetFilters();
                setSearchTerm("");

              }}
            >
              Hapus semua filter
            </button>

          )}

        </div>


        {/* =====================================================
            PROJECT GRID
        ===================================================== */}

        <div className="all-projects-grid">

          {visibleProjects.length
            ? visibleProjects.map(
                (project) => (

                  <article
                    className="all-project-card"
                    key={project.id}
                  >


                    {/* IMAGE */}

                    <a
                      href={projectDetailHref(
                        project
                      )}
                      className="all-project-card__media"
                      aria-label={`Lihat ${project.title}`}
                    >

                      <img
                        src={projectImage(
                          project
                        )}
                        alt=""
                        className="all-project-card__image"
                        loading="lazy"
                      />

                    </a>


                    {/* BODY */}

                    <div className="all-project-card__body">


                      <span className="all-project-card__category">

                        {project.category ||
                          "Proyek"}

                      </span>


                      <h2>

                        {project.title}

                      </h2>


                      {project.difficulty && (

                        <span className="all-project-card__difficulty">

                          {project.difficulty}

                        </span>

                      )}


                      <p>

                        {projectSummary(
                          project.description
                        ) ||
                          "Eksplorasi proyek IoT dengan ArduFlow."}

                      </p>


                      <a
                        href={projectDetailHref(
                          project
                        )}
                        className="all-project-card__link"
                      >

                        Lihat Detail Proyek

                        <span
                          aria-hidden="true"
                        >
                          →
                        </span>

                      </a>

                    </div>

                  </article>

                )
              )
            : (

              <EmptyProjects
                loading={loading}
              />

            )}

        </div>

      </div>

    </section>
  );
}


export default ProjectAll;