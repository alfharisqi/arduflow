CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NULL,
    user_name TEXT,
    email TEXT,
    item_type TEXT NOT NULL DEFAULT 'workshop',
    item_id INTEGER NULL,
    item_title TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    payment_method TEXT,
    payment_channel TEXT,
    payment_code TEXT,
    recipient_name TEXT,
    qris_file_name TEXT,
    qris_file_type TEXT,
    qris_file_size INTEGER,
    qris_file_path TEXT,
    qris_file_url TEXT,
    invoice_number TEXT NOT NULL UNIQUE,
    reference_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TEXT,
    due_at TEXT,
    notes TEXT,
    proof_file_name TEXT,
    proof_file_type TEXT,
    proof_file_size INTEGER,
    proof_file_path TEXT,
    proof_file_url TEXT,
    proof_uploaded_at TEXT,
    reviewed_at TEXT,
    reviewed_by TEXT,
    rejection_reason TEXT,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE TABLE IF NOT EXISTS user_entitlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    user_id INTEGER NULL,
    email TEXT,
    product_type TEXT NOT NULL,
    product_id INTEGER NULL,
    product_title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    granted_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_transaction ON user_entitlements(transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_email ON user_entitlements(email);

CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    method_type TEXT NOT NULL DEFAULT 'Transfer Bank',
    channel TEXT,
    recipient_name TEXT,
    payment_code TEXT,
    qris_file_name TEXT,
    qris_file_type TEXT,
    qris_file_size INTEGER,
    qris_file_path TEXT,
    qris_file_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
