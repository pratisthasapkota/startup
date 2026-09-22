import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  addressRules,
} from '../validators/authValidators.js';
import * as user from '../controllers/userController.js';

const router = Router();

router.post('/register', authLimiter, registerRules, validate, auth.register);
router.post('/login', authLimiter, loginRules, validate, auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', protect, auth.logout);
router.get('/me', protect, auth.me);

router.put('/profile', protect, updateProfileRules, validate, user.updateProfile);
router.put('/password', protect, changePasswordRules, validate, user.changePassword);
router.post('/addresses', protect, addressRules, validate, user.addAddress);
router.put('/addresses/:addressId', protect, user.updateAddress);
router.delete('/addresses/:addressId', protect, user.deleteAddress);

export default router;
