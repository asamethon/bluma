import { logger } from '@/utils/logger';
import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Sesli mesaj kaydı: iki platformda da m4a/AAC, mono, konuşma için yeterli. */
const VOICE_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 64000,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

/** Sunucu 6 MB'ta kesiyor; 2 dakika 64 kbps'te güvenli sınırın altında. */
const VOICE_MAX_MS = 120_000;
const TICK_MS = 200;

export type VoiceRecording = { uri: string; durationMs: number };

/**
 * Mikrofon kaydı. Süre sayacı burada tutulur (modül canlı `currentTime` verir
 * ama render tetiklemez); süre dolduğunda kayıt kendiliğinden durur.
 */
export function useVoiceRecorder(onFinish: (recording: VoiceRecording) => void) {
  const recorder = useAudioRecorder(VOICE_OPTIONS);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const startedAt = useRef(0);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setDurationMs(Date.now() - startedAt.current), TICK_MS);
    return () => clearInterval(timer);
  }, [isRecording]);

  const close = useCallback(async () => {
    setIsRecording(false);
    setDurationMs(0);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  }, []);

  const start = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return false;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      setDurationMs(0);
      setIsRecording(true);
      return true;
    } catch (error) {
      logger.error('Voice record start error:', error);
      await close();
      return false;
    }
  }, [close, recorder]);

  const stop = useCallback(async (keep: boolean) => {
    const elapsed = Date.now() - startedAt.current;
    try {
      await recorder.stop();
    } catch (error) {
      logger.error('Voice record stop error:', error);
    }
    const uri = recorder.uri;
    await close();
    // Yanlışlıkla dokunuşla oluşan yarım saniyelik kayıtlar gönderilmez.
    if (keep && uri && elapsed >= 800) finish.current({ uri, durationMs: elapsed });
  }, [close, recorder]);

  useEffect(() => {
    if (isRecording && durationMs >= VOICE_MAX_MS) void stop(true);
  }, [durationMs, isRecording, stop]);

  return {
    isRecording,
    durationMs,
    start,
    send: useCallback(() => stop(true), [stop]),
    cancel: useCallback(() => stop(false), [stop]),
  };
}
