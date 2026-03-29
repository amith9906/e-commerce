'use strict';

/**
 * Interface for Payment Gateway Drivers
 */
class PaymentGatewayDriver {
  async createIntent(payment, tenantSettings) { throw new Error('Not implemented'); }
  async processRefund(payment, tenantSettings) { throw new Error('Not implemented'); }
  async verifyWebhook(payload, signature, tenantSettings) { throw new Error('Not implemented'); }
}

/**
 * Mock Driver for testing and development
 */
class MockDriver extends PaymentGatewayDriver {
  async createIntent(payment) {
    return {
      success: true,
      mode: 'mock',
      paymentId: payment.id,
      clientSecret: `mock_secret_${payment.id}`,
      instructions: 'Click "Simulate Success" in the checkout UI.'
    };
  }

  async processRefund(payment) {
    return { success: true, refundId: `mock_ref_${Date.now()}` };
  }
}

/**
 * Stripe Driver Stub
 */
class StripeDriver extends PaymentGatewayDriver {
  async createIntent(payment, settings) {
    // In production, you would use: const stripe = require('stripe')(settings.stripeSecretKey);
    return {
      success: true,
      mode: 'stripe',
      clientSecret: `pi_fake_secret_${payment.id}`, // Would be real Stripe Client Secret
      publishableKey: settings.stripePublishableKey
    };
  }
}

/**
 * Dynamic QR (UPI) Driver Stub
 */
class DynamicQRDriver extends PaymentGatewayDriver {
  async createIntent(payment, settings) {
    // In production, would call Razorpay/PhonePe API to get a QR string
    const qrString = `upi://pay?pa=${settings.vpa || 'merchant@upi'}&pn=${settings.merchantName}&am=${payment.amount}&tr=${payment.id}`;
    return {
      success: true,
      mode: 'qr',
      qrString,
      instructions: 'Scan this QR code using any UPI app to pay.'
    };
  }
}

class PaymentGatewayFactory {
  static getDriver(tenantSettings = {}) {
    const gateway = tenantSettings.paymentGateway || 'mock';

    switch (gateway) {
      case 'stripe':
        return new StripeDriver();
      case 'qr':
        return new DynamicQRDriver();
      case 'mock':
      default:
        return new MockDriver();
    }
  }
}

module.exports = PaymentGatewayFactory;
