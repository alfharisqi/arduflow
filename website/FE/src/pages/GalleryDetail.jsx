import { useEffect, useMemo, useState } from 'react';

import fallbackImage from '../assets/images/workshop-experience-group.png';
import {
  fetchGallerySubmission,
  isPublishedGallery,
} from '../services/galleryApi.js';

function getGalleryIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id') || '';
}

function formatGalleryDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function sanitizeGalleryHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '');
}

export function GalleryDetail() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const galleryId = useMemo(getGalleryIdFromUrl, []);

  useEffect(() => {
    let isActive = true;

    async function loadDetail() {
      setLoading(true);
      setError('');

      try {
        const row = await fetchGallerySubmission(galleryId);

        if (!isActive) return;

        if (!isPublishedGallery(row)) {
          throw new Error('Galeri belum dipublikasikan.');
        }

        setItem(row);
      } catch (fetchError) {
        if (!isActive) return;

        setError(fetchError.message || 'Detail galeri tidak dapat dimuat.');
        setItem(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isActive = false;
    };
  }, [galleryId]);

  if (loading || error || !item) {
    return (
      <main className="gallery-detail-page">
        <section className="gallery-detail-shell">
          <a className="gallery-detail-back" href="/galeri">Kembali ke Galeri</a>
          <p className="gallery-detail-empty">
            {loading ? 'Memuat detail galeri dari database...' : error || 'Galeri tidak ditemukan.'}
          </p>
        </section>
      </main>
    );
  }

  const contentHtml = sanitizeGalleryHtml(item.descriptionHtml) || '<p>Belum ada isi dokumentasi.</p>';

  return (
    <main className="gallery-detail-page">
      <article className="gallery-detail-shell">
        <a className="gallery-detail-back" href="/galeri">Kembali ke Galeri</a>

        <header className="gallery-detail-hero">
          <img src={item.imageUrl || fallbackImage} alt={item.title} />
          <div>
            <span>{item.tag}</span>
            <h1>{item.title}</h1>
            <p>{item.description || 'Belum ada deskripsi dokumentasi.'}</p>
          </div>
        </header>

        <section className="gallery-detail-meta" aria-label="Informasi galeri">
          <div>
            <strong>Tanggal Kegiatan</strong>
            <span>{formatGalleryDate(item.eventDate)}</span>
          </div>
          <div>
            <strong>Upload By</strong>
            <span>{item.userName}</span>
          </div>
          <div>
            <strong>Status</strong>
            <span>Published</span>
          </div>
        </section>

        <section className="gallery-detail-content" aria-labelledby="gallery-detail-content-title">
          <h2 id="gallery-detail-content-title">Isi Dokumentasi</h2>
          <div
            className="gallery-detail-richtext mce-content-body"
            dangerouslySetInnerHTML={{
              __html: contentHtml,
            }}
          />
        </section>

        {item.note && (
          <section className="gallery-detail-note">
            <h2>Catatan</h2>
            <p>{item.note}</p>
          </section>
        )}

        {item.detailLink && (
          <a className="gallery-detail-link" href={item.detailLink} target="_blank" rel="noreferrer">
            Buka Link Detail
          </a>
        )}
      </article>
    </main>
  );
}

export default GalleryDetail;
