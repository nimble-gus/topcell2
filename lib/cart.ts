"use client";

export interface CartItem {
  id: string; // ID único del item en el carrito
  tipo: "telefono-nuevo" | "telefono-seminuevo" | "accesorio";
  productoId: number;
  varianteId?: number; // Para telefonos (nuevos y seminuevos)
  colorId?: number; // Para accesorios
  cantidad: number;
  precio: number;
  // Datos para mostrar
  modelo: string;
  marca: string;
  imagen: string;
  // Detalles específicos de la variante
  color?: string;
  rom?: string;
  estado?: number;
  porcentajeBateria?: number | null;
  ciclosCarga?: number | null;
}

const CART_STORAGE_KEY = "topcell_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error("Error al leer el carrito:", error);
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Disparar evento personalizado para notificar cambios
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Error al guardar el carrito:", error);
  }
}

export function addToCart(item: Omit<CartItem, "id">): void {
  const cart = getCart();
  
  // Generar ID único para el item
  const id = `${item.tipo}-${item.productoId}-${item.varianteId || item.colorId || "default"}-${Date.now()}`;
  
  // Verificar si ya existe un item similar (mismo tipo, producto y variante/color)
  const existingIndex = cart.findIndex(
    (cartItem) =>
      cartItem.tipo === item.tipo &&
      cartItem.productoId === item.productoId &&
      (item.varianteId
        ? cartItem.varianteId === item.varianteId
        : cartItem.colorId === item.colorId)
  );
  
  if (existingIndex >= 0) {
    // Si ya existe, aumentar la cantidad
    cart[existingIndex].cantidad += item.cantidad;
  } else {
    // Si no existe, agregar nuevo item
    cart.push({ ...item, id });
  }
  
  saveCart(cart);
}

export function removeFromCart(itemId: string): void {
  const cart = getCart();
  const filtered = cart.filter((item) => item.id !== itemId);
  saveCart(filtered);
}

export function updateCartItemQuantity(itemId: string, cantidad: number): void {
  if (cantidad <= 0) {
    removeFromCart(itemId);
    return;
  }
  
  const cart = getCart();
  const item = cart.find((item) => item.id === itemId);
  
  if (item) {
    item.cantidad = cantidad;
    saveCart(cart);
  }
}

export function clearCart(): void {
  saveCart([]);
}

export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.precio * item.cantidad, 0);
}

export function getCartItemsCount(): number {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.cantidad, 0);
}

