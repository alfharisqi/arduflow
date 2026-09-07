<?php
declare(strict_types=1);

const PROJECT_JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
const PROJECT_SELECT = 'id, title, category, description, status, visibility, cover_image_name, cover_image_type, cover_image_size, cover_image_path, cover_image_url, project_file_name, project_file_type, project_file_size, project_file_path, project_file_url, circuit_image_name, circuit_image_type, circuit_image_size, circuit_image_path, circuit_image_url, component_images_json, payload_json, deleted_at, version, created_at, updated_at';

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
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$syncOutboxPath = __DIR__ . '/support/sync-outbox.php';
$mqttEventsPath = __DIR__ . '/support/mqtt-events.php';

if (is_file($syncOutboxPath)) {
    require_once $syncOutboxPath;
}

if (is_file($mqttEventsPath)) {
    require_once $mqttEventsPath;
}

if ($method === 'POST' && isset($_POST['_method'])) {
    $methodOverride = strtoupper((string) $_POST['_method']);

    if (in_array($methodOverride, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $methodOverride;
    }
}

if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    header('Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS');

    sendJson(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ]);
}

function sendJson(int $status, array $payload): never
{
    http_response_code($status);

    echo json_encode(
        $payload,
        PROJECT_JSON_FLAGS
    );

    exit;
}

function getProjectId(): ?int
{
    if (!isset($_GET['id']) || $_GET['id'] === '') {
        return null;
    }

    $id = filter_var(
        $_GET['id'],
        FILTER_VALIDATE_INT,
        [
            'options' => [
                'min_range' => 1,
            ],
        ]
    );

    if ($id === false) {
        throw new InvalidArgumentException(
            'ID proyek tidak valid.'
        );
    }

    return (int) $id;
}

function readJsonBody(): array
{
    $rawJson = file_get_contents(
        'php://input'
    );

    if (
        $rawJson === false
        || trim($rawJson) === ''
    ) {
        throw new InvalidArgumentException(
            'Body JSON tidak boleh kosong.'
        );
    }

    $data = json_decode(
        $rawJson,
        true,
        512,
        JSON_THROW_ON_ERROR
    );

    if (!is_array($data)) {
        throw new InvalidArgumentException(
            'Struktur JSON harus berupa object.'
        );
    }

    return isset($data['data'])
        && is_array($data['data'])
            ? $data['data']
            : $data;
}

