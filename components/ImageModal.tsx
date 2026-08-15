import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ImageModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  shape?: 'rect' | 'circle';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

export default function ImageModal({ visible, imageUri, onClose, shape = 'rect' }: ImageModalProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const resetZoom = () => {
    scale.value = 1;
    savedScale.value = 1;
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.min(4, Math.max(0.8, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1) scale.value = withTiming(1);
      savedScale.value = Math.max(1, scale.value);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onShow={resetZoom}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <GestureDetector gesture={pinch}>
            <Animated.View style={animStyle}>
              <Pressable onPress={() => {}}>
                <Image
                  source={{ uri: imageUri }}
                  style={shape === 'circle' ? styles.circleImage : styles.rectImage}
                  contentFit={shape === 'circle' ? 'cover' : 'contain'}
                  transition={200}
                />
              </Pressable>
            </Animated.View>
          </GestureDetector>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rectImage: {
    width: screenWidth - 40,
    height: screenHeight - 200,
    borderRadius: 12,
  },
  circleImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
