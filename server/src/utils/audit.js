import { AuditLog } from '../models/AuditLog.js';

/**
 * Best-effort security/audit trail. Never throws so it can be called inline.
 */
export const logEvent = async ({ req, action, actor, targetType, targetId, meta, level = 'info' }) => {
  try {
    await AuditLog.create({
      action,
      level,
      actor: actor || req?.user?._id,
      actorEmail: actor?.email || req?.user?.email,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      ip: req?.ip,
      userAgent: req?.get?.('user-agent'),
      method: req?.method,
      path: req?.originalUrl,
      meta,
    });
  } catch (err) {
    console.error('[audit] failed to write log:', err.message);
  }
};
