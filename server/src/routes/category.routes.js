import { Router } from 'express';
import * as categories from '../controllers/categoryController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categoryRules, updateCategoryRules } from '../validators/commonValidators.js';

const router = Router();

router.get('/', optionalAuth, categories.listCategories);
router.post('/', protect, authorize('admin'), categoryRules, validate, categories.createCategory);
router.put('/:id', protect, authorize('admin'), updateCategoryRules, validate, categories.updateCategory);
router.delete('/:id', protect, authorize('admin'), categories.deleteCategory);

export default router;
