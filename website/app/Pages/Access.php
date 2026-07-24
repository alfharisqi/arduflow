<?php

use App\Features\Content\ArduflowContent;
use App\Support\View;
?>
<section class="page-hero">
    <p class="eyebrow">Alur Akses</p>
    <h1>Daftar, konfirmasi, dapatkan token, lalu masuk IDE.</h1>
    <p>CTA utama website diarahkan ke pendaftaran karena IDE hanya dapat digunakan setelah pengguna memiliki token.</p>
</section>
<section class="section">
    <?php View::partial('AccessSteps', ['steps' => ArduflowContent::accessSteps()]); ?>
</section>
<section class="section narrow">
    <h2>Ajukan akses Arduflow</h2>
    <?php View::partial('LeadForm'); ?>
</section>
