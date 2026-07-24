export function Ide() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Produk Utama</p>
        <h1>ArduFlow IDE</h1>
        <p>
          IDE visual membantu pengguna menyusun logika project Arduino dan IoT tanpa langsung berhadapan
          dengan coding yang rumit.
        </p>
        <div className="actions">
          <a className="button" href="/akses">Cara Mendapatkan Token</a>
          <a className="button secondary" href="/kontak">Sudah punya token? Kontak Admin</a>
        </div>
      </section>
      <section className="section split">
        <div>
          <h2>Fokus IDE</h2>
          <p>Membantu pemula memahami alur project, wiring, komponen, dan proses upload secara lebih visual.</p>
        </div>
        <ul className="feature-list">
          <li>Visual programming untuk logika project.</li>
          <li>Panduan bertahap untuk Arduino dan IoT.</li>
          <li>Akses berbasis token setelah pendaftaran.</li>
        </ul>
      </section>
    </>
  );
}
