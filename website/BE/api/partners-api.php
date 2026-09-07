<?php

declare(strict_types=1);

require_once __DIR__ . '/support/bootstrap.php';
require_once __DIR__ . '/support/image-storage.php';

$autoload = AFW_PROJECT_ROOT . '/vendor/autoload.php';

if (is_file($autoload)) {
    require_once $autoload;
}

if (class_exists(\Arduflow\Api\Support\Env::class)) {
    \Arduflow\Api\Support\Env::load(AFW_PROJECT_ROOT . '/.env');
}

foreach (['sync-outbox.php', 'mqtt-events.php'] as $supportFile) {
    $path = __DIR__ . '/support/' . $supportFile;

    if (is_file($path)) {
        require_once $path;
    }
}

afwApplyCors(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const PARTNER_JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

const PARTNER_STATUSES = [
    'Aktif',
    'Menunggu',
    'Draft',
    'Inactive',
    'Archived',
];

const PARTNER_SELECT =
    'id, name, type, pic_name, pic_role, email, whatsapp, city, province,
     website, social_media, logo_url, description, programs_json, status,
     show_homepage, featured, follow_up_note, start_date, last_contact_at,
     created_at, updated_at';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = trim((string) ($_GET['action'] ?? ''));

if ($method === 'POST' && isset($_GET['_method'])) {
    $override = strtoupper((string) $_GET['_method']);

    if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $override;
    }
}

function partnersNow(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

function partnersTableExists(PDO $pdo, string $table): bool
{
    static $cache = [];

    $key = spl_object_id($pdo) . ':' . $table;

    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }

    $statement = $pdo->prepare(
        "SELECT 1
         FROM sqlite_master
         WHERE type = 'table'
         AND name = :table
         LIMIT 1"
    );

    $statement->execute([
        ':table' => $table,
    ]);

    return $cache[$key] =
        $statement->fetchColumn() !== false;
}

function partnersColumns(PDO $pdo, string $table): array
{
    static $cache = [];

    $key = spl_object_id($pdo) . ':' . $table;

    if (isset($cache[$key])) {
        return $cache[$key];
    }

    if (!partnersTableExists($pdo, $table)) {
        return $cache[$key] = [];
    }

    $statement = $pdo->query(
        'PRAGMA table_info("'
        . str_replace('"', '""', $table)
        . '")'
    );

    return $cache[$key] =
        array_column(
            $statement->fetchAll(),
            'name'
        );
}

function partnersEnsureSchema(PDO $pdo): void
{
    $tableWasMissing =
        !partnersTableExists($pdo, 'partners');

    if ($tableWasMissing) {
        $pdo->exec(
            'CREATE TABLE partners (
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
                logo_url TEXT NOT NULL DEFAULT "",
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
    } elseif (
        !in_array(
            'logo_url',
            partnersColumns($pdo, 'partners'),
            true
        )
    ) {
        $pdo->exec(
            'ALTER TABLE partners
             ADD COLUMN logo_url TEXT NOT NULL DEFAULT ""'
        );
    }

    $indexes = $pdo->query(
        "SELECT name
         FROM sqlite_master
         WHERE type = 'index'
         AND name IN (
             'idx_partners_status',
             'idx_partners_homepage'
         )"
    )->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('idx_partners_status', $indexes, true)) {
        $pdo->exec(
            'CREATE INDEX idx_partners_status
             ON partners(status)'
        );
    }

    if (!in_array('idx_partners_homepage', $indexes, true)) {
        $pdo->exec(
            'CREATE INDEX idx_partners_homepage
             ON partners(show_homepage, featured)'
        );
    }

    if ($tableWasMissing) {
        partnersSeed($pdo);
    }
}

