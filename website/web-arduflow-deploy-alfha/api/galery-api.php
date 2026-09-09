<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'https://arduflow.indobilliard.com',
    'https://www.arduflow.indobilliard.com',
];

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):[0-9]+$#',
    $origin
) === 1;

if (in_array($origin, $allowedOrigins, true) || $isLocalOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $statusCode, array $body): never
{
    http_response_code($statusCode);
    echo json_encode($body, JSON_FLAGS);
    exit;
}

function cleanText(mixed $value): string
{
    return trim((string) $value);
}

function stripDangerousHtml(string $html): string
{
    $html = preg_replace(
        '#<(script|style)\b[^>]*>.*?</\1>#is',
        '',
        $html
    ) ?? '';

    $html = preg_replace(
        '/\son\w+\s*=\s*(["\']).*?\1/i',
        '',
        $html
    ) ?? '';

    $html = preg_replace(
        '/\son\w+\s*=\s*[^\s>]+/i',
        '',
        $html
    ) ?? '';

    return trim($html);
}

function htmlToText(string $html): string
{
    return trim(
        html_entity_decode(
            strip_tags($html),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        )
    );
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    try {
        $data = json_decode(
            $raw,
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException $error) {
        respond(400, [
            'success' => false,
            'message' => 'JSON tidak valid.',
            'error' => $error->getMessage(),
        ]);
    }

    if (!is_array($data)) {
        respond(400, [
            'success' => false,
            'message' => 'JSON tidak valid.',
        ]);
    }

    return isset($data['data']) && is_array($data['data'])
        ? $data['data']
        : $data;
}

function getRequestId(): int
{
    $id = (int) (
        $_GET['id']
        ?? $_POST['id']
        ?? 0
    );

    if ($id <= 0) {
        respond(400, [
            'success' => false,
            'message' => 'Parameter id wajib berupa angka lebih dari 0.',
        ]);
    }

    return $id;
}

function galleryRowToPayload(array $row): array
{
    $payload = json_decode(
        (string) ($row['payload_json'] ?? ''),
        true
    );

    $payload = is_array($payload)
        ? $payload
        : [];

    $coverImage = $payload['coverImage'] ?? null;

    if (!is_array($coverImage)) {
        $coverImage = [
            'name' => $row['cover_original_name'] ?? null,
            'size' => (int) ($row['cover_size'] ?? 0),
            'type' => $row['cover_mime'] ?? null,
            'path' => $row['cover_path'] ?? null,
            'url' => $row['cover_url'] ?? null,
        ];
    }

    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'tag' => $row['tag'],
        'description' => $row['description'],
        'userName' => $row['user_name'],
        'eventDate' => $row['event_date'],
        'detailLink' => $row['detail_link'],
        'note' => $row['note'],
        'coverImage' => $coverImage,
        'coverPath' => $row['cover_path'],
        'coverUrl' => $row['cover_url'] ?? null,
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'payload' => $payload,
    ];
}

function resolveDatabasePath(
    string $projectRoot,
    array $databaseConfig
): string {
    $sqlite = $databaseConfig['sqlite'] ?? null;

    if (!is_array($sqlite)) {
        throw new RuntimeException(
            'Konfigurasi SQLite tidak ditemukan.'
        );
    }

    $path = trim(
        (string) ($sqlite['path'] ?? '')
    );

    if ($path === '') {
        throw new RuntimeException(
            'Path database SQLite belum dikonfigurasi.'
        );
    }

    $absolute =
        preg_match(
            '/^[A-Za-z]:[\\\\\/]/',
            $path
        ) === 1
        || str_starts_with($path, '/');

    if (!$absolute) {
        $path =
            $projectRoot
            . DIRECTORY_SEPARATOR
            . str_replace(
                ['/', '\\'],
                DIRECTORY_SEPARATOR,
                $path
            );
    }

    return $path;
}

function ensureGalleryStorage(
    string $projectRoot
): array {
    if (function_exists('ensureUploadStorage')) {
        return ensureUploadStorage(
            $projectRoot,
            'gallery'
        );
    }

    $path =
        $projectRoot
        . DIRECTORY_SEPARATOR
        . 'storage'
        . DIRECTORY_SEPARATOR
        . 'uploads'
        . DIRECTORY_SEPARATOR
        . 'gallery';

    if (
        !is_dir($path)
        && !mkdir($path, 0775, true)
        && !is_dir($path)
    ) {
        throw new RuntimeException(
            'Folder upload galeri tidak dapat dibuat.'
        );
    }

    if (!is_writable($path)) {
        throw new RuntimeException(
            'Folder upload galeri tidak memiliki izin tulis.'
        );
    }

    return [
        'path' => $path,
        'url' => '/uploads/gallery',
    ];
}

