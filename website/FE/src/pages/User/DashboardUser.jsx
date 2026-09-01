import { useEffect, useMemo, useRef, useState } from 'react';

import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';

import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { ProfileImageCropper } from '../../features/profile-image-crop/ProfileImageCropper.jsx';

import {
  getUserSession,
  updateUserProfile,
} from '../../services/authApi.js';

import {
  fetchWorkshops,
  isPublicWorkshop,
} from '../../services/workshopApi.js';

import {
  fetchProjectSubmissions,
} from '../../services/projectApi.js';

import {
  fetchGallerySubmissions,
} from '../../services/galleryApi.js';

import {
  fetchPartners,
} from '../../services/partnerApi.js';

import {
  fetchTestimonials,
} from '../../services/testimonialApi.js';

import {
  fetchTransactions,
} from '../../services/transactionApi.js';

import {
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';

import {
  getInitialSidebarCollapsed,
  persistSidebarCollapsed,
} from './sidebarState.js';

/*
|--------------------------------------------------------------------------
| Sidebar menu
|--------------------------------------------------------------------------
*/

const menuItems = [
  {
    label: 'Profil',
    icon: 'user',
    href: '/dashboard',
    active: true,
  },
  {
    label: 'Progres Belajar',
    icon: 'graduation',
    href: '/progress-belajar',
  },
  {
    label: 'Proyek Saya',
    icon: 'folder',
    href: '/proyek-saya',
  },
  {
    label: 'Workshop / Program',
    icon: 'calendar',
    href: '/workshop-program',
  },
  {
    label: 'Lead Saya',
    icon: 'lead',
    href: '/lead-saya',
  },
  {
    label: 'Partner Saya',
    icon: 'partner',
    href: '/partner-saya',
  },
  {
    label: 'Transaksi',
    icon: 'transaction',
    href: '/transaksi',
  },
  {
    label: 'Sertifikat',
    icon: 'certificate',
    href: '/sertifikat',
  },
  {
    label: 'IDE',
    icon: 'cpu',
    href: '/ide-saya',
  },
  {
    label: 'Settings',
    icon: 'settings',
    href: '/settings',
  },
];

/*
|--------------------------------------------------------------------------
| Field profile
|--------------------------------------------------------------------------
*/

const fieldGroups = [
  [
    {
      label: 'Nama Lengkap',
      placeholder: 'Nama Lengkap',
      key: 'name',
    },
    {
      label: 'Nickname',
      placeholder: 'Nickname',
      key: 'nickname',
    },
    {
      label: 'No Whatsapp',
      placeholder: 'No Whatsapp',
      key: 'phone',
    },
    {
      label: 'Email',
      placeholder: 'mail@mail.com',
      key: 'email',
      type: 'email',
    },
  ],
  [
    {
      label: 'Username',
      placeholder: 'Username',
      key: 'username',
    },
    {
      label: 'Pekerjaan / Instansi',
      placeholder: 'Pilih pekerjaan',
      key: 'jobType',
      select: true,
    },
    {
      label: 'Nama Pekerjaan / Instansi',
      placeholder: 'Nama Pekerjaan / Instansi',
      key: 'institutionName',
    },
  ],
];

/*
|--------------------------------------------------------------------------
| Ambil user dari localStorage
|--------------------------------------------------------------------------
*/

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(
      'arduflow_user'
    );

    /*
    |--------------------------------------------------------------------------
    | Cegah JSON.parse("undefined") / JSON.parse("null")
    |--------------------------------------------------------------------------
    */

    if (
      !raw ||
      raw === 'undefined' ||
      raw === 'null'
    ) {
      window.localStorage.removeItem(
        'arduflow_user'
      );

      return {};
    }

    const parsed = JSON.parse(raw);

    /*
    |--------------------------------------------------------------------------
    | Pastikan hasilnya object user
    |--------------------------------------------------------------------------
    */

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      window.localStorage.removeItem(
        'arduflow_user'
      );

      return {};
    }

    return parsed;
  } catch (error) {
    console.warn(
      'Data arduflow_user di localStorage rusak dan dibersihkan.',
      error
    );

    window.localStorage.removeItem(
      'arduflow_user'
    );

    return {};
  }
}

/*
|--------------------------------------------------------------------------
| Mapping database ke field frontend
|--------------------------------------------------------------------------
*/

function buildProfileValues(user = {}) {
  return {
    name:
      user.name ||
      user.fullName ||
      user.full_name ||
      '',

    nickname:
      user.nickname ||
      '',

    phone:
      user.whatsapp ||
      user.phone ||
      '',

    email:
      user.email ||
      '',

    username:
      user.username ||
      '',

    jobType:
      String(
        user.occupation ||
        user.jobType ||
        user.job ||
        ''
      ).toLowerCase(),

    institutionName:
      user.institution_name ||
      user.institutionName ||
      user.company ||
      '',

    profileImage:
      user.profile_image ||
      user.profileImage ||
      user.avatar_path ||
      user.avatar ||
      '',
  };
}

