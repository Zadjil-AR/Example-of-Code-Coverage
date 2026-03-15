'use strict';

const Product = require('../src/product');
const Cart = require('../src/cart');

const apple = new Product('p1', 'Apple', 1.0, 'fruit');
const banana = new Product('p2', 'Banana', 0.5, 'fruit');
const laptop = new Product('p3', 'Laptop', 999.99, 'electronics');

describe('Cart', () => {
  let cart;

  beforeEach(() => {
    cart = new Cart();
  });

  describe('initial state', () => {
    it('starts empty', () => {
      expect(cart.isEmpty()).toBe(true);
      expect(cart.items).toHaveLength(0);
      expect(cart.discountCode).toBeNull();
    });
  });

  describe('addItem', () => {
    it('adds a new item', () => {
      cart.addItem(apple);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product).toBe(apple);
      expect(cart.items[0].quantity).toBe(1);
    });

    it('increments quantity for an existing item', () => {
      cart.addItem(apple, 2);
      cart.addItem(apple, 3);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('adds multiple different products', () => {
      cart.addItem(apple);
      cart.addItem(banana);
      expect(cart.items).toHaveLength(2);
    });

    it('throws for zero quantity', () => {
      expect(() => cart.addItem(apple, 0)).toThrow(
        'Quantity must be a positive number'
      );
    });

    it('throws for negative quantity', () => {
      expect(() => cart.addItem(apple, -1)).toThrow(
        'Quantity must be a positive number'
      );
    });
  });

  describe('removeItem', () => {
    it('removes an existing item', () => {
      cart.addItem(apple);
      cart.removeItem('p1');
      expect(cart.items).toHaveLength(0);
    });

    it('throws when item is not in cart', () => {
      expect(() => cart.removeItem('unknown')).toThrow(
        'Item with id "unknown" not found in cart'
      );
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity to a new positive value', () => {
      cart.addItem(apple, 2);
      cart.updateQuantity('p1', 5);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('removes the item when quantity is set to zero', () => {
      cart.addItem(apple);
      cart.updateQuantity('p1', 0);
      expect(cart.isEmpty()).toBe(true);
    });

    it('removes the item when quantity is negative', () => {
      cart.addItem(apple);
      cart.updateQuantity('p1', -3);
      expect(cart.isEmpty()).toBe(true);
    });

    it('throws when item is not found', () => {
      expect(() => cart.updateQuantity('unknown', 2)).toThrow(
        'Item with id "unknown" not found in cart'
      );
    });
  });

  describe('applyDiscount', () => {
    it('applies SAVE10 discount code', () => {
      const rate = cart.applyDiscount('SAVE10');
      expect(rate).toBeCloseTo(0.1);
      expect(cart.discountCode).toBe('SAVE10');
    });

    it('applies SAVE20 discount code', () => {
      const rate = cart.applyDiscount('SAVE20');
      expect(rate).toBeCloseTo(0.2);
    });

    it('applies HALFOFF discount code', () => {
      const rate = cart.applyDiscount('HALFOFF');
      expect(rate).toBeCloseTo(0.5);
    });

    it('throws for an invalid code', () => {
      expect(() => cart.applyDiscount('BOGUS')).toThrow(
        'Invalid discount code: "BOGUS"'
      );
    });
  });

  describe('getSubtotal', () => {
    it('returns 0 for an empty cart', () => {
      expect(cart.getSubtotal()).toBe(0);
    });

    it('sums prices × quantities', () => {
      cart.addItem(apple, 3);
      cart.addItem(banana, 2);
      expect(cart.getSubtotal()).toBeCloseTo(4.0);
    });
  });

  describe('getDiscount', () => {
    it('returns 0 when no discount is applied', () => {
      cart.addItem(laptop);
      expect(cart.getDiscount()).toBe(0);
    });

    it('returns the correct discount amount', () => {
      cart.addItem(laptop);
      cart.applyDiscount('SAVE20');
      expect(cart.getDiscount()).toBeCloseTo(199.998);
    });
  });

  describe('getTotal', () => {
    it('equals subtotal when no discount', () => {
      cart.addItem(apple, 4);
      expect(cart.getTotal()).toBeCloseTo(4.0);
    });

    it('deducts discount from subtotal', () => {
      cart.addItem(laptop);
      cart.applyDiscount('HALFOFF');
      expect(cart.getTotal()).toBeCloseTo(499.995);
    });
  });

  describe('getItemCount', () => {
    it('counts all units across items', () => {
      cart.addItem(apple, 3);
      cart.addItem(banana, 2);
      expect(cart.getItemCount()).toBe(5);
    });

    it('returns 0 for an empty cart', () => {
      expect(cart.getItemCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('empties the cart and resets the discount', () => {
      cart.addItem(apple);
      cart.applyDiscount('SAVE10');
      cart.clear();
      expect(cart.isEmpty()).toBe(true);
      expect(cart.discountCode).toBeNull();
    });
  });

  describe('isEmpty', () => {
    it('returns true when the cart has no items', () => {
      expect(cart.isEmpty()).toBe(true);
    });

    it('returns false when the cart has items', () => {
      cart.addItem(apple);
      expect(cart.isEmpty()).toBe(false);
    });
  });
});
