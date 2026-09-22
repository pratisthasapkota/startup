import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    isVisible: { type: Boolean, default: true, index: true },
    adminReply: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.recalcProductRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isVisible: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { Product } = await import('./Product.js');
  if (stats.length) {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: Math.round(stats[0].avg * 10) / 10,
      ratingCount: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratingAverage: 0, ratingCount: 0 });
  }
};

export const Review = mongoose.model('Review', reviewSchema);
