import db from "./db";

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

// Subscribe to changes in the pending-queue count, e.g. to show a
// "3 changes waiting to sync" badge in the header.
export function onQueueChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function queueCount() {
  return db.outbox.count();
}

export async function queueRequest({ url, method, headers, body }) {
  await db.outbox.add({ url, method, headers, body, createdAt: Date.now() });
  notify();
}

let flushing = false;

// Sends every queued request to the server, in the order they were made.
// Stops at the first failure (e.g. still offline, or server rejected the
// request) so nothing is skipped or sent out of order; it will be retried
// on the next flush trigger (coming back online, app focus, or manual call).
export async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = await db.outbox.orderBy("createdAt").first();
      if (!next) break;

      try {
        const res = await fetch(next.url, {
          method: next.method,
          headers: next.headers,
          body: next.body,
        });
        if (!res.ok && res.status >= 500) {
          // Server-side problem: keep it queued, try again later.
          break;
        }
      } catch (err) {
        // Still offline (or server unreachable): stop, retry later.
        break;
      }

      await db.outbox.delete(next.id);
      notify();
    }
  } finally {
    flushing = false;
  }
}

export function initSync() {
  window.addEventListener("online", flushQueue);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushQueue();
  });
  // Also try once at startup in case we regained connectivity while closed.
  flushQueue();
}
