const PROGRESS_PREFIX =
  'arduflow:tutorial-progress:';

const PROGRESS_SUMMARY_PREFIX =
  'arduflow:tutorial-progress-summary:';

export const LEARNING_PROGRESS_EVENT =
  'arduflow-learning-progress-change';


export function safeStorageKeyPart(
  value
) {
  return String(
    value ?? 'unknown'
  ).replace(
    /[^a-zA-Z0-9_-]/g,
    '-'
  );
}


export function tutorialProgressStorageKey(
  tutorialId
) {
  return `${PROGRESS_PREFIX}${safeStorageKeyPart(
    tutorialId
  )}`;
}


export function tutorialProgressSummaryStorageKey(
  tutorialId
) {
  return `${PROGRESS_SUMMARY_PREFIX}${safeStorageKeyPart(
    tutorialId
  )}`;
}


export function normalizeCompletedSlideIds(
  value
) {
  const source =
    Array.isArray(value)
      ? value
      : [];

  return [
    ...new Set(
      source
        .filter(
          (item) =>
            item !== null &&
            item !== undefined
        )
        .map(
          (item) =>
            String(item)
        )
    ),
  ];
}


export function calculateTutorialProgress(
  totalSlides,
  completedSlideIds
) {
  const total = Math.max(
    0,
    Number(totalSlides) || 0
  );

  if (total <= 0) {
    return 0;
  }

  const completed = Math.min(
    total,
    normalizeCompletedSlideIds(
      completedSlideIds
    ).length
  );

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (
          completed /
          total
        ) * 100
      )
    )
  );
}


function getStorage() {
  if (
    typeof window ===
      'undefined' ||
    !window.localStorage
  ) {
    return null;
  }

  return window.localStorage;
}


function parseJson(
  value,
  fallback
) {
  try {
    return JSON.parse(
      value
    );
  } catch {
    return fallback;
  }
}


export function readTutorialProgress(
  tutorialId
) {
  const storage =
    getStorage();

  if (
    !storage ||
    !tutorialId
  ) {
    return {
      completedSlideIds: [],
      completedCount: 0,
      totalSlides: 0,
      progress: 0,
      updatedAt: '',
    };
  }

  /*
   * Ambil progress format lama:
   * arduflow:tutorial-progress:<id>
   */
  const legacyIds =
    normalizeCompletedSlideIds(
      parseJson(
        storage.getItem(
          tutorialProgressStorageKey(
            tutorialId
          )
        ) || '[]',
        []
      )
    );

  /*
   * Ambil summary progress baru:
   * arduflow:tutorial-progress-summary:<id>
   */
  const summary =
    parseJson(
      storage.getItem(
        tutorialProgressSummaryStorageKey(
          tutorialId
        )
      ) || 'null',
      null
    ) || {};

  const summaryIds =
    normalizeCompletedSlideIds(
      summary.completedSlideIds
    );

  /*
   * Prioritaskan data summary.
   * Kalau belum ada, fallback
   * ke data format lama.
   */
  const completedSlideIds =
    summaryIds.length > 0
      ? summaryIds
      : legacyIds;

  const totalSlides =
    Math.max(
      0,
      Number(
        summary.totalSlides
      ) || 0
    );

  const completedCount =
    Math.min(
      totalSlides > 0
        ? totalSlides
        : completedSlideIds.length,
      completedSlideIds.length
    );

  const progress =
    totalSlides > 0
      ? calculateTutorialProgress(
          totalSlides,
          completedSlideIds
        )
      : Math.max(
          0,
          Math.min(
            100,
            Number(
              summary.progress
            ) || 0
          )
        );

  return {
    ...summary,

    completedSlideIds,

    completedCount,

    totalSlides,

    progress,

    updatedAt:
      summary.updatedAt ||
      '',
  };
}


export function writeTutorialProgress({
  tutorialId,
  tutorialSlug = '',
  tutorialTitle = '',
  completedSlideIds = [],
  totalSlides = 0,
}) {
  const storage =
    getStorage();

  const uniqueIds =
    normalizeCompletedSlideIds(
      completedSlideIds
    );

  const total =
    Math.max(
      0,
      Number(
        totalSlides
      ) || 0
    );

  const completedCount =
    total > 0
      ? Math.min(
          total,
          uniqueIds.length
        )
      : uniqueIds.length;

  const summary = {
    tutorialId:
      String(
        tutorialId ??
        ''
      ),

    tutorialSlug:
      String(
        tutorialSlug ||
        ''
      ),

    tutorialTitle:
      String(
        tutorialTitle ||
        ''
      ),

    completedSlideIds:
      uniqueIds,

    completedCount,

    totalSlides:
      total,

    progress:
      calculateTutorialProgress(
        total,
        uniqueIds
      ),

    updatedAt:
      new Date().toISOString(),
  };

  /*
   * Kalau storage tidak tersedia,
   * tetap kembalikan summary.
   */
  if (
    !storage ||
    !tutorialId
  ) {
    return summary;
  }

  /*
   * ===========================
   * FORMAT LAMA
   * ===========================
   *
   * Tetap disimpan agar kode lama
   * masih kompatibel.
   */
  storage.setItem(
    tutorialProgressStorageKey(
      tutorialId
    ),
    JSON.stringify(
      uniqueIds
    )
  );

  /*
   * ===========================
   * FORMAT SUMMARY BARU
   * ===========================
   *
   * Digunakan oleh halaman:
   * /progress-belajar
   *
   * Menyimpan:
   * - id materi
   * - slug
   * - judul
   * - slide selesai
   * - total slide
   * - persentase
   * - terakhir dibuka
   */
  storage.setItem(
    tutorialProgressSummaryStorageKey(
      tutorialId
    ),
    JSON.stringify(
      summary
    )
  );

  /*
   * Memberi tahu komponen lain
   * bahwa progress berubah.
   */
  if (
    typeof window !==
    'undefined'
  ) {
    window.dispatchEvent(
      new CustomEvent(
        LEARNING_PROGRESS_EVENT,
        {
          detail:
            summary,
        }
      )
    );
  }

  return summary;
}