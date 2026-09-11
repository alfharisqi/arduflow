<?php
declare(strict_types=1);

namespace Arduflow\Api\Services;

use PDO;
use RuntimeException;
use Arduflow\Api\Security\PasswordHasher;

final class PayoutException extends RuntimeException {}

final class PayoutService
{
    public function __construct(private PDO $pdo, private \Closure $sendMail, private int $now = 0)
    {
        $this->now = $now ?: time();
    }

    public function install(): void
    {
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS payout_security (
            user_id INTEGER PRIMARY KEY, pin_hash TEXT, failures INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER NOT NULL DEFAULT 0, cooldown_until INTEGER NOT NULL DEFAULT 0);
            CREATE TABLE IF NOT EXISTS payout_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, bank TEXT NOT NULL,
            number TEXT NOT NULL, name TEXT NOT NULL, available_at INTEGER NOT NULL,
            UNIQUE(user_id, bank, number));
            CREATE TABLE IF NOT EXISTS payout_challenges (
            id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, purpose TEXT NOT NULL,
            payload_json TEXT NOT NULL, code_hash TEXT NOT NULL, created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL, used_at INTEGER, result_json TEXT);
            CREATE INDEX IF NOT EXISTS payout_challenges_user ON payout_challenges(user_id, created_at);
            CREATE TABLE IF NOT EXISTS payout_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, message TEXT NOT NULL,
            created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS payout_config (id INTEGER PRIMARY KEY CHECK(id=1), commission_rate INTEGER NOT NULL);
            INSERT OR IGNORE INTO payout_config VALUES (1, 10)');
    }

    private function query(string $sql, array $params = []): \PDOStatement
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        return $statement;
    }

    private function security(int $id): array
    {
        $this->query('INSERT OR IGNORE INTO payout_security(user_id) VALUES (?)', [$id]);
        return $this->query('SELECT * FROM payout_security WHERE user_id=?', [$id])->fetch(PDO::FETCH_ASSOC);
    }

    private function unlocked(int $id): array
    {
        $security = $this->security($id);
        if ((int) $security['locked_until'] > $this->now) {
            throw new PayoutException('Percobaan dibatasi. Coba kembali setelah ' . date('c', (int) $security['locked_until']), 429);
        }
        return $security;
    }

    private function fail(int $id, string $message): never
    {
        $security = $this->security($id);
        $failures = (int) $security['failures'] + 1;
        $locked = $failures % 5 === 0 ? $this->now + 900 : 0;
        $this->query('UPDATE payout_security SET failures=?, locked_until=? WHERE user_id=?', [$failures, $locked, $id]);
        if ($locked) {
            $this->notify($id, 'Pencairan dikunci selama 15 menit karena lima percobaan verifikasi gagal.');
        }
        throw new PayoutException($locked ? 'Lima percobaan gagal. Pencairan dikunci selama 15 menit.' : $message, $locked ? 429 : 422);
    }

    private function password(array $user, string $password): void
    {
        $this->unlocked((int) $user['id']);
        if (!(new PasswordHasher(true))->verify($password, (string) $user['password_hash'])->valid) {
            $this->fail((int) $user['id'], 'Password tidak sesuai.');
        }
        if (empty($user['email_verified_at'])) {
            throw new PayoutException('Verifikasi email akun sebelum mengatur pencairan.', 403);
        }
    }

    private function pin(int $id, string $pin): void
    {
        $security = $this->unlocked($id);
        if (empty($security['pin_hash'])) {
            throw new PayoutException('Aktifkan PIN transaksi terlebih dahulu.', 409);
        }
        if (!preg_match('/^\d{6}$/D', $pin) || !password_verify($pin, $security['pin_hash'])) {
            $this->fail($id, 'PIN transaksi tidak sesuai.');
        }
    }

    public function commissionRate(): int
    {
        return (int) $this->query('SELECT commission_rate FROM payout_config WHERE id=1')->fetchColumn();
    }

    public function setCommissionRate(int $rate): void
    {
        if ($rate < 0 || $rate > 100) throw new PayoutException('Komisi harus 0 sampai 100 persen.', 422);
        $this->query('UPDATE payout_config SET commission_rate=? WHERE id=1', [$rate]);
    }

    public function balances(int $userId): array
    {
        $projects = $this->query('SELECT id,title,payload_json FROM project_submissions WHERE deleted_at IS NULL')->fetchAll(PDO::FETCH_ASSOC);
        $rows = [];
        foreach ($projects as $project) {
            $payload = json_decode($project['payload_json'], true) ?: [];
            if ((int) ($payload['userId'] ?? $payload['user_id'] ?? 0) !== $userId) continue;
            $gross = (int) floor((float) $this->query('SELECT COALESCE(SUM(amount),0) FROM transactions WHERE item_type="project" AND item_id=? AND status="paid" AND currency="IDR" AND deleted_at IS NULL', [$project['id']])->fetchColumn());
            $reserved = (int) ceil((float) $this->query('SELECT COALESCE(SUM(amount),0) FROM transactions WHERE item_type="project_payout" AND item_id=? AND status NOT IN ("rejected","cancelled","refunded")', [$project['id']])->fetchColumn());
            $commission = (int) ceil($gross * $this->commissionRate() / 100);
            $rows[] = ['projectId' => (int) $project['id'], 'title' => $project['title'], 'gross' => $gross,
                'commission' => $commission, 'reserved' => $reserved, 'available' => max(0, $gross - $commission - $reserved)];
        }
        return $rows;
    }

    public function status(array $user): array
    {
        $id = (int) $user['id'];
        $security = $this->security($id);
        $accounts = $this->query('SELECT * FROM payout_accounts WHERE user_id=? ORDER BY id DESC', [$id])->fetchAll(PDO::FETCH_ASSOC);
        foreach ($accounts as &$account) {
            $account['number'] = '•••• ' . substr($account['number'], -4);
        }
        unset($account);
        return ['hasPin' => !empty($security['pin_hash']), 'lockedUntil' => (int) $security['locked_until'],
            'cooldownUntil' => (int) $security['cooldown_until'], 'accounts' => $accounts,
            'balances' => $this->balances($id), 'commissionRate' => $this->commissionRate(),
            'notifications' => $this->query('SELECT id,message,created_at FROM payout_notifications WHERE user_id=? ORDER BY id DESC LIMIT 10', [$id])->fetchAll(PDO::FETCH_ASSOC)];
    }

    private function notify(int $userId, string $message): void
    {
        $this->query('INSERT INTO payout_notifications(user_id,message,created_at) VALUES (?,?,?)', [$userId, $message, $this->now]);
    }

    public function notifyStatus(int $userId, string $invoice, string $status): void
    {
        $labels = ['processing' => 'diproses admin', 'proof_sent' => 'bukti transfer telah tersedia', 'done' => 'selesai', 'rejected' => 'ditolak; saldo kembali tersedia'];
        $this->notify($userId, 'Pencairan ' . $invoice . ': ' . ($labels[$status] ?? $status) . '.');
    }

    public function request(array $user, string $purpose, array $body): array
    {
        $id = (int) $user['id'];
        $this->unlocked($id);
        if (empty($user['email_verified_at'])) throw new PayoutException('Email akun harus terverifikasi.', 403);
        $payload = [];
        if ($purpose === 'pin') {
            $this->password($user, (string) ($body['password'] ?? ''));
            $pin = (string) ($body['newPin'] ?? '');
            if (!preg_match('/^\d{6}$/D', $pin) || preg_match('/^(\d)\1{5}$/', $pin) || str_contains('012345678909876543210', $pin)) {
                throw new PayoutException('Gunakan enam digit PIN yang tidak berulang atau berurutan.', 422);
            }
            if ($pin === (string) ($body['password'] ?? '')) throw new PayoutException('PIN harus berbeda dari password.', 422);
            $security = $this->security($id);
            $payload = ['hash' => password_hash($pin, PASSWORD_DEFAULT), 'reset' => !empty($security['pin_hash'])];
        } elseif ($purpose === 'account') {
            $this->password($user, (string) ($body['password'] ?? ''));
            $this->pin($id, (string) ($body['pin'] ?? ''));
            $payload = ['bank' => trim((string) ($body['bank'] ?? '')), 'number' => trim((string) ($body['number'] ?? '')), 'name' => trim((string) ($body['name'] ?? ''))];
            if ($payload['bank'] === '' || strlen($payload['bank']) > 80 || $payload['name'] === '' || strlen($payload['name']) > 150 || !preg_match('/^\d{6,30}$/D', $payload['number'])) {
                throw new PayoutException('Isi bank, nama pemilik, dan nomor rekening 6–30 digit.', 422);
            }
        } elseif ($purpose === 'payout') {
            $security = $this->security($id);
            if (empty($security['pin_hash'])) throw new PayoutException('Aktifkan PIN transaksi terlebih dahulu.', 409);
            if ((int) $security['cooldown_until'] > $this->now) throw new PayoutException('Pencairan ditunda 24 jam setelah reset PIN.', 409);
            $account = $this->query('SELECT * FROM payout_accounts WHERE id=? AND user_id=?', [(int) ($body['accountId'] ?? 0), $id])->fetch(PDO::FETCH_ASSOC);
            if (!$account || (int) $account['available_at'] > $this->now) throw new PayoutException('Pilih rekening terverifikasi yang sudah melewati masa tunggu 24 jam.', 409);
            $selected = array_map('intval', (array) ($body['projectIds'] ?? []));
            $rows = array_values(array_filter($this->balances($id), fn(array $row): bool => in_array($row['projectId'], $selected, true) && $row['available'] > 0));
            if (!$rows || count($rows) !== count(array_unique($selected))) throw new PayoutException('Pilihan proyek tidak valid atau saldo tidak tersedia.', 422);
            $total = array_sum(array_column($rows, 'available'));
            $amount = filter_var($body['amount'] ?? $total, FILTER_VALIDATE_INT);
            if ($amount === false || $amount < 1 || $amount > $total) throw new PayoutException('Nominal harus berupa rupiah bulat dan tidak melebihi saldo tersedia.', 422);
            $remaining = $amount;
            foreach ($rows as &$row) { $row['amount'] = min($row['available'], $remaining); $remaining -= $row['amount']; }
            unset($row);
            $rows = array_values(array_filter($rows, fn(array $row): bool => $row['amount'] > 0));
            $note = trim((string) ($body['note'] ?? ''));
            if (strlen($note) > 1000) throw new PayoutException('Catatan maksimal 1000 karakter.', 422);
            $payload = ['rows' => $rows, 'account' => $account, 'amount' => $amount, 'fee' => 0, 'net' => $amount, 'note' => $note];
        } else {
            throw new PayoutException('Aksi keamanan tidak dikenal.', 400);
        }
        $recent = $this->query('SELECT created_at FROM payout_challenges WHERE user_id=? AND created_at>? ORDER BY created_at DESC', [$id, $this->now - 3600])->fetchAll(PDO::FETCH_COLUMN);
        if (count($recent) >= 5 || ($recent && (int) $recent[0] > $this->now - 60)) throw new PayoutException('Tunggu 60 detik sebelum meminta kode lagi; maksimal lima kode per jam.', 429);
        $challengeId = bin2hex(random_bytes(24));
        $code = (string) random_int(100000, 999999);
        $this->query('INSERT INTO payout_challenges(id,user_id,purpose,payload_json,code_hash,created_at,expires_at) VALUES (?,?,?,?,?,?,?)',
            [$challengeId, $id, $purpose, json_encode($payload, JSON_THROW_ON_ERROR), password_hash($code, PASSWORD_DEFAULT), $this->now, $this->now + 600]);
        $description = match ($purpose) {
            'pin' => $payload['reset'] ? 'Reset PIN transaksi; pencairan ditunda 24 jam.' : 'Aktivasi PIN transaksi.',
            'account' => 'Pendaftaran rekening ' . $payload['bank'] . ' •••• ' . substr($payload['number'], -4) . ' atas nama ' . $payload['name'] . '.',
            'payout' => 'Pencairan Rp' . number_format($payload['amount'], 0, ',', '.') . ' ke ' . $account['bank'] . ' •••• ' . substr($account['number'], -4) . ' atas nama ' . $account['name'] . '.',
        };
        if (!(($this->sendMail)($user, $code, $description))) {
            $this->query('UPDATE payout_challenges SET used_at=? WHERE id=?', [$this->now, $challengeId]);
            throw new PayoutException('Kode tidak dapat dikirim. Periksa konfigurasi email; tidak ada perubahan atau pencairan yang diproses.', 503);
        }
        $public = $purpose === 'payout' ? $payload : [];
        if (isset($public['account'])) $public['account']['number'] = '•••• ' . substr($public['account']['number'], -4);
        return ['challengeId' => $challengeId, 'expiresAt' => $this->now + 600, 'summary' => $public, 'message' => 'Kode verifikasi dikirim ke email akun. Berlaku 10 menit.'];
    }

    public function confirm(array $user, array $body): array
    {
        $id = (int) $user['id'];
        $this->unlocked($id);
        $challenge = $this->query('SELECT * FROM payout_challenges WHERE id=? AND user_id=?', [(string) ($body['challengeId'] ?? ''), $id])->fetch(PDO::FETCH_ASSOC);
        if (!$challenge) throw new PayoutException('Permintaan verifikasi tidak ditemukan.', 404);
        // A retry after a lost response returns the original result, never another withdrawal.
        if ($challenge['used_at'] && $challenge['result_json']) return array_merge(json_decode($challenge['result_json'], true), ['replayed' => true]);
        if ($challenge['used_at'] || (int) $challenge['expires_at'] <= $this->now) throw new PayoutException('Kode kedaluwarsa atau telah dipakai. Mulai kembali.', 409);
        if (!password_verify((string) ($body['code'] ?? ''), $challenge['code_hash'])) $this->fail($id, 'Kode verifikasi tidak sesuai.');
        $payload = json_decode($challenge['payload_json'], true, 512, JSON_THROW_ON_ERROR);
        if ($challenge['purpose'] === 'payout') {
            $this->pin($id, (string) ($body['pin'] ?? ''));
            if ((int) $this->security($id)['cooldown_until'] > $this->now) throw new PayoutException('Pencairan masih dalam masa tunggu reset PIN.', 409);
            $balances = array_column($this->balances($id), null, 'projectId');
            foreach ($payload['rows'] as $row) {
                if (($balances[$row['projectId']]['available'] ?? 0) < $row['amount']) throw new PayoutException('Saldo berubah. Periksa kembali ringkasan pencairan.', 409);
            }
            $ids = [];
            $stamp = gmdate('Y-m-d\TH:i:s\Z', $this->now);
            foreach ($payload['rows'] as $row) {
                $invoice = 'AFW-OUT-' . strtoupper(bin2hex(random_bytes(10)));
                $account = $payload['account'];
                $this->query('INSERT INTO transactions(user_id,user_name,email,item_type,item_id,item_title,amount,currency,payment_method,payment_channel,payment_code,recipient_name,invoice_number,status,notes,payload_json,created_at,updated_at)
                    VALUES (?,?,?,"project_payout",?,?,?,"IDR","Transfer Bank",?,?,?,?,"payout_requested",?,?,?,?)',
                    [$id, $user['name'], $user['email'], $row['projectId'], 'Pencairan: ' . $row['title'], $row['amount'], $account['bank'], $account['number'], $account['name'], $invoice, $payload['note'],
                        json_encode(['purpose' => $payload['note'], 'authorizationId' => $challenge['id'], 'accountId' => $account['id'], 'fee' => 0], JSON_THROW_ON_ERROR), $stamp, $stamp]);
                $ids[] = (int) $this->pdo->lastInsertId();
                $this->notify($id, 'Pencairan ' . $invoice . ' diajukan. Rp' . number_format($row['amount'], 0, ',', '.') . ' ditahan hingga diproses admin.');
            }
            $result = ['transactionIds' => $ids, 'message' => 'Pengajuan diterima. Dana ditahan dan menunggu pemeriksaan admin.'];
        } elseif ($challenge['purpose'] === 'pin') {
            // Re-evaluate reset at confirmation so two pending activation codes cannot bypass the hold.
            $reset = !empty($this->security($id)['pin_hash']);
            $this->query('UPDATE payout_security SET pin_hash=?,cooldown_until=? WHERE user_id=?', [$payload['hash'], $reset ? $this->now + 86400 : 0, $id]);
            $this->query('UPDATE payout_challenges SET used_at=? WHERE user_id=? AND id<>? AND used_at IS NULL', [$this->now, $id, $challenge['id']]);
            $this->notify($id, $reset ? 'PIN transaksi direset. Pencairan ditunda 24 jam.' : 'PIN transaksi berhasil diaktifkan.');
            $result = ['message' => $reset ? 'PIN direset. Tunggu 24 jam sebelum pencairan.' : 'PIN transaksi aktif.'];
        } else {
            $this->query('INSERT INTO payout_accounts(user_id,bank,number,name,available_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,bank,number) DO UPDATE SET name=excluded.name, available_at=excluded.available_at', [$id, $payload['bank'], $payload['number'], $payload['name'], $this->now + 86400]);
            $this->query('UPDATE payout_challenges SET used_at=? WHERE user_id=? AND purpose="payout" AND used_at IS NULL', [$this->now, $id]);
            $this->notify($id, 'Rekening ' . $payload['bank'] . ' •••• ' . substr($payload['number'], -4) . ' didaftarkan. Dapat digunakan setelah 24 jam.');
            $result = ['message' => 'Rekening terverifikasi melalui email. Aktif untuk pencairan setelah 24 jam; nama pemilik diperiksa admin.'];
        }
        $this->query('UPDATE payout_security SET failures=0,locked_until=0 WHERE user_id=?', [$id]);
        $this->query('UPDATE payout_challenges SET used_at=?,result_json=? WHERE id=?', [$this->now, json_encode($result, JSON_THROW_ON_ERROR), $challenge['id']]);
        return $result;
    }
}
