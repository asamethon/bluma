import { isMessageVisible, visibleMessages, type MessageRemoval } from '@/features/messaging/utils/messageVisibility';
import reducer, { receiveMessages, startMessageRemoval, finishMessageRemoval, rollbackMessageRemoval } from '@/store/slices/chatSlice';
import type { DirectMessage } from '@/types';

const message = (id: string, extra: Partial<DirectMessage> = {}): DirectMessage => ({
  id, senderId: 'me', text: `İçerik ${id}`, createdAt: Number(id) * 1000, ...extra,
});
const original = message('1');
const second = message('2');
const removal: MessageRemoval = { message: original, animating: true, scope: 'everyone' };

describe('mesaj silme görünürlüğü', () => {
  it('eski silinmiş kayıtlar yeniden açılışta balon veya satır bırakmaz', () => {
    expect(visibleMessages([message('1', { deletedAt: 5000 }), second], [], {}, 'me')).toEqual([second]);
  });
  it('benden silme yalnızca ilgili kullanıcıyı etkiler', () => {
    const hidden = message('1', { hiddenFor: { me: true } });
    expect(isMessageVisible(hidden, 'me')).toBe(false);
    expect(isMessageVisible(hidden, 'other')).toBe(true);
  });
  it('animasyon sırasında özgün görüntüyü korur, sunucu mezar taşını göstermez', () => {
    const rows = visibleMessages([message('1', { text: '', deletedAt: 5000 }), second], [], { '1': removal }, 'me');
    expect(rows).toEqual([original, second]);
  });
  it('animasyon bitince eski sunucu yanıtı mesajı geri getiremez', () => {
    expect(visibleMessages([original, second], [], { '1': { ...removal, animating: false } }, 'me')).toEqual([second]);
  });
  it('animasyon sürerken bile silinen mesajın alıntı metnini temizler', () => {
    const reply = message('2', { replyTo: { id: '1', text: original.text, senderId: 'me', kind: 'text' } });
    expect(visibleMessages([original, reply], [], { '1': removal }, 'me')[1].replyTo).toBeUndefined();
  });
  it('yeni gelen mesaj ve iyimser gönderi, silme sırasında kaybolmaz', () => {
    const pending = message('3', { pending: true });
    expect(visibleMessages([original, second], [pending], { '1': removal }, 'me').map(m => m.id)).toEqual(['1', '2', '3']);
  });
  it('sohbeti gizleme filigranından önceki mesajları göstermez', () => {
    expect(visibleMessages([original, second], [], {}, 'me', 1500)).toEqual([second]);
  });
});

describe('silme ve sunucu yarışları', () => {
  const payload = { threadId: 'thread', messageId: '1' };
  it('hata halinde özgün içerik ve alıntılar geri gelir; yeni mesaj korunur', () => {
    let state = reducer(undefined, receiveMessages({ threadId: 'thread', messages: [original] }));
    state = reducer(state, startMessageRemoval({ threadId: 'thread', removal }));
    state = reducer(state, receiveMessages({ threadId: 'thread', messages: [message('1', { text: '', deletedAt: 5000 }), second] }));
    state = reducer(state, finishMessageRemoval(payload));
    state = reducer(state, rollbackMessageRemoval(payload));
    expect(state.thread.messages).toEqual([original, second]);
    expect(state.thread.removals).toEqual({});
  });
  it('eşzamanlı silmeler birbirlerinin animasyonunu bitirmez', () => {
    let state = reducer(undefined, receiveMessages({ threadId: 'thread', messages: [original, second] }));
    state = reducer(state, startMessageRemoval({ threadId: 'thread', removal }));
    state = reducer(state, startMessageRemoval({ threadId: 'thread', removal: { message: second, animating: true } }));
    state = reducer(state, finishMessageRemoval(payload));
    expect(state.thread.removals['1'].animating).toBe(false);
    expect(state.thread.removals['2'].animating).toBe(true);
  });
});
