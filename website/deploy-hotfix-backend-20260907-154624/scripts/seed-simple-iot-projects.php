<?php

declare(strict_types=1);

$config = require dirname(__DIR__) . '/config/database.php';
$databasePath = (string) ($config['sqlite']['path'] ?? '');

if ($databasePath === '') {
    fwrite(STDERR, "Path SQLite tidak ditemukan.\n");
    exit(1);
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

$pdo->exec('PRAGMA busy_timeout = 15000');
$pdo->exec(
    'CREATE TABLE IF NOT EXISTS project_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT "draft",
        visibility TEXT NOT NULL DEFAULT "draft",
        cover_image_name TEXT,
        cover_image_type TEXT,
        cover_image_size INTEGER,
        cover_image_path TEXT,
        cover_image_url TEXT,
        project_file_name TEXT,
        project_file_type TEXT,
        project_file_size INTEGER,
        project_file_path TEXT,
        project_file_url TEXT,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )'
);

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');
    foreach ($statement->fetchAll() as $row) {
        if (($row['name'] ?? '') === $column) {
            return true;
        }
    }

    return false;
}

foreach ([
    'cover_image_name' => 'TEXT',
    'cover_image_type' => 'TEXT',
    'cover_image_size' => 'INTEGER',
    'cover_image_path' => 'TEXT',
    'cover_image_url' => 'TEXT',
    'project_file_name' => 'TEXT',
    'project_file_type' => 'TEXT',
    'project_file_size' => 'INTEGER',
    'project_file_path' => 'TEXT',
    'project_file_url' => 'TEXT',
] as $column => $type) {
    if (!columnExists($pdo, 'project_submissions', $column)) {
        $pdo->exec('ALTER TABLE project_submissions ADD COLUMN ' . $column . ' ' . $type);
    }
}

$now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))
    ->format(DateTimeInterface::ATOM);

$ideArduflowNodes = [
    ['name' => 'Digital Out', 'description' => 'PIN: HIGH / LOW', 'category' => 'Input Output'],
    ['name' => 'Digital In', 'description' => 'READ PIN STATUS', 'category' => 'Input Output'],
    ['name' => 'PWM / Analog Out', 'description' => '0 - 255 RANGE', 'category' => 'Input Output'],
    ['name' => 'Servo Motor', 'description' => '0 - 180° DEGREES', 'category' => 'Input Output'],
    ['name' => 'Analog In', 'description' => '0 - 1023 RANGE', 'category' => 'Input Output'],
    ['name' => 'Value Monitor', 'description' => 'WATCH VALUES', 'category' => 'Input Output'],
    ['name' => 'Serial TX', 'description' => 'SEND DATA', 'category' => 'Serial & Data'],
    ['name' => 'Serial RX Switch', 'description' => 'MATCH COMMANDS', 'category' => 'Serial & Data'],
    ['name' => 'Serial RX (String)', 'description' => 'RAW INCOMING TEXT', 'category' => 'Serial & Data'],
    ['name' => 'SoftwareSerial', 'description' => 'VIRTUAL SERIAL PORT', 'category' => 'Serial & Data'],
    ['name' => 'JSON Parser', 'description' => 'EXTRACT JSON KEYS', 'category' => 'Serial & Data'],
    ['name' => 'JSON Output', 'description' => 'BUILD JSON STRING', 'category' => 'Serial & Data'],
    ['name' => 'EEPROM Store', 'description' => 'PERSIST STATE', 'category' => 'Storage'],
    ['name' => 'EEPROM Read', 'description' => 'READ ON BOOT', 'category' => 'Storage'],
    ['name' => 'Delay', 'description' => 'SIGNAL DELAY MS', 'category' => 'Timing'],
    ['name' => 'Timer', 'description' => 'COUNT UP / DOWN', 'category' => 'Timing'],
    ['name' => 'Schedule', 'description' => 'TIME RECURRING', 'category' => 'Timing'],
    ['name' => 'Push Button', 'description' => 'MANUAL MOMENTARY', 'category' => 'Input'],
    ['name' => 'Square Wave', 'description' => 'OSCILLATOR SIGNAL', 'category' => 'Signal'],
    ['name' => 'Counter Up/Down', 'description' => 'TRIGGER COUNT', 'category' => 'Logic & Control'],
    ['name' => 'Math Operation', 'description' => 'ARITHMETIC OPERATORS', 'category' => 'Logic & Control'],
    ['name' => 'Light Bulb', 'description' => 'ON/OFF DISPLAY', 'category' => 'Indicators'],
    ['name' => 'Gauge Display', 'description' => 'VISUAL ANALOG', 'category' => 'Indicators'],
    ['name' => 'Boolean (High/Low)', 'description' => 'TOGGLE SIGNAL', 'category' => 'Logic & Control'],
    ['name' => 'Numeric Value', 'description' => 'STATIC NUMBER', 'category' => 'Logic & Control'],
    ['name' => 'Boolean Value', 'description' => '0 / 1 / TRUE / FALSE', 'category' => 'Logic & Control'],
    ['name' => 'String Value', 'description' => 'CUSTOM TEXT / STRING', 'category' => 'Logic & Control'],
    ['name' => 'If Then Else', 'description' => 'CONDITIONAL BRANCH', 'category' => 'Logic & Control'],
    ['name' => 'Comparator', 'description' => 'A > B?', 'category' => 'Logic & Control'],
    ['name' => 'Logic AND', 'description' => 'TRUE IF BOTH', 'category' => 'Logic & Control'],
    ['name' => 'Logic NOT', 'description' => 'INVERT SIGNAL', 'category' => 'Logic & Control'],
    ['name' => 'Logic OR', 'description' => 'TRUE IF ANY', 'category' => 'Logic & Control'],
    ['name' => 'Logic OR +', 'description' => 'ADJUSTABLE INPUTS', 'category' => 'Logic & Control'],
    ['name' => 'Pulse Timer', 'description' => 'HIGH FOR X MILLISECONDS', 'category' => 'Timing'],
    ['name' => 'Latch (SR / Hold)', 'description' => 'SET / RESET FLIP-FLOP', 'category' => 'Logic & Control'],
    ['name' => 'Shift Register 8-Ch', 'description' => '74HC595 / 8-BIT SIPO', 'category' => 'Output'],
];

