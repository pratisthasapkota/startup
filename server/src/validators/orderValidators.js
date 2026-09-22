import { body, param } from 'express-validator';

const addressFields = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Recipient name is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Contact phone is required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
];

export const createOrderRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Invalid product reference'),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Invalid quantity'),
  body('paymentMethod').optional().isIn(['cod', 'bank_transfer']),
  body('customerNote').optional().trim().isLength({ max: 500 }),
  ...addressFields,
];

export const updateOrderStatusRules = [
  param('id').isMongoId(),
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('note').optional().trim().isLength({ max: 300 }),
  body('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded']),
  body('adminNote').optional().trim().isLength({ max: 500 }),
];
