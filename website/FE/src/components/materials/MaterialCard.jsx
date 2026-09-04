import fallbackImage from '../../assets/images/tutorial-device.png';

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function MaterialCard({ material, href, badge = null, className = '' }) {
  const description = material.shortDescription || stripHtml(material.fullDescription) || material.description || '';
  const lessons = material.totalSlides || material.lessons || 0;
  const duration = material.estimatedTime || material.duration || '10 menit';
  const level = material.difficulty || material.level || 'Pemula';
  const category = material.category || 'IoT';

  return (
    <article className={`materials-card ${className}`.trim()}>
      <a className="materials-card__media" href={href} aria-label={`Pelajari ${material.title}`}>
        <img src={material.cardImageUrl || material.thumbnail || fallbackImage} alt={material.title} loading="lazy" />
        {badge && <span className="materials-card__flag">{badge}</span>}
      </a>
      <div className="materials-card__body">
        <div className="materials-card__badges">
          <span>{category}</span>
          <span>{level}</span>
        </div>
        <h3>{material.title}</h3>
        <p>{description}</p>
        <div className="materials-card__meta" aria-label="Informasi materi">
          <span>Waktu {duration}</span>
          <span>{lessons ? `${lessons} bagian` : 'Materi singkat'}</span>
        </div>
        <a className="materials-card__link" href={href}>
          Pelajari <span aria-hidden="true">-&gt;</span>
        </a>
      </div>
    </article>
  );
}

export function MaterialEmptyState() {
  return (
    <div className="materials-empty-state">
      <h3>Materi tidak ditemukan</h3>
      <p>Coba gunakan kata kunci atau kategori lainnya.</p>
    </div>
  );
}
