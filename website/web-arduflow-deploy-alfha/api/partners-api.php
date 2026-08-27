<?php

declare(strict_types=1);

require_once __DIR__ . '/support/bootstrap.php';

$autoload = AFW_PROJECT_ROOT . '/vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}
if (class_exists(\Arduflow\Api\Support\Env::class)) {
    \Arduflow\Api\Support\Env::load(AFW_PROJECT_ROOT . '/.env');
}

$syncOutboxPath = __DIR__ . '/support/sync-outbox.php';
$mqttEventsPath = __DIR__ . '/support/mqtt-events.php';
if (is_file($syncOutboxPath)) {
    require_once $syncOutboxPath;
}
if (is_file($mqttEventsPath)) {
    require_once $mqttEventsPath;
}

afwApplyCors(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'POST' && isset($_GET['_method'])) {
    $override = strtoupper((string) $_GET['_method']);
    if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $override;
    }
}

function partnersNow(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function partnersEnsureTables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT "Institusi",
            pic_name TEXT NOT NULL DEFAULT "",
            pic_role TEXT NOT NULL DEFAULT "",
            email TEXT NOT NULL DEFAULT "",
            whatsapp TEXT NOT NULL DEFAULT "",
            city TEXT NOT NULL DEFAULT "",
            province TEXT NOT NULL DEFAULT "",
            website TEXT NOT NULL DEFAULT "",
            social_media TEXT NOT NULL DEFAULT "",
            description TEXT NOT NULL DEFAULT "",
            programs_json TEXT NOT NULL DEFAULT "[]",
            status TEXT NOT NULL DEFAULT "Draft",
            show_homepage INTEGER NOT NULL DEFAULT 0,
            featured INTEGER NOT NULL DEFAULT 0,
            follow_up_note TEXT NOT NULL DEFAULT "",
            start_date TEXT,
            last_contact_at TEXT,
            deleted_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_partners_homepage ON partners(show_homepage, featured)');

    $count = (int) $pdo->query('SELECT COUNT(*) FROM partners')->fetchColumn();
    if ($count > 0) {
        return;
    }

    $seed = [
        ['SMK Negeri 2 Jakarta', 'Sekolah', 'Budi Santoso', 'Kepala Hubungan', 'budi@smkn2jkt.sch.id', '0812-1234-5678', 'Jakarta', 'DKI Jakarta', 'www.smkn2jkt.sch.id', 'Instagram / Facebook / YouTube', 'Kerja sama dalam pelatihan IoT, workshop Arduino, dan pengetesan siswa di bidang teknologi.', ['Workshop IoT 2024', 'Arduino for School', 'Pelatihan Guru IoT'], 'Aktif', 1, 1, '', '2024-06-12', '2024-05-20'],
        ['Universitas Indonesia', 'Universitas', 'Rina Marlina', 'Koordinator Kemitraan', 'rina.martina@ui.ac.id', '0813-9876-5432', 'Depok', 'Jawa Barat', 'www.ui.ac.id', 'Instagram / LinkedIn', 'Kolaborasi kampus untuk program pembelajaran IoT dan publikasi karya mahasiswa.', ['Kuliah Tamu IoT', 'Project Showcase'], 'Aktif', 1, 1, '', '2024-02-05', '2024-05-18'],
        ['Komunitas IoT Indonesia', 'Komunitas', 'Agung Setiawan', 'Ketua Komunitas', 'agung@iotindonesia.id', '0812-2223-4444', 'Bandung', 'Jawa Barat', 'iotindonesia.id', 'Instagram / Discord', 'Kolaborasi komunitas untuk sharing session, mentoring proyek, dan event maker.', ['Community Meetup', 'Mentoring Proyek'], 'Menunggu', 0, 0, 'Belum balas email', null, '2024-05-19'],
        ['PT Tech Partner Solusi', 'Partner IT', 'Dewi Lestari', 'Marketing Manager', 'dewi@techpartner.co.id', '0856-1111-2222', 'Surabaya', 'Jawa Timur', 'techpartner.co.id', 'LinkedIn', 'Kemitraan teknologi untuk perangkat pembelajaran dan dukungan industri.', ['Hardware Support', 'Workshop Industri'], 'Aktif', 1, 0, '', '2023-12-28', '2024-05-17'],
        ['Institut Teknologi Bandung', 'Institusi', 'Yoga Pratama', 'Kerja Sama', 'yoga.pratama@itb.ac.id', '0812-5555-6666', 'Bandung', 'Jawa Barat', 'www.itb.ac.id', 'LinkedIn / Instagram', 'Draft kerja sama riset dan pengembangan modul pembelajaran IoT.', ['Riset IoT', 'Lab Visit'], 'Draft', 0, 0, 'Logo belum dikirim', null, '2024-05-10'],
        ['Maker Indonesia', 'Komunitas', 'Nabila Putri', 'Admin', 'nabila@makerid.com', '0821-7777-8888', 'Yogyakarta', 'DI Yogyakarta', 'makerid.com', 'Instagram', 'Kolaborasi komunitas maker untuk konten edukasi dan workshop.', ['Maker Day'], 'Inactive', 0, 0, 'Follow-up lebih dari 7 hari', '2022-05-11', '2024-01-02'],
        ['SMP Muhammadiyah 1', 'Sekolah', 'Ahmad Fauzi', 'Wakasek', 'ahmad@smpm1.sch.id', '0813-3333-9999', 'Yogyakarta', 'DI Yogyakarta', 'smpm1.sch.id', 'Instagram', 'Rencana kerja sama ekstrakurikuler robotika dan IoT dasar.', ['Ekskul IoT'], 'Menunggu', 0, 0, 'Data PIC kosong', null, '2024-05-21'],
        ['EduTech Indonesia', 'Partner IT', 'Rizky Pratama', 'Business Dev', 'rizky@edutech.id', '0822-4444-1212', 'Jakarta', 'DKI Jakarta', 'edutech.id', 'LinkedIn', 'Partner lama untuk distribusi konten dan program edukasi digital.', ['Edukasi Digital'], 'Archived', 0, 0, '', '2022-03-15', '2023-10-03'],
    ];

    $statement = $pdo->prepare(
        'INSERT INTO partners (
            name, type, pic_name, pic_role, email, whatsapp, city, province, website, social_media,
            description, programs_json, status, show_homepage, featured, follow_up_note,
            start_date, last_contact_at, created_at, updated_at
        ) VALUES (
            :name, :type, :pic_name, :pic_role, :email, :whatsapp, :city, :province, :website, :social_media,
            :description, :programs_json, :status, :show_homepage, :featured, :follow_up_note,
            :start_date, :last_contact_at, :created_at, :updated_at
        )'
    );
    $now = partnersNow();
    foreach ($seed as $item) {
        $statement->execute([
            ':name' => $item[0],
            ':type' => $item[1],
            ':pic_name' => $item[2],
            ':pic_role' => $item[3],
            ':email' => $item[4],
            ':whatsapp' => $item[5],
            ':city' => $item[6],
            ':province' => $item[7],
            ':website' => $item[8],
            ':social_media' => $item[9],
            ':description' => $item[10],
            ':programs_json' => json_encode($item[11], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            ':status' => $item[12],
            ':show_homepage' => $item[13],
            ':featured' => $item[14],
            ':follow_up_note' => $item[15],
            ':start_date' => $item[16],
            ':last_contact_at' => $item[17],
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);
    }
}

function partnersTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        "SELECT name
         FROM sqlite_master
         WHERE type = 'table'
         AND name = :table
         LIMIT 1"
    );
    $statement->execute([':table' => $table]);
    return $statement->fetchColumn() !== false;
}

