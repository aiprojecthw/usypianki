import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap';
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useSettings } from '@/data/settings-provider';
import { entitlementFrom, needsAcknowledge, OFFLINE_PRODUCT_ID } from '@/logic/purchase';

/**
 * Zakup „Słuchanie bez internetu” przez Google Play Billing (expo-iap), bez serwera.
 *
 * - Cena pochodzi z Google (waluta i podatki kraju rodzica), nie jest wpisana w kodzie.
 * - Opłacony zakup potwierdzamy od razu (inaczej Google zwraca pieniądze po 3 dniach)
 *   i zapisujemy „kupione” w ustawieniach telefonu, żeby działało też bez internetu.
 * - Przy starcie i po „Przywróć zakup” sprawdzamy listę zakupów w Google. Gdy zakupu
 *   już tam nie ma (zwrot), blokujemy przycisk „Pobierz”; pobrane bajki zostają.
 * - Płatność oczekująca (np. gotówką w sklepie) niczego nie odblokowuje, dopóki Google
 *   jej nie potwierdzi.
 * - Gdy sklep jest niedostępny (brak internetu, wersja spoza Sklepu Play), zostawiamy
 *   ostatni zapisany stan, żeby nie odebrać rodzicowi kupionej funkcji.
 */

export type StoreStatus = 'connecting' | 'ready' | 'unavailable';

type PurchaseState = {
  owned: boolean;
  pending: boolean;
  /** Cena z Google, np. „9,99 zł”; null, dopóki sklep nie odpowie. */
  price: string | null;
  storeStatus: StoreStatus;
  busy: boolean;
  /** Komunikat dla rodzica po nieudanym zakupie (bez anulowania przez użytkownika). */
  error: string | null;
  buy: () => Promise<void>;
  /** Zwraca stan po sprawdzeniu w Google albo null, gdy sklep nie odpowiedział. */
  restore: () => Promise<'owned' | 'pending' | 'none' | null>;
  clearError: () => void;
};

const PurchaseContext = createContext<PurchaseState | null>(null);

const BUY_ERROR = 'Zakup się nie udał. Sprawdź internet i spróbuj ponownie. Jeśli pieniądze zostały pobrane, użyj „Przywróć zakup”.';

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();
  const [storeStatus, setStoreStatus] = useState<StoreStatus>(Platform.OS === 'android' ? 'connecting' : 'unavailable');
  const [price, setPrice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connected = useRef(false);

  const applyEntitlement = useCallback(
    (purchases: readonly Purchase[]) => {
      const state = entitlementFrom(purchases);
      setPending(state === 'pending');
      update({ offlinePurchased: state === 'owned' });
      return state;
    },
    [update]
  );

  const acknowledgeIfNeeded = useCallback(async (purchases: readonly Purchase[]) => {
    for (const p of purchases) {
      if (needsAcknowledge(p)) {
        await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {
          // Spróbujemy ponownie przy następnym uruchomieniu — Google daje na to 3 dni.
        });
      }
    }
  }, []);

  const syncWithStore = useCallback(async () => {
    const purchases = await getAvailablePurchases();
    await acknowledgeIfNeeded(purchases);
    return applyEntitlement(purchases);
  }, [acknowledgeIfNeeded, applyEntitlement]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let cancelled = false;

    const updated = purchaseUpdatedListener((purchase) => {
      if (purchase.productId !== OFFLINE_PRODUCT_ID) return;
      setBusy(false);
      if (purchase.purchaseState === 'purchased') {
        update({ offlinePurchased: true });
        setPending(false);
        setError(null);
        if (needsAcknowledge(purchase)) {
          void finishTransaction({ purchase, isConsumable: false }).catch(() => {});
        }
      } else if (purchase.purchaseState === 'pending') {
        setPending(true);
      }
    });
    const failed = purchaseErrorListener((e) => {
      setBusy(false);
      if (e.code === ErrorCode.UserCancelled) return;
      if (e.code === ErrorCode.AlreadyOwned) {
        void syncWithStore().catch(() => {});
        return;
      }
      setError(BUY_ERROR);
    });

    (async () => {
      try {
        const ok = await initConnection();
        if (!ok || cancelled) throw new Error('no-connection');
        connected.current = true;
        const products = await fetchProducts({ skus: [OFFLINE_PRODUCT_ID], type: 'in-app' });
        const product = (products ?? []).find((p) => p.id === OFFLINE_PRODUCT_ID);
        if (!cancelled && product) setPrice(product.displayPrice);
        await syncWithStore();
        if (!cancelled) setStoreStatus(product ? 'ready' : 'unavailable');
      } catch {
        if (!cancelled) setStoreStatus('unavailable');
      }
    })();

    return () => {
      cancelled = true;
      updated.remove();
      failed.remove();
      if (connected.current) {
        connected.current = false;
        void endConnection().catch(() => {});
      }
    };
    // Połączenie ze sklepem nawiązujemy raz na uruchomienie aplikacji.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = useCallback(async () => {
    if (storeStatus !== 'ready' || busy || settings.offlinePurchased) return;
    setError(null);
    setBusy(true);
    try {
      await requestPurchase({ request: { google: { skus: [OFFLINE_PRODUCT_ID] } }, type: 'in-app' });
      // Wynik przychodzi przez purchaseUpdatedListener / purchaseErrorListener.
    } catch (e) {
      setBusy(false);
      if ((e as { code?: string }).code !== ErrorCode.UserCancelled) setError(BUY_ERROR);
    }
  }, [storeStatus, busy, settings.offlinePurchased]);

  const restore = useCallback(async () => {
    if (!connected.current) return null;
    setBusy(true);
    try {
      await restorePurchases().catch(() => {});
      return await syncWithStore();
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  }, [syncWithStore]);

  return (
    <PurchaseContext
      value={{
        owned: settings.offlinePurchased,
        pending: pending && !settings.offlinePurchased,
        price,
        storeStatus,
        busy,
        error,
        buy,
        restore,
        clearError: () => setError(null),
      }}>
      {children}
    </PurchaseContext>
  );
}

export function usePurchase(): PurchaseState {
  const value = use(PurchaseContext);
  if (!value) throw new Error('usePurchase must be used inside PurchaseProvider');
  return value;
}
