import { extractRolesFromUser } from '@/lib/auth/roles';
import { useAuth0User } from '@/lib/auth/auth0Client';

export function useUserRole() {
  const { user, isLoading } = useAuth0User();
  const { roles } = extractRolesFromUser(user);

  const hasRole = (role: string | string[]) => {
    const rolesArray = Array.isArray(role) ? role : [role];
    return rolesArray.some((r) => roles.includes(r.toLowerCase()));
  };

  const isSeller = roles.includes('seller');
  const isAdmin = roles.includes('admin');
  const isBuyer = roles.includes('buyer');

  return {
    roles,
    hasRole,
    isSeller,
    isAdmin,
    isBuyer,
    isLoading,
    user,
  };
}
