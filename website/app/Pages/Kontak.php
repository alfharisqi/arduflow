<?php

use App\Support\View;
?>
<section class="page-hero">
    <p class="eyebrow">Leads</p>
    <h1>Kontak admin, request demo, akses IDE, atau kerja sama.</h1>
    <p>Form ini mengumpulkan calon pengguna untuk akses token, workshop, demo sekolah, dan kerja sama komunitas.</p>
</section>
<section class="section narrow">
    <?php View::partial('LeadForm'); ?>
</section>
