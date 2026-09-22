import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const fields = ['name', 'phone', 'shopName', 'bio', 'avatar'];
  for (const f of fields) if (req.body[f] !== undefined) req.user[f] = req.body[f];

  await req.user.save();
  await logEvent({ req, action: 'profile_update', targetType: 'User', targetId: req.user._id });

  res.json({ success: true, message: 'Profile updated', data: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();

  await logEvent({ req, action: 'password_change', level: 'security', targetType: 'User', targetId: user._id });

  res.json({ success: true, message: 'Password changed' });
});

export const addAddress = asyncHandler(async (req, res) => {
  const { isDefault } = req.body;
  if (isDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
  req.user.addresses.push(req.body);
  await req.user.save();

  res.status(201).json({ success: true, data: req.user.addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  if (req.body.isDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  await req.user.save();

  res.json({ success: true, data: req.user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');
  address.deleteOne();
  await req.user.save();

  res.json({ success: true, data: req.user.addresses });
});
