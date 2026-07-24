import { partners } from '../features/content/arduflowContent.js';

export function Partner() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Kredibilitas</p>
        <h1>Partner, testimoni, dan dokumentasi kegiatan.</h1>
        <p>Area ini disiapkan untuk menampilkan bukti kegiatan, hasil karya pengguna, testimoni, dan kolaborasi.</p>
      </section>
      <section className="section">
        <div className="logo-grid">
          {partners.map((partner) => <div key={partner}>{partner}</div>)}
        </div>
      </section>
    </>
  );
}
