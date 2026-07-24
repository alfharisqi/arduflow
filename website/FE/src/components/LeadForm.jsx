import { useState } from 'react';
import { submitLead } from '../features/leads/leadApi.js';

const initialValues = {
  name: '',
  email: '',
  phone: '',
  interest: 'akses',
  message: '',
};

export function LeadForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateValue(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const result = await submitLead(values);
      setStatus({ type: 'success', message: result.message });
      setValues(initialValues);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      {status && <div className={`notice ${status.type}`}>{status.message}</div>}
      <label>
        Nama
        <input name="name" type="text" value={values.name} onChange={updateValue} required />
      </label>
      <label>
        Email
        <input name="email" type="email" value={values.email} onChange={updateValue} required />
      </label>
      <label>
        Nomor WhatsApp
        <input name="phone" type="text" value={values.phone} onChange={updateValue} />
      </label>
      <label>
        Kebutuhan
        <select name="interest" value={values.interest} onChange={updateValue}>
          <option value="akses">Akses Token IDE</option>
          <option value="workshop">Workshop</option>
          <option value="demo">Request Demo</option>
          <option value="kerja-sama">Kerja Sama</option>
        </select>
      </label>
      <label>
        Pesan
        <textarea name="message" rows="5" value={values.message} onChange={updateValue} />
      </label>
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
      </button>
    </form>
  );
}
