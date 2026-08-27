<?php

declare(strict_types=1);

function ensureUploadStorage(string $projectRoot, string $module): array
{
    $safeModule = preg_replace('/[^a-z0-9_-]+/i', '-', strtolower($module)) ?: 'general';
    $uploadRoot = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads';
    $modulePath = $uploadRoot . DIRECTORY_SEPARATOR . $safeModule;

    foreach ([$uploadRoot, $modulePath] as $directory) {
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new RuntimeException('Folder upload tidak dapat dibuat: ' . $directory);
        }

        if (!is_writable($directory)) {
            throw new RuntimeException('Folder upload tidak memiliki izin tulis: ' . $directory);
        }
    }

    return [
        'module' => $safeModule,
        'path' => $modulePath,
        'url' => '/uploads/' . $safeModule,
    ];
}

function contentImageExtension(string $mimeType, string $fallbackName = ''): string
{
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/svg+xml' => 'svg',
    ];

    if (isset($extensions[strtolower($mimeType)])) {
        return $extensions[strtolower($mimeType)];
    }

    $extension = strtolower(pathinfo($fallbackName, PATHINFO_EXTENSION));

    return preg_match('/^[a-z0-9]{2,8}$/', $extension) === 1 ? $extension : 'bin';
}

function sanitizeStoredFileName(string $fileName): string
{
    $baseName = basename(str_replace('\\', '/', $fileName));
    $baseName = preg_replace('/[^a-zA-Z0-9._-]+/', '-', $baseName) ?: 'image';

    return trim($baseName, '.-') ?: 'image';
}

function normalizeStoredImage(?array $image, array $storage, string $prefix): ?array
{
    if ($image === null || $image === []) {
        return null;
    }

    $fileName = (string) (
        $image['file_name'] ??
        $image['fileName'] ??
        $image['name'] ??
        $image['filename'] ??
        ''
    );

    $fileType = (string) (
        $image['file_type'] ??
        $image['fileType'] ??
        $image['type'] ??
        ''
    );

    $fileSize = isset($image['file_size'])
        ? (int) $image['file_size']
        : (isset($image['size']) ? (int) $image['size'] : null);

    $path = (string) ($image['path'] ?? $image['file_path'] ?? '');
    $url = (string) ($image['url'] ?? $image['file_url'] ?? '');
    $rawData = (string) ($image['data'] ?? $image['base64'] ?? $image['data_url'] ?? '');

    if ($rawData !== '') {
        if (preg_match('/^data:([^;]+);base64,(.+)$/', $rawData, $matches) === 1) {
            $fileType = $fileType !== '' ? $fileType : $matches[1];
            $rawData = $matches[2];
        }

        $binary = base64_decode($rawData, true);

        if ($binary !== false) {
            $extension = contentImageExtension($fileType, $fileName);
            $fileName = sanitizeStoredFileName(
                $prefix . '-' . bin2hex(random_bytes(8)) . '.' . $extension
            );
            $absolutePath = $storage['path'] . DIRECTORY_SEPARATOR . $fileName;

            file_put_contents($absolutePath, $binary);

            $fileSize = strlen($binary);
            $path = $absolutePath;
            $url = rtrim($storage['url'], '/') . '/' . $fileName;
        }
    }

    if ($fileName === '' && $path !== '') {
        $fileName = basename(str_replace('\\', '/', $path));
    }

    if ($fileName === '') {
        return null;
    }

    $fileName = sanitizeStoredFileName($fileName);

    if ($path === '') {
        $path = $storage['path'] . DIRECTORY_SEPARATOR . $fileName;
    }

    if ($url === '') {
        $url = rtrim($storage['url'], '/') . '/' . $fileName;
    }

    return [
        'file_name' => $fileName,
        'file_type' => $fileType !== '' ? $fileType : null,
        'file_size' => $fileSize,
        'file_path' => $path,
        'file_url' => $url,
    ];
}

function addColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');
    $columns = array_map(
        static fn (array $row): string => (string) ($row['name'] ?? ''),
        $statement ? $statement->fetchAll(PDO::FETCH_ASSOC) : []
    );

    if (!in_array($column, $columns, true)) {
        $pdo->exec('ALTER TABLE ' . $table . ' ADD COLUMN ' . $column . ' ' . $definition);
    }
}
