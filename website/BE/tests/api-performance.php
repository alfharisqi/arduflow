<?php

declare(strict_types=1);

// Isolated SQLite fixtures: no application database, SMTP, MQTT or network access.
require_once dirname(__DIR__) . '/vendor/autoload.php';

final class ApiCountingStatement extends PDOStatement
{
    protected function __construct(private ApiCountingPdo $connection) {}

    public function execute(?array $params = null): bool
    {
        $this->connection->queries[] = $this->queryString;
        return parent::execute($params);
    }
}

final class ApiCountingPdo extends PDO
{
    public array $queries = [];

    public function __construct()
    {
        parent::__construct('sqlite::memory:', null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->setAttribute(PDO::ATTR_STATEMENT_CLASS, [ApiCountingStatement::class, [$this]]);
    }

    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        $this->queries[] = $query;
        return $fetchMode === null ? parent::query($query) : parent::query($query, $fetchMode, ...$fetchModeArgs);
    }

    public function exec(string $statement): int|false
    {
        $this->queries[] = $statement;
        return parent::exec($statement);
    }
}

final class ApiCapturedResponse extends RuntimeException
{
    public function __construct(public array $payload) { parent::__construct('Captured JSON response'); }
}

/** Load selected functions without executing the endpoint's HTTP/database bootstrap. */
function loadApiFunctions(string $file, string $namespace, array $names, string $stubs = ''): void
{
    $tokens = token_get_all((string) file_get_contents($file));
    $functions = [];
    for ($i = 0, $count = count($tokens); $i < $count; $i++) {
        if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) {
            continue;
        }
        $j = $i + 1;
        while (isset($tokens[$j]) && is_array($tokens[$j]) && $tokens[$j][0] === T_WHITESPACE) { $j++; }
        if (!is_array($tokens[$j] ?? null) || $tokens[$j][0] !== T_STRING || !in_array($tokens[$j][1], $names, true)) {
            continue;
        }
        $name = $tokens[$j][1];
        $body = '';
        $depth = 0;
        $opened = false;
        for (; $i < $count; $i++) {
            $token = $tokens[$i];
            $body .= is_array($token) ? $token[1] : $token;
            if ($token === '{' || (is_array($token) && in_array($token[0], [T_CURLY_OPEN, T_DOLLAR_OPEN_CURLY_BRACES], true))) {
                $depth++;
                $opened = true;
            } elseif ($token === '}' && --$depth === 0 && $opened) {
                break;
            }
        }
        $functions[$name] = $body;
    }
    if (count($functions) !== count($names)) {
        throw new RuntimeException('Missing test functions in ' . $file);
    }
    eval('namespace ' . $namespace . '; use \PDO; use \WeakMap; use \Throwable; use \RuntimeException; use \InvalidArgumentException; '
        . $stubs . implode("\n", $functions));
}

$assertions = 0;
$assert = static function (bool $condition, string $message) use (&$assertions): void {
    $assertions++;
    if (!$condition) { throw new RuntimeException($message); }
};
$api = dirname(__DIR__) . '/api';
$baseline = $argv[1] ?? null;
$materialFunctions = ['getAllMateri'];
$stubs = 'function sendJsonResponse(array $payload, int $status = 200): void { throw new \ApiCapturedResponse($payload); }
    function getArticleImagePath(?string $name): ?string { return $name === null ? null : "/cards/" . $name; }
    function getArticleImageUrl(?string $name): ?string { return getArticleImagePath($name); }
    function getSlideImagePath(?string $name): ?string { return $name === null ? null : "/slides/" . $name; }
    function getSlideImageUrl(?string $name): ?string { return getSlideImagePath($name); }';
loadApiFunctions($api . '/materi-api.php', 'CurrentMateri', $materialFunctions, $stubs);
$pdo = new ApiCountingPdo();
$pdo->exec('CREATE TABLE tutorials (
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
)');
$pdo->exec('CREATE TABLE tutorial_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutorial_id INTEGER NOT NULL,
    chapter_order INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)');
$pdo->exec('CREATE TABLE tutorial_learning_objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutorial_id INTEGER NOT NULL,
    objective_order INTEGER NOT NULL DEFAULT 1,
    objective TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)');
$pdo->exec('CREATE TABLE tutorial_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutorial_id INTEGER NOT NULL,
    chapter_id INTEGER,
    slide_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT "text",
    content TEXT,
    code_title TEXT,
    code_language TEXT,
    code_content TEXT,
    allow_copy INTEGER NOT NULL DEFAULT 1,
    estimated_time TEXT,
    status TEXT NOT NULL DEFAULT "draft",
    image_name TEXT,
    image_type TEXT,
    image_size INTEGER,
    video_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)');
