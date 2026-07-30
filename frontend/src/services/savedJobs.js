/**
 * Saved jobs, persisted in localStorage.
 *
 * The Save button previously only flipped React state, so a saved job was
 * forgotten the moment you navigated away. There is no saved-jobs table in
 * the backend yet; this keeps the feature honest and per-browser until one
 * exists.
 */

const KEY = 'jobhunter.savedJobs';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[savedJobs] Could not persist:', err);
  }
}

export function getSavedJobs() {
  return read();
}

export function isJobSaved(id) {
  return read().some((job) => String(job.id) === String(id));
}

export function toggleSavedJob(job) {
  const list = read();
  const exists = list.some((item) => String(item.id) === String(job.id));

  const next = exists
    ? list.filter((item) => String(item.id) !== String(job.id))
    : [
        {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          source_url: job.source_url,
          savedAt: new Date().toISOString(),
        },
        ...list,
      ];

  write(next);
  return !exists; // true when it is now saved
}
