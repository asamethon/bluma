const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const DRY_RUN = process.argv.includes('--dry-run');
const CHAPTER_SEP = '\n§§\n';

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitChapters(content, expectedCount) {
  const clean = stripHtml(content);
  if (!clean) return [];
  if (clean.includes(CHAPTER_SEP)) {
    return clean.split(CHAPTER_SEP).filter(c => c.trim().length > 0);
  }
  const n = expectedCount && expectedCount > 1 ? expectedCount : 1;
  const paras = clean.split('\n\n').filter(p => p.trim().length > 0);
  if (paras.length === 0) return [clean];
  if (n <= 1 || paras.length <= n) {
    return n <= 1 ? [paras.join('\n\n')] : paras;
  }
  const perChap = Math.ceil(paras.length / n);
  const result = [];
  for (let i = 0; i < n; i++) {
    const chunk = paras.slice(i * perChap, (i + 1) * perChap);
    if (chunk.length) result.push(chunk.join('\n\n'));
  }
  return result.filter(c => c.trim().length > 0);
}

function wordCount(text) {
  const t = String(text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

async function migrateStory(db, doc) {
  const data = doc.data();
  if (data.chaptersInSubcollection) {
    return { id: doc.id, status: 'skipped-already-migrated' };
  }

  const expectedCount = (data.chapterTitles && data.chapterTitles.length) || data.chaptersCount;
  const bodies = splitChapters(data.content, expectedCount);
  if (bodies.length === 0) {
    return { id: doc.id, status: 'skipped-empty-content' };
  }

  const titles = data.chapterTitles && data.chapterTitles.length === bodies.length
    ? data.chapterTitles
    : bodies.map((_, i) => `Bölüm ${i + 1}`);

  if (DRY_RUN) {
    return { id: doc.id, status: 'would-migrate', chapters: bodies.length };
  }

  const batch = db.batch();
  const chaptersRef = doc.ref.collection('chapters');
  bodies.forEach((body, i) => {
    batch.set(chaptersRef.doc(String(i)), {
      title: titles[i] || `Bölüm ${i + 1}`,
      content: body,
      order: i,
      wordCount: wordCount(body),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  batch.update(doc.ref, {
    chaptersInSubcollection: true,
    chapterTitles: titles,
    chapterWordCounts: bodies.map(wordCount),
    chaptersCount: bodies.length,
  });
  await batch.commit();

  return { id: doc.id, status: 'migrated', chapters: bodies.length };
}

async function main() {
  const app = initializeApp({ credential: applicationDefault() });
  const db = getFirestore(app);

  console.log(DRY_RUN ? 'DRY RUN — hiçbir şey yazılmayacak.' : 'Migrasyon başlıyor...');

  const snapshot = await db.collection('stories').get();
  console.log(`${snapshot.size} hikâye bulundu.`);

  const results = { migrated: 0, skipped: 0, failed: 0, wouldMigrate: 0 };
  const failures = [];

  for (const doc of snapshot.docs) {
    try {
      const r = await migrateStory(db, doc);
      if (r.status === 'migrated') results.migrated++;
      else if (r.status === 'would-migrate') results.wouldMigrate++;
      else results.skipped++;
      console.log(`[${r.status}] ${r.id}${r.chapters ? ` (${r.chapters} bölüm)` : ''}`);
    } catch (error) {
      results.failed++;
      failures.push({ id: doc.id, error: error.message });
      console.error(`[HATA] ${doc.id}: ${error.message}`);
    }
  }

  console.log('\n--- Özet ---');
  console.log(results);
  if (failures.length) {
    console.log('\nBaşarısız dokümanlar (tekrar çalıştırılabilir, idempotent):');
    failures.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Migrasyon başarısız:', error);
    process.exit(1);
  });
