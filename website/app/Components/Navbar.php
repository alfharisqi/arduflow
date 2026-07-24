<?php

use App\Features\Content\ArduflowContent;

$items = ArduflowContent::navigation();
?>
<header class="site-header">
    <a class="brand" href="/">
        <span class="brand-mark">AF</span>
        <span>Arduflow</span>
    </a>
    <nav class="nav" aria-label="Navigasi utama">
        <?php foreach ($items as $item): ?>
            <a class="<?= active($item['path']) ?>" href="<?= e($item['path']) ?>"><?= e($item['label']) ?></a>
        <?php endforeach; ?>
    </nav>
    <a class="button small" href="/akses">Daftar Akses</a>
</header>
