<?php

declare(strict_types=1);

$requirements = [
    'PHP >= 8.1' => version_compare(PHP_VERSION, '8.1.0', '>='),
    'PDO' => extension_loaded('pdo'),
    'PDO SQLite' => extension_loaded('pdo_sqlite'),
    'PDO MySQL' => extension_loaded('pdo_mysql'),
    'OpenSSL' => extension_loaded('openssl'),
];

$failed = false;
foreach ($requirements as $label => $available) {
    printf("%-20s %s%s", $label, $available ? 'OK' : 'MISSING', PHP_EOL);
    $failed = $failed || !$available;
}

exit($failed ? 1 : 0);
