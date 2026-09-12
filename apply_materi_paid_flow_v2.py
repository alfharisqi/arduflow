from pathlib import Path
import re
import shutil
import sys

MATERI = Path("website/FE/src/pages/Materi.jsx")
CARD = Path("website/FE/src/components/materials/MaterialCard.jsx")

def fail(message):
    print(f"[ERROR] {message}")
    print("Patch dibatalkan. File asli tidak ditimpa.")
    sys.exit(1)

if not MATERI.exists():
    fail(f"File tidak ditemukan: {MATERI}. Jalankan dari ROOT repository ArduFlow.")

source = MATERI.read_text(encoding="utf-8")
original = source

# ------------------------------------------------------------
# Imports
# ------------------------------------------------------------
import_lines = []

if "from '../services/transactionApi.js'" not in source:
    import_lines.append(
        "import { createTransaction, fetchTransactions } from '../services/transactionApi.js';"
    )

if "from '../services/authSession.js'" not in source:
    import_lines.append(
        "import { getStoredUser, getStoredUserToken } from '../services/authSession.js';"
    )

if import_lines:
    source = "\n".join(import_lines) + "\n" + source

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
if "function isTransactionForMaterial(" not in source:
    marker = "const topicCategories = ["
    pos = source.find(marker)
    if pos < 0:
        fail("const topicCategories tidak ditemukan.")

    helper_block = r"""
function getUserId(user) {
  return user?.id ?? user?.userId ?? user?.user_id ?? null;
}

function getUserEmail(user) {
  return String(
    user?.email ??
      user?.emailAddress ??
      user?.email_address ??
      '',
  ).trim();
}

function formatMaterialCurrency(value, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));
}

function isTransactionForMaterial(transaction, material) {
  const payload =
    transaction?.payload &&
    typeof transaction.payload === 'object'
      ? transaction.payload
      : {};

  const ids = [
    transaction?.itemId,
    transaction?.item_id,
    payload.materialId,
    payload.material_id,
    payload.tutorialId,
    payload.tutorial_id,
    payload.itemId,
    payload.item_id,
  ].filter(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  );

  const itemType = String(
    transaction?.itemType ||
      transaction?.item_type ||
      '',
  )
    .trim()
    .toLowerCase();

  return (
    ['materi', 'material'].includes(itemType) &&
    ids.some(
      (id) =>
        String(id) === String(material?.id || ''),
    )
  );
}

function isPaidMaterialTransaction(transaction, material) {
  const status = String(transaction?.status || '')
    .trim()
    .toLowerCase();

  return (
    isTransactionForMaterial(transaction, material) &&
    [
      'paid',
      'approved',
      'success',
      'successful',
      'completed',
      'complete',
      'settlement',
      'verified',
      'done',
    ].includes(status)
  );
}

function isPendingMaterialTransaction(transaction, material) {
  const status = String(transaction?.status || '')
    .trim()
    .toLowerCase();

  return (
    isTransactionForMaterial(transaction, material) &&
    [
      'pending',
      'proof_uploaded',
      'uploaded',
      'waiting',
      'review',
      'processing',
      'proof_sent',
      'rejected',
    ].includes(status)
  );
}

"""
    source = source[:pos] + helper_block + source[pos:]

# ------------------------------------------------------------
# Work only inside export function Materi()
# ------------------------------------------------------------
materi_start = source.find("export function Materi()")
if materi_start < 0:
    fail("export function Materi() tidak ditemukan.")

# State insertion
materi_part = source[materi_start:]
if "const [materialTransactions, setMaterialTransactions]" not in materi_part:
    match = re.search(
        r"(?m)^(\s*)const\s*\[\s*error\s*,\s*setError\s*\]\s*=\s*useState\(\s*['\"]{2}\s*\);\s*$",
        materi_part,
    )
    if not match:
        fail("state error di function Materi() tidak ditemukan.")

    indent = match.group(1)
    state_block = (
        "\n"
        + indent + "const [materialTransactions, setMaterialTransactions] = useState([]);\n"
        + indent + "const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);\n"
        + indent + "const [isPurchasing, setIsPurchasing] = useState(false);\n"
        + indent + "const [purchaseMessage, setPurchaseMessage] = useState('');"
    )

    absolute_end = materi_start + match.end()
    source = source[:absolute_end] + state_block + source[absolute_end:]

# Effect insertion before catalog early-return
materi_start = source.find("export function Materi()")
materi_part = source[materi_start:]

