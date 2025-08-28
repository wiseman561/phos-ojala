import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const sessionTimeouts = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    sessionTimeout: 30,
    twoFactorEnabled: false,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('securitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('securitySettings', JSON.stringify(settings));
    // Show success message or handle API call here
  };

  const handlePasswordReset = () => {
    // Implement password reset logic here
    alert('Password reset functionality will be implemented here');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Security Settings</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account security preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Password Reset */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="mt-2">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset Password
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Change your password to keep your account secure
          </p>
        </div>

        {/* Session Timeout */}
        <div>
          <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Session Timeout
          </label>
          <select
            id="session-timeout"
            name="session-timeout"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {sessionTimeouts.map((timeout) => (
              <option key={timeout.value} value={timeout.value}>
                {timeout.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Automatically log out after a period of inactivity
          </p>
        </div>

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <label htmlFor="two-factor" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Two-Factor Authentication
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={settings.twoFactorEnabled}
            onChange={() => setSettings({ ...settings, twoFactorEnabled: !settings.twoFactorEnabled })}
            className={classNames(
              settings.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                settings.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
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
