import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    gst: 0,
    deliveryCharge: 0,
    grandTotal: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (user && user.role === 'customer') {
      try {
        setLoading(true);
        const res = await API.get('/cart');
        setCart(res.data);
      } catch (err) {
        console.error('Error loading cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setCart({ items: [], subtotal: 0, gst: 0, deliveryCharge: 0, grandTotal: 0 });
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (vegetable_id, quantity = 1, quantity_unit = 'kg', quantity_value = 1) => {
    try {
      const res = await API.post('/cart', { vegetable_id, quantity, quantity_unit, quantity_value });
      await fetchCart();
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to add item to cart.';
    }
  };

  const updateQuantity = async (cart_id, quantity, quantity_unit, quantity_value) => {
    try {
      await API.put(`/cart/${cart_id}`, { quantity, quantity_unit, quantity_value });
      await fetchCart();
    } catch (err) {
      throw err.response?.data?.message || 'Failed to update quantity.';
    }
  };

  const removeFromCart = async (cart_id) => {
    try {
      await API.delete(`/cart/${cart_id}`);
      await fetchCart();
    } catch (err) {
      throw err.response?.data?.message || 'Failed to remove item.';
    }
  };

  const clearCart = async () => {
    try {
      await API.delete('/cart/clear/all');
      await fetchCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const cartCount = cart.items ? cart.items.length : 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
