import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

type SettingsPayload = {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
  minimumPayout: number;
  maintenanceMode: boolean;
  requireSellerApproval: boolean;
  notifyOnNewSeller: boolean;
  notifyOnLargeOrder: boolean;
};

const DEFAULT_SETTINGS: SettingsPayload = {
  platformName: 'Nextsells',
  supportEmail: 'support@nextsells.com',
  defaultCurrency: 'USD',
  commissionRate: 8,
  minimumPayout: 50,
  maintenanceMode: false,
  requireSellerApproval: true,
  notifyOnNewSeller: true,
  notifyOnLargeOrder: true,
};

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value_json JSONB NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function authorize(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { payload };
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    await ensureSettingsTable();

    const result = await query(
      `SELECT value_json AS value FROM admin_settings WHERE key = 'platform' LIMIT 1`
    );

    const dbValue = result.rows[0]?.value as Partial<SettingsPayload> | undefined;

    return NextResponse.json({
      success: true,
      data: {
        ...DEFAULT_SETTINGS,
        ...(dbValue || {}),
      },
    });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = authorize(request);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    await ensureSettingsTable();

    const body = (await request.json()) as Partial<SettingsPayload>;

    const sanitized: SettingsPayload = {
      platformName: String(body.platformName ?? DEFAULT_SETTINGS.platformName).trim() || DEFAULT_SETTINGS.platformName,
      supportEmail: String(body.supportEmail ?? DEFAULT_SETTINGS.supportEmail).trim() || DEFAULT_SETTINGS.supportEmail,
      defaultCurrency: String(body.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency).trim().toUpperCase().slice(0, 10) || DEFAULT_SETTINGS.defaultCurrency,
      commissionRate: Number.isFinite(Number(body.commissionRate)) ? Math.max(0, Number(body.commissionRate)) : DEFAULT_SETTINGS.commissionRate,
      minimumPayout: Number.isFinite(Number(body.minimumPayout)) ? Math.max(0, Number(body.minimumPayout)) : DEFAULT_SETTINGS.minimumPayout,
      maintenanceMode: Boolean(body.maintenanceMode),
      requireSellerApproval: Boolean(body.requireSellerApproval),
      notifyOnNewSeller: Boolean(body.notifyOnNewSeller),
      notifyOnLargeOrder: Boolean(body.notifyOnLargeOrder),
    };

    await query(
      `
        INSERT INTO admin_settings (key, value_json, updated_at)
        VALUES ('platform', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (key)
        DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = CURRENT_TIMESTAMP
      `,
      [JSON.stringify(sanitized)],
    );

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    console.error('Admin settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}