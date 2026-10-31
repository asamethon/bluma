// Node CLI raporlayıcısı CommonJS olarak çalışır.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { compact } = require('../scripts/qa/argentReport.cjs');

test('Argent komutu normal dönse bile karşılanmayan bekleme başarısızdır', () => {
  expect(compact({ message: 'Step added', toolResult: { success: false, cause: 'unmet' } }).verdict).toBe('FAIL');
});

test('hazır olma uyarısı başarılı adımların arasında kaybolmaz', () => {
  const report = compact({ ok: true, steps: [{ index: 0, status: 'pass', warning: 'tree stayed empty' }] });
  expect(report.verdict).toBe('WARN');
  expect(report.findings[0]).toContain('tree stayed empty');
});

test('sayısal kayıt özeti ve başarılı akış kısa rapor üretir', () => {
  expect(compact({ steps: 3 }).stepCount).toBe(3);
  const report = compact({ ok: true, passed: 2, failed: 0, steps: [{ index: 0, status: 'pass' }] });
  expect(report).toMatchObject({ verdict: 'OK', passed: 2, failed: 0 });
  expect(report.steps).toBeUndefined();
});

test('kısmen başarısız akışın hata adımı raporda kalır', () => {
  const report = compact({ ok: true, steps: [{ index: 2, status: 'fail', target: 'Yaz' }] });
  expect(report.verdict).toBe('FAIL');
  expect(report.problems).toEqual([{ step: 3, status: 'fail', target: 'Yaz' }]);
});
