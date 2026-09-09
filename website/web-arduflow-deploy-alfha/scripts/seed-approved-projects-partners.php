<?php

declare(strict_types=1);

$projectRoot = dirname(__DIR__);
$databasePath = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'arduflow.sqlite';

if (!is_file($databasePath)) {
    fwrite(STDERR, 'Database tidak ditemukan: ' . $databasePath . PHP_EOL);
    exit(1);
}

$pdo = new PDO('sqlite:' . $databasePath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$now = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');

$projects = [
    [
        'title' => 'Smart Greenhouse Monitoring',
        'slug' => 'smart-greenhouse-monitoring',
        'category' => 'Smart Farming',
        'description' => 'Sistem monitoring suhu, kelembapan, dan kondisi media tanam untuk greenhouse skala edukasi menggunakan Arduino dan sensor lingkungan.',
        'difficulty' => 'Menengah',
        'estimatedTime' => '2-3 jam',
        'programmingLanguage' => 'Arduino',
        'tags' => ['IoT', 'Smart Farming', 'DHT22', 'Soil Moisture'],
        'tools' => [
            ['name' => 'Arduino Uno', 'specification' => 'Board utama sistem monitoring'],
            ['name' => 'Sensor DHT22', 'specification' => 'Sensor suhu dan kelembapan udara'],
            ['name' => 'Soil Moisture Sensor', 'specification' => 'Sensor kelembapan tanah'],
            ['name' => 'OLED Display', 'specification' => 'Tampilan data sensor'],
        ],
        'steps' => [
            ['order' => 1, 'description' => 'Rangkai sensor DHT22 dan soil moisture ke Arduino.'],
            ['order' => 2, 'description' => 'Buat alur pembacaan sensor di ArduFlow.'],
            ['order' => 3, 'description' => 'Tampilkan nilai sensor ke OLED display.'],
            ['order' => 4, 'description' => 'Uji pembacaan sensor pada kondisi lingkungan berbeda.'],
        ],
        'viewer' => 186,
        'likes' => 42,
        'saves' => 21,
    ],
    [
        'title' => 'Kunci Pintu RFID Mini',
        'slug' => 'kunci-pintu-rfid-mini',
        'category' => 'Keamanan',
        'description' => 'Prototype kunci pintu berbasis kartu RFID untuk praktik autentikasi akses sederhana menggunakan relay dan solenoid lock.',
        'difficulty' => 'Menengah',
        'estimatedTime' => '2 jam',
        'programmingLanguage' => 'Arduino',
        'tags' => ['RFID', 'Security', 'Relay', 'Arduino'],
        'tools' => [
            ['name' => 'RFID RC522', 'specification' => 'Pembaca kartu RFID'],
            ['name' => 'Arduino Uno', 'specification' => 'Kontrol utama'],
            ['name' => 'Relay 1 Channel', 'specification' => 'Saklar solenoid lock'],
            ['name' => 'Solenoid Lock', 'specification' => 'Aktuator pengunci pintu'],
        ],
        'steps' => [
            ['order' => 1, 'description' => 'Hubungkan modul RFID ke Arduino melalui SPI.'],
            ['order' => 2, 'description' => 'Daftarkan UID kartu yang diizinkan.'],
            ['order' => 3, 'description' => 'Aktifkan relay saat kartu valid terbaca.'],
            ['order' => 4, 'description' => 'Uji akses kartu valid dan tidak valid.'],
        ],
        'viewer' => 241,
        'likes' => 58,
        'saves' => 29,
    ],
    [
        'title' => 'Monitoring Kualitas Udara Kelas',
        'slug' => 'monitoring-kualitas-udara-kelas',
        'category' => 'IoT Monitoring',
        'description' => 'Sistem pemantauan kualitas udara kelas menggunakan sensor gas dan indikator LED untuk mendukung lingkungan belajar yang nyaman.',
        'difficulty' => 'Pemula',
        'estimatedTime' => '1-2 jam',
        'programmingLanguage' => 'Arduino',
        'tags' => ['IoT', 'Air Quality', 'MQ135', 'Monitoring'],
        'tools' => [
            ['name' => 'Sensor MQ135', 'specification' => 'Sensor kualitas udara'],
            ['name' => 'Arduino Uno', 'specification' => 'Board kontrol'],
            ['name' => 'LED RGB', 'specification' => 'Indikator kondisi udara'],
            ['name' => 'Buzzer', 'specification' => 'Alarm saat kualitas udara buruk'],
        ],
        'steps' => [
            ['order' => 1, 'description' => 'Hubungkan MQ135 ke input analog Arduino.'],
            ['order' => 2, 'description' => 'Atur threshold kualitas udara.'],
            ['order' => 3, 'description' => 'Buat indikator LED sesuai level pembacaan.'],
            ['order' => 4, 'description' => 'Tambahkan buzzer untuk kondisi peringatan.'],
        ],
        'viewer' => 167,
        'likes' => 35,
        'saves' => 18,
    ],
    [
        'title' => 'Tempat Sampah Otomatis Ultrasonik',
        'slug' => 'tempat-sampah-otomatis-ultrasonik',
        'category' => 'Robotika Dasar',
        'description' => 'Prototype tempat sampah otomatis yang membuka tutup menggunakan sensor ultrasonik dan servo saat objek terdeteksi.',
        'difficulty' => 'Pemula',
        'estimatedTime' => '1 jam',
        'programmingLanguage' => 'Arduino',
        'tags' => ['Ultrasonic', 'Servo', 'Arduino', 'Otomatisasi'],
        'tools' => [
            ['name' => 'HC-SR04', 'specification' => 'Sensor jarak ultrasonik'],
            ['name' => 'Servo SG90', 'specification' => 'Penggerak tutup tempat sampah'],
            ['name' => 'Arduino Uno', 'specification' => 'Board kontrol'],
            ['name' => 'Power Supply 5V', 'specification' => 'Catu daya servo'],
        ],
        'steps' => [
            ['order' => 1, 'description' => 'Pasang sensor ultrasonik di bagian depan.'],
            ['order' => 2, 'description' => 'Hubungkan servo ke mekanisme tutup.'],
            ['order' => 3, 'description' => 'Buat kondisi jarak kurang dari batas untuk membuka tutup.'],
            ['order' => 4, 'description' => 'Uji respon servo dan atur delay penutupan.'],
        ],
        'viewer' => 298,
        'likes' => 73,
        'saves' => 41,
    ],
    [
        'title' => 'Dashboard Lampu Kelas Berbasis WiFi',
        'slug' => 'dashboard-lampu-kelas-berbasis-wifi',
        'category' => 'Smart Classroom',
        'description' => 'Kontrol lampu kelas melalui koneksi WiFi menggunakan ESP32, relay, dan dashboard sederhana untuk praktik smart classroom.',
        'difficulty' => 'Lanjutan',
        'estimatedTime' => '3-4 jam',
        'programmingLanguage' => 'Arduino',
        'tags' => ['ESP32', 'WiFi', 'Relay', 'Dashboard'],
        'tools' => [
            ['name' => 'ESP32', 'specification' => 'Board mikrokontroler WiFi'],
            ['name' => 'Relay 2 Channel', 'specification' => 'Kontrol dua jalur lampu'],
            ['name' => 'Lampu AC Demo', 'specification' => 'Beban lampu simulasi'],
            ['name' => 'Dashboard Web', 'specification' => 'Kontrol ON/OFF berbasis browser'],
        ],
        'steps' => [
            ['order' => 1, 'description' => 'Hubungkan relay ke pin digital ESP32.'],
            ['order' => 2, 'description' => 'Atur koneksi WiFi pada project.'],
            ['order' => 3, 'description' => 'Buat endpoint kontrol ON/OFF.'],
            ['order' => 4, 'description' => 'Uji kontrol lampu dari dashboard browser.'],
        ],
        'viewer' => 324,
        'likes' => 81,
        'saves' => 46,
    ],
];

$partners = [
    [
        'name' => 'SMK Negeri 1 Banyuwangi',
        'type' => 'Sekolah',
        'pic_name' => 'Rizal Maulana',
        'pic_role' => 'Kepala Program Keahlian',
        'email' => 'rizal.maulana@smkn1banyuwangi.sch.id',
        'whatsapp' => '0812-4100-1101',
        'city' => 'Banyuwangi',
        'province' => 'Jawa Timur',
        'website' => 'smkn1banyuwangi.sch.id',
        'social_media' => 'Instagram',
        'description' => 'Kolaborasi program workshop IoT dan pendampingan project siswa berbasis ArduFlow.',
        'programs' => ['Workshop IoT Dasar', 'Pendampingan Project Siswa'],
        'featured' => 1,
    ],
    [
        'name' => 'Politeknik Negeri Banyuwangi',
        'type' => 'Kampus',
        'pic_name' => 'Dina Prameswari',
        'pic_role' => 'Koordinator Kerja Sama',
        'email' => 'dina.prameswari@poliwangi.ac.id',
        'whatsapp' => '0813-2200-3302',
        'city' => 'Banyuwangi',
        'province' => 'Jawa Timur',
        'website' => 'poliwangi.ac.id',
        'social_media' => 'LinkedIn / Instagram',
        'description' => 'Kolaborasi pengembangan materi praktikum IoT, mini project, dan showcase karya mahasiswa.',
        'programs' => ['Praktikum IoT', 'Project Showcase'],
        'featured' => 1,
    ],
    [
        'name' => 'Komunitas Maker Banyuwangi',
        'type' => 'Komunitas',
        'pic_name' => 'Aditya Nugroho',
        'pic_role' => 'Community Lead',
        'email' => 'halo@makerbanyuwangi.id',
        'whatsapp' => '0821-5000-4403',
        'city' => 'Banyuwangi',
        'province' => 'Jawa Timur',
        'website' => 'makerbanyuwangi.id',
        'social_media' => 'Instagram / Discord',
        'description' => 'Kolaborasi meetup maker, mentoring proyek Arduino, dan demo teknologi visual programming.',
        'programs' => ['Maker Meetup', 'Mentoring Arduino'],
        'featured' => 1,
    ],
    [
        'name' => 'PT Karya Abadi Electrindo',
        'type' => 'Industri',
        'pic_name' => 'Hendra Wijaya',
        'pic_role' => 'Business Development',
        'email' => 'partnership@kae.co.id',
        'whatsapp' => '0811-7000-5504',
        'city' => 'Jakarta Pusat',
        'province' => 'DKI Jakarta',
        'website' => 'kae.co.id',
        'social_media' => 'LinkedIn',
        'description' => 'Kolaborasi pengembangan solusi digital, IoT, RFID, dan implementasi teknologi industri.',
        'programs' => ['Industrial IoT', 'RFID Monitoring'],
        'featured' => 1,
    ],
    [
        'name' => 'Edu IoT Nusantara',
        'type' => 'Partner IT',
        'pic_name' => 'Maya Safitri',
        'pic_role' => 'Partnership Manager',
        'email' => 'maya@eduiotnusantara.id',
        'whatsapp' => '0856-8000-6605',
        'city' => 'Surabaya',
        'province' => 'Jawa Timur',
        'website' => 'eduiotnusantara.id',
        'social_media' => 'LinkedIn / YouTube',
        'description' => 'Kolaborasi distribusi konten edukasi IoT, pelatihan guru, dan program sertifikasi dasar.',
        'programs' => ['Pelatihan Guru', 'Sertifikasi IoT Dasar'],
        'featured' => 0,
    ],
];

$projectFind = $pdo->prepare('SELECT id, created_at FROM project_submissions WHERE lower(title) = lower(:title) LIMIT 1');
$projectInsert = $pdo->prepare(
    'INSERT INTO project_submissions (
        title, category, description, status, visibility, payload_json,
        slug, deleted_at, created_at, updated_at
    ) VALUES (
        :title, :category, :description, :status, :visibility, :payload_json,
        :slug, NULL, :created_at, :updated_at
    )'
);
$projectUpdate = $pdo->prepare(
    'UPDATE project_submissions
     SET category = :category,
         description = :description,
         status = :status,
         visibility = :visibility,
         payload_json = :payload_json,
         slug = :slug,
         deleted_at = NULL,
         updated_at = :updated_at
     WHERE id = :id'
);

