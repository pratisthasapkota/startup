import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commission: { type: Number, default: 0, min: 0 },
    payout: { type: Number, default: 0, min: 0 },
    payoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'Nepal' },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NPR' },
    paymentMethod: { type: String, enum: ['cod', 'bank_transfer'], default: 'cod' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    customerNote: { type: String, trim: true, maxlength: 500, default: '' },
    adminNote: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
