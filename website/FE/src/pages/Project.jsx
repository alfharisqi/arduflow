import { useEffect, useMemo, useState } from "react";

import projectHeroImage from "../assets/images/landing-hero-materi.png";
import {
  fetchProjectSubmissions,
  isPublicProject,
} from "../services/projectApi.js";


/* =========================================================
   FAQ DATA
========================================================= */

const projectFaqs = [
  {
    question: "Apakah proyek di ArduFlow gratis untuk dilihat?",
    answer:
      "Ya. Proyek yang telah dipublikasikan dapat dilihat sebagai referensi belajar Arduino, IoT, visual programming, sensor, aktuator, dan berbagai implementasi perangkat menggunakan ArduFlow.",
  },
  {
    question: "Apa saja informasi yang tersedia pada sebuah proyek?",
    answer:
      "Setiap proyek dapat berisi judul, kategori, deskripsi, komponen yang digunakan, gambaran cara kerja, serta informasi lain yang membantu pengguna memahami bagaimana proyek tersebut dibuat.",
  },
  {
    question: "Apakah saya bisa membuat versi sendiri dari proyek yang tersedia?",
    answer:
      "Bisa. Proyek di halaman ArduFlow dapat digunakan sebagai referensi untuk memahami konsep dan alur kerja. Anda dapat membuat versi sendiri dengan mengganti komponen, konfigurasi pin, nilai parameter, maupun alur node sesuai kebutuhan.",
  },
  {
    question: "Bagaimana cara mulai membuat proyek di ArduFlow?",
    answer:
      "Mulailah dengan menentukan tujuan proyek, memilih board dan komponen yang diperlukan, kemudian susun node pada ArduFlow IDE. Hubungkan setiap node sesuai alur logika proyek lalu lakukan pengujian pada perangkat.",
  },
  {
    question: "Apakah proyek ArduFlow cocok untuk pemula?",
    answer:
      "Ya. Banyak proyek dapat digunakan sebagai contoh pembelajaran bertahap. Pemula dapat mulai dari proyek sederhana seperti LED, buzzer, sensor suhu, atau otomatisasi dasar sebelum melanjutkan ke proyek IoT yang lebih kompleks.",
  },
  {
    question: "Apakah proyek dapat digunakan untuk tugas sekolah atau kuliah?",
    answer:
      "Bisa. Proyek dapat digunakan sebagai referensi pembelajaran, praktikum, eksperimen, maupun pengembangan tugas sekolah dan kuliah. Anda tetap disarankan mengembangkan proyek sesuai kebutuhan tugas dan ketentuan dari pengajar.",
  },
  {
    question: "Bagaimana jika komponen yang saya gunakan berbeda dengan contoh proyek?",
    answer:
      "Anda tetap dapat menggunakan proyek sebagai referensi. Sesuaikan jenis komponen, nomor pin, nilai sensor, board, dan konfigurasi node dengan perangkat yang Anda miliki. Prinsip alur kerjanya dapat tetap digunakan selama fungsi komponennya sesuai.",
  },
  {
    question: "Apa fungsi bagian Proyek Pilihan?",
    answer:
      "Bagian Proyek Pilihan menampilkan sebagian proyek publik yang tersedia agar pengguna dapat menemukan contoh proyek dengan lebih cepat sebelum menjelajahi seluruh koleksi proyek ArduFlow.",
  },
  {
    question: "Apakah saya dapat mengembangkan proyek menjadi lebih kompleks?",
    answer:
      "Tentu. Anda dapat menambahkan sensor, aktuator, logika kondisi, timer, koneksi internet, monitoring, maupun fitur otomatisasi lainnya. Proyek sederhana dapat dijadikan fondasi untuk membangun sistem IoT yang lebih lengkap.",
  },
  {
    question: "Saya masih bingung memilih proyek untuk mulai belajar. Harus mulai dari mana?",
    answer:
      "Mulailah dari proyek dengan sedikit komponen dan alur sederhana. Setelah memahami input, proses, dan output, lanjutkan ke proyek yang menggunakan beberapa sensor, kondisi logika, otomatisasi, dan komunikasi IoT.",
  },
];


/* =========================================================
   HELPERS
========================================================= */

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
  return stripHtml(value)
    .replace(/\s+/g, " ")
    .trim();
}


function projectImage(project) {
  return project.coverImageUrl || projectHeroImage;
}


function projectTimestamp(project) {
  return new Date(
    project.updatedAt ||
    project.createdAt ||
    0
  ).getTime() || 0;
}


