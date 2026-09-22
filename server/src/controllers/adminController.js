import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Category } from '../models/Category.js';
import { Review } from '../models/Review.js';
import { AuditLog } from '../models/AuditLog.js';
import { getSettings, Setting } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

export const dashboardStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    pendingProducts,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    revenueAgg,
    commissionAgg,
    payoutPendingAgg,
    lowStock,
    recentOrders,
    lowStockProducts,
    topProducts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: { $in: ['seller', 'admin'] } }),
    Product.countDocuments({ status: { $ne: 'archived' } }),
    Product.countDocuments({ status: 'pending' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'delivered' }),
    Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: null, commission: { $sum: '$items.commission' }, payout: { $sum: '$items.payout' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $match: { 'items.payoutStatus': 'pending' } },
      { $group: { _id: null, pending: { $sum: '$items.payout' } } },
    ]),
    Product.countDocuments({ stock: { $lte: 3 }, status: 'approved' }),
    Order.find().sort({ createdAt: -1 }).limit(8).populate('buyer', 'name email'),
    Product.find({ stock: { $lte: 3 }, status: 'approved' }).limit(8).select('title stock price'),
    Product.find({ status: 'approved' }).sort({ sold: -1 }).limit(5).select('title sold price images'),
  ]);

  // Sales for the last 7 days.
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const salesDaily = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        sellers: totalSellers,
        products: totalProducts,
        pendingProducts,
        orders: totalOrders,
        pendingOrders,
        deliveredOrders,
        lowStock,
        revenue: revenueAgg[0]?.total || 0,
        commissionEarned: commissionAgg[0]?.commission || 0,
        sellerPayout: commissionAgg[0]?.payout || 0,
        sellerPayoutPending: payoutPendingAgg[0]?.pending || 0,
      },
      recentOrders,
      lowStockProducts,
      topProducts,
      salesDaily,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.$or = [
      { name: new RegExp(req.query.q, 'i') },
      { email: new RegExp(req.query.q, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'buyer', phone, shopName, status = 'active' } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email and password are required');
  }

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with that email already exists');

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone: phone || undefined,
    shopName: shopName || undefined,
    status,
  });

  await logEvent({
    req,
    action: 'user_create',
    level: 'security',
    targetType: 'User',
    targetId: user._id,
    meta: { role: user.role },
  });

  res.status(201).json({ success: true, message: 'User created', data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user._id.equals(req.user._id) && req.body.role && req.body.role !== 'admin') {
    throw ApiError.badRequest('You cannot remove your own admin role');
  }
  if (user._id.equals(req.user._id) && req.body.status === 'suspended') {
    throw ApiError.badRequest('You cannot suspend your own account');
  }

  const fields = ['name', 'email', 'phone', 'shopName', 'bio', 'avatar', 'role', 'status'];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (f === 'email' && req.body[f] !== user.email) {
        const clash = await User.findOne({ email: req.body[f] });
        if (clash && !clash._id.equals(user._id)) {
          throw ApiError.conflict('An account with that email already exists');
        }
      }
      user[f] = req.body[f];
    }
  }

  const securityChange =
    (req.body.password && req.body.password.length >= 6 && req.body.password !== '') ||
    req.body.role !== undefined ||
    req.body.status !== undefined;

  if (req.body.password && req.body.password.length >= 6) {
    user.password = req.body.password;
  }
  if (securityChange) user.tokenVersion += 1;

  await user.save();

  await logEvent({
    req,
    action: 'user_update',
    level: 'security',
    targetType: 'User',
    targetId: user._id,
    meta: { role: user.role, status: user.status },
  });

  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user._id.equals(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin', status: 'active' });
    if (adminCount <= 1) {
      throw ApiError.badRequest('You cannot delete the last active admin');
    }
  }

  await Product.updateMany({ seller: user._id }, { $set: { status: 'archived' } });
  await Review.deleteMany({ user: user._id });
  await user.deleteOne();

  await logEvent({
    req,
    action: 'user_delete',
    level: 'security',
    targetType: 'User',
    targetId: user._id,
  });

  res.json({ success: true, message: 'User deleted' });
});

export const listAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.title = new RegExp(req.query.q, 'i');

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', 'name email shopName')
      .populate('category', 'name'),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const moderateProduct = asyncHandler(async (req, res) => {
  const { status, rejectionReason = '' } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  product.status = status;
  product.rejectionReason = status === 'rejected' ? rejectionReason : '';
  if (status === 'approved') {
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
  }
  await product.save();

  await logEvent({
    req,
    action: 'product_moderate',
    targetType: 'Product',
    targetId: product._id,
    meta: { status, rejectionReason },
  });

  res.json({ success: true, message: `Product ${status}`, data: product });
});

