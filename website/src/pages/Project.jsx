import { CardGrid } from '../components/CardGrid.jsx';
import { projects } from '../features/content/arduflowContent.js';

export function Project() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Project Showcase</p>
        <h1>Contoh hasil karya yang bisa dipelajari pengguna.</h1>
        <p>
          Project showcase membangun kredibilitas dan memberi gambaran project Arduino/IoT yang dapat dibuat
          dengan Arduflow.
        </p>
      </section>
      <section className="section">
        <CardGrid items={projects} />
      </section>
    </>
  );
}
