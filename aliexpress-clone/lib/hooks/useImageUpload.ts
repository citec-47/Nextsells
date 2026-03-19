import { useState } from 'react';
import toast from 'react-hot-toast';

interface UploadResponse {
  url: string;
  publicId: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (
    file: File,
    uploadType: 'products' | 'logos' | 'documents'
  ): Promise<UploadResponse | null> => {
    if (!file) {
      toast.error('No file selected');
      return null;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validDocTypes = ['application/pdf'];
    const allowedTypes = uploadType === 'documents' 
      ? [...validImageTypes, ...validDocTypes]
      : validImageTypes;

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed images: JPG, PNG, GIF, WebP${uploadType === 'documents' ? ', PDF' : ''}`);
      return null;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return null;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Return a promise
      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          const contentType = xhr.getResponseHeader('content-type') || '';
          const raw = xhr.responseText || '';

          if (!contentType.includes('application/json')) {
            const error = new Error(
              xhr.status === 401 || xhr.status === 403
                ? 'Upload failed because your session expired.'
                : 'Upload service returned an invalid response.'
            );
            toast.error(error.message);
            reject(error);
            return;
          }

          let parsed: { url?: string; publicId?: string; error?: string };
          try {
            parsed = JSON.parse(raw) as { url?: string; publicId?: string; error?: string };
          } catch {
            const error = new Error('Failed to parse upload response.');
            toast.error(error.message);
            reject(error);
            return;
          }

          if (xhr.status === 200 && parsed.url && parsed.publicId) {
            toast.success('Image uploaded successfully');
            resolve({ url: parsed.url, publicId: parsed.publicId });
          } else {
            const error = new Error(parsed.error || 'Upload failed');
            toast.error(error.message);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          toast.error('Network error during upload');
          reject(new Error('Network error'));
        });

        xhr.open('POST', `/api/upload/${uploadType}`);
        xhr.send(formData);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadImage,
    isUploading,
    uploadProgress,
  };
}
