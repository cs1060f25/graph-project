// client/src/components/PaperSummary.jsx
// Component for displaying AI-generated paper summaries

import Icon from './Icon';
import './PaperSummary.css';

/**
 * PaperSummary component displays AI-generated summaries with loading and error states
 * @param {Object} props
 * @param {string|null} props.summary - The generated summary text
 * @param {boolean} props.loading - Whether summary is currently being generated
 * @param {string|null} props.error - Error message if generation failed
 */
export default function PaperSummary({ summary, loading, error }) {
  if (loading) {
    return (
      <div className="paper-summary paper-summary-loading">
        <div className="loading-spinner-small"></div>
        <span className="loading-text">Generating AI summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="paper-summary paper-summary-error">
        <Icon name="warning" ariaLabel="Error" />
        <span className="error-text">
          Unable to generate summary at this time. {error}
        </span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="paper-summary paper-summary-empty">
        <span className="empty-text">Summary not available</span>
      </div>
    );
  }

  return (
    <div className="paper-summary paper-summary-content">
      <div className="summary-header">
        <Icon name="star" ariaLabel="AI Summary" />
        <span className="summary-label">AI Summary</span>
      </div>
      <div className="summary-text">{summary}</div>
    </div>
  );
}