function readProjectBody(): array
{
    $contentType = strtolower(
        (string) (
            $_SERVER['CONTENT_TYPE']
            ?? ''
        )
    );

    if (
        str_contains(
            $contentType,
            'multipart/form-data'
        )
    ) {
        $rawPayload = (string) (
            $_POST['payload']
            ?? $_POST['data']
            ?? ''
        );

        if (trim($rawPayload) === '') {
            throw new InvalidArgumentException(
                'Payload proyek tidak boleh kosong.'
            );
        }

        $data = json_decode(
            $rawPayload,
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        if (!is_array($data)) {
            throw new InvalidArgumentException(
                'Struktur payload proyek harus berupa object.'
            );
        }

        return isset($data['data'])
            && is_array($data['data'])
                ? $data['data']
                : $data;
    }

    return readJsonBody();
}

function resolveDatabasePath(
    string $projectRoot,
    array $databaseConfig
): array {
    $sqliteConfig =
        $databaseConfig['sqlite']
        ?? null;

    if (!is_array($sqliteConfig)) {
        throw new RuntimeException(
            'Konfigurasi SQLite tidak ditemukan.'
        );
    }

    $databasePath = trim(
        (string) (
            $sqliteConfig['path']
            ?? ''
        )
    );

    $busyTimeout = (int) (
        $sqliteConfig['busy_timeout_ms']
        ?? 15000
    );

    if ($databasePath === '') {
        throw new RuntimeException(
            'Path database SQLite belum dikonfigurasi.'
        );
    }

    $isWindowsAbsolutePath =
        preg_match(
            '/^[A-Za-z]:[\\\\\/]/',
            $databasePath
        ) === 1;

    $isUnixAbsolutePath =
        str_starts_with(
            $databasePath,
            '/'
        );

    if (
        !$isWindowsAbsolutePath
        && !$isUnixAbsolutePath
    ) {
        $databasePath =
            $projectRoot
            . DIRECTORY_SEPARATOR
            . str_replace(
                ['/', '\\'],
                DIRECTORY_SEPARATOR,
                $databasePath
            );
    }

    return [
        $databasePath,
        $busyTimeout,
    ];
}

function jakartaNow(): string
{
    static $timezone;

    $timezone ??=
        new DateTimeZone(
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

function hasStoredFile(
    ?array $file
): bool {
    return $file !== null
        && trim(
            (string) (
                $file['file_name']
                ?? $file['name']
                ?? ''
            )
        ) !== '';
}

function rowToProject(
    array $row,
    array $viewerAccess = []
): array {
    $payload = json_decode(
        (string) (
            $row['payload_json']
            ?? '{}'
        ),
        true
    );

    $payload =
        is_array($payload)
            ? $payload
            : [];

    $viewer =
        getViewerIdentityFromQuery();

    $viewerRatingIdentity = null;

    if (
        ($viewer['userId'] ?? null)
        !== null
    ) {
        $viewerRatingIdentity =
            'user:'
            . (int) $viewer['userId'];

    } elseif (
        ($viewer['email'] ?? '')
        !== ''
    ) {
        $viewerRatingIdentity =
            'email:'
            . strtolower(
                (string) $viewer['email']
            );
    }

    $ratingSummary =
        summarizeProjectRatings(
            $payload,
            $viewerRatingIdentity
        );

    $coverImage = [
        'file_name' =>
            $row['cover_image_name']
            ?? null,

        'file_type' =>
            $row['cover_image_type']
            ?? null,

        'file_size' =>
            isset(
                $row['cover_image_size']
            )
                ? (int)
                    $row['cover_image_size']
                : null,

        'file_path' =>
            $row['cover_image_path']
            ?? null,

        'file_url' =>
            $row['cover_image_url']
            ?? null,
    ];

    $projectFile = [
        'file_name' =>
            $row['project_file_name']
            ?? null,

        'file_type' =>
            $row['project_file_type']
            ?? null,

        'file_size' =>
            isset(
                $row['project_file_size']
            )
                ? (int)
                    $row['project_file_size']
                : null,

        'file_path' =>
            $row['project_file_path']
            ?? null,

        'file_url' =>
            $row['project_file_url']
            ?? null,
    ];

    $circuitImage = [
        'file_name' =>
            $row['circuit_image_name']
            ?? null,

        'file_type' =>
            $row['circuit_image_type']
            ?? null,

        'file_size' =>
            isset(
                $row['circuit_image_size']
            )
                ? (int)
                    $row['circuit_image_size']
                : null,

        'file_path' =>
            $row['circuit_image_path']
            ?? null,

        'file_url' =>
            $row['circuit_image_url']
            ?? null,
    ];

    $payloadCoverImage =
        isset($payload['coverImage'])
        && is_array(
            $payload['coverImage']
        )
            ? $payload['coverImage']
            : [];

    $payloadProjectFile =
        isset($payload['projectFile'])
        && is_array(
            $payload['projectFile']
        )
            ? $payload['projectFile']
            : [];

    $projectFiles =
        isset($payload['projectFiles'])
        && is_array(
            $payload['projectFiles']
        )
            ? $payload['projectFiles']
            : [];

    $payloadCircuitImage =
        isset($payload['circuitImage'])
        && is_array(
            $payload['circuitImage']
        )
            ? $payload['circuitImage']
            : [];

    $componentImages = json_decode(
        (string) (
            $row['component_images_json']
            ?? '[]'
        ),
        true
    );

    $componentImages =
        is_array($componentImages)
            ? $componentImages
            : [];

    return [
        'id' =>
            (int) $row['id'],

        'title' =>
            $row['title'],

        'category' =>
            $row['category'],

        'description' =>
            $row['description'],

        'status' =>
            $row['status'],

        'visibility' =>
            $row['visibility'],

        'coverImage' =>
            hasStoredFile($coverImage)
                ? array_replace(
                    $payloadCoverImage,
                    $coverImage
                )
                : (
                    $payload['coverImage']
                    ?? null
                ),

        'projectFile' =>
            hasStoredFile($projectFile)
                ? array_replace(
                    $payloadProjectFile,
                    $projectFile
                )
                : (
                    $payload['projectFile']
                    ?? null
                ),

        'projectFiles' =>
            $projectFiles,

        'circuitImage' =>
            hasStoredFile($circuitImage)
                ? array_replace(
                    $payloadCircuitImage,
                    $circuitImage
                )
                : (
                    $payload['circuitImage']
                    ?? null
                ),

        'ownerName' =>
            $payload['ownerName']
            ?? 'User',

        'ownerUsername' =>
            $payload['ownerUsername']
            ?? '-',

        'userId' =>
            $payload['userId']
            ?? null,

        'difficulty' =>
            $payload['difficulty']
            ?? '',

        'estimatedTime' =>
            $payload['estimatedTime']
            ?? '',

        'programmingLanguage' =>
            $payload['programmingLanguage']
            ?? '',

        'payment' =>
            $payload['payment']
            ?? null,

        'viewerAccess' => [
            'hasPurchased' =>
                (bool) (
                    $viewerAccess[
                        'hasPurchased'
                    ]
                    ?? false
                ),

            'purchaseStatus' =>
                $viewerAccess[
                    'purchaseStatus'
                ]
                ?? 'none',

            'entitlementId' =>
                $viewerAccess[
                    'entitlementId'
                ]
                ?? null,

            'transactionId' =>
                $viewerAccess[
                    'transactionId'
                ]
                ?? null,
        ],

        'hasPurchased' =>
            (bool) (
                $viewerAccess[
                    'hasPurchased'
                ]
                ?? false
            ),

        'tags' =>
            $payload['tags']
            ?? [],

        'componentImages' =>
            $componentImages,

        'tools' =>
            $payload['tools']
            ?? [],

        'nodes' =>
            $payload['nodes']
            ?? [],

        'steps' =>
            $payload['steps']
            ?? [],

        'viewer' =>
            $payload['viewer']
            ?? 0,

        'likes' =>
            $payload['likes']
            ?? 0,

        'saves' =>
            $payload['saves']
            ?? 0,

        'shares' =>
            $payload['shares']
            ?? 0,

        'comments' =>
            $ratingSummary[
                'reviewCount'
            ],

        'commentItems' =>
            $ratingSummary[
                'reviewItems'
            ],

        'averageRating' =>
            $ratingSummary[
                'averageRating'
            ],

        'ratingCount' =>
            $ratingSummary[
                'ratingCount'
            ],

        'viewerRating' =>
            $ratingSummary[
                'viewerRating'
            ],

        'viewerReview' =>
            $ratingSummary[
                'viewerReview'
            ],

        'categoryAverages' =>
            $ratingSummary[
                'categoryAverages'
            ],

        'ratingItems' =>
            $ratingSummary[
                'ratingItems'
            ],

        'createdAt' =>
            $row['created_at'],

        'updatedAt' =>
            $row['updated_at'],

        'payload' =>
            $payload,
    ];
}

function findProject(
    PDO $pdo,
    int $id
): ?array {
    $statement = $pdo->prepare(
        'SELECT '
        . PROJECT_SELECT
        . '
         FROM project_submissions
         WHERE id = :id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([
        ':id' => $id,
    ]);

    $row =
        $statement->fetch();

    return $row === false
        ? null
        : $row;
}

function slugifyProjectFileName(
    string $value
): string {
    $slug =
        strtolower(
            trim($value)
        );

    $slug =
        preg_replace(
            '/[^a-z0-9]+/i',
            '-',
            $slug
        )
        ?? '';

    $slug =
        trim(
            $slug,
            '-'
        );

    return $slug !== ''
        ? $slug
        : 'proyek';
}

function getProjectPayload(
    array $row
): array {
    $payload = json_decode(
        (string) (
            $row['payload_json']
            ?? '{}'
        ),
        true
    );

    return is_array($payload)
        ? $payload
        : [];
}

function saveProjectPayload(
    PDO $pdo,
    int $id,
    array $payload,
    ?string $now = null
): array {
    $now ??=
        jakartaNow();

    $json = json_encode(
        $payload,
        PROJECT_JSON_FLAGS
        | JSON_THROW_ON_ERROR
    );

    $statement = $pdo->prepare(
        'UPDATE project_submissions
         SET
            payload_json = :payload_json,
            updated_at = :updated_at
         WHERE id = :id'
    );

    $statement->execute([
        ':payload_json' =>
            $json,

        ':updated_at' =>
            $now,

        ':id' =>
            $id,
    ]);

    return [
        'json' =>
            $json,

        'updatedAt' =>
            $now,
    ];
}

function getStoredProjectFiles(
    array $row
): array {
    $payload =
        getProjectPayload($row);

    $files =
        isset($payload['projectFiles'])
        && is_array(
            $payload['projectFiles']
        )
            ? $payload['projectFiles']
            : [];

    if (
        $files === []
        && isset(
            $payload['projectFile']
        )
        && is_array(
            $payload['projectFile']
        )
    ) {
        $files[] = [
            'label' =>
                'File Proyek',

            'file' =>
                $payload['projectFile'],
        ];
    }

    if (
        $files === []
        && trim(
            (string) (
                $row['project_file_path']
                ?? ''
            )
        ) !== ''
    ) {
        $files[] = [
            'label' =>
                'File Proyek',

            'file' => [
                'file_name' =>
                    $row[
                        'project_file_name'
                    ]
                    ?? null,

                'file_path' =>
                    $row[
                        'project_file_path'
                    ]
                    ?? null,
            ],
        ];
    }

    return $files;
}

function buildStoredZip(
    array $files
): string {
    $centralDirectory = '';
    $zip = '';
    $offset = 0;
    $fileCount = 0;

    foreach (
        $files
        as $index => $entry
    ) {
        $file =
            is_array($entry)
            && isset($entry['file'])
            && is_array(
                $entry['file']
            )
                ? $entry['file']
                : $entry;

        $path = (string) (
            $file['file_path']
            ?? ''
        );

        if (
            $path === ''
            || !is_file($path)
        ) {
            continue;
        }

        $baseName =
            sanitizeStoredFileName(
                (string) (
                    $file[
                        'original_name'
                    ]
                    ?? $file[
                        'file_name'
                    ]
                    ?? 'file-'
                        . ($index + 1)
                )
            );

        $label =
            is_array($entry)
                ? slugifyProjectFileName(
                    (string) (
                        $entry['label']
                        ?? 'file-'
                            . ($index + 1)
                    )
                )
                : 'file-'
                    . ($index + 1);

        $extension =
            pathinfo(
                $baseName,
                PATHINFO_EXTENSION
            );

        $archiveName =
            sanitizeStoredFileName(
                $label
                . (
                    $extension !== ''
                        ? '.'
                            . strtolower(
                                $extension
                            )
                        : ''
                )
            );

        $content =
            file_get_contents(
                $path
            );

        if ($content === false) {
            continue;
        }

        $crc =
            crc32($content);

        $crc =
            $crc < 0
                ? $crc
                    + 4294967296
                : $crc;

        $size =
            strlen($content);

        $nameLength =
            strlen($archiveName);

        $localHeader =
            pack(
                'VvvvvvVVVvv',
                0x04034b50,
                20,
                0,
                0,
                0,
                0,
                $crc,
                $size,
                $size,
                $nameLength,
                0
            )
            . $archiveName;

        $zip .=
            $localHeader
            . $content;

        $centralDirectory .=
            pack(
                'VvvvvvvVVVvvvvvVV',
                0x02014b50,
                20,
                20,
                0,
                0,
                0,
                0,
                $crc,
                $size,
                $size,
                $nameLength,
                0,
                0,
                0,
                0,
                0,
                $offset
            )
            . $archiveName;

        $offset +=
            strlen($localHeader)
            + $size;

        $fileCount++;
    }

    if ($fileCount === 0) {
        return '';
    }

    $centralDirectorySize =
        strlen(
            $centralDirectory
        );

    $centralDirectoryOffset =
        strlen($zip);

    return $zip
        . $centralDirectory
        . pack(
            'VvvvvVVv',
            0x06054b50,
            0,
            0,
            $fileCount,
            $fileCount,
            $centralDirectorySize,
            $centralDirectoryOffset,
            0
        );
}

function sendProjectZipDownload(
    array $row
): never {
    $zipContent =
        buildStoredZip(
            getStoredProjectFiles(
                $row
            )
        );

    if ($zipContent === '') {
        sendJson(
            404,
            [
                'success' => false,
                'message' =>
                    'File proyek belum tersedia.',
            ]
        );
    }

    $fileName =
        slugifyProjectFileName(
            (string) (
                $row['title']
                ?? 'proyek'
            )
        )
        . '.zip';

    header(
        'Content-Type: application/zip'
    );

    header(
        'Content-Disposition: attachment; filename="'
        . $fileName
        . '"'
    );

    header(
        'Content-Length: '
        . strlen($zipContent)
    );

    header(
        'Cache-Control: no-store'
    );

    echo $zipContent;
    exit;
}

function updateProjectMetric(
    PDO $pdo,
    array $row,
    string $metric,
    int $delta
): array {
    if (
        !in_array(
            $metric,
            [
                'viewer',
                'likes',
                'saves',
                'shares',
                'comments',
            ],
            true
        )
    ) {
        throw new InvalidArgumentException(
            'Tipe interaksi proyek tidak valid.'
        );
    }

    $payload =
        getProjectPayload($row);

    $payload[$metric] =
        max(
            0,
            max(
                0,
                (int) (
                    $payload[$metric]
                    ?? 0
                )
            )
            + $delta
        );

    $saved =
        saveProjectPayload(
            $pdo,
            (int) $row['id'],
            $payload
        );

    $row['payload_json'] =
        $saved['json'];

    $row['updated_at'] =
        $saved['updatedAt'];

    return [
        'metric' =>
            $metric,

        'value' =>
            $payload[$metric],

        'row' =>
            $row,
    ];
}

function getRatingIdentity(
    array $ratingData
): string {
    $viewer =
        getViewerIdentityFromQuery();

    $userId =
        $viewer['userId']
        ?? $ratingData['userId']
        ?? $ratingData['user_id']
        ?? null;

    $email = trim(
        (string) (
            ($viewer['email'] ?? '')
            ?: (
                $ratingData['email']
                ?? $ratingData[
                    'authorEmail'
                ]
                ?? ''
            )
        )
    );

    if (
        $userId !== null
        && $userId !== ''
    ) {
        return 'user:'
            . (int) $userId;
    }

    if ($email !== '') {
        return 'email:'
            . strtolower($email);
    }

    throw new InvalidArgumentException(
        'Login diperlukan untuk memberi rating.'
    );
}

function normalizeRatingCategories(
    mixed $categories
): array {
    if (!is_array($categories)) {
        return [];
    }

    $normalized = [];

    foreach (
        $categories
        as $key => $value
    ) {
        $categoryKey =
            preg_replace(
                '/[^a-z0-9_-]+/i',
                '',
                (string) $key
            )
            ?? '';

        $categoryKey =
            trim($categoryKey);

        $ratingValue =
            (int) $value;

        if (
            $categoryKey === ''
            || $ratingValue < 1
            || $ratingValue > 5
        ) {
            continue;
        }

        $normalized[
            $categoryKey
        ] = $ratingValue;
    }

    return $normalized;
}

function normalizeProjectRatings(
    array $payload
): array {
    $ratings =
        $payload['ratingItems']
        ?? $payload['ratings']
        ?? [];

    if (!is_array($ratings)) {
        return [];
    }

    $now =
        jakartaNow();

    $normalized = [];

    foreach ($ratings as $item) {
        if (!is_array($item)) {
            continue;
        }

        $value = (int) (
            $item['value']
            ?? $item['rating']
            ?? 0
        );

        if (
            $value < 1
            || $value > 5
        ) {
            continue;
        }

        $normalized[] = [
            'identity' =>
                (string) (
                    $item['identity']
                    ?? ''
                ),

            'value' =>
                $value,

            'message' =>
                trim(
                    (string) (
                        $item['message']
                        ?? $item['comment']
                        ?? ''
                    )
                ),

            'categories' =>
                normalizeRatingCategories(
                    $item['categories']
                    ?? []
                ),

            'authorName' =>
                (string) (
                    $item['authorName']
                    ?? $item['userName']
                    ?? 'User'
                ),

            'authorEmail' =>
                (string) (
                    $item['authorEmail']
                    ?? $item['email']
                    ?? ''
                ),

            'createdAt' =>
                (string) (
                    $item['createdAt']
                    ?? $now
                ),

            'updatedAt' =>
                (string) (
                    $item['updatedAt']
                    ?? $item['createdAt']
                    ?? $now
                ),
        ];
    }

    return $normalized;
}

function summarizeProjectRatings(
    array $payload,
    ?string $viewerIdentity = null
): array {
    $ratings =
        normalizeProjectRatings(
            $payload
        );

    $count =
        count($ratings);

    $total = 0;
    $viewerRating = null;
    $viewerReview = null;
    $categoryTotals = [];
    $categoryCounts = [];
    $reviewItems = [];

    foreach (
        $ratings
        as $rating
    ) {
        $total +=
            (int) $rating['value'];

        if (
            $viewerIdentity !== null
            && (
                $rating['identity']
                ?? ''
            ) === $viewerIdentity
        ) {
            $viewerRating =
                (int) $rating['value'];

            $viewerReview =
                $rating;
        }

        if (
            trim(
                (string) (
                    $rating['message']
                    ?? ''
                )
            ) !== ''
        ) {
            $reviewItems[] =
                $rating;
        }

        foreach (
            $rating['categories']
            ?? []
            as $key => $value
        ) {
            $categoryTotals[$key] =
                (
                    $categoryTotals[$key]
                    ?? 0
                )
                + (int) $value;

            $categoryCounts[$key] =
                (
                    $categoryCounts[$key]
                    ?? 0
                )
                + 1;
        }
    }

    $categoryAverages = [];

    foreach (
        $categoryTotals
        as $key => $value
    ) {
        $categoryAverages[$key] =
            round(
                $value
                / max(
                    1,
                    $categoryCounts[$key]
                    ?? 1
                ),
                1
            );
    }

    return [
        'averageRating' =>
            $count > 0
                ? round(
                    $total / $count,
                    1
                )
                : 0,

        'ratingCount' =>
            $count,

        'viewerRating' =>
            $viewerRating,

        'viewerReview' =>
            $viewerReview,

        'categoryAverages' =>
            $categoryAverages,

        'reviewCount' =>
            count($reviewItems),

        'reviewItems' =>
            $reviewItems,

        'ratingItems' =>
            $ratings,
    ];
}

function updateProjectRating(
    PDO $pdo,
    array $row,
    array $ratingData
): array {
    $value = (int) (
        $ratingData['value']
        ?? $ratingData['rating']
        ?? 0
    );

    if (
        $value < 1
        || $value > 5
    ) {
        throw new InvalidArgumentException(
            'Rating harus bernilai 1 sampai 5.'
        );
    }

    $message = trim(
        (string) (
            $ratingData['message']
            ?? $ratingData['comment']
            ?? ''
        )
    );

    $messageLength =
        function_exists('mb_strlen')
            ? mb_strlen($message)
            : strlen($message);

    if ($messageLength > 1000) {
        throw new InvalidArgumentException(
            'Komentar maksimal 1000 karakter.'
        );
    }

    $identity =
        getRatingIdentity(
            $ratingData
        );

    $payload =
        getProjectPayload($row);

    $ratings =
        normalizeProjectRatings(
            $payload
        );

    $now =
        jakartaNow();

    $updated = false;

    foreach (
        $ratings
        as &$rating
    ) {
        if (
            (
                $rating['identity']
                ?? ''
            ) !== $identity
        ) {
            continue;
        }

        $rating['value'] =
            $value;

        $rating['message'] =
            $message;

        $rating['categories'] =
            normalizeRatingCategories(
                $ratingData[
                    'categories'
                ]
                ?? []
            );

        $rating['authorName'] =
            trim(
                (string) (
                    $ratingData[
                        'authorName'
                    ]
                    ?? $ratingData[
                        'userName'
                    ]
                    ?? $rating[
                        'authorName'
                    ]
                    ?? 'User'
                )
            );

        $rating['authorEmail'] =
            trim(
                (string) (
                    $ratingData[
                        'authorEmail'
                    ]
                    ?? $ratingData[
                        'email'
                    ]
                    ?? $rating[
                        'authorEmail'
                    ]
                    ?? ''
                )
            );

        $rating['updatedAt'] =
            $now;

        $updated = true;
        break;
    }

    unset($rating);

    if (!$updated) {
        $ratings[] = [
            'identity' =>
                $identity,

            'value' =>
                $value,

            'message' =>
                $message,

            'categories' =>
                normalizeRatingCategories(
                    $ratingData[
                        'categories'
                    ]
                    ?? []
                ),

            'authorName' =>
                trim(
                    (string) (
                        $ratingData[
                            'authorName'
                        ]
                        ?? $ratingData[
                            'userName'
                        ]
                        ?? 'User'
                    )
                ),

            'authorEmail' =>
                trim(
                    (string) (
                        $ratingData[
                            'authorEmail'
                        ]
                        ?? $ratingData[
                            'email'
                        ]
                        ?? ''
                    )
                ),

            'createdAt' =>
                $now,

            'updatedAt' =>
                $now,
        ];
    }

    $summary =
        summarizeProjectRatings(
            [
                'ratingItems' =>
                    $ratings,
            ],
            $identity
        );

    $payload['ratingItems'] =
        $ratings;

    $payload['averageRating'] =
        $summary[
            'averageRating'
        ];

    $payload['ratingCount'] =
        $summary[
            'ratingCount'
        ];

    $payload['comments'] =
        $summary[
            'reviewCount'
        ];

    unset(
        $payload['commentItems'],
        $payload['commentList']
    );

    $saved =
        saveProjectPayload(
            $pdo,
            (int) $row['id'],
            $payload,
            $now
        );

    $row['payload_json'] =
        $saved['json'];

    $row['updated_at'] =
        $saved['updatedAt'];

    $summary['row'] =
        $row;

    return $summary;
}

function deleteProjectRating(
    PDO $pdo,
    array $row,
    array $ratingData
): array {
    $identity =
        getRatingIdentity(
            $ratingData
        );

    $payload =
        getProjectPayload($row);

    $ratings =
        array_values(
            array_filter(
                normalizeProjectRatings(
                    $payload
                ),
                static fn(
                    array $rating
                ): bool =>
                    (
                        $rating['identity']
                        ?? ''
                    ) !== $identity
            )
        );

    $summary =
        summarizeProjectRatings(
            [
                'ratingItems' =>
                    $ratings,
            ],
            $identity
        );

    $payload['ratingItems'] =
        $ratings;

    $payload['averageRating'] =
        $summary[
            'averageRating'
        ];

    $payload['ratingCount'] =
        $summary[
            'ratingCount'
        ];

    $payload['comments'] =
        $summary[
            'reviewCount'
        ];

    unset(
        $payload['commentItems'],
        $payload['commentList']
    );

    $saved =
        saveProjectPayload(
            $pdo,
            (int) $row['id'],
            $payload
        );

    $row['payload_json'] =
        $saved['json'];

    $row['updated_at'] =
        $saved['updatedAt'];

    $summary['row'] =
        $row;

    return $summary;
}

function getViewerIdentityFromQuery(): array
{
    static $viewer;

    if ($viewer !== null) {
        return $viewer;
    }

    $userId =
        $_GET['userId']
        ?? $_GET['user_id']
        ?? null;

    $email = trim(
        (string) (
            $_GET['email']
            ?? $_GET['userEmail']
            ?? $_GET['user_email']
            ?? ''
        )
    );

    return $viewer = [
        'userId' =>
            $userId === null
            || $userId === ''
                ? null
                : (int) $userId,

        'email' =>
            $email,
    ];
}

function getProjectViewerAccess(
    PDO $pdo,
    int $projectId
): array {
    $viewer =
        getViewerIdentityFromQuery();

    $userId =
        $viewer['userId'];

    $email =
        $viewer['email'];

    $access = [
        'hasPurchased' => false,
        'purchaseStatus' => 'none',
        'entitlementId' => null,
        'transactionId' => null,
    ];

    if (
        $userId === null
        && $email === ''
    ) {
        return $access;
    }

    $where = [
        'product_type = "project"',
        'product_id = :project_id',
        'status = "active"',
        'deleted_at IS NULL',
    ];

    $params = [
        ':project_id' =>
            $projectId,
    ];

    if (
        $userId !== null
        && $email !== ''
    ) {
        $where[] =
            '(user_id = :user_id
              OR email = :email COLLATE NOCASE)';

        $params[':user_id'] =
            $userId;

        $params[':email'] =
            $email;

    } elseif ($userId !== null) {
        $where[] =
            'user_id = :user_id';

        $params[':user_id'] =
            $userId;

    } else {
        $where[] =
            'email = :email COLLATE NOCASE';

        $params[':email'] =
            $email;
    }

    $statement = $pdo->prepare(
        'SELECT
            id,
            transaction_id,
            status
         FROM user_entitlements
         WHERE '
        . implode(
            ' AND ',
            $where
        )
        . '
         ORDER BY
            updated_at DESC,
            id DESC
         LIMIT 1'
    );

    $statement->execute(
        $params
    );

    $row =
        $statement->fetch();

    if ($row === false) {
        return $access;
    }

    return [
        'hasPurchased' =>
            true,

        'purchaseStatus' =>
            $row['status']
            ?? 'active',

        'entitlementId' =>
            isset($row['id'])
                ? (int) $row['id']
                : null,

        'transactionId' =>
            isset(
                $row['transaction_id']
            )
            && $row['transaction_id']
                !== null
                ? (int)
                    $row[
                        'transaction_id'
                    ]
                : null,
    ];
}

function validateProject(
    array $project
): array {
    $errors = [];

    if (
        trim(
            (string) (
                $project['title']
                ?? ''
            )
        ) === ''
    ) {
        $errors['title'] =
            'Judul proyek wajib diisi.';
    }

    if (
        trim(
            (string) (
                $project['category']
                ?? ''
            )
        ) === ''
    ) {
        $errors['category'] =
            'Kategori proyek wajib diisi.';
    }

    if (
        trim(
            (string) (
                $project['description']
                ?? ''
            )
        ) === ''
    ) {
        $errors['description'] =
            'Deskripsi proyek wajib diisi.';
    }

    return $errors;
}

function extractCoverImage(
    array $project,
    array $fallbackStorage
): ?array {
    $coverImageData = [];

    foreach (
        [
            'coverImage',
            'cover_image',
            'image',
            'thumbnail',
        ] as $key
    ) {
        if (
            isset($project[$key])
            && is_array(
                $project[$key]
            )
        ) {
            $coverImageData =
                $project[$key];

            break;
        }
    }

    return function_exists(
        'normalizeStoredImage'
    )
        ? normalizeStoredImage(
            $coverImageData,
            $fallbackStorage,
            'project-cover'
        )
        : null;
}

function getUploadedFile(
    string $field
): ?array {
    $file =
        $_FILES[$field]
        ?? null;

    if (!is_array($file)) {
        return null;
    }

    $error = (int) (
        $file['error']
        ?? UPLOAD_ERR_NO_FILE
    );

    if (
        $error
        === UPLOAD_ERR_NO_FILE
    ) {
        return null;
    }

    if ($error !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException(
            'Upload file gagal. Kode error: '
            . $error
        );
    }

    return $file;
}

function getUploadedFileAtIndex(
    string $field,
    int $index
): ?array {
    $files =
        $_FILES[$field]
        ?? null;

    if (
        !is_array($files)
        || !isset($files['name'])
        || !is_array(
            $files['name']
        )
    ) {
        return null;
    }

    $error = (int) (
        $files['error'][$index]
        ?? UPLOAD_ERR_NO_FILE
    );

    if (
        $error
        === UPLOAD_ERR_NO_FILE
    ) {
        return null;
    }

    if ($error !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException(
            'Upload file gagal. Kode error: '
            . $error
        );
    }

    return [
        'name' =>
            $files['name'][$index]
            ?? '',

        'type' =>
            $files['type'][$index]
            ?? '',

        'tmp_name' =>
            $files['tmp_name'][$index]
            ?? '',

        'error' =>
            $error,

        'size' =>
            $files['size'][$index]
            ?? 0,
    ];
}

function detectUploadedMimeType(
    array $file
): string {
    static $finfo;

    $tmpName = (string) (
        $file['tmp_name']
        ?? ''
    );

    if (
        $tmpName !== ''
        && is_file($tmpName)
        && class_exists('finfo')
    ) {
        $finfo ??=
            new finfo(
                FILEINFO_MIME_TYPE
            );

        $mimeType =
            $finfo->file(
                $tmpName
            );

        if (
            is_string($mimeType)
            && $mimeType !== ''
        ) {
            return $mimeType;
        }
    }

    return (string) (
        $file['type']
        ?? 'application/octet-stream'
    );
}

function storeUploadedFile(
    array $file,
    array $storage,
    string $prefix,
    array $allowedExtensions,
    int $maxBytes,
    bool $mustBeImage = false
): array {
    $originalName =
        sanitizeStoredFileName(
            (string) (
                $file['name']
                ?? 'upload.bin'
            )
        );

    $extension =
        strtolower(
            pathinfo(
                $originalName,
                PATHINFO_EXTENSION
            )
        );

    $size = (int) (
        $file['size']
        ?? 0
    );

    $tmpName = (string) (
        $file['tmp_name']
        ?? ''
    );

    $mimeType =
        detectUploadedMimeType(
            $file
        );

    if (
        $extension === ''
        || !in_array(
            $extension,
            $allowedExtensions,
            true
        )
    ) {
        throw new InvalidArgumentException(
            'Format file tidak didukung.'
        );
    }

    if (
        $size <= 0
        || $size > $maxBytes
    ) {
        throw new InvalidArgumentException(
            'Ukuran file tidak valid atau melebihi batas.'
        );
    }

    if (
        $mustBeImage
        && !str_starts_with(
            strtolower($mimeType),
            'image/'
        )
    ) {
        throw new InvalidArgumentException(
            'File harus berupa gambar.'
        );
    }

    if (
        $tmpName === ''
        || !is_uploaded_file(
            $tmpName
        )
    ) {
        throw new InvalidArgumentException(
            'File upload tidak valid.'
        );
    }

    $storedName =
        sanitizeStoredFileName(
            $prefix
            . '-'
            . bin2hex(
                random_bytes(8)
            )
            . '.'
            . $extension
        );

    $absolutePath =
        rtrim(
            (string) $storage['path'],
            DIRECTORY_SEPARATOR
        )
        . DIRECTORY_SEPARATOR
        . $storedName;

    if (
        !move_uploaded_file(
            $tmpName,
            $absolutePath
        )
    ) {
        throw new RuntimeException(
            'File upload tidak dapat disimpan.'
        );
    }

    return [
        'file_name' =>
            $storedName,

        'original_name' =>
            $originalName,

        'file_type' =>
            $mimeType,

        'file_size' =>
            $size,

        'file_path' =>
            $absolutePath,

        'file_url' =>
            rtrim(
                (string) $storage['url'],
                '/'
            )
            . '/'
            . $storedName,
    ];
}

function storeUploadedField(
    string $field,
    array $storage,
    string $prefix,
    array $extensions,
    int $maxBytes,
    bool $image = false
): ?array {
    $file =
        getUploadedFile(
            $field
        );

    return $file === null
        ? null
        : storeUploadedFile(
            $file,
            $storage,
            $prefix,
            $extensions,
            $maxBytes,
            $image
        );
}

function storeUploadedProjectFiles(
    array $storage,
    array $projectFiles
): array {
    $files = [];

    foreach (
        $projectFiles
        as $index => $projectFile
    ) {
        $uploadedFile =
            getUploadedFileAtIndex(
                'project_files',
                (int) $index
            );

        $existingFile =
            is_array($projectFile)
            && isset(
                $projectFile['file']
            )
            && is_array(
                $projectFile['file']
            )
                ? $projectFile['file']
                : null;

        $storedFile =
            $uploadedFile === null
                ? $existingFile
                : storeUploadedFile(
                    $uploadedFile,
                    $storage,
                    'project-file',
                    [
                        'json',
                        'flow',
                        'schema',
                        'txt',
                        'md',
                        'ino',
                        'zip',
                    ],
                    10 * 1024 * 1024
                );

        if ($storedFile === null) {
            continue;
        }

        $files[] = [
            'id' =>
                is_array(
                    $projectFile
                )
                    ? (
                        $projectFile['id']
                        ?? null
                    )
                    : null,

            'label' =>
                is_array(
                    $projectFile
                )
                    ? trim(
                        (string) (
                            $projectFile[
                                'label'
                            ]
                            ?? ''
                        )
                    )
                    : '',

            'file' =>
                $storedFile,
        ];
    }

    return $files;
}

function storeUploadedIndexedImages(
    array $storage,
    array $items,
    string $field,
    string $prefix
): array {
    $images = [];

    foreach (
        $items
        as $index => $item
    ) {
        $uploadedFile =
            getUploadedFileAtIndex(
                $field,
                (int) $index
            );

        $existingImage =
            is_array($item)
            && isset($item['image'])
            && is_array(
                $item['image']
            )
                ? $item['image']
                : null;

        $images[$index] =
            $uploadedFile === null
                ? $existingImage
                : storeUploadedFile(
                    $uploadedFile,
                    $storage,
                    $prefix,
                    [
                        'jpg',
                        'jpeg',
                        'png',
                        'webp',
                    ],
                    2 * 1024 * 1024,
                    true
                );
    }

    return $images;
}

function applyIndexedImages(
    array $items,
    array $images
): array {
    foreach (
        $items
        as $index => &$item
    ) {
        $item =
            is_array($item)
                ? $item
                : [
                    'name' =>
                        (string) $item,
                ];

        if (
            isset($images[$index])
            && is_array(
                $images[$index]
            )
        ) {
            $item['image'] =
                $images[$index];
        } else {
            unset(
                $item['image']
            );
        }
    }

    unset($item);

    return array_values($items);
}

function projectStorage(
    string $projectRoot
): array {
    static $storage;

    if ($storage !== null) {
        return $storage;
    }

    if (
        function_exists(
            'ensureUploadStorage'
        )
    ) {
        return $storage =
            ensureUploadStorage(
                $projectRoot,
                'projects'
            );
    }

    $path =
        $projectRoot
        . DIRECTORY_SEPARATOR
        . 'storage'
        . DIRECTORY_SEPARATOR
        . 'uploads'
        . DIRECTORY_SEPARATOR
        . 'projects';

    if (
        !is_dir($path)
        && !mkdir(
            $path,
            0775,
            true
        )
        && !is_dir($path)
    ) {
        throw new RuntimeException(
            'Folder upload proyek tidak dapat dibuat.'
        );
    }

    return $storage = [
        'path' =>
            $path,

        'url' =>
            '/uploads/projects',
    ];
}

try {
    $projectRoot =
        dirname(__DIR__);

    $autoloadPath =
        $projectRoot
        . DIRECTORY_SEPARATOR
        . 'vendor'
        . DIRECTORY_SEPARATOR
        . 'autoload.php';

    $configPath =
        $projectRoot
        . '/config/database.php';

    $imageStoragePath =
        $projectRoot
        . '/api/support/image-storage.php';

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
            . DIRECTORY_SEPARATOR
            . '.env'
        );
    }

    if (
        file_exists(
            $imageStoragePath
        )
    ) {
        require_once $imageStoragePath;
    }

    if (!file_exists($configPath)) {
        sendJson(
            500,
            [
                'success' => false,

                'message' =>
                    'Konfigurasi database tidak ditemukan.',

                'data' => [
                    'path' =>
                        $configPath,
                ],
            ]
        );
    }

    $databaseConfig =
        require $configPath;

    [
        $databasePath,
        $busyTimeout,
    ] = resolveDatabasePath(
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
            'Folder database tidak dapat dibuat.'
        );
    }

    if (
        !is_writable(
            $databaseDirectory
        )
    ) {
        throw new RuntimeException(
            'Folder database tidak memiliki izin tulis.'
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
            15000,
            $busyTimeout
        )
    );

    $projectId =
        getProjectId();

    if ($method === 'GET') {
        if ($projectId !== null) {
            $row =
                findProject(
                    $pdo,
                    $projectId
                );

            if ($row === null) {
                sendJson(
                    404,
                    [
                        'success' => false,
                        'message' =>
                            'Proyek tidak ditemukan.',
                    ]
                );
            }

            if (
                (
                    $_GET['action']
                    ?? ''
                ) === 'download'
            ) {
                sendProjectZipDownload(
                    $row
                );
            }

            sendJson(
                200,
                [
                    'success' => true,

                    'message' =>
                        'Detail proyek berhasil diambil.',

                    'data' =>
                        rowToProject(
                            $row,
                            getProjectViewerAccess(
                                $pdo,
                                $projectId
                            )
                        ),
                ]
            );
        }

        $statement = $pdo->query(
            'SELECT '
            . PROJECT_SELECT
            . '
             FROM project_submissions
             WHERE deleted_at IS NULL
             ORDER BY id DESC'
        );

        $projects = [];

        while (
            $row =
                $statement->fetch()
        ) {
            $projects[] =
                rowToProject($row);
        }

        sendJson(
            200,
            [
                'success' => true,

                'message' =>
                    'Data proyek berhasil diambil.',

                'total' =>
                    count($projects),

                'data' =>
                    $projects,
            ]
        );
    }

    if ($method === 'POST') {
        if (
            (
                $_GET['action']
                ?? ''
            ) === 'interaction'
        ) {
            if ($projectId === null) {
                sendJson(
                    422,
                    [
                        'success' => false,
                        'message' =>
                            'ID proyek wajib diisi.',
                    ]
                );
            }

            $row =
                findProject(
                    $pdo,
                    $projectId
                );

            if ($row === null) {
                sendJson(
                    404,
                    [
                        'success' => false,
                        'message' =>
                            'Proyek tidak ditemukan.',
                    ]
                );
            }

            $body =
                readJsonBody();

            $metric = (string) (
                $body['type']
                ?? $body['metric']
                ?? ''
            );

            $active =
                filter_var(
                    $body['active']
                    ?? true,
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                );

            $delta =
                $active === false
                    ? -1
                    : 1;

            $result =
                updateProjectMetric(
                    $pdo,
                    $row,
                    $metric,
                    $delta
                );

            $updatedRow =
                $result['row'];

            sendJson(
                200,
                [
                    'success' => true,

                    'message' =>
                        'Interaksi proyek berhasil diperbarui.',

                    'data' => [
                        'metric' =>
                            $result['metric'],

                        'value' =>
                            $result['value'],

                        'project' =>
                            rowToProject(
                                $updatedRow,
                                getProjectViewerAccess(
                                    $pdo,
                                    $projectId
                                )
                            ),
                    ],
                ]
            );
        }

        if (
            (
                $_GET['action']
                ?? ''
            ) === 'comment'
        ) {
            sendJson(
                410,
                [
                    'success' => false,

                    'message' =>
                        'Komentar proyek sekarang dikirim bersama rating.',
                ]
            );
        }

        if (
            (
                $_GET['action']
                ?? ''
            ) === 'rating'
        ) {
            if ($projectId === null) {
                sendJson(
                    422,
                    [
                        'success' => false,

                        'message' =>
                            'ID proyek wajib diisi.',
                    ]
                );
            }

            $row =
                findProject(
                    $pdo,
                    $projectId
                );

            if ($row === null) {
                sendJson(
                    404,
                    [
                        'success' => false,

                        'message' =>
                            'Proyek tidak ditemukan.',
                    ]
                );
            }

            $result =
                updateProjectRating(
                    $pdo,
                    $row,
                    readJsonBody()
                );

            $updatedRow =
                $result['row'];

            sendJson(
                200,
                [
                    'success' => true,

                    'message' =>
                        'Rating proyek berhasil disimpan.',

                    'data' => [
                        'rating' =>
                            $result[
                                'viewerRating'
                            ],

                        'averageRating' =>
                            $result[
                                'averageRating'
                            ],

                        'ratingCount' =>
                            $result[
                                'ratingCount'
                            ],

                        'project' =>
                            rowToProject(
                                $updatedRow,
                                getProjectViewerAccess(
                                    $pdo,
                                    $projectId
                                )
                            ),
                    ],
                ]
            );
        }

        $project =
            readProjectBody();

        $errors =
            validateProject(
                $project
            );

        if ($errors !== []) {
            sendJson(
                422,
                [
                    'success' => false,

                    'message' =>
                        'Validasi data proyek gagal.',

                    'errors' =>
                        $errors,
                ]
            );
        }

        $title =
            trim(
                (string)
                    $project['title']
            );

        $category =
            trim(
                (string)
                    $project['category']
            );

        $description =
            trim(
                (string)
                    $project['description']
            );

        $status =
            trim(
                (string) (
                    $project['status']
                    ?? 'draft'
                )
            )
            ?: 'draft';

        $visibility =
            trim(
                (string) (
                    $project['visibility']
                    ?? 'draft'
                )
            )
            ?: 'draft';

        $projectImageStorage =
            projectStorage(
                $projectRoot
            );

        $coverImage =
            storeUploadedField(
                'cover_image',
                $projectImageStorage,
                'project-cover',
                [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                ],
                2 * 1024 * 1024,
                true
            )
            ?? extractCoverImage(
                $project,
                $projectImageStorage
            );

        $circuitImage =
            storeUploadedField(
                'circuit_image',
                $projectImageStorage,
                'circuit-image',
                [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                ],
                2 * 1024 * 1024,
                true
            );

        $projectFile =
            storeUploadedField(
                'project_file',
                $projectImageStorage,
                'project-file',
                [
                    'json',
                    'flow',
                    'schema',
                    'txt',
                    'md',
                    'ino',
                    'zip',
                ],
                10 * 1024 * 1024
            );

        $projectFiles =
            storeUploadedProjectFiles(
                $projectImageStorage,
                is_array(
                    $project[
                        'projectFiles'
                    ]
                    ?? null
                )
                    ? $project[
                        'projectFiles'
                    ]
                    : []
            );

        $componentImages =
            storeUploadedIndexedImages(
                $projectImageStorage,
                is_array(
                    $project['tools']
                    ?? null
                )
                    ? $project['tools']
                    : [],
                'component_images',
                'component-image'
            );

        $nodeImages =
            storeUploadedIndexedImages(
                $projectImageStorage,
                is_array(
                    $project['nodes']
                    ?? null
                )
                    ? $project['nodes']
                    : [],
                'node_images',
                'node-image'
            );

        $now =
            jakartaNow();

        $project['title'] =
            $title;

        $project['category'] =
            $category;

        $project['description'] =
            $description;

        $project['status'] =
            $status;

        $project['visibility'] =
            $visibility;

        if ($coverImage !== null) {
            $project['coverImage'] =
                $coverImage;
        }

        if ($projectFile !== null) {
            $project['projectFile'] =
                $projectFile;
        }

        if ($projectFiles !== []) {
            $project['projectFiles'] =
                $projectFiles;

            $project['projectFile'] =
                $projectFiles[0]['file']
                ?? $project['projectFile']
                ?? null;

            $projectFile =
                $project['projectFile'];
        }

        if ($circuitImage !== null) {
            $project['circuitImage'] =
                $circuitImage;
        }

        $project['tools'] =
            applyIndexedImages(
                is_array(
                    $project['tools']
                    ?? null
                )
                    ? $project['tools']
                    : [],
                $componentImages
            );

        $project['nodes'] =
            applyIndexedImages(
                is_array(
                    $project['nodes']
                    ?? null
                )
                    ? $project['nodes']
                    : [],
                $nodeImages
            );

        $payloadJson =
            json_encode(
                $project,
                PROJECT_JSON_FLAGS
                | JSON_THROW_ON_ERROR
            );

        $componentImagesJson =
            json_encode(
                array_values(
                    array_filter(
                        $componentImages,
                        static fn(
                            mixed $image
                        ): bool =>
                            is_array($image)
                    )
                ),
                PROJECT_JSON_FLAGS
                | JSON_THROW_ON_ERROR
            );

        $statement =
            $pdo->prepare(
                'INSERT INTO project_submissions (
                    title,
                    category,
                    description,
                    status,
                    visibility,
                    cover_image_name,
                    cover_image_type,
                    cover_image_size,
                    cover_image_path,
                    cover_image_url,
                    project_file_name,
                    project_file_type,
                    project_file_size,
                    project_file_path,
                    project_file_url,
                    circuit_image_name,
                    circuit_image_type,
                    circuit_image_size,
                    circuit_image_path,
                    circuit_image_url,
                    component_images_json,
                    payload_json,
                    created_at,
                    updated_at
                ) VALUES (
                    :title,
                    :category,
                    :description,
                    :status,
                    :visibility,
                    :cover_image_name,
                    :cover_image_type,
                    :cover_image_size,
                    :cover_image_path,
                    :cover_image_url,
                    :project_file_name,
                    :project_file_type,
                    :project_file_size,
                    :project_file_path,
                    :project_file_url,
                    :circuit_image_name,
                    :circuit_image_type,
                    :circuit_image_size,
                    :circuit_image_path,
                    :circuit_image_url,
                    :component_images_json,
                    :payload_json,
                    :created_at,
                    :updated_at
                )'
            );

        $statement->execute([
            ':title' =>
                $title,

            ':category' =>
                $category,

            ':description' =>
                $description,

            ':status' =>
                $status,

            ':visibility' =>
                $visibility,

            ':cover_image_name' =>
                $coverImage[
                    'file_name'
                ]
                ?? null,

            ':cover_image_type' =>
                $coverImage[
                    'file_type'
                ]
                ?? null,

            ':cover_image_size' =>
                $coverImage[
                    'file_size'
                ]
                ?? null,

            ':cover_image_path' =>
                $coverImage[
                    'file_path'
                ]
                ?? null,

            ':cover_image_url' =>
                $coverImage[
                    'file_url'
                ]
                ?? null,

            ':project_file_name' =>
                $projectFile[
                    'file_name'
                ]
                ?? null,

            ':project_file_type' =>
                $projectFile[
                    'file_type'
                ]
                ?? null,

            ':project_file_size' =>
                $projectFile[
                    'file_size'
                ]
                ?? null,

            ':project_file_path' =>
                $projectFile[
                    'file_path'
                ]
                ?? null,

            ':project_file_url' =>
                $projectFile[
                    'file_url'
                ]
                ?? null,

            ':circuit_image_name' =>
                $circuitImage[
                    'file_name'
                ]
                ?? null,

            ':circuit_image_type' =>
                $circuitImage[
                    'file_type'
                ]
                ?? null,

            ':circuit_image_size' =>
                $circuitImage[
                    'file_size'
                ]
                ?? null,

            ':circuit_image_path' =>
                $circuitImage[
                    'file_path'
                ]
                ?? null,

            ':circuit_image_url' =>
                $circuitImage[
                    'file_url'
                ]
                ?? null,

            ':component_images_json' =>
                $componentImagesJson,

            ':payload_json' =>
                $payloadJson,

            ':created_at' =>
                $now,

            ':updated_at' =>
                $now,
        ]);

        $newId =
            (int)
                $pdo->lastInsertId();

        if (
            function_exists(
                'afwSyncEnqueue'
            )
        ) {
            afwSyncEnqueue(
                $pdo,
                'project_submissions',
                $newId,
                'insert',
                false
            );
        }

        $row =
            findProject(
                $pdo,
                $newId
            );

        if (
            function_exists(
                'afwPublishAdminEvent'
            )
            && $row !== null
        ) {
            afwPublishAdminEvent(
                $projectRoot,
                'admin/projects',
                [
                    'type' =>
                        'project.created',

                    'action' =>
                        'created',

                    'id' =>
                        $newId,

                    'title' =>
                        (string) (
                            $row['title']
                            ?? ''
                        ),

                    'status' =>
                        (string) (
                            $row['status']
                            ?? ''
                        ),
                ]
            );
        }

        sendJson(
            201,
            [
                'success' => true,

                'message' =>
                    'Proyek berhasil disimpan ke SQLite.',

                'data' =>
                    rowToProject(
                        $row
                    ),
            ]
        );
    }

    if (
        $method === 'PUT'
        || $method === 'PATCH'
    ) {
        if ($projectId === null) {
            throw new InvalidArgumentException(
                'Parameter id wajib diisi untuk edit proyek.'
            );
        }

        $existingRow =
            findProject(
                $pdo,
                $projectId
            );

        if ($existingRow === null) {
            sendJson(
                404,
                [
                    'success' => false,

                    'message' =>
                        'Proyek yang akan diedit tidak ditemukan.',
                ]
            );
        }

        $incoming =
            readProjectBody();

        $existingPayload =
            getProjectPayload(
                $existingRow
            );

        $project =
            array_replace(
                $existingPayload,
                $incoming
            );

        $title =
            trim(
                (string) (
                    $incoming['title']
                    ?? $existingRow[
                        'title'
                    ]
                )
            );

        $category =
            trim(
                (string) (
                    $incoming[
                        'category'
                    ]
                    ?? $existingRow[
                        'category'
                    ]
                )
            );

        $description =
            trim(
                (string) (
                    $incoming[
                        'description'
                    ]
                    ?? $existingRow[
                        'description'
                    ]
                )
            );

        $status =
            trim(
                (string) (
                    $incoming['status']
                    ?? $existingRow[
                        'status'
                    ]
                )
            );

        $visibility =
            trim(
                (string) (
                    $incoming[
                        'visibility'
                    ]
                    ?? $existingRow[
                        'visibility'
                    ]
                )
            );

        $project['title'] =
            $title;

        $project['category'] =
            $category;

        $project['description'] =
            $description;

        $project['status'] =
            $status !== ''
                ? $status
                : 'draft';

        $project['visibility'] =
            $visibility !== ''
                ? $visibility
                : 'draft';

        $errors =
            validateProject(
                $project
            );

        if ($errors !== []) {
            sendJson(
                422,
                [
                    'success' => false,

                    'message' =>
                        'Validasi data proyek gagal.',

                    'errors' =>
                        $errors,
                ]
            );
        }

        $projectImageStorage =
            projectStorage(
                $projectRoot
            );

        $coverImage =
            storeUploadedField(
                'cover_image',
                $projectImageStorage,
                'project-cover',
                [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                ],
                2 * 1024 * 1024,
                true
            )
            ?? extractCoverImage(
                $incoming,
                $projectImageStorage
            );

        $circuitImage =
            storeUploadedField(
                'circuit_image',
                $projectImageStorage,
                'circuit-image',
                [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                ],
                2 * 1024 * 1024,
                true
            );

        $projectFile =
            storeUploadedField(
                'project_file',
                $projectImageStorage,
                'project-file',
                [
                    'json',
                    'flow',
                    'schema',
                    'txt',
                    'md',
                    'ino',
                    'zip',
                ],
                10 * 1024 * 1024
            );

        $projectFiles =
            storeUploadedProjectFiles(
                $projectImageStorage,
                is_array(
                    $project[
                        'projectFiles'
                    ]
                    ?? null
                )
                    ? $project[
                        'projectFiles'
                    ]
                    : []
            );

        $componentImages =
            storeUploadedIndexedImages(
                $projectImageStorage,
                is_array(
                    $project['tools']
                    ?? null
                )
                    ? $project['tools']
                    : [],
                'component_images',
                'component-image'
            );

        $nodeImages =
            storeUploadedIndexedImages(
                $projectImageStorage,
                is_array(
                    $project['nodes']
                    ?? null
                )
                    ? $project['nodes']
                    : [],
                'node_images',
                'node-image'
            );

        if ($coverImage === null) {
            $coverImage = [
                'file_name' =>
                    $existingRow[
                        'cover_image_name'
                    ]
                    ?? null,

                'file_type' =>
                    $existingRow[
                        'cover_image_type'
                    ]
                    ?? null,

                'file_size' =>
                    isset(
                        $existingRow[
                            'cover_image_size'
                        ]
                    )
                        ? (int)
                            $existingRow[
                                'cover_image_size'
                            ]
                        : null,

                'file_path' =>
                    $existingRow[
                        'cover_image_path'
                    ]
                    ?? null,

                'file_url' =>
                    $existingRow[
                        'cover_image_url'
                    ]
                    ?? null,
            ];
        }

        if (
            (
                $coverImage['file_name']
                ?? null
            ) !== null
        ) {
            $project['coverImage'] =
                $coverImage;
        }

        if ($projectFile === null) {
            $projectFile = [
                'file_name' =>
                    $existingRow[
                        'project_file_name'
                    ]
                    ?? null,

                'file_type' =>
                    $existingRow[
                        'project_file_type'
                    ]
                    ?? null,

                'file_size' =>
                    isset(
                        $existingRow[
                            'project_file_size'
                        ]
                    )
                        ? (int)
                            $existingRow[
                                'project_file_size'
                            ]
                        : null,

                'file_path' =>
                    $existingRow[
                        'project_file_path'
                    ]
                    ?? null,

                'file_url' =>
                    $existingRow[
                        'project_file_url'
                    ]
                    ?? null,
            ];
        }

        if (
            (
                $projectFile['file_name']
                ?? null
            ) !== null
        ) {
            $project['projectFile'] =
                $projectFile;
        }

        if ($projectFiles !== []) {
            $project['projectFiles'] =
                $projectFiles;

            $project['projectFile'] =
                $projectFiles[0]['file']
                ?? $project[
                    'projectFile'
                ]
                ?? null;

            $projectFile =
                $project['projectFile'];
        }

        if ($circuitImage === null) {
            $circuitImage = [
                'file_name' =>
                    $existingRow[
                        'circuit_image_name'
                    ]
                    ?? null,

                'file_type' =>
                    $existingRow[
                        'circuit_image_type'
                    ]
                    ?? null,

                'file_size' =>
                    isset(
                        $existingRow[
                            'circuit_image_size'
                        ]
                    )
                        ? (int)
                            $existingRow[
                                'circuit_image_size'
                            ]
                        : null,

                'file_path' =>
                    $existingRow[
                        'circuit_image_path'
                    ]
                    ?? null,

                'file_url' =>
                    $existingRow[
                        'circuit_image_url'
                    ]
                    ?? null,
            ];
        }

        if (
            (
                $circuitImage['file_name']
                ?? null
            ) !== null
        ) {
            $project['circuitImage'] =
                $circuitImage;
        }

        $project['tools'] =
            applyIndexedImages(
                is_array(
                    $project['tools']
                    ?? null
                )
                    ? $project['tools']
                    : [],
                $componentImages
            );

        $project['nodes'] =
            applyIndexedImages(
                is_array(
                    $project['nodes']
                    ?? null
                )
                    ? $project['nodes']
                    : [],
                $nodeImages
            );

        $now =
            jakartaNow();

        $payloadJson =
            json_encode(
                $project,
                PROJECT_JSON_FLAGS
                | JSON_THROW_ON_ERROR
            );

        $componentImagesJson =
            json_encode(
                array_values(
                    array_filter(
                        $componentImages,
                        static fn(
                            mixed $image
                        ): bool =>
                            is_array($image)
                    )
                ),
                PROJECT_JSON_FLAGS
                | JSON_THROW_ON_ERROR
            );

        $statement =
            $pdo->prepare(
                'UPDATE project_submissions SET
                    title = :title,
                    category = :category,
                    description = :description,
                    status = :status,
                    visibility = :visibility,
                    cover_image_name = :cover_image_name,
                    cover_image_type = :cover_image_type,
                    cover_image_size = :cover_image_size,
                    cover_image_path = :cover_image_path,
                    cover_image_url = :cover_image_url,
                    project_file_name = :project_file_name,
                    project_file_type = :project_file_type,
                    project_file_size = :project_file_size,
                    project_file_path = :project_file_path,
                    project_file_url = :project_file_url,
                    circuit_image_name = :circuit_image_name,
                    circuit_image_type = :circuit_image_type,
                    circuit_image_size = :circuit_image_size,
                    circuit_image_path = :circuit_image_path,
                    circuit_image_url = :circuit_image_url,
                    component_images_json = :component_images_json,
                    payload_json = :payload_json,
                    updated_at = :updated_at
                 WHERE id = :id
                 AND deleted_at IS NULL'
            );

        $statement->execute([
            ':title' =>
                $title,

            ':category' =>
                $category,

            ':description' =>
                $description,

            ':status' =>
                $project['status'],

            ':visibility' =>
                $project['visibility'],

            ':cover_image_name' =>
                $coverImage[
                    'file_name'
                ]
                ?? null,

            ':cover_image_type' =>
                $coverImage[
                    'file_type'
                ]
                ?? null,

            ':cover_image_size' =>
                $coverImage[
                    'file_size'
                ]
                ?? null,

            ':cover_image_path' =>
                $coverImage[
                    'file_path'
                ]
                ?? null,

            ':cover_image_url' =>
                $coverImage[
                    'file_url'
                ]
                ?? null,

            ':project_file_name' =>
                $projectFile[
                    'file_name'
                ]
                ?? null,

            ':project_file_type' =>
                $projectFile[
                    'file_type'
                ]
                ?? null,

            ':project_file_size' =>
                $projectFile[
                    'file_size'
                ]
                ?? null,

            ':project_file_path' =>
                $projectFile[
                    'file_path'
                ]
                ?? null,

            ':project_file_url' =>
                $projectFile[
                    'file_url'
                ]
                ?? null,

            ':circuit_image_name' =>
                $circuitImage[
                    'file_name'
                ]
                ?? null,

            ':circuit_image_type' =>
                $circuitImage[
                    'file_type'
                ]
                ?? null,

            ':circuit_image_size' =>
                $circuitImage[
                    'file_size'
                ]
                ?? null,

            ':circuit_image_path' =>
                $circuitImage[
                    'file_path'
                ]
                ?? null,

            ':circuit_image_url' =>
                $circuitImage[
                    'file_url'
                ]
                ?? null,

            ':component_images_json' =>
                $componentImagesJson,

            ':payload_json' =>
                $payloadJson,

            ':updated_at' =>
                $now,

            ':id' =>
                $projectId,
        ]);

        if (
            function_exists(
                'afwSyncEnqueue'
            )
        ) {
            afwSyncEnqueue(
                $pdo,
                'project_submissions',
                $projectId,
                'update'
            );
        }

        $updatedRow =
            findProject(
                $pdo,
                $projectId
            );

        if (
            function_exists(
                'afwPublishAdminEvent'
            )
            && $updatedRow !== null
        ) {
            afwPublishAdminEvent(
                $projectRoot,
                'admin/projects',
                [
                    'type' =>
                        'project.updated',

                    'action' =>
                        'updated',

                    'id' =>
                        $projectId,

                    'title' =>
                        (string) (
                            $updatedRow['title']
                            ?? ''
                        ),

                    'status' =>
                        (string) (
                            $updatedRow['status']
                            ?? ''
                        ),
                ]
            );
        }

        sendJson(
            200,
            [
                'success' => true,

                'message' =>
                    'Proyek berhasil diperbarui.',

                'data' =>
                    rowToProject(
                        $updatedRow
                    ),
            ]
        );
    }

    if ($method === 'DELETE') {
        if (
            (
                $_GET['action']
                ?? ''
            ) === 'rating'
        ) {
            if ($projectId === null) {
                sendJson(
                    422,
                    [
                        'success' => false,

                        'message' =>
                            'ID proyek wajib diisi.',
                    ]
                );
            }

            $row =
                findProject(
                    $pdo,
                    $projectId
                );

            if ($row === null) {
                sendJson(
                    404,
                    [
                        'success' => false,

                        'message' =>
                            'Proyek tidak ditemukan.',
                    ]
                );
            }

            $result =
                deleteProjectRating(
                    $pdo,
                    $row,
                    readJsonBody()
                );

            $updatedRow =
                $result['row'];

            sendJson(
                200,
                [
                    'success' => true,

                    'message' =>
                        'Rating proyek berhasil dihapus.',

                    'data' => [
                        'rating' =>
                            $result[
                                'viewerRating'
                            ],

                        'averageRating' =>
                            $result[
                                'averageRating'
                            ],

                        'ratingCount' =>
                            $result[
                                'ratingCount'
                            ],

                        'project' =>
                            rowToProject(
                                $updatedRow,
                                getProjectViewerAccess(
                                    $pdo,
                                    $projectId
                                )
                            ),
                    ],
                ]
            );
        }

        if ($projectId === null) {
            throw new InvalidArgumentException(
                'Parameter id wajib diisi untuk menghapus proyek.'
            );
        }

        $existingRow =
            findProject(
                $pdo,
                $projectId
            );

        if ($existingRow === null) {
            sendJson(
                404,
                [
                    'success' => false,

                    'message' =>
                        'Proyek yang akan dihapus tidak ditemukan.',
                ]
            );
        }

        if (
            function_exists(
                'afwSyncEnqueue'
            )
        ) {
            afwSyncEnqueue(
                $pdo,
                'project_submissions',
                $projectId,
                'delete'
            );
        } else {
            $now =
                jakartaNow();

            $statement =
                $pdo->prepare(
                    'UPDATE project_submissions
                     SET
                        deleted_at = :deleted_at,
                        updated_at = :updated_at
                     WHERE id = :id'
                );

            $statement->execute([
                ':deleted_at' =>
                    $now,

                ':updated_at' =>
                    $now,

                ':id' =>
                    $projectId,
            ]);
        }

        if (
            function_exists(
                'afwPublishAdminEvent'
            )
        ) {
            afwPublishAdminEvent(
                $projectRoot,
                'admin/projects',
                [
                    'type' =>
                        'project.deleted',

                    'action' =>
                        'deleted',

                    'id' =>
                        $projectId,

                    'title' =>
                        (string) (
                            $existingRow['title']
                            ?? ''
                        ),
                ]
            );
        }

        sendJson(
            200,
            [
                'success' => true,

                'message' =>
                    'Proyek berhasil dihapus.',

                'data' => [
                    'id' =>
                        $projectId,

                    'title' =>
                        $existingRow[
                            'title'
                        ],
                ],
            ]
        );
    }

} catch (JsonException $error) {
    sendJson(
        400,
        [
            'success' => false,
            'message' =>
                'JSON tidak valid.',
            'error' =>
                $error->getMessage(),
        ]
    );

} catch (
    InvalidArgumentException $error
) {
    sendJson(
        400,
        [
            'success' => false,
            'message' =>
                $error->getMessage(),
        ]
    );

} catch (PDOException $error) {
    sendJson(
        500,
        [
            'success' => false,
            'message' =>
                'Gagal mengakses SQLite.',
            'error' =>
                $error->getMessage(),
        ]
    );

} catch (Throwable $error) {
    sendJson(
        500,
        [
            'success' => false,
            'message' =>
                'Terjadi kesalahan pada server.',
            'error' =>
                $error->getMessage(),
        ]
    );
}
