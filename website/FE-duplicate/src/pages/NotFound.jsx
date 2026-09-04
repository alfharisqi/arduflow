import notFoundImage from '../assets/images/404 not found.png';

export function NotFound() {
  function handleBack(event) {
    event.preventDefault();

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = '/';
  }

  return (
    <main className="not-found-page">
      <section className="not-found-content" aria-labelledby="not-found-title">
        <img className="not-found-image" src={notFoundImage} alt="Halaman tidak ditemukan" />

        <div className="not-found-copy">
          <h1 id="not-found-title">Waduh!</h1>
          <p>Halaman yang kamu cari tidak ada!</p>

          <form className="not-found-search" action="/tutorial" role="search">
            <input type="search" name="q" placeholder="Cari sesuatu?" aria-label="Cari sesuatu" />
            <button type="submit" aria-label="Cari">
              <span aria-hidden="true" />
            </button>
          </form>

          <a className="not-found-back" href="/" onClick={handleBack}>
            <span aria-hidden="true">←</span>
            Kembali
          </a>
        </div>
      </section>
    </main>
  );
}
