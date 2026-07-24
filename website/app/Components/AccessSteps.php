<?php

$steps = $steps ?? [];
?>
<div class="steps">
    <?php foreach ($steps as $index => $step): ?>
        <article class="step">
            <span><?= $index + 1 ?></span>
            <h3><?= e($step['title']) ?></h3>
            <p><?= e($step['text']) ?></p>
        </article>
    <?php endforeach; ?>
</div>
