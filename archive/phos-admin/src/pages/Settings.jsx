import { useState, Suspense, lazy } from 'react';
import { Tab } from '@headlessui/react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';

// Lazy load components with error handling
const GeneralSettings = lazy(() => import('../components/settings/GeneralSettings').catch(() => ({
  default: () => <FallbackComponent name="General Settings" />
})));

const NotificationSettings = lazy(() => import('../components/settings/NotificationSettings').catch(() => ({
  default: () => <FallbackComponent name="Notification Settings" />
})));

const AppearanceSettings = lazy(() => import('../components/settings/AppearanceSettings').catch(() => ({
  default: () => <FallbackComponent name="Appearance Settings" />
})));

const SecuritySettings = lazy(() => import('../components/settings/SecuritySettings').catch(() => ({
  default: () => <FallbackComponent name="Security Settings" />
})));

const ProfileSettings = lazy(() => import('../components/settings/ProfileSettings').catch(() => ({
  default: () => <FallbackComponent name="Profile Settings" />
})));

const PlatformSettings = lazy(() => import('../components/settings/PlatformSettings').catch(() => ({
  default: () => <FallbackComponent name="Platform Controls" />
})));

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Fallback component for when a settings component fails to load
function FallbackComponent({ name }) {
  return (
    <div className="p-4 text-center">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{name}</h3>
      <p className="text-gray-500 dark:text-gray-400">
        This section is temporarily unavailable. Please try again later.
      </p>
    </div>
  );
}

// Loading component for Suspense fallback
function LoadingComponent() {
  return (
    <div className="p-4 text-center">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();

  // Define available tabs based on user role
  const availableTabs = [
    { name: 'Profile', component: ProfileSettings, roles: ['admin', 'provider', 'staff', 'patient'] },
    { name: 'General', component: GeneralSettings, roles: ['admin', 'provider', 'staff'] },
    { name: 'Notifications', component: NotificationSettings, roles: ['admin', 'provider', 'staff', 'patient'] },
    { name: 'Appearance', component: AppearanceSettings, roles: ['admin', 'provider', 'staff', 'patient'] },
    { name: 'Security', component: SecuritySettings, roles: ['admin', 'provider'] },
    { name: 'Platform Controls', component: PlatformSettings, roles: ['admin'] },
  ].filter(tab => tab.roles.includes(user?.role || 'patient'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your application settings and preferences
        </p>
      </div>

      <Card className="mt-6">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {availableTabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            {availableTabs.map((tab) => (
              <Tab.Panel
                key={tab.name}
                className={classNames(
                  'rounded-xl bg-white dark:bg-gray-800 p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                <Suspense fallback={<LoadingComponent />}>
                  <tab.component />
                </Suspense>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </Card>
    </div>
  );
}
