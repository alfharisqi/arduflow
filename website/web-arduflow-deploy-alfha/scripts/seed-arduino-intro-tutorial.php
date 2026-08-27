<?php

declare(strict_types=1);

$config = require dirname(__DIR__) . '/config/database.php';
$databasePath = (string) ($config['sqlite']['path'] ?? '');

if ($databasePath === '') {
    fwrite(STDERR, "Path SQLite tidak ditemukan.\n");
    exit(1);
}

$databaseDirectory = dirname($databasePath);

if (!is_dir($databaseDirectory)) {
    mkdir($databaseDirectory, 0775, true);
}

$pdo = new PDO(
    'sqlite:' . $databasePath,
    null,
    null,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
);

$pdo->exec('PRAGMA foreign_keys = ON');
$pdo->exec('PRAGMA busy_timeout = 15000');

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS tutorials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 1,
        short_description TEXT NOT NULL,
        full_description TEXT NOT NULL,
        card_image_name TEXT,
        card_image_type TEXT,
        card_image_size INTEGER,
        difficulty_level TEXT,
        estimated_time TEXT,
        page_order INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT "draft",
        active INTEGER NOT NULL DEFAULT 1,
        show_on_page INTEGER NOT NULL DEFAULT 1,
        featured INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 1,
        access_type TEXT,
        featured_order INTEGER,
        user_level TEXT NOT NULL DEFAULT "semua_pengguna",
        access_requirement TEXT,
        prerequisite TEXT,
        cta_text TEXT,
        cta_target_link TEXT,
        cta_url_slug TEXT,
        publish_schedule TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )'
);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS tutorial_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutorial_id INTEGER NOT NULL,
        slide_order INTEGER NOT NULL,
        title TEXT NOT NULL,
        content_type TEXT NOT NULL DEFAULT "text",
        content TEXT,
        estimated_time TEXT,
        status TEXT NOT NULL DEFAULT "draft",
        image_name TEXT,
        image_type TEXT,
        image_size INTEGER,
        video_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tutorial_id)
            REFERENCES tutorials(id)
            ON DELETE CASCADE
    )'
);

$now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))
    ->format(DateTimeInterface::ATOM);

$tutorial = [
    'title' => 'Apa Itu Arduino?',
    'slug' => 'apa-itu-arduino',
    'category' => 'panduan-pemula',
    'display_order' => 1,
    'short_description' => 'Kenali Arduino sebagai board mikrokontroler dan platform belajar untuk membuat proyek elektronik interaktif.',
    'full_description' => implode('', [
        '<h2>Apa Itu Arduino?</h2>',
        '<p>Arduino adalah platform open-source untuk membuat proyek elektronik. Di dalamnya ada board mikrokontroler yang dapat diprogram dan software untuk menulis instruksi yang akan dijalankan oleh board tersebut.</p>',
        '<p>Referensi utama materi ini adalah tutorial SparkFun Learn, lalu disusun ulang untuk konteks belajar Arduflow dan pemula IoT.</p>',
        '<h3>Tujuan Belajar</h3>',
        '<ul>',
        '<li>Memahami peran Arduino sebagai otak dari proyek elektronik.</li>',
        '<li>Membedakan input, proses, dan output pada proyek Arduino.</li>',
        '<li>Mengetahui alur dasar dari ide sampai program berjalan di board.</li>',
        '</ul>',
        '<p><strong>Referensi:</strong> <a href="https://learn.sparkfun.com/tutorials/what-is-an-arduino/all">SparkFun Learn - What is an Arduino?</a></p>',
    ]),
    'difficulty_level' => 'Level Pemula',
    'estimated_time' => '25 menit',
    'page_order' => 1,
    'status' => 'published',
    'active' => 1,
    'show_on_page' => 1,
    'featured' => 1,
    'comments' => 1,
    'access_type' => 'Gratis',
    'featured_order' => 1,
    'user_level' => 'semua_pengguna',
    'access_requirement' => null,
    'prerequisite' => 'Tidak ada prasyarat',
    'cta_text' => 'Mulai Belajar',
    'cta_target_link' => 'Materi Pertama',
    'cta_url_slug' => 'apa-itu-arduino',
    'publish_schedule' => null,
];