function partnersSeed(PDO $pdo): void
{
    $seed = [
        [
            'SMK Negeri 2 Jakarta',
            'Sekolah',
            'Budi Santoso',
            'Kepala Hubungan',
            'budi@smkn2jkt.sch.id',
            '0812-1234-5678',
            'Jakarta',
            'DKI Jakarta',
            'www.smkn2jkt.sch.id',
            'Instagram / Facebook / YouTube',
            'Kerja sama dalam pelatihan IoT, workshop Arduino, dan pengetesan siswa di bidang teknologi.',
            [
                'Workshop IoT 2024',
                'Arduino for School',
                'Pelatihan Guru IoT',
            ],
            'Aktif',
            1,
            1,
            '',
            '2024-06-12',
            '2024-05-20',
        ],
        [
            'Universitas Indonesia',
            'Universitas',
            'Rina Marlina',
            'Koordinator Kemitraan',
            'rina.martina@ui.ac.id',
            '0813-9876-5432',
            'Depok',
            'Jawa Barat',
            'www.ui.ac.id',
            'Instagram / LinkedIn',
            'Kolaborasi kampus untuk program pembelajaran IoT dan publikasi karya mahasiswa.',
            [
                'Kuliah Tamu IoT',
                'Project Showcase',
            ],
            'Aktif',
            1,
            1,
            '',
            '2024-02-05',
            '2024-05-18',
        ],
        [
            'Komunitas IoT Indonesia',
            'Komunitas',
            'Agung Setiawan',
            'Ketua Komunitas',
            'agung@iotindonesia.id',
            '0812-2223-4444',
            'Bandung',
            'Jawa Barat',
            'iotindonesia.id',
            'Instagram / Discord',
            'Kolaborasi komunitas untuk sharing session, mentoring proyek, dan event maker.',
            [
                'Community Meetup',
                'Mentoring Proyek',
            ],
            'Menunggu',
            0,
            0,
            'Belum balas email',
            null,
            '2024-05-19',
        ],
        [
            'PT Tech Partner Solusi',
            'Partner IT',
            'Dewi Lestari',
            'Marketing Manager',
            'dewi@techpartner.co.id',
            '0856-1111-2222',
            'Surabaya',
            'Jawa Timur',
            'techpartner.co.id',
            'LinkedIn',
            'Kemitraan teknologi untuk perangkat pembelajaran dan dukungan industri.',
            [
                'Hardware Support',
                'Workshop Industri',
            ],
            'Aktif',
            1,
            0,
            '',
            '2023-12-28',
            '2024-05-17',
        ],
        [
            'Institut Teknologi Bandung',
            'Institusi',
            'Yoga Pratama',
            'Kerja Sama',
            'yoga.pratama@itb.ac.id',
            '0812-5555-6666',
            'Bandung',
            'Jawa Barat',
            'www.itb.ac.id',
            'LinkedIn / Instagram',
            'Draft kerja sama riset dan pengembangan modul pembelajaran IoT.',
            [
                'Riset IoT',
                'Lab Visit',
            ],
            'Draft',
            0,
            0,
            'Logo belum dikirim',
            null,
            '2024-05-10',
        ],
        [
            'Maker Indonesia',
            'Komunitas',
            'Nabila Putri',
            'Admin',
            'nabila@makerid.com',
            '0821-7777-8888',
            'Yogyakarta',
            'DI Yogyakarta',
            'makerid.com',
            'Instagram',
            'Kolaborasi komunitas maker untuk konten edukasi dan workshop.',
            [
                'Maker Day',
            ],
            'Inactive',
            0,
            0,
            'Follow-up lebih dari 7 hari',
            '2022-05-11',
            '2024-01-02',
        ],
        [
            'SMP Muhammadiyah 1',
            'Sekolah',
            'Ahmad Fauzi',
            'Wakasek',
            'ahmad@smpm1.sch.id',
            '0813-3333-9999',
            'Yogyakarta',
            'DI Yogyakarta',
            'smpm1.sch.id',
            'Instagram',
            'Rencana kerja sama ekstrakurikuler robotika dan IoT dasar.',
            [
                'Ekskul IoT',
            ],
            'Menunggu',
            0,
            0,
            'Data PIC kosong',
            null,
            '2024-05-21',
        ],
        [
            'EduTech Indonesia',
            'Partner IT',
            'Rizky Pratama',
            'Business Dev',
            'rizky@edutech.id',
            '0822-4444-1212',
            'Jakarta',
            'DKI Jakarta',
            'edutech.id',
            'LinkedIn',
            'Partner lama untuk distribusi konten dan program edukasi digital.',
            [
                'Edukasi Digital',
            ],
            'Archived',
            0,
            0,
            '',
            '2022-03-15',
            '2023-10-03',
        ],
    ];

    $statement = $pdo->prepare(
        'INSERT INTO partners (
            name,
            type,
            pic_name,
            pic_role,
            email,
            whatsapp,
            city,
            province,
            website,
            social_media,
            description,
            programs_json,
            status,
            show_homepage,
            featured,
            follow_up_note,
            start_date,
            last_contact_at,
            created_at,
            updated_at
        ) VALUES (
            :name,
            :type,
            :pic_name,
            :pic_role,
            :email,
            :whatsapp,
            :city,
            :province,
            :website,
            :social_media,
            :description,
            :programs_json,
            :status,
            :show_homepage,
            :featured,
            :follow_up_note,
            :start_date,
            :last_contact_at,
            :created_at,
            :updated_at
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

            ':programs_json' =>
                json_encode(
                    $item[11],
                    PARTNER_JSON_FLAGS
                ),

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

function partnersEnsureCollaborationColumns(PDO $pdo): void
{
    if (!partnersTableExists($pdo, 'collaborations')) {
        return;
    }

    $columns =
        partnersColumns(
            $pdo,
            'collaborations'
        );

    $required = [
        'description' => 'TEXT NULL',
        'proposal_file_url' => 'TEXT NULL',
    ];

    foreach ($required as $column => $definition) {
        if (!in_array($column, $columns, true)) {
            $pdo->exec(
                'ALTER TABLE collaborations
                 ADD COLUMN '
                . $column
                . ' '
                . $definition
            );
        }
    }
}

function partnersExistingNames(PDO $pdo): array
{
    $names = [];

    $statement = $pdo->query(
        'SELECT name
         FROM partners
         WHERE deleted_at IS NULL'
    );

    while (
        ($name = $statement->fetchColumn())
        !== false
    ) {
        $names[
            strtolower(
                trim((string) $name)
            )
        ] = true;
    }

    return $names;
}

function partnersSyncSources(PDO $pdo): void
{
    $knownNames =
        partnersExistingNames($pdo);

    $insert = $pdo->prepare(
        'INSERT INTO partners (
            name,
            type,
            pic_name,
            pic_role,
            email,
            whatsapp,
            city,
            province,
            website,
            social_media,
            description,
            programs_json,
            status,
            show_homepage,
            featured,
            follow_up_note,
            start_date,
            last_contact_at,
            created_at,
            updated_at
        ) VALUES (
            :name,
            :type,
            :pic_name,
            "",
            :email,
            :whatsapp,
            "",
            "",
            "",
            "",
            :description,
            :programs_json,
            "Menunggu",
            0,
            0,
            :follow_up_note,
            NULL,
            :last_contact_at,
            :created_at,
            :updated_at
        )'
    );

    if (
        partnersTableExists(
            $pdo,
            'collaborations'
        )
    ) {
        partnersEnsureCollaborationColumns(
            $pdo
        );

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

        while ($row = $statement->fetch()) {
            $name = trim(
                (string) (
                    $row['institution_name']
                    ?? ''
                )
            );

            $key =
                strtolower($name);

            if (
                $name === ''
                || isset($knownNames[$key])
            ) {
                continue;
            }

            $notes = array_values(
                array_filter([
                    !empty(
                        $row['participant_estimate']
                    )
                        ? 'Peserta/User: '
                            . $row[
                                'participant_estimate'
                            ]
                        : '',

                    !empty(
                        $row['demo_schedule']
                    )
                        ? 'Jadwal demo: '
                            . $row[
                                'demo_schedule'
                            ]
                        : '',

                    !empty(
                        $row['proposal_file_url']
                    )
                        ? 'Proposal: '
                            . $row[
                                'proposal_file_url'
                            ]
                        : '',
                ])
            );

            $description = trim(
                (string) (
                    $row['description']
                    ?? ''
                )
            );

            $insert->execute([
                ':name' =>
                    $name,

                ':type' =>
                    trim(
                        (string) (
                            $row['institution_type']
                            ?? ''
                        )
                    ) ?: 'Institusi',

                ':pic_name' =>
                    trim(
                        (string) (
                            $row['pic_name']
                            ?? ''
                        )
                    ),

                ':email' =>
                    trim(
                        (string) (
                            $row['pic_email']
                            ?? ''
                        )
                    ),

                ':whatsapp' =>
                    trim(
                        (string) (
                            $row['pic_whatsapp']
                            ?? ''
                        )
                    ),

                ':description' =>
                    $description
                    ?: 'Lead kolaborasi dari form kontak ArduFlow.',

                ':programs_json' =>
                    json_encode(
                        array_values(
                            array_filter([
                                (string) (
                                    $row['goal']
                                    ?? ''
                                ),
                            ])
                        ),
                        PARTNER_JSON_FLAGS
                    ),

                ':follow_up_note' =>
                    implode(
                        ' | ',
                        $notes
                    ),

                ':last_contact_at' =>
                    $row['demo_schedule']
                    ?? null,

                ':created_at' =>
                    $row['created_at']
                    ?: partnersNow(),

                ':updated_at' =>
                    $row['updated_at']
                    ?: partnersNow(),
            ]);

            $knownNames[$key] = true;
        }
    }

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
            created_at,
            updated_at
         FROM leads
         WHERE deleted_at IS NULL
         AND (
            topic LIKE "%partner%" COLLATE NOCASE
            OR topic LIKE "%patner%" COLLATE NOCASE
            OR topic LIKE "%kolaborasi%" COLLATE NOCASE
            OR topic LIKE "%kerja sama%" COLLATE NOCASE
            OR topic LIKE "%kerjasama%" COLLATE NOCASE
            OR message LIKE "%partner%" COLLATE NOCASE
            OR message LIKE "%patner%" COLLATE NOCASE
            OR message LIKE "%kolaborasi%" COLLATE NOCASE
            OR message LIKE "%kerja sama%" COLLATE NOCASE
            OR message LIKE "%kerjasama%" COLLATE NOCASE
         )'
    );

    while ($row = $statement->fetch()) {
        $name = trim(
            (string) (
                $row['name']
                ?? ''
            )
        );

        $email = trim(
            (string) (
                $row['email']
                ?? ''
            )
        );

        $displayName =
            $name !== ''
                ? $name
                : $email;

        $key =
            strtolower($displayName);

        if (
            $displayName === ''
            || isset($knownNames[$key])
        ) {
            continue;
        }

        $topic = trim(
            (string) (
                $row['topic']
                ?? ''
            )
        );

        $message = trim(
            (string) (
                $row['message']
                ?? ''
            )
        );

        $insert->execute([
            ':name' =>
                $displayName,

            ':type' =>
                'Lead Partner',

            ':pic_name' =>
                $name,

            ':email' =>
                $email,

            ':whatsapp' =>
                trim(
                    (string) (
                        $row['whatsapp']
                        ?? ''
                    )
                ),

            ':description' =>
                $message
                ?: 'Lead partner dari form kontak ArduFlow.',

            ':programs_json' =>
                json_encode(
                    array_values(
                        array_filter([
                            $topic,
                        ])
                    ),
                    PARTNER_JSON_FLAGS
                ),

            ':follow_up_note' =>
                'Dibuat otomatis dari lead #'
                . (int) (
                    $row['id']
                    ?? 0
                )
                . (
                    $topic !== ''
                        ? ' - ' . $topic
                        : ''
                ),

            ':last_contact_at' =>
                null,

            ':created_at' =>
                $row['created_at']
                ?: partnersNow(),

            ':updated_at' =>
                $row['updated_at']
                ?: partnersNow(),
        ]);

        $knownNames[$key] = true;
    }
}

