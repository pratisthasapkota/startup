import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cloudinary, uploadBufferToCloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logEvent } from '../utils/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No images uploaded');

  let urls = [];

  if (env.cloudinary.enabled) {
    const results = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer))
    );
    urls = results.map((r) => r.secure_url);
  } else {
    // Local fallback for development when Cloudinary is not configured.
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    urls = req.files.map((file) => {
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname) || '.jpg'}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
      return `${env.clientUrl.replace(/\/$/, '')}/uploads/${name}`;
    });
  }

  await logEvent({
    req,
    action: 'image_upload',
    targetType: 'Upload',
    meta: { count: urls.length, provider: env.cloudinary.enabled ? 'cloudinary' : 'local' },
  });

  res.status(201).json({ success: true, data: { urls } });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (env.cloudinary.enabled && publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
  await logEvent({ req, action: 'image_delete', targetType: 'Upload', meta: { publicId } });
  res.json({ success: true, message: 'Image deleted' });
});
