import { apiEndpoint } from './apiEndpoints.js';

const MATERIAL_API_URL = apiEndpoint(
  import.meta.env.VITE_MATERIAL_API_URL,
  '/api/materi-api.php',
);

const ENV_DEPLOY_URL = String(
  import.meta.env.VITE_DEPLOY_URL || '',
)
  .trim()
  .replace(/\/+$/, '');

function inferDeployUrlFromApi(apiUrl) {
  try {
    const parsed = new URL(
      apiUrl,
      window.location.origin,
    );

    const deployPath = parsed.pathname
      .replace(/\/api\/materi-api\.php\/?$/i, '')
      .replace(/\/+$/, '');

    return `${parsed.origin}${deployPath}`;
  } catch {
    return '';
  }
}

const DEPLOY_URL =
  ENV_DEPLOY_URL ||
  inferDeployUrlFromApi(MATERIAL_API_URL);

const MATERI_IMAGE_BASE_URL =
  DEPLOY_URL
    ? `${DEPLOY_URL}/uploads/materi`
    : '';

function extractImageFileName(value) {
  const candidate = String(value || '').trim();

  if (!candidate) {
    return '';
  }

  try {
    const decoded = decodeURIComponent(candidate);

    const parsed = new URL(
      decoded,
      window.location.origin,
    );

    const queryFile =
      parsed.searchParams.get('file');

    if (queryFile) {
      return String(queryFile)
        .split(/[\\/]/)
        .pop() || '';
    }

    const pathFile =
      parsed.pathname
        .split('/')
        .pop() || '';

    if (
      /\.(png|jpe?g|webp|gif|svg)$/i.test(
        pathFile,
      )
    ) {
      return pathFile;
    }
  } catch {
    const normalized =
      candidate.replace(/\\/g, '/');

    const fileName =
      normalized.split('/').pop() || '';

    if (
      /\.(png|jpe?g|webp|gif|svg)$/i.test(
        fileName,
      )
    ) {
      return fileName;
    }
  }

  return '';
}

