import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'site', index: true },
    siteName: { type: String, default: 'VoltMart' },
    tagline: { type: String, default: 'Buy & sell electronics, hardware and books' },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: 'NPR' },
    shippingFee: { type: Number, default: 150, min: 0 },
    freeShippingThreshold: { type: Number, default: 5000, min: 0 },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    codEnabled: { type: Boolean, default: true },
    bankTransferEnabled: { type: Boolean, default: true },
    bankDetails: { type: String, default: 'Bank: Example Bank\nAccount: 000-0000000\nName: VoltMart Pvt. Ltd.' },
    maintenanceMode: { type: Boolean, default: false },
    allowSellerSignup: { type: Boolean, default: true },
    autoApproveProducts: { type: Boolean, default: false },
    announcement: { type: String, default: '' },
    contactEmail: { type: String, default: 'support@voltmart.example' },
    contactPhone: { type: String, default: '+977-0000000000' },
    address: { type: String, default: 'Kathmandu, Nepal' },
    socials: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);

export const getSettings = async () => {
  let settings = await Setting.findOne({ key: 'site' });
  if (!settings) settings = await Setting.create({ key: 'site' });
  return settings;
};