function partnerFromRow(array $row): array
{
    $programs = json_decode(
        (string) (
            $row['programs_json']
            ?? '[]'
        ),
        true
    );

    return [
        'id' =>
            (int) $row['id'],

        'name' =>
            (string) $row['name'],

        'type' =>
            (string) $row['type'],

        'picName' =>
            (string) $row['pic_name'],

        'picRole' =>
            (string) $row['pic_role'],

        'email' =>
            (string) $row['email'],

        'whatsapp' =>
            (string) $row['whatsapp'],

        'city' =>
            (string) $row['city'],

        'province' =>
            (string) $row['province'],

        'website' =>
            (string) $row['website'],

        'socialMedia' =>
            (string) $row['social_media'],

        'logoUrl' =>
            (string) (
                $row['logo_url']
                ?? ''
            ),

        'description' =>
            (string) $row['description'],

        'programs' =>
            is_array($programs)
                ? array_values(
                    array_filter($programs)
                )
                : [],

        'status' =>
            (string) $row['status'],

        'showHomepage' =>
            (bool) $row['show_homepage'],

        'featured' =>
            (bool) $row['featured'],

        'followUpNote' =>
            (string) $row['follow_up_note'],

        'startDate' =>
            $row['start_date']
            ?: null,

        'lastContactAt' =>
            $row['last_contact_at']
            ?: null,

        'createdAt' =>
            (string) $row['created_at'],

        'updatedAt' =>
            (string) $row['updated_at'],
    ];
}

