'use strict';
const { ProductReview, Product, OrderItem, Order } = require('../../models');
const { uploadToS3 } = require('../../utils/s3Upload');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit, offset } = parsePaginationParams(req.query);

    const { count, rows } = await ProductReview.findAndCountAll({
      where: { productId, tenantId: req.tenant.id },
      include: [{ association: 'user', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Mask names for privacy (e.g., "John Doe" -> "John D.")
    const maskedRows = rows.map(review => {
      const r = review.toJSON();
      if (r.user && r.user.name) {
        const parts = r.user.name.split(' ');
        r.user.name = parts.length > 1 
          ? `${parts[0]} ${parts[1].charAt(0)}.` 
          : r.user.name;
      }
      return r;
    });

    res.json({ success: true, data: maskedRows, pagination: buildPaginationMeta(count, { page, limit }) });
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

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map(file => uploadToS3(file.buffer, file.mimetype, 'reviews'))
      );
    }

    const review = await ProductReview.create({
      tenantId: req.tenant.id,
      productId,
      userId,
      rating,
      comment,
      isVerifiedPurchase: !!order,
      images: uploadedImages,
      createdBy: userId
    });

    // Update Product average rating
    const product = await Product.findByPk(productId);
    if (product) {
      const allReviews = await ProductReview.findAll({ 
        where: { productId, tenantId: req.tenant.id } 
      });
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
