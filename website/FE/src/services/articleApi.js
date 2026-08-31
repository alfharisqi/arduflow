const DEPLOY_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/'
).replace(/\/+$/, '');

const ARTICLE_API_URL =
  `${DEPLOY_URL}/api/article-api.php`;

// ======================================================
// LOKASI GAMBAR ARTIKEL
// ======================================================
//
// Server:
// /apk/uploads/web-arduflow-deploy-alfha/uploads/articles/
//
// URL:
// https://arduflow.indobilliard.com/apk/uploads/
// web-arduflow-deploy-alfha/uploads/articles/
// ======================================================

const ARTICLE_STORAGE_URL =
  `${DEPLOY_URL}/uploads/articles`;


// ======================================================
// EXTRACT NAMA FILE GAMBAR
// ======================================================

function extractArticleImageFileName(value) {
  const candidate =
    String(value || '').trim();

  if (!candidate) {
    return '';
  }

  // ----------------------------------------------------
  // Coba membaca sebagai URL
  // ----------------------------------------------------

  try {
    const parsed = new URL(
      candidate,
      window.location.origin
    );

    // --------------------------------------------------
    // URL lama:
    //
    // article-api.php?action=image&file=abc.png
    // --------------------------------------------------

    const action =
      String(
        parsed.searchParams.get(
          'action'
        ) || ''
      ).toLowerCase();

    const queryFile =
      parsed.searchParams.get(
        'file'
      );

    if (
      action === 'image' &&
      queryFile
    ) {
      return (
        String(queryFile)
          .split(/[\\/]/)
          .pop() || ''
      );
    }

    // --------------------------------------------------
    // URL baru:
    //
    // /uploads/articles/abc.png
    // --------------------------------------------------

    if (
      /\/uploads\/articles\//i.test(
        parsed.pathname
      )
    ) {
      return decodeURIComponent(
        parsed.pathname
          .split('/')
          .pop() || ''
      );
    }

    // --------------------------------------------------
    // URL lama:
    //
    // /storage/articles/abc.png
    // /web/storage/articles/abc.png
    // --------------------------------------------------

    if (
      /\/storage\/articles\//i.test(
        parsed.pathname
      )
    ) {
      return decodeURIComponent(
        parsed.pathname
          .split('/')
          .pop() || ''
      );
    }

  } catch {
    // Bukan URL valid.
    // Lanjutkan sebagai nama/path file.
  }


  // ====================================================
  // NAMA FILE LANGSUNG
  // ====================================================

  if (
    /^[^/\\]+\.(jpe?g|png|webp|gif)$/i.test(
      candidate
    )
  ) {
    return candidate;
  }


  // ====================================================
  // PATH FILE
  //
  // uploads/articles/abc.png
  // storage/articles/abc.png
  // ====================================================

  if (
    /(?:uploads|storage)\/articles\//i.test(
      candidate
    )
  ) {
    return (
      candidate
        .split(/[\\/]/)
        .pop() || ''
    );
  }


  return '';
}


// ======================================================
// RESOLVE URL GAMBAR ARTIKEL
// ======================================================

export function resolveArticleImageUrl(
  value,
  fallbackFileName = ''
) {
  const candidate =
    String(value || '').trim();

  // ----------------------------------------------------
  // Cari nama file dari URL/path/nama file
  // ----------------------------------------------------

  const fileName =
    extractArticleImageFileName(
      candidate
    ) ||
    extractArticleImageFileName(
      fallbackFileName
    );


  // ====================================================
  // GAMBAR ARTIKEL DARI SERVER
  // ====================================================

  if (fileName) {
    return (
      `${ARTICLE_STORAGE_URL}/` +
      encodeURIComponent(fileName)
    );
  }


  // ====================================================
  // PREVIEW FILE LOKAL
  // ====================================================

  if (
    /^(data:image\/|blob:)/i.test(
      candidate
    )
  ) {
    return candidate;
  }


  // ====================================================
  // URL EKSTERNAL
  // ====================================================

  if (
    /^https?:\/\//i.test(
      candidate
    )
  ) {
    return candidate;
  }


  return '';
}


// ======================================================
// NORMALIZE BOOLEAN
// ======================================================

function normalizeBoolean(
  value,
  defaultValue = false
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue;
  }

  if (
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (
    typeof value === 'number'
  ) {
    return value !== 0;
  }

  return [
    '1',
    'true',
    'yes',
    'on',
  ].includes(
    String(value)
      .trim()
      .toLowerCase()
  );
}


