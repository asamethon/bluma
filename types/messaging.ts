import type { FirestoreDate } from './firestore';
import type { User } from './user';

export interface SharedStory {
  id: string;
  title: string;
  coverImage?: string;
  authorName?: string;
}

/** Yanıtlanan mesajın baloncukta gösterilecek özeti (denormalize). */
export interface MessageReply {
  id: string;
  senderId: string;
  text: string;
  kind: 'text' | 'image' | 'story' | 'viewOnce' | 'voice' | 'gif' | 'sticker';
}

/** Sesli mesaj: VPS'e yüklenen kaydın adresi ve süresi. */
export interface VoiceMessage {
  url: string;
  durationMs: number;
}

/** GIF ya da çıkartma: Tenor CDN adresi doğrudan saklanır, yeniden yüklenmez. */
export interface MessageGif {
  url: string;
  width: number;
  height: number;
  /** Çıkartmalar saydamdır: baloncuk zemini olmadan çizilir. */
  sticker?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  image?: string;
  story?: SharedStory;
  replyTo?: MessageReply;
  voice?: VoiceMessage;
  gif?: MessageGif;
  /** Tek seferlik fotoğraf: alıcı bir kez açar, sonra kimse göremez. */
  viewOnce?: boolean;
  openedAt?: FirestoreDate | null;
  createdAt: FirestoreDate;
  /** Herkesten silindiğinde içerik boşaltılır; bu kayıt arayüzde gösterilmez. */
  deletedAt?: FirestoreDate | null;
  /** Metin düzenlendiyse baloncukta "düzenlendi" künyesi çıkar. */
  editedAt?: FirestoreDate | null;
  /** "Benden sil": yalnızca bu kullanıcıya gizlenir. */
  hiddenFor?: Record<string, boolean>;
  clientId?: string;
  // Yalnızca istemcide duran iyimser (henüz sunucuya yazılmamış) kopya.
  pending?: boolean;
}

// WhatsApp benzeri gönderim durumu: saat → tek tik → soluk çift tik → mavi çift tik.
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageThread {
  id: string;
  participants: string[];
  lastMessage?: { text: string; senderId: string; createdAt: FirestoreDate } | null;
  updatedAt?: FirestoreDate;
  otherUser?: User | null;
  unread: number;
  hiddenBefore?: number;
}
