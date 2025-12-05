// Create client/src/components/ReadingStatusBadge.jsx

import './ReadingStatusBadge.css';

const STATUS_CONFIG = {
  unread: {
    label: 'Unread',
    icon: '📄',
    color: 'gray'
  },
  reading: {
    label: 'Reading',
    icon: '📖',
    color: 'blue'
  },
  read: {
    label: 'Read',
    icon: '✓',
    color: 'green'
  }
};

export default function ReadingStatusBadge({ status = 'unread', size = 'small' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unread;
  
  return (
    <span className={`reading-badge reading-badge-${config.color} reading-badge-${size}`}>
      <span className="reading-badge-icon">{config.icon}</span>
      <span className="reading-badge-label">{config.label}</span>
    </span>
  );
}