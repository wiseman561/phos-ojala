import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import logo from '../assets/phos-logo.png';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../contexts/AuthContext';

// Navigation items with role restrictions
const getNavigation = (userRole) => {
  if (!userRole) return null;

  const basePath = `/${userRole}`;

  return [
    {
      name: 'Dashboard',
      href: `${basePath}/dashboard`,
      icon: HomeIcon,
      allowedRoles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.STAFF]
    },
    {
      name: 'Patients',
      href: `${basePath}/patients`,
      icon: UserGroupIcon,
      allowedRoles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE]
    },
    {
      name: 'Users',
      href: `${basePath}/users`,
      icon: UsersIcon,
      allowedRoles: [ROLES.ADMIN]
    },
    {
      name: 'Alerts',
      href: `${basePath}/alerts`,
      icon: BellIcon,
      allowedRoles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE]
    },
    {
      name: 'Audit Logs',
      href: `${basePath}/logs`,
      icon: ClipboardDocumentListIcon,
      allowedRoles: [ROLES.ADMIN]
    },
    {
      name: 'Settings',
      href: `${basePath}/settings`,
      icon: Cog6ToothIcon,
      allowedRoles: [ROLES.ADMIN]
    }
  ];
};

// Loading skeleton for navigation items
const NavigationSkeleton = () => (
  <div className="animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center px-2 py-2 mb-2">
        <div className="h-6 w-6 bg-gray-200 rounded mr-3" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    ))}
  </div>
);

export default function Sidebar() {
  const { hasRole, user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get navigation items based on user role
  const navigation = user?.role ? getNavigation(user.role) : null;

  // Filter navigation items based on user role
  const filteredNavigation = navigation?.filter(item => hasRole(item.allowedRoles)) || [];

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          type="button"
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block md:flex-shrink-0 fixed md:static inset-0 z-10`}>
        <div className="flex flex-col w-64 h-full">
          <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-md">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <img
                  src={logo}
                  alt="Ojalá Healthcare"
                  className="h-10 w-auto mx-auto"
                />
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {isLoading ? (
                  <NavigationSkeleton />
                ) : filteredNavigation.length > 0 ? (
                  filteredNavigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                          isActive
                            ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`mr-3 h-6 w-6 flex-shrink-0 ${
                              isActive
                                ? 'text-blue-600'
                                : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                          />
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No navigation items available
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 md:hidden z-0"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
