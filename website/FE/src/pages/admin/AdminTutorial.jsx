import { useEffect, useMemo, useState } from 'react';

import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';

import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';

/* =========================================================
   ARTICLE API
========================================================= */

const ARTICLE_API_URL = (
  apiEndpoint(import.meta.env.VITE_ARTICLE_API_URL, '/api/article-api.php')
);
const DEBUG_ADMIN_TUTORIAL =
  import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

const tutorialImageModules = import.meta.glob('../../assets/images/*', {
  eager: true,
  import: 'default',
  query: '?url',
});

const tutorialImageMap = Object.entries(tutorialImageModules).reduce(
  (images, [path, url]) => {
    const fileName = path.split('/').pop() || '';
    const key = fileName
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    images[key] = url;
    images[fileName.toLowerCase()] = url;

    return images;
  },
  {}
);

/* =========================================================
   BADGE
========================================================= */

function TutorialBadge({ children }) {
  const slug = createSlug(children || '-');

  return (
    <span
      className={`admin-tutorial-badge admin-tutorial-badge--${slug}`}
    >
      {children || '-'}
    </span>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function TutorialAction({
  label,
  children,
  onClick,
}) {
  return (
    <button
      className="admin-tutorial-action"
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(value) {
  const status = String(
    value || 'draft'
  ).toLowerCase();

  if (status === 'published') {
    return 'Published';
  }

  if (status === 'pending_review') {
    return 'Pending Review';
  }

  if (status === 'pending review') {
    return 'Pending Review';
  }

  if (status === 'archived') {
    return 'Archived';
  }

  return 'Draft';
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value,
  includeTime = false
) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',

      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
          }
        : {}),
    }
  ).format(date);
}

/* =========================================================
   RESOLVE IMAGE
========================================================= */

function parseImageValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeImageKey(value) {
  return String(value || '')
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveApiAssetUrl(value) {
  const assetPath = String(value || '').trim();

  if (!assetPath) {
    return '';
  }

  if (/^(data:image\/|https?:\/\/|blob:)/i.test(assetPath)) {
    return assetPath;
  }

  if (/^(\/?uploads\/|\/?storage\/|\/?api\/uploads\/)/i.test(assetPath)) {
    return `${API_BASE_URL}/${assetPath.replace(/^\/+/, '')}`;
  }

  return '';
}

function resolveTutorialImage(item) {
  const imageData = parseImageValue(
    item?.card_image ||
      item?.cardImage ||
      item?.thumbnail ||
      item?.image ||
      item?.card_image_name
  );

  const candidates = [];

  if (typeof imageData === 'string') {
    candidates.push(imageData);
  }

  if (imageData && typeof imageData === 'object') {
    candidates.push(
      imageData.data_url,
      imageData.dataUrl,
      imageData.file_url,
      imageData.fileUrl,
      imageData.url,
      imageData.src,
      imageData.path,
      imageData.relative_url,
      imageData.relativeUrl,
      imageData.file_name,
      imageData.fileName,
      imageData.name
    );
  }

  candidates.push(
    item?.card_image_url,
    item?.image_url,
    item?.thumbnail_url,
    item?.card_image_path,
    item?.card_image_name,
    item?.title
  );

  for (const candidate of candidates.filter(Boolean)) {
    const apiAssetUrl = resolveApiAssetUrl(candidate);

    if (apiAssetUrl) {
      return apiAssetUrl;
    }

    const fileName = String(candidate).split(/[\\/]/).pop().toLowerCase();
    const key = normalizeImageKey(candidate);

    if (tutorialImageMap[fileName]) {
      return tutorialImageMap[fileName];
    }

    if (tutorialImageMap[key]) {
      return tutorialImageMap[key];
    }
  }

  return '';
}

/* =========================================================
   NORMALIZE TUTORIAL DATA
========================================================= */

function normalizeTutorial(item) {
  const status = normalizeStatus(
    item?.status
  );
  const imageSrc = resolveTutorialImage(
    item
  );

  return {
    ...item,

    id:
      item?.id ??
      null,

    title:
      item?.title ||
      'Tanpa Judul',

    slug:
      item?.slug ||
      '',

    description:
      item?.short_description ||
      item?.description ||
      '-',

    fullDescription:
      item?.full_description ||
      '-',

    category:
      item?.category ||
      '-',

    level:
      item?.difficulty_level ||
      item?.level ||
      '-',

    estimatedTime:
      item?.estimated_time ||
      '-',

    status,

    author:
      item?.author ||
      item?.author_name ||
      'Admin',

    viewer:
      Number(
        item?.viewer ??
        item?.views ??
        0
      ),

    completed:
      Number(
        item?.completed ??
        item?.completed_count ??
        0
      ),

    totalSlides:
      Number(
        item?.total_slides ||
        item?.slides?.length ||
        0
      ),

    card_image_name:
      item?.card_image_name ||
      item?.thumbnail ||
      null,

    imageSrc,

    createdAtRaw:
      item?.created_at ||
      null,

    updatedAtRaw:
      item?.updated_at ||
      item?.created_at ||
      null,

    createdAt:
      formatDate(
        item?.created_at
      ),

    publishedAt:
      status === 'Published'
        ? formatDate(
            item?.published_at ||
            item?.created_at
          )
        : '-',

    updatedAt:
      formatDate(
        item?.updated_at ||
        item?.created_at
      ),

    updatedAtWithTime:
      formatDate(
        item?.updated_at ||
        item?.created_at,
        true
      ),
  };
}

/* =========================================================
   ADMIN TUTORIAL
========================================================= */

export function AdminTutorial() {
  const [
    tutorials,
    setTutorials,
  ] = useState([]);

  const [
    selectedTutorial,
    setSelectedTutorial,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('');

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState('');

  const [
    levelFilter,
    setLevelFilter,
  ] = useState('');

  const handleEditTutorial = (tutorial) => {
    if (!tutorial?.id) {
      return;
    }

    window.location.href = `/admin/tutorial/edit?id=${encodeURIComponent(
      tutorial.id
    )}`;
  };

  const createTutorialUpdatePayload = (tutorial, overrides = {}) => ({
    title: tutorial.title || 'Tanpa Judul',
    slug:
      tutorial.slug ||
      createSlug(tutorial.title || `tutorial-${tutorial.id}`),
    category: tutorial.category && tutorial.category !== '-'
      ? tutorial.category
      : 'panduan-pemula',
    display_order: Number(tutorial.display_order || tutorial.displayOrder || 1),
    descriptions: {
      short_description:
        tutorial.short_description ||
        tutorial.description ||
        'Deskripsi singkat belum tersedia.',
      full_description:
        tutorial.full_description ||
        tutorial.fullDescription ||
        tutorial.description ||
        'Deskripsi lengkap belum tersedia.',
    },
    learning_information: {
      difficulty_level:
        tutorial.difficulty_level ||
        tutorial.level ||
        'Level Pemula',
      estimated_time:
        tutorial.estimated_time ||
        tutorial.estimatedTime ||
        '-',
    },
    page_settings: {
      page_order: Number(tutorial.page_order || tutorial.pageOrder || 1),
      status: normalizeStatus(overrides.status || tutorial.status)
        .toLowerCase()
        .replace(/\s+/g, '_'),
    },
    access_settings: {
      user_level:
        tutorial.user_level ||
        tutorial.userLevel ||
        'semua_pengguna',
      access_requirement:
        tutorial.access_requirement ||
        tutorial.accessRequirement ||
        null,
    },
    slides: Array.isArray(tutorial.slides) && tutorial.slides.length > 0
      ? tutorial.slides.map((slide, index) => ({
          id: slide.id ?? null,
          order: Number(slide.order || slide.slide_order || index + 1),
          title: slide.title || `Slide ${index + 1}`,
          content_type: slide.content_type || slide.contentType || 'text',
          content: slide.content || null,
          image_name: slide.image_name || slide.imageName || null,
          image_url: slide.image_url || slide.imageUrl || null,
          video_url: slide.video_url || slide.videoUrl || null,
        }))
      : [
          {
            id: null,
            order: 1,
            title: tutorial.title || 'Materi Utama',
            content_type: 'text',
            content:
              tutorial.full_description ||
              tutorial.fullDescription ||
              tutorial.description ||
              'Konten materi belum tersedia.',
            image_name: null,
            image_url: null,
            video_url: null,
          },
        ],
  });

  const updateTutorialStatus = async (tutorial, nextStatus) => {
    if (!tutorial?.id) return;

    try {
      const response = await fetch(
        `${ARTICLE_API_URL}?id=${encodeURIComponent(tutorial.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(
            createTutorialUpdatePayload(tutorial, { status: nextStatus })
          ),
        }
      );

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Status tutorial gagal diperbarui.');
      }

      await showSuccessAlert('Berhasil', result.message || 'Status tutorial diperbarui.');
      await fetchTutorials();
      setSelectedTutorial(null);
    } catch (error) {
      console.error('Gagal memperbarui status tutorial:', error);
      await showErrorAlert(
        'Gagal',
        error.message || 'Status tutorial gagal diperbarui.'
      );
    }
  };

  const handleDeleteTutorial = async (tutorial) => {
    if (!tutorial?.id) return;

    const confirmed = await showConfirmAlert({
      title: 'Hapus Tutorial?',
      text: `Tutorial "${tutorial.title}" akan dihapus dari database.`,
      confirmButtonText: 'Hapus',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${ARTICLE_API_URL}?id=${encodeURIComponent(tutorial.id)}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Tutorial gagal dihapus.');
      }

      await showSuccessAlert('Berhasil', result.message || 'Tutorial berhasil dihapus.');
      await fetchTutorials();
      setSelectedTutorial(null);
    } catch (error) {
      console.error('Gagal menghapus tutorial:', error);
      await showErrorAlert('Gagal', error.message || 'Tutorial gagal dihapus.');
    }
  };

  const handleTogglePublishTutorial = async (tutorial) => {
    const nextStatus = tutorial.status === 'Published' ? 'Draft' : 'Published';
    const confirmed = await showConfirmAlert({
      title: nextStatus === 'Published' ? 'Publish Tutorial?' : 'Jadikan Draft?',
      text: `Ubah status "${tutorial.title}" menjadi ${nextStatus}?`,
      confirmButtonText: nextStatus === 'Published' ? 'Publish' : 'Jadikan Draft',
    });

    if (confirmed) {
      await updateTutorialStatus(tutorial, nextStatus);
    }
  };

  const handleArchiveTutorial = async (tutorial) => {
    const confirmed = await showConfirmAlert({
      title: 'Arsipkan Tutorial?',
      text: `Arsipkan "${tutorial.title}"?`,
      confirmButtonText: 'Arsipkan',
    });

    if (confirmed) {
      await updateTutorialStatus(tutorial, 'Archived');
    }
  };

  const handleExportTutorials = async () => {
    const header = [
      'ID',
      'Judul',
      'Slug',
      'Kategori',
      'Level',
      'Status',
      'Author',
      'Viewer',
      'Selesai',
      'Dibuat',
      'Diupdate',
    ];
    const rows = tutorials.map((item) => [
      item.id,
      item.title,
      item.slug,
      item.category,
      item.level,
      item.status,
      item.author,
      item.viewer,
      item.completed,
      item.createdAt,
      item.updatedAt,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `tutorial-arduflow-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    await showSuccessAlert('Export Berhasil', 'Data tutorial berhasil diexport ke CSV.');
  };

  const handleCheckBrokenLinks = async () => {
    const brokenCount = tutorials.filter((item) => !item.slug).length;
    await showSuccessAlert(
      'Cek Link Selesai',
      brokenCount
        ? `${brokenCount} tutorial belum memiliki slug.`
        : 'Tidak ditemukan link materi yang kosong.'
    );
  };

  const handleReorderTutorials = async () => {
    setTutorials((current) =>
      [...current].sort(
        (first, second) =>
          Number(first.display_order || first.page_order || first.id || 0) -
          Number(second.display_order || second.page_order || second.id || 0)
      )
    );
    await showSuccessAlert('Berhasil', 'Urutan tampilan tutorial diperbarui di tabel.');
  };

  /* =======================================================
     FETCH ARTICLE API
  ======================================================= */

  const fetchTutorials = async () => {
    setIsLoading(true);
    setLoadError('');

    console.group(
      'DEBUG ADMIN TUTORIAL API'
    );

    console.log(
      'Method:',
      'GET'
    );

    console.log(
      'Endpoint:',
      ARTICLE_API_URL
    );

    try {
      const response =
        await fetch(
          ARTICLE_API_URL,
          {
            method: 'GET',

            headers: {
              Accept:
                'application/json',
            },
          }
        );

      if (DEBUG_ADMIN_TUTORIAL) {
        console.log(
          'HTTP Status:',
          response.status
        );
      }

      const responseText =
        await response.text();

      if (DEBUG_ADMIN_TUTORIAL) {
        console.log(
          'Response mentah API:',
          responseText
        );
      }

      /* -----------------------------------------------
         RESPONSE KOSONG
      ----------------------------------------------- */

      if (
        !responseText.trim()
      ) {
        throw new Error(
          `API mengembalikan response kosong. HTTP ${response.status}.`
        );
      }

      /* -----------------------------------------------
         PARSE JSON
      ----------------------------------------------- */

      let result;

      try {
        result =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
            0,
            250
          )}`
        );
      }

      if (DEBUG_ADMIN_TUTORIAL) {
        console.log(
          'Response JSON API:',
          result
        );
      }

      /* -----------------------------------------------
         HTTP ERROR
      ----------------------------------------------- */

      if (
        !response.ok ||
        result?.success === false
      ) {
        throw new Error(
          result?.message ||
            `API mengembalikan HTTP ${response.status}.`
        );
      }

      /* -----------------------------------------------
         AMBIL ARRAY DATA

         Mendukung:

         {
           success: true,
           data: [...]
         }

         atau:

         {
           success: true,
           data: {
             articles: [...]
           }
         }

         atau:

         {
           success: true,
           articles: [...]
         }
      ----------------------------------------------- */

      let rows = [];

      if (
        Array.isArray(
          result?.data
        )
      ) {
        rows =
          result.data;
      } else if (
        Array.isArray(
          result?.data?.articles
        )
      ) {
        rows =
          result.data.articles;
      } else if (
        Array.isArray(
          result?.articles
        )
      ) {
        rows =
          result.articles;
      }

      console.log(
        'Data mentah article:',
        rows
      );

      /* -----------------------------------------------
         NORMALIZE
      ----------------------------------------------- */

      const normalizedRows =
        rows.map(
          normalizeTutorial
        );

      console.log(
        'Data tabel:',
        normalizedRows
      );

      setTutorials(
        normalizedRows
      );

      /* -----------------------------------------------
         SELECTED TUTORIAL
      ----------------------------------------------- */

      setSelectedTutorial(
        (current) => {
          if (
            normalizedRows.length ===
            0
          ) {
            return null;
          }

          if (!current) {
            return null;
          }

          return (
            normalizedRows.find(
              (item) =>
                item.id ===
                current.id
            ) ||
            null
          );
        }
      );
    } catch (error) {
      console.error(
        'Gagal mengambil data tutorial dari article-api.php:',
        error
      );

      setTutorials([]);

      setSelectedTutorial(
        null
      );

      setLoadError(
        error?.message ||
          'Data tutorial tidak dapat diambil dari article-api.php.'
      );
    } finally {
      console.groupEnd();

      setIsLoading(false);
    }
  };

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    fetchTutorials();
  }, []);

  /* =======================================================
     STATISTIK
  ======================================================= */

  const tutorialStats =
    useMemo(() => {
      const total =
        tutorials.length;

      const published =
        tutorials.filter(
          (item) =>
            item.status ===
            'Published'
        ).length;

      const draft =
        tutorials.filter(
          (item) =>
            item.status ===
            'Draft'
        ).length;

      const pendingReview =
        tutorials.filter(
          (item) =>
            item.status ===
            'Pending Review'
        ).length;

      const publishedPercent =
        total
          ? (
              (published /
                total) *
              100
            ).toFixed(1)
          : '0.0';

      const draftPercent =
        total
          ? (
              (draft /
                total) *
              100
            ).toFixed(1)
          : '0.0';

      const totalViewer =
        tutorials.reduce(
          (
            totalValue,
            item
          ) =>
            totalValue +
            Number(
              item.viewer ||
              0
            ),
          0
        );

      return [
        {
          label:
            'Total Tutorial',

          value:
            String(total),

          note:
            'Data dari SQLite',

          icon:
            bookIcon,

          tone:
            'blue',
        },

        {
          label:
            'Tutorial Published',

          value:
            String(
              published
            ),

          note:
            `${publishedPercent}% dari total`,

          icon:
            checkIcon,

          tone:
            'green',
        },

        {
          label:
            'Draft Belum Publish',

          value:
            String(draft),

          note:
            `${draftPercent}% dari total`,

          icon:
            fileIcon,

          tone:
            'orange',
        },

        {
          label:
            'Total Viewer / Pembaca',

          value:
            String(
              totalViewer
            ),

          note:
            'Total viewer tutorial',

          icon:
            usersIcon,

          tone:
            'blue',
        },

        {
          label:
            'Materi Paling Populer',

          value:
            tutorials.length
              ? [...tutorials].sort(
                  (
                    a,
                    b
                  ) =>
                    Number(
                      b.viewer ||
                      0
                    ) -
                    Number(
                      a.viewer ||
                      0
                    )
                )[0]?.title ||
                '-'
              : 'Belum tersedia',

          note:
            'Berdasarkan viewer',

          icon:
            zapIcon,

          tone:
            'purple',
        },

        {
          label:
            'Materi Perlu Revisi',

          value:
            String(
              pendingReview
            ),

          note:
            'Status Pending Review',

          icon:
            clockIcon,

          tone:
            'red',
        },
      ];
    }, [tutorials]);

  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categoryOptions =
    useMemo(() => {
      return [
        ...new Set(
          tutorials
            .map(
              (item) =>
                item.category
            )
            .filter(
              (item) =>
                item &&
                item !== '-'
            )
        ),
      ];
    }, [tutorials]);

  /* =======================================================
     LEVEL OPTIONS
  ======================================================= */

  const levelOptions =
    useMemo(() => {
      return [
        ...new Set(
          tutorials
            .map(
              (item) =>
                item.level
            )
            .filter(
              (item) =>
                item &&
                item !== '-'
            )
        ),
      ];
    }, [tutorials]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTutorials =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase();

      return tutorials.filter(
        (item) => {
          const matchesSearch =
            !keyword ||
            String(
              item.title ||
              ''
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              item.description ||
              ''
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              item.slug ||
              ''
            )
              .toLowerCase()
              .includes(
                keyword
              );

          const matchesStatus =
            !statusFilter ||
            item.status ===
              statusFilter;

          const matchesCategory =
            !categoryFilter ||
            item.category ===
              categoryFilter;

          const matchesLevel =
            !levelFilter ||
            item.level ===
              levelFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesLevel
          );
        }
      );
    }, [
      tutorials,
      searchTerm,
      statusFilter,
      categoryFilter,
      levelFilter,
    ]);

  /* =======================================================
     LATEST
  ======================================================= */

  const latestTutorials =
    useMemo(() => {
      return [
        ...tutorials,
      ]
        .sort(
          (a, b) => {
            const dateA =
              new Date(
                a.createdAtRaw ||
                  0
              ).getTime();

            const dateB =
              new Date(
                b.createdAtRaw ||
                  0
              ).getTime();

            return (
              dateB -
              dateA
            );
          }
        )
        .slice(
          0,
          5
        );
    }, [tutorials]);

  /* =======================================================
     DRAFT
  ======================================================= */

  const draftTutorials =
    useMemo(() => {
      return tutorials
        .filter(
          (item) =>
            item.status ===
            'Draft'
        )
        .slice(
          0,
          5
        );
    }, [tutorials]);

  /* =======================================================
     ISSUE
  ======================================================= */

  const issueItems =
    useMemo(() => {
      const thumbnailEmpty =
        tutorials.filter(
          (item) =>
            !item.imageSrc
        ).length;

      const categoryEmpty =
        tutorials.filter(
          (item) =>
            !item.category ||
            item.category ===
              '-'
        ).length;

      const shortContent =
        tutorials.filter(
          (item) =>
            String(
              item.fullDescription ||
              ''
            )
              .trim()
              .length <
            300
        ).length;

      return [
        [
          'Thumbnail kosong',
          thumbnailEmpty,
        ],

        [
          'Link rusak',
          0,
        ],

        [
          'Belum punya kategori',
          categoryEmpty,
        ],

        [
          'Konten terlalu pendek (< 300 karakter)',
          shortContent,
        ],

        [
          'Belum ada quiz / praktik',
          0,
        ],
      ];
    }, [tutorials]);

  /* =======================================================
     ACTIVITY
  ======================================================= */

  const activityItems =
    useMemo(() => {
      return [
        ...tutorials,
      ]
        .sort(
          (a, b) => {
            const dateA =
              new Date(
                a.updatedAtRaw ||
                  0
              ).getTime();

            const dateB =
              new Date(
                b.updatedAtRaw ||
                  0
              ).getTime();

            return (
              dateB -
              dateA
            );
          }
        )
        .slice(
          0,
          5
        )
        .map(
          (item) => [
            `Tutorial "${item.title}" ${
              item.status ===
              'Published'
                ? 'dipublish / diupdate'
                : 'disimpan'
            }`,

            item.updatedAtWithTime,

            item.status ===
            'Published'
              ? 'green'
              : item.status ===
                'Pending Review'
              ? 'purple'
              : 'orange',
          ]
        );
    }, [tutorials]);

  /* =======================================================
     RESET FILTER
  ======================================================= */

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setLevelFilter('');
  };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <AdminPage pageClassName="admin-tutorial-page" ariaLabel="Tutorial dan materi admin">
        <AdminTopbar
          searchPlaceholder="Cari tutorial / materi"
          searchLabel="Cari tutorial atau materi"
        />

        <div className="admin-tutorial-layout">
          <section className="admin-tutorial-content">

            {/* =========================
                HEADING
            ========================= */}

            <div className="admin-tutorial-heading">
              <div>
                <h1>
                  Tutorial / Materi
                </h1>

                <p>
                  Dashboard{' '}
                  <span>/</span>{' '}
                  Tutorial / Materi
                </p>
              </div>
            </div>

            {/* =========================
                STATS
            ========================= */}

            <section
              className="admin-tutorial-stats"
              aria-label="Ringkasan tutorial"
            >
              {tutorialStats.map(
                (item) => (
                  <article
                    className="admin-tutorial-stat"
                    key={
                      item.label
                    }
                  >
                    <span
                      className={`admin-tutorial-stat-icon is-${item.tone}`}
                    >
                      <img
                        src={
                          item.icon
                        }
                        alt=""
                      />
                    </span>

                    <div>
                      <p>
                        {item.label}
                      </p>

                      <strong>
                        {item.value}
                      </strong>

                      <small>
                        {item.note}
                      </small>
                    </div>
                  </article>
                )
              )}
            </section>

            {/* =========================
                FILTER
            ========================= */}

            <section
              className="admin-tutorial-filter"
              aria-label="Filter tutorial"
            >
              <label className="admin-tutorial-search">
                <input
                  type="search"
                  placeholder="Cari judul tutorial..."
                  value={
                    searchTerm
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchTerm(
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Status
                </span>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Semua Status
                  </option>

                  <option value="Published">
                    Published
                  </option>

                  <option value="Draft">
                    Draft
                  </option>

                  <option value="Pending Review">
                    Pending Review
                  </option>

                  <option value="Archived">
                    Archived
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Kategori
                </span>

                <select
                  value={
                    categoryFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Semua Kategori
                  </option>

                  {categoryOptions.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>
                  Level
                </span>

                <select
                  value={
                    levelFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setLevelFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Semua Level
                  </option>

                  {levelOptions.map(
                    (level) => (
                      <option
                        key={
                          level
                        }
                        value={
                          level
                        }
                      >
                        {level}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>
                  Author / Admin
                </span>

                <select
                  value=""
                  disabled
                  readOnly
                >
                  <option value="">
                    Admin
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Tanggal Publish
                </span>

                <input
                  type="text"
                  placeholder="Belum tersedia di filter API"
                  disabled
                />
              </label>

              <button
                type="button"
                onClick={
                  resetFilters
                }
              >
                Reset Filter
              </button>
            </section>

            {/* =========================
                TOOLBAR
            ========================= */}

            <div className="admin-tutorial-table-toolbar">
              <a
                className="admin-tutorial-primary"
                href="/admin/tutorial/tambah"
              >
                + Tambah Materi
              </a>

              <button
                type="button"
                onClick={
                  fetchTutorials
                }
                disabled={
                  isLoading
                }
              >
                {isLoading
                  ? 'Memuat...'
                  : 'Muat Ulang SQLite'}
              </button>
            </div>

            {/* =========================
                TABLE
            ========================= */}

            <section className="admin-tutorial-table-card">
              <table className="admin-tutorial-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua tutorial"
                      />
                    </th>

                    <th>
                      Judul Tutorial
                    </th>

                    <th>
                      Kategori
                    </th>

                    <th>
                      Level
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Author
                    </th>

                    <th>
                      Viewer
                    </th>

                    <th>
                      Selesai
                    </th>

                    <th>
                      Tgl Dibuat
                    </th>

                    <th>
                      Tgl Publish
                    </th>

                    <th>
                      Update Terakhir
                    </th>

                    <th>
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td
                        colSpan="12"
                      >
                        Memuat data tutorial dari SQLite...
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    loadError && (
                      <tr>
                        <td
                          colSpan="12"
                        >
                          <strong>
                            Gagal mengambil data SQLite.
                          </strong>

                          <br />

                          <small>
                            {
                              loadError
                            }
                          </small>

                          <br />

                          <small>
                            Endpoint:{' '}
                            {
                              ARTICLE_API_URL
                            }
                          </small>
                        </td>
                      </tr>
                    )}

                  {!isLoading &&
                    !loadError &&
                    filteredTutorials.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="12"
                        >
                          Belum ada data materi yang sesuai di SQLite.
                        </td>
                      </tr>
                    )}

                  {!isLoading &&
                    !loadError &&
                    filteredTutorials.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item.id ||
                            item.slug ||
                            item.title
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${item.title}`}
                            />
                          </td>

                          <td>
                            {item.imageSrc ? (
                              <img
                                className="admin-tutorial-thumb"
                                src={item.imageSrc}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <span
                                className={`admin-tutorial-thumb is-${
                                  index %
                                  4
                                }`}
                              />
                            )}

                            <span>
                              <b>
                                {
                                  item.title
                                }
                              </b>

                              <small>
                                {
                                  item.description
                                }
                              </small>
                            </span>
                          </td>

                          <td>
                            <TutorialBadge>
                              {
                                item.category
                              }
                            </TutorialBadge>
                          </td>

                          <td>
                            <TutorialBadge>
                              {
                                item.level
                              }
                            </TutorialBadge>
                          </td>

                          <td>
                            <TutorialBadge>
                              {
                                item.status
                              }
                            </TutorialBadge>
                          </td>

                          <td>
                            {
                              item.author
                            }
                          </td>

                          <td>
                            {
                              item.viewer
                            }
                          </td>

                          <td>
                            {
                              item.completed
                            }
                          </td>

                          <td>
                            {
                              item.createdAt
                            }
                          </td>

                          <td>
                            {
                              item.publishedAt
                            }
                          </td>

                          <td>
                            {
                              item.updatedAt
                            }
                          </td>

                          <td>
                            <div className="admin-tutorial-actions">
                              <TutorialAction
                                label={`Preview ${item.title}`}
                                onClick={() =>
                                  setSelectedTutorial(
                                    item
                                  )
                                }
                              >
                                <img
                                  src={
                                    eyeIcon
                                  }
                                  alt=""
                                />
                              </TutorialAction>

                              <TutorialAction
                                label={`Edit ${item.title}`}
                                onClick={() =>
                                  handleEditTutorial(
                                    item
                                  )
                                }
                              >
                                Edit
                              </TutorialAction>

                              <TutorialAction
                                label={`${item.status === 'Published' ? 'Jadikan draft' : 'Publish'} ${item.title}`}
                                onClick={() =>
                                  handleTogglePublishTutorial(
                                    item
                                  )
                                }
                              >
                                {item.status === 'Published' ? 'Draft' : 'Publish'}
                              </TutorialAction>

                              <TutorialAction
                                label={`Hapus ${item.title}`}
                                onClick={() =>
                                  handleDeleteTutorial(
                                    item
                                  )
                                }
                              >
                                Hapus
                              </TutorialAction>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>

              {/* =========================
                  PAGINATION
              ========================= */}

              <div className="admin-tutorial-pagination">
                <span>
                  Menampilkan{' '}
                  {filteredTutorials.length
                    ? 1
                    : 0}{' '}
                  -{' '}
                  {
                    filteredTutorials.length
                  }{' '}
                  dari{' '}
                  {
                    filteredTutorials.length
                  }{' '}
                  data
                </span>

                <div>
                  <button
                    type="button"
                    disabled
                  >
                    &lt;
                  </button>

                  <button
                    type="button"
                    className="is-active"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    disabled
                  >
                    &gt;
                  </button>
                </div>

                <select defaultValue="10">
                  <option value="10">
                    10 / halaman
                  </option>
                </select>
              </div>
            </section>

            {/* =========================
                BOTTOM PANELS
            ========================= */}

            <section className="admin-tutorial-bottom">

              {/* MATERI TERBARU */}

              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>
                    Materi Terbaru dari SQLite
                  </h2>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>
                        Judul
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Dibuat
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {latestTutorials.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="4"
                        >
                          Belum ada materi.
                        </td>
                      </tr>
                    ) : (
                      latestTutorials.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              item.id ||
                              item.slug
                            }
                          >
                            <td>
                              {
                                index +
                                1
                              }
                            </td>

                            <td>
                              {
                                item.title
                              }
                            </td>

                            <td>
                              {
                                item.status
                              }
                            </td>

                            <td>
                              {
                                item.createdAt
                              }
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </article>

              {/* DRAFT */}

              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>
                    Draft Perlu Dilanjutkan
                  </h2>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>
                        Judul
                      </th>

                      <th>
                        Author
                      </th>

                      <th>
                        Terakhir Diedit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {draftTutorials.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="3"
                        >
                          Tidak ada draft.
                        </td>
                      </tr>
                    ) : (
                      draftTutorials.map(
                        (
                          item
                        ) => (
                          <tr
                            key={
                              item.id ||
                              item.slug
                            }
                          >
                            <td>
                              {
                                item.title
                              }
                            </td>

                            <td>
                              {
                                item.author
                              }
                            </td>

                            <td>
                              {
                                item.updatedAt
                              }
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </article>

              {/* ISSUE */}

              <article className="admin-tutorial-panel admin-tutorial-issues">
                <div className="admin-tutorial-panel-head">
                  <h2>
                    Materi Bermasalah
                  </h2>
                </div>

                {issueItems.map(
                  (item) => (
                    <p
                      key={
                        item[0]
                      }
                    >
                      <span>
                        {
                          item[0]
                        }
                      </span>

                      <strong>
                        {
                          item[1]
                        }
                      </strong>
                    </p>
                  )
                )}
              </article>

              {/* ACTIVITY */}

              <article className="admin-tutorial-panel admin-tutorial-activity">
                <div className="admin-tutorial-panel-head">
                  <h2>
                    Aktivitas Terbaru
                  </h2>
                </div>

                {activityItems.length ===
                0 ? (
                  <p>
                    <b>
                      Belum ada aktivitas materi.
                    </b>
                  </p>
                ) : (
                  activityItems.map(
                    (item) => (
                      <p
                        key={`${item[0]}-${item[1]}`}
                      >
                        <span
                          className={`admin-tutorial-dot is-${item[2]}`}
                        />

                        <b>
                          {
                            item[0]
                          }
                        </b>

                        <time>
                          {
                            item[1]
                          }
                        </time>
                      </p>
                    )
                  )
                )}
              </article>
            </section>

            {/* =========================
                QUICK ACTION
            ========================= */}

            <section className="admin-tutorial-quick">
              <h2>
                Aksi Cepat
              </h2>

              <div>
                <a href="/admin/tutorial/tambah">
                  Buat Tutorial Baru
                </a>

                <button
                  type="button"
                  onClick={
                    fetchTutorials
                  }
                >
                  Muat Ulang Data SQLite
                </button>

                <button
                  type="button"
                  onClick={handleExportTutorials}
                >
                  Export Data Tutorial
                </button>

                <button
                  type="button"
                  onClick={handleCheckBrokenLinks}
                >
                  Cek Link Rusak
                </button>

                <button
                  type="button"
                  onClick={handleReorderTutorials}
                >
                  Reorder Materi Belajar
                </button>
              </div>
            </section>
          </section>

          {selectedTutorial && (
            <div
              className="admin-tutorial-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Detail tutorial"
            >
              <button
                className="admin-tutorial-detail-backdrop"
                type="button"
                aria-label="Tutup detail tutorial"
                onClick={() =>
                  setSelectedTutorial(
                    null
                  )
                }
              />

              <aside className="admin-tutorial-detail">
                <div className="admin-tutorial-detail-head">
                  <h2>
                    Detail Tutorial
                  </h2>

                  <button
                    type="button"
                    aria-label="Tutup detail"
                    onClick={() =>
                      setSelectedTutorial(
                        null
                      )
                    }
                  >
                    x
                  </button>
                </div>

                <div className="admin-tutorial-detail-profile">
                  {selectedTutorial.imageSrc ? (
                    <img
                      className="admin-tutorial-detail-image"
                      src={selectedTutorial.imageSrc}
                      alt=""
                    />
                  ) : (
                    <span className="admin-tutorial-detail-image" />
                  )}

                  <div>
                    <h3>
                      {
                        selectedTutorial.title
                      }
                    </h3>

                    <TutorialBadge>
                      {
                        selectedTutorial.status
                      }
                    </TutorialBadge>
                  </div>
                </div>

                <dl>
                  <dt>
                    Kategori
                  </dt>

                  <dd>
                    {
                      selectedTutorial.category
                    }
                  </dd>

                  <dt>
                    Level
                  </dt>

                  <dd>
                    {
                      selectedTutorial.level
                    }
                  </dd>

                  <dt>
                    Author
                  </dt>

                  <dd>
                    {
                      selectedTutorial.author
                    }
                  </dd>

                  <dt>
                    Slug
                  </dt>

                  <dd>
                    {
                      selectedTutorial.slug ||
                      '-'
                    }
                  </dd>

                  <dt>
                    Deskripsi Singkat
                  </dt>

                  <dd>
                    {
                      selectedTutorial.description
                    }
                  </dd>

                  <dt>
                    Total Slide
                  </dt>

                  <dd>
                    {
                      selectedTutorial.totalSlides
                    }
                  </dd>
                </dl>

                <section className="admin-tutorial-detail-stats">
                  <article>
                    <span>
                      Viewer
                    </span>

                    <strong>
                      {
                        selectedTutorial.viewer
                      }
                    </strong>
                  </article>

                  <article>
                    <span>
                      User Selesai
                    </span>

                    <strong>
                      {
                        selectedTutorial.completed
                      }
                    </strong>
                  </article>

                  <article>
                    <span>
                      Estimasi Waktu
                    </span>

                    <strong>
                      {
                        selectedTutorial.estimatedTime
                      }
                    </strong>
                  </article>

                  <article>
                    <span>
                      Tanggal Publish
                    </span>

                    <strong>
                      {
                        selectedTutorial.publishedAt
                      }
                    </strong>
                  </article>
                </section>

                <section className="admin-tutorial-history">
                  <h3>
                    Riwayat Update Terakhir
                  </h3>

                  <p>
                    {
                      selectedTutorial.updatedAtWithTime
                    }{' '}
                    oleh{' '}
                    {
                      selectedTutorial.author
                    }
                  </p>
                </section>

                <div className="admin-tutorial-detail-actions">
                  <button
                    type="button"
                    className="is-blue"
                    onClick={() =>
                      handleEditTutorial(
                        selectedTutorial
                      )
                    }
                  >
                    Edit Tutorial
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = selectedTutorial.slug
                        ? `/tutorial?search=${encodeURIComponent(selectedTutorial.slug)}`
                        : '/tutorial';
                    }}
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className="is-green"
                    onClick={() =>
                      handleTogglePublishTutorial(
                        selectedTutorial
                      )
                    }
                  >
                    Publish / Unpublish
                  </button>

                  <button
                    type="button"
                    className="is-purple"
                    onClick={() =>
                      showSuccessAlert(
                        'Statistik Tutorial',
                        `${selectedTutorial.viewer} viewer, ${selectedTutorial.completed} user selesai.`
                      )
                    }
                  >
                    Lihat Statistik
                  </button>

                  <button
                    type="button"
                    className="is-orange"
                    onClick={() =>
                      handleArchiveTutorial(
                        selectedTutorial
                      )
                    }
                  >
                    Arsipkan Tutorial
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteTutorial(
                        selectedTutorial
                      )
                    }
                  >
                    Hapus Tutorial
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
    </AdminPage>
  );
}

export default AdminTutorial;
