import { createElement, useEffect, useMemo, useRef, useState } from 'react';
<<<<<<< HEAD
import '@wokwi/elements';
=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import projectImage from '../../assets/images/workshop-experience-student.png';
<<<<<<< HEAD
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
import { WorkshopImageCropper } from '../../features/profile-image-crop/WorkshopImageCropper.jsx';
import { TinyMCEEditor } from '../../components/TinyMCEEditor.jsx';
import { NodeSprite } from '../../components/NodeSprite.jsx';
import {
  PROJECT_NODE_CATALOG,
  getProjectNodeType,
  normalizeProjectNode,
  normalizeNodeType,
} from '../../config/projectNodes.js';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
<<<<<<< HEAD
import { showConfirmAlert, showPromptAlert, showSuccessAlert } from '../../utils/alerts.js';
=======
import { completeProjectPayout, createTransaction, fetchFinanceConfig, fetchTransactions } from '../../services/transactionApi.js';
import { showConfirmAlert, showSuccessAlert } from '../../utils/alerts.js';
import { UserDashboardTopbar } from './UserDashboardTopbar.jsx';
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya', active: true },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
<<<<<<< HEAD
  { label: 'Transaksi', icon: 'certificate', href: '/transaksi' },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
=======
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

const PROJECT_API_URL = apiEndpoint(
  import.meta.env.VITE_PROJECT_API_URL,
<<<<<<< HEAD
  'https://arduflow.indobilliard.com/apk/uploads/web/api/project-submit-sqlite.php'
);

const PROJECT_UPLOAD_API =
  import.meta.env.VITE_PROJECT_UPLOAD_API_URL?.trim() ||
  'http://localhost/upload_api/project-upload.php';

const PROJECT_UPLOAD_TARGET_FOLDER = 'project';

const PROJECT_IMAGE_PUBLIC_BASE_URL =
  'https://arduflow.indobilliard.com/apk/uploads/web/storage/project';

=======
  '/api/projects-api.php'
);

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
const WOKWI_COMPONENT_CATALOG = [
  { category: 'Board', name: 'Arduino Uno R3', specification: 'ATmega328P development board', wokwiElement: 'wokwi-arduino-uno' },
  { category: 'Board', name: 'Arduino Mega', specification: 'ATmega2560 development board', wokwiElement: 'wokwi-arduino-mega' },
  { category: 'Board', name: 'Arduino Nano', specification: 'Compact ATmega328P board', wokwiElement: 'wokwi-arduino-nano' },
  { category: 'Board', name: 'ESP32 DevKit', specification: 'WiFi and Bluetooth microcontroller', wokwiElement: 'wokwi-esp32-devkit-v1' },
  { category: 'Board', name: 'Arduino Nano RP2040 Connect', specification: 'RP2040 WiFi development board', wokwiElement: 'wokwi-nano-rp2040-connect' },
  { category: 'Prototyping', name: 'Breadboard', specification: 'Solderless prototyping board', wokwiElement: '' },
  { category: 'Prototyping', name: 'Jumper Wire', specification: 'Male/female wiring connection', wokwiElement: '' },
  { category: 'Passive', name: 'Resistor', specification: 'Current limiting resistor', wokwiElement: 'wokwi-resistor' },
  { category: 'Passive', name: 'Potentiometer', specification: 'Analog variable resistor', wokwiElement: 'wokwi-potentiometer' },
  { category: 'Output', name: 'LED', specification: 'Single color indicator light', wokwiElement: 'wokwi-led' },
  { category: 'Output', name: 'RGB LED', specification: 'Red, green, blue indicator light', wokwiElement: 'wokwi-rgb-led' },
  { category: 'Output', name: 'Buzzer', specification: 'Audio alert component', wokwiElement: 'wokwi-buzzer' },
  { category: 'Output', name: 'Servo Motor', specification: '0-180 degree actuator', wokwiElement: 'wokwi-servo' },
  { category: 'Output', name: 'Relay Module', specification: 'Digital controlled switch module', wokwiElement: '' },
  { category: 'Display', name: 'LCD 16x2', specification: 'Character LCD display', wokwiElement: 'wokwi-lcd1602' },
  { category: 'Display', name: 'OLED SSD1306', specification: 'I2C monochrome OLED display', wokwiElement: 'wokwi-ssd1306' },
  { category: 'Display', name: '7 Segment Display', specification: 'Numeric LED display', wokwiElement: 'wokwi-7segment' },
  { category: 'Input', name: 'Pushbutton', specification: 'Momentary digital input', wokwiElement: 'wokwi-pushbutton' },
  { category: 'Input', name: 'Keypad 4x4', specification: 'Matrix keypad input', wokwiElement: 'wokwi-membrane-keypad' },
  { category: 'Sensor', name: 'DHT22', specification: 'Temperature and humidity sensor', wokwiElement: 'wokwi-dht22' },
  { category: 'Sensor', name: 'HC-SR04 Ultrasonic', specification: 'Distance measurement sensor', wokwiElement: 'wokwi-hc-sr04' },
  { category: 'Sensor', name: 'PIR Motion Sensor', specification: 'Motion detection sensor', wokwiElement: 'wokwi-pir-motion-sensor' },
  { category: 'Sensor', name: 'LDR Photoresistor', specification: 'Light level sensor', wokwiElement: 'wokwi-photoresistor-sensor' },
  { category: 'Sensor', name: 'MPU6050', specification: 'Accelerometer and gyroscope module', wokwiElement: 'wokwi-mpu6050' },
  { category: 'Module', name: 'NeoPixel Ring', specification: 'Addressable RGB LED ring', wokwiElement: 'wokwi-led-ring' },
  { category: 'Module', name: 'IR Receiver', specification: 'Infrared remote receiver', wokwiElement: 'wokwi-ir-receiver' },
  { category: 'Module', name: 'RTC DS1307', specification: 'Real time clock module', wokwiElement: 'wokwi-ds1307' },
  { category: 'Module', name: 'Micro SD Card', specification: 'SPI storage module', wokwiElement: 'wokwi-microsd-card' },
];

const SUPPORTED_WOKWI_ELEMENTS = new Set(
  WOKWI_COMPONENT_CATALOG
    .map((component) => component.wokwiElement)
    .filter(Boolean)
);

const MANUAL_PICKER_VALUE = '__manual__';
<<<<<<< HEAD
=======

const PROJECT_CATEGORY_OPTIONS = [
  'Pemula',
  'Menengah',
  'Lanjutan',
  'Arduino',
  'ESP32',
  'Sensor',
  'Aktuator',
  'IoT',
  'Otomasi',
  'Smart Home',
  'Robotik',
  'Monitoring',
];

const PROJECT_FILE_ACCEPT = '.json,.flow,.schema,.txt,.md,.ino,.zip';
const PROJECT_FILE_EXTENSIONS = ['json', 'flow', 'schema', 'txt', 'md', 'ino', 'zip'];
const PROJECT_FILE_TEXT_PREVIEW_EXTENSIONS = new Set(['json', 'flow', 'schema', 'txt', 'md', 'ino']);
const DEFAULT_PROJECT_FILE_LABELS = [
  'File JSON',
  'File Schema',
  'File External Button',
];

const PROJECT_FORM_TABS = [
  { id: 'basic', label: 'Info Dasar' },
  { id: 'media', label: 'File & Gambar' },
  { id: 'components', label: 'Komponen' },
  { id: 'nodes', label: 'Node' },
  { id: 'steps', label: 'Langkah' },
  { id: 'publish', label: 'Publish' },
];

const PROJECT_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Proyek' },
  { value: 'uploaded', label: 'Di-upload Sendiri' },
  { value: 'purchased', label: 'Dibeli' },
  { value: 'selling', label: 'Sedang Dijual' },
];

const STEP_TEMPLATES = [
  {
    title: 'Persiapan Komponen',
    description: 'Siapkan board, kabel jumper, sensor, aktuator, dan komponen lain yang dibutuhkan.',
  },
  {
    title: 'Rakit Rangkaian',
    description: 'Hubungkan setiap komponen ke pin yang sesuai berdasarkan diagram rangkaian proyek.',
  },
  {
    title: 'Upload Program',
    description: 'Buka file proyek, periksa konfigurasi board, lalu upload program ke mikrokontroler.',
  },
  {
    title: 'Uji Fungsi',
    description: 'Jalankan proyek dan pastikan input, output, serta alur node bekerja sesuai kebutuhan.',
  },
  {
    title: 'Troubleshooting',
    description: 'Jika hasil belum sesuai, periksa koneksi kabel, library, pin, dan data serial monitor.',
  },
];

function normalizeStepReferences(references = []) {
  return normalizeProjectList(references)
    .map((item) => {
      if (typeof item === 'string') {
        return {
          kind: 'component',
          name: item.trim(),
          category: '',
          value: '',
          description: '',
        };
      }

      return {
        kind: item?.kind === 'node' ? 'node' : 'component',
        name: String(item?.name || item?.title || '').trim(),
        category: String(item?.category || '').trim(),
        value: String(item?.value ?? '').trim(),
        description: String(item?.description || item?.specification || '').trim(),
      };
    })
    .filter((item) => item.name);
}

function normalizeProjectSteps(steps = []) {
  return steps.map((step, index) => ({
    ...step,
    order: index + 1,
    title: step.title || '',
    description: step.description || '',
    references: normalizeStepReferences([
      ...normalizeProjectList(step.references || step.items),
      ...normalizeProjectList(step.components).map((item) => (
        typeof item === 'string' ? item : { ...item, kind: 'component' }
      )),
      ...normalizeProjectList(step.nodes).map((item) => (
        typeof item === 'string' ? { kind: 'node', name: item } : { ...item, kind: 'node' }
      )),
    ]),
  }));
}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

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

function projectPayload(project) {
  return project?.payload && typeof project.payload === 'object' ? project.payload : {};
}

function projectField(project, fieldName, fallback = '') {
  const payload = projectPayload(project);
  return project?.[fieldName] ?? payload?.[fieldName] ?? fallback;
}

function normalizeProjectList(value) {
  return Array.isArray(value) ? value : [];
}

function getProjectFileName(file) {
<<<<<<< HEAD
  return file?.name || file?.file_name || file?.fileName || '';
=======
  return file?.original_name || file?.originalName || file?.name || file?.file_name || file?.fileName || '';
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
}

function getProjectFileUrl(file) {
  const rawUrl = String(file?.file_url || file?.fileUrl || file?.url || file?.src || '').trim();

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(rawUrl)) return rawUrl;

  return `${API_BASE_URL}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
}

function getInitialProjectForm(project) {
  const payload = projectPayload(project);
  const payment = project?.payment || payload.payment || {};
  const tags = normalizeProjectList(project?.tags || payload.tags);
<<<<<<< HEAD
=======
  const projectFiles = normalizeProjectFiles(project);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

  return {
    title: projectField(project, 'title'),
    category: projectField(project, 'category'),
    description: projectField(project, 'description'),
    tools: normalizeProjectList(project?.tools || payload.tools).map((tool) => (
      typeof tool === 'string'
<<<<<<< HEAD
        ? { name: tool, specification: '', image: null, imageFile: null }
        : { ...tool, imageFile: null }
    )),
    nodes: normalizeProjectList(project?.nodes || payload.nodes).map(normalizeProjectNode),
=======
        ? { name: tool, specification: '', value: '', image: null, imageFile: null }
        : { ...tool, value: tool.value || '', imageFile: null }
    )),
    nodes: normalizeProjectList(project?.nodes || payload.nodes).map((node) => ({
      ...normalizeProjectNode(node),
      value: node?.value || '',
      imageFile: null,
    })),
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    steps: normalizeProjectList(project?.steps || payload.steps),
    isPaid: Boolean(payment.isPaid || project?.isPaid || payload.isPaid),
    price: payment.price || project?.price || payload.price || '',
    paymentCode: payment.paymentCode || project?.paymentCode || payload.paymentCode || '',
    projectFile: null,
<<<<<<< HEAD
=======
    projectFiles,
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    coverImage: null,
    circuitImage: null,
    altText: project?.coverImage?.altText || payload.coverImage?.altText || project?.altText || payload.altText || '',
    visibility: projectField(project, 'visibility', 'public'),
    difficulty: projectField(project, 'difficulty'),
    estimatedTime: projectField(project, 'estimatedTime'),
    programmingLanguage: projectField(project, 'programmingLanguage'),
    tags: tags.length ? tags : ['IoT', 'Arduino', 'Sensor', 'SmartHome'],
  };
}

<<<<<<< HEAD
=======
function createProjectFileEntry(file = null, label = '') {
  return {
    id: crypto.randomUUID(),
    label,
    file,
    existingFile: null,
    preview: '',
  };
}

function normalizeProjectFiles(project) {
  const payload = projectPayload(project);
  const files = normalizeProjectList(project?.projectFiles || payload.projectFiles || payload.project_files);

  if (files.length) {
    return files.map((item, index) => ({
      id: crypto.randomUUID(),
      label: item?.label || item?.name || DEFAULT_PROJECT_FILE_LABELS[index] || `File Proyek ${index + 1}`,
      file: null,
      existingFile: item?.file && typeof item.file === 'object' ? item.file : item,
      preview: '',
    }));
  }

  if (project?.projectFile || payload.projectFile) {
    return [{
      id: crypto.randomUUID(),
      label: 'File JSON',
      file: null,
      existingFile: project?.projectFile || payload.projectFile,
      preview: '',
    }];
  }

  return [createProjectFileEntry(null, DEFAULT_PROJECT_FILE_LABELS[0])];
}

function getProjectFileEntryName(entry) {
  return entry?.file?.name || getProjectFileName(entry?.existingFile);
}

function formatFileSize(size) {
  const value = Number(size || 0);
  if (!value) return '-';
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(value / 1024)).toLocaleString('id-ID')} KB`;
}