function partnerPayload(
    array $data,
    ?array $existing = null
): array {
    $programs =
        $data['programs']
        ?? $existing['programs']
        ?? [];

    if (is_string($programs)) {
        $programs =
            explode(',', $programs);
    }

    return [
        'name' =>
            trim(
                (string) (
                    $data['name']
                    ?? $existing['name']
                    ?? ''
                )
            ),

        'type' =>
            trim(
                (string) (
                    $data['type']
                    ?? $existing['type']
                    ?? 'Institusi'
                )
            ),

        'picName' =>
            trim(
                (string) (
                    $data['picName']
                    ?? $data['pic_name']
                    ?? $existing['picName']
                    ?? ''
                )
            ),

        'picRole' =>
            trim(
                (string) (
                    $data['picRole']
                    ?? $data['pic_role']
                    ?? $existing['picRole']
                    ?? ''
                )
            ),

        'email' =>
            trim(
                (string) (
                    $data['email']
                    ?? $existing['email']
                    ?? ''
                )
            ),

        'whatsapp' =>
            trim(
                (string) (
                    $data['whatsapp']
                    ?? $existing['whatsapp']
                    ?? ''
                )
            ),

        'city' =>
            trim(
                (string) (
                    $data['city']
                    ?? $existing['city']
                    ?? ''
                )
            ),

        'province' =>
            trim(
                (string) (
                    $data['province']
                    ?? $existing['province']
                    ?? ''
                )
            ),

        'website' =>
            trim(
                (string) (
                    $data['website']
                    ?? $existing['website']
                    ?? ''
                )
            ),

        'socialMedia' =>
            trim(
                (string) (
                    $data['socialMedia']
                    ?? $data['social_media']
                    ?? $existing['socialMedia']
                    ?? ''
                )
            ),

        'logoUrl' =>
            trim(
                (string) (
                    $data['logoUrl']
                    ?? $data['logo_url']
                    ?? $existing['logoUrl']
                    ?? ''
                )
            ),

        'description' =>
            trim(
                (string) (
                    $data['description']
                    ?? $existing['description']
                    ?? ''
                )
            ),

        'programs' =>
            array_values(
                array_filter(
                    array_map(
                        'trim',
                        is_array($programs)
                            ? $programs
                            : []
                    )
                )
            ),

        'status' =>
            trim(
                (string) (
                    $data['status']
                    ?? $existing['status']
                    ?? 'Draft'
                )
            ),

        'showHomepage' =>
            (bool) (
                $data['showHomepage']
                ?? $data['show_homepage']
                ?? $existing['showHomepage']
                ?? false
            ),

        'featured' =>
            (bool) (
                $data['featured']
                ?? $existing['featured']
                ?? false
            ),

        'followUpNote' =>
            trim(
                (string) (
                    $data['followUpNote']
                    ?? $data['follow_up_note']
                    ?? $existing['followUpNote']
                    ?? ''
                )
            ),

        'startDate' =>
            trim(
                (string) (
                    $data['startDate']
                    ?? $data['start_date']
                    ?? $existing['startDate']
                    ?? ''
                )
            ) ?: null,

        'lastContactAt' =>
            trim(
                (string) (
                    $data['lastContactAt']
                    ?? $data['last_contact_at']
                    ?? $existing['lastContactAt']
                    ?? ''
                )
            ) ?: null,
    ];
}

