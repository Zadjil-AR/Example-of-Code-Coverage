'use strict';

class Product {
  constructor(id, name, price, category) {
    if (!id || !name) {
      throw new Error('Product must have an id and a name');
    }
    if (typeof price !== 'number' || price < 0) {
      throw new Error('Price must be a non-negative number');
    }
    this.id = id;
    this.name = name;
    this.price = price;
    this.category = category || 'general';
  }

  getFormattedPrice() {
    return `$${this.price.toFixed(2)}`;
  }

  toString() {
    return `${this.name} (${this.getFormattedPrice()})`;
  }
}

module.exports = Product;
