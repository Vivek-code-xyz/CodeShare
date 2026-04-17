/**
 * server/src/utils/cloudinary.js
 * Cloudinary SDK configuration and helper functions.
 *
 * NOTE: config is applied lazily (at call time, not import time) so that
 * dotenv is guaranteed to have loaded process.env before we read credentials.
 */
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const configure = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

/**
 * Upload a file buffer to Cloudinary.
 * Returns { publicId, secureUrl, resourceType }
 */
export const uploadToCloudinary = (buffer, originalName, mimeType) => {
    configure(); // ensure env vars are loaded before reading credentials
    return new Promise((resolve, reject) => {
        const resourceType = mimeType.startsWith('image/') ? 'image'
            : mimeType.startsWith('video/') ? 'video'
            : 'raw';

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: process.env.CLOUDINARY_FOLDER || 'ephemeraldrop',
                resource_type: resourceType,
                public_id: `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
                use_filename: false,
                overwrite: false,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    publicId: result.public_id,
                    secureUrl: result.secure_url,
                    resourceType: result.resource_type,
                });
            }
        );

        Readable.from(buffer).pipe(stream);
    });
};

/**
 * Build a deterministic delivery URL for a stored Cloudinary asset.
 * Using SDK-generated URLs helps when provider-returned secure_url varies by resource type.
 */
export const buildCloudinaryDeliveryUrl = (publicId, resourceType = 'raw', attachmentName) => {
    configure();
    return cloudinary.url(publicId, {
        resource_type: resourceType,
        type: 'upload',
        secure: true,
        sign_url: false,
        attachment: attachmentName || true,
    });
};

/**
 * Delete a file from Cloudinary by its public_id.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
    configure(); // ensure env vars are loaded before reading credentials
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        if (result.result !== 'ok' && result.result !== 'not found') {
            console.warn(`[Cloudinary] Unexpected result deleting ${publicId}:`, result);
        }
    } catch (err) {
        console.error(`[Cloudinary] Error deleting ${publicId}:`, err.message);
    }
};