function prepareCoverUpload(
    array $storage
): array {
    $file =
        $_FILES['cover_image']
        ?? null;

    $result = [
        'file' => $file,
        'error' => null,
        'targetFile' => null,
        'coverPath' => null,
        'coverUrl' => null,
        'coverOriginalName' => null,
        'coverMime' => null,
        'coverSize' => null,
    ];

    if (
        !is_array($file)
        || (int) (
            $file['error']
            ?? UPLOAD_ERR_NO_FILE
        ) === UPLOAD_ERR_NO_FILE
    ) {
        return $result;
    }

    if (
        (int) $file['error']
        !== UPLOAD_ERR_OK
    ) {
        $result['error'] =
            'Upload cover gagal.';

        return $result;
    }

    $size =
        (int) (
            $file['size']
            ?? 0
        );

    if ($size <= 0) {
        $result['error'] =
            'File cover tidak valid.';

        return $result;
    }

    if ($size > MAX_COVER_SIZE) {
        $result['error'] =
            'Ukuran cover maksimal 5 MB.';

        return $result;
    }

    $tmp =
        (string) (
            $file['tmp_name']
            ?? ''
        );

    if (
        $tmp === ''
        || !is_uploaded_file($tmp)
    ) {
        $result['error'] =
            'File upload tidak valid.';

        return $result;
    }

    $mime =
        (string) (
            (new finfo(
                FILEINFO_MIME_TYPE
            ))->file($tmp)
            ?: ''
        );

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($allowed[$mime])) {
        $result['error'] =
            'Cover hanya boleh JPG, JPEG, PNG, atau WEBP.';

        return $result;
    }

    $fileName = sprintf(
        'gallery_%s_%s.%s',
        date('Ymd_His'),
        bin2hex(random_bytes(8)),
        $allowed[$mime]
    );

    $result['targetFile'] =
        $storage['path']
        . DIRECTORY_SEPARATOR
        . $fileName;

    $result['coverPath'] =
        'storage/uploads/gallery/'
        . $fileName;

    $result['coverUrl'] =
        rtrim(
            (string) $storage['url'],
            '/'
        )
        . '/'
        . $fileName;

    $result['coverOriginalName'] =
        basename(
            (string) (
                $file['name']
                ?? 'cover'
            )
        );

    $result['coverMime'] =
        $mime;

    $result['coverSize'] =
        $size;

    return $result;
}

function coverPayload(array $cover): ?array
{
    if (!$cover['coverPath']) {
        return null;
    }

    return [
        'name' =>
            $cover['coverOriginalName'],

        'size' =>
            (int) (
                $cover['coverSize']
                ?? 0
            ),

        'type' =>
            $cover['coverMime']
            ?? 'application/octet-stream',

        'path' =>
            $cover['coverPath'],

        'url' =>
            $cover['coverUrl'],
    ];
}

function existingCover(array $row): array
{
    return [
        'name' =>
            $row['cover_original_name']
            ?? null,

        'size' =>
            (int) (
                $row['cover_size']
                ?? 0
            ),

        'type' =>
            $row['cover_mime']
            ?? null,

        'path' =>
            $row['cover_path']
            ?? null,

        'url' =>
            $row['cover_url']
            ?? null,
    ];
}

function galleryDbParams(
    string $title,
    string $tag,
    string $description,
    string $userName,
    string $eventDate,
    ?string $detailLink,
    ?string $note,
    array $cover,
    string $status,
    string $payloadJson,
    string $now
): array {
    return [
        ':title' => $title,
        ':tag' => $tag,
        ':description' => $description,
        ':user_name' => $userName,
        ':event_date' => $eventDate,
        ':detail_link' => $detailLink,
        ':note' => $note,
        ':cover_path' => $cover['coverPath'],
        ':cover_url' => $cover['coverUrl'],
        ':cover_original_name' => $cover['coverOriginalName'],
        ':cover_mime' => $cover['coverMime'],
        ':cover_size' => $cover['coverSize'],
        ':status' => $status,
        ':payload_json' => $payloadJson,
        ':updated_at' => $now,
    ];
}