function validatePartner(array $partner): array
{
    $errors = [];

    if ($partner['name'] === '') {
        $errors['name'] =
            'Nama partner wajib diisi.';
    }

    if (
        $partner['email'] !== ''
        && !filter_var(
            $partner['email'],
            FILTER_VALIDATE_EMAIL
        )
    ) {
        $errors['email'] =
            'Format email tidak valid.';
    }

    if (
        !in_array(
            $partner['status'],
            PARTNER_STATUSES,
            true
        )
    ) {
        $errors['status'] =
            'Status partner tidak valid.';
    }

    return $errors;
}

function partnerDbParams(
    array $partner,
    string $now
): array {
    return [
        ':name' =>
            $partner['name'],

        ':type' =>
            $partner['type'],

        ':pic_name' =>
            $partner['picName'],

        ':pic_role' =>
            $partner['picRole'],

        ':email' =>
            $partner['email'],

        ':whatsapp' =>
            $partner['whatsapp'],

        ':city' =>
            $partner['city'],

        ':province' =>
            $partner['province'],

        ':website' =>
            $partner['website'],

        ':social_media' =>
            $partner['socialMedia'],

        ':logo_url' =>
            $partner['logoUrl'],

        ':description' =>
            $partner['description'],

        ':programs_json' =>
            json_encode(
                $partner['programs'],
                PARTNER_JSON_FLAGS
            ),

        ':status' =>
            $partner['status'],

        ':show_homepage' =>
            $partner['showHomepage']
                ? 1
                : 0,

        ':featured' =>
            $partner['featured']
                ? 1
                : 0,

        ':follow_up_note' =>
            $partner['followUpNote'],

        ':start_date' =>
            $partner['startDate'],

        ':last_contact_at' =>
            $partner['lastContactAt'],

        ':updated_at' =>
            $now,
    ];
}

