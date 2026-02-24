'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useImageUpload } from '@/lib/hooks/useImageUpload';

interface ImageUploadProps {
  onUploadComplete: (url: string, publicId: string) => void;
  uploadType: 'products' | 'logos' | 'documents';
  label?: string;
  preview?: string;
  onRemove?: () => void;
}

export default function ImageUpload({
  onUploadComplete,
  uploadType,
  label = 'Upload Image',
  preview,
  onRemove,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadImage, isUploading, uploadProgress } = useImageUpload();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const result = await uploadImage(file, uploadType);
      if (result) {
        onUploadComplete(result.url, result.publicId);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const result = await uploadImage(files[0], uploadType);
      if (result) {
        onUploadComplete(result.url, result.publicId);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {preview ? (
        <div className="relative group mb-4">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border border-gray-300"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove image"
              aria-label="Remove selected image"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading && 'opacity-50 pointer-events-none'}`}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id={`upload-${uploadType}`}
            accept={uploadType === 'documents' ? '.pdf' : 'image/*'}
          />

          <label
            htmlFor={`upload-${uploadType}`}
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            <Upload className="text-gray-400" size={32} />
            <div>
              <p className="font-medium text-gray-700">
                {isUploading
                  ? `Uploading... ${Math.round(uploadProgress)}%`
                  : 'Drag and drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {uploadType === 'documents'
                  ? 'PDF files (max 5MB)'
                  : 'PNG, JPG, WebP, GIF (max 5MB)'}
              </p>
            </div>
          </label>
        </div>
      )}

      {isUploading && (
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          {/* CSS variable for dynamic width - inline style required */}
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 progress-bar-fill"
            style={
              { '--progress-width': `${uploadProgress}%` } as React.CSSProperties
            }
          />
        </div>
      )}
    </div>
  );
}
