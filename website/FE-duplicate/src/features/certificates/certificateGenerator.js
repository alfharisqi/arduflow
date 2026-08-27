import { generate } from '@pdfme/generator';
import { barcodes, image, line, rectangle, text } from '@pdfme/schemas';
import {
  arduflowCertificateTemplate,
  sampleCertificateData,
} from './certificateTemplate.js';

const certificatePlugins = {
  text,
  image,
  rectangle,
  line,
  qrcode: barcodes.qrcode,
};

const CERTIFICATE_NUMBER_PREFIX = 'AFW-CERT';

function cleanString(value, fallback = '') {
  const textValue = value === null || value === undefined ? '' : String(value);
  return textValue.trim() || fallback;
}

function formatIndonesianDate(value) {
  if (!value) {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function sanitizeCertificateFileName(value) {
  return cleanString(value, 'sertifikat')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'sertifikat';
}

export function createCertificateNumber(seed = Date.now()) {
  const date = new Date();
  const year = date.getFullYear();
  const safeSeed = String(seed).replace(/\D/g, '').slice(-6).padStart(6, '0');

  return `${CERTIFICATE_NUMBER_PREFIX}-${year}-${safeSeed}`;
}

export function createVerificationUrl(certificateNumber, origin = globalThis.window?.location?.origin || 'https://arduflow.id') {
  const number = cleanString(certificateNumber, createCertificateNumber());
  return `${origin.replace(/\/$/, '')}/verify-certificate/${encodeURIComponent(number)}`;
}

export function normalizeCertificateInput(data = {}) {
  const certificateNumber = cleanString(data.certificateNumber, createCertificateNumber());
  const verificationUrl = cleanString(data.verificationUrl, createVerificationUrl(certificateNumber));
  const programName = cleanString(data.programName || data.workshopTitle, 'Workshop Arduflow IDE');
  const organizationName = cleanString(data.organizationName || data.organizer, 'Arduflow IDE');

  return {
    ...sampleCertificateData,
    participantName: cleanString(data.participantName || data.userName, sampleCertificateData.participantName).toUpperCase(),
    certificateTitle: cleanString(data.certificateTitle, 'Sertifikat Penyelesaian'),
    programName,
    description: cleanString(
      data.description,
      `Atas keberhasilannya menyelesaikan ${programName} di Arduflow IDE.`
    ),
    issueDate: formatIndonesianDate(data.issueDate || data.issuedAt),
    certificateNumber,
    authorizedBy: cleanString(data.authorizedBy || data.instructor, 'Instruktur Arduflow'),
    authorizedRole: cleanString(data.authorizedRole, 'Instruktur Arduflow IDE'),
    organizationName,
    organizerName: cleanString(data.organizerName || data.organizer || organizationName, organizationName),
    verificationUrl,
    verificationUrlText: verificationUrl.replace(/^https?:\/\//i, ''),
  };
}

export async function generateArduflowCertificatePdf(data = {}) {
  const input = normalizeCertificateInput(data);

  return generate({
    template: arduflowCertificateTemplate,
    inputs: [input],
    plugins: certificatePlugins,
    options: {
      author: 'Arduflow IDE',
      creator: 'Arduflow Certificate Generator',
      keywords: ['Arduflow', 'Certificate', 'Workshop'],
      lang: 'en',
      subject: input.programName,
      title: `${input.certificateTitle} - ${input.participantName}`,
    },
  });
}

export async function createCertificatePdfBlob(data = {}) {
  const pdfBytes = await generateArduflowCertificatePdf(data);

  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function createCertificatePdfFile(data = {}) {
  const input = normalizeCertificateInput(data);
  const blob = await createCertificatePdfBlob(input);
  const fileName = `${sanitizeCertificateFileName(input.participantName)}-${sanitizeCertificateFileName(input.certificateNumber)}.pdf`;

  return new File([blob], fileName, { type: 'application/pdf' });
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadArduflowCertificatePdf(data = {}) {
  const input = normalizeCertificateInput(data);
  const blob = await createCertificatePdfBlob(input);
  const fileName = `${sanitizeCertificateFileName(input.participantName)}-${sanitizeCertificateFileName(input.certificateNumber)}.pdf`;

  downloadBlob(blob, fileName);
}
