const MATERI_API_URL =
  import.meta.env.VITE_MATERI_API_URL ||
  'http://192.168.130.11:8000/api/materi-api.php';

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();

  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function normalizeChapter(chapter, index) {
  const order = Number(
    chapter?.order ||
      chapter?.chapter_order ||
      index + 1
  );

  return {
    id:
      chapter?.id ??
      chapter?.chapter_id ??
      `chapter-${order}`,

    order,

    title:
      chapter?.title ||
      chapter?.chapter_title ||
      `Bab ${order}`,

    virtual: normalizeBoolean(
      chapter?.virtual,
      false
    ),
  };
}

function normalizeSlide(slide, index) {
  const order = Number(
    slide?.order ||
      slide?.slide_order ||
      slide?.display_order ||
      index + 1
  );

  const imageUrl =
    slide?.image_url ||
    slide?.image_path ||
    slide?.image?.url ||
    '';

  const chapterId =
    slide?.chapter_id ??
    slide?.chapterId ??
    null;

  return {
    id:
      slide?.id ||
      `slide-${order}`,

    order,

    title:
      slide?.title ||
      `Slide ${order}`,

    contentType:
      slide?.content_type ||
      slide?.contentType ||
      'text',

    content:
      slide?.content ||
      slide?.body_text ||
      slide?.bodyText ||
      '',

    bodyText:
      slide?.body_text ||
      slide?.bodyText ||
      slide?.content ||
      '',

    estimatedTime:
      slide?.estimated_time ||
      slide?.estimatedTime ||
      '',

    status:
      slide?.status ||
      'published',

    imageName:
      slide?.image_name ||
      slide?.image?.file_name ||
      '',

    imageUrl,

    imageType:
      slide?.image_type ||
      slide?.image?.file_type ||
      '',

    imageSize:
      slide?.image_size ??
      slide?.image?.file_size ??
      null,

    videoUrl:
      slide?.video_url ||
      slide?.videoUrl ||
      '',

    /*
     * Penting untuk Bab.
     */
    chapterId,
    chapter_id: chapterId,

    /*
     * Code block.
     */
    codeTitle:
      slide?.code_title ||
      slide?.codeTitle ||
      '',

    codeLanguage:
      slide?.code_language ||
      slide?.codeLanguage ||
      'text',

    codeContent:
      slide?.code_content ||
      slide?.codeContent ||
      '',

    allowCopy:
      slide?.allow_copy !== undefined
        ? normalizeBoolean(
            slide.allow_copy,
            true
          )
        : normalizeBoolean(
            slide?.allowCopy,
            true
          ),
  };
}

function normalizeTutorial(item) {
  /*
   * =====================================================
   * CHAPTER / BAB
   * =====================================================
   */
  const chapters =
    Array.isArray(item?.chapters)
      ? item.chapters
          .map(normalizeChapter)
          .sort(
            (first, second) =>
              first.order - second.order
          )
      : [];

  /*
   * Mapping:
   *
   * chapter_id -> urutan Bab
   */
  const chapterOrderMap =
    new Map(
      chapters.map(
        (chapter, index) => [
          String(chapter.id),

          Number(
            chapter.order
          ) ||
            index + 1,
        ]
      )
    );

  /*
   * =====================================================
   * SLIDES / MATERI
   * =====================================================
   *
   * Urutan yang dihasilkan:
   *
   * Bab 1
   * 1. Materi
   * 2. Materi
   *
   * Bab 2
   * 1. Materi
   * 2. Materi
   */
  const slides =
    Array.isArray(item?.slides)
      ? item.slides
          .map(normalizeSlide)
          .sort(
            (
              first,
              second
            ) => {
              const firstChapterOrder =
                chapterOrderMap.get(
                  String(
                    first.chapterId
                  )
                ) ??
                Number.MAX_SAFE_INTEGER;

              const secondChapterOrder =
                chapterOrderMap.get(
                  String(
                    second.chapterId
                  )
                ) ??
                Number.MAX_SAFE_INTEGER;

              /*
               * Urutkan berdasarkan Bab dahulu.
               */
              if (
                firstChapterOrder !==
                secondChapterOrder
              ) {
                return (
                  firstChapterOrder -
                  secondChapterOrder
                );
              }

              /*
               * Kemudian urutan materi
               * di dalam Bab.
               */
              return (
                first.order -
                second.order
              );
            }
          )
      : [];

  /*
   * =====================================================
   * LEARNING OBJECTIVES
   * =====================================================
   */
  const learningObjectives =
    Array.isArray(
      item?.learning_objectives
    )
      ? item.learning_objectives

      : Array.isArray(
            item?.learningObjectives
          )
        ? item.learningObjectives

        : Array.isArray(
              item
                ?.learning_information
                ?.learning_objectives
            )
          ? item
              .learning_information
              .learning_objectives

          : [];

  return {
    /*
     * =====================================================
     * BASIC
     * =====================================================
     */

    id: item?.id,

    title:
      item?.title ||
      'Materi Tanpa Judul',

    slug:
      item?.slug ||
      '',

    category:
      item?.category ||
      'Umum',

    /*
     * =====================================================
     * DESCRIPTION
     * =====================================================
     */

    shortDescription:
      item?.short_description ||
      item?.shortDescription ||
      '',

    fullDescription:
      item?.full_description ||
      item?.fullDescription ||
      '',

    /*
     * =====================================================
     * CARD IMAGE
     * =====================================================
     */

    cardImageName:
      item?.card_image_name ||
      item?.cardImageName ||
      '',

    cardImageUrl:
      item?.card_image_url ||
      item?.card_image_path ||
      item?.cardImageUrl ||
      '',

    /*
     * =====================================================
     * LEVEL
     * =====================================================
     */

    difficulty:
      item?.difficulty_level ||
      item?.difficulty ||
      item?.difficultyLevel ||
      'Semua Level',

    difficultyLevel:
      item?.difficulty_level ||
      item?.difficultyLevel ||
      item?.difficulty ||
      'Semua Level',

    /*
     * =====================================================
     * ESTIMATED TIME
     * =====================================================
     */

    estimatedTime:
      item?.estimated_time ||
      item?.estimatedTime ||
      '',

    /*
     * =====================================================
     * ORDER
     * =====================================================
     */

    pageOrder:
      Number(
        item?.page_order ||
          item?.pageOrder ||
          1
      ) || 1,

    displayOrder:
      Number(
        item?.display_order ||
          item?.displayOrder ||
          1
      ) || 1,

    /*
     * =====================================================
     * STATUS
     * =====================================================
     */

    status:
      item?.status ||
      'draft',

    active:
      normalizeBoolean(
        item?.active,
        true
      ),

    showOnPage:
      normalizeBoolean(
        item?.show_on_page ??
          item?.showOnPage,
        true
      ),

    featured:
      normalizeBoolean(
        item?.featured,
        false
      ),

    comments:
      normalizeBoolean(
        item?.comments,
        true
      ),

    /*
     * =====================================================
     * ACCESS
     * =====================================================
     */

    userLevel:
      item?.user_level ||
      item?.userLevel ||
      'semua_pengguna',

    accessRequirement:
      item?.access_requirement ||
      item?.accessRequirement ||
      '',

    prerequisite:
      item?.prerequisite ||
      '',

    accessType:
      item?.access_type ||
      item?.accessType ||
      '',

    /*
     * =====================================================
     * CTA
     * =====================================================
     */

    ctaText:
      item?.cta_text ||
      item?.cta?.text ||
      '',

    targetLink:
      item?.cta_target_link ||
      item?.cta?.target_link ||
      '',

    urlSlug:
      item?.cta_url_slug ||
      item?.cta?.url_slug ||
      '',

    publishSchedule:
      item?.publish_schedule ||
      item?.cta?.publish_schedule ||
      '',

    /*
     * =====================================================
     * CHAPTERS
     * =====================================================
     */

    chapters,

    /*
     * =====================================================
     * LEARNING OBJECTIVES
     * =====================================================
     */

    learningObjectives,

    learning_objectives:
      learningObjectives,

    /*
     * =====================================================
     * SLIDES
     * =====================================================
     */

    slides,

    totalSlides:
      Number(
        item?.total_slides
      ) ||
      slides.length,

    /*
     * =====================================================
     * TIMESTAMP
     * =====================================================
     */

    createdAt:
      item?.created_at ||
      null,

    updatedAt:
      item?.updated_at ||
      null,
  };
}

