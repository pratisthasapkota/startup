import { Router } from 'express';
import * as products from '../controllers/productController.js';
import * as reviews from '../controllers/reviewController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import {
  createProductRules,
  updateProductRules,
  listProductRules,
} from '../validators/productValidators.js';
import { reviewRules } from '../validators/commonValidators.js';

const router = Router();

router.get('/', listProductRules, validate, products.listProducts);
router.get('/mine/list', protect, authorize('seller', 'admin'), products.myProducts);
router.get('/:id/related', products.relatedProducts);
router.get('/:id/reviews', reviews.listProductReviews);
router.get('/:id', products.getProduct);

router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  writeLimiter,
  createProductRules,
  validate,
  products.createProduct
);
router.put('/:id', protect, authorize('seller', 'admin'), updateProductRules, validate, products.updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin'), products.deleteProduct);

router.post('/reviews', protect, reviewRules, validate, reviews.upsertReview);
router.delete('/reviews/:id', protect, reviews.deleteReview);

export default router;
