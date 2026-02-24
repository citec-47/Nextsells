'use client';

import { useState, useEffect } from 'react';
// @ts-ignore
let useUser: any;
try {
  const m = require('@auth0/nextjs-auth0/client');
  useUser = m.useUser;
} catch (e) {
  useUser = () => ({ user: null, isLoading: false });
}
import Image from 'next/image';

interface ProfileData {
  name: string;
  email: string;
  picture: string;
  bio?: string;
  phone?: string;
  address?: string;
}

export default function ProfileSettingsClient() {
  const { user, isLoading } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        picture: user.picture || '',
        bio: '',
        phone: '',
        address: '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'user_avatars');

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              picture: data.secure_url,
            }
          : null
      );

      setSuccess('Avatar updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          phone: profile.phone,
          address: profile.address,
          picture: profile.picture,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">Please log in to view your profile</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-4 mb-4 bg-green-100 text-green-700 rounded">{success}</div>}

      {profile && (
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {profile.picture && (
                <Image
                  src={profile.picture}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <label className="block mb-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                  id="avatar-input"
                  title="Select avatar image"
                  aria-label="Select avatar image"
                />
                <button
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  disabled={isUploadingAvatar}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                </button>
              </label>
              <p className="text-sm text-gray-500">JPG, PNG up to 10MB</p>
            </div>
          </div>

          {/* Profile Fields */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={profile.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Street address, city, state"
                  value={profile.address || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg">{profile.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{profile.email}</p>
              </div>

              {profile.bio && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bio</label>
                  <p className="text-lg">{profile.bio}</p>
                </div>
              )}

              {profile.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{profile.phone}</p>
                </div>
              )}

              {profile.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg">{profile.address}</p>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

