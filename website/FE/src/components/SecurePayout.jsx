import { useEffect, useState } from 'react';
import { fetchPayoutSecurity, requestPayoutCode, confirmPayoutSecurity } from '../services/transactionApi.js';
import { clearUserAuthState } from '../services/authSession.js';
import '../styles/secure-payout.css';

const money = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const date = (seconds) => new Date(seconds * 1000).toLocaleString('id-ID');
const empty = { password: '', newPin: '', repeatPin: '', pin: '', bank: '', number: '', name: '', accountId: '', amount: '', note: '', code: '' };

export function SecurePayout({ projectIds, onSubmitted, onStatus }) {
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('payout');
  const [form, setForm] = useState(empty);
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now() / 1000);

  async function refresh() {
    const data = await fetchPayoutSecurity();
    setStatus(data);
    onStatus?.(data);
    return data;
  }

  useEffect(() => {
    let active = true;
    fetchPayoutSecurity().then((data) => {
      if (active) { setStatus(data); onStatus?.(data); }
    }).catch((failure) => { if (active) setError(failure.message); });
    const timer = window.setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const locked = (status?.lockedUntil || 0) > now;
  const cooling = (status?.cooldownUntil || 0) > now;
  const expired = challenge && challenge.expiresAt <= now;
  const sessionExpired = /session tidak valid|kedaluwarsa|login diperlukan/i.test(error || '');
  const selected = status?.balances.filter((row) => projectIds.includes(String(row.projectId))) || [];
  const available = selected.reduce((sum, row) => sum + row.available, 0);
  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  function switchMode(next) {
    setMode(next); setForm(empty); setChallenge(null); setError(''); setMessage('');
  }

  function goToLogin() {
    clearUserAuthState();
    window.location.assign('/signin');
  }

  async function request(event) {
    event.preventDefault();
    setError(''); setMessage('');
    if (mode === 'pin' && form.newPin !== form.repeatPin) { setError('Konfirmasi PIN belum sama.'); return; }
    setBusy(true);
    try {
      const data = await requestPayoutCode({ purpose: mode, ...form, projectIds, amount: form.amount || available });
      setChallenge({ ...data, purpose: mode });
      setForm((current) => ({ ...current, password: '', newPin: '', repeatPin: '', pin: '', code: '' }));
      setMessage(data.message);
    } catch (failure) {
      setError(failure.message);
      setForm((current) => ({ ...current, password: '', newPin: '', repeatPin: '', pin: '', code: '' }));
      await refresh().catch(() => {});
    } finally { setBusy(false); }
  }

  async function confirm(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await confirmPayoutSecurity({ challengeId: challenge.challengeId, code: form.code, pin: form.pin });
      const wasPayout = challenge.purpose === 'payout';
      setChallenge(null); setForm(empty); setMode('payout'); setMessage(result.message);
      await refresh();
      if (wasPayout) await onSubmitted?.();
    } catch (failure) {
      setError(failure.message);
      setForm((current) => ({ ...current, pin: '', code: '' }));
      await refresh().catch(() => {});
    } finally { setBusy(false); }
  }

  const pinInput = (key, label, autoComplete = 'off') => (
    <label>{label}<input type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6}
      required autoComplete={autoComplete} value={form[key]} onChange={change(key)} placeholder="6 digit" /></label>
  );

  return (
    <section className="secure-payout" aria-label="Keamanan pencairan dana">
      <div className="secure-payout__steps" aria-label="Tahapan pencairan">
        <span>1. PIN & rekening</span><span>2. Periksa rincian</span><span>3. Verifikasi</span><span>4. Pemeriksaan admin</span>
      </div>
      <h3>Pencairan dana dengan PIN</h3>
      <p>Dana ditahan setelah pengajuan diterima. Admin memeriksa pemilik rekening sebelum memproses transfer.</p>
      {error && <p className="secure-payout__error" role="alert">{error}</p>}
      {message && <p className="secure-payout__message" role="status">{message}</p>}
      {!status ? (
        <div className="secure-payout__empty">
          {sessionExpired ? (
            <button type="button" onClick={goToLogin}>Login ulang</button>
          ) : (
            <button type="button" disabled={busy} onClick={() => refresh().catch((failure) => setError(failure.message))}>Muat pengaturan pencairan</button>
          )}
        </div>
      ) : <>
        {locked && <p role="status">Percobaan dikunci sampai {date(status.lockedUntil)}.</p>}
        {cooling && <p role="status">Masa tunggu setelah reset PIN: pencairan tersedia pada {date(status.cooldownUntil)}.</p>}
        {!challenge && <nav aria-label="Pengaturan pencairan" className="secure-payout__tabs">
          <button type="button" aria-pressed={mode === 'payout'} onClick={() => switchMode('payout')}>Cairkan dana</button>
          <button type="button" aria-pressed={mode === 'pin'} onClick={() => switchMode('pin')}>{status.hasPin ? 'Lupa / reset PIN' : 'Aktifkan PIN'}</button>
          <button type="button" aria-pressed={mode === 'account'} onClick={() => switchMode('account')}>Daftarkan rekening</button>
        </nav>}
        {challenge ? <form onSubmit={confirm}>
          <h4>{challenge.purpose === 'payout' ? 'Konfirmasi pencairan' : 'Verifikasi perubahan keamanan'}</h4>
          {challenge.purpose === 'payout' && <dl className="secure-payout__summary">
            <dt>Nominal</dt><dd>{money(challenge.summary.amount)}</dd>
            <dt>Biaya pencairan</dt><dd>{money(challenge.summary.fee)}</dd>
            <dt>Dana diterima</dt><dd>{money(challenge.summary.net)}</dd>
            <dt>Bank / rekening</dt><dd>{challenge.summary.account.bank} · {challenge.summary.account.number}</dd>
            <dt>Nama pemilik</dt><dd>{challenge.summary.account.name}</dd>
            <dt>Proyek</dt><dd>{challenge.summary.rows.map((row) => row.title).join(', ')}</dd>
          </dl>}
          <p>Periksa kode yang dikirim ke email akun. {expired ? 'Kode sudah kedaluwarsa.' : `Berlaku sampai ${date(challenge.expiresAt)}.`}</p>
          {challenge.purpose === 'payout' && pinInput('pin', 'PIN transaksi')}
          <label>Kode verifikasi email<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={form.code} onChange={change('code')} /></label>
          <button type="submit" disabled={busy || locked || expired}>{busy ? 'Memverifikasi...' : challenge.purpose === 'payout' ? 'Konfirmasi pencairan' : 'Verifikasi & simpan'}</button>
          <button type="button" disabled={busy} onClick={() => { setChallenge(null); setForm(empty); setMessage(''); }}>Batalkan / ubah rincian</button>
        </form> : <form onSubmit={request}>
          {mode === 'pin' && <>
            <h4>{status.hasPin ? 'Reset PIN transaksi' : 'Aktifkan PIN transaksi'}</h4>
            <p>Gunakan enam digit yang tidak berulang atau berurutan. {status.hasPin ? 'Reset PIN menunda pencairan selama 24 jam.' : 'PIN berbeda dari password login.'}</p>
            <label>Password akun<input type="password" autoComplete="current-password" required value={form.password} onChange={change('password')} /></label>
            {pinInput('newPin', 'PIN baru', 'new-password')}{pinInput('repeatPin', 'Ulangi PIN baru', 'new-password')}
          </>}
          {mode === 'account' && <>
            <h4>Daftarkan / perbarui rekening</h4>
            <p>Rekening baru atau diperbarui dapat digunakan setelah 24 jam. Kode email mengonfirmasi pilihan rekening Anda; nama pemilik akan diperiksa admin.</p>
            {!status.hasPin && <p>Aktifkan PIN terlebih dahulu.</p>}
            <label>Bank<input required maxLength={80} value={form.bank} onChange={change('bank')} placeholder="Contoh: BCA" /></label>
            <label>Nomor rekening<input required inputMode="numeric" pattern="[0-9]{6,30}" maxLength={30} value={form.number} onChange={change('number')} /></label>
            <label>Nama lengkap pemilik rekening<input required maxLength={150} value={form.name} onChange={change('name')} /></label>
            <label>Password akun<input type="password" autoComplete="current-password" required value={form.password} onChange={change('password')} /></label>
            {pinInput('pin', 'PIN transaksi')}
          </>}
          {mode === 'payout' && <>
            {!status.hasPin && <p>Aktifkan PIN dan daftarkan rekening sebelum pencairan.</p>}
            <p>{selected.length} proyek dipilih · Saldo tersedia: <strong>{money(available)}</strong></p>
            <label>Nominal pencairan<input type="number" min={1} max={available} step={1} placeholder={String(available)} value={form.amount} onChange={change('amount')} /></label>
            <label>Rekening tujuan<select required value={form.accountId} onChange={change('accountId')}>
              <option value="">Pilih rekening</option>
              {status.accounts.map((account) => <option key={account.id} value={account.id} disabled={account.available_at > now}>
                {account.bank} {account.number} — {account.name}{account.available_at > now ? ` (aktif ${date(account.available_at)})` : ''}
              </option>)}
            </select></label>
            <label>Catatan (opsional)<textarea maxLength={1000} rows={2} value={form.note} onChange={change('note')} /></label>
          </>}
          <button type="submit" disabled={busy || locked || (mode === 'payout' && (!status.hasPin || cooling || available <= 0)) || (mode === 'account' && !status.hasPin)}>
            {busy ? 'Mengirim kode...' : mode === 'payout' ? 'Periksa rincian & kirim kode' : 'Kirim kode verifikasi'}
          </button>
        </form>}
        {status.notifications.length > 0 && <details><summary>Aktivitas keamanan & pencairan</summary><ul>
          {status.notifications.map((item) => <li key={item.id}>{item.message} <small>{date(item.created_at)}</small></li>)}
        </ul></details>}
      </>}
    </section>
  );
}
