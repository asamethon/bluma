const { readFileSync } = require('node:fs');

// firestore.rules içindeki isChallengeReward listesi, görev ödülü XP'sinin
// istemciden yazılabilecek TEK geçerli miktarları. definitions.ts ile elle
// eşlendiği için __tests__/challenges.test.ts bu listeyi karşılaştırır.
function allowedChallengeRewards(path = 'firestore.rules') {
  const rules = readFileSync(path, 'utf8');
  const body = rules.match(/function isChallengeReward\(amount\) \{([^}]*)\}/)?.[1];
  return body ? [...body.matchAll(/\b\d+\b/g)].map(match => Number(match[0])) : [];
}

module.exports = { allowedChallengeRewards };
