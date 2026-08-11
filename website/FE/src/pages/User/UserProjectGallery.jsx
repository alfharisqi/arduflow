import { useEffect, useMemo, useRef, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import projectImage from '../../assets/images/workshop-experience-student.png';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { WorkshopImageCropper } from '../../features/profile-image-crop/WorkshopImageCropper.jsx';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import { showConfirmAlert, showPromptAlert, showSuccessAlert } from '../../utils/alerts.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya', active: true },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

const PROJECT_API_URL = apiEndpoint(
  import.meta.env.VITE_PROJECT_API_URL,
  '/api/projects-api.php'
);

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
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
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
      </>
    ),
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2.8a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.2" />
      <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M8 12h8M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="m8.5 10.5 3.5-3.5 3.5 3.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3.2A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8V15" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BoxPlusIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5 9 13.5v21L24 43l15-8.5v-21L24 5Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 22 39 13.5M24 22 9 13.5M24 22v21" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 4v8M34 8h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m5 17 4.3-4.3a1.4 1.4 0 0 1 2 0L13 14.4l2.3-2.3a1.4 1.4 0 0 1 2 0L21 15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 3-8.8 18-3-7.8L1.5 10 21 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3h12l2 2v16H5V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.35-5.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M12 10v6M12 7.5h.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function stripHtml(value) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = value || '';
  return wrapper.textContent || wrapper.innerText || '';
}

function RichTextEditor({ value, onChange, error }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function runCommand(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  }

  async function addLink() {
    const url = await showPromptAlert({
      title: 'Masukkan URL Link',
      inputPlaceholder: 'https://contoh.com',
      confirmButtonText: 'Tambahkan',
    });
    if (!url?.trim()) return;
    runCommand('createLink', url.trim());
  }

  return (
    <div className={`project-upload-editor${error ? ' has-error' : ''}`}>
      <div className="project-upload-editor__toolbar" aria-label="Toolbar editor deskripsi">
        <button type="button" onClick={() => runCommand('undo')} title="Undo">↶</button>
        <button type="button" onClick={() => runCommand('redo')} title="Redo">↷</button>
        <select
          aria-label="Format teks"
          defaultValue="P"
          onChange={(event) => runCommand('formatBlock', event.target.value)}
        >
          <option value="P">Normal text</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
          <option value="BLOCKQUOTE">Quote</option>
        </select>
        <button type="button" onClick={() => runCommand('justifyLeft')} title="Rata kiri">≡</button>
        <button type="button" className="project-upload-editor__color" onClick={() => runCommand('foreColor', '#24282d')} title="Warna teks" />
        <button type="button" onClick={() => runCommand('bold')} title="Bold"><b>B</b></button>
        <button type="button" onClick={() => runCommand('italic')} title="Italic"><i>I</i></button>
        <button type="button" onClick={() => runCommand('underline')} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => runCommand('strikeThrough')} title="Strike">S</button>
        <button type="button" onClick={() => runCommand('formatBlock', 'PRE')} title="Code">&lt;&gt;</button>
        <button type="button" onClick={() => runCommand('removeFormat')} title="Clear format">⌫</button>
        <button type="button" onClick={() => runCommand('insertUnorderedList')} title="Bullet list">•≡</button>
        <button type="button" onClick={() => runCommand('insertOrderedList')} title="Numbered list">1≡</button>
        <button type="button" onClick={addLink} title="Tambah link">🔗</button>
      </div>
      <div
        ref={editorRef}
        className="project-upload-editor__content"
        contentEditable
        role="textbox"
        aria-label="Deskripsi proyek"
        aria-invalid={Boolean(error)}
        data-placeholder="Jelaskan proyek anda secara detail..."
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}

function UploadRowActions({ onEdit, onDelete }) {
  return (
    <span className="project-upload-row-actions">
      <button type="button" onClick={onEdit}>Edit</button>
      <button type="button" className="danger" onClick={onDelete}>Hapus</button>
    </span>
  );
}

