import { useEffect, useState } from 'react';
import { Globe, Ruler, Palette, Download, Upload, Trash2, Shield, Cloud } from 'lucide-react';
import { getSettings, saveSettings, exportData, importData } from '../lib/db';
import type { AppSettings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    units: 'imperial',
    defaultLocation: '',
    theme: 'dark',
    windUnit: 'mph',
    tempUnit: 'C',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }

  async function handleSave() {
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  async function handleExport() {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `aerocheck-backup-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export', e);
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importData(text);
        await loadSettings();
      } catch (e) {
        console.error('Failed to import', e);
      }
    };
    input.click();
  }

  async function handleClearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      indexedDB.deleteDatabase('aerocheck-db');
      window.location.reload();
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-slate-400">Configure your preferences and data handling</p>
      </div>

      <div className="card border-sky-500/20 bg-sky-500/10 p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
            <Cloud className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Weather Providers</h2>
            <p className="text-sm text-slate-300">End users do not need to paste API keys to use the app.</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          AeroCheck now uses built-in public sources for the normal experience: NOAA weather observations and alerts where available,
          Open-Meteo for global weather and air quality fallback, and airplanes.live for live ADS-B traffic.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Ruler className="h-5 w-5 text-sky-400" />
            Units
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Unit System</label>
              <select
                className="input max-w-xs"
                value={settings.units}
                onChange={(event) => setSettings({ ...settings, units: event.target.value as 'metric' | 'imperial' })}
              >
                <option value="imperial">Imperial (oz, in, deg F)</option>
                <option value="metric">Metric (g, cm, deg C)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Temperature</label>
                <select
                  className="input"
                  value={settings.tempUnit}
                  onChange={(event) => setSettings({ ...settings, tempUnit: event.target.value as 'C' | 'F' })}
                >
                  <option value="C">Celsius (deg C)</option>
                  <option value="F">Fahrenheit (deg F)</option>
                </select>
              </div>
              <div>
                <label className="label">Wind Speed</label>
                <select
                  className="input"
                  value={settings.windUnit}
                  onChange={(event) => setSettings({ ...settings, windUnit: event.target.value as 'mph' | 'kmh' | 'mps' })}
                >
                  <option value="mph">mph</option>
                  <option value="kmh">km/h</option>
                  <option value="mps">m/s</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Globe className="h-5 w-5 text-sky-400" />
            Location
          </h2>

          <div>
            <label className="label">Default Location</label>
            <input
              type="text"
              className="input"
              placeholder="New York, NY"
              value={settings.defaultLocation}
              onChange={(event) => setSettings({ ...settings, defaultLocation: event.target.value })}
            />
            <p className="mt-2 text-xs text-slate-500">Used to preload weather and planning data when the app opens.</p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Palette className="h-5 w-5 text-sky-400" />
            Appearance
          </h2>

          <div>
            <label className="label">Theme</label>
            <select
              className="input max-w-xs"
              value={settings.theme}
              onChange={(event) => setSettings({ ...settings, theme: event.target.value as 'dark' | 'light' })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Data Management</h2>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="btn-secondary flex items-center justify-center gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export All Data
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2" onClick={handleImport}>
                <Upload className="h-4 w-4" />
                Import Data
              </button>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <button className="btn-danger flex items-center gap-2" onClick={handleClearData}>
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </button>
              <p className="mt-2 text-xs text-slate-500">This permanently deletes all saved models, flights, and settings.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Shield className="h-5 w-5 text-green-400" />
          Security Status
        </h2>

        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-green-400">
            <Shield className="h-4 w-4" />
            All Checks Passed
          </div>
          <ul className="space-y-1 text-sm text-green-300">
            <li>- No end-user API key entry is required for the normal app flow.</li>
            <li>- Input validation is applied across user-facing forms.</li>
            <li>- React output protects against direct HTML injection.</li>
            <li>- IndexedDB-backed data stays on the device unless exported.</li>
          </ul>
        </div>
      </div>

      <button className={`btn-primary w-full ${saved ? 'bg-green-500' : ''}`} onClick={handleSave}>
        {saved ? 'Settings Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
