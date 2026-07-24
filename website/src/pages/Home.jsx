import { AccessSteps } from '../components/AccessSteps.jsx';
import { CardGrid } from '../components/CardGrid.jsx';
import { Hero } from '../components/Hero.jsx';
import { accessSteps, problems, programs } from '../features/content/arduflowContent.js';

export function Home() {
  return (
    <>
      <Hero />
      <section className="section split">
        <div>
          <p className="eyebrow">Apa Itu Arduflow</p>
          <h2>Ekosistem belajar IoT berbasis visual programming.</h2>
        </div>
        <p>
          Arduflow memperkenalkan ArduFlow IDE sebagai produk utama, dilengkapi tutorial, dokumentasi,
          contoh project, dan workshop pendukung agar proses belajar Arduino lebih terarah.
        </p>
      </section>
      <section className="section">
        <p className="eyebrow">Masalah yang Diselesaikan</p>
        <h2>Belajar IoT dibuat lebih bertahap.</h2>
        <div className="problem-list">
          {problems.map((problem) => <div key={problem}>{problem}</div>)}
        </div>
      </section>
      <section className="section">
        <p className="eyebrow">Akses IDE</p>
        <h2>Cara mendapatkan token ArduFlow IDE.</h2>
        <AccessSteps steps={accessSteps} />
      </section>
      <section className="section">
        <p className="eyebrow">Program Pendukung</p>
        <h2>Workshop dan training sebagai jalur belajar terstruktur.</h2>
        <CardGrid items={programs} />
      </section>
    </>
  );
}
