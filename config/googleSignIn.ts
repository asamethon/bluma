import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '626165614889-crsvdlrp4oommq6eiu14ltn372l10al7.apps.googleusercontent.com', // From Firebase Console
    iosClientId: '626165614889-8logf9c1pufo9h0llo9jvp4cfvq98asl.apps.googleusercontent.com', // From GoogleService-Info.plist
    offlineAccess: false, // Disable offline access for now
    hostedDomain: '',
    forceCodeForRefreshToken: false, // Disable force code for refresh token
  });
};

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    console.log('Google Sign-In successful:', userInfo);
    return { success: true, userInfo };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    if (error.code === 'SIGN_IN_CANCELLED') {
      return { success: false, error: 'Giriş iptal edildi.' };
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return { success: false, error: 'Google Play Services mevcut değil.' };
    } else {
      return { success: false, error: 'Google ile giriş yapılırken bir hata oluştu.' };
    }
  }
};

export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    return { success: true };
  } catch (error) {
    console.error('Google Sign-Out error:', error);
    return { success: false, error: 'Google hesabından çıkış yapılırken bir hata oluştu.' };
  }
};

export const getCurrentUser = async () => {
  try {
    return await GoogleSignin.getCurrentUser();
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}; 