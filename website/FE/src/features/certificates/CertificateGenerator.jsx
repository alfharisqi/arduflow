import {
  downloadArduflowCertificatePdf,
  normalizeCertificateInput,
} from './certificateGenerator.js';

import {
  certificateTemplateOptions,
} from './certificateTemplate.js';

/**
 * ============================================================
 * PREVIEW STYLES
 * ============================================================
 *
 * Inline agar tidak bentrok dengan CSS preview lama.
 */
const previewStyles = {
  certificate: {
    position: 'relative',

    width: '100%',

    aspectRatio:
      '297 / 210',

    overflow: 'hidden',

    boxSizing:
      'border-box',

    background:
      '#ffffff',

    border:
      '1px solid #F97316',

    fontFamily:
      'Arial, Helvetica, sans-serif',

    color:
      '#111827',
  },

  content: {
    position: 'absolute',

    top: '6%',

    right: '5%',

    bottom: '4%',

    left: '5%',
  },

  header: {
    position: 'relative',

    display: 'flex',

    alignItems:
      'flex-start',

    justifyContent:
      'space-between',

    width: '100%',

    minHeight:
      '14%',
  },

  logo: {
    display:
      'inline-flex',

    alignItems:
      'center',

    margin: 0,

    fontSize:
      'clamp(18px, 2.3vw, 32px)',

    fontWeight: 900,

    letterSpacing:
      '-0.055em',

    lineHeight: 1,
  },

  logoArdu: {
    color:
      '#111827',
  },

  logoFlow: {
    color:
      '#F97316',
  },

  headerInfo: {
    display:
      'grid',

    gap: 3,

    justifyItems:
      'end',

    maxWidth:
      '48%',

    fontSize:
      'clamp(7px, 1vw, 13px)',

    lineHeight: 1.35,

    textAlign:
      'right',
  },

  headerInfoRow: {
    display: 'flex',

    flexWrap: 'wrap',

    justifyContent:
      'flex-end',

    alignItems:
      'center',

    gap: 5,
  },

  certificateNumber: {
    color:
      '#111827',

    fontWeight: 800,

    overflowWrap:
      'anywhere',
  },

  verified: {
    color:
      '#16A34A',

    fontWeight: 800,
  },

  divider: {
    width: '100%',

    height: 1,

    marginTop:
      'clamp(6px, 1vw, 12px)',

    background:
      '#D1D5DB',
  },

  main: {
    position: 'absolute',

    top: '29%',

    left: '4%',

    right: '4%',

    display: 'flex',

    flexDirection:
      'column',

    alignItems:
      'center',

    textAlign:
      'center',
  },

  title: {
    margin: 0,

    color:
      '#111827',

    fontFamily:
      'Georgia, "Times New Roman", serif',

    fontSize:
      'clamp(18px, 3.1vw, 43px)',

    fontWeight: 500,

    letterSpacing:
      '0.12em',

    lineHeight: 1.08,
  },

  recipientLabel: {
    margin:
      'clamp(9px, 1.3vw, 18px) 0 0',

    color:
      '#1F2937',

    fontSize:
      'clamp(8px, 1.15vw, 16px)',
  },

  participantContainer: {
    maxWidth:
      '88%',

    marginTop:
      'clamp(8px, 1.2vw, 16px)',
  },

  participantName: {
    display: 'block',

    color:
      '#111827',

    fontSize:
      'clamp(20px, 4vw, 54px)',

    fontWeight: 800,

    lineHeight: 1.05,

    overflowWrap:
      'anywhere',
  },

  participantUnderline: {
    width: '100%',

    height:
      'clamp(1px, 0.2vw, 3px)',

    marginTop: 5,

    background:
      '#F97316',
  },

  description: {
    maxWidth:
      '90%',

    margin:
      'clamp(9px, 1.3vw, 17px) 0 0',

    color:
      '#374151',

    fontSize:
      'clamp(8px, 1.1vw, 15px)',

    lineHeight: 1.35,
  },

  programName: {
    maxWidth:
      '90%',

    margin:
      'clamp(3px, 0.55vw, 8px) 0 0',

    color:
      '#111827',

    fontSize:
      'clamp(9px, 1.35vw, 18px)',

    fontWeight: 800,

    lineHeight: 1.3,

    overflowWrap:
      'anywhere',
  },

  footer: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    display: 'flex',

    alignItems:
      'flex-end',

    justifyContent:
      'space-between',

    gap: 20,
  },

  signature: {
    width:
      '45%',

    display: 'flex',

    flexDirection:
      'column',

    alignItems:
      'flex-start',

    textAlign:
      'left',
  },

  issueDate: {
    display:
      'block',

    marginBottom:
      'clamp(26px, 4vw, 50px)',

    color:
      '#4B5563',

    fontSize:
      'clamp(7px, 1vw, 13px)',
  },

  signatureLine: {
    width:
      'clamp(80px, 44%, 180px)',

    height: 1,

    marginBottom: 5,

    background:
      '#9CA3AF',
  },

  instructorName: {
    maxWidth:
      '100%',

    color:
      '#111827',

    fontSize:
      'clamp(9px, 1.25vw, 17px)',

    fontWeight: 800,

    lineHeight: 1.15,

    overflowWrap:
      'anywhere',
  },

  instructorRole: {
    display: 'block',

    marginTop: 2,

    color:
      '#374151',

    fontSize:
      'clamp(7px, 0.9vw, 12px)',
  },

  organization: {
    display: 'block',

    marginTop: 1,

    color:
      '#4B5563',

    fontSize:
      'clamp(6px, 0.85vw, 11px)',
  },

  verification: {
    width:
      '36%',

    display: 'flex',

    flexDirection:
      'column',

    alignItems:
      'flex-end',

    textAlign:
      'right',
  },

  fakeQr: {
    width:
      'clamp(50px, 7vw, 95px)',

    aspectRatio: '1',

    marginBottom: 7,

    boxSizing:
      'border-box',

    border:
      '4px solid #ffffff',

    outline:
      '1px solid #111827',

    backgroundColor:
      '#ffffff',

    backgroundImage: `
      linear-gradient(
        90deg,
        #111827 25%,
        transparent 25%,
        transparent 50%,
        #111827 50%,
        #111827 75%,
        transparent 75%
      ),
      linear-gradient(
        #111827 25%,
        transparent 25%,
        transparent 50%,
        #111827 50%,
        #111827 75%,
        transparent 75%
      )
    `,

    backgroundSize:
      '10px 10px',
  },

  qrInstruction: {
    color:
      '#1F2937',

    fontSize:
      'clamp(6px, 0.85vw, 11px)',

    lineHeight: 1.35,
  },

  qrAdditionalInfo: {
    display: 'block',

    marginTop: 2,

    maxWidth:
      '100%',

    color:
      '#4B5563',

    fontSize:
      'clamp(6px, 0.8vw, 10px)',

    overflowWrap:
      'anywhere',
  },
};