function sortByMostViewed(projects) {
  return [...projects].sort(
    (first, second) => {
      const viewDifference =
        (Number(second.viewer) || 0) -
        (Number(first.viewer) || 0);

      if (viewDifference !== 0) {
        return viewDifference;
      }

      return projectTimestamp(second) -
        projectTimestamp(first);
    }
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


/* =========================================================
   PROJECT LINK ARROW
   Memperbaiki error:
   ProjectLinkArrow is not defined
========================================================= */

function ProjectLinkArrow() {
  return (
    <span
      className="project-link-arrow"
      aria-hidden="true"
    >
      →
    </span>
  );
}


/* =========================================================
   METRICS
========================================================= */

function buildMetrics(projects) {
  const owners = new Set(
    projects
      .map((project) => project.ownerName)
      .filter(Boolean)
  );

  const tags = new Set(
    projects.flatMap(
      (project) => project.tags || []
    )
  );

  const tools = new Set(
    projects
      .flatMap(
        (project) =>
          (project.tools || []).map(toolLabel)
      )
      .filter(Boolean)
  );

  return [
    {
      value: formatNumber(projects.length),
      label: "Proyek",
    },
    {
      value: formatNumber(tags.size),
      label: "Kategori",
    },
    {
      value: formatNumber(tools.size),
      label: "Komponen",
    },
    {
      value: formatNumber(owners.size),
      label: "Pengguna",
    },
  ];
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyProjects({
  loading,
  message,
}) {
  return (
    <p className="admin-empty-state admin-empty-state--wide">
      {loading
        ? "Memuat proyek dari database..."
        : message}
    </p>
  );
}


/* =========================================================
   HERO
========================================================= */

function ProjectHero({
  metrics,
}) {
  return (
    <section
      className="project-hero"
      aria-labelledby="project-title"
    >
      <div className="project-hero__inner">

        <div className="project-hero__content">

          <p className="project-hero__eyebrow">
            PROYEK &amp; GALERI
          </p>

          <h1
            id="project-title"
            className="project-hero__title"
          >
            <span>
              PROYEK &amp; GALERI
            </span>

            <strong>
              ARDUFLOW
            </strong>
          </h1>

          <p className="project-hero__description">
            Lihat contoh proyek, karya pengguna,
            dokumentasi kegiatan, dan kolaborasi
            yang menunjukkan bagaimana Arduflow
            digunakan untuk belajar dan membangun
            solusi IoT nyata.
          </p>

          <div className="project-hero__actions">

            <a
              className="button button--primary"
              href="#proyek"
            >
              Lihat Proyek
            </a>

            <a
              className="button button--secondary"
              href="/project/dokumentasi"
            >
              Dokumentasi Kegiatan
            </a>

          </div>

        </div>


        <div
          className="project-hero__visual"
          aria-hidden="true"
        >
          <img
            src={projectHeroImage}
            alt=""
            width="1440"
            height="513"
          />
        </div>


        <div
          className="key-metrics"
          aria-label="Ringkasan metrik proyek"
        >

          <div className="key-metrics__inner">

            {metrics.map(
              (metric, index) => (
                <div
                  className="metric-group"
                  key={metric.label}
                >

                  <div className="metric">
                    <strong>
                      {metric.value}
                    </strong>

                    <span>
                      {metric.label}
                    </span>
                  </div>

                  {index <
                    metrics.length - 1 && (
                    <span
                      className="metric-divider"
                      aria-hidden="true"
                    />
                  )}

                </div>
              )
            )}

          </div>

        </div>

      </div>
    </section>
  );
}


/* =========================================================
   FEATURED PROJECTS
========================================================= */

function FeaturedProjects({
  projects,
  loading,
}) {
  return (
    <section
      id="proyek"
      className="featured-projects"
      aria-labelledby="featured-projects-title"
    >

      <div className="featured-projects__inner">

        <div className="featured-projects__header">

          <div>

            <p className="section-eyebrow">
              DATABASE PROJECTS
            </p>

            <h2 id="featured-projects-title">
              Proyek Pilihan
            </h2>

          </div>


          <a
            className="featured-projects__all"
            href="/project/semua"
          >
            Lihat semua Proyek
            {" "}
            <ProjectLinkArrow />
          </a>

        </div>


        <div className="featured-projects__grid">

          {projects.length ? (
            projects.map(
              (project) => (
                <article
                  className="featured-card"
                  key={project.id}
                >

                  <img
                    src={projectImage(project)}
                    alt=""
                    className="featured-card__image"
                  />


                  <div className="featured-card__body">

                    <h3>
                      {project.title}
                    </h3>

                    <span className="featured-card__category">
                      {project.category}
                    </span>

                    <p>
                      {projectSummary(
                        project.description
                      )}
                    </p>

                    <a
                      href={projectDetailHref(
                        project
                      )}
                    >
                      Lihat Detail Proyek
                      {" "}
                      <span aria-hidden="true">
                        →
                      </span>
                    </a>

                  </div>

                </article>
              )
            )
          ) : (
            <EmptyProjects
              loading={loading}
              message="Belum ada proyek publish di database."
            />
          )}

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   PROJECT LIBRARY
========================================================= */

function ProjectLibrary({
  projects,
  loading,
}) {

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("Semua");


  const projectFilters =
    useMemo(() => {

      const values =
        projects.flatMap(
          (project) => {

            if (
              Array.isArray(project.tags) &&
              project.tags.length
            ) {
              return project.tags;
            }

            return project.category
              ? [project.category]
              : [];
          }
        );

      return [
        "Semua",
        ...Array.from(
          new Set(values)
        ).slice(0, 7),
      ];

    }, [projects]);


  const filteredProjects =
    activeFilter === "Semua"
      ? projects
      : projects.filter(
          (project) => {

            const tags =
              Array.isArray(project.tags)
                ? project.tags
                : [];

            return (
              tags.includes(
                activeFilter
              ) ||
              project.category ===
                activeFilter
            );
          }
        );


  return (
    <section
      className="project-library"
      aria-labelledby="project-library-title"
    >

      <div className="project-library__inner">

        <div className="project-library__title">

          <p className="section-eyebrow">
            EXPLORE
          </p>

          <h2 id="project-library-title">
            Semua Proyek
          </h2>

        </div>


        <div
          className="project-library__filters"
          aria-label="Filter proyek"
        >

          {projectFilters.map(
            (filter) => (
              <button
                className={
                  activeFilter === filter
                    ? "filter-pill active"
                    : "filter-pill"
                }
                type="button"
                aria-pressed={
                  activeFilter ===
                  filter
                }
                key={filter}
                onClick={() =>
                  setActiveFilter(
                    filter
                  )
                }
              >
                {filter}
              </button>
            )
          )}

        </div>


        <div className="project-library__grid">

          {filteredProjects.length ? (
            filteredProjects.map(
              (project) => (
                <article
                  className="project-card"
                  key={project.id}
                >

                  <div className="project-card__media">

                    <img
                      src={projectImage(
                        project
                      )}
                      alt=""
                    />

                  </div>


                  <div className="project-card__body">

                    <h3>
                      {project.title}
                    </h3>

                    <span className="project-card__category">
                      {project.category}
                    </span>

                    <p>
                      {projectSummary(
                        project.description
                      )}
                    </p>

                    <a
                      href={projectDetailHref(
                        project
                      )}
                    >
                      Lihat Detail Proyek
                      {" "}
                      <span aria-hidden="true">
                        →
                      </span>
                    </a>

                  </div>

                </article>
              )
            )
          ) : (
            <EmptyProjects
              loading={loading}
              message="Belum ada proyek sesuai filter."
            />
          )}

        </div>


        <a
          className="load-more"
          href="/project/semua"
        >
          Muat Lebih Banyak
        </a>

      </div>

    </section>
  );
}


/* =========================================================
   POPULAR PROJECTS
========================================================= */

function PopularProjects({
  projects,
}) {

  const collections =
    sortByMostViewed(projects)
      .slice(0, 3)
      .map(
        (project) => ({
          eyebrow:
            "Proyek Paling Populer",

          title:
            project.title,

          metadata:
            `${formatNumber(project.viewer)} kali dilihat oleh user`,

          href:
            projectDetailHref(
              project
            ),
        })
      );


  if (!collections.length) {
    return null;
  }


  return (
    <section
      id="dokumentasi"
      className="content-collections"
      aria-label="Proyek paling populer"
    >

      <div className="content-collections__inner">

        {collections.map(
          (collection) => (

            <article
              className="collection-card"
              key={
                collection.title
              }
            >

              <p>
                {
                  collection.eyebrow
                }
              </p>

              <h3>
                {
                  collection.title
                }
              </h3>

              <span>
                {
                  collection.metadata
                }
              </span>

              <a
                href={
                  collection.href
                }
              >
                Lihat Selengkapnya
                {" "}
                <ProjectLinkArrow />
              </a>

            </article>

          )
        )}

      </div>

    </section>
  );
}


/* =========================================================
   FAQ ACCORDION
========================================================= */

function ProjectFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      className="project-faq"
      aria-labelledby="project-faq-title"
    >
      <div className="project-faq__inner">

        <div className="project-faq__card">

          {/* =========================
              HEADER
          ========================== */}
          <header className="project-faq__header">

            <div className="project-faq__heading-row">

              <span
                className="project-faq__star"
                aria-hidden="true"
              />

              <div>
                <p className="project-faq__eyebrow">
                  FAQ PROYEK
                </p>

                <h2
                  className="project-faq__title"
                  id="project-faq-title"
                >
                  Pertanyaan Umum
                </h2>
              </div>

            </div>

            <p className="project-faq__description">
              Temukan jawaban mengenai penggunaan proyek,
              komponen, pengembangan flow, dan cara memulai
              membuat proyek IoT menggunakan ArduFlow.
            </p>

          </header>


          {/* =========================
              FAQ LIST
          ========================== */}
          <div
            className="project-faq__list"
            aria-label="Daftar pertanyaan umum proyek ArduFlow"
          >
            {projectFaqs.map((item, index) => {
              const isOpen = openIndex === index;

              const answerId =
                `project-faq-answer-${index}`;

              const questionId =
                `project-faq-question-${index}`;

              return (
                <article
                  className={
                    `project-faq__item${
                      isOpen ? " is-open" : ""
                    }`
                  }
                  key={item.question}
                >

                  <button
                    id={questionId}
                    className="project-faq__question"
                    type="button"
                    aria-controls={answerId}
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenIndex(
                        isOpen ? -1 : index
                      )
                    }
                  >

                    <span className="project-faq__question-text">
                      {item.question}
                    </span>

                    <span
                      className="project-faq__toggle-icon"
                      aria-hidden="true"
                    />

                  </button>


                  <div
                    id={answerId}
                    className="project-faq__answer-wrap"
                    role="region"
                    aria-labelledby={questionId}
                    aria-hidden={!isOpen}
                  >
                    <div className="project-faq__answer-inner">

                      <p className="project-faq__answer">
                        {item.answer}
                      </p>

                    </div>
                  </div>

                </article>
              );
            })}
          </div>


          {/* =========================
              HELP
          ========================== */}
          <div className="project-faq__help">

            <span>
              Masih ada yang ingin ditanyakan tentang proyek?
            </span>

            <a href="/kontak">
              Hubungi Tim ArduFlow
            </a>

          </div>

        </div>

      </div>
    </section>
  );
}


/* =========================================================
   FINAL CTA
========================================================= */

function FinalCta() {
  return (
    <section
      className="final-cta"
      aria-labelledby="final-cta-title"
    >

      <div className="final-cta__surface">

        <div>

          <h2 id="final-cta-title">
            SIAP MEMBUAT PROYEK IoT PERTAMAMU?
          </h2>

          <p>
            Mulai dari template,
            eksplorasi proyek komunitas,
            lalu bangun solusi versimu
            sendiri.
          </p>

        </div>


        <a
          className="final-cta__button"
          href="/ide"
        >
          Daftar IDE
        </a>

      </div>

    </section>
  );
}


/* =========================================================
   MAIN PROJECT PAGE
========================================================= */

export function Project() {

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {

    let isMounted = true;


    fetchProjectSubmissions()

      .then(
        (items) => {

          if (!isMounted) {
            return;
          }

          const safeItems =
            Array.isArray(items)
              ? items
              : [];

          setProjects(
            safeItems.filter(
              isPublicProject
            )
          );

        }
      )

      .catch(
        (error) => {

          console.error(
            "Gagal memuat project submissions:",
            error
          );

        }
      )

      .finally(
        () => {

          if (isMounted) {
            setLoading(false);
          }

        }
      );


    return () => {
      isMounted = false;
    };

  }, []);


  const latestProjects =
    projects.slice(0, 6);

  const featuredProjects =
    projects.slice(0, 3);

  const metrics =
    buildMetrics(
      projects
    );


  return (
    <>

      <ProjectHero
        metrics={metrics}
      />


      <FeaturedProjects
        projects={
          featuredProjects
        }
        loading={
          loading
        }
      />


      <ProjectLibrary
        projects={
          latestProjects
        }
        loading={
          loading
        }
      />


      <PopularProjects
        projects={
          projects
        }
      />


      <ProjectFaq />


      <FinalCta />

    </>
  );
}


export default Project;
