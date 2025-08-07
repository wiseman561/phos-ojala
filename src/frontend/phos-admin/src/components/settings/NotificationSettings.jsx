import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklySummaries: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    // Show success message or handle API call here
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Notification Settings</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure how you want to receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <label htmlFor="email-alerts" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Alerts
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive important updates via email</p>
          </div>
          <Switch
            checked={settings.emailAlerts}
            onChange={() => toggleSetting('emailAlerts')}
            className={classNames(
              settings.emailAlerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                settings.emailAlerts ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>

        {/* SMS Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <label htmlFor="sms-alerts" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              SMS Alerts
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive urgent notifications via SMS</p>
          </div>
          <Switch
            checked={settings.smsAlerts}
            onChange={() => toggleSetting('smsAlerts')}
            className={classNames(
              settings.smsAlerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                settings.smsAlerts ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>

        {/* Weekly Summaries */}
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <label htmlFor="weekly-summaries" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Weekly Summaries
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly activity summaries</p>
          </div>
          <Switch
            checked={settings.weeklySummaries}
            onChange={() => toggleSetting('weeklySummaries')}
            className={classNames(
              settings.weeklySummaries ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                settings.weeklySummaries ? 'translate-x-5' : 'translate-x-0',
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
