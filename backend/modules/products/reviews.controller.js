'use strict';
const { ProductReview, Product, OrderItem, Order } = require('../../models');

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProductReview.findAndCountAll({
      where: { productId, tenantId: req.tenant.id },
      include: [{ association: 'user', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data: rows, pagination: { total: count, page, pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

const submitReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed
    const existing = await ProductReview.findOne({ where: { productId, userId, tenantId: req.tenant.id } });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });

    // Check if verified purchase (optional but good)
    const order = await Order.findOne({
      where: { userId, tenantId: req.tenant.id, status: 'delivered' },
      include: [{ model: OrderItem, as: 'items', where: { productId } }]
    });

    const review = await ProductReview.create({
      tenantId: req.tenant.id,
      productId,
      userId,
      rating,
      comment,
      isVerifiedPurchase: !!order,
      createdBy: userId
    });

    // Update Product average rating
    const product = await Product.findByPk(productId);
    if (product) {
      const allReviews = await ProductReview.findAll({ where: { productId } });
      const totalRating = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = totalRating / allReviews.length;
      
      await product.update({ 
        ratingAvg: avg, 
        ratingCount: allReviews.length 
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

module.exports = { getProductReviews, submitReview };
