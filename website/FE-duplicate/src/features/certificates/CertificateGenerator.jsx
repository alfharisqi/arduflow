import {
  downloadArduflowCertificatePdf,
  normalizeCertificateInput,
} from './certificateGenerator.js';
import { certificateTemplateOptions } from './certificateTemplate.js';

export function CertificateGeneratorPreview({ data }) {
  const input = normalizeCertificateInput(data);

  return (
    <article className="certificate-generator-preview" aria-label="Preview sertifikat Arduflow">
      <span className="certificate-generator-preview__accent left" />
      <span className="certificate-generator-preview__accent right" />
      <div className="certificate-generator-preview__frame">
        <header className="certificate-generator-preview__header">
          <p className="certificate-generator-preview__logo">
            <span>ardu</span><b>flow</b>
          </p>
          <div>
            <span>SERTIFIKAT</span>
            <strong>{input.certificateTitle}</strong>
            <small>{input.organizationName}</small>
          </div>
        </header>

        <p className="certificate-generator-preview__number">{input.certificateNumber}</p>

        <section className="certificate-generator-preview__body">
          <p className="certificate-generator-preview__eyebrow">Diberikan kepada</p>
          <strong>{input.participantName}</strong>
          <span className="certificate-generator-preview__line" />
          <p className="certificate-generator-preview__description">{input.description}</p>
          <p className="certificate-generator-preview__program">{input.programName}</p>
        </section>

        <footer className="certificate-generator-preview__footer">
          <div className="certificate-generator-preview__signature">
            <small>Tanggal</small>
            <span>{input.issueDate}</span>
            <i />
            <strong>{input.authorizedBy}</strong>
            <small>{input.authorizedRole}</small>
          </div>
          <div className="certificate-generator-preview__qr">
            <span aria-hidden="true" />
            <strong>Verifikasi Sertifikat</strong>
            <small>{input.verificationUrlText}</small>
          </div>
        </footer>
      </div>
    </article>
  );
}

export function CertificateGenerator({ value, onChange, onGenerated }) {
  const handleDownload = async () => {
    await downloadArduflowCertificatePdf(value);

    if (typeof onGenerated === 'function') {
      onGenerated();
    }
  };

  return (
    <section className="certificate-generator-panel">
      <label className="certificate-generator-template">
        <span>Template Sertifikat</span>
        <select
          value={value.templateId}
          onChange={(event) => onChange({ ...value, templateId: event.target.value })}
        >
          {certificateTemplateOptions.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>
      <CertificateGeneratorPreview data={value} />
      <button type="button" className="admin-certificates-primary" onClick={handleDownload}>
        Generate Preview PDF
      </button>
    </section>
  );
}
