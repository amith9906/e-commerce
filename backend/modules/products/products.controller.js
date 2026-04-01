const slugify = require('slugify');
const { Product, Stock, ProductView, ProductQuestion, Notification, Order, OrderItem, ProductPriceHistory } = require('../../models');
const { uploadToS3 } = require('../../utils/s3Upload');
const sequelize = require('../../config/database');
const { parse } = require('csv-parse/sync');
const { Op, QueryTypes, Sequelize } = require('sequelize');
const { emitNotificationEvent } = require('../../utils/notificationEmitter');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const CSV_EXPORT_HEADERS = [
  'SKU',
  'Name',
  'Description',
  'Category',
  'Brand',
  'Color',
  'Size',
  'Price',
  'SalePrice',
  'OfferLabel',
  'OfferExpiresAt',
  'IsBestSeller',
  'StockQuantity',
  'LowStockThreshold',
  'Images',
  'AvailableSizes',
  'AvailableColors',
  'Highlights',
  'Specifications',
  'IsActive'
];

const normalizeCsvRow = (row = {}) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    if (!key) return;
    const normalizedKey = key.toString().trim().toLowerCase().replace(/[\s_]+/g, '');
    normalized[normalizedKey] = value;
  });
  return normalized;
};

const parseListField = (raw = '') => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(String).map((item) => item.trim()).filter(Boolean);
  }
  return raw
    .toString()
    .split(/[;,|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseSpecificationsField = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  const trimmed = raw.toString().trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const result = {};
    trimmed.split(/[;,]+/).forEach((segment) => {
      const [key, ...rest] = segment.split(':');
      if (!key) return;
      result[key.trim()] = rest.join(':').trim();
    });
    return result;
  }
};

const parseSpecificationsInput = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  return parseSpecificationsField(value);
};

const normalizeDecimalField = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const cleaned = value.toString().replace(/[^0-9.-]+/g, '');
  if (!cleaned) return fallback;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeIntegerField = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : Math.trunc(parsed);
};

const parseBooleanField = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = value.toString().trim().toLowerCase();
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  return fallback;
};

const parseDateField = (value) => {
  if (!value) return null;
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return null;
  return dateValue;
};

const logPriceSnapshot = async ({ product, tenantId, userId, transaction = null }) => {
  if (!product) return;
  await ProductPriceHistory.create({
    tenantId,
    productId: product.id,
    price: Number(product.price) || 0,
    salePrice: product.salePrice ?? null,
    offerLabel: product.offerLabel ?? null,
    effectiveAt: new Date(),
    createdBy: userId,
    updatedBy: userId
  }, { transaction });
};

const joinListField = (items) => {
  if (!Array.isArray(items)) return '';
  return items.filter(Boolean).join(';');
};

const buildProductSlug = (rawSlug, name) => {
  const source = String(rawSlug || name || '').trim();
  if (!source) return null;
  return slugify(source, { lower: true, strict: true });
};

const escapeCsvValue = (value) => {
  if (value === undefined || value === null) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : value.toString();
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { category, search, q, brand, color, size, sort, status, minRating, minPrice, maxPrice } = req.query;
    const pagination = parsePaginationParams(req.query);
    const { limit, offset, page } = pagination;
    const where = { tenantId: req.tenant.id, isActive: true };
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (typeof status === 'string') {
      if (status === 'active') where.isActive = true;
      else if (status === 'inactive') where.isActive = false;
    }
    if (color) where.color = color;
    if (size) where.size = size;
    if (minRating) {
      const ratingNum = parseFloat(minRating);
      if (!isNaN(ratingNum) && ratingNum > 0) {
        where.ratingAvg = { [Op.gte]: ratingNum };
      }
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) { const n = parseFloat(minPrice); if (!isNaN(n)) where.price[Op.gte] = n; }
      if (maxPrice) { const n = parseFloat(maxPrice); if (!isNaN(n)) where.price[Op.lte] = n; }
    }

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
    else if (sort === 'rating_desc') order = [['rating_avg', 'DESC']];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Stock, as: 'stock', attributes: ['quantity', 'lowStockThreshold'] }],
      order,
      limit,
      offset,
    });

    if (rows.length) {
      const historyMin = await ProductPriceHistory.findAll({
        where: {
          tenantId: req.tenant.id,
          productId: rows.map((product) => product.id)
        },
        attributes: [
          'productId',
          [Sequelize.fn('MIN', Sequelize.col('sale_price')), 'lowestSalePrice']
        ],
        group: ['productId'],
        raw: true
      });
      const lowestMap = new Map();
      historyMin.forEach((entry) => {
        const parsed = entry.lowestSalePrice !== null ? Number(entry.lowestSalePrice) : null;
        lowestMap.set(entry.productId, parsed);
      });
      rows.forEach((product) => {
        product.setDataValue('lowestSalePriceEver', lowestMap.get(product.id) ?? null);
      });
    }

    res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(count, { page, limit })
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

