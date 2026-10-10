import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { startHttpServer } from './httpServer.js';
import { createPushHandlers } from './pushHandlers.js';
import { createPushRepository } from './pushRepository.js';
import { watchPushTokens } from './tokenDedupe.js';
import { watchAdded } from './watchAdded.js';

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const auth = getAuth(app);
const handlers = createPushHandlers(db, createPushRepository(db));

watchAdded(db.collection('notifications').orderBy('createdAt', 'desc').limit(50), handlers.notification, 'notifications');
watchAdded(db.collectionGroup('messages').orderBy('createdAt', 'desc').limit(50), handlers.message, 'messages');
watchPushTokens(db);

const port = Number(process.env.PORT || 8789);
const host = process.env.HOST || '127.0.0.1';
startHttpServer(auth, db, { host, port });

console.log('Bluma push worker başladı — notifications, messages ve push token dedupe dinleniyor.');
