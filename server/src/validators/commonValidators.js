import { body, param } from 'express-validator';

export const categoryRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('description').optional().trim().isLength({ max: 300 }),
  body('icon').optional().trim().isLength({ max: 8 }),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const updateCategoryRules = [param('id').isMongoId(), ...categoryRules.map((r) => r.optional())];

export const reviewRules = [
  body('product').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('title').optional().trim().isLength({ max: 120 }),
  body('comment').optional().trim().isLength({ max: 1000 }),
];
