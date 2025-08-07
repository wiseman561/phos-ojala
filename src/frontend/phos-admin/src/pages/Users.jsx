import { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import AddUserModal from '../components/AddUserModal';
import SearchAndFilter from '../components/SearchAndFilter';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Storage key for localStorage
const USER_STORAGE_KEY = 'phos_admin_users';
const USERS_PER_PAGE = 10;

// Mock initial users data
const initialUsers = [
  {
    id: 'U001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'Active'
  },
  {
    id: 'U002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Provider',
    status: 'Active'
  },
  {
    id: 'U003',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    role: 'Nurse',
    status: 'Inactive'
  },
  {
    id: 'U004',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    role: 'Provider',
    status: 'Active'
  }
];

// Role options for filter
const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Provider', label: 'Provider' },
  { value: 'Nurse', label: 'Nurse' },
  { value: 'Staff', label: 'Staff' }
];

// Helper function to save users to localStorage
const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
    // You might want to show a user-friendly error message here
  }
};

// Helper function to load users from localStorage
const loadUsersFromStorage = () => {
  try {
    const storedUsers = localStorage.getItem(USER_STORAGE_KEY);
    return storedUsers ? JSON.parse(storedUsers) : null;
  } catch (error) {
    console.error('Error loading users from localStorage:', error);
    return null;
  }
};

// Helper function to export users to CSV
const exportUsersToCSV = (users) => {
  const headers = ['ID', 'Name', 'Email', 'Role', 'Status'];
  const csvRows = [
    headers.join(','),
    ...users.map(user => [
      user.id,
      `"${user.name.replace(/"/g, '""')}"`,
      `"${user.email.replace(/"/g, '""')}"`,
      user.role,
      user.status
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `users-${date}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load users from localStorage on component mount
  useEffect(() => {
    const storedUsers = loadUsersFromStorage();
    if (storedUsers) {
      setUsers(storedUsers);
    } else {
      // If no stored users, save initial users
      setUsers(initialUsers);
      saveUsersToStorage(initialUsers);
    }
  }, []);

  const handleAddUser = (newUser) => {
    if (editingUser) {
      // Update existing user
      const updatedUsers = users.map(user =>
        user.id === editingUser.id ? { ...user, ...newUser } : user
      );
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
    } else {
      // Add new user
      const userId = `U${String(users.length + 1).padStart(3, '0')}`;
      const userToAdd = { ...newUser, id: userId };
      const updatedUsers = [...users, userToAdd];
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
    }

    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (userId) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
        : user
    );
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
  };

  const handleExport = () => {
    exportUsersToCSV(filteredUsers);
  };

  // Filter users based on search term and selected role
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = searchTerm === '' ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === '' || user.role === selectedRole;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, searchTerm, selectedRole]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Export
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
          >
            Add User
          </button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <SearchAndFilter
            onSearch={setSearchTerm}
            onFilter={setSelectedRole}
            filterOptions={roleOptions}
            filterLabel="Role"
            placeholder="Search users by name or email..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className={user.status === 'Inactive' ? 'opacity-75' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${user.status === 'Inactive' ? 'text-gray-500 dark:text-gray-400 italic' : 'text-gray-900 dark:text-white'}`}>
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900 dark:border-primary-400 dark:text-primary-300'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleAddUser}
        initialData={editingUser}
      />
    </div>
  );
}
