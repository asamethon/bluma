import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
  const networkState = useNetworkStatus();

  const [slideAnim] = useState(new Animated.Value(-60));
  const [isVisible, setIsVisible] = useState(false);
  // Whether we have actually been offline during this session. We only surface
  // the green "reconnected" banner when recovering from a *real* offline state,
  // not on first mount or on the spurious NetInfo toggles that fire constantly.
  const wasOfflineRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = createStyles(colors);

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
      // Genuinely offline — remember it and show the persistent offline banner.
      wasOfflineRef.current = true;
      clearHideTimer();
      slideIn();
    } else if (showWhenOnline && wasOfflineRef.current) {
      // Online again *after* having been offline — this is the only case worth
      // a "reconnected" toast. Show it briefly then auto-hide.
      wasOfflineRef.current = false;
      clearHideTimer();
      slideIn();
      hideTimer.current = setTimeout(slideOut, 2000);
    } else {
      // Plain online (initial mount / NetInfo noise) — never announce anything.
      clearHideTimer();
      slideOut();
    }

    return clearHideTimer;
  }, [networkState.isOffline, showWhenOnline]);

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
          {networkState.isOffline ? 'Çevrimdışı mod - İndirilen hikayeler kullanılabilir' : 'İnternet bağlantısı yeniden kuruldu'}
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
      paddingTop: 50, // Status bar için
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