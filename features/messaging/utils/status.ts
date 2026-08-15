import { toMillis } from '@/features/messaging/utils/time';
import { DirectMessage, MessageStatus } from '@/types';

// Teslim/okundu durumu MESAJ BAŞINA değil, thread dokümanındaki iki filigrandan
// türetilir (mesaj başına yazma = her DM için N ek yazma demekti):
//   lastDelivered.{alıcı} — push işçisi bildirimi başarıyla gönderdiğinde yazar
//   lastRead.{alıcı}      — alıcı sohbeti açtığında yazar
// İkisi de serverTimestamp olduğundan daima artan; mesajın createdAt'ini geçen
// filigran, o mesajın da o aşamaya ulaştığı anlamına gelir.
export function messageStatus(
  message: DirectMessage,
  deliveredUntil: number,
  readUntil: number
): MessageStatus {
  if (message.pending) return 'sending';
  const sentAt = toMillis(message.createdAt);
  // serverTimestamp henüz çözülmediyse (kendi yazımızın yerel yankısı) createdAt boş gelir.
  if (!sentAt) return 'sending';
  if (readUntil >= sentAt) return 'read';
  if (deliveredUntil >= sentAt) return 'delivered';
  return 'sent';
}
