<?php

declare(strict_types=1);

require_once __DIR__ . '/../support/bootstrap.php';

afwApplyCors(['GET']);
afwRequireMethod('GET');

$pdo = afwPdo();
$session = afwCurrentUserSession($pdo, afwBearerToken());

afwSendJson(200, true, 'Session valid.', [
    'user' => afwUserResponse($session),
    'expires_at' => $session['expires_at'],
]);
