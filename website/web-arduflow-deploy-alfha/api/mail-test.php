<?php

declare(strict_types=1);

use Arduflow\Api\Services\MailService;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Env;

$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$isDevelopmentOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):[0-9]+$#',
    $origin
) === 1;
if ($origin !== '' && $isDevelopmentOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Mail-Test-Token');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';
if (!is_file($autoload)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'vendor/autoload.php tidak ditemukan.']);
    exit;
}
require $autoload;

Env::load($root . '/.env');
$expectedToken = trim((string) Env::get('MAIL_TEST_TOKEN', ''));
$providedToken = trim((string) ($_GET['token'] ?? $_SERVER['HTTP_X_MAIL_TEST_TOKEN'] ?? ''));
if ($expectedToken === '' || !hash_equals($expectedToken, $providedToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'MAIL_TEST_TOKEN diperlukan.']);
    exit;
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}
$to = trim((string) ($_GET['to'] ?? $input['to'] ?? ''));
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Parameter to harus email valid.']);
    exit;
}

$config = Config::fromDirectory($root . '/config');
$user = [
    'id' => 0,
    'name' => 'SMTP Test',
    'email' => $to,
];
$sent = (new MailService($config))->sendVerification($user, bin2hex(random_bytes(16)));

http_response_code($sent ? 200 : 503);
echo json_encode([
    'success' => $sent,
    'message' => $sent
        ? 'Email test dikirim. Cek inbox, spam, dan quarantine.'
        : 'Email test gagal. Cek storage/logs/app.log untuk detail MailService failed.',
    'config' => [
        'host' => (string) $config->get('mail.host'),
        'port' => (int) $config->get('mail.port'),
        'secure' => (string) $config->get('mail.secure', ''),
        'username' => (string) $config->get('mail.username', ''),
        'from' => (string) $config->get('mail.from', ''),
        'enabled' => (bool) $config->get('mail.enabled', true),
    ],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
