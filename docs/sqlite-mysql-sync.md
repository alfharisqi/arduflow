# SQLite Primary and MySQL Synchronization

## Architecture

```text
Browser / API client
        |
        v
Arduflow Express API
        |
        +--> SQLite (operational source of truth)
                 |
                 +--> domain row + sync_outbox event (same transaction)
                                   |
                                   v
                         worker / cron every 5 minutes
                                   |
                                   v
                 signed internal synchronization API
                                   |
                                   v
                     MySQL (central copy/reporting)
```

All user-facing reads and writes use SQLite. MySQL is never required to finish a
user request. The current proof of concept covers `users`, `admins`, `leads`, and
`workshops`; the same repository/outbox pattern should be applied when operational
CRUD is added for the remaining content tables.

## SQLite

The default private database path is `website/BE/storage/database/arduflow.sqlite`.
It is outside the frontend and is ignored by Git. Every connection opened through
`server/sqlite.js` applies:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

Initialize or migrate the schema:

```bash
cd website/BE
npm run db:sqlite
```

If the old `storage/sqlite/arduflow.sqlite` exists and the configured database does
not, initialization creates a consistent `VACUUM INTO` copy. A pre-migration backup
is created before schema changes.

## Transactional Outbox

Each insert/update/soft delete and its `sync_outbox` event are committed in one
`BEGIN IMMEDIATE` transaction. Outbox events are retained after synchronization
with status `synced`; they are not deleted by the worker. Deletes set `deleted_at`
and increment `version` instead of removing the source row.

Statuses are `pending`, `processing`, `synced`, and `failed`. A transient error
returns an event to `pending` and schedules exponential retry at 1, 5, 15, 30, then
at most 60 minutes. Non-retryable validation failures use `failed`.

## Environment

Copy values from `website/BE/.env.example` into the ignored `website/BE/.env`.
Important variables:

```env
SQLITE_DATABASE_PATH=storage/database/arduflow.sqlite
SYNC_ENABLED=true
SYNC_API_URL=http://127.0.0.1:3001/api/internal/sync/sqlite-to-mysql
SYNC_API_TOKEN=<long-random-token>
SYNC_HMAC_SECRET=<different-long-random-secret>
SYNC_MAX_CLOCK_SKEW_SECONDS=300
SYNC_BATCH_SIZE=250
SQLITE_BACKUP_ENABLED=true
SQLITE_BACKUP_DIRECTORY=storage/backups/sqlite
SQLITE_BACKUP_RETENTION_DAYS=14
```

Generate independent random values for token and HMAC secret. Do not log or commit
them. Rotate both values together on sender and receiver, then restart the worker
and API. Use HTTPS when sender and receiver run on different hosts. Optionally set
`SYNC_IP_ALLOWLIST` to comma-separated trusted addresses.

## Central MySQL Schema

Initialize the additive MySQL schema after taking a normal MySQL backup:

```bash
npm run db:mysql
```

The receiver stores idempotency keys in `processed_sync_events` and replay
protection values in `sync_nonces`. It validates Bearer token, HMAC SHA-256,
timestamp, nonce, table allowlist, column allowlist, row ID, operation, and version.
An older incoming version cannot overwrite a newer central row.

## Initial Import

Stop application writes during the first import, back up both databases, then run:

```bash
npm run db:sqlite
npm run db:import:mysql-to-sqlite
npm run db:check
```

The import preserves IDs, uses upsert so it can be resumed, and intentionally does
not create outbox events. It creates a safe SQLite backup first. The consistency
command is read-only and reports counts, missing IDs, version differences,
timestamp differences, soft-delete differences, and pending outbox count.

The import refuses to run while any outbox event is not `synced`. This prevents an
older MySQL snapshot from overwriting operational SQLite changes. Run the sync
worker first and confirm the pending count is zero before repeating an import.

## Running Synchronization

One manual batch:

```bash
npm run sync:run
```

The backend receiver configured by `SYNC_API_URL` must be running before the
worker starts. To retry pending events immediately after the connection recovers,
without waiting for their current backoff time:

```bash
npm run sync:retry-now
```

`--retry-now` only clears the retry delay for `pending` events. It does not alter
events that are already `synced` and should not be added to the normal cron job.

Production cron every five minutes (use one worker host):

```cron
*/5 * * * * cd /path/to/arduflow-code/website/BE && /usr/bin/node server/scripts/sync-sqlite-to-mysql.js >> /var/log/arduflow-sync.log 2>&1
```

Do not run an application `setInterval` in every web instance. Atomic event claims
prevent duplicate processing, but a dedicated cron/worker remains the preferred
production topology.

## APIs

Internal receiver:

```text
POST /api/internal/sync/sqlite-to-mysql
```

Admin session required:

```text
GET  /api/admin/database-sync/status
POST /api/admin/database-sync/run
POST /api/admin/database-sync/retry-failed
```

Database health:

```text
GET /api/health/database
```

The health response reports SQLite writability, optional MySQL reachability, queue
depth, and last successful synchronization without exposing credentials or the
filesystem path.

## Backup and Restore

Create a consistent backup using SQLite `VACUUM INTO`:

```bash
npm run db:backup
```

Backups older than `SQLITE_BACKUP_RETENTION_DAYS` are pruned. To restore:

1. Stop the API and worker.
2. Back up the current database.
3. Copy the selected backup to the configured `SQLITE_DATABASE_PATH`.
4. Start the API and run `npm run db:check`.
5. Run one sync batch and inspect the status endpoint.

## MySQL Outage Test

1. Start the API and frontend.
2. Stop MySQL or temporarily configure an unreachable MySQL port.
3. Register and log in a user.
4. Create or edit a workshop through an authenticated admin request.
5. Confirm the website request succeeds.
6. Inspect SQLite: the row and pending outbox event must exist.
7. Run `npm run sync:run`; the event must remain pending with retry metadata.
8. Restore MySQL and run `npm run db:mysql` if required.
9. Run `npm run sync:run` after `next_retry_at`, or clear it through the admin retry
   endpoint for permanently failed events.
10. Run `npm run db:check` and confirm the event is `synced`.

## Queue Operations

Use the admin status API for counts and last-run timestamps. `retry-failed` changes
only permanently failed events back to pending. Transient failures already retry
automatically. `sync_logs` stores batch totals and concise errors; it never stores
tokens, HMAC secrets, passwords, or complete sensitive payloads.

## Risks and Limits

- SQLite allows many readers but one writer at a time. WAL and `busy_timeout` reduce
  contention; sustained write-heavy workloads need a single local API writer or a
  later database architecture review.
- The SQLite file must live on local reliable storage, not a public directory or an
  unreliable network filesystem.
- MySQL is a one-way central copy. Direct writes to synchronized MySQL tables can
  conflict and are unsupported.
- `users` and `workshops` are the requested proof of concept. Existing static/admin
  content pages without backend CRUD still need repository methods before their
  future writes can produce outbox events.
- MySQL initialization and initial import require planned maintenance and backups.

## Rollback

1. Stop the sync cron and set `SYNC_ENABLED=false`.
2. Keep the SQLite database and outbox intact for audit/recovery.
3. Restore the pre-migration SQLite backup if the local schema must be rolled back.
4. Revert application code to the prior release only after verifying MySQL contains
   every required event with `npm run db:check`.
5. Do not switch writes silently between databases while both versions run.
