/**
 * Logika zakupu „Słuchanie bez internetu” niezależna od biblioteki sklepu,
 * żeby dało się ją sprawdzić testami bez telefonu.
 */

/** Identyfikator produktu w Google Play. Na stałe — nie da się go zmienić ani użyć ponownie. */
export const OFFLINE_PRODUCT_ID = 'usypianki_plus';

/** Minimalny kształt zakupu, którego potrzebujemy (podzbiór typu Purchase z expo-iap). */
export type PurchaseLike = {
  productId: string;
  purchaseState: 'pending' | 'purchased' | 'unknown';
  isAcknowledgedAndroid?: boolean | null;
};

export type Entitlement = 'owned' | 'pending' | 'none';

/**
 * Stan uprawnienia na podstawie listy zakupów z Google Play.
 * „owned” tylko dla zakupu opłaconego; płatność oczekująca niczego nie odblokowuje.
 * Brak zakupu na liście (np. po zwrocie) daje „none”.
 */
export function entitlementFrom(purchases: readonly PurchaseLike[], productId = OFFLINE_PRODUCT_ID): Entitlement {
  const mine = purchases.filter((p) => p.productId === productId);
  if (mine.some((p) => p.purchaseState === 'purchased')) return 'owned';
  if (mine.some((p) => p.purchaseState === 'pending')) return 'pending';
  return 'none';
}

/** Czy zakup trzeba jeszcze potwierdzić w Google (bez tego Google zwraca pieniądze po 3 dniach). */
export function needsAcknowledge(p: PurchaseLike, productId = OFFLINE_PRODUCT_ID): boolean {
  return p.productId === productId && p.purchaseState === 'purchased' && p.isAcknowledgedAndroid !== true;
}
