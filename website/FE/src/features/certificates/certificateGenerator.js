import {
  generate,
} from '@pdfme/generator';

import {
  barcodes,
  image,
  line,
  rectangle,
  text,
} from '@pdfme/schemas';

import {
  arduflowCertificateTemplate,
  sampleCertificateData,
} from './certificateTemplate.js';

const certificatePlugins = {
  text,
  image,
  rectangle,
  line,
  qrcode:
    barcodes.qrcode,
};

const CERTIFICATE_NUMBER_PREFIX =
  'AFW-CERT';

/**
 * Membersihkan nilai text.
 */
function cleanString(
  value,
  fallback = ''
) {
  const textValue =
    value === null ||
    value === undefined
      ? ''
      : String(value);

  return (
    textValue.trim() ||
    fallback
  );
}

/**
 * Parse Date secara aman.
 */
function parseDate(value) {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

/**
 * Format:
 *
 * 27 Agustus 2026
 */
export function formatIndonesianDate(
  value
) {
  const parsedDate =
    parseDate(value);

  const date =
    parsedDate ||
    new Date();

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
}

/**
 * Membuat filename aman.
 */
function sanitizeCertificateFileName(
  value
) {
  return (
    cleanString(
      value,
      'sertifikat'
    )
      .toLowerCase()

      .normalize('NFD')

      .replace(
        /[\u0300-\u036f]/g,
        ''
      )

      .replace(
        /[^a-z0-9]+/g,
        '-'
      )

      .replace(
        /^-+|-+$/g,
        ''
      )

      .slice(
        0,
        80
      ) ||
    'sertifikat'
  );
}

/**
 * Nomor certificate existing.
 */
export function createCertificateNumber(
  seed = Date.now()
) {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const safeSeed =
    String(seed)
      .replace(
        /\D/g,
        ''
      )
      .slice(-6)
      .padStart(
        6,
        '0'
      );

  return `${CERTIFICATE_NUMBER_PREFIX}-${year}-${safeSeed}`;
}

/**
 * Endpoint verification existing tetap dipakai.
 */
export function createVerificationUrl(
  certificateNumber,
  origin =
    globalThis.window
      ?.location
      ?.origin ||
    'https://arduflow.id'
) {
  const number =
    cleanString(
      certificateNumber,
      createCertificateNumber()
    );

  const normalizedOrigin =
    String(origin)
      .replace(
        /\/$/,
        ''
      );

  return (
    `${normalizedOrigin}` +
    `/verify-certificate/` +
    `${encodeURIComponent(
      number
    )}`
  );
}

/**
 * Menentukan status certificate.
 */
function resolveVerificationStatus(
  data
) {
  /**
   * Prioritaskan field khusus verification.
   */
  const explicitStatus =
    cleanString(
      data.verificationStatus ||
        data.certificateVerificationStatus ||
        data.verifyStatus
    );

  if (explicitStatus) {
    return explicitStatus;
  }

  /**
   * Jika certificate di-revoke.
   */
  const genericStatus =
    cleanString(
      data.status
    ).toLowerCase();

  if (
    genericStatus ===
      'revoked' ||
    genericStatus ===
      'revoke' ||
    genericStatus ===
      'dibatalkan'
  ) {
    return 'Dicabut';
  }

  return 'Terverifikasi';
}

/**
 * Helper display program.
 */
function createProgramDisplay(
  value
) {
  const cleaned =
    cleanString(value);

  if (!cleaned) {
    return '';
  }

  return `"${cleaned}"`;
}

/**
 * ============================================================
 * NORMALIZE INPUT
 * ============================================================
 */
export function normalizeCertificateInput(
  data = {}
) {
  /**
   * Certificate number.
   */
  const certificateNumber =
    cleanString(
      data.certificateNumber,
      createCertificateNumber()
    );

  /**
   * Verification URL.
   */
  const verificationUrl =
    cleanString(
      data.verificationUrl,
      createVerificationUrl(
        certificateNumber
      )
    );

  /**
   * Workshop / program.
   */
  const programName =
    cleanString(
      data.programName ||
        data.workshopTitle ||
        data.programTitle ||
        data.certificateName,
      sampleCertificateData.programName
    );

  /**
   * Participant.
   *
   * Sengaja TIDAK menggunakan .toUpperCase().
   */
  const participantName =
    cleanString(
      data.participantName ||
        data.userName ||
        data.name,
      sampleCertificateData.participantName
    );

  /**
   * Certificate title.
   */
  const certificateTitle =
    cleanString(
      data.certificateTitle,
      'SERTIFIKAT KELULUSAN'
    ).toUpperCase();

  /**
   * Deskripsi.
   */
  const description =
    cleanString(
      data.description,
      'Atas kelulusan dan keberhasilannya dalam menyelesaikan pelatihan teknis:'
    );

  /**
   * Issue date.
   */
  const rawIssueDate =
    data.issueDate ||
    data.issuedAt ||
    data.completedAt ||
    new Date();

  const issueDate =
    formatIndonesianDate(
      rawIssueDate
    );

  /**
   * Instructor.
   */
  const authorizedBy =
    cleanString(
      data.authorizedBy ||
        data.instructor ||
        data.instructorName,
      'Instruktur Arduflow'
    );

  /**
   * Instructor role.
   */
  const authorizedRole =
    cleanString(
      data.authorizedRole ||
        data.instructorRole,
      'Instruktur'
    );

  /**
   * Organization.
   */
  const organizationName =
    cleanString(
      data.organizationName ||
        data.institution ||
        data.organizer,
      'Arduflow Academy Indonesia'
    );

  const organizerName =
    cleanString(
      data.organizerName ||
        data.organizer ||
        organizationName,
      organizationName
    );

  /**
   * Verification status.
   */
  const verificationStatus =
    resolveVerificationStatus(
      data
    );

  /**
   * Text pendek di bawah QR.
   */
  const verificationAdditionalInfo =
    cleanString(
      data.verificationAdditionalInfo,
      certificateNumber
    );

  return {
    /**
     * Fallback.
     */
    ...sampleCertificateData,

    /**
     * Main participant data.
     */
    participantName,

    certificateTitle,

    /**
     * Program.
     */
    programName,

    programNameDisplay:
      createProgramDisplay(
        programName
      ),

    /**
     * Description.
     */
    description,

    /**
     * Date.
     */
    issueDate,

    issueDateDisplay:
      `Diterbitkan pada: ${issueDate}`,

    /**
     * Certificate number.
     */
    certificateNumber,

    /**
     * Verification.
     */
    verificationStatus,

    verificationUrl,

    verificationUrlText:
      verificationUrl.replace(
        /^https?:\/\//i,
        ''
      ),

    verificationAdditionalInfo,

    /**
     * Signature.
     */
    authorizedBy,

    authorizedRole,

    organizationName,

    organizerName,
  };
}

/**
 * ============================================================
 * GENERATE PDF
 * ============================================================
 */
export async function generateArduflowCertificatePdf(
  data = {}
) {
  const input =
    normalizeCertificateInput(
      data
    );

  return generate({
    template:
      arduflowCertificateTemplate,

    inputs: [
      input,
    ],

    plugins:
      certificatePlugins,

    options: {
      author:
        'Arduflow IDE',

      creator:
        'Arduflow Certificate Generator',

      keywords: [
        'Arduflow',
        'Certificate',
        'Workshop',
        'IoT',
      ],

      lang:
        'id',

      subject:
        input.programName,

      title:
        `${input.certificateTitle} - ${input.participantName}`,
    },
  });
}

/**
 * ============================================================
 * CREATE BLOB
 * ============================================================
 */
export async function createCertificatePdfBlob(
  data = {}
) {
  const pdfBytes =
    await generateArduflowCertificatePdf(
      data
    );

  return new Blob(
    [
      pdfBytes,
    ],
    {
      type:
        'application/pdf',
    }
  );
}

/**
 * ============================================================
 * CREATE FILE
 * ============================================================
 *
 * Ini yang biasanya dipakai AdminCertificates
 * untuk upload PDF ke backend.
 */
export async function createCertificatePdfFile(
  data = {}
) {
  const input =
    normalizeCertificateInput(
      data
    );

  const pdfBytes =
    await generateArduflowCertificatePdf(
      input
    );

  const blob =
    new Blob(
      [
        pdfBytes,
      ],
      {
        type:
          'application/pdf',
      }
    );

  const participant =
    sanitizeCertificateFileName(
      input.participantName
    );

  const number =
    sanitizeCertificateFileName(
      input.certificateNumber
    );

  const fileName =
    `${participant}-${number}.pdf`;

  return new File(
    [
      blob,
    ],
    fileName,
    {
      type:
        'application/pdf',
    }
  );
}

/**
 * ============================================================
 * DOWNLOAD BLOB
 * ============================================================
 */
export function downloadBlob(
  blob,
  fileName
) {
  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      'a'
    );

  anchor.href =
    url;

  anchor.download =
    fileName;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  /**
   * Jangan langsung revoke.
   * Beberapa browser butuh sedikit waktu.
   */
  setTimeout(
    () => {
      URL.revokeObjectURL(
        url
      );
    },
    1000
  );
}

/**
 * ============================================================
 * DOWNLOAD CERTIFICATE PDF
 * ============================================================
 */
export async function downloadArduflowCertificatePdf(
  data = {}
) {
  const input =
    normalizeCertificateInput(
      data
    );

  const pdfBytes =
    await generateArduflowCertificatePdf(
      input
    );

  const blob =
    new Blob(
      [
        pdfBytes,
      ],
      {
        type:
          'application/pdf',
      }
    );

  const participant =
    sanitizeCertificateFileName(
      input.participantName
    );

  const number =
    sanitizeCertificateFileName(
      input.certificateNumber
    );

  const fileName =
    `${participant}-${number}.pdf`;

  downloadBlob(
    blob,
    fileName
  );
}