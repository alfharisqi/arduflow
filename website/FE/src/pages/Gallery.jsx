import { useEffect, useMemo, useState } from 'react';

import fallbackImage from '../assets/images/workshop-experience-group.png';
import {
  fetchGallerySubmissions,
  isPublishedGallery,
} from '../services/galleryApi.js';

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

function galleryDetailHref(item) {
  return `/galeri/detail?id=${encodeURIComponent(item.id)}`;
}

function Avatar() {
  return (
    <span className="documentation-card__avatar" aria-hidden="true">
      <span />
    </span>
  );
}

function GalleryCard({ item }) {
  return (
    <article className="documentation-card">
      <img
        className="documentation-card__image"
        src={item.imageUrl || fallbackImage}
        alt={item.title}
      />

      <div className="documentation-card__content">
        <div className="documentation-card__text">
          <span className="documentation-card__tag">{item.tag}</span>
          <div className="documentation-card__title-row">
            <h2>{item.title}</h2>
            <a href={galleryDetailHref(item)} aria-label={`Buka ${item.title}`}>
              -&gt;
            </a>
          </div>
          <p>{item.description || 'Belum ada deskripsi dokumentasi.'}</p>
        </div>

        <div className="documentation-card__author">
          <Avatar />
          <div>
            <strong>{item.userName}</strong>
            <span>{formatGalleryDate(item.eventDate)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    let isActive = true;

    async function loadGallery() {
      setLoading(true);
      setError('');

      try {
        const rows = await fetchGallerySubmissions();
        const publishedRows = rows.filter(isPublishedGallery);

        if (!isActive) return;

        setItems(publishedRows);
      } catch (fetchError) {
        if (!isActive) return;

        setError(fetchError.message || 'Data galeri tidak dapat dimuat.');
        setItems([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadGallery();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(9);
  }, [dateFilter, searchTerm, tagFilter]);

  const tagOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.tag).filter(Boolean))).sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const eventDate = dateFilter.trim();

    return items.filter((item) => {
      const haystack = [
        item.title,
        item.tag,
        item.description,
        item.userName,
        formatGalleryDate(item.eventDate),
      ].join(' ').toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (tagFilter && item.tag !== tagFilter) return false;
      if (eventDate && item.eventDate !== eventDate) return false;

      return true;
    });
  }, [dateFilter, items, searchTerm, tagFilter]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredItems.length;

  return (
    <main className="documentation-page gallery-page">
      <div className="documentation-page__canvas">
        <div className="documentation-page__heading">
          <div className="landing-tag gallery-landing-tag">CAPTURE. DOCUMENT. INSPIRE.</div>
          <p>Gallery Documentation</p>
          <h1>Galeri Dokumentasi Kegiatan</h1>
        </div>

        <label className="documentation-input documentation-input--search">
          <span className="documentation-input__label">Cari dokumentasi kegiatan</span>
          <input
            type="search"
            placeholder="Cari judul, tag, atau pengunggah..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <span className="documentation-input__search-icon" aria-hidden="true" />
        </label>

        <label className="documentation-input documentation-input--date gallery-page__date">
          <span className="documentation-input__label">Tanggal kegiatan</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </label>

        <label className="documentation-input documentation-input--tag">
          <span className="documentation-input__label">Tag kegiatan</span>
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="">Semua Tag</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>

        <section className="documentation-gallery" aria-label="Daftar dokumentasi kegiatan">
          {loading ? (
            <p className="documentation-gallery__empty">Memuat data galeri dari database...</p>
          ) : error ? (
            <p className="documentation-gallery__empty">{error}</p>
          ) : (
            <>
              <div className="documentation-gallery__grid">
                {visibleItems.map((item) => (
                  <GalleryCard item={item} key={item.id} />
                ))}
              </div>

              {filteredItems.length === 0 && (
                <p className="documentation-gallery__empty">
                  Dokumentasi belum ditemukan untuk filter ini.
                </p>
              )}

              {canLoadMore && (
                <button
                  className="documentation-gallery__more"
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 9)}
                >
                  <span aria-hidden="true">v</span>
                  Lebih Banyak
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Gallery;
