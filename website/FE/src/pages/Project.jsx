import { useState } from "react";

import featuredLedImage from "../assets/images/featured-led.png";
import featuredDht22Image from "../assets/images/featured-dht22.png";
import featuredEsp32Image from "../assets/images/featured-esp32.png";
import allProjectLedImage from "../assets/images/all-project-led.png";
import allProjectDht22Image from "../assets/images/all-project-dht22.png";
import allProjectEsp32Image from "../assets/images/all-project-esp32.png";
import allProjectLdrImage from "../assets/images/all-project-ldr.png";
import allProjectMotionImage from "../assets/images/all-project-motion.png";
import allProjectSoilImage from "../assets/images/all-project-soil.png";
import partnerKomunitasImage from "../assets/images/partner-komunitas.png";
import partnerPolinemaImage from "../assets/images/partner-polinema.png";
import partnerPoliwangiImage from "../assets/images/partner-poliwangi.png";
import partnerSmknGlagahImage from "../assets/images/partner-smkn-glagah.png";
import partnerUmmImage from "../assets/images/partner-umm.png";
import projectHeroImage from "../assets/images/project-hero-reference.png";

const metrics = [
  { value: "12+", label: "Proyek" },
  { value: "35+", label: "Dokumentasi" },
  { value: "8+", label: "Kolaborasi" },
  { value: "100+", label: "Pengguna" },
];

const featuredProjects = [
  {
    title: "LED Sederhana",
    image: featuredLedImage,
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Sensor Suhu DHT22",
    image: featuredDht22Image,
    description:
      "Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan insight implementasi.",
  },
  {
    title: "Monitoring IoT ESP32",
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
    href: "/project",
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

const projectFaqs = [
  "Apakah proyek di Arduflow gratis?",
  "Apakah saya bisa mengedit proyek?",
  "Bagaimana cara membuat proyek sendiri?",
  "Apakah saya bisa menggunakan proyek untuk tugas sekolah?",
];

function ProjectHero() {
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
            <a className="button button--primary" href="#proyek">
              Lihat Proyek
            </a>
            <a className="button button--secondary" href="#dokumentasi">
              Dokumentasi Kegiatan
            </a>
          </div>
        </div>

        <div className="project-hero__visual" aria-hidden="true">
          <img
            src={projectHeroImage}
            alt=""
            width="1440"
            height="513"
          />
        </div>

        <div className="key-metrics" aria-label="Ringkasan metrik proyek">
          <div className="key-metrics__inner">
            {metrics.map((metric, index) => (
              <div className="metric-group" key={metric.label}>
                <div className="metric">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
                {index < metrics.length - 1 && (
                  <span className="metric-divider" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedProjects() {
  return (
    <section
      id="proyek"
      className="featured-projects"
      aria-labelledby="featured-projects-title"
    >
      <div className="featured-projects__inner">
        <div className="featured-projects__header">
          <div>
            <p className="section-eyebrow">CURATED WORK</p>
            <h2 id="featured-projects-title">Proyek Pilihan</h2>
          </div>
          <a className="featured-projects__all" href="/project/semua">
            Lihat semua Proyek <span aria-hidden="true">-&gt;</span>
          </a>
        </div>

        <div className="featured-projects__grid">
          {featuredProjects.map((project) => (
            <article className="featured-card" key={project.title}>
              <img src={project.image} alt="" className="featured-card__image" />
              <div className="featured-card__body">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <a href="/project/detail">
                  Lihat Detail Proyek <span aria-hidden="true">-&gt;</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectLibrary() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const filteredProjects =
    activeFilter === "Semua"
      ? projectLibrary
      : projectLibrary.filter((project) => project.tags.includes(activeFilter));

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
          {filteredProjects.map((project) => (
            <article className="project-card" key={project.title}>
              <div className="project-card__media">
                <img src={project.image} alt="" />
              </div>
              <div className="project-card__body">
                <h3>{project.title}</h3>
                <span className="project-card__category">{project.category}</span>
                <p>
                  Eksplorasi proyek IoT nyata dengan dokumentasi, sensor, dan
                  insight implementasi.
                </p>
                <a href="/project/detail">
                  Lihat Detail Proyek <span aria-hidden="true">-&gt;</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <a className="load-more" href="/project/semua">
          Muat Lebih Banyak
        </a>
      </div>
    </section>
  );
}

function ContentCollections() {
  return (
    <section
      id="dokumentasi"
      className="content-collections"
      aria-label="Koleksi konten"
    >
      <div className="content-collections__inner">
        {contentCollections.map((collection) => (
          <article className="collection-card" key={collection.title}>
            <p>{collection.eyebrow}</p>
            <h3>{collection.title}</h3>
            <span>{collection.metadata}</span>
            <a href={collection.href}>
              Lihat Selengkapnya <span aria-hidden="true">-&gt;</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function CommunityPartners() {
  return (
    <section className="community-partners" aria-labelledby="community-title">
      <div className="community-partners__inner">
        <div className="community-story">
          <div className="community-story__heading">
            <p className="section-eyebrow">COMMUNITY</p>
            <h2 id="community-title">Cerita dari pengguna</h2>
          </div>

          <article className="testimonial-card">
            <blockquote>
              "Arduflow membantu peserta memahami alur kerja Arduino dan IoT
              tanpa langsung terbebani coding. Visual programming sangat
              membantu."
            </blockquote>
            <strong>BUDI SANTOSO</strong>
            <span>Guru SMKN 1 Glagah</span>
          </article>
        </div>

        <div className="partner-panel" aria-labelledby="partners-title">
          <h2 id="partners-title">Partner &amp; Kolaborator</h2>
          <div className="partner-list">
            {partners.map((partner) => (
              <div className="partner-item" key={partner.label}>
                <span
                  className={partner.featured ? "partner-logo featured" : "partner-logo"}
                  aria-hidden="true"
                >
                  {partner.image && <img src={partner.image} alt="" />}
                </span>
                <p>{partner.label}</p>
              </div>
            ))}
          </div>
        </div>
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
          <p>
            Mulai dari template, eksplorasi proyek komunitas, lalu bangun
            solusi versimu sendiri.
          </p>
        </div>
        <a className="final-cta__button" href="/signup">
          Daftar Akses
        </a>
      </div>
    </section>
  );
}

export function Project() {
  return (
    <>
      <ProjectHero />
      <FeaturedProjects />
      <ProjectLibrary />
      <ContentCollections />
      <CommunityPartners />
      <ProjectFaq />
      <FinalCta />
    </>
  );
}

export default Project;
