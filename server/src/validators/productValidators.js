import { body, param, query } from 'express-validator';

export const createProductRules = [
  body('title').trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3-140 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be 10-5000 characters'),
  body('shortDescription').optional().trim().isLength({ max: 220 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('compareAtPrice').optional().isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a whole number'),
  body('category').isMongoId().withMessage('A valid category is required'),
  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'used', 'refurbished', 'for-parts'])
    .withMessage('Invalid condition'),
  body('brand').optional().trim().isLength({ max: 80 }),
  body('images').optional().isArray({ max: 6 }),
  body('images.*').optional().isString(),
  body('tags').optional().isArray({ max: 15 }),
  body('specs').optional().isObject(),
];

export const updateProductRules = [
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 3, max: 140 }),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('compareAtPrice').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('category').optional().isMongoId(),
  body('condition').optional().isIn(['new', 'like-new', 'used', 'refurbished', 'for-parts']),
  body('images').optional().isArray({ max: 6 }),
  body('specs').optional().isObject(),
];

export const moderateProductRules = [
  param('id').isMongoId(),
  body('status').isIn(['approved', 'rejected', 'archived']).withMessage('Invalid status'),
  body('rejectionReason').optional().trim().isLength({ max: 300 }),
];

export const listProductRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 60 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('sort').optional().isIn(['newest', 'oldest', 'price-asc', 'price-desc', 'rating', 'popular']),
];
