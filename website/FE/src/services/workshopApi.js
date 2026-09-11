import {
  apiEndpoint,
  backendAssetUrl,
} from './apiEndpoints.js';


/* =========================================================
   WORKSHOP API ENDPOINT
========================================================= */

const WORKSHOP_API_URL = apiEndpoint(
  import.meta.env.VITE_WORKSHOP_API_URL,
  '/api/workshop-api.php',
);


/* =========================================================
   HELPER — OBJECT
========================================================= */

function asObject(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   HELPER — PARSE PAYLOAD WORKSHOP
   Mendukung payload object maupun JSON string.
========================================================= */

function parseWorkshopPayload(workshop) {
  const source = workshop?.payload;

  if (
    source &&
    typeof source === 'object' &&
    !Array.isArray(source)
  ) {
    return source;
  }

  if (
    typeof source === 'string' &&
    source.trim()
  ) {
    try {
      const parsed = JSON.parse(source);

      return asObject(parsed);
    } catch {
      return {};
    }
  }

  return {};
}


/* =========================================================
   HELPER — PARSE RESPONSE API
========================================================= */

async function parseApiResponse(response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(
      `Response workshop bukan JSON yang valid. HTTP ${response.status}.`,
    );
  }
}


/* =========================================================
   HELPER — AMBIL LIST WORKSHOP DARI RESPONSE
   Mendukung beberapa bentuk response backend.
========================================================= */

function extractWorkshopList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.workshops)) {
    return payload.workshops;
  }

  if (Array.isArray(payload?.data?.workshops)) {
    return payload.data.workshops;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}


/* =========================================================
   HELPER — COVER IMAGE
========================================================= */

function getCoverImageUrl(
  coverImage,
  workshop,
) {
  let coverUrl = '';

  if (
    typeof coverImage === 'string'
  ) {
    coverUrl = coverImage;
  } else {
    coverUrl =
      coverImage?.url ||
      coverImage?.file_url ||
      '';
  }

  coverUrl =
    coverUrl ||
    workshop?.coverImageUrl ||
    workshop?.cover_image_url ||
    '';

  return backendAssetUrl(coverUrl);
}


/* =========================================================
   NORMALIZE WORKSHOP
   Satu bentuk data untuk seluruh frontend.
========================================================= */

function normalizeWorkshop(source) {
  const workshop = asObject(source);

  const payload =
    parseWorkshopPayload(workshop);

  const schedule =
    asObject(payload.schedule);

  const publication =
    asObject(payload.publication);

  const media =
    asObject(payload.media);


  /* -------------------------------------------------------
     COVER IMAGE
  ------------------------------------------------------- */

  const coverImage =
    media.coverImage ||
    workshop.coverImage ||
    workshop.cover_image ||
    null;

  const coverImageUrl =
    getCoverImageUrl(
      coverImage,
      workshop,
    );


  /* -------------------------------------------------------
     REGISTRATION FEE
  ------------------------------------------------------- */

  const registrationFee =
    payload.registrationFee ??
    payload.registration_fee ??
    payload.price ??
    workshop.registrationFee ??
    workshop.registration_fee ??
    workshop.price ??
    '';


  /* -------------------------------------------------------
     NORMALIZED DATA
  ------------------------------------------------------- */

  return {
    id:
      workshop.id ??
      null,

    slug:
      payload.slug ||
      workshop.slug ||
      '',

    title:
      payload.title ||
      workshop.title ||
      'Workshop Tanpa Judul',

    summary:
      payload.summary ||
      workshop.summary ||
      'Pelajari Arduino dan IoT bersama ArduFlow.',

    description:
      workshop.description ||
      payload.description ||
      payload.summary ||
      payload.about ||
      '',

    about:
      payload.about ||
      workshop.about ||
      '',


    /* -----------------------------------------------------
       INFORMASI PROGRAM
    ----------------------------------------------------- */

    level:
      payload.level ||
      workshop.level ||
      '',

    duration:
      payload.duration ||
      workshop.duration ||
      '',

    platform:
      payload.platform ||
      workshop.platform ||
      '',

    category:
      payload.category ||
      workshop.category ||
      'Workshop',

    method:
      workshop.method ||
      payload.method ||
      payload.type ||
      workshop.type ||
      '',


    /* -----------------------------------------------------
       LOKASI
    ----------------------------------------------------- */

    location:
      payload.location ||
      workshop.location ||
      payload.platform ||
      workshop.platform ||
      workshop.meetingUrl ||
      workshop.meeting_url ||
      '-',

    meetingUrl:
      workshop.meetingUrl ||
      workshop.meeting_url ||
      payload.meetingUrl ||
      payload.meeting_url ||
      '',


    /* -----------------------------------------------------
       TANGGAL
       Tetap mendukung format service baru dan format lama.
    ----------------------------------------------------- */

    startsAt:
      workshop.startsAt ||
      workshop.starts_at ||
      workshop.start_at ||
      schedule.date ||
      workshop.date ||
      null,

    endsAt:
      workshop.endsAt ||
      workshop.ends_at ||
      workshop.end_at ||
      schedule.endDate ||
      schedule.end_date ||
      workshop.endDate ||
      workshop.end_date ||
      null,


    /* -----------------------------------------------------
       WAKTU
       Fallback row.time dan row.timezone dikembalikan.
    ----------------------------------------------------- */

    timeText:
      schedule.time ||
      payload.time ||
      workshop.time ||
      '',

    timezone:
      schedule.timezone ||
      payload.timezone ||
      workshop.timezone ||
      '',


    /* -----------------------------------------------------
       HARGA
    ----------------------------------------------------- */

    price:
      payload.price ??
      workshop.price ??
      '',

    registrationFee,


    /* -----------------------------------------------------
       DETAIL TAMBAHAN
    ----------------------------------------------------- */

    facilities:
      payload.facilities ||
      workshop.facilities ||
      '',

    bringItems:
      payload.bringItems ||
      payload.bring_items ||
      workshop.bringItems ||
      workshop.bring_items ||
      '',

    capacity:
      Number(
        workshop.capacity ??
        payload.capacity ??
        0,
      ) || 0,


    /* -----------------------------------------------------
       PUBLICATION
    ----------------------------------------------------- */

    status:
      publication.status ||
      workshop.status ||
      'draft',

    visibility:
      publication.visibility ||
      workshop.visibility ||
      'Publik',


    /* -----------------------------------------------------
       CERTIFICATE
    ----------------------------------------------------- */

    certificateEnabled:
      Boolean(
        workshop.certificateEnabled ??
        workshop.certificate_enabled ??
        payload.certificateEnabled ??
        payload.certificate_enabled ??
        false,
      ),


    /* -----------------------------------------------------
       MEDIA
    ----------------------------------------------------- */

    coverImage,

    coverImageUrl,

    gallery:
      Array.isArray(media.gallery)
        ? media.gallery
        : [],


    /* -----------------------------------------------------
       RAW PAYLOAD
       Tetap tersedia jika halaman lain membutuhkan data asli.
    ----------------------------------------------------- */

    raw:
      payload,
  };
}


