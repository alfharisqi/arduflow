<?php

declare(strict_types=1);

const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
];

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respondIde(int $status, array $payload): never
{
    http_response_code($status);

    echo json_encode(
        $payload,
        JSON_FLAGS
    );

    exit;
}

function jakartaIdeNow(): string
{
    static $timezone;

    $timezone ??= new DateTimeZone(
        'Asia/Jakarta'
    );

    return (
        new DateTimeImmutable(
            'now',
            $timezone
        )
    )->format(
        DateTimeInterface::ATOM
    );
}

function resolveIdeDatabasePath(
    string $projectRoot,
    array $config
): array {
    $sqlite =
        $config['sqlite']
        ?? null;

    if (!is_array($sqlite)) {
        throw new RuntimeException(
            'Konfigurasi SQLite tidak ditemukan.'
        );
    }

    $path = trim(
        (string) (
            $sqlite['path']
            ?? ''
        )
    );

    $busyTimeout = max(
        1000,
        (int) (
            $sqlite['busy_timeout_ms']
            ?? 15000
        )
    );

    if ($path === '') {
        throw new RuntimeException(
            'Path database SQLite belum dikonfigurasi.'
        );
    }

    $isAbsolute =
        preg_match(
            '/^[A-Za-z]:[\\\\\/]/',
            $path
        ) === 1
        || str_starts_with(
            $path,
            '/'
        );

    if (!$isAbsolute) {
        $path =
            $projectRoot
            . DIRECTORY_SEPARATOR
            . str_replace(
                [
                    '/',
                    '\\',
                ],
                DIRECTORY_SEPARATOR,
                $path
            );
    }

    return [
        $path,
        $busyTimeout,
    ];
}function getIdeConfig(
    PDO $pdo
): array {
    $row = $pdo->query(
        'SELECT
            title,
            price,
            currency,
            duration_days,
            is_active,
            description,
            updated_at
         FROM ide_config
         WHERE id = 1
         LIMIT 1'
    )->fetch() ?: [];

    return [
        'title' =>
            (string) (
                $row['title']
                ?? 'Akses ArduFlow IDE'
            ),

        'price' =>
            (int) (
                $row['price']
                ?? 150000
            ),

        'currency' =>
            (string) (
                $row['currency']
                ?? 'IDR'
            ),

        'durationDays' =>
            (int) (
                $row['duration_days']
                ?? 365
            ),

        'isActive' =>
            (int) (
                $row['is_active']
                ?? 1
            ) === 1,

        'description' =>
            (string) (
                $row['description']
                ?? ''
            ),

        'updatedAt' =>
            (string) (
                $row['updated_at']
                ?? ''
            ),
    ];
}

