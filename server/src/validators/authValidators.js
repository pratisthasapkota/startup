import { body } from 'express-validator';

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
  body('phone').optional().trim().isLength({ max: 30 }),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('shopName').optional().trim().isLength({ max: 80 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
];

export const addressRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('country').optional().trim(),
  body('isDefault').optional().isBoolean(),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be at least 6 characters'),
];
