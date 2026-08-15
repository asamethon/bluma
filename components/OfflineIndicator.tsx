import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
}

export default function OfflineIndicator({ showWhenOnline = false }: OfflineIndicatorProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const networkState = useNetworkStatus();

  const [slideAnim] = useState(new Animated.Value(-60));
  const [isVisible, setIsVisible] = useState(false);
  const wasOfflineRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
    const slideIn = () => {
      setIsVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };
    const slideOut = () => {
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    };

    if (networkState.isOffline) {
      wasOfflineRef.current = true;
      clearHideTimer();
      slideIn();
    } else if (showWhenOnline && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      clearHideTimer();
      slideIn();
      hideTimer.current = setTimeout(slideOut, 2000);
    } else {
      clearHideTimer();
      slideOut();
    }

    return clearHideTimer;
  }, [networkState.isOffline, showWhenOnline, slideAnim]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        networkState.isOffline ? styles.offlineContainer : styles.onlineContainer,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={networkState.isOffline ? "cloud-offline" : "wifi"} 
          size={16} 
          color={networkState.isOffline ? colors.surface : colors.surface} 
        />
        <Text style={[
          styles.text,
          networkState.isOffline ? styles.offlineText : styles.onlineText
        ]}>
          {networkState.isOffline ? t('offline.offlineBanner') : t('offline.reconnected')}
        </Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    offlineContainer: {
      backgroundColor: '#FF6B47',
    },
    onlineContainer: {
      backgroundColor: '#4CAF50',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    text: {
      fontSize: 14, lineHeight: 18,
      fontWeight: '500',
      textAlign: 'center',
    },
    offlineText: {
      color: colors.surface,
    },
    onlineText: {
      color: colors.surface,
    },
  });