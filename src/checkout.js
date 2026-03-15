'use strict';

class Checkout {
  constructor(cart) {
    this.cart = cart;
    this.orders = [];
  }

  validateCart() {
    if (this.cart.isEmpty()) {
      throw new Error('Cannot checkout with an empty cart');
    }
    return true;
  }

  processOrder(customerInfo) {
    this.validateCart();
    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      throw new Error('Customer name and email are required');
    }
    const order = {
      id: Date.now(),
      customer: customerInfo,
      items: this.cart.items.map((item) => ({ ...item })),
      subtotal: this.cart.getSubtotal(),
      discount: this.cart.getDiscount(),
      total: this.cart.getTotal(),
      status: 'pending',
      createdAt: new Date(),
    };
    this.orders.push(order);
    this.cart.clear();
    return order;
  }

  getOrderById(orderId) {
    return this.orders.find((order) => order.id === orderId) || null;
  }

  listOrders() {
    return [...this.orders];
  }

  // Generates a plain-text receipt for a completed order.
  // Note: this method is intentionally not covered by tests
  // to demonstrate ~80% coverage in the coverage report.
  generateReceipt(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with id "${orderId}" not found`);
    }
    let receipt = `Receipt — Order #${order.id}\n`;
    receipt += `Customer: ${order.customer.name} <${order.customer.email}>\n`;
    receipt += `\nItems:\n`;
    order.items.forEach((item) => {
      receipt += `  ${item.quantity} x ${item.product.name} @ ${item.product.getFormattedPrice()}\n`;
    });
    receipt += `\nSubtotal: $${order.subtotal.toFixed(2)}\n`;
    if (order.discount > 0) {
      receipt += `Discount: -$${order.discount.toFixed(2)}\n`;
    }
    receipt += `Total:    $${order.total.toFixed(2)}\n`;
    return receipt;
  }

  // Cancels an order if it has not yet been shipped.
  // Note: this method is intentionally not covered by tests
  // to demonstrate ~80% coverage in the coverage report.
  cancelOrder(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with id "${orderId}" not found`);
    }
    if (order.status === 'shipped') {
      throw new Error('Cannot cancel an order that has already been shipped');
    }
    order.status = 'cancelled';
    return order;
  }
}

module.exports = Checkout;
