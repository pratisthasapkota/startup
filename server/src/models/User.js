import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import normalizeEmail from 'validator/lib/normalizeEmail.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    line1: { type: String, trim: true, required: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Nepal' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
      index: true,
    },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    shopName: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 500 },
    addresses: [addressSchema],
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.tokenVersion;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  }
);

userSchema.virtual('isLocked').get(function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('validate', function (next) {
  if (typeof this.email === 'string') {
    const normalized = normalizeEmail(this.email);
    if (normalized) this.email = normalized;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.registerFailedLogin = async function () {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    // Progressive lock: 15 minutes after 5 failures.
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.registerSuccessfulLogin = async function (ip) {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLoginAt = new Date();
  this.lastLoginIp = ip;
  await this.save({ validateBeforeSave: false });
};

export const User = mongoose.model('User', userSchema);
