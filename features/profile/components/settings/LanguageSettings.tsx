import { ListRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_NAMES } from './languages';
import { SettingsSection } from './SettingsSection';

export const LanguageSettings = memo(function LanguageSettings() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <SettingsSection title={t('settings.languageSection')}>
      {SUPPORTED_LANGUAGES.map((language, index) => {
        const selected = i18n.language === language;
        return (
          <ListRow
            key={language}
            title={LANGUAGE_NAMES[language]}
            divider={index < SUPPORTED_LANGUAGES.length - 1}
            onPress={() => void setAppLanguage(language)}
            right={
              selected ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : undefined
            }
            showChevron={false}
          />
        );
      })}
    </SettingsSection>
  );
});
