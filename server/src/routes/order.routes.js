import { Router } from 'express';
import * as orders from '../controllers/orderController.js';
import * as admin from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { createOrderRules, updateOrderStatusRules } from '../validators/orderValidators.js';

const router = Router();

router.post('/', protect, writeLimiter, createOrderRules, validate, orders.createOrder);
router.get('/mine', protect, orders.myOrders);
router.get('/seller/earnings', protect, authorize('seller', 'admin'), orders.sellerEarnings);
router.get('/:id', protect, orders.getOrder);
router.patch('/:id/cancel', protect, orders.cancelOrder);
router.patch('/:id/payout', protect, authorize('admin'), orders.markOrderPayout);

export default router;
