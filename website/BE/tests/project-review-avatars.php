<?php
declare(strict_types=1);

// Load legacy endpoint helpers without running its HTTP/database entry point.
$source = file_get_contents(dirname(__DIR__) . '/api/projects-api.php');
$helpers = preg_split('/\r?\ntry \{/', $source, 2)[0];
eval(substr($helpers, 5));

$pdo = new PDO('sqlite::memory:', null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, profile_image TEXT, avatar_path TEXT, deleted_at TEXT)');
$pdo->exec("INSERT INTO users VALUES
    (15, 'one@example.com', 'uploads/current.jpg', 'uploads/old.jpg', NULL),
    (16, 'two@example.com', '', 'uploads/avatar.jpg', NULL),
    (17, 'deleted@example.com', 'uploads/deleted.jpg', NULL, '2026-09-09')");
$reviews = [
    ['identity' => 'user:15', 'authorEmail' => 'outdated@example.com', 'value' => 5, 'authorName' => 'One'],
    ['identity' => 'email:TWO@example.com', 'authorEmail' => '', 'value' => 4],
    ['identity' => 'user:17', 'authorEmail' => 'deleted@example.com', 'value' => 3],
    ['identity' => 'user:999', 'authorEmail' => 'one@example.com', 'value' => 2],
];
$assertions = 0;
$check = static function (bool $condition, string $message) use (&$assertions): void {
    if (!$condition) throw new RuntimeException($message);
    $assertions++;
};
$_GET = ['userId' => '15'];
$row = array_replace(array_fill_keys(explode(', ', PROJECT_SELECT), null), [
    'id' => 70, 'title' => 'Fixture', 'category' => 'Test', 'description' => 'Test',
    'status' => 'published', 'visibility' => 'public',
    'payload_json' => json_encode(['ratingItems' => $reviews]),
]);
$project = rowToProject($pdo, $row);
$items = array_column($project['ratingItems'], null, 'identity');
$check($items['user:15']['authorAvatarUrl'] === 'uploads/current.jpg', 'current profile image by user ID');
$check($items['email:TWO@example.com']['authorAvatarUrl'] === 'uploads/avatar.jpg', 'case insensitive legacy email and avatar_path fallback');
$check($items['user:17']['authorAvatarUrl'] === '', 'deleted user has no photo');
$check($items['user:999']['authorAvatarUrl'] === '', 'unknown ID must not borrow another user photo');
$check($project['viewerReview']['authorAvatarUrl'] === 'uploads/current.jpg', 'viewer review contains same photo');
$pdo->exec("UPDATE users SET profile_image = 'uploads/changed.jpg' WHERE id = 15");
$project = rowToProject($pdo, $row);
$check($project['viewerReview']['authorAvatarUrl'] === 'uploads/changed.jpg', 'existing review follows profile update');
$pdo->exec('DROP TABLE users');
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, avatar_path TEXT)');
$pdo->exec("INSERT INTO users VALUES (15, 'one@example.com', 'uploads/legacy.jpg')");
$project = rowToProject($pdo, $row);
$check($project['viewerReview']['authorAvatarUrl'] === 'uploads/legacy.jpg', 'legacy schema supported');
$pdo->exec('DROP TABLE users');
$check(count(rowToProject($pdo, $row)['ratingItems']) === 4, 'missing users table does not break reviews');
echo "PASS: {$assertions} project review avatar assertions\n";