function pickNodes(array $catalog, array $names): array
{
    $picked = [];

    foreach ($names as $name) {
        foreach ($catalog as $node) {
            if ($node['name'] === $name) {
                $picked[] = $node;
                break;
            }
        }
    }

    return $picked;
}

$projects = [
    [
        'title' => 'Project Sederhana IoT',
        'category' => 'IoT Dasar',
        'description' => 'Proyek pengenalan IoT sederhana untuk membaca sensor, mengolah data di Arduino, dan menampilkan output melalui aktuator.',
        'difficulty' => 'Pemula',
        'estimatedTime' => '1-2 jam',
        'programmingLanguage' => 'Arduino',
        'status' => 'published',
        'visibility' => 'public',
        'payment' => ['isPaid' => false, 'price' => 0, 'currency' => 'IDR', 'paymentCode' => ''],
        'tags' => ['IoT', 'Arduino', 'Pemula', 'Sensor'],
        'tools' => [
            ['name' => 'Arduino Uno', 'specification' => 'Board utama untuk membaca input dan mengatur output'],
            ['name' => 'LED 5mm', 'specification' => 'Indikator output sederhana'],
            ['name' => 'Resistor 220 Ohm', 'specification' => 'Pembatas arus LED'],
            ['name' => 'Breadboard dan jumper', 'specification' => 'Media perakitan rangkaian tanpa solder'],
        ],
        'nodes' => $ideArduflowNodes,
        'steps' => [
            ['order' => 1, 'description' => 'Siapkan Arduino Uno, breadboard, LED, resistor, dan kabel jumper.'],
            ['order' => 2, 'description' => 'Rangkai LED dengan resistor ke pin digital Arduino.'],
            ['order' => 3, 'description' => 'Buat alur ArduFlow untuk membaca input dan mengatur output LED.'],
            ['order' => 4, 'description' => 'Upload program ke board lalu uji perubahan LED.'],
        ],
        'viewer' => 128,
        'likes' => 24,
        'saves' => 11,
    ],
    [
        'title' => 'Lampu Otomatis Sensor LDR',
        'category' => 'Sensor',
        'description' => 'Proyek lampu otomatis yang menyalakan LED saat kondisi sekitar gelap menggunakan sensor LDR.',
        'difficulty' => 'Pemula',
        'estimatedTime' => '1 jam',
        'programmingLanguage' => 'Arduino',
        'status' => 'published',
        'visibility' => 'public',
        'payment' => ['isPaid' => false, 'price' => 0, 'currency' => 'IDR', 'paymentCode' => ''],
        'tags' => ['IoT', 'Arduino', 'LDR', 'Lampu Otomatis'],
        'tools' => [
            ['name' => 'Arduino Uno', 'specification' => 'Board kontrol'],
            ['name' => 'Sensor LDR', 'specification' => 'Sensor intensitas cahaya'],
            ['name' => 'LED', 'specification' => 'Output lampu indikator'],
            ['name' => 'Resistor 10K Ohm', 'specification' => 'Pembagi tegangan LDR'],
        ],
        'nodes' => pickNodes($ideArduflowNodes, [
            'Analog In',
            'Comparator',
            'Boolean (High/Low)',
            'Digital Out',
            'Light Bulb',
            'Gauge Display',
            'Value Monitor',
        ]),
        'steps' => [
            ['order' => 1, 'description' => 'Rangkai LDR sebagai pembagi tegangan ke pin analog.'],
            ['order' => 2, 'description' => 'Hubungkan LED ke pin digital dengan resistor.'],
            ['order' => 3, 'description' => 'Atur ambang batas cahaya pada node Compare.'],
            ['order' => 4, 'description' => 'Uji sensor dengan menutup dan membuka LDR.'],
        ],
        'viewer' => 212,
        'likes' => 38,
        'saves' => 19,
    ],
    [
        'title' => 'Monitoring Suhu DHT22',
        'category' => 'IoT Monitoring',
        'description' => 'Proyek monitoring suhu dan kelembapan ruangan menggunakan sensor DHT22 sebagai latihan pembacaan sensor lingkungan.',
        'difficulty' => 'Pemula',
        'estimatedTime' => '1-2 jam',
        'programmingLanguage' => 'Arduino',
        'status' => 'review',
        'visibility' => 'draft',
        'payment' => ['isPaid' => false, 'price' => 0, 'currency' => 'IDR', 'paymentCode' => ''],
        'tags' => ['IoT', 'DHT22', 'Monitoring', 'Sensor'],
        'tools' => [
            ['name' => 'Arduino Uno', 'specification' => 'Board kontrol'],
            ['name' => 'Sensor DHT22', 'specification' => 'Sensor suhu dan kelembapan'],
            ['name' => 'LCD 16x2', 'specification' => 'Output tampilan lokal'],
        ],
        'nodes' => pickNodes($ideArduflowNodes, [
            'Digital In',
            'Analog In',
            'Value Monitor',
            'Serial TX',
            'JSON Output',
            'JSON Parser',
            'String Value',
            'SoftwareSerial',
        ]),
        'steps' => [
            ['order' => 1, 'description' => 'Hubungkan DHT22 ke pin data Arduino.'],
            ['order' => 2, 'description' => 'Tambahkan node pembacaan DHT pada ArduFlow.'],
            ['order' => 3, 'description' => 'Format suhu dan kelembapan menjadi teks.'],
            ['order' => 4, 'description' => 'Tampilkan hasil pembacaan ke LCD atau serial monitor.'],
        ],
        'viewer' => 94,
        'likes' => 17,
        'saves' => 8,
    ],
    [
        'title' => 'Penyiram Tanaman Otomatis Mini',
        'category' => 'Smart Farming',
        'description' => 'Proyek penyiram tanaman otomatis skala mini berdasarkan kelembapan tanah untuk praktik smart farming sederhana.',
        'difficulty' => 'Menengah',
        'estimatedTime' => '2-3 jam',
        'programmingLanguage' => 'Arduino',
        'status' => 'draft',
        'visibility' => 'draft',
        'payment' => ['isPaid' => true, 'price' => 15000, 'currency' => 'IDR', 'paymentCode' => 'ARDU-IOTMINI'],
        'tags' => ['IoT', 'Smart Farming', 'Soil Moisture', 'Relay'],
        'tools' => [
            ['name' => 'Sensor Kelembapan Tanah', 'specification' => 'Input kondisi tanah'],
            ['name' => 'Relay 1 Channel', 'specification' => 'Saklar pompa DC'],
            ['name' => 'Pompa Air Mini', 'specification' => 'Aktuator penyiram'],
            ['name' => 'Arduino Uno', 'specification' => 'Board kontrol'],
        ],
        'nodes' => pickNodes($ideArduflowNodes, [
            'Analog In',
            'Comparator',
            'If Then Else',
            'Digital Out',
            'Delay',
            'Timer',
            'Schedule',
            'EEPROM Store',
            'EEPROM Read',
        ]),
        'steps' => [
            ['order' => 1, 'description' => 'Pasang sensor kelembapan pada media tanam.'],
            ['order' => 2, 'description' => 'Hubungkan relay dan pompa sesuai tegangan kerja.'],
            ['order' => 3, 'description' => 'Buat logika jika tanah kering maka relay aktif.'],
            ['order' => 4, 'description' => 'Uji durasi penyiraman dan sesuaikan ambang sensor.'],
        ],
        'viewer' => 176,
        'likes' => 31,
        'saves' => 22,
    ],
    [
        'title' => 'Alarm Pintu Magnetik',
        'category' => 'Keamanan',
        'description' => 'Proyek alarm pintu sederhana menggunakan magnetic switch dan buzzer sebagai latihan sistem keamanan IoT dasar.',
        'difficulty' => 'Pemula',
        'estimatedTime' => '1 jam',
        'programmingLanguage' => 'Arduino',
        'status' => 'published',
        'visibility' => 'public',
        'payment' => ['isPaid' => false, 'price' => 0, 'currency' => 'IDR', 'paymentCode' => ''],
        'tags' => ['IoT', 'Keamanan', 'Magnetic Switch', 'Buzzer'],
        'tools' => [
            ['name' => 'Magnetic Door Switch', 'specification' => 'Sensor buka tutup pintu'],
            ['name' => 'Buzzer', 'specification' => 'Alarm suara'],
            ['name' => 'Arduino Uno', 'specification' => 'Board kontrol'],
        ],
        'nodes' => pickNodes($ideArduflowNodes, [
            'Digital In',
            'If Then Else',
            'Logic NOT',
            'Logic OR',
            'Pulse Timer',
            'Latch (SR / Hold)',
            'Digital Out',
            'Serial RX Switch',
        ]),
        'steps' => [
            ['order' => 1, 'description' => 'Pasang magnetic switch pada pintu dan kusen.'],
            ['order' => 2, 'description' => 'Hubungkan buzzer ke pin digital Arduino.'],
            ['order' => 3, 'description' => 'Buat kondisi jika pintu terbuka maka buzzer menyala.'],
            ['order' => 4, 'description' => 'Uji alarm dengan membuka dan menutup pintu.'],
        ],
        'viewer' => 141,
        'likes' => 21,
        'saves' => 13,
    ],
];

