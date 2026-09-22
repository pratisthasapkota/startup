'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, setToken } from '@/lib/api';

const AppContext = createContext(null);

const CART_KEY = 'vm_cart';

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

export function AppProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [booted, setBooted] = useState(false);
  const [settings, setSettings] = useState({});
  const [allowSellerSignup, setAllowSellerSignup] = useState(true);
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    let alive = true;
    api('/settings/public', { auth: false })
      .then((res) => {
        if (!alive) return;
        setSettings(res.data || {});
        setAllowSellerSignup(res.data?.allowSellerSignup !== false);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (token) {
      api('/auth/me')
        .then((res) => {
          if (alive) setUser(res.data.user);
        })
        .catch(() => setToken(null))
        .finally(() => alive && setBooted(true));
    } else {
      setBooted(true);
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const login = useCallback(
    async (email, password) => {
      const res = await api('/auth/login', { method: 'POST', auth: false, body: { email, password } });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const register = useCallback(
    async (payload) => {
      const res = await api('/auth/register', { method: 'POST', auth: false, body: payload });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    setToken(null);
    setUser(null);
    router.push('/');
  }, [router]);

  const addToCart = useCallback(
    (product, qty = 1) => {
      setCart((c) => {
        const existing = c.find((i) => i.productId === product._id);
        if (existing) {
          const max = product.stock || 99;
          const next = Math.min(existing.qty + qty, max);
          return c.map((i) => (i.productId === product._id ? { ...i, qty: next, price: product.price } : i));
        }
        return [
          ...c,
          {
            productId: product._id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            image: product.images?.[0] || '',
            stock: product.stock || 0,
            qty,
          },
        ];
      });
      toast('Added to cart', 'success');
    },
    [toast]
  );

  const setQty = useCallback((productId, qty) => {
    setCart((c) =>
      qty <= 0
        ? c.filter((i) => i.productId !== productId)
        : c.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, i.stock || 99) } : i))
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      booted,
      login,
      register,
      logout,
      settings,
      setSettings,
      cart,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      cartCount,
      cartSubtotal,
      toast,
      allowSellerSignup,
    }),
    [user, booted, login, register, logout, settings, setSettings, cart, addToCart, setQty, removeFromCart, clearCart, cartCount, cartSubtotal, toast, allowSellerSignup]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);