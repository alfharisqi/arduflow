<?php

$items = $items ?? [];
?>
<div class="card-grid">
    <?php foreach ($items as $item): ?>
        <article class="card">
            <?php if (!empty($item['category']) || !empty($item['level']) || !empty($item['type'])): ?>
                <p class="tag"><?= e($item['category'] ?? $item['level'] ?? $item['type']) ?></p>
            <?php endif; ?>
            <h3><?= e($item['title']) ?></h3>
            <p><?= e($item['text']) ?></p>
        </article>
    <?php endforeach; ?>
</div>
