'use strict';

const Product = require('../src/product');

describe('Product', () => {
  describe('constructor', () => {
    it('creates a product with all fields', () => {
      const p = new Product('p1', 'Apple', 1.5, 'fruit');
      expect(p.id).toBe('p1');
      expect(p.name).toBe('Apple');
      expect(p.price).toBe(1.5);
      expect(p.category).toBe('fruit');
    });

    it('uses "general" as default category', () => {
      const p = new Product('p2', 'Widget', 9.99);
      expect(p.category).toBe('general');
    });

    it('allows a price of zero', () => {
      const p = new Product('p3', 'Free Sample', 0);
      expect(p.price).toBe(0);
    });

    it('throws when id is missing', () => {
      expect(() => new Product('', 'Item', 5)).toThrow(
        'Product must have an id and a name'
      );
    });

    it('throws when name is missing', () => {
      expect(() => new Product('p4', '', 5)).toThrow(
        'Product must have an id and a name'
      );
    });

    it('throws when price is negative', () => {
      expect(() => new Product('p5', 'Item', -1)).toThrow(
        'Price must be a non-negative number'
      );
    });

    it('throws when price is not a number', () => {
      expect(() => new Product('p6', 'Item', 'free')).toThrow(
        'Price must be a non-negative number'
      );
    });
  });

  describe('getFormattedPrice', () => {
    it('formats price with two decimal places', () => {
      const p = new Product('p7', 'Gadget', 4.5);
      expect(p.getFormattedPrice()).toBe('$4.50');
    });

    it('formats a whole-number price', () => {
      const p = new Product('p8', 'Book', 10);
      expect(p.getFormattedPrice()).toBe('$10.00');
    });
  });

  describe('toString', () => {
    it('returns name and formatted price', () => {
      const p = new Product('p9', 'Mug', 7.99);
      expect(p.toString()).toBe('Mug ($7.99)');
    });
  });
});
