import { CardGrid } from '../components/CardGrid.jsx';
import { tutorials } from '../features/content/arduflowContent.js';

export function Tutorial() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Tutorial dan Dokumentasi</p>
        <h1>Materi belajar Arduino dan IoT untuk pemula.</h1>
        <p>Tutorial membantu pengguna belajar secara bertahap dari konsep dasar sampai project nyata.</p>
      </section>
      <section className="section">
        <CardGrid items={tutorials} />
      </section>
    </>
  );
}