$slides = [
    [
        'title' => 'Arduino dalam Satu Gambaran',
        'content_type' => 'text',
        'estimated_time' => '5 menit',
        'content' => implode('', [
            '<h2>Arduino dalam Satu Gambaran</h2>',
            '<p>Bayangkan Arduino sebagai komputer kecil yang tugasnya membaca kondisi dari dunia nyata, memproses logika sederhana, lalu mengendalikan komponen elektronik.</p>',
            '<p>Contohnya, Arduino bisa membaca tombol sebagai input, memutuskan apakah tombol ditekan, lalu menyalakan LED sebagai output. Prinsip yang sama dapat diperluas ke sensor suhu, motor, buzzer, relay, dan perangkat IoT.</p>',
            '<blockquote>Input masuk dari sensor atau tombol, program memproses data, lalu output dikirim ke LED, motor, layar, atau aktuator lain.</blockquote>',
        ]),
    ],
    [
        'title' => 'Bagian Utama Platform Arduino',
        'content_type' => 'text',
        'estimated_time' => '6 menit',
        'content' => implode('', [
            '<h2>Bagian Utama Platform Arduino</h2>',
            '<p>Platform Arduino terdiri dari dua bagian besar: hardware dan software.</p>',
            '<ul>',
            '<li><strong>Board Arduino:</strong> papan rangkaian berisi mikrokontroler, pin input/output, konektor USB, regulator daya, dan komponen pendukung.</li>',
            '<li><strong>Arduino IDE:</strong> aplikasi untuk menulis, mengecek, dan mengupload program ke board.</li>',
            '<li><strong>Komunitas dan library:</strong> kumpulan contoh, dokumentasi, dan kode siap pakai yang membantu pemula bergerak lebih cepat.</li>',
            '</ul>',
            '<p>Karena bersifat open-source, Arduino banyak dipakai di kelas, komunitas maker, prototyping produk, dan eksperimen IoT.</p>',
        ]),
    ],
    [
        'title' => 'Input, Proses, dan Output',
        'content_type' => 'text',
        'estimated_time' => '5 menit',
        'content' => implode('', [
            '<h2>Input, Proses, dan Output</h2>',
            '<p>Setiap proyek Arduino biasanya dapat dijelaskan dengan pola input, proses, dan output.</p>',
            '<ol>',
            '<li><strong>Input:</strong> Arduino membaca data dari tombol, potensiometer, LDR, DHT22, sensor jarak, atau sensor lain.</li>',
            '<li><strong>Proses:</strong> program menentukan tindakan berdasarkan data yang masuk.</li>',
            '<li><strong>Output:</strong> Arduino mengendalikan LED, buzzer, servo, motor, relay, atau tampilan.</li>',
            '</ol>',
            '<p>Di Arduflow, pola ini bisa dipahami sebagai aliran node: node input membaca kondisi, node logika memproses sinyal, dan node output menjalankan aksi.</p>',
        ]),
    ],
    [
        'title' => 'Contoh Proyek Pertama',
        'content_type' => 'text',
        'estimated_time' => '5 menit',
        'content' => implode('', [
            '<h2>Contoh Proyek Pertama</h2>',
            '<p>Proyek paling sederhana adalah membuat LED berkedip. Meski terlihat kecil, proyek ini mengenalkan konsep penting: memilih pin, mengatur pin sebagai output, memberi logika HIGH/LOW, dan mengatur jeda waktu.</p>',
            '<pre><code>void setup() {',
            "\n  pinMode(13, OUTPUT);",
            "\n}",
            "\n\nvoid loop() {",
            "\n  digitalWrite(13, HIGH);",
            "\n  delay(1000);",
            "\n  digitalWrite(13, LOW);",
            "\n  delay(1000);",
            "\n}</code></pre>",
            '<p>Jika memakai Arduflow, logika yang sama bisa dibangun secara visual dengan node output digital dan node delay.</p>',
        ]),
    ],
    [
        'title' => 'Kapan Menggunakan Arduino?',
        'content_type' => 'text',
        'estimated_time' => '4 menit',
        'content' => implode('', [
            '<h2>Kapan Menggunakan Arduino?</h2>',
            '<p>Arduino cocok digunakan ketika kamu ingin membuat prototype cepat yang berhubungan dengan sensor, aktuator, atau perangkat fisik.</p>',
            '<ul>',
            '<li>Membuat lampu otomatis berbasis sensor cahaya.</li>',
            '<li>Membaca suhu dan kelembapan untuk monitoring ruangan.</li>',
            '<li>Menggerakkan servo untuk mekanisme sederhana.</li>',
            '<li>Mengontrol relay untuk perangkat listrik dengan aturan tertentu.</li>',
            '</ul>',
            '<p>Setelah memahami dasar Arduino, kamu akan lebih mudah mempelajari ESP32, IoT, dan integrasi visual programming di Arduflow.</p>',
        ]),
    ],
];

$pdo->beginTransaction();