function UploadField({ label, hint, error, children }) {
  return (
    <label className={`project-upload-field${error ? ' has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em className="project-upload-error">{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

function EmptyUploadTable({ title, description }) {
  return (
    <div className="project-upload-table">
      <div className="project-upload-table__head">
        <span>Langkah</span>
        <span>Deskripsi</span>
      </div>
      <div className="project-upload-empty">
        <BoxPlusIcon />
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function ProjectUploadForm({ onCancel, onSuccess, mode = 'create', projectId = '', initialProject = null }) {
  const currentUser = getStoredUser();
  const ownerName = currentUser.name || currentUser.fullName || 'Nama Lengkap';
  const ownerUsername =
    currentUser.username ||
    currentUser.nickname ||
    currentUser.email ||
    '-';

  const [formData, setFormData] = useState({
    title: initialProject?.title || '',
    category: initialProject?.category || '',
    description: initialProject?.description || '',
    tools: Array.isArray(initialProject?.tools) ? initialProject.tools : [],
    nodes: Array.isArray(initialProject?.nodes) ? initialProject.nodes : [],
    steps: Array.isArray(initialProject?.steps) ? initialProject.steps : [],
    isPaid: Boolean(initialProject?.payment?.isPaid || initialProject?.isPaid),
    price: initialProject?.payment?.price || initialProject?.price || '',
    paymentCode: initialProject?.payment?.paymentCode || initialProject?.paymentCode || '',
    projectFile: null,
    coverImage: null,
    altText: initialProject?.coverImage?.altText || initialProject?.altText || '',
    visibility: initialProject?.visibility || 'public',
    difficulty: initialProject?.difficulty || '',
    estimatedTime: initialProject?.estimatedTime || '',
    programmingLanguage: initialProject?.programmingLanguage || '',
    tags: Array.isArray(initialProject?.tags) && initialProject.tags.length
      ? initialProject.tags
      : ['IoT', 'Arduino', 'Sensor', 'SmartHome'],
  });
  const [newTag, setNewTag] = useState('');
  const [jsonResult, setJsonResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [coverCrop, setCoverCrop] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

  useEffect(() => {
    if (!formData.coverImage) {
      setCoverPreviewUrl('');
      return undefined;
    }

    const nextUrl = URL.createObjectURL(formData.coverImage);
    setCoverPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [formData.coverImage]);

  useEffect(() => () => {
    if (coverCrop?.source) {
      URL.revokeObjectURL(coverCrop.source);
    }
  }, [coverCrop]);

  function clearFieldError(name) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    clearFieldError(name);
    if (name === 'isPaid' && !checked) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.price;
        delete next.paymentCode;
        return next;
      });
    }
  }

  function handleFileChange(event) {
    const { name, files } = event.target;
    const file = files?.[0] || null;
    event.target.value = '';

    if (name === 'coverImage') {
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setFieldErrors((current) => ({
          ...current,
          coverImage: 'Gambar cover harus berupa file gambar.',
        }));
        return;
      }

      clearFieldError('coverImage');
      setFormError('');
      const source = URL.createObjectURL(file);
      setCoverCrop((current) => {
        if (current?.source) {
          URL.revokeObjectURL(current.source);
        }
        return {
          source,
          fileName: file.name,
        };
      });
      return;
    }

    if (name === 'projectFile' && file) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      if (!['json', 'flow'].includes(extension)) {
        setFieldErrors((current) => ({
          ...current,
          projectFile: 'Format file proyek harus .json atau .flow.',
        }));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors((current) => ({
          ...current,
          projectFile: 'Ukuran file proyek maksimal 10 MB.',
        }));
        return;
      }
    }

    setFormData((current) => ({ ...current, [name]: file }));
    clearFieldError(name);
  }

  function handleApplyCoverCrop({ file }) {
    if (!file) return;

    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return null;
    });
    setFormData((current) => ({ ...current, coverImage: file }));
    clearFieldError('coverImage');
    setFormError('');
  }

  function handleCancelCoverCrop() {
    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return null;
    });
  }

  function handleDescriptionChange(value) {
    setFormData((current) => ({ ...current, description: value }));
    clearFieldError('description');
  }

  async function addTool() {
    const name = await showPromptAlert({
      title: 'Tambah Komponen',
      text: 'Masukkan nama alat atau komponen.',
      requiredMessage: 'Nama komponen wajib diisi.',
    });
    if (!name?.trim()) return;
    const specification = await showPromptAlert({
      title: 'Spesifikasi Komponen',
      text: 'Masukkan keterangan atau spesifikasi.',
    }) || '';
    setFormData((current) => ({
      ...current,
      tools: [...current.tools, { name: name.trim(), specification: specification.trim() }],
    }));
    clearFieldError('tools');
  }

  async function editTool(index) {
    const selected = formData.tools[index];
    if (!selected) return;
    const name = await showPromptAlert({
      title: 'Edit Komponen',
      text: 'Edit nama alat atau komponen.',
      inputValue: selected.name,
      requiredMessage: 'Nama komponen wajib diisi.',
    });
    if (!name?.trim()) return;
    const specification = await showPromptAlert({
      title: 'Edit Spesifikasi',
      text: 'Edit keterangan atau spesifikasi.',
      inputValue: selected.specification || '',
    }) || '';
    setFormData((current) => ({
      ...current,
      tools: current.tools.map((tool, toolIndex) =>
        toolIndex === index ? { name: name.trim(), specification: specification.trim() } : tool
      ),
    }));
  }

  async function deleteTool(index) {
    const confirmed = await showConfirmAlert({
      title: 'Hapus Komponen?',
      text: 'Alat atau komponen ini akan dihapus dari form.',
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;
    setFormData((current) => ({
      ...current,
      tools: current.tools.filter((_, toolIndex) => toolIndex !== index),
    }));
  }

  async function addNode() {
    const name = await showPromptAlert({
      title: 'Tambah Node ArduFlow',
      text: 'Masukkan nama node ArduFlow.',
      requiredMessage: 'Nama node wajib diisi.',
    });
    if (!name?.trim()) return;
    const description = await showPromptAlert({
      title: 'Keterangan Node',
      text: 'Masukkan fungsi atau keterangan node.',
    }) || '';
    setFormData((current) => ({
      ...current,
      nodes: [...current.nodes, { name: name.trim(), description: description.trim() }],
    }));
    clearFieldError('nodes');
  }

  async function editNode(index) {
    const selected = formData.nodes[index];
    if (!selected) return;
    const name = await showPromptAlert({
      title: 'Edit Node ArduFlow',
      text: 'Edit nama node ArduFlow.',
      inputValue: selected.name,
      requiredMessage: 'Nama node wajib diisi.',
    });
    if (!name?.trim()) return;
    const description = await showPromptAlert({
      title: 'Edit Keterangan Node',
      text: 'Edit fungsi atau keterangan node.',
      inputValue: selected.description || '',
    }) || '';
    setFormData((current) => ({
      ...current,
      nodes: current.nodes.map((node, nodeIndex) =>
        nodeIndex === index ? { name: name.trim(), description: description.trim() } : node
      ),
    }));
  }

  async function deleteNode(index) {
    const confirmed = await showConfirmAlert({
      title: 'Hapus Node?',
      text: 'Node ini akan dihapus dari form proyek.',
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;
    setFormData((current) => ({
      ...current,
      nodes: current.nodes.filter((_, nodeIndex) => nodeIndex !== index),
    }));
  }

  async function addStep() {
    const description = await showPromptAlert({
      title: 'Tambah Langkah',
      text: 'Masukkan deskripsi langkah pengerjaan.',
      requiredMessage: 'Deskripsi langkah wajib diisi.',
    });
    if (!description?.trim()) return;
    setFormData((current) => ({
      ...current,
      steps: [...current.steps, { order: current.steps.length + 1, description: description.trim() }],
    }));
    clearFieldError('steps');
  }

  async function editStep(index) {
    const selected = formData.steps[index];
    if (!selected) return;
    const description = await showPromptAlert({
      title: 'Edit Langkah',
      text: 'Edit deskripsi langkah pengerjaan.',
      inputValue: selected.description,
      requiredMessage: 'Deskripsi langkah wajib diisi.',
    });
    if (!description?.trim()) return;
    setFormData((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, description: description.trim() } : step
      ),
    }));
  }

  async function deleteStep(index) {
    const confirmed = await showConfirmAlert({
      title: 'Hapus Langkah?',
      text: 'Langkah pengerjaan ini akan dihapus dari form.',
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;
    setFormData((current) => ({
      ...current,
      steps: current.steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, order: stepIndex + 1 })),
    }));
  }

  function generatePaymentCode() {
    if (!formData.isPaid || Number(formData.price) <= 0) {
      setFormError('Aktifkan proyek berbayar dan isi harga terlebih dahulu.');
      return;
    }
    const randomPart = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
    setFormData((current) => ({ ...current, paymentCode: `ARDU-${randomPart}` }));
    setFormError('');
  }

  async function copyPaymentCode() {
    if (!formData.paymentCode) return;
    try {
      await navigator.clipboard.writeText(formData.paymentCode);
    } catch (error) {
      console.error('Kode tidak dapat disalin:', error);
    }
  }

  function addTag() {
    const tag = newTag.trim();
    if (!tag || formData.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    setFormData((current) => ({ ...current, tags: [...current.tags, tag] }));
    setNewTag('');
  }

  function removeTag(tagToRemove) {
    setFormData((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

  function fileToJson(file) {
    return file
      ? { name: file.name, size: file.size, type: file.type || 'application/octet-stream' }
      : null;
  }

  function validateProjectForm(status) {
    const isDraft = status === 'draft';
    const isEdit = mode === 'edit';
    const errors = {};
    const descriptionText = stripHtml(formData.description).trim();

    if (!isDraft && !formData.title.trim()) errors.title = 'Judul proyek wajib diisi.';
    if (!isDraft && !formData.category.trim()) errors.category = 'Kategori wajib diisi.';
    if (!isDraft && !descriptionText) errors.description = 'Deskripsi proyek wajib diisi.';
    if (!isDraft && !isEdit && !formData.projectFile) errors.projectFile = 'File proyek wajib dipilih.';
    if (!isDraft && !isEdit && !formData.coverImage) errors.coverImage = 'Gambar cover wajib dipilih.';
    if (!isDraft && formData.tools.length === 0) errors.tools = 'Tambahkan minimal satu alat atau komponen.';
    if (!isDraft && formData.nodes.length === 0) errors.nodes = 'Tambahkan minimal satu node ArduFlow.';
    if (!isDraft && formData.steps.length === 0) errors.steps = 'Tambahkan minimal satu langkah pengerjaan.';
    if (formData.isPaid && Number(formData.price) <= 0) errors.price = 'Harga proyek berbayar harus lebih dari 0.';
    if (formData.isPaid && !formData.paymentCode) errors.paymentCode = 'Generate kode pembayaran terlebih dahulu.';

    return errors;
  }

  function createProjectJson(status) {
    const title = formData.title.trim();
    const isDraft = status === 'draft';
    const validationErrors = validateProjectForm(status);

    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      setFormError('Lengkapi kolom wajib yang masih kosong sebelum mempublikasikan proyek.');
      return null;
    }

    const now = new Date().toISOString();
    const result = {
      success: true,
      message: isDraft ? 'Draft proyek berhasil dibuat dalam format JSON.' : 'Proyek siap dipublikasikan dalam format JSON.',
      data: {
        id: mode === 'edit' ? (projectId || initialProject?.id) : crypto.randomUUID(),
        ownerName: initialProject?.ownerName || initialProject?.userName || ownerName,
        ownerUsername: initialProject?.ownerUsername || initialProject?.username || ownerUsername,
        userId: initialProject?.userId || currentUser.id || currentUser.userId || null,
        title,
        slug: title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-'),
        category: formData.category.trim(),
        description: formData.description.trim(),
        tools: formData.tools,
        nodes: formData.nodes,
        steps: formData.steps,
        payment: {
          isPaid: formData.isPaid,
          price: formData.isPaid ? Number(formData.price) : 0,
          currency: 'IDR',
          paymentCode: formData.isPaid ? formData.paymentCode : null,
        },
        projectFile: fileToJson(formData.projectFile) || initialProject?.projectFile || null,
        coverImage: formData.coverImage
          ? { ...fileToJson(formData.coverImage), altText: formData.altText.trim() }
          : (initialProject?.coverImage || null),
        visibility: isDraft ? 'draft' : formData.visibility,
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime.trim(),
        programmingLanguage: formData.programmingLanguage.trim(),
        tags: formData.tags,
        status: isDraft ? 'draft' : 'published',
        publishedAt: isDraft ? null : now,
        createdAt: initialProject?.createdAt || now,
        updatedAt: now,
      },
    };

    setFormError('');
    setFieldErrors({});
    setJsonResult(result);
    console.log('JSON proyek:', JSON.stringify(result, null, 2));
    return result;
  }

  async function sendProjectToApi(status) {
    const projectJson = createProjectJson(status);
    if (!projectJson) return;
    try {
      const isEdit = mode === 'edit' && (projectId || initialProject?.id);
      const payload = new FormData();
      payload.append('payload', JSON.stringify(projectJson.data));

      if (isEdit) {
        payload.append('_method', 'PUT');
      }

      if (formData.projectFile) {
        payload.append('project_file', formData.projectFile);
      }

      if (formData.coverImage) {
        payload.append('cover_image', formData.coverImage);
      }

      const response = await fetch(isEdit ? `${PROJECT_API_URL}?id=${encodeURIComponent(projectId || initialProject.id)}` : PROJECT_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: payload,
      });
      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Response API bukan JSON: ${responseText}`);
      }

      console.log('SQLite API URL:', PROJECT_API_URL);
      console.log('SQLite API Status:', response.status);
      console.log('SQLite API Response:', result);

      if (!response.ok) {
        const validationMessage = result.errors
          ? Object.values(result.errors).join(' ')
          : result.message;

        throw new Error(validationMessage || 'Gagal menyimpan proyek.');
      }

      setJsonResult(result);
      onSuccess?.(result.data || result);
      await showSuccessAlert('Berhasil', result.message || (isEdit ? 'Proyek berhasil diperbarui.' : 'Proyek berhasil disimpan.'));
    } catch (error) {
      console.error('Gagal mengirim proyek ke API:', error);
      setFormError(
        error instanceof TypeError
          ? `API tidak dapat dihubungi di ${PROJECT_API_URL}. Pastikan Apache aktif dan endpoint dapat dibuka.`
          : error.message
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendProjectToApi('published');
  }

  return (
    <>
    <section className="project-upload-page" aria-labelledby="project-upload-title">
      <h2 id="project-upload-title">{mode === 'edit' ? 'Edit Proyek' : 'Upload Proyek Baru'}</h2>
      {mode === 'edit' ? (
        <p className="project-upload-edit-notice">
          Mode edit proyek aktif{projectId ? ` untuk ID proyek ${projectId}` : ''}. Silakan sesuaikan data proyek melalui form ini.
        </p>
      ) : null}

      <div className="project-upload-layout">
        <form className="project-upload-main" id="project-upload-form" onSubmit={handleSubmit}>
          <UploadField label="Judul Proyek *" hint="Pilih judul yang jelas dan menarik" error={fieldErrors.title}>
            <input name="title" type="text" value={formData.title} onChange={handleInputChange} placeholder="Masukkan judul proyek" aria-invalid={Boolean(fieldErrors.title)} />
          </UploadField>

          <UploadField label="Kategori *" hint="Pilih kategori yang paling sesuai dengan proyek anda" error={fieldErrors.category}>
            <input name="category" type="text" value={formData.category} onChange={handleInputChange} placeholder="Pilih kategori proyek" aria-invalid={Boolean(fieldErrors.category)} />
          </UploadField>

          <div className="project-upload-field">
            <span>Deskripsi Proyek *</span>
            <div className="project-upload-editor project-upload-editor--legacy-hidden">
              <div className="project-upload-editor__toolbar" aria-hidden="true">
                <span>↶</span><span>↷</span><span>Normal text⌄</span><span>≡</span>
                <span className="project-upload-editor__color" /><b>B</b><i>I</i><u>U</u>
                <span>S</span><span>&lt;&gt;</span><span>▱</span><span>•≡</span><span>1≡</span><span>🔗</span>
              </div>
              <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Jelaskan proyek anda secara detail..." />
            </div>
            <RichTextEditor value={formData.description} onChange={handleDescriptionChange} error={fieldErrors.description} />
            {fieldErrors.description ? <em className="project-upload-error">{fieldErrors.description}</em> : <small>Jelaskan fungsi, tujuan, dan cara kerja proyek anda</small>}
          </div>

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div><h3>Alat &amp; Komponen *</h3><p>Daftarkan alat dan komponen yang digunakan dalam proyek ini</p></div>
              <button type="button" onClick={addTool}><PlusIcon /> Tambah Item</button>
            </div>
            <div className={`project-upload-table${fieldErrors.tools ? ' has-error' : ''}`}>
              <div className="project-upload-table__head project-upload-table__head--actions"><span>Nama Alat/Komponen</span><span>Keterangan/Spesifikasi</span><span>Aksi</span></div>
              {formData.tools.length ? formData.tools.map((tool, index) => (
                <div className="project-upload-table__head project-upload-table__head--actions" key={`${tool.name}-${index}`}>
                  <span>{tool.name}</span>
                  <span>{tool.specification || '-'}</span>
                  <UploadRowActions onEdit={() => editTool(index)} onDelete={() => deleteTool(index)} />
                </div>
              )) : (
                <div className="project-upload-empty"><BoxPlusIcon /><strong>Belum ada alat atau komponen</strong><p>Klik tombol “Tambah Item” untuk menambahkan</p></div>
              )}
            </div>
            {fieldErrors.tools ? <em className="project-upload-error">{fieldErrors.tools}</em> : null}
          </section>

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div><h3>Node ArduFlow yang Digunakan *</h3><p>Sebutkan node atau blok Arduflow yang digunakan dalam proyek ini</p></div>
              <button type="button" onClick={addNode}><PlusIcon /> Tambah Node</button>
            </div>
            {formData.nodes.length ? (
              <div className={`project-upload-table${fieldErrors.nodes ? ' has-error' : ''}`}>
                <div className="project-upload-table__head project-upload-table__head--actions"><span>Node</span><span>Deskripsi</span><span>Aksi</span></div>
                {formData.nodes.map((node, index) => (
                  <div className="project-upload-table__head project-upload-table__head--actions" key={`${node.name}-${index}`}>
                    <span>{node.name}</span>
                    <span>{node.description || '-'}</span>
                    <UploadRowActions onEdit={() => editNode(index)} onDelete={() => deleteNode(index)} />
                  </div>
                ))}
              </div>
            ) : <EmptyUploadTable title="Belum ada node yang ditambahkan" description="Klik tombol “Tambah Node” untuk menambahkan" />}
          </section>

          {fieldErrors.nodes ? <em className="project-upload-error">{fieldErrors.nodes}</em> : null}

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div><h3>Langkah-langkah Pengerjaan *</h3><p>Jelaskan langkah langkah pembuatan proyek secara berurutan</p></div>
              <button type="button" onClick={addStep}><PlusIcon /> Tambah Langkah</button>
            </div>
            {formData.steps.length ? (
              <div className={`project-upload-table${fieldErrors.steps ? ' has-error' : ''}`}>
                <div className="project-upload-table__head project-upload-table__head--actions"><span>Langkah</span><span>Deskripsi</span><span>Aksi</span></div>
                {formData.steps.map((step, index) => (
                  <div className="project-upload-table__head project-upload-table__head--actions" key={step.order}>
                    <span>{step.order}</span>
                    <span>{step.description}</span>
                    <UploadRowActions onEdit={() => editStep(index)} onDelete={() => deleteStep(index)} />
                  </div>
                ))}
              </div>
            ) : <EmptyUploadTable title="Belum ada langkah yang ditambahkan" description="Klik tombol “Tambah Langkah” untuk menambahkan" />}
          </section>

            {fieldErrors.steps ? <em className="project-upload-error">{fieldErrors.steps}</em> : null}
          <div className="project-upload-price">
            <div><h3>Harga Proyek &amp; Kode Pembayaran</h3><p>Atur harga dan buat kode pembayaran untuk pembeli</p></div>
            <label className="project-upload-toggle">
              <input name="isPaid" type="checkbox" checked={formData.isPaid} onChange={handleInputChange} />
              <span />Proyek berbayar
            </label>
          </div>
          <div className="project-upload-payment">
            <span>Harga (IDR) *</span>
            <label className={`project-upload-price-input${fieldErrors.price ? ' has-error' : ''}`}><span>IDR</span><input name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} disabled={!formData.isPaid} placeholder="Contoh : 15000" aria-invalid={Boolean(fieldErrors.price)} /></label>
            {fieldErrors.price ? <em className="project-upload-error">{fieldErrors.price}</em> : null}
            <span>Kode Akses / Kode Pembayaran *</span>
            <div className="project-upload-code-row">
              <input className={fieldErrors.paymentCode ? 'has-error' : ''} type="text" value={formData.paymentCode} readOnly placeholder="Kode akan dibuat setelah di generate" aria-invalid={Boolean(fieldErrors.paymentCode)} />
              <button type="button" onClick={generatePaymentCode} disabled={!formData.isPaid}><RefreshIcon /> Generate Kode</button>
              <button type="button" onClick={copyPaymentCode} disabled={!formData.paymentCode}><CopyIcon /> Salin</button>
            </div>
            {fieldErrors.paymentCode ? <em className="project-upload-error">{fieldErrors.paymentCode}</em> : null}
            <p className="project-upload-payment-info"><InfoIcon /><span>Kode pembayaran akan digunakan oleh pembeli untuk mengakses dan membuka proyek ini.<br />Kode dibuat otomatis setelah harga diisi</span></p>
          </div>

          <div className="project-upload-file-section">
            <h3>File Proyek *</h3>
            <label className={`project-upload-file-box${fieldErrors.projectFile ? ' has-error' : ''}`}>
              <input name="projectFile" type="file" accept=".json,.flow" onChange={handleFileChange} />
              <PlusIcon /><strong>Klik untuk upload file proyek</strong>
              <span>{formData.projectFile?.name || 'Drag & drop file di sini'}</span><small>Format : json, flow | Maksimal 10 MB</small>
            </label>
            {fieldErrors.projectFile ? <em className="project-upload-error">{fieldErrors.projectFile}</em> : null}
            <p>Pastikan file yang diupload sudah berfungsi dengan baik</p>
          </div>
        </form>

        <aside className="project-upload-side">
          <section className="project-upload-card project-upload-cover">
            <h3>Gambar Cover Proyek *</h3>
            <label className={`project-upload-cover-box${fieldErrors.coverImage ? ' has-error' : ''}`}>
              <input name="coverImage" type="file" accept="image/png,image/jpeg" onChange={handleFileChange} />
              {coverPreviewUrl ? (
                <img className="project-upload-cover-preview" src={coverPreviewUrl} alt="Preview cover proyek" />
              ) : (
                <ImageIcon />
              )}
              <span>{formData.coverImage?.name || 'Upload gambar cover'}</span><small>PNG, JPG maksimal 2 MB</small><strong>Pilih Gambar</strong>
            </label>
            {fieldErrors.coverImage ? <em className="project-upload-error">{fieldErrors.coverImage}</em> : null}
            <UploadField label="Alt Text" hint="Pilih gambar yang mewakili proyek Anda">
              <input name="altText" type="text" value={formData.altText} onChange={handleInputChange} placeholder="Deskripsikan proyek anda" />
            </UploadField>
          </section>

          <section className="project-upload-card project-upload-visibility">
            <h3>Pengaturan Visibilitas</h3>
            <label><input type="radio" name="visibility" value="public" checked={formData.visibility === 'public'} onChange={handleInputChange} /><span><strong>Publik</strong><small>Proyek dapat dilihat oleh semua orang</small></span></label>
            <label><input type="radio" name="visibility" value="draft" checked={formData.visibility === 'draft'} onChange={handleInputChange} /><span><strong>Draft</strong><small>Simpan sebagai draft, belum dipublikasikan</small></span></label>
          </section>

          <section className="project-upload-card project-upload-extra">
            <h3>Informasi Tambahan</h3>
            <UploadField label="Tingkat Kesulitan"><select name="difficulty" value={formData.difficulty} onChange={handleInputChange}><option value="">Pilih tingkat kesulitan</option><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></UploadField>
            <UploadField label="Estimasi Waktu"><input name="estimatedTime" type="text" value={formData.estimatedTime} onChange={handleInputChange} placeholder="Contoh: 2-3 jam" /></UploadField>
            <UploadField label="Bahasa Pemrograman"><input name="programmingLanguage" type="text" value={formData.programmingLanguage} onChange={handleInputChange} placeholder="Contoh: Arduino" /></UploadField>
          </section>

          <section className="project-upload-card project-upload-tags">
            <h3>Tag</h3>
            <div className="project-upload-tag-form"><input type="text" value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="Tambah tag" /><button type="button" onClick={addTag}>Tambah</button></div>
            <div className="project-upload-tag-list">{formData.tags.map((tag) => <button type="button" key={tag} onClick={() => removeTag(tag)}>{tag} ×</button>)}</div>
            <p>Tambah tag untuk memudahkan pencarian</p>
          </section>

          <section className="project-upload-card project-upload-actions">
            <button className="project-upload-publish" type="submit" form="project-upload-form"><PublishIcon /> Publikasikan Proyek</button>
            <button className="project-upload-draft" type="button" onClick={() => sendProjectToApi('draft')}><SaveIcon /> Simpan Draft</button>
            <button className="project-upload-cancel" type="button" onClick={onCancel}>Batal</button>
          </section>
        </aside>
      </div>

      {formError ? <p role="alert" style={{ color: '#b42318', marginTop: 16 }}>{formError}</p> : null}
      {jsonResult ? (
        <section className="project-upload-json-result" style={{ marginTop: 24 }}>
          <h3>Hasil JSON</h3>
          <pre style={{ overflowX: 'auto', padding: 16, borderRadius: 8, background: '#07152b', color: '#fff' }}>{JSON.stringify(jsonResult, null, 2)}</pre>
        </section>
      ) : null}
    </section>
    <WorkshopImageCropper
      source={coverCrop?.source || ''}
      fileName={coverCrop?.fileName || 'project-cover.png'}
      onCancel={handleCancelCoverCrop}
      onApply={handleApplyCoverCrop}
    />
    </>
  );
}

