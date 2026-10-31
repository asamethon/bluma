const { readFileSync } = require('node:fs');

// firestore.rules içindeki isChallengeReward listesi, görev ödülü XP'sinin
// istemciden yazılabilecek TEK geçerli miktarları. definitions.ts ile elle
// eşlendiği için __tests__/challenges.test.ts bu listeyi karşılaştırır.
function allowedChallengeRewards(path = 'firestore.rules') {
  const rules = readFileSync(path, 'utf8');
  const body = rules.match(/function isChallengeReward\(amount\) \{([^}]*)\}/)?.[1];
  return body ? [...body.matchAll(/\b\d+\b/g)].map(match => Number(match[0])) : [];
}

// Aşamalı açılış anahtarı: kurallar eski mağaza sürümünü kıran kısıtları
// uyguluyor mu? Kural testleri beklenen HTTP durumunu buna göre seçer.
function legacyClientsRetired(path = 'firestore.rules') {
  const rules = readFileSync(path, 'utf8');
  const body = rules.match(/function legacyClientsRetired\(\) \{([^}]*)\}/)?.[1] || '';
  return /return\s+true/.test(body);
}

module.exports = { allowedChallengeRewards, legacyClientsRetired };
