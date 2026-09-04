export const ARDUFLOW_CERTIFICATE_TEMPLATE_ID = 'arduflow-ide-clean';

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const NAVY = '#0B1B30';
const DEEP_NAVY = '#13263D';
const TEXT = '#172B45';
const MUTED = '#5E6875';
const ORANGE = '#FF7A00';
const ORANGE_LIGHT = '#FF8A00';
const GOLD = '#FFC800';
const GOLD_LIGHT = '#FFD600';
const PAPER = '#FFFDF8';
const LINE = '#D9DEE7';
const ARDUFLOW_LOGO_DATA_URL = 'data:image/jpeg;base64,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';

function textSchema(name, content, x, y, width, height, options = {}) {
  return {
    name,
    type: 'text',
    content,
    position: { x, y },
    width,
    height,
    readOnly: Boolean(options.readOnly),
    fontSize: options.fontSize ?? 10,
    lineHeight: options.lineHeight ?? 1,
    characterSpacing: options.characterSpacing ?? 0,
    alignment: options.alignment ?? 'left',
    verticalAlignment: options.verticalAlignment ?? 'middle',
    fontColor: options.fontColor ?? TEXT,
    backgroundColor: options.backgroundColor ?? '',
    dynamicFontSize: options.dynamicFontSize,
    overflow: options.overflow,
  };
}

function rectangleSchema(name, x, y, width, height, options = {}) {
  return {
    name,
    type: 'rectangle',
    content: '',
    position: { x, y },
    width,
    height,
    readOnly: true,
    color: options.color ?? '',
    borderColor: options.borderColor ?? options.color ?? LINE,
    borderWidth: options.borderWidth ?? 0,
    radius: options.radius ?? 0,
    opacity: options.opacity,
  };
}

function lineSchema(name, x, y, width, height, color = LINE) {
  return {
    name,
    type: 'line',
    content: '',
    position: { x, y },
    width,
    height,
    readOnly: true,
    color,
  };
}

function imageSchema(name, content, x, y, width, height, options = {}) {
  return {
    name,
    type: 'image',
    content,
    position: { x, y },
    width,
    height,
    readOnly: true,
    opacity: options.opacity,
  };
}

const logoY = 12;
const logoHeight = 18;
const certificateNumberY = logoY + logoHeight + 6;
const recipientLabelY = certificateNumberY + 10 + 7;
const participantNameY = recipientLabelY + 6 + 2;
const underlineY = participantNameY + 14 + 2;
const descriptionY = underlineY + 0.6 + 6;
const programNameY = descriptionY + 11 + 3;
const bottomBlockY = 129;
const instructorNameY = 158;
const instructorRoleY = instructorNameY + 8.6;
const qrY = 128;

const staticSchemas = [
  rectangleSchema('pageBackground', 0, 0, PAGE_WIDTH, PAGE_HEIGHT, { color: PAPER }),

  rectangleSchema('leftNavyAccent', 14.5, 13.5, 1.4, 183, { color: NAVY }),
  rectangleSchema('leftOrangeAccentDark', 15.9, 13.5, 1.1, 183, { color: ORANGE }),
  rectangleSchema('leftOrangeAccent', 17, 13.5, 1, 183, { color: ORANGE_LIGHT }),
  rectangleSchema('leftGoldAccent', 18, 13.5, 1.25, 183, { color: GOLD }),
  rectangleSchema('leftGoldAccentLight', 19.25, 13.5, 0.85, 183, { color: GOLD_LIGHT, opacity: 0.85 }),
  rectangleSchema('rightGoldAccentLight', 276.9, 13.5, 0.85, 183, { color: GOLD_LIGHT, opacity: 0.85 }),
  rectangleSchema('rightGoldAccent', 277.75, 13.5, 1.25, 183, { color: GOLD }),
  rectangleSchema('rightOrangeAccent', 279, 13.5, 1, 183, { color: ORANGE_LIGHT }),
  rectangleSchema('rightOrangeAccentDark', 280, 13.5, 1.1, 183, { color: ORANGE }),
  rectangleSchema('rightNavyAccent', 281.1, 13.5, 1.4, 183, { color: NAVY }),

  rectangleSchema('mainHairline', 23, 13.5, 251, 183, {
    borderColor: '#DCE3ED',
    borderWidth: 0.3,
    radius: 1.2,
  }),

  rectangleSchema('logoBlock', 24, logoY, 66, logoHeight, { color: NAVY, radius: 1 }),
  imageSchema('arduflowLogo', ARDUFLOW_LOGO_DATA_URL, 27.5, logoY + 3.5, 58.5, 11),

  rectangleSchema('certificateNumberPill', 24, certificateNumberY, 66, 10, { color: DEEP_NAVY, radius: 1.6 }),
  rectangleSchema('nameUnderlineOrange', 24, underlineY, 72, 0.45, { color: ORANGE, radius: 0.2 }),
  rectangleSchema('nameUnderlineGold', 96, underlineY, 39, 0.45, { color: GOLD, radius: 0.2 }),
  rectangleSchema('signatureLine', 24, instructorNameY - 8, 72, 0.35, { color: '#B98324', radius: 0.2 }),
  rectangleSchema('footerAccent', 24, 188, 109, 0.25, { color: '#E7EDF5', radius: 0.1 }),
  rectangleSchema('qrAccent', 217, 188, 55, 0.25, { color: '#E7EDF5', radius: 0.1 }),

  textSchema('secondaryTitleLabel', 'SERTIFIKAT', 205, 15, 67, 5.5, {
    readOnly: true,
    fontSize: 9.5,
    alignment: 'right',
    fontColor: MUTED,
    characterSpacing: 1.2,
  }),
  textSchema('givenToLabel', 'Diberikan kepada', 24, recipientLabelY, 95, 6, {
    readOnly: true,
    fontSize: 15,
    fontColor: MUTED,
  }),
  textSchema('dateSubtleLabel', 'Tanggal', 24, bottomBlockY, 42, 5, {
    readOnly: true,
    fontSize: 10.5,
    fontColor: MUTED,
  }),
  textSchema('verifyLabel', 'Verifikasi Sertifikat', 225, 160, 48, 6, {
    readOnly: true,
    fontSize: 9.6,
    alignment: 'center',
    fontColor: TEXT,
  }),
];

