import { useState } from 'react';
import Card from '../components/Card';

// Mock initial audit logs data
const initialLogs = [
  {
    id: 'LOG001',
    timestamp: '2024-03-15T10:30:00Z',
    user: 'John Doe',
    action: 'Login',
    details: 'Successful login from 192.168.1.1',
    ipAddress: '192.168.1.1'
  },
  {
    id: 'LOG002',
    timestamp: '2024-03-15T11:15:00Z',
    user: 'Jane Smith',
    action: 'Update Patient',
    details: 'Updated patient record #12345',
    ipAddress: '192.168.1.2'
  },
  {
    id: 'LOG003',
    timestamp: '2024-03-15T12:00:00Z',
    user: 'Admin User',
    action: 'Create Alert',
    details: 'Created high priority alert for patient #67890',
    ipAddress: '192.168.1.3'
  }
];

export default function Logs() {
  const [logs] = useState(initialLogs);

  const handleExport = () => {
    // Define CSV headers
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details', 'IP Address'];

    // Format logs for CSV
    const csvRows = [
      headers.join(','), // Header row
      ...logs.map(log => [
        log.id,
        new Date(log.timestamp).toLocaleString(),
        log.user,
        log.action,
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in details
        log.ipAddress
      ].join(','))
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Set filename with current date
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${date}.csv`);

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit Logs</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Export
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
            Filter
          </button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
