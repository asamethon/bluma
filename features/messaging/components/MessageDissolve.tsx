import { memo, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { useMessageDissolve } from '../hooks/useMessageDissolve';
import { DUST_PADDING, messageDustHtml } from '../utils/messageDust';

type Props = { threadId: string; messageId: string; mine: boolean; children: ReactNode };

export const MessageDissolve = memo(function MessageDissolve({ threadId, messageId, mine, children }: Props) {
  const { target, dust, collapseStyle } = useMessageDissolve(threadId, messageId, mine);
  const web = useRef<WebView>(null);
  const source = useMemo(() => ({ html: dust ? messageDustHtml(dust) : '' }), [dust]);
  return (
    <Animated.View pointerEvents={dust ? 'none' : 'auto'} style={[dust ? styles.active : undefined, collapseStyle]}>
      <View ref={target} collapsable={false}>{children}</View>
      {dust && (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={[styles.dust, { width: dust.width + DUST_PADDING * 2, height: dust.height + DUST_PADDING * 2 }]}>
          <WebView ref={web} source={source} style={styles.web} containerStyle={styles.web}
            scrollEnabled={false} bounces={false} overScrollMode="never" originWhitelist={['about:blank']}
            onShouldStartLoadWithRequest={request => request.url === 'about:blank'}
            onMessage={({ nativeEvent }) => {
              if (nativeEvent.data === 'ready') {
                target.current?.setNativeProps({ style: { opacity: 0 } });
                web.current?.injectJavaScript('window.startDust?.();true;');
              } else if (nativeEvent.data === 'done') dust.finish();
            }}
            onError={dust.finish} onContentProcessDidTerminate={dust.finish} onRenderProcessGone={dust.finish}
          />
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  active: { zIndex: 10 },
  dust: { position: 'absolute', left: -DUST_PADDING, top: -DUST_PADDING },
  web: { flex: 1, backgroundColor: 'transparent' },
});
