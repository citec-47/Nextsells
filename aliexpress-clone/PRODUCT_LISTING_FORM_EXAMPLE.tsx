'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import ImageUpload from '@/app/components/common/ImageUpload';

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  basePrice: string;
  profitMargin: string;
  stock: string;
  imageUrls: Array<{ url: string; publicId: string }>;
  sku: string;
}

export default function ProductListingFormWithCloudinary() {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category: 'Electronics',
    basePrice: '',
    profitMargin: '20',
    stock: '',
    imageUrls: [],
    sku: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Calculate selling price when base price or margin changes
    if (name === 'basePrice' || name === 'profitMargin') {
      const basePrice = parseFloat(name === 'basePrice' ? value : formData.basePrice);
      const margin = parseFloat(name === 'profitMargin' ? value : formData.profitMargin);

      if (!isNaN(basePrice) && !isNaN(margin)) {
        const sellingPrice = basePrice + (basePrice * margin) / 100;
        setCalculatedPrice(Number(sellingPrice.toFixed(2)));
      }
    }
  };

  const handleImageUpload = (url: string, publicId: string) => {
    if (formData.imageUrls.length >= 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, { url, publicId }],
    }));
    toast.success('Image added to product');
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error('Valid base price is required');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('Stock quantity is required');
      return;
    }
    if (formData.imageUrls.length === 0) {
      toast.error('At least one product image is required');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          basePrice: formData.basePrice,
          profitMargin: formData.profitMargin,
          sellingPrice: calculatedPrice,
          stock: formData.stock,
          sku: formData.sku,
          // Send Cloudinary URLs and public IDs
          images: formData.imageUrls.map((img) => ({
            url: img.url,
            publicId: img.publicId,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product created successfully!');
        setFormData({
          title: '',
          description: '',
          category: 'Electronics',
          basePrice: '',
          profitMargin: '20',
          stock: '',
          imageUrls: [],
          sku: '',
        });
        setCalculatedPrice(0);
      } else {
        toast.error(data.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred while creating the product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">List a New Product</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Product Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter product title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              title="Select product category"
              aria-label="Product category"
            >
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home & Garden</option>
              <option value="Sports">Sports & Outdoors</option>
              <option value="Toys">Toys & Games</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="Optional SKU"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Pricing */}
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-4">Pricing & Margins</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cost Price (Base) *
                </label>
                <div className="flex items-center">
                  <span className="absolute text-gray-500 ml-3">$</span>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profit Margin (%)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="profitMargin"
                    value={formData.profitMargin}
                    onChange={handleInputChange}
                    placeholder="20"
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Calculated Price */}
            <div className="bg-white border border-indigo-300 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Selling Price:</span>
                <span className="text-2xl font-bold text-indigo-600">${calculatedPrice.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Profit per unit: ${(calculatedPrice - parseFloat(formData.basePrice || '0')).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="Quantity in stock"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Images with Cloudinary - Multiple Upload Capability */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Product Images ({formData.imageUrls.length}/5) *
            </h3>

            {formData.imageUrls.length < 5 && (
              <ImageUpload
                onUploadComplete={handleImageUpload}
                uploadType="products"
                label={formData.imageUrls.length === 0 ? 'Upload first image' : 'Add more images'}
              />
            )}

            {/* Image Previews */}
            {formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {formData.imageUrls.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Publishing...' : 'Publish Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