function getEmptyManualTool() {
  return {
    category: '',
    name: '',
    specification: '',
    value: '',
  };
}

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
function getEmptyManualNode() {
  return {
    name: '',
    category: '',
    description: '',
<<<<<<< HEAD
=======
    value: '',
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  };
}

function RichTextEditor({ value, onChange, error }) {
  return (
    <div className={`project-upload-editor${error ? ' has-error' : ''}`}>
      <TinyMCEEditor
        value={value}
        onChange={onChange}
        height={360}
        ariaLabel="Deskripsi proyek"
      />
    </div>
  );
}

<<<<<<< HEAD
=======
function getProjectReferenceName(item, fallback) {
  return String(item?.name || item?.title || fallback).trim();
}

function getProjectReferenceValue(item) {
  return String(item?.value ?? '').trim();
}

function createStepReferenceItems(tools = [], nodes = []) {
  return [
    ...tools.map((tool, index) => ({
      key: `component-${index}`,
      kind: 'component',
      name: getProjectReferenceName(tool, `Komponen ${index + 1}`),
      category: tool?.category || '',
      specification: tool?.specification || tool?.description || '',
      description: tool?.specification || tool?.description || '',
      value: getProjectReferenceValue(tool),
    })),
    ...nodes.map((node, index) => ({
      key: `node-${index}`,
      kind: 'node',
      name: getProjectReferenceName(node, `Node ${index + 1}`),
      category: node?.category || '',
      description: node?.description || '',
      value: getProjectReferenceValue(node),
    })),
  ].filter((item) => item.name);
}

function StepRichTextEditor({ value, onChange, references }) {
  return (
    <div className="project-upload-step-editor">
      <TinyMCEEditor
        value={value}
        onChange={onChange}
        height={260}
        ariaLabel="Deskripsi langkah pengerjaan"
        enableProjectReferences
        projectReferences={references}
      />
    </div>
  );
}

function getStepReferenceKey(reference) {
  return [
    reference?.kind || 'component',
    reference?.name || '',
    reference?.category || '',
    reference?.value || '',
  ].join('|').toLowerCase();
}

