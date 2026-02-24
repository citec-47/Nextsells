'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  Upload,
  FileCheck,
  Edit2,
  Building2,
  MapPin,
  CheckCircle,
  Lock,
  Mail,
  AlertCircle,
} from 'lucide-react';
import ImageUpload from '@/app/components/common/ImageUpload';

interface Step1Data {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

interface Step2Data {
  companyName: string;
  businessType: string;
  website: string;
  bio: string;
  logo?: string;
  logoPublicId?: string;
}

interface Step3Data {
  country: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
}

interface Step4Data {
  governmentIdUrl: string;
  governmentIdPublicId: string;
  governmentIdType: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE';
  governmentIdNumber: string;
  taxDocumentUrl?: string;
  taxDocumentPublicId?: string;
}

interface RegistrationState {
  step: number;
  token?: string;
  userId?: string;
  sellerId?: string;
  email?: string;
}

interface FormErrors {
  [key: string]: string;
}

interface Step5Data {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export default function SellerRegistrationFlow() {
  const router = useRouter();
  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    step: 1,
  });

  // Step 1 data
  const [step1Data, setStep1Data] = useState<Step1Data>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });

  // Step 2 data
  const [step2Data, setStep2Data] = useState<Step2Data>({
    logo: '',
    logoPublicId: '',
    companyName: '',
    businessType: 'Sole Proprietor',
    website: '',
    bio: '',
  });

  // Step 3 data (Location)
  const [step3Data, setStep3Data] = useState<Step3Data>({
    country: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Step 4 data (Documents)
  const [step4Data, setStep4Data] = useState<Step4Data>({
    governmentIdUrl: '',
    governmentIdPublicId: '',
    governmentIdType: 'PASSPORT',
    governmentIdNumber: '',
    taxDocumentUrl: '',
    taxDocumentPublicId: '',
  });

  // Step 5 data (Review)
  const [step5Data, setStep5Data] = useState<Step5Data>({
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Basic Registration
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Validate
    if (step1Data.password !== step1Data.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/seller/register/step-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: step1Data.email,
          password: step1Data.password,
          name: step1Data.name,
          phone: step1Data.phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationState({
          step: 2,
          token: data.data.token,
          userId: data.data.user.id,
          email: data.data.user.email,
        });
        toast.success('Step 1 complete! Please upload your logo.');
      } else {
        // Display validation errors if available
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('\n');
          setErrorMessage(errorMessages);
          toast.error(`Validation error: ${errorMessages}`);
        } else {
          setErrorMessage(data.message || data.error || 'Registration failed. Please try again.');
          toast.error(data.message || data.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 1 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Logo Upload
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!step2Data.logo) {
      setErrorMessage('Logo is required');
      return;
    }

    if (!step2Data.companyName.trim()) {
      setErrorMessage('Company name is required');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('companyName', step2Data.companyName);
      formData.append('businessType', step2Data.businessType);
      formData.append('website', step2Data.website);
      formData.append('bio', step2Data.bio);

      // Note: The logo URL is already uploaded via ImageUpload component
      // We just need to send the metadata in step 2

      const response = await fetch('/api/seller/register/step-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registrationState.token}`,
        },
        body: JSON.stringify({
          companyName: step2Data.companyName,
          businessType: step2Data.businessType,
          website: step2Data.website,
          bio: step2Data.bio,
          logoUrl: step2Data.logo,
          logoPublicId: step2Data.logoPublicId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationState((prev) => ({
          ...prev,
          step: 3,
        }));
        toast.success('Logo uploaded! Now please upload your government ID.');
      } else {
        setErrorMessage(data.message || 'Failed to upload logo.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 2 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Location Details
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!step3Data.country.trim() || !step3Data.streetAddress.trim() || 
        !step3Data.city.trim() || !step3Data.state.trim() || !step3Data.postalCode.trim()) {
      setErrorMessage('All location fields are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/seller/register/step-3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registrationState.token}`,
        },
        body: JSON.stringify({
          country: step3Data.country,
          streetAddress: step3Data.streetAddress,
          city: step3Data.city,
          state: step3Data.state,
          postalCode: step3Data.postalCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationState((prev) => ({
          ...prev,
          step: 4,
        }));
        toast.success('Location details saved! Now upload your documents.');
      } else {
        setErrorMessage(data.message || 'Failed to save location details.');
        toast.error(data.message || 'Failed to save location details.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 3 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Document Upload
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!step4Data.governmentIdUrl || !step4Data.governmentIdNumber.trim()) {
      setErrorMessage('Government ID is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/seller/register/step-4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registrationState.token}`,
        },
        body: JSON.stringify({
          governmentIdType: step4Data.governmentIdType,
          governmentIdNumber: step4Data.governmentIdNumber,
          governmentIdUrl: step4Data.governmentIdUrl,
          governmentIdPublicId: step4Data.governmentIdPublicId,
          taxDocumentUrl: step4Data.taxDocumentUrl,
          taxDocumentPublicId: step4Data.taxDocumentPublicId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationState((prev) => ({
          ...prev,
          step: 5,
        }));
        toast.success('Documents uploaded! Please review and submit.');
      } else {
        setErrorMessage(data.message || 'Failed to upload documents.');
        toast.error(data.message || 'Failed to upload documents.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 4 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Review and Submit
  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!step5Data.termsAccepted || !step5Data.privacyAccepted) {
      setErrorMessage('You must accept the terms and privacy policy to continue');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/seller/register/step-5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registrationState.token}`,
        },
        body: JSON.stringify({
          termsAccepted: step5Data.termsAccepted,
          privacyAccepted: step5Data.privacyAccepted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationState((prev) => ({
          ...prev,
          step: 6,
        }));
        toast.success('Registration submitted successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to submit registration.');
        toast.error(data.message || 'Failed to submit registration.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 5 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (registrationState.step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Become a Seller
          </h1>
          <p className="text-gray-600">
            Join our seller community and start your business
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step < registrationState.step
                    ? 'bg-green-500 text-white'
                    : step === registrationState.step
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < registrationState.step ? (
                  <Check size={20} />
                ) : (
                  step
                )}
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Step 1: Basic Registration */}
          {registrationState.step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Step 1: Basic Information
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={step1Data.name}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, name: e.target.value })
                  }
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
                  value={step1Data.email}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, email: e.target.value })
                  }
                  placeholder="seller@example.com"
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
                  value={step1Data.phone}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, phone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 10 digits
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={step1Data.password}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, password: e.target.value })
                  }
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
                  value={step1Data.confirmPassword}
                  onChange={(e) =>
                    setStep1Data({
                      ...step1Data,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? 'Processing...' : 'Next: Upload Logo'}
                <ChevronRight size={20} />
              </button>
            </form>
          )}

          {/* Step 2: Logo Upload */}
          {registrationState.step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Step 2: Business Details & Logo
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={step2Data.companyName}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, companyName: e.target.value })
                  }
                  placeholder="Your Business Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  value={step2Data.businessType}
                  onChange={(e) =>
                    setStep2Data({
                      ...step2Data,
                      businessType: e.target.value,
                    })
                  }
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
                  value={step2Data.website}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Bio (Optional)
                </label>
                <textarea
                  value={step2Data.bio}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, bio: e.target.value })
                  }
                  placeholder="Tell customers about your business..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Logo Upload Component */}
              <ImageUpload
                onUploadComplete={(url, publicId) => {
                  setStep2Data({
                    ...step2Data,
                    logo: url,
                    logoPublicId: publicId,
                  });
                }}
                uploadType="logos"
                label="Company Logo *"
                preview={step2Data.logo}
                onRemove={() =>
                  setStep2Data({ ...step2Data, logo: '', logoPublicId: '' })
                }
              />

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setRegistrationState({
                      ...registrationState,
                      step: 1,
                    })
                  }
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
                  {isLoading ? 'Processing...' : 'Next: Verify Documents'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Document Upload */}
          {registrationState.step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Step 3: Government ID Verification
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={step3Data.documentType}
                  onChange={(e) =>
                    setStep3Data({
                      ...step3Data,
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
                <p className="text-xs text-gray-500 mt-1">
                  We accept passport or government-issued ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Number *
                </label>
                <input
                  type="text"
                  required
                  value={step3Data.documentNumber}
                  onChange={(e) =>
                    setStep3Data({
                      ...step3Data,
                      documentNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., 123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={step3Data.expiryDate}
                  onChange={(e) =>
                    setStep3Data({
                      ...step3Data,
                      expiryDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  title="Select expiration date"
                  aria-label="Expiration date"
                />
              </div>

              {/* Document Upload Component */}
              <ImageUpload
                onUploadComplete={(url, publicId) => {
                  setStep3Data({
                    ...step3Data,
                    documentUrl: url,
                    documentPublicId: publicId,
                  });
                }}
                uploadType="documents"
                label="Upload Government ID *"
                preview={step3Data.documentUrl}
                onRemove={() =>
                  setStep3Data({
                    ...step3Data,
                    documentUrl: '',
                    documentPublicId: '',
                  })
                }
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Privacy Notice:</strong> Your documents are securely
                  stored and only reviewed by our admin team for verification
                  purposes.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setRegistrationState({
                      ...registrationState,
                      step: 2,
                    })
                  }
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
                  {isLoading ? 'Processing...' : 'Submit for Verification'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {registrationState.step === 4 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="text-green-600" size={40} />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Registration Complete!
                </h2>
                <p className="text-gray-600">
                  Your seller account has been submitted for verification
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
                      Our admin team will review your documents and information
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-indigo-600">2.</span>
                    <span>
                      You'll receive an email notification within 24-48 hours
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-indigo-600">3.</span>
                    <span>
                      Once approved, you can start listing products immediately
                    </span>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Verification Email:</strong> A confirmation email has
                  been sent to <strong>{registrationState.email}</strong>
                </p>
              </div>

              <button
                onClick={() => router.push('/seller/dashboard')}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </button>

              <p className="text-sm text-gray-600">
                Questions? Contact our support team at support@aliexpress-clone.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
