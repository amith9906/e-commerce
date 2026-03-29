'use strict';
const Tenant = require('./Tenant');
const User = require('./User');
const OtpVerification = require('./OtpVerification');
const Product = require('./Product');
const Stock = require('./Stock');
const Store = require('./Store');
const StoreStock = require('./StoreStock');
const InventoryTransfer = require('./InventoryTransfer');
const BillingRecord = require('./BillingRecord');
const SalesPersonAssignment = require('./SalesPersonAssignment');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const ProductView = require('./ProductView');
const Notification = require('./Notification');
const BrandConfig = require('./BrandConfig');
const UserAddress = require('./UserAddress');
const Coupon = require('./Coupon');
const Promotion = require('./Promotion');
const OrderReturn = require('./OrderReturn');

// Tenant associations
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

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

// Store associations
Tenant.hasMany(Store, { foreignKey: 'tenant_id', as: 'stores' });
Store.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Store.hasMany(StoreStock, { foreignKey: 'store_id', as: 'stock' });
StoreStock.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(InventoryTransfer, { foreignKey: 'from_store_id', as: 'dispatches' });
Store.hasMany(InventoryTransfer, { foreignKey: 'to_store_id', as: 'receipts' });
InventoryTransfer.belongsTo(Store, { foreignKey: 'from_store_id', as: 'sourceStore' });
InventoryTransfer.belongsTo(Store, { foreignKey: 'to_store_id', as: 'destinationStore' });

Store.hasMany(BillingRecord, { foreignKey: 'store_id', as: 'billingRecords' });
BillingRecord.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(SalesPersonAssignment, { foreignKey: 'store_id', as: 'assignments' });
SalesPersonAssignment.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// Product associations
Tenant.hasMany(Product, { foreignKey: 'tenant_id', as: 'products' });
Product.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Product.hasOne(Stock, { foreignKey: 'product_id', as: 'stock' });
Stock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(StoreStock, { foreignKey: 'product_id', as: 'storeStock' });
StoreStock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(InventoryTransfer, { foreignKey: 'product_id', as: 'transfers' });
InventoryTransfer.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(SalesPersonAssignment, { foreignKey: 'user_id', as: 'salesAssignments' });
SalesPersonAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'salesPerson' });

User.hasMany(InventoryTransfer, { foreignKey: 'sales_person_id', as: 'salesTransfers' });
InventoryTransfer.belongsTo(User, { foreignKey: 'sales_person_id', as: 'salesPerson' });

Product.hasMany(ProductView, { foreignKey: 'product_id', as: 'views' });
ProductView.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order associations
Tenant.hasMany(Order, { foreignKey: 'tenant_id', as: 'orders' });
Order.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Coupon.hasMany(Order, { foreignKey: 'coupon_id', as: 'orders' });
Order.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

Tenant.hasMany(Coupon, { foreignKey: 'tenant_id', as: 'coupons' });
Coupon.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(Promotion, { foreignKey: 'tenant_id', as: 'promotions' });
Promotion.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(OrderReturn, { foreignKey: 'tenantId' });
OrderReturn.belongsTo(Tenant, { foreignKey: 'tenantId' });

Order.hasMany(OrderReturn, { foreignKey: 'orderId', as: 'returns' });
OrderReturn.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = {
  Tenant, User, OtpVerification, Product, Stock, Store,
  StoreStock, InventoryTransfer, BillingRecord, SalesPersonAssignment,
  Order, OrderItem, Payment, ProductView, Notification, BrandConfig, UserAddress,
  Coupon, Promotion, OrderReturn
};
