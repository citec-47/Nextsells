'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  { step: 1, title: 'Personal Info', description: 'Basic information about you and your business' },
  { step: 2, title: 'Upload Logo', description: 'Upload your company logo' },
  { step: 3, title: 'Verification Documents', description: 'Submit identity and business documents' },
];

interface FormData {
  companyName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
  website: string;
  bio: string;
  logo: File | null;
  nationalId: File | null;
  businessLicense: File | null;
}

export default function SellerOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    businessType: 'Sole Proprietor',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    website: '',
    bio: '',
    logo: null,
    nationalId: null,
    businessLicense: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'logo' | 'nationalId' | 'businessLicense'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fileType]: file,
      }));
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.companyName.trim()) {
          toast.error('Company name is required');
          return false;
        }
        if (!formData.businessAddress.trim()) {
          toast.error('Business address is required');
          return false;
        }
        if (!formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
          toast.error('City, state, and zip code are required');
          return false;
        }
        return true;
      case 2:
        if (!formData.logo) {
          toast.error('Please upload a company logo');
          return false;
        }
        return true;
      case 3:
        if (!formData.nationalId) {
          toast.error('Please upload your national ID');
          return false;
        }
        if (!formData.businessLicense) {
          toast.error('Please upload your business license');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);
    try {
      const uploadFormData = new FormData();

      // Add basic info
      uploadFormData.append('companyName', formData.companyName);
      uploadFormData.append('businessType', formData.businessType);
      uploadFormData.append('businessAddress', formData.businessAddress);
      uploadFormData.append('city', formData.city);
      uploadFormData.append('state', formData.state);
      uploadFormData.append('zipCode', formData.zipCode);
      uploadFormData.append('country', formData.country);
      uploadFormData.append('taxId', formData.taxId);
      uploadFormData.append('website', formData.website);
      uploadFormData.append('bio', formData.bio);

      // Add files
      if (formData.logo) uploadFormData.append('logo', formData.logo);
      if (formData.nationalId) uploadFormData.append('nationalId', formData.nationalId);
      if (formData.businessLicense) uploadFormData.append('businessLicense', formData.businessLicense);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/seller/onboarding', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Onboarding completed! Awaiting admin approval.');
      } else {
        toast.error(data.error || 'Onboarding failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred while submitting your application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((s, index) => (
              <div key={s.step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= s.step
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s.step}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > s.step ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Info */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {steps[currentStep - 1].title}
            </h1>
            <p className="text-gray-600 mt-2">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name *"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option>Sole Proprietor</option>
                  <option>Partnership</option>
                  <option>LLC</option>
                  <option>Corporation</option>
                </select>
              </div>

              <input
                type="text"
                name="businessAddress"
                placeholder="Business Address *"
                value={formData.businessAddress}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City *"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State *"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Zip Code *"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <input
                type="text"
                name="taxId"
                placeholder="Tax ID (Optional)"
                value={formData.taxId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              <input
                type="url"
                name="website"
                placeholder="Website (Optional)"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              <textarea
                name="bio"
                placeholder="Business Bio (Optional)"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Step 2: Logo Upload */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="hidden"
                />
                <label htmlFor="logo" className="cursor-pointer">
                  <div className="text-gray-600">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="font-semibold">Click to upload your logo</p>
                    <p className="text-sm text-gray-500">PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </label>
                {formData.logo && (
                  <div className="mt-4 text-green-600">
                    ✓ {formData.logo.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Verification Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  National ID / Passport *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    id="nationalId"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'nationalId')}
                    className="hidden"
                  />
                  <label htmlFor="nationalId" className="cursor-pointer block">
                    <p className="text-gray-600 text-center">
                      {formData.nationalId ? `✓ ${formData.nationalId.name}` : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business License / Registration *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    id="businessLicense"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'businessLicense')}
                    className="hidden"
                  />
                  <label htmlFor="businessLicense" className="cursor-pointer block">
                    <p className="text-gray-600 text-center">
                      {formData.businessLicense
                        ? `✓ ${formData.businessLicense.name}`
                        : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your documents will be verified by our admin team.
                  This usually takes 2-3 business days.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
