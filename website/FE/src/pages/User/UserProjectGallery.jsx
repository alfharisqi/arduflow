import { useState } from 'react';

import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';

import projectImage from '../../assets/images/workshop-experience-student.png';

import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';

import {
  getInitialSidebarCollapsed,
  persistSidebarCollapsed,
} from './sidebarState.js';


/* =========================================================
   PROJECT API
========================================================= */

const PROJECT_API_URL = (
  import.meta.env.VITE_PROJECT_API_URL ||
  'http://127.0.0.1:8000/api/projects-api.php'
).trim();


/* =========================================================
   SIDEBAR MENU
========================================================= */

const menuItems = [
  {
    label: 'Profil',
    icon: 'user',
    href: '/dashboard',
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
    active: true,
  },
  {
    label: 'Workshop / Program',
    icon: 'calendar',
    href: '/workshop-program',
  },
  {
    label: 'IDE',
    icon: 'cpu',
    href: '/ide',
  },
  {
    label: 'Sertifikat',
    icon: 'certificate',
    href: '/sertifikat',
  },
  {
    label: 'Settings',
    icon: 'settings',
    href: '/settings',
  },
];


/* =========================================================
   PROJECT DUMMY
========================================================= */

const projects = Array.from(
  {
    length: 9,
  },
  (_, index) => ({
    id: index + 1,
    title: 'Judul Proyek',
    category: 'Kategori Proyek',
    date: 'Hari Bulan Tanggal',
    price: 'IDR 10.000',
  })
);


/* =========================================================
   USER STORAGE
========================================================= */

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(
      'arduflow_user'
    );

    if (
      !raw ||
      raw === 'undefined' ||
      raw === 'null'
    ) {
      return {};
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      'Gagal membaca localStorage user:',
      error
    );

    return {};
  }
}


function getInitials(name) {
  return (name || 'Nama Lengkap')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}


/* =========================================================
   SIDEBAR ICON
========================================================= */

function SidebarIcon({ name }) {
  const commonProps = {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const paths = {
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),

    graduation: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </>
    ),

    folder: (
      <>
        <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M3 7V5a2 2 0 0 1 2-2h4l2 4" />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="17"
          rx="2"
        />

        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
      </>
    ),

    cpu: (
      <>
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="1"
        />

        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </>
    ),

    settings: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
        />

        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2.8a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return (
    <svg {...commonProps}>
      {paths[name]}
    </svg>
  );
}


/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke="currentColor"
        strokeWidth="2.2"
      />

      <path
        d="m20 20-3.8-3.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}


function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M8 12h8M10 18h4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}


function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 16V7"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />

      <path
        d="m8.5 10.5 3.5-3.5 3.5 3.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4 15v3.2A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8V15"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}


function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}


function BoxPlusIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 5 9 13.5v21L24 43l15-8.5v-21L24 5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M24 22 39 13.5M24 22 9 13.5M24 22v21"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M38 4v8M34 8h8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


function ImageIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="8.5"
        cy="8.5"
        r="1.7"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m5 17 4.3-4.3a1.4 1.4 0 0 1 2 0L13 14.4l2.3-2.3a1.4 1.4 0 0 1 2 0L21 15.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function PublishIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m21 3-8.8 18-3-7.8L1.5 10 21 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function SaveIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 3h12l2 2v16H5V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M8 3v6h8V3M8 21v-7h8v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 12a8 8 0 1 1-2.35-5.65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M20 4v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}


function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
      />

      <path
        d="M12 10v6M12 7.5h.01"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}


/* =========================================================
   SHARED FIELD
========================================================= */

function UploadField({
  label,
  hint,
  children,
}) {
  return (
    <label className="project-upload-field">
      <span>
        {label}
      </span>

      {children}

      {hint ? (
        <small>
          {hint}
        </small>
      ) : null}
    </label>
  );
}


