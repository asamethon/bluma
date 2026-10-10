import { messageDustHtml } from '@/features/messaging/utils/messageDust';

const { runInNewContext } = jest.requireActual<{
  runInNewContext: (code: string, context: object) => void;
}>('node:vm');

describe('mesajın piksel animasyonu', () => {
  it.each([-1, 1])('her iki yönde de başlar, parçaları dağıtır ve kanvası tamamen temizler (%s)', direction => {
    const drawn: unknown[][] = [];
    const cleared: unknown[][] = [];
    const sent: string[] = [];
    const frames: ((time: number) => void)[] = [];
    const context = {
      scale: () => {}, globalAlpha: 1,
      drawImage: (...args: unknown[]) => drawn.push(args),
      clearRect: (...args: unknown[]) => cleared.push(args),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(255) }),
    };
    const canvas = () => ({ width: 0, height: 0, style: {}, getContext: () => context });
    const window = { devicePixelRatio: 3, ReactNativeWebView: { postMessage: (value: string) => sent.push(value) }, startDust: () => {} };
    class Image {
      onload = () => {};
      set src(uri: string) { expect(uri.startsWith('data:image/png;base64,')).toBe(true); this.onload(); }
    }
    const html = messageDustHtml({ uri: 'data:image/png;base64,TEST', width: 380, height: 120, direction });
    const script = html.match(/<script>([\s\S]*)<\/script>/)![1];
    runInNewContext(script, {
      window, Image, document: { getElementById: canvas, createElement: canvas },
      performance: { now: () => 0 }, requestAnimationFrame: (frame: (time: number) => void) => frames.push(frame),
    });
    expect(sent).toEqual(['ready']);
    window.startDust();
    for (let time = 0; frames.length && time < 1400; time += 16) frames.shift()!(time);
    expect(sent).toEqual(['ready', 'done']);
    expect(frames).toHaveLength(0);
    expect(drawn.some(args => args.length === 9)).toBe(true);
    expect(cleared.length).toBeGreaterThan(60);
    expect(context.globalAlpha).toBe(1);
  });
});
