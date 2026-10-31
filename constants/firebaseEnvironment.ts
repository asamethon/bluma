/** Metro tarafından derlemeye gömülür; native proje eşleşmesi başlangıçta doğrulanır. */
export const isLocalFirebase = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === '1';