const dynamicSchemas = [
  textSchema('certificateNumber', '', 27, certificateNumberY + 2.2, 60, 5.8, {
    fontSize: 8.8,
    alignment: 'center',
    fontColor: '#FFFFFF',
    dynamicFontSize: { min: 5.6, max: 8.8, fit: 'horizontal' },
  }),
  textSchema('certificateTitle', '', 178, 25, 94, 9, {
    fontSize: 15.5,
    alignment: 'right',
    fontColor: TEXT,
    dynamicFontSize: { min: 9, max: 15.5, fit: 'horizontal' },
  }),
  textSchema('participantName', '', 24, participantNameY, 190, 14, {
    fontSize: 31,
    lineHeight: 1.02,
    characterSpacing: 0.7,
    fontColor: NAVY,
    dynamicFontSize: { min: 13, max: 31, fit: 'horizontal' },
    overflow: 'fit',
  }),
  textSchema('description', '', 24, descriptionY, 182, 11, {
    fontSize: 13.2,
    lineHeight: 1.12,
    fontColor: MUTED,
    dynamicFontSize: { min: 8.2, max: 13.2, fit: 'vertical' },
    overflow: 'fit',
  }),
  textSchema('programName', '', 24, programNameY, 180, 10, {
    fontSize: 20,
    fontColor: ORANGE,
    dynamicFontSize: { min: 11, max: 20, fit: 'horizontal' },
  }),
  textSchema('organizationName', '', 198, 38, 74, 6, {
    fontSize: 10.5,
    alignment: 'right',
    fontColor: MUTED,
    dynamicFontSize: { min: 7, max: 10.5, fit: 'horizontal' },
  }),
  textSchema('issueDate', '', 24, bottomBlockY + 7, 86, 7, {
    fontSize: 13.2,
    fontColor: TEXT,
    dynamicFontSize: { min: 8, max: 13.2, fit: 'horizontal' },
  }),
  textSchema('authorizedBy', '', 24, instructorNameY, 74, 7, {
    fontSize: 14.2,
    fontColor: NAVY,
    dynamicFontSize: { min: 8, max: 14.2, fit: 'horizontal' },
  }),
  textSchema('authorizedRole', '', 24, instructorRoleY, 83, 6, {
    fontSize: 11.2,
    fontColor: MUTED,
    dynamicFontSize: { min: 6.8, max: 11.2, fit: 'horizontal' },
  }),
  textSchema('organizerName', '', 143, 188.2, 58, 5, {
    fontSize: 5.3,
    alignment: 'right',
    fontColor: MUTED,
    dynamicFontSize: { min: 4.3, max: 5.3, fit: 'horizontal' },
  }),
  {
    name: 'verificationUrl',
    type: 'qrcode',
    content: '',
    position: { x: 240, y: qrY },
    width: 30,
    height: 30,
    backgroundColor: '#FFFFFF',
    barColor: NAVY,
  },
  textSchema('verificationUrlText', '', 216, 167, 68, 9,
    {
      fontSize: 8.4,
      lineHeight: 1.12,
      alignment: 'center',
      fontColor: MUTED,
      dynamicFontSize: { min: 5, max: 8.4, fit: 'vertical' },
      overflow: 'fit',
    }
  ),
];

export const certificateTemplateOptions = [
  {
    id: ARDUFLOW_CERTIFICATE_TEMPLATE_ID,
    name: 'Arduflow IDE Clean',
    description: 'Landscape, clean, left-aligned, aksen orange-kuning.',
  },
];

export const arduflowCertificateTemplate = {
  basePdf: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    padding: [0, 0, 0, 0],
    staticSchema: staticSchemas,
  },
  schemas: [dynamicSchemas],
};

export const sampleCertificateData = {
  participantName: 'MUHAMMAD ATHALLA FAIZ',
  certificateTitle: 'Sertifikat Workshop Pemula Mahasiswa',
  programName: 'Workshop Pemula Mahasiswa',
  description: 'Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop Arduflow IDE serta mempelajari visual programming untuk pengembangan proyek IoT.',
  issueDate: '17 Agustus 2026',
  certificateNumber: 'AFW-CERT-2026-124579',
  authorizedBy: 'Dimas Permana',
  authorizedRole: 'Instruktur Arduflow IDE',
  organizationName: 'Arduflow IDE',
  organizerName: 'Arduflow IDE',
  verificationUrl: 'https://arduflow.id/verify/AFW-CERT-2026-124579',
  verificationUrlText: 'arduflow.id/verify/AFW-CERT-2026-124579',
};
