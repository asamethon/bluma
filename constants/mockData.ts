import { Timestamp } from '@react-native-firebase/firestore';
import { DirectMessage, MessageThread, Conversation, ConversationComment, User } from '@/types';

export const SHOW_MOCK_DATA = false;

function ago(minutes: number) {
  return Timestamp.fromDate(new Date(Date.now() - minutes * 60_000));
}

const mockUsers: Record<string, User> = {
  elif: {
    id: 'mock_elif',
    email: 'elif@mock.com',
    displayName: 'Elif Yılmaz',
    username: 'elifyilmaz',
    bio: 'Fantastik kurgu ve bilim kurgu yazarı',
    authProvider: 'email',
    followersCount: 312,
    followingCount: 89,
    storiesCount: 7,
    profileImage: 'https://i.pravatar.cc/150?img=47',
  },
  cem: {
    id: 'mock_cem',
    email: 'cem@mock.com',
    displayName: 'Cem Aksoy',
    username: 'cemaksoy',
    bio: 'Gerilim ve polisiye',
    authProvider: 'email',
    followersCount: 1240,
    followingCount: 203,
    storiesCount: 14,
    profileImage: 'https://i.pravatar.cc/150?img=12',
  },
  zeynep: {
    id: 'mock_zeynep',
    email: 'zeynep@mock.com',
    displayName: 'Zeynep Kara',
    username: 'zeynepkara',
    bio: 'Romantik kurgu ve kısa öykü',
    authProvider: 'email',
    followersCount: 578,
    followingCount: 142,
    storiesCount: 11,
    profileImage: 'https://i.pravatar.cc/150?img=32',
  },
  ahmet: {
    id: 'mock_ahmet',
    email: 'ahmet@mock.com',
    displayName: 'Ahmet Demir',
    username: 'ahmetdemir',
    bio: 'Tarihî roman ve deneme yazarı',
    authProvider: 'email',
    followersCount: 890,
    followingCount: 67,
    storiesCount: 5,
    profileImage: 'https://i.pravatar.cc/150?img=53',
  },
  selin: {
    id: 'mock_selin',
    email: 'selin@mock.com',
    displayName: 'Selin Aydın',
    username: 'selinaydin',
    bio: 'Şiir ve deneysel kurgu',
    authProvider: 'email',
    followersCount: 2100,
    followingCount: 310,
    storiesCount: 22,
    profileImage: 'https://i.pravatar.cc/150?img=26',
  },
};

export const MOCK_THREADS: MessageThread[] = [
  {
    id: 'mock_elif_thread',
    participants: ['mock_current', 'mock_elif'],
    lastMessage: { text: 'Son bölüm harikaydı, sabırsızlıkla devamını bekliyorum! 🌟', senderId: 'mock_elif', createdAt: ago(3) },
    updatedAt: ago(3),
    otherUser: mockUsers.elif,
    unread: 2,
  },
  {
    id: 'mock_cem_thread',
    participants: ['mock_current', 'mock_cem'],
    lastMessage: { text: 'Ortak bir hikâye projesi yapalım mı?', senderId: 'mock_cem', createdAt: ago(18) },
    updatedAt: ago(18),
    otherUser: mockUsers.cem,
    unread: 1,
  },
  {
    id: 'mock_zeynep_thread',
    participants: ['mock_current', 'mock_zeynep'],
    lastMessage: { text: 'Teşekkürler, kapak görselini güncelledim 💜', senderId: 'mock_current', createdAt: ago(45) },
    updatedAt: ago(45),
    otherUser: mockUsers.zeynep,
    unread: 0,
  },
  {
    id: 'mock_ahmet_thread',
    participants: ['mock_current', 'mock_ahmet'],
    lastMessage: { text: 'O sahneyi biraz daha geliştirsen çok iyi olacak', senderId: 'mock_ahmet', createdAt: ago(120) },
    updatedAt: ago(120),
    otherUser: mockUsers.ahmet,
    unread: 0,
  },
  {
    id: 'mock_selin_thread',
    participants: ['mock_current', 'mock_selin'],
    lastMessage: { text: 'Hikâyeni kütüphaneme ekledim, harika bir atmosfer yakalamışsın', senderId: 'mock_selin', createdAt: ago(360) },
    updatedAt: ago(360),
    otherUser: mockUsers.selin,
    unread: 0,
  },
];

