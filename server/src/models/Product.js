import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 140 },
    slug: { type: String, trim: true, lowercase: true, index: true },
    sku: { type: String, trim: true, unique: true, sparse: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    shortDescription: { type: String, trim: true, maxlength: 220, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'NPR' },
    stock: { type: Number, required: true, min: 0, default: 1 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'used', 'refurbished', 'for-parts'],
      default: 'new',
      index: true,
    },
    brand: { type: String, trim: true, default: 'Generic' },
    images: [{ type: String }],
    tags: [{ type: String, trim: true, lowercase: true }],
    specs: { type: Map, of: String, default: {} },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false, index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', tags: 'text', brand: 'text' });

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = `${this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${nanoid(6)}`;
  }
  if (!this.sku) {
    this.sku = `SKU-${nanoid(8).toUpperCase()}`;
  }
  next();
});

productSchema.methods.toCardJSON = function () {
  return {
    _id: this._id,
    title: this.title,
    slug: this.slug,
    price: this.price,
    compareAtPrice: this.compareAtPrice,
    currency: this.currency,
    images: this.images,
    condition: this.condition,
    stock: this.stock,
    ratingAverage: this.ratingAverage,
    ratingCount: this.ratingCount,
    category: this.category,
    brand: this.brand,
    featured: this.featured,
  };
};

export const Product = mongoose.model('Product', productSchema);