$partnerFind = $pdo->prepare('SELECT id, created_at FROM partners WHERE lower(name) = lower(:name) LIMIT 1');
$partnerInsert = $pdo->prepare(
    'INSERT INTO partners (
        name, type, pic_name, pic_role, email, whatsapp, city, province, website, social_media,
        description, programs_json, status, show_homepage, featured, follow_up_note,
        start_date, last_contact_at, deleted_at, created_at, updated_at, logo_url
    ) VALUES (
        :name, :type, :pic_name, :pic_role, :email, :whatsapp, :city, :province, :website, :social_media,
        :description, :programs_json, :status, :show_homepage, :featured, :follow_up_note,
        :start_date, :last_contact_at, NULL, :created_at, :updated_at, :logo_url
    )'
);
$partnerUpdate = $pdo->prepare(
    'UPDATE partners
     SET type = :type,
         pic_name = :pic_name,
         pic_role = :pic_role,
         email = :email,
         whatsapp = :whatsapp,
         city = :city,
         province = :province,
         website = :website,
         social_media = :social_media,
         description = :description,
         programs_json = :programs_json,
         status = :status,
         show_homepage = :show_homepage,
         featured = :featured,
         follow_up_note = :follow_up_note,
         start_date = :start_date,
         last_contact_at = :last_contact_at,
         deleted_at = NULL,
         updated_at = :updated_at,
         logo_url = :logo_url
     WHERE id = :id'
);

