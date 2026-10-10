import { useCallback, useReducer, useRef } from 'react';
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

export type ReaderOverlay = 'settings' | 'chapters' | 'report' | 'list' | 'share' | null;

type State = { chromeVisible: boolean; overlay: ReaderOverlay };
type Action = { type: 'chrome'; value: boolean } | { type: 'overlay'; value: ReaderOverlay };

const initialState: State = { chromeVisible: true, overlay: null };
const reducer = (state: State, action: Action): State => (
  action.type === 'chrome' ? { ...state, chromeVisible: action.value } : { ...state, overlay: action.value }
);

/** Yön değişimini gürültüden ayıran eşik: parmağın küçük titremesi çubukları oynatmaz. */
const DIRECTION_THRESHOLD = 28;

export function useReaderUi(safeTop: number) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const chromeAnimation = useRef(new Animated.Value(1)).current;
  /** Okuma ilerlemesi: her karede state yazmamak için Animated değer. */
  const progress = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  // Kaydırma defteri — imperative bir sistemin (ScrollView) konumu, render girdisi değil.
  const scrollLog = useRef({ offset: 0, anchor: 0 });
  const chromeHeight = safeTop + 52;

  const setChrome = useCallback((visible: boolean) => {
    dispatch({ type: 'chrome', value: visible });
    Animated.timing(chromeAnimation, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [chromeAnimation]);

  const toggleChrome = useCallback(() => {
    setChrome(!state.chromeVisible);
  }, [setChrome, state.chromeVisible]);

  /**
   * Tek kaydırma dinleyicisi: ilerleme şeridini besler ve çubukları yönetir.
   * Aşağı okurken arayüz çekilir, yukarı dönüşte ya da sayfa başında geri gelir.
   */
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    progress.setValue(scrollable > 0 ? Math.max(0, Math.min(1, contentOffset.y / scrollable)) : 0);

    const y = contentOffset.y;
    const log = scrollLog.current;
    const goingUp = y < log.offset;
    log.offset = y;
    if (y <= chromeHeight) {
      log.anchor = y;
      if (!state.chromeVisible) setChrome(true);
      return;
    }
    if (Math.abs(y - log.anchor) < DIRECTION_THRESHOLD) return;
    log.anchor = y;
    if (goingUp !== state.chromeVisible) setChrome(goingUp);
  }, [chromeHeight, progress, setChrome, state.chromeVisible]);

  const scrollToTop = useCallback(() => {
    scrollLog.current = { offset: 0, anchor: 0 };
    progress.setValue(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setChrome(true);
  }, [progress, setChrome]);

  return {
    ...state,
    chromeAnimation,
    chromeHeight,
    handleScroll,
    progress,
    scrollRef,
    closeOverlay: useCallback(() => dispatch({ type: 'overlay', value: null }), []),
    openOverlay: useCallback((value: Exclude<ReaderOverlay, null>) => dispatch({ type: 'overlay', value }), []),
    scrollToTop,
    toggleChrome,
  };
}