export function resolveMateriImageUrl(
  value,
  fallbackFileName = '',
) {
  const candidate =
    String(value || '').trim();

  if (/^(data:image\/|blob:)/i.test(candidate)) {
    return candidate;
  }

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);

      if (
        parsed.pathname.includes(
          '/uploads/materi/',
        )
      ) {
        return candidate;
      }
    } catch {
      // lanjut pakai nama file
    }
  }

  const fileName =
    extractImageFileName(candidate) ||
    extractImageFileName(fallbackFileName);

  if (fileName && MATERI_IMAGE_BASE_URL) {
    return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
      fileName,
    )}`;
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  return '';
}

function normalizeBoolean(
  value,
  defaultValue = false,
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (
    ['1', 'true', 'yes', 'on', 'aktif', 'active']
      .includes(normalized)
  ) {
    return true;
  }

  if (
    [
      '0',
      'false',
      'no',
      'off',
      'nonaktif',
      'inactive',
    ].includes(normalized)
  ) {
    return false;
  }

  return defaultValue;
}

function normalizeSlide(slide, index) {
  const order = Number(
    slide.order ||
      slide.slide_order ||
      slide.display_order ||
      index + 1,
  );

  const imageName =
    slide.image_name ||
    slide.image?.file_name ||
    slide.image?.name ||
    '';

  const rawImageUrl =
    slide.image_url ||
    slide.image_path ||
    slide.imageUrl ||
    slide.image?.url ||
    '';

  return {
    id:
      slide.id ||
      `slide-${order}`,

    order,

    title:
      slide.title ||
      `Materi ${order}`,

    contentType:
      slide.content_type ||
      slide.contentType ||
      'text',

    content:
      slide.content ||
      slide.body_text ||
      slide.bodyText ||
      '',

    estimatedTime:
      slide.estimated_time ||
      slide.estimatedTime ||
      '',

    status:
      slide.status ||
      'published',

    imageName,

    imageUrl:
      resolveMateriImageUrl(
        rawImageUrl,
        imageName,
      ),

    videoUrl:
      slide.video_url ||
      slide.videoUrl ||
      '',
  };
}

function normalizeMaterial(item) {
  const slides = Array.isArray(item.slides)
    ? item.slides
        .map(normalizeSlide)
        .sort(
          (a, b) =>
            a.order - b.order,
        )
    : [];

  const cardImageName =
    item.card_image_name ||
    item.cardImageName ||
    item.card_image?.file_name ||
    '';

  const rawCardImageUrl =
    item.card_image_url ||
    item.card_image_path ||
    item.cardImageUrl ||
    item.card_image?.url ||
    '';

  const cardImageUrl =
    resolveMateriImageUrl(
      rawCardImageUrl,
      cardImageName,
    );

  const price = Math.max(
    0,
    Number(
      item.price ??
        item.material_price ??
        item.page_settings?.price ??
        0,
    ) || 0,
  );

  const accessType =
    item.access_type ||
    item.accessType ||
    item.page_settings?.access_type ||
    (price > 0 ? 'Premium' : 'Gratis');

  return {
    id: item.id,

    title:
      item.title ||
      'Materi Tanpa Judul',

    slug:
      item.slug ||
      '',

    category:
      item.category ||
      'Umum',

    shortDescription:
      item.short_description ||
      item.shortDescription ||
      '',

    fullDescription:
      item.full_description ||
      item.fullDescription ||
      '',

    cardImageName,
    cardImageUrl,

    difficulty:
      item.difficulty_level ||
      item.difficulty ||
      item.difficultyLevel ||
      'Semua Level',

    estimatedTime:
      item.estimated_time ||
      item.estimatedTime ||
      item.learning_information?.estimated_time ||
      '',

    pageOrder:
      Number(
        item.page_order ||
        item.pageOrder,
      ) || 1,

    displayOrder:
      Number(
        item.display_order ||
        item.displayOrder,
      ) || 1,

    status:
      item.status ||
      'draft',

    active:
      normalizeBoolean(
        item.active,
        true,
      ),

    showOnPage:
      normalizeBoolean(
        item.show_on_page ??
          item.showOnPage,
        true,
      ),

    featured:
      normalizeBoolean(
        item.featured,
        false,
      ),

    comments:
      Number(
        item.comments || 0,
      ) || 0,

    accessType,
    price,

    formattedPrice:
      new Intl.NumberFormat(
        'id-ID',
        {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        },
      ).format(price),

    isPremium:
      String(accessType)
        .trim()
        .toLowerCase()
        .includes('premium') ||
      price > 0,

    featuredOrder:
      Number(
        item.featured_order ||
          item.featuredOrder ||
          0,
      ) || 0,

    userLevel:
      item.user_level ||
      item.userLevel ||
      'semua_pengguna',

    accessRequirement:
      item.access_requirement ||
      item.accessRequirement ||
      '',


    slides,

    totalSlides:
      Number(
        item.total_slides ||
        item.totalSlides,
      ) || slides.length,

    createdAt:
      item.created_at ||
      item.createdAt ||
      null,

    updatedAt:
      item.updated_at ||
      item.updatedAt ||
      null,
  };
}

export function isPublishedMaterial(item) {
  return (
    String(item.status || '')
      .toLowerCase() === 'published' &&
    item.active !== false &&
    item.showOnPage !== false
  );
}

async function parseJsonResponse(
  response,
  fallbackMessage,
) {
  const responseText =
    await response.text();

  let payload = {};

  try {
    payload =
      responseText
        ? JSON.parse(responseText)
        : {};
  } catch {
    throw new Error(
      `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
        0,
        250,
      )}`,
    );
  }

  if (
    !response.ok ||
    payload.success === false
  ) {
    throw new Error(
      payload.message ||
        `${fallbackMessage}. HTTP ${response.status}`,
    );
  }

  return payload;
}

export async function fetchMaterials() {
  const response = await fetch(
    MATERIAL_API_URL,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  );

  const payload =
    await parseJsonResponse(
      response,
      'Gagal memuat materi',
    );

  return (
    payload.data ||
    payload.materials ||
    []
  ).map(normalizeMaterial);
}

export async function fetchMaterial(
  identifier,
) {
  const key =
    String(identifier || '').trim();

  if (!key) {
    throw new Error(
      'ID materi tidak ditemukan di URL.',
    );
  }

  const params =
    new URLSearchParams();

  if (/^\d+$/.test(key)) {
    params.set('id', key);
  } else {
    params.set('slug', key);
  }

  const response = await fetch(
    `${MATERIAL_API_URL}?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  );

  const payload =
    await parseJsonResponse(
      response,
      'Gagal memuat detail materi',
    );

  return normalizeMaterial(
    payload.data ||
      payload.material ||
      {},
  );
}
