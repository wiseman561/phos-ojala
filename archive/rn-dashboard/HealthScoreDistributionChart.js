import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  Box,
  Typography,
  LinearProgress,
  useTheme
} from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Health Score Distribution Chart Component
 * 
 * Displays a bar chart showing the distribution of health scores
 * across the patient population.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Health score distribution data
 * @param {boolean} props.loading - Loading state
 */
const HealthScoreDistributionChart = ({ data = [], loading = false }) => {
  const theme = useTheme();

  // Prepare chart data
  const chartData = {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [
      {
        label: 'Patients',
        data: data.length > 0 ? data : [5, 15, 35, 30, 15], // Default data if none provided
        backgroundColor: [
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.primary.main,
          theme.palette.success.main,
        ],
        borderColor: [
          theme.palette.error.dark,
          theme.palette.warning.dark,
          theme.palette.info.dark,
          theme.palette.primary.dark,
          theme.palette.success.dark,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            const item = tooltipItems[0];
            return `Health Score: ${item.label}`;
          },
          label: function(context) {
            return `${context.raw} patients`;
          },
          footer: function(tooltipItems) {
            const item = tooltipItems[0];
            const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = ((item.raw / total) * 100).toFixed(1);
            return `${percentage}% of total patients`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Health Score Range',
          color: theme.palette.text.secondary,
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
        },
        title: {
          display: true,
          text: 'Number of Patients',
          color: theme.palette.text.secondary,
          font: {
            size: 12,
          },
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Calculate total patients and average score
  const calculateStats = () => {
    if (data.length === 0) {
      // Use default data if none provided
      const defaultData = [5, 15, 35, 30, 15];
      const total = defaultData.reduce((a, b) => a + b, 0);
      
      // Calculate weighted average
      const scoreRanges = [10, 30, 50, 70, 90]; // Midpoints of each range
      const weightedSum = defaultData.reduce((sum, count, index) => {
        return sum + (count * scoreRanges[index]);
      }, 0);
      
      const average = (weightedSum / total).toFixed(1);
      
      return { total, average };
    } else {
      const total = data.reduce((a, b) => a + b, 0);
      
      // Calculate weighted average
      const scoreRanges = [10, 30, 50, 70, 90]; // Midpoints of each range
      const weightedSum = data.reduce((sum, count, index) => {
        return sum + (count * scoreRanges[index]);
      }, 0);
      
      const average = (weightedSum / total).toFixed(1);
      
      return { total, average };
    }
  };

  const { total, average } = calculateStats();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', p: 0 }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading health score data...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: '100%', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 10, right: 16, zIndex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary">
                  Total Patients
                </Typography>
                <Typography variant="h6">
                  {total.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Average Score
                </Typography>
                <Typography variant="h6" color={
                  average < 40 ? 'error.main' :
                  average < 60 ? 'warning.main' :
                  average < 80 ? 'primary.main' :
                  'success.main'
                }>
                  {average}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 3, height: '100%' }}>
              <Bar data={chartData} options={chartOptions} />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthScoreDistributionChart;
