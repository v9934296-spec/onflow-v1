import { useEffect, useState } from "react";
import { isApiConfigured, isOffline, subscribeConnectivity } from "@/store/net";

/** Live connectivity. Re-reads on online, offline, and foreground — not once on mount. */
export function useOffline(): boolean {
  const [offline, setOffline] = useState(() => !isApiConfigured() || isOffline());

  useEffect(() => {
    const refresh = () => setOffline(!isApiConfigured() || isOffline());
    refresh();
    return subscribeConnectivity(refresh);
  }, []);

  return offline;
}
