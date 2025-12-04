import './RecentActivity.css';

const RecentActivity = ({ activities = [] }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) {
      return date.toLocaleDateString();
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      'Search': '🔍',
      'Export': '📤',
      'Filter': '🔽',
      'Update': '✏️',
      'Create': '➕',
      'Delete': '🗑️'
    };
    return icons[action] || '📝';
  };

  return (
    <div className="recent-activity">
      <h3 className="activity-title">Recent Activity</h3>
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="empty-state">No recent activities</div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <span className="activity-icon">{getActionIcon(activity.action)}</span>
              <div className="activity-content">
                <div className="activity-description">{activity.description}</div>
                <div className="activity-meta">
                  <span className="activity-user">{activity.user}</span>
                  <span className="activity-time">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
