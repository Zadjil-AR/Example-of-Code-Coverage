'use strict';

const DISCOUNT_RATES = { SAVE10: 0.1, SAVE20: 0.2, HALFOFF: 0.5 };

class Cart {
  constructor() {
    this.items = [];
    this.discountCode = null;
  }

  addItem(product, quantity = 1) {
    if (quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    const existing = this.items.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
  }

  removeItem(productId) {
    const index = this.items.findIndex((item) => item.product.id === productId);
    if (index === -1) {
      throw new Error(`Item with id "${productId}" not found in cart`);
    }
    this.items.splice(index, 1);
  }

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.items.find((item) => item.product.id === productId);
    if (!item) {
      throw new Error(`Item with id "${productId}" not found in cart`);
    }
    item.quantity = quantity;
  }

  applyDiscount(code) {
    if (!DISCOUNT_RATES[code]) {
      throw new Error(`Invalid discount code: "${code}"`);
    }
    this.discountCode = code;
    return DISCOUNT_RATES[code];
  }

  getSubtotal() {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  getDiscount() {
    if (!this.discountCode) {
      return 0;
    }
    return this.getSubtotal() * DISCOUNT_RATES[this.discountCode];
  }

  getTotal() {
    return this.getSubtotal() - this.getDiscount();
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.discountCode = null;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

module.exports = Cart;
