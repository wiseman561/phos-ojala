import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { getSettings, saveSettings, defaultSettings } from '../../utils/settingsStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useMaintenanceMode } from '../../hooks/useMaintenanceMode';
import { toast } from 'react-hot-toast';

const roles = [
  { id: 'admin', name: 'Administrator', description: 'Full system access and control' },
  { id: 'provider', name: 'Healthcare Provider', description: 'Access to patient records and scheduling' },
  { id: 'staff', name: 'Staff', description: 'Limited access to assigned tasks and records' },
  { id: 'patient', name: 'Patient', description: 'Access to personal records and appointments' },
];

const retentionPeriods = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function PlatformSettings() {
  const { user } = useAuth();
  const { isMaintenanceMode, toggleMaintenanceMode } = useMaintenanceMode();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    autoExport: false,
    auditLogRetention: 30,
    ...defaultSettings.platform
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredSettings = async () => {
      try {
        const storedSettings = await getSettings('PLATFORM');
        if (storedSettings) {
          setSettings(prev => ({
            ...prev,
            ...storedSettings
          }));
        }
      } catch (error) {
        console.error('Error loading platform settings:', error);
        toast.error('Failed to load platform settings');
      } finally {
        setLoading(false);
      }
    };

    loadStoredSettings();
  }, []);

  const handleMaintenanceModeToggle = async (enabled) => {
    try {
      await toggleMaintenanceMode(enabled);
      setSettings(prev => ({
        ...prev,
        maintenanceMode: enabled
      }));
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Failed to update maintenance mode');
    }
  };

  const handleAutoExportToggle = async (enabled) => {
    try {
      const updatedSettings = {
        ...settings,
        autoExport: enabled
      };
      const success = await saveSettings('PLATFORM', updatedSettings);
      if (success) {
        setSettings(updatedSettings);
        toast.success(`Auto-export ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save platform settings' });
      }
    } catch (error) {
      console.error('Error updating auto-export setting:', error);
      toast.error('Failed to update auto-export setting');
    }
  };

  const handleAuditLogRetentionChange = async (days) => {
    try {
      const updatedSettings = {
        ...settings,
        auditLogRetention: days
      };
      const success = await saveSettings('PLATFORM', updatedSettings);
      if (success) {
        setSettings(updatedSettings);
        toast.success('Audit log retention period updated');
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save platform settings' });
      }
    } catch (error) {
      console.error('Error updating audit log retention:', error);
      toast.error('Failed to update audit log retention period');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const success = await saveSettings('PLATFORM', settings);
      if (success) {
        setSaveStatus({ type: 'success', message: 'Platform settings saved successfully' });
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save platform settings' });
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'An error occurred while saving settings' });
    } finally {
      setIsSaving(false);
    }
  };

  // Only render if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-500 dark:text-gray-400">
          You do not have permission to access platform controls.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Platform Controls</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage platform-wide settings and maintenance mode.
        </p>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode */}
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Maintenance Mode</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enable to restrict access to non-admin users
            </p>
          </div>
          <Switch
            checked={isMaintenanceMode}
            onChange={handleMaintenanceModeToggle}
            className={classNames(
              isMaintenanceMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                isMaintenanceMode ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>

        {/* Role Management */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Role Management</h4>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                    Role
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Description
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                      {role.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {role.description}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      Active
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Export Preferences */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Data Export Preferences</h4>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically export data to CSV format
              </p>
            </div>
            <Switch
              checked={settings.autoExport}
              onChange={handleAutoExportToggle}
              className={classNames(
                settings.autoExport ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              <span
                className={classNames(
                  settings.autoExport ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </div>
        </div>

        {/* Audit Log Retention */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Audit Log Retention</h4>
          <select
            value={settings.auditLogRetention}
            onChange={(e) => handleAuditLogRetentionChange(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {retentionPeriods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Status Message */}
        {saveStatus && (
          <div
            className={`mt-4 p-4 rounded-md ${
              saveStatus.type === 'success'
                ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {saveStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}