export const MOCK_CHAT_MESSAGES: DirectMessage[] = [
  {
    id: 'mock_msg_1',
    senderId: 'mock_elif',
    text: 'Merhaba! "Kayıp Şehir" hikâyeni okudum, çok etkileyici 👏',
    createdAt: ago(180),
  },
  {
    id: 'mock_msg_2',
    senderId: 'mock_current',
    text: 'Çok teşekkür ederim Elif! Senin görüşün benim için çok değerli.',
    createdAt: ago(175),
  },
  {
    id: 'mock_msg_3',
    senderId: 'mock_elif',
    text: 'Özellikle üçüncü bölümdeki gerilim sahnesi müthişti. Karakterin iç çatışmasını çok güzel yansıtmışsın.',
    createdAt: ago(170),
  },
  {
    id: 'mock_msg_4',
    senderId: 'mock_current',
    text: 'O bölüm üzerinde çok çalıştım aslında. İlk taslak çok farklıydı.',
    createdAt: ago(165),
  },
  {
    id: 'mock_msg_5',
    senderId: 'mock_elif',
    text: 'Devamını ne zaman yayınlıyorsun? 😊',
    createdAt: ago(160),
  },
  {
    id: 'mock_msg_6',
    senderId: 'mock_current',
    text: 'Bu hafta sonu yeni bölümü yayınlamayı planlıyorum. Sürpriz bir karakter dönüşü var!',
    createdAt: ago(155),
  },
  {
    id: 'mock_msg_7',
    senderId: 'mock_elif',
    text: 'Harika! Merakla bekliyorum. Bu arada senin de benim son hikâyeme bir göz atmanı isterim.',
    createdAt: ago(30),
  },
  {
    id: 'mock_msg_8',
    senderId: 'mock_elif',
    text: 'Son bölüm harikaydı, sabırsızlıkla devamını bekliyorum! 🌟',
    createdAt: ago(3),
  },
];


export const MOCK_CONVERSATION: Conversation = {
  id: 'mock_conv_1',
  authorId: 'mock_selin',
  author: mockUsers.selin,
  title: 'Fantastik kurgu yazarken dünya inşası ipuçları',
  content:
    'Yeni bir fantastik kurgu serisi üzerinde çalışıyorum ve dünya inşası konusunda deneyimli yazarların fikirlerini almak istedim.\n\nHikâyemde paralel bir evren kurgusu var — kendi dil sistemi, toplumsal yapısı ve mitolojisiyle. Ama okuyucuyu bunaltmadan bu detayları nasıl vereceğimi tam çözemedim.\n\nSiz dünya inşasına nasıl yaklaşıyorsunuz? Hikâyenin akışını bozmadan zengin bir dünya hissi yaratmanın en etkili yolları neler?',
  likesCount: 24,
  commentsCount: 8,
  viewsCount: 143,
  isActive: true,
  createdAt: ago(480),
  updatedAt: ago(15),
};

export const MOCK_CONVERSATION_COMMENTS: ConversationComment[] = [
  {
    id: 'mock_cc_1',
    conversationId: 'mock_conv_1',
    userId: 'mock_cem',
    user: mockUsers.cem,
    content:
      'Benim yaklaşımım "buzdağı yöntemi" — dünyanın %90\'ını biliyorum ama okuyucuya yalnızca %10\'unu doğrudan gösteriyorum. Geri kalan detaylar, karakterlerin davranışlarında ve diyaloglarında kendini belli ediyor.',
    likesCount: 7,
    createdAt: ago(420),
  },
  {
    id: 'mock_cc_2',
    conversationId: 'mock_conv_1',
    userId: 'mock_elif',
    user: mockUsers.elif,
    content:
      'Büyük bilgi dökümleri yerine, karakterin günlük hayatı üzerinden dünyayı tanıtmayı tercih ediyorum. Mesela bir karakter pazara gidiyorsa, orada gördüğü şeyler üzerinden kültürü ve ekonomiyi anlatabilirsin.',
    likesCount: 12,
    createdAt: ago(380),
  },
  {
    id: 'mock_cc_3',
    conversationId: 'mock_conv_1',
    userId: 'mock_ahmet',
    user: mockUsers.ahmet,
    content:
      'Tarihî romanlarda da benzer bir sorun var. Benim tavsiyem: her sahnenin bir "bilgi bütçesi" olsun. Bir sahnede en fazla 1-2 yeni dünya detayı ver, daha fazlası okuyucuyu yorar.',
    likesCount: 9,
    createdAt: ago(300),
  },
  {
    id: 'mock_cc_4',
    conversationId: 'mock_conv_1',
    userId: 'mock_zeynep',
    user: mockUsers.zeynep,
    content: 'Çok güzel bir konu açmışsın! Dil sistemi oluşturma kısmı çok ilgimi çekti. Birkaç örnek kelime paylaşır mısın? 😊',
    likesCount: 3,
    createdAt: ago(240),
  },
];