function handlePartnerLogoUpload(): never
{
    $file =
        $_FILES['logo']
        ?? null;

    if (!is_array($file)) {
        afwSendJson(
            400,
            false,
            'File logo tidak ditemukan. Gunakan field multipart bernama logo.'
        );
    }

    $errorCode =
        (int) (
            $file['error']
            ?? UPLOAD_ERR_NO_FILE
        );

    if ($errorCode !== UPLOAD_ERR_OK) {
        $messages = [
            UPLOAD_ERR_INI_SIZE =>
                'Ukuran file melebihi upload_max_filesize PHP.',

            UPLOAD_ERR_FORM_SIZE =>
                'Ukuran file melebihi batas form.',

            UPLOAD_ERR_PARTIAL =>
                'File hanya terupload sebagian.',

            UPLOAD_ERR_NO_FILE =>
                'Tidak ada file yang dipilih.',

            UPLOAD_ERR_NO_TMP_DIR =>
                'Folder temporary PHP tidak tersedia.',

            UPLOAD_ERR_CANT_WRITE =>
                'PHP gagal menulis file ke disk.',

            UPLOAD_ERR_EXTENSION =>
                'Upload dihentikan oleh ekstensi PHP.',
        ];

        afwSendJson(
            400,
            false,
            $messages[$errorCode]
                ?? 'Upload logo gagal.',
            [
                'errorCode' =>
                    $errorCode,
            ]
        );
    }

    $tmpName =
        (string) (
            $file['tmp_name']
            ?? ''
        );

    $fileSize =
        (int) (
            $file['size']
            ?? 0
        );

    if (
        $tmpName === ''
        || !is_uploaded_file($tmpName)
    ) {
        afwSendJson(
            400,
            false,
            'Temporary file upload tidak valid.'
        );
    }

    if ($fileSize <= 0) {
        afwSendJson(
            400,
            false,
            'Ukuran file logo tidak valid.'
        );
    }

    if (
        $fileSize >
        2 * 1024 * 1024
    ) {
        afwSendJson(
            413,
            false,
            'Ukuran logo maksimal 2 MB.'
        );
    }

    if (!class_exists('finfo')) {
        afwSendJson(
            500,
            false,
            'Ekstensi PHP fileinfo belum aktif.'
        );
    }

    $mimeType =
        (string) (
            new finfo(
                FILEINFO_MIME_TYPE
            )
        )->file($tmpName);

    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/svg+xml' => 'svg',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        afwSendJson(
            415,
            false,
            'Format logo harus JPG, PNG, WEBP, GIF, atau SVG.',
            [
                'detectedType' =>
                    $mimeType,
            ]
        );
    }

    $storage =
        ensureUploadStorage(
            AFW_PROJECT_ROOT,
            'partners'
        );

    try {
        $randomPart =
            bin2hex(
                random_bytes(6)
            );
    } catch (Throwable) {
        $randomPart =
            str_replace(
                '.',
                '',
                uniqid('', true)
            );
    }

    $storedName =
        sanitizeStoredFileName(
            sprintf(
                'partner-logo-%s-%s.%s',
                date('YmdHis'),
                $randomPart,
                $allowedTypes[$mimeType]
            )
        );

    $destination =
        $storage['path']
        . DIRECTORY_SEPARATOR
        . $storedName;

    if (
        !move_uploaded_file(
            $tmpName,
            $destination
        )
    ) {
        afwSendJson(
            500,
            false,
            'Logo gagal disimpan ke folder upload partner.',
            [
                'destination' =>
                    $destination,
            ]
        );
    }

    $relativeUrl =
        rtrim(
            (string) $storage['url'],
            '/'
        )
        . '/'
        . rawurlencode($storedName);

    afwSendJson(
        201,
        true,
        'Logo partner berhasil diupload.',
        [
            'logo' => [
                'name' =>
                    $storedName,

                'originalName' =>
                    basename(
                        (string) (
                            $file['name']
                            ?? 'partner-logo'
                        )
                    ),

                'type' =>
                    $mimeType,

                'size' =>
                    $fileSize,

                'sizeKB' =>
                    round(
                        $fileSize / 1024,
                        2
                    ),

                'url' =>
                    $relativeUrl,

                'uploadedAt' =>
                    date(
                        'Y-m-d H:i:s'
                    ),
            ],
        ]
    );
}

