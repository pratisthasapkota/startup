import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import categoryRoutes from './category.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';
import { getSettings } from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: Date.now() })
);

router.get(
  '/settings/public',
  asyncHandler(async (_req, res) => {
    const s = await getSettings();
    res.json({
      success: true,
      data: {
        siteName: s.siteName,
        tagline: s.tagline,
        logoUrl: s.logoUrl,
        currency: s.currency,
        shippingFee: s.shippingFee,
        freeShippingThreshold: s.freeShippingThreshold,
        commissionRate: s.commissionRate,
        codEnabled: s.codEnabled,
        bankTransferEnabled: s.bankTransferEnabled,
        bankDetails: s.bankDetails,
        maintenanceMode: s.maintenanceMode,
        allowSellerSignup: s.allowSellerSignup,
        announcement: s.announcement,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        address: s.address,
        socials: s.socials,
      },
    });
  })
);

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);

export default router;