const getProductPriceHistory = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const history = await ProductPriceHistory.findAll({
      where: {
        tenantId: req.tenant.id,
        productId
      },
      order: [['effective_at', 'DESC']],
      limit: 20,
      raw: true
    });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const listProductQuestions = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const where = {
      tenantId: req.tenant.id,
      productId
    };
    if (!req.user || req.user.role !== 'admin') {
      where.status = 'published';
    }
    const questions = await ProductQuestion.findAll({
      where,
      include: [
        { association: 'author', attributes: ['id', 'name'] },
        { association: 'answerAuthor', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 12
    });
    res.json({ success: true, data: questions });
  } catch (err) {
    next(err);
  }
};

const createProductQuestion = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question text is required.' });
    }
    const product = await Product.findOne({ where: { id: productId, tenantId: req.tenant.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const createdQuestion = await ProductQuestion.create({
      tenantId: req.tenant.id,
      productId,
      userId: req.user.id,
      question: question.trim(),
      status: 'pending',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    const notification = await Notification.create({
      tenantId: req.tenant.id,
      userId: null,
      title: 'New product question',
      message: `${req.user.name || req.user.email || 'A customer'} asked about ${product.name}.`,
      type: 'info',
      referenceId: product.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    emitNotificationEvent(notification.toJSON ? notification.toJSON() : notification);

    res.status(201).json({ success: true, message: 'Question submitted; we will notify you once answered.' });
  } catch (err) {
    next(err);
  }
};

const updateProductQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { answer, status } = req.body;
    const allowedStatuses = new Set(['pending', 'published', 'hidden']);
    if (status && !allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const question = await ProductQuestion.findOne({
      where: { id: questionId, tenantId: req.tenant.id },
      include: [
        { association: 'author', attributes: ['id', 'name', 'email'] },
        { association: 'product', attributes: ['id', 'name'] }
      ]
    });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });

    await question.update({
      answer: answer ?? question.answer,
      status: status || question.status,
      answeredBy: req.user.id,
      updatedBy: req.user.id
    });

    if (question.userId) {
      const msg = answer
        ? `Your question about ${question.product?.name || 'this product'} has been answered.`
        : `Your question about ${question.product?.name || 'this product'} has been updated.`;
      const userNotification = await Notification.create({
        tenantId: req.tenant.id,
        userId: question.userId,
        title: 'Product question update',
        message: msg,
        type: 'info',
        referenceId: question.productId,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      emitNotificationEvent(userNotification.toJSON ? userNotification.toJSON() : userNotification);
    }

    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const getRecentlyViewed = async (req, res, next) => {
  try {
    if (!req.user) return res.json({ success: true, data: [] });
    const views = await ProductView.findAll({
      where: { tenantId: req.tenant.id, userId: req.user.id },
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images', 'category'] }],
      order: [['created_at', 'DESC']],
      limit: 40, // over-fetch to allow deduplication
    });
    // Deduplicate — keep only the most recent view per product
    const seen = new Set();
    const products = [];
    for (const view of views) {
      if (!view.product) continue;
      if (seen.has(view.product.id)) continue;
      seen.add(view.product.id);
      products.push(view.product);
      if (products.length >= 8) break;
    }
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

const getSocialProof = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const viewCount = await ProductView.count({
      where: {
        tenantId: req.tenant.id,
        productId,
        created_at: { [Op.gte]: windowStart }
      }
    });
    res.json({ success: true, data: { viewCount, windowMinutes: 120 } });
  } catch (err) {
    next(err);
  }
};

const getProductSummary = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const product = await Product.findOne({
      where: { id: productId, tenantId: req.tenant.id },
      include: [{ model: Stock, as: 'stock', attributes: ['quantity'] }]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const soldRow = await OrderItem.findOne({
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quantity')), 0), 'totalSold']],
      where: { productId },
      include: [{
        model: Order,
        as: 'order',
        attributes: [],
        where: {
          tenantId: req.tenant.id,
          status: { [Op.ne]: 'cancelled' }
        }
      }],
      raw: true
    });

    res.json({
      success: true,
      data: {
        stock: product.stock?.quantity ?? 0,
        soldCount: Number(soldRow?.totalSold || 0),
        ratingCount: Number(product.ratingCount || 0),
        ratingAvg: Number(product.ratingAvg || 0)
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/products (Admin)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, brand, color, size, sku, stockQuantity, lowStockThreshold, slug, salePrice, offerLabel, offerExpiresAt, isBestSeller } = req.body;
    let imageUrls = [];
    const parsedSalePrice = normalizeDecimalField(salePrice, null);
    const normalizedPrice = normalizeDecimalField(price, null);
    if (normalizedPrice === null || normalizedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
    }
    if (parsedSalePrice !== null && parsedSalePrice >= normalizedPrice) {
      return res.status(400).json({ success: false, message: 'Sale price must be lower than the base price.' });
    }
    const parsedOfferExpiresAt = parseDateField(offerExpiresAt);
    const cleanedOfferLabel = offerLabel ? String(offerLabel).trim() : null;

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
        name,
        description,
        price: normalizedPrice,
        category,
        brand,
        color,
        size,
        sku,
        slug: buildProductSlug(slug, name),
        images: imageUrls,
        specifications: typeof req.body.specifications === 'string' ? JSON.parse(req.body.specifications) : req.body.specifications,
        highlights: typeof req.body.highlights === 'string' ? JSON.parse(req.body.highlights) : req.body.highlights,
        salePrice: parsedSalePrice,
        offerLabel: cleanedOfferLabel,
        offerExpiresAt: parsedOfferExpiresAt,
        isBestSeller: parseBooleanField(isBestSeller, false),
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      await Stock.create({
        tenantId: req.tenant.id,
        productId: product.id,
        quantity: stockQuantity || 0,
        lowStockThreshold: lowStockThreshold || 5,
        createdBy: req.user.id, updatedBy: req.user.id
      }, { transaction: t });

      await logPriceSnapshot({ product, tenantId: req.tenant.id, userId: req.user.id }, t);

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

    const slugFromBody = buildProductSlug(req.body.slug, req.body.name || product.name);
    const priceProvided = Object.prototype.hasOwnProperty.call(req.body, 'price');
    const normalizedPriceValue = priceProvided ? normalizeDecimalField(req.body.price, null) : null;
    if (priceProvided && (normalizedPriceValue === null || normalizedPriceValue <= 0)) {
      return res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
    }
    const salePriceProvided = Object.prototype.hasOwnProperty.call(req.body, 'salePrice');
    const parsedSalePrice = salePriceProvided ? normalizeDecimalField(req.body.salePrice, null) : null;
    const offerLabelProvided = Object.prototype.hasOwnProperty.call(req.body, 'offerLabel');
    const offerExpiresProvided = Object.prototype.hasOwnProperty.call(req.body, 'offerExpiresAt');
    const parsedOfferExpiresAt = offerExpiresProvided ? parseDateField(req.body.offerExpiresAt) : null;
    const basePriceForComparison = priceProvided ? normalizedPriceValue : Number(product.price);
    if (salePriceProvided && parsedSalePrice !== null && basePriceForComparison !== null && parsedSalePrice >= basePriceForComparison) {
      return res.status(400).json({ success: false, message: 'Sale price must be lower than the base price.' });
    }

    const bestSellerProvided = Object.prototype.hasOwnProperty.call(req.body, 'isBestSeller');
    const parsedBestSeller = bestSellerProvided ? parseBooleanField(req.body.isBestSeller, false) : null;
    const updates = {
      ...req.body,
      updatedBy: req.user.id,
      slug: slugFromBody || product.slug
    };
    if (req.body.availableSizes !== undefined) {
      updates.availableSizes = parseListField(req.body.availableSizes);
    }
    if (req.body.availableColors !== undefined) {
      updates.availableColors = parseListField(req.body.availableColors);
    }
    if (req.body.highlights !== undefined) {
      updates.highlights = parseListField(req.body.highlights);
    }
    if (req.body.specifications !== undefined) {
      updates.specifications = parseSpecificationsInput(req.body.specifications);
    }
    if (priceProvided) updates.price = normalizedPriceValue;
    else delete updates.price;
    if (salePriceProvided) updates.salePrice = parsedSalePrice;
    else delete updates.salePrice;
    if (offerLabelProvided) updates.offerLabel = req.body.offerLabel ? String(req.body.offerLabel).trim() : null;
    else delete updates.offerLabel;
    if (offerExpiresProvided) updates.offerExpiresAt = parsedOfferExpiresAt;
    else delete updates.offerExpiresAt;
    if (bestSellerProvided) updates.isBestSeller = parsedBestSeller;
    else delete updates.isBestSeller;

    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadToS3(file.buffer, file.mimetype, 'products'))
      );
      updates.images = [...(product.images || []), ...imageUrls];
    }

    await product.update(updates);
    if (priceProvided || salePriceProvided || offerLabelProvided || offerExpiresProvided) {
      await logPriceSnapshot({ product, tenantId: req.tenant.id, userId: req.user.id });
    }
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

const getAutocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const products = await Product.findAll({
      where: {
        tenantId: req.tenant.id,
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { brand: { [Op.iLike]: `%${q}%` } },
          { sku: { [Op.iLike]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'name', 'price', 'images', 'category'],
      limit: 8,
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const tenantId = req.tenant.id;

    const rows = await sequelize.query(`
      SELECT other.product_id AS productId, COUNT(*) AS weight
      FROM order_items AS main
      JOIN order_items AS other ON other.order_id = main.order_id AND other.product_id != main.product_id
      JOIN orders ON orders.id = main.order_id
      WHERE main.product_id = :productId AND orders.tenant_id = :tenantId
      GROUP BY other.product_id
      ORDER BY weight DESC
      LIMIT 6
    `, {
      replacements: { productId, tenantId },
      type: QueryTypes.SELECT,
    });

    const recommendedIds = rows.map(r => r.productId);
    if (recommendedIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.findAll({
      where: {
        id: recommendedIds,
        tenantId,
        isActive: true,
      },
      include: [{ model: Stock, as: 'stock', attributes: ['quantity'] }],
    });

    const ordered = recommendedIds
      .map(id => products.find((p) => p.id === id))
      .filter(Boolean);

    res.json({ success: true, data: ordered });
  } catch (err) {
    next(err);
  }
};

const getFilterOptions = async (req, res, next) => {
  try {
    const { Sequelize } = require('sequelize');
    const tenantId = req.tenant.id;

    const [categories, brands, colors, sizes, priceRange] = await Promise.all([
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
      }),
      Product.findOne({
        attributes: [
          [Sequelize.fn('MIN', Sequelize.col('price')), 'minPrice'],
          [Sequelize.fn('MAX', Sequelize.col('price')), 'maxPrice'],
        ],
        where: { tenantId, isActive: true },
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.category).filter(Boolean),
        brands: brands.map(b => b.brand).filter(Boolean),
        colors: colors.map(c => c.color).filter(Boolean),
        sizes: sizes.map(s => s.size).filter(Boolean),
        priceRange: {
          min: Math.floor(Number(priceRange?.minPrice || 0)),
          max: Math.ceil(Number(priceRange?.maxPrice || 0)),
        }
      }
    });
  } catch (err) { next(err); }
};

const exportProductsCsv = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { tenantId: req.tenant.id },
      include: [{ model: Stock, as: 'stock', attributes: ['quantity', 'lowStockThreshold'] }],
      order: [['created_at', 'DESC']]
    });

    const rows = products.map((product) => {
      const stock = product.stock || {};
      return [
        escapeCsvValue(product.sku),
        escapeCsvValue(product.name),
        escapeCsvValue(product.description),
        escapeCsvValue(product.category),
        escapeCsvValue(product.brand),
        escapeCsvValue(product.color),
        escapeCsvValue(product.size),
        escapeCsvValue(product.price),
        escapeCsvValue(product.salePrice),
        escapeCsvValue(product.offerLabel),
        escapeCsvValue(product.offerExpiresAt ? product.offerExpiresAt.toISOString() : ''),
        escapeCsvValue(product.isBestSeller),
        escapeCsvValue(stock.quantity ?? 0),
        escapeCsvValue(stock.lowStockThreshold ?? 5),
        escapeCsvValue(joinListField(product.images)),
        escapeCsvValue(joinListField(product.availableSizes)),
        escapeCsvValue(joinListField(product.availableColors)),
        escapeCsvValue(joinListField(product.highlights)),
        escapeCsvValue(product.specifications),
        escapeCsvValue(product.isActive)
      ].join(',');
    });

    const csvContent = [CSV_EXPORT_HEADERS.join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

const importProductsCsv = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'CSV file is required.' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'CSV file contains no data rows.' });
    }

    const summary = { total: records.length, created: 0, updated: 0, skipped: 0, failures: [] };

    for (let index = 0; index < records.length; index += 1) {
      const rowNumber = index + 2;
      const normalized = normalizeCsvRow(records[index]);
      const rowErrors = [];

      const sku = (normalized.sku || '').trim();
      if (!sku) rowErrors.push('SKU is required.');

      const name = (normalized.name || '').trim();
      if (!name) rowErrors.push('Name is required.');

      const price = normalizeDecimalField(normalized.price);
      if (price <= 0) rowErrors.push('Price must be greater than zero.');

      if (rowErrors.length) {
        summary.skipped += 1;
        summary.failures.push({ row: rowNumber, errors: rowErrors });
        continue;
      }

      const productPayload = {
        name,
        description: normalized.description || null,
        price,
        category: normalized.category || null,
        brand: normalized.brand || null,
        color: normalized.color || null,
        size: normalized.size || null,
        specifications: parseSpecificationsField(normalized.specifications),
        highlights: parseListField(normalized.highlights),
        images: parseListField(normalized.images),
        availableSizes: parseListField(normalized.availablesizes),
        availableColors: parseListField(normalized.availablecolors),
        isActive: parseBooleanField(normalized.isactive, true),
        salePrice: normalizeDecimalField(normalized.saleprice, null),
        offerLabel: normalized.offerlabel || null,
        offerExpiresAt: parseDateField(normalized.offerexpiresat),
        isBestSeller: parseBooleanField(normalized.isbestseller, false),
        updatedBy: req.user.id
      };

      const stockQuantity = normalizeIntegerField(normalized.stockquantity, 0);
      const lowStockThreshold = normalizeIntegerField(normalized.lowstockthreshold, 5);

      try {
        await sequelize.transaction(async (transaction) => {
          let product = await Product.findOne({
            where: { tenantId: req.tenant.id, sku },
            transaction
          });

          if (!product) {
            product = await Product.create({
              tenantId: req.tenant.id,
              sku,
              ...productPayload,
              createdBy: req.user.id
            }, { transaction });
            summary.created += 1;
          } else {
            await product.update(productPayload, { transaction });
            summary.updated += 1;
          }

          const stockRecord = await Stock.findOne({
            where: { tenantId: req.tenant.id, productId: product.id },
            transaction
          });

          if (stockRecord) {
            await stockRecord.update({
              quantity: stockQuantity,
              lowStockThreshold,
              updatedBy: req.user.id
            }, { transaction });
          } else {
            await Stock.create({
              tenantId: req.tenant.id,
              productId: product.id,
              quantity: stockQuantity,
              lowStockThreshold,
              createdBy: req.user.id,
              updatedBy: req.user.id
            }, { transaction });
          }
          await logPriceSnapshot({ product, tenantId: req.tenant.id, userId: req.user.id }, transaction);
        });
      } catch (rowErr) {
        summary.skipped += 1;
        summary.failures.push({ row: rowNumber, errors: [rowErr.message || 'Failed to persist row.'] });
      }
    }

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductSummary,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  exportProductsCsv,
  importProductsCsv,
  getFilterOptions,
  getAutocomplete,
  getRecommendations,
  listProductQuestions,
  createProductQuestion,
  updateProductQuestion,
  getRecentlyViewed,
  getSocialProof,
  getProductPriceHistory
};
