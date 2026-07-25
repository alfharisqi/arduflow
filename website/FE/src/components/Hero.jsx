import servoIdeGif from '../assets/gif/gif-servonobg-idearduflow.gif';

export function Hero() {
  return (
    <section className="landing-hero">
      <div className="landing-inner">
        <div className="landing-copy">
          <div className="landing-tag">FLOW. CONNECT. INNOVATE.</div>
          <div className="landing-text">
            <h1>
              <span>IoT Development</span>
              <span className="heading-light">with</span>
              <span>Visual Programming</span>
            </h1>
            <p>
              Arduflow membantu siswa, guru, komunitas, dan pemula belajar Arduino serta membuat proyek IoT
              melalui IDE visual, tutorial, workshop, dan akses berbasis token.
            </p>
          </div>
          <div className="landing-actions">
            <a className="landing-primary" href="/akses">Daftar untuk Mendapatkan Akses</a>
            <a className="landing-secondary" href="/program">Lihat Cara Kerja Arduflow</a>
          </div>
          <div className="landing-token">
            <span>Sudah punya token?</span>
            <a href="/ide">Masuk ke IDE</a>
          </div>
        </div>

        <div className="landing-visual" aria-label="Visual programming Arduflow">
          <img className="landing-visual-gif" src={servoIdeGif} alt="Demo servo di IDE visual Arduflow" />
        </div>
      </div>
    </section>
  );
}