try {
    $method =
        $_SERVER['REQUEST_METHOD']
        ?? 'GET';

    if (
        $method === 'POST'
        && isset($_POST['_method'])
    ) {
        $override =
            strtoupper(
                (string) $_POST['_method']
            );

        if (
            in_array(
                $override,
                ['PUT', 'DELETE'],
                true
            )
        ) {
            $method = $override;
        }
    }

    if (
        !in_array(
            $method,
            [
                'GET',
                'POST',
                'PUT',
                'DELETE',
            ],
            true
        )
    ) {
        header(
            'Allow: GET, POST, PUT, DELETE, OPTIONS'
        );

        respond(405, [
            'success' => false,
            'message' => 'Method tidak diizinkan.',
        ]);
    }

    $projectRoot = dirname(__DIR__);
    $autoloadPath = $projectRoot . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    $envSupportPath = $projectRoot . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'Support' . DIRECTORY_SEPARATOR . 'Env.php';
    $configPath = $projectRoot . '/config/database.php';
    $imageStoragePath = $projectRoot . '/api/support/image-storage.php';

    if (is_file($autoloadPath)) {
        require_once $autoloadPath;
    } elseif (is_file($envSupportPath)) {
        require_once $envSupportPath;
    }

    if (class_exists(Env::class)) {
        Env::load($projectRoot . DIRECTORY_SEPARATOR . '.env');
    }

    if (file_exists($imageStoragePath)) {
        require_once $imageStoragePath;
    }

    if (!is_file($configPath)) {
        respond(500, [
            'success' => false,
            'message' =>
                'Konfigurasi database tidak ditemukan.',
            'data' => [
                'path' => $configPath,
            ],
        ]);
    }

    $databaseConfig =
        require $configPath;

    $databasePath =
        resolveDatabasePath(
            $projectRoot,
            $databaseConfig
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
            'Folder database tidak dapat dibuat: '
            . $databaseDirectory
        );
    }

    if (!is_writable($databaseDirectory)) {
        throw new RuntimeException(
            'Folder database tidak memiliki izin tulis: '
            . $databaseDirectory
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
        'PRAGMA foreign_keys = ON'
    );

    $pdo->exec(
        'PRAGMA busy_timeout = '
        . max(
            5000,
            (int) (
                $databaseConfig['sqlite']['busy_timeout_ms']
                ?? 5000
            )
        )
    );

    if ($method === 'GET') {
        $id =
            (int) (
                $_GET['id']
                ?? 0
            );

        if ($id > 0) {
            $statement = $pdo->prepare(
                'SELECT '
                . GALLERY_SELECT
                . '
                 FROM gallery_submissions
                 WHERE id = :id
                 LIMIT 1'
            );

            $statement->execute([
                ':id' => $id,
            ]);

            $row =
                $statement->fetch();

            if (!$row) {
                respond(404, [
                    'success' => false,
                    'message' =>
                        'Galeri tidak ditemukan.',
                ]);
            }

            respond(200, [
                'success' => true,
                'message' =>
                    'Detail galeri berhasil diambil.',
                'database' =>
                    $databasePath,
                'data' =>
                    galleryRowToPayload($row),
            ]);
        }

        $statement =
            $pdo->query(
                'SELECT '
                . GALLERY_SELECT
                . '
                 FROM gallery_submissions
                 ORDER BY id DESC'
            );

        $galleries = [];

        while (
            $row =
                $statement->fetch()
        ) {
            $galleries[] =
                galleryRowToPayload(
                    $row
                );
        }

        respond(200, [
            'success' => true,
            'message' =>
                'Data galeri berhasil diambil.',
            'database' =>
                $databasePath,
            'total' =>
                count($galleries),
            'data' =>
                $galleries,
        ]);
    }

    if ($method === 'DELETE') {
        $id =
            getRequestId();

        $statement =
            $pdo->prepare(
                'DELETE FROM gallery_submissions
                 WHERE id = :id'
            );

        $statement->execute([
            ':id' => $id,
        ]);

        if (
            $statement->rowCount()
            === 0
        ) {
            respond(404, [
                'success' => false,
                'message' =>
                    'Galeri tidak ditemukan.',
            ]);
        }

        respond(200, [
            'success' => true,
            'message' =>
                'Galeri berhasil dihapus.',
            'data' => [
                'id' => $id,
            ],
        ]);
    }

    $existing = null;
    $id = 0;

    if ($method === 'PUT') {
        $id =
            getRequestId();

        $statement =
            $pdo->prepare(
                'SELECT
                    cover_path,
                    cover_url,
                    cover_original_name,
                    cover_mime,
                    cover_size,
                    created_at
                 FROM gallery_submissions
                 WHERE id = :id
                 LIMIT 1'
            );

        $statement->execute([
            ':id' => $id,
        ]);

        $existing =
            $statement->fetch();

        if (!$existing) {
            respond(404, [
                'success' => false,
                'message' =>
                    'Galeri yang akan diedit tidak ditemukan.',
            ]);
        }
    }

    $input =
        stripos(
            $_SERVER['CONTENT_TYPE']
            ?? '',
            'application/json'
        ) !== false
            ? readJsonBody()
            : $_POST;

    $title =
        cleanText(
            $input['title']
            ?? ''
        );

    $tag =
        cleanText(
            $input['tag']
            ?? ''
        );

    $description =
        stripDangerousHtml(
            (string) (
                $input['description']
                ?? ''
            )
        );

    $userName =
        cleanText(
            $input['user_name']
            ?? $input['userName']
            ?? ''
        );

    $eventDate =
        cleanText(
            $input['event_date']
            ?? $input['eventDate']
            ?? ''
        );

    $detailLink =
        cleanText(
            $input['detail_link']
            ?? $input['detailLink']
            ?? ''
        );

    $note =
        cleanText(
            $input['note']
            ?? ''
        );

    $status =
        cleanText(
            $input['status']
            ?? 'draft'
        );

    $isDraft =
        $status === 'draft';

    $errors = [];

    if (
        !in_array(
            $status,
            [
                'draft',
                'published',
            ],
            true
        )
    ) {
        $errors['status'] =
            'Status hanya boleh draft atau published.';
    }

    if (!$isDraft && $title === '') {
        $errors['title'] =
            'Judul kegiatan wajib diisi.';
    }

    if (!$isDraft && $tag === '') {
        $errors['tag'] =
            'Tag kegiatan wajib dipilih.';
    }

    if (
        $tag !== ''
        && !in_array(
            $tag,
            [
                'Workshop',
                'Program',
                'Komunitas',
                'Partner',
                'Event',
                'Dokumentasi',
            ],
            true
        )
    ) {
        $errors['tag'] =
            'Tag kegiatan tidak valid.';
    }

    if (
        !$isDraft
        && htmlToText($description) === ''
    ) {
        $errors['description'] =
            'Deskripsi kegiatan wajib diisi.';
    }

    if (
        !$isDraft
        && $userName === ''
    ) {
        $errors['user_name'] =
            'Nama user wajib diisi.';
    }

    if (
        !$isDraft
        && $eventDate === ''
    ) {
        $errors['event_date'] =
            'Tanggal kegiatan wajib dipilih.';
    }

    if ($eventDate !== '') {
        $date =
            DateTimeImmutable::createFromFormat(
                'Y-m-d',
                $eventDate
            );

        if (
            $date === false
            || $date->format('Y-m-d')
                !== $eventDate
        ) {
            $errors['event_date'] =
                'Format tanggal kegiatan harus YYYY-MM-DD.';
        }
    }

    if (
        $detailLink !== ''
        && !filter_var(
            $detailLink,
            FILTER_VALIDATE_URL
        )
    ) {
        $errors['detail_link'] =
            'Link detail harus berupa URL yang valid.';
    }

    $galleryStorage =
        ensureGalleryStorage(
            $projectRoot
        );

    $cover =
        prepareCoverUpload(
            $galleryStorage
        );

    if ($cover['error'] !== null) {
        $errors['cover_image'] =
            $cover['error'];
    }

    if (
        !$isDraft
        && $method === 'POST'
        && !$cover['coverPath']
    ) {
        $errors['cover_image'] =
            'Cover kegiatan wajib diupload.';
    }

    if ($errors !== []) {
        respond(422, [
            'success' => false,
            'message' =>
                'Validasi data galeri gagal.',
            'errors' =>
                $errors,
        ]);
    }

    if ($isDraft) {
        $title =
            $title ?: 'Draft Galeri';

        $tag =
            $tag ?: 'Dokumentasi';

        $description =
            $description
            ?: 'Draft galeri belum memiliki deskripsi.';

        $userName =
            $userName ?: 'Admin';

        $eventDate =
            $eventDate
            ?: date('Y-m-d');
    }

    $coverImage =
        coverPayload($cover);

    if (
        $method === 'PUT'
        && $coverImage === null
        && is_array($existing)
    ) {
        $coverImage =
            existingCover(
                $existing
            );

        $cover['coverPath'] =
            $existing['cover_path'];

        $cover['coverUrl'] =
            $existing['cover_url'];

        $cover['coverOriginalName'] =
            $existing[
                'cover_original_name'
            ];

        $cover['coverMime'] =
            $existing['cover_mime'];

        $cover['coverSize'] =
            $existing['cover_size'];
    }

    if (
        $cover['targetFile']
        !== null
    ) {
        if (
            !move_uploaded_file(
                (string)
                    $cover['file']['tmp_name'],
                (string)
                    $cover['targetFile']
            )
        ) {
            throw new RuntimeException(
                'File cover gagal dipindahkan ke folder upload.'
            );
        }
    }

    $now =
        date(
            DateTimeInterface::ATOM
        );

    $detailLinkValue =
        $detailLink !== ''
            ? $detailLink
            : null;

    $noteValue =
        $note !== ''
            ? $note
            : null;

    $galleryPayload = [
        'title' => $title,
        'tag' => $tag,
        'description' => $description,
        'userName' => $userName,
        'eventDate' => $eventDate,
        'detailLink' => $detailLinkValue,
        'note' => $noteValue,
        'coverImage' => $coverImage,
        'status' => $status,
        'updatedAt' => $now,
    ];

    if ($method === 'POST') {
        $galleryPayload['createdAt'] =
            $now;
    }

    $payloadJson =
        json_encode(
            $galleryPayload,
            JSON_FLAGS
            | JSON_THROW_ON_ERROR
        );

    $params =
        galleryDbParams(
            $title,
            $tag,
            $description,
            $userName,
            $eventDate,
            $detailLinkValue,
            $noteValue,
            $cover,
            $status,
            $payloadJson,
            $now
        );

    if ($method === 'POST') {
        $statement =
            $pdo->prepare(
                'INSERT INTO gallery_submissions (
                    title,
                    tag,
                    description,
                    user_name,
                    event_date,
                    detail_link,
                    note,
                    cover_path,
                    cover_url,
                    cover_original_name,
                    cover_mime,
                    cover_size,
                    status,
                    payload_json,
                    created_at,
                    updated_at
                ) VALUES (
                    :title,
                    :tag,
                    :description,
                    :user_name,
                    :event_date,
                    :detail_link,
                    :note,
                    :cover_path,
                    :cover_url,
                    :cover_original_name,
                    :cover_mime,
                    :cover_size,
                    :status,
                    :payload_json,
                    :created_at,
                    :updated_at
                )'
            );

        $params[':created_at'] =
            $now;

        $statement->execute(
            $params
        );

        $galleryId =
            (int)
                $pdo->lastInsertId();

        respond(201, [
            'success' => true,

            'message' =>
                $status === 'published'
                    ? 'Galeri berhasil disimpan ke SQLite.'
                    : 'Draft galeri berhasil disimpan ke SQLite.',

            'database' =>
                $databasePath,

            'data' => [
                'id' =>
                    $galleryId,

                'title' =>
                    $title,

                'tag' =>
                    $tag,

                'description' =>
                    $description,

                'userName' =>
                    $userName,

                'eventDate' =>
                    $eventDate,

                'detailLink' =>
                    $detailLinkValue,

                'note' =>
                    $noteValue,

                'coverPath' =>
                    $cover['coverPath'],

                'coverUrl' =>
                    $cover['coverUrl'],

                'coverImage' =>
                    $coverImage,

                'status' =>
                    $status,

                'createdAt' =>
                    $now,

                'payload' =>
                    $galleryPayload,
            ],
        ]);
    }

    $statement =
        $pdo->prepare(
            'UPDATE gallery_submissions
             SET
                title = :title,
                tag = :tag,
                description = :description,
                user_name = :user_name,
                event_date = :event_date,
                detail_link = :detail_link,
                note = :note,
                cover_path = :cover_path,
                cover_url = :cover_url,
                cover_original_name = :cover_original_name,
                cover_mime = :cover_mime,
                cover_size = :cover_size,
                status = :status,
                payload_json = :payload_json,
                updated_at = :updated_at
             WHERE id = :id'
        );

    $params[':id'] =
        $id;

    $statement->execute(
        $params
    );

    respond(200, [
        'success' => true,
        'message' =>
            'Galeri berhasil diperbarui.',
        'database' =>
            $databasePath,
        'data' => [
            'id' =>
                $id,

            'coverPath' =>
                $cover['coverPath'],

            'coverUrl' =>
                $cover['coverUrl'],

            'coverImage' =>
                $coverImage,

            'payload' =>
                $galleryPayload,
        ],
    ]);
} catch (JsonException $error) {
    respond(400, [
        'success' => false,
        'message' => 'JSON tidak valid.',
        'error' => $error->getMessage(),
    ]);
} catch (PDOException $error) {
    respond(500, [
        'success' => false,
        'message' => 'Gagal mengakses SQLite.',
        'error' => $error->getMessage(),
    ]);
} catch (Throwable $error) {
    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error' => $error->getMessage(),
    ]);
}
