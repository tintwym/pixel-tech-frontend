'use client';

import React, { useEffect, useState } from 'react';
import AdminPage from '@/components/AdminPage';
import ToastContainer, { ToastMessage } from '@/components/ToastContainer';
import { GroceryItem, Order } from '@/types';
import { INITIAL_GROCERIES } from '@/data/products';
import { fetchCatalogProducts } from '@/lib/productsApi';
import {
  applyStockOverrides,
  loadPersistedOrders,
  persistOrders,
  persistStockLevels,
} from '@/lib/commerceSync';

export default function AdminRoutePage() {
  const [products, setProducts] = useState<GroceryItem[]>(INITIAL_GROCERIES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCatalogProducts()
      .then((items) => {
        if (!cancelled && items.length) setProducts(applyStockOverrides(items));
      })
      .catch(() => undefined);
    setOrders(loadPersistedOrders());
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistStockLevels(products);
  }, [products]);

  useEffect(() => {
    persistOrders(orders);
  }, [orders]);

  const handleAddToast = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  const handleAddNotification = (
    _title: string,
    _message: string,
    _type: 'info' | 'success' | 'warning' | 'order' | 'inventory'
  ) => {
    /* Admin page notifications are toast-backed on this route */
  };

  return (
    <>
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
      <AdminPage
        products={products}
        orders={orders}
        onRestock={(itemId, amount) => {
          setProducts((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, stock: Math.min(item.maxStock, item.stock + amount) }
                : item
            )
          );
        }}
        onUpdateOrderStatus={(orderId, status, step) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status, step } : o))
          );
        }}
        onAddToast={handleAddToast}
        onAddNotification={handleAddNotification}
      />
    </>
  );
}
