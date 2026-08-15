import { getAnalytics, setUserProperties } from '@react-native-firebase/analytics';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

/**
 * Kaydın hangi ortamdan geldiğini anlatan alanlar. Yalnızca YENİ kullanıcı
 * dokümanı oluşturulurken yazılır — sonraki girişlerde güncellenmez ki
 * "ilk kayıt anı" bilgisi bozulmasın.
 */
export interface SignupContext {
  signupPlatform: 'ios' | 'android' | 'web';
  signupOsVersion: string;
  signupAppVersion: string;
  signupDeviceModel: string;
  /** Kayıt anında uygulamanın gösterdiği dil (ör. 'tr', 'pt-BR'). */
  signupLanguage: string;
  /** Cihazın bölge kodu (ör. 'TR', 'US'). */
  signupRegion: string;
}

const platform = (): SignupContext['signupPlatform'] =>
  Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';

/** Kayıt bağlamını toplar; hiçbir alan hata fırlatmaz, bilinmeyen 'unknown' olur. */
export function buildSignupContext(): SignupContext {
  const locale = getLocales()[0];

  return {
    signupPlatform: platform(),
    signupOsVersion: String(Device.osVersion ?? Platform.Version ?? 'unknown'),
    signupAppVersion: Constants.expoConfig?.version ?? 'unknown',
    signupDeviceModel: Device.modelName ?? 'unknown',
    signupLanguage: i18n.language || locale?.languageCode || 'unknown',
    signupRegion: locale?.regionCode ?? 'unknown',
  };
}

/**
 * Analytics kullanıcı özellikleri: Firebase konsolunda segment filtresi olur.
 * Ateşle-unut — kayıt akışı asla bunu beklemez.
 */
export function trackSignupContext(context: SignupContext) {
  setUserProperties(getAnalytics(), {
    signup_platform: context.signupPlatform,
    signup_language: context.signupLanguage,
    signup_region: context.signupRegion,
    signup_app_version: context.signupAppVersion,
  }).catch((error) => logger.debug('Analytics user property yazılamadı:', error));
}
