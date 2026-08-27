import projectLedImage from "../assets/images/all-project-led.png";
import arduinoImage from "../assets/images/Mengenal Board Arduino UNO.jpg";
import breadboardImage from "../assets/images/featured-led.png";
import ledImage from "../assets/images/library-led.png";
import resistorImage from "../assets/images/Kontrol Relay dengan Arduflow.jpg";
import jumperImage from "../assets/images/library-esp32.png";
import usbImage from "../assets/images/featured-esp32.png";
import monitorIcon from "../assets/icons/icon-monitor-1.svg";
import cpuIcon from "../assets/icons/icon-cpu-1.svg";
import zapIcon from "../assets/icons/icon-zap-1.svg";
import workflowIcon from "../assets/icons/icon-workflow-1.svg";
import clockIcon from "../assets/icons/icon-clock-1.svg";
import { useEffect, useMemo, useState } from "react";
import { getProjectApiUrl } from "../services/projectApiConfig.js";
import { resolveProjectImageUrl } from "../services/projectImageUrl.js";

const componentItems = [
  { name: "Arduino Uno", quantity: "1", image: arduinoImage },
  { name: "Breadboard", quantity: "1", image: breadboardImage },
  { name: "LED", quantity: "1", image: ledImage },
  { name: "Resistor", quantity: "1", image: resistorImage },
  { name: "Kabel Jumper", quantity: "2", image: jumperImage },
  { name: "Kabel USB", quantity: "1", image: usbImage },
];

const nodeItems = [
  {
    name: "Digital Out",
    description: "Mengontrol pin digital Arduino dalam kondisi HIGH atau LOW.",
    icon: zapIcon,
    tone: "red",
  },
  {
    name: "Boolean Value",
    description: "Memberikan nilai TRUE atau FALSE sebagai kondisi output.",
    icon: workflowIcon,
    tone: "green",
  },
  {
    name: "Delay",
    description: "Memberikan jeda waktu sebelum proses selanjutnya dijalankan.",
    icon: clockIcon,
    tone: "red",
  },
  {
    name: "Timer",
    description: "Mengulangi perubahan kondisi berdasarkan interval waktu tertentu.",
    icon: clockIcon,
    tone: "green",
  },
];

const steps = [
  {
    title: "Siapkan komponen",
    body: "Siapkan Arduino Uno, breadboard, LED, resistor 220Î©, kabel jumper, dan kabel USB.",
  },
  {
    title: "Susun rangkaian",
    body: "Pasang LED dan resistor pada breadboard, lalu hubungkan ke pin digital 8 dan GND Arduino.",
  },
  {
    title: "Buka ArduFlow IDE",
    body: "Masuk ke ArduFlow IDE dan buat proyek baru dengan nama â€œLED Sederhanaâ€.",
  },
  {
    title: "Tambahkan Node",
    body: "Tambahkan node Timer, Boolean Value, Delay, dan Digital Out ke dalam workspace.",
  },
  {
    title: "Atur Konfigurasi",
    body: "Atur Digital Out pada pin 8 dan Delay sebesar 1000 milidetik.",
  },
  {
    title: "Hubungkan Node",
    body: "Susun koneksi node sesuai alur program agar LED dapat menyala dan mati secara berulang.",
  },
  {
    title: "Jalankan Proyek",
    body: "Generate dan upload program ke Arduino, lalu periksa hasil rangkaian.",
  },
];

function stripProjectText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProjectDetail(project) {
  if (!project) return null;

  const title = project.title || project.judul || project.name || "LED Sederhana dengan Arduino";

  return {
    id: project.id || project.slug || title,
    title,
    category: project.category || project.kategori || project.difficulty || "Proyek Pemula",
    platform: project.programmingLanguage || project.programming_language || "Arduino",
    difficulty: project.difficulty || project.level || "Pemula",
    description:
      stripProjectText(project.description || project.deskripsi) ||
      "Pelajari cara menyalakan dan mematikan LED menggunakan node visual di ArduFlow IDE tanpa harus menulis kode secara manual tinggal tarik-tarik saja",
    image: resolveProjectImageUrl(project, projectLedImage),
  };
}

