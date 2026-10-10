/* eslint-disable @typescript-eslint/no-require-imports */
const { assertGroup, assertBuild, assertChannel } = require('../scripts/ota/guards.cjs');

const update = { group: 'group', branch: 'production-candidate',
  platform: 'ios', runtimeVersion: 'native-hash', isRollBackToEmbedded: false };
const options = { group: 'group', branch: 'production-candidate', platform: 'ios' };
// eas-cli 24 build:list yanıtındaki gerçek GraphQL alanları.
const build = { status: 'FINISHED', platform: 'IOS', updateChannel: { name: 'production' },
  runtime: { version: 'native-hash' } };
const channel = { name: 'production', isPaused: false,
  branchMapping: JSON.stringify({ data: [{ branchId: 'branch', branchMappingLogic: 'true' }] }),
  updateBranches: [{ id: 'branch', name: 'production' }] };

describe('OTA yayın korumaları', () => {
  it('preview ortamında üretilmiş paketi production adayı kabul etmez', () => {
    expect(() => assertGroup([{ ...update, branch: 'preview' }], options)).toThrow();
  });
  it('platform güncelleme ID yerine grup ID gerektirir', () => {
    expect(() => assertGroup([update], { ...options, group: 'platform-id' })).toThrow();
  });
  it('iki platform istendiğinde eksik platformu sessizce atlamaz', () => {
    expect(() => assertGroup([update], { ...options, platform: 'all' })).toThrow();
    expect(assertGroup([update, { ...update, platform: 'android' }], { ...options, platform: 'all' })).toHaveLength(2);
  });
  it('uyumlu production binary olmadan OTA üretime taşınmaz', () => {
    expect(() => assertBuild([{ ...build, runtime: { version: 'old-native' } }], update)).toThrow();
    expect(() => assertBuild([{ ...build, status: 'ERRORED' }], update)).toThrow();
    expect(() => assertBuild([{ ...build, updateChannel: { name: 'preview' } }], update)).toThrow();
    expect(() => assertBuild([build], update)).not.toThrow();
  });
  it('yanlış dala bağlı ve duraklatılmış kanallara yayın yapmaz', () => {
    expect(() => assertChannel({ ...channel, isPaused: true }, 'production')).toThrow();
    expect(() => assertChannel({ ...channel, updateBranches: [{ id: 'branch', name: 'preview' }] }, 'production')).toThrow();
    expect(() => assertChannel(channel, 'production')).not.toThrow();
  });
});
