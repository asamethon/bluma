const PROMPT_COUNT = 10;

export function dailyPromptKey(date: Date = new Date()): string {
  const startOfYear = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.floor((today - startOfYear) / 86_400_000);
  return `prompts.p${(dayOfYear % PROMPT_COUNT) + 1}`;
}
