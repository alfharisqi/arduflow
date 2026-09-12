import fallbackImage from '../../assets/images/tutorial-device.png';
import '../../styles/material-card.css';

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAccessType(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (
    [
      'premium',
      'premium / berbayar',
      'berbayar',
      'paid',
    ].includes(normalized)
  ) {
    return 'Premium';
  }

  if (
    [
      'login',
      'member',
      'perlu login',
      'perlu login / akun',
      'akun',
    ].includes(normalized)
  ) {
    return 'Perlu login / Akun';
  }

  return 'Gratis';
}

function formatRupiah(value) {
  const amount = Math.max(
    0,
    Number(value) || 0,
  );

  return new Intl.NumberFormat(
    'id-ID',
    {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

export function MaterialCard({
  material,
  href,
  badge = null,
  className = '',
}) {
  const description =
    material.shortDescription ||
    stripHtml(material.fullDescription) ||
    material.description ||
    '';

  const lessons =
    material.totalSlides ||
    material.lessons ||
    0;

  const duration =
    material.estimatedTime ||
    material.duration ||
    '10 menit';

  const level =
    material.difficulty ||
    material.level ||
    'Pemula';

  const category =
    material.category ||
    'IoT';

  const imageUrl =
    material.cardImageUrl ||
    material.thumbnail ||
    fallbackImage;

  const price = Math.max(
    0,
    Number(
      material.price ??
        material.material_price ??
        material.page_settings?.price ??
        0,
    ) || 0,
  );

  const accessType = normalizeAccessType(
    material.accessType ||
      material.access_type ||
      material.page_settings?.access_type ||
      (price > 0 ? 'Premium' : 'Gratis'),
  );

  const isPremium =
    accessType === 'Premium' ||
    price > 0;

  const formattedPrice =
    formatRupiah(price);

  return (
    <article
      className={`materials-card ${className}`.trim()}
    >
      <a
        className="materials-card__media"
        href={href}
        aria-label={`Pelajari ${material.title}`}
      >
        <img
          src={imageUrl}
          alt={material.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackImage;
          }}
        />

        {badge && (
          <span className="materials-card__flag">
            {badge}
          </span>
        )}
      </a>

      <div className="materials-card__body">
        <div className="materials-card__badges">
          <span>{category}</span>
          <span>{level}</span>
        </div>

        <h3>{material.title}</h3>

        <p>{description}</p>

        <div
          className="materials-card__meta"
          aria-label="Informasi materi"
        >
          <span>Waktu {duration}</span>

          <span>
            {lessons
              ? `${lessons} bagian`
              : 'Materi singkat'}
          </span>
        </div>

        <div className="materials-card__access">
          {isPremium ? (
            <a
              className="materials-card__price-button"
              href={href}
              aria-label={`Lihat materi ${material.title} dengan harga ${formattedPrice}`}
            >
              <span className="materials-card__price-label">
                Premium
              </span>

              <strong>
                {formattedPrice}
              </strong>
            </a>
          ) : (
            <span className="materials-card__free-label">
              Gratis
            </span>
          )}
        </div>

        <a
          className="materials-card__link"
          href={href}
        >
          {isPremium
            ? 'Beli Materi'
            : 'Pelajari'}{' '}

          <span aria-hidden="true">
            -&gt;
          </span>
        </a>
      </div>
    </article>
  );
}

export function MaterialEmptyState() {
  return (
    <div className="materials-empty-state">
      <h3>Materi tidak ditemukan</h3>

      <p>
        Coba gunakan kata kunci atau kategori lainnya.
      </p>
    </div>
  );
}