function readIdeInput(): array
{
    $raw =
        file_get_contents(
            'php://input'
        );

    if (
        $raw === false
        || trim($raw) === ''
    ) {
        return [];
    }

    try {
        $decoded = json_decode(
            $raw,
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException) {
        respondIde(
            400,
            [
                'success' => false,
                'message' =>
                    'JSON tidak valid.',
            ]
        );
    }

    if (!is_array($decoded)) {
        return [];
    }

    $incoming =
        $decoded['data']
        ?? $decoded;

    return is_array($incoming)
        ? $incoming
        : [];
}

try {
    $method = strtoupper(
        $_SERVER['REQUEST_METHOD']
        ?? 'GET'
    );

    if (
        !in_array(
            $method,
            [
                'GET',
                'POST',
                'PUT',
            ],
            true
        )
    ) {
        header(
            'Allow: GET, POST, PUT, OPTIONS'
        );

        respondIde(
            405,
            [
                'success' => false,
                'message' =>
                    'Method tidak diizinkan.',
            ]
        );
    }

    $projectRoot =
        dirname(__DIR__);

    $autoloadPath =
        $projectRoot
        . '/vendor/autoload.php';

    $configPath =
        $projectRoot
        . '/config/database.php';

    if (is_file($autoloadPath)) {
        require_once $autoloadPath;
    }

    if (
        class_exists(
            \Arduflow\Api\Support\Env::class
        )
    ) {
        \Arduflow\Api\Support\Env::load(
            $projectRoot
            . '/.env'
        );
    }

    if (!is_file($configPath)) {
        throw new RuntimeException(
            'File konfigurasi database tidak ditemukan.'
        );
    }

    [
        $databasePath,
        $busyTimeout,
    ] = resolveIdeDatabasePath(
        $projectRoot,
        require $configPath
    );

    $databaseDirectory =
        dirname($databasePath);

    if (
        !is_dir($databaseDirectory)
        && !mkdir(
            $databaseDirectory,
            0775,
            true
        )
        && !is_dir($databaseDirectory)
    ) {
        throw new RuntimeException(
            'Folder database gagal dibuat.'
        );
    }

    $pdo = new PDO(
        'sqlite:' . $databasePath,
        null,
        null,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,
        ]
    );

    $pdo->exec(
        'PRAGMA busy_timeout = '
        . $busyTimeout
    );

    if ($method === 'GET') {
        respondIde(
            200,
            [
                'success' => true,

                'message' =>
                    'Konfigurasi IDE berhasil diambil.',

                'data' => [
                    'config' =>
                        getIdeConfig(
                            $pdo
                        ),
                ],
            ]
        );
    }

    $incoming =
        readIdeInput();

    $current =
        getIdeConfig(
            $pdo
        );

    $title = trim(
        (string) (
            $incoming['title']
            ?? $current['title']
        )
    );

    $price =
        (int) (
            $incoming['price']
            ?? $current['price']
        );

    $durationDays =
        (int) (
            $incoming['durationDays']
            ?? $incoming['duration_days']
            ?? $current['durationDays']
        );

    $isActiveRaw =
        $incoming['isActive']
        ?? $incoming['is_active']
        ?? $current['isActive'];

    $isActive =
        filter_var(
            $isActiveRaw,
            FILTER_VALIDATE_BOOL
        )
            ? 1
            : 0;

    $description = trim(
        (string) (
            $incoming['description']
            ?? $current['description']
        )
    );

    $errors = [];

    if ($title === '') {
        $errors['title'] =
            'Judul produk IDE wajib diisi.';
    }

    if ($price < 0) {
        $errors['price'] =
            'Harga IDE tidak boleh negatif.';
    }

    if ($durationDays < 1) {
        $errors['durationDays'] =
            'Durasi akses minimal 1 hari.';
    }

    if ($errors !== []) {
        respondIde(
            422,
            [
                'success' => false,

                'message' =>
                    'Validasi konfigurasi IDE gagal.',

                'errors' =>
                    $errors,
            ]
        );
    }

    $statement =
        $pdo->prepare(
            'UPDATE ide_config SET
                title = :title,
                price = :price,
                duration_days = :duration_days,
                is_active = :is_active,
                description = :description,
                updated_at = :updated_at
             WHERE id = 1'
        );

    $statement->execute([
        ':title' =>
            $title,

        ':price' =>
            $price,

        ':duration_days' =>
            $durationDays,

        ':is_active' =>
            $isActive,

        ':description' =>
            $description,

        ':updated_at' =>
            jakartaIdeNow(),
    ]);

    respondIde(
        200,
        [
            'success' => true,

            'message' =>
                'Konfigurasi IDE berhasil disimpan.',

            'data' => [
                'config' =>
                    getIdeConfig(
                        $pdo
                    ),
            ],
        ]
    );
} catch (Throwable $error) {
    respondIde(
        500,
        [
            'success' => false,

            'message' =>
                'Gagal mengakses konfigurasi IDE.',

            'data' => [
                'detail' =>
                    $error->getMessage(),
            ],
        ]
    );
}