/**
 * ============================================================
 * CERTIFICATE PREVIEW
 * ============================================================
 */
export function CertificateGeneratorPreview({
  data,
}) {
  const input =
    normalizeCertificateInput(
      data
    );

  return (
    <article
      aria-label="Preview sertifikat Arduflow"
      style={
        previewStyles.certificate
      }
    >
      <div
        style={
          previewStyles.content
        }
      >
        {/* HEADER */}
        <header
          style={
            previewStyles.header
          }
        >
          <p
            style={
              previewStyles.logo
            }
          >
            <span
              style={
                previewStyles.logoArdu
              }
            >
              ARDU
            </span>

            <span
              style={
                previewStyles.logoFlow
              }
            >
              FLOW
            </span>
          </p>

          <div
            style={
              previewStyles.headerInfo
            }
          >
            <div
              style={
                previewStyles.headerInfoRow
              }
            >
              <span>
                No. Sertifikat:
              </span>

              <strong
                style={
                  previewStyles.certificateNumber
                }
              >
                {
                  input.certificateNumber
                }
              </strong>
            </div>

            <div
              style={
                previewStyles.headerInfoRow
              }
            >
              <span>
                Status:
              </span>

              <strong
                style={
                  previewStyles.verified
                }
              >
                {
                  input.verificationStatus
                }
              </strong>
            </div>
          </div>
        </header>

        <div
          style={
            previewStyles.divider
          }
        />

        {/* MAIN CONTENT */}
        <main
          style={
            previewStyles.main
          }
        >
          <h2
            style={
              previewStyles.title
            }
          >
            {
              input.certificateTitle
            }
          </h2>

          <p
            style={
              previewStyles.recipientLabel
            }
          >
            Diberikan secara resmi kepada:
          </p>

          <div
            style={
              previewStyles.participantContainer
            }
          >
            <strong
              style={
                previewStyles.participantName
              }
            >
              {
                input.participantName
              }
            </strong>

            <div
              style={
                previewStyles.participantUnderline
              }
            />
          </div>

          <p
            style={
              previewStyles.description
            }
          >
            {
              input.description
            }
          </p>

          <p
            style={
              previewStyles.programName
            }
          >
            {
              input.programNameDisplay
            }
          </p>
        </main>

        {/* FOOTER */}
        <footer
          style={
            previewStyles.footer
          }
        >
          {/* SIGNATURE */}
          <div
            style={
              previewStyles.signature
            }
          >
            <span
              style={
                previewStyles.issueDate
              }
            >
              {
                input.issueDateDisplay
              }
            </span>

            <div
              style={
                previewStyles.signatureLine
              }
            />

            <strong
              style={
                previewStyles.instructorName
              }
            >
              {
                input.authorizedBy
              }
            </strong>

            <span
              style={
                previewStyles.instructorRole
              }
            >
              {
                input.authorizedRole
              }
            </span>

            <span
              style={
                previewStyles.organization
              }
            >
              {
                input.organizationName
              }
            </span>
          </div>

          {/* VERIFICATION */}
          <div
            style={
              previewStyles.verification
            }
          >
            {/*
              Ini hanya preview visual.
              Saat PDF generate, QR sebenarnya berasal
              dari schema qrcode pdfme.
            */}
            <div
              aria-hidden="true"
              style={
                previewStyles.fakeQr
              }
            />

            <span
              style={
                previewStyles.qrInstruction
              }
            >
              Scan QR Code untuk verifikasi keaslian.
            </span>

            <small
              style={
                previewStyles.qrAdditionalInfo
              }
            >
              {
                input.verificationAdditionalInfo
              }
            </small>
          </div>
        </footer>
      </div>
    </article>
  );
}

