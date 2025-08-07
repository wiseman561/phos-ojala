import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const themes = [
  { id: 'light', name: 'Light', icon: SunIcon },
  { id: 'dark', name: 'Dark', icon: MoonIcon },
  { id: 'system', name: 'System', icon: ComputerDesktopIcon },
];

export default function AppearanceSettings() {
  const [settings, setSettings] = useState({
    theme: 'system',
    fontScale: 100,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appearanceSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('appearanceSettings', JSON.stringify(settings));
    // Apply theme changes
    document.documentElement.classList.remove('light', 'dark');
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(settings.theme);
    }
    // Apply font scaling
    document.documentElement.style.fontSize = `${settings.fontScale}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Appearance Settings</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize how the application looks
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: theme.id })}
                  className={`
                    relative flex items-center justify-center rounded-lg border p-4 focus:outline-none
                    ${
                      settings.theme === theme.id
                        ? 'border-blue-500 ring-2 ring-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  <Icon className="h-6 w-6 text-gray-900 dark:text-white" />
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Scaling */}
        <div>
          <label htmlFor="font-scale" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Font Size
          </label>
          <div className="mt-2 flex items-center space-x-4">
            <input
              type="range"
              id="font-scale"
              name="font-scale"
              min="80"
              max="120"
              step="10"
              value={settings.fontScale}
              onChange={(e) => setSettings({ ...settings, fontScale: parseInt(e.target.value) })}
              className="h-2 w-full rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">{settings.fontScale}%</span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Adjust the size of text throughout the application
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
