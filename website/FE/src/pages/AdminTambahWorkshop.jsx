import { useMemo, useRef, useState } from 'react';

const levels = ['Pemula', 'Menengah', 'Lanjutan'];
const categories = ['Arduino', 'IoT', 'Visual Programming', 'Sekolah'];
const timezones = ['WIB (GMT+7)', 'WITA (GMT+8)', 'WIT (GMT+9)'];
const workshopTypes = ['Online', 'Offline', 'Hybrid'];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function SectionTitle({ number, title }) {
  return (
    <div className="admin-section-title">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function Field({ label, required, counter, children, className = '' }) {
  return (
    <label className={`admin-field ${className}`}>
      <span className="admin-field-head">
        <span>
          {label}
          {required && <b> *</b>}
        </span>
        {counter && <em>{counter}</em>}
      </span>
      {children}
    </label>
  );
}

function SidebarCard({ title, children, className = '' }) {
  return (
    <aside className={`admin-side-card ${className}`}>
      <h3>{title}</h3>
      {children}
    </aside>
  );
}

function UploadBox({ title, note, buttonLabel, compact = false }) {
  return (
    <div className={`admin-upload-box ${compact ? 'compact' : ''}`}>
      <span className="admin-upload-icon" aria-hidden="true" />
      <strong>{title}</strong>
      <small>{note}</small>
      {buttonLabel && (
        <button className="admin-muted-button" type="button">
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

export function AdminTambahWorkshop() {
  const editorRef = useRef(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [workshopDate, setWorkshopDate] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isHomepageVisible, setHomepageVisible] = useState(false);
  const [type, setType] = useState('Online');

  const generatedSlug = useMemo(() => slugify(title), [title]);

  function handleTitleChange(event) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    if (!slug || slug === generatedSlug) {
      setSlug(slugify(nextTitle));
    }
  }

  function restoreEditorSelection(start, end) {
    requestAnimationFrame(() => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      editorRef.current.setSelectionRange(start, end);
    });
  }

  function replaceEditorSelection(nextText, selectionStart, selectionEnd) {
    const input = editorRef.current;
    const start = input?.selectionStart ?? editorContent.length;
    const end = input?.selectionEnd ?? editorContent.length;
    const nextValue = `${editorContent.slice(0, start)}${nextText}${editorContent.slice(end)}`;

    setEditorContent(nextValue);
    restoreEditorSelection(start + selectionStart, start + selectionEnd);
  }

  function wrapEditorSelection(prefix, suffix, fallback) {
    const input = editorRef.current;
    const start = input?.selectionStart ?? editorContent.length;
    const end = input?.selectionEnd ?? editorContent.length;
    const selectedText = editorContent.slice(start, end) || fallback;
    const nextText = `${prefix}${selectedText}${suffix}`;

    replaceEditorSelection(
      nextText,
      prefix.length,
      prefix.length + selectedText.length,
    );
  }

  function transformSelectedLines(transformLine) {
    const input = editorRef.current;
    const selectionStart = input?.selectionStart ?? editorContent.length;
    const selectionEnd = input?.selectionEnd ?? editorContent.length;
    const lineStart = editorContent.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
    const nextBreak = editorContent.indexOf('\n', selectionEnd);
    const lineEnd = nextBreak === -1 ? editorContent.length : nextBreak;
    const block = editorContent.slice(lineStart, lineEnd) || '';
    const nextBlock = block.split('\n').map(transformLine).join('\n');
    const nextValue = `${editorContent.slice(0, lineStart)}${nextBlock}${editorContent.slice(lineEnd)}`;

    setEditorContent(nextValue);
    restoreEditorSelection(lineStart, lineStart + nextBlock.length);
  }

  function stripLinePrefix(line) {
    return line.replace(/^(\s*)(#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+)/, '$1');
  }

  function applyEditorFormat(format) {
    if (format === 'Heading') {
      transformSelectedLines((line) => `${line.match(/^\s*/)?.[0] ?? ''}## ${stripLinePrefix(line).trimStart()}`);
      return;
    }

    if (format === 'Quote') {
      transformSelectedLines((line) => `${line.match(/^\s*/)?.[0] ?? ''}> ${stripLinePrefix(line).trimStart()}`);
      return;
    }

    transformSelectedLines((line) => stripLinePrefix(line));
  }

  function openDatePicker(event) {
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Some browsers only allow opening the picker from direct pointer actions.
    }
  }

  return (
    <main className="admin-workshop-page">
      <header className="admin-workshop-header">
        <h1>Tambah Workshop</h1>
        <p>Buat workshop baru yang akan ditampilkan di halaman daftar dan detail workshop.</p>
      </header>

      <form className="admin-workshop-layout">
        <div className="admin-workshop-form">
          <section className="admin-form-section">
            <SectionTitle number="1" title="Informasi Dasar" />
            <div className="admin-grid two">
              <Field label="Judul Workshop" required>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Masukkan judul workshop"
                />
              </Field>
              <Field label="Slug (URL)" required>
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder="judul-workshop"
                />
              </Field>
            </div>
            <Field label="Deskripsi Singkat" required counter={`${summary.length}/150`}>
              <input
                type="text"
                maxLength={150}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Tuliskan deskripsi singkat workshop (akan tampil di kartu daftar workshop)..."
              />
            </Field>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="2" title="Detail Workshop" />
            <div className="admin-grid three">
              <Field label="Tingkat / Level" required>
                <select defaultValue="">
                  <option value="" disabled>
                    Pilih tingkat
                  </option>
                  {levels.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </Field>
              <Field label="Durasi" required>
                <input type="text" placeholder="Contoh: 3 Jam" />
              </Field>
              <Field label="Platform / Tempat" required>
                <input type="text" placeholder="Contoh: Arduflow IDE" />
              </Field>
              <Field label="Kategori" required>
                <select defaultValue="">
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipe Workshop" required className="admin-type-field">
                <div className="admin-radio-group">
                  {workshopTypes.map((item) => (
                    <label key={item}>
                      <input
                        type="radio"
                        name="workshop-type"
                        checked={type === item}
                        onChange={() => setType(item)}
                      />
                      <span />
                      {item}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="3" title="Jadwal & Lokasi" />
            <div className="admin-grid three">
              <Field label="Tanggal" required>
                <span
                  className={`admin-icon-field calendar ${workshopDate ? 'has-value' : ''}`}
                  data-placeholder="Pilih tanggal"
                >
                  <input
                    type="date"
                    value={workshopDate}
                    onChange={(event) => setWorkshopDate(event.target.value)}
                    onClick={openDatePicker}
                    onFocus={openDatePicker}
                    aria-label="Pilih tanggal workshop"
                  />
                </span>
              </Field>
              <Field label="Waktu" required>
                <span className="admin-icon-field clock">
                  <input type="text" placeholder="Contoh: 09.00 - 12.00" />
                </span>
              </Field>
              <Field label="Zona Waktu">
                <select defaultValue="WIB (GMT+7)">
                  {timezones.map((timezone) => (
                    <option key={timezone}>{timezone}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lokasi / Tempat" required className="wide">
                <input
                  type="text"
                  placeholder="Contoh: Smart Home System, Perum Permata Regency Blok. 32 atau Online (Zoom/Meet)"
                />
              </Field>
            </div>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="4" title="Harga & Fasilitas" />
            <Field label="Harga" required className="admin-price-field">
              <span>
                <input type="text" inputMode="numeric" placeholder="Contoh: 50000" />
                <strong>IDR</strong>
              </span>
            </Field>
            <div className="admin-grid two">
              <Field label="Fasilitas / Termasuk">
                <textarea placeholder="Contoh: Modul, Sertifikat, E-certificate, Akses Materi..." />
              </Field>
              <Field label="Yang Harus Dibawa (Opsional)">
                <textarea placeholder="Contoh: Laptop, Arduino Uno, Kabel USB..." />
              </Field>
            </div>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="5" title="Konten Lengkap" />
            <Field label="Tentang Workshop" required>
                <div className="admin-editor">
                  <div className="admin-editor-toolbar" aria-label="Toolbar editor">
                  <select
                    defaultValue="Normal"
                    aria-label="Format teks"
                    onChange={(event) => {
                      applyEditorFormat(event.target.value);
                      event.currentTarget.value = 'Normal';
                    }}
                  >
                    <option>Normal</option>
                    <option>Heading</option>
                    <option>Quote</option>
                  </select>
                  <button type="button" aria-label="Bold" onClick={() => wrapEditorSelection('**', '**', 'teks tebal')}>
                    B
                  </button>
                  <button type="button" aria-label="Italic" onClick={() => wrapEditorSelection('*', '*', 'teks miring')}>
                    I
                  </button>
                  <button type="button" aria-label="Underline" onClick={() => wrapEditorSelection('<u>', '</u>', 'teks garis bawah')}>
                    U
                  </button>
                  <i />
                  <button
                    type="button"
                    aria-label="Daftar bullet"
                    onClick={() => transformSelectedLines((line) => `${line.match(/^\s*/)?.[0] ?? ''}- ${stripLinePrefix(line).trimStart() || 'Item daftar'}`)}
                  >
                    =
                  </button>
                  <button
                    type="button"
                    aria-label="Daftar nomor"
                    onClick={() => {
                      let number = 0;
                      transformSelectedLines((line) => {
                        number += 1;
                        return `${line.match(/^\s*/)?.[0] ?? ''}${number}. ${stripLinePrefix(line).trimStart() || 'Item daftar'}`;
                      });
                    }}
                  >
                    #
                  </button>
                  <i />
                  <button type="button" aria-label="Tautan" onClick={() => wrapEditorSelection('[', '](https://)', 'teks tautan')}>
                    @
                  </button>
                  <button type="button" aria-label="Gambar" onClick={() => replaceEditorSelection('![Alt gambar](url-gambar)', 2, 12)}>
                    []
                  </button>
                  <button type="button" aria-label="Kode" onClick={() => wrapEditorSelection('`', '`', 'kode')}>
                    &lt;&gt;
                  </button>
                </div>
                <textarea
                  ref={editorRef}
                  value={editorContent}
                  onChange={(event) => setEditorContent(event.target.value)}
                  placeholder="Jelaskan detail tentang workshop, tujuan, materi yang akan dipelajari, dan hal lainnya..."
                />
              </div>
            </Field>
          </section>
        </div>

        <div className="admin-workshop-sidebar">
          <SidebarCard title="Terbitkan">
            <Field label="Status">
              <select defaultValue="Draft">
                <option>Draft</option>
                <option>Terjadwal</option>
                <option>Terbit</option>
                <option>Selesai</option>
              </select>
            </Field>
            <Field label="Visibilitas">
              <select defaultValue="Publik">
                <option>Publik</option>
                <option>Privat</option>
              </select>
            </Field>
            <label className="admin-switch-row">
              <span>Tampilkan di Beranda</span>
              <input
                type="checkbox"
                checked={isHomepageVisible}
                onChange={(event) => setHomepageVisible(event.target.checked)}
              />
              <i />
            </label>
            <div className="admin-side-actions">
              <button className="admin-muted-button" type="button">
                Simpan Draft
              </button>
              <button className="admin-primary-button" type="button">
                Terbitkan
              </button>
            </div>
          </SidebarCard>

          <SidebarCard title="Media Workshop">
            <Field label="Gambar Sampul" required>
              <UploadBox
                title="Upload gambar sampul"
                note="Rekomendasi: 1280x720px (16:9)"
                buttonLabel="Pilih Gambar"
              />
            </Field>
            <Field label="Galeri (Opsional)">
              <button className="admin-outline-button full" type="button">
                <span>+</span> Tambah gambar galeri
              </button>
            </Field>
          </SidebarCard>

          <SidebarCard title="Lampiran">
            <Field label="Modul / File (PDF)">
              <UploadBox title="Upload file" note="Maks. 10MB (PDF)" buttonLabel="Pilih File" compact />
            </Field>
          </SidebarCard>

          <SidebarCard title="SEO (Opsional)">
            <Field label="Meta Title">
              <input type="text" placeholder="Masukkan meta title..." />
            </Field>
            <Field label="Meta Description" counter={`${metaDescription.length}/160`}>
              <textarea
                maxLength={160}
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                placeholder="Masukkan meta description..."
              />
            </Field>
          </SidebarCard>
        </div>

        <div className="admin-bottom-bar">
          <button className="admin-text-button" type="button">
            Batal
          </button>
          <button className="admin-muted-button save" type="button">
            <span className="admin-action-icon draft-icon" aria-hidden="true" /> Simpan Draft
          </button>
          <button className="admin-primary-button publish" type="button">
            <span className="admin-action-icon send-icon" aria-hidden="true" /> Terbitkan
          </button>
        </div>
      </form>
    </main>
  );
}
