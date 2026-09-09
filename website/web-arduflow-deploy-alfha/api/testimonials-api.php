<?php
declare(strict_types=1);

function afwSendJson(
    int $status,
    bool $success,
    string $message,
    array $data = [],
    array $errors = []
): void {
    http_response_code($status);

    $response = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== []) {
        $response['data'] = $data;
    }

    if ($errors !== []) {
        $response['errors'] = $errors;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function afwApplyCors(array $methods): void
{
    header('Content-Type: application/json; charset=utf-8');

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = [
        'https://arduflow.indobilliard.com',
        'https://www.arduflow.indobilliard.com',
        'https://web.arduflow.com',
    ];

    $isDevelopmentOrigin = preg_match(
        '#^http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):[0-9]+$#',
        $origin
    ) === 1;

    if ($isDevelopmentOrigin || in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    $allowedMethods = array_values(array_unique([...$methods, 'OPTIONS']));

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function afwReadJsonBody(string $emptyMessage = 'Request body tidak boleh kosong.'): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        afwSendJson(400, false, $emptyMessage);
    }

    try {
        $payload = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        afwSendJson(400, false, 'Format JSON tidak valid.', [
            'detail' => $exception->getMessage(),
        ]);
    }

    if (!is_array($payload)) {
        afwSendJson(400, false, 'Struktur JSON harus berupa object.');
    }

    return isset($payload['data']) && is_array($payload['data'])
        ? $payload['data']
        : $payload;
}

function afwPdo(): PDO
{
    $databasePath = dirname(__DIR__) . '/storage/database/arduflow.sqlite';
    $databaseDirectory = dirname($databasePath);

    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        afwSendJson(500, false, 'Folder database gagal dibuat.');
    }

    try {
        $pdo = new PDO('sqlite:' . $databasePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        $pdo->exec('PRAGMA busy_timeout = 5000');
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS testimonials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL DEFAULT "general",
                source_id TEXT NOT NULL DEFAULT "",
                user_id TEXT NOT NULL DEFAULT "",
                name TEXT NOT NULL DEFAULT "",
                email TEXT NOT NULL DEFAULT "",
                role TEXT NOT NULL DEFAULT "",
                quote TEXT NOT NULL DEFAULT "",
                rating INTEGER NOT NULL DEFAULT 5,
                consent_public INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT "Menunggu",
                admin_note TEXT NOT NULL DEFAULT "",
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT DEFAULT NULL
            )'
        );

        return $pdo;
    } catch (Throwable $exception) {
        error_log('Koneksi/testimonials SQLite gagal: ' . $exception->getMessage());

        afwSendJson(500, false, 'Koneksi database testimoni gagal.', [
            'detail' => $exception->getMessage(),
        ]);
    }
}

afwApplyCors(['GET', 'POST', 'PATCH', 'DELETE']);

const TESTIMONIAL_SELECT = 'id, source_type, source_id, user_id, name, email, role, quote, rating, consent_public, status, admin_note, created_at, updated_at';
const TESTIMONIAL_STATUSES = ['Menunggu', 'Disetujui', 'Ditolak', 'Archived'];

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'POST' && isset($_GET['_method'])) {
    $override = strtoupper((string) $_GET['_method']);

    if (in_array($override, ['PATCH', 'DELETE'], true)) {
        $method = $override;
    }
}

function testimonialsNow(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

function testimonialFromRow(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'sourceType' => (string) $row['source_type'],
        'sourceId' => (string) $row['source_id'],
        'userId' => (string) $row['user_id'],
        'name' => (string) $row['name'],
        'email' => (string) $row['email'],
        'role' => (string) $row['role'],
        'quote' => (string) $row['quote'],
        'rating' => (int) $row['rating'],
        'consentPublic' => (bool) $row['consent_public'],
        'status' => (string) $row['status'],
        'adminNote' => (string) $row['admin_note'],
        'createdAt' => (string) $row['created_at'],
        'updatedAt' => (string) $row['updated_at'],
    ];
}

