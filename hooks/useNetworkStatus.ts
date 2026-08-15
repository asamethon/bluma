import NetInfo from '@react-native-community/netinfo';
import { useSyncExternalStore } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isOffline: boolean;
}

const INITIAL: NetworkState = {
  isConnected: false,
  isInternetReachable: false,
  type: 'unknown',
  isOffline: true,
};

let current: NetworkState = INITIAL;
const listeners = new Set<() => void>();
let netInfoUnsub: (() => void) | null = null;

function publish(next: NetworkState) {
  if (
    next.isConnected === current.isConnected &&
    next.isInternetReachable === current.isInternetReachable &&
    next.type === current.type &&
    next.isOffline === current.isOffline
  ) {
    return;
  }
  current = next;
  listeners.forEach(l => l());
}

function toState(state: { isConnected: boolean | null; isInternetReachable: boolean | null; type: string }): NetworkState {
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? false,
    type: state.type,
    isOffline: !state.isConnected || !state.isInternetReachable,
  };
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (!netInfoUnsub) {
    NetInfo.fetch().then(s => publish(toState(s)));
    netInfoUnsub = NetInfo.addEventListener(s => publish(toState(s)));
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && netInfoUnsub) {
      netInfoUnsub();
      netInfoUnsub = null;
    }
  };
}

export const useNetworkStatus = (): NetworkState =>
  useSyncExternalStore(subscribe, () => current);
