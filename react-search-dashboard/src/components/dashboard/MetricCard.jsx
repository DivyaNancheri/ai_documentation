import './MetricCard.css';

const MetricCard = ({ title, value, icon, trend, color = '#1976d2' }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.startsWith('+')) return '📈';
    if (trend.startsWith('-')) return '📉';
    return '➡️';
  };

  const getTrendClass = () => {
    if (!trend) return '';
    if (trend.startsWith('+')) return 'trend-up';
    if (trend.startsWith('-')) return 'trend-down';
    return 'trend-neutral';
  };

  return (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <h3 className="metric-title">{title}</h3>
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${getTrendClass()}`}>
          <span>{getTrendIcon()}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
