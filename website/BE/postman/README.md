# Arduflow Postman Tests

## Import

Import these two files into Postman:

1. `Arduflow API.postman_collection.json`
2. `Arduflow Local.postman_environment.json`

Select the **Arduflow Local** environment before sending requests.

## Required setup

Start the backend:

```powershell
cd website/BE
npm run dev
```

Set these secret environment values directly in Postman:

- `admin_password`: password for the configured local admin.
- `sync_api_token`: same value as `SYNC_API_TOKEN` in `.env`.
- `sync_hmac_secret`: same value as `SYNC_HMAC_SECRET` in `.env`.

Do not export or commit an environment after filling these values.

## Running the collection

Use **Run collection** and keep the folder order. The collection automatically:

- generates a unique email, WhatsApp number, and username;
- registers and logs in a user;
- stores user and admin bearer tokens;
- tests profile updates and protected admin routes;
- creates, updates, and soft-deletes a workshop;
- checks the outbox and runs one synchronization batch;
- checks invalid bearer tokens, invalid HMAC, and nonce replay;
- removes user and admin sessions at the end.

The internal signed probe deliberately uses a forbidden table. It verifies HMAC,
nonce, and table allowlist behavior without inserting central-only business data
into MySQL.

## Optional Mailpit verification

Start Mailpit on ports `1025` and `8025`, then set:

```text
run_mailpit_tests=true
```

The Mailpit folder finds the registration email, extracts its verification token,
and calls the email verification endpoint. Keep it `false` when Mailpit is not
running; Postman will skip the folder.

## MySQL outage test

1. Keep the backend running.
2. Stop MySQL.
3. Run folders `00 - Health`, `01 - User Authentication`, `03 - Leads`,
   and `05 - Workshops`.
4. Confirm the operational requests succeed and Database Health reports MySQL as
   `unreachable` with `required_for_user_request: false`.
5. Start MySQL again.
6. Run `06 - Database Sync Admin / Run Sync Worker`.
7. Run `Get Sync Status` and confirm the pending count decreases.

The collection creates test records in SQLite. User and lead cleanup endpoints do
not exist yet, so those rows remain as test data. Workshop cleanup uses soft
delete and intentionally remains available to the synchronization outbox.
