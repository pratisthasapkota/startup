import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    level: { type: String, enum: ['info', 'warn', 'error', 'security'], default: 'info', index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String },
    targetType: { type: String },
    targetId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    method: { type: String },
    path: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