if "Gagal memuat transaksi materi:" not in materi_part:
    catalog_match = re.search(
        r"\n\s*if\s*\(\s*!hasIdentifier\s*\)\s*\{\s*return\s*<MateriCatalog\s*/>\s*;\s*\}",
        materi_part,
        re.S,
    )
    if not catalog_match:
        fail("return <MateriCatalog /> tidak ditemukan.")

    effect_block = r"""
  useEffect(() => {
    if (!material) {
      setMaterialTransactions([]);
      setIsCheckingPurchase(false);
      return undefined;
    }

    const premium =
      Boolean(material.isPremium) ||
      Number(material.price || 0) > 0;

    if (!premium) {
      setMaterialTransactions([]);
      setIsCheckingPurchase(false);
      return undefined;
    }

    const token = getStoredUserToken();
    const user = getStoredUser() || {};
    const userId = getUserId(user);
    const email = getUserEmail(user);

    if (!token || (!userId && !email)) {
      setMaterialTransactions([]);
      setIsCheckingPurchase(false);
      return undefined;
    }

    let active = true;
    setIsCheckingPurchase(true);

    fetchTransactions()
      .then((records) => {
        if (!active) return;

        setMaterialTransactions(
          (Array.isArray(records) ? records : []).filter(
            (transaction) => {
              const type = String(
                transaction?.itemType ||
                  transaction?.item_type ||
                  '',
              )
                .trim()
                .toLowerCase();

              return ['materi', 'material'].includes(type);
            },
          ),
        );
      })
      .catch((transactionError) => {
        console.error(
          'Gagal memuat transaksi materi:',
          transactionError,
        );

        if (active) {
          setMaterialTransactions([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsCheckingPurchase(false);
        }
      });

    return () => {
      active = false;
    };
  }, [material]);

"""
    insert_pos = materi_start + catalog_match.start()
    source = source[:insert_pos] + effect_block + source[insert_pos:]

# Access logic + purchase handler
materi_start = source.find("export function Materi()")
materi_part = source[materi_start:]

if "async function handleBuyMaterial()" not in materi_part:
    change_match = re.search(
        r"(?m)^\s*function\s+changeSlide\s*\(\s*nextIndex\s*\)\s*\{",
        materi_part,
    )
    if not change_match:
        fail("function changeSlide(nextIndex) tidak ditemukan.")

    logic_block = r"""
  const isPremiumMaterial = Boolean(
    material?.isPremium ||
      Number(material?.price || 0) > 0,
  );

  const paidTransaction = material
    ? materialTransactions.find((transaction) =>
        isPaidMaterialTransaction(transaction, material),
      )
    : null;

  const pendingTransaction = material
    ? materialTransactions.find((transaction) =>
        isPendingMaterialTransaction(transaction, material),
      )
    : null;

  const hasMaterialAccess =
    !isPremiumMaterial ||
    Boolean(paidTransaction);

  async function handleBuyMaterial() {
    if (!material) return;

    const token = getStoredUserToken();
    const user = getStoredUser() || {};
    const userId = getUserId(user);
    const email = getUserEmail(user);

    if (!token || (!userId && !email)) {
      const redirect =
        window.location.pathname +
        window.location.search;

      window.location.href =
        `/signin?redirect=${encodeURIComponent(redirect)}`;
      return;
    }

    if (pendingTransaction?.id) {
      window.location.href =
        `/transaksi?transactionId=${encodeURIComponent(
          pendingTransaction.id,
        )}`;
      return;
    }

    setIsPurchasing(true);
    setPurchaseMessage('Membuat transaksi materi...');

    try {
      const transaction = await createTransaction({
        userId,
        userName:
          user.name ||
          user.fullName ||
          user.username ||
          '',
        email,
        itemType: 'materi',
        itemId: material.id,
        itemTitle: material.title,
        amount: Math.max(
          0,
          Number(material.price) || 0,
        ),
        currency: 'IDR',
        paymentMethod: 'Pembelian Materi',
        paymentChannel: 'ArduFlow',
        status: 'pending',
        notes: `Pembelian materi ${material.title}`,
        payload: {
          materialId: material.id,
          tutorialId: material.id,
          materialSlug: material.slug || '',
          materialTitle: material.title,
          source: 'materi-detail',
        },
      });

      const transactionId =
        transaction?.id ??
        transaction?.transaction?.id ??
        transaction?.data?.id ??
        null;

      window.location.href = transactionId
        ? `/transaksi?transactionId=${encodeURIComponent(
            transactionId,
          )}`
        : '/transaksi';
    } catch (purchaseError) {
      console.error(
        'Gagal membuat transaksi materi:',
        purchaseError,
      );

      setPurchaseMessage(
        purchaseError?.message ||
          'Transaksi materi gagal dibuat.',
      );
      setIsPurchasing(false);
    }
  }

"""
    insert_pos = materi_start + change_match.start()
    source = source[:insert_pos] + logic_block + source[insert_pos:]