function EmptyUploadTable({
  title,
  description,
}) {
  return (
    <div className="project-upload-table">
      <div className="project-upload-table__head">
        <span>
          Langkah
        </span>

        <span>
          Deskripsi
        </span>
      </div>

      <div className="project-upload-empty">
        <BoxPlusIcon />

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}


/* =========================================================
   PROJECT UPLOAD FORM
========================================================= */

function ProjectUploadForm({
  onCancel,
}) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',

    tools: [],
    nodes: [],
    steps: [],

    isPaid: false,
    price: '',
    paymentCode: '',

    projectFile: null,
    coverImage: null,
    altText: '',

    visibility: 'public',

    difficulty: '',
    estimatedTime: '',
    programmingLanguage: '',

    tags: [
      'IoT',
      'Arduino',
      'Sensor',
      'SmartHome',
    ],
  });

  const [newTag, setNewTag] = useState('');

  const [jsonResult, setJsonResult] =
    useState(null);

  const [formError, setFormError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);


  /* =======================================================
     INPUT
  ======================================================= */

  function handleInputChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,

      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));

    setFormError('');
  }


  function handleFileChange(event) {
    const {
      name,
      files,
    } = event.target;

    setFormData((current) => ({
      ...current,

      [name]:
        files?.[0] || null,
    }));

    setFormError('');
  }


  /* =======================================================
     TOOL
  ======================================================= */

  function addTool() {
    const name = window.prompt(
      'Masukkan nama alat atau komponen:'
    );

    if (!name?.trim()) {
      return;
    }

    const specification =
      window.prompt(
        'Masukkan keterangan atau spesifikasi:'
      ) || '';

    setFormData((current) => ({
      ...current,

      tools: [
        ...current.tools,

        {
          name:
            name.trim(),

          specification:
            specification.trim(),
        },
      ],
    }));
  }


  /* =======================================================
     NODE
  ======================================================= */

  function addNode() {
    const name = window.prompt(
      'Masukkan nama node ArduFlow:'
    );

    if (!name?.trim()) {
      return;
    }

    const description =
      window.prompt(
        'Masukkan fungsi atau keterangan node:'
      ) || '';

    setFormData((current) => ({
      ...current,

      nodes: [
        ...current.nodes,

        {
          name:
            name.trim(),

          description:
            description.trim(),
        },
      ],
    }));
  }


  /* =======================================================
     STEP
  ======================================================= */

  function addStep() {
    const description =
      window.prompt(
        'Masukkan deskripsi langkah pengerjaan:'
      );

    if (!description?.trim()) {
      return;
    }

    setFormData((current) => ({
      ...current,

      steps: [
        ...current.steps,

        {
          order:
            current.steps.length + 1,

          description:
            description.trim(),
        },
      ],
    }));
  }


  /* =======================================================
     PAYMENT CODE
  ======================================================= */

  function generatePaymentCode() {
    if (
      !formData.isPaid ||
      Number(formData.price) <= 0
    ) {
      setFormError(
        'Aktifkan proyek berbayar dan isi harga terlebih dahulu.'
      );

      return;
    }

    const randomPart =
      crypto
        .randomUUID()
        .replaceAll('-', '')
        .slice(0, 8)
        .toUpperCase();

    setFormData((current) => ({
      ...current,

      paymentCode:
        `ARDU-${randomPart}`,
    }));

    setFormError('');
  }


  async function copyPaymentCode() {
    if (!formData.paymentCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formData.paymentCode
      );
    } catch (error) {
      console.error(
        'Kode tidak dapat disalin:',
        error
      );
    }
  }


  /* =======================================================
     TAG
  ======================================================= */

  function addTag() {
    const tag =
      newTag.trim();

    if (!tag) {
      return;
    }

    const alreadyExists =
      formData.tags.some(
        (item) =>
          item.toLowerCase() ===
          tag.toLowerCase()
      );

    if (alreadyExists) {
      return;
    }

    setFormData((current) => ({
      ...current,

      tags: [
        ...current.tags,
        tag,
      ],
    }));

    setNewTag('');
  }


  function removeTag(
    tagToRemove
  ) {
    setFormData((current) => ({
      ...current,

      tags:
        current.tags.filter(
          (tag) =>
            tag !== tagToRemove
        ),
    }));
  }


  /* =======================================================
     FILE METADATA
  ======================================================= */

  function fileToJson(file) {
    if (!file) {
      return null;
    }

    return {
      name:
        file.name,

      size:
        file.size,

      type:
        file.type ||
        'application/octet-stream',
    };
  }


  /* =======================================================
     CREATE PROJECT JSON
  ======================================================= */

  function createProjectJson(
    status
  ) {
    const title =
      formData.title.trim();

    const isDraft =
      status === 'draft';

    const errors = [];


    if (!isDraft && !title) {
      errors.push(
        'Judul proyek wajib diisi.'
      );
    }


    if (
      !isDraft &&
      !formData.category.trim()
    ) {
      errors.push(
        'Kategori wajib diisi.'
      );
    }


    if (
      !isDraft &&
      !formData.description.trim()
    ) {
      errors.push(
        'Deskripsi wajib diisi.'
      );
    }


    if (
      !isDraft &&
      !formData.projectFile
    ) {
      errors.push(
        'File proyek wajib dipilih.'
      );
    }


    if (
      !isDraft &&
      !formData.coverImage
    ) {
      errors.push(
        'Gambar cover wajib dipilih.'
      );
    }


    if (
      !isDraft &&
      formData.tools.length === 0
    ) {
      errors.push(
        'Tambahkan minimal satu alat atau komponen.'
      );
    }


    if (
      !isDraft &&
      formData.nodes.length === 0
    ) {
      errors.push(
        'Tambahkan minimal satu node ArduFlow.'
      );
    }


    if (
      !isDraft &&
      formData.steps.length === 0
    ) {
      errors.push(
        'Tambahkan minimal satu langkah pengerjaan.'
      );
    }


    if (
      formData.isPaid &&
      Number(formData.price) <= 0
    ) {
      errors.push(
        'Harga proyek berbayar harus lebih dari 0.'
      );
    }


    if (
      formData.isPaid &&
      !formData.paymentCode
    ) {
      errors.push(
        'Generate kode pembayaran terlebih dahulu.'
      );
    }


    if (errors.length > 0) {
      setFormError(
        errors.join(' ')
      );

      setJsonResult(null);

      return null;
    }


    const now =
      new Date().toISOString();


    const projectData = {
      id:
        crypto.randomUUID(),

      title,

      slug: title
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9\s-]/g,
          ''
        )
        .replace(
          /\s+/g,
          '-'
        )
        .replace(
          /-+/g,
          '-'
        ),

      category:
        formData.category.trim(),

      description:
        formData.description.trim(),

      tools:
        formData.tools,

      nodes:
        formData.nodes,

      steps:
        formData.steps,

      payment: {
        isPaid:
          formData.isPaid,

        price:
          formData.isPaid
            ? Number(
                formData.price
              )
            : 0,

        currency:
          'IDR',

        paymentCode:
          formData.isPaid
            ? formData.paymentCode
            : null,
      },

      projectFile:
        fileToJson(
          formData.projectFile
        ),

      coverImage:
        formData.coverImage
          ? {
              ...fileToJson(
                formData.coverImage
              ),

              altText:
                formData.altText.trim(),
            }
          : null,

      visibility:
        isDraft
          ? 'draft'
          : formData.visibility,

      difficulty:
        formData.difficulty,

      estimatedTime:
        formData.estimatedTime.trim(),

      programmingLanguage:
        formData.programmingLanguage.trim(),

      tags:
        formData.tags,

      status:
        isDraft
          ? 'draft'
          : 'published',

      publishedAt:
        isDraft
          ? null
          : now,

      createdAt:
        now,
    };


    console.log(
      'Request Project JSON:',
      projectData
    );


    setFormError('');

    return projectData;
  }


  /* =======================================================
     SEND API
  ======================================================= */

  async function sendProjectToApi(
    status
  ) {
    const projectData =
      createProjectJson(
        status
      );


    if (!projectData) {
      return;
    }


    if (isSubmitting) {
      return;
    }


    setIsSubmitting(true);
    setFormError('');
    setJsonResult(null);


    console.group(
      'DEBUG PROJECT API'
    );

    console.log(
      'Endpoint:',
      PROJECT_API_URL
    );

    console.log(
      'Method:',
      'POST'
    );

    console.log(
      'Request JSON:',
      projectData
    );


    try {
      const token =
        window.localStorage.getItem(
          'arduflow_user_token'
        );


      const headers = {
        'Content-Type':
          'application/json',

        Accept:
          'application/json',
      };


      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }


      const response =
        await fetch(
          PROJECT_API_URL,
          {
            method:
              'POST',

            headers,

            body:
              JSON.stringify(
                projectData
              ),
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


      let result;


      try {
        result =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch (jsonError) {
        console.error(
          'Response API bukan JSON:',
          jsonError
        );


        setJsonResult({
          success:
            false,

          status_code:
            response.status,

          message:
            'Response API bukan JSON yang valid.',

          response_text:
            responseText.slice(
              0,
              500
            ),

          endpoint:
            PROJECT_API_URL,
        });


        setFormError(
          'Response dari API bukan JSON yang valid.'
        );


        return;
      }


      const finalResult = {
        status_code:
          response.status,

        ...result,
      };


      console.log(
        'Response JSON API:',
        finalResult
      );


      setJsonResult(
        finalResult
      );


      if (
        !response.ok ||
        result.success === false
      ) {
        const backendErrors =
          result.errors &&
          typeof result.errors ===
            'object'
            ? Object.values(
                result.errors
              ).join(' ')
            : '';


        setFormError(
          backendErrors ||
          result.message ||
          `Request gagal dengan HTTP ${response.status}.`
        );


        return;
      }


      setFormError('');


      window.alert(
        result.message ||
        (
          status === 'draft'
            ? 'Draft proyek berhasil disimpan.'
            : 'Proyek berhasil dipublikasikan.'
        )
      );
    } catch (error) {
      console.error(
        'Project API Error:',
        error
      );


      const errorResponse = {
        success:
          false,

        status_code:
          0,

        message:
          'API proyek tidak dapat dihubungi.',

        error: {
          name:
            error.name ||
            'Error',

          detail:
            error.message ||
            'Failed to fetch',
        },

        request: {
          method:
            'POST',

          endpoint:
            PROJECT_API_URL,
        },

        timestamp:
          new Date().toISOString(),
      };


      setJsonResult(
        errorResponse
      );


      if (
        error instanceof TypeError ||
        error.message ===
          'Failed to fetch'
      ) {
        setFormError(
          `Failed to fetch. API tidak dapat dihubungi di ${PROJECT_API_URL}. Pastikan PHP server berjalan, endpoint benar, dan CORS diizinkan.`
        );
      } else {
        setFormError(
          error.message ||
          'Terjadi kesalahan saat menyimpan proyek.'
        );
      }
    } finally {
      setIsSubmitting(false);

      console.groupEnd();
    }
  }


  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    await sendProjectToApi(
      'published'
    );
  }


  /* =======================================================
     JSX
  ======================================================= */

  return (
    <section
      className="project-upload-page"
      aria-labelledby="project-upload-title"
    >
      <h2 id="project-upload-title">
        Upload Proyek Baru
      </h2>


      <div className="project-upload-layout">
        <form
          className="project-upload-main"
          id="project-upload-form"
          onSubmit={
            handleSubmit
          }
        >
          {/* =========================
              JUDUL
          ========================= */}

          <UploadField
            label="Judul Proyek *"
            hint="Pilih judul yang jelas dan menarik"
          >
            <input
              name="title"
              type="text"
              value={
                formData.title
              }
              onChange={
                handleInputChange
              }
              placeholder="Masukkan judul proyek"
            />
          </UploadField>


          {/* =========================
              KATEGORI
          ========================= */}

          <UploadField
            label="Kategori *"
            hint="Pilih kategori yang paling sesuai dengan proyek anda"
          >
            <input
              name="category"
              type="text"
              value={
                formData.category
              }
              onChange={
                handleInputChange
              }
              placeholder="Pilih kategori proyek"
            />
          </UploadField>


          {/* =========================
              DESKRIPSI
          ========================= */}

          <div className="project-upload-field">
            <span>
              Deskripsi Proyek *
            </span>

            <div className="project-upload-editor">
              <div
                className="project-upload-editor__toolbar"
                aria-hidden="true"
              >
                <span>
                  ↶
                </span>

                <span>
                  ↷
                </span>

                <span>
                  Normal text⌄
                </span>

                <span>
                  ≡
                </span>

                <span className="project-upload-editor__color" />

                <b>
                  B
                </b>

                <i>
                  I
                </i>

                <u>
                  U
                </u>

                <span>
                  S
                </span>

                <span>
                  &lt;&gt;
                </span>

                <span>
                  ▱
                </span>

                <span>
                  •≡
                </span>

                <span>
                  1≡
                </span>

                <span>
                  🔗
                </span>
              </div>


              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleInputChange
                }
                placeholder="Jelaskan proyek anda secara detail..."
              />
            </div>


            <small>
              Jelaskan fungsi, tujuan, dan cara kerja proyek anda
            </small>
          </div>


          {/* =========================
              TOOLS
          ========================= */}

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div>
                <h3>
                  Alat &amp; Komponen *
                </h3>

                <p>
                  Daftarkan alat dan komponen yang digunakan dalam proyek ini
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addTool
                }
              >
                <PlusIcon />

                Tambah Item
              </button>
            </div>


            <div className="project-upload-table">
              <div className="project-upload-table__head">
                <span>
                  Nama Alat/Komponen
                </span>

                <span>
                  Keterangan/Spesifikasi
                </span>
              </div>


              {formData.tools.length ? (
                formData.tools.map(
                  (
                    tool,
                    index
                  ) => (
                    <div
                      className="project-upload-table__head"
                      key={`${tool.name}-${index}`}
                    >
                      <span>
                        {
                          tool.name
                        }
                      </span>

                      <span>
                        {
                          tool.specification ||
                          '-'
                        }
                      </span>
                    </div>
                  )
                )
              ) : (
                <div className="project-upload-empty">
                  <BoxPlusIcon />

                  <strong>
                    Belum ada alat atau komponen
                  </strong>

                  <p>
                    Klik tombol “Tambah Item” untuk menambahkan
                  </p>
                </div>
              )}
            </div>
          </section>


          {/* =========================
              NODES
          ========================= */}

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div>
                <h3>
                  Node ArduFlow yang Digunakan *
                </h3>

                <p>
                  Sebutkan node atau blok Arduflow yang digunakan dalam proyek ini
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addNode
                }
              >
                <PlusIcon />

                Tambah Node
              </button>
            </div>


            {formData.nodes.length ? (
              <div className="project-upload-table">
                <div className="project-upload-table__head">
                  <span>
                    Node
                  </span>

                  <span>
                    Deskripsi
                  </span>
                </div>


                {formData.nodes.map(
                  (
                    node,
                    index
                  ) => (
                    <div
                      className="project-upload-table__head"
                      key={`${node.name}-${index}`}
                    >
                      <span>
                        {
                          node.name
                        }
                      </span>

                      <span>
                        {
                          node.description ||
                          '-'
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyUploadTable
                title="Belum ada node yang ditambahkan"
                description="Klik tombol “Tambah Node” untuk menambahkan"
              />
            )}
          </section>


          {/* =========================
              STEPS
          ========================= */}

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div>
                <h3>
                  Langkah-langkah Pengerjaan *
                </h3>

                <p>
                  Jelaskan langkah langkah pembuatan proyek secara berurutan
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addStep
                }
              >
                <PlusIcon />

                Tambah Langkah
              </button>
            </div>


            {formData.steps.length ? (
              <div className="project-upload-table">
                <div className="project-upload-table__head">
                  <span>
                    Langkah
                  </span>

                  <span>
                    Deskripsi
                  </span>
                </div>


                {formData.steps.map(
                  (step) => (
                    <div
                      className="project-upload-table__head"
                      key={
                        step.order
                      }
                    >
                      <span>
                        {
                          step.order
                        }
                      </span>

                      <span>
                        {
                          step.description
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyUploadTable
                title="Belum ada langkah yang ditambahkan"
                description="Klik tombol “Tambah Langkah” untuk menambahkan"
              />
            )}
          </section>


          {/* =========================
              PAYMENT
          ========================= */}

          <div className="project-upload-price">
            <div>
              <h3>
                Harga Proyek &amp; Kode Pembayaran
              </h3>

              <p>
                Atur harga dan buat kode pembayaran untuk pembeli
              </p>
            </div>


            <label className="project-upload-toggle">
              <input
                name="isPaid"
                type="checkbox"
                checked={
                  formData.isPaid
                }
                onChange={
                  handleInputChange
                }
              />

              <span />

              Proyek berbayar
            </label>
          </div>


          <div className="project-upload-payment">
            <span>
              Harga (IDR) *
            </span>

            <label className="project-upload-price-input">
              <span>
                IDR
              </span>

              <input
                name="price"
                type="number"
                min="0"
                value={
                  formData.price
                }
                onChange={
                  handleInputChange
                }
                disabled={
                  !formData.isPaid
                }
                placeholder="Contoh : 15000"
              />
            </label>


            <span>
              Kode Akses / Kode Pembayaran *
            </span>


            <div className="project-upload-code-row">
              <input
                type="text"
                value={
                  formData.paymentCode
                }
                readOnly
                placeholder="Kode akan dibuat setelah di generate"
              />

              <button
                type="button"
                onClick={
                  generatePaymentCode
                }
                disabled={
                  !formData.isPaid
                }
              >
                <RefreshIcon />

                Generate Kode
              </button>


              <button
                type="button"
                onClick={
                  copyPaymentCode
                }
                disabled={
                  !formData.paymentCode
                }
              >
                <CopyIcon />

                Salin
              </button>
            </div>


            <p className="project-upload-payment-info">
              <InfoIcon />

              <span>
                Kode pembayaran akan digunakan oleh pembeli untuk mengakses dan membuka proyek ini.
                <br />
                Kode dibuat otomatis setelah harga diisi
              </span>
            </p>
          </div>


          {/* =========================
              PROJECT FILE
          ========================= */}

          <div className="project-upload-file-section">
            <h3>
              File Proyek *
            </h3>

            <label className="project-upload-file-box">
              <input
                name="projectFile"
                type="file"
                accept=".json,.flow"
                onChange={
                  handleFileChange
                }
              />

              <PlusIcon />

              <strong>
                Klik untuk upload file proyek
              </strong>

              <span>
                {formData.projectFile?.name ||
                  'Drag & drop file di sini'}
              </span>

              <small>
                Format : json, flow | Maksimal 10 MB
              </small>
            </label>

            <p>
              Pastikan file yang diupload sudah berfungsi dengan baik
            </p>
          </div>
        </form>


        {/* =================================================
            SIDEBAR UPLOAD
        ================================================= */}

        <aside className="project-upload-side">
          {/* COVER */}

          <section className="project-upload-card project-upload-cover">
            <h3>
              Gambar Cover Proyek *
            </h3>

            <label className="project-upload-cover-box">
              <input
                name="coverImage"
                type="file"
                accept="image/png,image/jpeg"
                onChange={
                  handleFileChange
                }
              />

              <ImageIcon />

              <span>
                {formData.coverImage?.name ||
                  'Upload gambar cover'}
              </span>

              <small>
                PNG, JPG maksimal 2 MB
              </small>

              <strong>
                Pilih Gambar
              </strong>
            </label>


            <UploadField
              label="Alt Text"
              hint="Pilih gambar yang mewakili proyek Anda"
            >
              <input
                name="altText"
                type="text"
                value={
                  formData.altText
                }
                onChange={
                  handleInputChange
                }
                placeholder="Deskripsikan proyek anda"
              />
            </UploadField>
          </section>


          {/* VISIBILITY */}

          <section className="project-upload-card project-upload-visibility">
            <h3>
              Pengaturan Visibilitas
            </h3>


            <label>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={
                  formData.visibility ===
                  'public'
                }
                onChange={
                  handleInputChange
                }
              />

              <span>
                <strong>
                  Publik
                </strong>

                <small>
                  Proyek dapat dilihat oleh semua orang
                </small>
              </span>
            </label>


            <label>
              <input
                type="radio"
                name="visibility"
                value="draft"
                checked={
                  formData.visibility ===
                  'draft'
                }
                onChange={
                  handleInputChange
                }
              />

              <span>
                <strong>
                  Draft
                </strong>

                <small>
                  Simpan sebagai draft, belum dipublikasikan
                </small>
              </span>
            </label>
          </section>


          {/* EXTRA */}

          <section className="project-upload-card project-upload-extra">
            <h3>
              Informasi Tambahan
            </h3>


            <UploadField label="Tingkat Kesulitan">
              <select
                name="difficulty"
                value={
                  formData.difficulty
                }
                onChange={
                  handleInputChange
                }
              >
                <option value="">
                  Pilih tingkat kesulitan
                </option>

                <option>
                  Pemula
                </option>

                <option>
                  Menengah
                </option>

                <option>
                  Lanjutan
                </option>
              </select>
            </UploadField>


            <UploadField label="Estimasi Waktu">
              <input
                name="estimatedTime"
                type="text"
                value={
                  formData.estimatedTime
                }
                onChange={
                  handleInputChange
                }
                placeholder="Contoh: 2-3 jam"
              />
            </UploadField>


            <UploadField label="Bahasa Pemrograman">
              <input
                name="programmingLanguage"
                type="text"
                value={
                  formData.programmingLanguage
                }
                onChange={
                  handleInputChange
                }
                placeholder="Contoh: Arduino"
              />
            </UploadField>
          </section>


          {/* TAG */}

          <section className="project-upload-card project-upload-tags">
            <h3>
              Tag
            </h3>

            <div className="project-upload-tag-form">
              <input
                type="text"
                value={
                  newTag
                }
                onChange={(
                  event
                ) =>
                  setNewTag(
                    event.target.value
                  )
                }
                placeholder="Tambah tag"
              />

              <button
                type="button"
                onClick={
                  addTag
                }
              >
                Tambah
              </button>
            </div>


            <div className="project-upload-tag-list">
              {formData.tags.map(
                (tag) => (
                  <button
                    type="button"
                    key={
                      tag
                    }
                    onClick={() =>
                      removeTag(
                        tag
                      )
                    }
                  >
                    {tag} ×
                  </button>
                )
              )}
            </div>

            <p>
              Tambah tag untuk memudahkan pencarian
            </p>
          </section>


          {/* ACTION */}

          <section className="project-upload-card project-upload-actions">
            <button
              className="project-upload-publish"
              type="submit"
              form="project-upload-form"
              disabled={
                isSubmitting
              }
            >
              <PublishIcon />

              {isSubmitting
                ? 'Menyimpan...'
                : 'Publikasikan Proyek'}
            </button>


            <button
              className="project-upload-draft"
              type="button"
              disabled={
                isSubmitting
              }
              onClick={() =>
                sendProjectToApi(
                  'draft'
                )
              }
            >
              <SaveIcon />

              Simpan Draft
            </button>


            <button
              className="project-upload-cancel"
              type="button"
              disabled={
                isSubmitting
              }
              onClick={
                onCancel
              }
            >
              Batal
            </button>
          </section>
        </aside>
      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {formError ? (
        <p
          role="alert"
          style={{
            color:
              '#b42318',

            marginTop:
              16,
          }}
        >
          {formError}
        </p>
      ) : null}


      {/* ===================================================
          DEBUG JSON
      =================================================== */}

      {jsonResult ? (
        <section
          className="project-upload-json-result"
          style={{
            marginTop:
              24,
          }}
        >
          <h3>
            Hasil JSON
          </h3>

          <pre
            style={{
              overflowX:
                'auto',

              padding:
                16,

              borderRadius:
                8,

              background:
                '#07152b',

              color:
                '#fff',
            }}
          >
            {JSON.stringify(
              jsonResult,
              null,
              2
            )}
          </pre>
        </section>
      ) : null}
    </section>
  );
}


/* =========================================================
   USER PROJECT GALLERY
========================================================= */

export function UserProjectGallery() {
  const [
    isSidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(
    getInitialSidebarCollapsed
  );

  const [
    isUploadFormOpen,
    setUploadFormOpen,
  ] = useState(false);


  const user =
    getStoredUser();


  const fullName =
    user.name ||
    user.fullName ||
    'Nama Lengkap';


  const greetingName =
    user.nickname ||
    fullName;


  const profileImage =
    user.profileImage ||
    user.avatar ||
    '';


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


  function handleSidebarToggle() {
    setSidebarCollapsed(
      (value) => {
        const nextValue =
          !value;

        persistSidebarCollapsed(
          nextValue
        );

        return nextValue;
      }
    );
  }


  return (
    <div
      className={`dashboard-user-page user-project-page${
        isUploadFormOpen
          ? ' user-project-page--upload'
          : ''
      }${
        isSidebarCollapsed
          ? ' dashboard-user-page--collapsed'
          : ''
      }`}
    >
      {/* SIDEBAR */}

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
            src={
              arrowDownIcon
            }
            alt=""
            aria-hidden="true"
          />
        </button>


        <nav className="dashboard-sidebar__nav">
          {menuItems.map(
            (item) => (
              <a
                className={`dashboard-sidebar__item${
                  item.active
                    ? ' dashboard-sidebar__item--active'
                    : ''
                }`}
                href={
                  item.href
                }
                key={
                  item.label
                }
              >
                {item.icon ===
                'certificate' ? (
                  <img
                    className="dashboard-sidebar__asset-icon"
                    src={
                      certificateIcon
                    }
                    alt=""
                    aria-hidden="true"
                  />
                ) : (
                  <SidebarIcon
                    name={
                      item.icon
                    }
                  />
                )}

                <span>
                  {
                    item.label
                  }
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
              src={
                logoutIcon
              }
              alt=""
              aria-hidden="true"
            />

            <span>
              Logout
            </span>
          </button>
        </nav>
      </aside>


      {/* CONTENT */}

      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__user">
            <button
              className="dashboard-notification"
              type="button"
              aria-label="Notifikasi"
            >
              <img
                src={
                  bellIcon
                }
                alt=""
                aria-hidden="true"
              />
            </button>


            <ProfileAvatar
              className="dashboard-mini-avatar"
              image={
                profileImage
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


        <main className="dashboard-content user-project-content">
          {!isUploadFormOpen ? (
            <div className="dashboard-user-greeting">
              <h1>
                Hello {greetingName}
              </h1>

              <span aria-hidden="true">
                &#128075;&#127995;
              </span>
            </div>
          ) : null}


          {isUploadFormOpen ? (
            <ProjectUploadForm
              onCancel={() =>
                setUploadFormOpen(
                  false
                )
              }
            />
          ) : (
            <section
              className="user-project-panel"
              aria-labelledby="project-gallery-title"
            >
              <div className="user-project-header">
                <h2 id="project-gallery-title">
                  Proyek Kamu
                </h2>


                <div className="user-project-toolbar">
                  <label className="user-project-search">
                    <span className="sr-only">
                      Cari proyek
                    </span>

                    <input
                      type="search"
                      placeholder="Cari"
                    />

                    <SearchIcon />
                  </label>


                  <div className="user-project-controls">
                    <div className="user-project-sort">
                      <span>
                        Urutkan
                      </span>

                      <select
                        defaultValue="Relevance"
                        aria-label="Urutkan proyek"
                      >
                        <option>
                          Relevance
                        </option>

                        <option>
                          Terbaru
                        </option>

                        <option>
                          Nama
                        </option>
                      </select>
                    </div>


                    <button
                      className="user-project-filter"
                      type="button"
                    >
                      <FilterIcon />

                      <span>
                        Filter
                      </span>
                    </button>


                    <button
                      className="user-project-upload"
                      type="button"
                      onClick={() =>
                        setUploadFormOpen(
                          true
                        )
                      }
                    >
                      <UploadIcon />

                      <span>
                        Upload
                      </span>
                    </button>
                  </div>
                </div>
              </div>


              <div className="user-project-grid">
                {projects.map(
                  (project) => (
                    <article
                      className="user-project-card"
                      key={
                        project.id
                      }
                    >
                      <img
                        src={
                          projectImage
                        }
                        alt=""
                      />

                      <div className="user-project-card__body">
                        <h3>
                          {
                            project.title
                          }
                        </h3>

                        <p>
                          {
                            project.category
                          }
                        </p>

                        <time>
                          {
                            project.date
                          }
                        </time>

                        <strong>
                          {
                            project.price
                          }
                        </strong>
                      </div>
                    </article>
                  )
                )}
              </div>


              <nav
                className="user-project-pagination"
                aria-label="Pagination proyek kamu"
              >
                <button
                  type="button"
                  aria-label="Halaman sebelumnya"
                >
                  &lsaquo;
                </button>

                <button
                  className="user-project-pagination__active"
                  type="button"
                >
                  1
                </button>

                <button type="button">
                  2
                </button>

                <button type="button">
                  3
                </button>

                <button
                  type="button"
                  aria-label="Halaman berikutnya"
                >
                  &rsaquo;
                </button>
              </nav>
            </section>
          )}
        </main>
      </section>
    </div>
  );
}