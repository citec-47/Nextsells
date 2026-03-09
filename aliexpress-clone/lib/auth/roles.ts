export const ROLE_CLAIMS = [
  'https://nextsells.example/roles',
  'https://aliexpress-clone/roles',
  'roles',
] as const;

export type ExtractedRoles = {
  roles: string[];
  sources: string[];
  metadataRoles: string[];
};

const normalizeRoles = (roles: string[]) => {
  const normalized = roles
    .map((role) => role.toLowerCase().trim())
    .filter((role) => role.length > 0);

  return Array.from(new Set(normalized));
};

export const extractRolesFromUser = (
  user: Record<string, unknown> | null | undefined
): ExtractedRoles => {
  if (!user) {
    return { roles: [], sources: [], metadataRoles: [] };
  }

  const collected: string[] = [];
  const sources: string[] = [];

  ROLE_CLAIMS.forEach((claim) => {
    const value = (user as Record<string, unknown>)[claim];
    if (Array.isArray(value)) {
      collected.push(...value.map(String));
      sources.push(claim);
      return;
    }
    if (typeof value === 'string') {
      collected.push(value);
      sources.push(claim);
    }
  });

  const appMetadataRoles = (user as any)?.app_metadata?.roles;
  const userMetadataRoles = (user as any)?.user_metadata?.roles;
  const metadataRoles: string[] = [];

  if (Array.isArray(appMetadataRoles)) {
    metadataRoles.push(...appMetadataRoles.map(String));
    sources.push('app_metadata.roles');
  } else if (typeof appMetadataRoles === 'string') {
    metadataRoles.push(appMetadataRoles);
    sources.push('app_metadata.roles');
  }

  if (Array.isArray(userMetadataRoles)) {
    metadataRoles.push(...userMetadataRoles.map(String));
    sources.push('user_metadata.roles');
  } else if (typeof userMetadataRoles === 'string') {
    metadataRoles.push(userMetadataRoles);
    sources.push('user_metadata.roles');
  }

  collected.push(...metadataRoles);

  return {
    roles: normalizeRoles(collected),
    sources: Array.from(new Set(sources)),
    metadataRoles: normalizeRoles(metadataRoles),
  };
};
