import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import i18n from '@/i18n';

type ProfileImageKind = 'avatar' | 'cover';

function useProfileImagePicker(initial: string | null, kind: ProfileImageKind) {
  const [image, setImage] = useState<string | null>(initial);
  const aspect: [number, number] = kind === 'cover' ? [3, 1] : [1, 1];

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
        aspect,
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
        aspect,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setImage(result.assets[0].uri);
    } catch {
      Alert.alert(i18n.t('common.error'), i18n.t('avatarPicker.captureError'));
    }
  };

  const showOptions = () => {
    const title = kind === 'cover' ? i18n.t('coverPicker.title') : i18n.t('avatarPicker.title');
    const camera = kind === 'cover' ? i18n.t('coverPicker.camera') : i18n.t('avatarPicker.takePhoto');
    const gallery = kind === 'cover' ? i18n.t('coverPicker.gallery') : i18n.t('avatarPicker.pickFromGallery');
    Alert.alert(title, i18n.t('avatarPicker.subtitle'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      { text: camera, onPress: takePhoto },
      { text: gallery, onPress: pickFromLibrary },
      ...(image
        ? [{ text: i18n.t('avatarPicker.removePhoto'), style: 'destructive' as const, onPress: () => setImage(null) }]
        : []),
    ]);
  };

  return { image, setImage, showOptions };
}

export const useAvatarPicker = (initial: string | null = null) =>
  useProfileImagePicker(initial, 'avatar');

export const useProfileCoverPicker = (initial: string | null = null) =>
  useProfileImagePicker(initial, 'cover');

function promptSettings(message: string) {
  Alert.alert(i18n.t('avatarPicker.permissionRequired'), message, [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: i18n.t('avatarPicker.goToSettings'), onPress: () => Linking.openSettings() },
  ]);
}
