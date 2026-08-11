/**
 * Formats a posted date into a friendly relative string like "Posted 2 days ago",
 * "Posted today", or "Posted Aug 10, 2026".
 *
 * @param {string|Date} dateInput - The date string or Date object
 * @returns {string|null} - Formatted relative date string, or null if invalid
 */
export function formatPostedDate(dateInput) {
  if (!dateInput) return null;

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const now = new Date();

  // Normalize to pure midnight dates for accurate day count calculations
  const dToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dPosted = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = dToday.getTime() - dPosted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1 day ago';
  if (diffDays < 30) return `Posted ${diffDays} days ago`;
  if (diffDays < 60) return 'Posted 1 month ago';

  return `Posted ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}
