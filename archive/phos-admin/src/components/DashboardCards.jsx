import {
  UsersIcon,
  UserGroupIcon,
  BellIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const metrics = [
  {
    name: 'Total Users',
    value: '2,413',
    icon: UsersIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Active Patients',
    value: '127',
    icon: UserGroupIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Alerts Today',
    value: '5',
    icon: BellIcon,
    color: 'bg-red-500',
  },
  {
    name: 'Audit Logs',
    value: '913',
    icon: ClipboardDocumentListIcon,
    color: 'bg-purple-500',
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {metrics.map((metric) => (
        <div
          key={metric.name}
          className="bg-white rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${metric.color} bg-opacity-10`}>
              <metric.icon className={`h-6 w-6 ${metric.color.replace('bg-', 'text-')}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