function findPartner(
    PDO $pdo,
    int $id
): ?array {
    $statement = $pdo->prepare(
        'SELECT '
        . PARTNER_SELECT
        . '
         FROM partners
         WHERE id = :id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([
        ':id' => $id,
    ]);

    $row =
        $statement->fetch();

    return $row
        ? partnerFromRow($row)
        : null;
}

function partnerStats(PDO $pdo): array
{
    $cutoff =
        gmdate(
            'Y-m-d\TH:i:s\Z',
            time() - 30 * 86400
        );

    $statement = $pdo->prepare(
        'SELECT
            COUNT(*) AS total,

            SUM(
                CASE
                    WHEN status = "Aktif"
                    THEN 1
                    ELSE 0
                END
            ) AS active,

            SUM(
                CASE
                    WHEN status = "Menunggu"
                    THEN 1
                    ELSE 0
                END
            ) AS waiting,

            SUM(
                CASE
                    WHEN status = "Archived"
                    THEN 1
                    ELSE 0
                END
            ) AS archived,

            SUM(
                CASE
                    WHEN show_homepage = 1
                    THEN 1
                    ELSE 0
                END
            ) AS homepage,

            SUM(
                CASE
                    WHEN created_at >= :cutoff
                    THEN 1
                    ELSE 0
                END
            ) AS new_leads

         FROM partners
         WHERE deleted_at IS NULL'
    );

    $statement->execute([
        ':cutoff' =>
            $cutoff,
    ]);

    $row =
        $statement->fetch()
        ?: [];

    return [
        'total' =>
            (int) (
                $row['total']
                ?? 0
            ),

        'active' =>
            (int) (
                $row['active']
                ?? 0
            ),

        'waiting' =>
            (int) (
                $row['waiting']
                ?? 0
            ),

        'archived' =>
            (int) (
                $row['archived']
                ?? 0
            ),

        'homepage' =>
            (int) (
                $row['homepage']
                ?? 0
            ),

        'newLeads' =>
            (int) (
                $row['new_leads']
                ?? 0
            ),
    ];
}

function partnerOptions(PDO $pdo): array
{
    $types = $pdo->query(
        'SELECT DISTINCT type
         FROM partners
         WHERE deleted_at IS NULL
         AND type <> ""
         ORDER BY type'
    )->fetchAll(PDO::FETCH_COLUMN);

    $cities = $pdo->query(
        'SELECT DISTINCT city
         FROM partners
         WHERE deleted_at IS NULL
         AND city <> ""
         ORDER BY city'
    )->fetchAll(PDO::FETCH_COLUMN);

    return [
        'types' =>
            array_values($types),

        'cities' =>
            array_values($cities),

        'statuses' =>
            PARTNER_STATUSES,
    ];
}

function publishPartnerEvent(
    string $action,
    array $partner
): void {
    if (
        !function_exists(
            'afwPublishAdminEvent'
        )
    ) {
        return;
    }

    afwPublishAdminEvent(
        AFW_PROJECT_ROOT,
        'admin/system',
        [
            'type' =>
                'partner.' . $action,

            'action' =>
                $action,

            'id' =>
                (int) (
                    $partner['id']
                    ?? 0
                ),

            'name' =>
                (string) (
                    $partner['name']
                    ?? ''
                ),

            'status' =>
                (string) (
                    $partner['status']
                    ?? ''
                ),
        ]
    );
}

try {
    $pdo = afwPdo();

    partnersEnsureSchema($pdo);

    $id =
        isset($_GET['id'])
        && $_GET['id'] !== ''
            ? (int) $_GET['id']
            : null;

    if ($action === 'upload-logo') {
        if ($method !== 'POST') {
            header(
                'Allow: POST, OPTIONS'
            );

            afwSendJson(
                405,
                false,
                'Upload logo hanya menerima method POST.'
            );
        }

        handlePartnerLogoUpload();
    }

    if ($action !== '') {
        afwSendJson(
            400,
            false,
            'Action API partner tidak dikenal.',
            [
                'action' =>
                    $action,
            ]
        );
    }

    if ($method === 'GET') {
        if ($id !== null) {
            $partner =
                findPartner(
                    $pdo,
                    $id
                );

            if (!$partner) {
                afwSendJson(
                    404,
                    false,
                    'Partner tidak ditemukan.'
                );
            }

            afwSendJson(
                200,
                true,
                'Detail partner berhasil diambil.',
                [
                    'partner' =>
                        $partner,
                ]
            );
        }

        partnersSyncSources($pdo);

        $where = [
            'deleted_at IS NULL',
        ];

        $params = [];

        $search =
            trim(
                (string) (
                    $_GET['search']
                    ?? ''
                )
            );

        $filters = [
            'status' =>
                trim(
                    (string) (
                        $_GET['status']
                        ?? ''
                    )
                ),

            'type' =>
                trim(
                    (string) (
                        $_GET['type']
                        ?? ''
                    )
                ),

            'city' =>
                trim(
                    (string) (
                        $_GET['city']
                        ?? ''
                    )
                ),
        ];

        if ($search !== '') {
            $where[] =
                '(name LIKE :search COLLATE NOCASE
                  OR pic_name LIKE :search COLLATE NOCASE
                  OR email LIKE :search COLLATE NOCASE)';

            $params[':search'] =
                '%' . $search . '%';
        }

        foreach (
            $filters
            as $column => $value
        ) {
            if ($value === '') {
                continue;
            }

            $where[] =
                $column
                . ' = :'
                . $column;

            $params[
                ':' . $column
            ] = $value;
        }

        $statement =
            $pdo->prepare(
                'SELECT '
                . PARTNER_SELECT
                . '
                 FROM partners
                 WHERE '
                . implode(
                    ' AND ',
                    $where
                )
                . '
                 ORDER BY updated_at DESC, id DESC'
            );

        $statement->execute(
            $params
        );

        $partners = [];

        while (
            $row =
                $statement->fetch()
        ) {
            $partners[] =
                partnerFromRow($row);
        }

        afwSendJson(
            200,
            true,
            'Data partner berhasil diambil.',
            [
                'partners' =>
                    $partners,

                'stats' =>
                    partnerStats($pdo),

                'options' =>
                    partnerOptions($pdo),
            ]
        );
    }

    if ($method === 'POST') {
        $payload =
            partnerPayload(
                afwReadJsonBody(
                    'Data partner tidak boleh kosong.'
                )
            );

        $errors =
            validatePartner(
                $payload
            );

        if ($errors !== []) {
            afwSendJson(
                422,
                false,
                'Validasi partner gagal.',
                [],
                $errors
            );
        }

        $now =
            partnersNow();

        $params =
            partnerDbParams(
                $payload,
                $now
            );

        $params[':created_at'] =
            $now;

        $statement =
            $pdo->prepare(
                'INSERT INTO partners (
                    name,
                    type,
                    pic_name,
                    pic_role,
                    email,
                    whatsapp,
                    city,
                    province,
                    website,
                    social_media,
                    logo_url,
                    description,
                    programs_json,
                    status,
                    show_homepage,
                    featured,
                    follow_up_note,
                    start_date,
                    last_contact_at,
                    created_at,
                    updated_at
                ) VALUES (
                    :name,
                    :type,
                    :pic_name,
                    :pic_role,
                    :email,
                    :whatsapp,
                    :city,
                    :province,
                    :website,
                    :social_media,
                    :logo_url,
                    :description,
                    :programs_json,
                    :status,
                    :show_homepage,
                    :featured,
                    :follow_up_note,
                    :start_date,
                    :last_contact_at,
                    :created_at,
                    :updated_at
                )'
            );

        $statement->execute(
            $params
        );

        $partner =
            findPartner(
                $pdo,
                (int) $pdo->lastInsertId()
            ) ?? [];

        publishPartnerEvent(
            'created',
            $partner
        );

        afwSendJson(
            201,
            true,
            'Partner berhasil dibuat.',
            [
                'partner' =>
                    $partner,
            ]
        );
    }

    if (
        $method === 'PUT'
        || $method === 'PATCH'
    ) {
        if ($id === null) {
            afwSendJson(
                400,
                false,
                'Parameter id wajib diisi.'
            );
        }

        $existing =
            findPartner(
                $pdo,
                $id
            );

        if (!$existing) {
            afwSendJson(
                404,
                false,
                'Partner tidak ditemukan.'
            );
        }

        $payload =
            partnerPayload(
                afwReadJsonBody(
                    'Data partner tidak boleh kosong.'
                ),
                $existing
            );

        $errors =
            validatePartner(
                $payload
            );

        if ($errors !== []) {
            afwSendJson(
                422,
                false,
                'Validasi partner gagal.',
                [],
                $errors
            );
        }

        $params =
            partnerDbParams(
                $payload,
                partnersNow()
            );

        $params[':id'] =
            $id;

        $statement =
            $pdo->prepare(
                'UPDATE partners SET
                    name = :name,
                    type = :type,
                    pic_name = :pic_name,
                    pic_role = :pic_role,
                    email = :email,
                    whatsapp = :whatsapp,
                    city = :city,
                    province = :province,
                    website = :website,
                    social_media = :social_media,
                    logo_url = :logo_url,
                    description = :description,
                    programs_json = :programs_json,
                    status = :status,
                    show_homepage = :show_homepage,
                    featured = :featured,
                    follow_up_note = :follow_up_note,
                    start_date = :start_date,
                    last_contact_at = :last_contact_at,
                    updated_at = :updated_at
                 WHERE id = :id
                 AND deleted_at IS NULL'
            );

        $statement->execute(
            $params
        );

        $partner =
            findPartner(
                $pdo,
                $id
            ) ?? [];

        publishPartnerEvent(
            'updated',
            $partner
        );

        afwSendJson(
            200,
            true,
            'Partner berhasil diperbarui.',
            [
                'partner' =>
                    $partner,
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

        $partner =
            findPartner(
                $pdo,
                $id
            );

        if (!$partner) {
            afwSendJson(
                404,
                false,
                'Partner tidak ditemukan.'
            );
        }

        $now =
            partnersNow();

        $statement =
            $pdo->prepare(
                'UPDATE partners
                 SET
                    deleted_at = :deleted_at,
                    updated_at = :updated_at
                 WHERE id = :id
                 AND deleted_at IS NULL'
            );

        $statement->execute([
            ':deleted_at' =>
                $now,

            ':updated_at' =>
                $now,

            ':id' =>
                $id,
        ]);

        publishPartnerEvent(
            'deleted',
            $partner
        );

        afwSendJson(
            200,
            true,
            'Partner berhasil dihapus.',
            [
                'id' =>
                    $id,
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
        'Gagal memproses data partner.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}