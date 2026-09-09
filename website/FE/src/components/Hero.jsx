import servoIdeGif from '../assets/gif/gif-servonobg-idearduflow.gif';

export function Hero() {
  const handleScrollToVisualProgramming = (event) => {
    event.preventDefault();

    const targetSection = document.querySelector('.visual-work-section');

    if (!targetSection) {
      return;
    }

    // Offset agar judul section tidak tertutup navbar
    const navbarOffset = 90;

    const targetPosition =
      targetSection.getBoundingClientRect().top +
      window.scrollY -
      navbarOffset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  };

  return (
    <section className="landing-hero">
      <div className="landing-inner">

        {/* COPY / TEXT */}
        <div className="landing-copy">
          <div className="landing-tag">
            FLOW. CONNECT. INNOVATE.
          </div>

          <div className="landing-text">
            <h1>
              <span>IoT Development</span>

              <span className="heading-light">
                with
              </span>

              <span>
                Visual Programming
              </span>
            </h1>

            <p>
              Arduflow membantu siswa, guru, komunitas, dan pemula
              belajar Arduino serta membuat proyek IoT melalui IDE
              visual, tutorial, workshop, dan akses berbasis token.
            </p>
          </div>
        </div>

        {/* VISUAL / GIF */}
        <div
          className="landing-visual"
          aria-label="Visual programming Arduflow"
        >
          <img
            className="landing-visual-gif"
            src={servoIdeGif}
            alt="Demo servo di IDE visual Arduflow"
          />
        </div>

        {/* BUTTON */}
        <div className="landing-actions">

          <a
            className="landing-primary"
            href="/akses"
          >
            Daftar untuk Mendapatkan Akses
          </a>

          <a
            className="landing-secondary"
            href="#cara-kerja-visual-programming"
            onClick={handleScrollToVisualProgramming}
          >
            Lihat Cara Kerja Arduflow
          </a>

        </div>

        {/* TOKEN */}
        <div className="landing-token">
          <span>
            Sudah punya token?
          </span>

          <a href="/ide">
            Masuk ke IDE
          </a>
        </div>

      </div>
    </section>
  );
}