try {
    $existingId = $pdo
        ->prepare('SELECT id FROM tutorials WHERE slug = :slug LIMIT 1');
    $existingId->execute([':slug' => $tutorial['slug']]);
    $tutorialId = $existingId->fetchColumn();

    if ($tutorialId) {
        $statement = $pdo->prepare(
            'UPDATE tutorials SET
                title = :title,
                category = :category,
                display_order = :display_order,
                short_description = :short_description,
                full_description = :full_description,
                difficulty_level = :difficulty_level,
                estimated_time = :estimated_time,
                page_order = :page_order,
                status = :status,
                active = :active,
                show_on_page = :show_on_page,
                featured = :featured,
                comments = :comments,
                access_type = :access_type,
                featured_order = :featured_order,
                user_level = :user_level,
                access_requirement = :access_requirement,
                prerequisite = :prerequisite,
                cta_text = :cta_text,
                cta_target_link = :cta_target_link,
                cta_url_slug = :cta_url_slug,
                publish_schedule = :publish_schedule,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':title' => $tutorial['title'],
            ':category' => $tutorial['category'],
            ':display_order' => $tutorial['display_order'],
            ':short_description' => $tutorial['short_description'],
            ':full_description' => $tutorial['full_description'],
            ':difficulty_level' => $tutorial['difficulty_level'],
            ':estimated_time' => $tutorial['estimated_time'],
            ':page_order' => $tutorial['page_order'],
            ':status' => $tutorial['status'],
            ':active' => $tutorial['active'],
            ':show_on_page' => $tutorial['show_on_page'],
            ':featured' => $tutorial['featured'],
            ':comments' => $tutorial['comments'],
            ':access_type' => $tutorial['access_type'],
            ':featured_order' => $tutorial['featured_order'],
            ':user_level' => $tutorial['user_level'],
            ':access_requirement' => $tutorial['access_requirement'],
            ':prerequisite' => $tutorial['prerequisite'],
            ':cta_text' => $tutorial['cta_text'],
            ':cta_target_link' => $tutorial['cta_target_link'],
            ':cta_url_slug' => $tutorial['cta_url_slug'],
            ':publish_schedule' => $tutorial['publish_schedule'],
            ':updated_at' => $now,
            ':id' => $tutorialId,
        ]);

        $pdo
            ->prepare('DELETE FROM tutorial_slides WHERE tutorial_id = :tutorial_id')
            ->execute([':tutorial_id' => $tutorialId]);
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO tutorials (
                title,
                slug,
                category,
                display_order,
                short_description,
                full_description,
                difficulty_level,
                estimated_time,
                page_order,
                status,
                active,
                show_on_page,
                featured,
                comments,
                access_type,
                featured_order,
                user_level,
                access_requirement,
                prerequisite,
                cta_text,
                cta_target_link,
                cta_url_slug,
                publish_schedule,
                created_at,
                updated_at
            ) VALUES (
                :title,
                :slug,
                :category,
                :display_order,
                :short_description,
                :full_description,
                :difficulty_level,
                :estimated_time,
                :page_order,
                :status,
                :active,
                :show_on_page,
                :featured,
                :comments,
                :access_type,
                :featured_order,
                :user_level,
                :access_requirement,
                :prerequisite,
                :cta_text,
                :cta_target_link,
                :cta_url_slug,
                :publish_schedule,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':title' => $tutorial['title'],
            ':slug' => $tutorial['slug'],
            ':category' => $tutorial['category'],
            ':display_order' => $tutorial['display_order'],
            ':short_description' => $tutorial['short_description'],
            ':full_description' => $tutorial['full_description'],
            ':difficulty_level' => $tutorial['difficulty_level'],
            ':estimated_time' => $tutorial['estimated_time'],
            ':page_order' => $tutorial['page_order'],
            ':status' => $tutorial['status'],
            ':active' => $tutorial['active'],
            ':show_on_page' => $tutorial['show_on_page'],
            ':featured' => $tutorial['featured'],
            ':comments' => $tutorial['comments'],
            ':access_type' => $tutorial['access_type'],
            ':featured_order' => $tutorial['featured_order'],
            ':user_level' => $tutorial['user_level'],
            ':access_requirement' => $tutorial['access_requirement'],
            ':prerequisite' => $tutorial['prerequisite'],
            ':cta_text' => $tutorial['cta_text'],
            ':cta_target_link' => $tutorial['cta_target_link'],
            ':cta_url_slug' => $tutorial['cta_url_slug'],
            ':publish_schedule' => $tutorial['publish_schedule'],
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $tutorialId = (int) $pdo->lastInsertId();
    }

    $slideStatement = $pdo->prepare(
        'INSERT INTO tutorial_slides (
            tutorial_id,
            slide_order,
            title,
            content_type,
            content,
            estimated_time,
            status,
            created_at,
            updated_at
        ) VALUES (
            :tutorial_id,
            :slide_order,
            :title,
            :content_type,
            :content,
            :estimated_time,
            :status,
            :created_at,
            :updated_at
        )'
    );

    foreach ($slides as $index => $slide) {
        $slideStatement->execute([
            ':tutorial_id' => $tutorialId,
            ':slide_order' => $index + 1,
            ':title' => $slide['title'],
            ':content_type' => $slide['content_type'],
            ':content' => $slide['content'],
            ':estimated_time' => $slide['estimated_time'],
            ':status' => 'published',
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);
    }

    $pdo->commit();

    echo json_encode(
        [
            'success' => true,
            'message' => 'Tutorial Apa Itu Arduino berhasil disimpan.',
            'tutorial_id' => (int) $tutorialId,
            'slug' => $tutorial['slug'],
            'slides' => count($slides),
        ],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    ) . PHP_EOL;
} catch (Throwable $error) {
    $pdo->rollBack();

    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    exit(1);
}
