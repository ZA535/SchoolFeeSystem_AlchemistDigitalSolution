import { formatTodayLong, timeGreeting } from '../utils/greeting.js';

export default function WelcomeBanner({ name }) {
  const firstName = name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="welcome-banner no-print">
      <div className="welcome-banner__text">
        <span className="welcome-banner__greeting">
          {timeGreeting()}, {firstName}
        </span>
        <span className="welcome-banner__date">{formatTodayLong()}</span>
      </div>
      <span className="welcome-banner__badge">On duty</span>
    </div>
  );
}