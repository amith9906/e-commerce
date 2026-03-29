const { Product, Stock, ProductView } = require('../../models');
const { uploadToS3 } = require('../../utils/s3Upload');

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { category, search, q, brand, color, size, sort, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    const where = { tenantId: req.tenant.id, isActive: true };
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (color) where.color = color;
    if (size) where.size = size;
    
    const searchTerm = search || q;
    if (searchTerm) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } },
        { brand: { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'name_asc') order = [['name', 'ASC']];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Stock, as: 'stock', attributes: ['quantity', 'lowStockThreshold'] }],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) }
    });
  } catch (err) { next(err); }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id, isActive: true },
      include: [{ model: Stock, as: 'stock', attributes: ['quantity', 'lowStockThreshold'] }],
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Track analytics view (fire & forget, don't await) if not admin
    if (req.user && req.user.role === 'customer') {
      ProductView.create({
        tenantId: req.tenant.id,
        productId: product.id,
        userId: req.user.id,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }).catch(err => console.error('Failed to log product view:', err));
    }

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// POST /api/products (Admin)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, brand, color, size, sku, stockQuantity, lowStockThreshold } = req.body;
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      // Upload all files to S3 concurrently
      imageUrls = await Promise.all(
        req.files.map(file => uploadToS3(file.buffer, file.mimetype, 'products'))
      );
    }

    // Wrap in transaction so stock and product are created together
    const sequelize = require('../../config/database');
    const result = await sequelize.transaction(async (t) => {
      const product = await Product.create({
        tenantId: req.tenant.id,
        name, description, price, category, brand, color, size, sku, 
        images: imageUrls,
        specifications: typeof req.body.specifications === 'string' ? JSON.parse(req.body.specifications) : req.body.specifications,
        highlights: typeof req.body.highlights === 'string' ? JSON.parse(req.body.highlights) : req.body.highlights,
        createdBy: req.user.id, updatedBy: req.user.id
      }, { transaction: t });

      await Stock.create({
        tenantId: req.tenant.id,
        productId: product.id,
        quantity: stockQuantity || 0,
        lowStockThreshold: lowStockThreshold || 5,
        createdBy: req.user.id, updatedBy: req.user.id
      }, { transaction: t });

      return product;
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// PUT /api/products/:id (Admin)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updates = { ...req.body, updatedBy: req.user.id };
    
    if (req.files && req.files.length > 0) {
      // If new images uploaded, we replace the old ones for simplicity
      const imageUrls = await Promise.all(
        req.files.map(file => uploadToS3(file.buffer, file.mimetype, 'products'))
      );
      updates.images = [...(product.images || []), ...imageUrls];
    }

    await product.update(updates);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// DELETE /api/products/:id (Admin - Soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    await product.update({ isActive: false, updatedBy: req.user.id });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) { next(err); }
};

// POST /api/products/:id/stock/adjust (Admin)
const adjustStock = async (req, res, next) => {
  // ... existing code ...
};

const getFilterOptions = async (req, res, next) => {
  try {
    const { Sequelize } = require('sequelize');
    const tenantId = req.tenant.id;

    const [categories, brands, colors, sizes] = await Promise.all([
      Product.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
        where: { tenantId, isActive: true, category: { [Sequelize.Op.ne]: null } },
        raw: true
      }),
      Product.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('brand')), 'brand']],
        where: { tenantId, isActive: true, brand: { [Sequelize.Op.ne]: null } },
        raw: true
      }),
      Product.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('color')), 'color']],
        where: { tenantId, isActive: true, color: { [Sequelize.Op.ne]: null } },
        raw: true
      }),
      Product.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('size')), 'size']],
        where: { tenantId, isActive: true, size: { [Sequelize.Op.ne]: null } },
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.category).filter(Boolean),
        brands: brands.map(b => b.brand).filter(Boolean),
        colors: colors.map(c => c.color).filter(Boolean),
        sizes: sizes.map(s => s.size).filter(Boolean)
      }
    });
  } catch (err) { next(err); }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, adjustStock, getFilterOptions };
