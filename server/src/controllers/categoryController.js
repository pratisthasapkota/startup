import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ order: 1, name: 1 });

  const counts = await Product.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const data = categories.map((c) => ({
    ...c.toObject(),
    productCount: countMap[c._id.toString()] || 0,
  }));

  res.json({ success: true, data });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, order, isActive } = req.body;
  const slug = slugify(name);

  const exists = await Category.findOne({ $or: [{ name }, { slug }] });
  if (exists) throw ApiError.conflict('A category with that name already exists');

  const category = await Category.create({ name, slug, description, icon, order, isActive });
  await logEvent({ req, action: 'category_create', targetType: 'Category', targetId: category._id });

  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const fields = ['name', 'description', 'icon', 'order', 'isActive'];
  for (const f of fields) if (req.body[f] !== undefined) category[f] = req.body[f];
  if (req.body.name) category.slug = slugify(req.body.name);

  await category.save();
  await logEvent({ req, action: 'category_update', targetType: 'Category', targetId: category._id });

  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw ApiError.conflict(`Cannot delete: ${inUse} product(s) still use this category`);
  }

  await category.deleteOne();
  await logEvent({ req, action: 'category_delete', targetType: 'Category', targetId: req.params.id });

  res.json({ success: true, message: 'Category deleted' });
});
