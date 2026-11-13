// Saf numaralandırma mantığı (Firestore'a dokunmaz); __tests__/milestone.test.ts doğrular.

/**
 * Kayıt sırasına göre üye numarası atar. Daha önce numara almış üyelerin
 * numarası ASLA değişmez; numarasızlar en büyük numaradan devam eder.
 * Sıra: createdAt artan, eşitlikte doküman ID'si. createdAt'i olmayan
 * (bozuk/eski) kayıtlar en sona, ID sırasıyla eklenir.
 * @param {{ id: string, createdAt: number, memberNumber?: number }[]} users
 * @returns {Map<string, number>} yalnızca YENİ atanacak numaralar
 */
function assignMemberNumbers(users) {
  const valid = n => Number.isInteger(n) && n > 0;
  const max = users.reduce((m, u) => (valid(u.memberNumber) ? Math.max(m, u.memberNumber) : m), 0);
  const pending = users.filter(u => !valid(u.memberNumber)).sort((a, b) => {
    const at = a.createdAt || Infinity;
    const bt = b.createdAt || Infinity;
    if (at !== bt) return at - bt;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return new Map(pending.map((u, i) => [u.id, max + i + 1]));
}

module.exports = { assignMemberNumbers };
