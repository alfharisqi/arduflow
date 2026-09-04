export const ARDUFLOW_CERTIFICATE_TEMPLATE_ID =
  'arduflow-workshop-professional';

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;

const COLORS = {
  white: '#FFFFFF',
  navy: '#111827',
  dark: '#1F2937',
  muted: '#4B5563',
  orange: '#F97316',
  green: '#16A34A',
  divider: '#D1D5DB',
  signature: '#9CA3AF',
};

/**
 * Semua koordinat memakai mm karena basePdf pdfme
 * memakai ukuran 297 x 210 untuk A4 landscape.
 */
export const CERTIFICATE_LAYOUT = {
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  },

  border: {
    x: 3,
    y: 3,
    width: 291,
    height: 204,
  },

  logo: {
    x: 15,
    y: 14,
    width: 53,
    height: 10,
  },

  headerDivider: {
    x: 15,
    y: 32,
    width: 267,
    height: 0.35,
  },

  certificateNumberLabel: {
    x: 192,
    y: 13,
    width: 38,
    height: 6,
  },

  certificateNumber: {
    x: 229,
    y: 13,
    width: 52,
    height: 6,
  },

  statusLabel: {
    x: 210,
    y: 20,
    width: 31,
    height: 5.5,
  },

  verificationStatus: {
    x: 240,
    y: 20,
    width: 41,
    height: 5.5,
  },

  title: {
    x: 30,
    y: 62,
    width: 237,
    height: 16,
  },

  recipientLabel: {
    x: 35,
    y: 82,
    width: 227,
    height: 7,
  },

  participantName: {
    x: 27,
    y: 94,
    width: 243,
    height: 17,
  },

  participantUnderline: {
    x: 67,
    y: 113,
    width: 163,
    height: 0.65,
  },

  description: {
    x: 32,
    y: 120,
    width: 233,
    height: 10,
  },

  programName: {
    x: 30,
    y: 132,
    width: 237,
    height: 18,
  },

  issueDate: {
    x: 15,
    y: 166,
    width: 100,
    height: 7,
  },

  signatureLine: {
    x: 15,
    y: 185,
    width: 53,
    height: 0.35,
  },

  authorizedBy: {
    x: 15,
    y: 188,
    width: 93,
    height: 7,
  },

  authorizedRole: {
    x: 15,
    y: 195,
    width: 93,
    height: 5,
  },

  organizationName: {
    x: 15,
    y: 200,
    width: 100,
    height: 5,
  },

  qrCode: {
    x: 250,
    y: 160,
    width: 28,
    height: 28,
  },

  qrInstruction: {
    x: 202,
    y: 190,
    width: 77,
    height: 5,
  },

  qrAdditionalInfo: {
    x: 202,
    y: 196,
    width: 77,
    height: 5,
  },
};

/**
 * Helper schema text.
 */
function textSchema(
  name,
  content,
  x,
  y,
  width,
  height,
  options = {}
) {
  const schema = {
    name,
    type: 'text',
    content,
    position: {
      x,
      y,
    },
    width,
    height,
    readOnly: Boolean(options.readOnly),

    fontSize:
      options.fontSize ?? 10,

    lineHeight:
      options.lineHeight ?? 1,

    characterSpacing:
      options.characterSpacing ?? 0,

    alignment:
      options.alignment ?? 'left',

    verticalAlignment:
      options.verticalAlignment ?? 'middle',

    fontColor:
      options.fontColor ?? COLORS.dark,

    backgroundColor:
      options.backgroundColor ?? '',
  };

  if (options.dynamicFontSize) {
    schema.dynamicFontSize =
      options.dynamicFontSize;
  }

  if (options.overflow) {
    schema.overflow =
      options.overflow;
  }

  return schema;
}

/**
 * Helper rectangle.
 */
function rectangleSchema(
  name,
  x,
  y,
  width,
  height,
  options = {}
) {
  return {
    name,
    type: 'rectangle',
    content: '',

    position: {
      x,
      y,
    },

    width,
    height,

    readOnly: true,

    color:
      options.color ?? '',

    borderColor:
      options.borderColor ??
      options.color ??
      COLORS.divider,

    borderWidth:
      options.borderWidth ?? 0,

    radius:
      options.radius ?? 0,

    opacity:
      options.opacity,
  };
}

/**
 * ============================================================
 * STATIC SCHEMAS
 * ============================================================
 *
 * Semua elemen yang selalu sama untuk setiap sertifikat.
 */
