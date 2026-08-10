import { useEffect, useMemo, useState } from 'react';

import { AdminSidebar } from './AdminSidebar.jsx';

import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';

import bellIcon from '../../assets/icons/icon-bell-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import reportIcon from '../../assets/icons/icons-reportchart-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';

/* =========================================================
   ARTICLE API
========================================================= */

const ARTICLE_API_URL = (
  import.meta.env.VITE_ARTICLE_API_URL ||
  'http://127.0.0.1:8000/api/article-api.php'
).trim();

/* =========================================================
   TOPBAR
========================================================= */

function AdminTutorialTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />

        <input
          type="search"
          placeholder="Cari tutorial / materi"
          aria-label="Cari tutorial atau materi"
        />
      </label>

      <div className="admin-dashboard-account">
        <button
          className="admin-dashboard-notif"
          type="button"
          aria-label="Notifikasi"
        >
          <img src={bellIcon} alt="" />
        </button>

        <span
          className="admin-dashboard-avatar"
          aria-hidden="true"
        />

        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
      </div>
    </header>
  );
}

/* =========================================================
   BADGE
========================================================= */

function TutorialBadge({ children }) {
  const slug = String(children || '-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');

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
   NORMALIZE TUTORIAL DATA
========================================================= */

function normalizeTutorial(item) {
  const status = normalizeStatus(
    item?.status
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
    isSidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(
    getInitialAdminSidebarCollapsed
  );

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

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const handleToggleSidebar = () => {
    setSidebarCollapsed(
      (value) => {
        const nextValue =
          !value;

        persistAdminSidebarCollapsed(
          nextValue
        );

        return nextValue;
      }
    );
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

      console.log(
        'HTTP Status:',
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        'Response mentah API:',
        responseText
      );

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

      console.log(
        'Response JSON API:',
        result
      );

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
            return normalizedRows[0];
          }

          return (
            normalizedRows.find(
              (item) =>
                item.id ===
                current.id
            ) ||
            normalizedRows[0]
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
            !item.card_image_name
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
    <main
      className={`admin-dashboard-page admin-tutorial-page${
        isSidebarCollapsed
          ? ' admin-dashboard-page--collapsed'
          : ''
      }`}
    >
      <AdminSidebar
        isCollapsed={
          isSidebarCollapsed
        }
        onToggleCollapse={
          handleToggleSidebar
        }
      />

      <section
        className="admin-dashboard-main"
        aria-label="Tutorial dan materi admin"
      >
        <AdminTutorialTopbar />

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
                            <span
                              className={`admin-tutorial-thumb is-${
                                index %
                                4
                              }`}
                            />

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
                                  setSelectedTutorial(
                                    item
                                  )
                                }
                              >
                                Edit
                              </TutorialAction>

                              <TutorialAction
                                label={`Statistik ${item.title}`}
                                onClick={() =>
                                  setSelectedTutorial(
                                    item
                                  )
                                }
                              >
                                <img
                                  src={
                                    reportIcon
                                  }
                                  alt=""
                                />
                              </TutorialAction>

                              <TutorialAction
                                label={`Menu ${item.title}`}
                                onClick={() =>
                                  setSelectedTutorial(
                                    item
                                  )
                                }
                              >
                                ...
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

                <button type="button">
                  Export Data Tutorial
                </button>

                <button type="button">
                  Cek Link Rusak
                </button>

                <button type="button">
                  Reorder Materi Belajar
                </button>
              </div>
            </section>
          </section>

          {/* =========================
              DETAIL
          ========================= */}

          <aside
            className="admin-tutorial-detail"
            aria-label="Detail tutorial"
          >
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

            {selectedTutorial ? (
              <>
                <div className="admin-tutorial-detail-profile">
                  <span className="admin-tutorial-detail-image" />

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
                  >
                    Edit Tutorial
                  </button>

                  <button type="button">
                    Preview
                  </button>

                  <button
                    type="button"
                    className="is-green"
                  >
                    Publish / Unpublish
                  </button>

                  <button
                    type="button"
                    className="is-purple"
                  >
                    Lihat Statistik
                  </button>

                  <button
                    type="button"
                    className="is-orange"
                  >
                    Arsipkan Tutorial
                  </button>
                </div>
              </>
            ) : (
              <p>
                Pilih salah satu materi pada tabel untuk melihat detail.
              </p>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default AdminTutorial;