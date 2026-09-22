import { body, param } from 'express-validator';

export const createUserRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'suspended']).withMessage('Invalid status'),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('shopName').optional().trim().isLength({ max: 80 }),
];

export const updateUserRules = [
  param('id').isMongoId(),
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6, max: 128 }),
  body('role').optional().isIn(['buyer', 'seller', 'admin']),
  body('status').optional().isIn(['active', 'suspended']),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('shopName').optional().trim().isLength({ max: 80 }),
  body('bio').optional().trim().isLength({ max: 500 }),
];

export const updateOrderDetailsRules = [
  param('id').isMongoId(),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('note').optional().trim().isLength({ max: 300 }),
  body('shippingAddress.fullName').optional().trim().notEmpty().isLength({ max: 80 }),
  body('shippingAddress.phone').optional().trim().notEmpty().isLength({ max: 30 }),
  body('shippingAddress.line1').optional().trim().notEmpty().isLength({ max: 200 }),
  body('shippingAddress.line2').optional().trim().isLength({ max: 200 }),
  body('shippingAddress.city').optional().trim().notEmpty().isLength({ max: 80 }),
  body('shippingAddress.state').optional().trim().isLength({ max: 80 }),
  body('shippingAddress.postalCode').optional().trim().isLength({ max: 20 }),
  body('shippingAddress.country').optional().trim().isLength({ max: 60 }),
  body('customerNote').optional().trim().isLength({ max: 500 }),
  body('adminNote').optional().trim().isLength({ max: 500 }),
  body('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded']),
];