function partnersColumnExists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');
    $columns = array_map(
        static fn (array $row): string => (string) ($row['name'] ?? ''),
        $statement->fetchAll()
    );
    return in_array($column, $columns, true);
}

function partnersAddColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    if (!partnersColumnExists($pdo, $table, $column)) {
        $pdo->exec('ALTER TABLE ' . $table . ' ADD COLUMN ' . $column . ' ' . $definition);
    }
}

function partnersEnsureCollaborationColumns(PDO $pdo): void
{
    if (!partnersTableExists($pdo, 'collaborations')) {
        return;
    }

    partnersAddColumnIfMissing($pdo, 'collaborations', 'description', 'TEXT NULL');
    partnersAddColumnIfMissing($pdo, 'collaborations', 'proposal_file_url', 'TEXT NULL');
}

function partnersSyncCollaborations(PDO $pdo): void
{
    if (!partnersTableExists($pdo, 'collaborations')) {
        return;
    }

    partnersEnsureCollaborationColumns($pdo);

    $statement = $pdo->query(
        'SELECT
            id,
            pic_name,
            pic_email,
            pic_whatsapp,
            institution_name,
            institution_type,
            goal,
            participant_estimate,
            demo_schedule,
            description,
            proposal_file_url,
            created_at,
            updated_at
         FROM collaborations
         WHERE deleted_at IS NULL'
    );

    $findPartner = $pdo->prepare(
        'SELECT id
         FROM partners
         WHERE deleted_at IS NULL
         AND LOWER(name) = LOWER(:name)
         LIMIT 1'
    );
    $insertPartner = $pdo->prepare(
        'INSERT INTO partners (
            name, type, pic_name, pic_role, email, whatsapp, city, province, website, social_media,
            description, programs_json, status, show_homepage, featured, follow_up_note,
            start_date, last_contact_at, created_at, updated_at
        ) VALUES (
            :name, :type, :pic_name, "", :email, :whatsapp, "", "", "", "",
            :description, :programs_json, "Menunggu", 0, 0, :follow_up_note,
            NULL, :last_contact_at, :created_at, :updated_at
        )'
    );

    foreach ($statement->fetchAll() as $row) {
        $institutionName = trim((string) ($row['institution_name'] ?? ''));

        if ($institutionName === '') {
            continue;
        }

        $findPartner->execute([
            ':name' => $institutionName,
        ]);

        if ($findPartner->fetchColumn() !== false) {
            continue;
        }

        $notes = array_values(array_filter([
            ($row['participant_estimate'] ?? '') ? 'Peserta/User: ' . $row['participant_estimate'] : '',
            ($row['demo_schedule'] ?? '') ? 'Jadwal demo: ' . $row['demo_schedule'] : '',
            ($row['proposal_file_url'] ?? '') ? 'Proposal: ' . $row['proposal_file_url'] : '',
        ]));
        $description = trim((string) ($row['description'] ?? ''));

        if ($description === '') {
            $description = 'Lead kolaborasi dari form kontak ArduFlow.';
        }

        $insertPartner->execute([
            ':name' => $institutionName,
            ':type' => trim((string) ($row['institution_type'] ?? '')) ?: 'Institusi',
            ':pic_name' => trim((string) ($row['pic_name'] ?? '')),
            ':email' => trim((string) ($row['pic_email'] ?? '')),
            ':whatsapp' => trim((string) ($row['pic_whatsapp'] ?? '')),
            ':description' => $description,
            ':programs_json' => json_encode(array_values(array_filter([(string) ($row['goal'] ?? '')])), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':follow_up_note' => implode(' | ', $notes),
            ':last_contact_at' => $row['demo_schedule'] ?? null,
            ':created_at' => $row['created_at'] ?: partnersNow(),
            ':updated_at' => $row['updated_at'] ?: partnersNow(),
        ]);
    }
}

