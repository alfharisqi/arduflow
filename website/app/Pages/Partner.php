<?php

use App\Features\Content\ArduflowContent;
?>
<section class="page-hero">
    <p class="eyebrow">Kredibilitas</p>
    <h1>Partner, testimoni, dan dokumentasi kegiatan.</h1>
    <p>Area ini disiapkan untuk menampilkan bukti kegiatan, hasil karya pengguna, testimoni, dan kolaborasi.</p>
</section>
<section class="section">
    <div class="logo-grid">
        <?php foreach (ArduflowContent::partners() as $partner): ?>
            <div><?= e($partner) ?></div>
        <?php endforeach; ?>
    </div>
</section>
