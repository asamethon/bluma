const assert = require('node:assert/strict');

function assertGroup(updates, { group, branch, platform = 'all' }) {
  assert.ok(Array.isArray(updates) && updates.length > 0, 'Güncelleme grubu bulunamadı.');
  const selected = updates.filter(update => platform === 'all' || update.platform === platform);
  const platforms = platform === 'all' ? ['ios', 'android'] : [platform];
  for (const target of platforms) {
    assert.equal(selected.filter(update => update.platform === target).length, 1,
      `${target} güncellemesi eksik veya tekrarlı.`);
  }
  for (const update of selected) {
    assert.equal(update.group, group, 'Platform güncellemesi yerine grup UUID kullanın.');
    assert.equal(update.branch, branch, `Kaynak dal ${branch} olmalı.`);
    assert.ok(update.runtimeVersion, 'Runtime bilgisi eksik.');
    assert.ok(!update.isRollBackToEmbedded, 'Bu işlem normal bir güncelleme grubu gerektirir.');
  }
  return selected;
}

function assertBuild(builds, update) {
  assert.ok(Array.isArray(builds) && builds.some(build =>
    build.status === 'FINISHED'
    && build.platform?.toLowerCase() === update.platform
    && build.updateChannel?.name === 'production'
    && build.runtime?.version === update.runtimeVersion),
  `${update.platform} / ${update.runtimeVersion} için bitmiş production build yok. Önce native build gerekir.`);
}

/** Yüklenecek paketin runtime'ı mağazadaki build'inkiyle aynı olmalı. */
function assertStoreRuntime(platform, runtime, store) {
  const entry = store?.[platform];
  assert.ok(entry?.runtime, `${platform} için mağaza runtime kaydı yok (scripts/ota/store-runtimes.json).`);
  assert.equal(runtime, entry.runtime,
    `${platform} runtime ${runtime} mağazadaki ${entry.build} build'iyle (${entry.runtime}) uyuşmuyor; `
    + 'bu paket kimseye inmez. Fark: .ota/fingerprint-' + platform + '.json ile scripts/ota/fingerprints/'
    + platform + '.json. Native değişiklik varsa yeni build alıp `yarn ota:record-build` çalıştırın.');
}

function assertChannel(channel, name) {
  assert.equal(channel.name, name);
  assert.ok(!channel.isPaused, `${name} kanalı duraklatılmış.`);
  const mapping = JSON.parse(channel.branchMapping);
  assert.equal(mapping.data.length, 1, 'Dal bazlı rollout açık; önce kapatın.');
  assert.equal(mapping.data[0].branchMappingLogic, 'true');
  assert.ok(channel.updateBranches.some(branch =>
    branch.id === mapping.data[0].branchId && branch.name === name),
  `${name} kanalı aynı adlı dala bağlı olmalı.`);
}

module.exports = { assertGroup, assertBuild, assertChannel, assertStoreRuntime };
