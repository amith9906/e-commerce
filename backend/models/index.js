'use strict';
const Tenant = require('./Tenant');
const User = require('./User');
const OtpVerification = require('./OtpVerification');
const Product = require('./Product');
const Stock = require('./Stock');
const BackInStockAlert = require('./BackInStockAlert');
const Store = require('./Store');
const StoreStock = require('./StoreStock');
const CartItem = require('./CartItem');
const WishlistItem = require('./WishlistItem');
const InventoryTransfer = require('./InventoryTransfer');
const BillingRecord = require('./BillingRecord');
const StoreRevenueSummary = require('./StoreRevenueSummary');
const SalesPersonPerformanceSummary = require('./SalesPersonPerformanceSummary');
const ContactMessage = require('./ContactMessage');
const ProductReview = require('./ProductReview');
const SalesPersonAssignment = require('./SalesPersonAssignment');
const DeliveryLog = require('./DeliveryLog');
const InvoiceTemplate = require('./InvoiceTemplate');
const OrderInvoice = require('./OrderInvoice');
const CommissionSetting = require('./CommissionSetting');
const PricingRule = require('./PricingRule');
const PickupRequest = require('./PickupRequest');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const ProductView = require('./ProductView');
const ProductQuestion = require('./ProductQuestion');
const ProductPriceHistory = require('./ProductPriceHistory');
const Notification = require('./Notification');
const BrandConfig = require('./BrandConfig');
const UserAddress = require('./UserAddress');
const Coupon = require('./Coupon');
const Promotion = require('./Promotion');
const OrderReturn = require('./OrderReturn');
const Ticket = require('./Ticket');
const TicketMessage = require('./TicketMessage');
const AuditLog = require('./AuditLog');
const Subscription = require('./Subscription');
const TenantUsage = require('./TenantUsage');
const DeliveryRegion = require('./DeliveryRegion');
const DeliveryRestriction = require('./DeliveryRestriction');
const CartRecoveryToken = require('./CartRecoveryToken');
const LoyaltyPoint = require('./LoyaltyPoint');
const GiftCard = require('./GiftCard');
const GiftCardRedemption = require('./GiftCardRedemption');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const POSReceipt = require('./POSReceipt');
const POSReceiptItem = require('./POSReceiptItem');
const TenantWebhook = require('./TenantWebhook');
const WebhookDelivery = require('./WebhookDelivery');
const TenantApiKey = require('./TenantApiKey');
const EmailTemplate = require('./EmailTemplate');
const SSOSetting = require('./SSOSetting');

// Tenant associations
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(CartRecoveryToken, { foreignKey: 'tenant_id', as: 'cartRecoveryTokens' });
CartRecoveryToken.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(GiftCard, { foreignKey: 'tenant_id', as: 'giftCards' });
GiftCard.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// User associations
User.hasMany(OtpVerification, { foreignKey: 'user_id', as: 'otps' });
OtpVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(UserAddress, { foreignKey: 'user_id', as: 'addresses' });
UserAddress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.belongsTo(UserAddress, { foreignKey: 'shipping_address_id', as: 'shippingAddress' });

User.hasMany(ProductView, { foreignKey: 'user_id', as: 'productViews' });
ProductView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(GiftCardRedemption, { foreignKey: 'user_id', as: 'giftCardRedemptions' });
GiftCardRedemption.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Tenant.hasMany(LoyaltyPoint, { foreignKey: 'tenant_id', as: 'loyaltyPoints' });
LoyaltyPoint.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(LoyaltyPoint, { foreignKey: 'user_id', as: 'loyaltyHistory' });
LoyaltyPoint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.hasMany(LoyaltyPoint, { foreignKey: 'order_id', as: 'loyaltyEntries' });
LoyaltyPoint.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

User.hasMany(BackInStockAlert, { foreignKey: 'user_id', as: 'backInStockAlerts' });
BackInStockAlert.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(ProductQuestion, { foreignKey: 'user_id', as: 'productQuestions' });
ProductQuestion.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
ProductQuestion.belongsTo(User, { foreignKey: 'answered_by', as: 'answerAuthor' });

// Store associations
Tenant.hasMany(Store, { foreignKey: 'tenant_id', as: 'stores' });
Store.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(TenantWebhook, { foreignKey: 'tenant_id', as: 'webhooks' });
TenantWebhook.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

TenantWebhook.hasMany(WebhookDelivery, { foreignKey: 'tenant_webhook_id', as: 'deliveries' });
WebhookDelivery.belongsTo(TenantWebhook, { foreignKey: 'tenant_webhook_id', as: 'webhook' });

