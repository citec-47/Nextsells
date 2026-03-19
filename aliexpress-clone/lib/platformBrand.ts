import 'server-only';

import { query } from '@/lib/db';
import { DEFAULT_PLATFORM_NAME } from '@/lib/platformBrandShared';

function normalizePlatformName(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_PLATFORM_NAME;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : DEFAULT_PLATFORM_NAME;
}

export async function getPlatformNameFromDatabase(): Promise<string> {
  try {
    const tableRes = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'admin_settings'
      ) AS exists
    `);

    const tableExists = Boolean(tableRes.rows[0]?.exists);
    if (!tableExists) {
      return DEFAULT_PLATFORM_NAME;
    }

    const nameRes = await query(
      `
        SELECT value_json->>'platformName' AS "platformName"
        FROM admin_settings
        WHERE key = 'platform'
        LIMIT 1
      `,
    );

    return normalizePlatformName(nameRes.rows[0]?.platformName);
  } catch (error) {
    console.error('Failed to load platform name:', error);
    return DEFAULT_PLATFORM_NAME;
  }
}