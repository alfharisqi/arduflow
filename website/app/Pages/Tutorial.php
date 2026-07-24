<?php

use App\Features\Content\ArduflowContent;
use App\Support\View;
?>
<section class="page-hero">
    <p class="eyebrow">Tutorial dan Dokumentasi</p>
    <h1>Materi belajar Arduino dan IoT untuk pemula.</h1>
    <p>Tutorial membantu pengguna belajar secara bertahap dari konsep dasar sampai project nyata.</p>
</section>
<section class="section">
    <?php View::partial('CardGrid', ['items' => ArduflowContent::tutorials()]); ?>
</section>
