import { LeadForm } from '../components/LeadForm.jsx';

export function Contact() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Leads</p>
        <h1>Kontak admin, request demo, akses IDE, atau kerja sama.</h1>
        <p>Form ini mengumpulkan calon pengguna untuk akses token, workshop, demo sekolah, dan kerja sama komunitas.</p>
      </section>
      <section className="section narrow">
        <LeadForm />
      </section>
    </>
  );
}
