import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { compressToEncodedURIComponent } from "lz-string";

import monitorIcon from "../assets/icons/icon-monitor-1.svg";
import cpuIcon from "../assets/icons/icon-cpu-1.svg";
import clockIcon from "../assets/icons/icon-clock-1.svg";
<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { getProjectApiUrl } from "../services/projectApiConfig.js";
import { resolveProjectImageUrl } from "../services/projectImageUrl.js";
=======
import fileIcon from "../assets/icons/icon-file-text-1.svg";
import {
  fetchProjectSubmission,
  fetchProjectSubmissions,
  isPublicProject,
  deleteProjectRating,
  updateProjectRating,
  updateProjectInteraction,
} from "../services/projectApi.js";
import { createTransaction, fetchTransactions } from "../services/transactionApi.js";
import { NodeSprite } from "../components/NodeSprite.jsx";
import { getProjectNodeType } from "../config/projectNodes.js";
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

function getProjectIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id") || "";
}

function sanitizeProjectHtml(value) {
  return String(value || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, "");
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

function formatCurrency(value, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem("arduflow_user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getUserId(user) {
  return user?.id ?? user?.userId ?? user?.user_id ?? null;
}

function getUserEmail(user) {
  return String(user?.email ?? user?.emailAddress ?? user?.email_address ?? "").trim();
}

function getInteractionStorageKey(projectId, type, user = getStoredUser()) {
  const userKey = getUserEmail(user) || getUserId(user) || "guest";
  return `arduflow_project_${projectId}_${type}_${userKey}`;
}

function getUserDisplayName(user) {
  return String(user?.name || user?.fullName || user?.username || getUserEmail(user) || "User").trim();
}

function getInitials(name) {
  return String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const PROJECT_REVIEW_CATEGORIES = [
  { id: "documentation", label: "Kualitas Dokumentasi" },
  { id: "easyToFollow", label: "Kemudahan Diikuti" },
  { id: "fileCompleteness", label: "Kelengkapan File" },
  { id: "resultAccuracy", label: "Kesesuaian Hasil" },
  { id: "circuitNeatness", label: "Kerapian Rangkaian" },
];

function createEmptyCategoryRatings(value = 0) {
  return PROJECT_REVIEW_CATEGORIES.reduce((result, category) => {
    result[category.id] = Number(value) || 0;
    return result;
  }, {});
}

function normalizeReviewCategories(categories = {}) {
  const source = categories && typeof categories === "object" ? categories : {};
  return PROJECT_REVIEW_CATEGORIES.reduce((result, category) => {
    result[category.id] = Math.min(5, Math.max(0, Number(source[category.id]) || 0));
    return result;
  }, {});
}

function normalizeProjectReviews(reviews = []) {
  return (Array.isArray(reviews) ? reviews : [])
    .map((review, index) => ({
      id: review?.id || review?.identity || `review-${index}`,
      identity: String(review?.identity || ""),
      value: Math.min(5, Math.max(0, Number(review?.value || review?.rating || 0))),
      message: String(review?.message || review?.comment || "").trim(),
      categories: normalizeReviewCategories(review?.categories),
      authorName: String(review?.authorName || review?.userName || review?.name || "User").trim(),
      authorEmail: String(review?.authorEmail || review?.email || "").trim(),
      createdAt: review?.createdAt || review?.created_at || null,
      updatedAt: review?.updatedAt || review?.updated_at || null,
    }))
    .filter((review) => review.value || review.message);
}

function formatCommentDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getToolName(tool) {
  return String(tool?.name || tool?.title || tool || "").trim();
}

function getToolCategory(tool) {
  return String(tool?.category || tool?.type || "Komponen").trim();
}

function getToolSpec(tool) {
  return String(
    tool?.specification ||
      tool?.quantity ||
      tool?.description ||
      tool?.spec ||
      "-"
  ).trim();
}

function getToolVisualLabel(tool) {
  return getToolName(tool).slice(0, 2).toUpperCase() || "IO";
}

const WOKWI_ELEMENT_BY_TOOL_NAME = {
  "7 segment display": "wokwi-7segment",
  "arduino mega": "wokwi-arduino-mega",
  "arduino nano": "wokwi-arduino-nano",
  "arduino uno": "wokwi-arduino-uno",
  "arduino uno r3": "wokwi-arduino-uno",
  buzzer: "wokwi-buzzer",
  dht22: "wokwi-dht22",
  "esp32 devkit": "wokwi-esp32-devkit-v1",
  "hc-sr04 ultrasonic": "wokwi-hc-sr04",
  "ir receiver": "wokwi-ir-receiver",
  "keypad 4x4": "wokwi-membrane-keypad",
  "lcd 16x2": "wokwi-lcd1602",
  led: "wokwi-led",
  "ldr photoresistor": "wokwi-photoresistor-sensor",
  "micro sd card": "wokwi-microsd-card",
  mpu6050: "wokwi-mpu6050",
  "arduino nano rp2040 connect": "wokwi-nano-rp2040-connect",
  "neopixel ring": "wokwi-led-ring",
  "oled ssd1306": "wokwi-ssd1306",
  "pir motion sensor": "wokwi-pir-motion-sensor",
  potentiometer: "wokwi-potentiometer",
  pushbutton: "wokwi-pushbutton",
  resistor: "wokwi-resistor",
  "rgb led": "wokwi-rgb-led",
  "rtc ds1307": "wokwi-ds1307",
  "servo motor": "wokwi-servo",
};

const SUPPORTED_WOKWI_ELEMENTS = new Set([
  "wokwi-7segment",
  "wokwi-arduino-mega",
  "wokwi-arduino-nano",
  "wokwi-arduino-uno",
  "wokwi-buzzer",
  "wokwi-dht22",
  "wokwi-ds1307",
  "wokwi-esp32-devkit-v1",
  "wokwi-hc-sr04",
  "wokwi-ir-receiver",
  "wokwi-lcd1602",
  "wokwi-lcd2004",
  "wokwi-led",
  "wokwi-led-ring",
  "wokwi-membrane-keypad",
  "wokwi-microsd-card",
  "wokwi-mpu6050",
  "wokwi-nano-rp2040-connect",
  "wokwi-photoresistor-sensor",
  "wokwi-pir-motion-sensor",
  "wokwi-potentiometer",
  "wokwi-pushbutton",
  "wokwi-resistor",
  "wokwi-rgb-led",
  "wokwi-servo",
  "wokwi-ssd1306",
]);

const WOKWI_ELEMENT_KEYWORD_MATCHERS = [
  [/arduino.*mega|mega/, "wokwi-arduino-mega"],
  [/arduino.*nano|nano(?!.*rp2040)/, "wokwi-arduino-nano"],
  [/rp2040/, "wokwi-nano-rp2040-connect"],
  [/arduino|uno/, "wokwi-arduino-uno"],
  [/esp32/, "wokwi-esp32-devkit-v1"],
  [/dht/, "wokwi-dht22"],
  [/ultrasonic|hc[\s-]?sr04|distance/, "wokwi-hc-sr04"],
  [/servo/, "wokwi-servo"],
  [/rgb.*led/, "wokwi-rgb-led"],
  [/\bled\b|lampu/, "wokwi-led"],
  [/button|push/, "wokwi-pushbutton"],
  [/resistor/, "wokwi-resistor"],
  [/potensio|potentiometer/, "wokwi-potentiometer"],
  [/buzzer/, "wokwi-buzzer"],
  [/lcd.*20x4|20x4/, "wokwi-lcd2004"],
  [/lcd|16x2/, "wokwi-lcd1602"],
  [/oled|ssd1306/, "wokwi-ssd1306"],
  [/7.?segment/, "wokwi-7segment"],
  [/keypad/, "wokwi-membrane-keypad"],
  [/pir|motion/, "wokwi-pir-motion-sensor"],
  [/ldr|photoresistor|cahaya/, "wokwi-photoresistor-sensor"],
  [/mpu6050|gyro|accelerometer/, "wokwi-mpu6050"],
  [/neopixel|led ring/, "wokwi-led-ring"],
  [/ir receiver|infrared/, "wokwi-ir-receiver"],
  [/rtc|ds1307/, "wokwi-ds1307"],
  [/sd card|microsd/, "wokwi-microsd-card"],
];

function normalizeToolName(value) {
  return String(value || "").trim().toLowerCase();
}

<<<<<<< HEAD
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
=======
function getWokwiElementName(tool) {
  const explicitElement = String(tool?.wokwiElement || "").trim();
  if (SUPPORTED_WOKWI_ELEMENTS.has(explicitElement)) return explicitElement;

  const normalizedName = normalizeToolName(getToolName(tool));
  const exactElement = WOKWI_ELEMENT_BY_TOOL_NAME[normalizedName];
  if (exactElement) return exactElement;

  return WOKWI_ELEMENT_KEYWORD_MATCHERS.find(([pattern]) => pattern.test(normalizedName))?.[1] || "";
}

function getNodeDescription(node) {
  return String(
    node?.description ||
      node?.body ||
      "Node ArduFlow yang digunakan pada proyek ini."
  ).trim();
}

function getStepTitle(step, index) {
  return String(step?.title || step?.name || "").trim();
}

function getStepBody(step) {
  return String(step?.description || step?.body || step || "").trim();
}

function hasHtmlMarkup(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function getStepReferences(step) {
  const references = [
    ...(Array.isArray(step?.references) ? step.references : []),
    ...(Array.isArray(step?.components)
      ? step.components.map((item) => (typeof item === "string" ? { kind: "component", name: item } : { ...item, kind: "component" }))
      : []),
    ...(Array.isArray(step?.nodes)
      ? step.nodes.map((item) => (typeof item === "string" ? { kind: "node", name: item } : { ...item, kind: "node" }))
      : []),
  ];

  return references
    .map((item) => {
      if (typeof item === "string") {
        return { kind: "component", name: item.trim(), category: "", value: "" };
      }

      return {
        kind: item?.kind === "node" ? "node" : "component",
        name: String(item?.name || item?.title || "").trim(),
        category: String(item?.category || "").trim(),
        value: String(item?.value ?? "").trim(),
      };
    })
    .filter((item) => item.name);
}

function visibleList(items, limit) {
  return items.slice(0, limit);
}

function getCircuitLabel(tool) {
  return getToolName(tool) || "Komponen";
}

function StatCard({ icon, label, value }) {
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  return (
    <div className="project-detail__stat">
      <img src={icon} alt="" aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

<<<<<<< HEAD
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
=======
function CircuitDiagram({ tools }) {
  const legendItems = visibleList(tools, 5);

  return (
    <div className="project-circuit">
      <div className="project-circuit__canvas" aria-hidden="true">
        <div className="circuit-board">ARDUINO<br />UNO</div>
        <div className="circuit-lcd" />
        <div className="circuit-breadboard" />
        <div className="circuit-sensor" />
        <span className="wire wire--a" />
        <span className="wire wire--b" />
        <span className="wire wire--c" />
        <span className="wire wire--d" />
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
      </div>
      <aside className="project-circuit__legend">
        <strong>Keterangan:</strong>
        {legendItems.length ? legendItems.map((tool, index) => (
          <span key={`${getCircuitLabel(tool)}-${index}`}>
            <i aria-hidden="true" />
            {getCircuitLabel(tool)}
          </span>
        )) : (
          <span><i aria-hidden="true" />Belum ada komponen</span>
        )}
      </aside>
    </div>
  );
}

function CircuitSection({ project, tools }) {
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  return (
    <section id="rangkaian" className="detail-card detail-circuit" aria-labelledby="circuit-title">
      <h2 id="circuit-title">Gambar Rangkaian</h2>
      {project.circuitImageUrl ? (
        <>
          <button
            className="project-circuit project-circuit--image project-circuit--preview"
            type="button"
            onClick={() => setPreviewOpen(true)}
            aria-label={`Perbesar gambar rangkaian ${project.title}`}
          >
            <img src={project.circuitImageUrl} alt={`Gambar rangkaian ${project.title}`} />
            <span> Klik untuk perbesar</span>
          </button>

          {isPreviewOpen ? (
            <div
              className="project-circuit-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="circuit-preview-title"
              onClick={() => setPreviewOpen(false)}
            >
              <figure className="project-circuit-modal__content" onClick={(event) => event.stopPropagation()}>
                <figcaption>
                  <div>
                    <span>Preview Rangkaian</span>
                    <strong id="circuit-preview-title">{project.title}</strong>
                  </div>
                  <button type="button" aria-label="Tutup preview gambar rangkaian" onClick={() => setPreviewOpen(false)}>x</button>
                </figcaption>
                <img src={project.circuitImageUrl} alt={`Preview besar gambar rangkaian ${project.title}`} />
              </figure>
            </div>
          ) : null}
        </>
      ) : (
        <CircuitDiagram tools={tools} />
      )}
    </section>
  );
}

function InfoNotice() {
  return (
    <div className="project-detail__notice">
      <span aria-hidden="true">i</span>
      <p>Proyek ini dibuat menggunakan ArduFlow. Anda dapat membuka proyek ini di ArduFlow IDE untuk melihat atau mengeditnya.</p>
    </div>
  );
}

function ProjectSocialActions({ stats, onLike, onSave, onShare, onComment }) {
  const actions = [
    { type: "like", label: "Suka", count: stats.likes, active: stats.liked, onClick: onLike },
    { type: "comment", label: "Komentar", count: stats.comments, active: false, onClick: onComment },
    { type: "share", label: "Bagikan", count: stats.shares, active: false, onClick: onShare },
  ];

  return (
    <section className="project-social-actions" aria-label="Interaksi proyek">
      <div className="project-social-actions__row">
        <div className="project-social-actions__left">
          {actions.map((action) => (
            <button
              key={action.type}
              className={`project-social-actions__button${action.active ? " is-active" : ""}`}
              type="button"
              onClick={action.onClick}
              aria-pressed={action.type === "like" ? action.active : undefined}
              title={action.label}
            >
              <SocialIcon type={action.type} />
              <span>{formatNumber(action.count)}</span>
            </button>
          ))}
        </div>

        <button
          className={`project-social-actions__button${stats.saved ? " is-active" : ""}`}
          type="button"
          onClick={onSave}
          aria-pressed={stats.saved}
          title={stats.saved ? "Batalkan simpan" : "Simpan proyek"}
        >
          <SocialIcon type="save" />
          <span>{formatNumber(stats.saves)}</span>
        </button>
      </div>

      <p>
        <SocialIcon type="view" />
        <strong>{formatNumber(stats.viewer)}</strong>
        <span>viewers</span>
      </p>
    </section>
  );
}

function RatingStars({ value, onChange, disabled = false, label = "Rating" }) {
  return (
    <div className="project-review__stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <button
          type="button"
          className={value >= ratingValue ? "is-active" : ""}
          disabled={disabled}
          onClick={() => onChange(ratingValue)}
          aria-checked={value === ratingValue}
          role="radio"
          title={`${label} ${ratingValue}`}
          key={ratingValue}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ProjectReview({
  average,
  count,
  categoryAverages,
  reviews,
  viewerReview,
  draft,
  rating,
  categoryRatings,
  error,
  isEditing,
  isSubmitting,
  inputRef,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onDraftChange,
  onRatingChange,
  onCategoryChange,
  onSubmit,
}) {
  const roundedAverage = Math.min(5, Math.max(0, Number(average) || 0));
  const formVisible = isEditing || !viewerReview;
  const visibleReviews = viewerReview
    ? reviews.filter((review) => review.identity !== viewerReview.identity && review.id !== viewerReview.id)
    : reviews;

  return (
    <section className="project-review" aria-label="Review proyek">
      <div className="project-review__head">
        <div className="project-review__summary">
          <strong>{roundedAverage ? roundedAverage.toLocaleString("id-ID", { maximumFractionDigits: 1 }) : "0"}</strong>
          <span>/ 5</span>
          <small>{count ? `${formatNumber(count)} review` : "Belum ada review"}</small>
        </div>
        {viewerReview && !isEditing ? (
          <div className="project-review__actions">
            <button type="button" onClick={onStartEdit}>Edit Review</button>
            <button type="button" onClick={onDelete} disabled={isSubmitting}>Hapus</button>
          </div>
        ) : null}
      </div>

      <div className="project-review__categories">
        {PROJECT_REVIEW_CATEGORIES.map((category) => (
          <span key={category.id}>
            <strong>{category.label}</strong>
            <small>{Number(categoryAverages?.[category.id] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}/5</small>
          </span>
        ))}
      </div>

      {viewerReview && !isEditing ? (
        <article className="project-review__mine">
          <header>
            <strong>Review anda</strong>
            <span>{viewerReview.value}/5</span>
          </header>
          {viewerReview.message ? <p>{viewerReview.message}</p> : null}
          <div className="project-review__mine-categories">
            {PROJECT_REVIEW_CATEGORIES.map((category) => (
              <span key={category.id}>{category.label}: {viewerReview.categories?.[category.id] || 0}/5</span>
            ))}
          </div>
        </article>
      ) : null}

      {formVisible ? (
        <form className="project-review__form" onSubmit={onSubmit}>
          <div className="project-review__field">
            <label>Rating keseluruhan</label>
            <RatingStars value={rating} onChange={onRatingChange} disabled={isSubmitting} label="Rating keseluruhan" />
          </div>

          <div className="project-review__category-form">
            {PROJECT_REVIEW_CATEGORIES.map((category) => (
              <div className="project-review__field" key={category.id}>
                <label>{category.label}</label>
                <RatingStars
                  value={categoryRatings[category.id] || 0}
                  onChange={(value) => onCategoryChange(category.id, value)}
                  disabled={isSubmitting}
                  label={category.label}
                />
              </div>
            ))}
          </div>

          <div className="project-review__field">
            <label>Komentar</label>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="Tulis pengalaman menggunakan proyek ini"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="project-review__form-footer">
            {error ? <span>{error}</span> : <small>{draft.length}/1000</small>}
            <div>
              {isEditing ? <button type="button" className="project-review__ghost" onClick={onCancelEdit}>Batal</button> : null}
              <button type="submit" disabled={isSubmitting || !rating || !draft.trim()}>
                {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Kirim Review"}
              </button>
            </div>
          </div>
      </form>
      ) : null}

      <div className="project-review__list">
        {visibleReviews.length ? visibleReviews.map((review) => (
          <article className="project-review__item" key={review.id}>
            <span>{getInitials(review.authorName)}</span>
            <div>
              <header>
                <strong>{review.authorName}</strong>
                <small>{review.value}/5</small>
                {review.updatedAt || review.createdAt ? <time>{formatCommentDate(review.updatedAt || review.createdAt)}</time> : null}
              </header>
              {review.message ? <p>{review.message}</p> : null}
              <div className="project-review__item-categories">
                {PROJECT_REVIEW_CATEGORIES.map((category) => (
                  <span key={category.id}>{category.label}: {review.categories?.[category.id] || 0}/5</span>
                ))}
              </div>
            </div>
          </article>
        )) : (
          <p className="project-review__empty">Review lain yang dikirim akan tampil di sini.</p>
        )}
      </div>
    </section>
  );
}

function SectionFooterButton({ children, onClick, expanded = false }) {
  return (
    <button
      className="detail-card__footer-button"
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
    >
      {children}
    </button>
  );
}

function StepArrow() {
  return <span className="detail-step-arrow" aria-hidden="true">-&gt;</span>;
}

function getNodeName(node, index) {
  return String(node?.name || node?.title || `Node ${index + 1}`).trim();
}

function NodeIcon({ node, index }) {
  const nodeType = getProjectNodeType(node);
  const nodeName = getNodeName(node, index);

  if (node?.imageUrl) {
    return (
      <span className="detail-node-icon detail-node-icon--image">
        <img src={node.imageUrl} alt="" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="detail-node-icon">
      <NodeSprite
        name={nodeType}
        scale={0.34}
        maxWidth={58}
        maxHeight={42}
        title={nodeName}
      />
    </span>
  );
}

function ComponentImage({ tool }) {
  if (tool?.imageUrl) {
    return <img className="detail-component-image" src={tool.imageUrl} alt="" aria-hidden="true" />;
  }

  const wokwiElement = getWokwiElementName(tool);

  if (wokwiElement) {
    return (
      <span className="detail-wokwi-visual" aria-hidden="true">
        {createElement(wokwiElement)}
      </span>
    );
  }

  return (
    <span className="detail-component-fallback" aria-hidden="true">
      {getToolVisualLabel(tool)}
    </span>
  );
}

function DetailStep({ step, index, isLast }) {
  const title = getStepTitle(step, index);
  const body = getStepBody(step);
  const bodyHasHtml = hasHtmlMarkup(body);
  const references = getStepReferences(step);

  return (
    <>
      <article className="detail-step">
        <strong>{index + 1}</strong>
        {title ? <h3>{title}</h3> : null}
        {references.length ? (
          <div className="detail-step__refs" aria-label="Komponen dan node yang digunakan pada langkah ini">
            {references.map((item, itemIndex) => (
              <span key={`${item.kind}-${item.name}-${itemIndex}`}>
                <b>{item.kind === "node" ? "Node" : "Komponen"}</b>
                {item.name}
                {item.value ? <small>{item.value}</small> : null}
              </span>
            ))}
          </div>
        ) : null}
        {bodyHasHtml ? (
          <div
            className="detail-step__body"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="detail-step__body">{body}</p>
        )}
      </article>
      {!isLast && <StepArrow />}
    </>
  );
}

function EmptyDetail({ children }) {
  return <p className="admin-empty-state admin-empty-state--wide">{children}</p>;
}

function ProjectDetailFallbackLink() {
  return (
    <a className="project-detail__back" href="/project">
      <span aria-hidden="true">&larr;</span>
      Kembali ke Daftar Proyek
    </a>
  );
}

function normalizeDescriptionHtml(value) {
  return sanitizeProjectHtml(value) || "<p>Belum ada deskripsi proyek.</p>";
}

function getProjectFileHref(project) {
  return project.projectArchiveUrl || project.projectFileUrl || "#rangkaian";
}

function getProjectFileLabel(project) {
  return project.projectArchiveUrl || project.projectFileUrl ? "Unduh Proyek" : "Lihat Rangkaian";
}

const zipCrc32Table = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

function getZipCrc32(bytes) {
  let checksum = 0xffffffff;

  bytes.forEach((byte) => {
    checksum = zipCrc32Table[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  });

  return (checksum ^ 0xffffffff) >>> 0;
}

function createZipHeader(length, values) {
  const bytes = new Uint8Array(length);
  const view = new DataView(bytes.buffer);

  values.forEach(([offset, value, size]) => {
    if (size === 2) {
      view.setUint16(offset, value, true);
    } else {
      view.setUint32(offset, value, true);
    }
  });

  return bytes;
}

function concatZipBytes(parts) {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
}

function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  entries.forEach((entry) => {
    const name = encoder.encode(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
    const checksum = getZipCrc32(data);
    const localHeader = createZipHeader(30 + name.length, [
      [0, 0x04034b50, 4],
      [4, 20, 2],
      [6, 0, 2],
      [8, 0, 2],
      [10, 0, 2],
      [12, 0, 2],
      [14, checksum, 4],
      [18, data.length, 4],
      [22, data.length, 4],
      [26, name.length, 2],
      [28, 0, 2],
    ]);
    localHeader.set(name, 30);
    localParts.push(localHeader, data);

    const centralHeader = createZipHeader(46 + name.length, [
      [0, 0x02014b50, 4],
      [4, 20, 2],
      [6, 20, 2],
      [8, 0, 2],
      [10, 0, 2],
      [12, 0, 2],
      [14, 0, 2],
      [16, checksum, 4],
      [20, data.length, 4],
      [24, data.length, 4],
      [28, name.length, 2],
      [30, 0, 2],
      [32, 0, 2],
      [34, 0, 2],
      [36, 0, 2],
      [38, 0, 4],
      [42, localOffset, 4],
    ]);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.length + data.length;
  });

  const localBytes = concatZipBytes(localParts);
  const centralBytes = concatZipBytes(centralParts);
  const endRecord = createZipHeader(22, [
    [0, 0x06054b50, 4],
    [4, 0, 2],
    [6, 0, 2],
    [8, entries.length, 2],
    [10, entries.length, 2],
    [12, centralBytes.length, 4],
    [16, localBytes.length, 4],
    [20, 0, 2],
  ]);

  return new Blob([localBytes, centralBytes, endRecord], { type: "application/zip" });
}

function getProjectDownloadName(project) {
  const normalizedTitle = String(project?.title || "proyek")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedTitle || "proyek"}.zip`;
}

function getProjectFileEntries(project, fallbackProject, archiveUrl) {
  const candidates = [project, fallbackProject].filter(Boolean);
  const files = candidates
    .flatMap((candidate) => Array.isArray(candidate.projectFiles) ? candidate.projectFiles : [])
    .filter(Boolean);

  if (files.length) {
    return files;
  }

  const projectFile = candidates.find((candidate) => candidate.projectFile)?.projectFile;

  return projectFile ? [{ label: "File Proyek", file: projectFile, fileUrl: project.projectFileUrl }] : [];
}

function getProjectFileUrl(entry, archiveUrl) {
  const file = entry?.file && typeof entry.file === "object" ? entry.file : entry;
  const rawUrl = String(entry?.fileUrl || entry?.file_url || file?.file_url || file?.url || "").trim();

  if (!rawUrl || /^[a-z]:[\\/]/i.test(rawUrl)) {
    return "";
  }

  try {
    return new URL(rawUrl, archiveUrl).toString();
  } catch {
    return "";
  }
}

function getArchiveEntryName(entry, index, usedNames) {
  const file = entry?.file && typeof entry.file === "object" ? entry.file : entry;
  const originalName = String(file?.original_name || file?.file_name || `file-${index + 1}.json`).trim();
  const extension = originalName.includes(".") ? `.${originalName.split(".").pop().toLowerCase()}` : "";
  const label = String(entry?.label || `file-${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `file-${index + 1}`;
  let name = `${label}${extension}`;
  let suffix = 2;

  while (usedNames.has(name)) {
    name = `${label}-${suffix}${extension}`;
    suffix += 1;
  }

  usedNames.add(name);
  return name;
}

function triggerProjectDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadProjectArchive(project) {
  const archiveUrl = getProjectFileHref(project);
  const response = await fetch(archiveUrl, {
    headers: { Accept: "application/zip, application/json" },
  });

  if (!response.ok) {
    throw new Error(`File proyek tidak dapat diunduh. HTTP ${response.status}`);
  }

  const responseBytes = new Uint8Array(await response.arrayBuffer());
  const isZip = responseBytes.length >= 4 &&
    responseBytes[0] === 0x50 &&
    responseBytes[1] === 0x4b &&
    responseBytes[2] === 0x03 &&
    responseBytes[3] === 0x04;

  if (isZip || response.headers.get("content-type")?.toLowerCase().includes("application/zip")) {
    triggerProjectDownload(new Blob([responseBytes], { type: "application/zip" }), getProjectDownloadName(project));
    return;
  }

  let fallbackProject = null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(responseBytes));
    fallbackProject = payload?.data || payload?.project || (payload?.name ? payload : null);
  } catch {
    fallbackProject = null;
  }

  const fileEntries = getProjectFileEntries(project, fallbackProject, archiveUrl);
  const archiveEntries = [];
  const usedNames = new Set();

  for (let index = 0; index < fileEntries.length; index += 1) {
    const entry = fileEntries[index];
    const fileUrl = getProjectFileUrl(entry, archiveUrl) || (index === 0 ? project.projectFileUrl : "");

    if (!fileUrl) continue;

    try {
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) continue;

      archiveEntries.push({
        name: getArchiveEntryName(entry, index, usedNames),
        data: new Uint8Array(await fileResponse.arrayBuffer()),
      });
    } catch {
      // A missing optional file should not prevent the remaining files from being archived.
    }
  }

  if (!archiveEntries.length) {
    const projectData = fallbackProject?.payload || fallbackProject || project.payload || project;
    archiveEntries.push({
      name: "project.json",
      data: new TextEncoder().encode(JSON.stringify(projectData, null, 2)),
    });
  }

  triggerProjectDownload(createZipBlob(archiveEntries), getProjectDownloadName(project));
}

function getProjectPayment(project) {
  return project?.payment && typeof project.payment === "object" ? project.payment : {};
}

function getProjectPrice(project) {
  const payment = getProjectPayment(project);
  return Number(payment.price || project?.price || 0);
}

function isPaidProject(project) {
  const payment = getProjectPayment(project);
  return Boolean(payment.isPaid || project?.isPaid || getProjectPrice(project) > 0);
}

function isTransactionForProject(transaction, project) {
  const payload = transaction?.payload && typeof transaction.payload === "object" ? transaction.payload : {};
  const transactionProjectIds = [
    transaction?.itemId,
    transaction?.item_id,
    payload.projectId,
    payload.project_id,
    payload.itemId,
    payload.item_id,
    payload.project?.id,
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== "");

  return (
    String(transaction?.itemType || transaction?.item_type || "").toLowerCase() === "project" &&
    transactionProjectIds.some((projectId) => String(projectId) === String(project?.id || ""))
  );
}

function isPaidProjectTransaction(transaction, project) {
  const status = String(transaction?.status || "").toLowerCase();

  return (
    isTransactionForProject(transaction, project) &&
    ["paid", "approved", "success", "successful", "completed", "complete", "settlement", "verified"].includes(status)
  );
}

function isPendingProjectTransaction(transaction, project) {
  const status = String(transaction?.status || "").toLowerCase();

  return (
    isTransactionForProject(transaction, project) &&
    ["pending", "proof_uploaded", "uploaded", "waiting", "review", "rejected"].includes(status)
  );
}

function SocialIcon({ type }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (type === "like") {
    return (
      <svg {...common}>
        <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 0 1 7.1-7.1l.4.4.4-.4a5 5 0 0 1 7.1 7.1Z" />
      </svg>
    );
  }

  if (type === "comment") {
    return (
      <svg {...common}>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.3 8.8 8.8 0 0 1-3.4-.7L3 21l1.8-5.1A8.2 8.2 0 0 1 3 11.5a8.5 8.5 0 0 1 18 0Z" />
      </svg>
    );
  }

  if (type === "share") {
    return (
      <svg {...common}>
        <path d="M22 3 11 14" />
        <path d="m22 3-7 18-4-7-7-4 18-7Z" />
      </svg>
    );
  }

  if (type === "save") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function getPlatform(project) {
  return project.programmingLanguage || project.tags?.[0] || project.category || "-";
}

function getTags(project) {
  const tags = Array.isArray(project.tags) && project.tags.length
    ? project.tags
    : [project.category].filter(Boolean);

  return tags.slice(0, 4);
}


function getFlowJsonFromDescription(descriptionHtml) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = String(descriptionHtml || "");

  const codeElement = wrapper.querySelector("code.language-cpp");

  if (!codeElement) {
    return null;
  }

  const rawJson = (codeElement.textContent || "").trim();

  if (!rawJson) {
    return null;
  }

  try {
    return JSON.parse(rawJson);
  } catch (error) {
    console.error("JSON flow ArduFlow tidak valid:", error);
    return null;
  }
}

function openIDE(descriptionHtml) {
  const snippetJson = getFlowJsonFromDescription(descriptionHtml);

  if (!snippetJson) {
    window.alert(
      'JSON flow tidak ditemukan atau tidak valid pada <code class="language-cpp"> di deskripsi proyek.'
    );
    return;
  }

  const jsonStr = JSON.stringify(snippetJson);
  const encoded = compressToEncodedURIComponent(jsonStr);
  const url = `https://ide.arduflow.com/#flow=${encoded}`;

  window.open(url, "_blank", "noopener,noreferrer");
}


function getPlainTextLengthFromHtml(value) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = String(value || "");
  return (wrapper.textContent || wrapper.innerText || "").trim().length;
}

function truncateHtmlByTextLength(value, maxLength = 500) {
  const source = document.createElement("div");
  source.innerHTML = String(value || "");

  let remaining = maxLength;

  function cloneNode(node) {
    if (remaining <= 0) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";

      if (!text) {
        return document.createTextNode("");
      }

      if (text.length <= remaining) {
        remaining -= text.length;
        return document.createTextNode(text);
      }

      const sliced = text.slice(0, remaining).trimEnd();
      remaining = 0;
      return document.createTextNode(`${sliced}...`);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node.cloneNode(false);

    for (const child of node.childNodes) {
      if (remaining <= 0) break;

      const clonedChild = cloneNode(child);
      if (clonedChild) {
        element.appendChild(clonedChild);
      }
    }

    return element;
  }

  const output = document.createElement("div");

  for (const child of source.childNodes) {
    if (remaining <= 0) break;

    const clonedChild = cloneNode(child);
    if (clonedChild) {
      output.appendChild(clonedChild);
    }
  }

  return output.innerHTML;
}

function ProjectHero({
  project,
  tools,
  nodes,
  tags,
  description,
  isSaved = false,
  onToggleSave,
  isDownloading = false,
  onDownload,
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [projectTransactions, setProjectTransactions] = useState([]);

  const platform = getPlatform(project);
  const category = project.category || tags[0] || "-";
  const payment = getProjectPayment(project);
  const paidProject = isPaidProject(project);
  const projectPrice = getProjectPrice(project);
  const projectCurrency = payment.currency || "IDR";
  const hasPurchasedFromDatabase = Boolean(
    project?.hasPurchased ||
    project?.has_purchased ||
    project?.viewerAccess?.hasPurchased ||
    project?.viewerAccess?.has_purchased
  );
  const paidTransaction = projectTransactions.find((transaction) =>
    isPaidProjectTransaction(transaction, project)
  );
  const pendingTransaction = projectTransactions.find((transaction) =>
    isPendingProjectTransaction(transaction, project)
  );
  const hasProjectAccess = !paidProject || hasPurchasedFromDatabase || Boolean(paidTransaction);

  const descriptionLength = useMemo(
    () => getPlainTextLengthFromHtml(description),
    [description]
  );

  const hasLongDescription = descriptionLength > 500;

  const visibleDescription = useMemo(() => {
    if (!hasLongDescription || showFullDescription) {
      return description;
    }

    return truncateHtmlByTextLength(description, 500);
  }, [description, hasLongDescription, showFullDescription]);

  useEffect(() => {
    const user = getStoredUser();
    const userId = getUserId(user);
    const email = getUserEmail(user);

    if (!paidProject || (!userId && !email)) {
      setProjectTransactions([]);
      return undefined;
    }

    let isActive = true;
    const queries = [];

    if (userId && email) {
      queries.push({ userId, email });
    }
    if (email) {
      queries.push({ email });
    }
    if (userId) {
      queries.push({ userId });
    }

    Promise.allSettled(queries.map((params) => fetchTransactions(params)))
      .then((results) => {
        if (isActive) {
          const mergedRecords = results
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => result.value);
          const uniqueRecords = Array.from(
            new Map(
              mergedRecords.map((transaction, index) => [
                transaction.id ? String(transaction.id) : `${transaction.itemType}-${transaction.itemId}-${index}`,
                transaction,
              ])
            ).values()
          );

          setProjectTransactions(
            uniqueRecords.filter(
              (transaction) => String(transaction.itemType || transaction.item_type || "").toLowerCase() === "project"
            )
          );
        }
      })
      .catch((error) => {
        console.error("Gagal memuat transaksi proyek:", error);
        if (isActive) {
          setProjectTransactions([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [paidProject, project.id]);

  async function handleBuyProject() {
    const user = getStoredUser();
    const userId = getUserId(user);
    const email = getUserEmail(user);

    if (!userId && !email) {
      window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    if (pendingTransaction) {
      window.location.href = `/transaksi?transactionId=${encodeURIComponent(pendingTransaction.id)}`;
      return;
    }

    setIsPurchasing(true);
    setPurchaseMessage("Membuat transaksi proyek...");

    try {
      const transaction = await createTransaction({
        userId,
        userName: user.name || user.fullName || user.username || "User",
        email,
        itemType: "project",
        itemId: project.id,
        itemTitle: project.title,
        amount: projectPrice,
        currency: projectCurrency,
        paymentMethod: "Pembelian Proyek",
        paymentChannel: "ArduFlow",
        paymentCode: payment.paymentCode || project.paymentCode || "",
        status: "pending",
        notes: `Pembelian proyek ${project.title}`,
        payload: {
          projectId: project.id,
          projectTitle: project.title,
          projectFile: project.projectFile || null,
          projectFileUrl: project.projectFileUrl || "",
          source: "project-detail",
        },
      });

      const transactionQuery = transaction?.id ? `?transactionId=${encodeURIComponent(transaction.id)}` : "";
      window.location.href = `/transaksi${transactionQuery}`;
    } catch (error) {
      setPurchaseMessage(error.message || "Transaksi proyek gagal dibuat.");
      setIsPurchasing(false);
    }
  }

  return (
    <section className="project-detail__hero" aria-labelledby="project-detail-title">
      <div className="project-detail__summary">
        <div className="project-detail__headline">
          <div className="project-detail__tags" aria-label="Kategori proyek">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <h1 id="project-detail-title">{project.title}</h1>
          <div className="project-detail__description-wrapper">
            <div
              className="project-detail__description mce-content-body"
              dangerouslySetInnerHTML={{ __html: visibleDescription }}
            />

            {hasLongDescription && (
              <button
                type="button"
                className="project-detail__description-more"
                onClick={() => setShowFullDescription((current) => !current)}
              >
                {showFullDescription ? "Less" : "More"}
              </button>
            )}
          </div>
        </div>

        <div className="project-detail__side-panel">
          <div className="project-detail__stats" aria-label="Ringkasan proyek">
            <StatCard icon={monitorIcon} label="Tingkat" value={project.difficulty || "-"} />
            <StatCard icon={cpuIcon} label="Node" value={`${formatNumber(nodes.length)}`} />
            <StatCard icon={fileIcon} label="Platform" value={platform} />
            <StatCard icon={clockIcon} label="Kategori" value={category} />
          </div>

          <div className="project-detail__actions">
            {paidProject && !hasProjectAccess ? (
              <>
                <button
                  className="project-detail__button project-detail__button--primary project-detail__button--price"
                  type="button"
                >
                  Harga Proyek <strong>{formatCurrency(projectPrice, projectCurrency)}</strong>
                </button>
                <button
                  className="project-detail__button project-detail__button--secondary"
                  type="button"
                  onClick={pendingTransaction ? () => {
                    window.location.href = `/transaksi?transactionId=${encodeURIComponent(pendingTransaction.id)}`;
                  } : handleBuyProject}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? "Memproses..." : pendingTransaction ? "Lihat Transaksi" : "Beli Proyek"}
                </button>
                <button
                  className={`project-detail__button project-detail__button--ghost${isSaved ? " is-active" : ""}`}
                  type="button"
                  onClick={onToggleSave}
                >
                  {isSaved ? "Proyek Tersimpan" : "Simpan Proyek"}
                </button>
                {pendingTransaction ? (
                  <p className="project-detail__purchase-message" role="status">
                    Transaksi proyek sedang menunggu pembayaran atau verifikasi admin.
                  </p>
                ) : null}
                {purchaseMessage ? (
                  <p className="project-detail__purchase-message" role="status">{purchaseMessage}</p>
                ) : null}
              </>
            ) : (
              <>
                <button
                  className="project-detail__button project-detail__button--primary"
                  type="button"
                  onClick={() => openIDE(description)}
                >
                  Buka Proyek
                </button>
                <button
                  type="button"
                  className="project-detail__button project-detail__button--secondary"
                  onClick={onDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? "Menyiapkan ZIP..." : getProjectFileLabel(project)}
                </button>
                <button
                  className={`project-detail__button project-detail__button--ghost${isSaved ? " is-active" : ""}`}
                  type="button"
                  onClick={onToggleSave}
                >
                  {isSaved ? "Proyek Tersimpan" : "Simpan Proyek"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentsCard({ tools }) {
  const [expanded, setExpanded] = useState(false);
  const visibleTools = expanded ? tools : visibleList(tools, 6);
  const hasOverflow = tools.length > 6;

  return (
    <section className="detail-card detail-components" aria-labelledby="components-title">
      <h2 id="components-title">Alat dan Komponen</h2>
      {tools.length ? (
        <ul>
          {visibleTools.map((tool, index) => (
            <li key={`${getToolName(tool)}-${index}`}>
              <ComponentImage tool={tool} />
              <span className="detail-component-copy">
                <small>{getToolCategory(tool)}</small>
                <strong>{getToolName(tool) || `Komponen ${index + 1}`}</strong>
                <em>{getToolSpec(tool)}</em>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyDetail>Belum ada data alat dan komponen.</EmptyDetail>
      )}
      {hasOverflow ? (
        <SectionFooterButton expanded={expanded} onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Tampilkan Lebih Sedikit" : `Lihat Semua Komponen (${tools.length})`}
        </SectionFooterButton>
      ) : null}
    </section>
  );
}

function NodesCard({ nodes }) {
  const [expanded, setExpanded] = useState(false);
  const visibleNodes = expanded ? nodes : visibleList(nodes, 4);
  const hasOverflow = nodes.length > 4;

  return (
    <section className="detail-card detail-nodes" aria-labelledby="nodes-title">
      <h2 id="nodes-title">Node ArduFlow yang Digunakan</h2>
      {nodes.length ? (
        <ul>
          {visibleNodes.map((node, index) => (
            <li key={`${node.name || node.title || "node"}-${index}`}>
              <NodeIcon node={node} index={index} />
              <span>
                <strong>{getNodeName(node, index)}</strong>
                {getNodeDescription(node)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyDetail>Belum ada data node ArduFlow.</EmptyDetail>
      )}
      {hasOverflow ? (
        <SectionFooterButton expanded={expanded} onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Tampilkan Lebih Sedikit" : `Lihat Semua Node (${nodes.length})`}
        </SectionFooterButton>
      ) : null}
    </section>
  );
}

function StepsSection({ steps }) {
  return (
    <section className="detail-steps" aria-labelledby="steps-title">
      <h2 id="steps-title">Langkah Pengerjaan</h2>
      {steps.length ? (
        <div className="detail-steps__grid">
          {steps.map((step, index, list) => (
            <DetailStep
              step={step}
              index={index}
              isLast={index === list.length - 1}
              key={`${getStepTitle(step, index)}-${index}`}
            />
          ))}
        </div>
      ) : (
        <EmptyDetail>Belum ada data langkah pengerjaan.</EmptyDetail>
      )}
    </section>
  );
}

export function ProjectDetail() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [projectReviews, setProjectReviews] = useState([]);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewCategories, setReviewCategories] = useState(createEmptyCategoryRatings());
  const [viewerReview, setViewerReview] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [isReviewEditing, setIsReviewEditing] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const reviewInputRef = useRef(null);
  const [socialStats, setSocialStats] = useState({
    viewer: 0,
    likes: 0,
    saves: 0,
    shares: 0,
    comments: 0,
    averageRating: 0,
    ratingCount: 0,
    viewerRating: 0,
    categoryAverages: {},
    liked: false,
    saved: false,
  });

  const projectId = useMemo(getProjectIdFromUrl, []);

  function applyProjectStats(row) {
    const liked = window.localStorage.getItem(getInteractionStorageKey(row.id, "liked")) === "1";
    const saved = window.localStorage.getItem(getInteractionStorageKey(row.id, "saved")) === "1";
    const reviews = normalizeProjectReviews(row.ratingItems);

    setSocialStats({
      viewer: Number(row.viewer) || 0,
      likes: Number(row.likes) || 0,
      saves: Number(row.saves) || 0,
      shares: Number(row.shares) || 0,
      comments: Number(row.comments) || reviews.filter((review) => review.message).length,
      averageRating: Math.min(5, Math.max(0, Number(row.averageRating) || 0)),
      ratingCount: Number(row.ratingCount) || 0,
      viewerRating: Number(row.viewerRating) || 0,
      categoryAverages: row.categoryAverages || {},
      liked,
      saved,
    });
  }

  function applyProjectReviews(row) {
    const reviews = normalizeProjectReviews(row?.ratingItems);
    const currentViewerReview = row?.viewerReview
      ? normalizeProjectReviews([row.viewerReview])[0] || null
      : null;

    setProjectReviews(reviews);
    setViewerReview(currentViewerReview);

    if (currentViewerReview) {
      setReviewDraft(currentViewerReview.message || "");
      setReviewRating(currentViewerReview.value || 0);
      setReviewCategories(normalizeReviewCategories(currentViewerReview.categories));
      setIsReviewEditing(false);
    } else {
      setReviewDraft("");
      setReviewRating(0);
      setReviewCategories(createEmptyCategoryRatings());
      setIsReviewEditing(false);
    }
  }

  async function sendInteraction(type, active = true) {
    if (!project?.id) return;

    try {
      const user = getStoredUser();
      const viewerParams = {};
      const userId = getUserId(user);
      const email = getUserEmail(user);

      if (userId) viewerParams.userId = userId;
      if (email) viewerParams.email = email;

      const updatedProject = await updateProjectInteraction(project.id, type, active, viewerParams);

      if (updatedProject?.id) {
        setProject(updatedProject);
        applyProjectStats(updatedProject);
      }
    } catch (interactionError) {
      console.error("Gagal memperbarui interaksi proyek:", interactionError);
    }
  }

  async function handleDownloadProject() {
    if (!project?.id || isDownloading) return;

    setIsDownloading(true);

    try {
      await downloadProjectArchive(project);
    } catch (downloadError) {
      console.error("Gagal mengunduh proyek:", downloadError);
      window.alert(downloadError.message || "File proyek tidak dapat diunduh.");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleToggleLike() {
    if (!project?.id) return;

    const nextLiked = !socialStats.liked;
    window.localStorage.setItem(getInteractionStorageKey(project.id, "liked"), nextLiked ? "1" : "0");
    setSocialStats((current) => ({
      ...current,
      liked: nextLiked,
      likes: Math.max(0, current.likes + (nextLiked ? 1 : -1)),
    }));
    sendInteraction("likes", nextLiked);
  }

  function handleToggleSave() {
    if (!project?.id) return;

    const nextSaved = !socialStats.saved;
    window.localStorage.setItem(getInteractionStorageKey(project.id, "saved"), nextSaved ? "1" : "0");
    setSocialStats((current) => ({
      ...current,
      saved: nextSaved,
      saves: Math.max(0, current.saves + (nextSaved ? 1 : -1)),
    }));
    sendInteraction("saves", nextSaved);
  }

  async function handleShareProject() {
    const shareUrl = window.location.href;
    const shareData = {
      title: project?.title || "Proyek ArduFlow",
      text: project?.title || "Lihat proyek ArduFlow ini",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        window.alert("Link proyek berhasil disalin.");
      }

      setSocialStats((current) => ({
        ...current,
        shares: current.shares + 1,
      }));
      sendInteraction("shares", true);
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        console.error("Gagal membagikan proyek:", shareError);
      }
    }
  }

  function handleCommentProject() {
    setIsReviewEditing(true);
    window.setTimeout(() => {
      reviewInputRef.current?.focus();
    }, 0);
  }

  function getViewerParams() {
    const user = getStoredUser();
    const userId = getUserId(user);
    const email = getUserEmail(user);
    const viewerParams = {};

    if (userId) viewerParams.userId = userId;
    if (email) viewerParams.email = email;

    return { user, userId, email, viewerParams };
  }

  function handleStartEditReview() {
    setIsReviewEditing(true);
    setReviewError("");
    window.setTimeout(() => {
      reviewInputRef.current?.focus();
    }, 0);
  }

  function handleCancelEditReview() {
    setReviewDraft(viewerReview?.message || "");
    setReviewRating(viewerReview?.value || 0);
    setReviewCategories(normalizeReviewCategories(viewerReview?.categories));
    setReviewError("");
    setIsReviewEditing(false);
  }

  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!project?.id || isSubmittingReview) return;

    const message = reviewDraft.trim();
    const { user, userId, email, viewerParams } = getViewerParams();

    if (!userId && !email) {
      setReviewError("Login diperlukan untuk memberi review.");
      return;
    }

    if (!reviewRating) {
      setReviewError("Pilih rating keseluruhan.");
      return;
    }

    if (!message) {
      setReviewError("Komentar tidak boleh kosong.");
      return;
    }

    setReviewError("");
    setIsSubmittingReview(true);

    try {
      const updatedProject = await updateProjectRating(project.id, {
        value: reviewRating,
        message,
        categories: reviewCategories,
        authorName: getUserDisplayName(user),
        authorEmail: email,
      }, viewerParams);

      if (updatedProject?.id) {
        setProject(updatedProject);
        applyProjectStats(updatedProject);
        applyProjectReviews(updatedProject);
      }
    } catch (submitError) {
      console.error("Gagal menyimpan review proyek:", submitError);
      setReviewError(submitError.message || "Review tidak dapat disimpan.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleDeleteReview() {
    if (!project?.id || isSubmittingReview) return;

    const { userId, email, viewerParams } = getViewerParams();

    if (!userId && !email) {
      setReviewError("Login diperlukan untuk menghapus review.");
      return;
    }

    setReviewError("");
    setIsSubmittingReview(true);

    try {
      const updatedProject = await deleteProjectRating(project.id, viewerParams);

      if (updatedProject?.id) {
        setProject(updatedProject);
        applyProjectStats(updatedProject);
        applyProjectReviews(updatedProject);
      }
    } catch (deleteError) {
      console.error("Gagal menghapus review proyek:", deleteError);
      setReviewError(deleteError.message || "Review tidak dapat dihapus.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadProject() {
      setLoading(true);
      setError("");

      try {
        const user = getStoredUser();
        const viewerParams = {};
        const userId = getUserId(user);
        const email = getUserEmail(user);

        if (userId) viewerParams.userId = userId;
        if (email) viewerParams.email = email;

        const row = projectId
          ? await fetchProjectSubmission(projectId, viewerParams)
          : (await fetchProjectSubmissions()).find(isPublicProject);

        if (!isActive) return;

        if (!row) {
          throw new Error("Belum ada proyek publik di database.");
        }

        setProject(row);
        applyProjectStats(row);
        applyProjectReviews(row);
      } catch (fetchError) {
        if (!isActive) return;

        setError(fetchError.message || "Detail proyek tidak dapat dimuat.");
        setProject(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isActive = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!project?.id) return undefined;

    const viewKey = getInteractionStorageKey(project.id, "viewed");

    if (window.localStorage.getItem(viewKey) === "1") {
      return undefined;
    }

    window.localStorage.setItem(viewKey, "1");
    setSocialStats((current) => ({
      ...current,
      viewer: current.viewer + 1,
    }));
    sendInteraction("viewer", true);

    return undefined;
  }, [project?.id]);

  if (loading) {
    return (
      <section className="project-detail" aria-labelledby="project-detail-title">
        <div className="project-detail__content">
          <EmptyDetail>Memuat detail proyek dari database...</EmptyDetail>
        </div>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className="project-detail" aria-labelledby="project-detail-title">
        <div className="project-detail__content">
          <EmptyDetail>{error || "Proyek tidak ditemukan."}</EmptyDetail>
        </div>
      </section>
    );
  }

  const tools = Array.isArray(project.tools) ? project.tools : [];
  const nodes = Array.isArray(project.nodes) ? project.nodes : [];
  const steps = Array.isArray(project.steps) ? project.steps : [];
  const tags = Array.isArray(project.tags) && project.tags.length
    ? getTags(project)
    : [project.category].filter(Boolean);
  const description = normalizeDescriptionHtml(
    project.descriptionHtml || project.description
  );
  return (
    <main className="project-detail">
      <div className="project-detail__shell">
        <ProjectDetailFallbackLink />

        <ProjectHero
          project={project}
          tools={tools}
          nodes={nodes}
          tags={tags}
          description={description}
          isSaved={socialStats.saved}
          onToggleSave={handleToggleSave}
          isDownloading={isDownloading}
          onDownload={handleDownloadProject}
        />

        <div className="project-detail__info">
          <ComponentsCard tools={tools} />
          <NodesCard nodes={nodes} />
        </div>

        <CircuitSection project={project} tools={tools} />
        <StepsSection steps={steps} />
        <InfoNotice />
        <ProjectSocialActions
          stats={socialStats}
          onLike={handleToggleLike}
          onSave={handleToggleSave}
          onShare={handleShareProject}
          onComment={handleCommentProject}
        />
        <ProjectReview
          average={socialStats.averageRating}
          count={socialStats.ratingCount}
          categoryAverages={socialStats.categoryAverages}
          reviews={projectReviews}
          viewerReview={viewerReview}
          draft={reviewDraft}
          rating={reviewRating}
          categoryRatings={reviewCategories}
          error={reviewError}
          isEditing={isReviewEditing}
          isSubmitting={isSubmittingReview}
          inputRef={reviewInputRef}
          onStartEdit={handleStartEditReview}
          onCancelEdit={handleCancelEditReview}
          onDelete={handleDeleteReview}
          onDraftChange={(value) => {
            setReviewDraft(value);
            if (reviewError) setReviewError("");
          }}
          onRatingChange={(value) => {
            setReviewRating(value);
            setReviewCategories((current) => {
              const hasCategoryValue = Object.values(current).some((item) => Number(item) > 0);
              return hasCategoryValue ? current : createEmptyCategoryRatings(value);
            });
            if (reviewError) setReviewError("");
          }}
          onCategoryChange={(categoryId, value) => {
            setReviewCategories((current) => ({ ...current, [categoryId]: value }));
            if (reviewError) setReviewError("");
          }}
          onSubmit={handleSubmitReview}
        />
      </div>
    </main>
  );
}