const staticSchemas = [
  /**
   * Background.
   */
  rectangleSchema(
    'pageBackground',
    0,
    0,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    {
      color: COLORS.white,
    }
  ),

  /**
   * Border orange tipis di sekeliling sertifikat.
   */
  rectangleSchema(
    'outerBorder',
    CERTIFICATE_LAYOUT.border.x,
    CERTIFICATE_LAYOUT.border.y,
    CERTIFICATE_LAYOUT.border.width,
    CERTIFICATE_LAYOUT.border.height,
    {
      color: '',
      borderColor: COLORS.orange,
      borderWidth: 0.45,
      radius: 0,
    }
  ),

  /**
   * Logo ARDUFLOW.
   *
   * Sengaja dibuat dari text agar kode ini bisa langsung
   * copy-paste tanpa tergantung file asset.
   */
  textSchema(
    'arduflowLogoArdu',
    'ARDU',
    CERTIFICATE_LAYOUT.logo.x,
    CERTIFICATE_LAYOUT.logo.y,
    25,
    CERTIFICATE_LAYOUT.logo.height,
    {
      readOnly: true,
      fontSize: 13.5,
      fontColor: COLORS.navy,
      characterSpacing: -0.3,
    }
  ),

  textSchema(
    'arduflowLogoFlow',
    'FLOW',
    CERTIFICATE_LAYOUT.logo.x + 22.5,
    CERTIFICATE_LAYOUT.logo.y,
    28,
    CERTIFICATE_LAYOUT.logo.height,
    {
      readOnly: true,
      fontSize: 13.5,
      fontColor: COLORS.orange,
      characterSpacing: -0.3,
    }
  ),

  /**
   * Divider header.
   */
  rectangleSchema(
    'headerDivider',
    CERTIFICATE_LAYOUT.headerDivider.x,
    CERTIFICATE_LAYOUT.headerDivider.y,
    CERTIFICATE_LAYOUT.headerDivider.width,
    CERTIFICATE_LAYOUT.headerDivider.height,
    {
      color: COLORS.divider,
    }
  ),

  /**
   * Label nomor sertifikat.
   */
  textSchema(
    'certificateNumberLabel',
    'No. Sertifikat:',
    CERTIFICATE_LAYOUT.certificateNumberLabel.x,
    CERTIFICATE_LAYOUT.certificateNumberLabel.y,
    CERTIFICATE_LAYOUT.certificateNumberLabel.width,
    CERTIFICATE_LAYOUT.certificateNumberLabel.height,
    {
      readOnly: true,
      fontSize: 8.5,
      alignment: 'right',
      fontColor: COLORS.dark,
    }
  ),

  /**
   * Label status.
   */
  textSchema(
    'verificationStatusLabel',
    'Status:',
    CERTIFICATE_LAYOUT.statusLabel.x,
    CERTIFICATE_LAYOUT.statusLabel.y,
    CERTIFICATE_LAYOUT.statusLabel.width,
    CERTIFICATE_LAYOUT.statusLabel.height,
    {
      readOnly: true,
      fontSize: 8.2,
      alignment: 'right',
      fontColor: COLORS.dark,
    }
  ),

  /**
   * Label penerima.
   */
  textSchema(
    'recipientLabel',
    'Diberikan secara resmi kepada:',
    CERTIFICATE_LAYOUT.recipientLabel.x,
    CERTIFICATE_LAYOUT.recipientLabel.y,
    CERTIFICATE_LAYOUT.recipientLabel.width,
    CERTIFICATE_LAYOUT.recipientLabel.height,
    {
      readOnly: true,
      fontSize: 10.3,
      alignment: 'center',
      fontColor: COLORS.dark,
    }
  ),

  /**
   * Garis orange di bawah nama peserta.
   */
  rectangleSchema(
    'participantUnderline',
    CERTIFICATE_LAYOUT.participantUnderline.x,
    CERTIFICATE_LAYOUT.participantUnderline.y,
    CERTIFICATE_LAYOUT.participantUnderline.width,
    CERTIFICATE_LAYOUT.participantUnderline.height,
    {
      color: COLORS.orange,
    }
  ),

  /**
   * Garis tanda tangan.
   */
  rectangleSchema(
    'signatureLine',
    CERTIFICATE_LAYOUT.signatureLine.x,
    CERTIFICATE_LAYOUT.signatureLine.y,
    CERTIFICATE_LAYOUT.signatureLine.width,
    CERTIFICATE_LAYOUT.signatureLine.height,
    {
      color: COLORS.signature,
    }
  ),

  /**
   * Keterangan QR.
   */
  textSchema(
    'qrInstruction',
    'Scan QR Code untuk verifikasi keaslian.',
    CERTIFICATE_LAYOUT.qrInstruction.x,
    CERTIFICATE_LAYOUT.qrInstruction.y,
    CERTIFICATE_LAYOUT.qrInstruction.width,
    CERTIFICATE_LAYOUT.qrInstruction.height,
    {
      readOnly: true,
      fontSize: 7,
      alignment: 'right',
      fontColor: COLORS.dark,
    }
  ),
];