Tenant.hasMany(TenantApiKey, { foreignKey: 'tenant_id', as: 'apiKeys' });
TenantApiKey.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(Supplier, { foreignKey: 'tenant_id', as: 'suppliers' });
Supplier.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Store.hasMany(StoreStock, { foreignKey: 'store_id', as: 'stock' });
StoreStock.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Tenant.hasMany(PurchaseOrder, { foreignKey: 'tenant_id', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

Store.hasMany(PurchaseOrder, { foreignKey: 'store_id', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id', as: 'purchaseOrderLines' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Tenant.hasMany(POSReceipt, { foreignKey: 'tenant_id', as: 'posReceipts' });
POSReceipt.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Store.hasMany(POSReceipt, { foreignKey: 'store_id', as: 'posReceipts' });
POSReceipt.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

User.hasMany(POSReceipt, { foreignKey: 'salesperson_id', as: 'posReceipts' });
POSReceipt.belongsTo(User, { foreignKey: 'salesperson_id', as: 'salesperson' });

POSReceipt.hasMany(POSReceiptItem, { foreignKey: 'pos_receipt_id', as: 'items' });
POSReceiptItem.belongsTo(POSReceipt, { foreignKey: 'pos_receipt_id', as: 'receipt' });

Product.hasMany(POSReceiptItem, { foreignKey: 'product_id', as: 'posReceiptLines' });
POSReceiptItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Tenant.hasMany(Subscription, { foreignKey: 'tenant_id', as: 'subscriptions' });
Subscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasOne(TenantUsage, { foreignKey: 'tenant_id', as: 'usage' });
TenantUsage.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenantUsage' });

Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenantForLog' });

Tenant.hasMany(EmailTemplate, { foreignKey: 'tenant_id', as: 'emailTemplates' });
EmailTemplate.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(SSOSetting, { foreignKey: 'tenant_id', as: 'ssoSettings' });
SSOSetting.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'userLog' });

Store.hasMany(InventoryTransfer, { foreignKey: 'from_store_id', as: 'dispatches' });
Store.hasMany(InventoryTransfer, { foreignKey: 'to_store_id', as: 'receipts' });
InventoryTransfer.belongsTo(Store, { foreignKey: 'from_store_id', as: 'sourceStore' });
InventoryTransfer.belongsTo(Store, { foreignKey: 'to_store_id', as: 'destinationStore' });

Store.hasMany(BillingRecord, { foreignKey: 'store_id', as: 'billingRecords' });
BillingRecord.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(ContactMessage, { foreignKey: 'tenant_id', as: 'contactMessages' });
ContactMessage.belongsTo(Store, { foreignKey: 'tenant_id', as: 'store' });
Store.hasMany(StoreRevenueSummary, { foreignKey: 'store_id', as: 'revenueSummaries' });
StoreRevenueSummary.belongsTo(Store, { foreignKey: 'store_id', as: 'storeSummary' });

Store.hasMany(SalesPersonAssignment, { foreignKey: 'store_id', as: 'assignments' });
SalesPersonAssignment.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

BillingRecord.belongsTo(InventoryTransfer, { foreignKey: 'transfer_id', as: 'transfer' });
InventoryTransfer.hasOne(BillingRecord, { foreignKey: 'transfer_id', as: 'billing' });

// Product associations
Tenant.hasMany(Product, { foreignKey: 'tenant_id', as: 'products' });
Product.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Product.hasOne(Stock, { foreignKey: 'product_id', as: 'stock' });
Stock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(StoreStock, { foreignKey: 'product_id', as: 'storeStock' });
Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cartItems' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(WishlistItem, { foreignKey: 'product_id', as: 'wishlistItems' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PickupRequest, { foreignKey: 'product_id', as: 'pickupRequests' });
PickupRequest.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StoreStock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductReview, { foreignKey: 'product_id', as: 'reviews' });
ProductReview.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(BackInStockAlert, { foreignKey: 'product_id', as: 'stockAlerts' });
BackInStockAlert.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

ProductReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ProductReview, { foreignKey: 'user_id', as: 'reviews' });
User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(CartRecoveryToken, { foreignKey: 'user_id', as: 'cartRecoveryTokens' });
CartRecoveryToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(WishlistItem, { foreignKey: 'user_id', as: 'wishlistItems' });
WishlistItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SalesPersonPerformanceSummary, { foreignKey: 'sales_person_id', as: 'performanceSummaries' });
SalesPersonPerformanceSummary.belongsTo(User, { foreignKey: 'sales_person_id', as: 'salesPerson' });

Product.hasMany(InventoryTransfer, { foreignKey: 'product_id', as: 'transfers' });
InventoryTransfer.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
InventoryTransfer.hasMany(DeliveryLog, { foreignKey: 'transfer_id', as: 'deliveryLogs' });
DeliveryLog.belongsTo(InventoryTransfer, { foreignKey: 'transfer_id', as: 'transfer' });

User.hasMany(DeliveryLog, { foreignKey: 'sales_person_id', as: 'deliveryLogs' });
DeliveryLog.belongsTo(User, { foreignKey: 'sales_person_id', as: 'salesPerson' });

User.hasMany(SalesPersonAssignment, { foreignKey: 'user_id', as: 'salesAssignments' });
SalesPersonAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'salesPerson' });

