import { Router } from 'express';
import * as uploads from '../controllers/uploadController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/images',
  protect,
  authorize('seller', 'admin'),
  writeLimiter,
  uploadImages,
  uploads.uploadProductImages
);

router.delete('/images', protect, authorize('seller', 'admin'), uploads.deleteImage);

export default router;