/**
 * ============================================================
 * DYNAMIC SCHEMAS
 * ============================================================
 *
 * Semua field yang berasal dari API / database.
 */
const dynamicSchemas = [
  /**
   * Nomor sertifikat.
   */
  textSchema(
    'certificateNumber',
    '',
    CERTIFICATE_LAYOUT.certificateNumber.x,
    CERTIFICATE_LAYOUT.certificateNumber.y,
    CERTIFICATE_LAYOUT.certificateNumber.width,
    CERTIFICATE_LAYOUT.certificateNumber.height,
    {
      fontSize: 8.7,
      alignment: 'right',
      fontColor: COLORS.navy,

      dynamicFontSize: {
        min: 5.8,
        max: 8.7,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Status.
   */
  textSchema(
    'verificationStatus',
    '',
    CERTIFICATE_LAYOUT.verificationStatus.x,
    CERTIFICATE_LAYOUT.verificationStatus.y,
    CERTIFICATE_LAYOUT.verificationStatus.width,
    CERTIFICATE_LAYOUT.verificationStatus.height,
    {
      fontSize: 8.2,
      alignment: 'right',
      fontColor: COLORS.green,

      dynamicFontSize: {
        min: 5.5,
        max: 8.2,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Judul sertifikat.
   */
  textSchema(
    'certificateTitle',
    '',
    CERTIFICATE_LAYOUT.title.x,
    CERTIFICATE_LAYOUT.title.y,
    CERTIFICATE_LAYOUT.title.width,
    CERTIFICATE_LAYOUT.title.height,
    {
      fontSize: 25,
      lineHeight: 1,
      characterSpacing: 1.8,
      alignment: 'center',
      fontColor: COLORS.navy,

      dynamicFontSize: {
        min: 15,
        max: 25,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Nama peserta.
   */
  textSchema(
    'participantName',
    '',
    CERTIFICATE_LAYOUT.participantName.x,
    CERTIFICATE_LAYOUT.participantName.y,
    CERTIFICATE_LAYOUT.participantName.width,
    CERTIFICATE_LAYOUT.participantName.height,
    {
      fontSize: 29,
      lineHeight: 1,
      alignment: 'center',
      fontColor: COLORS.navy,

      dynamicFontSize: {
        min: 13,
        max: 29,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Deskripsi.
   */
  textSchema(
    'description',
    '',
    CERTIFICATE_LAYOUT.description.x,
    CERTIFICATE_LAYOUT.description.y,
    CERTIFICATE_LAYOUT.description.width,
    CERTIFICATE_LAYOUT.description.height,
    {
      fontSize: 10.2,
      lineHeight: 1.15,
      alignment: 'center',
      fontColor: COLORS.dark,

      dynamicFontSize: {
        min: 7,
        max: 10.2,
        fit: 'vertical',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Nama workshop.
   *
   * Tinggi 18 mm supaya judul panjang bisa turun menjadi
   * sekitar dua baris tanpa menabrak footer.
   */
  textSchema(
    'programNameDisplay',
    '',
    CERTIFICATE_LAYOUT.programName.x,
    CERTIFICATE_LAYOUT.programName.y,
    CERTIFICATE_LAYOUT.programName.width,
    CERTIFICATE_LAYOUT.programName.height,
    {
      fontSize: 13,
      lineHeight: 1.15,
      alignment: 'center',
      fontColor: COLORS.navy,

      dynamicFontSize: {
        min: 7.5,
        max: 13,
        fit: 'vertical',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Issue date.
   */
  textSchema(
    'issueDateDisplay',
    '',
    CERTIFICATE_LAYOUT.issueDate.x,
    CERTIFICATE_LAYOUT.issueDate.y,
    CERTIFICATE_LAYOUT.issueDate.width,
    CERTIFICATE_LAYOUT.issueDate.height,
    {
      fontSize: 8.8,
      alignment: 'left',
      fontColor: COLORS.muted,

      dynamicFontSize: {
        min: 6.5,
        max: 8.8,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Nama instruktur.
   */
  textSchema(
    'authorizedBy',
    '',
    CERTIFICATE_LAYOUT.authorizedBy.x,
    CERTIFICATE_LAYOUT.authorizedBy.y,
    CERTIFICATE_LAYOUT.authorizedBy.width,
    CERTIFICATE_LAYOUT.authorizedBy.height,
    {
      fontSize: 10,
      alignment: 'left',
      fontColor: COLORS.navy,

      dynamicFontSize: {
        min: 6.5,
        max: 10,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Role.
   */
  textSchema(
    'authorizedRole',
    '',
    CERTIFICATE_LAYOUT.authorizedRole.x,
    CERTIFICATE_LAYOUT.authorizedRole.y,
    CERTIFICATE_LAYOUT.authorizedRole.width,
    CERTIFICATE_LAYOUT.authorizedRole.height,
    {
      fontSize: 7.2,
      alignment: 'left',
      fontColor: COLORS.dark,

      dynamicFontSize: {
        min: 5.2,
        max: 7.2,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * Institution / organization.
   */
  textSchema(
    'organizationName',
    '',
    CERTIFICATE_LAYOUT.organizationName.x,
    CERTIFICATE_LAYOUT.organizationName.y,
    CERTIFICATE_LAYOUT.organizationName.width,
    CERTIFICATE_LAYOUT.organizationName.height,
    {
      fontSize: 6.7,
      alignment: 'left',
      fontColor: COLORS.muted,

      dynamicFontSize: {
        min: 5,
        max: 6.7,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),

  /**
   * QR asli dari verificationUrl.
   */
  {
    name: 'verificationUrl',

    type: 'qrcode',

    content: '',

    position: {
      x: CERTIFICATE_LAYOUT.qrCode.x,
      y: CERTIFICATE_LAYOUT.qrCode.y,
    },

    width:
      CERTIFICATE_LAYOUT.qrCode.width,

    height:
      CERTIFICATE_LAYOUT.qrCode.height,

    backgroundColor:
      COLORS.white,

    barColor:
      '#000000',
  },

  /**
   * Informasi kecil di bawah QR.
   */
  textSchema(
    'verificationAdditionalInfo',
    '',
    CERTIFICATE_LAYOUT.qrAdditionalInfo.x,
    CERTIFICATE_LAYOUT.qrAdditionalInfo.y,
    CERTIFICATE_LAYOUT.qrAdditionalInfo.width,
    CERTIFICATE_LAYOUT.qrAdditionalInfo.height,
    {
      fontSize: 6.5,
      alignment: 'right',
      fontColor: COLORS.muted,

      dynamicFontSize: {
        min: 4.8,
        max: 6.5,
        fit: 'horizontal',
      },

      overflow: 'fit',
    }
  ),
];

export const certificateTemplateOptions = [
  {
    id:
      ARDUFLOW_CERTIFICATE_TEMPLATE_ID,

    name:
      'Template Sertifikat Workshop ArduFlow',

    description:
      'A4 Landscape, minimalis, border orange, signature dan QR verification.',
  },
];

export const arduflowCertificateTemplate = {
  basePdf: {
    width:
      PAGE_WIDTH,

    height:
      PAGE_HEIGHT,

    padding:
      [0, 0, 0, 0],

    staticSchema:
      staticSchemas,
  },

  schemas: [
    dynamicSchemas,
  ],
};

/**
 * Hanya fallback untuk preview / development.
 *
 * Pada generate sebenarnya nilainya akan ditimpa
 * data dari API melalui normalizeCertificateInput().
 */
export const sampleCertificateData = {
  participantName:
    'Muhammad Athallarik Faizal',

  certificateTitle:
    'SERTIFIKAT KELULUSAN',

  programName:
    'Workshop ArduFlow IDE',

  programNameDisplay:
    '"Workshop ArduFlow IDE"',

  description:
    'Atas kelulusan dan keberhasilannya dalam menyelesaikan pelatihan teknis:',

  issueDate:
    '27 Agustus 2026',

  issueDateDisplay:
    'Diterbitkan pada: 27 Agustus 2026',

  certificateNumber:
    'AFW-CERT-2026-000001',

  verificationStatus:
    'Terverifikasi',

  authorizedBy:
    'Instruktur Arduflow',

  authorizedRole:
    'Instruktur',

  organizationName:
    'Arduflow Academy Indonesia',

  organizerName:
    'Arduflow Academy Indonesia',

  verificationUrl:
    'https://arduflow.id/verify-certificate/AFW-CERT-2026-000001',

  verificationUrlText:
    'arduflow.id/verify-certificate/AFW-CERT-2026-000001',

  verificationAdditionalInfo:
    'AFW-CERT-2026-000001',
};