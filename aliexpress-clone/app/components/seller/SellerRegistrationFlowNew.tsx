'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  MapPin,
  FileCheck,
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
  governmentIdExpiration: string;
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

interface Step5Data {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

const BUSINESS_TYPES = [
  'Sole Proprietor',
  'Partnership',
  'LLC',
  'Corporation',
  'Non-Profit',
  'Other',
];

const ID_TYPES = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
];

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'India',
  'Germany',
  'France',
  'Other',
];

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

  // Step 3 data
  const [step3Data, setStep3Data] = useState<Step3Data>({
    country: 'United States',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Step 4 data
  const [step4Data, setStep4Data] = useState<Step4Data>({
    governmentIdUrl: '',
    governmentIdPublicId: '',
    governmentIdType: 'PASSPORT',
    governmentIdNumber: '',
    governmentIdExpiration: '',
    taxDocumentUrl: '',
    taxDocumentPublicId: '',
  });

  // Step 5 data
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
        setRegistrationState((prev) => ({
          ...prev,
          step: 2,
          token: data.token,
          userId: data.userId,
          email: step1Data.email,
        }));
        toast.success('Account created! Now tell us about your business.');
      } else {
        setErrorMessage(data.message || 'Registration failed');
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 1 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Business Information
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!step2Data.companyName.trim()) {
      setErrorMessage('Company name is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/seller/register/step-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registrationState.token}`,
        },
        body: JSON.stringify({
          companyName: step2Data.companyName,
          businessType: step2Data.businessType,
          website: step2Data.website || undefined,
          bio: step2Data.bio || undefined,
          logoUrl: step2Data.logo,
          logoPublicId: step2Data.logoPublicId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationState((prev) => ({
          ...prev,
          step: 3,
          sellerId: data.sellerId,
        }));
        toast.success('Business details saved! Now add your location.');
      } else {
        setErrorMessage(data.message || 'Failed to save business details');
        toast.error(data.message || 'Failed to save business details');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 2 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Location
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !step3Data.country ||
      !step3Data.streetAddress.trim() ||
      !step3Data.city.trim() ||
      !step3Data.state.trim() ||
      !step3Data.postalCode.trim()
    ) {
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
        toast.success('Location saved! Now upload your documents.');
      } else {
        setErrorMessage(data.message || 'Failed to save location');
        toast.error(data.message || 'Failed to save location');
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
          governmentIdNumber: step4Data.governmentIdNumber,
          governmentIdType: step4Data.governmentIdType,
          governmentIdExpiration: step4Data.governmentIdExpiration,
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
        toast.success('Documents uploaded! Review and submit your registration.');
      } else {
        setErrorMessage(data.message || 'Failed to upload documents');
        toast.error(data.message || 'Failed to upload documents');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 4 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Review & Submit
  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!step5Data.termsAccepted) {
      setErrorMessage('You must accept the terms and conditions');
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
        router.push('/seller/dashboard');
      } else {
        setErrorMessage(data.message || 'Failed to submit registration');
        toast.error(data.message || 'Failed to submit registration');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Step 5 error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (registrationState.step / 5) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Become a Seller</h1>
          <p className="text-gray-600">
            Join NextSells and grow your business today
          </p>
        </div>

        {/* Main Layout: Sidebar + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Registration Steps</h3>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Account', icon: <Lock size={20} /> },
                  { step: 2, title: 'Business', icon: <Building2 size={20} /> },
                  { step: 3, title: 'Location', icon: <MapPin size={20} /> },
                  { step: 4, title: 'Documents', icon: <FileCheck size={20} /> },
                  { step: 5, title: 'Review', icon: <Check size={20} /> },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      item.step < registrationState.step
                        ? 'bg-green-50 border-2 border-green-500'
                        : item.step === registrationState.step
                          ? 'bg-blue-50 border-2 border-blue-600'
                          : 'bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        item.step < registrationState.step
                          ? 'bg-green-500 text-white'
                          : item.step === registrationState.step
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {item.step < registrationState.step ? '✓' : item.step}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        item.step === registrationState.step
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-600">Progress</span>
                  <span className="text-xs font-bold text-blue-600">
                    {registrationState.step} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-8">
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* Step 1: Account Information */}
              {registrationState.step === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Step 1: Account Information
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Create your seller account with a secure password
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="Min 8 chars with uppercase, lowercase, number & special char"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must contain uppercase, lowercase, number & special character (!@#$%^&*)
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
                        placeholder="Re-enter password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Processing...' : 'Next Step'}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Business Information */}
              {registrationState.step === 2 && (
                <form onSubmit={handleStep2Submit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Step 2: Business Information
                    </h2>
                    <p className="text-gray-600 mb-6">Tell us about your business</p>
                  </div>

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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="businessTypes"
                        value={step2Data.businessType}
                        onChange={(e) =>
                          setStep2Data({ ...step2Data, businessType: e.target.value })
                        }
                        placeholder="e.g., Sole Proprietor"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <datalist id="businessTypes">
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: Sole Proprietor, Partnership, LLC, Corporation
                    </p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Description (Optional)
                    </label>
                    <textarea
                      value={step2Data.bio}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, bio: e.target.value })
                      }
                      placeholder="Tell customers about your business, products, and values..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Business Logo (Optional)
                    </label>
                    <ImageUpload
                      onUploadComplete={(url, publicId) => {
                        setStep2Data({
                          ...step2Data,
                          logo: url,
                          logoPublicId: publicId,
                        });
                        toast.success('Logo uploaded successfully');
                      }}
                    />
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setRegistrationState((prev) => ({
                          ...prev,
                          step: 1,
                        }))
                      }
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Processing...' : 'Next Step'}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Location */}
              {registrationState.step === 3 && (
                <form onSubmit={handleStep3Submit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Step 3: Business Location
                    </h2>
                    <p className="text-gray-600 mb-6">Where is your business located?</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="countries"
                        value={step3Data.country}
                        onChange={(e) =>
                          setStep3Data({ ...step3Data, country: e.target.value })
                        }
                        placeholder="Select or type your country"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <datalist id="countries">
                        {COUNTRIES.map((country) => (
                          <option key={country} value={country} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={step3Data.streetAddress}
                      onChange={(e) =>
                        setStep3Data({ ...step3Data, streetAddress: e.target.value })
                      }
                      placeholder="123 Business Street"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={step3Data.city}
                        onChange={(e) =>
                          setStep3Data({ ...step3Data, city: e.target.value })
                        }
                        placeholder="New York"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        required
                        value={step3Data.state}
                        onChange={(e) =>
                          setStep3Data({ ...step3Data, state: e.target.value })
                        }
                        placeholder="NY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={step3Data.postalCode}
                        onChange={(e) =>
                          setStep3Data({ ...step3Data, postalCode: e.target.value })
                        }
                        placeholder="10001"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setRegistrationState((prev) => ({
                          ...prev,
                          step: 2,
                        }))
                      }
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Processing...' : 'Next Step'}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Documents */}
              {registrationState.step === 4 && (
                <form onSubmit={handleStep4Submit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Step 4: Document Verification
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Upload your government ID for verification
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ID Type *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="idTypes"
                        value={
                          ID_TYPES.find((t) => t.value === step4Data.governmentIdType)
                            ?.label || step4Data.governmentIdType
                        }
                        onChange={(e) => {
                          const selected = ID_TYPES.find(
                            (t) => t.label === e.target.value
                          );
                          if (selected) {
                            setStep4Data({
                              ...step4Data,
                              governmentIdType: selected.value as any,
                            });
                          }
                        }}
                        placeholder="Select ID type"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <datalist id="idTypes">
                        {ID_TYPES.map((type) => (
                          <option key={type.value} value={type.label} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ID Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={step4Data.governmentIdNumber}
                        onChange={(e) =>
                          setStep4Data({
                            ...step4Data,
                            governmentIdNumber: e.target.value,
                          })
                        }
                        placeholder="e.g., 123456789"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={step4Data.governmentIdExpiration}
                        onChange={(e) =>
                          setStep4Data({
                            ...step4Data,
                            governmentIdExpiration: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Upload ID Document *
                    </label>
                    <ImageUpload
                      onUploadComplete={(url, publicId) => {
                        setStep4Data({
                          ...step4Data,
                          governmentIdUrl: url,
                          governmentIdPublicId: publicId,
                        });
                        toast.success('ID document uploaded successfully');
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tax Document (Optional)
                    </label>
                    <ImageUpload
                      onUploadComplete={(url, publicId) => {
                        setStep4Data({
                          ...step4Data,
                          taxDocumentUrl: url,
                          taxDocumentPublicId: publicId,
                        });
                        toast.success('Tax document uploaded successfully');
                      }}
                    />
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setRegistrationState((prev) => ({
                          ...prev,
                          step: 3,
                        }))
                      }
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Processing...' : 'Next Step'}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 5: Review & Submit */}
              {registrationState.step === 5 && (
                <form onSubmit={handleStep5Submit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Step 5: Review & Submit
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Please review your information and accept the terms
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Account Email:</span>
                      <p className="font-semibold text-gray-900">
                        {registrationState.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Company:</span>
                      <p className="font-semibold text-gray-900">
                        {step2Data.companyName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <p className="font-semibold text-gray-900">
                        {step3Data.city}, {step3Data.state} from {step3Data.country}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        required
                        checked={step5Data.termsAccepted}
                        onChange={(e) =>
                          setStep5Data({
                            ...step5Data,
                            termsAccepted: e.target.checked,
                          })
                        }
                        className="mt-1 w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a
                          href="#"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Terms and Conditions
                        </a>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={step5Data.privacyAccepted}
                        onChange={(e) =>
                          setStep5Data({
                            ...step5Data,
                            privacyAccepted: e.target.checked,
                          })
                        }
                        className="mt-1 w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a
                          href="#"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setRegistrationState((prev) => ({
                          ...prev,
                          step: 4,
                        }))
                      }
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Registration'}
                      <Check size={20} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
