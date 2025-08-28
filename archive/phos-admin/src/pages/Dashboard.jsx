import Card from '../components/Card';
import DashboardCards from '../components/DashboardCards';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h2>

      <DashboardCards />

      <Card title="Recent Activity" className="dark:bg-gray-800 dark:text-white">
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400">Loading activity data...</p>
        </div>
      </Card>
    </div>
  );
}