function partnersIsPartnerLeadTopic(string $topic, string $message = ''): bool
{
    $text = strtolower($topic . ' ' . $message);

    return str_contains($text, 'partner')
        || str_contains($text, 'patner')
        || str_contains($text, 'kolaborasi')
        || str_contains($text, 'kerja sama')
        || str_contains($text, 'kerjasama');
}

function partnersSyncLeads(PDO $pdo): void
{
    if (!partnersTableExists($pdo, 'leads')) {
        return;
    }

    $statement = $pdo->query(
        'SELECT
            id,
            name,
            email,
            whatsapp,
            topic,
            message,
            status,
            created_at,
            updated_at
         FROM leads
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC'
    );

    $findPartner = $pdo->prepare(
        'SELECT id
         FROM partners
         WHERE deleted_at IS NULL
         AND LOWER(name) = LOWER(:name)
         LIMIT 1'
    );
    $insertPartner = $pdo->prepare(
        'INSERT INTO partners (
            name, type, pic_name, pic_role, email, whatsapp, city, province, website, social_media,
            description, programs_json, status, show_homepage, featured, follow_up_note,
            start_date, last_contact_at, created_at, updated_at
        ) VALUES (
            :name, "Lead Partner", :pic_name, "", :email, :whatsapp, "", "", "", "",
            :description, :programs_json, "Menunggu", 0, 0, :follow_up_note,
            NULL, NULL, :created_at, :updated_at
        )'
    );

    foreach ($statement->fetchAll() as $row) {
        $topic = trim((string) ($row['topic'] ?? ''));
        $message = trim((string) ($row['message'] ?? ''));

        if (!partnersIsPartnerLeadTopic($topic, $message)) {
            continue;
        }

        $name = trim((string) ($row['name'] ?? ''));
        $email = trim((string) ($row['email'] ?? ''));

        if ($name === '' && $email === '') {
            continue;
        }

        $findPartner->execute([
            ':name' => $name !== '' ? $name : $email,
        ]);

        if ($findPartner->fetchColumn() !== false) {
            continue;
        }

        $description = $message !== ''
            ? $message
            : 'Lead partner dari form kontak ArduFlow.';

        $insertPartner->execute([
            ':name' => $name !== '' ? $name : $email,
            ':pic_name' => $name,
            ':email' => $email,
            ':whatsapp' => trim((string) ($row['whatsapp'] ?? '')),
            ':description' => $description,
            ':programs_json' => json_encode(array_values(array_filter([$topic])), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':follow_up_note' => 'Dibuat otomatis dari lead #' . (int) ($row['id'] ?? 0) . ($topic !== '' ? ' - ' . $topic : ''),
            ':created_at' => $row['created_at'] ?: partnersNow(),
            ':updated_at' => $row['updated_at'] ?: partnersNow(),
        ]);
    }
}