function StepReferencePicker({ references, selectedReferences, onToggle }) {
  if (!references.length) {
    return (
      <div className="project-upload-step-linked is-empty">
        Tambahkan komponen atau node terlebih dahulu.
      </div>
    );
  }

  const selectedKeys = new Set(selectedReferences.map(getStepReferenceKey));

  return (
    <div className="project-upload-step-linked" aria-label="Komponen dan node terkait langkah">
      <span>Komponen/Node terkait</span>
      <div>
        {references.map((item) => {
          const itemKey = getStepReferenceKey(item);
          const selected = selectedKeys.has(itemKey);

          return (
            <button
              type="button"
              className={selected ? 'is-selected' : ''}
              onClick={() => onToggle(item)}
              aria-pressed={selected}
              key={`${item.key}-${item.name}`}
            >
              <b>{item.kind === 'node' ? 'Node' : 'Komponen'}</b>
              {item.name}
              {item.value ? <small>{item.value}</small> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
function UploadRowActions({ onEdit, onDelete }) {
  return (
    <span className="project-upload-row-actions">
      <button type="button" onClick={onEdit}>Edit</button>
      <button type="button" className="danger" onClick={onDelete}>Hapus</button>
    </span>
  );
}

<<<<<<< HEAD
function getWokwiPreviewScale(elementName = '') {
  const scaleMap = {
    'wokwi-arduino-uno': 0.95,
    'wokwi-arduino-mega': 0.68,
    'wokwi-arduino-nano': 1.35,
    'wokwi-esp32-devkit-v1': 1.28,
    'wokwi-nano-rp2040-connect': 1.25,

    'wokwi-resistor': 1.8,
    'wokwi-potentiometer': 1.55,
    'wokwi-led': 2.2,
    'wokwi-rgb-led': 2.0,
    'wokwi-buzzer': 1.65,
    'wokwi-servo': 1.05,

    'wokwi-lcd1602': 0.88,
    'wokwi-ssd1306': 1.25,
    'wokwi-7segment': 1.45,

    'wokwi-pushbutton': 1.9,
    'wokwi-membrane-keypad': 0.82,

    'wokwi-dht22': 1.75,
    'wokwi-hc-sr04': 1.15,
    'wokwi-pir-motion-sensor': 1.25,
    'wokwi-photoresistor-sensor': 1.45,
    'wokwi-mpu6050': 1.3,

    'wokwi-led-ring': 1.15,
    'wokwi-ir-receiver': 1.7,
    'wokwi-ds1307': 1.25,
    'wokwi-microsd-card': 1.3,
  };

  return scaleMap[elementName] || 1.2;
}

function WokwiComponentPreview({ elementName, fallback }) {
  const isSupported =
    Boolean(elementName) &&
    SUPPORTED_WOKWI_ELEMENTS.has(elementName);

  if (!isSupported) {
    return (
      <span
        className="project-upload-wokwi-preview is-fallback"
        aria-hidden="true"
        title={`${fallback || 'Komponen'} belum memiliki preview Wokwi`}
        style={{
          width: '92px',
          height: '76px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '8px',
        }}
      >
        <BoxPlusIcon />
      </span>
    );
  }

  const previewScale = getWokwiPreviewScale(elementName);

  return (
    <span
      className="project-upload-wokwi-preview"
      aria-hidden="true"
      title={fallback}
      style={{
        width: '92px',
        height: '76px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '8px',
      }}
    >
      {createElement(elementName, {
        style: {
          display: 'block',
          flex: '0 0 auto',
          transform: `scale(${previewScale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        },
      })}
=======
function WokwiComponentPreview({ elementName, fallback }) {
  if (!SUPPORTED_WOKWI_ELEMENTS.has(elementName)) {
    return <span aria-hidden="true"><BoxPlusIcon /></span>;
  }

  return (
    <span className="project-upload-wokwi-preview" aria-hidden="true" title={fallback}>
      {createElement(elementName)}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    </span>
  );
}

<<<<<<< HEAD
function ComponentImageField({ tool, index, onChange }) {
  const imageName = tool.imageFile?.name || getProjectFileName(tool.image);
  const imageUrl = tool.imageFile ? '' : getProjectFileUrl(tool.image);
=======
function ComponentImageField({ item, index, onChange, type = 'component' }) {
  const imageName = item.imageFile?.name || getProjectFileName(item.image);
  const imageUrl = item.imageFile ? '' : getProjectFileUrl(item.image);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

  return (
    <label className="project-upload-component-image">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => onChange(index, event)}
      />
      {imageUrl ? (
        <img src={imageUrl} alt="" />
<<<<<<< HEAD
      ) : (
        <WokwiComponentPreview elementName={tool.wokwiElement} fallback={tool.name} />
      )}
      <small>{imageName || (tool.wokwiElement ? 'Preview Wokwi' : 'Upload gambar')}</small>
=======
      ) : type === 'node' ? (
        <span className="project-upload-node-image-preview"><NodeSprite name={getProjectNodeType(item)} scale={0.22} title={item.name} /></span>
      ) : (
        <WokwiComponentPreview elementName={item.wokwiElement} fallback={item.name} />
      )}
      <small>{imageName || (type === 'node' ? 'Upload gambar' : (item.wokwiElement ? 'Preview Wokwi' : 'Upload gambar'))}</small>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    </label>
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

  const [formData, setFormData] = useState(() => getInitialProjectForm(initialProject));
  const [newTag, setNewTag] = useState('');
  const [jsonResult, setJsonResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [coverCrop, setCoverCrop] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [circuitPreviewUrl, setCircuitPreviewUrl] = useState('');
<<<<<<< HEAD
  const [selectedToolKey, setSelectedToolKey] = useState('');
  const [selectedNodeKey, setSelectedNodeKey] = useState('');
  const [nodeSearch, setNodeSearch] = useState('');
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false);
  const [manualNode, setManualNode] = useState(() => getEmptyManualNode());
  const existingProjectFileName = getProjectFileName(initialProject?.projectFile);
  const existingCoverImageName = getProjectFileName(initialProject?.coverImage);
  const existingCircuitImageName = getProjectFileName(initialProject?.circuitImage);
=======
  const [activeSection, setActiveSection] = useState('basic');
  const [selectedToolKey, setSelectedToolKey] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [isToolPickerOpen, setIsToolPickerOpen] = useState(false);
  const [selectedNodeKey, setSelectedNodeKey] = useState('');
  const [nodeSearch, setNodeSearch] = useState('');
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false);
  const [manualTool, setManualTool] = useState(() => getEmptyManualTool());
  const [manualNode, setManualNode] = useState(() => getEmptyManualNode());
  const existingCoverImageName = getProjectFileName(initialProject?.coverImage);
  const existingCircuitImageName = getProjectFileName(initialProject?.circuitImage);
  const categoryOptions = useMemo(() => (
    PROJECT_CATEGORY_OPTIONS.includes(formData.category) || !formData.category
      ? PROJECT_CATEGORY_OPTIONS
      : [formData.category, ...PROJECT_CATEGORY_OPTIONS]
  ), [formData.category]);
  const stepReferenceItems = useMemo(
    () => createStepReferenceItems(formData.tools, formData.nodes),
    [formData.tools, formData.nodes]
  );
  const completionItems = useMemo(() => {
    const descriptionText = stripHtml(formData.description).trim();
    const projectFileCount = formData.projectFiles.filter((entry) => entry.file || entry.existingFile).length;

    return [
      { label: 'Info dasar', done: Boolean(formData.title.trim() && formData.category.trim() && descriptionText) },
      { label: 'Cover & file', done: Boolean((formData.coverImage || coverPreviewUrl) && projectFileCount > 0) },
      { label: 'Komponen', done: formData.tools.length > 0 },
      { label: 'Node', done: formData.nodes.length > 0 },
      { label: 'Langkah', done: formData.steps.length > 0 },
    ];
  }, [coverPreviewUrl, formData]);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

  useEffect(() => {
    setFormData(getInitialProjectForm(initialProject));
    setFieldErrors({});
    setFormError('');
    setJsonResult(null);
    setNewTag('');
    setSelectedToolKey('');
<<<<<<< HEAD
    setSelectedNodeKey('');
    setNodeSearch('');
    setIsNodePickerOpen(false);
=======
    setToolSearch('');
    setIsToolPickerOpen(false);
    setSelectedNodeKey('');
    setNodeSearch('');
    setIsNodePickerOpen(false);
    setActiveSection('basic');
    setManualTool(getEmptyManualTool());
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    setManualNode(getEmptyManualNode());
  }, [initialProject, mode, projectId]);

  useEffect(() => {
    if (!formData.coverImage) {
      setCoverPreviewUrl(resolveProjectCoverUrl(initialProject));
      return undefined;
    }

    const nextUrl = URL.createObjectURL(formData.coverImage);
    setCoverPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [formData.coverImage, initialProject]);

  useEffect(() => {
    if (!formData.circuitImage) {
      setCircuitPreviewUrl(getProjectFileUrl(initialProject?.circuitImage));
      return undefined;
    }

    const nextUrl = URL.createObjectURL(formData.circuitImage);
    setCircuitPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [formData.circuitImage, initialProject]);

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

<<<<<<< HEAD
=======
  function handleManualToolChange(event) {
    const { name, value } = event.target;
    setManualTool((current) => ({ ...current, [name]: value }));
    clearFieldError('tools');
  }

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  function handleManualNodeChange(event) {
    const { name, value } = event.target;
    setManualNode((current) => ({ ...current, [name]: value }));
    clearFieldError('nodes');
  }

<<<<<<< HEAD
  function handleFileChange(event) {
=======
  const filteredToolCatalog = useMemo(() => {
    const keyword = toolSearch.trim().toLowerCase();

    if (!keyword) {
      return WOKWI_COMPONENT_CATALOG;
    }

    return WOKWI_COMPONENT_CATALOG.filter((tool) =>
      [tool.category, tool.name, tool.specification, tool.wokwiElement]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [toolSearch]);

  async function handleFileChange(event) {
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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

<<<<<<< HEAD
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

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    if (name === 'circuitImage' && file) {
      if (!file.type.startsWith('image/')) {
        setFieldErrors((current) => ({
          ...current,
          circuitImage: 'Gambar rangkaian harus berupa file gambar.',
        }));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setFieldErrors((current) => ({
          ...current,
          circuitImage: 'Ukuran gambar rangkaian maksimal 2 MB.',
        }));
        return;
      }
    }

    setFormData((current) => ({ ...current, [name]: file }));
    clearFieldError(name);
  }

<<<<<<< HEAD
=======
  function addProjectFileRow() {
    setFormData((current) => ({
      ...current,
      projectFiles: [
        ...current.projectFiles,
        createProjectFileEntry(null, DEFAULT_PROJECT_FILE_LABELS[current.projectFiles.length] || `File Proyek ${current.projectFiles.length + 1}`),
      ],
    }));
    clearFieldError('projectFile');
  }

  function updateProjectFileLabel(index, value) {
    setFormData((current) => ({
      ...current,
      projectFiles: current.projectFiles.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, label: value } : entry
      ),
    }));
    clearFieldError('projectFile');
  }

  async function handleProjectFileChange(index, event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!PROJECT_FILE_EXTENSIONS.includes(extension)) {
      setFieldErrors((current) => ({
        ...current,
        projectFile: 'Format file proyek harus .json, .flow, .schema, .txt, .md, .ino, atau .zip.',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        projectFile: 'Ukuran setiap file proyek maksimal 10 MB.',
      }));
      return;
    }

    let preview = '';

    if (PROJECT_FILE_TEXT_PREVIEW_EXTENSIONS.has(extension)) {
      try {
        preview = await file.text();
      } catch (error) {
        console.error('File proyek tidak dapat dibaca:', error);
        setFieldErrors((current) => ({
          ...current,
          projectFile: 'File proyek berhasil dipilih, tetapi isi file tidak dapat ditampilkan.',
        }));
      }
    } else if (extension === 'zip') {
      preview = `Preview ZIP tidak tersedia.\nFile: ${file.name}\nUkuran: ${formatFileSize(file.size)}`;
    }

    setFormData((current) => ({
      ...current,
      projectFile: index === 0 ? file : current.projectFile,
      projectFiles: current.projectFiles.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, file, preview } : entry
      ),
    }));
    clearFieldError('projectFile');
    setFormError('');
  }

  async function removeProjectFileRow(index) {
    const entry = formData.projectFiles[index];
    const hasFile = entry?.file || entry?.existingFile;

    if (hasFile) {
      const confirmed = await showConfirmAlert({
        title: 'Hapus File Proyek?',
        text: 'File ini akan dihapus dari daftar file proyek pada form.',
        confirmButtonText: 'Hapus',
      });
      if (!confirmed) return;
    }

    setFormData((current) => {
      const nextFiles = current.projectFiles.filter((_, entryIndex) => entryIndex !== index);
      return {
        ...current,
        projectFiles: nextFiles.length ? nextFiles : [createProjectFileEntry(null, DEFAULT_PROJECT_FILE_LABELS[0])],
        projectFile: nextFiles[0]?.file || null,
      };
    });
    clearFieldError('projectFile');
  }

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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

  function addTool() {
<<<<<<< HEAD
=======
    if (selectedToolKey === MANUAL_PICKER_VALUE) {
      const name = manualTool.name.trim();

      if (!name) {
        setFieldErrors((current) => ({
          ...current,
          tools: 'Nama alat atau komponen manual wajib diisi.',
        }));
        return;
      }

      setFormData((current) => ({
        ...current,
        tools: [
          ...current.tools,
          {
            category: manualTool.category.trim() || 'Manual',
            name,
            specification: manualTool.specification.trim(),
            value: manualTool.value.trim(),
            wokwiElement: '',
            image: null,
            imageFile: null,
            source: 'manual',
          },
        ],
      }));
      setManualTool(getEmptyManualTool());
      clearFieldError('tools');
      return;
    }

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    const selectedTool = WOKWI_COMPONENT_CATALOG[Number(selectedToolKey)];

    if (!selectedTool) {
      setFieldErrors((current) => ({
        ...current,
        tools: 'Pilih alat atau komponen terlebih dahulu.',
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
<<<<<<< HEAD
      tools: [...current.tools, { ...selectedTool, image: null, imageFile: null }],
=======
      tools: [...current.tools, { ...selectedTool, value: '', image: null, imageFile: null }],
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    }));
    setSelectedToolKey('');
    clearFieldError('tools');
  }

  function editTool(index) {
<<<<<<< HEAD
=======
    if (selectedToolKey === MANUAL_PICKER_VALUE) {
      const name = manualTool.name.trim();

      if (!name) {
        setFieldErrors((current) => ({
          ...current,
          tools: 'Isi data manual, lalu klik Edit pada baris komponen.',
        }));
        return;
      }

      setFormData((current) => ({
        ...current,
        tools: current.tools.map((tool, toolIndex) =>
          toolIndex === index
            ? {
                ...tool,
                category: manualTool.category.trim() || 'Manual',
                name,
                specification: manualTool.specification.trim(),
                value: manualTool.value.trim(),
                wokwiElement: '',
                source: 'manual',
              }
            : tool
        ),
      }));
      setManualTool(getEmptyManualTool());
      clearFieldError('tools');
      return;
    }

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    const selectedTool = WOKWI_COMPONENT_CATALOG[Number(selectedToolKey)];

    if (!selectedTool) {
      setFieldErrors((current) => ({
        ...current,
        tools: 'Pilih komponen pengganti dari daftar, lalu klik Edit pada baris komponen.',
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      tools: current.tools.map((tool, toolIndex) =>
        toolIndex === index
<<<<<<< HEAD
          ? { ...tool, ...selectedTool }
=======
          ? { ...tool, ...selectedTool, value: tool.value || '', image: tool.image || null, imageFile: tool.imageFile || null }
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
          : tool
      ),
    }));
    setSelectedToolKey('');
    clearFieldError('tools');
  }

  function handleComponentImageChange(index, event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFieldErrors((current) => ({
        ...current,
        tools: 'Gambar komponen harus berupa file gambar.',
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        tools: 'Ukuran gambar komponen maksimal 2 MB.',
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      tools: current.tools.map((tool, toolIndex) =>
        toolIndex === index ? { ...tool, imageFile: file } : tool
      ),
    }));
    clearFieldError('tools');
  }

<<<<<<< HEAD
=======
  function updateToolValue(index, value) {
    setFormData((current) => ({
      ...current,
      tools: current.tools.map((tool, toolIndex) =>
        toolIndex === index ? { ...tool, value } : tool
      ),
    }));
  }

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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

  const filteredNodeCatalog = useMemo(() => {
    const keyword = nodeSearch.trim().toLowerCase();

    if (!keyword) {
      return PROJECT_NODE_CATALOG;
    }

    return PROJECT_NODE_CATALOG.filter((node) =>
      [node.type, node.name, node.category]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [nodeSearch]);

  function addNode() {
    if (selectedNodeKey === MANUAL_PICKER_VALUE) {
      const name = manualNode.name.trim();

      if (!name) {
        setFieldErrors((current) => ({
          ...current,
          nodes: 'Nama node manual wajib diisi.',
        }));
        return;
      }

      setFormData((current) => ({
        ...current,
        nodes: [
          ...current.nodes,
          {
            type: `manual-${normalizeNodeType(name) || crypto.randomUUID().slice(0, 8)}`,
            name,
            category: manualNode.category.trim() || 'Manual',
            description: manualNode.description.trim(),
<<<<<<< HEAD
=======
            value: manualNode.value.trim(),
            image: null,
            imageFile: null,
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
            source: 'manual',
          },
        ],
      }));
      setManualNode(getEmptyManualNode());
      clearFieldError('nodes');
      return;
    }

    const selectedNode = PROJECT_NODE_CATALOG.find((node) => node.type === selectedNodeKey);

    if (!selectedNode) {
      setFieldErrors((current) => ({
        ...current,
        nodes: 'Pilih node ArduFlow terlebih dahulu.',
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
<<<<<<< HEAD
      nodes: [...current.nodes, { ...selectedNode }],
=======
      nodes: [...current.nodes, { ...selectedNode, value: '', image: null, imageFile: null }],
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    }));
    setSelectedNodeKey('');
    clearFieldError('nodes');
  }

  function editNode(index) {
    if (selectedNodeKey === MANUAL_PICKER_VALUE) {
      const name = manualNode.name.trim();

      if (!name) {
        setFieldErrors((current) => ({
          ...current,
          nodes: 'Isi data manual, lalu klik Edit pada baris node.',
        }));
        return;
      }

      setFormData((current) => ({
        ...current,
        nodes: current.nodes.map((node, nodeIndex) =>
          nodeIndex === index
            ? {
                ...node,
                type: `manual-${normalizeNodeType(name) || crypto.randomUUID().slice(0, 8)}`,
                name,
                category: manualNode.category.trim() || 'Manual',
                description: manualNode.description.trim(),
<<<<<<< HEAD
=======
                value: manualNode.value.trim(),
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                source: 'manual',
              }
            : node
        ),
      }));
      setManualNode(getEmptyManualNode());
      clearFieldError('nodes');
      return;
    }

    const selectedNode = PROJECT_NODE_CATALOG.find((node) => node.type === selectedNodeKey);

    if (!selectedNode) {
      setFieldErrors((current) => ({
        ...current,
        nodes: 'Pilih node pengganti dari daftar, lalu klik Edit pada baris node.',
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      nodes: current.nodes.map((node, nodeIndex) =>
<<<<<<< HEAD
        nodeIndex === index ? { ...selectedNode } : node
=======
        nodeIndex === index ? { ...node, ...selectedNode, value: node.value || '', image: node.image || null, imageFile: node.imageFile || null } : node
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
      ),
    }));
    setSelectedNodeKey('');
    clearFieldError('nodes');
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

<<<<<<< HEAD
  async function addStep() {
    const title = await showPromptAlert({
      title: 'Judul Langkah',
      text: 'Masukkan judul singkat langkah pengerjaan.',
      requiredMessage: 'Judul langkah wajib diisi.',
    });
    if (!title?.trim()) return;
    const description = await showPromptAlert({
      title: 'Tambah Langkah',
      text: 'Masukkan deskripsi langkah pengerjaan.',
      requiredMessage: 'Deskripsi langkah wajib diisi.',
    });
    if (!description?.trim()) return;
    setFormData((current) => ({
      ...current,
      steps: [...current.steps, { order: current.steps.length + 1, title: title.trim(), description: description.trim() }],
=======
  function updateNodeValue(index, value) {
    setFormData((current) => ({
      ...current,
      nodes: current.nodes.map((node, nodeIndex) =>
        nodeIndex === index ? { ...node, value } : node
      ),
    }));
  }

  function handleNodeImageChange(index, event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFieldErrors((current) => ({
        ...current,
        nodes: 'Gambar node harus berupa file gambar.',
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        nodes: 'Ukuran gambar node maksimal 2 MB.',
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      nodes: current.nodes.map((node, nodeIndex) =>
        nodeIndex === index ? { ...node, imageFile: file } : node
      ),
    }));
    clearFieldError('nodes');
  }

  function addStep(template = null) {
    setFormData((current) => ({
      ...current,
      steps: normalizeProjectSteps([
        ...current.steps,
        {
          order: current.steps.length + 1,
          title: template?.title || '',
          description: template?.description || '',
          references: [],
        },
      ]),
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    }));
    clearFieldError('steps');
  }

<<<<<<< HEAD
  async function editStep(index) {
    const selected = formData.steps[index];
    if (!selected) return;
    const title = await showPromptAlert({
      title: 'Edit Judul Langkah',
      text: 'Edit judul singkat langkah pengerjaan.',
      inputValue: selected.title || `Langkah ${selected.order || index + 1}`,
      requiredMessage: 'Judul langkah wajib diisi.',
    });
    if (!title?.trim()) return;
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
        stepIndex === index ? { ...step, title: title.trim(), description: description.trim() } : step
      ),
    }));
=======
  function updateStep(index, field, value) {
    setFormData((current) => ({
      ...current,
      steps: normalizeProjectSteps(current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      )),
    }));
    clearFieldError('steps');
  }

  function toggleStepReference(index, reference) {
    const referenceData = {
      kind: reference.kind === 'node' ? 'node' : 'component',
      name: reference.name,
      category: reference.category || '',
      value: reference.value || '',
      description: reference.description || reference.specification || '',
    };
    const referenceKey = getStepReferenceKey(referenceData);

    setFormData((current) => ({
      ...current,
      steps: normalizeProjectSteps(current.steps.map((step, stepIndex) => {
        if (stepIndex !== index) return step;

        const currentReferences = normalizeStepReferences(step.references);
        const hasReference = currentReferences.some((item) => getStepReferenceKey(item) === referenceKey);

        return {
          ...step,
          references: hasReference
            ? currentReferences.filter((item) => getStepReferenceKey(item) !== referenceKey)
            : [...currentReferences, referenceData],
        };
      })),
    }));
    clearFieldError('steps');
  }

  function moveStep(index, direction) {
    setFormData((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.steps.length) return current;

      const nextSteps = [...current.steps];
      const [selected] = nextSteps.splice(index, 1);
      nextSteps.splice(nextIndex, 0, selected);

      return {
        ...current,
        steps: normalizeProjectSteps(nextSteps),
      };
    });
    clearFieldError('steps');
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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
<<<<<<< HEAD
      steps: current.steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, order: stepIndex + 1 })),
=======
      steps: normalizeProjectSteps(current.steps.filter((_, stepIndex) => stepIndex !== index)),
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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

<<<<<<< HEAD
  function toolToJson(tool) {
    if (typeof tool === 'string') {
      return { name: tool, specification: '' };
=======
  function projectFileEntryToJson(entry, index) {
    const fileMeta = fileToJson(entry.file) || entry.existingFile || null;

    return {
      id: entry.id,
      label: entry.label.trim() || DEFAULT_PROJECT_FILE_LABELS[index] || `File Proyek ${index + 1}`,
      file: fileMeta,
    };
  }

  function toolToJson(tool) {
    if (typeof tool === 'string') {
      return { name: tool, specification: '', value: '' };
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    }

    const { imageFile, ...toolData } = tool || {};

    return {
      ...toolData,
      image: imageFile ? fileToJson(imageFile) : (toolData.image || null),
    };
  }

<<<<<<< HEAD
=======
  function nodeToJson(node) {
    if (typeof node === 'string') {
      return { name: node, category: '', description: '', value: '' };
    }

    const { imageFile, ...nodeData } = node || {};

    return {
      ...nodeData,
      image: imageFile ? fileToJson(imageFile) : (nodeData.image || null),
    };
  }

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  function validateProjectForm(status) {
    const isDraft = status === 'draft';
    const isEdit = mode === 'edit';
    const errors = {};
    const descriptionText = stripHtml(formData.description).trim();
<<<<<<< HEAD
=======
    const validProjectFiles = formData.projectFiles.filter((entry) => entry.file || entry.existingFile);
    const missingProjectFileNames = formData.projectFiles.some((entry) => (entry.file || entry.existingFile) && !entry.label.trim());
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

    if (!isDraft && !formData.title.trim()) errors.title = 'Judul proyek wajib diisi.';
    if (!isDraft && !formData.category.trim()) errors.category = 'Kategori wajib diisi.';
    if (!isDraft && !descriptionText) errors.description = 'Deskripsi proyek wajib diisi.';
<<<<<<< HEAD
    if (!isDraft && !isEdit && !formData.projectFile) errors.projectFile = 'File proyek wajib dipilih.';
=======
    if (!isDraft && !isEdit && validProjectFiles.length === 0) errors.projectFile = 'Tambahkan minimal satu file proyek.';
    if (!isDraft && missingProjectFileNames) errors.projectFile = 'Nama file proyek wajib diisi sebelum upload/disimpan.';
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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
<<<<<<< HEAD
=======
    const projectFiles = formData.projectFiles
      .filter((entry) => entry.file || entry.existingFile)
      .map(projectFileEntryToJson);
    const primaryProjectFile = projectFiles[0]?.file || initialProject?.projectFile || null;
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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
        tools: formData.tools.map(toolToJson),
<<<<<<< HEAD
        nodes: formData.nodes,
=======
        nodes: formData.nodes.map(nodeToJson),
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
        steps: formData.steps,
        payment: {
          isPaid: formData.isPaid,
          price: formData.isPaid ? Number(formData.price) : 0,
          currency: 'IDR',
          paymentCode: formData.isPaid ? formData.paymentCode : null,
        },
<<<<<<< HEAD
        projectFile: fileToJson(formData.projectFile) || initialProject?.projectFile || null,
=======
        projectFile: primaryProjectFile,
        projectFiles,
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
        coverImage: formData.coverImage
          ? { ...fileToJson(formData.coverImage), altText: formData.altText.trim() }
          : (initialProject?.coverImage || null),
        circuitImage: fileToJson(formData.circuitImage) || initialProject?.circuitImage || null,
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

<<<<<<< HEAD
  async function uploadProjectImageToServer(file, imageType = 'project-image') {
    if (!file) {
      return null;
    }

    const uploadData = new FormData();
    uploadData.append('file', file, file.name);
    uploadData.append('target_folder', PROJECT_UPLOAD_TARGET_FOLDER);

    console.log('[Project Upload] mulai:', {
      imageType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      endpoint: PROJECT_UPLOAD_API,
      targetFolder: PROJECT_UPLOAD_TARGET_FOLDER,
    });

    const response = await fetch(PROJECT_UPLOAD_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: uploadData,
    });

    const responseText = await response.text();

    let result;
    try {
      result = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        `Response upload gambar proyek bukan JSON: ${responseText}`
      );
    }

    console.log('[Project Upload] response:', {
      status: response.status,
      imageType,
      result,
    });

    if (!response.ok || result?.success === false) {
      const remoteMessage =
        result?.data?.remote_response?.message ||
        result?.data?.remote_response?.error ||
        '';

      throw new Error(
        result?.message ||
        result?.error ||
        result?.errors?.file ||
        remoteMessage ||
        `Upload ${imageType} gagal. HTTP ${response.status}`
      );
    }

    const uploadedUrl =
      result?.data?.url ||
      result?.data?.file_url ||
      result?.data?.fileUrl ||
      result?.url ||
      result?.file_url ||
      result?.fileUrl ||
      '';

    const uploadedPath =
      result?.data?.path ||
      result?.data?.file_path ||
      result?.path ||
      result?.file_path ||
      '';

    if (!uploadedUrl && !uploadedPath) {
      throw new Error(
        `Upload ${imageType} berhasil, tetapi API tidak mengembalikan URL/path file.`
      );
    }

    const sourceValue =
      uploadedPath ||
      uploadedUrl;

    let fileName = '';

    try {
      if (/^https?:\/\//i.test(sourceValue)) {
        const parsedUrl = new URL(sourceValue);
        fileName = decodeURIComponent(
          parsedUrl.pathname
            .split('/')
            .filter(Boolean)
            .pop() || ''
        );
      } else {
        fileName = decodeURIComponent(
          String(sourceValue)
            .replace(/\\/g, '/')
            .split('/')
            .filter(Boolean)
            .pop() || ''
        );
      }
    } catch {
      fileName =
        String(sourceValue)
          .replace(/\\/g, '/')
          .split('/')
          .filter(Boolean)
          .pop() ||
        file.name;
    }

    if (!fileName) {
      fileName = file.name;
    }

    const finalPath =
      uploadedPath ||
      `uploads/web/storage/project/${fileName}`;

    const finalUrl =
      uploadedUrl ||
      `${PROJECT_IMAGE_PUBLIC_BASE_URL}/${encodeURIComponent(fileName)}`;

    console.log('[Project Upload] berhasil:', {
      imageType,
      fileName,
      path: finalPath,
      url: finalUrl,
    });

    return {
      file_name: fileName,
      fileName,
      name: fileName,
      original_name: file.name,
      originalName: file.name,
      file_type: file.type || 'application/octet-stream',
      fileType: file.type || 'application/octet-stream',
      type: file.type || 'application/octet-stream',
      file_size: file.size,
      fileSize: file.size,
      size: file.size,
      file_path: finalPath,
      filePath: finalPath,
      path: finalPath,
      file_url: finalUrl,
      fileUrl: finalUrl,
      url: finalUrl,
    };
  }

  async function sendProjectToApi(status) {
    const projectJson = createProjectJson(status);

    if (!projectJson) {
      return;
    }

    try {
      const isEdit =
        mode === 'edit' &&
        (projectId || initialProject?.id);

      /*
       * Salin data agar metadata File lokal dapat diganti dengan
       * URL/path hasil upload server.
       */
      const projectData = {
        ...projectJson.data,
      };

      /*
       * 1. Cover proyek -> server /web/storage/project
       */
      if (formData.coverImage) {
        projectData.coverImage =
          await uploadProjectImageToServer(
            formData.coverImage,
            'cover proyek'
          );

        if (formData.altText?.trim()) {
          projectData.coverImage.altText =
            formData.altText.trim();
        }
      }

      /*
       * 2. Gambar rangkaian -> server /web/storage/project
       */
      if (formData.circuitImage) {
        projectData.circuitImage =
          await uploadProjectImageToServer(
            formData.circuitImage,
            'gambar rangkaian'
          );
      }

      /*
       * 3. Gambar komponen -> server /web/storage/project
       */
      projectData.tools =
        await Promise.all(
          formData.tools.map(
            async (tool) => {
              const {
                imageFile,
                ...toolData
              } = tool || {};

              if (!imageFile) {
                return {
                  ...toolData,
                  image:
                    toolData.image ||
                    null,
                };
              }

              const uploadedImage =
                await uploadProjectImageToServer(
                  imageFile,
                  `gambar komponen ${toolData.name || ''}`.trim()
                );

              return {
                ...toolData,
                image: uploadedImage,
              };
            }
          )
        );

      /*
       * project-submit-sqlite.php tetap menyimpan data proyek ke SQLite.
       * Gambar TIDAK dikirim ulang ke API ini karena sudah ada di server.
       */
      const payload = new FormData();

      payload.append(
        'payload',
        JSON.stringify(projectData)
      );

      if (isEdit) {
        payload.append(
          '_method',
          'PUT'
        );
      }

      /*
       * File .json/.flow masih diproses oleh project-submit-sqlite.php.
       */
      if (formData.projectFile) {
        payload.append(
          'project_file',
          formData.projectFile
        );
      }

      const requestUrl =
        isEdit
          ? `${PROJECT_API_URL}?id=${encodeURIComponent(
              projectId ||
              initialProject.id
            )}`
          : PROJECT_API_URL;

      console.log(
        '[Project Submit] data yang dikirim:',
        projectData
      );

      const response =
        await fetch(
          requestUrl,
          {
            method: 'POST',
            headers: {
              Accept:
                'application/json',
            },
            body: payload,
          }
        );

      const responseText =
        await response.text();

      let result;

      try {
        result =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch {
        throw new Error(
          `Response API bukan JSON: ${responseText}`
        );
      }

      console.log(
        'SQLite API URL:',
        requestUrl
      );

      console.log(
        'SQLite API Status:',
        response.status
      );

      console.log(
        'SQLite API Response:',
        result
      );

      if (
        !response.ok ||
        result?.success === false
      ) {
        const errorParts = [];

        if (result?.message) {
          errorParts.push(
            result.message
          );
        }

        if (result?.error) {
          errorParts.push(
            result.error
          );
        }

        if (
          result?.errors &&
          typeof result.errors ===
            'object'
        ) {
          Object.entries(
            result.errors
          ).forEach(
            ([key, value]) => {
              if (
                value !== null &&
                value !== undefined &&
                String(value).trim()
              ) {
                errorParts.push(
                  `${key}: ${String(
                    value
                  )}`
                );
              }
            }
          );
        }

        if (
          result?.database_path
        ) {
          errorParts.push(
            `database_path: ${result.database_path}`
          );
        }

        const errorMessage =
          [
            ...new Set(
              errorParts
            ),
          ].join(' | ');

        console.error(
          'Detail error Project API:',
          {
            status:
              response.status,
            url:
              requestUrl,
            response:
              result,
          }
        );

        throw new Error(
          errorMessage ||
          'Gagal menyimpan proyek.'
        );
      }

      setJsonResult(result);

      onSuccess?.(
        result.data ||
        result
      );

      await showSuccessAlert(
        'Berhasil',
        result.message ||
          (
            isEdit
              ? 'Proyek berhasil diperbarui.'
              : 'Proyek berhasil disimpan.'
          )
      );
    } catch (error) {
      console.error(
        'Gagal mengirim proyek ke API:',
        error
      );

      setFormError(
        error instanceof TypeError
          ? `API tidak dapat dihubungi. Project API: ${PROJECT_API_URL}; Upload API: ${PROJECT_UPLOAD_API}.`
          : error.message
      );
    }
  };
=======
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

      formData.projectFiles.filter((entry) => entry.file || entry.existingFile).forEach((entry, index) => {
        if (entry.file) {
          payload.append(`project_files[${index}]`, entry.file);
        }
      });

      formData.tools.forEach((tool, index) => {
        if (tool.imageFile) {
          payload.append(`component_images[${index}]`, tool.imageFile);
        }
      });

      formData.nodes.forEach((node, index) => {
        if (node.imageFile) {
          payload.append(`node_images[${index}]`, node.imageFile);
        }
      });

      if (formData.coverImage) {
        payload.append('cover_image', formData.coverImage);
      }

      if (formData.circuitImage) {
        payload.append('circuit_image', formData.circuitImage);
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
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

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
<<<<<<< HEAD

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
            <RichTextEditor value={formData.description} onChange={handleDescriptionChange} error={fieldErrors.description} />
            {fieldErrors.description ? <em className="project-upload-error">{fieldErrors.description}</em> : <small>Jelaskan fungsi, tujuan, dan cara kerja proyek anda</small>}
          </div>

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div><h3>Alat &amp; Komponen *</h3><p>Pilih alat dan komponen elektronik dari katalog Wokwi yang digunakan dalam proyek ini</p></div>
            </div>
            <div className="project-upload-node-picker project-upload-component-picker">
              <select
                value={selectedToolKey}
                onChange={(event) => {
                  setSelectedToolKey(event.target.value);
                  clearFieldError('tools');
                }}
              >
                <option value="">Pilih alat atau komponen</option>
                {WOKWI_COMPONENT_CATALOG.map((tool, index) => (
                  <option value={index} key={`${tool.category}-${tool.name}`}>
                    {tool.category} - {tool.name} - {tool.specification}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addTool}><PlusIcon /> Tambah Item</button>
            </div>
            <div className={`project-upload-table${fieldErrors.tools ? ' has-error' : ''}`}>
              <div className="project-upload-table__head project-upload-table__head--components"><span>Kategori</span><span>Nama Alat/Komponen</span><span>Keterangan/Spesifikasi</span><span>Gambar</span><span>Aksi</span></div>
              {formData.tools.length ? formData.tools.map((tool, index) => (
                <div className="project-upload-table__head project-upload-table__head--components" key={`${tool.name}-${index}`}>
                  <span>{tool.category || '-'}</span>
                  <span>{tool.name}</span>
                  <span>{tool.specification || '-'}</span>
                  <ComponentImageField tool={tool} index={index} onChange={handleComponentImageChange} />
                  <UploadRowActions onEdit={() => editTool(index)} onDelete={() => deleteTool(index)} />
                </div>
              )) : (
                <div className="project-upload-empty"><BoxPlusIcon /><strong>Belum ada alat atau komponen</strong><p>Pilih item dari katalog, lalu klik tombol “Tambah Item”</p></div>
              )}
            </div>
            {fieldErrors.tools ? <em className="project-upload-error">{fieldErrors.tools}</em> : null}
          </section>

          <section className="project-upload-list-section">
            <div className="project-upload-section-head">
              <div><h3>Node ArduFlow yang Digunakan *</h3><p>Pilih node dari katalog ArduFlow yang digunakan dalam proyek ini</p></div>
              <button
                type="button"
                onClick={() => setIsNodePickerOpen((current) => !current)}
              >
                <PlusIcon /> {isNodePickerOpen ? 'Tutup Node' : 'Tambah Node'}
              </button>
            </div>
            {isNodePickerOpen ? (
              <div className="project-upload-node-picker-panel">
                <div className="project-upload-node-search">
                  <input
                    type="search"
                    placeholder="Cari node..."
                    value={nodeSearch}
                    onChange={(event) => setNodeSearch(event.target.value)}
                  />
                  <button
                    type="button"
                    className={selectedNodeKey === MANUAL_PICKER_VALUE ? 'is-active' : ''}
                    onClick={() => {
                      setSelectedNodeKey(MANUAL_PICKER_VALUE);
                      clearFieldError('nodes');
                    }}
                  >
                    <PlusIcon /> Manual
                  </button>
                  <button type="button" onClick={addNode}><PlusIcon /> Tambah Node</button>
                </div>
                {selectedNodeKey === MANUAL_PICKER_VALUE ? (
                  <div className="project-upload-manual-grid" aria-label="Tambah node ArduFlow manual">
                    <input name="category" type="text" value={manualNode.category} onChange={handleManualNodeChange} placeholder="Kategori manual" />
                    <input name="name" type="text" value={manualNode.name} onChange={handleManualNodeChange} placeholder="Nama node *" />
                    <input name="description" type="text" value={manualNode.description} onChange={handleManualNodeChange} placeholder="Keterangan node" />
                  </div>
                ) : null}
                <div className="project-upload-node-grid" role="listbox" aria-label="Pilih node ArduFlow">
                  {filteredNodeCatalog.map((node) => {
                    const isSelected = selectedNodeKey === node.type;

                    return (
                      <button
                        type="button"
                        className={`project-upload-node-card${isSelected ? ' is-selected' : ''}`}
                        key={node.type}
                        onClick={() => {
                          setSelectedNodeKey(node.type);
                          clearFieldError('nodes');
                        }}
                        aria-pressed={isSelected}
                      >
                        <span className="project-upload-node-card__sprite">
                          <NodeSprite name={node.type} scale={0.54} maxWidth={128} maxHeight={96} title={node.name} />
                        </span>
                        <span>{node.name}</span>
                        <small>{node.category}</small>
                      </button>
                    );
                  })}
                  {filteredNodeCatalog.length === 0 ? (
                    <div className="project-upload-node-card project-upload-node-card--empty">
                      <span>Node tidak ditemukan</span>
                      <small>Coba kata kunci lain</small>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {formData.nodes.length ? (
              <div className={`project-upload-table${fieldErrors.nodes ? ' has-error' : ''}`}>
                <div className="project-upload-table__head project-upload-table__head--nodes"><span>Node</span><span>Kategori</span><span>Keterangan</span><span>Aksi</span></div>
                {formData.nodes.map((node, index) => (
                  <div className="project-upload-table__head project-upload-table__head--nodes" key={`${node.name}-${index}`}>
                    <span className="project-upload-selected-node">
                      <NodeSprite name={getProjectNodeType(node)} scale={0.34} title={node.name} />
                      <b>{node.name}</b>
                    </span>
                    <span>{node.category || '-'}</span>
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
                <div className="project-upload-table__head project-upload-table__head--steps"><span>No</span><span>Judul</span><span>Deskripsi</span><span>Aksi</span></div>
                {formData.steps.map((step, index) => (
                  <div className="project-upload-table__head project-upload-table__head--steps" key={step.order}>
                    <span>{step.order}</span>
                    <span>{step.title || `Langkah ${step.order || index + 1}`}</span>
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
              <span>{formData.projectFile?.name || existingProjectFileName || 'Drag & drop file di sini'}</span>
              <small>{existingProjectFileName && !formData.projectFile ? 'File lama tetap digunakan jika tidak diganti' : 'Format : json, flow | Maksimal 10 MB'}</small>
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
              <span>{formData.coverImage?.name || existingCoverImageName || 'Upload gambar cover'}</span>
              <small>{existingCoverImageName && !formData.coverImage ? 'Cover lama tetap digunakan jika tidak diganti' : 'PNG, JPG maksimal 2 MB'}</small>
              <strong>Pilih Gambar</strong>
            </label>
            {fieldErrors.coverImage ? <em className="project-upload-error">{fieldErrors.coverImage}</em> : null}
            <UploadField label="Alt Text" hint="Pilih gambar yang mewakili proyek Anda">
              <input name="altText" type="text" value={formData.altText} onChange={handleInputChange} placeholder="Deskripsikan proyek anda" />
=======

      <section className="project-upload-actions project-upload-actions--top" aria-label="Aksi form proyek">
        <button className="project-upload-publish" type="submit" form="project-upload-form"><PublishIcon /> Simpan Proyek</button>
        <button className="project-upload-draft" type="button" onClick={() => sendProjectToApi('draft')}><SaveIcon /> Simpan Draft</button>
        <button className="project-upload-cancel" type="button" onClick={onCancel}>Batal</button>
      </section>

      <nav className="project-upload-tabs" aria-label="Navigasi form proyek">
        {PROJECT_FORM_TABS.map((tab) => (
          <button
            type="button"
            className={activeSection === tab.id ? 'is-active' : ''}
            onClick={() => setActiveSection(tab.id)}
            key={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="project-upload-layout">
        <form className="project-upload-main" id="project-upload-form" onSubmit={handleSubmit}>
          <section className={`project-upload-form-section${activeSection === 'basic' ? ' is-active' : ''}`}>
            <UploadField label="Judul Proyek *" hint="Pilih judul yang jelas dan menarik" error={fieldErrors.title}>
              <input name="title" type="text" value={formData.title} onChange={handleInputChange} placeholder="Masukkan judul proyek" aria-invalid={Boolean(fieldErrors.title)} />
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
            </UploadField>

<<<<<<< HEAD
          <section className="project-upload-card project-upload-cover">
            <h3>Gambar Rangkaian</h3>
            <label className={`project-upload-cover-box${fieldErrors.circuitImage ? ' has-error' : ''}`}>
              <input name="circuitImage" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
              {circuitPreviewUrl ? (
                <img className="project-upload-cover-preview" src={circuitPreviewUrl} alt="Preview gambar rangkaian" />
              ) : (
                <ImageIcon />
              )}
              <span>{formData.circuitImage?.name || existingCircuitImageName || 'Upload gambar rangkaian'}</span>
              <small>{existingCircuitImageName && !formData.circuitImage ? 'Gambar lama tetap digunakan jika tidak diganti' : 'PNG, JPG, WEBP maksimal 2 MB'}</small>
              <strong>Pilih Gambar</strong>
            </label>
            {fieldErrors.circuitImage ? <em className="project-upload-error">{fieldErrors.circuitImage}</em> : null}
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
=======
            <UploadField label="Kategori *" hint="Pilih kategori yang paling sesuai dengan proyek anda" error={fieldErrors.category}>
              <select name="category" value={formData.category} onChange={handleInputChange} aria-invalid={Boolean(fieldErrors.category)}>
                <option value="">Pilih kategori proyek</option>
                {categoryOptions.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </UploadField>

            <div className="project-upload-field">
              <span>Deskripsi Proyek *</span>
              <RichTextEditor value={formData.description} onChange={handleDescriptionChange} error={fieldErrors.description} />
              {fieldErrors.description ? <em className="project-upload-error">{fieldErrors.description}</em> : <small>Jelaskan fungsi, tujuan, dan cara kerja proyek anda</small>}
            </div>

            <div className="project-upload-inline-grid">
              <section className="project-upload-card project-upload-extra">
                <h3>Informasi Tambahan</h3>
                <UploadField label="Tingkat Kesulitan"><select name="difficulty" value={formData.difficulty} onChange={handleInputChange}><option value="">Pilih tingkat kesulitan</option><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></UploadField>
                <UploadField label="Estimasi Waktu"><input name="estimatedTime" type="text" value={formData.estimatedTime} onChange={handleInputChange} placeholder="Contoh: 2-3 jam" /></UploadField>
                <UploadField label="Bahasa Pemrograman"><input name="programmingLanguage" type="text" value={formData.programmingLanguage} onChange={handleInputChange} placeholder="Contoh: Arduino" /></UploadField>
              </section>

              <section className="project-upload-card project-upload-tags">
                <h3>Tag</h3>
                <div className="project-upload-tag-form"><input type="text" value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="Tambah tag" /><button type="button" onClick={addTag}>Tambah</button></div>
                <div className="project-upload-tag-list">{formData.tags.map((tag) => <button type="button" key={tag} onClick={() => removeTag(tag)}>{tag} x</button>)}</div>
                <p>Tambah tag untuk memudahkan pencarian</p>
              </section>
            </div>
          </section>

          <section className={`project-upload-list-section project-upload-form-section${activeSection === 'components' ? ' is-active' : ''}`}>
            <div className="project-upload-section-head">
              <div><h3>Alat &amp; Komponen *</h3><p>Pilih alat dan komponen elektronik dari katalog Wokwi yang digunakan dalam proyek ini</p></div>
              <button
                type="button"
                onClick={() => setIsToolPickerOpen((current) => !current)}
              >
                <PlusIcon /> {isToolPickerOpen ? 'Tutup Komponen' : 'Tambah Komponen'}
              </button>
            </div>
            {isToolPickerOpen ? (
              <div className="project-upload-node-picker-panel">
                <div className="project-upload-node-search">
                  <input
                    type="search"
                    placeholder="Cari komponen..."
                    value={toolSearch}
                    onChange={(event) => setToolSearch(event.target.value)}
                  />
                  <button
                    type="button"
                    className={selectedToolKey === MANUAL_PICKER_VALUE ? 'is-active' : ''}
                    onClick={() => {
                      setSelectedToolKey(MANUAL_PICKER_VALUE);
                      clearFieldError('tools');
                    }}
                  >
                    <PlusIcon /> Manual
                  </button>
                  <button type="button" onClick={addTool}><PlusIcon /> Tambah Komponen</button>
                </div>
                {selectedToolKey === MANUAL_PICKER_VALUE ? (
                  <div className="project-upload-manual-grid" aria-label="Tambah alat atau komponen manual">
                    <input name="category" type="text" value={manualTool.category} onChange={handleManualToolChange} placeholder="Kategori manual" />
                    <input name="name" type="text" value={manualTool.name} onChange={handleManualToolChange} placeholder="Nama alat/komponen *" />
                    <input name="specification" type="text" value={manualTool.specification} onChange={handleManualToolChange} placeholder="Keterangan/spesifikasi" />
                    <input name="value" type="text" value={manualTool.value} onChange={handleManualToolChange} placeholder="Value, contoh: 10k, D2, HIGH" />
                  </div>
                ) : null}
                <div className="project-upload-node-grid" role="listbox" aria-label="Pilih alat atau komponen">
                  {filteredToolCatalog.map((tool) => {
                    const catalogIndex = WOKWI_COMPONENT_CATALOG.indexOf(tool);
                    const isSelected = selectedToolKey === String(catalogIndex);

                    return (
                      <button
                        type="button"
                        className={`project-upload-node-card${isSelected ? ' is-selected' : ''}`}
                        key={`${tool.category}-${tool.name}`}
                        onClick={() => {
                          setSelectedToolKey(String(catalogIndex));
                          clearFieldError('tools');
                        }}
                        aria-pressed={isSelected}
                      >
                        <span className="project-upload-node-card__sprite">
                          <WokwiComponentPreview elementName={tool.wokwiElement} fallback={tool.name} />
                        </span>
                        <span>{tool.name}</span>
                        <small>{tool.category}</small>
                      </button>
                    );
                  })}
                  {filteredToolCatalog.length === 0 ? (
                    <div className="project-upload-node-card project-upload-node-card--empty">
                      <span>Komponen tidak ditemukan</span>
                      <small>Coba kata kunci lain</small>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className={`project-upload-table${fieldErrors.tools ? ' has-error' : ''}`}>
              <div className="project-upload-table__head project-upload-table__head--components"><span>Kategori</span><span>Nama Alat/Komponen</span><span>Keterangan/Spesifikasi</span><span>Value</span><span>Gambar</span><span>Aksi</span></div>
              {formData.tools.length ? formData.tools.map((tool, index) => (
                <div className="project-upload-table__head project-upload-table__head--components" key={`${tool.name}-${index}`}>
                  <span>{tool.category || '-'}</span>
                  <span>{tool.name}</span>
                  <span>{tool.specification || '-'}</span>
                  <input className="project-upload-table-input" type="text" value={tool.value || ''} onChange={(event) => updateToolValue(index, event.target.value)} placeholder="Value" />
                  <ComponentImageField item={tool} index={index} onChange={handleComponentImageChange} />
                  <UploadRowActions onEdit={() => editTool(index)} onDelete={() => deleteTool(index)} />
                </div>
              )) : (
                <div className="project-upload-empty"><BoxPlusIcon /><strong>Belum ada alat atau komponen</strong><p>Pilih item dari katalog, lalu klik tombol “Tambah Item”</p></div>
              )}
            </div>
            {fieldErrors.tools ? <em className="project-upload-error">{fieldErrors.tools}</em> : null}
          </section>

          <section className={`project-upload-list-section project-upload-form-section${activeSection === 'nodes' ? ' is-active' : ''}`}>
            <div className="project-upload-section-head">
              <div><h3>Node ArduFlow yang Digunakan *</h3><p>Pilih node dari katalog ArduFlow yang digunakan dalam proyek ini</p></div>
              <button
                type="button"
                onClick={() => setIsNodePickerOpen((current) => !current)}
              >
                <PlusIcon /> {isNodePickerOpen ? 'Tutup Node' : 'Tambah Node'}
              </button>
            </div>
            {isNodePickerOpen ? (
              <div className="project-upload-node-picker-panel">
                <div className="project-upload-node-search">
                  <input
                    type="search"
                    placeholder="Cari node..."
                    value={nodeSearch}
                    onChange={(event) => setNodeSearch(event.target.value)}
                  />
                  <button
                    type="button"
                    className={selectedNodeKey === MANUAL_PICKER_VALUE ? 'is-active' : ''}
                    onClick={() => {
                      setSelectedNodeKey(MANUAL_PICKER_VALUE);
                      clearFieldError('nodes');
                    }}
                  >
                    <PlusIcon /> Manual
                  </button>
                  <button type="button" onClick={addNode}><PlusIcon /> Tambah Node</button>
                </div>
                {selectedNodeKey === MANUAL_PICKER_VALUE ? (
                  <div className="project-upload-manual-grid" aria-label="Tambah node ArduFlow manual">
                    <input name="category" type="text" value={manualNode.category} onChange={handleManualNodeChange} placeholder="Kategori manual" />
                    <input name="name" type="text" value={manualNode.name} onChange={handleManualNodeChange} placeholder="Nama node *" />
                    <input name="description" type="text" value={manualNode.description} onChange={handleManualNodeChange} placeholder="Keterangan node" />
                    <input name="value" type="text" value={manualNode.value} onChange={handleManualNodeChange} placeholder="Value, contoh: D2, 1023, true" />
                  </div>
                ) : null}
                <div className="project-upload-node-grid" role="listbox" aria-label="Pilih node ArduFlow">
                  {filteredNodeCatalog.map((node) => {
                    const isSelected = selectedNodeKey === node.type;

                    return (
                      <button
                        type="button"
                        className={`project-upload-node-card${isSelected ? ' is-selected' : ''}`}
                        key={node.type}
                        onClick={() => {
                          setSelectedNodeKey(node.type);
                          clearFieldError('nodes');
                        }}
                        aria-pressed={isSelected}
                      >
                        <span className="project-upload-node-card__sprite">
                          <NodeSprite name={node.type} scale={0.54} maxWidth={128} maxHeight={96} title={node.name} />
                        </span>
                        <span>{node.name}</span>
                        <small>{node.category}</small>
                      </button>
                    );
                  })}
                  {filteredNodeCatalog.length === 0 ? (
                    <div className="project-upload-node-card project-upload-node-card--empty">
                      <span>Node tidak ditemukan</span>
                      <small>Coba kata kunci lain</small>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {formData.nodes.length ? (
              <div className={`project-upload-table${fieldErrors.nodes ? ' has-error' : ''}`}>
                <div className="project-upload-table__head project-upload-table__head--nodes"><span>Node</span><span>Kategori</span><span>Keterangan</span><span>Value</span><span>Gambar</span><span>Aksi</span></div>
                {formData.nodes.map((node, index) => (
                  <div className="project-upload-table__head project-upload-table__head--nodes" key={`${node.name}-${index}`}>
                    <span className="project-upload-selected-node">
                      <NodeSprite name={getProjectNodeType(node)} scale={0.34} title={node.name} />
                      <b>{node.name}</b>
                    </span>
                    <span>{node.category || '-'}</span>
                    <span>{node.description || '-'}</span>
                    <input className="project-upload-table-input" type="text" value={node.value || ''} onChange={(event) => updateNodeValue(index, event.target.value)} placeholder="Value" />
                    <ComponentImageField item={node} index={index} onChange={handleNodeImageChange} type="node" />
                    <UploadRowActions onEdit={() => editNode(index)} onDelete={() => deleteNode(index)} />
                  </div>
                ))}
              </div>
            ) : <EmptyUploadTable title="Belum ada node yang ditambahkan" description="Klik tombol “Tambah Node” untuk menambahkan" />}
            {fieldErrors.nodes ? <em className="project-upload-error">{fieldErrors.nodes}</em> : null}
          </section>

          <section className={`project-upload-list-section project-upload-form-section${activeSection === 'steps' ? ' is-active' : ''}`}>
            <div className="project-upload-section-head">
              <div><h3>Langkah-langkah Pengerjaan *</h3><p>Susun langkah secara berurutan. Deskripsi mendukung format teks dan sematan komponen/node.</p></div>
              <button type="button" onClick={() => addStep()}><PlusIcon /> Tambah Langkah</button>
            </div>
            <div className="project-upload-step-templates" aria-label="Template cepat langkah pengerjaan">
              {STEP_TEMPLATES.map((template) => (
                <button type="button" onClick={() => addStep(template)} key={template.title}>
                  <PlusIcon /> {template.title}
                </button>
              ))}
            </div>
            {formData.steps.length ? (
              <div className={`project-upload-step-list${fieldErrors.steps ? ' has-error' : ''}`}>
                {formData.steps.map((step, index) => (
                  <article className="project-upload-step-card" key={`${step.order}-${index}`}>
                    <div className="project-upload-step-number">{step.order || index + 1}</div>
                    <div className="project-upload-step-fields">
                      <label>
                        <span>Judul langkah</span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(event) => updateStep(index, 'title', event.target.value)}
                          placeholder={`Langkah ${index + 1}`}
                        />
                      </label>
                      <label>
                        <span>Deskripsi</span>
                        <StepRichTextEditor
                          value={step.description}
                          onChange={(value) => updateStep(index, 'description', value)}
                          references={stepReferenceItems}
                        />
                      </label>
                      <StepReferencePicker
                        references={stepReferenceItems}
                        selectedReferences={normalizeStepReferences(step.references)}
                        onToggle={(reference) => toggleStepReference(index, reference)}
                      />
                    </div>
                    <div className="project-upload-step-actions">
                      <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0}>Naik</button>
                      <button type="button" onClick={() => moveStep(index, 1)} disabled={index === formData.steps.length - 1}>Turun</button>
                      <button type="button" className="is-danger" onClick={() => deleteStep(index)}>Hapus</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyUploadTable title="Belum ada langkah yang ditambahkan" description="Klik tombol “Tambah Langkah” untuk menambahkan" />}
            {fieldErrors.steps ? <em className="project-upload-error">{fieldErrors.steps}</em> : null}
          </section>

          <section className={`project-upload-form-section${activeSection === 'publish' ? ' is-active' : ''}`}>
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

            <div className="project-upload-inline-grid">
              <section className="project-upload-card project-upload-visibility">
                <h3>Pengaturan Visibilitas</h3>
                <label><input type="radio" name="visibility" value="public" checked={formData.visibility === 'public'} onChange={handleInputChange} /><span><strong>Publik</strong><small>Proyek dapat dilihat oleh semua orang</small></span></label>
                <label><input type="radio" name="visibility" value="draft" checked={formData.visibility === 'draft'} onChange={handleInputChange} /><span><strong>Draft</strong><small>Simpan sebagai draft, belum dipublikasikan</small></span></label>
              </section>

              <section className="project-upload-card project-upload-preview-card">
                <h3>Preview Ringkas</h3>
                {coverPreviewUrl ? <img src={coverPreviewUrl} alt="Preview cover proyek" /> : null}
                <div className="project-upload-preview-title">
                  <strong>{formData.title.trim() || 'Judul proyek belum diisi'}</strong>
                  <span>{formData.category.trim() || 'Kategori belum dipilih'}</span>
                </div>
                <dl>
                  <div><dt>File</dt><dd>{formData.projectFiles.filter((entry) => entry.file || entry.existingFile).length}</dd></div>
                  <div><dt>Komponen</dt><dd>{formData.tools.length}</dd></div>
                  <div><dt>Node</dt><dd>{formData.nodes.length}</dd></div>
                  <div><dt>Langkah</dt><dd>{formData.steps.length}</dd></div>
                </dl>
                <ul>
                  {completionItems.map((item) => (
                    <li className={item.done ? 'is-done' : ''} key={item.label}>
                      <span aria-hidden="true" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
          </section>

          <section className={`project-upload-file-section project-upload-form-section${activeSection === 'media' ? ' is-active' : ''}`}>
            <div className="project-upload-media-grid">
              <section className="project-upload-card project-upload-cover">
                <h3>Gambar Cover Proyek *</h3>
                <label className={`project-upload-cover-box${fieldErrors.coverImage ? ' has-error' : ''}`}>
                  <input name="coverImage" type="file" accept="image/png,image/jpeg" onChange={handleFileChange} />
                  {coverPreviewUrl ? (
                    <img className="project-upload-cover-preview" src={coverPreviewUrl} alt="Preview cover proyek" />
                  ) : (
                    <ImageIcon />
                  )}
                  <span>{formData.coverImage?.name || existingCoverImageName || 'Upload gambar cover'}</span>
                  <small>{existingCoverImageName && !formData.coverImage ? 'Cover lama tetap digunakan jika tidak diganti' : 'PNG, JPG maksimal 2 MB'}</small>
                  <strong>Pilih Gambar</strong>
                </label>
                {fieldErrors.coverImage ? <em className="project-upload-error">{fieldErrors.coverImage}</em> : null}
                <UploadField label="Alt Text" hint="Pilih gambar yang mewakili proyek Anda">
                  <input name="altText" type="text" value={formData.altText} onChange={handleInputChange} placeholder="Deskripsikan proyek anda" />
                </UploadField>
              </section>

              <section className="project-upload-card project-upload-cover">
                <h3>Gambar Rangkaian</h3>
                <label className={`project-upload-cover-box${fieldErrors.circuitImage ? ' has-error' : ''}`}>
                  <input name="circuitImage" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
                  {circuitPreviewUrl ? (
                    <img className="project-upload-cover-preview" src={circuitPreviewUrl} alt="Preview gambar rangkaian" />
                  ) : (
                    <ImageIcon />
                  )}
                  <span>{formData.circuitImage?.name || existingCircuitImageName || 'Upload gambar rangkaian'}</span>
                  <small>{existingCircuitImageName && !formData.circuitImage ? 'Gambar lama tetap digunakan jika tidak diganti' : 'PNG, JPG, WEBP maksimal 2 MB'}</small>
                  <strong>Pilih Gambar</strong>
                </label>
                {fieldErrors.circuitImage ? <em className="project-upload-error">{fieldErrors.circuitImage}</em> : null}
              </section>
            </div>

            <div className="project-upload-section-head">
              <div>
                <h3>File Proyek *</h3>
                <p>Tambahkan nama file terlebih dahulu, lalu upload file yang sesuai.</p>
              </div>
              <button type="button" onClick={addProjectFileRow}><PlusIcon /> Tambah File</button>
            </div>
            <div className={`project-upload-file-list${fieldErrors.projectFile ? ' has-error' : ''}`}>
              {formData.projectFiles.map((entry, index) => {
                const fileName = getProjectFileEntryName(entry);
                const fileSize = entry.file?.size || entry.existingFile?.file_size || entry.existingFile?.size;
                const previewText = entry.preview;

                return (
                  <article className="project-upload-file-item" key={entry.id}>
                    <div className="project-upload-file-row">
                      <input
                        type="text"
                        value={entry.label}
                        onChange={(event) => updateProjectFileLabel(index, event.target.value)}
                        placeholder={DEFAULT_PROJECT_FILE_LABELS[index] || `Nama file ${index + 1}`}
                        aria-label={`Nama file proyek ${index + 1}`}
                      />
                      <label className="project-upload-file-picker">
                        <input type="file" accept={PROJECT_FILE_ACCEPT} onChange={(event) => handleProjectFileChange(index, event)} />
                        <PlusIcon />
                        <span>{fileName || 'Upload file'}</span>
                      </label>
                      <button type="button" className="project-upload-file-remove" onClick={() => removeProjectFileRow(index)}>Hapus</button>
                    </div>
                    <small className="project-upload-file-meta">
                      {fileName ? `${fileName} - ${formatFileSize(fileSize)}` : 'Format: json, flow, schema, txt, md, ino, zip | Maksimal 10 MB per file'}
                    </small>
                    {previewText ? (
                      <div className="project-upload-file-preview" aria-label={`Preview ${entry.label || fileName || `file ${index + 1}`}`}>
                        <div>
                          <strong>{entry.label || 'Preview File'}</strong>
                          <span>{fileName}</span>
                        </div>
                        <pre>{previewText}</pre>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            {fieldErrors.projectFile ? <em className="project-upload-error">{fieldErrors.projectFile}</em> : null}
            <p>Pastikan file yang diupload sudah berfungsi dengan baik</p>
          </section>
        </form>

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

<<<<<<< HEAD
=======
function isPaidProject(project) {
  const payment = project?.payment || {};
  return Boolean(payment.isPaid || project?.isPaid) && Number(payment.price || project?.price || 0) > 0;
}

function formatTransactionAmount(transaction) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: transaction?.currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(transaction?.amount || 0));
}

function getProjectDetailItems(project, fieldName) {
  const payload = projectPayload(project);
  return normalizeProjectList(project?.[fieldName] || payload?.[fieldName]);
}

function getProjectDescription(project) {
  return projectField(project, 'description', 'Belum ada deskripsi proyek.');
}

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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
<<<<<<< HEAD
=======
  const [filterBy, setFilterBy] = useState('all');
  const [selectedSalesProject, setSelectedSalesProject] = useState(null);
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [commissionRate, setCommissionRate] = useState(10);
  const [selectedPayoutProjectIds, setSelectedPayoutProjectIds] = useState([]);
  const [payoutPurpose, setPayoutPurpose] = useState('');
  const [isPayoutSubmitting, setIsPayoutSubmitting] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

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
<<<<<<< HEAD
      const ownedProjects = currentUserId
        ? rows.filter((project) => String(project.userId || project.payload?.userId || '') === String(currentUserId))
=======
      const transactionParams = {};
      if (currentUserId) transactionParams.userId = currentUserId;
      if (user.email) transactionParams.email = user.email;
      const paidProjectIds = new Set();
      const projectSales = new Map();

      if (transactionParams.userId || transactionParams.email) {
        try {
          const transactions = await fetchTransactions(transactionParams);
          transactions
            .filter((transaction) => transaction.itemType === 'project' && transaction.status === 'paid')
            .forEach((transaction) => {
              if (transaction.itemId !== null && transaction.itemId !== undefined) {
                paidProjectIds.add(String(transaction.itemId));
              }
            });
        } catch (transactionError) {
          console.error('Gagal mengambil transaksi proyek user:', transactionError);
        }
      }

      try {
        const transactions = await fetchTransactions();
        setFinanceTransactions(transactions);
        transactions
          .filter((transaction) => transaction.itemType === 'project' && transaction.status === 'paid' && transaction.itemId !== null && transaction.itemId !== undefined)
          .forEach((transaction) => {
            const projectId = String(transaction.itemId);
            const sales = projectSales.get(projectId) || [];
            sales.push(transaction);
            projectSales.set(projectId, sales);
          });
      } catch (salesError) {
        console.error('Gagal mengambil histori penjualan proyek:', salesError);
        setFinanceTransactions([]);
      }

      try {
        const financeConfig = await fetchFinanceConfig();
        setCommissionRate(Number(financeConfig?.commissionRate ?? 10));
      } catch (financeError) {
        console.error('Gagal mengambil pengaturan komisi:', financeError);
      }

      const ownedProjects = currentUserId
        ? rows.map((project) => {
            const isOwner = String(project.userId || project.payload?.userId || '') === String(currentUserId);
            const isPurchased = paidProjectIds.has(String(project.id || ''));
            const salesHistory = projectSales.get(String(project.id || '')) || [];

            return {
              ...project,
              salesCount: salesHistory.length,
              salesHistory,
              accessType: isOwner ? 'uploaded' : 'purchased',
              isOwnerProject: isOwner,
              isPurchasedProject: !isOwner && isPurchased,
            };
          }).filter((project) => project.isOwnerProject || project.isPurchasedProject)
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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
<<<<<<< HEAD
    const filtered = query
      ? projects.filter((project) => {
=======
    const scopedProjects = projects.filter((project) => {
      if (filterBy === 'uploaded') return project.accessType === 'uploaded';
      if (filterBy === 'purchased') return project.accessType === 'purchased';
      if (filterBy === 'selling') return project.accessType === 'uploaded' && isPaidProject(project);
      return true;
    });

    const filtered = query
      ? scopedProjects.filter((project) => {
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
          const haystack = [
            project.title,
            project.category,
            project.description,
            ...(Array.isArray(project.tags) ? project.tags : []),
          ].join(' ').toLowerCase();

          return haystack.includes(query);
        })
<<<<<<< HEAD
      : [...projects];
=======
      : [...scopedProjects];
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

    return filtered.sort((first, second) => {
      if (sortBy === 'Nama') {
        return String(first.title || '').localeCompare(String(second.title || ''), 'id-ID');
      }

      const firstTime = new Date(first.updatedAt || first.createdAt || 0).getTime() || 0;
      const secondTime = new Date(second.updatedAt || second.createdAt || 0).getTime() || 0;
      return secondTime - firstTime;
    });
<<<<<<< HEAD
  }, [projects, searchQuery, sortBy]);
=======
  }, [filterBy, projects, searchQuery, sortBy]);

  const salesRows = useMemo(() => projects
    .filter((project) => project.isOwnerProject && isPaidProject(project))
    .map((project) => {
      const gross = (project.salesHistory || []).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      const commission = gross * (commissionRate / 100);
      const paidOut = financeTransactions
        .filter((transaction) => transaction.itemType === 'project_payout' && String(transaction.itemId) === String(project.id) && ['proof_sent', 'done'].includes(transaction.status))
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      return {
        project,
        gross,
        commission,
        paidOut,
        net: gross - commission,
        available: Math.max(0, gross - commission - paidOut),
        sold: project.salesHistory?.length || 0,
      };
    }), [commissionRate, financeTransactions, projects]);

  const payoutTransactions = useMemo(() => financeTransactions.filter((transaction) => (
    transaction.itemType === 'project_payout' && String(transaction.userId || '') === String(currentUserId || '')
  )), [currentUserId, financeTransactions]);

  const selectableSalesRows = useMemo(() => salesRows.filter((row) => row.available > 0), [salesRows]);
  const selectedPayoutRows = useMemo(() => salesRows.filter((row) => (
    selectedPayoutProjectIds.includes(String(row.project.id)) && row.available > 0
  )), [salesRows, selectedPayoutProjectIds]);
  const selectedPayoutAmount = selectedPayoutRows.reduce((sum, row) => sum + row.available, 0);

  const payoutTotal = useMemo(() => payoutTransactions
    .filter((transaction) => ['proof_sent', 'done'].includes(transaction.status))
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0), [payoutTransactions]);

  const grossSales = salesRows.reduce((sum, row) => sum + row.gross, 0);
  const totalCommission = salesRows.reduce((sum, row) => sum + row.commission, 0);
  const availableBalance = Math.max(0, grossSales - totalCommission - payoutTotal);

  async function handlePayoutSubmit(event) {
    event.preventDefault();
    if (!selectedPayoutRows.length) {
      setPayoutMessage('Pilih minimal satu proyek yang akan dicairkan melalui checkbox tabel.');
      return;
    }
    if (!payoutPurpose.trim()) {
      setPayoutMessage('Tujuan pencairan dana wajib diisi.');
      return;
    }
    setIsPayoutSubmitting(true);
    setPayoutMessage('Mengajukan pencairan dana...');
    try {
      await Promise.all(selectedPayoutRows.map((selected) => createTransaction({
          userId: currentUserId,
          userName: fullName,
          email: user.email || '',
          itemType: 'project_payout',
          itemId: selected.project.id,
          itemTitle: `Pencairan: ${selected.project.title || 'Proyek'}`,
          amount: selected.available,
          currency: 'IDR',
          status: 'payout_requested',
          notes: payoutPurpose.trim(),
          payload: {
            purpose: payoutPurpose.trim(),
            projectTitle: selected.project.title || '',
            grossAmount: selected.gross,
            commissionRate,
            commissionAmount: selected.commission,
          },
        })));
      setPayoutPurpose('');
      setSelectedPayoutProjectIds([]);
      setPayoutMessage(`Pengajuan pencairan ${selectedPayoutRows.length} proyek berhasil dikirim ke admin.`);
      await loadProjects();
    } catch (error) {
      setPayoutMessage(error.message || 'Pengajuan pencairan gagal dikirim.');
    } finally {
      setIsPayoutSubmitting(false);
    }
  }

  async function handleCompletePayout(transaction) {
    try {
      const updated = await completeProjectPayout(transaction.id);
      setFinanceTransactions((current) => current.map((item) => item.id === transaction.id ? updated : item));
      setPayoutMessage('Pencairan ditandai selesai.');
    } catch (error) {
      setPayoutMessage(error.message || 'Status pencairan gagal diperbarui.');
    }
  }

  const editingInitialProject = useMemo(() => {
    if (projectFormMode !== 'edit' || !editProjectId) {
      return null;
    }

    return projects.find((project) => String(project.id) === String(editProjectId)) || null;
  }, [editProjectId, projectFormMode, projects]);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

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
              <DashboardUserSidebarIcon name={item.icon} />
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
        <UserDashboardTopbar fullName={fullName} profileImage={profileImage} />

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
<<<<<<< HEAD
=======
              initialProject={editingInitialProject}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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
                  <label className="user-project-filter">
                    <span className="sr-only">Filter proyek</span>
                    <FilterIcon />
                    <select value={filterBy} onChange={(event) => setFilterBy(event.target.value)} aria-label="Filter proyek">
                      {PROJECT_FILTER_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
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
<<<<<<< HEAD
                        <time>{formatProjectDate(project)}</time>
                        <strong>{formatProjectPrice(project)}</strong>
=======
                        <div className="user-project-card__meta">
                          <span>{project.accessType === 'purchased' ? 'Dibeli' : 'Di-upload sendiri'}</span>
                          {isPaidProject(project) ? <span>Dijual</span> : <span>Gratis</span>}
                        </div>
                        <time>{formatProjectDate(project)}</time>
                        <strong>{formatProjectPrice(project)}</strong>
                        <small className="user-project-card__sold">{Number(project.salesCount || 0).toLocaleString('id-ID')} terjual</small>
                        <button
                          className="user-project-card__action"
                          type="button"
                          onClick={() => setSelectedDetailProject(project)}
                        >
                          Detail Proyek
                        </button>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
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

          {!isUploadFormOpen ? (
            <section className="user-project-sales-section" aria-labelledby="sales-history-title">
              <div className="user-project-sales-section__header">
                <div>
                  <span className="user-project-sales-section__eyebrow">KEUANGAN PROYEK</span>
                  <h2 id="sales-history-title">Histori Penjualan</h2>
                  <p>Kelola penjualan proyek, pendapatan bersih, dan pengajuan pencairan dana.</p>
                </div>
                <div className="user-project-sales-metrics">
                  <article><small>Pendapatan kotor</small><strong>{formatTransactionAmount({ amount: grossSales })}</strong></article>
                  <article><small>Komisi ArduFlow ({commissionRate}%)</small><strong>{formatTransactionAmount({ amount: totalCommission })}</strong></article>
                  <article><small>Sudah dicairkan</small><strong>{formatTransactionAmount({ amount: payoutTotal })}</strong></article>
                  <article><small>Saldo tersedia</small><strong>{formatTransactionAmount({ amount: availableBalance })}</strong></article>
                </div>
              </div>

              <div className="user-project-sales-table user-project-sales-table--finance" role="table" aria-label="Histori penjualan proyek">
                <div className="user-project-sales-table__head" role="row">
                  <span className="user-project-sales-table__select"><input type="checkbox" aria-label="Pilih semua proyek yang bisa dicairkan" checked={selectableSalesRows.length > 0 && selectedPayoutRows.length === selectableSalesRows.length} onChange={(event) => setSelectedPayoutProjectIds(event.target.checked ? selectableSalesRows.map((row) => String(row.project.id)) : [])} /></span>
                  <span>Proyek</span><span>Harga</span><span>Terjual</span><span>Belum cair</span><span>Sudah cair</span><span>Pendapatan bersih</span><span>Detail</span>
                </div>
                {salesRows.length ? salesRows.map((row) => (
                  <div className="user-project-sales-table__row" role="row" key={row.project.id}>
                    <span className="user-project-sales-table__select"><input type="checkbox" aria-label={`Pilih pencairan ${row.project.title || 'proyek'}`} checked={selectedPayoutProjectIds.includes(String(row.project.id))} disabled={row.available <= 0} onChange={(event) => setSelectedPayoutProjectIds((current) => event.target.checked ? [...new Set([...current, String(row.project.id)])] : current.filter((id) => id !== String(row.project.id)))} /></span>
                    <span>{row.project.title || 'Tanpa judul'}</span>
                    <span>{formatProjectPrice(row.project)}</span>
                    <span>{row.sold.toLocaleString('id-ID')}</span>
                    <span>{formatTransactionAmount({ amount: row.available })}</span>
                    <span>{formatTransactionAmount({ amount: row.paidOut })}</span>
                    <span>{formatTransactionAmount({ amount: row.net })}</span>
                    <span><button type="button" onClick={() => setSelectedSalesProject(row.project)}>Detail pembeli</button></span>
                  </div>
                )) : (
                  <p className="user-project-sales-empty">Belum ada penjualan proyek yang berhasil.</p>
                )}
              </div>

              <div className="user-project-payout-area">
                <div>
                  <h3>Ajukan pencairan dana</h3>
                  <p>Pilih proyek melalui checkbox tabel. Dana akan diproses admin setelah pengajuan diterima, dan komisi ArduFlow sudah dikurangi dari saldo bersih.</p>
                </div>
                <form className="user-project-payout-form" onSubmit={handlePayoutSubmit}>
                  <div className="user-project-payout-selection"><span>{selectedPayoutRows.length} proyek dipilih</span><strong>{formatTransactionAmount({ amount: selectedPayoutAmount })}</strong></div>
                  <label>Tujuan pencairan dana<textarea value={payoutPurpose} onChange={(event) => setPayoutPurpose(event.target.value)} placeholder="Contoh: pencairan ke rekening BCA atas nama..." rows="3" /></label>
                  <button type="submit" disabled={isPayoutSubmitting || selectedPayoutRows.length === 0}>{isPayoutSubmitting ? 'Mengirim...' : 'Ajukan pencairan'}</button>
                </form>
              </div>

              {payoutTransactions.length ? (
                <div className="user-project-payout-history">
                  <h3>Riwayat pencairan</h3>
                  {payoutTransactions.map((transaction) => (
                    <div key={transaction.id}><span>{transaction.itemTitle}</span><strong>{formatTransactionAmount(transaction)}</strong><b className={`is-${transaction.status}`}>{transaction.status === 'proof_sent' ? 'Bukti dikirim' : transaction.status === 'done' ? 'Selesai' : 'Menunggu admin'}</b>{transaction.proofFile?.url ? <a href={transaction.proofFile.url} target="_blank" rel="noreferrer">Lihat bukti</a> : null}{transaction.status === 'proof_sent' ? <button type="button" onClick={() => handleCompletePayout(transaction)}>Konfirmasi pencairan</button> : null}</div>
                  ))}
                </div>
              ) : null}
              {payoutMessage ? <p className="user-project-payout-message" role="status">{payoutMessage}</p> : null}
            </section>
          ) : null}

          {selectedSalesProject ? (
            <section className="user-project-sales-modal" role="dialog" aria-modal="true" aria-labelledby="user-project-sales-title">
              <button
                className="user-project-sales-modal__backdrop"
                type="button"
                aria-label="Tutup histori penjualan"
                onClick={() => setSelectedSalesProject(null)}
              />
              <article className="user-project-sales-panel">
                <header>
                  <div>
                    <span>Histori Penjualan Proyek</span>
                    <h2 id="user-project-sales-title">{selectedSalesProject.title || 'Tanpa judul'}</h2>
                    <p>{Number(selectedSalesProject.salesCount || 0).toLocaleString('id-ID')} transaksi berhasil</p>
                  </div>
                  <button type="button" onClick={() => setSelectedSalesProject(null)} aria-label="Tutup">x</button>
                </header>
                {selectedSalesProject.salesHistory?.length ? (
                  <div className="user-project-sales-table" role="table" aria-label="Histori transaksi penjualan proyek">
                    <div className="user-project-sales-table__head" role="row">
                      <span>Pembeli</span>
                      <span>Invoice</span>
                      <span>Tanggal</span>
                      <span>Nominal</span>
                      <span>Status</span>
                    </div>
                    {selectedSalesProject.salesHistory.map((transaction) => (
                      <div className="user-project-sales-table__row" role="row" key={transaction.id || transaction.invoiceNumber}>
                        <span>{transaction.userName || transaction.email || '-'}</span>
                        <span>{transaction.invoiceNumber || '-'}</span>
                        <time>{formatProjectDate({ updatedAt: transaction.paidAt || transaction.createdAt })}</time>
                        <span>{formatTransactionAmount(transaction)}</span>
                        <span><b>Paid</b></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="user-project-sales-empty">Belum ada pembelian untuk proyek ini.</p>
                )}
              </article>
            </section>
          ) : null}

          {selectedDetailProject ? (() => {
            const coverUrl = resolveProjectCoverUrl(selectedDetailProject) || projectImage;
            const tools = getProjectDetailItems(selectedDetailProject, 'tools');
            const nodes = getProjectDetailItems(selectedDetailProject, 'nodes');
            const steps = getProjectDetailItems(selectedDetailProject, 'steps');
            const projectFiles = normalizeProjectFiles(selectedDetailProject)
              .map((entry) => ({
                label: entry.label,
                name: getProjectFileEntryName(entry),
                url: getProjectFileUrl(entry.existingFile),
              }))
              .filter((entry) => entry.name || entry.url);
            const description = getProjectDescription(selectedDetailProject);

            return (
              <section className="user-project-detail-modal" role="dialog" aria-modal="true" aria-labelledby="user-project-detail-title">
                <button
                  className="user-project-detail-modal__backdrop"
                  type="button"
                  aria-label="Tutup detail proyek"
                  onClick={() => setSelectedDetailProject(null)}
                />
                <article className="user-project-detail-panel">
                  <header>
                    <div>
                      <span>{selectedDetailProject.accessType === 'purchased' ? 'Proyek Dibeli' : 'Proyek Upload Sendiri'}</span>
                      <h2 id="user-project-detail-title">{selectedDetailProject.title || 'Tanpa judul'}</h2>
                      <p>{selectedDetailProject.category || 'Tanpa kategori'}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedDetailProject(null)} aria-label="Tutup">x</button>
                  </header>

                  <div className="user-project-detail-body">
                    <aside className="user-project-detail-media">
                      <img src={coverUrl} alt={selectedDetailProject.coverImage?.altText || selectedDetailProject.title || 'Cover proyek'} />
                      <div className="user-project-detail-summary">
                        <article><small>Harga</small><strong>{formatProjectPrice(selectedDetailProject)}</strong></article>
                        <article><small>Terjual</small><strong>{Number(selectedDetailProject.salesCount || 0).toLocaleString('id-ID')}</strong></article>
                        <article><small>Akses</small><strong>{selectedDetailProject.accessType === 'purchased' ? 'Dibeli' : 'Pemilik'}</strong></article>
                        <article><small>Status</small><strong>{isPaidProject(selectedDetailProject) ? 'Dijual' : 'Gratis'}</strong></article>
                      </div>
                    </aside>

                    <div className="user-project-detail-main">
                      <section className="user-project-detail-section user-project-detail-section--description">
                        <h3>Deskripsi</h3>
                        <p>{stripHtml(description) || 'Belum ada deskripsi proyek.'}</p>
                      </section>

                      <section className="user-project-detail-grid">
                        <div className="user-project-detail-section">
                          <h3>Komponen</h3>
                          {tools.length ? (
                            <ul>
                              {tools.map((tool, index) => (
                                <li key={`${tool?.name || tool}-${index}`}>{tool?.name || tool}{tool?.value ? ` - ${tool.value}` : ''}</li>
                              ))}
                            </ul>
                          ) : <p>Belum ada komponen.</p>}
                        </div>

                        <div className="user-project-detail-section">
                          <h3>Node</h3>
                          {nodes.length ? (
                            <ul>
                              {nodes.map((node, index) => (
                                <li key={`${node?.name || node}-${index}`}>{node?.name || node}{node?.value ? ` - ${node.value}` : ''}</li>
                              ))}
                            </ul>
                          ) : <p>Belum ada node.</p>}
                        </div>
                      </section>

                      <section className="user-project-detail-section">
                        <h3>Langkah Pengerjaan</h3>
                        {steps.length ? (
                          <ol>
                            {steps.map((step, index) => (
                              <li key={`${step?.title || 'step'}-${index}`}>
                                <strong>{step?.title || `Langkah ${index + 1}`}</strong>
                                <span>{stripHtml(step?.description || '') || '-'}</span>
                              </li>
                            ))}
                          </ol>
                        ) : <p>Belum ada langkah pengerjaan.</p>}
                      </section>

                      <section className="user-project-detail-section">
                        <h3>File Proyek</h3>
                        {projectFiles.length ? (
                          <div className="user-project-detail-files">
                            {projectFiles.map((file, index) => (
                              file.url ? (
                                <a href={file.url} target="_blank" rel="noreferrer" key={`${file.name}-${index}`}>
                                  {file.label || file.name}
                                </a>
                              ) : (
                                <span key={`${file.name}-${index}`}>{file.label || file.name}</span>
                              )
                            ))}
                          </div>
                        ) : <p>Belum ada file proyek.</p>}
                      </section>

                      <footer>
                        <a href={`/project/detail?id=${encodeURIComponent(selectedDetailProject.id)}`}>Buka Halaman Proyek</a>
                        {selectedDetailProject.isOwnerProject ? (
                          <a href={`/proyek-saya?mode=edit&projectId=${encodeURIComponent(selectedDetailProject.id)}`}>Edit Proyek</a>
                        ) : null}
                      </footer>
                    </div>
                  </div>
                </article>
              </section>
            );
          })() : null}
        </main>
      </section>
    </div>
  );
}