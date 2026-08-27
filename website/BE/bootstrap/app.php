<?php

declare(strict_types=1);

use Arduflow\Api\Application;

$context = require __DIR__ . '/context.php';

return new Application(
    $context['config'],
    $context['connections'],
    $context['root'],
);
