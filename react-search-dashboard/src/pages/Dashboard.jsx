import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import MetricCard from '../components/dashboard/MetricCard';
import ChartWidget from '../components/dashboard/ChartWidget';
import RecentActivity from '../components/dashboard/RecentActivity';
import './Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { metrics, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-state">Error loading dashboard: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="refresh-btn" onClick={() => dispatch(fetchDashboardData())}>
          🔄 Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Records"
          value={metrics.totalRecords.toLocaleString()}
          icon="📊"
          trend={metrics.trends.totalRecords}
          color="#1976d2"
        />
        <MetricCard
          title="Active Records"
          value={metrics.activeRecords.toLocaleString()}
          icon="✅"
          trend={metrics.trends.activeRecords}
          color="#4caf50"
        />
        <MetricCard
          title="Pending Records"
          value={metrics.pendingRecords.toLocaleString()}
          icon="⏳"
          trend={metrics.trends.pendingRecords}
          color="#ff9800"
        />
        <MetricCard
          title="Completed Records"
          value={metrics.completedRecords.toLocaleString()}
          icon="🎯"
          trend={metrics.trends.completedRecords}
          color="#9c27b0"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <ChartWidget
          title="Category Distribution"
          type="pie"
          data={metrics.categoryDistribution}
          dataKey="value"
        />
        <ChartWidget
          title="Monthly Trend"
          type="line"
          data={metrics.monthlyTrend}
          dataKey="count"
          xKey="month"
        />
      </div>

      {/* Status Distribution */}
      <div className="charts-grid-single">
        <ChartWidget
          title="Status Distribution"
          type="bar"
          data={metrics.statusDistribution}
          dataKey="value"
          xKey="name"
        />
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <RecentActivity activities={metrics.recentActivity} />
      </div>
    </div>
  );
};

export default Dashboard;