function partnerFromRow(array $row): array
{
    $programs = json_decode((string) ($row['programs_json'] ?? '[]'), true);
    return [
        'id' => (int) $row['id'],
        'name' => (string) $row['name'],
        'type' => (string) $row['type'],
        'picName' => (string) $row['pic_name'],
        'picRole' => (string) $row['pic_role'],
        'email' => (string) $row['email'],
        'whatsapp' => (string) $row['whatsapp'],
        'city' => (string) $row['city'],
        'province' => (string) $row['province'],
        'website' => (string) $row['website'],
        'socialMedia' => (string) $row['social_media'],
        'description' => (string) $row['description'],
        'programs' => is_array($programs) ? array_values(array_filter($programs)) : [],
        'status' => (string) $row['status'],
        'showHomepage' => (bool) $row['show_homepage'],
        'featured' => (bool) $row['featured'],
        'followUpNote' => (string) $row['follow_up_note'],
        'startDate' => $row['start_date'] ?: null,
        'lastContactAt' => $row['last_contact_at'] ?: null,
        'createdAt' => (string) $row['created_at'],
        'updatedAt' => (string) $row['updated_at'],
    ];
}

function partnerPayload(array $data, ?array $existing = null): array
{
    $programs = $data['programs'] ?? $existing['programs'] ?? [];
    if (is_string($programs)) {
        $programs = array_map('trim', explode(',', $programs));
    }

    return [
        'name' => trim((string) ($data['name'] ?? $existing['name'] ?? '')),
        'type' => trim((string) ($data['type'] ?? $existing['type'] ?? 'Institusi')),
        'picName' => trim((string) ($data['picName'] ?? $data['pic_name'] ?? $existing['picName'] ?? '')),
        'picRole' => trim((string) ($data['picRole'] ?? $data['pic_role'] ?? $existing['picRole'] ?? '')),
        'email' => trim((string) ($data['email'] ?? $existing['email'] ?? '')),
        'whatsapp' => trim((string) ($data['whatsapp'] ?? $existing['whatsapp'] ?? '')),
        'city' => trim((string) ($data['city'] ?? $existing['city'] ?? '')),
        'province' => trim((string) ($data['province'] ?? $existing['province'] ?? '')),
        'website' => trim((string) ($data['website'] ?? $existing['website'] ?? '')),
        'socialMedia' => trim((string) ($data['socialMedia'] ?? $data['social_media'] ?? $existing['socialMedia'] ?? '')),
        'description' => trim((string) ($data['description'] ?? $existing['description'] ?? '')),
        'programs' => array_values(array_filter(array_map('trim', is_array($programs) ? $programs : []))),
        'status' => trim((string) ($data['status'] ?? $existing['status'] ?? 'Draft')),
        'showHomepage' => (bool) ($data['showHomepage'] ?? $data['show_homepage'] ?? $existing['showHomepage'] ?? false),
        'featured' => (bool) ($data['featured'] ?? $existing['featured'] ?? false),
        'followUpNote' => trim((string) ($data['followUpNote'] ?? $data['follow_up_note'] ?? $existing['followUpNote'] ?? '')),
        'startDate' => trim((string) ($data['startDate'] ?? $data['start_date'] ?? $existing['startDate'] ?? '')) ?: null,
        'lastContactAt' => trim((string) ($data['lastContactAt'] ?? $data['last_contact_at'] ?? $existing['lastContactAt'] ?? '')) ?: null,
    ];
}