// ======================================================
// NORMALIZE TAGS
// ======================================================

function normalizeTags(value) {

  // API mengembalikan array
  if (
    Array.isArray(value)
  ) {
    return value
      .map((tag) =>
        String(tag).trim()
      )
      .filter(Boolean);
  }


  // JSON string / comma separated
  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    try {
      const parsed =
        JSON.parse(value);

      if (
        Array.isArray(parsed)
      ) {
        return parsed
          .map((tag) =>
            String(tag).trim()
          )
          .filter(Boolean);
      }

    } catch {
      return value
        .split(/[,;]/)
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean);
    }
  }


  return [];
}


// ======================================================
// NORMALIZE ARTICLE
// ======================================================

export function normalizeArticle(
  item = {}
) {
  const coverImageName =
    String(
      item.cover_image_name ||
      item.coverImageName ||
      ''
    ).trim();


  const coverImageUrl =
    resolveArticleImageUrl(
      item.cover_image_url ||
      item.coverImageUrl ||
      '',
      coverImageName
    );


  return {

    id: Number(
      item.id || 0
    ),

    title: String(
      item.title ||
      'Tanpa Judul'
    ),

    slug: String(
      item.slug || ''
    ),

    category: String(
      item.category ||
      'Umum'
    ),

    author: String(
      item.author ||
      'Admin ArduFlow'
    ),

    excerpt: String(
      item.excerpt || ''
    ),

    content: String(
      item.content || ''
    ),


    // ==================================================
    // GAMBAR
    // ==================================================

    coverImageName,

    coverImageUrl,


    tags:
      normalizeTags(
        item.tags
      ),

    status: String(
      item.status || 'draft'
    ).toLowerCase(),

    featured:
      normalizeBoolean(
        item.featured,
        false
      ),

    viewer: Number(
      item.viewer || 0
    ),

    publishedAt:
      item.published_at ||
      item.publishedAt ||
      null,

    createdAt:
      item.created_at ||
      item.createdAt ||
      null,

    updatedAt:
      item.updated_at ||
      item.updatedAt ||
      null,

    raw: item,
  };
}


// ======================================================
// PARSE API RESPONSE
// ======================================================

async function parseResponse(
  response
) {
  const responseText =
    await response.text();


  // Response kosong
  if (
    !responseText.trim()
  ) {

    if (!response.ok) {
      throw new Error(
        `API artikel mengembalikan HTTP ${response.status}.`
      );
    }

    return {};
  }


  let payload;


  try {
    payload =
      JSON.parse(
        responseText
      );

  } catch {

    const trimmed =
      responseText.trim();


    // Server mengembalikan HTML
    if (
      trimmed.startsWith(
        '<!DOCTYPE'
      ) ||
      trimmed.startsWith(
        '<html'
      )
    ) {
      throw new Error(
        `article-api.php mengembalikan HTML, bukan JSON. Endpoint: ${ARTICLE_API_URL}`
      );
    }


    throw new Error(
      `Response article-api.php bukan JSON valid: ${responseText.slice(
        0,
        180
      )}`
    );
  }


  // Error API
  if (
    !response.ok ||
    payload.success === false
  ) {

    const validationErrors =
      payload?.errors &&
      typeof payload.errors ===
        'object'
        ? Object.values(
            payload.errors
          ).filter(Boolean)
        : [];


    throw new Error(
      validationErrors[0] ||
      payload.message ||
      `Request artikel gagal. HTTP ${response.status}`
    );
  }


  return payload;
}


// ======================================================
// GET SEMUA ARTIKEL
// ======================================================

export async function fetchArticles() {

  const response =
    await fetch(
      ARTICLE_API_URL,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',
        },

        cache: 'no-store',
      }
    );


  const payload =
    await parseResponse(
      response
    );


  const rows =
    Array.isArray(
      payload.data
    )
      ? payload.data
      : [];


  return rows.map(
    normalizeArticle
  );
}


// ======================================================
// GET PUBLISHED ARTICLE
// ======================================================

export async function fetchPublishedArticles() {

  const rows =
    await fetchArticles();


  return rows
    .filter(
      (article) =>
        article.status ===
        'published'
    )
    .sort(
      (
        first,
        second
      ) => {

        const firstDate =
          new Date(
            first.publishedAt ||
            first.createdAt ||
            0
          ).getTime();


        const secondDate =
          new Date(
            second.publishedAt ||
            second.createdAt ||
            0
          ).getTime();


        return (
          secondDate -
          firstDate
        );
      }
    );
}


