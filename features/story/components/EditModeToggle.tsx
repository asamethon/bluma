import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EditModeToggleProps {
  writeMode: 'quick' | 'advanced';
  modeTabAnim: Animated.Value;
  onModeChange: (mode: 'quick' | 'advanced') => void;
}

// Hızlı Yaz / Detaylı yazma modu arasındaki kaydırmalı toggle.
export function EditModeToggle({ writeMode, modeTabAnim, onModeChange }: EditModeToggleProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.modeToggleContainer}>
      <Text style={styles.modeToggleLabel}>Yazma Modu</Text>
      <View style={styles.modeToggle}>
        <Animated.View
          style={[
            styles.modeToggleSlider,
            {
              transform: [{
                translateX: modeTabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (screenWidth - 40) * 0.5 - 4], // Exact half position
                })
              }]
            }
          ]}
        />
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => onModeChange('quick')}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={writeMode === 'quick' ? colors.white : colors.textSecondary}
          />
          <Text style={[
            styles.modeButtonText,
            writeMode === 'quick' && styles.modeButtonTextActive
          ]}>
            Hızlı Yaz
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => onModeChange('advanced')}
        >
          <Ionicons
            name="library-outline"
            size={16}
            color={writeMode === 'advanced' ? colors.white : colors.textSecondary}
          />
          <Text style={[
            styles.modeButtonText,
            writeMode === 'advanced' && styles.modeButtonTextActive
          ]}>
            Detaylı
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    modeToggleContainer: {
      marginBottom: 24,
    },
    modeToggleLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      position: 'relative',
    },
    modeToggleSlider: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: '48%',
      height: 36,
      backgroundColor: colors.primary,
      borderRadius: 8,
      zIndex: 1,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
      zIndex: 2,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: colors.white,
    },
  });
