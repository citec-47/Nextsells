import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;

function assertCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
}

function buildPublicId(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '').trim() || 'upload';
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${slug || 'upload'}-${Date.now()}`;
}

export async function uploadImage(
  fileBuffer: Buffer,
  fileName: string,
  folder: string // 'products', 'logos', 'documents', etc
): Promise<{ url: string; publicId: string }> {
  assertCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `aliexpress-clone/${folder}`,
        resource_type: 'auto',
        public_id: buildPublicId(fileName),
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result?.secure_url || result?.url || '',
            publicId: result?.public_id || '',
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  assertCloudinaryConfig();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function generateSignature(params: Record<string, any>): string {
  assertCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsWithTimestamp = {
    ...params,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsWithTimestamp,
    apiSecret || ''
  );

  return signature;
}
