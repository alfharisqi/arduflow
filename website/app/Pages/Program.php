<?php

use App\Features\Content\ArduflowContent;
use App\Support\View;
?>
<section class="page-hero">
    <p class="eyebrow">Workshop dan Training</p>
    <h1>Program Arduflow sebagai pendukung ekosistem belajar.</h1>
    <p>Workshop ditempatkan sebagai jalur belajar terstruktur sekaligus akses untuk mendapatkan token IDE.</p>
</section>
<section class="section">
    <?php View::partial('CardGrid', ['items' => ArduflowContent::programs()]); ?>
</section>
