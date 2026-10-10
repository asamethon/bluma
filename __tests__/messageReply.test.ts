import { toReplySnippet } from '@/features/messaging/utils/reply';
import type { DirectMessage } from '@/types';

const message = (extra: Partial<DirectMessage> = {}): DirectMessage => ({
  id: 'm1',
  senderId: 'u1',
  text: '',
  createdAt: new Date(),
  ...extra,
});

describe('toReplySnippet', () => {
  it('metin mesajını olduğu gibi taşır', () => {
    const snippet = toReplySnippet(message({ text: 'Merhaba' }));
    expect(snippet).toMatchObject({ id: 'm1', senderId: 'u1', kind: 'text', text: 'Merhaba' });
  });

  it('uzun metni kısaltır ve üç nokta ekler', () => {
    const snippet = toReplySnippet(message({ text: 'a'.repeat(300) }));
    expect(snippet.text).toHaveLength(140);
    expect(snippet.text.endsWith('…')).toBe(true);
  });

  it('metinsiz fotoğrafı görsel olarak etiketler', () => {
    const snippet = toReplySnippet(message({ image: 'https://x/y.webp' }));
    expect(snippet.kind).toBe('image');
    expect(snippet.text.length).toBeGreaterThan(0);
  });

  it('tek seferlik fotoğraf, görselden önce gelir', () => {
    const snippet = toReplySnippet(message({ image: 'https://x/y.webp', viewOnce: true }));
    expect(snippet.kind).toBe('viewOnce');
  });

  it('hikâye paylaşımını hikâye olarak etiketler', () => {
    const snippet = toReplySnippet(message({ story: { id: 's1', title: 'Kitap' } }));
    expect(snippet.kind).toBe('story');
  });

  it('altyazılı fotoğrafta altyazıyı gösterir', () => {
    const snippet = toReplySnippet(message({ image: 'https://x/y.webp', text: 'Bak' }));
    expect(snippet).toMatchObject({ kind: 'image', text: 'Bak' });
  });
});
