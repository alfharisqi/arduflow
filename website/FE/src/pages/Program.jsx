import { CardGrid } from '../components/CardGrid.jsx';
import { programs } from '../features/content/arduflowContent.js';

export function Program() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Workshop dan Training</p>
        <h1>Program Arduflow sebagai pendukung ekosistem belajar.</h1>
        <p>Workshop ditempatkan sebagai jalur belajar terstruktur sekaligus akses untuk mendapatkan token IDE.</p>
      </section>
      <section className="section">
        <CardGrid items={programs} />
      </section>
    </>
  );
}
