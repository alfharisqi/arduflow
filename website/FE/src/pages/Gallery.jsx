import { useEffect, useMemo, useRef, useState } from 'react';

import fallbackImage from '../assets/images/workshop-experience-group.png';

import {
  fetchGallerySubmissions,
  isPublishedGallery,
} from '../services/galleryApi.js';


function normalizeGalleryDate(value) {
  if (!value) return '';

  const stringValue = String(value).trim();

  /*
    Kalau dari database sudah berbentuk:
    YYYY-MM-DD
    YYYY-MM-DD HH:mm:ss
    YYYY-MM-DDTHH:mm:ss

    langsung ambil bagian tanggalnya.
  */
  const match = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  /*
    Fallback jika format tanggal berbeda.
  */
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function formatGalleryDate(value) {
  if (!value) return '-';

  const normalizedDate = normalizeGalleryDate(value);

  if (!normalizedDate) {
    return String(value);
  }

  const [year, month, day] = normalizedDate
    .split('-')
    .map(Number);

  /*
    new Date(year, month, day) dipakai agar tidak terkena
    masalah timezone UTC yang dapat menggeser tanggal.
  */
  const date = new Date(
    year,
    month - 1,
    day,
  );

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
    <span
      className="documentation-card__avatar"
      aria-hidden="true"
    >
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

          <span className="documentation-card__tag">
            {item.tag}
          </span>

          <div className="documentation-card__title-row">

            <h2>
              {item.title}
            </h2>

            <a
              href={galleryDetailHref(item)}
              aria-label={`Buka ${item.title}`}
            >
              -&gt;
            </a>

          </div>

          <p>
            {item.description ||
              'Belum ada deskripsi dokumentasi.'}
          </p>

        </div>


        <div className="documentation-card__author">

          <Avatar />

          <div>

            <strong>
              {item.userName}
            </strong>

            <span>
              {formatGalleryDate(item.eventDate)}
            </span>

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

  const dateInputRef = useRef(null);

  useEffect(() => {

    let isActive = true;


    async function loadGallery() {

      setLoading(true);

      setError('');


      try {

        const rows =
          await fetchGallerySubmissions();


        const publishedRows =
          rows.filter(isPublishedGallery);


        if (!isActive) {
          return;
        }


        setItems(publishedRows);

      } catch (fetchError) {

        if (!isActive) {
          return;
        }


        setError(
          fetchError.message ||
          'Data galeri tidak dapat dimuat.',
        );


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

  }, [
    dateFilter,
    searchTerm,
    tagFilter,
  ]);

  const tagOptions = useMemo(() => {

    return Array.from(
      new Set(
        items
          .map((item) => item.tag)
          .filter(Boolean),
      ),
    ).sort();

  }, [items]);


  const filteredItems = useMemo(() => {

    const query =
      searchTerm
        .trim()
        .toLowerCase();

    const selectedDate =
      normalizeGalleryDate(dateFilter);


    return items.filter((item) => {

      const haystack = [

        item.title,

        item.tag,

        item.description,

        item.userName,

        formatGalleryDate(
          item.eventDate,
        ),

      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();


      if (
        query &&
        !haystack.includes(query)
      ) {
        return false;
      }

      if (
        tagFilter &&
        item.tag !== tagFilter
      ) {
        return false;
      }

      if (selectedDate) {

        const itemDate =
          normalizeGalleryDate(
            item.eventDate,
          );


        if (
          itemDate !== selectedDate
        ) {
          return false;
        }

      }


      return true;

    });

  }, [
    dateFilter,
    items,
    searchTerm,
    tagFilter,
  ]);

  const visibleItems =
    filteredItems.slice(
      0,
      visibleCount,
    );


  const canLoadMore =
    visibleCount <
    filteredItems.length;

  function openDatePicker() {

    const input =
      dateInputRef.current;


    if (!input) {
      return;
    }

    if (
      typeof input.showPicker ===
      'function'
    ) {

      try {

        input.showPicker();

      } catch {
        input.focus();
      }

      return;
    }

    input.focus();

  }

  return (

    <main
      className="documentation-page gallery-page"
    >

      <div
        className="documentation-page__canvas"
      >

        <div
          className="documentation-page__heading"
        >

          <div
            className="landing-tag gallery-landing-tag"
          >
            CAPTURE. DOCUMENT. INSPIRE.
          </div>


          <p>
            Gallery Documentation
          </p>


          <h1>
            Galeri Dokumentasi Kegiatan
          </h1>

        </div>

        <label
          className="
            documentation-input
            documentation-input--search
          "
        >

          <span
            className="documentation-input__label"
          >
            Cari dokumentasi kegiatan
          </span>


          <input
            type="search"
            placeholder="Cari judul, tag, atau pengunggah..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
          />


          <span
            className="documentation-input__search-icon"
            aria-hidden="true"
          />

        </label>

        <div
          className="
            documentation-input
            documentation-input--date
            gallery-page__date
          "
        >

          <label
            className="documentation-input__label"
            htmlFor="gallery-event-date"
          >
            Tanggal kegiatan
          </label>


          <div
            className="gallery-date-input-wrapper"
            onClick={openDatePicker}
          >

            <input
              ref={dateInputRef}
              id="gallery-event-date"
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value,
                )
              }
              aria-label="Filter berdasarkan tanggal kegiatan"
            />

          </div>


          {/* Tombol hapus filter tanggal */}

          {dateFilter && (

            <button
              type="button"
              className="gallery-date-clear"
              onClick={(event) => {

                event.stopPropagation();

                setDateFilter('');

              }}
              aria-label="Hapus filter tanggal"
              title="Hapus tanggal"
            >
              ×
            </button>

          )}

        </div>

        <label
          className="
            documentation-input
            documentation-input--tag
          "
        >

          <span
            className="documentation-input__label"
          >
            Tag kegiatan
          </span>


          <select
            value={tagFilter}
            onChange={(event) =>
              setTagFilter(
                event.target.value,
              )
            }
          >

            <option value="">
              Semua Tag
            </option>


            {tagOptions.map((tag) => (

              <option
                key={tag}
                value={tag}
              >
                {tag}
              </option>

            ))}

          </select>

        </label>

        <section
          className="documentation-gallery"
          aria-label="Daftar dokumentasi kegiatan"
        >

          {loading ? (

            <p
              className="documentation-gallery__empty"
            >
              Memuat data galeri dari database...
            </p>

          ) : error ? (

            <p
              className="documentation-gallery__empty"
            >
              {error}
            </p>

          ) : (

            <>

              <div
                className="documentation-gallery__grid"
              >

                {visibleItems.map((item) => (

                  <GalleryCard
                    item={item}
                    key={item.id}
                  />

                ))}

              </div>

              {filteredItems.length === 0 && (

                <p
                  className="documentation-gallery__empty"
                >

                  {dateFilter
                    ? `Tidak ada dokumentasi pada ${formatGalleryDate(
                      dateFilter,
                    )}.`
                    : 'Dokumentasi belum ditemukan untuk filter ini.'}

                </p>

              )}


              {/* =============================================
                  LOAD MORE
                  ============================================= */}

              {canLoadMore && (

                <button
                  className="documentation-gallery__more"
                  type="button"
                  onClick={() =>
                    setVisibleCount(
                      (count) =>
                        count + 9,
                    )
                  }
                >

                  <span
                    aria-hidden="true"
                  >
                    v
                  </span>

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