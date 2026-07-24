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
          <div className="node-card wave-node">
            <div className="node-header blue">SQUARE WAVE <strong>0.5Hz</strong></div>
            <label>FREQUENCY (Hz)</label>
            <div className="node-input">0,5</div>
            <small>GENERATOR</small>
            <span className="port blue-port" />
          </div>
          <div className="node-card number-node first">
            <div className="node-header cyan">NUMBER <strong>0</strong></div>
            <label>CONSTANT VALUE</label>
            <div className="node-input">0</div>
            <span className="port pale-port" />
          </div>
          <div className="node-card number-node second">
            <div className="node-header cyan">NUMBER <strong>90</strong></div>
            <label>CONSTANT VALUE</label>
            <div className="node-input">90</div>
            <span className="port pale-port" />
          </div>
          <div className="node-card if-node">
            <div className="node-header orange">IF THEN ELSE</div>
            <div className="condition-line cond">Cond <span>CONDITION</span></div>
            <div className="condition-line true">True <span>VALUE IF T</span></div>
            <div className="condition-line false">False <span>VALUE IF F</span></div>
            <div className="condition-line output">Output <span>0</span></div>
            <span className="port output-port" />
          </div>
          <div className="node-card servo-node">
            <div className="node-header red">SERVO MOTOR <strong>0°</strong></div>
            <label>SELECT PIN</label>
            <div className="node-input">13</div>
            <label>ANGLE (0-180)</label>
            <div className="slider-line red-slider" />
            <span className="port red-port" />
          </div>
          <div className="node-card gauge-node">
            <div className="node-header blue">GAUGE DISPLAY</div>
            <div className="gauge">
              <span className="gauge-fill" />
              <span className="gauge-line" />
              <span className="gauge-knob">0</span>
            </div>
            <div className="gauge-scale">
              <span>MIN<br />0</span>
              <span>MAX<br />180</span>
            </div>
            <span className="port blue-port left" />
          </div>
          <svg className="node-wires" viewBox="0 0 667 484" aria-hidden="true">
            <path d="M145 125 C205 125 180 230 258 230" />
            <path d="M145 242 C205 242 195 252 258 252" />
            <path d="M145 350 C205 350 195 278 258 278" />
            <path d="M350 278 C445 278 390 85 500 95" />
            <path d="M350 278 C445 278 390 330 508 335" />
          </svg>
        </div>
      </div>
    </section>
  );
}
