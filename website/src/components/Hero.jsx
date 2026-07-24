export function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Platform Edukasi IoT</p>
        <h1>Belajar IoT dan Arduino lebih mudah dengan Arduflow.</h1>
        <p>
          Arduflow membantu pemula memahami IoT dari dasar hingga membuat project nyata melalui IDE visual,
          tutorial terarah, contoh project, dan workshop terstruktur.
        </p>
        <div className="actions">
          <a className="button" href="/akses">Daftar untuk Mendapatkan Akses</a>
          <a className="button secondary" href="/program">Lihat Program Arduflow</a>
        </div>
      </div>
      <div className="ide-preview" aria-label="Preview ArduFlow IDE">
        <div className="preview-topbar">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-body">
          <div className="block sensor">Sensor cahaya</div>
          <div className="connector" />
          <div className="block logic">Jika gelap</div>
          <div className="connector" />
          <div className="block action">Nyalakan lampu</div>
        </div>
        <div className="device-card">
          <span className="status-dot" />
          Smart Home Mini aktif
        </div>
      </div>
    </section>
  );
}
