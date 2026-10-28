import { describe, expect, it } from '@jest/globals';

import { entitlementFrom, needsAcknowledge, OFFLINE_PRODUCT_ID, type PurchaseLike } from '../purchase';

const p = (over: Partial<PurchaseLike> = {}): PurchaseLike => ({
  productId: OFFLINE_PRODUCT_ID,
  purchaseState: 'purchased',
  isAcknowledgedAndroid: true,
  ...over,
});

describe('entitlementFrom', () => {
  it('brak zakupów to brak uprawnienia (także po zwrocie)', () => {
    expect(entitlementFrom([])).toBe('none');
  });

  it('opłacony zakup odblokowuje pobieranie', () => {
    expect(entitlementFrom([p()])).toBe('owned');
  });

  it('płatność oczekująca niczego nie odblokowuje', () => {
    expect(entitlementFrom([p({ purchaseState: 'pending' })])).toBe('pending');
  });

  it('opłacony zakup wygrywa z oczekującym', () => {
    expect(entitlementFrom([p({ purchaseState: 'pending' }), p()])).toBe('owned');
  });

  it('ignoruje inne produkty i stan nieznany', () => {
    expect(entitlementFrom([p({ productId: 'inny' }), p({ purchaseState: 'unknown' })])).toBe('none');
  });
});

describe('needsAcknowledge', () => {
  it('potwierdzamy opłacony, jeszcze niepotwierdzony zakup', () => {
    expect(needsAcknowledge(p({ isAcknowledgedAndroid: false }))).toBe(true);
    expect(needsAcknowledge(p({ isAcknowledgedAndroid: null }))).toBe(true);
  });

  it('nie potwierdzamy ponownie ani płatności oczekującej, ani obcego produktu', () => {
    expect(needsAcknowledge(p())).toBe(false);
    expect(needsAcknowledge(p({ purchaseState: 'pending', isAcknowledgedAndroid: false }))).toBe(false);
    expect(needsAcknowledge(p({ productId: 'inny', isAcknowledgedAndroid: false }))).toBe(false);
  });
});
