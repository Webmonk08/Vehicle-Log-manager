import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Backs the sticky OfflineBanner + the write-action lock indicators described
 * in the plan (section 5): reads work from cache, writes are disabled offline.
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  return isOffline;
}
