<?php

declare(strict_types=1);

$projectRoot = dirname(__DIR__);
$repoRoot = dirname($projectRoot, 2);
$samplesDirectory = $repoRoot . DIRECTORY_SEPARATOR . 'proyek samples ide';
$config = require $projectRoot . '/config/database.php';
$databasePath = (string) ($config['sqlite']['path'] ?? '');
$uploadDirectory = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'projects';

if ($databasePath === '') {
    fwrite(STDERR, "Path SQLite tidak ditemukan.\n");
    exit(1);
}

if (!is_dir($samplesDirectory)) {
    fwrite(STDERR, "Folder sample IDE tidak ditemukan: {$samplesDirectory}\n");
    exit(1);
}

if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
    fwrite(STDERR, "Folder upload projects tidak dapat dibuat: {$uploadDirectory}\n");
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
    foreach ($pdo->query('PRAGMA table_info(' . $table . ')')->fetchAll() as $row) {
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

function humanizeName(string $value): string
{
    $baseName = pathinfo($value, PATHINFO_FILENAME);
    $words = preg_replace('/[-_]+/', ' ', $baseName) ?? $baseName;
    $words = preg_replace('/\s+/', ' ', trim($words)) ?? $words;

    return mb_convert_case($words, MB_CASE_TITLE, 'UTF-8');
}

function normalizeBoard(string $board): string
{
    $board = strtolower(trim($board));

    return match ($board) {
        'nano' => 'Arduino Nano',
        'esp32' => 'ESP32',
        'esp8266' => 'ESP8266',
        default => $board !== '' ? strtoupper($board) : 'Arduino',
    };
}

function nodeLabel(string $type): string
{
    return [
        'analogRead' => 'Analog In',
        'analogWrite' => 'PWM / Analog Out',
        'bulb' => 'Light Bulb',
        'compare' => 'Comparator',
        'constant' => 'Boolean (High/Low)',
        'counter' => 'Counter Up/Down',
        'delay' => 'Delay',
        'digitalRead' => 'Digital In',
        'digitalWrite' => 'Digital Out',
        'gauge' => 'Gauge Display',
        'ifElse' => 'If Then Else',
        'jsonOutput' => 'JSON Output',
        'jsonParser' => 'JSON Parser',
        'logicAnd' => 'Logic AND',
        'logicNot' => 'Logic NOT',
        'logicOr' => 'Logic OR',
        'logicOrMulti' => 'Logic OR +',
        'math' => 'Math Operation',
        'number' => 'Numeric Value',
        'pulse' => 'Pulse Timer',
        'schedule' => 'Schedule',
        'serialLog' => 'Serial TX',
        'serialRxString' => 'Serial RX (String)',
        'serialRxSwitch' => 'Serial RX Switch',
        'servo' => 'Servo Motor',
        'shiftRegister' => 'Shift Register 8-Ch',
        'softwareSerial' => 'SoftwareSerial',
        'squareWave' => 'Square Wave',
        'string' => 'String Value',
        'timer' => 'Timer',
    ][$type] ?? humanizeName($type);
}

function nodeDescription(string $type): string
{
    return [
        'analogRead' => '0 - 1023 RANGE',
        'analogWrite' => '0 - 255 RANGE',
        'bulb' => 'ON/OFF DISPLAY',
        'compare' => 'A > B?',
        'constant' => 'TOGGLE SIGNAL',
        'counter' => 'TRIGGER COUNT',
        'delay' => 'SIGNAL DELAY MS',
        'digitalRead' => 'READ PIN STATUS',
        'digitalWrite' => 'PIN: HIGH / LOW',
        'gauge' => 'VISUAL ANALOG',
        'ifElse' => 'CONDITIONAL BRANCH',
        'jsonOutput' => 'BUILD JSON STRING',
        'jsonParser' => 'EXTRACT JSON KEYS',
        'logicAnd' => 'TRUE IF BOTH',
        'logicNot' => 'INVERT SIGNAL',
        'logicOr' => 'TRUE IF ANY',
        'logicOrMulti' => 'ADJUSTABLE INPUTS',
        'math' => 'ARITHMETIC OPERATORS',
        'number' => 'STATIC NUMBER',
        'pulse' => 'HIGH FOR X MILLISECONDS',
        'schedule' => 'TIME RECURRING',
        'serialLog' => 'SEND DATA',
        'serialRxString' => 'RAW INCOMING TEXT',
        'serialRxSwitch' => 'MATCH COMMANDS',
        'servo' => '0 - 180° DEGREES',
        'shiftRegister' => '74HC595 / 8-BIT SIPO',
        'softwareSerial' => 'VIRTUAL SERIAL PORT',
        'squareWave' => 'OSCILLATOR SIGNAL',
        'string' => 'CUSTOM TEXT / STRING',
        'timer' => 'COUNT UP / DOWN',
    ][$type] ?? 'Node ArduFlow dari sample IDE.';
}

function inferCategory(string $fileName, array $project): string
{
    $lower = strtolower($fileName . ' ' . ($project['name'] ?? ''));

    if (str_contains($lower, 'mqtt')) return 'IoT MQTT';
    if (str_contains($lower, 'esp32') || str_contains($lower, 'esp8266')) return 'ESP IoT';
    if (str_contains($lower, 'relay')) return 'Relay Control';
    if (str_contains($lower, 'servo')) return 'Servo Control';
    if (str_contains($lower, 'buzzer')) return 'Buzzer';
    if (str_contains($lower, 'logic') || str_contains($lower, 'if_')) return 'Logic Control';
    if (str_contains($lower, 'traffic') || str_contains($lower, 'trafic')) return 'Traffic Light';

    return 'IoT Dasar';
}

function inferTools(string $fileName, string $board): array
{
    $lower = strtolower($fileName);
    $tools = [
        ['name' => normalizeBoard($board), 'specification' => 'Board utama untuk menjalankan flow ArduFlow'],
        ['name' => 'Kabel USB', 'specification' => 'Upload program dan komunikasi serial'],
    ];

    if (str_contains($lower, 'relay')) {
        $tools[] = ['name' => str_contains($lower, '8') ? 'Relay 8 Channel' : 'Relay Module', 'specification' => 'Output switching beban'];
    }

    if (str_contains($lower, 'buzzer')) {
        $tools[] = ['name' => 'Buzzer', 'specification' => 'Output suara'];
    }

    if (str_contains($lower, 'servo')) {
        $tools[] = ['name' => 'Servo Motor', 'specification' => 'Aktuator sudut 0-180 derajat'];
    }

    if (str_contains($lower, 'fan')) {
        $tools[] = ['name' => 'Kipas DC', 'specification' => 'Aktuator pendingin otomatis'];
    }

    if (str_contains($lower, 'traffic') || str_contains($lower, 'trafic')) {
        $tools[] = ['name' => 'LED Merah, Kuning, Hijau', 'specification' => 'Simulasi lampu lalu lintas'];
    }

    if (str_contains($lower, 'mqtt')) {
        $tools[] = ['name' => 'WiFi / MQTT Broker', 'specification' => 'Koneksi publish subscribe IoT'];
    }

    $tools[] = ['name' => 'Breadboard dan jumper', 'specification' => 'Perakitan rangkaian sederhana'];

    return $tools;
}

function buildNodeSummary(array $project): array
{
    $counts = [];

    foreach (($project['nodes'] ?? []) as $node) {
        $type = (string) ($node['type'] ?? 'node');
        $counts[$type] = ($counts[$type] ?? 0) + 1;
    }

    ksort($counts);

    $summary = [];
    foreach ($counts as $type => $count) {
        $summary[] = [
            'name' => nodeLabel($type),
            'description' => nodeDescription($type) . ($count > 1 ? " ({$count} node)" : ''),
            'type' => $type,
            'count' => $count,
        ];
    }

    return $summary;
}

function buildSteps(array $project): array
{
    $board = normalizeBoard((string) ($project['board'] ?? 'Arduino'));
    $nodeCount = count($project['nodes'] ?? []);
    $edgeCount = count($project['edges'] ?? []);

    return [
        ['order' => 1, 'description' => "Buka file flow sample IDE untuk board {$board}."],
        ['order' => 2, 'description' => "Periksa {$nodeCount} node dan {$edgeCount} koneksi pada canvas ArduFlow."],
        ['order' => 3, 'description' => 'Sesuaikan pin output/input sesuai rangkaian hardware yang dipakai.'],
        ['order' => 4, 'description' => 'Upload flow ke board, lalu uji setiap indikator dan aktuator.'],
    ];
}

function estimateTime(array $project): string
{
    $nodeCount = count($project['nodes'] ?? []);

    if ($nodeCount >= 20) return '2-3 jam';
    if ($nodeCount >= 10) return '1-2 jam';

    return '30-60 menit';
}

function difficulty(array $project): string
{
    $nodeCount = count($project['nodes'] ?? []);

    if ($nodeCount >= 20) return 'Lanjutan';
    if ($nodeCount >= 10) return 'Menengah';

    return 'Pemula';
}

$findBySource = $pdo->prepare(
    'SELECT id FROM project_submissions WHERE payload_json LIKE :source_file LIMIT 1'
);
$findByTitle = $pdo->prepare(
    'SELECT id FROM project_submissions WHERE lower(title) = lower(:title) LIMIT 1'
);
$insert = $pdo->prepare(
    'INSERT INTO project_submissions (
        title, category, description, status, visibility,
        project_file_name, project_file_type, project_file_size, project_file_path, project_file_url,
        payload_json, created_at, updated_at
    ) VALUES (
        :title, :category, :description, :status, :visibility,
        :project_file_name, :project_file_type, :project_file_size, :project_file_path, :project_file_url,
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
         project_file_name = :project_file_name,
         project_file_type = :project_file_type,
         project_file_size = :project_file_size,
         project_file_path = :project_file_path,
         project_file_url = :project_file_url,
         payload_json = :payload_json,
         updated_at = :updated_at
     WHERE id = :id'
);

$created = 0;
$updated = 0;
$failed = [];
$now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format(DateTimeInterface::ATOM);
$files = glob($samplesDirectory . DIRECTORY_SEPARATOR . '*.json') ?: [];

sort($files);
$pdo->beginTransaction();

foreach ($files as $samplePath) {
    $fileName = basename($samplePath);
    $rawJson = file_get_contents($samplePath);

    if ($rawJson === false) {
        $failed[] = ['file' => $fileName, 'error' => 'File tidak dapat dibaca.'];
        continue;
    }

    try {
        $ideProject = json_decode($rawJson, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        $failed[] = ['file' => $fileName, 'error' => $error->getMessage()];
        continue;
    }

    if (!is_array($ideProject)) {
        $failed[] = ['file' => $fileName, 'error' => 'Struktur JSON bukan object.'];
        continue;
    }

    $title = humanizeName($fileName);
    $category = inferCategory($fileName, $ideProject);
    $board = normalizeBoard((string) ($ideProject['board'] ?? 'Arduino'));
    $nodeCount = count($ideProject['nodes'] ?? []);
    $edgeCount = count($ideProject['edges'] ?? []);
    $description = "Sample project IDE ArduFlow untuk {$board} dengan {$nodeCount} node dan {$edgeCount} koneksi. Proyek ini diimpor dari file {$fileName}.";
    $storedName = 'ide-sample-' . strtolower(preg_replace('/[^A-Za-z0-9_.-]+/', '-', $fileName));
    $storedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;

    if (!copy($samplePath, $storedPath)) {
        $failed[] = ['file' => $fileName, 'error' => 'Gagal menyalin file ke storage projects.'];
        continue;
    }

    $projectFile = [
        'file_name' => $storedName,
        'original_name' => $fileName,
        'file_type' => 'application/json',
        'file_size' => filesize($storedPath) ?: strlen($rawJson),
        'file_path' => $storedPath,
        'file_url' => '/uploads/projects/' . $storedName,
    ];

    $payload = [
        'title' => $title,
        'category' => $category,
        'description' => $description,
        'status' => 'published',
        'visibility' => 'public',
        'ownerName' => 'Admin',
        'ownerUsername' => 'admin',
        'userId' => 'admin',
        'difficulty' => difficulty($ideProject),
        'estimatedTime' => estimateTime($ideProject),
        'programmingLanguage' => $board,
        'payment' => ['isPaid' => false, 'price' => 0, 'currency' => 'IDR', 'paymentCode' => ''],
        'tags' => array_values(array_filter(['IDE Sample', $category, $board])),
        'tools' => inferTools($fileName, (string) ($ideProject['board'] ?? 'Arduino')),
        'nodes' => buildNodeSummary($ideProject),
        'steps' => buildSteps($ideProject),
        'viewer' => max(10, $nodeCount * 7 + $edgeCount * 3),
        'likes' => max(1, (int) floor($nodeCount / 2)),
        'saves' => max(1, (int) floor($edgeCount / 3)),
        'projectFile' => $projectFile,
        'ideProject' => $ideProject,
        'sourceFile' => $fileName,
    ];
    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

    $findBySource->execute([
        ':source_file' => '%"sourceFile":"' . str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $fileName) . '"%',
    ]);
    $existing = $findBySource->fetch();

    if (!$existing) {
        $findByTitle->execute([':title' => $title]);
        $existing = $findByTitle->fetch();
    }
    $params = [
        ':title' => $title,
        ':category' => $category,
        ':description' => $description,
        ':status' => 'published',
        ':visibility' => 'public',
        ':project_file_name' => $projectFile['file_name'],
        ':project_file_type' => $projectFile['file_type'],
        ':project_file_size' => $projectFile['file_size'],
        ':project_file_path' => $projectFile['file_path'],
        ':project_file_url' => $projectFile['file_url'],
        ':payload_json' => $payloadJson,
        ':updated_at' => $now,
    ];

    if ($existing) {
        $update->execute($params + [':id' => (int) $existing['id']]);
        $updated++;
        continue;
    }

    $insert->execute($params + [':created_at' => $now]);
    $created++;
}

$pdo->commit();

echo json_encode([
    'success' => $failed === [],
    'created' => $created,
    'updated' => $updated,
    'failed' => $failed,
    'total_files' => count($files),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
