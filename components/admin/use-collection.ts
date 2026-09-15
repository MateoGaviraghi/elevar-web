"use client";

import { useCallback, useEffect, useState } from "react";
import { onCollectionChange } from "@/lib/local-db";

/**
 * Lee una colección del store local y se re-suscribe a sus cambios (así dos
 * pestañas del panel o el sitio público quedan sincronizados).
 */
export function useCollection<T>(read: () => T[]): {
  rows: T[];
  ready: boolean;
  refresh: () => void;
} {
  const [rows, setRows] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setRows(read());
    setReady(true);
    // `read` viene de módulos estáticos; se ignora a propósito como dependencia
    // para no re-suscribir en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
    return onCollectionChange(() => refresh());
  }, [refresh]);

  return { rows, ready, refresh };
}
