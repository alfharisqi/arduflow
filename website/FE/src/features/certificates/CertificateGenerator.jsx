import {
  getCertificateFontCssFamily,
  normalizeCertificateInput,
} from './certificateGenerator.js';

export function CertificateGeneratorPreview({ data }) {
  const input = normalizeCertificateInput(data);
  const previewFontFamily = getCertificateFontCssFamily(input.certificateFontId);

  return (
    <article
      className="certificate-generator-preview"
      aria-label="Preview sertifikat Arduflow"
      style={{ fontFamily: previewFontFamily }}
    >
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

export function CustomCertificatePreview({ data, template }) {
  const input = normalizeCertificateInput(data);
  const previewFontFamily = getCertificateFontCssFamily(input.certificateFontId);

  if (!template?.fields) {
    return <CertificateGeneratorPreview data={data} />;
  }

  return (
    <article className="admin-certificates-template-stage admin-certificates-custom-preview" aria-label="Preview template sertifikat custom">
      {template.backgroundUrl ? (
        <img src={template.backgroundUrl} alt="" />
      ) : (
        <div className="admin-certificates-template-placeholder">Template tanpa background</div>
      )}
      {Object.entries(template.fields).map(([fieldKey, fieldLayout]) => {
        if (!fieldLayout?.visible) {
          return null;
        }

        const fieldValues = {
          brandLogo: fieldLayout.content || input.organizationName,
          certificateTitle: input.certificateTitle,
          participantName: input.participantName,
          programName: input.programName,
          description: fieldLayout.content || input.description,
          issueDate: input.issueDate,
          authorizedBy: input.authorizedBy,
          authorizedRole: input.authorizedRole,
          certificateNumber: input.certificateNumber,
          verificationUrl: 'QR',
          signatureImage: fieldLayout.content || input.authorizedBy,
        };

        if (fieldLayout.imageUrl) {
          return (
            <img
              className="admin-certificates-custom-preview-image"
              src={fieldLayout.imageUrl}
              alt=""
              key={fieldKey}
              style={{
                left: `${fieldLayout.x}%`,
                top: `${fieldLayout.y}%`,
                width: `${fieldLayout.width}%`,
                height: `${fieldLayout.height || 6}%`,
              }}
            />
          );
        }

        return (
          <span
            className={`admin-certificates-template-field is-${fieldKey === 'verificationUrl' ? 'qr' : 'text'}`}
            key={fieldKey}
            style={{
              left: `${fieldLayout.x}%`,
              top: `${fieldLayout.y}%`,
              width: `${fieldLayout.width}%`,
              fontSize: `${fieldLayout.fontSize}px`,
              fontFamily: previewFontFamily,
              textAlign: fieldLayout.align,
            }}
          >
            {fieldValues[fieldKey] || fieldLayout.content}
          </span>
        );
      })}
    </article>
  );
}
