import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/token.js';
import { logEvent } from '../utils/audit.js';

const issueSession = (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return accessToken;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'buyer', phone } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with that email already exists');

  const user = await User.create({ name, email, password, role, phone });
  const accessToken = issueSession(res, user);

  await logEvent({ req, action: 'user_register', targetType: 'User', targetId: user._id, actor: user });

  res.status(201).json({
    success: true,
    message: 'Account created',
    data: { user, accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  if (user.isLocked) {
    throw ApiError.forbidden('Account temporarily locked due to failed attempts. Try again later.');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    await user.registerFailedLogin();
    await logEvent({
      req,
      action: 'login_failed',
      level: 'security',
      targetType: 'User',
      targetId: user._id,
      meta: { email },
    });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status === 'suspended') throw ApiError.forbidden('Your account has been suspended');

  await user.registerSuccessfulLogin(req.ip);
  const accessToken = issueSession(res, user);

  await logEvent({ req, action: 'login_success', targetType: 'User', targetId: user._id, actor: user });

  res.json({ success: true, message: 'Signed in', data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token expired');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status === 'suspended') {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session invalid');
  }

  const accessToken = signAccessToken(user);
  setRefreshCookie(res, signRefreshToken(user));

  res.json({ success: true, data: { user, accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  if (req.user) {
    await logEvent({ req, action: 'logout', targetType: 'User', targetId: req.user._id });
  }
  res.json({ success: true, message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
