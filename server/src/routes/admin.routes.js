import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { moderateProductRules } from '../validators/productValidators.js';
import { updateOrderStatusRules } from '../validators/orderValidators.js';
import { createUserRules, updateUserRules, updateOrderDetailsRules } from '../validators/adminValidators.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', admin.dashboardStats);

router.get('/users', admin.listUsers);
router.post('/users', createUserRules, validate, admin.createUser);
router.patch('/users/:id', updateUserRules, validate, admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

router.get('/products', admin.listAllProducts);
router.patch('/products/:id/moderate', moderateProductRules, validate, admin.moderateProduct);
router.patch('/products/:id/featured', admin.toggleProductFeatured);

router.get('/orders', admin.listOrders);
router.patch('/orders/:id/status', updateOrderStatusRules, validate, admin.updateOrderStatus);
router.patch('/orders/:id', updateOrderDetailsRules, validate, admin.updateOrderDetails);
router.delete('/orders/:id', admin.deleteOrder);

router.get('/reviews', admin.listReviews);
router.patch('/reviews/:id', admin.moderateReview);
router.delete('/reviews/:id', admin.deleteReview);

router.get('/settings', admin.getSettingsHandler);
router.put('/settings', admin.updateSettings);

router.get('/audit-logs', admin.listAuditLogs);
router.get('/security', admin.securityOverview);

export default router;
