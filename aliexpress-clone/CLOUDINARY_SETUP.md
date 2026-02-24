# Cloudinary Integration Setup Guide

## Overview
Cloudinary integration has been set up for your AliExpress clone project to handle image and document uploads for:
- **Product images** - seller product listings
- **Seller logos** - business profile customization
- **Verification documents** - seller onboarding (ID, business license, etc.)

## Environment Variables
Your `.env.local` file has been configured with the following Cloudinary credentials:
```
CLOUDINARY_CLOUD_NAME=dlpc2ainn
CLOUDINARY_API_KEY=445328393169995
CLOUDINARY_API_SECRET=m_ox8jzTdLVYOzDtsY8p2ubo9Vo
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dlpc2ainn
```

## Files Created

### 1. **Cloudinary Utility** (`lib/cloudinary.ts`)
Core Cloudinary functionality:
- `uploadImage()` - Upload files to Cloudinary with folder organization
- `deleteImage()` - Remove images from Cloudinary
- `generateSignature()` - Create signatures for direct uploads

### 2. **Upload API Endpoint** (`app/api/upload/[type]/route.ts`)
POST endpoint for handling file uploads:
- Accepts `products`, `logos`, or `documents` upload types
- Validates file types and sizes (5MB max)
- Returns: `{ url: string; publicId: string }`

### 3. **useImageUpload Hook** (`lib/hooks/useImageUpload.ts`)
Client-side hook for image uploads:
- File validation (type & size checks)
- Progress tracking
- Toast notifications
- Error handling

```typescript
const { uploadImage, isUploading, uploadProgress } = useImageUpload();
const result = await uploadImage(file, 'products');
// result.url - Cloudinary image URL
// result.publicId - Cloudinary public ID (for deletion)
```

### 4. **ImageUpload Component** (`app/components/common/ImageUpload.tsx`)
Reusable drag-and-drop image upload component:
- Drag-and-drop support
- File preview
- Progress bar
- Responsive design

## Usage Examples

### In Forms (ProductListingForm, OnboardingForm)

```tsx
'use client';

import ImageUpload from '@/app/components/common/ImageUpload';
import { useState } from 'react';

export default function YourForm() {
  const [productImage, setProductImage] = useState<string>('');
  const [productImageId, setProductImageId] = useState<string>('');

  const handleImageUpload = (url: string, publicId: string) => {
    setProductImage(url);
    setProductImageId(publicId);
    // Use url in your form submission
  };

  const handleRemoveImage = () => {
    setProductImage('');
    setProductImageId('');
  };

  return (
    <form>
      <ImageUpload
        onUploadComplete={handleImageUpload}
        uploadType="products"
        label="Product Image"
        preview={productImage}
        onRemove={handleRemoveImage}
      />
      {/* Rest of your form */}
    </form>
  );
}
```

### Using the Hook Directly

```tsx
import { useImageUpload } from '@/lib/hooks/useImageUpload';

export default function MyComponent() {
  const { uploadImage, isUploading, uploadProgress } = useImageUpload();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await uploadImage(file, 'logos');
      if (result) {
        console.log('Uploaded to:', result.url);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      {isUploading && <p>Progress: {uploadProgress}%</p>}
    </div>
  );
}
```

## Upload Types

| Type | Folder | Allowed Extensions | Use Case |
|------|--------|-------------------|----------|
| `products` | `aliexpress-clone/products/` | PNG, JPG, WebP, GIF | Product images |
| `logos` | `aliexpress-clone/logos/` | PNG, JPG, WebP, GIF | Seller logos |
| `documents` | `aliexpress-clone/documents/` | PDF | Verification documents |

## API Endpoint

### POST `/api/upload/[type]`

**Request:**
```
FormData {
  file: File
}
```

**Parameters:**
- `type`: `'products'` | `'logos'` | `'documents'`

**Response (200):**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "aliexpress-clone/products/image-id"
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message"
}
```

## Constraints

- **File Size Limit:** 5MB
- **Max Images per Product:** Configure in ProductListingForm
- **Allowed Image Types:** PNG, JPG, WebP, GIF
- **Allowed Document Types:** PDF

## Next Steps

1. **Update ProductListingForm** - Replace file input with ImageUpload component for product images
2. **Update OnboardingForm** - Add ImageUpload for logo and document uploads
3. **Update API Endpoints** - Modify `/api/seller/products` and `/api/seller/onboarding` to accept Cloudinary URLs instead of file uploads
4. **Update Database Schema** - Store image URLs and public IDs in product and seller profile records

## Troubleshooting

### Images not uploading
1. Check environment variables are set in `.env.local`
2. Ensure Cloudinary credentials are correct
3. Check browser console for error messages

### Files rejected
1. Verify file size is under 5MB
2. Check file type matches allowed types for upload type
3. Review uploaded file MIME type

### CORS Issues
If you encounter CORS errors, Cloudinary's infrastructure should handle this automatically. If issues persist, contact Cloudinary support.

## Security Notes

⚠️ **Important:** The `CLOUDINARY_API_SECRET` should never be exposed to the client. It's only used in the `/api/upload` endpoint on the server side.

Always use the `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (without secret) on the client side if needed.

## Cost & Limits

- **Plan:** Verify your Cloudinary plan type at https://cloudinary.com/console
- **Storage Limit:** Check your plan for maximum storage
- **Transformations:** Cloudinary offers free basic transformations

For more info: https://cloudinary.com/documentation
