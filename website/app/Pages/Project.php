<?php

use App\Features\Content\ArduflowContent;
use App\Support\View;
?>
<section class="page-hero">
    <p class="eyebrow">Project Showcase</p>
    <h1>Contoh hasil karya yang bisa dipelajari pengguna.</h1>
    <p>Project showcase membangun kredibilitas dan memberi gambaran project Arduino/IoT yang dapat dibuat dengan Arduflow.</p>
</section>
<section class="section">
    <?php View::partial('CardGrid', ['items' => ArduflowContent::projects()]); ?>
</section>