function validatePartner(array $partner): array
{
    $errors = [];
    if ($partner['name'] === '') {
        $errors['name'] = 'Nama partner wajib diisi.';
    }
    if ($partner['email'] !== '' && !filter_var($partner['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Format email tidak valid.';
    }
    if (!in_array($partner['status'], ['Aktif', 'Menunggu', 'Draft', 'Inactive', 'Archived'], true)) {
        $errors['status'] = 'Status partner tidak valid.';
    }
    return $errors;
}

function findPartner(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT * FROM partners WHERE id = :id AND deleted_at IS NULL LIMIT 1');
    $statement->execute([':id' => $id]);
    $row = $statement->fetch();
    return $row ? partnerFromRow($row) : null;
}

function publishPartnerEvent(string $action, array $partner): void
{
    if (!function_exists('afwPublishAdminEvent')) {
        return;
    }

    afwPublishAdminEvent(AFW_PROJECT_ROOT, 'admin/system', [
        'type' => 'partner.' . $action,
        'action' => $action,
        'id' => (int) ($partner['id'] ?? 0),
        'name' => (string) ($partner['name'] ?? ''),
        'status' => (string) ($partner['status'] ?? ''),
    ]);
}

try {
    $pdo = afwPdo();
    partnersEnsureTables($pdo);
    partnersSyncCollaborations($pdo);
    partnersSyncLeads($pdo);
    $id = isset($_GET['id']) && $_GET['id'] !== '' ? (int) $_GET['id'] : null;

    if ($method === 'GET') {
        if ($id !== null) {
            $partner = findPartner($pdo, $id);
            if (!$partner) {
                afwSendJson(404, false, 'Partner tidak ditemukan.');
            }
            afwSendJson(200, true, 'Detail partner berhasil diambil.', ['partner' => $partner]);
        }

        $search = trim((string) ($_GET['search'] ?? ''));
        $status = trim((string) ($_GET['status'] ?? ''));
        $type = trim((string) ($_GET['type'] ?? ''));
        $city = trim((string) ($_GET['city'] ?? ''));
        $where = ['deleted_at IS NULL'];
        $params = [];
        if ($search !== '') {
            $where[] = '(LOWER(name) LIKE LOWER(:search) OR LOWER(pic_name) LIKE LOWER(:search) OR LOWER(email) LIKE LOWER(:search))';
            $params[':search'] = '%' . $search . '%';
        }
        if ($status !== '') {
            $where[] = 'status = :status';
            $params[':status'] = $status;
        }
        if ($type !== '') {
            $where[] = 'type = :type';
            $params[':type'] = $type;
        }
        if ($city !== '') {
            $where[] = 'city = :city';
            $params[':city'] = $city;
        }

        $statement = $pdo->prepare('SELECT * FROM partners WHERE ' . implode(' AND ', $where) . ' ORDER BY updated_at DESC, id DESC');
        $statement->execute($params);
        $partners = array_map('partnerFromRow', $statement->fetchAll());

        $allRows = array_map('partnerFromRow', $pdo->query('SELECT * FROM partners WHERE deleted_at IS NULL')->fetchAll());
        $stats = [
            'total' => count($allRows),
            'active' => count(array_filter($allRows, static fn (array $item): bool => $item['status'] === 'Aktif')),
            'waiting' => count(array_filter($allRows, static fn (array $item): bool => $item['status'] === 'Menunggu')),
            'archived' => count(array_filter($allRows, static fn (array $item): bool => $item['status'] === 'Archived')),
            'homepage' => count(array_filter($allRows, static fn (array $item): bool => $item['showHomepage'])),
            'newLeads' => count(array_filter($allRows, static fn (array $item): bool => strtotime($item['createdAt']) >= time() - 30 * 86400)),
        ];

        afwSendJson(200, true, 'Data partner berhasil diambil.', [
            'partners' => $partners,
            'stats' => $stats,
            'options' => [
                'types' => array_values(array_unique(array_map(static fn (array $item): string => $item['type'], $allRows))),
                'cities' => array_values(array_unique(array_filter(array_map(static fn (array $item): string => $item['city'], $allRows)))),
                'statuses' => ['Aktif', 'Menunggu', 'Draft', 'Inactive', 'Archived'],
            ],
        ]);
    }

    if ($method === 'POST') {
        $payload = partnerPayload(afwReadJsonBody('Data partner tidak boleh kosong.'));
        $errors = validatePartner($payload);
        if ($errors !== []) {
            afwSendJson(422, false, 'Validasi partner gagal.', [], $errors);
        }

        $now = partnersNow();
        $statement = $pdo->prepare(
            'INSERT INTO partners (
                name, type, pic_name, pic_role, email, whatsapp, city, province, website, social_media,
                description, programs_json, status, show_homepage, featured, follow_up_note,
                start_date, last_contact_at, created_at, updated_at
            ) VALUES (
                :name, :type, :pic_name, :pic_role, :email, :whatsapp, :city, :province, :website, :social_media,
                :description, :programs_json, :status, :show_homepage, :featured, :follow_up_note,
                :start_date, :last_contact_at, :created_at, :updated_at
            )'
        );
        $statement->execute([
            ':name' => $payload['name'],
            ':type' => $payload['type'],
            ':pic_name' => $payload['picName'],
            ':pic_role' => $payload['picRole'],
            ':email' => $payload['email'],
            ':whatsapp' => $payload['whatsapp'],
            ':city' => $payload['city'],
            ':province' => $payload['province'],
            ':website' => $payload['website'],
            ':social_media' => $payload['socialMedia'],
            ':description' => $payload['description'],
            ':programs_json' => json_encode($payload['programs'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            ':status' => $payload['status'],
            ':show_homepage' => $payload['showHomepage'] ? 1 : 0,
            ':featured' => $payload['featured'] ? 1 : 0,
            ':follow_up_note' => $payload['followUpNote'],
            ':start_date' => $payload['startDate'],
            ':last_contact_at' => $payload['lastContactAt'],
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);
        $partner = findPartner($pdo, (int) $pdo->lastInsertId()) ?? [];
        publishPartnerEvent('created', $partner);
        afwSendJson(201, true, 'Partner berhasil dibuat.', ['partner' => $partner]);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($id === null) {
            afwSendJson(400, false, 'Parameter id wajib diisi.');
        }
        $existing = findPartner($pdo, $id);
        if (!$existing) {
            afwSendJson(404, false, 'Partner tidak ditemukan.');
        }
        $payload = partnerPayload(afwReadJsonBody('Data partner tidak boleh kosong.'), $existing);
        $errors = validatePartner($payload);
        if ($errors !== []) {
            afwSendJson(422, false, 'Validasi partner gagal.', [], $errors);
        }

        $statement = $pdo->prepare(
            'UPDATE partners SET
                name = :name, type = :type, pic_name = :pic_name, pic_role = :pic_role,
                email = :email, whatsapp = :whatsapp, city = :city, province = :province,
                website = :website, social_media = :social_media, description = :description,
                programs_json = :programs_json, status = :status, show_homepage = :show_homepage,
                featured = :featured, follow_up_note = :follow_up_note, start_date = :start_date,
                last_contact_at = :last_contact_at, updated_at = :updated_at
             WHERE id = :id AND deleted_at IS NULL'
        );
        $statement->execute([
            ':name' => $payload['name'],
            ':type' => $payload['type'],
            ':pic_name' => $payload['picName'],
            ':pic_role' => $payload['picRole'],
            ':email' => $payload['email'],
            ':whatsapp' => $payload['whatsapp'],
            ':city' => $payload['city'],
            ':province' => $payload['province'],
            ':website' => $payload['website'],
            ':social_media' => $payload['socialMedia'],
            ':description' => $payload['description'],
            ':programs_json' => json_encode($payload['programs'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            ':status' => $payload['status'],
            ':show_homepage' => $payload['showHomepage'] ? 1 : 0,
            ':featured' => $payload['featured'] ? 1 : 0,
            ':follow_up_note' => $payload['followUpNote'],
            ':start_date' => $payload['startDate'],
            ':last_contact_at' => $payload['lastContactAt'],
            ':updated_at' => partnersNow(),
            ':id' => $id,
        ]);
        $partner = findPartner($pdo, $id) ?? [];
        publishPartnerEvent('updated', $partner);
        afwSendJson(200, true, 'Partner berhasil diperbarui.', ['partner' => $partner]);
    }

    if ($method === 'DELETE') {
        if ($id === null) {
            afwSendJson(400, false, 'Parameter id wajib diisi.');
        }
        $partner = findPartner($pdo, $id);
        if (!$partner) {
            afwSendJson(404, false, 'Partner tidak ditemukan.');
        }
        $statement = $pdo->prepare('UPDATE partners SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id');
        $now = partnersNow();
        $statement->execute([':deleted_at' => $now, ':updated_at' => $now, ':id' => $id]);
        publishPartnerEvent('deleted', $partner);
        afwSendJson(200, true, 'Partner berhasil dihapus.', ['id' => $id]);
    }

    afwSendJson(405, false, 'Method tidak diizinkan.');
} catch (Throwable $exception) {
    afwSendJson(500, false, 'Gagal memproses data partner.', ['detail' => $exception->getMessage()]);
}
