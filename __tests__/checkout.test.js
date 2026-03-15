'use strict';

const Product = require('../src/product');
const Cart = require('../src/cart');
const Checkout = require('../src/checkout');

const shirt = new Product('s1', 'T-Shirt', 20.0, 'clothing');
const jeans = new Product('s2', 'Jeans', 50.0, 'clothing');

const customer = { name: 'Alice', email: 'alice@example.com' };

function filledCart() {
  const cart = new Cart();
  cart.addItem(shirt, 2);
  cart.addItem(jeans, 1);
  return cart;
}

describe('Checkout', () => {
  let cart;
  let checkout;

  beforeEach(() => {
    cart = filledCart();
    checkout = new Checkout(cart);
  });

  describe('validateCart', () => {
    it('passes for a cart with items', () => {
      expect(checkout.validateCart()).toBe(true);
    });

    it('throws for an empty cart', () => {
      const emptyCart = new Cart();
      const emptyCheckout = new Checkout(emptyCart);
      expect(() => emptyCheckout.validateCart()).toThrow(
        'Cannot checkout with an empty cart'
      );
    });
  });

  describe('processOrder', () => {
    it('creates an order and clears the cart', () => {
      const order = checkout.processOrder(customer);
      expect(order.customer).toBe(customer);
      expect(order.status).toBe('pending');
      expect(order.total).toBeCloseTo(90.0);
      expect(cart.isEmpty()).toBe(true);
    });

    it('stores the order in the orders list', () => {
      const order = checkout.processOrder(customer);
      expect(checkout.orders).toHaveLength(1);
      expect(checkout.orders[0]).toBe(order);
    });

    it('includes subtotal, discount and total in the order', () => {
      cart.applyDiscount('SAVE10');
      const order = checkout.processOrder(customer);
      expect(order.subtotal).toBeCloseTo(90.0);
      expect(order.discount).toBeCloseTo(9.0);
      expect(order.total).toBeCloseTo(81.0);
    });

    it('throws when the cart is empty', () => {
      const emptyCart = new Cart();
      const emptyCheckout = new Checkout(emptyCart);
      expect(() => emptyCheckout.processOrder(customer)).toThrow(
        'Cannot checkout with an empty cart'
      );
    });

    it('throws when customer name is missing', () => {
      expect(() =>
        checkout.processOrder({ name: '', email: 'alice@example.com' })
      ).toThrow('Customer name and email are required');
    });

    it('throws when customer email is missing', () => {
      expect(() =>
        checkout.processOrder({ name: 'Alice', email: '' })
      ).toThrow('Customer name and email are required');
    });

    it('throws when customerInfo is null', () => {
      expect(() => checkout.processOrder(null)).toThrow(
        'Customer name and email are required'
      );
    });
  });

  describe('getOrderById', () => {
    it('returns the order when found', () => {
      const order = checkout.processOrder(customer);
      expect(checkout.getOrderById(order.id)).toBe(order);
    });

    it('returns null when not found', () => {
      expect(checkout.getOrderById(99999)).toBeNull();
    });
  });

  describe('listOrders', () => {
    it('returns an empty array when there are no orders', () => {
      expect(checkout.listOrders()).toEqual([]);
    });

    it('returns all placed orders', () => {
      checkout.processOrder(customer);
      cart = filledCart();
      checkout.cart = cart;
      checkout.processOrder({ name: 'Bob', email: 'bob@example.com' });
      expect(checkout.listOrders()).toHaveLength(2);
    });
  });

  describe('cancelOrder', () => {
    it('cancels a pending order', () => {
      const order = checkout.processOrder(customer);
      const cancelled = checkout.cancelOrder(order.id);
      expect(cancelled.status).toBe('cancelled');
    });

    it('throws when the order is not found', () => {
      expect(() => checkout.cancelOrder(99999)).toThrow(
        'Order with id "99999" not found'
      );
    });

    it('throws when the order has already been shipped', () => {
      const order = checkout.processOrder(customer);
      order.status = 'shipped';
      expect(() => checkout.cancelOrder(order.id)).toThrow(
        'Cannot cancel an order that has already been shipped'
      );
    });
  });
});
