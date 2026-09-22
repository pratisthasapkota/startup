import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { getSettings } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { ratingAverage: -1 },
  popular: { views: -1, sold: -1 },
};

const buildPublicFilter = (query) => {
  const filter = { status: 'approved' };
  if (query.category && mongoose.isValidObjectId(query.category)) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;
  if (query.brand) filter.brand = new RegExp(`^${query.brand}$`, 'i');
  if (query.seller && mongoose.isValidObjectId(query.seller)) filter.seller = query.seller;
  if (query.featured === 'true') filter.featured = true;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.q) filter.$text = { $search: query.q };
  return filter;
};

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 60);
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const filter = buildPublicFilter(req.query);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name shopName'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };

  const product = await Product.findOne(query)
    .populate('category', 'name slug icon')
    .populate('seller', 'name shopName createdAt');

  if (!product || product.status !== 'approved') throw ApiError.notFound('Product not found');

  Product.updateOne({ _id: product._id }, { $inc: { views: 1 } }).catch(() => {});

  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const isAdmin = req.user.role === 'admin';

  let status = 'pending';
  if (isAdmin) status = 'approved';
  else if (settings.autoApproveProducts) status = 'approved';

  const product = await Product.create({
    ...req.body,
    seller: req.user._id,
    status,
    ...(status === 'approved' && isAdmin
      ? { approvedBy: req.user._id, approvedAt: new Date() }
      : {}),
  });

  await logEvent({
    req,
    action: 'product_create',
    targetType: 'Product',
    targetId: product._id,
    meta: { status },
  });

  res.status(201).json({ success: true, message: 'Product submitted', data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden();

  const editable = [
    'title',
    'description',
    'shortDescription',
    'price',
    'compareAtPrice',
    'stock',
    'category',
    'condition',
    'brand',
    'images',
    'tags',
    'specs',
  ];
  for (const field of editable) {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  }

  // Edits by non-admins go back to moderation, unless auto-approval is on.
  if (req.user.role !== 'admin') {
    const settings = await getSettings();
    if (!settings.autoApproveProducts) product.status = 'pending';
  }

  await product.save();
  await logEvent({ req, action: 'product_update', targetType: 'Product', targetId: product._id });

  res.json({ success: true, message: 'Product updated', data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden();

  if (req.user.role === 'admin') {
    await Promise.all([
      product.deleteOne(),
      mongoose.model('Review').deleteMany({ product: product._id }),
    ]);
    await logEvent({
      req,
      action: 'product_delete',
      level: 'security',
      targetType: 'Product',
      targetId: product._id,
      meta: { title: product.title },
    });
    return res.json({ success: true, message: 'Product permanently deleted' });
  }

  product.status = 'archived';
  await product.save();

  await logEvent({ req, action: 'product_archive', targetType: 'Product', targetId: product._id });

  res.json({ success: true, message: 'Product archived' });
});

export const myProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 60);
  const filter = { seller: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const relatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const items = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    status: 'approved',
  })
    .limit(8)
    .populate('category', 'name slug');

  res.json({ success: true, data: items });
});
