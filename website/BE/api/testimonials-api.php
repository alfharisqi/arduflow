<?php

declare(strict_types=1);

require_once __DIR__ . '/support/bootstrap.php';

afwApplyCors(['GET', 'POST', 'PATCH', 'DELETE']);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'POST' && isset($_GET['_method'])) {
    $override = strtoupper((string) $_GET['_method']);
    if (in_array($override, ['PATCH', 'DELETE'], true)) {
        $method = $override;
    }
}

function testimonialsNow(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function testimonialsEnsureTables(PDO $pdo): void
{
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
            deleted_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_testimonials_email ON testimonials(email)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_testimonials_source ON testimonials(source_type, source_id)');
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
    $status = trim((string) ($data['status'] ?? $existing['status'] ?? 'Menunggu'));
    if (!in_array($status, ['Menunggu', 'Disetujui', 'Ditolak', 'Archived'], true)) {
        $status = 'Menunggu';
    }

    return [
        'sourceType' => trim((string) ($data['sourceType'] ?? $data['source_type'] ?? $existing['sourceType'] ?? 'general')),
        'sourceId' => trim((string) ($data['sourceId'] ?? $data['source_id'] ?? $existing['sourceId'] ?? '')),
        'userId' => trim((string) ($data['userId'] ?? $data['user_id'] ?? $existing['userId'] ?? '')),
        'name' => trim((string) ($data['name'] ?? $existing['name'] ?? '')),
        'email' => trim((string) ($data['email'] ?? $existing['email'] ?? '')),
        'role' => trim((string) ($data['role'] ?? $existing['role'] ?? '')),
        'quote' => trim((string) ($data['quote'] ?? $existing['quote'] ?? '')),
        'rating' => max(1, min(5, (int) ($data['rating'] ?? $existing['rating'] ?? 5))),
        'consentPublic' => (bool) ($data['consentPublic'] ?? $data['consent_public'] ?? $existing['consentPublic'] ?? false),
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
    if ($payload['email'] === '' || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Email wajib valid.';
    }
    if (strlen($payload['quote']) < 12) {
        $errors['quote'] = 'Testimoni minimal 12 karakter.';
    }
    if (!$payload['consentPublic']) {
        $errors['consentPublic'] = 'Izin tampil publik wajib disetujui.';
    }

    return $errors;
}

function findTestimonial(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT * FROM testimonials WHERE id = :id AND deleted_at IS NULL LIMIT 1');
    $statement->execute([':id' => $id]);
    $row = $statement->fetch();

    return is_array($row) ? testimonialFromRow($row) : null;
}

try {
    $pdo = afwPdo();
    testimonialsEnsureTables($pdo);
    $id = isset($_GET['id']) && $_GET['id'] !== '' ? (int) $_GET['id'] : null;

    if ($method === 'GET') {
        if ($id !== null) {
            $testimonial = findTestimonial($pdo, $id);
            if (!$testimonial) {
                afwSendJson(404, false, 'Testimoni tidak ditemukan.');
            }
            afwSendJson(200, true, 'Detail testimoni berhasil diambil.', ['testimonial' => $testimonial]);
        }

        $where = ['deleted_at IS NULL'];
        $params = [];
        foreach ([
            'status' => 'status',
            'email' => 'email',
            'sourceType' => 'source_type',
            'sourceId' => 'source_id',
        ] as $queryKey => $column) {
            $value = trim((string) ($_GET[$queryKey] ?? ''));
            if ($value !== '') {
                $where[] = $column . ' = :' . $queryKey;
                $params[':' . $queryKey] = $value;
            }
        }

        $statement = $pdo->prepare('SELECT * FROM testimonials WHERE ' . implode(' AND ', $where) . ' ORDER BY updated_at DESC, id DESC');
        $statement->execute($params);
        $testimonials = array_map('testimonialFromRow', $statement->fetchAll());

        $allRows = array_map('testimonialFromRow', $pdo->query('SELECT * FROM testimonials WHERE deleted_at IS NULL')->fetchAll());
        afwSendJson(200, true, 'Data testimoni berhasil diambil.', [
            'testimonials' => $testimonials,
            'stats' => [
                'total' => count($allRows),
                'waiting' => count(array_filter($allRows, static fn (array $item): bool => $item['status'] === 'Menunggu')),
                'approved' => count(array_filter($allRows, static fn (array $item): bool => $item['status'] === 'Disetujui')),
                'rejected' => count(array_filter($allRows, static fn (array $item): bool => $item['status'] === 'Ditolak')),
            ],
        ]);
    }

    if ($method === 'POST') {
        $payload = testimonialPayload(afwReadJsonBody('Data testimoni tidak boleh kosong.'));
        $payload['status'] = 'Menunggu';
        $errors = validateTestimonial($payload);
        if ($errors !== []) {
            afwSendJson(422, false, 'Validasi testimoni gagal.', [], $errors);
        }

        $now = testimonialsNow();
        $statement = $pdo->prepare(
            'INSERT INTO testimonials (
                source_type, source_id, user_id, name, email, role, quote, rating,
                consent_public, status, admin_note, created_at, updated_at
            ) VALUES (
                :source_type, :source_id, :user_id, :name, :email, :role, :quote, :rating,
                :consent_public, :status, :admin_note, :created_at, :updated_at
            )'
        );
        $statement->execute([
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
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        afwSendJson(201, true, 'Testimoni berhasil dikirim dan menunggu review admin.', [
            'testimonial' => findTestimonial($pdo, (int) $pdo->lastInsertId()),
        ]);
    }

    if ($method === 'PATCH') {
        if ($id === null) {
            afwSendJson(400, false, 'Parameter id wajib diisi.');
        }
        $existing = findTestimonial($pdo, $id);
        if (!$existing) {
            afwSendJson(404, false, 'Testimoni tidak ditemukan.');
        }

        $payload = testimonialPayload(afwReadJsonBody('Data testimoni tidak boleh kosong.'), $existing);
        $statement = $pdo->prepare(
            'UPDATE testimonials SET
                source_type = :source_type, source_id = :source_id, user_id = :user_id,
                name = :name, email = :email, role = :role, quote = :quote, rating = :rating,
                consent_public = :consent_public, status = :status, admin_note = :admin_note,
                updated_at = :updated_at
             WHERE id = :id AND deleted_at IS NULL'
        );
        $statement->execute([
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
            ':updated_at' => testimonialsNow(),
            ':id' => $id,
        ]);

        afwSendJson(200, true, 'Testimoni berhasil diperbarui.', ['testimonial' => findTestimonial($pdo, $id)]);
    }

    if ($method === 'DELETE') {
        if ($id === null) {
            afwSendJson(400, false, 'Parameter id wajib diisi.');
        }
        $statement = $pdo->prepare('UPDATE testimonials SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id');
        $now = testimonialsNow();
        $statement->execute([':deleted_at' => $now, ':updated_at' => $now, ':id' => $id]);
        afwSendJson(200, true, 'Testimoni berhasil dihapus.', ['id' => $id]);
    }

    afwSendJson(405, false, 'Method tidak diizinkan.');
} catch (Throwable $exception) {
    afwSendJson(500, false, 'Gagal memproses data testimoni.', ['detail' => $exception->getMessage()]);
}
