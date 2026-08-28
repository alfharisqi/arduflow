import { generate } from '@pdfme/generator';
import { barcodes, image, line, rectangle, text } from '@pdfme/schemas';
import loraFontUrl from '../../assets/fonts/Lora.ttf?url';
import playfairDisplayFontUrl from '../../assets/fonts/PlayfairDisplay.ttf?url';
import poppinsFontUrl from '../../assets/fonts/Poppins.ttf?url';
import robotoFontUrl from '../../assets/fonts/Roboto.ttf?url';
import {
  arduflowCertificateTemplate,
  sampleCertificateData,
} from './certificateTemplate.js';

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;

const certificatePlugins = {
  text,
  image,
  rectangle,
  line,
  qrcode: barcodes.qrcode,
};

const CERTIFICATE_NUMBER_PREFIX = 'AFW-CERT';
const DEFAULT_CERTIFICATE_FONT_NAME = 'Roboto';

export const certificateFontOptions = [
  {
    id: 'roboto',
    name: 'Roboto',
    pdfName: DEFAULT_CERTIFICATE_FONT_NAME,
    cssFamily: 'Roboto, Arial, sans-serif',
    url: robotoFontUrl,
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    pdfName: 'PlayfairDisplay',
    cssFamily: '"Playfair Display", Georgia, serif',
    url: playfairDisplayFontUrl,
  },
  {
    id: 'lora',
    name: 'Lora',
    pdfName: 'Lora',
    cssFamily: 'Lora, Georgia, serif',
    url: loraFontUrl,
  },
  {
    id: 'poppins',
    name: 'Poppins',
    pdfName: 'Poppins',
    cssFamily: 'Poppins, Arial, sans-serif',
    url: poppinsFontUrl,
  },
];

const fontDataCache = new Map();

export function getCertificateFontOption(fontId) {
  return certificateFontOptions.find((font) => font.id === fontId) || certificateFontOptions[0];
}

export function getCertificateFontCssFamily(fontId) {
  return getCertificateFontOption(fontId).cssFamily;
}

async function getCertificateFontData(fontOption) {
  if (fontOption.data) {
    return fontOption.data;
  }

  if (!fontOption.url) {
    return getCertificateFontData(certificateFontOptions[0]);
  }

  if (!fontDataCache.has(fontOption.url)) {
    fontDataCache.set(
      fontOption.url,
      fetch(fontOption.url).then((response) => {
        if (!response.ok) {
          throw new Error(`Font sertifikat gagal dimuat: ${fontOption.name}`);
        }

        return response.arrayBuffer();
      }),
    );
  }

  return fontDataCache.get(fontOption.url);
}

async function createCertificateFontConfig(fontId) {
  const fontOption = getCertificateFontOption(fontId);
  const data = await getCertificateFontData(fontOption);

  return {
    fontName: fontOption.pdfName,
    font: {
      [fontOption.pdfName]: {
        data,
        fallback: true,
      },
    },
  };
}

function cleanString(value, fallback = '') {
  const textValue = value === null || value === undefined ? '' : String(value);
  return textValue.trim() || fallback;
}

function cleanParticipantName(value, fallback = '') {
  return cleanString(value, fallback)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/^\s*\d+\s*[\).\-\:]\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim() || fallback;
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
    participantName: cleanParticipantName(data.participantName || data.userName, sampleCertificateData.participantName).toUpperCase(),
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
    certificateFontId: cleanString(data.certificateFontId, 'roboto'),
  };
}

function percentToMm(value, total) {
  return (Number(value) / 100) * total;
}

function getCustomFieldValue(fieldKey, fieldLayout, input) {
  const fallbackContent = cleanString(fieldLayout?.content, '');

  const values = {
    brandLogo: fallbackContent || input.organizationName,
    certificateTitle: input.certificateTitle,
    participantName: input.participantName,
    programName: input.programName,
    description: fallbackContent || input.description,
    issueDate: input.issueDate,
    authorizedBy: input.authorizedBy,
    authorizedRole: input.authorizedRole,
    certificateNumber: input.certificateNumber,
    verificationUrl: input.verificationUrl,
    signatureImage: fallbackContent || input.authorizedBy,
  };

  return cleanString(values[fieldKey], fallbackContent);
}

function createCustomTextSchema(fieldKey, fieldLayout, input, fontName) {
  const width = percentToMm(fieldLayout.width || 30, PAGE_WIDTH);
  const fontSize = Number(fieldLayout.fontSize || 12);
  const height = Math.max(6, fontSize * 0.55);
  const x = percentToMm(fieldLayout.x || 50, PAGE_WIDTH) - width / 2;
  const y = percentToMm(fieldLayout.y || 50, PAGE_HEIGHT) - height / 2;

  return {
    name: fieldKey,
    type: 'text',
    content: '',
    position: {
      x: Math.max(0, Math.min(PAGE_WIDTH - width, x)),
      y: Math.max(0, Math.min(PAGE_HEIGHT - height, y)),
    },
    width,
    height,
    fontName,
    fontSize,
    lineHeight: fieldKey === 'description' ? 1.2 : 1,
    alignment: fieldLayout.align || 'left',
    verticalAlignment: 'middle',
    fontColor: '#0b1b30',
    dynamicFontSize: {
      min: Math.max(5, Math.floor(fontSize * 0.45)),
      max: fontSize,
      fit: fieldKey === 'description' ? 'vertical' : 'horizontal',
    },
    overflow: 'fit',
  };
}