$createdProjects = 0;
$updatedProjects = 0;
$createdPartners = 0;
$updatedPartners = 0;

$pdo->beginTransaction();

foreach ($projects as $project) {
    $projectFind->execute([':title' => $project['title']]);
    $existing = $projectFind->fetch();

    $payload = array_replace([
        'ownerName' => 'Admin ArduFlow',
        'ownerUsername' => 'admin',
        'userId' => 'admin',
        'status' => 'published',
        'visibility' => 'public',
        'featured' => true,
        'approvedAt' => $now,
        'publishedAt' => $now,
        'coverImage' => null,
        'projectFile' => null,
        'payment' => ['isPaid' => false, 'price' => 0, 'currency' => 'IDR', 'paymentCode' => ''],
        'nodes' => [],
    ], $project);
    $payload['status'] = 'published';
    $payload['visibility'] = 'public';
    $payload['featured'] = true;
    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

    $params = [
        ':category' => $project['category'],
        ':description' => $project['description'],
        ':status' => 'published',
        ':visibility' => 'public',
        ':payload_json' => $payloadJson,
        ':slug' => $project['slug'],
        ':updated_at' => $now,
    ];

    if ($existing) {
        $projectUpdate->execute($params + [':id' => (int) $existing['id']]);
        $updatedProjects++;
        continue;
    }

    $projectInsert->execute($params + [
        ':title' => $project['title'],
        ':created_at' => $now,
    ]);
    $createdProjects++;
}