function resolveProjectCoverUrl(project) {
  const cover = project?.coverImage || {};
  const rawUrl = (
    project?.coverUrl ||
    project?.coverPath ||
    cover.file_url ||
    cover.fileUrl ||
    cover.url ||
    cover.file_path ||
    cover.filePath ||
    ''
  );

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawUrl)) return rawUrl;

  const normalizedPath = String(rawUrl)
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return `${API_BASE_URL}/${normalizedPath}`;
}

function formatProjectDate(project) {
  const raw = project?.updatedAt || project?.updated_at || project?.createdAt || project?.created_at;
  const date = raw ? new Date(raw) : null;

  if (!date || Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatProjectPrice(project) {
  const payment = project?.payment || {};
  const isPaid = Boolean(payment.isPaid || project?.isPaid);
  const price = Number(payment.price || project?.price || 0);

  if (!isPaid || price <= 0) return 'Gratis';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: payment.currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function UserProjectGallery() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const searchParams = new URLSearchParams(window.location.search);
  const projectFormMode = searchParams.get('mode') === 'edit' ? 'edit' : 'create';
  const editProjectId = searchParams.get('projectId') || '';
  const shouldOpenProjectForm = searchParams.get('mode') === 'edit' || searchParams.get('mode') === 'upload';
  const isAdminProjectEditRoute = window.location.pathname.startsWith('/admin/projects/edit');
  const [isUploadFormOpen, setUploadFormOpen] = useState(shouldOpenProjectForm);
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;
  const profileImage = user.profileImage || user.avatar || '';
  const currentUserId = user.id || user.userId || null;
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Terbaru');

  async function loadProjects() {
    setProjectsLoading(true);
    setProjectsError('');

    try {
      const response = await fetch(PROJECT_API_URL, {
        headers: {
          Accept: 'application/json',
        },
      });
      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`Response API bukan JSON: ${text}`);
      }

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data proyek.');
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      const ownedProjects = currentUserId
        ? rows.filter((project) => String(project.userId || project.payload?.userId || '') === String(currentUserId))
        : rows;

      setProjects(ownedProjects);
    } catch (error) {
      console.error('Gagal mengambil data proyek:', error);
      setProjectsError(
        error instanceof TypeError
          ? `API tidak dapat dihubungi di ${PROJECT_API_URL}. Pastikan server PHP berjalan.`
          : error.message
      );
    } finally {
      setProjectsLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const visibleProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? projects.filter((project) => {
          const haystack = [
            project.title,
            project.category,
            project.description,
            ...(Array.isArray(project.tags) ? project.tags : []),
          ].join(' ').toLowerCase();

          return haystack.includes(query);
        })
      : [...projects];

    return filtered.sort((first, second) => {
      if (sortBy === 'Nama') {
        return String(first.title || '').localeCompare(String(second.title || ''), 'id-ID');
      }

      const firstTime = new Date(first.updatedAt || first.createdAt || 0).getTime() || 0;
      const secondTime = new Date(second.updatedAt || second.createdAt || 0).getTime() || 0;
      return secondTime - firstTime;
    });
  }, [projects, searchQuery, sortBy]);

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
    window.localStorage.removeItem('arduflow_user_token');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  }

  function handleSidebarToggle() {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistSidebarCollapsed(nextValue);
      return nextValue;
    });
  }

  return (
    <div className={`dashboard-user-page user-project-page${isUploadFormOpen ? ' user-project-page--upload' : ''}${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <a className="dashboard-sidebar__brand" href="/" aria-label="Kembali ke beranda">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </a>
        <button
          className="dashboard-sidebar__collapse"
          type="button"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          onClick={handleSidebarToggle}
        >
          <img src={arrowDownIcon} alt="" aria-hidden="true" />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map((item) => (
            <a
              className={`dashboard-sidebar__item${item.active ? ' dashboard-sidebar__item--active' : ''}`}
              href={item.href}
              key={item.label}
            >
              {item.icon === 'certificate' ? (
                <img className="dashboard-sidebar__asset-icon" src={certificateIcon} alt="" aria-hidden="true" />
              ) : (
                <SidebarIcon name={item.icon} />
              )}
              <span>{item.label}</span>
            </a>
          ))}
          <button className="dashboard-sidebar__item dashboard-sidebar__item--logout" type="button" onClick={handleLogout}>
            <img className="dashboard-sidebar__logout-icon" src={logoutIcon} alt="" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__user">
            <button className="dashboard-notification" type="button" aria-label="Notifikasi">
              <img src={bellIcon} alt="" aria-hidden="true" />
            </button>
            <ProfileAvatar className="dashboard-mini-avatar" image={profileImage} name={fullName} />
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content user-project-content">
          {!isUploadFormOpen ? (
            <div className="dashboard-user-greeting">
              <h1>Hello {greetingName}</h1>
              <span aria-hidden="true">&#128075;&#127995;</span>
            </div>
          ) : null}

          {isUploadFormOpen ? (
            <ProjectUploadForm
              mode={projectFormMode}
              projectId={editProjectId}
              onSuccess={() => {
                loadProjects();
                if (!isAdminProjectEditRoute) {
                  setUploadFormOpen(false);
                }
              }}
              onCancel={() => {
                if (isAdminProjectEditRoute) {
                  window.location.href = '/admin/projects';
                  return;
                }

                setUploadFormOpen(false);
              }}
            />
          ) : (
            <section className="user-project-panel" aria-labelledby="project-gallery-title">
            <div className="user-project-header">
              <h2 id="project-gallery-title">Proyek Kamu</h2>
              <div className="user-project-toolbar">
                <label className="user-project-search">
                  <span className="sr-only">Cari proyek</span>
                  <input type="search" placeholder="Cari" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                  <SearchIcon />
                </label>

                <div className="user-project-controls">
                  <div className="user-project-sort">
                    <span>Urutkan</span>
                    <select value={sortBy} aria-label="Urutkan proyek" onChange={(event) => setSortBy(event.target.value)}>
                      <option>Terbaru</option>
                      <option>Nama</option>
                    </select>
                  </div>
                  <button className="user-project-filter" type="button">
                    <FilterIcon />
                    <span>Filter</span>
                  </button>
                  <button className="user-project-upload" type="button" onClick={() => setUploadFormOpen(true)}>
                    <UploadIcon />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            </div>

            {isProjectsLoading ? (
              <div className="user-project-empty">Memuat proyek...</div>
            ) : projectsError ? (
              <div className="user-project-empty">{projectsError}</div>
            ) : visibleProjects.length === 0 ? (
              <div className="user-project-empty">Belum ada proyek yang tersimpan.</div>
            ) : (
              <div className="user-project-grid">
                {visibleProjects.map((project) => {
                  const coverUrl = resolveProjectCoverUrl(project) || projectImage;

                  return (
                    <article className="user-project-card" key={project.id}>
                      <img src={coverUrl} alt={project.coverImage?.altText || project.title || 'Cover proyek'} />
                      <div className="user-project-card__body">
                        <h3>{project.title || 'Tanpa judul'}</h3>
                        <p>{project.category || '-'}</p>
                        <time>{formatProjectDate(project)}</time>
                        <strong>{formatProjectPrice(project)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <nav className="user-project-pagination" aria-label="Pagination proyek kamu">
              <button type="button" aria-label="Halaman sebelumnya">&lsaquo;</button>
              <button className="user-project-pagination__active" type="button">1</button>
              <button type="button" aria-label="Halaman berikutnya">&rsaquo;</button>
            </nav>
            </section>
          )}
        </main>
      </section>
    </div>
  );
}
