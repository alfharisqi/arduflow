import { useEffect, useMemo, useState } from "react";

import projectHeroImage from "../assets/images/project-hero-reference.png";
<<<<<<< HEAD
import arrowRightIcon from "../assets/icons/icon-arrow-right-1.svg";
import { useEffect, useMemo } from "react";
import { getProjectApiUrl } from "../services/projectApiConfig.js";
import { resolveProjectImageUrl } from "../services/projectImageUrl.js";

const metrics = [
  { value: "12+", label: "Proyek" },
  { value: "35+", label: "Dokumentasi" },
  { value: "8+", label: "Kolaborasi" },
  { value: "100+", label: "Pengguna" },
];

const featuredProjects = [
  {
    title: "LED Sederhana",
    category: "Proyek Pemula",
    image: featuredLedImage,
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Sensor Suhu DHT22",
    category: "Sensor",
    image: featuredDht22Image,
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Monitoring IoT ESP32",
    category: "Esp32",
    image: featuredEsp32Image,
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
];

const projectFilters = [
  "Semua",
  "Proyek Pemula",
  "IoT",
  "Otomasi",
  "Arduino",
  "Esp 32",
];

const projectLibrary = [
  {
    title: "LED Sederhana",
    image: allProjectLedImage,
    category: "Proyek Pemula",
    tags: ["Proyek Pemula", "Arduino"],
  },
  {
    title: "Sensor Suhu DHT22",
    image: allProjectDht22Image,
    category: "Sensor",
    tags: ["IoT", "Arduino"],
  },
  {
    title: "Monitoring IoT ESP32",
    image: allProjectEsp32Image,
    category: "Esp32",
    tags: ["IoT", "Esp 32"],
  },
  {
    title: "Lampu Otomatis dengan LDR",
    image: allProjectLdrImage,
    category: "Proyek Pemula",
    tags: ["Proyek Pemula", "Otomasi", "Arduino"],
  },
  {
    title: "Alarm Pendeteksi Gerakan",
    image: allProjectMotionImage,
    category: "Sensor",
    tags: ["IoT", "Otomasi"],
  },
  {
    title: "Monitoring Kelembapan Tanah",
    image: allProjectSoilImage,
    category: "Monitoring IoT",
    tags: ["IoT", "Otomasi", "Esp 32"],
  },
];

const projectFallbackImages = [
  allProjectLedImage,
  allProjectDht22Image,
  allProjectEsp32Image,
  allProjectLdrImage,
  allProjectMotionImage,
  allProjectSoilImage,
];

function stripProjectText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProjectTags(project) {
  const rawTags = Array.isArray(project?.tags)
    ? project.tags
    : String(project?.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
  const category = project?.category || project?.kategori || "";
  const difficulty = project?.difficulty || project?.level || "";
  const language = project?.programmingLanguage || project?.programming_language || "";
  const tags = new Set([...rawTags, category, difficulty, language].filter(Boolean));
  const text = [...tags].join(" ").toLowerCase();

  if (text.includes("iot")) tags.add("IoT");
  if (text.includes("esp")) tags.add("Esp 32");
  if (text.includes("arduino")) tags.add("Arduino");
  if (text.includes("otomasi") || text.includes("otomatis")) tags.add("Otomasi");
  if (text.includes("pemula")) tags.add("Proyek Pemula");

  return [...tags];
}

function normalizeUploadedProject(project, index = 0) {
  const title = project?.title || project?.judul || project?.name || "Proyek Tanpa Judul";
  const category =
    project?.category ||
    project?.kategori ||
    project?.difficulty ||
    project?.level ||
    "Proyek Pemula";
  const fallbackImage = projectFallbackImages[index % projectFallbackImages.length];

  return {
    id: project?.id || project?.slug || title,
    title,
    category,
    image: resolveProjectImageUrl(project, fallbackImage),
    tags: normalizeProjectTags(project),
    description:
      stripProjectText(project?.description || project?.deskripsi).slice(0, 120) ||
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  };
}

function isPublicProject(project) {
  const status = String(project?.status || project?.visibility || "").toLowerCase();

  return !status || (!status.includes("draft") && !status.includes("archive"));
}

function getProjectDetailHref(project) {
  return project?.id ? `/project/detail?id=${encodeURIComponent(project.id)}` : "/project/detail";
}

function useUploadedProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadProjects() {
      try {
        const response = await fetch(getProjectApiUrl());
        if (!response.ok) return;

        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : payload?.data || payload?.projects || payload?.items || [];

        if (!ignore && Array.isArray(list)) {
          setProjects(list.filter(isPublicProject).map(normalizeUploadedProject));
        }
      } catch {
        if (!ignore) setProjects([]);
      }
    }

    loadProjects();

    return () => {
      ignore = true;
    };
  }, []);

  return projects;
}

