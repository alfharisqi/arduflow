import { useEffect, useMemo, useState } from "react";
import projectHeroImage from "../assets/images/project-hero-reference.png";
import { fetchProjectSubmissions, isPublicProject } from "../services/projectApi.js";

const difficultyFilters = ["Semua", "Pemula", "Menengah", "Lanjutan"];

function normalizeFilter(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function projectDetailHref(project) {
  return `/project/detail?id=${encodeURIComponent(project.id)}`;
}

function stripHtml(value) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = String(value || "");
  return wrapper.textContent || wrapper.innerText || "";
}

function projectSummary(value) {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

function projectImage(project) {
  return project.coverImageUrl || projectHeroImage;
}

function toolLabel(tool) {
  return String(tool?.name || tool?.title || tool || "").trim();
}

function projectMatchesType(project, filter) {
  if (filter === "Semua") return true;
  const normalized = normalizeFilter(filter);

  return [project.category, ...(project.tags || [])].some(
    (value) => normalizeFilter(value) === normalized,
  );
}

function projectMatchesDifficulty(project, filter) {
  return filter === "Semua" || normalizeFilter(project.difficulty) === normalizeFilter(filter);
}

function projectMatchesSearch(project, searchTerm) {
  const keyword = searchTerm.trim().toLowerCase();
  if (!keyword) return true;

  return [
    project.title,
    project.category,
    projectSummary(project.description),
    project.difficulty,
    ...(project.tags || []),
    ...(project.tools || []).map(toolLabel),
  ].join(" ").toLowerCase().includes(keyword);
}

function EmptyProjects({ loading }) {
  return (
    <p className="admin-empty-state admin-empty-state--wide">
      {loading ? "Memuat proyek dari database..." : "Belum ada proyek publish sesuai filter."}
    </p>
  );
}

export function ProjectAll() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeTypeFilter, setActiveTypeFilter] = useState("Semua");
  const [activeDifficulty, setActiveDifficulty] = useState("Semua");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchProjectSubmissions()
      .then((items) => {
        if (isMounted) setProjects(items.filter(isPublicProject));
      })
      .catch((error) => {
        console.error("Gagal memuat project submissions:", error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryFilters = useMemo(() => {
    const values = projects.flatMap((project) => [project.category, ...(project.tags || [])]).filter(Boolean);
    return ["Semua", ...Array.from(new Set(values)).slice(0, 6)];
  }, [projects]);
  const projectTypeFilters = useMemo(() => {
    const values = projects.flatMap((project) => [project.category, ...(project.tags || [])]).filter(Boolean);
    return ["Semua", ...Array.from(new Set(values)).slice(0, 10)];
  }, [projects]);
  const visibleProjects = projects.filter(
    (project) =>
      projectMatchesType(project, activeCategory) &&
      projectMatchesType(project, activeTypeFilter) &&
      projectMatchesDifficulty(project, activeDifficulty) &&
      projectMatchesSearch(project, searchTerm),
  );
  const visibleSearchResults = projects
    .filter((project) => projectMatchesSearch(project, searchTerm))
    .slice(0, 6);

  return (
    <section className="all-projects-page" aria-labelledby="all-projects-title">
      <div className="all-projects-page__inner">
        <div className="all-projects-page__heading">
          <p className="section-eyebrow">DATABASE PROJECTS</p>
          <h1 id="all-projects-title">Semua Proyek Pilihan</h1>
        </div>

        <div className="all-projects-toolbar">
          <label className="all-projects-search">
            <span className="sr-only">Cari proyek</span>
            <input
              type="search"
              id="all-projects-search"
              name="all-projects-search"
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
          <div className="project-search-overlay" onMouseDown={() => setIsSearchOpen(false)} role="presentation">
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
                  id="project-search-popover-input"
                  name="project-search-popover-input"
                  placeholder="Cari Proyek disini..."
                  value={searchTerm}
                  autoFocus
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsSearchOpen(false);
                  }}
                />
              </div>

              <div className="project-search-results">
                {visibleSearchResults.length ? visibleSearchResults.map((project) => (
                  <a className="project-search-result" href={projectDetailHref(project)} key={project.id}>
                    <img src={projectImage(project)} alt="" />
                    <span className="project-search-result__content">
                      <strong>{project.title}</strong>
                      <span className="project-search-result__meta">
                        <span>{project.category}</span>
                        <i aria-hidden="true" />
                        <span>{project.difficulty}</span>
                      </span>
                    </span>
                  </a>
                )) : (
                  <p className="admin-empty-state">Tidak ada proyek yang cocok.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isFilterOpen && (
          <div className="filter-popover" id="all-projects-filter-popup" role="dialog" aria-label="Filter Proyek">
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
                      className={activeTypeFilter === filter ? "filter-chip filter-chip--active" : "filter-chip"}
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
                      className={activeDifficulty === filter ? "filter-chip filter-chip--active" : "filter-chip"}
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
          {categoryFilters.map((filter) => (
            <button
              className={activeCategory === filter ? "all-projects-tab all-projects-tab--active" : "all-projects-tab"}
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
          {visibleProjects.length ? visibleProjects.map((project) => (
            <article className="all-project-card" key={project.id}>
              <img src={projectImage(project)} alt="" className="all-project-card__image" />
              <div className="all-project-card__body">
                <h2>{project.title}</h2>
                <span className="all-project-card__category">{project.category}</span>
                <p>{projectSummary(project.description)}</p>
                <a href={projectDetailHref(project)}>
                  Lihat Detail Proyek <span aria-hidden="true">-&gt;</span>
                </a>
              </div>
            </article>
          )) : (
            <EmptyProjects loading={loading} />
          )}
        </div>
      </div>
    </section>
  );
}

export default ProjectAll;