export const toggleProductFeatured = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.featured = !product.featured;
  await product.save();
  await logEvent({ req, action: 'product_feature_toggle', targetType: 'Product', targetId: product._id });
  res.json({ success: true, data: product });
});

export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.q) filter.orderNumber = new RegExp(req.query.q, 'i');

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('buyer', 'name email phone'),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = '', paymentStatus, adminNote } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  if (status && status !== order.status) {
    if (status === 'cancelled') {
      await Promise.all(
        order.items.map((item) =>
          Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity, sold: -item.quantity } }
          )
        )
      );
    }
    order.status = status;
    order.statusHistory.push({ status, note, by: req.user._id });
  }

  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (adminNote !== undefined) order.adminNote = adminNote;

  await order.save();
  await logEvent({
    req,
    action: 'order_status_update',
    targetType: 'Order',
    targetId: order._id,
    meta: { status, paymentStatus },
  });

  res.json({ success: true, data: order });
});

export const updateOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  if (req.body.status && req.body.status !== order.status) {
    if (req.body.status === 'cancelled') {
      await Promise.all(
        order.items.map((item) =>
          Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity, sold: -item.quantity } }
          )
        )
      );
    }
    order.status = req.body.status;
    order.statusHistory.push({
      status: req.body.status,
      note: req.body.note || '',
      by: req.user._id,
    });
  }

  if (req.body.shippingAddress) {
    for (const f of ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country']) {
      if (req.body.shippingAddress[f] !== undefined) order.shippingAddress[f] = req.body.shippingAddress[f];
    }
  }
  if (req.body.customerNote !== undefined) order.customerNote = req.body.customerNote;
  if (req.body.adminNote !== undefined) order.adminNote = req.body.adminNote;
  if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;

  await order.save();
  await logEvent({
    req,
    action: 'order_details_update',
    targetType: 'Order',
    targetId: order._id,
  });

  res.json({ success: true, data: order });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.status !== 'cancelled') {
    await Promise.all(
      order.items.map((item) =>
        Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity, sold: -item.quantity } }
        )
      )
    );
  }

  await order.deleteOne();

  await logEvent({
    req,
    action: 'order_delete',
    level: 'security',
    targetType: 'Order',
    targetId: order._id,
    meta: { orderNumber: order.orderNumber },
  });

  res.json({ success: true, message: 'Order deleted' });
});

export const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'name email')
    .populate('product', 'title');
  res.json({ success: true, data: reviews });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (req.body.isVisible !== undefined) review.isVisible = req.body.isVisible;
  if (req.body.adminReply !== undefined) review.adminReply = req.body.adminReply;
  await review.save();
  await Review.recalcProductRating(review.product);
  res.json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  const productId = review.product;
  await review.deleteOne();
  await Review.recalcProductRating(productId);

  await logEvent({
    req,
    action: 'review_delete',
    targetType: 'Review',
    targetId: review._id,
    meta: { product: String(productId) },
  });

  res.json({ success: true, message: 'Review deleted' });
});

export const getSettingsHandler = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const fields = [
    'siteName',
    'tagline',
    'logoUrl',
    'currency',
    'shippingFee',
    'freeShippingThreshold',
    'commissionRate',
    'codEnabled',
    'bankTransferEnabled',
    'bankDetails',
    'maintenanceMode',
    'allowSellerSignup',
    'autoApproveProducts',
    'announcement',
    'contactEmail',
    'contactPhone',
    'address',
    'socials',
  ];
  for (const f of fields) if (req.body[f] !== undefined) settings[f] = req.body[f];
  settings.updatedBy = req.user._id;
  await settings.save();

  await logEvent({ req, action: 'settings_update', level: 'security', targetType: 'Setting' });

  res.json({ success: true, data: settings });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const filter = {};
  if (req.query.level) filter.level = req.query.level;
  if (req.query.action) filter.action = req.query.action;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const securityOverview = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [byLevel, byAction, recentSecurity, lockedAccounts] = await Promise.all([
    AuditLog.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]),
    AuditLog.aggregate([
      { $match: { level: { $in: ['security', 'warn', 'error'] } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AuditLog.find({ level: 'security', createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(50),
    User.countDocuments({ lockUntil: { $gt: new Date() } }),
  ]);

  const totalEvents = byLevel.reduce((sum, l) => sum + l.count, 0);

  res.json({
    success: true,
    data: {
      totals: { events: totalEvents, lockedAccounts },
      byLevel: Object.fromEntries(byLevel.map((l) => [l._id, l.count])),
      topThreats: byAction,
      recentSecurity,
    },
  });
});

export const seedCategories = asyncHandler(async (_req, _res) => {
  const count = await Category.countDocuments();
  res.json({ success: true, data: { categories: count } });
});