$find = $pdo->prepare('SELECT id, payload_json, created_at FROM project_submissions WHERE lower(title) = lower(:title) LIMIT 1');
$insert = $pdo->prepare(
    'INSERT INTO project_submissions (
        title, category, description, status, visibility,
        payload_json, created_at, updated_at
    ) VALUES (
        :title, :category, :description, :status, :visibility,
        :payload_json, :created_at, :updated_at
    )'
);
$update = $pdo->prepare(
    'UPDATE project_submissions
     SET title = :title,
         category = :category,
         description = :description,
         status = :status,
         visibility = :visibility,
         payload_json = :payload_json,
         updated_at = :updated_at
     WHERE id = :id'
);

$created = 0;
$updated = 0;

$pdo->beginTransaction();

foreach ($projects as $project) {
    $find->execute([':title' => $project['title']]);
    $existing = $find->fetch();

    $payload = array_replace([
        'ownerName' => 'Admin',
        'ownerUsername' => 'admin',
        'userId' => 'admin',
        'coverImage' => null,
        'projectFile' => null,
    ], $project);
    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

    if ($existing) {
        $update->execute([
            ':title' => $project['title'],
            ':category' => $project['category'],
            ':description' => $project['description'],
            ':status' => $project['status'],
            ':visibility' => $project['visibility'],
            ':payload_json' => $payloadJson,
            ':updated_at' => $now,
            ':id' => (int) $existing['id'],
        ]);
        $updated++;
        continue;
    }

    $insert->execute([
        ':title' => $project['title'],
        ':category' => $project['category'],
        ':description' => $project['description'],
        ':status' => $project['status'],
        ':visibility' => $project['visibility'],
        ':payload_json' => $payloadJson,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);
    $created++;
}

$pdo->commit();

echo json_encode([
    'success' => true,
    'created' => $created,
    'updated' => $updated,
    'total' => count($projects),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
