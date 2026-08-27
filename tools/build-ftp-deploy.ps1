param(
    [string] $OutputDir = "website/deploy/arduflow-ftp",
    [string] $ApiBaseUrl = "",
    [switch] $SkipFrontendBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendDir = Join-Path $repoRoot "website/FE"
$apiDir = Join-Path $repoRoot "website/BE"
$deployDir = Join-Path $repoRoot $OutputDir
$publicHtmlDir = Join-Path $deployDir "public_html"
$apiDeployDir = Join-Path $publicHtmlDir "api"

function Copy-DirectoryFiltered {
    param(
        [Parameter(Mandatory = $true)] [string] $Source,
        [Parameter(Mandatory = $true)] [string] $Destination,
        [string[]] $ExcludeNames = @()
    )

    if (!(Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination | Out-Null
    }

    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        if ($ExcludeNames -contains $_.Name) {
            return
        }

        $target = Join-Path $Destination $_.Name
        if ($_.PSIsContainer) {
            Copy-DirectoryFiltered -Source $_.FullName -Destination $target -ExcludeNames $ExcludeNames
        } else {
            Copy-Item -LiteralPath $_.FullName -Destination $target -Force
        }
    }
}

if (!(Test-Path $apiDir)) {
    throw "Folder backend PHP tidak ditemukan: $apiDir"
}

if (!(Test-Path $frontendDir)) {
    throw "Folder frontend tidak ditemukan: $frontendDir"
}

if (!$SkipFrontendBuild) {
    Push-Location $frontendDir
    try {
        $oldApiUrl = $env:VITE_API_URL
        $env:VITE_API_URL = $ApiBaseUrl
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            npm run build
        } else {
            node node_modules/vite/bin/vite.js build
        }
        $env:VITE_API_URL = $oldApiUrl
    } finally {
        Pop-Location
    }
}

$frontendDist = Join-Path $frontendDir "dist"
if (!(Test-Path $frontendDist)) {
    throw "Frontend dist tidak ditemukan. Jalankan build frontend lebih dulu atau pakai -SkipFrontendBuild jika dist sudah ada."
}

if (Test-Path $deployDir) {
    Remove-Item -LiteralPath $deployDir -Recurse -Force
}

New-Item -ItemType Directory -Path $publicHtmlDir | Out-Null
Copy-DirectoryFiltered -Source $frontendDist -Destination $publicHtmlDir

$frontendHtaccess = @'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^api(/.*)?$ api/index.php [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
'@
Set-Content -LiteralPath (Join-Path $publicHtmlDir ".htaccess") -Value $frontendHtaccess -Encoding UTF8

$apiExcludes = @(".env", ".gitignore", "public", "storage", "tests")
Copy-DirectoryFiltered -Source $apiDir -Destination $apiDeployDir -ExcludeNames $apiExcludes

$apiIndex = @'
<?php

declare(strict_types=1);

use Arduflow\Api\Http\ErrorHandler;
use Arduflow\Api\Http\Request;

$root = __DIR__;
$autoload = $root . '/vendor/autoload.php';

if (!is_file($autoload)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Dependency PHP belum diinstal. Upload folder vendor atau jalankan composer install di server.']);
    exit;
}

require $autoload;

$errorHandler = new ErrorHandler($root . '/storage/logs/app.log');
$errorHandler->register();

try {
    $app = require $root . '/bootstrap/app.php';
    $app->handle(Request::fromGlobals())->send();
} catch (Throwable $exception) {
    $errorHandler->render($exception)->send();
}
'@
Set-Content -LiteralPath (Join-Path $apiDeployDir "index.php") -Value $apiIndex -Encoding UTF8

$apiHtaccess = @'
Options -Indexes

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . index.php [L]
</IfModule>

<FilesMatch "(\.env|composer\.(json|lock)|.*\.sqlite|.*\.log)$">
    Require all denied
</FilesMatch>
'@
Set-Content -LiteralPath (Join-Path $apiDeployDir ".htaccess") -Value $apiHtaccess -Encoding UTF8

@("storage/database", "storage/backups/sqlite", "storage/logs") | ForEach-Object {
    $dir = Join-Path $apiDeployDir $_
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

$denyHtaccess = "Require all denied`n"
Set-Content -LiteralPath (Join-Path $apiDeployDir "storage/.htaccess") -Value $denyHtaccess -Encoding UTF8

$envProduction = @'
APP_ENV=production
APP_URL=https://domain-anda.com
FRONTEND_URL=https://domain-anda.com
CORS_ORIGIN=https://domain-anda.com

SQLITE_DATABASE_PATH=storage/database/arduflow.sqlite

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_arduflow
DB_USERNAME=
DB_PASSWORD=

MAIL_HOST=
MAIL_PORT=587
MAIL_SECURE=tls
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=Arduflow <no-reply@domain-anda.com>

SYNC_ENABLED=true
SYNC_API_URL=
SYNC_API_TOKEN=ganti_token_random
SYNC_HMAC_SECRET=ganti_secret_random
SYNC_MAX_CLOCK_SKEW_SECONDS=300
SYNC_BATCH_SIZE=250

MQTT_ENABLED=false
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=arduflow-php-api
MQTT_TOPIC_PREFIX=arduflow
MQTT_TIMEOUT_SECONDS=2

SQLITE_BACKUP_ENABLED=true
SQLITE_BACKUP_DIRECTORY=storage/backups/sqlite
SQLITE_BACKUP_RETENTION_DAYS=14
'@
Set-Content -LiteralPath (Join-Path $apiDeployDir ".env.production.example") -Value $envProduction -Encoding UTF8

$deployReadme = @'
# ArduFlow FTP Deploy

Folder ini siap diupload ke server FTP/PHP.

## Struktur

- `public_html/` berisi frontend React hasil build.
- `public_html/api/` berisi backend PHP API.
- `public_html/api/.env.production.example` harus disalin menjadi `.env` di server lalu disesuaikan.
- `public_html/api/storage/database/` adalah lokasi SQLite private.

## Setelah Upload

1. Upload isi folder `public_html` ke `public_html` server.
2. Di server, salin `public_html/api/.env.production.example` menjadi `public_html/api/.env`.
3. Isi credential MySQL, SMTP, domain, dan secret sync.
4. Pastikan PHP bisa menulis ke:
   - `public_html/api/storage/database`
   - `public_html/api/storage/logs`
   - `public_html/api/storage/backups/sqlite`
5. Jalankan inisialisasi database jika hosting menyediakan terminal:
   `php public_html/api/scripts/init-sqlite.php`
6. Jika tidak ada terminal, jalankan inisialisasi lokal lalu upload file SQLite ke `public_html/api/storage/database/arduflow.sqlite`.

## Cron Sync

Jika hosting menyediakan cron:

```cron
*/5 * * * * php /home/USER/public_html/api/scripts/sync-sqlite-to-mysql.php
```

## Catatan

Jangan upload file `.env` dari lokal. Gunakan `.env.production.example` sebagai template production.
'@
Set-Content -LiteralPath (Join-Path $deployDir "README.md") -Value $deployReadme -Encoding UTF8

Write-Host "Deploy folder siap: $deployDir"
