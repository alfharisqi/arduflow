import { createElement, useEffect, useMemo, useState } from "react";
import { compressToEncodedURIComponent } from "lz-string";

import monitorIcon from "../assets/icons/icon-monitor-1.svg";
import cpuIcon from "../assets/icons/icon-cpu-1.svg";
import zapIcon from "../assets/icons/icon-zap-1.svg";
import workflowIcon from "../assets/icons/icon-workflow-1.svg";
import clockIcon from "../assets/icons/icon-clock-1.svg";
import fileIcon from "../assets/icons/icon-file-text-1.svg";
import downloadIcon from "../assets/icons/icon-downloadsim-1.svg";
import {
  fetchProjectSubmission,
  fetchProjectSubmissions,
  isPublicProject,
} from "../services/projectApi.js";

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

function visibleList(items, limit) {
  return items.slice(0, limit);
}

function getCircuitLabel(tool) {
  return getToolName(tool) || "Komponen";
}

function StatCard({ icon, label, value }) {
  return (
    <div className="project-detail__stat">
      <img src={icon} alt="" aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

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
  return (
    <section id="rangkaian" className="detail-card detail-circuit" aria-labelledby="circuit-title">
      <h2 id="circuit-title">Gambar Rangkaian</h2>
      {project.circuitImageUrl ? (
        <div className="project-circuit project-circuit--image">
          <img src={project.circuitImageUrl} alt={`Gambar rangkaian ${project.title}`} />
        </div>
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

function SectionFooterButton({ children }) {
  return <button className="detail-card__footer-button" type="button">{children}</button>;
}

function StepArrow() {
  return <span className="detail-step-arrow" aria-hidden="true">-&gt;</span>;
}

function NodeIcon({ index }) {
  const icon = index % 2 === 0 ? zapIcon : workflowIcon;

  return (
    <span className="detail-node-icon">
      <img src={icon} alt="" aria-hidden="true" />
    </span>
  );
}

function ComponentImage({ tool }) {
  const wokwiElement = getWokwiElementName(tool);

  if (wokwiElement) {
    return (
      <span className="detail-wokwi-visual" aria-hidden="true">
        {createElement(wokwiElement)}
      </span>
    );
  }

  if (tool?.imageUrl) {
    return <img className="detail-component-image" src={tool.imageUrl} alt="" aria-hidden="true" />;
  }

  return (
    <span className="detail-component-fallback" aria-hidden="true">
      {getToolVisualLabel(tool)}
    </span>
  );
}

function DetailStep({ step, index, isLast }) {
  const title = getStepTitle(step, index);

  return (
    <>
      <article className="detail-step">
        <strong>{index + 1}</strong>
        {title ? <h3>{title}</h3> : null}
        <p>{getStepBody(step)}</p>
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
  return project.projectFileUrl || "#rangkaian";
}

function getProjectFileLabel(project) {
  return project.projectFileUrl ? "Unduh File Proyek" : "Lihat Rangkaian";
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

function ProjectHero({ project, tools, nodes, tags, description }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const platform = getPlatform(project);
  const category = project.category || tags[0] || "-";

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
            <button
              className="project-detail__button project-detail__button--primary"
              type="button"
              onClick={() => openIDE(description)}
            >
              Buka ArduFlow IDE <span aria-hidden="true">-&gt;</span>
            </button>
            <a
              className="project-detail__button project-detail__button--secondary"
              href={getProjectFileHref(project)}
              target={project.projectFileUrl ? "_blank" : undefined}
              rel={project.projectFileUrl ? "noreferrer" : undefined}
            >
              {getProjectFileLabel(project)}
              <img src={downloadIcon} alt="" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentsCard({ tools }) {
  return (
    <section className="detail-card detail-components" aria-labelledby="components-title">
      <h2 id="components-title">Alat dan Komponen</h2>
      {tools.length ? (
        <ul>
          {visibleList(tools, 6).map((tool, index) => (
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
      {tools.length > 6 && <SectionFooterButton>Lihat Semua Komponen</SectionFooterButton>}
    </section>
  );
}

function NodesCard({ nodes }) {
  return (
    <section className="detail-card detail-nodes" aria-labelledby="nodes-title">
      <h2 id="nodes-title">Node ArduFlow yang Digunakan</h2>
      {nodes.length ? (
        <ul>
          {visibleList(nodes, 4).map((node, index) => (
            <li key={`${node.name || node.title || "node"}-${index}`}>
              <NodeIcon index={index} />
              <span>
                <strong>{node.name || node.title || `Node ${index + 1}`}</strong>
                {getNodeDescription(node)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyDetail>Belum ada data node ArduFlow.</EmptyDetail>
      )}
      {nodes.length > 4 && <SectionFooterButton>Lihat Semua Node</SectionFooterButton>}
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

  const projectId = useMemo(getProjectIdFromUrl, []);

  useEffect(() => {
    let isActive = true;

    async function loadProject() {
      setLoading(true);
      setError("");

      try {
        const row = projectId
          ? await fetchProjectSubmission(projectId)
          : (await fetchProjectSubmissions()).find(isPublicProject);

        if (!isActive) return;

        if (!row) {
          throw new Error("Belum ada proyek publik di database.");
        }

        setProject(row);
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
        />

        <div className="project-detail__info">
          <ComponentsCard tools={tools} />
          <NodesCard nodes={nodes} />
        </div>

        <CircuitSection project={project} tools={tools} />
        <StepsSection steps={steps} />
        <InfoNotice />
      </div>
    </main>
  );
}