function createCustomImageSchema(fieldKey, fieldLayout) {
  const width = percentToMm(fieldLayout.width || 18, PAGE_WIDTH);
  const height = fieldLayout.height
    ? percentToMm(fieldLayout.height, PAGE_HEIGHT)
    : fieldKey === 'verificationUrl'
      ? width
      : Math.max(10, width * 0.35);
  const x = percentToMm(fieldLayout.x || 50, PAGE_WIDTH) - width / 2;
  const y = percentToMm(fieldLayout.y || 50, PAGE_HEIGHT) - height / 2;

  return {
    name: fieldKey,
    type: 'image',
    content: '',
    position: {
      x: Math.max(0, Math.min(PAGE_WIDTH - width, x)),
      y: Math.max(0, Math.min(PAGE_HEIGHT - height, y)),
    },
    width,
    height,
  };
}

function createCustomQrSchema(fieldLayout) {
  const width = percentToMm(fieldLayout.width || 12, PAGE_WIDTH);
  const x = percentToMm(fieldLayout.x || 50, PAGE_WIDTH) - width / 2;
  const y = percentToMm(fieldLayout.y || 50, PAGE_HEIGHT) - width / 2;

  return {
    name: 'verificationUrl',
    type: 'qrcode',
    content: '',
    position: {
      x: Math.max(0, Math.min(PAGE_WIDTH - width, x)),
      y: Math.max(0, Math.min(PAGE_HEIGHT - width, y)),
    },
    width,
    height: width,
    backgroundColor: '#ffffff',
    barColor: '#0b1b30',
  };
}

function createCustomCertificateTemplate(customTemplate = {}, input = {}, fontName = DEFAULT_CERTIFICATE_FONT_NAME) {
  const fields = customTemplate.fields || {};
  const dynamicSchemas = [];
  const pdfInput = {};

  Object.entries(fields).forEach(([fieldKey, fieldLayout]) => {
    if (!fieldLayout?.visible) {
      return;
    }

    if (fieldKey === 'verificationUrl') {
      dynamicSchemas.push(createCustomQrSchema(fieldLayout));
      pdfInput.verificationUrl = input.verificationUrl;
      return;
    }

    if (fieldLayout.imageUrl) {
      dynamicSchemas.push(createCustomImageSchema(fieldKey, fieldLayout));
      pdfInput[fieldKey] = fieldLayout.imageUrl;
      return;
    }

    dynamicSchemas.push(createCustomTextSchema(fieldKey, fieldLayout, input, fontName));
    pdfInput[fieldKey] = getCustomFieldValue(fieldKey, fieldLayout, input);
  });

  return {
    template: {
      basePdf: {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        padding: [0, 0, 0, 0],
        staticSchema: customTemplate.backgroundUrl
          ? [{
              name: 'customBackground',
              type: 'image',
              content: customTemplate.backgroundUrl,
              position: { x: 0, y: 0 },
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              readOnly: true,
            }]
          : [],
      },
      schemas: [dynamicSchemas],
    },
    input: pdfInput,
  };
}

export async function generateArduflowCertificatePdf(data = {}) {
  const input = normalizeCertificateInput(data);
  const customTemplate = data.customTemplate;
  const fontConfig = await createCertificateFontConfig(input.certificateFontId);

  if (customTemplate?.fields) {
    const customPdf = createCustomCertificateTemplate(customTemplate, input, fontConfig.fontName);

    return generate({
      template: customPdf.template,
      inputs: [customPdf.input],
      plugins: certificatePlugins,
      options: {
        font: fontConfig.font,
        author: 'Arduflow IDE',
        creator: 'Arduflow Custom Certificate Generator',
        keywords: ['Arduflow', 'Certificate', 'Workshop'],
        lang: 'en',
        subject: input.programName,
        title: `${input.certificateTitle} - ${input.participantName}`,
      },
    });
  }

  return generate({
    template: arduflowCertificateTemplate,
    inputs: [input],
    plugins: certificatePlugins,
    options: {
      font: fontConfig.font,
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
  const blob = await createCertificatePdfBlob({
    ...input,
    customTemplate: data.customTemplate,
  });
  const fileName = `${sanitizeCertificateFileName(input.participantName)}-${sanitizeCertificateFileName(input.certificateNumber)}.pdf`;

  return new File([blob], fileName, { type: 'application/pdf' });
}
