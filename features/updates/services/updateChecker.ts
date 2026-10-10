type UpdateResult = { isAvailable: boolean; isRollBackToEmbedded: boolean };
type FetchResult = { isNew: boolean; isRollBackToEmbedded: boolean };
type Outcome = 'current' | 'pending' | 'error' | 'skipped';

interface Dependencies {
  enabled: () => boolean;
  online: () => Promise<boolean>;
  check: () => Promise<UpdateResult>;
  fetch: () => Promise<FetchResult>;
  now: () => number;
  report: (outcome: Outcome, error?: unknown) => void;
}

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const RETRY_INTERVAL_MS = 5 * 60 * 1000;

/** Tek uçuş + bekleme süresi: yeniden render/foreground aynı indirmeyi başlatmaz. */
export function createUpdateChecker(deps: Dependencies) {
  const scheduler = {
    flight: null as Promise<Outcome> | null,
    nextCheckAt: 0,
  };

  async function run(): Promise<Outcome> {
    try {
      if (!await deps.online()) return 'skipped';
      const update = await deps.check();
      let outcome: Outcome = 'current';
      if (update.isAvailable || update.isRollBackToEmbedded) {
        // Rollback yönergeleri de fetch ile diske kaydedilmelidir.
        const fetched = await deps.fetch();
        outcome = fetched.isNew || fetched.isRollBackToEmbedded ? 'pending' : 'current';
      }
      scheduler.nextCheckAt = deps.now() + CHECK_INTERVAL_MS;
      deps.report(outcome);
      return outcome;
    } catch (error) {
      scheduler.nextCheckAt = deps.now() + RETRY_INTERVAL_MS;
      deps.report('error', error);
      return 'error';
    }
  }

  return {
    check(): Promise<Outcome> {
      if (scheduler.flight) return scheduler.flight;
      if (!deps.enabled() || deps.now() < scheduler.nextCheckAt) {
        return Promise.resolve('skipped');
      }
      scheduler.flight = run().finally(() => { scheduler.flight = null; });
      return scheduler.flight;
    },
  };
}