/* =========================================================
   PUBLIC WORKSHOP
========================================================= */

export function isPublicWorkshop(
  workshop,
) {
  const status = String(
    workshop?.status || '',
  )
    .trim()
    .toLowerCase();

  return [
    'published',
    'terbit',
    'terjadwal',
    'selesai',
  ].includes(status);
}


/* =========================================================
   FETCH ALL WORKSHOPS
========================================================= */

export async function fetchWorkshops() {
  const response = await fetch(
    WORKSHOP_API_URL,
    {
      method: 'GET',

      headers: {
        Accept:
          'application/json',
      },
    },
  );


  const payload =
    await parseApiResponse(
      response,
    );


  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.message ||
      `Gagal memuat workshop. HTTP ${response.status}`,
    );
  }


  const workshops =
    extractWorkshopList(
      payload,
    );


  return workshops.map(
    normalizeWorkshop,
  );
}


/* =========================================================
   FETCH WORKSHOP DETAIL
========================================================= */

export async function fetchWorkshopDetail(
  {
    id,
    slug,
  } = {},
) {
  const cleanId = String(
    id || '',
  ).trim();

  const cleanSlug = String(
    slug || '',
  ).trim();


  /* -------------------------------------------------------
     CARI BERDASARKAN ID
  ------------------------------------------------------- */

  if (cleanId) {
    const response = await fetch(
      `${WORKSHOP_API_URL}?id=${encodeURIComponent(cleanId)}`,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',
        },
      },
    );


    const payload =
      await parseApiResponse(
        response,
      );


    if (
      !response.ok ||
      payload?.success === false
    ) {
      throw new Error(
        payload?.message ||
        `Gagal memuat detail workshop. HTTP ${response.status}`,
      );
    }


    const workshop =
      payload?.workshop ||
      payload?.data?.workshop ||
      (
        payload?.data &&
        !Array.isArray(
          payload.data,
        )
          ? payload.data
          : null
      );


    if (!workshop) {
      throw new Error(
        'Workshop tidak ditemukan.',
      );
    }


    return normalizeWorkshop(
      workshop,
    );
  }


  /* -------------------------------------------------------
     CARI BERDASARKAN SLUG
  ------------------------------------------------------- */

  if (cleanSlug) {
    const workshops =
      await fetchWorkshops();


    const workshop =
      workshops.find(
        (item) =>
          String(
            item.slug || '',
          ) === cleanSlug,
      );


    if (workshop) {
      return workshop;
    }
  }


  throw new Error(
    'Workshop tidak ditemukan.',
  );
}