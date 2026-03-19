'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, RefreshCw, Save, Settings, Shield, Wallet } from 'lucide-react';
import { DEFAULT_PLATFORM_NAME } from '@/lib/platformBrandShared';
import { setCachedPlatformName } from '@/app/hooks/usePlatformBrand';

type SettingsState = {
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

const FALLBACK: SettingsState = {
  platformName: DEFAULT_PLATFORM_NAME,
  supportEmail: 'support@nextsells.com',
  defaultCurrency: 'USD',
  commissionRate: 8,
  minimumPayout: 50,
  maintenanceMode: false,
  requireSellerApproval: true,
  notifyOnNewSeller: true,
  notifyOnLargeOrder: true,
};

function ToggleRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export default function SettingsManagement() {
  const [settings, setSettings] = useState<SettingsState>(FALLBACK);
  const [baseline, setBaseline] = useState<SettingsState>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getToken = () => (typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await response.json();
      if (json.success) {
        setSettings(json.data);
        setBaseline(json.data);
        setCachedPlatformName(json.data.platformName);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(baseline), [settings, baseline]);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(settings),
      });
      const json = await response.json();
      if (json.success) {
        setSettings(json.data);
        setBaseline(json.data);
        setCachedPlatformName(json.data.platformName);
        setMessage('Settings saved successfully.');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Configure platform defaults, commerce controls, and admin notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={onSave}
            disabled={loading || saving || !dirty}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e2140] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#272a56] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Platform</h2>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Platform Name</span>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Support Email</span>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Default Currency</span>
            <input
              type="text"
              value={settings.defaultCurrency}
              onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value.toUpperCase() }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Commerce Rules</h2>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Commission Rate (%)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={settings.commissionRate}
              onChange={(e) => setSettings((s) => ({ ...s, commissionRate: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Minimum Payout</span>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.minimumPayout}
              onChange={(e) => setSettings((s) => ({ ...s, minimumPayout: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security & Access</h2>
          </div>

          <ToggleRow
            title="Maintenance Mode"
            description="Temporarily disable buyer and seller interactions."
            value={settings.maintenanceMode}
            onChange={(next) => setSettings((s) => ({ ...s, maintenanceMode: next }))}
          />

          <ToggleRow
            title="Require Seller Approval"
            description="New sellers must be manually reviewed before publishing products."
            value={settings.requireSellerApproval}
            onChange={(next) => setSettings((s) => ({ ...s, requireSellerApproval: next }))}
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Notifications</h2>
          </div>

          <ToggleRow
            title="Notify On New Seller"
            description="Send alert when a new seller submits onboarding documents."
            value={settings.notifyOnNewSeller}
            onChange={(next) => setSettings((s) => ({ ...s, notifyOnNewSeller: next }))}
          />

          <ToggleRow
            title="Notify On Large Order"
            description="Send alert when a high-value order is placed."
            value={settings.notifyOnLargeOrder}
            onChange={(next) => setSettings((s) => ({ ...s, notifyOnLargeOrder: next }))}
          />
        </section>
      </div>
    </div>
  );
}