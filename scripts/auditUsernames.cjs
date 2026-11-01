/**
 * Kullanıcı adı kalitesi ÖLÇÜMÜ — salt okunur.
 *
 * `users` koleksiyonundan YALNIZCA `username` ve `displayName` alanlarını okur
 * (Firestore `select()` projeksiyonu), uygulamanın kendi `assessUsername`
 * mantığını uygular ve bir özet basar. Hiçbir yazma yapmaz: betikte tek bir
 * set/update/delete çağrısı yoktur, `--apply` gibi bir kip de yoktur.
 *
 * Kullanım:
 *   GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> \
 *     node scripts/auditUsernames.cjs --project=<firebase-proje-id>
 */
const { registerTs } = require('./lib/registerTs.cjs');

registerTs();

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');
const { assessUsername } = require('../features/profile/utils/usernameAssess.ts');
const { suggestUsernames } = require('../features/profile/utils/usernameSuggest.ts');

const PAGE_SIZE = 500;
const MAX_EXAMPLES = 10;
const REASONS = ['mangled', 'keyboard', 'mixed', 'digits', 'noVowels'];

const emptyReport = () => ({
  total: 0,
  missingUsername: 0,
  flagged: 0,
  reasons: Object.fromEntries(REASONS.map(reason => [reason, { count: 0, examples: [] }])),
});

/** Tek kullanıcıyı sayaçlara işler; örnek kotası neden başına 10. */
function record(report, username, displayName) {
  report.total += 1;
  if (!username) {
    report.missingUsername += 1;
    return;
  }
  const { flagged, reason } = assessUsername(username, displayName);
  if (!flagged || !reason) return;
  report.flagged += 1;
  const bucket = report.reasons[reason];
  bucket.count += 1;
  if (bucket.examples.length < MAX_EXAMPLES) {
    // Öneri yalnızca eşik ayarına yardım etsin diye basılıyor; saf hesap, sorgu yok.
    bucket.examples.push({ username, displayName, suggestion: suggestUsernames(displayName, username)[0] || '—' });
  }
}

const text = value => (typeof value === 'string' ? value.trim() : '');

async function scanUsers(db, report) {
  const cursor = { last: null };
  while (true) {
    const base = db.collection('users')
      .orderBy(FieldPath.documentId())
      .select('username', 'displayName')
      .limit(PAGE_SIZE);
    const page = await (cursor.last ? base.startAfter(cursor.last) : base).get();
    if (page.empty) break;
    for (const doc of page.docs) {
      const data = doc.data();
      record(report, text(data.username), text(data.displayName));
    }
    cursor.last = page.docs[page.docs.length - 1];
    if (page.size < PAGE_SIZE) break;
  }
}

const percent = (part, whole) => (whole ? `%${((part / whole) * 100).toFixed(1)}` : '%0');

function printReport(report) {
  const assessed = report.total - report.missingUsername;
  console.log(`\nToplam kullanıcı       : ${report.total}`);
  console.log(`Kullanıcı adı boş      : ${report.missingUsername}`);
  console.log(`Değerlendirilen        : ${assessed}`);
  console.log(`İşaretlenen            : ${report.flagged} (${percent(report.flagged, assessed)})\n`);
  console.log('Neden başına sayı:');
  for (const reason of REASONS) {
    const { count } = report.reasons[reason];
    console.log(`  ${reason.padEnd(10)} ${String(count).padStart(5)}  ${percent(count, assessed)}`);
  }
  for (const reason of REASONS) {
    const { count, examples } = report.reasons[reason];
    if (!examples.length) continue;
    console.log(`\n── ${reason} (${count}) — ilk ${examples.length} örnek`);
    for (const example of examples) {
      const name = example.displayName || '(görünen ad yok)';
      console.log(`   @${example.username.padEnd(22)} ← ${name.padEnd(26)} öneri: ${example.suggestion}`);
    }
  }
  console.log('\nHiçbir veri değiştirilmedi.');
}

async function main() {
  const projectId = process.argv.find(arg => arg.startsWith('--project='))?.slice('--project='.length);
  if (!projectId) throw new Error('--project=<firebase-proje-id> zorunludur.');
  const db = getFirestore(initializeApp({ projectId, credential: applicationDefault() }));
  const report = emptyReport();
  console.log(`SALT OKUNUR ölçüm — ${projectId} / users (username, displayName)`);
  await scanUsers(db, report);
  printReport(report);
}

module.exports = { REASONS, emptyReport, printReport, record };
if (require.main === module) {
  main().catch(error => {
    console.error('Ölçüm tamamlanamadı:', error.message);
    console.error('Proje kimliğini, GOOGLE_APPLICATION_CREDENTIALS değerini ve Admin SDK yetkilerini kontrol edin.');
    process.exitCode = 1;
  });
}
