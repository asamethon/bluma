import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import i18n from '@/i18n';

export function useAvatarPicker(initial: string | null = null) {
  const [image, setImage] = useState<string | null>(initial);

  const pickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: next } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (next !== 'granted') return promptSettings(i18n.t('avatarPicker.galleryPermission'));
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setImage(result.assets[0].uri);
    } catch {
      Alert.alert(i18n.t('common.error'), i18n.t('avatarPicker.pickError'));
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const { status: next } = await ImagePicker.requestCameraPermissionsAsync();
        if (next !== 'granted') return promptSettings(i18n.t('avatarPicker.cameraPermission'));
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setImage(result.assets[0].uri);
    } catch {
      Alert.alert(i18n.t('common.error'), i18n.t('avatarPicker.captureError'));
    }
  };

  const showOptions = () => {
    Alert.alert(i18n.t('avatarPicker.title'), i18n.t('avatarPicker.subtitle'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      { text: i18n.t('avatarPicker.takePhoto'), onPress: takePhoto },
      { text: i18n.t('avatarPicker.pickFromGallery'), onPress: pickFromLibrary },
      ...(image
        ? [{ text: i18n.t('avatarPicker.removePhoto'), style: 'destructive' as const, onPress: () => setImage(null) }]
        : []),
    ]);
  };

  return { image, setImage, showOptions };
}

function promptSettings(message: string) {
  Alert.alert(i18n.t('avatarPicker.permissionRequired'), message, [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: i18n.t('avatarPicker.goToSettings'), onPress: () => Linking.openSettings() },
  ]);
}
