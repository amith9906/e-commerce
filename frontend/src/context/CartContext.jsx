import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProductCover } from '../utils/productImage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const resolveProductPricing = (product) => {
    const basePrice = Number(product.price) || 0;
    const salePrice = product.salePrice !== undefined && product.salePrice !== null ? Number(product.salePrice) : null;
    const finalPrice = salePrice !== null && salePrice < basePrice ? salePrice : basePrice;
    return { finalPrice, basePrice, salePrice };
  };

  const addToCart = (product, quantity = 1, size = null, color = null) => {
    const pricing = resolveProductPricing(product);
    setCartItems(prev => {
      let updated = false;
      const items = prev.map(item => {
        if (item.productId === product.id && item.size === size && item.color === color) {
          updated = true;
          return {
            ...item,
            quantity: item.quantity + quantity,
            price: pricing.finalPrice,
            basePrice: pricing.basePrice,
            salePrice: pricing.salePrice
          };
        }
        return item;
      });

      if (updated) return items;

      return [...prev, {
        productId: product.id,
        name: product.name,
        price: pricing.finalPrice,
        basePrice: pricing.basePrice,
        salePrice: pricing.salePrice,
        imageUrl: getProductCover(product.images),
        brand: product.brand,
        size,
        color,
        quantity
      }];
    });
    toast.success('Added to cart');
  };

  const removeFromCart = (productId, size = null, color = null) => {
    setCartItems(prev => prev.filter(item => 
        !(item.productId === productId && item.size === size && item.color === color)
    ));
  };

  const updateQuantity = (productId, quantity, size = null, color = null) => {
    if (quantity < 1) return removeFromCart(productId, size, color);
    setCartItems(prev => prev.map(item => 
      (item.productId === productId && item.size === size && item.color === color) 
        ? { ...item, quantity } 
        : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const addToWishlist = (product) => {
    if (wishlistItems.find(item => item.id === product.id)) {
        toast.info('Already in wishlist');
        return;
    }
    setWishlistItems(prev => [...prev, product]);
    toast.success('Added to wishlist');
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
        cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
        wishlistItems, addToWishlist, removeFromWishlist, isInWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