/*
 * =========================================================
 * CEK STATUS PUBLISH
 * =========================================================
 */
export function isPublishedTutorial(item) {
  const status = String(
    item?.status || ''
  )
    .trim()
    .toLowerCase();

  return (
    status === 'published' ||
    status === 'publish'
  );
}

/*
 * =========================================================
 * PARSE RESPONSE MATERI API
 * =========================================================
 */
async function parseMateriResponse(
  response
) {
  const responseText =
    await response.text();

  /*
   * Response kosong.
   */
  if (!responseText.trim()) {
    if (!response.ok) {
      throw new Error(
        `Gagal memuat materi. HTTP ${response.status}`
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

    /*
     * Backend mengembalikan HTML,
     * bukan JSON.
     */
    if (
      trimmed.startsWith(
        '<!DOCTYPE'
      ) ||
      trimmed.startsWith(
        '<html'
      )
    ) {
      throw new Error(
        `materi-api.php mengembalikan HTML, bukan JSON. Periksa endpoint: ${MATERI_API_URL}`
      );
    }

    throw new Error(
      `Response materi-api.php bukan JSON valid: ${responseText.slice(
        0,
        150
      )}`
    );
  }

  /*
   * Response error.
   */
  if (
    !response.ok ||
    payload.success === false
  ) {
    throw new Error(
      payload.message ||
        `Gagal memuat materi. HTTP ${response.status}`
    );
  }

  return payload;
}

/*
 * =========================================================
 * GET SEMUA MATERI TUTORIAL
 * =========================================================
 */
export async function fetchTutorialArticles() {
  const response =
    await fetch(
      MATERI_API_URL,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',
        },

        /*
         * Jangan cache supaya perubahan
         * Bab langsung muncul.
         */
        cache:
          'no-store',
      }
    );

  const payload =
    await parseMateriResponse(
      response
    );

  /*
   * Support beberapa format response.
   */
  const rows =
    payload.data ||
    payload.materi ||
    payload.articles ||
    [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map(
    normalizeTutorial
  );
}

/*
 * =========================================================
 * GET SATU MATERI TUTORIAL
 * =========================================================
 *
 * Bisa menggunakan:
 *
 * id
 * slug
 * urlSlug
 */
export async function fetchTutorialArticle(
  identifier
) {
  const key = String(
    identifier || ''
  ).trim();

  if (!key) {
    throw new Error(
      'ID tutorial tidak ditemukan di URL.'
    );
  }

  const tutorials =
    await fetchTutorialArticles();

  const tutorial =
    tutorials.find(
      (item) =>
        String(
          item.id
        ) === key ||

        String(
          item.slug || ''
        ) === key ||

        String(
          item.urlSlug || ''
        ) === key
    );

  if (!tutorial) {
    throw new Error(
      'Materi tutorial tidak ditemukan.'
    );
  }

  return tutorial;
}

/*
 * Bisa dipakai file lain jika
 * membutuhkan URL endpoint.
 */
export {
  MATERI_API_URL,
};