const contentCollections = [
  {
    eyebrow: "Karya Pengguna",
    title: "Sistem Lampu Otomatis",
    metadata: "oleh SMKN 2 Banyuwangi",
    href: "/project",
  },
  {
    eyebrow: "Dokumentasi Kegiatan",
    title: "Workshop IoT di SMKN 2",
    metadata: "35 peserta - 18 Mei 2026",
    href: "/project/dokumentasi",
  },
  {
    eyebrow: "Proyek Highlight",
    title: "Monitoring Suhu Ruang Kelas",
    metadata: "ESP32 + dashboard realtime",
    href: "/project",
  },
];

const partners = [
  { label: "SMKN 1 GLAGAH", image: partnerSmknGlagahImage, featured: true },
  { label: "POLINEMA", image: partnerPolinemaImage },
  { label: "KOMUNITAS", image: partnerKomunitasImage },
  { label: "POLIWANGI", image: partnerPoliwangiImage },
  { label: "UMM", image: partnerUmmImage },
];
=======
import { fetchProjectSubmissions, isPublicProject } from "../services/projectApi.js";
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

const projectFaqs = [
  "Apakah proyek di Arduflow gratis?",
  "Apakah saya bisa mengedit proyek?",
  "Bagaimana cara membuat proyek sendiri?",
  "Apakah saya bisa menggunakan proyek untuk tugas sekolah?",
];

<<<<<<< HEAD
function ProjectAssetIcon({ src, className = "" }) {
  return <img className={className} src={src} alt="" aria-hidden="true" />;
}

function ProjectLinkArrow() {
  return (
    <ProjectAssetIcon
      src={arrowRightIcon}
      className="project-link-arrow"
    />
  );
}

