export const ONBOARDING_INTENTS = [
  { id: 'reader', icon: 'book', title: 'onboarding.intentReader', sub: 'onboarding.intentReaderSub', color: '#7057D9' },
  { id: 'writer', icon: 'create', title: 'onboarding.intentWriter', sub: 'onboarding.intentWriterSub', color: '#DE5B88' },
  { id: 'both', icon: 'leaf', title: 'onboarding.intentBoth', sub: 'onboarding.intentBothSub', color: '#2FA98A' },
] as const;

export const ONBOARDING_GENRES = [
  'romance', 'fantasy', 'sci_fi', 'mystery', 'adventure', 'horror', 'comedy', 'drama', 'poetry',
] as const;

export const ONBOARDING_STEPS = [
  { title: 'onboarding.step1Title', sub: 'onboarding.step1Sub' },
  { title: 'onboarding.step2Title', sub: 'onboarding.step2Sub' },
  { title: 'onboarding.step3Title', sub: 'onboarding.step3Sub' },
  { title: 'onboarding.step4Title', sub: '' },
] as const;

export type OnboardingIntent = typeof ONBOARDING_INTENTS[number]['id'];
export type OnboardingGenre = typeof ONBOARDING_GENRES[number];
