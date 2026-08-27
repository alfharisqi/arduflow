import { useEffect, useMemo, useState } from 'react';
import { TinyMCEEditor } from '../../components/TinyMCEEditor.jsx';
import {
  fetchArticle,
  saveArticle,
} from '../../services/articleApi.js';
import {
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';
import '../../styles/admin-article.css';

function slugifyClient(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const initialForm = {
  title: '',
  slug: '',
  category: '',
  author: 'Admin ArduFlow',
  excerpt: '',
  content: '',
  tags: '',
  status: 'draft',
  featured: false,
};

export function AdminArticleForm() {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  const articleId = params.get('id');
  const isEdit = Boolean(articleId);

  const [form, setForm] = useState(initialForm);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [removeCover, setRemoveCover] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview('');
      return undefined;
    }

    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!isEdit) return;

    let active = true;

    const loadArticle = async () => {
      try {
        setIsLoading(true);
        setFormError('');

        const article = await fetchArticle(articleId);

        if (!active) return;

        setForm({
          title: article.title,
          slug: article.slug,
          category: article.category,
          author: article.author,
          excerpt: article.excerpt,
          content: article.content,
          tags: article.tags.join(', '),
          status: article.status,
          featured: article.featured,
        });

        setExistingCoverUrl(article.coverImageUrl || '');
      } catch (error) {
        if (!active) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Artikel gagal dimuat.';

        setFormError(message);
        await showErrorAlert('Gagal Memuat Artikel', message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadArticle();

    return () => {
      active = false;
    };
  }, [articleId, isEdit]);

  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleTitleChange = (value) => {
    setForm((previous) => {
      const shouldUpdateSlug =
        !previous.slug ||
        previous.slug === slugifyClient(previous.title);

      return {
        ...previous,
        title: value,
        slug: shouldUpdateSlug
          ? slugifyClient(value)
          : previous.slug,
      };
    });
  };

  const validate = () => {
    if (form.title.trim().length < 3) {
      return 'Judul artikel minimal 3 karakter.';
    }

    if (!form.slug.trim()) {
      return 'Slug artikel wajib diisi.';
    }

    if (!form.category.trim()) {
      return 'Kategori artikel wajib diisi.';
    }

    if (!form.content.trim()) {
      return 'Isi artikel wajib diisi.';
    }

    return '';
  };

  const handleSubmit = async (status) => {
    const validationMessage = validate();

    if (validationMessage) {
      setFormError(validationMessage);
      await showErrorAlert('Form Belum Lengkap', validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');

      const result = await saveArticle(
        {
          ...form,
          slug: slugifyClient(form.slug),
          status,
          tags: form.tags,
          removeCover,
        },
        {
          id: isEdit ? articleId : null,
          coverFile,
        }
      );

      await showSuccessAlert(
        'Berhasil',
        result.message ||
          (status === 'published'
            ? 'Artikel berhasil dipublikasikan.'
            : 'Draft artikel berhasil disimpan.')
      );

      window.location.href = '/admin/artikel';
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Artikel gagal disimpan.';

      setFormError(message);
      await showErrorAlert('Gagal Menyimpan', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="admin-article-simple-state">
        Memuat data artikel...
      </main>
    );
  }

  const previewUrl = removeCover
    ? ''
    : coverPreview || existingCoverUrl;

  return (
    <main className="admin-dashboard-page admin-article-page admin-article-form-page">
      <section className="admin-dashboard-main">
        <header className="admin-article-topbar">
          <div>
            <h1>{isEdit ? 'Edit Artikel' : 'Tambah Artikel'}</h1>
            <p>
              Admin <span>/</span> Artikel <span>/</span>{' '}
              {isEdit ? 'Edit' : 'Tambah'}
            </p>
          </div>

          <a href="/admin/artikel">← Kembali</a>
        </header>

        <div className="admin-article-form-layout">
          <section className="admin-article-form-card">
            {formError && (
              <div className="admin-article-alert">{formError}</div>
            )}

            <div className="admin-article-grid-two">
              <label>
                <span>Judul Artikel *</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    handleTitleChange(event.target.value)
                  }
                  placeholder="Contoh: Mengenal Internet of Things"
                />
              </label>

              <label>
                <span>URL Slug *</span>
                <div className="admin-article-slug-field">
                  <span>/artikel/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) =>
                      updateField(
                        'slug',
                        slugifyClient(event.target.value)
                      )
                    }
                    placeholder="mengenal-internet-of-things"
                  />
                </div>
                <small>URL artikel akan menjadi /artikel/{form.slug || 'slug-artikel'}</small>
              </label>

              <label>
                <span>Kategori *</span>
                <input
                  type="text"
                  list="article-category-list"
                  value={form.category}
                  onChange={(event) =>
                    updateField('category', event.target.value)
                  }
                  placeholder="IoT"
                />

                <datalist id="article-category-list">
                  <option value="IoT" />
                  <option value="Arduino" />
                  <option value="ESP32" />
                  <option value="Tutorial" />
                  <option value="Project" />
                  <option value="Berita" />
                  <option value="Edukasi" />
                </datalist>
              </label>

              <label>
                <span>Author</span>
                <input
                  type="text"
                  value={form.author}
                  onChange={(event) =>
                    updateField('author', event.target.value)
                  }
                />
              </label>
            </div>

            <label>
              <span>Ringkasan / Excerpt</span>
              <textarea
                rows={4}
                value={form.excerpt}
                onChange={(event) =>
                  updateField('excerpt', event.target.value)
                }
                placeholder="Ringkasan singkat artikel untuk card..."
              />
            </label>

            <label>
              <span>Isi Artikel *</span>
              <div className="admin-article-editor">
                <TinyMCEEditor
                  value={form.content}
                  onChange={(html) => updateField('content', html)}
                  height={520}
                  ariaLabel="Isi artikel"
                />
              </div>
            </label>

            <label>
              <span>Tags</span>
              <input
                type="text"
                value={form.tags}
                onChange={(event) =>
                  updateField('tags', event.target.value)
                }
                placeholder="iot, arduino, esp32, pemula"
              />
              <small>Pisahkan setiap tag dengan koma.</small>
            </label>
          </section>

          <aside className="admin-article-side">
            <section className="admin-article-side-card">
              <h2>Cover Artikel</h2>

              <div className="admin-article-cover-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview cover artikel" />
                ) : (
                  <span>Belum ada cover</span>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setCoverFile(file);
                  if (file) setRemoveCover(false);
                }}
              />

              {(existingCoverUrl || coverFile) && !removeCover && (
                <button
                  type="button"
                  className="admin-article-secondary"
                  onClick={() => {
                    setCoverFile(null);
                    setRemoveCover(true);
                  }}
                >
                  Hapus Cover
                </button>
              )}

              <small>JPG, PNG, WEBP. Maksimal 5 MB.</small>
            </section>

            <section className="admin-article-side-card">
              {/* <h2>Publikasi</h2>

              <label className="admin-article-check">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField('featured', event.target.checked)
                  }
                />
                <span>Jadikan artikel pilihan</span>
              </label> */}

              <label className="admin-article-status-select">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField('status', event.target.value)
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="pending_review">Pending Review</option>
                </select>
              </label>

              <button
                type="button"
                className="admin-article-primary"
                disabled={isSaving}
                onClick={() => handleSubmit(form.status)}
              >
                {isSaving ? 'Memproses...' : 'Publikasi Artikel'}
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

export const AdminArticleCreate = AdminArticleForm;
export const AdminArticleEdit = AdminArticleForm;

export default AdminArticleForm;