function testimonialPayload(array $data, ?array $existing = null): array
{
    $status = trim(
        (string) ($data['status'] ?? $existing['status'] ?? 'Menunggu')
    );

    if (!in_array($status, TESTIMONIAL_STATUSES, true)) {
        $status = 'Menunggu';
    }

    return [
        'sourceType' => trim((string) ($data['sourceType'] ?? $data['source_type'] ?? $existing['sourceType'] ?? 'general')),
        'sourceId' => trim((string) ($data['sourceId'] ?? $data['source_id'] ?? $existing['sourceId'] ?? '')),
        'userId' => trim((string) ($data['userId'] ?? $data['user_id'] ?? $existing['userId'] ?? '')),
        'name' => trim((string) ($data['name'] ?? $existing['name'] ?? '')),
        'email' => strtolower(trim((string) ($data['email'] ?? $existing['email'] ?? ''))),
        'role' => trim((string) ($data['role'] ?? $existing['role'] ?? '')),
        'quote' => trim((string) ($data['quote'] ?? $existing['quote'] ?? '')),
        'rating' => max(1, min(5, (int) ($data['rating'] ?? $existing['rating'] ?? 5))),
        'consentPublic' => filter_var(
            $data['consentPublic']
                ?? $data['consent_public']
                ?? $existing['consentPublic']
                ?? false,
            FILTER_VALIDATE_BOOLEAN
        ),
        'status' => $status,
        'adminNote' => trim((string) ($data['adminNote'] ?? $data['admin_note'] ?? $existing['adminNote'] ?? '')),
    ];
}

function validateTestimonial(array $payload): array
{
    $errors = [];

    if ($payload['name'] === '') {
        $errors['name'] = 'Nama wajib diisi.';
    }

    if (
        $payload['email'] === ''
        || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)
    ) {
        $errors['email'] = 'Email wajib valid.';
    }

    $length = function_exists('mb_strlen')
        ? mb_strlen($payload['quote'])
        : strlen($payload['quote']);

    if ($length < 12) {
        $errors['quote'] = 'Testimoni minimal 12 karakter.';
    }

    if (!$payload['consentPublic']) {
        $errors['consentPublic'] = 'Izin tampil publik wajib disetujui.';
    }

    return $errors;
}

