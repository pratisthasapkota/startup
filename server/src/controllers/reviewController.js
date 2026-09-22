import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isVisible: true })
    .sort({ createdAt: -1 })
    .populate('user', 'name avatar');
  res.json({ success: true, data: reviews });
});

export const upsertReview = asyncHandler(async (req, res) => {
  const { product, rating, title = '', comment = '' } = req.body;

  const purchased = await Order.findOne({
    buyer: req.user._id,
    'items.product': product,
    status: { $in: ['delivered', 'confirmed', 'shipped', 'pending'] },
  });

  const review = await Review.findOneAndUpdate(
    { product, user: req.user._id },
    { rating, title, comment, order: purchased?._id, isVisible: true },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Review.recalcProductRating(product);
  await logEvent({ req, action: 'review_submit', targetType: 'Product', targetId: product });

  res.status(201).json({ success: true, message: 'Review saved', data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden();
  }

  await review.deleteOne();
  await Review.recalcProductRating(review.product);

  res.json({ success: true, message: 'Review deleted' });
});
