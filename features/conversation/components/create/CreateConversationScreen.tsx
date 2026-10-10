import { Screen } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { useCreateConversation } from '@/features/conversation/hooks/useCreateConversation';
import { createConversationStyles } from '@/features/conversation/styles/createConversationStyles';
import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { CreateConversationForm } from './CreateConversationForm';
import { CreateConversationHeader } from './CreateConversationHeader';

export function CreateConversationScreen() {
  const { colors } = useTheme();
  const form = useCreateConversation();
  const styles = useMemo(() => createConversationStyles(colors), [colors]);
  return (
    <Screen style={styles.container} maxContentWidth={ContentMaxWidth.content}>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <CreateConversationHeader
          canSubmit={form.canSubmit}
          submitting={form.submitting}
          styles={styles}
          onCancel={form.cancel}
          onSubmit={form.submit}
        />
        <CreateConversationForm
          announce={form.announce}
          content={form.content}
          image={form.image}
          styles={styles}
          title={form.title}
          onContentChange={form.setContent}
          onImagePick={form.pickImage}
          onImageRemove={form.removeImage}
          onTitleChange={form.setTitle}
          onToggleAnnounce={form.toggleAnnounce}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
