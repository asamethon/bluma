// Firebase yönlendirmesi, router'ın yüklediği herhangi bir servisten önce kurulur.
import { configureFirebaseEmulators } from './features/bootstrap/services/firebaseEmulators';

configureFirebaseEmulators();
require('expo-router/entry');
