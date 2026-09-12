"use client";

// Carrito Cuyana: solo del lado del cliente (localStorage) mientras la
// tienda no tiene pedidos reales del sistema canónico. Es intencional que
// viva fuera de Supabase hasta que exista una integración real que pueda
// producir un pedido oficial.

const STORAGE_KEY = "cuyana_cart_v1";

export interface CartItem {
  slug: string;
  sourceSystem: string;
  sourceProductId: string;
  name: string;
  priceUsd: number;
  category: "alimentos" | "energia";
  quantity: number;
}

function leer(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardar(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("cuyana-cart-updated"));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota agotada): el
    // carrito simplemente no persiste, sin romper la página.
  }
}

export function getCart(): CartItem[] {
  return leer();
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = leer();
  const existing = items.find((i) => i.slug === item.slug);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }
  guardar(items);
  // Aparte de "el carrito cambió" (para el contador del header), este evento
  // lleva el nombre del producto para que el aviso de confirmación pueda
  // decir qué se agregó, sin que el header tenga que adivinarlo.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cuyana-cart-added", { detail: { name: item.name, quantity } }));
  }
  return items;
}

export function removeFromCart(slug: string) {
  const items = leer().filter((i) => i.slug !== slug);
  guardar(items);
  return items;
}

/** Cambia la cantidad de una línea. Si queda en 0 o menos, la quita. */
export function updateQuantity(slug: string, quantity: number) {
  if (quantity <= 0) return removeFromCart(slug);
  const items = leer();
  const item = items.find((i) => i.slug === slug);
  if (item) item.quantity = quantity;
  guardar(items);
  return items;
}

export function clearCart() {
  guardar([]);
}

export function cartTotalUsd(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.priceUsd * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
