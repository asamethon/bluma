/**
 * Seçicinin döndürdüğü hazır GIF. Sohbette `MessageGif` olarak saklanır,
 * hikâyede metin içine medya token'ı olarak gömülür — bu yüzden tip
 * mesajlaşmaya değil medya alanına ait.
 */
export type PickedGif = {
  url: string;
  width: number;
  height: number;
  /** Çıkartmalar saydamdır: baloncuk zemini olmadan çizilir. */
  sticker?: boolean;
};
