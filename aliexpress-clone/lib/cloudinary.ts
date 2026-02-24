import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(
  fileBuffer: Buffer,
  fileName: string,
  folder: string // 'products', 'logos', 'documents', etc
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `aliexpress-clone/${folder}`,
        resource_type: 'auto',
        public_id: fileName.split('.')[0],
        overwrite: true,
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
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsWithTimestamp = {
    ...params,
    timestamp,
  };

  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  const signature = cloudinary.utils.api_sign_request(
    paramsWithTimestamp,
    apiSecret
  );

  return signature;
}