function NodePreview() {
  return (
    <div className="detail-node-preview" aria-label="Preview rangkaian node ArduFlow">
      <div className="preview-wire preview-wire--one" aria-hidden="true" />
      <div className="preview-wire preview-wire--two" aria-hidden="true" />
      <div className="preview-node preview-node--timer">
        <span>TIMER</span>
        <strong>Count Up</strong>
        <small>0:00</small>
      </div>
      <div className="preview-node preview-node--boolean">
        <span>BOOLEAN VALUE</span>
        <strong>1 / TRUE</strong>
      </div>
      <div className="preview-node preview-node--digital">
        <span>DIGITAL OUT</span>
        <strong>13</strong>
      </div>
      <div className="preview-node preview-node--delay">
        <span>DELAY</span>
        <strong>1000</strong>
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const [apiProject, setApiProject] = useState(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams(window.location.search);
    const selectedId = params.get("id");

    async function loadProject() {
      try {
        const response = await fetch(getProjectApiUrl());
        if (!response.ok) return;

        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : payload?.data || payload?.projects || payload?.items || [];
        const match =
          Array.isArray(list) &&
          (selectedId
            ? list.find((project) => String(project.id || project.slug) === selectedId)
            : list[0]);

        if (!ignore) setApiProject(normalizeProjectDetail(match));
      } catch {
        if (!ignore) setApiProject(null);
      }
    }

    loadProject();

    return () => {
      ignore = true;
    };
  }, []);

  const project = useMemo(
    () =>
      apiProject || {
        title: "LED Sederhana dengan Arduino",
        category: "Proyek Pemula",
        platform: "Arduino",
        difficulty: "Pemula",
        description:
          "Pelajari cara menyalakan dan mematikan LED menggunakan node visual di ArduFlow IDE tanpa harus menulis kode secara manual tinggal tarik-tarik saja",
        image: projectLedImage,
      },
    [apiProject],
  );

  return (
    <section className="project-detail" aria-labelledby="project-detail-title">
      <div className="project-detail__content">
        <div className="project-detail__hero">
          <img
            className="project-detail__image"
            src={project.image}
            alt="Rangkaian LED sederhana dengan Arduino"
          />

          <div className="project-detail__summary">
            <div className="project-detail__tags" aria-label="Kategori proyek">
              <span>{project.category}</span>
              <span>{project.platform}</span>
            </div>

            <h1 id="project-detail-title">{project.title}</h1>
            <p>{project.description}</p>

            <div className="project-detail__stats" aria-label="Ringkasan proyek">
              <div>
                <img src={monitorIcon} alt="" aria-hidden="true" />
                <span>
                  <strong>Tingkat</strong>
                  {project.difficulty}
                </span>
              </div>
              <div>
                <img src={cpuIcon} alt="" aria-hidden="true" />
                <span>
                  <strong>Jumlah Node</strong>4 Node
                </span>
              </div>
              <div>
                <img src={cpuIcon} alt="" aria-hidden="true" />
                <span>
                  <strong>Platform</strong>
                  {project.platform}
                </span>
              </div>
            </div>

            <div className="project-detail__actions">
              <a className="project-detail__button project-detail__button--primary" href="/ide">
                Buka ArduFlow IDE
              </a>
              <a className="project-detail__button project-detail__button--secondary" href="#rangkaian">
                Lihat Rangkaian
              </a>
            </div>
          </div>
        </div>

        <div className="project-detail__info">
          <section className="detail-card detail-components" aria-labelledby="components-title">
            <h2 id="components-title">Alat dan Komponen</h2>
            <ul>
              {componentItems.map((item) => (
                <li key={item.name}>
                  <img src={item.image} alt="" aria-hidden="true" />
                  <span>{item.name}</span>
                  <strong>{item.quantity}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="rangkaian"
            className="detail-card detail-nodes"
            aria-labelledby="nodes-title"
          >
            <h2 id="nodes-title">Node ArduFlow yang Digunakan</h2>
            <ul>
              {nodeItems.map((item) => (
                <li key={item.name}>
                  <span className={`detail-node-icon detail-node-icon--${item.tone}`}>
                    <img src={item.icon} alt="" aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    {item.description}
                  </span>
                </li>
              ))}
            </ul>
            <NodePreview />
          </section>
        </div>
      </div>

      <section className="detail-steps" aria-labelledby="steps-title">
        <h2 id="steps-title">Langkah Pengerjaan</h2>
        <div className="detail-steps__grid">
          {steps.map((step, index) => (
            <article className="detail-step" key={step.title}>
              <strong>{index + 1}</strong>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
