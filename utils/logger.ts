import * as Sentry from '@sentry/react-native';

type LogArgs = unknown[];

function toError(args: LogArgs): Error {
  const found = args.find(a => a instanceof Error) as Error | undefined;
  if (found) return found;
  return new Error(args.map(stringify).join(' '));
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function breadcrumb(level: Sentry.SeverityLevel, args: LogArgs) {
  Sentry.addBreadcrumb({
    level,
    category: 'app',
    message: args.map(stringify).join(' ').slice(0, 500),
  });
}

export const logger = {
  debug(...args: LogArgs) {
    if (__DEV__) console.log(...args);
  },

  info(...args: LogArgs) {
    if (__DEV__) console.log(...args);
    else breadcrumb('info', args);
  },

  warn(...args: LogArgs) {
    if (__DEV__) console.warn(...args);
    else breadcrumb('warning', args);
  },

  error(...args: LogArgs) {
    if (__DEV__) {
      console.error(...args);
      return;
    }
    const error = toError(args);
    const context = args.filter(a => !(a instanceof Error)).map(stringify).join(' ');
    Sentry.captureException(error, context ? { extra: { context } } : undefined);
  },
};
