import { GreetingLabel } from '../enums/labels.js';

export function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return GreetingLabel.MORNING;
  if (hour < 17) return GreetingLabel.AFTERNOON;
  return GreetingLabel.EVENING;
}

export function formatTodayLong(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