function findTestimonial(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare(
        'SELECT ' . TESTIMONIAL_SELECT . '
         FROM testimonials
         WHERE id = :id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([
        ':id' => $id,
    ]);

    $row = $statement->fetch();

    return $row === false
        ? null
        : testimonialFromRow($row);
}

function testimonialParams(array $payload, string $now): array
{
    return [
        ':source_type' => $payload['sourceType'],
        ':source_id' => $payload['sourceId'],
        ':user_id' => $payload['userId'],
        ':name' => $payload['name'],
        ':email' => $payload['email'],
        ':role' => $payload['role'],
        ':quote' => $payload['quote'],
        ':rating' => $payload['rating'],
        ':consent_public' => $payload['consentPublic'] ? 1 : 0,
        ':status' => $payload['status'],
        ':admin_note' => $payload['adminNote'],
        ':updated_at' => $now,
    ];
}

function testimonialStats(PDO $pdo): array
{
    $row = $pdo->query(
        'SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = "Menunggu" THEN 1 ELSE 0 END) AS waiting,
            SUM(CASE WHEN status = "Disetujui" THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN status = "Ditolak" THEN 1 ELSE 0 END) AS rejected
         FROM testimonials
         WHERE deleted_at IS NULL'
    )->fetch() ?: [];

    return [
        'total' => (int) ($row['total'] ?? 0),
        'waiting' => (int) ($row['waiting'] ?? 0),
        'approved' => (int) ($row['approved'] ?? 0),
        'rejected' => (int) ($row['rejected'] ?? 0),
    ];
}

try {
    $pdo = afwPdo();

    $id = isset($_GET['id']) && $_GET['id'] !== ''
        ? (int) $_GET['id']
        : null;

    if ($id !== null && $id <= 0) {
        afwSendJson(400, false, 'Parameter id tidak valid.');
    }

    if ($method === 'GET') {
        if ($id !== null) {
            $testimonial = findTestimonial($pdo, $id);

            if ($testimonial === null) {
                afwSendJson(
                    404,
                    false,
                    'Testimoni tidak ditemukan.'
                );
            }

            afwSendJson(
                200,
                true,
                'Detail testimoni berhasil diambil.',
                [
                    'testimonial' => $testimonial,
                ]
            );
        }

        $where = [
            'deleted_at IS NULL',
        ];

        $params = [];

        foreach (
            [
                'status' => 'status',
                'email' => 'email',
                'sourceType' => 'source_type',
                'sourceId' => 'source_id',
            ] as $queryKey => $column
        ) {
            $value = trim(
                (string) ($_GET[$queryKey] ?? '')
            );

            if ($value !== '') {
                $where[] = $column . ' = :' . $queryKey;
                $params[':' . $queryKey] = $value;
            }
        }

        $statement = $pdo->prepare(
            'SELECT ' . TESTIMONIAL_SELECT . '
             FROM testimonials
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY updated_at DESC, id DESC'
        );

        $statement->execute($params);

        $testimonials = [];

        while ($row = $statement->fetch()) {
            $testimonials[] = testimonialFromRow($row);
        }

        afwSendJson(
            200,
            true,
            'Data testimoni berhasil diambil.',
            [
                'testimonials' => $testimonials,
                'stats' => testimonialStats($pdo),
            ]
        );
    }

    if ($method === 'POST') {
        $payload = testimonialPayload(
            afwReadJsonBody(
                'Data testimoni tidak boleh kosong.'
            )
        );

        $payload['status'] = 'Menunggu';

        $errors = validateTestimonial($payload);

        if ($errors !== []) {
            afwSendJson(
                422,
                false,
                'Validasi testimoni gagal.',
                [],
                $errors
            );
        }

        $now = testimonialsNow();

        $params = testimonialParams(
            $payload,
            $now
        );

        $params[':created_at'] = $now;

        $statement = $pdo->prepare(
            'INSERT INTO testimonials (
                source_type,
                source_id,
                user_id,
                name,
                email,
                role,
                quote,
                rating,
                consent_public,
                status,
                admin_note,
                created_at,
                updated_at
            ) VALUES (
                :source_type,
                :source_id,
                :user_id,
                :name,
                :email,
                :role,
                :quote,
                :rating,
                :consent_public,
                :status,
                :admin_note,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute($params);

        afwSendJson(
            201,
            true,
            'Testimoni berhasil dikirim dan menunggu review admin.',
            [
                'testimonial' => findTestimonial(
                    $pdo,
                    (int) $pdo->lastInsertId()
                ),
            ]
        );
    }

    if ($method === 'PATCH') {
        if ($id === null) {
            afwSendJson(
                400,
                false,
                'Parameter id wajib diisi.'
            );
        }

        $existing = findTestimonial(
            $pdo,
            $id
        );

        if ($existing === null) {
            afwSendJson(
                404,
                false,
                'Testimoni tidak ditemukan.'
            );
        }

        $payload = testimonialPayload(
            afwReadJsonBody(
                'Data testimoni tidak boleh kosong.'
            ),
            $existing
        );

        $params = testimonialParams(
            $payload,
            testimonialsNow()
        );

        $params[':id'] = $id;

        $statement = $pdo->prepare(
            'UPDATE testimonials SET
                source_type = :source_type,
                source_id = :source_id,
                user_id = :user_id,
                name = :name,
                email = :email,
                role = :role,
                quote = :quote,
                rating = :rating,
                consent_public = :consent_public,
                status = :status,
                admin_note = :admin_note,
                updated_at = :updated_at
             WHERE id = :id
             AND deleted_at IS NULL'
        );

        $statement->execute($params);

        afwSendJson(
            200,
            true,
            'Testimoni berhasil diperbarui.',
            [
                'testimonial' => findTestimonial(
                    $pdo,
                    $id
                ),
            ]
        );
    }

    if ($method === 'DELETE') {
        if ($id === null) {
            afwSendJson(
                400,
                false,
                'Parameter id wajib diisi.'
            );
        }

        $now = testimonialsNow();

        $statement = $pdo->prepare(
            'UPDATE testimonials
             SET
                deleted_at = :deleted_at,
                updated_at = :updated_at
             WHERE id = :id
             AND deleted_at IS NULL'
        );

        $statement->execute([
            ':deleted_at' => $now,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        if ($statement->rowCount() === 0) {
            afwSendJson(
                404,
                false,
                'Testimoni tidak ditemukan.'
            );
        }

        afwSendJson(
            200,
            true,
            'Testimoni berhasil dihapus.',
            [
                'id' => $id,
            ]
        );
    }

    afwSendJson(
        405,
        false,
        'Method tidak diizinkan.'
    );
} catch (Throwable $exception) {
    afwSendJson(
        500,
        false,
        'Gagal memproses data testimoni.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}
