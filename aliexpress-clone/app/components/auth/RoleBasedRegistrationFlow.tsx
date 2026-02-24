'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import ImageUpload from '@/app/components/common/ImageUpload';

type UserRole = 'BUYER' | 'SELLER' | null;

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  companyName?: string;
  businessType?: string;
  website?: string;
  bio?: string;
  logo?: string;
  logoPublicId?: string;
}

interface DocumentData {
  documentType: 'PASSPORT' | 'NATIONAL_ID';
  documentNumber: string;
  expiryDate: string;
  documentUrl: string;
  documentPublicId: string;
}

export default function RoleBasedRegistrationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toUpperCase() as UserRole;

  const [role, setRole] = useState<UserRole>(null);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: ID Upload, 3: Success
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState('');

  // Form data
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });

  const [docData, setDocData] = useState<DocumentData>({
    documentType: 'PASSPORT',
    documentNumber: '',
    expiryDate: '',
    documentUrl: '',
    documentPublicId: '',
  });

  // Set role from URL parameter
  useEffect(() => {
    if (roleParam === 'BUYER' || roleParam === 'SELLER') {
      setRole(roleParam);
    } else {
      router.push('/auth/accounts');
    }
  }, [roleParam, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1: Register
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (role === 'SELLER' && !formData.companyName?.trim()) {
      setErrorMessage('Company name is required for sellers');
      return;
    }

    if (role === 'SELLER' && !formData.logo) {
      setErrorMessage('Company logo is required for sellers');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = role === 'BUYER'
        ? '/api/auth/register/buyer'
        : '/api/seller/register/step-1';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (role === 'BUYER') {
          // Buyers skip to success
          setToken(data.data.token);
          setStep(3);
          toast.success('Account created successfully!');
        } else {
          // Sellers continue to step 2 (logo upload via seller endpoint)
          // Upload logo for sellers
          setToken(data.data.token);
          
          // Upload logo via step-2
          await uploadSellerLogo(data.data.token);
          setStep(2); // Go to ID verification
          toast.success('Basic info submitted! Now please upload your government ID.');
        }
      } else {
        // Display validation errors if available
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('\n');
          setErrorMessage(errorMessages);
          toast.error(`Validation error: ${errorMessages}`);
        } else {
          setErrorMessage(data.message || data.error || 'Registration failed');
          toast.error(data.message || data.error || 'Registration failed');
        }
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload seller logo
  const uploadSellerLogo = async (authToken: string) => {
    try {
      const response = await fetch('/api/seller/register/step-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          businessType: formData.businessType || 'Not Specified',
          website: formData.website || '',
          bio: formData.bio || '',
          logoUrl: formData.logo,
          logoPublicId: formData.logoPublicId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      throw error;
    }
  };

  // Step 2: Upload ID
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!docData.documentUrl) {
      setErrorMessage('Government ID document is required');
      return;
    }

    if (!docData.documentNumber.trim()) {
      setErrorMessage('Document number is required');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = role === 'BUYER'
        ? '/api/auth/verify/identity'
        : '/api/seller/register/step-3';

      const authToken = token;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          documentType: docData.documentType,
          documentNumber: docData.documentNumber,
          expiryDate: docData.expiryDate || null,
          documentUrl: docData.documentUrl,
          documentPublicId: docData.documentPublicId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(3);
        toast.success('Document uploaded! Your account will be verified shortly.');
      } else {
        setErrorMessage(data.message || 'Failed to upload document');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Document upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step === 1) {
      router.push('/auth/accounts');
    } else if (step === 2) {
      setStep(1);
    }
  };

  const progressPercentage = step === 1 ? 33 : step === 2 ? 66 : 100;

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {role === 'BUYER' ? 'Create Buyer Account' : 'Become a Seller'}
          </h1>
          <p className="text-gray-600">
            {role === 'BUYER'
              ? 'Join us to discover amazing products'
              : 'Complete your seller onboarding'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? <Check size={20} /> : s}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            {/* CSS variable for dynamic width - inline style required */}
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 progress-bar-fill"
              style={
                { '--progress-width': `${progressPercentage}%` } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Step 1: Registration Form */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Step 1: {role === 'BUYER' ? 'Basic Information' : 'Account & Business Details'}
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 10 digits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min 8 chars with uppercase, lowercase, number & special char (!@#$%^&*)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Seller-Specific Fields */}
              {role === 'SELLER' && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Business Information
                    </h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        name="companyName"
                        value={formData.companyName || ''}
                        onChange={handleInputChange}
                        placeholder="Your Business Name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType || 'Sole Proprietor'}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          title="Select business type"
                          aria-label="Business type"
                        >
                          <option value="Sole Proprietor">Sole Proprietor</option>
                          <option value="Partnership">Partnership</option>
                          <option value="LLC">LLC</option>
                          <option value="Corporation">Corporation</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Website (Optional)
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Bio (Optional)
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Tell customers about your business..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="border-t border-gray-200 pt-6">
                    <ImageUpload
                      onUploadComplete={(url, publicId) => {
                        setFormData({
                          ...formData,
                          logo: url,
                          logoPublicId: publicId,
                        });
                      }}
                      uploadType="logos"
                      label="Company Logo *"
                      preview={formData.logo}
                      onRemove={() =>
                        setFormData({
                          ...formData,
                          logo: '',
                          logoPublicId: '',
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoading ? 'Processing...' : role === 'BUYER' ? 'Create Account' : 'Next: Upload ID'}
                  {!isLoading && <ChevronRight size={20} />}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: ID Verification */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Step 2: Verify Your Identity
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-blue-800 text-sm">
                  We verify identity to ensure trust in our community. Your documents are secure and private.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={docData.documentType}
                  onChange={(e) =>
                    setDocData({
                      ...docData,
                      documentType: e.target.value as 'PASSPORT' | 'NATIONAL_ID',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  title="Select document type"
                  aria-label="Document type"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID / Driver's License</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Number *
                </label>
                <input
                  type="text"
                  required
                  value={docData.documentNumber}
                  onChange={(e) =>
                    setDocData({ ...docData, documentNumber: e.target.value })
                  }
                  placeholder="e.g., AB123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={docData.expiryDate}
                  onChange={(e) =>
                    setDocData({ ...docData, expiryDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  title="Select expiration date"
                  aria-label="Expiration date"
                />
              </div>

              {/* Document Upload */}
              <ImageUpload
                onUploadComplete={(url, publicId) => {
                  setDocData({
                    ...docData,
                    documentUrl: url,
                    documentPublicId: publicId,
                  });
                }}
                uploadType="documents"
                label="Upload Government ID *"
                preview={docData.documentUrl}
                onRemove={() =>
                  setDocData({
                    ...docData,
                    documentUrl: '',
                    documentPublicId: '',
                  })
                }
              />

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Complete Registration'}
                  {!isLoading && <ChevronRight size={20} />}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="text-green-600" size={40} />
              </div>

              {role === 'BUYER' ? (
                <>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Welcome, {formData.name}!
                    </h2>
                    <p className="text-gray-600">
                      Your buyer account is ready to use
                    </p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      You can now:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">✓</span>
                        <span>Browse thousands of products</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">✓</span>
                        <span>Add items to your wishlist</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">✓</span>
                        <span>Track your orders</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">✓</span>
                        <span>Leave reviews and ratings</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => router.push('/buyer/products')}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Start Browsing
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Registration Complete!
                    </h2>
                    <p className="text-gray-600">
                      Your seller account is pending admin verification
                    </p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      What happens next?
                    </h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">1.</span>
                        <span>
                          Our admin team reviews your documents
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">2.</span>
                        <span>
                          You'll receive an email within 24-48 hours
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-indigo-600">3.</span>
                        <span>
                          Once approved, start listing products
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Verification Email:</strong> Sent to{' '}
                      <strong>{formData.email}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/seller/dashboard')}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Go to Seller Dashboard
                  </button>
                </>
              )}

              <p className="text-sm text-gray-600 pt-4">
                Questions? Contact support@aliexpress-clone.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
