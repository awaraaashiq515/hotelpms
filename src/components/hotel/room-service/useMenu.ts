// ── useMenu — Fetch categories and products ────────────────────────────────────
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MenuCategory, MenuItem } from './types';

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (prodRes.success) {
        // Only show active, available food products
        const foodItems = (prodRes.data || []).filter(
          (p: MenuItem) => p.isActive && p.availabilityStatus
        );
        setProducts(foodItems);
      }
    } catch {
      setError('Menu load karne mein dikkat. Please refresh karo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered products based on category + search + veg filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const catMatch = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || p.name.toLowerCase().includes(q);
      const vegMatch =
        vegFilter === 'all' ||
        (vegFilter === 'veg' && p.isVeg) ||
        (vegFilter === 'nonveg' && !p.isVeg);
      return catMatch && searchMatch && vegMatch;
    });
  }, [products, selectedCategory, searchQuery, vegFilter]);

  // Categories that have at least one active product
  const activeCategories = useMemo(() => {
    const catIds = new Set(products.map(p => p.categoryId));
    return categories.filter(c => catIds.has(c.id));
  }, [categories, products]);

  return {
    categories: activeCategories,
    products: filteredProducts,
    allProducts: products,
    loading,
    error,
    reload: load,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    vegFilter,
    setVegFilter,
  };
}
