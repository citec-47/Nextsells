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
    const allowedTypes = uploadType === 'documents' ? validDocTypes : validImageTypes;

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
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
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            toast.success('Image uploaded successfully');
            resolve(response);
          } else {
            const error = JSON.parse(xhr.responseText);
            toast.error(error.error || 'Upload failed');
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
