import { AccessSteps } from '../components/AccessSteps.jsx';
import { LeadForm } from '../components/LeadForm.jsx';
import { accessSteps } from '../features/content/arduflowContent.js';

export function Access() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Alur Akses</p>
        <h1>Daftar, konfirmasi, dapatkan token, lalu masuk IDE.</h1>
        <p>CTA utama website diarahkan ke pendaftaran karena IDE hanya dapat digunakan setelah pengguna memiliki token.</p>
      </section>
      <section className="section">
        <AccessSteps steps={accessSteps} />
      </section>
      <section className="section narrow">
        <h2>Ajukan akses Arduflow</h2>
        <LeadForm />
      </section>
    </>
  );
}
