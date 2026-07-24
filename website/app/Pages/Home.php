<?php

use App\Features\Content\ArduflowContent;
use App\Support\View;

View::partial('Hero');
?>
<section class="section split">
    <div>
        <p class="eyebrow">Apa Itu Arduflow</p>
        <h2>Ekosistem belajar IoT berbasis visual programming.</h2>
    </div>
    <p>Arduflow memperkenalkan ArduFlow IDE sebagai produk utama, dilengkapi tutorial, dokumentasi, contoh project, dan workshop pendukung agar proses belajar Arduino lebih terarah.</p>
</section>
<section class="section">
    <p class="eyebrow">Masalah yang Diselesaikan</p>
    <h2>Belajar IoT dibuat lebih bertahap.</h2>
    <div class="problem-list">
        <?php foreach (ArduflowContent::problems() as $problem): ?>
            <div><?= e($problem) ?></div>
        <?php endforeach; ?>
    </div>
</section>
<section class="section">
    <p class="eyebrow">Akses IDE</p>
    <h2>Cara mendapatkan token ArduFlow IDE.</h2>
    <?php View::partial('AccessSteps', ['steps' => ArduflowContent::accessSteps()]); ?>
</section>
<section class="section">
    <p class="eyebrow">Program Pendukung</p>
    <h2>Workshop dan training sebagai jalur belajar terstruktur.</h2>
    <?php View::partial('CardGrid', ['items' => ArduflowContent::programs()]); ?>
</section>