function parseWorkshopDate(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatWorkshopDate(value) {
  const date = parseWorkshopDate(value);

  if (!date) {
    return 'Tanggal belum diatur';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatCalendarMonth(value) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatShortDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function normalizeMatchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function itemMatchesUser(item, user) {
  const userId = normalizeMatchValue(user?.id || user?.user_id);
  const userEmail = normalizeMatchValue(user?.email);
  const userName = normalizeMatchValue(user?.name || user?.fullName || user?.username);
  const username = normalizeMatchValue(user?.username);
  const payload = item?.payload && typeof item.payload === 'object' ? item.payload : {};
  const candidates = [
    item?.userId,
    item?.user_id,
    item?.ownerId,
    item?.owner_id,
    item?.authorId,
    item?.author_id,
    payload?.userId,
    payload?.user_id,
    payload?.ownerId,
    payload?.owner_id,
  ].map(normalizeMatchValue);

  if (userId && candidates.includes(userId)) {
    return true;
  }

  const textCandidates = [
    item?.email,
    item?.userEmail,
    item?.user_email,
    item?.ownerEmail,
    item?.owner_email,
    item?.userName,
    item?.user_name,
    item?.ownerName,
    item?.owner_name,
    item?.authorName,
    item?.author_name,
    item?.picName,
    item?.pic_name,
    item?.name,
    payload?.email,
    payload?.userEmail,
    payload?.ownerEmail,
    payload?.userName,
    payload?.ownerName,
    payload?.authorName,
    payload?.picName,
  ].map(normalizeMatchValue);

  return Boolean(
    (userEmail && textCandidates.includes(userEmail)) ||
      (userName && textCandidates.includes(userName)) ||
      (username && textCandidates.includes(username))
  );
}

function statusLabel(value) {
  const normalized = normalizeMatchValue(value);
  const labels = {
    published: 'Publish',
    publish: 'Publish',
    draft: 'Draft',
    review: 'Review',
    pending: 'Pending',
    rejected: 'Ditolak',
    approved: 'Disetujui',
    paid: 'Lunas',
    active: 'Aktif',
    inactive: 'Nonaktif',
  };

  return labels[normalized] || value || '-';
}

function testimonialKey(sourceType, sourceId) {
  return `${normalizeMatchValue(sourceType)}:${String(sourceId || '').trim()}`;
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      day: '',
      dateKey: '',
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;

    cells.push({
      key: dateKey,
      day: String(day),
      dateKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      day: '',
      dateKey: '',
    });
  }

  return cells;
}

/*
|--------------------------------------------------------------------------
| Dashboard User
|--------------------------------------------------------------------------
*/

export function DashboardUser() {
  const [
    isSidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(
    getInitialSidebarCollapsed
  );

  const [
    storedUser,
    setStoredUser,
  ] = useState(() =>
    getStoredUser()
  );

  const [
    profileValues,
    setProfileValues,
  ] = useState(() =>
    buildProfileValues(
      getStoredUser()
    )
  );

  const [
    isLoadingProfile,
    setIsLoadingProfile,
  ] = useState(true);

  const [
    isEditingProfile,
    setEditingProfile,
  ] = useState(false);

  const [
    profileMessage,
    setProfileMessage,
  ] = useState('');

  const [
    cropSource,
    setCropSource,
  ] = useState('');

  const [
    workshops,
    setWorkshops,
  ] = useState([]);

  const [
    isLoadingWorkshops,
    setIsLoadingWorkshops,
  ] = useState(true);

  const [
    workshopError,
    setWorkshopError,
  ] = useState('');

  const [
    dashboardRows,
    setDashboardRows,
  ] = useState({
    projects: [],
    galleries: [],
    partners: [],
    transactions: [],
    testimonials: [],
  });

  const [
    isLoadingDashboardRows,
    setIsLoadingDashboardRows,
  ] = useState(true);

  const [
    dashboardRowsError,
    setDashboardRowsError,
  ] = useState('');

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(() => new Date());

  const fileInputRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Data tampilan
  |--------------------------------------------------------------------------
  */

  const fullName =
    profileValues.name ||
    storedUser.name ||
    'Nama Lengkap';

  const greetingName =
    profileValues.nickname ||
    profileValues.username ||
    fullName;

  const email =
    profileValues.email ||
    storedUser.email ||
    'mail@mail.com';

  const visibleWorkshops = useMemo(() => {
    const publicRows = workshops.filter(isPublicWorkshop);
    const rows = publicRows.length > 0 ? publicRows : workshops;

    return rows
      .map((workshop) => ({
        ...workshop,
        parsedDate: parseWorkshopDate(workshop.startsAt),
      }))
      .sort((first, second) => {
        const firstTime = first.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const secondTime = second.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

        return firstTime - secondTime;
      });
  }, [workshops]);

  const calendarCells = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth]
  );

  const eventDateKeys = useMemo(() => {
    return new Set(
      visibleWorkshops
        .map((workshop) => workshop.parsedDate)
        .filter(Boolean)
        .map((date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            '0'
          )}-${String(date.getDate()).padStart(2, '0')}`;
        })
    );
  }, [visibleWorkshops]);

  const upcomingPrograms = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureRows = visibleWorkshops.filter((workshop) => {
      if (!workshop.parsedDate) {
        return true;
      }

      return workshop.parsedDate.getTime() >= today.getTime();
    });

    const rows = futureRows.length > 0 ? futureRows : visibleWorkshops;

    return rows.slice(0, 4).map((workshop) => ({
      id: workshop.id,
      title: workshop.title,
      href: workshop.id ? `/detail-workshop/${workshop.id}` : '/daftar-workshop',
      meta: [
        formatWorkshopDate(workshop.startsAt),
        workshop.timeText,
        workshop.method,
      ]
        .filter(Boolean)
        .join(' • '),
    }));
  }, [visibleWorkshops]);

  const myTransactions = useMemo(() => (
    dashboardRows.transactions.filter((transaction) => itemMatchesUser(transaction, storedUser))
  ), [dashboardRows.transactions, storedUser]);

  const myProjects = useMemo(() => (
    dashboardRows.projects.filter((project) => itemMatchesUser(project, storedUser))
  ), [dashboardRows.projects, storedUser]);

  const myGalleries = useMemo(() => (
    dashboardRows.galleries.filter((gallery) => itemMatchesUser(gallery, storedUser))
  ), [dashboardRows.galleries, storedUser]);

  const myPartners = useMemo(() => (
    dashboardRows.partners.filter((partner) => itemMatchesUser(partner, storedUser))
  ), [dashboardRows.partners, storedUser]);

  const myTestimonials = useMemo(() => (
    dashboardRows.testimonials.filter((testimonial) => itemMatchesUser(testimonial, storedUser))
  ), [dashboardRows.testimonials, storedUser]);

  const dashboardSummary = useMemo(() => {
    const draftProjects = myProjects.filter((project) => normalizeMatchValue(project.status || project.visibility) === 'draft').length;
    const publishedProjects = myProjects.filter((project) => ['published', 'publish'].includes(normalizeMatchValue(project.status))).length;
    const pendingTransactions = myTransactions.filter((transaction) => ['pending', 'waiting', 'unpaid'].includes(normalizeMatchValue(transaction.status))).length;
    const partnerActive = myPartners.filter((partner) => ['active', 'approved', 'published'].includes(normalizeMatchValue(partner.status))).length;

    return [
      { label: 'Total Proyek', value: myProjects.length, note: `${draftProjects} draft, ${publishedProjects} publish` },
      { label: 'Gallery Saya', value: myGalleries.length, note: 'Dokumentasi yang terhubung akun' },
      { label: 'Workshop', value: myTransactions.length, note: `${pendingTransactions} transaksi menunggu` },
      { label: 'Partner', value: myPartners.length, note: `${partnerActive} aktif/disetujui` },
    ];
  }, [myGalleries.length, myPartners, myProjects, myTransactions]);

  const profileChecklist = useMemo(() => {
    const items = [
      { label: 'Lengkapi nama lengkap', done: Boolean(profileValues.name) },
      { label: 'Tambahkan WhatsApp', done: Boolean(profileValues.phone) },
      { label: 'Isi pekerjaan / instansi', done: Boolean(profileValues.jobType && profileValues.institutionName) },
      { label: 'Upload foto profil', done: Boolean(profileValues.profileImage) },
      { label: 'Buat proyek pertama', done: myProjects.length > 0 },
      { label: 'Lengkapi data partner', done: myPartners.length > 0 },
    ];

    return {
      items,
      completed: items.filter((item) => item.done).length,
    };
  }, [myPartners.length, myProjects.length, profileValues]);

  const recentActivities = useMemo(() => {
    const rows = [
      ...myProjects.map((project) => ({
        type: 'Proyek',
        title: project.title || 'Proyek tanpa judul',
        status: statusLabel(project.status || project.visibility),
        date: project.updatedAt || project.createdAt,
        href: project.id ? `/project/detail?id=${project.id}` : '/proyek-saya',
      })),
      ...myGalleries.map((gallery) => ({
        type: 'Gallery',
        title: gallery.title || 'Gallery tanpa judul',
        status: statusLabel(gallery.status),
        date: gallery.updatedAt || gallery.createdAt || gallery.eventDate,
        href: gallery.id ? `/galeri/detail?id=${gallery.id}` : '/proyek-saya',
      })),
      ...myPartners.map((partner) => ({
        type: 'Partner',
        title: partner.name || 'Partner tanpa nama',
        status: statusLabel(partner.status),
        date: partner.updatedAt || partner.createdAt,
        href: '/partner-saya',
      })),
      ...myTransactions.map((transaction) => ({
        type: 'Transaksi',
        title: transaction.itemTitle || transaction.invoiceNumber || 'Transaksi workshop',
        status: statusLabel(transaction.status),
        date: transaction.updatedAt || transaction.createdAt || transaction.dueAt,
        href: '/transaksi',
      })),
    ];

    return rows
      .sort((first, second) => new Date(second.date || 0).getTime() - new Date(first.date || 0).getTime())
      .slice(0, 6);
  }, [myGalleries, myPartners, myProjects, myTransactions]);

  const testimonialNotice = useMemo(() => {
    const submittedKeys = new Set(
      myTestimonials
        .filter((testimonial) => testimonial.sourceType && testimonial.sourceId)
        .map((testimonial) => testimonialKey(testimonial.sourceType, testimonial.sourceId))
    );

    const partnerTargets = myPartners.filter((partner) => {
      const status = normalizeMatchValue(partner.status);
      return partner.id && ['aktif', 'active', 'approved', 'published'].includes(status) && !submittedKeys.has(testimonialKey('partner', partner.id));
    });

    const workshopTargets = myTransactions.filter((transaction) => {
      const status = normalizeMatchValue(transaction.status);
      const itemType = normalizeMatchValue(transaction.itemType || transaction.item_type || transaction.type);
      if (!['paid', 'lunas', 'approved'].includes(status)) return false;
      if (!['workshop', 'program', 'course'].includes(itemType)) return false;

      const sourceId = transaction.itemId || transaction.item_id || `transaction-${transaction.id}`;
      return sourceId && !submittedKeys.has(testimonialKey('workshop', sourceId));
    });

    const totalTargets = partnerTargets.length + workshopTargets.length;
    if (!totalTargets) return null;

    if (workshopTargets.length > 0) {
      return {
        count: totalTargets,
        title: 'Bagikan pengalaman workshop kamu',
        description: `${workshopTargets.length} workshop/program bisa diberi testimoni. Testimoni akan tampil setelah disetujui admin.`,
        href: '/workshop-program',
        action: 'Isi Testimoni Workshop',
      };
    }

    return {
      count: totalTargets,
      title: 'Bagikan pengalaman partner kamu',
      description: `${partnerTargets.length} partner aktif bisa diberi testimoni. Testimoni akan tampil setelah disetujui admin.`,
      href: '/partner-saya',
      action: 'Isi Testimoni Partner',
    };
  }, [myPartners, myTestimonials, myTransactions]);

  /*
  |--------------------------------------------------------------------------
  | Ambil profil dari API
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;

    async function loadUserProfile() {
      const token =
        window.localStorage.getItem(
          'arduflow_user_token'
        );

      if (!token) {
        window.location.assign(
          '/signin'
        );

        return;
      }

      try {
        setIsLoadingProfile(
          true
        );

        const result =
          await getUserSession(
            token
          );

        console.log(
          'SESSION DASHBOARD:',
          result
        );

        const user =
          result?.data?.user ??
          result?.user ??
          null;

        console.log(
          'USER DARI SQLITE:',
          user
        );

        if (!user) {
          throw new Error(
            'Data user tidak ditemukan pada response session.'
          );
        }

        if (!active) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Simpan data user yang valid
        |--------------------------------------------------------------------------
        */

        window.localStorage.setItem(
          'arduflow_user',
          JSON.stringify(user)
        );

        setStoredUser(
          user
        );

        const mappedProfile =
          buildProfileValues(
            user
          );

        console.log(
          'PROFILE VALUES:',
          mappedProfile
        );

        setProfileValues(
          mappedProfile
        );
      } catch (error) {
        console.error(
          'Gagal memuat profil user:',
          error
        );

        if (
          error?.status === 401
        ) {
          window.localStorage.removeItem(
            'arduflow_user'
          );

          window.localStorage.removeItem(
            'arduflow_user_token'
          );

          if (active) {
            window.location.assign(
              '/signin'
            );
          }
        }
      } finally {
        if (active) {
          setIsLoadingProfile(
            false
          );
        }
      }
    }

    loadUserProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWorkshops() {
      try {
        setIsLoadingWorkshops(true);
        setWorkshopError('');

        const rows = await fetchWorkshops();

        if (!active) {
          return;
        }

        setWorkshops(rows);
      } catch (error) {
        console.error('Gagal memuat workshop dashboard user:', error);

        if (active) {
          setWorkshops([]);
          setWorkshopError(
            error instanceof Error
              ? error.message
              : 'Data workshop tidak dapat dimuat.'
          );
        }
      } finally {
        if (active) {
          setIsLoadingWorkshops(false);
        }
      }
    }

    loadWorkshops();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboardRows() {
      try {
        setIsLoadingDashboardRows(true);
        setDashboardRowsError('');

        const transactionParams = {};
        const currentUserId = storedUser.id || storedUser.userId || storedUser.user_id;
        if (currentUserId) transactionParams.userId = currentUserId;
        if (storedUser.email) transactionParams.email = storedUser.email;

        const testimonialParams = storedUser.email ? { email: storedUser.email } : {};

        const [projectsResult, galleriesResult, partnersResult, transactionsResult, testimonialsResult] = await Promise.allSettled([
          fetchProjectSubmissions(),
          fetchGallerySubmissions(),
          fetchPartners(),
          fetchTransactions(transactionParams),
          storedUser.email ? fetchTestimonials(testimonialParams) : Promise.resolve({ testimonials: [] }),
        ]);

        if (!active) {
          return;
        }

        const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
        const galleries = galleriesResult.status === 'fulfilled' ? galleriesResult.value : [];
        const partnerPayload = partnersResult.status === 'fulfilled' ? partnersResult.value : {};
        const partners = Array.isArray(partnerPayload?.partners) ? partnerPayload.partners : [];
        const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : [];
        const testimonialPayload = testimonialsResult.status === 'fulfilled' ? testimonialsResult.value : {};
        const testimonials = Array.isArray(testimonialPayload?.testimonials) ? testimonialPayload.testimonials : [];
        const failed = [projectsResult, galleriesResult, partnersResult, transactionsResult, testimonialsResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason?.message)
          .filter(Boolean);

        setDashboardRows({
          projects,
          galleries,
          partners,
          transactions,
          testimonials,
        });

        setDashboardRowsError(failed.length ? failed[0] : '');
      } catch (error) {
        console.error('Gagal memuat ringkasan dashboard user:', error);

        if (active) {
          setDashboardRows({
            projects: [],
            galleries: [],
            partners: [],
            transactions: [],
            testimonials: [],
          });
          setDashboardRowsError(
            error instanceof Error
              ? error.message
              : 'Ringkasan dashboard tidak dapat dimuat.'
          );
        }
      } finally {
        if (active) {
          setIsLoadingDashboardRows(false);
        }
      }
    }

    loadDashboardRows();

    return () => {
      active = false;
    };
  }, [storedUser.id, storedUser.email, storedUser.username]);

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  function handleLogout() {
    window.localStorage.removeItem(
      'arduflow_user'
    );

    window.localStorage.removeItem(
      'arduflow_user_token'
    );

    window.dispatchEvent(
      new Event(
        'arduflow-auth-change'
      )
    );

    window.location.assign(
      '/signin'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Sidebar
  |--------------------------------------------------------------------------
  */

  function handleSidebarToggle() {
    setSidebarCollapsed(
      (current) => {
        const nextValue =
          !current;

        persistSidebarCollapsed(
          nextValue
        );

        return nextValue;
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Input profile
  |--------------------------------------------------------------------------
  */

  function updateProfileValue(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setProfileValues(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Edit / Cancel
  |--------------------------------------------------------------------------
  */

  function handleEditProfileToggle() {
    if (isEditingProfile) {
      setProfileValues(
        buildProfileValues(
          storedUser
        )
      );

      setEditingProfile(
        false
      );

      setProfileMessage(
        ''
      );

      setCropSource(
        ''
      );

      return;
    }

    setEditingProfile(
      true
    );

    setProfileMessage(
      ''
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Save profile
  |--------------------------------------------------------------------------
  */

  async function handleSaveProfile() {
    setProfileMessage('');

    try {
      const normalizedName =
        String(
          profileValues.name ||
          ''
        ).trim();

      if (!normalizedName) {
        throw new Error(
          'Nama lengkap wajib diisi.'
        );
      }

      const result =
        await updateUserProfile({
          id:
            storedUser.id,

          name:
            normalizedName,

          username:
            profileValues.username,

          nickname:
            profileValues.nickname,

          whatsapp:
            profileValues.phone,

          occupation:
            profileValues.jobType,

          institution_name:
            profileValues.institutionName,

          profile_image:
            profileValues.profileImage,
        });

      console.log(
        'UPDATE PROFILE RESPONSE:',
        result
      );

      const updatedUser =
        result?.data?.user ??
        result?.user ??
        null;

      if (!updatedUser) {
        throw new Error(
          'Response update profil tidak memiliki data user.'
        );
      }

      const nextUser = {
        ...storedUser,
        ...updatedUser,
      };

      /*
      |--------------------------------------------------------------------------
      | Jangan pernah simpan undefined
      |--------------------------------------------------------------------------
      */

      if (
        nextUser &&
        typeof nextUser === 'object'
      ) {
        window.localStorage.setItem(
          'arduflow_user',
          JSON.stringify(
            nextUser
          )
        );
      }

      setStoredUser(
        nextUser
      );

      setProfileValues(
        buildProfileValues(
          nextUser
        )
      );

      window.dispatchEvent(
        new Event(
          'arduflow-auth-change'
        )
      );

      setEditingProfile(
        false
      );

      setProfileMessage(
        'Profil berhasil disimpan.'
      );

      await showSuccessAlert(
        'Profil berhasil disimpan',
        'Data profil Anda sudah diperbarui.'
      );
    } catch (error) {
      console.error(
        'Update profile gagal:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Profil gagal disimpan.';

      setProfileMessage(
        message
      );

      await showErrorAlert(
        'Profil gagal disimpan',
        message
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Profile image
  |--------------------------------------------------------------------------
  */

  function handleProfileImageSelect(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setCropSource(
      URL.createObjectURL(
        file
      )
    );

    event.target.value =
      '';
  }

  function handleCroppedProfileImage(
    imageData
  ) {
    setProfileValues(
      (current) => ({
        ...current,
        profileImage:
          imageData,
      })
    );

    setEditingProfile(
      true
    );

    setProfileMessage(
      ''
    );

    setCropSource(
      ''
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoadingProfile) {
    return (
      <div className="dashboard-user-page">
        <main className="dashboard-content">
          <p>
            Memuat profil pengguna...
          </p>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={
        `dashboard-user-page${
          isSidebarCollapsed
            ? ' dashboard-user-page--collapsed'
            : ''
        }`
      }
    >
      <aside
        className="dashboard-sidebar"
        aria-label="Dashboard sidebar"
      >
        <a
          className="dashboard-sidebar__brand"
          href="/"
          aria-label="Kembali ke beranda"
        >
          <span>
            ARDU
          </span>

          <strong>
            FLOW
          </strong>
        </a>

        <button
          className="dashboard-sidebar__collapse"
          type="button"
          aria-expanded={
            !isSidebarCollapsed
          }
          aria-label={
            isSidebarCollapsed
              ? 'Buka sidebar'
              : 'Minimize sidebar'
          }
          onClick={
            handleSidebarToggle
          }
        >
          <img
            src={arrowDownIcon}
            alt=""
            aria-hidden="true"
          />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map(
            (item) => (
              <a
                className={
                  `dashboard-sidebar__item${
                    item.active
                      ? ' dashboard-sidebar__item--active'
                      : ''
                  }`
                }
                href={item.href}
                key={item.label}
              >
                <DashboardUserSidebarIcon name={item.icon} />

                <span>
                  {item.label}
                </span>
              </a>
            )
          )}

          <button
            className="dashboard-sidebar__item dashboard-sidebar__item--logout"
            type="button"
            onClick={
              handleLogout
            }
          >
            <img
              className="dashboard-sidebar__logout-icon"
              src={logoutIcon}
              alt=""
              aria-hidden="true"
            />

            <span>
              Logout
            </span>
          </button>
        </nav>
      </aside>

      <section className="dashboard-shell">

        <header className="dashboard-topbar">

          <div className="dashboard-topbar__user">

            <button
              className={`dashboard-notification${testimonialNotice ? ' dashboard-notification--has-testimonial' : ''}`}
              type="button"
              aria-label={testimonialNotice ? `${testimonialNotice.count} testimoni menunggu diisi` : 'Notifikasi'}
              onClick={() => document.getElementById(testimonialNotice ? 'dashboard-testimonial-notice' : 'dashboard-activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <img
                src={bellIcon}
                alt=""
                aria-hidden="true"
              />
            </button>

            <ProfileAvatar
              className="dashboard-mini-avatar"
              image={
                profileValues.profileImage
              }
              name={
                fullName
              }
            />

            <strong>
              {fullName}
            </strong>

          </div>

        </header>

        <main className="dashboard-content">

          <div className="dashboard-user-greeting">

            <h1>
              Hello {greetingName}
            </h1>

            <span aria-hidden="true">
              &#128075;&#127995;
            </span>

          </div>

          <section className="dashboard-user-summary" aria-label="Ringkasan aktivitas user">
            {dashboardSummary.map((item) => (
              <article className="dashboard-user-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{isLoadingDashboardRows ? '...' : item.value}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </section>

          {dashboardRowsError ? (
            <p className="dashboard-user-alert">
              {dashboardRowsError}
            </p>
          ) : null}

          {testimonialNotice ? (
            <section className="dashboard-testimonial-notice" id="dashboard-testimonial-notice" aria-label="Notifikasi testimoni">
              <div>
                <span>Testimoni</span>
                <h2>{testimonialNotice.title}</h2>
                <p>{testimonialNotice.description}</p>
              </div>
              <a href={testimonialNotice.href}>{testimonialNotice.action}</a>
            </section>
          ) : null}

          <section className="dashboard-quick-actions" aria-label="Aksi cepat dashboard">
            <a href="/proyek-saya">Buat / Edit Proyek</a>
            <a href="/proyek-saya">Upload Gallery</a>
            <a href="/workshop-program">Daftar Workshop</a>
            <a href="/partner-saya">Dashboard Partner</a>
            <button type="button" onClick={() => setEditingProfile(true)}>Edit Profil</button>
          </section>

          <div className="dashboard-main-content">

            <section className="dashboard-profile-panel">

              <div className="dashboard-profile-header">

                <ProfileAvatar
                  className="dashboard-profile-avatar"
                  image={
                    profileValues.profileImage
                  }
                  name={
                    fullName
                  }
                  editable
                  onEdit={() =>
                    fileInputRef.current?.click()
                  }
                />

                <input
                  ref={
                    fileInputRef
                  }
                  className="dashboard-profile-file"
                  type="file"
                  accept="image/*"
                  onChange={
                    handleProfileImageSelect
                  }
                />

                <div className="dashboard-profile-title">

                  <h2>
                    {fullName}
                  </h2>

                  <p>
                    {email}
                  </p>

                </div>

                <div
                  className={
                    `dashboard-actions${
                      isEditingProfile
                        ? ' dashboard-actions--editing'
                        : ''
                    }`
                  }
                >

                  <button
                    className={
                      `dashboard-button ${
                        isEditingProfile
                          ? 'dashboard-button--cancel'
                          : 'dashboard-button--edit'
                      }`
                    }
                    type="button"
                    onClick={
                      handleEditProfileToggle
                    }
                  >
                    {isEditingProfile
                      ? 'Cancel'
                      : 'Edit'}
                  </button>

                  {isEditingProfile ? (
                    <button
                      className="dashboard-button dashboard-button--save"
                      type="button"
                      onClick={
                        handleSaveProfile
                      }
                    >
                      Save
                    </button>
                  ) : null}

                </div>

              </div>

              <form className="dashboard-form">

                {fieldGroups.map(
                  (
                    group,
                    groupIndex
                  ) => (

                    <div
                      className="dashboard-form__column"
                      key={
                        groupIndex
                      }
                    >

                      {group.map(
                        (field) => (

                          <label
                            className="dashboard-field"
                            key={
                              field.key
                            }
                          >

                            <span>
                              {field.label}
                            </span>

                            {field.select ? (

                              <select
                                name={
                                  field.key
                                }
                                value={
                                  profileValues[
                                    field.key
                                  ] || ''
                                }
                                onChange={
                                  updateProfileValue
                                }
                                disabled={
                                  !isEditingProfile
                                }
                              >

                                <option
                                  value=""
                                  disabled
                                >
                                  {
                                    field.placeholder
                                  }
                                </option>

                                <option value="siswa">
                                  Siswa
                                </option>

                                <option value="mahasiswa">
                                  Mahasiswa
                                </option>

                                <option value="pengajar">
                                  Pengajar
                                </option>

                                <option value="profesional">
                                  Profesional
                                </option>

                                <option value="lainnya">
                                  Lainnya
                                </option>

                              </select>

                            ) : (

                              <input
                                type={
                                  field.type ||
                                  'text'
                                }
                                name={
                                  field.key
                                }
                                placeholder={
                                  field.placeholder
                                }
                                value={
                                  profileValues[
                                    field.key
                                  ] || ''
                                }
                                onChange={
                                  updateProfileValue
                                }
                                disabled={
                                  !isEditingProfile ||
                                  field.key ===
                                    'email'
                                }
                              />

                            )}

                          </label>

                        )
                      )}

                    </div>

                  )
                )}

              </form>

              {profileMessage ? (
                <p className="dashboard-profile-message">
                  {profileMessage}
                </p>
              ) : null}

            </section>

            <aside
              className="dashboard-program-panel"
              aria-label="Kalender Workshop dan Program"
            >

              <section className="dashboard-calendar">

                <h2>
                  Kalender Workshop / Program
                </h2>

                <div className="dashboard-calendar__month">

                  <button
                    type="button"
                    aria-label="Bulan sebelumnya"
                    onClick={() =>
                      setCalendarMonth(
                        (current) =>
                          new Date(
                            current.getFullYear(),
                            current.getMonth() - 1,
                            1
                          )
                      )
                    }
                  >
                    &lsaquo;
                  </button>

                  <span>
                    {formatCalendarMonth(calendarMonth)}
                  </span>

                  <button
                    className="dashboard-calendar__next"
                    type="button"
                    aria-label="Bulan berikutnya"
                    onClick={() =>
                      setCalendarMonth(
                        (current) =>
                          new Date(
                            current.getFullYear(),
                            current.getMonth() + 1,
                            1
                          )
                      )
                    }
                  >
                    &rsaquo;
                  </button>

                </div>

                <div className="dashboard-calendar__grid">

                  {[
                    'SUN',
                    'MON',
                    'TUE',
                    'WED',
                    'THU',
                    'FRI',
                    'SAT',
                  ].map(
                    (day) => (
                      <strong
                        key={
                          day
                        }
                      >
                        {day}
                      </strong>
                    )
                  )}

                  {calendarCells.map(
                    (cell) => (

                      <span
                        className={
                          cell.dateKey &&
                          eventDateKeys.has(
                            cell.dateKey
                          )
                            ? 'dashboard-calendar__day dashboard-calendar__day--event'
                            : 'dashboard-calendar__day'
                        }
                        key={
                          cell.key
                        }
                      >
                        {cell.day}
                      </span>

                    )
                  )}

                </div>

              </section>

              <section className="dashboard-upcoming">

                <h2>
                  Workshop / Program mendatang
                </h2>

                <div className="dashboard-upcoming__list">

                  {isLoadingWorkshops ? (
                    <p className="dashboard-upcoming__empty">
                      Memuat data workshop...
                    </p>
                  ) : workshopError ? (
                    <p className="dashboard-upcoming__empty">
                      {workshopError}
                    </p>
                  ) : upcomingPrograms.length === 0 ? (
                    <p className="dashboard-upcoming__empty">
                      Belum ada workshop / program dari database.
                    </p>
                  ) : (
                    upcomingPrograms.map(
                      (program) => (

                        <a
                          className="dashboard-upcoming__card"
                          href={
                            program.href
                          }
                          key={
                            program.id
                          }
                        >

                          <span>

                            <strong>
                              {program.title}
                            </strong>

                            <small>
                              {program.meta}
                            </small>

                          </span>

                          <b aria-hidden="true">
                            &rsaquo;
                          </b>

                        </a>

                      )
                    )
                  )}

                </div>

              </section>

            </aside>

          </div>

          <section className="dashboard-user-overview" aria-label="Overview dashboard user">
            <article className="dashboard-user-widget">
              <header>
                <h2>Proyek & Gallery Saya</h2>
                <a href="/proyek-saya">Kelola</a>
              </header>
              <div className="dashboard-user-list">
                {[...myProjects.slice(0, 3), ...myGalleries.slice(0, 2)].length ? (
                  [...myProjects.slice(0, 3), ...myGalleries.slice(0, 2)].map((item) => (
                    <a className="dashboard-user-row" href={item.title && item.tag ? `/galeri/detail?id=${item.id}` : `/project/detail?id=${item.id}`} key={`${item.title}-${item.id}`}>
                      <span>
                        <strong>{item.title || 'Tanpa judul'}</strong>
                        <small>{item.tag ? 'Gallery' : 'Proyek'} • {statusLabel(item.status || item.visibility)}</small>
                      </span>
                      <b>{formatShortDate(item.updatedAt || item.createdAt || item.eventDate)}</b>
                    </a>
                  ))
                ) : (
                  <p className="dashboard-user-empty">Belum ada proyek atau gallery yang terhubung ke akun ini.</p>
                )}
              </div>
            </article>

            <article className="dashboard-user-widget">
              <header>
                <h2>Partner Saya</h2>
                <a href="/partner-saya">Update Data</a>
              </header>
              <div className="dashboard-user-list">
                {myPartners.length ? (
                  myPartners.slice(0, 4).map((partner) => (
                    <a className="dashboard-user-row" href="/partner-saya" key={partner.id || partner.name}>
                      <span>
                        <strong>{partner.name || 'Partner tanpa nama'}</strong>
                        <small>{partner.type || 'Partner'} • {statusLabel(partner.status)}</small>
                      </span>
                      <b>{formatShortDate(partner.updatedAt || partner.createdAt)}</b>
                    </a>
                  ))
                ) : (
                  <p className="dashboard-user-empty">Belum ada partner yang terhubung ke akun ini.</p>
                )}
              </div>
            </article>

            <article className="dashboard-user-widget">
              <header>
                <h2>Checklist Akun</h2>
                <span>{profileChecklist.completed}/{profileChecklist.items.length}</span>
              </header>
              <div className="dashboard-user-checklist">
                {profileChecklist.items.map((item) => (
                  <button
                    className={item.done ? 'is-done' : ''}
                    type="button"
                    key={item.label}
                    onClick={() => {
                      if (!item.done && item.label.includes('proyek')) window.location.href = '/proyek-saya';
                      else if (!item.done && item.label.includes('partner')) window.location.href = '/partner-saya';
                      else if (!item.done) setEditingProfile(true);
                    }}
                  >
                    <i aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
              </div>
            </article>

            <article className="dashboard-user-widget" id="dashboard-activity">
              <header>
                <h2>Riwayat Aktivitas</h2>
                <span>{recentActivities.length} terbaru</span>
              </header>
              <div className="dashboard-user-timeline">
                {recentActivities.length ? (
                  recentActivities.map((activity) => (
                    <a href={activity.href} key={`${activity.type}-${activity.title}-${activity.date}`}>
                      <i aria-hidden="true" />
                      <span>
                        <strong>{activity.title}</strong>
                        <small>{activity.type} • {activity.status}</small>
                      </span>
                      <time>{formatShortDate(activity.date)}</time>
                    </a>
                  ))
                ) : (
                  <p className="dashboard-user-empty">Aktivitas terbaru akan tampil setelah Anda membuat proyek, gallery, transaksi, atau partner.</p>
                )}
              </div>
            </article>
          </section>

        </main>

      </section>

      <ProfileImageCropper
        source={
          cropSource
        }
        onCancel={() =>
          setCropSource('')
        }
        onApply={
          handleCroppedProfileImage
        }
      />

    </div>
  );
}