// ======================================================
// GET 1 ARTICLE
// ======================================================

export async function fetchArticle(
  identifier,
  options = {}
) {

  const key =
    String(
      identifier || ''
    ).trim();


  if (!key) {
    throw new Error(
      'ID atau slug artikel tidak ditemukan.'
    );
  }


  const params =
    new URLSearchParams();


  // Angka = ID
  if (
    /^\d+$/.test(key)
  ) {

    params.set(
      'id',
      key
    );

  } else {

    // Selain angka = slug
    params.set(
      'slug',
      key
    );
  }


  const response =
    await fetch(
      `${ARTICLE_API_URL}?${params.toString()}`,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',
        },

        cache: 'no-store',
      }
    );


  const payload =
    await parseResponse(
      response
    );


  const row =
    Array.isArray(
      payload.data
    )
      ? payload.data[0]
      : null;


  if (!row) {
    throw new Error(
      'Artikel tidak ditemukan.'
    );
  }


  const article =
    normalizeArticle(
      row
    );


  if (
    options.publishedOnly &&
    article.status !==
      'published'
  ) {

    throw new Error(
      'Artikel belum dipublikasikan.'
    );
  }


  return article;
}


// ======================================================
// FORM DATA
// ======================================================

function makeArticleFormData(
  data,
  coverFile
) {

  const formData =
    new FormData();


  const payload = {

    title:
      data.title,

    slug:
      data.slug,

    category:
      data.category,

    author:
      data.author,

    excerpt:
      data.excerpt,

    content:
      data.content,

    tags:
      Array.isArray(
        data.tags
      )
        ? data.tags
        : String(
            data.tags || ''
          )
            .split(/[,;]/)
            .map((tag) =>
              tag.trim()
            )
            .filter(Boolean),

    status:
      data.status,

    featured:
      Boolean(
        data.featured
      ),

    remove_cover:
      Boolean(
        data.removeCover
      ),
  };


  formData.append(
    'payload',
    JSON.stringify(
      payload
    )
  );


  if (
    coverFile instanceof File
  ) {

    formData.append(
      'cover_image',
      coverFile,
      coverFile.name
    );
  }


  return formData;
}


// ======================================================
// CREATE / UPDATE ARTICLE
// ======================================================

export async function saveArticle(
  data,
  options = {}
) {

  const id =
    options.id
      ? String(
          options.id
        )
      : '';


  const requestUrl =
    id
      ? `${ARTICLE_API_URL}?id=${encodeURIComponent(
          id
        )}`
      : ARTICLE_API_URL;


  const response =
    await fetch(
      requestUrl,
      {
        method: 'POST',

        headers: {
          Accept:
            'application/json',
        },

        body:
          makeArticleFormData(
            data,
            options.coverFile
          ),

        cache: 'no-store',
      }
    );


  const payload =
    await parseResponse(
      response
    );


  return {
    ...payload,

    data:
      payload.data
        ? normalizeArticle(
            payload.data
          )
        : null,
  };
}


// ======================================================
// DELETE ARTICLE
// ======================================================

export async function deleteArticle(
  id
) {

  if (!id) {
    throw new Error(
      'ID artikel tidak ditemukan.'
    );
  }


  const response =
    await fetch(
      `${ARTICLE_API_URL}?id=${encodeURIComponent(
        id
      )}`,
      {
        method:
          'DELETE',

        headers: {
          Accept:
            'application/json',
        },

        cache:
          'no-store',
      }
    );


  return parseResponse(
    response
  );
}


// ======================================================
// INCREMENT VIEWER
// ======================================================

export async function incrementArticleView(
  id
) {

  if (!id) {
    return;
  }


  try {

    await fetch(
      `${ARTICLE_API_URL}?action=view&id=${encodeURIComponent(
        id
      )}`,
      {
        method:
          'POST',

        headers: {
          Accept:
            'application/json',
        },

        cache:
          'no-store',
      }
    );

  } catch {
    // Viewer bukan bagian kritis
  }
}


// ======================================================
// EXPORT URL
// ======================================================

export {
  ARTICLE_API_URL,
  ARTICLE_STORAGE_URL,
  DEPLOY_URL,
};