function ProjectHero() {
=======
function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
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

function buildMetrics(projects) {
  const owners = new Set(projects.map((project) => project.ownerName).filter(Boolean));
  const tags = new Set(projects.flatMap((project) => project.tags || []));
  const tools = new Set(projects.flatMap((project) => (project.tools || []).map(toolLabel)).filter(Boolean));

  return [
    { value: formatNumber(projects.length), label: "Proyek" },
    { value: formatNumber(tags.size), label: "Kategori" },
    { value: formatNumber(tools.size), label: "Komponen" },
    { value: formatNumber(owners.size), label: "Pengguna" },
  ];
}

function EmptyProjects({ loading, message }) {
  return (
    <p className="admin-empty-state admin-empty-state--wide">
      {loading ? "Memuat proyek dari database..." : message}
    </p>
  );
}

function ProjectHero({ metrics }) {
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  return (
    <section className="project-hero" aria-labelledby="project-title">
      <div className="project-hero__inner">
        <div className="project-hero__content">
          <p className="project-hero__eyebrow">PROYEK &amp; GALERI</p>
          <h1 id="project-title" className="project-hero__title">
            <span>PROYEK &amp; GALERI</span>
            <strong>ARDUFLOW</strong>
          </h1>
          <p className="project-hero__description">
            Lihat contoh proyek, karya pengguna, dokumentasi kegiatan, dan
            kolaborasi yang menunjukkan bagaimana Arduflow digunakan untuk
            belajar dan membangun solusi IoT nyata.
          </p>
          <div className="project-hero__actions">
            <a className="button button--primary" href="#proyek">Lihat Proyek</a>
            <a className="button button--secondary" href="/project/dokumentasi">Dokumentasi Kegiatan</a>
          </div>
        </div>
        <div className="project-hero__visual" aria-hidden="true">
          <img src={projectHeroImage} alt="" width="1440" height="513" />
        </div>
        <div className="key-metrics" aria-label="Ringkasan metrik proyek">
          <div className="key-metrics__inner">
            {metrics.map((metric, index) => (
              <div className="metric-group" key={metric.label}>
                <div className="metric">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
                {index < metrics.length - 1 && <span className="metric-divider" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

<<<<<<< HEAD
function FeaturedProjects({ projects = featuredProjects }) {
  const visibleProjects = projects.length ? projects.slice(0, 3) : featuredProjects;

=======
function FeaturedProjects({ projects, loading }) {
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  return (
    <section id="proyek" className="featured-projects" aria-labelledby="featured-projects-title">
      <div className="featured-projects__inner">
        <div className="featured-projects__header">
          <div>
            <p className="section-eyebrow">DATABASE PROJECTS</p>
            <h2 id="featured-projects-title">Proyek Pilihan</h2>
          </div>
          <a className="featured-projects__all" href="/project/semua">
            Lihat semua Proyek <ProjectLinkArrow />
          </a>
        </div>
        <div className="featured-projects__grid">
<<<<<<< HEAD
          {visibleProjects.map((project) => (
            <article className="featured-card" key={project.title}>
              <img src={project.image} alt="" className="featured-card__image" />
              <div className="featured-card__body">
                <h3>{project.title}</h3>
                <span className="featured-card__category">{project.category}</span>
                <p>{project.description}</p>
                <a href={getProjectDetailHref(project)}>
                  Lihat Detail Proyek <ProjectLinkArrow />
=======
          {projects.length ? projects.map((project) => (
            <article className="featured-card" key={project.id}>
              <img src={projectImage(project)} alt="" className="featured-card__image" />
              <div className="featured-card__body">
                <h3>{project.title}</h3>
                <span className="featured-card__category">{project.category}</span>
                <p>{projectSummary(project.description)}</p>
                <a href={projectDetailHref(project)}>
                  Lihat Detail Proyek <span aria-hidden="true">-&gt;</span>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                </a>
              </div>
            </article>
          )) : (
            <EmptyProjects loading={loading} message="Belum ada proyek publish di database." />
          )}
        </div>
      </div>
    </section>
  );
}

<<<<<<< HEAD
function ProjectLibrary({ projects = projectLibrary }) {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const sourceProjects = projects.length ? projects : projectLibrary;
  const filteredProjects =
    activeFilter === "Semua"
      ? sourceProjects
      : sourceProjects.filter((project) => project.tags.includes(activeFilter));
=======
function ProjectLibrary({ projects, loading }) {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const projectFilters = useMemo(() => {
    const values = projects.flatMap((project) => project.tags || [project.category]).filter(Boolean);
    return ["Semua", ...Array.from(new Set(values)).slice(0, 7)];
  }, [projects]);
  const filteredProjects = activeFilter === "Semua"
    ? projects
    : projects.filter((project) => project.tags.includes(activeFilter));
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

  return (
    <section className="project-library" aria-labelledby="project-library-title">
      <div className="project-library__inner">
        <div className="project-library__title">
          <p className="section-eyebrow">EXPLORE</p>
          <h2 id="project-library-title">Semua Proyek</h2>
        </div>
        <div className="project-library__filters" aria-label="Filter proyek">
          {projectFilters.map((filter) => (
            <button
              className={activeFilter === filter ? "filter-pill active" : "filter-pill"}
              type="button"
              aria-pressed={activeFilter === filter}
              key={filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="project-library__grid">
          {filteredProjects.length ? filteredProjects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card__media">
                <img src={projectImage(project)} alt="" />
              </div>
              <div className="project-card__body">
                <h3>{project.title}</h3>
                <span className="project-card__category">{project.category}</span>
<<<<<<< HEAD
                <p>
                  Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan
                  insight implementasi.
                </p>
                <a href={getProjectDetailHref(project)}>
                  Lihat Detail Proyek <ProjectLinkArrow />
=======
                <p>{projectSummary(project.description)}</p>
                <a href={projectDetailHref(project)}>
                  Lihat Detail Proyek <span aria-hidden="true">-&gt;</span>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                </a>
              </div>
            </article>
          )) : (
            <EmptyProjects loading={loading} message="Belum ada proyek sesuai filter." />
          )}
        </div>
        <a className="load-more" href="/project/semua">Muat Lebih Banyak</a>
      </div>
    </section>
  );
}

function ContentCollections({ projects }) {
  const collections = projects.slice(0, 3).map((project) => ({
    eyebrow: "Karya Pengguna",
    title: project.title,
    metadata: `oleh ${project.ownerName}`,
    href: projectDetailHref(project),
  }));

  if (!collections.length) return null;

  return (
    <section id="dokumentasi" className="content-collections" aria-label="Koleksi konten">
      <div className="content-collections__inner">
        {collections.map((collection) => (
          <article className="collection-card" key={collection.title}>
            <p>{collection.eyebrow}</p>
            <h3>{collection.title}</h3>
            <span>{collection.metadata}</span>
            <a href={collection.href}>
              Lihat Selengkapnya <ProjectLinkArrow />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectFaq() {
  return (
    <section className="project-faq" aria-labelledby="project-faq-title">
      <div className="project-faq__inner">
        <div className="project-faq__heading">
          <p>FAQ</p>
          <h2 id="project-faq-title">Pertanyaan yang Sering Diajukan</h2>
        </div>
        <div className="project-faq__grid">
          {projectFaqs.map((question) => (
            <button className="project-faq__item" type="button" key={question}>
              <span>{question}</span>
              <strong aria-hidden="true">+</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="final-cta__surface">
        <div>
          <h2 id="final-cta-title">SIAP MEMBUAT PROYEK IoT PERTAMAMU?</h2>
          <p>Mulai dari template, eksplorasi proyek komunitas, lalu bangun solusi versimu sendiri.</p>
        </div>
        <a className="final-cta__button" href="/signup">Daftar Akses</a>
      </div>
    </section>
  );
}

export function Project() {
<<<<<<< HEAD
  const uploadedProjects = useUploadedProjects();
  const featuredItems = useMemo(
    () => (uploadedProjects.length ? uploadedProjects : featuredProjects),
    [uploadedProjects],
  );
  const libraryItems = useMemo(
    () => (uploadedProjects.length ? uploadedProjects : projectLibrary),
    [uploadedProjects],
  );

  return (
    <>
      <ProjectHero />
      <FeaturedProjects projects={featuredItems} />
      <ProjectLibrary projects={libraryItems} />
      <ContentCollections />
      <CommunityPartners />
=======
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

  const latestProjects = projects.slice(0, 6);
  const featuredProjects = projects.slice(0, 3);
  const metrics = buildMetrics(projects);

  return (
    <>
      <ProjectHero metrics={metrics} />
      <FeaturedProjects projects={featuredProjects} loading={loading} />
      <ProjectLibrary projects={latestProjects} loading={loading} />
      <ContentCollections projects={projects} />
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
      <ProjectFaq />
      <FinalCta />
    </>
  );
}

export default Project;
