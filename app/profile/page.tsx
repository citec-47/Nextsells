import { requireAuth } from '@/lib/auth/protectedRoutes';
import ProfileSettingsClient from '@/app/components/profile/ProfileSettingsClient';

export const metadata = {
  title: 'Profile Settings | Nextsells',
  description: 'Manage your profile and settings',
};

export default async function ProfilePage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <ProfileSettingsClient />
      </div>
    </div>
  );
}