foreach ($partners as $partner) {
    $partnerFind->execute([':name' => $partner['name']]);
    $existing = $partnerFind->fetch();

    $params = [
        ':type' => $partner['type'],
        ':pic_name' => $partner['pic_name'],
        ':pic_role' => $partner['pic_role'],
        ':email' => $partner['email'],
        ':whatsapp' => $partner['whatsapp'],
        ':city' => $partner['city'],
        ':province' => $partner['province'],
        ':website' => $partner['website'],
        ':social_media' => $partner['social_media'],
        ':description' => $partner['description'],
        ':programs_json' => json_encode($partner['programs'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        ':status' => 'Aktif',
        ':show_homepage' => 1,
        ':featured' => (int) $partner['featured'],
        ':follow_up_note' => 'Disetujui dan ditambahkan sebagai data contoh kolaborator.',
        ':start_date' => '2026-09-04',
        ':last_contact_at' => '2026-09-04',
        ':updated_at' => $now,
        ':logo_url' => '',
    ];

    if ($existing) {
        $partnerUpdate->execute($params + [':id' => (int) $existing['id']]);
        $updatedPartners++;
        continue;
    }

    $partnerInsert->execute($params + [
        ':name' => $partner['name'],
        ':created_at' => $now,
    ]);
    $createdPartners++;
}

$pdo->commit();

echo json_encode([
    'success' => true,
    'projects' => [
        'created' => $createdProjects,
        'updated' => $updatedProjects,
        'total_seeded' => count($projects),
    ],
    'partners' => [
        'created' => $createdPartners,
        'updated' => $updatedPartners,
        'total_seeded' => count($partners),
    ],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