for ($id = 1; $id <= 100; $id++) {
    $pdo->exec("INSERT INTO tutorials (id, title, slug, category, short_description, full_description, page_order, display_order, created_at, updated_at)
        VALUES ($id, 'Materi $id', 'materi-$id', 'IoT', 'Ringkas', 'Lengkap', 1, " . ($id % 3) . ", '2026-01-01', '2026-01-02')");
    if ($id !== 1) {
        $pdo->exec("INSERT INTO tutorial_chapters (id, tutorial_id, chapter_order, title, created_at, updated_at)
            VALUES ($id, $id, 1, 'Bab', '2026-01-01', '2026-01-02')");
    }
    $pdo->exec("INSERT INTO tutorial_slides (tutorial_id, slide_order, title, content_type, content, created_at, updated_at)
        VALUES ($id, 2, 'Slide kedua', 'text', 'Konten kedua', '2026-01-01', '2026-01-02'),
               ($id, 1, 'Slide pertama', 'text', 'Konten pertama', '2026-01-01', '2026-01-02')");
    $pdo->exec("INSERT INTO tutorial_learning_objectives (tutorial_id, objective_order, objective, created_at, updated_at)
        VALUES ($id, 2, '  ', '2026-01-01', '2026-01-02'), ($id, 1, ' Tujuan ', '2026-01-01', '2026-01-02')");
}
$capture = static function (string $function, PDO $db): array {
    try { $function($db); } catch (ApiCapturedResponse $response) { return $response->payload; }
    throw new RuntimeException('No response');
};
$pdo->queries = [];
$current = $capture('CurrentMateri\getAllMateri', $pdo);
$materialQueries = count($pdo->queries);
$assert($materialQueries === 4, 'Materi must use four queries independent of item count');
$assert($current['total'] === 100, 'All tutorials retained');
$byId = array_column($current['data'], null, 'id');
$assert($byId[1]['chapters'][0]['id'] === 'legacy-1', 'Virtual legacy chapter retained');
$assert($byId[1]['slides'][0]['chapter_id'] === 'legacy-1', 'Legacy slide assignment retained');
$assert($byId[2]['slides'][0]['chapter_id'] === $byId[2]['chapters'][0]['id'], 'Unassigned slide uses first chapter');
$assert($byId[2]['slides'][0]['title'] === 'Slide pertama', 'Slide ordering retained');
$assert($byId[2]['learning_objectives'] === ['Tujuan'], 'Objective whitespace filtering retained');
$beforeMaterialQueries = null;
if ($baseline !== null) {
    loadApiFunctions($baseline . '/materi-api.php', 'BeforeMateri', $materialFunctions, $stubs);
    $pdo->queries = [];
    $before = $capture('BeforeMateri\getAllMateri', $pdo);
    $beforeMaterialQueries = count($pdo->queries);
    $assert($before === $current, 'Materi response differs from baseline');
}
loadApiFunctions($api . '/user-notifications-api.php', 'CurrentNotifications', ['notificationSentEmailKeys', 'notificationEmailWasSent']);
$logs = new ApiCountingPdo();
$logs->exec('CREATE TABLE user_notification_email_logs (id INTEGER PRIMARY KEY, notification_key TEXT, email TEXT, UNIQUE(notification_key, email))');
$notifications = [];
for ($id = 0; $id < 100; $id++) {
    $key = 'transaction_paid:' . $id;
    $notifications[] = ['key' => $key];
    $email = $id < 60 ? 'USER@example.com' : 'other@example.com';
    $logs->exec("INSERT INTO user_notification_email_logs (notification_key, email) VALUES ('$key', '$email')");
}
$logs->queries = [];
$sent = CurrentNotifications\notificationSentEmailKeys($logs, $notifications, 'user@example.com');
$notificationQueries = count($logs->queries);
$assert($notificationQueries === 1 && count($sent) === 60, 'Delivery flags must use one query and isolate recipients');
foreach ($notifications as $notification) {
    $assert(isset($sent[$notification['key']]) === CurrentNotifications\notificationEmailWasSent($logs, $notification['key'], 'user@example.com'), 'Delivery flag differs from legacy lookup');
}
$logs->queries = [];
$assert(CurrentNotifications\notificationSentEmailKeys($logs, [], 'user@example.com') === [], 'Empty notifications need no lookup');
$assert(CurrentNotifications\notificationSentEmailKeys($logs, $notifications, '') === [], 'Empty email needs no lookup');
$assert($logs->queries === [], 'Empty inputs must not query');

$transactions = new ApiCountingPdo();
$transactions->exec('CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT,
    deleted_at TEXT,
    updated_at TEXT,
    created_at TEXT
)');
$installed = Arduflow\Api\Database\ApiQueryIndexes::install($transactions);
$assert(in_array('afw_transactions_email_feed', $installed['created'], true), 'Transaction email index installed');
$assert(Arduflow\Api\Database\ApiQueryIndexes::install($transactions)['created'] === [], 'Index installation is idempotent');
$plan = $transactions->query("EXPLAIN QUERY PLAN SELECT id FROM transactions
    WHERE deleted_at IS NULL AND LOWER(email) = LOWER('user@example.com')
    ORDER BY updated_at DESC, created_at DESC LIMIT 50")->fetchAll();
$planText = implode(' ', array_column($plan, 'detail'));
$assert(str_contains($planText, 'afw_transactions_email_feed'), 'Email query uses the expression index');
$assert(!str_contains($planText, 'TEMP B-TREE'), 'Notification ordering needs no temporary sort');

require_once $api . '/support/sync-outbox.php';
$sync = new ApiCountingPdo();
$sync->exec('CREATE TABLE leads (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    whatsapp TEXT,
    topic TEXT,
    message TEXT,
    source TEXT,
    status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1
)');
$sync->exec("CREATE TABLE sync_outbox (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TEXT,
    last_error TEXT,
    worker_id TEXT,
    locked_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT
)");
$sync->exec("INSERT INTO leads (id, name, email, whatsapp, topic, message, source, status, created_at, updated_at)
    VALUES (1, 'Fixture', 'user@example.com', '628111', 'IoT', 'Message', 'test', 'new', '2026-01-01', '2026-01-01')");
afwSyncEnqueue($sync, 'leads', 1, 'insert', false);
afwSyncEnqueue($sync, 'leads', 1, 'update');
afwSyncEnqueue($sync, 'leads', 1, 'delete');
$events = $sync->query('SELECT operation, version, payload FROM sync_outbox ORDER BY rowid')->fetchAll();
$assert(array_column($events, 'operation') === ['insert', 'update', 'delete'], 'Sync operations retained');
$assert(array_map('intval', array_column($events, 'version')) === [1, 2, 3], 'Sync version increments retained');
$assert(json_decode($events[2]['payload'], true)['deleted_at'] !== null, 'Sync soft delete retained');

$certificateFunctions = ['tableExists', 'decodeJsonArray', 'getWorkshopIdByTitle'];
loadApiFunctions($api . '/certificate-api.php', 'CurrentCertificates', $certificateFunctions);
$workshops = new ApiCountingPdo();
$workshops->exec('CREATE TABLE workshops (id INTEGER PRIMARY KEY, title TEXT, payload_json TEXT)');
$workshopInsert = $workshops->prepare('INSERT INTO workshops VALUES (?, ?, ?)');
foreach ([[1, 'Direct', ['title' => 'Legacy']], [2, '', ['title' => 'Legacy']], [3, '', ['title' => 'Other legacy']], [4, 'Broken', '{bad']] as [$id, $title, $payload]) {
    $workshopInsert->execute([$id, $title, is_array($payload) ? json_encode($payload) : $payload]);
}
$workshops->queries = [];
$titleResults = [];
foreach (['Direct', ' legacy ', 'OTHER LEGACY', 'Missing', 'Missing again', 'Broken'] as $title) {
    $titleResults[] = CurrentCertificates\getWorkshopIdByTitle($workshops, $title);
}
$assert($titleResults === [1, 2, 3, null, null, 4], 'Certificate title fallback and highest-id precedence retained');
$fallbackQueries = count(array_filter($workshops->queries, static fn ($sql) => str_contains($sql, 'SELECT id, payload_json')));
$assert($fallbackQueries === 1, 'Certificate legacy payloads scanned only once per connection');
if ($baseline !== null) {
    loadApiFunctions($baseline . '/certificate-api.php', 'BeforeCertificates', $certificateFunctions);
    $beforeTitles = [];
    foreach (['Direct', ' legacy ', 'OTHER LEGACY', 'Missing', 'Missing again', 'Broken'] as $title) {
        $beforeTitles[] = BeforeCertificates\getWorkshopIdByTitle($workshops, $title);
    }
    $assert($beforeTitles === $titleResults, 'Certificate title results differ from baseline');
}

echo json_encode([
    'success' => true, 'assertions' => $assertions,
    'materi_100_items_queries' => ['before' => $beforeMaterialQueries, 'after' => $materialQueries],
    'endpoint_schema_setup' => 'moved_to_cli_migration',
    'notification_delivery_queries_100_items' => ['before' => 100, 'after' => $notificationQueries],
    'certificate_legacy_title_scans' => $fallbackQueries,
    'notification_query_plan' => $planText,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
