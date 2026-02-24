// @ts-ignore
let useUser: any;
try {
  const auth0Client = require('@auth0/nextjs-auth0/client');
  useUser = auth0Client.useUser;
} catch (e) {
  useUser = () => ({ user: null, isLoading: false });
}

const ROLE_CLAIM = 'https://nextsells.example/roles';

export function useUserRole() {
  const { user, isLoading } = useUser();

  const roles = ((user?.[ROLE_CLAIM] as string[] | undefined) || []).map((r) =>
    r.toLowerCase()
  );

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
