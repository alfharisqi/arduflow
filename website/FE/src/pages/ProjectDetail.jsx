import { useEffect, useMemo, useState } from "react";

import projectFallbackImage from "../assets/images/project-hero-reference.png";
import monitorIcon from "../assets/icons/icon-monitor-1.svg";
import cpuIcon from "../assets/icons/icon-cpu-1.svg";
import zapIcon from "../assets/icons/icon-zap-1.svg";
import workflowIcon from "../assets/icons/icon-workflow-1.svg";
import clockIcon from "../assets/icons/icon-clock-1.svg";
import { fetchProjectSubmission } from "../services/projectApi.js";

function getProjectIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id") || "";
}

function stripHtml(value) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = String(value || "");
  return wrapper.textContent || wrapper.innerText || "";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

function getToolName(tool) {
  return String(tool?.name || tool?.title || tool || "").trim();
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

function getNodeDescription(node) {
  return String(
    node?.description ||
      node?.body ||
      "Node ArduFlow yang digunakan pada proyek ini."
  ).trim();
}

function getStepTitle(step, index) {
  return String(step?.title || `Langkah ${index + 1}`).trim();
}

function getStepBody(step) {
  return String(step?.description || step?.body || step || "").trim();
}

function NodePreview({ nodes }) {
  const previewNodes = nodes.slice(0, 4);

  if (!previewNodes.length) {
    return null;
  }

  return (
    <div className="detail-node-preview" aria-label="Preview node ArduFlow">
      <div className="preview-wire preview-wire--one" aria-hidden="true" />
      <div className="preview-wire preview-wire--two" aria-hidden="true" />
      {previewNodes.map((node, index) => (
        <div
          className={`preview-node ${
            [
              "preview-node--timer",
              "preview-node--boolean",
              "preview-node--digital",
              "preview-node--delay",
            ][index]
          }`}
          key={`${node.name || node.title || "node"}-${index}`}
        >
          <span>{String(node.name || node.title || "NODE").toUpperCase()}</span>
          <strong>{node.type || node.category || "ArduFlow"}</strong>
        </div>
      ))}
    </div>
  );
}

function EmptyDetail({ children }) {
  return <p className="admin-empty-state admin-empty-state--wide">{children}</p>;
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
        const row = await fetchProjectSubmission(projectId);

        if (!isActive) return;

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
    ? project.tags
    : [project.category].filter(Boolean);
  const description = stripHtml(project.description);
  const coverImageUrl = project.coverImageUrl || projectFallbackImage;
  const coverAlt = project.coverImage?.altText || project.title;
  const platform =
    project.programmingLanguage || project.tags?.[0] || project.category || "-";

  return (
    <section className="project-detail" aria-labelledby="project-detail-title">
      <div className="project-detail__content">
        <div className="project-detail__hero">
          <img
            className="project-detail__image"
            src={coverImageUrl}
            alt={coverAlt}
          />

          <div className="project-detail__summary">
            <div className="project-detail__tags" aria-label="Kategori proyek">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <h1 id="project-detail-title">{project.title}</h1>
            <p>{description}</p>

            <div className="project-detail__stats" aria-label="Ringkasan proyek">
              <div>
                <img src={monitorIcon} alt="" aria-hidden="true" />
                <span>
                  <strong>Tingkat</strong>
                  {project.difficulty || "-"}
                </span>
              </div>
              <div>
                <img src={cpuIcon} alt="" aria-hidden="true" />
                <span>
                  <strong>Jumlah Node</strong>
                  {formatNumber(nodes.length)} Node
                </span>
              </div>
              <div>
                <img src={cpuIcon} alt="" aria-hidden="true" />
                <span>
                  <strong>Platform</strong>
                  {platform}
                </span>
              </div>
            </div>


            <div className="project-detail__actions">
              <a className="project-detail__button project-detail__button--primary" href="/ide">
                Buka ArduFlow IDE
              </a>
              {project.projectFileUrl ? (
                <a
                  className="project-detail__button project-detail__button--secondary"
                  href={project.projectFileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Unduh File Proyek
                </a>
              ) : (
                <a className="project-detail__button project-detail__button--secondary" href="#rangkaian">
                  Lihat Rangkaian
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="project-detail__info">
          <section className="detail-card detail-components" aria-labelledby="components-title">
            <h2 id="components-title">Alat dan Komponen</h2>
            {tools.length ? (
              <ul>
                {tools.map((tool, index) => (
                  <li key={`${getToolName(tool)}-${index}`}>
                    <img src={cpuIcon} alt="" aria-hidden="true" />
                    <span>{getToolName(tool)}</span>
                    <strong>{getToolSpec(tool)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyDetail>Belum ada data alat dan komponen.</EmptyDetail>
            )}
          </section>

          <section
            id="rangkaian"
            className="detail-card detail-nodes"
            aria-labelledby="nodes-title"
          >
            <h2 id="nodes-title">Node ArduFlow yang Digunakan</h2>
            {nodes.length ? (
              <>
                <ul>
                  {nodes.map((node, index) => (
                    <li key={`${node.name || node.title || "node"}-${index}`}>
                      <span className={`detail-node-icon detail-node-icon--${index % 2 === 0 ? "red" : "green"}`}>
                        <img src={index % 2 === 0 ? zapIcon : workflowIcon} alt="" aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{node.name || node.title || `Node ${index + 1}`}</strong>
                        {getNodeDescription(node)}
                      </span>
                    </li>
                  ))}
                </ul>
                <NodePreview nodes={nodes} />
              </>
            ) : (
              <EmptyDetail>Belum ada data node ArduFlow.</EmptyDetail>
            )}
          </section>
        </div>
      </div>

      <section className="detail-steps" aria-labelledby="steps-title">
        <h2 id="steps-title">Langkah Pengerjaan</h2>
        {steps.length ? (
          <div className="detail-steps__grid">
            {steps.map((step, index) => (
              <article className="detail-step" key={`${getStepTitle(step, index)}-${index}`}>
                <strong>{index + 1}</strong>
                <h3>{getStepTitle(step, index)}</h3>
                <p>{getStepBody(step)}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyDetail>Belum ada data langkah pengerjaan.</EmptyDetail>
        )}
      </section>
    </section>
  );
}