/**
 * ============================================================
 * CERTIFICATE GENERATOR COMPONENT
 * ============================================================
 */
export function CertificateGenerator({
  value,
  onChange,
  onGenerated,
}) {
  const handleDownload =
    async () => {
      await downloadArduflowCertificatePdf(
        value
      );

      if (
        typeof onGenerated ===
        'function'
      ) {
        onGenerated();
      }
    };

  return (
    <section className="certificate-generator-panel">
      <label className="certificate-generator-template">
        <span>
          Template Sertifikat
        </span>

        <select
          value={
            value?.templateId ||
            certificateTemplateOptions[0]?.id ||
            ''
          }
          onChange={(
            event
          ) => {
            if (
              typeof onChange !==
              'function'
            ) {
              return;
            }

            onChange({
              ...value,

              templateId:
                event.target.value,
            });
          }}
        >
          {certificateTemplateOptions.map(
            (
              template
            ) => (
              <option
                key={
                  template.id
                }
                value={
                  template.id
                }
              >
                {
                  template.name
                }
              </option>
            )
          )}
        </select>
      </label>

      <CertificateGeneratorPreview
        data={
          value
        }
      />

      <button
        type="button"
        className="admin-certificates-primary"
        onClick={
          handleDownload
        }
      >
        Generate Preview PDF
      </button>
    </section>
  );
}