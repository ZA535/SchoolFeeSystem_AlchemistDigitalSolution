import LoadingSpinner from './LoadingSpinner.js';

import { LoadingLabel } from '../enums/labels.js';

export default function LoadingPanel({
  label = LoadingLabel.DATA,
  minHeight = '12rem',
}) {
  return (
    <div
      className="loader-panel"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner label={label} size="lg" />
    </div>
  );
}