# Paywall after hook section and loading/error guard, before activeImage.
materi_start = source.find("export function Materi()")
materi_part = source[materi_start:]

if "Materi ini berbayar. Selesaikan transaksi" not in materi_part:
    active_image_pos = materi_part.find("  const activeImage = ")
    if active_image_pos < 0:
        fail("const activeImage tidak ditemukan.")

    gate_block = r"""
  if (isPremiumMaterial && !hasMaterialAccess) {
    return (
      <section
        className="materi-page"
        aria-labelledby="materi-title"
      >
        <div className="materi-shell">
          <a
            className="materi-back"
            href="/materi"
          >
            Kembali ke Daftar Materi
          </a>

          <header className="materi-hero">
            <div>
              <p className="materi-eyebrow">
                {categoryLabel(material.category)}
              </p>
              <h1 id="materi-title">
                {material.title}
              </h1>
              <p>
                {material.shortDescription ||
                  stripHtml(material.fullDescription)}
              </p>
            </div>

            <img
              src={
                material.cardImageUrl ||
                fallbackTutorialImage
              }
              alt={material.title}
            />
          </header>

          <article className="materi-reader">
            <main className="materi-content">
              <div className="materi-content-head">
                <span>Rp</span>
                <div>
                  <h2>Materi Premium</h2>
                  <p>
                    Materi ini berbayar. Selesaikan transaksi
                    untuk membuka seluruh bab dan isi materi.
                  </p>
                </div>
              </div>

              <div className="materi-state">
                <h2>
                  {formatMaterialCurrency(
                    material.price,
                    'IDR',
                  )}
                </h2>

                <p>
                  {isCheckingPurchase
                    ? 'Memeriksa status pembelian Anda...'
                    : pendingTransaction
                      ? 'Transaksi sudah dibuat. Lanjutkan pembayaran atau tunggu verifikasi admin.'
                      : 'Setelah pembayaran disetujui, materi otomatis terbuka untuk akun Anda.'}
                </p>

                <div className="materi-actions">
                  <a
                    className="materi-button secondary"
                    href="/materi"
                  >
                    Kembali
                  </a>

                  <button
                    className="materi-button"
                    type="button"
                    disabled={
                      isPurchasing ||
                      isCheckingPurchase
                    }
                    onClick={
                      pendingTransaction
                        ? () => {
                            window.location.href =
                              `/transaksi?transactionId=${encodeURIComponent(
                                pendingTransaction.id,
                              )}`;
                          }
                        : handleBuyMaterial
                    }
                  >
                    {isPurchasing
                      ? 'Memproses...'
                      : pendingTransaction
                        ? 'Lihat Transaksi'
                        : 'Beli Materi'}
                  </button>
                </div>

                {purchaseMessage ? (
                  <p role="status">
                    {purchaseMessage}
                  </p>
                ) : null}
              </div>
            </main>
          </article>
        </div>
      </section>
    );
  }

"""
    insert_pos = materi_start + active_image_pos
    source = source[:insert_pos] + gate_block + source[insert_pos:]

# ------------------------------------------------------------
# Write after all checks pass
# ------------------------------------------------------------
if source != original:
    backup = MATERI.with_suffix(
        MATERI.suffix + ".before-materi-paid-v2.bak"
    )
    shutil.copy2(MATERI, backup)
    MATERI.write_text(source, encoding="utf-8")
    print("[OK] Materi.jsx berhasil dipatch.")
    print(f"[OK] Backup: {backup}")
else:
    print("[INFO] Materi.jsx sudah memiliki flow pembelian.")

# Optional card wording
if CARD.exists():
    card_source = CARD.read_text(encoding="utf-8")
    new_card = card_source

    if "Beli Materi" not in new_card:
        for old, new in [
            ("? 'Lihat Materi'", "? 'Beli Materi'"),
            ('? "Lihat Materi"', '? "Beli Materi"'),
        ]:
            if old in new_card:
                new_card = new_card.replace(old, new, 1)
                break

    if new_card != card_source:
        card_backup = CARD.with_suffix(
            CARD.suffix + ".before-materi-paid-v2.bak"
        )
        shutil.copy2(CARD, card_backup)
        CARD.write_text(new_card, encoding="utf-8")
        print("[OK] Label card Premium -> Beli Materi.")

print("")
print("Flow:")
print("  Gratis -> langsung dibuka")
print("  Berbayar -> terkunci -> Beli Materi")
print("  Beli -> transaksi itemType='materi'")
print("  -> /transaksi?transactionId=...")
print("  Pending -> Lihat Transaksi")
print("  Paid -> materi terbuka")
print("")
print("Lanjutkan:")
print("  cd website/FE")
print("  npm run build")
print("  npm run dev")
