<?php $status = $_GET['status'] ?? null; ?>
<form class="lead-form" action="/leads" method="post">
    <?php if ($status === 'sent'): ?>
        <div class="notice success">Form berhasil dikirim. Admin akan menghubungi Anda.</div>
    <?php elseif ($status === 'invalid'): ?>
        <div class="notice error">Nama dan email wajib diisi.</div>
    <?php endif; ?>
    <label>
        Nama
        <input name="name" type="text" required>
    </label>
    <label>
        Email
        <input name="email" type="email" required>
    </label>
    <label>
        Nomor WhatsApp
        <input name="phone" type="text">
    </label>
    <label>
        Kebutuhan
        <select name="interest">
            <option value="akses">Akses Token IDE</option>
            <option value="workshop">Workshop</option>
            <option value="demo">Request Demo</option>
            <option value="kerja-sama">Kerja Sama</option>
        </select>
    </label>
    <label>
        Pesan
        <textarea name="message" rows="5"></textarea>
    </label>
    <button class="button" type="submit">Kirim Permintaan</button>
</form>