User.hasMany(InventoryTransfer, { foreignKey: 'sales_person_id', as: 'salesTransfers' });
InventoryTransfer.belongsTo(User, { foreignKey: 'sales_person_id', as: 'salesPerson' });

Product.hasMany(ProductView, { foreignKey: 'product_id', as: 'views' });
ProductView.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ProductQuestion, { foreignKey: 'product_id', as: 'questions' });
ProductQuestion.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order associations
Tenant.hasMany(Order, { foreignKey: 'tenant_id', as: 'orders' });
Order.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

GiftCard.hasMany(GiftCardRedemption, { foreignKey: 'gift_card_id', as: 'redemptions' });
GiftCardRedemption.belongsTo(GiftCard, { foreignKey: 'gift_card_id', as: 'giftCard' });

Order.hasMany(GiftCardRedemption, { foreignKey: 'order_id', as: 'giftCardRedemptions' });
GiftCardRedemption.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Coupon.hasMany(Order, { foreignKey: 'coupon_id', as: 'orders' });
Order.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

Tenant.hasMany(Coupon, { foreignKey: 'tenant_id', as: 'coupons' });
Coupon.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(Promotion, { foreignKey: 'tenant_id', as: 'promotions' });
Promotion.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(OrderReturn, { foreignKey: 'tenantId' });
OrderReturn.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(DeliveryRegion, { foreignKey: 'tenant_id', as: 'deliveryRegions' });
DeliveryRegion.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

DeliveryRegion.hasMany(DeliveryRestriction, { foreignKey: 'region_id', as: 'restrictions' });
DeliveryRestriction.belongsTo(DeliveryRegion, { foreignKey: 'region_id', as: 'region' });

DeliveryRestriction.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(DeliveryRestriction, { foreignKey: 'product_id', as: 'deliveryRestrictions' });

Order.belongsTo(DeliveryRegion, { foreignKey: 'delivery_region_id', as: 'deliveryRegion' });
DeliveryRegion.hasMany(Order, { foreignKey: 'delivery_region_id', as: 'orders' });

Tenant.hasMany(Ticket, { foreignKey: 'tenant_id', as: 'tickets' });
Ticket.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(Ticket, { foreignKey: 'user_id', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Ticket.hasMany(TicketMessage, { foreignKey: 'ticket_id', as: 'messages' });
TicketMessage.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

User.hasMany(TicketMessage, { foreignKey: 'sender_id', as: 'ticketMessages' });
TicketMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

TicketMessage.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Order.hasMany(OrderReturn, { foreignKey: 'orderId', as: 'returns' });
OrderReturn.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = {
  Tenant, User, OtpVerification, Product, Stock, BackInStockAlert, Store,
  StoreStock, InventoryTransfer, BillingRecord, SalesPersonAssignment,
  DeliveryLog, ContactMessage, ProductReview,
  Order, OrderItem, Payment, ProductView, ProductQuestion, Notification, BrandConfig, UserAddress,
  Coupon, Promotion, OrderReturn, InvoiceTemplate, OrderInvoice,
  CommissionSetting, PricingRule, PickupRequest, StoreRevenueSummary, SalesPersonPerformanceSummary,
  CartItem, CartRecoveryToken, WishlistItem, Subscription, TenantUsage, AuditLog, Ticket, TicketMessage,
  DeliveryRegion, DeliveryRestriction, GiftCard, GiftCardRedemption, LoyaltyPoint,
  Supplier, PurchaseOrder, PurchaseOrderItem, POSReceipt, POSReceiptItem,
  TenantWebhook, WebhookDelivery, TenantApiKey, EmailTemplate, SSOSetting, ProductPriceHistory
};
Order.hasOne(OrderInvoice, { foreignKey: 'order_id', as: 'invoice' });
OrderInvoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Tenant.hasMany(InvoiceTemplate, { foreignKey: 'tenant_id', as: 'invoiceTemplates' });
InvoiceTemplate.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

InvoiceTemplate.hasMany(OrderInvoice, { foreignKey: 'template_id', as: 'orderInvoices' });
OrderInvoice.belongsTo(InvoiceTemplate, { foreignKey: 'template_id', as: 'template' });
User.hasMany(CommissionSetting, { foreignKey: 'sales_person_id', as: 'commissionSettings' });
CommissionSetting.belongsTo(User, { foreignKey: 'sales_person_id', as: 'salesPerson' });
Product.hasMany(PricingRule, { foreignKey: 'product_id', as: 'pricingRules' });
PricingRule.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductPriceHistory, { foreignKey: 'product_id', as: 'priceHistories' });
ProductPriceHistory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Store.hasMany(PricingRule, { foreignKey: 'store_id', as: 'pricingRules' });
PricingRule.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(PickupRequest, { foreignKey: 'store_id', as: 'pickupRequests' });
PickupRequest.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

User.hasMany(PickupRequest, { foreignKey: 'user_id', as: 'pickupRequests' });
PickupRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });




