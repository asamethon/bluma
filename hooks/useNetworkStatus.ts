import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useSyncExternalStore } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isOffline: boolean;
  /** İlk gerçek NetInfo okuması geldi mi? Açılışta false. */
  isResolved: boolean;
}

// Açılışta ağ durumu henüz bilinmiyor. İyimser davranıp "online" kabul
// ediyoruz: aksi halde splash sonrası bir an offline arayüzü görünüp hemen
// online'a dönüyordu (kullanıcı bağlıyken bile "çevrimdışı" çakması).
const INITIAL: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
  isOffline: false,
  isResolved: false,
};

const listeners = new Set<() => void>();
const source = {
  current: INITIAL,
  unsubscribe: null as (() => void) | null,
};

const sameState = (a: NetworkState, b: NetworkState) =>
  a.isConnected === b.isConnected &&
  a.isInternetReachable === b.isInternetReachable &&
  a.type === b.type &&
  a.isOffline === b.isOffline &&
  a.isResolved === b.isResolved;

function publish(next: NetworkState) {
  if (sameState(next, source.current)) return;
  source.current = next;
  listeners.forEach(notify => notify());
}

function toState(state: NetInfoState): NetworkState {
  // `isInternetReachable` bir süre null kalır (ölçüm sürüyor). null = "henüz
  // bilinmiyor" demektir, offline değil: yalnızca açıkça false ise çevrimdışıyız.
  return {
    isConnected: state.isConnected ?? true,
    isInternetReachable: state.isInternetReachable ?? true,
    type: state.type,
    isOffline: state.isConnected === false || state.isInternetReachable === false,
    isResolved: true,
  };
}

/**
 * Ağ dinleyicisini başlatır. Açılışta (splash sırasında) çağrılır ki gerçek
 * durum, arayüz görünmeden önce hazır olsun. Idempotent'tir.
 */
export function initNetworkStatus() {
  if (source.unsubscribe) return;
  source.unsubscribe = NetInfo.addEventListener(state => publish(toState(state)));
  NetInfo.fetch().then(state => publish(toState(state))).catch(() => {});
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  initNetworkStatus();
  return () => { listeners.delete(onStoreChange); };
}

export const useNetworkStatus = (): NetworkState =>
  useSyncExternalStore(subscribe, () => source.current);
