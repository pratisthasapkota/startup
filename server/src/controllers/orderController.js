import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { getSettings } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'cod', customerNote = '' } = req.body;
  const settings = await getSettings();

  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, status: 'approved' }).populate('seller', 'role');

  const orderItems = [];
  let subtotal = 0;
  const commissionRate = Math.min(Math.max(settings.commissionRate || 0, 0), 100);

  for (const line of items) {
    const product = products.find((p) => p._id.toString() === line.product);
    if (!product) throw ApiError.badRequest('One of the products is no longer available');
    if (product.stock < line.quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${product.title}"`);
    }
    const lineTotal = product.price * line.quantity;
    subtotal += lineTotal;

    // Marketplace-owned stock (listed by an admin) belongs 100% to VoltMart.
    const isMarketplaceStock = product.seller && product.seller.role === 'admin';
    const commission = isMarketplaceStock ? lineTotal : Math.round(lineTotal * (commissionRate / 100) * 100) / 100;

    orderItems.push({
      product: product._id,
      title: product.title,
      price: product.price,
      quantity: line.quantity,
      image: product.images?.[0] || '',
      seller: product.seller._id,
      commission,
      payout: lineTotal - commission,
      payoutStatus: isMarketplaceStock ? 'paid' : 'pending',
    });
  }

  const shippingFee =
    settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFee || 0;

  const order = await Order.create({
    buyer: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    currency: settings.currency,
    paymentMethod,
    paymentStatus: 'unpaid',
    status: 'pending',
    customerNote,
    statusHistory: [{ status: 'pending', note: 'Order placed', by: req.user._id }],
  });

  // Reduce stock and mark sold counts.
  await Promise.all(
    orderItems.map((item) =>
      Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      )
    )
  );

  await logEvent({ req, action: 'order_create', targetType: 'Order', targetId: order._id });

  res.status(201).json({ success: true, message: 'Order placed', data: order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const sellerEarnings = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'items.seller': req.user._id, status: { $ne: 'cancelled' } })
    .sort({ createdAt: -1 })
    .select('orderNumber status createdAt items total');

  const soldItems = [];
  const totals = { commission: 0, payout: 0, paid: 0, pending: 0, sold: 0 };

  for (const o of orders) {
    for (const it of o.items) {
      if (!it.seller || !it.seller.equals(req.user._id)) continue;
      const payout = it.payout || 0;
      const isPaid = it.payoutStatus === 'paid';
      totals.commission += it.commission || 0;
      totals.payout += payout;
      if (isPaid) totals.paid += payout;
      else totals.pending += payout;
      totals.sold += it.quantity || 0;
      soldItems.push({
        orderId: o._id,
        orderNumber: o.orderNumber,
        orderStatus: o.status,
        createdAt: o.createdAt,
        product: it.product,
        title: it.title,
        image: it.image,
        quantity: it.quantity,
        price: it.price,
        commission: it.commission || 0,
        payout,
        payoutStatus: it.payoutStatus || 'pending',
        orderTotal: o.total,
      });
    }
  }

  soldItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: { totals, items: soldItems } });
});

export const markOrderPayout = asyncHandler(async (req, res) => {
  const { items: updates } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const byProduct = new Map((updates || []).map((u) => [String(u.product), u.payoutStatus]));
  for (const it of order.items) {
    const status = byProduct.get(String(it.product));
    if (status === 'paid' || status === 'pending') it.payoutStatus = status;
  }
  await order.save();

  await logEvent({ req, action: 'payout_update', targetType: 'Order', targetId: order._id, meta: { updates } });

  res.json({ success: true, message: 'Payout status updated', data: order });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('buyer', 'name email phone');
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.buyer._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden();

  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.buyer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden();
  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    throw ApiError.badRequest(`Cannot cancel an order that is already ${order.status}`);
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: 'Cancelled', by: req.user._id });
  await order.save();

  // Restock items.
  await Promise.all(
    order.items.map((item) =>
      Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, sold: -item.quantity } }
      )
    )
  );

  await logEvent({ req, action: 'order_cancel', targetType: 'Order', targetId: order._id });

  res.json({ success: true, message: 'Order cancelled', data: order });
});
