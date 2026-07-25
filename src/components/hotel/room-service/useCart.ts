// ── useCart — Cart state management ───────────────────────────────────────────
'use client';

import { useState, useCallback, useMemo } from 'react';
import { CartLineItem, MenuItem, calcCartTotals } from './types';

const DEFAULT_TAX_RATE = 5; // 5% GST default

export function useCart() {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [taxRate] = useState(DEFAULT_TAX_RATE);

  // Add item or increment qty
  const addItem = useCallback((menuItem: MenuItem) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.menuItem.id === menuItem.id);
      if (existing >= 0) {
        return prev.map((i, idx) =>
          idx === existing
            ? { ...i, qty: i.qty + 1, lineTotal: (i.qty + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, {
        menuItem,
        qty: 1,
        note: '',
        unitPrice: menuItem.sellingPrice,
        lineTotal: menuItem.sellingPrice,
      }];
    });
  }, []);

  // Remove one qty or remove entirely
  const decrementItem = useCallback((itemId: string) => {
    setItems(prev => prev
      .map(i => i.menuItem.id === itemId
        ? { ...i, qty: i.qty - 1, lineTotal: (i.qty - 1) * i.unitPrice }
        : i
      )
      .filter(i => i.qty > 0)
    );
  }, []);

  // Remove item completely
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.menuItem.id !== itemId));
  }, []);

  // Update note for an item
  const updateNote = useCallback((itemId: string, note: string) => {
    setItems(prev => prev.map(i =>
      i.menuItem.id === itemId ? { ...i, note } : i
    ));
  }, []);

  // Set exact qty
  const setQty = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.menuItem.id !== itemId));
      return;
    }
    setItems(prev => prev.map(i =>
      i.menuItem.id === itemId
        ? { ...i, qty, lineTotal: qty * i.unitPrice }
        : i
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => calcCartTotals(items, taxRate), [items, taxRate]);
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const getQty = useCallback((id: string) =>
    items.find(i => i.menuItem.id === id)?.qty ?? 0,
    [items]
  );

  return {
    items, addItem, decrementItem, removeItem, updateNote, setQty, clearCart,
    totals, itemCount, getQty, taxRate,
  };
}
